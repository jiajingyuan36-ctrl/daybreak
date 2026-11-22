import {AbsoluteFill,Easing,interpolate,useCurrentFrame,useVideoConfig} from 'remotion';
import type {ReactNode} from 'react';
import {Backdrop,CinemaSubtitle,FilmOverlay,Focus,GOLD,Hi,MONO,MUTED,RED,SAFE,SANS,SERIF,SHADOW,WARM,clamp,soft} from './kit';
import type {SceneScript} from '../avoidant-script';

// 《回避型依恋》5 幕。每幕拿到自己的稿子和时间轴（秒，从本幕开头算），
// 字幕切换点来自配音停顿（src/avoidant-timeline.json）；画面上的关键动作卡在对应那句字幕的开头。
export type SceneTiming={length:number;cues:{from:number;to:number}[]};
type P={script:SceneScript;timing:SceneTiming};
const useT=()=>{const f=useCurrentFrame();const {fps}=useVideoConfig();return f/fps;};
const Frame=({script,timing,children,mask,maskTo}:P&{children:ReactNode;mask?:number;maskTo?:number})=>
 <AbsoluteFill style={{background:'#000'}}>
  <Backdrop image={script.image} mask={mask} maskTo={maskTo}/>
  {children}
  <CinemaSubtitle cues={script.subtitles.map((c,i)=>({...c,...timing.cues[i]}))}/>
  <FilmOverlay/>
 </AbsoluteFill>;
const cueAt=(timing:SceneTiming,i:number)=>timing.cues[i].from;

// ---------- Scene 1 · 亲密警报 ----------
const typed=(t:number,L:number)=>{const at=(p:number)=>p*L;const a='我也想见你',b='最近有点忙，改天吧';
 if(t<at(.12))return '';
 if(t<at(.24))return a.slice(0,Math.ceil(a.length*(t-at(.12))/(at(.24)-at(.12))));
 if(t<at(.30))return a;
 if(t<at(.36))return a.slice(0,Math.max(0,a.length-Math.ceil(a.length*(t-at(.30))/(at(.36)-at(.30)))));
 if(t<at(.48))return b.slice(0,Math.ceil(b.length*(t-at(.36))/(at(.45)-at(.36))));
 return b;};
