// 书签：把想回头再看的牌或某一天的解读收起来。只存在这台设备的浏览器里（daybreak:bookmarks:v1），和抽牌记录分开存，
// 这样 React 页面（牌页、图鉴、书签页）和旧版页面（今日结果）各自读写都不会互相覆盖。
// 改动后派发 daybreak-bookmarks 事件；别的标签页改了，靠 storage 事件同步。设置页导出备份时一起带上。
import {cardById} from './cards.ts';

export const BOOKMARK_KEY='daybreak:bookmarks:v1';
export const BOOKMARK_EVENT='daybreak-bookmarks';
export const BOOKMARK_LIMIT=500;
export type Bookmark=
 |{kind:'card';id:string;at:string}
 |{kind:'day';date:string;cardId:string;reversed:boolean;at:string};

/** 不带加入时间的书签（加书签时用），按种类分开推断 */
export type BookmarkInput=Bookmark extends infer B?B extends Bookmark?Omit<B,'at'>:never:never;

const isDate=(s:unknown):s is string=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s);
const isAt=(s:unknown):s is string=>typeof s==='string'&&!Number.isNaN(Date.parse(s));
/** 只留下格式正确、牌 ID 真实存在的书签，重复的只留一条 */
export function cleanBookmarks(input:unknown):Bookmark[]{
 if(!Array.isArray(input))return [];
 const out:Bookmark[]=[],seen=new Set<string>();
 for(const b of input.slice(0,BOOKMARK_LIMIT*2)){
  if(!b||typeof b!=='object')continue;const v=b as Record<string,unknown>;
  let item:Bookmark|null=null;
  if(v.kind==='card'&&typeof v.id==='string'&&cardById(v.id)&&isAt(v.at))item={kind:'card',id:v.id,at:v.at};
  else if(v.kind==='day'&&isDate(v.date)&&typeof v.cardId==='string'&&cardById(v.cardId)&&typeof v.reversed==='boolean'&&isAt(v.at))item={kind:'day',date:v.date,cardId:v.cardId,reversed:v.reversed,at:v.at};
  if(!item)continue;const k=bookmarkKey(item);if(seen.has(k))continue;seen.add(k);out.push(item);
  if(out.length>=BOOKMARK_LIMIT)break}
 return out}
export const bookmarkKey=(b:BookmarkInput|Bookmark)=>b.kind==='card'?`card:${b.id}`:`day:${b.date}`;

function storage():Storage|null{try{return typeof localStorage==='undefined'?null:localStorage}catch{return null}}
export function listBookmarks():Bookmark[]{const s=storage();if(!s)return [];try{return cleanBookmarks(JSON.parse(s.getItem(BOOKMARK_KEY)||'[]'))}catch{return []}}
export function saveBookmarks(list:Bookmark[]):boolean{const s=storage();if(!s)return false;
 try{s.setItem(BOOKMARK_KEY,JSON.stringify(cleanBookmarks(list)));if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent(BOOKMARK_EVENT));return true}catch{return false}}
export function hasBookmark(key:string){return listBookmarks().some(b=>bookmarkKey(b)===key)}
/** 加入或移除；返回操作后是否在书签里。新书签放在最前面。 */
export function toggleBookmark(item:BookmarkInput):boolean{
 const list=listBookmarks(),k=bookmarkKey(item),i=list.findIndex(b=>bookmarkKey(b)===k);
 if(i>=0){list.splice(i,1);saveBookmarks(list);return false}
 list.unshift({...item,at:new Date().toISOString()} as Bookmark);saveBookmarks(list.slice(0,BOOKMARK_LIMIT));return true}
export function removeBookmark(key:string){saveBookmarks(listBookmarks().filter(b=>bookmarkKey(b)!==key))}
/** 订阅变化（本页和其他标签页）；返回取消订阅的函数 */
export function onBookmarks(fn:()=>void){if(typeof window==='undefined')return ()=>{};
 const st=(e:StorageEvent)=>{if(e.key===BOOKMARK_KEY)fn()};window.addEventListener(BOOKMARK_EVENT,fn);window.addEventListener('storage',st);
 return ()=>{window.removeEventListener(BOOKMARK_EVENT,fn);window.removeEventListener('storage',st)}}

/** 书签图标：一条竖着的书签带，收藏后填满 */
export function bookmarkIcon(on:boolean){return `<svg class="bm-icon" viewBox="0 0 14 18" width="13" height="17" aria-hidden="true" focusable="false"><path d="M1.5 1.5h11v15l-5.5-4-5.5 4z" fill="${on?'currentColor':'none'}" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/></svg>`}
