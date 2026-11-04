import test from 'node:test';import assert from 'node:assert/strict';
import {tarotCards} from '../src/lib/tarot-catalog.ts';
import {understand} from '../src/lib/reading-engine.ts';
import {LINES} from '../src/lib/reading-lines.ts';
const banned=/张力|反刍|课题|宇宙|能量|频率|高我|内在小孩|显化|二元对立|赋能|抓手|闭环|维度|场域|校准|这不是|允许自己|占卜|算命|注定|一定会|必然/;

// 100 个真实风格的问题，标注它属于哪个领域、是哪类问题（写多个表示几种理解都算对）。
// 「命中」= 领域和问题类型都读对，并且抽出了具体的话题（不是笼统的「这件事」）。
const EVAL:[string,string,string][]=[
 ['他还喜欢我吗','love','mind'],['我们会复合吗','love','will'],['暧昧对象是不是对我有意思','love','mind'],['我该不该主动联系前任','love','choice'],['这段感情还值得坚持吗','love','will|choice'],
 ['怎么让他更在乎我','love','how'],['为什么我总是遇不到对的人','love','why'],['我和男朋友最近老吵架怎么办','love','how'],['异地恋能坚持下去吗','love','will'],['今年能脱单吗','love','will'],
 ['他为什么突然冷淡了','love','why|mind'],['要不要跟他表白','love','choice'],['我们之间的问题出在哪','love','why'],['对方是怎么看我的','love','mind'],['结婚这件事要怎么跟家里谈','love|people','how'],
 ['我应该原谅他吗','love','choice'],['这段暧昧会有结果吗','love','will'],['他身边是不是有别人','love','mind'],['怎样走出失恋','love','how'],['我是不是太黏人了','love|self','open|focus'],
 ['这次面试能过吗','career','will'],['要不要换工作','career','choice'],['考研还是工作','career','choice'],['怎么和领导沟通','career','how'],['为什么工作总是不顺','career','why'],
 ['我适合做什么工作','career','focus|how|open'],['考公能上岸吗','career','will'],['实习要不要转正','career','choice'],['创业的时机到了吗','career','will'],['同事一直针对我怎么办','career','how'],
 ['期末考试能考好吗','career','will'],['论文什么时候能写完','career','will'],['我该怎么规划接下来一年的职业','career','how'],['老板会给我加薪吗','career','will'],['跳槽去大厂还是留在现在的公司','career','choice'],
 ['这个项目能顺利吗','career','will'],['我在工作中最该改进什么','career','focus'],['要不要出国留学','career','choice'],['为什么我学习总是坚持不下去','career','why'],['新工作怎么快速上手','career','how'],
 ['这个月能存下钱吗','wealth','will'],['我该怎么理财','wealth','how'],['为什么钱总是不够花','wealth','why'],['要不要买这个包','wealth','choice'],['投资会亏吗','wealth','will'],
 ['借钱给朋友好吗','wealth|people','will|choice'],['副业能赚到钱吗','wealth|career','will'],['怎么改掉乱花钱的习惯','wealth','how'],['什么时候经济能好转','wealth','will'],['要不要办分期','wealth','choice'],
 ['室友总是很吵怎么沟通','people','how'],['和闺蜜闹矛盾了怎么办','people','how'],['妈妈为什么总是不理解我','people','why'],['要不要和父母坦白','people','choice'],['朋友是不是在疏远我','people','mind'],
 ['怎么融入新的集体','people','how'],['家里人催婚怎么办','people|love','how'],['我和爸爸关系怎么改善','people','how'],['同学对我有意见吗','people','mind'],['要不要原谅背叛我的朋友','people','choice'],
 ['我最近为什么总是很累','self','why'],['怎样让自己更自信','self','how'],['这周我需要注意什么','self','focus'],['我的状态什么时候能好起来','self','will'],['怎么摆脱焦虑','self','how'],
 ['今天适合做什么','self','focus'],['我该坚持现在的生活方式吗','self','choice'],['怎么找到人生的方向','self','how'],['下个月运势怎么样','self','will'],['我要怎么面对现在的自己','self','how'],
 ['为什么我总是拖延','self','why'],['怎么调整作息','self','how'],['我是不是太敏感了','self','open|focus'],['新的一年我该专注什么','self','focus'],['现在的迷茫什么时候结束','self','will'],
 ['我和他到底合不合适','love','will|mind|focus'],['我和她还有可能吗','love','will'],['前任还爱我吗','love','mind'],['我该向他道歉吗','love','choice'],['他会回来找我吗','love','will'],
 ['怎么判断他是不是真心的','love','mind|how'],['我应该辞职吗','career','choice'],['面试官对我印象怎么样','career','mind'],['这份offer值得接吗','career','will|choice'],['我能考上研究生吗','career','will'],
 ['怎么平衡工作和生活','career|self','how'],['搬家的事怎么决定','self|wealth','how'],['要不要养猫','self','choice'],['我适合一个人生活吗','self','will'],['减肥能成功吗','self','will'],
 ['他在想什么','love','mind'],['我们的关系会怎样发展','love','will'],['和网友见面安全吗','love|people|self','open|will'],['怎么挽回他','love','how'],['为什么他不回我消息','love','why'],
 ['我需要换个城市生活吗','self','choice|will|open'],['考研和工作哪个更适合我','career','choice'],['怎么跟喜欢的人聊天','love','how'],['我这周的财运怎么样','wealth','will'],['今天适合表白吗','love','will'],
];

test('understands at least 90% of 100 real-style questions (topic, question type and subject)',()=>{
 const misses:string[]=[];
 for(const [q,d,k] of EVAL){const r=understand(q);const ok=d.split('|').includes(r.domain)&&k.split('|').includes(r.kind)&&r.subject!=='这件事';if(!ok)misses.push(`${q} → ${r.domain}/${r.kind}/${r.subject}`)}
 const rate=1-misses.length/EVAL.length;
 console.log(`问题理解命中率 ${(rate*100).toFixed(0)}%`+(misses.length?`；没读对：\n  ${misses.join('\n  ')}`:''));
 assert.equal(EVAL.length,100);assert.ok(rate>=.9,misses.join('\n'))});

test('every card has eight domain lines that read cleanly',()=>{
 const seen=new Set<string>();
 for(const c of tarotCards){const l=LINES[c.id];assert.ok(l&&l.length===8,c.id);
  for(const s of l){assert.ok(s.length>=6&&s.length<=40,`${c.id}: ${s}`);assert.doesNotMatch(s,banned,`${c.id}: ${s}`);assert.match(s,/[。！]$/,`${c.id}: ${s}`);assert.ok(!seen.has(s),`重复：${s}`);seen.add(s)}}});
