// 北斗七星：真实星表 + 此刻此地的天空。只做天文计算，不参与抽牌。
// 抽到哪张牌只由 crypto 随机数决定（src/random.ts）；这里的结果只决定画面和动画的起点。
import {Body,MakeTime,Observer,Rotation_EQJ_EQD,Rotation_EQD_HOR,RotateVector,VectorFromSphere,SphereFromVector,HorizonFromVector,SiderealTime,SearchAltitude,Equator,Horizon} from 'astronomy-engine';
import {BACKGROUND_STARS} from './dipper-stars.ts';

export interface CatalogStar {id:string;zh:string;bayer:string;en:string;hr:number;ra:number;dec:number;mag:number;order?:number}
const hms=(h:number,m:number,s:number)=>(h+m/60+s/3600)*15;
const dms=(d:number,m:number,s:number)=>Math.sign(d||1)*(Math.abs(d)+m/60+s/3600);
/** 北斗七星（按天枢→摇光的顺序）、辅、北极星。J2000 坐标，取自 Yale 亮星表第五版（BSC5，公有领域），
 * 与任务说明表格（Hipparcos 近似值）逐颗核对，差别都在 0.1″ 以内；星等用 Hipparcos 的 V 值。 */
export const DIPPER:readonly CatalogStar[]=[
 {id:'dubhe',zh:'天枢',bayer:'α UMa',en:'Dubhe',hr:4301,ra:hms(11,3,43.7),dec:dms(61,45,3),mag:1.79,order:1},
 {id:'merak',zh:'天璇',bayer:'β UMa',en:'Merak',hr:4295,ra:hms(11,1,50.5),dec:dms(56,22,57),mag:2.37,order:2},
 {id:'phecda',zh:'天玑',bayer:'γ UMa',en:'Phecda',hr:4554,ra:hms(11,53,49.8),dec:dms(53,41,41),mag:2.44,order:3},
 {id:'megrez',zh:'天权',bayer:'δ UMa',en:'Megrez',hr:4660,ra:hms(12,15,25.6),dec:dms(57,1,57),mag:3.31,order:4},
 {id:'alioth',zh:'玉衡',bayer:'ε UMa',en:'Alioth',hr:4905,ra:hms(12,54,1.7),dec:dms(55,57,35),mag:1.77,order:5},
 {id:'mizar',zh:'开阳',bayer:'ζ UMa',en:'Mizar',hr:5054,ra:hms(13,23,55.5),dec:dms(54,55,31),mag:2.23,order:6},
 {id:'alkaid',zh:'摇光',bayer:'η UMa',en:'Alkaid',hr:5191,ra:hms(13,47,32.4),dec:dms(49,18,48),mag:1.86,order:7},
];
export const ALCOR:CatalogStar={id:'alcor',zh:'辅',bayer:'80 UMa',en:'Alcor',hr:5062,ra:hms(13,25,13.5),dec:dms(54,59,17),mag:4.01};
export const POLARIS:CatalogStar={id:'polaris',zh:'北极星',bayer:'α UMi',en:'Polaris',hr:424,ra:hms(2,31,49.1),dec:dms(89,15,51),mag:1.98};
/** 背景星：BSC5 中 J2000 赤纬 ≥ +40°、V ≤ 4.5 的星（见 scripts/build-star-catalog.mjs）。字段 [HR, 赤经°, 赤纬°, V] */
export const BACKGROUND=BACKGROUND_STARS;

/** 星图半径：从北天极到赤纬 +40°，即 50°。投影坐标在单位圆里，1 = 赤纬 +40°。 */
export const CHART_RADIUS=50;

/** 没有给位置时：按设备时区推一个大概的观测地。中国时区默认北纬 35°、东经 120°（东八区中央经线）。 */
export function defaultObserver(date=new Date()):{lat:number;lon:number}{
 const offset=-date.getTimezoneOffset()/60;const lon=Math.max(-180,Math.min(180,offset*15));
 return {lat:offset===8?35:Math.abs(offset)<=2?50:40,lon}}

