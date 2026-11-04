import test from 'node:test';import assert from 'node:assert/strict';
import {Body,DefineStar,Equator,Horizon,Observer} from 'astronomy-engine';
import {DIPPER,POLARIS,ALCOR,BACKGROUND,dipperSky,duskSky,seasonOf,bearingLabel,polarAngle,pointerAngle,rotate,slotAngle,turnTo,horizonLine,CHART_RADIUS} from '../src/lib/dipper.ts';
import {dipperDraw} from '../src/lib/dipper-draw.ts';
import {cards} from '../src/cards.ts';
import {randomInteger} from '../src/random.ts';

const BEIJING=[39.9042,116.4074] as const;
const rad=Math.PI/180;
/** 独立的对照：astronomy-engine 的 DefineStar + Equator（真赤道、含光行差）+ Horizon */
function reference(star:{ra:number;dec:number},date:Date,lat:number,lon:number){DefineStar(Body.Star1,star.ra/15,star.dec,1000);const obs=new Observer(lat,lon,0);const eq=Equator(Body.Star1,date,obs,true,true);const h=Horizon(date,obs,eq.ra,eq.dec,'');return {alt:h.altitude,az:h.azimuth}}
const angDiff=(a:number,b:number)=>Math.abs(((a-b)%360+540)%360-180);

test('dipperSky: altitude and azimuth of Dubhe and Alkaid agree with astronomy-engine DefineStar/Horizon within 0.5°',()=>{
 for(const iso of ['2026-01-01T21:00:00+08:00','2026-07-01T21:00:00+08:00','2026-04-15T04:30:00+08:00']){
  const d=new Date(iso),sky=dipperSky(d,...BEIJING);
  for(const i of [0,6]){const me=sky.stars[i],ref=reference(DIPPER[i],d,...BEIJING);
   assert.ok(Math.abs(me.alt-ref.alt)<0.5,`${iso} ${DIPPER[i].en} alt ${me.alt} vs ${ref.alt}`);assert.ok(angDiff(me.az,ref.az)<0.5,`${iso} ${DIPPER[i].en} az ${me.az} vs ${ref.az}`)}}});

test('catalog: seven dipper stars in order, Alcor and Polaris, background stars real and within the chart',()=>{
 assert.deepEqual(DIPPER.map(s=>s.zh),['天枢','天璇','天玑','天权','玉衡','开阳','摇光']);
 assert.deepEqual(DIPPER.map(s=>s.order),[1,2,3,4,5,6,7]);
 assert.equal(ALCOR.en,'Alcor');assert.ok(POLARIS.dec>89);
 assert.ok(BACKGROUND.length>=60&&BACKGROUND.length<=150,`background ${BACKGROUND.length}`);
 for(const [hr,ra,dec,v] of BACKGROUND){assert.ok(hr>0&&ra>=0&&ra<360&&dec>=40&&dec<=90&&v<=4.5,`HR ${hr}`)}
 assert.equal(new Set(BACKGROUND.map(s=>s[0])).size,BACKGROUND.length,'no duplicate HR numbers')});

test('geometry: Polaris lies within 3° of the line through the pointers (Merak → Dubhe), on the sky and on the chart',()=>{
 const v=(ra:number,de:number)=>[Math.cos(de*rad)*Math.cos(ra*rad),Math.cos(de*rad)*Math.sin(ra*rad),Math.sin(de*rad)];
 const [D,M,P]=[v(DIPPER[0].ra,DIPPER[0].dec),v(DIPPER[1].ra,DIPPER[1].dec),v(POLARIS.ra,POLARIS.dec)];
 const n=[M[1]*D[2]-M[2]*D[1],M[2]*D[0]-M[0]*D[2],M[0]*D[1]-M[1]*D[0]],len=Math.hypot(...n);
 const miss=Math.asin(Math.abs((n[0]*P[0]+n[1]*P[1]+n[2]*P[2])/len))/rad;
 assert.ok(miss<3,`great-circle miss ${miss.toFixed(2)}°`);
 // 星图上：北极星到天璇—天枢直线的距离，换回角度
 const s=dipperSky(new Date('2026-03-01T21:00:00+08:00'),...BEIJING),[d,m,p]=[s.stars[0],s.stars[1],s.polaris];
 const dist=Math.abs((d.x-m.x)*(m.y-p.y)-(m.x-p.x)*(d.y-m.y))/Math.hypot(d.x-m.x,d.y-m.y)*CHART_RADIUS;
 assert.ok(dist<3,`chart miss ${dist.toFixed(2)}°`);
 // 方向也要对：从天璇经天枢继续往前，才到北极星（不是反方向）
 assert.ok((d.x-m.x)*(p.x-d.x)+(d.y-m.y)*(p.y-d.y)>0)});

test('geometry: the dipper turns counter-clockwise around the pole, about 15° an hour',()=>{
 const a=dipperSky(new Date('2026-01-01T20:00:00+08:00'),35,120),b=dipperSky(new Date('2026-01-01T21:00:00+08:00'),35,120);
 const turn=((polarAngle([b.stars[0].x,b.stars[0].y])-polarAngle([a.stars[0].x,a.stars[0].y]))%360+360)%360;
 assert.ok(turn>14.5&&turn<15.5,`turned ${turn}°`)});

