// 揭牌：牌面先化作几千颗光尘从四周飞回原位，拼出图案；随后一道金光从牌上扫过，扫过的地方才露出真正的牌面，光尘也在那里退去。
// 光尘的颜色取自牌面本身（取样原版彩色扫描的像素），所以每张牌拼出来的样子都不一样。
// 返回 false 表示没有运行（减少动态效果、图片读不到），调用方改用普通的翻牌。任何一步出错，牌面都会在几秒内完整显示。
const reduced=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
interface Dust {sx:number;sy:number;tx:number;ty:number;r:number;g:number;b:number;delay:number;swirl:number}
// 与 epic.css 里 sheen-pass 的时间一致：光尘归位后 SCAN_AT 秒加上扫光，动画延迟 .45s、时长 1.3s
const SCAN_AT=.95,SCAN_DELAY=.45,SCAN_DUR=1.3;

export function dustReveal(card:HTMLElement|null):boolean{
 if(!card||reduced())return false;const img=card.querySelector<HTMLImageElement>('img');if(!img)return false;
 card.classList.add('veiled');
 const finish=()=>card.classList.remove('veiled','scan');
 const safety=setTimeout(finish,(SCAN_AT+SCAN_DELAY+SCAN_DUR)*1000+800);
 const run=()=>{
  const rect=card.getBoundingClientRect(),W=Math.max(1,Math.round(rect.width)),H=Math.max(1,Math.round(rect.height));
  const off=document.createElement('canvas');off.width=W;off.height=H;const o=off.getContext('2d',{willReadFrequently:true});
  let data:Uint8ClampedArray;try{o!.drawImage(img,0,0,W,H);data=o!.getImageData(0,0,W,H).data}catch{clearTimeout(safety);finish();return}
  const rev=card.classList.contains('is-reversed'),step=W>200?5:4,dust:Dust[]=[],cx=W/2,cy=H/2,far=Math.max(W,H);
  for(let y=0;y<H;y+=step)for(let x=0;x<W;x+=step){const i=(y*W+x)*4;if(data[i+3]<20)continue;
   const a=Math.random()*Math.PI*2,d=far*(.55+Math.random()*.7);
   dust.push({sx:cx+Math.cos(a)*d,sy:cy+Math.sin(a)*d,tx:rev?W-x:x,ty:rev?H-y:y,r:data[i],g:data[i+1],b:data[i+2],delay:Math.random()*.3+Math.hypot(x-cx,y-cy)/far*.25,swirl:(Math.random()-.5)*1.6})}
  // 画布左右不超出屏幕，免得手机上页面能被横向拖动；ox 是牌的左边在画布里的位置
  const pad=Math.round(far*.9),dpr=Math.min(2,window.devicePixelRatio||1),L=Math.max(0,rect.left-pad),CW=Math.max(W,Math.min(document.documentElement.clientWidth,rect.right+pad)-L),CH=H+pad*2,ox=rect.left-L;
  const canvas=document.createElement('canvas');canvas.className='particle-layer dust-layer';canvas.setAttribute('aria-hidden','true');document.body.appendChild(canvas);
  Object.assign(canvas.style,{left:`${L+scrollX}px`,top:`${rect.top+scrollY-pad}px`,width:`${CW}px`,height:`${CH}px`});
  canvas.width=Math.round(CW*dpr);canvas.height=Math.round(CH*dpr);
  const ctx=canvas.getContext('2d')!;ctx.setTransform(dpr,0,0,dpr,0,0);
  const start=performance.now(),ease=(k:number)=>1-Math.pow(1-k,3),size=step*.72,slope=Math.tan(25*Math.PI/180);let scanned=false,raf=0;
  const end=()=>{cancelAnimationFrame(raf);canvas.remove();clearTimeout(safety);finish()};
  const frame=(now:number)=>{const t=(now-start)/1000;ctx.clearRect(0,0,CW,CH);
   if(!scanned&&t>SCAN_AT){scanned=true;card.classList.add('scan','sheen')}
   // 光带中心的横坐标（牌内像素），与 sheen-pass 的移动大致同步；光带是斜的，越往下越靠后
   const u=Math.min(1,Math.max(0,(t-SCAN_AT-SCAN_DELAY)/SCAN_DUR)),band=-1.1*W+3.2*W*(1-Math.pow(1-u,2));
   if(t>SCAN_AT+SCAN_DELAY+SCAN_DUR+.2){end();return}
   for(const p of dust){const k=Math.min(1,Math.max(0,(t-p.delay)/.85)),e=ease(k);if(k<=0)continue;
    // 光带扫过之后，这颗光尘在 0.12 个牌宽内退去，露出下面真正的牌面
    const behind=t>SCAN_AT+SCAN_DELAY?Math.min(1,Math.max(0,(band-(p.tx+(p.ty-cy)*slope))/(W*.12))):0;if(behind>=1)continue;
    const turn=(1-e)*p.swirl,dx=p.sx-p.tx,dy=p.sy-p.ty;const x=p.tx+(dx*Math.cos(turn)-dy*Math.sin(turn))*(1-e),y=p.ty+(dx*Math.sin(turn)+dy*Math.cos(turn))*(1-e);
    // 飞行时偏金色，归位后显出牌面自己的颜色
    const m=e*e,r=Math.round(236+(p.r-236)*m),g=Math.round(204+(p.g-204)*m),b=Math.round(140+(p.b-140)*m);
    ctx.fillStyle=`rgba(${r},${g},${b},${((.35+.65*k)*(1-behind)).toFixed(3)})`;const s=size*(1.5-.5*e);ctx.fillRect(ox+x-s/2,pad+y-s/2,s,s)}
   raf=requestAnimationFrame(frame)};
  raf=requestAnimationFrame(frame)};
 if(img.complete&&img.naturalWidth)run();else{img.addEventListener('load',run,{once:true});img.addEventListener('error',()=>{clearTimeout(safety);finish()},{once:true})}
 return true}
