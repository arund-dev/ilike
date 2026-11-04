// ---------- Post photos: crop, drag to reorder, grid layout (New post + Edit post) ----------
// k = 'p' (new post: S.photos, S.pLay) or 'e' (edit post: S.edPh, S.eLay)
// A photo is {prev, blob?, tb?, url?, full?, old?, st?}: old = already saved on the post
const PH_MAX=6;
const PH_IDS={p:{box:'#pph',cnt:'#pcnt',add:'#padd',lay:'#play'},e:{box:'#edph',cnt:'#edcnt',add:'#edadd',lay:'#edlay'}};
const phList=k=>k=='p'?S.photos:S.edPh;
const phLock=k=>k=='p'?!!S.posting:!!S.edBusy;
const BLANK='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const layPreview=(n,l)=>`<div class="pimgs mini ${layCls(n,l)}">${('<img src="'+BLANK+'" alt="">').repeat(n)}</div>`;

function phRender(k){
  const L=phList(k),I=PH_IDS[k],box=$(I.box);if(!box||!L)return;
  const lock=phLock(k),n=L.length,retry=k=='p'?'publish()':'saveEd()';
  box.innerHTML=L.map((ph,i)=>{
    const s=ph.st||'ready';
    const st=s=='up'?'<span class="phs"><i class="spn"></i></span>':s=='ok'?'<span class="phs ok">✓</span>':s=='fail'?`<button class="phs bad" onclick="${retry}">↻ Retry</button>`:'';
    const fb=ph.full?` onerror="this.onerror=null;this.src='${esc(ph.full)}'"`:'';
    const tools=lock?'':`<span class="pgrip" onpointerdown="phDrag(event,'${k}',${i})" aria-label="Drag to reorder" title="Drag to reorder">⠿</span><button class="pcrop" onclick="phCrop('${k}',${i})" aria-label="Crop photo"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2v14a2 2 0 0 0 2 2h14M2 6h14a2 2 0 0 1 2 2v14"/></svg></button><button onclick="phRm('${k}',${i})" aria-label="Remove photo">✕</button>`;
    return `<div class="ph ${s}"><img src="${esc(ph.prev)}"${fb} alt="Photo ${i+1}" draggable="false"><i class="pnum">${i+1}</i>${st}${tools}</div>`;
  }).join('');
  $(I.add).hidden=n>=PH_MAX||lock;
  const c=$(I.cnt);if(c){c.hidden=!n;c.textContent=n+'/6 photos'}
  const cur=clampLay(n,k=='p'?(S.pLay||0):(S.eLay||0));
  if(k=='p')S.pLay=cur;else S.eLay=cur;
  const lp=$(I.lay);
  if(lp){
    lp.hidden=n<2;
    lp.innerHTML=n<2?'':'<div class="mute sm" style="width:100%">Photo grid</div>'+Array.from({length:LAYS[n]},(_,l)=>`<button type="button" class="${l==cur?'on':''}" onclick="phSetLay('${k}',${l})" aria-label="Grid style ${l+1}" aria-pressed="${l==cur}">${layPreview(n,l)}</button>`).join('');
  }
}
function phSetLay(k,l){if(k=='p')S.pLay=l;else S.eLay=l;phRender(k)}

