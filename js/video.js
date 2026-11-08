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

// ---------- videos in the feed ----------
// Feed: plays with sound while on screen, pauses when scrolled away, only a mute button is shown, a tap pauses / resumes.
// Opened post: the player's own controls (no download or playback speed).
// Browsers may start a video muted until you have tapped something on the page; the mute button shows the real state.
// A video you pause yourself stays paused for 1 minute. Scroll away and come back after a minute: the pause is forgotten and it starts from the beginning.
const VID_HOLD_MS=60*1000;
const VST=new Map(),VKEEP=new Map();   // per video link: pause / away times, and the player kept alive across feed redraws
const vst=u=>{let s=VST.get(u);if(!s){s={up:0,left:0,noAuto:false,pos:0};VST.set(u,s)}return s};
const VI_ON='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 8a5 5 0 0 1 0 8M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
const VI_OFF='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';
function vidIcon(v){if(v._btn){v._btn.innerHTML=v.muted?VI_OFF:VI_ON;v._btn.setAttribute('aria-label',v.muted?'Unmute':'Mute')}}
function vidKill(v){v._dead=true;v._sys=true;try{v.pause()}catch(e){}v.removeAttribute('src');VKEEP.delete(v._url)}
function vidMake(el){
  const url=el.dataset.v,full=!!el.closest('#th'),s=vst(url);
  let v=VKEEP.get(url);
  if(v&&(v.isConnected||v._dead))v=null;   // still on the page elsewhere, or broken: start a fresh one
  const reuse=!!v;
  if(!v){
    v=document.createElement('video');v._url=url;
    v.src=url;v.loop=true;v.playsInline=true;v.setAttribute('playsinline','');v.preload='auto';
    v.disablePictureInPicture=true;v.setAttribute('disableremoteplayback','');
    v.muted=!S.vSound;   // S.vSound starts on: videos start with sound
    if(el.dataset.p)v.poster=el.dataset.p;
    if(s.pos){const p=s.pos;s.pos=0;v.addEventListener('loadedmetadata',()=>{try{v.currentTime=p}catch(e){}},{once:true})}
    const spin=on=>{if(v._el)v._el.classList.toggle('loading',on)};   // circle while the video is loading or buffering
    v.addEventListener('waiting',()=>{if(!v.paused)spin(true)});
    v.addEventListener('stalled',()=>{if(!v.paused&&v.readyState<3)spin(true)});
    v.addEventListener('canplay',()=>{if(!v.paused)spin(false)});
    v.addEventListener('pause',()=>{
      spin(false);
      if(v._sys){v._sys=false;return}
      if(!v.isConnected||v.ended)return;   // taken off the page by a redraw: not a pause by hand
      vst(url).up=Date.now();if(v._el)v._el.classList.add('paused');
    });
    v.addEventListener('play',()=>{vst(url).up=0;if(v._el)v._el.classList.remove('paused')});
    v.addEventListener('playing',()=>{spin(false);if(v._el)v._el.classList.add('live')});   // first frame is showing: hide the poster and the circle
    v.addEventListener('volumechange',()=>{vidIcon(v);if(v._vol){v._vol=false;return}S.vSound=!v.muted});
    v.addEventListener('error',()=>{const e=v._el;vst(url).noAuto=true;if(e)vidReset(e);else vidKill(v);toast("This video can't be played on this device")});
    VKEEP.set(url,v);
  }
  v._el=el;
  v.controls=full;
  if(full)v.setAttribute('controlsList','nodownload noplaybackrate');else v.removeAttribute('controlslist');
  el.classList.add('playing');
  if(reuse&&v.readyState>=2)el.classList.add('live');
  if(!(reuse&&v.readyState>=3&&!v.paused))el.classList.add('loading');
  el.querySelectorAll('.vspin').forEach(b=>b.remove());
  const sp=document.createElement('div');sp.className='vspin';el.appendChild(sp);
  if(v.paused&&s.up&&Date.now()-s.up<VID_HOLD_MS)el.classList.add('paused');
  el.appendChild(v);
  el.querySelectorAll('.vmute').forEach(b=>b.remove());
  v._btn=null;
  if(!full){   // feed: a mute button is the only control
    const b=document.createElement('button');b.type='button';b.className='vmute';
    b.onclick=e=>{e.stopPropagation();v.muted=!v.muted;S.vSound=!v.muted};
    v._btn=b;el.appendChild(b);vidIcon(v);
  }
  return v;
}
function vidPlay(el,v){
  const pr=v.play();
  if(pr&&pr.catch)pr.catch(()=>{
    if(!v.muted){v._vol=true;v.muted=true;v.play().catch(()=>{vst(el.dataset.v).noAuto=true;vidReset(el)})}   // sound not allowed yet: play muted
    else{vst(el.dataset.v).noAuto=true;vidReset(el)}   // autoplay blocked: poster and play button stay for a tap
  });
}
function vidPause(el){const v=el.querySelector('video');if(v&&!v.paused){v._sys=true;v.pause()}}
function vidReset(el){
  const v=el.querySelector('video');if(v){v.remove();vidKill(v)}
  el.querySelectorAll('.vmute').forEach(b=>b.remove());
  el.querySelectorAll('.vspin').forEach(b=>b.remove());
  el.classList.remove('playing','live','paused','loading');
}
function vidAuto(el){
  const url=el.dataset.v,s=vst(url);
  if(s.noAuto)return;
  const kept=VKEEP.get(url),v0=el.querySelector('video')||(kept&&!kept.isConnected&&!kept._dead?kept:null);
  if(!v0){   // start only after the page has loaded and it has been the video in view for a moment (not while the feed is still redrawing or flying past)
    if(document.readyState!=='complete'){setTimeout(vidTickSoon,300);return}
    const now=Date.now();if(!el._since)el._since=now;
    if(now-el._since<250){setTimeout(vidTickSoon,280);return}
  }
  const away=s.left?Date.now()-s.left:0;s.left=0;
  if(away>=VID_HOLD_MS){s.up=0;s.pos=0;if(v0)v0.currentTime=0}   // away for a minute: forget the pause and start over
  else if(s.up&&Date.now()-s.up<VID_HOLD_MS)return;               // you paused it less than a minute ago
  s.up=0;
  const v=el.querySelector('video')||vidMake(el);
  if(v.paused&&v.src)vidPlay(el,v);
}
function playVid(el){   // tap on the video, its poster or the play button
  const s=vst(el.dataset.v),v=el.querySelector('video');
  if(v&&el.closest('#th'))return;   // opened post: the player's own controls
  if(v){if(v.paused){s.up=0;vidPlay(el,v)}else v.pause();return}   // feed: a tap pauses or resumes
  s.noAuto=false;s.up=0;
  const nv=vidMake(el);nv.muted=false;S.vSound=true;   // a tap is allowed to start with sound
  document.querySelectorAll('.pvid').forEach(x=>{if(x!==el)vidPause(x)});
  vidPlay(el,nv);
}
function vidTick(){
  const now=Date.now();
  VKEEP.forEach((v,u)=>{   // forget a player that has been off the page for a few seconds
    if(v.isConnected){v._gone=0;return}
    if(!v._gone){v._gone=now;return}
    if(now-v._gone>5000){vst(u).pos=v.currentTime||0;vidKill(v)}
  });
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
    else{el._since=0;vidPause(el);if(el.querySelector('video')){const s=vst(el.dataset.v);if(!s.left)s.left=now}}   // remember when it left the screen
  });
}
let vtRaf=0;
function vidTickSoon(){if(!vtRaf)vtRaf=requestAnimationFrame(()=>{vtRaf=0;vidTick()})}
document.addEventListener('scroll',vidTickSoon,true);
addEventListener('resize',vidTickSoon);
addEventListener('load',vidTickSoon);
document.addEventListener('visibilitychange',vidTickSoon);
new MutationObserver(vidTickSoon).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});   // feed redraws, panels opening and closing
