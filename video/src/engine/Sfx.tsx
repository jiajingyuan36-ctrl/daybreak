import {Audio,Sequence,staticFile,useVideoConfig} from 'remotion';

// 拟音：在当前 Sequence 内第 at 秒触发 public/sfx/<name>.wav
export const Sfx=({at,name,vol}:{at:number;name:string;vol:number})=>{const {fps}=useVideoConfig();
 return <Sequence from={Math.max(0,Math.round(at*fps))} durationInFrames={Math.round(1.6*fps)} layout="none" name={`♪ ${name}`}>
  <Audio src={staticFile(`sfx/${name}.wav`)} volume={vol}/></Sequence>};
