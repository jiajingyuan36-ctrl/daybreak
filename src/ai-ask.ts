// 「抽牌后问一个问题」的网页端：只负责把问题发给我们自己的后端（server/），不碰任何密钥。
// 后端出错、超时或回答没能通过检查时，页面保持原样（牌的本地解读一直都在），只提示一句。
import {AI_API} from './site.ts';
export const ASK_MIN=2,ASK_MAX=80,ASKS_PER_DAY=3;
export interface AskInput{cardId:string;reversed:boolean;mood:string;question:string}
export type AskResult={ok:true;answer:string;crisis:boolean}|{ok:false;code:string;message:string};
const NET_FAIL='这会儿没连上解读服务。今天这张牌的解读已经在上面了，晚一点再来问也可以。';
/** 免费服务器闲置后第一次要等半分钟左右；打开结果页时先悄悄叫醒它（不带任何内容） */
let warmed=false;
export function warmUp(fetchImpl:typeof fetch=fetch){if(warmed)return;warmed=true;try{void fetchImpl(`${AI_API}/health`,{mode:'cors',cache:'no-store'}).catch(()=>{})}catch{}}
export function checkQuestion(q:string){const n=[...q.trim()].length;return n<ASK_MIN?'问题再写具体一点。':n>ASK_MAX?`问题请控制在 ${ASK_MAX} 个字以内。`:''}
export async function askCard(input:AskInput,fetchImpl:typeof fetch=fetch,timeoutMs=75000):Promise<AskResult>{
 try{
  const res=await fetchImpl(`${AI_API}/api/ask`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...input,question:input.question.trim()}),signal:AbortSignal.timeout(timeoutMs)});
  const body=await res.json().catch(()=>null) as {answer?:string;crisis?:boolean;error?:string;message?:string}|null;
  if(res.ok&&body?.answer)return {ok:true,answer:body.answer,crisis:!!body.crisis};
  return {ok:false,code:body?.error||'server',message:body?.message||NET_FAIL};
 }catch{return {ok:false,code:'network',message:NET_FAIL}}
}
