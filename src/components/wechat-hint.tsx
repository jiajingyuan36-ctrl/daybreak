'use client';

import {useEffect,useState} from 'react';

const KEY='daybreak:wechat-hint-dismissed-at';
const WEEK=7*24*60*60*1000;

export function WeChatHint(){
 const [visible,setVisible]=useState(false);

 useEffect(()=>{
  if(!/MicroMessenger/i.test(navigator.userAgent))return;
  try{
   const dismissedAt=Number(localStorage.getItem(KEY));
   const elapsed=Date.now()-dismissedAt;
   if(Number.isFinite(dismissedAt)&&dismissedAt>0&&elapsed>=0&&elapsed<WEEK)return;
  }catch{}
  setVisible(true);
 },[]);

 function dismiss(){
  try{localStorage.setItem(KEY,String(Date.now()))}catch{}
  setVisible(false);
 }

 if(!visible)return null;
 return <aside className="wechat-hint" aria-label="微信浏览器提示">
  <svg className="wechat-hint-arrow" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M5 35C23 35 32 24 32 7M21 16 32 5 38 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
  <div className="wechat-hint-content">
   <p>微信里部分功能受限，点右上角 <span aria-label="更多">···</span> 选择「在浏览器打开」</p>
   <button type="button" className="wechat-hint-close" aria-label="关闭提示" onClick={dismiss}>×</button>
  </div>
 </aside>;
}
