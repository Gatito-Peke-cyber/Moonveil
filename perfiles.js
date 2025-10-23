/* =========================================================
   Moonveil Portal — JS: Perfiles de Aldeanos
   - Navbar responsive + HUD
   - Partículas + parallax
   - Render dinámico de tarjetas (normal/misterioso/dorado)
   - Filtros por sección, búsqueda, mezclar y ordenar
   - Modal de detalles (accesible con teclado)
   - Reveal on scroll
   ========================================================= */

const $ = (q, ctx = document) => ctx.querySelector(q);
const $$ = (q, ctx = document) => Array.from(ctx.querySelectorAll(q));

/* ---------- Navbar responsive ---------- */
const navToggle = $('#navToggle');
const navLinks = $('#navLinks');
navToggle?.addEventListener('click', ()=> navLinks.classList.toggle('open'));

/* ---------- Año footer ---------- */
$('#y').textContent = new Date().getFullYear();

/* ---------- HUD ---------- */
(function setHudBars(){
  $$('.hud-bar').forEach(b=>{
    const v = +b.dataset.val || 50;
    b.style.setProperty('--v', v);
  });
})();

/* ---------- Partículas ---------- */
(function particles(){
  const c = $('#bgParticles');
  if (!c) return;
  const ctx = c.getContext('2d');
  const dpi = Math.max(1, window.devicePixelRatio || 1);
  let w, h, parts;

  const init = () => {
    w = c.width = innerWidth * dpi;
    h = c.height = innerHeight * dpi;
    parts = new Array(80).fill(0).map(() => ({
      x: Math.random()*w, y: Math.random()*h,
      r: 1 + Math.random()*2*dpi,
      s: .2 + Math.random()*1.1,
      a: .15 + Math.random()*.35
    }));
  };

  const tick = () => {
    ctx.clearRect(0,0,w,h);
    parts.forEach(p=>{
      p.y += p.s; p.x += Math.sin(p.y*0.002)*0.35;
      if (p.y > h) { p.y = -10; p.x = Math.random()*w; }
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle = `rgba(135,243,157,${p.a})`;
      ctx.fill();
    });
    requestAnimationFrame(tick);
  };

  init(); tick();
  addEventListener('resize', init);
})();

/* ---------- Parallax ---------- */
(function parallax(){
  const layers = $$('.layer');
  if (!layers.length) return;
  const k = [0, 0.03, 0.06, 0.1];
  const onScroll = () => {
    const y = scrollY || 0;
    layers.forEach((el, i) => el.style.transform = `translateY(${y*k[i]}px)`);
  };
  onScroll();
  addEventListener('scroll', onScroll, { passive:true });
})();

