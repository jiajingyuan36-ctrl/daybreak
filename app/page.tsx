import type {Metadata} from 'next';
import {pageMeta} from '../src/meta';
import {AlmanacDashboard} from '../src/components/almanac-dashboard';
import {chinaDateString,generateDailyGravity} from '../src/lib/almanac-engine';
import {BRAND_NAME,BRAND_MARK,BRAND_PROMISE,SITE_URL} from '../src/site';
export const metadata:Metadata=pageMeta('/',null);
const website=JSON.stringify({
 '@context':'https://schema.org',
 '@type':'WebSite',
 name:BRAND_NAME,
 alternateName:BRAND_MARK,
 description:BRAND_PROMISE,
 url:`${SITE_URL}/`,
});
const fastDrawNavigation="addEventListener('pageswap',function(e){var url=e.activation?.entry?.url;if(e.viewTransition&&url&&new URL(url).pathname==='/ritual/')e.viewTransition.skipTransition()})";
export default function Home(){const today=chinaDateString(new Date());
// build-time date; if the visitor's day differs, hide the sheet until hydration swaps in the real day
const guard=`(function(){try{var d=new Date(Date.now()+288e5).toISOString().slice(0,10);if(d!=='${today}')document.documentElement.classList.add('home-stale')}catch(e){}})()`;
return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:website}}/><script dangerouslySetInnerHTML={{__html:`${guard};${fastDrawNavigation}`}}/><AlmanacDashboard initialReading={generateDailyGravity(today)}/></>}