const Glass:React.CSSProperties={background:'rgba(24,26,30,0.78)',backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',border:'1px solid rgba(255,255,255,0.14)',borderRadius:18};
const Chat=({L,flip}:{L:number;flip:number})=>{const t=useT();
 const pop=interpolate(t,[0,.3],[0,1],{...clamp,easing:Easing.spring({damping:15})});
 const box=interpolate(t,[.08*L,.08*L+.25],[0,1],{...clamp,easing:soft});
 const exit=interpolate(t,[.48*L,flip+.1],[0,1],{...clamp,easing:soft});
 const text=typed(t,L);const sending=text==='最近有点忙，改天吧';const caret=Math.floor(t*2.4)%2===0;
 return <div style={{position:'absolute',top:SAFE.top+110,left:SAFE.left,right:SAFE.right,opacity:1-exit,filter:`blur(${exit*12}px)`,scale:1-exit*.04}}>
  <div style={{display:'flex',alignItems:'center',gap:18,opacity:pop,translate:`0px ${(1-pop)*22}px`}}>
   <div style={{width:52,height:52,borderRadius:'50%',flex:'none',display:'flex',alignItems:'center',justifyContent:'center',background:'radial-gradient(circle at 35% 30%,#8d8378,#4a443e 70%)',boxShadow:'0 0 18px rgba(229,197,133,.22)',fontFamily:SERIF,fontWeight:700,fontSize:24,color:'rgba(243,239,230,.9)'}}>她</div>
   <div style={{...Glass,padding:'20px 26px',fontFamily:SANS,fontSize:36,color:WARM,whiteSpace:'nowrap'}}>今天好想见你，下班一起吃饭？</div>
  </div>
  <div style={{...Glass,marginTop:34,display:'flex',alignItems:'center',gap:16,padding:'14px 16px 14px 24px',opacity:box,translate:`0px ${(1-box)*18}px`}}>
   <div style={{flex:1,fontFamily:SANS,fontSize:34,color:WARM,minHeight:48,display:'flex',alignItems:'center'}}>
    {text}<span style={{display:'inline-block',width:2,height:40,marginLeft:3,background:WARM,opacity:caret?.85:0}}/>
   </div>
   <div style={{padding:'10px 22px',borderRadius:12,fontFamily:SANS,fontSize:28,fontWeight:700,color:'rgba(243,239,230,.95)',background:'rgba(58,118,86,0.85)',opacity:sending?1:.45}}>发送</div>
  </div>
 </div>};
const NotCold=({flip,alarm}:{flip:number;alarm:number})=>{const t=useT();
 const strike=interpolate(t,[flip+.5,flip+.72],[0,1],{...clamp,easing:Easing.bezier(.7,0,.3,1)});
 const gone=interpolate(t,[alarm-.05,alarm+.15],[1,0],clamp);
 return <div style={{position:'absolute',top:560,left:0,right:0,display:'flex',justifyContent:'center',opacity:gone}}>
  <Focus at={flip} style={{fontFamily:SERIF,fontWeight:700,fontSize:132,letterSpacing:'.08em',color:WARM,textShadow:SHADOW,whiteSpace:'nowrap'}}>
   <span>不是</span><span style={{position:'relative',display:'inline-block'}}>冷血
    <span style={{position:'absolute',left:'-3%',right:'3%',top:'52%',height:6,background:RED,transformOrigin:'left center',scale:`${strike} 1`}}/>
   </span>
  </Focus>
 </div>};
const Alarm=({alarm}:{alarm:number})=>{const t=useT();const cy=600; // 放在窗户上沿，不压人物
 const ring=(d:number,color:string)=>{const p=interpolate(t,[alarm+d,alarm+d+1.6],[0,1],{...clamp,easing:Easing.out(Easing.quad)});
  return <circle cx="540" cy={cy} r={120+p*560} fill="none" stroke={color} strokeWidth={1} opacity={p>0&&p<1?(1-p)*.85:0}/>};
 return <AbsoluteFill>
  <svg width="1080" height="1920" style={{position:'absolute',inset:0}}>{ring(.15,RED)}{ring(.55,GOLD)}</svg>
  <div style={{position:'absolute',top:cy-110,left:0,right:0,display:'flex',flexDirection:'column',alignItems:'center'}}>
   <Focus at={alarm+.02} dur={.5} style={{fontFamily:SERIF,fontWeight:700,fontSize:150,letterSpacing:'.1em',marginRight:'-.1em',color:WARM,textShadow:SHADOW}}>亲密警报</Focus>
   <Focus at={alarm+.3} style={{fontFamily:SANS,fontSize:24,letterSpacing:'.5em',marginRight:'-.5em',color:GOLD,marginTop:22}}>AVOIDANT ATTACHMENT</Focus>
  </div>
 </AbsoluteFill>};
export const Scene1=({script,timing}:P)=>{const f=useCurrentFrame();const {fps}=useVideoConfig();
 const flip=cueAt(timing,2),alarm=cueAt(timing,3);
 const k=f-Math.round(alarm*fps);const dx=k>=0&&k<3?[-4,4,-2][k]:0;
 return <div style={{position:'absolute',inset:0,translate:`${dx}px 0px`}}><Frame script={script} timing={timing}>
  <Chat L={timing.length} flip={flip}/><NotCold flip={flip} alarm={alarm}/><Alarm alarm={alarm}/>
 </Frame></div>};

// ---------- Scene 2 · 安全距离边界 ----------
export const Scene2=({script,timing}:P)=>{const t=useT();const L=timing.length;
 const radarAt=cueAt(timing,1),hit=cueAt(timing,3);
 const up=interpolate(t,[radarAt-.1,radarAt+.5],[0,1],{...clamp,easing:soft});
 const cx=540,cy=600,R=130;
 // 光点：从外侧（r=330）在 radarAt→hit 慢慢靠近，碰到边界后被推回 r=250
 const r=t<hit?interpolate(t,[radarAt+.3,hit],[330,R+10],{...clamp,easing:Easing.inOut(Easing.sin)}):interpolate(t,[hit,hit+.7],[R+10,250],{...clamp,easing:soft});
 const ang=-Math.PI*.18;const dot=interpolate(t,[radarAt+.1,radarAt+.5],[0,1],clamp);
 const alert=interpolate(t,[hit,hit+.12,hit+.5,hit+.9],[0,1,.7,1],clamp);
 const flick=t>hit&&t<hit+.45?(Math.floor((t-hit)*20)%2?.55:1):1;
 const wave=interpolate(t,[hit,hit+1.1],[0,1],clamp);
 const label=interpolate(t,[hit+.15,hit+.5],[0,1],clamp);
 const ring=alert>0?`rgba(200,75,75,${.95*flick})`:'rgba(243,239,230,.7)';
 return <Frame script={script} timing={timing}>
  <div style={{position:'absolute',top:SAFE.top+80-up*36,left:0,right:0,textAlign:'center',scale:1-up*.18}}>
   <Focus at={.15}><div style={{fontFamily:SERIF,fontWeight:700,fontSize:68,letterSpacing:'.1em',marginRight:'-.1em',color:WARM,textShadow:SHADOW}}>回避型依恋</div></Focus>
   <Focus at={.45}><div style={{fontFamily:SANS,fontSize:20,letterSpacing:'.5em',marginRight:'-.5em',color:GOLD,marginTop:14}}>AVOIDANT ATTACHMENT</div></Focus>
  </div>
  <svg width="1080" height="1920" style={{position:'absolute',inset:0,opacity:up}}>
   <circle cx={cx} cy={cy} r={R} fill="none" stroke={ring} strokeWidth={1.6} strokeDasharray="6 8"/>
   <circle cx={cx} cy={cy} r={R+wave*200} fill="none" stroke={RED} strokeWidth={1} opacity={wave>0&&wave<1?(1-wave)*.8:0}/>
   <circle cx={cx} cy={cy} r={5} fill={WARM}/>
   <circle cx={cx+Math.cos(ang)*r} cy={cy+Math.sin(ang)*r} r={8} fill={GOLD} opacity={dot}/>
   <circle cx={cx+Math.cos(ang)*r} cy={cy+Math.sin(ang)*r} r={22} fill={GOLD} opacity={dot*.18}/>
  </svg>
  <div style={{position:'absolute',top:cy+18,left:0,right:0,textAlign:'center',opacity:up,fontFamily:SANS,fontSize:22,color:MUTED,letterSpacing:'.2em',marginRight:'-.2em'}}>自我</div>
  <div style={{position:'absolute',top:cy-R-44,left:0,right:0,textAlign:'center',opacity:up,fontFamily:SANS,fontSize:20,color:alert>0?'rgba(200,75,75,.9)':MUTED,letterSpacing:'.2em',marginRight:'-.2em'}}>安全距离边界</div>
  <div style={{position:'absolute',top:cy+R+40,left:0,right:0,textAlign:'center',opacity:label,fontFamily:MONO,fontSize:22,color:WARM,letterSpacing:'.12em'}}>[ 距离过近 · 触发防御 ]</div>
 </Frame>};

// ---------- Scene 3 · 早年防御铠甲 ----------
const Node=({n,title,sub,at,next,gold}:{n:string;title:ReactNode;sub:string;at:number;next:number|null;gold?:boolean})=>{const t=useT();
 const on=interpolate(t,[at,at+.5],[0,1],{...clamp,easing:soft});const dim=next===null?1:interpolate(t,[next,next+.4],[1,.45],clamp);
 return <div style={{display:'flex',gap:28,alignItems:'flex-start',opacity:on*dim,filter:`blur(${(1-on)*8}px)`,translate:`${(1-on)*12}px 0px`}}>
  <div style={{width:20,height:20,marginTop:16,borderRadius:'50%',flex:'none',background:gold?GOLD:WARM,boxShadow:gold?'0 0 18px rgba(229,197,133,.6)':'none'}}/>
  <div>
   <div style={{fontFamily:MONO,fontSize:20,color:GOLD,letterSpacing:'.2em'}}>{n}</div>
   <div style={{fontFamily:SERIF,fontWeight:700,fontSize:50,color:WARM,textShadow:SHADOW,marginTop:8,whiteSpace:'nowrap'}}>{title}</div>
   <div style={{fontFamily:MONO,fontSize:18,color:MUTED,letterSpacing:'.18em',marginTop:10}}>{sub}</div>
  </div>
 </div>};
export const Scene3=({script,timing}:P)=>{const t=useT();const L=timing.length;
 const a1=.15*L,a2=.45*L,a3=cueAt(timing,3);
 const line=interpolate(t,[a1-.2,a3+.6],[0,1],{...clamp,easing:soft});const glow=interpolate(t,[a3+.3,a3+1],[0,1],clamp);
 return <Frame script={script} timing={timing}>
  <div style={{position:'absolute',top:SAFE.top+150,left:150,width:1,height:560*line,background:'rgba(243,239,230,0.28)',boxShadow:glow?`0 ${560*line}px 24px 2px rgba(229,197,133,${.5*glow})`:'none'}}/>
  <div style={{position:'absolute',top:SAFE.top+132,left:141,display:'flex',flexDirection:'column',gap:66}}>
   <Node n="01" at={a1} next={a2} title="表达需求 → 落空" sub="EARLY EXPERIENCE"/>
   <Node n="02" at={a2} next={a3} title="学会独自消化" sub="EMOTIONAL SHUTDOWN"/>
   <Node n="03" at={a3} next={null} gold title={<>把「<span style={{color:GOLD}}>独立</span>」穿成<span style={{color:GOLD}}>铠甲</span></>} sub="ARMOR OF INDEPENDENCE"/>
  </div>
 </Frame>};

// ---------- Scene 4 · 撕裂感 ----------
export const Scene4=({script,timing}:P)=>{const t=useT();const L=timing.length;
 const out1=interpolate(t,[.33*L,.4*L],[1,0],clamp);const pairIn=.38*L;
 const apart=interpolate(t,[.45*L,.95*L],[0,1],{...clamp,easing:Easing.inOut(Easing.sin)});
 const lineIn=interpolate(t,[pairIn+.3,pairIn+.8],[0,1],clamp);
 const gap=130+apart*150; // 两组文字之间的空隙（px）
 const Block=({main,sub,align}:{main:ReactNode;sub:string;align:'left'|'right'})=>
  <div style={{textAlign:align}}><div style={{fontFamily:SERIF,fontWeight:700,fontSize:46,color:WARM,textShadow:SHADOW,whiteSpace:'nowrap'}}>{main}</div>
   <div style={{fontFamily:MONO,fontSize:18,color:MUTED,letterSpacing:'.2em',marginTop:12}}>{sub}</div></div>;
 return <Frame script={script} timing={timing}>
  <div style={{position:'absolute',top:SAFE.top+200,left:0,right:0,display:'flex',flexDirection:'column',alignItems:'center',opacity:out1}}>
   <Focus at={.2}><div style={{fontFamily:SERIF,fontWeight:700,fontSize:76,letterSpacing:'.12em',marginRight:'-.12em',color:WARM,textShadow:SHADOW}}>撕裂感</div></Focus>
   <Focus at={.6}><div style={{width:90,height:1,background:GOLD,marginTop:26}}/></Focus>
  </div>
  <div style={{position:'absolute',top:SAFE.top+210,left:0,right:0,height:120}}>
   <div style={{position:'absolute',right:540+gap/2,top:0}}><Focus at={pairIn}><Block align="right" main="嘴上说「算了」" sub="PUSHING AWAY"/></Focus></div>
   <div style={{position:'absolute',left:540+gap/2,top:0}}><Focus at={pairIn+.25}><Block align="left" main={<>心里怕「<span style={{color:GOLD}}>失去</span>」</>} sub="FEAR OF LOSS"/></Focus></div>
   <div style={{position:'absolute',top:32,left:540-gap/2+14,width:Math.max(0,gap-28),borderTop:'1px dashed rgba(243,239,230,.55)',opacity:lineIn}}/>
  </div>
 </Frame>};

// ---------- Scene 5 · 留一条缝 ----------
export const Scene5=({script,timing}:P)=>{const t=useT();const L=timing.length;
 const l1=.15*L,l2=l1+.6,cta=.65*L;
 const breath=interpolate(t,[l2+.5,l2+1.6],[0,1],{...clamp,easing:soft})*(.75+.25*Math.sin(t*2.2));
 return <Frame script={script} timing={timing} mask={.36} maskTo={.26}>
  <div style={{position:'absolute',top:SAFE.top+170,left:SAFE.left,right:SAFE.right,display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center'}}>
   <Focus at={l1}><div style={{fontFamily:SERIF,fontWeight:700,fontSize:48,letterSpacing:'.08em',color:WARM,textShadow:SHADOW}}>不必立刻卸下铠甲，</div></Focus>
   <Focus at={l2}><div style={{fontFamily:SERIF,fontWeight:700,fontSize:62,letterSpacing:'.08em',color:WARM,textShadow:SHADOW,marginTop:26}}><Hi text="先试着留一条缝。" words={['留一条缝']}/></div></Focus>
   <div style={{width:220*breath+10,height:1,marginTop:30,background:`linear-gradient(90deg,transparent,rgba(229,197,133,${.9*breath}),transparent)`}}/>
   <Focus at={cta} dur={.7} style={{marginTop:60}}>
    <div style={{padding:'16px 34px',borderRadius:999,background:'rgba(24,26,30,.42)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',border:'1px solid rgba(255,255,255,.16)',fontFamily:SANS,fontSize:28,color:WARM,letterSpacing:'.06em'}}>评论区聊聊 · 你是哪一种依恋？</div>
   </Focus>
  </div>
 </Frame>};
