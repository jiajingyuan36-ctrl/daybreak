import {composeReading} from './copy.ts';
import {dailyFortune} from './fortune.ts';
import {cards,cardById} from './cards.ts';
import {shuffleDeck} from './random.ts';
import type {Preferences,Day,Reading} from './types.ts';
export const themes=['自我与成长','关系与情感','学习与工作','创造力与灵感','状态与能量','随意探索'];
export const moods=['平静','困惑','疲惫','期待','焦虑','充满动力'];
export const intents=['获得清晰','找回勇气','放慢节奏','关注关系','寻找灵感'];
export function localDate(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
export interface ReadingProvider {generate(d:Pick<Day,'cardId'|'reversed'|'mood'|'intent'>,p:Preferences):Reading}
export const localProvider:ReadingProvider={generate(d,p){return composeReading(d,p,cardById(d.cardId))}};
export function dayFromCard(date:string,p:Preferences,mood:string,intent:string,selected:ReturnType<typeof shuffleDeck<(typeof cards)[number]>>[number]):Day {const base={date,cardId:selected.card.id,reversed:selected.reversed,mood,intent,themes:[...p.themes]};return {...base,reading:localProvider.generate(base,p),...(p.birthDate?{fortune:dailyFortune(date,p)}:{})}}
export function draw(date:string,p:Preferences,mood='',intent='',rng?:()=>number):Day {return dayFromCard(date,p,mood,intent,shuffleDeck(cards,rng?n=>Math.min(n-1,Math.floor(rng()*n)):undefined)[0])}
export function ensureDay(days:Record<string,Day>,date:string,p:Preferences,mood='',intent='',selected?:Parameters<typeof dayFromCard>[4]){return days[date]||(selected?dayFromCard(date,p,mood,intent,selected):draw(date,p,mood,intent))}
