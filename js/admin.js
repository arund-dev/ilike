async function admAddArtist(){
  const name=$('#mla').value.trim().replace(/\s+/g,' ');
  if(name.length<2||name.length>40){toast('Artist names are 2 to 40 characters');return}
  const k=nameKey(name),dup=S.ints.find(i=>k?nameKey(i.name)==k:i.name.toLowerCase()==name.toLowerCase());
  if(dup){toast('Already listed as "'+dup.name+'"');return}
  const sim=similarTo(name,'artist');
  if(sim.length){dupAsk(name,sim,null,()=>admCreateArtist(name));return}
  return admCreateArtist(name);
}
async function admCreateArtist(name){
  const color=PAL[[...name].reduce((a,c)=>a+c.charCodeAt(0),0)%PAL.length];
  const r=await sb.from('interests').insert({name,emoji:'🎤',color,category:'Artists',kind:'artist'}).select().single();
  if(r.error){toast(r.error.code=='23505'?'That artist is already listed':r.error.message);return}
  await loadInts();drawLists();toast('Added '+name);
}
function admDupes(){
  const arts=S.ints.filter(i=>i.kind=='artist'),pairs=[];
  arts.forEach(x=>similarTo(x.name,'artist',x.id,true).forEach(y=>{if(y.id>x.id)pairs.push([x.id,y.id])}));
  $('#slt').textContent=pairs.length?'Possible duplicates ('+pairs.length+')':'Possible duplicates';
  S.sl={ids:pairs.map((p,i)=>i),n:SL_PAGE,empty:'<div class="empty">No look-alikes found. 🎉</div>',
    row:i=>{const[x,y]=pairs[i];return `<div class="prow lk" onclick="admPair(${x},${y})"><b class="grow">${esc(iname(x))} <span class="mute">and</span> ${esc(iname(y))}</b><span class="mute sm">Merge</span></div>`}};
  slDraw();$('#sl').classList.add('on');
}
function admPair(x,y){
  $('#sl').classList.remove('on');
  const[src,dst]=(S.cnt[x]||0)<=(S.cnt[y]||0)?[x,y]:[y,x];
  S.mg=src;admDoMerge(dst);
}
function admArt(id){S.am=id;$('#amt').textContent=iname(id);$('#am').classList.add('on')}
function admRename(){
  $('#am').classList.remove('on');$('#rni').value=iname(S.am);$('#rne').textContent='';$('#rn').classList.add('on');
}
async function admSaveRename(){
  const name=$('#rni').value.trim().replace(/\s+/g,' '),id=S.am;
  if(name.length<2||name.length>40){$('#rne').textContent='Artist names are 2 to 40 characters';return}
  const k=nameKey(name),dup=S.ints.find(i=>i.id!=id&&(k?nameKey(i.name)==k:i.name.toLowerCase()==name.toLowerCase()));
  if(dup){$('#rne').textContent='"'+dup.name+'" already exists. Use Merge instead.';return}
  const r=await sb.from('interests').update({name}).eq('id',id).select('id');
  if(r.error||!r.data||!r.data.length){$('#rne').textContent=r.error?r.error.message:"Couldn't rename it";return}
  $('#rn').classList.remove('on');await loadInts();draw();drawLists();toast('Renamed');
}
function admMerge(){
  $('#am').classList.remove('on');S.mg=S.am;$('#mgs').value='';$('#mgt').textContent='Merge "'+iname(S.mg)+'" into...';drawMg();$('#mg').classList.add('on');
}
function drawMg(){
  const q=$('#mgs').value.toLowerCase();
  $('#mgl').innerHTML=S.ints.filter(i=>i.kind=='artist'&&i.id!=S.mg&&i.name.toLowerCase().includes(q)).sort((a,b)=>a.name.localeCompare(b.name)).slice(0,40).map(i=>`<div class="prow lk" onclick="admDoMerge(${i.id})"><b class="grow">${em(i.id)} ${esc(i.name)}</b></div>`).join('')||'<div class="empty">No other artists</div>';
}
function admDoMerge(t){
  const s=S.mg;
  confirmBox('Merge "'+iname(s)+'" into "'+iname(t)+'"? Members and posts move over.','Merge',async()=>{
    const{error}=await sb.rpc('merge_interests',{source:s,target:t});
    if(error){toast(error.message);return}
    $('#mg').classList.remove('on');await refreshInterests();drawLists();toast('Merged');
  });
}
function admDelete(){
  const id=S.am;$('#am').classList.remove('on');
  confirmBox('Delete "'+iname(id)+'"? It is removed from everyone\'s profile.','Delete',async()=>{
    const{error}=await sb.rpc('remove_interest',{target:id});
    if(error){toast(error.message);return}
    await refreshInterests();drawLists();toast('Deleted');
  });
}
async function refreshInterests(){
  await loadInts();
  const u=await sb.from('user_interests').select('interest_id').eq('user_id',S.user.id);
  if(u.data)S.mine=new Set(u.data.map(r=>r.interest_id));
  draw();
}
