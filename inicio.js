/* =========================================================
   Moonveil Portal — JS: Inicio / Bienvenida
   Funcional:
   - Navbar responsive
   - HUD dinámico (valores visibles y animados)
   - Parallax simple (capas .layer)
   - Partículas en canvas
   - Generación de 12 tarjetas (imagen, nombre, categoría, descripción)
   - Filtros por categoría
   - Búsqueda (por nombre/desc) en vivo
   - Mezclar (shuffle) y Ordenar (A→Z)
   - Contadores visibles/total
   - Lightbox con navegación por teclado
   - Scroll Reveal (IntersectionObserver)
   - Toasts
   ========================================================= */

const $ = (q, ctx = document) => ctx.querySelector(q);
const $$ = (q, ctx = document) => Array.from(ctx.querySelectorAll(q));

/* ---------- Navbar responsive ---------- */
const navToggle = $('#navToggle');
const navLinks = $('#navLinks');
if (navToggle) {
  navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
}

/* ---------- Año footer ---------- */
const yEl = $('#y');
if (yEl) yEl.textContent = new Date().getFullYear();

/* ---------- HUD barras ---------- */
const setHudBars = () => {
  $$('.hud-bar').forEach(bar => {
    const v = +bar.dataset.val || 50;
    bar.style.setProperty('--v', v);
  });
};
setHudBars();

