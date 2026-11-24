import React from 'react';
import {AbsoluteFill,Easing,interpolate,random,useCurrentFrame,useVideoConfig} from 'remotion';
import {C,SANS,SERIF,SPOT,tw} from './theme';
import {CAPTIONS,SOURCE_TAGS} from './copy';

// ── 屏幕空间（不随摄像机缩放）────────────────────────────
// 背景：中性暖黑底 + 跟着摄像机焦点走的暖色聚光（中心 #33261A，半径 55% 画面宽，中心一段持平再柔和衰减）。
export const Backdrop:React.FC<{spotX:number;spotY:number;gain?:number}>=({spotX,spotY,gain=1})=><AbsoluteFill style={{background:C.bg}}>
 <AbsoluteFill style={{opacity:gain,background:`radial-gradient(circle 1056px at ${spotX}px ${spotY}px, ${SPOT} 0%, ${SPOT} 50%, rgba(51,38,26,0.55) 72%, rgba(51,38,26,0.15) 88%, rgba(10,10,11,0) 100%)`}}/>
</AbsoluteFill>;

// 浮尘：50 颗，半径 1–2px，透明度 0.05–0.15，慢慢漂；depth 越大离镜头越近，跟着摄像机平移得越多（视差）。
const DUST=Array.from({length:50},(_,i)=>({x:random('dx'+i)*1960,y:random('dy'+i)*1120,r:1+random('dr'+i),o:0.05+random('do'+i)*0.10,d:0.3+random('dd'+i)*1.4,vx:(random('vx'+i)-0.5)*14,vy:-4-random('vy'+i)*8,ph:random('ph'+i)*6.28}));
export const Dust:React.FC<{panX:number;panY:number;gain?:number}>=({panX,panY,gain=1})=>{const f=useCurrentFrame();const {fps}=useVideoConfig();const t=f/fps;
 const W=1960,H=1120,wrap=(v:number,m:number)=>((v%m)+m)%m-20;
 return <svg width="1920" height="1080" style={{position:'absolute',inset:0,opacity:gain}}>
  {DUST.map((p,i)=><circle key={i} cx={wrap(p.x+p.vx*t*p.d+Math.sin(t*0.7+p.ph)*6-panX*p.d*0.35,W)} cy={wrap(p.y+p.vy*t*p.d-panY*p.d*0.35,H)} r={p.r*(0.7+p.d*0.4)} fill={C.ivory} opacity={p.o}/>)}
 </svg>};

export const Grain:React.FC=()=>{const f=useCurrentFrame();
 return <svg width="1920" height="1080" style={{position:'absolute',inset:0,opacity:0.04}}>
  <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={f} stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
  <rect width="1920" height="1080" filter="url(#grain)"/>
 </svg>};

export const Vignette:React.FC=()=><AbsoluteFill style={{background:'radial-gradient(ellipse 72% 72% at 50% 52%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.35) 100%)'}}/>;

// ── 字幕 ────────────────────────────────────────────────
// 逐字淡入并上移 8px（默认每字间隔 35ms）；整句 0.3 秒淡出；下一句在上一句淡出的最后 0.2 秒里开始，前后交叉。
// 第一句第 0 帧就完整在场（通用规则：第 0 帧必须是完整画面）。
const KEY:Record<string,{color:string;glow:string}>={
 r:{color:C.red,glow:'0 0 14px rgba(200,71,61,0.55)'},
 c:{color:C.cold,glow:'0 0 12px rgba(242,237,228,0.35)'},
 a:{color:C.amber,glow:'0 0 14px rgba(232,176,74,0.55)'},
 w:{color:C.ivory,glow:'0 0 16px rgba(242,237,228,0.6)'},
};
type Glyph={ch:string;k?:string;br?:boolean};
const parse=(s:string)=>{const out:Glyph[]=[];let k:string|undefined;const cs=[...s];
 for(let i=0;i<cs.length;i++){const ch=cs[i];
  if(ch==='{'){k=cs[i+1];i+=2;continue}
  if(ch==='}'){k=undefined;continue}
  if(ch==='\n'){out.push({ch,br:true});continue}
  out.push({ch,k})}
 return out};
