// ---------- Notifications ----------
async function notifMeta(list){
  await getProfiles(list.map(n=>n.actor_id));
  const need=[...new Set(list.map(n=>n.post_id))].filter(id=>id&&!(id in S.nposts)&&!findPost(id));
  if(need.length){const r=await sb.from('posts').select('id,body').in('id',need);const got=new Set((r.data||[]).map(x=>x.id));(r.data||[]).forEach(x=>S.nposts[x.id]=x.body);if(!r.error)need.forEach(id=>{if(!got.has(id))S.nposts[id]=null})}
}
const nsnip=n=>{if(!n.post_id)return '';const p=findPost(n.post_id);if(!p&&S.nposts[n.post_id]===null)return 'This post was deleted';const b=p?p.body:(S.nposts[n.post_id]||'');return b.length>80?b.slice(0,80)+'…':b};
const ntext=n=>n.type=='same'?'liked your post':n.type=='reply'?'replied to your post':n.type=='mention'?'mentioned you':'started following you';
async function loadNotifs(){
  const lim=S.nLimit||40;
  const r=await sb.from('notifications').select('id,type,post_id,actor_id,created_at,read_at').order('created_at',{ascending:false}).limit(lim);
  if(r.error)return;
  S.nMore=r.data.length>=lim;
  await notifMeta(r.data);S.notifs=r.data.filter(n=>!bl(n.actor_id));updateBadges();
  if($('#nv')?.classList.contains('on'))drawNotifs();
}
function ngroups(){
  const g=[],idx=new Map();
  for(const n of (S.nf=='mentions'?S.notifs.filter(n=>n.type=='mention'):S.notifs)){
    const day=n.type=='follow'?new Date(n.created_at).toDateString():'';
    const k=n.type+'|'+(n.post_id||'')+'|'+day;
    let x=idx.get(k);
    if(!x){x={type:n.type,post_id:n.post_id,items:[],actors:[]};idx.set(k,x);g.push(x)}
    x.items.push(n);if(!x.actors.includes(n.actor_id))x.actors.push(n.actor_id);
  }
  return g;
}
const gnames=a=>{const b=x=>'<b>'+esc(nm(x))+'</b>';return a.length==1?b(a[0]):a.length==2?b(a[0])+' and '+b(a[1]):b(a[0])+', '+b(a[1])+' and '+(a.length-2)+(a.length==3?' other':' others')};
function drawNotifs(){
  S.ng=ngroups();
  $('#nl').innerHTML=S.ng.map((g,i)=>{
    const un=g.items.some(n=>!n.read_at),newest=g.items[0];
    return `<div class="card row nitem ${un?'new':''}" onclick="openNg(${i})"><span class="ngav">${av(g.actors[0])}${g.actors.length>1?`<i class="ngn">+${g.actors.length-1}</i>`:''}</span><div class="grow"><div>${gnames(g.actors)} ${ntext(newest)}</div><div class="mute sm clip">${g.type=='follow'?(g.actors.length>1?'Tap to see your followers':'Tap to see their profile'):esc(nsnip(newest))}</div></div><span class="mute sm ntm">${ago(newest.created_at)}</span>${un?`<button class="ghost nck" onclick="event.stopPropagation();readNg(${i})" aria-label="Mark as read">✓</button>`:''}</div>`;
  }).join('')||(S.nf=='mentions'?'<div class="empty">No mentions yet.<br>When someone mentions you, you will see it here.</div>':'<div class="empty">Nothing yet.<br>When someone likes a post, replies or follows you, you will see it here.</div>');
  if(S.nMore&&S.ng.length&&S.nf!='mentions')$('#nl').insertAdjacentHTML('beforeend','<button class="btn off" style="width:calc(100% - 32px);margin:8px 16px 16px" onclick="moreNotifs()">Load more</button>');
  $('#nmr').hidden=!S.notifs.some(n=>!n.read_at);
}
function setNF(k){S.nf=k;document.querySelectorAll('#ntabs button').forEach((b,i)=>b.classList.toggle('on',(i==1)==(k=='mentions')));drawNotifs()}
async function moreNotifs(){S.nLimit=(S.nLimit||40)+40;await loadNotifs()}
function markIds(ids){
  if(!ids.length)return;
  const now=new Date().toISOString(),set=new Set(ids);
  S.notifs.forEach(n=>{if(set.has(n.id))n.read_at=now});
  updateBadges();if($('#nv')?.classList.contains('on'))drawNotifs();
  sb.from('notifications').update({read_at:now}).in('id',ids).eq('user_id',S.user.id).then(r=>{if(r.error)loadNotifs()});
}
function readNg(i){const g=S.ng&&S.ng[i];if(g)markIds(g.items.filter(n=>!n.read_at).map(n=>n.id))}
function markNotifsRead(){markIds(S.notifs.filter(n=>!n.read_at).map(n=>n.id))}
function openNotifs(){drawNotifs();$('#nv').classList.add('on')}
async function openNg(i){
  const g=S.ng&&S.ng[i];if(!g)return;
  markIds(g.items.filter(n=>!n.read_at).map(n=>n.id));
  if(g.type=='follow'){g.actors.length>1?openFollows(S.user.id,'ers'):openProfile(g.actors[0]);return}
  if(!(await ensurePost(g.post_id))){toast('This post was deleted');return}
  g.type=='reply'?openThread(g.post_id,{actor:g.items[0].actor_id,at:g.items[0].created_at}):openPost(g.post_id);
}
async function onNotif(n){
  if(bl(n.actor_id))return;
  await notifMeta([n]);
  if(S.notifs.some(x=>x.id===n.id))return;
  S.notifs.unshift(n);
  toast(nm(n.actor_id)+' '+ntext(n));
  if(n.type=='follow'){S.folrs.add(n.actor_id);draw()}else checkAch();
  if($('#nv')?.classList.contains('on'))drawNotifs();
  updateBadges();
}

// ---------- Interests / Artists ----------
const isArt=n=>S.im.get(n)?.kind=='artist';
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

// ---------- Follows ----------
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
  S.sl={ids,n:SL_PAGE,empty:'<div class="empty">Nobody yet</div>',row:u=>`<div class="prow lk" onclick="openProfile('${u}')">${av(u)}<b class="grow">${esc(u==S.user.id?'You':nm(u))}</b></div>`};
  slDraw();
  $('#sl').classList.add('on');
}
async function openFollows(id,k){
  const a=k=='ers'?'follower_id':'following_id',b=k=='ers'?'following_id':'follower_id';
  const r=await sb.from('follows').select(a).eq(b,id).order('created_at',{ascending:false}).limit(200);
  if(r.error){toast('Could not load that list');return}
  const ids=r.data.map(x=>x[a]);await getProfiles(ids);
  peopleSheet(k=='ers'?'Followers':'Following',ids);
}
