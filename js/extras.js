document.querySelectorAll('#nav button[data-s]').forEach(b=>b.onclick=async()=>{
  const s=b.dataset.s;
  if(s===S.tab){
    const behavior=matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth';
    if(s==='home')$('#feed')?.scrollTo({top:0,behavior});
    else if(s==='find')ptrBox()?.scrollTo({top:0,behavior});
    else if(s==='events')$('#s-events')?.scrollTo({top:0,behavior});
    else if(s==='me'){
      $('.col-l')?.scrollTo({top:0,behavior});
      $('#mine')?.scrollTo({top:0,behavior});
    }
    if(s==='home'&&!S.homeBusy){S.homeBusy=true;try{await refreshAll()}finally{S.homeBusy=false}}   // Home tap: back to the top and refresh
    return;
  }
  show(s);
  if(s=='find')await loadPeople();else if(s=='events')await loadEvents();else await loadPosts();
  if(s=='me')checkAch();
  draw();
});
$('#fl')?.addEventListener('wheel',e=>{if(Math.abs(e.deltaY)>Math.abs(e.deltaX)){e.preventDefault();$('#fl').scrollLeft+=e.deltaY}},{passive:false});

function updateThemeIcon(){updateThemeColor()}
matchMedia('(prefers-color-scheme:light)').addEventListener('change',updateThemeIcon);

// ---------- Skeletons ----------
const skL=w=>`<i class="sk-l" style="width:${w}%"></i>`;
const skPost=()=>`<div class="card sk" aria-hidden="true"><div class="who"><span class="av sk-b"></span><div class="grow">${skL(40)}${skL(22)}</div></div>${skL(94)}${skL(68)}<div class="sk-pills"><i class="sk-b"></i><i class="sk-b"></i></div></div>`;
const skPerson=()=>`<div class="card row sk" aria-hidden="true"><span class="av sk-b"></span><div class="grow">${skL(45)}${skL(30)}</div><i class="sk-b sk-btn"></i></div>`;
const skEvent=()=>`<div class="card sk" aria-hidden="true"><div class="row"><i class="sk-b sk-tile"></i><div class="grow">${skL(35)}${skL(60)}${skL(45)}</div></div></div>`;
const skRep=()=>`<div class="rep sk" aria-hidden="true"><span class="av sk-b"></span><div class="grow">${skL(30)}${skL(80)}</div></div>`;
const skProf=()=>`<div class="pfh sk" aria-hidden="true"><span class="av big sk-b"></span>${skL(40)}${skL(25)}${skL(80)}</div>`;

// ---------- Drafts ----------
const dKey=()=>'il-draft-'+(S.user?.id||'');
// Unsent comments and replies are kept on this device for 24 hours, then dropped
const DRAFT_TTL=24*60*60*1000;
const cdKey=()=>'il-cdraft-'+(S.user?.id||'');
function cdPut(o){try{localStorage.setItem(cdKey(),JSON.stringify(o))}catch(e){}}
function cdAll(){
  let o={};try{o=JSON.parse(localStorage.getItem(cdKey())||'{}')||{}}catch(e){}
  const n=Date.now();let ch=false;
  for(const k in o)if(!o[k]||n-o[k].t>DRAFT_TTL){delete o[k];ch=true}
  if(ch)cdPut(o);return o;
}
function cdGet(k){const d=cdAll()[k];return d?d.v:''}
function cdSet(k,v){
  const o=cdAll();
  if((v||'').trim())o[k]={v,t:Date.now()};else delete o[k];
  const ks=Object.keys(o);if(ks.length>30)delete o[ks[0]];
  cdPut(o);
}
function setSel(el,v){if(v&&[...el.options].some(o=>o.value==v))el.value=v}
function saveDraft(){
  const t=$('#txt').value;
  try{
    if(t.trim())localStorage.setItem(dKey(),JSON.stringify({t,a:$('#sel').value,b:$('#sel2').value,ts:Date.now()}));
    else localStorage.removeItem(dKey());
  }catch(e){}
  $('#pdis').hidden=!t.trim();
}
function restoreDraft(){
  let d=null;try{d=JSON.parse(localStorage.getItem(dKey())||'null')}catch(e){}
  if(d&&d.ts&&Date.now()-d.ts>DRAFT_TTL){clearDraft();d=null}   // older than 24 h
  if(d&&d.t&&!$('#txt').value){
    $('#txt').value=d.t;setSel($('#sel'),d.a);setSel($('#sel2'),d.b);toast('Draft restored');
  }
  $('#pdis').hidden=!$('#txt').value.trim();
}
function clearDraft(){try{localStorage.removeItem(dKey())}catch(e){}$('#pdis').hidden=true}
function discardDraft(){confirmBox('Discard this draft?','Discard',()=>{$('#txt').value='';clearDraft();toast('Draft discarded')})}
$('#txt')?.addEventListener('input',saveDraft);
$('#sel')?.addEventListener('change',saveDraft);
$('#sel2')?.addEventListener('change',saveDraft);
function rdSet(id,v){cdSet('r:'+id,v)}
function saveRD(){if(S.th)rdSet(S.th,$('#rin').value)}

