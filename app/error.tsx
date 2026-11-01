'use client';
export default function PageError({reset}:{reset:()=>void}){return <main className="page-shell"><h1 className="text-4xl font-philosophy">暂时没能展开这一页。</h1><p className="mt-6 text-muted">你的浏览器记录仍然保留。可以重试，或继续查看原有的塔罗仪式。</p><button className="outline-button mt-6" onClick={reset}>重新加载</button><a className="outline-button ml-4" href="/ritual/">今日塔罗 ↗</a></main>}
