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















const NAVIDAD_INICIO = new Date("2025-12-01T00:00:00");
const NAVIDAD_FIN    = new Date("2025-12-30T23:59:59");

let snowInterval = null;

function crearCopo() {
const cont = document.getElementById("snow-container");
if (!cont) return;

const flake = document.createElement("div");
flake.className = "snowflake";
flake.textContent = "❄";
flake.style.left = Math.random() * 100 + "%";
flake.style.opacity = (0.10 + Math.random() * 0.35).toFixed(2);
flake.style.fontSize = (8 + Math.random() * 18) + "px";

const duration = 6 + Math.random() * 8;
flake.style.animationDuration = duration + "s";

cont.appendChild(flake);

setTimeout(() => {
try { flake.remove(); } catch(e){}
}, duration * 1000 + 200);
}

function activarNieveSiEsNavidad() {
const hoy = new Date();
if (hoy < NAVIDAD_INICIO || hoy > NAVIDAD_FIN) return;

if (!snowInterval) {
for (let i = 0; i < 15; i++) crearCopo();
snowInterval = setInterval(crearCopo, 250);
}
}

// auto-ejecutar al cargar la página
document.addEventListener("DOMContentLoaded", activarNieveSiEsNavidad);




const EVENTO_INICIO = new Date("2025-12-31T00:00:00");
const EVENTO_FIN    = new Date("2026-01-06T23:59:59");

let fireworksInterval = null;
const COLORES = ["red","blue","green","orange","pink","purple","yellow","cyan","magenta"];

function crearCohete() {
  const cont = document.getElementById("fireworks-container");
  if (!cont) return;

  const fw = document.createElement("div");
  fw.className = "firework";

  const color = COLORES[Math.floor(Math.random() * COLORES.length)];
  fw.style.background = color;
  fw.style.color = color;
  fw.style.left = Math.random() * 90 + "vw";
  fw.style.width = (4 + Math.random() * 4) + "px";
  fw.style.height = (15 + Math.random() * 15) + "px";
  fw.style.animationDuration = (1 + Math.random() * 0.7) + "s";

  cont.appendChild(fw);

  fw.addEventListener("animationend", () => {
    const rect = fw.getBoundingClientRect();
    const numParticles = 30 + Math.floor(Math.random() * 20);

    for (let i = 0; i < numParticles; i++) {
      const p = document.createElement("div");
      p.className = "particle";
      const size = 3 + Math.random() * 4;
      const pColor = COLORES[Math.floor(Math.random() * COLORES.length)];
      p.style.width = size + "px";
      p.style.height = size + "px";
      p.style.background = pColor;
      p.style.opacity = (0.7 + Math.random() * 0.3);
      p.style.left = rect.left + rect.width/2 + "px";
      p.style.top  = rect.top + rect.height/2 + "px";
      const angle = Math.random() * 2 * Math.PI;
      const distance = 50 + Math.random() * 60;
      p.style.setProperty('--x', (Math.cos(angle) * distance) + 'px');
      p.style.setProperty('--y', (Math.sin(angle) * distance) + 'px');
      p.style.animationDuration = (0.5 + Math.random() * 0.7) + "s";
      cont.appendChild(p);
      setTimeout(() => p.remove(), 1500);
    }

    const year = document.createElement("span");
    year.className = "firework-year";
    year.style.color = color;
    year.style.left = rect.left + rect.width/2 + "px";
    year.style.top  = rect.top + rect.height/2 + "px";
    year.textContent = "2026";
    cont.appendChild(year);
    setTimeout(() => year.remove(), 1200);

    fw.remove();
  });
}

function activarFuegos() {
  const hoy = new Date();
  if (hoy < EVENTO_INICIO || hoy > EVENTO_FIN) return;

  if (!fireworksInterval) {
    for (let i = 0; i < 3; i++) setTimeout(crearCohete, i * 300);
    fireworksInterval = setInterval(() => crearCohete(), 800 + Math.random() * 400);
  }
}

