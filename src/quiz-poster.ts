// 性格测试结果图：1080×1440（3:4），和网站同一套黑金版式。
// 牌面人物没有穿衣服的牌（QUIZ_COVERED）改画牌背，避免社交平台判违规。
// clean=true 时去掉二维码和网址（发小红书等平台用：图里出现网址或二维码会被当成引流）。
import qrcode from 'qrcode-generator';
import {cardImageUrl} from './art.ts';
import {cardBack} from './card-back.ts';
import {cardById,roman} from './cards.ts';
import {QUIZ_COVERED,QUIZ_RESULTS} from './quiz.ts';
import {SITE_HOST,SITE_URL} from './site.ts';
import {wrapPosterText} from './daily-poster.ts';

const W=1080,H=1440,GOLD='#D8CFBA',INK='#F1EADB',MUTED='rgba(237,230,216,.62)';
const BACK_VARS='--cb-bg-a:#121115;--cb-bg-b:#0a0a0c;--cb-glow:#EFE8D6;--cb-f0:#7d766a;--cb-f1:#cbc2ad;--cb-f2:#f1ebdc;--cb-f3:#ece4d1;--cb-f4:#6d675c;--cb-hl:#f6f1e6';
export const quizShareUrl=(id:string,from='quiz')=>`${SITE_URL}/quiz/${id}/?from=${from}`;

function loadImage(src:string){return new Promise<HTMLImageElement>((resolve,reject)=>{const i=new Image();i.crossOrigin='anonymous';i.onload=()=>resolve(i);i.onerror=()=>reject(Error('图片加载失败，请重试。'));i.src=src})}
/** 牌背是 SVG，颜色读 CSS 变量；单独画到画布上时把深色那一套变量写进 SVG 自己身上 */
async function backImage(){const svg=cardBack().replace('<svg ',`<svg style="${BACK_VARS}" `);const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));try{return await loadImage(url)}finally{setTimeout(()=>URL.revokeObjectURL(url),2000)}}

export async function renderQuizPoster(id:string,{clean=false}:{clean?:boolean}={}):Promise<Blob>{
 const r=QUIZ_RESULTS[id],c=cardById(id);if(!r||!c)throw Error('没有这张牌');
 const family=getComputedStyle(document.body).getPropertyValue('--font-chinese').trim()||'DaybreakSerif,serif';
 const glyphs=`晨启塔罗你是哪张牌测一测一分钟${c.nameZh}${r.line}${r.look}${SITE_HOST}/quiz0123456789IVX·DAYBREAK`;
 await Promise.allSettled([document.fonts.load(`40px ${family}`,glyphs)]);await document.fonts.ready;
 const art=await (QUIZ_COVERED.has(id)?backImage():loadImage(cardImageUrl(id)));
 const cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d')!;
 // 底色和细金框
 const g=x.createRadialGradient(W/2,H*.36,40,W/2,H*.5,H*.78);g.addColorStop(0,'#1C1A22');g.addColorStop(.6,'#121116');g.addColorStop(1,'#0B0A0F');x.fillStyle=g;x.fillRect(0,0,W,H);
 x.strokeStyle='rgba(216,207,186,.42)';x.lineWidth=1.5;x.strokeRect(40,40,W-80,H-80);x.strokeStyle='rgba(216,207,186,.16)';x.lineWidth=1;x.strokeRect(52,52,W-104,H-104);
 const text=(s:string,px:number,y:number,color:string,{spacing=0,align='center' as CanvasTextAlign,xPos=W/2}={})=>{x.font=`${px}px ${family}`;x.fillStyle=color;x.textAlign=align;x.textBaseline='alphabetic';(x as CanvasRenderingContext2D&{letterSpacing:string}).letterSpacing=`${spacing}px`;x.fillText(s,xPos,y)};
 text('晨启塔罗 · DAYBREAK',24,124,GOLD,{spacing:6});
 text('你是哪张塔罗牌？',26,170,MUTED,{spacing:4});
 // 牌面：浅色卡纸边框 + 投影
 const cw=360,ch=Math.round(cw*1029/600),cx=(W-cw)/2,cy=214;
 x.save();x.shadowColor='rgba(0,0,0,.6)';x.shadowBlur=40;x.shadowOffsetY=18;x.fillStyle=QUIZ_COVERED.has(id)?'#0B0A0F':'#F1E9D8';x.fillRect(cx-8,cy-8,cw+16,ch+16);x.restore();
 x.drawImage(art,cx,cy,cw,ch);x.strokeStyle='rgba(216,207,186,.6)';x.lineWidth=1.5;x.strokeRect(cx-8,cy-8,cw+16,ch+16);
 // 牌名和一句话
 let y=cy+ch+92;
 text('我是',26,y,MUTED,{spacing:8});y+=78;
 text(`${roman(c.number)} · ${c.nameZh}`,66,y,INK,{spacing:10});y+=64;
 text(r.line,34,y,GOLD,{spacing:3});y+=36;
 x.strokeStyle='rgba(216,207,186,.35)';x.beginPath();x.moveTo(W/2-120,y);x.lineTo(W/2+120,y);x.stroke();y+=52;
 x.font=`27px ${family}`;(x as CanvasRenderingContext2D&{letterSpacing:string}).letterSpacing='2px';
 for(const row of wrapPosterText(r.look,760,s=>x.measureText(s).width).slice(0,3)){text(row,27,y,MUTED,{spacing:2});y+=44}
 // 底部：测一测 + 网址 + 二维码（clean 时只留一句）
 if(clean){text('你是哪一张？',30,H-104,INK,{spacing:6})}
 else{
  const qr=qrcode(0,'M');qr.addData(quizShareUrl(id,'poster'),'Byte');qr.make();const n=qr.getModuleCount(),size=128,cell=size/n,qx=W-80-size-24,qy=H-80-size-24;
  x.fillStyle='#F1EADB';x.fillRect(qx-10,qy-10,size+20,size+20);x.fillStyle='#0B0A0F';for(let r2=0;r2<n;r2++)for(let c2=0;c2<n;c2++)if(qr.isDark(r2,c2))x.fillRect(qx+c2*cell,qy+r2*cell,Math.ceil(cell),Math.ceil(cell));
  text('你是哪一张？',32,H-160,INK,{spacing:6,align:'left',xPos:104});
  text('12 道题，一分钟',24,H-118,MUTED,{spacing:3,align:'left',xPos:104});
  text(`${SITE_HOST}/quiz`,22,H-82,GOLD,{spacing:2,align:'left',xPos:104});
 }
 return await new Promise<Blob>((res,rej)=>cv.toBlob(b=>b?res(b):rej(Error('生成失败')),'image/png'));
}
