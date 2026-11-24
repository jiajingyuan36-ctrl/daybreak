import React from 'react';
import {AbsoluteFill,random,useCurrentFrame,useVideoConfig} from 'remotion';
import {C,SANS,SERIF,tw} from './theme';
import {CAPTIONS,type Line} from './copy';

// 背景：暖黑底、中心一束很淡的聚光、四周压暗、胶片颗粒（每帧换一次种子）。
export const Backdrop:React.FC=()=>{const f=useCurrentFrame();
 return <AbsoluteFill style={{background:C.bg}}>
  <AbsoluteFill style={{background:'radial-gradient(ellipse 46% 58% at 50% 56%, rgba(232,176,74,0.10) 0%, rgba(232,176,74,0.04) 45%, rgba(0,0,0,0) 75%)'}}/>
  <AbsoluteFill style={{background:'radial-gradient(ellipse 75% 75% at 50% 52%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.65) 100%)'}}/>
  <svg width="1920" height="1080" style={{position:'absolute',inset:0,opacity:0.10,mixBlendMode:'screen'}}>
   <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={f%60} stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
   <rect width="1920" height="1080" filter="url(#grain)"/>
  </svg>
 </AbsoluteFill>};

// 主句：画面上方居中，每次一句；进场淡入并轻微上移，退场淡出。第一句第 0 帧就完整在场。
export const Caption:React.FC=()=>{const f=useCurrentFrame();const {fps}=useVideoConfig();
 const cur=CAPTIONS.find(c=>f>=c.from*fps&&f<c.to*fps);if(!cur)return null;
 const a=cur.from*fps,b=cur.to*fps,IN=15,OUT=10;
 const o=a===0?tw(f,[b-OUT,b],[1,0]):Math.min(tw(f,[a,a+IN],[0,1]),tw(f,[b-OUT,b],[1,0]));
 const y=a===0?0:tw(f,[a,a+IN],[18,0]);
 return <div style={{position:'absolute',top:96,left:120,right:120,textAlign:'center',opacity:o,translate:`0px ${y}px`,fontFamily:SERIF,fontWeight:cur.bold?700:400,fontSize:cur.bold?78:70,lineHeight:1.42,letterSpacing:'0.04em',color:C.ivory,textShadow:'0 0 24px rgba(11,10,9,0.9)'}}>
  {cur.lines.map((l,i)=><div key={i}>{l}</div>)}</div>};

// 发光滤镜（线条外一圈柔光）。
export const GlowDefs:React.FC=()=><defs>
 <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
 <filter id="softglow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="14"/></filter>
</defs>;

// 极简发光小人：圆头 + 身体轮廓（线条）。x 是脚下中心，地面在 GROUND。light 0..1 控制亮度。
export const GROUND=860;
export const Figure:React.FC<{x:number;color:string;light?:number;bob?:number;lift?:number}>=({x,color,light=1,bob=0,lift=0})=>{
 const y=-lift+bob;
 return <g transform={`translate(${x} ${y})`} opacity={0.25+0.75*light}>
  <ellipse cx={0} cy={GROUND-lift*0} rx={70} ry={10} fill={color} opacity={0.10*light}/>
  <g filter="url(#glow)" stroke={color} strokeWidth={4.5} fill="none" strokeLinecap="round" strokeLinejoin="round">
   <circle cx={0} cy={GROUND-300} r={40}/>
   <path d={`M -58 ${GROUND} L -58 ${GROUND-150} Q -58 ${GROUND-238} 0 ${GROUND-238} Q 58 ${GROUND-238} 58 ${GROUND-150} L 58 ${GROUND}`}/>
  </g>
  <circle cx={0} cy={GROUND-300} r={40} fill={color} opacity={0.07*light}/>
 </g>};

