import test from 'node:test';import assert from 'node:assert/strict';import {plainById,plainIds} from '../src/plain.ts';import {cards,cardById} from '../src/cards.ts';import {briefReading} from '../src/share.ts';import {fresh,validate} from '../src/storage.ts';import {draw} from '../src/engine.ts';
const len=(s:string)=>[...s].length;
const banned=/张力|反刍|课题|宇宙|能量|频率|高我|内在小孩|显化|二元对立|赋能|抓手|闭环|维度|场域|校准|未必增加信息|系统性|这不是|允许自己|去拥抱|快节奏|值得记住的细节/;
const fields=(id:string)=>{const p=plainById(id);return {intro:p.plainIntro,upright:p.dailyReading.upright,reversed:p.dailyReading.reversed,love:p.lifeAspects.love,work:p.lifeAspects.work,money:p.lifeAspects.money,action:p.todayAction,question:p.eveningQuestion}};
test('every one of the 78 card ids has its own plain-language entry',()=>{assert.deepEqual([...plainIds()].sort(),cards.map(c=>c.id).sort());for(const c of cards){assert.equal(c.plainIntro,plainById(c.id).plainIntro);assert.equal(c.reflectionPrompt,plainById(c.id).eveningQuestion)}});
test('plain copy stays within the agreed lengths',()=>{const range={intro:[30,70],upright:[40,115],reversed:[40,115],love:[20,50],work:[20,50],money:[20,50],action:[15,45],question:[15,32]} as const;for(const id of plainIds())for(const [k,v] of Object.entries(fields(id))){const [min,max]=range[k as keyof typeof range];assert.ok(len(v)>=min&&len(v)<=max,`${id}.${k} 长度 ${len(v)}`)}});
test('no jargon, template phrasing or recycled sentences',()=>{const seen=new Map<string,string>();for(const id of plainIds()){const p=plainById(id);assert.equal(p.keywordsUpright.length,3,id);assert.equal(p.keywordsReversed.length,3,id);assert.notDeepEqual(p.keywordsUpright,p.keywordsReversed);for(const [k,v] of Object.entries(fields(id))){assert.doesNotMatch(v,banned,`${id}.${k}`);if(k==='love'||k==='work'||k==='money')continue;assert.ok(!seen.has(v),`${id}.${k} 与 ${seen.get(v)} 重复`);seen.set(v,`${id}.${k}`)}}});
// 2026-11-11 全站改成「占卜师」语气（用户要求：简洁、干净、不讨好），早期需求里逐字指定的两句文案随之改写，只保留关键词的逐字检查
test('requirement examples are kept verbatim',()=>{assert.deepEqual(plainById('pentacles-3').keywordsUpright,['配合默契','把活做好','互相搭把手'])});
test('share images get a short reading that is a prefix of the full one',()=>{for(const c of cards)for(const full of [c.meaningUpright,c.meaningReversed]){const b=briefReading(full);assert.ok(full.startsWith(b));assert.ok(len(b)>=20&&len(b)<=75,`${c.id} ${len(b)}`)}});
test('history saved before the rewrite still loads and shows the new copy',()=>{const d=fresh();d.days['2026-10-01']={...draw('2026-10-01',d.preferences,'','',()=>0),cardId:'swords-9',reversed:true,reading:{title:'宝剑九 · 逆位',message:'反复思考未必增加信息，把担忧暂时放到纸上。',personal:'',action:'写下担忧与明天能做的一步，然后收起纸。',observe:'',question:'关于忧虑，今天有什么值得记住的细节？',quote:''},review:{resonance:'有一点共鸣',note:'睡得早了一点'}};const back=validate(JSON.parse(JSON.stringify(d)));const day=back.days['2026-10-01'];assert.equal(day.review?.note,'睡得早了一点');const c=cardById(day.cardId);assert.equal(c.meaningReversed,plainById('swords-9').dailyReading.reversed);assert.doesNotMatch(c.reflectionPrompt,banned)});

