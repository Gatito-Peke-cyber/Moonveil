/* =========================================================
   Moonveil Social — ins.js
   Red social completa, 100% funcional
   ========================================================= */

'use strict';

const $ = (q, ctx = document) => ctx.querySelector(q);
const $$ = (q, ctx = document) => [...ctx.querySelectorAll(q)];

/* ─────────────────────────────────────
   NAVBAR RESPONSIVE (= tienda)
───────────────────────────────────── */
const navToggle = $('#navToggle');
const navLinks  = $('#navLinks');
navToggle?.addEventListener('click', e => {
  e.stopPropagation();
  navLinks.classList.toggle('open');
});
document.addEventListener('click', e => {
  if (!navToggle?.contains(e.target) && !navLinks?.contains(e.target)) {
    navLinks?.classList.remove('open');
  }
});

/* HUD Bars */
$$('.hud-bar').forEach(b => b.style.setProperty('--v', +b.dataset.val || 50));

/* ─────────────────────────────────────
   PARTÍCULAS
───────────────────────────────────── */
(function initParticles() {
  const c = $('#bgParticles');
  if (!c) return;
  const ctx = c.getContext('2d');
  const dpr = Math.max(1, devicePixelRatio || 1);
  let W, H, parts;
  const COLORS = ['rgba(6,182,212,', 'rgba(34,211,238,', 'rgba(103,232,249,', 'rgba(14,165,233,'];
  const init = () => {
    W = c.width = innerWidth * dpr;
    H = c.height = innerHeight * dpr;
    parts = Array.from({ length: 90 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: (1 + Math.random() * 2.5) * dpr,
      vy: 0.2 + Math.random() * 0.8,
      vx: (Math.random() - 0.5) * 0.3,
      a: 0.1 + Math.random() * 0.3,
      col: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));
  };
  const tick = () => {
    ctx.clearRect(0, 0, W, H);
    parts.forEach(p => {
      p.y += p.vy; p.x += p.vx + Math.sin(p.y * 0.003) * 0.3;
      if (p.y > H) { p.y = -6; p.x = Math.random() * W; }
      if (p.x < 0 || p.x > W) p.vx *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.col + p.a + ')';
      ctx.fill();
    });
    requestAnimationFrame(tick);
  };
  init(); tick();
  addEventListener('resize', init);
})();

/* ─────────────────────────────────────
   PARALLAX
───────────────────────────────────── */
(function initParallax() {
  const layers = $$('.layer');
  if (!layers.length) return;
  const k = [0, 0.02, 0.05, 0.09];
  const onScroll = () => {
    const y = scrollY;
    layers.forEach((el, i) => { el.style.transform = `translateY(${y * k[i]}px)` });
  };
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });
})();

/* ─────────────────────────────────────
   REVEAL ON SCROLL
───────────────────────────────────── */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); } });
}, { threshold: 0.1 });
$$('.reveal').forEach(el => revealObs.observe(el));

/* ─────────────────────────────────────
   DATOS — USUARIOS
───────────────────────────────────── */
const users = [
  {
    id: 'u1', name: 'Sand Brill', username: '@sand_trader', avatar: 'vill/vill1.jpg',
    online: true, followers: 1247, verified: true,
    quickReplies: ['¿Hola?', 'Esmeraldas', 'Tradear', 'Bien'],
    brain: {
      type: 'options',
      opts: [
        { k: 'hola', r: 'Hola! ¿Tienes esmeraldas para tradear? 💎' },
        { k: '¿hola?', r: 'Hola! ¿Tienes esmeraldas para tradear? 💎' },
        { k: 'esmeraldas', r: '¡Me encantan! Son mi obsesión total. ¿Cuántas tienes? 💎💎' },
        { k: 'tradear', r: '¡Siempre listo para un buen trato! ¿Qué ofreces?' },
        { k: 'bien', r: '¡Genial! Ahora dame esmeraldas jaja 😂' },
        { k: 'mal', r: 'Ay no... Ánimo, siempre mejora!' },
        { k: 'lobo', r: 'Runa es la mejor loba del mundo 🐺' },
      ],
      fallback: 'Mmm... No entiendo, ¡pero hablemos de esmeraldas! 💎',
    },
  },
  {
    id: 'u2', name: 'Eduard Moss', username: '@granjero_moss', avatar: 'vill/villplains.jpg',
    online: true, followers: 892, verified: false,
    quickReplies: ['Agricultura', 'Libros', 'Semillas'],
    brain: {
      type: 'keyword',
      kw: { 'agricultura': 'La agricultura es mi pasión, colega! 🌾', 'libros': 'Tengo libros muy interesantes del pasado...', 'semillas': 'Las semillas son el origen de todo! 🌱', 'hola': 'Hola colega! ¿Cómo te fue en la cosecha?', 'bien': '¡Me alegro! Yo también tuve buena cosecha hoy.', 'mal': 'No te desanimes, colega. El campo siempre da otra oportunidad.', 'zanahorias': '¡Las mejores de la región! 🥕' },
      fallback: 'Interesante, colega. Cuéntame más!',
    },
  },
  {
    id: 'u3', name: 'Orik Vall', username: '@cartografo_orik', avatar: 'vill/cartografo.jpg',
    online: true, followers: 1056, verified: true,
    quickReplies: ['Mapas', 'Exploración', 'Misterios'],
    brain: {
      type: 'keyword',
      kw: { 'mapas': 'Los mapas son mi especialidad, my friend! 🗺️', 'exploración': '¡Me encanta explorar nuevos lugares!', 'misterios': 'Hay muchos misterios en los mapas antiguos...', 'hola': 'Hola my friend! ¿Lista para la aventura?', '2012': 'Ese caso... es muy extraño, my friend.', 'desconocido': 'Hay lugares que aparecen y desaparecen en mis mapas...' },
      fallback: 'Interesante observación, my friend! 🧭',
    },
  },
  {
    id: 'u4', name: 'Steven Moss', username: '@bibliotecario_s', avatar: 'vill/bibliotecario.jpg',
    online: false, followers: 743, verified: false,
    quickReplies: ['Libros', 'Escribir', 'Historias'],
    brain: {
      type: 'keyword',
      kw: { 'libros': '¡Los libros son portales a otros mundos! 📚', 'escribir': 'Escribir es mi mayor pasión!', 'historias': 'Cada historia tiene algo especial...', 'hola': 'Hola! ¿Qué libro estás leyendo?', 'rosa': 'Ah, una novela medieval fascinante...' },
      fallback: 'Déjame pensar en eso...',
    },
  },
  {
    id: 'u5', name: 'David Kal', username: '@davidcito', avatar: 'img/babyvillager.jpg',
    online: true, followers: 2134, verified: false,
    quickReplies: ['Hola', 'Dibujar', 'Amigo'],
    brain: {
      type: 'options',
      opts: [
        { k: 'hola', r: '¡Hola colegita! ¿Cómo estás? 😊' },
        { k: 'bien', r: '¡Qué bien colegita! Me alegra mucho! 🎉' },
        { k: 'mal', r: 'No te pongas mal colegita, ¡eres increíble! 💙' },
        { k: 'dibujar', r: '¡Me ENCANTA dibujar! Es mi pasión total! 🎨' },
        { k: 'amigo', r: 'Sí colegita, ¡somos amigos! Para siempre! 😊' },
        { k: 'alex', r: 'Alex es mi lobo favorito! 🐺' },
      ],
      fallback: 'Colegita, no entendí... pero ¡está bien! 😄',
    },
  },
  {
    id: 'u6', name: 'News Villager', username: '@news_today', avatar: 'gif/news-villager.gif',
    online: true, followers: 5678, verified: true,
    quickReplies: ['Noticias', 'Golem', 'Minecraft'],
    brain: {
      type: 'options',
      opts: [
        { k: 'noticias', r: 'Hmm... ¡Aquí con las últimas noticias! 📰' },
        { k: 'golem', r: 'El golem está en día libre hoy...' },
        { k: 'minecraft', r: '¡El mundo de bloques más increíble! 🎮' },
        { k: 'hola', r: 'Hmm... ¡Saludos! Hoy nada extraordinario.' },
      ],
      fallback: 'Hmm... No tengo esa noticia aún.',
    },
  },
  {
    id: 'u7', name: 'Guau Wolf', username: '@el_mas_perron', avatar: 'vill/photowolf.jpg',
    online: true, followers: 3421, verified: false,
    quickReplies: ['Guau', 'Lobo', 'Perron'],
    brain: {
      type: 'options',
      opts: [
        { k: 'guau', r: '¡Guau! 🐺' },
        { k: 'guau?', r: 'Guau guau! 🐺🐺' },
        { k: 'lobo', r: '¡Auuuuuu! 🐺🌕' },
        { k: 'perron', r: '¡Guau! ¡Soy el más perrón! 😎🐺' },
        { k: 'hola', r: 'Guau guau guau! 🐾' },
      ],
      fallback: 'Guau! 🐺',
    },
  },
];

