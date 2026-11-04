// 北斗仪式的抽牌：只用 src/random.ts 的密码学随机数，不读任何时间、地点或星空数据。
// 星空只决定画面：页面先用这里的函数确定抽到哪一张，再倒推斗柄该转多少度，让它停在那张牌的位置上。
// 所以同一时刻、同一座城市的人，抽到的牌互不相干。
import {shuffleDeck,cutDeck,randomInteger} from '../random.ts';
export type Integer=(n:number)=>number;
/** 开始点亮七星时洗一次牌（含正逆位） */
export const startDeck=<T>(cards:readonly T[],integer:Integer=randomInteger)=>shuffleDeck(cards,integer);
/** 每点亮一颗星切一次牌：随机切点 1…n−1 */
export const cutForStar=<T>(deck:readonly T[],integer:Integer=randomInteger)=>cutDeck(deck,1+integer(deck.length-1));
/** 七星都亮之后，牌环上被斗柄指中的位置 */
export const pickSlot=(n:number,integer:Integer=randomInteger)=>integer(n);
/** 整个仪式一次走完（测试用）：洗牌 → 七次切牌 → 选位置 */
export function dipperDraw<T>(cards:readonly T[],integer:Integer=randomInteger){
 let deck=startDeck(cards,integer);for(let i=0;i<7;i++)deck=cutForStar(deck,integer);
 const index=pickSlot(deck.length,integer);return {deck,index,chosen:deck[index]}}
