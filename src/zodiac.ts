// 十二星座页的内容。只放在星座页用，不进每日抽牌的脚本。
// 古典定义（性别、四种性质的原名、入旺）按托勒密《四书》第一卷；塔罗对应全部由 astro.ts 里已核对的 Book T 表推出，不另写一份。
// 白话描述只按元素、性质和守护星概括性格倾向，不做预测。
import {SIGNS,cardAstro,type Sign,type Planet,type Element} from './astro.ts';

/** 七颗古典行星各自对应的大阿卡纳（Book T） */
export const PLANET_CARD:Readonly<Record<Planet,string>>={水星:'m1',月亮:'m2',金星:'m3',木星:'m10',火星:'m16',太阳:'m19',土星:'m21'};
const SUIT_OF:Readonly<Record<Element,string>>={火:'wands',土:'pentacles',风:'swords',水:'cups'};
const BASE={基本:2,固定:5,变动:8} as const;
/** 托勒密对四种性质的叫法：二分二至点上的星座、坚固星座、双体星座 */
const PTOLEMY_MODE={基本:'二分二至星座（季节在这里转换）',固定:'坚固星座（季节在这里最稳定）',变动:'双体星座（处在两季之间）'} as const;
/** 托勒密《四书》I.19 的入旺：行星在这个星座表现最好 */
const EXALTED:Readonly<Record<string,Planet>>={aries:'太阳',taurus:'月亮',cancer:'木星',virgo:'水星',libra:'土星',capricorn:'火星',pisces:'金星'};

export interface ZodiacEntry {
 sign:Sign;
 /** 大致日期；每年会差一天左右，个人星座按出生当天太阳实际位置算 */ dates:string;
 polarity:'阳性'|'阴性';
 modeNote:string;
 exalted?:Planet;
 plain:string;
 /** 星座本身对应的大阿卡纳 */ major:string;
 /** 守护星对应的大阿卡纳 */ rulerCard:string;
 /** 三个旬（每 10°）对应的小牌，按黄道顺序 */ decans:{id:string;degrees:string;label:string;title:string}[];
}
const DATES=['3月21日 – 4月19日','4月20日 – 5月20日','5月21日 – 6月21日','6月22日 – 7月22日','7月23日 – 8月22日','8月23日 – 9月22日','9月23日 – 10月23日','10月24日 – 11月22日','11月23日 – 12月21日','12月22日 – 1月19日','1月20日 – 2月18日','2月19日 – 3月20日'];
const PLAIN:Readonly<Record<string,string>>={
 aries:'开头的力量。想到就去做，喜欢从零开始、第一个站出来；容易急，耐心不太够，做事常常是开头猛、收尾松。',
 taurus:'稳定和积累。看重实在的东西和身体的感受，慢热但持久，认定的事不轻易改；不喜欢被催，也不喜欢突然的变化。',
 gemini:'好奇和交流。脑子转得快，兴趣多，爱说也爱听；同一时间容易开好几个头，难的是坚持做完一件。',
 cancer:'照顾和归属。对家和亲近的人很上心，情绪细腻，记性好；受伤时会先缩回自己的壳里，需要安全感。',
 leo:'表达和热情。希望被看见，也愿意把光分给身边的人；在意尊严和面子，被忽视时最难受。',
 virgo:'细致和整理。喜欢把事情做对、做干净，善于发现问题、帮人收拾局面；容易对自己太苛刻。',
 libra:'平衡和关系。在意公平和美感，很会站在别人的角度想；顾虑太多时，反而难以做决定。',
 scorpio:'深入和投入。要么不碰，要么到底；重视信任，看人看事都想看到底层，不喜欢浅尝辄止。',
 sagittarius:'远方和意义。向往自由和更大的世界，乐观、直接、爱讲道理；有时说话不留余地，也不爱被束缚。',
 capricorn:'目标和责任。一步一步往上走，能吃苦，靠得住；容易把自己逼得太紧，忘了休息。',
 aquarius:'独立和理想。愿意和别人不一样，看重朋友和大家共同的事；情绪上偶尔显得有点疏离。',
 pisces:'感受和想象。共情力强，容易被别人的情绪带走，也富有想象力；需要独处的时间来恢复。'};

export const ZODIAC:readonly ZodiacEntry[]=SIGNS.map((sign,i)=>{
 const major=Object.keys(Array(22).fill(0)).map(n=>`m${n}`).find(id=>{const a=cardAstro(id)!;return a.kind==='sign'&&a.signs[0].id===sign.id})!;
 const decans=[0,1,2].map(k=>{const id=`${SUIT_OF[sign.element]}-${BASE[sign.mode]+k}`,a=cardAstro(id)!;return {id,degrees:`${k*10}°–${k*10+10}°`,label:a.label,title:`${a.title!.en} · ${a.title!.zh}`}});
 return {sign,dates:DATES[i],polarity:sign.element==='火'||sign.element==='风'?'阳性':'阴性',modeNote:PTOLEMY_MODE[sign.mode],exalted:EXALTED[sign.id],plain:PLAIN[sign.id],major,rulerCard:PLANET_CARD[sign.ruler],decans};
});
export const ELEMENT_NOTE:Readonly<Record<Element,string>>={火:'火象：行动、热情、意志',土:'土象：现实、身体、积累',风:'风象：思考、交流、关系',水:'水象：情感、直觉、连结'};
export const MODE_NOTE={基本:'基本宫：开创，把事情启动',固定:'固定宫：坚持，把事情守住',变动:'变动宫：调整，把事情转向'} as const;
