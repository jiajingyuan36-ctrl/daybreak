import type {Metadata} from 'next';
import {pageMeta} from '../src/meta';
import {preload} from 'react-dom';
import serifFont from '../legacy-static/fonts/serif-sc.json';
import {AlmanacDashboard} from '../src/components/almanac-dashboard';
import {MOON_TEXTURE} from '../src/lib/moon-render';
import {chinaDateString} from '../src/lib/almanac-engine';
import {SITE_URL} from '../src/site';
export const metadata:Metadata=pageMeta('/',null);
const website=JSON.stringify({
 '@context':'https://schema.org',
 '@type':'WebSite',
 name:'晨启塔罗',
 alternateName:'Daybreak',
 url:`${SITE_URL}/`,
});
// 日历页的大字关键词用到 extra 字体里的字；以前要等页面画出来才开始下载，大字会晚一秒才换成衬线体。首页直接预加载。
export default function Home(){preload(serifFont.extra,{as:'font',type:'font/woff2',crossOrigin:'anonymous'});preload(MOON_TEXTURE,{as:'image',crossOrigin:'anonymous',fetchPriority:'low'});const today=chinaDateString(new Date());
// build-time date; if the visitor's day differs, hide the sheet until hydration swaps in the real day
const guard=`(function(){try{var d=new Date(Date.now()+288e5).toISOString().slice(0,10);if(d!=='${today}')document.documentElement.classList.add('home-stale')}catch(e){}})()`;
return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:website}}/><script dangerouslySetInnerHTML={{__html:guard}}/><AlmanacDashboard initialDate={today}/></>}
