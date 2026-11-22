import {AbsoluteFill,Audio,type CalculateMetadataFunction,Sequence,continueRender,delayRender,interpolate,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {useEffect,useState,type ReactNode} from 'react';
import '@fontsource/noto-serif-sc/700.css';
import '@fontsource/noto-sans-sc/400.css';
import '@fontsource/noto-sans-sc/700.css';
import timeline from '../stayup-timeline.json';
import {SCENES} from '../stayup-script';
import {clamp} from '../design/tokens';
import {LightLeak} from '../engine/OpticalPolish';
import {Scene1,Scene2,Scene3,Scene4,Scene5} from './scenes';

// 《报复性熬夜》RevengeBedtime：1080×1920，30fps。帧数由 src/stayup-timeline.json 决定（npm run tts -- stayup）。
// 三轨：人声（1.0，按幕首尾相接）/ 拟音（各幕内按帧触发）/ 可选 BGM（public/audio/bgm_stayup.mp3，0.13，第 4 幕硬切处压低 0.6s，末尾 2s 淡出）。
// 转场：1→2、2→3 交叉溶图 10 帧；3→4 冷白闪光硬切；4→5 暖色漏光交叉溶图 12 帧。结尾 15 帧画面与声音一起淡出。
const FPS=timeline.fps,OUT=15;
const COMPONENTS=[Scene1,Scene2,Scene3,Scene4,Scene5];
const XF=[10,10,0,12]; // 第 i 幕 → 第 i+1 幕的交叉溶图帧数（0＝硬切）
const starts:number[]=[];let acc=0;for(const s of timeline.scenes){starts.push(acc);acc+=Math.round(s.length*FPS);}
export const REVENGE_FRAMES=acc;

const UI='连续刷屏不是没自制力你不想睡今天压根替己活过归属分配别人于课业工作通勤与杂事社交回复微信老板老师这个再改一版新消息在吗急用日程提醒明早截止条短视频几小时总算我闹钟响了已贪睡延迟次报复性熬夜凌晨偷回自由早八还债精力白天给留半晚上才舍得放下手机说真的刷到这条时那边点：，。？·%↓→';
const ALL=UI+SCENES.map(s=>s.narration).join('');
const useFonts=()=>{const [h]=useState(()=>delayRender('fonts'));
 useEffect(()=>{Promise.all([`700 60px 'Noto Serif SC'`,`700 40px 'Noto Sans SC'`,`400 30px 'Noto Sans SC'`].map(f=>document.fonts.load(f,ALL))).then(()=>continueRender(h));},[h]);};

const FadeIn=({frames,children}:{frames:number;children:ReactNode})=>{const f=useCurrentFrame();
 return <AbsoluteFill style={{opacity:frames?interpolate(f,[0,frames],[0,1],clamp):1}}>{children}</AbsoluteFill>};
const Black=()=>{const f=useCurrentFrame();const {durationInFrames}=useVideoConfig();
 return <AbsoluteFill style={{background:'#000',pointerEvents:'none',opacity:interpolate(f,[durationInFrames-OUT,durationInFrames-1],[0,1],clamp)}}/>};

const Bgm=()=>{const {durationInFrames,fps}=useVideoConfig();const duck=starts[3];
 return <Audio src={staticFile('audio/bgm_stayup.mp3')} loop volume={(f)=>{
  const d=interpolate(f,[duck-3,duck,duck+.6*fps,duck+.9*fps],[1,.25,.25,1],clamp);
  return .13*d*interpolate(f,[durationInFrames-2*fps,durationInFrames-1],[1,0],clamp);}}/>};

export type RevengeProps={bgm:boolean};
export const RevengeBedtime=({bgm}:RevengeProps)=>{useFonts();
 return <AbsoluteFill style={{background:'#000'}}>
  {timeline.scenes.map((s,i)=>{const C=COMPONENTS[i];const len=Math.round(s.length*FPS);const extra=i<XF.length?XF[i]:0;
   return <Sequence key={s.id} name={`Scene ${s.id} · ${SCENES[i].name}`} from={starts[i]} durationInFrames={len+extra}>
    <FadeIn frames={i>0?XF[i-1]:0}><C script={SCENES[i]} timing={{length:s.length,cues:s.cues}}/></FadeIn>
   </Sequence>;})}
  {/* 1→2 冷色漏光 */}
  <Sequence from={starts[1]-6} durationInFrames={30} layout="none"><LightLeak at={0} dur={.8} tone="cold"/></Sequence>
  {timeline.scenes.map((s,i)=>{const len=Math.round(s.length*FPS);const last=i===timeline.scenes.length-1;
   return <Sequence key={'v'+s.id} name={`人声 ${s.id}`} from={starts[i]} durationInFrames={len} layout="none">
    <Audio src={staticFile(s.audio)} volume={(f)=>last?interpolate(f,[len-OUT,len-1],[1,0],clamp):1}/></Sequence>;})}
  {bgm&&<Bgm/>}
  <Black/>
 </AbsoluteFill>};

export const calcRevenge:CalculateMetadataFunction<RevengeProps>=async({props})=>{
 const ok=await fetch(staticFile('audio/bgm_stayup.mp3'),{method:'HEAD'}).then(r=>r.ok&&(r.headers.get('content-type')||'').startsWith('audio')).catch(()=>false);
 return {durationInFrames:REVENGE_FRAMES,fps:FPS,props:{...props,bgm:ok}};};
