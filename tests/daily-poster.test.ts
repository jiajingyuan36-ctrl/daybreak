import assert from 'node:assert/strict';
import test from 'node:test';
import {wrapPosterText} from '../src/daily-poster.ts';

const measure=(text:string)=>[...text].length;

test('poster wrapping keeps Chinese brackets and punctuation with their text',()=>{
 assert.deepEqual(wrapPosterText('甲乙丙丁，戊（己庚）辛',4,measure),['甲乙丙','丁，戊','（己庚）','辛']);
});

test('poster wrapping preserves English words when they fit and splits oversized words',()=>{
 assert.deepEqual(wrapPosterText('DAYBREAK 晨启塔罗',8,measure),['DAYBREAK','晨启塔罗']);
 assert.deepEqual(wrapPosterText('DAYBREAK',4,measure),['DAYB','REAK']);
});
