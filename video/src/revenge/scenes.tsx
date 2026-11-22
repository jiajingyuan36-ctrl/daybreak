import {AbsoluteFill,interpolate,useCurrentFrame,useVideoConfig} from 'remotion';
import type {CSSProperties,ReactNode} from 'react';
import {C,EASE_CINEMA,EASE_SNAP,FONT,GLASS,SAFE,clamp,pct} from '../design/tokens';
import {CameraRig,type Shake} from '../engine/CameraRig';
import {CinemaSubtitle} from '../engine/CinemaSubtitle';
import {BIG,Focus,Sheen,SpringIn,Strike} from '../engine/KineticText';
import {Flash,LightLeak,OpticalPolish} from '../engine/OpticalPolish';
import {Sfx} from '../engine/Sfx';
import type {SceneScript} from '../avoidant-script';

// 《报复性熬夜》5 幕。规格见 content-kit/revenge-bedtime/CLAUDE_CODE_GOD_MODE_PROMPT.md。
// 时间一律是本幕内的秒数。画面上直接显示口播原话的元素（概念名、金句）卡在说到那句话的时刻（字幕切换点），
// 其余按规格里的百分比走；两者冲突时以口播为准。
export type Timing={length:number;cues:{from:number;to:number}[]};
export type SceneProps={script:SceneScript;timing:Timing};
const useT=()=>{const f=useCurrentFrame();const {fps}=useVideoConfig();return f/fps;};
const cue=(tm:Timing,i:number)=>tm.cues[i].from;

// 左上角状态栏：等宽电子钟 + 呼吸圆点
const StatusBar=({text,color}:{text:string;color:string})=>{const t=useT();const b=.45+.55*(.5+.5*Math.sin(t*4.2));
 return <div style={{position:'absolute',top:185,left:SAFE.left,display:'flex',alignItems:'center',gap:14,fontFamily:FONT.mono,fontSize:30,letterSpacing:'.08em',color,textShadow:`0 1px 3px rgba(0,0,0,.8),0 0 16px ${color}66`}}>
  <span style={{width:10,height:10,borderRadius:'50%',background:color,opacity:b,boxShadow:`0 0 10px ${color}`}}/>{text}</div>};

const Scene=({script,timing,accent,clock,rig,children,sub=true}:SceneProps&{accent:string;clock:{text:string;color:string};rig:Omit<Parameters<typeof CameraRig>[0],'image'|'children'>;children:ReactNode;sub?:boolean})=>
 <AbsoluteFill>
  <CameraRig image={script.image} {...rig}>
   {children}
   <StatusBar text={clock.text} color={clock.color}/>
   {sub&&<CinemaSubtitle cues={script.subtitles.map((c,i)=>({...c,...timing.cues[i]}))} color={accent}/>}
  </CameraRig>
  <OpticalPolish/>
 </AbsoluteFill>;

const Row=({children,style}:{children:ReactNode;style?:CSSProperties})=><div style={{position:'absolute',left:SAFE.right,right:SAFE.right,display:'flex',justifyContent:'center',...style}}>{children}</div>;

