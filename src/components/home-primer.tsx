// 首页第一屏下面的塔罗入门：给第一次接触塔罗的人看，三分钟读完。
// 静态渲染（不需要 'use client'），文字直接在 HTML 里，搜索引擎也读得到。
// 「晨启的做法」一节写的是网站真实的做法，和 app/about/page.tsx 对得上；改了抽牌、牌面或存储的做法，两处一起改。
import {EditorialSection} from './tarot/editorial-section';
import {cardImageUrl} from '../art';

const SUITS:[id:string,name:string,what:string][]=[
 ['m0','大阿卡纳','22 张，人生里的大课题'],
 ['wands-1','权杖','行动、热情、想做的事'],
 ['cups-1','圣杯','感情、关系、心里的感受'],
 ['swords-1','宝剑','想法、判断、说出口的话'],
 ['pentacles-1','星币','钱、学业工作、身体'],
];

export function HomePrimer(){
 return <section className="home-primer" aria-labelledby="primer-title">
  <header className="primer-head">
   <p className="primer-eyebrow">第一次接触塔罗 · 三分钟读完</p>
   <h2 id="primer-title">塔罗不替你算命，<br/>它帮你看清今天。</h2>
   <p className="primer-lead">一副牌，78 张图。抽到哪一张，就借那张图问自己一个问题：我现在卡在哪，今天能做什么。</p>
  </header>
  <ul className="primer-suits" aria-label="一副塔罗牌的五个部分">
   {SUITS.map(([id,name,what])=><li key={id}><a href={`/card/${id}/`}><img src={cardImageUrl(id,true)} alt={`${name}的代表牌`} width={160} height={274} loading="lazy" decoding="async"/><b>{name}</b><span>{what}</span></a></li>)}
  </ul>
  <div className="primer-body">
   <EditorialSection number="I" title="78 张牌，分成两部分" heading="h3">
    <p>22 张大阿卡纳，讲人生里的大课题：开始、选择、失去、重来。56 张小阿卡纳分成四个花色，讲每天的事。权杖是行动，圣杯是感情，宝剑是想法，星币是钱和身体。</p>
   </EditorialSection>
   <EditorialSection number="II" title="正位和逆位" heading="h3">
    <p>牌正着出来是正位，倒着出来是逆位。逆位不等于坏牌，它多半说的是同一件事卡住了，或者用力过头了。所以同一张牌，正逆位要分开读。</p>
   </EditorialSection>
   <EditorialSection number="III" title="怎么读一张牌" heading="h3">
    <p>先看画面：人物在做什么，往哪里看，手里拿着什么。再对照你自己的处境。最后落到一件今天就能做的小事。晨启的每张牌都按这三步写好了：一句话看懂、今天的解析、今天可做。</p>
   </EditorialSection>
   <EditorialSection number="IV" title="晨启的做法" heading="h3">
    <ul className="primer-pro">
     <li><b>原版牌面。</b>用的是 1909 年首版韦特塔罗的扫描图，Pamela Colman Smith 原画，不是重绘。</li>
     <li><b>公平抽牌。</b>用密码学随机数洗完整的 78 张，每张牌的正位或逆位，被抽到的机会都是 1/156。洗牌、切牌、选牌是仪式，不偏向任何一张。</li>
     <li><b>牌义有出处。</b>牌面符号参考韦特 1910 年的《塔罗图解》原文，每张牌的页面都附了原文链接。白话解读是我们重新写的，去掉了原书里宿命和吓人的说法。</li>
     <li><b>不吓人，不收费改运。</b>不说「一定会」，不讲灾祸，不卖开运物品。塔罗在这里是整理想法的工具，不预测未来。</li>
     <li><b>记录只在你手机里。</b>不用注册，抽牌记录只存在你自己的浏览器里，随时可以导出或清除。</li>
    </ul>
    <p className="primer-more"><a href="/about/">完整的做法写在「关于与方法」→</a></p>
   </EditorialSection>
  </div>
  <div className="primer-actions">
   <a className="home-cta" href="/ritual/?from=primer" data-umami-event="primer-draw">抽一张今天的牌<span aria-hidden="true">→</span></a>
   <p><a href="/encyclopedia/" data-umami-event="primer-cards">看全部 78 张牌</a><span aria-hidden="true">·</span><a href="/quiz/?from=primer" data-umami-event="primer-quiz">测你是哪张牌</a></p>
  </div>
 </section>;
}