const SHADOW='0 2px 12px rgba(0,0,0,0.6), 0 0 40px rgba(242,237,228,0.12)';
export const Caption:React.FC<{end:number}>=({end})=>{const f=useCurrentFrame();const {fps}=useVideoConfig();const ms=(x:number)=>x/1000*fps;
 return <>{CAPTIONS.map((c,i)=>{const a=c.from*fps,b=c.to*fps;
  const outA=b-ms(100),outB=b+ms(200);
  const last=b>=end;
  if(f<a||(!last&&f>=outB))return null;
  const out=last?1:tw(f,[outA,outB],[1,0]);
  const gl=parse(c.text);let line=0,idx=0;
  return <div key={i} style={{position:'absolute',top:c.size?78:92,left:80,right:80,textAlign:'center',opacity:out,fontFamily:SERIF,fontWeight:c.bold?700:400,fontSize:c.size??64,lineHeight:1.4,letterSpacing:'0.05em',color:C.ivory,textShadow:SHADOW}}>
   {gl.map((g,j)=>{if(g.br){line++;idx=0;return <br key={j}/>}
    const st=a+ms((c.stagger??35)*idx)+(line>0?(c.line2Delay??0)*fps:0);idx++;
    const o=a===0?1:tw(f,[st,st+ms(320)],[0,1]);const y=a===0?0:tw(f,[st,st+ms(320)],[8,0]);
    const key=g.k?KEY[g.k]:undefined;
    return <span key={j} style={{display:'inline-block',opacity:o,translate:`0px ${y}px`,color:key?.color,textShadow:key?`${SHADOW}, ${key.glow}`:undefined}}>{g.ch}</span>})}
  </div>})}</>};

// 研究出处：右下角小字。
export const SourceTag:React.FC=()=>{const f=useCurrentFrame();const {fps}=useVideoConfig();
 return <>{SOURCE_TAGS.map(s=>{const o=tw(f,[s.from*fps,(s.from+0.5)*fps,(s.to-0.4)*fps,s.to*fps],[0,1,1,0]);if(o<=0)return null;
  return <div key={s.text} style={{position:'absolute',right:64,bottom:44,fontFamily:SANS,fontSize:24,letterSpacing:'0.04em',color:C.ivory,opacity:0.6*o,textShadow:'0 2px 8px rgba(0,0,0,0.7)'}}>{s.text}</div>})}</>};

// ── 场景（世界坐标，放在摄像机容器里）──────────────────
export const G=820; // 地面
export const Defs:React.FC=()=><defs>
 <filter id="halo" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="6"/></filter>
 <filter id="bloom" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="20"/></filter>
 <filter id="soft" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="16"/></filter>
 <filter id="refl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
 <linearGradient id="bodyFade" x1="0" y1={G-330} x2="0" y2={G} gradientUnits="userSpaceOnUse"><stop offset="0.45" stopColor="#fff"/><stop offset="1" stopColor="#fff" stopOpacity="0.06"/></linearGradient>
 <mask id="bodyMask" maskUnits="userSpaceOnUse" x="-400" y={G-560} width="800" height="700"><rect x="-400" y={G-560} width="800" height="700" fill="url(#bodyFade)"/></mask>
 {/* 倒影：往下 120px 内渐隐 */}
 <linearGradient id="reflFade" x1="0" y1={G} x2="0" y2={G+120} gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#fff"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></linearGradient>
 <mask id="reflMask" maskUnits="userSpaceOnUse" x="-2000" y={G} width="6000" height="200"><rect x="-2000" y={G} width="6000" height="200" fill="url(#reflFade)"/></mask>
 <linearGradient id="horizon" x1="0" x2="1"><stop offset="0" stopColor={C.ivory} stopOpacity="0"/><stop offset="0.5" stopColor={C.ivory} stopOpacity="0.10"/><stop offset="1" stopColor={C.ivory} stopOpacity="0"/></linearGradient>
 <radialGradient id="doorInside" cx="0.5" cy="0.55" r="0.7"><stop offset="0" stopColor={C.red} stopOpacity="0.6"/><stop offset="0.6" stopColor={C.red} stopOpacity="0.25"/><stop offset="1" stopColor={C.red} stopOpacity="0.06"/></radialGradient>
