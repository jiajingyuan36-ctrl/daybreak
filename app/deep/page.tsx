import type {Metadata} from 'next';
import {pageMeta} from '../../src/meta';
import {DeepContact} from '../../src/components/deep-reading';
import {DEEP_READING} from '../../src/site';
export const metadata:Metadata=pageMeta('/deep/','深度解读');
// 价目、流程、退款都读 src/site.ts 的 DEEP_READING；改这里的文字时，使用条款的「付费服务」一节要一起看。
const D=DEEP_READING;
export default function Deep(){return <main className="page-shell legal-page deep-page"><h1>深度解读</h1><p className="legal-date">付费 · 一对一 · {D.format}</p>
<section><h2>是什么</h2><p>网站上的抽牌和牌阵是自助的。深度解读由我和你一对一进行：先听你说清楚问题和处境，再用合适的牌阵逐张解读，把几张牌连起来讲，最后落到你能做的具体事情上。全程用微信文字，你可以随时回看。</p></section>
<section><h2>适合什么问题</h2><p>一件你反复在想、自己理不清的事。比如关系里卡住的地方、工作或学业的选择、一段时间的整体方向。</p></section>
<section><h2>价目</h2><table className="deep-tiers"><thead><tr><th scope="col">牌阵</th><th scope="col">适合</th><th scope="col">价格</th></tr></thead><tbody>{D.tiers.map(t=><tr key={t.name}><th scope="row">{t.name}<small>{t.cards} 张</small></th><td>{t.fit}</td><td>{t.price||'开始前说明'}</td></tr>)}</tbody></table><p className="deep-tier-note">用哪个牌阵，我们聊过你的问题后一起定；开始前会确认价格，你同意了再付款。付款方式：{D.payment}。</p></section>
<section><h2>怎么进行</h2><ol><li>加我微信，备注「解读」，简单说说你想问什么。</li><li>一起确定用哪个牌阵，确认价格。</li><li>{D.payment}付款。</li><li>我抽牌并用文字逐张解读，{D.delivery}。</li><li>{D.followUp}。</li></ol></section>
<section><h2>退款</h2><ul>{D.refund.map(r=><li key={r}>{r}</li>)}</ul></section>
<section><h2>不做什么</h2><ul><li>不预测确定的结果，也不保证某件事会发生。</li><li>不替别人下结论，比如“他心里怎么想”“有没有第三者”。我们只谈你自己能做的部分。</li><li>不做改运、转运、化解，也不卖任何开运物品。</li><li>不替代医疗、心理、法律或投资方面的专业意见。这类问题请找相应的专业人士。</li><li>未满 18 岁暂不提供付费解读。</li></ul><p>塔罗在这里是帮你整理想法、换个角度看事情的工具。</p></section>
<section><h2>你说的事</h2><p>你在微信里告诉我的内容，只用于这次解读，不会截图外传，也不会拿去做宣传。</p></section>
<section><h2>联系方式</h2><DeepContact/></section></main>}
