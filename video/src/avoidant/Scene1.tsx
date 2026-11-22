import {AbsoluteFill,Audio,Easing,Img,continueRender,delayRender,interpolate,random,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {useEffect,useState} from 'react';
import '@fontsource/noto-serif-sc/900.css';
import '@fontsource/noto-sans-sc/700.css';
import '@fontsource/noto-sans-sc/400.css';
import {type Scene1Beats,TAIL,cues} from './timeline';

// 《回避型依恋》Scene 1：0–5 秒钩子。1080×1920，30fps。
// 层次（从下到上）：雨夜窗前底图（慢推 1.0→1.08）→ 压暗渐变 → 微信场景 → 「不是冷血」→「亲密警报」+ 波纹 → 字幕 → 胶片颗粒。
// 所有时间点都从 beats 算，配音换了只改 timeline.ts。

const WARM='#F3EFE6',GOLD='#E5C585',RED='rgb(138,46,42)';
const SERIF="'Noto Serif SC',serif",SANS="'Noto Sans SC',sans-serif";
const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;
const out=Easing.bezier(.16,1,.3,1);
// 抖音安全区：底部 280px、右侧 140px 不放字
const SAFE_BOTTOM=280,SAFE_RIGHT=140,SAFE_LEFT=72;

const useFonts=()=>{const [h]=useState(()=>delayRender('cjk-fonts'));
 useEffect(()=>{const sample='今天好想见你下班一起吃饭我也最近有点忙改天吧不是冷血亲密警报对方越对你好想把手机扣过去突然冷掉别骂自己其实是的大脑拉响了，。、「」？';
  Promise.all([`900 120px 'Noto Serif SC'`,`700 48px 'Noto Sans SC'`,`400 40px 'Noto Sans SC'`].map(f=>document.fonts.load(f,sample)))
   .then(()=>new FontFace('Cinzel',`url(${staticFile('fonts/cinzel-latin-400-normal.woff2')})`).load()).then(ff=>{document.fonts.add(ff);continueRender(h)});},[h]);};

const Background=()=>{const f=useCurrentFrame();const {durationInFrames}=useVideoConfig();
 return <AbsoluteFill>
  <Img src={staticFile('images/bg_1.jpg')} style={{width:'100%',height:'100%',objectFit:'cover',scale:interpolate(f,[0,durationInFrames],[1,1.08],{...clamp,easing:Easing.bezier(.33,0,.67,1)})}}/>
  {/* 压暗：上下更暗，中间留一点窗光 */}
  <AbsoluteFill style={{background:'linear-gradient(180deg,rgba(6,7,10,.78) 0%,rgba(6,7,10,.35) 38%,rgba(6,7,10,.45) 62%,rgba(6,7,10,.88) 100%)'}}/>
 </AbsoluteFill>};

const Grain=()=>{const f=useCurrentFrame();const seed=Math.floor(random('g'+f)*1000);
 return <AbsoluteFill style={{opacity:.1,mixBlendMode:'overlay',pointerEvents:'none'}}>
  <svg width="100%" height="100%"><filter id={'g'+f}><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves={2} seed={seed} stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" filter={`url(#g${f})`}/></svg>
 </AbsoluteFill>};

// 输入框里的打字过程：打「我也」→ 删掉 → 打「最近有点忙，改天吧」。时间按 flip 等比伸缩（需求里的 2.2s 是基准）
const typed=(t:number,k:number)=>{const at=(x:number)=>x*k;
 const a='我也',b='最近有点忙，改天吧';
 if(t<at(.95))return '';
 if(t<at(1.2))return a.slice(0,Math.min(2,1+Math.floor((t-at(.95))/at(.1))));
 if(t<at(1.36))return a;
 if(t<at(1.5))return a.slice(0,Math.max(0,2-Math.floor((t-at(1.36))/at(.06))-1));
 if(t<at(1.55))return '';
 return b.slice(0,Math.min(b.length,1+Math.floor((t-at(1.55))/at(.045))));};

const Chat=({beats}:{beats:Scene1Beats})=>{const f=useCurrentFrame();const {fps}=useVideoConfig();const t=f/fps;const k=beats.flip/2.2;
 const pop=interpolate(f,[0,.32*fps],[0,1],{...clamp,easing:Easing.spring({damping:14})});
 const boxIn=interpolate(t,[.8*k,.8*k+.25],[0,1],{...clamp,easing:out});
 const cold=interpolate(t,[1.98*k,2.2*k],[0,1],clamp);           // 变灰下沉
 const recede=interpolate(t,[beats.flip,beats.flip+.45],[0,1],{...clamp,easing:out}); // 模糊退后
 const text=typed(t,k);const done=text==='最近有点忙，改天吧';
 const caret=Math.floor(t*2.6)%2===0&&!done;
 return <AbsoluteFill style={{filter:`blur(${recede*14}px)`,opacity:1-recede*.82,scale:1-recede*.08}}>
  {/* 对方的消息：中上方，左侧小头像 + 半透明白气泡 */}
  <div style={{position:'absolute',top:470,left:SAFE_LEFT+8,display:'flex',alignItems:'flex-start',gap:22,opacity:pop,translate:`0px ${(1-pop)*26}px`,scale:.94+pop*.06}}>
   <div style={{width:84,height:84,borderRadius:14,background:'linear-gradient(160deg,#4b4f57,#2a2d33)',boxShadow:'0 6px 20px rgba(0,0,0,.35)'}}/>
   <div style={{position:'relative',maxWidth:800,padding:'26px 32px',whiteSpace:'nowrap',borderRadius:18,background:'rgba(245,245,245,.86)',color:'#151515',fontFamily:SANS,fontWeight:400,fontSize:44,lineHeight:1.45,boxShadow:'0 10px 40px rgba(0,0,0,.35)'}}>
    <div style={{position:'absolute',left:-12,top:28,width:0,height:0,borderTop:'12px solid transparent',borderBottom:'12px solid transparent',borderRight:'13px solid rgba(245,245,245,.86)'}}/>
    今天好想见你，下班一起吃饭？
   </div>
  </div>
  {/* 回复输入框：下方 */}
  <div style={{position:'absolute',top:760,left:SAFE_LEFT,right:SAFE_RIGHT,opacity:boxIn*(1-cold*.35),translate:`0px ${(1-boxIn)*30+cold*18}px`}}>
   <div style={{display:'flex',alignItems:'center',gap:18,padding:'18px 22px',borderRadius:16,background:'rgba(28,30,34,.72)',border:'1px solid rgba(255,255,255,.08)'}}>
    <div style={{flex:1,minHeight:64,display:'flex',alignItems:'center',padding:'0 22px',borderRadius:12,background:'rgba(255,255,255,.92)',fontFamily:SANS,fontSize:42,color:`rgba(${Math.round(20+cold*120)},${Math.round(20+cold*120)},${Math.round(20+cold*120)},1)`}}>
     {text}<span style={{display:'inline-block',width:3,height:48,marginLeft:4,background:'#07c160',opacity:caret?1:0}}/>
    </div>
    <div style={{padding:'14px 24px',borderRadius:10,fontFamily:SANS,fontSize:34,fontWeight:700,color:'#fff',background:done?'#07c160':'rgba(7,193,96,.35)'}}>发送</div>
   </div>
  </div>
 </AbsoluteFill>};

// 「不是冷血」：浮现后，暗红细线从左到右划掉「冷血」
const NotCold=({beats}:{beats:Scene1Beats})=>{const f=useCurrentFrame();const {fps}=useVideoConfig();const t=f/fps;
 const inn=interpolate(t,[beats.flip+.08,beats.flip+.5],[0,1],{...clamp,easing:out});
 const strike=interpolate(t,[beats.flip+.55,beats.flip+.78],[0,1],{...clamp,easing:Easing.bezier(.7,0,.3,1)});
 const gone=interpolate(t,[beats.alarm-.02,beats.alarm+.12],[1,0],clamp);
 return <AbsoluteFill style={{justifyContent:'center',alignItems:'center',paddingBottom:120,opacity:inn*gone}}>
  <div style={{fontFamily:SERIF,fontWeight:900,fontSize:150,letterSpacing:'.08em',color:WARM,textShadow:'0 6px 40px rgba(0,0,0,.6)',translate:`0px ${(1-inn)*24}px`,filter:`blur(${(1-inn)*8}px)`,whiteSpace:'nowrap'}}>
   不是<span style={{position:'relative',display:'inline-block'}}>冷血
    <span style={{position:'absolute',left:'-4%',top:'57%',height:7,width:`${strike*108}%`,background:RED,rotate:'-2deg',transformOrigin:'left center',boxShadow:'0 0 0 rgba(0,0,0,0)'}}/>
   </span>
  </div>
 </AbsoluteFill>};

// 「亲密警报」+ 两圈暗红 / 琥珀金细线脉冲
const Alarm=({beats}:{beats:Scene1Beats})=>{const f=useCurrentFrame();const {fps}=useVideoConfig();const t=f/fps;
 const inn=interpolate(t,[beats.alarm+.04,beats.alarm+.42],[0,1],{...clamp,easing:out});
 const ring=(d:number,color:string)=>{const p=interpolate(t,[beats.alarm+d,beats.alarm+d+1.3],[0,1],clamp);
  return <circle cx="540" cy="900" r={150+p*620} fill="none" stroke={color} strokeWidth={2.2-p*1.4} opacity={p>0?(1-p)*.9:0}/>};
 return <AbsoluteFill style={{opacity:inn}}>
  <svg width="1080" height="1920" style={{position:'absolute',inset:0}}>{ring(.1,RED)}{ring(.38,GOLD)}{ring(.75,RED)}</svg>
  <AbsoluteFill style={{justifyContent:'center',alignItems:'center',paddingBottom:120}}>
   <div style={{fontFamily:SERIF,fontWeight:900,fontSize:168,letterSpacing:'.14em',color:WARM,textShadow:`0 0 60px rgba(229,197,133,.18),0 8px 40px rgba(0,0,0,.7)`,scale:interpolate(inn,[0,1],[1.14,1]),filter:`blur(${(1-inn)*10}px)`,marginRight:'-.14em'}}>亲密警报</div>
   <div style={{fontFamily:'Cinzel',fontSize:30,letterSpacing:'.55em',color:GOLD,opacity:.85,marginTop:34,marginRight:'-.55em',translate:`0px ${(1-inn)*12}px`}}>AVOIDANT ATTACHMENT</div>
  </AbsoluteFill>
 </AbsoluteFill>};

// 底部字幕：暖白粗体 + 柔和阴影，痛点词琥珀金；放在安全区内
const Subtitles=({beats}:{beats:Scene1Beats})=>{const f=useCurrentFrame();const {fps}=useVideoConfig();const t=f/fps;
 const c=cues(beats).find(x=>t>=x.from&&t<x.to);if(!c)return null;
 const o=interpolate(t,[c.from,c.from+.08],[0,1],clamp);
 const parts=c.text.split(new RegExp(`(${c.gold.join('|')})`));
 return <div style={{position:'absolute',left:SAFE_LEFT,right:SAFE_RIGHT,bottom:SAFE_BOTTOM+40,textAlign:'center',opacity:o,fontFamily:SANS,fontWeight:700,fontSize:46,lineHeight:1.4,whiteSpace:'nowrap',color:WARM,textShadow:'0 2px 6px rgba(0,0,0,.75),0 0 24px rgba(0,0,0,.55)'}}>
  {parts.map((p,i)=>c.gold.includes(p)?<span key={i} style={{color:GOLD}}>{p}</span>:<span key={i}>{p}</span>)}
 </div>};

export const Scene1=({beats,hasAudio}:{beats:Scene1Beats;hasAudio:boolean})=>{useFonts();const f=useCurrentFrame();const {fps}=useVideoConfig();
 // 「亲密警报」那一刻震动 3 帧
 const k=Math.round(f-beats.alarm*fps);const shake=k>=0&&k<3?[[-9,5],[8,-6],[-4,3]][k]:[0,0];
 return <AbsoluteFill style={{background:'#06070a',translate:`${shake[0]}px ${shake[1]}px`}}>
  <Background/>
  <Chat beats={beats}/>
  <NotCold beats={beats}/>
  <Alarm beats={beats}/>
  <Subtitles beats={beats}/>
  <Grain/>
  {hasAudio&&<Audio src={staticFile('audio/avoid_1.mp3')}/>}
 </AbsoluteFill>};

export {TAIL};
