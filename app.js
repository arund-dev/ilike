/**
 * iLike - Standalone Application Script (app.js)
 * Upload directly to GitHub alongside index.html and style.css
 */

const SUPABASE_URL = "https://rgrtwewhiylwkxgbcgyx.supabase.co";
const SUPABASE_KEY = "sb_publishable_frBJksxES3J_AZICQ619fw_6e7hP59z";

let sb = null;
try {
  if (typeof supabase !== 'undefined') {
    sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }
} catch (e) {
  console.warn("Supabase initialization deferred:", e);
}

// ── Redesigned Clean SVG Icons ──
const svgWrap = (path, extra = '', vb = '0 0 24 24', fill = 'none') =>
  `<svg class="ui-icon ${extra}" viewBox="${vb}" fill="${fill}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;

const ICONS = {
  home: svgWrap('<path d="M3 10.5 12 3l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5h-5a1 1 0 0 1-1-1v-5h-4v5a1 1 0 0 1-1 1h-5A1.5 1.5 0 0 1 3 20Z"/>'),
  discover: svgWrap('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/><path d="M11 8v2"/><path d="M11 14v-2"/><path d="M9 11h4"/>'),
  create: svgWrap('<path d="M12 5v14M5 12h14"/>'),
  events: svgWrap('<rect width="18" height="18" x="3" y="4" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="m9 16 2 2 4-4"/>'),
  you: svgWrap('<circle cx="12" cy="8" r="4"/><path d="M4 20c0-3.5 3.5-6 8-6s8 2.5 8 6"/>'),
  bell: svgWrap('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>'),
  chat: svgWrap('<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/><circle cx="8" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="16" cy="12" r="1"/>'),
  pencil: svgWrap('<path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>'),
  settings: svgWrap('<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>'),
  close: svgWrap('<path d="M18 6 6 18M6 6l12 12"/>'),
  back: svgWrap('<path d="m15 18-6-6 6-6"/>'),
  plus: svgWrap('<path d="M5 12h14M12 5v14"/>'),
  check: svgWrap('<path d="m5 13 4 4L19 7"/>'),
  more: svgWrap('<circle cx="5" cy="12" r="1.75"/><circle cx="12" cy="12" r="1.75"/><circle cx="19" cy="12" r="1.75"/>'),
  reply: svgWrap('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'),
  share: svgWrap('<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/>'),
  ticket: svgWrap('<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><path d="M13 5v2"/><path d="M13 11v2"/><path d="M13 17v2"/>'),
  pin: svgWrap('<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>'),
  wave: svgWrap('<path d="M18 11V6a2 2 0 0 0-4 0v5"/><path d="M14 10V4a2 2 0 0 0-4 0v7"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8a5 5 0 0 0 10 0v-2"/><path d="M6 14v1a4 4 0 0 0 8 0v-1"/>'),
  camera: svgWrap('<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>'),
  at: svgWrap('<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>'),
  flag: svgWrap('<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>'),
  ban: svgWrap('<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>'),
  heart: (active = false) => `
    <span class="hw-icon ${active ? 'is-active' : ''}">
      <svg class="ui-icon heart-outline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
      </svg>
      <svg class="ui-icon heart-fill" viewBox="0 0 24 24" fill="#f43f5e" stroke="#f43f5e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
      </svg>
    </span>
  `
};

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));
const ago = d => {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  return m < 1 ? 'just now' : m < 60 ? m + 'm ago' : m < 1440 ? Math.floor(m / 60) + 'h ago' : Math.floor(m / 1440) + 'd ago';
};
const evd = d => {
  const x = new Date(d);
  return x.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' }) + ' · ' + x.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};
const PAL = ['#8B5CF6', '#EC4899', '#22C55E', '#F59E0B', '#14B8A6', '#3B82F6', '#EF4444'];
const MAX_PHOTOS = 6;

// Application State
const S = {
  user: { id: 'usr-me', email: 'user@example.com' },
  name: 'Alex Morgan',
  prof: { username: 'alexm', bio: 'Living curious. Exploring photography, good music & cozy coffee spots.', city: 'New York' },
  mine: new Set([1, 3, 5, 6]),
  snap: new Set([1, 3, 5, 6]),
  ints: [
    { id: 1, name: 'Photography', emoji: '📷', color: '#EC4899', category: 'Creative' },
    { id: 2, name: 'Reading', emoji: '📚', color: '#EC4899', category: 'Creative' },
    { id: 3, name: 'Coffee', emoji: '☕', color: '#F59E0B', category: 'Food' },
    { id: 4, name: 'Kottu', emoji: '🍲', color: '#F59E0B', category: 'Food' },
    { id: 5, name: 'Gaming', emoji: '🎮', color: '#8B5CF6', category: 'Games' },
    { id: 6, name: 'Pop', emoji: '🎤', color: '#3B82F6', category: 'Music' },
    { id: 7, name: 'Rock', emoji: '🎸', color: '#3B82F6', category: 'Music' },
    { id: 8, name: 'Travel', emoji: '🧭', color: '#14B8A6', category: 'Outdoors' },
    { id: 9, name: 'Anime', emoji: '🍥', color: '#EF4444', category: 'Shows' },
    { id: 10, name: 'Cartoons', emoji: '📺', color: '#EF4444', category: 'Shows' }
  ],
  im: new Map(),
  posts: [
    {
      id: 'post-1', author_id: 'member-1', body: 'Anyone up for a weekend photo walk in the city park? Bringing my 35mm lens! 📸',
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(), tags: [1, 8], sames: ['member-2'],
      imgs: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80'], rc: 2
    },
    {
      id: 'post-2', author_id: 'member-2', body: 'Found this cozy little coffee spot with the best freshly roasted brews. What is everyone drinking today?',
      created_at: new Date(Date.now() - 3600000 * 6).toISOString(), tags: [3], sames: ['member-1', 'member-3'],
      imgs: ['https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80'], rc: 1
    },
    {
      id: 'post-3', author_id: 'member-3', body: 'Just finished setting up our retro gaming lounge! Street Fighter tournament starts this Friday night. Drop in!',
      created_at: new Date(Date.now() - 3600000 * 12).toISOString(), tags: [5], sames: ['member-1'], imgs: [], rc: 0
    }
  ],
  myPosts: [],
  pm: new Map(),
  people: [
    { id: 'member-1', name: 'Aiden Brooks', username: 'aidenb', ids: [1, 8, 3], role: 'mod' },
    { id: 'member-2', name: 'Maya Chen', username: 'mayac', ids: [3, 2, 9], role: 'user' },
    { id: 'member-3', name: 'Leo Vance', username: 'leov', ids: [5, 7, 10], role: 'admin' }
  ],
  cnt: { 1: 14, 2: 9, 3: 22, 5: 18, 6: 12 },
  names: { 'member-1': 'Aiden Brooks', 'member-2': 'Maya Chen', 'member-3': 'Leo Vance' },
  avs: {},
  usernames: { 'member-1': 'aidenb', 'member-2': 'mayac', 'member-3': 'leov' },
  roles: { 'member-1': 'mod', 'member-3': 'admin' },
  blocked: new Set(),
  fol: new Set(['member-1']),
  F: 'All',
  tab: 'home',
  cfFn: null,
  th: null,
  pmId: null,
  edId: null,
  photos: [],
  evs: [
    {
      id: 'event-1', organizer_id: 'member-1', title: 'Golden Hour Community Photowalk', emoji: '📷',
      starts_at: new Date(Date.now() + 86400000 * 2).toISOString(), place: 'Downtown Riverwalk', venue: 'Clock Tower Plaza',
      description: 'Join us for a friendly, casual photowalk capturing the golden hour reflection on the river. All skill levels welcome!',
      goers: ['member-1', 'member-2', 'member-3']
    },
    {
      id: 'event-2', organizer_id: 'member-2', title: 'Indie Coffee Tasting & Cupping Session', emoji: '☕',
      starts_at: new Date(Date.now() + 86400000 * 5).toISOString(), place: 'Velvet Roast Roastery', venue: 'Upstairs Cupping Lab',
      description: 'Taste 5 distinct single-origin beans, compare flavor notes, and meet other local coffee aficionados.',
      goers: ['member-2', 'member-1']
    }
  ],
  evm: new Map(),
  evActiveId: null,
  evTab: 'about',
  evChats: new Map(),
  evComments: new Map(),
  evGallery: new Map(),
  ticketQuantities: { ga: 1, vip: 0, early: 0 },
  ticketPrices: { ga: 15, vip: 35, early: 10 },
  ticketEvId: null,
  mt: 0,
  pkm: 'int'
};

S.im = new Map(S.ints.map(i => [i.id, i]));
S.pm = new Map(S.posts.map(p => [p.id, p]));
S.evm = new Map(S.evs.map(e => [e.id, e]));
S.names[S.user.id] = S.name;

const iname = n => S.im.get(n)?.name || 'General';
const col = n => esc(S.im.get(n)?.color || 'var(--brand)');
const em = n => esc(S.im.get(n)?.emoji || (S.im.get(n)?.kind === 'artist' ? '🎤' : '✦'));
const cat = n => S.im.get(n)?.category || 'Other';
const nm = id => S.names[id] || (id === S.user?.id ? S.name : 'Member');
const ac = id => id === S.user?.id ? 'var(--brand)' : PAL[[...String(id)].reduce((a, c) => a + c.charCodeAt(0), 0) % PAL.length];
const rb = id => {
  const r = S.roles[id];
  return r === 'admin' ? ' <span class="rbadge ad">Admin</span>' : r === 'mod' ? ' <span class="rbadge">Mod</span>' : '';
};
const bl = id => S.blocked.has(id);
const findPost = id => S.pm.get(String(id));

const av = (id, z = '') => {
  const u = S.avs[id];
  return `<span class="av ${z}" style="--c:${ac(id)}${u ? `;background-image:url('${esc(u)}');background-size:cover;background-position:center` : ''}">${u ? '' : esc((nm(id) || '?')[0].toUpperCase())}</span>`;
};

const chip = n => `<span class="chip" style="--c:${col(n)}">${em(n)} ${esc(iname(n))}</span>`;
const tgb = n => S.mine.has(n) ? chip(n) : `<button class="chip tg" style="--c:${col(n)}" onclick="ask(${n})">${em(n)} ${esc(iname(n))}</button>`;

const say = l => (!l.length ? '' : l.length === 1 ? l[0] + ' liked this' : l.length === 2 ? l.join(' & ') + ' liked this' : `${l[0]}, ${l[1]} & others liked this`);
const so = p => {
  const a = p.sames.filter(x => x !== S.user?.id && !bl(x));
  return p.sames.includes(S.user?.id) ? [S.user.id, ...a] : a;
};
const sm = p => {
  const o = so(p);
  return (o.length ? `<span class="stk">${o.slice(0, 3).map(x => av(x, 'sm')).join('')}</span>` : '') + esc(say(o.map(x => (x === S.user?.id ? 'You' : nm(x)))));
};

function formatBody(t) {
  return esc(t || '').replace(/@([a-zA-Z0-9_.]{3,20})/g, (_, u) => {
    return `<span class="mention-pill" onclick="event.stopPropagation();handleMentionClick('${esc(u)}')">${ICONS.at}<span>${esc(u)}</span></span>`;
  });
}

let toastT;
function toast(m) {
  const t = $('#toast');
  if (!t) return;
  t.textContent = m;
  t.classList.add('on');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('on'), 2400);
}

// ── Screen Navigation ──
function show(id) {
  if (id !== 'auth' && id !== 'onb') S.tab = id;
  $$('.screen').forEach(s => s.classList.toggle('on', s.id === `s-${id}`));
  $$('#nav button[data-s]').forEach(x => x.classList.toggle('on', x.dataset.s === id));
}

// ── Modals ──
function openModal(id) {
  const el = $(`#${id}`);
  if (el) el.classList.add('on');
}
function closeModal(id) {
  const el = $(`#${id}`);
  if (el) el.classList.remove('on');
}
function closeAll() {
  $$('.mod, .ov').forEach(m => m.classList.remove('on'));
  $('#fabBtn')?.classList.remove('spin');
  S.th = null; S.pmId = null; S.evActiveId = null;
}
function confirmBox(title, yesText, fn) {
  S.cfFn = fn;
  const t = $('#cft'), y = $('#cfy');
  if (t) t.textContent = title;
  if (y) y.textContent = yesText;
  openModal('cf');
}
function cfyes() {
  closeModal('cf');
  if (S.cfFn) { S.cfFn(); S.cfFn = null; }
}

