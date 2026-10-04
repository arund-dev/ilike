// ---- Supabase connection (both values are safe to be public) ----
const SUPABASE_URL="https://rgrtwewhiylwkxgbcgyx.supabase.co";
const SUPABASE_KEY="sb_publishable_frBJksxES3J_AZICQ619fw_6e7hP59z";
const sb=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

const $=s=>document.querySelector(s);
const S={user:null,name:'',prof:null,ints:[],im:new Map(),mine:new Set(),snap:new Set(),posts:[],myPosts:[],pm:new Map(),people:[],cnt:{},names:{},avs:{},F:'All',tab:'home',mode:'login',err:'',good:false,pick:new Set(),cfFn:null,th:null,reps:null,pmId:null,edId:null,edRm:new Set(),photos:[],msgs:[],notifs:[],nposts:{},dm:null,ch:null,deep:null,rec:false,loaded:false,fol:new Set(),folrs:new Set(),evs:null,evm:new Map(),evId:null,evEm:'📍',room:null,cm:null,cch:null,pf:null,pkm:'int',achCat:[],achMine:new Map(),achReady:false};
const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ago=d=>{const m=Math.floor((Date.now()-new Date(d))/60000);return m<1?'just now':m<60?m+'m ago':m<1440?Math.floor(m/60)+'h ago':Math.floor(m/1440)+'d ago'};
const tm=d=>{const x=new Date(d),t=x.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});return x.toDateString()==new Date().toDateString()?t:x.toLocaleDateString([],{month:'short',day:'numeric'})+' '+t};
const iname=n=>S.im.get(n)?.name||'';
const col=n=>esc(S.im.get(n)?.color||'var(--brand)');
const em=n=>esc(S.im.get(n)?.emoji||(S.im.get(n)?.kind=='artist'?'🎤':'✦'));
const cat=n=>S.im.get(n)?.category;
const nm=id=>S.names[id]||(id==S.user?.id?S.name:'Member');
const PAL=['#8B5CF6','#EC4899','#22C55E','#F59E0B','#14B8A6','#3B82F6','#EF4444'];
// Developer-managed menu. Add categories and choices here; the app syncs them to Supabase on login.
const INTEREST_CATALOG=[
  {category:'Creative',color:'#EC3996',items:[['Photography','📷'],['Reading','📚']]},
  {category:'Food',color:'#F59E0B',items:[['Coffee','☕'],['Kottu','🍲']]},
  {category:'Games',color:'#8B5CF6',items:[['Gaming','🎮']]},
  {category:'Music',color:'#3B82F6',items:[['Pop','🎤'],['Rock','🎸']]},
  {category:'Outdoors',color:'#14B8A6',items:[['Travel','🧭']]},
  {category:'Shows',color:'#EF4444',items:[['Anime','🍥'],['Cartoons','📺']]}
];
const CATALOG_INTERESTS=INTEREST_CATALOG.flatMap(group=>group.items.map(([name,emoji])=>({name,emoji,color:group.color,category:group.category})));
const ac=id=>id==S.user?.id?'var(--brand)':PAL[[...String(id)].reduce((a,c)=>a+c.charCodeAt(0),0)%PAL.length];
// Avatar: profile photo if the person has one, otherwise their first letter
const av=(id,z='')=>{const u=S.avs[id];return `<span class="av ${z}" style="--c:${ac(id)}${u?`;background-image:url('${esc(u)}');background-size:cover;background-position:center`:''}">${u?'':esc((nm(id)||'?')[0].toUpperCase())}</span>`};
function setMyAv(el){
  const u=S.avs[S.user.id];
  el.textContent=u?'':(S.name||'?')[0].toUpperCase();
  el.style.backgroundImage=u?`url('${u}')`:'';el.style.backgroundSize='cover';el.style.backgroundPosition='center';
}
const chip=n=>`<span class="chip" style="--c:${col(n)}">${em(n)} ${esc(iname(n))}</span>`;
const tgb=n=>S.mine.has(n)?chip(n):`<button class="chip tg" style="--c:${col(n)}" onclick="ask(${n})">${em(n)} ${esc(iname(n))}</button>`;
const say=l=>!l.length?'':l.length==1?l[0]+' said Same':l.length==2?l.join(' & ')+' said Same':l[0]+', '+l[1]+' & others said Same';
const so=p=>{const a=p.sames.filter(x=>x!=S.user.id);return p.sames.includes(S.user.id)?[S.user.id,...a]:a};
const sm=p=>{const o=so(p);return (o.length?`<span class="stk">${o.slice(0,3).map(x=>av(x,'sm')).join('')}</span>`:'')+esc(say(o.map(x=>x==S.user.id?'You':nm(x))))};
const findPost=id=>S.pm.get(String(id));
let toastT;
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),2200)}

// Share a post link (or the app link)
const postUrl=id=>location.origin+location.pathname+'#post='+id;
function share(id){
  const url=id?postUrl(id):location.href;
  if(navigator.share){navigator.share({title:'iLike',url}).catch(()=>{});return}
  if(navigator.clipboard)navigator.clipboard.writeText(url).then(()=>toast('Link copied'),()=>toast("Couldn't copy link"));
  else toast("Couldn't copy link")
}

function show(id){
  if(id!='auth'&&id!='onb')S.tab=id;
  document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('on',s.id=='s-'+id));
  document.body.classList.toggle('noapp',id=='auth'||id=='onb');
  document.querySelectorAll('#nav button').forEach(x=>x.classList.toggle('on',x.dataset.s==id));
}

// confirm dialog used everywhere (remove interest, delete post, delete reply)
function confirmBox(title,yes,fn){S.cfFn=fn;$('#cft').textContent=title;$('#cfy').textContent=yes;$('#cf').classList.add('on')}
function cfyes(){$('#cf').classList.remove('on');const f=S.cfFn;S.cfFn=null;if(f)f()}

// ---------- Photos: resize in the browser, upload to Supabase Storage ----------
function prep(file,max,square,ratio){
  return new Promise((res,rej)=>{
    const url=URL.createObjectURL(file),im=new Image();
    im.onload=()=>{
      URL.revokeObjectURL(url);
      let sw=im.naturalWidth,sh=im.naturalHeight,sx=0,sy=0,w,h;
      if(ratio){let cw=sw,ch=sw/ratio;if(ch>sh){ch=sh;cw=sh*ratio}sx=(sw-cw)/2;sy=(sh-ch)/2;sw=cw;sh=ch;w=Math.min(max,Math.round(cw));h=Math.round(w/ratio)}
      else if(square){const s=Math.min(sw,sh);sx=(sw-s)/2;sy=(sh-s)/2;sw=sh=s;w=h=Math.min(max,s)}
      else{const k=Math.min(1,max/Math.max(sw,sh));w=Math.round(sw*k);h=Math.round(sh*k)}
      const c=document.createElement('canvas');c.width=w;c.height=h;
      c.getContext('2d').drawImage(im,sx,sy,sw,sh,0,0,w,h);
      c.toBlob(b=>b?res(b):rej(new Error('Could not read that photo')),'image/jpeg',.85);
    };
    im.onerror=()=>{URL.revokeObjectURL(url);rej(new Error('Could not read that photo'))};
    im.src=url;
  });
}
async function upload(bucket,blob){
  const path=`${S.user.id}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.jpg`;
  const{error}=await sb.storage.from(bucket).upload(path,blob,{contentType:'image/jpeg',cacheControl:'31536000'});
  if(error)throw error;
  return sb.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
const pathOf=(url,bucket)=>{const i=url.indexOf('/'+bucket+'/');return i<0?null:decodeURIComponent(url.slice(i+bucket.length+2))};
async function rmFiles(bucket,urls){
  const p=urls.map(u=>pathOf(u,bucket)).filter(Boolean);
  if(p.length)await sb.storage.from(bucket).remove(p);
}
function openLb(u){$('#lbi').src=u;$('#lb').classList.add('on')}
function closeLb(){$('#lb').classList.remove('on')}
document.addEventListener('click',e=>{const i=e.target.closest('.pimgs img');if(i)openLb(i.src)});

// ---------- Auth ----------
function renderAuth(){
  const su=S.mode=='signup';
  $('#af').innerHTML=`${su?'<input class="fi" id="an" placeholder="Your name" autocomplete="name">':''}<input class="fi" id="ae" type="email" placeholder="Email" autocomplete="email"><input class="fi" id="ap" type="password" placeholder="Password (6+ characters)" autocomplete="${su?'new':'current'}-password" onkeydown="if(event.key==='Enter')go()"><div class="err ${S.good?'ok':''}">${esc(S.err)}</div><button class="btn" style="width:100%" id="ago" onclick="go()">${su?'Create account':'Log in'}</button>${su?'':'<button class="link" onclick="forgot()">Forgot password?</button>'}<button class="link" onclick="swap()">${su?'Have an account? Log in':'New here? Create an account'}</button>`;
}
function swap(){S.mode=S.mode=='login'?'signup':'login';S.err='';S.good=false;renderAuth()}
async function go(){
  const email=$('#ae').value.trim(),password=$('#ap').value,name=$('#an')?.value.trim();
  $('#ago').disabled=true;S.err='';S.good=false;
  const r=S.mode=='signup'
    ?await sb.auth.signUp({email,password,options:{data:{display_name:name||email.split('@')[0]}}})
    :await sb.auth.signInWithPassword({email,password});
  if(r.error)S.err=r.error.message;
  else if(S.mode=='signup'&&!r.data.session){S.mode='login';S.err='Check your email to confirm your account, then log in.';S.good=true}
  else return;
  renderAuth();$('#ae').value=email;
}
async function forgot(){
  const email=$('#ae').value.trim();
  if(!email){S.err='Type your email first.';S.good=false;renderAuth();return}
  const{error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});
  S.err=error?error.message:'Check your email for a reset link.';S.good=!error;
  renderAuth();$('#ae').value=email;
}
async function logout(){await sb.auth.signOut();S.tab='home';S.F='All';S.loaded=false}

// ---------- Onboarding (first login) ----------
function renderOb(){
  const L=S.ints.filter(i=>i.kind!='artist'),cats=[...new Set(L.map(i=>i.category))];
  $('#ob').innerHTML=`<h2 style="margin:18px 0 6px">What do you like?</h2><p class="mute">Pick at least 3. Your feed is built from these.</p>${
    cats.map(c=>`<div class="cath" style="color:${col(L.find(i=>i.category===c).id)}">${esc(c)}</div><div class="pkl">${L.filter(i=>i.category===c).map(i=>`<button class="fc" style="--c:${col(i.id)}" onclick="obPick(this,${i.id})">${em(i.id)} ${esc(i.name)}</button>`).join('')}</div>`).join('')||'<div class="empty">No interests found. Add rows to the interests table in Supabase.</div>'
  }<div class="err" id="oe"></div><button class="btn" id="obs" style="width:100%" onclick="saveOb(this)" disabled>Save and continue (0)</button>`;
}
function obPick(b,id){S.pick.has(id)?S.pick.delete(id):S.pick.add(id);b.classList.toggle('on');const s=$('#obs');s.disabled=S.pick.size<3;s.textContent='Save and continue ('+S.pick.size+')'}
async function saveOb(b){
  b.disabled=true;
  const{error}=await sb.from('user_interests').insert([...S.pick].map(n=>({user_id:S.user.id,interest_id:n})));
  if(error){$('#oe').textContent=error.message;b.disabled=false;return}
  load();
}

