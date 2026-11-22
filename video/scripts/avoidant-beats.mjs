// 按配音里的停顿，量出 Scene 1 的两个时间点：node scripts/avoidant-beats.mjs [音频]
// 文案有两处明显停顿：「冷掉。」之后（= 别骂自己冷血 的起点，flip）和「冷血——」之后（= 其实 的起点，alarm）。
// 用 ffmpeg silencedetect 找最长的两段句中静音，取静音结束处。结果抄回 src/avoidant/timeline.ts 的 DEFAULT_BEATS。
import {spawnSync} from 'node:child_process';
const f=process.argv[2]||'public/audio/avoid_1.mp3';
const err=spawnSync('ffmpeg',['-i',f,'-af','silencedetect=noise=-35dB:d=0.08','-f','null','-'],{encoding:'utf8'}).stderr;
const dur=Number(/Duration: (\d+):(\d+):([\d.]+)/.exec(err).slice(1).reduce((a,x)=>a*60+Number(x),0));
const ends=[...err.matchAll(/silence_end: ([\d.]+) \| silence_duration: ([\d.]+)/g)].map(m=>({end:+m[1],len:+m[2]}))
 .filter(s=>s.end-s.len>0.3&&s.end<dur-0.2); // 去掉开头和结尾的静音
const two=ends.sort((a,b)=>b.len-a.len).slice(0,2).sort((a,b)=>a.end-b.end);
console.log('配音时长',dur.toFixed(3),'秒；句中停顿',ends.map(s=>`${(s.end-s.len).toFixed(2)}–${s.end.toFixed(2)}`).join('，'));
if(two.length<2){console.log('没找到两处停顿，手动听一下');process.exit(1)}
console.log(`DEFAULT_BEATS={flip:${two[0].end.toFixed(2)},alarm:${two[1].end.toFixed(2)},end:${dur.toFixed(2)}}`);
