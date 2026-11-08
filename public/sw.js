// 安装时缓存常用资源。页面和未版本化资源先用缓存，同时在后台更新。
const CACHE='daybreak-v56';
const IMMUTABLE=/\/_next\/static\/|\/fonts\/|\/rws\/|\/moon\/|\.(?:woff2|png|svg|webp|webmanifest)$/;
const ASSET=/(?:href|src)="(\/(?:_next\/static|js)\/[^"?#]+)"/g;
async function cacheAssets(cache,html){const urls=new Set([...html.matchAll(ASSET)].map(m=>m[1]));await Promise.all([...urls].map(u=>cache.match(u).then(hit=>hit||fetch(u).then(r=>r.ok?cache.put(u,r):undefined)).catch(()=>{})))}
async function precache(){const cache=await caches.open(CACHE);await Promise.all(['/style.css','/epic.css','/moon/moon-1024.webp'].map(u=>fetch(u).then(r=>r.ok&&cache.put(u,r)).catch(()=>{})))}
self.addEventListener('install',e=>e.waitUntil(precache().catch(()=>{}).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('daybreak-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 const req=e.request,u=new URL(req.url);
 if(req.method!=='GET'||u.origin!==location.origin)return;
 const page=req.mode==='navigate';
 const key=page?u.pathname:req;
 const cached=caches.match(key,{ignoreSearch:page}).catch(()=>undefined);
 const network=IMMUTABLE.test(u.pathname)?cached.then(hit=>hit?undefined:fetch(req)):fetch(req);
 const response=network.then(r=>{
  if(r?.ok&&r.status!==206){
   const copy=r.clone();
   e.waitUntil(cached.then(async hit=>{
    const cache=await caches.open(CACHE);
    // 只有用旧页面响应时，浏览器才不会自己请求新页面的资源。
    if(page&&hit)await cacheAssets(cache,await copy.clone().text());
    await cache.put(key,copy);
   }).catch(()=>{}));
  }
  return r;
 });
 e.waitUntil(response.catch(()=>{}));
 e.respondWith(cached.then(hit=>hit||response).catch(()=>Response.error()));
});
