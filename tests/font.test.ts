import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {siteChars,lunarChars} from '../scripts/font-chars.mjs';
// 中文衬线字体是按清单抽字的。文案里新出现的字如果不在清单里，会退回系统字体显示，所以这里提醒重新抽字。
test('every character on the site is in the subset font',async()=>{
 const have=new Set([...readFileSync('legacy-static/fonts/serif-sc-core.txt','utf8'),...readFileSync('legacy-static/fonts/serif-sc-extra.txt','utf8')]);
 const missing=[...await siteChars(),...await lunarChars()].filter(c=>!have.has(c));
 assert.deepEqual(missing,[],`字体缺字：${missing.join('')}——在 font-tools 运行 node subset2.mjs，再运行 node scripts/font-css.mjs`)});
