'use client';
import {useEffect,useRef,useState} from 'react';
import {chinaDateString,dateAtChinaNoon} from '../lib/china-date';
import type {DailyGravity} from '../lib/almanac-engine';
import type {PersonalFortune} from '../lib/bazi-fortune';
import {RealMoon} from './real-moon';
import {saveBirth} from '../lib/birth-store';
import {BRAND_NAME,BRAND_PROMISE,SITE_HOST} from '../site';
import {validBirth} from '../fortune';
/** 还没有生辰时，直接在日历页填写；选好日期立即保存并显示运势，之后这台设备不用再填。 */
function BirthInline({onSaved}:{onSaved:(date:string,time:string)=>void}){const [time,setTime]=useState('');const [date,setDate]=useState('');const [hint,setHint]=useState('');
 function commit(d:string,t:string){if(!validBirth(d)){setHint(d?'请选一个 1900 年以后、不晚于今天的日期。':'');return}saveBirth(d,t);onSaved(d,t)}
 return <section className="birth-inline" id="birth-inline" aria-labelledby="birth-inline-title"><p className="fortune-kicker">今日运势</p><h2 id="birth-inline-title">填一次生辰，每天自动看你的运势</h2><div className="birth-inline-fields"><label>出生日期<input type="date" min="1900-01-01" value={date} onChange={e=>{setDate(e.target.value);commit(e.target.value,time)}}/></label><label>出生时间（北京时间，可不填）<input type="time" value={time} onChange={e=>{setTime(e.target.value);if(date)commit(date,e.target.value)}}/></label></div><p className="birth-note">{hint||'选好日期就自动保存，只存在这台设备的浏览器里。'}</p></section>}
const STORE='daybreak:gravity:v1';
/** 月相外的观测刻度：外环四极准星与星点、72 格度盘（每 30° 一长格）、内圈上标出此刻盈亏角的游标 */
function Reticle({angle}:{angle:number}){const ln={fill:'none',stroke:'currentColor',vectorEffect:'non-scaling-stroke'} as const;
 const ticks=Array.from({length:72},(_,i)=>{const t=i*5*Math.PI/180,long=i%6===0,r0=long?86:91,r1=96;return <line key={i} {...ln} strokeWidth={long?.6:.5} strokeOpacity={long?.42:.2} x1={Math.sin(t)*r0} y1={-Math.cos(t)*r0} x2={Math.sin(t)*r1} y2={-Math.cos(t)*r1}/>});
 // 外环和度盘放进 orbit-ring，以 120 秒一圈极慢地转；盈亏角的游标不动，位置始终准确
 const n=angle*Math.PI/180,nx=Math.sin(n)*79,ny=-Math.cos(n)*79;
 // 样式全写成属性：保存日签时截图库不一定带上 SVG 子元素的 CSS
 return <g className="reticle" color="#C5A56E" aria-hidden="true"><defs><radialGradient id="node-glow"><stop offset="0" stopColor="currentColor" stopOpacity=".55"/><stop offset="1" stopColor="currentColor" stopOpacity="0"/></radialGradient></defs>
  <g className="orbit-ring"><circle {...ln} r="104" strokeWidth=".5" strokeOpacity=".32"/>{[0,90,180,270].map(d=><g key={d} transform={`rotate(${d})`}><line {...ln} strokeWidth=".6" strokeOpacity=".6" x1="0" y1="-104" x2="0" y2="-112"/><path d="M0 -118.6 L1.1 -116.5 L0 -114.4 L-1.1 -116.5Z" fill="currentColor" fillOpacity=".85"/></g>)}{ticks}</g>
  <circle {...ln} r="79" strokeWidth=".5" strokeOpacity=".2" strokeDasharray="1 3"/><circle cx={nx} cy={ny} r="6" fill="url(#node-glow)"/><circle cx={nx} cy={ny} r="1.9" fill="currentColor"/></g>}
