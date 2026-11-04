'use client';
import {useEffect,useRef,useState} from 'react';
import {toPng} from 'html-to-image';
import {chinaDateString,dateAtChinaNoon,generateDailyGravity} from '../lib/almanac-engine';
import type {DailyGravity} from '../lib/almanac-engine';
import {personalFortune} from '../lib/bazi-fortune';
import type {PersonalFortune} from '../lib/bazi-fortune';
import {RealMoon} from './real-moon';
import {saveBirth} from '../lib/birth-store';
import {SITE_HOST} from '../site';
import {validBirth} from '../fortune';
/** 还没有生辰时，直接在日历页填写；选好日期立即保存并显示运势，之后这台设备不用再填。 */
function BirthInline({onSaved}:{onSaved:(date:string,time:string)=>void}){const [time,setTime]=useState('');const [date,setDate]=useState('');const [hint,setHint]=useState('');
 function commit(d:string,t:string){if(!validBirth(d)){setHint(d?'请选一个 1900 年以后、不晚于今天的日期。':'');return}saveBirth(d,t);onSaved(d,t)}
 return <section className="birth-inline" id="birth-inline" aria-labelledby="birth-inline-title"><p className="fortune-kicker">今日运势</p><h2 id="birth-inline-title">填一次生辰，每天自动看你的运势</h2><div className="birth-inline-fields"><label>出生日期<input type="date" min="1900-01-01" value={date} onChange={e=>{setDate(e.target.value);commit(e.target.value,time)}}/></label><label>出生时间（北京时间，可不填）<input type="time" value={time} onChange={e=>{setTime(e.target.value);if(date)commit(date,e.target.value)}}/></label></div><p className="birth-note">{hint||'选好日期就自动保存，只存在这台设备的浏览器里。'}</p></section>}
const STORE='daybreak:gravity:v1';
/** 月相外一圈克制的环线：一道细环、一道点线内环、四个极短的方位刻度、少量固定星点，
 *  内环上一粒小点标出此刻的日月距角（与月相同源）。样式全写成属性：保存日签时截图库不一定带上 SVG 子元素的 CSS。 */
const STARS:[number,number,number][]=[[-88,-62,.9],[79,-81,.7],[92,38,.8],[-71,84,.6],[-96,17,.5]];
function Orbit({angle}:{angle:number}){const ln={fill:'none',stroke:'currentColor',vectorEffect:'non-scaling-stroke'} as const;
 const n=angle*Math.PI/180,nx=Math.sin(n)*82,ny=-Math.cos(n)*82;
 return <g className="reticle" color="#C5A56E" aria-hidden="true"><circle className="orbit-ring" {...ln} r="93" strokeWidth=".6" strokeOpacity=".34"/><circle {...ln} r="82" strokeWidth=".5" strokeOpacity=".22" strokeDasharray="1 4"/>
  {[0,90,180,270].map(d=><line key={d} {...ln} transform={`rotate(${d})`} strokeWidth=".6" strokeOpacity=".5" x1="0" y1="-89" x2="0" y2="-97"/>)}
  {STARS.map(([x,y,r],i)=><circle key={i} cx={x} cy={y} r={r} fill="currentColor" fillOpacity=".45"/>)}
  <circle cx={nx} cy={ny} r="1.6" fill="currentColor" fillOpacity=".9"/></g>}