// ---------- Data ----------
async function boot(){
  if(location.hash.includes('type=recovery'))S.rec=true;
  const dl=location.hash.match(/^#post=([0-9a-f-]{36})/i);if(dl)S.deep=dl[1];
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
    if(S.ch){sb.removeChannel(S.ch);S.ch=null}
    S.posts=[];S.myPosts=[];S.pm=new Map();S.mine=new Set();S.names={};S.avs={};S.msgs=[];S.notifs=[];S.prof=null;S.loaded=false;
    S.fol=new Set();S.folrs=new Set();S.evs=null;S.evm=new Map();S.achMine=new Map();S.achReady=false;S.pf=null;leaveRoom();
    renderAuth();show('auth');return;
  }
  S.name=S.user.user_metadata?.display_name||(S.user.email||'Me').split('@')[0];
  await sb.from('profiles').upsert({id:S.user.id,username:'user_'+S.user.id.replace(/-/g,'').slice(0,8),display_name:S.name},{onConflict:'id',ignoreDuplicates:true});
  const catalogError=await syncInterestCatalog();
  if(catalogError)toast('Interest catalog sync failed: '+catalogError.message);
  const[pr,i,u]=await Promise.all([
    sb.from('profiles').select('username,display_name,bio,city,theme_prefs,avatar_url,banner_url').eq('id',S.user.id).single(),
    sb.from('interests').select('*').order('category').order('name'),
    sb.from('user_interests').select('interest_id').eq('user_id',S.user.id)]);
  S.prof=pr.data||{username:'',display_name:S.name,bio:null,city:null,theme_prefs:null,avatar_url:null,banner_url:null};
  S.name=S.prof.display_name||S.name;
  if(S.prof.avatar_url)S.avs[S.user.id]=S.prof.avatar_url;
  applyPrefs(S.prof.theme_prefs);
  if(i.error)toast('Could not load interests');
  S.ints=i.data||[];S.im=new Map(S.ints.map(x=>[x.id,x]));
  S.mine=new Set((u.data||[]).map(r=>r.interest_id));S.snap=new Set(S.mine);
  S.names[S.user.id]=S.name;
  if(!S.mine.size){S.pick=new Set();renderOb();show('onb');return}
  subscribe();
  S.skel=true;draw();show(S.tab);
  try{await Promise.all([loadPosts(),loadPeople(),loadMsgs(),loadNotifs(),loadFollows(),loadEvents(),loadAch()])}
  finally{S.skel=false}
  draw();show(S.tab);S.loaded=true;
  if(S.rec)recoverUi();
  if(S.deep){const d=S.deep;S.deep=null;openPostId(d)}
}

// Keep curated entries and their developer-assigned categories in sync without changing their IDs.
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

// Names + profile photos for a list of people
async function getProfiles(ids){
  ids=[...new Set(ids)].filter(Boolean);if(!ids.length)return;
  const a=await sb.from('profiles').select('id,display_name,avatar_url').in('id',ids);
  (a.data||[]).forEach(x=>{S.names[x.id]=x.display_name;if(x.avatar_url)S.avs[x.id]=x.avatar_url;else delete S.avs[x.id]});
}

