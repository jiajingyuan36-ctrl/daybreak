import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {cards} from '../src/cards.ts';
// 每张牌都要有自己的分享图；新增或改 ID 后运行 scripts/build-card-og.mjs 重新生成
test('every card has its own share image',()=>{
 const missing=cards.filter(c=>!existsSync(`public/og/cards/${c.id}.jpg`)).map(c=>c.id);
 assert.deepEqual(missing,[]);
});
