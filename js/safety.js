// ---------- Safety, Reporting, Moderation ----------
const bl=id=>S.blocked.has(id);
const errMsg=e=>(e&&(e.code=='42501'||/row-level security/i.test(e.message||'')))?"You can't do that right now. You may be muted.":(e&&e.message)||'Something went wrong';
const mutedNow=u=>!!(u&&u.muted_until&&new Date(u.muted_until)>new Date());
function muted(){
  if(mutedNow(S.prof)){toast('You are muted until '+tm(S.prof.muted_until));return true}
  return false;
}
function applyBlocks(){
  if(!S.user)return;
  S.posts=S.posts.filter(p=>!bl(p.author_id));
  S.people=S.people.filter(p=>!bl(p.id));
  if(S.reps)S.reps=S.reps.filter(r=>!bl(r.author_id));
  if(S.cm)S.cm=S.cm.filter(m=>!bl(m.sender_id));
  S.msgs=S.msgs.filter(m=>!bl(m.sender_id==S.user.id?m.to_user:m.sender_id));
  updateBadges();
  if($('#ov')?.classList.contains('on')){
    if(conv&&S.dm&&bl(S.dm))openChats();
    else if(conv&&S.room!=null)drawCircle();
    else if(!conv)openChats();
  }
}
async function syncStatus(){
  if(!S.user||!S.loaded)return;
  const r=await sb.from('profiles').select('role,muted_until,banned').eq('id',S.user.id).single();
  if(r.error||!r.data)return;
  if(r.data.banned){S.err='This account has been suspended.';S.good=false;await sb.auth.signOut();return}
  Object.assign(S.prof,r.data);S.role=r.data.role||'user';S.roles[S.user.id]=S.role;
  if(isMod())loadRepCount();else{S.nrep=0;paintRepBadge()}
}

