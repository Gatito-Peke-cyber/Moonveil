/* ══════════════════════════════════════════════════════
   Moonveil Portal — Perfiles (JS)
   ══════════════════════════════════════════════════════ */

const $ = (q, ctx = document) => ctx.querySelector(q);
const $$ = (q, ctx = document) => Array.from(ctx.querySelectorAll(q));

const ITEMS_PER_PAGE = 12;
let currentPage = 1;
let currentTierFilter    = 'all';
let currentSectionFilter = 'all';
let searchQuery = '';
let sortAsc = null; // null = original, true = A→Z, false = Z→A
let filteredList = [];
let currentList  = [];

/* ── AÑO ─────────────────────────────────────────────── */
$('#y').textContent = new Date().getFullYear();

/* ── HAMBURGER ───────────────────────────────────────── */
const navToggle = $('#navToggle');
const navLinks  = $('#navLinks');
navToggle?.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', open);
});

/* ── PARTÍCULAS ÁMBAR ────────────────────────────────── */
(function particles() {
  const c = $('#bgParticles');
  if (!c) return;
  const ctx = c.getContext('2d');
  const dpi = Math.max(1, devicePixelRatio || 1);
  let w, h, pts;

  const init = () => {
    w = c.width  = innerWidth  * dpi;
    h = c.height = innerHeight * dpi;
    pts = Array.from({ length: 110 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: (.8 + Math.random() * 2.2) * dpi,
      s: .18 + Math.random() * 1.3,
      a: .06 + Math.random() * .35,
      hue: 30 + Math.random() * 30,   // naranja / dorado
    }));
  };

  const tick = () => {
    ctx.clearRect(0, 0, w, h);
    pts.forEach(p => {
      p.y += p.s;
      p.x += Math.sin(p.y * .0018) * .5;
      if (p.y > h) { p.y = -10; p.x = Math.random() * w }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue},80%,60%,${p.a})`;
      ctx.fill();
    });
    requestAnimationFrame(tick);
  };

  init(); tick();
  addEventListener('resize', init);
})();

/* ── PARALLAX ────────────────────────────────────────── */
(function parallax() {
  const layers = $$('.layer');
  if (!layers.length) return;
  const k = [0, .025, .055, .09];
  const update = () => {
    const y = scrollY || 0;
    layers.forEach((el, i) => el.style.transform = `translateY(${y * k[i]}px)`);
  };
  update();
  addEventListener('scroll', update, { passive: true });
})();

/* ── DATOS ───────────────────────────────────────────── */
const VILLAGERS = [
  {
    id: 1, name: 'Sand Brill', alias: '███████', email: 'sand.brill@moonveil.mv',
    section: 'A-1', date: '2023-06-12', job: '█████████', img: 'vill/vill1.jpg',
    booksRelated: ['Ubik', 'House of Leaves'], booksRead: ['I Know Where She Is', 'A Night in the Lonesome October'],
    hobbies: ['Caminar', 'Leer', 'Tradear'], pets: [{ type: 'lobo', name: 'Runa' }],
    color: '#50C878', notes: 'Las esmeraldas son mi pasión.', tier: 'gold', specialty: 'Comercio',
    food: 'Pan de oro', season: 'Primavera'
  },
  {
    id: 2, name: 'Eduard Moss', alias: 'M10-25', email: 'eduard.moss@moonveil.mv',
    section: 'A-2', date: '2024-05-10', job: 'Granjero', img: 'vill/villplains.jpg',
    booksRelated: ['Diario del Granero'], booksRead: ['Cosechas Increíbles'],
    hobbies: ['Caminar', 'Cultivar'], pets: [{ type: 'gato', name: 'Polen' }],
    color: '#86efac', notes: 'Me gusta ver el atardecer.', tier: 'veteran', specialty: 'Agricultura',
    food: 'Zanahoria', season: 'Verano'
  },
  {
    id: 3, name: 'Brun Tallow', alias: 'El sin flechas', email: 'brun.tallow@moonveil.mv',
    section: 'B-1', date: '2025-04-12', job: 'Flechero', img: 'img/imgmine.jpg',
    booksRelated: ['Las Grandes Flechas'], booksRead: ['Los grandes tiradores'],
    hobbies: ['Tiro con arco'], pets: [{ type: 'Loro', name: 'Gatt' }],
    color: '#93c5fd', notes: 'Experto en arquería.', tier: 'rare', specialty: 'Arquería',
    food: 'Pollo asado', season: 'Otoño'
  },
  {
    id: 4, name: 'Orik Vall', alias: 'El mapitas', email: 'orik.vall@moonveil.mv',
    section: 'B-2', date: '1772-01-16', job: 'Cartógrafo', img: 'vill/cartografo.jpg',
    booksRelated: ['Paper Town'], booksRead: ['Map-based luring'],
    hobbies: ['Mapeo', 'Exploración'], pets: [{ type: 'zorro', name: 'Brist' }],
    color: '#fef08a', notes: 'Siempre sé volver a casa.', tier: 'epic', specialty: 'Cartografía',
    food: 'Manzana', season: 'Otoño'
  },
  {
    id: 5, name: 'Nox Vire', alias: '████', email: 'nox.vire@moonveil.mv',
    section: 'C-3', date: '2025-02-02', job: '████', mystery: true,
    booksRelated: ['Los niños Sodder'], booksRead: ['El vuelo MH370'],
    hobbies: ['Leer'], pets: [{ type: 'burro', name: 'Ancla' }],
    color: '#d6b98c', notes: 'Misterioso...', tier: 'mystery', specialty: 'Misterios',
    food: '???', season: 'Invierno'
  },
  {
    id: 6, name: 'Sev Ark', alias: '████', email: 'sev.ark@moonveil.mv',
    section: 'A-2', date: '2024-02-12', job: '████', mystery: true,
    booksRelated: ['Mitos del E-'], booksRead: ['Pasos en la Niebla'],
    hobbies: ['Mitos'], pets: [{ type: 'gato', name: 'Sombra' }],
    color: '#a7f3d0', notes: 'Oculto en las sombras.', tier: 'mystery', specialty: 'Ocultismo',
    food: 'Sopa', season: 'Invierno'
  },
  {
    id: 7, name: 'Steven Moss', alias: 'Librillero', email: 'steven.moss@moonveil.mv',
    section: 'B-1', date: '2025-05-22', job: 'Bibliotecario', img: 'vill/bibliotecario.jpg',
    booksRelated: ['Escritura RT'], booksRead: ['Hecho y Realidad'],
    hobbies: ['Escribir', 'Leer'], pets: [{ type: 'Vaca', name: 'Rodolf' }],
    color: '#f472b6', notes: 'Escribo aventuras.', tier: 'vip', specialty: 'Literatura',
    food: 'Pastel', season: 'Primavera'
  },
  {
    id: 8, name: 'Konn Slate', alias: '████', email: 'konn.slate@moonveil.mv',
    section: 'A-1', date: '2022-04-04', job: '████', mystery: true,
    booksRelated: [''], booksRead: [''],
    hobbies: [''], pets: [{ type: '', name: '' }],
    color: '#a3e635', notes: 'Aparece cuando menos lo esperas.', tier: 'mystery', specialty: 'Sigilo',
    food: '???', season: '???'
  },
  {
    id: 9, name: 'Kevin Dew', alias: 'Asistente', email: 'dew@moonveil.mv',
    section: 'A-1', date: '2025-01-16', job: 'Asistente', img: 'vill/booktea.gif',
    booksRelated: ['⌀'], booksRead: ['⌀'],
    hobbies: ['Ayudar'], pets: [{ type: '⌀', name: '⌀' }],
    color: '#ffffff', notes: 'A sus servicios.', tier: 'legendary', specialty: 'Administración',
    food: 'Té', season: 'Todas'
  },
  {
    id: 10, name: 'Paul Pall', alias: 'Cocinero', email: 'paul.pall@moonveil.mv',
    section: 'C-3', date: '2023-02-17', job: 'Cocinero', img: 'vill/aldeano1.png',
    booksRelated: ['Brasas y Especias'], booksRead: ['Sabores de la Maravilla'],
    hobbies: ['Cocinar'], pets: [{ type: 'gallina', name: 'Chikin' }],
    color: '#fbbf24', notes: 'Los sabores son vida.', tier: 'elite', specialty: 'Gastronomía',
    food: 'Estofado', season: 'Verano'
  },
  {
    id: 11, name: 'Scott Kelpt', alias: '████', email: 'scott.kelpt@moonveil.mv',
    section: 'C-3', date: '2020-07-02', job: '████', mystery: true,
    booksRelated: ['Secretos'], booksRead: ['El Arte del Paso Mudo'],
    hobbies: ['Escribir', 'Viajar'], pets: [{ type: 'lobo', name: 'Kew' }],
    color: '#60a5fa', notes: 'Explorador incansable.', tier: 'legendary', specialty: 'Exploración',
    food: 'Carne seca', season: 'Invierno'
  },
  {
    id: 12, name: 'Ark Ham', alias: 'Tradeador', email: 'ark.ham@moonveil.mv',
    section: 'C-3', date: '2022-01-01', job: 'Tradear', img: 'gif/villager1.gif',
    booksRelated: ['Economía Lunar'], booksRead: ['El Arte del Intercambio'],
    hobbies: ['Tradear', 'Viajar'], pets: [{ type: 'Llama', name: 'Brill' }],
    color: '#c084fc', notes: 'Me gusta tradear.', tier: 'common', specialty: 'Comercio',
    food: 'Sandía', season: 'Verano'
  },
  {
    id: 13, name: 'David Kal', alias: 'El Pequeñín', email: 'da.vid@moonveil.mv',
    section: 'C-3', date: '2025-10-02', job: '⌀', img: 'img/babyvillager.jpg',
    booksRelated: ['⌀'], booksRead: ['⌀'],
    hobbies: ['Jugar', 'Dibujar'], pets: [{ type: 'Lobo', name: 'Alex' }],
    color: '#00ff5e', notes: 'Vamos a crecer juntos.', tier: 'new', specialty: 'Aprendiz',
    food: 'Galletas', season: 'Primavera'
  },
  {
    id: 14, name: 'Fabri Thei', alias: 'El Helado', email: 'fa.thei@moonveil.mv',
    section: 'A-1', date: '2023-02-19', job: 'Bibliotecario', img: 'vill/villsnow.jpg',
    booksRelated: ['Nunca me abandones'], booksRead: ['El extranjero', '1984'],
    hobbies: ['Leer', 'Escribir'], pets: [{ type: '⌀', name: '⌀' }],
    color: '#020072', notes: 'Lectura fría.', tier: 'rare', specialty: 'Literatura',
    food: 'Helado', season: 'Invierno'
  },
  {
    id: 15, name: 'Robert Thei', alias: 'El Granizado', email: 'ro.bert@moonveil.mv',
    section: 'A-1', date: '2023-02-19', job: 'Explorador', img: 'vill/villagern.jpg',
    booksRelated: ['Nunca me abandones'], booksRead: ['⌀'],
    hobbies: ['Caminar', 'Tradear'], pets: [{ type: 'Zorro Albino', name: 'Theo' }],
    color: '#3f11f8', notes: '¿Fría??', tier: 'common', specialty: 'Exploración',
    food: 'Nieve', season: 'Invierno'
  },
  {
    id: 16, name: 'Alex Xen', alias: 'El Verde', email: 'Al.xen@moonveil.mv',
    section: 'C-3', date: '2024-04-12', job: 'Soñador', img: 'vill/huh.jpg',
    booksRelated: ['The Dreamers'], booksRead: ['Nightmares!'],
    hobbies: ['Dormir'], pets: [{ type: '⌀', name: '⌀' }],
    color: '#00ff5e', notes: 'Dormir mi pasión.', tier: 'common', specialty: 'Onirología',
    food: 'Leche', season: 'Todas'
  },
  {
    id: 17, name: 'Luna Starlight', alias: 'La Estrella', email: 'luna.star@moonveil.mv',
    section: 'A-3', date: '2024-03-15', job: 'Astrónoma', img: 'vill/villplains.jpg',
    booksRelated: ['Cosmos'], booksRead: ['Breve historia del tiempo'],
    hobbies: ['Observar estrellas'], pets: [{ type: 'búho', name: 'Noctis' }],
    color: '#4c1d95', notes: 'Las estrellas guardan secretos.', tier: 'epic', specialty: 'Astronomía',
    food: 'Frutos', season: 'Noche'
  },
  {
    id: 18, name: 'Marcus Stone', alias: 'El Herrero', email: 'marcus.stone@moonveil.mv',
    section: 'B-3', date: '2021-08-22', job: 'Herrero', img: 'vill/cartografo.jpg',
    booksRelated: ['El arte de la forja'], booksRead: ['Metalurgia básica'],
    hobbies: ['Forjar'], pets: [{ type: 'caballo', name: 'Thunder' }],
    color: '#dc2626', notes: 'Cada arma cuenta una historia.', tier: 'elite', specialty: 'Herrería',
    food: 'Carne', season: 'Verano'
  },
  {
    id: 19, name: 'Aria Melody', alias: 'La Cantante', email: 'aria.melody@moonveil.mv',
    section: 'C-1', date: '2024-11-05', job: 'Músico', img: 'vill/booktea.gif',
    booksRelated: ['Historia de la música'], booksRead: ['Teoría musical'],
    hobbies: ['Cantar'], pets: [{ type: 'canario', name: 'Melodía' }],
    color: '#ec4899', notes: 'La música conecta corazones.', tier: 'vip', specialty: 'Música',
    food: 'Miel', season: 'Primavera'
  },
  {
    id: 20, name: 'Finn Waters', alias: 'El Pescador', email: 'finn.waters@moonveil.mv',
    section: 'C-2', date: '2023-06-30', job: 'Pescador', img: 'vill/aldeano1.png',
    booksRelated: ['El viejo y el mar'], booksRead: ['Guía de pesca'],
    hobbies: ['Pescar'], pets: [{ type: 'delfín', name: 'Splash' }],
    color: '#06b6d4', notes: 'El mar tiene secretos.', tier: 'veteran', specialty: 'Pesca',
    food: 'Sushi', season: 'Verano'
  },
  {
    id: 21, name: 'Willow Green', alias: 'La Herborista', email: 'willow.green@moonveil.mv',
    section: 'A-3', date: '2022-04-18', job: 'Herborista', img: 'vill/villsnow.jpg',
    booksRelated: ['Herbología mágica'], booksRead: ['Plantas medicinales'],
    hobbies: ['Recolectar hierbas'], pets: [{ type: 'conejo', name: 'Clover' }],
    color: '#22c55e', notes: 'La naturaleza provee.', tier: 'rare', specialty: 'Herboristería',
    food: 'Ensalada', season: 'Primavera'
  },
  {
    id: 22, name: 'Drake Inferno', alias: 'El Piromante', email: 'drake.fire@moonveil.mv',
    section: 'B-3', date: '2023-12-01', job: 'Mago', img: 'img/imgmine.jpg',
    booksRelated: ['Grimorio del fuego'], booksRead: ['Hechizos avanzados'],
    hobbies: ['Practicar magia'], pets: [{ type: 'fénix', name: 'Ember' }],
    color: '#f97316', notes: 'El fuego es vida y destrucción.', tier: 'legendary', specialty: 'Piromancia',
    food: 'Chili', season: 'Verano'
  },
  {
    id: 23, name: 'Iris Bloom', alias: 'La Florista', email: 'iris.bloom@moonveil.mv',
    section: 'C-1', date: '2024-05-20', job: 'Florista', img: 'vill/vill1.jpg',
    booksRelated: ['El lenguaje de las flores'], booksRead: ['Jardines encantados'],
    hobbies: ['Cultivar flores'], pets: [{ type: 'mariposa', name: 'Aurora' }],
    color: '#f472b6', notes: 'Cada flor tiene un mensaje.', tier: 'new', specialty: 'Floricultura',
    food: 'Té floral', season: 'Primavera'
  },
  {
    id: 24, name: 'Viktor Frost', alias: 'El Glacial', email: 'viktor.frost@moonveil.mv',
    section: 'C-2', date: '2021-01-10', job: 'Criomante', img: 'vill/villagern.jpg',
    booksRelated: ['Magia del hielo'], booksRead: ['Técnicas de congelación'],
    hobbies: ['Esculpir hielo'], pets: [{ type: 'lobo blanco', name: 'Frost' }],
    color: '#dbeafe', notes: 'En el frío encuentro claridad.', tier: 'epic', specialty: 'Criomancia',
    food: 'Helado de menta', season: 'Invierno'
  }
];

/* ── TIER INFO ───────────────────────────────────────── */
const TIER_INFO = {
  legendary: { name: 'Legendario', icon: '⚡' },
  epic:      { name: 'Épico',      icon: '💎' },
  rare:      { name: 'Raro',       icon: '💫' },
  gold:      { name: 'Dorado',     icon: '👑' },
  elite:     { name: 'Elite',      icon: '🎖️' },
  vip:       { name: 'VIP',        icon: '⭐' },
  veteran:   { name: 'Veterano',   icon: '🛡️' },
  mystery:   { name: 'Misterioso', icon: '❓' },
  new:       { name: 'Nuevo',      icon: '🌟' },
  common:    { name: 'Común',      icon: '📋' },
};

const PET_EMOJI = {
  lobo:'🐺', gato:'🐱', loro:'🦜', zorro:'🦊', burro:'🫏', vaca:'🐄',
  gallina:'🐔', llama:'🦙', búho:'🦉', caballo:'🐴', canario:'🐦',
  delfín:'🐬', conejo:'🐰', fénix:'🔥', mariposa:'🦋',
  'zorro albino':'🦊', 'lobo blanco':'🐺',
};

/* ── UTILS ───────────────────────────────────────────── */
function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function fmtDate(d) {
  try { return new Intl.DateTimeFormat('es-PE', { dateStyle:'medium' }).format(new Date(d)) }
  catch { return d || '—' }
}
function countBooks(v) {
  const a = (v.booksRelated || []).filter(x => x && x !== '⌀');
  const b = (v.booksRead    || []).filter(x => x && x !== '⌀');
  return a.length + b.length;
}
function countHobbies(v) { return (v.hobbies || []).filter(h => h).length }
function countPets(v)    { return (v.pets    || []).filter(p => p.type).length }

/* ── CARD TEMPLATE ───────────────────────────────────── */
function cardHTML(v) {
  const ti = TIER_INFO[v.tier] || TIER_INFO.common;
  const tc = `tier-${v.tier}`;

  const media = v.mystery
    ? `<div class="vcard-media mystery"></div>`
    : v.video
      ? `<div class="vcard-media"><video src="${esc(v.video)}" autoplay muted loop playsinline></video></div>`
      : v.img
        ? `<div class="vcard-media"><img src="${esc(v.img)}" alt="${esc(v.name)}" loading="lazy"></div>`
        : `<div class="vcard-media mystery"></div>`;

  return `
<article class="vcard reveal ${tc}" data-id="${v.id}" tabindex="0" role="button"
  aria-label="Ver perfil de ${esc(v.name)}">
  ${media}
  <span class="vcard-badge">${ti.icon} ${ti.name}</span>

  <div class="vcard-body">
    <div>
      <h3 class="vcard-name">${esc(v.name)}</h3>
      <p class="vcard-alias">${esc(v.alias)}</p>
    </div>

    <div class="vcard-stats">
      <div class="vstat">
        <span class="vstat-val">${countHobbies(v)}</span>
        <span class="vstat-lbl">Hobbies</span>
      </div>
      <div class="vstat">
        <span class="vstat-val">${countPets(v)}</span>
        <span class="vstat-lbl">Mascotas</span>
      </div>
      <div class="vstat">
        <span class="vstat-val">${countBooks(v)}</span>
        <span class="vstat-lbl">Libros</span>
      </div>
    </div>

    <div class="vcard-meta">
      <span>💼 <b>${esc(v.job)}</b></span>
      <span>🔰 <b>${esc(v.specialty)}</b></span>
      <span>📅 <b>${fmtDate(v.date)}</b></span>
    </div>

    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
      <span class="vcard-sec-tag">📍 ${esc(v.section)}</span>
      ${v.color && v.color !== '#fff' ? `<span style="display:inline-flex;align-items:center;gap:5px;font-size:.75rem;color:var(--muted)"><span style="width:12px;height:12px;border-radius:3px;background:${esc(v.color)};border:1px solid rgba(255,255,255,.2)"></span></span>` : ''}
    </div>
  </div>

  <div class="vcard-foot">
    <button class="btn-view" data-villager-id="${v.id}">👁 Ver Perfil</button>
  </div>
</article>`;
}

/* ── RENDER ──────────────────────────────────────────── */
const cardsEl    = $('#cards');
const paginEl    = $('#pagination');
const cntVisible = $('#countVisible');
const cntTotal   = $('#countTotal');
const curPageEl  = $('#currentPage');
const totPagesEl = $('#totalPages');

function render() {
  const totalPages = Math.max(1, Math.ceil(filteredList.length / ITEMS_PER_PAGE));
  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const items = filteredList.slice(start, start + ITEMS_PER_PAGE);

  cardsEl.innerHTML = items.length
    ? items.map((v, i) => {
        const html = cardHTML(v);
        // stagger delay via attribute so CSS can pick it up
        return html.replace('<article', `<article style="animation-delay:${i * 50}ms"`);
      }).join('')
    : `<div style="grid-column:1/-1;text-align:center;padding:60px 0;color:var(--muted)">
         <p style="font-size:2rem;margin-bottom:12px">🔍</p>
         <p style="font-size:1.1rem">No se encontraron aldeanos con esos filtros.</p>
       </div>`;

  cntVisible.textContent = filteredList.length;
  cntTotal.textContent   = VILLAGERS.length;
  curPageEl.textContent  = currentPage;
  totPagesEl.textContent = totalPages;

  buildPagination(totalPages);
  observeReveal();
  bindCards();

  if (currentPage > 1) cardsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ── PAGINACIÓN ──────────────────────────────────────── */
function buildPagination(total) {
  if (total <= 1) { paginEl.innerHTML = ''; return }

  const btns = [];
  const add = (label, page, disabled = false, active = false) =>
    btns.push(`<button ${disabled ? 'disabled' : ''} class="${active ? 'active' : ''}" data-page="${page}">${label}</button>`);

  add('‹', currentPage - 1, currentPage === 1);

  if (total <= 7) {
    for (let i = 1; i <= total; i++) add(i, i, false, i === currentPage);
  } else {
    add(1, 1, false, currentPage === 1);
    if (currentPage > 3) btns.push(`<span style="color:var(--dim);padding:0 6px">…</span>`);
    const lo = Math.max(2, currentPage - 1);
    const hi = Math.min(total - 1, currentPage + 1);
    for (let i = lo; i <= hi; i++) add(i, i, false, i === currentPage);
    if (currentPage < total - 2) btns.push(`<span style="color:var(--dim);padding:0 6px">…</span>`);
    add(total, total, false, currentPage === total);
  }

  add('›', currentPage + 1, currentPage === total);
  paginEl.innerHTML = btns.join('');

  $$('[data-page]', paginEl).forEach(btn => btn.addEventListener('click', () => {
    const p = +btn.dataset.page;
    if (!isNaN(p) && p !== currentPage) { currentPage = p; render() }
  }));
}

/* ── FILTROS ─────────────────────────────────────────── */
function applyFilters() {
  currentPage = 1;
  let res = [...VILLAGERS];
  if (currentTierFilter    !== 'all') res = res.filter(v => v.tier    === currentTierFilter);
  if (currentSectionFilter !== 'all') res = res.filter(v => v.section === currentSectionFilter);
  if (searchQuery) {
    const q = searchQuery;
    res = res.filter(v =>
      v.name.toLowerCase().includes(q) ||
      v.alias.toLowerCase().includes(q) ||
      v.email.toLowerCase().includes(q) ||
      v.job.toLowerCase().includes(q) ||
      (v.specialty || '').toLowerCase().includes(q)
    );
  }
  if (sortAsc === true)  res.sort((a, b) => a.name.localeCompare(b.name, 'es'));
  if (sortAsc === false) res.sort((a, b) => b.name.localeCompare(a.name, 'es'));
  filteredList = res;
  currentList  = res;
  render();
}

/* Chips tier */
$$('[data-filter-type="tier"]').forEach(chip => chip.addEventListener('click', () => {
  $$('[data-filter-type="tier"]').forEach(c => c.classList.remove('is-on'));
  chip.classList.add('is-on');
  currentTierFilter = chip.dataset.filter;
  applyFilters();
  toast(`🎯 ${chip.textContent.trim()}`);
}));

/* Chips sección */
$$('[data-filter-type="section"]').forEach(chip => chip.addEventListener('click', () => {
  $$('[data-filter-type="section"]').forEach(c => c.classList.remove('is-on'));
  chip.classList.add('is-on');
  currentSectionFilter = chip.dataset.filter;
  applyFilters();
  toast(`📍 ${chip.textContent.trim()}`);
}));

/* Búsqueda */
const qInput = $('#q');
qInput?.addEventListener('input', () => {
  searchQuery = qInput.value.trim().toLowerCase();
  applyFilters();
});
$('#clearSearch')?.addEventListener('click', () => {
  qInput.value = ''; searchQuery = ''; applyFilters();
});

/* Botones */
$('#btnShuffle')?.addEventListener('click', () => {
  filteredList = filteredList.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  currentList = filteredList;
  currentPage = 1; sortAsc = null; render(); toast('🎲 ¡Mezclado!');
});
$('#btnSort')?.addEventListener('click', () => {
  sortAsc = sortAsc === true ? false : true;
  applyFilters();
  toast(sortAsc ? '🔤 A → Z' : '🔤 Z → A');
});
$('#btnClear')?.addEventListener('click', () => {
  currentTierFilter = 'all'; currentSectionFilter = 'all';
  searchQuery = ''; sortAsc = null;
  qInput.value = '';
  $$('[data-filter-type="tier"]').forEach(c => c.classList.remove('is-on'));
  $$('[data-filter-type="tier"]')[0]?.classList.add('is-on');
  $$('[data-filter-type="section"]').forEach(c => c.classList.remove('is-on'));
  $$('[data-filter-type="section"]')[0]?.classList.add('is-on');
  filteredList = [...VILLAGERS]; currentList = [...VILLAGERS]; currentPage = 1;
  render(); toast('🔄 Filtros limpiados');
});

/* ── BIND TARJETAS ───────────────────────────────────── */
function bindCards() {
  $$('[data-villager-id]').forEach(btn => btn.addEventListener('click', () => {
    const v = VILLAGERS.find(x => x.id === +btn.dataset.villagerId);
    if (v) openModal(v);
  }));
  // También clic en la tarjeta completa
  $$('.vcard').forEach(card => card.addEventListener('click', e => {
    if (e.target.closest('[data-villager-id]')) return; // ya manejado
    const v = VILLAGERS.find(x => x.id === +card.dataset.id);
    if (v) openModal(v);
  }));
  // Teclado
  $$('.vcard').forEach(card => card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const v = VILLAGERS.find(x => x.id === +card.dataset.id);
      if (v) openModal(v);
    }
  }));
}

/* ── MODAL ───────────────────────────────────────────── */
const modal   = $('#modal');
const mClose  = $('#mClose');
const mClose2 = $('#mClose2');
const mAction = $('#mAction');

$('#modalOverlay')?.addEventListener('click', closeModal);
mClose?.addEventListener('click',  closeModal);
mClose2?.addEventListener('click', closeModal);
mAction?.addEventListener('click', closeModal);
addEventListener('keydown', e => {
  if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') closeModal();
});

function openModal(v) {
  fillModal(v);
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  setTimeout(() => mClose?.focus(), 80);
}
function closeModal() {
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function fillModal(v) {
  const ti = TIER_INFO[v.tier] || TIER_INFO.common;

  /* Foto */
  const mPhoto = $('#mPhoto');
  mPhoto.innerHTML = '';
  mPhoto.className = 'modal-photo' + (v.mystery ? ' mystery' : '');
  if (!v.mystery) {
    if (v.video) {
      const vid = document.createElement('video');
      vid.src = v.video; vid.controls = true;
      Object.assign(vid.style, { width:'100%', height:'100%', objectFit:'cover' });
      mPhoto.appendChild(vid);
    } else if (v.img) {
      const img = new Image();
      img.src = v.img; img.alt = v.name;
      Object.assign(img.style, { width:'100%', height:'100%', objectFit:'cover' });
      mPhoto.appendChild(img);
    }
  }

  /* Header */
  $('#mName').textContent    = v.name;
  $('#mAlias').textContent   = v.alias;
  $('#mPhotoBadge').textContent = ti.icon;
  $('#mTierTag').textContent    = `${ti.icon} ${ti.name}`;
  $('#mSectionTag').textContent = `📍 ${v.section}`;

  /* Quick stats */
  $('#mQuickStats').innerHTML = `
    <span class="mqs"><span class="mqs-label">Hobbies</span><span class="mqs-val">${countHobbies(v)}</span></span>
    <span class="mqs"><span class="mqs-label">Mascotas</span><span class="mqs-val">${countPets(v)}</span></span>
    <span class="mqs"><span class="mqs-label">Libros</span><span class="mqs-val">${countBooks(v)}</span></span>
  `;

  /* Info personal */
  $('#mFullName').textContent = v.name;
  $('#mAliasInfo').textContent = v.alias;
  $('#mEmail').textContent    = v.email;
  $('#mDate').textContent     = fmtDate(v.date);

  /* Ocupación */
  $('#mJob').textContent      = v.job;
  $('#mSpecialty').textContent = v.specialty || '—';
  $('#mSection').textContent  = v.section;

  /* Preferencias */
  const dot = $('#mColorDot');
  if (dot) dot.style.background = v.color || '#1f2937';
  $('#mColor').textContent  = v.color || '—';
  $('#mFood').textContent   = v.food   || '—';
  $('#mSeason').textContent = v.season || '—';

  /* Hobbies */
  const hEl = $('#mHobbies');
  const hList = (v.hobbies || []).filter(h => h);
  hEl.innerHTML = hList.length
    ? hList.map(h => `<span class="hobby-pill">${esc(h)}</span>`).join('')
    : `<span style="color:var(--muted)">Sin hobbies registrados</span>`;

  /* Libros */
  $('#mBooksRef').textContent  = (v.booksRelated || []).filter(x => x && x !== '⌀').join(', ') || '—';
  $('#mBooksRead').textContent = (v.booksRead    || []).filter(x => x && x !== '⌀').join(', ') || '—';

  /* Mascotas */
  const pEl = $('#mPets');
  const pList = (v.pets || []).filter(p => p.type && p.type !== '⌀');
  pEl.innerHTML = pList.length
    ? pList.map(p => `
        <div class="pet-card">
          <span class="pet-emoji">${PET_EMOJI[p.type.toLowerCase()] || '🐾'}</span>
          <div>
            <div class="pet-name">${esc(p.name)}</div>
            <div class="pet-type">${esc(p.type)}</div>
          </div>
        </div>`).join('')
    : `<p style="color:var(--muted)">Sin compañeros registrados</p>`;

  /* Bio */
  $('#mBio').textContent = v.notes || 'Sin biografía disponible.';
}

/* ── REVEAL ──────────────────────────────────────────── */
let obs;
function observeReveal() {
  obs?.disconnect();
  obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); obs.unobserve(e.target) } });
  }, { threshold: .12 });
  $$('.reveal').forEach(el => obs.observe(el));
}
observeReveal();

/* ── TOAST ───────────────────────────────────────────── */
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ── INIT ────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  $('#totalVillagers').textContent = VILLAGERS.length;
  filteredList = [...VILLAGERS];
  currentList  = [...VILLAGERS];
  render();
});