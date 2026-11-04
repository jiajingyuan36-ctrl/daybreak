'use client';
import {useEffect,useRef,useState} from 'react';
import {toPng} from 'html-to-image';
import {chinaDateString,dateAtChinaNoon,generateDailyGravity} from '../lib/almanac-engine';
import type {DailyGravity} from '../lib/almanac-engine';
import {personalFortune} from '../lib/bazi-fortune';
import type {PersonalFortune} from '../lib/bazi-fortune';
import {RealMoon} from './real-moon';
import {saveBirth} from '../lib/birth-store';
import {SITE_HOST} from '../site';import {sunSign,moonSign,birthSign} from '../astro';
import {validBirth} from '../fortune';
/** 还没有生辰时，直接在日历页填写；选好日期立即保存并显示运势，之后这台设备不用再填。 */
function BirthInline({onSaved}:{onSaved:(date:string,time:string)=>void}){const [time,setTime]=useState('');const [date,setDate]=useState('');const [hint,setHint]=useState('');
 function commit(d:string,t:string){if(!validBirth(d)){setHint(d?'请选一个 1900 年以后、不晚于今天的日期。':'');return}saveBirth(d,t);onSaved(d,t)}
 return <section className="birth-inline" id="birth-inline" aria-labelledby="birth-inline-title"><p className="fortune-kicker">今日运势</p><h2 id="birth-inline-title">填一次生辰，每天自动看你的运势</h2><div className="birth-inline-fields"><label>出生日期<input type="date" min="1900-01-01" value={date} onChange={e=>{setDate(e.target.value);commit(e.target.value,time)}}/></label><label>出生时间（北京时间，可不填）<input type="time" value={time} onChange={e=>{setTime(e.target.value);if(date)commit(date,e.target.value)}}/></label></div><p className="birth-note">{hint||'选好日期就自动保存，只存在这台设备的浏览器里。'}</p></section>}
const STORE='daybreak:gravity:v1';
/** 月相外的观测刻度：外环四极准星与星点、72 格度盘（每 30° 一长格）、内圈上标出此刻盈亏角的游标 */
function Reticle({angle}:{angle:number}){const ln={fill:'none',stroke:'currentColor',vectorEffect:'non-scaling-stroke'} as const;
 const ticks=Array.from({length:72},(_,i)=>{const t=i*5*Math.PI/180,long=i%6===0,r0=long?86:91,r1=96;return <line key={i} {...ln} strokeWidth={long?.6:.5} strokeOpacity={long?.42:.2} x1={Math.sin(t)*r0} y1={-Math.cos(t)*r0} x2={Math.sin(t)*r1} y2={-Math.cos(t)*r1}/>});
 const n=angle*Math.PI/180,nx=Math.sin(n)*79,ny=-Math.cos(n)*79;
 // 样式全写成属性：保存日签时截图库不一定带上 SVG 子元素的 CSS
 return <g className="reticle" color="#C5A56E" aria-hidden="true"><defs><radialGradient id="node-glow"><stop offset="0" stopColor="currentColor" stopOpacity=".55"/><stop offset="1" stopColor="currentColor" stopOpacity="0"/></radialGradient></defs>
  <circle {...ln} r="104" strokeWidth=".5" strokeOpacity=".32"/>{[0,90,180,270].map(d=><g key={d} transform={`rotate(${d})`}><line {...ln} strokeWidth=".6" strokeOpacity=".6" x1="0" y1="-104" x2="0" y2="-112"/><path d="M0 -118.6 L1.1 -116.5 L0 -114.4 L-1.1 -116.5Z" fill="currentColor" fillOpacity=".85"/></g>)}{ticks}
  <circle {...ln} r="79" strokeWidth=".5" strokeOpacity=".2" strokeDasharray="1 3"/><circle cx={nx} cy={ny} r="6" fill="url(#node-glow)"/><circle cx={nx} cy={ny} r="1.9" fill="currentColor"/></g>}
