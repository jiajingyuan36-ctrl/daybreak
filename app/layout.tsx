import {Cinzel,Cormorant_Garamond} from 'next/font/google';
import {preload} from 'react-dom';
import serifFont from '../legacy-static/fonts/serif-sc.json';
import './globals.css';
import '../legacy-static/epic.css';
import '../legacy-static/fonts/serif-sc.css';
import {SiteChrome} from '../src/components/site-chrome';
import type {Metadata} from 'next';
import {SITE_URL,SITE_DESCRIPTION} from '../src/site';
import {InstallHint} from '../src/components/install-hint';
const cinzel=Cinzel({subsets:['latin'],weight:['400','500'],variable:'--font-cinzel',display:'swap'});
const prose=Cormorant_Garamond({subsets:['latin'],weight:['400','500','600'],variable:'--font-prose',display:'swap'});
// 中文衬线字体用自己抽字的两个文件（见 scripts/font-css.mjs）：全站共用的 core 先预加载，日历才用到的 extra 按需下载。
// 以前 Google 字体切成上百个分片，每个页面要下 11–22 个；现在一个文件缓存一次，所有页面通用。
// 链接预览：分享到小红书、Instagram、Facebook、微信、X 时显示的标题、描述和图片。
export const metadata:Metadata={metadataBase:new URL(SITE_URL),title:{default:'晨启塔罗 · 每天早上抽一张塔罗',template:'%s · 晨启塔罗'},description:SITE_DESCRIPTION,icons:{icon:'/icon.svg',apple:'/icon-180.png'},manifest:'/manifest.webmanifest',openGraph:{type:'website',url:'/',siteName:'晨启塔罗',title:'晨启塔罗 · 每天早上抽一张塔罗',description:SITE_DESCRIPTION,locale:'zh_CN',images:[{url:'/og.png',width:1200,height:630,alt:'晨启塔罗：每天早上抽一张塔罗'}]},twitter:{card:'summary_large_image',title:'晨启塔罗 · 每天早上抽一张塔罗',description:SITE_DESCRIPTION,images:['/og.png']},appleWebApp:{capable:true,title:'晨启塔罗',statusBarStyle:'black-translucent'}};
// 鼠标停在站内链接上（手机为按下）时预渲染该页，点击后几乎立即显示；不支持的浏览器会忽略。
// 安卓 Chrome 很早就会发出“可安装”事件，先存起来，等提示条出现时再用。
const captureInstall="addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__bip=e})";
const speculation=JSON.stringify({prerender:[{where:{and:[{href_matches:'/*'},{not:{href_matches:'/*.*'}}]},eagerness:'moderate'}]});
export default function RootLayout({children}:{children:React.ReactNode}){preload(serifFont.core,{as:'font',type:'font/woff2',crossOrigin:'anonymous'});return <html lang="zh-CN"><body className={`${cinzel.variable} ${prose.variable}`}><script type="speculationrules" dangerouslySetInnerHTML={{__html:speculation}}/><script dangerouslySetInnerHTML={{__html:captureInstall}}/><SiteChrome/>{children}<footer className="shared-footer"><span>晨启塔罗 DAYBREAK</span><nav aria-label="说明"><a href="/feedback/">提建议</a><a href="/deep/">深度解读</a><a href="/privacy/">隐私说明</a><a href="/terms/">使用条款</a></nav></footer><InstallHint/></body></html>}
