// 「读一张牌」系列：一集一个 JSON，一条命令出片。
//   node --experimental-strip-types video-series/render.mjs video-series/episodes/01-magician.json [--preview 3,12,30]
// 需要：Playwright（环境里已预装 Chromium）、ffmpeg、配音环境（见 README）。
// 输出到 video-series/out/<集名>/：成片 mp4、封面 jpg、字幕 srt、发布文案 md。
import {readFileSync,writeFileSync,mkdirSync,existsSync,createReadStream,statSync} from 'node:fs';
import {spawn,spawnSync} from 'node:child_process';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {basename,dirname,extname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {lint} from './lint.mjs';

const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const HERE=dirname(fileURLToPath(import.meta.url)),ROOT=resolve(HERE,'..');
const epPath=resolve(process.argv[2]||'');
if(!existsSync(epPath))throw Error('用法：render.mjs <episodes/xx.json> [--preview 秒,秒]');
const previewArg=process.argv.includes('--preview')?process.argv[process.argv.indexOf('--preview')+1]:null; // 秒,秒… 或 mid（每段 70% 处各一帧）
const EP=JSON.parse(readFileSync(epPath,'utf8'));
const slug=basename(epPath,'.json'),OUT=join(HERE,'out',slug),VO=join(OUT,'voice');mkdirSync(VO,{recursive:true});
const FPS=30,TTS_PY=process.env.TTS_PY,TTS_MODEL=process.env.TTS_MODEL,VOICE=process.env.TTS_SID||'3',SPEED=process.env.TTS_SPEED||'1.0';

// 1. 审核用词检查
const hits=lint(EP);if(hits.length){console.error('审核用词检查没通过：\n'+hits.join('\n'));process.exit(1)}
console.log('✓ 审核用词检查通过');

// 2. 配音（按旁白文本缓存，改了哪句只重配哪句）
const lines=EP.segments.filter(s=>s.say).map(s=>({id:s.id,text:s.say}));
const cacheKey=JSON.stringify({lines,VOICE,SPEED}),keyFile=join(VO,'key.json');
let dur={};
if(existsSync(keyFile)&&readFileSync(keyFile,'utf8')===cacheKey)dur=JSON.parse(readFileSync(join(VO,'durations.json'),'utf8'));
else if(TTS_PY&&TTS_MODEL){writeFileSync(join(VO,'in.json'),JSON.stringify(lines));
 const r=spawnSync(TTS_PY,[join(HERE,'tts.py'),TTS_MODEL,join(VO,'in.json'),VO,VOICE,SPEED],{stdio:'inherit'});if(r.status)process.exit(r.status);
 writeFileSync(keyFile,cacheKey);dur=JSON.parse(readFileSync(join(VO,'durations.json'),'utf8'))}
else{console.warn('! 没有配置 TTS_PY / TTS_MODEL，按字数估算时长，出无旁白版');for(const l of lines)dur[l.id]=l.text.length/4.6}
const voiced=Object.keys(dur).length>0&&existsSync(join(VO,lines[0].id+'.wav'));

// 3. 时间轴：每段 = 画面引导 + 旁白 + 留白
const LEAD={hook:2.9,promo:1.0},TAIL={promo:2.2,quote:.9,summary:.7};
let t=0;const TL=EP.segments.map(s=>{const lead=LEAD[s.scene]??.4,tail=TAIL[s.scene]??TAIL[s.id]??.45;const seg={...s,start:t,voiceAt:t+lead,end:t+lead+(dur[s.id]||1.2)+tail};t=seg.end;return seg});
const DURATION=t;const preview=previewArg==='mid'?TL.map(x=>+(x.start+(x.end-x.start)*.7).toFixed(1)):previewArg?previewArg.split(',').map(Number):null;console.log(`时长 ${DURATION.toFixed(1)} 秒，${TL.length} 段`);

// 4. 网站同款牌背
const {cardBack}=await import(join(ROOT,'src/card-back.ts'));const BACK=cardBack();

// 5. 本地静态服务（仓库根目录），供模板读牌面图
const MIME={'.html':'text/html; charset=utf-8','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.js':'text/javascript'};
const server=createServer((q,r)=>{const f=join(ROOT,decodeURIComponent(q.url.split('?')[0]));if(!f.startsWith(ROOT)||!existsSync(f)||statSync(f).isDirectory()){r.writeHead(404);return r.end()}r.writeHead(200,{'content-type':MIME[extname(f)]||'application/octet-stream'});createReadStream(f).pipe(r)});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const PORT=server.address().port;

const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});
page.on('pageerror',e=>console.error('页面错误',e.message));
await page.goto(`http://127.0.0.1:${PORT}/video-series/template/index.html`,{waitUntil:'networkidle'});
await page.evaluate(([ep,tl,back])=>window.init(ep,tl,back),[EP,TL,BACK]);

