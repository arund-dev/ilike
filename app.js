// ---- Supabase connection (both values are safe to be public) ----
const SUPABASE_URL="https://rgrtwewhiylwkxgbcgyx.supabase.co";
const SUPABASE_KEY="sb_publishable_frBJksxES3J_AZICQ619fw_6e7hP59z";
const sb=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

const $=s=>document.querySelector(s);
const S={user:null,name:'',ints:[],im:new Map(),mine:new Set(),snap:new Set(),posts:[],people:[],cnt:{},names:{},F:'All',tab:'home',mode:'login',err:'',pick:new Set(),pend:null};
const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ago=d=>{const m=Math.floor((Date.now()-new Date(d))/60000);return m<1?'just now':m<60?m+'m ago':m<1440?Math.floor(m/60)+'h ago':Math.floor(m/1440)+'d ago'};
const iname=n=>S.im.get(n)?.name||'';
const col=n=>esc(S.im.get(n)?.color||'var(--brand)');
const em=n=>esc(S.im.get(n)?.emoji||'✦');
const cat=n=>S.im.get(n)?.category;
const nm=id=>S.names[id]||(id==S.user?.id?S.name:'Member');
const PAL=['#8B5CF6','#EC4899','#22C55E','#F59E0B','#14B8A6','#3B82F6','#EF4444'];
const ac=id=>id==S.user?.id?'var(--brand)':PAL[[...String(id)].reduce((a,c)=>a+c.charCodeAt(0),0)%PAL.length];
const av=(id,z='')=>`<span class="av ${z}" style="--c:${ac(id)}">${esc((nm(id)||'?')[0].toUpperCase())}</span>`;
const chip=n=>`<span class="chip" style="--c:${col(n)}">${em(n)} ${esc(iname(n))}</span>`;
const tgb=n=>S.mine.has(n)?chip(n):`<button class="chip tg" style="--c:${col(n)}" onclick="ask(${n})">${em(n)} ${esc(iname(n))}</button>`;
const say=l=>!l.length?'':l.length==1?l[0]+' said Same':l.length==2?l.join(' & ')+' said Same':l[0]+', '+l[1]+' & others said Same';
const so=p=>{const a=p.sames.filter(x=>x!=S.user.id);return p.sames.includes(S.user.id)?[S.user.id,...a]:a};
const sm=p=>{const o=so(p);return (o.length?`<span class="stk">${o.slice(0,3).map(x=>av(x,'sm')).join('')}</span>`:'')+esc(say(o.map(x=>x==S.user.id?'You':nm(x))))};
let toastT;
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),1600)}
function share(){
  if(navigator.share){navigator.share({title:'iLike',url:location.href}).catch(()=>{});return}
  if(navigator.clipboard)navigator.clipboard.writeText(location.href).then(()=>toast('Link copied'),()=>toast("Couldn't copy link"));
  else toast("Couldn't copy link")
}

function show(id){
  if(id!='auth'&&id!='onb')S.tab=id;
  document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('on',s.id=='s-'+id));
  document.body.classList.toggle('noapp',id=='auth'||id=='onb');
  document.querySelectorAll('#nav button').forEach(x=>x.classList.toggle('on',x.dataset.s==id));
}

