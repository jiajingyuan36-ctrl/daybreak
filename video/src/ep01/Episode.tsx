import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {C,loadFonts,tw} from './theme';
import {Backdrop,Caption,GlowDefs,Figure,Bubble,Ruler,Alarm,Knob,GROUND} from './parts';
import {BUBBLE_A,BUBBLE_B,KNOB_LABEL} from './copy';
loadFonts();

// 第 1 期：回避型依恋。核心比喻：B 心里有一扇门（门从 15 秒开始出现）。
// 时间都用秒写，乘 fps 得到帧。
export const Episode01:React.FC=()=>{const f=useCurrentFrame();const {fps}=useVideoConfig();const s=(t:number)=>t*fps;
 const bob=(ph:number)=>Math.sin((f+ph)/fps*1.6)*3; // 呼吸似的轻微起伏，保证画面不静止

 // A：3.8–5.4s 往前走一步（中途略抬起）
 const ax=tw(f,[s(3.8),s(5.4)],[560,760]);
 const aLift=tw(f,[s(3.8),s(4.6),s(5.4)],[0,10,0]);
 const BX=1360,CHEST=GROUND-170;

 // B 的亮度：8.9–11.5s 拧旋钮时变暗
 const bLight=tw(f,[s(9.2),s(11.5)],[1,0.32]);

 // 气泡 A：0–3s 从 A 头顶飘向 B；5.4s 警报响起时被推回、淡掉
 const bubX=tw(f,[0,s(3)],[640,1150])+tw(f,[s(5.5),s(6.6)],[0,-60]);
 const bubY=tw(f,[0,s(3)],[480,450])+Math.sin(f/fps*2)*6;
 const bubO=tw(f,[0,s(0.3)],[0.85,1])*tw(f,[s(5.5),s(6.6)],[1,0]);
 const bubS=tw(f,[0,s(0.5)],[0.85,1]);

 // 刻度线：3.0–3.8s 出现；两端跟着 A 与 B
 const rulerO=tw(f,[s(3),s(3.8)],[0,1])*tw(f,[s(9.5),s(12)],[1,0.45]);
 const rulerY=GROUND+52+tw(f,[s(3),s(3.8)],[12,0]);

 // 警报：A 落脚后连响几圈，8s 后随旋钮被拧下逐渐熄灭
 const rings=[5.4,6.2,7.0,7.8,8.6,9.4,10.2].map(s);
 const alarmGain=tw(f,[s(9.0),s(11.2)],[1,0]);

 // 旋钮：8.0–8.8s 出现在 B 身边；9.0–11.5s 从高拧到低
 const knobO=tw(f,[s(8),s(8.8)],[0,1]);
 const knobRise=tw(f,[s(8),s(8.8)],[18,0]);
 const knobA=tw(f,[s(9),s(11.5)],[120,-120]);
 const KX=1580,KY=GROUND-180;
 // B 伸手去拧：一条细线手臂
 const armO=tw(f,[s(8.6),s(9)],[0,1])*tw(f,[s(11.8),s(12.5)],[1,0]);

 // 回复气泡「嗯」：12–15s 从 B 头顶慢慢飘向 A，颜色发暗
 const rX=tw(f,[s(12),s(15)],[1290,960]);
 const rO=tw(f,[s(12),s(12.6)],[0,0.75]);
 const rY=tw(f,[s(12),s(12.6)],[470,450])+Math.sin(f/fps*2)*5;

 return <AbsoluteFill style={{background:C.bg}}>
  <Backdrop/>
  <svg width="1920" height="1080" style={{position:'absolute',inset:0}}>
   <GlowDefs/>
   <line x1={240} y1={GROUND} x2={1680} y2={GROUND} stroke={C.ivory} strokeOpacity={0.08} strokeWidth={2}/>
   <Ruler x1={ax+90} x2={BX-90} y={rulerY} opacity={rulerO}/>
   <Figure x={ax} color={C.amber} bob={bob(0)} lift={aLift}/>
   <Figure x={BX} color={C.ivory} light={bLight} bob={bob(40)}/>
   <line x1={BX+52} y1={CHEST+10} x2={KX-70} y2={KY+knobRise} stroke={C.ivory} strokeWidth={4} strokeLinecap="round" opacity={armO*(0.3+0.6*bLight)} filter="url(#glow)"/>
   <Alarm x={BX} y={CHEST+bob(40)} starts={rings} gain={alarmGain}/>
   <Knob x={KX} y={KY} rise={knobRise} angle={knobA} opacity={knobO} light={tw(f,[s(9),s(11.5)],[1,0.3])} label={KNOB_LABEL}/>
   <Bubble x={bubX} y={bubY} text={BUBBLE_A} opacity={bubO} scale={bubS} color={C.amber}/>
   <Bubble x={rX} y={rY} text={BUBBLE_B} opacity={rO} color={C.ivory} tail="right" scale={0.9}/>
  </svg>
  <Caption/>
 </AbsoluteFill>};
