import {AbsoluteFill,Audio,Img,OffthreadVideo,Sequence,continueRender,delayRender,interpolate,random,staticFile,useCurrentFrame,Easing} from 'remotion';
import {useEffect,useState} from 'react';
import {cardBack} from '../../src/card-back';

// 节制牌短片（2026-11-22）：Muse 生成的三段破晓空镜 + 翻牌 + 站内文案 + 片尾。1920×1080，24fps，38 秒。
// 空镜放在 public/footage/（不进 git，来源是 Muse 的 daybreak-shot1/2/3-v1）。
// 文案原样取自 src/plain.ts 的 m14（正位今日解析、今天可做）；改文案先改 plain.ts 再同步这里。

export const FPS=24;
const s=(sec:number)=>Math.round(sec*FPS);
const ease=Easing.bezier(.4,0,.2,1);
const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;

// 时间线（帧）
const A={from:0,len:s(9),src:s(.5)};            // 镜头1 窗边倒水
const B={from:s(8.6),len:s(4.4),src:0};          // 镜头2 一脚水一脚雪（只用前 4 秒，后面围巾颜色不一致）
const C={from:s(12.6),len:s(9.6),src:s(.1)};     // 镜头3 破晓抬头
const CARD=s(22.4);                               // 牌背出现
const FLIP=CARD+s(2.2);                           // 开始翻牌
const SLIDE=FLIP+s(1.6);                          // 牌左移，文字进场
const END=s(32.5);                                // 片尾
export const DURATION=s(38);
const XF=s(.4);                                   // 镜头之间的交叠

const ink='#09090b',ivory='#e9e3d5',ash='#8f897d',gold='214,205,184';
const serif="'DSerifCore','DSerifExtra',serif";

const fonts:[string,string][]=[['DSerifCore','serif-sc-core.woff2'],['DSerifExtra','serif-sc-extra.woff2'],['Cinzel','cinzel-latin-400-normal.woff2'],['CormorantItalic','cormorant-garamond-latin-500-italic.woff2']];
const useFonts=()=>{const [h]=useState(()=>delayRender('fonts'));
 useEffect(()=>{Promise.all(fonts.map(([n,f])=>new FontFace(n,`url(${staticFile('fonts/'+f)})`).load().then(ff=>{document.fonts.add(ff)}))).then(()=>continueRender(h))},[h]);};

// 一段空镜：淡入 XF 帧、淡出 XF 帧（第一段从黑里淡入更慢，最后一段淡到黑）
const Shot=({file,len,src,fadeIn=XF,fadeOut=XF,vol=1,still=false}:{file:string;len:number;src:number;fadeIn?:number;fadeOut?:number;vol?:number;still?:boolean})=>{
 const f=useCurrentFrame();
 const o=Math.min(interpolate(f,[0,fadeIn],[0,1],clamp),interpolate(f,[len-fadeOut,len],[1,0],clamp));
 const push=still?1:interpolate(f,[0,len],[1.02,1.06]); // 很慢的推近，补一点呼吸感（电影版不推，保住清晰度）
 return <AbsoluteFill style={{opacity:o}}>
  <OffthreadVideo src={staticFile('footage/'+file)} startFrom={src} style={{width:'100%',height:'100%',objectFit:'cover',transform:`scale(${push})`}}
   volume={(v)=>vol*Math.min(interpolate(v,[0,fadeIn],[0,1],clamp),interpolate(v,[len-fadeOut,len],[1,0],clamp))}/>
 </AbsoluteFill>};

// 胶片颗粒：每帧换一次噪声种子
const Grain=({opacity=.11}:{opacity?:number})=>{const f=useCurrentFrame();const seed=Math.floor(random('g'+f)*1000);
 return <AbsoluteFill style={{opacity,mixBlendMode:'overlay',pointerEvents:'none'}}>
  <svg width="100%" height="100%"><filter id={'n'+f}><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves={2} seed={seed} stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" filter={`url(#n${f})`}/></svg>
 </AbsoluteFill>};

const Vignette=()=><AbsoluteFill style={{background:'radial-gradient(ellipse 75% 70% at 50% 50%,transparent 55%,rgba(0,0,0,.55) 100%)',pointerEvents:'none'}}/>;

// 星空底：固定种子的细小星点，和网站「夜空版画」一致
const stars=Array.from({length:140},(_,i)=>({x:random('x'+i)*100,y:random('y'+i)*100,r:random('r'+i)<.9?1.2:2.2,o:.25+random('o'+i)*.55,t:random('t'+i)*6}));
const Sky=()=>{const f=useCurrentFrame();
 return <AbsoluteFill style={{background:`radial-gradient(ellipse 70% 55% at 50% -10%,rgba(${gold},.08),transparent 70%),${ink}`}}>
  <svg width="1920" height="1080" viewBox="0 0 100 56.25" preserveAspectRatio="none" style={{position:'absolute',inset:0}}>
   {stars.map((p,i)=><circle key={i} cx={p.x} cy={p.y*.5625} r={p.r*.045} fill={ivory} opacity={p.o*(.75+.25*Math.sin(f/18+p.t))}/>)}
  </svg></AbsoluteFill>};