// ---------- Scene 1 · 不是不想睡 ----------
export const Scene1=({script,timing}:SceneProps)=>{const t=useT();const {fps}=useVideoConfig();
 const turn=cue(timing,2),anchor=cue(timing,3),today=cue(timing,5);
 const shakes:Shake[]=[{at:4/fps,frames:5,amp:26,dir:'down'}];
 const secs=3*3600+12*60+44+Math.floor(t); // 连续刷屏计时实时跳
 const hms=[Math.floor(secs/3600),Math.floor(secs/60)%60,secs%60].map(v=>String(v).padStart(2,'0')).join(':');
 return <Scene script={script} timing={timing} accent={C.blue} clock={{text:'01:48 AM',color:C.blue}}
  rig={{mask:.32,shakes,aberration:[4,5,6],zoom:[[0,1],[anchor,1.03],[timing.length,1.09]],origin:'50% 62%'}}>
  {/* Beat 1：低电量横幅（0.2s 弹入），认知反转时虚化退到后景 */}
  <Row style={{top:270}}><Focus at={0} dur={.01} out={turn-.1}><SpringIn at={6/fps}>
   <div style={{...GLASS,display:'flex',alignItems:'center',gap:18,padding:'18px 28px',fontFamily:FONT.sans,fontSize:30,color:C.warm}}>
    <svg width="46" height="22" viewBox="0 0 46 22"><rect x="1" y="1" width="39" height="20" rx="5" fill="none" stroke={C.warm} strokeOpacity=".75" strokeWidth="2"/><rect x="41" y="7" width="4" height="8" rx="1.5" fill={C.warm} fillOpacity=".75"/><rect x="4" y="4" width="5" height="14" rx="1.5" fill={C.red}/></svg>
    <span style={{color:C.red,fontWeight:700}}>9%</span><span style={{opacity:.5}}>·</span><span>连续刷屏 <span style={{fontFamily:FONT.mono}}>{hms}</span></span>
   </div></SpringIn></Focus></Row>
  {/* Beat 2：不是没自制力（划掉「没自制力」） */}
  <Row style={{top:430}}><Focus at={turn} out={anchor-.05}><div style={{...BIG,fontSize:96}}>
   <span>不是</span><Strike at={turn+.45}><span>没自制力</span></Strike></div></Focus></Row>
  {/* Beat 3：你不是不想睡 → 今天压根没替自己活过 */}
  <Row style={{top:420,flexDirection:'column',alignItems:'center'}}>
   <Focus at={anchor+.05}><div style={{fontFamily:FONT.sans,fontSize:34,letterSpacing:'.3em',color:C.muted,marginRight:'-.3em'}}>你不是不想睡</div></Focus>
   <Focus at={today} style={{marginTop:26}}><div style={{...BIG,fontSize:70}}>今天压根<span style={{color:C.blue,textShadow:`0 0 26px rgba(124,196,250,.45),${C.shadow}`}}><Sheen at={today+.5}>没替自己活过</Sheen></span></div></Focus>
  </Row>
  <Sfx at={4/fps} name="impact_sub" vol={.35}/><Sfx at={.2} name="pop_glass" vol={.28}/>
  <Sfx at={turn+.42} name="whoosh_soft" vol={.26}/><Sfx at={today} name="impact_sub" vol={.24}/>
 </Scene>};