if(preview){for(const s of preview){await page.evaluate(s=>render(s),s);await page.screenshot({path:join(OUT,`preview-${s}.png`)})}console.log('预览帧已写入',OUT,preview.join(','))}
else{
 // 6. 逐帧渲染 → H.264
 const silent=join(OUT,'_silent.mp4'),n=Math.round(DURATION*FPS);
 const ff=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate',String(FPS),'-c:v','mjpeg','-i','-','-c:v','libx264','-preset','slow','-crf','18','-pix_fmt','yuv420p','-r',String(FPS),silent],{stdio:['pipe','inherit','inherit']});
 for(let i=0;i<n;i++){await page.evaluate(x=>render(x),i/FPS);const b=await page.screenshot({type:'jpeg',quality:94});if(!ff.stdin.write(b))await new Promise(r=>ff.stdin.once('drain',r));if(i%300===0)console.log(`帧 ${i}/${n}`)}
 ff.stdin.end();await new Promise(r=>ff.on('close',r));
 // 7. 封面：开场钩子字幕完全出现时
 const hook=TL[0];await page.evaluate(x=>render(x),hook.end-.4);await page.screenshot({path:join(OUT,'cover.jpg'),type:'jpeg',quality:92});
 // 8. 混音：旁白按时间轴放置 + 程序合成的环境音底（无版权素材）
 const pad=`aevalsrc='0.20*sin(2*PI*73.42*t)*(0.75+0.25*sin(2*PI*0.07*t))+0.14*sin(2*PI*146.83*t)*(0.7+0.3*sin(2*PI*0.11*t+1))+0.10*sin(2*PI*220*t)*(0.6+0.4*sin(2*PI*0.09*t+2))+0.07*sin(2*PI*277.18*t)*(0.5+0.5*sin(2*PI*0.05*t+3))+0.05*sin(2*PI*329.63*t)*(0.5+0.5*sin(2*PI*0.13*t+0.5))':s=48000:d=${DURATION.toFixed(2)}`;
 const args=['-y','-loglevel','error','-i',silent,'-f','lavfi','-i',pad];let fc='[1:a]lowpass=f=1600,aecho=0.8:0.7:120|260:0.25|0.15,volume=0.32,afade=t=in:d=2.5,afade=t=out:st='+(DURATION-3).toFixed(2)+':d=3[bg];',mix='[bg]';
 if(voiced){TL.filter(s=>s.say).forEach((s,k)=>{args.push('-i',join(VO,s.id+'.wav'));const ms=Math.round(s.voiceAt*1000);fc+=`[${k+2}:a]aresample=48000,adelay=${ms}|${ms},pan=stereo|c0=c0|c1=c0[v${k}];`;mix+=`[v${k}]`});
  fc+=`${mix}amix=inputs=${TL.filter(s=>s.say).length+1}:normalize=0,loudnorm=I=-16:TP=-1.5[a]`}else fc+='[bg]loudnorm=I=-20:TP=-2[a]';
 args.push('-filter_complex',fc,'-map','0:v','-map','[a]','-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-shortest','-movflags','+faststart',join(OUT,`${slug}.mp4`));
 const m=spawnSync('ffmpeg',args,{stdio:'inherit'});if(m.status)process.exit(m.status);
 // 9. 字幕与发布文案
 const ts=x=>{const h=Math.floor(x/3600),mi=Math.floor(x/60)%60,se=Math.floor(x)%60,ms=Math.round((x%1)*1000);return `${String(h).padStart(2,'0')}:${String(mi).padStart(2,'0')}:${String(se).padStart(2,'0')},${String(ms).padStart(3,'0')}`};
 writeFileSync(join(OUT,`${slug}.srt`),TL.filter(s=>s.say).map((s,i)=>`${i+1}\n${ts(s.voiceAt)} --> ${ts(s.end-.1)}\n${s.say}\n`).join('\n'));
 const P=EP.publish;writeFileSync(join(OUT,'文案.md'),`# 读一张牌 No.${String(EP.no).padStart(2,'0')} · ${EP.nameZh}\n\n时长：${DURATION.toFixed(0)} 秒 · 1080×1920 · 30fps\n\n## 标题\n${P.title}\n\n## 作品描述\n${P.desc}\n\n${P.tags.map(t=>'#'+t).join(' ')}\n\n## 旁白稿\n${TL.filter(s=>s.say).map(s=>`- [${s.voiceAt.toFixed(1)}s] ${s.say}`).join('\n')}\n\n## 发布前检查\n- 作品声明勾选「内容由 AI 生成」（旁白为 AI 配音，脚本与画面由 AI 辅助制作）\n- 描述、评论区不放网址、二维码、联系方式；不写「准」「测一测」「运势」\n- 话题不用 #占卜 #塔罗占卜 #星座运势\n`);
 console.log('✓ 成片：',join(OUT,`${slug}.mp4`));
}
await browser.close();server.close();
