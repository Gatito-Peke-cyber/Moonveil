/**
 * premios.js — Sistema Gacha Moonveil
 * ════════════════════════════════════
 * ✅ Recibe tickets comprados en tienda.html (clave mv_tickets_<wheelId>)
 * ✅ Función global addTickets(wheelId, count) expuesta para la tienda
 * ✅ Header idéntico a tienda.html con colores de temática ruleta
 * ✅ Fácil añadir nuevas ruletas (ver sección ROULETTES abajo)
 *
 * ──────────────────────────────────────────────────────────
 * ¿CÓMO AÑADIR UNA NUEVA RULETA?
 * 1. Copia uno de los objetos de ROULETTES y pégalo al final del array
 * 2. Cambia: id, title, icon, desc, bg, music, start, end, rewards
 * 3. Añade sus misiones en MISSIONS_BY_WHEEL con la misma clave que id
 * 4. Añade sus mensajes del zorrito en FOX_MESSAGES con la misma clave
 * 5. ¡Listo! El sistema carga la nueva ruleta automáticamente
 *
 * Reglas de la clave "id" de la ruleta:
 *   - Debe coincidir con el sufijo del ticket en tienda
 *   - Ejemplo: id:'mystic' ↔ producto tienda id:'t_mystic_1'
 *              clave localStorage: mv_tickets_mystic
 * ──────────────────────────────────────────────────────────
 */

'use strict';

const $ = (s) => document.querySelector(s);
const $$ = (s, c = document) => c.querySelectorAll(s);
const el = (t, p = {}) => Object.assign(document.createElement(t), p);
const wait = (ms) => new Promise(res => setTimeout(res, ms));

/* ═══════════════════════════════════════════════════
   CLAVES DE LOCALSTORAGE
   La clave de tickets es la MISMA que usa tienda.js
   para que los tickets comprados lleguen aquí
═══════════════════════════════════════════════════ */
const LS = {
  /**
   * CLAVE COMPARTIDA CON TIENDA.JS
   * tienda.js escribe: localStorage.setItem(`mv_tickets_${wheelId}`, count)
   * premios.js lee  : localStorage.getItem(`mv_tickets_${wheelId}`)
   * Así los tickets comprados en tienda llegan aquí automáticamente.
   */
  tickets:    (id) => `mv_tickets_${id}`,       // ← compartida con tienda
  pityEpic:   (id) => `mv_v2_pity_epic_${id}`,
  pityLegend: (id) => `mv_v2_pity_legend_${id}`,
  inventory:  'mv_v2_inventory',
  missions:   'mv_v2_missions',
  itemStock:  (id) => `mv_v2_stock_${id}`,
  boostState: 'mv_v2_boost',
  stats:      'mv_v2_stats'
};

const getLS = (key, fallback = null) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
};
const setLS = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };

/* ═══════════════════════════════════════════════════
   RULETAS  ← AÑADE NUEVAS AQUÍ
   ═══════════════════════════════════════════════════
   Estructura de cada ruleta:
   {
     id:      string   ← DEBE coincidir con el wheelId de los tickets en tienda
     title:   string   ← Nombre que se muestra en la UI
     icon:    string   ← Emoji del tab
     desc:    string   ← Descripción corta
     bg:      string|null ← Ruta imagen de fondo (o null)
     music:   string|null ← Ruta archivo de música (o null)
     start:   'YYYY-MM-DD'|null ← null = sin fecha de inicio
     end:     'YYYY-MM-DD'|null ← null = permanente
     rewards: Array de premios (ver estructura abajo)
   }

   Estructura de cada premio (reward):
   {
     id:     string   ← ID único del premio (ej: 'c1', 'e3')
     label:  string   ← Nombre del premio
     weight: number   ← Peso de probabilidad (mayor = más común)
     rarity: 'common'|'uncommon'|'rare'|'epic'|'legend'
     img:    string   ← Emoji o ruta de imagen
     desc:   string   ← Descripción corta
     stock:  number|null ← null = ilimitado, número = stock máximo
   }
═══════════════════════════════════════════════════ */
const ROULETTES = [
  /* ─── RULETA CLÁSICA (permanente) ─── */
  {
    id: 'classic',
    title: 'Clásica',
    icon: '💎',
    desc: 'Premios cotidianos siempre disponibles',
    bg: 'img-pass/catmoon.jpg',
    music: 'ald/music1.mp3',
    start: null,
    end: null,
    rewards: [
      { id:'c1',  label:'Esmeraldas x3',   weight:70, rarity:'common',   img:'💚', desc:'Paquete pequeño', stock:null },
      { id:'c2',  label:'Cobre x5',         weight:70, rarity:'common',   img:'🪙', desc:'Monedas',         stock:null },
      { id:'c3',  label:'Llave x1',         weight:60, rarity:'uncommon', img:'📦', desc:'Llave básica',    stock:null },
      { id:'c4',  label:'Cobre x10',        weight:50, rarity:'rare',     img:'✨', desc:'Paquete mediano', stock:null },
      { id:'c5',  label:'Esmeraldas x20',   weight:4,  rarity:'epic',     img:'💎', desc:'Especial',        stock:null },
      { id:'c6',  label:'Ticket 10%',       weight:4,  rarity:'epic',     img:'🎟️', desc:'Descuento tienda',stock:null },
      { id:'c7',  label:'Ticket 20%',       weight:4,  rarity:'epic',     img:'🎟️', desc:'Descuento tienda',stock:null },
      { id:'c8',  label:'Ticket 30%',       weight:4,  rarity:'epic',     img:'🎟️', desc:'Descuento tienda',stock:null },
      { id:'c9',  label:'Ticket 40%',       weight:4,  rarity:'epic',     img:'🎟️', desc:'Descuento tienda',stock:null },
      { id:'c10', label:'Ticket 50%',       weight:4,  rarity:'epic',     img:'🎟️', desc:'Descuento tienda',stock:null },
      { id:'c11', label:'Ticket 100% x2',   weight:1,  rarity:'legend',   img:'🎟️', desc:'Especial',        stock:5    },
      { id:'c12', label:'Cobre x64',        weight:1,  rarity:'legend',   img:'✨', desc:'Gran bolsa',      stock:null },
    ]
  },

  /* ─── RULETA COBRE (temporada) ─── */
  {
    id: 'elemental',
    title: 'Cobre',
    icon: '🪙',
    desc: '¿Y porque no intentarlo?',
    bg: 'img-pass/catmoon.jpg',
    music: 'ald/music3.mp3',
    start: '2025-01-02',
    end: '2025-12-23',
    rewards: [
      { id:'e1', label:'Cobre x2',  weight:10, rarity:'epic',   img:'💎', desc:'Valioso',  stock:null },
      { id:'e2', label:'Ticket 0%', weight:3,  rarity:'common', img:'🎟️', desc:'Nada jaja',stock:null },
      ...Array.from({ length:28 }, (_, i) => ({
        id:`e${i+3}`, label:'Cobre x1', weight:6, rarity:'common', img:'🪙', desc:'Mini moneda', stock:null
      })),
      ...Array.from({ length:10 }, (_, i) => ({
        id:`e${i+31}`, label:'Episodios', weight:1, rarity:'legend', img:'✨', desc:`Parte ${i+1}`, stock:1
      })),
      { id:'e41', label:'Episodios', weight:1, rarity:'legend', img:'✨', desc:'Parte XI',   stock:1    },
      { id:'e42', label:'Vacío',     weight:1, rarity:'legend', img:'✨', desc:'Nada',        stock:null },
      { id:'e43', label:'Vacío',     weight:1, rarity:'legend', img:'✨', desc:'Nada',        stock:null },
      { id:'e44', label:'Cobre x64',weight:1, rarity:'legend', img:'🪙', desc:'Gran bolsa', stock:null },
    ]
  },

  /* ─── RULETA EVENTO (limitada) ─── */
  {
    id: 'event',
    title: 'Evento',
    icon: '🎭',
    desc: 'Premios exclusivos de temporada',
    bg: null,
    music: 'music/1234.mp3',
    start: '2026-01-01',
    end: '2026-03-31',
    rewards: [
      { id:'ev1',  label:'Cupón *%',        weight:10, rarity:'rare',   img:'🎭', desc:'Quien sabe…', stock:null },
      { id:'ev2',  label:'Esmeraldas x25',  weight:6,  rarity:'epic',   img:'💎', desc:'Generoso',    stock:3    },
      { id:'ev3',  label:'████',            weight:1,  rarity:'legend', img:'🏅', desc:'Misterio',    stock:1    },
      { id:'ev4',  label:'Cupón 100%',      weight:1,  rarity:'legend', img:'🏅', desc:'Especial',    stock:2    },
      { id:'ev5',  label:'Llave x1',        weight:18, rarity:'uncommon',img:'📦',desc:'Cofre básico',stock:null },
      ...Array.from({ length:10 }, (_, i) => ({
        id:`ev${i+6}`, label:`Esmeraldas x${[0,5,5,10,10,10,10,15,15,5][i]}`, weight:30, rarity:'common', img:'💚', desc:'Común', stock:null
      }))
    ]
  },

  /* ═══════════════════════════════════════════
     ▼▼▼ PLANTILLA PARA NUEVA RULETA ▼▼▼
     Copia este bloque, descoméntalo y edítalo.
     El ticket asociado en tienda debe tener
     id que empiece por 't_<id>_<número>'
     Ej: si id:'mystic' → tienda: t_mystic_1
  ═══════════════════════════════════════════

  {
    id: 'mystic',            // ← CAMBIA ESTO (debe coincidir con tickets de tienda)
    title: 'Mística',        // ← nombre visible en el tab
    icon: '🌙',              // ← emoji del tab
    desc: 'Premios arcanos y misteriosos',
    bg: null,                // ← 'ruta/imagen.jpg' o null
    music: null,             // ← 'ruta/musica.mp3' o null
    start: '2026-04-01',     // ← fecha inicio o null (permanente)
    end: '2026-06-30',       // ← fecha fin o null (permanente)
    rewards: [
      { id:'m1', label:'Fragmento Astral',  weight:60, rarity:'common',   img:'⭐', desc:'Fragmento básico',    stock:null },
      { id:'m2', label:'Cristal Lunar',     weight:40, rarity:'uncommon', img:'🌙', desc:'Cristal raro',        stock:null },
      { id:'m3', label:'Esencia Mística',   weight:20, rarity:'rare',     img:'💜', desc:'Esencia poderosa',    stock:null },
      { id:'m4', label:'Artefacto Arcano',  weight:4,  rarity:'epic',     img:'🔮', desc:'Objeto épico',        stock:10   },
      { id:'m5', label:'Reliquia Estelar',  weight:1,  rarity:'legend',   img:'🌟', desc:'¡Muy raro!',          stock:3    },
    ]
  },

  */
];

