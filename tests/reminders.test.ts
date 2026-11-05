import test from 'node:test';import assert from 'node:assert/strict';
const {buildReminderIcs,foldLine,icsText,firstAlarm}=await import('../src/reminder.ts');
const {shouldRemindBackup,snooze,readBackupState,MIN_DAYS}=await import('../src/backup-reminder.ts');

test('ics: valid calendar, repeats daily, alarms on time, CRLF, lines within 75 bytes',()=>{
 const from=new Date(2026,10,5,9,0,0);const ics=buildReminderIcs({hour:7,minute:30,url:'https://daybreak-morning-ritual.onrender.com/ritual/',from,uid:'x'});
 assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n')&&ics.endsWith('END:VCALENDAR\r\n'));
 assert.ok(!/[^\r]\n/.test(ics),'只用 CRLF');
 for(const l of ics.split('\r\n'))assert.ok(new TextEncoder().encode(l).length<=75,l);
 const unfolded=ics.replace(/\r\n /g,'');
 for(const w of ['RRULE:FREQ=DAILY','DTSTART:20261106T073000','BEGIN:VALARM','TRIGGER:PT0M','UID:x@daybreak','SUMMARY:晨启 · 抽今天的一张牌','URL:https://daybreak-morning-ritual.onrender.com/ritual/'])assert.ok(unfolded.includes(w),w);
 assert.ok(unfolded.includes('DESCRIPTION:早上好。打开晨启，抽一张牌'));
 assert.throws(()=>buildReminderIcs({hour:24,minute:0,url:'u',from}));
});

test('ics helpers: folding never splits a character; escaping; first alarm is the next occurrence',()=>{
 const long='DESCRIPTION:'+'晨启'.repeat(40);const f=foldLine(long);assert.equal(f.replace(/\r\n /g,''),long);
 for(const l of f.split('\r\n'))assert.ok(new TextEncoder().encode(l).length<=75);
 assert.equal(icsText('a,b;c\\d\ne'),'a\\,b\;c\\\\d\\ne');
 assert.equal(firstAlarm(new Date(2026,10,5,6,0),7,30).getDate(),5); // 还没到 7:30，就是今天
 assert.equal(firstAlarm(new Date(2026,10,5,7,30),7,30).getDate(),6); // 正好到点或已过，就是明天
 assert.equal(firstAlarm(new Date(2026,11,31,23,0),7,0).getMonth(),0); // 跨年
});

test('backup reminder: only after enough days, then every 30 days, snooze 14 days, bad state ignored',()=>{
 const now=new Date('2026-11-05T01:00:00Z');
 assert.equal(shouldRemindBackup(MIN_DAYS-1,{},now),false);
 assert.equal(shouldRemindBackup(MIN_DAYS,{},now),true);
 assert.equal(shouldRemindBackup(30,{at:'2026-10-20T00:00:00Z'},now),false);
 assert.equal(shouldRemindBackup(30,{at:'2026-09-01T00:00:00Z'},now),true);
 const s=snooze(now);assert.equal(shouldRemindBackup(30,s,now),false);assert.equal(shouldRemindBackup(30,s,new Date(now.getTime()+15*864e5)),true);
 assert.deepEqual(readBackupState({getItem:()=>'不是 JSON'}),{});assert.deepEqual(readBackupState({getItem:()=>{throw Error('blocked')}}),{});
});
