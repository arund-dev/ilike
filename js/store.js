// ---------- On-device store ----------
// Keeps what you use most on the phone so the app opens instantly with content:
//  - feed, your posts, chats, profiles and settings -> IndexedDB (one snapshot per signed-in user)
//  - photos -> Cache Storage "ilike-img" (filled by sw.js, most recently used kept)
// It trims itself about once a day and is wiped on sign-out. Every call fails quietly:
// if the browser blocks storage the app simply works as before, just without the instant start.
const Store=(()=>{
  const DBN='ilike-cache',ST='kv',AGE=14*864e5,ROWS=20;      // drop snapshots unused for 14 days
  const IMG='ilike-img',IMG_AGE=30*864e5,IMG_MAX=250;         // photos: at most 250, none older than 30 days
  const SWEEP_EVERY=864e5;                                    // trim once a day
  let dbp=null,gen=0;                                         // gen changes on wipe so late writes are dropped

  const db=()=>dbp||(dbp=new Promise(res=>{
    try{
      const q=indexedDB.open(DBN,1);
      q.onupgradeneeded=()=>q.result.createObjectStore(ST,{keyPath:'k'});
      q.onsuccess=()=>res(q.result);
      q.onerror=q.onblocked=()=>res(null);
    }catch(e){res(null)}
  }));
  const run=async(mode,fn,g)=>{
    const d=await db();
    if(!d||(g!==undefined&&g!==gen))return null;
    return new Promise(res=>{
      try{
        const t=d.transaction(ST,mode),r=fn(t.objectStore(ST));
        t.oncomplete=()=>res(r?r.result:null);
        t.onerror=t.onabort=()=>res(null);
      }catch(e){res(null)}
    });
  };
  const uid=()=>S.user?.id;

  async function get(kind){
    const u=uid();if(!u)return null;
    const row=await run('readonly',s=>s.get(u+':'+kind));
    if(!row)return null;
    run('readwrite',s=>s.put({...row,u:Date.now()}));        // remember it was used
    return row.v;
  }
  async function set(kind,v){
    const u=uid();if(!u)return;
    const g=gen,now=Date.now();
    await run('readwrite',s=>s.put({k:u+':'+kind,v,t:now,u:now}),g);
  }

  // Save what the screens need to draw instantly next time
  function save(){
    try{
      if(!S.user||!S.loaded||S.prof?.banned)return;
      const posts=S.posts.slice(0,20),myPosts=S.myPosts.filter(Boolean).slice(0,20),msgs=S.msgs.slice(-150);
      const ids=new Set([S.user.id]);
      posts.concat(myPosts).forEach(p=>{ids.add(p.author_id);(p.sames||[]).forEach(x=>ids.add(x))});
      msgs.forEach(m=>{ids.add(m.sender_id);ids.add(m.to_user)});
      const names={},avs={},roles={};
      ids.forEach(id=>{if(S.names[id])names[id]=S.names[id];if(S.avs[id])avs[id]=S.avs[id];if(S.roles[id])roles[id]=S.roles[id]});
      set('boot',{prof:S.prof,ints:S.ints,mine:[...S.mine],blocked:[...S.blocked],posts,myPosts,msgs,names,avs,roles});
    }catch(e){}
  }
  // Put a saved snapshot into the app state; the normal network load then refreshes everything
  function restore(s){
    try{
      if(s.prof){S.prof=s.prof;applyPrefs(s.prof.theme_prefs)}
      S.ints=s.ints||[];S.im=new Map(S.ints.map(x=>[x.id,x]));
      S.mine=new Set(s.mine||[]);S.snap=new Set(S.mine);
      S.blocked=new Set(s.blocked||[]);
      Object.assign(S.names,s.names);Object.assign(S.avs,s.avs);Object.assign(S.roles,s.roles);
      S.names[S.user.id]=S.name;
      const own=p=>{let o=S.pm.get(p.id);if(!o){o=p;S.pm.set(p.id,o)}return o};
      S.posts=(s.posts||[]).map(own).filter(p=>!bl(p.author_id));
      S.myPosts=(s.myPosts||[]).map(own);
      S.msgs=(s.msgs||[]).filter(m=>!bl(m.sender_id==S.user.id?m.to_user:m.sender_id));
      return true;
    }catch(e){return false}
  }

  // Remove everything: called on sign-out
  async function wipe(){
    gen++;
    await run('readwrite',s=>s.clear());
    try{await caches.delete(IMG)}catch(e){}
  }

  // Remove old and rarely used items
  async function sweep(){
    const now=Date.now(),u=uid();
    const rows=await run('readonly',s=>s.getAll())||[];
    const dead=rows.filter(r=>now-r.u>AGE||(u&&!r.k.startsWith(u+':'))).map(r=>r.k);
    rows.filter(r=>!dead.includes(r.k)).sort((a,b)=>b.u-a.u).slice(ROWS).forEach(r=>dead.push(r.k));
    if(dead.length)await run('readwrite',s=>{dead.forEach(k=>s.delete(k))});
    try{
      const c=await caches.open(IMG),old=[];
      for(const q of await c.keys()){
        const r=await c.match(q),d=r&&Date.parse(r.headers.get('date')||'');
        if(d&&now-d>IMG_AGE)old.push(q);
      }
      await Promise.all(old.map(q=>c.delete(q)));
      const rest=await c.keys();                              // oldest first: sw.js moves a photo to the end each time it is used
      await Promise.all(rest.slice(0,Math.max(0,rest.length-IMG_MAX)).map(q=>c.delete(q)));
    }catch(e){}
  }
  function maybeSweep(){
    try{
      const last=+localStorage.getItem('ilike_sweep')||0;
      if(Date.now()-last<SWEEP_EVERY)return;
      localStorage.setItem('ilike_sweep',String(Date.now()));
    }catch(e){return}
    setTimeout(()=>sweep().catch(()=>{}),4000);               // after the app has settled
  }

  // keep the snapshot fresh when the app is put away
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')save()});
  return{get,set,save,restore,wipe,sweep,maybeSweep};
})();
