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
  { id:'s1', name:'Pase Lamento — Temporada I', img:'img-pass/banwar.jpg', quality:'legendary', price:128, stock:1,  restock:null, section:'pases', gold:true,  desc:'Desbloquea recompensas de la temporada de Septiembre.', tags:['pase','cosmético','reto'] },
  { id:'s2', name:'Pase Alma — Temporada II', img:'img-pass/banhall.jpg', quality:'legendary', price:128,  stock:1, restock:null, section:'pases', gold:true, desc:'Desbloquea recompensas de la temporada de Octubre.', tags:['pase','acelerado'] },
  { id:'s3', name:'Pase 404 — Temporada III', img:'img-pass/partymine.jpg', quality:'legendary', price:128, stock:1, restock:null, section:'pases', gold:true, desc:'Desbloquea recompensas de la temporada de Noviembre.', tags:['pase','xp'] },
  { id:'s4', name:'Pase Árboreo — Temporada IV', img:'img-pass/chrismine.jpg', quality:'legendary', price:128, stock:1, restock:null, section:'pases', gold:true, desc:'Desbloquea recompensas de la temporada de Diciembre.', tags:['pase','xp'] },
  { id:'s5', name:'Pase Resurge — Temporada V', img:'img-pass/añomine.jpg', quality:'legendary', price:128, stock:1, restock:null, section:'pases', gold:true, desc:'Desbloquea recompensas de la temporada de Enero.', tags:['pase','xp'] },
  { id:'s6', name:'Pase Carbón — Temporada VI', img:'img-pass/banair.jpg', quality:'legendary', price:128, stock:1, restock:null, section:'pases', gold:true, desc:'Desbloquea recompensas de la temporada de Febrero.', tags:['pase','xp'] },
  { id:'s7', name:'Pase Carbón — Temporada VII', img:'img-pass/dancingmine.jpg', quality:'legendary', price:128, stock:1, restock:null, section:'pases', gold:true, desc:'Desbloquea recompensas de la temporada de Marzo.', tags:['pase','xp'] },
  { id:'s8', name:'Pase Carbón — Temporada VIII', img:'img-pass/squemine.jpg', quality:'legendary', price:128, stock:1, restock:null, section:'pases', gold:true, desc:'Desbloquea recompensas de la temporada de Abril.', tags:['pase','xp'] },

  /* ===== LLAVES ===== común*/
  { id:'k1', name:'Cofre de Ambar', img:'img/chest2.gif', quality:'epic', price:30,  stock:10, restock:'7d', section:'llaves', gold:false, desc:'Abre este cofre de Ambar.', tags:['cofre','epico'] },
  { id:'k2', name:'Cofre de Sueños', img:'img/chest2.gif', quality:'epic', price:30, stock:10, restock:'7d', section:'llaves', gold:false, desc:'Abre este cofre de los Sueños que algunas vez hubo...', tags:['cofre','epico'] },
  { id:'k3', name:'Cofre de Moonveil', img:'img/chest2.gif', quality:'legendary', price:10, stock:10, restock:'7d', section:'llaves', gold:true, desc:'Abre este cofre Moon-Veil.', tags:['cofre','legendario'] },
  { id:'k4', name:'Cofre de Moonveil II', img:'img/chest2.gif', quality:'legendary', price:30, stock:5, restock:'7d', section:'llaves', gold:true, desc:'Abre este cofre Moon por ████.', tags:['cofre','█████'] },

  /* ===== COSAS INTERESANTES ===== */
  { id:'f1', name:'Rieles (x64)', img:'imagen/phantom.gif', quality:'epic', price:64, stock:10, restock:'24h', section:'cosas', gold:false, desc:'Unos rieles que siempre vienen bien.', tags:['Rieles'] },
  { id:'f2', name:'Rieles Activadores (x64)', img:'imagen/phantom.gif', quality:'epic', price:128, stock:10, restock:'24h', section:'cosas', gold:false, desc:'Activemos estos rieles...', tags:['Rieles','velocidad'] },
  { id:'f3', name:'Rieles (x64) x2', img:'imagen/phantom.gif', quality:'epic', price:64, stock:2, restock:'7d', section:'cosas', gold:true, desc:'Un x2 en rieles, ¡guau! y con Descuento!!', tags:['Rieles'] },
  { id:'f4', name:'Concreto (x64)', img:'imagen/phantom.gif', quality:'epic', price:64, stock:20, restock:'24h', section:'cosas', gold:false, desc:'Para construir', tags:['Concreto','construccion'] },
  { id:'f5', name:'Bloques de Hierro (x64)', img:'imagen/phantom.gif', quality:'epic', price:128, stock:10, restock:'7d', section:'cosas', gold:false, desc:'Algunos bloques...', tags:['Bloques'] },
  { id:'f6', name:'Bloques de Hierro (x64) x4', img:'imagen/phantom.gif', quality:'legendary', price:128, stock:1, restock:null, section:'cosas', gold:true, desc:'Oferta y demanda, ¿seguro?', tags:['Bloques','Oferta'] },
  { id:'f7', name:'Bloques de Diamante (x64) x4', img:'imagen/phantom.gif', quality:'legendary', price:128, stock:1, restock:null, section:'cosas', gold:true, desc:'Bueno brillemos...', tags:['Bloques','Oferta'] },
  { id:'f8', name:'Esmeralda x1', img:'imagen/phantom.gif', quality:'legendary', price:1, stock:1, restock:null, section:'cosas', gold:true, desc:'Sand Brill, te desae una ¡Gran Navidad!, pero es tan tacaño que no da mas de 1 esmeralda...', tags:['Sand','Brill'] },

  /* ===== HISTORIA ===== */
  { id:'l1', name:'Libro: “Bosque de Jade”', img:'img/bookmine.jpg', quality:'rare', price:256, stock:1, restock:null, section:'historia', gold:false, desc:'Leyendas de...', tags:['lore','bioma'] },
  { id:'l2', name:'Libro: “La Negra Noche”', img:'img/bookmine.jpg', quality:'epic', price:256, stock:1, restock:null, section:'historia', gold:false, desc:'Símbolos...', tags:['runas','forja'] },
  { id:'l3', name:'Libro: “El lado ███ de S██ B███”', img:'img/bookcat.gif', quality:'legendary', price:384, stock:1, restock:null, section:'historia', gold:true, desc:'█████████.', tags:['reliquia','desierto'] },
  { id:'l4', name:'Libro A1', img:'img/book.jpg', quality:'epic', price:128, stock:1, restock:null, section:'historia', gold:false, desc:'Un libro.', tags:['libro','lectura'] },
  { id:'l5', name:'Libro B2', img:'img/book.jpg', quality:'epic', price:128, stock:1, restock:null, section:'historia', gold:false, desc:'Un libro.', tags:['libro','lectura'] },
  { id:'l6', name:'Libro A2', img:'img/book.jpg', quality:'epic', price:128, stock:1, restock:null, section:'historia', gold:false, desc:'Un libro.', tags:['libro','lectura'] },
  { id:'l7', name:'Libro C3', img:'img/book.jpg', quality:'epic', price:128, stock:1, restock:null, section:'historia', gold:false, desc:'Un libro.', tags:['libro','lectura'] },

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
  //{ id:'t_mystic_1', name:'Ticket Halloween', img:'imagen/ticket5.jpg', quality:'epic', price:10, stock:10, restock:'24h',  amount:1, section:'tickets', gold:false, desc:'Ticket para la ruleta', tags:['ticket','Halloween'] },
  { id:'t_elemental_1', name:'Ticket 1 de Cobre', img:'imagen/ticket5.jpg', quality:'epic', price:10, stock:10, restock:'24h',  amount:1, section:'tickets', gold:false, desc:'Ticket para la ruleta', tags:['ticket','elemental'] },
  { id:'t_event_1', name:'Ticket evento', img:'imagen/ticket5.jpg', quality:'epic', price:10, stock:10, restock:'24h',  amount:1, section:'tickets', gold:false, desc:'Ticket para la ruleta', tags:['ticket','evento'] },
  { id:'t_classic_2', name:'Ticket Clasico', img:'imagen/ticket5.jpg', quality:'epic', price:30,  stock:10, restock:'24h', amount:5 , section:'tickets', gold:false, desc:'Ticket para la ruleta x5', tags:['ticket','clasico'] },
  //{ id:'t_mystic_2', name:'Ticket Halloween', img:'imagen/ticket5.jpg', quality:'epic', price:30, stock:10, restock:'24h',  amount:5, section:'tickets', gold:false, desc:'Ticket para la ruleta x5', tags:['ticket','Halloween'] },
  { id:'t_elemental_2', name:'Ticket 1 de Cobre', img:'imagen/ticket5.jpg', quality:'epic', price:30, stock:10, restock:'24h',  amount:5, section:'tickets', gold:false, desc:'Ticket para la ruleta x5', tags:['ticket','elemental'] },
  { id:'t_event_2', name:'Ticket evento', img:'imagen/ticket5.jpg', quality:'epic', price:30, stock:10, restock:'24h',  amount:5, section:'tickets', gold:false, desc:'Ticket para la ruleta x5', tags:['ticket','evento'] },
  { id:'t_classic_3', name:'Bienvenida a los tickets!!', img:'imagen/ticket5.jpg', quality:'epic', price:0,  stock:1, restock:null, amount:10 , section:'tickets', gold:true, desc:'Ticket para la ruleta clasica x10', tags:['ticket','clasico'] },
  { id:'t_classic_4', name:'Tiros Gratis!!', img:'imagen/ticket5.jpg', quality:'epic', price:0,  stock:1, restock:'30d', amount:10 , section:'tickets', gold:true, desc:'Ticket para la ruleta clasica x10', tags:['ticket','clasico'] },
  { id:'t_elemental_3', name:'Ticket 1 de Cobre', img:'imagen/ticket5.jpg', quality:'epic', price:10, stock:1, restock:null,  amount:5, section:'tickets', gold:false, desc:'Ticket para la ruleta x5', tags:['ticket','elemental'] },
  { id:'t_elemental_4', name:'Ticket 1 de Cobre', img:'imagen/ticket5.jpg', quality:'epic', price:1, stock:1, restock:null,  amount:1, section:'tickets', gold:false, desc:'Ticket para la ruleta x1', tags:['ticket','elemental'] },

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
const ALL_COUPONS = [10,15,20,25,30,40,50,60,70,80,90,100];

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














