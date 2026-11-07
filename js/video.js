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