/* ─────────────────────────────────────
   DATOS — POSTS
───────────────────────────────────── */
const posts = [
  { id:'p1', uid:'u1', img:'vill/vill1.jpg', text:'Nuevo día, nuevas esmeraldas! 💎✨ Quien quiera tradear que me hable! #Esmeraldas #Trading #MinecraftLife', time:'Hace 3h', ts: Date.now()-3*3600000, comments:[{uid:'u5',text:'Qué bonita foto colegita! 😊',time:'Hace 2h'},{uid:'u2',text:'Buen trading, colega!',time:'Hace 1h'},{uid:'u3',text:'Esas esmeraldas se ven de calidad, my friend!',time:'Hace 45min'}] },
  { id:'p2', uid:'u5', img:'dav/happyg2.jpg', text:'Mi nuevo dibujo colegitas! Me esforcé mucho 🎨✏️ Espero que les guste! #Arte #Dibujo #MinecraftArt', time:'Hace 1h', ts: Date.now()-3600000, comments:[{uid:'u1',text:'Está increíble! Tienes mucho talento! 🌟',time:'Hace 30min'},{uid:'u3',text:'Muy bonito, my friend!',time:'Hace 15min'},{uid:'u7',text:'Guau! Está genial colegita!',time:'Hace 10min'}] },
  { id:'p3', uid:'u2', img:'vill/villplains.jpg', text:'La cosecha de hoy fue excelente! 🌾🥕 La agricultura es vida, colegas! #Agricultura #Farming #VidaSana', time:'Hace 5h', ts: Date.now()-5*3600000, comments:[{uid:'u4',text:'Hermosa cosecha, Eduard!',time:'Hace 45min'},{uid:'u5',text:'Que bonitas zanahorias colegita!',time:'Hace 30min'}] },
  { id:'p4', uid:'u3', img:'vill/cartografo.jpg', text:'Descubrí un nuevo territorio inexplorado! 🗺️🧭 Los mapas nunca mienten... o sí? #Exploración #Mapas #Aventura', time:'Hace 2h', ts: Date.now()-2*3600000, comments:[{uid:'u2',text:'Increíble descubrimiento, my friend!',time:'Hace 1h'}] },
  { id:'p5', uid:'u7', img:'vill/photowolf.jpg', text:'Guau guau! Auuuuu! 🐺 Soy el más perron de mi cuadra! #Lobo #Perron #WolfLife', time:'Hace 30min', ts: Date.now()-1800000, comments:[{uid:'u5',text:'¡Jajaja eres genial! 🐺',time:'Hace 20min'},{uid:'u1',text:'El lobo más cool! Auuuu!',time:'Hace 10min'},{uid:'u6',text:'Hmm... Lobo viral hoy!',time:'Hace 5min'}] },
  { id:'p6', uid:'u6', img:'gif/news-minecraft.gif', text:'Hmm... Última hora: Aldeano encuentra diamantes! Pero era lapislázuli 💎😅 #Noticias #MinecraftNews #Fails', time:'Hace 6h', ts: Date.now()-6*3600000, comments:[{uid:'u2',text:'Jajaja clásico error!',time:'Hace 1h'},{uid:'u7',text:'Guau! Qué chistoso!',time:'Hace 45min'}] },
  { id:'p7', uid:'u4', img:'vill/bibliotecario.jpg', text:'Escribiendo nuevas historias... 📚✍️ La imaginación no tiene límites! #Escritura #Libros #Creatividad', time:'Hace 4h', ts: Date.now()-4*3600000, comments:[{uid:'u3',text:'Esperando leer tus historias, my friend!',time:'Hace 2h'}] },
  { id:'p8', uid:'u1', img:'img/ajolote.gif', text:'Encontré este ajolote! Es tan cute! 🌸💕 Alguien sabe cómo cuidarlo? #Ajolote #Cute #Mascotas', time:'Hace 7h', ts: Date.now()-7*3600000, comments:[{uid:'u5',text:'Awww es hermoso colegita!',time:'Hace 25min'},{uid:'u2',text:'Los ajolotes necesitan agua limpia, colega!',time:'Hace 15min'}] },
  { id:'p9', uid:'u3', img:'imagen/panda2.gif', text:'Los pandas son lo mejor! 🐼🎍 Relax y bambú, la vida perfecta! #Panda #Relax #Nature', time:'Hace 8h', ts: Date.now()-8*3600000, comments:[{uid:'u5',text:'Los pandas son adorables colegita!',time:'Hace 3h'}] },
  { id:'p10', uid:'u5', img:'dav/steve2.jpg', text:'Steve es mi héroe! 🗡️⛏️ Algún día seré tan valiente como él! #Steve #Héroe #Inspiración', time:'Hace 9h', ts: Date.now()-9*3600000, comments:[{uid:'u7',text:'Guau! Steve es genial!',time:'Hace 1h'},{uid:'u1',text:'Steve es legendario!',time:'Hace 40min'}] },
];

