import test from 'node:test';import assert from 'node:assert/strict';
import {tarotCards,findSpread,visibleSpreads} from '../src/lib/tarot-catalog.ts';
import {understand,readSpread,tone,DOMAIN_LABEL,type Domain} from '../src/lib/reading-engine.ts';
import {LINES} from '../src/lib/reading-lines.ts';
// 与 plain.test.ts 相同的禁用词，再加上不该出现的预测口吻
const banned=/张力|反刍|课题|宇宙|能量|频率|高我|内在小孩|显化|二元对立|赋能|抓手|闭环|维度|场域|校准|占卜|算命|注定|一定会|必然/;
const broken=/undefined|NaN|null|「」|\[object/;

test('understands the domain, kind and subject of common questions',()=>{
 const cases:[string,Domain,string,string][]=[
  ['我可以怎样改善和他的沟通？','love','how','沟通'],
  ['换工作这件事，我最该先弄清什么？','career','focus','换工作'],
  ['为什么我总是存不下钱？','wealth','why','总是存不下钱'],
  ['我和妈妈最近总吵架，怎么办？','people','how','和妈妈最近总吵架'],
  ['我和前任还会复合吗？','love','will','复合'],
  ['老板对我是什么态度？','career','mind','你和老板'],
  ['他到底喜不喜欢我？','love','mind','你们的关系'],
  ['我跟她有结果么','love','will','你们的关系'],
  ['我们会走到最后么','love','will','你们的关系'],
  ['我们能在一起吗','love','will','你们的关系'],
  ['接下来半年，我会遇到喜欢的人吗？','love','will','遇到喜欢的人'],
  ['这周我最需要留意什么？','self','focus','这周']];
 for(const [q,domain,kind,subject] of cases){const r=understand(q);assert.equal(r.domain,domain,q);assert.equal(r.kind,kind,q);assert.equal(r.subject,subject,q)}
 assert.deepEqual(understand('留在北京还是回老家？').options,['留在北京','回老家']);
 assert.deepEqual(understand('我该不该辞职去创业？').options,['辞职去创业','先不动']);
 assert.equal(understand('').subject,'今天');
 assert.match(understand('最近不想活了').notices.join(),/12356/);
 assert.match(understand('该买哪只股票').notices.join(),/专业人士/)});

test('every card, both orientations, every position and every domain reads completely',()=>{
 for(const spread of visibleSpreads)for(const domain of Object.keys(DOMAIN_LABEL) as Domain[])for(let s=0;s<tarotCards.length;s++)for(const rev of [false,true]){
  const drawn=spread.positions.map((position,i)=>({card:tarotCards[(s+i*7)%tarotCards.length],isReversed:i===0?rev:(s+i)%3===0,position}));
  const r=readSpread('换工作这件事，我最该先弄清什么？',spread,drawn,domain);
  const all=[r.headline,...r.cards.map(c=>c.text),...r.flow,...r.actions,r.reflection];
  for(const t of all){assert.ok(t.length>4,`${spread.id}: 空句`);assert.doesNotMatch(t,broken,`${spread.id}/${domain}: ${t}`);assert.doesNotMatch(t,banned,`${spread.id}/${domain}: ${t}`)}
  assert.equal(r.cards.length,drawn.length);assert.ok(r.actions.length>=1,spread.id);assert.ok(r.flow.length>=1,spread.id)}});

test('the answer keeps coming back to the question',()=>{
 const spread=findSpread('three-card-state');const drawn=spread.positions.map((position,i)=>({card:tarotCards[i*11],isReversed:false,position}));
 const r=readSpread('换工作这件事，我最该先弄清什么？',spread,drawn);
 assert.match(r.headline,/「换工作」/);assert.match(r.reflection,/「换工作」/);
 // 阻碍位的牌，接的是它在「学业工作」里的那句，而不是通用牌义
 assert.ok(r.cards[1].text.includes(LINES[drawn[1].card.id][1]),r.cards[1].text);
 // 问「怎么做」，结论第一句直接给出第一步
 assert.match(r.answer,/^关于「换工作」|最需要留意/)});

test('direct answers follow the kind of question',()=>{
 const spread=findSpread('three-card-time');const drawn=spread.positions.map((position,i)=>({card:tarotCards[i*9+3],isReversed:false,position}));
 assert.match(readSpread('我跟她有结果么',spread,drawn).answer,/^关于「你们的关系」，.+最关键的一张是/);
 const state=findSpread('three-card-state');const d3=state.positions.map((position,i)=>({card:tarotCards[i*13+2],isReversed:i===1,position}));
 assert.match(readSpread('为什么我总是存不下钱',state,d3).answer,/多半卡在/);
 assert.match(readSpread('怎么和领导沟通',state,d3).answer,/第一步|先别急着找办法/);
 assert.match(readSpread('他还喜欢我吗',state,d3).answer,/牌不读别人的心/)});

test('tone: hard cards soften when reversed, kind cards get blocked',()=>{
 const card=(id:string)=>tarotCards.find(c=>c.id===id)!;
 assert.ok(tone({card:card('m19'),isReversed:false})>0);assert.ok(tone({card:card('m19'),isReversed:true})<0);
 assert.ok(tone({card:card('swords-3'),isReversed:false})<0);assert.ok(tone({card:card('swords-3'),isReversed:true})>0)});