/* ---------- Datos de aldeanos ---------- */
/*
  Campos:
  - id, name, alias, email, section, date, job
  - booksRelated[], booksRead[], hobbies[], pets[] ({type,name})
  - color (css), notes
  - img (url) o mystery: true
  - tier: 'gold' | 'normal'
*/
const VILLAGERS = [
  {
    id: 1,
    name: 'Sand Brill',
    alias: '███████',
    email: 'sand.brill@moonveil.mv',
    section: 'A-1',
    date: '2023-06-12',
    job: '█████████',
    img: 'vill/vill1.jpg',
    booksRelated: ['El último registro del aldeano ████', 'Escrito por Ti'],
    booksRead: ['Memorias desde el vacío', 'El último registro del aldeano ████'],
    hobbies: ['Caminar','Dibujar','Pintar','Tradear'],
    pets: [{type:'lobo', name:'Runa'}],
    color: '#50C878',
    notes: 'Tienes esmeraldas, sabes a mi me encantan las piedras verdes brillantes, son increibles la verdad,¿o que opinas tu?.',
    tier: 'gold'
  },
  {
    id: 2,
    name: 'Eduard Moss',
    alias: 'M10-25',
    email: 'eduard.moss@moonveil.mv',
    section: 'A-2',
    date: '2024-05-10',
    job: 'Granjero',
    img: 'vill/villplains.jpg',
    //video: 'vill/wolfmine.gif',   // 👈 Nuevo campo
    booksRelated: ['Diario del Último Granero','Notas de un Granjero Desaparecido'],
    booksRead: ['Notas de un Granjero Desaparecido', 'Cosechas Increibles'],
    hobbies: ['Caminar', 'Cultivar'],
    pets: [{type:'gato', name:'Polen'},{type:'loro', name:'Mossesito'}],
    color: '#86efac',
    notes: 'Tengo varias aficiones, pero me gusta caminar y ver el bonito atardecer.',
    tier: 'normal'
  },
  {
    id: 3,
    name: 'Brun Tallow',
    alias: 'El sin flechas',
    email: 'brun.tallow@moonveil.mv',
    section: 'B-1',
    date: '2025-04-12',
    job: 'Flechero',
    img: 'img/imgmine.jpg',
    booksRelated: ['Las Grandes Flechas'],
    booksRead: ['Los grandes tiradores'],
    hobbies: ['Tiro con arco'],
    pets: [{type:'Loro', name:'Gatt'}],
    color: '#93c5fd',
    notes: 'Me gusta mis tiros con flecha, nadie se lo cuestiona.Eso creo...',
    tier: 'normal'
  },
  {
    id: 4,
    name: 'Orik Vall',
    alias: 'El mapitas',
    email: 'orik.vall@moonveil.mv',
    section: 'B-2',
    date: '1772-01-16',
    job: 'Catografo',
    img: 'vill/cartografo.jpg',
    booksRelated: ['Paper town', 'Lost Expedition'],
    booksRead: ['Map-based luring'],
    hobbies: ['Mapeo', 'Exploracion'],
    pets: [{type:'zorro', name:'Brist'}],
    color: '#fef08a',
    notes: 'Siempre se volver a casa, gracias a mis mapas.',
    tier: 'normal'
  },
  {
    id: 5,
    name: 'Nox Vire',
    alias: '████',
    email: 'nox.vire@moonveil.mv',
    section: 'C-3',
    date: '2025-02-02',
    job: '████',
    mystery: true,
    booksRelated: ['Los niños Sodder'],
    booksRead: ['El vuelo MH370','D.B. Cooper'],
    hobbies: ['Leer'],
    pets: [{type:'burro', name:'Ancla'}],
    color: '#d6b98c',
    notes: 'Solo dicen, pero es realmente cierto...',
    tier: 'normal'
  },
  {
    id: 6,
    name: 'Sev Ark',
    alias: '████',
    email: 'sev.ark@moonveil.mv',
    section: 'A-2',
    date: '2024-02-12',
    job: '████',
    mystery: true,
    booksRelated: ['Mitos del E-'],
    booksRead: ['Pasos en la Niebla'],
    hobbies: ['Mitos'],
    pets: [{type:'gato', name:'Sombra'}],
    color: '#a7f3d0',
    notes: 'Alguna vez nos encontraremos, y capaz sepas la verdad o quien sabe.',
    tier: 'normal'
  },
  {
    id: 7,
    name: 'Steven Moss',
    alias: 'Librillero',
    email: 'steven.moss@moonveil.mv',
    section: 'B-1',
    date: '2025-05-22',
    job: 'Bibliotecario',
    img: 'vill/bibliotecario.jpg',
    booksRelated: ['Escritura RT'],
    booksRead: ['Hecho y Realidad'],
    hobbies: ['Escribir', 'Leer'],
    pets: [{type:'Vaca', name:'Rodolf'}],
    color: '#f472b6',
    notes: 'Algunos les gusta contar sus grandes aventuras y yo escribirlas.',
    tier: 'normal'
  },
  {
    id: 8,
    name: 'Konn Slate',
    alias: '████',
    email: 'konn.slate@moonveil.mv',
    section: 'A-1',
    date: '2022-04-04',
    job: '████',
    mystery: true,
    booksRelated: [''],
    booksRead: [''],
    hobbies: [''],
    pets: [{type:'', name:''}],
    color: '#a3e635',
    notes: 'Siempre aparece cuando nadie lo espera.',
    tier: 'normal'
  },
  {
    id: 9,
    name: 'Kevin Dew',
    alias: 'Asistente',
    email: 'dew@moonveil.mv',
    section: 'A-1',
    date: '2025-01-16',
    job: 'Asistente',
    img: 'vill/booktea.gif',
    booksRelated: ['⌀'],
    booksRead: ['⌀'],
    hobbies: ['Ayudar'],
    pets: [{type:'⌀', name:'⌀'}],
    color: '⌀',
    notes: 'Aqui estamos con a sus servicios.',
    tier: 'gold'
  },
  {
    id: 10,
    name: 'Paul Pall',
    alias: 'Cocinero',
    email: 'paul.pall@moonveil.mv',
    section: 'C-3',
    date: '2023-02-17',
    job: 'Cocinero',
    img: 'vill/aldeano1.png',
    booksRelated: ['Brasas y Especias'],
    booksRead: ['Sabores de la Maravilla'],
    hobbies: ['Cocinar'],
    pets: [{type:'gallina', name:'Chikin'}],
    color: '#fbbf24',
    notes: 'Los grandes sabores son la vida misma',
    tier: 'normal'
  },
  {
    id: 11,
    name: 'Scott Kelpt',
    alias: '████',
    email: 'scott.kelpt@moonveil.mv',
    section: 'C-3',
    date: '2020-07-02',
    job: '████',
    mystery: true,
    booksRelated: ['Secretos'],
    booksRead: ['El Arte del Paso Mudo'],
    hobbies: ['Escribir', 'Viajar'],
    pets: [{type:'lobo', name:'Kew'},{type:'lobo', name:'Pall'}],
    color: '#60a5fa',
    notes: 'Necesitamos ser mas descubridores y estudiarlo.',
    tier: 'gold'
  },
  {
    id: 12,
    name: 'Ark Ham',
    alias: 'Tradeador',
    email: 'ark.ham@moonveil.mv',
    section: 'C-3',
    date: '2022-01-01',
    job: 'Tradear',
    img: 'vill/tradervill.jpg',
    booksRelated: [''],
    booksRead: [''],
    hobbies: ['Tradear', 'Viajar'],
    pets: [{type:'Llama', name:'Brill'}],
    color: '#c084fc',
    notes: 'Me gusta tradearte cosas increibles.',
    tier: 'normal'
  },
  {
    id: 13,
    name: 'David Kal',
    alias: 'El Pequeñin',
    email: 'da.vid@moonveil.mv',
    section: 'C-3',
    date: '2025-10-02',
    job: '⌀',
    img: 'img/babyvillager.jpg',
    booksRelated: ['⌀'],
    booksRead: ['⌀'],
    hobbies: ['Jugar', 'Dibujar', '⌀'],
    pets: [{type:'Lobo', name:'Alex'}],
    color: '#00ff5eff',
    notes: 'al final todos cresemos algun dia, colegita no te boy a dejar, bamos a creser juntos...',
    tier: 'normal'
  },
  {
    id: 14,
    name: 'Fabri Thei',
    alias: 'El Helado',
    email: 'fa.thei@moonveil.mv',
    section: 'A-1',
    date: '2023-02-19',
    job: 'Bibliotecario',
    img: 'vill/villsnow.jpg',
    booksRelated: ['Nunca me abandones — Kazuo Ishiguro'],
    booksRead: ['El extranjero — Albert Camus','1984 — George Orwell','El proceso — Franz Kafka','Crimen y castigo — Fiódor Dostoyevski','La carretera — Cormac McCarthy','Nunca me abandones — Kazuo Ishiguro','Nausea — Jean-Paul Sartre'],
    hobbies: ['Leer', 'Escribir', 'Caminar'],
    pets: [{type:'⌀', name:'⌀'}],
    color: '#020072ff',
    notes: 'Me gusta una buena lectura fria...',
    tier: 'normal'
  },
  {
    id: 15,
    name: 'Robert Thei',
    alias: 'El Granizado',
    email: 'ro.bert@moonveil.mv',
    section: 'A-1',
    date: '2023-02-19',
    job: '?',
    img: 'vill/villagern.jpg',
    booksRelated: ['Nunca me abandones — ?'],
    booksRead: ['⌀'],
    hobbies: ['Caminar', 'Tradear'],
    pets: [{type:'Zorro Albino', name:'Theo'}],
    color: '#3f11f8ff',
    notes: 'Fria??',
    tier: 'normal'
  },
  {
    id: 16,
    name: 'Alex Xen',
    alias: 'El Verde',
    email: 'Al.xen@moonveil.mv',
    section: 'C-3',
    date: '2024-04-12',
    job: '⌀',
    img: 'vill/huh.jpg',
    booksRelated: ['I...'],
    booksRead: ['The Dreamers (2019) de Karen Thompson Walker','Nightmares! (serie) de Jason Segel & Kirsten Miller'],
    hobbies: ['Dormir'],
    pets: [{type:'⌀', name:'⌀'}],
    color: '#00ff5eff',
    notes: 'Dormir mi pasion...',
    tier: 'normal'
  }
];