function blockUser(id){
  id=String(id);
  confirmBox('Block '+nm(id)+'?','Block',async()=>{
    const{error}=await sb.rpc('block_user',{target:id});
    if(error){toast(errMsg(error));return}
    S.blocked.add(id);S.fol.delete(id);S.folrs.delete(id);
    ['#pv','#sl','#ev-ov'].forEach(x=>$(x)?.classList.remove('on'));closePf(true);
    S.notifs=S.notifs.filter(n=>!bl(n.actor_id));updateBadges();if($('#nv')?.classList.contains('on'))drawNotifs();
    applyBlocks();draw();if(S.th)renderThread();
    toast('Blocked '+nm(id));
  });
}
const APP_VER='7c',FBK=[['bug','🐞 Bug'],['idea','💡 Idea'],['other','Other']];
function paintFbk(){$('#fbk').innerHTML=FBK.map(k=>`<button class="fc ${S.fbk==k[0]?'on':''}" onclick="S.fbk='${k[0]}';paintFbk()">${k[1]}</button>`).join('')}
function openFb(){
  $('#set').classList.remove('on');S.fbk='idea';paintFbk();
  $('#fbt').value='';$('#fbc').textContent='0/1000';$('#fbe').textContent='';$('#fbs').disabled=false;
  $('#fb').classList.add('on');
}
function closeFb(){$('#fb').classList.remove('on')}
async function sendFb(){
  const body=$('#fbt').value.trim(),e=$('#fbe');e.textContent='';
  if(body.length<3){e.textContent='Write a little more first.';return}
  const b=$('#fbs');b.disabled=true;
  const{error}=await sb.from('feedback').insert({user_id:S.user.id,kind:S.fbk||'other',body,ua:(navigator.userAgent||'').slice(0,200),app_ver:APP_VER});
  b.disabled=false;
  if(error){e.textContent=error.message||'Could not send. Try again.';return}
  closeFb();toast('Thanks, we got it');
}
async function drawStats(){
  if(!S.st)$('#mob').innerHTML='<div class="empty">Loading...</div>';
  const r=await sb.rpc('admin_stats',{days:S.stN||14});
  if(mtab!=6)return;
  if(r.error){$('#mob').innerHTML=`<div class="empty">${esc(r.error.message)}</div>`;return}
  S.st=r.data;paintStats();
}
function setStN(n){S.stN=n;S.st=null;drawStats()}
function paintStats(){
  const d=S.st;if(!d||mtab!=6)return;
  const N=S.stN||14,M=S.stM||'posts',days=d.days||[];
  const lab={signups:'Signups',posts:'Posts',replies:'Replies',messages:'Messages'};
  const sum=k=>days.reduce((t,x)=>t+(x[k]||0),0),max=Math.max(1,...days.map(x=>x[M]||0));
  const stat=(n,l)=>`<div class="card stat"><div class="stn">${n}</div><div class="mute sm">${l}</div></div>`;
  const chip=(on,txt,fn)=>`<button class="fc ${on?'on':''}" onclick="${fn}">${txt}</button>`;
  const bars=days.map(x=>{
    const v=x[M]||0,h=Math.round(v/max*100),day=x.d.slice(8),first=x===days[0]||day=='01';
    return `<div class="sbar" title="${esc(x.d)}: ${v}"><span class="sbv">${N<=14?v:''}</span><i style="height:${Math.max(v?4:1,h)}%"></i><span class="sbl">${N>14&&days.indexOf(x)%4?'':first?x.d.slice(5):day}</span></div>`;
  }).join('');
  const top=l=>l.map(t=>`<div class="prow"><span class="tile" style="width:36px;height:36px;font-size:18px">${esc(t.emoji||'✦')}</span><b class="grow">${esc(t.name)}</b><span class="mute sm">${t.members} ${t.members==1?'member':'members'} · ${t.posts30} ${t.posts30==1?'post':'posts'}</span></div>`).join('')||'<div class="mute sm">Nothing yet.</div>';
  $('#mob').innerHTML=`<div class="stgrid">${stat(d.total_users,'People')}${stat(d.dau,'Active today')}${stat(d.wau,'Active 7 days')}${stat(d.mau,'Active 30 days')}</div>
<div class="card"><div class="row" style="flex-wrap:wrap;gap:6px;margin-bottom:10px">${Object.keys(lab).map(k=>chip(k==M,lab[k],`S.stM='${k}';paintStats()`)).join('')}</div>
<div class="row" style="flex-wrap:wrap;gap:6px;margin-bottom:12px">${[7,14,30].map(n=>chip(n==N,'Last '+n+' days',`setStN(${n})`)).join('')}</div>
<div class="sbars">${bars}</div>
<div class="mute sm" style="margin-top:8px">${lab[M]}: ${sum(M)} in the last ${N} days (days are UTC). "Active" means posted, replied or sent a message.</div></div>
<div class="card"><b>Top interests</b><div style="margin-top:6px">${top(d.top||[])}</div></div>
<div class="card"><b>Top artists</b><div style="margin-top:6px">${top(d.artists||[])}</div></div>
<button class="link" style="margin:4px auto 20px;display:block" onclick="S.st=null;drawStats()">Refresh</button>`;
}
async function drawFeedback(){
  $('#mob').innerHTML='<div class="empty">Loading...</div>';
  const r=await sb.from('feedback').select('*').eq('handled',false).order('created_at',{ascending:false}).limit(50);
  if(mtab!=5)return;
  if(r.error){$('#mob').innerHTML=`<div class="empty">${esc(r.error.message)}</div>`;return}
  await getProfiles(r.data.map(x=>x.user_id));
  if(mtab!=5)return;
  const ic={bug:'🐞 Bug',idea:'💡 Idea',other:'Message'};
  $('#mob').innerHTML=r.data.map(x=>`<div class="card rpc"><div class="mute sm">${esc(nm(x.user_id))} · ${ic[x.kind]||'Message'} · ${ago(x.created_at)}</div><div class="rquote">${esc(x.body)}</div><div class="mute sm clip">${esc((x.app_ver?'v'+x.app_ver+' · ':'')+(x.ua||''))}</div><div class="row rpa"><button class="btn off sbtn" onclick="openProfile('${x.user_id}')">View profile</button><button class="btn sbtn" onclick="fbDone('${x.id}')">Done</button></div></div>`).join('')||'<div class="empty">No open feedback 🎉</div>';
}
async function fbDone(id){
  const{data,error}=await sb.from('feedback').update({handled:true}).eq('id',id).select('id');
  if(error||!data||!data.length){toast(error?error.message:"Couldn't update");return}
  drawFeedback();
}

