// ---- Supabase connection (both values are safe to be public) ----
const SUPABASE_URL="https://rgrtwewhiylwkxgbcgyx.supabase.co";
const SUPABASE_KEY="sb_publishable_frBJksxES3J_AZICQ619fw_6e7hP59z";
const sb=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
// Push notifications: paste the PUBLIC key from PUSH-SETUP.md here. While this is empty, the notification settings stay hidden.
const VAPID_PUBLIC='BC0pryw7UqZIAhNML0k41re86rCfX0PfqlWRLSTX_o-6GghUx3btDBxf3U5nfqWcNIiPvHsF9Tm5jwMc5tunqyM';
// Shown on the Terms / Privacy / Contact sheet. Must be an inbox you check.
const LANDING_URL='https://iliketeam.github.io/landing/';   // Terms, Privacy and Contact pages open from here
const APP_URL=()=>location.origin+location.pathname;

const $=s=>document.querySelector(s);
const UI_ICONS={
  bell:'<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M10 21h4"/></svg>',
  camera:'<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h3l1.5-2h7L17 7h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  block:'<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/></svg>',
  report:'<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2.8 20h18.4L12 3Z"/><path d="M12 9v5M12 17.5h.01"/></svg>',
  shield:'<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 20 6v5c0 5-3.2 8.4-8 10-4.8-1.6-8-5-8-10V6l8-3Z"/><path d="m9 12 2 2 4-4"/></svg>',
  install:'<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11M8 10l4 4 4-4"/><path d="M5 16v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3"/></svg>',
};
const S={user:null,name:'',prof:null,ints:[],im:new Map(),mine:new Set(),snap:new Set(),posts:[],myPosts:[],pm:new Map(),people:[],cnt:{},names:{},avs:{},roles:{},role:'user',blocked:new Set(),reports:null,nrep:0,ax:null,rp:null,ua:null,am:null,mg:null,F:'All',tab:'home',mode:'login',err:'',good:false,pick:new Set(),cfFn:null,th:null,reps:null,pmId:null,edId:null,edRm:new Set(),photos:[],msgs:[],notifs:[],nposts:{},dm:null,ch:null,deep:null,rec:false,loaded:false,fol:new Set(),folrs:new Set(),evs:null,evm:new Map(),evId:null,evEm:'📍',room:null,cm:null,cch:null,pf:null,pkm:'int',achCat:[],achMine:new Map(),achReady:false,mt:0,liked:null};
S.eventAuthorized=false;
S.eventComments=new Map();
S.evTab='about';
S.evActiveId=null;
S.evChats=new Map();
S.evGallery=new Map();S.evChatErr=new Map();S.evUnread=new Map();S.evCh=null;S.evChId=null;
S.ticketQuantities={ga:1,vip:0,early:0};
S.ticketPrices={ga:15,vip:35,early:10};

const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Post and reply text: links, #topics and @mentions become tappable (text is escaped first, only http/https links are allowed)
// lite = no #topic links (used in chats and comments)
const RICH_RE=/(https?:\/\/[^\s<>"]+|www\.[^\s<>"]+)|(^|[^\p{L}\p{N}_&\/])#([\p{L}\p{N}_]{2,30})(?![\p{L}\p{N}_])|(^|[^\p{L}\p{N}_&\/.@])@([A-Za-z0-9_.]{3,20})(?![A-Za-z0-9_])/gu;
function rich(src,lite){
  const s=String(src??'');let out='',i=0,m;RICH_RE.lastIndex=0;
  while((m=RICH_RE.exec(s))){
    out+=esc(s.slice(i,m.index));i=RICH_RE.lastIndex;
    if(m[1]){
      let u=m[1],tail='';const t=u.match(/[.,!?;:)\]'"]+$/);
      if(t){tail=t[0];u=u.slice(0,-tail.length)}
      const href=/^www\./i.test(u)?'https://'+u:u,txt=u.replace(/^https?:\/\//i,'').replace(/^www\./i,''),disp=txt.length>38?txt.slice(0,37)+'…':txt;
      out+=`<a class="tl" href="${esc(href)}" target="_blank" rel="noopener noreferrer nofollow ugc" onclick="event.stopPropagation()">${esc(disp)}</a>`+esc(tail);
    }else if(m[3]){
      out+=lite?esc(m[0]):esc(m[2])+`<a class="ht" href="#" role="button" onclick="event.stopPropagation();event.preventDefault();hashSearch('${m[3]}')">#${esc(m[3])}</a>`;
    }else{
      let u=m[5],tail='';const t=u.match(/\.+$/);
      if(t){tail=t[0];u=u.slice(0,-tail.length)}
      out+=u.length<3?esc(m[0]):esc(m[4])+`<a class="mn" href="#" role="button" onclick="event.stopPropagation();event.preventDefault();openUser('${u.toLowerCase()}')">@${esc(u)}</a>`+esc(tail);
    }
  }
  return out+esc(s.slice(i));
}
const ago=d=>{const m=Math.floor((Date.now()-new Date(d))/60000);return m<1?'just now':m<60?m+'m ago':m<1440?Math.floor(m/60)+'h ago':Math.floor(m/1440)+'d ago'};
const tm=d=>{const x=new Date(d),t=x.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});return x.toDateString()==new Date().toDateString()?t:x.toLocaleDateString([],{month:'short',day:'numeric'})+' '+t};
const iname=n=>S.im.get(n)?.name||'';
const col=n=>esc(S.im.get(n)?.color||'var(--brand)');
const em=n=>esc(S.im.get(n)?.emoji||(S.im.get(n)?.kind=='artist'?'🎤':'✦'));
const cat=n=>S.im.get(n)?.category;

