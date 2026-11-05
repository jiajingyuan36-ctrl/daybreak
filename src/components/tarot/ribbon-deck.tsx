'use client';
// 牌阵抽牌：78 张宽幅拱桥牌扇 + 交错洗牌 + 指尖划过时的高斯波浪 + 飞入下方牌位槽。
// 洗牌四段（状态机）：合拢成一摞 → 左右分叠 → 交错切入 → 呼吸归正（金色涟漪）→ 沿拱桥一抹推开 → 可以选牌。
// 拱桥：虚拟圆心在牌扇下方远处，第 i 张牌 t∈[-1,1]，θ = t × 28°，x = sin θ × R，y = (1 − cos θ) × R（中间高、两端低）。
// 所有变换只动 transform（translate3d / rotate / scale），由 CSS transition 插值；手机上最多铺 45 张，方便手指选。
import {useCallback,useEffect,useLayoutEffect,useRef,useState} from 'react';
import {cardBackUse} from '../../card-back';

const BACK=cardBackUse();
const EASE='cubic-bezier(.22,1,.36,1)';
const MAX_A=28*Math.PI/180;
type Phase='stacked'|'split'|'riffle'|'settle'|'fan'|'ready';
// 洗牌各段的时长（毫秒）
const T={gather:380,split:260,riffle:420,settle:220,fan:680};

interface Props {size:number;shuffleKey:number;slots:string[];chosen:number[];busy:boolean;title:string;question:string;
 onPick:(i:number)=>void;onUnpick:(slot:number)=>void;onShuffle:()=>void;onConfirm:()=>void}

