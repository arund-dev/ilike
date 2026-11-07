// ---------- Video posts: one video (up to 60 s and 50 MB) with a thumbnail taken from the video ----------
// k = 'p' (new post: S.vid) or 'e' (edit post: S.edVid, remove only)
const VID_MAX_SECS=60,VID_MAX_BYTES=50*1024*1024;   // 50 MB = the Supabase free-plan upload limit
const vidOf=k=>k=='p'?S.vid:S.edVid;
const vidSet=(k,v)=>{if(k=='p')S.vid=v;else S.edVid=v};
const vidLock=k=>k=='p'?!!S.posting:!!S.edBusy;

// reads the length and grabs a frame for the thumbnail (also proves this browser can open the file)
function vidProbe(file){
  return new Promise((res,rej)=>{
    const url=URL.createObjectURL(file),v=document.createElement('video');
    v.muted=true;v.playsInline=true;v.preload='auto';
    let t;const fail=m=>{clearTimeout(t);v.removeAttribute('src');URL.revokeObjectURL(url);rej(new Error(m))};
    t=setTimeout(()=>fail("This video format isn't supported here"),15000);
    v.onerror=()=>fail("This video format isn't supported here");
    v.onloadedmetadata=()=>{
      if(!isFinite(v.duration)||v.duration<=0)return fail("Couldn't read that video");
      if(v.duration>VID_MAX_SECS+0.5)return fail('Videos can be up to 1 minute. Please trim it first.');
    };
    v.onloadeddata=()=>{if(isFinite(v.duration)&&v.duration>0)v.currentTime=Math.min(1,v.duration/2)};   // grab a frame once one is ready
    v.onseeked=()=>{
      try{
        const w=v.videoWidth,h=v.videoHeight;if(!w||!h)return fail("Couldn't read that video");
        const sc=Math.min(1,1280/Math.max(w,h)),c=document.createElement('canvas');
        c.width=Math.round(w*sc);c.height=Math.round(h*sc);
        c.getContext('2d').drawImage(v,0,0,c.width,c.height);
        c.toBlob(b=>{
          if(!b)return fail("Couldn't read that video");
          clearTimeout(t);const secs=v.duration;v.removeAttribute('src');res({url,secs,poster:b});
        },'image/jpeg',.82);
      }catch(e){fail("Couldn't read that video")}
    };
    v.src=url;
  });
}
async function vidPick(inp,k){
  k=k||'p';const f=inp.files[0];inp.value='';if(!f||vidLock(k))return;
  if(S.photos.length){toast('A post can have photos or one video');return}
  if(vidOf(k)){toast('Remove the current video first');return}
  if(f.type&&!/^video\//.test(f.type)){toast('That file is not a video');return}
  if(f.size>VID_MAX_BYTES){toast('That video is too big (50 MB max). Try a shorter clip.');return}
  toast('Preparing video...');
  try{
    const r=await vidProbe(f),tb=await prep(r.poster,THUMB_MAX,false);
    URL.revokeObjectURL(r.url);
    vidSet(k,{file:f,prev:URL.createObjectURL(r.poster),poster:r.poster,tb,secs:Math.round(r.secs),st:'ready'});
  }catch(e){toast(e.message||"Couldn't read that video")}
  vidRender(k);phRender(k);
}
// uploads the video file and returns its public link (the thumbnail goes through the normal photo upload)
async function vidUpload(v){
  const type=v.file.type||'video/mp4',ext=(v.file.name||'').split('.').pop().toLowerCase();
  const e=/^(mp4|mov|webm|m4v|3gp)$/.test(ext)?ext:type.includes('quicktime')?'mov':type.includes('webm')?'webm':'mp4';
  const path=`${S.user.id}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${e}`,st=sb.storage.from('post-videos');
  const{error}=await st.upload(path,v.file,{contentType:type,cacheControl:'31536000'});
  if(error)throw error;
  return st.getPublicUrl(path).data.publicUrl;
}
function vidRender(k){
  const box=$(k=='p'?'#vbox':'#edvbox'),v=vidOf(k);if(!box)return;
  const lock=vidLock(k);
  box.hidden=!v;
  box.innerHTML=v?`<div class="vtile"><img src="${esc(v.prev)}" alt="Video thumbnail"><span class="vplay mini"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></span><span class="vdur">${fmtDur(v.secs)}</span>${v.st=='up'?'<span class="vst">Uploading video...</span>':v.st=='fail'?'<button type="button" class="vst bad" onclick="publish()">↻ Retry upload</button>':''}${lock?'':`<button type="button" class="vrm" onclick="vidRm('${k}')" aria-label="Remove video">✕</button>`}</div>`:'';
}
function vidRm(k){
  if(vidLock(k))return;
  const v=vidOf(k);if(!v)return;
  if(v.prev&&!v.old)URL.revokeObjectURL(v.prev);
  if(v.url&&!v.old){rmFiles('post-videos',[v.url]);if(v.purl)rmFiles('post-images',[v.purl])}   // already uploaded by an earlier attempt
  vidSet(k,null);vidRender(k);phRender(k);
}

// ---------- videos in the feed: play while on screen, pause when scrolled away ----------
// Autoplay is muted (browsers require it); if you unmute one, the next ones start with sound.
// A video you pause yourself stays paused for 1 minute. If you scroll away and come back after a minute, the pause is forgotten and it starts again from the beginning.
const VID_HOLD_MS=60*1000;
function vidMake(el){
  const v=document.createElement('video'),im=el.querySelector('img');
  v.src=el.dataset.v;v.controls=true;v.loop=true;v.playsInline=true;v.setAttribute('playsinline','');v.preload='auto';v.muted=!S.vSound;
  if(im&&im.currentSrc)v.poster=im.currentSrc;   // thumbnail shows inside the player until the first frame
  v.addEventListener('pause',()=>{if(v._sys){v._sys=false;return}if(!v.ended)el._up=Date.now()});   // paused by hand
  v.addEventListener('play',()=>{el._up=0});
  v.addEventListener('volumechange',()=>{if(v._vol){v._vol=false;return}S.vSound=!v.muted});
  v.addEventListener('error',()=>{vidReset(el);el._noAuto=true;toast("This video can't be played on this device")});
  el.classList.add('playing');el.appendChild(v);
  return v;
}
function vidPlay(el,v){
  const pr=v.play();
  if(pr&&pr.catch)pr.catch(()=>{
    if(!v.muted){v._vol=true;v.muted=true;v.play().catch(()=>{vidReset(el);el._noAuto=true})}   // sound not allowed: try muted
    else{vidReset(el);el._noAuto=true}   // autoplay blocked: poster and play button stay for a tap
  });
}
function vidPause(el){const v=el.querySelector('video');if(v&&!v.paused){v._sys=true;v.pause()}}
function vidReset(el){
  const v=el.querySelector('video');
  if(v){v._sys=true;v.pause();v.removeAttribute('src');v.remove()}
  el.classList.remove('playing');
}
function vidAuto(el){
  if(el._noAuto)return;
  const v0=el.querySelector('video'),away=el._left?Date.now()-el._left:0;
  el._left=0;
  if(away>=VID_HOLD_MS){el._up=0;if(v0)v0.currentTime=0}   // scrolled away for a minute: forget the pause and start over
  else if(el._up&&Date.now()-el._up<VID_HOLD_MS)return;     // you paused it less than a minute ago
  el._up=0;
  const v=v0||vidMake(el);
  if(v.paused&&v.src)vidPlay(el,v);
}
function playVid(el){   // tap on the poster or its play button
  if(el.classList.contains('playing'))return;
  el._noAuto=false;el._up=0;
  const v=vidMake(el);v.muted=false;S.vSound=true;
  document.querySelectorAll('.pvid').forEach(x=>{if(x!==el)vidPause(x)});
  vidPlay(el,v);
}
function vidTick(){
  const list=[...document.querySelectorAll('.pvid')];if(!list.length)return;
  const layer=document.querySelector('.mod.on,.ov.on'),vh=innerHeight;
  let best=null,bd=1e9;
  list.forEach(el=>{
    const r=el.getBoundingClientRect();
    const ok=document.visibilityState!='hidden'&&el.offsetParent&&r.height>0&&(!layer||el.closest('.mod.on,.ov.on'));   // behind a panel counts as hidden
    el._ratio=ok?Math.max(0,Math.min(r.bottom,vh)-Math.max(r.top,0))/r.height:0;
    if(el._ratio>=.6){const d=Math.abs((r.top+r.bottom)/2-vh/2);if(d<bd){bd=d;best=el}}
  });
  list.forEach(el=>{
    if(el===best)vidAuto(el);
    else{vidPause(el);if(el.querySelector('video')&&!el._left)el._left=Date.now()}   // remember when it left the screen
  });
}
let vtRaf=0;
function vidTickSoon(){if(!vtRaf)vtRaf=requestAnimationFrame(()=>{vtRaf=0;vidTick()})}
document.addEventListener('scroll',vidTickSoon,true);
addEventListener('resize',vidTickSoon);
document.addEventListener('visibilitychange',vidTickSoon);
new MutationObserver(vidTickSoon).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});   // feed redraws, panels opening and closing
