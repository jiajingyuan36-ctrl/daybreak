import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseArgs,posterData,posterHtml,SAMPLES,WIDTH,HEIGHT} from '../scripts/build-xhs.mjs';

const cards=JSON.parse(readFileSync('src/data/tarot_cards_78.json','utf8'));
test('xhs CLI validates dates and orientations and uses the Shanghai day',()=>{
 assert.equal(parseArgs(['m0','正位'],new Date('2026-11-11T17:00:00Z')).date,'2026-11-12');
 assert.deepEqual(parseArgs(['m2','逆位','--date','2024-02-29']).cards,[['m2','reversed']]);
 assert.throws(()=>parseArgs(['m0','upright','--date','2026-02-29']),/Invalid date/);
 assert.throws(()=>parseArgs(['m0','sideways']),/Orientation/);
 assert.throws(()=>parseArgs(['m0','upright','--date']),/Missing value/);
 assert.throws(()=>parseArgs(['--samples','m0']),/cannot be combined/);
 assert.throws(()=>parseArgs(['m0','upright','--unknown']),/Unknown option/);
 assert.equal(new Set(SAMPLES.map(([id])=>id)).size,7);
 assert.equal(WIDTH,1242);assert.equal(HEIGHT,1660);
});
test('xhs copy for every card and orientation comes from the existing data',()=>{
 for(const card of cards)for(const orientation of ['upright','reversed']){
  const copy=posterData(cards,card.id,orientation,'2026-11-12');
  assert.equal(copy.name,card.name_zh);
  assert.deepEqual(copy.keywords,card[orientation].keywords.slice(0,3));
  assert.equal(copy.action,card.today_action);
  assert.equal('sources' in copy,false);assert.equal('image_url' in copy,false);
 }
 assert.throws(()=>posterData(cards,'../../secret','upright','2026-11-12'),/Unknown card ID/);
 assert.throws(()=>posterData([{...cards[0],today_action:'https://example.com'}],'m0','upright','2026-11-12'),/External promotion/);
});
test('xhs markup escapes copy, rotates only reversed art, and omits outbound metadata',()=>{
 const copy=posterData(cards,'m0','reversed','2026-11-12');
 const html=posterHtml({...copy,name:'<unsafe>&"'},'', 'data:image/webp;base64,AAAA');
 assert.ok(html.includes('class="art reversed"'));
 assert.ok(html.includes('&lt;unsafe&gt;&amp;&quot;'));
 assert.ok(html.includes('>逆位</span>'));
 assert.ok(html.includes(copy.action));
 assert.ok(!html.includes(cards[0].sources[0]));
 assert.doesNotMatch(html,/<(?:a|canvas|svg)\b|https?:\/\//);
});
