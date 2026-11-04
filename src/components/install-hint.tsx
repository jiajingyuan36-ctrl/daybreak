'use client';
import {useEffect,useState} from 'react';
import {recordVisit} from '../lib/visit';
// “添加到主屏幕”提示：只在用户第二天回来、或已经抽过两次牌之后出现；关掉后 14 天内不再打扰。
// 放到主屏幕后打开更快，iPhone 上也不容易因为 7 天没打开而被 Safari 清掉记录。
const KEY='daybreak:install-hint';
type Prompt=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}>};
type Platform='ios'|'prompt'|'other';
const localDay=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
function standalone(){return matchMedia('(display-mode: standalone)').matches||(navigator as Navigator&{standalone?:boolean}).standalone===true}
function engaged(visitDays:number){try{const d=JSON.parse(localStorage.getItem('daybreak:v1')||'null');return visitDays>=2||Object.keys(d?.days??{}).length>=2}catch{return visitDays>=2}}
export function InstallHint(){const [platform,setPlatform]=useState<Platform|null>(null),[leaving,setLeaving]=useState(false);
 useEffect(()=>{const visit=recordVisit(location.search,localDay());if(standalone())return;try{const s=localStorage.getItem(KEY);if(s==='installed'||(s&&Date.now()-Number(s)<14*864e5))return}catch{return}if(!engaged(visit?.days.length??0))return;
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent)&&!/crios|fxios|edgios/i.test(navigator.userAgent);const t=setTimeout(()=>setPlatform(ios?'ios':(window as Window&{__bip?:Prompt}).__bip?'prompt':'other'),2500);return()=>clearTimeout(t)},[]);
 if(!platform)return null;
 function close(remember:string){try{localStorage.setItem(KEY,remember)}catch{}setLeaving(true);setTimeout(()=>setPlatform(null),matchMedia('(prefers-reduced-motion: reduce)').matches?0:380)}
 async function install(){const p=(window as Window&{__bip?:Prompt}).__bip;if(!p)return;await p.prompt();const r=await p.userChoice;close(r.outcome==='accepted'?'installed':String(Date.now()))}
 return <aside className={`install-hint${leaving?' leaving':''}`} role="dialog" aria-label="添加到主屏幕"><p><strong>把晨启放到手机桌面</strong>{platform==='ios'?'点 Safari 底部的「分享」按钮，再选「添加到主屏幕」。每天一点就开，记录也更不容易丢。':platform==='prompt'?'每天一点就开，打开更快，记录也更不容易丢。':'在浏览器菜单里选「添加到主屏幕」或「安装」，每天一点就开。'}</p><div>{platform==='prompt'&&<button type="button" className="install-go" onClick={install}>添加</button>}<button type="button" className="install-later" onClick={()=>close(String(Date.now()))}>{platform==='prompt'?'以后再说':'知道了'}</button></div></aside>}