const rb=id=>{const r=S.roles[id];return r=='admin'?' <span class="rbadge ad">Admin</span>':r=='mod'?' <span class="rbadge">Mod</span>':''};
const isMod=()=>S.role=='mod'||S.role=='admin',isAdmin=()=>S.role=='admin';
const nm=id=>S.names[id]||(id==S.user?.id?S.name:'Member');
const PAL=['#8B5CF6','#EC4899','#22C55E','#F59E0B','#14B8A6','#3B82F6','#EF4444'];

const CATALOG_INTERESTS=INTEREST_CATALOG.flatMap(group=>group.items.map(([name,emoji])=>({name,emoji,color:group.color,category:group.category})));
const ac=id=>id==S.user?.id?'var(--brand)':PAL[[...String(id)].reduce((a,c)=>a+c.charCodeAt(0),0)%PAL.length];

const av=(id,z='')=>{const u=S.avs[id];return `<span class="av ${z}" style="--c:${ac(id)}${u?`;background-image:url('${esc(u)}');background-size:cover;background-position:center`:''}">${u?'':esc((nm(id)||'?')[0].toUpperCase())}</span>`};
function setMyAv(el){
  if(!el)return;
  const u=S.avs[S.user?.id];
  el.textContent=u?'':(S.name||'?')[0].toUpperCase();
  el.style.backgroundImage=u?`url('${u}')`:'';el.style.backgroundSize='cover';el.style.backgroundPosition='center';
}
const chip=n=>`<span class="chip" style="--c:${col(n)}">${em(n)} ${esc(iname(n))}</span>`;
const tgb=n=>S.mine.has(n)?chip(n):`<button class="chip tg" style="--c:${col(n)}" onclick="ask(${n})">${em(n)} ${esc(iname(n))}</button>`;
const say=l=>!l.length?'':l.length==1?l[0]+' liked this':l.length==2?l.join(' & ')+' liked this':l[0]+', '+l[1]+' & others liked this';
const so=p=>{const a=p.sames.filter(x=>x!=S.user.id&&!bl(x));return p.sames.includes(S.user.id)?[S.user.id,...a]:a};
const sm=p=>{const o=so(p);return (o.length?`<span class="stk">${o.slice(0,3).map(x=>av(x,'sm')).join('')}</span>`:'')+esc(say(o.map(x=>x==S.user.id?'You':nm(x))))};
const findPost=id=>S.pm.get(String(id));

const tmx=d=>new Date(d).toLocaleString([],{weekday:'short',day:'numeric',month:'short',year:'numeric',hour:'numeric',minute:'2-digit'});
const tmk=d=>`<span class="tm" data-t="${d}" onclick="tmTap(this)">${ago(d)}</span>`;
function tmTap(el){const x=el.dataset.x=='1';el.dataset.x=x?'':'1';el.textContent=x?ago(el.dataset.t):tmx(el.dataset.t)}

