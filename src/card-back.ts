// 牌背：极简「罗盘 + 菱形」，哑光古铜金细线。viewBox 0 0 240 400，随容器缩放；线宽不随缩放，大牌小牌一样细。
// 严格双向对称：先画上半部分（左上角再左右镜像），下半部分用“绕中心 (120,200) 旋转 180°”复用同一组图形，
// 所以牌倒过来看完全一样，翻牌前看不出正逆位。中心星盘按等角度生成，本身就是上下左右对称的。
// 金线渐变按 135° 方向从左上走到中心、再镜像走到右下（spreadMethod=reflect），光影也是 180° 对称的。
// 颜色全部走 CSS 变量（见 epic.css「牌背配色」）：深色是黑石底 + 古铜金，浅色是羊皮石膏白底 + 暗金压印。
// 同一页面里要放很多张时（牌阵页 78 张），用 cardBackSprite() 放一份定义，再用 cardBackUse() 引用，避免重复 78 份图形。
const W=240,H=400,CX=120,CY=200;
const f=(n:number)=>Number(n.toFixed(2));
const pt=(r:number,deg:number)=>{const a=deg*Math.PI/180;return [f(CX+r*Math.cos(a)),f(CY+r*Math.sin(a))] as const};
// 只保留晨启自己的「罗盘 + 菱形」：两道细框、四角三粒金点、一圈 15° 刻度的星盘、
// 上下中轴各一组三联月相，中心菱形是唯一带暖光的焦点；其余全是留白。下半部分同样由上半部分旋转 180° 得到。
function art(id:string){
 const gold=`url(#${id}-gold)`,subtle=`url(#${id}-subtle)`;
 const line=(w:number,paint=gold,extra='')=>`fill="none" stroke="${paint}" stroke-width="${w}" ${extra}vector-effect="non-scaling-stroke"`;
 const ticks=Array.from({length:24},(_,i)=>{const a=-90+i*15,[x1,y1]=pt(i%6===0?50:54,a),[x2,y2]=pt(59,a);return `M${x1} ${y1}L${x2} ${y2}`}).join('');
 const diamond=`M${CX} 170L${CX+17} ${CY}L${CX} 230L${CX-17} ${CY}Z`;
 // 三联月相：渐盈 · 满月 · 渐亏，旋转 180° 后形状不变
 const moons=`<path d="M108 40.5a3.5 3.5 0 0 0 0 7a4.8 4.8 0 0 1 0-7Z" fill="${gold}"/><circle cx="${CX}" cy="44" r="3.1" fill="${gold}"/><path d="M132 40.5a3.5 3.5 0 0 1 0 7a4.8 4.8 0 0 0 0-7Z" fill="${gold}"/>`;
 const dots=`<circle cx="26" cy="26" r="1.5" fill="${gold}"/><circle cx="32" cy="26" r=".8" fill="${gold}"/><circle cx="26" cy="32" r=".8" fill="${gold}"/>`;
 const top=`<g id="${id}-top">${moons}<path d="M${CX} 56V128" ${line(.5,subtle)}/><g id="${id}-tl">${dots}</g><use href="#${id}-tl" transform="matrix(-1 0 0 1 ${W} 0)"/></g>`;
 return `<defs>
<linearGradient id="${id}-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--cb-bg-a,#0B0E14)"/><stop offset="1" style="stop-color:var(--cb-bg-b,#07090D)"/></linearGradient>
<linearGradient id="${id}-gold" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${CX}" y2="${CY}" spreadMethod="reflect"><stop offset="0" style="stop-color:var(--cb-f0,#7A5C29)"/><stop offset=".45" style="stop-color:var(--cb-f1,#B89758)"/><stop offset="1" style="stop-color:var(--cb-f3,#C5A56E)"/></linearGradient>
<linearGradient id="${id}-subtle" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${CX}" y2="${CY}" spreadMethod="reflect"><stop offset="0" style="stop-color:var(--cb-f1,#B89758);stop-opacity:.3"/><stop offset="1" style="stop-color:var(--cb-f3,#C5A56E);stop-opacity:.45"/></linearGradient>
<filter id="${id}-blur" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="5"/></filter>
</defs>
<rect width="${W}" height="${H}" fill="url(#${id}-bg)"/>
<rect x="12" y="12" width="216" height="376" ${line(.75)}/><rect x="17" y="17" width="206" height="366" ${line(.5,subtle)}/>
<path d="M60 ${CY}H${W-60}" ${line(.5,subtle)}/>
<circle cx="${CX}" cy="${CY}" r="64" ${line(.75)}/><circle cx="${CX}" cy="${CY}" r="59" ${line(.5,subtle)}/><circle cx="${CX}" cy="${CY}" r="38" ${line(.5,subtle)}/><path d="${ticks}" ${line(.5)}/>
<path d="${diamond}" fill="none" stroke="var(--cb-glow,#E6C687)" stroke-width="7" stroke-opacity=".45" filter="url(#${id}-blur)"/>
<path d="${diamond}" style="fill:var(--cb-glow,#E6C687)" fill-opacity=".1" stroke="var(--cb-glow,#E6C687)" stroke-width="1.1" vector-effect="non-scaling-stroke"/><circle cx="${CX}" cy="${CY}" r="2.2" style="fill:var(--cb-glow,#E6C687)"/>
${top}<use href="#${id}-top" transform="rotate(180 ${CX} ${CY})"/>`}

let seq=0;
/** 一张完整的牌背 SVG（自带渐变定义，id 每次都不同，同页多张不会互相干扰）。 */
export function cardBack():string{const id=`cb${++seq}`;return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" class="card-back" aria-hidden="true" focusable="false">${art(id)}</svg>`}
/** 一页里要放很多张时：先放一份不可见的定义…… */
export const CARD_BACK_ID='daybreak-card-back';
export function cardBackSprite():string{return `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><symbol id="${CARD_BACK_ID}" viewBox="0 0 ${W} ${H}">${art('cbs')}</symbol></svg>`}
/** ……每张牌再引用它。 */
export function cardBackUse():string{return `<svg viewBox="0 0 ${W} ${H}" class="card-back" aria-hidden="true" focusable="false"><use href="#${CARD_BACK_ID}"/></svg>`}
