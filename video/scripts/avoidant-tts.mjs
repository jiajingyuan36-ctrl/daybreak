// 《回避型依恋》5 幕配音 + 时间轴：FISH_API_KEY=… node scripts/avoidant-tts.mjs [幕号…]
// 1. 按 src/avoidant-script.ts 逐幕调用 Fish Audio（分幕语速、temperature/top_p 0.7），输出 public/audio/avoid_N.mp3
// 2. ffprobe 读时长；silencedetect 找停顿，把每幕 4 句字幕的切换点对到最近的停顿上
// 3. 写 src/avoidant-timeline.json（Composition 只读这个文件算帧数）
// 不带幕号＝全部重新生成；带幕号＝只重生成这几幕，其余幕只重新量时间轴。
// 用 curl 发请求：云端环境要走 HTTPS 代理，Node 自带的 fetch 不走代理。
import {spawnSync} from 'node:child_process';
import {writeFileSync,mkdirSync,readFileSync,rmSync,existsSync} from 'node:fs';
import {SCENES,VOICE} from '../src/avoidant-script.ts';
const KEY=process.env.FISH_API_KEY,MODEL=process.env.FISH_MODEL||'s2.1-pro-free';
const only=process.argv.slice(2).map(Number);
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
 // 每个字幕切换点：按字数比例估一个时间，取最近的句中停顿（±0.9s 内），没有就用估计值
 const lens=s.subtitles.map(c=>plain(c.text).length),total=lens.reduce((a,b)=>a+b,0);
 let acc=0;const cuts=[];
 for(let i=0;i<lens.length-1;i++){acc+=lens[i];const est=lead+(trail-lead)*acc/total;
  const best=inner.map(x=>({x,d:Math.abs((x.start+x.end)/2-est)})).filter(o=>o.d<0.9&&(!cuts.length||o.x.end>cuts[cuts.length-1]+0.3)).sort((a,b)=>a.d-b.d)[0];
  cuts.push(best?+best.x.end.toFixed(3):+est.toFixed(3));}
 const starts=[0,...cuts];
 return {id:s.id,audio:s.audio,image:s.image,duration:+dur.toFixed(3),speechStart:+lead.toFixed(3),speechEnd:+trail.toFixed(3),tail:s.tail,
  length:+(dur+s.tail).toFixed(3),cues:s.subtitles.map((c,i)=>({from:starts[i],to:i<starts.length-1?starts[i+1]:+(dur+s.tail).toFixed(3)}))};};
for(const s of SCENES){if(!only.length||only.includes(s.id))tts(s);}
const scenes=SCENES.map(measure);
const timeline={fps:30,crossfadeFrames:12,generated:new Date().toISOString().slice(0,10),model:MODEL,total:+scenes.reduce((a,s)=>a+s.length,0).toFixed(3),scenes};
writeFileSync('src/avoidant-timeline.json',JSON.stringify(timeline,null,1));
for(const s of scenes)console.log(`第 ${s.id} 幕 ${s.duration}s + ${s.tail}s；字幕切换 ${s.cues.slice(1).map(c=>c.from).join(' / ')}`);
console.log('全片',timeline.total,'秒');
