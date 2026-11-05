import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
const {DEEP_READING}=await import('../src/site.ts');
const read=(p:string)=>readFile(new URL(`../${p}`,import.meta.url),'utf8');

test('deep reading: tiers by spread size, real WeChat contact, refund rules present',()=>{
 assert.deepEqual(DEEP_READING.tiers.map(t=>t.cards),[1,3,10]);
 for(const t of DEEP_READING.tiers){assert.ok(t.name&&t.fit.length>=10,t.name);assert.equal(typeof t.price,'string')}
 assert.ok(DEEP_READING.contact.some(c=>c.label==='微信'&&c.value));
 assert.ok(DEEP_READING.refund.length>=3&&DEEP_READING.refund.some(r=>r.includes('全额退款')));
 assert.equal(DEEP_READING.payment,'微信转账');
});

test('terms, privacy and the deep page say the same thing about paying',async()=>{
 const terms=await read('app/terms/page.tsx'),privacy=await read('app/privacy/page.tsx'),deep=await read('app/deep/page.tsx');
 assert.doesNotMatch(terms,/目前所有功能都免费/,'条款不能再写“全部免费”');
 for(const w of ['深度解读','微信转账','全额退款','不预测','未满 18 岁','/deep/'])assert.ok(terms.includes(w),`条款缺：${w}`);
 assert.ok(privacy.includes('微信转账')&&privacy.includes('不收集任何支付信息'));
 for(const w of ['未满 18 岁','第三者','改运','D.refund','D.tiers'])assert.ok(deep.includes(w),`深度解读页缺：${w}`);
 // 付费页不能出现预测、改运承诺或玄学用语
 assert.doesNotMatch(deep.replace(/不做改运、转运、化解/,''),/一定会|保证会|注定|改运|转运|开光|能量|宇宙/);
});
