// 抽牌粒子：gather 光尘向牌汇聚（洗牌、抽牌时）；reveal 翻牌时从牌边散开；ambient 阅读解析时牌周围缓慢浮动的微光。
// 一块 Canvas 盖在牌上方，不改动牌本身；颜色跟随主题的前景色。减少动态效果时全部不运行，页面在后台时暂停。
type Mode='gather'|'reveal'|'ambient';
interface P {x:number;y:number;vx:number;vy:number;tx:number;ty:number;r:number;life:number;age:number;tw:number}
export interface ParticleHandle {stop():void}
const noop:ParticleHandle={stop(){}};
const reduced=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const rand=(a:number,b:number)=>a+Math.random()*(b-a);
function fg(){const v=getComputedStyle(document.documentElement).getPropertyValue('--fg').trim()||'#e6e2d8';const c=document.createElement('canvas').getContext('2d');if(!c)return [230,226,216];c.fillStyle=v;const h=c.fillStyle as string;if(h.startsWith('#'))return [1,3,5].map(i=>parseInt(h.slice(i,i+2),16));const m=h.match(/\d+/g);return m?m.slice(0,3).map(Number):[230,226,216]}
/** 在 host 元素周围播放粒子。container 默认是 body；在 <dialog> 里用时传入 dialog，否则会被顶层遮住。 */
export function particles(host:Element|null,mode:Mode,container:HTMLElement=document.body):ParticleHandle{
 if(!host||reduced())return noop;
 const pad=mode==='ambient'?56:mode==='reveal'?90:140;const dpr=Math.min(2,window.devicePixelRatio||1);
 const canvas=document.createElement('canvas');canvas.className='particle-layer';canvas.setAttribute('aria-hidden','true');container.appendChild(canvas);
 const ctx=canvas.getContext('2d');if(!ctx){canvas.remove();return noop}
 const [r,g,b]=fg();const dark=document.documentElement.dataset.theme!=='light';
 let w=0,h=0,cw=0,ch=0;
 function place(){const hr=host!.getBoundingClientRect(),cr=container===document.body?{left:-scrollX,top:-scrollY}:(()=>{const c=container.getBoundingClientRect();return {left:c.left-container.scrollLeft,top:c.top-container.scrollTop}})();cw=hr.width;ch=hr.height;w=cw+pad*2;h=ch+pad*2;Object.assign(canvas.style,{left:`${hr.left-cr.left-pad}px`,top:`${hr.top-cr.top-pad}px`,width:`${w}px`,height:`${h}px`});canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx!.setTransform(dpr,0,0,dpr,0,0)}
 place();
 const edge=()=>{const s=Math.floor(rand(0,4)),t=Math.random();return s===0?[pad+t*cw,pad]:s===1?[pad+cw,pad+t*ch]:s===2?[pad+t*cw,pad+ch]:[pad,pad+t*ch]};
 const count=mode==='ambient'?Math.round(Math.min(40,(cw+ch)/9)):mode==='reveal'?90:80;const ps:P[]=[];
 function spawn(i:number):P{if(mode==='gather'){const a=rand(0,Math.PI*2),d=rand(Math.max(cw,ch)*.6,Math.max(cw,ch)*.6+pad);const [tx,ty]=edge();return {x:w/2+Math.cos(a)*d,y:h/2+Math.sin(a)*d,vx:0,vy:0,tx,ty,r:rand(.6,1.8),life:rand(650,950),age:-rand(0,180),tw:rand(0,6)}}
  if(mode==='reveal'){const [x,y]=edge(),a=Math.atan2(y-h/2,x-w/2)+rand(-.5,.5),s=rand(.04,.16);return {x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-.02,tx:0,ty:0,r:rand(.5,1.9),life:rand(700,1300),age:-rand(0,120),tw:rand(0,6)}}
  const [x,y]=edge();return {x:x+rand(-pad*.5,pad*.5),y:y+rand(-pad*.5,pad*.5),vx:rand(-.006,.006),vy:rand(-.018,-.006),tx:0,ty:0,r:rand(.5,1.4),life:rand(3500,7000),age:i<count?-rand(0,4000):0,tw:rand(0,6)}}
 for(let i=0;i<count;i++)ps.push(spawn(i));
 let last=performance.now(),raf=0,done=false;const start=last;
 function frame(now:number){if(done)return;const dt=Math.min(48,now-last);last=now;if(document.hidden){raf=requestAnimationFrame(frame);return}
  ctx!.clearRect(0,0,w,h);ctx!.globalCompositeOperation=dark?'lighter':'source-over';let alive=0;
  for(let i=0;i<ps.length;i++){const p=ps[i];p.age+=dt;if(p.age<0){alive++;continue}const k=p.age/p.life;
   if(k>=1){if(mode==='ambient'){ps[i]=spawn(count);alive++}continue}alive++;
   if(mode==='gather'){const e=1-Math.pow(1-k,3);p.x+=(p.tx-p.x)*Math.min(1,e*.09+.012);p.y+=(p.ty-p.y)*Math.min(1,e*.09+.012)}else{p.x+=p.vx*dt;p.y+=p.vy*dt;if(mode==='reveal'){p.vx*=.985;p.vy*=.985}}
   const fade=mode==='gather'?Math.sin(Math.min(1,k)*Math.PI):mode==='reveal'?(1-k)*(k<.12?k/.12:1):Math.sin(k*Math.PI)*.55;
   const a=fade*(.55+.45*Math.sin(p.tw+now/260));if(a<=.01)continue;
   ctx!.fillStyle=`rgba(${r},${g},${b},${(a*.18).toFixed(3)})`;ctx!.beginPath();ctx!.arc(p.x,p.y,p.r*3.2,0,Math.PI*2);ctx!.fill();
   ctx!.fillStyle=`rgba(${r},${g},${b},${a.toFixed(3)})`;ctx!.beginPath();ctx!.arc(p.x,p.y,p.r,0,Math.PI*2);ctx!.fill()}
  if(mode!=='ambient'&&(alive===0||now-start>2200)){stop();return}raf=requestAnimationFrame(frame)}
 const onResize=()=>place();window.addEventListener('resize',onResize);if(container!==document.body)container.addEventListener('scroll',onResize,{passive:true});
 raf=requestAnimationFrame(frame);
 function stop(){if(done)return;done=true;cancelAnimationFrame(raf);window.removeEventListener('resize',onResize);container.removeEventListener('scroll',onResize);canvas.remove()}
 return {stop}}