const CW=420,CH=720; // 牌的尺寸（600×1029 的原图按比例）
const cbHtml=cardBack();
const Card=()=>{const f=useCurrentFrame();
 const appear=interpolate(f,[CARD,CARD+s(1.4)],[0,1],{...clamp,easing:ease});
 const rot=interpolate(f,[FLIP,FLIP+s(1.1)],[0,180],{...clamp,easing:Easing.bezier(.6,0,.25,1)});
 const lift=Math.sin(rot/180*Math.PI)*0.06;
 const x=interpolate(f,[SLIDE,SLIDE+s(1.2)],[0,-330],{...clamp,easing:ease});
 const out=interpolate(f,[END-s(.2),END+s(.8)],[1,0],clamp);
 const sheen=interpolate(f,[FLIP+s(1.1),FLIP+s(2.2)],[-130,130],clamp);
 return <AbsoluteFill style={{justifyContent:'center',alignItems:'center',perspective:2200,opacity:appear*out}}>
  <div style={{width:CW,height:CH,position:'relative',transformStyle:'preserve-3d',transform:`translateX(${x}px) translateY(${(1-appear)*24}px) scale(${1+lift}) rotateY(${rot}deg)`}}>
   <div style={{position:'absolute',inset:0,backfaceVisibility:'hidden',background:'#0a0a0c',outline:`1px solid rgba(${gold},.45)`,
    ['--cb-bg-a' as string]:'#121115',['--cb-bg-b' as string]:'#0a0a0c',['--cb-glow' as string]:'#EFE8D6',['--cb-f0' as string]:'#7d766a',['--cb-f1' as string]:'#cbc2ad',['--cb-f2' as string]:'#f1ebdc',['--cb-f3' as string]:'#ece4d1',['--cb-f4' as string]:'#6d675c',['--cb-hl' as string]:'#f6f1e6'}}
    dangerouslySetInnerHTML={{__html:cbHtml.replace('<svg ','<svg width="100%" height="100%" ')}}/>
   <div style={{position:'absolute',inset:0,backfaceVisibility:'hidden',transform:'rotateY(180deg)',overflow:'hidden',boxShadow:'0 30px 80px rgba(0,0,0,.6)'}}>
    <Img src={staticFile('cards/m14.webp')} style={{width:'100%',height:'100%',display:'block',filter:'saturate(.82) contrast(.96)'}}/>
    <div style={{position:'absolute',inset:0,background:`linear-gradient(115deg,transparent 35%,rgba(255,248,231,.22) 50%,transparent 65%)`,transform:`translateX(${sheen}%)`}}/>
   </div>
  </div>
 </AbsoluteFill>};

// 文字：逐行淡入上浮
const Line=({at,children,style}:{at:number;children:React.ReactNode;style?:React.CSSProperties})=>{const f=useCurrentFrame();
 const o=interpolate(f,[at,at+s(.9)],[0,1],{...clamp,easing:ease});
 return <div style={{opacity:o,transform:`translateY(${(1-o)*14}px)`,...style}}>{children}</div>};

const Rule=({at}:{at:number})=>{const f=useCurrentFrame();const w=interpolate(f,[at,at+s(1)],[0,220],{...clamp,easing:ease});
 return <div style={{display:'flex',alignItems:'center',gap:14,margin:'30px 0 34px',height:12}}>
  <div style={{width:w,height:1,background:`rgba(${gold},.6)`}}/><div style={{color:`rgb(${gold})`,fontSize:14,opacity:w/220}}>✦</div><div style={{width:w,height:1,background:`rgba(${gold},.6)`}}/></div>};

const Text=()=>{const f=useCurrentFrame();const out=interpolate(f,[END-s(.2),END+s(.8)],[1,0],clamp);const t=SLIDE+s(.6);
 return <AbsoluteFill style={{opacity:out}}>
  <div style={{position:'absolute',left:960-330+CW/2+90,top:200,width:760,color:ivory,fontFamily:serif}}>
   <Line at={t} style={{fontFamily:'Cinzel',fontSize:26,letterSpacing:'.42em',color:`rgb(${gold})`}}>· XIV · TEMPERANCE ·</Line>
   <Line at={t+s(.3)} style={{fontSize:76,letterSpacing:'.28em',marginTop:22}}>节制<span style={{fontSize:30,letterSpacing:'.2em',color:ash,marginLeft:24}}>正位</span></Line>
   <Line at={t+s(.6)} style={{fontSize:26,letterSpacing:'.3em',color:ash,marginTop:16}}>刚刚好 · 慢慢调 · 找到节奏</Line>
   <Rule at={t+s(.9)}/>
   <Line at={t+s(1.6)} style={{fontSize:36,lineHeight:1.75,letterSpacing:'.06em'}}>看起来冲突的几件事，<br/>调一调顺序和分量，就能放在一起。</Line>
   <Line at={t+s(3.2)} style={{fontSize:36,lineHeight:1.75,letterSpacing:'.06em',marginTop:6}}>慢，反而稳。</Line>
   <Line at={t+s(4.6)} style={{marginTop:40}}>
    <div style={{fontFamily:'Cinzel',fontSize:20,letterSpacing:'.4em',color:`rgb(${gold})`}}>TODAY</div>
    <div style={{fontSize:30,lineHeight:1.7,letterSpacing:'.06em',marginTop:10,color:'#d9d2c3'}}>在今天的两件任务之间，<br/>留出五分钟，什么都不做。</div>
   </Line>
  </div>
 </AbsoluteFill>};

