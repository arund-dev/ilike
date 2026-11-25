// ---------- Direct Messages ----------
let conv=false,ctab=0;
// Chats open with only the latest messages; older ones load as you scroll up
const MSG_PAGE=30,MSG_WIN=300,MCOLS='id,sender_id,to_user,body,created_at,edited_at,read_at',CCOLS='id,sender_id,body,created_at,edited_at';
let dmTop='',dmMore=true,msgsFull=null,cmMore=true,olderBusy=false;
async function loadMsgs(){
  const r=await sb.from('messages').select(MCOLS).order('created_at',{ascending:false}).limit(MSG_WIN);
  if(r.error)return;
  const rows=r.data.reverse();msgsFull=rows.length>=MSG_WIN;
  const keep=msgsFull?S.msgs.filter(m=>m.created_at<rows[0].created_at):[];   // keep older pages already scrolled in
  S.msgs=[...keep,...rows].filter(m=>!bl(m.sender_id==S.user.id?m.to_user:m.sender_id));updateBadges();
  if($('#ov')?.classList.contains('on')){conv&&S.dm?drawDm():(!conv&&openChats())}
}
const convoOf=id=>S.msgs.filter(m=>(m.sender_id==id&&m.to_user==S.user.id)||(m.sender_id==S.user.id&&m.to_user==id));
function leaveRoom(){
  if(S.cch){sb.removeChannel(S.cch);S.cch=null}
  S.room=null;S.cm=null;resetEdit();
}
function closeOv(){$('#ov')?.classList.remove('on');leaveRoom();conv=false;S.dm=null}
function setBar(){
  const room=S.room!=null,can=!room||S.mine.has(S.room);
  $('#inp').style.display=can?'':'none';$('#jbar').style.display=can?'none':'flex';
  $('#mi').placeholder=room?'Message the circle...':'Say something nice...';
  if(room&&!can)$('#jtx').textContent='Join '+iname(S.room)+' to chat here.';
  drawStrip();syncSend();failSync();
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
  $('#ct').textContent=nm(id);
  const l=convoOf(id);dmTop=l.length>MSG_PAGE?l[l.length-MSG_PAGE].created_at:'';dmMore=msgsFull!==false;olderBusy=false;
  drawDm(1);markRead(id);
}
function drawDm(snap,keep){
  const el=$('#msgs'),near=nearEnd(el),all=convoOf(S.dm),l=all.filter(m=>m.created_at>=dmTop),me=S.user.id;
  let seen=null;
  for(let i=all.length-1;i>=0;i--){if(all[i].sender_id==me){if(all[i].read_at)seen=all[i].id;break}}
  el.innerHTML=l.length
    ?l.map(m=>{const mine=m.sender_id==me;return `<div class="b ${mine?'me':''}">${esc(m.body)}<small class="t ${mine?'f':''}"><span>${tm(m.created_at)}${m.edited_at?' · edited':''}${m.id===seen?' · Seen':''}</span>${mine?moreBtn('dm',m.id):''}</small></div>`}).join('')
    :`<div class="empty" style="margin:auto"><div style="font-size:44px;margin-bottom:8px">👋</div><b>Say hi to ${esc(nm(S.dm))}</b></div>`;
  if(keep){el.scrollTop=el.scrollHeight-keep.h+keep.t;mcount=l.length;return}   // older page added on top: stay where you were
  settle(el,near,snap,l.length,!l.length||l[l.length-1].sender_id==me);
}
let mcount=0;
const nearEnd=el=>el.scrollHeight-el.scrollTop-el.clientHeight<140;
function settle(el,near,snap,n,lastMine){
  if(snap||near){el.scrollTop=1e5;$('#jump').hidden=true}
  else if(n>mcount&&!lastMine)$('#jump').hidden=false;
  mcount=n;
}
function jumpNew(){const el=$('#msgs');el.scrollTo({top:el.scrollHeight,behavior:'smooth'});$('#jump').hidden=true}
$('#msgs')?.addEventListener('scroll',()=>{
  const el=$('#msgs');
  if(nearEnd(el))$('#jump').hidden=true;
  if(conv&&el.scrollTop<80&&el.scrollHeight>el.clientHeight+80)S.dm!=null?olderDm():S.room!=null&&olderCircle();
},{passive:true});
async function olderDm(){
  if(olderBusy)return;
  const id=S.dm,el=$('#msgs'),me=S.user.id,l=convoOf(id),hid=l.filter(m=>m.created_at<dmTop);
  if(hid.length){   // already in memory: just show the next page
    dmTop=hid.length>MSG_PAGE?hid[hid.length-MSG_PAGE].created_at:'';
    drawDm(0,{h:el.scrollHeight,t:el.scrollTop});return;
  }
  if(!dmMore||!l.length)return;
  olderBusy=true;
  try{
    const r=await sb.from('messages').select(MCOLS).or(`and(sender_id.eq.${me},to_user.eq.${id}),and(sender_id.eq.${id},to_user.eq.${me})`).lt('created_at',l[0].created_at).order('created_at',{ascending:false}).limit(MSG_PAGE);
    if(S.dm!==id||r.error)return;
    if(r.data.length<MSG_PAGE)dmMore=false;
    if(!r.data.length)return;
    const have=new Set(S.msgs.map(m=>m.id));
    S.msgs=S.msgs.concat(r.data.filter(m=>!have.has(m.id))).sort((a,b)=>a.created_at<b.created_at?-1:a.created_at>b.created_at?1:0);
    dmTop=r.data[r.data.length-1].created_at;
    drawDm(0,{h:el.scrollHeight,t:el.scrollTop});
  }finally{olderBusy=false}
}
async function olderCircle(){
  const k=S.room;
  if(olderBusy||!cmMore||!S.cm||!S.cm.length)return;
  olderBusy=true;
  try{
    const r=await sb.from('circle_messages').select(CCOLS).eq('interest_id',k).lt('created_at',S.cm[0].created_at).order('created_at',{ascending:false}).limit(MSG_PAGE);
    if(S.room!==k||r.error)return;
    if(r.data.length<MSG_PAGE)cmMore=false;
    const rows=r.data.reverse().filter(m=>!bl(m.sender_id));
    await getProfiles(rows.map(m=>m.sender_id));
    if(S.room!==k)return;
    const have=new Set(S.cm.map(m=>m.id)),el=$('#msgs');
    S.cm=[...rows.filter(m=>!have.has(m.id)),...S.cm];
    drawCircle(0,{h:el.scrollHeight,t:el.scrollTop});
  }finally{olderBusy=false}
}
function syncSend(){
  const v=$('#mi').value;
  $('#sbtn').disabled=!v.trim();
  const c=$('#mcnt');c.hidden=v.length<400;c.textContent=v.length+'/500';
}
const moreBtn=(k,id)=>`<button class="mmore" onclick="event.stopPropagation();msgMenu('${k}','${id}')" aria-label="Message options">⋯</button>`;
let mmSel=null;
const msgTable=k=>k=='dm'?'messages':'circle_messages';
const getMsg=s=>s&&(s.k=='dm'?S.msgs:(S.cm||[])).find(x=>String(x.id)===String(s.id));
function msgMenu(k,id){
  mmSel={k,id};const m=getMsg(mmSel);
  $('#mmEdit').style.display=m&&m.sender_id==S.user.id?'':'none';
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
    if(sel.k=='dm'||m.sender_id==S.user.id)q=q.eq('sender_id',S.user.id);
    const{data,error}=await q.select();
    if(error||!data||!data.length){toast(error?error.message:"Couldn't delete the message");return}
    if(S.edit&&String(S.edit.id)===String(m.id))resetEdit();
    if(sel.k=='dm'){S.msgs=S.msgs.filter(x=>x.id!==m.id);updateBadges();if(conv&&S.dm)drawDm()}
    else if(S.cm){S.cm=S.cm.filter(x=>x.id!==m.id);if(S.room!=null)drawCircle()}
  });
}
function onMsgUpd(m){
  const x=S.msgs.find(y=>y.id===m.id);if(!x)return;
  Object.assign(x,m);updateBadges();
  if($('#ov')?.classList.contains('on')&&conv&&S.dm)drawDm();
}
function onMsgDel(o){
  const i=S.msgs.findIndex(y=>y.id===o.id);if(i<0)return;
  S.msgs.splice(i,1);updateBadges();
  if($('#ov')?.classList.contains('on')){if(conv&&S.dm)drawDm();else if(!conv)openChats()}
}
function goDiscover(i){
  closeOv();show('find');ftab(i);
  loadPeople().then(findTab);
}