/* ---------- Estado/UI refs ---------- */
const cardsEl = $('#cards');
const qInput = $('#q');
const chips = $$('.chip');
const btnShuffle = $('#btnShuffle');
const btnSort = $('#btnSort');
const btnClear = $('#btnClear');
const countVisible = $('#countVisible');
const countTotal = $('#countTotal');

countTotal.textContent = VILLAGERS.length.toString();

let currentFilter = 'all';
let query = '';
let currentList = VILLAGERS.slice();

/* ---------- Render ---------- */
function cardTemplate(v, idx){
  const gold = v.tier === 'gold' ? ' gold' : '';
  /*const avatar = v.mystery
    ? `<div class="avatar mystery" role="img" aria-label="Retrato misterioso"></div>`
    : `<div class="avatar"><img src="${v.img}" alt="Foto de ${escapeHtml(v.name)}" loading="lazy"></div>`;*/


    const avatar = v.mystery
  ? `<div class="avatar mystery" role="img" aria-label="Retrato misterioso"></div>`
  : v.video
    ? `<div class="avatar"><video src="${v.video}" autoplay muted loop playsinline></video></div>`
    : `<div class="avatar"><img src="${v.img}" alt="Foto de ${escapeHtml(v.name)}" loading="lazy"></div>`;


  return `
  <article class="card reveal${gold}" data-id="${v.id}" data-section="${v.section}" data-name="${escapeHtml(v.name)}" data-alias="${escapeHtml(v.alias)}" data-email="${escapeHtml(v.email)}">
    <div class="card__media">
      ${avatar}
    </div>
    <div class="card__body">
      <h3 class="card__title">${escapeHtml(v.name)}</h3>
      <div class="meta">
        <div><b>Alias:</b> ${escapeHtml(v.alias)}</div>
        <div><b>Correo:</b> <span class="text-muted">${escapeHtml(v.email)}</span></div>
        <div><b>Sección:</b> <span class="tag">${escapeHtml(v.section)}</span></div>
      </div>
    </div>
    <div class="card__footer">
      <button class="btn btn--primary btn--small" data-view="${idx}" aria-label="Ver más de ${escapeHtml(v.name)}">Ver más</button>
      ${v.tier === 'gold' ? '<span class="tag">Dorado</span>' : '<span class="tag" style="opacity:.7">Normal</span>'}
    </div>
  </article>`;
}