export interface SkyStar {id:string;alt:number;az:number;ra:number;dec:number;ha:number;x:number;y:number;above:boolean}
export interface DipperSky {at:string;lat:number;lon:number;lst:number;stars:SkyStar[];alcor:SkyStar;polaris:SkyStar;background:{hr:number;x:number;y:number;mag:number;above:boolean}[];
 /** 斗柄方向：开阳→摇光，在面向正北看天的画面里换算成罗盘方位（0 北、90 东、180 南、270 西） */ handle:number;
 /** 地平线在星图里的折线（单位圆坐标），只含圆内的部分 */ horizon:[number,number][];
 /** 太阳高度（°）：大于 −6° 时天还亮，星星看不见 */ sunAlt:number}

const rad=Math.PI/180;
/** J2000 赤道坐标 → 此刻真赤道坐标（岁差 + 章动）与地平坐标 */
function place(ra:number,dec:number,time:ReturnType<typeof MakeTime>,eqd:ReturnType<typeof Rotation_EQJ_EQD>,hor:ReturnType<typeof Rotation_EQD_HOR>,lst:number){
 const v=VectorFromSphere({lat:dec,lon:ra,dist:1} as Parameters<typeof VectorFromSphere>[0],time);
 const d=RotateVector(eqd,v),s=SphereFromVector(d),h=HorizonFromVector(RotateVector(hor,d),'');
 const raD=s.lon,decD=s.lat,ha=((lst-raD)%360+540)%360-180; // 时角，-180…180，西为正
 const [x,y]=project(ha,decD);
 return {alt:h.lat,az:h.lon,ra:raD,dec:decD,ha,x,y,above:h.lat>0}}
/** 以北天极为中心的等距方位投影，面向正北：上方是天顶方向（上中天），右边是东。随时间逆时针转。 */
export function project(ha:number,dec:number):[number,number]{const r=(90-dec)/CHART_RADIUS,a=ha*rad;return [-r*Math.sin(a),-r*Math.cos(a)]}

export function dipperSky(date:Date,lat:number,lon:number):DipperSky{
 if(!Number.isFinite(date.valueOf()))throw RangeError('无效时间');if(!(lat>=-90&&lat<=90)||!(lon>=-180&&lon<=180))throw RangeError('无效位置');
 const time=MakeTime(date),obs=new Observer(lat,lon,0),eqd=Rotation_EQJ_EQD(time),hor=Rotation_EQD_HOR(time,obs);
 const lst=((SiderealTime(time)*15+lon)%360+360)%360;
 const at=(s:CatalogStar)=>({id:s.id,...place(s.ra,s.dec,time,eqd,hor,lst)});
 const stars=DIPPER.map(at),mizar=stars[5],alkaid=stars[6];
 // 屏幕坐标 y 向下；换成“东为右、上为南”的罗盘：向下是北、向右是东、向上是南、向左是西
 const handle=((Math.atan2(alkaid.x-mizar.x,alkaid.y-mizar.y)/rad)%360+360)%360;
 return {at:date.toISOString(),lat,lon,lst,stars,alcor:at(ALCOR),polaris:at(POLARIS),
  background:BACKGROUND.map(([hr,ra,dec,mag])=>{const p=place(ra,dec,time,eqd,hor,lst);return {hr,x:p.x,y:p.y,mag,above:p.above}}),
  handle,horizon:horizonLine(lat),sunAlt:Horizon(time,obs,...((e)=>[e.ra,e.dec] as const)(Equator(Body.Sun,time,obs,true,true)),'normal').altitude}}

/** 地平线：高度 0° 的那一圈换成时角、赤纬，再投影；只留在星图圆内的部分。 */
export function horizonLine(lat:number):[number,number][]{const pts:[number,number][]=[];const phi=lat*rad;
 for(let az=-180;az<=180;az+=3){const A=az*rad,sinDec=Math.cos(phi)*Math.cos(A),dec=Math.asin(sinDec)/rad;if(90-dec>CHART_RADIUS)continue;
  // 高度 0 时：cos(赤纬)·sin(时角) = −sin(方位)，cos(赤纬)·cos(时角) = −sin(纬度)·cos(方位)（方位从北向东量）
  const ha=Math.atan2(-Math.sin(A),-Math.cos(A)*Math.sin(phi))/rad;pts.push(project(ha,dec))}
 return pts}

