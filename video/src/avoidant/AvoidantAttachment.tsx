import {AbsoluteFill,Audio,type CalculateMetadataFunction,Sequence,interpolate,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import timeline from '../avoidant-timeline.json';
import {SCENES} from '../avoidant-script';
import {useFonts} from './kit';
import {Scene1,Scene2,Scene3,Scene4,Scene5,type SceneTiming} from './scenes';

// 《回避型依恋》EP.02 主 Composition：1080×1920，30fps。
// 帧数全部从 src/avoidant-timeline.json 算（npm run tts -- avoidant 生成）：每幕 = 配音时长 + 末尾停顿。
// 配音按幕首尾相接；画面在幕与幕之间做 12 帧交叉溶图（后一幕叠在前一幕上淡入，前一幕多留 12 帧垫底），不挤占配音。
const COMPONENTS=[Scene1,Scene2,Scene3,Scene4,Scene5];
const FPS=timeline.fps,XF=timeline.crossfadeFrames;
const starts:number[]=[];let acc=0;for(const s of timeline.scenes){starts.push(acc);acc+=Math.round(s.length*FPS);}
export const AVOIDANT_FRAMES=acc;
const OUT=18; // 最后 18 帧淡到黑

const FadeIn=({children,first}:{children:React.ReactNode;first:boolean})=>{const f=useCurrentFrame();
 return <AbsoluteFill style={{opacity:first?1:interpolate(f,[0,XF],[0,1],{extrapolateRight:'clamp'})}}>{children}</AbsoluteFill>};
const Black=()=>{const f=useCurrentFrame();const {durationInFrames}=useVideoConfig();
 return <AbsoluteFill style={{background:'#000',opacity:interpolate(f,[durationInFrames-OUT,durationInFrames-1],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}),pointerEvents:'none'}}/>};

export const AvoidantAttachment=({bgm}:AvoidantProps)=>{useFonts();
 return <AbsoluteFill style={{background:'#000'}}>
  {timeline.scenes.map((s,i)=>{const C=COMPONENTS[i];const len=Math.round(s.length*FPS);const last=i===timeline.scenes.length-1;
   return <Sequence key={s.id} name={`Scene ${s.id} · ${SCENES[i].name}`} from={starts[i]} durationInFrames={len+(last?0:XF)}>
    <FadeIn first={i===0}><C script={SCENES[i]} timing={{length:s.length,cues:s.cues} as SceneTiming}/></FadeIn>
   </Sequence>;})}
  {timeline.scenes.map((s,i)=>{const len=Math.round(s.length*FPS);const last=i===timeline.scenes.length-1;
   return <Sequence key={'a'+s.id} name={`配音 ${s.id}`} from={starts[i]} durationInFrames={len} layout="none">
    <Audio src={staticFile(s.audio)} volume={(f)=>last?interpolate(f,[len-OUT,len-1],[1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}):1}/>
   </Sequence>;})}
  {bgm&&<Bgm/>}
  <Black/>
 </AbsoluteFill>};
// 背景音乐：public/audio/bgm_piano.mp3 存在时自动混入，音量 0.14，最后 2 秒淡出到 0
const Bgm=()=>{const {durationInFrames,fps}=useVideoConfig();
 return <Audio src={staticFile('audio/bgm_piano.mp3')} loop volume={(f)=>0.14*interpolate(f,[durationInFrames-2*fps,durationInFrames-1],[1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}/>};
export type AvoidantProps={bgm:boolean};
export const calcAvoidant:CalculateMetadataFunction<AvoidantProps>=async({props})=>{
 const ok=await fetch(staticFile('audio/bgm_piano.mp3'),{method:'HEAD'}).then(r=>r.ok).catch(()=>false);
 return {durationInFrames:AVOIDANT_FRAMES,fps:FPS,props:{...props,bgm:ok}};};