/* ═══════════════════════════════════════════════════════════
   🎨 SISTEMA DE DECORACIONES FESTIVAS PREMIUM v2.0
   JavaScript con arquitectura profesional
   ════════════════════════════════════════════════════════════ */

'use strict';

// ═══════════════════════════════════════════════════════════
// 🎯 CONFIGURACIÓN GLOBAL Y CONSTANTES
// ═══════════════════════════════════════════════════════════

const FESTIVE_CONFIG = {
  // Festividades con fechas y prioridades
  NUEVO_ANO: {
    id: 'NUEVO_ANO',
    inicio: new Date('2025-12-31T00:00:00'),
    fin: new Date('2026-01-06T23:59:59'),
    prioridad: 100,
    nombre: 'Año Nuevo'
  },
  SAN_VALENTIN: {
    id: 'SAN_VALENTIN',
    inicio: new Date('2026-02-13T00:00:00'),
    fin: new Date('2026-02-15T23:59:59'),
    prioridad: 95,
    nombre: 'San Valentín'
  },
  CARNAVAL: {
    id: 'CARNAVAL',
    inicio: new Date('2026-02-10T00:00:00'),
    fin: new Date('2026-02-27T23:59:59'),
    prioridad: 90,
    nombre: 'Carnaval'
  },
  DIA_GATO: {
    id: 'DIA_GATO',
    inicio: new Date('2026-02-10T00:00:00'),
    fin: new Date('2026-02-20T23:59:59'),
    prioridad: 70,
    nombre: 'Día del Gato'
  },
  SAN_PATRICIO: {
    id: 'SAN_PATRICIO',
    inicio: new Date('2026-03-15T00:00:00'),
    fin: new Date('2026-03-18T23:59:59'),
    prioridad: 80,
    nombre: 'San Patricio'
  },
  PASCUA: {
    id: 'PASCUA',
    inicio: new Date('2026-04-03T00:00:00'),
    fin: new Date('2026-04-06T23:59:59'),
    prioridad: 85,
    nombre: 'Pascua'
  },
  DIA_MADRE: {
    id: 'DIA_MADRE',
    inicio: new Date('2026-05-08T00:00:00'),
    fin: new Date('2026-05-11T23:59:59'),
    prioridad: 75,
    nombre: 'Día de la Madre'
  },
  DIA_PADRE: {
    id: 'DIA_PADRE',
    inicio: new Date('2026-06-19T00:00:00'),
    fin: new Date('2026-06-22T23:59:59'),
    prioridad: 75,
    nombre: 'Día del Padre'
  },
  HALLOWEEN: {
    id: 'HALLOWEEN',
    inicio: new Date('2026-10-25T00:00:00'),
    fin: new Date('2026-11-01T23:59:59'),
    prioridad: 95,
    nombre: 'Halloween'
  },
  DIA_MUERTOS: {
    id: 'DIA_MUERTOS',
    inicio: new Date('2026-11-01T00:00:00'),
    fin: new Date('2026-11-03T23:59:59'),
    prioridad: 90,
    nombre: 'Día de Muertos'
  },
  NAVIDAD: {
    id: 'NAVIDAD',
    inicio: new Date('2026-12-01T00:00:00'),
    fin: new Date('2026-12-30T23:59:59'),
    prioridad: 100,
    nombre: 'Navidad'
  },
  PRIMAVERA: {
    id: 'PRIMAVERA',
    inicio: new Date('2026-03-20T00:00:00'),
    fin: new Date('2026-06-20T23:59:59'),
    prioridad: 10,
    nombre: 'Primavera'
  },
  VERANO: {
    id: 'VERANO',
    inicio: new Date('2026-06-21T00:00:00'),
    fin: new Date('2026-09-22T23:59:59'),
    prioridad: 10,
    nombre: 'Verano'
  },
  OTONO: {
    id: 'OTONO',
    inicio: new Date('2026-09-23T00:00:00'),
    fin: new Date('2026-12-20T23:59:59'),
    prioridad: 10,
    nombre: 'Otoño'
  }
};

