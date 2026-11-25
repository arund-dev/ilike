// ---------- Member Profiles ----------
let PF_STACK=[];
// closePf() steps back to the previous profile if there is one; closePf(true) closes the page completely.
function closePf(all){
  if(!all&&PF_STACK.length){openProfile(PF_STACK.pop(),true);return}
  PF_STACK=[];$('#pf')?.classList.remove('on');S.pf=null;
}
function closeAll(){
  ['#pf','#th','#sl','#nv','#info','#ev-ov','#ticket-mod'].forEach(x=>$(x)?.classList.remove('on'));
  S.th=null;PF_STACK=[];S.pf=null;S.evActiveId=null;evLiveStop();closeOv();
}
async function openProfile(id,back){
  id=String(id);
  if(id==S.user.id){closeAll();show('me');draw();checkAch();return}
  closeThread();$('#sl')?.classList.remove('on');
  if(S.pf&&S.pf.id!==id&&!back)PF_STACK.push(S.pf.id);
  else if(!S.pf)PF_STACK=[];
  S.pf={id,prof:null,tab:0};
  $('#pf').classList.add('on');
  const sc=$('#pfs');if(sc)sc.scrollTop=0;
  $('#pf').style.setProperty('--q','0');
  drawPf();
  const[p,ui,ua,po,c1,c2]=await Promise.all([
    sb.from('profiles').select('id,username,display_name,bio,city,avatar_url,banner_url,role').eq('id',id).maybeSingle(),
    sb.from('user_interests').select('interest_id').eq('user_id',id),
    sb.from('user_achievements').select('code,earned_at').eq('user_id',id),
    sb.from('posts').select(COLS).eq('author_id',id).order('created_at',{ascending:false}).limit(20),
    sb.from('follows').select('*',{count:'exact',head:true}).eq('following_id',id),
    sb.from('follows').select('*',{count:'exact',head:true}).eq('follower_id',id)]);
  if(!S.pf||S.pf.id!==id)return;
  if(!p.data){toast('That profile is gone');closePf(true);return}
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
  if(!p){$('#pfb').innerHTML='<div class="banner pfbn"></div>'+skProf();$('#pfpav').innerHTML='';$('#pfpn').textContent='';$('#pf').style.removeProperty('--bn');return}
  const known=f.ints.filter(n=>S.im.has(n)),likes=known.filter(n=>!isArt(n)),arts=known.filter(isArt);
  const fo=S.fol.has(id);
  const earned=f.ach.map(x=>({...x,a:S.achCat.find(c=>c.code==x.code)})).filter(x=>x.a).sort((a,b)=>a.a.sort-b.a.sort);
  $('#pfb').innerHTML=`<div class="banner pfbn"${p.banner_url?` data-zoom="${esc(p.banner_url)}" style="background-image:url('${esc(p.banner_url)}');background-size:cover;background-position:center"`:''}></div><div class="pfh pfov">${av(id,'big')}<h3 class="pfn">${esc(p.display_name)}${rb(id)}</h3>
<div class="mute sm">@${esc(p.username)}${p.city?' · '+esc(p.city):''}${S.folrs.has(id)?' · Follows you':''}</div>
${p.bio?`<p class="bio">${esc(p.bio)}</p>`:''}
<div class="cnts"><button onclick="openFollows('${id}','ers')"><b>${f.nf}</b> ${f.nf==1?'follower':'followers'}</button><button onclick="openFollows('${id}','ing')"><b>${f.ng}</b> following</button></div>
<div class="row pfa"><button class="btn ${fo?'off':''}" onclick="toggleFollow('${id}')">${fo?'Following ✓':'Follow'}</button><button class="btn off" onclick="sayHi('${id}')"><span class="wave-btn">👋</span> Say hi</button>${id!=S.user.id?`<button class="btn off" onclick="openAx('user','${id}')" aria-label="More">⋯</button>`:''}</div></div>
${likes.length?`<div class="pfs">Likes</div><div class="pfc">${likes.map(chip).join('')}</div>`:''}
${arts.length?`<div class="pfs">Artists</div><div class="pfc">${arts.map(chip).join('')}</div>`:''}
${earned.length?`<div class="pfs">Achievements</div><div class="pfc">${earned.map(x=>`<button class="chip tg" style="--c:#64748B" onclick="showAch('${x.code}','${x.earned_at}')">${esc(x.a.emoji)} ${esc(x.a.title)}</button>`).join('')}</div>`:''}
<div class="tabs" id="pft">${['Posts','Photos'].map((t,i)=>`<button class="${i==(f.tab||0)?'on':''}" onclick="setPfTab(${i})">${t}</button>`).join('')}</div>${pfBody(f)}`;
  $('#pfpav').innerHTML=av(id);$('#pfpn').textContent=p.display_name;
  $('#pf').style.setProperty('--bn',p.banner_url?'url("'+String(p.banner_url).replace(/"/g,'%22')+'")':'var(--grad)');
  requestAnimationFrame(pfScrolled);
  const pa=$('#pfb .pfh .av.big');if(pa&&S.avs[id])pa.dataset.zoom=S.avs[id];
}

function pfBody(f){
  if((f.tab||0)==1){
    const ph=f.posts.flatMap(q=>q.imgs||[]);
    return ph.length?'<div class="phgrid">'+ph.map(u=>timg(u)).join('')+'</div>':'<div class="empty">No photos yet.</div>';
  }
  return f.posts.map(q=>post(q)).join('')||'<div class="empty">No posts yet.</div>';
}
function setPfTab(i){if(!S.pf)return;S.pf.tab=i;drawPf()}
// The top bar turns into a slim banner strip (photo + name) once the header has scrolled away.
function pfScrolled(){
  const s=$('#pfs'),bar=$('#pfbar'),pf=$('#pf');if(!s||!bar||!pf)return;
  const bn=$('#pfb .banner'),bh=bn?bn.offsetHeight:130,th=bar.offsetHeight;
  const a=Math.max(0,bh-th-70),b=Math.max(a+1,bh-th+10);
  pf.style.setProperty('--q',Math.max(0,Math.min(1,(s.scrollTop-a)/(b-a))).toFixed(3));
}
let pfRaf=0;
$('#pfs')?.addEventListener('scroll',()=>{if(pfRaf)return;pfRaf=requestAnimationFrame(()=>{pfRaf=0;pfScrolled()})},{passive:true});

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
    ?`<div class="mute sm cnt-line">${S.achMine.size} of ${c.length} earned${S.achMine.size?'':' · post, follow and like to unlock them'}</div>`+c.map(a=>{
        const d=S.achMine.get(a.code);
        return `<button class="chip tg ${d?'':'lock'}" style="--c:#64748B" onclick="showAch('${a.code}','${d||''}')">${d?esc(a.emoji):'🔒'} ${esc(a.title)}</button>`}).join('')
    :'<span class="mute sm emp">Badges unlock as you post, follow people and join in. They will show up here.</span>';
}
function showAch(code,d){
  const a=S.achCat.find(x=>x.code==code);if(!a)return;
  $('#inf').innerHTML=`<div style="font-size:40px">${d?esc(a.emoji):'🔒'}</div><div style="font-size:18px;font-weight:800;margin:6px 0">${esc(a.title)}</div><div class="mute sm">${d?'Earned '+new Date(d).toLocaleDateString([],{day:'numeric',month:'short',year:'numeric'}):'Not earned yet'}</div><p style="margin-top:10px">${esc(a.description)}</p>`;
  $('#info').classList.add('on');
}

// ══════════════════════════════════════════════════════════
