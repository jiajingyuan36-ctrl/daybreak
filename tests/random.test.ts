import test from 'node:test';
import assert from 'node:assert/strict';
import {randomInteger,shuffleDeck,cutDeck} from '../src/random.ts';
import {cards} from '../src/cards.ts';
import {ensureDay} from '../src/engine.ts';
import {fresh} from '../src/storage.ts';

test('random integer rejects the uneven tail instead of biasing low card positions',()=>{
 const words=[0xffffffff,78,77];let calls=0;
 assert.equal(randomInteger(78,()=>{calls++;return words.shift()!}),0);
 assert.equal(calls,2);
 assert.equal(randomInteger(78,()=>words.shift()!),77);
 assert.throws(()=>randomInteger(0),RangeError);
});
test('a shuffled deck contains each card once with orientation fixed before selection',()=>{
 let calls=0;
 const deck=shuffleDeck(cards,n=>calls++%n);
 assert.equal(deck.length,78);
 assert.equal(new Set(deck.map(d=>d.card.id)).size,78);
 assert.equal(deck.filter(d=>d.reversed).length,39);
 assert.equal(cards[0].id,'m0');
 const cut=cutDeck(deck,23);
 assert.deepEqual(cut,[...deck.slice(23),...deck.slice(0,23)]);
 assert.strictEqual(cut[0],deck[23]);
 assert.deepEqual(cutDeck(cut,55),deck);
 assert.throws(()=>cutDeck(deck,0),RangeError);
});
test('daily selection uses the chosen physical position and reload keeps the saved card',()=>{
 const deck=shuffleDeck(cards,n=>n-1),state=fresh(),date='2026-11-03';
 const a=ensureDay({},date,state.preferences,'平静','',deck[0]);
 const b=ensureDay({},date,state.preferences,'平静','',deck[12]);
 assert.equal(a.cardId,deck[0].card.id);assert.equal(b.cardId,deck[12].card.id);
 assert.equal(b.reversed,deck[12].reversed);assert.notEqual(a.cardId,b.cardId);
 state.days[date]=b;
 assert.strictEqual(ensureDay(state.days,date,state.preferences,'','',deck[0]),b);
});
test('fresh shuffles may legitimately repeat a card instead of suppressing repeats',()=>{
 const first=shuffleDeck(cards,n=>n-1),again=shuffleDeck(cards,n=>n-1);
 assert.equal(first[0].card.id,again[0].card.id);
});