// ── Post Components ──
function post(p, options = {}) {
  const isThread = !!options.isThread;
  const on = p.sames.includes(S.user?.id);
  const mine = p.author_id === S.user?.id;
  const imgsCount = p.imgs ? p.imgs.length : 0;
  const imgs = imgsCount ? `<div class="pimgs n${Math.min(imgsCount, 6)}">${p.imgs.slice(0, 6).map(u => `<img src="${esc(u)}" loading="lazy" alt="Post photo">`).join('')}</div>` : '';

  return `
    <article class="card" data-pi="${p.id}">
      <div class="who">
        <span onclick="openProfile('${p.author_id}')">${av(p.author_id)}</span>
        <div class="grow">
          <b onclick="openProfile('${p.author_id}')">${esc(nm(p.author_id))}${rb(p.author_id)}</b>
          <div class="mute sm">${ago(p.created_at)}${p.edited_at ? ' · edited' : ''}</div>
        </div>
        <button class="more" onclick="${mine ? `openPm('${p.id}')` : `openAx('post','${p.id}')`}" aria-label="More options">
          ${ICONS.more}
        </button>
      </div>
      <p>${formatBody(p.body)}</p>
      <div class="path" style="margin-top:10px">${p.tags.map(tgb).join('')}</div>
      ${imgs}
      <div class="acts">
        <button class="like-btn ${on ? 'on' : ''}" onclick="same('${p.id}', this)" aria-label="Like">
          ${ICONS.heart(on)}
        </button>
        ${isThread ? '' : `<button class="ghost ic" onclick="openThread('${p.id}')" aria-label="Reply">${ICONS.reply}${p.rc ? `<span>${p.rc}</span>` : ''}</button>`}
        <button class="ghost ic" onclick="share('${p.id}')" aria-label="Share">${ICONS.share}</button>
      </div>
      <div class="who2" onclick="openSames('${p.id}')">${sm(p)}</div>
    </article>
  `;
}