// Paletas de colores profesionales
const COLOR_PALETTES = {
  NUEVO_ANO: ['#FFD700', '#FF1744', '#2196F3', '#4CAF50', '#FF6B9D', '#9C27B0', '#00BCD4', '#FF5722'],
  SAN_VALENTIN: ['#FF1493', '#FF69B4', '#DC143C', '#FF6B9D', '#FF1A66', '#FF80AB', '#C71585'],
  CARNAVAL: ['#FF3B30', '#FF9500', '#FFCC00', '#4CD964', '#007AFF', '#5856D6', '#FF2D55', '#5AC8FA'],
  SAN_PATRICIO: ['#00FF00', '#32CD32', '#228B22', '#90EE90', '#00FA9A', '#7FFF00'],
  HALLOWEEN: ['#FF6600', '#8B00FF', '#FF4500', '#9932CC', '#FF8C00', '#9400D3'],
  NAVIDAD: ['#C41E3A', '#0F8B3E', '#FFD700', '#FFFFFF', '#CD2626', '#228B22']
};

// ═══════════════════════════════════════════════════════════
// 🏗️ CLASE BASE PARA GESTIÓN DE FESTIVIDADES
// ═══════════════════════════════════════════════════════════

class FestividadManager {
  constructor() {
    this.intervalosActivos = new Map();
    this.elementosActivos = new Set();
    this.festivaActual = null;
    this.maxElementosPorFestividad = 200;
  }

  estaActiva(config) {
    const ahora = new Date();
    return ahora >= config.inicio && ahora <= config.fin;
  }

  obtenerFestivaActual() {
    const festivas = Object.values(FESTIVE_CONFIG)
      .filter(config => this.estaActiva(config))
      .sort((a, b) => b.prioridad - a.prioridad);
    
    return festivas.length > 0 ? festivas[0] : null;
  }

  limpiarElemento(elemento, tiempo = 0) {
    setTimeout(() => {
      try {
        if (elemento && elemento.parentNode) {
          elemento.remove();
          this.elementosActivos.delete(elemento);
        }
      } catch (e) {
        console.warn('Error al limpiar elemento:', e);
      }
    }, tiempo);
  }

  detenerTodo() {
    this.intervalosActivos.forEach(intervalo => clearInterval(intervalo));
    this.intervalosActivos.clear();
    this.elementosActivos.forEach(elemento => {
      try { elemento.remove(); } catch (e) {}
    });
    this.elementosActivos.clear();
  }

  random(min, max) {
    return Math.random() * (max - min) + min;
  }

  randomInt(min, max) {
    return Math.floor(this.random(min, max));
  }

  randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
}

// ═══════════════════════════════════════════════════════════
// 🎆 AÑO NUEVO - SISTEMA AVANZADO DE FUEGOS ARTIFICIALES
// ═══════════════════════════════════════════════════════════

class AnoNuevoManager extends FestividadManager {
  constructor() {
    super();
    this.containerId = 'newyear-fireworks';
  }

  iniciar() {
    if (!this.estaActiva(FESTIVE_CONFIG.NUEVO_ANO)) return;
    if (this.intervalosActivos.has('principal')) return;

    const container = document.getElementById(this.containerId);
    if (!container) return;

    // Ráfaga inicial
    for (let i = 0; i < 5; i++) {
      setTimeout(() => this.lanzarCohete(), i * 500);
    }

    // Ráfaga continua
    const intervalo = setInterval(() => {
      if (this.elementosActivos.size < this.maxElementosPorFestividad) {
        this.lanzarCohete();
      }
    }, 1000 + Math.random() * 600);

    this.intervalosActivos.set('principal', intervalo);
  }

  lanzarCohete() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const cohete = document.createElement('div');
    cohete.className = 'newyear-rocket festive-element';
    
    const color = this.randomChoice(COLOR_PALETTES.NUEVO_ANO);
    cohete.style.color = color;
    cohete.style.left = this.random(10, 90) + 'vw';
    cohete.style.width = this.random(8, 14) + 'px';
    cohete.style.height = this.random(25, 40) + 'px';
    cohete.style.animationDuration = this.random(1.2, 2) + 's';

    container.appendChild(cohete);
    this.elementosActivos.add(cohete);

    cohete.addEventListener('animationend', () => {
      const rect = cohete.getBoundingClientRect();
      this.crearExplosion(rect.left + rect.width / 2, rect.top + rect.height / 2, color);
      this.limpiarElemento(cohete);
    });

    this.limpiarElemento(cohete, 3000);
  }

  crearExplosion(x, y, color) {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const numParticulas = this.randomInt(50, 80);
    const numTrails = this.randomInt(8, 15);

    // Partículas principales
    for (let i = 0; i < numParticulas; i++) {
      const particula = document.createElement('div');
      particula.className = 'newyear-burst festive-element';
      
      const colorParticula = Math.random() > 0.7 ? 
        this.randomChoice(COLOR_PALETTES.NUEVO_ANO) : color;
      
      particula.style.background = colorParticula;
      particula.style.color = colorParticula;
      particula.style.left = x + 'px';
      particula.style.top = y + 'px';
      particula.style.width = this.random(4, 10) + 'px';
      particula.style.height = this.random(4, 10) + 'px';
      
      const angulo = (Math.PI * 2 * i) / numParticulas + this.random(-0.2, 0.2);
      const distancia = this.random(70, 150);
      particula.style.setProperty('--dx', Math.cos(angulo) * distancia + 'px');
      particula.style.setProperty('--dy', Math.sin(angulo) * distancia + 'px');
      particula.style.animationDuration = this.random(0.8, 1.4) + 's';
      
      container.appendChild(particula);
      this.elementosActivos.add(particula);
      this.limpiarElemento(particula, 1600);
    }

    // Trails de estela
    for (let i = 0; i < numTrails; i++) {
      const trail = document.createElement('div');
      trail.className = 'newyear-trail festive-element';
      trail.style.background = color;
      trail.style.color = color;
      trail.style.left = x + 'px';
      trail.style.top = y + 'px';
      
      const angulo = (Math.PI * 2 * i) / numTrails;
      trail.style.setProperty('--dy', Math.sin(angulo) * 30 + 'px');
      trail.style.animationDuration = this.random(0.6, 1) + 's';
      
      container.appendChild(trail);
      this.elementosActivos.add(trail);
      this.limpiarElemento(trail, 1200);
    }

    // Texto del año
    const texto = document.createElement('span');
    texto.className = 'newyear-year-text festive-element';
    texto.style.left = x + 'px';
    texto.style.top = y + 'px';
    texto.textContent = '2026';
    
    container.appendChild(texto);
    this.elementosActivos.add(texto);
    this.limpiarElemento(texto, 2000);
  }
}

// ═══════════════════════════════════════════════════════════
// 💕 SAN VALENTÍN - SISTEMA ROMÁNTICO AVANZADO
// ═══════════════════════════════════════════════════════════

class SanValentinManager extends FestividadManager {
  constructor() {
    super();
    this.elementos = ['🌹', '❤️', '💗', '💖', '💕', '🌷', '💞', '💝', '💘', '🌺'];
    this.corazones = ['❤️', '💖', '💗', '💕'];
  }

