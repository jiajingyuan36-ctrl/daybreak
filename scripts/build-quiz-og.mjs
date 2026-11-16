// 性格测试的链接预览图（1200×630）：22 种结果各一张 + 测试入口一张，存到 public/og/quiz/，随网站发布。
// 本地工具，Render 构建时不运行。改了测试文案或版式后重新生成：
//   npm run build && npx serve dist -l 4173   （另开一个终端）
//   node scripts/build-quiz-og.mjs            （需要能 require('playwright')）
// 版式沿用 scripts/build-card-og.mjs；牌面人物没有穿衣服的牌（QUIZ_COVERED）改用牌背。
import {mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const BASE=process.env.OG_BASE||'http://localhost:4173';
const OUT='public/og/quiz';
const {QUIZ_RESULTS,QUIZ_COVERED}=await import('../src/quiz.ts');
const {cardById,roman}=await import('../src/cards.ts');
const {cardBack}=await import('../src/card-back.ts');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const VARS='--cb-bg-a:#17151E;--cb-bg-b:#0B0A0F;--cb-glow:#C5A059;--cb-f0:#7A5C29;--cb-f1:#C5A059;--cb-f2:#FFF2CC;--cb-f3:#D4AF37;--cb-f4:#6B4F22;--cb-hl:#FFF2CC';
const css=`*{margin:0;box-sizing:border-box}html,body{width:1200px;height:630px;overflow:hidden}
body{position:relative;background:radial-gradient(760px 520px at 24% 50%,#1d1b20 0%,#121214 60%,#0e0e10 100%);color:#EDE6D8;font-family:DaybreakSerif,serif;${VARS}}
.frame{position:absolute;inset:30px;border:1px solid rgba(197,165,110,.42)}
.ring{position:absolute;left:228px;top:315px;width:340px;height:340px;margin:-170px 0 0 -170px;border:1px solid rgba(197,165,110,.16);border-radius:50%}
.card{position:absolute;left:108px;top:108px;width:240px;height:412px;padding:7px;background:#F1E9D8;border-radius:5px;box-shadow:0 18px 40px rgba(0,0,0,.55),0 0 0 1px rgba(197,165,110,.55)}
.card.back{padding:0;background:#0B0A0F}.card img,.card svg{display:block;width:100%;height:100%;object-fit:cover;border-radius:2px}
.text{position:absolute;left:436px;top:110px;right:80px}
.brand{font-size:22px;letter-spacing:.08em;color:#C5A56E}.brand span{font-size:16px;letter-spacing:.22em;margin-left:8px}
.kicker{margin-top:28px;font-size:22px;letter-spacing:.3em;color:rgba(237,230,216,.62)}
h1{margin-top:6px;font-size:84px;font-weight:400;line-height:1.15;letter-spacing:.08em;color:#F3EDE1;white-space:nowrap}
.line{margin-top:10px;font-size:32px;letter-spacing:.1em;color:#C5A56E}
.cta{position:absolute;left:436px;right:80px;bottom:74px;display:flex;align-items:baseline;justify-content:space-between;padding-top:18px;border-top:1px solid rgba(197,165,110,.3)}
.cta b{font-weight:400;font-size:28px;letter-spacing:.1em;color:#F3EDE1}.cta span{font-size:20px;letter-spacing:.06em;color:#C5A56E}
.fan{position:absolute;left:226px;top:318px}.fan .card{left:-84px;top:-150px;width:168px;height:288px;transform-origin:50% 100%}`;
const shell=(body)=>`<!doctype html><html><head><meta charset="utf-8"><base href="${BASE}/"><link rel="stylesheet" href="/fonts/serif-sc.css"><style>${css}</style></head><body><div class="frame"></div><div class="ring"></div>${body}</body></html>`;
const resultPage=id=>{const c=cardById(id),r=QUIZ_RESULTS[id];const art=QUIZ_COVERED.has(id)?`<div class="card back">${cardBack()}</div>`:`<div class="card"><img src="/rws/${id}.webp" alt=""></div>`;
 return shell(`${art}<div class="text"><p class="brand">晨启塔罗<span>· 性格测试</span></p><p class="kicker">我是</p><h1>${esc(`${roman(c.number)} · ${c.nameZh}`)}</h1><p class="line">${esc(r.line)}</p></div><div class="cta"><b>你是哪一张？</b><span>12 道题 · daybreaktarot.xyz/quiz</span></div>`)};
const coverPage=()=>shell(`<div class="fan">${[-2,-1,0,1,2].map(i=>`<div class="card back" style="transform:translateX(${i*26}px) rotate(${i*8}deg)">${cardBack()}</div>`).join('')}</div><div class="text"><p class="brand">晨启塔罗<span>· 性格测试</span></p><p class="kicker">22 张大阿卡纳 · 22 种性格</p><h1 style="font-size:72px">你是哪张塔罗牌？</h1><p class="line">12 道题，一分钟</p></div><div class="cta"><b>测测你是哪一张</b><span>daybreaktarot.xyz/quiz</span></div>`);
await mkdir(OUT,{recursive:true});
const browser=await chromium.launch();const tab=await (await browser.newContext({viewport:{width:1200,height:630},deviceScaleFactor:1})).newPage();
await tab.goto(`${BASE}/robots.txt`);
const shoot=async(html,name)=>{await tab.setContent(html,{waitUntil:'networkidle'});await tab.evaluate(async()=>{const t=document.body.innerText;await document.fonts.load('400 84px DaybreakSerif',t);await document.fonts.ready});await tab.waitForTimeout(150);await tab.screenshot({path:`${OUT}/${name}.jpg`,type:'jpeg',quality:84})};
await shoot(coverPage(),'cover');
for(const id of Object.keys(QUIZ_RESULTS))await shoot(resultPage(id),id);
await browser.close();console.log(`quiz share images ready: ${OUT}/ (${Object.keys(QUIZ_RESULTS).length+1})`);
