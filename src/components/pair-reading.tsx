'use client';
import {useEffect,useState} from 'react';
import {SIGNS,birthSign,type Sign} from '../astro';
import {pairReading,signById,PAIR_SOURCES} from '../synastry';
import {ZODIAC} from '../zodiac';
import {cards,cardById} from '../cards';
import {cardImageUrl} from '../art';
import type {Card} from '../types';
// 两个人的星座：选生日或直接选星座，看相处方式；再抽三张牌看你们之间。
// 分享链接里只放两个星座，不放生日。
function storedBirth(){try{const g=JSON.parse(localStorage.getItem('daybreak:gravity:v1')||'{}');if(g.birth)return String(g.birth);const d=JSON.parse(localStorage.getItem('daybreak:v1')||'null');return d?.preferences?.birthDate||''}catch{return ''}}
function Person({label,sign,onSign}:{label:string;sign:Sign|null;onSign:(s:Sign|null)=>void}){const [birth,setBirth]=useState('');
 return <div className="pair-person"><p className="pair-label">{label}</p>
  <label className="pair-field"><span>生日</span><input type="date" min="1900-01-01" max="2100-12-31" value={birth} onChange={e=>{setBirth(e.target.value);const s=e.target.value?birthSign(e.target.value):null;if(s)onSign(s)}}/></label>
  <label className="pair-field"><span>或者直接选星座</span><select value={sign?.id||''} onChange={e=>{setBirth('');onSign(signById(e.target.value))}}><option value="">请选择</option>{SIGNS.map(s=><option key={s.id} value={s.id}>{s.zh}</option>)}</select></label></div>}
function randomIndex(n:number){const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]%n}
type Drawn={card:Card;reversed:boolean};
export function PairReading(){const [a,setA]=useState<Sign|null>(null),[b,setB]=useState<Sign|null>(null),[drawn,setDrawn]=useState<Drawn[]|null>(null),[copied,setCopied]=useState(false);
 useEffect(()=>{const q=new URLSearchParams(location.search);const qa=signById(q.get('a')),qb=signById(q.get('b'));if(qa)setA(qa);else{const bd=storedBirth();if(bd)setA(birthSign(bd))}if(qb)setB(qb)},[]);
 useEffect(()=>{setDrawn(null)},[a,b]);
 const r=a&&b?pairReading(a,b):null;
 function draw(){const pool=[...cards],out:Drawn[]=[];for(let i=0;i<3;i++){const k=randomIndex(pool.length);out.push({card:pool.splice(k,1)[0],reversed:randomIndex(10)<3})}setDrawn(out)}
 async function share(){if(!a||!b)return;const url=`${location.origin}/pair/?a=${a.id}&b=${b.id}`;try{if(navigator.share){await navigator.share({title:`${a.zh} × ${b.zh} · 晨启塔罗`,url});return}}catch{return}try{await navigator.clipboard.writeText(url)}catch{const t=document.createElement('textarea');t.value=url;document.body.appendChild(t);t.select();try{document.execCommand('copy')}catch{}t.remove()}setCopied(true);setTimeout(()=>setCopied(false),1800)}
 const major=(s:Sign)=>ZODIAC.find(z=>z.sign.id===s.id)!.major;
 return <div className="pair-reading">
  <div className="pair-inputs"><Person label="你" sign={a} onSign={setA}/><Person label="TA" sign={b} onSign={setB}/></div>
  {r&&a&&b&&<section className="pair-result" aria-live="polite">
   <h2>{a.zh}<span className="pair-x">×</span>{b.zh}</h2><p className="pair-tag">{r.tag}</p>
   <p className="pair-one">{r.one}</p>
   <h3>你们的相处底色</h3>{r.base.map(t=><p key={t}>{t}</p>)}
   <h3>古典里的你们</h3>{r.classical.map(t=><p key={t}>{t}</p>)}
   <h3>容易卡住的地方</h3>{r.stuck.map(t=><p key={t}>{t}</p>)}
   <h3>相处小建议</h3>{r.tips.map(t=><p key={t}>{t}</p>)}
   <h3>你们的代表牌</h3>
   <div className="pair-majors">{[a,b].map((s,i)=>{const c=cardById(major(s));return <figure key={i}><img src={cardImageUrl(c.id)} alt={c.nameZh} width={150} height={257}/><figcaption><span>{i===0?'你':'TA'} · {s.zh}</span><strong>{c.nameZh}</strong></figcaption></figure>})}</div>
   {[a,b].map((s,i)=>{const c=cardById(major(s));return <p key={i} className="pair-love"><span>{i===0?'你':'TA'}的{c.nameZh}，在感情里：</span>{c.lifeAspects.love}</p>})}
   <h3>抽三张牌，看看你们之间</h3>
   {!drawn?<button className="outline-button pair-draw" onClick={draw}>抽三张牌</button>:<div className="pair-spread">{drawn.map((d,i)=><article key={d.card.id}><img src={cardImageUrl(d.card.id,true)} alt={d.card.nameZh} width={96} height={164} style={d.reversed?{transform:'rotate(180deg)'}:undefined}/><div><p className="pair-pos">{['你','TA','你们之间'][i]}</p><strong>{d.card.nameZh} · {d.reversed?'逆位':'正位'}</strong><p>{i<2?(d.reversed?d.card.keywordsReversed:d.card.keywordsUpright).join('、'):d.card.lifeAspects.love}</p></div></article>)}<button className="text-button" onClick={draw}>再抽一次</button></div>}
   <div className="pair-actions"><button className="outline-button" onClick={share}>{copied?'链接已复制':'发给 TA'}</button></div>
   <p className="pair-note">这里只看太阳星座，是简化版的相处参考，不是对关系的判断。完整的合盘还要看月亮、金星、火星和上升星座。依据：{PAIR_SOURCES}</p>
  </section>}
 </div>}
