/* =========================================================
   Moonveil Portal — Noticias (JS)
   - Navbar responsive + HUD
   - Partículas + Parallax
   - Dataset de noticias
   - Render de carrusel (Relevantes)
   - Grids por sección (A, B, Todas, Descubrimientos, Rumores)
   - Filtros por sección y categoría + búsqueda
   - Modal de detalle
   - Reveal on scroll + Toast
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
    parts = new Array(90).fill(0).map(() => ({
      x: Math.random()*w, y: Math.random()*h,
      r: 1 + Math.random()*2*dpi,
      s: .25 + Math.random()*1.1,
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

/* =========================================================
   DATASET
   Campos:
   id, title, desc, img (url opcional), mystery(bool), date (ISO),
   discoveredBy, section ('A' | 'B'), categories [..],
   flags: { relevant, discovery, rumor }
   ========================================================= */

const news = [
  {
    id:'n1',
    title:'El Animal Sin Nombre',
    desc:'En la aldea, un grupo de aldeanos aseguró haber visto un extraño animal entre los arboles y algunos dicen que no se ve nada.',
    img:'img/cat-mine.jpg',
    mystery:false,
    date:'2025-08-29',
    discoveredBy:'█████ █████',
    section:'A',
    categories:['biomas','exploración'],
    flags:{relevant:true, discovery:true, rumor:false}
  },
  {
    id:'n2',
    title:'Imagenes animadas',
    desc:'Como algunos ponen imagenes animadas para la noticia, ¿porque?',
    img:'',
    mystery:true,
    date:'2025-08-29',
    discoveredBy:'?',
    section:'B',
    categories:['pueblos'],
    flags:{relevant:true, discovery:false, rumor:true}
  },
  {
    id:'n3',
    title:'Lo brillante, y lo dorado',
    desc:'Se dice avistar un allay dorado. Pero su ubicacion es desconocida.',
    img:'img/allay.png',
    mystery:false,
    date:'2025-08-15',
    discoveredBy:'Orik Vall',
    section:'A',
    categories:['exploración'],
    flags:{relevant:true, discovery:false, rumor:false}
  },
  {
    id:'n4',
    title:'Aldeano, cruzo fronteras',
    desc:'Este aldeano estuvo 4 dias nadando, pero no se sabe de donde vino.',
    img:'img/villager.png',
    mystery:false,
    date:'2025-08-05',
    discoveredBy:'Sev Ark',
    section:'B',
    categories:['biomas'],
    flags:{relevant:false, discovery:true, rumor:false}
  },
  {
    id:'n5',
    title:'¡Nuevas clases!',
    desc:'Les traemos nuevas clases. Ahora se puede hacer pociones y mas...',
    img:'',
    mystery:true,
    date:'2025-08-27',
    discoveredBy:'?',
    section:'B',
    categories:['magia','rumor'],
    flags:{relevant:false, discovery:false, rumor:true}
  },
  {
    id:'n6',
    title:'Debajo de Nosotros',
    desc:'Resulta que estuvimos en una mentira...Resulta que debajo de nosotros hay aldeanos.',
    img:'img/newsmine.jpg',
    mystery:false,
    date:'2025-08-31',
    discoveredBy:'S███',
    section:'A',
    categories:['pueblos','oficios'],
    flags:{relevant:true, discovery:false, rumor:false}
  },
  {
    id:'n7',
    title:'Peces en quiebra',
    desc:'Los ajolotes estan matando a todos nuestros peces, debemos hacer algo.',
    img:'img/ajolote.gif',
    mystery:false,
    date:'2025-08-17',
    discoveredBy:'Nox Vire',
    section:'B',
    categories:['exploración','biomas'],
    flags:{relevant:false, discovery:true, rumor:false}
  },
  {
    id:'n8',
    title:'End?',
    desc:'¿Nether o End?',
    img:'',
    mystery:true,
    date:'2025-08-11',
    discoveredBy:'Konn Slate',
    section:'A',
    categories:['magia','exploración','rumor'],
    flags:{relevant:false, discovery:false, rumor:true}
  },
  {
    id:'n9',
    title:'Ranas por doquier',
    desc:'Hay ranas saltando por todos lados, y malogran nuestros cultivos.',
    img:'img/frogs.gif',
    mystery:false,
    date:'2025-08-18',
    discoveredBy:'Edson Villa',
    section:'A',
    categories:['pueblos','oficios'],
    flags:{relevant:true, discovery:false, rumor:false}
  },
  {
    id:'n10',
    title:'Nuevas Especies',
    desc:'Se dice que hay nuevas especies de animales, bueno mas bien variantes.Como habran aparecido.',
    img:'img/cow-mine.gif',
    mystery:false,
    date:'2025-08-09',
    discoveredBy:'Sev Ark',
    section:'B',
    categories:['exploración'],
    flags:{relevant:false, discovery:true, rumor:false}
  },
  // agrega más si quieres escalar el feed:
];

