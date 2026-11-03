// 金属光尘：几百颗极细的金屑绕着牌缓缓漂移，整体随一呼一吸收拢、舒展；偶尔有一颗像金属转到光下那样闪一下。
// gather：选中牌后从外圈慢慢收拢到牌边，直到 stop()；release：翻牌后从牌边向外散开、淡去，自动结束。
// 漂移方向取自 simplex-noise（MIT，github.com/jwagner/simplex-noise.js）的旋度场，粒子不会扎堆，也不会突然转向。
// 减少动态效果时不运行，页面在后台时暂停。
import {createNoise3D} from 'simplex-noise';
export type AuraMode='gather'|'release';
export interface AuraHandle {stop():void}
const noop:AuraHandle={stop(){}};
const reduced=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const BREATH=3.6; // 一次呼吸的秒数，和 epic.css 里 aura-breathe 一致
interface Mote {a:number;r:number;size:number;tone:number;phase:number;glint:number;x:number;y:number;px:number;py:number}

export function aura(host:Element|null,mode:AuraMode):AuraHandle{
 if(!host||reduced())return noop;
 const canvas=document.createElement('canvas');canvas.className='particle-layer aura-layer';canvas.setAttribute('aria-hidden','true');document.body.appendChild(canvas);
 const ctx=canvas.getContext('2d');if(!ctx){canvas.remove();return noop}
 const dark=document.documentElement.dataset.theme!=='light',dpr=Math.min(2,window.devicePixelRatio||1),noise=createNoise3D();
 // 香槟金、浅金、古铜；浅色主题换成更深的铜色，才看得见
 const tones=dark?[[226,200,154],[248,236,210],[176,136,80]]:[[150,112,52],[120,88,40],[176,136,80]];
 let w=0,h=0,cx=0,cy=0,R=0,ox=0;
 function place(){const r=host!.getBoundingClientRect(),pad=Math.min(150,Math.max(r.width,r.height)*.55);w=r.width+pad*2;h=r.height+pad*2;cx=w/2;cy=h/2;R=Math.hypot(r.width,r.height)/2;
  // 画布左右裁到屏幕以内，画的时候用 ox 平移回去
  const vl=Math.max(0,r.left-pad),vw=Math.max(r.width,Math.min(document.documentElement.clientWidth,r.right+pad)-vl);ox=vl-(r.left-pad);
  Object.assign(canvas.style,{left:`${vl+scrollX}px`,top:`${r.top+scrollY-pad}px`,width:`${vw}px`,height:`${h}px`});canvas.width=Math.round(vw*dpr);canvas.height=Math.round(h*dpr)}
 place();
 const count=Math.round(Math.min(620,Math.max(320,innerWidth*1.3)));
 const motes:Mote[]=Array.from({length:count},()=>{const a=Math.random()*Math.PI*2,r=mode==='gather'?.62+Math.pow(Math.random(),1.6)*.7:.52+Math.random()*.12;return {a,r,size:.6+Math.pow(Math.random(),3)*1.3,tone:Math.random()<.12?1:Math.random()<.3?2:0,phase:Math.random()*100,glint:Math.random()<.09?1:0,x:0,y:0,px:NaN,py:NaN}});
 const start=performance.now();let raf=0,done=false,fadeFrom=0,last=start;
 function frame(now:number){if(done)return;if(document.hidden){last=now;raf=requestAnimationFrame(frame);return}
  const t=(now-start)/1000,dt=Math.min(.05,(now-last)/1000);last=now;
  ctx!.setTransform(dpr,0,0,dpr,-ox*dpr,0);ctx!.clearRect(ox,0,w,h);ctx!.globalCompositeOperation=dark?'lighter':'source-over';
  let master=Math.min(1,t/.6);if(fadeFrom)master*=Math.max(0,1-(now-fadeFrom)/500);if(mode==='release')master*=Math.max(0,1-Math.max(0,t-.6)/1.8);
  if(master<=.01&&t>.6&&(fadeFrom||mode==='release')){finish();return}
  // 呼吸：吸气时整团光尘向牌收一点，呼气时舒展；gather 还会随时间整体收拢到牌边
  const breath=Math.sin(t/BREATH*Math.PI*2),pull=mode==='gather'?1-.32*(1-Math.exp(-t*.9)):1+.5*(1-Math.exp(-t*1.1));
  for(const m of motes){
   // 旋度场：对噪声取偏导再交换，得到无散度的流向，粒子顺着它切向漂移
   const nx=Math.cos(m.a)*m.r*2,ny=Math.sin(m.a)*m.r*2,e=.01,z=t*.08+m.phase*.001;
   const curl=(noise(nx,ny+e,z)-noise(nx,ny-e,z))/(2*e)*.0009,drift=(noise(nx+e,ny,z)-noise(nx-e,ny,z))/(2*e)*.0011;
   m.a+=(.05+curl*60)*dt*(m.tone===2?.7:1);m.r=Math.min(1.5,Math.max(.52,m.r-drift*dt*60*.04));
   const rr=R*m.r*pull*(1-.035*breath);m.x=cx+Math.cos(m.a)*rr;m.y=cy+Math.sin(m.a)*rr*.94;
   // 金属的闪：大部分时候暗，转到某个角度时短暂亮起
   const shine=Math.pow(Math.max(0,Math.sin(t*(1.3+m.phase%1)+m.phase)),m.glint?14:6),alpha=master*(.3+.62*shine)*(.75+.25*breath*(m.r>1?-1:1));
   const c=tones[shine>.85?1:m.tone];
   if(!Number.isNaN(m.px)&&alpha>.01){ctx!.strokeStyle=`rgba(${c[0]},${c[1]},${c[2]},${alpha.toFixed(3)})`;ctx!.lineWidth=m.size;ctx!.lineCap='round';ctx!.beginPath();ctx!.moveTo(m.px,m.py);ctx!.lineTo(m.x,m.y);ctx!.stroke()}
   // 少数金屑在最亮时现出一个极细的四芒星
   if(m.glint&&shine>.8){// 光晕只有几个像素，像金属反光而不是发光体
    const g=ctx!.createRadialGradient(m.x,m.y,0,m.x,m.y,5);g.addColorStop(0,`rgba(255,240,210,${(master*shine*.45).toFixed(3)})`);g.addColorStop(1,'rgba(255,240,210,0)');ctx!.fillStyle=g;ctx!.fillRect(m.x-5,m.y-5,10,10);
    const s=(1.5+2.5*shine)*master;ctx!.strokeStyle=`rgba(${tones[1][0]},${tones[1][1]},${tones[1][2]},${(master*shine*.7).toFixed(3)})`;ctx!.lineWidth=.5;ctx!.beginPath();ctx!.moveTo(m.x-s,m.y);ctx!.lineTo(m.x+s,m.y);ctx!.moveTo(m.x,m.y-s);ctx!.lineTo(m.x,m.y+s);ctx!.stroke()}
   m.px=m.x;m.py=m.y}
  ctx!.globalCompositeOperation='source-over';raf=requestAnimationFrame(frame)}
 const onResize=()=>place();window.addEventListener('resize',onResize);raf=requestAnimationFrame(frame);
 function finish(){done=true;cancelAnimationFrame(raf);window.removeEventListener('resize',onResize);canvas.remove()}
 return {stop(){if(done)return;if(mode==='gather'&&!fadeFrom){fadeFrom=performance.now();return}finish()}}}