document.addEventListener("DOMContentLoaded", activarFuegos);




const SAN_VALENTIN_INICIO = new Date("2026-02-10T00:00:00");
const SAN_VALENTIN_FIN = new Date("2026-02-15T23:59:59");

let petalsInterval = null;

function crearPetalo() {
    const cont = document.getElementById("petals-container");
    if (!cont) return;

    const petalo = document.createElement("div");
    petalo.className = "petal";
    
    // Alternar entre rosas y corazones
    const tipos = ["🌹", "❤️", "💗", "🌷", "💞"];
    petalo.textContent = tipos[Math.floor(Math.random() * tipos.length)];
    
    petalo.style.left = Math.random() * 100 + "%";
    petalo.style.opacity = (0.3 + Math.random() * 0.4).toFixed(2);
    petalo.style.fontSize = (14 + Math.random() * 20) + "px";
    
    // Rotación aleatoria
    const rotacion = Math.random() * 360;
    petalo.style.setProperty('--rotation', rotacion + 'deg');
    
    const duration = 8 + Math.random() * 10;
    petalo.style.animationDuration = duration + "s";
    
    // Oscilación lateral
    const swingAmount = 30 + Math.random() * 70;
    petalo.style.setProperty('--swing', swingAmount + 'px');

    cont.appendChild(petalo);

    setTimeout(() => {
        try { petalo.remove(); } catch(e){}
    }, duration * 1000 + 200);
}

function activarPetalosSiEsSanValentin() {
    const hoy = new Date();
    if (hoy < SAN_VALENTIN_INICIO || hoy > SAN_VALENTIN_FIN) return;

    if (!petalsInterval) {
        for (let i = 0; i < 20; i++) crearPetalo();
        petalsInterval = setInterval(crearPetalo, 350);
    }
}

document.addEventListener("DOMContentLoaded", activarPetalosSiEsSanValentin);

// ===== CORAZONES FLOTANTES (equivalente a fuegos artificiales) =====
const CORAZONES_INICIO = new Date("2026-02-14T00:00:00");
const CORAZONES_FIN = new Date("2026-02-14T23:59:59");

let heartsInterval = null;
const COLORES_CORAZONES = ["#ff4081", "#ff6b9d", "#ff3366", "#ff99cc", "#ff6699", "#ff1a66"];

function crearCorazonFlotante() {
    const cont = document.getElementById("hearts-container");
    if (!cont) return;

    const heart = document.createElement("div");
    heart.className = "floating-heart";
    
    const color = COLORES_CORAZONES[Math.floor(Math.random() * COLORES_CORAZONES.length)];
    heart.style.color = color;
    heart.textContent = "❤️";
    
    // Tamaño y posición inicial
    const size = 24 + Math.random() * 32;
    heart.style.fontSize = size + "px";
    heart.style.left = Math.random() * 85 + "vw";
    heart.style.bottom = "0";
    
    // Animación de subida
    const duration = 3 + Math.random() * 2;
    heart.style.animationDuration = duration + "s";
    
    // Oscilación horizontal
    const swingDistance = 20 + Math.random() * 60;
    heart.style.setProperty('--swing-distance', swingDistance + 'px');
    
    // Brillo
    heart.style.filter = `drop-shadow(0 0 6px ${color})`;
    
    cont.appendChild(heart);

    // Crear partículas de amor alrededor
    setTimeout(() => {
        const rect = heart.getBoundingClientRect();
        const numParticles = 8 + Math.floor(Math.random() * 12);
        
        for (let i = 0; i < numParticles; i++) {
            const p = document.createElement("div");
            p.className = "love-particle";
            p.textContent = ["💖", "💕", "💓", "💘", "💝"][Math.floor(Math.random() * 5)];
            const pColor = COLORES_CORAZONES[Math.floor(Math.random() * COLORES_CORAZONES.length)];
            p.style.color = pColor;
            p.style.fontSize = (10 + Math.random() * 16) + "px";
            p.style.opacity = 0.8;
            p.style.left = rect.left + rect.width/2 + "px";
            p.style.top = rect.top + rect.height/2 + "px";
            
            const angle = Math.random() * 2 * Math.PI;
            const distance = 40 + Math.random() * 80;
            p.style.setProperty('--x', (Math.cos(angle) * distance) + 'px');
            p.style.setProperty('--y', (Math.sin(angle) * distance) + 'px');
            p.style.animationDuration = (1.2 + Math.random() * 0.8) + "s";
            
            cont.appendChild(p);
            setTimeout(() => p.remove(), 1800);
        }
        
        // Texto romántico que aparece
        const textos = ["Te amo", "Amor", "Beso", "Eres mía", "Mi vida", "Cariño"];
        const texto = document.createElement("span");
        texto.className = "love-text";
        texto.style.color = color;
        texto.style.left = rect.left + rect.width/2 + "px";
        texto.style.top = rect.top + rect.height/2 + "px";
        texto.textContent = textos[Math.floor(Math.random() * textos.length)];
        texto.style.textShadow = `0 0 8px ${color}`;
        cont.appendChild(texto);
        setTimeout(() => texto.remove(), 1500);
        
        heart.remove();
    }, duration * 1000);
}

