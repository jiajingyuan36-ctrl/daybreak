// 北斗七星牌阵的牌板：七张牌按北斗的形状摆开（勺子在左上、斗柄向右下），细线相连。
// 只在较宽的屏幕上显示；手机竖屏下隐藏，由下面原有的纵向列表逐张展示，不会挤成一团。
import {TarotPlate} from './tarot-plate';
import type {DrawnCard} from '../../types/tarot';
/** 七个位置在牌板上的中心点（百分比）。按北斗的大致形状排，已核对在 768 / 1280 宽度下互不重叠。 */
export const BOARD:readonly [number,number][]=[[9,15],[11,64],[34,73],[34,24],[54,40],[72,54],[91,80]];
/** 牌板高宽比（与 epic.css 里 .dipper-board 的 aspect-ratio 一致） */
const H=0.72;
export function DipperBoard({drawn,titles}:{drawn:readonly DrawnCard[];titles:readonly string[]}){
 const at=(i:number)=>drawn.find(d=>d.position.index===i);
 const path=[0,1,2,3,4,5,6].map(i=>BOARD[i]),close=[BOARD[3],BOARD[0]];
 return <figure className="dipper-board" aria-label="北斗七星牌阵">
  <svg viewBox={`0 0 100 ${H*100}`} preserveAspectRatio="none" aria-hidden="true"><polyline points={path.map(([x,y])=>`${x},${y*H}`).join(' ')}/><polyline points={close.map(([x,y])=>`${x},${y*H}`).join(' ')}/></svg>
  {titles.map((t,i)=>{const d=at(i);return <div key={t} className={`dipper-slot${d?' is-drawn':''}`} style={{left:`${BOARD[i][0]}%`,top:`${BOARD[i][1]}%`}}>
   {d?<TarotPlate src={d.card.thumb_url} alt={`${t}：${d.card.name_zh}${d.isReversed?'，逆位':''}`} style={{transform:d.isReversed?'rotate(180deg)':undefined}} width={160} height={274}/>:<span className="dipper-empty" aria-hidden="true"/>}
   <figcaption><b>{i+1} · {t}</b>{d&&<small>{d.card.name_zh}{d.isReversed?' · 逆':''}</small>}</figcaption></div>})}
 </figure>}
