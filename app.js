// ---- Supabase connection (both values are safe to be public) ----
const SUPABASE_URL="https://rgrtwewhiylwkxgbcgyx.supabase.co";
const SUPABASE_KEY="sb_publishable_frBJksxES3J_AZICQ619fw_6e7hP59z";
const sb=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
// Shown on the Terms / Privacy / Contact sheet. Must be an inbox you check.
const CONTACT_EMAIL='ilike.team789@gmail.com';
const APP_URL=()=>location.origin+location.pathname;

const $=s=>document.querySelector(s);
const S={user:null,name:'',prof:null,ints:[],im:new Map(),mine:new Set(),snap:new Set(),posts:[],myPosts:[],pm:new Map(),people:[],cnt:{},names:{},avs:{},roles:{},role:'user',blocked:new Set(),reports:null,nrep:0,ax:null,rp:null,ua:null,am:null,mg:null,F:'All',tab:'home',mode:'login',err:'',good:false,pick:new Set(),cfFn:null,th:null,reps:null,pmId:null,edId:null,edRm:new Set(),photos:[],msgs:[],notifs:[],nposts:{},dm:null,ch:null,deep:null,rec:false,loaded:false,fol:new Set(),folrs:new Set(),evs:null,evm:new Map(),evId:null,evEm:'📍',room:null,cm:null,cch:null,pf:null,pkm:'int',achCat:[],achMine:new Map(),achReady:false,mt:0,liked:null};
const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ago=d=>{const m=Math.floor((Date.now()-new Date(d))/60000);return m<1?'just now':m<60?m+'m ago':m<1440?Math.floor(m/60)+'h ago':Math.floor(m/1440)+'d ago'};
const tm=d=>{const x=new Date(d),t=x.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});return x.toDateString()==new Date().toDateString()?t:x.toLocaleDateString([],{month:'short',day:'numeric'})+' '+t};
const iname=n=>S.im.get(n)?.name||'';
const col=n=>esc(S.im.get(n)?.color||'var(--brand)');
const em=n=>esc(S.im.get(n)?.emoji||(S.im.get(n)?.kind=='artist'?'🎤':'✦'));
const cat=n=>S.im.get(n)?.category;
// Role badge shown next to names (roles come from profiles.role)
const rb=id=>{const r=S.roles[id];return r=='admin'?' <span class="rbadge ad">Admin</span>':r=='mod'?' <span class="rbadge">Mod</span>':''};
const isMod=()=>S.role=='mod'||S.role=='admin',isAdmin=()=>S.role=='admin';
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
const so=p=>{const a=p.sames.filter(x=>x!=S.user.id&&!bl(x));return p.sames.includes(S.user.id)?[S.user.id,...a]:a};
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
const authMsg=e=>{const m=(e&&e.message)||'';
  return /invalid login/i.test(m)?'Wrong email or password.'
  :/not confirmed/i.test(m)?'Please confirm your email first. Check your inbox and spam folder.'
  :/already registered/i.test(m)?'That email already has an account. Log in instead.'
  :/rate limit|too many|security purposes/i.test(m)?'Too many tries. Wait a few minutes and try again.'
  :/database error saving new user/i.test(m)?"That invite code isn't valid or has been used up."
  :/password/i.test(m)&&/least|short|weak/i.test(m)?'That password is too short or too weak.'
  :m||'Something went wrong. Try again.'};
function keep(o){for(const k in o){const el=document.getElementById(k);if(el&&o[k])el.value=o[k]}}
function renderAuth(){
  const su=S.mode=='signup';
  $('#af').innerHTML=`${su?'<input class="fi" id="an" placeholder="Your name" autocomplete="name" maxlength="40">':''}<input class="fi" id="ae" type="email" placeholder="Email" autocomplete="email">${su?'<input class="fi" id="ai" placeholder="Invite code" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="40">':''}<input class="fi" id="ap" type="password" placeholder="${su?'Password (8+ characters)':'Password'}" autocomplete="${su?'new':'current'}-password" onkeydown="if(event.key==='Enter')go()"><div class="err ${S.good?'ok':''}">${esc(S.err)}</div>${S.unconf?'<button class="link" onclick="resendConfirm()">Resend confirmation email</button>':''}<button class="btn" style="width:100%" id="ago" onclick="go()">${su?'Create account':'Log in'}</button>${su?'<p class="mute sm legalnote">By creating an account you agree to the <button class="inl" onclick="openLegal(\'terms\')">Terms</button> and <button class="inl" onclick="openLegal(\'privacy\')">Privacy Policy</button>.</p>':'<button class="link" onclick="forgot()">Forgot password?</button>'}<button class="link" onclick="swap()">${su?'Have an account? Log in':'New here? Create an account'}</button><div class="legalfoot"><button class="link" onclick="openLegal('terms')">Terms</button><button class="link" onclick="openLegal('privacy')">Privacy</button><button class="link" onclick="openLegal('contact')">Contact</button></div>`;
  if(su&&S.invite)keep({ai:S.invite});
}
function swap(){S.mode=S.mode=='login'?'signup':'login';S.err='';S.good=false;S.unconf='';renderAuth()}
async function go(){
  const email=$('#ae').value.trim(),password=$('#ap').value,name=$('#an')?.value.trim(),invite=($('#ai')?.value||'').trim().toUpperCase();
  const su=S.mode=='signup';
  S.err='';S.good=false;S.unconf='';
  const fail=m=>{S.err=m;if(su)S.invite=invite;renderAuth();keep({ae:email,an:name})};
  if(!email)return fail('Enter your email.');
  if(su){
    if(!invite)return fail('Enter your invite code.');
    if(password.length<8)return fail('Use 8 or more characters for your password.');
  }
  $('#ago').disabled=true;
  if(su){
    const ok=await sb.rpc('invite_ok',{c:invite});
    if(ok.error)return fail(authMsg(ok.error));
    if(!ok.data)return fail("That invite code isn't valid or has been used up.");
  }
  const r=su
    ?await sb.auth.signUp({email,password,options:{emailRedirectTo:APP_URL(),data:{display_name:name||email.split('@')[0],invite_code:invite}}})
    :await sb.auth.signInWithPassword({email,password});
  if(r.error){if(/not confirmed/i.test(r.error.message))S.unconf=email;return fail(authMsg(r.error))}
  if(su&&r.data.user&&r.data.user.identities&&!r.data.user.identities.length)return fail('That email already has an account. Log in instead.');
  if(su&&!r.data.session){S.mode='login';S.invite='';S.unconf=email;S.err='Check your email to confirm your account, then log in.';S.good=true;renderAuth();keep({ae:email});return}
  S.invite='';
}
async function resendConfirm(){
  const email=S.unconf||$('#ae')?.value.trim();
  if(!email)return;
  if(Date.now()-(S.resendAt||0)<60000){toast('Wait a minute before asking again');return}
  S.resendAt=Date.now();
  const{error}=await sb.auth.resend({type:'signup',email,options:{emailRedirectTo:APP_URL()}});
  S.err=error?authMsg(error):'Sent. Check your inbox and spam folder.';S.good=!error;
  if(!error)S.unconf=email;
  renderAuth();keep({ae:email});
}
async function forgot(){
  const email=$('#ae').value.trim();
  if(!email){S.err='Type your email first.';S.good=false;renderAuth();return}
  const{error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:APP_URL()});
  S.err=error?authMsg(error):'Check your email for a reset link.';S.good=!error;
  renderAuth();keep({ae:email});
}
async function logout(){await sb.auth.signOut();S.tab='home';S.F='All';S.loaded=false}

