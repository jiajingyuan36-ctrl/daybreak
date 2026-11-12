// Offline daily tarot posters. See content-kit/xhs/README.md for CLI examples.
import {readFile,mkdir} from 'node:fs/promises';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export const WIDTH=1242,HEIGHT=1660;
export const SAMPLES=[['m0','upright'],['m2','reversed'],['m17','upright'],['wands-1','upright'],['cups-2','reversed'],['swords-4','upright'],['pentacles-9','reversed']];
const HELP=`Usage:
  node scripts/build-xhs.mjs <card-id> <upright|reversed|正位|逆位> [--date YYYY-MM-DD] [--channel chrome]
  node scripts/build-xhs.mjs --samples [--date YYYY-MM-DD] [--channel chrome]

Output: content-kit/xhs/YYYY-MM-DD-card-id-orientation.png (1242 x 1660).
The default date uses Asia/Shanghai. Run npm run prebuild to refresh card data.
Requires Playwright and Chromium, or --channel chrome / msedge.`;

export function parseArgs(args,now=new Date()){
 const options={date:new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(now),channel:undefined,samples:false,help:false};
 const positional=[];
 for(let i=0;i<args.length;i++){
  const arg=args[i];
  if(arg==='--help'||arg==='-h')options.help=true;
  else if(arg==='--samples')options.samples=true;
  else if(arg==='--date'||arg==='--channel'){
   const value=args[++i];
   if(!value||value.startsWith('--'))throw Error(`Missing value for ${arg}`);
   options[arg.slice(2)]=value;
  }else if(arg.startsWith('-'))throw Error(`Unknown option: ${arg}`);
  else positional.push(arg);
 }
 if(options.help)return options;
 const date=new Date(`${options.date}T00:00:00Z`);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(options.date)||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==options.date)throw Error('Invalid date; use a real YYYY-MM-DD date.');
 if(options.channel&&!['chrome','msedge'].includes(options.channel))throw Error('--channel must be chrome or msedge.');
 if(options.samples){if(positional.length)throw Error('--samples cannot be combined with a card ID.');return {...options,cards:SAMPLES}}
 if(positional.length!==2)throw Error('Provide a card ID and orientation, or use --samples.');
 const orientation=({upright:'upright',reversed:'reversed','正位':'upright','逆位':'reversed'})[positional[1]];
 if(!orientation)throw Error('Orientation must be upright, reversed, 正位 or 逆位.');
 return {...options,cards:[[positional[0],orientation]]};
}

export function posterData(cards,id,orientation,date){
 const card=cards.find(card=>card.id===id);
 if(!card||!/^[a-z0-9-]+$/.test(id))throw Error(`Unknown card ID: ${id}`);
 if(!['upright','reversed'].includes(orientation))throw Error(`Invalid orientation: ${orientation}`);
 const keywords=card[orientation]?.keywords?.slice(0,3);
 if(keywords?.length!==3||keywords.some(word=>typeof word!=='string'||!word.trim())||typeof card.name_zh!=='string'||!card.name_zh.trim()||typeof card.today_action!=='string'||!card.today_action.trim())throw Error(`Missing poster copy for ${id}`);
 // Only these fields are rendered. URLs, sources, branding and editorial metadata stay out.
 const copy={id,orientation,date,name:card.name_zh,keywords,action:card.today_action};
 const text=[copy.name,...keywords,copy.action].join('\n');
 if(/https?:|www\.|二维码|扫码|站外|点击链接|访问网站|私信|加微信/i.test(text))throw Error(`External promotion is not allowed in poster copy: ${id}`);
 return copy;
}

const esc=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const dataUrl=async(path,type)=>`data:${type};base64,${(await readFile(path)).toString('base64')}`;

