// 「读一张牌」系列：一集一个 JSON，一条命令出片。
//   node --experimental-strip-types video-series/render.mjs video-series/episodes/01-magician.json [--preview 3,12,30]
// 需要：Playwright（环境里已预装 Chromium）、ffmpeg、配音环境（见 README）。
// 输出到 video-series/out/<集名>/：成片 mp4、封面 jpg、字幕 srt、发布文案 md。
import {readFileSync,writeFileSync,mkdirSync,existsSync,createReadStream,statSync,rmSync} from 'node:fs';
import {spawn,spawnSync} from 'node:child_process';
import {once} from 'node:events';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {basename,dirname,extname,join,resolve,sep} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {lint,STORY_COPY} from './lint.mjs';

const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const HERE=dirname(fileURLToPath(import.meta.url)),ROOT=resolve(HERE,'..');
const epPath=resolve(process.argv[2]||'');
if(!existsSync(epPath))throw Error('用法：render.mjs <episodes/xx.json> [--preview 秒,秒]');
const previewArg=process.argv.includes('--preview')?process.argv[process.argv.indexOf('--preview')+1]:null; // 秒,秒… 或 mid（每段 70% 处各一帧）
const EP=JSON.parse(readFileSync(epPath,'utf8'));
const story=EP.series==='story', ffmpeg=process.env.FFMPEG_PATH || 'ffmpeg';
const slug=basename(epPath,'.json'),OUT=join(HERE,'out',slug),VO=join(OUT,'voice');mkdirSync(VO,{recursive:true});
const FPS=30,TTS_PY=process.env.TTS_PY,TTS_MODEL=process.env.TTS_MODEL,VOICE=process.env.TTS_SID||'3',SPEED=process.env.TTS_SPEED||'1.0';

// 1. 审核用词检查
const hits=lint(EP);if(hits.length){console.error('审核用词检查没通过：\n'+hits.join('\n'));process.exit(1)}
if(story){
 const safeCards=['m0','m1','m2','m8','m9','m10','m11','m14','m18'];
 if(!safeCards.includes(EP.card))throw Error('故事系列主牌必须在画面安全清单内');
 if(EP.segments.filter(s=>s.scene==='glance').length>3)throw Error('每集至多使用三个 glance 镜头');
}
console.log('✓ 审核用词检查通过');

// 2. 复用同一旁白稿与配音设置生成的 WAV 文件
const lines=EP.segments.filter(s=>s.say).map(s=>({id:s.id,text:s.say}));
const cacheKey=JSON.stringify({lines,VOICE,SPEED}),keyFile=join(VO,'key.json'),durationFile=join(VO,'durations.json');
let dur={},voiced=false;
if(lines.length&&existsSync(keyFile)&&readFileSync(keyFile,'utf8')===cacheKey&&existsSync(durationFile)&&lines.every(l=>existsSync(join(VO,l.id+'.wav')))){
 dur=JSON.parse(readFileSync(durationFile,'utf8'));voiced=true;
}else if(lines.length&&TTS_PY&&TTS_MODEL){writeFileSync(join(VO,'in.json'),JSON.stringify(lines));
 rmSync(keyFile,{force:true});
 const r=spawnSync(TTS_PY,[join(HERE,'tts.py'),TTS_MODEL,join(VO,'in.json'),VO,VOICE,SPEED],{stdio:'inherit'});
 if(r.error||r.status!==0)throw r.error??Error('配音失败');
 dur=JSON.parse(readFileSync(durationFile,'utf8'));writeFileSync(keyFile,cacheKey);voiced=true;
}
else{console.warn('! 没有配置 TTS_PY / TTS_MODEL，按字数估算时长，出无旁白版');for(const l of lines)dur[l.id]=l.text.length/4.6}

