// File: updates.js
// Moonveil Pro — Logic (module)
// Funcional: seed, filters, search, grid/timeline toggle, modal, pagination, export JSON, mark read.

// ----------------- Utilities -----------------
const $ = (s, ctx=document) => ctx.querySelector(s);
const $$ = (s, ctx=document) => Array.from((ctx || document).querySelectorAll(s));

const el = {
  // controls
  chipGroup: $('#chipGroup'),
  chips: $$('.chip'),
  q: $('#q_updates'),
  btnSort: $('#btnSort'),
  btnToggleView: $('#btnToggleView'),
  btnClearFilters: $('#btnClearFilters'),
  btnExportJSON: $('#btnExportJSON'),
  btnClearRead: $('#btnClearRead'),
  // main
  cards: $('#cards'),
  pager: $('#pager'),
  timeline: $('#timeline'),
  changelogList: $('#changelogList'),
  // modal
  mvModal: $('#mvModal'),
  mvModalClose: $('#mvModalClose'),
  mvModalTitle: $('#mvModalTitle'),
  mvModalMeta: $('#mvModalMeta'),
  mvModalBody: $('#mvModalBody'),
  mvModalTags: $('#mvModalTags'),
  mvMarkRead: $('#mvMarkRead'),
  // stats
  statTotal: $('#statTotal'),
  statActive: $('#statActive'),
  statInProg: $('#statInProg'),
  sideTotal: $('#sideTotal'),
  sideActive: $('#sideActive'),
  sideProg: $('#sideProg'),
  sideUpcoming: $('#sideUpcoming'),
  tagCloud: $('#tagCloud'),
  toast: $('#mvToast'),
  y: $('#y')
};

let UPDATES = [];
let viewMode = localStorage.getItem('mv_view') || 'grid';
let sortAsc = false;
const READ_KEY = 'mv_read_v4';

// small helpers
const nowISO = () => (new Date()).toISOString().slice(0,10);
const formatDate = d => new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { year:'numeric', month:'short', day:'numeric' });
const toast = (t, ms=1600) => {
  if (!el.toast) return;
  el.toast.textContent = t;
  el.toast.classList.add('show');
  setTimeout(()=> el.toast.classList.remove('show'), ms);
};
const getRead = () => JSON.parse(localStorage.getItem(READ_KEY) || '[]');
const markRead = (id) => { const s = getRead(); if (!s.includes(id)) { s.push(id); localStorage.setItem(READ_KEY, JSON.stringify(s)); } };

