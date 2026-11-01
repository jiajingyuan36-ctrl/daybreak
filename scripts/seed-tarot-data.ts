/** Reuses Daybreak's original Chinese knowledge. No third-party text or images scraped. */
import {cards} from '../src/cards.ts';import {cardAstro} from '../src/astro.ts';import {knowledgeById} from '../src/knowledge.ts';import {art,cardImageUrl} from '../src/art.ts';import {mkdir,writeFile} from 'node:fs/promises';import type {TarotCard,Suit,Element} from '../src/types/tarot.ts';
const suits:Record<string,Suit>={'权杖':'wands','圣杯':'cups','宝剑':'swords','星币':'pentacles'};
const elements:Record<Suit,Element>={none:'spirit',wands:'fire',cups:'water',swords:'air',pentacles:'earth'};
await mkdir('src/data',{recursive:true});await mkdir('public/cards',{recursive:true});
// 文案全部来自 src/plain.ts（经 cards.ts / knowledge.ts），这里只做格式转换，不生成任何文字。
const data:TarotCard[]=cards.map(c=>{const k=knowledgeById(c.id),suit=suits[c.suit]??'none';return {id:c.id,number:c.number,name_zh:c.nameZh,name_en:c.nameEn,arcana:c.arcanaType,suit,element:elements[suit],astrology:(a=>a?`${a.label}：${a.plain}`:'')(cardAstro(c.id)),image_url:cardImageUrl(c.id),thumb_url:cardImageUrl(c.id,true),symbolism:[k.symbols],yes_no:'maybe',plain_intro:c.plainIntro,upright:{keywords:c.keywordsUpright,reading:c.meaningUpright},reversed:{keywords:c.keywordsReversed,reading:c.meaningReversed},life_aspects:{love:k.love,career:k.work,finance:k.money},today_action:c.action,evening_question:c.reflectionPrompt,sources:[k.source],editorialNote:'牌面为 1909 年 Rider–Waite–Smith 原版扫描（Pamela Colman Smith 绘，公有领域）。是非问题不作确定判断。'}});
await writeFile('src/data/tarot_cards_78.json',JSON.stringify(data,null,2)+'\n');for(const c of cards)await writeFile(`public/cards/${c.id}.svg`,art(c));

const {tarotSpreads}=await import('../src/lib/tarot-catalog.ts');await writeFile('src/data/tarot_spreads.json',JSON.stringify(tarotSpreads,null,2)+'\n');