// ---------- Scene 2 · 白天被掏空 ----------
const SEGS=[{name:'课业 / 工作',w:58,c:'rgba(70,72,76,.95)',end:.15},{name:'通勤与杂事',w:24,c:'rgba(130,132,136,.95)',end:.28},{name:'社交与回复',w:14,c:'rgba(170,58,58,.95)',end:.40}];
const MSGS=[{tag:'微信 · 老板/老师',body:'这个再改一版',at:.50,x:0},{tag:'新消息',body:'在吗？急用',at:.64,x:150},{tag:'日程提醒',body:'明早 08:00 截止',at:.78,x:40}];
export const Scene2=({script,timing}:SceneProps)=>{const t=useT();const L=timing.length;
 const enter=interpolate(t,[.12,.7],[0,1],{...clamp,easing:EASE_CINEMA});
 const fillAt=(i:number)=>{const e=SEGS[i].end*L;return interpolate(t,[e-.32,e],[0,1],{...clamp,easing:EASE_SNAP});};
 const selfOn=interpolate(t,[.40*L+.1,.40*L+.5],[0,1],clamp);
 const lift=interpolate(t,[.48*L,.48*L+.5],[0,1],{...clamp,easing:EASE_CINEMA});
 const sink=interpolate(t,[L-.8,L-.1],[0,1],clamp);
 const squeeze=MSGS.reduce((a,m)=>a+Math.max(0,1-Math.abs(t-m.at*L-.08)/.18)*.012,0);
 let left=0;
 return <Scene script={script} timing={timing} accent={C.red} clock={{text:'DAYTIME · 14:20',color:C.grey}}
  rig={{mask:.36,zoom:[[0,1],[L,1.06]],tilt:.6}}>
  <AbsoluteFill style={{scale:1-squeeze}}>
   {/* Beat 1：24 小时归属卡片 */}
   <div style={{position:'absolute',top:262-lift*30,left:SAFE.left,right:SAFE.right,opacity:enter*(1-lift*.25),perspective:900}}>
    <div style={{...GLASS,padding:'26px 30px 28px',transform:`rotateX(${(1-enter)*8}deg)`,transformOrigin:'50% 0%'}}>
     <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
      <div style={{fontFamily:FONT.sans,fontWeight:700,fontSize:30,color:C.warm}}>今日 24 小时归属分配</div>
      <div style={{fontFamily:FONT.mono,fontSize:22,color:C.muted}}>{pct(SEGS.reduce((a,s,i)=>a+s.w*fillAt(i),0))}% 归别人</div>
     </div>
     <div style={{position:'relative',height:46,marginTop:62,background:'rgba(255,255,255,.06)',outline:'1px solid rgba(255,255,255,.12)'}}>
      {SEGS.map((s,i)=>{const x=left;left+=s.w;return <div key={s.name} style={{position:'absolute',left:`${x}%`,top:0,bottom:0,width:`${pct(s.w*fillAt(i))}%`,background:s.c,borderRight:fillAt(i)>=1?'2px solid rgba(0,0,0,.5)':'none'}}/>;})}
      <div style={{position:'absolute',left:'96%',width:'4%',top:0,bottom:0,background:C.blue,opacity:selfOn,boxShadow:`0 0 18px ${C.blue}`}}/>
      {/* 折线标注：从 4% 窄缝向上拉出 */}
      <svg width="240" height="60" style={{position:'absolute',right:0,top:-58,overflow:'visible',opacity:selfOn}}><path d="M232 58 V30 H60" fill="none" stroke={C.blue} strokeWidth="1.5" pathLength={1} strokeDasharray="1" strokeDashoffset={1-selfOn}/></svg>
      <div style={{position:'absolute',right:190,top:-62,fontFamily:FONT.sans,fontWeight:700,fontSize:26,color:C.blue,whiteSpace:'nowrap',opacity:selfOn}}>属于自己：4%</div>
     </div>
     <div style={{display:'flex',gap:26,marginTop:18,fontFamily:FONT.sans,fontSize:21,color:C.muted}}>
      {SEGS.map((s,i)=><span key={s.name} style={{display:'flex',alignItems:'center',gap:8,opacity:.3+.7*fillAt(i)}}><i style={{width:14,height:14,background:s.c,display:'inline-block'}}/>{s.name} {s.w}%</span>)}
     </div>
    </div>
   </div>
   {/* Beat 2：三条催命消息 */}
   {MSGS.map((m,i)=><div key={m.tag} style={{position:'absolute',top:600+i*112+sink*26,left:SAFE.left+m.x,opacity:1-sink*.55,filter:`grayscale(${sink})`}}>
    <SpringIn at={m.at*L}><div style={{...GLASS,display:'flex',gap:16,alignItems:'center',padding:'16px 24px',fontFamily:FONT.sans,fontSize:29,color:C.warm,background:'rgba(24,26,30,.62)'}}>
     <span style={{width:36,height:36,borderRadius:9,background:i===2?'rgba(217,74,74,.85)':'rgba(255,255,255,.18)',display:'inline-block',flex:'none'}}/>
     <span style={{color:C.muted,fontSize:23}}>{m.tag}</span><span style={{fontWeight:700}}>{m.body}</span>
    </div></SpringIn></div>)}
  </AbsoluteFill>
  <Sfx at={0} name="whoosh_soft" vol={.22}/>
  {SEGS.map(s=><Sfx key={s.name} at={s.end*L} name="tick_clock" vol={.3}/>)}
  {MSGS.map(m=><Sfx key={m.tag} at={m.at*L} name="pop_glass" vol={.28}/>)}
 </Scene>};

