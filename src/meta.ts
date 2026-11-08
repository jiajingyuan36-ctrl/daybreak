import type {Metadata} from 'next';
import {BRAND_NAME,BRAND_TITLE,BRAND_PROMISE,SITE_DESCRIPTION,SITE_SHARE_IMAGE} from './site.ts';
// 每个页面各自的标题、描述和链接预览。
// 根布局里的 openGraph 不会随子页面的 title 变化：以前转发星座页、抽牌页时，预览一律显示首页标题、链接也指回首页。
// 每页保留自己的分享标题和链接，共用品牌封面。
const OG_IMAGE={url:SITE_SHARE_IMAGE,width:1200,height:630,alt:`${BRAND_TITLE}。${BRAND_PROMISE}`};
/** path 写成以 / 结尾的站内路径，如 '/zodiac/'；title 不带品牌名（模板会自动加“ · 晨启塔罗”）。 */
export function pageMeta(path:string,title:string|null,description:string=SITE_DESCRIPTION):Metadata{
 const full=title?`${title} · ${BRAND_NAME}`:`${BRAND_TITLE}｜${BRAND_PROMISE}`;
 return {
  title:title??{absolute:`${BRAND_TITLE}｜每日塔罗抽牌`},
  description,
  alternates:{canonical:path},
  openGraph:{type:'website',url:path,siteName:BRAND_TITLE,title:full,description,locale:'zh_CN',images:[OG_IMAGE]},
  twitter:{card:'summary_large_image',title:full,description,images:[OG_IMAGE.url]},
 };
}
