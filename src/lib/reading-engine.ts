// 牌阵解读引擎：不用 AI，按专业塔罗师解牌的步骤把一次牌阵读成围绕问题的白话。
// 1. 理解问题：领域（感情 / 人际 / 学业工作 / 钱 / 自己）、问题类型（怎么做 / 为什么 / 会不会 / 对方怎么想 / 二选一）、关键词、敏感话题。
// 2. 每个牌阵位置有一个「角色」（现状、阻碍、建议、过去、未来……），同一张牌在不同角色里说法不同。
// 3. 每张牌有语气（TONE，按 Waite 原典与通行牌义手工标注）：正位照用，逆位往回收一半——好牌受阻，难牌缓和。
// 4. 组合：相邻位置的元素相性（金色黎明体系：火风相生、水土相生，火水、风土相克）、大牌 / 逆位 / 花色的集中、时间线的走向。
// 5. 成文：先给一句回应问题的结论，再逐张、再连起来看，最后给今天能做的小事。牌只提供角度，不做预测。
import type {DrawnCard,TarotCard,TarotSpread,Topic} from '../types/tarot.ts';

export type Domain='love'|'people'|'career'|'wealth'|'self';
export type Kind='how'|'why'|'will'|'mind'|'choice'|'focus'|'open';
type Role='daily'|'cover'|'now'|'block'|'advice'|'past'|'future'|'outcome'|'goal'|'root'|'self'|'env'|'hope'|'common'|'gain'|'cost'|'core'|'origin'|'resource'|'choose'|'balance'|'support'|'next';

export const DOMAIN_LABEL:Record<Domain,string>={love:'感情',people:'人际关系',career:'学业工作',wealth:'钱和消费',self:'我自己'};
const DOMAIN_IN:Record<Domain,string>={love:'在这段感情里，',people:'在和人相处上，',career:'在学业和工作上，',wealth:'在钱的安排上，',self:''};
const DOMAIN_DO:Record<Domain,string>={love:'放到感情里',people:'放到和人相处上',career:'放到学业和工作上',wealth:'放到钱和精力的安排上',self:''};
const DOMAIN_WORDS:[Domain,RegExp][]=[
 ['love',/对象|男友|女友|男朋友|女朋友|老公|老婆|伴侣|暧昧|恋爱|喜欢|分手|复合|前任|表白|结婚|离婚|婚姻|感情|约会|相亲|异地|爱我|追求|心动|这段关系|crush/gi],
 ['career',/工作|上班|跳槽|辞职|离职|面试|offer|老板|领导|同事|升职|加薪|项目|考研|考公|考编|考试|学业|论文|毕业|实习|创业|副业|职业|简历|绩效|留学|学校|专业|读书|读研|学习|导师|求职/gi],
 ['wealth',/钱|存款|攒|理财|消费|花销|收入|工资|负债|欠|贷款|买房|房租|预算|开销|月光|赚/g],
 ['people',/朋友|闺蜜|父母|家人|爸|妈|室友|同学|亲戚|邻居|社交|人际|孩子|兄弟|姐妹/g],
];
const PERSON=/他|她|对方|TA/i;
// 常见话题词：命中就用它当这次解读反复提到的「这件事」
const SUBJECTS=['换工作','跳槽','辞职','面试','考研','考公','考试','论文','毕业','实习','升职','加薪','创业','副业','留学','求职','分手','复合','表白','暧昧','结婚','异地','相亲','前任','冷战','沟通','存钱','攒钱','理财','买房','搬家','减肥','健身','社交','新项目','这段关系','这段感情'];

export interface QuestionInfo {domain:Domain;kind:Kind;subject:string;options:[string,string]|null;notices:string[]}

