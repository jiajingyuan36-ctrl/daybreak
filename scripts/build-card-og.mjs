// 生成 78 张牌各自的分享预览图（1200×630），存到 public/og/cards/<id>.jpg，随网站一起发布。
// 这是本地工具，Render 构建时不运行。改了牌名、关键词或版式后重新生成：
//   npm run build && npx serve dist -l 4173   （另开一个终端）
//   node scripts/build-card-og.mjs            （需要能 require('playwright')）
// 风格沿用 public/og-brand.png：深色底、细金框、左边 1909 年原版牌面、右边衬线大字。
import {readFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const BASE=process.env.OG_BASE||'http://localhost:4173';
const OUT='public/og/cards';
const SUIT={cups:'圣杯',wands:'权杖',swords:'宝剑',pentacles:'星币'};
const cards=JSON.parse(await readFile('src/data/tarot_cards_78.json','utf8'));
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const group=c=>c.arcana==='major'?`大阿卡纳 · ${String(c.number).padStart(2,'0')}`:`小阿卡纳 · ${SUIT[c.suit]}`;

const page=c=>`<!doctype html><html><head><meta charset="utf-8"><base href="${BASE}/">
<link rel="stylesheet" href="/fonts/serif-sc.css">
<style>
*{margin:0;box-sizing:border-box}
html,body{width:1200px;height:630px;overflow:hidden}
body{position:relative;background:radial-gradient(760px 520px at 24% 50%,#1d1b20 0%,#121214 60%,#0e0e10 100%);color:#EDE6D8;font-family:DaybreakSerif,serif}
.frame{position:absolute;inset:30px;border:1px solid rgba(197,165,110,.42)}
.ring{position:absolute;left:228px;top:315px;width:340px;height:340px;margin:-170px 0 0 -170px;border:1px solid rgba(197,165,110,.16);border-radius:50%}
.ring.b{width:300px;height:300px;margin:-150px 0 0 -150px;border-style:dashed;border-color:rgba(197,165,110,.12)}
.card{position:absolute;left:108px;top:108px;width:240px;height:412px;padding:7px;background:#F1E9D8;border-radius:5px;box-shadow:0 18px 40px rgba(0,0,0,.55),0 0 0 1px rgba(197,165,110,.55)}
.card img{display:block;width:100%;height:100%;object-fit:cover;border-radius:2px}
.meteor{position:absolute;right:120px;top:74px;width:86px;height:1px;background:linear-gradient(90deg,rgba(197,165,110,0),rgba(197,165,110,.8));transform:rotate(-28deg);transform-origin:right}
.meteor::after{content:'';position:absolute;right:-3px;top:-3px;width:7px;height:7px;background:#C5A56E;transform:rotate(45deg);border-radius:1px}
.text{position:absolute;left:436px;top:118px;right:80px}
.brand{font-size:24px;letter-spacing:.06em;color:#C5A56E}
.brand span{font-size:17px;letter-spacing:.22em;margin-left:8px}
.group{margin-top:26px;font-size:20px;letter-spacing:.24em;color:rgba(237,230,216,.62)}
h1{margin-top:6px;font-size:100px;font-weight:400;line-height:1.12;letter-spacing:.06em;color:#F3EDE1;white-space:nowrap}
h1.long{font-size:84px}
.en{margin-top:2px;font-size:24px;font-style:italic;letter-spacing:.06em;color:rgba(237,230,216,.6)}
.keys{margin-top:20px;font-size:25px;letter-spacing:.14em;color:#E2D7C1}
.keys i{font-style:normal;color:#C5A56E;margin:0 .5em}
.cta{position:absolute;left:436px;right:80px;bottom:74px;display:flex;align-items:baseline;justify-content:space-between;padding-top:18px;border-top:1px solid rgba(197,165,110,.3)}
.cta b{font-weight:400;font-size:27px;letter-spacing:.08em;color:#F3EDE1}
.cta span{font-size:20px;letter-spacing:.06em;color:#C5A56E}
</style></head><body>
<div class="frame"></div><div class="ring"></div><div class="ring b"></div><div class="meteor"></div>
<div class="card"><img src="/rws/${c.id}.webp" alt=""></div>
<div class="text">
 <p class="brand">晨启塔罗<span>· DAYBREAK</span></p>
 <p class="group">${esc(group(c))}</p>
 <h1${[...c.name_zh].length>4?' class="long"':''}>${esc(c.name_zh)}</h1>
 <p class="en">${esc(c.name_en)}</p>
 <p class="keys">${c.upright.keywords.map(esc).join('<i>·</i>')}</p>
</div>
<div class="cta"><b>今天，你会抽到哪一张？</b><span>✦ 免费抽一张 · daybreaktarot.xyz</span></div>
</body></html>`;

await mkdir(OUT,{recursive:true});
const browser=await chromium.launch();
const ctx=await browser.newContext({viewport:{width:1200,height:630},deviceScaleFactor:1});
const tab=await ctx.newPage();
// 先打开网站上的一个文件，让模板和字体同源；否则字体按跨域请求被拒，截到的是后备黑体
await tab.goto(`${BASE}/robots.txt`);
const only=process.argv.slice(2);
for(const c of cards){
 if(only.length&&!only.includes(c.id))continue;
 await tab.setContent(page(c),{waitUntil:'networkidle'});
 // 字体按需下载：先按页面上的全部文字把两个字体子集都加载好，再截图，避免截到后备黑体
 await tab.evaluate(async()=>{const t=document.body.innerText;await Promise.all(['400 100px DaybreakSerif','italic 24px DaybreakSerif'].map(f=>document.fonts.load(f,t)));await document.fonts.ready});
 await tab.waitForTimeout(150);
 await tab.screenshot({path:`${OUT}/${c.id}.jpg`,type:'jpeg',quality:84});
}
await browser.close();
console.log(`card share images ready: ${OUT}/ (${only.length||cards.length})`);
