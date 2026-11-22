import {AbsoluteFill,Audio,type CalculateMetadataFunction,Easing,Img,Sequence,continueRender,delayRender,interpolate,random,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {useEffect,useState,type CSSProperties,type ReactNode} from 'react';
import '@fontsource/noto-serif-sc/700.css';
import '@fontsource/noto-sans-sc/400.css';
import '@fontsource/noto-sans-sc/700.css';
import timeline from '../stayup-timeline.json';
import {SCENES} from '../stayup-script';
import type {SceneScript} from '../avoidant-script';

// 《报复性熬夜》1080×1920，30fps。帧数全部从 src/stayup-timeline.json 算（npm run tts -- stayup 生成）。
// 配音按幕首尾相接；画面幕间 10 帧交叉溶图，只有第 3→4 幕（凌晨→早八）硬切 + 白闪。
// 底图 public/images/stayup_1~5.jpg 由外部提供；缺图时用占位底色并在画面上标出来，不生成同名文件。

// ---------- 规范 ----------
const WARM='#F5F3EE',BLUE='#7CC4FA',RED='#D94A4A',AMBER='#F2C17D',MUTED='rgba(245,243,238,0.62)';
const SERIF="'Songti SC','Noto Serif SC',serif",SANS="-apple-system,'PingFang SC','Noto Sans SC',sans-serif",MONO="'DejaVu Sans Mono','Menlo',monospace";
const SHADOW='0 2px 16px rgba(0,0,0,0.6)';
const SAFE={top:180,right:140,bottom:280,left:72};
const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;
const soft=Easing.bezier(.16,1,.3,1);
const FPS=timeline.fps,XF=10,OUT=12;
const ACCENT=[BLUE,BLUE,BLUE,RED,AMBER];

type Timing={length:number;cues:{from:number;to:number}[]};
type P={script:SceneScript;timing:Timing;hasImage:boolean};
const useT=()=>{const f=useCurrentFrame();const {fps}=useVideoConfig();return f/fps;};
const cueAt=(t:Timing,i:number)=>t.cues[i].from;

const UI='电量已连续使用小时分不是不想睡今天压根没替自己活过今日归属工作课业通勤回消息杂事自己改一下在吗明天交这几个总算归我了刷掉第条视频闹钟响延迟次报复性熬夜凌晨偷来的自由早八加倍还债白天给留半晚上才舍得放下手机说真的你现在那边几点缺底图→·「」（）%…，。？：';
const ALL=UI+SCENES.map(s=>s.narration).join('');
const useFonts=()=>{const [h]=useState(()=>delayRender('fonts'));
 useEffect(()=>{Promise.all([`700 60px 'Noto Serif SC'`,`700 40px 'Noto Sans SC'`,`400 30px 'Noto Sans SC'`].map(f=>document.fonts.load(f,ALL))).then(()=>continueRender(h));},[h]);};

// ---------- 共用层 ----------
// 底图：铺满 + 慢推；全局遮罩 0.32，只在顶部 20%、底部 30% 加暗角
const Backdrop=({image,hasImage,zoom=[1,1.07],tint}:{image:string;hasImage:boolean;zoom?:[number,number];tint?:ReactNode})=>{
 const f=useCurrentFrame();const {durationInFrames}=useVideoConfig();const p=f/durationInFrames;
 return <AbsoluteFill style={{overflow:'hidden',background:'linear-gradient(180deg,#1b2129,#0d1014)'}}>
  {hasImage?<Img src={staticFile(image)} style={{width:'100%',height:'100%',objectFit:'cover',scale:interpolate(p,[0,1],zoom)}}/>
   :<div style={{position:'absolute',top:'46%',left:0,right:0,textAlign:'center',fontFamily:MONO,fontSize:26,color:'rgba(245,243,238,.35)'}}>缺底图 {image}</div>}
  {tint}
  <AbsoluteFill style={{background:'rgba(0,0,0,0.32)'}}/>
  <AbsoluteFill style={{background:'linear-gradient(180deg,rgba(0,0,0,.5) 0%,rgba(0,0,0,0) 20%,rgba(0,0,0,0) 70%,rgba(0,0,0,.55) 100%)'}}/>
 </AbsoluteFill>};

const Grain=()=>{const f=useCurrentFrame();const k=Math.floor(f/3);const seed=Math.floor(random('sg'+k)*1000);
 return <AbsoluteFill style={{opacity:.05,mixBlendMode:'overlay',pointerEvents:'none'}}>
  <svg width="100%" height="100%"><filter id={'sg'+k}><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves={2} seed={seed} stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" filter={`url(#sg${k})`}/></svg>
 </AbsoluteFill>};

// 左上角电子钟：贯穿前 4 幕的时间线索
const Clock=({text,color=WARM,blink=false}:{text:string;color?:string;blink?:boolean})=>{const t=useT();
 const on=!blink||Math.floor(t*2)%2===0;
 const [a,b]=text.includes(':')?text.split(':'):[text,''];
 return <div style={{position:'absolute',top:SAFE.top+14,left:SAFE.left,fontFamily:MONO,fontSize:34,letterSpacing:'.08em',color,textShadow:`0 0 18px ${color}55`}}>
  {b?<>{a}<span style={{opacity:on?1:.15}}>:</span>{b}</>:a}</div>};

const Hi=({text,words,color}:{text:string;words:string[];color:string})=>{
 if(!words.length)return <>{text}</>;
 const parts=text.split(new RegExp(`(${words.join('|')})`));
 return <>{parts.map((p,i)=>words.includes(p)?<span key={i} style={{color}}>{p}</span>:<span key={i}>{p}</span>)}</>;};

// 底部电影字幕：无底框，多层柔影；每句不超过 13 字（稿子里已切好）
const Subtitle=({script,timing,color}:{script:SceneScript;timing:Timing;color:string})=>{const t=useT();
 const i=timing.cues.findIndex(c=>t>=c.from&&t<c.to);if(i<0)return null;const c=timing.cues[i],s=script.subtitles[i];
 const o=Math.min(interpolate(t,[c.from,c.from+.1],[0,1],clamp),interpolate(t,[c.to-.06,c.to],[1,0],clamp));
 return <div style={{position:'absolute',left:SAFE.left,right:SAFE.right,bottom:310,textAlign:'center',opacity:o,whiteSpace:'nowrap',
  fontFamily:SANS,fontWeight:700,fontSize:42,letterSpacing:'.02em',color:WARM,textShadow:'0 1px 2px rgba(0,0,0,.85),0 2px 10px rgba(0,0,0,.6),0 0 28px rgba(0,0,0,.45)'}}>
  <Hi text={s.text} words={s.highlight} color={color}/></div>};

// 焦外聚焦浮现
const Focus=({at,dur=.5,children,style}:{at:number;dur?:number;children:ReactNode;style?:CSSProperties})=>{const t=useT();
 const p=interpolate(t,[at,at+dur],[0,1],{...clamp,easing:soft});
 return <div style={{opacity:p,filter:`blur(${(1-p)*10}px)`,translate:`0px ${(1-p)*14}px`,...style}}>{children}</div>};
// 弹出（小幅回弹）
const Pop=({at,children,style}:{at:number;children:ReactNode;style?:CSSProperties})=>{const t=useT();
 const p=interpolate(t,[at,at+.35],[0,1],{...clamp,easing:Easing.bezier(.34,1.56,.64,1)});
 return <div style={{opacity:Math.min(1,p*1.6),scale:.86+.14*p,...style}}>{children}</div>};
const Glass:CSSProperties={background:'rgba(22,24,28,0.6)',backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',border:'1px solid rgba(255,255,255,0.14)',borderRadius:16};
const Big:CSSProperties={fontFamily:SERIF,fontWeight:700,color:WARM,textShadow:SHADOW,letterSpacing:'.06em',whiteSpace:'nowrap'};

const Frame=({script,timing,hasImage,i,children,zoom,tint}:P&{i:number;children:ReactNode;zoom?:[number,number];tint?:ReactNode})=>
 <AbsoluteFill style={{background:'#000'}}>
  <Backdrop image={script.image} hasImage={hasImage} zoom={zoom} tint={tint}/>
  {children}
  <Subtitle script={script} timing={timing} color={ACCENT[i]}/>
  <Grain/>
 </AbsoluteFill>;

// ---------- Scene 1 · 开场痛点 ----------
const Scene1=(p:P)=>{const t=useT();const {timing}=p;
 // 0.2s 手机砸脸：画面猛地下坠再回弹
 const drop=interpolate(t,[.2,.28,.42,.6],[0,22,-6,0],clamp);
 const not=cueAt(timing,3),today=cueAt(timing,5);
 return <AbsoluteFill style={{translate:`0px ${drop}px`}}><Frame {...p} i={0}>
  <Clock text="01:48" color={RED} blink/>
  <Pop at={.28} style={{position:'absolute',top:SAFE.top+80,left:0,right:0,display:'flex',justifyContent:'center'}}>
   <div style={{...Glass,display:'flex',alignItems:'center',gap:16,padding:'14px 26px',fontFamily:SANS,fontSize:28,color:WARM}}>
    <svg width="40" height="20" viewBox="0 0 40 20"><rect x="1" y="1" width="34" height="18" rx="4" fill="none" stroke={WARM} strokeOpacity=".7" strokeWidth="2"/><rect x="36" y="6" width="3" height="8" rx="1" fill={WARM} fillOpacity=".7"/><rect x="4" y="4" width="4" height="12" rx="1" fill={RED}/></svg>
    <span><span style={{color:RED}}>电量 9%</span> · 已连续使用 3 小时 12 分</span>
   </div>
  </Pop>
  <div style={{position:'absolute',top:660,left:0,right:0,display:'flex',flexDirection:'column',alignItems:'center'}}>
   <Focus at={not}><div style={{...Big,fontSize:118}}>不是不想睡</div></Focus>
   <Pop at={today} style={{marginTop:34}}><div style={{...Big,fontSize:56,color:BLUE,textShadow:`0 0 24px rgba(124,196,250,.35),${SHADOW}`}}>「今天压根没替自己活过」</div></Pop>
  </div>
 </Frame></AbsoluteFill>};

// ---------- Scene 2 · 白天被掏空 ----------
const SEGS=[{name:'工作/课业',w:44},{name:'通勤',w:12},{name:'回消息',w:24},{name:'杂事',w:16}]; // 合计 96%，剩 4% 给「自己」
const Scene2=(p:P)=>{const t=useT();const {timing}=p;
 const fillFrom=cueAt(timing,1),fillTo=cueAt(timing,4)+.6;
 const fill=interpolate(t,[fillFrom,fillTo],[0,96],{...clamp,easing:Easing.inOut(Easing.cubic)});
 const selfOn=interpolate(t,[fillTo-.1,fillTo+.4],[0,1],clamp);
 const W=860,X=(1080-W)/2-30;
 const bubbles=[{t:'「改一下」',at:cueAt(timing,3),x:110,y:330},{t:'「在吗」',at:cueAt(timing,4),x:520,y:290},{t:'「明天交」',at:cueAt(timing,4)+1.1,x:300,y:410}];
 let left=0;
 return <Frame {...p} i={1}>
  <Clock text="DAYTIME" color={MUTED}/>
  {bubbles.map(b=>{const dim=interpolate(t,[b.at+.9,b.at+1.4],[1,.35],clamp);
   return <Pop key={b.t} at={b.at} style={{position:'absolute',left:b.x,top:b.y,opacity:dim}}>
    <div style={{...Glass,padding:'12px 24px',fontFamily:SANS,fontSize:32,color:WARM}}>{b.t}</div></Pop>;})}
  <div style={{position:'absolute',top:560,left:X,width:W}}>
   <Focus at={fillFrom-.3}><div style={{fontFamily:MONO,fontSize:20,color:MUTED,letterSpacing:'.2em',marginBottom:14}}>今日 24 小时归属</div></Focus>
   <div style={{position:'relative',height:56,border:'1px solid rgba(245,243,238,.35)',opacity:interpolate(t,[fillFrom-.3,fillFrom],[0,1],clamp)}}>
    {SEGS.map((s,k)=>{const x=left;left+=s.w;const shown=Math.max(0,Math.min(s.w,fill-x));
     return <div key={s.name} style={{position:'absolute',left:`${x}%`,width:`${shown}%`,top:0,bottom:0,background:`rgba(225,222,215,${.78-k*.12})`,borderRight:shown>=s.w?'2px solid rgba(0,0,0,.45)':'none',overflow:'hidden'}}>
      <div style={{fontFamily:SANS,fontSize:22,color:'#1d1f22',padding:'14px 0 0 12px',whiteSpace:'nowrap',opacity:shown>=s.w*.8?1:0}}>{s.name}</div></div>;})}
    <div style={{position:'absolute',left:'96%',width:'4%',top:0,bottom:0,boxShadow:`inset 0 0 0 2px ${BLUE}`,opacity:selfOn}}/>
   </div>
   <div style={{position:'absolute',right:0,top:'100%',marginTop:14,textAlign:'right',opacity:selfOn,fontFamily:SANS,fontSize:26,color:BLUE,whiteSpace:'nowrap'}}>↑ 自己 · 4%</div>
  </div>
 </Frame>};

// ---------- Scene 3 · 凌晨主权夺回 ----------
const Lock=({breath}:{breath:number})=><svg width="34" height="40" viewBox="0 0 34 40" style={{opacity:.55+.45*breath}}>
 <path d="M8 18 V12 a9 9 0 0 1 18 0 V18" fill="none" stroke={BLUE} strokeWidth="2.5"/><rect x="3" y="18" width="28" height="20" rx="4" fill="none" stroke={BLUE} strokeWidth="2.5"/></svg>;
const Scene3=(p:P)=>{const t=useT();const {timing}=p;
 const mine=cueAt(timing,4),scroll=cueAt(timing,5);
 const n=Math.round(interpolate(t,[scroll,timing.length-.3],[44,47],clamp));
 const prog=((t-scroll)*.9)%1;const barIn=interpolate(t,[scroll-.2,scroll+.3],[0,1],clamp);
 return <Frame {...p} i={2} zoom={[1,1.12]}>
  <Clock text="02:34" color={BLUE}/>
  <div style={{position:'absolute',top:SAFE.top+150,left:0,right:0,display:'flex',justifyContent:'center'}}>
   <Focus at={mine}><div style={{...Big,fontSize:70}}>这几个小时，总算<span style={{color:BLUE,textShadow:`0 0 24px rgba(124,196,250,.4),${SHADOW}`}}>归我了</span></div></Focus>
  </div>
  <div style={{position:'absolute',left:SAFE.left+40,right:SAFE.right+40,bottom:430,opacity:barIn,display:'flex',alignItems:'center',gap:24}}>
   <div style={{flex:1}}>
    <div style={{fontFamily:SANS,fontSize:28,color:WARM,textShadow:SHADOW,marginBottom:14}}>刷掉第 <span style={{fontFamily:MONO,color:BLUE}}>{n}</span> 条视频…</div>
    <div style={{height:2,background:'rgba(245,243,238,.22)'}}><div style={{height:2,width:`${Math.max(0,prog)*100}%`,background:BLUE}}/></div>
   </div>
   <Lock breath={.5+.5*Math.sin(t*3)}/>
  </div>
 </Frame>};

// ---------- Scene 4 · 借明天的命 ----------
const AlarmIcon=()=><svg width="34" height="34" viewBox="0 0 34 34"><circle cx="17" cy="19" r="11" fill="none" stroke={WARM} strokeWidth="2.4"/><path d="M17 13 V19 L21 22" fill="none" stroke={WARM} strokeWidth="2.4" strokeLinecap="round"/><path d="M5 9 L10 4 M29 9 L24 4" stroke={WARM} strokeWidth="2.4" strokeLinecap="round"/></svg>;
const Scene4=(p:P)=>{const t=useT();const {timing}=p;
 const flash=interpolate(t,[0,.04,.3],[.85,.85,0],clamp); // 早八刺眼：切进来先白一下
 const buzz=t<1.3||((t-1.3)%1.6<.35)?Math.sin(t*90)*6:0;  // 闹钟震动
 const note=cueAt(timing,5);
 const draw=interpolate(t,[note+.4,note+1.1],[0,1],clamp);
 return <Frame {...p} i={3}>
  <Clock text="07:00" color={RED}/>
  <Pop at={.12} style={{position:'absolute',top:SAFE.top+80,left:SAFE.left,right:SAFE.right,translate:`${buzz}px 0px`}}>
   <div style={{display:'flex',alignItems:'center',gap:16,padding:'16px 24px',borderRadius:16,background:'rgba(160,40,40,.62)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',border:'1px solid rgba(255,200,200,.25)',fontFamily:SANS,fontSize:30,color:WARM}}>
    <AlarmIcon/><span><b style={{fontFamily:MONO}}>07:00</b> 闹钟响了（已延迟 3 次）</span>
   </div>
  </Pop>
  <div style={{position:'absolute',top:700,left:0,right:0,display:'flex',flexDirection:'column',alignItems:'center'}}>
   <Focus at={.35}><div style={{...Big,fontSize:120}}>报复性熬夜</div></Focus>
   <Focus at={note} style={{marginTop:40,rotate:'-1.5deg'}}>
    <div style={{fontFamily:SERIF,fontWeight:700,fontSize:40,color:WARM,textShadow:SHADOW,whiteSpace:'nowrap'}}>凌晨偷来的自由 → 早八<span style={{color:RED}}>加倍还债</span></div>
    <svg width="560" height="22" viewBox="0 0 560 22" style={{display:'block',margin:'6px auto 0'}}><path d="M6 14 C 120 4, 260 20, 380 10 S 520 8, 554 12" fill="none" stroke={RED} strokeWidth="3" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1-draw}/></svg>
   </Focus>
  </div>
  <AbsoluteFill style={{background:'#fff',opacity:flash,pointerEvents:'none'}}/>
 </Frame>};

// ---------- Scene 5 · 活人收尾 ----------
const Scene5=(p:P)=>{const t=useT();const {timing}=p;
 const warm=interpolate(t,[0,.6],[0,1],clamp);
 const l1=cueAt(timing,2),l2=cueAt(timing,4),cta=Math.min(cueAt(timing,5),timing.length-3);
 const tint=<AbsoluteFill style={{background:'rgba(242,170,90,0.22)',mixBlendMode:'soft-light',opacity:warm}}/>;
 return <Frame {...p} i={4} tint={tint}>
  <div style={{position:'absolute',top:SAFE.top+170,left:SAFE.left,right:SAFE.right,display:'flex',flexDirection:'column',alignItems:'center'}}>
   <Focus at={l1}><div style={{...Big,fontSize:62}}>白天给自己<span style={{color:AMBER}}>留半小时</span>，</div></Focus>
   <Focus at={l2} style={{marginTop:24}}><div style={{...Big,fontSize:62}}>晚上才舍得放下手机。</div></Focus>
  </div>
  <Pop at={cta} style={{position:'absolute',left:0,right:0,bottom:440,display:'flex',justifyContent:'center'}}>
   <div style={{padding:'18px 36px',borderRadius:999,background:'rgba(30,24,18,.45)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',border:'1px solid rgba(242,193,125,.45)',fontFamily:SANS,fontSize:32,color:WARM}}>
    说真的，你现在那边<span style={{color:AMBER}}>几点了</span>？</div>
  </Pop>
 </Frame>};

// ---------- 主 Composition ----------
const COMPONENTS=[Scene1,Scene2,Scene3,Scene4,Scene5];
const HARD_CUT_BEFORE=3; // 第 4 幕（下标 3）硬切进来
const starts:number[]=[];let acc=0;for(const s of timeline.scenes){starts.push(acc);acc+=Math.round(s.length*FPS);}
export const STAYUP_FRAMES=acc;

const FadeIn=({children,fade}:{children:ReactNode;fade:boolean})=>{const f=useCurrentFrame();
 return <AbsoluteFill style={{opacity:fade?interpolate(f,[0,XF],[0,1],{extrapolateRight:'clamp'}):1}}>{children}</AbsoluteFill>};
const Black=()=>{const f=useCurrentFrame();const {durationInFrames}=useVideoConfig();
 return <AbsoluteFill style={{background:'#000',pointerEvents:'none',opacity:interpolate(f,[durationInFrames-OUT,durationInFrames-1],[0,1],clamp)}}/>};

export type StayUpProps={images:boolean[]};
export const StayUpLateVideo=({images}:StayUpProps)=>{useFonts();
 return <AbsoluteFill style={{background:'#000'}}>
  {timeline.scenes.map((s,i)=>{const C=COMPONENTS[i];const len=Math.round(s.length*FPS);const last=i===timeline.scenes.length-1;
   // 下一幕要交叉溶图时，本幕多留 XF 帧垫底；下一幕硬切则不留
   const extra=last||i+1===HARD_CUT_BEFORE?0:XF;
   return <Sequence key={s.id} name={`Scene ${s.id} · ${SCENES[i].name}`} from={starts[i]} durationInFrames={len+extra}>
    <FadeIn fade={i>0&&i!==HARD_CUT_BEFORE}><C script={SCENES[i]} timing={{length:s.length,cues:s.cues}} hasImage={images[i]??false}/></FadeIn>
   </Sequence>;})}
  {timeline.scenes.map((s,i)=>{const len=Math.round(s.length*FPS);const last=i===timeline.scenes.length-1;
   return <Sequence key={'a'+s.id} name={`配音 ${s.id}`} from={starts[i]} durationInFrames={len} layout="none">
    <Audio src={staticFile(s.audio)} volume={(f)=>last?interpolate(f,[len-OUT,len-1],[1,0],clamp):1}/>
   </Sequence>;})}
  <Black/>
 </AbsoluteFill>};

// 检查 5 张底图在不在（缺的用占位底色）
export const calcStayUp:CalculateMetadataFunction<StayUpProps>=async({props})=>{
 const images=await Promise.all(SCENES.map(s=>fetch(staticFile(s.image),{method:'HEAD'}).then(r=>r.ok&&(r.headers.get('content-type')||'').startsWith('image')).catch(()=>false)));
 return {durationInFrames:STAYUP_FRAMES,fps:FPS,props:{...props,images}};};
