'use client';
// 「你是哪张塔罗牌」测试页：开场 → 12 道题（一题一屏，点了就进下一题）→ 结果。
// 结果只存在这台设备（daybreak:quiz:v1），不上传。分享图在本机用 Canvas 画。
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {createPortal} from 'react-dom';
import {QUIZ,QUIZ_RESULTS,scoreQuiz,isQuizCard} from '../quiz';
import {cardById,roman} from '../cards';
import {cardImageUrl} from '../art';
import {track} from '../track';
import {TarotPlate} from './tarot/tarot-plate';
import {EditorialSection} from './tarot/editorial-section';
import {cardBack} from '../card-back';

const KEY='daybreak:quiz:v1';
type Saved={card:string;at:string};
function readSaved():Saved|null{try{const v=JSON.parse(localStorage.getItem(KEY)||'null');return v&&isQuizCard(v.card)?v:null}catch{return null}}
const reduceMotion=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const pad=(n:number)=>String(n).padStart(2,'0');

export function QuizApp(){
 const [stage,setStage]=useState<'intro'|'q'|'result'>('intro');
 const [idx,setIdx]=useState(0),[answers,setAnswers]=useState<number[]>([]),[picked,setPicked]=useState<number|null>(null);
 const [card,setCard]=useState(''),[saved,setSaved]=useState<Saved|null>(null);
 const stageRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{setSaved(readSaved())},[]);
 // 换屏：旧内容淡出、新内容淡入（和全站「先出后入」一致）
 const swap=(fn:()=>void)=>{const el=stageRef.current;if(!el||reduceMotion()||typeof el.animate!=='function'){fn();return}
  const out=el.animate([{opacity:1,transform:'none'},{opacity:0,transform:'translateY(-6px)'}],{duration:160,easing:'ease-in',fill:'forwards'});out.onfinish=()=>{fn();requestAnimationFrame(()=>{out.cancel();el.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:260,easing:'cubic-bezier(.22,1,.36,1)'})})}};
 const start=()=>{track('quiz-start');swap(()=>{setStage('q');setIdx(0);setAnswers([]);setPicked(null);window.scrollTo({top:0})})};
 const choose=(i:number)=>{if(picked!==null)return;setPicked(i);const next=[...answers.slice(0,idx),i];
  setTimeout(()=>swap(()=>{setAnswers(next);setPicked(null);
   if(idx+1<QUIZ.length){setIdx(idx+1)}else{const c=scoreQuiz(next);setCard(c);setStage('result');const s={card:c,at:new Date().toISOString()};try{localStorage.setItem(KEY,JSON.stringify(s))}catch{}setSaved(s);track('quiz-done',{card:c});window.scrollTo({top:0})}}),reduceMotion()?0:240)};
 const back=()=>{if(idx===0){swap(()=>setStage('intro'));return}swap(()=>{setIdx(idx-1);setPicked(null)})};
 const showSaved=()=>{if(!saved)return;swap(()=>{setCard(saved.card);setStage('result');window.scrollTo({top:0})})};

 return <div className="quiz-stage" ref={stageRef}>
  {stage==='intro'&&<section className="quiz-intro">
   <div className="quiz-fan" aria-hidden="true">{[0,1,2,3,4].map(i=><span key={i} className="quiz-fan-card" style={{'--i':i-2} as CSSProperties} dangerouslySetInnerHTML={{__html:cardBack()}}/>)}</div>
   <p className="quiz-eyebrow">22 张大阿卡纳 · 22 种性格</p>
   <h1>你是哪张塔罗牌？</h1>
   <p className="quiz-sub">12 道题，一分钟。<br/>在 22 张大牌里，找到最像你的那一张。</p>
   <button type="button" className="quiz-primary" onClick={start}>开始测试<span aria-hidden="true">→</span></button>
   {saved&&<button type="button" className="text-button quiz-last" onClick={showSaved}>上次测出来是{cardById(saved.card).nameZh}，再看一眼 →</button>}
   <p className="quiz-note">性格测试，不预测，不算命。结果只存在你自己的手机里。</p>
  </section>}
  {stage==='q'&&<Question idx={idx} picked={picked} prev={answers[idx]} onPick={choose} onBack={back}/>}
  {stage==='result'&&card&&<QuizResult id={card} onRetry={start}/>}
 </div>;
}

function Question({idx,picked,prev,onPick,onBack}:{idx:number;picked:number|null;prev?:number;onPick:(i:number)=>void;onBack:()=>void}){
 const q=QUIZ[idx];
 return <section className="quiz-q" aria-labelledby="quiz-q-title">
  <div className="quiz-progress"><span className="quiz-count">{pad(idx+1)} <i>/</i> {pad(QUIZ.length)}</span><span className="quiz-bar" aria-hidden="true"><span style={{width:`${(idx+1)/QUIZ.length*100}%`}}/></span></div>
  <h2 id="quiz-q-title">{q.q}</h2>
  <div className="quiz-options" role="list">{q.options.map((o,i)=><button key={i} type="button" role="listitem" className={`quiz-option${picked===i?' is-picked':''}${picked===null&&prev===i?' was-picked':''}`} onClick={()=>onPick(i)} disabled={picked!==null&&picked!==i}><span className="quiz-letter" aria-hidden="true">{'ABCD'[i]}</span><span>{o.text}</span></button>)}</div>
  <button type="button" className="text-button quiz-back" onClick={onBack}>← {idx===0?'回到开始':'上一题'}</button>
 </section>;
}

