// 每天早上提醒：在浏览器里生成一个 .ics 日历文件（每天重复、到点提醒），用户打开后加到自己的日历。
// 不需要后端、账号或推送权限；网站不知道谁加了、加在哪里。
export interface ReminderOptions{hour:number;minute:number;url:string;from:Date;uid?:string}
const pad=(n:number)=>String(n).padStart(2,'0');
/** 日历文本里的逗号、分号、反斜线和换行要转义（RFC 5545 §3.3.11） */
export const icsText=(s:string)=>s.replace(/\\/g,'\\\\').replace(/;/g,'\;').replace(/,/g,'\\,').replace(/\r?\n/g,'\\n');
/** 每行不超过 75 个字节，超出的折到下一行并以空格开头；按字切，不把一个汉字切成两半（RFC 5545 §3.1） */
export function foldLine(line:string){const enc=new TextEncoder();const out:string[]=[];let cur='',bytes=0;
 for(const ch of line){const n=enc.encode(ch).length,limit=out.length?74:75;if(bytes+n>limit){out.push(cur);cur=ch;bytes=n}else{cur+=ch;bytes+=n}}
 out.push(cur);return out.join('\r\n ')}
/** 第一次提醒：from 之后最近的那个 hour:minute（用本机时间，不带时区，各家日历都按手机所在时区理解） */
export function firstAlarm(from:Date,hour:number,minute:number){const d=new Date(from);d.setHours(hour,minute,0,0);if(d<=from)d.setDate(d.getDate()+1);return d}
const local=(d:Date)=>`${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
const utc=(d:Date)=>d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
export function buildReminderIcs({hour,minute,url,from,uid}:ReminderOptions){
 if(!(hour>=0&&hour<=23&&minute>=0&&minute<=59))throw new RangeError('时间不对');
 const start=firstAlarm(from,hour,minute),title='晨启 · 抽今天的一张牌';
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//DAYBREAK//Morning Reminder//ZH','CALSCALE:GREGORIAN','METHOD:PUBLISH',
  'BEGIN:VEVENT',`UID:${uid||`daybreak-morning-${start.getTime()}`}@daybreak`,`DTSTAMP:${utc(from)}`,`DTSTART:${local(start)}`,'DURATION:PT5M','RRULE:FREQ=DAILY',
  `SUMMARY:${icsText(title)}`,`DESCRIPTION:${icsText(`早上好。打开晨启，抽一张牌，读一句大白话，做一件十分钟的小事：${url}`)}`,`URL:${url}`,'TRANSP:TRANSPARENT',
  'BEGIN:VALARM','ACTION:DISPLAY',`DESCRIPTION:${icsText(title)}`,'TRIGGER:PT0M','END:VALARM','END:VEVENT','END:VCALENDAR'];
 return lines.map(foldLine).join('\r\n')+'\r\n'}
