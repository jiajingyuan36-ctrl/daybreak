import {AbsoluteFill,Audio,type CalculateMetadataFunction,Sequence,continueRender,delayRender,interpolate,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {useEffect,useState,type ReactNode} from 'react';
import '@fontsource/noto-serif-sc/700.css';
import '@fontsource/noto-serif-sc/900.css';
import '@fontsource/noto-sans-sc/400.css';
import '@fontsource/noto-sans-sc/700.css';
import timeline from '../sbux-timeline.json';
import {SCENES} from '../sbux-script';
import {clamp} from '../design/tokens';
import {Scene1,Scene2,Scene3,Scene4,Scene5} from './scenes';

// 《星巴克：不付利息的「银行」》StarbucksBank：1080×1920，30fps。帧数由 src/sbux-timeline.json 决定（npm run tts -- sbux）。
// 三轨：人声 1.0 / 拟音 0.18–0.36（各幕内按帧触发）/ 可选底乐 public/audio/bgm_business.mp3（0.12，结尾 2s 淡出）。
// 转场：幕间 10 帧交叉溶图，4→5 用 12 帧（第 5 幕自带暖色漏光）；第 3 幕内部 6 帧暗切到金库插镜。结尾 18 帧淡黑。
const FPS=timeline.fps,OUT=18;
const COMPONENTS=[Scene1,Scene2,Scene3,Scene4,Scene5];
const XF=[10,10,10,12];
const starts:number[]=[];let acc=0;for(const s of timeline.scenes){starts.push(acc);acc+=Math.round(s.length*FPS);}
export const SBUX_FRAMES=acc;

const UI='靠卖咖啡赚钱无息银行储值卡与会员积分负债人民币就这么躺在账上美国家受保单家存款对比星巴克余额亿其余的没它多第三方测算两者日期口径不同这笔钱不是利率银行揽储要付息不用付充完忘了花搬家把弄丢剩几块懒得凑沉睡直营门店授权年记为收入成本低手都在卷产品差价高现金流你机里哪张充却一直完？≈·：，。「」↓';
const ALL=UI+SCENES.map(s=>s.narration).join('');
const useFonts=()=>{const [h]=useState(()=>delayRender('fonts'));
 useEffect(()=>{Promise.all([`900 80px 'Noto Serif SC'`,`700 60px 'Noto Serif SC'`,`700 40px 'Noto Sans SC'`,`400 30px 'Noto Sans SC'`].map(f=>document.fonts.load(f,ALL))).then(()=>continueRender(h));},[h]);};

const FadeIn=({frames,children}:{frames:number;children:ReactNode})=>{const f=useCurrentFrame();
 return <AbsoluteFill style={{opacity:frames?interpolate(f,[0,frames],[0,1],clamp):1}}>{children}</AbsoluteFill>};
const Black=()=>{const f=useCurrentFrame();const {durationInFrames}=useVideoConfig();
 return <AbsoluteFill style={{background:'#000',pointerEvents:'none',opacity:interpolate(f,[durationInFrames-OUT,durationInFrames-1],[0,1],clamp)}}/>};
const Bgm=()=>{const {durationInFrames,fps}=useVideoConfig();
 return <Audio src={staticFile('audio/bgm_business.mp3')} loop volume={(f)=>.12*interpolate(f,[durationInFrames-2*fps,durationInFrames-1],[1,0],clamp)}/>};

export type SbuxProps={bgm:boolean};
export const StarbucksBank=({bgm}:SbuxProps)=>{useFonts();
 return <AbsoluteFill style={{background:'#000'}}>
  {timeline.scenes.map((s,i)=>{const C=COMPONENTS[i];const len=Math.round(s.length*FPS);const extra=i<XF.length?XF[i]:0;
   return <Sequence key={s.id} name={`Scene ${s.id} · ${SCENES[i].name}`} from={starts[i]} durationInFrames={len+extra}>
    <FadeIn frames={i>0?XF[i-1]:0}><C script={SCENES[i]} timing={{length:s.length,cues:s.cues}}/></FadeIn></Sequence>;})}
  {timeline.scenes.map((s,i)=>{const len=Math.round(s.length*FPS);const last=i===timeline.scenes.length-1;
   return <Sequence key={'v'+s.id} name={`人声 ${s.id}`} from={starts[i]} durationInFrames={len} layout="none">
    <Audio src={staticFile(s.audio)} volume={(f)=>last?interpolate(f,[len-OUT,len-1],[1,0],clamp):1}/></Sequence>;})}
  {bgm&&<Bgm/>}
  <Black/>
 </AbsoluteFill>};

export const calcSbux:CalculateMetadataFunction<SbuxProps>=async({props})=>{
 const ok=await fetch(staticFile('audio/bgm_business.mp3'),{method:'HEAD'}).then(r=>r.ok&&(r.headers.get('content-type')||'').startsWith('audio')).catch(()=>false);
 return {durationInFrames:SBUX_FRAMES,fps:FPS,props:{...props,bgm:ok}};};
