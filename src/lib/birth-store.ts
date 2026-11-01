// 生辰保存在本机浏览器：日历页读 daybreak:gravity:v1；同时写进旧版偏好 daybreak:v1，导出备份时也带上。
const STORE='daybreak:gravity:v1',LEGACY='daybreak:v1';
export interface StoredBirth {date:string;time:string}
export function readBirth():StoredBirth|null{try{const p=JSON.parse(localStorage.getItem(STORE)||'{}');return typeof p.birth==='string'&&p.birth?{date:p.birth,time:typeof p.birthTime==='string'?p.birthTime:''}:null}catch{return null}}
/** 保存后向浏览器申请持久存储，降低被自动清理的可能（浏览器可以拒绝，拒绝也不影响使用）。 */
export function saveBirth(date:string,time:string){try{const p=JSON.parse(localStorage.getItem(STORE)||'{}');p.birth=date;p.birthTime=time;localStorage.setItem(STORE,JSON.stringify(p));const old=JSON.parse(localStorage.getItem(LEGACY)||'null');if(old?.preferences){old.preferences.birthDate=date;old.preferences.birthTime=time;localStorage.setItem(LEGACY,JSON.stringify(old))}}catch{return false}navigator.storage?.persist?.().catch(()=>{});return true}
