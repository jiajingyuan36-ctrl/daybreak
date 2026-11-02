import type {Metadata} from 'next';
import {TarotWorkbench} from '../../src/components/tarot/tarot-workbench';
export const metadata:Metadata={title:'78 张塔罗牌图鉴'};
export default function Page(){return <TarotWorkbench encyclopedia/>}
