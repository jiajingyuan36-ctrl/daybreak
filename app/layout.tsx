import {Cinzel,Cormorant_Garamond,Noto_Serif_SC} from 'next/font/google';
import './globals.css';
import '../legacy-static/epic.css';
import {SiteChrome} from '../src/components/site-chrome';
import type {Metadata} from 'next';
import {SITE_URL,SITE_DESCRIPTION} from '../src/site';
import {InstallHint} from '../src/components/install-hint';
const cinzel=Cinzel({subsets:['latin'],weight:['400','500'],variable:'--font-cinzel',display:'swap'});
const prose=Cormorant_Garamond({subsets:['latin'],weight:['400','500','600'],variable:'--font-prose',display:'swap'});
// 中文字体只加载常规粗细：每种粗细约 100 个分片，三种粗细会让首次打开多下载一倍多。
const chinese=Noto_Serif_SC({subsets:['latin'],weight:['400'],variable:'--font-chinese',display:'swap',preload:false});
// 链接预览：分享到小红书、Instagram、Facebook、微信、X 时显示的标题、描述和图片。
export const metadata:Metadata={metadataBase:new URL(SITE_URL),title:'DAYBREAK 晨启 · 每天一张塔罗',description:SITE_DESCRIPTION,icons:{icon:'/icon.svg',apple:'/icon-180.png'},manifest:'/manifest.webmanifest',openGraph:{type:'website',url:'/',siteName:'DAYBREAK 晨启',title:'DAYBREAK 晨启 · 每天一张塔罗',description:SITE_DESCRIPTION,locale:'zh_CN',images:[{url:'/og.png',width:1200,height:630,alt:'DAYBREAK 晨启：每天抽一张塔罗'}]},twitter:{card:'summary_large_image',title:'DAYBREAK 晨启 · 每天一张塔罗',description:SITE_DESCRIPTION,images:['/og.png']},appleWebApp:{capable:true,title:'晨启',statusBarStyle:'black-translucent'}};
// 鼠标停在站内链接上（手机为按下）时预渲染该页，点击后几乎立即显示；不支持的浏览器会忽略。
// 安卓 Chrome 很早就会发出“可安装”事件，先存起来，等提示条出现时再用。
const captureInstall="addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__bip=e})";
const speculation=JSON.stringify({prerender:[{where:{and:[{href_matches:'/*'},{not:{href_matches:'/*.*'}}]},eagerness:'moderate'}]});
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body className={`${cinzel.variable} ${prose.variable} ${chinese.variable}`}><script type="speculationrules" dangerouslySetInnerHTML={{__html:speculation}}/><script dangerouslySetInnerHTML={{__html:captureInstall}}/><SiteChrome/>{children}<footer className="shared-footer"><span>DAYBREAK 晨启</span><nav aria-label="说明"><a href="/feedback/">提建议</a><a href="/deep/">深度解读</a><a href="/privacy/">隐私说明</a><a href="/terms/">使用条款</a></nav></footer><InstallHint/></body></html>}
