// 塔罗的占星对应与当天星象。
// 牌与星座、行星、元素的对应按金色黎明会《Book T》（S. L. MacGregor Mathers 编，约 1888 年；收录于 Israel Regardie《The Golden Dawn》）。
// 韦特和史密斯都是金色黎明会成员，RWS 牌的占星对应以此为准。原始体系只用七颗古典行星，不用天王星、海王星、冥王星。
// 星座的元素、性质和守护星按托勒密《四书》第一卷（古典占星的通行定义）。
// 太阳、月亮所在星座用标准简化公式计算黄经（回归黄道），太阳误差约 0.01°，月亮约 0.3°；测试里与 Astronomy Engine 对照。

export interface Sign {id:string;zh:string;en:string;glyph:string;element:Element;mode:'基本'|'固定'|'变动';ruler:Planet;theme:string}
export type Element='火'|'风'|'水'|'土';
export type Planet='太阳'|'月亮'|'水星'|'金星'|'火星'|'木星'|'土星';

export const SIGNS:readonly Sign[]=[
 {id:'aries',zh:'白羊座',en:'Aries',glyph:'♈',element:'火',mode:'基本',ruler:'火星',theme:'开头和冲劲，想到就去做'},
 {id:'taurus',zh:'金牛座',en:'Taurus',glyph:'♉',element:'土',mode:'固定',ruler:'金星',theme:'稳定和积累，看重实在的东西'},
 {id:'gemini',zh:'双子座',en:'Gemini',glyph:'♊',element:'风',mode:'变动',ruler:'水星',theme:'好奇和交流，脑子转得快'},
 {id:'cancer',zh:'巨蟹座',en:'Cancer',glyph:'♋',element:'水',mode:'基本',ruler:'月亮',theme:'照顾和归属，在意家和身边的人'},
 {id:'leo',zh:'狮子座',en:'Leo',glyph:'♌',element:'火',mode:'固定',ruler:'太阳',theme:'表达和热情，想被看见'},
 {id:'virgo',zh:'处女座',en:'Virgo',glyph:'♍',element:'土',mode:'变动',ruler:'水星',theme:'细致和整理，把事情做对'},
 {id:'libra',zh:'天秤座',en:'Libra',glyph:'♎',element:'风',mode:'基本',ruler:'金星',theme:'平衡和关系，在意公平'},
 {id:'scorpio',zh:'天蝎座',en:'Scorpio',glyph:'♏',element:'水',mode:'固定',ruler:'火星',theme:'深入和投入，不喜欢浅尝辄止'},
 {id:'sagittarius',zh:'射手座',en:'Sagittarius',glyph:'♐',element:'火',mode:'变动',ruler:'木星',theme:'远方和意义，想看得更远'},
 {id:'capricorn',zh:'摩羯座',en:'Capricorn',glyph:'♑',element:'土',mode:'基本',ruler:'土星',theme:'目标和责任，一步一步往上走'},
 {id:'aquarius',zh:'水瓶座',en:'Aquarius',glyph:'♒',element:'风',mode:'固定',ruler:'土星',theme:'独立和理想，愿意和别人不一样'},
 {id:'pisces',zh:'双鱼座',en:'Pisces',glyph:'♓',element:'水',mode:'变动',ruler:'木星',theme:'感受和想象，容易被情绪带走'}];
export const PLANETS:Readonly<Record<Planet,{en:string;glyph:string;theme:string}>>={
 太阳:{en:'Sun',glyph:'☉',theme:'自我和生命力'},月亮:{en:'Moon',glyph:'☽',theme:'情绪和日常'},水星:{en:'Mercury',glyph:'☿',theme:'思考和沟通'},
 金星:{en:'Venus',glyph:'♀',theme:'喜爱和关系'},火星:{en:'Mars',glyph:'♂',theme:'行动和冲突'},木星:{en:'Jupiter',glyph:'♃',theme:'扩展和机会'},土星:{en:'Saturn',glyph:'♄',theme:'限制和责任'}};
export const ELEMENTS:Readonly<Record<Element,string>>={火:'行动和意志',风:'思考和沟通',水:'情感和直觉',土:'现实和身体'};
const signByZh=(zh:string)=>SIGNS.find(s=>s.zh===zh)!;