/* ─────────────────────────────────────
   ESTADO + LOCALSTORAGE
───────────────────────────────────── */
let currentPage  = 1;
const PER_PAGE   = 3;
let currentFilter = 'all';
let currentChatUser = null;
let currentStoryIdx = 0;
let storyTimer  = null;
let currentImgIdx = 0;
let allImages   = [];
let moodSelected = '';
let savedPosts  = JSON.parse(localStorage.getItem('ins_saved') || '{}');
let likedPosts  = JSON.parse(localStorage.getItem('ins_liked') || '{}');
let following   = JSON.parse(localStorage.getItem('ins_following') || '{}');
let userFollowers = parseInt(localStorage.getItem('ins_followers') || '247');
let userPosts   = JSON.parse(localStorage.getItem('ins_user_posts') || '[]');
let chatHistories = JSON.parse(localStorage.getItem('ins_chats') || '{}');

// Cargar likes de posts
posts.forEach(p => {
  p.likes = parseInt(localStorage.getItem(`ins_post_${p.id}`) || '0');
});

/* ─────────────────────────────────────
   UTILIDADES
───────────────────────────────────── */
const esc = s => String(s).replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));

function toast(msg, dur = 2200) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), dur);
}

function formatHashtags(txt) {
  return esc(txt).replace(/#(\w+)/g, '<span class="hashtag" data-tag="$1">#$1</span>');
}

function timeAgo(ts) {
  const d = (Date.now() - ts) / 1000;
  if (d < 60) return 'Ahora mismo';
  if (d < 3600) return `Hace ${Math.floor(d/60)}min`;
  if (d < 86400) return `Hace ${Math.floor(d/3600)}h`;
  return `Hace ${Math.floor(d/86400)}d`;
}

function saveLikes()    { localStorage.setItem('ins_liked', JSON.stringify(likedPosts)) }
function saveSaved()    { localStorage.setItem('ins_saved', JSON.stringify(savedPosts)) }
function saveFollowing(){ localStorage.setItem('ins_following', JSON.stringify(following)) }

function updateHeroStats() {
  const totalLikes = posts.reduce((a, p) => a + p.likes, 0) + userPosts.reduce((a, p) => a + (p.likes||0), 0);
  const totalCmts  = posts.reduce((a, p) => a + p.comments.length, 0);
  $('#heroFollowers').textContent = userFollowers;
  $('#heroPosts').textContent     = posts.length + userPosts.length;
  $('#heroLikes').textContent     = totalLikes;
  $('#heroComments').textContent  = totalCmts;
  $('#userFollowers').textContent = userFollowers;
  $('#myPostsCount').textContent  = posts.length + userPosts.length;
}

/* ─────────────────────────────────────
   SEGUIDORES GRADUALES
───────────────────────────────────── */
function tickFollowers() {
  if (Math.random() < 0.25) {
    const n = Math.floor(Math.random() * 3) + 1;
    userFollowers += n;
    localStorage.setItem('ins_followers', userFollowers);
    updateHeroStats();
    toast(`+${n} nuevo${n>1?'s':''} seguidor${n>1?'es':''}! 🎉`);
  }
  setTimeout(tickFollowers, (25 + Math.random() * 35) * 1000);
}

/* ─────────────────────────────────────
   LIKES GRADUALES
───────────────────────────────────── */
function tickLikes() {
  posts.forEach(p => {
    const hrs = (Date.now() - p.ts) / 3600000;
    const prob = hrs < 1 ? 0.4 : hrs < 3 ? 0.25 : hrs < 6 ? 0.15 : 0.07;
    if (Math.random() < prob) {
      p.likes++;
      localStorage.setItem(`ins_post_${p.id}`, p.likes);
      const el = $(`.post[data-id="${p.id}"]`);
      if (el) {
        const lk = el.querySelector('.post-likes');
        const lb = el.querySelector('.act-btn.like-btn span:last-child');
        if (lk) lk.innerHTML = `❤️ ${p.likes} Me gusta`;
        if (lb) lb.textContent = p.likes;
      }
    }
  });
  setTimeout(tickLikes, 7000 + Math.random() * 8000);
}

/* ─────────────────────────────────────
   RENDER — SUGERENCIAS
───────────────────────────────────── */
function renderSuggestions() {
  const c = $('#suggestions');
  c.innerHTML = users.slice(0, 4).map(u => `
    <div class="suggestion-item" data-uid="${u.id}">
      <div class="sugg-avatar"><img src="${u.avatar}" alt="${esc(u.name)}" /></div>
      <div class="sugg-info">
        <div class="sugg-name">${esc(u.name)}</div>
        <div class="sugg-sub">${u.followers.toLocaleString()} seguidores</div>
      </div>
      <button class="btn-follow ${following[u.id]?'following':''}" data-uid="${u.id}">
        ${following[u.id]?'Siguiendo':'Seguir'}
      </button>
    </div>
  `).join('');

  $$('.suggestion-item .sugg-avatar, .suggestion-item .sugg-info').forEach(el => {
    el.addEventListener('click', () => {
      const uid = el.closest('.suggestion-item').dataset.uid;
      openChat(uid);
    });
  });
  $$('.btn-follow').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const uid = btn.dataset.uid;
      if (following[uid]) {
        delete following[uid];
        btn.textContent = 'Seguir'; btn.classList.remove('following');
        toast('Dejaste de seguir a ' + users.find(u=>u.id===uid)?.name);
      } else {
        following[uid] = true;
        btn.textContent = 'Siguiendo'; btn.classList.add('following');
        toast('¡Ahora sigues a ' + users.find(u=>u.id===uid)?.name + '! 🎉');
      }
      saveFollowing();
    });
  });
}

