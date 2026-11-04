import type {Metadata} from 'next';
import {pageMeta} from '../../src/meta';
import {DeepContact} from '../../src/components/deep-reading';
import {DEEP_READING} from '../../src/site';
export const metadata:Metadata=pageMeta('/deep/','深度解读');
// 具体形式、时长和价格由经营者确定后再写进来，这里不预先承诺。
export default function Deep(){return <main className="page-shell legal-page deep-page"><h1>深度解读</h1><p className="legal-date">付费 · 一对一</p>
<section><h2>是什么</h2><p>网站上的抽牌和牌阵是自助的。深度解读由解读师和你一对一进行：先听你说清楚问题和处境，再用合适的牌阵逐张解读，把几张牌连起来讲，最后落到你能做的具体事情上。</p></section>
<section><h2>适合什么问题</h2><p>一件你反复在想、自己理不清的事。比如关系里卡住的地方、工作或学业的选择、一段时间的整体方向。</p></section>
<section><h2>怎么进行</h2><ol><li>通过下面的联系方式找到我们，简单说说你想问什么。</li><li>一起确定牌阵、形式和价格{DEEP_READING.price?`（参考价格：${DEEP_READING.price}）`:''}，开始前都会说清楚。</li><li>解读师完成解读，交给你。</li></ol></section>
<section><h2>不做什么</h2><p>塔罗解读用于自我反思，不预测确定的结果，也不替代医疗、心理、法律或投资方面的专业意见。这类问题请找相应的专业人士。</p></section>
<section><h2>联系方式</h2><DeepContact/></section></main>}