// 大阿卡纳：星座、行星或元素（愚人、倒吊人、审判在原始体系里对应风、水、火三元素）
const MAJOR:readonly ({sign:string}|{planet:Planet}|{element:Element})[]=[
 {element:'风'},{planet:'水星'},{planet:'月亮'},{planet:'金星'},{sign:'白羊座'},{sign:'金牛座'},{sign:'双子座'},{sign:'巨蟹座'},{sign:'狮子座'},{sign:'处女座'},{planet:'木星'},
 {sign:'天秤座'},{element:'水'},{sign:'天蝎座'},{sign:'射手座'},{sign:'摩羯座'},{planet:'火星'},{sign:'水瓶座'},{sign:'双鱼座'},{planet:'太阳'},{element:'火'},{planet:'土星'}];
// 小牌 2–10：每张对应一个旬（星座的十度），[行星, 星座, Book T 称号, 称号中文]
const SUIT:Readonly<Record<string,{element:Element;zh:string}>>={wands:{element:'火',zh:'权杖'},cups:{element:'水',zh:'圣杯'},swords:{element:'风',zh:'宝剑'},pentacles:{element:'土',zh:'星币'}};
const DECANS:Readonly<Record<string,readonly [Planet,string,string,string][]>>={
 wands:[['火星','白羊座','Dominion','统御'],['太阳','白羊座','Established Strength','稳固的力量'],['金星','白羊座','Perfected Work','完成的工作'],['土星','狮子座','Strife','争斗'],['木星','狮子座','Victory','胜利'],['火星','狮子座','Valour','勇气'],['水星','射手座','Swiftness','迅捷'],['月亮','射手座','Great Strength','强大的力量'],['土星','射手座','Oppression','压迫']],
 cups:[['金星','巨蟹座','Love','爱'],['水星','巨蟹座','Abundance','丰盛'],['月亮','巨蟹座','Blended Pleasure','混杂的欢愉'],['火星','天蝎座','Loss in Pleasure','欢愉中的失落'],['太阳','天蝎座','Pleasure','欢愉'],['金星','天蝎座','Illusionary Success','虚幻的成功'],['土星','双鱼座','Abandoned Success','被放下的成功'],['木星','双鱼座','Material Happiness','物质的幸福'],['火星','双鱼座','Perfected Success','圆满的成功']],
 swords:[['月亮','天秤座','Peace Restored','恢复的平静'],['土星','天秤座','Sorrow','悲伤'],['木星','天秤座','Rest from Strife','争斗后的休息'],['金星','水瓶座','Defeat','挫败'],['水星','水瓶座','Earned Success','应得的成功'],['月亮','水瓶座','Unstable Effort','不稳定的努力'],['木星','双子座','Shortened Force','受限的力量'],['火星','双子座','Despair and Cruelty','绝望与残酷'],['太阳','双子座','Ruin','毁坏']],
 pentacles:[['木星','摩羯座','Harmonious Change','和谐的变化'],['火星','摩羯座','Material Works','物质的劳作'],['太阳','摩羯座','Earthly Power','尘世的力量'],['水星','金牛座','Material Trouble','物质的困扰'],['月亮','金牛座','Material Success','物质的成功'],['土星','金牛座','Success Unfulfilled','未竟的成功'],['太阳','处女座','Prudence','审慎'],['金星','处女座','Material Gain','物质的收获'],['水星','处女座','Wealth','财富']]};
const COURT=['侍从','骑士','王后','国王'];

export interface CardAstro {
 kind:'sign'|'planet'|'element'|'ace'|'court'|'decan';
 /** 一行标签，如「水瓶座 ♒」「火星在白羊座」 */ label:string;
 /** 白话说明这个对应在讲什么 */ plain:string;
 /** 关联的星座（用于和用户星座、今日月亮比对） */ signs:Sign[];
 element?:Element;
 /** Book T 的称号，仅小牌 2–10 */ title?:{en:string;zh:string};
}
export const ASTRO_SOURCE_LEAD='对应体系：金色黎明会《Book T》（Mathers 编，约 1888 年），韦特塔罗所依据的传统；星座定义：';
export const ASTRO_SOURCE_LINK='托勒密《四书》';
export const ASTRO_SOURCE_URL='https://gutenberg.org/files/70850/70850-h/70850-h.htm';