function render(list){
  cardsEl.innerHTML = list.map((v,i)=> cardTemplate(v,i)).join('');
  updateCount();
  observeReveal();
  bindViewButtons();
}

function updateCount(){
  countVisible.textContent = $$('.card', cardsEl).length.toString();
}

/* ---------- Filtros ---------- */
chips.forEach(chip=>{
  chip.addEventListener('click', ()=>{
    chips.forEach(c=>c.classList.remove('active'));
    chip.classList.add('active');
    currentFilter = chip.dataset.filter || 'all';
    applyFilters();
    toast(`Filtro: ${chip.textContent}`);
  });
});

/* ---------- Búsqueda ---------- */
qInput?.addEventListener('input', ()=>{
  query = qInput.value.trim().toLowerCase();
  applyFilters();
});

/* ---------- Mezclar/Ordenar/Limpiar ---------- */
btnShuffle?.addEventListener('click', ()=>{
  currentList = currentList.map(v=>[Math.random(),v]).sort((a,b)=>a[0]-b[0]).map(v=>v[1]);
  render(currentList);
  toast('Mezclado');
});
btnSort?.addEventListener('click', ()=>{
  currentList = currentList.slice().sort((a,b)=> a.name.localeCompare(b.name,'es',{sensitivity:'base'}));
  render(currentList);
  toast('Ordenado A→Z');
});
btnClear?.addEventListener('click', ()=>{
  currentFilter = 'all';
  chips.forEach(c=>c.classList.remove('active'));
  chips[0].classList.add('active');
  query = '';
  qInput.value = '';
  currentList = VILLAGERS.slice();
  render(currentList);
  toast('Limpio');
});

/* ---------- Aplicar filtros ---------- */
function applyFilters(){
  const base = VILLAGERS.filter(v => currentFilter==='all' ? true : v.section === currentFilter);
  if (!query){
    currentList = base;
  } else {
    currentList = base.filter(v =>
      v.name.toLowerCase().includes(query) ||
      v.alias.toLowerCase().includes(query) ||
      v.email.toLowerCase().includes(query)
    );
  }
  render(currentList);
}

/* ---------- Modal ---------- */
const modal = $('#modal');
const mClose = $('#mClose');
const mClose2 = $('#mClose2');
const mAvatar = $('#mAvatar');
const mName = $('#mName');
const mAlias = $('#mAlias');
const mSection = $('#mSection');
const mBadge = $('#mBadge');
const mEmail = $('#mEmail');
const mDate = $('#mDate');
const mJob = $('#mJob');
const mColor = $('#mColor');
const mColorSwatch = $('#mColorSwatch');
const mHobbies = $('#mHobbies');
const mBooksRel = $('#mBooksRel');
const mBooksRead = $('#mBooksRead');
const mPets = $('#mPets');
const mNotes = $('#mNotes');

