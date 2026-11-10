import test from 'node:test';
import assert from 'node:assert/strict';
import {setPendingAsk,peekPendingAsk,clearPendingAsk} from '../src/pending-ask.ts';
const mem=()=>{const m=new Map<string,string>();return {getItem:(k:string)=>m.get(k)??null,setItem:(k:string,v:string)=>{m.set(k,v)},removeItem:(k:string)=>{m.delete(k)}}};
test('首页带来的问题：存、读、清', ()=>{const s=mem();assert.equal(peekPendingAsk(s),'');assert.ok(setPendingAsk('  要不要换工作？ ',s));assert.equal(peekPendingAsk(s),'要不要换工作？');clearPendingAsk(s);assert.equal(peekPendingAsk(s),'')});
test('没有 sessionStorage 或它报错时不出错', ()=>{const bad={getItem(){throw Error()},setItem(){throw Error()},removeItem(){throw Error()}};assert.equal(setPendingAsk('x',bad),false);assert.equal(peekPendingAsk(bad),'');clearPendingAsk(bad);assert.equal(peekPendingAsk(null),'')});
