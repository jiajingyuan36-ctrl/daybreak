import type {Metadata} from 'next';
import {pageMeta} from '../../src/meta';
import {LegacyScreen} from '../../src/components/legacy-screen';
export const metadata:Metadata=pageMeta('/ritual/','今日塔罗','每天早上抽一张 1909 年原版韦特塔罗：按住洗牌、划开切牌、亲手选一张，用大白话说说今天的状态和一件能做的小事。免费，不用注册。');
export default function Page(){return <LegacyScreen/>}
