const LEGAL={
  terms:['Terms',[
    ['What iLike is','iLike is a small community app for finding people who share your interests. It is in early testing, so things may change, break, or be reset.'],
    ['Your account','Use your real details, keep one account, and keep your password private. You must be at least 13 years old. You are responsible for what you post and send.'],
    ['Be kind','No harassment, hate, threats, spam, or pretending to be someone else. No sexual or violent content, nothing illegal, and no sharing other people\'s private information.'],
    ['Moderation','Moderators and admins can remove content and mute or ban accounts that break these rules. You can report posts, replies, messages and people, and you can block anyone.'],
    ['Your content','You keep ownership of what you post. By posting, you allow iLike to show it to other members inside the app.'],
    ['Meeting people','Events are organised by members. iLike does not check anyone\'s identity. Meet in public places and tell someone where you are going.'],
    ['No guarantees','iLike is provided as is during testing. Data may be lost, and we may change or end the service.'],
    ['Leaving','You can stop using iLike at any time. To have your account deleted, email us.'],
    ['Changes','We may update these terms. If you keep using iLike after a change, you accept it.']]],
  privacy:['Privacy',[
    ['What we collect','Your email, your password (stored scrambled by our login provider, so we cannot read it), and what you add: name, username, bio, city, photos, interests, artists, posts, replies, reactions, follows, messages, events, and the reports and blocks you make.'],
    ['Who can see it','Signed-in members can see your profile, posts, interests and follows. Direct messages are visible to the people in that chat. Reports are seen by moderators.'],
    ['Where it is stored','Your data is stored with Supabase, which provides our database, login and file storage. Fonts load from Google Fonts. We do not show ads, sell your data, or run analytics in this version.'],
    ['On your device','The app keeps your look settings and unsent drafts in your browser, and saves app files so it opens faster and works offline.'],
    ['Our access','The people who run iLike can technically access stored data in order to run and protect the service. We only look at private messages when needed to handle a report or a safety or legal issue.'],
    ['Deleting your data','Email us and we will delete your account and what you posted within 30 days.']]],
  contact:['Contact',[
    ['Get in touch','Email '+CONTACT_EMAIL+' if you are locked out, found a problem, have a question, or want your account deleted.'],
    ['Problems with a person','Use Report or Block in the app (the ⋯ button on posts, messages and profiles). Moderators will look at it.'],
    ['Emergencies','If someone is in danger, contact your local emergency services first.']]]
};
function openLegal(k){S.lg=LEGAL[k]?k:'terms';drawLegal();$('#lg').classList.add('on')}
function drawLegal(){
  $('#lgt').innerHTML=Object.keys(LEGAL).map(k=>`<button class="${k==S.lg?'on':''}" onclick="S.lg='${k}';drawLegal()">${LEGAL[k][0]}</button>`).join('');
  $('#lgb').innerHTML=LEGAL[S.lg][1].map(([h,t])=>`<h4>${esc(h)}</h4><p>${esc(t).replace(esc(CONTACT_EMAIL),`<a href="mailto:${esc(CONTACT_EMAIL)}">${esc(CONTACT_EMAIL)}</a>`)}</p>`).join('')+`<p class="mute sm" style="margin-top:12px">Last updated October 2026</p>`;
  const lgBody=$('#lg .pnl-body');if(lgBody)lgBody.scrollTop=0;
}
