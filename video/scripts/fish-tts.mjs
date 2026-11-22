// 用 Fish Audio 生成《回避型依恋》的口播：FISH_API_KEY=… node scripts/fish-tts.mjs
// 接口按 Fish Audio 控制台给出的 curl 示例（POST /v1/tts，Bearer 鉴权，model 头）；prosody.speed 实测有效（2026-11-22）。
// 用 curl 发请求：云端环境的网络要走 HTTPS 代理，Node 自带的 fetch 不走代理。
import {spawnSync} from 'node:child_process';
import {writeFileSync,mkdirSync,readFileSync,rmSync} from 'node:fs';
const KEY=process.env.FISH_API_KEY;
if(!KEY){console.error('缺少 FISH_API_KEY');process.exit(1)}
const MODEL=process.env.FISH_MODEL||'s2.1-pro-free'; // 2026-11-30 前免费
const VOICE='159b7a7b9a8b4a27b21f6d32111718a6';
const jobs=[{out:'public/audio/avoid_1.mp3',speed:1.08,
 text:'对方越对你好，你越想把手机扣过去、突然冷掉。别骂自己冷血——其实，是你的大脑拉响了「亲密警报」。'}];
mkdirSync('public/audio',{recursive:true});
for(const j of jobs){
 const body='.tts-body.json';writeFileSync(body,JSON.stringify({text:j.text,reference_id:VOICE,format:'mp3',mp3_bitrate:192,normalize:true,prosody:{speed:j.speed,volume:0}}));
 const r=spawnSync('curl',['-sS','-X','POST','https://api.fish.audio/v1/tts','-H',`Authorization: Bearer ${KEY}`,'-H','Content-Type: application/json','-H',`model: ${MODEL}`,'--data-binary','@'+body,'-o',j.out,'-w','%{http_code} %{content_type}'],{encoding:'utf8'});
 rmSync(body);
 const [code,type]=(r.stdout||'').split(' ');
 if(code!=='200'||!String(type).includes('audio')){console.error('失败',code,type,r.stderr,readFileSync(j.out,'utf8').slice(0,400));rmSync(j.out,{force:true});process.exit(1)}
 console.log('写好',j.out);
}
