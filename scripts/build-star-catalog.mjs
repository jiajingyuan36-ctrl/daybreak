// 从Yale 亮星表第五版（Yale Bright Star Catalogue, 5th Revised Ed., Hoffleit & Warren 1991，公有领域）
// 生成北天背景星表 src/lib/dipper-stars.ts。只在更新星表时手动运行一次，构建时不需要。
// 用法：node scripts/build-star-catalog.mjs <bsc5-short.json 路径>
// 数据文件来源：https://github.com/brettonw/YaleBrightStarCatalog（把 BSC5 转成 JSON 的脚本，MIT；星表本身为公有领域，原始 ASCII 见 http://tdc-www.harvard.edu/catalogs/bsc5.html）
// 选星：J2000 赤纬 ≥ +40°、V ≤ 4.5，覆盖大熊、小熊、天龙一带（邻近的仙王、仙后、鹿豹也会落进来）。北斗七星、辅、北极星另在 dipper.ts 里单独列出，这里剔除。
import {readFile,writeFile} from 'node:fs/promises';
const src=process.argv[2];if(!src){console.error('用法：node scripts/build-star-catalog.mjs <bsc5-short.json>');process.exit(1)}
const NAMED=new Set(['4301','4295','4554','4660','4905','5054','5191','5062','424']);
const ra=s=>{const m=s.match(/(\d+)h (\d+)m ([\d.]+)s/);return (+m[1]+m[2]/60+m[3]/3600)*15};
const de=s=>{const m=s.match(/([+-])(\d+)° (\d+)′ (\d+)″/);return m?(m[1]==='-'?-1:1)*(+m[2]+m[3]/60+m[4]/3600):null};
const rows=JSON.parse(await readFile(src,'utf8'))
 .filter(s=>s.V&&s.RA&&s.Dec&&+s.V<=4.5&&de(s.Dec)>=40&&!NAMED.has(s.HR))
 .map(s=>[+s.HR,+ra(s.RA).toFixed(4),+de(s.Dec).toFixed(4),+(+s.V).toFixed(2)])
 .sort((a,b)=>a[0]-b[0]);
const out={source:'Yale Bright Star Catalogue, 5th Revised Ed. (Hoffleit & Warren 1991), public domain; J2000; Dec >= +40°, V <= 4.5',fields:['HR','raDeg','decDeg','V'],stars:rows};
// 写成 .ts（而不是 .json），这样 Node 测试、esbuild 和 Next 都能直接导入
await writeFile(new URL('../src/lib/dipper-stars.ts',import.meta.url),`// 由 scripts/build-star-catalog.mjs 生成，不要手改。\n// ${out.source}\n// 字段：[HR, 赤经°(J2000), 赤纬°(J2000), V 星等]\nexport const BACKGROUND_STARS:readonly (readonly [number,number,number,number])[]=${JSON.stringify(rows)};\n`);
console.log(`写入 ${rows.length} 颗星`);