// 消息气泡：中心 (x,y)，尾巴朝下。
export const Bubble:React.FC<{x:number;y:number;text:string;opacity:number;scale?:number;color?:string;tail?:'left'|'right'}>=({x,y,text,opacity,scale=1,color=C.ivory,tail='left'})=>{
 const w=Math.max(96,text.length*40+64),h=78;const tx=tail==='left'?-w/2+34:w/2-34;
 return <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
  <g filter="url(#glow)" stroke={color} strokeWidth={3} fill="rgba(11,10,9,0.75)">
   <path d={`M ${-w/2+20} ${-h/2} H ${w/2-20} Q ${w/2} ${-h/2} ${w/2} ${-h/2+20} V ${h/2-20} Q ${w/2} ${h/2} ${w/2-20} ${h/2} H ${tx+14} L ${tx-(tail==='left'?10:-10)} ${h/2+22} L ${tx-6} ${h/2} H ${-w/2+20} Q ${-w/2} ${h/2} ${-w/2} ${h/2-20} V ${-h/2+20} Q ${-w/2} ${-h/2} ${-w/2+20} ${-h/2} Z`}/>
  </g>
  <text x={0} y={13} textAnchor="middle" fontFamily={SANS} fontSize={38} fill={color} letterSpacing="2">{text}</text>
 </g>};

// 距离刻度线：x1..x2，刻度以 B 那端为原点向左排，靠近时左边的刻度被“吃掉”。
export const Ruler:React.FC<{x1:number;x2:number;y:number;opacity:number}>=({x1,x2,y,opacity})=>{
 const ticks:number[]=[];for(let t=x2;t>=x1;t-=40)ticks.push(t);
 return <g opacity={opacity} stroke={C.ivory} strokeLinecap="round">
  <line x1={x1} y1={y} x2={x2} y2={y} strokeWidth={2} opacity={0.7}/>
  {ticks.map((t,i)=><line key={i} x1={t} y1={y-(i%5===0?16:8)} x2={t} y2={y} strokeWidth={2} opacity={0.55}/>)}
  <line x1={x1} y1={y-22} x2={x1} y2={y+6} strokeWidth={3}/><line x1={x2} y1={y-22} x2={x2} y2={y+6} strokeWidth={3}/>
 </g>};

// 警报：从 (x,y) 向外扩散的暗红光环。starts 是每一圈开始的帧，dur 是一圈的帧数，gain 整体强度。
export const Alarm:React.FC<{x:number;y:number;starts:number[];dur?:number;gain?:number}>=({x,y,starts,dur=42,gain=1})=>{const f=useCurrentFrame();
 const live=starts.filter(s=>f>=s&&f<s+dur);
 const core=Math.max(0,...starts.map(s=>tw(f,[s,s+6,s+dur],[0,1,0.25])))*gain;
 return <g>
  <circle cx={x} cy={y} r={26} fill={C.red} opacity={0.55*core} filter="url(#softglow)"/>
  <circle cx={x} cy={y} r={9} fill={C.red} opacity={0.9*core}/>
  {live.map(s=>{const p=(f-s)/dur;return <circle key={s} cx={x} cy={y} r={18+230*tw(f,[s,s+dur],[0,1])} fill="none" stroke={C.red} strokeWidth={5*(1-p)+1} opacity={gain*(1-p)*0.9} filter="url(#glow)"/>})}
 </g>};

// 「在乎」旋钮：angle 是指针角度（0 = 正上方，正值顺时针）。label 用黑体。light 控制亮度。
export const Knob:React.FC<{x:number;y:number;angle:number;opacity:number;light:number;label:string;rise?:number}>=({x,y,angle,opacity,light,label,rise=0})=>{
 const R=62;const arc=(a:number)=>{const r=(a-90)*Math.PI/180;return [x+Math.cos(r)*(R+18),y+rise+Math.sin(r)*(R+18)]};
 const ticks=[-135,-90,-45,0,45,90,135];
 return <g opacity={opacity}>
  <circle cx={x} cy={y+rise} r={R+30} fill={C.amber} opacity={0.10*light} filter="url(#softglow)"/>
  {ticks.map(a=>{const [px,py]=arc(a);return <circle key={a} cx={px} cy={py} r={3.5} fill={C.amber} opacity={0.25+0.6*light*(a<=angle?1:0.3)}/>})}
  <g filter="url(#glow)" stroke={C.amber} fill="none" strokeLinecap="round" opacity={0.35+0.65*light}>
   <circle cx={x} cy={y+rise} r={R} strokeWidth={4}/>
   <g transform={`rotate(${angle} ${x} ${y+rise})`}><line x1={x} y1={y+rise-R+14} x2={x} y2={y+rise-18} strokeWidth={6}/></g>
  </g>
  <text x={x} y={y+rise+R+64} textAnchor="middle" fontFamily={SANS} fontSize={32} letterSpacing="6" fill={C.amber} opacity={0.5+0.5*light}>{label}</text>
 </g>};
