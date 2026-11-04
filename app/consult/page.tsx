import type {Metadata} from 'next';
import {pageMeta} from '../../src/meta';
import {TarotWorkbench} from '../../src/components/tarot/tarot-workbench';
export const metadata:Metadata=pageMeta('/consult/','牌阵','五种塔罗牌阵：单张、三张、关系、选择与凯尔特十字，逐张用大白话解读，最后落到你能做的事。');
export default function Page(){return <TarotWorkbench/>}
