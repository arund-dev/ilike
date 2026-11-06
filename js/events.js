// ---------- EVENTS: SPACING, FULLSCREEN & FEATURES --------
// ══════════════════════════════════════════════════════════
const EVEM=['📍','🎉','☕','🍜','🎮','🎬','🎵','🥾','⚽','📚','🎨','🏖️','🍕','🎤','🎲','🏃'];
const EVCOLS='id,organizer_id,title,emoji,starts_at,place,venue,description,cancelled_at';
const evd=d=>{const x=new Date(d);return x.toLocaleDateString([],{weekday:'short',day:'numeric',month:'short'})+' · '+x.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})};
const toLocalInput=d=>{const x=new Date(d),p=n=>String(n).padStart(2,'0');return x.getFullYear()+'-'+p(x.getMonth()+1)+'-'+p(x.getDate())+'T'+p(x.getHours())+':'+p(x.getMinutes())};
const ord=l=>l.includes(S.user.id)?[S.user.id,...l.filter(x=>x!=S.user.id)]:l;
const stack=l=>l.length?`<span class="stk">${l.slice(0,3).map(x=>av(x,'sm')).join('')}</span>`:'';
const iminHTML=on=>`<span>${on?"You're in ✓":"I'm in"}</span>`;
const canManageEvents=()=>isMod()||S.eventAuthorized;

async function loadEvents(){
  const since=new Date(Date.now()-3*36e5).toISOString();
  const[r,ea,goers]=await Promise.all([
    sb.from('events').select(EVCOLS).gte('starts_at',since).order('starts_at').limit(60),
    sb.from('event_authorizations').select('user_id').eq('user_id',S.user.id).maybeSingle(),
    fetchAll(()=>sb.from('event_goers').select('event_id,user_id').order('event_id'))]);
  if(!ea.error)S.eventAuthorized=!!ea.data;
  if(r.error){if(!S.evs)S.evs=[];toast("Couldn't load events");eventsTab();return}
  const goerMap=new Map();
  (goers.data||[]).forEach(g=>{
    if(!goerMap.has(g.event_id))goerMap.set(g.event_id,[]);
    goerMap.get(g.event_id).push(g.user_id);
  });
  await getProfiles([...r.data.map(e=>e.organizer_id),...(goers.data||[]).map(g=>g.user_id)]);
  S.evs=r.data.map(e=>({...e,goers:goerMap.get(e.id)||[]}));
  S.evm=new Map(S.evs.map(e=>[e.id,e]));
  eventsTab();
  if(S.evActiveId&&$('#ev-ov')?.classList.contains('on'))renderEventFullscreen();
}

function eventsTab(){
  const el=$('#evs'),newBtn=$('#newEventBtn');
  if(!el||!newBtn)return;
  newBtn.hidden=!canManageEvents();
  if(!S.evs){el.innerHTML=skEvent().repeat(3);return}
  el.innerHTML=S.evs.length?S.evs.map(eventCard).join(''):`<div class="empty" style="grid-column:1/-1;padding:60px 16px"><div style="font-size:48px;margin-bottom:10px">🗓️</div><b>No upcoming events</b><div class="sm" style="margin:6px 0 16px">Check back soon for new hangouts and gatherings.</div>${canManageEvents()?'<button class="btn" onclick="openEv()">Create the first event</button>':''}</div>`;
  pastDraw();
}

// Event Card in the list - with spacious padding, date pill, attendees, and tickets badge
function eventCard(e){
  const me=S.user.id,on=e.goers.includes(me);
  const cancelled=e.cancelled_at?'<span class="evbadge">Cancelled</span>':'';
  const past=e.past?'<span class="mute sm">Ended</span>':'';
  const attendeeCount=e.goers.length;
  return `<div class="event-card-item tapc${e.cancelled_at?' evx':''}" onclick="openEvent('${e.id}')">
    <div class="ev-card-top">
      <div class="ev-card-tile">${esc(e.emoji||'📍')}</div>
      <div class="ev-card-meta">
        <span class="ev-card-date">${evd(e.starts_at)}</span>
        <h3 class="ev-card-title">${esc(e.title)}</h3>
        <div class="ev-card-location">📍 ${esc(e.place)}${e.venue?` · <span class="mute sm">${esc(e.venue)}</span>`:''}</div>
      </div>
    </div>
    <div class="ev-card-footer">
      <div class="row" style="gap:6px">
        ${stack(ord(e.goers))}
        <span class="mute sm">${attendeeCount?`${attendeeCount} ${attendeeCount===1?'going':'going'}`:'Be the first to join'}</span>
      </div>
      <div class="ev-card-badge-wrap">
        <span class="ev-ticket-badge">🎟️ Tickets</span>
        ${cancelled||past||`<button class="imin-btn ${on?'on':''}" onclick="event.stopPropagation();imin('${e.id}',this)">${iminHTML(on)}</button>`}
      </div>
    </div>
  </div>`;
}

