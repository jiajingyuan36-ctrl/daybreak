
'use client';
import {useEffect,useRef,useState} from 'react';
import {initTactile,triggerHaptic} from '../tactile';
import {usePathname} from 'next/navigation';
import {BRAND_NAME,BRAND_MARK,BRAND_TITLE} from '../site';
type Mode='auto'|'dark'|'light';
// 点击反馈：在指尖或鼠标落下的位置画一圈淡淡的墨晕。画在固定层上，不改动任何按钮自身的布局。
const TAPPABLE='button,a,[role="button"],select,summary,label,.catalog-card,.history-item,.day.has-card';
function inkOnTap(e:PointerEvent){if(e.button>0||matchMedia('(prefers-reduced-motion: reduce)').matches)return;const el=(e.target as Element|null)?.closest?.(TAPPABLE);if(!el||(el as HTMLButtonElement).disabled)return;const ink=document.createElement('span');ink.className='tap-ink';ink.style.left=e.clientX+'px';ink.style.top=e.clientY+'px';document.body.appendChild(ink);ink.addEventListener('animationend',()=>ink.remove(),{once:true});setTimeout(()=>ink.remove(),900)}
// 背景流星：打开页面一两秒后来第一颗，之后每隔 9 到 16 秒，在屏幕上半部分有一颗很细很淡的流星斜着划过，约一秒消失。只动 transform 和透明度，不占主线程。
function meteors():()=>void{if(typeof Element.prototype.animate!=='function'||matchMedia('(prefers-reduced-motion: reduce)').matches)return ()=>{};let timer=0;
 const fly=()=>{if(!document.hidden){const m=document.createElement('span');m.className='meteor';m.setAttribute('aria-hidden','true');const vw=innerWidth,vh=innerHeight;const angle=rand(18,32),dist=Math.min(vw,900)*rand(.28,.42);m.style.left=`${rand(vw*.25,vw*.95)}px`;m.style.top=`${rand(vh*.04,vh*.4)}px`;m.style.setProperty('--a',`${angle}deg`);document.body.appendChild(m);
  const rad=angle*Math.PI/180,dx=-Math.cos(rad)*dist,dy=Math.sin(rad)*dist;const anim=m.animate([{transform:`rotate(${-angle}deg) scaleX(.2)`,translate:'0 0',opacity:0},{opacity:1,offset:.18},{transform:`rotate(${-angle}deg) scaleX(1)`,opacity:.85,offset:.55},{transform:`rotate(${-angle}deg) scaleX(.6)`,translate:`${dx}px ${dy}px`,opacity:0}],{duration:rand(1000,1400),easing:'cubic-bezier(.3,.1,.4,1)'});anim.onfinish=()=>m.remove()}
  timer=window.setTimeout(fly,rand(9000,16000))};
 timer=window.setTimeout(fly,rand(1500,3000));return ()=>clearTimeout(timer)}
const rand=(a:number,b:number)=>a+Math.random()*(b-a);
function registerWorker(){
 if(!('serviceWorker'in navigator))return;
 navigator.serviceWorker.register('/sw.js').then(async()=>{
  const connection=(navigator as Navigator&{connection?:{saveData?:boolean;effectiveType?:string}}).connection;
  if(!['/','/ritual/'].includes(location.pathname)||connection?.saveData||connection?.effectiveType?.includes('2g'))return;
  const registration=await navigator.serviceWorker.ready;
  const warm=()=>registration.active?.postMessage('warm-entry');
  const idle=()=>typeof window.requestIdleCallback==='function'?window.requestIdleCallback(warm):window.setTimeout(warm,200);
  if(document.readyState==='complete')idle();else window.addEventListener('load',idle,{once:true});
 }).catch(()=>{});
}
export function SiteChrome(){const path=usePathname();const [mode,setMode]=useState<Mode>('dark');useEffect(()=>{try{setMode(JSON.parse(localStorage.getItem('daybreak:gravity:v1')||'{}').theme||'dark')}catch{}registerWorker();document.addEventListener('pointerdown',inkOnTap,{passive:true});const stopMeteors=meteors();const stopTactile=initTactile();return()=>{document.removeEventListener('pointerdown',inkOnTap);stopMeteors();stopTactile()}},[]);useEffect(()=>{const receive=(e:Event)=>{const value=(e as CustomEvent<Mode>).detail;setMode(value);try{const old=JSON.parse(localStorage.getItem('daybreak:gravity:v1')||'{}');localStorage.setItem('daybreak:gravity:v1',JSON.stringify({...old,theme:value}))}catch{}};window.addEventListener('daybreak-theme',receive);const apply=()=>{document.documentElement.dataset.theme=mode==='auto'?(new Date().getHours()>=7&&new Date().getHours()<19?'light':'dark'):mode};apply();const timer=setInterval(apply,60000);return()=>{clearInterval(timer);window.removeEventListener('daybreak-theme',receive)}},[mode]);function change(value:Mode){setMode(value);try{const key='daybreak:gravity:v1';const p=JSON.parse(localStorage.getItem(key)||'{}');localStorage.setItem(key,JSON.stringify({...p,theme:value}));const old=JSON.parse(localStorage.getItem('daybreak:v1')||'null');if(old?.preferences){old.preferences.themeMode=value;localStorage.setItem('daybreak:v1',JSON.stringify(old))}}catch{}window.dispatchEvent(new CustomEvent('daybreak-theme',{detail:value}))}const links=[['/','日历'],['/ritual/','塔罗'],['/consult/','牌阵'],['/encyclopedia/','图鉴'],['/zodiac/','星座'],['/history/','回望'],['/settings/','设置']];const here=(path+'/').replace(/\/+/g,'/');
 // 选中项下面那条金线带 view-transition-name：换页时浏览器把它从旧位置平滑移到新位置（支持跨页面视图过渡的浏览器才有，其他浏览器直接出现）
 return <header className="shared-header"><a href="/" className="shared-brand" aria-label={`${BRAND_TITLE}，回到日历`}><span className="brand-main">{BRAND_NAME}</span><span className="brand-sub" aria-hidden="true">{BRAND_MARK}</span></a><nav aria-label="主导航">{links.map(([href,label])=><a key={href} href={href} aria-current={here===href?'page':undefined}>{label}{here===href&&<span className="nav-mark" aria-hidden="true"/>}</a>)}</nav><ThemeToggle mode={mode} onChange={change}/></header>}

/** 外观切换：一个图标按钮，深色时显示太阳（点了换浅色），浅色时显示月相（点了换深色）。「自动」留在设置页里。 */
function ThemeToggle({mode,onChange}:{mode:Mode;onChange:(m:Mode)=>void}){
 const [dark,setDark]=useState(true);
 useEffect(()=>{const read=()=>setDark(document.documentElement.dataset.theme!=='light');read();const o=new MutationObserver(read);o.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});return()=>o.disconnect()},[mode]);
 return <button type="button" className="theme-toggle" aria-label={dark?'换成浅色':'换成深色'} title={dark?'换成浅色':'换成深色'} onClick={()=>{onChange(dark?'light':'dark');triggerHaptic('selection')}}>
  {dark?<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/></svg>
   :<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 3.6a8.6 8.6 0 1 0 4.9 12.2A7 7 0 0 1 15.5 3.6Z"/></svg>}</button>}
