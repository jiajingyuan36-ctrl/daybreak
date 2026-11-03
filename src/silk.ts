// 抽牌时的金色丝绸流光：几条半透明的金色丝带绕着牌旋转。
// swirl：选中牌后丝带从外圈螺旋收拢到牌上，一直转到 stop()；burst：翻牌后丝带向外舒展、慢慢淡去，自动结束。
// 每条丝带画两层：宽而淡的一层做柔光，窄而亮的一层做丝绸的高光。减少动态效果时不运行，页面在后台时暂停。
export type SilkMode='swirl'|'burst';
export interface SilkHandle {stop():void}
const noop:SilkHandle={stop(){}};
const reduced=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
interface Ribbon {phase:number;speed:number;radius:number;squash:number;width:number;length:number;wobble:number;tint:number}

export function silk(host:Element|null,mode:SilkMode,container:HTMLElement=document.body):SilkHandle{
 if(!host||reduced())return noop;
 const canvas=document.createElement('canvas');canvas.className='particle-layer silk-layer';canvas.setAttribute('aria-hidden','true');container.appendChild(canvas);
 const ctx=canvas.getContext('2d');if(!ctx){canvas.remove();return noop}
 const dark=document.documentElement.dataset.theme!=='light';const dpr=Math.min(2,window.devicePixelRatio||1);
 const pad=170;let w=0,h=0,cw=0,ch=0;
 // 画布左右裁到屏幕以内（免得手机页面能横向拖动），画的时候用 ox 平移回原来的坐标
 let ox=0;function place(){const r=host!.getBoundingClientRect(),c=container===document.body?{left:-scrollX,top:-scrollY}:container.getBoundingClientRect();cw=r.width;ch=r.height;w=cw+pad*2;h=ch+pad*2;const vl=Math.max(0,r.left-pad),vw=Math.max(cw,Math.min(document.documentElement.clientWidth,r.right+pad)-vl);ox=vl-(r.left-pad);Object.assign(canvas.style,{left:`${vl-c.left}px`,top:`${r.top-c.top-pad}px`,width:`${vw}px`,height:`${h}px`});canvas.width=Math.round(vw*dpr);canvas.height=Math.round(h*dpr);ctx!.setTransform(dpr,0,0,dpr,-ox*dpr,0)}
 place();
 const rnd=(a:number,b:number)=>a+Math.random()*(b-a);
 const ribbons:Ribbon[]=Array.from({length:mode==='swirl'?6:5},(_,i)=>({phase:i/6*Math.PI*2+rnd(-.3,.3),speed:rnd(.75,1.15)*(i%2?1:-1)*(mode==='swirl'?1:.6),radius:rnd(.9,1.25),squash:rnd(.72,.95),width:rnd(5,11),length:rnd(1.6,2.6),wobble:rnd(6,14),tint:Math.random()}));
 // 金色从深到浅：底色、亮色、高光
 const gold=dark?[[201,154,74],[240,206,140],[255,244,214]]:[[150,108,40],[186,138,60],[226,190,120]];
 const start=performance.now();let raf=0,done=false,fadeFrom=0;
 function frame(now:number){if(done)return;if(document.hidden){raf=requestAnimationFrame(frame);return}
  const t=(now-start)/1000;ctx!.clearRect(ox,0,w,h);ctx!.globalCompositeOperation=dark?'lighter':'source-over';
  const cx=w/2,cy=h/2,R=Math.min(Math.max(cw,ch)*.5,(innerWidth/2-14)/1.3);
  // 整体透明度：淡入；swirl 被 stop 后淡出；burst 两秒内散开淡去
  let master=Math.min(1,t/.35);if(fadeFrom)master*=Math.max(0,1-(now-fadeFrom)/450);if(mode==='burst')master*=Math.max(0,1-t/1.9);
  if(master<=.01&&(fadeFrom||mode==='burst')&&t>.4){stop();return}
  // swirl 时半径随时间收拢，burst 时向外舒展
  const k=mode==='swirl'?1-.42*(1-Math.exp(-t*1.4)):1+.55*(1-Math.exp(-t*2.2));
  for(const rb of ribbons){const M=46,headA=rb.phase+t*rb.speed*2.4;const pts:[number,number][]=[];
   for(let j=0;j<=M;j++){const a=headA-Math.sign(rb.speed)*j/M*rb.length;const rr=R*rb.radius*k*(1+.08*Math.sin(a*3+rb.phase)),flutter=rb.wobble*Math.sin(a*2.2+t*5+rb.phase);
    pts.push([cx+Math.cos(a)*(rr+flutter),cy+Math.sin(a)*(rr+flutter)*rb.squash*(ch/Math.max(cw,1))*.62])}
   const c0=gold[rb.tint<.5?0:1],c1=gold[2];
   for(const [layer,widthK,alphaK] of [[0,2.6,.16],[1,1,.55],[2,.28,.9]] as const){
    for(let j=0;j<M;j++){const [x0,y0]=pts[j],[x1,y1]=pts[j+1];const u=j/M,taper=Math.sin(Math.PI*Math.min(1,u*1.05)),shimmer=.75+.25*Math.sin(u*9-t*7+rb.phase);
     const a=master*alphaK*taper*shimmer;if(a<=.004)continue;const col=layer===2?c1:c0;
     ctx!.strokeStyle=`rgba(${col[0]},${col[1]},${col[2]},${a.toFixed(3)})`;ctx!.lineWidth=Math.max(.6,rb.width*widthK*taper);ctx!.lineCap='round';ctx!.beginPath();ctx!.moveTo(x0,y0);ctx!.lineTo(x1,y1);ctx!.stroke()}}}
  ctx!.globalCompositeOperation='source-over';raf=requestAnimationFrame(frame)}
 const onResize=()=>place();window.addEventListener('resize',onResize);raf=requestAnimationFrame(frame);
 function stop(){if(done)return;if(mode==='swirl'&&!fadeFrom){fadeFrom=performance.now();return}done=true;cancelAnimationFrame(raf);window.removeEventListener('resize',onResize);canvas.remove()}
 return {stop}}
