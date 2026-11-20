import {rm,mkdir,copyFile,cp,writeFile} from 'node:fs/promises';
import {posix} from 'node:path';
import {build,transform} from 'esbuild';
import {readFile} from 'node:fs/promises';
await rm('public/js',{recursive:true,force:true});await mkdir('public/js',{recursive:true});
const {metafile}=await build({entryPoints:['src/app.ts'],outdir:'public/js',entryNames:'[name]-[hash]',chunkNames:'chunks/[name]-[hash]',splitting:true,metafile:true,bundle:true,format:'esm',minify:true,target:'es2020',legalComments:'none',logLevel:'warning'});
const [entry]=Object.keys(metafile.outputs).filter(file=>metafile.outputs[file].entryPoint==='src/app.ts');
const startup=new Set();
function collect(file){
 if(startup.has(file))return;
 startup.add(file);
 for(const dep of metafile.outputs[file].imports){
  if(!dep.external&&dep.kind==='import-statement')collect(posix.normalize(dep.path));
 }
}
collect(entry);
await writeFile('public/js/startup.json',JSON.stringify([...startup].map(file=>file.replace(/^public/,''))));
for(const name of ['style.css','epic.css','ornaments.css','engraved.css','fonts','icon.svg','icon-180.png','icon-192.png','icon-512.png','icon-maskable-512.png','ASTRONOMY-LICENSE.txt','manifest.webmanifest'])await cp('legacy-static/'+name,'public/'+name,{recursive:true});
await copyFile('node_modules/lunar-javascript/LICENSE','public/LUNAR-LICENSE.txt');
// 旧版页面（抽牌、回望、设置）要在 Next 的样式之后再按 style → epic → ornaments → engraved 的顺序叠一遍，
// 这四个文件合成一个压缩过的 /legacy.css，一个请求代替四个（结果和分开加载一样，见 src/components/legacy-screen.tsx）。
{const parts=await Promise.all(['style.css','epic.css','ornaments.css','engraved.css'].map(n=>readFile('legacy-static/'+n,'utf8')));
 const {code}=await transform(parts.join('\n'),{loader:'css',minify:true,legalComments:'none',target:['chrome100','safari15']});
 await writeFile('public/legacy.css',code)}