// ---------- Scene 3 · 凌晨主权夺回 ----------
const COUNT=[[0,47],[.52,52],[.65,57],[.78,61],[.90,64]] as const;
export const Scene3=({script,timing}:SceneProps)=>{const t=useT();const L=timing.length;
 const mine=cue(timing,4);
 const n=[...COUNT].reverse().find(([p])=>t>=p*L)?.[1]??47;
 const lastJump=[...COUNT].reverse().find(([p])=>t>=p*L)?.[0]??0;
 const bump=lastJump>0?Math.max(0,1-(t-lastJump*L)/.18):0;
 const breathe=.5+.5*Math.sin(t*3.2);const press=((t-.48*L)%1.2+1.2)%1.2<.14?2:0;
 const line=interpolate(t,[.9,2.2],[0,1],{...clamp,easing:EASE_CINEMA});
 const glow=interpolate(t,[mine,mine+.5],[0,1],clamp);
 return <Scene script={script} timing={timing} accent={C.blue} clock={{text:'02:34 AM',color:C.blue}}
  rig={{mask:.32,zoom:[[0,1],[L,1.13]],origin:'52% 48%',rack:(s)=>interpolate(s,[.48*L,.48*L+.5],[0,1.5],clamp),tilt:.5}}>
  {/* Beat 1：这几个小时，总算归我了（「归我了」说到时才亮冷蓝） */}
  <Row style={{top:300,flexDirection:'column',alignItems:'center'}}>
   <Focus at={.6}><div style={{...BIG,fontSize:64}}>这几个小时，总算<span style={{color:`rgb(${Math.round(245-121*glow)},${Math.round(243-47*glow)},${Math.round(238+12*glow)})`,textShadow:`0 0 ${26*glow}px rgba(124,196,250,.5),${C.shadow}`}}>{glow>0?<Sheen at={mine+.3}>归我了</Sheen>:'归我了'}</span></div></Focus>
   <div style={{display:'flex',gap:200,marginTop:28}}>{[0,1].map(i=><div key={i} style={{width:150*line,height:1,background:`linear-gradient(90deg,${i?'rgba(124,196,250,.6)':'transparent'},${i?'transparent':'rgba(124,196,250,.6)'})`,opacity:.5+.5*breathe}}/>)}</div>
  </Row>
  {/* Beat 2：刷视频计数 + 舍不得按的锁屏键 */}
  <Row style={{top:520}}><SpringIn at={.48*L}>
   <div style={{...GLASS,display:'flex',alignItems:'center',gap:30,padding:'18px 22px 18px 32px',borderRadius:999}}>
    <div style={{fontFamily:FONT.sans,fontSize:30,color:C.warm,whiteSpace:'nowrap'}}>第 <span style={{display:'inline-block',fontFamily:FONT.mono,fontWeight:700,color:C.blue,scale:1+bump*.25,minWidth:44,textAlign:'center'}}>{n}</span> 条短视频</div>
    <div style={{position:'relative',width:58,height:58,display:'flex',alignItems:'center',justifyContent:'center'}}>
     <div style={{position:'absolute',inset:-6,borderRadius:'50%',border:`1.5px solid ${C.blue}`,opacity:.25+.55*breathe,scale:.9+.18*breathe}}/>
     <svg width="40" height="40" viewBox="0 0 40 40" style={{translate:`0px ${press}px`}}><path d="M20 6 V19" stroke={C.blue} strokeWidth="3" strokeLinecap="round"/><path d="M12 11 A12 12 0 1 0 28 11" fill="none" stroke={C.blue} strokeWidth="3" strokeLinecap="round"/></svg>
    </div>
   </div></SpringIn></Row>
  <Sfx at={0} name="whoosh_soft" vol={.22}/>
  {COUNT.slice(1).map(([p])=><Sfx key={p} at={p*L} name="tick_clock" vol={.32}/>)}
 </Scene>};

// ---------- Scene 4 · 早八加倍还债 ----------
export const Scene4=({script,timing}:SceneProps)=>{const t=useT();const {fps}=useVideoConfig();const L=timing.length;
 const named=1.3; // 「报复性熬夜」四个字大约在第 1.3 秒念到（第一句字幕 0.17–2.29s，按字数推算）
 const bill=cue(timing,5);
 const buzz=t<.9||((t-.9)%1.6<.3&&t<named+2)?Math.sin(t*95)*5:0;
 return <AbsoluteFill>
  <Scene script={script} timing={timing} accent={C.red} clock={{text:'07:00 AM',color:C.red}}
   rig={{mask:.32,zoom:[[0,1.05],[.5,1.02],[L,1.07]],shakes:[{at:0,frames:6,amp:8,dir:'x'},{at:named,frames:3,amp:6,dir:'x'}],aberration:[0,1,2,Math.round(named*fps),Math.round(named*fps)+1],dust:30}}>
   {/* Beat 1：闹钟条 */}
   <Row style={{top:262,translate:`${buzz}px 0px`}}><SpringIn at={.05}>
    <div style={{...GLASS,display:'flex',alignItems:'center',gap:18,padding:'18px 30px',background:'rgba(150,34,34,.58)',border:'1px solid rgba(255,190,190,.28)'}}>
     <svg width="38" height="38" viewBox="0 0 34 34"><circle cx="17" cy="19" r="11" fill="none" stroke={C.warm} strokeWidth="2.4"/><path d="M17 13 V19 L21 22" fill="none" stroke={C.warm} strokeWidth="2.4" strokeLinecap="round"/><path d="M5 9 L10 4 M29 9 L24 4" stroke={C.warm} strokeWidth="2.4" strokeLinecap="round"/></svg>
     <div><div style={{fontFamily:FONT.sans,fontWeight:700,fontSize:32,color:C.warm}}><span style={{fontFamily:FONT.mono}}>07:00 AM</span> · 闹钟响了</div>
      <div style={{fontFamily:FONT.sans,fontSize:22,color:'rgba(245,243,238,.75)',marginTop:4}}>已贪睡延迟 3 次</div></div>
    </div></SpringIn></Row>
   {/* Beat 2：概念定锚 */}
   <Row style={{top:470,flexDirection:'column',alignItems:'center'}}>
    <Focus at={named}><div style={{...BIG,fontSize:118}}>报复性熬夜</div></Focus>
    <Focus at={named+.35}><div style={{fontFamily:FONT.mono,fontSize:21,letterSpacing:'.22em',color:'rgba(245,243,238,.72)',marginTop:16}}>REVENGE BEDTIME PROCRASTINATION</div></Focus>
   </Row>
   {/* Beat 3：账单 */}
   <Row style={{top:760}}><Focus at={bill}>
    <div style={{...GLASS,display:'flex',alignItems:'center',padding:'22px 34px',gap:30}}>
     <div style={{textAlign:'center'}}><div style={{fontFamily:FONT.sans,fontSize:24,color:C.muted}}>凌晨偷回</div><div style={{fontFamily:FONT.mono,fontWeight:700,fontSize:46,color:C.blue,marginTop:6}}>+2h 自由</div></div>
     <svg width="70" height="24" viewBox="0 0 70 24"><path d="M2 12 H64 M54 3 L66 12 L54 21" fill="none" stroke={C.warm} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1-interpolate(t,[bill+.3,bill+.8],[0,1],clamp)}/></svg>
     <div style={{textAlign:'center'}}><div style={{fontFamily:FONT.sans,fontSize:24,color:C.muted}}>早八还债</div><div style={{fontFamily:FONT.mono,fontWeight:700,fontSize:46,color:C.red,marginTop:6}}>-8h 精力</div></div>
    </div></Focus></Row>
   <Sfx at={0} name="alarm_harsh" vol={.32}/><Sfx at={named} name="impact_sub" vol={.3}/><Sfx at={bill} name="whoosh_soft" vol={.24}/>
  </Scene>
  <Flash at={0} frames={3}/>
 </AbsoluteFill>};

