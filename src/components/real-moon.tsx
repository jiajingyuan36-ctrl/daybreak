'use client';
import {useEffect,useRef,useState} from 'react';
import {MOON_TEXTURE,shadeMoon} from '../lib/moon-render';
import type {MoonTexture} from '../lib/moon-render';
// 月面贴图来自 three.js 开源示例 moon_1024.jpg（github.com/mrdoob/three.js，MIT），转成黑白 WebP 放在本站，
// 不再连第二个域名（新连接的加密握手在部分网络下要好几秒）。读取失败时保留线条月相。
const idle=(fn:()=>void)=>'requestIdleCallback'in window?requestIdleCallback(fn,{timeout:400}):setTimeout(fn,0);
let pending:Promise<MoonTexture>|null=null;
function loadTexture(){pending??=new Promise<MoonTexture>((resolve,reject)=>{const img=new Image();img.crossOrigin='anonymous';img.decoding='async';img.onload=()=>{try{const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const x=c.getContext('2d');if(!x)throw Error('no canvas');x.drawImage(img,0,0);const d=x.getImageData(0,0,c.width,c.height);resolve({data:d.data,width:d.width,height:d.height})}catch(e){reject(e)}};img.onerror=()=>reject(Error('月面贴图加载失败'));img.src=MOON_TEXTURE});pending.catch(()=>{pending=null});return pending}
/** 叠在线条月相上的真实月面；贴图就绪后才通知父组件隐藏线条明暗。 */
export function RealMoon({at,elongation,onReady}:{at:Date;elongation:number;onReady:(ok:boolean)=>void}){
 const canvas=useRef<HTMLCanvasElement>(null);const [shown,setShown]=useState(false);
 useEffect(()=>{
  let live=true;
  idle(()=>{
   if(!live)return;
   Promise.all([loadTexture(),import('astronomy-engine')]).then(([tex,{Libration}])=>idle(()=>{
    const c=canvas.current;if(!live||!c)return;
    const css=c.getBoundingClientRect().width||140,size=Math.round(Math.min(400,css*Math.min(2,window.devicePixelRatio||1)));
    c.width=c.height=size;const x=c.getContext('2d');if(!x)return;
    const img=x.createImageData(size,size),lib=Libration(at);
    shadeMoon(img.data,size,tex,{elongation,libLat:lib.elat,libLon:lib.elon});
    x.putImageData(img,0,0);setShown(true);onReady(true);
   })).catch(()=>{if(live)onReady(false)});
  });
  return()=>{live=false};
 },[at.valueOf(),elongation]);
 return <canvas ref={canvas} className={`real-moon${shown?' shown':''}`} aria-hidden="true"/>}
