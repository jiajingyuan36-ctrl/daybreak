// 抽牌 → 牌面揭晓的过渡动画（只负责动画，不碰抽牌算法、正逆位和存储）。
// 四段：
//   1 locking   0–320ms     被抽中的牌浮起、泛微光；其余牌、提示和按钮向下收拢淡出
//   2 centering 320–750ms   牌背飞到结果页大牌的位置并放大到 1.05，在最高点停一下
//   3 flipping  750–1400ms  3D 翻面（90° 时最高），经过 60°–140° 时扫过一道香槟金折光
//   4 revealed  1300ms 起   牌名 → 解读 → 回望与按钮，每组相隔 80ms 从下往上浮现；1400ms 浮层撤掉，换成结果页原本的牌
// 用 Web Animations API 而不是 CSS 动画：全站 CSS 在“减少动态效果”时用 !important 关掉所有 animation/transition，
// 而且 body * 统一去掉了投影；WAAPI 不受这些规则影响，时间也能精确衔接。只动 transform 和 opacity，不改布局。
//
// 防卡顿（2026-11-17）：锁定一开始就把抽中的牌换成浮层（.draw-flight），浮层在原位浮起后继续极慢地上浮（drift）。
// 结果页的整页渲染（几十到几百毫秒的主线程工作）就发生在这段上浮里：transform 动画在合成线程上跑，主线程忙也不掉帧。
// 渲染完再从浮层“此刻的位置”接着飞向大牌，所以不管手机快慢，画面都不会停一下。
// 规则：动画开始之后不要再同步读样式（getComputedStyle、getBoundingClientRect），不要给大片元素做 filter: blur；
// 新增重活放进 drift 里或揭晓之后。scripts/check-draw-jank.mjs 会量这一点（见 CLAUDE.md）。
export type DrawPhase='idle'|'locking'|'centering'|'flipping'|'revealed';
const PRESS='cubic-bezier(0.32,0.72,0,1)',SPRING='cubic-bezier(0.22,1,0.36,1)';
// 部分安卓浏览器（较老的内核）没有 Element.animate 或 Animation.finished：这时不播动画，直接显示结果，免得停在半途。
const canAnimate=typeof Element!=='undefined'&&typeof Element.prototype.animate==='function'&&typeof Animation!=='undefined'&&'finished'in Animation.prototype;
export const reducedMotion=()=>!canAnimate||(typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches);
const wait=(ms:number)=>new Promise<void>(r=>setTimeout(r,ms));
const done=(a:Animation|null)=>a?.finished?a.finished.then(()=>{},()=>{}):Promise.resolve();
const mark=(name:string)=>{try{performance.mark(name)}catch{}};
/** 播放失败（浏览器不认某个属性等）时直接跳到终态，不报错 */
function play(el:HTMLElement,frames:Keyframe[]|PropertyIndexedKeyframes,opts:KeyframeAnimationOptions,end?:Partial<CSSStyleDeclaration>):Animation|null{
 if(canAnimate)try{return el.animate(frames,opts)}catch{}
 if(end)Object.assign(el.style,end);return null}

/** cubic-bezier 的反函数：给定进度 y，求时间 x（用来算出翻到 60° 和 140° 的时刻）。 */
function bezierTimeFor(y:number,x1:number,y1:number,x2:number,y2:number){
 const at=(t:number,a:number,b:number)=>3*a*t*(1-t)**2+3*b*t*t*(1-t)+t**3;
 let lo=0,hi=1;for(let i=0;i<40;i++){const t=(lo+hi)/2;if(at(t,y1,y2)<y)lo=t;else hi=t}
 return at((lo+hi)/2,x1,x2)}

export interface Faces {backHtml:string;frontHtml:string}
/** 浮层：一张两面的牌（背面在前，正面转 180° 藏在后面）。正面图片随浮层一起开始下载和解码。 */
function makeStage(f:Faces){
 const stage=document.createElement('div');stage.className='draw-flight';stage.setAttribute('aria-hidden','true');
 stage.innerHTML=`<span class="flight-shadow"></span><div class="flight-card"><div class="flight-face flight-back">${f.backHtml}<i class="flight-sheen"></i></div><div class="flight-face flight-front tarot-plate">${f.frontHtml}<i class="flight-sheen"></i></div></div>`;
 const img=stage.querySelector<HTMLImageElement>('.flight-front img');if(img){img.loading='eager';img.decoding='async'}
 return stage}
const box=(stage:HTMLElement,cx:number,cy:number,w:number,h:number)=>Object.assign(stage.style,{left:`${cx-w/2}px`,top:`${cy-h/2}px`,width:`${w}px`,height:`${h}px`});
const pose=(angle:number,y:number,s:number)=>`translate(0px,${y}px) rotate(${angle}deg) scale(${s})`;

export interface Source {stage:HTMLElement;cx:number;cy:number;w:number;h:number;drift:Animation|null}

