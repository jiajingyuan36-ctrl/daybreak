// 牌面图加载失败时的后备：先绕过缓存自动重试一次；还不行就在牌框里写出牌名和「再试一次」，不留一个空框。
// 网络差、浏览器省流量不显示图片、离线缓存里存了坏图，都会走到这里。
const RETRIED='retried';

function fallback(img:HTMLImageElement){
 const box=img.parentElement;if(!box||box.querySelector('.img-fallback'))return;
 img.hidden=true;
 const note=document.createElement('button');note.type='button';note.className='img-fallback';
 note.innerHTML=`<strong>${img.alt||'牌面'}</strong><span>牌面图片没加载出来，点这里再试一次</span>`;
 note.onclick=()=>{note.remove();img.hidden=false;retry(img,true)};
 box.appendChild(note)}

function retry(img:HTMLImageElement,manual=false){
 if(img.dataset[RETRIED]&&!manual){fallback(img);return}
 img.dataset[RETRIED]='1';
 // 加查询参数，离线缓存里没有这个地址，会重新从网络取
 const base=(img.getAttribute('src')||'').split('?')[0];img.src=`${base}?r=${Date.now().toString(36)}`}

/** 给 root 里的牌面图挂上后备；已经失败的立刻处理。重复调用不会重复挂。 */
export function guardCardImages(root:ParentNode){
 root.querySelectorAll<HTMLImageElement>('img.rws').forEach(img=>{
  if(img.dataset.imgGuard)return;img.dataset.imgGuard='1';
  img.addEventListener('error',()=>retry(img));
  if(img.complete&&img.naturalWidth===0&&img.getAttribute('src'))retry(img)})}
