import type {Metadata} from 'next';
import {pageMeta} from '../src/meta';
import {preload} from 'react-dom';
import serifFont from '../legacy-static/fonts/serif-sc.json';
import {AlmanacDashboard} from '../src/components/almanac-dashboard';
export const metadata:Metadata=pageMeta('/',null);
// 日历页的大字关键词用到 extra 字体里的字；以前要等页面画出来才开始下载，大字会晚一秒才换成衬线体。首页直接预加载。
export default function Home(){preload(serifFont.extra,{as:'font',type:'font/woff2',crossOrigin:'anonymous'});return <AlmanacDashboard/>}
