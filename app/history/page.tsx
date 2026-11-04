import type {Metadata} from 'next';
import {pageMeta} from '../../src/meta';
import {LegacyScreen} from '../../src/components/legacy-screen';
export const metadata:Metadata=pageMeta('/history/','回望','翻看你抽过的每一张牌和晚间回顾。记录只存在你自己的浏览器里。');
export default function Page(){return <LegacyScreen/>}
