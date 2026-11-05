// 晨启塔罗 · 提问后端（零依赖）。
// 启动：node --experimental-strip-types server/index.mjs
// 环境变量：DEEPSEEK_API_KEY（必填，只放在 Render 的 Environment 里，不要写进代码或仓库）、PORT、
//   DEEPSEEK_MODEL（默认 deepseek-chat）、DEEPSEEK_BASE_URL、ALLOWED_ORIGINS（逗号分隔）、ALLOW_LOCAL=1（本机调试）
// 隐私：不记录用户的问题和回答，日志里只有牌的 ID、耗时和状态码。
import http from 'node:http';
import {validateInput,isCrisis,CRISIS_REPLY,buildMessages,checkAnswer,callModel,createLimiter} from './ask.mjs';

const KEY=process.env.DEEPSEEK_API_KEY||'';
const MODEL=process.env.DEEPSEEK_MODEL||'deepseek-chat',BASE=process.env.DEEPSEEK_BASE_URL||'https://api.deepseek.com';
const ORIGINS=new Set((process.env.ALLOWED_ORIGINS||'https://daybreak-morning-ritual.onrender.com,https://daybreaktarot.xyz,https://www.daybreaktarot.xyz').split(',').map(s=>s.trim()).filter(Boolean));
if(process.env.ALLOW_LOCAL==='1')for(const p of [3000,4173,4317,5173])ORIGINS.add(`http://localhost:${p}`);
const limiter=createLimiter({perMinute:Number(process.env.LIMIT_PER_MINUTE)||3,perDay:Number(process.env.LIMIT_PER_DAY)||5,globalPerDay:Number(process.env.LIMIT_GLOBAL_PER_DAY)||800});

const send=(res,status,body,extra={})=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...extra});res.end(JSON.stringify(body))};
const err=(res,status,error,message,extra)=>send(res,status,{error,message},extra);
/** 优先用 Cloudflare 写入、不能被访客伪造的头；否则取 X-Forwarded-For 第一段 */
const clientKey=req=>String(req.headers['cf-connecting-ip']||String(req.headers['x-forwarded-for']||'').split(',')[0].trim()||req.socket.remoteAddress||'?');
function readBody(req,max=4096){return new Promise((resolve,reject)=>{let n=0,big=false;const chunks=[];
 // 声明的长度就离谱的直接断开；稍微超一点的读完丢掉，再正常回 413（掐断连接的话，网页只会看到“网络错误”）
 if(Number(req.headers['content-length'])>100_000){reject(Object.assign(new Error('too large'),{status:413}));req.destroy();return}
 req.on('data',c=>{n+=c.length;if(n>max){big=true;return}chunks.push(c)});req.on('end',()=>{if(big)return reject(Object.assign(new Error('too large'),{status:413}));try{resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')||'null'))}catch{reject(Object.assign(new Error('bad json'),{status:400}))}});req.on('error',reject)})}

export const server=http.createServer(async(req,res)=>{
 const origin=req.headers.origin,allowed=origin&&ORIGINS.has(origin);
 const cors=allowed?{'access-control-allow-origin':origin,vary:'Origin'}:{vary:'Origin'};
 const url=new URL(req.url||'/','http://x');
 if(req.method==='OPTIONS'){res.writeHead(allowed?204:403,{...cors,'access-control-allow-methods':'POST, GET, OPTIONS','access-control-allow-headers':'content-type','access-control-max-age':'600'});return res.end()}
 if(req.method==='GET'&&url.pathname==='/health')return send(res,200,{ok:true,ai:!!KEY},cors);
 if(req.method!=='POST'||url.pathname!=='/api/ask')return err(res,404,'not_found','没有这个地址。',cors);
 if(origin&&!allowed)return err(res,403,'forbidden','这个来源不被允许。');
 if(!KEY)return err(res,503,'disabled','提问功能暂时没有开通。',cors);
 const t0=Date.now();
 try{
  const input=validateInput(await readBody(req));
  if(!input.ok)return err(res,400,'bad_request',input.message,cors);
  const {card,reversed,mood,question}=input.value;
  // 轻生、自伤相关：不调用模型，不计次数，直接给固定的关怀提示
  if(isCrisis(question))return send(res,200,{answer:CRISIS_REPLY,crisis:true},cors);
  const key=clientKey(req),gate=limiter.check(key);
  if(!gate.ok){
   if(gate.reason==='busy')return err(res,503,'busy','今天的提问人数太多了，明天再来试试。今天这张牌的解读已经在上面了。',cors);
   if(gate.reason==='day')return err(res,429,'rate_limited','今天的提问次数用完了，明天再来。',cors);
   return err(res,429,'rate_limited','问得有点快，歇一会儿再问。',{...cors,'retry-after':String(gate.retryAfter)});
  }
  let raw;
  try{raw=await callModel({messages:buildMessages({card,reversed,mood,question}),key:KEY,base:BASE,model:MODEL})}
  catch(e){console.log(`ask upstream_error card=${card.id} status=${e.status||e.name} ms=${Date.now()-t0}`);return err(res,502,'upstream','这会儿没能连上解读服务，稍后再试。',cors)}
  const remaining=limiter.hit(key),answer=checkAnswer(raw);
  if(!answer){console.log(`ask filtered card=${card.id} ms=${Date.now()-t0}`);return err(res,422,'filtered','这次的回答不太合适，没有显示。换个问法再试一次，或者先看看牌面的解读。',cors)}
  console.log(`ask ok card=${card.id} ms=${Date.now()-t0}`);
  return send(res,200,{answer,remaining},cors);
 }catch(e){
  if(e.status===413)return err(res,413,'bad_request','内容太长了。',cors);
  if(e.status===400)return err(res,400,'bad_request','请求格式不对。',cors);
  console.log(`ask error ${e.name}`);return err(res,500,'server','服务出了点问题。',cors);
 }
});
if(import.meta.url===`file://${process.argv[1]}`||process.argv[1]?.endsWith('server/index.mjs')){
 const port=Number(process.env.PORT)||8787;
 server.listen(port,'0.0.0.0',()=>console.log(`daybreak-ai listening on ${port} · key ${KEY?'set':'MISSING'} · model ${MODEL}`));
 process.on('SIGTERM',()=>server.close(()=>process.exit(0)));
}
