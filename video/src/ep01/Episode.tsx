import React from 'react';
import {AbsoluteFill,Easing,interpolate,random,spring,useCurrentFrame,useVideoConfig} from 'remotion';
import {C,bump,kf,loadFonts,mix,tw} from './theme';
import {Backdrop,Dust,Grain,Vignette,Caption,SourceTag,Defs,Figure,Reflection,Bubble,Band,Heartbeat,ChestCore,Knob,Door,Thought,Weight,EndCard,valueToAngle,G} from './parts';
import {BUBBLE_A,BUBBLE_B,KNOB_LABEL,THOUGHTS,SOURCES,DISCLAIMER} from './copy';
loadFonts();

// 第 1 期：回避型依恋。核心比喻：B 心里有一扇门。
// 一条连续的时间线：所有东西都是「秒 t」的函数。摄像机把世界坐标 (cx,cy) 对到屏幕 (960,sy)，再按 zoom 缩放。
// 给配乐的节拍点（beats.txt）：5.0 第一下警报、10.0 拧旋钮、20.0 抵住门、34.0 门被冲开、42.0 定格、51.0 放下旋钮、58.0 开始收尾。

const AX0=560,BX0=1360,CHEST=G-185;
const KX=1110,KY=G-150;          // 「在乎」旋钮，在 B 身前
const DX=1400,DW=240,DH=500;     // 门，在 B 身后
const easeOut=(t:number,a:number,b:number,v0:number,v1:number)=>interpolate(t,[a,b],[v0,v1],{easing:Easing.out(Easing.cubic),extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const easeIn=(t:number,a:number,b:number,v0:number,v1:number)=>interpolate(t,[a,b],[v0,v1],{easing:Easing.in(Easing.quad),extrapolateLeft:'clamp',extrapolateRight:'clamp'});

// 摄像机关键帧：[秒, zoom, cx, cy, sy]。每段结尾都留 2–3% 的「呼吸」推拉，不完全停住。
const CAM:[number,number,number,number,number][]=[
 [0,   1.33, 960, G,    850],
 [3,   1.41, 975, G,    850],
 [5.8, 1.80, BX0, CHEST,560],
 [8,   1.84, BX0, CHEST,560],
 [9.4, 1.85, 1245,620,  650],
 [13,  1.89, 1245,620,  650],
 [15,  1.42, 1120,600,  600],
 [17,  1.26, DX,  G,    860],
 [20,  1.28, DX,  G,    860],
 [23,  1.30, DX,  G,    860],
 [28,  1.31, DX,  G,    860],
 [34,  1.32, DX,  G,    860],
 [35.6,1.16, DX,  G,    880],
 [42,  1.19, DX,  G,    880],
 [48,  1.37, 1345,G,    880],   // 定格：6 秒内推近 B 15%
 [50.5,1.20, 1250,G,    880],   // 拉远，A 重新入画
 [54,  1.23, 1250,G,    880],
 [58,  1.26, 1260,G,    880],
 [62,  1.10, 1287,570,  600],   // 收尾：门缝那道光到画面正中
 [65,  1.14, 1287,570,  600],
 [70,  1.18, 1287,570,  600],
];
const cam=(t:number)=>{const col=(i:number)=>kf(t,CAM.map(r=>[r[0],r[i]] as [number,number]));return {zoom:col(1),cx:col(2),cy:col(3),sy:col(4)}};

// 呼吸频率（次/秒）：平时 3.2 秒一次；31–34 秒箱子压上来以后加快到 1.2 秒一次；37–42 秒慢慢缓回来。
const breathFreq=(t:number)=>kf(t,[[31,1/3.2],[32.5,1/1.2],[37,1/1.2],[42,1/2.6]]);
const breathPhase=(f:number,fps:number)=>{let p=0;for(let i=0;i<f;i++)p+=breathFreq(i/fps)/fps;return p*2*Math.PI};

// 34 秒涌出来的念头：三句念头各复制 5 份，往四周散开，再像落叶一样飘。
// 落点手工排开：左右两列错开高度，避开门和字幕区，互不重叠。
const SPOTS:[number,number][]=[[900,340],[1700,340],[1120,395],[1900,420],[860,470],[1680,475],[1080,545],[1880,560],[900,620],[1700,625],[1110,700],[1880,700],[860,770],[1690,770],[1500,270]];
const SPRAY=SPOTS.map(([tx,ty],i)=>({text:THOUGHTS[i%3],t0:34+i*0.025,tx,ty,ex:0,size:30+random('ss'+i)*6,ph:random('sp'+i)*6.28,fall:2+random('sf'+i)*3,rot0:(random('sr'+i)-0.5)*12}));
// 54.6 秒起，琥珀色的光铺过地面时，念头从离门近的开始一个接一个熄灭，每个间隔 0.22 秒。
[...SPRAY].sort((a,b)=>Math.abs(a.tx-DX)-Math.abs(b.tx-DX)).forEach((s,k)=>{s.ex=54.6+k*0.22});
// 42 秒定格：念头的「时间」在 42 秒后很快慢下来、停住。
const frozen=(t:number)=>t<42?t:42+0.8*(1-Math.exp(-(t-42)/0.8));
// 把世界坐标里的点换成角色本地坐标（用来让 A 的手搭到旋钮上）。
const toLocal=(px:number,py:number,x:number,sink:number,lean:number,br:number)=>{const a=lean*Math.PI/180,dx=px-x,dy=py-(G+sink);
 return [(dx*Math.cos(a)+dy*Math.sin(a))/br,(-dx*Math.sin(a)+dy*Math.cos(a))/br+G] as [number,number]};

export const Episode01:React.FC=()=>{const f=useCurrentFrame();const {fps,durationInFrames}=useVideoConfig();const t=f/fps;
 // ── 摄像机（34.0 秒冲门时轻震 0.4 秒，振幅 6px）──
 const {zoom,cx,cy,sy}=cam(t);
 const shakeP=t>=34&&t<34.4?1-(t-34)/0.4:0;
 const shX=shakeP*6*Math.sin(t*95),shY=shakeP*6*Math.cos(t*71);
 const camT=`translate(${960+shX} ${sy+shY}) scale(${zoom}) translate(${-cx} ${-cy})`;

 // ── 呼吸：1.0–1.012（加快时幅度略大），两人相位错开 ──
 const ph=breathPhase(f,fps);const amp=kf(t,[[31,0.006],[32.5,0.01],[37,0.01],[42,0.006]]);
 const brA=1.006+0.006*Math.sin(ph);const brB=1.006+amp*Math.sin(ph+Math.PI*0.9);

 // ── A ──（3.8–5.2 秒往前 180px，前倾再回正；特写时成为左侧前景的大焦外；15–17 秒默默走开，出画）
 // 48.3–50.5 秒从左侧重新入画、走到一半停下；50.6–51.0 往后退半步；51.0 秒弯腰把小旋钮放在地上（51.9 落地），52.0–52.8 直起身
 const ax=kf(t,[[0,AX0],[3.8,AX0],[5.2,AX0+180],[15,AX0+180],[17.2,AX0-180],[48.3,AX0-180],[50.5,980],[50.6,980],[51,930]]);
 const walking=t>48.3&&t<50.5?1:0;
 const aLean=kf(t,[[3.6,0],[4.3,5],[5.2,1.5],[5.6,0],[15,0],[15.6,-2.5],[17.2,-2.5],[48.3,-2.5],[48.6,3],[50.3,3],[50.6,0],[50.8,-2],[51,0],[51.6,8],[52,8],[52.8,0]]);
 const aSink=-Math.abs(Math.sin((t-48.3)*Math.PI*2.2))*6*walking+42*kf(t,[[51,0],[51.6,1],[52,1],[52.8,0]]); // 下蹲
 const aBlur=kf(t,[[7.4,0],[9,9],[13,9],[15,3],[47,3],[48.3,0]]);
 const aFlick=1-0.45*Math.max(bump(t,13.9,14.05,14.3),bump(t,14.5,14.65,14.95));
 const aDim=kf(t,[[15,1],[16.5,0.7],[48,0.7],[49,1]]);
 const aOp=kf(t,[[58,1],[59.5,0]]),bOp=kf(t,[[59,1],[60.8,0]]); // 收尾依次暗下去：先 A，再 B

 // ── B ──
 const shove=t<34?0:t<34.3?easeOut(t,34,34.3,0,-65):kf(t,[[34.3,-65],[35.5,-55]]);
 const push=-10*bump(t,21.2,21.45,21.8)+4*bump(t,21.8,22.1,22.6);
 const bx=kf(t,[[19.9,BX0],[20.5,DX]])+push+shove;
 const bLean=t<34?kf(t,[[20,0],[20.6,2],[21.2,2],[21.45,-2],[22.2,3],[23,2]])-0.8*(bump(t,24,24.3,24.8)+bump(t,26,26.3,26.8)):
  t<34.3?easeOut(t,34,34.3,2,-8):kf(t,[[34.3,-8],[35.5,-4],[37,-4],[38.5,-2]]);
 const bSx=kf(t,[[20,1],[20.25,0.72],[20.5,1]]);                               // 转身
 const headX=4*bump(t,3.4,3.6,4.0)-6*kf(t,[[37,0],[38.5,1],[55.5,1],[57,0.4]]);                   // 气泡飞到一半：头往后仰 4px 再回来
 const headY=12*kf(t,[[37,0],[38.5,1],[55.5,1],[57,0.5]]);                     // 37 秒后低着头；55.5 秒门缝透出琥珀光时，稍稍抬起
 const sink=kf(t,[[29.15,0],[29.4,16],[29.8,12]]);                              // 箱子压上来，身体往下一沉
 // 警报：心跳四下，间隔 0.8 → 0.6 → 0.45 秒；每一下身体轮廓闪成暗红再褪回
 const beats=[5.0,5.8,6.4,6.85];
 const redBeat=Math.max(0,...beats.map(b=>bump(t,b,b+0.06,b+0.5)));
 const red=Math.max(redBeat*0.9,0.35*bump(t,21.2,21.3,21.9),0.7*bump(t,34,34.05,35));
 const bLight=kf(t,[[11.2,1],[12.4,0.3],[15,0.3],[17,0.72],[37,0.72],[38.5,0.6],[59,0.6],[60.8,0]]);
 const bGlow=kf(t,[[11.2,1],[12.4,0],[15,0],[17,0.55],[59,0.55],[60.8,0]]);
 const bColor=mix(mix(C.bg,C.ivory,bLight),C.red,red);
 const chest=kf(t,[[4.95,0],[5.0,1],[8.6,1],[9.4,0]])*Math.max(0.55,redBeat);

 // ── 「在乎」旋钮 ──（7.8 秒出现；10.0 秒开始从 10 拧到 2，1.2 秒，阻尼加轻微回弹；15–16.5 秒淡出）
 const knobO=kf(t,[[7.8,0],[8.6,1],[15,1],[16.5,0]]);
 const turn=spring({frame:f-10*fps,fps,config:{damping:11,stiffness:95,mass:0.9},durationInFrames:Math.round(1.2*fps)});
 const knobA=interpolate(turn,[0,1],[valueToAngle(10),valueToAngle(2)]);
 const knobLight=kf(t,[[11,1],[12.4,0.35]]);
 // B 的手：从左肩自然长出的弧线，末端小圆搭在旋钮右沿
 const handW=[KX+104*Math.sin(100*Math.PI/180),KY-104*Math.cos(100*Math.PI/180)];
 const hx=handW[0]-bx,hy=handW[1];
 const arm={d:`M -57 ${G-228} C -70 ${G-188} ${hx+40} ${hy-34} ${hx+7} ${hy-2}`,hand:[hx,hy] as [number,number],progress:kf(t,[[9,0],[9.8,1],[11.8,1],[12.4,0]]),opacity:1};

 // ── 地面光带：A 靠近时缩短、从琥珀变暗红；B 熄灭时一起灭 ──
 const near=kf(t,[[3.8,0],[5.4,1]]);
 const bandO=0.85*kf(t,[[11.2,1],[12.4,0]]);

 // ── 气泡 ──
 // 「今天好想见你」：0–2 秒在 A 头顶轻飘，2–4.8 秒飞向 B；5.0 秒第一下心跳把它推回、淡掉
 const bubX=kf(t,[[0,690],[2,740],[4.8,1150]])-kf(t,[[5,0],[6,70]]);
 const bubY=kf(t,[[0,396],[4.8,396]])+Math.sin(t*2)*5;
 const bubO=kf(t,[[0,0.9],[0.3,1],[5,1],[6,0]]);
 const bubS=kf(t,[[0,0.92],[0.5,1],[5,1],[6,0.9]]);
 // 「嗯」：12.4 秒从 B 头右上方冒出，停 1 秒，再慢慢缩小消失。冷灰细描边、无辉光、70% 透明深灰底，尾巴指向 B 的头
 const rO=kf(t,[[12.4,0],[12.7,1],[13.7,1],[14.3,0]]);
 const rS=0.78*kf(t,[[12.4,0.88],[12.7,1],[13.7,1],[14.3,0.55]]);
 const rY=kf(t,[[12.4,440],[12.7,425]]);

 // ── 门 ──（15–17 秒在 B 身后亮起；20 秒 B 转身抵住；21.2 秒被从里面推一下；24/26/28 秒门缝被顶开又压回；34 秒被冲开）
 const doorDraw=kf(t,[[15,0],[16.8,1]]);
 const flick=t>=31&&t<34?random('fl'+Math.floor(f/2)):0;
 const slit=t>=48?kf(t,[[50.5,2],[54,1],[56.5,16]]):t<34?kf(t,[[20.3,10],[20.8,4]])+18*bump(t,21.2,21.45,21.8)-1*kf(t,[[21.8,0],[22.3,1]])+7*(bump(t,24,24.3,24.8)+bump(t,26,26.3,26.8)+bump(t,28,28.3,28.8))+(t>=31?flick*6:0):4;
 // 48–50.5 秒门悄悄合上；54 秒起自己开一条缝，这次漏出来的是琥珀色；60.3–62 秒门框和门里的光暗下去，只剩门缝那道竖光；65–66.5 秒竖光收成一个点，67.2 秒熄灭
 const doorOpen=t<34?0:t<48?easeOut(t,34,34.3,0,0.86)+0.03*Math.sin((t-34.3)*2.2)*(t>34.3?1:0):kf(t,[[48,0.86+0.03*Math.sin(13.7*2.2)],[50.5,0]]);
 const warm=kf(t,[[53.5,0],[54,1]]);
 const doorFrame=kf(t,[[60.3,1],[62,0]]);
 const beam=kf(t,[[65,1],[66.5,0]]);
 const doorLight=t<34?kf(t,[[15,0],[17,1],[20.3,1],[20.8,0.6]])+0.4*bump(t,21.2,21.45,21.8)+0.35*(bump(t,24,24.3,24.8)+bump(t,26,26.3,26.8)+bump(t,28,28.3,28.8))+(t>=31?(flick-0.4)*0.6:0):t<48?kf(t,[[34,1.2],[35,1]])+0.08*Math.sin(t*3):kf(t,[[48,1+0.08*Math.sin(144)],[50.5,0.15],[53.6,0],[54,0],[56,1.1],[58,1],[66.5,1],[67.2,0]]);

 // ── 门后的念头 ──（17–20 秒浮出、轻微抖；20.6 秒 B 抵住门后被压回去，只在门缝被顶开时闪一下；34 秒被冲出来的那一批取代）
 const peek=0.25*(bump(t,24,24.3,24.8)+bump(t,26,26.3,26.8)+bump(t,28,28.3,28.8))+(t>=31&&t<34?0.15+flick*0.3:0);
 const back=(a:number)=>kf(t,[[a,0],[a+0.8,1],[20.6,1],[21.6,0.12]])+(t>21.6?peek:0);
 const gone=t<34?1:0;
 const th=[{text:THOUGHTS[0],x:kf(t,[[17,1330],[17.8,1250]]),y:430,o:back(17)*gone,anchor:'end' as const},
  {text:THOUGHTS[1],x:kf(t,[[17.8,1470],[18.6,1550]]),y:380,o:back(17.8)*gone,anchor:'start' as const},
  {text:THOUGHTS[2],x:kf(t,[[18.6,1470],[19.4,1550]]),y:520,o:back(18.6)*gone,anchor:'start' as const}];

 // ── 重物 ──（28.3 秒从上方落下，29.15 秒压到 B 头肩上；48–49.5 秒淡去）
 const boxFall=t<29.15?easeIn(t,28.3,29.15,-760,0):0;
 const boxRot=kf(t,[[29.15,-6],[29.5,3],[29.9,-1]])+(t>=34?easeOut(t,34,34.3,0,-11)+kf(t,[[34.3,0],[35.5,6]]):0);
 const boxO=t<28.3?0:kf(t,[[48,1],[49.5,0]]);

 // ── 地上的小旋钮（A 放下，停在 5）──
 const sk=kf(t,[[51.2,0],[51.9,1]]);
 const skX=kf(t,[[51.2,ax+105],[51.9,1050]]),skY=kf(t,[[51.2,G-150],[51.9,G-36]]);
 const skO=kf(t,[[51.0,0],[51.3,1],[58,1],[59.5,0]]);
 const skLight=0.7+0.5*bump(t,51.9,52.0,52.8);
 const aHand=toLocal(skX,skY-38,ax,aSink,aLean,brA);
 const aArm={d:`M 57 ${G-228} C 70 ${G-190} ${aHand[0]-24} ${aHand[1]-36} ${aHand[0]-5} ${aHand[1]-5}`,hand:aHand,progress:kf(t,[[51.0,0],[51.4,1],[52.0,1],[52.6,0]]),opacity:1};
 // 琥珀色的光：从门缝沿地面一直铺到 A 的脚边（54.5–57 秒）
 const slitX=DX-DW/2+4+Math.max(1,slit)/2;
 const warmBand=kf(t,[[54.5,0],[57,1]]);
 const warmBandO=kf(t,[[54.5,0],[54.8,0.9],[60.3,0.9],[62,0]]);
 const sceneGain=kf(t,[[60,1],[63,0.45],[65.5,0.3],[67,0]]); // 收尾时聚光和浮尘一起暗下去
 const endO=kf(t,[[67.3,0],[68.3,1]]);
 const A=<Figure x={ax} color={mix(C.bg,C.amber,aFlick*aDim)} breath={brA} lean={aLean} sink={aSink} blur={aBlur} glow={aFlick*aDim} arm={aArm} opacity={aOp}/>;
 const B=<Figure x={bx} color={bColor} breath={brB} lean={bLean} sx={bSx} headX={headX} headY={headY} sink={sink} glow={bGlow*(1+red*0.6)} arm={arm} opacity={bOp}/>;
 const leanOff=Math.sin(bLean*Math.PI/180)*(374+70);

 return <AbsoluteFill style={{background:C.bg}}>
  <Backdrop spotX={960} spotY={sy-40} gain={sceneGain}/>
  <Dust panX={cx*zoom} panY={cy*zoom} gain={sceneGain}/>
  <svg width="1920" height="1080" style={{position:'absolute',inset:0}}>
   <Defs/>
   <g transform={camT}>
    <rect x={-600} y={G} width={3200} height={2} fill="url(#horizon)" opacity={sceneGain}/>
    <Reflection><g clipPath="url(#above)">{A}{B}</g></Reflection>
    <Band x1={ax+75} x2={bx-75} color={mix(C.amber,C.red,near)} opacity={bandO}/>
    {th.map((x,i)=><Thought key={i} seed={'th'+i} text={x.text} x={x.x} y={x.y} opacity={x.o} anchor={x.anchor}/>)}
    <Door x={DX} w={DW} h={DH} draw={doorDraw} slit={slit} open={doorOpen} light={doorLight} warm={warm} frame={doorFrame} inside={doorFrame} beam={beam}/>
    <Band x1={slitX-(slitX-(ax+70))*warmBand} x2={slitX} color={C.amber} opacity={warmBandO}/>
    <g clipPath="url(#above)">{A}{B}</g>
    <Heartbeat x={bx} y={CHEST} beats={beats.map(b=>b*fps)} dur={fps} color={C.red}/>
    <ChestCore x={bx} y={CHEST} level={chest}/>
    <Knob x={KX} y={KY} angle={knobA} opacity={knobO} light={knobLight} label={KNOB_LABEL}/>
    <Weight x={bx+leanOff} y={G-432+sink+boxFall} rot={boxRot} opacity={boxO}/>
    <Knob x={skX} y={skY} angle={valueToAngle(5)} opacity={skO} light={skLight*sk+0.6*(1-sk)} label="" R={34} numbers={false}/>
    {SPRAY.map((s,i)=>{if(t<s.t0)return null;
     const p=easeOut(t,s.t0,s.t0+1.4,0,1);const sx0=DX,sy0=560;
     const tf=frozen(t);const leaf=Math.max(0,tf-(s.t0+1.4));
     const x=sx0+(s.tx-sx0)*p+Math.sin(tf*0.8+s.ph)*18*Math.min(1,leaf);
     const y=Math.min(790,sy0+(s.ty-sy0)*p+s.fall*leaf);
     const v=t<s.t0+1.4?3*Math.pow(1-(t-s.t0)/1.4,2)/1.4/fps*1.6:0; // 每帧位移，用来画残影（运动模糊）
     return <Thought key={'s'+i} seed={'s'+i} text={s.text} x={x} y={y} size={s.size} anchor="middle" opacity={kf(t,[[s.t0,0],[s.t0+0.1,0.95],[42,0.95],[45,0.35],[s.ex,0.35],[s.ex+0.1,0.8],[s.ex+0.5,0]])} jitter={kf(t,[[42,1],[43,0]])} rot={s.rot0+Math.sin(tf*0.6+s.ph)*8*Math.min(1,leaf)} trail={v>0.0005?[(s.tx-sx0)*v,(s.ty-sy0)*v]:undefined}/>})}
    <Bubble x={bubX} y={bubY} text={BUBBLE_A} opacity={bubO} scale={bubS} color={C.amber} fill="rgba(10,10,11,0.78)" tail="left"/>
    <Bubble x={1550} y={rY} text={BUBBLE_B} opacity={rO} scale={rS} color={C.cold} glow={false} fill="rgba(40,42,46,0.3)" tail="left" stroke={1.5}/>
   </g>
  </svg>
  <Grain/>
  <Vignette/>
  <Caption end={durationInFrames}/>
  <SourceTag/>
  <EndCard opacity={endO} sources={SOURCES} disclaimer={DISCLAIMER}/>
 </AbsoluteFill>};
