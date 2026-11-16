import test from 'node:test';import assert from 'node:assert/strict';
import {CARD_DEEP} from '../src/card-deep.ts';
import {cards,cardById} from '../src/cards.ts';
import {cliches} from '../server/tone.mjs';
const len=(s:string)=>[...s].length;
const inRange=(s:string,a:number,b:number,w:string)=>assert.ok(len(s)>=a&&len(s)<=b,`${w} 长度 ${len(s)}（要 ${a}–${b}）`);
test('card deep: every major arcana is written (minors come suit by suit), ids are real cards',()=>{
 for(const c of cards.filter(c=>c.arcanaType==='major'))assert.ok(CARD_DEEP[c.id],`${c.id} ${c.nameZh} 还没写`);
 for(const id of Object.keys(CARD_DEEP))assert.ok(cardById(id),id);
});
test('card deep: section lengths stay readable',()=>{
 for(const [id,d] of Object.entries(CARD_DEEP)){
  d.love.forEach((t,i)=>inRange(t,20,80,`${id}.love${i}`));d.work.forEach((t,i)=>inRange(t,20,80,`${id}.work${i}`));
  assert.ok(['是','否','先等等'].includes(d.yes),id);inRange(d.yesWhy,6,50,`${id}.yesWhy`);assert.ok(d.yesWhy.startsWith(d.yes==='否'?'偏否':d.yes==='是'?(d.yesWhy.startsWith('是')?'是':'偏是'):'先等等'),`${id}.yesWhy 开头要和 yes 一致`);
  assert.ok(d.misread.length>=1&&d.misread.length<=3,id);d.misread.forEach(([a,b],i)=>{inRange(a,4,24,`${id}.misread${i}.误读`);inRange(b,12,70,`${id}.misread${i}.其实`)});
  assert.ok(d.faq.length>=2&&d.faq.length<=4,id);d.faq.forEach(([q,a],i)=>{inRange(q,6,36,`${id}.faq${i}.q`);assert.ok(q.endsWith('？'),`${id}.faq${i} 问题要以问号结尾`);inRange(a,16,90,`${id}.faq${i}.a`)});
 }
});
test('card deep: reader voice — no stock phrases, hedging words, dashes, and no repeated sentences across cards',()=>{
 const seen=new Map<string,string>();
 for(const [id,d] of Object.entries(CARD_DEEP)){
  const texts:[string,string][]=[['love0',d.love[0]],['love1',d.love[1]],['work0',d.work[0]],['work1',d.work[1]],['yesWhy',d.yesWhy],...d.misread.flatMap(([a,b],i)=>[[`mis${i}a`,a],[`mis${i}b`,b]] as [string,string][]),...d.faq.flatMap(([q,a],i)=>[[`faq${i}q`,q],[`faq${i}a`,a]] as [string,string][])];
  for(const [k,t] of texts){assert.deepEqual(cliches(t),[],`${id}.${k}：${cliches(t).join('、')}`);assert.doesNotMatch(t,/可能|或许|也许|不妨|说不定|注定|一定会|——/,`${id}.${k}`);
   if(/^(love|work)/.test(k)){assert.ok(!seen.has(t),`${id}.${k} 和 ${seen.get(t)} 重复`);seen.set(t,`${id}.${k}`)}}
 }
});
