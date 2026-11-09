import test from 'node:test';
import assert from 'node:assert/strict';
import {visitBucket,track} from '../src/track.ts';
test('visit buckets group return days without exact dates',()=>{
 assert.deepEqual([1,2,3,4,7,8,30,31].map(visitBucket),['1','2-3','2-3','4-7','4-7','8-30','8-30','30+']);
});
test('track is a no-op outside the browser and never throws',()=>{assert.doesNotThrow(()=>track('draw-done',{mode:'fan'}))});
