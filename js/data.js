// ---------- Data Boot ----------
async function boot(){
  if(location.hash.includes('type=recovery'))S.rec=true;
  const iv=location.hash.match(/^#invite=([A-Za-z0-9_-]{3,40})/i);if(iv){S.invite=iv[1].toUpperCase();S.mode='signup';history.replaceState(null,'',location.pathname)}
  const dl=location.hash.match(/^#post=([0-9a-f-]{36})/i);if(dl)S.deep=dl[1];
  const dm=location.hash.match(/^#dm=([0-9a-f-]{36})/i);if(dm)S.deepDm=dm[1];
  const evLink=location.hash.match(/^#event=([0-9a-f-]{36})/i);if(evLink)S.deepEvent=evLink[1];

  const{data:{session}}=await sb.auth.getSession();
  S.user=session?.user||null;
  sb.auth.onAuthStateChange((e,s)=>{
    const was=S.user?.id;S.user=s?.user||null;
    if(e==='PASSWORD_RECOVERY'){S.rec=true;if(S.loaded)recoverUi()}
    if(S.user?.id!==was)setTimeout(load,0)});
  load();
}

async function load(){
  if(!S.user){
    backGuardReady=false;
    if(S.ch){sb.removeChannel(S.ch);S.ch=null}
    S.posts=[];S.fCur=null;S.fEnd=false;S.fBusy=false;S.fErr=false;S.myPosts=[];S.pm=new Map();S.mine=new Set();S.names={};S.avs={};S.roles={};S.role='user';S.blocked=new Set();S.reports=null;S.nrep=0;S.msgs=[];S.notifs=[];S.prof=null;S.loaded=false;
    S.mt=0;S.liked=null;S.fol=new Set();S.folrs=new Set();S.evs=null;S.evm=new Map();S.pev=null;S.pevOpen=false;S.eventAuthorized=false;S.eventComments=new Map();S.evChats=new Map();S.evGallery=new Map();S.evChatErr=new Map();S.evUnread=new Map();evLiveStop();S.achMine=new Map();S.achReady=false;S.pf=null;leaveRoom();
    Store.wipe();   // signed out: nothing stays on the device
    renderAuth();show('auth');return;
  }
  S.name=S.user.user_metadata?.display_name||(S.user.email||'Me').split('@')[0];
  // Instant start: draw the last saved feed, chats and settings now; the network load below refreshes them
  if(!S.loaded){const snap=await Store.get('boot');if(snap&&S.user&&Store.restore(snap)){draw();show(S.tab)}}
  await sb.from('profiles').upsert({id:S.user.id,username:'user_'+S.user.id.replace(/-/g,'').slice(0,8),display_name:S.name},{onConflict:'id',ignoreDuplicates:true});
  const[pr,i,u,bk,oa]=await Promise.all([
    sb.from('profiles').select('username,display_name,bio,city,theme_prefs,avatar_url,banner_url,role,muted_until,banned').eq('id',S.user.id).single(),
    sb.from('interests').select('*').order('category').order('name'),
    sb.from('user_interests').select('interest_id').eq('user_id',S.user.id),
    sb.from('blocks').select('blocked_id').eq('blocker_id',S.user.id),
    sb.from('profiles').select('onboarded_at').eq('id',S.user.id).maybeSingle()]);
  S.prof=pr.data||{username:'',display_name:S.name,bio:null,city:null,theme_prefs:null,avatar_url:null,banner_url:null};
  if(S.prof.banned){S.err='This account has been suspended.';S.good=false;S.mode='login';await sb.auth.signOut();return}
  S.name=S.prof.display_name||S.name;
  S.blocked=new Set((bk.data||[]).map(x=>x.blocked_id));
  S.role=S.prof.role||'user';S.roles[S.user.id]=S.role;
  const eventAuth=await sb.from('event_authorizations').select('user_id').eq('user_id',S.user.id).maybeSingle();
  S.eventAuthorized=!!eventAuth.data;
  if(S.prof.avatar_url)S.avs[S.user.id]=S.prof.avatar_url;
  applyPrefs(S.prof.theme_prefs);
  if(i.error)toast('Could not load interests');
  S.ints=i.data||[];S.im=new Map(S.ints.map(x=>[x.id,x]));
  if(isAdmin()){const ce=await syncInterestCatalog();if(ce)toast('Interest catalog sync failed: '+ce.message);else await loadInts()}
  if(isMod())loadRepCount();
  S.mine=new Set((u.data||[]).map(r=>r.interest_id));S.snap=new Set(S.mine);
  S.names[S.user.id]=S.name;
  S.obLegacy=!!oa.error;
  const needOb=oa.error?!S.mine.size:!oa.data?.onboarded_at;
  if(needOb){S.pick=new Set();S.obStep=S.mine.size?1:0;renderOb();show('onb');return}
  subscribe();
  S.skel=true;draw();show(S.tab);
  try{await Promise.all([loadPosts(),loadPeople(),loadMsgs(),loadNotifs(),loadFollows(),loadEvents(),loadAch()])}
  finally{S.skel=false}
  draw();show(S.tab);S.loaded=true;setupBackGuard();
  Store.save();Store.maybeSweep();
  if(S.rec)recoverUi();
  if(S.deep){const d=S.deep;S.deep=null;openPostId(d)}
  if(S.deepDm){const d=S.deepDm;S.deepDm=null;openDm(d)}
  if(S.deepEvent){const dev=S.deepEvent;S.deepEvent=null;openEvent(dev)}
  pushSync();
}

async function syncInterestCatalog(){
  const{data,error}=await sb.from('interests').select('id,name,emoji,color,category,kind');
  if(error)return error;
  const inserts=[],updates=[];
  for(const item of CATALOG_INTERESTS){
    const current=(data||[]).find(row=>row.kind!='artist'&&row.name.toLowerCase()===item.name.toLowerCase());
    if(!current){inserts.push(item);continue}
    const changes={};
    for(const field of ['emoji','color','category'])if(current[field]!==item[field])changes[field]=item[field];
    if(Object.keys(changes).length)updates.push(sb.from('interests').update(changes).eq('id',current.id));
  }
  const results=await Promise.all(updates);
  const updateError=results.find(result=>result.error)?.error;
  if(updateError)return updateError;
  if(inserts.length){
    const result=await sb.from('interests').insert(inserts);
    if(result.error&&result.error.code!=='23505')return result.error;
  }
  return null;
}

async function getProfiles(ids){
  ids=[...new Set(ids)].filter(Boolean);if(!ids.length)return;
  const a=await sb.from('profiles').select('id,display_name,avatar_url,role').in('id',ids);
  (a.data||[]).forEach(x=>{S.names[x.id]=x.display_name;S.roles[x.id]=x.role||'user';if(x.avatar_url)S.avs[x.id]=x.avatar_url;else delete S.avs[x.id]});
}

const COLS='id,body,created_at,edited_at,author_id,layout,video_url,video_poster,video_secs';
const FEED_PAGE=20;   // posts loaded at start and on each "scroll to the end" (was 50)
async function replyCounts(ids){
  const m=new Map(),c=await sb.from('posts').select('id,replies(count)').in('id',ids);
  if(!c.error&&c.data){c.data.forEach(x=>m.set(x.id,x.replies?.[0]?.count||0));return m}
  const f=await fetchAll(()=>sb.from('replies').select('post_id').in('post_id',ids).order('post_id').order('id'));
  (f.data||[]).forEach(q=>m.set(q.post_id,(m.get(q.post_id)||0)+1));
  return m;
}
async function hydrate(rows){
  if(!rows.length)return[];
  const ids=rows.map(x=>x.id);
  const[t,s,r,im]=await Promise.all([
    sb.from('post_interests').select('post_id,interest_id').in('post_id',ids),
    fetchAll(()=>sb.from('sames').select('post_id,user_id').in('post_id',ids).order('post_id').order('user_id')),
    replyCounts(ids),
    sb.from('post_images').select('post_id,url,position').in('post_id',ids).order('position')]);
  await getProfiles([...rows.map(x=>x.author_id),...(s.data||[]).map(x=>x.user_id)]);
  await ensureInts((t.data||[]).map(q=>q.interest_id));
  return rows.map(x=>{
    let o=S.pm.get(x.id);if(!o){o={};S.pm.set(x.id,o)}
    return Object.assign(o,x,{
      tags:(t.data||[]).filter(q=>q.post_id===x.id).map(q=>q.interest_id),
      sames:(s.data||[]).filter(q=>q.post_id===x.id).map(q=>q.user_id),
      imgs:(im.data||[]).filter(q=>q.post_id===x.id).map(q=>q.url),
      rc:r.get(x.id)||0})});
}
async function loadPosts(){
  const[f,m]=await Promise.all([
    sb.from('posts').select(COLS).order('created_at',{ascending:false}).limit(FEED_PAGE),
    sb.from('posts').select(COLS).eq('author_id',S.user.id).order('created_at',{ascending:false}).limit(100)]);
  if(f.error||m.error){toast('Could not load posts');return}
  const rows=[...f.data];
  m.data.forEach(r=>{if(!rows.some(x=>x.id===r.id))rows.push(r)});
  const by=new Map((await hydrate(rows)).map(p=>[p.id,p]));
  const fresh=f.data.map(r=>by.get(r.id)).filter(p=>!bl(p.author_id));
  const last=f.data.length?f.data[f.data.length-1].created_at:null;
  // Keep older posts the person already scrolled to, so a refresh does not throw them away
  const keep=(S.fCur&&last)?S.posts.filter(p=>p.created_at<last&&!bl(p.author_id)):[];
  S.posts=[...fresh,...keep];
  if(!keep.length){S.fCur=last;S.fEnd=f.data.length<FEED_PAGE;S.fErr=false}
  S.myPosts=m.data.map(r=>by.get(r.id));
}
// Load the next 50 older posts (called by scrolling to the end of the feed or by the button)
async function morePosts(){
  if(S.fBusy||S.fEnd||!S.fCur)return;
  S.fBusy=true;S.fErr=false;home();
  try{
    const f=await sb.from('posts').select(COLS).order('created_at',{ascending:false}).lt('created_at',S.fCur).limit(FEED_PAGE);
    if(f.error)throw f.error;
    const rows=await hydrate(f.data);
    if(f.data.length)S.fCur=f.data[f.data.length-1].created_at;
    if(f.data.length<FEED_PAGE)S.fEnd=true;
    const have=new Set(S.posts.map(p=>p.id));
    S.posts.push(...rows.filter(p=>!have.has(p.id)&&!bl(p.author_id)));
  }catch(e){S.fErr=true}
  S.fBusy=false;
  draw();
}
let fmObs;
function watchMore(){
  if(fmObs){fmObs.disconnect();fmObs=null}
  const el=$('#fmore'),root=$('#feed');
  if(!el||!root||!('IntersectionObserver' in window))return;
  fmObs=new IntersectionObserver(e=>{if(e.some(x=>x.isIntersecting)&&!S.fErr)morePosts()},{root,rootMargin:'500px'});
  fmObs.observe(el);
}
async function loadPeople(){
  const{data}=await fetchAll(()=>sb.from('user_interests').select('user_id,interest_id,profiles(display_name,avatar_url,role)').order('user_id').order('interest_id'));
  const m={},c={};
  (data||[]).forEach(r=>{
    c[r.interest_id]=(c[r.interest_id]||0)+1;if(r.user_id===S.user.id)return;
    (m[r.user_id]||(m[r.user_id]={id:r.user_id,name:r.profiles?.display_name||'Member',ids:[]})).ids.push(r.interest_id);
    if(r.profiles?.avatar_url)S.avs[r.user_id]=r.profiles.avatar_url;
    S.roles[r.user_id]=r.profiles?.role||'user';
  });
  S.people=Object.values(m).filter(p=>!bl(p.id));S.cnt=c;S.people.forEach(p=>S.names[p.id]=p.name);
}
async function ensurePost(id){
  if(findPost(id))return true;
  const r=await sb.from('posts').select(COLS).eq('id',id).maybeSingle();
  if(!r.data){toast('That post is gone');return false}
  await hydrate([r.data]);return true;
}
async function openPostId(id){if(await ensurePost(id))openPost(id)}
addEventListener('hashchange',()=>{
  const m=location.hash.match(/^#post=([0-9a-f-]{36})/i);if(m&&S.loaded)openPostId(m[1]);
  const d=location.hash.match(/^#dm=([0-9a-f-]{36})/i);if(d&&S.loaded)openDm(d[1]);
  const ev=location.hash.match(/^#event=([0-9a-f-]{36})/i);if(ev&&S.loaded)openEvent(ev[1]);
});