async function fetchAll(build,cap=5000){
  let out=[],from=0;
  while(from<cap){
    const r=await build().range(from,from+999);
    if(r.error)return r;
    out=out.concat(r.data);
    if(r.data.length<1000)break;
    from+=1000;
  }
  return{data:out,error:null};
}

async function alreadySent(table,col,extra,body){
  const since=new Date(Date.now()-120000).toISOString();
  let q=sb.from(table).select('*').eq(col,S.user.id).eq('body',body).gte('created_at',since).order('created_at',{ascending:false}).limit(1);
  for(const k in extra)q=q.eq(k,extra[k]);
  const r=await q;
  return r.data&&r.data[0]||null;
}

function failSync(){
  const el=$('#rtbar');if(!el)return;
  const k=S.room!=null?'r'+S.room:'d'+S.dm;
  el.hidden=!(S.fail&&S.fail.k==k);
}
function failDismiss(){S.fail=null;failSync()}

const SL_PAGE=30;
function slDraw(){
  const L=S.sl;if(!L)return;
  $('#sll').innerHTML=(L.ids.slice(0,L.n).map(L.row).join('')||L.empty)+(L.n<L.ids.length?`<button class="btn off" style="width:100%;margin-top:8px" onclick="slMore()">Show more (${L.ids.length-L.n})</button>`:'')+(L.foot||'');
  autoMore($('#sll button[onclick="slMore()"]'),slMore,$('#sll').parentElement);
}
function slMore(){S.sl.n+=SL_PAGE;slDraw()}
// load the next page when the "show more" button scrolls into view
let moreObs=null;
function autoMore(btn,fn,root){
  if(moreObs){moreObs.disconnect();moreObs=null}
  if(!btn||!('IntersectionObserver' in window))return;
  moreObs=new IntersectionObserver(e=>{if(e.some(x=>x.isIntersecting)){moreObs.disconnect();moreObs=null;fn()}},{root:root||null,rootMargin:'300px'});
  moreObs.observe(btn);
}
let toastT;
function toast(m){const t=$('#toast');if(!t)return;t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),2200)}
// Undo toast: the change shows on screen at once, the real change is made after 5 s unless Undo is tapped
let UD=null,udEl=null;
function udHide(){if(udEl)udEl.classList.remove('on')}
function undoable(msg,hide,commit,revert){
  flushUndo();hide();
  if(!udEl){
    udEl=document.createElement('div');udEl.className='udt';udEl.setAttribute('role','status');
    udEl.innerHTML='<span></span><button type="button">Undo</button>';
    udEl.querySelector('button').onclick=()=>{if(!UD)return;const u=UD;UD=null;clearTimeout(u.t);udHide();u.revert()};
    document.body.appendChild(udEl);
  }
  udEl.firstChild.textContent=msg;udEl.classList.add('on');
  UD={commit,revert,t:setTimeout(()=>flushUndo(),5000)};
}
function flushUndo(){
  if(!UD)return Promise.resolve();
  const u=UD;UD=null;clearTimeout(u.t);udHide();
  return Promise.resolve(u.commit());
}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState=='hidden')flushUndo()});
addEventListener('pagehide',()=>{flushUndo()});

const postUrl=id=>location.origin+location.pathname+'#post='+id;
const eventUrl=id=>location.origin+location.pathname+'#event='+id;

function share(id){
  const url=id?postUrl(id):location.href;
  if(navigator.share){navigator.share({title:'iLike',url}).catch(()=>{});return}
  if(navigator.clipboard)navigator.clipboard.writeText(url).then(()=>toast('Link copied'),()=>toast("Couldn't copy link"));
  else toast("Couldn't copy link");
}

function shareCurrentEvent(){
  if(!S.evActiveId)return;
  const url=eventUrl(S.evActiveId);
  const e=S.evm.get(S.evActiveId);
  const title=e?e.title:'iLike Event';
  if(navigator.share){navigator.share({title,url}).catch(()=>{});return}
  if(navigator.clipboard)navigator.clipboard.writeText(url).then(()=>toast('Event link copied!'),()=>toast("Couldn't copy link"));
  else toast("Couldn't copy link");
}

function show(id){
  if(id!='auth'&&id!='onb')S.tab=id;
  document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('on',s.id=='s-'+id));
  document.body.classList.toggle('noapp',id=='auth'||id=='onb');
  document.querySelectorAll('#nav button').forEach(x=>x.classList.toggle('on',x.dataset.s==id));
}

