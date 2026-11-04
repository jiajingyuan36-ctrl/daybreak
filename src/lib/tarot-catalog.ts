import rows from '../data/tarot_cards_78.json' with {type:'json'};import type {TarotCard,TarotSpread,SpreadPosition,Topic} from '../types/tarot.ts';import {DIPPER_SPREAD} from '../dipper-copy.ts';
export const tarotCards:readonly TarotCard[]=rows as TarotCard[];
type Pos=readonly [title:string,meaning:string,source?:{en:string;zh:string}];
function spread(id:string,name:string,en:string,description:string,titles:readonly Pos[],topics:Topic[],extra:Partial<TarotSpread>={}):TarotSpread{return {id,name_zh:name,name_en:en,description,difficulty:titles.length>=5?'intermediate':'beginner',recommended_topics:topics,positions:titles.map(([title,meaning,source],index):SpreadPosition=>({index,title,meaning,coords:{x:index%3,y:Math.floor(index/3)},...(source?{source}:{})})),...extra}}
// 凯尔特十字的位置含义逐字依据 A. E. Waite《The Pictorial Key to the Tarot》（1911）Part III §7 “An Ancient Celtic Method of Divination”。
// en 为原文摘录（公有领域），zh 为直译；meaning 是给新手看的白话版。Waite 原法先选一张“指示牌”代表求问者，现代多数读者省略，本站也省略。
export const WAITE_CELTIC_URL='https://en.wikisource.org/wiki/The_Pictorial_Key_to_the_Tarot/Part_3';
const celtic:readonly Pos[]=[
['笼罩着你的','这件事整体的氛围，别的一切都在它里面发生。',{en:'This card gives the influence which is affecting the person or matter of inquiry generally, the atmosphere of it in which the other currents work.',zh:'这张牌给出大体上正在影响求问者或这件事的力量，也就是其他各股力量在其中运作的氛围。'}],
['横在面前的','阻碍是什么性质的。',{en:'It shews the nature of the obstacles in the matter.',zh:'它显示这件事中阻碍的性质。'}],
['头顶上的','你想要的目标；也是眼下条件里能做到的最好结果，只是还没实现。',{en:'It represents (a) the Querent\'s aim or ideal in the matter; (b) the best that can be achieved under the circumstances, but that which has not yet been made actual.',zh:'它代表：（一）求问者在这件事上的目标或理想；（二）在现有情况下能达到的最好结果，但尚未成为现实。'}],
['脚下的','这件事的根基：已经发生、已经属于你的部分。',{en:'It shews the foundation or basis of the matter, that which has already passed into actuality and which the Significator has made his own.',zh:'它显示这件事的根基或基础，即已经成为现实、并已为求问者所拥有的部分。'}],
['身后的','刚刚过去，或正在慢慢过去的影响。',{en:'It gives the influence that is just passed, or is now passing away.',zh:'它给出刚刚过去、或正在过去的影响。'}],
['前方的','正要开始起作用、近期会发挥影响的力量。',{en:'It shews the influence that is coming into action and will operate in the near future.',zh:'它显示正要开始起作用、并将在近期发挥作用的影响。'}],
['你自己','你在这件事里的位置和态度。',{en:'…signifies himself—that is, the Significator—whether person or thing—and shews its position or attitude in the circumstances.',zh:'……代表求问者本人（无论是人还是事），显示其在此情境中的位置或态度。'}],
['你的环境','身边的环境，以及会影响这件事的因素，比如你的处境、身边朋友的影响。',{en:'The Eighth Card signifies his house, that is, his environment and the tendencies at work therein which have an effect on the matter—for instance, his position in life, the influence of immediate friends, and so forth.',zh:'第八张牌代表他的“居所”，即他的环境以及其中对这件事有影响的倾向——例如他的生活处境、身边朋友的影响等等。'}],
['希望或担心','你对这件事的期待，或者害怕的东西。',{en:'The Ninth Card gives his hopes or fears in the matter.',zh:'第九张牌给出他在这件事上的希望或恐惧。'}],
['会走向哪里','前面这些影响加在一起，最可能促成的结果。',{en:'The Tenth is what will come, the final result, the culmination which is brought about by the influences shewn by the other cards that have been turned up in the divination.',zh:'第十张是将会到来的，即最终结果，是占卜中翻开的其他牌所显示的各种影响共同促成的结局。'}]];
export const tarotSpreads:readonly TarotSpread[]=[
spread('single-daily','一张牌','One Card','每天，或者一个很小的问题。',[['今天的提醒','这张牌说的，和今天哪件具体的事对得上？']],['daily','general']),
spread('three-card-state','三张牌 · 现状、阻碍、建议','Situation / Obstacle / Advice','看清现在卡在哪里，下一步怎么走。',[['现状','你现在大概处在什么状态，先拿能确认的事实对照一下。'],['阻碍','可能卡住你的地方：被忽略的、用力过头的，或者还没准备好的。'],['建议','变成一个今天就能试、做错了也能收回来的小动作。']],['career','general','daily'],{hint:'最常用'}),
spread('three-card-time','三张牌 · 过去、现在、未来','Past / Present / Future','看看这件事从哪里来、现在在哪、照这样会往哪去。',[['过去','已经发生过的事里，有什么到现在还在影响你。'],['现在','眼下的状态，和你还能自己拿主意的部分。'],['未来','照现在的做法走下去，可能的方向。它是提醒，不是定局。']],['love','general']),
spread('two-paths','二选一','Two Paths','两条路各自的好处和代价，最后由你来选。',[['共同处境','不管选哪条，你都要面对的情况。'],['A 的好处','选 A 能满足你什么需要。'],['A 的代价','选 A 要付出什么，还有哪些没弄清楚。'],['B 的好处','选 B 能满足你什么需要。'],['B 的代价','选 B 要付出什么，还有哪些没弄清楚。']],['decision']),
spread('celtic-cross','凯尔特十字','Celtic Cross','十张牌，把一件复杂的事完整地理一遍。',celtic,['general'],{hint:'依据 Waite 1911 原著',sourceUrl:WAITE_CELTIC_URL,sourceNote:'位置含义依据 A. E. Waite《The Pictorial Key to the Tarot》（1911）第三部分 §7。原法先选一张“指示牌”代表求问者，现代多数读者省略，本站也省略。'}),
// 北斗七星牌阵：位置用星名，含义为本站设计（文案见 src/dipper-copy.ts）
spread('big-dipper',DIPPER_SPREAD.name,DIPPER_SPREAD.nameEn,DIPPER_SPREAD.description,DIPPER_SPREAD.positions,['general','decision'],{hint:DIPPER_SPREAD.hint,sourceNote:DIPPER_SPREAD.note}),
// 已下线，只为旧记录还能打开而保留。
spread('four-elements','四元素','Four Elements','从做事、心情、想法、资源四个角度盘点。',[['行动','从做事和往前推进的角度看这张牌。'],['感受','从心情、关系和分寸的角度看这张牌。'],['思考','从判断、沟通和想法的角度看这张牌。'],['资源','从时间、钱和身体状态的角度看这张牌。']],['wealth'],{hidden:true})];
export const visibleSpreads=tarotSpreads.filter(s=>!s.hidden);
export function recommendSpread(topic:Topic){return visibleSpreads.find(s=>s.recommended_topics.includes(topic))??visibleSpreads[1]}
export function findSpread(id:string){const s=tarotSpreads.find(s=>s.id===id);if(!s)throw new Error('未知牌阵');return s}
