// 批量生成小红书封面图：1080×1440（3:4），风格与网站一致。
// 用法：
//   node scripts/xhs-covers.mjs                       # 读 content-kit/covers.json，输出到 content-kit/covers/
//   node scripts/xhs-covers.mjs my.json out-dir       # 自定义配置和输出目录
//   node scripts/xhs-covers.mjs --png                 # 输出 PNG（默认 JPG，体积小，小红书直接可用）
// 依赖：Playwright 的 Chromium（本项目不把它写进 package.json，避免影响线上 npm ci）。
//   没装过的话：npm i --no-save playwright && npx playwright install chromium
// 配置里每一项：
//   { "file": "01", "theme": "night" | "dawn", "kicker": "角标", "title": "大字（建议 ≤ 12 字）",
//     "sub": "小字", "cards": ["m13"] 或 ["m3","m5","m10"]（1–3 张，第一张居中最大）, "footer": "可选，默认品牌名" }
// 牌面用 public/rws/ 里 1909 年 Rider–Waite–Smith 扫描（公有领域）；牌 id 与网站一致（m0–m21、wands-1…、cups-…、swords-…、pentacles-…）。
import {readFile,mkdir,readdir,access} from 'node:fs/promises';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2),png=args.includes('--png'),[configArg,outArg]=args.filter(a=>!a.startsWith('--'));
const configPath=resolve(configArg||join(root,'content-kit/covers.json')),outDir=resolve(outArg||join(root,'content-kit/covers'));

let chromium;
// 先找项目里装的；再找全局装的（require 会读 NODE_PATH，import 不会）
try{({chromium}=await import('playwright'))}catch{try{({chromium}=createRequire(import.meta.url)('playwright'))}catch{console.error('需要 Playwright：npm i --no-save playwright && npx playwright install chromium');process.exit(1)}}

const covers=JSON.parse(await readFile(configPath,'utf8'));
const fontDir=join(root,'legacy-static/fonts');
const have=new Set([...(await readFile(join(fontDir,'serif-sc-core.txt'),'utf8')),...(await readFile(join(fontDir,'serif-sc-extra.txt'),'utf8'))]);
// 页面用 setContent 打开，浏览器不允许它读本地文件，所以字体和牌面都转成 data URL 内嵌。
const cache=new Map();
async function dataUrl(p){if(!cache.has(p)){const type=p.endsWith('.webp')?'image/webp':p.endsWith('.woff2')?'font/woff2':'application/octet-stream';cache.set(p,`data:${type};base64,${(await readFile(p)).toString('base64')}`)}return cache.get(p)}
const FONTS={core:await dataUrl(join(fontDir,'serif-sc-core.woff2')),extra:await dataUrl(join(fontDir,'serif-sc-extra.woff2')),sans:await dataUrl(join(fontDir,'SourceHanSansCN.woff2'))};
const exists=async p=>access(p).then(()=>true,()=>false);

// 拉丁标题字 Cinzel：构建后 dist/ 里有 next/font 下载好的文件，从 CSS 里找出来；找不到就用系统衬线体。
async function cinzel(){const cssDir=join(root,'dist/_next/static/css');if(!await exists(cssDir))return '';
 for(const f of await readdir(cssDir)){const css=await readFile(join(cssDir,f),'utf8');const m=css.match(/font-family:'?Cinzel'?[^}]*?src:url\(([^)]+\.woff2)\)/)||css.match(/font-family:__Cinzel[^;]*;[^}]*?src:url\(([^)]+\.woff2)\)/);
  if(m){const p=join(root,'dist',m[1].replace(/^\/?/,'').replace(/^\.\.\/media/,'_next/static/media'));if(await exists(p))return `@font-face{font-family:CoverLatin;src:url('${await dataUrl(p)}') format('woff2');font-weight:400 500}`}}
 return ''}
const latinFace=await cinzel();

