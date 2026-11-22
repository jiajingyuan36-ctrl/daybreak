import {AbsoluteFill,Sequence,interpolate,useCurrentFrame,useVideoConfig} from 'remotion';
import type {CSSProperties,ReactNode} from 'react';
import {FIN,FONT,GLASS,SAFE,clamp,pct,EASE_CINEMA} from '../design/tokens';
import {CameraRig,type RigProps} from '../engine/CameraRig';
import {CinemaSubtitle} from '../engine/CinemaSubtitle';
import {Focus,SpringIn,Strike,Sheen} from '../engine/KineticText';
import {LightLeak,OpticalPolish} from '../engine/OpticalPolish';
import {Highlighter,RollingNumber,SecFilingClip,StampSeal} from '../engine/FinancialCharts';
import {Sfx} from '../engine/Sfx';
import type {SceneScript} from '../avoidant-script';

// 《星巴克：不付利息的「银行」》5 幕。规格见 content-kit/starbucks-bank/CLAUDE_CODE_GOD_MODE_PROMPT.md。
// 画面上的数字和词卡在说到它的那句字幕开头（时间轴来自配音停顿）；数据口径见 src/sbux-script.ts 顶部。
export type Timing={length:number;cues:{from:number;to:number}[]};
export type SceneProps={script:SceneScript;timing:Timing};
const useT=()=>{const f=useCurrentFrame();const {fps}=useVideoConfig();return f/fps;};
const cue=(tm:Timing,i:number)=>tm.cues[i].from;
const SHADOW='0 2px 16px rgba(0,0,0,.65)';
const HEAD:CSSProperties={fontFamily:FONT.serif,fontWeight:900,color:FIN.paper,textShadow:SHADOW,letterSpacing:'.04em',whiteSpace:'nowrap'};

// 纪录片眉标：左上档案号、右上 SEC FORM 10-K（都在安全区内）
const Masthead=()=><>
 <div style={{position:'absolute',top:185,left:SAFE.left,fontFamily:FONT.mono,fontSize:21,letterSpacing:'.2em',color:FIN.muted,textShadow:'0 1px 3px rgba(0,0,0,.8)'}}>BUSINESS ARCHIVE · FY2026</div>
 <div style={{position:'absolute',top:185,right:SAFE.right,fontFamily:FONT.mono,fontSize:21,letterSpacing:'.2em',color:FIN.gold,textShadow:'0 1px 3px rgba(0,0,0,.8)'}}>SEC FORM 10-K</div></>;
const Row=({children,style}:{children:ReactNode;style?:CSSProperties})=><div style={{position:'absolute',left:SAFE.right,right:SAFE.right,display:'flex',justifyContent:'center',...style}}>{children}</div>;

const Frame=({script,timing,rig,image,children,sub=true}:SceneProps&{rig:Omit<RigProps,'image'|'children'>;image?:string;children:ReactNode;sub?:boolean})=>
 <AbsoluteFill>
  <CameraRig image={image??script.image} {...rig}>
   {children}<Masthead/>
   {sub&&<CinemaSubtitle cues={script.subtitles.map((c,i)=>({...c,...timing.cues[i]}))} color={FIN.gold}/>}
  </CameraRig>
  <OpticalPolish/>
 </AbsoluteFill>;