let backGuardReady=false;
function setupBackGuard(){
  if(backGuardReady||!S.user||!S.loaded)return;
  history.replaceState({ilikeApp:'base',screen:S.tab||'home'},'',location.href);
  history.pushState({ilikeApp:'guard'},'',location.href);
  backGuardReady=true;
}
function topOpenLayer(){
  const layers=[...document.querySelectorAll('.ov.on,.mod.on')];
  layers.sort((a,b)=>(parseInt(getComputedStyle(a).zIndex,10)||0)-(parseInt(getComputedStyle(b).zIndex,10)||0));
  return layers[layers.length-1]||null;
}
function closeTopLayer(){
  const layer=topOpenLayer();if(!layer)return false;
  switch(layer.id){
    case 'ev-ov':closeEventView();break;
    case 'ticket-mod':closeTickets();break;
    case 'ov':back();break;
    case 'lb':closeLb();break;
    case 'mod':closePost();break;
    case 'pe':closePe();break;
    case 'pm':closePm();break;
    case 'pf':closePf();break;
    case 'th':closeThread();break;
    case 'fb':closeFb();break;
    case 'da':closeDa();break;
    case 'ax':closeAx();break;
    case 'rp':closeRp();break;
    case 'ua':closeUa();break;
    case 'cf':S.cfFn=null;layer.classList.remove('on');break;
    default:layer.classList.remove('on');
  }
  return true;
}
addEventListener('popstate',()=>{
  if(!backGuardReady||!S.user||!S.loaded)return;
  if(closeTopLayer()){
    history.pushState({ilikeApp:'guard'},'',location.href);
    return;
  }
  if(S.tab==='home'){
    backGuardReady=false;
    history.back();
    return;
  }
  const feed=$('#feed'),scrollTop=feed?.scrollTop||0;
  closeAll();
  show('home');
  history.pushState({ilikeApp:'guard'},'',location.href);
  loadPosts().then(()=>{draw();if(feed)feed.scrollTop=scrollTop});
});
// Desktop: the mouse wheel scrolls the feed, Discover and Events even over the empty areas beside them.
document.addEventListener('wheel',e=>{
  if(e.ctrlKey||e.defaultPrevented||!matchMedia('(min-width:1024px)').matches||!S.user||!S.loaded)return;
  if(document.querySelector('.mod.on,.ov.on'))return;
  const t=e.target;
  if(!(t===document.body||t===document.documentElement||t.id==='app'||(t.classList&&t.classList.contains('screen'))))return;
  const el=S.tab==='home'?$('#feed'):S.tab==='find'?[...document.querySelectorAll('.pscroll')].find(x=>x.offsetParent):S.tab==='events'?$('#s-events'):null;
  if(el){el.scrollTop+=e.deltaY;e.preventDefault()}
},{passive:false});
document.addEventListener('keydown',e=>{
  if(e.key!=='Escape'||!topOpenLayer())return;
  e.preventDefault();closeTopLayer();
});
function syncAppViewport(){
  const h=window.visualViewport?.height;
  if(h)document.documentElement.style.setProperty('--app-vh',Math.round(h)+'px');
}
syncAppViewport();
window.visualViewport?.addEventListener('resize',syncAppViewport,{passive:true});
function keepFieldVisible(t){
  if(!t||!t.matches||!t.matches('input,textarea,select')||!t.closest('.mod .sheet'))return;
  try{t.scrollIntoView({block:'center',behavior:'smooth'})}catch(x){}
}
document.addEventListener('focusin',e=>{const t=e.target;setTimeout(()=>keepFieldVisible(t),320)});
let kbT=0;
window.visualViewport?.addEventListener('resize',()=>{clearTimeout(kbT);kbT=setTimeout(()=>keepFieldVisible(document.activeElement),120)},{passive:true});
addEventListener('orientationchange',syncAppViewport,{passive:true});