function same(id, btn) {
  const p = findPost(id);
  if (!p) return;
  const u = S.user.id;
  const on = !p.sames.includes(u);
  p.sames = on ? [...p.sames, u] : p.sames.filter(x => x !== u);

  $$(`.card[data-pi="${id}"]`).forEach(c => {
    const lk = c.querySelector('.like-btn');
    if (lk) {
      lk.className = `like-btn${on ? ' on pop' : ''}`;
      lk.innerHTML = ICONS.heart(on);
    }
    const w2 = c.querySelector('.who2');
    if (w2) w2.innerHTML = sm(p);
  });

  if (sb) {
    if (on) sb.from('sames').insert({ post_id: p.id, user_id: u });
    else sb.from('sames').delete().match({ post_id: p.id, user_id: u });
  }
}

function openSames(id) {
  const p = findPost(id);
  if (!p || !p.sames.length) return;
  const list = so(p);
  $('#slt').textContent = `${list.length} ${list.length === 1 ? 'person liked this' : 'people liked this'}`;
  $('#sll').innerHTML = list.map(u => `
    <div class="row" style="padding:10px 0;border-bottom:1px solid var(--line)">
      <span onclick="openProfile('${u}')">${av(u)}</span>
      <b class="grow" onclick="openProfile('${u}')">${esc(u === S.user.id ? 'You' : nm(u))}</b>
      ${u === S.user.id ? '' : `<button class="btn sbtn" onclick="sayHi('${u}')">${ICONS.wave} Say hi</button>`}
    </div>
  `).join('');
  openModal('sl');
}

function home() {
  const fl = $('#fl');
  if (fl) {
    fl.innerHTML = [
      ['All', 'All'],
      ['might', 'Might like'],
      ['new', 'New to you'],
      ...(S.fol.size ? [['fol', 'Following']] : []),
      ...[...S.mine].map(n => [n, `${em(n)} ${iname(n)}`, col(n)]),
    ].map(t => `<button class="fc ${t[0] === S.F ? 'on' : ''}" ${t[2] ? `style="--c:${t[2]}"` : ''} onclick='setF(${JSON.stringify(t[0])})'>${esc(t[1])}</button>`).join('');
  }

  const feed = $('#feed');
  if (feed) {
    const F = S.F;
    const l = F === 'All' ? S.posts : F === 'fol' ? S.posts.filter(p => S.fol.has(p.author_id)) : S.posts.filter(p => p.tags.includes(Number(F)));
    feed.innerHTML = l.length ? l.map(p => post(p)).join('') : '<div class="empty"><b>No posts in this category</b><div class="sm" style="margin-top:6px">Tap the ＋ button below and share what you like!</div></div>';
  }
}

function setF(n) {
  S.F = n;
  home();
}

