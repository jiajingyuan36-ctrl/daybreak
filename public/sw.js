const CACHE='daybreak-v65';
const STABLE=/^\/(?:_next\/static\/|js\/|fonts\/|rws\/|moon\/|(?:epic|style)\.css$)|\.(?:woff2|png|svg|webp|webmanifest)$/;
const ASSET=/(?:href|src)="(\/(?:_next\/static\/|js\/|fonts\/|(?:epic|style)\.css)[^"]*)"/g;
const ENTRY_PATHS=['/','/ritual/'];
const refreshes=new Map();

async function cacheAssets(cache,html){
 const urls=new Set([...html.matchAll(ASSET)].map(m=>m[1].replaceAll('&amp;','&')));
 await Promise.all([...urls].map(async url=>{
  try{
   if(await cache.match(url))return;
   const response=await fetch(url,{priority:'low'});
   if(response.ok)await cache.put(url,response);
  }catch{}
 }));
}

async function refreshEntry(cache,path,request=path){
 const response=await fetch(request,{priority:'low'});
 if(!response.ok)return;
 await cacheAssets(cache,await response.clone().text());
 await cache.put(path,response);
}

self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const name of await caches.keys())if(name.startsWith('daybreak-')&&name!==CACHE)await caches.delete(name);
 await self.clients.claim();
})()));

self.addEventListener('message',event=>{
 if(event.data!=='warm-entry')return;
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await Promise.all(ENTRY_PATHS.map(async path=>{
   if(await cache.match(path)||refreshes.has(path))return;
   refreshes.set(path,Date.now());
   try{await refreshEntry(cache,path)}catch{refreshes.delete(path)}
  }));
 })().catch(()=>{}));
});

self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==location.origin||request.headers.has('Range'))return;
 const page=request.mode==='navigate';
 const key=page?url.pathname:request;
 const cache=caches.open(CACHE);
 const cached=cache.then(store=>store.match(key)).catch(()=>undefined);
 const refresh=cached.then(async hit=>{
  if(hit&&page){
   if(Date.now()-(refreshes.get(key)??0)<60_000)return;
   refreshes.set(key,Date.now());
   try{await refreshEntry(await cache,key,request)}catch{refreshes.delete(key)}
  }else if(!hit||!STABLE.test(url.pathname)){
   return fetch(request);
  }
 });
 const network=refresh.then(response=>{
  if(response?.ok&&response.status!==206){
   const copy=response.clone();
   event.waitUntil(cache.then(store=>store.put(key,copy)).catch(()=>{}));
  }
  return response;
 });
 event.waitUntil(network.catch(()=>{}));
 event.respondWith(cached.then(hit=>hit||network).catch(()=>Response.error()));
});
