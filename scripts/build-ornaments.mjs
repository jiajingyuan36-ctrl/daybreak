// 生成「夜空版画」界面装饰：四角扇形光芒、四芒星、分隔线、月落点线、远山水面、星空。
// 每个装饰都是单色 SVG，写成 CSS 变量里的 data URI，页面上用 mask-image 取形状、background-color 取颜色，
// 所以深色（象牙白线）和浅色（墨线）两套主题共用同一份图形。输出 legacy-static/ornaments.css（提交进仓库，构建时不跑）。
// 改图形后运行：node scripts/build-ornaments.mjs
import {writeFile} from 'node:fs/promises';
const f=n=>Number(n.toFixed(2));
const rad=d=>d*Math.PI/180;
// 固定种子的随机数：每次生成的星空一样，diff 干净
let seed=20261118;const rnd=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
const svg=(vb,body)=>`<svg xmlns='http://www.w3.org/2000/svg' viewBox='${vb}'>${body}</svg>`;
const uri=s=>`url("data:image/svg+xml,${s.replace(/"/g,"'").replace(/#/g,'%23').replace(/</g,'%3C').replace(/>/g,'%3E').replace(/\s+/g,' ')}")`;

/** 四芒星：上下左右四根细长光芒，斜向四根短芒 */
function starPath(cx,cy,r,w=r*.07,diag=.42){
 const p=[];for(let i=0;i<8;i++){const a=rad(i*45-90),L=i%2?r*diag:r,b1=rad(i*45-90-90),b2=rad(i*45-90+90),ww=i%2?w*.7:w;
  p.push(`M${f(cx+Math.cos(b1)*ww)} ${f(cy+Math.sin(b1)*ww)}L${f(cx+Math.cos(a)*L)} ${f(cy+Math.sin(a)*L)}L${f(cx+Math.cos(b2)*ww)} ${f(cy+Math.sin(b2)*ww)}Z`)}
 return p.join('')}
const star=svg('0 0 40 40',`<path fill='#fff' d='${starPath(20,20,20,1.5)}'/><circle cx='20' cy='20' r='1.6' fill='#fff'/>`);

/** 左上角的扇形光芒：两道直角框线 + 从角上放射的细线 + 两道弧 */
function fan(){
 const rays=[];for(let i=0;i<=16;i++){const a=rad(3+i*84/16),L=i%2?20:30;rays.push(`M${f(4+Math.cos(a)*7)} ${f(4+Math.sin(a)*7)}L${f(4+Math.cos(a)*L)} ${f(4+Math.sin(a)*L)}`)}
 const arc=r=>`M${4+r} 4A${r} ${r} 0 0 1 4 ${4+r}`;
 return svg('0 0 64 64',`<g fill='none' stroke='#fff' stroke-linecap='round'><path stroke-width='.7' d='${rays.join('')}'/><path stroke-width='.9' d='${arc(33)}${arc(36)}'/><path stroke-width='1' d='M1 1H62M1 1V62'/><path stroke-width='.6' d='M5 5H40M5 5V40'/></g><circle cx='4' cy='4' r='2' fill='#fff'/>`)}

/** 分隔线：两端尖细的横线，中间一颗四芒星，两侧各一粒点 */
const divider=svg('0 0 240 20',`<g fill='#fff'><path d='M2 10L98 9.4L98 10.6Z'/><path d='M238 10L142 9.4L142 10.6Z'/><circle cx='106' cy='10' r='1.3'/><circle cx='134' cy='10' r='1.3'/><path d='${starPath(120,10,10,.9)}'/></g>`);

/** 月落点线：一列由大到小的点落到一弯新月（参考图里满月下面那条） */
function drop(){
 const dots=[];let y=3;for(let i=0;i<9;i++){const r=f(1.25-i*.09);dots.push(`<circle cx='10' cy='${f(y)}' r='${r}'/>`);y+=7.2-i*.25}
 return svg('0 0 20 96',`<g fill='#fff'>${dots.join('')}<path d='M4.5 80a6.2 6.2 0 0 0 11 4.6a7.6 7.6 0 0 1-11-4.6Z'/><path d='${starPath(10,93,3,.3)}'/></g>`)}