/* ---------- Partículas de fondo ---------- */
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
      s: .2 + Math.random()*1.2,
      a: .15 + Math.random()*.35
    }));
  };

  const tick = () => {
    ctx.clearRect(0,0,w,h);
    parts.forEach(p=>{
      p.y += p.s; p.x += Math.sin(p.y*0.002)*0.4;
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

/* ---------- Parallax simple ---------- */
(function parallax(){
  const layers = $$('.layer');
  if (!layers.length) return;
  const k = [0, 0.03, 0.06, 0.1]; // factor por capa

  const onScroll = () => {
    const y = window.scrollY || 0;
    layers.forEach((el, i) => {
      el.style.transform = `translateY(${y * k[i]}px)`;
    });
  };
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });
})();

/* ---------- Data: 12 tarjetas ---------- */
const ITEMS = [
  /*{
    name: 'Espada de Hierro',
    category: 'armas',
    img: 'https://images.unsplash.com/photo-1603344206765-68a5a7061f09?q=80&w=1200&auto=format&fit=crop',
    desc: 'Ligera y confiable. Ideal para defensa en aldeas.'
  },*/
  {
    name: 'Ba██ier',
    category: 'bloques',
    img: 'img/barrier.jpg',
    desc: '¿Este item?'
  },
  /*{
    name: 'Esmeralda Pulida',
    category: 'bloques',
    img: 'https://images.unsplash.com/photo-1585386959984-a41552231673?q=80&w=1200&auto=format&fit=crop',
    desc: 'La moneda de los aldeanos. Brilla más que el sol.'
  },
  {
    name: 'Pan Recién Horneado',
    category: 'comida',
    img: 'https://images.unsplash.com/photo-1514996937319-344454492b37?q=80&w=1200&auto=format&fit=crop',
    desc: 'Satisface el hambre con suavidad pixelada.'
  },
  {
    name: 'Farol de Alba',
    category: 'decoración',
    img: 'https://images.unsplash.com/photo-1496104679561-38b3b4d6d42a?q=80&w=1200&auto=format&fit=crop',
    desc: 'Ilumina caminos y rincones con calidez dorada.'
  },
  {
    name: 'Bloque de Madera de Roble',
    category: 'bloques',
    img: 'https://images.unsplash.com/photo-1530475321340-5321ef63b7d4?q=80&w=1200&auto=format&fit=crop',
    desc: 'Base para construir hogares acogedores.'
  },
  {
    name: 'Arco del Errante',
    category: 'armas',
    img: 'https://images.unsplash.com/photo-1542326237-94b1c5a0e6de?q=80&w=1200&auto=format&fit=crop',
    desc: 'Precisión legendaria. Que las flechas te acompañen.'
  },
  {
    name: 'Tarta de Calabaza',
    category: 'comida',
    img: 'https://images.unsplash.com/photo-1603899122484-1c4474a3d9e3?q=80&w=1200&auto=format&fit=crop',
    desc: 'Postre oficial de celebraciones aldeanas.'
  },
  {
    name: 'Maceta de Helecho',
    category: 'decoración',
    img: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=1200&auto=format&fit=crop',
    desc: 'Un toque verde para interiores y plazas.'
  },
  {
    name: 'Lingote de Hierro',
    category: 'bloques',
    img: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop',
    desc: 'Imprescindible para herramientas y mejoras.'
  },
  {
    name: 'Estofado de Setas',
    category: 'comida',
    img: 'https://images.unsplash.com/photo-1514517213335-5f54c3ca3563?q=80&w=1200&auto=format&fit=crop',
    desc: 'Reconforta hasta al minero más cansado.'
  },
  {
    name: 'Cuadro de Cazador',
    category: 'decoración',
    img: 'https://images.unsplash.com/photo-1520697222861-e772a5f6b86a?q=80&w=1200&auto=format&fit=crop',
    desc: 'Arte rústico con marco de madera y cuero.'
  },
  {
    name: 'Yunque Forjado',
    category: 'bloques',
    img: 'https://images.unsplash.com/photo-1604594849809-dfedbc827105?q=80&w=1200&auto=format&fit=crop',
    desc: 'Para reparar, renombrar y combinar equipo.'
  }*/
];

/* ---------- Estado y referencias ---------- */
const cardsEl = $('#cards');
const chips = $$('.chip');
const qInput = $('#q');
const countVisible = $('#countVisible');
const countTotal = $('#countTotal');
const btnShuffle = $('#btnShuffle');
const btnSort = $('#btnSort');
const btnClear = $('#btnClear');

countTotal.textContent = ITEMS.length.toString();

let currentFilter = 'all';
let query = '';
let currentList = ITEMS.slice();

/* ---------- Render de tarjetas ---------- */
function cardTemplate(it, i){
  return `
  <article class="card reveal" data-category="${it.category}" data-name="${escapeHtml(it.name)}" data-desc="${escapeHtml(it.desc)}">
    <button class="card__media" data-lightbox="${i}" aria-label="Ampliar ${escapeHtml(it.name)}">
      <img src="${it.img}" alt="${escapeHtml(it.name)} — ${it.category}" loading="lazy" />
    </button>
    <div class="card__body">
      <h3 class="card__title">${escapeHtml(it.name)}</h3>
      <p class="card__desc">${escapeHtml(it.desc)}</p>
    </div>
    <footer class="card__meta">
      <span class="tag">${capitalize(it.category)}</span>
    </footer>
  </article>`;
}

function render(list){
  cardsEl.innerHTML = list.map((it,i)=> cardTemplate(it,i)).join('');
  updateVisibleCount();
  observeReveal();
  bindLightboxTriggers();
}

function updateVisibleCount(){
  const v = $$('.card', cardsEl).length;
  countVisible.textContent = v.toString();
}

/* ---------- Filtros ---------- */
chips.forEach(chip=>{
  chip.addEventListener('click', ()=>{
    chips.forEach(c=>c.classList.remove('active'));
    chip.classList.add('active');
    currentFilter = chip.dataset.filter || 'all';
    applyFilters();
    toast(`Filtro aplicado: ${chip.textContent}`);
  });
});

/* ---------- Búsqueda ---------- */
if (qInput){
  qInput.addEventListener('input', ()=>{
    query = qInput.value.trim().toLowerCase();
    applyFilters();
  });
}

/* ---------- Mezclar y ordenar ---------- */
btnShuffle?.addEventListener('click', ()=>{
  currentList = currentList
    .map(v=>[Math.random(),v])
    .sort((a,b)=>a[0]-b[0])
    .map(v=>v[1]);
  render(currentList);
  toast('Colección mezclada');
});

btnSort?.addEventListener('click', ()=>{
  currentList = currentList.slice().sort((a,b)=> a.name.localeCompare(b.name,'es',{sensitivity:'base'}));
  render(currentList);
  toast('Ordenado A→Z');
});

/* ---------- Limpiar ---------- */
btnClear?.addEventListener('click', ()=>{
  currentFilter = 'all';
  chips.forEach(c=>c.classList.remove('active'));
  chips[0].classList.add('active');
  qInput.value = '';
  query = '';
  currentList = ITEMS.slice();
  render(currentList);
  toast('Filtros limpiados');
});

/* ---------- Aplicar filtros y búsqueda ---------- */
function applyFilters(){
  const base = ITEMS.filter(it => currentFilter==='all' ? true : it.category === currentFilter);
  if (!query){
    currentList = base;
  } else {
    currentList = base.filter(it =>
      it.name.toLowerCase().includes(query) ||
      it.desc.toLowerCase().includes(query)
    );
  }
  render(currentList);
}

/* ---------- Lightbox ---------- */
const lb = $('#lightbox');
const lbImg = $('#lbImg');
const lbCap = $('#lbCaption');
const lbPrev = $('#lbPrev');
const lbNext = $('#lbNext');
const lbClose = $('#lbClose');
let lbIndex = -1;

function bindLightboxTriggers(){
  $$('[data-lightbox]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const i = +btn.dataset.lightbox;
      openLightbox(i);
    });
  });
}