const clean=(s:string)=>s.replace(/^[\s，。、？?！!「」"“”,]+|[\s，。、？?！!「」"“”,吗呢吧啊呀]+$/g,'');
/** 读懂问题：领域、类型、关键词，以及需要先说清楚的提醒。 */
export function understand(question:string):QuestionInfo{
 const q=question.trim(),notices:string[]=[];
 const scores=DOMAIN_WORDS.map(([d,re])=>[d,(q.match(re)||[]).length] as const).sort((a,b)=>b[1]-a[1]);
 let domain:Domain=scores[0][1]>0?scores[0][0]:'self';
 if(domain==='self'&&PERSON.test(q))domain='love';
 const who=q.match(/(他|她|对方|TA|老板|领导|同事|妈妈|爸爸|父母|朋友|室友|对象).{0,8}(怎么想|想法|喜不喜欢|喜欢我|爱我|在想|心里|态度|对我|看我)/i);
 const kind:Kind=!q?'open':/还是|要不要|该不该|选哪|二选一/.test(q)?'choice':who?'mind':/会不会|能不能|有没有可能|可不可以|能否|会.{0,8}吗|能.{0,8}吗|什么时候|多久|合适吗|适合.{0,8}吗/.test(q)?'will':/为什么|为何|怎么会|原因/.test(q)?'why':/怎样|怎么|如何|可以做|该做/.test(q)?'how':/最该|留意|注意|弄清|看清|是什么/.test(q)?'focus':'open';
 let options:[string,string]|null=null;
 const m=q.match(/([^，。？?、]{1,16}?)还是([^，。？?、]{1,16})/),yn=q.match(/(?:要不要|该不该)([^，。？?]{1,16})/);
 const strip=(s:string)=>clean(s.replace(/^(我|我们)?(到底|究竟)?(是|该|应该|要|想)?(选择?)?/,'').replace(/(比较好|更好|好)$/,''));
 if(m){const a=strip(m[1]),b=strip(m[2]);if(a&&b)options=[a,b]}
 else if(yn){const a=strip(yn[1]);if(a)options=[a,'先不动']}
 const hit=SUBJECTS.find(w=>q.includes(w));
 // 去掉问法，只留「这件事」本身：按逗号拆开，丢掉只剩问法的半句，取第一段有内容的
 const tail=/(我|我们)?(最|最该|需要|应该|该|要|可以|能|还)*(先)?(留意|注意|弄清|看清|做|知道|关注|调整|推进|坚持|处理|面对)?(些|一下)?(什么|哪些|怎样|怎么办|怎么样|如何|下去|会怎样)$/;
 const short=clean(q).split(/[，,；;]/).map(s=>clean(s.replace(/^(为什么|为何|怎么会|请问)/,'').replace(/^(我|我们)/,'').replace(tail,'').replace(/(可以|应该|该|要)?(怎样|怎么|如何)/,'').replace(/^(我|我们)/,''))).find(s=>s.length>=2)??'';
 const subject=kind==='mind'?(/他|她|对方|TA/i.test(who?.[1]??'')?(domain==='love'?'你们的关系':'你和对方'):`你和${who![1]}`):options&&!m?options[0]:options?`${options[0]}还是${options[1]}`:hit||(short&&short.length<=12?short:q?'这件事':'今天');
 if(kind==='mind')notices.push('牌读不了别人心里在想什么。下面把问题换成「你能怎么做」来读，这部分才是你能掌握的。');
 if(kind==='will')notices.push('牌不负责预测「会不会」「什么时候」，它更擅长告诉你：什么能让你想要的结果更有可能发生。');
 if(/想死|自杀|轻生|不想活|伤害自己/.test(q))notices.push('如果你现在很难受，甚至想伤害自己，请先放下牌，马上联系身边信任的人，或拨打心理援助热线 12356。');
 else if(/病|医院|怀孕|抑郁症|焦虑症|手术|诊断|吃药|官司|起诉|律师|股票|基金|炒币|彩票/.test(q))notices.push('涉及健康、法律或投资的事，请以医生、律师或专业人士的意见为准。牌只能帮你理清自己的想法和感受。');
 return {domain,kind,subject,options,notices}}