  iniciar() {
    if (!this.estaActiva(FESTIVE_CONFIG.SAN_VALENTIN)) return;
    if (this.intervalosActivos.has('petalos')) return;

    // Sistema de pétalos
    const containerPetalos = document.getElementById('valentine-petals');
    if (containerPetalos) {
      for (let i = 0; i < 30; i++) {
        setTimeout(() => this.crearPetalo(), i * 200);
      }
      
      const intervaloPetalos = setInterval(() => {
        if (this.elementosActivos.size < this.maxElementosPorFestividad) {
          this.crearPetalo();
        }
      }, 350);
      
      this.intervalosActivos.set('petalos', intervaloPetalos);
    }

    // Sistema de corazones flotantes
    const containerCorazones = document.getElementById('valentine-hearts');
    if (containerCorazones) {
      for (let i = 0; i < 6; i++) {
        setTimeout(() => this.crearCorazonFlotante(), i * 700);
      }
      
      const intervaloCorazones = setInterval(() => {
        if (this.elementosActivos.size < this.maxElementosPorFestividad) {
          this.crearCorazonFlotante();
        }
      }, 1600 + Math.random() * 800);
      
      this.intervalosActivos.set('corazones', intervaloCorazones);
    }
  }

  crearPetalo() {
    const container = document.getElementById('valentine-petals');
    if (!container) return;

    const petalo = document.createElement('div');
    petalo.className = 'valentine-rose-petal festive-element';
    petalo.textContent = this.randomChoice(this.elementos);
    petalo.style.left = this.random(0, 100) + '%';
    petalo.style.fontSize = this.random(18, 32) + 'px';
    
    // Variables CSS personalizadas para animación compleja
    petalo.style.setProperty('--swing-1', this.random(-80, 80) + 'px');
    petalo.style.setProperty('--swing-2', this.random(-100, 100) + 'px');
    petalo.style.setProperty('--swing-3', this.random(-60, 60) + 'px');
    petalo.style.setProperty('--rotate-1', this.random(-90, 90) + 'deg');
    petalo.style.setProperty('--rotate-2', this.random(-180, 180) + 'deg');
    petalo.style.setProperty('--rotate-3', this.random(-270, 270) + 'deg');
    
    const duracion = this.random(10, 16);
    petalo.style.animationDuration = duracion + 's';
    
    container.appendChild(petalo);
    this.elementosActivos.add(petalo);
    this.limpiarElemento(petalo, duracion * 1000 + 500);
  }

  crearCorazonFlotante() {
    const container = document.getElementById('valentine-hearts');
    if (!container) return;

    const corazon = document.createElement('div');
    corazon.className = 'valentine-heart-float festive-element';
    const color = this.randomChoice(COLOR_PALETTES.SAN_VALENTIN);
    corazon.style.color = color;
    corazon.textContent = this.randomChoice(this.corazones);
    corazon.style.fontSize = this.random(32, 56) + 'px';
    corazon.style.left = this.random(5, 90) + 'vw';
    
    corazon.style.setProperty('--swing-x', this.random(-80, 80) + 'px');
    corazon.style.setProperty('--swing-x-2', this.random(-100, 100) + 'px');
    corazon.style.setProperty('--rotate-angle', this.random(-30, 30) + 'deg');
    corazon.style.setProperty('--rotate-angle-2', this.random(-45, 45) + 'deg');
    corazon.style.setProperty('--rotate-final', this.random(-360, 360) + 'deg');
    
    const duracion = this.random(4, 6);
    corazon.style.animationDuration = duracion + 's';
    
    container.appendChild(corazon);
    this.elementosActivos.add(corazon);

    setTimeout(() => {
      const rect = corazon.getBoundingClientRect();
      this.crearParticulasAmor(rect.left + rect.width / 2, rect.top + rect.height / 2, color);
      this.mostrarTextoRomantico(rect.left + rect.width / 2, rect.top + rect.height / 2, color);
      this.limpiarElemento(corazon);
    }, duracion * 1000);
  }

  crearParticulasAmor(x, y, color) {
    const container = document.getElementById('valentine-hearts');
    if (!container) return;

    const particulasEmojis = ['💖', '💕', '💓', '💘', '💝', '✨', '💗'];
    const numParticulas = this.randomInt(12, 20);

    for (let i = 0; i < numParticulas; i++) {
      const particula = document.createElement('div');
      particula.className = 'valentine-particle-love festive-element';
      particula.textContent = this.randomChoice(particulasEmojis);
      particula.style.fontSize = this.random(14, 24) + 'px';
      particula.style.left = x + 'px';
      particula.style.top = y + 'px';
      
      const angulo = (Math.PI * 2 * i) / numParticulas + this.random(-0.3, 0.3);
      const distancia = this.random(60, 120);
      particula.style.setProperty('--px', Math.cos(angulo) * distancia + 'px');
      particula.style.setProperty('--py', Math.sin(angulo) * distancia + 'px');
      particula.style.setProperty('--pr', this.random(-360, 360) + 'deg');
      particula.style.animationDuration = this.random(1.5, 2.3) + 's';
      
      container.appendChild(particula);
      this.elementosActivos.add(particula);
      this.limpiarElemento(particula, 2500);
    }
  }

  mostrarTextoRomantico(x, y, color) {
    const container = document.getElementById('valentine-hearts');
    if (!container) return;

    const textos = [
      'Te Amo', 'Amor Eterno', 'Mi Vida', 'Besos', 'Cariño',
      'Eres Todo', 'Amor Mío', 'Mi Cielo', 'Forever', 'Juntos'
    ];
    
    const texto = document.createElement('span');
    texto.className = 'valentine-love-text festive-element';
    texto.style.color = color;
    texto.style.left = x + 'px';
    texto.style.top = y + 'px';
    texto.textContent = this.randomChoice(textos);
    
    container.appendChild(texto);
    this.elementosActivos.add(texto);
    this.limpiarElemento(texto, 2200);
  }
}

// ═══════════════════════════════════════════════════════════
// 🐱 DÍA DEL GATO - ANIMACIÓN REALISTA
// ═══════════════════════════════════════════════════════════

class DiaGatoManager extends FestividadManager {
  constructor() {
    super();
    this.gatos = ['🐱', '😺', '😸', '😹', '😻', '🐈', '😼', '😽'];
  }

  iniciar() {
    if (!this.estaActiva(FESTIVE_CONFIG.DIA_GATO)) return;
    if (this.intervalosActivos.has('principal')) return;

    const container = document.getElementById('catday-ground');
    if (!container) return;

    for (let i = 0; i < 10; i++) {
      setTimeout(() => this.crearGato(), i * 1200);
    }

    const intervalo = setInterval(() => {
      if (this.elementosActivos.size < 20) {
        this.crearGato();
      }
    }, 2500 + Math.random() * 1500);

    this.intervalosActivos.set('principal', intervalo);
  }

  crearGato() {
    const container = document.getElementById('catday-ground');
    if (!container) return;

    const gato = document.createElement('div');
    gato.className = 'catday-walking festive-element';
    gato.textContent = this.randomChoice(this.gatos);
    gato.style.fontSize = this.random(35, 60) + 'px';
    gato.style.bottom = this.random(5, 35) + 'vh';
    
    const duracion = this.random(7, 11);
    gato.style.animationDuration = duracion + 's';
    
    container.appendChild(gato);
    this.elementosActivos.add(gato);
    this.limpiarElemento(gato, duracion * 1000 + 500);

    // Huellas de patas opcionales
    if (Math.random() > 0.6) {
      this.crearHuellas(gato, duracion);
    }
  }

