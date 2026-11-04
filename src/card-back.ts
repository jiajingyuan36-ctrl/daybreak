// 牌背：「星盘月相 · 双向对称金箔神圣几何」。viewBox 0 0 240 400，随容器缩放。
// 严格双向对称：先画上半部分（左上角再左右镜像），下半部分用“绕中心 (120,200) 旋转 180°”复用同一组图形，
// 所以牌倒过来看完全一样，翻牌前看不出正逆位。中心星盘按等角度生成，本身就是上下左右对称的。
// 金箔渐变按 135° 方向从左上走到中心、再镜像走到右下（spreadMethod=reflect），边缘高光上下各一道：
// 光影也是 180° 对称的，不会因为明暗分布泄露正逆位。
// 颜色全部走 CSS 变量（见 epic.css「牌背配色」）：深色是黑石底 + 香槟金箔，浅色是羊皮石膏白底 + 暗金压印。
// 同一页面里要放很多张时（牌阵页 78 张），用 cardBackSprite() 放一份定义，再用 cardBackUse() 引用，避免重复 78 份图形。
const W=240,H=400,CX=120,CY=200;
const f=(n:number)=>Number(n.toFixed(2));
const pt=(r:number,deg:number)=>{const a=deg*Math.PI/180;return [f(CX+r*Math.cos(a)),f(CY+r*Math.sin(a))] as const};
/** 四角星芒：中心 (x,y)，长臂 r，腰宽 w */
const spark=(x:number,y:number,r:number,w=r*.22)=>`M${f(x)} ${f(y-r)}L${f(x+w)} ${f(y-w)}L${f(x+r)} ${f(y)}L${f(x+w)} ${f(y+w)}L${f(x)} ${f(y+r)}L${f(x-w)} ${f(y+w)}L${f(x-r)} ${f(y)}L${f(x-w)} ${f(y-w)}Z`;
/** 四角向内弯的矩形框：框离边缘 inset；四个弯弧的圆心是角点 (corner,corner) 等，半径 r。
 * 弯弧和框边的交点离角点 d = corner + √(r² − (inset − corner)²)，例如 inset=18、corner=18、r=14 时 d=32。 */
/** 内弯角框的上半圈（左边中点 → 右边中点），下半圈用旋转 180° 复制，虚线的起点位置才会上下一致。 */
const scallopTop=(inset:number,corner:number,r:number)=>{
 const d=f(corner+Math.sqrt(r*r-(inset-corner)**2)),L=inset,T=inset,R=W-inset,dR=f(W-d);
 return `M${L} ${CY}V${d}A${r} ${r} 0 0 1 ${d} ${T}H${dR}A${r} ${r} 0 0 1 ${R} ${d}V${CY}`};
const scallop=(inset:number,corner:number,r:number)=>{
 const d=f(corner+Math.sqrt(r*r-(inset-corner)**2)),L=inset,T=inset,R=W-inset,B=H-inset,dR=f(W-d),dB=f(H-d);
 return `M${d} ${T}H${dR}A${r} ${r} 0 0 0 ${R} ${d}V${dB}A${r} ${r} 0 0 0 ${dR} ${B}H${d}A${r} ${r} 0 0 0 ${L} ${dB}V${d}A${r} ${r} 0 0 0 ${d} ${T}Z`};