async function phPick(inp,k){
  const L=phList(k),room=PH_MAX-L.length,files=[...inp.files].slice(0,room);
  if(inp.files.length>room)toast('Up to 6 photos per post');inp.value='';
  if(!files.length)return;
  toast('Preparing photos...');
  for(const f of files){
    if(f.type&&!/^image\//.test(f.type)){toast('That file is not a photo');continue}
    if(f.size>25*1024*1024){toast('That photo is too big (25 MB max)');continue}
    try{const blob=await prep(f,1600,false),tb=await prep(blob,THUMB_MAX,false);L.push({blob,tb,prev:URL.createObjectURL(blob),st:'ready'})}
    catch(e){toast(e.message)}
  }
  phRender(k);
}
function phRm(k,i){
  if(phLock(k))return;
  const L=phList(k),ph=L[i];if(!ph)return;
  if(ph.blob&&ph.prev)URL.revokeObjectURL(ph.prev);
  if(ph.url&&!ph.old)rmFiles('post-images',[ph.url]);
  L.splice(i,1);phRender(k);
}

// ----- drag to reorder (grab the ⠿ handle) -----
let DG=null;
function phDrag(e,k,i){
  if(e.button>0||phLock(k))return;
  const tiles=[...$(PH_IDS[k].box).children];if(tiles.length<2)return;
  e.preventDefault();
  DG={k,i,to:i,tiles,rects:tiles.map(t=>t.getBoundingClientRect()),sx:e.clientX,sy:e.clientY};
  tiles[i].classList.add('drag');
  try{e.target.setPointerCapture(e.pointerId)}catch(x){}
  addEventListener('pointermove',dgMove);addEventListener('pointerup',dgEnd);addEventListener('pointercancel',dgEnd);
}
function dgMove(e){
  if(!DG)return;
  const dx=e.clientX-DG.sx,dy=e.clientY-DG.sy,r=DG.rects[DG.i];
  DG.tiles[DG.i].style.transform=`translate(${dx}px,${dy}px) scale(1.05)`;
  const cx=r.left+r.width/2+dx,cy=r.top+r.height/2+dy;let to=DG.i;
  DG.rects.forEach((q,j)=>{if(cx>=q.left&&cx<=q.right&&cy>=q.top&&cy<=q.bottom)to=j});
  if(to!==DG.to){DG.tiles.forEach(t=>t.classList.remove('tgt'));if(to!==DG.i)DG.tiles[to].classList.add('tgt');DG.to=to}
}
function dgEnd(){
  removeEventListener('pointermove',dgMove);removeEventListener('pointerup',dgEnd);removeEventListener('pointercancel',dgEnd);
  const d=DG;DG=null;if(!d)return;
  d.tiles.forEach(t=>{t.classList.remove('drag','tgt');t.style.transform=''});
  if(d.to!==d.i){const L=phList(d.k),m=L.splice(d.i,1)[0];L.splice(d.to,0,m);phRender(d.k)}
}

// ----- crop: drag to move, pinch / wheel / slider to zoom, pick a shape -----
let PC=null;
async function phCrop(k,i){
  const it=phList(k)[i];if(!it||phLock(k))return;
  if(PC){URL.revokeObjectURL(PC.src);PC=null}   // left open by the Back button
  let src;
  try{
    if(it.blob)src=URL.createObjectURL(it.blob);
    else{const r=await fetch(it.full||it.url);if(!r.ok)throw 0;src=URL.createObjectURL(await r.blob())}
  }catch(e){toast("Couldn't open that photo to crop");return}
  PC={k,it,src,ready:false};
  const im=$('#pci');
  im.onload=pcInit;
  im.onerror=()=>{toast("Couldn't open that photo to crop");pcClose()};
  im.src=src;
  $('#pcr').classList.add('on');
}
function pcInit(){
  if(!PC)return;
  const im=$('#pci');PC.nw=im.naturalWidth;PC.nh=im.naturalHeight;
  im.style.width=PC.nw+'px';im.style.height=PC.nh+'px';
  PC.opts=[['Original',PC.nw/PC.nh],['1:1',1],['4:5',4/5],['16:9',16/9]];PC.ratio=PC.opts[0][1];PC.sel=0;
  $('#pcrr').innerHTML=PC.opts.map((o,j)=>`<button type="button" class="${j==0?'on':''}" onclick="pcRatio(${j})">${o[0]}</button>`).join('');
  PC.ready=true;pcReset();
}
function pcRatio(j){
  if(!PC||!PC.ready)return;
  PC.sel=j;PC.ratio=PC.opts[j][1];
  [...$('#pcrr').children].forEach((b,x)=>b.classList.toggle('on',x==j));
  pcReset();
}
function pcReset(){
  const st=$('#pcs'),sw=st.clientWidth,sh=st.clientHeight,pad=18,W=sw-pad*2,H=sh-pad*2;
  let fw=W,fh=W/PC.ratio;if(fh>H){fh=H;fw=H*PC.ratio}
  Object.assign(PC,{fw,fh,fx:(sw-fw)/2,fy:(sh-fh)/2,min:Math.max(fw/PC.nw,fh/PC.nh)});
  $('#pcf').style.cssText=`left:${PC.fx}px;top:${PC.fy}px;width:${fw}px;height:${fh}px`;
  PC.s=PC.min;PC.x=PC.fx+(fw-PC.nw*PC.s)/2;PC.y=PC.fy+(fh-PC.nh*PC.s)/2;pcPlace();
}
function pcPlace(){
  const s=PC.s;
  PC.x=Math.min(PC.fx,Math.max(PC.fx+PC.fw-PC.nw*s,PC.x));
  PC.y=Math.min(PC.fy,Math.max(PC.fy+PC.fh-PC.nh*s,PC.y));
  $('#pci').style.transform=`translate(${PC.x}px,${PC.y}px) scale(${s})`;
  $('#pcz').value=Math.round((s/PC.min-1)/3*100);
}
function pcZoom(s,cx,cy){
  s=Math.min(PC.min*4,Math.max(PC.min,s));
  const f=s/PC.s;PC.x=cx-(cx-PC.x)*f;PC.y=cy-(cy-PC.y)*f;PC.s=s;pcPlace();
}
function pcSlide(v){if(PC&&PC.ready)pcZoom(PC.min*(1+3*v/100),PC.fx+PC.fw/2,PC.fy+PC.fh/2)}
function pcClose(){
  $('#pcr').classList.remove('on');
  if(PC){URL.revokeObjectURL(PC.src);PC=null}
  const im=$('#pci');im.onload=im.onerror=null;im.removeAttribute('src');
}
async function pcDone(){
  if(!PC||!PC.ready)return;
  const btn=$('#pcd');btn.disabled=true;
  try{
    const s=PC.s;let sw=PC.fw/s,sh=PC.fh/s;
    const sx=Math.max(0,Math.min(PC.nw-sw,(PC.fx-PC.x)/s)),sy=Math.max(0,Math.min(PC.nh-sh,(PC.fy-PC.y)/s));
    sw=Math.min(sw,PC.nw);sh=Math.min(sh,PC.nh);
    const w=Math.min(1600,Math.round(sw)),h=Math.max(1,Math.round(w*sh/sw));
    const c=document.createElement('canvas');c.width=w;c.height=h;
    const g=c.getContext('2d');g.imageSmoothingQuality='high';g.drawImage($('#pci'),sx,sy,sw,sh,0,0,w,h);
    const blob=await new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(new Error('Could not crop that photo')),'image/jpeg',.88));
    const tb=await prep(blob,THUMB_MAX,false),it=PC.it,k=PC.k;
    if(it.blob&&it.prev)URL.revokeObjectURL(it.prev);
    if(it.url&&!it.old)rmFiles('post-images',[it.url]);
    Object.assign(it,{blob,tb,prev:URL.createObjectURL(blob),url:undefined,full:undefined,old:false,st:'ready'});
    pcClose();phRender(k);
  }catch(e){toast(e.message||"Couldn't crop that photo")}
  btn.disabled=false;
}
(()=>{
  const st=$('#pcs');if(!st)return;
  const P=new Map();let d0=0,s0=1;
  const pos=e=>{const r=st.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]};
  st.addEventListener('pointerdown',e=>{
    if(!PC||!PC.ready)return;
    try{st.setPointerCapture(e.pointerId)}catch(x){}
    P.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(P.size==2){const[a,b]=[...P.values()];d0=Math.hypot(a.x-b.x,a.y-b.y)||1;s0=PC.s}
  });
  st.addEventListener('pointermove',e=>{
    const p=P.get(e.pointerId);if(!p||!PC||!PC.ready)return;
    if(P.size==1){PC.x+=e.clientX-p.x;PC.y+=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;pcPlace()}
    else{
      p.x=e.clientX;p.y=e.clientY;
      const[a,b]=[...P.values()],r=st.getBoundingClientRect();
      pcZoom(s0*Math.hypot(a.x-b.x,a.y-b.y)/d0,(a.x+b.x)/2-r.left,(a.y+b.y)/2-r.top);
    }
  });
  const up=e=>{P.delete(e.pointerId)};
  st.addEventListener('pointerup',up);st.addEventListener('pointercancel',up);
  st.addEventListener('wheel',e=>{
    if(!PC||!PC.ready)return;
    e.preventDefault();const[x,y]=pos(e);pcZoom(PC.s*(e.deltaY<0?1.08:1/1.08),x,y);
  },{passive:false});
  $('#pcz')?.addEventListener('input',e=>pcSlide(+e.target.value));
  $('#sel')?.addEventListener('change',()=>selUi('#sel','#sel2'));
  $('#edsel')?.addEventListener('change',()=>selUi('#edsel','#edsel2'));
})();