/** 阶段 1：锁定。抽中的牌换成浮层在原位浮起，其余元素淡出；320ms 后返回（浮层这时还在慢慢上浮）。
 *  所有尺寸和样式都在改任何东西之前一次读完，之后只写不读，免得逼浏览器在动画开始前同步重算。 */
export async function lockStage(ritual:HTMLElement,picked:HTMLElement,faces:Faces):Promise<Source|null>{
 const quick=reducedMotion();
 const fromPile=picked.classList.contains('pile-card'),fromDipper=picked.classList.contains('dipper-pick');
 // 北斗仪式：退场的是星空、说明文字和按钮；牌扇方式：其余的牌
 const others=[...ritual.querySelectorAll<HTMLElement>(fromDipper?'.dipper-away,.dipper-hint,.ritual-switch':fromPile?'.pile-card,.shuffle-ring,.ritual-aura':'.fan-card,.deck-pile,.ritual-aura')].filter(el=>el!==picked);
 // 舞台中央只留这张牌：其余牌、提示、按钮淡出；标题、日期和心情也一起退场，免得换成结果页时突然跳掉
 const away=[...new Set([...others,...ritual.querySelectorAll<HTMLElement>('.pick-hint,.primary.draw,.ritual-hint,.mood-row,.ritual-switch,.brand-promise,h1,.ritual-date')])];
 // —— 只读 ——
 const r=picked.getBoundingClientRect(),w=picked.offsetWidth||r.width,h=picked.offsetHeight||r.height,rot=getComputedStyle(picked).rotate;
 const angle=rot&&rot!=='none'?parseFloat(rot)||0:0,cx=r.left+r.width/2,cy=r.top+r.height/2;
 const from=away.map(el=>getComputedStyle(el).opacity);
 // —— 只写 ——
 ritual.classList.add('draw-locked');picked.classList.remove('lift');picked.classList.add('is-drawn');
 if(quick){away.forEach(el=>play(el,{opacity:[1,0]},{duration:150,fill:'forwards'},{opacity:'0'}));await wait(150);return null}
 const stage=makeStage(faces);box(stage,cx,cy,w,h);stage.style.transform=pose(angle,0,1);document.body.appendChild(stage);
 picked.style.visibility='hidden';
 // 浮起 320ms，然后 1.6 秒里再极慢地上浮 8px、放大一点：结果页就在这段时间里渲染
 const lift=320,driftMs=1600;mark('draw:cover-start');
 const drift=play(stage,[{transform:pose(angle,0,1),easing:SPRING},{transform:pose(angle,-14,1.03),offset:lift/(lift+driftMs),easing:'cubic-bezier(.3,0,.4,1)'},{transform:pose(angle,-22,1.06)}],{duration:lift+driftMs,fill:'forwards'});
 away.forEach((el,i)=>play(el,{opacity:[from[i],'0'],transform:['translateY(0) scale(1)','translateY(10px) scale(0.98)']},{duration:280,easing:PRESS,fill:'forwards'},{opacity:'0'}));
 await wait(lift);return {stage,cx,cy,w,h,drift}}

/** 结果页先以“待揭晓”状态渲染：布局照常，大牌和文字暂时透明。 */
/** 牌的「待揭晓」挂在牌自己身上（.tarot.is-pending），揭晓时只重算这张牌，不重算整个结果区（2026-11-20 量过，后者在慢手机上要 60–120ms） */
export function holdResult(result:HTMLElement){result.classList.add('reveal-pending');result.querySelector('.tarot')?.classList.add('is-pending')}

/** 换一张：旧牌面和解读 200ms 向上淡出，结束后才允许挂新内容。 */
export async function exitResult(result:HTMLElement){
 if(reducedMotion()){await done(play(result,{opacity:[1,0]},{duration:150,fill:'forwards'},{opacity:'0'}));return}
 await done(play(result,{opacity:[1,0],transform:['translateY(0) scale(1)','translateY(-8px) scale(0.98)']},{duration:200,easing:PRESS,fill:'forwards'},{opacity:'0'}))}

export interface RevealOptions extends Faces {reversed:boolean;from?:Source|null;onPhase?:(p:DrawPhase)=>void}
/** 阶段 2–4。from 为空时（换一张）牌背直接在中心浮现。
 *  无论动画在哪一步出错、或者浏览器把计时器拖慢，最多 5 秒后一定撤掉浮层、显示真正的结果页，不会停在空框上。 */
export async function revealCard(result:HTMLElement,o:RevealOptions){
 let stage:HTMLElement|null=o.from?.stage??null;
 const finish=()=>{stage?.remove();stage=null;release(result);o.onPhase?.('revealed');mark('draw:reveal-end')};
 try{await Promise.race([animateReveal(result,o,s=>{stage=s}),wait(5000)])}catch{}finally{finish()}}
