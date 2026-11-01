// 访问来源与回访天数，只存在本机。来源取第一次带 ?from= 打开时的值（比如 xhs、ig、fb），之后不覆盖；
// 接上统计工具后由它读取，用来比较哪个平台带来的人最多、回来得最多。
export interface Visit {source:string;firstDay:string;days:string[]}
export const VISIT_KEY='daybreak:visit:v1';
const clean=(s:string|null)=>(s||'').toLowerCase().replace(/[^a-z0-9_-]/g,'').slice(0,24);
/** 纯函数：根据上次的记录、本次的 from 参数和今天的日期，算出新的记录。最多保留最近 60 个访问日。 */
export function nextVisit(prev:Visit|null,from:string|null,today:string):Visit{const source=prev?.source||clean(from)||'direct';const days=prev?.days.includes(today)?prev.days:[...(prev?.days??[]),today].slice(-60);return {source,firstDay:prev?.firstDay??today,days}}
export function recordVisit(search:string,today:string):Visit|null{try{const prev=JSON.parse(localStorage.getItem(VISIT_KEY)||'null') as Visit|null;const v=nextVisit(prev&&Array.isArray(prev.days)?prev:null,new URLSearchParams(search).get('from'),today);localStorage.setItem(VISIT_KEY,JSON.stringify(v));return v}catch{return null}}
