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

// ---------- Push Notifications ----------
const pushOK=()=>!!VAPID_PUBLIC&&'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window;
const NP_KEYS=[['messages','Messages'],['same','Likes'],['replies','Replies'],['follows','New followers']];
const b64u=s=>{const p='='.repeat((4-s.length%4)%4),r=atob((s+p).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from([...r].map(c=>c.charCodeAt(0)))};
async function pushSub(create){
  const reg=await navigator.serviceWorker.ready;
  let sub=await reg.pushManager.getSubscription();
  if(!sub&&create)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64u(VAPID_PUBLIC)});
  return sub;
}
async function pushSave(sub){
  const j=sub.toJSON();
  const r=await sb.rpc('register_push',{p_endpoint:j.endpoint,p_p256dh:j.keys.p256dh,p_auth:j.keys.auth});
  return !r.error;
}
async function pushSync(){
  try{
    if(!pushOK()||Notification.permission!=='granted'||localStorage.getItem('il-push')!=='1')return;
    const sub=await pushSub(true);if(sub)await pushSave(sub);
  }catch(e){}
}
async function pushDrop(){
  if(!pushOK())return;
  try{const sub=await pushSub(false);if(sub){await sb.rpc('unregister_push',{p_endpoint:sub.endpoint});await sub.unsubscribe()}}catch(e){}
  try{localStorage.removeItem('il-push')}catch(e){}
}
async function enablePush(){
  if(!pushOK()){toast(isIOS&&!standalone()?'Add iLike to your Home Screen first':'Notifications are not supported here');return}
  try{
    const perm=await Notification.requestPermission();
    if(perm!=='granted'){toast(perm=='denied'?'Notifications are blocked for iLike':'Notifications stay off');paintPush();return}
    const sub=await pushSub(true);
    if(!sub||!(await pushSave(sub))){toast("Couldn't turn notifications on");return}
    localStorage.setItem('il-push','1');toast('Notifications are on');
  }catch(e){toast("Couldn't turn notifications on")}
  paintPush();
}
async function disablePush(){await pushDrop();toast('Notifications are off');paintPush()}
async function togglePref(k){
  const np=S.np||(S.np={messages:true,same:true,replies:true,follows:true});
  np[k]=!np[k];paintPush();
  const r=await sb.from('notification_prefs').upsert({user_id:S.user.id,...np});
  if(r.error){np[k]=!np[k];paintPush();toast("Couldn't save that")}
}
async function paintPush(){
  const hd=$('#pushhd'),bx=$('#pushbox');if(!hd||!bx)return;
  hd.hidden=bx.hidden=!VAPID_PUBLIC;if(!VAPID_PUBLIC)return;
  if(!pushOK()){bx.innerHTML=`<p class="mute sm" style="margin:0 4px 10px">${isIOS&&!standalone()?'On iPhone, add iLike to your Home Screen (see Install above), then open it from there to turn on notifications.':'This browser does not support notifications.'}</p>`;return}
  let sub=null;try{sub=await pushSub(false)}catch(e){}
  const perm=Notification.permission,on=perm=='granted'&&!!sub;
  if(!S.np){const r=await sb.from('notification_prefs').select('messages,same,replies,follows').eq('user_id',S.user.id).maybeSingle();S.np=Object.assign({messages:true,same:true,replies:true,follows:true},r.data||{})}
  bx.innerHTML=(perm=='denied'?'<p class="mute sm" style="margin:0 4px 10px">Notifications are blocked. Turn them on for iLike in your phone settings, then come back.</p>':on
    ?`<button class="btn off wide" onclick="disablePush()">Turn off on this phone</button><p class="lab">Tell me about</p><div class="row" style="flex-wrap:wrap;gap:6px">${NP_KEYS.map(([k,t])=>`<button class="fc ${S.np[k]?'on':''}" onclick="togglePref('${k}')">${t}</button>`).join('')}</div>`
     :`<button class="btn off wide set-action" onclick="enablePush()"><span class="set-action-icon">${UI_ICONS.bell}</span><span>Turn on notifications</span></button><p class="mute sm" style="margin:6px 4px 10px">Get a ping for messages, likes, replies and new followers. This applies to this phone only.</p>`);
}
if('serviceWorker' in navigator)navigator.serviceWorker.addEventListener('message',e=>{
  if(!e.data||e.data.type!=='open'||!S.loaded)return;
  const u=String(e.data.url||'');
  const p=u.match(/#post=([0-9a-f-]{36})/i),d=u.match(/#dm=([0-9a-f-]{36})/i),ev=u.match(/#event=([0-9a-f-]{36})/i);
  if(p)openPostId(p[1]);else if(d)openDm(d[1]);else if(ev)openEvent(ev[1]);
});
function togglePw(force){
  const box=$('#pwbox'),t=$('#pwtog');if(!box)return;
  const open=typeof force==='boolean'?force:box.hidden;
  box.hidden=!open;t?.setAttribute('aria-expanded',open?'true':'false');
  if(open)setTimeout(()=>$('#npw')?.focus(),50);
}
function openSet(){
  const av0=$('#appver');if(av0)av0.textContent='iLike '+APP_VERSION;
  $('#setem').textContent=S.user?.email||'';$('#npw').value='';$('#npe').textContent='';togglePw(false);
  paintCustomize();refreshInstall();paintPush();paintRepBadge();if(isMod())loadRepCount();$('#set').classList.add('on');
}
async function changePw(){
  const v=$('#npw').value,e=$('#npe');e.textContent='';
  if(v.length<8){e.textContent='Use 8 or more characters.';return}
  const{error}=await sb.auth.updateUser({password:v});
  if(error){e.textContent=error.message;return}
  $('#npw').value='';togglePw(false);toast('Password changed');
}
function recoverUi(){
  S.rec=false;history.replaceState(null,'',location.pathname);
  openSet();togglePw(true);toast('Choose a new password');
}
const THEME_ICO={
  auto:'<circle cx="12" cy="12" r="9"/><path d="M12 3v18a9 9 0 0 0 0-18z" fill="currentColor"/>',
  light:'<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2 12h2.5M19.5 12H22M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>',
  dark:'<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'
};
$('#thm').innerHTML=THEMES.map(t=>`<button class="fc th" onclick="setTheme('${t[0]}')"><svg class="ti" viewBox="0 0 24 24" aria-hidden="true">${THEME_ICO[t[0]]}</svg>${t[1]}</button>`).join('');
$('#sws').innerHTML=ACCENTS.map((a,i)=>`<button class="sw" style="background:${a.mono?'#0a0a0a':`linear-gradient(135deg,hsl(${a.h} 83% 58%),hsl(${a.h2} 84% 61%))`}" onclick="accent(${i})" aria-label="${a.n}"></button>`).join('');
$('#fcs').innerHTML=FONTS.map((f,i)=>`<button class="fc" style="font-family:${f.f}" onclick="fnt(${i})">${f.n}</button>`).join('');

// ---------- Realtime Subscriptions ----------
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
  const set=(id,v)=>{const e=$(id);if(e){e.hidden=!v;e.textContent=v>9?'9+':v}};
  set('#chb',m);set('#nb',n);
}
let hiddenAt=0;
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){hiddenAt=Date.now();return}
  if(S.user&&S.loaded&&Date.now()-hiddenAt>10000){loadMsgs();loadNotifs();checkAch();syncStatus()}
});
