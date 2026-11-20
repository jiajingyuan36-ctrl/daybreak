import test from 'node:test';import assert from 'node:assert/strict';
const mem=new Map<string,string>();
(globalThis as {localStorage?:Storage}).localStorage={getItem:k=>mem.get(k)??null,setItem:(k,v)=>{mem.set(k,String(v))},removeItem:k=>{mem.delete(k)},clear:()=>mem.clear(),key:()=>null,length:0} as Storage;
const {cleanBookmarks,listBookmarks,toggleBookmark,hasBookmark,removeBookmark,BOOKMARK_KEY,BOOKMARK_LIMIT}=await import('../src/bookmarks.ts');
const at='2026-11-20T08:00:00.000Z';
test('bookmarks: invalid entries, fake card ids and duplicates are dropped',()=>{
 const out=cleanBookmarks([{kind:'card',id:'m18',at},{kind:'card',id:'m18',at},{kind:'card',id:'nope',at},{kind:'day',date:'2026-11-2',cardId:'m1',reversed:false,at},{kind:'day',date:'2026-11-20',cardId:'m1',reversed:'yes',at},{kind:'day',date:'2026-11-20',cardId:'m1',reversed:true,at},null,'x',{kind:'card',id:'m0',at:'not a date'}]);
 assert.deepEqual(out.map(b=>b.kind==='card'?b.id:b.date),['m18','2026-11-20']);
 assert.deepEqual(cleanBookmarks('nope'),[]);
});
test('bookmarks: toggle adds to the front, toggles off, survives bad JSON',()=>{
 mem.clear();
 assert.equal(toggleBookmark({kind:'card',id:'m18'}),true);
 assert.equal(toggleBookmark({kind:'day',date:'2026-11-20',cardId:'m1',reversed:true}),true);
 assert.deepEqual(listBookmarks().map(b=>b.kind),['day','card']);
 assert.ok(hasBookmark('card:m18'));
 assert.equal(toggleBookmark({kind:'card',id:'m18'}),false);assert.ok(!hasBookmark('card:m18'));
 removeBookmark('day:2026-11-20');assert.equal(listBookmarks().length,0);
 mem.set(BOOKMARK_KEY,'{broken');assert.deepEqual(listBookmarks(),[]);
});
test('bookmarks: list is capped',()=>{
 const many=Array.from({length:BOOKMARK_LIMIT+40},(_,i)=>({kind:'day',date:new Date(Date.UTC(2020,0,1+i)).toISOString().slice(0,10),cardId:'m0',reversed:false,at}));
 assert.equal(cleanBookmarks(many).length,BOOKMARK_LIMIT);
});