/* ═══════════════════════════════════════════════════
   MISIONES POR RULETA
   Añade un objeto con la misma clave que el id de la ruleta
═══════════════════════════════════════════════════ */
const MISSIONS_BY_WHEEL = {
  classic: [
    { id:'mc1', title:'Inicia Sesión',  desc:'Nuevo día',      freq:'daily',   reward:{ count:5  } },
    { id:'mc2', title:'200 monedas',    desc:'Recoléctalas',   freq:'daily',   reward:{ count:1  } },
    { id:'mc3', title:'20 bloques',     desc:'Rómpelos',       freq:'daily',   reward:{ count:2  } },
    { id:'mc4', title:'1 mini-juego',   desc:'Gana uno',       freq:'weekly',  reward:{ count:3  } },
    { id:'mc5', title:'5 biomas',       desc:'Explóralos',     freq:'weekly',  reward:{ count:5  } },
  ],
  elemental: [
    { id:'me1', title:'Compras x2',     desc:'En la tienda',   freq:'daily',   reward:{ count:3  } },
    { id:'me2', title:'1 gato',         desc:'Domestícalo',    freq:'daily',   reward:{ count:1  } },
    { id:'me3', title:'Gastos 500',     desc:'Compra algo',    freq:'daily',   reward:{ count:5  } },
    { id:'me4', title:'5 comercios',    desc:'Con aldeano',    freq:'daily',   reward:{ count:3  } },
    { id:'me5', title:'5 tickets',      desc:'Otra ruleta',    freq:'daily',   reward:{ count:2  } },
    { id:'me6', title:'1 día',          desc:'Solo pasa',      freq:'daily',   reward:{ count:1  } },
  ],
  event: [
    { id:'mev1', title:'1 compra',      desc:'En la tienda',   freq:'daily',   reward:{ count:3  } },
    { id:'mev2', title:'5 comercios',   desc:'Con aldeano',    freq:'weekly',  reward:{ count:6  } },
    { id:'mev3', title:'20 mobs',       desc:'Derrota',        freq:'daily',   reward:{ count:5  } },
    { id:'mev4', title:'40 mobs',       desc:'Derrota',        freq:'weekly',  reward:{ count:10 } },
    { id:'mev5', title:'5 lobos',       desc:'Domestica',      freq:'weekly',  reward:{ count:10 } },
  ],
  /* Añade aquí las misiones de nuevas ruletas:
  mystic: [
    { id:'mm1', title:'Medita 1h', desc:'Dedica tiempo', freq:'daily', reward:{ count:3 } },
  ],
  */
};

/* ═══════════════════════════════════════════════════
   MENSAJES DEL ZORRITO POR RULETA
═══════════════════════════════════════════════════ */
const FOX_MESSAGES = {
  classic:   ['¡La clásica nunca falla!', 'Esmeraldas y monedas 💚', 'Esta es permanente ♾️', '¡Buena suerte!', 'Los épicos cada 20 tiros 📊'],
  elemental: ['¿Solo un cobre? 🪙', '¡Puede haber sorpresas!', 'Los episodios son raros ✨', 'Esta ruleta es especial 🎯', '¡Prueba tu suerte!'],
  event:     ['¡Evento limitado! ⏰', 'Cupones exclusivos 🎭', '¡No te lo pierdas!', 'Premios únicos aquí', '¡Aprovecha ahora!'],
  /* mystic: ['Sientes el poder místico… 🌙', '¡Los artefactos arcanos te esperan!'] */
  default:   ['¡Gira y gana! 🎰', '¡Buena suerte!', 'Épico cada 20 💜', 'Legendario cada 60 ⭐', '¡Colecciona todo! 📦']
};

