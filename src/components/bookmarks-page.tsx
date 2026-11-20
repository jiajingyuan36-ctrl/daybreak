'use client';
// 书签页（/bookmarks/）：牌和某一天的解读两类，新加的在前。读写都在 src/bookmarks.ts。
import {useEffect,useMemo,useState} from 'react';
import {bookmarkKey,listBookmarks,onBookmarks,removeBookmark,type Bookmark} from '../bookmarks';
import {cardById,roman} from '../cards';
import {cardImageUrl} from '../art';
import {track} from '../track';
import {triggerHaptic} from '../tactile';

type Filter='all'|'card'|'day';
const FILTERS:[Filter,string][]=[['all','全部'],['card','牌'],['day','某一天']];
const dot=(d:string)=>d.replace(/-/g,'.');
const added=(at:string)=>{const d=new Date(at);return Number.isNaN(+d)?'':`${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} 收起`};

export function BookmarksPage(){
 const [list,setList]=useState<Bookmark[]|null>(null),[filter,setFilter]=useState<Filter>('all');
 useEffect(()=>{const load=()=>setList(listBookmarks());load();return onBookmarks(load)},[]);
 const shown=useMemo(()=>(list||[]).filter(b=>filter==='all'||b.kind===filter),[list,filter]);
 const count=(f:Filter)=>(list||[]).filter(b=>f==='all'||b.kind===f).length;
 const remove=(b:Bookmark)=>{removeBookmark(bookmarkKey(b));triggerHaptic('light');track('bookmark',{kind:b.kind,on:false,from:'page'})};
 return <>
  <header className="bm-head">
   <p className="quiz-eyebrow">BOOKMARKS</p>
   <h1>书签</h1>
   <p className="bm-lead">想回头再看的牌，和某一天抽到的那一张，都收在这里。只存在这台设备上，导出备份时会一起带走。</p>
  </header>
  {list===null?<p className="minimal-loading" role="status">正在读取书签</p>:list.length===0?
   <section className="bm-empty">
    <span className="engr-drop" aria-hidden="true"/>
    <h2>还没有书签</h2>
    <p>在每张牌的页面、图鉴里，或者今天抽到的牌下面，点「加入书签」，它就会收到这里。</p>
    <p className="bm-empty-links"><a className="quiz-secondary" href="/ritual/">抽今天的牌</a><a className="quiz-secondary" href="/encyclopedia/">翻一翻图鉴</a></p>
   </section>:<>
   <div className="codex-segs bm-segs" role="tablist" aria-label="书签分类">{FILTERS.map(([f,label])=><button key={f} type="button" role="tab" aria-selected={filter===f} className={filter===f?'on':''} onClick={()=>setFilter(f)}>{label}<small>{count(f)}</small></button>)}</div>
   {shown.length===0?<p className="bm-none">这一类还没有书签。</p>:
   <ol className="bm-list">{shown.map(b=>{const id=b.kind==='card'?b.id:b.cardId,c=cardById(id);if(!c)return null;const k=bookmarkKey(b);
    const href=b.kind==='card'?`/card/${c.id}/`:`/history/#day=${b.date}`;
    return <li key={k} className="bm-item">
     <a className="bm-link" href={href}>
      <span className={`bm-thumb tarot-plate${b.kind==='day'&&b.reversed?' is-reversed':''}`}><img src={cardImageUrl(c.id,true)} alt="" width={160} height={274} loading="lazy" decoding="async"/></span>
      <span className="bm-text">
       <small>{b.kind==='card'?'牌':`${dot(b.date)} · 那天抽到`}</small>
       <b>{roman(c.number)} · {c.nameZh}{b.kind==='day'&&<em>{b.reversed?'逆位':'正位'}</em>}</b>
       <span className="bm-en">{c.nameEn}</span>
       <span className="bm-at">{added(b.at)}</span>
      </span>
     </a>
     <button type="button" className="bm-remove" aria-label={`从书签移除：${c.nameZh}`} onClick={()=>remove(b)}>移除</button>
    </li>})}</ol>}
  </>}
 </>;
}