export function QuizResult({id,onRetry,shared=false}:{id:string;onRetry?:()=>void;shared?:boolean}){
 const c=cardById(id),r=QUIZ_RESULTS[id];const plate=useRef<HTMLDivElement>(null);
 const [poster,setPoster]=useState<string|null>(null),[clean,setClean]=useState(false),[busy,setBusy]=useState(false),[status,setStatus]=useState('');
 useEffect(()=>{const el=plate.current;if(!el||reduceMotion()||typeof el.animate!=='function')return;
  el.animate([{opacity:0,transform:'perspective(900px) rotateY(80deg) scale(.94)'},{opacity:1,transform:'perspective(900px) rotateY(0) scale(1)'}],{duration:900,easing:'cubic-bezier(.22,1,.36,1)'})},[id]);
 useEffect(()=>()=>{if(poster)URL.revokeObjectURL(poster)},[poster]);
 const makePoster=async(cl=clean)=>{setBusy(true);setStatus('');try{const {renderQuizPoster}=await import('../quiz-poster');const b=await renderQuizPoster(id,{clean:cl});setPoster(old=>{if(old)URL.revokeObjectURL(old);return URL.createObjectURL(b)});track('quiz-share',{kind:'poster'})}catch(e){setStatus(e instanceof Error?e.message:'生成失败，请重试。')}finally{setBusy(false)}};
 const savePoster=async()=>{if(!poster)return;const blob=await (await fetch(poster)).blob();const file=new File([blob],`晨启-我是${c.nameZh}.png`,{type:'image/png'});
  const nav=navigator as Navigator&{canShare?:(d:{files:File[]})=>boolean};
  if(nav.canShare?.({files:[file]})){try{await navigator.share({files:[file]});return}catch{}}
  const a=document.createElement('a');a.href=poster;a.download=file.name;a.click()};
 const copyLink=async()=>{const url=`${location.origin}/quiz/${id}/?from=quiz`;try{await navigator.clipboard.writeText(url);setStatus('链接已复制，发给一个朋友，看看他是哪一张。')}catch{setStatus(`复制这个链接发给朋友：${url}`)}track('quiz-share',{kind:'link'})};
 return <section className="quiz-result">
  <p className="quiz-eyebrow">{shared?'朋友测出来是':'你是'}</p>
  <div className="quiz-plate" ref={plate}><TarotPlate src={cardImageUrl(id)} alt={`${c.nameZh}（1909 年原版韦特塔罗）`} width={350} height={600}/></div>
  <h1>{roman(c.number)} · {c.nameZh}</h1>
  <p className="quiz-line">{r.line}</p>
  <div className="quiz-reading">
   <EditorialSection number="I" title={shared?'这张牌的样子':'你的样子'} heading="h2"><p>{r.look}</p></EditorialSection>
   <EditorialSection number="II" title="盲点" heading="h2"><p>{r.blind}</p></EditorialSection>
   <EditorialSection number="III" title="今天做一件事" heading="h2" className="ritual-ticket"><p>{r.act}</p></EditorialSection>
  </div>
  {shared?<div className="quiz-actions"><a className="quiz-primary" href="/quiz/?from=share" onClick={()=>track('quiz-from-share',{card:id})}>测测你是哪一张<span aria-hidden="true">→</span></a><p className="quiz-note">12 道题，一分钟。性格测试，不算命。</p></div>
  :<>
   <div className="quiz-actions">
    <button type="button" className="quiz-primary" onClick={()=>makePoster()} disabled={busy}>{busy?'正在生成…':'生成结果图'}</button>
    <button type="button" className="quiz-secondary" onClick={copyLink}>复制链接发给朋友</button>
    <p className="quiz-status" role="status" aria-live="polite">{status}</p>
    {onRetry&&<button type="button" className="text-button" onClick={onRetry}>重新测一次</button>}
   </div>
   <div className="quiz-next"><p>测完了。抽一张今天的牌，看看它想提醒你什么。</p><a className="quiz-secondary" href="/ritual/?from=quiz">抽今天的牌<span aria-hidden="true">→</span></a></div>
  </>}
  {/* 浮层直接挂到 body 上：换屏动画给外层留了 transform，fixed 定位会相对外层而不是屏幕 */}
  {poster&&createPortal(<div className="quiz-sheet" role="dialog" aria-modal="true" aria-label="结果图" onClick={e=>{if(e.target===e.currentTarget)setPoster(null)}}>
   <div className="quiz-sheet-box">
    <img src={poster} alt={`我是${c.nameZh}：${r.line}`}/>
    <p className="quiz-note">手机上长按图片保存，或者点下面的按钮。</p>
    <label className="quiz-clean"><input type="checkbox" checked={clean} onChange={e=>{setClean(e.target.checked);makePoster(e.target.checked)}}/><span>去掉二维码和网址（发小红书等平台用）</span></label>
    <div className="quiz-sheet-actions"><button type="button" className="quiz-primary" onClick={savePoster}>保存图片</button><button type="button" className="quiz-secondary" onClick={()=>setPoster(null)}>关闭</button></div>
   </div>
  </div>,document.body)}
 </section>;
}
