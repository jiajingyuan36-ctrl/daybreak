import {interpolate,spring,useCurrentFrame,useVideoConfig} from 'remotion';
import type {CSSProperties,ReactNode} from 'react';
import {EASE_CINEMA,EASE_SNAP,FIN,FONT,clamp} from '../design/tokens';

// 财报可视化组件：滚动数字、10-K 剪报卡、马克笔高亮、红印章。时间一律是当前 Sequence 内的秒数。
const useT=()=>{const f=useCurrentFrame();const {fps}=useVideoConfig();return {f,fps,t:f/fps};};

// 等宽数字从 from 滚到 to，at 开始、land 时刻定格（带千分位）
export const RollingNumber=({from=0,to,at,land,prefix='$',suffix='',decimals=0,style}:{from?:number;to:number;at:number;land:number;prefix?:string;suffix?:string;decimals?:number;style?:CSSProperties})=>{
 const {t}=useT();const p=interpolate(t,[at,land],[0,1],{...clamp,easing:EASE_CINEMA});
 const v=from+(to-from)*p;const done=t>=land;
 const s=(done?to:v).toLocaleString('en-US',{minimumFractionDigits:decimals,maximumFractionDigits:decimals});
 const pop=done?Math.max(0,1-(t-land)/.25):0;
 return <span style={{fontFamily:FONT.mono,fontWeight:700,fontVariantNumeric:'tabular-nums',display:'inline-block',scale:1+pop*.06,whiteSpace:'nowrap',...style}}>{prefix}{s}{suffix}</span>};

// 马克笔高亮：从左到右刷过（放在文字后面）
export const Highlighter=({children,at,dur=.45,color='rgba(212,175,55,.55)'}:{children:ReactNode;at:number;dur?:number;color?:string})=>{const {t}=useT();
 const p=interpolate(t,[at,at+dur],[0,1],{...clamp,easing:EASE_SNAP});
 return <span style={{position:'relative',display:'inline-block'}}>
  <span style={{position:'absolute',left:'-3%',bottom:'4%',height:'52%',width:`${p*106}%`,background:color,borderRadius:3,rotate:'-.6deg'}}/>
  <span style={{position:'relative'}}>{children}</span></span>};

// 复古新闻纸 / 10-K 剪报卡：微倾、和纸胶带、炭黑硬阴影，spring 啪地贴上
export const SecFilingClip=({at,children,rotate=-1.5,width,style}:{at:number;children:ReactNode;rotate?:number;width?:number;style?:CSSProperties})=>{
 const {f,fps}=useT();const s=spring({frame:f-Math.round(at*fps),fps,config:{damping:14,stiffness:220,mass:.7}});
 return <div style={{position:'relative',width,opacity:Math.min(1,s*1.8),scale:1.12-.12*s,rotate:`${rotate+(1-s)*4}deg`,translate:`0px ${(1-s)*-30}px`,...style}}>
  <div style={{position:'absolute',top:-16,left:'50%',width:150,height:34,translate:'-50% 0',rotate:'2deg',background:'rgba(236,226,196,.82)',boxShadow:'0 1px 2px rgba(0,0,0,.25)',zIndex:2}}/>
  <div style={{background:FIN.paper,color:FIN.ink,padding:'30px 34px 26px',boxShadow:`10px 12px 0 ${FIN.ink}cc, 0 18px 40px rgba(0,0,0,.45)`,
   backgroundImage:'repeating-linear-gradient(0deg,rgba(0,0,0,.025) 0 1px,transparent 1px 4px)'}}>{children}</div>
 </div>};

// 红印章：从 2.4 倍、透明猛砸到 1 倍
export const StampSeal=({at,children,rotate=-8,style}:{at:number;children:ReactNode;rotate?:number;style?:CSSProperties})=>{
 const {t}=useT();const p=interpolate(t,[at,at+.16],[0,1],{...clamp,easing:EASE_SNAP});
 if(p<=0)return null;
 return <div style={{display:'inline-block',scale:2.4-1.4*p,opacity:p,rotate:`${rotate}deg`,...style}}>
  <div style={{border:`5px solid ${FIN.red}`,outline:`2px solid ${FIN.red}`,outlineOffset:5,padding:'14px 26px',color:FIN.red,fontFamily:FONT.serif,fontWeight:900,letterSpacing:'.08em',
   background:'rgba(200,75,75,.06)',textShadow:'none',
   maskImage:'radial-gradient(circle at 30% 40%,#000 55%,rgba(0,0,0,.82) 70%,#000 85%)',WebkitMaskImage:'radial-gradient(circle at 30% 40%,#000 55%,rgba(0,0,0,.82) 70%,#000 85%)'}}>{children}</div>
 </div>};