// One query for the feed, one for my own posts, then fill in tags / photos / sames / reply counts / names
const COLS='id,body,created_at,edited_at,author_id';
async function hydrate(rows){
  if(!rows.length)return[];
  const ids=rows.map(x=>x.id);
  const[t,s,r,im]=await Promise.all([
    sb.from('post_interests').select('post_id,interest_id').in('post_id',ids),
    sb.from('sames').select('post_id,user_id').in('post_id',ids),
    sb.from('replies').select('post_id').in('post_id',ids),
    sb.from('post_images').select('post_id,url,position').in('post_id',ids).order('position')]);
  await getProfiles([...rows.map(x=>x.author_id),...(s.data||[]).map(x=>x.user_id)]);
  await ensureInts((t.data||[]).map(q=>q.interest_id));
  return rows.map(x=>{
    let o=S.pm.get(x.id);if(!o){o={};S.pm.set(x.id,o)}
    return Object.assign(o,x,{
      tags:(t.data||[]).filter(q=>q.post_id===x.id).map(q=>q.interest_id),
      sames:(s.data||[]).filter(q=>q.post_id===x.id).map(q=>q.user_id),
      imgs:(im.data||[]).filter(q=>q.post_id===x.id).map(q=>q.url),
      rc:(r.data||[]).filter(q=>q.post_id===x.id).length})});
}
async function loadPosts(){
  const[f,m]=await Promise.all([
    sb.from('posts').select(COLS).order('created_at',{ascending:false}).limit(50),
    sb.from('posts').select(COLS).eq('author_id',S.user.id).order('created_at',{ascending:false}).limit(100)]);
  if(f.error||m.error){toast('Could not load posts');return}
  const rows=[...f.data];
  m.data.forEach(r=>{if(!rows.some(x=>x.id===r.id))rows.push(r)});
  const by=new Map((await hydrate(rows)).map(p=>[p.id,p]));
  S.posts=f.data.map(r=>by.get(r.id));
  S.myPosts=m.data.map(r=>by.get(r.id));
}
async function loadPeople(){
  const{data}=await sb.from('user_interests').select('user_id,interest_id,profiles(display_name,avatar_url)');
  const m={},c={};
  (data||[]).forEach(r=>{
    c[r.interest_id]=(c[r.interest_id]||0)+1;if(r.user_id===S.user.id)return;
    (m[r.user_id]||(m[r.user_id]={id:r.user_id,name:r.profiles?.display_name||'Member',ids:[]})).ids.push(r.interest_id);
    if(r.profiles?.avatar_url)S.avs[r.user_id]=r.profiles.avatar_url;
  });
  S.people=Object.values(m);S.cnt=c;S.people.forEach(p=>S.names[p.id]=p.name);
}
// Open a post by id (used by share links and notifications)
async function ensurePost(id){
  if(findPost(id))return true;
  const r=await sb.from('posts').select(COLS).eq('id',id).maybeSingle();
  if(!r.data){toast('That post is gone');return false}
  await hydrate([r.data]);return true;
}
async function openPostId(id){if(await ensurePost(id))openPost(id)}
addEventListener('hashchange',()=>{const m=location.hash.match(/^#post=([0-9a-f-]{36})/i);if(m&&S.loaded)openPostId(m[1])});

// ---------- Home ----------
function post(p,o){
  o=o||{};
  const on=p.sames.includes(S.user.id),mine=p.author_id==S.user.id;
  const dots='<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>';
  const imgs=p.imgs&&p.imgs.length?`<div class="pimgs n${Math.min(p.imgs.length,4)}">${p.imgs.slice(0,4).map(u=>`<img src="${esc(u)}" loading="lazy" alt="Photo">`).join('')}</div>`:'';
  return `<article class="card" data-pi="${p.id}"><div class="who"><span class="lk" onclick="openProfile('${p.author_id}')">${av(p.author_id)}</span><div class="grow"><b class="lk" onclick="openProfile('${p.author_id}')">${esc(nm(p.author_id))}</b><div class="mute sm">${ago(p.created_at)}${p.edited_at?' · edited':''}</div></div>${mine&&!o.t?`<button class="ghost more" onclick="openPm('${p.id}')" aria-label="More options">${dots}</button>`:''}</div><p>${esc(p.body)}</p><div class="path">${p.tags.map(tgb).join('')}</div>${imgs}<div class="acts"><button class="same ${on?'on':''}" onclick="same('${p.id}',this)"><span>Same</span></button>${o.t?'':`<button class="ghost" onclick="openThread('${p.id}')">Reply${p.rc?' · '+p.rc:''}</button>`}<button class="ghost" onclick="share('${p.id}')">Share</button></div><div class="who2" onclick="openSames('${p.id}')">${sm(p)}</div></article>`;
}
async function same(id,btn){
  const p=findPost(id),u=S.user.id,on=!p.sames.includes(u);
  const set=v=>{p.sames=v?[...p.sames,u]:p.sames.filter(x=>x!==u);document.querySelectorAll(`.card[data-pi="${id}"]`).forEach(c=>{c.querySelector('.same').className='same'+(v?' on':'');c.querySelector('.who2').innerHTML=sm(p)})};
  set(on);btn.style.transform='scale(.88)';setTimeout(()=>btn.style.transform='',180);
  const r=on?await sb.from('sames').insert({post_id:p.id,user_id:u}):await sb.from('sames').delete().match({post_id:p.id,user_id:u});
  if(r.error){set(!on);toast("Couldn't save that")}else if(on)checkAch()
}
// Who said Same
function openSames(id){
  const p=findPost(id);if(!p||!p.sames.length)return;
  const l=so(p);
  $('#slt').textContent=l.length+(l.length==1?' person said Same':' people said Same');
  $('#sll').innerHTML=l.map(u=>`<div class="prow"><span class="lk" onclick="openProfile('${u}')">${av(u)}</span><b class="grow lk" onclick="openProfile('${u}')">${esc(u==S.user.id?'You':nm(u))}</b>${u==S.user.id?'':`<button class="btn sbtn" onclick="sayHi('${u}')"><span class="wave-btn">👋</span> Say hi</button>`}</div>`).join('');
  $('#sl').classList.add('on');
}
const rel=(p,l)=>p.tags.some(n=>l.has(n))?'like':p.tags.some(n=>[...l].some(m=>cat(m)==cat(n)))?'might':'new';
function home(){
  if(!['All','might','new'].includes(S.F)&&!S.mine.has(S.F)&&!(S.F=='fol'&&S.fol.size))S.F='All';
  $('#fl').innerHTML=[['All','All'],['might','Might like'],['new','New'],...(S.fol.size?[['fol','Following']]:[]),...[...S.mine].map(n=>[n,em(n)+' '+iname(n),col(n)])].map(t=>`<button class="fc ${t[0]===S.F?'on':''}" ${t[2]?`style="--c:${t[2]}"`:''} onclick='setF(${JSON.stringify(t[0])})'>${esc(t[1])}</button>`).join('');
  const F=S.F,l=F=='All'?S.posts.filter(p=>rel(p,S.mine)=='like'):F=='might'||F=='new'?S.posts.filter(p=>rel(p,S.snap)==F):F=='fol'?S.posts.filter(p=>S.fol.has(p.author_id)):S.posts.filter(p=>p.tags.includes(F));
  $('#feed').innerHTML=S.skel&&!S.posts.length?skPost().repeat(3):l.map(p=>post(p)).join('')||'<div class="empty">No posts here yet.<br>Tap + and write the first one.</div>';
}
function setF(n){S.F=n;if(n=='might'||n=='new')S.snap=new Set(S.mine);home()}

// ---------- Compose ----------
function tapFab(){
  const pa=$('#sel').value,pb=$('#sel2').value;
  const o=[...S.mine].map(n=>`<option value="${n}">${em(n)} ${esc(iname(n))}</option>`).join('');
  $('#sel').innerHTML=o;
  $('#sel2').innerHTML='<option value="">Mix with another interest (optional)</option>'+o;
  setSel($('#sel'),pa);setSel($('#sel2'),pb);restoreDraft();
  $('#fabBtn').classList.add('spin');$('#mod').classList.add('on');
}
function closePost(){
  if($('#mod').classList.contains('on')&&$('#txt').value.trim())toast('Draft saved');
  $('#fabBtn').classList.remove('spin');$('#mod').classList.remove('on')
}
function renderPhotos(){
  $('#pph').innerHTML=S.photos.map((ph,i)=>`<div class="ph"><img src="${ph.prev}" alt="Photo ${i+1}"><button onclick="rmPhoto(${i})" aria-label="Remove photo">✕</button></div>`).join('');
  $('#padd').hidden=S.photos.length>=4;
}
async function pickPhotos(inp){
  const files=[...inp.files].slice(0,4-S.photos.length);inp.value='';
  if(!files.length)return;
  toast('Preparing photos...');
  for(const f of files){
    try{const blob=await prep(f,1600,false);S.photos.push({blob,prev:URL.createObjectURL(blob)})}
    catch(e){toast(e.message)}
  }
  renderPhotos();
}
function rmPhoto(i){URL.revokeObjectURL(S.photos[i].prev);S.photos.splice(i,1);renderPhotos()}
async function publish(){
  const v=$('#txt').value.trim(),a=+$('#sel').value,b=+$('#sel2').value;
  if(!v){$('#txt').focus();return}
  if(!a){toast('Add something you like first');return}
  const btn=$('#shr');btn.disabled=true;btn.textContent=S.photos.length?'Posting...':'Share';
  const{data,error}=await sb.from('posts').insert({author_id:S.user.id,body:v}).select('id').single();
  if(error){btn.disabled=false;btn.textContent='Share';toast(error.message);return}
  const t=await sb.from('post_interests').insert([...new Set([a,b].filter(Boolean))].map(n=>({post_id:data.id,interest_id:n})));
  let imgFail=false;
  if(S.photos.length){
    try{
      const urls=[];
      for(const ph of S.photos)urls.push(await upload('post-images',ph.blob));
      const r=await sb.from('post_images').insert(urls.map((url,i)=>({post_id:data.id,url,position:i})));
      if(r.error)throw r.error;
    }catch(e){imgFail=true}
  }
  btn.disabled=false;btn.textContent='Share';
  S.photos.forEach(p=>URL.revokeObjectURL(p.prev));S.photos=[];renderPhotos();
  $('#txt').value='';clearDraft();closePost();S.F='All';
  await loadPosts();draw();$('#feed').scrollTop=0;
  toast(t.error?'Posted, but tags failed':imgFail?'Posted, but photos failed':'Posted');checkAch();
}

// ---------- My post menu: edit / delete ----------
function openPm(id){S.pmId=id;$('#pm').classList.add('on')}
function closePm(){$('#pm').classList.remove('on')}
function renderEdPh(){
  const p=findPost(S.edId);
  $('#edph').innerHTML=((p&&p.imgs)||[]).map((u,i)=>`<div class="ph ${S.edRm.has(u)?'rm':''}"><img src="${esc(u)}" alt="Photo"><button onclick="toggleRm(${i})" aria-label="${S.edRm.has(u)?'Keep photo':'Remove photo'}">${S.edRm.has(u)?'↺':'✕'}</button></div>`).join('');
}
function toggleRm(i){const u=findPost(S.edId).imgs[i];S.edRm.has(u)?S.edRm.delete(u):S.edRm.add(u);renderEdPh()}
function openEd(id){
  const p=findPost(id);if(!p)return;
  closePm();S.edId=id;S.edRm=new Set();
  const o=[...new Set([...S.mine,...p.tags])].map(n=>`<option value="${n}">${em(n)} ${esc(iname(n))}</option>`).join('');
  $('#edsel').innerHTML=o;
  $('#edsel2').innerHTML='<option value="">Mix with another interest (optional)</option>'+o;
  $('#edsel').value=p.tags[0]??'';$('#edsel2').value=p.tags[1]??'';
  $('#edt').value=p.body;renderEdPh();$('#ed').classList.add('on');
}
async function saveEd(){
  const id=S.edId,p=findPost(id),v=$('#edt').value.trim(),a=+$('#edsel').value,b=+$('#edsel2').value;
  if(!v){$('#edt').focus();return}
  if(!a){toast('Pick an interest');return}
  const btn=$('#eds');btn.disabled=true;
  const u=await sb.from('posts').update({body:v}).eq('id',id).eq('author_id',S.user.id);
  if(u.error){btn.disabled=false;toast(u.error.message);return}
  const want=[...new Set([a,b].filter(Boolean))];
  const unchanged=want.length===p.tags.length&&want.every(x=>p.tags.includes(x));
  if(!unchanged){
    const d=await sb.from('post_interests').delete().eq('post_id',id);
    if(!d.error)await sb.from('post_interests').insert(want.map(n=>({post_id:id,interest_id:n})));
  }
  if(S.edRm.size){
    const urls=[...S.edRm];
    const d=await sb.from('post_images').delete().eq('post_id',id).in('url',urls);
    if(!d.error)rmFiles('post-images',urls);
  }
  btn.disabled=false;$('#ed').classList.remove('on');
  await loadPosts();draw();toast('Saved');
}
function delPost(id){
  closePm();
  confirmBox('Delete this post?','Delete',async()=>{
    const p=findPost(id),imgs=p?[...(p.imgs||[])]:[];
    const{error}=await sb.from('posts').delete().eq('id',id);
    if(error){toast(error.message);return}
    if(imgs.length)rmFiles('post-images',imgs);
    S.pm.delete(String(id));
    S.posts=S.posts.filter(p=>p.id!==id);S.myPosts=S.myPosts.filter(p=>p.id!==id);
    $('#pv').classList.remove('on');draw();toast('Deleted');
  });
}

// ---------- Replies ----------
const rep=r=>`<div class="rep"><span class="lk" onclick="openProfile('${r.author_id}')">${av(r.author_id)}</span><div class="grow"><div><b class="lk" onclick="openProfile('${r.author_id}')">${esc(nm(r.author_id))}</b> <span class="mute sm">${ago(r.created_at)}</span></div><div class="rbody">${esc(r.body)}</div></div>${r.author_id==S.user.id?`<button class="ghost" onclick="delReply('${r.id}')">Delete</button>`:''}</div>`;
function renderThread(){
  const p=findPost(S.th);if(!p){closeThread();return}
  $('#thp').innerHTML=post(p,{t:1});
  $('#thr').innerHTML=S.reps===null?skRep().repeat(2):S.reps.length?S.reps.map(rep).join(''):'<div class="empty">No replies yet.<br>Say something.</div>';
}
async function loadReplies(id){
  S.reps=null;renderThread();
  const r=await sb.from('replies').select('id,body,created_at,author_id').eq('post_id',id).order('created_at');
  if(S.th!==id)return;
  if(r.error){toast('Could not load replies');S.reps=[]}
  else{
    await getProfiles(r.data.map(x=>x.author_id));
    S.reps=r.data;const p=findPost(id);if(p)p.rc=r.data.length;
  }
  renderThread();
}
function openThread(id){S.th=String(id);$('#rin').value=rdGet()[S.th]||'';$('#th').classList.add('on');loadReplies(S.th)}
function closeThread(){S.th=null;$('#th').classList.remove('on')}
async function sendReply(){
  const v=$('#rin').value.trim();if(!v||!S.th)return;
  const b=$('#rsend');b.disabled=true;
  const{error}=await sb.from('replies').insert({post_id:S.th,author_id:S.user.id,body:v});
  b.disabled=false;
  if(error){toast(error.message);return}
  $('#rin').value='';rdSet(S.th,'');await loadReplies(S.th);draw();$('#thbody').scrollTop=1e5;checkAch();
}
function delReply(id){
  confirmBox('Delete this reply?','Delete',async()=>{
    const{error}=await sb.from('replies').delete().eq('id',id);
    if(error){toast(error.message);return}
    await loadReplies(S.th);draw();
  });
}

// ---------- Discover ----------
function mix(q){
  const b={like:[],might:[],new:[]};
  S.posts.forEach(p=>{if((p.body+nm(p.author_id)+p.tags.map(iname).join()).toLowerCase().includes(q))b[rel(p,S.mine)].push(p)});
  const pat=['like','like','new','like','might','like','new','like','like','new'],u={like:0,might:0,new:0},o=[],total=b.like.length+b.might.length+b.new.length;
  for(let k=0;o.length<total;k++){const t=pat[k%pat.length];if(u[t]<b[t].length)o.push(b[t][u[t]++])}
  return o;
}
function findTab(){
  const q=$('#q').value.toLowerCase();
  $('#ppl').innerHTML=S.skel&&!S.people.length?skPerson().repeat(4):S.people.map(p=>({p,c:p.ids.filter(x=>S.mine.has(x))})).filter(o=>(o.p.name+o.p.ids.map(iname).join()).toLowerCase().includes(q)).sort((a,b)=>b.c.length-a.c.length).map(o=>`<div class="card row tapc" onclick="openProfile('${o.p.id}')">${av(o.p.id)}<div class="grow"><b>${esc(o.p.name)}</b><div class="mute sm">${o.c.length?'You both like':'Into'}</div><div>${(o.c.length?o.c:o.p.ids.slice(0,2)).map(chip).join('')}</div></div><div class="acol"><button class="btn" onclick="event.stopPropagation();sayHi('${o.p.id}')"><span class="wave-btn">👋</span> Say hi</button><button class="btn off sbtn" style="margin:0" onclick="event.stopPropagation();toggleFollow('${o.p.id}')">${S.fol.has(o.p.id)?'Following ✓':'Follow'}</button></div></div>`).join('')||'<div class="empty">No one else here yet.<br>Invite a friend to see them.</div>';
  $('#rooms').innerHTML=[...S.ints].filter(i=>i.name.toLowerCase().includes(q)).sort((a,b)=>S.mine.has(b.id)-S.mine.has(a.id)).map(i=>`<button class="room" onclick="openChat(${i.id})"><span>${em(i.id)}</span>${esc(i.name)}<small>${S.cnt[i.id]||0} ${S.cnt[i.id]==1?'member':'members'}</small></button>`).join('')||'<div class="empty">No circles found</div>';
  const m=mix(q);
  $('#fx').innerHTML=S.skel&&!S.posts.length?'<div class="gridx">'+'<div class="gt sk-b"></div>'.repeat(6)+'</div>':m.length?'<div class="gridx">'+m.map(p=>{
    const img=p.imgs&&p.imgs[0];
    return `<button class="gt ${img?'has-img':''}" style="--c:${col(p.tags[0])}${img?`;background-image:linear-gradient(180deg,rgba(0,0,0,.1),rgba(0,0,0,.7)),url('${esc(img)}')`:''}" onclick="openPost('${p.id}')"><span class="ge">${em(p.tags[0])}</span><span class="gtx">${esc(p.body)}</span></button>`}).join('')+'</div>':'<div class="empty">Nothing found</div>';
}
function ftab(i){
  document.querySelectorAll('#ft button').forEach((b,k)=>b.classList.toggle('on',k==i));
  ['fp','fg','fx'].forEach((id,k)=>$('#'+id).style.display=k==i?'block':'none');
  $('#q').placeholder=['Search people','Search circles','Search posts'][i];$('#q').value='';findTab();
}
function openCircle(id){ftab(2);$('#q').value=iname(id).toLowerCase();findTab()}
let pvFn=null;
function showPv(fn){pvFn=fn;$('#pv').classList.add('on');refreshPv()}
function refreshPv(){if(pvFn&&$('#pv').classList.contains('on'))$('#pvb').innerHTML=pvFn()}
function openPost(id){showPv(()=>{const p=findPost(id);return p?post(p):''})}

// ---------- You + interests ----------
function meTab(){
  const pr=S.prof||{},mine=[...S.mine];
  setMyAv($('#mav'));setBanner($('#mbn'),pr.banner_url);$('#mn').textContent=S.name;
  $('#mu').textContent='@'+(pr.username||'')+(pr.city?' · '+pr.city:'');
  $('#mf').innerHTML=`<button onclick="openFollows('${S.user.id}','ers')"><b>${S.folrs.size}</b> ${S.folrs.size==1?'follower':'followers'}</button><button onclick="openFollows('${S.user.id}','ing')"><b>${S.fol.size}</b> following</button>`;
  $('#mb').textContent=pr.bio||'';$('#mb').hidden=!pr.bio;
  $('#shelf').innerHTML=mine.filter(n=>!isArt(n)).map(chip).join('')+`<button class="chip addb" onclick="openPk()">＋ Add</button>`;
  $('#art').innerHTML=mine.filter(n=>isArt(n)).map(chip).join('')+`<button class="chip addb" onclick="openPk('art')">＋ Add</button>`;
  drawBadges();
  $('#mine').innerHTML=S.skel&&!S.myPosts.length?skPost().repeat(2):S.myPosts.map(p=>post(p)).join('')||'<div class="empty">No posts yet.<br>Tap + on Home to write one.</div>';
}
// Share one searchable picker for profile interests and artists.
function drawPk(){
  const art=S.pkm=='art',raw=$('#pks').value.trim().replace(/\s+/g,' '),q=raw.toLowerCase();
  $('#pkt').textContent=art?'Your artists':'Your interests';
  $('#pks').placeholder=art?'Search or add an artist':'Search or add an interest';
  let l=S.ints.filter(i=>art?i.kind=='artist':i.kind!='artist');
  l=l.filter(i=>i.name.toLowerCase().includes(q)).sort((a,b)=>(S.mine.has(b.id)-S.mine.has(a.id))||a.name.localeCompare(b.name)).slice(0,60);
  let h=l.map(i=>{const on=S.mine.has(i.id);return `<button class="fc ${on?'on':''}" style="--c:${col(i.id)}" onclick="ask(${i.id})">${em(i.id)} ${esc(i.name)}${on?' ✓':''}</button>`}).join('');
  if(raw.length>=2&&raw.length<=40&&!S.ints.some(i=>i.name.toLowerCase()==q))h+=`<button class="fc addb" onclick="${art?'newArtist()':'newInterest()'}">＋ Add “${esc(raw)}”${art?' as an artist':' as an interest'}</button>`;
  if(!h)h=`<div class="mute sm">Type a ${art?'artist':'interest'} name to add it.</div>`;
  if(!art){
    const categories=[...new Set(l.map(i=>i.category||'Other'))];
    h=categories.map(category=>{
      const items=l.filter(i=>(i.category||'Other')===category);
      return `<div class="cath" style="color:${col(items[0].id)}">${esc(category)}</div><div class="pkl">${items.map(i=>{const on=S.mine.has(i.id);return `<button class="fc ${on?'on':''}" style="--c:${col(i.id)}" onclick="ask(${i.id})">${em(i.id)} ${esc(i.name)}${on?' ✓':''}</button>`}).join('')}</div>`;
    }).join('')||'<div class="empty">No listed interests match your search.</div>';
  }
  $('#pkl').innerHTML=h;
}
function openPk(k){
  S.pkm=k=='art'?'art':'int';$('#pks').value='';drawPk();$('#pk').classList.add('on');$('#pks').focus();
  loadInts().then(()=>{if($('#pk').classList.contains('on'))drawPk()});
}
function ask(n){
  const on=S.mine.has(n);
  confirmBox((on?'Remove ':'Add ')+iname(n)+(on?' from':' to')+(isArt(n)?' your artists?':' your interests?'),on?'Remove':'Add',()=>toggleInt(n));
}
async function toggleInt(n){
  // A profile adds or removes its own membership; the shared interest stays available to everyone.
  const on=S.mine.has(n);
  const r=on?await sb.from('user_interests').delete().match({user_id:S.user.id,interest_id:n}):await sb.from('user_interests').insert({user_id:S.user.id,interest_id:n});
  if(r.error){toast(r.error.message);return}
  on?S.mine.delete(n):S.mine.add(n);
  S.cnt[n]=Math.max(0,(S.cnt[n]||0)+(on?-1:1));
  draw();if($('#pk').classList.contains('on'))drawPk();toast((on?'Removed ':'Added ')+iname(n));
}
async function newArtist(){
  const name=$('#pks').value.trim().replace(/\s+/g,' ');
  if(name.length<2||name.length>40){toast('Artist names are 2 to 40 characters');return}
  const find=()=>S.ints.find(i=>i.name.toLowerCase()==name.toLowerCase());
  const known=d=>{if(d.kind=='artist'){$('#pks').value='';drawPk();ask(d.id)}else toast('"'+d.name+'" is already an interest')};
  let d=find();if(d){known(d);return}
  const color=PAL[[...name].reduce((a,c)=>a+c.charCodeAt(0),0)%PAL.length];
  const r=await sb.from('interests').insert({name,emoji:'🎤',color,category:'Artists',kind:'artist'}).select().single();
  if(r.error){
    if(r.error.code=='23505'){await loadInts();d=find();if(d){known(d);return}}
    toast(r.error.message);return;
  }
  S.ints.push(r.data);S.im.set(r.data.id,r.data);
  $('#pks').value='';await toggleInt(r.data.id);
}
// Create a shared hobby interest, then add it to this user's profile.
async function newInterest(){
  const name=$('#pks').value.trim().replace(/\s+/g,' ');
  if(name.length<2||name.length>40){toast('Interest names are 2 to 40 characters');return}
  const find=()=>S.ints.find(i=>i.name.toLowerCase()==name.toLowerCase());
  let interest=find();
  if(interest){if(interest.kind!='artist')ask(interest.id);else toast('That name is already an artist');return}
  const color=PAL[[...name].reduce((a,c)=>a+c.charCodeAt(0),0)%PAL.length];
  const{data,error}=await sb.from('interests').insert({name,emoji:'✦',color,category:'Hobby'}).select().single();
  if(error){
    if(error.code=='23505'){await loadInts();interest=find();if(interest&&interest.kind!='artist')ask(interest.id);else toast(error.message);return}
    toast(error.message);return;
  }
  S.ints.push(data);S.im.set(data.id,data);$('#pks').value='';await toggleInt(data.id);
}
function draw(){home();findTab();meet();meTab();refreshPv();if(S.pf&&$('#pf').classList.contains('on'))drawPf()}

// ---------- Edit profile ----------
function openPe(){
  const p=S.prof||{};
  $('#pen').value=S.name||'';$('#peu').value=p.username||'';$('#peb').value=p.bio||'';$('#pec').value=p.city||'';
  $('#pbc').textContent=($('#peb').value.length)+'/160';$('#pee').textContent='';
  setMyAv($('#peav'));$('#perm').hidden=!S.avs[S.user.id];
  setBanner($('#pebn'),p.banner_url);$('#pebrm').hidden=!p.banner_url;
  $('#pe').classList.add('on');
}
async function saveProfile(){
  const display_name=$('#pen').value.trim(),username=$('#peu').value.trim().toLowerCase().replace(/^@/,''),bio=$('#peb').value.trim(),city=$('#pec').value.trim(),e=$('#pee');
  e.textContent='';
  if(!display_name){e.textContent='Add your name.';return}
  if(!/^[a-z0-9_.]{3,20}$/.test(username)){e.textContent='Username: 3 to 20 letters, numbers, _ or .';return}
  const b=$('#pes');b.disabled=true;
  const vals={display_name,username,bio:bio||null,city:city||null};
  const{error}=await sb.from('profiles').update(vals).eq('id',S.user.id);
  b.disabled=false;
  if(error){e.textContent=error.code=='23505'?'That username is taken.':error.message;return}
  Object.assign(S.prof,vals);S.name=display_name;S.names[S.user.id]=display_name;
  $('#pe').classList.remove('on');draw();toast('Profile saved');
}
async function pickAvatar(inp){
  const f=inp.files[0];inp.value='';if(!f)return;
  toast('Uploading photo...');
  try{
    const blob=await prep(f,512,true),url=await upload('avatars',blob),old=S.avs[S.user.id];
    const{error}=await sb.from('profiles').update({avatar_url:url}).eq('id',S.user.id);
    if(error)throw error;
    if(old)rmFiles('avatars',[old]);
    S.avs[S.user.id]=url;S.prof.avatar_url=url;
    setMyAv($('#peav'));$('#perm').hidden=false;draw();toast('Photo updated');checkAch();
  }catch(e){toast(e.message||"Couldn't upload that photo")}
}
// Banner: cropped to 3:1, stored in the avatars bucket (your folder), URL in profiles.banner_url
function setBanner(el,u){
  if(!el)return;
  el.style.backgroundImage=u?"url('"+u+"')":'';
  el.style.backgroundSize=u?'cover':'';el.style.backgroundPosition=u?'center':'';
}
async function pickBanner(inp){
  const f=inp.files[0];inp.value='';if(!f)return;
  toast('Uploading banner...');
  try{
    const blob=await prep(f,1400,false,3),url=await upload('avatars',blob),old=S.prof.banner_url;
    const{error}=await sb.from('profiles').update({banner_url:url}).eq('id',S.user.id);
    if(error){rmFiles('avatars',[url]);throw error}
    if(old)rmFiles('avatars',[old]);
    S.prof.banner_url=url;setBanner($('#pebn'),url);$('#pebrm').hidden=false;draw();toast('Banner updated');
  }catch(e){toast(e.message||"Couldn't upload that photo")}
}
async function removeBanner(){
  const old=S.prof.banner_url;if(!old)return;
  const{error}=await sb.from('profiles').update({banner_url:null}).eq('id',S.user.id);
  if(error){toast(error.message);return}
  rmFiles('avatars',[old]);S.prof.banner_url=null;
  setBanner($('#pebn'),null);$('#pebrm').hidden=true;draw();toast('Banner removed');
}
async function removeAvatar(){
  const old=S.avs[S.user.id];if(!old)return;
  const{error}=await sb.from('profiles').update({avatar_url:null}).eq('id',S.user.id);
  if(error){toast(error.message);return}
  rmFiles('avatars',[old]);delete S.avs[S.user.id];S.prof.avatar_url=null;
  setMyAv($('#peav'));$('#perm').hidden=true;draw();toast('Photo removed');
}

// ---------- Settings ----------
const ACCENTS=[
  {n:'Purple',h:262,h2:292,h3:351},
  {n:'Pink',h:330,h2:315,h3:350},
  {n:'Red',h:0,h2:348,h3:22},
  {n:'Orange',h:25,h2:38,h3:8},
  {n:'Green',h:142,h2:162,h3:108},
  {n:'Teal',h:174,h2:190,h3:152},
  {n:'Blue',h:217,h2:232,h3:195},
  {n:'Mono',mono:true}
];
const FONTS=[
  {n:'Default',f:"'Bricolage Grotesque','Manrope',system-ui,-apple-system,sans-serif"},
  {n:'Classic',f:"Georgia,'Times New Roman',serif"},
  {n:'Techy',f:"ui-monospace,Menlo,Consolas,monospace"}
];
const THEMES=[['auto','Auto'],['light','Light'],['dark','Dark']];
let curAcc=0,curFont=0,curTheme='auto',prefT;
function paintCustomize(){
  document.querySelectorAll('#sws .sw').forEach((x,i)=>x.classList.toggle('on',i==curAcc));
  document.querySelectorAll('#fcs .fc').forEach((x,i)=>x.classList.toggle('on',i==curFont));
  document.querySelectorAll('#thm .fc').forEach((x,i)=>x.classList.toggle('on',THEMES[i][0]==curTheme));
  updateThemeColor();
}
// Remember choices on this device and on the account, so they follow you to other devices
function savePrefs(){
  const p={theme:curTheme,acc:curAcc,font:curFont};
  try{localStorage.setItem('il-prefs',JSON.stringify(p))}catch(e){}
  if(!S.user)return;
  clearTimeout(prefT);
  prefT=setTimeout(()=>sb.from('profiles').update({theme_prefs:p}).eq('id',S.user.id),600);
}
function setTheme(m,ns){
  curTheme=m;const d=document.documentElement;
  if(m==='auto')delete d.dataset.theme;else d.dataset.theme=m;
  updateThemeIcon();paintCustomize();if(!ns)savePrefs();
}
function accent(i,ns){
  const a=ACCENTS[i];if(!a)return;
  const d=document.documentElement,r=d.style;
  curAcc=i;
  if(a.mono){d.dataset.palette='mono'}
  else{delete d.dataset.palette;r.setProperty('--h',a.h);r.setProperty('--h2',a.h2);r.setProperty('--h3',a.h3)}
  paintCustomize();if(!ns)savePrefs();
}
function fnt(i,ns){
  if(!FONTS[i])return;
  curFont=i;document.documentElement.style.setProperty('--font',FONTS[i].f);
  paintCustomize();if(!ns)savePrefs();
}
function applyPrefs(p){
  if(!p)return;
  if(p.theme)setTheme(p.theme,1);
  if(p.acc!=null)accent(+p.acc,1);
  if(p.font!=null)fnt(+p.font,1);
}
function openSet(){
  $('#setem').textContent=S.user?.email||'';$('#npw').value='';$('#npe').textContent='';
  paintCustomize();refreshInstall();$('#set').classList.add('on');
}
async function changePw(){
  const v=$('#npw').value,e=$('#npe');e.textContent='';
  if(v.length<6){e.textContent='Use 6 or more characters.';return}
  const{error}=await sb.auth.updateUser({password:v});
  if(error){e.textContent=error.message;return}
  $('#npw').value='';toast('Password changed');
}
function recoverUi(){
  S.rec=false;history.replaceState(null,'',location.pathname);
  openSet();toast('Choose a new password');
  setTimeout(()=>$('#npw').focus(),400);
}
$('#thm').innerHTML=THEMES.map(t=>`<button class="fc" onclick="setTheme('${t[0]}')">${t[1]}</button>`).join('');
$('#sws').innerHTML=ACCENTS.map((a,i)=>`<button class="sw" style="background:${a.mono?'#0a0a0a':`linear-gradient(135deg,hsl(${a.h} 83% 58%),hsl(${a.h2} 84% 61%))`}" onclick="accent(${i})" aria-label="${a.n}"></button>`).join('');
$('#fcs').innerHTML=FONTS.map((f,i)=>`<button class="fc" style="font-family:${f.f}" onclick="fnt(${i})">${f.n}</button>`).join('');

// ---------- Live updates: new messages + notifications ----------
function subscribe(){
  if(S.ch)return;
  const id=S.user.id;
  S.ch=sb.channel('me-'+id)
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:'to_user=eq.'+id},p=>onMsg(p.new))
    .on('postgres_changes',{event:'UPDATE',schema:'public',table:'messages',filter:'to_user=eq.'+id},p=>onMsgUpd(p.new))
    .on('postgres_changes',{event:'UPDATE',schema:'public',table:'messages',filter:'sender_id=eq.'+id},p=>onMsgUpd(p.new))
    .on('postgres_changes',{event:'DELETE',schema:'public',table:'messages'},p=>onMsgDel(p.old))
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications',filter:'user_id=eq.'+id},p=>onNotif(p.new))
    .subscribe();
}
function updateBadges(){
  const me=S.user?.id,m=S.msgs.filter(x=>x.to_user==me&&!x.read_at).length,n=S.notifs.filter(x=>!x.read_at).length;
  const set=(id,v)=>{const e=$(id);e.hidden=!v;e.textContent=v>9?'9+':v};
  set('#chb',m);set('#nb',n);
}
// Catch up when the app comes back to the foreground (in case a live update was missed)
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&S.user&&S.loaded){loadMsgs();loadNotifs();checkAch()}});

