import {interpolate,spring,useCurrentFrame,useVideoConfig} from 'remotion';
import type {CSSProperties,ReactNode} from 'react';
import {C,EASE_CINEMA,EASE_SNAP,FONT,clamp} from '../design/tokens';

// 动力学文字：焦外聚焦、逐字弹出、手绘删除线、光泽扫过。时间都用秒（本幕内）。
const useT=()=>{const f=useCurrentFrame();const {fps}=useVideoConfig();return {f,fps,t:f/fps};};

// 焦外聚焦：blur 12→0、透明 0→1、上浮 14→0；out 给出退场时刻（虚化退到后景）
export const Focus=({at,dur=.55,out,children,style}:{at:number;dur?:number;out?:number;children:ReactNode;style?:CSSProperties})=>{const {t}=useT();
 const i=interpolate(t,[at,at+dur],[0,1],{...clamp,easing:EASE_CINEMA});
 const o=out===undefined?0:interpolate(t,[out,out+.45],[0,1],{...clamp,easing:EASE_CINEMA});
 return <div style={{opacity:i*(1-o),filter:`blur(${(1-i)*12+o*10}px)`,translate:`0px ${(1-i)*14-o*10}px`,scale:1-o*.04,...style}}>{children}</div>};

// 弹入（spring）
export const SpringIn=({at,children,style,from=.86}:{at:number;children:ReactNode;style?:CSSProperties;from?:number})=>{const {f,fps}=useT();
 const s=spring({frame:f-Math.round(at*fps),fps,config:{damping:13,stiffness:170,mass:.8}});
 return <div style={{opacity:Math.min(1,s*1.5),scale:from+(1-from)*s,translate:`0px ${(1-s)*18}px`,...style}}>{children}</div>};

// 逐字弹出
export const WordPop=({text,at,step=.045,style,charStyle}:{text:string;at:number;step?:number;style?:CSSProperties;charStyle?:(i:number)=>CSSProperties})=>{const {f,fps}=useT();
 return <span style={{whiteSpace:'nowrap',...style}}>{[...text].map((ch,i)=>{const s=spring({frame:f-Math.round((at+i*step)*fps),fps,config:{damping:12,stiffness:190,mass:.7}});
  return <span key={i} style={{display:'inline-block',opacity:Math.min(1,s*1.6),translate:`0px ${(1-s)*22}px`,scale:.7+.3*s,...charStyle?.(i)}}>{ch}</span>;})}</span>};

// 手绘删除线：包住要划掉的那几个字，线条只在这个 span 内部。
// 整条笔画先按全长画好，外层宽度从 0 长到 103% 把它露出来（不用虚线动画，避免断成几截）
export const Strike=({children,at,dur=.25,color=C.red}:{children:ReactNode;at:number;dur?:number;color?:string})=>{const {t}=useT();
 const p=interpolate(t,[at,at+dur],[0,1],{...clamp,easing:EASE_SNAP});
 return <span style={{position:'relative',display:'inline-block'}}>{children}
  {p>0&&<span style={{position:'absolute',left:'1%',top:'38%',width:`${p*103}%`,height:'0.3em',overflow:'hidden',display:'block'}}>
   <svg viewBox="0 0 100 20" preserveAspectRatio="none" style={{display:'block',width:`${100/p}%`,height:'100%'}}>
    <path d="M2 13 C 22 9, 40 12, 58 8 S 86 7, 98 5" fill="none" stroke={color} strokeWidth={5} strokeLinecap="round"/></svg>
  </span>}
 </span>};

// 光泽扫过：在文字上叠一层渐变高光（只作用在字形上）
export const Sheen=({children,at,dur=.9,color='255,255,255'}:{children:string;at:number;dur?:number;color?:string})=>{const {t}=useT();
 const p=interpolate(t,[at,at+dur],[-60,160],clamp);
 return <span style={{position:'relative',display:'inline-block'}}>{children}
  <span aria-hidden style={{position:'absolute',inset:0,color:'transparent',WebkitBackgroundClip:'text',backgroundClip:'text',
   backgroundImage:`linear-gradient(100deg,transparent ${p-30}%,rgba(${color},.95) ${p}%,transparent ${p+30}%)`,textShadow:'none'}}>{children}</span></span>};

export const BIG:CSSProperties={fontFamily:FONT.serif,fontWeight:700,color:C.warm,textShadow:C.shadow,letterSpacing:'.06em',whiteSpace:'nowrap'};
