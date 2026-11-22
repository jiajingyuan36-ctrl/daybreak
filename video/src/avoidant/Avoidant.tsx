import {type CalculateMetadataFunction,Sequence,staticFile} from 'remotion';
import {Scene1} from './Scene1';
import {DEFAULT_BEATS,TAIL,type Scene1Beats} from './timeline';

// 《回避型依恋》心理短视频：1080×1920，30fps，全片目标 40 秒以内。
// 现在只有 Scene 1（钩子）。后面的幕按顺序接在 Sequence 里。
export type AvoidantProps={beats:Scene1Beats;hasAudio:boolean;scene1Frames:number};

export const Avoidant=({beats,hasAudio,scene1Frames}:AvoidantProps)=>{
 return <>
  <Sequence name="Scene 1 · 钩子" from={0} durationInFrames={scene1Frames}><Scene1 beats={beats} hasAudio={hasAudio}/></Sequence>
 </>};

// 有配音就按配音的精确时长定 Scene 1 帧数（末尾只留 0.15s）；没有配音先按需求里的 5 秒预览
const audioSeconds=(src:string)=>new Promise<number|null>(res=>{const a=document.createElement('audio');a.preload='metadata';
 a.onloadedmetadata=()=>res(Number.isFinite(a.duration)?a.duration:null);a.onerror=()=>res(null);a.src=src;});

export const calcAvoidant:CalculateMetadataFunction<AvoidantProps>=async({props})=>{
 const fps=30;const dur=await audioSeconds(staticFile('audio/avoid_1.mp3'));
 const beats=dur?{...props.beats,end:dur}:props.beats;
 const scene1Frames=Math.ceil(((dur??(DEFAULT_BEATS.end))+TAIL)*fps);
 return {durationInFrames:scene1Frames,fps,props:{...props,beats,hasAudio:!!dur,scene1Frames}};
};