// ---------- Messages (1-to-1) ----------
let conv=false,ctab=0;
async function loadMsgs(){
  const r=await sb.from('messages').select('*').order('created_at',{ascending:false}).limit(1000);
  if(r.error)return;
  S.msgs=r.data.reverse();updateBadges();
  if($('#ov').classList.contains('on')){conv&&S.dm?drawDm():(!conv&&openChats())}
}
const convoOf=id=>S.msgs.filter(m=>(m.sender_id==id&&m.to_user==S.user.id)||(m.sender_id==S.user.id&&m.to_user==id));
function leaveRoom(){
  if(S.cch){sb.removeChannel(S.cch);S.cch=null}
  S.room=null;S.cm=null;resetEdit();
}
function closeOv(){$('#ov').classList.remove('on');leaveRoom();conv=false;S.dm=null}
// Bottom bar: normal input for DMs and for circles I am in, a Join bar otherwise
function setBar(){
  const room=S.room!=null,can=!room||S.mine.has(S.room);
  $('#inp').style.display=can?'':'none';$('#jbar').style.display=can?'none':'flex';
  $('#mi').placeholder=room?'Message the circle...':'Say something nice...';
  if(room&&!can)$('#jtx').textContent='Join '+iname(S.room)+' to chat here.';
  syncSend();
}
function openChats(){
  leaveRoom();conv=false;S.dm=null;setBar();
  $('#ov').classList.add('on');$('#ct').textContent='Chats';$('#cv').style.display='none';$('#cl').style.display='block';
  const me=S.user.id;
  const tabs=`<div class="tabs"><button class="${ctab?'':'on'}" onclick="ctab=0;openChats()">Friends</button><button class="${ctab?'on':''}" onclick="ctab=1;openChats()">Circles</button></div>`;
  let body;
  if(ctab){
    const mine=[...S.ints].filter(i=>S.mine.has(i.id));
    body=mine.map(i=>`<div class="card row" onclick="openChat(${i.id})"><div class="tile">${em(i.id)}</div><div class="grow"><b>${esc(i.name)}</b><div class="mute sm">${S.cnt[i.id]||0} ${S.cnt[i.id]==1?'member':'members'}</div></div></div>`).join('')
      ||'<div class="empty mid"><div class="eico">🫧</div><b>No circles yet</b><div class="sm">Join a circle to chat with people who like the same things.</div><button class="btn" onclick="goDiscover(1)">Add circle</button></div>';
  }else{
    const known=new Set(S.fol);S.msgs.forEach(m=>known.add(m.sender_id==me?m.to_user:m.sender_id));
    const rows=S.people.filter(p=>known.has(p.id)).map(p=>{const l=convoOf(p.id);return{p,last:l[l.length-1],un:l.filter(m=>m.to_user==me&&!m.read_at).length}})
      .sort((a,b)=>(b.last?+new Date(b.last.created_at):0)-(a.last?+new Date(a.last.created_at):0)||(S.fol.has(b.p.id)-S.fol.has(a.p.id)));
    body=rows.map(o=>`<div class="card row" onclick="openDm('${o.p.id}')">${av(o.p.id)}<div class="grow"><b>${esc(o.p.name)}</b>${o.last?`<div class="mute sm clip">${o.last.sender_id==me?'You: ':''}${esc(o.last.body)}</div>`:`<div class="mute sm">${S.fol.has(o.p.id)?'Following · ':''}Say hi 👋</div>`}</div>${o.un?`<span class="dot">${o.un}</span>`:''}</div>`).join('')
      ||'<div class="empty mid"><div class="eico">👋</div><b>No friends yet</b><div class="sm">Follow people to start chatting with them here.</div><button class="btn" onclick="goDiscover(0)">Add friends</button></div>';
  }
  $('#cl').innerHTML=tabs+body;
}
function openDm(id){
  id=String(id);leaveRoom();S.dm=id;conv=true;setBar();
  $('#ov').classList.add('on');$('#cl').style.display='none';$('#cv').style.display='flex';
  $('#ct').textContent=nm(id);drawDm(1);markRead(id);
}
function drawDm(snap){
  const el=$('#msgs'),near=nearEnd(el),l=convoOf(S.dm),me=S.user.id;
  let seen=null;
  for(let i=l.length-1;i>=0;i--){if(l[i].sender_id==me){if(l[i].read_at)seen=l[i].id;break}}
  el.innerHTML=l.length
    ?l.map(m=>{const mine=m.sender_id==me;return `<div class="b ${mine?'me':''}">${esc(m.body)}<small class="t ${mine?'f':''}"><span>${tm(m.created_at)}${m.edited_at?' · edited':''}${m.id===seen?' · Seen':''}</span>${mine?moreBtn('dm',m.id):''}</small></div>`}).join('')
    :`<div class="empty" style="margin:auto"><div style="font-size:44px;margin-bottom:8px">👋</div><b>Say hi to ${esc(nm(S.dm))}</b></div>`;
  settle(el,near,snap,l.length,!l.length||l[l.length-1].sender_id==me);
}
// Scroll helpers: stay put if the reader scrolled up, offer a jump button instead
let mcount=0;
const nearEnd=el=>el.scrollHeight-el.scrollTop-el.clientHeight<140;
function settle(el,near,snap,n,lastMine){
  if(snap||near){el.scrollTop=1e5;$('#jump').hidden=true}
  else if(n>mcount&&!lastMine)$('#jump').hidden=false;
  mcount=n;
}
function jumpNew(){const el=$('#msgs');el.scrollTo({top:el.scrollHeight,behavior:'smooth'});$('#jump').hidden=true}
$('#msgs').addEventListener('scroll',()=>{if(nearEnd($('#msgs')))$('#jump').hidden=true});
// Send button + character counter
function syncSend(){
  const v=$('#mi').value;
  $('#sbtn').disabled=!v.trim();
  const c=$('#mcnt');c.hidden=v.length<400;c.textContent=v.length+'/500';
}
// ⋯ menu on my own messages: edit or delete
const moreBtn=(k,id)=>`<button class="mmore" onclick="event.stopPropagation();msgMenu('${k}','${id}')" aria-label="Message options">⋯</button>`;
let mmSel=null;
const msgTable=k=>k=='dm'?'messages':'circle_messages';
const getMsg=s=>s&&(s.k=='dm'?S.msgs:(S.cm||[])).find(x=>String(x.id)===String(s.id));
function msgMenu(k,id){mmSel={k,id};$('#mm').classList.add('on')}
function closeMm(){mmSel=null;$('#mm').classList.remove('on')}
function editMsg(){
  const sel=mmSel,m=getMsg(sel);closeMm();if(!m)return;
  S.edit=sel;$('#mi').value=m.body;$('#ebar').hidden=false;$('#sbtn').textContent='Save';syncSend();$('#mi').focus();
}
function resetEdit(){
  const was=!!S.edit;S.edit=null;
  $('#ebar').hidden=true;$('#sbtn').textContent='Send';
  if(was){$('#mi').value='';syncSend()}
}
async function saveMsgEdit(v){
  const sel=S.edit,m=getMsg(sel);
  if(!m||v===m.body){resetEdit();return}
  const now=new Date().toISOString();
  const{data,error}=await sb.from(msgTable(sel.k)).update({body:v,edited_at:now}).eq('id',m.id).eq('sender_id',S.user.id).select();
  if(error||!data||!data.length){toast(error?error.message:"Couldn't save the edit");return}
  m.body=v;m.edited_at=now;resetEdit();
  sel.k=='dm'?drawDm():drawCircle();
}
function delMsg(){
  const sel=mmSel,m=getMsg(sel);closeMm();if(!m)return;
  confirmBox('Delete this message?','Delete',async()=>{
    const{data,error}=await sb.from(msgTable(sel.k)).delete().eq('id',m.id).eq('sender_id',S.user.id).select();
    if(error||!data||!data.length){toast(error?error.message:"Couldn't delete the message");return}
    if(S.edit&&String(S.edit.id)===String(m.id))resetEdit();
    if(sel.k=='dm'){S.msgs=S.msgs.filter(x=>x.id!==m.id);updateBadges();if(conv&&S.dm)drawDm()}
    else if(S.cm){S.cm=S.cm.filter(x=>x.id!==m.id);if(S.room!=null)drawCircle()}
  });
}
// Live changes from the other person (edit, seen, delete)
function onMsgUpd(m){
  const x=S.msgs.find(y=>y.id===m.id);if(!x)return;
  Object.assign(x,m);updateBadges();
  if($('#ov').classList.contains('on')&&conv&&S.dm)drawDm();
}
function onMsgDel(o){
  const i=S.msgs.findIndex(y=>y.id===o.id);if(i<0)return;
  S.msgs.splice(i,1);updateBadges();
  if($('#ov').classList.contains('on')){if(conv&&S.dm)drawDm();else if(!conv)openChats()}
}
// Empty-state shortcuts: jump from Chats to Discover
function goDiscover(i){
  closeOv();show('find');ftab(i);
  loadPeople().then(findTab);
}
// ---------- Circle chat (one live room per interest / artist) ----------
function openChat(k){
  k=+k;leaveRoom();S.dm=null;S.room=k;S.cm=null;conv=true;setBar();
  $('#ov').classList.add('on');$('#cl').style.display='none';$('#cv').style.display='flex';
  $('#ct').textContent=(S.im.get(k)?.emoji||'✦')+' '+iname(k);
  mcount=0;drawCircle(1);
  S.cch=sb.channel('circle-'+k+'-'+Date.now())
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'circle_messages',filter:'interest_id=eq.'+k},p=>onCircleMsg(p.new))
    .on('postgres_changes',{event:'UPDATE',schema:'public',table:'circle_messages',filter:'interest_id=eq.'+k},p=>onCircleUpd(p.new))
    .on('postgres_changes',{event:'DELETE',schema:'public',table:'circle_messages'},p=>onCircleDel(p.old))
    .subscribe();
  loadCircle(k);
}
async function loadCircle(k){
  const r=await sb.from('circle_messages').select('id,sender_id,body,created_at,edited_at').eq('interest_id',k).order('created_at',{ascending:false}).limit(100);
  if(S.room!==k)return;
  if(r.error){toast('Could not load the chat');S.cm=[];drawCircle(1);return}
  const rows=r.data.reverse();
  await getProfiles(rows.map(m=>m.sender_id));
  if(S.room!==k)return;
  const have=new Set(rows.map(m=>m.id));
  S.cm=[...rows,...(S.cm||[]).filter(m=>!have.has(m.id))];
  drawCircle(1);
}
function drawCircle(snap){
  const el=$('#msgs'),near=nearEnd(el),me=S.user.id;
  if(S.cm===null){el.innerHTML='<div class="empty" style="margin:auto">Loading...</div>';return}
  el.innerHTML=S.cm.length?S.cm.map(m=>{
    const ed=m.edited_at?' · edited':'';
    return m.sender_id==me
      ?`<div class="b me">${esc(m.body)}<small class="t f"><span>${tm(m.created_at)}${ed}</span>${moreBtn('cm',m.id)}</small></div>`
      :`<div class="crow"><span class="lk" onclick="openProfile('${m.sender_id}')">${av(m.sender_id)}</span><div class="b"><span class="cn" style="color:${ac(m.sender_id)}">${esc(nm(m.sender_id))}</span>${esc(m.body)}<small class="t">${tm(m.created_at)}${ed}</small></div></div>`}).join('')
    :`<div class="empty" style="margin:auto"><div style="font-size:44px;margin-bottom:8px">${em(S.room)}</div><b>No messages yet</b><div class="sm" style="margin-top:6px">${S.mine.has(S.room)?'Start the conversation in '+esc(iname(S.room))+'.':'Join this circle to start the conversation.'}</div></div>`;
  const last=S.cm[S.cm.length-1];
  settle(el,near,snap,S.cm.length,!last||last.sender_id==me);
}
async function onCircleMsg(m){
  if(S.room!==m.interest_id||S.cm===null||S.cm.some(x=>x.id===m.id))return;
  if(!S.names[m.sender_id])await getProfiles([m.sender_id]);
  if(S.room!==m.interest_id||S.cm.some(x=>x.id===m.id))return;
  S.cm.push(m);drawCircle(m.sender_id==S.user.id);
}
function onCircleUpd(m){
  const x=S.cm&&S.cm.find(y=>y.id===m.id);if(!x||S.room!==m.interest_id)return;
  x.body=m.body;x.edited_at=m.edited_at;drawCircle();
}
function onCircleDel(o){
  if(!S.cm)return;const n=S.cm.length;
  S.cm=S.cm.filter(x=>x.id!==o.id);
  if(S.cm.length!==n&&S.room!=null)drawCircle();
}
async function joinRoom(){
  const k=S.room;if(k==null)return;
  await toggleInt(k);
  if(S.room===k&&S.mine.has(k)){setBar();drawCircle()}
}
// "Say hi" from Discover and from the Same list
function sayHi(id){
  $('#sl').classList.remove('on');$('#pv').classList.remove('on');closeThread();closePf();
  openDm(id);
}
function markRead(id){
  const me=S.user.id,un=S.msgs.filter(m=>m.sender_id==id&&m.to_user==me&&!m.read_at);
  if(!un.length)return;
  const now=new Date().toISOString();un.forEach(m=>m.read_at=now);updateBadges();
  sb.from('messages').update({read_at:now}).eq('to_user',me).eq('sender_id',id).is('read_at',null).then(()=>{});
}
async function send(){
  const v=$('#mi').value.trim();if(!v)return;
  if(S.edit)return saveMsgEdit(v);
  if(S.room!=null){
    const k=S.room;
    if(!S.mine.has(k)){toast('Join this circle to chat');return}
    $('#mi').value='';syncSend();
    const{data,error}=await sb.from('circle_messages').insert({interest_id:k,sender_id:S.user.id,body:v}).select().single();
    if(error){if(S.room===k){$('#mi').value=v;syncSend()}toast(error.message);return}
    if(S.room===k&&S.cm&&!S.cm.some(x=>x.id===data.id)){S.cm.push(data);drawCircle(1)}
    checkAch();return;
  }
  if(!S.dm)return;
  $('#mi').value='';syncSend();
  const{data,error}=await sb.from('messages').insert({sender_id:S.user.id,to_user:S.dm,body:v}).select().single();
  if(error){$('#mi').value=v;syncSend();toast(error.message);return}
  S.msgs.push(data);if(conv&&S.dm==data.to_user)drawDm(1);
  checkAch();
}
async function onMsg(m){
  if(S.msgs.some(x=>x.id===m.id))return;
  S.msgs.push(m);
  if(!S.names[m.sender_id])await getProfiles([m.sender_id]);
  const open=$('#ov').classList.contains('on');
  if(open&&conv&&S.dm==m.sender_id){drawDm();markRead(m.sender_id);return}
  updateBadges();
  toast(nm(m.sender_id)+': '+(m.body.length>40?m.body.slice(0,40)+'…':m.body));
  if(open&&!conv)openChats();
}
function back(){conv?openChats():closeOv()}