function activarCorazones() {
    const hoy = new Date();
    if (hoy < CORAZONES_INICIO || hoy > CORAZONES_FIN) return;

    if (!heartsInterval) {
        for (let i = 0; i < 4; i++) setTimeout(crearCorazonFlotante, i * 500);
        heartsInterval = setInterval(() => crearCorazonFlotante(), 1200 + Math.random() * 600);
    }
}

document.addEventListener("DOMContentLoaded", activarCorazones);




const CARNAVAL_INICIO = new Date("2026-02-13T00:00:00");
const CARNAVAL_FIN = new Date("2026-02-15T23:59:59");

let confettiInterval = null;

function crearConfeti() {
  const cont = document.getElementById("carnival-container");
  if (!cont) return;

  const confeti = document.createElement("div");
  confeti.className = "confetti";
  
  // Formas geométricas en lugar de emojis
  const formas = ["●", "■", "▲", "◆"];
  confeti.textContent = formas[Math.floor(Math.random() * formas.length)];
  
  confeti.style.left = Math.random() * 100 + "%";
  confeti.style.opacity = (0.15 + Math.random() * 0.4).toFixed(2);
  confeti.style.fontSize = (6 + Math.random() * 12) + "px";
  
  // Colores vibrantes de carnaval
  const colores = ["#FF3B30", "#4CD964", "#007AFF", "#FF9500", "#FFCC00", "#5856D6", "#FF2D55", "#5AC8FA"];
  const color = colores[Math.floor(Math.random() * colores.length)];
  confeti.style.color = color;
  confeti.style.textShadow = `0 0 3px ${color}`;

  const duration = 5 + Math.random() * 7;
  confeti.style.animationDuration = duration + "s";

  cont.appendChild(confeti);

  setTimeout(() => {
    try { confeti.remove(); } catch(e){}
  }, duration * 1000 + 200);
}

function activarConfetiSiEsCarnaval() {
  const hoy = new Date();
  if (hoy < CARNAVAL_INICIO || hoy > CARNAVAL_FIN) return;

  if (!confettiInterval) {
    for (let i = 0; i < 20; i++) crearConfeti();
    confettiInterval = setInterval(crearConfeti, 200);
  }
}

// auto-ejecutar al cargar la página
document.addEventListener("DOMContentLoaded", activarConfetiSiEsCarnaval);

// ===== FUEGOS ARTIFICIALES DE CARNAVAL =====
const CARNAVAL_FUEGOS_INICIO = new Date("2026-02-01T00:00:00");
const CARNAVAL_FUEGOS_FIN = new Date("2026-02-12T23:59:59");

let carnivalFireworksInterval = null;
const COLORES_CARNAVAL = ["#FF3B30", "#FF9500", "#FFCC00", "#4CD964", "#007AFF", "#5856D6", "#FF2D55"];