/* =========================================================
   Selectores
   ========================================================= */
const track = $('#relevTrack');
const dots = $('#relevDots');
const relPrev = $('#relPrev');
const relNext = $('#relNext');
const relPause = $('#relPause');

const listA = $('#listA');
const listB = $('#listB');
const listAll = $('#listAll');
const listDiscoveries = $('#listDiscoveries');
const listRumors = $('#listRumors');

const chipSections = $('#chipSections');
const chipCats = $('#chipCats');
const searchInput = $('#searchInput');
const clearSearch = $('#clearSearch');

const modal = $('#newsModal');
const modalOverlay = $('#modalOverlay');
const modalClose = $('#modalClose');
const modalTitle = $('#modalTitle');
const modalBody = $('#modalBody');
const modalAction = $('#modalAction');

/* =========================================================
   Estado de UI
   ========================================================= */
let carouselIdx = 0;
let carouselTimer = null;
let carouselPaused = false;
let filteredSection = 'all'; // all | relevantes | A | B | descubrimientos | rumores
let filteredCat = 'all';
let searchText = '';

/* =========================================================
   Init
   ========================================================= */
document.addEventListener('DOMContentLoaded', ()=>{
  renderCarousel();
  renderSections();
  observeReveal();
  startCarousel();
});

/* =========================================================
   Render: Carousel
   ========================================================= */
function renderCarousel(){
  const relevant = news.filter(n => n.flags.relevant);
  if (!relevant.length) return;

  track.innerHTML = relevant.map((n, i) => carouselCard(n, i)).join('');
  dots.innerHTML = relevant.map((_, i)=> `<button class="dot-btn ${i===0?'is-on':''}" data-i="${i}" aria-label="Ir a slide ${i+1}"></button>`).join('');

  // dots events
  $$('.dot-btn', dots).forEach(btn=>{
    btn.addEventListener('click', ()=>{
      carouselIdx = +btn.dataset.i;
      goCarouselTo(carouselIdx);
      setDotState();
    });
  });

  // nav
  relPrev?.addEventListener('click', ()=> stepCarousel(-1));
  relNext?.addEventListener('click', ()=> stepCarousel(+1));
  relPause?.addEventListener('click', ()=>{
    carouselPaused = !carouselPaused;
    toast(carouselPaused? 'Carrusel pausado' : 'Carrusel reanudado');
  });

  // snap first
  goCarouselTo(0);
}

function carouselCard(n, idx){
  const top3 = idx < 3 ? 'gold' : '';
  const media = n.mystery
    ? `<div class="carousel-media mystery">?</div>`
    : `<div class="carousel-media"><img src="${escape(n.img)}" alt="Imagen de ${escape(n.title)}" loading="lazy"></div>`;
  const cats = n.categories.map(c=> `<span class="tag">#${escape(c)}</span>`).join('');
  const meta = `<span>${fmtDate(n.date)}</span> · <span>Por ${escape(n.discoveredBy)}</span> · <span>Sección ${escape(n.section)}</span>`;

  return `
  <article class="carousel-card ${top3}">
    ${media}
    <div class="carousel-body">
      <h3 class="carousel-title">${escape(n.title)}</h3>
      <div class="carousel-meta">${meta}</div>
      <p class="carousel-desc">${escape(n.desc)}</p>
      <div class="tags">${cats}</div>
      <div class="card-actions">
        <button class="btn-sm" data-open="${n.id}">Ver más</button>
        <span class="badge">${n.flags.discovery ? 'Descubrimiento' : (n.flags.rumor ? 'Rumor' : 'Reporte')}</span>
      </div>
    </div>
  </article>`;
}