test('geometry: Polaris altitude tracks latitude, and the north horizon point sits that far below the pole',()=>{
 for(const lat of [22,35,45]){const s=dipperSky(new Date('2026-06-01T22:00:00+08:00'),lat,120);assert.ok(Math.abs(s.polaris.alt-lat)<1,`lat ${lat}: ${s.polaris.alt}`);
  const north=horizonLine(lat).reduce((best,p)=>Math.abs(p[0])<Math.abs(best[0])?p:best);assert.ok(Math.abs(north[1]*CHART_RADIUS-lat)<0.5&&north[1]>0,`horizon ${north}`)}});

test('season: at dusk the handle points east in spring, south in summer, west in autumn, north in winter (《鹖冠子·环流》)',()=>{
 for(const [day,season] of [['2026-04-05','春'],['2026-07-05','夏'],['2026-10-05','秋'],['2026-01-15','冬']] as const){
  const s=duskSky(new Date(`${day}T12:00:00+08:00`),35,120);assert.ok(s);assert.equal(seasonOf(s.handle),season,`${day} handle ${s.handle}`)}});

test('bearing labels read like a compass',()=>{
 assert.equal(bearingLabel(112),'东偏南 112°');assert.equal(bearingLabel(91),'正东 91°');assert.equal(bearingLabel(200),'南偏西 200°');assert.equal(bearingLabel(350),'北偏西 350°');assert.equal(bearingLabel(20),'北偏东 20°')});

test('turning the dipper by turnTo() makes the handle point exactly at the chosen slot',()=>{
 const s=dipperSky(new Date('2026-11-04T07:30:00+08:00'),35,120),mz:[number,number]=[s.stars[5].x,s.stars[5].y],ak:[number,number]=[s.stars[6].x,s.stars[6].y];
 for(const slot of [0,13,39,77]){const base=pointerAngle(mz,ak,0.93),turn=turnTo(base,slotAngle(slot,78));assert.ok(turn>=100&&turn<460);
  const after=pointerAngle(rotate(mz,turn),rotate(ak,turn),0.93);assert.ok(angDiff(after,slotAngle(slot,78))<1e-6,`slot ${slot}: ${after}`)}});

test('randomness: with a fixed random source the card does not depend on time or latitude',()=>{
 const seeded=()=>{let x=12345;return (n:number)=>randomInteger(n,()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x})};
 const results=new Set<string>();
 for(const [iso,lat] of [['2026-01-01T21:00:00+08:00',22],['2026-07-01T05:00:00+08:00',45],['2026-11-04T12:00:00+08:00',35]] as const){
  dipperSky(new Date(iso),lat,120); // 星空怎么变都不该影响结果
  const r=dipperDraw(cards,seeded());results.add(`${r.chosen.card.id}/${r.chosen.reversed}`)}
 assert.equal(results.size,1)});

test('randomness: 78 × 1000 real draws through the dipper ritual look uniform (chi-square)',()=>{
 const n=cards.length,runs=n*1000,counts=new Map<string,number>();let reversed=0;
 for(let i=0;i<runs;i++){const {chosen}=dipperDraw(cards);counts.set(chosen.card.id,(counts.get(chosen.card.id)??0)+1);if(chosen.reversed)reversed++}
 const expected=runs/n,chi=[...cards].reduce((sum,c)=>sum+((counts.get(c.id)??0)-expected)**2/expected,0);
 // 自由度 77，α = 0.001 的临界值约 121.1
 assert.ok(chi<121.1,`chi-square ${chi.toFixed(1)}`);assert.ok(Math.abs(reversed/runs-0.5)<0.01,`reversed ${reversed/runs}`)});

test('storage: old records without dipper fields still load; new optional fields round-trip; bad ones are rejected',async()=>{
 const {validate,fresh}=await import('../src/storage.ts');const {draw}=await import('../src/engine.ts');
 const old=fresh();old.days['2026-10-01']=draw('2026-10-01',old.preferences,'','',()=>0);
 const back=validate(JSON.parse(JSON.stringify(old)));assert.equal(back.days['2026-10-01'].cardId,old.days['2026-10-01'].cardId);assert.equal(back.days['2026-10-01'].ritual,undefined);assert.equal(back.preferences.ritual,undefined);
 const neu=JSON.parse(JSON.stringify(old));neu.preferences.ritual='dipper';neu.preferences.observer={lat:31.2,lon:121.5};neu.preferences.shareLatitude=false;
 neu.days['2026-10-01'].ritual='dipper';neu.days['2026-10-01'].dipper={handleAz:112.4,alkaidAlt:34.2,lat:31.2,lon:121.5,at:'2026-10-01T23:30:00.000Z'};
 const round=validate(JSON.parse(JSON.stringify(neu)));assert.equal(round.preferences.ritual,'dipper');assert.deepEqual(round.days['2026-10-01'].dipper,neu.days['2026-10-01'].dipper);
 const only=JSON.parse(JSON.stringify(neu));delete only.days['2026-10-01'].dipper.lon;delete only.days['2026-10-01'].dipper.at;delete only.preferences.observer.lon;assert.doesNotThrow(()=>validate(only));
 for(const bad of [(d:any)=>{d.preferences.ritual='stars'},(d:any)=>{d.preferences.observer={lat:120}},(d:any)=>{d.days['2026-10-01'].dipper={handleAz:400,alkaidAlt:0,lat:0}},(d:any)=>{d.days['2026-10-01'].ritual='x'},(d:any)=>{d.days['2026-10-01'].dipper.at='not a date'}]){
  const d=JSON.parse(JSON.stringify(neu));bad(d);assert.throws(()=>validate(d))}});
