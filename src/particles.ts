// 抽牌粒子：gather 光尘向牌汇聚（洗牌、抽牌时）；reveal 翻牌时从牌边散开；ambient 阅读解析时牌周围缓慢浮动的微光。
// 一块 Canvas 盖在牌上方，不改动牌本身；颜色跟随主题的前景色。减少动态效果时全部不运行，页面在后台时暂停。
type Mode='gather'|'reveal'|'ambient';
interface P {x:number;y:number;px:number;py:number;vx:number;vy:number;tx:number;ty:number;r:number;life:number;age:number;tw:number;tone:number;star:boolean}
export interface ParticleHandle {stop():void}
const noop:ParticleHandle={stop(){}};
const reduced=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const rand=(a:number,b:number)=>a+Math.random()*(b-a);
// 每种颜色预先画一张柔光小图（中心亮、边缘渐隐），逐帧贴图比画实心圆更柔和，也更省。
const sprites=new Map<string,HTMLCanvasElement>();
function sprite(rgb:number[]):HTMLCanvasElement{const key=rgb.join();let s=sprites.get(key);if(s)return s;s=document.createElement('canvas');s.width=s.height=64;const c=s.getContext('2d')!;const g=c.createRadialGradient(32,32,0,32,32,32);const [r,gg,b]=rgb;g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.1,`rgba(${r},${gg},${b},1)`);g.addColorStop(.22,`rgba(${r},${gg},${b},.55)`);g.addColorStop(.5,`rgba(${r},${gg},${b},.14)`);g.addColorStop(1,`rgba(${r},${gg},${b},0)`);c.fillStyle=g;c.fillRect(0,0,64,64);sprites.set(key,s);return s}
function fg(){const v=getComputedStyle(document.documentElement).getPropertyValue('--fg').trim()||'#e6e2d8';const c=document.createElement('canvas').getContext('2d');if(!c)return [230,226,216];c.fillStyle=v;const h=c.fillStyle as string;if(h.startsWith('#'))return [1,3,5].map(i=>parseInt(h.slice(i,i+2),16));const m=h.match(/\d+/g);return m?m.slice(0,3).map(Number):[230,226,216]}
/** 在 host 元素周围播放粒子。container 默认是 body；在 <dialog> 里用时传入 dialog，否则会被顶层遮住。 */
export function particles(host:Element|null,mode:Mode,container:HTMLElement=document.body):ParticleHandle{
 if(!host||reduced())return noop;
 const pad=mode==='ambient'?56:mode==='reveal'?90:140;const dpr=Math.min(2,window.devicePixelRatio||1);
 const canvas=document.createElement('canvas');canvas.className='particle-layer';canvas.setAttribute('aria-hidden','true');container.appendChild(canvas);
 const ctx=canvas.getContext('2d');if(!ctx){canvas.remove();return noop}
 const base=fg();const dark=document.documentElement.dataset.theme!=='light';
 // 深色主题：大部分是前景色，掺一些暖金和极少的淡蓝，像星尘；浅色主题只用前景色，避免发灰发脏。
 const tones=dark?[base,[236,204,140],[184,206,240]]:[base];const pick=()=>{if(!dark)return 0;const q=Math.random();return q<.66?0:q<.92?1:2};
 const imgs=tones.map(sprite);
 let w=0,h=0,cw=0,ch=0;
 function place(){const hr=host!.getBoundingClientRect(),cr=container===document.body?{left:-scrollX,top:-scrollY}:(()=>{const c=container.getBoundingClientRect();return {left:c.left-container.scrollLeft,top:c.top-container.scrollTop}})();cw=hr.width;ch=hr.height;w=cw+pad*2;h=ch+pad*2;Object.assign(canvas.style,{left:`${hr.left-cr.left-pad}px`,top:`${hr.top-cr.top-pad}px`,width:`${w}px`,height:`${h}px`});canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx!.setTransform(dpr,0,0,dpr,0,0)}
 place();
 const edge=()=>{const s=Math.floor(rand(0,4)),t=Math.random();return s===0?[pad+t*cw,pad]:s===1?[pad+cw,pad+t*ch]:s===2?[pad+t*cw,pad+ch]:[pad,pad+t*ch]};
 const count=mode==='ambient'?Math.round(Math.min(46,(cw+ch)/8)):mode==='reveal'?130:110;const ps:P[]=[];
 const extra=()=>({tone:pick(),star:Math.random()<.07});
 function spawn(i:number):P{if(mode==='gather'){const a=rand(0,Math.PI*2),d=rand(Math.max(cw,ch)*.6,Math.max(cw,ch)*.6+pad);const [tx,ty]=edge();const x=w/2+Math.cos(a)*d,y=h/2+Math.sin(a)*d;return {x,y,px:x,py:y,vx:0,vy:0,tx,ty,r:rand(.5,1.7),life:rand(700,1000),age:-rand(0,220),tw:rand(0,6),...extra()}}
  if(mode==='reveal'){const [x,y]=edge(),a=Math.atan2(y-h/2,x-w/2)+rand(-.5,.5),s=rand(.03,.15);return {x,y,px:x,py:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-.02,tx:0,ty:0,r:rand(.4,1.8),life:rand(800,1500),age:-rand(0,160),tw:rand(0,6),...extra()}}
  const [ex,ey]=edge(),x=ex+rand(-pad*.5,pad*.5),y=ey+rand(-pad*.5,pad*.5);return {x,y,px:x,py:y,vx:rand(-.006,.006),vy:rand(-.016,-.005),tx:0,ty:0,r:rand(.4,1.3),life:rand(4000,8000),age:i<count?-rand(0,4000):0,tw:rand(0,6),...extra()}}
 for(let i=0;i<count;i++)ps.push(spawn(i));
 let last=performance.now(),raf=0,done=false;const start=last;
 function frame(now:number){if(done)return;const dt=Math.min(48,now-last);last=now;if(document.hidden){raf=requestAnimationFrame(frame);return}
  ctx!.clearRect(0,0,w,h);ctx!.globalCompositeOperation=dark?'lighter':'source-over';let alive=0;
  for(let i=0;i<ps.length;i++){const p=ps[i];p.age+=dt;if(p.age<0){alive++;continue}const k=p.age/p.life;
   if(k>=1){if(mode==='ambient'){ps[i]=spawn(count);alive++}continue}alive++;
   p.px=p.x;p.py=p.y;
   // 汇聚按帧时长换算缓动，帧率高低看起来一样快；越靠近牌越慢，落点更柔。
   if(mode==='gather'){const e=1-Math.pow(1-k,3);const f=1-Math.pow(1-Math.min(1,e*.085+.01),dt/16.7);p.x+=(p.tx-p.x)*f;p.y+=(p.ty-p.y)*f}else{p.x+=p.vx*dt;p.y+=p.vy*dt;if(mode==='reveal'){const d=Math.pow(.985,dt/16.7);p.vx*=d;p.vy*=d}}
   const fade=mode==='gather'?Math.sin(Math.min(1,k)*Math.PI):mode==='reveal'?(1-k)*(1-k)*(k<.1?k/.1:1):Math.sin(k*Math.PI)*.55;
   const a=fade*(.6+.4*Math.sin(p.tw+now/320));if(a<=.01)continue;
   // 拖尾：汇聚和散开时沿运动方向留一段很短的淡线。
   if(mode!=='ambient'){const dx=p.x-p.px,dy=p.y-p.py;if(dx*dx+dy*dy>.6){const [tr,tg,tb]=tones[p.tone];ctx!.strokeStyle=`rgba(${tr},${tg},${tb},${(a*.32).toFixed(3)})`;ctx!.lineWidth=p.r*.9;ctx!.lineCap='round';ctx!.beginPath();ctx!.moveTo(p.x-dx*2.6,p.y-dy*2.6);ctx!.lineTo(p.x,p.y);ctx!.stroke()}}
   const s=p.r*(dark?10:7);ctx!.globalAlpha=Math.min(1,a*1.15);ctx!.drawImage(imgs[p.tone],p.x-s/2,p.y-s/2,s,s);
   // 少数亮点在闪烁到最亮时带一个细小的十字星芒。
   if(p.star&&dark){const tw=Math.max(0,Math.sin(p.tw+now/320));if(tw>.55){const [tr,tg,tb]=tones[p.tone],L=p.r*7*(tw-.4);ctx!.globalAlpha=1;ctx!.strokeStyle=`rgba(${tr},${tg},${tb},${(a*.5*tw).toFixed(3)})`;ctx!.lineWidth=.6;ctx!.beginPath();ctx!.moveTo(p.x-L,p.y);ctx!.lineTo(p.x+L,p.y);ctx!.moveTo(p.x,p.y-L);ctx!.lineTo(p.x,p.y+L);ctx!.stroke()}}
   ctx!.globalAlpha=1}
  if(mode!=='ambient'&&(alive===0||now-start>2200)){stop();return}raf=requestAnimationFrame(frame)}
 const onResize=()=>place();window.addEventListener('resize',onResize);if(container!==document.body)container.addEventListener('scroll',onResize,{passive:true});
 raf=requestAnimationFrame(frame);
 function stop(){if(done)return;done=true;cancelAnimationFrame(raf);window.removeEventListener('resize',onResize);container.removeEventListener('scroll',onResize);canvas.remove()}
 return {stop}}