const THEMES={
 night:{bg:'radial-gradient(ellipse at 50% 30%,#16151C 0%,#0B0A0E 65%,#050507 100%)',fg:'#F4EFE6',sub:'#A39E93',small:'#6E6A63',gold:'#C5A059',goldHi:'#E6D2B5',line:'rgba(197,160,89,.35)',glow:'rgba(197,160,89,.14)',frame:'rgba(212,175,55,.32)',noise:.05},
 dawn:{bg:'radial-gradient(ellipse at 50% 28%,#FBF7EF 0%,#F2EFE9 60%,#E6DFD2 100%)',fg:'#141413',sub:'#5f5b55',small:'#8a857c',gold:'#8A6D3B',goldHi:'#6E5832',line:'rgba(110,88,50,.35)',glow:'rgba(156,122,60,.14)',frame:'rgba(110,88,50,.35)',noise:.04},
};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const noise=`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .5 0 0 0 0 .5 0 0 0 0 .5 0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

async function html(c){const t=THEMES[c.theme]||THEMES.night;const cards=(c.cards||[]).slice(0,3);const [main,...side]=cards;const two=[...(c.title||'')].length>8; // 标题超过 8 个字会折成两行，牌放小一点
 const imgs=Object.fromEntries(await Promise.all(cards.map(async id=>[id,await dataUrl(join(root,'public/rws',id+'.webp'))])));const img=id=>`<img src="${imgs[id]}" alt="">`;
 return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><style>
@font-face{font-family:DaybreakSerif;src:url('${FONTS.core}') format('woff2')}
@font-face{font-family:DaybreakSerif;src:url('${FONTS.extra}') format('woff2')}
@font-face{font-family:CoverSans;src:url('${FONTS.sans}') format('woff2')}
${latinFace}
*{box-sizing:border-box;margin:0}
html,body{width:1080px;height:1440px}
body{position:relative;overflow:hidden;background:${t.bg};color:${t.fg};font-family:CoverLatin,DaybreakSerif,CoverSans,serif;text-align:center}
body::before{content:'';position:absolute;inset:0;background:${noise};opacity:${t.noise};mix-blend-mode:${c.theme==='dawn'?'multiply':'screen'}}
.frame{position:absolute;inset:44px;border:1px solid ${t.frame}}
.frame::after{content:'';position:absolute;inset:12px;border:1px solid ${t.frame};opacity:.6}
.head{position:absolute;top:112px;left:80px;right:80px;display:flex;flex-direction:column;align-items:center;gap:30px}
.kicker{font-size:30px;letter-spacing:.32em;color:${t.gold};display:flex;align-items:center;justify-content:center;gap:22px}
.kicker::before,.kicker::after{content:'';width:70px;height:1px;background:linear-gradient(90deg,transparent,${t.line})}
.kicker::after{background:linear-gradient(90deg,${t.line},transparent)}
h1{font-family:DaybreakSerif,CoverSans,serif;font-weight:400;font-size:${two?88:104}px;line-height:1.24;letter-spacing:.12em;padding-left:.12em;text-wrap:balance}
.sub{font-size:38px;line-height:1.6;letter-spacing:.1em;color:${t.sub}}
.stage{position:absolute;left:0;right:0;bottom:170px;height:${two?600:660}px}
.glow{position:absolute;left:50%;top:50%;width:760px;height:760px;margin:-380px 0 0 -380px;border-radius:50%;background:radial-gradient(circle,${t.glow} 0%,transparent 68%);filter:blur(20px)}
.orbit{position:absolute;left:50%;top:50%;width:720px;height:720px;margin:-360px 0 0 -360px;border-radius:50%;border:1px dashed ${t.line};opacity:.55}
.card{position:absolute;left:50%;top:50%;border-radius:12px;overflow:hidden;border:1.5px solid ${t.frame};box-shadow:0 40px 70px -26px rgba(0,0,0,.75)}
.card img{display:block;width:100%;height:100%;object-fit:cover}
.main{width:${two?320:side.length?344:372}px;height:${two?549:side.length?590:638}px;transform:translate(-50%,-50%);z-index:2}
.side{width:262px;height:449px;z-index:1;opacity:.92}
.side.l{transform:translate(-50%,-50%) translateX(-300px) rotate(-7deg)}
.side.r{transform:translate(-50%,-50%) translateX(300px) rotate(7deg)}
.footer{position:absolute;bottom:96px;left:0;right:0;font-size:26px;letter-spacing:.3em;color:${t.small}}
.footer b{font-weight:400;color:${t.gold};letter-spacing:.42em;margin-right:18px}
</style></head><body><div class="frame"></div>
<div class="head">${c.kicker?`<p class="kicker">${esc(c.kicker)}</p>`:''}<h1>${esc(c.title)}</h1>${c.sub?`<p class="sub">${esc(c.sub)}</p>`:''}</div>
<div class="stage"><div class="glow"></div><div class="orbit"></div>
${side[0]?`<div class="card side l">${img(side[0])}</div>`:''}${side[1]?`<div class="card side r">${img(side[1])}</div>`:''}
${main?`<div class="card main">${img(main)}</div>`:''}</div>
<p class="footer"><b>DAYBREAK</b>${esc(c.footer||'晨启塔罗 · 每天早上一张牌')}</p></body></html>`}

await mkdir(outDir,{recursive:true});
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1080,height:1440},deviceScaleFactor:1});
let warned=false;
for(const c of covers){
 for(const id of c.cards||[])if(!await exists(join(root,'public/rws',id+'.webp')))throw Error(`${c.file}: 找不到牌面 public/rws/${id}.webp`);
 const text=[c.kicker,c.title,c.sub,c.footer].join('');const missing=[...new Set([...text].filter(ch=>/[㐀-鿿]/.test(ch)&&!have.has(ch)))];
 if(missing.length){warned=true;console.warn(`  ${c.file}: 这些字不在网站衬线字体里，会用思源黑体代替：${missing.join('')}`)}
 await page.setContent(await html(c),{waitUntil:'load'});await page.evaluate(()=>document.fonts.ready);
 const out=join(outDir,`${c.file}.${png?'png':'jpg'}`);
 await page.screenshot({path:out,type:png?'png':'jpeg',...(png?{}:{quality:92})});console.log('✓',out.replace(root+'/',''));
}
await browser.close();
if(warned)console.warn('提示：想让这些字也用衬线体，可以换个说法，或按 scripts/font-css.mjs 的说明重新抽字。');
