// ---------- You + Profile ----------
function meTab(){
  const pr=S.prof||{},mine=[...S.mine];
  setMyAv($('#mav'));setBanner($('#mbn'),pr.banner_url);$('#mav').dataset.zoom=S.avs[S.user.id]||'';$('#mbn').dataset.zoom=pr.banner_url||'';$('#mn').innerHTML=esc(S.name)+rb(S.user.id);
  $('#mu').textContent='@'+(pr.username||'')+(pr.city?' · '+pr.city:'');
  $('#mcn').textContent=S.name;$('#mcu').textContent='@'+(pr.username||'');
  $('#mf').innerHTML=`<button onclick="openFollows('${S.user.id}','ers')"><b>${S.folrs.size}</b> ${S.folrs.size==1?'follower':'followers'}</button><button onclick="openFollows('${S.user.id}','ing')"><b>${S.fol.size}</b> following</button>`;
  $('#mb').textContent=pr.bio||'';$('#mb').hidden=!pr.bio;
  const li=mine.filter(n=>!isArt(n)),la=mine.filter(isArt);
  $('#shelf').innerHTML=(li.length?li.map(chip).join(''):'<span class="mute sm emp">No interests yet. Add some to shape your feed.</span>')+`<button class="chip addb" onclick="openPk()">＋ Add</button>`;
  $('#art').innerHTML=(la.length?la.map(chip).join(''):'<span class="mute sm emp">No artists yet. Add the ones you listen to.</span>')+`<button class="chip addb" onclick="openPk('art')">＋ Add</button>`;
  drawBadges();
  $('#mpav').innerHTML=av(S.user.id);$('#mpn').textContent=S.name;
  $('#s-me').style.setProperty('--bn',pr.banner_url?'url("'+String(pr.banner_url).replace(/"/g,'%22')+'")':'var(--grad)');
  $('#mt').innerHTML=['My posts','Liked','Photos'].map((t,i)=>`<button class="${i==S.mt?'on':''}" onclick="setMt(${i})">${t}</button>`).join('');
  $('#mine').innerHTML=mineBody();
  meSync();meCompact();
}
function mineBody(){
  if(S.mt==1){
    if(S.liked===null)return skPost().repeat(2);
    return S.liked.map(findPost).filter(p=>p&&!bl(p.author_id)).map(p=>post(p)).join('')||'<div class="empty">Nothing liked yet.<br>Tap the heart on a post and it will show up here.</div>';
  }
  if(S.mt==2){
    const ph=S.myPosts.flatMap(p=>p.imgs||[]);
    return ph.length?'<div class="phgrid">'+ph.map(u=>timg(u)).join('')+'</div>':'<div class="empty">No photos yet.<br>Add photos to a post and they will collect here.</div>';
  }
  return S.skel&&!S.myPosts.length?skPost().repeat(2):S.myPosts.map(p=>post(p)).join('')||'<div class="empty">No posts yet.<br>Tap + on Home to write one.</div>';
}
function setMt(i){S.mt=i;if(i==1)loadLiked();meTab();meTop()}

var meDesk=matchMedia('(min-width:1024px)');
// Phones: as the You header scrolls away, the top bar becomes a slim banner strip with photo and name.
function meCompact(){
  const s=$('#s-me');if(!s)return;
  if(meDesk.matches){s.style.removeProperty('--q');return}
  const bn=$('#mbn'),bh=bn?bn.offsetHeight:130;
  const a=bh*.6,b=bh+50;
  s.style.setProperty('--q',Math.max(0,Math.min(1,(s.scrollTop-a)/(b-a))).toFixed(3));
}
let meRaf=0;
$('#s-me')?.addEventListener('scroll',()=>{if(meRaf)return;meRaf=requestAnimationFrame(()=>{meRaf=0;meCompact()})},{passive:true});
addEventListener('resize',()=>meCompact());
var ME={W:0,H:0,D:0,TH:52,exp:{l:null,r:null}};
const ME_LW=440,ME_H1=60;
const meEl=()=>({st:$('#me .me-body'),L:$('#me .col-l'),R:$('#mine'),hero:$('.me-hero'),av:$('#mav'),pill:$('.mcomp'),tabs:$('#mt')});
function meClear(){
  const e=meEl();
  // The avatar's inline style also holds the profile photo (background-image), so only drop the scroll animation's transform.
  [e.hero,e.pill,e.L,e.R,e.tabs].forEach(x=>x&&x.removeAttribute('style'));
  if(e.av)e.av.style.removeProperty('transform');
  const me=$('#me');if(me){me.style.removeProperty('--H');me.style.removeProperty('--th')}
}
function meLayout(){
  const e=meEl();
  if(!meDesk.matches||!e.st||!e.st.clientWidth)return false;
  ME.W=e.st.clientWidth-24;
  ME.H=Math.round(Math.min(ME.W/3,innerHeight*.46));
  ME.D=ME.H-2;
  ME.TH=e.tabs.offsetHeight||52;
  const me=$('#me');me.style.setProperty('--H',ME.H+'px');me.style.setProperty('--th',ME.TH+'px');
  [e.L,e.R].forEach(el=>{
    el.style.setProperty('--fill','0px');
    const need=ME.D+el.clientHeight-el.scrollHeight;
    if(need>0)el.style.setProperty('--fill',need+'px');
  });
  return true;
}
function mePaint(P){
  const e=meEl(),{W,H,D,TH}=ME;
  const Dh=H-ME_H1,q=Math.min(1,P/Dh),w0=Math.min(1,P/(Dh*.8)),w=w0*w0*(3-2*w0),hh=H-Math.min(P,Dh),o=Math.max(0,Math.min(1,(q-.55)/.45));
  e.hero.style.width=(W-(W-ME_LW)*w)+'px';
  e.hero.style.height=hh+'px';
  e.av.style.transform='translateY('+(-68*q)+'px) scale('+(1-.633*q)+')';
  e.pill.style.opacity=o;
  e.pill.style.transform='translateY(calc(-50% + '+((1-o)*24)+'px))';
  e.L.style.clipPath='inset('+(hh+10*q)+'px 0 0 0)';
  const T=H+8-Math.min(P,D);
  e.tabs.style.transform='translateY('+T+'px)';
  e.R.style.clipPath='inset('+(T+TH+8)+'px 0 0 0)';
}
function meSync(){
  if(!meLayout()){if(!meDesk.matches)meClear();return}
  const e=meEl();
  mePaint(Math.min(ME.D,Math.max(e.L.scrollTop,e.R.scrollTop)));
}
function meSet(key,v){
  const el=meEl()[key=='l'?'L':'R'];v=Math.round(v);
  if(Math.abs(el.scrollTop-v)<1)return;
  ME.exp[key]=v;el.scrollTop=v;
}
function meScrolled(key){
  if(!meDesk.matches||!ME.D)return;
  const e=meEl(),el=key=='l'?e.L:e.R,ot=key=='l'?e.R:e.L,ok=key=='l'?'r':'l';
  if(ME.exp[key]!==null){const same=Math.abs(el.scrollTop-ME.exp[key])<2;ME.exp[key]=null;if(same)return}
  const y=el.scrollTop,D=ME.D;
  let P;
  if(y<D-1&&ot.scrollTop>D+2){P=D;meSet(key,D)}
  else{P=Math.min(y,D);if(ot.scrollTop<=D+2)meSet(ok,P)}
  mePaint(P);
}
function meTop(){
  if(!meDesk.matches||!ME.D)return;
  const e=meEl();
  meSet('r',Math.min(ME.D,Math.max(e.L.scrollTop,e.R.scrollTop)));
}
$('#me .col-l')?.addEventListener('scroll',()=>meScrolled('l'),{passive:true});
$('#mine')?.addEventListener('scroll',()=>meScrolled('r'),{passive:true});
$('.me-hero')?.addEventListener('wheel',ev=>{
  if(!meDesk.matches)return;
  const e=meEl(),t=ev.clientX<e.R.getBoundingClientRect().left?e.L:e.R;
  t.scrollTop+=ev.deltaY*(ev.deltaMode==1?16:1);ev.preventDefault();
},{passive:false});
meDesk.addEventListener('change',()=>meSync());
addEventListener('resize',()=>meSync());
if($('#me .me-body'))new ResizeObserver(()=>meSync()).observe($('#me .me-body'));

async function loadLiked(){
  const r=await sb.from('sames').select('post_id').eq('user_id',S.user.id).limit(100);
  if(r.error){if(S.liked===null)S.liked=[];toast('Could not load your liked posts');meTab();return}
  const ids=(r.data||[]).map(x=>x.post_id);
  if(!ids.length){S.liked=[];meTab();return}
  const pr=await sb.from('posts').select(COLS).in('id',ids).order('created_at',{ascending:false}).limit(50);
  if(pr.error){if(S.liked===null)S.liked=[];toast('Could not load your liked posts');meTab();return}
  await hydrate(pr.data);
  S.liked=pr.data.map(x=>x.id);
  meTab();
}

function drawPk(){
  const art=S.pkm=='art',raw=$('#pks').value.trim().replace(/\s+/g,' '),q=raw.toLowerCase();
  $('#pkt').textContent=art?'Your artists':'Your interests';
  $('#pks').placeholder=art?'Search or add an artist':'Search or add an interest';
  let l=S.ints.filter(i=>art?i.kind=='artist':i.kind!='artist');
  l=l.filter(i=>i.name.toLowerCase().includes(q)).sort((a,b)=>(S.mine.has(b.id)-S.mine.has(a.id))||a.name.localeCompare(b.name)).slice(0,60);
  let h=l.map(i=>{const on=S.mine.has(i.id);return `<button class="fc ${on?'on':''}" style="--c:${col(i.id)}" onclick="ask(${i.id})">${em(i.id)} ${esc(i.name)}${on?' ✓':''}</button>`}).join('');
  if(raw.length>=2&&raw.length<=40&&!S.ints.some(i=>i.name.toLowerCase()==q))h+=isAdmin()?`<button class="fc addb" onclick="${art?'newArtist()':'newInterest()'}">＋ Add “${esc(raw)}”${art?' as an artist':' as an interest'}</button>`:`<div class="mute sm" style="margin:6px 4px">Not listed? Ask an admin to add “${esc(raw)}”.</div>`;
  if(!h)h=isAdmin()?`<div class="mute sm">Type a ${art?'artist':'interest'} name to add it.</div>`:`<div class="mute sm">Nothing listed yet.</div>`;
  if(!art){
    const categories=[...new Set(l.map(i=>i.category||'Other'))];
    h=categories.map(category=>{
      const items=l.filter(i=>(i.category||'Other')===category);
      return `<div class="cath" style="color:${col(items[0].id)}">${esc(category)}</div><div class="pkl">${items.map(i=>{const on=S.mine.has(i.id);return `<button class="fc ${on?'on':''}" style="--c:${col(i.id)}" onclick="ask(${i.id})">${em(i.id)} ${esc(i.name)}${on?' ✓':''}</button>`}).join('')}</div>`;
    }).join('')||'<div class="empty">No listed interests match your search.</div>';
  }
  $('#pkl').innerHTML=h;
}
function openPk(k){
  S.pkm=k=='art'?'art':'int';$('#pks').value='';drawPk();$('#pk').classList.add('on');$('#pks').focus();
  loadInts().then(()=>{if($('#pk').classList.contains('on'))drawPk()});
}
function ask(n){
  const on=S.mine.has(n);
  confirmBox((on?'Remove ':'Add ')+iname(n)+(on?' from':' to')+(isArt(n)?' your artists?':' your interests?'),on?'Remove':'Add',()=>toggleInt(n));
}
async function toggleInt(n){
  const on=S.mine.has(n);
  const r=on?await sb.from('user_interests').delete().match({user_id:S.user.id,interest_id:n}):await sb.from('user_interests').insert({user_id:S.user.id,interest_id:n});
  if(r.error){toast(r.error.message);return}
  on?S.mine.delete(n):S.mine.add(n);
  S.cnt[n]=Math.max(0,(S.cnt[n]||0)+(on?-1:1));
  draw();if($('#pk').classList.contains('on'))drawPk();toast((on?'Removed ':'Added ')+iname(n));
}
async function newArtist(){
  if(!isAdmin()){toast('Only admins can add new artists');return}
  const name=$('#pks').value.trim().replace(/\s+/g,' ');
  if(name.length<2||name.length>40){toast('Artist names are 2 to 40 characters');return}
  const k=nameKey(name),find=()=>S.ints.find(i=>k?nameKey(i.name)==k:i.name.toLowerCase()==name.toLowerCase());
  const known=d=>{if(d.kind=='artist'){$('#pks').value='';drawPk();ask(d.id)}else toast('"'+d.name+'" is already an interest')};
  const d=find();if(d){known(d);return}
  const sim=similarTo(name,'artist');
  if(sim.length){dupAsk(name,sim,id=>{$('#sl').classList.remove('on');$('#pks').value='';drawPk();ask(id)},()=>createArtistPk(name));return}
  return createArtistPk(name);
}
async function createArtistPk(name){
  const k=nameKey(name),find=()=>S.ints.find(i=>k?nameKey(i.name)==k:i.name.toLowerCase()==name.toLowerCase());
  const color=PAL[[...name].reduce((a,c)=>a+c.charCodeAt(0),0)%PAL.length];
  const r=await sb.from('interests').insert({name,emoji:'🎤',color,category:'Artists',kind:'artist'}).select().single();
  if(r.error){
    if(r.error.code=='23505'){await loadInts();const d=find();if(d&&d.kind=='artist'){$('#pks').value='';drawPk();ask(d.id);return}toast('That artist is already listed');return}
    toast(r.error.message);return;
  }
  S.ints.push(r.data);S.im.set(r.data.id,r.data);
  $('#pks').value='';await toggleInt(r.data.id);
}
async function newInterest(){
  if(!isAdmin()){toast('Only admins can add new interests');return}
  const name=$('#pks').value.trim().replace(/\s+/g,' ');
  if(name.length<2||name.length>40){toast('Interest names are 2 to 40 characters');return}
  const find=()=>S.ints.find(i=>i.name.toLowerCase()==name.toLowerCase());
  let interest=find();
  if(interest){if(interest.kind!='artist')ask(interest.id);else toast('That name is already an artist');return}
  const color=PAL[[...name].reduce((a,c)=>a+c.charCodeAt(0),0)%PAL.length];
  const{data,error}=await sb.from('interests').insert({name,emoji:'✦',color,category:'Hobby'}).select().single();
  if(error){
    if(error.code=='23505'){await loadInts();interest=find();if(interest&&interest.kind!='artist')ask(interest.id);else toast(error.message);return}
    toast(error.message);return;
  }
  S.ints.push(data);S.im.set(data.id,data);$('#pks').value='';await toggleInt(data.id);
}

function draw(){
  home();findTab();eventsTab();meTab();refreshPv();
  if(S.th&&findPost(S.th)&&$('#th').classList.contains('on'))renderThread();
  if(S.pf&&$('#pf').classList.contains('on'))drawPf();
  if(S.evActiveId&&$('#ev-ov').classList.contains('on'))renderEventFullscreen();
}

// ---------- Edit Profile ----------
let peSnap=null,peBusy=false,peUT=0;
const PE_USER=/^[a-z0-9_.]{3,20}$/;
function peVals(){return{display_name:$('#pen').value.trim(),username:$('#peu').value.trim().toLowerCase().replace(/^@/,''),bio:$('#peb').value.trim(),city:$('#pec').value.trim()}}
function peDirty(){if(!peSnap)return false;const v=peVals();return Object.keys(v).some(k=>v[k]!==peSnap[k])}
function peSync(){const b=$('#pes');if(b)b.disabled=peBusy||!peDirty()}
function peFld(id,msg){const el=$('#'+id+'-e');if(el)el.textContent=msg||'';$('#'+id)?.classList.toggle('bad',!!msg)}
function peErrors(){
  const v=peVals(),er={};
  if(!v.display_name)er.pen='Add your name.';
  if(!PE_USER.test(v.username))er.peu='Use 3 to 20 letters, numbers, _ or .';
  return er;
}
function peInput(id){
  peFld(id,'');$('#pee').textContent='';
  if(id==='peb')$('#pbc').textContent=$('#peb').value.length+'/160';
  peSync();
}
async function peUserAvail(){
  if(!peSnap)return;
  const v=peVals().username;
  if(v===peSnap.username||!PE_USER.test(v))return;
  const t=++peUT;
  try{
    const r=await sb.from('profiles').select('id').eq('username',v).neq('id',S.user.id).limit(1);
    if(t!==peUT||peVals().username!==v||r.error)return;
    if(r.data&&r.data.length)peFld('peu','That username is taken.');
  }catch(x){}
}
function openPe(){
  const p=S.prof||{};
  $('#pen').value=S.name||'';$('#peu').value=p.username||'';$('#peb').value=p.bio||'';$('#pec').value=p.city||'';
  $('#pbc').textContent=($('#peb').value.length)+'/160';$('#pee').textContent='';
  ['pen','peu'].forEach(i=>peFld(i,''));
  peBusy=false;peSnap=peVals();$('#pes').textContent='Save';peSync();
  setMyAv($('#peav'));$('#perm').hidden=!S.avs[S.user.id];
  setBanner($('#pebn'),p.banner_url);$('#pebrm').hidden=!p.banner_url;
  $('#pe').classList.add('on');
  const body=$('#pe .pnl-body');if(body)body.scrollTop=0;
}
function closePe(force){
  if(!$('#pe').classList.contains('on'))return;
  if(!force&&peDirty()&&!peBusy){confirmBox('Discard your changes?','Discard',()=>closePe(true));return}
  $('#pe').classList.remove('on');peSnap=null;
}
async function saveProfile(){
  if(peBusy||!peDirty())return;
  const e=$('#pee');e.textContent='';
  const er=peErrors();
  ['pen','peu'].forEach(i=>peFld(i,er[i]));
  const first=Object.keys(er)[0];
  if(first){$('#'+first).focus();return}
  const v=peVals(),b=$('#pes');
  peBusy=true;b.disabled=true;b.textContent='Saving...';
  const vals={display_name:v.display_name,username:v.username,bio:v.bio||null,city:v.city||null};
  const{error}=await sb.from('profiles').update(vals).eq('id',S.user.id);
  peBusy=false;b.textContent='Save';
  if(error){
    if(error.code=='23505'){peFld('peu','That username is taken.');$('#peu').focus()}
    else e.textContent=error.message||"Couldn't save. Try again.";
    peSync();return;
  }
  Object.assign(S.prof,vals);S.name=v.display_name;S.names[S.user.id]=v.display_name;
  closePe(true);draw();toast('Profile saved');
}
async function setAvatarBlob(blob){
  const url=await upload('avatars',blob),old=S.avs[S.user.id];
  const{error}=await sb.from('profiles').update({avatar_url:url}).eq('id',S.user.id);
  if(error){rmFiles('avatars',[url]);throw error}
  if(old)rmFiles('avatars',[old]);
  S.avs[S.user.id]=url;S.prof.avatar_url=url;
}
function pickAvatar(inp){
  const f=inp.files[0];inp.value='';if(!f)return;
  cropFile(f,'avatar',async blob=>{
    toast('Uploading photo...');
    try{await setAvatarBlob(blob);setMyAv($('#peav'));$('#perm').hidden=false;draw();toast('Photo updated');checkAch()}
    catch(e){toast(e.message||"Couldn't upload that photo")}
  });
}
function setBanner(el,u){
  if(!el)return;
  el.style.backgroundImage=u?"url('"+u+"')":'';
  el.style.backgroundSize=u?'cover':'';el.style.backgroundPosition=u?'center':'';
}
function pickBanner(inp){
  const f=inp.files[0];inp.value='';if(!f)return;
  cropFile(f,'banner',async blob=>{
    toast('Uploading banner...');
    try{
      const url=await upload('avatars',blob),old=S.prof.banner_url;
      const{error}=await sb.from('profiles').update({banner_url:url}).eq('id',S.user.id);
      if(error){rmFiles('avatars',[url]);throw error}
      if(old)rmFiles('avatars',[old]);
      S.prof.banner_url=url;setBanner($('#pebn'),url);$('#pebrm').hidden=false;draw();toast('Banner updated');
    }catch(e){toast(e.message||"Couldn't upload that photo")}
  });
}
async function removeBanner(){
  const old=S.prof.banner_url;if(!old)return;
  const{error}=await sb.from('profiles').update({banner_url:null}).eq('id',S.user.id);
  if(error){toast(error.message);return}
  rmFiles('avatars',[old]);S.prof.banner_url=null;
  setBanner($('#pebn'),null);$('#pebrm').hidden=true;draw();toast('Banner removed');
}
async function removeAvatar(){
  const old=S.avs[S.user.id];if(!old)return;
  const{error}=await sb.from('profiles').update({avatar_url:null}).eq('id',S.user.id);
  if(error){toast(error.message);return}
  rmFiles('avatars',[old]);delete S.avs[S.user.id];S.prof.avatar_url=null;
  setMyAv($('#peav'));$('#perm').hidden=true;draw();toast('Photo removed');
}

// ---------- Crop Editor ----------
const CR={ptrs:new Map()};
function cropFile(file,kind,cb){
  const url=URL.createObjectURL(file),im=new Image();
  im.onload=()=>{
    Object.assign(CR,{k:kind,im,url,cb,z:1,d0:0});CR.ptrs.clear();
    $('#crt').textContent=kind=='avatar'?'Adjust your photo':'Adjust your banner';
    $('#crh').textContent=kind=='avatar'?'Drag to move. Pinch or use the slider to zoom. Only the circle will show on your profile.':'Drag to move. Pinch or use the slider to zoom. Your profile photo covers the bottom left corner.';
    $('#crst').className='crst '+kind;$('#cri').src=url;$('#crz').value=1;
    $('#cr').classList.add('on');
    requestAnimationFrame(()=>{
      const st=$('#crst');CR.sw=st.clientWidth;CR.sh=st.clientHeight;
      CR.min=Math.max(CR.sw/im.naturalWidth,CR.sh/im.naturalHeight);
      const sc=CR.min;CR.x=(CR.sw-im.naturalWidth*sc)/2;CR.y=(CR.sh-im.naturalHeight*sc)/2;
      crPaint();
    });
  };
  im.onerror=()=>{URL.revokeObjectURL(url);toast('Could not read that photo')};
  im.src=url;
}
function crPaint(){
  const im=CR.im;if(!im)return;
  const sc=CR.min*CR.z,w=im.naturalWidth*sc,h=im.naturalHeight*sc;
  CR.x=Math.min(0,Math.max(CR.sw-w,CR.x));CR.y=Math.min(0,Math.max(CR.sh-h,CR.y));
  const el=$('#cri');el.style.width=w+'px';el.style.height=h+'px';el.style.transform=`translate(${CR.x}px,${CR.y}px)`;
}
function crSetZ(z,fx,fy){
  if(!CR.im)return;
  z=Math.min(4,Math.max(1,z));
  const old=CR.min*CR.z,px=(fx-CR.x)/old,py=(fy-CR.y)/old,ns=CR.min*z;
  CR.z=z;CR.x=fx-px*ns;CR.y=fy-py*ns;
  $('#crz').value=z;crPaint();
}
function crClose(){$('#cr').classList.remove('on');if(CR.url)URL.revokeObjectURL(CR.url);CR.url=null;CR.im=null;CR.cb=null;CR.ptrs.clear()}
function crCancel(){crClose()}
function crSave(){
  const im=CR.im,k=CR.k,cb=CR.cb;if(!im)return;
  const sc=CR.min*CR.z,nw=im.naturalWidth,nh=im.naturalHeight;
  const w=Math.min(nw,CR.sw/sc),h=Math.min(nh,CR.sh/sc);
  const sx=Math.max(0,Math.min(nw-w,-CR.x/sc)),sy=Math.max(0,Math.min(nh-h,-CR.y/sc));
  const ow=Math.max(1,Math.round(Math.min(k=='avatar'?512:1400,w))),oh=k=='avatar'?ow:Math.max(1,Math.round(ow/3));
  const cv=document.createElement('canvas');cv.width=ow;cv.height=oh;
  cv.getContext('2d').drawImage(im,sx,sy,w,h,0,0,ow,oh);
  cv.toBlob(b=>{crClose();if(b&&cb)cb(b);else toast('Could not read that photo')},'image/jpeg',.85);
}
(()=>{
  const st=$('#crst');if(!st)return;
  const rect=()=>st.getBoundingClientRect();
  st.addEventListener('pointerdown',e=>{st.setPointerCapture(e.pointerId);CR.ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});CR.d0=0});
  st.addEventListener('pointermove',e=>{
    const p=CR.ptrs.get(e.pointerId);if(!p||!CR.im)return;
    if(CR.ptrs.size==1){CR.x+=e.clientX-p.x;CR.y+=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;crPaint();return}
    p.x=e.clientX;p.y=e.clientY;
    const[a,b]=[...CR.ptrs.values()],d=Math.hypot(a.x-b.x,a.y-b.y),r=rect();
    if(CR.d0)crSetZ(CR.z*d/CR.d0,(a.x+b.x)/2-r.left,(a.y+b.y)/2-r.top);
    CR.d0=d;
  });
  const up=e=>{CR.ptrs.delete(e.pointerId);CR.d0=0};
  st.addEventListener('pointerup',up);st.addEventListener('pointercancel',up);
  st.addEventListener('wheel',e=>{e.preventDefault();const r=rect();crSetZ(CR.z*(e.deltaY<0?1.08:.93),e.clientX-r.left,e.clientY-r.top)},{passive:false});
})();
