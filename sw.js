// iLike service worker: lets the app install and open instantly.
// Bump VERSION when you want every device to drop its old cache.
const VERSION='ilike-v60';
const IMG='ilike-img',IMG_MAX=250;   // photo store (kept across updates; trimmed by js/store.js and below)
const SHELL=['./','index.html','style.css','js/catalog.js','js/core.js','js/store.js','js/auth.js','js/data.js','js/feed.js','js/photos.js','js/video.js','js/profile.js','js/settings.js','js/chat.js','js/notifs.js','js/members.js','js/events.js','js/tickets.js','js/extras.js','js/safety.js','js/moderation.js','js/legal.js','js/admin.js','js/main.js','manifest.webmanifest','assets/apple-touch-icon.png','assets/icon-192.png','assets/icon-512.png'];
const LIBS=['cdn.jsdelivr.net','fonts.googleapis.com','fonts.gstatic.com'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(VERSION).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==VERSION&&x!==IMG).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET')return;
  // Our own files: network first (so updates land). If the network is slow (3 s) or down, use the cached copy.
  if(u.origin===location.origin){
    e.respondWith(new Promise(resolve=>{
      let done=false;
      const fallback=()=>caches.match(r).then(m=>m||(r.mode==='navigate'?caches.match('index.html'):null));
      const timer=setTimeout(()=>fallback().then(m=>{if(m&&!done){done=true;resolve(m)}}),3000);
      fetch(r).then(res=>{
        clearTimeout(timer);
        if(res.ok){const c=res.clone();caches.open(VERSION).then(x=>x.put(r,c))}
        if(!done){done=true;resolve(res)}
      }).catch(()=>{
        clearTimeout(timer);
        if(!done)fallback().then(m=>{done=true;resolve(m||Response.error())});
      });
    }));
    return;
  }
  // Supabase library + fonts: cached copy first, refreshed in the background
  if(LIBS.includes(u.hostname)){
    e.respondWith(caches.open(VERSION).then(c=>c.match(r).then(m=>{
      const f=fetch(r).then(res=>{c.put(r,res.clone());return res}).catch(()=>m);
      return m||f;
    })));
  }
  // Photos from Supabase storage: kept on the device, most recently used last, so they open instantly
  else if(u.hostname.endsWith('.supabase.co')&&u.pathname.startsWith('/storage/v1/object/public/')){
    e.respondWith(photo(r));
  }
  // Everything else (Supabase API, realtime) goes straight to the network
});
let misses=0;
async function photo(r){
  try{
    const c=await caches.open(IMG),hit=await c.match(r.url);
    if(hit){c.put(r.url,hit.clone()).catch(()=>{});return hit}   // re-saving moves it to the end of the list
    const res=await fetch(r.url,{mode:'cors',credentials:'omit'});
    if(res.ok){
      c.put(r.url,res.clone()).catch(()=>{});
      if(++misses%20===0)c.keys().then(k=>k.slice(0,Math.max(0,k.length-IMG_MAX)).forEach(x=>c.delete(x)));
    }
    return res;
  }catch(err){return fetch(r)}
}

// Push notifications: the server sends {title, body, url, tag}; we always show it.
self.addEventListener('push',e=>{
  let d={};try{d=e.data.json()}catch(x){}
  e.waitUntil(self.registration.showNotification(d.title||'iLike',{
    body:d.body||'',icon:'assets/icon-192.png',badge:'assets/icon-192.png',tag:d.tag||undefined,data:{url:d.url||'./'}
  }));
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  const url=(e.notification.data&&e.notification.data.url)||'./';
  e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    for(const c of list){c.postMessage({type:'open',url});return c.focus()}
    return clients.openWindow(url);
  }));
});