// ---------- Notifications ----------
async function notifMeta(list){
  await getProfiles(list.map(n=>n.actor_id));
  const need=[...new Set(list.map(n=>n.post_id))].filter(id=>id&&!(id in S.nposts)&&!findPost(id));
  if(need.length){const r=await sb.from('posts').select('id,body').in('id',need);(r.data||[]).forEach(x=>S.nposts[x.id]=x.body)}
}
const nsnip=n=>{if(!n.post_id)return '';const p=findPost(n.post_id),b=p?p.body:(S.nposts[n.post_id]||'');return b.length>80?b.slice(0,80)+'…':b};
const ntext=n=>n.type=='same'?'said Same to your post':n.type=='reply'?'replied to your post':'started following you';
async function loadNotifs(){
  const r=await sb.from('notifications').select('id,type,post_id,actor_id,created_at,read_at').order('created_at',{ascending:false}).limit(40);
  if(r.error)return;
  await notifMeta(r.data);S.notifs=r.data;updateBadges();
  if($('#nv').classList.contains('on'))drawNotifs();
}
function drawNotifs(){
  $('#nl').innerHTML=S.notifs.map(n=>`<div class="card row nitem ${n.read_at?'':'new'}" onclick="openNotif('${n.id}')">${av(n.actor_id)}<div class="grow"><div><b>${esc(nm(n.actor_id))}</b> ${ntext(n)}</div><div class="mute sm clip">${n.type=='follow'?'Tap to see their profile':esc(nsnip(n))}</div></div><span class="mute sm">${ago(n.created_at)}</span></div>`).join('')
    ||'<div class="empty">Nothing yet.<br>When someone says Same, replies or follows you, you will see it here.</div>';
}
function markNotifsRead(){
  const un=S.notifs.filter(n=>!n.read_at);if(!un.length)return;
  const now=new Date().toISOString();un.forEach(n=>n.read_at=now);updateBadges();
  sb.from('notifications').update({read_at:now}).eq('user_id',S.user.id).is('read_at',null).then(()=>{});
}
function openNotifs(){drawNotifs();$('#nv').classList.add('on');markNotifsRead()}
async function openNotif(id){
  const n=S.notifs.find(x=>x.id===id);if(!n)return;
  if(n.type=='follow'){openProfile(n.actor_id);return}
  if(!(await ensurePost(n.post_id)))return;
  n.type=='reply'?openThread(n.post_id):openPost(n.post_id);
}
async function onNotif(n){
  await notifMeta([n]);
  if(S.notifs.some(x=>x.id===n.id))return;
  S.notifs.unshift(n);
  toast(nm(n.actor_id)+' '+ntext(n));
  if(n.type=='follow'){S.folrs.add(n.actor_id);draw()}else checkAch();
  if($('#nv').classList.contains('on')){drawNotifs();markNotifsRead()}else updateBadges();
}