/** 罗盘方位 → 中文说法，如 112° → “东偏南 112°” */
export function bearingLabel(b:number){const d=((b%360)+360)%360,n=Math.round(d);
 const card=[[0,'正北'],[90,'正东'],[180,'正南'],[270,'正西'],[360,'正北']] as const;for(const [c,name] of card)if(Math.abs(d-c)<=3)return `${name} ${n}°`;
 const q=d<90?['北','东']:d<180?['东','南']:d<270?['南','西']:['西','北'],base=Math.floor(d/90)*90,near=d-base<45?0:1;
 return `${q[near]}偏${q[1-near]} ${n}°`}
/** 《鹖冠子·环流》：斗柄东指，天下皆春；南指皆夏；西指皆秋；北指皆冬。以黄昏时的斗柄方向判断。 */
export type Season='春'|'夏'|'秋'|'冬';
export function seasonOf(bearing:number):Season{const d=((bearing%360)+360)%360;return d>=45&&d<135?'春':d>=135&&d<225?'夏':d>=225&&d<315?'秋':'冬'}
// 原文已在维基文库《鹖冠子》“环流”一节核对（那里收的是繁体本，四句与下面一致）。
export const HEGUANZI={text:'斗柄东指，天下皆春；斗柄南指，天下皆夏；斗柄西指，天下皆秋；斗柄北指，天下皆冬。',source:'《鹖冠子·环流》',url:'https://zh.wikisource.org/wiki/%E9%B6%A1%E5%86%A0%E5%AD%90#%E7%92%B0%E6%B5%81'};
/** 当天黄昏（太阳落到地平线下 12°，航海昏影终）时的天空；找不到（极昼极夜）时返回 null */
export function duskSky(date:Date,lat:number,lon:number):DipperSky|null{
 const noon=new Date(date);noon.setHours(12,0,0,0);
 const t=SearchAltitude(Body.Sun,new Observer(lat,lon,0),-1,MakeTime(noon),1,-12);return t?dipperSky(t.date,lat,lon):null}

/** 绕北天极旋转（屏幕坐标，正角度 = 逆时针，和天空的周日运动同向） */
export function rotate([x,y]:[number,number],deg:number):[number,number]{const a=deg*rad,c=Math.cos(a),s=Math.sin(a);return [x*c+y*s,-x*s+y*c]}
/** 点在星图里的极角（屏幕坐标，0° 在右，逆时针为正） */
export const polarAngle=([x,y]:[number,number])=>((Math.atan2(-y,x)/rad)%360+360)%360;
/** 斗柄（开阳→摇光的延长线）与半径 ring 的圆相交处的极角，也就是“斗柄所指”的那张牌所在的方向 */
export function pointerAngle(mizar:[number,number],alkaid:[number,number],ring:number){
 const dx=alkaid[0]-mizar[0],dy=alkaid[1]-mizar[1],len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len;
 const b=alkaid[0]*ux+alkaid[1]*uy,c=alkaid[0]**2+alkaid[1]**2-ring*ring,t=-b+Math.sqrt(Math.max(0,b*b-c));
 return polarAngle([alkaid[0]+ux*t,alkaid[1]+uy*t])}
/** 牌环上第 i 张牌的极角（共 n 张，第 0 张在正上方，逆时针排） */
export const slotAngle=(i:number,n:number)=>(90+i*360/n)%360;
/** 要让斗柄从 from 转到指向 to，逆时针转多少度：至少 100°，免得几乎不动 */
export function turnTo(from:number,to:number,min=100){let d=((to-from)%360+360)%360;if(d<min)d+=360;return d}

/** 星名位置：放在离北斗中心更远的一侧；斗柄上的星挨得近，沿斗柄的垂线左右交替。gap 是离星的距离（与坐标同单位） */
export function labelPositions(pos:readonly [number,number][],gap:number):[number,number][]{
 const cx=pos.reduce((a,p)=>a+p[0],0)/pos.length,cy=pos.reduce((a,p)=>a+p[1],0)/pos.length;
 return pos.map(([x,y],i)=>{let dx=x-cx,dy=y-cy;if(i>=4){const [ax,ay]=pos[Math.max(3,i-1)],[bx,by]=pos[Math.min(6,i+1)],tx=bx-ax,ty=by-ay,l=Math.hypot(tx,ty)||1,side=i%2?1:-1;dx=-ty/l*side;dy=tx/l*side}
  const l=Math.hypot(dx,dy)||1;return [x+dx/l*gap,y+dy/l*gap]})}