export function RibbonDeck({size,shuffleKey,slots,chosen,busy,title,question,onPick,onUnpick,onShuffle,onConfirm}:Props){
 const stage=useRef<HTMLDivElement>(null),cards=useRef<(HTMLDivElement|null)[]>([]),slotEls=useRef<(HTMLDivElement|null)[]>([]);
 const [w,setW]=useState(0),[phase,setPhase]=useState<Phase>('stacked'),[active,setActive]=useState(-1),[flying,setFlying]=useState<number[]>([]);
 const wasReady=useRef(false),raf=useRef(0);
 useLayoutEffect(()=>{const el=stage.current;if(!el)return;const ro=new ResizeObserver(([e])=>setW(e.contentRect.width));ro.observe(el);setW(el.clientWidth);return()=>ro.disconnect()},[]);

 // 几何：卡片尺寸、半径、可见张数都跟着舞台宽度走
 const phone=w>0&&w<640,N=Math.min(size,phone?45:78),cw=phone?52:84,ch=Math.round(cw*1.66);
 const R=Math.max(320,(w/2-cw*.7)/Math.sin(MAX_A)),drop=(1-Math.cos(MAX_A))*R,lift=phone?40:56,height=Math.round(lift+ch+drop+30);
 const at=(i:number)=>{const t=N>1?i/(N-1)*2-1:0,th=t*MAX_A;return {t,x:Math.sin(th)*R,y:(1-Math.cos(th))*R,rot:th*180/Math.PI}};
 const full=chosen.length>=slots.length;

 // 每次洗牌（shuffleKey 变化）播放一遍完整的洗牌仪式
 useEffect(()=>{if(!size)return;setActive(-1);
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){setPhase('ready');wasReady.current=true;return}
  const steps:[Phase,number][]=[['split',wasReady.current?T.gather:60],['riffle',T.split],['settle',T.riffle],['fan',T.settle],['ready',T.fan+N*5+60]];
  setPhase('stacked');let acc=0;const timers=steps.map(([p,d])=>{acc+=d;return window.setTimeout(()=>{setPhase(p);if(p==='ready')wasReady.current=true},acc)});
  return()=>timers.forEach(clearTimeout)},[shuffleKey,size,N]);

 /** 一张牌在当前阶段的位置、角度、缩放和过渡 */
 function style(i:number):React.CSSProperties{
  const thick=-i*.12;let x=0,y=thick,rot=0,s=1,z=i,transition=`transform ${T.gather}ms ${EASE} ${Math.min(i,N-1-i)*3}ms`;
  if(phase==='split'){const left=i%2===1;x=left?-72:72;rot=left?-6:6;transition=`transform ${T.split}ms ${EASE}`}
  else if(phase==='riffle')transition=`transform 300ms ${EASE} ${Math.min(i*4,320)}ms`;
  else if(phase==='settle')transition=`transform 200ms ${EASE}`;
  else if(phase==='fan'||phase==='ready'){const p=at(i);x=p.x;y=p.y;rot=p.rot;
   transition=phase==='fan'?`transform ${T.fan}ms ${EASE} ${i*5}ms,opacity .3s`:`transform 240ms ${EASE},opacity .3s`;
   // 高斯邻域波浪：离指尖最近的主牌抬起放大、回正；左右两张跟着隆起，并向两侧让出一点空隙
   if(phase==='ready'&&active>=0){const d=Math.abs(i-active),side=Math.sign(i-active);
    if(d===0){y-=32;s=1.22;rot*=.25;z=500}else if(d===1){y-=14;s=1.07;x+=side*12}else if(d===2){y-=5;s=1.02;x+=side*8}else if(d===3)x+=side*4}}
  const gone=chosen.includes(i)||flying.includes(i);
  return {transform:`translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${rot.toFixed(2)}deg) scale(${s})`,transition,zIndex:z,opacity:gone?0:1,width:cw,height:ch,marginLeft:-cw/2}}

 // 指尖位置 → 拱桥上的角度 → 最近的一张（跳过已经选走的）
 const nearest=useCallback((clientX:number)=>{const el=stage.current;if(!el)return -1;const r=el.getBoundingClientRect(),px=clientX-r.left-r.width/2;
  const th=Math.asin(Math.max(-1,Math.min(1,px/R))),t=Math.max(-1,Math.min(1,th/MAX_A));let i=Math.round((t+1)/2*(N-1));
  for(let k=0;k<N;k++){for(const j of [i-k,i+k])if(j>=0&&j<N&&!chosen.includes(j)&&!flying.includes(j))return j}return -1},[R,N,chosen,flying]);
 function hover(e:React.PointerEvent){if(phase!=='ready'||full)return;const x=e.clientX;cancelAnimationFrame(raf.current);raf.current=requestAnimationFrame(()=>setActive(nearest(x)))}

 /** 选中的牌从牌扇当前位置，沿阻尼曲线飞进下一个空牌位 */
 function fly(from:DOMRect,to:DOMRect,fromRot:number,reverse=false){return new Promise<void>(done=>{
  const ghost=document.createElement('div');ghost.className='ribbon-ghost';ghost.innerHTML=BACK;
  Object.assign(ghost.style,{left:`${from.left+from.width/2-cw/2}px`,top:`${from.top+from.height/2-ch/2}px`,width:`${cw}px`,height:`${ch}px`});document.body.appendChild(ghost);
  const dx=to.left+to.width/2-(from.left+from.width/2),dy=to.top+to.height/2-(from.top+from.height/2),sc=to.width/cw;
  const a={transform:`translate3d(0,0,0) rotate(${fromRot}deg) scale(${reverse?sc:1.22})`},b={transform:`translate3d(${dx}px,${dy}px,0) rotate(0deg) scale(${reverse?1:sc})`};
  const mid={transform:`translate3d(${dx*.5}px,${dy*.5-60}px,0) rotate(${fromRot/2}deg) scale(${reverse?(sc+1)/2:(1.22+sc)/2})`,offset:.45};
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){ghost.remove();done();return}
  const anim=ghost.animate([a,mid,b],{duration:560,easing:EASE});anim.onfinish=()=>{ghost.remove();done()};anim.oncancel=()=>{ghost.remove();done()}})}

 async function pick(i:number){
  if(i<0||full||phase!=='ready'||chosen.includes(i)||flying.includes(i))return;
  const card=cards.current[i],slot=slotEls.current[chosen.length];if(!card||!slot){onPick(i);return}
  navigator.vibrate?.(8);setFlying(f=>[...f,i]);setActive(-1);
  await fly(card.getBoundingClientRect(),slot.getBoundingClientRect(),at(i).rot);
  setFlying(f=>f.filter(x=>x!==i));onPick(i)}
 async function unpick(k:number){
  const i=chosen[k],card=cards.current[i],slot=slotEls.current[k];if(i===undefined)return;
  if(card&&slot){setFlying(f=>[...f,i]);onUnpick(k);await fly(slot.getBoundingClientRect(),card.getBoundingClientRect(),0,true);setFlying(f=>f.filter(x=>x!==i))}else onUnpick(k)}
 function auto(){const free=[...Array(N).keys()].filter(i=>!chosen.includes(i)&&!flying.includes(i));if(!free.length)return;const i=free[Math.floor(Math.random()*free.length)];setActive(i);window.setTimeout(()=>pick(i),260)}

 // 单张牌：飞进牌位、停 300 毫秒后自动翻开
 const confirmRef=useRef(onConfirm);confirmRef.current=onConfirm;
 useEffect(()=>{if(slots.length===1&&chosen.length===1){const t=window.setTimeout(()=>confirmRef.current(),300);return()=>clearTimeout(t)}},[chosen.length,slots.length]);

 function key(e:React.KeyboardEvent){if(phase!=='ready')return;
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();const step=e.key==='ArrowLeft'?-1:1;let i=active<0?Math.floor(N/2):active+step;while(i>=0&&i<N&&chosen.includes(i))i+=step;if(i>=0&&i<N)setActive(i)}
  else if((e.key==='Enter'||e.key===' ')&&active>=0){e.preventDefault();pick(active)}}
 const nudge=(step:number)=>{if(phase!=='ready')return;let i=active<0?Math.floor(N/2):active+step;while(i>=0&&i<N&&chosen.includes(i))i+=step;if(i>=0&&i<N)setActive(i)};

 const hint=phase!=='ready'?'正在洗牌……':full?(slots.length===1?'翻开这张牌……':'选好了，确认牌面就会翻开'):`指尖划过牌扇，停在哪张就点哪张 · 还差 ${slots.length-chosen.length} 张`;
 return <div className="ribbon">
  <div className="ribbon-head"><p className="ribbon-eyebrow">抽牌 · {title}<span>THE DRAW</span></p><p className="ribbon-question"><small>心里想着的问题</small>{question.trim()||'没有写问题，也可以只在心里想着它'}</p></div>
  <div className={`ribbon-stage is-${phase}`} ref={stage} style={{height}} tabIndex={0} role="listbox" aria-label={`${N} 张洗好的牌背，用左右方向键挑选，回车选中`}
   onPointerMove={hover} onPointerLeave={e=>{if(e.pointerType==='mouse')setActive(-1)}}
   onPointerDown={e=>{if(phase!=='ready')return;if(e.pointerType!=='mouse')(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);setActive(nearest(e.clientX))}}
   onPointerUp={e=>{if(phase!=='ready')return;pick(nearest(e.clientX))}} onKeyDown={key}>
   <div className="ribbon-anchor" style={{top:lift}}>
    {[...Array(N).keys()].map(i=><div key={i} ref={el=>{cards.current[i]=el}} className={`ribbon-card${i===active?' is-active':''}`} style={style(i)} dangerouslySetInnerHTML={{__html:BACK}}/>)}
    <span className="ribbon-ripple" style={{left:0,top:ch/2}} aria-hidden="true"/>
   </div>
   <button type="button" className="ribbon-nav prev" aria-label="往左挑一张" onClick={()=>nudge(-1)} onPointerDown={e=>e.stopPropagation()} onPointerUp={e=>e.stopPropagation()}>‹</button>
   <button type="button" className="ribbon-nav next" aria-label="往右挑一张" onClick={()=>nudge(1)} onPointerDown={e=>e.stopPropagation()} onPointerUp={e=>e.stopPropagation()}>›</button>
  </div>
  <p className="ribbon-hint" aria-live="polite">{hint}</p>
  <div className="ribbon-tray">{slots.map((name,k)=><div className={`ribbon-slot${chosen[k]!==undefined?' is-filled':''}`} key={k}>
   <div className="slot-well" ref={el=>{slotEls.current[k]=el}} style={{width:Math.round(cw*.72),height:Math.round(ch*.72)}}>{chosen[k]!==undefined&&<span className="slot-card" dangerouslySetInnerHTML={{__html:BACK}}/>}</div>
   <span className="slot-label">{k+1} · {name}{chosen[k]!==undefined&&<button type="button" aria-label={`把第 ${k+1} 张放回牌扇`} onClick={()=>unpick(k)}>×</button>}</span></div>)}</div>
  <div className="ribbon-actions">
   <button type="button" className="ribbon-btn" disabled={busy||phase!=='ready'} onClick={onShuffle}><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13 8a5 5 0 1 1-1.5-3.6M13 2.5v3h-3"/></svg>洗牌</button>
   <button type="button" className="ribbon-btn" disabled={full||phase!=='ready'} onClick={auto}><span aria-hidden="true">✦</span>替我选一张</button>
   {slots.length>1&&<button type="button" className="ribbon-btn ribbon-confirm" disabled={!full} onClick={onConfirm}>确认牌面<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 11L11 5M6 5h5v5"/></svg></button>}
  </div>
 </div>}