function crearFuegoCarnaval() {
  const cont = document.getElementById("carnival-fireworks-container");
  if (!cont) return;

  const fw = document.createElement("div");
  fw.className = "carnival-firework";

  const color = COLORES_CARNAVAL[Math.floor(Math.random() * COLORES_CARNAVAL.length)];
  fw.style.background = color;
  fw.style.color = color;
  fw.style.left = Math.random() * 90 + "vw";
  fw.style.width = (3 + Math.random() * 5) + "px";
  fw.style.height = (12 + Math.random() * 18) + "px";
  fw.style.animationDuration = (0.8 + Math.random() * 0.9) + "s";

  cont.appendChild(fw);

  fw.addEventListener("animationend", () => {
    const rect = fw.getBoundingClientRect();
    const numParticles = 25 + Math.floor(Math.random() * 25);

    for (let i = 0; i < numParticles; i++) {
      const p = document.createElement("div");
      p.className = "carnival-particle";
      
      // Forma aleatoria para las partículas
      const formasParticulas = ["circle", "square", "triangle"];
      const forma = formasParticulas[Math.floor(Math.random() * formasParticulas.length)];
      
      if (forma === "circle") {
        p.style.borderRadius = "50%";
      } else if (forma === "triangle") {
        p.style.width = "0";
        p.style.height = "0";
        p.style.borderLeft = "4px solid transparent";
        p.style.borderRight = "4px solid transparent";
        p.style.borderBottom = `8px solid ${COLORES_CARNAVAL[Math.floor(Math.random() * COLORES_CARNAVAL.length)]}`;
        p.style.background = "transparent";
      } else {
        p.style.borderRadius = "2px";
      }
      
      const size = forma === "triangle" ? 0 : (2 + Math.random() * 5);
      if (forma !== "triangle") {
        p.style.width = size + "px";
        p.style.height = size + "px";
      }
      
      const pColor = COLORES_CARNAVAL[Math.floor(Math.random() * COLORES_CARNAVAL.length)];
      if (forma !== "triangle") {
        p.style.background = pColor;
      }
      p.style.opacity = (0.6 + Math.random() * 0.4);
      p.style.left = rect.left + rect.width/2 + "px";
      p.style.top = rect.top + rect.height/2 + "px";
      const angle = Math.random() * 2 * Math.PI;
      const distance = 40 + Math.random() * 80;
      p.style.setProperty('--x', (Math.cos(angle) * distance) + 'px');
      p.style.setProperty('--y', (Math.sin(angle) * distance) + 'px');
      p.style.animationDuration = (0.6 + Math.random() * 0.8) + "s";
      cont.appendChild(p);
      setTimeout(() => p.remove(), 1400);
    }

    // Texto de carnaval en lugar del año
    const carnivalText = document.createElement("span");
    carnivalText.className = "carnival-text";
    carnivalText.style.color = color;
    carnivalText.style.left = rect.left + rect.width/2 + "px";
    carnivalText.style.top = rect.top + rect.height/2 + "px";
    
    const textos = ["¡Fiesta!", "Carnaval", "¡Celebra!", "Fiesta", "¡Diversión!"];
    carnivalText.textContent = textos[Math.floor(Math.random() * textos.length)];
    
    cont.appendChild(carnivalText);
    setTimeout(() => carnivalText.remove(), 1100);

    fw.remove();
  });
}

function activarFuegosCarnaval() {
  const hoy = new Date();
  if (hoy < CARNAVAL_FUEGOS_INICIO || hoy > CARNAVAL_FUEGOS_FIN) return;

  if (!carnivalFireworksInterval) {
    for (let i = 0; i < 4; i++) setTimeout(crearFuegoCarnaval, i * 400);
    carnivalFireworksInterval = setInterval(() => crearFuegoCarnaval(), 1000 + Math.random() * 500);
  }
}

document.addEventListener("DOMContentLoaded", activarFuegosCarnaval);