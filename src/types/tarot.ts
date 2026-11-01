export type Suit='none'|'wands'|'cups'|'swords'|'pentacles';
export type Element='fire'|'water'|'air'|'earth'|'spirit';
export type Topic='daily'|'love'|'career'|'wealth'|'decision'|'general';
export interface CardMeaning {keywords:string[];reading:string}
export interface LifeAspects {love:string;career:string;finance:string}
export interface TarotCard {id:string;number:number;name_zh:string;name_en:string;arcana:'major'|'minor';suit:Suit;element:Element;astrology:string;image_url:string;thumb_url:string;symbolism:string[];yes_no:'yes'|'no'|'maybe';plain_intro:string;upright:CardMeaning;reversed:CardMeaning;life_aspects:LifeAspects;today_action:string;evening_question:string;sources:string[];editorialNote:string}
/** source：位置含义的原典出处（英文原文 + 中文直译），只有能核对到原文的位置才填。 */
export interface SpreadPosition {index:number;title:string;meaning:string;coords:{x:number;y:number;rotation?:number};source?:{en:string;zh:string}}
/** hint：牌阵旁的小标注；sourceUrl：位置含义所依据的原文页面；hidden：不再展示、只为读取旧记录保留。 */
export interface TarotSpread {id:string;name_zh:string;name_en:string;description:string;difficulty:'beginner'|'intermediate'|'advanced';recommended_topics:Topic[];positions:SpreadPosition[];hint?:string;sourceUrl?:string;sourceNote?:string;hidden?:boolean}
export interface DrawnCard {card:TarotCard;isReversed:boolean;position:SpreadPosition}
export interface ElementalSummary {counts:Record<Element,number>;majorCount:number;minorCount:number;majorRatio:number;total:number;description:string}