// ---------- Onboarding (first login): interests, profile, follow, first post ----------
const obHead=n=>`<div class="obp">Step ${n} of 4</div>`;
function renderOb(){
  const st=S.obStep||0,el=$('#ob');
  if(st==0)obInterests(el);else if(st==1)obProfileUi(el);else if(st==2)obPeopleUi(el);else obPostUi(el);
}
function obInterests(el){
  const L=S.ints.filter(i=>i.kind!='artist'),cats=[...new Set(L.map(i=>i.category))];
  el.innerHTML=`${obHead(1)}<h2 style="margin:6px 0 6px">What do you like?</h2><p class="mute">Pick at least 3. Your feed is built from these.</p>${
    cats.map(c=>`<div class="cath" style="color:${col(L.find(i=>i.category===c).id)}">${esc(c)}</div><div class="pkl">${L.filter(i=>i.category===c).map(i=>`<button class="fc" style="--c:${col(i.id)}" onclick="obPick(this,${i.id})">${em(i.id)} ${esc(i.name)}</button>`).join('')}</div>`).join('')||'<div class="empty">No interests found. Open the app once as admin to load them.</div>'
  }<div class="err" id="oe"></div><button class="btn" id="obs" style="width:100%" onclick="saveOb(this)" disabled>Continue (0)</button>`;
}
function obPick(b,id){S.pick.has(id)?S.pick.delete(id):S.pick.add(id);b.classList.toggle('on');const s=$('#obs');s.disabled=S.pick.size<3;s.textContent='Continue ('+S.pick.size+')'}
async function saveOb(b){
  b.disabled=true;
  const{error}=await sb.from('user_interests').insert([...S.pick].map(n=>({user_id:S.user.id,interest_id:n})));
  if(error){$('#oe').textContent=error.message;b.disabled=false;return}
  S.mine=new Set(S.pick);S.snap=new Set(S.mine);
  if(S.obLegacy){load();return}
  obGo(1);
}
async function obGo(n){
  S.obStep=n;
  if(n==2){
    $('#ob').innerHTML=obHead(3)+skPerson().repeat(3);
    await Promise.all([loadPeople(),loadFollows()]);
    if(S.obStep!=2)return;
  }
  renderOb();
  const sc=$('#ob').closest('.pscroll');if(sc)sc.scrollTop=0;
}
function obProfileUi(el){
  const has=!!S.avs[S.user.id];
  el.innerHTML=`${obHead(2)}<h2 style="margin:6px 0 6px">Put a face to your name</h2><p class="mute">A photo and a line about you help people say hi. You can skip this and do it later.</p><div class="obav"><span class="av big" id="obav" style="--c:var(--brand)"></span><button class="btn off sbtn" id="obab" onclick="$('#obf').click()">${has?'Change photo':'Add photo'}</button><input type="file" id="obf" accept="image/*" hidden onchange="obAvatar(this)"></div><label class="lab" for="obb">Bio</label><textarea id="obb" class="bioin" maxlength="160" placeholder="Tell people what you are into">${esc(S.prof.bio||'')}</textarea><label class="lab" for="obc">City</label><input class="fi" id="obc" maxlength="40" autocomplete="address-level2" value="${esc(S.prof.city||'')}"><div class="err" id="oe"></div><button class="btn" style="width:100%" id="obn" onclick="obProf(this)">Continue</button><button class="link" onclick="obGo(2)">Skip for now</button>`;
  setMyAv($('#obav'));
}
function obAvatar(inp){
  const f=inp.files[0];inp.value='';if(!f)return;
  cropFile(f,'avatar',async blob=>{
    toast('Uploading photo...');
    try{await setAvatarBlob(blob);setMyAv($('#obav'));$('#obab').textContent='Change photo';toast('Photo added')}
    catch(e){toast(e.message||"Couldn't upload that photo")}
  });
}
async function obProf(b){
  const bio=$('#obb').value.trim(),city=$('#obc').value.trim();
  if((bio||null)!==(S.prof.bio||null)||(city||null)!==(S.prof.city||null)){
    b.disabled=true;
    const{error}=await sb.from('profiles').update({bio:bio||null,city:city||null}).eq('id',S.user.id);
    b.disabled=false;
    if(error){$('#oe').textContent=error.message;return}
    S.prof.bio=bio||null;S.prof.city=city||null;
  }
  obGo(2);
}
function obCands(){
  return S.people.map(p=>({p,sh:p.ids.filter(n=>S.mine.has(n)),team:['admin','mod'].includes(S.roles[p.id])}))
    .sort((a,b)=>b.team-a.team||b.sh.length-a.sh.length||a.p.name.localeCompare(b.p.name)).slice(0,8);
}
const obFolLabel=()=>S.fol.size>=3?'Continue':S.fol.size?'Continue ('+S.fol.size+' followed)':'Skip for now';
function obPeopleUi(el){
  const rows=obCands().map(({p,sh,team})=>{
    const fo=S.fol.has(p.id);
    return `<div class="card row">${av(p.id)}<div class="grow"><b>${esc(p.name)}${rb(p.id)}</b><div class="mute sm">${sh.length?sh.slice(0,4).map(em).join(' ')+' '+sh.length+' in common':team?'The iLike team':'New to you'}</div></div><button class="btn sbtn ${fo?'off':''}" style="margin:0" onclick="obTog('${p.id}',this)">${fo?'Following ✓':'Follow'}</button></div>`}).join('');
  el.innerHTML=`${obHead(3)}<h2 style="margin:6px 0 6px">Follow a few people</h2><p class="mute">Posts from people you follow show up in your Following tab. Pick 3 to start.</p>${rows||'<div class="empty">You are one of the first here.<br>People will appear in Discover as they join.</div>'}<div class="err" id="oe"></div><button class="btn" style="width:100%;margin-top:8px" id="obn" onclick="obGo(3)">${obFolLabel()}</button>`;
}
async function obTog(id,btn){
  if(btn.dataset.busy)return;btn.dataset.busy=1;
  const on=!S.fol.has(id),paint=v=>{btn.textContent=v?'Following ✓':'Follow';btn.classList.toggle('off',v);const n=$('#obn');if(n)n.textContent=obFolLabel()};
  on?S.fol.add(id):S.fol.delete(id);paint(on);
  const r=on?await sb.from('follows').insert({follower_id:S.user.id,following_id:id}):await sb.from('follows').delete().match({follower_id:S.user.id,following_id:id});
  delete btn.dataset.busy;
  if(r.error){on?S.fol.delete(id):S.fol.add(id);paint(!on);toast("Couldn't update that")}
}
function obPostUi(el){
  const L=[...S.mine].filter(n=>!isArt(n)),first=(S.name||'').split(' ')[0]||'there';
  const hi=`Hi, I'm ${first}! I'm into ${L.slice(0,2).map(iname).join(' and ')}. Who else?`;
  el.innerHTML=`${obHead(4)}<h2 style="margin:6px 0 6px">Say hi</h2><p class="mute">Write your first post so people know you are here. You can edit the words.</p><textarea id="obt" maxlength="1000" aria-label="First post">${esc(hi)}</textarea><select id="obi" aria-label="Interest">${L.map(n=>`<option value="${n}">${em(n)} ${esc(iname(n))}</option>`).join('')}</select><div class="err" id="oe"></div><button class="btn" style="width:100%" id="obn" onclick="obSendPost(this)">Post and finish</button><button class="link" onclick="finishOb()">Skip and finish</button>`;
}
async function obSendPost(b){
  const v=$('#obt').value.trim(),a=+$('#obi').value;
  if(!v||!a){finishOb();return}
  b.disabled=true;
  const{data,error}=await sb.from('posts').insert({author_id:S.user.id,body:v}).select('id').single();
  if(error){b.disabled=false;$('#oe').textContent=errMsg(error);return}
  await sb.from('post_interests').insert({post_id:data.id,interest_id:a});
  finishOb();
}
async function finishOb(){
  if(S.obBusy)return;S.obBusy=true;
  const r=await sb.rpc('finish_onboarding');
  S.obBusy=false;
  if(r.error){toast("Couldn't finish setup. Try again.");return}
  if(S.prof)S.prof.onboarded_at=new Date().toISOString();
  S.obStep=0;S.F='All';
  await load();toast('Welcome to iLike ✦');
}

