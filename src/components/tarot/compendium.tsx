'use client';
// 图鉴：78 张牌的陈列室 + 单张检视台。
// 数据全部来自现有的单一来源，不另写一份：牌名与白话文案（src/cards.ts ← src/plain.ts）、牌面符号与原典（src/knowledge.ts）、
// 星座与元素对应（src/astro.ts）、牌面图（public/rws，1909 年原版扫描，78 张都有）、牌背（src/card-back.ts）。
// 「我的收集」读每日抽牌的本地记录（localStorage daybreak:v1 的 days），只读不写。
import {useCallback,useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {cards} from '../../cards';
import type {Card} from '../../types';
import {knowledgeById} from '../../knowledge';
import {cardAstro} from '../../astro';
import {cardImageUrl} from '../../art';
import {cardBackSprite,cardBackUse} from '../../card-back';
import {triggerHaptic} from '../../tactile';

type Group='all'|'大阿卡纳'|'权杖'|'圣杯'|'宝剑'|'星币';
const GROUPS:readonly [Group,string][]=[['all','全部'],['大阿卡纳','大阿卡纳'],['权杖','权杖 · 火'],['圣杯','圣杯 · 水'],['宝剑','宝剑 · 风'],['星币','星币 · 土']];
const SUIT_EN:Readonly<Record<string,string>>={权杖:'WANDS',圣杯:'CUPS',宝剑:'SWORDS',星币:'PENTACLES'};
const ELEMENT:Readonly<Record<string,string>>={权杖:'火',圣杯:'水',宝剑:'风',星币:'土'};
const COURT:Readonly<Record<number,[string,string]>>={1:['ACE','A'],11:['PAGE','侍从'],12:['KNIGHT','骑士'],13:['QUEEN','王后'],14:['KING','国王']};
const BACK_SPRITE=cardBackSprite(),BACK_USE=cardBackUse();

export function roman(n:number){if(n===0)return '0';let out='';for(const [v,l] of [[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']] as const)while(n>=v){out+=l;n-=v}return out}
/** 角标：大阿卡纳用罗马数字；小阿卡纳用元素 + 牌阶（A、II…X、侍从、骑士、王后、国王） */
function badge(c:Card){return c.suit==='大阿卡纳'?roman(c.number):`${ELEMENT[c.suit]} ${COURT[c.number]?.[1]??roman(c.number)}`}
function eyebrow(c:Card){return c.suit==='大阿卡纳'?`ARCANA ${roman(c.number)}`:`${SUIT_EN[c.suit]} · ${COURT[c.number]?.[0]??roman(c.number)}`}
// 星座符号后面加 U+FE0E，让手机按文字而不是彩色 emoji 显示
function astroLine(c:Card){const a=cardAstro(c.id);if(!a)return null;const label=a.label.replace(/([\u2648-\u2653\u2609\u263D\u263F\u2640\u2642\u2643\u2644])/g,'$1\uFE0E');return label.includes('元素')?label:`${label} · ${a.element}元素`}
/** 常见的另一种译名，搜它们也能找到网站里的牌名 */
const ALIAS:Readonly<Record<string,string>>={愚者:'愚人',女祭司长:'女祭司',塔:'高塔',吊人:'倒吊人',死亡:'死神',审判日:'审判',钱币:'星币',金币:'星币',杯:'圣杯',剑:'宝剑',杖:'权杖'};
/** 搜索：中文名、英文名、罗马数字、正逆位关键词、牌组名都能命中 */
function matches(c:Card,q:string){if(!q)return true;let t=q.trim().toLowerCase();if(!t)return true;t=ALIAS[t]??t; // 只在整词相同时换成网站的叫法
 // 纯罗马数字（如 XVII）只做精确匹配，免得 XVI 也命中 XVII
 if(/^(?:[ivxl]+|0)$/.test(t))return c.suit==='大阿卡纳'&&roman(c.number).toLowerCase()===t;
 const hay=[c.nameZh,c.nameEn,c.suit,ELEMENT[c.suit]??'',...c.keywordsUpright,...c.keywordsReversed,c.suit==='大阿卡纳'?roman(c.number):'',c.suit==='大阿卡纳'?`arcana ${roman(c.number)}`:''].join(' ').toLowerCase();
 return hay.includes(t)}

interface Encounter {count:number;last:string;reversed:number}
function readHistory():Record<string,Encounter>{const out:Record<string,Encounter>={};try{const d=JSON.parse(localStorage.getItem('daybreak:v1')||'null');for(const day of Object.values<{date?:string;cardId?:string;reversed?:boolean}>(d?.days??{})){if(!day?.cardId)continue;const e=out[day.cardId]??={count:0,last:'',reversed:0};e.count++;if(day.reversed)e.reversed++;if((day.date??'')>e.last)e.last=day.date??''}}catch{}return out}
const reduced=()=>typeof Element.prototype.animate!=='function'||(typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches);

export function Compendium(){
 const [group,setGroup]=useState<Group>('all'),[query,setQuery]=useState(''),[mine,setMine]=useState(false);
 const [history,setHistory]=useState<Record<string,Encounter>>({}),[open,setOpen]=useState<number|null>(null);
 useEffect(()=>{setHistory(readHistory());const again=()=>setHistory(readHistory());addEventListener('storage',again);addEventListener('focus',again);return()=>{removeEventListener('storage',again);removeEventListener('focus',again)}},[]);
 const list=useMemo(()=>cards.filter(c=>(group==='all'||c.suit===group)&&matches(c,query)),[group,query]);
 const met=Object.keys(history).length;
 // 分段筛选的水银滑块：量出选中项的位置和宽度
 const segs=useRef<HTMLDivElement>(null),[thumb,setThumb]=useState<{x:number;w:number}|null>(null);
 useLayoutEffect(()=>{const place=()=>{const el=segs.current?.querySelector<HTMLElement>('[aria-pressed="true"]');if(el)setThumb({x:el.offsetLeft,w:el.offsetWidth})};place();addEventListener('resize',place);return()=>removeEventListener('resize',place)},[group]);
 const count=(g:Group)=>g==='all'?78:cards.filter(c=>c.suit===g).length;
 return <main className="page-shell codex-page">
  <span className="card-back-sprite" dangerouslySetInnerHTML={{__html:BACK_SPRITE}}/>
  <header className="codex-head"><h1>图鉴</h1><p className="codex-lead">78 张 1909 年原版韦特塔罗。点开任意一张，可以倾斜、倒转、翻到牌背，慢慢看。</p></header>
  <div className="codex-segs" ref={segs} role="group" aria-label="按牌组筛选">{thumb&&<span className="codex-thumb" style={{transform:`translateX(${thumb.x}px)`,width:thumb.w}} aria-hidden="true"/>}
   {GROUPS.map(([g,label])=><button key={g} type="button" aria-pressed={group===g} onClick={()=>{if(g!==group){setGroup(g);triggerHaptic('selection')}}}>{label}<span className="codex-count">{count(g)}</span></button>)}</div>
  <div className="codex-tools">
   <label className="codex-search"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.6" fill="none" stroke="currentColor" strokeWidth="1.2"/><path d="M10.4 10.4 14 14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="牌名、英文、罗马数字或关键词" aria-label="搜索牌"/></label>
   <div className="codex-mode" role="group" aria-label="显示方式"><button type="button" aria-pressed={!mine} onClick={()=>setMine(false)}>全部点亮</button><button type="button" aria-pressed={mine} onClick={()=>setMine(true)}>我的收集</button></div>
  </div>
  <p className="codex-progress" aria-live="polite">{mine?<>已经遇见 <b>{met}</b> / 78 张牌</>:<>{list.length} / 78 张</>}</p>
  <div className="codex-grid" key={`${group}|${query}|${mine}`}>{list.map((c,i)=>{const seen=!!history[c.id],hide=mine&&!seen;
   return <button type="button" key={c.id} className={`codex-card${hide?' is-unmet':''}`} style={{['--i' as string]:Math.min(i,24)}} onClick={()=>setOpen(i)} aria-label={`${c.nameZh}，${c.nameEn}${mine?(seen?'，已遇见':'，还没遇见'):''}`}>
    <span className="codex-face">{hide?<span className="codex-back" dangerouslySetInnerHTML={{__html:BACK_USE}}/>:<img src={cardImageUrl(c.id,true)} alt="" loading="lazy" decoding="async" width={320} height={549} ref={el=>{if(el?.complete&&el.naturalWidth)el.classList.add('is-loaded')}} onLoad={e=>e.currentTarget.classList.add('is-loaded')} onError={e=>e.currentTarget.classList.add('is-loaded')}/>}<span className="codex-badge">{badge(c)}</span>{seen&&mine&&<span className="codex-seen" aria-hidden="true">✦</span>}</span>
    <span className="codex-name"><b>{c.nameZh}</b><small>{c.nameEn}</small></span></button>})}</div>
  {!list.length&&<p className="codex-empty">没有找到这张牌。试试更短的关键词，或换一个牌组。</p>}
  {open!==null&&list[open]&&<CardInspector list={list} index={open} history={history} onIndex={setOpen} onClose={()=>setOpen(null)}/>}
 </main>}

/** 单张检视台：倾斜跟手 + 金箔反光、正逆位、翻到牌背、放大、上一张下一张。 */
function CardInspector({list,index,history,onIndex,onClose}:{list:Card[];index:number;history:Record<string,Encounter>;onIndex:(i:number)=>void;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),body=useRef<HTMLDivElement>(null),tilt=useRef<HTMLDivElement>(null);
 const [reversed,setReversed]=useState(false),[flipped,setFlipped]=useState(false),[zoom,setZoom]=useState(false);
 const c=list[index],k=knowledgeById(c.id),astro=astroLine(c),meet=history[c.id];
 const swapping=useRef(false);
 useEffect(()=>{const d=dialog.current!;if(!d.open)d.showModal();const root=document.documentElement,prev=root.style.overflow;root.style.overflow='hidden';return()=>{root.style.overflow=prev}},[]);
 // 切牌：220ms 交叉淡化 + 微移（旧内容 110ms 淡出，新内容 110ms 淡入）
 const go=useCallback(async(step:number)=>{if(swapping.current||list.length<2)return;swapping.current=true;triggerHaptic('selection');const el=body.current,next=(index+step+list.length)%list.length;
  // 换牌时刻用定时器卡在 110ms，不等动画的 finished（掉帧时它会晚到，换牌就会拖慢）
  let out:Animation|null=null;if(el&&!reduced()){out=el.animate({opacity:[1,0],transform:['translateX(0)',`translateX(${-step*8}px)`]},{duration:110,easing:'cubic-bezier(0.32,0.72,0,1)',fill:'forwards'});await new Promise(r=>setTimeout(r,110))}
  setFlipped(false);setZoom(false);onIndex(next);
  requestAnimationFrame(()=>{if(el){out?.cancel();if(!reduced())el.animate({opacity:[0,1],transform:[`translateX(${step*8}px)`,'translateX(0)']},{duration:110,easing:'cubic-bezier(0.22,1,0.36,1)'})}swapping.current=false})},[index,list.length,onIndex]);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='ArrowLeft'){e.preventDefault();go(-1)}else if(e.key==='ArrowRight'){e.preventDefault();go(1)}};const d=dialog.current!;d.addEventListener('keydown',key);return()=>d.removeEventListener('keydown',key)},[go]);
 // 倾斜跟手：指针相对牌中心的位置 → 目标角度（±15°），每帧向目标靠近一点，松开后慢慢回正
 const target=useRef({x:0,y:0}),cur=useRef({x:0,y:0}),raf=useRef(0),press=useRef<{x:number;y:number;t:number}|null>(null);
 const frame=useCallback(()=>{const t=target.current,s=cur.current;s.x+=(t.x-s.x)*.14;s.y+=(t.y-s.y)*.14;const el=tilt.current;
  if(el){el.style.transform=`rotateX(${s.x.toFixed(2)}deg) rotateY(${s.y.toFixed(2)}deg)`;el.style.setProperty('--gx',`${(50-s.y*2.6).toFixed(1)}%`);el.style.setProperty('--gy',`${(50+s.x*2.6).toFixed(1)}%`);el.style.setProperty('--ga',Math.min(1,Math.hypot(s.x,s.y)/12).toFixed(3))}
  if(Math.abs(t.x-s.x)+Math.abs(t.y-s.y)>.02)raf.current=requestAnimationFrame(frame);else raf.current=0},[]);
 const aim=(x:number,y:number)=>{target.current={x,y};if(!raf.current)raf.current=requestAnimationFrame(frame)};
 useEffect(()=>()=>cancelAnimationFrame(raf.current),[]);
 function move(e:React.PointerEvent<HTMLDivElement>){if(reduced())return;const r=e.currentTarget.getBoundingClientRect(),dx=(e.clientX-r.left)/r.width-.5,dy=(e.clientY-r.top)/r.height-.5;aim(Math.max(-15,Math.min(15,-dy*30)),Math.max(-15,Math.min(15,dx*30)))}
 function down(e:React.PointerEvent<HTMLDivElement>){press.current={x:e.clientX,y:e.clientY,t:performance.now()};try{e.currentTarget.setPointerCapture(e.pointerId)}catch{}move(e)}
 function up(e:React.PointerEvent<HTMLDivElement>){const p=press.current;press.current=null;aim(0,0);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;
  // 手机上快速横划切牌；慢慢拖动只是倾斜
  if(e.pointerType!=='mouse'&&Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5&&performance.now()-p.t<450)go(dx<0?1:-1)}
 const side=reversed?'reversed':'upright',keywords=reversed?c.keywordsReversed:c.keywordsUpright,reading=reversed?c.meaningReversed:c.meaningUpright;
 return <dialog ref={dialog} className="inspector" aria-labelledby="insp-title" onClose={onClose} onClick={e=>{if(e.target===e.currentTarget)dialog.current?.close()}}>
  <button type="button" className="insp-close" aria-label="关闭" onClick={()=>dialog.current?.close()}>×</button>
  <div className="insp-body" ref={body}>
   <section className="insp-stage" aria-label="牌面">
    <div className="insp-pad" onPointerMove={e=>{if(e.pointerType==='mouse'||press.current)move(e)}} onPointerDown={down} onPointerUp={up} onPointerCancel={()=>{press.current=null;aim(0,0)}} onPointerLeave={e=>{if(e.pointerType==='mouse')aim(0,0)}}>
     <div className="insp-tilt" ref={tilt}>
      <div className={`insp-card${reversed?' is-reversed':''}${flipped?' is-flipped':''}${zoom?' is-zoomed':''}`}>
       <div className="insp-face insp-front"><img src={cardImageUrl(c.id)} alt={`${c.nameZh}牌面，${reversed?'逆位':'正位'}`} width={600} height={1029} decoding="async"/><span className="insp-glare" aria-hidden="true"/></div>
       <div className="insp-face insp-back" aria-hidden="true" dangerouslySetInnerHTML={{__html:BACK_USE}}/>
      </div></div></div>
    <div className="insp-bar" role="toolbar" aria-label="检视">
     <button type="button" aria-pressed={reversed} onClick={()=>{setReversed(r=>!r);triggerHaptic('light')}}><span aria-hidden="true">⇅</span>{reversed?'逆位':'正位'}</button>
     <button type="button" aria-pressed={flipped} onClick={()=>{setFlipped(f=>!f);triggerHaptic('light')}}><span aria-hidden="true">↻</span>{flipped?'牌面':'牌背'}</button>
     <button type="button" aria-pressed={zoom} onClick={()=>setZoom(z=>!z)}><span aria-hidden="true">⤢</span>{zoom?'还原':'放大'}</button>
     <span className="insp-nav"><button type="button" aria-label="上一张" onClick={()=>go(-1)}>‹</button><span className="insp-pos">{index+1} / {list.length}</span><button type="button" aria-label="下一张" onClick={()=>go(1)}>›</button></span>
    </div>
   </section>
   <article className="insp-dossier">
    <p className="insp-eyebrow">{eyebrow(c)}</p>
    <h2 id="insp-title">{c.nameZh}<span> · {c.nameEn.toUpperCase()}</span></h2>
    {astro&&<p className="insp-astro">{astro}</p>}
    <div key={side} className="insp-swap">
     <p className="insp-chips">{keywords.map(w=><span key={w}>{w}</span>)}</p>
     <section><h3>这张牌在说什么</h3><p>{c.plainIntro}</p>{k?.symbols&&<p className="insp-symbols">{k.symbols}</p>}</section>
     <section><h3>今日解析 · {reversed?'逆位':'正位'}</h3><p>{reading}</p></section>
    </div>
    <section className="insp-morning"><h3>早上可以做的一件事</h3><p>{c.action}</p></section>
    <section><h3>放到生活里</h3><dl className="insp-aspects"><div><dt>关系</dt><dd>{c.lifeAspects.love}</dd></div><div><dt>学业事业</dt><dd>{c.lifeAspects.work}</dd></div><div><dt>资源与精力</dt><dd>{c.lifeAspects.money}</dd></div></dl></section>
    <section><h3>晚间回顾</h3><p>{c.reflectionPrompt}</p></section>
    {cardAstro(c.id)?.plain&&<p className="insp-note">{cardAstro(c.id)!.plain}</p>}
    <p className="insp-echo">✦ {meet?<>在你的晨启记录里，这张牌和你相遇过 {meet.count} 次{meet.reversed?`（其中逆位 ${meet.reversed} 次）`:''}，最近一次是 {meet.last}。</>:'这张牌还在等你们第一次相遇。'}</p>
    <p className="insp-page"><a href={`/card/${c.id}/`}>打开这张牌的完整页面（可以分享）→</a></p>
    {k?.source&&<p className="insp-source"><a href={k.source} target="_blank" rel="noreferrer">Waite《The Pictorial Key to the Tarot》原文</a></p>}
   </article>
  </div>
 </dialog>}
