import type {Metadata} from 'next';
import {pageMeta} from '../../src/meta';
import {InstallGuide} from '../../src/components/install-guide';
export const metadata:Metadata=pageMeta('/install/','添加到桌面','把晨启塔罗放到手机桌面：像 App 一样一点就开，全屏显示，不用下载安装包。iPhone、安卓、微信里和电脑上的步骤。');
export default function Install(){return <main className="page-shell install-page"><InstallGuide/></main>}
