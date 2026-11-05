// 备份提醒：记录只存在这台设备的浏览器里，清缓存或换手机就没了。
// 攒到一定天数、又很久没导出时，在结果页下面轻轻提醒一次；点“以后再说”就隔一段时间再提。状态存在单独的键里，不碰 daybreak:v1。
export const BACKUP_KEY='daybreak:backup:v1';
export interface BackupState{at?:string;snoozeUntil?:string}
export const MIN_DAYS=7,REMIND_EVERY_DAYS=30,SNOOZE_DAYS=14;
const DAY=864e5;
export function shouldRemindBackup(recordDays:number,state:BackupState,now:Date){
 if(recordDays<MIN_DAYS)return false;
 const t=now.getTime();
 if(state.snoozeUntil&&Date.parse(state.snoozeUntil)>t)return false;
 if(state.at&&t-Date.parse(state.at)<REMIND_EVERY_DAYS*DAY)return false;
 return true}
export const snooze=(now:Date):BackupState=>({snoozeUntil:new Date(now.getTime()+SNOOZE_DAYS*DAY).toISOString()});
export function readBackupState(store:Pick<Storage,'getItem'>):BackupState{try{const v=JSON.parse(store.getItem(BACKUP_KEY)||'{}');return v&&typeof v==='object'?v:{}}catch{return {}}}
export function writeBackupState(store:Pick<Storage,'setItem'>,s:BackupState){try{store.setItem(BACKUP_KEY,JSON.stringify(s))}catch{}}
