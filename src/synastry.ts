// 两个人的星座：只看太阳星座的简化版相处参考，写给普通人看，不打分，也不说「合不合」。
// 古典依据（都是公有领域）：
// · 相位：两个星座相隔几格，60°、120° 和谐，90°、180° 有张力，30°、150° 不相连（托勒密《四书》第一卷）。
// · 命令与服从：以春分秋分（白羊—天秤）为轴对称的两个星座，北半的带头；彼此看见：以夏至冬至（巨蟹—摩羯）为轴对称，力量相当（同上）。
// · 庙旺陷落：守护星在对方星座里是入旺、陷还是落（托勒密《四书》第一卷；William Lilly《Christian Astrology》1647）。
// · 行星的性质：金星、木星是吉星；太阳、木星、土星属昼，月亮、金星、火星属夜（托勒密《四书》第一卷）。
import {SIGNS,type Sign,type Element,type Planet} from './astro.ts';

export interface PairReading {
 a:Sign;b:Sign;
 /** 小标签，如「对冲 · 180°」 */ tag:string;
 /** 一句话 */ one:string;
 /** 你们的相处底色 */ base:string[];
 /** 古典里的你们（相位之外的古典关系，可能为空） */ classical:string[];
 /** 容易卡住的地方 */ stuck:string[];
 /** 相处小建议 */ tips:string[];
}

const ASPECT:readonly {tag:string;one:string;stuck:string;tip:string;note:string}[]=[
 {tag:'同一个星座',one:'像照镜子，一眼就懂对方。',stuck:'太像了，遇到问题容易一起钻牛角尖，谁也拉不回谁。',tip:'给彼此留一点各自的空间，偶尔一起做点平时不会做的事。',note:'同一个星座在古典里叫「同宫」，两个人站在黄道的同一个位置上。'},
 {tag:'相邻 · 30°',one:'一开始有点难懂，熟了以后刚好互补。',stuck:'出发点差得远，你觉得理所当然的事，TA 可能完全没想到。',tip:'别让对方猜，想要什么就直接说出来。',note:'相邻的两个星座在古典里叫「不相连」，彼此之间没有形成相位，所以更需要主动靠近。'},
 {tag:'六合 · 60°',one:'聊得来，相处轻松，是会互相帮忙的那种。',stuck:'关系舒服，但容易停在「挺好的」，走不到更深。',tip:'主动多走一步，把心里话说给对方听。',note:'60° 在古典里叫「六合」，是和谐的相位：两个星座的元素彼此助长。'},
 {tag:'四分 · 90°',one:'有火花，也有摩擦，越磨合越懂对方。',stuck:'在意的东西不一样，小事也可能变成争执。',tip:'吵架时先说感受，再讲道理；吵完记得说开。',note:'90° 在古典里叫「四分」，是有张力的相位：两个星座性质相同、元素相冲。'},
 {tag:'三合 · 120°',one:'天生同频，在一起很省力。',stuck:'太舒服了，反而容易回避问题。',tip:'有不开心别憋着，舒服的关系也需要认真聊。',note:'120° 在古典里叫「三合」，是最和谐的相位：两个星座属于同一种元素。'},
 {tag:'相隔 · 150°',one:'节奏不太一样，需要多一点磨合。',stuck:'你在意的点，TA 常常没注意到，反过来也一样。',tip:'多问一句「你现在需要什么」，比自己猜管用。',note:'相隔 150° 在古典里也算「不相连」，元素和性质都不同，需要更多翻译彼此。'},
 {tag:'对冲 · 180°',one:'TA 身上有你缺的那一面，互相吸引，也互相拉扯。',stuck:'想法常常站在两端，容易各执一词。',tip:'轮流迁就，不必每次都分输赢。',note:'180° 在古典里叫「对冲」，两个星座隔着黄道相望，像镜子的两面。'}];

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