</defs>;

// 三层发光：40px 大范围柔光（0.12）+ 12px 外辉光（0.35）+ 2px 实线。children 是一组只描边的形状。
const Glow:React.FC<{color:string;glow:number;width?:number;children:React.ReactNode}>=({color,glow,width=2.2,children})=><g stroke={color} fill="none" strokeLinecap="round" strokeLinejoin="round">
 {glow>0.01&&<g filter="url(#bloom)" opacity={0.12*glow} strokeWidth={10}>{children}</g>}
 {glow>0.01&&<g filter="url(#halo)" opacity={0.35*glow} strokeWidth={6}>{children}</g>}
 <g strokeWidth={width}>{children}</g>
</g>;

// 角色：圆头，脖子留空隙，圆滑斜肩，身体往下渐隐、不画脚。
// breath 呼吸缩放，lean 前后倾（度），sx 转身时的横向压缩，head 头的偏移，sink 整体下沉，blur 焦外虚化。
// arm：从左肩自然长出的手臂（本地坐标的路径），progress 0..1 画出来，末端一个小圆当手。
const BODY=`M -64 ${G} C -64 ${G-120} -67 ${G-205} -52 ${G-238} Q -32 ${G-268} 0 ${G-270} Q 32 ${G-268} 52 ${G-238} C 67 ${G-205} 64 ${G-120} 64 ${G}`;
export type Arm={d:string;hand:[number,number];progress:number;opacity:number};
export const Figure:React.FC<{x:number;color:string;glow?:number;breath:number;lean?:number;sx?:number;headX?:number;headY?:number;sink?:number;blur?:number;arm?:Arm;opacity?:number}>=({x,color,glow=1,breath,lean=0,sx=1,headX=0,headY=0,sink=0,blur=0,arm,opacity=1})=>
 <g opacity={opacity} transform={`translate(${x} ${G+sink}) rotate(${lean}) scale(${breath*sx} ${breath}) translate(0 ${-G})`} style={blur>0.05?{filter:`blur(${blur}px)`}:undefined}>
  <Glow color={color} glow={glow}>
   <circle cx={headX} cy={G-330+headY} r={44}/>
   <path d={BODY} mask="url(#bodyMask)"/>
   {arm&&arm.opacity>0.01&&<path d={arm.d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1-arm.progress} opacity={arm.opacity}/>}
   {arm&&arm.progress>0.97&&<circle cx={arm.hand[0]} cy={arm.hand[1]} r={7} opacity={arm.opacity*tw(arm.progress,[0.97,1],[0,1])}/>}
  </Glow>
  <circle cx={headX} cy={G-330+headY} r={44} fill={color} opacity={0.05*glow}/>
 </g>;

// 倒影：沿地面翻过来，透明度 0.22，模糊 6px，往下 120px 内渐隐。
export const Reflection:React.FC<{children:React.ReactNode}>=({children})=>
 <g mask="url(#reflMask)"><g transform={`translate(0 ${2*G}) scale(1 -1)`} opacity={0.22} filter="url(#refl)">{children}</g></g>;