  crearHuellas(gatoElement, duracion) {
    const container = document.getElementById('catday-ground');
    if (!container) return;

    const numHuellas = this.randomInt(8, 15);
    const intervaloHuellas = (duracion * 1000) / numHuellas;

    for (let i = 0; i < numHuellas; i++) {
      setTimeout(() => {
        const huella = document.createElement('div');
        huella.className = 'catday-paw-print festive-element';
        huella.textContent = '🐾';
        huella.style.fontSize = this.random(12, 20) + 'px';
        
        const rect = gatoElement.getBoundingClientRect();
        huella.style.left = rect.left + 'px';
        huella.style.bottom = gatoElement.style.bottom;
        
        container.appendChild(huella);
        this.elementosActivos.add(huella);
        this.limpiarElemento(huella, 3000);
      }, i * intervaloHuellas);
    }
  }
}

// ═══════════════════════════════════════════════════════════
// 🍀 SAN PATRICIO - MAGIA CELTA
// ═══════════════════════════════════════════════════════════

class SanPatricioManager extends FestividadManager {
  constructor() {
    super();
    this.elementos = ['🍀', '☘️', '💚'];
  }

  iniciar() {
    if (!this.estaActiva(FESTIVE_CONFIG.SAN_PATRICIO)) return;
    if (this.intervalosActivos.has('principal')) return;

    const container = document.getElementById('stpatrick-clovers');
    if (!container) return;

    for (let i = 0; i < 25; i++) {
      setTimeout(() => this.crearTrebol(), i * 250);
    }

    const intervalo = setInterval(() => {
      if (this.elementosActivos.size < this.maxElementosPorFestividad) {
        this.crearTrebol();
      }
    }, 450);

    this.intervalosActivos.set('principal', intervalo);

    // Arcoíris ocasionales
    setInterval(() => {
      if (Math.random() > 0.7) {
        this.crearArcoiris();
      }
    }, 5000);
  }

  crearTrebol() {
    const container = document.getElementById('stpatrick-clovers');
    if (!container) return;

    const trebol = document.createElement('div');
    trebol.className = 'stpatrick-clover festive-element';
    trebol.textContent = this.randomChoice(this.elementos);
    trebol.style.left = this.random(0, 100) + '%';
    trebol.style.fontSize = this.random(20, 36) + 'px';
    
    trebol.style.setProperty('--swing-a', this.random(-90, 90) + 'px');
    trebol.style.setProperty('--swing-b', this.random(-110, 110) + 'px');
    trebol.style.setProperty('--swing-c', this.random(-70, 70) + 'px');
    trebol.style.setProperty('--rotate-a', this.random(-120, 120) + 'deg');
    trebol.style.setProperty('--rotate-b', this.random(-240, 240) + 'deg');
    trebol.style.setProperty('--rotate-c', this.random(-360, 360) + 'deg');
    
    const duracion = this.random(9, 14);
    trebol.style.animationDuration = duracion + 's';
    
    container.appendChild(trebol);
    this.elementosActivos.add(trebol);
    this.limpiarElemento(trebol, duracion * 1000 + 500);
  }

  crearArcoiris() {
    const container = document.getElementById('stpatrick-clovers');
    if (!container) return;

    const arcoiris = document.createElement('div');
    arcoiris.className = 'stpatrick-rainbow festive-element';
    arcoiris.textContent = '🌈';
    arcoiris.style.bottom = '0';
    arcoiris.style.left = this.random(-10, 10) + 'vw';
    
    container.appendChild(arcoiris);
    this.elementosActivos.add(arcoiris);
    this.limpiarElemento(arcoiris, 3000);
  }
}

// ═══════════════════════════════════════════════════════════
// 🐰 PASCUA - PRIMAVERA MÁGICA
// ═══════════════════════════════════════════════════════════

class PascuaManager extends FestividadManager {
  constructor() {
    super();
    this.elementos = ['🐰', '🥚', '🐣', '🐤', '🌷', '🌸', '🐇', '🌺'];
  }

  iniciar() {
    if (!this.estaActiva(FESTIVE_CONFIG.PASCUA)) return;
    if (this.intervalosActivos.has('principal')) return;

    const container = document.getElementById('easter-elements');
    if (!container) return;

    for (let i = 0; i < 22; i++) {
      setTimeout(() => this.crearElemento(), i * 300);
    }

    const intervalo = setInterval(() => {
      if (this.elementosActivos.size < this.maxElementosPorFestividad) {
        this.crearElemento();
      }
    }, 500);

    this.intervalosActivos.set('principal', intervalo);
  }

  crearElemento() {
    const container = document.getElementById('easter-elements');
    if (!container) return;

    const elemento = document.createElement('div');
    elemento.className = 'easter-bouncing festive-element';
    elemento.textContent = this.randomChoice(this.elementos);
    elemento.style.left = this.random(0, 100) + '%';
    elemento.style.fontSize = this.random(20, 34) + 'px';
    
    // Variables para efecto de rebote
    elemento.style.setProperty('--bounce-y-1', this.random(15, 25) + 'vh');
    elemento.style.setProperty('--bounce-y-2', this.random(40, 50) + 'vh');
    elemento.style.setProperty('--bounce-x-1', this.random(-30, 30) + 'px');
    elemento.style.setProperty('--bounce-x-2', this.random(-50, 50) + 'px');
    elemento.style.setProperty('--bounce-r-1', this.random(-45, 45) + 'deg');
    elemento.style.setProperty('--bounce-r-2', this.random(-90, 90) + 'deg');
    elemento.style.setProperty('--final-x', this.random(-40, 40) + 'px');
    elemento.style.setProperty('--final-r', this.random(-180, 180) + 'deg');
    
    const duracion = this.random(8, 12);
    elemento.style.animationDuration = duracion + 's';
    
    container.appendChild(elemento);
    this.elementosActivos.add(elemento);
    this.limpiarElemento(elemento, duracion * 1000 + 500);
  }
}

// ═══════════════════════════════════════════════════════════
// 🌹 DÍA DE LA MADRE - ELEGANCIA FLORAL
// ═══════════════════════════════════════════════════════════

class DiaMadreManager extends FestividadManager {
  constructor() {
    super();
    this.flores = ['🌹', '🌺', '🌸', '🌻', '🌷', '💐', '🌼', '🏵️'];
  }

  iniciar() {
    if (!this.estaActiva(FESTIVE_CONFIG.DIA_MADRE)) return;
    if (this.intervalosActivos.has('principal')) return;

    const container = document.getElementById('mothersday-flowers');
    if (!container) return;

    for (let i = 0; i < 28; i++) {
      setTimeout(() => this.crearFlor(), i * 250);
    }

    const intervalo = setInterval(() => {
      if (this.elementosActivos.size < this.maxElementosPorFestividad) {
        this.crearFlor();
      }
    }, 380);

    this.intervalosActivos.set('principal', intervalo);
  }