function openLightbox(i){
  const item = currentList[i];
  if (!item) return;
  lbIndex = i;
  lbImg.src = item.img;
  lbImg.alt = `${item.name} — ${item.category}`;
  lbCap.textContent = `${item.name} — ${item.category}`;
  lb.setAttribute('aria-hidden','false');
  lb.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  lbClose.focus();
}

function closeLightbox(){
  lb.classList.remove('is-open');
  lb.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
  lbIndex = -1;
}

function navLightbox(dir){
  if (lbIndex < 0) return;
  lbIndex = (lbIndex + dir + currentList.length) % currentList.length;
  const item = currentList[lbIndex];
  lbImg.src = item.img;
  lbImg.alt = `${item.name} — ${item.category}`;
  lbCap.textContent = `${item.name} — ${item.category}`;
}

lbPrev?.addEventListener('click', ()=>navLightbox(-1));
lbNext?.addEventListener('click', ()=>navLightbox(1));
lbClose?.addEventListener('click', closeLightbox);

addEventListener('keydown', (e)=>{
  if (!lb.classList.contains('is-open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') navLightbox(-1);
  if (e.key === 'ArrowRight') navLightbox(1);
});

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

/* ---------- Stats demo ---------- */
$('#btnBoost')?.addEventListener('click', ()=>{
  const xp = $('.hud-bar.xp');
  const cur = +xp.dataset.val || 0;
  const nv = Math.min(100, cur + 10);
  xp.dataset.val = nv;
  xp.style.setProperty('--v', nv);
  $('#stTrades').textContent = (+$('#stTrades').textContent + 5).toString();
  toast('¡Experiencia potenciada +10!');
});

$('#btnSync')?.addEventListener('click', ()=>{
  toast('Sincronizando… listo ✅');
});

/* ---------- Toast ---------- */
let toastTimeout;
function toast(msg){
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(()=> t.classList.remove('show'), 1800);
}

/* ---------- Accesibilidad: focus trap lightbox ---------- */
(function a11yLightbox(){
  const focusable = () => $$('.lightbox.is-open button, .lightbox.is-open img');
  addEventListener('keydown', (e)=>{
    if (e.key !== 'Tab' || !lb.classList.contains('is-open')) return;
    const f = focusable();
    if (!f.length) return;
    const first = f[0], last = f[f.length-1];
    if (e.shiftKey && document.activeElement === first){
      last.focus(); e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === last){
      first.focus(); e.preventDefault();
    }
  });
})();

/* ---------- Utilidades ---------- */
function capitalize(s){return s.charAt(0).toUpperCase()+s.slice(1)}
function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}

/* ---------- Inicializaciones ---------- */
document.addEventListener('DOMContentLoaded',()=>{
  // Relleno de HUD y contadores
  setHudBars();
  // Render inicial
  render(currentList);
});



