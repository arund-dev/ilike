// ---------- Buy Tickets Modal ----------
function openTickets(id){
  const e=S.evm.get(id);if(!e)return;
  S.ticketEvId=id;
  S.ticketQuantities={ga:1,vip:0,early:0};
  $('#ticket-ev-title').textContent=e.title;
  $('#ticket-ev-sub').textContent=evd(e.starts_at)+' · '+e.place;
  $('#ticket-err').textContent='';
  $('#ticket-mod').classList.add('on');
  renderTicketTiers();
}

function closeTickets(){
  $('#ticket-mod')?.classList.remove('on');
}

function renderTicketTiers(){
  const tiers=[
    {id:'ga',name:'General Admission',desc:'Full event access and open seating',price:S.ticketPrices.ga},
    {id:'early',name:'Early Bird Pass',desc:'Discounted entry for early participants',price:S.ticketPrices.early},
    {id:'vip',name:'VIP Pass',desc:'Front row seating, VIP lounge access & souvenir badge',price:S.ticketPrices.vip}
  ];
  let totalQty=0,subtotal=0;
  $('#ticket-tiers').innerHTML=tiers.map(t=>{
    const qty=S.ticketQuantities[t.id]||0;
    totalQty+=qty;
    subtotal+=qty*t.price;
    return `<div class="ticket-tier-row ${qty>0?'active':''}">
      <div class="ticket-tier-info">
        <b>${esc(t.name)}</b>
        <small>${esc(t.desc)}</small>
        <div class="ticket-tier-price">$${t.price}.00</div>
      </div>
      <div class="ticket-counter">
        <button type="button" onclick="adjustTicketQty('${t.id}',-1)" aria-label="Decrease">−</button>
        <span>${qty}</span>
        <button type="button" onclick="adjustTicketQty('${t.id}',1)" aria-label="Increase">＋</button>
      </div>
    </div>`;
  }).join('');

  const fee=totalQty>0?2.50:0;
  const total=subtotal+fee;
  $('#t-qty-label').textContent=totalQty;
  $('#t-subtotal').textContent='$'+subtotal.toFixed(2);
  $('#t-fee').textContent=fee>0?'$'+fee.toFixed(2):'Free';
  $('#t-total').textContent='$'+total.toFixed(2);
  $('#ticket-confirm-btn').disabled=totalQty<=0;
}

function adjustTicketQty(tier,delta){
  const cur=S.ticketQuantities[tier]||0;
  S.ticketQuantities[tier]=Math.max(0,Math.min(10,cur+delta));
  renderTicketTiers();
}

async function confirmTickets(){
  const id=S.ticketEvId;if(!id)return;
  const e=S.evm.get(id);
  const totalQty=(S.ticketQuantities.ga||0)+(S.ticketQuantities.vip||0)+(S.ticketQuantities.early||0);
  if(totalQty<=0)return;
  closeTickets();
  // Automatically RSVP the user if not already in
  if(e&&!e.goers.includes(S.user.id)){
    e.goers.push(S.user.id);
    await sb.from('event_goers').insert({event_id:id,user_id:S.user.id});
  }
  toast(`🎉 ${totalQty} Ticket(s) Reserved for ${e?e.title:'Event'}!`);
  checkAch();
  if($('#ev-ov').classList.contains('on')){renderEventFullscreen();if(S.evActiveId===id)loadEventChat(id)}
}

const eventCommentsError=e=>e&&(e.code==='PGRST205'||/event_comments|relation .*does not exist/i.test(e.message||''))
  ?'Comments need database setup. Run event-tab.sql in Supabase first.'
  :errMsg(e);
