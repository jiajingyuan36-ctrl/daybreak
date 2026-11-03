// 首次安装：后台缓存六个页面和它们引用的脚本、样式、字体。
// 之后：带版本号的文件、牌面和贴图直接用缓存；页面和其它文件先用缓存秒开，同时后台取新版本更新缓存（下次打开生效）。
const CACHE='daybreak-v20';
const PAGES=['/','/ritual/','/consult/','/encyclopedia/','/history/','/settings/','/privacy/','/terms/','/deep/','/feedback/','/zodiac/','/pair/'];
const IMMUTABLE=/\/_next\/static\/|\/fonts\/|\/rws\/|\/moon\/|\.(?:woff2|png|svg|webp|webmanifest)$/;
const ASSET=/(?:href|src)="(\/(?:_next\/static|js)\/[^"?#]+)"/g;
async function cacheAssets(cache,html){const urls=new Set([...html.matchAll(ASSET)].map(m=>m[1]));await Promise.all([...urls].map(u=>cache.match(u).then(hit=>hit||fetch(u).then(r=>r.ok?cache.put(u,r):undefined)).catch(()=>{})))}
async function precache(){const cache=await caches.open(CACHE);await Promise.all(['/style.css','/epic.css','/moon/moon-1024.webp'].map(u=>fetch(u).then(r=>r.ok&&cache.put(u,r)).catch(()=>{})));for(const p of PAGES){try{const r=await fetch(p,{cache:'no-cache'});if(!r.ok)continue;await cache.put(p,r.clone());await cacheAssets(cache,await r.text())}catch{}}}
self.addEventListener('install',e=>e.waitUntil(precache().catch(()=>{}).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('daybreak-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const req=e.request,u=new URL(req.url);if(req.method!=='GET'||u.origin!==location.origin)return;
 if(IMMUTABLE.test(u.pathname)){e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(req,copy))}return r})));return}
 const page=req.mode==='navigate';
 const update=fetch(req).then(async r=>{if(r.ok&&r.status!==206){const cache=await caches.open(CACHE);await cache.put(page?u.pathname:req,r.clone());if(page)await cacheAssets(cache,await r.clone().text())}return r});
 e.waitUntil(update.catch(()=>{}));
 e.respondWith(caches.match(page?u.pathname:req,{ignoreSearch:page}).then(hit=>hit||update).catch(()=>Response.error()))});
