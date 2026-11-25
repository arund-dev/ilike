// Terms, Privacy and Contact live on the landing site (one copy, shared with the website).
// They open in the browser. To move the site, change LANDING_URL in core.js.
function openLegal(k){
  const page={terms:'terms.html',privacy:'privacy.html',contact:'contact.html'}[k]||'terms.html';
  const url=LANDING_URL+page;
  if(!window.open(url,'_blank','noopener'))location.href=url;
}
