import {AbsoluteFill,Audio,OffthreadVideo,Sequence,interpolate,staticFile,useCurrentFrame} from 'remotion';
import '@fontsource/noto-serif-sc/300.css';
import cfg from './everest-shots.json';
import {Grain} from '../engine/OpticalPolish';
import {clamp} from '../design/tokens';

// 《光，退回山顶》珠峰北坡纪录短片。分镜见 content-kit/everest/光退回山顶-分镜脚本.md，
// 剪辑表在 everest-shots.json；素材先跑 scripts/everest-prep.py，声音跑 scripts/generate-everest-audio.py。
type Shot={id:string;name:string;src:string;in:number;dur:number;x:number;y?:number;ember?:number};
const FPS=cfg.fps;
const FIRST=36;                 // 黑场 1.5 秒后开始淡入第一个镜头
const OUT_FADE=24;              // 最后一镜淡出到黑
const TITLE_GAP=12, TITLE_LEN=72, TAIL=12;

export const timeline=()=>{let at=FIRST;const out:(Shot&{from:number;len:number})[]=[];
 (cfg.shots as Shot[]).forEach((s,i)=>{const len=Math.round(s.dur*FPS);if(i>0)at-=s.x;out.push({...s,from:at,len});at+=len;});
 return {shots:out,end:at};};
const T=timeline();
export const TITLE_AT=T.end+TITLE_GAP;
export const EVEREST_FRAMES=TITLE_AT+TITLE_LEN+TAIL;
const sh=(id:string)=>T.shots.find(s=>s.id===id)!;

const BAR=Math.round((1080-1920/2.39)/2);   // 2.39:1 黑边，上下各 138px
const serif="'Noto Serif SC',serif";

const ShotLayer=({s,last}:{s:ReturnType<typeof timeline>['shots'][number];last:boolean})=>{
 const f=useCurrentFrame();
 const inO=s.x>0?interpolate(f,[0,s.x],[0,1],clamp):1;
 const outO=last?interpolate(f,[s.len-OUT_FADE,s.len],[1,0],clamp):1;
 return <AbsoluteFill style={{opacity:Math.min(inO,outO)}}>
  <OffthreadVideo muted src={staticFile(`footage/everest/${s.id}.mp4`)} style={{width:'100%',height:'100%',objectFit:'cover',transform:`translateY(${s.y??0}%)`}}/>
 </AbsoluteFill>};

// 字幕：淡入 0.5 秒同时上移 6px，停留，淡出 0.5 秒
const Caption=({lines,from,len,center=false}:{lines:string[];from:number;len:number;center?:boolean})=>{
 const f=useCurrentFrame()-from;if(f<0||f>len)return null;
 const fd=FPS/2;const o=Math.min(interpolate(f,[0,fd],[0,1],clamp),interpolate(f,[len-fd,len],[1,0],clamp));
 const dy=interpolate(f,[0,fd],[6,0],clamp);
 const pos:React.CSSProperties=center?{left:0,right:0,top:0,bottom:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}
  :{left:'6%',bottom:BAR+Math.round(1080*0.06)};
 return <div style={{position:'absolute',...pos,opacity:o*.85,transform:`translateY(${dy}px)`,fontFamily:serif,fontWeight:300,color:'#fff',
  letterSpacing:'.25em',textShadow:'0 1px 14px rgba(0,0,0,.75),0 0 3px rgba(0,0,0,.55)',lineHeight:1.7,textAlign:center?'center':'left'}}>
  {lines.map((l,i)=><div key={i} style={{fontSize:i===0?30:24}}>{l}</div>)}
 </div>};

const s=(sec:number)=>Math.round(sec*FPS);

export const Everest=({captions=true}:{captions?:boolean})=>{
 const f=useCurrentFrame();
 const titleO=Math.min(interpolate(f,[TITLE_AT,TITLE_AT+FPS/2],[0,1],clamp),interpolate(f,[TITLE_AT+TITLE_LEN-FPS/2,TITLE_AT+TITLE_LEN],[1,0],clamp));
 return <AbsoluteFill style={{background:'#000'}}>
  {T.shots.map((x,i)=><Sequence key={x.id} from={x.from} durationInFrames={x.len}><ShotLayer s={x} last={i===T.shots.length-1}/></Sequence>)}
  <Grain opacity={.07}/>
  <AbsoluteFill style={{pointerEvents:'none'}}>
   <div style={{position:'absolute',left:0,right:0,top:0,height:BAR,background:'#000'}}/>
   <div style={{position:'absolute',left:0,right:0,bottom:0,height:BAR,background:'#000'}}/>
  </AbsoluteFill>
  {captions&&<>
   <Caption lines={['喜马拉雅山脉　中国西藏']} from={s(4)} len={s(3)}/>
   <Caption lines={['峰顶的岩石','形成于约 4.5 亿年前的海底']} from={sh('03').from+s(1.5)} len={s(4)}/>
   <Caption lines={['珠穆朗玛峰　北壁','西风在峰顶扯出云旗']} from={sh('04').from+s(2)} len={s(4)}/>
   <Caption lines={['绒布冰川']} from={sh('07').from+s(2)} len={s(3)}/>
   <Caption lines={['珠穆朗玛峰','8848.86 米']} from={sh('13').from+s(3.5)} len={s(4.5)} center/>
  </>}
  <AbsoluteFill style={{display:'flex',alignItems:'center',justifyContent:'center',opacity:titleO*.85}}>
   <div style={{fontFamily:serif,fontWeight:300,fontSize:44,letterSpacing:'.25em',color:'#fff'}}>光，退回山顶</div>
  </AbsoluteFill>
  <Audio src={staticFile('audio/everest_mix.wav')}/>
 </AbsoluteFill>};
