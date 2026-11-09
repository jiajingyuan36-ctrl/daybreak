// 访问统计的埋点：只记「做了什么」，不记抽到哪张牌、心情、问题和回答。
// 统计脚本没加载（没开启、被挡住、还没下载完）时什么都不做，不影响任何功能。
type Data=Record<string,string|number|boolean>;
declare global{interface Window{umami?:{track:(name:string,data?:Data)=>void}}}
const pending:[string,Data|undefined][]=[];let timer:ReturnType<typeof setTimeout>|undefined;
function flush(tries:number){timer=undefined;if(typeof window==='undefined')return;const u=window.umami;
 if(u){for(const [n,d] of pending.splice(0))try{u.track(n,d)}catch{};return}
 if(tries<10)timer=setTimeout(()=>flush(tries+1),1000);else pending.length=0}
export function track(name:string,data?:Data){if(typeof window==='undefined'||!document.querySelector('script[data-website-id]'))return;
 if(window.umami){try{window.umami.track(name,data)}catch{};return}
 if(pending.length<20)pending.push([name,data]);if(!timer)flush(0)}
/** 第几天来：只分档，不记具体日期 */
export const visitBucket=(n:number)=>n<=1?'1':n<=3?'2-3':n<=7?'4-7':n<=30?'8-30':'30+';
const SENT='daybreak:visit-sent:v1';
/** 每个浏览器每天只记一次：来源、第几天来、是否从主屏幕打开 */
export function trackDailyVisit(v:{source:string;days:string[]}|null,today:string,installed:boolean){if(!v)return;
 try{if(localStorage.getItem(SENT)===today)return;localStorage.setItem(SENT,today)}catch{return}
 track('daily-visit',{source:v.source,days:visitBucket(v.days.length),installed})}
