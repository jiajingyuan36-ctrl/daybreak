import {rm,mkdir,copyFile,cp} from 'node:fs/promises';
import {build} from 'esbuild';
// 旧版页面（塔罗/回望/设置）打包成一个压缩文件，避免浏览器逐层下载十几个模块。
await rm('public/js',{recursive:true,force:true});await mkdir('public/js',{recursive:true});
await build({entryPoints:['src/app.ts'],outfile:'public/js/app.js',bundle:true,format:'esm',minify:true,target:'es2020',legalComments:'none',logLevel:'warning'});
for(const name of ['style.css','epic.css','fonts','icon.svg','icon-180.png','icon-192.png','icon-512.png','ASTRONOMY-LICENSE.txt','manifest.webmanifest'])await cp('legacy-static/'+name,'public/'+name,{recursive:true});
await copyFile('node_modules/lunar-javascript/LICENSE','public/LUNAR-LICENSE.txt');
