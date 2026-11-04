import type {Metadata} from 'next';
import {pageMeta} from '../../src/meta';
import {TarotWorkbench} from '../../src/components/tarot/tarot-workbench';
export const metadata:Metadata=pageMeta('/encyclopedia/','78 张塔罗牌图鉴','78 张 1909 年原版韦特塔罗：每张牌的正逆位白话解析、牌面符号和星座对应。');
export default function Page(){return <TarotWorkbench encyclopedia/>}
