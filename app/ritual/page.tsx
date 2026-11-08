import type {Metadata} from 'next';
import {pageMeta} from '../../src/meta';
import {LegacyScreen} from '../../src/components/legacy-screen';
import {BRAND_PROMISE} from '../../src/site';
export const metadata:Metadata=pageMeta('/ritual/','今日塔罗',`${BRAND_PROMISE} 1909 年原版韦特牌，白话解读。免费，无需注册。`);
export default function Page(){return <LegacyScreen/>}
