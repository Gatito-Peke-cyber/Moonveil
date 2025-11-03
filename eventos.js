/* =========================================================
   Moonveil Portal — Eventos (JS)
   - Navbar responsive + HUD
   - Partículas + Parallax
   - Dataset de eventos
   - Render de tarjetas (grid/list)
   - Cálculo de estado (Próximamente / Actual / Finalizado)
   - Progreso, filtros, búsqueda y paginación
   - Modal de detalle
   - Reveal on scroll + Toast
   ========================================================= */

const $ = (q, ctx = document) => ctx.querySelector(q);
const $$ = (q, ctx = document) => Array.from(ctx.querySelectorAll(q));

/* ---------- Navbar responsive ---------- */
const navToggle = $('#navToggle');
const navLinks = $('#navLinks');
navToggle?.addEventListener('click', ()=> navLinks.classList.toggle('open'));

/* ---------- Año footer + hoy ---------- */
$('#y').textContent = new Date().getFullYear();
$('#today').textContent = new Intl.DateTimeFormat('es-PE', { weekday:'long', day:'2-digit', month:'long', year:'numeric'}).format(new Date());

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
    parts = new Array(100).fill(0).map(() => ({
      x: Math.random()*w, y: Math.random()*h,
      r: 1 + Math.random()*2*dpi,
      s: .25 + Math.random()*1.1,
      a: .12 + Math.random()*.3
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
   id, name, desc, img, unique(bool), start (ISO), end (ISO),
   place, categories [..], rewards [..]
   ========================================================= */
const today = new Date();

const events = [
  {
    id:'e1',
    name:'La llegada de algo Desconocido',
    desc:'Me podre salvar, y a...',
    img:'img-pass/crepitante.jpg',
    unique:true,
    start:'2025-10-25',
    end:'2025-11-03',
    place:'Bosque',
    categories:['festival','magia'],
    rewards:['En el juego']
  },
  {
    id:'e2',
    name:'La vida Gatuna',
    desc:'La vida de un gato es bastante unica en la historia.',
    img:'img-pass/catsparty.jpg',
    unique:true,
    start:'2026-08-05',
    end:'2026-08-17',
    place:'Jungla',
    categories:['exploración','festival'],
    rewards:['En el juego','Estandarte']
  },
  {
    id:'e3',
    name:'La Navidad ya esta aqui.',
    desc:'Celebrando una NAVIDAD mas.',
    img:'img-pass/chrismine.jpg',
    unique:false,
    start:'2025-12-21',
    end:'2025-12-31',
    place:'Aldea',
    categories:['festival'],
    rewards:['En el juego']
  },
  {
    id:'e4',
    name:'Feliz AÑO NUEVO',
    desc:'Celebrando un AÑO mas.',
    img:'img-pass/añomine.jpg',
    unique:false,
    start:'2025-12-31',
    end:'2026-01-03',
    place:'Aldea',
    categories:['festival'],
    rewards:['En el juego']
  },
  {
    id:'e5',
    name:'Desafío de Dibujo Pixeleado',
    desc:'Dibuja y muestra tus obras.',
    img:'img-pass/draw.jpg',
    unique:true,
    start:'2025-12-13',
    end:'2025-12-29',
    place:'Mundo',
    categories:['festival'],
    rewards:['En el juego']
  },
  {
    id:'e6',
    name:'Aniversario de Moonveil',
    desc:'Un año mas en el Mundo.',
    img:'img-pass/partymine.jpg',
    unique:true,
    start:'2025-09-09',
    end:'2026-02-01',
    place:'Mundo',
    categories:['exploración'],
    rewards:['En el juego']
  },
  {
    id:'e7',
    name:'Animales nuestros Heroes',
    desc:'Heroes de nuestro mundo.',
    img:'img-pass/animalsphoto.jpg',
    unique:false,
    start:'2026-01-02',
    end:'2026-02-01',
    place:'Aldea',
    categories:['festival'],
    rewards:['En el juego']
  },
  {
    id:'e8',
    name:'Desafio de Exp',
    desc:'Sigamos expandiendonos...',
    img:'img-pass/frameworld.jpg',
    unique:false,
    start:'2025-09-02',
    end:'2027-01-01',
    place:'Moonveil',
    categories:['exploración','festival'],
    rewards:['En el juego']
  },
  {
    id:'e9',
    name:'La Hora de Jarrones',
    desc:'Sera...',
    img:'img-pass/squemine.jpg',
    unique:false,
    start:'2025-12-02',
    end:'2025-12-15',
    place:'Desierto',
    categories:['exploración'],
    rewards:['En el juego']
  },
  {
    id:'e10',
    name:'La Union',
    desc:'Esto acabara algun dia...',
    img:'img-pass/vill2.jpg',
    unique:true,
    start:'2025-01-02',
    end:'2030-01-02',
    place:'Pradera A-3',
    categories:['oficios','festival'],
    rewards:['En el juego']
  },
  {
    id:'e11',
    name:'Save the Panda Day',
    desc:'🐼✨ Celebremos a este adorable guardián del bambú, símbolo de paz, amistad y naturaleza. Comparte su ternura, cuida el planeta y deja que el espíritu panda te inspire a vivir con calma y amor por la vida. 💖🎋',
    img:'imagen/pandaparty.jpg',
    unique:true,
    start:'2026-03-13',
    end:'2026-03-21',
    place:'Jungla',
    categories:['festival'],
    rewards:['En el juego']
  },
  {
    id:'e12',
    name:'Desafío del Dia de la Fotografia',
    desc:'“La fotografía es el único lenguaje que puede ser entendido y comprendido en todo el mundo.” — Bruno Barbey',
    img:'img-pass/draw.jpg',
    unique:false,
    start:'2026-08-15',
    end:'2026-08-23',
    place:'Mundo',
    categories:['festival'],
    rewards:['En el juego']
  },
];

/* =========================================================
   Estado de UI
   ========================================================= */
let stateFilter = 'all';    // all | current | upcoming | ended | unique
let catFilter = 'all';
let searchText = '';
let view = 'grid';          // grid | list
let page = 1;
const PER_PAGE = 8;

const grid = $('#eventsGrid');
const pagePrev = $('#pagePrev');
const pageNext = $('#pageNext');
const pageInfo = $('#pageInfo');
const viewGrid = $('#viewGrid');
const viewList = $('#viewList');

const chipState = $('#chipState');
const chipCats = $('#chipCats');
const searchInput = $('#searchInput');
const clearSearch = $('#clearSearch');

const modal = $('#eventModal');
const modalOverlay = $('#modalOverlay');
const modalClose = $('#modalClose');
const modalTitle = $('#modalTitle');
const modalBody = $('#modalBody');
const modalAction = $('#modalAction');

/* =========================================================
   Init
   ========================================================= */
document.addEventListener('DOMContentLoaded', ()=>{
  render();
  observeReveal();
});

/* =========================================================
   Helpers de fechas / estado
   ========================================================= */
function parseISO(s){ return new Date(s+'T00:00:00'); }
function isBetween(d, a, b){ return d >= a && d <= b; }
function clamp(n,min,max){ return Math.max(min, Math.min(max, n)); }

function eventStatus(ev){
  const s = parseISO(ev.start);
  const e = parseISO(ev.end);
  if (today > e) return 'ended';
  if (today < s) return 'upcoming';
  return 'current';
}
function eventProgress(ev){
  const s = parseISO(ev.start).getTime();
  const e = parseISO(ev.end).getTime();
  const t = today.getTime();
  if (t <= s) return 0;
  if (t >= e) return 1;
  return clamp((t - s) / (e - s), 0, 1);
}
function fmtDate(iso){
  try{
    const d = new Date(iso);
    return new Intl.DateTimeFormat('es-PE', {year:'numeric', month:'short', day:'2-digit'}).format(d);
  }catch{return iso}
}

/* =========================================================
   Render
   ========================================================= */
function render(){
  const filtered = events.filter(e => {
    // estado
    const st = eventStatus(e);
    const stOk = stateFilter==='all' ||
                 (stateFilter==='current' && st==='current') ||
                 (stateFilter==='upcoming' && st==='upcoming') ||
                 (stateFilter==='ended' && st==='ended') ||
                 (stateFilter==='unique' && e.unique);

    // categoría
    const catOk = catFilter==='all' || e.categories.includes(catFilter);

    // texto
    const q = (searchText||'').toLowerCase();
    const txt = `${e.name} ${e.place} ${e.categories.join(' ')}`.toLowerCase();
    const qOk = !q || txt.includes(q);

    return stOk && catOk && qOk;
  });

  // orden: actuales, próximos, terminados
  filtered.sort((a,b)=>{
    const order = { current:0, upcoming:1, ended:2 };
    const sa = order[eventStatus(a)];
    const sb = order[eventStatus(b)];
    if (sa !== sb) return sa - sb;
    // luego por inicio asc
    return parseISO(a.start) - parseISO(b.start);
  });

  // paginación
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  page = clamp(page, 1, totalPages);
  const start = (page-1)*PER_PAGE;
  const slice = filtered.slice(start, start+PER_PAGE);

  // render
  grid.setAttribute('aria-busy','true');
  grid.classList.toggle('list', view==='list');
  grid.innerHTML = slice.map(cardTemplate).join('') || emptyBlock('No hay eventos en este momento.😿');

  // bind
  $$('[data-open]').forEach(btn=>{
    btn.addEventListener('click', ()=> openModal(btn.getAttribute('data-open')));
  });

  // paginación UI
  pagePrev.disabled = page<=1;
  pageNext.disabled = page>=totalPages;
  pageInfo.textContent = `Página ${page}/${totalPages}`;

  grid.setAttribute('aria-busy','false');
}

function cardTemplate(ev){
  const st = eventStatus(ev);
  const prog = eventProgress(ev);
  const gold = ev.unique ? 'gold' : '';
  const stClass = st==='current' ? 'live' : st==='upcoming' ? 'soon' : 'end';
  const stLabel = st==='current' ? 'Actual' : st==='upcoming' ? 'Próximamente' : 'Finalizado';
  const tags = ev.categories.map(c=> `<span class="tag">#${escape(c)}</span>`).join('');
  const p = (prog*1).toFixed(2);

  return `
  <article class="card ${gold}">
    <div class="card-media">
      <img src="${escape(ev.img)}" alt="Imagen del evento ${escape(ev.name)}" loading="lazy">
      ${ev.unique ? `<span class="badge-unique">Único</span>` : ``}
      <span class="status-chip ${stClass}">${stLabel}</span>
    </div>
    <div class="card-body">
      <h3 class="card-title">${escape(ev.name)}</h3>
      <p class="card-desc">${escape(ev.desc)}</p>
      <div class="card-meta">
        <span>📍 ${escape(ev.place)}</span>
        <span>🗓 ${fmtDate(ev.start)} — ${fmtDate(ev.end)}</span>
      </div>
      <div class="card-progress" style="--p:${p}">
        <span class="fill" style="--p:${p}"></span>
      </div>
    </div>
    <div class="card-foot">
      <div class="tags">${tags}</div>
      <button class="btn-sm" data-open="${ev.id}">Ver más</button>
    </div>
  </article>`;
}

function emptyBlock(text){
  return `<div class="card" style="grid-column:1/-1"><div class="card-body"><p class="muted">${escape(text)}</p></div></div>`;
}

/* =========================================================
   Filtros / controles
   ========================================================= */
chipState.addEventListener('click', e=>{
  const btn = e.target.closest('.chip');
  if (!btn) return;
  $$('.chip', chipState).forEach(c=> c.classList.remove('is-on'));
  btn.classList.add('is-on');
  stateFilter = btn.dataset.state;
  page = 1;
  render();
  toast(`Filtro de estado: ${stateFilter}`);
});

chipCats.addEventListener('click', e=>{
  const btn = e.target.closest('.chip');
  if (!btn) return;
  $$('.chip', chipCats).forEach(c=> c.classList.remove('is-on'));
  btn.classList.add('is-on');
  catFilter = btn.dataset.cat;
  page = 1;
  render();
});

searchInput.addEventListener('input', ()=>{
  searchText = searchInput.value || '';
  page = 1;
  render();
});
clearSearch.addEventListener('click', ()=>{
  searchText = '';
  searchInput.value = '';
  page = 1;
  render();
});

pagePrev.addEventListener('click', ()=>{ page--; render(); });
pageNext.addEventListener('click', ()=>{ page++; render(); });

viewGrid.addEventListener('click', ()=>{
  view='grid';
  viewGrid.classList.add('is-on');
  viewList.classList.remove('is-on');
  render();
});
viewList.addEventListener('click', ()=>{
  view='list';
  viewList.classList.add('is-on');
  viewGrid.classList.remove('is-on');
  render();
});

/* =========================================================
   Modal
   ========================================================= */
function openModal(id){
  const ev = events.find(x=> x.id===id);
  if (!ev) return;

  const st = eventStatus(ev);
  const stLabel = st==='current' ? 'Actual' : st==='upcoming' ? 'Próximamente' : 'Finalizado';
  const stClass = st==='current' ? 'live' : st==='upcoming' ? 'soon' : 'end';
  const tags = ev.categories.map(c=> `<span class="tag">#${escape(c)}</span>`).join('');
  const rewards = ev.rewards.map(r=> `<li>${escape(r)}</li>`).join('');

  modalTitle.textContent = ev.name;

  modalBody.innerHTML = `
    <div class="modal-hero">
      <div class="media">
        <img src="${escape(ev.img)}" alt="Imagen del evento ${escape(ev.name)}">
        ${ev.unique ? `<span class="chip">Único</span>` : ``}
      </div>
      <div class="info">
        <h3>${escape(ev.name)} <span class="badge ${stClass}" style="margin-left:6px">${stLabel}</span></h3>
        <div class="meta">
          <span>📍 ${escape(ev.place)}</span>
          <span>🗓 ${fmtDate(ev.start)} — ${fmtDate(ev.end)}</span>
          ${ev.unique ? `<span class="badge" title="Evento irrepetible">Marco dorado</span>` : ``}
        </div>
        <p>${escape(ev.desc)}</p>
        <div class="tags">${tags}</div>
      </div>
    </div>

    <div class="modal-grid">
      <div class="modal-block">
        <h4>Recompensas</h4>
        <ul class="list">${rewards}</ul>
      </div>
      <div class="modal-block">
        <h4>Estado</h4>
        <ul class="list">
          <li>Estado: <b>${stLabel}</b></li>
          <li>Comienza: <b>${fmtDate(ev.start)}</b></li>
          <li>Termina: <b>${fmtDate(ev.end)}</b></li>
        </ul>
      </div>
      <div class="modal-block full">
        <h4>Timeline</h4>
        <div class="modal-timeline">
          <div class="timeline-item">
            <h5>Anuncio</h5>
            <div class="date">${fmtDate(ev.start)}</div>
            <p>El evento se anuncia con detalles y reglas.</p>
          </div>
          <div class="timeline-item">
            <h5>Inicio</h5>
            <div class="date">${fmtDate(ev.start)}</div>
            <p>Apertura de inscripciones y entrega de kits.</p>
          </div>
          <div class="timeline-item">
            <h5>Clausura</h5>
            <div class="date">${fmtDate(ev.end)}</div>
            <p>Recuento final, entrega de premios.</p>
          </div>
        </div>
      </div>
    </div>
  `;

  modal.classList.add('show');
  modal.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';

  modalAction.onclick = () => {
    toast('Evento agregado al diario');
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
   Utilidades
   ========================================================= */
function escape(s){return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
