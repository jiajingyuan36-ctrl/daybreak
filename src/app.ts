import {readConsultations,type Saved} from './lib/consultation-history.ts';
import {findSpread} from './lib/tarot-catalog.ts';
import type {ShareLayout} from './share.ts';
import {isDark} from './theme.ts';
import {validBirth} from './fortune.ts';
import {monthSummary,shiftMonth} from './insights.ts';
import {particles} from './particles.ts';

import {lockStage,holdResult,exitResult,revealCard,reducedMotion,type DrawPhase} from './draw-motion.ts';import {guardCardImages} from './card-img.ts';
import {moods} from './engine.ts';import {moodLead} from './mood-copy.ts';import {buildReminderIcs} from './reminder.ts';import {shouldRemindBackup,snooze,readBackupState,writeBackupState} from './backup-reminder.ts';import {SITE_URL} from './site.ts';import {AI_ENABLED} from './site.ts';import {askCard,checkQuestion,warmUp,ASKS_PER_DAY,ASK_MAX} from './ai-ask.ts';import {pastDraws,noteExcerpt,shortDate} from './card-history.ts';
import type {ParticleHandle} from './particles.ts';
import type {Day,Preferences} from './types.ts';
import {cards,cardById} from './cards.ts';import {shuffleDeck,cutDeck,randomInteger} from './random.ts';import {cardAstro,sunSign,moonSign,birthSign,resonance,ASTRO_SOURCE_LEAD,ASTRO_SOURCE_LINK,ASTRO_SOURCE_URL} from './astro.ts';import {art,cardImage,cardBack} from './art.ts';import {triggerHaptic,busyButton} from './tactile.ts';import {glassSelect} from './popover.ts';import {localDate,ensureDay,draw,dayFromCard} from './engine.ts';import {read,write,fresh,defaults,validate} from './storage.ts';import {download,shareCard,dipperShareCard} from './share.ts';import {mountDipper,SLOTS,type DipperRitual} from './dipper-ritual.ts';import {startDeck,cutForStar,pickSlot} from './lib/dipper-draw.ts';import {defaultObserver,bearingLabel,type DipperSky} from './lib/dipper.ts';
let storage:Storage;try{storage=localStorage}catch{storage={getItem(){throw Error()},setItem(){throw Error()}} as unknown as Storage}
const loaded=read(storage);let data=loaded.data;let error=loaded.error||'';let today=localDate();let mood='',intent='',selected='',journalMonth=today.slice(0,7);let revealing=false;let eveningPhase=new Date().getHours()>=18;let draft:Preferences={...data.preferences,themes:[...data.preferences.themes]};
const root=document.querySelector<HTMLElement>('#app')!;const modal=document.querySelector<HTMLDialogElement>('#dialog')!;
// 抽完今天的牌后，每天最多可以换三次。
const MAX_REDRAWS=3;
const esc=(v:string)=>v.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
function toast(message:string){const el=document.querySelector<HTMLElement>('#toast')!;el.textContent=message;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),4000)}
function save(){const ok=write(data,storage);if(!ok){error='浏览器无法保存数据。记录暂存于本页，请先导出备份。';toast(error)}return ok}
// 单页版（artifact/）用 body[data-legacy-route] 代替地址栏路径；正常站点不设置它。
function route(){const path=(document.body.dataset.legacyRoute??location.pathname).replace(/\/$/,'');return path==='/history'?'history':path==='/settings'?'settings':'today'}
// 页内切换视图（打开某天的回望、返回、重新抽牌）用浏览器的视图过渡做交叉淡化；不支持或要求减少动态时直接切换。
// 窗口在后台时浏览器可能迟迟不执行过渡回调，400ms 后直接切换，保证不会卡住。
function swap(fn:()=>void){const d=document as Document&{startViewTransition?:(cb:()=>void)=>unknown};let done=false;const run=()=>{if(!done){done=true;fn()}};if(d.startViewTransition&&!matchMedia('(prefers-reduced-motion: reduce)').matches){d.startViewTransition(run);setTimeout(run,400)}else run()}
function go(path:string){if(document.body.dataset.legacyRoute!==undefined){window.dispatchEvent(new CustomEvent('daybreak-go',{detail:path}));return}history.pushState({},'',path);selected='';render();scrollTo(0,0)}
const dateLabel=(d:string)=>new Date(d+'T12:00:00').toLocaleDateString('zh-CN',{month:'long',day:'numeric',weekday:'long'});
function header(){return ''}
function footer(){return ''}
function welcome(){const h=new Date().getHours();return h<6?'夜深了':h<11?'早安':h<14?'午安':h<18?'下午好':'晚上好'}
// 外观以共享导航保存的值为准，默认深色，与 site-chrome 一致，避免两边轮流改主题造成闪烁。
function syncTheme(){try{data.preferences.themeMode=JSON.parse(localStorage.getItem('daybreak:gravity:v1')||'{}').theme||'dark'}catch{}document.documentElement.dataset.theme=isDark(data.preferences.themeMode)?'dark':'light'}
// 看解析时牌四周的微光；每次重绘前先停掉旧的。
let ambient:ParticleHandle|null=null;
// 换一张的过渡状态机：idle → exiting（旧牌面和解读淡出 180ms，然后整块从 DOM 移除）→ drawing（抽新牌、存盘）→ entering（新内容淡入）→ idle。
// 以前用视图过渡做交叉淡化，新旧两套解读会有 160ms 同时半透明叠在一起。
let redrawPhase:'idle'|'exiting'|'drawing'|'entering'='idle',tickFrom:number|null=null;
// 抽牌到揭晓的动画阶段（见 src/draw-motion.ts）：idle → locking → centering → flipping → revealed → idle。不在 idle 时不接受新的抽牌或换一张。
let drawPhase:DrawPhase='idle';
// 北斗仪式（src/dipper-ritual.ts）：dipperReplay 为真时，“换一张”会先回到点亮的星空，让斗柄再转一次
let dipperCtl:DipperRitual|null=null,dipperReplay=false;
// 牌扇方式的“换一张”：回到洗牌、切牌、选牌，和第一次一样；选定之后才用掉一次机会，中途离开原来的牌不变
let fanReplay:{old:Day;used:number}|null=null;
// 站点的承诺：放在抽牌页标题下面（换一张时不显示）。不用“最”字这类绝对化说法
const PROMISE=`<p class="brand-promise"><span>专注一件事：</span><span>把每一张塔罗牌，解读得专业、清楚、用得上。</span></p>`;
const ritualMode=()=>data.preferences.ritual??'fan';
/** 观测地：设置里填过就用它，否则按时区估计 */
function observer(){const o=data.preferences.observer,d=defaultObserver();return o?{lat:o.lat,lon:o.lon??d.lon,estimated:false}:{...d,estimated:true}}
/** 抽牌那一刻的真实天空，存进当天的记录（只用于展示和分享图，不影响抽牌） */
const dipperFacts=(sky:DipperSky,ob:{lat:number;lon:number})=>({handleAz:Math.round(sky.handle*10)/10,alkaidAlt:Math.round(sky.stars[6].alt*10)/10,lat:Math.round(ob.lat*10)/10,lon:Math.round(ob.lon*10)/10,at:sky.at});
const ritualSwitch=()=>`<div class="ritual-switch" role="group" aria-label="抽牌方式"><button type="button" data-ritual="fan" aria-pressed="${ritualMode()==='fan'}">牌扇</button><button type="button" data-ritual="dipper" aria-pressed="${ritualMode()==='dipper'}">北斗</button></div>`;
const moodRow=()=>`<div class="mood-row" role="group" aria-label="此刻的心情（可不选）">${moods.map(m=>`<button class="mood-chip${m===mood?' on':''}" data-mood="${m}">${m}</button>`).join('')}</div>`;
// 北斗方式：第一眼就是星空，心情放到星空下面
function dipperHome(replay=false){return `<section class="minimal-ritual dipper-mode"><p class="ritual-date">${today}</p><h1>今日塔罗</h1>${replay?'':PROMISE+ritualSwitch()}<div class="dipper-ritual"${replay?' data-lit="1"':''}></div>${replay?'':`<p class="ritual-hint dipper-mood-hint">点亮之前，想一想今天最在意的一件事。此刻的心情（可不选）</p>${moodRow()}`}</section>`}
const wait=(ms:number)=>new Promise<void>(r=>setTimeout(r,ms));
const motionOff=reducedMotion;
/** 剩余次数的数字翻动：换一张后从旧数字翻到新数字。 */
function ticker(n:number){return tickFrom===null||tickFrom===n?`${n}`:`<span class="ticker" aria-hidden="true"><span class="tick-col"><span>${tickFrom}</span><span>${n}</span></span></span><span class="sr-only">${n}</span>`}
function render(){syncTheme();ambient?.stop();root.innerHTML=header()+`${error?`<aside role="alert" class="error">${esc(error)}</aside>`:''}<main>${route()==='settings'?settings():route()==='history'?journal():home()}</main>`+footer();bind();guardCardImages(root);ambient=particles(root.querySelector('.minimal-result .tarot'),'ambient');}
function home(){const day=data.days[today];if(dipperReplay)return dipperHome(true);if(fanReplay)return fanHome(true);if(!day&&ritualMode()==='dipper')return dipperHome();return day?reading(day):fanHome()}
/** 牌扇方式；replay 为真时是“换一张”：不再选心情、不显示切换，多一个“保留原来那张” */
function fanHome(replay=false){return `<section class="minimal-ritual${replay?' fan-replay':''}"><p class="ritual-eyebrow" aria-hidden="true"><span>MORNING RITUAL</span><i></i><span>${today}</span></p><p class="ritual-date">${today}</p><h1>${replay?'换一张':'今日塔罗'}</h1>${replay?'':PROMISE}<p class="ritual-hint">${replay?'重新洗一次牌，再从牌扇里选一张':'先深呼吸，想一想今天最在意的一件事'}</p>${replay?'':`<div class="mood-row" role="group" aria-label="此刻的心情（可不选）">${moods.map(m=>`<button class="mood-chip${m===mood?' on':''}" data-mood="${m}">${m}</button>`).join('')}</div>${ritualSwitch()}`}<div class="card-scene ritual-scene" data-stage="shuffle"><div class="ritual-aura" aria-hidden="true"><span class="ritual-glow"></span><svg class="ritual-orbit" viewBox="-100 -100 200 200"><circle r="96" stroke-dasharray="0.6 7"/><circle r="78" stroke-dasharray="14 4 0.6 4"/><circle r="60" stroke-dasharray="0.6 11"/><circle r="2" cx="0" cy="-96" class="orbit-star"/><circle r="1.4" cx="0" cy="78" class="orbit-star"/></svg></div><div class="deck-pile" role="button" tabindex="0" aria-label="按住洗牌"><svg class="shuffle-ring" viewBox="0 0 100 100" aria-hidden="true"><path class="ring-track" d="M-20 80A70 70 0 0 1 120 80"/><path class="ring-fill" d="M-20 80A70 70 0 0 1 120 80" pathLength="100"/><circle class="ring-sun" r="2.2" cx="-20" cy="80"/></svg>${Array.from({length:5},(_,j)=>`<div class="pile-card" style="--j:${j}">${cardBack()}</div>`).join('')}<span class="cut-flash" aria-hidden="true"></span></div><div class="deck-fan">${Array.from({length:13},(_,i)=>`<button class="fan-card draw-pick" style="--i:${i}" aria-label="选这一张">${cardBack()}</button>`).join('')}</div><div class="tarot face-down chosen-card" aria-hidden="true">${cardBack()}</div></div><p class="pick-hint" aria-live="polite">${STAGE_HINT.shuffle}</p><button class="primary draw"><span class="draw-star" aria-hidden="true">✦</span><span class="draw-main">替我选一张<small aria-hidden="true">DRAW ON MY BEHALF</small></span><span class="draw-arrow" aria-hidden="true"><svg viewBox="0 0 34 10"><path d="M0 5H33M28 1L33 5L28 9"/></svg></span></button>${replay?'<button type="button" class="text-button keep-card">保留原来那张</button>':''}</section>`}
const STAGE_HINT={shuffle:'按住牌堆，等晨光走满这道弧',cut:'轻划或点击牌堆，把牌切开',pick:'指尖划过牌扇，停在哪张就是哪张'};