// =====================================================================
// P2: artists, follow + profiles, events, achievements
// (circle chat lives with the chats code above)
// =====================================================================

// ---------- Interests / artists ----------
const isArt=n=>S.im.get(n)?.kind=='artist';
// Artists can be added by anyone, so fetch any interest we have not seen yet
async function ensureInts(ids){
  const miss=[...new Set(ids)].filter(n=>n&&!S.im.has(n));
  if(!miss.length)return;
  const r=await sb.from('interests').select('*').in('id',miss);
  (r.data||[]).forEach(x=>{S.im.set(x.id,x);S.ints.push(x)});
}
async function loadInts(){
  const r=await sb.from('interests').select('*').order('category').order('name');
  if(r.error)return;
  S.ints=r.data;S.im=new Map(S.ints.map(x=>[x.id,x]));
}

// ---------- Follow ----------
async function loadFollows(){
  const[a,b]=await Promise.all([
    sb.from('follows').select('following_id').eq('follower_id',S.user.id),
    sb.from('follows').select('follower_id').eq('following_id',S.user.id)]);
  S.fol=new Set((a.data||[]).map(x=>x.following_id));
  S.folrs=new Set((b.data||[]).map(x=>x.follower_id));
}
async function toggleFollow(id){
  id=String(id);if(id==S.user.id)return;
  const on=!S.fol.has(id);
  const set=v=>{
    v?S.fol.add(id):S.fol.delete(id);
    if(S.pf&&S.pf.id==id&&typeof S.pf.nf=='number')S.pf.nf=Math.max(0,S.pf.nf+(v?1:-1));
    draw();
  };
  set(on);
  const r=on?await sb.from('follows').insert({follower_id:S.user.id,following_id:id})
            :await sb.from('follows').delete().match({follower_id:S.user.id,following_id:id});
  if(r.error){set(!on);toast("Couldn't update that");return}
  if(on){toast('Following '+nm(id));checkAch()}
}
function peopleSheet(title,ids){
  $('#slt').textContent=title;
  $('#sll').innerHTML=ids.map(u=>`<div class="prow lk" onclick="openProfile('${u}')">${av(u)}<b class="grow">${esc(u==S.user.id?'You':nm(u))}</b></div>`).join('')||'<div class="empty">Nobody yet</div>';
  $('#sl').classList.add('on');
}
async function openFollows(id,k){
  const a=k=='ers'?'follower_id':'following_id',b=k=='ers'?'following_id':'follower_id';
  const r=await sb.from('follows').select(a).eq(b,id).order('created_at',{ascending:false}).limit(200);
  if(r.error){toast('Could not load that list');return}
  const ids=r.data.map(x=>x[a]);await getProfiles(ids);
  peopleSheet(k=='ers'?'Followers':'Following',ids);
}

