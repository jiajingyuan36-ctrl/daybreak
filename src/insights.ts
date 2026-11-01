import type {Day} from './types.ts';import {cardById} from './cards.ts';import {localDate} from './engine.ts';
export interface MonthCell {date:string;day:number;entry?:Day}
export interface MonthSummary {ym:string;label:string;cells:(MonthCell|null)[];drawn:number;reviewed:number;upright:number;reversed:number;longestStreak:number;lines:string[];notes:{date:string;text:string}[]}
const SUIT_HINT:Record<string,[string,string]>={大阿卡纳:['大牌','大牌出现得多，这个月可能有一些比较大的变化或感受。'],权杖:['权杖','这个月你的力气多半花在了做事和往前推上。'],圣杯:['圣杯','这个月你心里装的多半是人和感情的事。'],宝剑:['宝剑','这个月你想得比较多，沟通和判断占了不少心思。'],星币:['星币','这个月你更多在打理钱、时间和日常的实事。']};
export const shiftMonth=(ym:string,delta:number)=>{const d=new Date(Number(ym.slice(0,4)),Number(ym.slice(5,7))-1+delta,1,12);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`};
/** 一个月的日历格子（周一开头）和白话小结，只根据用户真实留下的记录。 */
export function monthSummary(days:Record<string,Day>,ym:string):MonthSummary{
 const y=Number(ym.slice(0,4)),m=Number(ym.slice(5,7));const total=new Date(y,m,0).getDate(),lead=(new Date(y,m-1,1,12).getDay()+6)%7;
 const cells:(MonthCell|null)[]=[...Array(lead).fill(null)];const entries:Day[]=[];
 for(let d=1;d<=total;d++){const date=`${ym}-${String(d).padStart(2,'0')}`,entry=days[date];cells.push({date,day:d,entry});if(entry)entries.push(entry)}
 let streak=0,longestStreak=0;for(const c of cells){if(!c)continue;streak=c.entry?streak+1:0;longestStreak=Math.max(longestStreak,streak)}
 const reviewed=entries.filter(e=>e.review?.note?.trim()).length,reversed=entries.filter(e=>e.reversed).length,upright=entries.length-reversed;
 const count=(keys:string[])=>[...keys.reduce((m,k)=>m.set(k,(m.get(k)||0)+1),new Map<string,number>())].sort((a,b)=>b[1]-a[1]);
 const lines:string[]=[];
 if(!entries.length)lines.push('这个月还没有抽过牌。');
 else{
  lines.push(`这个月抽了 ${entries.length} 天牌，${reviewed?`其中 ${reviewed} 天写了回顾。`:'还没写过回顾。'}`);
  const [suit,n]=count(entries.map(e=>cardById(e.cardId).suit))[0];if(n>=2&&SUIT_HINT[suit])lines.push(`${SUIT_HINT[suit][0]}出现得最多（${n} 次）。${SUIT_HINT[suit][1]}`);
  lines.push(`正位 ${upright} 次，逆位 ${reversed} 次。${reversed>upright&&entries.length>=3?'逆位偏多，可能有些事还卡在半路，不用急。':''}`);
  const repeats=count(entries.map(e=>cardById(e.cardId).nameZh)).filter(([,k])=>k>=2).map(([name])=>name);if(repeats.length)lines.push(`${repeats.join('、')}来了不止一次，值得回头看看它说了什么。`);
  if(longestStreak>=3)lines.push(`最长连着抽了 ${longestStreak} 天。`);
 }
 const notes=entries.filter(e=>e.review?.note?.trim()).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,3).map(e=>({date:e.date,text:e.review!.note.trim()}));
 return {ym,label:`${y} 年 ${m} 月`,cells,drawn:entries.length,reviewed,upright,reversed,longestStreak,lines,notes}}
export function recentFootprints(days:Record<string,Day>,now=new Date(),count=14){return Array.from({length:count},(_,i)=>{const date=new Date(now.getFullYear(),now.getMonth(),now.getDate()-count+1+i,12);const key=localDate(date),d=days[key];return {date:key,day:date.getDate(),drawn:!!d,reviewed:!!d?.review,note:!!d?.review?.note.trim(),actionDone:d?.review?.actionDone===true}})}
export function recentInsight(days:Record<string,Day>,today=localDate()){const recent=Object.values(days).filter(d=>d.date<=today).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,7);if(recent.length<3)return '留下三次晨启后，这里会整理你实际记录过的心情与牌面。每一次回来都算数。';const top=(values:string[])=>{const counts=new Map<string,number>();for(const v of values)counts.set(v,(counts.get(v)||0)+1);return [...counts].sort((a,b)=>b[1]-a[1])[0]};const suit=top(recent.map(d=>cardById(d.cardId).suit));const mood=top(recent.map(d=>d.mood).filter(Boolean));const resonant=recent.filter(d=>d.review?.resonance==='很有共鸣').map(d=>cardById(d.cardId).nameZh);return `最近 ${recent.length} 次晨启中，「${suit[0]}」出现 ${suit[1]} 次。${mood?`你记录最多的心情是「${mood[0]}」（${mood[1]} 次）。`:'你暂时没有标记晨间心情。'}${resonant.length?`你对${resonant.map(n=>'「'+n+'」').join('、')}留下了“很有共鸣”的回顾。`:''}这些只是你留下的记录，不代表牌面揭示了性格或因果。`}