const Outro=()=>{const f=useCurrentFrame();const o=Math.min(interpolate(f,[END+s(.6),END+s(1.8)],[0,1],{...clamp,easing:ease}),interpolate(f,[DURATION-s(1.4),DURATION-s(.2)],[1,0],clamp));
 return <AbsoluteFill style={{justifyContent:'center',alignItems:'center',opacity:o,color:ivory,fontFamily:serif,textAlign:'center'}}>
  <div style={{fontSize:58,letterSpacing:'.32em'}}>今天，抽你的那张。</div>
  <div style={{display:'flex',alignItems:'center',gap:14,margin:'44px 0 40px'}}><div style={{width:120,height:1,background:`rgba(${gold},.55)`}}/><div style={{color:`rgb(${gold})`,fontSize:14}}>✦</div><div style={{width:120,height:1,background:`rgba(${gold},.55)`}}/></div>
  <div style={{fontSize:34,letterSpacing:'.5em'}}>晨启塔罗</div>
  <div style={{fontFamily:'Cinzel',fontSize:22,letterSpacing:'.6em',color:`rgb(${gold})`,marginTop:18}}>DAYBREAK</div>
 </AbsoluteFill>};

// 空镜段的宽银幕遮幅（2:1）和 AI 标注
const Matte=({k=1}:{k?:number})=>{const f=useCurrentFrame();const o=interpolate(f,[C.from+C.len-s(1),C.from+C.len],[1,0],clamp);
 return <AbsoluteFill style={{opacity:o,pointerEvents:'none'}}>
  <div style={{position:'absolute',left:0,right:0,top:0,height:60*k,background:'#000'}}/><div style={{position:'absolute',left:0,right:0,bottom:0,height:60*k,background:'#000'}}/>
  <div style={{position:'absolute',right:36*k,bottom:20*k,fontFamily:serif,fontSize:17*k,letterSpacing:'.2em',color:ash,opacity:.75}}>画面由 AI 生成</div>
 </AbsoluteFill>};

export const Temperance=()=>{useFonts();const f=useCurrentFrame();
 const skyIn=interpolate(f,[C.from+C.len-s(1.2),CARD],[0,1],clamp);
 return <AbsoluteFill style={{background:'#000'}}>
  <Sequence from={A.from} durationInFrames={A.len}><Shot file="shot1.mp4" len={A.len} src={A.src} fadeIn={s(1.6)}/></Sequence>
  <Sequence from={B.from} durationInFrames={B.len}><Shot file="shot2.mp4" len={B.len} src={B.src} vol={.8}/></Sequence>
  <Sequence from={C.from} durationInFrames={C.len}><Shot file="shot3.mp4" len={C.len} src={C.src} fadeOut={s(1.4)}/></Sequence>
  <AbsoluteFill style={{opacity:skyIn}}><Sky/></AbsoluteFill>
  {/* 牌和文字段底下垫一层很轻的风声，接住空镜的环境声 */}
  <Sequence from={C.from+C.len-s(1.4)} durationInFrames={DURATION-(C.from+C.len-s(1.4))}>
   <Audio src={staticFile('footage/shot3.mp4')} startFrom={s(.5)} volume={(v)=>.4*Math.min(interpolate(v,[0,s(1.4)],[0,1],clamp),interpolate(v,[DURATION-(C.from+C.len-s(1.4))-s(2),DURATION-(C.from+C.len-s(1.4))],[1,0],clamp))} loop/>
  </Sequence>
  <Card/><Text/><Outro/>
  <Matte/>
  <Vignette/><Grain/>
 </AbsoluteFill>};

// 电影版（2026-11-22）：只要前面三段空镜，不要牌和片尾。按素材原生 1280×720 剪、不缩放、不加颗粒，
// 放大到 1080p 和锐化交给 ffmpeg（lanczos），比浏览器里缩放清楚。
export const FILM_DURATION=C.from+C.len;
export const TemperanceFilm=()=>{useFonts();
 return <AbsoluteFill style={{background:'#000'}}>
  <Sequence from={A.from} durationInFrames={A.len}><Shot file="shot1.mp4" len={A.len} src={A.src} fadeIn={s(1.6)} still/></Sequence>
  <Sequence from={B.from} durationInFrames={B.len}><Shot file="shot2.mp4" len={B.len} src={B.src} vol={.8} still/></Sequence>
  <Sequence from={C.from} durationInFrames={C.len}><Shot file="shot3.mp4" len={C.len} src={C.src} fadeOut={s(1.4)} still/></Sequence>
  <Matte k={2/3}/>
 </AbsoluteFill>};