// ---------- Data ----------
async function boot(){
  if(location.hash.includes('type=recovery'))S.rec=true;
  const iv=location.hash.match(/^#invite=([A-Za-z0-9_-]{3,40})/i);if(iv){S.invite=iv[1].toUpperCase();S.mode='signup';history.replaceState(null,'',location.pathname)}
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
    S.posts=[];S.myPosts=[];S.pm=new Map();S.mine=new Set();S.names={};S.avs={};S.roles={};S.role='user';S.blocked=new Set();S.reports=null;S.nrep=0;S.msgs=[];S.notifs=[];S.prof=null;S.loaded=false;
    S.mt=0;S.liked=null;S.fol=new Set();S.folrs=new Set();S.evs=null;S.evm=new Map();S.achMine=new Map();S.achReady=false;S.pf=null;leaveRoom();
    renderAuth();show('auth');return;
  }
  S.name=S.user.user_metadata?.display_name||(S.user.email||'Me').split('@')[0];
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
  if(S.prof.avatar_url)S.avs[S.user.id]=S.prof.avatar_url;
  applyPrefs(S.prof.theme_prefs);
  if(i.error)toast('Could not load interests');
  S.ints=i.data||[];S.im=new Map(S.ints.map(x=>[x.id,x]));
  if(isAdmin()){const ce=await syncInterestCatalog();if(ce)toast('Interest catalog sync failed: '+ce.message);else await loadInts()}
  if(isMod())loadRepCount();
  S.mine=new Set((u.data||[]).map(r=>r.interest_id));S.snap=new Set(S.mine);
  S.names[S.user.id]=S.name;
  S.obLegacy=!!oa.error; // column missing (SQL not run): fall back to the old interests-only check
  const needOb=oa.error?!S.mine.size:!oa.data?.onboarded_at;
  if(needOb){S.pick=new Set();S.obStep=S.mine.size?1:0;renderOb();show('onb');return}
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
  const a=await sb.from('profiles').select('id,display_name,avatar_url,role').in('id',ids);
  (a.data||[]).forEach(x=>{S.names[x.id]=x.display_name;S.roles[x.id]=x.role||'user';if(x.avatar_url)S.avs[x.id]=x.avatar_url;else delete S.avs[x.id]});
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
  S.posts=f.data.map(r=>by.get(r.id)).filter(p=>!bl(p.author_id));
  S.myPosts=m.data.map(r=>by.get(r.id));
}
async function loadPeople(){
  const{data}=await sb.from('user_interests').select('user_id,interest_id,profiles(display_name,avatar_url,role)');
  const m={},c={};
  (data||[]).forEach(r=>{
    c[r.interest_id]=(c[r.interest_id]||0)+1;if(r.user_id===S.user.id)return;
    (m[r.user_id]||(m[r.user_id]={id:r.user_id,name:r.profiles?.display_name||'Member',ids:[]})).ids.push(r.interest_id);
    if(r.profiles?.avatar_url)S.avs[r.user_id]=r.profiles.avatar_url;
    S.roles[r.user_id]=r.profiles?.role||'user';
  });
  S.people=Object.values(m).filter(p=>!bl(p.id));S.cnt=c;S.people.forEach(p=>S.names[p.id]=p.name);
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
  return `<article class="card" data-pi="${p.id}"><div class="who"><span class="lk" onclick="openProfile('${p.author_id}')">${av(p.author_id)}</span><div class="grow"><b class="lk" onclick="openProfile('${p.author_id}')">${esc(nm(p.author_id))}${rb(p.author_id)}</b><div class="mute sm">${ago(p.created_at)}${p.edited_at?' · edited':''}</div></div>${!o.t?`<button class="ghost more" onclick="${mine?`openPm('${p.id}')`:`openAx('post','${p.id}')`}" aria-label="More options">${dots}</button>`:''}</div><p>${esc(p.body)}</p><div class="path">${p.tags.map(tgb).join('')}</div>${imgs}<div class="acts"><button class="same ${on?'on':''}" onclick="same('${p.id}',this)"><span>Same</span></button>${o.t?'':`<button class="ghost" onclick="openThread('${p.id}')">Reply${p.rc?' · '+p.rc:''}</button>`}<button class="ghost" onclick="share('${p.id}')">Share</button></div><div class="who2" onclick="openSames('${p.id}')">${sm(p)}</div></article>`;
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
  if(muted())return;
  const v=$('#txt').value.trim(),a=+$('#sel').value,b=+$('#sel2').value;
  if(!v){$('#txt').focus();return}
  if(!a){toast('Add something you like first');return}
  const btn=$('#shr');btn.disabled=true;btn.textContent=S.photos.length?'Posting...':'Share';
  const{data,error}=await sb.from('posts').insert({author_id:S.user.id,body:v}).select('id').single();
  if(error){btn.disabled=false;btn.textContent='Share';toast(errMsg(error));return}
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
function openPm(id){
  S.pmId=id;const p=findPost(id);
  $('#pmEdit').style.display=p&&p.author_id==S.user.id?'':'none';  // only the author edits; mods can only remove
  $('#pm').classList.add('on');
}
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
    const{data,error}=await sb.from('posts').delete().eq('id',id).select('id');
    if(error||!data||!data.length){toast(error?error.message:"Couldn't delete the post");return}
    if(imgs.length)rmFiles('post-images',imgs);
    S.pm.delete(String(id));
    S.posts=S.posts.filter(p=>p.id!==id);S.myPosts=S.myPosts.filter(p=>p.id!==id);
    $('#pv').classList.remove('on');draw();toast('Deleted');
  });
}

