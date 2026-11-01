/** 保留 v5 的 DOM 应用与浏览器记录，逐步迁移，不重写牌义与来源层。
 * 脚本以普通 module 标签放进静态 HTML，页面解析完就运行，不必等框架加载完。
 * #app、#dialog、#toast 的内容归旧版脚本管，React 只输出初始 HTML，不参与比对。 */
const loading='<main class="minimal-loading" role="status">正在读取记录</main>';
export function LegacyScreen(){return <><link rel="stylesheet" href="/style.css"/><link rel="stylesheet" href="/epic.css"/><div id="app" suppressHydrationWarning dangerouslySetInnerHTML={{__html:loading}}/><dialog id="dialog" aria-label="晨启设置与说明" suppressHydrationWarning dangerouslySetInnerHTML={{__html:''}}/><div id="toast" role="status" aria-live="polite" suppressHydrationWarning dangerouslySetInnerHTML={{__html:''}}/><script type="module" src="/js/app.js" {...{blocking:'render'}}/><noscript>请启用 JavaScript 来开启塔罗仪式。个人记录仅保存于浏览器。</noscript></>}
