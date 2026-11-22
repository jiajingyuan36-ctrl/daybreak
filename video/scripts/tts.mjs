// 分幕配音 + 时间轴（各条视频共用）：FISH_API_KEY=… node scripts/tts.mjs <项目> [幕号…]
// 项目名对应 src/<项目>-script.ts（导出 SCENES、VOICE），如 avoidant、stayup。npm run tts -- stayup 同理。
// 1. 逐幕调用 Fish Audio（分幕语速、temperature/top_p 0.7），输出到每幕 audio 字段写的路径
// 2. ffprobe 读时长；silencedetect 找停顿，把每幕各句字幕的切换点对到最近的停顿上
// 3. 写 src/<项目>-timeline.json（Composition 只读这个文件算帧数）
// 只生成缺失的配音；带幕号＝重生成这几幕；带 --all＝全部重生成。其余幕只重新量时间轴（不需要 Key）。
// 用 curl 发请求：云端环境要走 HTTPS 代理，Node 自带的 fetch 不走代理。
import {spawnSync} from 'node:child_process';
import {writeFileSync,mkdirSync,readFileSync,rmSync,existsSync} from 'node:fs';
const NAME=process.argv[2];
if(!NAME||!existsSync(`src/${NAME}-script.ts`)){console.error('用法：node scripts/tts.mjs <项目> [幕号…]，项目对应 src/<项目>-script.ts');process.exit(1)}
const {SCENES,VOICE}=await import(`../src/${NAME}-script.ts`);
const KEY=process.env.FISH_API_KEY,MODEL=process.env.FISH_MODEL||'s2.1-pro-free';
const args=process.argv.slice(3),all=args.includes('--all'),only=args.filter(a=>a!=='--all').map(Number);
mkdirSync('public/audio',{recursive:true});
const tts=(s)=>{if(!KEY){console.error('缺少 FISH_API_KEY');process.exit(1)}
 const out='public/'+s.audio,body='.tts-body.json';
 writeFileSync(body,JSON.stringify({text:s.narration,reference_id:VOICE,format:'mp3',mp3_bitrate:192,normalize:true,temperature:0.7,top_p:0.7,prosody:{speed:s.speed,volume:0}}));
 const r=spawnSync('curl',['-sS','-X','POST','https://api.fish.audio/v1/tts','-H',`Authorization: Bearer ${KEY}`,'-H','Content-Type: application/json','-H',`model: ${MODEL}`,'--data-binary','@'+body,'-o',out,'-w','%{http_code} %{content_type}'],{encoding:'utf8'});
 rmSync(body);const [code,type]=(r.stdout||'').split(' ');
 if(code!=='200'||!String(type).includes('audio')){console.error(`第 ${s.id} 幕失败`,code,type,r.stderr,existsSync(out)?readFileSync(out,'utf8').slice(0,300):'');rmSync(out,{force:true});process.exit(1)}
 console.log(`第 ${s.id} 幕配音 → ${out}`);};
const plain=(t)=>t.replace(/[，。、：；？！「」——\s]/g,'');
const measure=(s)=>{const f='public/'+s.audio;
 const err=spawnSync('ffmpeg',['-i',f,'-af','silencedetect=noise=-38dB:d=0.06','-f','null','-'],{encoding:'utf8'}).stderr;
 const dur=Number(spawnSync('ffprobe',['-v','error','-show_entries','format=duration','-of','csv=p=0',f],{encoding:'utf8'}).stdout.trim());
 const sil=[...err.matchAll(/silence_end: ([\d.]+) \| silence_duration: ([\d.]+)/g)].map(m=>({end:+m[1],start:+m[1]-+m[2]}));
 const lead=sil.find(x=>x.start<0.02)?.end??0;const trail=sil.find(x=>x.end>dur-0.05&&x.start>dur-1)?.start??dur;
 const inner=sil.filter(x=>x.start>lead+0.1&&x.end<trail-0.1);
 // 字幕切换点：整幕一起求解。候选＝句中停顿的结束处 + 按字数比例的估计点；
 // 每句至少 max(0.45s, 每字 0.11s)，代价＝离估计点的距离，不落在停顿上再加 1（尽量落在真实停顿上）。
 const lens=s.subtitles.map(c=>plain(c.text).length),total=lens.reduce((a,b)=>a+b,0);
 // 估计点按「有声时间」分配字数：先扣掉句中停顿，再把字数比例换回真实时间
 const gaps=inner.map(x=>[x.start,x.end]);const voiced=(trail-lead)-gaps.reduce((a,[x,y])=>a+(y-x),0);
 const at=(v)=>{let t=lead,left=v;for(const [x,y] of gaps){if(left<=x-t)return t+left;left-=x-t;t=y;}return t+left;};
 const est=[];let acc=0;for(let i=0;i<lens.length-1;i++){acc+=lens[i];est.push(at(voiced*acc/total));}
 const cands=[...inner.map(x=>({t:x.end,sil:true})),...est.flatMap(t=>[-4,-3,-2,-1,0,1,2,3,4].map(k=>({t:t+k*.1,sil:false})))].filter(c=>c.t>lead&&c.t<trail).sort((a,b)=>a.t-b.t);
 const minLen=(i)=>Math.max(.45,lens[i]*.11);
 // dp[i][j]：第 i 个切换点选候选 j 的最小代价
 const K=est.length,INF=1e9;const dp=Array.from({length:K},()=>cands.map(()=>INF)),from=Array.from({length:K},()=>cands.map(()=>-1));
 cands.forEach((c,j)=>{if(c.t-lead>=minLen(0))dp[0][j]=Math.abs(c.t-est[0])+(c.sil?0:1)});
 for(let i=1;i<K;i++)cands.forEach((c,j)=>{cands.forEach((p,q)=>{if(dp[i-1][q]<INF&&c.t-p.t>=minLen(i)){const v=dp[i-1][q]+Math.abs(c.t-est[i])+(c.sil?0:1);if(v<dp[i][j]){dp[i][j]=v;from[i][j]=q}}})});
 let j=-1,best=INF;cands.forEach((c,q)=>{if(K&&dp[K-1][q]<best&&trail-c.t>=minLen(K)){best=dp[K-1][q];j=q}});
 const cuts=[];for(let i=K-1;i>=0&&j>=0;i--){cuts.unshift(+cands[j].t.toFixed(3));j=from[i][j];}
 if(cuts.length!==K){cuts.length=0;est.forEach(t=>cuts.push(+t.toFixed(3)));}
 const starts=[0,...cuts];
 return {id:s.id,audio:s.audio,image:s.image,duration:+dur.toFixed(3),speechStart:+lead.toFixed(3),speechEnd:+trail.toFixed(3),tail:s.tail,
  length:+(dur+s.tail).toFixed(3),cues:s.subtitles.map((c,i)=>({from:starts[i],to:i<starts.length-1?starts[i+1]:+(dur+s.tail).toFixed(3)}))};};
for(const s of SCENES){if(all||only.includes(s.id)||!existsSync('public/'+s.audio))tts(s);}
const scenes=SCENES.map(measure);
const timeline={fps:30,crossfadeFrames:12,generated:new Date().toISOString().slice(0,10),model:MODEL,total:+scenes.reduce((a,s)=>a+s.length,0).toFixed(3),scenes};
writeFileSync(`src/${NAME}-timeline.json`,JSON.stringify(timeline,null,1));
for(const s of scenes)console.log(`第 ${s.id} 幕 ${s.duration}s + ${s.tail}s；字幕切换 ${s.cues.slice(1).map(c=>c.from).join(' / ')}`);
console.log('全片',timeline.total,'秒');