/** 领域和旧记录里的 Topic 互相换算 */
export const domainToTopic=(d:Domain):Topic=>d==='love'||d==='people'?'love':d==='career'?'career':d==='wealth'?'wealth':'general';
export const topicToDomain=(t:Topic):Domain|undefined=>t==='love'?'love':t==='career'?'career':t==='wealth'?'wealth':undefined;

// 每个牌阵位置的角色；没有列出的牌阵按「现状」处理
const ROLES:Record<string,Role[]>={
 'single-daily':['daily'],
 'three-card-state':['now','block','advice'],
 'three-card-time':['past','now','future'],
 'two-paths':['common','gain','cost','gain','cost'],
 'celtic-cross':['cover','block','goal','root','past','future','self','env','hope','outcome'],
 'big-dipper':['core','origin','resource','choose','balance','support','next'],
 'four-elements':['now','now','now','now'],
};
const roleOf=(spread:TarotSpread,i:number):Role=>ROLES[spread.id]?.[i]??'now';

// 正位语气：1 偏鼓励，0 中性，-1 偏提醒。依据 Waite《The Pictorial Key to the Tarot》与通行牌义。
const MAJOR_TONE=[1,1,0,1,1,0,1,1,1,0,1,0,0,-.5,1,-1,-1,1,-1,1,1,1];
const SUIT_TONE:Record<string,number[]>={ // 王牌到十，再到侍从、骑士、王后、国王
 wands:[1,1,1,1,-1,1,0,1,0,-1,1,1,1,1],
 cups:[1,1,1,-1,-1,1,-1,0,1,1,1,1,1,1],
 swords:[1,-1,-1,0,-1,0,-1,-1,-1,-1,0,0,0,0],
 pentacles:[1,0,1,0,-1,1,0,1,1,1,1,1,1,1]};
/** 语气：正位照用；逆位把力量往回收一半——好牌受阻，难牌缓和。 */
export function tone(d:Pick<DrawnCard,'card'|'isReversed'>){const c=d.card;const base=c.arcana==='major'?MAJOR_TONE[c.number]??0:SUIT_TONE[c.suit]?.[c.number-1]??0;return d.isReversed?(base>0?-.5:base<0?.5:-.25):base}
const kw=(d:DrawnCard)=>d.card[d.isReversed?'reversed':'upright'].keywords;
const nm=(d:DrawnCard)=>`${d.card.name_zh}${d.isReversed?'逆位':''}`;
const court=(c:TarotCard)=>c.arcana==='minor'&&c.number>10;
function aspect(c:TarotCard,domain:Domain){return domain==='love'||domain==='people'?c.life_aspects.love:domain==='career'?c.life_aspects.career:domain==='wealth'?c.life_aspects.finance:''}
// 这些位置本身就是「可以怎么做」，接上这张牌在该领域里的具体建议；其余位置只描述，不给建议
const ADVISE:Role[]=['daily','advice','next','common','self','core'];