// ---------- Auth ----------
function renderAuth(){
  const su=S.mode=='signup';
  $('#af').innerHTML=`${su?'<input class="fi" id="an" placeholder="Your name" autocomplete="name">':''}<input class="fi" id="ae" type="email" placeholder="Email" autocomplete="email"><input class="fi" id="ap" type="password" placeholder="Password (6+ characters)" autocomplete="${su?'new':'current'}-password" onkeydown="if(event.key==='Enter')go()"><div class="err">${esc(S.err)}</div><button class="btn" style="width:100%" id="ago" onclick="go()">${su?'Create account':'Log in'}</button><button class="link" onclick="swap()">${su?'Have an account? Log in':'New here? Create an account'}</button>`;
}
function swap(){S.mode=S.mode=='login'?'signup':'login';S.err='';renderAuth()}
async function go(){
  const email=$('#ae').value.trim(),password=$('#ap').value,name=$('#an')?.value.trim();
  $('#ago').disabled=true;S.err='';
  const r=S.mode=='signup'
    ?await sb.auth.signUp({email,password,options:{data:{display_name:name||email.split('@')[0]}}})
    :await sb.auth.signInWithPassword({email,password});
  if(r.error)S.err=r.error.message;
  else if(S.mode=='signup'&&!r.data.session){S.mode='login';S.err='Check your email to confirm your account, then log in.'}
  else return;
  renderAuth();$('#ae').value=email;
}
async function logout(){await sb.auth.signOut();S.tab='home';S.F='All'}

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
  const{data:{session}}=await sb.auth.getSession();
  S.user=session?.user||null;
  sb.auth.onAuthStateChange((_e,s)=>{const was=S.user?.id;S.user=s?.user||null;if(S.user?.id!==was)setTimeout(load,0)});
  load();
}
async function load(){
  if(!S.user){S.posts=[];S.mine=new Set();S.names={};renderAuth();show('auth');return}
  S.name=S.user.user_metadata?.display_name||(S.user.email||'Me').split('@')[0];
  await sb.from('profiles').upsert({id:S.user.id,username:'user_'+S.user.id.replace(/-/g,'').slice(0,8),display_name:S.name},{onConflict:'id',ignoreDuplicates:true});
  const[i,u]=await Promise.all([
    sb.from('interests').select('*').order('category').order('name'),
    sb.from('user_interests').select('interest_id').eq('user_id',S.user.id)]);
  if(i.error)toast('Could not load interests');
  S.ints=i.data||[];S.im=new Map(S.ints.map(x=>[x.id,x]));
  S.mine=new Set((u.data||[]).map(r=>r.interest_id));S.snap=new Set(S.mine);
  S.names[S.user.id]=S.name;
  if(!S.mine.size){S.pick=new Set();renderOb();show('onb');return}
  await Promise.all([loadPosts(),loadPeople()]);
  draw();show(S.tab);
}
async function loadPosts(){
  const p=await sb.from('posts').select('id,body,created_at,author_id').order('created_at',{ascending:false}).limit(50);
  if(p.error){toast('Could not load posts');S.posts=[];return}
  if(!p.data.length){S.posts=[];return}
  const ids=p.data.map(x=>x.id);
  const[t,s]=await Promise.all([sb.from('post_interests').select('post_id,interest_id').in('post_id',ids),sb.from('sames').select('post_id,user_id').in('post_id',ids)]);
  const au=[...new Set([...p.data.map(x=>x.author_id),...(s.data||[]).map(x=>x.user_id)])];
  const a=await sb.from('profiles').select('id,display_name').in('id',au);
  (a.data||[]).forEach(x=>S.names[x.id]=x.display_name);
  S.posts=p.data.map(x=>({...x,tags:(t.data||[]).filter(r=>r.post_id===x.id).map(r=>r.interest_id),sames:(s.data||[]).filter(r=>r.post_id===x.id).map(r=>r.user_id)}));
}
async function loadPeople(){
  const{data}=await sb.from('user_interests').select('user_id,interest_id,profiles(display_name)');
  const m={},c={};
  (data||[]).forEach(r=>{c[r.interest_id]=(c[r.interest_id]||0)+1;if(r.user_id===S.user.id)return;(m[r.user_id]||(m[r.user_id]={id:r.user_id,name:r.profiles?.display_name||'Member',ids:[]})).ids.push(r.interest_id)});
  S.people=Object.values(m);S.cnt=c;S.people.forEach(p=>S.names[p.id]=p.name);
}

