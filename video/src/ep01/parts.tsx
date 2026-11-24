import React from 'react';
import {AbsoluteFill,Easing,interpolate,random,useCurrentFrame,useVideoConfig} from 'remotion';
import {C,SANS,SERIF,SPOT,tw} from './theme';
import {CAPTIONS} from './copy';

// ── 背景三层 + 颗粒 + 暗角（屏幕空间，不随摄像机缩放）──────────────
// 聚光跟着摄像机走：始终罩在镜头对准的位置（屏幕上 spotX, spotY）。
export const Backdrop:React.FC<{spotX:number;spotY:number}>=({spotX,spotY})=><AbsoluteFill style={{background:C.bg}}>
 <AbsoluteFill style={{background:`radial-gradient(circle 1150px at ${spotX}px ${spotY}px, ${SPOT} 0%, rgba(42,31,20,0.75) 30%, rgba(42,31,20,0.3) 62%, rgba(11,10,9,0) 100%)`}}/>
</AbsoluteFill>;

// 浮尘：50 颗，半径 1–2px，透明度 0.05–0.15，慢慢漂；depth 越大离镜头越近，跟着摄像机平移得越多（视差）。
const DUST=Array.from({length:50},(_,i)=>({x:random('dx'+i)*1960,y:random('dy'+i)*1120,r:1+random('dr'+i),o:0.05+random('do'+i)*0.10,d:0.3+random('dd'+i)*1.4,vx:(random('vx'+i)-0.5)*14,vy:-4-random('vy'+i)*8,ph:random('ph'+i)*6.28}));
export const Dust:React.FC<{panX:number;panY:number}>=({panX,panY})=>{const f=useCurrentFrame();const {fps}=useVideoConfig();const t=f/fps;
 const W=1960,H=1120,wrap=(v:number,m:number)=>((v%m)+m)%m-20;
 return <svg width="1920" height="1080" style={{position:'absolute',inset:0}}>
  {DUST.map((p,i)=><circle key={i} cx={wrap(p.x+p.vx*t*p.d+Math.sin(t*0.7+p.ph)*6-panX*p.d*0.35,W)} cy={wrap(p.y+p.vy*t*p.d-panY*p.d*0.35,H)} r={p.r*(0.7+p.d*0.4)} fill={C.ivory} opacity={p.o}/>)}
 </svg>};

export const Grain:React.FC=()=>{const f=useCurrentFrame();
 return <svg width="1920" height="1080" style={{position:'absolute',inset:0,opacity:0.04}}>
  <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={f} stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
  <rect width="1920" height="1080" filter="url(#grain)"/>
 </svg>};

export const Vignette:React.FC=()=><AbsoluteFill style={{background:'radial-gradient(ellipse 72% 72% at 50% 52%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.35) 100%)'}}/>;

// ── 字幕 ────────────────────────────────────────────────
// 逐字淡入并上移 8px，每字间隔 35ms；整句 0.3 秒淡出；下一句在上一句淡出最后 0.2 秒里开始，前后交叉。
// 第一句第 0 帧就完整在场（通用规则：第 0 帧必须是完整画面）。
const parse=(s:string)=>{const out:{ch:string;key:boolean}[]=[];let k=false;for(const ch of s){if(ch==='{'){k=true;continue}if(ch==='}'){k=false;continue}out.push({ch,key:k})}return out};
export const Caption:React.FC<{end:number}>=({end})=>{const f=useCurrentFrame();const {fps}=useVideoConfig();const ms=(x:number)=>x/1000*fps;
 return <>{CAPTIONS.map((c,i)=>{const a=c.from*fps,b=c.to*fps;
  const outA=b-ms(100),outB=b+ms(200); // 淡出 0.3 秒，跨过下一句开始的那一刻
  const last=b>=end;
  if(f<a||(!last&&f>=outB))return null;
  const out=last?1:tw(f,[outA,outB],[1,0]);
  return <div key={i} style={{position:'absolute',top:92,left:100,right:100,textAlign:'center',opacity:out,fontFamily:SERIF,fontWeight:c.bold?700:400,fontSize:64,lineHeight:1.4,letterSpacing:'0.05em',color:C.ivory,textShadow:'0 0 18px rgba(11,10,9,0.95)'}}>
   {parse(c.text).map((g,j)=>{const st=a+ms(35*j);const o=a===0?1:tw(f,[st,st+ms(320)],[0,1]);const y=a===0?0:tw(f,[st,st+ms(320)],[8,0]);
    return <span key={j} style={{display:'inline-block',opacity:o,translate:`0px ${y}px`,color:g.key?C.amber:C.ivory,textShadow:g.key?'0 0 14px rgba(232,176,74,0.55), 0 0 2px rgba(232,176,74,0.6)':undefined}}>{g.ch}</span>})}
  </div>})}</>};