/* ═══════════════════════════════════════════════════
   ESTADO GLOBAL
═══════════════════════════════════════════════════ */
let currentWheelId = ROULETTES[0].id;
let spinning       = false;
let currentAudio   = null;
let TICKET_MULTIPLIER = 1;
let timeUpdateInterval = null;
let foxMessageInterval = null;

/* ═══════════════════════════════════════════════════
   ESTADÍSTICAS
═══════════════════════════════════════════════════ */
function getStats()         { return getLS(LS.stats, { totalSpins:0, totalPrizes:0, totalTickets:0 }) }
function updateStats(delta) { const s = getStats(); Object.assign(s, delta); setLS(LS.stats, s); renderStats() }

function renderStats() {
  const s = getStats();
  const t = $('#totalTickets'), p = $('#totalPrizes'), sp = $('#totalSpins');
  if (t)  t.textContent  = s.totalTickets  || 0;
  if (p)  p.textContent  = s.totalPrizes   || 0;
  if (sp) sp.textContent = s.totalSpins    || 0;
}

/* ═══════════════════════════════════════════════════
   TICKETS
   ─────────────────────────────────────────────────
   getTickets / setTickets usan la clave mv_tickets_<id>
   que es LA MISMA que escribe tienda.js cuando el usuario
   compra un ticket. Esto permite que los tickets de tienda
   lleguen aquí automáticamente sin código extra.
═══════════════════════════════════════════════════ */
function getTickets(id) {
  // Lee directamente del localStorage con la clave compartida con tienda
  return parseInt(localStorage.getItem(LS.tickets(id)) || '0', 10);
}

function setTickets(id, count) {
  localStorage.setItem(LS.tickets(id), String(Math.max(0, Math.floor(count))));
  renderTicketsDisplay();
  renderHUDTickets();
  updateCurrentWheelInfo();
  const total = ROULETTES.reduce((sum, r) => sum + getTickets(r.id), 0);
  updateStats({ totalTickets: total });
}

/**
 * addTickets(wheelId, count)
 * ════════════════════════════
 * Función GLOBAL usada por tienda.js (awardTicketsToWheel)
 * para entregar tickets cuando el usuario compra un producto.
 *
 * La tienda llama primero a window.addTickets si existe,
 * y si no, escribe directamente a localStorage con mv_tickets_<id>.
 * En ambos casos el sistema funciona correctamente.
 */
function addTickets(id, count) {
  const realGain = Math.round(count * TICKET_MULTIPLIER);
  setTickets(id, getTickets(id) + realGain);
  toast(TICKET_MULTIPLIER > 1
    ? `+${realGain} tickets para "${id}" (x${TICKET_MULTIPLIER} boost!)`
    : `+${realGain} tickets para "${id}"`, '🎟️');
}

/* Exponer globalmente para que tienda.js pueda llamarla */
window.addTickets = addTickets;

/* También exponer renderTicketCounts y renderHUDTickets por si la tienda llama */
function renderTicketCounts() { renderTicketsDisplay() }
function renderHUDTickets() {
  const box = $('#hudTickets');
  if (!box) return;
  box.innerHTML = '';
  ROULETTES.forEach(r => {
    const slot = el('div', { className: 'hud-ticket-slot', title: `Tickets para ${r.title}` });
    slot.innerHTML = `<span class="t-ico">${r.icon}</span><span class="t-count">${getTickets(r.id)}</span>`;
    box.appendChild(slot);
  });
}
window.renderTicketCounts = renderTicketCounts;
window.renderHUDTickets   = renderHUDTickets;

/* ═══════════════════════════════════════════════════
   TIEMPO
═══════════════════════════════════════════════════ */
function isWheelActive(wheel) {
  if (!wheel.start && !wheel.end) return true;
  const now = new Date();
  if (wheel.start && now < new Date(wheel.start + 'T00:00:00')) return false;
  if (wheel.end   && now > new Date(wheel.end   + 'T23:59:59')) return false;
  return true;
}

function getTimeUntilStart(wheel) {
  if (!wheel.start) return null;
  const diff = new Date(wheel.start + 'T00:00:00') - new Date();
  return diff > 0 ? diff : 0;
}

function getTimeUntilEnd(wheel) {
  if (!wheel.end) return null;
  const diff = new Date(wheel.end + 'T23:59:59') - new Date();
  return diff > 0 ? diff : 0;
}

function formatTimeRemaining(ms) {
  if (ms <= 0) return 'Finalizada';
  const s = Math.floor(ms / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60), d = Math.floor(h / 24), y = Math.floor(d / 365);
  if (y > 0)  return `${y}a ${d % 365}d`;
  if (d > 0)  return `${d}d ${h % 24}h`;
  if (h > 0)  return `${h}h ${m % 60}m`;
  if (m > 0)  return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function formatTime(sec) {
  const h = String(Math.floor(sec / 3600)).padStart(2,'0');
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2,'0');
  const ss = String(sec % 60).padStart(2,'0');
  return `${h}:${m}:${ss}`;
}

/* ═══════════════════════════════════════════════════
   PITY
═══════════════════════════════════════════════════ */
function getPityEpic(id)     { return parseInt(localStorage.getItem(LS.pityEpic(id))   || '0', 10) }
function setPityEpic(id, v)  { localStorage.setItem(LS.pityEpic(id), String(v)); updatePityIndicator() }
function getPityLegend(id)   { return parseInt(localStorage.getItem(LS.pityLegend(id)) || '0', 10) }
function setPityLegend(id,v) { localStorage.setItem(LS.pityLegend(id), String(v)); updatePityIndicator() }

function updatePityIndicator() {
  const pe = getPityEpic(currentWheelId), pl = getPityLegend(currentWheelId);
  const fillE = $('#pityFillEpic'), fillL = $('#pityFillLegend'), counter = $('#currentPity');
  if (fillE)   fillE.style.width = `${((pe % 20) / 20) * 100}%`;
  if (fillL)   fillL.style.width = `${(pl / 60) * 100}%`;
  if (counter) counter.textContent = `Epic:${20 - (pe % 20)} Leg:${pl}/60`;
  // HUD pity bars
  const hudE = $('#hudPityBarEpic'), hudL = $('#hudPityBarLeg');
  if (hudE) hudE.style.setProperty('--v', (pe % 20) / 20 * 100);
  if (hudL) hudL.style.setProperty('--v', (pl / 60) * 100);
}

/* ═══════════════════════════════════════════════════
   STOCK
═══════════════════════════════════════════════════ */
function getItemStock(id)    { const v = localStorage.getItem(LS.itemStock(id)); return v !== null ? parseInt(v, 10) : null }
function setItemStock(id, s) { if (s === null) localStorage.removeItem(LS.itemStock(id)); else localStorage.setItem(LS.itemStock(id), String(Math.max(0,s))) }

function initItemStocks() {
  ROULETTES.forEach(w => w.rewards.forEach(r => {
    if (r.stock !== null && getItemStock(r.id) === null) setItemStock(r.id, r.stock);
  }));
}

