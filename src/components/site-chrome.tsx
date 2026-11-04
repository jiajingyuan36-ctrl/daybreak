
'use client';
import {useEffect,useRef,useState} from 'react';
import {initTactile,triggerHaptic} from '../tactile';
import {usePathname} from 'next/navigation';
type Mode='auto'|'dark'|'light';
// 点击反馈：在指尖或鼠标落下的位置画一圈淡淡的墨晕。画在固定层上，不改动任何按钮自身的布局。
const TAPPABLE='button,a,[role="button"],select,summary,label,.catalog-card,.history-item,.day.has-card';
function inkOnTap(e:PointerEvent){if(e.button>0||matchMedia('(prefers-reduced-motion: reduce)').matches)return;const el=(e.target as Element|null)?.closest?.(TAPPABLE);if(!el||(el as HTMLButtonElement).disabled)return;const ink=document.createElement('span');ink.className='tap-ink';ink.style.left=e.clientX+'px';ink.style.top=e.clientY+'px';document.body.appendChild(ink);ink.addEventListener('animationend',()=>ink.remove(),{once:true});setTimeout(()=>ink.remove(),900)}
// 背景流星：每隔二三十秒，在屏幕上半部分有一颗很细很淡的流星斜着划过，约一秒消失。只动 transform 和透明度，不占主线程。
function meteors():()=>void{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return ()=>{};let timer=0;
 const fly=()=>{if(!document.hidden){const m=document.createElement('span');m.className='meteor';m.setAttribute('aria-hidden','true');const vw=innerWidth,vh=innerHeight;const angle=rand(18,32),dist=Math.min(vw,900)*rand(.28,.42);m.style.left=`${rand(vw*.25,vw*.95)}px`;m.style.top=`${rand(vh*.04,vh*.4)}px`;m.style.setProperty('--a',`${angle}deg`);document.body.appendChild(m);
  const rad=angle*Math.PI/180,dx=-Math.cos(rad)*dist,dy=Math.sin(rad)*dist;const anim=m.animate([{transform:`rotate(${-angle}deg) scaleX(.2)`,translate:'0 0',opacity:0},{opacity:1,offset:.18},{transform:`rotate(${-angle}deg) scaleX(1)`,opacity:.85,offset:.55},{transform:`rotate(${-angle}deg) scaleX(.6)`,translate:`${dx}px ${dy}px`,opacity:0}],{duration:rand(1000,1400),easing:'cubic-bezier(.3,.1,.4,1)'});anim.onfinish=()=>m.remove()}
  timer=window.setTimeout(fly,rand(18000,32000))};
 timer=window.setTimeout(fly,rand(4000,9000));return ()=>clearTimeout(timer)}
const rand=(a:number,b:number)=>a+Math.random()*(b-a);
export function SiteChrome(){const path=usePathname();const [mode,setMode]=useState<Mode>('dark');useEffect(()=>{try{setMode(JSON.parse(localStorage.getItem('daybreak:gravity:v1')||'{}').theme||'dark')}catch{}if('serviceWorker'in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});document.addEventListener('pointerdown',inkOnTap,{passive:true});const stopMeteors=meteors();const stopTactile=initTactile();return()=>{document.removeEventListener('pointerdown',inkOnTap);stopMeteors();stopTactile()}},[]);useEffect(()=>{const receive=(e:Event)=>{const value=(e as CustomEvent<Mode>).detail;setMode(value);try{const old=JSON.parse(localStorage.getItem('daybreak:gravity:v1')||'{}');localStorage.setItem('daybreak:gravity:v1',JSON.stringify({...old,theme:value}))}catch{}};window.addEventListener('daybreak-theme',receive);const apply=()=>{document.documentElement.dataset.theme=mode==='auto'?(new Date().getHours()>=7&&new Date().getHours()<19?'light':'dark'):mode};apply();const timer=setInterval(apply,60000);return()=>{clearInterval(timer);window.removeEventListener('daybreak-theme',receive)}},[mode]);function change(value:Mode){setMode(value);try{const key='daybreak:gravity:v1';const p=JSON.parse(localStorage.getItem(key)||'{}');localStorage.setItem(key,JSON.stringify({...p,theme:value}));const old=JSON.parse(localStorage.getItem('daybreak:v1')||'null');if(old?.preferences){old.preferences.themeMode=value;localStorage.setItem('daybreak:v1',JSON.stringify(old))}}catch{}window.dispatchEvent(new CustomEvent('daybreak-theme',{detail:value}))}const links=[['/','日历'],['/ritual/','塔罗'],['/consult/','牌阵'],['/encyclopedia/','图鉴'],['/zodiac/','星座'],['/history/','回望'],['/settings/','设置']];const here=(path+'/').replace(/\/+/g,'/');
 // 选中项下面那条金线带 view-transition-name：换页时浏览器把它从旧位置平滑移到新位置（支持跨页面视图过渡的浏览器才有，其他浏览器直接出现）
 return <header className="shared-header"><a href="/" className="shared-brand">DAYBREAK <span>晨启塔罗</span></a><nav aria-label="主导航">{links.map(([href,label])=><a key={href} href={href} aria-current={here===href?'page':undefined}>{label}{here===href&&<span className="nav-mark" aria-hidden="true"/>}</a>)}</nav><ThemePicker mode={mode} onChange={change}/></header>}

