/* =========================================================
   Moonveil Portal — Tienda (JS)
   - Navbar responsive + HUD
   - Partículas + Parallax
   - Dataset de productos (7 secciones)
   - Render dinámico por grillas
   - Estados: destacado, agotado, restock automático (24h/7d/30d)
   - Búsqueda y filtro por sección
   - Modal de producto y compra (sin saldo)
   - Reveal on scroll + Toast
   - Persistencia en localStorage de stocks y timers
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
   Helpers
   ========================================================= */
/*esto es para soles*/
/*const fmt = new Intl.NumberFormat('es-PE', { style:'currency', currency:'PEN', maximumFractionDigits:0 });*/

const fmt = { format: (n) => `⟡${n}` };

const now = () => Date.now();
const H24 = 24*60*60*1000;
const D7  = 7*H24;
const D30 = 30*H24;

function escapeHTML(s){return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function cls(...xs){return xs.filter(Boolean).join(' ')}

/* =========================================================
   DATASET (muestra; puedes añadir más items si deseas)
   Campos:
   id, name, img, quality ('common','rare','epic','legendary'),
   price, stock, restock ('24h'|'7d'|'30d'|null),
   section ('pases'|'llaves'|'cosas'|'historia'|'materiales'|'eventos'|'monedas'),
   gold (destacado), desc, tags[]
   ========================================================= */

const products = [
  /* ===== PASES DE TEMPORADA ===== */
  { id:'s1', name:'Pase Lamento — Temporada I', img:'img-pass/banwar.jpg', quality:'legendary', price:128, stock:1,  restock:'30d', section:'pases', gold:true,  desc:'Desbloquea recompensas de la temporada de Septiembre.', tags:['pase','cosmético','reto'] },
  { id:'s2', name:'Pase Alma — Temporada II', img:'img-pass/banhall.jpg', quality:'legendary', price:128,  stock:1, restock:'30d', section:'pases', gold:true, desc:'Desbloquea recompensas de la temporada de Octubre.', tags:['pase','acelerado'] },
  { id:'s3', name:'Pase 404 — Temporada III', img:'img-pass/partymine.jpg', quality:'legendary', price:128, stock:1, restock:'30d', section:'pases', gold:true, desc:'Desbloquea recompensas de la temporada de Noviembre.', tags:['pase','xp'] },
  { id:'s4', name:'Pase Árboreo — Temporada IV', img:'img-pass/chrismine.jpg', quality:'legendary', price:128, stock:1, restock:'30d', section:'pases', gold:true, desc:'Desbloquea recompensas de la temporada de Diciembre.', tags:['pase','xp'] },
  { id:'s5', name:'Pase Resurge — Temporada V', img:'img-pass/añomine.jpg', quality:'legendary', price:128, stock:1, restock:'30d', section:'pases', gold:true, desc:'Desbloquea recompensas de la temporada de Enero.', tags:['pase','xp'] },
  { id:'s6', name:'Pase Carbón — Temporada VI', img:'img-pass/banair.jpg', quality:'legendary', price:128, stock:1, restock:'30d', section:'pases', gold:true, desc:'Desbloquea recompensas de la temporada de Febrero.', tags:['pase','xp'] },
  { id:'s7', name:'Pase Carbón — Temporada VII', img:'img-pass/dancingmine.jpg', quality:'legendary', price:128, stock:1, restock:'30d', section:'pases', gold:true, desc:'Desbloquea recompensas de la temporada de Marzo.', tags:['pase','xp'] },
  { id:'s8', name:'Pase Carbón — Temporada VIII', img:'img-pass/squemine.jpg', quality:'legendary', price:128, stock:1, restock:'30d', section:'pases', gold:true, desc:'Desbloquea recompensas de la temporada de Abril.', tags:['pase','xp'] },

  /* ===== LLAVES ===== común*/
  { id:'k1', name:'Cofre de Ambar', img:'img/chest2.gif', quality:'epic', price:30,  stock:10, restock:'7d', section:'llaves', gold:false, desc:'Abre este cofre de Ambar.', tags:['cofre','epico'] },
  { id:'k2', name:'Cofre de Sueños', img:'img/chest2.gif', quality:'epic', price:30, stock:10, restock:'7d', section:'llaves', gold:false, desc:'Abre este cofre de los Sueños que algunas vez hubo...', tags:['cofre','epico'] },
  { id:'k3', name:'Cofre de Moonveil', img:'img/chest2.gif', quality:'legendary', price:10, stock:10, restock:'7d', section:'llaves', gold:true, desc:'Abre este cofre Moon-Veil.', tags:['cofre','legendario'] },
  { id:'k4', name:'Cofre de Moonveil II', img:'img/chest2.gif', quality:'legendary', price:30, stock:5, restock:'7d', section:'llaves', gold:true, desc:'Abre este cofre Moon por ████.', tags:['cofre','█████'] },

  /* ===== COSAS INTERESANTES ===== */
  { id:'f1', name:'Libro A1', img:'img/book.jpg', quality:'epic', price:128, stock:1, restock:'30d', section:'cosas', gold:false, desc:'Un libro.', tags:['libro','lectura'] },
  { id:'f2', name:'Libro B2', img:'img/book.jpg', quality:'epic', price:128, stock:1, restock:'30d', section:'cosas', gold:false, desc:'Un libro.', tags:['libro','lectura'] },
  { id:'f3', name:'Libro A2', img:'img/book.jpg', quality:'epic', price:128, stock:1, restock:'30d', section:'cosas', gold:false, desc:'Un libro.', tags:['libro','lectura'] },
  { id:'f4', name:'Libro C3', img:'img/book.jpg', quality:'epic', price:128, stock:1, restock:'30d', section:'cosas', gold:false, desc:'Un libro.', tags:['libro','lectura'] },

  /* ===== HISTORIA ===== */
  { id:'l1', name:'Libro: “Bosque de Jade”', img:'img/bookmine.jpg', quality:'rare', price:256, stock:1, restock:null, section:'historia', gold:false, desc:'Leyendas de...', tags:['lore','bioma'] },
  { id:'l2', name:'Libro: “La Negra Noche”', img:'img/bookmine.jpg', quality:'epic', price:256, stock:1, restock:null, section:'historia', gold:false, desc:'Símbolos...', tags:['runas','forja'] },
  { id:'l3', name:'Libro: “El lado ███ de S██ B███”', img:'img/bookcat.gif', quality:'legendary', price:384, stock:1, restock:null, section:'historia', gold:true, desc:'█████████.', tags:['reliquia','desierto'] },

  /* ===== MATERIALES ===== metal, cristal, madera*/
  { id:'m1', name:'Pegatina de 1c.', img:'img/coin.jpg', quality:'common', price:0, stock:1, restock:'24h', section:'materiales', gold:false, desc:'Gratis.', tags:['coin','monedas'] },
  { id:'m2', name:'Bolsita de 30c.', img:'img/coin.jpg', quality:'rare', price:15, stock:10, restock:'7d', section:'materiales', gold:false, desc:'Para trueques y consumibles básicos.', tags:['coin','monedas'] },
  { id:'m3', name:'Pack de 90c.', img:'img/packcoin.jpg', quality:'epic', price:30, stock:10, restock:'7d', section:'materiales', gold:false, desc:'Relación costo/beneficio equilibrada.', tags:['pack-coin','monedas'] },
  { id:'m4', name:'Lote de 120c.', img:'img/stackcoin.jpg', quality:'legendary', price:60, stock:10, restock:'30d', section:'materiales', gold:true, desc:'Ideal para temporadas.', tags:['stack-coin','monedas'] },

  /* ===== PASES DE EVENTO ===== */
  { id:'e1', name:'Pase en la Oscuridad', img:'img-pass/banhall.jpg', quality:'legendary', price:256, stock:1, restock:'30d', section:'eventos', gold:true, desc:'Algo tal vez... Se acerca...', tags:['evento','acuático'] },
  { id:'e2', name:'Pase Gatos 😺✨', img:'img-pass/catsparty.jpg', quality:'legendary', price:256, stock:1, restock:'30d', section:'eventos', gold:false, desc:'Gatos y mas gatos...¿Gatos?', tags:['evento','nocturno'] },

  /* ===== MONEDAS ===== */
  { id:'c1', name:'Pack de 128r.', img:'img/coin.jpg', quality:'common', price:64, stock:999, restock:null, section:'monedas', gold:false, desc:'Para trueques y consumibles básicos.(2 stacks)', tags:['monedas','pack'] },
  { id:'c2', name:'Pack de 256r.', img:'img/packcoin.jpg', quality:'rare', price:128, stock:999, restock:null, section:'monedas', gold:false, desc:'Relación costo/beneficio equilibrada.(4 stacks)', tags:['monedas','pack'] },
  { id:'c3', name:'Pack de 384r.', img:'img/stackcoin.jpg', quality:'epic', price:256, stock:999, restock:null, section:'monedas', gold:true, desc:'Ideal para temporadas completas.(6 stacks)', tags:['monedas','pack'] },


  /* ===== TICKETS DE RULETA ===== */

  { id:'t_classic_1', name:'Ticket Clasico', img:'imagen/ticket5.jpg', quality:'epic', price:10,  stock:10, restock:'24h', amount:1 , section:'tickets', gold:false, desc:'Ticket para la ruleta', tags:['ticket','clasico'] },
  { id:'t_mystic_1', name:'Ticket Halloween', img:'imagen/ticket5.jpg', quality:'epic', price:10, stock:10, restock:'24h',  amount:1, section:'tickets', gold:false, desc:'Ticket para la ruleta', tags:['ticket','Halloween'] },
  { id:'t_elemental_1', name:'Ticket elemental', img:'imagen/ticket5.jpg', quality:'epic', price:10, stock:10, restock:'24h',  amount:1, section:'tickets', gold:false, desc:'Ticket para la ruleta', tags:['ticket','elemental'] },
  { id:'t_event_1', name:'Ticket evento', img:'imagen/ticket5.jpg', quality:'epic', price:10, stock:10, restock:'24h',  amount:1, section:'tickets', gold:false, desc:'Ticket para la ruleta', tags:['ticket','evento'] },
  { id:'t_classic_2', name:'Ticket Clasico', img:'imagen/ticket5.jpg', quality:'epic', price:30,  stock:10, restock:'24h', amount:5 , section:'tickets', gold:false, desc:'Ticket para la ruleta x5', tags:['ticket','clasico'] },
  { id:'t_mystic_2', name:'Ticket Halloween', img:'imagen/ticket5.jpg', quality:'epic', price:30, stock:10, restock:'24h',  amount:5, section:'tickets', gold:false, desc:'Ticket para la ruleta x5', tags:['ticket','Halloween'] },
  { id:'t_elemental_2', name:'Ticket elemental', img:'imagen/ticket5.jpg', quality:'epic', price:30, stock:10, restock:'24h',  amount:5, section:'tickets', gold:false, desc:'Ticket para la ruleta x5', tags:['ticket','elemental'] },
  { id:'t_event_2', name:'Ticket evento', img:'imagen/ticket5.jpg', quality:'epic', price:30, stock:10, restock:'24h',  amount:5, section:'tickets', gold:false, desc:'Ticket para la ruleta x5', tags:['ticket','evento'] },
  { id:'t_classic_3', name:'Bienvenida a los tickets!!', img:'imagen/ticket5.jpg', quality:'epic', price:0,  stock:1, restock:'7d', amount:10 , section:'tickets', gold:true, desc:'Ticket para la ruleta clasica x10', tags:['ticket','clasico'] },
  { id:'t_classic_4', name:'Tiros Gratis!!', img:'imagen/ticket5.jpg', quality:'epic', price:0,  stock:1, restock:'30d', amount:10 , section:'tickets', gold:true, desc:'Ticket para la ruleta clasica x10', tags:['ticket','clasico'] },

/* ===== TICKETS PARA RULETAS ===== */

];

/* =========================================================
   Persistencia de stock por producto en localStorage
   Claves:
   - mv_stock_<id> = número
   - mv_restock_<id> = timestamp en ms del próximo restock (o null)
   ========================================================= */
function keyStock(id){return `mv_stock_${id}`}
function keyRestock(id){return `mv_restock_${id}`}

function getStock(p){
  const v = localStorage.getItem(keyStock(p.id));
  return v==null ? p.stock : Math.max(0, parseInt(v,10) || 0);
}
function setStock(p, val){
  localStorage.setItem(keyStock(p.id), String(Math.max(0, val|0)));
}
function getNextRestock(p){
  const v = localStorage.getItem(keyRestock(p.id));
  return v==null ? computeNextRestock(p) : (v==='null'?null:Number(v));
}
function setNextRestock(p, ts){
  localStorage.setItem(keyRestock(p.id), ts==null ? 'null' : String(ts));
}
function intervalMs(tag){
  if (tag==='24h') return H24;
  if (tag==='7d')  return D7;
  if (tag==='30d') return D30;
  return null;
}
function computeNextRestock(p){
  if (!p.restock) return null;
  return now()+intervalMs(p.restock);
}

/* =========================================================
   Selectores de grillas + filtros
   ========================================================= */
const gridSeason = $('#gridSeason');
const gridKeys   = $('#gridKeys');
const gridFun    = $('#gridFun');
const gridLore   = $('#gridLore');
const gridMats   = $('#gridMats');
const gridEvents = $('#gridEvents');
const gridTickets  = $('#gridTickets');
const gridCoins  = $('#gridCoins');




const chipSections = $('#chipSections');
const searchInput = $('#searchInput');
const clearSearch = $('#clearSearch');

/* Modal */
const modal = $('#productModal');
const modalOverlay = $('#modalOverlay');
const modalClose = $('#modalClose');
const modalTitle = $('#modalTitle');
const modalBody = $('#modalBody');
const modalBuy = $('#modalBuy');

let filteredSection = 'all';
let searchText = '';
let currentProduct = null;

/* =========================================================
   Init
   ========================================================= */
document.addEventListener('DOMContentLoaded', ()=>{
  // Revelado
  observeReveal();
  // Render
  synchronizeStocks();
  renderAll();
  // Events filtros/busqueda
  // dentro de renderAll(), al principio:
  renderCouponUI();

  chipSections.addEventListener('click', onChipSection);
  searchInput.addEventListener('input', onSearch);
  clearSearch.addEventListener('click', ()=>{ searchInput.value=''; searchText=''; renderAll(); });
});

/* =========================================================
   Sincronización de stock y restocks programados
   ========================================================= */
function synchronizeStocks(){
  products.forEach(p=>{
    // Inicializar stock si no existe
    if (localStorage.getItem(keyStock(p.id))==null) setStock(p, p.stock);
    // Inicializar/restaurar próximo restock
    if (localStorage.getItem(keyRestock(p.id))==null){
      const n = computeNextRestock(p);
      setNextRestock(p, n);
    }else{
      const ts = getNextRestock(p);
      if (ts && ts <= now()){
        // Reponer
        setStock(p, p.stock);
        setNextRestock(p, computeNextRestock(p));
      }
    }
  });
}

/* =========================================================
   Render principal: filtra por sección + búsqueda
   ========================================================= */
function renderAll(){
  const matches = (p)=>{
    const secOk = filteredSection==='all' || p.section===filteredSection;
    const q = searchText.trim().toLowerCase();
    const txt = `${p.name} ${p.quality} ${p.desc} ${p.tags.join(' ')}`.toLowerCase();
    const searchOk = !q || txt.includes(q);
    return secOk && searchOk;
  };
  const arr = products.filter(matches);

  // Partición por secciones
  const S = arr.filter(p=>p.section==='pases');
  const K = arr.filter(p=>p.section==='llaves');
  const F = arr.filter(p=>p.section==='cosas');
  const L = arr.filter(p=>p.section==='historia');
  const M = arr.filter(p=>p.section==='materiales');
  const E = arr.filter(p=>p.section==='eventos');
  const C = arr.filter(p=>p.section==='monedas');
  const T = arr.filter(p=>p.section==='tickets');

  gridSeason.innerHTML = S.map(cardTemplate).join('') || emptyBlock('No hay pases disponibles.');
  gridKeys.innerHTML   = K.map(cardTemplate).join('') || emptyBlock('No hay llaves por ahora.');
  gridFun.innerHTML    = F.map(cardTemplate).join('') || emptyBlock('No hay curiosidades ahora.');
  gridLore.innerHTML   = L.map(cardTemplate).join('') || emptyBlock('No hay historia disponible.');
  gridMats.innerHTML   = M.map(cardTemplate).join('') || emptyBlock('Sin materiales.');
  gridEvents.innerHTML = E.map(cardTemplate).join('') || emptyBlock('No hay eventos activos.');
  gridCoins.innerHTML  = C.map(cardTemplate).join('') || emptyBlock('No hay packs de monedas.');
  gridTickets.innerHTML  = T.map(cardTemplate).join('') || emptyBlock('No hay tickets en estos momentos.');

  // Bind eventos
  $$('[data-open]').forEach(b=> b.addEventListener('click', ()=> openModal(b.getAttribute('data-open'))));
  $$('[data-buy]').forEach(b=> b.addEventListener('click', ()=> buyItem(b.getAttribute('data-buy'))));
}

/* =========================================================
   Tarjeta de producto
   ========================================================= */
function cardTemplate(p){
  const st = getStock(p);
  const next = getNextRestock(p);
  const isOut = st<=0;
  const qCl = p.quality==='legendary' ? 'q-legendary' : p.quality==='epic' ? 'q-epic' : p.quality==='rare' ? 'q-rare' : 'q-common';
  const goldCl = p.gold ? 'gold' : '';
  const restockInfo = p.restock ? `<span class="badge">Restock: ${p.restock}</span>` : '';
  const outOverlay = `
    <div class="out-wrap">
      <div class="out-badge">
        <span class="title">AGOTADO</span>
        ${next ? `<span class="restock-time">Reabastece en: ${timeLeft(next)}</span>` : `<span class="sub">Sin fecha de restock</span>`}
      </div>
    </div>`;

  return `
    <article class="card ${goldCl} ${isOut?'out':''}">
      <div class="card-media">
        <img src="${escapeHTML(p.img)}" alt="Imagen de ${escapeHTML(p.name)}" loading="lazy">
        ${isOut ? outOverlay : ''}
      </div>
      <div class="card-body">
        <h3 class="card-title">${escapeHTML(p.name)}</h3>
        <p class="card-desc">${escapeHTML(p.desc)}</p>
        <div class="card-meta">
          <span class="quality"><span class="qdot ${qCl}"></span>${labelQuality(p.quality)}</span>

          <span class="price">${renderPrice(p)}</span>

        </div>
      </div>
      <div class="card-foot">
        <span class="stock">Stock: ${st}</span>
        <div class="actions">
          <button class="btn-sm" data-open="${p.id}">Detalles</button>
          <button class="btn btn-buy" data-buy="${p.id}" ${isOut?'disabled':''}>Comprar</button>
        </div>
      </div>
      <div class="card-foot" style="padding-top:0">
        ${restockInfo}
      </div>
    </article>
  `;
}

function emptyBlock(text){
  return `<div class="card" style="grid-column:1/-1"><div class="card-body"><p class="muted">${escapeHTML(text)}</p></div></div>`;
}

function labelQuality(q){
  if (q==='legendary') return 'Legendario';
  if (q==='epic') return 'Épico';
  if (q==='rare') return 'Raro';
  return 'Común';
}

/* =========================================================
   Búsqueda y filtros
   ========================================================= */
function onChipSection(e){
  const btn = e.target.closest('.chip');
  if (!btn) return;
  $$('.chip', chipSections).forEach(c=> c.classList.remove('is-on'));
  btn.classList.add('is-on');
  filteredSection = btn.dataset.section;
  renderAll();
  toast(`Filtro: ${filteredSection==='all'?'Todo':btn.textContent.trim()}`);
}
function onSearch(){
  searchText = searchInput.value || '';
  renderAll();
}

/* =========================================================
   Modal de producto
   ========================================================= */
function openModal(id){
  const p = products.find(x=> x.id===id);
  if (!p) return;
  currentProduct = p;

  modalTitle.textContent = p.name;

  const st = getStock(p);
  const next = getNextRestock(p);
  const qCl = p.quality==='legendary' ? 'q-legendary' : p.quality==='epic' ? 'q-epic' : p.quality==='rare' ? 'q-rare' : 'q-common';

  modalBody.innerHTML = `
    <div class="modal-hero">
      <div class="media"><img src="${escapeHTML(p.img)}" alt="Imagen de ${escapeHTML(p.name)}"></div>
      <div class="info">
        <h3>${escapeHTML(p.name)}</h3>
        <div class="meta">
          <span class="quality"><span class="qdot ${qCl}"></span>${labelQuality(p.quality)}</span>
          <span>Precio: <b>${fmt.format(p.price)}</b></span>
          <span>Stock: <b>${st}</b></span>
          ${p.restock? `<span>Restock: <b>${p.restock}</b></span>`:''}
        </div>
        <p>${escapeHTML(p.desc)}</p>
        <div class="tags">${p.tags.map(t=>`<span class="badge">#${escapeHTML(t)}</span>`).join(' ')}</div>
      </div>
    </div>

    <div class="modal-grid">
      <div class="modal-block">
        <h4>Detalles</h4>
        <p>Este objeto pertenece a la sección <b>${sectionLabel(p.section)}</b>. Es de calidad <b>${labelQuality(p.quality)}</b> y su precio actual es <b>${fmt.format(p.price)}</b>.</p>
      </div>
      <div class="modal-block">
        <h4>Restock</h4>
        <p>${p.restock ? `Se reabastece automáticamente cada <b>${p.restock}</b>. ${next?`Próximo en <b>${timeLeft(next)}</b>.`:''}` : 'Este artículo no se reabastece automáticamente.'}</p>
      </div>
      <div class="modal-block full">
        <h4>Notas</h4>
        <p>La compra es directa sobre el stock. Si el stock llega a 0, el artículo quedará marcado como <b>Agotado</b> hasta el próximo restock.</p>
      </div>
    </div>
  `;

  modalBuy.disabled = st<=0;
  modal.classList.add('show');
  modal.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
}

function sectionLabel(s){
  return ({
    pases:'Pases de temporada',
    llaves:'Llaves',
    cosas:'Cosas interesantes',
    historia:'Historia',
    materiales:'Materiales',
    eventos:'Pases de evento',
    monedas:'Monedas del juego'
  })[s] || s;
}

function closeModal(){
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
  currentProduct = null;
}

modalOverlay.addEventListener('click', closeModal);
modalClose.addEventListener('click', closeModal);
document.addEventListener('keydown', (e)=>{ if (e.key==='Escape') closeModal(); });

modalBuy.addEventListener('click', ()=>{
  if (!currentProduct) return;
  buyItem(currentProduct.id, { toastMsg:true, keepModal:true });
});

/* =========================================================
   Comprar (sin saldo): descuenta stock y actualiza UI
   ========================================================= */
/* =========================================================
   Comprar (sin saldo): descuenta stock y actualiza UI
   - Si el item es un ticket (id empezando con "t_" o tag 'ticket'), 
     se añadirá el/los ticket(s) a la ruleta correspondiente.
   ========================================================= */
function buyItem(id, opts={}){
  const p = products.find(x=> x.id===id);
  if (!p) return;

  let st = getStock(p);
  if (st<=0){ toast('Artículo agotado'); return; }

  // decrement stock
  st -= 1;
  setStock(p, st);

  // Si se agotó, calcula/asegura próximo restock
  if (st<=0){
    let next = getNextRestock(p);
    if (!next && p.restock) {
      next = computeNextRestock(p);
      setNextRestock(p, next);
    }
  }

  // ---------- NUEVO: detectar si es un producto "ticket" ----------
  // Regla simple y robusta:
  //  - Si el id comienza por "t_<wheelId>" -> otorga 1 ticket a wheelId
  //  - Si el producto tiene tag 'ticket' puedes personalizar (ej. name, desc)
  //  - Puedes ajustar la 'count' si quieres dar >1 tickets por compra
  function detectTicketInfo(product){
    // default: no es ticket
    const info = { isTicket:false, wheelId:null, count:0 };

    // prioridad 1: id con prefijo t_
    if (typeof product.id === 'string' && product.id.startsWith('t_')){
      const parts = product.id.split('_'); // t_classic -> ['t','classic']
      if (parts.length >= 2 && parts[1]) {
        info.isTicket = true;
        //info.wheelId = parts.slice(1).join('_'); // por si usa t_some_wheel
        // Quitar sufijo numérico opcional ( _1 , _2 , _99 , etc. )
let wheel = parts.slice(1).join('_');
wheel = wheel.replace(/_\d+$/, ''); // <-- elimina _1, _2, _3, etc.
info.wheelId = wheel;

        //info.count = 1;
        info.count = product.amount ?? 1;
        return info;
      }
    }

    // prioridad 2: tag 'ticket' -> intentar inferir wheel a partir del nombre
    if (Array.isArray(product.tags) && product.tags.includes('ticket')){
      // intenta extraer wheelId desde name: 'Ticket Ruleta Clásica' -> 'classic'
      const name = (product.name||'').toLowerCase();
      if (name.includes('clásic') || name.includes('classic')) { info.isTicket=true; info.wheelId='classic'; info.count=1; return info; }
      if (name.includes('místic') || name.includes('mystic') || name.includes('mística')) { info.isTicket=true; info.wheelId='mystic'; info.count=1; return info; }
      if (name.includes('elemental')) { info.isTicket=true; info.wheelId='elemental'; info.count=1; return info; }
      // si no se puede inferir, marcar como ticket genérico (no asigna)
      info.isTicket = true;
      info.wheelId = null;
      //info.count = 1;
      info.count = product.amount ?? 1;
      return info;
    }

    return info;
  }

  function awardTicketsToWheel(wheelId, count){
    if (!wheelId) return false;
    // si existe función global addTickets (de tu código de ruleta), úsala
    try {
      if (typeof addTickets === 'function') {
        addTickets(wheelId, count);
      } else {
        // fallback directo a localStorage con la misma clave usada por la ruleta
        const key = `mv_tickets_${wheelId}`;
        const cur = parseInt(localStorage.getItem(key) || '0', 10);
        localStorage.setItem(key, String(Math.max(0, cur + (count|0))));
      }
      // intenta actualizar UI si las funciones renderTicketCounts/renderHUDTickets existen
      if (typeof renderTicketCounts === 'function') try{ renderTicketCounts(); }catch(e){}
      if (typeof renderHUDTickets === 'function') try{ renderHUDTickets(); }catch(e){}
      return true;
    } catch(e){
      console.warn('awardTicketsToWheel error', e);
      return false;
    }
  }

  // detectar ticket y aplicarlo
  const ticketInfo = detectTicketInfo(p);
  if (ticketInfo.isTicket){
    const gave = ticketInfo.wheelId ? awardTicketsToWheel(ticketInfo.wheelId, ticketInfo.count) : false;
    if (gave){
      // mensaje claro según si se reconoció la ruleta
      const displayWheel = ticketInfo.wheelId ? ticketInfo.wheelId : 'ruleta';
      if (opts.toastMsg!==false) toast(`Comprado: ${p.name} — +${ticketInfo.count} ticket(s) para ${displayWheel}`);
    } else {
      if (opts.toastMsg!==false) toast(`Comprado: ${p.name} — Ticket guardado localmente`);
    }
  } else {
    if (opts.toastMsg!==false) toast(`Comprado: ${p.name}`);
  }



  // Si había un cupón aplicado, poner solo ese cupón en cooldown hasta medianoche
if (currentCoupon && currentCoupon !== 0){
  // marcar cooldown (timestamp de la próxima medianoche)
  setCouponCooldown(currentCoupon, nextMidnight());
  // reset selección
  currentCoupon = 0;
  saveCurrentCoupon();
  // actualizar UI de cupones inmediatamente
  renderCouponUI();
}


  // refrescar la tienda
  renderAll();

  // Actualiza modal si está abierto
  if (opts.keepModal && currentProduct && currentProduct.id===id){
    openModal(id);
  }
}



/* =========================================================
   Tiempos amigables
   ========================================================= */
function timeLeft(ts){
  const diff = Math.max(0, ts - now());
  const d = Math.floor(diff / D7); // días en bloques de 7d
  const rD = Math.floor(diff / H24);
  if (d>=1) return `${rD}d`;
  const h = Math.floor((diff % H24) / (60*60*1000));
  const m = Math.floor((diff % (60*60*1000)) / (60*1000));
  if (rD>=1) return `${rD}d ${h}h`;
  if (h>=1) return `${h}h ${m}m`;
  const s = Math.floor((diff % (60*1000))/1000);
  return `${m}m ${s}s`;
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





// ---------- Música de fondo ----------
const audio = document.getElementById("bg-music");
const musicButton = document.querySelector(".floating-music");

// Asegúrate de que el botón y el audio existan
if (audio && musicButton) {
  // Alternar música al hacer clic
  musicButton.addEventListener("click", () => {
    if (audio.paused) {
      audio.play().then(() => {
        musicButton.classList.add("active");
        localStorage.setItem("music", "on");
      }).catch(err => {
        console.warn("No se pudo reproducir la música:", err);
      });
    } else {
      audio.pause();
      musicButton.classList.remove("active");
      localStorage.setItem("music", "off");
    }
  });

  // Revisar estado al cargar
  window.addEventListener("DOMContentLoaded", () => {
    const musicState = localStorage.getItem("music");
    if (musicState === "on") {
      // Solo reproducir si el usuario ya interactuó antes
      audio.play().then(() => {
        musicButton.classList.add("active");
      }).catch(() => {
        console.log("Esperando interacción del usuario para reproducir.");
      });
    }
  });
}















// --- COMPRA DE TICKETS DESDE TIENDA ---
// Recibe: id de ruleta ("classic", "mystic", etc) y cantidad
window.buyTickets = function(wheelId, amount) {
    try {
        addTickets(wheelId, amount); // tu propia función, ya funcional
        toast(`Has recibido ${amount} ticket(s) de la ruleta ${wheelId}`);
    } catch (e) {
        console.error(e);
        toast("Error al entregar los tickets.");
    }
};


















/* ========== SISTEMA CUPONES (INSERTAR EN TIENDA.JS - GLOBALES) ========== */
// Lista de cupones (porcentaje)
const ALL_COUPONS = [10,15,20,25,30,35,40,45,50,60,70,80,90,100];

// estado guardado en localStorage bajo 'mv_coupon_state'
// formato: { "10": 0 | timestamp, "20": 0 | timestamp, ... }
const COUPON_LS_KEY = 'mv_coupon_state';
const CURRENT_COUPON_KEY = 'mv_current_coupon';

function loadCouponState(){
  try { 
    const raw = localStorage.getItem(COUPON_LS_KEY);
    if (!raw) {
      const init = {};
      ALL_COUPONS.forEach(c=> init[String(c)] = 0);
      localStorage.setItem(COUPON_LS_KEY, JSON.stringify(init));
      return init;
    }
    return JSON.parse(raw);
  } catch(e){ 
    const init = {}; ALL_COUPONS.forEach(c=> init[String(c)] = 0); return init;
  }
}
function saveCouponState(state){ localStorage.setItem(COUPON_LS_KEY, JSON.stringify(state)); }

function getCouponCooldown(percent){
  const s = loadCouponState();
  return Number(s[String(percent)] || 0);
}
function setCouponCooldown(percent, ts){
  const s = loadCouponState();
  s[String(percent)] = ts || 0;
  saveCouponState(s);
}

function nextMidnight(){ const d=new Date(); d.setHours(24,0,0,0); return d.getTime(); }

let currentCoupon = Number(localStorage.getItem(CURRENT_COUPON_KEY) || 0); // 0 = sin cupón

function saveCurrentCoupon(){
  localStorage.setItem(CURRENT_COUPON_KEY, String(currentCoupon));
}

/* Render del UI de cupones */
function renderCouponUI(){
  const box = $('#couponList');
  if(!box) return;
  const nowTs = now();

  // auto-liberar cupones vencidos (por si recargas pasada medianoche)
  const state = loadCouponState();
  let dirty=false;
  ALL_COUPONS.forEach(c=>{
    const cd = Number(state[String(c)] || 0);
    if (cd > 0 && cd <= nowTs){ state[String(c)] = 0; dirty=true; }
  });
  if (dirty) saveCouponState(state);

  box.innerHTML = ALL_COUPONS.map(c=>{
    const cd = getCouponCooldown(c);
    const active = cd > nowTs;
    const isSelected = currentCoupon === c;
    if (active){
      return `<button class="coupon-card" aria-disabled="true" data-percent="${c}">
                ${c}% <span class="cd">recargando ${timeLeft(cd)}</span>
              </button>`;
    } else {
      return `<button class="coupon-card" data-percent="${c}" data-active="${isSelected}">
                ${c}% ${isSelected?'<span class="cd">activado</span>':''}
              </button>`;
    }
  }).join('');

  // botón "sin cupón" visual (local)
  const clearBtn = $('#couponClearBtn');
  if (clearBtn) clearBtn.disabled = false;

  // listeners
  box.querySelectorAll('.coupon-card:not([aria-disabled="true"])').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const pct = Number(btn.getAttribute('data-percent'));
      // toggle
      currentCoupon = (currentCoupon === pct) ? 0 : pct;
      saveCurrentCoupon();
      renderCouponUI();
      renderAll(); // re-render precios
    });
  });
}
setInterval(()=> { renderCouponUI(); }, 1000); // actualiza contadores cada 1s

// boton "no usar cupón"
document.addEventListener('click',(e)=>{
  if (e.target && e.target.id === 'couponClearBtn'){
    currentCoupon = 0; saveCurrentCoupon(); renderCouponUI(); renderAll();
  }
});

/* función que devuelve HTML del precio (usar en cardTemplate) */
/*function renderPrice(p){
  // p puede ser objeto producto o precio numérico; preferimos objeto para acceder a p.price
  const base = (typeof p === 'object' && p.price != null) ? Number(p.price) : Number(p);
  if (!currentCoupon || currentCoupon === 0) {
    return `${fmt.format(base)}`;
  }
  const discount = Number(currentCoupon);
  const finalPrice = Math.max(0, base - (base * (discount / 100)));
  return `<span class="old-price">${fmt.format(base)}</span><span class="new-price">${fmt.format(finalPrice)}</span>`;
}*/


/* función que devuelve HTML del precio (usar en cardTemplate) */
function renderPrice(p){
  const base = (typeof p === 'object' && p.price != null) ? Number(p.price) : Number(p);

  if (!currentCoupon || currentCoupon === 0) {
    return `${fmt.format(base)}`;
  }

  const discount = Number(currentCoupon);
  let finalPrice = base - (base * (discount / 100));

  // 🔥 convertimos a número entero sin decimales:
  finalPrice = Math.round(finalPrice);

  // nunca permitir negativos
  finalPrice = Math.max(0, finalPrice);

  return `
    <span class="old-price">${fmt.format(base)}</span>
    <span class="new-price">${fmt.format(finalPrice)}</span>
  `;
}