export function posterHtml(copy,fontCss,art){
 return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><style>
${fontCss}
*{box-sizing:border-box;margin:0}
html,body{width:${WIDTH}px;height:${HEIGHT}px}
body{position:relative;background:radial-gradient(ellipse at 50% 38%,#242019 0%,#111113 49%,#0a0a0c 100%);color:#eee6d6;font-family:DaybreakSerif,serif;text-align:center}
.frame{position:absolute;inset:40px;border:1px solid #977b43;pointer-events:none}
.frame::before,.frame::after{content:'';position:absolute;left:15px;right:15px;height:14px;border-left:1px solid #c5a059;border-right:1px solid #c5a059}
.frame::before{top:15px;border-top:1px solid #c5a059}.frame::after{bottom:15px;border-bottom:1px solid #c5a059}
header{position:absolute;top:91px;left:100px;right:100px}
.date{font-size:29px;line-height:44px;letter-spacing:.22em;color:#bba578}
h1{margin-top:12px;font-size:70px;line-height:100px;font-weight:400;letter-spacing:.18em;padding-left:.18em}
.art{position:absolute;top:280px;left:50%;transform:translateX(-50%);height:770px;padding:12px;border:1px solid #b59352;background:#171612;box-shadow:0 24px 70px #0008}
.art img{display:block;height:100%;width:auto;max-width:650px;object-fit:contain}
.art.reversed img{transform:rotate(180deg)}
.reading{position:absolute;top:1090px;left:115px;right:115px}
.name-row{display:flex;justify-content:center;align-items:center;gap:25px}
h2{font-size:61px;line-height:84px;font-weight:400;letter-spacing:.08em}
.orientation{font-size:28px;line-height:44px;letter-spacing:.12em;color:#d0b475;border:1px solid #79643c;padding:2px 15px;white-space:nowrap}
.keywords{display:flex;justify-content:center;gap:0;margin-top:22px;list-style:none;font-size:32px;line-height:50px;color:#d1b77e;letter-spacing:.05em}
.keywords li+li::before{content:'·';margin:0 24px;color:#887348}
.action{margin-top:32px;border-top:1px solid #695735;padding-top:25px}
.action h3{font-size:25px;line-height:40px;letter-spacing:.24em;font-weight:400;color:#b9a477}
.action p{margin:15px auto 0;max-width:950px;font-size:37px;line-height:1.75;letter-spacing:.04em;text-wrap:pretty}
</style></head><body><div class="frame" aria-hidden="true"></div>
<header><p class="date">${esc(copy.date.replaceAll('-',' . '))}</p><h1>今日塔罗</h1></header>
<figure class="art ${copy.orientation}"><img src="${art}" alt="${esc(copy.name)}"></figure>
<section class="reading"><div class="name-row"><h2>${esc(copy.name)}</h2><span class="orientation">${copy.orientation==='reversed'?'逆位':'正位'}</span></div>
<ul class="keywords">${copy.keywords.map(word=>`<li>${esc(word)}</li>`).join('')}</ul>
<div class="action"><h3>今天可做</h3><p>${esc(copy.action)}</p></div></section></body></html>`;
}

async function loadFonts(){
 const fontDir=join(root,'legacy-static/fonts');
 let css=await readFile(join(fontDir,'serif-sc.css'),'utf8');
 for(const name of ['serif-sc-core.woff2','serif-sc-extra.woff2']){
  const url=await dataUrl(join(fontDir,name),'font/woff2');
  css=css.replace(new RegExp(`/fonts/${name.replaceAll('.','\\.')}\\?[^']+`,'g'),url);
 }
 // Preserve the subset unicode ranges so both font files load without overriding each other.
 return css.replaceAll('font-display:swap','font-display:block');
}

export async function renderPoster(page,copy,fontCss,art){
 await page.setContent(posterHtml(copy,fontCss,art),{waitUntil:'load'});
 await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(img=>img.decode()))});
 const issues=await page.evaluate(()=>{
  const errors=[];
  const art=document.querySelector('.art').getBoundingClientRect(),reading=document.querySelector('.reading').getBoundingClientRect();
  if(art.bottom>=reading.top)errors.push('Card overlaps reading');
  for(const el of document.querySelectorAll('header,.art,.reading,h2,.keywords,.action p')){
   const rect=el.getBoundingClientRect();
   if(rect.left<60||rect.right>innerWidth-60||rect.bottom>innerHeight-76||el.scrollWidth>el.clientWidth+1)errors.push(`Overflow: ${el.className||el.tagName}`);
  }
  if(document.querySelectorAll('img').length!==1||document.querySelector('a,canvas,svg'))errors.push('Unexpected poster content');
  return errors;
 });
 if(issues.length)throw Error(`${copy.id}/${copy.orientation}: ${issues.join('; ')}`);
}

async function main(){
 const options=parseArgs(process.argv.slice(2));
 if(options.help){console.log(HELP);return}
 let cards;
 try{cards=JSON.parse(await readFile(join(root,'src/data/tarot_cards_78.json'),'utf8'))}catch(error){throw Error('Cannot read tarot data. Run npm run prebuild first.',{cause:error})}
 const copies=options.cards.map(([id,orientation])=>posterData(cards,id,orientation,options.date));
 const available=new Set(await readFile(join(root,'legacy-static/fonts/serif-sc-core.txt'),'utf8')+await readFile(join(root,'legacy-static/fonts/serif-sc-extra.txt'),'utf8'));
 for(const copy of copies){
  const missing=[...new Set([...`今日塔罗今天可做正位逆位${copy.name}${copy.keywords.join('')}${copy.action}`].filter(ch=>/[㐀-鿿]/u.test(ch)&&!available.has(ch)))];
  if(missing.length)throw Error(`Missing subset glyphs: ${missing.join('')}`);
 }
 let chromium;
 try{({chromium}=createRequire(import.meta.url)('playwright'))}catch{throw Error('Playwright is required. See content-kit/xhs/README.md for isolated setup.')}
 const fontCss=await loadFonts(),outDir=join(root,'content-kit/xhs');
 const browser=await chromium.launch({headless:true,...(options.channel?{channel:options.channel}:{})});
 try{
  const page=await browser.newPage({viewport:{width:WIDTH,height:HEIGHT},deviceScaleFactor:1});
  await page.route(/^https?:\/\//,route=>route.abort());
  await mkdir(outDir,{recursive:true});
  for(const copy of copies){
   const art=await dataUrl(join(root,'public/rws',`${copy.id}.webp`),'image/webp');
   await renderPoster(page,copy,fontCss,art);
   const out=join(outDir,`${copy.date}-${copy.id}-${copy.orientation}.png`);
   await page.screenshot({path:out,type:'png'});
   console.log(out);
  }
 }finally{await browser.close()}
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 main().catch(error=>{console.error(error.message);process.exitCode=1});
}
