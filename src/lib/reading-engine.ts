// 牌阵解读引擎：不用 AI，按专业塔罗师解牌的步骤把一次牌阵读成围绕问题的白话。
// 1. 理解问题：领域（感情 / 人际 / 学业工作 / 钱 / 自己）、问题类型（怎么做 / 为什么 / 会不会 / 对方怎么想 / 二选一）、关键词、敏感话题。
// 2. 每个牌阵位置有一个「角色」（现状、阻碍、建议、过去、未来……），同一张牌在不同角色里说法不同。
// 3. 每张牌有语气（TONE，按 Waite 原典与通行牌义手工标注）：正位照用，逆位往回收一半——好牌受阻，难牌缓和。
// 4. 组合：相邻位置的元素相性（金色黎明体系：火风相生、水土相生，火水、风土相克）、大牌 / 逆位 / 花色的集中、时间线的走向。
// 5. 成文：像塔罗师一样先把问题换成能回答的说法，按问题类型直接回应（会不会 → 走向；怎么做 → 第一步；为什么 → 卡在哪），
//    再逐张、再连起来看，最后给今天能做的小事。牌只提供角度，不做预测。
import type {DrawnCard,TarotCard,TarotSpread,Topic} from '../types/tarot.ts';
import {LINES} from './reading-lines.ts';

export type Domain='love'|'people'|'career'|'wealth'|'self';
export type Kind='how'|'why'|'will'|'mind'|'choice'|'focus'|'open';
type Role='daily'|'cover'|'now'|'block'|'advice'|'past'|'future'|'outcome'|'goal'|'root'|'self'|'env'|'hope'|'common'|'gain'|'cost'|'core'|'origin'|'resource'|'choose'|'balance'|'support'|'next';

export const DOMAIN_LABEL:Record<Domain,string>={love:'感情',people:'人际关系',career:'学业工作',wealth:'钱和消费',self:'我自己'};
const DOMAIN_IN:Record<Domain,string>={love:'在这段感情里，',people:'在和人相处上，',career:'在学业和工作上，',wealth:'在钱的安排上，',self:''};
const DOMAIN_DO:Record<Domain,string>={love:'放到感情里',people:'放到和人相处上',career:'放到学业和工作上',wealth:'放到钱和精力的安排上',self:''};
const DOMAIN_WORDS:[Domain,RegExp][]=[
 ['love',/对象|男友|女友|男朋友|女朋友|老公|老婆|伴侣|暧昧|恋爱|喜欢|分手|复合|前任|表白|结婚|离婚|婚姻|感情|约会|相亲|异地|爱我|追求|心动|这段关系|我们的关系|我们之间|走到最后|在一起|桃花|单身|脱单|对的人|失恋|挽回|网友|黏人|crush/gi],
 ['career',/工作|上班|跳槽|辞职|离职|面试|offer|老板|领导|同事|升职|加薪|项目|考研|考公|考编|考试|学业|论文|毕业|实习|创业|副业|职业|简历|绩效|留学|学校|专业|读书|读研|研究生|学习|导师|求职|上岸|大厂|公司|职场/gi],
 ['wealth',/钱|存款|攒|理财|消费|花销|收入|工资|负债|欠|贷款|买|房租|预算|开销|月光|赚|分期|投资|财运|经济/g],
 ['people',/朋友|闺蜜|父母|家人|家里|爸|妈|室友|同学|亲戚|邻居|社交|人际|孩子|兄弟|姐妹|集体|催婚/g],
];
const PERSON=/他|她|对方|TA/i;
// 常见话题词：命中就用它当这次解读反复提到的「这件事」
const SUBJECTS=['换工作','跳槽','辞职','面试','考研','考公','考试','论文','毕业','实习','升职','加薪','创业','副业','留学','求职','分手','复合','表白','暧昧','结婚','异地','相亲','前任','冷战','沟通','存钱','攒钱','理财','买房','搬家','减肥','健身','社交','新项目','这段关系','这段感情'];

