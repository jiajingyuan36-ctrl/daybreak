'use client';
// 「添加到桌面」页（/install/）：认出你用的是什么设备，只把那一种的步骤放在最前面；
// 安卓 Chrome 和电脑上的 Chrome / Edge 浏览器给了安装事件时，直接一个按钮装好。已经从桌面打开的，告诉他已经装好了。
import {useEffect,useState} from 'react';
import {track} from '../track';
import {triggerHaptic} from '../tactile';
import {cardBack} from '../card-back';

type Prompt=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}>};
type Kind='installed'|'wechat'|'ios'|'android'|'desktop';
const getPrompt=()=>(window as Window&{__bip?:Prompt}).__bip;
function detect():Kind{
 const ua=navigator.userAgent;
 if(matchMedia('(display-mode: standalone)').matches||(navigator as Navigator&{standalone?:boolean}).standalone===true)return 'installed';
 if(/MicroMessenger|QQ\//i.test(ua))return 'wechat';
 if(/iphone|ipad|ipod/i.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1))return 'ios';
 if(/android/i.test(ua))return 'android';
 return 'desktop'}

const STEPS:Record<Exclude<Kind,'installed'>,{title:string;steps:string[];note?:string}>={
 ios:{title:'iPhone / iPad',steps:['用 Safari 打开这个网站','点屏幕底部中间的「分享」按钮（一个方框，顶上朝上的那个图标）','往下滑，点「添加到主屏幕」','右上角点「添加」，桌面上就多了晨启的图标'],note:'iOS 16.4 以后，在 iPhone 上的 Chrome 里也能这样添加：点地址栏右边的「分享」。'},
 android:{title:'安卓手机',steps:['用手机自带的浏览器或 Chrome 打开这个网站','点右上角或右下角的「⋮」或「≡」菜单','选「添加到主屏幕」「添加到桌面」或「安装应用」','确认后，桌面上就多了晨启的图标'],note:'华为、小米、vivo、OPPO 的浏览器叫法略有不同，都在菜单里。'},
 wechat:{title:'在微信里打开的',steps:['点右上角的「···」','选「在浏览器打开」（iPhone 上选「在 Safari 中打开」）','在浏览器里，按下面你的手机对应的步骤添加'],note:'微信里的网页没法直接放到桌面，要先换到浏览器里。'},
 desktop:{title:'电脑',steps:['用 Chrome 或 Edge 打开这个网站','点地址栏右边的「安装」小图标（一个电脑屏幕的样子）','点「安装」，晨启会像一个软件一样出现在开始菜单或 Dock 里'],note:'Mac 上的 Safari：在菜单栏「文件」里，选把网站加到 Dock 的那一项。'},
};
const ORDER:Exclude<Kind,'installed'>[]=['ios','android','wechat','desktop'];

export function InstallGuide(){
 const [kind,setKind]=useState<Kind|null>(null),[canPrompt,setCanPrompt]=useState(false),[done,setDone]=useState(false);
 useEffect(()=>{setKind(detect());setCanPrompt(!!getPrompt());track('install-page',{from:new URLSearchParams(location.search).get('from')||''});
  const ready=(e:Event)=>{e.preventDefault();(window as Window&{__bip?:Event}).__bip=e;setCanPrompt(true)};
  const installed=()=>{setDone(true);track('install-done')};
  addEventListener('beforeinstallprompt',ready);addEventListener('appinstalled',installed);
  return()=>{removeEventListener('beforeinstallprompt',ready);removeEventListener('appinstalled',installed)}},[]);
 async function install(){const p=getPrompt();if(!p)return;triggerHaptic('medium');track('install-click');await p.prompt();const r=await p.userChoice;if(r.outcome==='accepted'){setDone(true);try{localStorage.setItem('daybreak:install-hint','installed')}catch{}}}
 const main=kind&&kind!=='installed'?kind:null;
 return <>
  <header className="ins-head">
   <div className="ins-icon" aria-hidden="true"><img src="/icon-512.png" alt="" width={96} height={96}/></div>
   <p className="quiz-eyebrow">ADD TO HOME SCREEN</p>
   <h1>把晨启放到桌面</h1>
   <p className="ins-lead">不用下载安装包，也不占什么空间。添加以后，桌面上有一个晨启的图标，像 App 一样一点就开。</p>
  </header>
  {kind==='installed'||done?<section className="ins-done"><span className="engr-drop" aria-hidden="true"/><h2>已经在你的桌面上了</h2><p>以后从桌面的晨启图标打开就好。</p><p><a className="quiz-primary" href="/ritual/?from=install">抽今天的牌</a></p></section>:<>
   {canPrompt&&<section className="ins-one"><button type="button" className="quiz-primary" onClick={install}>一键添加到桌面</button><p className="ins-hint">你的浏览器支持直接安装，点上面的按钮就好。</p></section>}
   {main&&<Steps k={main} primary/>}
   <ul className="ins-why">
   <li><b>一点就开</b><span>不用再找网址，每天早上点图标就到今天的牌。</span></li>
   <li><b>全屏</b><span>没有浏览器的地址栏和工具栏，只有牌和解读。</span></li>
   <li><b>记录更稳</b><span>iPhone 会清掉很久没打开的网站数据，放到桌面上的不会。</span></li>
  </ul>
   <details className="ins-more" open={!main}>
    <summary>{main?'其他设备怎么添加':'各种设备怎么添加'}</summary>
    {ORDER.filter(k=>k!==main).map(k=><Steps key={k} k={k}/>)}
   </details>
  </>}
  <div className="ins-back" aria-hidden="true" dangerouslySetInnerHTML={{__html:cardBack()}}/>
 </>;
}
function Steps({k,primary=false}:{k:Exclude<Kind,'installed'>;primary?:boolean}){const s=STEPS[k];
 return <section className={`ins-steps${primary?' is-primary':''}`}>
  <h2>{primary&&<small>你的设备</small>}{s.title}</h2>
  <ol>{s.steps.map((t,i)=><li key={i}><span className="ins-no" aria-hidden="true">{['I','II','III','IV'][i]}</span><span>{t}</span></li>)}</ol>
  {s.note&&<p className="ins-note">{s.note}</p>}
 </section>}
