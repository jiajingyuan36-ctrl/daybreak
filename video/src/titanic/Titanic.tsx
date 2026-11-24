import {AbsoluteFill,Audio,OffthreadVideo,Sequence,interpolate,staticFile,useCurrentFrame} from 'remotion';
import '@fontsource/noto-serif-sc/300.css';
import cfg from './titanic-shots.json';
import {Grain} from '../engine/OpticalPolish';
import {clamp} from '../design/tokens';

// 《两小时四十分》泰坦尼克号历史重现短片。分镜见 content-kit/titanic/两小时四十分-分镜脚本.md，
// 剪辑表在 titanic-shots.json；素材先跑 python3 scripts/film-prep.py titanic <素材目录>，声音跑 scripts/generate-titanic-audio.py。
// 现在是第一批样片（Muse 第一批 6 个镜头）；后两批到了以后按分镜往表里插镜头即可。
type Shot={id:string;name:string;src:string;in:number;dur:number;x:number;gap?:number;fade?:number;fadeOut?:number;y?:number;lightsOut?:number};
const FPS=cfg.fps;
const TAIL=12;

export const timeline=()=>{let at=0;const out:(Shot&{from:number;len:number})[]=[];
 (cfg.shots as Shot[]).forEach((s,i)=>{const len=Math.round(s.dur*FPS);at+=s.gap??0;if(i>0&&!s.gap)at-=s.x;out.push({...s,from:at,len});at+=len;});
 return {shots:out,end:at};};
const T=timeline();
export const TITANIC_FRAMES=T.end+TAIL;
const sh=(id:string)=>T.shots.find(s=>s.id===id)!;
const s=(sec:number)=>Math.round(sec*FPS);

const BAR=Math.round((1080-1920/2.39)/2);   // 2.39:1 黑边，上下各 138px
const serif="'Noto Serif SC',serif";

const ShotLayer=({x}:{x:ReturnType<typeof timeline>['shots'][number]})=>{
 const f=useCurrentFrame();
 const fin=x.gap?(x.fade??0):x.x;
 const inO=fin>0?interpolate(f,[0,fin],[0,1],clamp):1;
 const outO=x.fadeOut?interpolate(f,[x.len-x.fadeOut,x.len],[1,0],clamp):1;
 return <AbsoluteFill style={{opacity:Math.min(inO,outO)}}>
  <OffthreadVideo muted src={staticFile(`footage/titanic/${x.id}.mp4`)} style={{width:'100%',height:'100%',objectFit:'cover',transform:`translateY(${x.y??0}%)`}}/>
 </AbsoluteFill>};

// 字幕：左下，淡入 0.5 秒同时上移 6px，停留，淡出 0.5 秒；center=居中（片名）
const Caption=({lines,from,len,center=false,big=false}:{lines:string[];from:number;len:number;center?:boolean;big?:boolean})=>{
 const f=useCurrentFrame()-from;if(f<0||f>len)return null;
 const fd=FPS/2;const o=Math.min(interpolate(f,[0,fd],[0,1],clamp),interpolate(f,[len-fd,len],[1,0],clamp));
 const dy=interpolate(f,[0,fd],[6,0],clamp);
 const pos:React.CSSProperties=center?{left:0,right:0,top:0,bottom:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}
  :{left:'6%',bottom:BAR+Math.round(1080*0.06)};
 return <div style={{position:'absolute',...pos,opacity:o*.88,transform:`translateY(${dy}px)`,fontFamily:serif,fontWeight:300,color:'#fff',
  letterSpacing:'.22em',textShadow:'0 1px 14px rgba(0,0,0,.75),0 0 3px rgba(0,0,0,.55)',lineHeight:1.8,textAlign:center?'center':'left'}}>
  {lines.map((l,i)=><div key={i} style={{fontSize:big?(i===0?30:46):(i===0?30:24)}}>{l}</div>)}
 </div>};

export const TITLE_AT=sh('t19').from-(sh('t19').gap??0)+s(.5);
export const LIGHTS_OUT=sh('t16').from+s(sh('t16').lightsOut!);

export const Titanic=({captions=true}:{captions?:boolean})=>
 <AbsoluteFill style={{background:'#000'}}>
  {T.shots.map(x=><Sequence key={x.id} from={x.from} durationInFrames={x.len}><ShotLayer x={x}/></Sequence>)}
  <Grain opacity={.07}/>
  <AbsoluteFill style={{pointerEvents:'none'}}>
   <div style={{position:'absolute',left:0,right:0,top:0,height:BAR,background:'#000'}}/>
   <div style={{position:'absolute',left:0,right:0,bottom:0,height:BAR,background:'#000'}}/>
  </AbsoluteFill>
  {captions&&<>
   <Caption lines={['北大西洋　水下 3800 米']} from={sh('t02').from+s(.8)} len={s(3.5)}/>
   <Caption lines={['1912 年 4 月 10 日','泰坦尼克号从南安普敦出发，首航纽约']} from={sh('t03b').from+s(.4)} len={s(4.6)}/>
   <Caption lines={['4 月 14 日 23:40　撞上冰山','引擎停了']} from={sh('t12').from+s(.3)} len={s(2.8)}/>
   <Caption lines={['02:18']} from={LIGHTS_OUT-s(1.6)} len={s(2.6)}/>
   <Caption lines={['02:20']} from={sh('t17b').from+s(.3)} len={s(2.4)}/>
   <Caption lines={['1985 年 9 月 1 日','人们在 3800 米深处找到了她']} from={sh('t19').from+s(.4)} len={s(3)}/>
  </>}
  <Caption lines={['23:40 → 02:20','两小时四十分']} from={TITLE_AT} len={s(4)} center big/>
  <Audio src={staticFile('audio/titanic_mix.wav')}/>
 </AbsoluteFill>;