  crearFlor() {
    const container = document.getElementById('mothersday-flowers');
    if (!container) return;

    const flor = document.createElement('div');
    flor.className = 'mothersday-elegant-flower festive-element';
    flor.textContent = this.randomChoice(this.flores);
    flor.style.left = this.random(0, 100) + '%';
    flor.style.fontSize = this.random(22, 38) + 'px';
    
    flor.style.setProperty('--drift-1', this.random(-70, 70) + 'px');
    flor.style.setProperty('--drift-2', this.random(-90, 90) + 'px');
    flor.style.setProperty('--drift-3', this.random(-60, 60) + 'px');
    flor.style.setProperty('--spin-1', this.random(-90, 90) + 'deg');
    flor.style.setProperty('--spin-2', this.random(-180, 180) + 'deg');
    flor.style.setProperty('--spin-3', this.random(-270, 270) + 'deg');
    
    const duracion = this.random(10, 15);
    flor.style.animationDuration = duracion + 's';
    
    container.appendChild(flor);
    this.elementosActivos.add(flor);
    this.limpiarElemento(flor, duracion * 1000 + 500);
  }
}

// ═══════════════════════════════════════════════════════════
// 🎃 HALLOWEEN - TERROR CINEMATOGRÁFICO
// ═══════════════════════════════════════════════════════════

class HalloweenManager extends FestividadManager {
  constructor() {
    super();
    this.elementos = ['🎃', '💀', '🕷️', '🕸️', '🧙', '🧛', '🦇'];
    this.fantasmas = ['👻'];
  }

  iniciar() {
    if (!this.estaActiva(FESTIVE_CONFIG.HALLOWEEN)) return;
    if (this.intervalosActivos.has('principal')) return;

    const container = document.getElementById('halloween-spooky');
    if (!container) return;

    // Elementos cayendo
    for (let i = 0; i < 30; i++) {
      setTimeout(() => this.crearElemento(), i * 200);
    }

    const intervalo = setInterval(() => {
      if (this.elementosActivos.size < this.maxElementosPorFestividad) {
        this.crearElemento();
      }
    }, 330);

    this.intervalosActivos.set('principal', intervalo);

    // Fantasmas flotantes
    for (let i = 0; i < 4; i++) {
      setTimeout(() => this.crearFantasma(), i * 1500);
    }

    const intervaloFantasmas = setInterval(() => {
      if (this.elementosActivos.size < this.maxElementosPorFestividad) {
        this.crearFantasma();
      }
    }, 4000 + Math.random() * 3000);

    this.intervalosActivos.set('fantasmas', intervaloFantasmas);

    // Murciélagos
    const intervaloMurcielagos = setInterval(() => {
      if (Math.random() > 0.6 && this.elementosActivos.size < this.maxElementosPorFestividad) {
        this.crearMurcielago();
      }
    }, 3000);

    this.intervalosActivos.set('murcielagos', intervaloMurcielagos);
  }

  crearElemento() {
    const container = document.getElementById('halloween-spooky');
    if (!container) return;

    const elemento = document.createElement('div');
    elemento.className = 'halloween-spooky-element festive-element';
    elemento.textContent = this.randomChoice(this.elementos);
    elemento.style.left = this.random(0, 100) + '%';
    elemento.style.fontSize = this.random(22, 40) + 'px';
    
    elemento.style.setProperty('--drift-a', this.random(-80, 80) + 'px');
    elemento.style.setProperty('--drift-b', this.random(-100, 100) + 'px');
    elemento.style.setProperty('--drift-c', this.random(-70, 70) + 'px');
    elemento.style.setProperty('--rot-a', this.random(-120, 120) + 'deg');
    elemento.style.setProperty('--rot-b', this.random(-240, 240) + 'deg');
    elemento.style.setProperty('--rot-c', this.random(-360, 360) + 'deg');
    
    const duracion = this.random(8, 13);
    elemento.style.animationDuration = duracion + 's';
    
    container.appendChild(elemento);
    this.elementosActivos.add(elemento);
    this.limpiarElemento(elemento, duracion * 1000 + 500);
  }

  crearFantasma() {
    const container = document.getElementById('halloween-spooky');
    if (!container) return;

    const fantasma = document.createElement('div');
    fantasma.className = 'halloween-ghost-float festive-element';
    fantasma.textContent = this.randomChoice(this.fantasmas);
    fantasma.style.fontSize = this.random(45, 70) + 'px';
    fantasma.style.left = this.random(10, 80) + 'vw';
    
    const duracion = this.random(4, 6);
    fantasma.style.animationDuration = duracion + 's';
    
    container.appendChild(fantasma);
    this.elementosActivos.add(fantasma);
    this.limpiarElemento(fantasma, duracion * 1000 + 500);
  }

  crearMurcielago() {
    const container = document.getElementById('halloween-spooky');
    if (!container) return;

    const murcielago = document.createElement('div');
    murcielago.className = 'halloween-bat-fly festive-element';
    murcielago.textContent = '🦇';
    murcielago.style.fontSize = this.random(25, 45) + 'px';
    
    const duracion = this.random(3, 5);
    murcielago.style.animationDuration = duracion + 's';
    
    container.appendChild(murcielago);
    this.elementosActivos.add(murcielago);
    this.limpiarElemento(murcielago, duracion * 1000 + 500);
  }
}

// ═══════════════════════════════════════════════════════════
// 💀 DÍA DE MUERTOS
// ═══════════════════════════════════════════════════════════

class DiaMuertosManager extends FestividadManager {
  constructor() {
    super();
    this.elementos = ['🌼', '💀', '🕯️', '🌺', '🦴', '🪦'];
  }

  iniciar() {
    if (!this.estaActiva(FESTIVE_CONFIG.DIA_MUERTOS)) return;
    if (this.intervalosActivos.has('principal')) return;

    const container = document.getElementById('dayofdead-marigolds');
    if (!container) return;

    for (let i = 0; i < 25; i++) {
      setTimeout(() => this.crearFlor(), i * 280);
    }

    const intervalo = setInterval(() => {
      if (this.elementosActivos.size < this.maxElementosPorFestividad) {
        this.crearFlor();
      }
    }, 420);

    this.intervalosActivos.set('principal', intervalo);
  }

  crearFlor() {
    const container = document.getElementById('dayofdead-marigolds');
    if (!container) return;

    const flor = document.createElement('div');
    flor.className = 'dayofdead-marigold festive-element';
    flor.textContent = this.randomChoice(this.elementos);
    flor.style.left = this.random(0, 100) + '%';
    flor.style.fontSize = this.random(20, 36) + 'px';
    
    flor.style.setProperty('--float-1', this.random(-75, 75) + 'px');
    flor.style.setProperty('--float-2', this.random(-95, 95) + 'px');
    flor.style.setProperty('--float-3', this.random(-65, 65) + 'px');
    flor.style.setProperty('--turn-1', this.random(-100, 100) + 'deg');
    flor.style.setProperty('--turn-2', this.random(-200, 200) + 'deg');
    flor.style.setProperty('--turn-3', this.random(-300, 300) + 'deg');
    
    const duracion = this.random(9, 14);
    flor.style.animationDuration = duracion + 's';
    
    container.appendChild(flor);
    this.elementosActivos.add(flor);
    this.limpiarElemento(flor, duracion * 1000 + 500);
  }
}

// ═══════════════════════════════════════════════════════════
// ❄️ NAVIDAD - INVIERNO MÁGICO
// ═══════════════════════════════════════════════════════════

class NavidadManager extends FestividadManager {
  constructor() {
    super();
    this.copos = ['❄', '❅', '❆', '✻', '✼'];
  }