// Fullscreen Event View
function openEvent(id){
  const e=S.evm.get(id);if(!e)return;
  S.evActiveId=id;
  S.evTab='about';
  $('#ev-top-title').textContent=e.title;
  $('#ev-ov').classList.add('on');
  renderEventFullscreen();
  loadEventComments(id);
  loadEventChat(id);
  loadEventGallery(id);
  evLive(id);
}

function closeEventView(){
  $('#ev-ov').classList.remove('on');
  S.evActiveId=null;evLiveStop();
}

function setEvTab(tab){
  S.evTab=tab;
  if(tab==='chat'&&S.evActiveId)S.evUnread.delete(S.evActiveId);
  renderEventFullscreen();
}

// Keep what someone is typing when a box is redrawn (events finish loading, a new chat message arrives, the app comes back).
function keepInputs(root,ctx){
  if(!root)return null;
  const same=root.dataset.kctx===String(ctx);root.dataset.kctx=String(ctx);
  if(!same)return null;
  const a=document.activeElement,items=[];
  root.querySelectorAll('input[id],textarea[id]').forEach(el=>{
    if(el.type==='file'||el.type==='checkbox'||el.type==='radio')return;
    items.push({id:el.id,v:el.value,f:el===a,s:el.selectionStart,e:el.selectionEnd});
  });
  return{root,items};
}
function restoreInputs(k){
  if(!k)return;
  k.items.forEach(x=>{
    const el=k.root.querySelector('#'+x.id);if(!el)return;
    if(x.v&&!el.value)el.value=x.v;
    if(x.f){try{el.focus({preventScroll:true});if(x.s!=null)el.setSelectionRange(x.s,x.e)}catch(e){}}
  });
}
function renderEventFullscreen(){
  const id=S.evActiveId;if(!id)return;
  const e=S.evm.get(id);if(!e)return;
  const me=S.user.id;
  const host=e.organizer_id==me;
  const on=e.goers.includes(me);
  const gone=!!e.cancelled_at;
  const past=!!e.past||new Date(e.starts_at)<Date.now()-3*36e5;

  const cal='<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>';
  const pin='<svg viewBox="0 0 24 24"><path d="M12 22s7-6.5 7-13a7 7 0 0 0-14 0c0 6.5 7 13 7 13z"/><circle cx="12" cy="9" r="2.5"/></svg>';
  const usr='<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></svg>';
  const chats=S.evChats.get(id)||[];
  const comments=S.eventComments.get(id)||[];
  const photos=S.evGallery.get(id)||[];

  let tabBody='';
  if(S.evTab==='about'){
    tabBody=`<div class="ev-tab-content">
      <div class="ev-section-title">ABOUT THIS EVENT</div>
      <p class="ev-desc-box">${e.description?esc(e.description):'<span class="mute">No description was added for this event.</span>'}</p>
      
      <div class="ev-section-title">WHO'S GOING (${e.goers.length})</div>
      <div class="row" style="flex-wrap:wrap;gap:8px;margin-bottom:20px">
        ${e.goers.length?e.goers.map(u=>`<div class="tapc" onclick="openProfile('${u}')" style="display:flex;align-items:center;gap:6px;background:var(--card);border:1px solid var(--line);padding:6px 12px;border-radius:50px">${av(u,'sm')}<span style="font-weight:700;font-size:13px">${esc(u==me?'You':nm(u))}</span></div>`).join(''):'<div class="mute sm">No attendees yet. Be the first to join!</div>'}
      </div>
      ${host||isMod()?`<div class="evact" style="margin-top:24px">${host&&!gone&&!past&&canManageEvents()?`<button class="btn off" onclick="openEv('${e.id}')">Edit Event</button>`:''}${!gone&&!past?`<button class="btn off" onclick="cancelEv('${e.id}')">Cancel Event</button>`:''}${host?`<button class="btn off danger" onclick="delEv('${e.id}')">Delete Event</button>`:''}</div>`:''}
    </div>`;
  } else if(S.evTab==='chat'){
    if(S.evChatErr.get(id)){
      tabBody=`<div class="ev-tab-content"><div class="empty"><b>Chat isn't available</b><div class="sm">${esc(S.evChatErr.get(id))}</div></div></div>`;
    }else if(!canEvChat(id)){
      tabBody=`<div class="ev-tab-content"><div class="empty"><b>Chat is for people who are going</b><div class="sm">${gone||past?'This event is no longer open for new people.':"Tap I'm in on this event to join the conversation."}</div></div></div>`;
    }else{
      tabBody=`<div class="ev-tab-content ev-chat-container">
      <div class="ev-chat-messages" id="ev-chat-list">${evChatRows(id)}</div>
      <div class="ev-chat-input-bar">
        <input id="ev-chat-in" maxlength="400" placeholder="Chat with attendees..." aria-label="Event chat input" onkeydown="if(event.key==='Enter')sendEventChat('${id}')">
        <button class="btn" onclick="sendEventChat('${id}')">Send</button>
      </div>
    </div>`;
    }
  } else if(S.evTab==='comments'){
    const rows=comments.filter(c=>!S.blocked.has(c.user_id)).map(c=>`<div class="event-comment">${av(c.user_id,'sm')}<div class="grow"><div class="row" style="justify-content:space-between"><b>${esc(nm(c.user_id))}</b><span class="mute sm">${ago(c.created_at)}</span></div><div>${rich(c.body,1)}</div>${c.user_id==me||isMod()?`<button class="link sm danger" style="width:auto;padding:2px 0;text-align:left" onclick="delEventComment('${id}','${c.id}')">Delete</button>`:''}</div></div>`).join('')||'<div class="mute sm" style="text-align:center;padding:20px">No comments yet. Share your thoughts below!</div>';
    tabBody=`<div class="ev-tab-content">
      <div class="event-comment-list">${rows}</div>
      <div class="event-comment-form">
        <input id="ecin" maxlength="500" placeholder="Write a comment or question..." aria-label="Comment" onkeydown="if(event.key==='Enter')sendEventComment('${id}')">
        <button class="btn" onclick="sendEventComment('${id}')">Post</button>
      </div>
    </div>`;
  } else if(S.evTab==='gallery'){
    tabBody=`<div class="ev-tab-content">
      <div class="ev-gallery-header">
        <div><b>Event Photos &amp; Highlights</b> <span class="mute sm">(${photos.length})</span></div>
        ${host||isMod()?`<button class="btn sbtn media-action" onclick="$('#ev-pic-in').click()">${UI_ICONS.camera}<span>Add Photo</span></button>`:''}
      </div>
      <input type="file" id="ev-pic-in" accept="image/*" hidden onchange="uploadEventGallery(this,'${id}')">
      <div class="ev-gallery-grid">
        ${photos.map(ph=>`<div class="ev-gallery-item"><img src="${esc(thumb(ph.url))}" data-full="${esc(ph.url)}" alt="Event Photo" loading="lazy" decoding="async"${thumb(ph.url)!==ph.url?` onerror="this.onerror=null;this.src=this.dataset.full"`:''}>${host||isMod()?`<button class="ev-gallery-del" aria-label="Remove photo" onclick="event.stopPropagation();delGalleryPhoto('${id}','${ph.id}')">✕</button>`:''}</div>`).join('')}
        ${!photos.length&&!host?'<div class="empty" style="grid-column:1/-1">No photos uploaded to this event gallery yet.</div>':''}
        ${host?`<div class="ev-gallery-uploader" onclick="$('#ev-pic-in').click()">${UI_ICONS.camera}<span>Add Photos</span></div>`:''}
      </div>
    </div>`;
  }

  const evKeep=keepInputs($('#ev-view-body'),id);
  $('#ev-view-body').innerHTML=`
    <div class="ev-full-hero">
      <div class="ev-full-emoji-badge">${esc(e.emoji||'📍')}</div>
      <span class="date" style="margin-bottom:8px">${evd(e.starts_at)}</span>
      <h1 class="ev-full-title">${esc(e.title)}</h1>
      ${gone?'<div class="evcx">This event was cancelled.</div>':past?'<div class="evcx soft">This event has passed.</div>':''}
      <div class="ev-full-metas">
        <div class="ev-meta-row">${pin}<span>${esc(e.place)}${e.venue?`<br><small>${esc(e.venue)}</small>`:''}</span></div>
        <div class="ev-meta-row">${usr}<span>Hosted by <b class="lk" onclick="openProfile('${e.organizer_id}')">${esc(host?'you':nm(e.organizer_id))}${rb(e.organizer_id)}</b></span></div>
      </div>
      <div class="ev-action-bar">
        <button class="btn ticket-btn" onclick="openTickets('${e.id}')">🎟️ Buy Tickets</button>
        ${gone||past?'':`<button class="imin-btn imin-full ${on?'on':''}" onclick="imin('${e.id}',this)">${iminHTML(on)}</button>`}
      </div>
    </div>
    
    <div class="ev-nav-tabs">
      <button class="ev-tab-btn ${S.evTab==='about'?'on':''}" onclick="setEvTab('about')">About</button>
      <button class="ev-tab-btn ${S.evTab==='chat'?'on':''}" id="ev-tab-chat" onclick="setEvTab('chat')">${evChatLabel(id)}</button>
      <button class="ev-tab-btn ${S.evTab==='comments'?'on':''}" onclick="setEvTab('comments')">Comments${comments.length?` (${comments.length})`:''}</button>
      <button class="ev-tab-btn ${S.evTab==='gallery'?'on':''}" onclick="setEvTab('gallery')">Gallery${photos.length?` (${photos.length})`:''}</button>
    </div>
    
    ${tabBody}
  `;
  restoreInputs(evKeep);evDraftFill(id);
  if(S.evTab==='chat'){const sc=$('#ev-chat-list');if(sc)sc.scrollTop=sc.scrollHeight}
}

