function openMod(){$('#set').classList.remove('on');mtab=0;$('#mo').classList.add('on');drawMod()}
function drawMod(){
  const tabs=['Reports','Users','Event publishers'].concat(isAdmin()?['Lists','Invites','Feedback','Stats']:[]);
  $('#mot').innerHTML=`<div class="tabs">${tabs.map((t,i)=>`<button class="${i==mtab?'on':''}" onclick="mtab=${i};drawMod()">${t}${i==0&&S.nrep?' ('+S.nrep+')':''}</button>`).join('')}</div>`;
  if(mtab==0)drawReports();else if(mtab==1)drawUsers();else if(mtab==2)drawEventPublishers();else if(mtab==3)drawLists();else if(mtab==4)drawInvites();else if(mtab==5)drawFeedback();else drawStats();
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
  if($('#mo')?.classList.contains('on')&&mtab==0)drawMod();
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
async function drawEventPublishers(){
  $('#mob').innerHTML='<div class="empty">Loading...</div>';
  const r=await sb.from('event_authorizations').select('user_id,granted_at').order('granted_at',{ascending:false});
  if(mtab!=2)return;
  if(r.error){$('#mob').innerHTML=`<div class="empty">${esc(r.error.message)}</div>`;return}
  await getProfiles((r.data||[]).map(x=>x.user_id));
  if(mtab!=2)return;
  const rows=(r.data||[]).map(x=>`<div class="card row">${av(x.user_id)}<div class="grow"><b>${esc(nm(x.user_id))}</b><div class="mute sm">Approved ${ago(x.granted_at)}</div></div><button class="btn off sbtn" onclick="setEventPublisher('${x.user_id}',false)">Remove</button></div>`).join('')||'<div class="empty">No members have been approved yet.</div>';
  $('#mob').innerHTML='<div class="card"><b>Approve an event publisher</b><div class="mute sm" style="margin:4px 0 10px">Admins and moderators can publish automatically. Search for a member to let them publish too.</div><input class="fi" id="epq" placeholder="Search members" maxlength="40" oninput="clearTimeout(musrT);musrT=setTimeout(searchEventPublishers,250)"><div id="eps"></div></div>'+rows;
}
async function searchEventPublishers(){
  const input=$('#epq');if(!input)return;
  const q=input.value.trim().replace(/[%,()*\\]/g,'');
  if(!q){$('#eps').innerHTML='';return}
  let query=sb.from('profiles').select('id,display_name,username,role,avatar_url').order('display_name').limit(12);
  query=query.or(`display_name.ilike.%${q}%,username.ilike.%${q}%`);
  const r=await query;
  if(!$('#eps')||mtab!=2)return;
  if(r.error){$('#eps').innerHTML=`<div class="err">${esc(r.error.message)}</div>`;return}
  r.data.forEach(u=>{S.names[u.id]=u.display_name;S.roles[u.id]=u.role||'user';if(u.avatar_url)S.avs[u.id]=u.avatar_url});
  $('#eps').innerHTML=r.data.map(u=>`<div class="prow"><span>${av(u.id,'sm')}</span><div class="grow"><b>${esc(u.display_name)}${rb(u.id)}</b><div class="mute sm">@${esc(u.username||'')}</div></div>${u.role=='admin'||u.role=='mod'?'<span class="mute sm">Already allowed</span>':`<button class="btn sbtn" onclick="setEventPublisher('${u.id}',true)">Approve</button>`}</div>`).join('')||'<div class="mute sm">No members found.</div>';
}
async function setEventPublisher(id,on){
  const r=on?await sb.from('event_authorizations').upsert({user_id:id,granted_by:S.user.id}):await sb.from('event_authorizations').delete().eq('user_id',id);
  if(r.error){toast(r.error.message);return}
  toast(on?'Member approved to publish events':'Publishing access removed');drawEventPublishers();
}
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
async function uaDone(id,msg){toast(msg);await openUa(id);if($('#mo')?.classList.contains('on')&&mtab==1)searchUsers();draw()}
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

const nameKey=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đ]/g,'d').replace(/[øØ]/g,'o').replace(/[łŁ]/g,'l').replace(/ı/g,'i').toLowerCase().replace(/[\s\p{P}\p{S}]+/gu,'');
function lev(a,b){
  const m=a.length,n=b.length;if(!m)return n;if(!n)return m;
  let p=Array.from({length:n+1},(_,j)=>j);
  for(let i=1;i<=m;i++){const c=[i];for(let j=1;j<=n;j++)c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]==b[j-1]?0:1));p=c}
  return p[n];
}
function similarTo(name,kind,skipId,withExact){
  const k=nameKey(name);if(!k)return[];
  return S.ints.filter(i=>i.id!=skipId&&(i.kind=='artist')==(kind=='artist')).filter(i=>{
    const k2=nameKey(i.name);
    if(!k2)return false;
    if(k2==k)return !!withExact;
    const s=k.length<=k2.length?k:k2,l=k.length<=k2.length?k2:k;
    if(s.length>=4&&l.includes(s))return true;
    const max=l.length>=8?2:l.length>=5?1:0;
    return max>0&&l.length-s.length<=max&&lev(k,k2)<=max;
  }).slice(0,4);
}
function dupAsk(name,sim,onUse,onAnyway){
  $('#slt').textContent='Did you mean...?';
  S.dupUse=id=>onUse&&onUse(id);S.dupGo=()=>{$('#sl').classList.remove('on');onAnyway()};
  S.sl={ids:sim.map(i=>i.id),n:SL_PAGE,empty:'',
    row:id=>`<div class="prow${onUse?' lk':''}"${onUse?` onclick="S.dupUse(${id})"`:''}><span class="tile" style="width:36px;height:36px;font-size:18px">${em(id)}</span><b class="grow">${esc(iname(id))}</b>${onUse?'<span class="mute sm">Use this</span>':''}</div>`,
    foot:`<button class="btn off" style="width:100%;margin-top:10px" onclick="S.dupGo()">No, add "${esc(name)}" as new</button>`};
  slDraw();$('#sl').classList.add('on');
}
async function drawLists(){
  $('#mob').innerHTML='<div class="empty">Loading...</div>';
  await Promise.all([loadInts(),loadPeople()]);
  if(mtab!=3)return;
  const arts=S.ints.filter(i=>i.kind=='artist').sort((a,b)=>a.name.localeCompare(b.name));
  const n=S.ints.filter(i=>i.kind!='artist').length;
  $('#mob').innerHTML=`<div class="card"><b>Artists</b> <span class="mute sm">(${arts.length})</span><div class="row" style="margin-top:10px"><input class="fi grow" id="mla" maxlength="40" placeholder="Add an artist" onkeydown="if(event.key==='Enter')admAddArtist()"><button class="btn" onclick="admAddArtist()">Add</button></div><button class="link" style="margin-top:10px" onclick="admDupes()">Find duplicates</button></div>`
    +arts.map(a=>`<div class="card row"><div class="tile">${esc(a.emoji||'🎤')}</div><div class="grow"><b>${esc(a.name)}</b><div class="mute sm">${S.cnt[a.id]||0} ${S.cnt[a.id]==1?'member':'members'}</div></div><button class="btn off sbtn" style="margin:0" onclick="admArt(${a.id})">Manage</button></div>`).join('')
    +`<div class="card"><b>Interests</b><div class="mute sm" style="margin-top:6px">${n} interests are managed in the app code (INTEREST_CATALOG in js/catalog.js). They sync to the database whenever an admin opens the app.</div></div>`;
}
async function drawInvites(){
  $('#mob').innerHTML='<div class="empty">Loading...</div>';
  const r=await sb.from('invite_codes').select('*').order('created_at',{ascending:false});
  if(mtab!=4)return;
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