// 气泡：两种气泡同一个形状（圆角 18px），尾巴在底边，tail 指向说话的人那一侧。
export const Bubble:React.FC<{x:number;y:number;text:string;opacity:number;scale?:number;color:string;glow?:boolean;fill:string;tail:'left'|'right';stroke?:number}>=({x,y,text,opacity,scale=1,color,glow=true,fill,tail,stroke=2})=>{
 const w=300,h=80,r=18;const tx=tail==='left'?-w/2+46:w/2-46;const tip=tail==='left'?tx-16:tx+16;
 const d=`M ${-w/2+r} ${-h/2} H ${w/2-r} Q ${w/2} ${-h/2} ${w/2} ${-h/2+r} V ${h/2-r} Q ${w/2} ${h/2} ${w/2-r} ${h/2} H ${tx+10} L ${tip} ${h/2+22} L ${tx-10} ${h/2} H ${-w/2+r} Q ${-w/2} ${h/2} ${-w/2} ${h/2-r} V ${-h/2+r} Q ${-w/2} ${-h/2} ${-w/2+r} ${-h/2} Z`;
 return <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
  {glow&&<path d={d} stroke={color} strokeWidth={10} fill="none" opacity={0.12} filter="url(#bloom)"/>}
  {glow&&<path d={d} stroke={color} strokeWidth={6} fill="none" opacity={0.35} filter="url(#halo)"/>}
  <path d={d} stroke={color} strokeWidth={stroke} fill={fill}/>
  <text x={0} y={13} textAnchor="middle" fontFamily={SANS} fontSize={38} fill={color} letterSpacing="3">{text}</text>
 </g>};

// 地面光带：两人之间，越近越短、越红。
export const Band:React.FC<{x1:number;x2:number;color:string;opacity:number}>=({x1,x2,color,opacity})=>opacity<0.01?null:<g opacity={opacity} strokeLinecap="round">
 <line x1={x1} y1={G+3} x2={x2} y2={G+3} stroke={color} strokeWidth={16} opacity={0.30} filter="url(#halo)"/>
 <line x1={x1} y1={G+3} x2={x2} y2={G+3} stroke={color} strokeWidth={2.5} opacity={0.9}/>
</g>;

// 心跳警报：每一下从胸口扩散一圈光环，半径 2→220px，边扩边变细变淡（先冲出去再慢下来）。
export const Heartbeat:React.FC<{x:number;y:number;beats:number[];dur:number;color:string}>=({x,y,beats,dur,color})=>{const f=useCurrentFrame();
 return <g>{beats.filter(b=>f>=b&&f<b+dur).map(b=>{const p=interpolate(f,[b,b+dur],[0,1],{easing:Easing.out(Easing.cubic),extrapolateRight:'clamp'});
  return <g key={b}>
   <circle cx={x} cy={y} r={2+218*p} fill="none" stroke={color} strokeWidth={14*(1-p)+0.5} opacity={0.5*(1-p)} filter="url(#halo)"/>
   <circle cx={x} cy={y} r={2+218*p} fill="none" stroke={color} strokeWidth={4*(1-p)+0.4} opacity={Math.min(1,1.2*(1-p))}/>
  </g>})}</g>};

// 胸口的警报核心：一个清楚的小核心 + 一圈柔光。
export const ChestCore:React.FC<{x:number;y:number;level:number}>=({x,y,level})=>level<0.01?null:<g opacity={level}>
 <circle cx={x} cy={y} r={22} fill={C.red} opacity={0.45} filter="url(#halo)"/>
 <circle cx={x} cy={y} r={7} fill={C.red}/>
 <circle cx={x} cy={y} r={3} fill="#F3B4A8" opacity={0.8}/>
</g>;

