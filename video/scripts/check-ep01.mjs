// 第 1 期字幕自查：每句停留时间 ≥ 字数 × 0.18 + 0.8 秒，前后句首尾相接、没有空白。
// 用法（在 video/ 里）：node scripts/check-ep01.mjs   （Node 24 能直接读 .ts）
import {CAPTIONS} from '../src/ep01/copy.ts';
let bad=0;
CAPTIONS.forEach((c,i)=>{
 const n=[...c.text.replace(/\{.:|\}|\n/g,'')].length;
 const need=+(n*0.18+0.8).toFixed(2),have=+(c.to-c.from).toFixed(2);
 const next=CAPTIONS[i+1];const gap=next?+(next.from-c.to).toFixed(2):0;
 const ok=have>=need&&gap===0;if(!ok)bad++;
 console.log(`${ok?'  ':'✗ '}${c.from.toFixed(2).padStart(6)}–${c.to.toFixed(2).padEnd(6)} ${String(n).padStart(2)}字 需≥${need}s 有${have}s${gap?` 与下一句间隔${gap}s`:''}  ${c.text.replace(/\n/g,' / ')}`);
});
console.log(bad?`${bad} 句不合格`:'全部合格');process.exit(bad?1:0);