function confirmBox(title,yes,fn){S.cfFn=fn;$('#cft').textContent=title;$('#cfy').textContent=yes;$('#cf').classList.add('on')}
function cfyes(){$('#cf').classList.remove('on');const f=S.cfFn;S.cfFn=null;if(f)f()}

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
// Thumbnails: a photo uploaded with a small copy is saved as <name>_f.jpg (full) + <name>_t.jpg (thumb).
// Older photos (plain <name>.jpg) have no thumb and are shown as they are.
const FULL='_f.jpg',THUMB='_t.jpg',THUMB_MAX=720;
const thumb=u=>u&&u.endsWith(FULL)?u.slice(0,-FULL.length)+THUMB:u;
// <img> that shows the thumbnail, keeps the full-size URL for the photo viewer, and falls back to full size if the thumb is missing
const timg=u=>{const t=thumb(u);return `<img src="${esc(t)}" data-full="${esc(u)}" loading="lazy" decoding="async" alt="Photo"${t!==u?` onerror="this.onerror=null;this.src=this.dataset.full"`:''}>`};
async function upload(bucket,blob,tb){
  const base=`${S.user.id}/${Date.now()}-${Math.random().toString(36).slice(2,8)}`,opt={contentType:'image/jpeg',cacheControl:'31536000'},st=sb.storage.from(bucket);
  let path=base+'.jpg';
  if(tb){
    // thumb first: only name the full file "_f" when its thumb really exists
    try{const t=await st.upload(base+THUMB,tb,opt);if(!t.error)path=base+FULL}catch(e){}
  }
  const{error}=await st.upload(path,blob,opt);
  if(error){if(path.endsWith(FULL))st.remove([base+THUMB]).catch(()=>{});throw error}
  return st.getPublicUrl(path).data.publicUrl;
}
const pathOf=(url,bucket)=>{const i=url.indexOf('/'+bucket+'/');return i<0?null:decodeURIComponent(url.slice(i+bucket.length+2))};
async function rmFiles(bucket,urls){
  const p=urls.map(u=>pathOf(u,bucket)).filter(Boolean);
  p.slice().forEach(x=>{if(x.endsWith(FULL))p.push(x.slice(0,-FULL.length)+THUMB)});   // remove the thumbnail with its photo
  if(p.length)await sb.storage.from(bucket).remove(p);
}