/** 远山与水面：两道起伏的山脊线；水面是一排排细横线，越往下越疏；正中一道月光倒影（短线越往下越窄）；两侧各一枝细叶草 */
function horizon(){
 const W=800,H=160,mid=W/2;
 const ridge=(base,amp,off)=>{let d=`M0 ${base}`;for(let x=0;x<=W;x+=16){const y=base-amp*(Math.sin(x/110+off)*.6+Math.sin(x/47+off*2)*.28+Math.sin(x/19+off)*.06);d+=`L${x} ${f(y)}`}return d};
 let water='',glint='';
 for(let i=0;i<11;i++){const y=f(98+i*5+i*i*.18);
  // 普通水纹：每排两三段长线，避开中间
  let x=rnd()*60;while(x<W){const len=40+rnd()*120;const x2=Math.min(W,x+len);if(!(x2>mid-70&&x<mid+70))water+=`M${f(x)} ${y}H${f(x2)}`;x=x2+30+rnd()*90}
  // 月光倒影：上宽下窄的一列短线
  const half=56-i*4;for(let k=-2;k<=2;k++){const cx=mid+k*half*.42+(rnd()-.5)*6,len=half*.32*(1-Math.abs(k)*.18);glint+=`M${f(cx-len/2)} ${y}H${f(cx+len/2)}`}}
 // 细叶草：一根弯茎，两侧交替的小叶
 const sprig=(x,h,lean)=>{const pts=[];let d=`M${x} 158Q${f(x+lean*.4)} ${f(158-h*.55)} ${f(x+lean)} ${f(158-h)}`;
  for(let j=1;j<=7;j++){const t=j/8,px=x+lean*t*t,py=158-h*t,side=j%2?1:-1,ll=9*(1-t*.5);d+=`M${f(px)} ${f(py)}q${f(side*ll*.6)} ${f(-ll*.3)} ${f(side*ll)} ${f(-ll*.9)}`}return d};
 return svg(`0 0 ${W} ${H}`,`<g fill='none' stroke='#fff' stroke-linecap='round'><path stroke-width='1' d='${ridge(70,24,1.3)}'/><path stroke-width='.6' d='${ridge(86,12,4.1)}'/><path stroke-width='.8' d='M0 92H${W}'/><path stroke-width='.55' stroke-opacity='.75' d='${water}'/><path stroke-width='.9' d='${glint}'/><path stroke-width='.75' d='${sprig(34,62,12)}${sprig(58,40,-6)}${sprig(766,66,-12)}${sprig(742,42,7)}'/></g>`)}

/** 星空平铺：小点为主，少量四芒星 */
function sky(){
 let b='';for(let i=0;i<70;i++){const x=f(rnd()*400),y=f(rnd()*400),r=f(.35+rnd()*rnd()*1.1);b+=`<circle cx='${x}' cy='${y}' r='${r}' opacity='${f(.35+rnd()*.65)}'/>`}
 for(let i=0;i<4;i++){const x=20+rnd()*360,y=20+rnd()*360;b+=`<path d='${starPath(x,y,4+rnd()*5,.35)}'/>`}
 return svg('0 0 400 400',`<g fill='#fff'>${b}</g>`)}

/** 把一张 64×64 的角花翻到别的角上 */
const flip=(svgText,t)=>svgText.replace(/(<svg[^>]*>)([\s\S]*)(<\/svg>)/,(m,a,b,c)=>`${a}<g transform='${t}'>${b}</g>${c}`);

const css=`/* 自动生成，不要手改：node scripts/build-ornaments.mjs（见脚本开头的说明） */
:root{
 --orn-star:${uri(star)};
 --orn-fan:${uri(fan())};
 --orn-fan-tr:${uri(flip(fan(),'scale(-1 1) translate(-64 0)'))};
 --orn-fan-bl:${uri(flip(fan(),'scale(1 -1) translate(0 -64)'))};
 --orn-fan-br:${uri(flip(fan(),'scale(-1 -1) translate(-64 -64)'))};
 --orn-divider:${uri(divider)};
 --orn-drop:${uri(drop())};
 --orn-horizon:${uri(horizon())};
 --orn-sky:${uri(sky())};
}
`;
await writeFile('legacy-static/ornaments.css',css);
console.log('legacy-static/ornaments.css',css.length,'bytes');
