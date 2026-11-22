import {AbsoluteFill,Img,interpolate,random,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import type {ReactNode} from 'react';
import {EASE_CINEMA,clamp} from '../design/tokens';

// 2.5D 景深视差摄影机：底图、中景信息层、前景微尘三层按不同速率运动。
// - zoom：推镜关键帧（秒 → 倍率），段与段之间用电影缓动，可做变速推镜（speed ramp）
// - shakes：冲击抖动（秒、帧数、幅度、方向）
// - rack：景深切换，返回底图在该时刻的虚化像素（前景信息出场时把底图推远）
// - aberration：这些帧给底图加极轻的 RGB 色散
export type Shake={at:number;frames:number;amp:number;dir?:'down'|'x'};
export type RigProps={image:string;mask:number;zoom:[number,number][];origin?:string;shakes?:Shake[];rack?:(t:number)=>number;aberration?:number[];
 tilt?:number;dust?:number;children?:ReactNode;tint?:ReactNode};

const zoomAt=(t:number,keys:[number,number][])=>{
 if(t<=keys[0][0])return keys[0][1];
 for(let i=1;i<keys.length;i++)if(t<=keys[i][0])return interpolate(t,[keys[i-1][0],keys[i][0]],[keys[i-1][1],keys[i][1]],{...clamp,easing:EASE_CINEMA});
 return keys[keys.length-1][1];};

export const shakeOffset=(f:number,fps:number,shakes:Shake[]=[])=>{let x=0,y=0;
 for(const s of shakes){const k=f-Math.round(s.at*fps);if(k<0||k>=s.frames)continue;
  const decay=1-k/s.frames;const sign=k%2===0?1:-1;
  if(s.dir==='down'){y+=(k===0?1:sign*.5)*s.amp*decay;}else{x+=sign*s.amp*decay;y+=(random(`sy${f}`)-.5)*s.amp*.4*decay;}}
 return {x,y};};

const Dust=({count,seed}:{count:number;seed:string})=>{const f=useCurrentFrame();const {fps}=useVideoConfig();const t=f/fps;
 return <AbsoluteFill style={{pointerEvents:'none'}}>
  <svg width="1080" height="1920">{Array.from({length:count},(_,i)=>{
   const x0=random(`${seed}x${i}`)*1080,y0=random(`${seed}y${i}`)*1920,sp=8+random(`${seed}s${i}`)*18,r=1.2+random(`${seed}r${i}`)*2.6;
   const y=((y0-t*sp)%1920+1920)%1920,x=x0+Math.sin(t*.6+i)*14;
   return <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity={.1+.18*random(`${seed}o${i}`)} style={{filter:`blur(${r>2.6?1.6:.6}px)`}}/>;})}</svg>
 </AbsoluteFill>};

export const CameraRig=({image,mask,zoom,origin='50% 50%',shakes,rack,aberration=[],tilt=1,dust=22,children,tint}:RigProps)=>{
 const f=useCurrentFrame();const {fps,durationInFrames}=useVideoConfig();const t=f/fps;const p=f/durationInFrames;
 const z=zoomAt(t,zoom);const {x,y}=shakeOffset(f,fps,shakes);const blur=rack?rack(t):0;
 const ca=aberration.includes(f);
 const rx=Math.sin(t*.35)*.6*tilt,ry=Math.cos(t*.28)*1.1*tilt;
 return <AbsoluteFill style={{overflow:'hidden',background:'#000',translate:`${x}px ${y}px`}}>
  <svg width="0" height="0" style={{position:'absolute'}}><filter id="rgb-split" x="-5%" y="-5%" width="110%" height="110%">
   <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r"/><feOffset in="r" dx="7" dy="0" result="r2"/>
   <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g"/>
   <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b"/><feOffset in="b" dx="-7" dy="0" result="b2"/>
   <feBlend in="r2" in2="g" mode="screen" result="rg"/><feBlend in="rg" in2="b2" mode="screen"/></filter></svg>
  {/* 底图层：推镜 + 极轻 3D 微倾 + 慢速上移视差 */}
  <AbsoluteFill style={{perspective:1200}}>
   <AbsoluteFill style={{transformOrigin:origin,scale:z,translate:`0px ${-p*18}px`,transform:`rotateX(${rx}deg) rotateY(${ry}deg)`,filter:`${blur>0?`blur(${blur}px)`:''} ${ca?'url(#rgb-split)':''}`.trim()||undefined}}>
    <Img src={staticFile(image)} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
   </AbsoluteFill>
  </AbsoluteFill>
  {tint}
  <AbsoluteFill style={{background:`rgba(0,0,0,${mask})`}}/>
  <AbsoluteFill style={{background:'linear-gradient(180deg,rgba(0,0,0,.52) 0%,rgba(0,0,0,0) 22%,rgba(0,0,0,0) 68%,rgba(0,0,0,.58) 100%)'}}/>
  {/* 中景信息层：比底图慢半拍的反向视差 */}
  <AbsoluteFill style={{translate:`${-ry*2}px ${p*8}px`}}>{children}</AbsoluteFill>
  {/* 前景微尘：最快的一层 */}
  {dust>0&&<Dust count={dust} seed={image}/>}
 </AbsoluteFill>};
