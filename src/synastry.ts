// 两个人的星座：只看太阳星座的简化版相处参考。
// 结构按古典占星：两个星座在黄道上相隔几格决定相位（60°、120° 和谐，90°、180° 有张力，30°、150° 不相连），
// 再看元素和性质。文字写给普通人看，不打分，也不说「合不合」。
import {SIGNS,type Sign,type Element} from './astro.ts';

export interface PairReading {
 a:Sign;b:Sign;
 /** 小标签，如「对冲 · 180°」 */ tag:string;
 /** 一句话 */ one:string;
 /** 你们的相处底色 */ base:string;
 /** 容易卡住的地方 */ stuck:string;
 /** 相处小建议 */ tips:string[];
}

const ASPECT:readonly {tag:string;one:string;stuck:string;tip:string}[]=[
 {tag:'同一个星座',one:'像照镜子，一眼就懂对方。',stuck:'太像了，遇到问题容易一起钻牛角尖，谁也拉不回谁。',tip:'给彼此留一点各自的空间，偶尔一起做点平时不会做的事。'},
 {tag:'相邻 · 30°',one:'一开始有点难懂，熟了以后刚好互补。',stuck:'出发点差得远，你觉得理所当然的事，TA 可能完全没想到。',tip:'别让对方猜，想要什么就直接说出来。'},
 {tag:'六合 · 60°',one:'聊得来，相处轻松，是会互相帮忙的那种。',stuck:'关系舒服，但容易停在「挺好的」，走不到更深。',tip:'主动多走一步，把心里话说给对方听。'},
 {tag:'四分 · 90°',one:'有火花，也有摩擦，越磨合越懂对方。',stuck:'在意的东西不一样，小事也可能变成争执。',tip:'吵架时先说感受，再讲道理；吵完记得说开。'},
 {tag:'三合 · 120°',one:'天生同频，在一起很省力。',stuck:'太舒服了，反而容易回避问题。',tip:'有不开心别憋着，舒服的关系也需要认真聊。'},
 {tag:'相隔 · 150°',one:'节奏不太一样，需要多一点磨合。',stuck:'你在意的点，TA 常常没注意到，反过来也一样。',tip:'多问一句「你现在需要什么」，比自己猜管用。'},
 {tag:'对冲 · 180°',one:'像镜子的两面：TA 身上有你缺的那一面，互相吸引，也互相拉扯。',stuck:'想法常常站在两端，容易各执一词。',tip:'轮流迁就，不必每次都分输赢。'}];

const TRAIT:Readonly<Record<Element,string>>={火:'热情直接',土:'踏实稳定',风:'爱聊爱想',水:'细腻重感情'};
const PAIR:Readonly<Record<string,string>>={
 火风:'火和风互相成全：风给火想法，火给风热度。',
 土水:'土和水互相成全：水让土有温度，土让水有依靠。',
 火土:'火想快，土想稳，一个冲一个守，节奏要互相让一让。',
 风水:'风靠想，水靠感觉，学着用对方的方式去理解对方。',
 火水:'火热烈，水细腻，差别很大，需要多一点耐心和分寸。',
 土风:'风想得多、变得快，土讲现实、求稳定，要学会欣赏对方的节奏。'};
const ORDER:readonly Element[]=['火','土','风','水'];
function elementLine(x:Element,y:Element){if(x===y)return `你们都是${x}象，都${TRAIT[x]}，很多地方不用解释对方就懂。`;const [p,q]=[x,y].sort((m,n)=>ORDER.indexOf(m)-ORDER.indexOf(n));return PAIR[p+q]}
const ROLE={基本:'开头',固定:'坚持',变动:'调整'} as const;
function modeTip(a:Sign,b:Sign){if(a.mode===b.mode)return {基本:'你们都想当拿主意的那个，商量着来会更顺。',固定:'你们都很坚持，关系稳，但吵起来谁也不让，记得给对方台阶。',变动:'你们都很好商量，也记得有时候要有人拍板。'}[a.mode];
 return `${a.zh}擅长${ROLE[a.mode]}，${b.zh}擅长${ROLE[b.mode]}，分工刚好。`}
function rulerLine(a:Sign,b:Sign){if(a.ruler===b.ruler)return `你们的守护星都是${a.ruler}，在意的东西底色相同。`;
 const s=new Set([a.ruler,b.ruler]);if(s.has('金星')&&s.has('火星'))return '金星和火星是星座里最经典的一对，一个温柔，一个热烈。';return ''}

/** 两个星座之间相隔几格（0–6） */
export const signDistance=(a:Sign,b:Sign)=>{const d=Math.abs(SIGNS.indexOf(a)-SIGNS.indexOf(b));return Math.min(d,12-d)};
export function pairReading(a:Sign,b:Sign):PairReading{const asp=ASPECT[signDistance(a,b)];
 return {a,b,tag:asp.tag,one:asp.one,base:[elementLine(a.element,b.element),rulerLine(a,b)].filter(Boolean).join(''),stuck:asp.stuck,tips:[asp.tip,modeTip(a,b)]}}
export const signById=(id:string|null|undefined)=>SIGNS.find(s=>s.id===id)??null;
