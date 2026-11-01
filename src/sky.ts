import {Body,MoonPhase,Illumination,Ecliptic,GeoVector,SearchMoonQuarter} from 'astronomy-engine';
export const signs=[['aries','白羊座'],['taurus','金牛座'],['gemini','双子座'],['cancer','巨蟹座'],['leo','狮子座'],['virgo','处女座'],['libra','天秤座'],['scorpio','天蝎座'],['sagittarius','射手座'],['capricorn','摩羯座'],['aquarius','水瓶座'],['pisces','双鱼座']] as const;
export type Sign=typeof signs[number][0];
export const astronomySource='https://github.com/cosinekitty/astronomy';
export interface Sky {date:string;at:string;computedAt:string;timezone:string;phase:number;phaseName:string;illumination:number;positions:{body:string;longitude:number;sign:string}[];nextQuarter:{name:string;at:string}}
export function skyForDate(date:string):Sky {if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('无效日期');const d=new Date(date+'T12:00:00');if(Number.isNaN(d.valueOf())||d.getFullYear()<1900||d.getFullYear()>2100)throw Error('天文计算支持1900—2100年');const phase=MoonPhase(d);const phaseName=phase<5||phase>=355?'新月附近':phase<85?'娥眉月':phase<=95?'上弦月附近':phase<175?'盈凸月':phase<=185?'满月附近':phase<265?'亏凸月':phase<=275?'下弦月附近':'残月';const next=SearchMoonQuarter(d);return {date,at:d.toISOString(),computedAt:new Date().toISOString(),timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,phase,phaseName,illumination:Illumination(Body.Moon,d).phase_fraction,positions:([[Body.Sun,'太阳'],[Body.Moon,'月亮'],[Body.Mercury,'水星'],[Body.Venus,'金星'],[Body.Mars,'火星'],[Body.Jupiter,'木星'],[Body.Saturn,'土星']] as const).map(([b,label])=>{const longitude=Ecliptic(GeoVector(b,d,true)).elon;return {body:label,longitude,sign:signs[Math.floor(longitude/30)%12][1]}}),nextQuarter:{name:['新月','上弦月','满月','下弦月'][next.quarter],at:next.time.date.toISOString()}}}
const memo=new Map<string,Sky>();export function cachedSky(date:string){const timezone=Intl.DateTimeFormat().resolvedOptions().timeZone;const key=date+timezone;if(!memo.has(key))memo.set(key,skyForDate(date));return memo.get(key)!}
// 占星太阳宫是象征约定，不是出生盘宫位；不需地点，也不声称有预测效力。
const houses=[
['自我','先说明今天想如何参与，而不是等别人安排你的位置。','表达自己的需要，同时给对方独立选择的空间。','挑出一项自己能主导的小任务。','检查消费是否在服务自己的真实需要。','把今天的一次决定交还给自己。'],
['资源','从手边已有的资源开始，看看什么已经足够。','商量付出与接受的范围。','先盘点材料与可用时间。','记录一笔非必要支出，暂缓五分钟再决定。','留意安全感是否过分依附于拥有多少。'],
['沟通','把模糊想法变成一段可以被理解的话。','用事实加需要的句式交流。','用自己的话解释一个知识点。','核对宣传和合同里的具体条件。','先提一个问题，再作一个判断。'],
['安顿','整理能让自己安定下来的日常基础。','在舒适的节奏里交流，留意彼此的私密边界。','准备一处不被打断的工作角落。','盘点住处或日常用品的实际需要。','先安顿眼前，不急着解决所有远处的问题。'],
['表达','给创作和轻松的愉快留一段具体时间。','分享一件真正让你开心的小事。','先做一张草图，再评价是否值得继续。','为娱乐设定清楚额度。','允许不以产出为目标的十分钟。'],
['日常','从一项重复的小事里减少摩擦。','日常的小回应比猜测更容易核实。','优化一个学习或工作步骤。','检查一项重复付费是否仍在使用。','观察节奏，减少一次不必要的切换。'],
['协商','把一个共同问题摆到双方都能看见的位置。','先听清对方是否愿意，再讨论如何靠近。','核对合作目标与分工。','共同支出先把规则说清楚。','练习既有立场又能倾听。'],
['共享','辨认共同承担的部分，以及仍属于自己的边界。','讨论信任，不用控制来替代确认。','写清合作中没有说出口的条件。','核对借贷、订阅和长期义务。','区分需要放下的负担与应承担的责任。'],
['视野','换一份材料或一个角度，检验习惯中的假设。','理解不同经历造成的表达差异。','花十分钟研究一个超出惯用方法的问题。','了解成本再安排学习或出行。','给尚未知道的事情留下位置。'],
['方向','把长期目标压缩成今天看得见的一步。','说清未来期待，也尊重眼前的现实条件。','定义一个可以交付的小成果。','比较长期维护成本和短期吸引力。','区分自己的目标与外界的评判。'],
['连接','留意共同兴趣带来的支持，少一点独自猜测。','与朋友分享一件具体的小事。','向可信同伴请教一个明确问题。','比较共享资源是否比重复购买更适合。','在群体里保留自己的选择。'],
['留白','给未整理的想法一点安静的空间。','需要独处时清楚说明，而非突然消失。','关闭信息入口十分钟，再回到一项任务。','暂缓用购物填补难以命名的感受。','写下一个未完成的念头，然后允许它暂时搁置。']];
export function symbolicHoroscope(date:string,sign:Sign,sky=cachedSky(date)){const i=signs.findIndex(s=>s[0]===sign);if(i<0)throw Error('未知星座');const sunHouse=(Math.floor(sky.positions[0].longitude/30)-i+12)%12;const moonHouse=(Math.floor(sky.positions[1].longitude/30)-i+12)%12;const sun=houses[sunHouse],moon=houses[moonHouse];const weekday=new Date(date+'T12:00:00').getDay();return {date,sign:signs[i][1],headline:`${sun[0]}与${moon[0]}`,summary:`以你的太阳星座为第1宫，今日当地中午的太阳落入象征第${sunHouse+1}宫、月亮落入象征第${moonHouse+1}宫。${sun[1]}${moon[1]}`,areas:[{name:'感情与人际',label:moon[0],message:moon[2]},{name:'学业与事业',label:sun[0],message:sun[3]},{name:'财富与消费',label:'资源观察',message:moon[4]},{name:'情绪与行动',label:moon[0],message:moon[5]}],word:moon[0],color:['暖白','岩灰','雾蓝','银白'][i%4],number:((i+weekday)%9)+1,action:moon[5]+'留五分钟记下一个实际发生的细节。',method:'本地象征解读 · 太阳星座整宫约定；并非个人出生盘，也不是外部实时运势。',at:sky.at}}