// 3. 时间轴：每段 = 画面引导 + 旁白 + 留白
const LEAD=story?{hook:.62,promo:.8}:{hook:2.9,promo:1.0},TAIL={promo:2.2,quote:.9,summary:.7};
let t=0;const TL=EP.segments.map(s=>{
 const lead=LEAD[s.scene]??.4,tail=TAIL[s.scene]??TAIL[s.id]??.45;
 const voiceAt=t+lead,voiceEnd=voiceAt+(dur[s.id]||1.2);
 const end=story?Math.ceil((voiceEnd+tail)*FPS)/FPS:voiceEnd+tail;
 const seg={...s,start:t,voiceAt,voiceEnd,end};
 t=seg.end;return seg;
});
const DURATION=t;
const preview=previewArg==='mid'
 ?TL.map(s=>story?(s.start+s.end)/2:+(s.start+(s.end-s.start)*.7).toFixed(1))
 :previewArg?previewArg.split(',').map(Number):null;
console.log(`时长 ${DURATION.toFixed(1)} 秒，${TL.length} 段`);

// 4. 网站同款牌背
const {cardBack}=await import(pathToFileURL(join(ROOT,'src/card-back.ts')).href);const BACK=cardBack();

// 5. 本地静态服务（仓库根目录），供模板读牌面图
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.js':'text/javascript'};
const server=createServer((q,r)=>{const f=join(ROOT,decodeURIComponent(q.url.split('?')[0]));if(!f.startsWith(ROOT+sep)||!existsSync(f)||statSync(f).isDirectory()){r.writeHead(404);return r.end()}r.writeHead(200,{'content-type':MIME[extname(f)]||'application/octet-stream'});createReadStream(f).pipe(r)});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const PORT=server.address().port;

const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH});
try{
const page=await browser.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});
page.on('pageerror',e=>console.error('页面错误',e.message));
await page.goto(`http://127.0.0.1:${PORT}/video-series/template/index.html`,{waitUntil:'networkidle'});
await page.evaluate(([ep,tl,back,copy])=>window.init(ep,tl,back,copy),[EP,TL,BACK,STORY_COPY]);

function runFFmpeg(args){
 const result=spawnSync(ffmpeg,args,{stdio:'inherit'});
 if(result.error||result.status!==0)throw result.error??Error(`FFmpeg 退出：${result.status}`);
}