// ---------- Event chat + gallery (shared through Supabase, live) ----------
const evLiveError=e=>e&&(e.code==='PGRST205'||/event_messages|event_photos|relation .*does not exist/i.test(e.message||''))
  ?'Event chat and gallery need database setup. Run event-live.sql in Supabase first.'
  :errMsg(e);
const canEvChat=id=>{const e=S.evm.get(id);return !!e&&(e.organizer_id==S.user.id||e.goers.includes(S.user.id)||isMod())};
const evOpen=id=>S.evActiveId===id&&$('#ev-ov').classList.contains('on');
const evChatLabel=id=>{const n=S.evUnread.get(id)||0,c=(S.evChats.get(id)||[]).length;return 'Live Chat'+(n?' · '+n+' new':c?' ('+c+')':'')};
function evChatRows(id){
  const me=S.user.id,list=(S.evChats.get(id)||[]).filter(m=>!S.blocked.has(m.user_id));
  return list.length
    ?list.map(m=>`<div class="ev-chat-msg ${m.user_id===me?'me':''}">${m.user_id!==me?av(m.user_id,'sm'):''}<div class="ev-chat-bubble">${m.user_id!==me?`<span class="ev-chat-author" style="color:${ac(m.user_id)}">${esc(nm(m.user_id))}${rb(m.user_id)}</span>`:''}${rich(m.body,1)}<span class="ev-chat-time">${tm(m.created_at)}</span></div></div>`).join('')
    :`<div class="empty" style="margin:auto"><b>No messages in event chat yet</b><div class="sm">Say hi to everyone attending!</div></div>`;
}
// Updates only the message list, so a message arriving never wipes what you are typing.
function paintEvChat(id,stick){
  if(!evOpen(id)||S.evTab!=='chat')return;
  const el=$('#ev-chat-list');if(!el)return;
  const near=stick||el.scrollHeight-el.scrollTop-el.clientHeight<80;
  el.innerHTML=evChatRows(id);
  if(near)el.scrollTop=el.scrollHeight;
}
async function loadEventChat(id){
  S.evChatErr.delete(id);
  if(!canEvChat(id)){S.evChats.set(id,[]);if(evOpen(id)&&S.evTab==='chat')renderEventFullscreen();return}
  const r=await sb.from('event_messages').select('id,event_id,user_id,body,created_at').eq('event_id',id).order('created_at',{ascending:false}).limit(100);
  if(r.error){S.evChats.set(id,[]);S.evChatErr.set(id,evLiveError(r.error));if(evOpen(id))renderEventFullscreen();return}
  const rows=(r.data||[]).reverse();
  await getProfiles(rows.map(m=>m.user_id));
  S.evChats.set(id,rows);
  if(!evOpen(id))return;
  if(S.evTab==='chat'&&$('#ev-chat-list'))paintEvChat(id,true);else renderEventFullscreen();
}
async function sendEventChat(id){
  const inEl=$('#ev-chat-in'),text=inEl?.value.trim();
  if(!text||!id||inEl.disabled)return;
  if(muted())return;
  if(!canEvChat(id)){toast("Tap I'm in to join the chat");return}
  inEl.disabled=true;
  const r=await sb.from('event_messages').insert({event_id:id,user_id:S.user.id,body:text}).select('id,event_id,user_id,body,created_at').single();
  inEl.disabled=false;
  if(r.error){toast(evLiveError(r.error));inEl.focus();return}   // your text stays in the box
  inEl.value='';cdSet('ev:'+id,'');
  const list=S.evChats.get(id)||[];
  if(!list.some(x=>x.id===r.data.id))list.push(r.data);
  S.evChats.set(id,list);
  paintEvChat(id,true);inEl.focus();
}
async function loadEventGallery(id){
  const r=await sb.from('event_photos').select('id,event_id,user_id,url,created_at').eq('event_id',id).order('created_at').limit(200);
  if(r.error){S.evGallery.set(id,[]);if(evLiveError(r.error).includes('setup'))toast(evLiveError(r.error));return}
  S.evGallery.set(id,r.data||[]);
  if(evOpen(id)&&S.evTab==='gallery')renderEventFullscreen();
}
async function uploadEventGallery(input,id){
  const file=input.files?.[0];input.value='';if(!file||!id)return;
  if(file.size>25*1024*1024){toast('Photo is too big (25 MB max)');return}
  toast('Uploading gallery photo...');
  let url=null;
  try{
    const blob=await prep(file,1600,false),tb=await prep(blob,THUMB_MAX,false);
    url=await upload('post-images',blob,tb);
    const r=await sb.from('event_photos').insert({event_id:id,user_id:S.user.id,url}).select('id,event_id,user_id,url,created_at').single();
    if(r.error)throw r.error;
    const list=S.evGallery.get(id)||[];
    if(!list.some(x=>x.id===r.data.id))list.push(r.data);
    S.evGallery.set(id,list);
    if(evOpen(id))renderEventFullscreen();
    toast('Photo added to event gallery!');
  }catch(e){
    if(url)rmFiles('post-images',[url]).catch(()=>{});   // don't leave an orphan file behind
    toast(e.message&&!e.code?e.message:evLiveError(e));
  }
}
function delGalleryPhoto(id,pid){
  confirmBox('Remove this photo from event gallery?','Remove',async()=>{
    const list=S.evGallery.get(id)||[],ph=list.find(x=>x.id===pid);
    const r=await sb.from('event_photos').delete().eq('id',pid).select('id');
    if(r.error){toast(evLiveError(r.error));return}
    if(!r.data?.length){toast("Couldn't remove that photo");return}
    S.evGallery.set(id,list.filter(x=>x.id!==pid));
    if(ph)rmFiles('post-images',[ph.url]).catch(()=>{});
    if(evOpen(id))renderEventFullscreen();
    toast('Photo removed');
  });
}
// Live updates while an event is open: new chat messages and gallery photos appear on every phone.
function evLive(id){
  if(S.evCh&&S.evChId===id)return;
  evLiveStop();S.evChId=id;
  S.evCh=sb.channel('evlive-'+id+'-'+Date.now())
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'event_messages',filter:'event_id=eq.'+id},p=>onEvMsg(p.new))
    .on('postgres_changes',{event:'DELETE',schema:'public',table:'event_messages'},p=>onEvMsgDel(p.old))
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'event_photos',filter:'event_id=eq.'+id},p=>onEvPhoto(p.new))
    .on('postgres_changes',{event:'DELETE',schema:'public',table:'event_photos'},p=>onEvPhotoDel(p.old))
    .subscribe();
}
function evLiveStop(){
  if(S.evCh){try{sb.removeChannel(S.evCh)}catch(x){}}
  S.evCh=null;S.evChId=null;
}
async function onEvMsg(m){
  if(!m||S.blocked.has(m.user_id))return;
  const id=m.event_id;
  if((S.evChats.get(id)||[]).some(x=>x.id===m.id))return;
  await getProfiles([m.user_id]);
  const list=S.evChats.get(id)||[];
  if(list.some(x=>x.id===m.id))return;
  list.push(m);S.evChats.set(id,list);
  if(m.user_id!==S.user.id&&!(evOpen(id)&&S.evTab==='chat')){
    S.evUnread.set(id,(S.evUnread.get(id)||0)+1);
    const b=$('#ev-tab-chat');if(b)b.textContent=evChatLabel(id);
  }
  paintEvChat(id);
}
function onEvMsgDel(old){
  if(!old||!old.id)return;
  S.evChats.forEach((list,id)=>{const i=list.findIndex(x=>x.id===old.id);if(i>=0){list.splice(i,1);paintEvChat(id)}});
}
function onEvPhoto(p){
  if(!p)return;
  const list=S.evGallery.get(p.event_id)||[];
  if(list.some(x=>x.id===p.id))return;
  list.push(p);S.evGallery.set(p.event_id,list);
  if(evOpen(p.event_id)&&S.evTab==='gallery')renderEventFullscreen();
}
function onEvPhotoDel(old){
  if(!old||!old.id)return;
  S.evGallery.forEach((list,id)=>{const i=list.findIndex(x=>x.id===old.id);if(i>=0){list.splice(i,1);if(evOpen(id)&&S.evTab==='gallery')renderEventFullscreen()}});
}
// Coming back to the app (phone woke up): catch up on anything missed while the connection was asleep.
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState!=='visible'||!S.user||!S.evActiveId||!evOpen(S.evActiveId))return;
  const id=S.evActiveId;evLiveStop();evLive(id);loadEventChat(id);loadEventGallery(id);
});
try{Object.keys(localStorage).filter(k=>k.startsWith('il-evchat-')||k.startsWith('il-evgal-')).forEach(k=>localStorage.removeItem(k))}catch(x){}

