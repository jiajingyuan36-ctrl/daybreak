import test from 'node:test';import assert from 'node:assert/strict';
import {pairReading,signDistance,signById} from '../src/synastry.ts';
import {SIGNS} from '../src/astro.ts';
const s=(id:string)=>signById(id)!;
const text=(a:string,b:string)=>{const r=pairReading(s(a),s(b));return [r.one,...r.base,...r.classical,...r.stuck,...r.tips].join('')};

test('distance and classical aspect names',()=>{
 assert.equal(signDistance(s('aries'),s('libra')),6);assert.equal(signDistance(s('pisces'),s('aries')),1);
 assert.equal(pairReading(s('aries'),s('leo')).tag,'三合 · 120°');assert.equal(pairReading(s('aries'),s('gemini')).tag,'六合 · 60°');
 assert.equal(pairReading(s('aries'),s('cancer')).tag,'四分 · 90°');assert.equal(pairReading(s('aries'),s('libra')).tag,'对冲 · 180°');
 assert.equal(pairReading(s('aries'),s('virgo')).tag,'相隔 · 150°');assert.equal(pairReading(s('aries'),s('aries')).tag,'同一个星座')});

test('every one of the 78 pairs reads differently, with no scores or verdicts',()=>{
 const seen=new Map<string,string>();
 for(let i=0;i<12;i++)for(let j=i;j<12;j++){const a=SIGNS[i],b=SIGNS[j],r=pairReading(a,b);
  // 去掉星座名再比，确保不同组合的内容本身不同
  const body=[...r.base,...r.classical,...r.stuck,...r.tips].join('').replace(/[一-鿿]{2}座/g,'');
  assert.ok(!seen.has(body),`${a.id}-${b.id} same as ${seen.get(body)}`);seen.set(body,`${a.id}-${b.id}`);
  const all=[r.one,body].join('');assert.ok(r.base.length===2&&r.classical.length>=1&&r.tips.length===2,`${a.id}-${b.id}`);assert.doesNotMatch(all,/\d+ ?分|不合|配对指数|注定|undefined/)}
 assert.equal(seen.size,78)});

test('Ptolemy relations and dignities',()=>{
 assert.match(text('aries','libra'),/彼此看得见/);assert.match(text('aries','libra'),/火星在天秤座是「陷」/);assert.match(text('aries','libra'),/金星在白羊座是「陷」/);
 assert.match(text('pisces','taurus'),/命令与服从.*金牛座在春夏一侧带头/);assert.match(text('taurus','pisces'),/你的守护星金星在双鱼座是「入旺」/);
 assert.match(text('cancer','capricorn'),/月亮在摩羯座是「陷」/);assert.match(text('gemini','virgo'),/共用一颗守护星水星/);
 assert.match(text('leo','aries'),/TA 的守护星火星|你的守护星太阳在白羊座是「入旺」/);
 // 两组截图里的三合，现在内容不同
 assert.notEqual(pairReading(s('aquarius'),s('gemini')).base.join(''),pairReading(s('virgo'),s('capricorn')).base.join(''))});