function phasePath(light:number){const r=70,rx=Math.max(.001,Math.abs(2*light-1)*r);return `M0 -${r} A${r} ${r} 0 0 1 0 ${r} A${rx} ${r} 0 0 ${light<.5?0:1} 0 -${r}Z`}
function move(date:string,days:number){const d=dateAtChinaNoon(date);d.setUTCDate(d.getUTCDate()+days);return chinaDateString(d)}
const PILLARS=[['year','年柱'],['month','月柱'],['day','日柱'],['time','时柱']] as const;
function FortunePanel({f}:{f:PersonalFortune}){const c=f.chart;return <section className="personal-fortune" aria-labelledby="fortune-title"><p className="fortune-kicker">今日运势 · {f.shiShen}</p><h2 id="fortune-title">{f.title}</h2><p className="fortune-summary">{f.summary}</p>{f.branchNote&&<p className="fortune-note">{f.branchNote}</p>}<dl className="fortune-areas">{f.areas.map(a=><div key={a.name}><dt>{a.name}<span className={`fortune-level level-${a.level==='顺'?'good':a.level==='平'?'even':'care'}`}>{a.level}</span></dt><dd>{a.text}</dd></div>)}</dl><div className="fortune-dos"><p><span>适合</span>{f.doThis}</p><p><span>先别</span>{f.avoid}</p></div><p className="fortune-meta">今日 {f.dayPillar} · 喜神{f.positions.xi} · 财神{f.positions.cai}</p><details className="fortune-chart"><summary>你的八字</summary><div className="pillars">{PILLARS.map(([k,label])=><div key={k}><small>{label}</small><strong>{c.pillars[k]??'—'}</strong></div>)}</div><p>{f.why}</p><p>日主 {c.dayMaster}（{c.dayMasterElement}） · 生肖{c.shengXiao}{c.hourKnown?'':' · 未填出生时间，时柱不排'}</p><p>五行 {Object.entries(c.elements).map(([e,n])=>`${e}${n}`).join(' ')}</p></details><p className="fortune-basis">{f.basis} <a href="/settings/">修改生辰</a></p></section>}
export function AlmanacDashboard(){
 const [date,setDate]=useState(''),[birth,setBirth]=useState(''),[birthTime,setBirthTime]=useState(''),[fortune,setFortune]=useState<PersonalFortune|null>(null),[textured,setTextured]=useState(false),[reading,setReading]=useState<DailyGravity|null>(null),[status,setStatus]=useState(''),[busy,setBusy]=useState(false),[follow,setFollow]=useState(true);const sheet=useRef<HTMLElement>(null),fadeLeft=useRef<HTMLDivElement>(null),fadeRight=useRef<HTMLDivElement>(null),moonRef=useRef<HTMLDivElement>(null),[exporting,setExporting]=useState(false),shown=useRef('');
 useEffect(()=>{setDate(chinaDateString(new Date()));try{const p=JSON.parse(localStorage.getItem(STORE)||'{}');if(p.birth){dateAtChinaNoon(p.birth);setBirth(p.birth);if(typeof p.birthTime==='string')setBirthTime(p.birthTime)}}catch{}},[]);
 useEffect(()=>{if(!date)return;try{setReading(generateDailyGravity(date,birth&&birth<=date?birth:undefined))}catch{setStatus('日期超出计算范围')}},[date,birth]);
 useEffect(()=>{if(!date||!birth||birth>date){setFortune(null);return}try{setFortune(personalFortune(date,{date:birth,time:birthTime||undefined}))}catch{setFortune(null)}},[date,birth,birthTime]);
 useEffect(()=>{const tick=()=>{if(follow)setDate(chinaDateString(new Date()))};const timer=setInterval(tick,30000);window.addEventListener('focus',tick);return()=>{clearInterval(timer);window.removeEventListener('focus',tick)}},[follow]);
 // 换日期：主题词、建议与农历 520ms 轻微错落淡入，月面重画时从半透明过渡回来
 useEffect(()=>{if(!reading)return;const prev=shown.current;shown.current=date;if(!prev||prev===date||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const ease='cubic-bezier(.22,1,.36,1)';
  [fadeRight.current,fadeLeft.current].forEach((el,i)=>el?.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:520,delay:i*80,easing:ease,fill:'backwards'}));
  moonRef.current?.animate([{opacity:.35},{opacity:1}],{duration:640,easing:ease})},[reading]);
 async function download(){if(!sheet.current||busy)return;setBusy(true);try{await document.fonts.ready;// 日签图片始终用竖排：导出时临时切到竖版，日期控件不进图
 setExporting(true);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 // 背景色在 html 上（body 是透明的），取不到时按主题给一个默认色；margin 归零，免得居中用的 auto 被算成固定偏移
 const pick=(el:Element)=>getComputedStyle(el).backgroundColor,clear=(c:string)=>!c||c==='transparent'||/rgba\(.*,\s*0\)$/.test(c);
 const bg=[pick(document.body),pick(document.documentElement)].find(c=>!clear(c))??(document.documentElement.dataset.theme==='light'?'#F2EFE9':'#0B0A0E');
 const data=await toPng(sheet.current,{pixelRatio:2,backgroundColor:bg,style:{margin:'0'},filter:n=>!(n instanceof HTMLElement&&n.classList.contains('date-line'))});const a=document.createElement('a');a.href=data;a.download=`DAYBREAK-${date}.png`;a.click();setStatus('日签已保存')}catch{setStatus('图片生成失败，请重试')}finally{setExporting(false);setBusy(false)}}
 const a=reading?.almanac;
 const at=a?new Date(a.moon.at):null;
 return <main className="page-shell minimal-calendar">
 {reading&&a&&at?<article ref={sheet} className={`daily-inscription almanac-grid${exporting?' exporting':''}`} aria-label={`${date} 日签`}>
  <section className="date-line" aria-label="切换日期"><button className="date-pill prev" aria-label="前一天" disabled={!date||date==='1900-01-01'} onClick={()=>{setFollow(false);setDate(move(date,-1))}}><span className="chev" aria-hidden="true">‹</span><span className="pill-word">前日</span></button><input aria-label="日签日期" type="date" min="1900-01-01" max="2100-12-31" value={date} onClick={e=>{try{e.currentTarget.showPicker?.()}catch{}}} onChange={e=>{if(e.target.value){setFollow(false);setDate(e.target.value)}}}/><button className="date-pill next" aria-label="后一天" disabled={!date||date==='2100-12-31'} onClick={()=>{setFollow(false);setDate(move(date,1))}}><span className="pill-word">后日</span><span className="chev" aria-hidden="true">›</span></button>{!follow&&<button className="today-reset" onClick={()=>{setFollow(true);setDate(chinaDateString(new Date()))}}>回到今天</button>}</section>
  <div className="almanac-sky">
   <div className={`moon-stage${textured?' textured':''}`} ref={moonRef}><svg className="minimal-moon" viewBox="-100 -100 200 200" role="img" aria-label={`${a.moon.name}，照明${Math.round(a.moon.illuminationPercent)}%`}><Orbit angle={a.moon.angle}/><circle className="moon-phase" r="70" fill="currentColor" opacity=".12"/><path className="moon-phase" d={phasePath(a.moon.illumination)} fill="currentColor" transform={a.moon.waxing?'':'scale(-1 1)'}/></svg><RealMoon at={at} elongation={a.moon.angle} onReady={setTextured}/></div>
   <div className="almanac-plaque" ref={fadeLeft}><p className="calendar-caption">{a.lunar.label} · {a.moon.name}</p><p className="calendar-season">{a.solarTerms.current.name} · {a.solarTerms.upcoming.name}在{a.solarTerms.calendarDaysRemaining}天后</p></div>
  </div>
  <div className="almanac-text" ref={fadeRight}>
   <h1>{reading.keyword}</h1>
   <div className="daily-actions">{reading.dos.slice(0,2).map(item=><p key={item.text}>{item.text}。</p>)}</div>
  </div>
  <p className="export-date">{date} · 晨启塔罗 · {SITE_HOST}</p>
 </article>:<div className="minimal-loading" role="status">正在读取日期</div>}
 {fortune?<FortunePanel f={fortune}/>:reading&&!birth&&<BirthInline onSaved={(d,t)=>{setBirthTime(t);setBirth(d)}}/>}
 <div className="calendar-links"><a href="/ritual/">抽今日牌</a><button onClick={download} disabled={busy||!reading}>{busy?'正在生成':'保存日签'}</button></div><p className="status-message" role="status">{status}</p></main>
}