// ----------------- Seed large dataset -----------------
function seed(n = 0) {
  UPDATES = [];
  const base = [
    { id:'u-ev', title:'Ruletas!!', summary:'Se agrego la funcion de ganar el doble de tickets.', content:'Se agrego la funcion de ganar el doble de tickets.', state:'active', date:'2025-11-12', tags:['evento'], progress:100, link:'https://gatito-peke-cyber.github.io/Moonveil/premios_final.html' },
    { id:'u-mej', title:'Act. Tienda', summary:'Ahora la tienda tiene descuentos, usalos bien porque son de un solo uso, se recargan cada 24 horas.', content:'Ahora la tienda tiene descuentos, usalos bien porque son de un solo uso, se recargan cada 24 horas.', state:'active', date:'2025-11-28', tags:['mejora'], progress:100, link:'https://gatito-peke-cyber.github.io/Moonveil/tienda.html' },
    { id:'u-mej', title:'Act. Tienda (v.2)', summary:'Se añadieron los tickets, para que puedas usarlos en las ruletas respectivas.', content:'Se añadieron los tickets, para que puedas usarlos en las ruletas respectivas.', state:'active', date:'2025-11-20', tags:['mejora'], progress:100, link:'https://gatito-peke-cyber.github.io/Moonveil/tienda.html' },
    { id:'u-mej', title:'Ruletas 2', summary:'Se añadieron mas misiones a las ruletas.', content:'Se añadieron mas misiones a las ruletas.', state:'active', date:'2025-11-22', tags:['mejora'], progress:100, link:'https://gatito-peke-cyber.github.io/Moonveil/premios_final.html' },
    { id:'u-mej', title:'Mapa', summary:'Implementacion del mapa, con sus respectivas caracteristicas.(No se implementara)', content:'Implementacion del mapa, con sus respectivas caracteristicas..', state:'archived', date:'2025-11-10', tags:['mejora'], progress:100, link:'' },
    { id:'u-mej', title:'Login (v.3)', summary:'Se mejoro el diseño anterior del Login.', content:'Se mejoro el diseño anterior del Login.', state:'active', date:'2025-10-20', tags:['mejora'], progress:100, link:'' },
    { id:'u-mej', title:'Contactos', summary:'Futura mejora de su pequeños errores, y algunos contactos...', content:'Futura mejora de su pequeños errores, y algunos contactos...', state:'upcoming', date:'2025-10-30', tags:['mejora'], progress:0, link:'' },
    //{ id:'u-bal', title:'Balance: Trueques 2.1', summary:'Ajustes de economía y precios', content:'<p>Balance aplicado a aldeanos.</p>', state:'inprogress', date:'2025-11-25', tags:['balance','economia'], progress:57, link:'' },
    //{ id:'u-bal', title:'Balance: Trueques 2.1', summary:'Ajustes de economía y precios', content:'<p>Balance aplicado a aldeanos.</p>', state:'inprogress', date:'2025-11-25', tags:['balance','economia'], progress:57, link:'' },
    //{ id:'u-bio', title:'Bioma: Laderas de Azur', summary:'Bioma nuevo con recursos exclusivos', content:'<p>Azurita, fauna y quests.</p>', state:'upcoming', date:'2025-12-10', tags:['bioma','novedad'], progress:12, link:'' }
  ];
  // seed base
  base.forEach((b,i) => UPDATES.push({ ...b, id: b.id + '-' + (i+1) }));
  // generate synthetic items
  const tags = ['evento','balance','bioma','netcode','ui','tienda','misiones','cofre','performance','shops','craft','trade','seasonal','mejora'];
  const states = ['active','inprogress','upcoming','archived'];
  const start = Date.now();
  for (let i=0;i<n;i++) {
    const st = states[i % states.length];
    const tag = tags[i % tags.length];
    const d = new Date(start - i * 24*3600*1000).toISOString().slice(0,10);
    UPDATES.push({
      id: `gen-${i+1}`,
      title: `Mejora generada #${i+1}`,
      summary: `Resumen automático para la mejora ${i+1}.`,
      content: `<p>Contenido técnico de la mejora ${i+1}.</p><ul><li>Cambio A</li><li>Cambio B</li></ul>`,
      state: st,
      date: d,
      tags: [tag],
      progress: Math.max(0, Math.min(100, (i * 37) % 101))
    });
  }
}