const SunMark=()=><svg className="sky-mark" viewBox="-8 -8 16 16" aria-hidden="true"><circle r="5.5" fill="none" stroke="currentColor" strokeWidth="1"/><circle r="1.3" fill="currentColor"/></svg>;
const MoonMark=()=><svg className="sky-mark" viewBox="-8 -8 16 16" aria-hidden="true"><path d="M2.5 -5.6A6 6 0 1 0 2.5 5.6A4.6 4.6 0 1 1 2.5 -5.6Z" fill="none" stroke="currentColor" strokeWidth="1"/></svg>;
const StarMark=()=><svg className="sky-mark" viewBox="-8 -8 16 16" aria-hidden="true"><path d="M0 -6L1.4 -1.4L6 0L1.4 1.4L0 6L-1.4 1.4L-6 0L-1.4 -1.4Z" fill="currentColor"/></svg>;
function phasePath(light:number){const r=70,rx=Math.max(.001,Math.abs(2*light-1)*r);return `M0 -${r} A${r} ${r} 0 0 1 0 ${r} A${rx} ${r} 0 0 ${light<.5?0:1} 0 -${r}Z`}
function move(date:string,days:number){const d=dateAtChinaNoon(date);d.setUTCDate(d.getUTCDate()+days);return chinaDateString(d)}
const PILLARS=[['year','年柱'],['month','月柱'],['day','日柱'],['time','时柱']] as const;
function FortunePanel({f}:{f:PersonalFortune}){const c=f.chart;return <section className="personal-fortune" aria-labelledby="fortune-title"><p className="fortune-kicker">今日运势 · {f.shiShen}</p><h2 id="fortune-title">{f.title}</h2><p className="fortune-summary">{f.summary}</p>{f.branchNote&&<p className="fortune-note">{f.branchNote}</p>}<dl className="fortune-areas">{f.areas.map(a=><div key={a.name}><dt>{a.name}<span className={`fortune-level level-${a.level==='顺'?'good':a.level==='平'?'even':'care'}`}>{a.level}</span></dt><dd>{a.text}</dd></div>)}</dl><div className="fortune-dos"><p><span>适合</span>{f.doThis}</p><p><span>先别</span>{f.avoid}</p></div><p className="fortune-meta">今日 {f.dayPillar} · 喜神{f.positions.xi} · 财神{f.positions.cai}</p><details className="fortune-chart"><summary>你的八字</summary><div className="pillars">{PILLARS.map(([k,label])=><div key={k}><small>{label}</small><strong>{c.pillars[k]??'—'}</strong></div>)}</div><p>{f.why}</p><p>日主 {c.dayMaster}（{c.dayMasterElement}） · 生肖{c.shengXiao}{c.hourKnown?'':' · 未填出生时间，时柱不排'}</p><p>五行 {Object.entries(c.elements).map(([e,n])=>`${e}${n}`).join(' ')}</p></details><p className="fortune-basis">{f.basis} <a href="/settings/">修改生辰</a></p></section>}
export function AlmanacDashboard(){
 const [date,setDate]=useState(''),[birth,setBirth]=useState(''),[birthTime,setBirthTime]=useState(''),[fortune,setFortune]=useState<PersonalFortune|null>(null),[textured,setTextured]=useState(false),[reading,setReading]=useState<DailyGravity|null>(null),[status,setStatus]=useState(''),[busy,setBusy]=useState(false),[follow,setFollow]=useState(true);const birthDetails=useRef<HTMLDetailsElement>(null);const sheet=useRef<HTMLElement>(null),fadeLeft=useRef<HTMLDivElement>(null),fadeRight=useRef<HTMLDivElement>(null),[exporting,setExporting]=useState(false),shown=useRef('');
 useEffect(()=>{setDate(chinaDateString(new Date()));try{const p=JSON.parse(localStorage.getItem(STORE)||'{}');if(p.birth){dateAtChinaNoon(p.birth);setBirth(p.birth);if(typeof p.birthTime==='string')setBirthTime(p.birthTime)}}catch{}},[]);
 useEffect(()=>{if(!date)return;try{setReading(generateDailyGravity(date,birth&&birth<=date?birth:undefined))}catch{setStatus('日期超出计算范围')}},[date,birth]);
 useEffect(()=>{if(!date||!birth||birth>date){setFortune(null);return}try{setFortune(personalFortune(date,{date:birth,time:birthTime||undefined}))}catch{setFortune(null)}},[date,birth,birthTime]);
 useEffect(()=>{const tick=()=>{if(follow)setDate(chinaDateString(new Date()))};const timer=setInterval(tick,30000);window.addEventListener('focus',tick);return()=>{clearInterval(timer);window.removeEventListener('focus',tick)}},[follow]);
 // 换日期：农历、节气、星象、大字和两句建议 240ms 轻微错落淡入；月面原地重画，不闪
 useEffect(()=>{if(!reading)return;const prev=shown.current;shown.current=date;if(!prev||prev===date||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  [fadeRight.current,fadeLeft.current].forEach((el,i)=>el?.animate([{opacity:0,transform:'translateY(6px)',filter:'blur(2px)'},{opacity:1,transform:'none',filter:'blur(0)'}],{duration:240,delay:i*60,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'}))},[reading]);
 async function download(){if(!sheet.current||busy)return;setBusy(true);try{await document.fonts.ready;// 日签图片始终用竖排：导出时临时切到竖版，日期控件不进图
 setExporting(true);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 // 背景色在 html 上（body 是透明的），取不到时按主题给一个默认色；margin 归零，免得居中用的 auto 被算成固定偏移
 const pick=(el:Element)=>getComputedStyle(el).backgroundColor,clear=(c:string)=>!c||c==='transparent'||/rgba\(.*,\s*0\)$/.test(c);
 const bg=[pick(document.body),pick(document.documentElement)].find(c=>!clear(c))??(document.documentElement.dataset.theme==='light'?'#F2EFE9':'#0B0A0E');
 const data=await toPng(sheet.current,{pixelRatio:2,backgroundColor:bg,style:{margin:'0'},filter:n=>!(n instanceof HTMLElement&&n.classList.contains('date-line'))});const a=document.createElement('a');a.href=data;a.download=`DAYBREAK-${date}.png`;a.click();setStatus('日签已保存')}catch{setStatus('图片生成失败，请重试')}finally{setExporting(false);setBusy(false)}}
 const a=reading?.almanac;
 const at=a?new Date(a.moon.at):null,mine=birth?birthSign(birth):null;
 return <main className="page-shell minimal-calendar"><p className="brand-promise home-promise"><span>专注一件事：</span><span>把每一张塔罗牌，解读得专业、清楚、用得上。</span></p>
 {reading&&a&&at?<article ref={sheet} className={`daily-inscription almanac-grid${exporting?' exporting':''}`}>
  <div className="almanac-sky">
   <div className={`moon-stage${textured?' textured':''}`}><svg className="minimal-moon" viewBox="-120 -120 240 240" role="img" aria-label={`${a.moon.name}，照明${Math.round(a.moon.illuminationPercent)}%`}><Reticle angle={a.moon.angle}/><circle className="moon-phase" r="70" fill="currentColor" opacity=".12"/><path className="moon-phase" d={phasePath(a.moon.illumination)} fill="currentColor" transform={a.moon.waxing?'':'scale(-1 1)'}/></svg><RealMoon at={at} elongation={a.moon.angle} onReady={setTextured}/></div>
   <div className="almanac-plaque" ref={fadeLeft}><p className="calendar-caption">{a.lunar.label} · {a.moon.name}</p><p className="calendar-season"><span className="season-dot" aria-hidden="true"/>{a.solarTerms.current.name} · {a.solarTerms.upcoming.name}在{a.solarTerms.calendarDaysRemaining}天后</p>{!exporting&&<a className="home-draw" href="/ritual/">抽今日牌 <span aria-hidden="true">→</span></a>}</div>
  </div>
  <div className="almanac-text">
   <section className="date-line"><button className="date-pill prev" aria-label="前一天" disabled={!date||date==='1900-01-01'} onClick={()=>{setFollow(false);setDate(move(date,-1))}}><span className="chev" aria-hidden="true">‹</span>前日</button><input aria-label="日签日期" type="date" min="1900-01-01" max="2100-12-31" value={date} onClick={e=>{try{e.currentTarget.showPicker?.()}catch{}}} onChange={e=>{if(e.target.value){setFollow(false);setDate(e.target.value)}}}/><button className="date-pill next" aria-label="后一天" disabled={!date||date==='2100-12-31'} onClick={()=>{setFollow(false);setDate(move(date,1))}}>后日<span className="chev" aria-hidden="true">›</span></button>{!follow&&<button className="today-reset date-pill" onClick={()=>{setFollow(true);setDate(chinaDateString(new Date()))}}>今天</button>}</section>
   <div className="almanac-fade" ref={fadeRight}>
    <p className="calendar-sky" aria-label={`太阳在${sunSign(at).zh} · 月亮在${moonSign(at).zh}${mine?` · 你是${mine.zh}`:''}`}><span className="eph"><span className="eph-k"><SunMark/>太阳</span><span className="eph-v">{sunSign(at).zh}</span></span><span className="eph"><span className="eph-k"><MoonMark/>月亮</span><span className="eph-v">{moonSign(at).zh}</span></span>{mine?<span className="eph"><span className="eph-k"><StarMark/>本命</span><span className="eph-v">你是{mine.zh}</span></span>:<a className="eph" href="#birth-inline" onClick={()=>{if(birthDetails.current)birthDetails.current.open=true}}><span className="eph-k"><StarMark/>本命</span><span className="eph-v">填一次生辰</span></a>}</p>
    <p className="keyword-kicker" aria-hidden="true">DAILY KEYWORD</p>
    <h1>{reading.keyword}</h1>
    <ol className="daily-actions">{reading.dos.slice(0,2).map((item,i)=><li key={item.text}><span className="action-no" aria-hidden="true">0{i+1} ✦</span><span>{item.text}。</span></li>)}</ol>
   </div>
  </div>
  <p className="export-date">{date} · 晨启塔罗 · {SITE_HOST}</p>
 </article>:<div className="minimal-loading" role="status">正在读取日期</div>}
 {fortune?<FortunePanel f={fortune}/>:reading&&!birth&&<details className="home-fortune" ref={birthDetails}><summary>查看我的今日运势</summary><BirthInline onSaved={(d,t)=>{setBirthTime(t);setBirth(d)}}/></details>}
 <div className="calendar-links"><button onClick={download} disabled={busy||!reading}>{busy?'正在生成':'保存日签'}</button></div><p className="status-message" role="status">{status}</p></main>
}