function tapFab() {
  $('#fabBtn')?.classList.add('spin');
  const sel = $('#sel'), sel2 = $('#sel2');
  const options = [...S.mine].map(n => `<option value="${n}">${em(n)} ${esc(iname(n))}</option>`).join('');
  if (sel) sel.innerHTML = options || `<option value="1">📷 Photography</option>`;
  if (sel2) sel2.innerHTML = '<option value="">Mix with second interest (optional)</option>' + (options || '');
  renderPhotos();
  openModal('mod');
}

function closePost() {
  $('#fabBtn')?.classList.remove('spin');
  closeModal('mod');
}

function renderPhotos() {
  const pph = $('#pph');
  if (!pph) return;
  pph.innerHTML = S.photos.map((ph, i) => `
    <div class="ph">
      <img src="${ph.prev}" alt="Photo ${i + 1}">
      <button type="button" onclick="rmPhoto(${i})">${ICONS.close}</button>
    </div>
  `).join('');
  const padd = $('#padd');
  if (padd) {
    padd.hidden = S.photos.length >= MAX_PHOTOS;
    padd.innerHTML = `${ICONS.camera} Add photos (${S.photos.length}/${MAX_PHOTOS})`;
  }
}

function pickPhotos(inp) {
  const files = [...(inp.files || [])].slice(0, MAX_PHOTOS - S.photos.length);
  inp.value = '';
  files.forEach(f => S.photos.push({ blob: f, prev: URL.createObjectURL(f) }));
  renderPhotos();
}

function rmPhoto(i) {
  S.photos.splice(i, 1);
  renderPhotos();
}

function publish() {
  const txt = $('#txt'), body = txt?.value.trim();
  if (!body) { toast('Type something to share'); return; }
  const tag1 = Number($('#sel')?.value) || 1;
  const tag2 = Number($('#sel2')?.value) || 0;
  const tags = [...new Set([tag1, tag2].filter(Boolean))];

  const newPost = {
    id: `post-${Date.now()}`,
    author_id: S.user.id,
    body,
    created_at: new Date().toISOString(),
    tags,
    sames: [],
    imgs: S.photos.map(p => p.prev),
    rc: 0
  };

  S.posts.unshift(newPost);
  S.myPosts.unshift(newPost);
  S.pm.set(newPost.id, newPost);

  if (txt) txt.value = '';
  S.photos = [];
  closePost();
  home();
  toast('Post shared with the community! ✦');
}

function openEd(id) {
  const p = findPost(id);
  if (!p) return;
  closeModal('pm');
  S.edId = id;
  const edt = $('#edt');
  if (edt) edt.value = p.body;
  openModal('ed');
}

function saveEd() {
  if (!S.edId) return;
  const p = findPost(S.edId);
  if (!p) return;
  const val = $('#edt')?.value.trim();
  if (val) {
    p.body = val;
    p.edited_at = new Date().toISOString();
    closeModal('ed');
    home();
    toast('Post updated');
  }
}

function delPost(id) {
  closeModal('pm');
  confirmBox('Delete this post permanently?', 'Delete', () => {
    S.posts = S.posts.filter(p => p.id !== id);
    S.myPosts = S.myPosts.filter(p => p.id !== id);
    S.pm.delete(id);
    home();
    toast('Post deleted');
  });
}

function openThread(id) {
  const p = findPost(id);
  if (!p) return;
  S.th = id;
  $('#thp').innerHTML = post(p, { isThread: true });
  $('#thr').innerHTML = `
    <div class="rep">
      <span>${av('member-2')}</span>
      <div class="grow">
        <div><b>Maya Chen</b> <span class="mute sm">1h ago</span></div>
        <div style="margin-top:2px">Count me in for this! Love the spot.</div>
      </div>
    </div>
  `;
  openModal('th');
}

function closeThread() {
  S.th = null;
  closeModal('th');
}

function sendReply() {
  const inp = $('#rin'), body = inp?.value.trim();
  if (!body || !S.th) return;
  const p = findPost(S.th);
  if (p) p.rc = (p.rc || 0) + 1;
  $('#thr')?.insertAdjacentHTML('beforeend', `
    <div class="rep">
      <span>${av(S.user.id)}</span>
      <div class="grow">
        <div><b>${esc(S.name)}</b> <span class="mute sm">just now</span></div>
        <div style="margin-top:2px">${formatBody(body)}</div>
      </div>
    </div>
  `);
  if (inp) inp.value = '';
  home();
  toast('Reply sent');
}

// ── Discover ──
function ftab(i) {
  $$('#ft button').forEach((b, k) => b.classList.toggle('on', k === i));
  $('#fp').style.display = i === 0 ? 'block' : 'none';
  $('#fg').style.display = i === 1 ? 'block' : 'none';
  $('#fx').style.display = i === 2 ? 'block' : 'none';
  findTab();
}

function findTab() {
  const q = $('#q')?.value.toLowerCase() || '';
  const ppl = $('#ppl');
  if (ppl) {
    const matches = S.people.filter(p => (p.name + (p.username || '')).toLowerCase().includes(q));
    ppl.innerHTML = matches.map(p => `
      <div class="card row">
        <span onclick="openProfile('${p.id}')">${av(p.id)}</span>
        <div class="grow">
          <b onclick="openProfile('${p.id}')">${esc(p.name)}${rb(p.id)}</b>
          <div class="mute sm">@${esc(p.username || '')}</div>
          <div style="margin-top:6px">${p.ids.slice(0, 3).map(chip).join('')}</div>
        </div>
        <div class="row" style="flex-direction:column;gap:6px">
          <button class="btn sbtn" onclick="sayHi('${p.id}')">${ICONS.wave} Hi</button>
          <button class="btn off sbtn" onclick="toggleFollow('${p.id}', this)">
            ${S.fol.has(p.id) ? 'Following ✓' : `${ICONS.plus} Follow`}
          </button>
        </div>
      </div>
    `).join('') || '<div class="empty">No members found</div>';
  }

  const rooms = $('#rooms');
  if (rooms) {
    rooms.innerHTML = S.ints.filter(i => i.name.toLowerCase().includes(q)).map(i => `
      <button class="room" onclick="openChat(${i.id})">
        <span>${em(i.id)}</span>
        ${esc(i.name)}
        <small style="display:block;margin-top:4px;color:var(--mute)">${S.cnt[i.id] || 8} members</small>
      </button>
    `).join('');
  }

  const fx = $('#fx');
  if (fx) {
    fx.innerHTML = `
      <div style="padding:16px">
        <h3 style="font-size:17px;font-weight:800;margin-bottom:12px">Explore by Category</h3>
        <div class="row" style="flex-wrap:wrap;gap:8px">
          ${S.ints.map(i => `<button class="fc" style="--c:${col(i.id)}" onclick="openCircle(${i.id})">${em(i.id)} ${esc(i.name)}</button>`).join('')}
        </div>
      </div>
    `;
  }
}

