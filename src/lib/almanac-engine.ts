import calendar from 'lunar-javascript';
import { Body, Illumination, MoonPhase } from 'astronomy-engine';
import { dailyEditorials, editorialDictionary, sensoryByElement } from './editorial-dictionary.ts';
import type { Element, GravityEditorial, SensoryToken, ModernTerm } from './editorial-dictionary.ts';
const {Solar,Lunar}=calendar;
const DAY=86_400_000;
const GAN:Readonly<Record<string,Element>>={甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'};
const ZHI:Readonly<Record<string,Element>>={子:'水',丑:'土',寅:'木',卯:'木',辰:'土',巳:'火',午:'火',未:'土',申:'金',酉:'金',戌:'土',亥:'水'};
const GENERATES:Readonly<Record<Element,Element>>={木:'火',火:'土',土:'金',金:'水',水:'木'};
const CONTROLS:Readonly<Record<Element,Element>>={木:'土',土:'水',水:'火',火:'金',金:'木'};
const formatter=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
export function chinaDateString(date:Date):string {
  if(!Number.isFinite(date.valueOf()))throw new RangeError('无效时间');
  const p=formatter.formatToParts(date);const v=(key:Intl.DateTimeFormatPartTypes)=>p.find(x=>x.type===key)!.value;
  return `${v('year')}-${v('month')}-${v('day')}`;
}
/** 无时刻的公历日期采用中国历书民用日；固定正午使生日/日签与设备时区无关。 */
export function dateAtChinaNoon(dateStr:string):Date {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(dateStr))throw new RangeError('日期格式须为 YYYY-MM-DD');
  const d=new Date(`${dateStr}T12:00:00+08:00`);
  if(!Number.isFinite(d.valueOf())||chinaDateString(d)!==dateStr||Number(dateStr.slice(0,4))<1900||Number(dateStr.slice(0,4))>2100)throw new RangeError('支持1900—2100年的有效公历日期');
  return d;
}
export interface SolarTerm {name:string;at:string;chinaTime:string}
export interface Almanac {
  solar:{date:string;year:number;month:number;day:number;timeZone:'Asia/Shanghai';at:string};
  lunar:{year:number;month:number;isLeapMonth:boolean;day:number;dayName:string;label:string};
  ganZhi:{year:string;month:string;day:string;stemElement:Element;branchElement:Element;convention:string};
  solarTerms:{current:SolarTerm;upcoming:SolarTerm;onDate:string|null;exactDaysRemaining:number;calendarDaysRemaining:number};
  moon:{name:string;angle:number;phaseRatio:number;illumination:number;illuminationPercent:number;waxing:boolean;at:string;source:string};
  traditional:{yi:readonly string[];ji:readonly string[]};
}
function solarTerm(s:ReturnType<typeof Solar.fromYmd>,name:string):SolarTerm {
  const chinaTime=s.toYmdHms();return {name,chinaTime,at:new Date(chinaTime.replace(' ','T')+'+08:00').toISOString()};
}
function lunarPhaseName(angle:number):string {
  if(angle<5||angle>=355)return '新月附近';if(angle<85)return '娥眉月';if(angle<=95)return '上弦月附近';if(angle<175)return '盈凸月';if(angle<=185)return '满月附近';if(angle<265)return '亏凸月';if(angle<=275)return '下弦月附近';return '残月';
}
/** 历书按北京时间；天文数据使用传入 Date 表示的实际瞬间，而非农历日粗略推断。 */
export function calculateAlmanac(date:Date):Almanac {
  const dateStr=chinaDateString(date);dateAtChinaNoon(dateStr);
  const parts=formatter.formatToParts(date);const n=(key:Intl.DateTimeFormatPartTypes)=>Number(parts.find(p=>p.type===key)!.value);
  const solar=Solar.fromYmdHms(n('year'),n('month'),n('day'),n('hour'),n('minute'),n('second'));const lunar=solar.getLunar();
  // Round-trip also verifies leap-month identity through Lunar, rather than treating it as a solar month.
  const lunarDate=Lunar.fromYmd(lunar.getYear(),lunar.getMonth(),lunar.getDay());
  const aliases:Readonly<Record<string,string>>={DA_XUE:'大雪',DONG_ZHI:'冬至',XIAO_HAN:'小寒',DA_HAN:'大寒',LI_CHUN:'立春',YU_SHUI:'雨水',JING_ZHE:'惊蛰'};
  const table=lunar.getJieQiTable();const terms=Object.entries(table).map(([name,s])=>solarTerm(s,aliases[name]??name)).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
  const current=terms.filter(t=>Date.parse(t.at)<=date.valueOf()).at(-1);const upcoming=terms.find(t=>Date.parse(t.at)>date.valueOf());
  if(!current||!upcoming)throw new RangeError('节气表没有覆盖该时刻');
  const angle=MoonPhase(date);const illumination=Math.min(1,Math.max(0,Illumination(Body.Moon,date).phase_fraction));
  const stemElement=GAN[lunar.getDayGan()],branchElement=ZHI[lunar.getDayZhi()];if(!stemElement||!branchElement)throw new Error('无效干支五行');
  return {solar:{date:dateStr,year:n('year'),month:n('month'),day:n('day'),timeZone:'Asia/Shanghai',at:date.toISOString()},lunar:{year:lunarDate.getYear(),month:Math.abs(lunarDate.getMonth()),isLeapMonth:lunarDate.getMonth()<0,day:lunarDate.getDay(),dayName:lunarDate.getDayInChinese(),label:`${lunarDate.getYearInChinese()}年 ${lunarDate.getMonthInChinese()}月${lunarDate.getDayInChinese()}`},ganZhi:{year:lunar.getYearInGanZhiByLiChun(),month:lunar.getMonthInGanZhiExact(),day:lunar.getDayInGanZhi(),stemElement,branchElement,convention:'年以立春日换年；月以节的交接时刻换月；日以北京时间0点换日。'},solarTerms:{current,upcoming,onDate:terms.find(t=>chinaDateString(new Date(t.at))===dateStr)?.name??null,exactDaysRemaining:(Date.parse(upcoming.at)-date.valueOf())/DAY,calendarDaysRemaining:Math.round((Date.parse(chinaDateString(new Date(upcoming.at))+'T00:00:00Z')-Date.parse(dateStr+'T00:00:00Z'))/DAY)},moon:{name:lunarPhaseName(angle),angle,phaseRatio:angle/360,illumination,illuminationPercent:illumination*100,waxing:angle<180,at:date.toISOString(),source:'Astronomy Engine 2.1.19 / geocentric MoonPhase + Illumination'},traditional:{yi:lunar.getDayYi(),ji:lunar.getDayJi()}};
}
/** FNV-1a 32-bit，只有显式种子，不依赖 Math.random、运行时区或 Date.now。 */
export function deterministicHash(value:string):number {let hash=2166136261;for(let i=0;i<value.length;i++){hash^=value.charCodeAt(i);hash=Math.imul(hash,16777619)}return hash>>>0}
export type ElementRelation='同气'|'日生我'|'我生日'|'日克我'|'我克日'|'无生日';
export function elementRelation(day:Element,birth?:Element):ElementRelation {if(!birth)return '无生日';if(day===birth)return '同气';if(GENERATES[day]===birth)return '日生我';if(GENERATES[birth]===day)return '我生日';if(CONTROLS[day]===birth)return '日克我';return '我克日'}
export type EnergyAxis='Focus'|'Creation'|'Solitude'|'Social'|'Intuition';
export interface EditorialAction {text:string;traditionalTerm:string|null;basis:'traditional-translation'|'editorial-supplement'}
export interface DailyGravity {
  version:'gravity-v1';date:string;birthDate:string|null;seed:number;keyword:string;keywordEn:string;critique:GravityEditorial['lines'];
  energy:Record<EnergyAxis,number>;dos:readonly EditorialAction[];avoids:readonly EditorialAction[];
  elements:{dayStem:Element;dayBranch:Element;birthStem:Element|null;relation:ElementRelation};sensory:SensoryToken;
  almanac:Almanac;basis:string;
}
function chooseActions(terms:readonly string[],side:'do'|'avoid',seed:string,exclude:ReadonlySet<string>):EditorialAction[] {
  const dictionary:Readonly<Record<string,ModernTerm>>=editorialDictionary;
  const candidates:EditorialAction[]=terms.flatMap(term=>(dictionary[term]?.[side]??[]).map(text=>({text,traditionalTerm:term,basis:'traditional-translation' as const})));
  const supplements:EditorialAction[]=Object.values(dictionary).flatMap(row=>row[side].map(text=>({text,traditionalTerm:null,basis:'editorial-supplement' as const})));
  const rank=(a:EditorialAction,b:EditorialAction)=>deterministicHash(seed+a.text)-deterministicHash(seed+b.text)||a.text.localeCompare(b.text,'zh');
  const seen=new Set(exclude);const usedTerms=new Set<string>();const result:EditorialAction[]=[];
  for(const action of candidates.sort(rank)){if(seen.has(action.text)||usedTerms.has(action.traditionalTerm!))continue;seen.add(action.text);usedTerms.add(action.traditionalTerm!);result.push(action);if(result.length===3)return result}
  for(const action of supplements.sort(rank)){if(seen.has(action.text))continue;seen.add(action.text);result.push(action);if(result.length===3)break}
  return result;
}
/** 五行关系参与选稿和视觉种子；分数是确定性的编辑性刻度，绝非测量或预测。 */
export function generateDailyGravity(dateStr:string,birthDateStr?:string):DailyGravity {
  const date=dateAtChinaNoon(dateStr);const almanac=calculateAlmanac(date);const birth=birthDateStr?calculateAlmanac(dateAtChinaNoon(birthDateStr)):null;
  if(birthDateStr&&birthDateStr>dateStr)throw new RangeError('出生日期不能晚于日签日期');
  const dayStem=almanac.ganZhi.stemElement,dayBranch=almanac.ganZhi.branchElement,birthStem=birth?.ganZhi.stemElement??null;
  const relation=elementRelation(dayStem,birthStem??undefined);const seedText=`gravity-v1|${dateStr}|${birthDateStr??'guest'}|${almanac.ganZhi.day}|${dayStem}|${dayBranch}|${birthStem??'none'}|${relation}`;const seed=deterministicHash(seedText);
  const editorial=dailyEditorials[deterministicHash(seedText+'|editorial')%dailyEditorials.length];
  const energy:Record<EnergyAxis,number>={Focus:0,Creation:0,Solitude:0,Social:0,Intuition:0};
  for(const key of Object.keys(energy) as EnergyAxis[])energy[key]=deterministicHash(`${seedText}|${key}`)%101;
  const dos=chooseActions(almanac.traditional.yi,'do',seedText,new Set());const avoids=chooseActions(almanac.traditional.ji,'avoid',seedText,new Set(dos.map(a=>a.text)));
  return {version:'gravity-v1',date:dateStr,birthDate:birthDateStr??null,seed,keyword:editorial.keyword,keywordEn:editorial.english,critique:editorial.lines,energy,dos,avoids,elements:{dayStem,dayBranch,birthStem,relation},sensory:sensoryByElement[dayStem],almanac,basis:'历法：lunar-javascript；月相：Astronomy Engine。文案、能量刻度、感官时段与方位：固定种子的原创象征性编辑内容，不是个人事实或科学预测。'};
}
