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