// ---------- Other people's profiles ----------
function closePf(){$('#pf').classList.remove('on');S.pf=null}
function closeAll(){
  ['#pv','#pf','#th','#sl','#nv','#info'].forEach(x=>$(x).classList.remove('on'));
  S.th=null;S.pf=null;closeOv();
}
async function openProfile(id){
  id=String(id);
  if(id==S.user.id){closeAll();show('me');draw();checkAch();return}
  closeThread();$('#sl').classList.remove('on');
  S.pf={id,prof:null};$('#pf').classList.add('on');drawPf();
  const[p,ui,ua,po,c1,c2]=await Promise.all([
    sb.from('profiles').select('id,username,display_name,bio,city,avatar_url,banner_url').eq('id',id).maybeSingle(),
    sb.from('user_interests').select('interest_id').eq('user_id',id),
    sb.from('user_achievements').select('code,earned_at').eq('user_id',id),
    sb.from('posts').select(COLS).eq('author_id',id).order('created_at',{ascending:false}).limit(20),
    sb.from('follows').select('*',{count:'exact',head:true}).eq('following_id',id),
    sb.from('follows').select('*',{count:'exact',head:true}).eq('follower_id',id)]);
  if(!S.pf||S.pf.id!==id)return;
  if(!p.data){toast('That profile is gone');closePf();return}
  S.names[id]=p.data.display_name;
  if(p.data.avatar_url)S.avs[id]=p.data.avatar_url;else delete S.avs[id];
  const ints=(ui.data||[]).map(x=>x.interest_id);
  await ensureInts(ints);
  const posts=await hydrate(po.data||[]);
  if(!S.pf||S.pf.id!==id)return;
  Object.assign(S.pf,{prof:p.data,ints,ach:ua.data||[],posts,nf:c1.count||0,ng:c2.count||0});
  drawPf();
}
function drawPf(){
  const f=S.pf;if(!f)return;
  const id=f.id,p=f.prof;
  if(!p){$('#pfb').innerHTML=skProf();return}
  const known=f.ints.filter(n=>S.im.has(n)),likes=known.filter(n=>!isArt(n)),arts=known.filter(isArt);
  const fo=S.fol.has(id);
  const earned=f.ach.map(x=>({...x,a:S.achCat.find(c=>c.code==x.code)})).filter(x=>x.a).sort((a,b)=>a.a.sort-b.a.sort);
  $('#pfb').innerHTML=`${p.banner_url?`<div class="pfbn" style="background-image:url('${esc(p.banner_url)}')"></div>`:''}<div class="pfh">${av(id,'big')}<h3 class="pfn">${esc(p.display_name)}</h3>
<div class="mute sm">@${esc(p.username)}${p.city?' · '+esc(p.city):''}${S.folrs.has(id)?' · Follows you':''}</div>
${p.bio?`<p class="bio">${esc(p.bio)}</p>`:''}
<div class="cnts"><button onclick="openFollows('${id}','ers')"><b>${f.nf}</b> ${f.nf==1?'follower':'followers'}</button><button onclick="openFollows('${id}','ing')"><b>${f.ng}</b> following</button></div>
<div class="row pfa"><button class="btn ${fo?'off':''}" onclick="toggleFollow('${id}')">${fo?'Following ✓':'Follow'}</button><button class="btn off" onclick="sayHi('${id}')"><span class="wave-btn">👋</span> Say hi</button></div></div>
${likes.length?`<div class="pfs">Likes</div><div class="pfc">${likes.map(chip).join('')}</div>`:''}
${arts.length?`<div class="pfs">Artists</div><div class="pfc">${arts.map(chip).join('')}</div>`:''}
${earned.length?`<div class="pfs">Achievements</div><div class="pfc">${earned.map(x=>`<button class="chip tg" style="--c:#64748B" onclick="showAch('${x.code}','${x.earned_at}')">${esc(x.a.emoji)} ${esc(x.a.title)}</button>`).join('')}</div>`:''}
<div class="pfs">Posts</div>${f.posts.map(q=>post(q)).join('')||'<div class="empty">No posts yet.</div>'}`;
}

// ---------- Achievements ----------
async function loadAch(){
  if(!S.achCat.length){
    const c=await sb.from('achievements').select('code,emoji,title,description,sort').order('sort');
    S.achCat=c.data||[];
  }
  const r=await sb.from('user_achievements').select('code,earned_at').eq('user_id',S.user.id);
  if(r.error)return;
  const fresh=r.data.filter(x=>!S.achMine.has(x.code));
  S.achMine=new Map(r.data.map(x=>[x.code,x.earned_at]));
  if(S.achReady&&fresh.length){
    const a=S.achCat.find(c=>c.code==fresh[0].code);
    if(a)setTimeout(()=>toast('🏆 New badge: '+a.emoji+' '+a.title+(fresh.length>1?' +'+(fresh.length-1)+' more':'')),1300);
  }
  S.achReady=true;
  if($('#badges'))drawBadges();
}
let achT;
function checkAch(){clearTimeout(achT);achT=setTimeout(()=>{if(S.user)loadAch()},400)}
function drawBadges(){
  const c=S.achCat;
  $('#badges').innerHTML=c.length
    ?`<div class="mute sm cnt-line">${S.achMine.size} of ${c.length} earned</div>`+c.map(a=>{
        const d=S.achMine.get(a.code);
        return `<button class="chip tg ${d?'':'lock'}" style="--c:#64748B" onclick="showAch('${a.code}','${d||''}')">${d?esc(a.emoji):'🔒'} ${esc(a.title)}</button>`}).join('')
    :'<span class="mute sm">Coming soon</span>';
}
function showAch(code,d){
  const a=S.achCat.find(x=>x.code==code);if(!a)return;
  $('#inf').innerHTML=`<div style="font-size:40px">${d?esc(a.emoji):'🔒'}</div><div style="font-size:18px;font-weight:800;margin:6px 0">${esc(a.title)}</div><div class="mute sm">${d?'Earned '+new Date(d).toLocaleDateString([],{day:'numeric',month:'short',year:'numeric'}):'Not earned yet'}</div><p style="margin-top:10px">${esc(a.description)}</p>`;
  $('#info').classList.add('on');
}

// ---------- Events + "I'm in" ----------
const EVEM=['📍','🎉','☕','🍜','🎮','🎬','🎵','🥾','⚽','📚','🎨','🏖️','🍕','🎤','🎲','🏃'];
const evd=d=>{const x=new Date(d);return x.toLocaleDateString([],{weekday:'short',day:'numeric',month:'short'})+' · '+x.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})};
const toLocalInput=d=>{const x=new Date(d),p=n=>String(n).padStart(2,'0');return x.getFullYear()+'-'+p(x.getMonth()+1)+'-'+p(x.getDate())+'T'+p(x.getHours())+':'+p(x.getMinutes())};
const ord=l=>l.includes(S.user.id)?[S.user.id,...l.filter(x=>x!=S.user.id)]:l;
const stack=l=>l.length?`<span class="stk">${l.slice(0,3).map(x=>av(x,'sm')).join('')}</span>`:'';
const goTxt=l=>{
  const n=ord(l).map(x=>x==S.user.id?'You':nm(x));
  if(!n.length)return 'Be the first to join';
  const v=n.length==1&&n[0]!='You'?'is':'are';
  return (n.length==1?n[0]:n.length==2?n.join(' & '):n[0]+', '+n[1]+' & '+(n.length-2)+(n.length==3?' other':' others'))+' '+v+' going';
};
const goHtml=e=>stack(ord(e.goers))+esc(goTxt(e.goers));
const goRow=e=>stack(ord(e.goers))+`<span class="mute sm">${e.goers.length} going</span>`;
const iminHTML=on=>`<span>${on?"You're in ✓":"I'm in"}</span>`;

async function loadEvents(){
  const since=new Date(Date.now()-3*36e5).toISOString();
  const r=await sb.from('events').select('id,organizer_id,title,emoji,starts_at,place,venue,description').gte('starts_at',since).order('starts_at').limit(60);
  if(r.error){if(!S.evs)S.evs=[];meet();return}
  const ids=r.data.map(e=>e.id);
  const g=ids.length?await sb.from('event_goers').select('event_id,user_id').in('event_id',ids):{data:[]};
  await getProfiles([...r.data.map(e=>e.organizer_id),...(g.data||[]).map(x=>x.user_id)]);
  S.evs=r.data.map(e=>({...e,goers:(g.data||[]).filter(x=>x.event_id===e.id).map(x=>x.user_id)}));
  S.evm=new Map(S.evs.map(e=>[e.id,e]));
  meet();refreshPv();
}
function evCard(e){
  const me=S.user.id,on=e.goers.includes(me),host=e.organizer_id==me;
  return `<div class="card tapc evc" onclick="openEvent('${e.id}')"><div class="row"><div class="tile">${esc(e.emoji)}</div><div class="grow"><span class="date">${evd(e.starts_at)}</span><div><b>${esc(e.title)}</b></div><div class="mute sm clip">📍 ${esc(e.place)}</div></div></div><div class="row" style="margin-top:12px"><div class="grow who2" data-evg="${e.id}">${goHtml(e)}</div>${host?'<span class="date">You are hosting</span>':`<button class="imin-btn ${on?'on':''}" data-evb="${e.id}" onclick="event.stopPropagation();imin('${e.id}',this)">${iminHTML(on)}</button>`}</div></div>`;
}
function meet(){
  const el=$('#evs');
  if(!S.evs){el.innerHTML=skEvent().repeat(3);return}
  el.innerHTML=S.evs.length?S.evs.map(evCard).join(''):`<div class="empty" style="grid-column:1/-1;padding:60px 16px"><div style="font-size:48px;margin-bottom:10px">🗓️</div><b>No plans yet</b><div class="sm" style="margin:6px 0 16px">Hangouts and meetups with people who like what you like.</div><button class="btn" onclick="openEv()">Plan the first one</button></div>`;
}
function openEvent(id){showPv(()=>eventHTML(id))}
function eventHTML(id){
  const e=S.evm.get(id);if(!e)return '';
  const me=S.user.id,host=e.organizer_id==me,on=e.goers.includes(me);
  const cal='<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>';
  const pin='<svg viewBox="0 0 24 24"><path d="M12 22s7-6.5 7-13a7 7 0 0 0-14 0c0 6.5 7 13 7 13z"/><circle cx="12" cy="9" r="2.5"/></svg>';
  const usr='<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></svg>';
  return `<div class="evp"><div class="evbn">${esc(e.emoji)}</div><h2 class="evt">${esc(e.title)}</h2>
<div class="ev-row">${cal}<span>${evd(e.starts_at)}</span></div>
<div class="ev-row">${pin}<span>${esc(e.place)}${e.venue?`<br><small>${esc(e.venue)}</small>`:''}</span></div>
<div class="ev-row">${usr}<span>Planned by <b class="lk" onclick="openProfile('${e.organizer_id}')">${esc(host?'you':nm(e.organizer_id))}</b></span></div>
${e.description?`<p class="evdesc">${esc(e.description)}</p>`:''}
<div class="evh">WHO'S GOING</div><div class="row evgo lk" data-evg="${e.id}" data-d="1" onclick="openGoers('${e.id}')">${goRow(e)}</div>
${host?`<div class="evact"><button class="btn off" onclick="openEv('${e.id}')">Edit</button><button class="btn off danger" onclick="delEv('${e.id}')">Delete</button></div>`
:`<button class="imin-btn imin-full ${on?'on':''}" data-evb="${e.id}" onclick="imin('${e.id}',this)">${iminHTML(on)}</button>`}</div>`;
}
function openGoers(id){const e=S.evm.get(id);if(e)peopleSheet('Going ('+e.goers.length+')',ord(e.goers))}
// Update buttons and "who's going" in place so the wipe animation plays
function paintEv(e){
  const on=e.goers.includes(S.user.id);
  document.querySelectorAll(`[data-evb="${e.id}"]`).forEach(b=>{b.className='imin-btn'+(b.classList.contains('imin-full')?' imin-full':'')+(on?' on':'');b.innerHTML=iminHTML(on)});
  document.querySelectorAll(`[data-evg="${e.id}"]`).forEach(x=>x.innerHTML=x.dataset.d?goRow(e):goHtml(e));
}
async function imin(id,btn){
  const e=S.evm.get(id),u=S.user.id;if(!e||e.organizer_id==u)return;
  const on=!e.goers.includes(u);
  const set=v=>{e.goers=v?[...e.goers,u]:e.goers.filter(x=>x!==u);paintEv(e)};
  set(on);btn.style.transform='scale(.88)';setTimeout(()=>btn.style.transform='',180);
  const r=on?await sb.from('event_goers').insert({event_id:id,user_id:u}):await sb.from('event_goers').delete().match({event_id:id,user_id:u});
  if(r.error){set(!on);toast("Couldn't save that");return}
  if(on)checkAch();
}
function drawEvEm(){
  $('#evEm').innerHTML=[...new Set([S.evEm,...EVEM])].map(x=>`<button type="button" class="${x==S.evEm?'on':''}" onclick="S.evEm='${x}';drawEvEm()">${x}</button>`).join('');
}
function openEv(id){
  const e=id?S.evm.get(id):null;
  if(id&&!e)return;
  S.evId=e?e.id:null;S.evEm=e?e.emoji:'📍';drawEvEm();
  $('#evHead').textContent=e?'Edit event':'Plan an event';
  $('#evTitle').value=e?e.title:'';
  let d=new Date();d.setDate(d.getDate()+1);d.setHours(18,0,0,0);
  $('#evWhen').value=toLocalInput(e?e.starts_at:d);
  $('#evPlace').value=e?e.place:'';$('#evVenue').value=e?.venue||'';$('#evDesc').value=e?.description||'';
  $('#evErr').textContent='';$('#evSave').disabled=false;
  $('#ev').classList.add('on');
}
async function saveEv(){
  const title=$('#evTitle').value.trim(),w=$('#evWhen').value,place=$('#evPlace').value.trim(),venue=$('#evVenue').value.trim(),desc=$('#evDesc').value.trim(),err=$('#evErr');
  err.textContent='';
  if(!title){err.textContent='Give your plan a name.';return}
  if(!w){err.textContent='Pick a date and time.';return}
  const when=new Date(w);
  if(isNaN(when)){err.textContent='That date does not look right.';return}
  if(!S.evId&&when<Date.now()){err.textContent='Pick a time in the future.';return}
  if(!place){err.textContent='Where is it happening?';return}
  const vals={title,emoji:S.evEm,starts_at:when.toISOString(),place,venue:venue||null,description:desc||null};
  const b=$('#evSave');b.disabled=true;
  let r;
  if(S.evId)r=await sb.from('events').update(vals).eq('id',S.evId).eq('organizer_id',S.user.id);
  else r=await sb.from('events').insert({...vals,organizer_id:S.user.id});
  b.disabled=false;
  if(r.error){err.textContent=r.error.message;return}
  const wasNew=!S.evId;
  $('#ev').classList.remove('on');
  await loadEvents();draw();toast(wasNew?'Event planned':'Event updated');
  if(wasNew)checkAch();
}
function delEv(id){
  confirmBox('Delete this event?','Delete',async()=>{
    const{error}=await sb.from('events').delete().eq('id',id).eq('organizer_id',S.user.id);
    if(error){toast(error.message);return}
    $('#pv').classList.remove('on');S.evm.delete(id);
    await loadEvents();draw();toast('Event deleted');
  });
}