// 两颗守护星之间：7 颗古典行星两两组合，共 28 种
const PLANET_ORDER:readonly Planet[]=['太阳','月亮','水星','金星','火星','木星','土星'];
const RULERS:Readonly<Record<string,string>>={
 太阳太阳:'都想做主角，也都愿意照亮别人，记得给对方鼓掌。',月亮月亮:'都很顾家、重感受，安心的时候很甜，难过时也容易一起低落。',
 水星水星:'都爱说爱想，聊天停不下来，也容易光说不做。',金星金星:'都在意美和舒服，很会经营关系里的小情调。',
 火星火星:'都直接、都有冲劲，吵得快，和好得也快。',木星木星:'都乐观、爱往外走，在一起总有新计划。',土星土星:'都认真、守规矩，关系很稳，偶尔太严肃。',
 太阳月亮:'太阳和月亮，一个向外发光，一个向内照顾，是古典里最基本的一对。',太阳水星:'一个想被看见，一个很会表达，TA 常常是把想法说清楚的那个人。',
 太阳金星:'一个热烈，一个温柔，在一起很有画面感。',太阳火星:'两个都很有劲，能一起往前冲，也容易争谁说了算。',
 太阳木星:'太阳和木星在古典里同属白天的行星，在一起大方、明亮、乐观。',太阳土星:'一个想发光，一个讲规矩：土星给太阳设边界，也给它分量。',
 月亮水星:'一个靠感受，一个靠分析，TA 能帮你把情绪说清楚。',月亮金星:'月亮和金星在古典里同属夜晚的柔和行星，相处温和、体贴。',
 月亮火星:'一个需要安全感，一个想马上行动，节奏要先对齐。',月亮木星:'一个细腻，一个宽厚，很能接住彼此的情绪。',
 月亮土星:'一个要温度，一个给结构：土星让月亮觉得可靠，偶尔也显得冷。',水星金星:'一个会说，一个会爱，聊天很甜。',
 水星火星:'话赶话容易较真，吵起来时先停三秒。',水星木星:'一个看细节，一个看全局，讨论起来很互补。',
 水星土星:'都偏理性，做事有条理，就是不太会说软话。',金星火星:'金星和火星是星座里最经典的一对：一个温柔，一个热烈，互相吸引。',
 金星木星:'金星和木星是古典里的两颗吉星，在一起容易彼此宽容、过得愉快。',金星土星:'一个想要甜，一个习惯克制，要学着把喜欢说出口。',
 火星木星:'一个冲，一个乐观，很适合一起去做新的事。',火星土星:'一个想快，一个想稳；这两颗在古典里都是带压力的行星，说话要多一点分寸。',
 木星土星:'一个扩张，一个收敛：一个负责梦想，一个负责落地。'};
function rulerLine(a:Sign,b:Sign){const [p,q]=[a.ruler,b.ruler].sort((m,n)=>PLANET_ORDER.indexOf(m)-PLANET_ORDER.indexOf(n));
 const line=RULERS[p+q];return a.ruler===b.ruler?`你们的守护星都是${a.ruler}：${line}`:`你的守护星是${a.ruler}，TA 的是${b.ruler}：${line}`}

// 庙旺陷落
const EXALT:Readonly<Record<Planet,string>>={太阳:'aries',月亮:'taurus',水星:'virgo',金星:'pisces',火星:'capricorn',木星:'cancer',土星:'libra'};
const FALL:Readonly<Record<Planet,string>>={太阳:'libra',月亮:'scorpio',水星:'pisces',金星:'virgo',火星:'cancer',木星:'capricorn',土星:'aries'};
const opposite=(s:Sign)=>SIGNS[(SIGNS.indexOf(s)+6)%12];
const detriments=(p:Planet)=>SIGNS.filter(s=>s.ruler===p).map(s=>opposite(s).id);
function dignity(who:'你'|'TA',other:'你'|'TA',from:Sign,to:Sign):string|null{const p=from.ruler;if(to.ruler===p)return null;
 if(EXALT[p]===to.id)return `${who}的守护星${p}在${to.zh}是「入旺」：在${other}身边，${who}更容易拿出自己最好的一面。`;
 if(detriments(p).includes(to.id))return `${who}的守护星${p}在${to.zh}是「陷」：和${other}在一起，${who}习惯的那一套不太管用，需要换个方式。`;
 if(FALL[p]===to.id)return `${who}的守护星${p}在${to.zh}是「落」：在${other}面前，${who}有时会不太有底气，慢慢来就好。`;
 return null}
