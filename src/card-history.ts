// 「这张牌你以前抽到过」：只读本机 daybreak:v1 里的抽牌记录，不上传。
import type {Day} from './types.ts';
/** 某一天之前抽到同一张牌的记录，最近的在前 */
export function pastDraws(days:Record<string,Day>,cardId:string,before:string):Day[]{return Object.values(days).filter(d=>d.cardId===cardId&&d.date<before).sort((a,b)=>b.date.localeCompare(a.date))}
/** 回望摘句：太长就截断，加省略号 */
export function noteExcerpt(note:string,max=40){const t=[...note.replace(/\s+/g,' ').trim()];return t.length>max?t.slice(0,max).join('')+'…':t.join('')}
/** 2026-09-03 → 9 月 3 日；不是同一年时带上年份 */
export function shortDate(date:string,today:string){const [y,m,d]=date.split('-').map(Number);return `${y!==Number(today.slice(0,4))?`${y} 年 `:''}${m} 月 ${d} 日`}