function bindViewButtons(){
  $$('[data-view]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const i = +btn.dataset.view;
      openModal(currentList[i]);
    });
  });
}

function openModal(v){
  fillModal(v);
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
  mClose.focus();
}

function closeModal(){
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
}

mClose?.addEventListener('click', closeModal);
mClose2?.addEventListener('click', closeModal);
addEventListener('keydown', (e)=>{
  if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
});

/* Trap de foco dentro del modal */
(function focusTrap(){
  addEventListener('keydown', (e)=>{
    if (e.key !== 'Tab' || !modal.classList.contains('is-open')) return;
    const f = Array.from(modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
      .filter(el=> !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));
    if (!f.length) return;
    const first = f[0], last = f[f.length-1];
    if (e.shiftKey && document.activeElement === first){ last.focus(); e.preventDefault(); }
    else if (!e.shiftKey && document.activeElement === last){ first.focus(); e.preventDefault(); }
  });
})();

/* ---------- Relleno de modal ---------- */
function fillModal(v){
  // Avatar
  /*mAvatar.classList.toggle('mystery', !!v.mystery);
  mAvatar.innerHTML = '';
  if (!v.mystery && v.img){
    const img = new Image();
    img.src = v.img;
    img.alt = `Foto de ${v.name}`;
    img.loading = 'lazy';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    mAvatar.appendChild(img);
  }*/


    mAvatar.classList.toggle('mystery', !!v.mystery);
mAvatar.innerHTML = '';
if (!v.mystery){
  if (v.video){
    const vid = document.createElement('video');
    vid.src = v.video;
    vid.controls = true;        // 👈 Controles
    vid.autoplay = false;       // 👈 Lo puedes poner en true si quieres
    vid.style.width = '100%';
    vid.style.height = '100%';
    vid.style.objectFit = 'cover';
    mAvatar.appendChild(vid);
  } else if (v.img){
    const img = new Image();
    img.src = v.img;
    img.alt = `Foto de ${v.name}`;
    img.loading = 'lazy';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    mAvatar.appendChild(img);
  }
}



  // Cabecera
  mName.textContent = v.name;
  mAlias.textContent = v.alias;
  mSection.textContent = v.section;
  if (v.tier === 'gold'){ mBadge.hidden = false; } else { mBadge.hidden = true; }

  // Info básica
  mEmail.textContent = v.email;
  mDate.textContent = formatDate(v.date);
  mJob.textContent = v.job;
  mColor.textContent = v.color || '—';
  mColorSwatch.style.background = v.color || '#1f2937';

  // Intereses
  mHobbies.textContent = (v.hobbies && v.hobbies.length) ? v.hobbies.join(', ') : '—';
  mBooksRel.textContent = (v.booksRelated && v.booksRelated.length) ? v.booksRelated.join(', ') : '—';
  mBooksRead.textContent = (v.booksRead && v.booksRead.length) ? v.booksRead.join(', ') : '—';

  // Mascotas
  mPets.innerHTML = (v.pets && v.pets.length)
    ? v.pets.map(p=> `<li><span class="pet-ico" title="${escapeHtml(p.type)}"></span> <b>${escapeHtml(p.name)}</b> <span class="text-muted">(${escapeHtml(p.type)})</span></li>`).join('')
    : '<li class="text-muted">—</li>';

  // Notas
  mNotes.textContent = v.notes || '—';
}

/* ---------- Reveal on scroll ---------- */
let revealObs;
function observeReveal(){
  if (revealObs) revealObs.disconnect();
  revealObs = new IntersectionObserver((entries)=>{
    entries.forEach(ent=>{
      if (ent.isIntersecting){
        ent.target.classList.add('is-in');
        revealObs.unobserve(ent.target);
      }
    });
  },{threshold:.15});
  $$('.reveal').forEach(el=>revealObs.observe(el));
}
observeReveal();

/* ---------- Toast ---------- */
let toastTimeout;
function toast(msg){
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(()=> t.classList.remove('show'), 1600);
}

/* ---------- Helpers ---------- */
function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}
function formatDate(d){
  try{
    const dt = new Date(d);
    return new Intl.DateTimeFormat('es-PE', { dateStyle:'medium' }).format(dt);
  }catch(e){ return d || '—' }
}

/* ---------- Inicialización ---------- */
document.addEventListener('DOMContentLoaded', ()=>{
  render(currentList);
});