/* ─────────────────────────────────────
   RENDER — TENDENCIAS
───────────────────────────────────── */
function renderTrending() {
  const c = $('#trending');
  const tags = [
    { tag:'Esmeraldas', n:234 }, { tag:'MinecraftLife', n:189 },
    { tag:'Trading', n:156 },    { tag:'Agricultura', n:142 },
    { tag:'Exploración', n:98 }, { tag:'WolfLife', n:77 },
  ];
  c.innerHTML = tags.map(t => `
    <div class="trend-item" data-tag="${t.tag}">
      <div class="trend-tag">#${t.tag}</div>
      <div class="trend-count">${t.n} posts</div>
    </div>
  `).join('');
  $$('.trend-item', c).forEach(el => {
    el.addEventListener('click', () => toast(`Mostrando #${el.dataset.tag}`));
  });
}

/* ─────────────────────────────────────
   RENDER — STORIES
───────────────────────────────────── */
function renderStories() {
  const c = $('#storiesScroll');
  // Mi historia (añadir)
  let html = `
    <div class="story-item" id="myStorySlot">
      <div class="story-ring my-story-ring">
        <div class="story-avi add-story-icon">+</div>
      </div>
      <div class="story-name">Mi historia</div>
    </div>
  `;
  html += users.map((u, i) => `
    <div class="story-item" data-story="${i}">
      <div class="story-ring ${Math.random()>.5?'seen':''}">
        <div class="story-avi"><img src="${u.avatar}" alt="${esc(u.name.split(' ')[0])}" /></div>
      </div>
      <div class="story-name">${esc(u.name.split(' ')[0])}</div>
    </div>
  `).join('');
  c.innerHTML = html;

  $$('.story-item[data-story]', c).forEach(el => {
    el.addEventListener('click', () => openStory(+el.dataset.story));
  });
  $('#myStorySlot').addEventListener('click', () => toast('📸 Función de historia propia próximamente'));
}

/* ─────────────────────────────────────
   RENDER — POSTS
───────────────────────────────────── */
function getFilteredPosts() {
  let list = [...posts, ...userPosts.map(p => ({ ...p, _user: true }))];
  if (currentFilter === 'recent')    list = list.sort((a,b) => b.ts - a.ts);
  if (currentFilter === 'popular')   list = list.sort((a,b) => b.likes - a.likes);
  if (currentFilter === 'following') list = list.filter(p => following[p.uid]);
  return list.sort((a,b) => b.ts - a.ts);
}

