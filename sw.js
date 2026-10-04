// iLike service worker: lets the app install and open instantly.
// Bump VERSION when you want every device to drop its old cache.
const VERSION='ilike-v6';
const SHELL=['./','index.html','style.css','app.js','manifest.webmanifest','assets/apple-touch-icon.png','assets/icon-192.png','assets/icon-512.png'];
const LIBS=['cdn.jsdelivr.net','fonts.googleapis.com','fonts.gstatic.com'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(VERSION).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==VERSION).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET')return;
  // Our own files: network first (so updates land), cache when offline
  if(u.origin===location.origin){
    e.respondWith(fetch(r).then(res=>{
      if(res.ok){const c=res.clone();caches.open(VERSION).then(x=>x.put(r,c))}
      return res;
    }).catch(()=>caches.match(r).then(m=>m||(r.mode==='navigate'?caches.match('index.html'):Response.error()))));
    return;
  }
  // Supabase library + fonts: cached copy first, refreshed in the background
  if(LIBS.includes(u.hostname)){
    e.respondWith(caches.open(VERSION).then(c=>c.match(r).then(m=>{
      const f=fetch(r).then(res=>{c.put(r,res.clone());return res}).catch(()=>m);
      return m||f;
    })));
  }
  // Everything else (Supabase API, storage, realtime) goes straight to the network
});
