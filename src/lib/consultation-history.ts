import {tarotSpreads} from './tarot-catalog.ts';
import {cards} from '../cards.ts';
import type {Topic} from '../types/tarot.ts';

export const CONSULT_KEY='daybreak:consultations:v1';
export interface Saved {id:string;at:string;question:string;topic:Topic;spreadId:string;cards:{id:string;reverse:boolean}[]}
const ids=new Set(cards.map(c=>c.id));
const topics:readonly Topic[]=['general','daily','love','career','wealth','decision'];

function valid(value:unknown):value is Saved {
 if(!value||typeof value!=='object')return false;
 const r=value as Partial<Saved>;
 const spread=tarotSpreads.find(s=>s.id===r.spreadId);
 return typeof r.id==='string'&&!!r.id&&typeof r.at==='string'&&Number.isFinite(Date.parse(r.at))
  &&typeof r.question==='string'&&r.question.length<=1000&&topics.includes(r.topic as Topic)
  &&!!spread&&Array.isArray(r.cards)&&r.cards.length===spread.positions.length
  &&r.cards.every(c=>c&&ids.has(c.id)&&typeof c.reverse==='boolean')
  &&new Set(r.cards.map(c=>c.id)).size===r.cards.length;
}
export function readConsultations(store:Pick<Storage,'getItem'>):Saved[]{
 const rows:unknown=JSON.parse(store.getItem(CONSULT_KEY)||'[]');
 return Array.isArray(rows)?rows.filter(valid).slice(0,30):[];
}