// ---------- Scene 1 · 卖咖啡只是幌子 ----------
export const Scene1=({script,timing}:SceneProps)=>{const {fps}=useVideoConfig();const t=useT();
 const wake=cue(timing,3),bank=cue(timing,4),noint=cue(timing,5);
 const up=interpolate(t,[bank-.1,bank+.4],[0,1],{...clamp,easing:EASE_CINEMA});
 return <Frame script={script} timing={timing} rig={{mask:.32,zoom:[[0,1],[timing.length,1.08]],origin:'50% 64%',
  shakes:[{at:3/fps,frames:4,amp:10,dir:'down'},{at:wake,frames:3,amp:7,dir:'x'}],aberration:[3,4,5]}}>
  <Row style={{top:290-up*40,flexDirection:'column',alignItems:'center',opacity:1-up*.35,scale:1-up*.12}}>
   <Focus at={3/fps} dur={.4}><div style={{...HEAD,fontSize:96}}>靠<Strike at={wake+.05} color={FIN.red}>卖咖啡</Strike>赚钱？</div></Focus>
   <Focus at={.45}><div style={{marginTop:18,padding:'6px 18px',border:`1.5px solid ${FIN.gold}`,fontFamily:FONT.mono,fontSize:26,letterSpacing:'.12em',color:FIN.gold}}>¥35 / CUP</div></Focus>
  </Row>
  <Row style={{top:560}}><SecFilingClip at={bank} rotate={-1.8}>
   <div style={{fontFamily:FONT.mono,fontSize:18,letterSpacing:'.2em',opacity:.6}}>BUSINESS MODEL · NOTE</div>
   <div style={{fontFamily:FONT.serif,fontWeight:900,fontSize:104,letterSpacing:'.06em',marginTop:6}}><Highlighter at={bank+.35}>无息银行</Highlighter></div>
   <div style={{display:'flex',justifyContent:'flex-end',marginTop:4}}><StampSeal at={noint} rotate={-6}><span style={{fontFamily:FONT.mono,fontSize:22,fontWeight:700}}>0% INTEREST BANK</span></StampSeal></div>
  </SecFilingClip></Row>
  <Sfx at={3/fps} name="impact_sub" vol={.34}/><Sfx at={wake} name="whoosh_cinema" vol={.28}/>
  <Sfx at={bank} name="paper_flip" vol={.32}/><Sfx at={noint} name="impact_sub" vol={.26}/>
 </Frame>};

// ---------- Scene 2 · 16.79 亿美元 ----------
export const Scene2=({script,timing}:SceneProps)=>{const {fps}=useVideoConfig();const t=useT();
 const rollAt=cue(timing,2),land=cue(timing,4)+.6,rmb=cue(timing,5);
 const ticks:number[]=[];for(let x=rollAt;x<land-.05;x+=.12)ticks.push(x);
 const zoom=interpolate(t,[rollAt,land],[0,1],{...clamp,easing:EASE_CINEMA});
 return <Frame script={script} timing={timing} rig={{mask:.34,zoom:[[0,1],[rollAt,1.02],[land,1.07],[timing.length,1.09]],origin:'50% 40%',
  shakes:[{at:land,frames:3,amp:6,dir:'x'}],aberration:[Math.round(land*fps),Math.round(land*fps)+1,Math.round(land*fps)+2]}}>
  <Row style={{top:258,scale:1-zoom*.1,translate:`0px ${-zoom*30}px`,opacity:1-zoom*.3}}><SecFilingClip at={4/fps} rotate={-1.2} width={800}>
   <div style={{display:'flex',justifyContent:'space-between',fontFamily:FONT.mono,fontSize:17,letterSpacing:'.12em',opacity:.65}}><span>STARBUCKS CORP · FORM 10-K</span><span>FISCAL 2026</span></div>
   <div style={{height:1.5,background:FIN.ink,opacity:.5,margin:'12px 0 14px'}}/>
   <div style={{fontFamily:FONT.mono,fontSize:21,lineHeight:1.9}}>
    <div style={{opacity:.45}}>Deferred revenue ...................</div>
    <div><Highlighter at={cue(timing,1)}>Stored value cards &amp; loyalty program</Highlighter></div>
    <div style={{display:'flex',justifyContent:'space-between'}}><span>Balance, September 27, 2026</span><b>$1,678.7M</b></div>
   </div>
  </SecFilingClip></Row>
  <Row style={{top:640,flexDirection:'column',alignItems:'center'}}>
   <Focus at={rollAt-.1}><RollingNumber to={1678700000} at={rollAt} land={land} style={{fontSize:92,color:FIN.gold,textShadow:`0 0 30px rgba(212,175,55,.35),${SHADOW}`}}/></Focus>
   <Focus at={rmb} style={{marginTop:20}}><div style={{fontFamily:FONT.sans,fontWeight:700,fontSize:36,color:FIN.paper,textShadow:SHADOW}}>≈ 120 亿人民币 · 就这么躺在账上</div></Focus>
   <Focus at={rmb+.3} style={{marginTop:12}}><div style={{fontFamily:FONT.mono,fontSize:17,color:FIN.muted,letterSpacing:'.06em'}}>Source: Starbucks FY2026 Form 10-K · 储值卡与会员积分负债</div></Focus>
  </Row>
  <Sfx at={4/fps} name="cash_register" vol={.3}/><Sfx at={cue(timing,1)} name="paper_flip" vol={.2}/>
  {ticks.map(x=><Sfx key={x} at={x} name="counter_tick" vol={.2}/>)}
  <Sfx at={land} name="impact_sub" vol={.32}/>
 </Frame>};