// 「在乎」旋钮（标签写在旋钮中心）：0–10 刻度铺满 270°（0 在左下 -135°，10 在右下 +135°）。angle 是指针角度（0 = 正上方，顺时针为正）。
const polar=(cx:number,cy:number,r:number,a:number)=>[cx+r*Math.sin(a*Math.PI/180),cy-r*Math.cos(a*Math.PI/180)];
const arcPath=(cx:number,cy:number,r:number,a0:number,a1:number)=>{const [x0,y0]=polar(cx,cy,r,a0),[x1,y1]=polar(cx,cy,r,a1);return `M ${x0} ${y0} A ${r} ${r} 0 ${a1-a0>180?1:0} 1 ${x1} ${y1}`};
export const valueToAngle=(v:number)=>-135+27*v;
export const Knob:React.FC<{x:number;y:number;angle:number;opacity:number;light:number;label:string;R?:number;numbers?:boolean}>=({x,y,angle,opacity,light,label,R=100,numbers=true})=>opacity<0.01?null:
 <g opacity={opacity}>
  <circle cx={x} cy={y} r={R+30} fill={C.amber} opacity={0.10*light} filter="url(#soft)"/>
  {Array.from({length:11},(_,v)=>{const a=valueToAngle(v);const [ax,ay]=polar(x,y,R+16*R/100,a),[bx,by]=polar(x,y,R+(v%5===0?32:26)*R/100,a),[nx,ny]=polar(x,y,R+52*R/100,a);const on=a<=angle+0.5;
   return <g key={v}><line x1={ax} y1={ay} x2={bx} y2={by} stroke={C.amber} strokeWidth={2} opacity={on?0.4+0.6*light:0.22}/>
    {numbers&&<text x={nx} y={ny+8} textAnchor="middle" fontFamily={SANS} fontSize={22} fill={C.amber} opacity={on?0.45+0.5*light:0.25}>{v}</text>}</g>})}
  {angle>-134&&<path d={arcPath(x,y,R+8*R/100,-135,angle)} stroke={C.amber} strokeWidth={4} fill="none" opacity={0.25+0.65*light} strokeLinecap="round"/>}
  <Glow color={C.amber} glow={light}>
   <circle cx={x} cy={y} r={R}/>
  </Glow>
  <g stroke={C.amber} fill="none" strokeLinecap="round">
   <circle cx={x} cy={y} r={R*0.62} strokeWidth={1.5} opacity={0.3+0.3*light}/>
   <g transform={`rotate(${angle} ${x} ${y})`}><line x1={x} y1={y-R+16*R/100} x2={x} y2={y-R*0.7} strokeWidth={6*R/100+1} opacity={0.5+0.5*light}/></g>
  </g>
  {label&&<text x={x+4} y={y+12*R/100} textAnchor="middle" fontFamily={SANS} fontSize={32*R/100} letterSpacing={8*R/100} fill={C.amber} opacity={0.5+0.5*light}>{label}</text>}
 </g>;

// 门：竖长圆角矩形门框（琥珀细描边，draw 0..1 描出来），门板以右边为轴；slit 是左侧门缝的宽度（px），
// open 0..1 是门板被冲开的程度，leak 是门缝里光的颜色（暗红或琥珀），light 是光的强度。
export const Door:React.FC<{x:number;w:number;h:number;draw:number;slit:number;open:number;light:number;leak:string;frame?:number}>=({x,w,h,draw,slit,open,light,leak,frame=1})=>{
 if(draw<0.01)return null;
 const L=x-w/2,R=x+w/2,T=G-h,r=18;
 const frameD=`M ${L} ${G} V ${T+r} Q ${L} ${T} ${L+r} ${T} H ${R-r} Q ${R} ${T} ${R} ${T+r} V ${G}`;
 const pl=L+4+slit+open*(w-8-slit)*0.82,inset=open*44;
 const panel=`M ${pl} ${T+6+inset} L ${R-4} ${T+6} L ${R-4} ${G} L ${pl} ${G-inset*0.3} Z`;
 const gap=pl-(L+4);
 return <g>
  {/* 门里的光（被门板挡住的部分看不见） */}
  <rect x={L+4} y={T+6} width={w-8} height={h-6} fill="url(#doorInside)" opacity={0.5*light*Math.min(1,gap/40+open)} rx={12}/>
  <rect x={L+4} y={T+6} width={Math.max(0,Math.min(gap,14))} height={h-6} fill={leak} opacity={0.9*light} filter="url(#halo)"/>
  {/* 门缝的光：一条竖亮线 + 柔光，往外漏到地面 */}
  <line x1={L+4+gap/2} y1={T+10} x2={L+4+gap/2} y2={G} stroke={leak} strokeWidth={Math.max(1.5,Math.min(gap,14))} opacity={light} filter="url(#halo)"/>
  <line x1={L+4+gap/2} y1={T+14} x2={L+4+gap/2} y2={G} stroke={mixLight(leak)} strokeWidth={Math.max(1,Math.min(3,gap*0.4))} opacity={light}/>
  <ellipse cx={L+gap/2} cy={G+6} rx={60+gap*3} ry={10} fill={leak} opacity={0.35*light} filter="url(#halo)"/>
  {/* 门板 */}
  <path d={panel} fill="rgba(22,17,13,0.55)" stroke={C.amber} strokeWidth={1.4} strokeOpacity={0.45*frame} opacity={draw}/>
  {/* 门框 */}
  <g opacity={frame}><Glow color={C.amber} glow={0.8}><path d={frameD} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1-draw}/></Glow></g>
 </g>};
