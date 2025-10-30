/**
 * updates.js — Moonveil Updates (lista continua)
 *
 * - Lista de actualizaciones definida en UPDATES (edítala aquí).
 * - UI: grid de tarjetas (cuadradas moderadas), búsqueda, filtros, orden, modal detalle y lightbox.
 * - Los usuarios NO pueden añadir/borrar (solo ver). Para modificar: edita UPDATES en este archivo.
 * - Guarda en localStorage la última versión vista para notificar novedades.
 */

/* --------- Config / storage keys --------- */
const STORAGE_KEY_LAST_SEEN = 'mv_updates_last_seen_v2';
const UPDATES_CONTAINER = '#updatesGrid';
const MODAL = '#updateModal';
const MODAL_CONTENT = '#modalContent';
const TOAST = '#updToast';

/* --------- Helper DOM --------- */
const $ = (s, ctx=document) => ctx.querySelector(s);
const $$ = (s, ctx=document) => Array.from((ctx||document).querySelectorAll(s));
const el = (t='div', p={}) => { const e = document.createElement(t); Object.assign(e, p); return e; };
function toast(msg, ms=2200){ const t = $(TOAST); if(!t) return; t.textContent = msg; t.classList.add('show'); clearTimeout(t._tm); t._tm = setTimeout(()=> t.classList.remove('show'), ms); }

