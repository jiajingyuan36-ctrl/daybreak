'use client';
import {useEffect,useState} from 'react';
import {sunSign,moonSign,birthSign,type Sign} from '../astro';
// 星座页顶部：此刻太阳、月亮所在星座，以及填过生日的人自己的太阳星座。只在浏览器里算，生日不离开设备。
function storedBirth(){try{const g=JSON.parse(localStorage.getItem('daybreak:gravity:v1')||'{}');if(g.birth)return String(g.birth);const d=JSON.parse(localStorage.getItem('daybreak:v1')||'null');return d?.preferences?.birthDate||''}catch{return ''}}
export function ZodiacToday(){const [sky,setSky]=useState<{sun:Sign;moon:Sign;mine:Sign|null}|null>(null);
 useEffect(()=>{const now=new Date(),b=storedBirth();setSky({sun:sunSign(now),moon:moonSign(now),mine:b?birthSign(b):null})},[]);
 if(!sky)return <p className="zodiac-today">&nbsp;</p>;
 return <p className="zodiac-today">此刻太阳在<a href={`#${sky.sun.id}`}>{sky.sun.zh}</a>，月亮在<a href={`#${sky.moon.id}`}>{sky.moon.zh}</a>{sky.mine?<>；你的太阳星座是<a href={`#${sky.mine.id}`}>{sky.mine.zh}</a></>:<>。在<a href="/settings/">设置</a>里填一次生日，就能看到你自己的星座</>}。</p>}
