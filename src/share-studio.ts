import {cardById} from './cards.ts';
import {preparePoster,renderPoster,type PosterOptions} from './daily-poster.ts';
import {SITE_HOST,SITE_URL} from './site.ts';
import {triggerHaptic} from './tactile.ts';
import type {Day} from './types.ts';

let dismiss:((restoreFocus:boolean)=>void)|undefined;
export function closeShareStudio(){dismiss?.(false)}
const canceled=(error:unknown)=>!!error&&typeof error==='object'&&'name' in error&&error.name==='AbortError';

export function openShareStudio(day:Day,trigger:HTMLButtonElement){
 closeShareStudio();
 const options:PosterOptions={format:'story',theme:'night',qr:true,reflection:false};
 const mobile=matchMedia('(pointer: coarse)').matches||/iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
 const embedded=/MicroMessenger|Weibo|XiaoHongShu|xhsdiscover|REDnote/i.test(navigator.userAgent);
 const shareLinkNatively=mobile&&!embedded&&typeof navigator.share==='function';
 const canCopyImage=typeof ClipboardItem==='function'&&typeof navigator.clipboard?.write==='function';
 const filename=`DAYBREAK-晨启日签-${day.date.replace(/-/g,'')}-${cardById(day.cardId).nameZh}.png`;
 const shareText=`我在晨启塔罗抽到了今日日签 ✦ ${SITE_URL}`;
 const dialog=document.createElement('dialog');
 dialog.className='poster-studio';
 dialog.setAttribute('aria-labelledby','poster-title');
 dialog.setAttribute('aria-modal','true');
 dialog.innerHTML=`<div class="poster-studio-inner">
  <header class="poster-header">
   <div><p>DAYBREAK · MORNING RITUAL</p><h2 id="poster-title">晨启日签</h2></div>
   <button type="button" class="poster-close" aria-label="关闭海报" autofocus>×</button>
  </header>
  <div class="poster-options">
   <fieldset class="poster-segment"><legend>画幅</legend><div>
    <label><input type="radio" name="poster-format" value="story" checked><span>9:16 锁屏长图</span></label>
    <label><input type="radio" name="poster-format" value="portrait"><span>3:4 小红书画报</span></label>
   </div></fieldset>
   <fieldset class="poster-segment"><legend>配色</legend><div>
    <label><input type="radio" name="poster-theme" value="night" checked><span>● 玄夜黑金</span></label>
    <label><input type="radio" name="poster-theme" value="plaster"><span>○ 帕罗斯石膏</span></label>
   </div></fieldset>
   <div class="poster-toggles">
    <label><input type="checkbox" name="poster-qr" checked>附带宣传码</label>
    ${day.review?.note.trim()?'<label><input type="checkbox" name="poster-reflection">展示晚间回望</label>':''}
   </div>
  </div>
  <div class="poster-preview" aria-busy="true">
   <img class="poster-native-img" alt="晨启日签海报" draggable="false" hidden>
   <div class="poster-placeholder"><p>正在生成高清海报…</p><button type="button" class="poster-retry" hidden>重试</button></div>
  </div>
  <footer class="poster-actions">
   <p class="poster-status" role="status" aria-live="polite"></p>
   <a class="poster-link" href="${SITE_URL}" hidden>${SITE_HOST}</a>
   <div class="poster-buttons">
    <button type="button" class="poster-save" disabled>↓ ${mobile?'保存高清图到相册':'下载高清图片'}</button>
    <button type="button" class="poster-copy" disabled>${canCopyImage?'复制图片':'分享链接'}</button>
   </div>
  </footer>
 </div>`;
 const image=dialog.querySelector<HTMLImageElement>('.poster-native-img')!;
 const preview=dialog.querySelector<HTMLElement>('.poster-preview')!;
 const placeholder=dialog.querySelector<HTMLElement>('.poster-placeholder')!;
 const message=placeholder.querySelector('p')!;
 const retry=dialog.querySelector<HTMLButtonElement>('.poster-retry')!;
 const save=dialog.querySelector<HTMLButtonElement>('.poster-save')!;
 const copy=dialog.querySelector<HTMLButtonElement>('.poster-copy')!;
 const close=dialog.querySelector<HTMLButtonElement>('.poster-close')!;
 const status=dialog.querySelector<HTMLElement>('.poster-status')!;
 const link=dialog.querySelector<HTMLAnchorElement>('.poster-link')!;
 const root=document.documentElement,overflow=root.style.overflow;
 const saveLabel=save.textContent!;
 let pending:ReturnType<typeof preparePoster>|undefined;
 let blob:Blob|undefined,url:string|undefined;
 let version=0,rendering=false,closed=false,shownReflection=false;

 const cleanup=(restoreFocus:boolean)=>{
  if(closed)return;
  closed=true;
  if(url)URL.revokeObjectURL(url);
  dialog.remove();
  root.style.overflow=overflow;
  dismiss=undefined;
  if(restoreFocus&&trigger.isConnected)trigger.focus();
 };
 dismiss=cleanup;
 document.body.append(dialog);
 const native=typeof dialog.showModal==='function';
 if(native)dialog.showModal();
 else{
  dialog.dataset.fallback='true';
  dialog.setAttribute('open','');
 }
 root.style.overflow='hidden';
 close.focus();
 close.onclick=()=>cleanup(true);
 dialog.oncancel=e=>{e.preventDefault();cleanup(true)};
 dialog.onclose=()=>cleanup(true);
 dialog.onclick=e=>{if(e.target===dialog)cleanup(true)};
 if(!native)dialog.onkeydown=e=>{
  if(e.key==='Escape'){e.preventDefault();cleanup(true);return}
  if(e.key!=='Tab')return;
  const focusable=[...dialog.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),a:not([hidden])')].filter(el=>el.getClientRects().length);
  const first=focusable[0],last=focusable[focusable.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}
 };

 async function update(){
  version++;
  save.disabled=copy.disabled=true;
  save.textContent=saveLabel;
  status.textContent='';
  status.classList.remove('poster-save-hint');
  link.hidden=true;
  retry.hidden=true;
  preview.setAttribute('aria-busy','true');
  message.textContent='正在生成高清海报…';
  if(shownReflection&&!options.reflection){
   image.hidden=true;
   image.removeAttribute('src');
   placeholder.hidden=false;
   if(url)URL.revokeObjectURL(url);
   blob=url=undefined;
   shownReflection=false;
  }
  if(rendering)return;
  rendering=true;
  try{
   let target:number;
   do{
    target=version;
    const snapshot={...options};
    // Let the disabled state paint before canvas work starts.
    await new Promise<void>(resolve=>setTimeout(resolve,30));
    if(closed)return;
    try{
     const data=await (pending??=preparePoster(day));
     if(closed)return;
     if(target!==version)continue;
     const next=await renderPoster(data,snapshot);
     if(closed)return;
     if(target!==version)continue;
     const previous=url;
     blob=next;
     url=URL.createObjectURL(next);
     image.src=url;
     shownReflection=snapshot.reflection;
     image.hidden=false;
     placeholder.hidden=true;
     if(previous)URL.revokeObjectURL(previous);
     save.disabled=copy.disabled=false;
     preview.setAttribute('aria-busy','false');
     status.textContent=mobile?'也可以长按海报保存图片。':'高清 PNG 已就绪';
    }catch(error){
     pending=undefined;
     if(closed)return;
     if(target!==version)continue;
     image.hidden=true;
     placeholder.hidden=false;
     retry.hidden=false;
     preview.setAttribute('aria-busy','false');
     message.textContent=error instanceof Error&&error.name==='Error'?error.message:'图片生成失败，请重试。';
     status.textContent=message.textContent;
    }
   }while(target!==version);
  }finally{rendering=false}
 }
 retry.onclick=()=>void update();
 dialog.onchange=e=>{
  const input=e.target as HTMLInputElement;
  switch(input.name){
   case 'poster-format': options.format=input.value==='portrait'?'portrait':'story';break;
   case 'poster-theme': options.theme=input.value==='plaster'?'plaster':'night';break;
   case 'poster-qr': options.qr=input.checked;break;
   case 'poster-reflection': options.reflection=input.checked;break;
   default:return;
  }
  void update();
 };

 save.onclick=async()=>{
  if(!blob||!url)return;
  const currentURL=url,currentVersion=version;
  if(mobile&&!embedded&&typeof File==='function'&&navigator.share&&navigator.canShare){
   const file=new File([blob],filename,{type:'image/png'});
   try{
    if(navigator.canShare({files:[file]})){
     await navigator.share({files:[file],title:'DAYBREAK · 晨启塔罗',text:shareText});
     if(!closed&&version===currentVersion)status.textContent='已交给系统分享。';
     return;
    }
   }catch(error){if(canceled(error))return}
  }
  if(closed||version!==currentVersion)return;
  const download=document.createElement('a');
  download.href=currentURL;
  download.download=filename;
  dialog.append(download);
  download.click();
  download.remove();
  triggerHaptic('success');
  if(mobile||embedded){
   status.textContent='✦ 高清日签已就绪。请长按上方海报，选择保存到手机相册。';
   status.classList.add('poster-save-hint');
  }else{
   save.textContent='✓ 已保存超清图片';
   status.textContent='已开始下载高清 PNG。';
  }
 };
 copy.onclick=async()=>{
  if(!blob)return;
  const currentVersion=version;
  try{
   if(canCopyImage){
    await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);
    if(!closed&&version===currentVersion)status.textContent='已复制图片。';
    return;
   }
  }catch{/* Fall through to the public link. */}
  try{
   if(shareLinkNatively)await navigator.share({title:'DAYBREAK · 晨启塔罗',url:SITE_URL});
   else if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(SITE_URL);
   else throw Error();
   if(!closed&&version===currentVersion)status.textContent=shareLinkNatively?'已交给系统分享。':'已复制晨启塔罗链接。';
  }catch(error){
   if(canceled(error))return;
   if(!closed&&version===currentVersion){link.hidden=false;status.textContent='可复制下方的晨启塔罗链接。'}
  }
 };
 void update();
}
