import type {Metadata} from 'next';
import {pageMeta} from '../../src/meta';
import {BookmarksPage} from '../../src/components/bookmarks-page';
// 个人页面：内容只在访客自己的浏览器里，不让搜索引擎收录，也不进 sitemap。
export const metadata:Metadata={...pageMeta('/bookmarks/','书签','你收起来的塔罗牌和某一天的解读，只存在这台设备上。'),robots:{index:false,follow:true}};
export default function Bookmarks(){return <main className="page-shell bookmarks-page"><BookmarksPage/></main>}