/** 一张牌在它的位置上，对这个问题说了什么 */
function cardText(d:DrawnCard,role:Role,info:QuestionInfo,opt=''):string{
 const [k0,k1]=kw(d),t=tone(d),both=k1?`「${k0}」，也带着一点「${k1}」`:`「${k0}」`,dom=DOMAIN_IN[info.domain];
 const lines:Record<Role,()=>string>={
  daily:()=>`今天这张牌落在${both}上。想一想今天哪件具体的事和它对得上。`,
  cover:()=>`${dom}整件事笼罩在${both}的氛围里，别的一切都在它里面发生。`,
  now:()=>`${dom}你现在更接近${both}的状态。`,
  core:()=>`这件事里你最在意、最放不下的，和${both}有关。`,
  self:()=>`你在这件事里的姿态，更像${both}。`,
  common:()=>`不管选哪条路，你都要先面对${both}。`,
  block:()=>t>.3?`${dom}这张牌本身不是难牌，放在阻碍的位置，说明问题可能不在缺少什么，而在「${k0}」用过了头，或者用错了地方。`:t>=0?`${dom}卡住你的，和「${k0}」有关：可能是它太多了，也可能是太少了，对照一下是哪一种。`:`${dom}卡住你的，可能是${both}。`,
  advice:()=>t>=0?`牌给的方向是「${k0}」${k1?`和「${k1}」`:''}：不用一步到位，先做一个小动作试试。`:`建议位出现这张牌，与其说是建议，不如说是提醒：先承认「${k0}」这件事确实存在，再决定下一步。`,
  next:()=>t>=0?`接下来可以迈出的一步，是「${k0}」：小一点、今天就能开始的那种。`:`接下来的一步，先从照顾「${k0}」开始，别急着往前冲。`,
  past:()=>`${dom}已经发生过、到现在还在影响你的，是${both}。`,
  origin:()=>`这件事的起点，和${both}有关。`,
  root:()=>`这件事的根基，是已经属于你的${both}。`,
  future:()=>t>=0?`${dom}照现在的做法走下去，更可能走向「${k0}」。`:`${dom}如果什么都不改，事情可能往「${k0}」的方向滑。这是提醒，不是定局。`,
  outcome:()=>t>=0?`前面这些加在一起，最可能促成的是「${k0}」。`:`前面这些加在一起，眼下更可能先走到「${k0}」。好在牌说的是「照现在这样」，改变做法，结果也会跟着变。`,
  goal:()=>`你真正想要的，是「${k0}」。这是眼下条件里能做到的最好结果，只是还没实现。`,
  env:()=>`身边的环境里，有${both}的影响${court(d.card)?'，也可能就是身边的某个人':''}。`,
  support:()=>t>=0?`外面能帮上你的，是「${k0}」${court(d.card)?'，也可能是身边某个具体的人':''}。`:`外部条件现在不太配合，带着「${k0}」的味道，先别指望它推你一把。`,
  hope:()=>`你心里对这件事的期待，或者担心，是「${k0}」。期待和担心，常常是同一件事的两面。`,
  resource:()=>t>=0?`你手里已经有的，是「${k0}」，可以先用上。`:`你手里的东西里，「${k0}」是要先照顾好的那一项。`,
  choose:()=>`需要你拿主意的地方，和「${k0}」有关：两头都想要的时候，先保住更重要的那一头。`,
  balance:()=>`要稳住，留意「${k0}」：哪里用力过头，就在哪里松一点。`,
  gain:()=>t>.3?`选${opt}，能给你「${k0}」${k1?`和「${k1}」`:''}。`:t>=0?`选${opt}的好处，和「${k0}」有关，但不算突出，要你自己去争取。`:`选${opt}的好处不太明显，牌面更多是「${k0}」。也许它满足的，并不是你最想要的那个需要。`,
  cost:()=>t>.3?`选${opt}的代价比较轻，这张牌甚至带着「${k0}」的意思：付出的东西，可能会以别的方式回来。`:t>=0?`选${opt}要付出的，是「${k0}」这一面，不算重，但要提前想好怎么照顾。`:`选${opt}要付出的，可能是${both}。`,
 };
 let s=lines[role]();
 const a=aspect(d.card,info.domain);
 if(a&&ADVISE.includes(role))s+=`${DOMAIN_DO[info.domain]}：${a}`;
 return s}