function setDotState(){
  $$('.dot-btn', dots).forEach((d,i)=>{
    d.classList.toggle('is-on', i===carouselIdx);
  });
}

function stepCarousel(inc){
  const total = $$('.carousel-card', track).length;
  carouselIdx = (carouselIdx + inc + total) % total;
  goCarouselTo(carouselIdx);
  setDotState();
}

function goCarouselTo(idx){
  const card = $$('.carousel-card', track)[idx];
  if (!card) return;
  const off = card.offsetLeft - 12; // padding
  track.scrollTo({left: off, behavior:'smooth'});
}

/* =========================================================
   Render: Secciones (grids)
   ========================================================= */
function renderSections(){
  const matchesFilter = (n) => {
    // sección
    const secOk =
      filteredSection === 'all' ||
      (filteredSection === 'relevantes' && n.flags.relevant) ||
      (filteredSection === 'A' && n.section === 'A') ||
      (filteredSection === 'B' && n.section === 'B') ||
      (filteredSection === 'descubrimientos' && n.flags.discovery) ||
      (filteredSection === 'rumores' && n.flags.rumor);

    // categoría
    const catOk = filteredCat === 'all' || n.categories.includes(filteredCat);

    // búsqueda
    const q = searchText.trim().toLowerCase();
    const txt = `${n.title} ${n.desc} ${n.discoveredBy} ${n.categories.join(' ')}`.toLowerCase();
    const searchOk = !q || txt.includes(q);

    return secOk && catOk && searchOk;
  };

  const list = news.filter(matchesFilter);

  // helpers por grupo
  const inA = list.filter(n=> n.section==='A');
  const inB = list.filter(n=> n.section==='B');
  const all = list.slice().sort((a,b)=> new Date(b.date) - new Date(a.date));
  const discoveries = list.filter(n=> n.flags.discovery);
  const rumors = list.filter(n=> n.flags.rumor);

  listA.innerHTML = inA.map(cardTemplate).join('') || emptyBlock('No hay noticias en Sección A.');
  listB.innerHTML = inB.map(cardTemplate).join('') || emptyBlock('No hay noticias en Sección B.');
  listAll.innerHTML = all.map(cardTemplate).join('') || emptyBlock('No hay noticias en este momento.');
  listDiscoveries.innerHTML = discoveries.map(cardTemplate).join('') || emptyBlock('No hay descubrimientos recientes.');
  listRumors.innerHTML = rumors.map(cardTemplate).join('') || emptyBlock('Sin rumores ahora mismo.');

  // Bind a botones "Ver más"
  $$('[data-open]').forEach(btn=>{
    btn.addEventListener('click', ()=> openModal(btn.getAttribute('data-open')));
  });
}

function cardTemplate(n){
  const top = n.flags.relevant ? 'gold' : '';
  const media = n.mystery
    ? `<div class="card-media mystery">?</div>`
    : `<div class="card-media"><img src="${escape(n.img)}" alt="Imagen de ${escape(n.title)}" loading="lazy"></div>`;

  const cats = n.categories.map(c=> `<span class="tag">#${escape(c)}</span>`).join('');
  const meta = `<span>${fmtDate(n.date)}</span> · <span>Por ${escape(n.discoveredBy)}</span> · <span>Sección ${escape(n.section)}</span>`;

  return `
  <article class="card ${top}">
    ${media}
    <div class="card-body">
      <h3 class="card-title">${escape(n.title)}</h3>
      <p class="card-desc">${escape(n.desc)}</p>
      <div class="card-meta">${meta}</div>
    </div>
    <div class="card-foot">
      <div class="tags">${cats}</div>
      <button class="btn-sm" data-open="${n.id}">Ver más</button>
    </div>
  </article>`;
}