document.querySelectorAll('#nav button').forEach(b=>b.onclick=async()=>{
  const s=b.dataset.s;show(s);
  if(s=='find')await loadPeople();else if(s=='meet')await loadEvents();else await loadPosts();
  if(s=='me')checkAch();
  draw();
});
$('#fl').addEventListener('wheel',e=>{if(Math.abs(e.deltaY)>Math.abs(e.deltaX)){e.preventDefault();$('#fl').scrollLeft+=e.deltaY}},{passive:false});

// ---------- Theme toggle (top bar) ----------
// Dark is the CSS default, so only an explicit light preference counts as light
function isDark(){
  const t=document.documentElement.dataset.theme;
  return t?t==='dark':!matchMedia('(prefers-color-scheme:light)').matches;
}
function updateThemeIcon(){
  const dark=isDark();
  $('#themeIcon').innerHTML=dark
    ?'<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>'
    :'<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
  updateThemeColor();
}
function toggleTheme(){setTheme(isDark()?'light':'dark')}
matchMedia('(prefers-color-scheme:light)').addEventListener('change',updateThemeIcon);

// =====================================================================
// P3: loading skeletons, pull to refresh, install as app, drafts
// =====================================================================

// ---------- Loading skeletons ----------
const skL=w=>`<i class="sk-l" style="width:${w}%"></i>`;
const skPost=()=>`<div class="card sk" aria-hidden="true"><div class="who"><span class="av sk-b"></span><div class="grow">${skL(40)}${skL(22)}</div></div>${skL(94)}${skL(68)}<div class="sk-pills"><i class="sk-b"></i><i class="sk-b"></i></div></div>`;
const skPerson=()=>`<div class="card row sk" aria-hidden="true"><span class="av sk-b"></span><div class="grow">${skL(45)}${skL(30)}</div><i class="sk-b sk-btn"></i></div>`;
const skEvent=()=>`<div class="card sk" aria-hidden="true"><div class="row"><i class="sk-b sk-tile"></i><div class="grow">${skL(35)}${skL(60)}${skL(45)}</div></div></div>`;
const skRep=()=>`<div class="rep sk" aria-hidden="true"><span class="av sk-b"></span><div class="grow">${skL(30)}${skL(80)}</div></div>`;
const skProf=()=>`<div class="pfh sk" aria-hidden="true"><span class="av big sk-b"></span>${skL(40)}${skL(25)}${skL(80)}</div>`;

// ---------- Drafts (saved on this device, per account) ----------
const dKey=()=>'il-draft-'+(S.user?.id||'');
const rdKey=()=>'il-rdraft-'+(S.user?.id||'');
function setSel(el,v){if(v&&[...el.options].some(o=>o.value==v))el.value=v}
function saveDraft(){
  const t=$('#txt').value;
  try{
    if(t.trim())localStorage.setItem(dKey(),JSON.stringify({t,a:$('#sel').value,b:$('#sel2').value}));
    else localStorage.removeItem(dKey());
  }catch(e){}
  $('#pdis').hidden=!t.trim();
}
function restoreDraft(){
  let d=null;try{d=JSON.parse(localStorage.getItem(dKey())||'null')}catch(e){}
  if(d&&d.t&&!$('#txt').value){
    $('#txt').value=d.t;setSel($('#sel'),d.a);setSel($('#sel2'),d.b);toast('Draft restored');
  }
  $('#pdis').hidden=!$('#txt').value.trim();
}
function clearDraft(){try{localStorage.removeItem(dKey())}catch(e){}$('#pdis').hidden=true}
function discardDraft(){$('#txt').value='';clearDraft();toast('Draft discarded')}
$('#txt').addEventListener('input',saveDraft);
$('#sel').addEventListener('change',saveDraft);
$('#sel2').addEventListener('change',saveDraft);
// Reply drafts, one per post (last 20 kept)
function rdGet(){try{return JSON.parse(localStorage.getItem(rdKey())||'{}')||{}}catch(e){return{}}}
function rdSet(id,v){
  try{
    const o=rdGet();
    if((v||'').trim())o[id]=v;else delete o[id];
    const k=Object.keys(o);if(k.length>20)delete o[k[0]];
    localStorage.setItem(rdKey(),JSON.stringify(o));
  }catch(e){}
}
function saveRD(){if(S.th)rdSet(S.th,$('#rin').value)}

// ---------- Refresh (used by pull to refresh and when the connection returns) ----------
async function refreshAll(){
  const t=S.tab;
  if(t=='find')await loadPeople();
  else if(t=='meet')await loadEvents();
  else if(t=='me')await Promise.all([loadPosts(),loadFollows(),loadAch()]);
  else await Promise.all([loadPosts(),loadNotifs(),loadFollows()]);
  draw();
}

// ---------- Pull to refresh (touch screens) ----------
const PT={y:0,d:0,on:false,busy:false,box:null};
const ptrEl=document.createElement('div');
ptrEl.id='ptr';ptrEl.setAttribute('aria-hidden','true');
ptrEl.innerHTML='<svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/></svg>';
document.body.appendChild(ptrEl);
function ptrBox(){
  switch(S.tab){
    case 'home':return $('#feed');
    case 'find':return ['#fp','#fg','#fx'].map($).find(e=>e.style.display!=='none');
    case 'meet':return $('#s-meet');
    case 'me':return $('#s-me');
  }
}
function ptrPaint(d,anim){
  ptrEl.classList.toggle('anim',!!anim);
  ptrEl.style.transform='translate(-50%,'+(d-48)+'px)';
  ptrEl.style.opacity=Math.min(1,d/40);
  ptrEl.firstChild.style.transform=PT.busy?'':'rotate('+(d*5)+'deg)';
}
document.addEventListener('touchstart',e=>{
  PT.on=false;
  if(e.touches.length!==1||PT.busy||!S.user||!S.loaded||document.querySelector('.mod.on,.ov.on'))return;
  const b=ptrBox();
  if(!b||!b.contains(e.target)||b.scrollTop>0)return;
  PT.box=b;PT.y=e.touches[0].clientY;PT.d=0;PT.on=true;
},{passive:true});
document.addEventListener('touchmove',e=>{
  if(!PT.on)return;
  const dy=e.touches[0].clientY-PT.y;
  if(dy<=0){if(PT.d){PT.d=0;ptrPaint(0)}return}
  if(PT.box.scrollTop>0){PT.on=false;PT.d=0;ptrPaint(0,true);return}
  if(e.cancelable)e.preventDefault();
  PT.d=Math.min(dy*.5,90);ptrPaint(PT.d);
},{passive:false});
async function ptrEnd(){
  if(!PT.on)return;
  PT.on=false;
  if(PT.d<60){PT.d=0;ptrPaint(0,true);return}
  PT.busy=true;ptrEl.classList.add('busy');ptrPaint(60,true);
  try{await Promise.all([refreshAll(),new Promise(r=>setTimeout(r,500))])}
  catch(e){toast("Couldn't refresh")}
  PT.busy=false;PT.d=0;ptrEl.classList.remove('busy');ptrPaint(0,true);
}
document.addEventListener('touchend',ptrEnd);
document.addEventListener('touchcancel',ptrEnd);

// ---------- Install as app (PWA) ----------
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))
  addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
let instEv=null;
addEventListener('beforeinstallprompt',e=>{e.preventDefault();instEv=e;refreshInstall()});
addEventListener('appinstalled',()=>{instEv=null;refreshInstall();toast('iLike installed')});
function refreshInstall(){
  const show=!standalone()&&!!(instEv||isIOS);
  $('#instl').hidden=!show;$('#instb').hidden=!show;
}
async function installApp(){
  if(instEv){
    const e=instEv;instEv=null;
    e.prompt();await e.userChoice.catch(()=>{});
    refreshInstall();return;
  }
  $('#inf').innerHTML='<div style="font-size:40px">📲</div><div style="font-size:18px;font-weight:800;margin:6px 0">Add iLike to your home screen</div><p style="margin-top:10px">Tap the <b>Share</b> button in Safari, then choose <b>Add to Home Screen</b>.</p>';
  $('#info').classList.add('on');
}
addEventListener('offline',()=>toast("You're offline"));
addEventListener('online',()=>{toast('Back online');if(S.user&&S.loaded)refreshAll().catch(()=>{})});

// Browser bar / status bar colour follows the current theme + accent
function updateThemeColor(){
  const p=document.createElement('i');p.style.cssText='display:none;color:var(--bg)';
  document.body.appendChild(p);const c=getComputedStyle(p).color;p.remove();
  const m=document.querySelector('meta[name="theme-color"]');
  if(m&&c)m.setAttribute('content',c);
}

// Apply saved look on this device before login, then boot
try{applyPrefs(JSON.parse(localStorage.getItem('il-prefs')||'null'))}catch(e){}
updateThemeIcon();paintCustomize();
boot();