async function animateReveal(result:HTMLElement,o:RevealOptions,hold:(stage:HTMLElement)=>void){
 const target=result.querySelector<HTMLElement>('.tarot');
 if(!target||reducedMotion()){
  // 减少动态效果：不做位移和翻转，300ms 柔和淡入
  o.from?.stage.remove();o.onPhase?.('revealed');release(result);if(target)await done(play(result,{opacity:[0,1]},{duration:300,easing:'ease'}));return}
 const r=target.getBoundingClientRect(),f=o.from,redraw=!f;
 // 浮层挪到结果页大牌的位置；用 transform 把它摆回“此刻看到的样子”，再飞过去（FLIP）
 let start='scale(0.94)';
 const stage=f?.stage??makeStage(o);
 if(f){
  // 读 drift 当前的变换（合成线程上一直在动），换算到新尺寸下，接着动，不跳也不停
  const m=new DOMMatrix(getComputedStyle(stage).transform),k=f.w/r.width,dx=f.cx-(r.left+r.width/2),dy=f.cy-(r.top+r.height/2);
  if(f.drift&&f.drift.playState==='finished')mark('draw:cover-overrun');
  start=new DOMMatrix([m.a*k,m.b*k,m.c*k,m.d*k,m.e+dx,m.f+dy]).toString();
  f.drift?.cancel()}
 mark('draw:cover-end');
 box(stage,r.left+r.width/2,r.top+r.height/2,r.width,r.height);stage.style.transform=start;
 stage.querySelector('.flight-front')?.classList.toggle('is-reversed',o.reversed);
 if(!stage.isConnected)document.body.appendChild(stage);hold(stage);
 const card=stage.querySelector<HTMLElement>('.flight-card')!,shadow=stage.querySelector<HTMLElement>('.flight-shadow')!,sheens=[...stage.querySelectorAll<HTMLElement>('.flight-sheen')];
 const front=stage.querySelector<HTMLImageElement>('.flight-front img');
 const apex='translate(0px,0px) rotate(0deg) scale(1.05)';
 // 阶段 2：归位 + 最高点屏息
 o.onPhase?.('centering');
 const travel=redraw?220:340,hover=redraw?60:90;
 if(f)stage.animate([{transform:start,easing:SPRING},{transform:apex,offset:travel/(travel+hover)},{transform:apex}],{duration:travel+hover,fill:'forwards'});
 else stage.animate([{opacity:0,transform:start,easing:SPRING},{opacity:1,transform:apex,offset:travel/(travel+hover)},{opacity:1,transform:apex}],{duration:travel+hover,fill:'forwards'});
 shadow.animate({opacity:[0,1],transform:['scale(0.9)','scale(1.12)']},{duration:travel,easing:SPRING,fill:'forwards'});
 // 牌面图要在翻面前解码好，否则翻过来是空的；图片从锁定那一刻就开始加载，网速慢时最多再等 700ms
 await wait(travel+hover);if(front&&!front.complete)await Promise.race([typeof front.decode==='function'?front.decode().catch(()=>{}):wait(700),wait(700)]);
 // 阶段 3：3D 翻转。90° 时沿 Z 轴抬到最高，180° 时落回；外层同时从 1.05 收回 1
 o.onPhase?.('flipping');
 const flip=redraw?560:650;
 card.animate([{transform:'rotateY(0deg) translateZ(0px) scale(1)'},{transform:'rotateY(90deg) translateZ(36px) scale(1.06)'},{transform:'rotateY(180deg) translateZ(0px) scale(1)'}],{duration:flip,easing:SPRING,fill:'forwards'});
 stage.animate({transform:[apex,'translate(0px,0px) rotate(0deg) scale(1)']},{duration:flip,easing:SPRING,fill:'forwards'});
 shadow.animate({opacity:[1,0],transform:['scale(1.12)','scale(0.96)']},{duration:flip,easing:SPRING,fill:'forwards'});
 // 折光：按缓动曲线算出转到 60° 和 140° 的时刻，只在这段里扫过
 const t60=bezierTimeFor(60/180,.22,1,.36,1)*flip,t140=bezierTimeFor(140/180,.22,1,.36,1)*flip,sweep=Math.max(90,t140-t60);
 sheens.forEach(el=>el.animate([{opacity:0,transform:'translateX(-120%)'},{opacity:1,offset:.25},{opacity:1,offset:.75},{opacity:0,transform:'translateX(120%)'}],{duration:sweep,delay:t60,easing:'linear',fill:'both'}));
 // 阶段 4：落定前 100ms 开始，正文按模块依次浮现
 await wait(flip-100);o.onPhase?.('revealed');result.classList.remove('reveal-pending');
 result.classList.add('editorial-reveal');
 await wait(100);target.classList.remove('is-pending');stage.remove();
 await wait(660)}
function release(result:HTMLElement){result.classList.remove('reveal-pending');result.querySelector('.tarot')?.classList.remove('is-pending')}