// ---------- Scene 5 · 留半小时给自己 ----------
export const Scene5=({script,timing}:SceneProps)=>{const t=useT();const L=timing.length;
 const l1=cue(timing,2),l2=cue(timing,4),cta=cue(timing,5);
 const warm=interpolate(t,[0,.8],[0,1],clamp);
 const under=interpolate(t,[l1+.5,l1+1.8],[0,1],{...clamp,easing:EASE_CINEMA});
 const tint=<><AbsoluteFill style={{background:'rgba(255,175,95,.2)',mixBlendMode:'soft-light',opacity:warm}}/>
  <AbsoluteFill style={{background:'linear-gradient(180deg,rgba(20,12,4,.55) 0%,rgba(20,12,4,.35) 28%,rgba(20,12,4,0) 45%)'}}/></>;
 const LIT={textShadow:'0 2px 4px rgba(0,0,0,.55),0 4px 24px rgba(0,0,0,.75)'};
 return <AbsoluteFill>
  <Scene script={script} timing={timing} accent={C.amber} clock={{text:'05:45 PM',color:C.amber}}
   rig={{mask:.24,zoom:[[0,1.02],[L,1.08]],tilt:.4,dust:16,tint}}>
   <Row style={{top:300,flexDirection:'column',alignItems:'center'}}>
    <Focus at={l1}><div style={{...BIG,...LIT,fontSize:66}}>白天给自己<span style={{position:'relative',color:C.amber}}>留半小时
     <span style={{position:'absolute',left:0,bottom:-8,height:2,width:`${pct(under*100)}%`,background:`linear-gradient(90deg,rgba(242,193,125,.95),rgba(242,193,125,.2))`,boxShadow:'0 0 10px rgba(242,193,125,.7)'}}/></span>，</div></Focus>
    <Focus at={l2} style={{marginTop:30}}><div style={{...BIG,...LIT,fontSize:66}}>晚上才舍得放下手机。</div></Focus>
   </Row>
   <Row style={{top:620}}><SpringIn at={cta}>
    <div style={{...GLASS,padding:'20px 36px',borderRadius:999,background:'rgba(60,40,20,.42)',border:'1px solid rgba(242,193,125,.5)',fontFamily:FONT.sans,fontSize:31,color:C.warm,whiteSpace:'nowrap'}}>
     说真的，刷到这条时你那边<span style={{color:C.amber,fontWeight:700}}>几点了</span>？ ↓</div></SpringIn></Row>
   <Sfx at={0} name="chime_warm" vol={.3}/><Sfx at={cta} name="pop_glass" vol={.26}/>
  </Scene>
  <LightLeak at={0} dur={.9} tone="warm"/>
 </AbsoluteFill>};