async function loadEventComments(id){
  const r=await sb.from('event_comments').select('id,event_id,user_id,body,created_at').eq('event_id',id).order('created_at').limit(100);
  if(r.error){S.eventComments.set(id,[]);toast(eventCommentsError(r.error));return}
  await getProfiles((r.data||[]).map(c=>c.user_id));
  S.eventComments.set(id,r.data||[]);
  if(S.evActiveId===id&&$('#ev-ov').classList.contains('on'))renderEventFullscreen();
}

async function sendEventComment(id){
  const input=$('#ecin'),body=input?.value.trim();
  if(!body||input.disabled)return;
  if(muted())return;
  input.disabled=true;
  const r=await sb.from('event_comments').insert({event_id:id,user_id:S.user.id,body}).select().single();
  input.disabled=false;
  if(r.error){toast(eventCommentsError(r.error));input.focus();return}
  input.value='';cdSet('ec:'+id,'');   // sent: empty the box before the list redraws
  const comments=S.eventComments.get(id)||[];comments.push(r.data);S.eventComments.set(id,comments);
  if(S.evActiveId===id&&$('#ev-ov').classList.contains('on'))renderEventFullscreen();
}

function delEventComment(eid,cid){
  confirmBox('Delete this comment?','Delete',async()=>{
    const r=await sb.from('event_comments').delete().eq('id',cid).select('id');
    if(r.error){toast(errMsg(r.error));return}
    if(!r.data?.length){toast("Couldn't delete that comment");return}
    S.eventComments.set(eid,(S.eventComments.get(eid)||[]).filter(c=>c.id!==cid));
    if(S.evActiveId===eid&&$('#ev-ov').classList.contains('on'))renderEventFullscreen();
    toast('Comment deleted');
  });
}

