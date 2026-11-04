import type {Metadata} from 'next';
import {SITE_DESCRIPTION} from './site.ts';
// 每个页面各自的标题、描述和链接预览。
// 根布局里的 openGraph 不会随子页面的 title 变化：以前转发星座页、抽牌页时，预览一律显示首页标题、链接也指回首页。
// 这里给每页单独生成 og:title / og:description / og:url 和 canonical；预览图暂时共用 /og.png。
const BRAND='晨启塔罗';
const OG_IMAGE={url:'/og.png',width:1200,height:630,alt:'晨启塔罗：每天早上抽一张塔罗'};
/** path 写成以 / 结尾的站内路径，如 '/zodiac/'；title 不带品牌名（模板会自动加“ · 晨启塔罗”）。 */
export function pageMeta(path:string,title:string|null,description:string=SITE_DESCRIPTION):Metadata{
 const full=title?`${title} · ${BRAND}`:`${BRAND} · 每天早上抽一张塔罗`;
 return {
  ...(title?{title}:{}),
  description,
  alternates:{canonical:path},
  openGraph:{type:'website',url:path,siteName:BRAND,title:full,description,locale:'zh_CN',images:[OG_IMAGE]},
  twitter:{card:'summary_large_image',title:full,description,images:[OG_IMAGE.url]},
 };
}