function openDa(){$('#set').classList.remove('on');$('#dat').value='';$('#dae').textContent='';$('#dab').disabled=true;$('#dab').textContent='Delete forever';$('#da').classList.add('on')}
function closeDa(){if(S.deleting)return;$('#da').classList.remove('on')}
function daCheck(){$('#dab').disabled=$('#dat').value.trim().toUpperCase()!=='DELETE'}
async function doDelete(){
  if(S.deleting||$('#dat').value.trim().toUpperCase()!=='DELETE')return;
  const b=$('#dab'),e=$('#dae'),uid=S.user.id;
  S.deleting=true;b.disabled=true;b.textContent='Deleting...';e.textContent='';
  const fail=m=>{S.deleting=false;b.disabled=false;b.textContent='Delete forever';e.textContent=m||'Could not delete your account. Nothing was changed.'};
  const chk=await sb.rpc('delete_my_account',{dry:true});
  if(chk.error){fail(chk.error.message);return}
  try{
    for(const bk of ['avatars','post-images']){
      for(let k=0;k<20;k++){
        const l=await sb.storage.from(bk).list(uid,{limit:100});
        if(l.error||!l.data||!l.data.length)break;
        const r=await sb.storage.from(bk).remove(l.data.map(f=>uid+'/'+f.name));
        if(r.error||l.data.length<100)break;
      }
    }
  }catch(x){}
  const{error}=await sb.rpc('delete_my_account',{dry:false});
  if(error){fail(error.message);return}
  try{localStorage.removeItem('il-draft-'+uid);localStorage.removeItem('il-rdraft-'+uid)}catch(x){}
  S.deleting=false;$('#da').classList.remove('on');
  await sb.auth.signOut({scope:'local'});S.tab='home';S.F='All';S.loaded=false;
  toast('Your account was deleted');
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
  if(t=='reply'&&uid==S.user.id){
    $('#axb').innerHTML=`<b style="font-size:18px">Your reply</b><button class="btn off wide" onclick="closeAx();editComment('reply','${String(id)}')">Edit reply</button><button class="btn off wide danger" onclick="closeAx();delReply('${String(id)}')">Delete reply</button><button class="btn off wide" onclick="closeAx()">Cancel</button>`;
    $('#ax').classList.add('on');return;
  }
  let h=`<b style="font-size:18px">${esc(nm(uid))}${rb(uid)}</b>`;
  h+=`<button class="btn off wide set-action" onclick="axReport()"><span class="set-action-icon">${UI_ICONS.report}</span><span>Report ${axLabel[t]}</span></button>`;
  h+=bl(uid)?`<button class="btn off wide set-action" onclick="closeAx();unblock('${uid}')"><span class="set-action-icon">${UI_ICONS.block}</span><span>Unblock</span></button>`:`<button class="btn off wide set-action" onclick="axBlock()"><span class="set-action-icon">${UI_ICONS.block}</span><span>Block ${esc(nm(uid))}</span></button>`;
  if(isMod()){
    if(t!='user')h+=`<button class="btn off wide danger" onclick="axDelete()">Delete ${axLabel[t]}</button>`;
    h+=`<button class="btn off wide set-action" onclick="axModerate()"><span class="set-action-icon">${UI_ICONS.shield}</span><span>Moderate user</span></button>`;
  }
  h+='<button class="btn off wide" onclick="closeAx()">Cancel</button>';
  $('#axb').innerHTML=h;$('#ax').classList.add('on');
}
function closeAx(){$('#ax')?.classList.remove('on')}
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
function closeRp(){$('#rp')?.classList.remove('on');S.rp=null}
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

let mtab=0,musrT;
async function loadRepCount(){
  const r=await sb.from('reports').select('id',{count:'exact',head:true}).eq('status','open');
  if(r.error)return;
  S.nrep=r.count||0;paintRepBadge();
}
function paintRepBadge(){
  const b=$('#rpb');if(b){b.hidden=!(isMod()&&S.nrep);b.textContent=S.nrep>9?'9+':S.nrep}
  const ml=$('#modlab');if(ml)ml.hidden=!isMod();
  const m=$('#modb');if(m){m.hidden=!isMod();m.innerHTML=`<span class="set-action-icon">${UI_ICONS.shield}</span><span>Moderation tools${S.nrep?' ('+S.nrep+')':''}</span>`}
}
