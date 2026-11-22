import {AbsoluteFill,Easing,Img,continueRender,delayRender,interpolate,random,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {useEffect,useState,type CSSProperties,type ReactNode} from 'react';
import '@fontsource/noto-serif-sc/700.css';
import '@fontsource/noto-sans-sc/400.css';
import '@fontsource/noto-sans-sc/700.css';
import {SCENES} from '../avoidant-script';

// 《回避型依恋》共用的颜色、字体、底图、胶片层、电影字幕。规范见 content-kit/avoidant/CLAUDE_CODE_MASTER_PROMPT.md。
export const WARM='#F3EFE6',GOLD='#E5C585',RED='#C84B4B',MUTED='rgba(243,239,230,0.62)';
export const SHADOW='0 2px 16px rgba(0,0,0,0.65)';
// Songti / PingFang 在渲染机（Linux）上没有，实际落到 Noto Serif SC / Noto Sans SC
export const SERIF="'Songti SC','Noto Serif SC','STSong','Georgia',serif";
export const SANS="-apple-system,'PingFang SC','Noto Sans SC','Helvetica Neue',sans-serif";
export const MONO="'DejaVu Sans Mono','Menlo',monospace";
// 抖音安全区
export const SAFE={top:180,right:140,bottom:280,left:72};
export const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;
export const soft=Easing.bezier(.16,1,.3,1);

// 字体加载完再渲染：把稿子里和画面上用到的字都先取一遍
const UI='今天好想见你下班一起吃饭我也想见你最近有点忙改天吧发送她不是冷血亲密警报回避型依恋安全距离边界自我距离过近触发防御表达需求落空学会独自消化把独立穿成铠甲撕裂感嘴上说算了心里怕失去不必立刻卸下铠甲先试着留一条缝评论区聊聊你是哪一种依恋→·「」[]，。？';
const ALL=UI+SCENES.map(s=>s.narration+s.subtitles.map(c=>c.text).join('')).join('');
export const useFonts=()=>{const [h]=useState(()=>delayRender('fonts'));
 useEffect(()=>{Promise.all([`700 60px 'Noto Serif SC'`,`700 38px 'Noto Sans SC'`,`400 38px 'Noto Sans SC'`].map(f=>document.fonts.load(f,ALL))).then(()=>continueRender(h));},[h]);};

// 底图：铺满 + 缓慢推镜（1.0→1.07，带一点平移）+ 全局遮罩 + 顶部 22%、底部 32% 暗角
export const Backdrop=({image,mask=.35,maskTo,drift=[0,-18]}:{image:string;mask?:number;maskTo?:number;drift?:[number,number]})=>{
 const f=useCurrentFrame();const {durationInFrames}=useVideoConfig();const p=f/durationInFrames;
 const m=maskTo===undefined?mask:interpolate(p,[0,1],[mask,maskTo],clamp);
 return <AbsoluteFill style={{overflow:'hidden'}}>
  <Img src={staticFile(image)} style={{width:'100%',height:'100%',objectFit:'cover',scale:interpolate(p,[0,1],[1,1.07]),translate:`${drift[0]*p}px ${drift[1]*p}px`}}/>
  <AbsoluteFill style={{background:`rgba(0,0,0,${m})`}}/>
  <AbsoluteFill style={{background:'linear-gradient(180deg,rgba(0,0,0,.55) 0%,rgba(0,0,0,0) 22%,rgba(0,0,0,0) 68%,rgba(0,0,0,.6) 100%)'}}/>
 </AbsoluteFill>};

// 35mm 胶片层：极轻颗粒（每 3 帧换种子）+ 左上角 EP 标注
export const FilmOverlay=()=>{const f=useCurrentFrame();const k=Math.floor(f/3);const seed=Math.floor(random('grain'+k)*1000);
 return <AbsoluteFill style={{pointerEvents:'none'}}>
  <AbsoluteFill style={{opacity:.04,mixBlendMode:'overlay'}}>
   <svg width="100%" height="100%"><filter id={'fg'+k}><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves={2} seed={seed} stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" filter={`url(#fg${k})`}/></svg>
  </AbsoluteFill>
  <AbsoluteFill style={{opacity:.04,mixBlendMode:'screen'}}>
   <svg width="100%" height="100%"><rect width="100%" height="100%" filter={`url(#fg${k})`}/></svg>
  </AbsoluteFill>
  <div style={{position:'absolute',top:SAFE.top+16,left:SAFE.left,fontFamily:MONO,fontSize:20,letterSpacing:'.16em',color:'rgba(243,239,230,0.45)'}}>EP.02 · AVOIDANT ATTACHMENT</div>
 </AbsoluteFill>};

// 高亮：把 words 里的词染成琥珀金
export const Hi=({text,words,color=GOLD}:{text:string;words:string[];color?:string})=>{
 if(!words.length)return <>{text}</>;
 const parts=text.split(new RegExp(`(${words.map(w=>w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')})`));
 return <>{parts.map((p,i)=>words.includes(p)?<span key={i} style={{color}}>{p}</span>:<span key={i}>{p}</span>)}</>;};

// 超过 14 个字的字幕在最靠中间的逗号处断成两行
const lines=(t:string)=>{const n=t.replace(/[「」]/g,'').length;if(n<=14)return [t];
 const marks=[...t.matchAll(/[，、：]/g)].map(m=>m.index!+1);if(!marks.length)return [t];
 const cut=marks.sort((a,b)=>Math.abs(a-t.length/2)-Math.abs(b-t.length/2))[0];return [t.slice(0,cut),t.slice(cut)];};

// 电影字幕：底部 310px，38px 暖白粗体 + 多层柔影，按时间轴逐句切换
export const CinemaSubtitle=({cues}:{cues:{text:string;highlight:string[];from:number;to:number}[]})=>{
 const f=useCurrentFrame();const {fps}=useVideoConfig();const t=f/fps;
 const c=cues.find(x=>t>=x.from&&t<x.to);if(!c)return null;
 const o=Math.min(interpolate(t,[c.from,c.from+.12],[0,1],clamp),interpolate(t,[c.to-.08,c.to],[1,0],clamp));
 return <div style={{position:'absolute',left:SAFE.left,right:SAFE.right,bottom:310,textAlign:'center',opacity:o,translate:`0px ${(1-o)*6}px`,
  fontFamily:SANS,fontWeight:700,fontSize:38,lineHeight:1.5,letterSpacing:'.02em',color:WARM,
  textShadow:'0 1px 2px rgba(0,0,0,.8),0 2px 10px rgba(0,0,0,.6),0 0 28px rgba(0,0,0,.45)'}}>
  {lines(c.text).map((l,i)=><div key={i} style={{whiteSpace:'nowrap'}}><Hi text={l} words={c.highlight}/></div>)}
 </div>};

// 焦外聚焦：blur 10→0、透明 0→1、上浮 14→0
export const Focus=({at,dur=.55,children,style}:{at:number;dur?:number;children:ReactNode;style?:CSSProperties})=>{
 const f=useCurrentFrame();const {fps}=useVideoConfig();const t=f/fps;
 const p=interpolate(t,[at,at+dur],[0,1],{...clamp,easing:soft});
 return <div style={{opacity:p,filter:`blur(${(1-p)*10}px)`,translate:`0px ${(1-p)*14}px`,...style}}>{children}</div>};
