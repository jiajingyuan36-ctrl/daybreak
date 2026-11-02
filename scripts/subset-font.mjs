// 从思源宋体原文件抽出网站用到的字，生成 legacy-static/fonts/ 下的两个 woff2 和字表，然后运行 font-css.mjs。
// 原文件（NotoSerifSC-Regular.otf，约 11MB，SIL OFL）不放进仓库：
//   https://github.com/notofonts/noto-cjk/raw/main/Serif/SubsetOTF/SC/NotoSerifSC-Regular.otf
// 用法：npm i --no-save subset-font@2.4.0 && node scripts/subset-font.mjs <NotoSerifSC-Regular.otf 的路径>
import subsetFont from 'subset-font';import {readFile,writeFile} from 'node:fs/promises';import {join} from 'node:path';
import {siteChars,lunarChars} from './font-chars.mjs';
const dir=join(new URL('..',import.meta.url).pathname.replace(/^\/(\w:)/,'$1'),'legacy-static','fonts');
const src=await readFile(process.argv[2]);const ascii=Array.from({length:95},(_,i)=>String.fromCharCode(32+i));
const site=new Set([...await siteChars(),...ascii]),extra=[...await lunarChars()].filter(c=>!site.has(c));
for(const [name,set] of [['core',[...site].sort()],['extra',extra.sort()]]){const out=await subsetFont(src,set.join(''),{targetFormat:'woff2'});await writeFile(join(dir,`serif-sc-${name}.woff2`),out);await writeFile(join(dir,`serif-sc-${name}.txt`),set.join(''),'utf8');console.log(name,set.length,'chars',Math.round(out.length/1024),'KB')}
await import('./font-css.mjs');
