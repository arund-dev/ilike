// ---------- Home Feed ----------
// Tapping a post card opens the post pop-up. Buttons, names, photos, tags and menus inside the card keep their own action.
document.addEventListener('click',e=>{
  const c=e.target.closest&&e.target.closest('article.card[data-pi]');
  if(!c||c.closest('#th'))return;
  const sel=getSelection();if(sel&&!sel.isCollapsed&&sel.toString().trim()&&c.contains(sel.anchorNode))return;   // selecting text is not a tap
  const it=e.target.closest('button,a,input,textarea,select,img,[onclick],[data-zoom]');
  if(it&&it!==c&&c.contains(it))return;
  openThread(c.dataset.pi);
});
// tapping a #topic opens Discover searching for it
function hashSearch(tag){
  closeThread();show('find');
  const q=$('#q');if(q){q.value='#'+tag;findTab()}
}
document.addEventListener('keydown',e=>{
  if(e.key!=='Enter'&&e.key!==' ')return;
  const c=e.target;if(!c.matches||!c.matches('article.card[data-pi]')||c.closest('#th'))return;
  e.preventDefault();openThread(c.dataset.pi);
});
const DOTS='<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>';
// Photo grids a poster can choose from: LAYS[n] = how many styles exist for n photos (0 = the automatic grid)
const LAYS={2:2,3:3,4:3,5:3,6:3};
const clampLay=(n,l)=>{l=+l||0;return n>=2&&l>0&&l<(LAYS[n]||1)?l:0};
const layCls=(n,l)=>{n=Math.min(n,6);l=clampLay(n,l);return l?'x'+n+l:'n'+n};
// casual post = no interest picked: shown to the poster and their followers
const casual=p=>!p.tags.length&&(p.author_id==S.user.id||S.fol.has(p.author_id));
function selUi(a,b){const x=$(b);if(x)x.style.display=$(a).value?'':'none'}
// video posts: poster + play button; playback (autoplay while on screen) lives in video.js
const fmtDur=s=>{s=Math.max(0,Math.round(s||0));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
const vidBlock=p=>p.video_url?`<div class="pvid" data-v="${esc(p.video_url)}" data-p="${esc(thumb(p.video_poster)||'')}" onclick="event.stopPropagation();playVid(this)"><img src="${esc(thumb(p.video_poster)||'')}" alt="Video" loading="lazy" decoding="async"><button type="button" class="vplay" aria-label="Play video"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></button>${p.video_secs?`<span class="vdur">${fmtDur(p.video_secs)}</span>`:''}</div>`:'';
function post(p,o){
  o=o||{};
  const on=p.sames.includes(S.user.id),mine=p.author_id==S.user.id;
  const dots=DOTS;
  const imgs=(p.imgs&&p.imgs.length?`<div class="pimgs ${layCls(p.imgs.length,p.layout)}">${p.imgs.slice(0,6).map(u=>timg(u)).join('')}</div>`:'')+vidBlock(p);
  return `<article class="card" data-pi="${p.id}"${o.t?'':' tabindex="0"'}><div class="who"><span class="lk" onclick="openProfile('${p.author_id}')">${av(p.author_id)}</span><div class="grow"><b class="lk" onclick="openProfile('${p.author_id}')">${esc(nm(p.author_id))}${rb(p.author_id)}</b><div class="mute sm">${tmk(p.created_at)}${p.edited_at?' · edited':''}</div></div><button class="ghost more" onclick="${mine?`openPm('${p.id}')`:`openAx('post','${p.id}')`}" aria-label="More options">${dots}</button></div>${p.body?`<p>${rich(p.body)}</p>`:''}<div class="path">${p.tags.map(tgb).join('')}</div>${imgs}<div class="acts"><button class="like-btn ${on?'on':''}" onclick="same('${p.id}',this)" aria-label="Like">${ICO_HEART}</button>${o.t?'':`<button class="ghost ic" onclick="openThread('${p.id}')" aria-label="Reply">${ICO_REPLY}${p.rc?'<span>'+p.rc+'</span>':''}</button>`}<button class="ghost ic" onclick="share('${p.id}')" aria-label="Share">${ICO_SHARE}</button></div><div class="who2" onclick="openSames('${p.id}')">${sm(p)}</div></article>`;
}
const HP='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';
const ICO_HEART=`<span class="hw"><svg class="ho" viewBox="0 0 24 24" aria-hidden="true"><path d="${HP}"/></svg><svg class="hf" viewBox="0 0 24 24" aria-hidden="true"><path d="${HP}"/></svg><i class="hr"></i></span>`;
const ICO_REPLY='<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-6.5L8 20.5V17H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/><path d="M8 9h8M8 12.5h5"/></svg>';
const ICO_SHARE='<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/></svg>';

async function same(id,btn){
  const p=findPost(id),u=S.user.id,on=!p.sames.includes(u);
  const set=v=>{p.sames=v?[...p.sames,u]:p.sames.filter(x=>x!==u);document.querySelectorAll(`.card[data-pi="${id}"]`).forEach(c=>{c.querySelector('.like-btn').className='like-btn'+(v?' on pop':'');c.querySelector('.who2').innerHTML=sm(p)})};
  set(on);
  const r=on?await sb.from('sames').insert({post_id:p.id,user_id:u}):await sb.from('sames').delete().match({post_id:p.id,user_id:u});
  if(r.error){set(!on);toast("Couldn't save that")}else if(on)checkAch();
}

function openSames(id){
  const p=findPost(id);if(!p||!p.sames.length)return;
  const l=so(p);
  $('#slt').textContent=l.length+(l.length==1?' person liked this':' people liked this');
  S.sl={ids:l,n:SL_PAGE,empty:'',row:u=>`<div class="prow"><span class="lk" onclick="openProfile('${u}')">${av(u)}</span><b class="grow lk" onclick="openProfile('${u}')">${esc(u==S.user.id?'You':nm(u))}</b>${u==S.user.id?'':`<button class="btn sbtn" onclick="sayHi('${u}')"><span class="wave-btn">👋</span> Say hi</button>`}</div>`};
  slDraw();
  $('#sl').classList.add('on');
}
const rel=(p,l)=>p.tags.some(n=>l.has(n))?'like':p.tags.some(n=>[...l].some(m=>cat(m)==cat(n)))?'might':'new';
function home(){
  if(!['All','might','new'].includes(S.F)&&!S.mine.has(S.F)&&!(S.F=='fol'&&S.fol.size))S.F='All';
  $('#fl').innerHTML=[['All','All'],['might','Might like'],['new','New to you'],...(S.fol.size?[['fol','Following']]:[]),...[...S.mine].map(n=>[n,em(n)+' '+iname(n),col(n)])].map(t=>`<button class="fc ${t[0]===S.F?'on':''}" ${t[2]?`style="--c:${t[2]}"`:''} onclick='setF(${JSON.stringify(t[0])})'>${esc(t[1])}</button>`).join('');
  const F=S.F,l=F=='All'?S.posts.filter(p=>p.tags.length?rel(p,S.mine)=='like':casual(p)):F=='might'||F=='new'?S.posts.filter(p=>p.tags.length&&rel(p,S.snap)==F):F=='fol'?S.posts.filter(p=>S.fol.has(p.author_id)):S.posts.filter(p=>p.tags.includes(F));
  $('#feed').innerHTML=S.skel&&!S.posts.length?skPost().repeat(3):l.map(p=>post(p)).join('')||(S.fEnd?'<div class="empty">No posts here yet.<br>Tap + and write the first one.</div>':'');
  if(!(S.skel&&!S.posts.length)){
    $('#feed').insertAdjacentHTML('beforeend',S.fEnd?(S.posts.length>8?'<div class="mute sm" style="text-align:center;padding:18px 0 28px">You are all caught up</div>':''):
      `<div id="fmore" style="text-align:center;padding:16px 0 28px">${S.fBusy?'<span class="mute sm">Loading older posts...</span>':`<button class="btn off sbtn" onclick="morePosts()">${S.fErr?'Could not load. Tap to retry':'Load older posts'}</button>`}</div>`);
    watchMore();
  }
}
function setF(n){S.F=n;if(n=='might'||n=='new')S.snap=new Set(S.mine);home()}

// ---------- Compose Post ----------
function tapFab(){
  const pa=$('#sel').value,pb=$('#sel2').value;
  const o=[...S.mine].map(n=>`<option value="${n}">${em(n)} ${esc(iname(n))}</option>`).join('');
  $('#sel').innerHTML='<option value="">✨ Casual (no interest)</option>'+o;
  $('#sel2').innerHTML='<option value="">Mix with another interest (optional)</option>'+o;
  setSel($('#sel'),pa);setSel($('#sel2'),pb);restoreDraft();selUi('#sel','#sel2');phRender('p');
  $('#shr').textContent=S.pfail?'Retry':'Share';
  $('#fabBtn').classList.add('spin');$('#mod').classList.add('on');
}
function closePost(){
  if($('#mod').classList.contains('on')&&$('#txt').value.trim())toast('Draft saved');
  $('#fabBtn').classList.remove('spin');$('#mod').classList.remove('on');
}
function renderPhotos(){phRender('p')}
async function publish(){
  if(S.posting)return;
  if(muted())return;
  const v=$('#txt').value.trim(),a=+$('#sel').value,b=a?+$('#sel2').value:0;   // interest is optional: empty = casual post
  if(!v&&!S.photos.length&&!S.vid){$('#txt').focus();return}   // a photo alone is enough
  const btn=$('#shr');S.posting=true;btn.disabled=true;btn.textContent=S.photos.length||S.vid?'Uploading...':'Posting...';
  const done=()=>{S.posting=false;btn.disabled=false;btn.textContent=S.pfail?'Retry':'Share';renderPhotos();vidRender('p')};
  let bad=0;
  for(const ph of S.photos){
    if(ph.url)continue;
    ph.st='up';renderPhotos();
    try{ph.url=await upload('post-images',ph.blob,ph.tb);ph.st='ok'}catch(e){ph.st='fail';bad++}
    renderPhotos();
  }
  if(bad){done();toast(bad==1?'1 photo failed. Tap Retry, or remove it.':bad+' photos failed. Tap Retry, or remove them.');return}
  if(S.vid&&!S.vid.url){   // the video goes up after the photos; a retry skips what already uploaded
    S.vid.st='up';vidRender('p');
    try{
      if(!S.vid.purl)S.vid.purl=await upload('post-images',S.vid.poster,S.vid.tb);
      S.vid.url=await vidUpload(S.vid);S.vid.st='ok';
    }catch(e){S.vid.st='fail';vidRender('p');done();toast('Video upload failed. Tap Retry, or remove it.');return}
    vidRender('p');
  }
  btn.textContent='Posting...';
  let data=S.pfail?await alreadySent('posts','author_id',{},v):null,error=null;
  if(!data){const r=await sb.from('posts').insert({author_id:S.user.id,body:v,layout:clampLay(S.photos.length,S.pLay),...(S.vid?{video_url:S.vid.url,video_poster:S.vid.purl,video_secs:S.vid.secs}:{})}).select('id').single();data=r.data;error=r.error}
  if(error){S.pfail=true;done();toast(!v&&/check|constraint|violat/i.test(error.message||'')?'Photo-only posts need photo-only-posts.sql run in Supabase first.':errMsg(error)+' Tap Retry.');return}
  S.pfail=false;
  const tg=[...new Set([a,b].filter(Boolean))];
  const t=tg.length?await sb.from('post_interests').insert(tg.map(n=>({post_id:data.id,interest_id:n}))):{};
  let imgFail=false;
  if(S.photos.length){
    const urls=S.photos.map(p=>p.url);
    const r=await sb.from('post_images').insert(urls.map((url,i)=>({post_id:data.id,url,position:i})));
    if(r.error){imgFail=true;rmFiles('post-images',urls)}
  }
  S.posting=false;btn.disabled=false;btn.textContent='Share';
  S.photos.forEach(p=>p.blob&&URL.revokeObjectURL(p.prev));S.photos=[];S.pLay=0;renderPhotos();if(S.vid&&S.vid.prev)URL.revokeObjectURL(S.vid.prev);S.vid=null;vidRender('p');
  $('#txt').value='';clearDraft();closePost();S.F='All';
  await loadPosts();draw();$('#feed').scrollTop=0;
  toast(t.error?'Posted, but tags failed':imgFail?'Posted, but photos failed':'Posted');checkAch();
}

// ---------- Post Menu / Edit / Delete ----------
function openPm(id){
  S.pmId=id;const p=findPost(id);
  $('#pmEdit').style.display=p&&p.author_id==S.user.id?'':'none';
  $('#pm').classList.add('on');
}
function closePm(){$('#pm').classList.remove('on')}
function closeEd(){
  $('#ed').classList.remove('on');
  (S.edPh||[]).forEach(x=>{if(x.blob&&x.prev)URL.revokeObjectURL(x.prev);if(x.url&&!x.old)rmFiles('post-images',[x.url])});
  S.edPh=[];S.edVid=null;
}
function openEd(id){
  const p=findPost(id);if(!p)return;
  closePm();S.edId=id;S.edBusy=false;
  const o=[...new Set([...S.mine,...p.tags])].map(n=>`<option value="${n}">${em(n)} ${esc(iname(n))}</option>`).join('');
  $('#edsel').innerHTML='<option value="">✨ Casual (no interest)</option>'+o;
  $('#edsel2').innerHTML='<option value="">Mix with another interest (optional)</option>'+o;
  $('#edsel').value=p.tags[0]??'';$('#edsel2').value=p.tags[1]??'';selUi('#edsel','#edsel2');
  S.edOrig=[...(p.imgs||[])];S.edPh=S.edOrig.map(u=>({url:u,full:u,prev:thumb(u),old:true}));S.eLay=+p.layout||0;
  $('#edt').value=p.body;S.edOrigVid=p.video_url?{url:p.video_url,poster:p.video_poster,secs:p.video_secs}:null;
  S.edVid=S.edOrigVid?{...S.edOrigVid,old:true,prev:thumb(p.video_poster)}:null;
  $('#eds').textContent='Save';phRender('e');vidRender('e');$('#ed').classList.add('on');
}
async function saveEd(){
  if(S.edBusy)return;
  const id=S.edId,p=findPost(id),v=$('#edt').value.trim(),a=+$('#edsel').value,b=a?+$('#edsel2').value:0;
  if(!v&&!S.edPh.length&&!S.edVid){$('#edt').focus();return}
  S.edBusy=true;const btn=$('#eds');btn.disabled=true;btn.textContent='Saving...';
  const fin=()=>{S.edBusy=false;btn.disabled=false;btn.textContent='Save';phRender('e')};
  let bad=0;
  for(const ph of S.edPh){
    if(ph.url)continue;
    ph.st='up';phRender('e');
    try{ph.url=await upload('post-images',ph.blob,ph.tb);ph.st='ok'}catch(e){ph.st='fail';bad++}
    phRender('e');
  }
  if(bad){fin();toast(bad==1?'1 photo failed. Tap Save to retry, or remove it.':bad+' photos failed. Tap Save to retry, or remove them.');return}
  const urls=S.edPh.map(x=>x.url),orig=S.edOrig||[];
  const vidGone=!!S.edOrigVid&&!S.edVid;   // video removed in this edit
  const u=await sb.from('posts').update({body:v,layout:clampLay(urls.length,S.eLay),...(vidGone?{video_url:null,video_poster:null,video_secs:null}:{})}).eq('id',id).eq('author_id',S.user.id);
  if(u.error){fin();toast(u.error.message);return}
  if(vidGone){rmFiles('post-videos',[S.edOrigVid.url]);if(S.edOrigVid.poster)rmFiles('post-images',[S.edOrigVid.poster])}
  const want=[...new Set([a,b].filter(Boolean))];
  const unchanged=want.length===p.tags.length&&want.every(x=>p.tags.includes(x));
  if(!unchanged){
    const d=await sb.from('post_interests').delete().eq('post_id',id);
    if(!d.error&&want.length)await sb.from('post_interests').insert(want.map(n=>({post_id:id,interest_id:n})));
  }
  let imgFail=false;
  if(urls.length!==orig.length||urls.some((x,i)=>x!==orig[i])){   // photos added, removed, cropped or reordered
    const d=await sb.from('post_images').delete().eq('post_id',id);
    if(d.error)imgFail=true;
    else{
      const r=urls.length?await sb.from('post_images').insert(urls.map((url,i)=>({post_id:id,url,position:i}))):{};
      if(r.error){imgFail=true;if(orig.length)await sb.from('post_images').insert(orig.map((url,i)=>({post_id:id,url,position:i})))}   // put the old photos back
      else rmFiles('post-images',orig.filter(x=>!urls.includes(x)));
    }
    if(imgFail)rmFiles('post-images',urls.filter(x=>!orig.includes(x)));
  }
  S.edPh=[];S.edVid=null;S.edBusy=false;btn.disabled=false;btn.textContent='Save';$('#ed').classList.remove('on');
  await loadPosts();draw();toast(imgFail?'Saved, but photos failed':'Saved');
}
function delPost(id){
  closePm();
  confirmBox('Delete this post?','Delete',()=>{
    const p=findPost(id);if(!p)return;
    const imgs=[...(p.imgs||[])],vid=p.video_url?{u:p.video_url,p:p.video_poster}:null,ia=S.posts.findIndex(x=>x.id===id),ib=S.myPosts.findIndex(x=>x.id===id);
    undoable('Post deleted',()=>{
      S.posts=S.posts.filter(x=>x.id!==id);S.myPosts=S.myPosts.filter(x=>x.id!==id);
      if(S.th==String(id))closeThread();
      $('#pv').classList.remove('on');draw();
    },async()=>{
      const{data,error}=await sb.from('posts').delete().eq('id',id).select('id');
      if(error||!data||!data.length){
        if(ia>=0&&!S.posts.some(x=>x.id===id))S.posts.splice(Math.min(ia,S.posts.length),0,p);
        if(ib>=0&&!S.myPosts.some(x=>x.id===id))S.myPosts.splice(Math.min(ib,S.myPosts.length),0,p);
        draw();toast(error?error.message:"Couldn't delete the post");return;
      }
      if(imgs.length)rmFiles('post-images',imgs);
      if(vid){rmFiles('post-videos',[vid.u]);if(vid.p)rmFiles('post-images',[vid.p])}
      S.pm.delete(String(id));
    },()=>{
      if(ia>=0&&!S.posts.some(x=>x.id===id))S.posts.splice(Math.min(ia,S.posts.length),0,p);
      if(ib>=0&&!S.myPosts.some(x=>x.id===id))S.myPosts.splice(Math.min(ib,S.myPosts.length),0,p);
      draw();
    });
  });
}

// ---------- Replies ----------
const rep=r=>`<div class="rep" data-rid="${r.id}"><span class="lk" onclick="openProfile('${r.author_id}')">${av(r.author_id)}</span><div class="grow"><div><b class="lk" onclick="openProfile('${r.author_id}')">${esc(nm(r.author_id))}${rb(r.author_id)}</b> <span class="mute sm">${tmk(r.created_at)}${r.edited_at?' · edited':''}</span></div><div class="rbody">${rich(r.body)}</div></div><button class="ghost more" onclick="openAx('reply','${r.id}')" aria-label="More options">${DOTS}</button></div>`;
function renderThread(){
  const p=findPost(S.th);if(!p){closeThread();return}
  $('#thp').innerHTML=post(p,{t:1});
  $('#thr').innerHTML=S.reps===null?skRep().repeat(2):S.reps.length?S.reps.map(rep).join('')+(S.repMore?'<button class="btn off" style="width:100%;margin:8px 0" onclick="moreReplies()">Show more replies</button>':''):'<div class="empty">No replies yet.<br>Say something.</div>';
}
const REP_PAGE=30;
async function loadReplies(id,more,n){
  if(more&&S.repBusy)return;
  if(!more){S.reps=null;S.repOff=0;S.repMore=false;renderThread()}
  S.repBusy=true;
  const size=more?REP_PAGE:(n||REP_PAGE),off=more?S.repOff:0;
  let r=await sb.from('replies').select('id,body,created_at,edited_at,author_id').eq('post_id',id).order('created_at').range(off,off+size-1);
  if(r.error)r=await sb.from('replies').select('id,body,created_at,author_id').eq('post_id',id).order('created_at').range(off,off+size-1);   // before comment-edit.sql has been run
  S.repBusy=false;
  if(S.th!==id)return;
  if(r.error){toast('Could not load replies');if(!more)S.reps=[]}
  else{
    await getProfiles(r.data.map(x=>x.author_id));
    const add=r.data.filter(x=>!bl(x.author_id));
    S.reps=more?[...(S.reps||[]),...add]:add;
    S.repOff=off+r.data.length;S.repMore=r.data.length==size;
    const p=findPost(id);if(p&&!S.repMore)p.rc=S.repOff;
  }
  renderThread();focusReply();
}
function focusReply(){
  const f=S.thFocus;if(!f||S.th!==f.th||!S.reps)return;
  let best=null,bd=Infinity;
  S.reps.forEach(r=>{if(r.author_id==f.actor){const d=Math.abs(new Date(r.created_at)-new Date(f.at));if(d<bd){bd=d;best=r}}});
  if(!best){if(S.repMore&&f.tries++<5)loadReplies(S.th,true);else S.thFocus=null;return}
  S.thFocus=null;
  const el=document.querySelector('#thr .rep[data-rid="'+best.id+'"]');
  if(el){el.scrollIntoView({block:'center',behavior:'smooth'});el.classList.add('rflash');setTimeout(()=>el.classList.remove('rflash'),2000)}
}
function moreReplies(){if(S.th)loadReplies(S.th,true)}
function openThread(id,focus){S.th=String(id);S.thFocus=focus?{th:S.th,actor:focus.actor,at:focus.at,tries:0}:null;S.repOff=0;$('#rin').value=cdGet('r:'+S.th);$('#rrt').hidden=!(S.rfail&&S.rfail.th==S.th);$('#th').classList.add('on');['#thl','#thcols','#thbody'].forEach(x=>{const e=$(x);if(e)e.scrollTop=0});loadReplies(S.th)}
function closeThread(){S.th=null;S.thFocus=null;$('#rrt').hidden=true;$('#th').classList.remove('on')}
// ---------- edit a comment (post replies and event comments) ----------
let EC=null;
function editComment(kind,id){
  id=String(id);let cur;
  if(kind=='reply')cur=(S.reps||[]).find(x=>String(x.id)==id);
  else cur=(S.eventComments.get(S.evActiveId)||[]).find(x=>String(x.id)==id);
  if(!cur)return;
  EC={kind,id};$('#ect').value=cur.body;$('#ecs').disabled=false;$('#ecm').classList.add('on');
  setTimeout(()=>{const t=$('#ect');t.focus();t.setSelectionRange(t.value.length,t.value.length)},60);
}
function ecClose(){$('#ecm').classList.remove('on');EC=null}
async function ecSave(){
  if(!EC||muted())return;
  const v=$('#ect').value.trim();if(!v){$('#ect').focus();return}
  const e=EC,isR=e.kind=='reply',tbl=isR?'replies':'event_comments',own=isR?'author_id':'user_id';
  const cur=(isR?S.reps:S.eventComments.get(S.evActiveId)||[]).find(x=>String(x.id)==e.id);
  if(!cur||v===cur.body){ecClose();return}
  const b=$('#ecs');b.disabled=true;const now=new Date().toISOString();
  const upd=o=>sb.from(tbl).update(o).eq('id',e.id).eq(own,S.user.id).select('id');
  let r=await upd({body:v,edited_at:now});
  if(r.error&&/edited_at/.test(r.error.message||''))r=await upd({body:v});   // before comment-edit.sql has been run
  b.disabled=false;
  if(r.error||!r.data||!r.data.length){toast(r.error?errMsg(r.error):"Couldn't save that edit");return}
  cur.body=v;cur.edited_at=now;ecClose();
  if(isR)renderThread();else if(S.evActiveId&&$('#ev-ov').classList.contains('on'))renderEventFullscreen();
  toast('Saved');
}
async function sendReply(){
  const v=$('#rin').value.trim();if(!v||!S.th)return;
  if(muted())return;
  const b=$('#rsend');b.disabled=true;
  const retry=!!(S.rfail&&S.rfail.th==S.th&&S.rfail.v==v);
  let error=null;
  const dup=retry?await alreadySent('replies','author_id',{post_id:S.th},v):null;
  if(!dup){const r=await sb.from('replies').insert({post_id:S.th,author_id:S.user.id,body:v});error=r.error}
  b.disabled=false;
  if(error){S.rfail={th:S.th,v};$('#rrt').hidden=false;toast(errMsg(error));return}
  S.rfail=null;$('#rrt').hidden=true;
  $('#rin').value='';rdSet(S.th,'');await loadReplies(S.th,false,S.repMore?200:S.repOff+1);draw();$('#thbody').scrollTop=1e5;$('#thcols').scrollTop=1e5;checkAch();
}
function delReply(id){
  confirmBox('Delete this reply?','Delete',async()=>{
    const{data,error}=await sb.from('replies').delete().eq('id',id).select('id');
    if(error||!data||!data.length){toast(error?error.message:"Couldn't delete the reply");return}
    await loadReplies(S.th,false,Math.max(S.repOff,REP_PAGE));draw();
  });
}

// ---------- Discover ----------
function mix(q){
  const b={like:[],might:[],new:[]};
  const vis=p=>p.tags.length||p.author_id==S.user.id||S.fol.has(p.author_id);   // casual posts only for the poster and followers
  S.posts.forEach(p=>{if(vis(p)&&(p.body+nm(p.author_id)+p.tags.map(iname).join()).toLowerCase().includes(q))b[rel(p,S.mine)].push(p)});
  if(q===sqQ)(S.sres||[]).forEach(p=>{if(vis(p)&&!S.posts.some(x=>x.id===p.id))b[rel(p,S.mine)].push(p)});   // matches found on the server
  const pat=['like','like','new','like','might','like','new','like','like','new'],u={like:0,might:0,new:0},o=[],total=b.like.length+b.might.length+b.new.length;
  for(let k=0;o.length<total;k++){const t=pat[k%pat.length];if(u[t]<b[t].length)o.push(b[t][u[t]++])}
  return o;
}
// Discover search also looks through every post, not only the ones already loaded
let sqT=0,sqQ='';
function searchPostsSoon(q){
  if(q.length<2){clearTimeout(sqT);sqQ='';S.sres=[];return}
  if(q===sqQ)return;
  clearTimeout(sqT);sqQ=q;
  sqT=setTimeout(async()=>{
    if(q!==$('#q').value.toLowerCase())return;
    const r=await sb.from('posts').select(COLS).ilike('body','%'+q.replace(/[\%_]/g,'\$&')+'%').order('created_at',{ascending:false}).limit(30);
    if(r.error){sqQ='';return}
    const rows=await hydrate(r.data);
    if(q!==$('#q').value.toLowerCase())return;
    S.sres=rows.filter(p=>!bl(p.author_id));findTab();
  },350);
}
function findTab(){
  const q=$('#q').value.toLowerCase();searchPostsSoon(q);
  $('#ppl').innerHTML=S.skel&&!S.people.length?skPerson().repeat(4):S.people.map(p=>({p,c:p.ids.filter(x=>S.mine.has(x))})).filter(o=>(o.p.name+o.p.ids.map(iname).join()).toLowerCase().includes(q)).sort((a,b)=>b.c.length-a.c.length).map(o=>`<div class="card row tapc" onclick="openProfile('${o.p.id}')">${av(o.p.id)}<div class="grow"><b>${esc(o.p.name)}${rb(o.p.id)}</b><div class="mute sm">${o.c.length?'You both like':'Into'}</div><div>${(o.c.length?o.c:o.p.ids.slice(0,2)).map(chip).join('')}</div></div><div class="acol"><button class="btn" onclick="event.stopPropagation();sayHi('${o.p.id}')"><span class="wave-btn">👋</span> Say hi</button><button class="btn off sbtn" style="margin:0" onclick="event.stopPropagation();toggleFollow('${o.p.id}')">${S.fol.has(o.p.id)?'Following ✓':'Follow'}</button></div></div>`).join('')||'<div class="empty">No one else here yet.<br>Invite a friend to see them.</div>';
  $('#rooms').innerHTML=[...S.ints].filter(i=>i.name.toLowerCase().includes(q)).sort((a,b)=>S.mine.has(b.id)-S.mine.has(a.id)).map(i=>`<button class="room" onclick="openChat(${i.id})"><span>${em(i.id)}</span>${esc(i.name)}<small>${S.cnt[i.id]||0} ${S.cnt[i.id]==1?'member':'members'}</small></button>`).join('')||'<div class="empty">No circles found</div>';
  const m=mix(q);
  $('#fx').innerHTML=S.skel&&!S.posts.length?'<div class="gridx">'+'<div class="gt sk-b"></div>'.repeat(6)+'</div>':m.length?'<div class="gridx">'+m.map(p=>{
    const img=(p.imgs&&p.imgs[0])||p.video_poster;
    return `<button class="gt ${img?'has-img':''}" style="--c:${col(p.tags[0])}${img?`;background-image:linear-gradient(180deg,rgba(0,0,0,.1),rgba(0,0,0,.7)),url('${esc(thumb(img))}')`:''}" onclick="openPost('${p.id}')"><span class="ge">${em(p.tags[0])}</span><span class="gtx">${esc(p.body)}</span></button>`}).join('')+'</div>':'<div class="empty">Nothing found</div>';
}
function ftab(i){
  document.querySelectorAll('#ft button').forEach((b,k)=>b.classList.toggle('on',k==i));
  ['fp','fg','fx'].forEach((id,k)=>$('#'+id).style.display=k==i?'block':'none');
  $('#q').placeholder=['Search people','Search circles','Search posts'][i];$('#q').value='';findTab();
}
let pvFn=null;
function showPv(fn){pvFn=fn;$('#pv').classList.add('on');refreshPv()}
function refreshPv(){if(pvFn&&$('#pv').classList.contains('on'))$('#pvb').innerHTML=pvFn()}
function openPost(id){openThread(id)}