function openGoers(id){const e=S.evm.get(id);if(e)peopleSheet('Going ('+e.goers.length+')',ord(e.goers))}

function paintEv(e){
  const on=e.goers.includes(S.user.id);
  document.querySelectorAll(`[data-evb="${e.id}"]`).forEach(b=>{b.className='imin-btn'+(b.classList.contains('imin-full')?' imin-full':'')+(on?' on':'');b.innerHTML=iminHTML(on)});
}

async function imin(id,btn){
  const e=S.evm.get(id),u=S.user.id;if(!e||e.organizer_id==u||e.cancelled_at||e.past)return;
  const on=!e.goers.includes(u);
  const set=v=>{e.goers=v?[...e.goers,u]:e.goers.filter(x=>x!==u);paintEv(e)};
  set(on);if(btn){btn.style.transform='scale(.88)';setTimeout(()=>btn.style.transform='',180)}
  const r=on?await sb.from('event_goers').insert({event_id:id,user_id:u}):await sb.from('event_goers').delete().match({event_id:id,user_id:u});
  if(r.error){set(!on);toast("Couldn't save that");return}
  if(on)checkAch();
  if(S.evActiveId===id&&$('#ev-ov').classList.contains('on')){S.evChats.delete(id);renderEventFullscreen();loadEventChat(id)}
}