function classicalLines(a:Sign,b:Sign):string[]{const i=SIGNS.indexOf(a),j=SIGNS.indexOf(b),out:string[]=[];if(i===j)return out;
 if((i+j)%12===0){const [lead,follow]=i<6?[a,b]:[b,a];out.push(`托勒密把你们叫作「命令与服从」的一对：${lead.zh}在春夏一侧带头，${follow.zh}在秋冬一侧呼应。相处里，常常是${lead===a?'你':'TA'}拿主意，${lead===a?'TA':'你'}更愿意配合。`)}
 if((i+j)%12===6)out.push('托勒密说你们是「彼此看得见」的星座：太阳走到这两个星座时，白天一样长，力量相当。你们更像平起平坐的伙伴。');
 if(a.ruler===b.ruler)out.push(`你们共用一颗守护星${a.ruler}，${a.zh}和${b.zh}是它的两个「家」，古典上叫「入庙」。`);
 for(const l of [dignity('你','TA',a,b),dignity('TA','你',b,a)])if(l)out.push(l);
 return out}

// 卡点按元素写：同元素看它的通病，不同元素看两者的摩擦
const SAME_STUCK:Readonly<Record<Element,string>>={火:'都急，情绪上来时没人踩刹车。',土:'都慢热、不爱表达，问题容易闷着不说。',风:'都爱讲道理，聊得多、落地少，感受容易被跳过。',水:'都敏感，一个人低落，另一个也跟着沉下去。'};
const PAIR_STUCK:Readonly<Record<string,string>>={火风:'风一吹火就旺，兴奋起来容易一起冲动。',土水:'都偏保守，遇到变化时会一起往后缩。',火土:'一个嫌对方慢，一个嫌对方急。',
 风水:'一个讲道理，一个要被理解，容易鸡同鸭讲。',火水:'一个直来直去，一个容易受伤，话说重了很难收回。',土风:'一个要看到结果，一个还在想点子，容易互相觉得不靠谱。'};
function elementStuck(x:Element,y:Element){if(x===y)return SAME_STUCK[x];const [p,q]=[x,y].sort((m,n)=>ORDER.indexOf(m)-ORDER.indexOf(n));return PAIR_STUCK[p+q]}
const SHORT=(s:Sign)=>s.theme.split('，')[0];
const ROLE={基本:'开头',固定:'坚持',变动:'调整'} as const;
const WANT={基本:'想马上开始',固定:'想守住现在',变动:'想再看看、换换花样'} as const;
function modeStuck(a:Sign,b:Sign){if(a.mode===b.mode)return {基本:'你们都想主导方向，谁先让一步很关键。',固定:'你们都很坚持，冷战容易拖很久。',变动:'你们都容易变，计划常常落不了地。'}[a.mode];
 return `${a.zh}${WANT[a.mode]}，${b.zh}${WANT[b.mode]}。`}
function modeTip(a:Sign,b:Sign){if(a.mode===b.mode)return {基本:'都想当拿主意的那个，那就轮流做决定。',固定:'给对方台阶，也给自己台阶，别让坚持变成僵持。',变动:'好商量是优点，重要的事记得有人拍板。'}[a.mode];
 return `${a.zh}擅长${ROLE[a.mode]}，${b.zh}擅长${ROLE[b.mode]}，把事情按这个分工来，会顺很多。`}

/** 两个星座之间相隔几格（0–6） */
export const signDistance=(a:Sign,b:Sign)=>{const d=Math.abs(SIGNS.indexOf(a)-SIGNS.indexOf(b));return Math.min(d,12-d)};
export function pairReading(a:Sign,b:Sign):PairReading{const asp=ASPECT[signDistance(a,b)];
 const one=a===b?`都是${SHORT(a)}。${asp.one}`:`${SHORT(a)}，遇上${SHORT(b)}。${asp.one}`;
 const classical=classicalLines(a,b);if(!classical.length)classical.push(asp.note);
 return {a,b,tag:asp.tag,one,base:[elementLine(a.element,b.element),rulerLine(a,b)],classical,stuck:[asp.stuck,elementStuck(a.element,b.element),a===b?'':modeStuck(a,b)].filter(Boolean),tips:[asp.tip,modeTip(a,b)]}}
export const signById=(id:string|null|undefined)=>SIGNS.find(s=>s.id===id)??null;
export const PAIR_SOURCES='相位、命令与服从、彼此看见的星座：托勒密《四书》第一卷；庙旺陷落：托勒密《四书》与 William Lilly《Christian Astrology》（1647）；代表牌：金色黎明会《Book T》。';