/* --------- Small helpers --------- */
function uid(prefix='id'){ return prefix + '_' + Math.random().toString(36).slice(2,9); }
function timeLabel(iso){ try{ return new Date(iso).toLocaleDateString(); }catch(e){ return iso; } }
function isLikelyLink(s){ return /\bhttps?:\/\/\S+|\bwww\.\S+/i.test(s); }
function makeLinksClickable(text){ const frag = document.createDocumentFragment(); const parts = (text||'').split(/(\bhttps?:\/\/\S+|\bwww\.\S+)/i); parts.forEach(p=>{ if(!p) return; if(isLikelyLink(p)){ let href=p; if(!/^https?:\/\//i.test(href)) href='https://'+href; const a = el('a', { href, target:'_blank', rel:'noopener noreferrer' }); a.textContent=p; frag.appendChild(a);} else frag.appendChild(document.createTextNode(p)); }); return frag; }

/* --------- Demo helpers: SVG placeholder generator --------- */
function svgPlaceholder(title='Preview', w=800, h=400, accent='#30d158'){
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'><rect width='100%' height='100%' fill='#07120f'/><g fill='${accent}' opacity='.12'><rect x='28' y='28' width='140' height='140' rx='12'/><rect x='192' y='56' width='580' height='100' rx='10'/></g><text x='50%' y='50%' font-family='Outfit, sans-serif' font-size='28' fill='${accent}' text-anchor='middle' dominant-baseline='middle'>${title}</text></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

/* --------- UPDATES array (edítalo aquí) --------- */
const UPDATES = [
  /*{
    id: 'mv-4-0',
    title: 'Moonveil 4.0 — Shattered Realms',
    date: '2025-10-20',
    category: 'Expansión',
    state: 'active',
    excerpt: 'Nueva expansión: 3 biomas, jefes y sistema de facciones.',
    body: `<p>La actualización 4.0 trae los <strong>Reinos Quebrados</strong>, 3 biomas nuevos, jefes dinámicos y contenido de facciones. Se ajustó el loot y la progresión.</p>`,
    media: [ svgPlaceholder('Shattered Realms', 1200, 640, '#30d158') ],
    links: [{ label: 'Notas 4.0', url: 'https://moonveil.portal/notes/4.0' }],
    pdf: true
  },*/
  /*{
    id: 'mv-3-8',
    title: 'Parche 3.8.2 — Optimización de render',
    date: '2025-08-05',
    category: 'Rendimiento',
    state: 'active',
    excerpt: 'Menor uso de CPU en biomas densos; culling de partículas.',
    body: `<p>Se optimizó culling y carga de chunks. Usuarios con sesiones largas notarán reducción de CPU y framerate más estable.</p>`,
    media: [ svgPlaceholder('Optimización', 1200, 640, '#60a5fa') ],
    links: [{ label: 'Benchmarks', url: 'https://moonveil.portal/benchmarks/3.8.2' }],
    pdf: false
  },*/
  /*{
    id: 'mv-festival-2025',
    title: 'Festival de la Luna — Próximamente',
    date: '2025-11-10',
    category: 'Evento',
    state: 'upcoming',
    excerpt: 'Evento global con misiones temporales y cosméticos exclusivos.',
    body: `<p>Festival de la Luna: misiones diarias, recompensas y cosméticos. Marca la fecha y prepárate.</p>`,
    media: [ svgPlaceholder('Festival de la Luna', 1200, 640, '#ff7ab6') ],
    links: [{ label: 'Página del evento', url: 'https://moonveil.portal/events/festival-luna' }],
    pdf: false
  },*/
  {
    id: 'mv-shop-restock',
    title: 'Tienda: Restock programado',
    date: '2025-09-01',
    category: 'Tienda',
    state: 'active',
    excerpt: 'Restock por 24h / 7d / 30d y descuentos dinámicos.',
    body: `<p>Un nuevo motor de restock permitirá programar stock y descuentos por periodos: 24h, 7d y 30d. Mejora la predictibilidad de la tienda.</p>`,
    media: [ svgPlaceholder('Tienda — Restock', 1200, 640, '#ffd97f') ],
    links: [{ label: 'Diseño del sistema', url: 'https://gatito-peke-cyber.github.io/Moonveil/tienda.html' }],
    pdf: false
  },
  {
    id: 'mv-missions-40lv',
    title: 'Misiones: Progresión (40 niveles)',
    date: '2025-07-12',
    category: 'Gameplay',
    state: 'active',
    excerpt: 'Nuevo sistema de misiones con 40 niveles y cooldowns 24h/7d/30d.',
    body: `<p>Se rediseñó la curva de XP y se introdujeron misiones con cooldowns diarios, semanales y mensuales.</p>`,
    media: [ svgPlaceholder('Misiones 40 lv', 1200, 640, '#9ae6b4') ],
    links: [{ label: 'Guía de misiones', url: 'https://gatito-peke-cyber.github.io/Moonveil/moon.html' }],
    pdf: false
  },
  {
    id: 'mv-event',
    title: 'Evento: Draw!',
    date: '2025-12-13',
    category: 'Gameplay',
    state: 'building',
    excerpt: 'El evento se estrenara dentro de pocos meses.',
    body: `<p>Haz un increible trabajo.El arte hazlo brillar con tu esplendida creatividad.</p>`,
    media: [ svgPlaceholder('Tienda — Restock', 1200, 640, '#ffd97f') ],
    links: [{ label: 'Diseño del sistema', url: 'https://gatito-peke-cyber.github.io/Moonveil/draw.html' }],
    pdf: false
  },
  /*{
    id: 'mv-ux-refresh',
    title: 'Interfaz: Refresh HUD & UX',
    date: '2025-04-18',
    category: 'UI/UX',
    state: 'active',
    excerpt: 'Mejor contraste, accesibilidad y animaciones reactivas del HUD.',
    body: `<p>Mejoras en accesibilidad: focus-visible, contraste y animaciones más suaves en HUD y menús.</p>`,
    media: [ svgPlaceholder('HUD Refresh', 1200, 640, '#30d158') ],
    links: [{ label: 'Detalles UI', url: 'https://moonveil.portal/design/hud-refresh' }],
    pdf: false
  }*/
  // Añade / modifica entradas directamente en este array.
];

/* --------- Derived functions (categories) --------- */
function deriveCategories(){
  const s = new Set();
  UPDATES.forEach(u=>{ if(u.category) s.add(u.category); });
  return Array.from(s).sort();
}

/* --------- DOM render: single card --------- */
function cardFor(update){
  const card = el('article', { className: 'update-card', tabIndex:0 });
  card.dataset.id = update.id;

  const media = el('div', { className: 'update-card__media' });
  if(update.media && update.media.length){
    media.style.backgroundImage = `url("${update.media[0]}")`;
    media.style.backgroundSize = 'cover';
    media.style.backgroundPosition = 'center';
  } else {
    media.style.background = '#071712';
  }

  const badge = el('div', { className: 'update-card__badge' }); badge.textContent = update.category || 'General';
  const stateEl = el('div', { className: 'update-card__state' });

  if(update.state === 'active') stateEl.textContent = 'Activo';
  else if(update.state === 'building') {
    stateEl.innerHTML = `<span class="state-building"><span></span><span></span><span></span></span>`;
    stateEl.style.background = 'transparent'; stateEl.style.color = '#ffd97f'; stateEl.style.border = '1px solid rgba(255,200,120,.08)';
  } else if(update.state === 'upcoming'){
    stateEl.innerHTML = `<span class="state-upcoming">Próx.</span>`;
  }

  media.appendChild(badge); media.appendChild(stateEl);

  const body = el('div', { className: 'update-card__body' });
  const title = el('div', { className: 'update-card__title' }); title.textContent = update.title;
  const meta = el('div', { className: 'update-card__meta' });
  const date = el('div'); date.textContent = timeLabel(update.date);
  const cat = el('div'); cat.textContent = update.category || '';
  meta.appendChild(date); meta.appendChild(cat);

  const excerpt = el('div', { className: 'update-card__excerpt' }); excerpt.textContent = update.excerpt || '';

  const actions = el('div', { className: 'update-card__actions' });
  const viewBtn = el('button', { className: 'action-btn primary', innerText: 'Ver detalles' });
  viewBtn.addEventListener('click', (ev) => { ev.stopPropagation(); openModal(update.id); });

  const previewBtn = el('button', { className: 'action-btn', innerText: 'Vista' });
  previewBtn.addEventListener('click', (ev) => { ev.stopPropagation(); previewMedia(update); });

  actions.appendChild(viewBtn); actions.appendChild(previewBtn);

  body.appendChild(title); body.appendChild(meta); body.appendChild(excerpt); body.appendChild(actions);

  card.appendChild(media); card.appendChild(body);

  // open modal on card click
  card.addEventListener('click', () => openModal(update.id));
  card.addEventListener('keydown', (e) => { if(e.key === 'Enter') openModal(update.id); });

  return card;
}

/* --------- Render grid with given list --------- */
function renderGrid(list){
  const grid = $(UPDATES_CONTAINER);
  grid.innerHTML = '';
  list.forEach(u => {
    const c = cardFor(u);
    grid.appendChild(c);
  });
  $('#totalUpdates').textContent = list.length;
}

/* --------- Filters / search / sort --------- */
function applyFiltersAndSearch(){
  const q = ($('#q').value || '').trim().toLowerCase();
  const cat = $('#filterCategory').value;
  const state = $('#filterState').value;

  let filtered = UPDATES.slice();

  if(cat && cat !== 'all') filtered = filtered.filter(u => u.category === cat);
  if(state && state !== 'all') filtered = filtered.filter(u => u.state === state);
  if(q) filtered = filtered.filter(u => {
    const hay = `${u.title} ${u.excerpt} ${u.body} ${u.category}`.toLowerCase();
    return hay.includes(q);
  });

  // default sort: newest first
  filtered.sort((a,b) => new Date(b.date) - new Date(a.date));
  renderGrid(filtered);
}

/* --------- populate filter categories --------- */
function populateFilters(){
  const cats = deriveCategories();
  const sel = $('#filterCategory');
  cats.forEach(c => {
    const o = el('option'); o.value = c; o.textContent = c; sel.appendChild(o);
  });
}

/* --------- Modal (detalle) --------- */
function openModal(id){
  const u = UPDATES.find(x => x.id === id);
  if(!u) return;
  const modal = $(MODAL);
  const content = $(MODAL_CONTENT);
  content.innerHTML = '';

  const h = el('h2'); h.textContent = u.title; h.className = 'modal__title';
  const meta = el('div'); meta.className = 'u-muted'; meta.textContent = `${timeLabel(u.date)} • ${u.category} • ${u.state}`;
  content.appendChild(h); content.appendChild(meta);

  if(u.media && u.media.length){
    const dm = el('div', { className: 'detail-media' });
    const img = el('img', { src: u.media[0], alt: u.title });
    img.style.width = '100%'; img.style.cursor = 'zoom-in';
    img.addEventListener('click', () => openLightbox(u.media[0], u.title));
    dm.appendChild(img); content.appendChild(dm);
  }

  const body = el('div'); body.innerHTML = u.body || '';
  content.appendChild(body);

  const actions = el('div', { className: 'detail-actions' });
  if(u.links && u.links.length){
    u.links.forEach(l => {
      const a = el('a', { href: l.url, target: '_blank', rel: 'noopener noreferrer' });
      a.className = 'action-btn'; a.textContent = l.label || l.url; actions.appendChild(a);
    });
  }
  if(u.pdf){
    const dl = el('button', { className: 'action-btn primary', innerText: 'Descargar PDF' });
    dl.addEventListener('click', () => {
      const blob = generateSimplePDF(u);
      const url = URL.createObjectURL(blob);
      const a = el('a', { href: url, download: `${u.id}.pdf` });
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      toast('PDF generado para descargar');
    });
    actions.appendChild(dl);
  }

  content.appendChild(actions);

  modal.setAttribute('aria-hidden', 'false');
  // track last seen
  try{ localStorage.setItem(STORAGE_KEY_LAST_SEEN, u.id); }catch(e){}
}

/* close modal */
$('#modalClose').addEventListener('click', () => {
  const modal = $(MODAL);
  modal.setAttribute('aria-hidden', 'true');
});

/* close modal on outside click */
$(MODAL).addEventListener('click', (e) => {
  if(e.target === $(MODAL)){
    $(MODAL).setAttribute('aria-hidden','true');
  }
});

/* --------- Lightbox --------- */
function openLightbox(src, caption=''){
  const lb = $('#updLightbox');
  $('#lbImg').src = src;
  $('#lbCaption').textContent = caption;
  lb.classList.add('is-open'); lb.setAttribute('aria-hidden','false');
}
$('#lbClose').addEventListener('click', () => {
  const lb = $('#updLightbox'); lb.classList.remove('is-open'); lb.setAttribute('aria-hidden','true');
});
$('#updLightbox').addEventListener('click', (e)=> { if(e.target === $('#updLightbox')) { $('#updLightbox').classList.remove('is-open'); $('#updLightbox').setAttribute('aria-hidden','true'); } });

/* --------- PDF simple generator (client-side text blob) --------- */
function generateSimplePDF(update){
  const text = `Moonveil — ${update.title}\nFecha: ${update.date}\nCategoria: ${update.category}\n\n${stripHTML(update.body || '')}\n\nLinks:\n${(update.links||[]).map(l=>`${l.label} - ${l.url}`).join('\n')}`;
  return new Blob([text], { type: 'application/pdf' });
}
function stripHTML(html){ const tmp = document.createElement('div'); tmp.innerHTML = html; return tmp.textContent || tmp.innerText || ''; }

/* --------- Preview media helper --------- */
function previewMedia(update){
  if(update.media && update.media.length) openLightbox(update.media[0], update.title);
  else toast('No hay imagen de preview.');
}

/* --------- New update notifier (last seen) --------- */
function checkNewUpdates(){
  try{
    const lastSeen = localStorage.getItem(STORAGE_KEY_LAST_SEEN);
    // newest by date
    const newest = UPDATES.slice().sort((a,b)=> new Date(b.date) - new Date(a.date))[0];
    if(!newest) return;
    $('#lastUpdateDate').textContent = timeLabel(newest.date);
    if(!lastSeen || lastSeen !== newest.id){
      // show a subtle toast that there are updates (but not annoying)
      setTimeout(()=> toast('Hay actualizaciones nuevas disponibles.'), 700);
    }
  }catch(e){}
}

/* --------- Wiring: controls --------- */
$('#q').addEventListener('input', () => applyFiltersAndSearch());
$('#filterCategory').addEventListener('change', () => applyFiltersAndSearch());
$('#filterState').addEventListener('change', () => applyFiltersAndSearch());

let sortNewest = true;
$('#btnSort').addEventListener('click', () => {
  sortNewest = !sortNewest;
  $('#btnSort').textContent = sortNewest ? 'Orden: Más reciente' : 'Orden: Más antiguo';
  if(sortNewest) UPDATES.sort((a,b)=> new Date(b.date) - new Date(a.date));
  else UPDATES.sort((a,b)=> new Date(a.date) - new Date(b.date));
  applyFiltersAndSearch();
});

/* --------- Boot --------- */
function boot(){
  populateFilters();
  // default sort newest first
  UPDATES.sort((a,b)=> new Date(b.date) - new Date(a.date));
  applyFiltersAndSearch();
  checkNewUpdates();
  // focus search
  $('#q').focus();
}
document.addEventListener('DOMContentLoaded', () => { try{ boot(); }catch(e){ console.error(e); } });

/* expose for debugging */
window.MoonveilUpdates = { UPDATES, applyFiltersAndSearch, openModal };
