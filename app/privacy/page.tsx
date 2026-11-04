import type {Metadata} from 'next';
import {pageMeta} from '../../src/meta';
export const metadata:Metadata=pageMeta('/privacy/','隐私说明');
// 按网站当前的真实做法写；推出账号、云同步或付费功能时必须同步更新。
export default function Privacy(){return <main className="page-shell legal-page"><h1>隐私说明</h1><p className="legal-date">更新于 2026 年 11 月 2 日</p>
<section><h2>你的记录存在哪里</h2><p>目前使用晨启塔罗不需要注册。你的抽牌记录、晚间回顾、生辰、称呼和外观设置，都只保存在你自己设备的浏览器里，不会上传到我们的服务器，我们也看不到。</p></section>
<section><h2>为了打开更快，浏览器会缓存什么</h2><p>第一次打开后，浏览器会把网站本身的页面、牌面图片、字体和脚本缓存下来，下次打开直接读取。这些缓存只是网站的公开文件，不包含你的个人记录。</p></section>
<section><h2>托管服务商能看到什么</h2><p>网站托管在 Render，经 Cloudflare 分发。和所有网站一样，它们会记录基本的访问日志，比如 IP 地址、浏览器类型和访问时间，用于安全和故障排查。网站用到的字体在发布前已下载到本站，打开网站时不会连接 Google。</p></section>
<section><h2>通过微信联系我们时</h2><p>提建议和深度解读都在微信上进行，不经过本网站。你在微信里发来的内容，只用于回复你或完成这次解读，不会转给别人，也不会公开。</p></section>
<section><h2>怎么删除</h2><p>在「设置」页可以导出全部记录做备份，也可以一键清除。清除浏览器的网站数据，同样会删除这些记录。删除后无法恢复。</p></section>
<section><h2>以后的变化</h2><p>如果将来推出账号、多设备同步或付费功能，我们会在你使用前清楚说明会保存哪些数据、存在哪里、保存多久，并更新这份说明。在那之前，以上做法不会改变。</p></section>
<section><h2>未成年人</h2><p>本网站不面向未满 13 岁的儿童，也不会有意收集他们的信息。</p></section></main>}
