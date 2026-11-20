'use client';
// 书签按钮（牌页、图鉴检视台用；旧版今日结果页用 src/app.ts 里同样外观的按钮）。
import {useEffect,useRef,useState} from 'react';
import {bookmarkIcon,bookmarkKey,hasBookmark,onBookmarks,toggleBookmark,type BookmarkInput} from '../bookmarks';
import {track} from '../track';
import {triggerHaptic} from '../tactile';

type Item=BookmarkInput;
export function BookmarkButton({item,className=''}:{item:Item;className?:string}){
 const key=bookmarkKey(item);
 const [on,setOn]=useState(false),[note,setNote]=useState(false);const timer=useRef<number>(0);
 useEffect(()=>{setOn(hasBookmark(key));return onBookmarks(()=>setOn(hasBookmark(key)))},[key]);
 useEffect(()=>()=>window.clearTimeout(timer.current),[]);
 const click=()=>{const next=toggleBookmark(item);setOn(next);triggerHaptic(next?'success':'light');track('bookmark',{kind:item.kind,on:next});
  window.clearTimeout(timer.current);setNote(next);if(next)timer.current=window.setTimeout(()=>setNote(false),2600)};
 return <span className={`bm-wrap ${className}`}>
  <button type="button" className={`bm-toggle${on?' is-on':''}`} aria-pressed={on} onClick={click}>
   <span dangerouslySetInnerHTML={{__html:bookmarkIcon(on)}}/><span>{on?'已加书签':'加入书签'}</span>
  </button>
  <a className={`bm-note${note?' is-shown':''}`} href="/bookmarks/" aria-hidden={!note} tabIndex={note?0:-1}>在「书签」里 →</a>
 </span>;
}
