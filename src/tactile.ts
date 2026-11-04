// 全站按压反馈与触觉微震。
// - 按压：用 pointerdown/pointerup 给控件加 .is-pressed，CSS 负责“快速下沉 + 回弹”。
//   不靠 :active，是因为 iPhone Safari 上 :active 要额外的 touchstart 监听才生效，而且键盘空格/回车也要有同样的反馈。
// - 微震：navigator.vibrate 只有安卓等少数浏览器支持；iPhone Safari 不支持，静默跳过。
// - 用户开了“减少动态效果”时只保留颜色变化（CSS 里处理），微震也关掉。
export type Haptic='selection'|'light'|'medium'|'success';
const PATTERN:Readonly<Record<Haptic,number|number[]>>={selection:6,light:10,medium:16,success:[10,40,18]};
const reduced=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
export function triggerHaptic(type:Haptic='light'){try{if(!reduced()&&typeof navigator!=='undefined'&&'vibrate'in navigator)navigator.vibrate(PATTERN[type])}catch{}}

/** 会得到按压反馈的控件。牌堆和牌扇有自己的按压手感，不在这里。 */
export const PRESSABLE='button:not(.fan-card):not(.deck-pile),a.shared-brand,.shared-header nav a,.calendar-links a,.shared-footer a,[role="button"]:not(.deck-pile),.catalog-card,.history-item,.day.has-card,.zodiac-index a,.zodiac-pair-link,.deep-more,.ritual-link';

let installed=false;
export function initTactile(){if(installed||typeof document==='undefined')return()=>{};installed=true;
 let current:Element|null=null;
 const release=()=>{if(!current)return;const el=current;current=null;el.classList.remove('is-pressed');el.classList.add('is-releasing');setTimeout(()=>el.classList.remove('is-releasing'),460)};
 const down=(e:PointerEvent)=>{if(e.button>0)return;const el=(e.target as Element|null)?.closest?.(PRESSABLE);if(!el||(el as HTMLButtonElement).disabled||el.getAttribute('aria-disabled')==='true')return;release();current=el;el.classList.remove('is-releasing');el.classList.add('is-pressed')};
 // 手指滑出控件就松开（和原生按钮一样：滑走等于取消）
 const move=(e:PointerEvent)=>{if(!current)return;const r=current.getBoundingClientRect(),pad=12;if(e.clientX<r.left-pad||e.clientX>r.right+pad||e.clientY<r.top-pad||e.clientY>r.bottom+pad)release()};
 const key=(e:KeyboardEvent)=>{if(e.key!==' '&&e.key!=='Enter')return;const el=(e.target as Element|null)?.closest?.(PRESSABLE);if(!el)return;if(e.type==='keydown'){if(!e.repeat){current=el;el.classList.add('is-pressed')}}else release()};
 document.addEventListener('pointerdown',down,{passive:true});
 document.addEventListener('pointermove',move,{passive:true});
 for(const t of ['pointerup','pointercancel','dragstart'])document.addEventListener(t,release,{passive:true});
 window.addEventListener('blur',release);
 document.addEventListener('keydown',key);document.addEventListener('keyup',key);
 return()=>{installed=false;document.removeEventListener('pointerdown',down);document.removeEventListener('pointermove',move);for(const t of ['pointerup','pointercancel','dragstart'])document.removeEventListener(t,release);window.removeEventListener('blur',release);document.removeEventListener('keydown',key);document.removeEventListener('keyup',key)}}

/** 按钮进入“处理中 → 完成”的状态：处理中显示小菊花并锁住，完成后短暂显示 done 文案再恢复。 */
export async function busyButton(button:HTMLButtonElement,work:()=>Promise<unknown>,done='已保存',ms=1200){
 if(button.dataset.busy)return;button.dataset.busy='1';const label=button.innerHTML;button.disabled=true;button.classList.add('is-busy');button.setAttribute('aria-busy','true');
 try{await work();button.classList.remove('is-busy');button.classList.add('is-done');button.innerHTML=`<span class="done-mark" aria-hidden="true">✓</span>${done}`;triggerHaptic('success');await new Promise(r=>setTimeout(r,ms))}
 finally{button.classList.remove('is-busy','is-done');button.removeAttribute('aria-busy');button.innerHTML=label;button.disabled=false;delete button.dataset.busy}}