/** reframe：塔罗师会把问题换成牌能回答的说法，并告诉提问的人「我会这样读你的问题」 */
export interface QuestionInfo {domain:Domain;kind:Kind;subject:string;options:[string,string]|null;notices:string[];reframe:string}
// 句尾的「吗 / 么」；「什么、怎么、多么」里的「么」不算
const ASK='(?<![什怎多这那])[吗么]';
const KIND_RE={
 choice:new RegExp(`还是|要不要|该不该|选哪|哪个|哪一个|二选一|^(我)?(应该|该|需要)[^怎如什].{0,12}${ASK}$`),
 // 问别人心里怎么想；「针对我」里的「对我」不算
 mind:new RegExp(`(他|她|对方|TA|ta|老板|领导|同事|面试官|妈妈|爸爸|父母|朋友|室友|同学|对象|前任|网友).{0,8}(怎么想|想法|喜不喜欢|喜欢我|爱我|在想|心里|态度|(?<!针)对我|看我|是不是|有没有|有意见|印象|真心)`),
 will:new RegExp(`会不会|能不能|有没有可能|有可能|可不可以|能否|会.{0,8}${ASK}|能.{0,8}${ASK}|什么时候|多久|合适${ASK}|合不合适|适合.{0,8}${ASK}|值得.{0,8}${ASK}|好${ASK}$|有没有结果|有结果|有戏|能成|成不成|在一起|走到最后|有未来|上岸|(时机|时候).{0,6}${ASK}|(会|运势|财运|接下来|未来|以后|下个月|今年|这周|发展).{0,8}(怎么样|如何|怎样)`),
 why:/为什么|为何|为啥|怎么会|原因|出在哪|哪里出了问题/,
 how:/怎样|怎么|如何|可以做|该做/,
 focus:/最该|留意|注意|弄清|看清|是什么|适合做什么|做什么|专注什么|改进什么/};

// 句尾的语气词也去掉；「么」只在不属于「什么 / 怎么 / 多么」时才算语气词
const clean=(s:string)=>s.replace(/^[\s，。、？?！!「」"“”,]+|[\s，。、？?！!「」"“”,吗呢吧啊呀]+$/g,'').replace(/(?<![什怎多这那要])[么嘛]$/,'');
/** 读懂问题：领域、类型、关键词，以及需要先说清楚的提醒。 */
export function understand(question:string):QuestionInfo{
 const q=question.trim(),notices:string[]=[];
 const scores=DOMAIN_WORDS.map(([d,re])=>[d,(q.match(re)||[]).length] as const).sort((a,b)=>b[1]-a[1]);
 let domain:Domain=scores[0][1]>0?scores[0][0]:'self';
 if(domain==='self'&&PERSON.test(q))domain='love';
 const qs=q.replace(/[？?！!。\s]+$/,''),who=qs.match(KIND_RE.mind);
 const kind:Kind=!q?'open':KIND_RE.choice.test(qs)?'choice':who?'mind':KIND_RE.why.test(qs)?'why':KIND_RE.will.test(qs)?'will':KIND_RE.how.test(qs)?'how':KIND_RE.focus.test(qs)?'focus':'open';
 let options:[string,string]|null=null;
 const m=q.match(/([^，。？?、]{1,16}?)还是([^，。？?、]{1,16})/),yn=q.match(/(?:要不要|该不该)([^，。？?]{1,16})/);
 const strip=(s:string)=>clean(s.replace(/^(我们|我)?(到底|究竟)?(是|该|应该|要|想)?(选择?)?/,'').replace(/(比较好|更好|好)$/,''));
 if(m){const a=strip(m[1]),b=strip(m[2]);if(a&&b)options=[a,b]}
 else if(yn){const a=strip(yn[1]);if(a)options=[a,'先不动']}
 const hit=SUBJECTS.find(w=>q.includes(w));
 // 去掉问法，只留「这件事」本身：按逗号拆开，丢掉只剩问法的半句，取第一段有内容的
 const tail=/(我们|我)?(最|最该|需要|应该|该|要|可以|能|还)*(先)?(留意|注意|弄清|看清|做|知道|关注|调整|推进|坚持|处理|面对)?(些|一下)?(什么|哪些|怎样|怎么办|怎么样|如何|下去|会怎样)$/;
 const short=clean(q).split(/[，,；;]/).map(s=>clean(s.replace(/^(为什么|为何|怎么会|请问)/,'').replace(/^(我们|我)/,'').replace(tail,'').replace(/(可以|应该|该|要)?(怎样|怎么|如何)/,'').replace(/^(我们|我)/,''))).find(s=>s.length>=2)??'';
 // 问的是自己和「他 / 她」之间、又没点出具体的事（比如「我跟她有结果么」），这件事就是你们的关系
 const subject=kind==='mind'?(/他|她|对方|TA|对象|前任|网友/i.test(who?.[1]??'')?(domain==='love'?'你们的关系':'你和对方'):`你和${who![1]}`):options&&!m?options[0]:options?`${options[0]}还是${options[1]}`:hit||(domain==='love'&&(PERSON.test(q)||/我们/.test(q))&&kind!=='how'?'你们的关系':short&&short.length<=12?short:q?'这件事':'今天');
 const S=`「${subject}」`;
 const reframe=!q?'':{choice:options?`「${options[0]}」和「${options[1]}」，各自能得到什么、要付出什么`:`${S}，两边各自的得失`,mind:`在${S}里，你能看清什么、可以怎么做`,will:`照现在这样，${S}会往哪里走，你能做些什么`,why:`${S}，卡在了哪里`,how:`${S}，从哪里开始最合适`,focus:`${S}，最需要留意的是什么`,open:`${S}，牌想提醒你什么`}[kind];
 if(kind==='mind')notices.push('牌读不了别人心里在想什么。下面把问题换成「你能怎么做」来读，这部分才是你能掌握的。');
 if(kind==='will')notices.push('牌不负责预测「会不会」「什么时候」，它更擅长告诉你：什么能让你想要的结果更有可能发生。');
 if(/想死|自杀|轻生|不想活|伤害自己/.test(q))notices.push('如果你现在很难受，甚至想伤害自己，请先放下牌，马上联系身边信任的人，或拨打心理援助热线 12356。');
 else if(/病|医院|怀孕|抑郁症|焦虑症|手术|诊断|吃药|官司|起诉|律师|股票|基金|炒币|彩票/.test(q))notices.push('涉及健康、法律或投资的事，请以医生、律师或专业人士的意见为准。牌只能帮你理清自己的想法和感受。');
 return {domain,kind,subject,options,notices,reframe}}

