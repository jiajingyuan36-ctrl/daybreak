import test from 'node:test';import assert from 'node:assert/strict';
import {pairReading,signDistance,signById} from '../src/synastry.ts';
import {SIGNS} from '../src/astro.ts';
const s=(id:string)=>signById(id)!;

test('distance and classical aspect names',()=>{
 assert.equal(signDistance(s('aries'),s('libra')),6);assert.equal(signDistance(s('pisces'),s('aries')),1);
 assert.equal(pairReading(s('aries'),s('leo')).tag,'三合 · 120°');assert.equal(pairReading(s('aries'),s('gemini')).tag,'六合 · 60°');
 assert.equal(pairReading(s('aries'),s('cancer')).tag,'四分 · 90°');assert.equal(pairReading(s('aries'),s('libra')).tag,'对冲 · 180°');
 assert.equal(pairReading(s('aries'),s('virgo')).tag,'相隔 · 150°');assert.equal(pairReading(s('aries'),s('aries')).tag,'同一个星座')});

test('every pair reads well in both orders, no scores or verdicts',()=>{
 for(const a of SIGNS)for(const b of SIGNS){const r=pairReading(a,b),q=pairReading(b,a);assert.equal(r.tag,q.tag);assert.equal(r.one,q.one);
  const all=[r.one,r.base,r.stuck,...r.tips].join('');assert.ok(r.base.length>10&&r.tips.length===2,`${a.id}-${b.id}`);assert.doesNotMatch(all,/\d+ ?分|不合|配对指数|注定|undefined/)}});

test('trines share an element, sextiles complement',()=>{
 assert.match(pairReading(s('taurus'),s('virgo')).base,/都是土象/);assert.match(pairReading(s('aries'),s('aquarius')).base,/火和风/);
 assert.match(pairReading(s('aries'),s('libra')).base,/金星和火星/)});