// ---------- Scene 3 · 比 85.7% 的银行还多 + 金库插镜 ----------
const BankCompare=({timing}:{timing:Timing})=>{const t=useT();
 const boardAt=cue(timing,1),bigAt=cue(timing,3);
 const fill=interpolate(t,[boardAt+.4,bigAt],[0,85.7],{...clamp,easing:EASE_CINEMA});
 return <Row style={{top:262}}><SpringIn at={boardAt}>
  <div style={{...GLASS,width:800,padding:'26px 30px 24px',background:'rgba(16,20,24,.62)'}}>
   <div style={{fontFamily:FONT.sans,fontWeight:700,fontSize:28,color:FIN.paper}}>美国 4,208 家受保银行 · 单家存款</div>
   <div style={{fontFamily:FONT.sans,fontSize:20,color:FIN.muted,marginTop:6}}>对比星巴克 储值卡与积分余额 $16.79 亿</div>
   <div style={{position:'relative',height:44,marginTop:22,background:'rgba(45,106,79,.9)',outline:`1.5px solid ${FIN.gold}`}}>
    <div style={{position:'absolute',left:0,top:0,bottom:0,width:`${pct(fill)}%`,background:'linear-gradient(90deg,rgba(120,124,130,.95),rgba(160,164,170,.95))'}}/>
    <div style={{position:'absolute',left:14,top:9,fontFamily:FONT.sans,fontSize:21,fontWeight:700,color:FIN.ink,opacity:fill>40?1:0}}>3,605 家：存款 ≤ $16.79 亿</div>
    <div style={{position:'absolute',right:10,top:9,fontFamily:FONT.sans,fontSize:19,color:FIN.paper,opacity:fill>80?1:0}}>其余</div>
   </div>
   <div style={{display:'flex',alignItems:'baseline',gap:16,marginTop:20}}>
    <Focus at={bigAt}><RollingNumber prefix="" suffix="%" decimals={1} to={85.7} at={bigAt} land={bigAt+.5} style={{fontSize:76,color:FIN.gold}}/></Focus>
    <Focus at={bigAt+.3}><div style={{fontFamily:FONT.serif,fontWeight:900,fontSize:40,color:FIN.paper}}>的银行，存款没它多</div></Focus>
   </div>
   <div style={{fontFamily:FONT.mono,fontSize:15,color:FIN.muted,marginTop:14,lineHeight:1.6}}>第三方测算：银行 FDIC 2026-06-30 存款 · 星巴克 10-K 2026-09-27<br/>两者日期与口径不同，星巴克这笔钱不是存款</div>
  </div></SpringIn></Row>};
