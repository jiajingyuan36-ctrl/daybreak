import type {MetadataRoute} from 'next';
import {SITE_URL} from '../src/site';
import {cards} from '../src/cards';
// 构建时生成 sitemap.xml；网址跟着 src/site.ts 的 SITE_URL 走，换域名不用再改这里。
export const dynamic='force-static';
const pages:[string,MetadataRoute.Sitemap[number]['changeFrequency'],number][]=[
 ['/','daily',1],['/ritual/','daily',.9],['/zodiac/','monthly',.8],['/pair/','monthly',.8],['/encyclopedia/','monthly',.8],['/consult/','monthly',.7],
 ['/about/','monthly',.5],['/deep/','monthly',.4],['/feedback/','monthly',.4],['/privacy/','yearly',.2],['/terms/','yearly',.2],
];
export default function sitemap():MetadataRoute.Sitemap{
 return [...pages.map(([p,changeFrequency,priority])=>({url:SITE_URL+p,changeFrequency,priority})),...cards.map(c=>({url:`${SITE_URL}/card/${c.id}/`,changeFrequency:'yearly' as const,priority:.6}))];
}
