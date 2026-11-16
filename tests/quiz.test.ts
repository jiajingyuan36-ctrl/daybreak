import test from 'node:test';import assert from 'node:assert/strict';
import {QUIZ,QUIZ_RESULTS,QUIZ_WEIGHT,QUIZ_COVERED,scoreQuiz,isQuizCard} from '../src/quiz.ts';
import {cardById} from '../src/cards.ts';
import {cliches} from '../server/tone.mjs';
const len=(s:string)=>[...s].length;
test('quiz: 12 questions × 4 options, every option names two real major arcana',()=>{
 assert.equal(QUIZ.length,12);
 for(const q of QUIZ){assert.equal(q.options.length,4,q.q);for(const o of q.options){assert.equal(o.cards.length,2);assert.notEqual(o.cards[0],o.cards[1],o.text);for(const c of o.cards){assert.ok(isQuizCard(c),c);assert.equal(cardById(c).arcanaType,'major')}}}
});
test('quiz: all 22 major arcana have a result, each card appears 4–5 times in the options',()=>{
 assert.equal(Object.keys(QUIZ_RESULTS).length,22);
 for(let i=0;i<22;i++){const id='m'+i;assert.ok(QUIZ_RESULTS[id],id);assert.ok(QUIZ_WEIGHT[id]>=4&&QUIZ_WEIGHT[id]<=5,`${id} 出现 ${QUIZ_WEIGHT[id]} 次`)}
});
test('quiz: result copy lengths stay tight and the share line names the card',()=>{
 for(const [id,r] of Object.entries(QUIZ_RESULTS)){const n=cardById(id).nameZh;
  assert.ok(len(r.line)>=6&&len(r.line)<=18,`${id}.line ${len(r.line)}`);
  assert.ok(len(r.look)>=25&&len(r.look)<=70,`${id}.look ${len(r.look)}`);
  assert.ok(len(r.blind)>=10&&len(r.blind)<=30,`${id}.blind ${len(r.blind)}`);
  assert.ok(len(r.act)>=12&&len(r.act)<=40,`${id}.act ${len(r.act)}`);
  assert.ok(r.share.startsWith(`我是${n}：`),`${id}.share`);assert.ok(r.share.endsWith('你是哪一张？'),`${id}.share`)}
});
test('quiz: no AI-style stock phrases, hedging words or dashes anywhere in the quiz copy',()=>{
 const texts:[string,string][]=[];
 QUIZ.forEach((q,i)=>{texts.push([`Q${i+1}`,q.q]);q.options.forEach((o,j)=>texts.push([`Q${i+1}${'ABCD'[j]}`,o.text]))});
 for(const [id,r] of Object.entries(QUIZ_RESULTS))for(const [k,v] of Object.entries(r))texts.push([`${id}.${k}`,v]);
 for(const [w,t] of texts){assert.deepEqual(cliches(t),[],`${w}：${cliches(t).join('、')}`);assert.doesNotMatch(t,/可能|或许|也许|不妨|说不定|——/,w)}
});
test('quiz: scoring is deterministic and the 22 results come out evenly for random answers',()=>{
 const a=[0,1,2,3,0,1,2,3,0,1,2,3];assert.equal(scoreQuiz(a),scoreQuiz([...a]));
 let seed=12345;const rnd=()=>{seed=(seed*1103515245+12345)>>>0;return seed/2**32};
 const N=40000,cnt:Record<string,number>={};
 for(let k=0;k<N;k++){const ans=Array.from({length:12},()=>Math.floor(rnd()*4));const r=scoreQuiz(ans);cnt[r]=(cnt[r]||0)+1}
 assert.equal(Object.keys(cnt).length,22,'每种结果都测得出来');
 for(const [id,n] of Object.entries(cnt)){const p=n/N*100;assert.ok(p>=2.5&&p<=7,`${id} ${p.toFixed(1)}%`)}
});
test('quiz: always picking the same letter still lands on a valid card; covered cards are the nude ones',()=>{
 for(let o=0;o<4;o++)assert.ok(isQuizCard(scoreQuiz(Array(12).fill(o))));
 assert.deepEqual([...QUIZ_COVERED].sort(),['m15','m17','m19','m20','m21','m6'].sort());
});
