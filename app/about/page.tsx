import type {Metadata} from 'next';
import {pageMeta} from '../../src/meta';
import {ASKS_PER_DAY} from '../../src/ai-ask';
import {AI_ENABLED} from '../../src/site';
export const metadata:Metadata=pageMeta('/about/','关于与方法','晨启塔罗怎么抽牌、牌义从哪里来、AI 怎么用、你的记录存在哪里。抽牌只由密码学随机数决定，塔罗在这里不预测未来。');
// 这页写的是网站真实的做法。改了抽牌（src/random.ts）、提问（server/）、存储（src/storage.ts）的做法，要回来同步这里。
export default function About(){return <main className="page-shell legal-page about-page"><h1>关于与方法</h1><p className="legal-date">晨启塔罗是怎么做的</p>
<section><h2>晨启是什么</h2><p>每天早上抽一张 1909 年原版韦特塔罗，读一段大白话，做一件十分钟能做完的小事。塔罗在这里是帮你整理想法、换个角度看事情的工具，不预测未来。</p></section>
<section><h2>抽牌是怎么做的</h2><ul>
 <li>随机数来自浏览器自带的密码学安全随机数（<code>crypto.getRandomValues</code>），并去掉了取余带来的偏差。</li>
 <li>洗牌用 Fisher–Yates 算法，78 张牌的每一种排列，出现的机会都相等。每张牌在洗牌前各自用一半的机会决定正位还是逆位。所以任何一张牌的正位或逆位，被抽到的机会都是 1/156。</li>
 <li>按住洗牌、划开切牌、从牌扇里选一张，这几步是仪式，不会让某些牌更容易被抽到。</li>
 <li>北斗方式里，真实的星空只决定画面，不决定抽到哪一张。同一时刻、同一座城市的人，抽到的牌互不相干。</li>
 <li>对牌不满意，每天可以换三次。</li>
</ul></section>
<section><h2>牌面和牌义从哪里来</h2><ul>
 <li>牌面是 1909 年首版 Rider–Waite–Smith 塔罗（Pamela Colman Smith 绘）的扫描图，属于公有领域，来自维基共享资源。</li>
 <li>牌面符号参考 Waite 的《塔罗图解》（1910）原文，<a href="/encyclopedia/">图鉴</a>和每张牌的页面都附了原文链接。</li>
 <li>星座和元素的对应，按韦特塔罗所依据的金色黎明会《Book T》体系；星座的定义参考托勒密《四书》。</li>
 <li>白话解读是晨启原创。原书里有年代局限和宿命式的说法，我们保留牌面的图像线索，用不宿命、不诊断的现代语言重新写。</li>
 <li>你抽牌前选的心情，只决定解读先说哪一段，以及开头的一句话，不改变牌义。</li>
</ul></section>
{AI_ENABLED&&<section><h2>AI 怎么用</h2><ul>
 <li>只有你主动点「问一个问题」时才会用到 AI（DeepSeek）。它只解读你已经抽到的这一张牌，不参与抽牌。</li>
 <li>牌义以站内的文字为准。规则是写死的：不预测、不说「一定会」，不给医疗、法律、投资方面的结论，不替别人猜心思。</li>
 <li>问题如果涉及轻生或伤害自己，不会交给 AI，而是直接提醒你联系身边的人，或拨打全国心理援助热线 12356。</li>
 <li>回答不符合这些规则，就不会显示给你。我们的服务不保存你的问题和回答。每天最多问 {ASKS_PER_DAY} 次。</li>
</ul></section>}
<section><h2>日历和运势</h2><p>农历、节气和八字排盘用开源的 lunar-javascript；月相和日月位置用 Astronomy Engine 按天文公式计算。「今日运势」按传统八字的规则推算，用于娱乐和自我反思，不是对未来的判断。</p></section>
<section><h2>你的记录</h2><p>用晨启不需要注册。抽牌记录、晚间回望、生辰都只存在你自己的浏览器里，可以在「设置」里导出备份，也可以一键清除。网站不放第三方统计，也没有广告。详细见<a href="/privacy/">隐私说明</a>。</p></section>
<section><h2>不做什么</h2><ul>
 <li>不预测确定的结果，也不保证某件事会发生。</li>
 <li>不做改运、转运、化解，不卖任何开运物品。</li>
 <li>不替代医疗、心理、法律或投资方面的专业意见。</li>
</ul></section>
<section><h2>联系</h2><p>发现了问题、有想加的功能，欢迎<a href="/feedback/">提建议</a>。想就一件事聊得更透，可以看看<a href="/deep/">深度解读</a>。</p></section>
</main>}