async function refreshAll(){
  const t=S.tab;
  if(t=='find')await loadPeople();
  else if(t=='events')await loadEvents();
  else if(t=='me')await Promise.all([loadPosts(),loadFollows(),loadAch()]);
  else await Promise.all([loadPosts(),loadNotifs(),loadFollows()]);
  draw();
}

// ---------- Pull to Refresh ----------
const PT={y:0,d:0,on:false,busy:false,box:null};
const ptrEl=document.createElement('div');
ptrEl.id='ptr';ptrEl.setAttribute('aria-hidden','true');
ptrEl.innerHTML='<svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/></svg>';
document.body.appendChild(ptrEl);
function ptrBox(){
  switch(S.tab){
    case 'home':return $('#feed');
    case 'find':return ['#fp','#fg','#fx'].map($).find(e=>e.style.display!=='none');
    case 'events':return $('#s-events');
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

// ---------- PWA Install ----------
const APP_VERSION='v59';
if('serviceWorker' in navigator&&location.protocol.startsWith('http')){
  addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
  // When a newer version takes over, reload once so a phone does not keep running the old app.
  let hadCtl=!!navigator.serviceWorker.controller,reloaded=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(!hadCtl){hadCtl=true;return}
    if(reloaded)return;
    const typing=[...document.querySelectorAll('textarea,input')].some(x=>x.value&&!['checkbox','radio','file','range','hidden'].includes(x.type)&&x.offsetParent!==null);
    if(topOpenLayer()||typing){toast('Update ready. Close and reopen the app to get it.');return}
    reloaded=true;location.reload();
  });
}
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
  $('#inf').innerHTML=`<div class="install-hero-icon">${UI_ICONS.install}</div><div style="font-size:18px;font-weight:800;margin:6px 0">Add iLike to your home screen</div><p style="margin-top:10px">Tap the <b>Share</b> button in Safari, then choose <b>Add to Home Screen</b>.</p>`;
  $('#info').classList.add('on');
}
addEventListener('offline',()=>toast("You're offline"));
addEventListener('online',()=>{toast('Back online');if(S.user&&S.loaded)refreshAll().catch(()=>{})});

function updateThemeColor(){
  const p=document.createElement('i');p.style.cssText='display:none;color:var(--bg)';
  document.body.appendChild(p);const c=getComputedStyle(p).color;p.remove();
  const m=document.querySelector('meta[name="theme-color"]');
  if(m&&c)m.setAttribute('content',c);
}

// ---------- event comment / chat drafts (same 24 h rule) ----------
document.addEventListener('input',e=>{
  const t=e.target;if(!S.evActiveId)return;
  if(t.id=='ecin')cdSet('ec:'+S.evActiveId,t.value);
  else if(t.id=='ev-chat-in')cdSet('ev:'+S.evActiveId,t.value);
});
function evDraftFill(id){
  const a=$('#ecin'),b=$('#ev-chat-in');
  if(a&&!a.value)a.value=cdGet('ec:'+id);
  if(b&&!b.value)b.value=cdGet('ev:'+id);
}

// ---------- "N left" counter when 50 or fewer characters remain ----------
const CC_IDS=new Set(['txt','edt','rin','ecin','peb','ect']);   // posts, edit post, replies, event comments, bio
let ccEl=null;
function ccHide(){if(ccEl)ccEl.hidden=true}
function ccShow(t){
  if(!t||!CC_IDS.has(t.id)||!(t.maxLength>0)){ccHide();return}
  const left=t.maxLength-t.value.length;
  if(left>50){ccHide();return}
  if(!ccEl){ccEl=document.createElement('div');ccEl.className='cc';ccEl.setAttribute('aria-live','polite');document.body.appendChild(ccEl)}
  ccEl.textContent=left+' left';ccEl.classList.toggle('low',left<=10);ccEl.hidden=false;
  const r=t.getBoundingClientRect();
  ccEl.style.top=(r.top>44?r.top-30:r.bottom+6)+'px';
  ccEl.style.left=Math.max(8,r.right-ccEl.offsetWidth-6)+'px';
}
document.addEventListener('input',e=>ccShow(e.target));
document.addEventListener('focusin',e=>ccShow(e.target));
document.addEventListener('focusout',ccHide);
document.addEventListener('click',()=>setTimeout(()=>ccShow(document.activeElement),0));   // e.g. after Send clears the box
document.addEventListener('scroll',()=>{if(ccEl&&!ccEl.hidden)ccShow(document.activeElement)},true);

