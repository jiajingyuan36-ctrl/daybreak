import test from 'node:test';import assert from 'node:assert/strict';
import * as Astronomy from 'astronomy-engine';
import {cardAstro,sunLongitude,moonLongitude,signAt,birthSign,resonance,SIGNS} from '../src/astro.ts';
import {cards} from '../src/cards.ts';

test('every one of the 78 cards has a correspondence',()=>{for(const c of cards)assert.ok(cardAstro(c.id),c.id)});

test('majors follow the Golden Dawn attributions',()=>{
 assert.equal(cardAstro('m17')!.label,'水瓶座 ♒');assert.equal(cardAstro('m4')!.label,'白羊座 ♈');
 assert.equal(cardAstro('m16')!.label,'火星 ♂');assert.equal(cardAstro('m0')!.label,'风元素');assert.equal(cardAstro('m21')!.label,'土星 ♄')});

test('pip decans run in Chaldean order from Mars in Aries',()=>{
 // 迦勒底序：土木火日金水月，循环；白羊第一旬从火星开始，沿黄道走完 36 旬。
 // 牌组跟星座元素走，基本/固定/变动星座分别是 2–4、5–7、8–10。
 const order=['土星','木星','火星','太阳','金星','水星','月亮'];const suitOf={火:'wands',土:'pentacles',风:'swords',水:'cups'} as const;const base={基本:2,固定:5,变动:8} as const;
 for(let i=0;i<36;i++){const sign=SIGNS[Math.floor(i/3)];const id=`${suitOf[sign.element]}-${base[sign.mode]+i%3}`;
  assert.equal(cardAstro(id)!.label,`${order[(2+i)%7]}在${sign.zh}`,id)}});

test('aces and courts carry only their element',()=>{assert.equal(cardAstro('cups-1')!.kind,'ace');assert.equal(cardAstro('swords-14')!.signs.length,0)});

test('sun and moon signs agree with Astronomy Engine',()=>{
 let checked=0;for(let i=0;i<600;i++){const d=new Date(Date.UTC(2000,0,1)+i*29.3*86400000+i*3600000);
  const sun=Astronomy.SunPosition(d).elon,moon=Astronomy.EclipticGeoMoon(d).lon;
  const ds=Math.abs(((sunLongitude(d)-sun+540)%360)-180),dm=Math.abs(((moonLongitude(d)-moon+540)%360)-180);
  assert.ok(ds<0.05,`sun ${d.toISOString()} off by ${ds}`);assert.ok(dm<0.7,`moon ${d.toISOString()} off by ${dm}`);
  if(sun%30>0.1&&sun%30<29.9)assert.equal(signAt(sunLongitude(d)).id,signAt(sun).id);
  if(moon%30>0.8&&moon%30<29.2){assert.equal(signAt(moonLongitude(d)).id,signAt(moon).id);checked++}}
 assert.ok(checked>500)});

test('birth sign and resonance',()=>{
 assert.equal(birthSign('2008-03-10')!.zh,'双鱼座');assert.equal(birthSign('2008-08-01')!.zh,'狮子座');assert.equal(birthSign('bad'),null);
 const pisces=SIGNS[11];assert.match(resonance(cardAstro('m18')!,pisces,SIGNS[0]).join(''),/双鱼座/);
 assert.deepEqual(resonance(cardAstro('m4')!,pisces,SIGNS[5]),[])});