// ---------- Replies ----------
const rep=r=>`<div class="rep"><span class="lk" onclick="openProfile('${r.author_id}')">${av(r.author_id)}</span><div class="grow"><div><b class="lk" onclick="openProfile('${r.author_id}')">${esc(nm(r.author_id))}${rb(r.author_id)}</b> <span class="mute sm">${ago(r.created_at)}</span></div><div class="rbody">${esc(r.body)}</div></div>${r.author_id==S.user.id?`<button class="ghost" onclick="delReply('${r.id}')">Delete</button>`:`<button class="ghost" onclick="openAx('reply','${r.id}')" aria-label="More options">⋯</button>`}</div>`;
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
    S.reps=r.data.filter(x=>!bl(x.author_id));const p=findPost(id);if(p)p.rc=r.data.length;
  }
  renderThread();
}
function openThread(id){S.th=String(id);$('#rin').value=rdGet()[S.th]||'';$('#th').classList.add('on');loadReplies(S.th)}
function closeThread(){S.th=null;$('#th').classList.remove('on')}
async function sendReply(){
  const v=$('#rin').value.trim();if(!v||!S.th)return;
  if(muted())return;
  const b=$('#rsend');b.disabled=true;
  const{error}=await sb.from('replies').insert({post_id:S.th,author_id:S.user.id,body:v});
  b.disabled=false;
  if(error){toast(errMsg(error));return}
  $('#rin').value='';rdSet(S.th,'');await loadReplies(S.th);draw();$('#thbody').scrollTop=1e5;checkAch();
}
function delReply(id){
  confirmBox('Delete this reply?','Delete',async()=>{
    const{data,error}=await sb.from('replies').delete().eq('id',id).select('id');
    if(error||!data||!data.length){toast(error?error.message:"Couldn't delete the reply");return}
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
  $('#ppl').innerHTML=S.skel&&!S.people.length?skPerson().repeat(4):S.people.map(p=>({p,c:p.ids.filter(x=>S.mine.has(x))})).filter(o=>(o.p.name+o.p.ids.map(iname).join()).toLowerCase().includes(q)).sort((a,b)=>b.c.length-a.c.length).map(o=>`<div class="card row tapc" onclick="openProfile('${o.p.id}')">${av(o.p.id)}<div class="grow"><b>${esc(o.p.name)}${rb(o.p.id)}</b><div class="mute sm">${o.c.length?'You both like':'Into'}</div><div>${(o.c.length?o.c:o.p.ids.slice(0,2)).map(chip).join('')}</div></div><div class="acol"><button class="btn" onclick="event.stopPropagation();sayHi('${o.p.id}')"><span class="wave-btn">👋</span> Say hi</button><button class="btn off sbtn" style="margin:0" onclick="event.stopPropagation();toggleFollow('${o.p.id}')">${S.fol.has(o.p.id)?'Following ✓':'Follow'}</button></div></div>`).join('')||'<div class="empty">No one else here yet.<br>Invite a friend to see them.</div>';
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
  setMyAv($('#mav'));setBanner($('#mbn'),pr.banner_url);$('#mn').innerHTML=esc(S.name)+rb(S.user.id);
  $('#mu').textContent='@'+(pr.username||'')+(pr.city?' · '+pr.city:'');
  $('#mf').innerHTML=`<button onclick="openFollows('${S.user.id}','ers')"><b>${S.folrs.size}</b> ${S.folrs.size==1?'follower':'followers'}</button><button onclick="openFollows('${S.user.id}','ing')"><b>${S.fol.size}</b> following</button>`;
  $('#mb').textContent=pr.bio||'';$('#mb').hidden=!pr.bio;
  const li=mine.filter(n=>!isArt(n)),la=mine.filter(isArt);
  $('#shelf').innerHTML=(li.length?li.map(chip).join(''):'<span class="mute sm emp">No interests yet. Add some to shape your feed.</span>')+`<button class="chip addb" onclick="openPk()">＋ Add</button>`;
  $('#art').innerHTML=(la.length?la.map(chip).join(''):'<span class="mute sm emp">No artists yet. Add the ones you listen to.</span>')+`<button class="chip addb" onclick="openPk('art')">＋ Add</button>`;
  drawBadges();
  $('#mt').innerHTML=['My posts','Liked','Photos'].map((t,i)=>`<button class="${i==S.mt?'on':''}" onclick="setMt(${i})">${t}</button>`).join('');
  $('#mine').innerHTML=mineBody();
}
function mineBody(){
  if(S.mt==1){
    if(S.liked===null)return skPost().repeat(2);
    return S.liked.map(findPost).filter(p=>p&&!bl(p.author_id)).map(p=>post(p)).join('')||'<div class="empty">Nothing liked yet.<br>Tap Same on a post and it will show up here.</div>';
  }
  if(S.mt==2){
    const ph=S.myPosts.flatMap(p=>p.imgs||[]);
    return ph.length?'<div class="phgrid">'+ph.map(u=>`<img src="${esc(u)}" loading="lazy" alt="Photo" onclick="openLb(this.src)">`).join('')+'</div>':'<div class="empty">No photos yet.<br>Add photos to a post and they will collect here.</div>';
  }
  return S.skel&&!S.myPosts.length?skPost().repeat(2):S.myPosts.map(p=>post(p)).join('')||'<div class="empty">No posts yet.<br>Tap + on Home to write one.</div>';
}
function setMt(i){S.mt=i;if(i==1)loadLiked();meTab()}
// Posts you said Same to (newest posts first; we do not store when you liked them)
async function loadLiked(){
  const r=await sb.from('sames').select('post_id').eq('user_id',S.user.id).limit(100);
  if(r.error){if(S.liked===null)S.liked=[];toast('Could not load your liked posts');meTab();return}
  const ids=(r.data||[]).map(x=>x.post_id);
  if(!ids.length){S.liked=[];meTab();return}
  const pr=await sb.from('posts').select(COLS).in('id',ids).order('created_at',{ascending:false}).limit(50);
  if(pr.error){if(S.liked===null)S.liked=[];toast('Could not load your liked posts');meTab();return}
  await hydrate(pr.data);
  S.liked=pr.data.map(x=>x.id);
  meTab();
}
// Share one searchable picker for profile interests and artists.
function drawPk(){
  const art=S.pkm=='art',raw=$('#pks').value.trim().replace(/\s+/g,' '),q=raw.toLowerCase();
  $('#pkt').textContent=art?'Your artists':'Your interests';
  $('#pks').placeholder=art?'Search or add an artist':'Search or add an interest';
  let l=S.ints.filter(i=>art?i.kind=='artist':i.kind!='artist');
  l=l.filter(i=>i.name.toLowerCase().includes(q)).sort((a,b)=>(S.mine.has(b.id)-S.mine.has(a.id))||a.name.localeCompare(b.name)).slice(0,60);
  let h=l.map(i=>{const on=S.mine.has(i.id);return `<button class="fc ${on?'on':''}" style="--c:${col(i.id)}" onclick="ask(${i.id})">${em(i.id)} ${esc(i.name)}${on?' ✓':''}</button>`}).join('');
  if(raw.length>=2&&raw.length<=40&&!S.ints.some(i=>i.name.toLowerCase()==q))h+=isAdmin()?`<button class="fc addb" onclick="${art?'newArtist()':'newInterest()'}">＋ Add “${esc(raw)}”${art?' as an artist':' as an interest'}</button>`:`<div class="mute sm" style="margin:6px 4px">Not listed? Ask an admin to add “${esc(raw)}”.</div>`;
  if(!h)h=isAdmin()?`<div class="mute sm">Type a ${art?'artist':'interest'} name to add it.</div>`:`<div class="mute sm">Nothing listed yet.</div>`;
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
  if(!isAdmin()){toast('Only admins can add new artists');return}
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
  if(!isAdmin()){toast('Only admins can add new interests');return}
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
async function setAvatarBlob(blob){
  const url=await upload('avatars',blob),old=S.avs[S.user.id];
  const{error}=await sb.from('profiles').update({avatar_url:url}).eq('id',S.user.id);
  if(error){rmFiles('avatars',[url]);throw error}
  if(old)rmFiles('avatars',[old]);
  S.avs[S.user.id]=url;S.prof.avatar_url=url;
}
function pickAvatar(inp){
  const f=inp.files[0];inp.value='';if(!f)return;
  cropFile(f,'avatar',async blob=>{
    toast('Uploading photo...');
    try{await setAvatarBlob(blob);setMyAv($('#peav'));$('#perm').hidden=false;draw();toast('Photo updated');checkAch()}
    catch(e){toast(e.message||"Couldn't upload that photo")}
  });
}
// Banner: cropped to 3:1, stored in the avatars bucket (your folder), URL in profiles.banner_url
function setBanner(el,u){
  if(!el)return;
  el.style.backgroundImage=u?"url('"+u+"')":'';
  el.style.backgroundSize=u?'cover':'';el.style.backgroundPosition=u?'center':'';
}
function pickBanner(inp){
  const f=inp.files[0];inp.value='';if(!f)return;
  cropFile(f,'banner',async blob=>{
    toast('Uploading banner...');
    try{
      const url=await upload('avatars',blob),old=S.prof.banner_url;
      const{error}=await sb.from('profiles').update({banner_url:url}).eq('id',S.user.id);
      if(error){rmFiles('avatars',[url]);throw error}
      if(old)rmFiles('avatars',[old]);
      S.prof.banner_url=url;setBanner($('#pebn'),url);$('#pebrm').hidden=false;draw();toast('Banner updated');
    }catch(e){toast(e.message||"Couldn't upload that photo")}
  });
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

// ---------- Crop editor: move, zoom and see the circle before saving a photo or banner ----------
const CR={ptrs:new Map()};
function cropFile(file,kind,cb){
  const url=URL.createObjectURL(file),im=new Image();
  im.onload=()=>{
    Object.assign(CR,{k:kind,im,url,cb,z:1,d0:0});CR.ptrs.clear();
    $('#crt').textContent=kind=='avatar'?'Adjust your photo':'Adjust your banner';
    $('#crh').textContent=kind=='avatar'?'Drag to move. Pinch or use the slider to zoom. Only the circle will show on your profile.':'Drag to move. Pinch or use the slider to zoom. Your profile photo covers the bottom left corner.';
    $('#crst').className='crst '+kind;$('#cri').src=url;$('#crz').value=1;
    $('#cr').classList.add('on');
    requestAnimationFrame(()=>{
      const st=$('#crst');CR.sw=st.clientWidth;CR.sh=st.clientHeight;
      CR.min=Math.max(CR.sw/im.naturalWidth,CR.sh/im.naturalHeight);
      const sc=CR.min;CR.x=(CR.sw-im.naturalWidth*sc)/2;CR.y=(CR.sh-im.naturalHeight*sc)/2;
      crPaint();
    });
  };
  im.onerror=()=>{URL.revokeObjectURL(url);toast('Could not read that photo')};
  im.src=url;
}
function crPaint(){
  const im=CR.im;if(!im)return;
  const sc=CR.min*CR.z,w=im.naturalWidth*sc,h=im.naturalHeight*sc;
  CR.x=Math.min(0,Math.max(CR.sw-w,CR.x));CR.y=Math.min(0,Math.max(CR.sh-h,CR.y));
  const el=$('#cri');el.style.width=w+'px';el.style.height=h+'px';el.style.transform=`translate(${CR.x}px,${CR.y}px)`;
}
function crSetZ(z,fx,fy){
  if(!CR.im)return;
  z=Math.min(4,Math.max(1,z));
  const old=CR.min*CR.z,px=(fx-CR.x)/old,py=(fy-CR.y)/old,ns=CR.min*z;
  CR.z=z;CR.x=fx-px*ns;CR.y=fy-py*ns;
  $('#crz').value=z;crPaint();
}
function crClose(){$('#cr').classList.remove('on');if(CR.url)URL.revokeObjectURL(CR.url);CR.url=null;CR.im=null;CR.cb=null;CR.ptrs.clear()}
function crCancel(){crClose()}
function crSave(){
  const im=CR.im,k=CR.k,cb=CR.cb;if(!im)return;
  const sc=CR.min*CR.z,nw=im.naturalWidth,nh=im.naturalHeight;
  const w=Math.min(nw,CR.sw/sc),h=Math.min(nh,CR.sh/sc);
  const sx=Math.max(0,Math.min(nw-w,-CR.x/sc)),sy=Math.max(0,Math.min(nh-h,-CR.y/sc));
  const ow=Math.max(1,Math.round(Math.min(k=='avatar'?512:1400,w))),oh=k=='avatar'?ow:Math.max(1,Math.round(ow/3));
  const cv=document.createElement('canvas');cv.width=ow;cv.height=oh;
  cv.getContext('2d').drawImage(im,sx,sy,w,h,0,0,ow,oh);
  cv.toBlob(b=>{crClose();if(b&&cb)cb(b);else toast('Could not read that photo')},'image/jpeg',.85);
}
(()=>{
  const st=$('#crst');
  const rect=()=>st.getBoundingClientRect();
  st.addEventListener('pointerdown',e=>{st.setPointerCapture(e.pointerId);CR.ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});CR.d0=0});
  st.addEventListener('pointermove',e=>{
    const p=CR.ptrs.get(e.pointerId);if(!p||!CR.im)return;
    if(CR.ptrs.size==1){CR.x+=e.clientX-p.x;CR.y+=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;crPaint();return}
    p.x=e.clientX;p.y=e.clientY;
    const[a,b]=[...CR.ptrs.values()],d=Math.hypot(a.x-b.x,a.y-b.y),r=rect();
    if(CR.d0)crSetZ(CR.z*d/CR.d0,(a.x+b.x)/2-r.left,(a.y+b.y)/2-r.top);
    CR.d0=d;
  });
  const up=e=>{CR.ptrs.delete(e.pointerId);CR.d0=0};
  st.addEventListener('pointerup',up);st.addEventListener('pointercancel',up);
  st.addEventListener('wheel',e=>{e.preventDefault();const r=rect();crSetZ(CR.z*(e.deltaY<0?1.08:.93),e.clientX-r.left,e.clientY-r.top)},{passive:false});
})();

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
  paintCustomize();refreshInstall();paintRepBadge();if(isMod())loadRepCount();$('#set').classList.add('on');
}
async function changePw(){
  const v=$('#npw').value,e=$('#npe');e.textContent='';
  if(v.length<8){e.textContent='Use 8 or more characters.';return}
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
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&S.user&&S.loaded){loadMsgs();loadNotifs();checkAch();syncStatus()}});

