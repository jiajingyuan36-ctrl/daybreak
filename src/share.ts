import {dipperSky,DIPPER,bearingLabel,CHART_RADIUS,labelPositions} from './lib/dipper.ts';
import type {Day} from './types.ts';import {cardById} from './cards.ts';import {art,cardImageUrl} from './art.ts';import {SITE_HOST} from './site.ts';import {cachedSky} from './sky.ts';
export type ShareLayout='classic'|'space'|'night';
export function download(blob:Blob,name:string){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),10000)}
/** 分享图用的精简解析：取今日解析的第一句，太短就带上第二句。 */
export function briefReading(text:string){const parts=text.match(/[^。！？]+[。！？]?/g)??[text];const first=parts[0];return [...first].length<24&&parts[1]?first+parts[1]:first}
function lines(x:CanvasRenderingContext2D,text:string,width:number){const result:string[]=[];let line='';for(const ch of text){if(ch==='\n'||x.measureText(line+ch).width>width){result.push(line);line=ch==='\n'?'':ch}else line+=ch}if(line)result.push(line);return result}
export async function createShareImage(day:Day,tall=false,layout:ShareLayout='classic'):Promise<Blob>{
 await document.fonts.ready;
 const display=getComputedStyle(document.querySelector('h1')||document.body).fontFamily;
 const prose=getComputedStyle(document.querySelector('.reading-lead')||document.body).fontFamily;
 await Promise.allSettled([document.fonts.load(`600 40px ${display}`,'DAYBREAK 晨启'),document.fonts.load(`400 32px ${prose}`,'今日行动')]);
 const c=document.createElement('canvas');c.width=1080;c.height=tall?1920:1350;const x=c.getContext('2d');if(!x)throw Error('浏览器不支持图片导出');
 const night=layout==='night',fg=night?'#E6E2D8':'#141413',bg=night?'#0A0A0B':'#F2EFE9',gold=fg;x.fillStyle=bg;x.fillRect(0,0,c.width,c.height);x.textAlign='center';const font=(size:number,heading:boolean)=>`${heading?600:400} ${size}px ${heading?display:prose}`;const text=(s:string,y:number,size=28,width=800,heading=false)=>{x.fillStyle=fg;x.font=font(size,heading);const all=lines(x,s,width);all.forEach((line,i)=>x.fillText(line,540,y+i*size*1.65));return y+all.length*size*1.65};const measure=(s:string,size:number,width:number,heading=false)=>{x.font=font(size,heading);return lines(x,s,width).length*size*1.65};
 text('DAYBREAK · 晨启',130,34,850,true);text(day.date+' · 今日塔罗',184,22);
 const sky=cachedSky(day.date),radius=31,cx=540,cy=260;x.fillStyle=night?'#252a32':'#ccc3b3';x.beginPath();x.arc(cx,cy,radius,0,Math.PI*2);x.fill();x.save();if(sky.phase>180){x.translate(cx*2,0);x.scale(-1,1)}const rx=Math.max(.01,Math.abs(2*sky.illumination-1)*radius);x.fillStyle=gold;x.beginPath();x.moveTo(cx,cy-radius);x.ellipse(cx,cy,radius,radius,0,-Math.PI/2,Math.PI/2);x.ellipse(cx,cy,rx,radius,0,Math.PI/2,3*Math.PI/2,sky.illumination<.5);x.closePath();x.fill();x.restore();text(`${sky.phaseName} · 照明 ${Math.round(sky.illumination*100)}%`,320,19);
 const card=cardById(day.cardId),title=card.nameZh+(day.reversed?' · 逆位':' · 正位'),meaning=briefReading(day.reversed?card.meaningReversed:card.meaningUpright),action='今天可做 · '+card.action,bottom=c.height-120;
 if(layout==='space'){let y=tall?660:510;y=text(title,y,44,760,true)+40;y=text(meaning,y,35,740)+55;text('今天可做',y,24,760,true);text(card.action,y+54,29,740)}else{const load=(src:string)=>new Promise<HTMLImageElement>((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error('卡牌图形加载失败'));i.src=src});const url=URL.createObjectURL(new Blob([art(card)],{type:'image/svg+xml'}));try{const image=await load(cardImageUrl(card.id)).catch(()=>load(url));const block=measure(title,40,760,true)+24+measure(meaning,27,760)+12+measure(action,25,760);const h=Math.min(tall?820:500,bottom-365-68-block),w=h*image.naturalWidth/image.naturalHeight;x.save();if(day.reversed){x.translate(540,365+h/2);x.rotate(Math.PI);x.drawImage(image,-w/2,-h/2,w,h)}else x.drawImage(image,540-w/2,365,w,h);x.restore();let y=text(title,365+h+68,40,760,true)+24;y=text(meaning,y,27,760)+12;text(action,y,25,760)}finally{URL.revokeObjectURL(url)}}
 text(`晨启塔罗 · ${SITE_HOST}`,c.height-68,18,900);return new Promise<Blob>((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(Error('图片生成失败')),'image/png'))
}
export async function shareCard(day:Day,tall=false,layout:ShareLayout='classic'){download(await createShareImage(day,tall,layout),`DAYBREAK-${day.date}-${layout}${tall?'-1080x1920':''}.png`)}

