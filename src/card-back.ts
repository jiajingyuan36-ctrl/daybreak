// 牌背：「夜空版画」，象牙白细线（2026-11-18 起；之前是罗盘 + 菱形的古铜金）。viewBox 0 0 240 400，随容器缩放；线宽不随缩放，大牌小牌一样细。
// 严格双向对称：先画上半部分（左上角再左右镜像），下半部分用“绕中心 (120,200) 旋转 180°”复用同一组图形，
// 所以牌倒过来看完全一样，翻牌前看不出正逆位。中心星盘按等角度生成，本身就是上下左右对称的。
// 金线渐变按 135° 方向从左上走到中心、再镜像走到右下（spreadMethod=reflect），光影也是 180° 对称的。
// 颜色全部走 CSS 变量（见 engraved.css「牌背配色」）：深色是墨黑底 + 象牙白线，浅色是羊皮纸底 + 墨线。
// 同一页面里要放很多张时（牌阵页 78 张），用 cardBackSprite() 放一份定义，再用 cardBackUse() 引用，避免重复 78 份图形。
const W=240,H=400,CX=120,CY=200;
const f=(n:number)=>Number(n.toFixed(2));
const pt=(r:number,deg:number)=>{const a=deg*Math.PI/180;return [f(CX+r*Math.cos(a)),f(CY+r*Math.sin(a))] as const};
// 「夜空版画」牌背（2026-11-18）：双线框、四角扇形光芒、中间一轮放射细光的满月，月里一颗四芒星；
// 上下各一列月落点线连到一弯新月。只画上半部分（左上角扇形再左右镜像），下半部分绕中心旋转 180° 复用。
const star=(cx:number,cy:number,r:number,w=r*.08)=>{const p:string[]=[];for(let i=0;i<8;i++){const a=(i*45-90)*Math.PI/180,L=i%2?r*.42:r,b1=a-Math.PI/2,b2=a+Math.PI/2,ww=i%2?w*.7:w;
 p.push(`M${f(cx+Math.cos(b1)*ww)} ${f(cy+Math.sin(b1)*ww)}L${f(cx+Math.cos(a)*L)} ${f(cy+Math.sin(a)*L)}L${f(cx+Math.cos(b2)*ww)} ${f(cy+Math.sin(b2)*ww)}Z`)}return p.join('')};
