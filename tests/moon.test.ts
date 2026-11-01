import test from 'node:test';import assert from 'node:assert/strict';import {shadeMoon} from '../src/lib/moon-render.ts';
// 均匀灰色贴图，只检验光照方向，不依赖网络。
const tex={width:64,height:32,data:new Uint8ClampedArray(64*32*4).fill(200)};
function render(elongation:number,size=60){const out=new Uint8ClampedArray(size*size*4);shadeMoon(out,size,tex,{elongation,libLat:0,libLon:0});const at=(fx:number,fy:number)=>out[(Math.floor(fy*size)*size+Math.floor(fx*size))*4];return {out,at}}
test('outside the disc is transparent',()=>{const {out}=render(180);assert.equal(out[3],0)});
test('full moon is bright across the face, new moon only shows earthshine',()=>{const full=render(180),fresh=render(0);assert.ok(full.at(.3,.5)>120&&full.at(.7,.5)>120);assert.ok(fresh.at(.5,.5)<30)});
test('waxing lights the right side, waning the left',()=>{const wax=render(90),wane=render(270);assert.ok(wax.at(.8,.5)>wax.at(.2,.5)+60);assert.ok(wane.at(.2,.5)>wane.at(.8,.5)+60)});