/** 塔罗师会按问题挑牌阵：二选一摆两条路，问走向看过去现在未来，其余先看现状、阻碍和建议 */
export function suggestSpread(kind:Kind){return kind==='choice'?'two-paths':kind==='will'?'three-card-time':'three-card-state'}

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
// 这些位置本身就是「可以怎么做」，再接上这张牌在该领域里的具体建议
const ADVISE:Role[]=['daily','advice','next'];
const LINE_AT:Record<Domain,number>={love:0,people:0,career:1,wealth:2,self:3};
/** 这张牌在这个领域里说的是什么（reading-lines.ts），正位取前四句，逆位取后四句 */
const domainLine=(d:DrawnCard,domain:Domain)=>LINES[d.card.id]?.[(d.isReversed?4:0)+LINE_AT[domain]]??'';

/** 一张牌在它的位置上，对这个问题说了什么 */
function cardText(d:DrawnCard,role:Role,info:QuestionInfo,opt=''):string{
 const line=domainLine(d,info.domain);
 // 有分领域的那句时，位置句里只点一个关键词，免得和后面那句重复
 const [k0,k1]=kw(d),t=tone(d),both=k1&&!line?`「${k0}」，也带着一点「${k1}」`:`「${k0}」`,dom=line?'':DOMAIN_IN[info.domain];
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
 // 描述类位置接上这张牌在该领域里的意思；建议类位置接上具体做法（一张牌的日常指引两样都要）
 if(!ADVISE.includes(role)||role==='daily')s+=line;
 if(ADVISE.includes(role))s+=a?`${DOMAIN_DO[info.domain]||'具体来说'}：${a}`:line;
 return s}

/** 同一个意思准备几种说法，按这次抽到的牌挑一种：同一次牌阵每次读出来一样，换一次牌就换一种说法，不会千篇一律 */
function pick<T>(drawn:readonly DrawnCard[],options:readonly T[]):T{let h=0;for(const d of drawn)for(const ch of d.card.id+(d.isReversed?'r':''))h=(h*31+ch.charCodeAt(0))>>>0;return options[h%options.length]}

