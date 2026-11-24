import {Easing,interpolate,staticFile,continueRender,delayRender} from 'remotion';
// 系列统一的视觉系统（每期不变）。
export const C={bg:'#0B0A09',amber:'#E8B04A',red:'#C8473D',ivory:'#F2EDE4'};
export const SERIF='"EpSerif","Noto Serif CJK SC","Source Han Serif SC",serif';
export const SANS='"EpSans","Noto Sans CJK SC","Source Han Sans SC",sans-serif';
export const EASE=Easing.inOut(Easing.cubic);
// 统一的 ease-in-out 插值，两端夹住。
export const tw=(f:number,inp:number[],out:number[])=>interpolate(f,inp,out,{easing:EASE,extrapolateLeft:'clamp',extrapolateRight:'clamp'});
// 字体：public/fonts 里按本期文字切好的子集。
const FONTS:[string,string,string][]=[['EpSerif','serif-regular.woff2','400'],['EpSerif','serif-bold.woff2','700'],['EpSans','sans-regular.woff2','400']];
let loaded=false;
export const loadFonts=()=>{if(loaded||typeof document==='undefined')return;loaded=true;
 const h=delayRender('fonts');
 Promise.all(FONTS.map(([fam,file,w])=>{const ff=new FontFace(fam,`url(${staticFile('fonts/'+file)})`,{weight:w});return ff.load().then(x=>{document.fonts.add(x)})}))
  .then(()=>continueRender(h)).catch(e=>{console.error(e);continueRender(h)});};
// 两个 #RRGGBB 颜色按 t（0..1）混合。
export const mix=(a:string,b:string,t:number)=>{const p=(h:string)=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));const x=p(a),y=p(b);
 return '#'+x.map((v,i)=>Math.round(v+(y[i]-v)*Math.max(0,Math.min(1,t))).toString(16).padStart(2,'0')).join('')};
export const COLD='#8E949A'; // 「嗯」气泡的冷灰
export const SPOT='#2A1F14'; // 聚光中心色
