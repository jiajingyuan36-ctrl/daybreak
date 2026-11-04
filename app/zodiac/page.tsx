import type {Metadata} from 'next';
import {pageMeta} from '../../src/meta';
import {ZODIAC,ELEMENT_NOTE,MODE_NOTE} from '../../src/zodiac';
import {PLANETS,ASTRO_SOURCE_URL} from '../../src/astro';
import {cardById} from '../../src/cards';
import {cardImageUrl} from '../../src/art';
import {ZodiacToday} from '../../src/components/zodiac-today';
export const metadata:Metadata=pageMeta('/zodiac/','十二星座与塔罗','十二星座的元素、性质、守护星，以及每个星座在韦特塔罗里对应的大牌和三张小牌。依托勒密《四书》与金色黎明会《Book T》。');
function Thumb({id,role,note}:{id:string;role:string;note?:string}){const c=cardById(id);return <figure className="z-card"><img src={cardImageUrl(id,true)} alt={c.nameZh} width={80} height={137} loading="lazy"/><figcaption><span className="z-role">{role}</span><strong>{c.nameZh}</strong>{note&&<span className="z-note">{note}</span>}</figcaption></figure>}
export default function Zodiac(){return <main className="page-shell legal-page zodiac-page"><h1>十二星座与塔罗</h1><p className="legal-date">元素 · 性质 · 守护星 · 对应的牌</p>
<p>韦特塔罗的作者 Waite 和画师 Pamela Colman Smith 都属于金色黎明会。这个组织给每个星座都配了塔罗牌：一张大阿卡纳代表星座本身，守护星也有自己的大牌；星座的 30 度再分成三段（每段 10 度，叫一个「旬」），各对应一张小牌。</p>
<ZodiacToday/>
<a className="zodiac-pair-link" href="/pair/"><span>两个人的星座</span><span className="muted">填上你和 TA 的生日，看看你们怎么相处 →</span></a>
<nav className="zodiac-index" aria-label="十二星座">{ZODIAC.map(z=><a key={z.sign.id} href={`#${z.sign.id}`}>{z.sign.zh.replace('座','')}</a>)}</nav>
{ZODIAC.map(z=><section key={z.sign.id} id={z.sign.id} className="zodiac-sign">
 <h2>{z.sign.zh}<span className="z-en">{z.sign.en}</span></h2><p className="z-dates">{z.dates}</p>
 <p className="z-plain">{z.plain}</p>
 <dl className="z-facts">
  <div><dt>元素</dt><dd>{ELEMENT_NOTE[z.sign.element]}</dd></div>
  <div><dt>性质</dt><dd>{MODE_NOTE[z.sign.mode]}。托勒密称为{z.modeNote}</dd></div>
  <div><dt>守护星</dt><dd>{z.sign.ruler}（{PLANETS[z.sign.ruler].theme}）</dd></div>
  {z.exalted&&<div><dt>入旺</dt><dd>{z.exalted}在这里表现最好</dd></div>}
  <div><dt>阴阳</dt><dd>{z.polarity}</dd></div>
 </dl>
 <div className="z-cards"><Thumb id={z.major} role="代表牌"/><Thumb id={z.rulerCard} role="守护星牌" note={z.sign.ruler}/>{z.decans.map((d,k)=><Thumb key={d.id} id={d.id} role={`第${'一二三'[k]}旬 ${d.degrees}`} note={`${d.label}　${d.title}`}/>)}</div>
</section>)}
<section className="zodiac-sources"><h2>依据</h2>
<p>星座的元素、性质（二分二至、坚固、双体）、守护星和入旺：托勒密《四书》第一卷，<a href={ASTRO_SOURCE_URL} target="_blank" rel="noreferrer">古腾堡计划公有领域译本</a>。</p>
<p>星座和行星对应的塔罗牌、每个旬的小牌和称号（如 Lord of Dominion）：金色黎明会《Book T》（S. L. MacGregor Mathers 编，约 1888 年；收录于 Israel Regardie《The Golden Dawn》）。原始体系只用七颗古典行星。</p>
<p>日期是大致范围，每年可能差一天。你自己的太阳星座，网站按出生当天太阳的实际位置计算。白话描述按元素、性质和守护星概括，用来认识自己，不是预测。</p></section>
</main>}