if(preview){
 const sheet=story&&previewArg==='mid';
 for(const [i,s] of preview.entries()){
  await page.evaluate(s=>render(s),s);
  const name=sheet?String(i+1).padStart(2,'0'):String(s);
  await page.screenshot({path:join(OUT,`preview-${name}.png`)});
 }
 if(sheet){
  const rows=Math.ceil(preview.length/4);
  runFFmpeg(['-y','-loglevel','error','-framerate','1','-i',join(OUT,'preview-%02d.png'),
   '-vf',`scale=240:426:flags=lanczos,tile=4x${rows}:nb_frames=${preview.length}:padding=8:margin=8:color=0x0B0A0E`,
   '-frames:v','1',join(OUT,'sheet.png')]);
 }
 console.log('预览帧已写入',OUT,preview.map(s=>s.toFixed(2)).join(','));
}
else{
 // 6. 逐帧渲染 → H.264
 const silent=join(OUT,'_silent.mp4'),n=Math.round(DURATION*FPS);
 const ff=spawn(ffmpeg,['-y','-loglevel','error','-f','image2pipe','-framerate',String(FPS),'-c:v','mjpeg','-i','-','-c:v','libx264','-preset',story?'fast':'slow','-crf','18','-pix_fmt','yuv420p','-r',String(FPS),silent],{stdio:['pipe','inherit','inherit']});
 ff.stdin.on('error',()=>{}); // 写入回调和子进程退出处理错误
 const closed=once(ff,'close');
 closed.catch(()=>{});
 try{
  await once(ff,'spawn');
  for(let i=0;i<n;i++){
   await page.evaluate(x=>render(x),i/FPS);
   const b=await page.screenshot({type:'jpeg',quality:94});
   await new Promise((done,fail)=>ff.stdin.write(b,error=>error?fail(error):done()));
   if(i%300===0)console.log(`帧 ${i}/${n}`);
  }
  ff.stdin.end();
  const [code]=await closed;
  if(code!==0)throw Error(`视频编码失败：${code}`);
 }finally{
  if(ff.exitCode===null)ff.kill();
 }
 // 7. 封面：开场钩子字幕完全出现时
 const hook=TL[0];await page.evaluate(x=>render(x),hook.end-.4);await page.screenshot({path:join(OUT,'cover.jpg'),type:'jpeg',quality:92});
 // 8. 混音：旁白按时间轴放置 + 程序合成的环境音底（无版权素材）
 const pad=`aevalsrc='0.20*sin(2*PI*73.42*t)*(0.75+0.25*sin(2*PI*0.07*t))+0.14*sin(2*PI*146.83*t)*(0.7+0.3*sin(2*PI*0.11*t+1))+0.10*sin(2*PI*220*t)*(0.6+0.4*sin(2*PI*0.09*t+2))+0.07*sin(2*PI*277.18*t)*(0.5+0.5*sin(2*PI*0.05*t+3))+0.05*sin(2*PI*329.63*t)*(0.5+0.5*sin(2*PI*0.13*t+0.5))':s=48000:d=${DURATION.toFixed(2)}`;
 const args=['-y','-loglevel','error','-i',silent,'-f','lavfi','-i',pad];let fc='[1:a]lowpass=f=1600,aecho=0.8:0.7:120|260:0.25|0.15,volume=0.32,afade=t=in:d=2.5,afade=t=out:st='+(DURATION-3).toFixed(2)+':d=3[bg];',mix='[bg]';
 if(voiced){TL.filter(s=>s.say).forEach((s,k)=>{args.push('-i',join(VO,s.id+'.wav'));const ms=Math.round(s.voiceAt*1000);fc+=`[${k+2}:a]aresample=48000,adelay=${ms}|${ms},pan=stereo|c0=c0|c1=c0[v${k}];`;mix+=`[v${k}]`});
  fc+=`${mix}amix=inputs=${TL.filter(s=>s.say).length+1}:normalize=0,loudnorm=I=-16:TP=-1.5[a]`}else fc+=`[bg]loudnorm=I=${story?-16:-20}:TP=-2[a]`;
 args.push('-filter_complex',fc,'-map','0:v','-map','[a]','-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-shortest','-movflags','+faststart',join(OUT,`${slug}.mp4`));
 runFFmpeg(args);
 // 9. 字幕与发布文案
 const ts=x=>{const ms=Math.round(x*1000);return new Date(ms).toISOString().slice(11,23).replace('.',',')};
 writeFileSync(join(OUT,`${slug}.srt`),TL.filter(s=>s.say).map((s,i)=>`${i+1}\n${ts(s.voiceAt)} --> ${ts(story?s.voiceEnd:s.end-.1)}\n${s.say}\n`).join('\n'));
 const P=EP.publish,series=story?STORY_COPY.series:'读一张牌';
 const audio=voiced?'本地中文 AI 配音 · 程序合成环境音':'程序合成环境音 · 旁白时间为估算';
 writeFileSync(join(OUT,'文案.md'),`# ${series} No.${String(EP.no).padStart(2,'0')} · ${EP.nameZh}\n\n时长 ${DURATION.toFixed(1)} 秒 · 1080×1920 · 30 fps\n\n${audio}\n\n## 标题\n\n${P.title}\n\n## 作品描述\n\n${P.desc}\n\n${P.tags.map(t=>'#'+t).join(' ')}\n\n## 旁白稿\n\n${TL.filter(s=>s.say).map(s=>`- [${s.voiceAt.toFixed(1)}s] ${s.say}`).join('\n')}\n\n## 发布前检查\n\n- [ ] 勾选「内容由 AI 生成」\n- [ ] 检查封面、音量和抖音发布预览\n- [ ] 保持文化与艺术史科普定位，保留片尾说明\n- [ ] 检查作品文字和画面仅保留站内信息\n`);
 rmSync(silent,{force:true});
 console.log('✓ 成片：',join(OUT,`${slug}.mp4`));
}
}finally{
 await browser.close();
 server.close();
}