function decreaseItemStock(id) {
  const cur = getItemStock(id);
  if (cur !== null && cur > 0) { setItemStock(id, cur - 1); return true }
  return cur === null;
}

/* ═══════════════════════════════════════════════════
   INVENTARIO
═══════════════════════════════════════════════════ */
function getInventory() { return getLS(LS.inventory, {}) }

function cleanOldInventoryItems() {
  const inv = getInventory(); const now = Date.now(); const TEN_DAYS = 864e6;
  let changed = false;
  Object.keys(inv).forEach(k => {
    if (inv[k].lastObtained && (now - new Date(inv[k].lastObtained).getTime()) > TEN_DAYS) { delete inv[k]; changed = true }
  });
  if (changed) setLS(LS.inventory, inv);
}

function addToInventory(wheelId, reward) {
  const inv = getInventory(); const key = `${wheelId}_${reward.id}`;
  if (!inv[key]) inv[key] = { wheelId, rewardId:reward.id, label:reward.label, img:reward.img, rarity:reward.rarity, count:0, lastObtained:null };
  inv[key].count++;
  inv[key].lastObtained = new Date().toISOString();
  setLS(LS.inventory, inv);
  updateStats({ totalPrizes: (getStats().totalPrizes || 0) + 1 });
  updateInventoryBadge();
}

function updateInventoryBadge() {
  const inv = getInventory(); const badge = $('#invBadge');
  const count = Object.values(inv).filter(i => i.wheelId === currentWheelId).length;
  if (badge) badge.textContent = count;
}

/* ═══════════════════════════════════════════════════
   GIRO CON PITY
═══════════════════════════════════════════════════ */
function pickRewardWithPity(wheelId) {
  const wheel = ROULETTES.find(w => w.id === wheelId); if (!wheel) return null;
  const pe = getPityEpic(wheelId), pl = getPityLegend(wheelId);
  const available = wheel.rewards.filter(r => { const s = getItemStock(r.id); return s === null || s > 0 });
  if (!available.length) { toast('¡No hay más premios disponibles!', '⚠️'); return null }

  const epics   = available.filter(r => r.rarity === 'epic');
  const legends = available.filter(r => r.rarity === 'legend');

  // Garantía legendaria a los 60
  if (pl >= 60 && legends.length) {
    const r = legends[Math.floor(Math.random() * legends.length)];
    setPityLegend(wheelId, 0); setPityEpic(wheelId, pe + 1); return r;
  }
  // Garantía épica cada 20
  if (pe >= 20 && epics.length) {
    const r = epics[Math.floor(Math.random() * epics.length)];
    setPityEpic(wheelId, 0); setPityLegend(wheelId, pl + 1); return r;
  }

  const totalWeight = available.reduce((sum, r) => sum + r.weight, 0);
  let rng = Math.random() * totalWeight;
  for (const r of available) {
    rng -= r.weight; if (rng <= 0) {
      if (r.rarity === 'legend')     { setPityLegend(wheelId, 0);   setPityEpic(wheelId, pe+1) }
      else if (r.rarity === 'epic')  { setPityEpic(wheelId, 0);     setPityLegend(wheelId, pl+1) }
      else                           { setPityEpic(wheelId, pe+1);  setPityLegend(wheelId, pl+1) }
      return r;
    }
  }
  return available[available.length - 1];
}

