import {composeReading} from './copy.ts';
import {dailyFortune} from './fortune.ts';
import {cards,cardById} from './cards.ts';
import type {Preferences,Day,Reading} from './types.ts';
export const themes=['自我与成长','关系与情感','学习与工作','创造力与灵感','状态与能量','随意探索'];
export const moods=['平静','困惑','疲惫','期待','焦虑','充满动力'];
export const intents=['获得清晰','找回勇气','放慢节奏','关注关系','寻找灵感'];
export function localDate(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
export interface ReadingProvider {generate(d:Pick<Day,'cardId'|'reversed'|'mood'|'intent'>,p:Preferences):Reading}
export const localProvider:ReadingProvider={generate(d,p){return composeReading(d,p,cardById(d.cardId))}};
export function draw(date:string,p:Preferences,mood='',intent='',rng= Math.random):Day {const c=cards[Math.min(77,Math.floor(rng()*78))];const base={date,cardId:c.id,reversed:rng()<.35,mood,intent,themes:[...p.themes]};return {...base,reading:localProvider.generate(base,p),...(p.birthDate?{fortune:dailyFortune(date,p)}:{})}}
export function ensureDay(days:Record<string,Day>,date:string,p:Preferences,mood='',intent=''){return days[date]||draw(date,p,mood,intent)}
