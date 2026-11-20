import type {Metadata} from 'next';
import {cardBack} from '../src/card-back';
// 404：静态导出时生成 404.html，Render 找不到页面时显示它。
export const metadata:Metadata={title:'这一页不在牌堆里',robots:{index:false,follow:true}};
export default function NotFound(){
 return <main className="page-shell nf-page">
  <div className="nf-card tarot-plate" aria-hidden="true" dangerouslySetInnerHTML={{__html:cardBack()}}/>
  <p className="quiz-eyebrow">ERROR · CDIV</p>
  <h1>这一页不在牌堆里</h1>
  <p className="nf-lead">链接可能写错了，或者这一页已经搬走。回到下面任意一处，接着往下走。</p>
  <p className="nf-links"><a className="quiz-primary" href="/">回到首页</a><a className="quiz-secondary" href="/ritual/">抽今天的牌</a><a className="quiz-secondary" href="/encyclopedia/">翻一翻图鉴</a></p>
 </main>;
}
