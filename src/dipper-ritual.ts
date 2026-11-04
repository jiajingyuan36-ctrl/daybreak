// 北斗仪式：在此刻此地的真实星空里，依次点亮北斗七星，斗柄转向哪里，就从那里取出今天的牌。
// 画面：Canvas 画背景星（按星等定大小和亮度，轻微闪烁）；SVG 画星图格线、地平线、78 张牌背的环、北斗、连线和星名；
// 七颗星各有一个真正的按钮（≥44×44，可 Tab / Enter 点亮）。只用主题色 --fg / --muted / --line：深色是黑底暖白星，浅色是纸底墨色星。
// 抽到哪张由调用方用 src/lib/dipper-draw.ts 的随机数决定，这里只负责把斗柄转到那张牌上。
import {DIPPER,BACKGROUND,dipperSky,duskSky,bearingLabel,seasonOf,HEGUANZI,pointerAngle,slotAngle,turnTo,project,labelPositions,type DipperSky} from './lib/dipper.ts';
import {cardBack} from './card-back.ts';
import {triggerHaptic} from './tactile.ts';

export const SLOTS=78;
const RING=0.93,VIEW=1.1,NS='http://www.w3.org/2000/svg';
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait=(ms:number)=>new Promise<void>(r=>setTimeout(r,ms));
const fmt=(n:number,d=3)=>n.toFixed(d);
const el=<K extends keyof SVGElementTagNameMap>(tag:K,attrs:Record<string,string|number>={},parent?:Element)=>{const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));parent?.appendChild(e);return e};
const pad=(n:number)=>String(n).padStart(2,'0');
const SEASON_DIR={春:'东',夏:'南',秋:'西',冬:'北'} as const;

export interface DipperOptions {lat:number;lon:number;estimated:boolean;now?:Date;
 /** 已经点亮过（换牌时用）：七星直接亮着，只做转动 */ lit?:boolean;
 onLight?:(order:number)=>void;onComplete?:()=>void}
export interface DipperRitual {sky:DipperSky;lightAll():void;turnAndPick(index:number):Promise<HTMLElement>;destroy():void}