// ---- 北斗竖版分享图 1080×1920（9:16，适合小红书）----
// 上半：抽牌那一刻的北斗星图（真实朝向、连线、星名，用记录里的时刻和观测地重新计算）；下半：牌面、牌名、正逆位、一句话看懂、日期。
// 图上不写地点；showLat 为真时只写“北纬约 xx°”（取整）。单色细线，跟着当前深浅主题。
export async function createDipperShare(day:Day,showLat=false):Promise<Blob>{
 const k=day.dipper;if(!k)throw Error('这张牌不是用北斗仪式抽的');
 await document.fonts.ready;
 const display=getComputedStyle(document.querySelector('h1')||document.body).fontFamily,prose=getComputedStyle(document.body).fontFamily;
 const c=document.createElement('canvas');c.width=1080;c.height=1920;const x=c.getContext('2d');if(!x)throw Error('浏览器不支持图片导出');
 const dark=document.documentElement.dataset.theme!=='light',bg=dark?'#0B0A0E':'#F2EFE9',fg=dark?'#E6E2D8':'#141413',muted=dark?'#8C877E':'#6E6A63';
 x.fillStyle=bg;x.fillRect(0,0,1080,1920);x.textAlign='center';x.textBaseline='alphabetic';
 const text=(s:string,y:number,size:number,color=fg,heading=false,width=860)=>{x.fillStyle=color;x.font=`${heading?500:400} ${size}px ${heading?display:prose}`;const all=lines(x,s,width);all.forEach((l,i)=>x.fillText(l,540,y+i*size*1.6));return y+all.length*size*1.6};
 text('DAYBREAK · 晨启',96,34,fg,true);text(`${day.date} · 今日北斗`,144,24,muted);
 // 星图
 const sky=dipperSky(k.at?new Date(k.at):new Date(`${day.date}T21:00:00`),k.lat,k.lon??120),cx=540,cy=650,R=420,P=([px,py]:[number,number])=>[cx+px*R,cy+py*R] as const;
 x.strokeStyle=fg;x.lineWidth=1.5;x.globalAlpha=.35;x.beginPath();x.arc(cx,cy,R,0,Math.PI*2);x.stroke();
 x.lineWidth=1;x.globalAlpha=.12;for(const dec of [80,70,60,50]){x.beginPath();x.arc(cx,cy,R*(90-dec)/CHART_RADIUS,0,Math.PI*2);x.stroke()}
 if(sky.horizon.length>1){x.globalAlpha=.35;x.setLineDash([6,8]);x.beginPath();sky.horizon.forEach((p,i)=>{const [hx,hy]=P(p);if(i)x.lineTo(hx,hy);else x.moveTo(hx,hy)});x.stroke();x.setLineDash([])}
 x.fillStyle=fg;for(const s of sky.background){x.globalAlpha=Math.min(.85,.2+(4.9-s.mag)*.16)*(s.above?1:.45);const [sx,sy]=P([s.x,s.y]);x.beginPath();x.arc(sx,sy,Math.max(1.2,(4.9-s.mag)*1.5),0,Math.PI*2);x.fill()}
 const pts=sky.stars.map(s=>P([s.x,s.y]));x.globalAlpha=.75;x.lineWidth=2;x.strokeStyle=fg;x.beginPath();pts.forEach(([px,py],i)=>{if(i)x.lineTo(px,py);else x.moveTo(px,py)});x.moveTo(...pts[3]);x.lineTo(...pts[0]);x.stroke();
 const names=labelPositions(sky.stars.map(s=>[s.x,s.y] as [number,number]),0.085).map(p=>P(p));
 x.globalAlpha=1;sky.stars.forEach((_,i)=>{const [px,py]=pts[i];x.beginPath();x.arc(px,py,4+(3.4-DIPPER[i].mag)*2.2,0,Math.PI*2);x.fill();x.font=`400 28px ${prose}`;x.fillStyle=muted;x.fillText(DIPPER[i].zh,names[i][0],names[i][1]+10);x.fillStyle=fg});
 x.font=`400 24px ${prose}`;x.fillStyle=muted;for(const [t,px,py] of [['北',0,1.07],['东',1.06,0.02],['西',-1.06,0.02],['南',0,-1.04]] as const){const [tx,ty]=P([px,py]);x.fillText(t,tx,ty+8)}x.fillStyle=fg;
 const [qx,qy]=P([sky.polaris.x,sky.polaris.y]);x.beginPath();x.arc(qx,qy,6,0,Math.PI*2);x.fill();x.font=`400 24px ${prose}`;x.fillStyle=muted;x.textAlign='left';x.fillText('北极星',qx+14,qy+8);x.textAlign='center';
 text(`斗柄指向 ${bearingLabel(k.handleAz)} · 摇光高度 ${Math.round(k.alkaidAlt)}°${showLat?` · 北纬约 ${Math.round(Math.abs(k.lat))}°`:''}`,1140,26,muted);
 // 牌面
 const card=cardById(day.cardId),img=await new Promise<HTMLImageElement>((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=()=>no(Error('卡牌图形加载失败'));i.src=cardImageUrl(card.id)});
 const h=390,w=h*img.naturalWidth/img.naturalHeight;x.save();x.translate(540,1180+h/2);if(day.reversed)x.rotate(Math.PI);x.drawImage(img,-w/2,-h/2,w,h);x.restore();
 x.globalAlpha=.3;x.strokeStyle=fg;x.lineWidth=1;x.strokeRect(540-w/2,1180,w,h);x.globalAlpha=1;
 let y=text(`${card.nameZh} · ${day.reversed?'逆位':'正位'}`,1640,40,fg,true)+4;y=text(card.plainIntro,y,27,fg,false,820);
 text(`${SITE_HOST} · 每天早上一张牌`,1880,20,muted);
 return new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(Error('图片生成失败')),'image/png'))}
export async function dipperShareCard(day:Day,showLat=false){download(await createDipperShare(day,showLat),`DAYBREAK-${day.date}-beidou-1080x1920.png`)}