function art(id:string){
 const gold=`url(#${id}-gold)`,subtle=`url(#${id}-subtle)`;
 const line=(w:number,paint=gold,extra='')=>`fill="none" stroke="${paint}" stroke-width="${w}" ${extra}vector-effect="non-scaling-stroke"`;
 // 放射光线：32 道，长短交替，从星盘外缘向外
 const rays=Array.from({length:32},(_,i)=>{const a=-90+i*11.25,[x1,y1]=pt(71,a),[x2,y2]=pt(i%2?79:85,a);return `M${x1} ${y1}L${x2} ${y2}`}).join('');
 // 双环之间的 12 道宫位刻度与 12 颗微星
 const ticks=Array.from({length:12},(_,i)=>{const a=-90+i*30,[x1,y1]=pt(62,a),[x2,y2]=pt(68,a);return `M${x1} ${y1}L${x2} ${y2}`}).join('');
 const dots=Array.from({length:12},(_,i)=>{const [x,y]=pt(65,-75+i*30);return `<circle cx="${x}" cy="${y}" r="1.2" fill="${gold}"/>`}).join('');
 // 八芒星结构：两个正方形交错 45°
 const square=(rot:number)=>'M'+Array.from({length:4},(_,k)=>pt(56,rot+k*90).join(' ')).join('L')+'Z';
 // 八角罗盘主星芒：正方向外径 48，斜方向 36，内径 10
 const compass='M'+Array.from({length:16},(_,k)=>pt(k%2?10:(k%4===0?48:36),-90+k*22.5).join(' ')).join('L')+'Z';
 const facets=Array.from({length:8},(_,k)=>{const [x,y]=pt(k%2?36:48,-90+k*45);return `M${CX} ${CY}L${x} ${y}`}).join('');
 // 上半部分（下半部分由它旋转 180° 得到）
 const crescent=`M112.01 114.14A9 9 0 1 1 127.99 114.14A8 8 0 0 0 112.01 114.14Z`; // 开口朝向星盘中心
 const [oa1x,oa1y]=pt(86,-90-20),[oa2x,oa2y]=pt(86,-90+20);
 const corner=`<path d="${spark(24,24,5.5)}" fill="${gold}"/><circle cx="31.4" cy="20.6" r=".9" fill="${gold}"/><circle cx="20.6" cy="31.4" r=".9" fill="${gold}"/>`;
 // 左上角星图：四颗大小不同的星，实线 + 虚线相连，另有几粒星尘
 const constellation=`<path d="M44 60L61 49L75 69" ${line(.5,subtle)}/><path d="M75 69L58 93" ${line(.5,subtle,'stroke-dasharray="1.5 2.5" ')}/>`
  +[[44,60,1.6],[61,49,1],[75,69,1.4],[58,93,1.2]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${gold}"/>`).join('')
  +[[36,82,.6],[86,44,.5],[48,112,.7],[90,96,.5],[32,128,.5],[70,120,.6]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${gold}" opacity=".6"/>`).join('')
  +`<path d="${spark(61,49,3.2,.6)}" fill="${gold}" opacity=".9"/>`;
 const top=`<g id="${id}-top">
<path d="M120 34V62M120 86V101" ${line(.6,subtle)}/><circle cx="120" cy="31" r="1.3" fill="${gold}"/>
<circle cx="120" cy="74" r="9" style="fill:var(--cb-bg-a,#17151E)" ${line(.75)}/><path d="M120 66.5A7.5 7.5 0 0 0 120 81.5Z" fill="${gold}" opacity=".85"/><circle cx="120" cy="74" r="7.5" ${line(.4,subtle)}/>
<path d="${spark(101,74,3.6,.7)}" fill="${gold}"/><path d="${spark(139,74,3.6,.7)}" fill="${gold}"/>
<path d="${spark(120,96,3.2,.6)}" fill="${gold}"/>
<path d="M${oa1x} ${oa1y}A86 86 0 0 1 ${oa2x} ${oa2y}" ${line(.4,subtle,'stroke-dasharray="1 2.5" ')}/>
<path d="${crescent}" fill="${gold}"/>
<g id="${id}-tl">${corner}${constellation}</g><use href="#${id}-tl" transform="matrix(-1 0 0 1 ${W} 0)"/>
</g>`;
 return `<defs>
<radialGradient id="${id}-bg" cx=".5" cy=".5" r=".75"><stop offset="0" style="stop-color:var(--cb-bg-a,#17151E)"/><stop offset="1" style="stop-color:var(--cb-bg-b,#0B0A0F)"/></radialGradient>
<radialGradient id="${id}-glow" cx=".5" cy=".5" r=".5"><stop offset="0" style="stop-color:var(--cb-glow,#C5A059);stop-opacity:.12"/><stop offset="1" style="stop-color:var(--cb-glow,#C5A059);stop-opacity:0"/></radialGradient>
<linearGradient id="${id}-gold" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${CX}" y2="${CY}" spreadMethod="reflect"><stop offset="0" style="stop-color:var(--cb-f0,#7A5C29)"/><stop offset=".28" style="stop-color:var(--cb-f1,#C5A059)"/><stop offset=".5" style="stop-color:var(--cb-f2,#FFF2CC)"/><stop offset=".72" style="stop-color:var(--cb-f3,#D4AF37)"/><stop offset="1" style="stop-color:var(--cb-f4,#6B4F22)"/></linearGradient>
<linearGradient id="${id}-subtle" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${CX}" y2="${CY}" spreadMethod="reflect"><stop offset="0" style="stop-color:var(--cb-f1,#C5A059);stop-opacity:.35"/><stop offset=".5" style="stop-color:var(--cb-f2,#FFF2CC);stop-opacity:.65"/><stop offset="1" style="stop-color:var(--cb-f3,#D4AF37);stop-opacity:.35"/></linearGradient>
<linearGradient id="${id}-hl" x1="0" y1="0" x2="0" y2=".5" spreadMethod="reflect"><stop offset="0" style="stop-color:var(--cb-hl,#FFF2CC);stop-opacity:.35"/><stop offset=".06" style="stop-color:var(--cb-hl,#FFF2CC);stop-opacity:0"/></linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#${id}-bg)"/><ellipse cx="${CX}" cy="${CY}" rx="120" ry="150" fill="url(#${id}-glow)"/>
<rect x="12" y="12" width="216" height="376" rx="8" ${line(1.2)}/>
<path d="${scallop(18,18,14)}" ${line(.75)}/>
<path id="${id}-track" d="${scallopTop(22,18,18)}" ${line(.5,subtle,'stroke-dasharray="1.5 3.5" ')}/><use href="#${id}-track" transform="rotate(180 ${CX} ${CY})"/>
<path d="${rays}" ${line(.4,subtle)}/>
<circle cx="${CX}" cy="${CY}" r="68" ${line(1)}/><circle cx="${CX}" cy="${CY}" r="62" ${line(.5)}/>
<path d="${ticks}" ${line(.6)}/>${dots}
<path d="${square(-90)}" ${line(.75)}/><path d="${square(-45)}" ${line(.75)}/>
<circle cx="${CX}" cy="${CY}" r="40" ${line(.5,subtle)}/>
<path d="${compass}" fill="${gold}" fill-opacity=".16" ${line(.6).replace('fill="none" ','')}/>
<path d="${facets}" ${line(.4,subtle)}/>
<circle cx="${CX}" cy="${CY}" r="7" ${line(.5)}/><circle cx="${CX}" cy="${CY}" r="5" style="fill:var(--cb-bg-a,#17151E)" ${line(.5).replace('fill="none" ','')}/><circle cx="${CX}" cy="${CY}" r="3" fill="${gold}"/>
${top}<use href="#${id}-top" transform="rotate(180 ${CX} ${CY})"/>
<rect x=".5" y=".5" width="${W-1}" height="${H-1}" fill="none" stroke="url(#${id}-hl)" stroke-width="1"/>`}

let seq=0;
/** 一张完整的牌背 SVG（自带渐变定义，id 每次都不同，同页多张不会互相干扰）。 */
export function cardBack():string{const id=`cb${++seq}`;return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" class="card-back" aria-hidden="true" focusable="false">${art(id)}</svg>`}
/** 一页里要放很多张时：先放一份不可见的定义…… */
export const CARD_BACK_ID='daybreak-card-back';
export function cardBackSprite():string{return `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><symbol id="${CARD_BACK_ID}" viewBox="0 0 ${W} ${H}">${art('cbs')}</symbol></svg>`}
/** ……每张牌再引用它。 */
export function cardBackUse():string{return `<svg viewBox="0 0 ${W} ${H}" class="card-back" aria-hidden="true" focusable="false"><use href="#${CARD_BACK_ID}"/></svg>`}