// ── 场景里的东西（世界坐标，放在摄像机容器里）──────────────
export const G=820; // 地面
export const Defs:React.FC=()=><defs>
 <filter id="halo" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="6"/></filter>
 <filter id="soft" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="16"/></filter>
 <filter id="refl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>
 {/* 身体下半部往下渐隐（角色本地坐标） */}
 <linearGradient id="bodyFade" x1="0" y1={G-330} x2="0" y2={G} gradientUnits="userSpaceOnUse"><stop offset="0.45" stopColor="#fff"/><stop offset="1" stopColor="#fff" stopOpacity="0.06"/></linearGradient>
 <mask id="bodyMask" maskUnits="userSpaceOnUse" x="-300" y={G-500} width="600" height="600"><rect x="-300" y={G-500} width="600" height="600" fill="url(#bodyFade)"/></mask>
 {/* 倒影往下渐隐（世界坐标） */}
 <linearGradient id="reflFade" x1="0" y1={G} x2="0" y2={G+300} gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#fff"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></linearGradient>
 <mask id="reflMask" maskUnits="userSpaceOnUse" x="-2000" y={G} width="6000" height="400"><rect x="-2000" y={G} width="6000" height="400" fill="url(#reflFade)"/></mask>
 <linearGradient id="horizon" x1="0" x2="1"><stop offset="0" stopColor={C.ivory} stopOpacity="0"/><stop offset="0.5" stopColor={C.ivory} stopOpacity="0.10"/><stop offset="1" stopColor={C.ivory} stopOpacity="0"/></linearGradient>
</defs>;

// 角色：圆头，头和肩之间留脖子空隙，圆滑斜肩，身体往下渐隐、不画脚。
// 发光两层：12px 模糊、透明度 0.35 的外辉光 + 2px 实线。glow 0..1 控制外辉光，breath 是呼吸缩放，lean 是前倾角度。
const BODY=`M -64 ${G} C -64 ${G-120} -67 ${G-205} -52 ${G-238} Q -32 ${G-268} 0 ${G-270} Q 32 ${G-268} 52 ${G-238} C 67 ${G-205} 64 ${G-120} 64 ${G}`;
export const Figure:React.FC<{x:number;color:string;glow?:number;breath:number;lean?:number;blur?:number}>=({x,color,glow=1,breath,lean=0,blur=0})=>
 <g transform={`translate(${x} ${G}) rotate(${lean}) scale(${breath}) translate(0 ${-G})`} style={blur>0.05?{filter:`blur(${blur}px)`}:undefined}>
  <g stroke={color} fill="none" strokeLinecap="round">
   <g filter="url(#halo)" opacity={0.35*glow} strokeWidth={6}><circle cx={0} cy={G-330} r={44}/><path d={BODY} mask="url(#bodyMask)"/></g>
   <g strokeWidth={2.2}><circle cx={0} cy={G-330} r={44}/><path d={BODY} mask="url(#bodyMask)"/></g>
  </g>
  <circle cx={0} cy={G-330} r={44} fill={color} opacity={0.05*glow}/>
 </g>;

// 倒影：把角色沿地面翻过来，透明度 0.15、模糊、往下渐隐。
export const Reflection:React.FC<{children:React.ReactNode}>=({children})=>
 <g mask="url(#reflMask)"><g transform={`translate(0 ${2*G}) scale(1 -1)`} opacity={0.15} filter="url(#refl)">{children}</g></g>;

// 气泡：中心 (x,y)，尾巴朝下偏一侧。glow=false 时不发光（冷的那只）。w 固定，两只气泡一样大。
export const Bubble:React.FC<{x:number;y:number;text:string;opacity:number;scale?:number;color:string;glow?:boolean;tail?:'left'|'right'}>=({x,y,text,opacity,scale=1,color,glow=true,tail='left'})=>{
 const w=300,h=80,r=22;const tx=tail==='left'?-w/2+46:w/2-46;const tip=tail==='left'?tx-14:tx+14;
 const d=`M ${-w/2+r} ${-h/2} H ${w/2-r} Q ${w/2} ${-h/2} ${w/2} ${-h/2+r} V ${h/2-r} Q ${w/2} ${h/2} ${w/2-r} ${h/2} H ${tx+10} L ${tip} ${h/2+22} L ${tx-10} ${h/2} H ${-w/2+r} Q ${-w/2} ${h/2} ${-w/2} ${h/2-r} V ${-h/2+r} Q ${-w/2} ${-h/2} ${-w/2+r} ${-h/2} Z`;
 return <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
  {glow&&<path d={d} stroke={color} strokeWidth={6} fill="none" opacity={0.35} filter="url(#halo)"/>}
  <path d={d} stroke={color} strokeWidth={2} fill="rgba(11,10,9,0.82)"/>
  <text x={0} y={13} textAnchor="middle" fontFamily={SANS} fontSize={38} fill={color} letterSpacing="3">{text}</text>
 </g>};