// ----------------- Render helpers -----------------
function cardFor(item) {
  const a = document.createElement('article');
  a.className = 'update-card';
  a.dataset.id = item.id;
  a.dataset.state = item.state;
  a.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <div class="uv-badge ${item.state==='active' ? 'uv-badge--active' : ''}">${item.state.toUpperCase()}</div>
        <h3 class="title">${escapeHtml(item.title)}</h3>
      </div>
      <div style="text-align:right">
        <div class="meta">${formatDate(item.date)}</div>
        <small style="color:var(--mv-muted)">${item.tags.join(', ')}</small>
      </div>
    </div>
    <p class="summary">${escapeHtml(item.summary)}</p>
    <div class="progress" role="progressbar"><i style="width:${item.progress}%"></i></div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
      <small>${item.progress}%</small>
      <div style="display:flex;gap:8px">
        <button class="btn btn--small btn--ghost js-open" data-id="${item.id}">Ver</button>
        <button class="btn btn--small btn--ghost js-link" data-id="${item.id}">Abrir link</button>
      </div>
    </div>
  `;
  return a;
}

function timelineItem(item) {
  const d = document.createElement('div');
  d.className = 'timeline-item';
  d.dataset.id = item.id;
  d.innerHTML = `<div class="time">${formatDate(item.date)}</div><h4>${escapeHtml(item.title)}</h4><div class="summary">${escapeHtml(item.summary)}</div>`;
  d.addEventListener('click', ()=> openModal(item.id));
  return d;
}

function changelogNode(item) {
  const n = document.createElement('div');
  n.className = 'changelog-item';
  n.innerHTML = `<strong>${escapeHtml(item.title)}</strong><pre>${escapeHtml(item.content || item.summary)}</pre>`;
  return n;
}

function escapeHtml(s){ return String(s||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

// ----------------- Main render -----------------
function renderAll(list) {
  // stats
  const total = list.length;
  const active = list.filter(x => x.state === 'active').length;
  const inprog = list.filter(x => x.state === 'inprogress').length;
  if (el.statTotal) el.statTotal.textContent = total;
  if (el.statActive) el.statActive.textContent = active;
  if (el.statInProg) el.statInProg.textContent = inprog;
  if (el.sideTotal) el.sideTotal.textContent = total;
  if (el.sideActive) el.sideActive.textContent = active;
  if (el.sideProg) el.sideProg.textContent = inprog;

  // tag cloud
  const map = {};
  list.forEach(it => (it.tags||[]).forEach(t => map[t] = (map[t]||0) + 1));
  if (el.tagCloud) el.tagCloud.innerHTML = Object.entries(map).sort((a,b)=>b[1]-a[1]).map(([t,c]) => `<button class="tag" data-tag="${t}">${t} (${c})</button>`).join(' ') || '<div class="u-muted">Sin etiquetas</div>';

  // grid
  if (el.cards) {
    el.cards.innerHTML = '';
    list.forEach(it => el.cards.appendChild(cardFor(it)));
  }

  // timeline
  if (el.timeline) {
    el.timeline.innerHTML = '';
    const sorted = list.slice().sort((a,b)=> new Date(b.date) - new Date(a.date));
    sorted.forEach(it => el.timeline.appendChild(timelineItem(it)));
  }

  // changelogs
  if (el.changelogList) {
    el.changelogList.innerHTML = '';
    list.slice(0,12).forEach(it => el.changelogList.appendChild(changelogNode(it)));
  }

  // bind
  // bind
// Abrir link
$$('.js-link').forEach(btn =>
  btn.addEventListener('click', () => {
    const id = btn.dataset.id;
    const item = UPDATES.find(u => u.id === id);

    if (!item || !item.link || item.link.trim() === "") {
      toast("Este update no tiene un link disponible por el momento.");
      return;
    }

    // abrir en nueva pestaña
    window.open(item.link, "_blank");
  })
);


// Abrir modal (botón "Ver")
$$('.js-open').forEach(btn =>
  btn.addEventListener('click', () => {
    const id = btn.dataset.id;
    openModal(id);  // tu función ya existe
  })
);




  applyReadBadges();
  renderPager(list.length);
}

// ----------------- Filtering / Search / Sort -----------------
function applyFilters() {
  const activeChip = $$('.chip.active')[0];
  const filter = activeChip ? activeChip.dataset.filter : 'all';
  const q = (el.q && el.q.value || '').trim().toLowerCase();
  let list = UPDATES.slice();
  if (filter && filter !== 'all') list = list.filter(i => i.state === filter);
  if (q) list = list.filter(i => (`${i.title} ${i.summary} ${(i.tags||[]).join(' ')}`).toLowerCase().includes(q));
  list.sort((a,b) => sortAsc ? new Date(a.date) - new Date(b.date) : new Date(b.date) - new Date(a.date));
  renderAll(list);
}

// ----------------- Pager -----------------
let pageSize = 24;
let currentPage = 1;
function renderPager(n) {
  if (!el.pager) return;
  el.pager.innerHTML = '';
  const pages = Math.max(1, Math.ceil(n / pageSize));
  if (pages <= 1) return;
  for (let i=1;i<=pages;i++){
    const b = document.createElement('button');
    b.textContent = i;
    b.className = i===currentPage ? 'btn btn--primary' : 'btn btn--ghost';
    b.addEventListener('click', ()=> {
      currentPage = i;
      const nodes = $$('.update-card');
      nodes.forEach((node, idx) => {
        const start = (currentPage-1)*pageSize, end = start + pageSize;
        node.style.display = (idx >= start && idx < end) ? '' : 'none';
      });
    });
    el.pager.appendChild(b);
  }
  // show first slice
  const nodes = $$('.update-card');
  nodes.forEach((node, idx) => {
    const start = (currentPage-1)*pageSize, end = start + pageSize;
    node.style.display = (idx >= start && idx < end) ? '' : 'none';
  });
}

// ----------------- Modal -----------------
function openModal(id) {
  const item = UPDATES.find(u => u.id === id);
  if (!item) return;
  if (!el.mvModal) return;
  el.mvModal.setAttribute('aria-hidden','false');
  el.mvModal.style.display = 'grid';
  if (el.mvModalTitle) el.mvModalTitle.textContent = item.title;
  if (el.mvModalMeta) el.mvModalMeta.textContent = `${formatDate(item.date)} • ${(item.tags||[]).join(', ')} • ${item.state}`;
  if (el.mvModalBody) el.mvModalBody.innerHTML = item.content || `<p>${escapeHtml(item.summary)}</p>`;
  if (el.mvModalTags) el.mvModalTags.innerHTML = (item.tags||[]).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join(' ');
  markRead(item.id);
  applyReadBadges();
}
function closeModal() {
  if (!el.mvModal) return;
  el.mvModal.setAttribute('aria-hidden','true');
  el.mvModal.style.display = 'none';
}

// ----------------- Read badges -----------------
function applyReadBadges() {
  const read = getRead();
  $$('.update-card').forEach(card => {
    const id = card.dataset.id;
    if (read.includes(id) && !card.querySelector('.read-badge')) {
      const b = document.createElement('span'); b.className = 'tag read-badge'; b.textContent = 'Leído';
      const t = card.querySelector('.title');
      if (t) t.insertAdjacentElement('afterend', b);
    }
  });
}

// ----------------- Export JSON -----------------
function exportJSON() {
  const blob = new Blob([JSON.stringify(UPDATES, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'moonveil-updates.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  toast('Exportado JSON');
}

// ----------------- UI Bindings -----------------
function bindUI() {
  el.chips.forEach(c => c.addEventListener('click', ()=> {
    el.chips.forEach(x => x.classList.remove('active'));
    c.classList.add('active');
    applyFilters();
  }));
  if (el.q) el.q.addEventListener('input', throttle(()=> applyFilters(), 180));
  if (el.btnSort) el.btnSort.addEventListener('click', ()=> { sortAsc = !sortAsc; el.btnSort.textContent = sortAsc ? 'Ordenar ↑' : 'Ordenar ↓'; applyFilters(); });
  if (el.btnToggleView) el.btnToggleView.addEventListener('click', ()=> { viewMode = viewMode === 'grid' ? 'timeline' : 'grid'; localStorage.setItem('mv_view', viewMode); updateViewMode(); });
  if (el.btnExportJSON) el.btnExportJSON.addEventListener('click', exportJSON);
  if (el.btnClearFilters) el.btnClearFilters.addEventListener('click', ()=> { if (el.q) el.q.value = ''; el.chips.forEach(x=>x.classList.remove('active')); el.chips[0]?.classList.add('active'); applyFilters(); });
  if (el.btnClearRead) el.btnClearRead.addEventListener('click', ()=> { localStorage.removeItem(READ_KEY); applyReadBadges(); toast('Leídos borrados'); });
  if (el.mvModalClose) el.mvModalClose.addEventListener('click', closeModal);
  if (el.mvMarkRead) el.mvMarkRead.addEventListener('click', ()=> {
    const title = el.mvModalTitle && el.mvModalTitle.textContent;
    const it = UPDATES.find(u => u.title === title);
    if (it) { markRead(it.id); applyReadBadges(); toast('Marcado como leído'); }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  el.tagCloud && el.tagCloud.addEventListener('click', (e) => {
    const t = e.target.closest('.tag');
    if (!t) return;
    if (el.q) el.q.value = t.dataset.tag || t.textContent;
    applyFilters();
    toast(`Filtrando por ${t.dataset.tag || t.textContent}`);
  });

  // mobile nav toggle (inicio.css)
  const navToggle = $('#navToggle'), navLinks = $('#navLinks');
  navToggle?.addEventListener('click', ()=> navLinks.classList.toggle('open'));
}

// ----------------- Helpers -----------------
function updateViewMode() {
  if (viewMode === 'grid') {
    $('#viewGrid')?.setAttribute('aria-hidden','false');
    $('#viewTimeline')?.setAttribute('aria-hidden','true');
    $('#viewGrid').style.display = '';
    $('#viewTimeline').style.display = 'none';
  } else {
    $('#viewGrid')?.setAttribute('aria-hidden','true');
    $('#viewTimeline')?.setAttribute('aria-hidden','false');
    $('#viewGrid').style.display = 'none';
    $('#viewTimeline').style.display = '';
  }
}

function revealOnScroll() {
  const els = $$('.hero-inner, .mv-controls, .mv-main, .changelogs');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) en.target.classList.add('is-in'); });
  }, { threshold: 0.12 });
  els.forEach(e => obs.observe(e));
}

function throttle(fn, wait=200){
  let t=null;
  return (...args)=> {
    if (t) return;
    t = setTimeout(()=>{ fn(...args); t=null; }, wait);
  };
}

// ----------------- Init -----------------
function init(){
  seed(0); // populate many items
  bindUI();
  updateViewMode();
  applyFilters();
  revealOnScroll();
  if (el.y) el.y.textContent = new Date().getFullYear();
}

// start
init();


