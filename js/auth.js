// ---------- Auth ----------
const authMsg=e=>{const m=(e&&e.message)||'';
  return /invalid login/i.test(m)?'Wrong email or password.'
  :/not confirmed/i.test(m)?'Please confirm your email first. Check your inbox and spam folder.'
  :/already registered/i.test(m)?'That email already has an account. Log in instead.'
  :/rate limit|too many|security purposes/i.test(m)?'Too many tries. Wait a few minutes and try again.'
  :/database error saving new user/i.test(m)?"That invite code isn't valid or has been used up."
  :/password/i.test(m)&&/least|short|weak/i.test(m)?'That password is too short or too weak.'
  :m||'Something went wrong. Try again.'};
function keep(o){for(const k in o){const el=document.getElementById(k);if(el&&o[k])el.value=o[k]}}
function renderAuth(){
  const su=S.mode=='signup';
  $('#af').innerHTML=`${su?'<input class="fi" id="an" placeholder="Your name" autocomplete="name" maxlength="40">':''}<input class="fi" id="ae" type="email" placeholder="Email" autocomplete="email">${su?'<input class="fi" id="ai" placeholder="Invite code" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="40">':''}<input class="fi" id="ap" type="password" placeholder="${su?'Password (8+ characters)':'Password'}" autocomplete="${su?'new':'current'}-password" onkeydown="if(event.key==='Enter')go()"><div class="err ${S.good?'ok':''}">${esc(S.err)}</div>${S.unconf?'<button class="link" onclick="resendConfirm()">Resend confirmation email</button>':''}<button class="btn" style="width:100%" id="ago" onclick="go()">${su?'Create account':'Log in'}</button>${su?'<p class="mute sm legalnote">By creating an account you agree to the <button class="inl" onclick="openLegal(\'terms\')">Terms</button> and <button class="inl" onclick="openLegal(\'privacy\')">Privacy Policy</button>.</p>':'<button class="link" onclick="forgot()">Forgot password?</button>'}<button class="link" onclick="swap()">${su?'Have an account? Log in':'New here? Create an account'}</button><div class="legalfoot"><button class="link" onclick="openLegal('terms')">Terms</button><button class="link" onclick="openLegal('privacy')">Privacy</button><button class="link" onclick="openLegal('contact')">Contact</button></div>`;
  if(su&&S.invite)keep({ai:S.invite});
}
function swap(){S.mode=S.mode=='login'?'signup':'login';S.err='';S.good=false;S.unconf='';renderAuth()}
async function go(){
  const email=$('#ae').value.trim(),password=$('#ap').value,name=$('#an')?.value.trim(),invite=($('#ai')?.value||'').trim().toUpperCase();
  const su=S.mode=='signup';
  S.err='';S.good=false;S.unconf='';
  const fail=m=>{S.err=m;if(su)S.invite=invite;renderAuth();keep({ae:email,an:name})};
  if(!email)return fail('Enter your email.');
  if(su){
    if(!invite)return fail('Enter your invite code.');
    if(password.length<8)return fail('Use 8 or more characters for your password.');
  }
  $('#ago').disabled=true;
  if(su){
    const ok=await sb.rpc('invite_ok',{c:invite});
    if(ok.error)return fail(authMsg(ok.error));
    if(!ok.data)return fail("That invite code isn't valid or has been used up.");
  }
  const r=su
    ?await sb.auth.signUp({email,password,options:{emailRedirectTo:APP_URL(),data:{display_name:name||email.split('@')[0],invite_code:invite}}})
    :await sb.auth.signInWithPassword({email,password});
  if(r.error){if(/not confirmed/i.test(r.error.message))S.unconf=email;return fail(authMsg(r.error))}
  if(su&&r.data.user&&r.data.user.identities&&!r.data.user.identities.length)return fail('That email already has an account. Log in instead.');
  if(su&&!r.data.session){S.mode='login';S.invite='';S.unconf=email;S.err='Check your email to confirm your account, then log in.';S.good=true;renderAuth();keep({ae:email});return}
  S.invite='';
}
async function resendConfirm(){
  const email=S.unconf||$('#ae')?.value.trim();
  if(!email)return;
  if(Date.now()-(S.resendAt||0)<60000){toast('Wait a minute before asking again');return}
  S.resendAt=Date.now();
  const{error}=await sb.auth.resend({type:'signup',email,options:{emailRedirectTo:APP_URL()}});
  S.err=error?authMsg(error):'Sent. Check your inbox and spam folder.';S.good=!error;
  if(!error)S.unconf=email;
  renderAuth();keep({ae:email});
}
async function forgot(){
  const email=$('#ae').value.trim();
  if(!email){S.err='Type your email first.';S.good=false;renderAuth();return}
  const{error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:APP_URL()});
  S.err=error?authMsg(error):'Check your email for a reset link.';S.good=!error;
  renderAuth();keep({ae:email});
}
async function logout(){try{await pushDrop()}catch(e){}Store.wipe();await sb.auth.signOut();S.tab='home';S.F='All';S.loaded=false}

