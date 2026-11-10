// 首页「带着一个问题来」：问题只放在这次浏览的 sessionStorage 里交给抽牌页，不进网址（访问统计看不到问题）。
const KEY='daybreak:pending-ask:v1';
type Store=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
function session():Store|null{try{return sessionStorage}catch{return null}}
export function setPendingAsk(q:string,s:Store|null=session()){try{s?.setItem(KEY,q.trim());return true}catch{return false}}
export function peekPendingAsk(s:Store|null=session()){try{return s?.getItem(KEY)?.trim()||''}catch{return ''}}
export function clearPendingAsk(s:Store|null=session()){try{s?.removeItem(KEY)}catch{}}
