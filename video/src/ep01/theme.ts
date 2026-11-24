import {Easing,interpolate,staticFile,continueRender,delayRender} from 'remotion';
// 系列统一的视觉系统（每期不变）。颜色含义全片固定：琥珀＝温度/在乎/A，暗红＝警报/压抑的念头，冷灰＝冷掉/「嗯」。
export const C={bg:'#0A0A0B',amber:'#E8B04A',red:'#C8473D',ivory:'#F2EDE4',cold:'#8A8F96'};
export const SPOT='#33261A'; // 聚光中心色
export const SERIF='"EpSerif","Noto Serif CJK SC","Source Han Serif SC",serif';
export const SANS='"EpSans","Noto Sans CJK SC","Source Han Sans SC",sans-serif';
export const EASE=Easing.inOut(Easing.cubic);
// 统一的 ease-in-out 插值（按帧），两端夹住。
export const tw=(f:number,inp:number[],out:number[])=>interpolate(f,inp,out,{easing:EASE,extrapolateLeft:'clamp',extrapolateRight:'clamp'});
// 按秒的关键帧：kf(t,[[秒,值],…])，相邻两点之间用 easeInOutCubic。
export const kf=(t:number,pts:[number,number][])=>tw(t,pts.map(p=>p[0]),pts.map(p=>p[1]));
// 只在 [a,b] 内从 0 升到 1 再回到 0 的一下（a 起，peak 到顶，b 回落）。
export const bump=(t:number,a:number,peak:number,b:number)=>t<a||t>b?0:kf(t,[[a,0],[peak,1],[b,0]]);
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