const MODES:readonly [Mode,string,string][]=[['dark','深色','#0B0A0E'],['light','浅色','#F2EFE9'],['auto','自动','linear-gradient(135deg,#F2EFE9 50%,#0B0A0E 50%)']];
/** 外观选择：毛玻璃浮层，从右上角弹开。样式与旧版页面里的 glassSelect（src/popover.ts）共用。 */
function ThemePicker({mode,onChange}:{mode:Mode;onChange:(m:Mode)=>void}){
 const [open,setOpen]=useState(false);const wrap=useRef<HTMLSpanElement>(null),trigger=useRef<HTMLButtonElement>(null),list=useRef<HTMLUListElement>(null);
 const current=MODES.find(m=>m[0]===mode)??MODES[0];
 useEffect(()=>{if(!open)return;const items=[...list.current!.querySelectorAll<HTMLElement>('li')];(items.find(li=>li.getAttribute('aria-selected')==='true')??items[0])?.focus({preventScroll:true});
  const outside=(e:Event)=>{if(!wrap.current?.contains(e.target as Node))setOpen(false)};document.addEventListener('pointerdown',outside,true);return()=>document.removeEventListener('pointerdown',outside,true)},[open]);
 const close=()=>{setOpen(false);trigger.current?.focus({preventScroll:true})};
 const pick=(m:Mode)=>{if(m!==mode){onChange(m);triggerHaptic('selection')}close()};
 function keys(e:React.KeyboardEvent<HTMLUListElement>){const all=[...e.currentTarget.querySelectorAll<HTMLElement>('li')],i=all.indexOf(document.activeElement as HTMLElement);
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();all[(i+(e.key==='ArrowDown'?1:-1)+all.length)%all.length]?.focus()}
  else if(e.key==='Enter'||e.key===' '){e.preventDefault();if(i>=0)pick(MODES[i][0])}
  else if(e.key==='Escape'||e.key==='Tab'){e.preventDefault();close()}}
 return <span ref={wrap} className={`glass-select theme-picker${open?' open':''}`}><span className="theme-label" aria-hidden="true">外观</span>
  <button ref={trigger} type="button" className="glass-trigger" aria-label={`外观：${current[1]}`} aria-haspopup="listbox" aria-expanded={open} aria-controls="theme-pop" onClick={()=>setOpen(o=>!o)} onKeyDown={e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();setOpen(true)}}}><span className="swatch" style={{['--swatch' as string]:current[2]}}/><span className="glass-value">{current[1]}</span><svg className="glass-chevron" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
  <ul ref={list} id="theme-pop" className="glass-pop" role="listbox" aria-label="外观" onKeyDown={keys}>{MODES.map(([value,label,swatch])=><li key={value} role="option" tabIndex={-1} aria-selected={value===mode} onClick={()=>pick(value)}><span className="swatch" style={{['--swatch' as string]:swatch}}/><span>{label}</span><span className="glass-check" aria-hidden="true">✓</span></li>)}</ul></span>}