test('big dipper spread copy: seven positions named after the stars, plain lengths, no jargon or repeats',async()=>{
 const {DIPPER_SPREAD}=await import('../src/dipper-copy.ts');const {findSpread}=await import('../src/lib/tarot-catalog.ts');
 assert.deepEqual(DIPPER_SPREAD.positions.map(p=>p[0]),['天枢','天璇','天玑','天权','玉衡','开阳','摇光']);
 const s=findSpread('big-dipper');assert.equal(s.positions.length,7);assert.ok(!s.hidden);assert.ok(!s.sourceUrl,'site-designed spread must not claim a source');assert.match(s.sourceNote??'',/本站自己设计/);
 const seen=new Set<string>();
 for(const [title,meaning] of DIPPER_SPREAD.positions){assert.ok(len(meaning)>=18&&len(meaning)<=40,`${title}: ${len(meaning)}`);assert.doesNotMatch(meaning,banned,title);assert.ok(!seen.has(meaning),title);seen.add(meaning)}
 for(const t of [DIPPER_SPREAD.description,DIPPER_SPREAD.note])assert.doesNotMatch(t,banned)});

test('mood leads: every mood × card group has its own plain line and a full section order',async()=>{
 const {MOOD_LEAD,MOOD_ORDER,moodLead}=await import('../src/mood-copy.ts');const {moods}=await import('../src/engine.ts');
 assert.deepEqual(Object.keys(MOOD_LEAD).sort(),[...moods].sort());assert.deepEqual(Object.keys(MOOD_ORDER).sort(),[...moods].sort());
 const seen=new Set<string>();
 for(const m of moods){assert.deepEqual([...MOOD_ORDER[m]].sort(),['action','intro','reading'],m);
  for(const g of ['major','权杖','圣杯','宝剑','星币'] as const){const t=MOOD_LEAD[m][g];assert.ok(len(t)>=25&&len(t)<=50,`${m}/${g}: ${len(t)}`);assert.doesNotMatch(t,banned,`${m}/${g}`);assert.ok(!seen.has(t),`${m}/${g}`);seen.add(t)}}
 // 每张牌都能找到开场白；没选心情、或旧记录里的心情不认识时不显示
 for(const m of moods)for(const c of cards)assert.ok(moodLead(m,c)?.text,`${m} ${c.id}`);
 assert.equal(moodLead('',cards[0]),null);assert.equal(moodLead('开心',cards[0]),null)});

test('card history: earlier draws of the same card, newest first, notes trimmed',async()=>{
 const {pastDraws,noteExcerpt,shortDate}=await import('../src/card-history.ts');const d=fresh();
 const mk=(date:string,cardId:string,note?:string)=>{d.days[date]={...draw(date,d.preferences,'','',()=>0),cardId,...(note?{review:{resonance:'有一点共鸣',note}}:{})}};
 mk('2026-08-01','cups-2');mk('2026-09-03','cups-2','今晚和朋友吃了饭');mk('2026-09-10','wands-3');mk('2026-11-04','cups-2');mk('2026-11-05','cups-2');
 const past=pastDraws(d.days,'cups-2','2026-11-04');assert.deepEqual(past.map(x=>x.date),['2026-09-03','2026-08-01']);
 assert.equal(pastDraws(d.days,'wands-3','2026-09-10').length,0);
 assert.equal(noteExcerpt('一'.repeat(50)),'一'.repeat(40)+'…');assert.equal(noteExcerpt(' 短 句 '),'短 句');
 assert.equal(shortDate('2026-09-03','2026-11-04'),'9 月 3 日');assert.equal(shortDate('2025-12-31','2026-11-04'),'2025 年 12 月 31 日')});

// 「AI 味」套话：网页文案一句都不能有（清单在 server/tone.mjs，和 AI 回答共用）
import {cliches} from '../server/tone.mjs';
import {MOOD_LEAD as MOODS} from '../src/mood-copy.ts';
import {DIPPER_SPREAD as DIPPER} from '../src/dipper-copy.ts';
test('no AI-style stock phrases (别慌、你值得、比想象中更…) in any site copy',()=>{
 const texts:[string,string][]=[];
 for(const id of plainIds())for(const [k,v] of Object.entries(fields(id)))texts.push([`${id}.${k}`,v]);
 for(const [m,g] of Object.entries(MOODS))for(const [k,v] of Object.entries(g as Record<string,string>))texts.push([`mood.${m}.${k}`,v]);
 for(const [t,v] of DIPPER.positions)texts.push([`dipper.${t}`,v]);
 for(const [where,t] of texts){const hit=cliches(t,{dash:false});assert.deepEqual(hit,[],`${where}：${hit.join('、')}`)}
});