function drawEvEm(){
  $('#evEm').innerHTML=[...new Set([S.evEm,...EVEM])].map(x=>`<button type="button" class="${x==S.evEm?'on':''}" onclick="S.evEm='${x}';drawEvEm()">${x}</button>`).join('');
}

function openEv(id){
  if(!canManageEvents()){toast('Only admins, moderators, and approved event publishers can create events');return}
  const e=id?S.evm.get(id):null;
  if(id&&!e)return;
  S.evId=e?e.id:null;S.evEm=e?e.emoji:'📍';drawEvEm();
  $('#evHead').textContent=e?'Edit event':'Create event';
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
  if(!canManageEvents()){err.textContent='You are not allowed to publish events.';return}
  if(!title){err.textContent='Give your plan a name.';return}
  if(!w){err.textContent='Pick a date and time.';return}
  const when=new Date(w);
  if(isNaN(when)){err.textContent='That date does not look right.';return}
  if(!S.evId&&when<Date.now()){err.textContent='Pick a time in the future.';return}
  if(!place){err.textContent='Where is it happening?';return}
  const vals={title,emoji:S.evEm,starts_at:when.toISOString(),place,venue:venue||null,description:desc||null};
  const b=$('#evSave');b.disabled=true;
  let r;
  if(S.evId)r=await sb.from('events').update(vals).eq('id',S.evId).eq('organizer_id',S.user.id).select('id');
  else r=await sb.from('events').insert({...vals,organizer_id:S.user.id}).select('id');
  b.disabled=false;
  if(r.error){err.textContent=errMsg(r.error);return}
  if(!r.data?.length){err.textContent="That event could not be saved. You may not be allowed to edit it.";return}
  const wasNew=!S.evId;
  $('#ev').classList.remove('on');
  await loadEvents();draw();toast(wasNew?'Event published':'Event updated');
  if(wasNew)checkAch();
}