export function cardAstro(id:string):CardAstro|null{
 const m=/^m(\d+)$/.exec(id);
 if(m){const a=MAJOR[Number(m[1])];if(!a)return null;
  if('sign' in a){const s=signByZh(a.sign);return {kind:'sign',label:`${s.zh} ${s.glyph}`,plain:`${s.zh}：${s.theme}。属${s.element}元素，守护星是${s.ruler}。`,signs:[s],element:s.element}}
  if('planet' in a){const p=PLANETS[a.planet];const ruled=SIGNS.filter(s=>s.ruler===a.planet);return {kind:'planet',label:`${a.planet} ${p.glyph}`,plain:`${a.planet}代表${p.theme}${ruled.length?`，守护${ruled.map(s=>s.zh).join('和')}`:''}。`,signs:ruled}}
  return {kind:'element',label:`${a.element}元素`,plain:`在原始体系里，这张牌对应${a.element}元素本身：${ELEMENTS[a.element]}。`,signs:[],element:a.element}}
 const s=/^(wands|cups|swords|pentacles)-(\d+)$/.exec(id);if(!s)return null;
 const suit=SUIT[s[1]],n=Number(s[2]);
 if(n===1)return {kind:'ace',label:`${suit.element}元素之根`,plain:`王牌是${suit.element}元素的源头（Root of the Powers of ${({火:'Fire',水:'Water',风:'Air',土:'Earth'} as const)[suit.element]}）：${ELEMENTS[suit.element]}刚刚开始。`,signs:[],element:suit.element};
 if(n>=11)return {kind:'court',label:`${suit.element}元素 · ${COURT[n-11]}`,plain:`${suit.zh}属${suit.element}元素，代表${ELEMENTS[suit.element]}。宫廷牌的具体星座在不同流派里说法不一，这里只标元素。`,signs:[],element:suit.element};
 const [planet,signZh,en,zh]=DECANS[s[1]][n-2];const sign=signByZh(signZh);
 return {kind:'decan',label:`${planet}在${sign.zh}`,plain:`${planet}（${PLANETS[planet].theme}）落在${sign.zh}（${sign.theme}）。`,signs:[sign],element:sign.element,title:{en:`Lord of ${en}`,zh:`${zh}之主`}};
}

// —— 天文：回归黄道上的太阳、月亮黄经 ——
const rad=Math.PI/180;const norm=(x:number)=>((x%360)+360)%360;
const daysSinceJ2000=(d:Date)=>d.getTime()/86400000+2440587.5-2451545;
export function sunLongitude(d:Date){const n=daysSinceJ2000(d),L=280.460+0.9856474*n,g=(357.528+0.9856003*n)*rad;return norm(L+1.915*Math.sin(g)+0.020*Math.sin(2*g))}
export function moonLongitude(d:Date){const n=daysSinceJ2000(d);const L=218.316+13.176396*n,Mp=(134.963+13.064993*n)*rad,F=(93.272+13.229350*n)*rad,D=(297.850+12.190749*n)*rad,M=(357.529+0.985600*n)*rad;
 return norm(L+6.289*Math.sin(Mp)+1.274*Math.sin(2*D-Mp)+0.658*Math.sin(2*D)+0.214*Math.sin(2*Mp)-0.186*Math.sin(M)-0.114*Math.sin(2*F))}
export const signAt=(longitude:number)=>SIGNS[Math.floor(norm(longitude)/30)];
export const sunSign=(d:Date)=>signAt(sunLongitude(d));
export const moonSign=(d:Date)=>signAt(moonLongitude(d));
/** 出生日期（YYYY-MM-DD）的太阳星座，按当天正午计算；节气交界那天以正午为准。 */
export function birthSign(birthDate:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(birthDate))return null;return sunSign(new Date(birthDate+'T12:00:00'))}

/** 今天的牌和用户、今日月亮之间的呼应，最多两句；没有就返回空数组。 */
export function resonance(a:CardAstro,mine:Sign|null,moon:Sign):string[]{const out:string[]=[];
 if(mine&&a.signs.some(s=>s.id===mine.id))out.push(a.kind==='planet'?`这张牌的行星正是你的太阳星座${mine.zh}的守护星。`:`这张牌对应的正是你的太阳星座${mine.zh}，它说的事可能和你格外贴近。`);
 else if(mine&&a.element===mine.element)out.push(`这张牌和你的星座${mine.zh}同属${mine.element}元素。`);
 if(a.kind!=='planet'&&a.signs.some(s=>s.id===moon.id))out.push(`今天月亮正走在${moon.zh}，和这张牌对应的星座相同。`);
 return out}

/** 星座与行星符号（♈–♓、☉☽☿♀♂♃♄）在很多手机上默认显示成彩色 emoji，加 U+FE0E 让它按文字显示，跟黑金配色一致 */
export const textGlyph=(s:string)=>s.replace(/([\u2609\u263D\u263F-\u2644\u2646\u2647\u2648-\u2653])(?!\uFE0E)/g,'$1\uFE0E');
