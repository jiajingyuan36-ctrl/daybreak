import type {Metadata} from 'next';
import {pageMeta} from '../../src/meta';
import {LegacyScreen} from '../../src/components/legacy-screen';
export const metadata:Metadata=pageMeta('/settings/','设置');
export default function Page(){return <LegacyScreen/>}
