import type {Card} from './types.ts';import {plainById} from './plain.ts';
// 牌名、编号与稳定 ID；全部白话文案在 plain.ts。ID 与历史记录、本地存储兼容，不可改动。
const majors=[['愚人','The Fool'],['魔术师','The Magician'],['女祭司','The High Priestess'],['皇后','The Empress'],['皇帝','The Emperor'],['教皇','The Hierophant'],['恋人','The Lovers'],['战车','The Chariot'],['力量','Strength'],['隐者','The Hermit'],['命运之轮','Wheel of Fortune'],['正义','Justice'],['倒吊人','The Hanged Man'],['死神','Death'],['节制','Temperance'],['恶魔','The Devil'],['高塔','The Tower'],['星星','The Star'],['月亮','The Moon'],['太阳','The Sun'],['审判','Judgement'],['世界','The World']];
const ranks=['王牌','二','三','四','五','六','七','八','九','十','侍从','骑士','王后','国王'];
const ens=['Ace','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Page','Knight','Queen','King'];
const suites=[{zh:'权杖',en:'Wands'},{zh:'圣杯',en:'Cups'},{zh:'宝剑',en:'Swords'},{zh:'星币',en:'Pentacles'}];
function card(id:string,nameZh:string,nameEn:string,arcanaType:Card['arcanaType'],suit:string,number:number,visualKey:string):Card{const p=plainById(id);return {id,nameZh,nameEn,arcanaType,suit,number,keywordsUpright:p.keywordsUpright,keywordsReversed:p.keywordsReversed,meaningUpright:p.dailyReading.upright,meaningReversed:p.dailyReading.reversed,reflectionPrompt:p.eveningQuestion,visualKey,action:p.todayAction,plainIntro:p.plainIntro,lifeAspects:p.lifeAspects}}
export const cards:Card[]=majors.map(([zh,en],n)=>card(`m${n}`,zh,en,'major','大阿卡纳',n,`major-${n}`));
for(const s of suites)ranks.forEach((rank,i)=>cards.push(card(`${s.en.toLowerCase()}-${i+1}`,s.zh+rank,`${ens[i]} of ${s.en}`,'minor',s.zh,i+1,`${s.en}-${i+1}`)));
export const cardById=(id:string)=>cards.find(c=>c.id===id)!;
export function roman(n:number):string{if(n===0)return '0';let out='';for(const [value,label] of [[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']] as const){while(n>=value){out+=label;n-=value}}return out}