// ---------- Onboarding ----------
const obHead=n=>`<div class="obp">Step ${n} of 4</div>`;
function renderOb(){
  const st=S.obStep||0,el=$('#ob');if(!el)return;
  if(st==0)obInterests(el);else if(st==1)obProfileUi(el);else if(st==2)obPeopleUi(el);else obPostUi(el);
}
function obInterests(el){
  const L=S.ints.filter(i=>i.kind!='artist'),cats=[...new Set(L.map(i=>i.category))];
  el.innerHTML=`${obHead(1)}<h2 style="margin:6px 0 6px">What do you like?</h2><p class="mute">Pick at least 3. Your feed is built from these.</p>${
    cats.map(c=>`<div class="cath" style="color:${col(L.find(i=>i.category===c).id)}">${esc(c)}</div><div class="pkl">${L.filter(i=>i.category===c).map(i=>`<button class="fc" style="--c:${col(i.id)}" onclick="obPick(this,${i.id})">${em(i.id)} ${esc(i.name)}</button>`).join('')}</div>`).join('')||'<div class="empty">No interests found. Open the app once as admin to load them.</div>'
  }<div class="err" id="oe"></div><button class="btn" id="obs" style="width:100%" onclick="saveOb(this)" disabled>Continue (0)</button>`;
}
function obPick(b,id){S.pick.has(id)?S.pick.delete(id):S.pick.add(id);b.classList.toggle('on');const s=$('#obs');s.disabled=S.pick.size<3;s.textContent='Continue ('+S.pick.size+')'}
async function saveOb(b){
  b.disabled=true;
  const{error}=await sb.from('user_interests').insert([...S.pick].map(n=>({user_id:S.user.id,interest_id:n})));
  if(error){$('#oe').textContent=error.message;b.disabled=false;return}
  S.mine=new Set(S.pick);S.snap=new Set(S.mine);
  if(S.obLegacy){load();return}
  obGo(1);
}
async function obGo(n){
  S.obStep=n;
  if(n==2){
    $('#ob').innerHTML=obHead(3)+skPerson().repeat(3);
    await Promise.all([loadPeople(),loadFollows()]);
    if(S.obStep!=2)return;
  }
  renderOb();
  const sc=$('#ob').closest('.pscroll');if(sc)sc.scrollTop=0;
}
function obProfileUi(el){
  const has=!!S.avs[S.user.id];
  el.innerHTML=`${obHead(2)}<h2 style="margin:6px 0 6px">Put a face to your name</h2><p class="mute">A photo and a line about you help people say hi. You can skip this and do it later.</p><div class="obav"><span class="av big" id="obav" style="--c:var(--brand)"></span><button class="btn off sbtn" id="obab" onclick="$('#obf').click()">${has?'Change photo':'Add photo'}</button><input type="file" id="obf" accept="image/*" hidden onchange="obAvatar(this)"></div><label class="lab" for="obb">Bio</label><textarea id="obb" class="bioin" maxlength="160" placeholder="Tell people what you are into">${esc(S.prof.bio||'')}</textarea><label class="lab" for="obc">City</label><input class="fi" id="obc" maxlength="40" autocomplete="address-level2" value="${esc(S.prof.city||'')}"><div class="err" id="oe"></div><button class="btn" style="width:100%" id="obn" onclick="obProf(this)">Continue</button><button class="link" onclick="obGo(2)">Skip for now</button>`;
  setMyAv($('#obav'));
}
function obAvatar(inp){
  const f=inp.files[0];inp.value='';if(!f)return;
  cropFile(f,'avatar',async blob=>{
    toast('Uploading photo...');
    try{await setAvatarBlob(blob);setMyAv($('#obav'));$('#obab').textContent='Change photo';toast('Photo added')}
    catch(e){toast(e.message||"Couldn't upload that photo")}
  });
}
async function obProf(b){
  const bio=$('#obb').value.trim(),city=$('#obc').value.trim();
  if((bio||null)!==(S.prof.bio||null)||(city||null)!==(S.prof.city||null)){
    b.disabled=true;
    const{error}=await sb.from('profiles').update({bio:bio||null,city:city||null}).eq('id',S.user.id);
    b.disabled=false;
    if(error){$('#oe').textContent=error.message;return}
    S.prof.bio=bio||null;S.prof.city=city||null;
  }
  obGo(2);
}
function obCands(){
  return S.people.map(p=>({p,sh:p.ids.filter(n=>S.mine.has(n)),team:['admin','mod'].includes(S.roles[p.id])}))
    .sort((a,b)=>b.team-a.team||b.sh.length-a.sh.length||a.p.name.localeCompare(b.p.name)).slice(0,8);
}
const obFolLabel=()=>S.fol.size>=3?'Continue':S.fol.size?'Continue ('+S.fol.size+' followed)':'Skip for now';
function obPeopleUi(el){
  const rows=obCands().map(({p,sh,team})=>{
    const fo=S.fol.has(p.id);
    return `<div class="card row">${av(p.id)}<div class="grow"><b>${esc(p.name)}${rb(p.id)}</b><div class="mute sm">${sh.length?sh.slice(0,4).map(em).join(' ')+' '+sh.length+' in common':team?'The iLike team':'New to you'}</div></div><button class="btn sbtn ${fo?'off':''}" style="margin:0" onclick="obTog('${p.id}',this)">${fo?'Following ✓':'Follow'}</button></div>`}).join('');
  el.innerHTML=`${obHead(3)}<h2 style="margin:6px 0 6px">Follow a few people</h2><p class="mute">Posts from people you follow show up in your Following tab. Pick 3 to start.</p>${rows||'<div class="empty">You are one of the first here.<br>People will appear in Discover as they join.</div>'}<div class="err" id="oe"></div><button class="btn" style="width:100%;margin-top:8px" id="obn" onclick="obGo(3)">${obFolLabel()}</button>`;
}
async function obTog(id,btn){
  if(btn.dataset.busy)return;btn.dataset.busy=1;
  const on=!S.fol.has(id),paint=v=>{btn.textContent=v?'Following ✓':'Follow';btn.classList.toggle('off',v);const n=$('#obn');if(n)n.textContent=obFolLabel()};
  on?S.fol.add(id):S.fol.delete(id);paint(on);
  const r=on?await sb.from('follows').insert({follower_id:S.user.id,following_id:id}):await sb.from('follows').delete().match({follower_id:S.user.id,following_id:id});
  delete btn.dataset.busy;
  if(r.error){on?S.fol.delete(id):S.fol.add(id);paint(!on);toast("Couldn't update that")}
}
function obPostUi(el){
  const L=[...S.mine].filter(n=>!isArt(n)),first=(S.name||'').split(' ')[0]||'there';
  const hi=`Hi, I'm ${first}! I'm into ${L.slice(0,2).map(iname).join(' and ')}. Who else?`;
  el.innerHTML=`${obHead(4)}<h2 style="margin:6px 0 6px">Say hi</h2><p class="mute">Write your first post so people know you are here. You can edit the words.</p><textarea id="obt" maxlength="1000" aria-label="First post">${esc(hi)}</textarea><select id="obi" aria-label="Interest">${L.map(n=>`<option value="${n}">${em(n)} ${esc(iname(n))}</option>`).join('')}</select><div class="err" id="oe"></div><button class="btn" style="width:100%" id="obn" onclick="obSendPost(this)">Post and finish</button><button class="link" onclick="finishOb()">Skip and finish</button>`;
}
async function obSendPost(b){
  const v=$('#obt').value.trim(),a=+$('#obi').value;
  if(!v||!a){finishOb();return}
  b.disabled=true;
  const{data,error}=await sb.from('posts').insert({author_id:S.user.id,body:v}).select('id').single();
  if(error){b.disabled=false;$('#oe').textContent=errMsg(error);return}
  const tg=await sb.from('post_interests').insert({post_id:data.id,interest_id:a});
  if(tg.error)toast('Posted, but tags failed');
  finishOb();
}
async function finishOb(){
  if(S.obBusy)return;S.obBusy=true;
  const r=await sb.rpc('finish_onboarding');
  S.obBusy=false;
  if(r.error){toast("Couldn't finish setup. Try again.");return}
  if(S.prof)S.prof.onboarded_at=new Date().toISOString();
  S.obStep=0;S.F='All';
  await load();toast('Welcome to iLike ✦');
}
