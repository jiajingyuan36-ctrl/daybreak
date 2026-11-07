// 抽牌 → 牌面揭晓的过渡动画（只负责动画，不碰抽牌算法、正逆位和存储）。
// 四段：
//   1 locking   0–320ms     被抽中的牌浮起、泛微光；其余牌、提示和按钮向下收拢淡出
//   2 centering 320–750ms   牌背飞到结果页大牌的位置并放大到 1.05，在最高点停一下
//   3 flipping  750–1400ms  3D 翻面（90° 时最高），经过 60°–140° 时扫过一道香槟金折光
//   4 revealed  1300ms 起   牌名 → 解读 → 回望与按钮，每组相隔 80ms 从下往上浮现；1400ms 浮层撤掉，换成结果页原本的牌
// 用 Web Animations API 而不是 CSS 动画：全站 CSS 在“减少动态效果”时用 !important 关掉所有 animation/transition，
// 而且 body * 统一去掉了投影；WAAPI 不受这些规则影响，时间也能精确衔接。只动 transform、opacity、filter，不改布局。
export type DrawPhase='idle'|'locking'|'centering'|'flipping'|'revealed';
const PRESS='cubic-bezier(0.32,0.72,0,1)',SPRING='cubic-bezier(0.22,1,0.36,1)';
// 部分安卓浏览器（较老的内核）没有 Element.animate 或 Animation.finished：这时不播动画，直接显示结果，免得停在半途。
const canAnimate=typeof Element!=='undefined'&&typeof Element.prototype.animate==='function'&&typeof Animation!=='undefined'&&'finished'in Animation.prototype;
export const reducedMotion=()=>!canAnimate||(typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches);
const wait=(ms:number)=>new Promise<void>(r=>setTimeout(r,ms));
const done=(a:Animation|null)=>a?.finished?a.finished.then(()=>{},()=>{}):Promise.resolve();
/** 播放失败（浏览器不认某个属性等）时直接跳到终态，不报错 */
function play(el:HTMLElement,frames:Keyframe[]|PropertyIndexedKeyframes,opts:KeyframeAnimationOptions,end?:Partial<CSSStyleDeclaration>):Animation|null{
 if(canAnimate)try{return el.animate(frames,opts)}catch{}
 if(end)Object.assign(el.style,end);return null}

/** cubic-bezier 的反函数：给定进度 y，求时间 x（用来算出翻到 60° 和 140° 的时刻）。 */
function bezierTimeFor(y:number,x1:number,y1:number,x2:number,y2:number){
 const at=(t:number,a:number,b:number)=>3*a*t*(1-t)**2+3*b*t*t*(1-t)+t**3;
 let lo=0,hi=1;for(let i=0;i<40;i++){const t=(lo+hi)/2;if(at(t,y1,y2)<y)lo=t;else hi=t}
 return at((lo+hi)/2,x1,x2)}

/** 阶段 1：锁定。被抽中的牌浮起，其余元素淡出；320ms 后返回抽中牌的位置、宽度和倾角。 */
export async function lockStage(ritual:HTMLElement,picked:HTMLElement){
 const quick=reducedMotion();
 ritual.classList.add('draw-locked');picked.classList.remove('lift');picked.classList.add('is-drawn');
 const fromPile=picked.classList.contains('pile-card'),fromDipper=picked.classList.contains('dipper-pick');
 // 北斗仪式：退场的是星空、说明文字和按钮；牌扇方式：其余的牌
 const others=[...ritual.querySelectorAll<HTMLElement>(fromDipper?'.dipper-away,.dipper-hint,.ritual-switch':fromPile?'.pile-card,.shuffle-ring,.ritual-aura':'.fan-card,.deck-pile,.ritual-aura')].filter(el=>el!==picked);
 // 舞台中央只留这张牌：其余牌、提示、按钮淡出；标题、日期和心情也一起退场，免得换成结果页时突然跳掉
 const away=[...others,...ritual.querySelectorAll<HTMLElement>('.pick-hint,.primary.draw,.ritual-hint,.mood-row,h1,.ritual-date')];
 if(quick){away.forEach(el=>play(el,{opacity:[1,0]},{duration:150,fill:'forwards'},{opacity:'0'}));await wait(150);return measure(picked)}
 play(picked,{transform:['translate3d(0,0,0) scale(1)','translate3d(0,-14px,20px) scale(1.03)']},{duration:320,easing:SPRING,fill:'forwards'});
 away.forEach(el=>play(el,{opacity:[getComputedStyle(el).opacity,'0'],transform:['translateY(0) scale(1)','translateY(10px) scale(0.98)'],filter:['blur(0px)','blur(4px)']},{duration:280,easing:PRESS,fill:'forwards'},{opacity:'0'}));
 await wait(320);return measure(picked)}
