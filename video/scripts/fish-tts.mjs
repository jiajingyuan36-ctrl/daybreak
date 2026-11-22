// 用 Fish Audio 生成《回避型依恋》的口播：node scripts/fish-tts.mjs
// 需要环境变量 FISH_API_KEY。
// 注意（未验证）：接口地址、model 头和请求字段是按记忆写的，写这份脚本时打不开 Fish Audio 文档。
// 第一次运行如果报错，脚本会打印接口原样返回的内容，按它改。
import {writeFileSync,mkdirSync} from 'node:fs';
const KEY=process.env.FISH_API_KEY;
if(!KEY){console.error('缺少 FISH_API_KEY');process.exit(1)}
const jobs=[{out:'public/audio/avoid_1.mp3',speed:1.08,
 text:'对方越对你好，你越想把手机扣过去、突然冷掉。别骂自己冷血——其实，是你的大脑拉响了「亲密警报」。'}];
const VOICE='159b7a7b9a8b4a27b21f6d32111718a6';
for(const j of jobs){
 const r=await fetch('https://api.fish.audio/v1/tts',{method:'POST',
  headers:{'Authorization':`Bearer ${KEY}`,'Content-Type':'application/json','model':process.env.FISH_MODEL||'s1'},
  body:JSON.stringify({text:j.text,reference_id:VOICE,format:'mp3',mp3_bitrate:192,normalize:true,prosody:{speed:j.speed,volume:0}})});
 const buf=Buffer.from(await r.arrayBuffer());
 if(!r.ok||!(r.headers.get('content-type')||'').includes('audio')){console.error(r.status,r.headers.get('content-type'),buf.toString('utf8').slice(0,800));process.exit(1)}
 mkdirSync('public/audio',{recursive:true});writeFileSync(j.out,buf);console.log('写好',j.out,buf.length,'字节');
}