const EL:Record<string,string>={fire:'火',water:'水',air:'风',earth:'土'};
const EL_MEAN:Record<string,string>={fire:'行动和热情',water:'感受和关系',air:'想法和沟通',earth:'现实、身体和钱'};
/** 两张牌之间的关系：元素相性。互不干扰的组合不值得说，返回空。 */
function relation(a:DrawnCard,b:DrawnCard){const x=a.card.element,y=b.card.element,A=`${nm(a)}（${kw(a)[0]}）`,B=`${nm(b)}（${kw(b)[0]}）`;
 if(x==='spirit'&&y==='spirit')return `${A}和${B}都是大牌，说的都是比较大的状态：这件事对你分量不轻。`;
 if(x==='spirit'||y==='spirit'){const [M,m]=x==='spirit'?[A,B]:[B,A];return `${M}是大牌，定下了整件事的底色；${m}是小牌，指向具体能动手的地方。`}
 if(x===y)return `${A}和${B}同属${EL[x]}，「${EL_MEAN[x]}」这股力量在反复出现，看看它是在帮你，还是在拖你。`;
 const pair=[x,y].sort().join('-');
 if(pair==='air-fire'||pair==='earth-water')return `${A}和${B}是${EL[x]}和${EL[y]}，彼此相生，力气往一个方向使，顺着走会比较省力。`;
 if(pair==='fire-water'||pair==='air-earth')return `${A}和${B}是${EL[x]}和${EL[y]}，彼此相克：「${EL_MEAN[x]}」和「${EL_MEAN[y]}」在互相拉扯，这里需要你有意识地调和。`;
 return ''}

const SUIT_THEME:Record<string,string>={wands:'行动和热情',cups:'感受和关系',swords:'想法、沟通和冲突',pentacles:'现实、身体和钱'};
// 连起来看时，哪些位置两两对照
const PAIRS:Record<string,[number,number][]>={'three-card-state':[[0,1],[1,2]],'three-card-time':[[0,1],[1,2]],'celtic-cross':[[0,1],[6,7],[2,9]],'big-dipper':[[0,6],[2,5]]};

export interface SpreadReading extends QuestionInfo {headline:string;cards:{id:string;text:string}[];flow:string[];actions:string[];reflection:string}

