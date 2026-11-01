import type {Metadata} from 'next';
import {ContactCard} from '../../src/components/deep-reading';
export const metadata:Metadata={title:'提建议 · DAYBREAK 晨启'};
export default function Feedback(){return <main className="page-shell legal-page"><h1>提建议</h1><p className="legal-date">这个网站会照着大家的意见慢慢改</p>
<section><h2>想说什么都可以</h2><p>哪里看不懂、哪里不好用、哪张牌的解读说得不对，或者你希望它多点什么。一句吐槽也行，一个想法也行。</p><p>上一版的彩色牌面和「对牌不满意可以换三次」，都是从大家的建议里来的。好的想法会直接做进下一版。</p></section>
<section><h2>怎么找到我</h2><ContactCard remark="建议" extra="不用担心说得不好听，直接说就是帮我最大的忙。"/></section></main>}