// 地面光带：两人之间，越近越短、越红。
export const Band:React.FC<{x1:number;x2:number;color:string;opacity:number}>=({x1,x2,color,opacity})=><g opacity={opacity} strokeLinecap="round">
 <line x1={x1} y1={G+3} x2={x2} y2={G+3} stroke={color} strokeWidth={16} opacity={0.30} filter="url(#halo)"/>
 <line x1={x1} y1={G+3} x2={x2} y2={G+3} stroke={color} strokeWidth={2.5} opacity={0.9}/>
</g>;

// 心跳警报：每一下从胸口扩散一圈光环，半径 2→220px，边扩边变细变淡。
export const Heartbeat:React.FC<{x:number;y:number;beats:number[];dur:number;color:string}>=({x,y,beats,dur,color})=>{const f=useCurrentFrame();
 return <g>{beats.filter(b=>f>=b&&f<b+dur).map(b=>{const p=interpolate(f,[b,b+dur],[0,1],{easing:Easing.out(Easing.cubic),extrapolateRight:'clamp'}); // 心跳是一下冲出去再慢下来，用 ease-out
  return <g key={b}>
   <circle cx={x} cy={y} r={2+218*p} fill="none" stroke={color} strokeWidth={14*(1-p)+0.5} opacity={0.5*(1-p)} filter="url(#halo)"/>
   <circle cx={x} cy={y} r={2+218*p} fill="none" stroke={color} strokeWidth={4*(1-p)+0.4} opacity={Math.min(1,1.2*(1-p))}/>
  </g>})}</g>};

// 「在乎」旋钮（标签写在旋钮中心）：0–10 刻度铺满 270°（0 在左下 -135°，10 在右下 +135°）。angle 是指针角度（0 = 正上方，顺时针为正）。
const polar=(cx:number,cy:number,r:number,a:number)=>[cx+r*Math.sin(a*Math.PI/180),cy-r*Math.cos(a*Math.PI/180)];
const arcPath=(cx:number,cy:number,r:number,a0:number,a1:number)=>{const [x0,y0]=polar(cx,cy,r,a0),[x1,y1]=polar(cx,cy,r,a1);return `M ${x0} ${y0} A ${r} ${r} 0 ${a1-a0>180?1:0} 1 ${x1} ${y1}`};
export const valueToAngle=(v:number)=>-135+27*v;
export const Knob:React.FC<{x:number;y:number;angle:number;opacity:number;light:number;label:string}>=({x,y,angle,opacity,light,label})=>{
 const R=100;
 return <g opacity={opacity}>
  <circle cx={x} cy={y} r={R+30} fill={C.amber} opacity={0.10*light} filter="url(#soft)"/>
  {Array.from({length:11},(_,v)=>{const a=valueToAngle(v);const [ax,ay]=polar(x,y,R+16,a),[bx,by]=polar(x,y,R+(v%5===0?32:26),a),[nx,ny]=polar(x,y,R+52,a);const on=a<=angle+0.5;
   return <g key={v}><line x1={ax} y1={ay} x2={bx} y2={by} stroke={C.amber} strokeWidth={2} opacity={on?0.4+0.6*light:0.22}/>
    <text x={nx} y={ny+8} textAnchor="middle" fontFamily={SANS} fontSize={22} fill={C.amber} opacity={on?0.45+0.5*light:0.25}>{v}</text></g>})}
  {angle>-134&&<path d={arcPath(x,y,R+8,-135,angle)} stroke={C.amber} strokeWidth={4} fill="none" opacity={0.25+0.65*light} strokeLinecap="round"/>}
  <g stroke={C.amber} fill="none" strokeLinecap="round">
   <circle cx={x} cy={y} r={R} strokeWidth={8} opacity={0.3*light} filter="url(#halo)"/>
   <circle cx={x} cy={y} r={R} strokeWidth={2.4} opacity={0.4+0.6*light}/>
   <circle cx={x} cy={y} r={R*0.62} strokeWidth={1.5} opacity={0.3+0.3*light}/>
   <g transform={`rotate(${angle} ${x} ${y})`}><line x1={x} y1={y-R+16} x2={x} y2={y-R*0.7} strokeWidth={6} opacity={0.5+0.5*light}/></g>
  </g>
  <text x={x+4} y={y+12} textAnchor="middle" fontFamily={SANS} fontSize={32} letterSpacing="8" fill={C.amber} opacity={0.5+0.5*light}>{label}</text>
 </g>};