function phasePath(light:number){const r=70,rx=Math.max(.001,Math.abs(2*light-1)*r);return `M0 -${r} A${r} ${r} 0 0 1 0 ${r} A${rx} ${r} 0 0 ${light<.5?0:1} 0 -${r}Z`}
function move(date:string,days:number){const d=dateAtChinaNoon(date);d.setUTCDate(d.getUTCDate()+days);return chinaDateString(d)}
/** 新月前后几天月面几乎全黑：给出一句说明，月面改画地照轮廓，不让首页看起来像没加载出来 */
function newMoonNote(illum:number,waxing:boolean,lunarDay:number){if(lunarDay===1)return '今日新月 · 适合重新开始';if(illum>=.06)return '';return waxing?'新月刚过 · 一个新的开始':'新月将至 · 适合收尾'}
/** 抽牌按钮里的小牌背：一眼看出这里是抽塔罗的地方 */
const MINI_BACK=<svg className="cta-card" viewBox="0 0 30 48" aria-hidden="true"><rect x=".75" y=".75" width="28.5" height="46.5" rx="1.5" fill="#14121A" stroke="currentColor" strokeWidth="1.2"/><rect x="3.5" y="3.5" width="23" height="41" fill="none" stroke="currentColor" strokeWidth=".5" strokeOpacity=".6"/><circle cx="15" cy="24" r="6.5" fill="none" stroke="currentColor" strokeWidth=".6"/><path d="M15 18.5 L18 24 L15 29.5 L12 24Z" fill="currentColor"/></svg>;
const PILLARS=[['year','年柱'],['month','月柱'],['day','日柱'],['time','时柱']] as const;
function FortunePanel({f}:{f:PersonalFortune}){const c=f.chart;return <section className="personal-fortune" aria-labelledby="fortune-title"><p className="fortune-kicker">今日运势 · {f.shiShen}</p><h2 id="fortune-title">{f.title}</h2><p className="fortune-summary">{f.summary}</p>{f.branchNote&&<p className="fortune-note">{f.branchNote}</p>}<dl className="fortune-areas">{f.areas.map(a=><div key={a.name}><dt>{a.name}<span className={`fortune-level level-${a.level==='顺'?'good':a.level==='平'?'even':'care'}`}>{a.level}</span></dt><dd>{a.text}</dd></div>)}</dl><div className="fortune-dos"><p><span>适合</span>{f.doThis}</p><p><span>先别</span>{f.avoid}</p></div><p className="fortune-meta">今日 {f.dayPillar} · 喜神{f.positions.xi} · 财神{f.positions.cai}</p><details className="fortune-chart"><summary>你的八字</summary><div className="pillars">{PILLARS.map(([k,label])=><div key={k}><small>{label}</small><strong>{c.pillars[k]??'—'}</strong></div>)}</div><p>{f.why}</p><p>日主 {c.dayMaster}（{c.dayMasterElement}） · 生肖{c.shengXiao}{c.hourKnown?'':' · 未填出生时间，时柱不排'}</p><p>五行 {Object.entries(c.elements).map(([e,n])=>`${e}${n}`).join(' ')}</p></details><p className="fortune-basis">{f.basis} <a href="/settings/">修改生辰</a></p></section>}
export function AlmanacDashboard({initialReading}:{initialReading:DailyGravity}){
 const [date,setDate]=useState(initialReading.date),[birth,setBirth]=useState(''),[birthTime,setBirthTime]=useState(''),[fortune,setFortune]=useState<PersonalFortune|null|false>(null),[textured,setTextured]=useState(false),[reading,setReading]=useState(initialReading),[status,setStatus]=useState(''),[busy,setBusy]=useState(false),[follow,setFollow]=useState(true);const sheet=useRef<HTMLElement>(null),fadeLeft=useRef<HTMLDivElement>(null),fadeRight=useRef<HTMLDivElement>(null),[exporting,setExporting]=useState(false),shown=useRef(''),[showFortune,setShowFortune]=useState(false);
 // 「今日运势」：点开才展开在日签下方（没填生辰时展开的是填生辰），并滚过去
 function openFortune(){setShowFortune(true);requestAnimationFrame(()=>document.getElementById('today-fortune')?.scrollIntoView({behavior:'smooth',block:'start'}))}
 useEffect(()=>{setDate(chinaDateString(new Date()));try{const p=JSON.parse(localStorage.getItem(STORE)||'{}');if(p.birth){dateAtChinaNoon(p.birth);setBirth(p.birth);if(typeof p.birthTime==='string')setBirthTime(p.birthTime)}}catch{}},[]);
 useEffect(()=>{
  if(date===initialReading.date&&(!birth||birth>date)){setReading(initialReading);return}
  let live=true;
  import('../lib/almanac-engine').then(({generateDailyGravity})=>{
   if(live)setReading(generateDailyGravity(date,birth&&birth<=date?birth:undefined));
  }).catch(()=>{if(live)setStatus('日期超出计算范围')});
  return()=>{live=false};
 },[date,birth,initialReading]);
 useEffect(()=>{if(reading.date===chinaDateString(new Date()))document.documentElement.classList.remove('home-stale')},[reading]);
 useEffect(()=>{
  setFortune(null);
  if(!showFortune||!birth||birth>date)return;
  let live=true;
  import('../lib/bazi-fortune').then(({personalFortune})=>{
   if(live)setFortune(personalFortune(date,{date:birth,time:birthTime||undefined}));
  }).catch(()=>{if(live)setFortune(false)});
  return()=>{live=false};
 },[date,birth,birthTime,showFortune]);
 useEffect(()=>{const tick=()=>{if(follow)setDate(chinaDateString(new Date()))};const timer=setInterval(tick,30000);window.addEventListener('focus',tick);return()=>{clearInterval(timer);window.removeEventListener('focus',tick)}},[follow]);
 // 换日期：农历、节气、星象、大字和两句建议 240ms 轻微错落淡入；月面原地重画，不闪
 useEffect(()=>{if(!reading)return;const prev=shown.current;shown.current=date;if(!prev||prev===date||typeof Element.prototype.animate!=='function'||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  [fadeRight.current,fadeLeft.current].forEach((el,i)=>el?.animate([{opacity:0,transform:'translateY(6px)',filter:'blur(2px)'},{opacity:1,transform:'none',filter:'blur(0)'}],{duration:240,delay:i*60,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'}))},[reading]);
 async function download(){if(!sheet.current||busy||reading.date!==date)return;setBusy(true);try{await document.fonts.ready;// 日签图片始终用竖排：导出时临时切到竖版，日期控件不进图
 setExporting(true);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 // 背景色在 html 上（body 是透明的），取不到时按主题给一个默认色；margin 归零，免得居中用的 auto 被算成固定偏移
 const pick=(el:Element)=>getComputedStyle(el).backgroundColor,clear=(c:string)=>!c||c==='transparent'||/rgba\(.*,\s*0\)$/.test(c);
 const bg=[pick(document.body),pick(document.documentElement)].find(c=>!clear(c))??(document.documentElement.dataset.theme==='light'?'#F2EFE9':'#0B0A0E');
 const {toPng}=await import('html-to-image');const data=await toPng(sheet.current,{pixelRatio:2,backgroundColor:bg,style:{margin:'0'},filter:n=>!(n instanceof HTMLElement&&n.classList.contains('date-line'))});const a=document.createElement('a');a.href=data;a.download=`DAYBREAK-${date}.png`;a.click();setStatus('日签已保存')}catch{setStatus('图片生成失败，请重试')}finally{setExporting(false);setBusy(false)}}
 const a=reading?.almanac;
 const at=a?new Date(a.moon.at):null;
 // 极简版式：左栏只有月相星盘和一行「农历 · 月相 · 节气」；右栏三层——刊头日期、每日关键词与两条晨间行动、一主两辅的操作。
 // 日期只在刊头出现一次；底部「日期 · 晨启塔罗 · 网址」只在保存日签的图片里出现。
 const lunarDay=a?a.lunar.label.split(/\s+/).pop():'';
 const moonNote=a?newMoonNote(a.moon.illumination,a.moon.waxing,a.lunar.day):'';
 return <main className="page-shell minimal-calendar editorial-home">
 <section className="home-intro" aria-label={BRAND_NAME}>
  <p>{BRAND_PROMISE}</p>
  <a className="home-cta" href="/ritual/">{MINI_BACK}抽取今日塔罗<span aria-hidden="true">→</span></a>
 </section>
 {reading&&a&&at?<article ref={sheet} className={`daily-inscription almanac-grid${exporting?' exporting':''}`}>
  <div className="almanac-sky">
   <div className={`moon-stage${textured?' textured':''}${moonNote?' new-moon':''}`}><svg className="minimal-moon" viewBox="-120 -120 240 240" role="img" aria-label={`${a.moon.name}，照明${Math.round(a.moon.illuminationPercent)}%`}><Reticle angle={a.moon.angle}/><circle className="moon-phase" r="70" fill="currentColor" opacity=".12"/>{moonNote&&<circle className="earthshine" r="70" fill="none" stroke="currentColor" strokeWidth=".8" strokeOpacity=".5"/>}<path className="moon-phase" d={phasePath(a.moon.illumination)} fill="currentColor" transform={a.moon.waxing?'':'scale(-1 1)'}/></svg><RealMoon at={at} elongation={a.moon.angle} onReady={setTextured}/></div>
   <div className="almanac-plaque" ref={fadeLeft}><p className="calendar-caption" title={`${a.solarTerms.upcoming.name}在${a.solarTerms.calendarDaysRemaining}天后`}>农历{lunarDay} · {a.moon.name} · {a.solarTerms.current.name}</p>{moonNote&&<p className="moon-note">{moonNote}</p>}</div>
  </div>
  <div className="almanac-text">
   <div className="dateline-row">
    <section className="date-line dateline"><button className="dateline-step" aria-label="前一天" disabled={!date||date==='1900-01-01'} onClick={()=>{setFollow(false);setDate(move(date,-1))}}>‹</button><label className="dateline-date"><span className="dateline-num">{date.replace(/-/g,'.')}</span><input aria-label="日签日期，点这里换一天" type="date" min="1900-01-01" max="2100-12-31" value={date} onClick={e=>{try{e.currentTarget.showPicker?.()}catch{}}} onChange={e=>{if(e.target.value){setFollow(false);setDate(e.target.value)}}}/></label><button className="dateline-step" aria-label="后一天" disabled={!date||date==='2100-12-31'} onClick={()=>{setFollow(false);setDate(move(date,1))}}>›</button>{!follow&&<button className="today-reset" onClick={()=>{setFollow(true);setDate(chinaDateString(new Date()))}}>回到今天</button>}</section>
   </div>
   <div className="almanac-fade" ref={fadeRight}>
    <h1 className="almanac-keyword">{reading.keyword}</h1>
    <ol className="daily-actions verse">{reading.dos.slice(0,2).map((item,i)=><li key={item.text}><span className="action-no" aria-hidden="true">0{i+1}.</span><span className="verse-line">{item.text}。</span></li>)}</ol>
   </div>
   {!exporting&&<div className="home-actions"><button className="home-ghost" aria-expanded={showFortune} onClick={()=>showFortune?setShowFortune(false):openFortune()}>今日运势</button><button className="home-ghost" onClick={download} disabled={busy||reading.date!==date}>{busy?'正在生成':'保存日签 ↓'}</button></div>}
  </div>
  <p className="export-date">{date} · {BRAND_NAME} · {SITE_HOST}</p>
 </article>:<div className="minimal-loading" role="status">正在读取日期</div>}
 {showFortune&&<div id="today-fortune">{fortune?<FortunePanel f={fortune}/>:fortune===false?<p role="status">无法读取日期，请重试。</p>:birth&&birth<=date?<div className="minimal-loading" role="status">正在读取日期</div>:<BirthInline onSaved={(d,t)=>{setBirthTime(t);setBirth(d)}}/>}</div>}
 <p className="status-message" role="status">{status}</p></main>
}
