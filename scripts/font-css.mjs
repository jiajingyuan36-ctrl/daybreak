// 由抽字清单生成中文衬线字体的 @font-face。
// 两个文件：core 是全站源码里出现的字，所有页面共用；extra 只含农历日历额外用到的字，只有出现这些字的页面才会下载。
// 抽字本身（node subset2.mjs，需要 11MB 的思源宋体原文件）在仓库外完成，产物和清单放在 legacy-static/fonts/。
// 文案新增了字时，tests/font.test.ts 会失败，提醒重新抽字并运行本脚本。
import {readFile,writeFile} from 'node:fs/promises';import {join} from 'node:path';import {createHash} from 'node:crypto';
const dir=join(new URL('..',import.meta.url).pathname.replace(/^\/(\w:)/,'$1'),'legacy-static','fonts');
function ranges(chars){const cps=[...new Set([...chars].map(c=>c.codePointAt(0)))].sort((a,b)=>a-b),out=[];
 for(let i=0;i<cps.length;i++){let j=i;while(j+1<cps.length&&cps[j+1]===cps[j]+1)j++;const h=n=>n.toString(16).toUpperCase();out.push(i===j?`U+${h(cps[i])}`:`U+${h(cps[i])}-${h(cps[j])}`);i=j}
 return out.join(',')}
// 地址带内容哈希：Service Worker 把 /fonts/ 当作永久缓存，换了字体就必须换地址。
const hash=async file=>createHash('sha256').update(await readFile(join(dir,file))).digest('hex').slice(0,10);
const face=(url,chars)=>`@font-face{font-family:DaybreakSerif;src:url('${url}') format('woff2');font-weight:400;font-style:normal;font-display:swap;unicode-range:${ranges(chars)}}`;
const core=await readFile(join(dir,'serif-sc-core.txt'),'utf8'),extra=await readFile(join(dir,'serif-sc-extra.txt'),'utf8');
const coreUrl=`/fonts/serif-sc-core.woff2?v=${await hash('serif-sc-core.woff2')}`,extraUrl=`/fonts/serif-sc-extra.woff2?v=${await hash('serif-sc-extra.woff2')}`;
await writeFile(join(dir,'serif-sc.css'),`/* 由 scripts/font-css.mjs 生成，不要手改 */\n${face(coreUrl,core)}\n${face(extraUrl,extra)}\n`,'utf8');
await writeFile(join(dir,'serif-sc.json'),JSON.stringify({core:coreUrl,extra:extraUrl})+'\n','utf8');
console.log('serif-sc.css and serif-sc.json written',coreUrl);
