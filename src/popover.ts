// 毛玻璃下拉浮层：把一个原生 <select> 换成“按钮 + 浮层列表”的外观。
// 原生 select 仍留在页面里（隐藏），值和 change 事件照旧，所以读取 select.value 的代码不用改。
// 键盘：Enter/空格/↓ 打开，↑↓ 移动，Enter 选中，Esc 关闭；点浮层外面也关闭。
import {triggerHaptic} from './tactile.ts';
export interface GlassOption {value:string;label:string;swatch?:string}
const chevron='<svg class="glass-chevron" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
let seq=0;
export function glassSelect(select:HTMLSelectElement,swatches:Readonly<Record<string,string>>={}){
 if(select.dataset.glass)return;select.dataset.glass='1';
 const id=`glass-${++seq}`,options:GlassOption[]=[...select.options].map(o=>({value:o.value,label:o.text,swatch:swatches[o.value]}));
 const wrap=document.createElement('span');wrap.className='glass-select';
 const trigger=document.createElement('button');trigger.type='button';trigger.className='glass-trigger';trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-controls',id);
 const label=select.getAttribute('aria-label');if(label)trigger.setAttribute('aria-label',label);
 const list=document.createElement('ul');list.className='glass-pop';list.id=id;list.setAttribute('role','listbox');if(label)list.setAttribute('aria-label',label);
 list.innerHTML=options.map(o=>`<li role="option" tabindex="-1" data-value="${o.value}">${o.swatch?`<span class="swatch" style="--swatch:${o.swatch}"></span>`:''}<span>${o.label}</span><span class="glass-check" aria-hidden="true">✓</span></li>`).join('');
 const sync=()=>{const o=options.find(x=>x.value===select.value)||options[0];trigger.innerHTML=`${o.swatch?`<span class="swatch" style="--swatch:${o.swatch}"></span>`:''}<span class="glass-value">${o.label}</span>${chevron}`;list.querySelectorAll<HTMLElement>('li').forEach(li=>li.setAttribute('aria-selected',String(li.dataset.value===o.value)))};
 const items=()=>[...list.querySelectorAll<HTMLElement>('li')];
 const open=()=>{wrap.classList.add('open');trigger.setAttribute('aria-expanded','true');(items().find(li=>li.getAttribute('aria-selected')==='true')||items()[0])?.focus({preventScroll:true});document.addEventListener('pointerdown',outside,true)};
 const close=(focus=true)=>{if(!wrap.classList.contains('open'))return;wrap.classList.remove('open');trigger.setAttribute('aria-expanded','false');document.removeEventListener('pointerdown',outside,true);if(focus)trigger.focus({preventScroll:true})};
 const outside=(e:Event)=>{if(!wrap.contains(e.target as Node))close(false)};
 const choose=(value:string)=>{if(select.value!==value){select.value=value;select.dispatchEvent(new Event('change',{bubbles:true}));triggerHaptic('selection')}sync();close()};
 trigger.onclick=()=>wrap.classList.contains('open')?close():open();
 trigger.onkeydown=e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();open()}};
 list.onclick=e=>{const li=(e.target as Element).closest<HTMLElement>('li');if(li)choose(li.dataset.value!)};
 list.onkeydown=e=>{const all=items(),i=all.indexOf(document.activeElement as HTMLElement);
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();all[(i+(e.key==='ArrowDown'?1:-1)+all.length)%all.length]?.focus()}
  else if(e.key==='Enter'||e.key===' '){e.preventDefault();if(i>=0)choose(all[i].dataset.value!)}
  else if(e.key==='Escape'||e.key==='Tab'){e.preventDefault();close()}};
 select.classList.add('glass-native');select.tabIndex=-1;select.setAttribute('aria-hidden','true');
 select.addEventListener('change',sync);
 select.after(wrap);wrap.append(trigger,list);sync();
 return {sync,close};
}
