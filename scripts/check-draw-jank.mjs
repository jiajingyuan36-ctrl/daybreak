// 检查抽牌动画不卡（2026-11-17 用户反馈「抽卡动画有点卡顿感」之后加的）。
// 做法：模拟 iPhone 13，CPU 降速 4 倍和 6 倍（接近中低端手机），点「抽一张」和走一遍牌扇选牌，
// 用 Long Animation Frame 记录每一帧主线程被占了多久，对照 draw-motion.ts 打的标记判断：
//   · 点下去那一帧（动画还没开始）里网站自己的处理（脚本 + 样式与布局）不超过 TAP_MS：太久就是「点了没反应」。
//     不用整帧时长：整帧还包括测试浏览器降速后的绘制，同一份代码前后能差一倍（2026-11-20 量过）
//   · 浮层上浮期间（draw:cover-start → draw:cover-end）允许整页渲染，这时 transform 动画在合成线程上跑，不掉帧；
//     但浮层的上浮如果在渲染结束前就放完了（draw:cover-overrun），画面会停住，判失败
//   · 其余时间（飞向大牌、翻面、文字浮现）任何一帧不超过 FRAME_MS
// 用法：先 npm run build，再
//   node scripts/check-draw-jank.mjs            （自己在 dist/ 起一个静态服务）
//   node scripts/check-draw-jank.mjs http://localhost:4173
// 需要 Playwright（npm i --no-save playwright）。
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {extname,join,normalize} from 'node:path';
let pw;try{pw=await import('playwright')}catch{pw=createRequire(import.meta.url)('playwright')}
const {chromium,devices}=pw;
const TAP_MS={4:90,6:130},FRAME_MS={4:70,6:100};
let base=process.argv[2],server;
if(!base){
 const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.webmanifest':'application/manifest+json','.txt':'text/plain'};
 server=createServer(async(req,res)=>{let p=normalize(decodeURIComponent(new URL(req.url,'http://x').pathname)).replace(/^(\.\.[/\\])+/,'');let f=join('dist',p);
  try{if((await stat(f)).isDirectory())f=join(f,'index.html')}catch{if(!extname(f))f+='.html'}
  try{const b=await readFile(f);res.writeHead(200,{'content-type':types[extname(f)]||'application/octet-stream'});res.end(b)}catch{res.writeHead(404);res.end()}});
 await new Promise(r=>server.listen(0,r));base=`http://localhost:${server.address().port}`}

const browser=await chromium.launch({args:['--enable-blink-features=LongAnimationFrameTiming']});let failed=0;
async function run(mode,rate){
 const ctx=await browser.newContext({...devices['iPhone 13'],colorScheme:'dark'});
 await ctx.addInitScript(()=>{try{localStorage.setItem('umami.disabled','1')}catch{}});
 const page=await ctx.newPage();const cdp=await ctx.newCDPSession(page);
 await page.goto(base+'/ritual/',{waitUntil:'load'});await page.waitForTimeout(1500);
 if(mode==='fan'){
  // 牌扇：长按牌堆洗牌 → 再按一次切牌 → 等牌扇展开
  await page.focus('.deck-pile');await page.keyboard.down('Enter');await page.waitForTimeout(2300);await page.keyboard.up('Enter');
  for(let i=0;i<20;i++){const s=await page.$eval('.ritual-scene',e=>e.dataset.stage);if(s==='cut'){await page.keyboard.press('Enter')}if(s==='pick')break;await page.waitForTimeout(300)}
  if(await page.$eval('.ritual-scene',e=>e.dataset.stage)!=='pick'){await ctx.close();return {mode,rate,skip:'没走到选牌这一步'}}
  await page.waitForTimeout(900)}
 await cdp.send('Emulation.setCPUThrottlingRate',{rate});
 await page.evaluate(()=>{window.__loaf=[];performance.clearMarks();
  new PerformanceObserver(l=>l.getEntries().forEach(e=>window.__loaf.push({s:e.startTime,d:e.duration,work:e.scripts.reduce((t,x)=>t+x.duration,0)+(e.styleAndLayoutStart?e.startTime+e.duration-e.styleAndLayoutStart:0)}))).observe({type:'long-animation-frame'})});
 const t0=await page.evaluate(()=>performance.now());
 if(mode==='fan'){const box=await page.locator('.fan-card').nth(6).boundingBox();await page.mouse.click(box.x+box.width/2,box.y+box.height/2)}
 else await page.click('button.draw');
 await page.waitForFunction(()=>performance.getEntriesByName('draw:reveal-end').length>0,null,{timeout:15000});await page.waitForTimeout(600);
 const r=await page.evaluate(()=>{const m=n=>performance.getEntriesByName(n)[0]?.startTime;return {loaf:window.__loaf,start:m('draw:cover-start'),end:m('draw:cover-end'),over:!!m('draw:cover-overrun')}});
 await ctx.close();
 const bad=[];let tap=0;
 for(const f of r.loaf){if(f.s<t0-5)continue;
  if(r.start!==undefined&&f.s<r.start&&f.s+f.d>=r.start){tap=Math.max(tap,f.work);if(f.work>TAP_MS[rate])bad.push(`点下去那一帧的处理 ${Math.round(f.work)}ms`);continue}
  if(r.start!==undefined&&r.end!==undefined&&f.s>=r.start&&f.s<=r.end)continue;
  if(f.d>FRAME_MS[rate])bad.push(`${Math.round(f.s-t0)}ms 处一帧 ${Math.round(f.d)}ms`)}
 if(r.start===undefined||r.end===undefined)bad.push('没有记录到浮层标记（draw-motion.ts 的 mark 被删了？）');
 if(r.over)bad.push('浮层上浮放完了，渲染还没结束（画面会停住）');
 return {mode,rate,tap:Math.round(tap),cover:r.end!==undefined&&r.start!==undefined?Math.round(r.end-r.start):null,bad}}

// 每种情况跑 3 次取中位数：单次测量会有几十毫秒的抖动，真退化了 3 次都会超
for(const rate of [4,6])for(const mode of ['quick','fan']){
 const runs=[];for(let i=0;i<3;i++)runs.push(await run(mode,rate));
 const r=runs.filter(x=>!x.skip).sort((a,b)=>a.tap-b.tap)[1]??runs[0];
 if(r.skip){console.log(`${mode} ×${rate}：跳过（${r.skip}）`);continue}
 console.log(`${mode==='fan'?'牌扇选牌':'直接抽一张'} ×${rate}：点击处理 ${r.tap}ms，浮层掩护 ${r.cover}ms，${r.bad.length?'不通过：'+r.bad.join('；'):'通过'}`);
 if(r.bad.length)failed++}
await browser.close();server?.close();
if(failed){console.error(`${failed} 项没通过`);process.exit(1)}else console.log('全部通过');