function renderPosts() {
  const c = $('#postsContainer');
  const all = getFilteredPosts();
  const total = all.length;
  const totalPages = Math.ceil(total / PER_PAGE);
  const slice = all.slice((currentPage-1)*PER_PAGE, currentPage*PER_PAGE);

  if (slice.length === 0) {
    c.innerHTML = `<div style="text-align:center;padding:50px 20px;color:var(--muted)"><div style="font-size:3rem;margin-bottom:12px">😶</div><h4 style="color:var(--text)">Sin posts aquí</h4><p style="font-size:.9rem;margin-top:6px">Cambia el filtro o sigue a alguien</p></div>`;
    updatePagination(totalPages);
    return;
  }

  c.innerHTML = slice.map(post => {
    const u = post._user ? { name:'Jugador', username:'@player_001', avatar:'img/imper.jpg', verified:false } : users.find(u => u.id === post.uid);
    const liked  = likedPosts[post.id] || false;
    const saved2 = savedPosts[post.id] || false;
    const moodBadge = post.mood ? `<span class="post-mood-badge">${post.mood}</span>` : '';

    return `
    <article class="post" data-id="${post.id}">
      <div class="post-header">
        <div class="post-user" data-uid="${post._user ? 'me' : u.id}">
          <div class="post-avi"><img src="${u.avatar}" alt="${esc(u.name)}" loading="lazy" /></div>
          <div>
            <div class="post-uname">
              ${esc(u.name)}
              ${u.verified ? '<span class="verified">✓</span>' : ''}
              ${moodBadge}
            </div>
            <div class="post-time">${post.time || timeAgo(post.ts)}</div>
          </div>
        </div>
        <button class="post-menu" title="Más opciones">⋯</button>
      </div>
      <div class="post-image" data-img="${post.img}">
        <img src="${post.img}" alt="Post" loading="lazy" />
      </div>
      <div class="post-actions">
        <button class="act-btn like-btn ${liked?'liked':''}" data-id="${post.id}" title="${liked?'Quitar me gusta':'Me gusta'}">
          <span class="act-ico">${liked?'❤️':'🤍'}</span><span>${post.likes}</span>
        </button>
        <button class="act-btn cmt-open-btn" data-id="${post.id}" title="Comentarios">
          <span class="act-ico">💬</span><span>${post.comments?.length||0}</span>
        </button>
        <button class="act-btn share-btn" title="Compartir"><span class="act-ico">📤</span></button>
        <div class="act-spacer"></div>
        <button class="act-btn save-btn ${saved2?'saved':''}" data-id="${post.id}" title="${saved2?'Guardado':'Guardar'}">
          <span class="act-ico">${saved2?'🔖':'🔲'}</span>
        </button>
      </div>
      <div class="post-content">
        ${post.likes > 0 ? `<div class="post-likes">❤️ ${post.likes} Me gusta</div>` : ''}
        <div class="post-text"><strong>${esc(u.name)}</strong> ${formatHashtags(post.text)}</div>
        ${(post.comments?.length||0) > 0
          ? `<div class="view-cmts" data-id="${post.id}">Ver los ${post.comments.length} comentario${post.comments.length>1?'s':''}</div>`
          : `<div class="view-cmts muted" data-id="${post.id}" style="cursor:pointer">Sé el primero en comentar</div>`}
      </div>
    </article>`;
  }).join('');

  /* Eventos */
  $$('.like-btn').forEach(btn => btn.addEventListener('click', () => handleLike(btn.dataset.id)));
  $$('.cmt-open-btn, .view-cmts').forEach(el => el.addEventListener('click', () => openComments(el.dataset.id)));
  $$('.post-user[data-uid]').forEach(el => el.addEventListener('click', () => { if(el.dataset.uid!=='me') openChat(el.dataset.uid) }));
  $$('.post-image').forEach(el => el.addEventListener('click', () => openImageModal(el.dataset.img, el)));
  $$('.share-btn').forEach(btn => btn.addEventListener('click', () => {
    toast('Post compartido! 📤');
    const id = btn.closest('.post').dataset.id;
    const p = [...posts,...userPosts].find(x=>x.id===id);
    if (p) { p.likes += Math.floor(Math.random()*3)+1; localStorage.setItem(`ins_post_${p.id}`,p.likes); renderPosts(); }
  }));
  $$('.save-btn').forEach(btn => btn.addEventListener('click', () => handleSave(btn.dataset.id)));
  $$('.post-menu').forEach(btn => btn.addEventListener('click', () => {
    const id = btn.closest('.post').dataset.id;
    toast('Opciones para el post');
    // Podrías abrir un mini menú contextual aquí
  }));
  $$('.hashtag').forEach(tag => tag.addEventListener('click', e => { e.stopPropagation(); toast(`Mostrando posts con #${tag.dataset.tag}`) }));

  updatePagination(totalPages);
  updateHeroStats();
}

/* ─────────────────────────────────────
   PAGINACIÓN
───────────────────────────────────── */
function updatePagination(totalPages) {
  if (!totalPages) totalPages = Math.ceil(getFilteredPosts().length / PER_PAGE);
  $('#pageInfo').textContent = `Página ${currentPage} de ${Math.max(1,totalPages)}`;
  $('#prevPage').disabled = currentPage <= 1;
  $('#nextPage').disabled = currentPage >= totalPages;
}
$('#prevPage').addEventListener('click', () => {
  if (currentPage > 1) { currentPage--; renderPosts(); scrollTo({ top: 0, behavior:'smooth' }); }
});
$('#nextPage').addEventListener('click', () => {
  if (currentPage < Math.ceil(getFilteredPosts().length/PER_PAGE)) { currentPage++; renderPosts(); scrollTo({ top:0, behavior:'smooth' }); }
});

/* ─────────────────────────────────────
   FILTROS
───────────────────────────────────── */
$$('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    currentPage = 1;
    renderPosts();
  });
});

/* ─────────────────────────────────────
   LIKE
───────────────────────────────────── */
function handleLike(postId) {
  const post = [...posts, ...userPosts].find(p => p.id === postId);
  if (!post) return;
  if (likedPosts[postId]) {
    post.likes = Math.max(0, post.likes - 1);
    delete likedPosts[postId];
  } else {
    post.likes++;
    likedPosts[postId] = true;
    toast('❤️ ¡Te gusta este post!');
  }
  localStorage.setItem(`ins_post_${postId}`, post.likes);
  saveLikes();
  renderPosts();
}

/* SAVE */
function handleSave(postId) {
  if (savedPosts[postId]) {
    delete savedPosts[postId];
    toast('🔲 Post eliminado de guardados');
  } else {
    savedPosts[postId] = true;
    toast('🔖 Post guardado!');
  }
  saveSaved();
  renderPosts();
}

/* ─────────────────────────────────────
   CREAR POST
───────────────────────────────────── */
const newPostInput = $('#newPostInput');
const charCounter  = $('#charCounter');

newPostInput?.addEventListener('input', () => {
  const rem = 280 - newPostInput.value.length;
  charCounter.textContent = rem;
  charCounter.className = 'char-counter' + (rem<30?' warn':'') + (rem<10?' danger':'');
});

// Mood picker
$('#toolMood').addEventListener('click', () => {
  $('#moodGrid').classList.toggle('hidden');
});
$$('.mood-grid span').forEach(span => {
  span.addEventListener('click', () => {
    moodSelected = span.dataset.mood;
    $('#toolMood').textContent = moodSelected;
    $('#toolMood').classList.add('active');
    $('#moodGrid').classList.add('hidden');
    toast(`Estado: ${moodSelected}`);
  });
});
$('#toolTag').addEventListener('click', () => toast('🏷️ Etiquetado próximamente'));
$('#toolLocation').addEventListener('click', () => toast('📍 Ubicación: Aldea Principal'));