const LB={list:[],th:[],tok:0,i:0,z:1,x:0,y:0,dx:0,dy:0,sx:0,sy:0,d0:0,moved:false,lastTap:0,closedAt:0,ptrs:new Map()};
function openLb(u,list,i,th){
  LB.list=list&&list.length?list:[u];LB.th=th||[];LB.i=Math.max(0,i||0);
  $('#lb').classList.add('on');lbShow();
}
function closeLb(){LB.closedAt=Date.now();$('#lb').classList.remove('on');LB.ptrs.clear();LB.list=[];LB.th=[]}
function lbShow(dir){
  LB.z=1;LB.x=LB.y=LB.dx=LB.dy=0;
  const im=$('#lbi'),u=LB.list[LB.i],t=LB.th[LB.i],tok=++LB.tok;
  im.classList.remove('slidel','slider','snap');
  if(dir){void im.offsetWidth;im.classList.add(dir>0?'slider':'slidel')}   // new photo slides in from the side you swiped toward
  if(t&&t!==u){   // show the small thumbnail at once, swap to full size when it has loaded
    im.src=t;const f=new Image();f.onload=()=>{if(LB.tok==tok)im.src=u};f.src=u;
  }else im.src=u;
  lbPaint();
  const n=LB.list.length;
  $('#lbc').textContent=n>1?(LB.i+1)+' of '+n:'';
  $('#lbp').hidden=LB.i<=0;$('#lbnx').hidden=LB.i>=n-1;
  [LB.i-1,LB.i+1].forEach(k=>{if(LB.list[k])new Image().src=LB.list[k]});
}
function lbGo(d){const k=LB.i+d;if(k<0||k>=LB.list.length)return;LB.i=k;lbShow(d)}
function lbPaint(){
  // while dragging down/up to close, the photo shrinks a little and the backdrop fades
  const f=LB.z==1&&Math.abs(LB.dy)>Math.abs(LB.dx)?Math.min(1,Math.abs(LB.dy)/320):0;
  $('#lbi').style.transform=`translate(${LB.x+LB.dx}px,${LB.y+LB.dy}px) scale(${LB.z*(1-f*.18)})`;
  $('#lb').style.background=f?`rgba(0,0,0,${.94*(1-f*.75)})`:'';
}
function lbClamp(){
  const im=$('#lbi'),mx=im.clientWidth*(LB.z-1)/2,my=im.clientHeight*(LB.z-1)/2;
  LB.x=Math.max(-mx,Math.min(mx,LB.x));LB.y=Math.max(-my,Math.min(my,LB.y));
}
function lbZoom(z,fx,fy){
  z=Math.min(4,Math.max(1,z));const k=z/LB.z;
  LB.x=fx-(fx-LB.x)*k;LB.y=fy-(fy-LB.y)*k;LB.z=z;
  if(z<=1.02){LB.z=1;LB.x=LB.y=0}else lbClamp();
  lbPaint();
}
(()=>{
  const st=$('#lbst');if(!st)return;
  const ctr=()=>{const r=st.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}};
  st.addEventListener('pointerdown',e=>{
    $('#lbi').classList.remove('snap');st.setPointerCapture(e.pointerId);LB.ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(LB.ptrs.size==1){LB.sx=e.clientX;LB.sy=e.clientY;LB.moved=false}
    LB.d0=0;
  });
  st.addEventListener('pointermove',e=>{
    const p=LB.ptrs.get(e.pointerId);if(!p)return;
    if(LB.ptrs.size>=2){
      p.x=e.clientX;p.y=e.clientY;LB.moved=true;
      const[a,b]=[...LB.ptrs.values()],d=Math.hypot(a.x-b.x,a.y-b.y),c=ctr();
      if(LB.d0)lbZoom(LB.z*d/LB.d0,(a.x+b.x)/2-c.x,(a.y+b.y)/2-c.y);
      LB.d0=d;return;
    }
    const mx=e.clientX-p.x,my=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
    if(Math.abs(e.clientX-LB.sx)+Math.abs(e.clientY-LB.sy)>8)LB.moved=true;
    if(LB.z>1){LB.x+=mx;LB.y+=my;lbClamp();lbPaint()}
    else{LB.dx=e.clientX-LB.sx;LB.dy=e.clientY-LB.sy;lbPaint()}
  });
  const up=e=>{
    if(!LB.ptrs.has(e.pointerId))return;
    LB.ptrs.delete(e.pointerId);LB.d0=0;
    if(LB.ptrs.size){const r=[...LB.ptrs.values()][0];LB.sx=r.x;LB.sy=r.y;LB.dx=LB.dy=0;LB.moved=true;return}
    const dx=LB.dx,dy=LB.dy,real=e.type=='pointerup';LB.dx=LB.dy=0;
    if(real&&LB.z==1){
      if(Math.abs(dy)>110&&Math.abs(dy)>Math.abs(dx)){closeLb();return}
      if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)){const k=LB.i;lbGo(dx<0?1:-1);if(LB.i!==k)return}
    }
    $('#lbi').classList.add('snap');lbPaint();   // glide back to centre
    if(real&&!LB.moved){
      const r=$('#lbi').getBoundingClientRect(),inside=e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;
      if(!inside&&LB.z==1){closeLb();return}
      const now=Date.now();
      if(now-LB.lastTap<300){const c=ctr();LB.z>1?lbZoom(1,0,0):lbZoom(2.5,e.clientX-c.x,e.clientY-c.y);LB.lastTap=0}
      else LB.lastTap=now;
    }
  };
  st.addEventListener('pointerup',up);st.addEventListener('pointercancel',up);
  st.addEventListener('wheel',e=>{e.preventDefault();const c=ctr();lbZoom(LB.z*(e.deltaY<0?1.12:.9),e.clientX-c.x,e.clientY-c.y)},{passive:false});
  document.addEventListener('keydown',e=>{
    if(!$('#lb')||!$('#lb').classList.contains('on'))return;
    if(e.key=='Escape')closeLb();else if(e.key=='ArrowRight')lbGo(1);else if(e.key=='ArrowLeft')lbGo(-1);
  });
})();

// The tap that closes the photo viewer must not also hit whatever is underneath it.
document.addEventListener('click',e=>{if(Date.now()-LB.closedAt<500){e.stopPropagation();e.preventDefault()}},true);
document.addEventListener('click',e=>{
  const i=e.target.closest('.pimgs img,.phgrid img,.ev-gallery-item img');
  if(i){const g=[...i.parentElement.parentElement.querySelectorAll('img')],full=x=>x.dataset.full||x.src;openLb(full(i),g.map(full),g.indexOf(i),g.map(x=>x.src));return}
  const z=e.target.closest('[data-zoom]');if(z&&z.dataset.zoom)openLb(z.dataset.zoom);
});