function emptyBlock(text){
  return `<div class="card" style="grid-column:1/-1"><div class="card-body"><p class="muted">${escape(text)}</p></div></div>`;
}

/* =========================================================
   Filtros
   ========================================================= */
chipSections.addEventListener('click', e=>{
  const btn = e.target.closest('.chip');
  if (!btn) return;
  $$('.chip', chipSections).forEach(c=> c.classList.remove('is-on'));
  btn.classList.add('is-on');
  filteredSection = btn.dataset.filterSection;
  renderSections();
  toast(`Filtro: ${filteredSection}`);
});

chipCats.addEventListener('click', e=>{
  const btn = e.target.closest('.chip');
  if (!btn) return;
  $$('.chip', chipCats).forEach(c=> c.classList.remove('is-on'));
  btn.classList.add('is-on');
  filteredCat = btn.dataset.filterCat;
  renderSections();
});

searchInput.addEventListener('input', ()=>{
  searchText = searchInput.value || '';
  renderSections();
});
clearSearch.addEventListener('click', ()=>{
  searchText = '';
  searchInput.value = '';
  renderSections();
});

/* =========================================================
   Modal
   ========================================================= */
function openModal(id){
  const n = news.find(x=> x.id===id);
  if (!n) return;
  modalTitle.textContent = n.title;

  const media = n.mystery
    ? `<div class="media mystery">?</div>`
    : `<div class="media"><img src="${escape(n.img)}" alt="Imagen de ${escape(n.title)}"></div>`;

  const cats = n.categories.map(c=> `<span class="tag">#${escape(c)}</span>`).join('');

  modalBody.innerHTML = `
    <div class="modal-hero">
      ${media}
      <div class="info">
        <h3>${escape(n.title)}</h3>
        <div class="meta"><span>${fmtDate(n.date)}</span> · <span>Por ${escape(n.discoveredBy)}</span> · <span>Sección ${escape(n.section)}</span></div>
        <p>${escape(n.desc)}</p>
        <div class="tags">${cats}</div>
      </div>
    </div>

    <div class="modal-grid">
      <div class="modal-block">
        <h4>Resumen</h4>
        <p>${escape(n.desc)}</p>
        <ul class="list">
          <li>Relevante: ${n.flags.relevant ? 'Sí' : 'No'}</li>
          <li>Descubrimiento: ${n.flags.discovery ? 'Sí' : 'No'}</li>
          <li>Rumor: ${n.flags.rumor ? 'Sí' : 'No'}</li>
        </ul>
      </div>
      <div class="modal-block">
        <h4>Contexto</h4>
        <p>Archivo #${escape(n.id)} — clasificación interna. Cruza categorías: ${n.categories.map(escape).join(', ')}.</p>
      </div>
      <div class="modal-block full">
        <h4>Notas</h4>
        <p>Este registro forma parte del feed de demostración. Puedes extenderlo agregando más items en <code>news[]</code>.</p>
      </div>
    </div>
  `;

  modal.classList.add('show');
  modal.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';

  modalAction.onclick = () => {
    toast('Marcado como leído');
    closeModal();
  };
}

function closeModal(){
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
}

modalOverlay.addEventListener('click', closeModal);
modalClose.addEventListener('click', closeModal);
document.addEventListener('keydown', (e)=>{ if (e.key==='Escape') closeModal(); });

/* =========================================================
   Carousel autoplay
   ========================================================= */
function startCarousel(){
  stopCarousel();
  carouselTimer = setInterval(()=> {
    if (!carouselPaused) stepCarousel(1);
  }, 5000);
}
function stopCarousel(){
  if (carouselTimer) clearInterval(carouselTimer);
  carouselTimer = null;
}

/* =========================================================
   Reveal on scroll + Toast
   ========================================================= */
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
function toast(msg){
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._id);
  t._id = setTimeout(()=> t.classList.remove('show'), 1400);
}

/* =========================================================
   Helpers
   ========================================================= */
function escape(s){return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function fmtDate(iso){
  try{
    const d = new Date(iso);
    return new Intl.DateTimeFormat('es-PE', {year:'numeric', month:'short', day:'2-digit'}).format(d);
  }catch{return iso}
}