/* ═══════════════════════════════════════════════════
   RENDERIZADO DE LA RULETA
═══════════════════════════════════════════════════ */
function renderWheel(wheelId) {
  const wheel = ROULETTES.find(w => w.id === wheelId); if (!wheel) return;
  const container = $('#wheel'); container.innerHTML = '';
  const rewards = wheel.rewards, n = rewards.length;
  const size = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--wheel-size')) || 480;
  const radius = size / 2, center = radius, anglePer = 360 / n;

  const wrapper = el('div', { className: 'wheel-wrapper' });
  Object.assign(wrapper.style, {
    width:`${size}px`, height:`${size}px`, position:'relative',
    transformOrigin:'center center', transition:'transform 5s cubic-bezier(0.14,0.9,0.26,1)'
  });

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', size); svg.setAttribute('height', size); svg.style.overflow = 'visible';

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `
    <radialGradient id="gradWheel">
      <stop offset="0%" stop-color="#1a1230"/>
      <stop offset="100%" stop-color="#09080f"/>
    </radialGradient>
    <filter id="innerShadow">
      <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
      <feOffset dx="0" dy="2"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.5"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  `;
  svg.appendChild(defs);

  // Fondo círculo
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  bg.setAttribute('cx', center); bg.setAttribute('cy', center); bg.setAttribute('r', radius);
  bg.setAttribute('fill', 'url(#gradWheel)'); bg.setAttribute('filter', 'url(#innerShadow)');
  svg.appendChild(bg);

  // Sectores
  rewards.forEach((r, i) => {
    const start = (i * anglePer - 90) * Math.PI / 180;
    const end   = ((i+1) * anglePer - 90) * Math.PI / 180;
    const x1 = center + radius * Math.cos(start), y1 = center + radius * Math.sin(start);
    const x2 = center + radius * Math.cos(end),   y2 = center + radius * Math.sin(end);
    const largeArc = anglePer > 180 ? 1 : 0;

    const colorMap = {
      common:   'rgba(148,163,184,0.07)', uncommon: 'rgba(74,222,128,0.10)',
      rare:     'rgba(96,165,250,0.10)',  epic:     'rgba(192,132,252,0.14)',
      legend:   'rgba(251,191,36,0.16)'
    };

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${center},${center} L ${x1},${y1} A ${radius},${radius} 0 ${largeArc} 1 ${x2},${y2} Z`);
    path.setAttribute('fill', colorMap[r.rarity] || 'rgba(255,255,255,0.04)');
    path.setAttribute('stroke', 'rgba(139,92,246,0.18)'); path.setAttribute('stroke-width', '1.5');
    svg.appendChild(path);

    // Separador
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', center); line.setAttribute('y1', center);
    line.setAttribute('x2', x1);    line.setAttribute('y2', y1);
    line.setAttribute('stroke', 'rgba(139,92,246,0.22)'); line.setAttribute('stroke-width', '1');
    svg.appendChild(line);

    // Emoji
    const mid = (start + end) / 2;
    const tx = center + (radius * 0.70) * Math.cos(mid);
    const ty = center + (radius * 0.70) * Math.sin(mid);
    const emoji = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    emoji.setAttribute('x', tx); emoji.setAttribute('y', ty);
    emoji.setAttribute('text-anchor', 'middle'); emoji.setAttribute('alignment-baseline', 'middle');
    emoji.setAttribute('font-size', '20'); emoji.setAttribute('style', 'filter:drop-shadow(0 2px 4px rgba(0,0,0,0.6))');
    emoji.textContent = r.img || '🎁';
    svg.appendChild(emoji);
  });

  // Borde
  const edge = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  edge.setAttribute('cx', center); edge.setAttribute('cy', center); edge.setAttribute('r', radius - 2);
  edge.setAttribute('stroke', 'rgba(139,92,246,0.5)'); edge.setAttribute('stroke-width', '4');
  edge.setAttribute('fill', 'none');
  svg.appendChild(edge);

  wrapper.appendChild(svg); container.appendChild(wrapper);
  updateCurrentWheelInfo(); updatePityIndicator();
  checkWheelLock(wheel); updateSpinButtons();
}

/* ═══════════════════════════════════════════════════
   BLOQUEO
═══════════════════════════════════════════════════ */
function checkWheelLock(wheel) {
  const lockEl = $('#wheelLock'), txt = $('#lockText'), rangeEl = $('#lockRange');
  if (!lockEl || !txt || !rangeEl) return;
  const active = isWheelActive(wheel);
  if (!active) {
    lockEl.hidden = false;
    const ts = getTimeUntilStart(wheel), te = getTimeUntilEnd(wheel);
    if (ts && ts > 0) { txt.textContent = '✨ Próximamente'; rangeEl.textContent = `Inicia en ${formatTimeRemaining(ts)}` }
    else if (te === 0) {
      txt.textContent = '⏳ Finalizada';
      rangeEl.textContent = wheel.end ? `Finalizó el ${new Date(wheel.end + 'T23:59:59').toLocaleDateString('es-ES')}` : 'No disponible';
    } else { txt.textContent = '🔒 Bloqueada'; rangeEl.textContent = 'No disponible' }
  } else { lockEl.hidden = true }
}

function updateSpinButtons() {
  const wheel = ROULETTES.find(w => w.id === currentWheelId); if (!wheel) return;
  const active = isWheelActive(wheel);
  const b1 = $('#btnSpin'), b10 = $('#btnSpin10');
  if (b1)  b1.disabled  = !active || spinning;
  if (b10) b10.disabled = !active || spinning;
}

/* ═══════════════════════════════════════════════════
   GIRO
═══════════════════════════════════════════════════ */
async function spinWheel(times = 1) {
  if (spinning) return;
  const wheel = ROULETTES.find(w => w.id === currentWheelId); if (!wheel) return;
  if (!isWheelActive(wheel)) { toast('Esta ruleta no está disponible', '🔒'); return }

  const tickets = getTickets(currentWheelId);
  if (tickets < times) { toast(`Necesitas ${times} ticket${times > 1 ? 's' : ''} para ${wheel.title}`, '⚠️'); return }

  setTickets(currentWheelId, tickets - times);
  spinning = true; updateSpinButtons();
  updateStats({ totalSpins: (getStats().totalSpins || 0) + times });

  const results = [];
  for (let i = 0; i < times; i++) {
    const reward = pickRewardWithPity(currentWheelId); if (!reward) continue;
    if (!decreaseItemStock(reward.id)) { toast(`${reward.label} agotado`, '⚠️'); continue }
    addToInventory(currentWheelId, reward); results.push(reward);
  }

  if (!results.length) { spinning = false; updateSpinButtons(); return }

  const last = results[results.length - 1];
  const wrapEl = $('.wheel-wrapper');
  if (wrapEl) {
    wrapEl.style.transition = 'none'; wrapEl.style.transform = 'rotate(0deg)'; void wrapEl.offsetWidth;
    const idx = wheel.rewards.findIndex(r => r.id === last.id);
    const anglePer = 360 / wheel.rewards.length;
    const finalRot = 6 * 360 + (270 - (idx * anglePer + anglePer / 2));
    wrapEl.style.transition = 'transform 4.5s cubic-bezier(0.14,0.9,0.26,1)';
    wrapEl.style.transform  = `rotate(${finalRot}deg)`;
  }

  const tickInterval = setInterval(() => beep(120, 0.02), 100);
  await wait(4600);
  clearInterval(tickInterval);

  spinning = false; updateSpinButtons();
  times === 1 ? showPrizeModal(last) : showMultiPrizeModal(results);
  updateLastPrize(last); beep(880, 0.05, 0.06);
}

/* ═══════════════════════════════════════════════════
   MODALES
═══════════════════════════════════════════════════ */
function rarityRGB(rarity) {
  return { common:'148,163,184', uncommon:'74,222,128', rare:'96,165,250', epic:'192,132,252', legend:'251,191,36' }[rarity] || '255,255,255';
}

function openModal(html) {
  const m = $('#modal'), c = $('#modalContent');
  if (!m || !c) return;
  c.innerHTML = html;
  m.setAttribute('aria-hidden', 'false');
}
function closeModal() { $('#modal')?.setAttribute('aria-hidden', 'true') }

function showPrizeModal(reward) {
  openModal(`
    <div style="text-align:center;padding:20px">
      <div style="font-size:80px;margin-bottom:16px;animation:prizeReveal .55s ease">${reward.img}</div>
      <h2 style="color:var(--rarity-${reward.rarity},#c4b5fd);margin-bottom:10px">${reward.label}</h2>
      <p style="color:var(--muted);margin-bottom:18px">${reward.desc}</p>
      <span style="display:inline-block;padding:8px 18px;font-size:.75rem;font-weight:700;text-transform:uppercase;background:rgba(${rarityRGB(reward.rarity)},.2);color:rgba(${rarityRGB(reward.rarity)},1);border-radius:10px">${reward.rarity}</span>
      <div style="margin-top:28px">
        <button class="ctrl-btn primary" onclick="document.getElementById('modal').setAttribute('aria-hidden','true')">¡Genial! 🎉</button>
      </div>
    </div>
  `);
}

function showMultiPrizeModal(rewards) {
  const cards = rewards.map(r => `
    <div class="prize-card ${r.rarity}" style="padding:14px">
      <div class="prize-img">${r.img}</div>
      <div class="prize-name">${r.label}</div>
      <div class="prize-rarity" style="color:rgba(${rarityRGB(r.rarity)},1)">${r.rarity.toUpperCase()}</div>
    </div>
  `).join('');
  openModal(`
    <h2>🎉 Tirada x${rewards.length}</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:14px;margin:24px 0;max-height:55vh;overflow-y:auto">${cards}</div>
    <div style="text-align:center"><button class="ctrl-btn primary large" onclick="document.getElementById('modal').setAttribute('aria-hidden','true')">Continuar ✨</button></div>
  `);
}

function updateLastPrize(reward) {
  const c = $('#lastPrize'); if (!c) return;
  c.innerHTML = `
    <div class="prize-card ${reward.rarity}">
      <div class="prize-img">${reward.img}</div>
      <div class="prize-name">${reward.label}</div>
      <div class="prize-rarity" style="color:rgba(${rarityRGB(reward.rarity)},1)">${reward.rarity.toUpperCase()}</div>
    </div>
  `;
}

/* ═══════════════════════════════════════════════════
   INVENTARIO
═══════════════════════════════════════════════════ */
function showInventory() {
  const inv = getInventory();
  const items = Object.values(inv).filter(i => i.wheelId === currentWheelId);
  const wname = ROULETTES.find(w => w.id === currentWheelId)?.title || currentWheelId;
  if (!items.length) {
    openModal(`<h2>📦 Inventario – ${wname}</h2><p style="color:var(--muted);text-align:center;padding:40px">Aún no has ganado nada aquí.</p><div style="text-align:center;margin-top:20px"><button class="ctrl-btn primary" onclick="document.getElementById('modal').setAttribute('aria-hidden','true')">Cerrar</button></div>`);
    return;
  }
  items.sort((a,b) => { const o={legend:0,epic:1,rare:2,uncommon:3,common:4}; return (o[a.rarity]??5)-(o[b.rarity]??5) });
  const cards = items.map(i => `
    <div class="prize-card ${i.rarity}" style="padding:16px;text-align:center">
      <div style="font-size:2.5rem;margin-bottom:10px">${i.img}</div>
      <div style="font-weight:700;margin-bottom:6px">${i.label}</div>
      <div style="padding:4px 10px;font-size:.68rem;font-weight:700;text-transform:uppercase;background:rgba(${rarityRGB(i.rarity)},.2);color:rgba(${rarityRGB(i.rarity)},1);border-radius:8px;display:inline-block;margin-bottom:10px">${i.rarity}</div>
      <div style="font-size:1.6rem;font-weight:800;color:#c4b5fd">x${i.count}</div>
    </div>
  `).join('');
  openModal(`
    <h2>📦 Inventario – ${wname}</h2>
    <p style="color:var(--muted);text-align:center;margin-bottom:20px">${items.length} tipos · ${items.reduce((s,i)=>s+i.count,0)} items totales</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px;max-height:55vh;overflow-y:auto">${cards}</div>
    <div style="text-align:center;margin-top:20px"><button class="ctrl-btn primary" onclick="document.getElementById('modal').setAttribute('aria-hidden','true')">Cerrar</button></div>
  `);
}

/* ═══════════════════════════════════════════════════
   PREVIEW PREMIOS
═══════════════════════════════════════════════════ */
function showPreview() {
  const wheel = ROULETTES.find(w => w.id === currentWheelId); if (!wheel) return;
  const cards = wheel.rewards.map(r => {
    const s = getItemStock(r.id); const stockText = s !== null ? `Stock: ${s}` : 'Ilimitado';
    return `
      <div class="prize-card ${r.rarity}" style="padding:14px;text-align:center">
        <div style="font-size:2.2rem;margin-bottom:8px">${r.img}</div>
        <div style="font-weight:700;font-size:.82rem;margin-bottom:6px">${r.label}</div>
        <div style="padding:3px 8px;font-size:.65rem;font-weight:700;text-transform:uppercase;background:rgba(${rarityRGB(r.rarity)},.2);color:rgba(${rarityRGB(r.rarity)},1);border-radius:6px;display:inline-block;margin-bottom:6px">${r.rarity}</div>
        <div style="font-size:.68rem;color:var(--muted)">${stockText}</div>
        <div style="font-size:.68rem;color:var(--dim)">${r.desc}</div>
      </div>
    `;
  }).join('');
  openModal(`
    <h2>👁️ Premios – ${wheel.title}</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin:20px 0;max-height:60vh;overflow-y:auto">${cards}</div>
    <div style="text-align:center"><button class="ctrl-btn primary" onclick="document.getElementById('modal').setAttribute('aria-hidden','true')">Cerrar</button></div>
  `);
}

/* ═══════════════════════════════════════════════════
   REGLAS
═══════════════════════════════════════════════════ */
function showRules() {
  openModal(`
    <h2>📜 Reglas del Sistema Gacha</h2>
    <div style="line-height:1.85;color:var(--muted);font-size:.9rem;max-height:60vh;overflow-y:auto;padding-right:10px">
      <h3 style="color:var(--text);margin-top:20px">🎟️ Tickets</h3>
      <ul style="margin:10px 0 10px 18px">
        <li>Cada ruleta tiene sus propios tickets independientes</li>
        <li>Los tickets se compran en la <a href="tienda.html" style="color:var(--a)">Tienda</a> y llegan aquí automáticamente</li>
        <li>También puedes ganarlos completando misiones diarias/semanales</li>
      </ul>
      <h3 style="color:var(--text);margin-top:20px">🎲 Sistema de Pity (Garantía)</h3>
      <ul style="margin:10px 0 10px 18px">
        <li><strong style="color:var(--epic)">Épico garantizado cada 20 tiros</strong> – el contador no se resetea</li>
        <li><strong style="color:var(--legendary)">Legendario garantizado a los 60 tiros</strong> – sí se resetea</li>
        <li>Puedes tener suerte y sacar raridades antes del pity</li>
      </ul>
      <h3 style="color:var(--text);margin-top:20px">📦 Inventario</h3>
      <ul style="margin:10px 0 10px 18px">
        <li>Los items se suman automáticamente (contador x2, x3, etc.)</li>
        <li>Cada ruleta tiene su propio inventario independiente</li>
        <li>Items eliminados automáticamente después de <strong>10 días</strong></li>
      </ul>
      <h3 style="color:var(--text);margin-top:20px">⏱️ Disponibilidad de Ruletas</h3>
      <ul style="margin:10px 0 10px 18px">
        <li><strong style="color:var(--gold)">Clásica:</strong> Permanente ♾️ – siempre disponible</li>
        <li>Las demás ruletas tienen fechas de inicio y fin</li>
        <li>Solo puedes girar ruletas activas en este momento</li>
      </ul>
      <h3 style="color:var(--text);margin-top:20px">🎯 Misiones</h3>
      <ul style="margin:10px 0 10px 18px">
        <li>Diarias: se resetean cada 24h</li>
        <li>Semanales: se resetean cada 7 días</li>
      </ul>
      <h3 style="color:var(--text);margin-top:20px">⚡ Boost x2</h3>
      <ul style="margin:10px 0 10px 18px">
        <li>Duplica los tickets de misiones por 1 hora</li>
        <li>Cooldown hasta medianoche del mismo día</li>
      </ul>
    </div>
    <div style="text-align:center;margin-top:24px">
      <button class="ctrl-btn primary large" onclick="document.getElementById('modal').setAttribute('aria-hidden','true')">Entendido ✅</button>
    </div>
  `);
}

/* ═══════════════════════════════════════════════════
   MÚSICA + FONDO
═══════════════════════════════════════════════════ */
async function playMusic(url) {
  if (currentAudio) currentAudio.pause();
  if (!url) { currentAudio = null; return }
  const audio = new Audio(url); audio.loop = true; audio.volume = 0.35;
  audio.play().catch(() => {}); currentAudio = audio;
}

function updateBackground(wheel) {
  const bgLayer = $('#bgLayer');
  if (bgLayer) {
    bgLayer.style.backgroundImage = wheel.bg ? `url("${wheel.bg}")` : '';
    bgLayer.style.opacity = wheel.bg ? '0.08' : '0';
  }
  playMusic(wheel.music || null);
}

/* ═══════════════════════════════════════════════════
   MISIONES
═══════════════════════════════════════════════════ */
function getMissionsState() { return getLS(LS.missions, {}) }
function setMissionsState(s) { setLS(LS.missions, s) }

function renderMissions() {
  const box = $('#missionsList'); if (!box) return; box.innerHTML = '';
  const state = getMissionsState();
  const missions = MISSIONS_BY_WHEEL[currentWheelId] || [];
  let available = 0;
  const freqIcons = { daily:'🌞', weekly:'📅', monthly:'🌙' };
  missions.forEach(m => {
    const s = state[m.id] || {}; const done = !!s.completedAt;
    if (!done) available++;
    const div = el('div', { className: `mission-item${done ? ' completed' : ''}` });
    div.innerHTML = `
      <div class="mi-ico">${freqIcons[m.freq]||'📋'}</div>
      <div class="mi-body">
        <div class="mi-title">${m.title}</div>
        <div class="mi-desc">${m.desc}</div>
        <div class="mi-tags">
          <span class="mi-tag ${m.freq}">${m.freq}</span>
          <span class="mi-tag reward">🎟️ +${m.reward.count}</span>
        </div>
      </div>
      <button class="mi-btn" ${done ? 'disabled' : ''}>${done ? '✓' : '▶'}</button>
    `;
    div.querySelector('.mi-btn')?.addEventListener('click', () => { if (!done) completeMission(m.id) });
    box.appendChild(div);
  });
  const badge = $('#missionsBadge'); if (badge) badge.textContent = available;
}

function completeMission(id) {
  const state = getMissionsState();
  const missions = Object.values(MISSIONS_BY_WHEEL).flat();
  const m = missions.find(x => x.id === id); if (!m) return;
  if (state[id]?.completedAt) { toast('Misión ya completada', '✓'); return }
  state[id] = { completedAt: Date.now(), lastReset: Date.now() };
  setMissionsState(state);
  addTickets(currentWheelId, m.reward.count);
  renderMissions();
}

function resetMissionsIfNeeded() {
  const state = getMissionsState(); const now = new Date(); let changed = false;
  const allMissions = Object.values(MISSIONS_BY_WHEEL).flat();
  allMissions.forEach(m => {
    const s = state[m.id] || {}; const lastReset = s.lastReset ? new Date(s.lastReset) : null;
    let shouldReset = !lastReset;
    if (lastReset) {
      const diffDays = (now - lastReset) / 864e5;
      if (m.freq === 'daily'   && lastReset.toDateString() !== now.toDateString()) shouldReset = true;
      if (m.freq === 'weekly'  && diffDays >= 7)  shouldReset = true;
      if (m.freq === 'monthly' && diffDays >= 30) shouldReset = true;
    }
    if (shouldReset) { state[m.id] = { completedAt:null, lastReset:now.toISOString() }; changed = true }
  });
  if (changed) setMissionsState(state);
}

/* ═══════════════════════════════════════════════════
   TABS DE RULETAS
═══════════════════════════════════════════════════ */
function renderWheelTabs() {
  const container = $('#wheelTabs'); if (!container) return; container.innerHTML = '';
  ROULETTES.forEach(wheel => {
    const tab = el('div', { className: `wheel-tab${wheel.id === currentWheelId ? ' active' : ''}` });
    const active = isWheelActive(wheel);
    const ts = getTimeUntilStart(wheel), te = getTimeUntilEnd(wheel);
    let timerHtml = '';
    if (te === null)           timerHtml = '<span class="tab-timer permanent">♾️ Permanente</span>';
    else if (ts && ts > 0)     timerHtml = `<span class="tab-timer upcoming" data-wheel="${wheel.id}">🔜 ${formatTimeRemaining(ts)}</span>`;
    else if (te > 0)           timerHtml = `<span class="tab-timer ${te < 604800000 ? 'ending-soon' : ''}" data-wheel="${wheel.id}">⏱️ ${formatTimeRemaining(te)}</span>`;
    else                       timerHtml = '<span class="tab-timer expired">⏳ Finalizada</span>';

    tab.innerHTML = `
      <span class="tab-ico">${wheel.icon}</span>
      <span class="tab-name">${wheel.title}</span>
      <span class="tab-desc">${wheel.desc}</span>
      ${timerHtml}
      <span class="tab-status ${active ? 'active' : 'locked'}"></span>
    `;
    tab.addEventListener('click', () => {
      currentWheelId = wheel.id;
      renderWheelTabs(); renderWheel(wheel.id); renderMissions();
      updateCurrentWheelInfo(); updateBackground(wheel); updateInventoryBadge();
      updateFoxMessage();
    });
    container.appendChild(tab);
  });
}

function updateWheelTimers() {
  ROULETTES.forEach(wheel => {
    const timerEl = $(`.tab-timer[data-wheel="${wheel.id}"]`); if (!timerEl) return;
    const ts = getTimeUntilStart(wheel), te = getTimeUntilEnd(wheel);
    if (ts && ts > 0) { timerEl.textContent = `🔜 ${formatTimeRemaining(ts)}`; timerEl.className = 'tab-timer upcoming' }
    else if (te !== null && te > 0) { timerEl.textContent = `⏱️ ${formatTimeRemaining(te)}`; timerEl.className = te < 604800000 ? 'tab-timer ending-soon' : 'tab-timer' }
  });
  const wheel = ROULETTES.find(w => w.id === currentWheelId);
  if (wheel) { checkWheelLock(wheel); updateSpinButtons() }
}

/* ═══════════════════════════════════════════════════
   INFO RULETA ACTUAL
═══════════════════════════════════════════════════ */
function updateCurrentWheelInfo() {
  const wheel = ROULETTES.find(w => w.id === currentWheelId); if (!wheel) return;
  const nameEl = $('#currentWheelName'), ticketsEl = $('#currentWheelTickets');
  const descEl = $('#wheelDesc'),        expireEl = $('#wheelExpire');
  if (nameEl)    nameEl.textContent = wheel.title;
  if (ticketsEl) ticketsEl.textContent = getTickets(currentWheelId);
  if (descEl)    descEl.textContent = wheel.desc;
  updatePityIndicator();
  if (expireEl) {
    const ts = getTimeUntilStart(wheel), te = getTimeUntilEnd(wheel);
    if (te === null) {
      expireEl.textContent = '♾️ Permanente'; expireEl.style.cssText = 'display:inline-block;background:rgba(251,191,36,.10);border-color:rgba(251,191,36,.2);color:#ffb700';
    } else if (ts && ts > 0) {
      expireEl.textContent = `🔜 Inicia en ${formatTimeRemaining(ts)}`; expireEl.style.cssText = 'display:inline-block;background:rgba(96,165,250,.10);border-color:rgba(96,165,250,.2);color:#60a5fa';
    } else if (te > 0) {
      expireEl.textContent = `⏱️ Termina en ${formatTimeRemaining(te)}`;
      expireEl.style.cssText = te < 604800000
        ? 'display:inline-block;background:rgba(239,68,68,.10);border-color:rgba(239,68,68,.2);color:#ff6b6b'
        : 'display:inline-block;background:rgba(255,165,0,.10);border-color:rgba(255,165,0,.2);color:#ffb700';
    } else { expireEl.style.display = 'none' }
  }
}

/* ═══════════════════════════════════════════════════
   DISPLAY TICKETS
═══════════════════════════════════════════════════ */
function renderTicketsDisplay() {
  const box = $('#ticketsDisplay'); if (!box) return; box.innerHTML = '';
  ROULETTES.forEach(wheel => {
    const badge = el('div', { className: 'ticket-badge' });
    badge.innerHTML = `
      <div class="tb-ico">${wheel.icon}</div>
      <div class="tb-info">
        <div class="tb-name">${wheel.title}</div>
        <div class="tb-count">${getTickets(wheel.id)}</div>
      </div>
    `;
    box.appendChild(badge);
  });
  renderHUDTickets();
}

/* ═══════════════════════════════════════════════════
   BOOST
═══════════════════════════════════════════════════ */
const BOOST_DURATION = 3600; // 1 hora en segundos
let boostState = getLS(LS.boostState, { activeUntil:0, cooldownUntil:0 });
let boostInterval = null;

function getTonightMidnight() { const d = new Date(); d.setHours(24,0,0,0); return d.getTime() }

function updateBoostUI() {
  const now = Date.now(); const btn = $('#multiplierBtn'), timer = $('#boostTimer'), status = $('#boostStatus');
  if (!btn || !timer || !status) return;
  if (boostState.activeUntil > now) {
    const diff = Math.floor((boostState.activeUntil - now) / 1000);
    btn.disabled = true; btn.textContent = 'Activo x2'; timer.textContent = formatTime(diff);
    status.textContent = 'Activo x2'; TICKET_MULTIPLIER = 2;
  } else if (boostState.cooldownUntil > now) {
    const diff = Math.floor((boostState.cooldownUntil - now) / 1000);
    btn.disabled = true; btn.textContent = 'Esperando...'; timer.textContent = formatTime(diff);
    status.textContent = 'En cooldown'; TICKET_MULTIPLIER = 1;
  } else {
    btn.disabled = false; btn.textContent = 'Activar x2'; timer.textContent = '';
    status.textContent = 'Disponible'; TICKET_MULTIPLIER = 1;
  }
}

/* ═══════════════════════════════════════════════════
   ZORRITO NPC
═══════════════════════════════════════════════════ */
function initFox() { updateFoxMessage(); foxMessageInterval = setInterval(updateFoxMessage, 10000) }

function updateFoxMessage() {
  const d = $('#npc-dialog'); if (!d) return;
  const msgs = FOX_MESSAGES[currentWheelId] || FOX_MESSAGES.default;
  d.textContent = msgs[Math.floor(Math.random() * msgs.length)];
}

/* ═══════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════ */
function toast(msg, icon = '✓') {
  const t = $('#toast'); if (!t) return;
  const ico = t.querySelector('.toast-ico'), txt = t.querySelector('.toast-txt');
  if (ico) ico.textContent = icon; if (txt) txt.textContent = msg;
  t.classList.add('show'); clearTimeout(t._tm);
  t._tm = setTimeout(() => t.classList.remove('show'), 3500);
}

/* ═══════════════════════════════════════════════════
   BEEP
═══════════════════════════════════════════════════ */
let _audioCtx = null;
function getAudioCtx() {
  if (!_audioCtx && (window.AudioContext || window.webkitAudioContext))
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _audioCtx;
}
function beep(freq=440, dur=0.03, vol=0.03) {
  const ctx = getAudioCtx(); if (!ctx) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sine'; o.frequency.value = freq; g.gain.value = vol;
  o.connect(g); g.connect(ctx.destination); o.start();
  setTimeout(() => o.stop(), dur * 1000);
}

/* ═══════════════════════════════════════════════════
   PARTÍCULAS
═══════════════════════════════════════════════════ */
function initParticles() {
  const canvas = $('#bgParticles'); if (!canvas) return;
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  const particles = Array.from({ length:55 }, () => ({
    x: Math.random() * canvas.width, y: Math.random() * canvas.height,
    vx:(Math.random()-.5)*.35, vy:(Math.random()-.5)*.35,
    size: Math.random()*2+.5, opacity: Math.random()*.4+.15
  }));
  function animate() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    particles.forEach(p => {
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<0||p.x>canvas.width) p.vx*=-1;
      if(p.y<0||p.y>canvas.height) p.vy*=-1;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
      ctx.fillStyle=`rgba(139,92,246,${p.opacity})`; ctx.fill();
    });
    requestAnimationFrame(animate);
  }
  animate();
  window.addEventListener('resize', () => { canvas.width=window.innerWidth; canvas.height=window.innerHeight });
}

/* ═══════════════════════════════════════════════════
   REVEAL ANIMATION
═══════════════════════════════════════════════════ */
function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-visible'); obs.unobserve(e.target) } });
  }, { threshold: 0.12 });
  $$('.reveal').forEach(el => obs.observe(el));
}

/* ═══════════════════════════════════════════════════
   NAV TOGGLE MÓVIL
═══════════════════════════════════════════════════ */
function initNav() {
  const toggle = $('#navToggle'), links = $('#navLinks');
  if (toggle && links) toggle.addEventListener('click', () => links.classList.toggle('open'));
}

/* ═══════════════════════════════════════════════════
   INICIALIZACIÓN
═══════════════════════════════════════════════════ */
function boot() {
  console.log('🎡 Iniciando sistema de ruletas Moonveil…');
  console.log('📅 Fecha:', new Date().toISOString());
  console.log('🎟️ Tickets se leen desde mv_tickets_<id> (compartida con tienda.js)');

  initItemStocks();
  cleanOldInventoryItems();

  // Dar tickets de inicio si es la primera vez
  ROULETTES.forEach(r => {
    if (localStorage.getItem(LS.tickets(r.id)) === null) {
      localStorage.setItem(LS.tickets(r.id), '5');
      console.log(`✅ 5 tickets iniciales para ${r.id}`);
    }
  });

  resetMissionsIfNeeded();

  // Render principal
  renderWheelTabs();
  renderWheel(currentWheelId);
  renderMissions();
  renderTicketsDisplay();
  renderHUDTickets();
  updateCurrentWheelInfo();
  updatePityIndicator();
  updateBoostUI();
  renderStats();
  updateInventoryBadge();

  // Fondo inicial
  const wheel = ROULETTES.find(w => w.id === currentWheelId);
  if (wheel) updateBackground(wheel);

  // Efectos
  initParticles();
  initReveal();
  initNav();
  initFox();

  // Intervalos
  boostInterval = setInterval(updateBoostUI, 1000);
  timeUpdateInterval = setInterval(() => { updateWheelTimers(); updateCurrentWheelInfo(); }, 1000);

  // Botones
  $('#btnSpin')?.addEventListener('click', () => spinWheel(1));
  $('#btnSpin10')?.addEventListener('click', () => spinWheel(10));
  $('#btnPreview')?.addEventListener('click', showPreview);
  $('#btnInventory')?.addEventListener('click', showInventory);
  $('#btnOpenRules')?.addEventListener('click', showRules);
  $('#modalClose')?.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal() });

  $('#multiplierBtn')?.addEventListener('click', () => {
    const now = Date.now();
    if (boostState.activeUntil > now || boostState.cooldownUntil > now) return;
    boostState.activeUntil = now + BOOST_DURATION * 1000;
    boostState.cooldownUntil = getTonightMidnight();
    setLS(LS.boostState, boostState); updateBoostUI(); toast('¡Boost x2 activado! Dura 1h ⚡', '⚡');
  });

  console.log('✨ Sistema de Ruletas listo');
  console.log('🛒 addTickets(wheelId, count) expuesta globalmente para tienda.js');
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

/* ═══════════════════════════════════════════════════
   API GLOBAL
═══════════════════════════════════════════════════ */
window.MoonveilGacha = { ROULETTES, addTickets, getTickets, getPityEpic, getPityLegend, getInventory, getStats, isWheelActive };