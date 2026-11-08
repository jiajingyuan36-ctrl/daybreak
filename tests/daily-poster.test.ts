import assert from 'node:assert/strict';
import test from 'node:test';
import {wrapPosterText} from '../src/daily-poster.ts';
import {cards} from '../src/cards.ts';
import {posterHeadline} from '../src/poster-copy.ts';

const measure=(text:string)=>[...text].length;

test('poster wrapping keeps Chinese brackets and punctuation with their text',()=>{
 assert.deepEqual(wrapPosterText('甲乙丙丁，戊（己庚）辛',4,measure),['甲乙丙','丁，戊','（己庚）','辛']);
});

test('poster wrapping preserves English words when they fit and splits oversized words',()=>{
 assert.deepEqual(wrapPosterText('DAYBREAK 晨启塔罗',8,measure),['DAYBREAK','晨启塔罗']);
 assert.deepEqual(wrapPosterText('DAYBREAK',4,measure),['DAYB','REAK']);
});

test('all 78 cards have distinct headlines that fit the two-line share cover',()=>{
 const headlines=cards.map(posterHeadline);
 assert.equal(new Set(headlines.map(lines=>lines.join(''))).size,78);
 assert(headlines.every(lines=>lines.every(line=>line.length>0&&line.length<=10)));
});
