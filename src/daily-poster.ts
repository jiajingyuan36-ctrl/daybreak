import qrcode from 'qrcode-generator';
import {cardImageUrl} from './art.ts';
import {cardById,roman} from './cards.ts';
import {calculateAlmanac,dateAtChinaNoon,deterministicHash} from './lib/almanac-engine.ts';
import {posterHeadline} from './poster-copy.ts';
import {BRAND_TITLE,BRAND_PROMISE,SITE_HOST,SITE_URL} from './site.ts';
import type {Day} from './types.ts';

export const POSTER_SIZES = {
 story: {width:540,height:960,artTop:134,artHeight:314,quote:539,reading:623,ticket:725,footer:823},
 portrait: {width:600,height:800,artTop:117,artHeight:237,quote:431,reading:504,ticket:595,footer:681},
} as const;
const PALETTES = {
 night: {bg:'#0F0F11',ink:'#F4EFE6',muted:'#C8C4BC',gold:'#C5A56E',rule:'#C5A56E',grain:.028,ticket:'rgba(197,165,110,.05)',grade:[.16,.76,1.08,.93],vignette:.58},
 plaster: {bg:'#F4EFE6',ink:'#141413',muted:'#3D3A35',gold:'#8C621E',rule:'#8C621E',grain:.032,ticket:'rgba(140,98,30,.055)',grade:[.12,.82,1.05,.98],vignette:.26},
} as const;
export const POSTER_DRAW_URL=`${SITE_URL}/ritual/?from=poster`;
export type PosterOptions = {format:keyof typeof POSTER_SIZES;theme:keyof typeof PALETTES;layout:'share'|'journal';qr:boolean;domain:boolean;reflection:boolean};
const SCALE=3;
const NO_START=/^[、。，？！：；）》」…\uFF0E\uFF3D\uFF5D\u3009\u300F\u3011\u3015,.!?;:%)\]}]/u;
const NO_END=/[（《「\uFF3B\uFF5B\u3008\u300E\u3010\u3014(\[{]$/u;

export function wrapPosterText(text:string,width:number,measure:(text:string)=>number) {
 const words=text.trim().replace(/\s+/g,' ').match(/[A-Za-z0-9]+(?:[.'\u2019-][A-Za-z0-9]+)*|—+|…+|./gu)??[];
 const tokens=words.flatMap(word=>measure(word)>width?[...word]:[word]);
 const rows:string[]=[];
 let line:string[]=[];
 for(const token of tokens){
  if(token===' '&&!line.length)continue;
  if(line.length&&measure(line.join('')+token)>width){
   const carry:string[]=[];
   while(line[line.length-1]===' ')line.pop();
   while(line.length>1&&(NO_END.test(line[line.length-1])||(NO_START.test(token)&&!carry.length)))carry.unshift(line.pop()!);
   rows.push(line.join('').trimEnd());
   line=carry;
  }
  if(token!==' '||line.length)line.push(token);
 }
 if(line.length)rows.push(line.join('').trimEnd());
 return rows;
}

function loadImage(src:string){
 return new Promise<HTMLImageElement>((resolve,reject)=>{
  const image=new Image();
  image.crossOrigin='anonymous';
  image.onload=()=>resolve(image);
  image.onerror=()=>reject(Error('牌面图片暂时无法加载，请重试。'));
  image.src=src;
 });
}

export async function preparePoster(day:Day){
 const card=cardById(day.cardId);
 const english=`${roman(card.number)} · ${card.nameEn.toUpperCase()}`;
 const title=`${card.nameZh} · ${day.reversed?'逆位':'正位'}`;
 const headline=posterHeadline(card);
 const quote=card.plainIntro;
 const reading=(day.reading.message|| (day.reversed?card.meaningReversed:card.meaningUpright)).match(/[^。！？]+[。！？]*/g)?.slice(0,3).join('')||quote;
 const action=day.reading.action||card.action;
 const shareAction=card.id==='m19'?'放一首喜欢的歌。听完再去忙。':action;
 const note=day.review?.note.trim()||'';
 // Imported dates can fall outside the almanac's supported range.
 const calendar=(()=>{try{return calculateAlmanac(dateAtChinaNoon(day.date))}catch{return null}})();
 const lunar=calendar?.lunar.label.split('年 ')[1];
 const dateLine=calendar?[lunar,calendar.solarTerms.onDate??calendar.solarTerms.current.name,calendar.moon.name].join(' · '):'';
 const css=getComputedStyle(document.body);
 const serif=css.getPropertyValue('--font-prose').trim()||'Georgia';
 const family=`${serif}, DaybreakSerif, "Noto Serif CJK SC", "Songti SC", SimSun, serif`;
 const glyphs=[BRAND_TITLE,BRAND_PROMISE,title,...headline,quote,reading,action,shareAction,note.slice(0,420),dateLine,'今日心境 一句话看懂 今日解析 今日可做一件小事 晚间回望 扫码开启今日晨间抽牌 抽一张你的日签 免费 无需注册',day.mood,day.intent].join(' ');
 const fonts=document.fonts;
 const [,image]=await Promise.all([
  fonts?Promise.allSettled([fonts.load(`18px ${family}`,glyphs),fonts.load(`italic 19px ${family}`,english)]).then(()=>fonts.ready):Promise.resolve(),
  loadImage(cardImageUrl(card.id)).catch(()=>loadImage(cardImageUrl(card.id,true))),
 ]);
 return {day,image,english,title,headline,quote,reading,action,shareAction,note,dateLine,moon:calendar?.moon,family};
}

type PosterData=Awaited<ReturnType<typeof preparePoster>>;
type Context=CanvasRenderingContext2D;

function context(canvas:HTMLCanvasElement){
 const ctx=canvas.getContext('2d');
 if(!ctx)throw Error('浏览器暂时无法生成图片。');
 return ctx;
}

function star(ctx:Context,x:number,y:number,r:number){
 ctx.beginPath();
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4,radius=i%2?r*.28:r;
  ctx.lineTo(x+Math.cos(a)*radius,y+Math.sin(a)*radius);
 }
 ctx.closePath();
 ctx.fill();
}

function roundRect(ctx:Context,x:number,y:number,w:number,h:number,r:number){
 ctx.beginPath();
 ctx.moveTo(x+r,y);
 ctx.arcTo(x+w,y,x+w,y+h,r);
 ctx.arcTo(x+w,y+h,x,y+h,r);
 ctx.arcTo(x,y+h,x,y,r);
 ctx.arcTo(x,y,x+w,y,r);
 ctx.closePath();
}

function frame(ctx:Context,w:number,h:number){
 const m=36,r=14;
 ctx.beginPath();
 ctx.moveTo(m+r,m);
 ctx.lineTo(w-m-r,m);
 ctx.arc(w-m,m,r,Math.PI,Math.PI/2,true);
 ctx.lineTo(w-m,h-m-r);
 ctx.arc(w-m,h-m,r,-Math.PI/2,Math.PI,true);
 ctx.lineTo(m+r,h-m);
 ctx.arc(m,h-m,r,0,-Math.PI/2,true);
 ctx.lineTo(m,m+r);
 ctx.arc(m,m,r,Math.PI/2,0,true);
 ctx.closePath();
 ctx.lineWidth=.5;
 ctx.stroke();
 for(const x of [m+8,w-m-8])for(const y of [m+8,h-m-8])star(ctx,x,y,3);
}

function grain(ctx:Context,seed:number,opacity:number){
 const tile=document.createElement('canvas');
 tile.width=tile.height=160;
 const noise=context(tile);
 const dots=noise.createImageData(tile.width,tile.height);
 for(let i=0;i<dots.data.length;i+=4){
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  dots.data[i]=dots.data[i+1]=dots.data[i+2]=seed&0x80000000?255:0;
  dots.data[i+3]=(seed>>>23)&255;
 }
 noise.putImageData(dots,0,0);
 const pattern=ctx.createPattern(tile,'repeat');
 if(!pattern)return;
 ctx.save();
 ctx.setTransform(1,0,0,1,0,0);
 ctx.globalAlpha=opacity;
 ctx.fillStyle=pattern;
 ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
 ctx.restore();
}

function telescope(ctx:Context,x:number,y:number,r:number){
 ctx.save();
 ctx.globalAlpha=.24;
 ctx.lineWidth=.5;
 for(const [cx,radius] of [[x,r],[x-r*.30,r*.69],[x+r*.30,r*.69]]){
  ctx.beginPath();
  ctx.arc(cx,y,radius,0,2*Math.PI);
  ctx.stroke();
 }
 ctx.beginPath();
 for(let i=0;i<72;i++){
  const a=i*Math.PI/36,inner=r-(i%6===0?10:4);
  ctx.moveTo(x+Math.cos(a)*inner,y+Math.sin(a)*inner);
  ctx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);
 }
 ctx.stroke();
 ctx.restore();
}

// Grade a same-origin scan in pixels so older Safari and embedded browsers match.
function gradedImage(image:HTMLImageElement,[sepia,saturation,contrast,brightness]:readonly number[]){
 const canvas=document.createElement('canvas');
 canvas.width=image.naturalWidth;
 canvas.height=image.naturalHeight;
 const ctx=context(canvas);
 ctx.drawImage(image,0,0);
 const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
 const p=pixels.data;
 for(let i=0;i<p.length;i+=4){
  const r=p[i],g=p[i+1],b=p[i+2];
  const red=r+(.393*r+.769*g+.189*b-r)*sepia;
  const green=g+(.349*r+.686*g+.168*b-g)*sepia;
  const blue=b+(.272*r+.534*g+.131*b-b)*sepia;
  const gray=.213*red+.715*green+.072*blue;
  p[i]=((gray+(red-gray)*saturation-127.5)*contrast+127.5)*brightness;
  p[i+1]=((gray+(green-gray)*saturation-127.5)*contrast+127.5)*brightness;
  p[i+2]=((gray+(blue-gray)*saturation-127.5)*contrast+127.5)*brightness;
 }
 ctx.putImageData(pixels,0,0);
 return canvas;
}

function plate(ctx:Context,data:PosterData,cx:number,top:number,h:number,vignette:number,grade:readonly number[]){
 const w=h/1.71,left=cx-w/2,cy=top+h/2;
 telescope(ctx,cx,cy,h*.57);
 ctx.save();
 roundRect(ctx,left,top,w,h,4);
 ctx.clip();
 ctx.fillStyle='#C8B692';
 ctx.fillRect(left,top,w,h);
 const art=gradedImage(data.image,grade);
 ctx.save();
 ctx.translate(cx,cy);
 if(data.day.reversed)ctx.rotate(Math.PI);
 ctx.imageSmoothingQuality='high';
 ctx.drawImage(art,-w/2,-h/2,w,h);
 ctx.restore();
 const shade=ctx.createRadialGradient(cx,cy,h*.23,cx,cy,h*.61);
 shade.addColorStop(0,'transparent');
 shade.addColorStop(1,`rgba(15,12,9,${vignette})`);
 ctx.fillStyle=shade;
 ctx.fillRect(left,top,w,h);
 ctx.restore();
 art.width=0;
 ctx.lineWidth=1;
 roundRect(ctx,left-.5,top-.5,w+1,h+1,4);
 ctx.stroke();
 ctx.lineWidth=.5;
 roundRect(ctx,left+6,top+6,w-12,h-12,2);
 ctx.stroke();
}

function moonIcon(ctx:Context,x:number,y:number,moon:NonNullable<PosterData['moon']>,color:string){
 const r=4.5;
 ctx.save();
 ctx.translate(x,y);
 if(!moon.waxing)ctx.scale(-1,1);
 ctx.fillStyle=color;
 ctx.globalAlpha=.22;
 ctx.beginPath();
 ctx.arc(0,0,r,0,Math.PI*2);
 ctx.fill();
 ctx.globalAlpha=1;
 ctx.beginPath();
 ctx.arc(0,0,r,-Math.PI/2,Math.PI/2);
 const terminator=r*(1-2*moon.illumination);
 ctx.ellipse(0,0,Math.max(.01,Math.abs(terminator)),r,0,Math.PI/2,3*Math.PI/2,terminator>=0);
 ctx.fill();
 ctx.restore();
}

function qrMatrix(url:string){
 const code=qrcode(0,'M');
 code.addData(url,'Byte');
 code.make();
 return code;
}

function drawQR(ctx:Context,right:number,top:number,size:number,color:string,url=SITE_URL){
 const code=qrMatrix(url),count=code.getModuleCount(),quiet=4,unit=size/(count+2*quiet);
 const x=right-size+quiet*unit,y=top+quiet*unit;
 ctx.fillStyle=color;
 for(let row=0;row<count;row++)for(let col=0;col<count;col++){
  if(!code.isDark(row,col))continue;
  const finder=(row<7&&(col<7||col>=count-7))||(col<7&&row>=count-7);
  if(finder)ctx.fillRect(x+col*unit,y+row*unit,unit+.04,unit+.04);
  else{
   roundRect(ctx,x+col*unit+.05,y+row*unit+.05,unit-.1,unit-.1,unit*.2);
   ctx.fill();
  }
 }
}

function meteor(ctx:Context,w:number,top:number,color:string){
 const startX=w*.91,startY=top-20,endX=w*.75,endY=top+47;
 const tail=ctx.createLinearGradient(startX,startY,endX,endY);
 tail.addColorStop(0,'transparent');
 tail.addColorStop(.7,color);
 tail.addColorStop(1,color);
 ctx.save();
 ctx.globalAlpha=.62;
 ctx.lineCap='round';
 ctx.lineWidth=1.3;
 ctx.strokeStyle=tail;
 ctx.beginPath();
 ctx.moveTo(startX,startY);
 ctx.lineTo(endX,endY);
 ctx.stroke();
 ctx.fillStyle=color;
 star(ctx,endX,endY,3.5);
 ctx.restore();
}

function encodePoster(canvas:HTMLCanvasElement){
 return new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('图片生成失败，请重试。')),'image/png'));
}

export async function renderPoster(data:PosterData,options:PosterOptions):Promise<Blob>{
 const {width:w,height:h,artTop,artHeight,quote,reading,ticket,footer}=POSTER_SIZES[options.format];
 const palette=PALETTES[options.theme],night=options.theme==='night',cx=w/2,left=59,right=w-left,width=right-left;
 const canvas=document.createElement('canvas');
 canvas.width=w*SCALE;
 canvas.height=h*SCALE;
 try{
  const ctx=context(canvas);
  ctx.scale(SCALE,SCALE);
  ctx.textBaseline='top';
  ctx.fillStyle=palette.bg;
  ctx.fillRect(0,0,w,h);
  if(night){
   const dawn=ctx.createRadialGradient(cx,h*.18,0,cx,h*.18,w*.65);
   dawn.addColorStop(0,'rgba(197,165,110,.10)');
   dawn.addColorStop(1,'transparent');
   ctx.fillStyle=dawn;
   ctx.fillRect(0,0,w,h*.65);
  }
  grain(ctx,deterministicHash(data.day.date),palette.grain);
  const foil=ctx.createLinearGradient(36,36,w-36,h-36);
  (night?['#7A5C29','#C5A56E','#FFF2CC','#C5A56E','#7A5C29']:['#8C621E','#C5A56E','#8C621E'])
   .forEach((c,i,stops)=>foil.addColorStop(i/(stops.length-1),c));
  ctx.fillStyle=ctx.strokeStyle=foil;
  frame(ctx,w,h);
  const font=(size:number,italic=false)=>`${italic?'italic ':''}${size}px ${data.family}`;
  const text=(value:string,x:number,y:number,size:number,color:string,align:CanvasTextAlign='left',italic=false,maxWidth?:number)=>{
   ctx.font=font(size,italic);
   ctx.fillStyle=color;
   ctx.textAlign=align;
   if(maxWidth)ctx.fillText(value,x,y,maxWidth);
   else ctx.fillText(value,x,y);
  };
  const paragraph=(value:string,x:number,y:number,maxWidth:number,height:number,size:number,color:string,align:CanvasTextAlign='left',lineSpacing=1.75)=>{
   let rows:string[],lineHeight:number;
   do{
    ctx.font=font(size);
    rows=wrapPosterText(value,maxWidth,s=>ctx.measureText(s).width);
    lineHeight=size*lineSpacing;
    if(rows.length*lineHeight<=height||size<=12)break;
    size-=.5;
   }while(true);
   const limit=Math.floor(height/lineHeight);
   const visible=rows.slice(0,limit);
   if(visible.length&&rows.length>limit){
    const last=[...visible[visible.length-1]];
    while(last.length&&ctx.measureText(last.join('')+'…').width>maxWidth)last.pop();
    visible[visible.length-1]=last.join('').replace(/[，、。！？：；\s]+$/u,'')+'…';
   }
   visible.forEach((row,i)=>text(row,x,y+i*lineHeight,size,color,align));
  };
  const personal=options.reflection&&!!data.note;
  if(options.layout==='share'){
   const tall=options.format==='story';
   const heroTop=tall?242:218,heroHeight=tall?388:312,heroBottom=heroTop+heroHeight;
   const titleTop=tall?104:94,titleSize=tall?45:47,footerTop=tall?806:655;
   text(BRAND_TITLE,left,56,16,palette.gold);
   text(data.day.date.slice(5).replace('-','.'),right,57,15,palette.muted,'right');
   data.headline.forEach((line,i)=>text(line,cx,titleTop+i*titleSize*1.15,titleSize,palette.ink,'center',false,width));
   meteor(ctx,w,heroTop,palette.gold);
   ctx.strokeStyle=foil;
   plate(ctx,data,cx,heroTop,heroHeight,palette.vignette,palette.grade);
   text(data.title,cx,heroBottom+15,16,palette.gold,'center');
   if(personal)text('晚间回望',cx,heroBottom+41,12,palette.gold,'center');
   const actionTop=heroBottom+(personal?59:43);
   paragraph(personal?data.note:data.shareAction,cx,actionTop,width-8,footerTop-actionTop-12,22,palette.ink,'center',1.4);
   ctx.fillStyle=foil;
   ctx.fillRect(left,footerTop,width,.5);
   text('抽一张你的日签 ↗',left,footerTop+14,27,palette.ink);
   text(BRAND_PROMISE,left,footerTop+51,15,palette.muted);
   const byline=options.domain?`${SITE_HOST} · 免费 · 无需注册`:'免费 · 无需注册';
   text(byline,left,footerTop+77,13,palette.gold);
   if(options.qr)drawQR(ctx,right,footerTop+9,tall?96:91,palette.gold,POSTER_DRAW_URL);
   return await encodePoster(canvas);
  }
  const capsule=(value:string,x:number,y:number,size:number,centered:boolean)=>{
   ctx.font=font(size);
   const span=ctx.measureText(value).width+24;
   const leftEdge=centered?x-span/2:x;
   ctx.strokeStyle=foil;
   ctx.lineWidth=.5;
   ctx.fillStyle=palette.ticket;
   roundRect(ctx,leftEdge,y,span,size+11,(size+11)/2);
   ctx.fill();
   ctx.stroke();
   text(value,leftEdge+span/2,y+4,size,palette.gold,'center');
  };
  ctx.font=font(12);
  ctx.textAlign='left';
  ctx.fillStyle=palette.gold;
  let letterX=left;
  for(const letter of BRAND_TITLE){
   ctx.fillText(letter,letterX,60);
   letterX+=ctx.measureText(letter).width+12*.22;
  }
  text(data.day.date.replace(/-/g,'.'),right,54,16,palette.ink,'right');
  if(data.moon){
   moonIcon(ctx,right-4,78,data.moon,palette.gold);
   text(data.dateLine,right-13,71,10.5,palette.muted,'right');
  }
  if(data.day.mood||data.day.intent)capsule('✦ 今日心境 · '+[data.day.mood,data.day.intent].filter(Boolean).join(' / '),cx,artTop-34,10.5,true);
  ctx.strokeStyle=foil;
  plate(ctx,data,cx,artTop,artHeight,palette.vignette,palette.grade);
  const artBottom=artTop+artHeight;
  text(data.english,cx,artBottom+12,17,palette.gold,'center',true);
  ctx.save();
  ctx.translate(cx,artBottom+36);
  ctx.transform(1,0,-.176,1,0,0);
  text(data.title,0,0,30,palette.ink,'center');
  ctx.restore();
  ctx.fillStyle=palette.gold;
  star(ctx,cx,quote-9,3);
  paragraph(data.quote,cx,quote,width-18,reading-quote-10,17,palette.ink,'center');
  text('今日解析',left,reading,11,palette.gold);
  paragraph(data.reading,left,reading+19,width,ticket-reading-23,15,palette.muted);
  const ticketHeight=footer-ticket-14;
  ctx.fillStyle=palette.ticket;
  ctx.fillRect(left,ticket,width,ticketHeight);
  ctx.fillStyle=palette.gold;
  ctx.fillRect(left,ticket,2,ticketHeight);
  text(personal?'✦  晚间回望':'✦  10 MIN RITUAL / 今日可做一件小事',left+13,ticket+9,11,palette.gold);
  paragraph(personal?data.note:data.action,left+13,ticket+27,width-26,ticketHeight-29,14,palette.ink);
  const line=ctx.createLinearGradient(left,footer,right,footer);
  line.addColorStop(0,'transparent');
  line.addColorStop(.5,palette.rule);
  line.addColorStop(1,'transparent');
  ctx.fillStyle=line;
  ctx.fillRect(left,footer,width,.5);
  ctx.fillStyle=palette.gold;
  star(ctx,cx,footer,4);
  text(BRAND_TITLE,left,footer+12,18,palette.ink);
  text(BRAND_PROMISE,left,footer+36,10.5,palette.muted);
  if(options.domain)capsule(`✦  ${SITE_HOST}  ✦`,left,footer+51,13,false);
  if(options.qr){
   const qrSize=options.format==='story'?80:69;
   drawQR(ctx,right-2,footer+3,qrSize,palette.gold);
   text('扫码开启今日晨间抽牌',right-2-qrSize/2,footer+qrSize+2,8.5,palette.muted,'center');
  }
  return await encodePoster(canvas);
 }finally{
  canvas.width=0;
  canvas.height=0;
 }
}