function openCircle(id) {
  S.F = id;
  show('home');
  home();
}

function toggleFollow(id, btn) {
  const on = !S.fol.has(id);
  if (on) S.fol.add(id); else S.fol.delete(id);
  if (btn) {
    btn.innerHTML = on ? 'Following ✓' : `${ICONS.plus} Follow`;
    btn.classList.toggle('off', !on);
  }
  toast(on ? `Following ${nm(id)}` : `Unfollowed ${nm(id)}`);
}

// ── Profile Screen ──
function meTab() {
  $('#mav').innerHTML = av(S.user.id, 'big');
  $('#mn').innerHTML = `${esc(S.name)}${rb(S.user.id)}`;
  $('#mu').textContent = `@${S.prof.username || 'user'} · ${S.prof.city || 'Online'}`;
  const mb = $('#mb');
  if (mb) { mb.hidden = !S.prof.bio; mb.textContent = S.prof.bio || ''; }

  $('#shelf').innerHTML = [...S.mine].map(chip).join('') + `<button class="chip addb" onclick="openPk('int')">${ICONS.plus} Add</button>`;
  $('#art').innerHTML = `<button class="chip addb" onclick="openPk('art')">${ICONS.plus} Add Artist</button>`;
  $('#badges').innerHTML = `
    <div class="row" style="flex-wrap:wrap;gap:8px">
      <button class="chip tg" onclick="toast('Badge: Early Pioneer')">⭐ Early Pioneer</button>
      <button class="chip tg" onclick="toast('Badge: Community Spark')">✨ Community Spark</button>
    </div>
  `;

  $('#mt').innerHTML = ['My posts', 'Liked', 'Photos'].map((t, i) => `<button class="${i === S.mt ? 'on' : ''}" onclick="setMt(${i})">${t}</button>`).join('');

  const mine = $('#mine');
  if (mine) {
    if (S.mt === 0) {
      mine.innerHTML = S.myPosts.length ? S.myPosts.map(p => post(p)).join('') : '<div class="empty"><b>No posts yet</b><div class="sm">Share something from Home!</div></div>';
    } else if (S.mt === 1) {
      const liked = S.posts.filter(p => p.sames.includes(S.user.id));
      mine.innerHTML = liked.length ? liked.map(p => post(p)).join('') : '<div class="empty"><b>Nothing liked yet</b></div>';
    } else {
      mine.innerHTML = '<div class="empty"><b>No photos posted</b></div>';
    }
  }
}

function setMt(i) {
  S.mt = i;
  meTab();
}

function openPk(k = 'int') {
  S.pkm = k;
  $('#pkt').textContent = k === 'art' ? 'Your Artists' : 'Your Interests';
  drawPk();
  openModal('pk');
}

function drawPk() {
  const q = $('#pks')?.value.toLowerCase() || '';
  $('#pkl').innerHTML = S.ints.filter(i => i.name.toLowerCase().includes(q)).map(i => {
    const on = S.mine.has(i.id);
    return `<button class="fc ${on ? 'on' : ''}" style="--c:${col(i.id)}" onclick="toggleInt(${i.id})">${em(i.id)} ${esc(i.name)}${on ? ' ✓' : ''}</button>`;
  }).join('');
}

function toggleInt(n) {
  if (S.mine.has(n)) S.mine.delete(n); else S.mine.add(n);
  drawPk(); home(); meTab();
}

function openPe() {
  $('#pen').value = S.name;
  $('#peu').value = S.prof.username || '';
  $('#peb').value = S.prof.bio || '';
  $('#pec').value = S.prof.city || '';
  openModal('pe');
}

function saveProfile() {
  S.name = $('#pen')?.value.trim() || 'Me';
  S.prof.username = $('#peu')?.value.trim() || 'user';
  S.prof.bio = $('#peb')?.value.trim() || '';
  S.prof.city = $('#pec')?.value.trim() || '';
  closeModal('pe');
  meTab();
  toast('Profile updated');
}

function openSet() {
  openModal('set');
}