function art(id:string){
 const gold=`url(#${id}-gold)`,subtle=`url(#${id}-subtle)`;
 const line=(w:number,paint=gold,extra='')=>`fill="none" stroke="${paint}" stroke-width="${w}" ${extra}vector-effect="non-scaling-stroke"`;
 // 满月四周的放射细光：72 根，长短交替，等角度分布，本身上下左右对称
 const rays=Array.from({length:72},(_,i)=>{const a=i*5,[x1,y1]=pt(50,a),[x2,y2]=pt(i%2?58:i%6===0?74:64,a);return `M${x1} ${y1}L${x2} ${y2}`}).join('');
 // 左上角扇形：从角上放射的细线 + 两道弧
 const fanRays=Array.from({length:13},(_,i)=>{const a=(4+i*82/12)*Math.PI/180,L=i%2?18:26;return `M${f(18+Math.cos(a)*6)} ${f(18+Math.sin(a)*6)}L${f(18+Math.cos(a)*L)} ${f(18+Math.sin(a)*L)}`}).join('');
 const fan=`<path d="${fanRays}" ${line(.5)}/><path d="M47 18A29 29 0 0 1 18 47M50 18A32 32 0 0 1 18 50" ${line(.5,subtle)}/><circle cx="18" cy="18" r="1.6" fill="${gold}"/>`;
 // 月落点线：从上方新月一路由小到大落向满月
 const drops=Array.from({length:7},(_,i)=>`<circle cx="${CX}" cy="${f(78+i*9.5)}" r="${f(.55+i*.13)}" fill="${gold}"/>`).join('');
 const crescent=`<path d="M113.5 52a7 7 0 0 0 13 0a8.6 8.6 0 0 1-13 0Z" fill="${gold}"/>`;
 const top=`<g id="${id}-top">${crescent}<path d="${star(CX,40,6)}" fill="${gold}"/>${drops}<path d="${star(58,96,5)}${star(184,118,3.5)}${star(76,140,2.4)}" fill="${gold}"/><g id="${id}-tl">${fan}</g><use href="#${id}-tl" transform="matrix(-1 0 0 1 ${W} 0)"/></g>`;
 return `<defs>
<linearGradient id="${id}-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--cb-bg-a,#111013)"/><stop offset="1" style="stop-color:var(--cb-bg-b,#0A0A0C)"/></linearGradient>
<linearGradient id="${id}-gold" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${CX}" y2="${CY}" spreadMethod="reflect"><stop offset="0" style="stop-color:var(--cb-f0,#8C8472)"/><stop offset=".45" style="stop-color:var(--cb-f1,#CFC6B0)"/><stop offset="1" style="stop-color:var(--cb-f3,#EDE5D2)"/></linearGradient>
<linearGradient id="${id}-subtle" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${CX}" y2="${CY}" spreadMethod="reflect"><stop offset="0" style="stop-color:var(--cb-f1,#CFC6B0);stop-opacity:.3"/><stop offset="1" style="stop-color:var(--cb-f3,#EDE5D2);stop-opacity:.5"/></linearGradient>
<radialGradient id="${id}-moon" cx=".5" cy=".5" r=".5"><stop offset="0" style="stop-color:var(--cb-glow,#EDE5D2);stop-opacity:.16"/><stop offset=".85" style="stop-color:var(--cb-glow,#EDE5D2);stop-opacity:.04"/><stop offset="1" style="stop-color:var(--cb-glow,#EDE5D2);stop-opacity:0"/></radialGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#${id}-bg)"/>
<rect x="10" y="10" width="220" height="380" ${line(.65)}/><rect x="15" y="15" width="210" height="370" ${line(.5,subtle)}/>
<path d="M28 ${CY}H${CX-80}M${CX+80} ${CY}H${W-28}" ${line(.5,subtle)}/>
<circle cx="${CX}" cy="${CY}" r="46" fill="url(#${id}-moon)"/>
<path d="${rays}" ${line(.35,subtle)}/>
<circle cx="${CX}" cy="${CY}" r="46" ${line(.6)}/><circle cx="${CX}" cy="${CY}" r="41" ${line(.5,subtle)}/><circle cx="${CX}" cy="${CY}" r="80" ${line(.4,subtle,'stroke-dasharray="1 4" ')}/>
<path d="${star(CX,CY,22,1.4)}" style="fill:var(--cb-glow,#EDE5D2)" fill-opacity=".92"/><circle cx="${CX}" cy="${CY}" r="1.8" style="fill:var(--cb-glow,#EDE5D2)"/>
${top}<use href="#${id}-top" transform="rotate(180 ${CX} ${CY})"/>`}

let seq=0;
/** 一张完整的牌背 SVG（自带渐变定义，id 每次都不同，同页多张不会互相干扰）。 */
export function cardBack():string{const id=`cb${++seq}`;return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" class="card-back" aria-hidden="true" focusable="false">${art(id)}</svg>`}
/** 一页里要放很多张时：先放一份不可见的定义…… */
export const CARD_BACK_ID='daybreak-card-back';
export function cardBackSprite():string{return `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><symbol id="${CARD_BACK_ID}" viewBox="0 0 ${W} ${H}">${art('cbs')}</symbol></svg>`}
/** ……每张牌再引用它。 */
export function cardBackUse():string{return `<svg viewBox="0 0 ${W} ${H}" class="card-back" aria-hidden="true" focusable="false"><use href="#${CARD_BACK_ID}"/></svg>`}