// ---------- Circles (Group Chats) ----------
function openChat(k){
  k=+k;leaveRoom();S.dm=null;S.room=k;S.cm=null;conv=true;setBar();
  $('#ov').classList.add('on');$('#cl').style.display='none';$('#cv').style.display='flex';
  $('#ct').textContent=(S.im.get(k)?.emoji||'✦')+' '+iname(k);
  mcount=0;cmMore=true;olderBusy=false;drawCircle(1);
  S.cch=sb.channel('circle-'+k+'-'+Date.now())
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'circle_messages',filter:'interest_id=eq.'+k},p=>onCircleMsg(p.new))
    .on('postgres_changes',{event:'UPDATE',schema:'public',table:'circle_messages',filter:'interest_id=eq.'+k},p=>onCircleUpd(p.new))
    .on('postgres_changes',{event:'DELETE',schema:'public',table:'circle_messages'},p=>onCircleDel(p.old))
    .subscribe();
  loadCircle(k);
}
async function loadCircle(k){
  const r=await sb.from('circle_messages').select(CCOLS).eq('interest_id',k).order('created_at',{ascending:false}).limit(MSG_PAGE);
  if(S.room!==k)return;
  if(r.error){toast('Could not load the chat');S.cm=[];drawCircle(1);return}
  cmMore=r.data.length>=MSG_PAGE;
  const rows=r.data.reverse().filter(m=>!bl(m.sender_id));
  await getProfiles(rows.map(m=>m.sender_id));
  if(S.room!==k)return;
  const have=new Set(rows.map(m=>m.id));
  S.cm=[...rows,...(S.cm||[]).filter(m=>!have.has(m.id))];
  drawCircle(1);
}
function drawCircle(snap,keep){
  const el=$('#msgs'),near=nearEnd(el),me=S.user.id;
  if(S.cm===null){el.innerHTML='<div class="empty" style="margin:auto">Loading...</div>';return}
  el.innerHTML=S.cm.length?S.cm.map(m=>{
    const ed=m.edited_at?' · edited':'';
    return m.sender_id==me
      ?`<div class="b me">${rich(m.body,1)}<small class="t f"><span>${tm(m.created_at)}${ed}</span>${moreBtn('cm',m.id)}</small></div>`
      :`<div class="crow"><span class="lk" onclick="openProfile('${m.sender_id}')">${av(m.sender_id)}</span><div class="b"><span class="cn" style="color:${ac(m.sender_id)}">${esc(nm(m.sender_id))}${rb(m.sender_id)}</span>${rich(m.body,1)}<small class="t f"><span>${tm(m.created_at)}${ed}</span><button class="mmore" onclick="event.stopPropagation();openAx('cm','${m.id}')" aria-label="Message options">⋯</button></small></div></div>`}).join('')
    :`<div class="empty" style="margin:auto"><div style="font-size:44px;margin-bottom:8px">${em(S.room)}</div><b>No messages yet</b><div class="sm" style="margin-top:6px">${S.mine.has(S.room)?'Start the conversation in '+esc(iname(S.room))+'.':'Join this circle to start the conversation.'}</div></div>`;
  if(keep){el.scrollTop=el.scrollHeight-keep.h+keep.t;mcount=S.cm.length;return}
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
function sayHi(id){
  $('#sl')?.classList.remove('on');closeThread();closePf(true);
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
    const fk='r'+k,retry=!!(S.fail&&S.fail.k==fk&&S.fail.v==v);
    $('#mi').value='';syncSend();S.fail=null;failSync();
    let data=retry?await alreadySent('circle_messages','sender_id',{interest_id:k},v):null,error=null;
    if(!data){const r=await sb.from('circle_messages').insert({interest_id:k,sender_id:S.user.id,body:v}).select().single();data=r.data;error=r.error}
    if(error){S.fail={k:fk,v};if(S.room===k){$('#mi').value=v;syncSend()}failSync();toast(errMsg(error));return}
    if(S.room===k&&S.cm&&!S.cm.some(x=>x.id===data.id)){S.cm.push(data);drawCircle(1)}
    checkAch();return;
  }
  if(!S.dm)return;
  const to=S.dm,fk='d'+to,retry=!!(S.fail&&S.fail.k==fk&&S.fail.v==v);
  $('#mi').value='';syncSend();S.fail=null;failSync();
  let data=retry?await alreadySent('messages','sender_id',{to_user:to},v):null,error=null;
  if(!data){const r=await sb.from('messages').insert({sender_id:S.user.id,to_user:to,body:v}).select().single();data=r.data;error=r.error}
  if(error){S.fail={k:fk,v};if(S.dm===to&&!$('#mi').value){$('#mi').value=v;syncSend()}failSync();toast(errMsg(error));return}
  if(!S.msgs.some(x=>x.id===data.id))S.msgs.push(data);
  if(conv&&S.dm==data.to_user)drawDm(1);
  checkAch();
}
async function onMsg(m){
  if(S.msgs.some(x=>x.id===m.id)||bl(m.sender_id))return;
  S.msgs.push(m);
  if(!S.names[m.sender_id])await getProfiles([m.sender_id]);
  const open=$('#ov')?.classList.contains('on');
  if(open&&conv&&S.dm==m.sender_id){drawDm();markRead(m.sender_id);return}
  updateBadges();
  toast(nm(m.sender_id)+': '+(m.body.length>40?m.body.slice(0,40)+'…':m.body));
  if(open&&!conv)openChats();
}
function back(){conv?openChats():closeOv()}
