import test from 'node:test';import assert from 'node:assert/strict';
import {ZODIAC,PLANET_CARD} from '../src/zodiac.ts';
import {cardAstro,birthSign} from '../src/astro.ts';

test('twelve signs in zodiac order',()=>{assert.equal(ZODIAC.length,12);assert.deepEqual(ZODIAC.map(z=>z.sign.zh).slice(0,4),['白羊座','金牛座','双子座','巨蟹座'])});

test('each sign maps to its Golden Dawn major and ruler card',()=>{
 const majors={aries:'m4',taurus:'m5',gemini:'m6',cancer:'m7',leo:'m8',virgo:'m9',libra:'m11',scorpio:'m13',sagittarius:'m14',capricorn:'m15',aquarius:'m17',pisces:'m18'} as Record<string,string>;
 for(const z of ZODIAC){assert.equal(z.major,majors[z.sign.id],z.sign.id);assert.equal(cardAstro(z.rulerCard)!.label.split(' ')[0],z.sign.ruler,z.sign.id)}
 assert.equal(PLANET_CARD.火星,'m16');assert.equal(PLANET_CARD.土星,'m21')});

test('three decan cards per sign, all in that sign',()=>{
 const seen=new Set<string>();for(const z of ZODIAC){assert.equal(z.decans.length,3);for(const d of z.decans){assert.ok(d.label.endsWith(z.sign.zh),`${d.id} ${d.label}`);seen.add(d.id)}}
 assert.equal(seen.size,36);assert.equal(ZODIAC[0].decans[0].title,'Lord of Dominion · 统御之主')});

test('classical qualities',()=>{const by=(id:string)=>ZODIAC.find(z=>z.sign.id===id)!;
 assert.equal(by('aries').polarity,'阳性');assert.equal(by('taurus').polarity,'阴性');assert.equal(by('aries').exalted,'太阳');assert.equal(by('gemini').exalted,undefined);
 // 日期范围的中间日期，算出来的太阳星座应当就是这个星座
 for(const z of ZODIAC){const m=/^(\d+)月(\d+)日/.exec(z.dates)!;const d=new Date(2026,Number(m[1])-1,Number(m[2])+10,12);assert.equal(birthSign(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`)!.id,z.sign.id,z.sign.id)}});