$('#btnPublish').addEventListener('click', publishPost);
function publishPost() {
  const text = newPostInput.value.trim();
  if (!text) { toast('✏️ Escribe algo primero'); return; }
  if (text.length > 280) { toast('⚠️ Máximo 280 caracteres'); return; }

  const np = {
    id: 'up_' + Date.now(),
    uid: 'me',
    _user: true,
    img: 'img/imper.jpg',
    text,
    mood: moodSelected,
    ts: Date.now(),
    time: 'Ahora mismo',
    likes: 0,
    comments: [],
  };
  userPosts.unshift(np);
  localStorage.setItem('ins_user_posts', JSON.stringify(userPosts));

  newPostInput.value = '';
  charCounter.textContent = '280';
  charCounter.className = 'char-counter';
  moodSelected = '';
  $('#toolMood').textContent = '😊';
  $('#toolMood').classList.remove('active');

  currentPage = 1; currentFilter = 'all';
  $$('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.filter==='all'));
  renderPosts();
  toast('✅ Post publicado!');
}

/* Bio editable */
$('#profileBio')?.addEventListener('blur', () => {
  localStorage.setItem('ins_bio', $('#profileBio').textContent.trim());
  toast('Bio actualizada! ✅');
});
const savedBio = localStorage.getItem('ins_bio');
if (savedBio) $('#profileBio').textContent = savedBio;

/* ─────────────────────────────────────
   MODAL COMENTARIOS
───────────────────────────────────── */
let currentCommentPostId = null;
function openComments(postId) {
  const post = [...posts,...userPosts].find(p => p.id === postId);
  if (!post) return;
  currentCommentPostId = postId;

  const u = post._user
    ? { name:'Jugador', avatar:'img/imper.jpg' }
    : users.find(x => x.id === post.uid);
  const liked  = likedPosts[postId] || false;
  const saved2 = savedPosts[postId] || false;

  $('#cmtPostImg').src     = post.img;
  $('#cmtUserAvatar').src  = u.avatar;
  $('#cmtUserName').textContent = u.name;
  $('#cmtPostText').innerHTML  = formatHashtags(post.text);
  $('#cmtLikesTxt').innerHTML  = `<strong>${post.likes}</strong> Me gusta`;
  $('#cmtTimeTxt').textContent = (post.time || timeAgo(post.ts)).toUpperCase();

  const likeBtn = $('#cmtLikeBtn');
  likeBtn.textContent = liked ? '❤️' : '🤍';
  likeBtn.className   = liked ? 'cmt-act liked' : 'cmt-act';

  const saveBtn = $('#cmtSaveBtn');
  saveBtn.textContent = saved2 ? '🔖' : '🔲';
  saveBtn.className   = saved2 ? 'cmt-act cmt-save saved' : 'cmt-act cmt-save';

  const body = $('#cmtBody');
  if (!post.comments || post.comments.length === 0) {
    body.innerHTML = `<div style="text-align:center;padding:40px 20px;color:var(--muted)"><div style="font-size:2.5rem;margin-bottom:10px">💬</div><h4 style="color:var(--text)">Sin comentarios aún</h4><p style="font-size:.85rem;margin-top:4px">¡Sé el primero en comentar!</p></div>`;
  } else {
    body.innerHTML = post.comments.map(c => {
      const cu = users.find(x => x.id === c.uid) || { name:'Jugador', avatar:'img/imper.jpg' };
      return `
      <div class="comment">
        <div class="c-avi"><img src="${cu.avatar}" alt="${esc(cu.name)}" /></div>
        <div class="c-body">
          <div class="c-meta">
            <span class="c-name">${esc(cu.name)}</span>
            <span class="c-time">${c.time}</span>
          </div>
          <div class="c-text">${esc(c.text)}</div>
          <div class="c-acts">
            <span class="c-act" onclick="toast('❤️ Me gusta')">Me gusta</span>
            <span class="c-act" onclick="toast('💬 Responder próximamente')">Responder</span>
          </div>
        </div>
      </div>`;
    }).join('');
  }

  showModal('commentsModal');
}

$('#cmtLikeBtn').addEventListener('click', () => {
  if (!currentCommentPostId) return;
  handleLike(currentCommentPostId);
  const liked = likedPosts[currentCommentPostId]||false;
  const post  = [...posts,...userPosts].find(p=>p.id===currentCommentPostId);
  $('#cmtLikeBtn').textContent = liked?'❤️':'🤍';
  $('#cmtLikeBtn').className   = liked?'cmt-act liked':'cmt-act';
  if (post) $('#cmtLikesTxt').innerHTML = `<strong>${post.likes}</strong> Me gusta`;
});
$('#cmtSaveBtn').addEventListener('click', () => {
  if (!currentCommentPostId) return;
  handleSave(currentCommentPostId);
  const sv = savedPosts[currentCommentPostId]||false;
  $('#cmtSaveBtn').textContent = sv?'🔖':'🔲';
  $('#cmtSaveBtn').className   = sv?'cmt-act cmt-save saved':'cmt-act cmt-save';
});
$('#closeComments').addEventListener('click', ()=>hideModal('commentsModal'));
$('#commentsBackdrop').addEventListener('click', ()=>hideModal('commentsModal'));

/* ─────────────────────────────────────
   MODAL IMAGEN
───────────────────────────────────── */
function openImageModal(src) {
  allImages = posts.map(p=>p.img);
  currentImgIdx = allImages.indexOf(src);
  if (currentImgIdx<0) { currentImgIdx=0; allImages=[src]; }
  setImage(currentImgIdx);
  showModal('imageModal');
}
function setImage(i) {
  $('#bigImage').src = allImages[i] || allImages[0];
  $('#imgCaption').textContent = `Imagen ${i+1} de ${allImages.length}`;
}
$('#imgPrev').addEventListener('click', ()=>{ currentImgIdx=(currentImgIdx-1+allImages.length)%allImages.length; setImage(currentImgIdx); });
$('#imgNext').addEventListener('click', ()=>{ currentImgIdx=(currentImgIdx+1)%allImages.length; setImage(currentImgIdx); });
$('#closeImage').addEventListener('click', ()=>hideModal('imageModal'));
$('#imageBackdrop').addEventListener('click', ()=>hideModal('imageModal'));

/* ─────────────────────────────────────
   MODAL STORY
───────────────────────────────────── */
function openStory(idx) {
  const u = users[idx];
  if (!u) return;
  currentStoryIdx = idx;
  $('#storyAvi').src = u.avatar;
  $('#storyName').textContent = u.name;
  $('#storyTimeStr').textContent = 'Ahora';
  $('#storyBody').innerHTML = `<img src="${u.avatar}" style="max-height:480px;object-fit:contain" alt="Story" />`;
  $('#storyFill').style.width = '0%';
  showModal('storyModal');

  clearInterval(storyTimer);
  let pct = 0;
  storyTimer = setInterval(() => {
    pct += 1;
    $('#storyFill').style.width = pct + '%';
    if (pct >= 100) {
      clearInterval(storyTimer);
      const next = currentStoryIdx + 1;
      if (next < users.length) openStory(next);
      else hideModal('storyModal');
    }
  }, 50);
}
$('#closeStory').addEventListener('click', ()=>{ clearInterval(storyTimer); hideModal('storyModal'); });
$('#storyBackdrop').addEventListener('click', ()=>{ clearInterval(storyTimer); hideModal('storyModal'); });
$('#storyPrev').addEventListener('click', ()=>{ if(currentStoryIdx>0) openStory(currentStoryIdx-1); });
$('#storyNext').addEventListener('click', ()=>{ if(currentStoryIdx<users.length-1) openStory(currentStoryIdx+1); });

/* ─────────────────────────────────────
   RENDER DM LIST
───────────────────────────────────── */
function renderDMList() {
  const c = $('#dmList');
  const visible = users.slice(0, 6);
  c.innerHTML = visible.map(u => {
    const lastMsgs = chatHistories[u.id] || [];
    const lastMsg  = lastMsgs.length ? lastMsgs[lastMsgs.length-1].text : 'Toca para chatear';
    const unread   = !chatHistories[u.id] && Math.random()>.6;
    return `
    <div class="dm-item ${unread?'unread':''}" data-uid="${u.id}">
      <div class="dm-avi ${u.online?'online':''}"><img src="${u.avatar}" alt="${esc(u.name)}" /></div>
      <div class="dm-info">
        <div class="dm-name">${esc(u.name)}</div>
        <div class="dm-last">${esc(lastMsg.substring(0,40))}${lastMsg.length>40?'…':''}</div>
      </div>
      ${unread ? '<span class="dm-badge">1</span>' : ''}
    </div>`;
  }).join('');
  $$('.dm-item', c).forEach(el => el.addEventListener('click', ()=>openChat(el.dataset.uid)));
}

/* Búsqueda DMs */
$('#dmSearch').addEventListener('input', e => {
  const q = e.target.value.toLowerCase();
  $$('.dm-item').forEach(el => {
    el.style.display = el.querySelector('.dm-name').textContent.toLowerCase().includes(q) ? '' : 'none';
  });
});

/* Online avatars */
function renderOnlineAvatars() {
  const c = $('#onlineAvatars');
  c.innerHTML = users.filter(u=>u.online).map(u => `
    <div class="online-avi" data-uid="${u.id}" title="${esc(u.name)}">
      <img src="${u.avatar}" alt="${esc(u.name)}" />
    </div>
  `).join('');
  $$('.online-avi').forEach(el=>el.addEventListener('click',()=>openChat(el.dataset.uid)));
}

/* Nuevo DM */
$('#newDM').addEventListener('click', () => {
  const names = users.filter(u=>u.online).map(u=>u.name).join(', ');
  toast(`En línea: ${names}`);
});

/* ─────────────────────────────────────
   CHAT MODAL
───────────────────────────────────── */
function openChat(uid) {
  const u = users.find(x => x.id === uid);
  if (!u) return;
  currentChatUser = u;

  $('#chatAvatar').src = u.avatar;
  $('#chatName').textContent = u.name;
  $('#chatStatus').textContent = u.online ? 'En línea' : 'Desconectado';
  const dot = $('#chatDot');
  dot.className = u.online ? 'chat-status-dot' : 'chat-status-dot offline';

  // Rellenar info panel
  $('#chatInfoAvi').src = u.avatar;
  $('#chatInfoName').textContent = u.name;
  $('#chatInfoSub').textContent  = `${u.followers.toLocaleString()} seguidores · ${u.username}`;

  // Historial
  const hist = chatHistories[uid] || [];
  const body = $('#chatBody');
  body.innerHTML = '';

  if (hist.length === 0) {
    body.innerHTML = `
      <div class="chat-welcome">
        <div class="cw-avi"><img src="${u.avatar}" alt="${esc(u.name)}" /></div>
        <h4>${esc(u.name)}</h4>
        <p style="font-size:.85rem;color:var(--muted)">${esc(u.username)} · ${u.followers.toLocaleString()} seguidores</p>
        <p style="font-size:.82rem;margin-top:8px">Escribe un mensaje o usa las respuestas rápidas ↓</p>
      </div>`;
  } else {
    hist.forEach(msg => appendBubble(msg.sender, msg.text, false));
  }

  renderQuickReplies(u);
  showModal('chatModal');
  setTimeout(()=>$('#chatInput')?.focus(), 280);
}

function renderQuickReplies(u) {
  const bar = $('#quickBar');
  bar.innerHTML = (u.quickReplies || []).map(r =>
    `<button class="qr-btn" data-txt="${esc(r)}">${esc(r)}</button>`
  ).join('');
  $$('.qr-btn', bar).forEach(btn => btn.addEventListener('click', () => sendMessage(btn.dataset.txt)));
}

$('#chatComposer').addEventListener('submit', e => {
  e.preventDefault();
  const inp = $('#chatInput');
  const txt = inp.value.trim();
  if (!txt || !currentChatUser) return;
  sendMessage(txt);
  inp.value = '';
});

function sendMessage(text) {
  if (!currentChatUser) return;
  const body = $('#chatBody');
  body.querySelector('.chat-welcome')?.remove();

  // Guardar historial
  if (!chatHistories[currentChatUser.id]) chatHistories[currentChatUser.id] = [];
  chatHistories[currentChatUser.id].push({ sender:'me', text });
  localStorage.setItem('ins_chats', JSON.stringify(chatHistories));

  appendBubble('me', text, true);
  showTyping();

  setTimeout(() => {
    hideTyping();
    const reply = computeReply(currentChatUser, text);
    chatHistories[currentChatUser.id].push({ sender:'peer', text: reply });
    localStorage.setItem('ins_chats', JSON.stringify(chatHistories));
    appendBubble('peer', reply, true);
    renderDMList();
  }, 700 + Math.random() * 900);
}

function appendBubble(sender, text, scroll = true) {
  if (!currentChatUser) return;
  const body = $('#chatBody');
  const u = currentChatUser;
  const time = new Date().toLocaleTimeString('es-PE', { hour:'2-digit', minute:'2-digit' });
  const isMe = sender === 'me';

  const div = document.createElement('div');
  div.className = `chat-msg ${isMe ? 'me' : 'peer'}`;
  div.innerHTML = `
    <div class="msg-avi"><img src="${isMe ? 'img/imper.jpg' : u.avatar}" alt="" /></div>
    <div class="bubble">
      <div class="bubble-text">${esc(text)}</div>
      <div class="bubble-meta">${time}${isMe ? ' ✓' : ''}</div>
    </div>`;
  body.appendChild(div);
  if (scroll) body.scrollTop = body.scrollHeight;
}

function showTyping() {
  const body = $('#chatBody');
  const d = document.createElement('div');
  d.className = 'typing'; d.id = 'typingBubble';
  d.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
  body.appendChild(d);
  body.scrollTop = body.scrollHeight;
}
function hideTyping() { $('#typingBubble')?.remove(); }

function computeReply(u, text) {
  const t = text.trim().toLowerCase();
  const b = u.brain;
  if (b.type === 'options') {
    const match = b.opts.find(o => o.k === t);
    if (match) return match.r;
    const partial = b.opts.find(o => t.includes(o.k) || o.k.includes(t));
    if (partial) return partial.r;
  }
  if (b.type === 'keyword') {
    for (const [kw, reply] of Object.entries(b.kw)) {
      if (new RegExp(`\\b${kw}\\b`, 'i').test(t)) return reply;
    }
  }
  return b.fallback;
}

/* Emoji strip */
$('#emojiToggle').addEventListener('click', () => {
  $('#emojiStrip').classList.toggle('hidden');
});
$$('.emoji-strip span').forEach(span => {
  span.addEventListener('click', () => {
    const inp = $('#chatInput');
    inp.value += span.dataset.e;
    inp.focus();
  });
});

/* Info panel */
$('#chatInfoBtn').addEventListener('click', () => $('#chatInfoPanel').classList.toggle('hidden'));

/* Video / llamada simulados */
$('#chatVideoBtn').addEventListener('click', () => {
  toast('📹 Iniciando videollamada…');
  setTimeout(() => toast('❌ Videollamada no disponible ahora'), 1800);
});
$('#chatCallBtn').addEventListener('click', () => {
  toast('📞 Llamando…');
  setTimeout(() => toast('❌ Sin respuesta'), 1800);
});
$('#gifBtn').addEventListener('click', () => toast('🖼️ GIFs próximamente'));

$('#closeChat').addEventListener('click', () => { hideModal('chatModal'); currentChatUser = null; });
$('#chatBackdrop').addEventListener('click', () => { hideModal('chatModal'); currentChatUser = null; });

/* ─────────────────────────────────────
   MODAL HELPERS
───────────────────────────────────── */
function showModal(id) {
  const m = $(`#${id}`);
  m.classList.add('show');
  m.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
}
function hideModal(id) {
  const m = $(`#${id}`);
  m.classList.remove('show');
  m.setAttribute('aria-hidden','true');
  // Solo restaurar scroll si no hay otro modal abierto
  if (!document.querySelector('.modal.show')) document.body.style.overflow = '';
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    ['commentsModal','chatModal','imageModal','storyModal'].forEach(id => {
      if ($(`#${id}`)?.classList.contains('show')) {
        if (id==='storyModal') clearInterval(storyTimer);
        if (id==='chatModal') currentChatUser = null;
        hideModal(id);
      }
    });
  }
  if (e.key==='ArrowLeft' && $('#imageModal')?.classList.contains('show')) {
    currentImgIdx=(currentImgIdx-1+allImages.length)%allImages.length; setImage(currentImgIdx);
  }
  if (e.key==='ArrowRight' && $('#imageModal')?.classList.contains('show')) {
    currentImgIdx=(currentImgIdx+1)%allImages.length; setImage(currentImgIdx);
  }
});