const mixLight=(c:string)=>c===C.red?'#F0A090':'#FFE2A8';

// 念头：暗红色细字，轻微抖动（每 3 帧换一次每个字的小偏移和角度，像手写的颤）。trail 给运动模糊（沿速度方向的几层残影）。
export const Thought:React.FC<{text:string;x:number;y:number;opacity:number;anchor?:'start'|'end'|'middle';size?:number;rot?:number;seed:string;trail?:[number,number];jitter?:number}>=({text,x,y,opacity,anchor='start',size=36,rot=0,seed,trail,jitter=1})=>{
 const f=useCurrentFrame();if(opacity<0.01)return null;const step=Math.floor(f/3);const cs=[...text];
 const dy=cs.map((_,i)=>((random(`${seed}y${i}${step}`)-0.5)*3*jitter).toFixed(2)).join(' ');
 const rr=cs.map((_,i)=>((random(`${seed}r${i}${step}`)-0.5)*7*jitter).toFixed(1)).join(' ');
 const T=(dx:number,dy2:number,o:number,k:number)=><text key={k} x={x+dx} y={y+dy2} textAnchor={anchor} fontFamily={SERIF} fontSize={size} fill={C.red} opacity={o} dy={dy} rotate={rr} transform={`translate(${x} ${y}) rotate(${rot}) skewX(-8) translate(${-x} ${-y})`} letterSpacing="2">{text}</text>;
 return <g opacity={opacity}>
  <g filter="url(#halo)" opacity={0.5}>{T(0,0,1,-1)}</g>
  {trail&&[2,1].map(k=>T(-trail[0]*k*1.5,-trail[1]*k*1.5,0.1*(3-k),k))}
  {T(0,0,1,0)}
 </g>};

// 「记住这串数字」的重箱子：米白描边方块。
export const MemoryBox:React.FC<{x:number;y:number;rot:number;opacity:number;lines:string[]}>=({x,y,rot,opacity,lines})=>opacity<0.01?null:
 <g transform={`translate(${x} ${y}) rotate(${rot})`} opacity={opacity}>
  <rect x={-150} y={-56} width={300} height={112} rx={10} fill="rgba(10,10,11,0.85)"/>
  <Glow color={C.ivory} glow={0.6}><rect x={-150} y={-56} width={300} height={112} rx={10}/></Glow>
  <text x={0} y={-10} textAnchor="middle" fontFamily={SANS} fontSize={28} fill={C.ivory} letterSpacing="2">{lines[0]}</text>
  <text x={0} y={34} textAnchor="middle" fontFamily={SANS} fontSize={34} fill={C.ivory} letterSpacing="4">{lines[1]}</text>
 </g>;
