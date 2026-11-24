import React from 'react';
import {AbsoluteFill,interpolate,spring,useCurrentFrame,useVideoConfig} from 'remotion';
import {C,COLD,loadFonts,mix,tw} from './theme';
import {Backdrop,Dust,Grain,Vignette,Caption,Defs,Figure,Reflection,Bubble,Band,Heartbeat,Knob,valueToAngle,G} from './parts';
import {BUBBLE_A,BUBBLE_B,KNOB_LABEL} from './copy';
loadFonts();

// 第 1 期：回避型依恋。核心比喻：B 心里有一扇门（门从 15 秒开始出现）。
// 所有角色都在一个虚拟摄像机里：摄像机把世界坐标 (cx,cy) 对到屏幕 (960,sy)，再按 zoom 缩放。时间都用秒写。
export const Episode01:React.FC=()=>{const f=useCurrentFrame();const {fps,durationInFrames}=useVideoConfig();const s=(t:number)=>t*fps;
 const AX0=560,BX=1360,CHEST=G-185;
 const KX=1110,KY=G-150; // 旋钮在 B 身前

 // ── 摄像机 ──（easeInOutCubic，慢；分段首尾相接，不跳）
 const zoom=tw(f,[0,s(3),s(5.8),s(8),s(9.4),s(13),s(15)],[1.15,1.22,1.55,1.6,1.8,1.83,1.42]);
 const cx=tw(f,[0,s(3),s(5.8),s(8),s(9.4),s(13),s(15)],[960,975,BX,BX,1245,1245,1120]);
 const cy=tw(f,[0,s(3),s(5.8),s(8),s(9.4),s(13),s(15)],[565,570,CHEST,CHEST,620,620,600]);
 const sy=tw(f,[0,s(3),s(5.8),s(8),s(9.4)],[610,612,600,600,650]);
 const cam=`translate(960 ${sy}) scale(${zoom}) translate(${-cx} ${-cy})`;

 // ── 呼吸：1.0–1.012，周期 3.2 秒，两人相位错开 ──
 const br=(ph:number)=>1.006+0.006*Math.sin((f/fps)/3.2*2*Math.PI+ph);

 // ── A 往前走 180px，前倾再回正（3.8–5.2s）──
 const ax=tw(f,[s(3.8),s(5.2)],[AX0,AX0+180]);
 const aLean=tw(f,[s(3.6),s(4.3),s(5.2),s(5.6)],[0,5,1.5,0]);
 // A 在特写时退到画外虚化；13–15s 拉远时光微微晃两下（失落）
 const aBlur=tw(f,[s(7.8),s(9.4),s(13),s(15)],[0,7,7,3]);
 const aFlick=1-0.45*Math.max(tw(f,[s(13.4),s(13.55),s(13.8)],[0,1,0])*(f<s(13.8)?1:0),tw(f,[s(14.1),s(14.25),s(14.6)],[0,1,0])*(f>=s(14.1)&&f<s(14.6)?1:0));

 // ── 警报：心跳四下，间隔 0.8 → 0.6 → 0.45 秒 ──
 const beats=[5.05,5.85,6.45,6.9].map(s);
 const red=Math.max(0,...beats.map(b=>f<b?0:tw(f,[b,b+s(0.08),b+s(0.45)],[0,1,0])));

 // ── 拧旋钮：7.4–8.2s 旋钮出现，8.2–8.6s 手伸过去，8.6–9.8s 从 10 拧到 2（阻尼，末尾轻微回弹）──
 const knobO=tw(f,[s(7.4),s(8.2)],[0,1]);
 const turn=spring({frame:f-s(8.6),fps,config:{damping:11,stiffness:95,mass:0.9},durationInFrames:s(1.2)});
 const knobA=interpolate(turn,[0,1],[valueToAngle(10),valueToAngle(2)]);
 const arm=tw(f,[s(8.2),s(8.6)],[0,1]);
 const armOut=tw(f,[s(10.6),s(11.4)],[1,0]);

 // ── B 熄灭（10–11.5s）：亮度 100% → 30%，外辉光消失，地面光带也灭 ──
 const bLight=tw(f,[s(10),s(11.5)],[1,0.3]);
 const bColor=mix(mix(C.bg,C.ivory,bLight),C.red,red*0.55);
 const knobLight=tw(f,[s(9.8),s(11.5)],[1,0.35]);

 // ── 地面光带：两人之间；A 靠近时缩短、从琥珀变暗红；B 熄灭时一起灭 ──
 const near=tw(f,[s(3.8),s(5.4)],[0,1]);
 const bandColor=mix(C.amber,C.red,near);
 const bandO=0.85*tw(f,[s(10),s(11.3)],[1,0]);

 // ── 气泡 A：0–3s 从 A 头顶飘向 B；5.05s 第一下心跳把它推回、淡掉 ──
 const bubX=tw(f,[0,s(3)],[650,1130])-tw(f,[s(5.05),s(6.1)],[0,70]);
 const bubY=tw(f,[0,s(3)],[372,386])+Math.sin(f/fps*2)*5;
 const bubO=tw(f,[0,s(0.3)],[0.85,1])*tw(f,[s(5.05),s(6.1)],[1,0]);
 const bubS=tw(f,[0,s(0.5)],[0.9,1])*tw(f,[s(5.05),s(6.1)],[1,0.9]);

 // ── 「嗯」：11.5s 从 B 头顶冒出，停 1 秒，再慢慢缩小消失 ──
 const rO=tw(f,[s(11.5),s(11.8)],[0,1])*tw(f,[s(12.8),s(13.4)],[1,0]);
 const rS=tw(f,[s(11.5),s(11.8)],[0.85,1])*tw(f,[s(12.8),s(13.4)],[1,0.55]);
 const rY=tw(f,[s(11.5),s(11.8)],[466,450]);

 const A=<Figure x={ax} color={mix(C.bg,C.amber,aFlick)} breath={br(0)} lean={aLean} blur={aBlur} glow={aFlick}/>;
 const B=<Figure x={BX} color={bColor} breath={br(Math.PI*0.9)} glow={(1-tw(f,[s(10),s(11.5)],[0,1]))*(1+red*0.6)}/>;
 // B 的手：从左肩伸出的一条弧线，握住旋钮右上沿；拧的时候跟着轻微摆动
 const wob=Math.sin((f-s(8.6))/fps*9)*3*(f>s(8.6)&&f<s(10)?1:0);
 const armD=`M ${BX-56} ${G-228} Q ${BX-74} ${KY+70} ${KX+104} ${KY+wob}`;

 return <AbsoluteFill style={{background:C.bg}}>
  <Backdrop spotX={960} spotY={sy}/>
  <Dust panX={cx*zoom} panY={cy*zoom}/>
  <svg width="1920" height="1080" style={{position:'absolute',inset:0}}>
   <Defs/>
   <g transform={cam}>
    <rect x={-400} y={G} width={2800} height={2} fill="url(#horizon)"/>
    <Reflection>{A}{B}</Reflection>
    <Band x1={ax+75} x2={BX-75} color={bandColor} opacity={bandO}/>
    {A}{B}
    <Heartbeat x={BX} y={CHEST} beats={beats} dur={s(1.0)} color={C.red}/>
    <circle cx={BX} cy={CHEST} r={40} fill={C.red} opacity={0.5*red} filter="url(#soft)"/>
    <Knob x={KX} y={KY} angle={knobA} opacity={knobO} light={knobLight} label={KNOB_LABEL}/>
    <path d={armD} stroke={bColor} strokeWidth={2.2} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1-arm} opacity={armOut}/>
    <Bubble x={bubX} y={bubY} text={BUBBLE_A} opacity={bubO} scale={bubS} color={C.amber}/>
    <Bubble x={BX-215} y={rY} text={BUBBLE_B} opacity={rO} scale={rS} color={COLD} glow={false} tail="right"/>
   </g>
  </svg>
  <Grain/>
  <Vignette/>
  <Caption end={durationInFrames}/>
 </AbsoluteFill>};
