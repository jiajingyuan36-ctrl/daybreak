// 按生辰推算的今日运势。排盘、十神、冲合、方位全部由 lunar-javascript（6tail/lunar-javascript）计算；
// 这里只把每种十神和冲合关系翻译成白话。传统命理的规则，仅供参考，不预测具体事件。
import calendar from 'lunar-javascript';
import {dateAtChinaNoon} from './almanac-engine.ts';
const {Solar,LunarUtil}=calendar;
export type Level='顺'|'平'|'留心';
export type Element='木'|'火'|'土'|'金'|'水';
export interface BirthInput {date:string;time?:string}
export interface BirthChart {pillars:{year:string;month:string;day:string;time:string|null};dayMaster:string;dayMasterElement:Element;shengXiao:string;elements:Record<Element,number>;hourKnown:boolean}
export interface AreaFortune {name:'关系'|'学业事业'|'资源与精力';level:Level;text:string}
export interface PersonalFortune {date:string;dayPillar:string;shiShen:string;why:string;title:string;summary:string;areas:AreaFortune[];branchNote:string|null;doThis:string;avoid:string;positions:{xi:string;cai:string};chart:BirthChart;basis:string}
interface ShiShenCopy {why:string;title:string;summary:string;love:string;work:string;money:string;doThis:string;avoid:string;levels:[Level,Level,Level]}
// 十神：今天的日干相对你日主（出生那天的天干）的关系。why 只在“你的八字”里解释，正文不讲术语。
const SHI_SHEN:Record<string,ShiShenCopy>={
比肩:{why:'和你的日主五行相同、阴阳也相同',title:'有伴的一天',summary:'今天身边容易出现跟你想法很像的人，一起做事会顺手，你自己也比平时更有主见。唯一要留神的是固执，别人提意见时，先听完再决定改不改。',love:'朋友、同学之间走得近，一起吃个饭、干点小事，比单独见面更自在。',work:'找个搭档分着做，你做擅长的那部分，进度会比一个人硬扛快不少。',money:'聚会、拼单容易一不小心花多，出门前心里先定个数。',doThis:'约个合得来的人，一起把一件拖着的事往前推一点。',avoid:'为了面子跟人争个高低。',levels:['顺','顺','平']},
劫财:{why:'和你的日主五行相同、阴阳相反',title:'守好自己的时间',summary:'今天人来人往，容易被拉去帮忙、凑热闹，也容易不知不觉跟人比。热闹可以去，答应之前先看看自己还剩多少时间和钱。',love:'局多话多，不想去的可以客气推掉，用不着为了合群勉强自己。',work:'身边人的节奏会影响你，盯住自己的进度就好，别被带着跑。',money:'今天别借钱给人，也别冲动下单，大一点的开销留到明天再说。',doThis:'把今天的事分成“非我不可”和“可以推掉”两栏。',avoid:'别人一起哄，就临时决定花一笔钱。',levels:['平','平','留心']},
食神:{why:'由你的日主生出来、阴阳相同',title:'松快的一天',summary:'今天心情比较松，做喜欢的事会很顺手：好好吃顿饭、写点东西、做点手工都行。你一放松，身边的人也跟着轻松。',love:'聊些吃的玩的就好，不用特意找重要话题。',work:'写东西、做设计、跟人讲想法，今天都比平时顺。',money:'钱容易花在吃喝玩乐上，犒劳自己一下可以，别一路买下去。',doThis:'做一件纯粹因为喜欢的小事，做完记一句感受。',avoid:'心情一好就把日程排太满。',levels:['顺','顺','平']},
伤官:{why:'由你的日主生出来、阴阳相反',title:'点子多的一天',summary:'今天脑子转得快，主意一个接一个，也容易看什么都不顺眼。拿来改进手上的事正合适；只是说话前过一下语气，同样的意思换个说法，对方更听得进去。',love:'有不满容易脱口而出，开口前停三秒，挑最想说的那一句。',work:'很适合提改进意见、打磨作品。要跟领导或老师提，先把理由备好。',money:'看到新鲜东西容易心动，先放进购物车，明天再看还想不想要。',doThis:'写下一处你早就觉得能更好的地方，顺手写个具体改法。',avoid:'在火气上头时发长消息、写评论。',levels:['留心','顺','平']},
正财:{why:'被你的日主克、阴阳相反',title:'踏实做事的一天',summary:'今天的收获多半来自实打实的付出。钱、账单、合同这类具体的事，处理起来很顺；该收尾的收尾，做一点是一点，晚上回头看会挺踏实。',love:'帮对方办成一件麻烦事，比说十句好听的都管用。',work:'对账、整理文件、收尾这类细活，今天做起来又快又准。',money:'记账、做预算、存一笔钱都合适，花钱也会比平时理性。',doThis:'花十分钟把这个月的收支记一遍。',avoid:'被“轻松赚快钱”一类的说法吸引。',levels:['平','顺','顺']},
偏财:{why:'被你的日主克、阴阳相同',title:'有机会冒出来',summary:'今天可能有临时的邀约、别人介绍的机会，或者一个副业点子突然冒出来，值得留意。来得快的东西也去得快，答应之前多问一句、多看一眼。',love:'社交场合比较顺，容易认识新朋友，想约谁可以主动开口。',work:'认识同行、聊合作、试试一直想做的副业点子，今天都可以迈一步。',money:'可能有点小惊喜，但别把运气当本事，投资、抽奖都量力。',doThis:'回复一个你搁了好久的邀约或合作消息。',avoid:'没看清楚就答应别人的“好机会”。',levels:['顺','平','平']},
正官:{why:'克你的日主、阴阳相反',title:'按规矩来的一天',summary:'今天把正式的事办掉最合适：交材料、走流程、见长辈。规规矩矩地做，别人看得见。会有一点被盯着的压力，不过都在你扛得住的范围里。',love:'把彼此的约定说清楚，或者陪陪长辈、处理家里的正事。',work:'交报告、开正式的会、跑手续，守时守约最加分。',money:'该缴的费、该还的钱，今天办掉，后面省心。',doThis:'今天最正式的那件事，提前十分钟准备好。',avoid:'觉得“差不多就行”，跳过该走的流程。',levels:['平','顺','平']},
七杀:{why:'克你的日主、阴阳相同',title:'有点紧的一天',summary:'今天可能碰到催得急的事，或者不太好说话的人。别硬碰硬，先分清轻重，把最要紧的一件做好。熬过去再回头看，往往是长本事的一天。',love:'外面的火气别带回家，说话冲之前先喝口水。',work:'难题可以啃，但给自己留出缓冲时间，别一口气接太多。',money:'今天别冒险，也别做大额决定，守住现有的就好。',doThis:'列出最急的三件事，只先做第一件。',avoid:'被人一激，就答应超出能力的要求。',levels:['留心','平','留心']},
正印:{why:'生你的日主、阴阳相反',title:'有人照应的一天',summary:'今天容易得到帮助，读书、请教人、补觉充电都顺。不用事事自己扛，开口请人搭把手，事情会好办很多。',love:'陪陪家人，跟长辈聊聊天；别人关心你，就大方接着。',work:'看资料、上课、整理笔记，今天脑子特别进得去东西。',money:'钱花在学习和身体上不亏，其他开销照常就好。',doThis:'读二十分钟一直想读的书或教程。',avoid:'明明累了，还硬撑着不休息。',levels:['顺','顺','平']},
偏印:{why:'生你的日主、阴阳相同',title:'想一个人待着',summary:'今天可能对热闹提不起劲，更想一个人待着，这很正常。正好钻研一点感兴趣的冷门东西，或者安静下来，把一件事想清楚。',love:'想独处就直说一声，别让对方以为你在生气。',work:'需要专注的活今天做得最好，也容易想到别人没想到的角度。',money:'容易为爱好花钱，买之前想想是不是真的会用。',doThis:'给自己留半小时，谁也别来打扰。',avoid:'一个人闷着想太久，把小事想成大事。',levels:['平','顺','平']}};
const ORDER:Level[]=['留心','平','顺'];const shift=(l:Level,d:number)=>ORDER[Math.min(2,Math.max(0,ORDER.indexOf(l)+d))];
const zhiIndex=(z:string)=>LunarUtil.ZHI.indexOf(z)-1;
function parseBirth(b:BirthInput){dateAtChinaNoon(b.date);const hourKnown=!!b.time&&/^([01]\d|2[0-3]):[0-5]\d$/.test(b.time);const [h,m]=hourKnown?b.time!.split(':').map(Number):[12,0];return {y:Number(b.date.slice(0,4)),mo:Number(b.date.slice(5,7)),d:Number(b.date.slice(8)),h,m,hourKnown}}
/** 出生时间按北京时间理解；不填时间时只排年、月、日三柱。 */
export function birthChart(b:BirthInput):BirthChart{const p=parseBirth(b);const lunar=Solar.fromYmdHms(p.y,p.mo,p.d,p.h,p.m,0).getLunar();const e=lunar.getEightChar();const pillars={year:e.getYear(),month:e.getMonth(),day:e.getDay(),time:p.hourKnown?e.getTime():null};const elements:Record<Element,number>={木:0,火:0,土:0,金:0,水:0};for(const pillar of Object.values(pillars)){if(!pillar)continue;elements[LunarUtil.WU_XING_GAN[pillar[0]] as Element]++;elements[LunarUtil.WU_XING_ZHI[pillar[1]] as Element]++}return {pillars,dayMaster:e.getDayGan(),dayMasterElement:LunarUtil.WU_XING_GAN[e.getDayGan()] as Element,shengXiao:lunar.getYearShengXiao(),elements,hourKnown:p.hourKnown}}
export function personalFortune(dateStr:string,b:BirthInput):PersonalFortune{if(b.date>dateStr)throw new RangeError('出生日期不能晚于查看的日期');dateAtChinaNoon(dateStr);const chart=birthChart(b);const today=Solar.fromYmd(Number(dateStr.slice(0,4)),Number(dateStr.slice(5,7)),Number(dateStr.slice(8))).getLunar();const dayPillar=today.getDayInGanZhi(),todayGan=dayPillar[0],todayZhi=dayPillar[1];const shiShen=LunarUtil.SHI_SHEN[chart.dayMaster+todayGan];const copy=SHI_SHEN[shiShen];if(!copy)throw new Error('无法识别十神：'+shiShen);
 const userDayZhi=chart.pillars.day[1];let [love,work,money]=copy.levels;let branchNote:string|null=null;
 if(LunarUtil.CHONG[zhiIndex(userDayZhi)]===todayZhi){branchNote=`今天是${todayZhi}日，跟你日柱的${userDayZhi}相冲，事情容易临时变卦。日程别排太满，留点空。`;love=shift(love,-1);work=shift(work,-1)}
 else if(LunarUtil.HE_ZHI_6[zhiIndex(userDayZhi)]===todayZhi){branchNote=`今天是${todayZhi}日，跟你日柱的${userDayZhi}相合，跟人打交道会顺，约人谈事挑今天不错。`;love=shift(love,1)}
 else if(today.getDayChongShengXiao()===chart.shengXiao){branchNote=`老黄历上今天“冲${chart.shengXiao}”，正好是你的生肖。大决定可以缓一缓，别的照常就好。`;money=shift(money,-1)}
 return {date:dateStr,dayPillar,shiShen,why:`今天的天干“${todayGan}”${copy.why}，命理里叫${shiShen}。`,title:copy.title,summary:copy.summary,areas:[{name:'关系',level:love,text:copy.love},{name:'学业事业',level:work,text:copy.work},{name:'资源与精力',level:money,text:copy.money}],branchNote,doThis:copy.doThis,avoid:copy.avoid,positions:{xi:today.getDayPositionXiDesc(),cai:today.getDayPositionCaiDesc()},chart,basis:'按你的八字和今天的干支推算，排盘用 lunar-javascript。看看就好，日子还是自己过。'}}
export const shiShenNames=Object.keys(SHI_SHEN);
