// ---- Supabase connection (both values are safe to be public) ----
const SUPABASE_URL="https://rgrtwewhiylwkxgbcgyx.supabase.co";
const SUPABASE_KEY="sb_publishable_frBJksxES3J_AZICQ619fw_6e7hP59z";
const sb=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

const $=s=>document.querySelector(s);
const S={user:null,name:'',prof:null,ints:[],im:new Map(),mine:new Set(),snap:new Set(),posts:[],myPosts:[],pm:new Map(),people:[],cnt:{},names:{},avs:{},F:'All',tab:'home',mode:'login',err:'',good:false,pick:new Set(),cfFn:null,th:null,reps:null,pmId:null,edId:null,edRm:new Set(),photos:[],msgs:[],notifs:[],nposts:{},dm:null,ch:null,deep:null,rec:false,loaded:false};
const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ago=d=>{const m=Math.floor((Date.now()-new Date(d))/60000);return m<1?'just now':m<60?m+'m ago':m<1440?Math.floor(m/60)+'h ago':Math.floor(m/1440)+'d ago'};
const tm=d=>{const x=new Date(d),t=x.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});return x.toDateString()==new Date().toDateString()?t:x.toLocaleDateString([],{month:'short',day:'numeric'})+' '+t};
const iname=n=>S.im.get(n)?.name||'';
const col=n=>esc(S.im.get(n)?.color||'var(--brand)');
const em=n=>esc(S.im.get(n)?.emoji||'✦');
const cat=n=>S.im.get(n)?.category;
const nm=id=>S.names[id]||(id==S.user?.id?S.name:'Member');
const PAL=['#8B5CF6','#EC4899','#22C55E','#F59E0B','#14B8A6','#3B82F6','#EF4444'];
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
function prep(file,max,square){
  return new Promise((res,rej)=>{
    const url=URL.createObjectURL(file),im=new Image();
    im.onload=()=>{
      URL.revokeObjectURL(url);
      let sw=im.naturalWidth,sh=im.naturalHeight,sx=0,sy=0,w,h;
      if(square){const s=Math.min(sw,sh);sx=(sw-s)/2;sy=(sh-s)/2;sw=sh=s;w=h=Math.min(max,s)}
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
  const cats=[...new Set(S.ints.map(i=>i.category))];
  $('#ob').innerHTML=`<h2 style="margin:18px 0 6px">What do you like?</h2><p class="mute">Pick at least 3. Your feed is built from these.</p>${
    cats.map(c=>`<div class="cath" style="color:${col(S.ints.find(i=>i.category===c).id)}">${esc(c)}</div><div class="pkl">${S.ints.filter(i=>i.category===c).map(i=>`<button class="fc" style="--c:${col(i.id)}" onclick="obPick(this,${i.id})">${em(i.id)} ${esc(i.name)}</button>`).join('')}</div>`).join('')||'<div class="empty">No interests found. Add rows to the interests table in Supabase.</div>'
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
    renderAuth();show('auth');return;
  }
  S.name=S.user.user_metadata?.display_name||(S.user.email||'Me').split('@')[0];
  await sb.from('profiles').upsert({id:S.user.id,username:'user_'+S.user.id.replace(/-/g,'').slice(0,8),display_name:S.name},{onConflict:'id',ignoreDuplicates:true});
  const[pr,i,u]=await Promise.all([
    sb.from('profiles').select('username,display_name,bio,city,theme_prefs,avatar_url').eq('id',S.user.id).single(),
    sb.from('interests').select('*').order('category').order('name'),
    sb.from('user_interests').select('interest_id').eq('user_id',S.user.id)]);
  S.prof=pr.data||{username:'',display_name:S.name,bio:null,city:null,theme_prefs:null,avatar_url:null};
  S.name=S.prof.display_name||S.name;
  if(S.prof.avatar_url)S.avs[S.user.id]=S.prof.avatar_url;
  applyPrefs(S.prof.theme_prefs);
  if(i.error)toast('Could not load interests');
  S.ints=i.data||[];S.im=new Map(S.ints.map(x=>[x.id,x]));
  S.mine=new Set((u.data||[]).map(r=>r.interest_id));S.snap=new Set(S.mine);
  S.names[S.user.id]=S.name;
  if(!S.mine.size){S.pick=new Set();renderOb();show('onb');return}
  subscribe();
  await Promise.all([loadPosts(),loadPeople(),loadMsgs(),loadNotifs()]);
  draw();show(S.tab);S.loaded=true;
  if(S.rec)recoverUi();
  if(S.deep){const d=S.deep;S.deep=null;openPostId(d)}
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
  return `<article class="card" data-pi="${p.id}"><div class="who">${av(p.author_id)}<div class="grow"><b>${esc(nm(p.author_id))}</b><div class="mute sm">${ago(p.created_at)}${p.edited_at?' · edited':''}</div></div>${mine&&!o.t?`<button class="ghost more" onclick="openPm('${p.id}')" aria-label="More options">${dots}</button>`:''}</div><p>${esc(p.body)}</p><div class="path">${p.tags.map(tgb).join('')}</div>${imgs}<div class="acts"><button class="same ${on?'on':''}" onclick="same('${p.id}',this)"><span>Same</span></button>${o.t?'':`<button class="ghost" onclick="openThread('${p.id}')">Reply${p.rc?' · '+p.rc:''}</button>`}<button class="ghost" onclick="share('${p.id}')">Share</button></div><div class="who2" onclick="openSames('${p.id}')">${sm(p)}</div></article>`;
}
async function same(id,btn){
  const p=findPost(id),u=S.user.id,on=!p.sames.includes(u);
  const set=v=>{p.sames=v?[...p.sames,u]:p.sames.filter(x=>x!==u);document.querySelectorAll(`.card[data-pi="${id}"]`).forEach(c=>{c.querySelector('.same').className='same'+(v?' on':'');c.querySelector('.who2').innerHTML=sm(p)})};
  set(on);btn.style.transform='scale(.88)';setTimeout(()=>btn.style.transform='',180);
  const r=on?await sb.from('sames').insert({post_id:p.id,user_id:u}):await sb.from('sames').delete().match({post_id:p.id,user_id:u});
  if(r.error){set(!on);toast("Couldn't save that")}
}
// Who said Same
function openSames(id){
  const p=findPost(id);if(!p||!p.sames.length)return;
  const l=so(p);
  $('#slt').textContent=l.length+(l.length==1?' person said Same':' people said Same');
  $('#sll').innerHTML=l.map(u=>`<div class="prow">${av(u)}<b class="grow">${esc(u==S.user.id?'You':nm(u))}</b>${u==S.user.id?'':`<button class="btn sbtn" onclick="sayHi('${u}')"><span class="wave-btn">👋</span> Say hi</button>`}</div>`).join('');
  $('#sl').classList.add('on');
}
const rel=(p,l)=>p.tags.some(n=>l.has(n))?'like':p.tags.some(n=>[...l].some(m=>cat(m)==cat(n)))?'might':'new';
function home(){
  if(!['All','might','new'].includes(S.F)&&!S.mine.has(S.F))S.F='All';
  $('#fl').innerHTML=[['All','All'],['might','Might like'],['new','New'],...[...S.mine].map(n=>[n,em(n)+' '+iname(n),col(n)])].map(t=>`<button class="fc ${t[0]===S.F?'on':''}" ${t[2]?`style="--c:${t[2]}"`:''} onclick='setF(${JSON.stringify(t[0])})'>${t[1]=='All'||t[1]=='Might like'||t[1]=='New'?t[1]:esc(t[1])}</button>`).join('');
  const F=S.F,l=F=='All'?S.posts.filter(p=>rel(p,S.mine)=='like'):F=='might'||F=='new'?S.posts.filter(p=>rel(p,S.snap)==F):S.posts.filter(p=>p.tags.includes(F));
  $('#feed').innerHTML=l.map(p=>post(p)).join('')||'<div class="empty">No posts here yet.<br>Tap + and write the first one.</div>';
}
function setF(n){S.F=n;if(n=='might'||n=='new')S.snap=new Set(S.mine);home()}

// ---------- Compose ----------
function tapFab(){
  const o=[...S.mine].map(n=>`<option value="${n}">${em(n)} ${esc(iname(n))}</option>`).join('');
  $('#sel').innerHTML=o;
  $('#sel2').innerHTML='<option value="">Mix with another interest (optional)</option>'+o;
  $('#fabBtn').classList.add('spin');$('#mod').classList.add('on');
}
function closePost(){$('#fabBtn').classList.remove('spin');$('#mod').classList.remove('on')}
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
  $('#txt').value='';closePost();S.F='All';
  await loadPosts();draw();$('#feed').scrollTop=0;
  toast(t.error?'Posted, but tags failed':imgFail?'Posted, but photos failed':'Posted');
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
const rep=r=>`<div class="rep">${av(r.author_id)}<div class="grow"><div><b>${esc(nm(r.author_id))}</b> <span class="mute sm">${ago(r.created_at)}</span></div><div class="rbody">${esc(r.body)}</div></div>${r.author_id==S.user.id?`<button class="ghost" onclick="delReply('${r.id}')">Delete</button>`:''}</div>`;
function renderThread(){
  const p=findPost(S.th);if(!p){closeThread();return}
  $('#thp').innerHTML=post(p,{t:1});
  $('#thr').innerHTML=S.reps===null?'<div class="empty">Loading...</div>':S.reps.length?S.reps.map(rep).join(''):'<div class="empty">No replies yet.<br>Say something.</div>';
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
function openThread(id){S.th=String(id);$('#rin').value='';$('#th').classList.add('on');loadReplies(S.th)}
function closeThread(){S.th=null;$('#th').classList.remove('on')}
async function sendReply(){
  const v=$('#rin').value.trim();if(!v||!S.th)return;
  const b=$('#rsend');b.disabled=true;
  const{error}=await sb.from('replies').insert({post_id:S.th,author_id:S.user.id,body:v});
  b.disabled=false;
  if(error){toast(error.message);return}
  $('#rin').value='';await loadReplies(S.th);draw();$('#thbody').scrollTop=1e5;
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
  $('#ppl').innerHTML=S.people.map(p=>({p,c:p.ids.filter(x=>S.mine.has(x))})).filter(o=>(o.p.name+o.p.ids.map(iname).join()).toLowerCase().includes(q)).sort((a,b)=>b.c.length-a.c.length).map(o=>`<div class="card row">${av(o.p.id)}<div class="grow"><b>${esc(o.p.name)}</b><div class="mute sm">${o.c.length?'You both like':'Into'}</div><div>${(o.c.length?o.c:o.p.ids.slice(0,2)).map(chip).join('')}</div></div><button class="btn" onclick="sayHi('${o.p.id}')"><span class="wave-btn">👋</span> Say hi</button></div>`).join('')||'<div class="empty">No one else here yet.<br>Invite a friend to see them.</div>';
  $('#rooms').innerHTML=S.ints.filter(i=>i.name.toLowerCase().includes(q)).map(i=>`<button class="room" onclick="openChat(${i.id},1)"><span>${em(i.id)}</span>${esc(i.name)}</button>`).join('')||'<div class="empty">No circles found</div>';
  const m=mix(q);
  $('#fx').innerHTML=m.length?'<div class="gridx">'+m.map(p=>{
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
  const pr=S.prof||{};
  setMyAv($('#mav'));$('#mn').textContent=S.name;
  $('#mu').textContent='@'+(pr.username||'')+(pr.city?' · '+pr.city:'');
  $('#mb').textContent=pr.bio||'';$('#mb').hidden=!pr.bio;
  $('#shelf').innerHTML=[...S.mine].map(chip).join('')+`<button class="chip addb" onclick="openPk()">＋ Add</button>`;
  $('#mine').innerHTML=S.myPosts.map(p=>post(p)).join('')||'<div class="empty">No posts yet.<br>Tap + on Home to write one.</div>';
}
function drawPk(){$('#pkl').innerHTML=S.ints.map(i=>{const on=S.mine.has(i.id);return `<button class="fc ${on?'on':''}" style="--c:${col(i.id)}" onclick="ask(${i.id})">${em(i.id)} ${esc(i.name)}${on?' ✓':''}</button>`}).join('')}
function openPk(){drawPk();$('#pk').classList.add('on')}
function ask(n){
  const on=S.mine.has(n);
  confirmBox((on?'Remove ':'Add ')+iname(n)+(on?' from':' to')+' your interests?',on?'Remove':'Add',()=>toggleInt(n));
}
async function toggleInt(n){
  const on=S.mine.has(n);
  const r=on?await sb.from('user_interests').delete().match({user_id:S.user.id,interest_id:n}):await sb.from('user_interests').insert({user_id:S.user.id,interest_id:n});
  if(r.error){toast(r.error.message);return}
  on?S.mine.delete(n):S.mine.add(n);
  draw();if($('#pk').classList.contains('on'))drawPk();toast((on?'Removed ':'Added ')+iname(n));
}
function draw(){home();findTab();meTab();refreshPv()}

// ---------- Edit profile ----------
function openPe(){
  const p=S.prof||{};
  $('#pen').value=S.name||'';$('#peu').value=p.username||'';$('#peb').value=p.bio||'';$('#pec').value=p.city||'';
  $('#pbc').textContent=($('#peb').value.length)+'/160';$('#pee').textContent='';
  setMyAv($('#peav'));$('#perm').hidden=!S.avs[S.user.id];
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
    setMyAv($('#peav'));$('#perm').hidden=false;draw();toast('Photo updated');
  }catch(e){toast(e.message||"Couldn't upload that photo")}
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
  paintCustomize();$('#set').classList.add('on');
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
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications',filter:'user_id=eq.'+id},p=>onNotif(p.new))
    .subscribe();
}
function updateBadges(){
  const me=S.user?.id,m=S.msgs.filter(x=>x.to_user==me&&!x.read_at).length,n=S.notifs.filter(x=>!x.read_at).length;
  const set=(id,v)=>{const e=$(id);e.hidden=!v;e.textContent=v>9?'9+':v};
  set('#chb',m);set('#nb',n);
}
// Catch up when the app comes back to the foreground (in case a live update was missed)
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&S.user&&S.loaded){loadMsgs();loadNotifs()}});

// ---------- Messages (1-to-1) ----------
let conv=false,ctab=0;
async function loadMsgs(){
  const r=await sb.from('messages').select('*').order('created_at',{ascending:false}).limit(1000);
  if(r.error)return;
  S.msgs=r.data.reverse();updateBadges();
  if($('#ov').classList.contains('on')){conv&&S.dm?drawDm():(!conv&&openChats())}
}
const convoOf=id=>S.msgs.filter(m=>(m.sender_id==id&&m.to_user==S.user.id)||(m.sender_id==S.user.id&&m.to_user==id));
function openChats(){
  conv=false;S.dm=null;
  $('#ov').classList.add('on');$('#ct').textContent='Chats';$('#cv').style.display='none';$('#cl').style.display='block';
  const me=S.user.id;
  const tabs=`<div class="tabs"><button class="${ctab?'':'on'}" onclick="ctab=0;openChats()">Friends</button><button class="${ctab?'on':''}" onclick="ctab=1;openChats()">Circles</button></div>`;
  let body;
  if(ctab){
    body=S.ints.map(i=>`<div class="card row" onclick="openChat(${i.id},1)"><div class="tile">${em(i.id)}</div><b>${esc(i.name)}</b></div>`).join('');
  }else{
    const rows=S.people.map(p=>{const l=convoOf(p.id);return{p,last:l[l.length-1],un:l.filter(m=>m.to_user==me&&!m.read_at).length}})
      .sort((a,b)=>(b.last?+new Date(b.last.created_at):0)-(a.last?+new Date(a.last.created_at):0));
    body=rows.map(o=>`<div class="card row" onclick="openDm('${o.p.id}')">${av(o.p.id)}<div class="grow"><b>${esc(o.p.name)}</b>${o.last?`<div class="mute sm clip">${o.last.sender_id==me?'You: ':''}${esc(o.last.body)}</div>`:'<div class="mute sm">Say hi 👋</div>'}</div>${o.un?`<span class="dot">${o.un}</span>`:''}</div>`).join('')
      ||'<div class="empty">No one else here yet.<br>Invite a friend to start chatting.</div>';
  }
  $('#cl').innerHTML=tabs+body;
}
function openDm(id){
  id=String(id);S.dm=id;conv=true;
  $('#ov').classList.add('on');$('#cl').style.display='none';$('#cv').style.display='flex';
  $('#ct').textContent=nm(id);drawDm();markRead(id);
}
function drawDm(){
  const l=convoOf(S.dm),me=S.user.id;
  $('#msgs').innerHTML=l.length
    ?l.map(m=>`<div class="b ${m.sender_id==me?'me':''}">${esc(m.body)}<small class="t">${tm(m.created_at)}</small></div>`).join('')
    :`<div class="empty" style="margin:auto"><div style="font-size:44px;margin-bottom:8px">👋</div><b>Say hi to ${esc(nm(S.dm))}</b></div>`;
  $('#msgs').scrollTop=1e5;
}
// Circle chat is still coming soon
function openChat(k,room){
  S.dm=null;conv=true;$('#ov').classList.add('on');$('#cl').style.display='none';$('#cv').style.display='flex';$('#ct').textContent=room?iname(k):nm(k);
  $('#msgs').innerHTML='<div class="empty" style="margin:auto"><div style="font-size:44px;margin-bottom:8px">💬</div><b>Circle chat is coming soon</b></div>';
}
// "Say hi" from Discover and from the Same list
function sayHi(id){
  $('#sl').classList.remove('on');$('#pv').classList.remove('on');closeThread();
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
  if(!S.dm){toast('Circle chat is coming soon');return}
  $('#mi').value='';
  const{data,error}=await sb.from('messages').insert({sender_id:S.user.id,to_user:S.dm,body:v}).select().single();
  if(error){$('#mi').value=v;toast(error.message);return}
  S.msgs.push(data);if(conv&&S.dm==data.to_user)drawDm();
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
function back(){conv?openChats():$('#ov').classList.remove('on')}

// ---------- Notifications ----------
async function notifMeta(list){
  await getProfiles(list.map(n=>n.actor_id));
  const need=[...new Set(list.map(n=>n.post_id))].filter(id=>!(id in S.nposts)&&!findPost(id));
  if(need.length){const r=await sb.from('posts').select('id,body').in('id',need);(r.data||[]).forEach(x=>S.nposts[x.id]=x.body)}
}
const nsnip=n=>{const p=findPost(n.post_id),b=p?p.body:(S.nposts[n.post_id]||'');return b.length>80?b.slice(0,80)+'…':b};
async function loadNotifs(){
  const r=await sb.from('notifications').select('id,type,post_id,actor_id,created_at,read_at').order('created_at',{ascending:false}).limit(40);
  if(r.error)return;
  await notifMeta(r.data);S.notifs=r.data;updateBadges();
  if($('#nv').classList.contains('on'))drawNotifs();
}
function drawNotifs(){
  $('#nl').innerHTML=S.notifs.map(n=>`<div class="card row nitem ${n.read_at?'':'new'}" onclick="openNotif('${n.id}')">${av(n.actor_id)}<div class="grow"><div><b>${esc(nm(n.actor_id))}</b> ${n.type=='same'?'said Same to your post':'replied to your post'}</div><div class="mute sm clip">${esc(nsnip(n))}</div></div><span class="mute sm">${ago(n.created_at)}</span></div>`).join('')
    ||'<div class="empty">Nothing yet.<br>When someone says Same or replies, you will see it here.</div>';
}
function markNotifsRead(){
  const un=S.notifs.filter(n=>!n.read_at);if(!un.length)return;
  const now=new Date().toISOString();un.forEach(n=>n.read_at=now);updateBadges();
  sb.from('notifications').update({read_at:now}).eq('user_id',S.user.id).is('read_at',null).then(()=>{});
}
function openNotifs(){drawNotifs();$('#nv').classList.add('on');markNotifsRead()}
async function openNotif(id){
  const n=S.notifs.find(x=>x.id===id);if(!n)return;
  if(!(await ensurePost(n.post_id)))return;
  n.type=='reply'?openThread(n.post_id):openPost(n.post_id);
}
async function onNotif(n){
  await notifMeta([n]);
  if(S.notifs.some(x=>x.id===n.id))return;
  S.notifs.unshift(n);
  toast(nm(n.actor_id)+(n.type=='same'?' said Same to your post':' replied to your post'));
  if($('#nv').classList.contains('on')){drawNotifs();markNotifsRead()}else updateBadges();
}

document.querySelectorAll('#nav button').forEach(b=>b.onclick=async()=>{
  const s=b.dataset.s;show(s);
  if(s=='find')await loadPeople();else await loadPosts();
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
}
function toggleTheme(){setTheme(isDark()?'light':'dark')}
matchMedia('(prefers-color-scheme:light)').addEventListener('change',updateThemeIcon);

// Apply saved look on this device before login, then boot
try{applyPrefs(JSON.parse(localStorage.getItem('il-prefs')||'null'))}catch(e){}
updateThemeIcon();paintCustomize();
boot();