// 塔罗师先回答问题、再解释：每个位置在「整体倾向」里的分量，未来和结果最重，阻碍本来就偏难，分量最轻
const WEIGHT:Partial<Record<Role,number>>={outcome:2,future:2,daily:2,advice:1.5,next:1.5,now:1,core:1,cover:1,self:1,block:.5};
const firstOf=(spread:TarotSpread,n:number,roles:Role[])=>{for(const r of roles)for(let i=0;i<n;i++)if(roleOf(spread,i)===r)return i;return 0};
/** 按问题类型直接回应：会不会 → 整体走向；怎么做 → 第一步；为什么 → 卡在哪；对方怎么想 → 你们之间的状态；留意什么 → 最该注意的一张 */
function answer(info:QuestionInfo,spread:TarotSpread,drawn:readonly DrawnCard[]):string{
 if(!drawn.length||spread.id==='two-paths')return '';
 const n=drawn.length,S=`「${info.subject}」`,idx=(roles:Role[])=>firstOf(spread,n,roles),say=(i:number)=>`${nm(drawn[i])}（${kw(drawn[i])[0]}）`;
 let sum=0,wt=0;drawn.forEach((d,i)=>{const w=WEIGHT[roleOf(spread,i)]??.5;sum+=w*tone(d);wt+=w});const score=sum/wt;
 const line=(i:number)=>domainLine(drawn[i],info.domain);
 switch(info.kind){
  case 'will':case 'choice':{const subj=info.kind==='choice'&&info.options?`「${info.options[0]}」`:S;
   const lead=score>=.35?pick(drawn,['整体牌面偏积极：照现在这样走，往好的方向发展的空间更大','牌面整体是顺的：方向是对的，继续用心经营，结果会往好的一边靠','这组牌给的信号偏正面：有机会，而且机会在你手里']):score>=-.15?pick(drawn,['牌面有好有难：有可能，但它不会自己发生，要看你接下来怎么做','这组牌是一半一半：路是通的，只是不会自己走到，需要你推一把']):pick(drawn,['牌面阻力偏多：照现在这样走不太顺，先把卡住的地方处理好，局面才会松动','这组牌提醒的比鼓励的多：不是没可能，而是现在的走法需要调整']);
   const key=score<-.15?idx(['block','now','cover','core','past','daily']):idx(['advice','next','future','outcome','now','daily']);
   return `关于${subj}，${lead}。最关键的一张是${say(key)}。`}
  case 'how':{const i=idx(['advice','next','future','outcome','now','daily']);return tone(drawn[i])>=0?`关于${S}，牌给的第一步是「${kw(drawn[i])[0]}」。${line(i)}`:`关于${S}，先别急着找办法：${say(i)}在提醒你，先处理好「${kw(drawn[i])[0]}」，再往前走。`}
  case 'why':{const i=idx(['block','past','origin','cover','now','daily']);return `${S}，多半卡在「${kw(drawn[i])[0]}」这里。${line(i)}`}
  case 'mind':{const i=idx(['now','core','cover','self','daily']);return `牌不读别人的心，但能看你们之间的状态：眼下是「${kw(drawn[i])[0]}」。${line(i)}`}
  case 'focus':{const i=idx(['block','hope','balance','now','daily']);return `${S}最需要留意的，是「${kw(drawn[i])[0]}」。${line(i)}`}
  default:return ''}}

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

export interface SpreadReading extends QuestionInfo {answer:string;headline:string;cards:{id:string;text:string}[];flow:string[];actions:string[];reflection:string}