function cancelEv(id){
  confirmBox('Cancel this event? It stays listed as cancelled so people who joined can see it.','Yes, cancel it',async()=>{
    const{error}=await sb.rpc('cancel_event',{ev:id});
    if(error){toast(errMsg(error));return}
    closeEventView();await loadEvents();draw();toast('Event cancelled');
  });
}

async function loadPast(){
  const since=new Date(Date.now()-3*36e5).toISOString();
  const r=await sb.from('events').select(EVCOLS).lt('starts_at',since).order('starts_at',{ascending:false}).limit(20);
  if(r.error){toast('Could not load past events');S.pev=[];return}
  await getProfiles(r.data.map(e=>e.organizer_id));
  S.pev=r.data.map(e=>({...e,past:true,goers:[]}));
  S.pev.forEach(e=>S.evm.set(e.id,e));
}

async function togglePast(){S.pevOpen=!S.pevOpen;if(S.pevOpen)S.pev=null;pastDraw();if(S.pevOpen){await loadPast();pastDraw()}}
function pastDraw(){
  const el=$('#pevs');if(!el)return;
  el.innerHTML=`<button class="link pastbtn" onclick="togglePast()">${S.pevOpen?'Hide past events':'Show past events'}</button>`+(S.pevOpen?(S.pev==null?'<div class="mute sm" style="padding:8px 4px">Loading...</div>':S.pev.length?S.pev.map(eventCard).join(''):'<div class="mute sm" style="padding:8px 4px">No past events yet.</div>'):'');
}

function delEv(id){
  confirmBox('Delete this event?','Delete',async()=>{
    const{data,error}=await sb.from('events').delete().eq('id',id).eq('organizer_id',S.user.id).select('id');
    if(error){toast(errMsg(error));return}
    if(!data?.length){toast("Couldn't delete that event");return}
    closeEventView();S.evm.delete(id);
    await loadEvents();draw();toast('Event deleted');
  });
}
