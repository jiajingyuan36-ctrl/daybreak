// 收集网站会显示的全部汉字和全角标点，供中文衬线字体抽字使用。
// 来源：src、app 下的源码文字，以及日历用到的农历库里的字（节气、干支、农历月日、宜忌等）。
// 用户自己输入的文字（回顾、昵称）不在这里，遇到没收进来的字会自动用系统字体显示。
// 用法：node scripts/font-chars.mjs [输出文件]，默认打印统计。
import {readdir,readFile,writeFile} from 'node:fs/promises';import {join,extname} from 'node:path';
const root=new URL('..',import.meta.url).pathname.replace(/^\/(\w:)/,'$1');
const CJK=/[　-〿㐀-鿿＀-￯‘-”…·—]/gu;
async function walk(dir,out=[]){for(const e of await readdir(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory()){if(e.name!=='data')await walk(p,out)}else if(['.ts','.tsx','.css','.html','.json'].includes(extname(p)))out.push(p)}return out}
export async function siteChars(){const set=new Set();
 for(const f of [...await walk(join(root,'src')),...await walk(join(root,'app'))])for(const ch of (await readFile(f,'utf8')).match(CJK)??[])set.add(ch);
 return set}
export async function lunarChars(){const set=new Set();const t=await readFile(join(root,'node_modules','lunar-javascript','lunar.js'),'utf8');
 // 库里的中文以 \\uXXXX 转义或原文出现，两种都收
 for(const m of t.matchAll(/\\u([0-9a-fA-F]{4})/g)){const ch=String.fromCharCode(parseInt(m[1],16));if(CJK.test(ch))set.add(ch);CJK.lastIndex=0}
 for(const ch of t.match(CJK)??[])set.add(ch);return set}
if(import.meta.url===`file:///${process.argv[1].replace(/\\/g,'/')}`||process.argv[1]?.endsWith('font-chars.mjs')){
 const s=await siteChars(),l=await lunarChars(),all=new Set([...s,...l]);
 console.log('site',s.size,'lunar',l.size,'union',all.size);
 if(process.argv[2])await writeFile(process.argv[2],[...all].sort().join(''),'utf8')}
