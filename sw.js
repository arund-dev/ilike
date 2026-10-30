// iLike service worker: lets the app install and open instantly.
// Bump VERSION when you want every device to drop its old cache.
const VERSION='ilike-v42';
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
  // Everything else (Supabase API, storage, realtime) goes straight to the network
});

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