function setTheme(mode) {
  if (mode === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = mode;
  toast(`Theme set to ${mode}`);
}

function accent(idx) {
  const colors = [
    { h: 265, h2: 295, h3: 350 },
    { h: 335, h2: 315, h3: 12 },
    { h: 150, h2: 168, h3: 125 },
    { h: 218, h2: 238, h3: 195 },
  ];
  const c = colors[idx % colors.length];
  document.documentElement.style.setProperty('--h', String(c.h));
  document.documentElement.style.setProperty('--h2', String(c.h2));
  document.documentElement.style.setProperty('--h3', String(c.h3));
  toast('Accent updated');
}

function fnt(idx) {
  const fonts = [
    "'Bricolage Grotesque', 'Manrope', system-ui, sans-serif",
    "Georgia, 'Times New Roman', serif",
    "ui-monospace, Menlo, Consolas, monospace",
  ];
  document.documentElement.style.setProperty('--font', fonts[idx % fonts.length]);
  toast('Typography updated');
}

// ── Events ──
function eventsTab() {
  const evs = $('#evs');
  if (!evs) return;
  evs.innerHTML = S.evs.map(e => {
    const isHost = e.organizer_id === S.user.id;
    const on = e.goers.includes(S.user.id);
    return `
      <div class="event-card-item" onclick="openEvent('${e.id}')">
        <div class="ev-card-top">
          <div class="ev-card-tile">${esc(e.emoji)}</div>
          <div class="ev-card-meta">
            <span class="ev-card-date">${evd(e.starts_at)}</span>
            <h3 class="ev-card-title">${esc(e.title)}</h3>
            <div class="ev-card-location">${ICONS.pin}<span>${esc(e.place)}</span></div>
          </div>
        </div>
        <div class="ev-card-footer">
          <div class="row" style="gap:6px">
            <span class="stk">${e.goers.slice(0, 3).map(u => av(u, 'sm')).join('')}</span>
            <span class="mute sm">${e.goers.length} attending</span>
          </div>
          <div class="row" style="gap:8px">
            <span class="ev-ticket-badge">${ICONS.ticket} Tickets</span>
            ${isHost ? `<span class="ev-host-badge">Hosting</span>` : `<button class="imin-btn ${on ? 'on' : ''}" onclick="event.stopPropagation();imin('${e.id}', this)">${on ? `${ICONS.check} You're in` : `${ICONS.plus} I'm in`}</button>`}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function openEvent(id) {
  const e = S.evm.get(id);
  if (!e) return;
  S.evActiveId = id;
  S.evTab = 'about';
  $('#ev-top-title').textContent = e.title;
  renderEventFullscreen();
  $('#ev-ov')?.classList.add('on');
}

function closeEventView() {
  $('#ev-ov')?.classList.remove('on');
  S.evActiveId = null;
}

function setEvTab(tab) {
  S.evTab = tab;
  renderEventFullscreen();
}

function renderEventFullscreen() {
  const e = S.evm.get(S.evActiveId);
  if (!e) return;
  const isHost = e.organizer_id === S.user.id;
  const on = e.goers.includes(S.user.id);
  const chats = S.evChats.get(e.id) || [];

  let tabContent = '';
  if (S.evTab === 'about') {
    tabContent = `
      <div class="ev-tab-content">
        <div class="ev-section-title">ABOUT THIS EVENT</div>
        <p class="ev-desc-box">${e.description ? formatBody(e.description) : 'No description provided.'}</p>
        <div class="card" style="margin:16px 0;background:linear-gradient(145deg,color-mix(in srgb,var(--brand) 10%,var(--card)),var(--card))">
          <div class="row" style="gap:8px;margin-bottom:6px">${ICONS.ticket}<b style="font-size:16px">Official Event Passes</b></div>
          <p class="mute sm">Instant mobile reservation. Passes are saved to your account with contactless check-in.</p>
          <button class="btn ticket-btn wide" style="margin-top:12px" onclick="openTickets('${e.id}')">${ICONS.ticket} Buy / Reserve Tickets</button>
        </div>
      </div>
    `;
  } else if (S.evTab === 'chat') {
    tabContent = `
      <div class="ev-tab-content ev-chat-container">
        <div class="ev-chat-messages" id="ev-chat-list">
          ${chats.length ? chats.map(m => `
            <div class="ev-chat-msg ${m.user_id === S.user.id ? 'me' : ''}">
              <div class="ev-chat-bubble">
                <span class="ev-chat-author" style="color:${ac(m.user_id)}">${esc(nm(m.user_id))}</span>
                ${formatBody(m.body)}
              </div>
            </div>
          `).join('') : '<div class="empty"><b>Event Chat</b><div class="sm">Say hi to everyone attending!</div></div>'}
        </div>
        <div class="ev-chat-input-bar">
          <input id="ev-chat-in" maxlength="400" placeholder="Chat with attendees..." onkeydown="if(event.key==='Enter')sendEventChat('${e.id}')">
          <button class="btn" onclick="sendEventChat('${e.id}')">Send</button>
        </div>
      </div>
    `;
  } else {
    tabContent = `<div class="ev-tab-content"><div class="empty"><b>Community Space</b><div class="sm">Share thoughts and photos with attendees.</div></div></div>`;
  }

  $('#ev-view-body').innerHTML = `
    <div class="ev-full-hero">
      <div class="ev-full-emoji-badge">${esc(e.emoji)}</div>
      <span class="ev-card-date" style="margin-bottom:8px">${evd(e.starts_at)}</span>
      <h1 class="ev-full-title">${esc(e.title)}</h1>
      <div class="ev-full-metas">
        <div class="ev-meta-row">${ICONS.pin}<span>${esc(e.place)}</span></div>
        <div class="ev-meta-row">${ICONS.you}<span>Hosted by <b>${esc(isHost ? 'You' : nm(e.organizer_id))}</b></span></div>
      </div>
      <div class="row" style="margin-top:16px;gap:10px">
        <button class="btn ticket-btn grow" onclick="openTickets('${e.id}')">${ICONS.ticket} Buy Tickets</button>
        ${isHost ? '<span class="ev-host-badge">You are hosting</span>' : `<button class="imin-btn grow ${on ? 'on' : ''}" onclick="imin('${e.id}', this)">${on ? `${ICONS.check} You're in` : `${ICONS.plus} I'm in`}</button>`}
      </div>
    </div>
    <div class="ev-nav-tabs">
      <button class="ev-tab-btn ${S.evTab === 'about' ? 'on' : ''}" onclick="setEvTab('about')">About</button>
      <button class="ev-tab-btn ${S.evTab === 'chat' ? 'on' : ''}" onclick="setEvTab('chat')">Live Chat (${chats.length})</button>
      <button class="ev-tab-btn ${S.evTab === 'comments' ? 'on' : ''}" onclick="setEvTab('comments')">Comments</button>
      <button class="ev-tab-btn ${S.evTab === 'gallery' ? 'on' : ''}" onclick="setEvTab('gallery')">Gallery</button>
    </div>
    ${tabContent}
  `;
}

function imin(id, btn) {
  const e = S.evm.get(id);
  if (!e) return;
  const on = !e.goers.includes(S.user.id);
  if (on) e.goers.push(S.user.id); else e.goers = e.goers.filter(x => x !== S.user.id);
  if (btn) {
    btn.classList.toggle('on', on);
    btn.innerHTML = on ? `${ICONS.check} You're in` : `${ICONS.plus} I'm in`;
  }
  toast(on ? "You're attending this event! 🎉" : 'You left this event');
  eventsTab();
  if (S.evActiveId === id) renderEventFullscreen();
}

function sendEventChat(id) {
  const inp = $('#ev-chat-in'), body = inp?.value.trim();
  if (!body) return;
  const chats = S.evChats.get(id) || [];
  chats.push({ id: `c-${Date.now()}`, user_id: S.user.id, body, created_at: new Date().toISOString() });
  S.evChats.set(id, chats);
  if (inp) inp.value = '';
  renderEventFullscreen();
}

function shareCurrentEvent() {
  if (!S.evActiveId) return;
  const url = `${window.location.origin}/#event=${S.evActiveId}`;
  if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => toast('Event link copied!'));
}

// ── Tickets ──
function openTickets(id) {
  const e = S.evm.get(id);
  if (!e) return;
  S.ticketEvId = id;
  S.ticketQuantities = { ga: 1, vip: 0, early: 0 };
  $('#ticket-ev-title').textContent = e.title;
  $('#ticket-ev-sub').textContent = `${evd(e.starts_at)} · ${e.place}`;
  renderTicketTiers();
  openModal('ticket-mod');
}

function closeTickets() {
  closeModal('ticket-mod');
}

function renderTicketTiers() {
  const tiers = [
    { id: 'ga', name: 'General Admission', desc: 'Full event entry & open seating', price: S.ticketPrices.ga },
    { id: 'early', name: 'Early Bird Pass', desc: 'Discounted entry for early responders', price: S.ticketPrices.early },
    { id: 'vip', name: 'VIP Pass', desc: 'Priority access, lounge pass & welcome drink', price: S.ticketPrices.vip }
  ];
  let totalQty = 0, subtotal = 0;
  $('#ticket-tiers').innerHTML = tiers.map(t => {
    const qty = S.ticketQuantities[t.id] || 0;
    totalQty += qty; subtotal += qty * t.price;
    return `
      <div class="ticket-tier-row ${qty > 0 ? 'active' : ''}">
        <div class="ticket-tier-info">
          <b>${esc(t.name)}</b>
          <small>${esc(t.desc)}</small>
          <div class="ticket-tier-price">$${t.price}.00</div>
        </div>
        <div class="ticket-counter">
          <button type="button" onclick="adjustTicketQty('${t.id}', -1)">−</button>
          <span>${qty}</span>
          <button type="button" onclick="adjustTicketQty('${t.id}', 1)">＋</button>
        </div>
      </div>
    `;
  }).join('');

  const fee = totalQty > 0 ? 2.5 : 0;
  $('#t-qty-label').textContent = String(totalQty);
  $('#t-subtotal').textContent = `$${subtotal.toFixed(2)}`;
  $('#t-fee').textContent = fee > 0 ? `$${fee.toFixed(2)}` : 'Free';
  $('#t-total').textContent = `$${(subtotal + fee).toFixed(2)}`;
  $('#ticket-confirm-btn').disabled = totalQty <= 0;
}

function adjustTicketQty(tier, delta) {
  const cur = S.ticketQuantities[tier] || 0;
  S.ticketQuantities[tier] = Math.max(0, Math.min(10, cur + delta));
  renderTicketTiers();
}

function confirmTickets() {
  const totalQty = (S.ticketQuantities.ga || 0) + (S.ticketQuantities.vip || 0) + (S.ticketQuantities.early || 0);
  if (totalQty <= 0) return;
  const id = S.ticketEvId;
  if (id) {
    const e = S.evm.get(id);
    if (e && !e.goers.includes(S.user.id)) { e.goers.push(S.user.id); eventsTab(); }
  }
  closeTickets();
  toast(`🎉 ${totalQty} ticket(s) reserved successfully!`);
}

// ── Chats ──
function openChats() {
  $('#cl').style.display = 'block';
  $('#cv').style.display = 'none';
  $('#ct').textContent = 'Chats & Messages';
  $('#cl').innerHTML = `
    <div style="padding:16px">
      <h4 style="font-size:13px;font-weight:800;letter-spacing:0.05em;color:var(--brand);text-transform:uppercase;margin-bottom:12px">DIRECT MESSAGES</h4>
      ${S.people.map(p => `
        <div class="card row" style="margin:0 0 10px;cursor:pointer" onclick="openDm('${p.id}')">
          ${av(p.id)}
          <div class="grow">
            <b>${esc(p.name)}</b>
            <div class="mute sm">@${esc(p.username || '')}</div>
          </div>
          <button class="btn sbtn" onclick="event.stopPropagation();openDm('${p.id}')">${ICONS.chat} Chat</button>
        </div>
      `).join('')}
    </div>
  `;
  $('#ov')?.classList.add('on');
}

function openDm(id) {
  $('#cl').style.display = 'none';
  $('#cv').style.display = 'flex';
  $('#ct').textContent = nm(id);
  $('#msgs').innerHTML = `<div class="b">Hey ${esc(S.name)}! Great to see you on iLike. What hobbies are you exploring today?</div>`;
  $('#ov')?.classList.add('on');
}

function openChat(k) {
  $('#cl').style.display = 'none';
  $('#cv').style.display = 'flex';
  $('#ct').textContent = `${em(k)} ${iname(k)}`;
  $('#msgs').innerHTML = `<div class="b">Welcome to the ${esc(iname(k))} circle! Jump in and introduce yourself.</div>`;
  $('#ov')?.classList.add('on');
}

function send() {
  const mi = $('#mi'), v = mi?.value.trim();
  if (!v) return;
  $('#msgs')?.insertAdjacentHTML('beforeend', `<div class="b me">${formatBody(v)}</div>`);
  if (mi) mi.value = '';
}

function sayHi(id) {
  closeAll();
  openDm(id);
}

function openNotifs() {
  $('#nl').innerHTML = `
    <div style="padding:16px;display:flex;flex-direction:column;gap:10px">
      <div class="card row" style="margin:0">
        <span>${av('member-1', 'sm')}</span>
        <div class="grow"><div><b>Aiden Brooks</b> liked your post</div><div class="mute sm">2h ago</div></div>
      </div>
      <div class="card row" style="margin:0">
        <span>${av('member-2', 'sm')}</span>
        <div class="grow"><div><b>Maya Chen</b> started following you</div><div class="mute sm">5h ago</div></div>
      </div>
    </div>
  `;
  $('#nv')?.classList.add('on');
}

function openProfile(id) {
  if (id === S.user.id) { closeAll(); show('me'); meTab(); return; }
  const person = S.people.find(p => p.id === id);
  if (!person) return;
  const isFol = S.fol.has(id);
  $('#pfb').innerHTML = `
    <div class="banner"></div>
    <div style="padding:16px 20px">
      <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:-45px">
        ${av(id, 'big')}
        <div class="row" style="gap:8px">
          <button class="btn ${isFol ? 'off' : ''} sbtn" onclick="toggleFollow('${id}', this)">${isFol ? 'Following ✓' : `${ICONS.plus} Follow`}</button>
          <button class="btn sbtn" onclick="sayHi('${id}')">${ICONS.wave} Say hi</button>
        </div>
      </div>
      <h2 style="margin:14px 0 2px;font-size:22px">${esc(person.name)}${rb(id)}</h2>
      <div class="mute sm">@${esc(person.username || 'member')}</div>
      <div style="margin-top:16px">
        <h4 style="font-size:12px;font-weight:800;letter-spacing:0.06em;color:var(--brand);text-transform:uppercase;margin-bottom:8px">INTERESTS</h4>
        <div class="row" style="flex-wrap:wrap;gap:6px">${person.ids.map(chip).join('')}</div>
      </div>
    </div>
  `;
  openModal('pf');
}

function share(id) {
  const url = `${window.location.origin}/#post=${id}`;
  if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => toast('Post link copied!'));
}

function handleMentionClick(u) {
  const found = S.people.find(p => p.username?.toLowerCase() === u.toLowerCase());
  if (found) openProfile(found.id); else toast(`@${u}`);
}

function insertMentionTag(targetId) {
  const el = $(`#${targetId}`);
  if (el) { el.value += ' @'; el.focus(); }
}

function openPm(id) {
  S.pmId = id;
  openModal('pm');
}

function openAx(type, id) {
  $('#axb').innerHTML = `
    <b style="font-size:18px">Post Options</b>
    <button class="btn off wide" style="margin-top:10px" onclick="closeModal('ax');toast('Report submitted for review')">${ICONS.flag} Report Post</button>
    <button class="btn off wide" style="margin-top:8px" onclick="closeModal('ax');toast('User blocked')">${ICONS.ban} Block User</button>
    <button class="btn off wide" style="margin-top:8px" onclick="closeModal('ax')">Cancel</button>
  `;
  openModal('ax');
}

// ── Bind to global window so both onclick="..." and window.iLike works ──
Object.assign(window, {
  iLike: {
    show, openModal, closeModal, closeAll, confirmBox, cfyes, same, openSames, openThread, closeThread, sendReply,
    tapFab, closePost, pickPhotos, rmPhoto, publish, openEd, saveEd, delPost, openPm, openAx, setF, ftab, findTab,
    openCircle, toggleFollow, meTab, setMt, openPk, drawPk, toggleInt, openPe, saveProfile, openSet, setTheme, accent,
    fnt, eventsTab, openEvent, closeEventView, setEvTab, imin, sendEventChat, shareCurrentEvent, openTickets, closeTickets,
    adjustTicketQty, confirmTickets, openChats, openDm, openChat, send, sayHi, openNotifs, openProfile, share,
    handleMentionClick, insertMentionTag, toast, S
  },
  show, openModal, closeModal, closeAll, confirmBox, cfyes, same, openSames, openThread, closeThread, sendReply,
  tapFab, closePost, pickPhotos, rmPhoto, publish, openEd, saveEd, delPost, openPm, openAx, setF, ftab, findTab,
  openCircle, toggleFollow, meTab, setMt, openPk, drawPk, toggleInt, openPe, saveProfile, openSet, setTheme, accent,
  fnt, eventsTab, openEvent, closeEventView, setEvTab, imin, sendEventChat, shareCurrentEvent, openTickets, closeTickets,
  adjustTicketQty, confirmTickets, openChats, openDm, openChat, send, sayHi, openNotifs, openProfile, share,
  handleMentionClick, insertMentionTag, toast
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  home();
  findTab();
  eventsTab();
  meTab();
  show('home');

  window.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });
  $$('.mod').forEach(m => {
    m.addEventListener('click', ev => {
      if (ev.target === m) { m.classList.remove('on'); $('#fabBtn')?.classList.remove('spin'); }
    });
  });
  $$('#nav button[data-s]').forEach(b => {
    b.addEventListener('click', () => {
      const s = b.dataset.s;
      if (s) {
        show(s);
        if (s === 'home') home();
        else if (s === 'find') findTab();
        else if (s === 'events') eventsTab();
        else if (s === 'me') meTab();
      }
    });
  });
});
