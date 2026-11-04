// 检查北斗七星牌阵在 320 / 375 / 768 / 1280 宽度下不重叠（之前出过“牌阵页被压成一团”的问题，见提交 825052b）。
// 用法：先 npm run build，再在 dist/ 起一个静态服务（如 cd dist && python3 -m http.server 4173），然后
//   node scripts/check-dipper-layout.mjs [http://localhost:4173] [截图输出目录]
// 需要 Playwright（npm i --no-save playwright && npx playwright install chromium）。
import {createRequire} from 'node:module';
let chromium;try{({chromium}=await import('playwright'))}catch{({chromium}=createRequire(import.meta.url)('playwright'))}
const base=process.argv[2]||'http://localhost:4173',out=process.argv[3]||'';
const overlap=(a,b)=>a.x<b.x+b.width-1&&b.x<a.x+a.width-1&&a.y<b.y+b.height-1&&b.y<a.y+a.height-1;
const browser=await chromium.launch();let failed=0;
for(const width of [320,375,768,1280]){
 const page=await browser.newPage({viewport:{width,height:900}});
 await page.goto(base+'/consult/',{waitUntil:'networkidle'});
 await page.click('.spread-choice button:has-text("北斗七星")');await page.click('.shuffle-button');
 await page.waitForSelector('.deck-section .deck-fan button');
 for(let i=0;i<7;i++){await page.locator('.deck-section .deck-fan button:not(.picked):not([disabled])').first().click();await page.waitForTimeout(450)}
 await page.waitForSelector('.drawn-card');await page.waitForTimeout(1200);
 const boardShown=await page.$eval('.dipper-board',e=>getComputedStyle(e).display!=='none').catch(()=>false);
 const boxes=boardShown?await page.$$eval('.dipper-slot',els=>els.map(e=>e.getBoundingClientRect().toJSON())):[];
 const cards=await page.$$eval('.drawn-card',els=>els.map(e=>e.getBoundingClientRect().toJSON()));
 const clash=[];for(const list of [boxes,cards])for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++)if(overlap(list[i],list[j]))clash.push([i,j]);
 const scroll=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
 console.log(`${width}px: 牌板${boardShown?'显示，7 个位置':'隐藏（改用列表）'}，列表 ${cards.length} 张，重叠 ${clash.length} 处，横向溢出 ${scroll?'有':'无'}`);
 if(clash.length||scroll||cards.length!==7||(boardShown&&boxes.length!==7))failed++;
 if(out){await page.locator(boardShown?'.dipper-board':'.drawn-grid').scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/dipper-spread-${width}.png`})}
 await page.close()}
await browser.close();if(failed){console.error(`${failed} 个宽度没通过`);process.exit(1)}else console.log('全部通过');