/** 读一次牌阵。domain 不传就按问题自动判断。 */
export function readSpread(question:string,spread:TarotSpread,drawn:readonly DrawnCard[],domain?:Domain):SpreadReading{
 const info={...understand(question)};info.notices=[...info.notices];if(domain)info.domain=domain;
 const S=`「${info.subject}」`,[A,B]=info.options??['A','B'];
 const cards=drawn.map((d,i)=>{const role=roleOf(spread,i);return {id:d.card.id,text:cardText(d,role,info,role==='gain'||role==='cost'?(i<=2?A:B):'')}});
 const k=(i:number)=>drawn[i]?kw(drawn[i])[0]:'',t=(i:number)=>drawn[i]?tone(drawn[i]):0;
 let headline='';
 switch(spread.id){
  case 'single-daily':headline=`关于${S}，抽到的是${nm(drawn[0])}，给你的提醒是「${k(0)}」。`;break;
  case 'three-card-state':{const go=t(2)>=0?pick(drawn,[`往前走的钥匙，在「${k(2)}」这一边`,`牌建议你从「${k(2)}」开始`,`松动它的办法，藏在「${k(2)}」里`]):pick(drawn,[`往前走之前，要先处理「${k(2)}」这件事`,`在动手之前，先正视「${k(2)}」`]);
   headline=pick(drawn,[`关于${S}，三张牌连起来是这样一条线：眼下的主题是「${k(0)}」，真正卡住你的，和「${k(1)}」有关；${go}。`,`关于${S}：你现在处在「${k(0)}」里，挡在前面的是「${k(1)}」；${go}。`,`${S}这件事，现在的底色是「${k(0)}」。让它停住的，是「${k(1)}」；${go}。`]);break}
  case 'three-card-time':{const end=t(2)>=0?pick(drawn,[`照这样走下去，更可能走向「${k(2)}」`,`接下来的方向是「${k(2)}」`]):pick(drawn,[`如果什么都不改，要留意可能滑向「${k(2)}」`,`不调整的话，可能会走到「${k(2)}」`]);
   headline=pick(drawn,[`关于${S}：过去留下的是「${k(0)}」，现在的主题是「${k(1)}」，${end}。`,`${S}的这条线，是从「${k(0)}」走到眼下的「${k(1)}」；${end}。`,`回头看，${S}里留下了「${k(0)}」；现在是「${k(1)}」；${end}。`]);break}
  case 'two-paths':{const path=(o:string,g:number,c:number)=>`${o}${t(g)>.3?`能得到「${k(g)}」`:'的好处不太突出'}，${t(c)>.3?'代价比较轻':`代价是「${k(c)}」`}`;const sa=t(1)+t(2),sb=t(3)+t(4);
   headline=`关于${S}：${path(A,1,2)}；${path(B,3,4)}。`+(Math.abs(sa-sb)>=.75?`单看牌面，${sa>sb?A:B}这条路整体更顺一些。`:'两条路的牌面差不多，真正决定的，是你更愿意承受哪一种代价。')+'最后怎么选，以你知道的实际情况为准。';break}
  case 'celtic-cross':headline=`关于${S}：整件事笼罩在「${k(0)}」的氛围里，眼前挡着的是「${k(1)}」；你真正想要的是「${k(2)}」，而照现在的走法，${t(9)>=0?`最可能走向「${k(9)}」`:`更可能先走到「${k(9)}」，还来得及调整`}。`;break;
  case 'big-dipper':headline=`关于${S}：你最放不下的是「${k(0)}」，手里已经有「${k(2)}」可以用；${t(6)>=0?`接下来先迈出「${k(6)}」这一小步`:`接下来先照顾好「${k(6)}」，再往前走`}。`;break;
  default:headline=`关于${S}：${drawn.map(d=>`「${kw(d)[0]}」`).join('、')}。`}
 if(info.kind==='choice'&&spread.id!=='two-paths')info.notices.push('你在两个选择之间犹豫。下次可以试试「二选一」牌阵，它会把两条路的好处和代价分开摆。');

 const flow:string[]=[];
 // 同一张大牌「定下底色」只说一次
 const toned=new Set<string>();
 for(const [a,b] of PAIRS[spread.id]??[])if(drawn[a]&&drawn[b]){const x=drawn[a],y=drawn[b],mixed=(x.card.arcana==='major')!==(y.card.arcana==='major'),major=x.card.arcana==='major'?x:y;
  if(mixed&&toned.has(major.card.id))continue;const r=relation(x,y);if(!r)continue;if(mixed)toned.add(major.card.id);flow.push(`「${x.position.title}」和「${y.position.title}」：${r}`)}
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
 // 晚上想想：用这次最关键那张牌自己的晚间问题（每张牌都不一样），前面点一句这次问的事
 const key=drawn[order[0]]??drawn.at(-1),eq=key?.card.evening_question??'今天哪件事，和你原本以为的不太一样？';
 const reflection=info.subject!=='今天'?`${pick(drawn,[`带着${S}想一想：`,`回到${S}这件事：`,`关于${S}，睡前问问自己：`])}${eq}`:eq;
 return {...info,answer:answer(info,spread,drawn),headline,cards,flow,actions,reflection}}