function roman(n:number):string{if(n===0)return '0';let out='';for(const [value,label] of [[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']] as const){while(n>=value){out+=label;n-=value}}return out}
// 星象对应：这张牌在金色黎明体系里的星座/行星，加上当天太阳、月亮的位置和用户的太阳星座。
function astroBlock(d:Day){const a=cardAstro(d.cardId);if(!a)return '';const at=d.date===today?new Date():new Date(d.date+'T12:00:00');const sun=sunSign(at),moon=moonSign(at),mine=data.preferences.birthDate?birthSign(data.preferences.birthDate):null;
 return `<section class="astro-block"><h2>星象对应</h2><p class="astro-label">${esc(a.label)}${a.title?`<span class="astro-title">Book T：${esc(a.title.en)} · ${esc(a.title.zh)}</span>`:''}</p><p>${esc(a.plain)}</p>${resonance(a,mine,moon).map(l=>`<p class="astro-resonance">${esc(l==='这个月还没有抽过牌。'?'这个月还没有每日牌。':l)}</p>`).join('')}<p class="astro-sky">${d.date===today?'此刻':'这天'}太阳在${sun.zh}，月亮在${moon.zh}${mine?`；你的太阳星座是${mine.zh}`:''}。</p><p class="astro-source">${esc(ASTRO_SOURCE_LEAD)}<a href="${ASTRO_SOURCE_URL}" target="_blank" rel="noreferrer">${esc(ASTRO_SOURCE_LINK)}</a>。</p></section>`}
/** 解读正文：选了心情就先说一句开场白，并按心情决定先看哪一段；以前抽到过这张牌就附上那一次 */
function readingBody(d:Day,c:ReturnType<typeof cardById>){const lead=moodLead(d.mood,c);
 const parts={intro:`<h2>这张牌在说什么</h2><p class="plain-intro">${esc(c.plainIntro)}</p>`,reading:`<h2>今日解析</h2><p>${esc(d.reversed?c.meaningReversed:c.meaningUpright)}</p>`,action:`<h2>今天可做</h2><p>${esc(c.action)}</p>`};
 const order=lead?.order??(['intro','reading','action'] as const);
 return `${lead?`<p class="mood-lead"><span class="mood-tag">此刻 · ${esc(lead.mood)}</span>${esc(lead.text)}</p>`:''}${order.map(k=>parts[k]).join('')}${pastBlock(d)}`}
function pastBlock(d:Day){const past=pastDraws(data.days,d.cardId,d.date);if(!past.length)return '';const last=past[0],note=last.review?.note?.trim();
 return `<aside class="card-past"><h2>这张牌你以前抽到过</h2><p>${past.length>1?`算上这次，一共抽到 ${past.length+1} 次。`:''}上一次是 ${shortDate(last.date,today)}，${last.reversed?'逆位':'正位'}${last.reversed===d.reversed?'，和今天一样':`，今天是${d.reversed?'逆位':'正位'}`}。</p>${note?`<blockquote>那天晚上你写下：${esc(noteExcerpt(note))}</blockquote>`:'<p class="past-empty">那天没有写回望。今晚可以写一句，下次再抽到它就能看到。</p>'}<button type="button" class="text-button past-day" data-past="${last.date}">看那一天</button></aside>`}
/** 抽牌后“问一个问题”：只在今天这张牌上出现；已问过的问答存在本机，刷新还在 */
/** 导出全部记录，并记下这次备份的时间（备份提醒据此隔 30 天再提） */
function exportBackup(){download(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),`daybreak-backup-${today}.json`);writeBackupState(storage,{at:new Date().toISOString()});toast('已导出。把这个文件存到网盘或发给自己，换手机时在「设置」里导入就能找回。')}
/** 记录攒到 7 天、又 30 天没备份时，轻轻提醒一次 */
function backupNudge(){const n=Object.keys(data.days).length;if(!shouldRemindBackup(n,readBackupState(storage),new Date()))return '';
 return `<aside class="backup-nudge" aria-label="备份提醒"><p>你已经记录了 ${n} 天。这些记录只存在这台设备的浏览器里，清缓存或换手机就会没了。</p><div class="backup-actions"><button type="button" class="backup-now">导出一份备份</button><button type="button" class="text-button backup-later">以后再说</button></div></aside>`}
/** 回答按空行分段，每段一个 <p> */
const askParas=(text:string,care:boolean)=>text.split(/\n{2,}/).map(t=>`<p class="ask-a${care?' is-care':''}">${esc(t).replace(/\n/g,'<br>')}</p>`).join('');
function askBlock(d:Day){if(!AI_ENABLED||d.date!==today)return '';const asks=d.asks||[],left=ASKS_PER_DAY-asks.filter(x=>!x.crisis).length;
 return `<section class="ask-card" aria-labelledby="ask-title"><h2 id="ask-title">想问一个问题？</h2><p class="ask-hint">写一句你想问的事，让这张牌从它的意思出发，给你一个看问题的角度。它不预测结果，也替代不了医生、律师等专业的人。</p>${asks.map(x=>`<div class="ask-item"><p class="ask-q">你问：${esc(x.q)}</p>${askParas(x.a,!!x.crisis)}</div>`).join('')}${left>0?`<form class="ask-form" autocomplete="off"><input name="q" maxlength="${ASK_MAX}" placeholder="${asks.length?'还想接着问什么？':'比如：这周要不要跟他把话说开？'}" aria-label="你想问的问题"><button type="submit" class="ask-send">请这张牌回答</button></form><p class="ask-status" role="status" aria-live="polite"></p><p class="ask-privacy">点击后，你写的问题、这张牌和心情会发给 AI 服务（DeepSeek）生成回答；不要写真实名字、电话等隐私。回答只保存在你自己的浏览器里。今天还能问 ${left} 次。</p>`:'<p class="ask-status">今天的 3 次提问用完了，明天再来。</p>'}</section>`}
function reading(d:Day){const c=cardById(d.cardId);return `<section class="minimal-result"><p class="ritual-date">${d.date}</p><div class="tarot revealed ${d.reversed?'is-reversed':''}">${cardImage(c)}</div><h1>${roman(c.number)} · ${c.nameZh}</h1><p class="orientation">${d.reversed?'逆位':'正位'}</p>${d.dipper?`<p class="dipper-note">今日北斗：斗柄指向 ${bearingLabel(d.dipper.handleAz)}，摇光高度 ${Math.round(d.dipper.alkaidAlt)}°${d.dipper.alkaidAlt<0?'（在地平线下）':''}</p>`:''}<section class="daily-reading">${readingBody(d,c)}${astroBlock(d)}<p class="card-more"><a href="/card/${c.id}/">${esc(c.nameZh)}的完整解读：正位、逆位、牌面符号 →</a></p></section>${askBlock(d)}${d.date===today?backupNudge():''}<div class="review-block"><label class="evening-question" for="note">晚间回望：${esc(c.reflectionPrompt)}</label><form id="review" data-date="${d.date}" class="single-review"><input id="note" name="note" maxlength="5000" value="${esc(d.review?.note||'')}" placeholder="写一句今晚的真实感受"><button type="submit" class="review-save${d.review?.note?' is-saved':' is-empty'}">${d.review?.note?'<span class="done-mark" aria-hidden="true">✓</span>已珍藏':'保存'}</button></form></div><div class="result-tools"><button class="export-image" data-date="${d.date}">保存牌面</button><span class="tool-field"><span class="tool-label" aria-hidden="true">配色</span><select class="share-layout" aria-label="分享卡片配色"><option value="classic">石膏白</option><option value="night">玄武岩黑</option><option value="space">留白</option></select></span><button class="export-story" data-date="${d.date}">竖屏图片</button>${d.dipper?`<button class="export-dipper" data-date="${d.date}">北斗竖图</button>`:''}${d.date===today&&(d.redraws||0)<MAX_REDRAWS?`<button class="redraw">对牌不满意？换一张（今天还剩 ${ticker(MAX_REDRAWS-(d.redraws||0))} 次）</button>`:''}</div></section>`}

function monthView(spreadDates:string[]){const m=monthSummary(data.days,journalMonth),current=today.slice(0,7),earliest=[...Object.keys(data.days),...spreadDates].sort()[0]?.slice(0,7)??current;return `<section class="month-view"><div class="month-nav"><button class="month-step" data-month="-1" aria-label="上个月" ${journalMonth<=earliest?'disabled':''}>‹</button><h2>${m.label}</h2><button class="month-step" data-month="1" aria-label="下个月" ${journalMonth>=current?'disabled':''}>›</button></div><div class="month-grid">${['一','二','三','四','五','六','日'].map(w=>`<div class="wk" aria-hidden="true">${w}</div>`).join('')}${m.cells.map(c=>!c?'<div class="day blank"></div>':c.entry?`<button class="day has-card${c.entry.review?.note?.trim()?' reviewed':''}${c.date===today?' today':''}" data-day="${c.date}" aria-label="${c.date}，${cardById(c.entry.cardId).nameZh}${c.entry.reversed?'逆位':'正位'}${c.entry.review?.note?.trim()?'，有回顾':''}"><span class="day-art${c.entry.reversed?' is-reversed':''}">${cardImage(cardById(c.entry.cardId),true)}</span><span class="day-num">${c.day}</span></button>`:spreadDates.includes(c.date)?`<a class="day has-card" href="#record-${c.date}" aria-label="${c.date}，问题牌阵"><span class="day-num">${c.day} ✦</span></a>`:`<div class="day${c.date===today?' today':''}"><span class="day-num">${c.day}</span></div>`).join('')}</div><div class="month-summary"><h3>这个月</h3>${spreadDates.some(d=>d.startsWith(journalMonth))?`<p>本月问题牌阵：${spreadDates.filter(d=>d.startsWith(journalMonth)).length} 次。</p>`:''}${m.lines.map(l=>`<p>${esc(l==='这个月还没有抽过牌。'?'这个月还没有每日牌。':l)}</p>`).join('')}${m.notes.length?`<h3>你写下的话</h3>${m.notes.map(n=>`<blockquote><small>${n.date.slice(5).replace('-','/')}</small>${esc(n.text)}</blockquote>`).join('')}`:''}</div></section>`}
function journal(){
 if(selected&&data.days[selected])return `<button class="text back">← 所有回望</button>${reading(data.days[selected])}`;
 let spreads:Saved[]=[];
 try{spreads=readConsultations(storage)}catch{/* 浏览器存储不可用时仍可浏览每日牌。 */}
 const days=Object.values(data.days);
 const spreadDates=spreads.map(r=>localDate(new Date(r.at)));
 const heading='<div class="page-heading"><h1>回望</h1></div>';
 if(!days.length&&!spreads.length)return heading+'<div class="empty"><div class="empty-symbol">◒</div><h2>第一张，留给今天。</h2><p>抽过的每日牌和问题牌阵都会出现在这里。</p><button class="primary to-today">去开启今日</button></div>';
 const entries=days.map(d=>({date:d.date,time:0,html:`<button class="history-item" data-day="${d.date}"><div class="history-art">${cardImage(cardById(d.cardId),true)}</div><div><small>每日牌 · ${d.date}</small><h2>${cardById(d.cardId).nameZh}<span>${d.reversed?'逆位':'正位'}</span></h2>${d.review?.note?`<p class="history-note">${esc(d.review.note)}</p>`:''}<span class="review-status">${d.review?.note?'● 已留下回顾':'○ 还没写回顾'}</span></div><span></span></button>`}));
 spreads.forEach((r,i)=>{
  const date=spreadDates[i],name=findSpread(r.spreadId).name_zh;
  entries.push({date,time:Date.parse(r.at),html:`<a class="history-item" href="/consult/#record=${encodeURIComponent(r.id)}"><div class="history-art">${cardImage(cardById(r.cards[0].id),true)}</div><div><small>问题牌阵 · ${date}</small><h2>${esc(name)}</h2>${r.question?`<p class="history-note">${esc(r.question)}</p>`:''}</div><span aria-hidden="true">→</span></a>`});
 });
 const month=entries.filter(e=>e.date.startsWith(journalMonth)).sort((a,b)=>b.date.localeCompare(a.date)||b.time-a.time);
 const list=month.map((e,i)=>`<div${month[i-1]?.date!==e.date?` id="record-${e.date}"`:''}>${e.html}</div>`).join('');
 return heading+monthView(spreadDates)+(list?`<h3 class="month-list-title">本月记录</h3><div class="history-grid">${list}</div>`:'');
}
// 生辰存两处：偏好（备份/导入用）和日历页读取的 daybreak:gravity:v1。
function gravityStore(){try{return JSON.parse(localStorage.getItem('daybreak:gravity:v1')||'{}')}catch{return {}}}
function saveGravityBirth(date:string,time:string){try{const p=gravityStore();if(date){p.birth=date;p.birthTime=time}else{delete p.birth;delete p.birthTime}localStorage.setItem('daybreak:gravity:v1',JSON.stringify(p))}catch{}}
function birthForm(){const g=gravityStore(),date=g.birth||data.preferences.birthDate||'',time=g.birthTime||data.preferences.birthTime||'';return `<form id="birth-form" class="birth-form"><label for="birth-date">出生日期</label><input id="birth-date" type="date" min="1900-01-01" max="${localDate()}" value="${esc(date)}" required><label for="birth-time">出生时间（北京时间，不知道可以不填）</label><input id="birth-time" type="time" value="${esc(time)}"><p class="birth-note">改完自动保存，日历页会按你的八字显示今日运势。只存在这台设备的浏览器里，填过就不用再填。</p><button type="submit">保存生辰</button>${date?'<button type="button" class="birth-clear">清除生辰</button>':''}</form>`}
/** 设置页的北斗一栏：抽牌方式、观测纬度、定位、分享图是否写纬度。位置只存在本机。 */
function dipperSettings(){const p=data.preferences,o=p.observer,d=defaultObserver();return `<fieldset class="dipper-settings"><legend>北斗仪式</legend>
<label class="field">抽牌方式<select id="ritual-mode"><option value="fan" ${ritualMode()==='fan'?'selected':''}>牌扇：洗牌、切牌、选一张</option><option value="dipper" ${ritualMode()==='dipper'?'selected':''}>北斗：依次点亮七星</option></select></label>
<label class="field">观测纬度（北纬为正）<input id="observer-lat" type="number" inputmode="decimal" min="-90" max="90" step="0.1" value="${o?String(o.lat):''}" placeholder="${d.lat}（按时区估计）"></label>
<button type="button" class="setting-row locate">用一次手机定位</button>
<label class="check-row"><input type="checkbox" id="share-lat" ${p.shareLatitude?'checked':''}>北斗分享图上写“北纬约 xx°”</label>
<p class="setting-note">位置只存在这台设备的浏览器里，不会上传。分享图默认不写位置；勾选上面这项也只写到整数度。</p></fieldset>`}
function settings(){draft={...data.preferences,themes:[...data.preferences.themes]};return `<div class="page-heading"><h1>设置</h1></div><section class="minimal-settings"><form id="preferences"><label for="nickname">称呼</label><input id="nickname" value="${esc(data.preferences.nickname)}" maxlength="40"><button type="submit">保存</button></form>${birthForm()}<label class="field theme-setting">外观<select id="theme-mode"><option value="auto" ${data.preferences.themeMode==='auto'?'selected':''}>自动</option><option value="dark" ${data.preferences.themeMode==='dark'?'selected':''}>深色</option><option value="light" ${data.preferences.themeMode==='light'?'selected':''}>浅色</option></select></label>${dipperSettings()}<fieldset class="reminder-settings" id="reminder"><legend>每天早上提醒</legend><label class="field">提醒时间<input id="reminder-time" type="time" value="07:30"></label><button type="button" class="setting-row add-reminder">加到手机日历</button><p class="setting-note">会下载一个日历文件，打开后选「添加」，以后每天这个时间，手机日历会提醒你来抽一张牌。不想要了，在日历里删掉这个日程就行。网站不会知道你加没加。</p></fieldset><div class="setting-row install-setting"><div><strong>添加到手机桌面</strong><p class="install-how">iPhone：在 Safari 里点底部「分享」，再选「添加到主屏幕」。安卓：在浏览器菜单里选「安装」或「添加到主屏幕」。</p></div><button type="button" class="install-now">添加</button></div><button class="setting-row export-data">导出记录</button><label class="setting-row file-label">导入记录<input id="import-data" type="file" accept="application/json,.json"></label><button class="setting-row clear">清除历史记录</button><button class="setting-row reset">重置偏好</button><details class="source-archive"><summary>资料来源</summary><a href="https://github.com/6tail/lunar-javascript">lunar-javascript</a><a href="https://github.com/cosinekitty/astronomy">Astronomy Engine</a><a href="https://github.com/mrdoob/three.js">three.js 月面贴图（MIT）</a><a href="https://commons.wikimedia.org/wiki/Category:Rider-Waite-Smith_tarot_deck_(TaionWC)">1909 年韦特塔罗牌面扫描（公有领域，维基共享资源）</a><a href="/encyclopedia/">塔罗原典与牌义</a></details></section>`}

/** 北斗仪式的绑定：切换方式、挂载星空；七星点亮后由 dipperDraw 接手 */
function bindDipper(){dipperCtl?.destroy();dipperCtl=null;
 root.querySelectorAll<HTMLButtonElement>('.ritual-switch button').forEach(b=>b.onclick=()=>{if(revealing||drawPhase!=='idle')return;const m=b.dataset.ritual as 'fan'|'dipper';if(m===ritualMode())return;triggerHaptic('selection');data.preferences.ritual=m;save();swap(render)});
 const host=root.querySelector<HTMLElement>('.dipper-ritual');if(!host)return;const ob=observer();
 if(host.dataset.lit==='1'){dipperCtl=mountDipper(host,{...ob,lit:true});return}
 // 第一颗星点亮时洗牌，之后每颗星切一次（随机切点）；七星连成后由随机数选出斗柄要指的那张
 let deck:ReturnType<typeof startDeck<(typeof cards)[number]>>|null=null;
 dipperCtl=mountDipper(host,{...ob,onLight:()=>{deck=cutForStar(deck??startDeck(cards))},onComplete:()=>{if(deck)void dipperDraw(deck)}})}
async function dipperDraw(deck:ReturnType<typeof startDeck<(typeof cards)[number]>>){if(revealing||drawPhase!=='idle'||!dipperCtl)return;revealing=true;const ctl=dipperCtl,ob=observer();
 root.querySelectorAll<HTMLButtonElement>('.mood-chip,.ritual-switch button').forEach(el=>{el.disabled=true});
 const index=pickSlot(SLOTS),chosen=deck[index];
 drawPhase='locking';const pick=await ctl.turnAndPick(index);const from=await lockStage(root.querySelector<HTMLElement>('.minimal-ritual')!,pick);
 today=localDate();const d=ensureDay(data.days,today,data.preferences,mood,intent,chosen);d.ritual='dipper';d.dipper=dipperFacts(ctl.sky,ob);data.days[today]=d;save();ctl.destroy();dipperCtl=null;
 render();scrollTo({top:0,behavior:'instant'});const result=root.querySelector<HTMLElement>('.minimal-result');
 if(result){holdResult(result);await revealCard(result,{backHtml:cardBack(),frontHtml:cardImage(cardById(d.cardId)),reversed:d.reversed,from,onPhase:p=>{drawPhase=p}})}
 drawPhase='idle';revealing=false}
let asking=false;
/** 「问一个问题」的绑定：提交 → 等回答（可能要等免费服务器醒来）→ 存本机 → 只换这一块，不整页重画 */
function bindAsk(){if(AI_ENABLED&&root.querySelector('.ask-card'))warmUp();
 const form=root.querySelector<HTMLFormElement>('.ask-form');if(!form)return;
 const input=form.querySelector<HTMLInputElement>('input[name=q]')!,btn=form.querySelector<HTMLButtonElement>('.ask-send')!,status=root.querySelector<HTMLElement>('.ask-status')!;
 form.onsubmit=async e=>{e.preventDefault();if(asking)return;const day=data.days[today];if(!day)return;
  const q=input.value.trim(),bad=checkQuestion(q);if(bad){status.textContent=bad;return}
  asking=true;btn.disabled=true;input.readOnly=true;triggerHaptic('light');status.textContent='正在请这张牌回答…（第一次可能要等半分钟）';
  const slow=setTimeout(()=>{status.textContent='还在连接，服务刚醒，再等一会儿…'},8000);
  const r=await askCard({cardId:day.cardId,reversed:day.reversed,mood:day.mood||'',question:q});
  clearTimeout(slow);asking=false;
  if(!r.ok){btn.disabled=false;input.readOnly=false;status.textContent=r.message;return}
  day.asks=[...(day.asks||[]),{q,a:r.answer,at:new Date().toISOString(),...(r.crisis?{crisis:true}:{})}].slice(-10);
  if(!save())toast(error);triggerHaptic('success');
  root.querySelector('.ask-card')!.outerHTML=askBlock(day);bindAsk();
  const items=root.querySelectorAll<HTMLElement>('.ask-item');
  if(!motionOff())items[items.length-1]?.animate([{opacity:0,transform:'translateY(8px)',filter:'blur(2px)'},{opacity:1,transform:'none',filter:'blur(0)'}],{duration:420,easing:'cubic-bezier(.22,1,.36,1)'})}}
function bind(){bindDipper();bindAsk();const tm=root.querySelector<HTMLSelectElement>('#theme-mode');if(tm)tm.onchange=()=>{data.preferences.themeMode=tm.value as 'auto'|'dark'|'light';save();window.dispatchEvent(new CustomEvent('daybreak-theme',{detail:tm.value}));render()};root.querySelectorAll<HTMLAnchorElement>('a[href="/ritual/"],a[href="/history"],a[href="/settings"]').forEach(a=>a.onclick=e=>{e.preventDefault();go(a.pathname)});
// 抽牌仪式：选中的牌升到中间，细碎的金属光尘随呼吸绕着它收拢，再揭开；揭开后光尘从牌边慢慢散去。
// 先洗好完整的 78 张牌；牌扇展示顶端 13 张，选中的位置对应真实牌位。
let ritualDeck:ReturnType<typeof shuffleDeck<(typeof cards)[number]>>|undefined;
const beginDraw=async(picked?:HTMLElement)=>{if(revealing||drawPhase!=='idle')return;revealing=true;triggerHaptic('medium');
 const fan=[...root.querySelectorAll<HTMLElement>('.fan-card')];let chosen:NonNullable<typeof ritualDeck>[number];let index=-1;try{ritualDeck??=shuffleDeck(cards);index=picked?fan.indexOf(picked):randomInteger(fan.length);chosen=ritualDeck[index];if(!chosen)throw Error('Invalid card position');fan[index]?.classList.add('picked')}catch{revealing=false;toast('随机洗牌暂时不可用，请刷新页面再试。');return}
 root.querySelectorAll<HTMLButtonElement>('.draw,.draw-pick,.mood-chip,.keep-card').forEach(el=>{el.disabled=true});
 // 牌扇展开时，浮起的是牌扇里被抽中的那张；还在洗牌或切牌时（点了「替我选一张」），浮起的是牌堆最上面那张
 const ritual=root.querySelector<HTMLElement>('.minimal-ritual')!,stage=root.querySelector<HTMLElement>('.ritual-scene')?.dataset.stage;
 const source=(stage==='pick'?fan[index]:null)??root.querySelector<HTMLElement>('.pile-card:last-of-type')??fan[index];
 drawPhase='locking';const from=await lockStage(ritual,source);
 // 换一张：同一天才算换牌（保留心情和晚间回望，次数加一）；跨过零点就是新一天的第一次抽牌
 const replay=fanReplay;fanReplay=null;today=localDate();let d:Day;
 if(replay&&replay.old.date===today){d=dayFromCard(today,data.preferences,replay.old.mood||'',replay.old.intent||'',chosen);d.redraws=replay.used;if(replay.old.review)d.review=replay.old.review;tickFrom=MAX_REDRAWS-(replay.old.redraws||0);redrawPhase='entering'}
 else{d=ensureDay(data.days,today,data.preferences,mood,intent,chosen);redrawPhase='idle'}
 data.days[today]=d;save();render();scrollTo({top:0,behavior:'instant'});
 const result=root.querySelector<HTMLElement>('.minimal-result');
 if(result){holdResult(result);await revealCard(result,{backHtml:cardBack(),frontHtml:cardImage(cardById(d.cardId)),reversed:d.reversed,from,onPhase:p=>{drawPhase=p}})}
 drawPhase='idle';revealing=false;
 if(redrawPhase==='entering'){const used=d.redraws||0;toast(used<MAX_REDRAWS?`换好了。今天还可以再换 ${MAX_REDRAWS-used} 次。`:'换好了。今天就是这张了。');tickFrom=null;redrawPhase='idle'}};
const keep=root.querySelector<HTMLButtonElement>('.keep-card');if(keep)keep.onclick=()=>{if(revealing||drawPhase!=='idle')return;triggerHaptic('light');fanReplay=null;redrawPhase='idle';swap(()=>{render();scrollTo({top:0,behavior:'instant'})})};
root.querySelectorAll<HTMLButtonElement>('.draw-pick').forEach(b=>b.onclick=()=>beginDraw(b));
// 线下的顺序：按住牌堆洗牌（金环走满一圈）→ 划一下切牌 → 在牌扇上滑，松手取一张。「替我选一张」随时可以跳过。
const scene=root.querySelector<HTMLElement>('.ritual-scene'),pile=root.querySelector<HTMLElement>('.deck-pile'),hint=root.querySelector<HTMLElement>('.pick-hint');
if(scene&&pile){const ring=pile.querySelector<SVGPathElement>('.ring-fill'),sun=pile.querySelector<SVGCircleElement>('.ring-sun'),setStage=(s:keyof typeof STAGE_HINT)=>{scene.dataset.stage=s;if(hint)hint.textContent=STAGE_HINT[s];pile.setAttribute('aria-label',s==='cut'?'切牌':'按住洗牌')};
 let progress=0,holding=false,last=0,downX=0,downId=-1,downStage='',moveX=0,readyX=0;
 const paint=(p:number)=>{ring?.style.setProperty('stroke-dashoffset',String(100-p*100));const a=Math.PI*(1-p);sun?.setAttribute('cx',(50+70*Math.cos(a)).toFixed(2));sun?.setAttribute('cy',(80-70*Math.sin(a)).toFixed(2))};
 // 中途松手：弧线用 iOS 式的快出慢收曲线退回 0，下次重新开始
 let retreat=0;const fallBack=()=>{const from=progress,start=performance.now(),dur=motionOff()?0:380;cancelAnimationFrame(retreat);const step=(now:number)=>{if(holding)return;const t=dur?Math.min(1,(now-start)/dur):1,e=1-Math.pow(1-t,3);progress=from*(1-e);paint(progress);if(t<1)retreat=requestAnimationFrame(step)};retreat=requestAnimationFrame(step)};
 const tick=(now:number)=>{if(!holding||scene.dataset.stage!=='shuffle')return;progress=Math.min(1,progress+(now-last)/1700);last=now;paint(progress);
  if(progress>=1){holding=false;pile.classList.remove('shuffling');try{ritualDeck=shuffleDeck(cards)}catch{progress=0;toast('随机洗牌暂时不可用，请刷新页面再试。');return}triggerHaptic('success');pile.classList.add('charged');setTimeout(()=>pile.classList.remove('charged'),900);readyX=moveX;setStage('cut');return}requestAnimationFrame(tick)};
 const hold=(on:boolean)=>{if(scene.dataset.stage!=='shuffle'||holding===on)return;holding=on;pile.classList.toggle('shuffling',on);if(on){cancelAnimationFrame(retreat);triggerHaptic('light');last=performance.now();requestAnimationFrame(tick)}else if(progress<1)fallBack()};
 const cut=(dir:number)=>{if(scene.dataset.stage!=='cut')return;const at=1+randomInteger(ritualDeck!.length-1);ritualDeck=cutDeck(ritualDeck!,dir<0?at:ritualDeck!.length-at);scene.dataset.stage='cutting';pile.style.removeProperty('--dx');pile.classList.add(dir<0?'cut-l':'cut-r');navigator.vibrate?.(8);setTimeout(()=>{pile.classList.remove('cut-l','cut-r');setStage('pick')},700)};
 pile.ondragstart=e=>e.preventDefault();
 pile.onpointerdown=e=>{e.preventDefault();try{pile.setPointerCapture(e.pointerId)}catch{}downId=e.pointerId;downX=moveX=e.clientX;downStage=scene.dataset.stage||'';hold(true)};
 pile.onpointermove=e=>{if(e.pointerId!==downId)return;moveX=e.clientX;if(scene.dataset.stage!=='cut')return;const from=downStage==='cut'?downX:readyX;pile.style.setProperty('--dx',`${Math.max(-60,Math.min(60,e.clientX-from))}px`)};
 pile.onpointerup=pile.onpointercancel=e=>{if(e.pointerId!==downId)return;downId=-1;const x=e.type==='pointerup'?e.clientX:moveX,sameHold=downStage==='shuffle',dx=x-(sameHold?readyX:downX);hold(false);
 // 切牌：新按下的一次，轻点或划动都算；洗好时手指还没松开，接着划超过 24px 也算，只松手不算。被浏览器取消的手势按划动距离判断
 if(scene.dataset.stage==='cut'&&(sameHold||e.type==='pointercancel'?Math.abs(dx)>24:downStage==='cut'))cut(Math.abs(dx)>24?dx:1);else pile.style.removeProperty('--dx')};
 // 键盘：按住空格或回车洗牌，洗好后再按一次切牌
 pile.onkeydown=e=>{if(e.key!==' '&&e.key!=='Enter')return;e.preventDefault();if(scene.dataset.stage==='cut')cut(1);else hold(true)};
 pile.onkeyup=e=>{if(e.key===' '||e.key==='Enter')hold(false)};
 // 选牌：手指（或鼠标）在牌扇上滑，离得最近的那张升起来；松手就取它
 const fanCards=[...scene.querySelectorAll<HTMLElement>('.fan-card')];let lifted:HTMLElement|null=null,sliding=false;
 const liftAt=(x:number)=>{let best:HTMLElement|null=null,bd=Infinity;for(const c of fanCards){const r=c.getBoundingClientRect(),d=Math.abs(r.left+r.width/2-x);if(d<bd){bd=d;best=c}}if(best!==lifted){lifted?.classList.remove('lift');best?.classList.add('lift');lifted=best;if(sliding)navigator.vibrate?.(4)}};
 const picking=()=>scene.dataset.stage==='pick'&&!revealing;
 scene.addEventListener('pointerdown',e=>{if(!picking()||!(e.target as Element).closest('.deck-fan'))return;e.preventDefault();sliding=true;try{scene.setPointerCapture(e.pointerId)}catch{}liftAt(e.clientX)});
 // 牌面冷银反光随指针位置偏移，像转动一片金属
 scene.addEventListener('pointermove',e=>{const r=scene.getBoundingClientRect();scene.style.setProperty('--lx',(((e.clientX-r.left)/r.width)*2-1).toFixed(3));if(picking()&&(sliding||e.pointerType==='mouse'&&(e.target as Element).closest('.deck-fan')))liftAt(e.clientX)});
 scene.addEventListener('pointerup',()=>{if(!sliding)return;sliding=false;if(picking()&&lifted)beginDraw(lifted)});
 scene.addEventListener('pointercancel',()=>{sliding=false;lifted?.classList.remove('lift');lifted=null});
 scene.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'&&!sliding){lifted?.classList.remove('lift');lifted=null}})}
root.querySelectorAll<HTMLButtonElement>('.draw').forEach(b=>b.onclick=()=>beginDraw());
root.querySelectorAll<HTMLButtonElement>('.mood-chip').forEach(b=>b.onclick=()=>{triggerHaptic('selection');mood=mood===b.dataset.mood?'':b.dataset.mood!;root.querySelectorAll<HTMLElement>('.mood-chip').forEach(x=>x.classList.toggle('on',x.dataset.mood===mood))});
root.querySelectorAll<HTMLButtonElement>('.export-image,.export-story').forEach(b=>b.onclick=async()=>{try{await busyButton(b,()=>{const layout=root.querySelector<HTMLSelectElement>('.share-layout')?.value as ShareLayout||'classic';return shareCard(data.days[b.dataset.date!],b.classList.contains('export-story'),layout)},'已保存')}catch(e){toast(e instanceof Error?e.message:'图片导出失败，请重试')}});
root.querySelectorAll<HTMLButtonElement>('.export-dipper').forEach(b=>b.onclick=async()=>{try{await busyButton(b,()=>dipperShareCard(data.days[b.dataset.date!],!!data.preferences.shareLatitude),'已保存')}catch(e){toast(e instanceof Error?e.message:'图片导出失败，请重试')}});
const rm=root.querySelector<HTMLSelectElement>('#ritual-mode');if(rm)rm.onchange=()=>{data.preferences.ritual=rm.value as 'fan'|'dipper';toast(save()?'抽牌方式已保存。':error)};
const olat=root.querySelector<HTMLInputElement>('#observer-lat');if(olat)olat.onchange=()=>{const v=olat.value.trim();if(!v){delete data.preferences.observer;toast(save()?'已改回按时区估计。':error);return}const n=Number(v);if(!(n>=-90&&n<=90)){toast('纬度要在 −90 到 90 之间。');return}data.preferences.observer={lat:Math.round(n*10)/10};toast(save()?'观测纬度已保存，只存在这台设备上。':error)};
const loc=root.querySelector<HTMLButtonElement>('.locate');if(loc)loc.onclick=()=>{if(!navigator.geolocation){toast('这个浏览器不支持定位，可以手动填纬度。');return}loc.disabled=true;
 // 只取一次、精度到 0.1°（约 10 公里），只存在本机
 navigator.geolocation.getCurrentPosition(p=>{data.preferences.observer={lat:Math.round(p.coords.latitude*10)/10,lon:Math.round(p.coords.longitude*10)/10};const ok=save();render();toast(ok?'已记下大概位置，只存在这台设备上。':error)},()=>{loc.disabled=false;toast('没有拿到位置，可以手动填纬度。')},{enableHighAccuracy:false,timeout:10000,maximumAge:3600000})};
const sl=root.querySelector<HTMLInputElement>('#share-lat');if(sl)sl.onchange=()=>{data.preferences.shareLatitude=sl.checked;toast(save()?'已保存。':error)};
const layoutSelect=root.querySelector<HTMLSelectElement>('.share-layout');if(layoutSelect)glassSelect(layoutSelect,{classic:'#F2EFE9',night:'#0A0A0B',space:'#FFFFFF'});
root.querySelectorAll<HTMLButtonElement>('[data-day]').forEach(b=>b.onclick=()=>swap(()=>{selected=b.dataset.day!;render();scrollTo(0,0)}));root.querySelectorAll<HTMLButtonElement>('.past-day').forEach(b=>b.onclick=()=>{const day=b.dataset.past!;if(!data.days[day])return;triggerHaptic('light');journalMonth=day.slice(0,7);if(route()==='history'){swap(()=>{selected=day;render();scrollTo(0,0)});return}go('/history');selected=day;render();scrollTo(0,0)});const back=root.querySelector<HTMLButtonElement>('.back');if(back)back.onclick=()=>swap(()=>{selected='';render()});root.querySelectorAll<HTMLButtonElement>('.month-step').forEach(b=>b.onclick=()=>swap(()=>{journalMonth=shiftMonth(journalMonth,Number(b.dataset.month));render()}));const to=root.querySelector<HTMLButtonElement>('.to-today');if(to)to.onclick=()=>go('/');
const rev=root.querySelector<HTMLFormElement>('#review');if(rev){const note=rev.querySelector<HTMLInputElement>('#note')!,btn=rev.querySelector<HTMLButtonElement>('.review-save')!,saved=()=>(data.days[rev.dataset.date!]?.review?.note||'').trim();
 // 三种样子：没写过也没输入 → 柔和半透明；输入了新内容 → 香槟金高亮“保存”；和已存的一样 → “✓ 已珍藏”
 const state=()=>{const v=note.value.trim(),s=saved();btn.classList.toggle('is-empty',!v&&!s);btn.classList.toggle('is-saved',!!v&&v===s);btn.classList.toggle('is-active',v!==s);btn.innerHTML=!!v&&v===s?'<span class="done-mark" aria-hidden="true">✓</span>已珍藏':'保存'};note.oninput=state;
 rev.onsubmit=e=>{e.preventDefault();if(btn.classList.contains('is-empty')||btn.classList.contains('is-saved'))return;const f=new FormData(rev);data.days[rev.dataset.date!].review={resonance:'有一点共鸣',...data.days[rev.dataset.date!].review,note:String(f.get('note')||'')};const ok=save();if(!ok){toast(error);return}triggerHaptic('success');state();btn.classList.add('just-saved');setTimeout(()=>btn.classList.remove('just-saved'),700)}}
const redraw=root.querySelector<HTMLButtonElement>('.redraw');if(redraw)redraw.onclick=async()=>{if(redrawPhase!=='idle'||drawPhase!=='idle')return;const old=data.days[today];const used=(old?.redraws||0)+1;if(used>MAX_REDRAWS)return;
 redrawPhase='exiting';redraw.disabled=true;triggerHaptic('light');
 const leaving=root.querySelector<HTMLElement>('.minimal-result');if(leaving)await exitResult(leaving);
 if(old?.ritual==='dipper'){redrawPhase='drawing';dipperReplay=true;render();scrollTo({top:0,behavior:'instant'});const ctl=dipperCtl,ob=observer();
  if(ctl){const deck=startDeck(cards),index=pickSlot(SLOTS),chosen=deck[index];const pick=await ctl.turnAndPick(index);const from=await lockStage(root.querySelector<HTMLElement>('.minimal-ritual')!,pick);
   const next=dayFromCard(today,data.preferences,old.mood||'',old.intent||'',chosen);next.redraws=used;if(old.review)next.review=old.review;next.ritual='dipper';next.dipper=dipperFacts(ctl.sky,ob);data.days[today]=next;save();ctl.destroy();dipperCtl=null;dipperReplay=false;
   tickFrom=MAX_REDRAWS-(old.redraws||0);render();scrollTo({top:0,behavior:'instant'});redrawPhase='entering';const fresh=root.querySelector<HTMLElement>('.minimal-result');
   if(fresh){holdResult(fresh);await revealCard(fresh,{backHtml:cardBack(),frontHtml:cardImage(cardById(next.cardId)),reversed:next.reversed,from,onPhase:p=>{drawPhase=p}})}
   drawPhase='idle';toast(used<MAX_REDRAWS?`换好了。今天还可以再换 ${MAX_REDRAWS-used} 次。`:'换好了。今天就是这张了。');tickFrom=null;redrawPhase='idle';return}
  dipperReplay=false}
 // 牌扇：回到洗牌 → 切牌 → 选牌，和第一次完全一样；选定后由 beginDraw 换牌、计次并播放揭晓动画
 if(!old)return;redrawPhase='drawing';fanReplay={old,used};render();scrollTo({top:0,behavior:'instant'})};
const pf=root.querySelector<HTMLFormElement>('#preferences');if(pf)pf.onsubmit=e=>{e.preventDefault();draft.nickname=root.querySelector<HTMLInputElement>('#nickname')!.value.trim();data.preferences={...draft,onboarded:true};const ok=save();render();toast(ok?'偏好已保存。':error)};
const bf=root.querySelector<HTMLFormElement>('#birth-form');if(bf)bf.onsubmit=e=>{e.preventDefault();const d=root.querySelector<HTMLInputElement>('#birth-date')!.value,t=root.querySelector<HTMLInputElement>('#birth-time')!.value;if(!validBirth(d)){toast('请填写有效的出生日期：1900 年以后，且不晚于今天。');return}data.preferences={...data.preferences,birthDate:d,birthTime:t};const ok=save();saveGravityBirth(d,t);render();toast(ok?'生辰已保存，日历页会显示你的今日运势。':error)};const autosave=()=>{const d=root.querySelector<HTMLInputElement>('#birth-date')!.value,t=root.querySelector<HTMLInputElement>('#birth-time')!.value;if(!validBirth(d))return;data.preferences={...data.preferences,birthDate:d,birthTime:t};save();saveGravityBirth(d,t);navigator.storage?.persist?.().catch(()=>{});toast('生辰已自动保存。')};root.querySelector('#birth-date')?.addEventListener('change',autosave);root.querySelector('#birth-time')?.addEventListener('change',autosave);const bc=root.querySelector<HTMLButtonElement>('.birth-clear');if(bc)bc.onclick=()=>{data.preferences={...data.preferences,birthDate:'',birthTime:''};save();saveGravityBirth('','');render();toast('生辰已清除。')};
// 添加到手机桌面：浏览器支持安装提示时直接弹出；不支持（比如 iPhone Safari）就把操作步骤亮出来
const inst=root.querySelector<HTMLButtonElement>('.install-now');if(inst)inst.onclick=async()=>{const p=(window as Window&{__bip?:Event&{prompt:()=>Promise<void>}}).__bip;if(p){await p.prompt();return}root.querySelector('.install-how')?.classList.add('is-shown');toast('按上面的步骤添加就好。')};
const ex=root.querySelector<HTMLButtonElement>('.export-data');if(ex)ex.onclick=exportBackup;
const rem=root.querySelector<HTMLButtonElement>('.add-reminder');if(rem)rem.onclick=()=>{const [h,m]=(root.querySelector<HTMLInputElement>('#reminder-time')?.value||'07:30').split(':').map(Number);try{download(new Blob([buildReminderIcs({hour:h,minute:m,url:`${SITE_URL}/ritual/`,from:new Date()})],{type:'text/calendar;charset=utf-8'}),'daybreak-morning.ics');triggerHaptic('success');toast(`已生成日历文件。打开它，选「添加」，每天 ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')} 提醒你。`)}catch{toast('时间不对，请重新选一下。')}};
root.querySelectorAll<HTMLButtonElement>('.backup-now').forEach(b=>b.onclick=()=>{exportBackup();root.querySelector('.backup-nudge')?.remove()});
root.querySelectorAll<HTMLButtonElement>('.backup-later').forEach(b=>b.onclick=()=>{writeBackupState(storage,{...readBackupState(storage),...snooze(new Date())});root.querySelector('.backup-nudge')?.remove()});
const imp=root.querySelector<HTMLInputElement>('#import-data');if(imp)imp.onchange=async()=>{const f=imp.files?.[0];if(!f)return;try{if(f.size>10_000_000)throw Error('文件不能超过 10 MB');const next=validate(JSON.parse(await f.text()));if(confirm('导入会替换当前浏览器中的全部记录与偏好，继续吗？')){data=next;const ok=save();render();toast(ok?'数据已恢复。':error)}}catch(e){toast(e instanceof Error?e.message:'无法导入此文件')}finally{imp.value=''}};
const clear=root.querySelector<HTMLButtonElement>('.clear');if(clear)clear.onclick=()=>{if(confirm('确定清除全部牌面与回顾？此操作无法撤销，请先导出备份。')){data.days={};save();render();toast('历史记录已清除。')}};const reset=root.querySelector<HTMLButtonElement>('.reset');if(reset)reset.onclick=()=>{if(confirm('重置昵称、主题与风格？历史记录将保留。')){data.preferences={...defaults(),onboarded:true};save();render()}}}
window.onpopstate=()=>{selected='';render()};function checkDate(){const next=localDate();const nowEvening=new Date().getHours()>=18;const noteField=root.querySelector<HTMLTextAreaElement>('#note');const unsaved=noteField&&noteField.value!==(data.days[today]?.review?.note||'');if(nowEvening!==eveningPhase&&!unsaved){eveningPhase=nowEvening;render()}syncTheme();if(next!==today){today=next;mood='';intent='';render()}}window.addEventListener('focus',checkDate);document.addEventListener('visibilitychange',checkDate);setInterval(checkDate,15000);window.addEventListener('storage',()=>{const next=read(storage);data=next.data;error=next.error||'';render()});render();if('serviceWorker'in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});

window.addEventListener('daybreak-theme',((e:CustomEvent)=>{data.preferences.themeMode=e.detail;save();render()}) as EventListener);