  iniciar() {
    if (!this.estaActiva(FESTIVE_CONFIG.NAVIDAD)) return;
    if (this.intervalosActivos.has('principal')) return;

    const container = document.getElementById('christmas-snowfall');
    if (!container) return;

    for (let i = 0; i < 40; i++) {
      setTimeout(() => this.crearCopo(), i * 150);
    }

    const intervalo = setInterval(() => {
      if (this.elementosActivos.size < this.maxElementosPorFestividad) {
        this.crearCopo();
      }
    }, 180);

    this.intervalosActivos.set('principal', intervalo);
  }

  crearCopo() {
    const container = document.getElementById('christmas-snowfall');
    if (!container) return;

    const copo = document.createElement('div');
    copo.className = 'christmas-snowflake festive-element';
    copo.textContent = this.randomChoice(this.copos);
    copo.style.left = this.random(0, 100) + '%';
    copo.style.fontSize = this.random(12, 28) + 'px';
    copo.style.opacity = this.random(0.4, 0.9).toFixed(2);
    
    copo.style.setProperty('--drift', this.random(-50, 50) + 'px');
    copo.style.setProperty('--spin', this.random(-360, 360) + 'deg');
    
    const duracion = this.random(10, 18);
    copo.style.animationDuration = duracion + 's';
    
    container.appendChild(copo);
    this.elementosActivos.add(copo);
    this.limpiarElemento(copo, duracion * 1000 + 500);
  }
}

// ═══════════════════════════════════════════════════════════
// 🎭 CARNAVAL - FIESTA EXPLOSIVA
// ═══════════════════════════════════════════════════════════

class CarnavalManager extends FestividadManager {
  constructor() {
    super();
    this.formas = ['●', '■', '▲', '◆', '★', '♦', '♥', '♣', '♠'];
  }

  iniciar() {
    if (!this.estaActiva(FESTIVE_CONFIG.CARNAVAL)) return;
    if (this.intervalosActivos.has('confeti')) return;

    // Confeti
    const containerConfeti = document.getElementById('carnival-confetti');
    if (containerConfeti) {
      for (let i = 0; i < 35; i++) {
        setTimeout(() => this.crearConfeti(), i * 120);
      }

      const intervaloConfeti = setInterval(() => {
        if (this.elementosActivos.size < this.maxElementosPorFestividad) {
          this.crearConfeti();
        }
      }, 160);

      this.intervalosActivos.set('confeti', intervaloConfeti);
    }

    // Fuegos artificiales
    const containerFuegos = document.getElementById('carnival-fireworks');
    if (containerFuegos) {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => this.lanzarCohete(), i * 600);
      }

      const intervaloFuegos = setInterval(() => {
        if (this.elementosActivos.size < this.maxElementosPorFestividad) {
          this.lanzarCohete();
        }
      }, 1200 + Math.random() * 700);

      this.intervalosActivos.set('fuegos', intervaloFuegos);
    }
  }

  crearConfeti() {
    const container = document.getElementById('carnival-confetti');
    if (!container) return;

    const confeti = document.createElement('div');
    confeti.className = 'carnival-confetti-piece festive-element';
    confeti.textContent = this.randomChoice(this.formas);
    confeti.style.left = this.random(0, 100) + '%';
    confeti.style.fontSize = this.random(10, 20) + 'px';
    confeti.style.color = this.randomChoice(COLOR_PALETTES.CARNAVAL);
    
    confeti.style.setProperty('--drift-confetti', this.random(-80, 80) + 'px');
    confeti.style.setProperty('--spin-confetti', this.random(-720, 720) + 'deg');
    
    const duracion = this.random(6, 10);
    confeti.style.animationDuration = duracion + 's';
    
    container.appendChild(confeti);
    this.elementosActivos.add(confeti);
    this.limpiarElemento(confeti, duracion * 1000 + 500);
  }

  lanzarCohete() {
    const container = document.getElementById('carnival-fireworks');
    if (!container) return;

    const cohete = document.createElement('div');
    cohete.className = 'carnival-rocket festive-element';
    
    const color = this.randomChoice(COLOR_PALETTES.CARNAVAL);
    cohete.style.background = color;
    cohete.style.left = this.random(15, 85) + 'vw';
    cohete.style.width = this.random(5, 9) + 'px';
    cohete.style.height = this.random(16, 24) + 'px';
    cohete.style.animationDuration = this.random(1, 1.6) + 's';

    container.appendChild(cohete);
    this.elementosActivos.add(cohete);

    cohete.addEventListener('animationend', () => {
      const rect = cohete.getBoundingClientRect();
      this.crearExplosion(rect.left + rect.width / 2, rect.top + rect.height / 2, color);
      this.limpiarElemento(cohete);
    });

    this.limpiarElemento(cohete, 2500);
  }

  crearExplosion(x, y, color) {
    const container = document.getElementById('carnival-fireworks');
    if (!container) return;

    const numParticulas = this.randomInt(35, 55);

    for (let i = 0; i < numParticulas; i++) {
      const particula = document.createElement('div');
      particula.className = 'carnival-burst-particle festive-element';
      particula.textContent = this.randomChoice(this.formas);
      particula.style.fontSize = this.random(10, 18) + 'px';
      particula.style.color = this.randomChoice(COLOR_PALETTES.CARNAVAL);
      particula.style.left = x + 'px';
      particula.style.top = y + 'px';
      
      const angulo = (Math.PI * 2 * i) / numParticulas + this.random(-0.2, 0.2);
      const distancia = this.random(60, 130);
      particula.style.setProperty('--explode-x', Math.cos(angulo) * distancia + 'px');
      particula.style.setProperty('--explode-y', Math.sin(angulo) * distancia + 'px');
      particula.style.setProperty('--explode-r', this.random(-360, 360) + 'deg');
      particula.style.animationDuration = this.random(0.8, 1.5) + 's';
      
      container.appendChild(particula);
      this.elementosActivos.add(particula);
      this.limpiarElemento(particula, 1800);
    }
  }
}

// ═══════════════════════════════════════════════════════════
// 🌸 PRIMAVERA, ☀️ VERANO, 🍂 OTOÑO
// ═══════════════════════════════════════════════════════════

class PrimaveraManager extends FestividadManager {
  constructor() {
    super();
    this.elementos = ['🌸', '🌺', '🌼', '🌻', '🌷', '🦋', '🐝', '🌱'];
  }

  iniciar() {
    if (!this.estaActiva(FESTIVE_CONFIG.PRIMAVERA)) return;
    if (this.intervalosActivos.has('principal')) return;

    const container = document.getElementById('spring-blossoms');
    if (!container) return;

    for (let i = 0; i < 18; i++) {
      setTimeout(() => this.crearFlor(), i * 450);
    }

    const intervalo = setInterval(() => {
      if (this.elementosActivos.size < 50) {
        this.crearFlor();
      }
    }, 650);

    this.intervalosActivos.set('principal', intervalo);
  }

  crearFlor() {
    const container = document.getElementById('spring-blossoms');
    if (!container) return;

    const flor = document.createElement('div');
    flor.className = 'spring-blossom festive-element';
    flor.textContent = this.randomChoice(this.elementos);
    flor.style.left = this.random(0, 100) + '%';
    flor.style.fontSize = this.random(18, 30) + 'px';
    
    flor.style.setProperty('--wind-1', this.random(-60, 60) + 'px');
    flor.style.setProperty('--wind-2', this.random(-80, 80) + 'px');
    flor.style.setProperty('--wind-3', this.random(-50, 50) + 'px');
    flor.style.setProperty('--twirl-1', this.random(-90, 90) + 'deg');
    flor.style.setProperty('--twirl-2', this.random(-180, 180) + 'deg');
    flor.style.setProperty('--twirl-3', this.random(-270, 270) + 'deg');
    
    const duracion = this.random(12, 18);
    flor.style.animationDuration = duracion + 's';
    
    container.appendChild(flor);
    this.elementosActivos.add(flor);
    this.limpiarElemento(flor, duracion * 1000 + 500);
  }
}