// ---------- @mentions: tap a @name to open that profile, and a people picker while typing ----------
async function openUser(u){
  const r=await sb.from('profiles').select('id').eq('username',String(u).toLowerCase()).maybeSingle();
  if(r.error||!r.data){toast('No one has that username');return}
  openProfile(r.data.id);
}
// fields that take mentions: new post, edit post, replies, event comments, event chat, circle chat (not direct messages)
const MN_IDS=new Set(['txt','edt','rin','ecin','ev-chat-in','mi']);
const mnOk=t=>!!t&&MN_IDS.has(t.id)&&(t.id!='mi'||S.room!=null);
let mnEl=null,mnSt=null,mnTok=0,mnTimer=0;
function mnToken(t){
  const pos=t.selectionStart;if(pos==null||pos!==t.selectionEnd)return null;
  const m=/(^|[\s(])@([A-Za-z0-9_.]{0,20})$/.exec(t.value.slice(0,pos));
  return m?{q:m[2],start:pos-m[2].length-1,end:pos}:null;
}
async function mnSearch(q){
  const cols='id,username,display_name,avatar_url';let r;
  if(q)r=await sb.from('profiles').select(cols).or(`username.ilike.${q}%,display_name.ilike.%${q}%`).neq('id',S.user.id).limit(6);
  else{   // just "@": suggest people you follow
    const ids=[...S.fol].slice(0,6);if(!ids.length)return[];
    r=await sb.from('profiles').select(cols).in('id',ids).limit(6);
  }
  if(r.error)return[];
  r.data.forEach(p=>{S.names[p.id]=p.display_name;if(p.avatar_url)S.avs[p.id]=p.avatar_url});
  return r.data.filter(p=>p.username&&!bl(p.id));
}
function mnHide(){mnSt=null;mnTok++;if(mnEl)mnEl.hidden=true}
function mnUpdate(t){
  if(!mnOk(t)){mnHide();return}
  const k=mnToken(t);if(!k){mnHide();return}
  mnSt={t,k,sel:0,rows:mnSt&&mnSt.t===t?mnSt.rows:[]};
  clearTimeout(mnTimer);const tok=++mnTok;
  mnTimer=setTimeout(async()=>{
    const rows=await mnSearch(k.q);
    if(tok!==mnTok||!mnSt)return;
    mnSt.rows=rows;mnSt.sel=0;mnDraw();
  },k.q?150:0);
  mnDraw();
}
function mnDraw(){
  const s=mnSt;
  if(!s||!s.rows.length){if(mnEl)mnEl.hidden=true;return}
  if(!mnEl){
    mnEl=document.createElement('div');mnEl.className='mnp';mnEl.setAttribute('role','listbox');document.body.appendChild(mnEl);
    mnEl.addEventListener('pointerdown',e=>{const b=e.target.closest('[data-i]');if(!b)return;e.preventDefault();mnPick(+b.dataset.i)});   // keeps the keyboard open
  }
  mnEl.innerHTML=s.rows.map((p,i)=>`<button type="button" class="mnr ${i==s.sel?'on':''}" role="option" data-i="${i}">${av(p.id,'sm')}<span><b>${esc(p.display_name||p.username)}</b><i>@${esc(p.username)}</i></span></button>`).join('');
  mnEl.hidden=false;
  const r=s.t.getBoundingClientRect(),h=mnEl.offsetHeight,w=mnEl.offsetWidth;
  let top=r.top-h-8;if(top<8)top=Math.min(r.bottom+8,innerHeight-h-8);
  mnEl.style.top=Math.max(8,top)+'px';
  mnEl.style.left=Math.max(8,Math.min(r.left,innerWidth-w-8))+'px';
}
function mnPick(i){
  const s=mnSt;if(!s||!s.rows[i])return;
  const t=s.t,v=t.value,ins='@'+s.rows[i].username+' ',next=v.slice(0,s.k.start)+ins+v.slice(s.k.end);
  if(t.maxLength>0&&next.length>t.maxLength){toast('Not enough room for that name');return}
  t.value=next;const c=s.k.start+ins.length;t.setSelectionRange(c,c);t.focus();
  mnHide();t.dispatchEvent(new Event('input',{bubbles:true}));
}
document.addEventListener('input',e=>mnUpdate(e.target));
document.addEventListener('keyup',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key))mnUpdate(e.target)});
document.addEventListener('click',e=>{if(!e.target.closest('.mnp'))setTimeout(()=>mnUpdate(document.activeElement),0)});
document.addEventListener('focusout',()=>setTimeout(()=>{if(!mnOk(document.activeElement))mnHide()},0));
document.addEventListener('scroll',()=>{if(mnSt)mnDraw()},true);
document.addEventListener('keydown',e=>{   // desktop: arrows / Enter / Tab / Esc work on the list
  if(!mnSt||!mnEl||mnEl.hidden||!mnSt.rows.length)return;
  const n=mnSt.rows.length,k=e.key;
  if(k=='ArrowDown'||k=='ArrowUp'){mnSt.sel=(mnSt.sel+(k=='ArrowDown'?1:n-1))%n;mnDraw()}
  else if(k=='Enter'||k=='Tab')mnPick(mnSt.sel);
  else if(k=='Escape')mnHide();
  else return;
  e.preventDefault();e.stopPropagation();
},true);