export function mountDipper(host:HTMLElement,o:DipperOptions):DipperRitual{
 const now=o.now??new Date(),sky=dipperSky(now,o.lat,o.lon),quick=reduced();
 const pos=sky.stars.map(s=>[s.x,s.y] as [number,number]);
 const below=sky.stars.filter(s=>!s.above).length;
 const status=sky.sunAlt>-6?'天还亮着，看不见星星。这是北斗此刻在天上的位置。':below===7?'北斗此刻在地平线下，这是它此刻的位置。':below?`北斗有 ${below} 颗星此刻在地平线下（虚线以下）。`:'';
 const dusk=duskSky(now,o.lat,o.lon),season=dusk?seasonOf(dusk.handle):null;
 host.innerHTML=`<p class="dipper-meta dipper-away">${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} · ${pad(now.getHours())}:${pad(now.getMinutes())} · 北纬 ${Math.round(Math.abs(o.lat))}° 的此刻${o.estimated?'<span>（按时区估计，可在设置里改）</span>':''}</p>
<div class="dipper-sky dipper-away"><canvas aria-hidden="true"></canvas><div class="dipper-hits"></div></div>
<p class="dipper-hint" aria-live="polite">${o.lit?'七星已亮，斗柄正在转动':'从天枢开始，依次点亮七颗星'}</p>
${status?`<p class="dipper-status dipper-away">${status}</p>`:''}
<div class="dipper-actions dipper-away">${o.lit?'':'<button type="button" class="primary dipper-all"><span aria-hidden="true">✦</span>一键点亮</button>'}</div>
${dusk&&season?`<p class="dipper-season dipper-away">今天黄昏，斗柄指向${bearingLabel(dusk.handle)}。“斗柄${SEASON_DIR[season]}指，天下皆${season}。”<a href="${HEGUANZI.url}" target="_blank" rel="noreferrer">${HEGUANZI.source}</a></p>`:''}`;
 const skyBox=host.querySelector<HTMLElement>('.dipper-sky')!,canvas=skyBox.querySelector('canvas')!,hits=skyBox.querySelector<HTMLElement>('.dipper-hits')!;
 const hint=host.querySelector<HTMLElement>('.dipper-hint')!;

 // ---- SVG：格线、地平线、牌环、北斗 ----
 const svg=el('svg',{viewBox:`${-VIEW} ${-VIEW} ${2*VIEW} ${2*VIEW}`,class:'dipper-svg','aria-hidden':'true'});skyBox.insertBefore(svg,hits);
 el('circle',{r:1,class:'dp-rim'},svg);
 for(const dec of [80,70,60,50])el('circle',{r:fmt((90-dec)/50),class:'dp-grid'},svg);
 for(let h=0;h<24;h+=2){const ra=h*15,ha=sky.lst-ra,[x,y]=project(ha,40);el('line',{x1:0,y1:0,x2:fmt(x),y2:fmt(y),class:'dp-grid'},svg)}
 if(sky.horizon.length>1){el('path',{d:'M'+sky.horizon.map(([x,y])=>`${fmt(x)} ${fmt(y)}`).join('L'),class:'dp-horizon'},svg);const at=sky.horizon[Math.floor(sky.horizon.length*0.22)];el('text',{x:fmt(at[0]),y:fmt(at[1]+0.06),class:'dp-label dp-horizon-label','text-anchor':'middle'},svg).textContent='地平线'}
 // 面向正北看天：下方是北方地平，右边东，左边西，上方朝天顶、往南
 for(const [t,x,y] of [['北',0,1.075],['东',1.07,0.02],['西',-1.07,0.02],['南',0,-1.045]] as const)el('text',{x,y,class:'dp-label dp-compass','text-anchor':'middle'},svg).textContent=t;
 const ring=el('g',{class:'dp-ring'},svg),slots:SVGRectElement[]=[];
 for(let i=0;i<SLOTS;i++){const a=slotAngle(i,SLOTS)*Math.PI/180,x=RING*Math.cos(a),y=-RING*Math.sin(a);
  slots.push(el('rect',{x:-0.012,y:-0.021,width:0.024,height:0.042,class:'dp-slot',transform:`translate(${fmt(x,4)} ${fmt(y,4)}) rotate(${fmt(90-slotAngle(i,SLOTS),2)})`},ring))}
 // 北极星（不随北斗转）
 const pol=el('g',{class:'dp-polaris'},svg);el('circle',{cx:fmt(sky.polaris.x,4),cy:fmt(sky.polaris.y,4),r:0.016,class:'dp-pole-star'},pol);el('text',{x:fmt(sky.polaris.x+0.035,4),y:fmt(sky.polaris.y+0.012,4),class:'dp-label'},pol).textContent='北极星';
 const group=el('g',{class:'dp-dipper'},svg);
 // 斗柄延长线（开阳→摇光，一直到牌环），转动时才出现
 const [mz,ak]=[pos[5],pos[6]],base=pointerAngle(mz,ak,RING),hit=((a:number)=>[RING*Math.cos(a*Math.PI/180),-RING*Math.sin(a*Math.PI/180)])(base);
 const pointer=el('line',{x1:fmt(ak[0],4),y1:fmt(ak[1],4),x2:fmt(hit[0],4),y2:fmt(hit[1],4),class:'dp-pointer'},group);
 const lines=DIPPER.slice(1).map((_,i)=>el('line',{x1:fmt(pos[i][0],4),y1:fmt(pos[i][1],4),x2:fmt(pos[i+1][0],4),y2:fmt(pos[i+1][1],4),class:'dp-line',pathLength:1},group));
 // 斗口闭合：天权回到天枢这一笔在七星都亮之后再画
 const close=el('line',{x1:fmt(pos[3][0],4),y1:fmt(pos[3][1],4),x2:fmt(pos[0][0],4),y2:fmt(pos[0][1],4),class:'dp-line dp-close',pathLength:1},group);
 el('circle',{cx:fmt(sky.alcor.x,4),cy:fmt(sky.alcor.y,4),r:0.006,class:'dp-alcor'},group);
 const size=(m:number)=>0.009+(3.4-m)*0.0045;
 const stars=sky.stars.map((s,i)=>el('circle',{cx:fmt(s.x,4),cy:fmt(s.y,4),r:fmt(size(DIPPER[i].mag),4),class:`dp-star${s.above?'':' is-below'}`},group));
 // 星名放在离北斗中心更远的一侧；斗柄上的星挨得近，沿斗柄的垂线左右交替，免得字叠在一起
 const labelAt=labelPositions(pos,0.075).map(([x,y])=>[x,y+0.022] as [number,number]);
 const labels=sky.stars.map((_,i)=>{const t=el('text',{x:fmt(labelAt[i][0],4),y:fmt(labelAt[i][1],4),class:'dp-label dp-name','text-anchor':'middle'},group);t.textContent=DIPPER[i].zh;return t});

 // ---- 七个可点的星 ----
 const buttons=DIPPER.map((s,i)=>{const b=document.createElement('button');b.type='button';b.className='dp-hit';b.dataset.order=String(i);
  b.style.left=`${((pos[i][0]+VIEW)/(2*VIEW))*100}%`;b.style.top=`${((pos[i][1]+VIEW)/(2*VIEW))*100}%`;
  b.setAttribute('aria-label',`${s.zh}，${s.bayer.replace('UMa','大熊座')}，第 ${i+1} 颗`);hits.appendChild(b);return b});

 // ---- 背景星：Canvas，轻微闪烁 ----
 const ctx=canvas.getContext('2d');const tw=BACKGROUND.map(()=>[Math.random()*Math.PI*2,0.6+Math.random()*1.2]);
 let raf=0,alive=true,cssW=0;
 const fg=()=>getComputedStyle(host).color||'#e6e2d8';
 function draw(t:number){if(!ctx||!alive)return;const w=skyBox.clientWidth;if(!w)return;const dpr=Math.min(2,devicePixelRatio||1);
  if(cssW!==w){cssW=w;canvas.width=Math.round(w*dpr);canvas.height=Math.round(w*dpr)}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,w);ctx.fillStyle=fg();const scale=w/(2*VIEW),k=w/360;
  sky.background.forEach((s,i)=>{const r=Math.max(0.45,(4.9-s.mag)*0.55)*k,base=Math.min(0.9,0.22+(4.9-s.mag)*0.17)*(s.above?1:0.4),a=quick?base:base*(1+0.12*Math.sin(t/1000*tw[i][1]+tw[i][0]));
   ctx.globalAlpha=a;ctx.beginPath();ctx.arc((s.x+VIEW)*scale,(s.y+VIEW)*scale,r,0,Math.PI*2);ctx.fill()});
  ctx.globalAlpha=1}
 const loop=(t:number)=>{if(!alive)return;if(!document.hidden)draw(t);raf=requestAnimationFrame(loop)};
 if(quick)draw(0);else raf=requestAnimationFrame(loop);
 const onResize=()=>draw(performance.now());addEventListener('resize',onResize);
 if(!quick)host.animate({opacity:[0,1]},{duration:1200,easing:'ease-out'});

 // ---- 点亮 ----
 let lit=0,busy=false;
 function light(i:number,silent=false){if(i!==lit)return;lit++;stars[i].classList.add('is-lit');buttons[i].classList.add('is-lit');buttons[i].setAttribute('aria-pressed','true');
  if(!quick){const ring=el('circle',{cx:stars[i].getAttribute('cx')!,cy:stars[i].getAttribute('cy')!,r:0.03,class:'dp-ripple'},group);ring.animate({transform:['scale(.4)','scale(2.6)'],opacity:[0.9,0]},{duration:700,easing:'cubic-bezier(0.22,1,0.36,1)'}).finished.then(()=>ring.remove(),()=>ring.remove())}
  if(i>0){const l=lines[i-1];l.classList.add('is-drawn');if(!quick)l.animate({strokeDashoffset:[1,0]},{duration:300,easing:'ease-out'})}
  if(!silent)triggerHaptic('light');o.onLight?.(i);
  if(lit<7){hint.textContent=`已点亮 ${DIPPER[i].zh}，下一颗是 ${DIPPER[lit].zh}`;buttons[lit].focus({preventScroll:true})}
  else{close.classList.add('is-drawn');if(!quick)close.animate({strokeDashoffset:[1,0]},{duration:300,easing:'ease-out'});hint.textContent='七星已亮，斗柄要转了';host.querySelector('.dipper-all')?.setAttribute('disabled','');buttons.forEach(b=>b.disabled=true);triggerHaptic('success');o.onComplete?.()}}
 function wrong(i:number){if(busy)return;if(!quick)buttons[i].animate({translate:['0 0','-4px 0','4px 0','-2px 0','0 0']},{duration:300});hint.textContent=`先点 ${DIPPER[lit].zh}（第 ${lit+1} 颗）`;triggerHaptic('selection')}
 // 键盘和读屏软件：每颗星是一个按钮（Tab / Enter）
 buttons.forEach((b,i)=>b.onclick=e=>{if((e as MouseEvent).detail>0)return;if(i<lit)return;if(i===lit)light(i);else wrong(i)});
 // 指针点击：北斗在手机上很小，相邻两颗只隔十几像素，44px 的热区必然重叠。
 // 所以按“离哪颗最近”判断，并让下一颗优先：手指落在下一颗 22px 以内就算点中（有效热区 ≥ 44×44）
 const centers=()=>buttons.map(b=>{const r=b.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2] as [number,number]});
 function tap(x:number,y:number){if(busy||lit>=7)return;const c=centers(),d=c.map(([cx,cy])=>Math.hypot(x-cx,y-cy));
  if(d[lit]<=22){light(lit);return}let best=-1;d.forEach((v,i)=>{if(v<=22&&(best<0||v<d[best]))best=i});if(best>=0&&best>lit)wrong(best)}
 // 拖动：从下一颗星按下，划过去依次点亮
 let dragging=false;
 hits.addEventListener('pointerdown',e=>{if(e.button>0)return;const b=buttons[lit]?.getBoundingClientRect();if(b&&Math.hypot(e.clientX-(b.left+b.width/2),e.clientY-(b.top+b.height/2))<=22)dragging=true;tap(e.clientX,e.clientY)});
 const moveLight=(e:PointerEvent)=>{if(!dragging||lit>=7)return;const b=buttons[lit].getBoundingClientRect();if(Math.hypot(e.clientX-(b.left+b.width/2),e.clientY-(b.top+b.height/2))<26)light(lit)};
 const stopDrag=()=>{dragging=false};hits.addEventListener('pointermove',moveLight);addEventListener('pointerup',stopDrag);addEventListener('pointercancel',stopDrag);
 host.querySelector<HTMLButtonElement>('.dipper-all')?.addEventListener('click',async e=>{(e.currentTarget as HTMLButtonElement).disabled=true;while(lit<7){light(lit,true);if(!quick)await wait(150)}});
 if(o.lit){for(let i=0;i<7;i++){stars[i].classList.add('is-lit');buttons[i].disabled=true}lines.concat(close).forEach(l=>l.classList.add('is-drawn'));lit=7}

 // ---- 斗柄转到被抽中的那张牌 ----
 async function turnAndPick(index:number){busy=true;const target=slotAngle(index,SLOTS),turn=quick?((target-base)%360+360)%360:turnTo(base,target);
  pointer.classList.add('is-on');hint.textContent='斗柄正在转动';
  const dur=quick?0:1600+Math.min(1,turn/460)*900,start=performance.now();let last=-1;
  await new Promise<void>(done=>{const step=(now:number)=>{const t=dur?Math.min(1,(now-start)/dur):1,e=1-Math.pow(1-t,3),phi=turn*e;
   group.setAttribute('transform',`rotate(${fmt(-phi,3)})`);
   // 星名保持正立
   labels.forEach((l,i)=>l.setAttribute('transform',`rotate(${fmt(phi,3)} ${fmt(labelAt[i][0],4)} ${fmt(labelAt[i][1]-0.022,4)})`));
   const near=Math.round(((base+phi-90)%360+360)%360/(360/SLOTS))%SLOTS;if(near!==last){slots[last]?.classList.remove('is-near');slots[near].classList.add('is-near');last=near}
   if(t<1)requestAnimationFrame(step);else done()};requestAnimationFrame(step)});
  slots.forEach(s=>s.classList.remove('is-near'));slots[index].classList.add('is-chosen');triggerHaptic('medium');
  // 被指中的牌浮起：在牌环那个位置放一张真正的牌背，从小放大到 44px 宽
  const a=target*Math.PI/180,sx=RING*Math.cos(a),sy=-RING*Math.sin(a),box=skyBox.getBoundingClientRect(),hb=host.getBoundingClientRect(),unit=box.width/(2*VIEW);
  const pick=document.createElement('div');pick.className='dipper-pick';pick.innerHTML=cardBack();
  const w=44,h=w*5/3,cx=box.left-hb.left+(sx+VIEW)*unit,cy=box.top-hb.top+(sy+VIEW)*unit,inward=0.14*unit;
  Object.assign(pick.style,{width:`${w}px`,height:`${h}px`,left:`${cx-w/2-Math.cos(a)*inward}px`,top:`${cy-h/2+Math.sin(a)*inward}px`,rotate:`${fmt(90-target,2)}deg`});
  host.appendChild(pick);slots[index].classList.add('is-taken');
  if(!quick)await pick.animate({transform:[`translate(${Math.cos(a)*inward}px,${-Math.sin(a)*inward}px) scale(0.25)`,'translate(0,0) scale(1)'],opacity:[0.4,1]},{duration:420,easing:'cubic-bezier(0.22,1,0.36,1)'}).finished.catch(()=>{});
  return pick}
 return {sky,lightAll:()=>host.querySelector<HTMLButtonElement>('.dipper-all')?.click(),turnAndPick,destroy(){alive=false;cancelAnimationFrame(raf);removeEventListener('resize',onResize);removeEventListener('pointerup',stopDrag);removeEventListener('pointercancel',stopDrag)}}}