/* ─────────────────────────────────────
   MÚSICA
───────────────────────────────────── */
window.toggleMusic = function () {
  const audio = $('#bg-music');
  const btn   = $('#floatingMusic');
  const disc  = $('#disc');
  const play  = $('#btnPlay');
  if (!audio) return;
  if (audio.paused) {
    audio.play().then(() => {
      btn?.classList.add('playing');
      disc?.classList.add('spinning');
      if (play) play.textContent = '⏸';
      localStorage.setItem('ins_music','on');
    }).catch(() => {});
  } else {
    audio.pause();
    btn?.classList.remove('playing');
    disc?.classList.remove('spinning');
    if (play) play.textContent = '▶';
    localStorage.setItem('ins_music','off');
  }
};

/* ─────────────────────────────────────
   STORY — botón añadir
───────────────────────────────────── */
$('#btnAddStory').addEventListener('click', () => toast('📸 Función de historia propia próximamente'));

/* ─────────────────────────────────────
   INIT
───────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  renderSuggestions();
  renderTrending();
  renderStories();
  renderPosts();
  renderDMList();
  renderOnlineAvatars();
  updateHeroStats();

  // Restaurar música
  const audio = $('#bg-music');
  if (localStorage.getItem('ins_music') === 'on' && audio) {
    audio.play().then(() => {
      $('#floatingMusic')?.classList.add('playing');
      $('#disc')?.classList.add('spinning');
      const play = $('#btnPlay');
      if (play) play.textContent = '⏸';
    }).catch(()=>{});
  }

  // Restaurar bio
  const bio = localStorage.getItem('ins_bio');
  if (bio) $('#profileBio').textContent = bio;

  // Arrancar ticks
  setTimeout(tickFollowers, 20000);
  setTimeout(tickLikes, 8000);

  console.log('🌊 Moonveil Social cargado! — Tema cian');
  console.log(`📸 ${posts.length} posts · 👥 ${users.length} usuarios`);
});