// 用一组真实风格的问题跑牌阵解读引擎，输出成 Markdown，人工检查读起来是否围绕问题、是否自然。
// 用法：node --experimental-strip-types scripts/reading-samples.ts [输出文件]（固定种子，每次结果一样，方便对比修改前后）
import {writeFileSync} from 'node:fs';
import {tarotCards,findSpread} from '../src/lib/tarot-catalog.ts';
import {readSpread,DOMAIN_LABEL} from '../src/lib/reading-engine.ts';
const QUESTIONS:[string,string][]=[
 ['我可以怎样改善和他的沟通？','three-card-state'],
 ['换工作这件事，我最该先弄清什么？','three-card-state'],
 ['这周我最需要留意什么？','three-card-state'],
 ['他到底喜不喜欢我？','three-card-state'],
 ['我和前任还会复合吗？','three-card-time'],
 ['考研这条路我要怎么坚持下去？','three-card-time'],
 ['为什么我总是存不下钱？','three-card-state'],
 ['留在北京还是回老家？','two-paths'],
 ['接这个offer还是继续读研？','two-paths'],
 ['要不要和室友摊牌说清楚？','three-card-state'],
 ['我和妈妈最近总吵架，怎么办？','three-card-state'],
 ['副业能做起来吗？','celtic-cross'],
 ['这段关系接下来会怎样？','celtic-cross'],
 ['我最近很焦虑，该怎么调整自己？','big-dipper'],
 ['新项目怎么推进？','big-dipper'],
 ['','three-card-state'],
 ['今天适合表白吗？','single-daily'],
 ['老板对我是什么态度？','three-card-state'],
 ['我想买房，现在合适吗？','three-card-time'],
 ['我该不该辞职去创业？','two-paths'],
];
let seed=20261104;const rnd=()=>(seed=(seed*1664525+1013904223)>>>0)/4294967296;
let md='# 牌阵解读样例\n';
for(const [q,id] of QUESTIONS){const spread=findSpread(id);const deck=[...tarotCards].sort(()=>rnd()-.5);
 const drawn=spread.positions.map((position,i)=>({card:deck[i],isReversed:rnd()<.35,position}));
 const r=readSpread(q,spread,drawn);
 md+=`\n---\n\n## ${q||'（没写问题）'}\n\n${spread.name_zh} · 领域：${DOMAIN_LABEL[r.domain]} · 类型：${r.kind} · 关键词：${r.subject}${r.options?` · 选项：${r.options.join(' / ')}`:''}\n\n`;
 for(const n of r.notices)md+=`> ${n}\n\n`;
 md+=`**先说结论**　${r.headline}\n\n`;
 drawn.forEach((d,i)=>{md+=`- **${d.position.title} · ${d.card.name_zh}${d.isReversed?'逆位':'正位'}**　${r.cards[i].text}\n`});
 md+=`\n**连起来看**\n\n${r.flow.map(f=>`- ${f}`).join('\n')}\n\n**今天可以做的**\n\n${r.actions.map(a=>`- ${a}`).join('\n')}\n\n**晚上想想**　${r.reflection}\n`}
writeFileSync(process.argv[2]||'reading-samples.md',md);console.log('ok',QUESTIONS.length);
