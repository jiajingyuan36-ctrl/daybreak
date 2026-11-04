import type {Metadata} from 'next';
import {pageMeta} from '../../src/meta';
import {PairReading} from '../../src/components/pair-reading';
export const metadata:Metadata=pageMeta('/pair/','两个人的星座','输入你和 TA 的生日，看两个星座的相处方式，再抽三张塔罗牌看看你们之间。');
export default function Pair(){return <main className="page-shell legal-page pair-page"><h1>两个人的星座</h1><p className="legal-date">看看你们怎么相处</p>
<p>填上你和 TA 的生日，或者直接选星座。我们会从星座的相位、元素和守护星，讲讲你们的相处方式。</p>
<PairReading/></main>}