// ---------- Home ----------
function post(p){
  const on=p.sames.includes(S.user.id);
  return `<article class="card" data-pi="${p.id}"><div class="who">${av(p.author_id)}<div><b>${esc(nm(p.author_id))}</b><div class="mute sm">${ago(p.created_at)}</div></div></div><p>${esc(p.body)}</p><div class="path">${p.tags.map(tgb).join('')}</div><div class="acts"><button class="same ${on?'on':''}" onclick="same('${p.id}',this)"><span>Same</span></button><button class="ghost" onclick="toast('Replies coming soon')">Reply</button><button class="ghost" onclick="share()">Share</button></div><div class="who2">${sm(p)}</div></article>`;
}
async function same(id,btn){
  const p=S.posts.find(x=>String(x.id)===String(id)),u=S.user.id,on=!p.sames.includes(u);
  const set=v=>{p.sames=v?[...p.sames,u]:p.sames.filter(x=>x!==u);document.querySelectorAll(`.card[data-pi="${id}"]`).forEach(c=>{c.querySelector('.same').className='same'+(v?' on':'');c.querySelector('.who2').innerHTML=sm(p)})};
  set(on);btn.style.transform='scale(.88)';setTimeout(()=>btn.style.transform='',180);
  const r=on?await sb.from('sames').insert({post_id:p.id,user_id:u}):await sb.from('sames').delete().match({post_id:p.id,user_id:u});
  if(r.error){set(!on);toast("Couldn't save that")}
}
const rel=(p,l)=>p.tags.some(n=>l.has(n))?'like':p.tags.some(n=>[...l].some(m=>cat(m)==cat(n)))?'might':'new';
function home(){
  if(!['All','might','new'].includes(S.F)&&!S.mine.has(S.F))S.F='All';
  $('#fl').innerHTML=[['All','All'],['might','Might like'],['new','New'],...[...S.mine].map(n=>[n,em(n)+' '+iname(n),col(n)])].map(t=>`<button class="fc ${t[0]===S.F?'on':''}" ${t[2]?`style="--c:${t[2]}"`:''} onclick='setF(${JSON.stringify(t[0])})'>${t[1]=='All'||t[1]=='Might like'||t[1]=='New'?t[1]:esc(t[1])}</button>`).join('');
  const F=S.F,l=F=='All'?S.posts.filter(p=>rel(p,S.mine)=='like'):F=='might'||F=='new'?S.posts.filter(p=>rel(p,S.snap)==F):S.posts.filter(p=>p.tags.includes(F));
  $('#feed').innerHTML=l.map(post).join('')||'<div class="empty">No posts here yet.<br>Tap + and write the first one.</div>';
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
async function publish(){
  const v=$('#txt').value.trim(),a=+$('#sel').value,b=+$('#sel2').value;
  if(!v){$('#txt').focus();return}
  if(!a){toast('Add something you like first');return}
  const btn=$('#shr');btn.disabled=true;
  const{data,error}=await sb.from('posts').insert({author_id:S.user.id,body:v}).select('id').single();
  if(error){btn.disabled=false;toast(error.message);return}
  const t=await sb.from('post_interests').insert([...new Set([a,b].filter(Boolean))].map(n=>({post_id:data.id,interest_id:n})));
  btn.disabled=false;$('#txt').value='';closePost();S.F='All';
  await loadPosts();draw();$('#feed').scrollTop=0;
  toast(t.error?'Posted, but tags failed':'Posted');
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
  $('#ppl').innerHTML=S.people.map(p=>({p,c:p.ids.filter(x=>S.mine.has(x))})).filter(o=>(o.p.name+o.p.ids.map(iname).join()).toLowerCase().includes(q)).sort((a,b)=>b.c.length-a.c.length).map(o=>`<div class="card row">${av(o.p.id)}<div class="grow"><b>${esc(o.p.name)}</b><div class="mute sm">${o.c.length?'You both like':'Into'}</div><div>${(o.c.length?o.c:o.p.ids.slice(0,2)).map(chip).join('')}</div></div></div>`).join('')||'<div class="empty">No one else here yet.<br>Invite a friend to see them.</div>';
  $('#rooms').innerHTML=S.ints.filter(i=>i.name.toLowerCase().includes(q)).map(i=>`<button class="room" onclick="openChat(${i.id},1)"><span>${em(i.id)}</span>${esc(i.name)}</button>`).join('')||'<div class="empty">No circles found</div>';
  const m=mix(q);
  $('#fx').innerHTML=m.length?'<div class="gridx">'+m.map(p=>`<button class="gt" style="--c:${col(p.tags[0])}" onclick="openPost('${p.id}')"><span class="ge">${em(p.tags[0])}</span><span class="gtx">${esc(p.body)}</span></button>`).join('')+'</div>':'<div class="empty">Nothing found</div>';
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
function openPost(id){showPv(()=>{const p=S.posts.find(x=>String(x.id)===String(id));return p?post(p):''})}

// ---------- You + interests ----------
function meTab(){
  $('#mav').textContent=(S.name||'?')[0].toUpperCase();$('#mn').textContent=S.name;$('#mem').textContent=S.user.email||'';
  $('#shelf').innerHTML=[...S.mine].map(chip).join('')+`<button class="chip addb" onclick="openPk()">＋ Add</button>`;
  $('#mine').innerHTML=S.posts.filter(p=>p.author_id==S.user.id).map(post).join('')||'<div class="empty">No posts yet</div>';
}
function drawPk(){$('#pkl').innerHTML=S.ints.map(i=>{const on=S.mine.has(i.id);return `<button class="fc ${on?'on':''}" style="--c:${col(i.id)}" onclick="ask(${i.id})">${em(i.id)} ${esc(i.name)}${on?' ✓':''}</button>`}).join('')}
function openPk(){drawPk();$('#pk').classList.add('on')}
function ask(n){S.pend=n;const on=S.mine.has(n);$('#cft').textContent=(on?'Remove ':'Add ')+iname(n)+(on?' from':' to')+' your interests?';$('#cfy').textContent=on?'Remove':'Add';$('#cf').classList.add('on')}
async function cfyes(){
  const n=S.pend,on=S.mine.has(n);$('#cf').classList.remove('on');
  const r=on?await sb.from('user_interests').delete().match({user_id:S.user.id,interest_id:n}):await sb.from('user_interests').insert({user_id:S.user.id,interest_id:n});
  if(r.error){toast(r.error.message);return}
  on?S.mine.delete(n):S.mine.add(n);
  draw();if($('#pk').classList.contains('on'))drawPk();toast((on?'Removed ':'Added ')+iname(n));
}
function draw(){home();findTab();meTab();refreshPv()}

// ---------- Chats (coming soon) ----------
let conv=false,ctab=0;
function openChats(){conv=false;$('#ov').classList.add('on');$('#ct').textContent='Chats';$('#cv').style.display='none';$('#cl').style.display='block';
 $('#cl').innerHTML=`<div class="tabs"><button class="${ctab?'':'on'}" onclick="ctab=0;openChats()">Friends</button><button class="${ctab?'on':''}" onclick="ctab=1;openChats()">Circles</button></div>`+(ctab?S.ints.map(i=>`<div class="card row" onclick="openChat(${i.id},1)"><div class="tile">${em(i.id)}</div><b>${esc(i.name)}</b></div>`).join(''):S.people.map(p=>`<div class="card row" onclick="openChat('${p.id}',0)">${av(p.id)}<b>${esc(p.name)}</b></div>`).join(''))||'<div class="empty">Nothing here yet</div>'}
function openChat(k,room){conv=true;$('#ov').classList.add('on');$('#cl').style.display='none';$('#cv').style.display='flex';$('#ct').textContent=room?iname(k):nm(k);
 $('#msgs').innerHTML='<div class="empty" style="margin:auto"><div style="font-size:44px;margin-bottom:8px">💬</div><b>Chats are coming soon</b></div>'}
function send(){$('#mi').value='';toast('Chat coming soon')}
function back(){conv?openChats():$('#ov').classList.remove('on')}

document.querySelectorAll('#nav button').forEach(b=>b.onclick=async()=>{
  const s=b.dataset.s;show(s);
  if(s=='find')await loadPeople();else await loadPosts();
  draw();
});

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
let curAcc=0,curFont=0;
function paintCustomize(){
  document.querySelectorAll('#sws .sw').forEach((x,i)=>x.classList.toggle('on',i==curAcc));
  document.querySelectorAll('#fcs .fc').forEach((x,i)=>x.classList.toggle('on',i==curFont));
}
function accent(i){
  const a=ACCENTS[i],d=document.documentElement,r=d.style;
  curAcc=i;
  if(a.mono){d.dataset.palette='mono'}
  else{delete d.dataset.palette;r.setProperty('--h',a.h);r.setProperty('--h2',a.h2);r.setProperty('--h3',a.h3)}
  try{localStorage.setItem('il-acc',i)}catch(e){}
  paintCustomize();
}
function fnt(i){
  curFont=i;document.documentElement.style.setProperty('--font',FONTS[i].f);
  try{localStorage.setItem('il-font',i)}catch(e){}
  paintCustomize();
}
$('#sws').innerHTML=ACCENTS.map((a,i)=>`<button class="sw" style="background:${a.mono?'#0a0a0a':`linear-gradient(135deg,hsl(${a.h} 83% 58%),hsl(${a.h2} 84% 61%))`}" onclick="accent(${i})" aria-label="${a.n}"></button>`).join('');
$('#fcs').innerHTML=FONTS.map((f,i)=>`<button class="fc" style="font-family:${f.f}" onclick="fnt(${i})">${f.n}</button>`).join('');
try{const sa=+localStorage.getItem('il-acc'),sf=+localStorage.getItem('il-font');if(sa)accent(sa);if(sf)fnt(sf)}catch(e){}
paintCustomize();
 $('#fl').addEventListener('wheel',e=>{if(Math.abs(e.deltaY)>Math.abs(e.deltaX)){e.preventDefault();$('#fl').scrollLeft+=e.deltaY}},{passive:false});
// Theme toggle
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

function toggleTheme(){document.documentElement.dataset.theme=isDark()?'light':'dark';updateThemeIcon()}

updateThemeIcon();
matchMedia('(prefers-color-scheme:light)').addEventListener('change',updateThemeIcon);

boot();