export const Scene3=({script,timing}:SceneProps)=>{const {fps}=useVideoConfig();
 const cut=cue(timing,5),stamp=cue(timing,7);const cutF=Math.round(cut*fps);const L=timing.length;
 const subCues=script.subtitles.map((c,i)=>({...c,...timing.cues[i]}));
 return <AbsoluteFill>
  <Sequence durationInFrames={cutF} layout="none"><Frame script={script} timing={timing} sub={false} rig={{mask:.3,zoom:[[0,1],[cut,1.06]],origin:'60% 30%'}}>
   <BankCompare timing={timing}/></Frame></Sequence>
  {/* 6 帧暗切到金库插镜 */}
  <Sequence from={cutF} layout="none"><DipIn frames={6}><Frame script={script} timing={{length:L-cut,cues:[]}} image="images/sbux_vault.jpg" sub={false}
   rig={{mask:.3,zoom:[[0,1.04],[L-cut,1.1]],shakes:[{at:stamp-cut,frames:4,amp:12,dir:'x'}],dust:30}}>
   <Row style={{top:520,flexDirection:'column',alignItems:'center'}}>
    <StampSeal at={stamp-cut} rotate={-7}><div style={{fontSize:74}}>存款利率：0.00%</div></StampSeal>
    <Focus at={stamp-cut+.4} style={{marginTop:44}}><div style={{fontFamily:FONT.sans,fontWeight:700,fontSize:32,color:FIN.paper,textShadow:SHADOW}}>银行揽储要付息 · 星巴克不用付</div></Focus>
   </Row></Frame></DipIn></Sequence>
  <AbsoluteFill><CinemaSubtitle cues={subCues} color={FIN.gold}/></AbsoluteFill>
  <Sfx at={0} name="whoosh_cinema" vol={.24}/><Sfx at={cue(timing,1)+.3} name="whoosh_cinema" vol={.2}/><Sfx at={cue(timing,3)+.5} name="impact_sub" vol={.26}/>
  <Sfx at={cut} name="whoosh_cinema" vol={.3}/><Sfx at={stamp} name="stamp_heavy" vol={.36}/>
 </AbsoluteFill>};
const DipIn=({frames,children}:{frames:number;children:ReactNode})=>{const f=useCurrentFrame();
 return <AbsoluteFill>{children}<AbsoluteFill style={{background:'#000',opacity:interpolate(f,[0,frames],[1,0],clamp),pointerEvents:'none'}}/></AbsoluteFill>};

// ---------- Scene 4 · 2.22 亿美元沉睡余额 ----------
const TAGS=[{text:'充完卡忘了花',cue:1,x:-170,r:-4},{text:'搬家把卡弄丢',cue:2,x:150,r:3},{text:'剩几块钱懒得凑',cue:3,x:-60,r:-2}];
export const Scene4=({script,timing}:SceneProps)=>{const {fps}=useVideoConfig();const t=useT();
 const billAt=cue(timing,4),land=cue(timing,7)+.5,stamp=cue(timing,8);
 const dim=interpolate(t,[billAt-.1,billAt+.4],[0,1],clamp);
 const ticks:number[]=[];for(let x=billAt+.6;x<land-.05;x+=.14)ticks.push(x);
 return <Frame script={script} timing={timing} rig={{mask:.32,zoom:[[0,1],[timing.length,1.08]],origin:'50% 70%',shakes:[{at:stamp,frames:4,amp:8,dir:'x'}],
  aberration:[Math.round(stamp*fps)]}}>
  {TAGS.map((g,i)=><div key={g.text} style={{position:'absolute',top:265+i*62,left:540+g.x,translate:'-50% 0',opacity:1-dim*.7,scale:1-dim*.1}}>
   <SpringIn at={cue(timing,g.cue)}><div style={{...GLASS,padding:'10px 24px',rotate:`${g.r}deg`,fontFamily:FONT.sans,fontWeight:700,fontSize:30,color:FIN.paper,whiteSpace:'nowrap'}}>{g.text}</div></SpringIn></div>)}
  <Row style={{top:500}}><SecFilingClip at={billAt} rotate={1.4} width={800}>
   <div style={{display:'flex',justifyContent:'space-between',fontFamily:FONT.mono,fontSize:17,letterSpacing:'.12em',opacity:.65}}><span>沉睡余额 · BREAKAGE REVENUE</span><span>FY2026</span></div>
   <div style={{height:1.5,background:FIN.ink,opacity:.5,margin:'12px 0 10px'}}/>
   <div style={{fontFamily:FONT.mono,fontSize:21,lineHeight:1.8}}>
    <div style={{display:'flex',justifyContent:'space-between'}}><span>直营门店 Company-operated</span><span>$198.2M</span></div>
    <div style={{display:'flex',justifyContent:'space-between'}}><span>授权门店 Licensed</span><span>$24.0M</span></div>
   </div>
   <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginTop:12}}>
    <div><RollingNumber to={222200000} at={billAt+.6} land={land} prefix="+$" style={{fontSize:56,color:FIN.greenHi}}/><span style={{fontFamily:FONT.sans,fontSize:26,fontWeight:700}}> / 年</span>
     <div style={{fontFamily:FONT.sans,fontSize:22,opacity:.7,marginTop:6}}>≈ 16 亿人民币 · 直接记为收入</div></div>
    <StampSeal at={stamp} rotate={-10}><div style={{fontSize:34,lineHeight:1.2,textAlign:'center'}}>咖啡成本<br/>$0</div></StampSeal>
   </div>
  </SecFilingClip></Row>
  {TAGS.map(g=><Sfx key={g.text} at={cue(timing,g.cue)} name="pop_glass" vol={.26}/>)}
  <Sfx at={billAt} name="paper_flip" vol={.32}/>{ticks.map(x=><Sfx key={x} at={x} name="counter_tick" vol={.18}/>)}
  <Sfx at={land} name="impact_sub" vol={.24}/><Sfx at={stamp} name="stamp_heavy" vol={.36}/>
 </Frame>};

