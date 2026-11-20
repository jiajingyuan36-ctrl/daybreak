// 画「夜空版画」App 图标（2026-11-20）：墨黑底、双线框、放射细光的满月、月里一颗四芒星。
// icon.svg 写出带框的一版（电脑上显示），icon-maskable.svg 是不带框、图形缩到中间 80% 的一版（手机会把图标切成圆角）。
// 生成 PNG：用浏览器把两个 SVG 截成 512、192、180（180 给 iPhone，用不带框那版），放进 legacy-static/。
// 网站的 favicon（legacy-static/icon.svg）用的是不带框那版，小尺寸更清楚。
import {writeFileSync} from 'node:fs';
const f=n=>Number(n.toFixed(2));
const star=(cx,cy,r,w)=>{let p='';for(let i=0;i<8;i++){const a=(i*45-90)*Math.PI/180,L=i%2?r*.4:r,b1=a-Math.PI/2,b2=a+Math.PI/2,ww=i%2?w*.7:w;p+=`M${f(cx+Math.cos(b1)*ww)} ${f(cy+Math.sin(b1)*ww)}L${f(cx+Math.cos(a)*L)} ${f(cy+Math.sin(a)*L)}L${f(cx+Math.cos(b2)*ww)} ${f(cy+Math.sin(b2)*ww)}Z`}return p};
export function icon({maskable=false}={}){
 const S=512,C=256,k=maskable?.8:1; // maskable：图形缩到中间 80% 的安全区
 const R=v=>f(C+(v-C)*k);
 const rays=Array.from({length:48},(_,i)=>{const a=i*7.5*Math.PI/180,r1=110*k,r2=(i%2?128:i%6===0?166:144)*k;return `M${f(C+Math.cos(a)*r1)} ${f(C+Math.sin(a)*r1)}L${f(C+Math.cos(a)*r2)} ${f(C+Math.sin(a)*r2)}`}).join('');
 const frame=maskable?'':`<rect x="30" y="30" width="452" height="452" fill="none" stroke="#e6dcc6" stroke-opacity=".7" stroke-width="3"/><rect x="44" y="44" width="424" height="424" fill="none" stroke="#e6dcc6" stroke-opacity=".28" stroke-width="2"/>`;
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}"><defs><radialGradient id="g" cx=".5" cy=".42" r=".7"><stop offset="0" stop-color="#1b1a20"/><stop offset="1" stop-color="#08080a"/></radialGradient><radialGradient id="m" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#efe7d4" stop-opacity=".22"/><stop offset="1" stop-color="#efe7d4" stop-opacity="0"/></radialGradient></defs>
<rect width="${S}" height="${S}" fill="url(#g)"/>${frame}
<circle cx="${C}" cy="${C}" r="${f(118*k)}" fill="url(#m)"/>
<path d="${rays}" stroke="#e6dcc6" stroke-opacity=".8" stroke-width="${f(2.4*k)}" stroke-linecap="round"/>
<circle cx="${C}" cy="${C}" r="${f(100*k)}" fill="none" stroke="#efe7d4" stroke-width="${f(4*k)}"/>
<circle cx="${C}" cy="${C}" r="${f(88*k)}" fill="none" stroke="#e6dcc6" stroke-opacity=".45" stroke-width="${f(2*k)}"/>
<path d="${star(C,C,64*k,7*k)}" fill="#f3ecdc"/><circle cx="${C}" cy="${C}" r="${f(5*k)}" fill="#f3ecdc"/>
${maskable?'':`<path d="${star(96,96,13,1.6)}${star(416,416,13,1.6)}" fill="#e6dcc6" fill-opacity=".75"/>`}
</svg>`}
writeFileSync('icon.svg',icon());writeFileSync('icon-maskable.svg',icon({maskable:true}));