/** 读一次牌阵。domain 不传就按问题自动判断。 */
export function readSpread(question:string,spread:TarotSpread,drawn:readonly DrawnCard[],domain?:Domain):SpreadReading{
 const info={...understand(question)};info.notices=[...info.notices];if(domain)info.domain=domain;
 const S=`「${info.subject}」`,[A,B]=info.options??['A','B'];
 const cards=drawn.map((d,i)=>{const role=roleOf(spread,i);return {id:d.card.id,text:cardText(d,role,info,role==='gain'||role==='cost'?(i<=2?A:B):'')}});
 const k=(i:number)=>drawn[i]?kw(drawn[i])[0]:'',t=(i:number)=>drawn[i]?tone(drawn[i]):0;
 let headline='';
 switch(spread.id){
  case 'single-daily':headline=`关于${S}，抽到的是${nm(drawn[0])}，给你的提醒是「${k(0)}」。`;break;
  case 'three-card-state':headline=`关于${S}，三张牌连起来是这样一条线：眼下的主题是「${k(0)}」，真正卡住你的，和「${k(1)}」有关；${t(2)>=0?`往前走的钥匙，在「${k(2)}」这一边`:`往前走之前，要先处理「${k(2)}」这件事`}。`;break;
  case 'three-card-time':headline=`关于${S}：过去留下的是「${k(0)}」，现在的主题是「${k(1)}」，${t(2)>=0?`照这样走下去，更可能走向「${k(2)}」`:`如果什么都不改，要留意可能滑向「${k(2)}」`}。`;break;
  case 'two-paths':{const path=(o:string,g:number,c:number)=>`${o}${t(g)>.3?`能得到「${k(g)}」`:'的好处不太突出'}，${t(c)>.3?'代价比较轻':`代价是「${k(c)}」`}`;const sa=t(1)+t(2),sb=t(3)+t(4);
   headline=`关于${S}：${path(A,1,2)}；${path(B,3,4)}。`+(Math.abs(sa-sb)>=.75?`单看牌面，${sa>sb?A:B}这条路整体更顺一些。`:'两条路的牌面差不多，真正决定的，是你更愿意承受哪一种代价。')+'最后怎么选，以你知道的实际情况为准。';break}
  case 'celtic-cross':headline=`关于${S}：整件事笼罩在「${k(0)}」的氛围里，眼前挡着的是「${k(1)}」；你真正想要的是「${k(2)}」，而照现在的走法，${t(9)>=0?`最可能走向「${k(9)}」`:`更可能先走到「${k(9)}」，还来得及调整`}。`;break;
  case 'big-dipper':headline=`关于${S}：你最放不下的是「${k(0)}」，手里已经有「${k(2)}」可以用；${t(6)>=0?`接下来先迈出「${k(6)}」这一小步`:`接下来先照顾好「${k(6)}」，再往前走`}。`;break;
  default:headline=`关于${S}：${drawn.map(d=>`「${kw(d)[0]}」`).join('、')}。`}
 if(info.kind==='why'&&spread.id==='three-card-state')headline+='你问的「为什么」，答案多半藏在阻碍那张牌里。';
 if(info.kind==='choice'&&spread.id!=='two-paths')info.notices.push('你在两个选择之间犹豫。下次可以试试「二选一」牌阵，它会把两条路的好处和代价分开摆。');

 const flow:string[]=[];
 for(const [a,b] of PAIRS[spread.id]??[])if(drawn[a]&&drawn[b]){const r=relation(drawn[a],drawn[b]);if(r)flow.push(`「${drawn[a].position.title}」和「${drawn[b].position.title}」：${r}`)}
 if(spread.id==='three-card-time'&&drawn.length===3){const [p,n,f]=drawn.map(tone);flow.push(f>n&&n>=p?'整条线是往上走的：越往后越顺，眼下的努力在起作用。':f<n&&n<=p?'整条线在往下走：不是坏事要发生，而是提醒你现在的做法需要调整。':'这条线有起有伏，关键在「现在」这一步怎么走。')}
 if(spread.id==='two-paths'&&drawn.length===5)for(const [o,g,c] of [[A,1,2],[B,3,4]] as const){const r=relation(drawn[g],drawn[c]);if(r)flow.push(`${o}的好处和代价：${r}`)}
 const n=drawn.length,majors=drawn.filter(d=>d.card.arcana==='major').length,rev=drawn.filter(d=>d.isReversed).length;
 if(n>=3&&majors/n>=.5&&!flow.some(f=>f.includes('分量不轻')))flow.push(`${n}张里有${majors}张大牌：这件事对你分量不轻，不只是一时的情绪。`);
 if(n>=3&&rev/n>=.6)flow.push(`逆位比较多（${rev}张）：不少地方还卡着，或者劲儿用错了方向。先慢一点，比急着推进更有用。`);
 const suits=new Map<string,number>();for(const d of drawn)if(d.card.suit!=='none')suits.set(d.card.suit,(suits.get(d.card.suit)??0)+1);
 const top=[...suits].sort((a,b)=>b[1]-a[1])[0];
 if(top&&n>=3&&top[1]>=Math.max(2,Math.ceil(n/3)))flow.push(`有${top[1]}张牌都和${SUIT_THEME[top[0]]}有关，这次的重点多半落在这里。`);
 if(!flow.length)flow.push('这几张牌各说各的角度，没有特别强的牵连。挑一句和你最近的状态最对得上的，先从那里想起。');

 // 今天能做的：优先用建议位、接下来那一步的牌
 const pickRoles:Role[]=['advice','next','daily','common','self','outcome','future','core','now','cover'];
 const order=[...drawn.keys()].filter(i=>pickRoles.includes(roleOf(spread,i))).sort((a,b)=>pickRoles.indexOf(roleOf(spread,a))-pickRoles.indexOf(roleOf(spread,b)));
 const actions=[...new Set(order.map(i=>drawn[i].card.today_action))].slice(0,3);
 const reflection=info.subject!=='今天'?`回到${S}：今天哪一刻，你觉得离想要的样子近了一点？`:drawn[order[0]]?.card.evening_question??'今天哪件事，和你原本以为的不太一样？';
 return {...info,headline,cards,flow,actions,reflection}}