// ---------- Scene 5 · 低手卷产品，高手卷现金流 ----------
export const Scene5=({script,timing}:SceneProps)=>{const t=useT();
 const l1=cue(timing,1),l2=cue(timing,2),cta=cue(timing,4);
 const line=interpolate(t,[l2+.5,l2+1.6],[0,1],{...clamp,easing:EASE_CINEMA});
 const LIT:CSSProperties={textShadow:'0 2px 4px rgba(0,0,0,.6),0 4px 26px rgba(0,0,0,.8)'};
 const tint=<AbsoluteFill style={{background:'linear-gradient(180deg,rgba(18,12,6,.6) 0%,rgba(18,12,6,.35) 30%,rgba(18,12,6,0) 48%)'}}/>;
 return <AbsoluteFill>
  <Frame script={script} timing={timing} rig={{mask:.24,zoom:[[0,1.02],[timing.length,1.08]],tilt:.4,dust:18,tint}}>
   <Row style={{top:300,flexDirection:'column',alignItems:'center'}}>
    <Focus at={l1}><div style={{...HEAD,...LIT,fontWeight:700,fontSize:46}}>低手都在卷产品差价，</div></Focus>
    <Focus at={l2} style={{marginTop:22}}><div style={{...HEAD,...LIT,fontSize:62}}>高手都在卷「<span style={{color:FIN.gold}}><Sheen at={l2+.6}>现金流</Sheen></span>」。</div></Focus>
    <div style={{width:`${pct(line*60)}%`,minWidth:2,height:1.5,marginTop:22,background:`linear-gradient(90deg,transparent,${FIN.gold},transparent)`}}/>
   </Row>
   <Row style={{top:640}}><SpringIn at={cta}>
    <div style={{...GLASS,padding:'18px 32px',borderRadius:999,background:'rgba(40,28,16,.48)',border:'1px solid rgba(212,175,55,.5)',fontFamily:FONT.sans,fontSize:29,color:FIN.paper,whiteSpace:'nowrap'}}>
     你手机里哪张储值卡，充了钱却一直<span style={{color:FIN.gold,fontWeight:700}}>没花完</span>？ ↓</div></SpringIn></Row>
   <Sfx at={0} name="chime_outro" vol={.3}/><Sfx at={cta} name="cash_register" vol={.18}/>
  </Frame>
  <LightLeak at={0} dur={.9} tone="warm"/>
 </AbsoluteFill>};