class VeranoManager extends FestividadManager {
  constructor() {
    super();
    this.elementos = ['☀️', '🌊', '🏖️', '🍉', '🍹', '🌴', '⛱️', '🏄'];
  }

  iniciar() {
    if (!this.estaActiva(FESTIVE_CONFIG.VERANO)) return;
    if (this.intervalosActivos.has('principal')) return;

    const container = document.getElementById('summer-vibes');
    if (!container) return;

    for (let i = 0; i < 10; i++) {
      setTimeout(() => this.crearElemento(), i * 900);
    }

    const intervalo = setInterval(() => {
      if (this.elementosActivos.size < 30) {
        this.crearElemento();
      }
    }, 2800 + Math.random() * 1500);

    this.intervalosActivos.set('principal', intervalo);
  }

  crearElemento() {
    const container = document.getElementById('summer-vibes');
    if (!container) return;

    const elemento = document.createElement('div');
    elemento.className = 'summer-element festive-element';
    elemento.textContent = this.randomChoice(this.elementos);
    elemento.style.fontSize = this.random(28, 48) + 'px';
    elemento.style.left = this.random(10, 85) + 'vw';
    
    elemento.style.setProperty('--summer-drift-1', this.random(-60, 60) + 'px');
    elemento.style.setProperty('--summer-drift-2', this.random(-80, 80) + 'px');
    elemento.style.setProperty('--summer-drift-3', this.random(-70, 70) + 'px');
    elemento.style.setProperty('--summer-drift-4', this.random(-50, 50) + 'px');
    elemento.style.setProperty('--summer-spin-1', this.random(-90, 90) + 'deg');
    elemento.style.setProperty('--summer-spin-2', this.random(-180, 180) + 'deg');
    elemento.style.setProperty('--summer-spin-3', this.random(-270, 270) + 'deg');
    elemento.style.setProperty('--summer-spin-4', this.random(-360, 360) + 'deg');
    
    const duracion = this.random(5, 8);
    elemento.style.animationDuration = duracion + 's';
    
    container.appendChild(elemento);
    this.elementosActivos.add(elemento);
    this.limpiarElemento(elemento, duracion * 1000 + 500);
  }
}

class OtonoManager extends FestividadManager {
  constructor() {
    super();
    this.elementos = ['🍂', '🍁', '🍄', '🌰', '🦔'];
  }

  iniciar() {
    if (!this.estaActiva(FESTIVE_CONFIG.OTONO)) return;
    if (this.intervalosActivos.has('principal')) return;

    const container = document.getElementById('autumn-leaves');
    if (!container) return;

    for (let i = 0; i < 22; i++) {
      setTimeout(() => this.crearHoja(), i * 350);
    }

    const intervalo = setInterval(() => {
      if (this.elementosActivos.size < this.maxElementosPorFestividad) {
        this.crearHoja();
      }
    }, 480);

    this.intervalosActivos.set('principal', intervalo);
  }

  crearHoja() {
    const container = document.getElementById('autumn-leaves');
    if (!container) return;

    const hoja = document.createElement('div');
    hoja.className = 'autumn-falling-leaf festive-element';
    hoja.textContent = this.randomChoice(this.elementos);
    hoja.style.left = this.random(0, 100) + '%';
    hoja.style.fontSize = this.random(20, 36) + 'px';
    
    hoja.style.setProperty('--autumn-1', this.random(-50, 50) + 'px');
    hoja.style.setProperty('--autumn-2', this.random(-70, 70) + 'px');
    hoja.style.setProperty('--autumn-3', this.random(-60, 60) + 'px');
    hoja.style.setProperty('--autumn-4', this.random(-80, 80) + 'px');
    hoja.style.setProperty('--autumn-5', this.random(-40, 40) + 'px');
    hoja.style.setProperty('--leaf-spin-1', this.random(-90, 90) + 'deg');
    hoja.style.setProperty('--leaf-spin-2', this.random(-180, 180) + 'deg');
    hoja.style.setProperty('--leaf-spin-3', this.random(-270, 270) + 'deg');
    hoja.style.setProperty('--leaf-spin-4', this.random(-360, 360) + 'deg');
    hoja.style.setProperty('--leaf-spin-5', this.random(-450, 450) + 'deg');
    
    const duracion = this.random(9, 14);
    hoja.style.animationDuration = duracion + 's';
    
    container.appendChild(hoja);
    this.elementosActivos.add(hoja);
    this.limpiarElemento(hoja, duracion * 1000 + 500);
  }
}

// ═══════════════════════════════════════════════════════════
// 🎯 SISTEMA PRINCIPAL DE INICIALIZACIÓN
// ═══════════════════════════════════════════════════════════

class SistemaFestividades {
  constructor() {
    this.managers = {
      NUEVO_ANO: new AnoNuevoManager(),
      SAN_VALENTIN: new SanValentinManager(),
      DIA_GATO: new DiaGatoManager(),
      CARNAVAL: new CarnavalManager(),
      SAN_PATRICIO: new SanPatricioManager(),
      PASCUA: new PascuaManager(),
      DIA_MADRE: new DiaMadreManager(),
      HALLOWEEN: new HalloweenManager(),
      DIA_MUERTOS: new DiaMuertosManager(),
      NAVIDAD: new NavidadManager(),
      PRIMAVERA: new PrimaveraManager(),
      VERANO: new VeranoManager(),
      OTONO: new OtonoManager()
    };

    this.festivaActivaActual = null;
  }

  inicializar() {
    // Detectar festiva activa
    const festivaActiva = this.detectarFestivaActiva();
    
    if (!festivaActiva) {
      console.log('🎉 No hay festividades activas en este momento');
      return;
    }

    console.log(`🎊 Festividad activa: ${festivaActiva.nombre}`);
    
    // Iniciar manager correspondiente
    const manager = this.managers[festivaActiva.id];
    if (manager) {
      manager.iniciar();
      this.festivaActivaActual = festivaActiva;
    }
  }

  detectarFestivaActiva() {
    const ahora = new Date();
    const festivasActivas = Object.values(FESTIVE_CONFIG)
      .filter(config => ahora >= config.inicio && ahora <= config.fin)
      .sort((a, b) => b.prioridad - a.prioridad);

    return festivasActivas.length > 0 ? festivasActivas[0] : null;
  }

  detenerTodo() {
    Object.values(this.managers).forEach(manager => manager.detenerTodo());
    this.festivaActivaActual = null;
  }
}

// ═══════════════════════════════════════════════════════════
// 🚀 INICIALIZACIÓN AUTOMÁTICA
// ═══════════════════════════════════════════════════════════

const sistemaFestividades = new SistemaFestividades();

document.addEventListener('DOMContentLoaded', () => {
  console.log('🎨 Sistema de Festividades cargado');
  sistemaFestividades.inicializar();
});

// Exportar para uso externo si es necesario
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SistemaFestividades, FESTIVE_CONFIG };
}