// ---------- Messages (1-to-1) ----------
let conv=false,ctab=0;
async function loadMsgs(){
  const r=await sb.from('messages').select('*').order('created_at',{ascending:false}).limit(1000);
  if(r.error)return;
  S.msgs=r.data.reverse().filter(m=>!bl(m.sender_id==S.user.id?m.to_user:m.sender_id));updateBadges();
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
  drawStrip();syncSend();
}
function drawStrip(){
  const el=$('#cstrip');if(!el)return;
  const k=S.room;
  if(k==null){el.hidden=true;return}
  const n=S.cnt[k]||0,mem=S.mine.has(k);
  el.hidden=false;
  el.innerHTML=`<button class="cmem" onclick="openMembers()">👥 ${n} ${n==1?'member':'members'} ›</button>`+(mem?`<button class="btn off sbtn" style="margin:0" onclick="leaveCircle()">Leave</button>`:`<button class="btn sbtn" style="margin:0" onclick="joinRoom()">Join</button>`);
}
async function openMembers(){
  const k=S.room;if(k==null)return;
  const r=await sb.from('user_interests').select('user_id').eq('interest_id',k).limit(200);
  if(r.error){toast('Could not load members');return}
  const ids=r.data.map(x=>x.user_id).filter(id=>!bl(id));
  await getProfiles(ids);
  ids.sort((a,b)=>(a==S.user.id?-1:b==S.user.id?1:0)||nm(a).localeCompare(nm(b)));
  peopleSheet(iname(k)+' ('+ids.length+')',ids);
}
function leaveCircle(){
  const k=S.room;if(k==null)return;
  confirmBox('Leave '+iname(k)+'? This also removes it from your '+(isArt(k)?'artists.':'interests.'),'Leave',async()=>{
    await toggleInt(k);
    if(S.room===k){setBar();drawCircle()}
  });
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
    body=rows.map(o=>`<div class="card row" onclick="openDm('${o.p.id}')">${av(o.p.id)}<div class="grow"><b>${esc(o.p.name)}${rb(o.p.id)}</b>${o.last?`<div class="mute sm clip">${o.last.sender_id==me?'You: ':''}${esc(o.last.body)}</div>`:`<div class="mute sm">${S.fol.has(o.p.id)?'Following · ':''}Say hi 👋</div>`}</div>${o.un?`<span class="dot">${o.un}</span>`:''}</div>`).join('')
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
function msgMenu(k,id){
  mmSel={k,id};const m=getMsg(mmSel);
  $('#mmEdit').style.display=m&&m.sender_id==S.user.id?'':'none';  // mods can remove others' messages, not edit them
  $('#mm').classList.add('on');
}
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
    let q=sb.from(msgTable(sel.k)).delete().eq('id',m.id);
    if(sel.k=='dm'||m.sender_id==S.user.id)q=q.eq('sender_id',S.user.id);  // mods may only remove circle messages of others
    const{data,error}=await q.select();
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
  const rows=r.data.reverse().filter(m=>!bl(m.sender_id));
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
      :`<div class="crow"><span class="lk" onclick="openProfile('${m.sender_id}')">${av(m.sender_id)}</span><div class="b"><span class="cn" style="color:${ac(m.sender_id)}">${esc(nm(m.sender_id))}${rb(m.sender_id)}</span>${esc(m.body)}<small class="t f"><span>${tm(m.created_at)}${ed}</span><button class="mmore" onclick="event.stopPropagation();openAx('cm','${m.id}')" aria-label="Message options">⋯</button></small></div></div>`}).join('')
    :`<div class="empty" style="margin:auto"><div style="font-size:44px;margin-bottom:8px">${em(S.room)}</div><b>No messages yet</b><div class="sm" style="margin-top:6px">${S.mine.has(S.room)?'Start the conversation in '+esc(iname(S.room))+'.':'Join this circle to start the conversation.'}</div></div>`;
  const last=S.cm[S.cm.length-1];
  settle(el,near,snap,S.cm.length,!last||last.sender_id==me);
}
async function onCircleMsg(m){
  if(S.room!==m.interest_id||S.cm===null||S.cm.some(x=>x.id===m.id)||bl(m.sender_id))return;
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
  if(muted())return;
  if(S.edit)return saveMsgEdit(v);
  if(S.room!=null){
    const k=S.room;
    if(!S.mine.has(k)){toast('Join this circle to chat');return}
    $('#mi').value='';syncSend();
    const{data,error}=await sb.from('circle_messages').insert({interest_id:k,sender_id:S.user.id,body:v}).select().single();
    if(error){if(S.room===k){$('#mi').value=v;syncSend()}toast(errMsg(error));return}
    if(S.room===k&&S.cm&&!S.cm.some(x=>x.id===data.id)){S.cm.push(data);drawCircle(1)}
    checkAch();return;
  }
  if(!S.dm)return;
  $('#mi').value='';syncSend();
  const{data,error}=await sb.from('messages').insert({sender_id:S.user.id,to_user:S.dm,body:v}).select().single();
  if(error){$('#mi').value=v;syncSend();toast(errMsg(error));return}
  S.msgs.push(data);if(conv&&S.dm==data.to_user)drawDm(1);
  checkAch();
}
async function onMsg(m){
  if(S.msgs.some(x=>x.id===m.id)||bl(m.sender_id))return;
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
    sb.from('profiles').select('id,username,display_name,bio,city,avatar_url,banner_url,role').eq('id',id).maybeSingle(),
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
  if(p.data)S.roles[id]=p.data.role||'user';
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
  $('#pfb').innerHTML=`${p.banner_url?`<div class="pfbn" style="background-image:url('${esc(p.banner_url)}')"></div>`:''}<div class="pfh">${av(id,'big')}<h3 class="pfn">${esc(p.display_name)}${rb(id)}</h3>
<div class="mute sm">@${esc(p.username)}${p.city?' · '+esc(p.city):''}${S.folrs.has(id)?' · Follows you':''}</div>
${p.bio?`<p class="bio">${esc(p.bio)}</p>`:''}
<div class="cnts"><button onclick="openFollows('${id}','ers')"><b>${f.nf}</b> ${f.nf==1?'follower':'followers'}</button><button onclick="openFollows('${id}','ing')"><b>${f.ng}</b> following</button></div>
<div class="row pfa"><button class="btn ${fo?'off':''}" onclick="toggleFollow('${id}')">${fo?'Following ✓':'Follow'}</button><button class="btn off" onclick="sayHi('${id}')"><span class="wave-btn">👋</span> Say hi</button>${id!=S.user.id?`<button class="btn off" onclick="openAx('user','${id}')" aria-label="More">⋯</button>`:''}</div></div>
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
    ?`<div class="mute sm cnt-line">${S.achMine.size} of ${c.length} earned${S.achMine.size?'':' · post, follow and say Same to unlock them'}</div>`+c.map(a=>{
        const d=S.achMine.get(a.code);
        return `<button class="chip tg ${d?'':'lock'}" style="--c:#64748B" onclick="showAch('${a.code}','${d||''}')">${d?esc(a.emoji):'🔒'} ${esc(a.title)}</button>`}).join('')
    :'<span class="mute sm emp">Badges unlock as you post, follow people and join in. They will show up here.</span>';
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
  if(muted())return;
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

// ================= Batch 3: reporting, blocking, moderation, admin lists =================
const bl=id=>S.blocked.has(id);
const errMsg=e=>(e&&(e.code=='42501'||/row-level security/i.test(e.message||'')))?"You can't do that right now. You may be muted.":(e&&e.message)||'Something went wrong';
const mutedNow=u=>!!(u&&u.muted_until&&new Date(u.muted_until)>new Date());
function muted(){
  if(mutedNow(S.prof)){toast('You are muted until '+tm(S.prof.muted_until));return true}
  return false;
}
// Hide everything from people I blocked
function applyBlocks(){
  if(!S.user)return;
  S.posts=S.posts.filter(p=>!bl(p.author_id));
  S.people=S.people.filter(p=>!bl(p.id));
  if(S.reps)S.reps=S.reps.filter(r=>!bl(r.author_id));
  if(S.cm)S.cm=S.cm.filter(m=>!bl(m.sender_id));
  S.msgs=S.msgs.filter(m=>!bl(m.sender_id==S.user.id?m.to_user:m.sender_id));
  updateBadges();
  if($('#ov').classList.contains('on')){
    if(conv&&S.dm&&bl(S.dm))openChats();
    else if(conv&&S.room!=null)drawCircle();
    else if(!conv)openChats();
  }
}
// Pick up role / mute / ban changes made while the app was open
async function syncStatus(){
  if(!S.user||!S.loaded)return;
  const r=await sb.from('profiles').select('role,muted_until,banned').eq('id',S.user.id).single();
  if(r.error||!r.data)return;
  if(r.data.banned){S.err='This account has been suspended.';S.good=false;await sb.auth.signOut();return}
  Object.assign(S.prof,r.data);S.role=r.data.role||'user';S.roles[S.user.id]=S.role;
  if(isMod())loadRepCount();else{S.nrep=0;paintRepBadge()}
}

// ---------- Blocking ----------
function blockUser(id){
  id=String(id);
  confirmBox('Block '+nm(id)+'?','Block',async()=>{
    const{error}=await sb.rpc('block_user',{target:id});
    if(error){toast(errMsg(error));return}
    S.blocked.add(id);S.fol.delete(id);S.folrs.delete(id);
    ['#pv','#pf','#sl'].forEach(x=>$(x).classList.remove('on'));S.pf=null;
    applyBlocks();draw();if(S.th)renderThread();
    toast('Blocked '+nm(id));
  });
}
async function openBlocked(){
  $('#set').classList.remove('on');
  const ids=[...S.blocked];await getProfiles(ids);
  $('#slt').textContent='Blocked people';
  $('#sll').innerHTML=ids.map(u=>`<div class="prow">${av(u)}<b class="grow">${esc(nm(u))}</b><button class="btn off sbtn" style="margin:0" onclick="unblock('${u}')">Unblock</button></div>`).join('')||'<div class="empty">You have not blocked anyone.</div>';
  $('#sl').classList.add('on');
}
async function unblock(id){
  const{error}=await sb.from('blocks').delete().match({blocker_id:S.user.id,blocked_id:id});
  if(error){toast("Couldn't unblock");return}
  S.blocked.delete(id);
  await Promise.all([loadPosts(),loadPeople(),loadMsgs()]);
  draw();openBlocked();toast('Unblocked');
}

// ---------- ⋯ menu on other people's content ----------
const axLabel={post:'post',reply:'reply',cm:'message',user:'user'};
function axGet(t,id){
  if(t=='user')return{};
  if(t=='post')return findPost(id);
  const l=t=='reply'?S.reps:S.cm;
  return(l||[]).find(x=>String(x.id)===String(id));
}
function openAx(t,id){
  const m=axGet(t,id);if(!m)return;
  const uid=t=='user'?String(id):(t=='cm'?m.sender_id:m.author_id);
  S.ax={t,id:String(id),uid};
  let h=`<b style="font-size:18px">${esc(nm(uid))}${rb(uid)}</b>`;
  h+=`<button class="btn off wide" onclick="axReport()">🚩 Report ${axLabel[t]}</button>`;
  h+=bl(uid)?`<button class="btn off wide" onclick="closeAx();unblock('${uid}')">Unblock</button>`:`<button class="btn off wide" onclick="axBlock()">🚫 Block ${esc(nm(uid))}</button>`;
  if(isMod()){
    if(t!='user')h+=`<button class="btn off wide danger" onclick="axDelete()">Delete ${axLabel[t]}</button>`;
    h+=`<button class="btn off wide" onclick="axModerate()">🛡 Moderate user</button>`;
  }
  h+='<button class="btn off wide" onclick="closeAx()">Cancel</button>';
  $('#axb').innerHTML=h;$('#ax').classList.add('on');
}
function closeAx(){$('#ax').classList.remove('on')}
function axBlock(){const a=S.ax;closeAx();if(a)blockUser(a.uid)}
function axModerate(){const a=S.ax;closeAx();if(a)openUa(a.uid)}
function axDelete(){
  const a=S.ax;closeAx();if(!a)return;
  if(a.t=='post')return delPost(a.id);
  if(a.t=='reply')return delReply(a.id);
  confirmBox('Delete this message?','Delete',async()=>{
    const{data,error}=await sb.from('circle_messages').delete().eq('id',a.id).select('id');
    if(error||!data||!data.length){toast(error?error.message:"Couldn't delete the message");return}
    S.cm=(S.cm||[]).filter(x=>String(x.id)!==a.id);if(S.room!=null)drawCircle();
  });
}

// ---------- Reporting ----------
const REASONS=['Spam','Harassment','Hate or unsafe','Inappropriate','Other'];
function axReport(){
  const a=S.ax;closeAx();if(!a)return;
  S.rp={type:a.t=='cm'?'circle_message':a.t,id:a.id,uid:a.uid,reason:''};
  $('#rpd').value='';drawRp();$('#rp').classList.add('on');
}
function drawRp(){
  if(!S.rp)return;
  $('#rpr').innerHTML=REASONS.map(r=>`<button class="fc ${S.rp.reason==r?'on':''}" onclick="S.rp.reason='${r}';drawRp()">${r}</button>`).join('');
  $('#rps').disabled=!S.rp.reason;
}
function closeRp(){$('#rp').classList.remove('on');S.rp=null}
async function sendReport(){
  const r=S.rp;if(!r||!r.reason)return;
  $('#rps').disabled=true;
  const{error}=await sb.from('reports').insert({target_type:r.type,target_id:r.id,target_user:r.uid||null,reason:r.reason,details:$('#rpd').value.trim()||null});
  $('#rps').disabled=false;
  if(error){
    if(error.code=='23505'){closeRp();toast('You already reported this');return}
    toast(errMsg(error));return;
  }
  closeRp();toast('Report sent. Thank you.');
}

// ---------- Moderation screen (mods and admins) ----------
let mtab=0,musrT;
async function loadRepCount(){
  const r=await sb.from('reports').select('id',{count:'exact',head:true}).eq('status','open');
  if(r.error)return;
  S.nrep=r.count||0;paintRepBadge();
}
function paintRepBadge(){
  const b=$('#rpb');b.hidden=!(isMod()&&S.nrep);b.textContent=S.nrep>9?'9+':S.nrep;
  $('#modlab').hidden=!isMod();
  const m=$('#modb');m.hidden=!isMod();m.textContent='🛡 Moderation tools'+(S.nrep?' ('+S.nrep+')':'');
}
function openMod(){$('#set').classList.remove('on');mtab=0;$('#mo').classList.add('on');drawMod()}
function drawMod(){
  const tabs=['Reports','Users'].concat(isAdmin()?['Lists','Invites']:[]);
  $('#mot').innerHTML=`<div class="tabs">${tabs.map((t,i)=>`<button class="${i==mtab?'on':''}" onclick="mtab=${i};drawMod()">${t}${i==0&&S.nrep?' ('+S.nrep+')':''}</button>`).join('')}</div>`;
  if(mtab==0)drawReports();else if(mtab==1)drawUsers();else if(mtab==2)drawLists();else drawInvites();
}
async function drawReports(){
  $('#mob').innerHTML='<div class="empty">Loading...</div>';
  const r=await sb.from('reports').select('*').eq('status','open').order('created_at',{ascending:false}).limit(50);
  if(mtab!=0)return;
  if(r.error){$('#mob').innerHTML=`<div class="empty">${esc(r.error.message)}</div>`;return}
  const rows=r.data,by=t=>rows.filter(x=>x.target_type==t).map(x=>x.target_id);
  const[po,re,cm]=await Promise.all([
    by('post').length?sb.from('posts').select('id,body,author_id').in('id',by('post')):{data:[]},
    by('reply').length?sb.from('replies').select('id,body,author_id').in('id',by('reply')):{data:[]},
    by('circle_message').length?sb.from('circle_messages').select('id,body,sender_id').in('id',by('circle_message')):{data:[]}]);
  const tgt=new Map();
  (po.data||[]).forEach(x=>tgt.set('post:'+x.id,{body:x.body,uid:x.author_id}));
  (re.data||[]).forEach(x=>tgt.set('reply:'+x.id,{body:x.body,uid:x.author_id}));
  (cm.data||[]).forEach(x=>tgt.set('circle_message:'+x.id,{body:x.body,uid:x.sender_id}));
  await getProfiles([...rows.map(x=>x.reporter_id),...rows.map(x=>x.target_user).filter(Boolean)]);
  S.reports=rows.map(x=>({...x,t:tgt.get(x.target_type+':'+x.target_id)}));
  S.nrep=rows.length;paintRepBadge();
  if(mtab!=0)return;
  $('#mob').innerHTML=S.reports.map(x=>{
    const uid=x.target_user,isUser=x.target_type=='user';
    return `<div class="card rpc"><div class="mute sm">${esc(nm(x.reporter_id))} reported ${isUser?'a user':'a '+esc(x.target_type.replace('_',' '))} · ${ago(x.created_at)}</div><div style="margin-top:4px"><b>${esc(x.reason)}</b>${x.details?' · '+esc(x.details):''}</div>${isUser?'':`<div class="rquote">${x.t?esc(x.t.body):'<i>Already removed</i>'}</div>`}<div class="mute sm">${uid?'By '+esc(nm(uid))+rb(uid):'Unknown author'}</div><div class="row rpa">${!isUser&&x.t?`<button class="btn off sbtn danger" onclick="repDelete('${x.id}')">Delete</button>`:''}${uid?`<button class="btn off sbtn" onclick="openUa('${uid}')">Moderate user</button>`:''}<button class="btn off sbtn" onclick="repClose('${x.id}','dismissed')">Dismiss</button><button class="btn sbtn" onclick="repClose('${x.id}','resolved')">Resolved</button></div></div>`;
  }).join('')||'<div class="empty">No open reports 🎉</div>';
}
async function repClose(rid,status){
  const{data,error}=await sb.from('reports').update({status,handled_by:S.user.id,handled_at:new Date().toISOString()}).eq('id',rid).select('id');
  if(error||!data||!data.length){toast(error?error.message:"Couldn't update the report");return false}
  S.reports=(S.reports||[]).filter(x=>x.id!==rid);S.nrep=Math.max(0,S.nrep-1);paintRepBadge();
  if($('#mo').classList.contains('on')&&mtab==0)drawMod();
  return true;
}
function repDelete(rid){
  const x=(S.reports||[]).find(q=>q.id===rid);if(!x)return;
  const tbl={post:'posts',reply:'replies',circle_message:'circle_messages'}[x.target_type];
  confirmBox('Delete this '+x.target_type.replace('_',' ')+'?','Delete',async()=>{
    const{data,error}=await sb.from(tbl).delete().eq('id',x.target_id).select('id');
    if(error||!data||!data.length){toast(error?error.message:"Couldn't delete it");return}
    if(x.target_type=='post'){S.pm.delete(String(x.target_id));S.posts=S.posts.filter(p=>String(p.id)!==String(x.target_id));S.myPosts=S.myPosts.filter(p=>String(p.id)!==String(x.target_id));draw()}
    await repClose(rid,'resolved');toast('Deleted and resolved');
  });
}
// People search
function drawUsers(){
  $('#mob').innerHTML='<input class="fi" id="musr" placeholder="Search people by name or @username" maxlength="40" autocomplete="off" oninput="clearTimeout(musrT);musrT=setTimeout(searchUsers,250)" style="margin:6px 16px;width:calc(100% - 32px)"><div id="musl"></div>';
  searchUsers();
}
async function searchUsers(){
  const el=$('#musr');if(!el)return;
  const q=el.value.trim().replace(/[%,()*\\]/g,'');
  let qb=sb.from('profiles').select('id,display_name,username,role,muted_until,banned,avatar_url').order('display_name').limit(30);
  if(q)qb=qb.or(`display_name.ilike.%${q}%,username.ilike.%${q}%`);
  const r=await qb;
  if(!$('#musl')||mtab!=1)return;
  if(r.error){$('#musl').innerHTML=`<div class="empty">${esc(r.error.message)}</div>`;return}
  r.data.forEach(u=>{S.names[u.id]=u.display_name;S.roles[u.id]=u.role||'user';if(u.avatar_url)S.avs[u.id]=u.avatar_url});
  $('#musl').innerHTML=r.data.map(u=>`<div class="card row" onclick="openUa('${u.id}')">${av(u.id)}<div class="grow"><b>${esc(u.display_name)}${rb(u.id)}</b><div class="mute sm">@${esc(u.username||'')}${u.banned?' · Banned':''}${mutedNow(u)?' · Muted':''}</div></div></div>`).join('')||'<div class="empty">No one found</div>';
}
// One person: mute (mods), role and ban (admins)
async function openUa(id){
  id=String(id);S.ua=id;
  $('#uab').innerHTML='<div class="empty">Loading...</div>';$('#ua').classList.add('on');
  const r=await sb.from('profiles').select('id,display_name,username,role,muted_until,banned,avatar_url').eq('id',id).maybeSingle();
  if(S.ua!==id)return;
  if(!r.data){$('#uab').innerHTML='<div class="empty">User not found</div>';return}
  const u=r.data;S.names[id]=u.display_name;S.roles[id]=u.role||'user';if(u.avatar_url)S.avs[id]=u.avatar_url;
  drawUa(u);
}
function drawUa(u){
  const me=u.id==S.user.id,m=mutedNow(u);
  let h=`<div class="row" style="margin:6px 0 4px">${av(u.id,'big')}<div><b style="font-size:18px">${esc(u.display_name)}${rb(u.id)}</b><div class="mute sm">@${esc(u.username||'')}</div><div class="sm">${u.banned?'🚫 Banned':m?'🔇 Muted until '+esc(tm(u.muted_until)):'Active'}</div></div></div>`;
  if(me)h+='<div class="mute sm" style="margin:10px 4px">This is you.</div>';
  else{
    const canMute=u.role=='user'||(isAdmin()&&u.role=='mod');
    if(canMute)h+='<p class="lab">Mute</p><div class="row" style="flex-wrap:wrap">'+[['1 hour',60],['1 day',1440],['7 days',10080]].map(([l,n])=>`<button class="btn off sbtn" onclick="uaMute('${u.id}',${n})">${l}</button>`).join('')+(m?`<button class="btn sbtn" onclick="uaMute('${u.id}',0)">Unmute</button>`:'')+'</div>';
    if(isAdmin()&&u.role!='admin'){
      h+='<p class="lab">Admin</p>';
      h+=u.role=='mod'?`<button class="btn off wide" onclick="uaRole('${u.id}','user')">Remove moderator</button>`:`<button class="btn off wide" onclick="uaRole('${u.id}','mod')">Make moderator</button>`;
      h+=u.banned?`<button class="btn off wide" onclick="uaBan('${u.id}',false)">Unban</button>`:`<button class="btn off wide danger" onclick="uaBan('${u.id}',true)">Ban from iLike</button>`;
    }
    h+=`<button class="btn off wide" onclick="closeUa();openProfile('${u.id}')">View profile</button>`;
  }
  h+='<button class="btn off wide" onclick="closeUa()">Close</button>';
  $('#uab').innerHTML=h;
}
function closeUa(){S.ua=null;$('#ua').classList.remove('on')}
async function uaDone(id,msg){toast(msg);await openUa(id);if($('#mo').classList.contains('on')&&mtab==1)searchUsers();draw()}
async function uaMute(id,min){
  const{error}=await sb.rpc('mute_user',{target:id,minutes:min});
  if(error){toast(error.message);return}
  uaDone(id,min?'Muted':'Unmuted');
}
function uaRole(id,role){
  confirmBox(role=='mod'?'Make '+nm(id)+' a moderator?':'Remove '+nm(id)+' as moderator?',role=='mod'?'Promote':'Remove',async()=>{
    const{error}=await sb.rpc('set_role',{target:id,new_role:role});
    if(error){toast(error.message);return}
    uaDone(id,role=='mod'?'Now a moderator':'No longer a moderator');
  });
}
function uaBan(id,flag){
  confirmBox(flag?'Ban '+nm(id)+'? They will be signed out and cannot post.':'Unban '+nm(id)+'?',flag?'Ban':'Unban',async()=>{
    const{error}=await sb.rpc('set_ban',{target:id,flag});
    if(error){toast(error.message);return}
    uaDone(id,flag?'Banned':'Unbanned');
  });
}

// ---------- Admin: artists list ----------
const nameKey=s=>String(s).toLowerCase().replace(/[^a-z0-9]/g,'');
async function drawLists(){
  $('#mob').innerHTML='<div class="empty">Loading...</div>';
  await Promise.all([loadInts(),loadPeople()]);
  if(mtab!=2)return;
  const arts=S.ints.filter(i=>i.kind=='artist').sort((a,b)=>a.name.localeCompare(b.name));
  const n=S.ints.filter(i=>i.kind!='artist').length;
  $('#mob').innerHTML=`<div class="card"><b>Artists</b> <span class="mute sm">(${arts.length})</span><div class="row" style="margin-top:10px"><input class="fi grow" id="mla" maxlength="40" placeholder="Add an artist" onkeydown="if(event.key==='Enter')admAddArtist()"><button class="btn" onclick="admAddArtist()">Add</button></div></div>`
    +arts.map(a=>`<div class="card row"><div class="tile">${esc(a.emoji||'🎤')}</div><div class="grow"><b>${esc(a.name)}</b><div class="mute sm">${S.cnt[a.id]||0} ${S.cnt[a.id]==1?'member':'members'}</div></div><button class="btn off sbtn" style="margin:0" onclick="admArt(${a.id})">Manage</button></div>`).join('')
    +`<div class="card"><b>Interests</b><div class="mute sm" style="margin-top:6px">${n} interests are managed in the app code (INTEREST_CATALOG in app.js). They sync to the database whenever an admin opens the app.</div></div>`;
}
// ---------- Admin: invite codes ----------
async function drawInvites(){
  $('#mob').innerHTML='<div class="empty">Loading...</div>';
  const r=await sb.from('invite_codes').select('*').order('created_at',{ascending:false});
  if(mtab!=3)return;
  if(r.error){$('#mob').innerHTML=`<div class="empty">${esc(r.error.message)}</div>`;return}
  $('#mob').innerHTML=`<div class="card"><b>New invite code</b><div class="mute sm" style="margin:4px 0 10px">Share the link or the code. Each signup uses one spot.</div><div class="row"><input class="fi grow" id="ivn" maxlength="40" placeholder="Note (e.g. cricket group)"><input class="fi" id="ivm" type="number" min="1" max="500" value="20" style="width:84px" aria-label="Max uses"></div><button class="btn wide" style="margin-top:10px" onclick="admNewInvite()">Create code</button></div>`
    +(r.data.map(c=>`<div class="card row"><div class="grow"><b>${esc(c.code)}</b>${c.active?'':' <span class="mute sm">· Off</span>'}${c.uses>=c.max_uses?' <span class="mute sm">· Full</span>':''}<div class="mute sm">${c.uses} of ${c.max_uses} used${c.note?' · '+esc(c.note):''}</div></div><button class="btn off sbtn" style="margin:0" onclick="copyInvite('${esc(c.code)}')">Copy link</button><button class="btn off sbtn" style="margin:0" onclick="toggleInvite('${esc(c.code)}',${!c.active})">${c.active?'Turn off':'Turn on'}</button></div>`).join('')||'<div class="empty">No codes yet</div>');
}
async function admNewInvite(){
  const note=$('#ivn').value.trim().slice(0,40),max=Math.max(1,Math.min(500,parseInt($('#ivm').value)||20));
  const al='ABCDEFGHJKMNPQRSTUVWXYZ23456789',b=crypto.getRandomValues(new Uint8Array(8));
  const code='ILIKE-'+[...b].map(x=>al[x%al.length]).join('');
  const r=await sb.from('invite_codes').insert({code,max_uses:max,note:note||null});
  if(r.error){toast(r.error.message);return}
  toast('Code created');drawInvites();
}
async function toggleInvite(code,on){
  const r=await sb.from('invite_codes').update({active:on}).eq('code',code);
  if(r.error){toast(r.error.message);return}
  drawInvites();
}
async function copyInvite(code){
  const msg='Join me on iLike: '+APP_URL()+'#invite='+code+'\n(Invite code: '+code+')';
  try{await navigator.clipboard.writeText(msg);toast('Invite link copied')}
  catch(e){toast('Code: '+code)}
}

// ---------- Terms, privacy, contact ----------
const LEGAL={
  terms:['Terms',[
    ['What iLike is','iLike is a small community app for finding people who share your interests. It is in early testing, so things may change, break, or be reset.'],
    ['Your account','Use your real details, keep one account, and keep your password private. You must be at least 13 years old. You are responsible for what you post and send.'],
    ['Be kind','No harassment, hate, threats, spam, or pretending to be someone else. No sexual or violent content, nothing illegal, and no sharing other people\'s private information.'],
    ['Moderation','Moderators and admins can remove content and mute or ban accounts that break these rules. You can report posts, replies, messages and people, and you can block anyone.'],
    ['Your content','You keep ownership of what you post. By posting, you allow iLike to show it to other members inside the app.'],
    ['Meeting people','Events are organised by members. iLike does not check anyone\'s identity. Meet in public places and tell someone where you are going.'],
    ['No guarantees','iLike is provided as is during testing. Data may be lost, and we may change or end the service.'],
    ['Leaving','You can stop using iLike at any time. To have your account deleted, email us.'],
    ['Changes','We may update these terms. If you keep using iLike after a change, you accept it.']]],
  privacy:['Privacy',[
    ['What we collect','Your email, your password (stored scrambled by our login provider, so we cannot read it), and what you add: name, username, bio, city, photos, interests, artists, posts, replies, reactions, follows, messages, events, and the reports and blocks you make.'],
    ['Who can see it','Signed-in members can see your profile, posts, interests and follows. Direct messages are visible to the people in that chat. Reports are seen by moderators.'],
    ['Where it is stored','Your data is stored with Supabase, which provides our database, login and file storage. Fonts load from Google Fonts. We do not show ads, sell your data, or run analytics in this version.'],
    ['On your device','The app keeps your look settings and unsent drafts in your browser, and saves app files so it opens faster and works offline.'],
    ['Our access','The people who run iLike can technically access stored data in order to run and protect the service. We only look at private messages when needed to handle a report or a safety or legal issue.'],
    ['Deleting your data','Email us and we will delete your account and what you posted within 30 days.']]],
  contact:['Contact',[
    ['Get in touch','Email '+CONTACT_EMAIL+' if you are locked out, found a problem, have a question, or want your account deleted.'],
    ['Problems with a person','Use Report or Block in the app (the ⋯ button on posts, messages and profiles). Moderators will look at it.'],
    ['Emergencies','If someone is in danger, contact your local emergency services first.']]]
};
function openLegal(k){S.lg=LEGAL[k]?k:'terms';drawLegal();$('#lg').classList.add('on')}
function drawLegal(){
  $('#lgt').innerHTML=Object.keys(LEGAL).map(k=>`<button class="${k==S.lg?'on':''}" onclick="S.lg='${k}';drawLegal()">${LEGAL[k][0]}</button>`).join('');
  $('#lgb').innerHTML=LEGAL[S.lg][1].map(([h,t])=>`<h4>${esc(h)}</h4><p>${esc(t).replace(esc(CONTACT_EMAIL),`<a href="mailto:${esc(CONTACT_EMAIL)}">${esc(CONTACT_EMAIL)}</a>`)}</p>`).join('')+`<p class="mute sm" style="margin-top:12px">Last updated October 2026</p>`;
  $('#lgb').scrollTop=0;
}

async function admAddArtist(){
  const name=$('#mla').value.trim().replace(/\s+/g,' ');
  if(name.length<2||name.length>40){toast('Artist names are 2 to 40 characters');return}
  const k=nameKey(name),dup=S.ints.find(i=>k?nameKey(i.name)==k:i.name.toLowerCase()==name.toLowerCase());
  if(dup){toast('Already listed as "'+dup.name+'"');return}
  const color=PAL[[...name].reduce((a,c)=>a+c.charCodeAt(0),0)%PAL.length];
  const r=await sb.from('interests').insert({name,emoji:'🎤',color,category:'Artists',kind:'artist'}).select().single();
  if(r.error){toast(r.error.message);return}
  await loadInts();drawLists();toast('Added '+name);
}
function admArt(id){S.am=id;$('#amt').textContent=iname(id);$('#am').classList.add('on')}
function admRename(){
  $('#am').classList.remove('on');$('#rni').value=iname(S.am);$('#rne').textContent='';$('#rn').classList.add('on');
}
async function admSaveRename(){
  const name=$('#rni').value.trim().replace(/\s+/g,' '),id=S.am;
  if(name.length<2||name.length>40){$('#rne').textContent='Artist names are 2 to 40 characters';return}
  const k=nameKey(name),dup=S.ints.find(i=>i.id!=id&&(k?nameKey(i.name)==k:i.name.toLowerCase()==name.toLowerCase()));
  if(dup){$('#rne').textContent='"'+dup.name+'" already exists. Use Merge instead.';return}
  const r=await sb.from('interests').update({name}).eq('id',id).select('id');
  if(r.error||!r.data||!r.data.length){$('#rne').textContent=r.error?r.error.message:"Couldn't rename it";return}
  $('#rn').classList.remove('on');await loadInts();draw();drawLists();toast('Renamed');
}
function admMerge(){
  $('#am').classList.remove('on');S.mg=S.am;$('#mgs').value='';$('#mgt').textContent='Merge "'+iname(S.mg)+'" into...';drawMg();$('#mg').classList.add('on');
}
function drawMg(){
  const q=$('#mgs').value.toLowerCase();
  $('#mgl').innerHTML=S.ints.filter(i=>i.kind=='artist'&&i.id!=S.mg&&i.name.toLowerCase().includes(q)).sort((a,b)=>a.name.localeCompare(b.name)).slice(0,40).map(i=>`<div class="prow lk" onclick="admDoMerge(${i.id})"><b class="grow">${em(i.id)} ${esc(i.name)}</b></div>`).join('')||'<div class="empty">No other artists</div>';
}
function admDoMerge(t){
  const s=S.mg;
  confirmBox('Merge "'+iname(s)+'" into "'+iname(t)+'"? Members and posts move over.','Merge',async()=>{
    const{error}=await sb.rpc('merge_interests',{source:s,target:t});
    if(error){toast(error.message);return}
    $('#mg').classList.remove('on');await refreshInterests();drawLists();toast('Merged');
  });
}
function admDelete(){
  const id=S.am;$('#am').classList.remove('on');
  confirmBox('Delete "'+iname(id)+'"? It is removed from everyone\'s profile.','Delete',async()=>{
    const{error}=await sb.rpc('remove_interest',{target:id});
    if(error){toast(error.message);return}
    await refreshInterests();drawLists();toast('Deleted');
  });
}
async function refreshInterests(){
  await loadInts();
  const u=await sb.from('user_interests').select('interest_id').eq('user_id',S.user.id);
  if(u.data)S.mine=new Set(u.data.map(r=>r.interest_id));
  draw();
}

// Apply saved look on this device before login, then boot
try{applyPrefs(JSON.parse(localStorage.getItem('il-prefs')||'null'))}catch(e){}
updateThemeIcon();paintCustomize();
boot();