function measure(el:HTMLElement){const r=el.getBoundingClientRect(),rot=getComputedStyle(el).rotate;return {cx:r.left+r.width/2,cy:r.top+r.height/2,width:el.offsetWidth*1.03,angle:rot&&rot!=='none'?parseFloat(rot):0}}
export type Source=ReturnType<typeof measure>;

/** 结果页先以“待揭晓”状态渲染：布局照常，大牌和文字暂时透明。 */
export function holdResult(result:HTMLElement){result.classList.add('reveal-pending','card-pending')}

/** 换一张：旧牌面和解读 200ms 向上模糊淡出，结束后才允许挂新内容。 */
export async function exitResult(result:HTMLElement){
 if(reducedMotion()){await done(play(result,{opacity:[1,0]},{duration:150,fill:'forwards'},{opacity:'0'}));return}
 await done(play(result,{opacity:[1,0],transform:['translateY(0) scale(1)','translateY(-8px) scale(0.98)'],filter:['blur(0px)','blur(4px)']},{duration:200,easing:PRESS,fill:'forwards'},{opacity:'0'}))}

export interface RevealOptions {backHtml:string;frontHtml:string;reversed:boolean;from?:Source|null;onPhase?:(p:DrawPhase)=>void}
/** 阶段 2–4。from 为空时（换一张）牌背直接在中心浮现。
 *  无论动画在哪一步出错、或者浏览器把计时器拖慢，最多 5 秒后一定撤掉浮层、显示真正的结果页，不会停在空框上。 */
export async function revealCard(result:HTMLElement,o:RevealOptions){
 let stage:HTMLElement|null=null;
 const finish=()=>{stage?.remove();stage=null;release(result);o.onPhase?.('revealed')};
 try{await Promise.race([animateReveal(result,o,s=>{stage=s}),wait(5000)])}catch{}finally{finish()}}
async function animateReveal(result:HTMLElement,o:RevealOptions,hold:(stage:HTMLElement)=>void){
 const target=result.querySelector<HTMLElement>('.tarot');if(!target){release(result);return}
 const front=new Image();front.src=(/src="([^"]+)"/.exec(o.frontHtml)||[])[1]||'';
 // 减少动态效果：不做位移和翻转，300ms 柔和淡入
 if(reducedMotion()){o.onPhase?.('revealed');release(result);await done(play(result,{opacity:[0,1]},{duration:300,easing:'ease'}));return}
 const r=target.getBoundingClientRect(),redraw=!o.from;
 // 浮层：固定在结果页大牌的位置，用 transform 从抽中那张牌的位置飞过来（FLIP）
 const stage=document.createElement('div');stage.className='draw-flight';stage.setAttribute('aria-hidden','true');
 Object.assign(stage.style,{left:`${r.left}px`,top:`${r.top}px`,width:`${r.width}px`,height:`${r.height}px`});
 stage.innerHTML=`<span class="flight-shadow"></span><div class="flight-card"><div class="flight-face flight-back">${o.backHtml}<i class="flight-sheen"></i></div><div class="flight-face flight-front tarot-plate${o.reversed?' is-reversed':''}">${o.frontHtml}<i class="flight-sheen"></i></div></div>`;
 document.body.appendChild(stage);hold(stage);
 const card=stage.querySelector<HTMLElement>('.flight-card')!,shadow=stage.querySelector<HTMLElement>('.flight-shadow')!,sheens=[...stage.querySelectorAll<HTMLElement>('.flight-sheen')];
 const apex='translate(0px,0px) rotate(0deg) scale(1.05)';
 // 阶段 2：归位 + 最高点屏息
 o.onPhase?.('centering');
 const travel=redraw?220:340,hover=redraw?60:90;
 if(o.from){const f=o.from,dx=f.cx-(r.left+r.width/2),dy=f.cy-(r.top+r.height/2),s=f.width/r.width;
  stage.animate([{transform:`translate(${dx}px,${dy}px) rotate(${f.angle}deg) scale(${s})`,easing:SPRING},{transform:apex,offset:travel/(travel+hover)},{transform:apex}],{duration:travel+hover,fill:'forwards'})}
 else stage.animate([{opacity:0,transform:'scale(0.94)',easing:SPRING},{opacity:1,transform:apex,offset:travel/(travel+hover)},{opacity:1,transform:apex}],{duration:travel+hover,fill:'forwards'});
 shadow.animate({opacity:[0,1],transform:['scale(0.9)','scale(1.12)']},{duration:travel,easing:SPRING,fill:'forwards'});
 // 牌面图要在翻面前解码好，否则翻过来是空的；网速慢时最多再等 700ms
 await wait(travel+hover);if(!front.complete)await Promise.race([typeof front.decode==='function'?front.decode().catch(()=>{}):wait(700),wait(700)]);
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
 await wait(100);result.classList.remove('card-pending');stage.remove();
 await wait(660)}
function release(result:HTMLElement){result.classList.remove('reveal-pending','card-pending')}
