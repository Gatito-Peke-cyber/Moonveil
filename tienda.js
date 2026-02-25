/* =========================================================
   Moonveil Portal — Tienda (JS v3) — Restock por medianoche local
   =========================================================

   CAMBIO PRINCIPAL:
   El restock ya NO se calcula desde el momento de compra.
   Ahora se calcula a partir de la MEDIANOCHE LOCAL:
     - "24h"  → medianoche del día siguiente (00:00:00 de mañana)
     - "7d"   → medianoche de dentro de 7 días
     - "30d"  → medianoche de dentro de 30 días

   ═══════════════════════════════════════════════════════════
   ★ LLAVES DEL CALENDARIO — CÓMO AGREGAR PACKS:
   ═══════════════════════════════════════════════════════════
   Las llaves se añaden al array products con section:'calkeys'
   y el campo calKey con una de estas dos formas:

   // Llave individual:
   calKey: { type: 'normal', amount: 1 }

   // Pack de varias llaves:
   calKey: { pack: true, keys: { normal:1, pink:2, future:1 } }

   Tipos válidos: normal · pink · green · orange · cat · special · future
   Al comprar se suman automáticamente a mv_cal_keys (localStorage
   compartido con calendar.html).
   ═══════════════════════════════════════════════════════════

   CÓMO AGREGAR UN PRODUCTO NORMAL:
   Añade un objeto al array `products`:
   {
     id, name, img, emoji, quality, price, stock,
     restock: null | '24h' | '7d' | '30d',
     expiresAt: null | 'YYYY-MM-DD' | 'YYYY-MM-DDTHH:MM:SS',
     section, gold, desc, tags[], amount (solo tickets)
   }
   ========================================================= */

'use strict';

/* ─────────────────────────────────────
   Utilidades básicas
───────────────────────────────────── */
const $ = (q, ctx = document) => ctx.querySelector(q);
const $$ = (q, ctx = document) => Array.from(ctx.querySelectorAll(q));
const esc = s => String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const now  = () => Date.now();
const H24  = 86400000;
const H1   = 3600000;
const M1   = 60000;
const S1   = 1000;
const fmt  = { format: n => `⟡${n}` };

/* ─────────────────────────────────────
   Medianoche local
───────────────────────────────────── */
function nextMidnightLocal(days) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.getTime();
}

/* ─────────────────────────────────────
   Countdown
───────────────────────────────────── */
function calcCountdown(targetMs) {
  const diff = Math.max(0, targetMs - now());
  if (diff === 0) return { yr: 0, d: 0, h: 0, m: 0, s: 0, expired: true };
  const yr = Math.floor(diff / (365 * H24));
  const rem1 = diff - yr * 365 * H24;
  const d  = Math.floor(rem1 / H24);
  const rem2 = rem1 - d * H24;
  const h  = Math.floor(rem2 / H1);
  const rem3 = rem2 - h * H1;
  const m  = Math.floor(rem3 / M1);
  const s  = Math.floor((rem3 - m * M1) / S1);
  return { yr, d, h, m, s, expired: false };
}

function fmtCD(v) { return String(v).padStart(2, '0') }

function cdBlocksHTML(prefix) {
  return `
    <div class="p-expiry-cd" id="${prefix}-cd">
      <div class="p-cd-block"><span class="p-cd-val" id="${prefix}-yr">--</span><span class="p-cd-lbl">años</span></div>
      <div class="p-cd-block"><span class="p-cd-val" id="${prefix}-d">--</span><span class="p-cd-lbl">días</span></div>
      <div class="p-cd-block"><span class="p-cd-val" id="${prefix}-h">--</span><span class="p-cd-lbl">hrs</span></div>
      <div class="p-cd-block"><span class="p-cd-val" id="${prefix}-m">--</span><span class="p-cd-lbl">min</span></div>
      <div class="p-cd-block"><span class="p-cd-val" id="${prefix}-s">--</span><span class="p-cd-lbl">seg</span></div>
    </div>`;
}

const _cdIntervals = new Map();
function startCountdown(prefix, targetMs) {
  if (_cdIntervals.has(prefix)) { clearInterval(_cdIntervals.get(prefix)); _cdIntervals.delete(prefix); }
  function tick() {
    const el = (id) => document.getElementById(`${prefix}-${id}`);
    const { yr, d, h, m, s, expired } = calcCountdown(targetMs);
    if (el('yr')) el('yr').textContent = fmtCD(yr);
    if (el('d'))  el('d').textContent  = fmtCD(d);
    if (el('h'))  el('h').textContent  = fmtCD(h);
    if (el('m'))  el('m').textContent  = fmtCD(m);
    if (el('s'))  el('s').textContent  = fmtCD(s);
    if (expired) { clearInterval(_cdIntervals.get(prefix)); _cdIntervals.delete(prefix); }
  }
  tick();
  const iv = setInterval(tick, 1000);
  _cdIntervals.set(prefix, iv);
}
function clearAllCountdowns() {
  _cdIntervals.forEach(iv => clearInterval(iv));
  _cdIntervals.clear();
}

function parseDate(str) {
  if (!str) return null;
  const d = new Date(str.includes('T') ? str : str + 'T23:59:59');
  return isNaN(d) ? null : d.getTime();
}

/* ═══════════════════════════════════════════════════════════
   ★ LLAVES DEL CALENDARIO — SISTEMA COMPLETO
   ═══════════════════════════════════════════════════════════ */

/** Clave de localStorage compartida con calendar.js */
const CAL_KEYS_LS = 'mv_cal_keys';

/** Valores por defecto si el calendario nunca se usó */
const CAL_DEFAULT_KEYS = {
  normal: 0, pink: 0, green: 0,
  orange: 0, cat: 0, special: 0, future: 0
};

/** Emojis y nombres para mostrar en toasts y modal */
const CAL_KEY_INFO = {
  normal:  { emoji: '🔵', name: 'Llave Normal'  },
  pink:    { emoji: '💗', name: 'Llave Rosa'     },
  green:   { emoji: '🟢', name: 'Llave Verde'    },
  orange:  { emoji: '🎃', name: 'Llave Naranja'  },
  cat:     { emoji: '😺', name: 'Llave Gato'     },
  special: { emoji: '💜', name: 'Llave Especial' },
  future:  { emoji: '⏩', name: 'Llave Futuro'   },
};

/**
 * Suma llaves al inventario del Calendario.
 * calKey puede ser:
 *   { type:'normal', amount:1 }          ← llave individual
 *   { pack:true, keys:{ normal:1, ... }} ← pack variado
 */
function awardCalendarKeys(calKey) {
  try {
    const raw = localStorage.getItem(CAL_KEYS_LS);
    let keys = raw ? JSON.parse(raw) : { ...CAL_DEFAULT_KEYS };
    // Asegurar que tenga todas las propiedades
    Object.keys(CAL_DEFAULT_KEYS).forEach(k => { if (keys[k] == null) keys[k] = 0; });

    if (calKey.pack && calKey.keys) {
      Object.entries(calKey.keys).forEach(([type, amount]) => {
        if (keys[type] != null) keys[type] += amount;
      });
    } else if (calKey.type) {
      keys[calKey.type] = (keys[calKey.type] || 0) + calKey.amount;
    }

    localStorage.setItem(CAL_KEYS_LS, JSON.stringify(keys));
    return true;
  } catch (e) {
    console.warn('awardCalendarKeys error:', e);
    return false;
  }
}

/**
 * Lee el inventario actual de llaves del calendario.
 * Útil para mostrar cuántas tiene el usuario en el modal.
 */
function getCalendarKeys() {
  try {
    const raw = localStorage.getItem(CAL_KEYS_LS);
    const keys = raw ? JSON.parse(raw) : { ...CAL_DEFAULT_KEYS };
    Object.keys(CAL_DEFAULT_KEYS).forEach(k => { if (keys[k] == null) keys[k] = 0; });
    return keys;
  } catch { return { ...CAL_DEFAULT_KEYS }; }
}

/** Genera texto descriptivo del calKey para toasts y modal */
function describeCalKey(calKey) {
  if (calKey.pack && calKey.keys) {
    return Object.entries(calKey.keys)
      .map(([t, a]) => `${CAL_KEY_INFO[t]?.emoji || '🗝️'} ×${a}`)
      .join('  ');
  }
  const info = CAL_KEY_INFO[calKey.type] || { emoji: '🗝️', name: calKey.type };
  return `${info.emoji} ${info.name} ×${calKey.amount}`;
}

/** Genera HTML compacto (solo iconos + cantidad) para la tarjeta */
function calKeyIconsHTML(calKey) {
  const entries = calKey.pack && calKey.keys
    ? Object.entries(calKey.keys)
    : [[calKey.type, calKey.amount]];
  return entries.map(([t, a]) => {
    const info = CAL_KEY_INFO[t] || { emoji: '🗝️', name: t };
    return `<span class="ck-icon ck-icon-${t}" title="${esc(info.name)} ×${a}">${info.emoji}<sub>×${a}</sub></span>`;
  }).join('');
}

/** Genera HTML de chips completos (nombre + cantidad) para el modal */
function calKeyChipsHTML(calKey) {
  const entries = calKey.pack && calKey.keys
    ? Object.entries(calKey.keys)
    : [[calKey.type, calKey.amount]];

  return entries.map(([t, a]) => {
    const info = CAL_KEY_INFO[t] || { emoji: '🗝️', name: t };
    return `<span class="calkey-chip ck-${t}">${info.emoji} ${info.name} <strong>×${a}</strong></span>`;
  }).join('');
}

/* ─────────────────────────────────────
   DATASET DE PRODUCTOS
───────────────────────────────────── */
const products = [
  /* ===== PASES DE TEMPORADA ===== */
  { id:'s1', emoji:'🏆', name:'Pase Lamento — Temporada I',   img:'img-pass/banwar.jpg',     quality:'legendary', price:128, stock:1, restock:null, expiresAt:null, section:'pases', gold:true,  desc:'Desbloquea recompensas de la temporada de Septiembre.', tags:['pase','cosmético','reto'] },
  { id:'s2', emoji:'🏆', name:'Pase Alma — Temporada II',     img:'img-pass/banhall.jpg',    quality:'legendary', price:128, stock:1, restock:null, expiresAt:null, section:'pases', gold:true,  desc:'Desbloquea recompensas de la temporada de Octubre.', tags:['pase','acelerado'] },
  { id:'s3', emoji:'🏆', name:'Pase 404 — Temporada III',     img:'img-pass/partymine.jpg',  quality:'legendary', price:128, stock:1, restock:null, expiresAt:null, section:'pases', gold:true,  desc:'Desbloquea recompensas de la temporada de Noviembre.', tags:['pase','xp'] },
  { id:'s4', emoji:'🏆', name:'Pase Árboreo — Temporada IV',  img:'img-pass/chrismine.jpg',  quality:'legendary', price:128, stock:1, restock:null, expiresAt:null, section:'pases', gold:true,  desc:'Desbloquea recompensas de la temporada de Diciembre.', tags:['pase','xp'] },
  { id:'s5', emoji:'🏆', name:'Pase Resurge — Temporada V',   img:'img-pass/añomine.jpg',    quality:'legendary', price:128, stock:1, restock:null, expiresAt:null, section:'pases', gold:true,  desc:'Desbloquea recompensas de la temporada de Enero.', tags:['pase','xp'] },
  { id:'s6', emoji:'🏆', name:'Pase Carbón — Temporada VI',   img:'img-pass/banair.jpg',     quality:'legendary', price:128, stock:1, restock:null, expiresAt:null, section:'pases', gold:true,  desc:'Desbloquea recompensas de la temporada de Febrero.', tags:['pase','xp'] },
  { id:'s7', emoji:'🏆', name:'Pase Carbón — Temporada VII',  img:'img-pass/dancingmine.jpg',quality:'legendary', price:128, stock:1, restock:null, expiresAt:null, section:'pases', gold:true,  desc:'Desbloquea recompensas de la temporada de Marzo.', tags:['pase','xp'] },
  { id:'s8', emoji:'🏆', name:'Pase Carbón — Temporada VIII', img:'img-pass/squemine.jpg',   quality:'legendary', price:128, stock:1, restock:null, expiresAt:null, section:'pases', gold:true,  desc:'Desbloquea recompensas de la temporada de Abril.', tags:['pase','xp'] },

  /* ===== COFRES ===== */
  { id:'k1', emoji:'🗝️', name:'Cofre de Ámbar',       img:'img/chest2.gif', quality:'epic',      price:30,  stock:10, restock:'7d', expiresAt:null, section:'llaves', gold:false, desc:'Abre este cofre de Ámbar.', tags:['cofre','epico'] },
  { id:'k2', emoji:'🗝️', name:'Cofre de Sueños',      img:'img/chest2.gif', quality:'epic',      price:30,  stock:10, restock:'7d', expiresAt:null, section:'llaves', gold:false, desc:'Abre este cofre de los Sueños que alguna vez hubo…', tags:['cofre','epico'] },
  { id:'k3', emoji:'🗝️', name:'Cofre de Moonveil',    img:'img/chest2.gif', quality:'legendary', price:10,  stock:10, restock:'7d', expiresAt:null, section:'llaves', gold:true,  desc:'Abre este cofre Moon-Veil.', tags:['cofre','legendario'] },
  { id:'k4', emoji:'🗝️', name:'Cofre de Moonveil II', img:'img/chest2.gif', quality:'legendary', price:30,  stock:5,  restock:'7d', expiresAt:null, section:'llaves', gold:true,  desc:'Abre este cofre Moon por ████.', tags:['cofre','█████'] },

  /* ===== MATERIALES ===== */
  { id:'f1', emoji:'⚙️', name:'Rieles (x64)',              img:'imagen/phantom.gif', quality:'epic',      price:64,  stock:10, restock:'24h', expiresAt:null, section:'cosas', gold:false, desc:'Unos rieles que siempre vienen bien.', tags:['Rieles'] },
  { id:'f2', emoji:'⚙️', name:'Rieles Activadores (x64)',  img:'imagen/phantom.gif', quality:'epic',      price:128, stock:10, restock:'24h', expiresAt:null, section:'cosas', gold:false, desc:'Activemos estos rieles…', tags:['Rieles','velocidad'] },
  { id:'f3', emoji:'⚙️', name:'Rieles (x64) x2',           img:'imagen/phantom.gif', quality:'epic',      price:64,  stock:2,  restock:'7d',  expiresAt:null, section:'cosas', gold:true,  desc:'Un x2 en rieles, ¡guau! Con descuento!', tags:['Rieles'] },
  { id:'f4', emoji:'🧱', name:'Concreto (x64)',             img:'imagen/phantom.gif', quality:'epic',      price:64,  stock:20, restock:'24h', expiresAt:null, section:'cosas', gold:false, desc:'Para construir.', tags:['Concreto','construccion'] },
  { id:'f5', emoji:'🔩', name:'Bloques de Hierro (x64)',    img:'imagen/phantom.gif', quality:'epic',      price:128, stock:10, restock:'7d',  expiresAt:null, section:'cosas', gold:false, desc:'Algunos bloques…', tags:['Bloques'] },
  { id:'f6', emoji:'🔩', name:'Bloques de Hierro (x64) x4', img:'imagen/phantom.gif', quality:'legendary', price:128, stock:1,  restock:null,  expiresAt:null, section:'cosas', gold:true,  desc:'Oferta y demanda, ¿seguro?', tags:['Bloques','Oferta'] },
  { id:'f7', emoji:'💎', name:'Bloques de Diamante (x64) x4',img:'imagen/phantom.gif',quality:'legendary', price:128, stock:1,  restock:null,  expiresAt:null, section:'cosas', gold:true,  desc:'Bueno brillemos…', tags:['Bloques','Oferta'] },
  { id:'f8', emoji:'💚', name:'Esmeralda x1',               img:'imagen/phantom.gif', quality:'legendary', price:1,   stock:1,  restock:null,  expiresAt:null, section:'cosas', gold:true,  desc:'Sand Brill te desea una ¡Gran Navidad!, pero es tan tacaño que no da más de 1 esmeralda…', tags:['Sand','Brill'] },

  /* ===== HISTORIA ===== */
  { id:'l1', emoji:'📚', name:'Libro: "Bosque de Jade"',             img:'img/bookmine.jpg', quality:'rare',      price:256, stock:1, restock:null, expiresAt:null, section:'historia', gold:false, desc:'Leyendas de…', tags:['lore','bioma'] },
  { id:'l2', emoji:'📚', name:'Libro: "La Negra Noche"',             img:'img/bookmine.jpg', quality:'epic',      price:256, stock:1, restock:null, expiresAt:null, section:'historia', gold:false, desc:'Símbolos…', tags:['runas','forja'] },
  { id:'l3', emoji:'📚', name:'Libro: "El lado ███ de S██ B███"',    img:'img/bookcat.gif',  quality:'legendary', price:384, stock:1, restock:null, expiresAt:null, section:'historia', gold:true,  desc:'█████████.', tags:['reliquia','desierto'] },
  { id:'l4', emoji:'📖', name:'Libro A1', img:'img/book.jpg', quality:'epic', price:128, stock:1, restock:null, expiresAt:null, section:'historia', gold:false, desc:'Un libro.', tags:['libro','lectura'] },
  { id:'l5', emoji:'📖', name:'Libro B2', img:'img/book.jpg', quality:'epic', price:128, stock:1, restock:null, expiresAt:null, section:'historia', gold:false, desc:'Un libro.', tags:['libro','lectura'] },
  { id:'l6', emoji:'📖', name:'Libro A2', img:'img/book.jpg', quality:'epic', price:128, stock:1, restock:null, expiresAt:null, section:'historia', gold:false, desc:'Un libro.', tags:['libro','lectura'] },
  { id:'l7', emoji:'📖', name:'Libro C3', img:'img/book.jpg', quality:'epic', price:128, stock:1, restock:null, expiresAt:null, section:'historia', gold:false, desc:'Un libro.', tags:['libro','lectura'] },

  /* ===== LOTE MONEDAS ===== */
  { id:'m1', emoji:'🪙', name:'Pegatina de 1c.',  img:'img/coin.jpg',      quality:'common',    price:0,  stock:1,  restock:'24h', expiresAt:null, section:'materiales', gold:false, desc:'Gratis.', tags:['coin','monedas'] },
  { id:'m2', emoji:'🪙', name:'Bolsita de 30c.',  img:'img/coin.jpg',      quality:'rare',      price:15, stock:10, restock:'7d',  expiresAt:null, section:'materiales', gold:false, desc:'Para trueques y consumibles básicos.', tags:['coin','monedas'] },
  { id:'m3', emoji:'🪙', name:'Pack de 90c.',     img:'img/packcoin.jpg',  quality:'epic',      price:30, stock:10, restock:'7d',  expiresAt:null, section:'materiales', gold:false, desc:'Relación costo/beneficio equilibrada.', tags:['pack-coin','monedas'] },
  { id:'m4', emoji:'🪙', name:'Lote de 120c.',    img:'img/stackcoin.jpg', quality:'legendary', price:60, stock:10, restock:'30d', expiresAt:null, section:'materiales', gold:true,  desc:'Ideal para temporadas.', tags:['stack-coin','monedas'] },

  /* ===== PASES DE EVENTO ===== */
  { id:'e1', emoji:'🎪', name:'Pase en la Oscuridad', img:'img-pass/banhall.jpg',   quality:'legendary', price:256, stock:1, restock:'30d', expiresAt:'2026-12-31', section:'eventos', gold:true,  desc:'Algo tal vez... Se acerca…', tags:['evento','acuático'] },
  { id:'e2', emoji:'🐱', name:'Pase Gatos 😺✨',       img:'img-pass/catsparty.jpg', quality:'legendary', price:256, stock:1, restock:'30d', expiresAt:'2026-08-17', section:'eventos', gold:false, desc:'Gatos y más gatos… ¿Gatos?', tags:['evento','nocturno'] },

  /* ===== PACK DE MONEDAS ===== */
  { id:'c1', emoji:'💰', name:'Pack de 128r.', img:'img/coin.jpg',      quality:'common', price:64,  stock:999, restock:null, expiresAt:null, section:'monedas', gold:false, desc:'Para trueques y consumibles básicos. (2 stacks)', tags:['monedas','pack'] },
  { id:'c2', emoji:'💰', name:'Pack de 256r.', img:'img/packcoin.jpg',  quality:'rare',   price:128, stock:999, restock:null, expiresAt:null, section:'monedas', gold:false, desc:'Relación costo/beneficio equilibrada. (4 stacks)', tags:['monedas','pack'] },
  { id:'c3', emoji:'💰', name:'Pack de 384r.', img:'img/stackcoin.jpg', quality:'epic',   price:256, stock:999, restock:null, expiresAt:null, section:'monedas', gold:true,  desc:'Ideal para temporadas completas. (6 stacks)', tags:['monedas','pack'] },

  /* ===== TICKETS ===== */
  { id:'t_classic_1',   emoji:'🎫', name:'Ticket Clásico',              img:'imagen/ticket5.jpg', quality:'epic', price:10, stock:10, restock:'24h', expiresAt:null, amount:1,  section:'tickets', gold:false, desc:'Ticket para la ruleta clásica.', tags:['ticket','clasico'] },
  { id:'t_elemental_1', emoji:'🎫', name:'Ticket 1 de Cobre',           img:'imagen/ticket5.jpg', quality:'epic', price:10, stock:10, restock:'24h', expiresAt:null, amount:1,  section:'tickets', gold:false, desc:'Ticket para la ruleta elemental.', tags:['ticket','elemental'] },
  { id:'t_event_1',     emoji:'🎫', name:'Ticket Evento',               img:'imagen/ticket5.jpg', quality:'epic', price:10, stock:10, restock:'24h', expiresAt:null, amount:1,  section:'tickets', gold:false, desc:'Ticket para la ruleta de eventos.', tags:['ticket','evento'] },
  { id:'t_classic_2',   emoji:'🎫', name:'Ticket Clásico x5',           img:'imagen/ticket5.jpg', quality:'epic', price:30, stock:10, restock:'24h', expiresAt:null, amount:5,  section:'tickets', gold:false, desc:'Ticket para la ruleta clásica x5.', tags:['ticket','clasico'] },
  { id:'t_elemental_2', emoji:'🎫', name:'Ticket 1 de Cobre x5',        img:'imagen/ticket5.jpg', quality:'epic', price:30, stock:10, restock:'24h', expiresAt:null, amount:5,  section:'tickets', gold:false, desc:'Ticket para la ruleta elemental x5.', tags:['ticket','elemental'] },
  { id:'t_event_2',     emoji:'🎫', name:'Ticket Evento x5',            img:'imagen/ticket5.jpg', quality:'epic', price:30, stock:10, restock:'24h', expiresAt:null, amount:5,  section:'tickets', gold:false, desc:'Ticket para la ruleta de eventos x5.', tags:['ticket','evento'] },
  { id:'t_classic_3',   emoji:'🎉', name:'¡Bienvenida a los tickets!!', img:'imagen/ticket5.jpg', quality:'epic', price:0,  stock:1,  restock:null,  expiresAt:null, amount:10, section:'tickets', gold:true,  desc:'Ticket para la ruleta clásica x10.', tags:['ticket','clasico'] },
  { id:'t_classic_4',   emoji:'🎰', name:'Tiros Gratis!!',              img:'imagen/ticket5.jpg', quality:'epic', price:0,  stock:1,  restock:'30d', expiresAt:null, amount:10, section:'tickets', gold:true,  desc:'Ticket para la ruleta clásica x10.', tags:['ticket','clasico'] },
  { id:'t_elemental_3', emoji:'🎫', name:'Ticket 1 de Cobre x5',        img:'imagen/ticket5.jpg', quality:'epic', price:10, stock:1,  restock:null,  expiresAt:null, amount:5,  section:'tickets', gold:false, desc:'Ticket para la ruleta elemental x5.', tags:['ticket','elemental'] },
  { id:'t_elemental_4', emoji:'🎫', name:'Ticket 1 de Cobre x1',        img:'imagen/ticket5.jpg', quality:'epic', price:1,  stock:1,  restock:null,  expiresAt:null, amount:1,  section:'tickets', gold:false, desc:'Ticket para la ruleta elemental x1.', tags:['ticket','elemental'] },

  /* ═══════════════════════════════════════════════════════════
     ★ LLAVES DEL CALENDARIO
     Para agregar más packs: copia cualquiera de estos objetos,
     cambia id (único), name, price, stock, restock y el campo calKey.
     ═══════════════════════════════════════════════════════════ */

  /* — LLAVES INDIVIDUALES — */
  {
    id:'ck_normal', emoji:'🔵', name:'Llave Normal',
    img:'img/keys1.jpg', quality:'rare', price:30, stock:10,
    restock:'7d', expiresAt:null, section:'calkeys', gold:false,
    desc:'Recupera un día perdido en el Calendario de Recompensas. No caduca.',
    tags:['llave','calendario','recuperar'],
    calKey: { type:'normal', amount:1 }
  },
  {
    id:'ck_pink', emoji:'💗', name:'Llave Rosa',
    img:'img/keys1.jpg', quality:'epic', price:50, stock:5,
    restock:'30d', expiresAt:null, section:'calkeys', gold:false,
    desc:'Llave especial de San Valentín, Día de la Madre y Día del Padre. Da ×2 en la barra de XP.',
    tags:['llave','festival','amor'],
    calKey: { type:'pink', amount:1 }
  },
  {
    id:'ck_green', emoji:'🟢', name:'Llave Verde',
    img:'img/keys1.jpg', quality:'epic', price:50, stock:5,
    restock:'30d', expiresAt:null, section:'calkeys', gold:false,
    desc:'Llave de Navidad y Año Nuevo. Da ×2 en la barra de XP durante esas festividades.',
    tags:['llave','navidad','año nuevo'],
    calKey: { type:'green', amount:1 }
  },
  {
    id:'ck_orange', emoji:'🎃', name:'Llave Naranja',
    img:'img/keys1.jpg', quality:'epic', price:50, stock:5,
    restock:'30d', expiresAt:null, section:'calkeys', gold:false,
    desc:'Llave de Halloween y Black Friday. Da ×2 durante esas temporadas.',
    tags:['llave','halloween','black friday'],
    calKey: { type:'orange', amount:1 }
  },
  {
    id:'ck_cat', emoji:'😺', name:'Llave Gato',
    img:'img/keys1.jpg', quality:'epic', price:60, stock:3,
    restock:'30d', expiresAt:null, section:'calkeys', gold:false,
    desc:'Llave exclusiva del Día del Gato y Día del Perro. Da ×3 en la barra. ¡Meow!',
    tags:['llave','gato','especial'],
    calKey: { type:'cat', amount:1 }
  },
  {
    id:'ck_special', emoji:'💜', name:'Llave Especial',
    img:'img/keys1.jpg', quality:'epic', price:60, stock:3,
    restock:'30d', expiresAt:null, section:'calkeys', gold:false,
    desc:'Para días únicos: Día de la Tierra, del Agua, del Niño. Da ×2 en la barra.',
    tags:['llave','especial','días especiales'],
    calKey: { type:'special', amount:1 }
  },
  {
    id:'ck_future', emoji:'⏩', name:'Llave Futuro',
    img:'img/keys1.jpg', quality:'legendary', price:100, stock:2,
    restock:'30d', expiresAt:null, section:'calkeys', gold:true,
    desc:'¡Rarísima! Permite reclamar días que aún no llegaron (hasta 2 días en el futuro). Úsala con sabiduría.',
    tags:['llave','futuro','rara','especial'],
    calKey: { type:'future', amount:1 }
  },

  /* — PACKS DE LLAVES — */
  /* ★ Para agregar un pack nuevo, copia este bloque y ajusta los valores ★ */
  {
    id:'ck_pack_all', emoji:'🎁', name:'Pack Definitivo — 1 de Cada Llave',
    img:'img/keys1.jpg', quality:'legendary', price:280, stock:1,
    restock:'30d', expiresAt:null, section:'calkeys', gold:true,
    desc:'¡El pack supremo! Incluye 1 llave de cada tipo: Normal, Rosa, Verde, Naranja, Gato, Especial y Futuro.',
    tags:['llave','pack','todas','definitivo'],
    calKey: { pack:true, keys:{ normal:1, pink:1, green:1, orange:1, cat:1, special:1, future:1 } }
  },
  {
    id:'ck_pack_3normal', emoji:'🔵', name:'Pack: 3 Llaves Normales',
    img:'img/keys1.jpg', quality:'rare', price:75, stock:5,
    restock:'7d', expiresAt:null, section:'calkeys', gold:false,
    desc:'3 Llaves Normales de una vez. Para recuperar varios días perdidos sin buscar una a una.',
    tags:['llave','pack','normal'],
    calKey: { pack:true, keys:{ normal:3 } }
  },
  {
    id:'ck_pack_festival', emoji:'🌟', name:'Pack Festival — Rosa + Verde + Naranja',
    img:'img/keys1.jpg', quality:'epic', price:120, stock:3,
    restock:'30d', expiresAt:null, section:'calkeys', gold:false,
    desc:'Pack de festividades: 1 Llave Rosa, 1 Verde y 1 Naranja. Perfectas para las épocas de celebración.',
    tags:['llave','pack','festival'],
    calKey: { pack:true, keys:{ pink:1, green:1, orange:1 } }
  },
  {
    id:'ck_pack_starter', emoji:'🌀', name:'Pack Inicio — Normal x2 + Futuro x1',
    img:'img/keys1.jpg', quality:'epic', price:180, stock:3,
    restock:'30d', expiresAt:null, section:'calkeys', gold:true,
    desc:'Pack para empezar fuerte: 2 Llaves Normales para recuperar días perdidos y 1 Llave Futuro para adelantarte.',
    tags:['llave','pack','inicio','futuro'],
    calKey: { pack:true, keys:{ normal:2, future:1 } }
  },
];

/* ─────────────────────────────────────
   Persistencia en localStorage
───────────────────────────────────── */
const RESTOCK_DAYS = { '24h': 1, '7d': 7, '30d': 30 };

const LS = {
  stock:   id => `mv_stock_${id}`,
  restock: id => `mv_restock_${id}`,

  getStock(p)  {
    const v = localStorage.getItem(this.stock(p.id));
    return v == null ? p.stock : Math.max(0, parseInt(v, 10) || 0);
  },
  setStock(p, v) {
    localStorage.setItem(this.stock(p.id), String(Math.max(0, v|0)));
  },
  getNext(p) {
    const v = localStorage.getItem(this.restock(p.id));
    return v == null ? this.calcNext(p) : (v === 'null' ? null : Number(v));
  },
  setNext(p, ts) {
    localStorage.setItem(this.restock(p.id), ts == null ? 'null' : String(ts));
  },
  calcNext(p) {
    if (!p.restock) return null;
    const days = RESTOCK_DAYS[p.restock];
    if (!days) return null;
    return nextMidnightLocal(days);
  },
};

function syncStocks() {
  products.forEach(p => {
    if (localStorage.getItem(LS.stock(p.id)) == null) {
      LS.setStock(p, p.stock);
    }
    if (localStorage.getItem(LS.restock(p.id)) == null) {
      LS.setNext(p, null);
    } else {
      const ts = LS.getNext(p);
      if (ts && ts <= now()) {
        LS.setStock(p, p.stock);
        LS.setNext(p, LS.calcNext(p));
      }
    }
  });
}

/* ─────────────────────────────────────
   Tiempo amigable
───────────────────────────────────── */
function timeLeft(ts) {
  const diff = Math.max(0, ts - now());
  const rD = Math.floor(diff / H24);
  const h = Math.floor((diff % H24) / H1);
  const m = Math.floor((diff % H1) / M1);
  const s = Math.floor((diff % M1) / S1);
  if (rD >= 1) return `${rD}d ${h}h`;
  if (h  >= 1) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}

/* ─────────────────────────────────────
   Estado UI
───────────────────────────────────── */
let filteredSection = 'all';
let searchText = '';
let currentProduct = null;

/* ─────────────────────────────────────
   RENDER PRINCIPAL
───────────────────────────────────── */
function renderAll() {
  clearAllCountdowns();

  const matches = p => {
    const secOk = filteredSection === 'all' || p.section === filteredSection;
    const q = (searchText || '').trim().toLowerCase();
    const txt = `${p.name} ${p.quality} ${p.desc} ${(p.tags||[]).join(' ')}`.toLowerCase();
    return secOk && (!q || txt.includes(q));
  };
  const arr = products.filter(matches);

  const grids = {
    pases:     'gridSeason',
    llaves:    'gridKeys',
    cosas:     'gridFun',
    historia:  'gridLore',
    materiales:'gridMats',
    eventos:   'gridEvents',
    monedas:   'gridCoins',
    tickets:   'gridTickets',
    calkeys:   'gridCalKeys',   // ★ NUEVO
  };
  const secNames = {
    pases:     'No hay pases disponibles.',
    llaves:    'No hay cofres por ahora.',
    cosas:     'Sin materiales disponibles.',
    historia:  'No hay historia disponible.',
    materiales:'Sin monedas disponibles.',
    eventos:   'No hay eventos activos.',
    monedas:   'No hay packs de monedas.',
    tickets:   'No hay tickets en este momento.',
    calkeys:   'Sin llaves disponibles por ahora.',  // ★ NUEVO
  };

  const pendingCDs = [];

  Object.entries(grids).forEach(([sec, gridId]) => {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    const items = arr.filter(p => p.section === sec);
    if (!items.length) {
      grid.innerHTML = `<div class="p-empty">${esc(secNames[sec] || 'Sin productos.')}</div>`;
      return;
    }
    grid.innerHTML = items.map((p, i) => {
      const { html, cdEntry } = cardHTML(p, i);
      if (cdEntry) pendingCDs.push(cdEntry);
      return html;
    }).join('');
  });

  $$('[data-open]').forEach(b => b.addEventListener('click', () => openModal(b.dataset.open)));
  $$('[data-buy]').forEach(b  => b.addEventListener('click', () => buyItem(b.dataset.buy)));

  pendingCDs.forEach(({ prefix, targetMs }) => startCountdown(prefix, targetMs));

  $$('.shop-sec').forEach(sec => {
    const s = sec.dataset.sec;
    const hasContent = filteredSection === 'all' || filteredSection === s;
    sec.style.display = hasContent ? '' : 'none';
  });
}

/* ─────────────────────────────────────
   TEMPLATE DE TARJETA
───────────────────────────────────── */
function cardHTML(p, idx) {
  const st    = LS.getStock(p);
  const next  = LS.getNext(p);
  const isOut = st <= 0;
  const qCl   = `q-${p.quality}`;
  const goldCl = p.gold ? 'gold' : '';
  const expiryMs = parseDate(p.expiresAt);

  let expirySection = '';
  let cdEntry = null;
  if (expiryMs && !isOut) {
    const prefix = `cd-card-${p.id}`;
    expirySection = `
      <div class="p-expiry-wrap">
        <div class="p-expiry-lbl">⏰ Caduca en:</div>
        ${cdBlocksHTML(prefix)}
      </div>`;
    cdEntry = { prefix, targetMs: expiryMs };
  }

  const restockTag = p.restock
    ? `<span class="p-restock-tag">↻ Restock: ${p.restock}</span>`
    : '';

  const outOverlay = `
    <div class="out-overlay">
      <div class="out-badge">
        <strong>AGOTADO</strong>
        ${next ? `<span class="out-restock">↻ en: ${timeLeft(next)}</span>` : '<span style="font-size:.75rem;color:#9ca3af">Sin restock</span>'}
      </div>
    </div>`;

  const tags = (p.tags || []).map(t => `<span class="p-tag">#${esc(t)}</span>`).join('');

  const amountBadge = p.amount && p.amount > 1
    ? `<span class="p-tag" style="background:rgba(96,165,250,.12);border-color:rgba(96,165,250,.3);color:#93c5fd">🎫 x${p.amount}</span>`
    : '';

  // ★ Mini iconos compactos para tarjetas calkeys (solo emojis + cantidad)
  const calKeyIcons = p.calKey
    ? `<div class="calkey-mini-icons">${calKeyIconsHTML(p.calKey)}</div>`
    : '';

  return {
    html: `
    <article class="p-card ${qCl} ${goldCl} ${isOut ? 'is-out' : ''}" style="animation-delay:${idx * .05}s">
      <div class="p-card-img">
        <img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy">
        ${isOut ? outOverlay : ''}
        <div class="p-chips">
          <span class="p-chip ${qCl}">${qualityLabel(p.quality)}</span>
          ${p.gold ? '<span class="p-chip c-gold">★ Destacado</span>' : ''}
        </div>
      </div>
      <div class="p-card-body">
        <h3 class="p-card-name">${p.emoji ? p.emoji+' ' : ''}${esc(p.name)}</h3>
        ${calKeyIcons}
        <p class="p-card-desc">${esc(p.desc)}</p>
        <div class="p-divider"></div>
        <div class="p-price-row">${renderPrice(p)}</div>
        ${expirySection}
        ${restockTag}
        <div class="p-tags">${tags}${amountBadge}</div>
      </div>
      <div class="p-card-foot">
        <span class="p-stock">📦 Stock: ${st}</span>
        <div class="p-actions">
          <button class="btn-detail" data-open="${p.id}">Detalles</button>
          <button class="btn-buy" data-buy="${p.id}" ${isOut ? 'disabled' : ''}>${p.calKey ? 'Obtener' : 'Comprar'}</button>
        </div>
      </div>
    </article>`,
    cdEntry
  };
}

function qualityLabel(q) {
  return { legendary:'Legendario', epic:'Épico', rare:'Raro', common:'Común' }[q] || q;
}
function sectionLabel(s) {
  return {
    pases:'Pases de temporada', llaves:'Cofres', cosas:'Materiales',
    historia:'Historia', materiales:'Lote de Monedas', eventos:'Pases de Evento',
    monedas:'Pack de Monedas', tickets:'Tickets',
    calkeys:'Llaves del Calendario'   // ★ NUEVO
  }[s] || s;
}

/* ─────────────────────────────────────
   FILTROS Y BÚSQUEDA
───────────────────────────────────── */
$('#chipSections')?.addEventListener('click', e => {
  const btn = e.target.closest('.chip');
  if (!btn) return;
  $$('.chip', $('#chipSections')).forEach(c => c.classList.remove('is-on'));
  btn.classList.add('is-on');
  filteredSection = btn.dataset.section;
  renderAll();
  toast(`Filtro: ${filteredSection === 'all' ? 'Todo' : btn.textContent.trim()}`);
});
$('#searchInput')?.addEventListener('input', e => { searchText = e.target.value || ''; renderAll(); });
$('#clearSearch')?.addEventListener('click', () => { if ($('#searchInput')) $('#searchInput').value = ''; searchText = ''; renderAll(); });

/* ─────────────────────────────────────
   MODAL
───────────────────────────────────── */
function openModal(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  currentProduct = p;

  const st = LS.getStock(p);
  const next = LS.getNext(p);
  const expiryMs = parseDate(p.expiresAt);

  if ($('#modalEmoji')) $('#modalEmoji').textContent = p.emoji || '🛒';
  if ($('#modalTitle')) $('#modalTitle').textContent  = p.name;

  let cdSection = '';
  if (expiryMs) {
    cdSection = `
      <div class="m-section">
        <div class="m-sec-title">⏰ Fecha de caducidad</div>
        <div class="m-cd-wrap">
          <div class="m-cd-block"><span class="m-cd-val" id="mcd-yr">--</span><span class="m-cd-lbl">años</span></div>
          <div class="m-cd-block"><span class="m-cd-val" id="mcd-d">--</span><span class="m-cd-lbl">días</span></div>
          <div class="m-cd-block"><span class="m-cd-val" id="mcd-h">--</span><span class="m-cd-lbl">horas</span></div>
          <div class="m-cd-block"><span class="m-cd-val" id="mcd-m">--</span><span class="m-cd-lbl">minutos</span></div>
          <div class="m-cd-block"><span class="m-cd-val" id="mcd-s">--</span><span class="m-cd-lbl">segundos</span></div>
          <span class="m-cd-note">Expira el ${p.expiresAt}</span>
        </div>
      </div>`;
  }

  // ★ Sección especial para llaves del calendario
  let calKeySection = '';
  if (p.calKey) {
    const currentKeys = getCalendarKeys();
    const entries = p.calKey.pack && p.calKey.keys
      ? Object.entries(p.calKey.keys)
      : [[p.calKey.type, p.calKey.amount]];

    const keyRows = entries.map(([t, a]) => {
      const info = CAL_KEY_INFO[t] || { emoji:'🗝️', name:t };
      const owned = currentKeys[t] || 0;
      return `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:rgba(245,166,35,.05);border:1px solid rgba(245,166,35,.1);border-radius:8px;margin-bottom:6px">
        <span style="font-size:1rem">${info.emoji} <strong style="color:var(--text)">${info.name}</strong></span>
        <span style="display:flex;align-items:center;gap:10px">
          <span style="font-family:'Space Mono',monospace;color:#fde68a;font-size:.95rem">+${a}</span>
          <span style="font-size:.72rem;color:var(--muted)">Tienes: ${owned}</span>
        </span>
      </div>`;
    }).join('');

    calKeySection = `
      <div class="m-section">
        <div class="m-sec-title">🔑 Llaves que recibirás</div>
        <div style="background:rgba(245,166,35,.04);border:1px solid rgba(245,166,35,.12);border-radius:12px;padding:12px">
          ${keyRows}
          <p style="font-size:.75rem;color:var(--muted);margin-top:8px;text-align:center">
            Las llaves se suman automáticamente al <strong style="color:#fcd472">Calendario de Recompensas</strong> al comprar.
          </p>
        </div>
      </div>`;
  }

  const tags = (p.tags||[]).map(t=>`<span class="p-tag">#${esc(t)}</span>`).join('');
  const qColor = {legendary:'rgba(245,158,11,.2)',epic:'rgba(168,85,247,.18)',rare:'rgba(56,189,248,.18)',common:'rgba(156,163,175,.12)'}[p.quality]||'rgba(255,255,255,.08)';
  const qBorder = {legendary:'rgba(245,158,11,.45)',epic:'rgba(168,85,247,.38)',rare:'rgba(56,189,248,.3)',common:'rgba(156,163,175,.2)'}[p.quality]||'rgba(255,255,255,.1)';
  const qText = {legendary:'#fde68a',epic:'#d8b4fe',rare:'#7dd3fc',common:'#d1d5db'}[p.quality]||'#e5e7eb';

  let restockDesc = 'Este artículo no se reabastece automáticamente.';
  if (p.restock) {
    const labels = { '24h': 'cada día a medianoche', '7d': 'cada 7 días a medianoche', '30d': 'cada 30 días a medianoche' };
    restockDesc = `Se reabastece <strong style="color:var(--text)">${labels[p.restock] || p.restock}</strong> (hora local).${next ? ` Próximo en <strong style="color:var(--a)">${timeLeft(next)}</strong>.` : ''}`;
  }

  $('#modalBody').innerHTML = `
    <div class="m-hero">
      <div class="m-img"><img src="${esc(p.img)}" alt="${esc(p.name)}"></div>
      <div class="m-info">
        <span class="m-quality-chip" style="background:${qColor};border:1px solid ${qBorder};color:${qText}">
          ${qualityLabel(p.quality)}${p.gold?' · ★ Destacado':''}
        </span>
        <p class="m-desc">${esc(p.desc)}</p>
        <div class="m-meta-grid">
          <div class="m-meta-item">💰 Precio: <strong>${fmt.format(p.price)}</strong></div>
          <div class="m-meta-item">📦 Stock: <strong>${st}</strong></div>
          <div class="m-meta-item">🏷️ Sección: <strong>${sectionLabel(p.section)}</strong></div>
          <div class="m-meta-item">↻ Restock: <strong>${p.restock || 'No aplica'}</strong></div>
        </div>
        <div class="p-tags">${tags}</div>
      </div>
    </div>
    ${calKeySection}
    ${cdSection}
    <div class="m-section">
      <div class="m-sec-title">📋 Notas</div>
      <p style="font-size:.88rem;color:var(--muted);line-height:1.65">
        ${restockDesc}
        La compra descuenta directamente el stock disponible.
        ${p.amount ? `<br>Otorga <strong style="color:var(--a)">${p.amount} ticket${p.amount>1?'s':''}</strong> al completar la compra.` : ''}
        ${p.calKey ? `<br>Las llaves se entregan automáticamente al <strong style="color:#fcd472">Calendario de Recompensas</strong>.` : ''}
      </p>
    </div>
  `;

  if (expiryMs) {
    setTimeout(() => {
      function tickModal() {
        const { yr, d, h, m, s, expired } = calcCountdown(expiryMs);
        const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = fmtCD(v) };
        set('mcd-yr', yr); set('mcd-d', d); set('mcd-h', h); set('mcd-m', m); set('mcd-s', s);
        if (expired) clearInterval(window._modalCDIv);
      }
      clearInterval(window._modalCDIv);
      tickModal();
      window._modalCDIv = setInterval(tickModal, 1000);
    }, 50);
  }

  $('#modalBuy').disabled = st <= 0;
  $('#modalBuy').textContent = p.calKey ? '🗝️ Obtener Llave(s)' : '🛒 Comprar';
  const modal = $('#productModal');
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = $('#productModal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  clearInterval(window._modalCDIv);
  currentProduct = null;
}

$('#modalOverlay')?.addEventListener('click', closeModal);
$('#modalClose')?.addEventListener('click', closeModal);
$('#modalCloseBtn')?.addEventListener('click', closeModal);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal() });
$('#modalBuy')?.addEventListener('click', () => { if (currentProduct) buyItem(currentProduct.id, { keepModal: true }) });

/* ─────────────────────────────────────
   DETECCIÓN DE TICKETS
───────────────────────────────────── */
function detectTicketInfo(product) {
  const info = { isTicket: false, wheelId: null, count: 0 };
  if (typeof product.id === 'string' && product.id.startsWith('t_')) {
    const parts = product.id.split('_');
    if (parts.length >= 2 && parts[1]) {
      let wheel = parts.slice(1).join('_');
      wheel = wheel.replace(/_\d+$/, '');
      info.isTicket = true;
      info.wheelId  = wheel;
      info.count    = product.amount ?? 1;
      return info;
    }
  }
  if (Array.isArray(product.tags) && product.tags.includes('ticket')) {
    const name = (product.name || '').toLowerCase();
    if (name.includes('clásic') || name.includes('classic')) {
      info.isTicket = true; info.wheelId = 'classic'; info.count = product.amount ?? 1; return info;
    }
    if (name.includes('místic') || name.includes('mystic') || name.includes('mística')) {
      info.isTicket = true; info.wheelId = 'mystic'; info.count = product.amount ?? 1; return info;
    }
    if (name.includes('elemental')) {
      info.isTicket = true; info.wheelId = 'elemental'; info.count = product.amount ?? 1; return info;
    }
    if (name.includes('evento') || name.includes('event')) {
      info.isTicket = true; info.wheelId = 'event'; info.count = product.amount ?? 1; return info;
    }
    info.isTicket = true; info.wheelId = null; info.count = product.amount ?? 1;
    return info;
  }
  return info;
}

/* ─────────────────────────────────────
   ENTREGA DE TICKETS A LA RULETA
───────────────────────────────────── */
function awardTicketsToWheel(wheelId, count) {
  if (!wheelId) return false;
  try {
    if (typeof addTickets === 'function') {
      addTickets(wheelId, count);
    } else {
      const key = `mv_tickets_${wheelId}`;
      const cur = parseInt(localStorage.getItem(key) || '0', 10);
      localStorage.setItem(key, String(Math.max(0, cur + (count|0))));
    }
    if (typeof renderTicketCounts === 'function') try { renderTicketCounts(); } catch(e) {}
    if (typeof renderHUDTickets   === 'function') try { renderHUDTickets();   } catch(e) {}
    return true;
  } catch(e) {
    console.warn('awardTicketsToWheel error:', e);
    return false;
  }
}

/* ─────────────────────────────────────
   COMPRA DE ITEMS
───────────────────────────────────── */
function buyItem(id, opts = {}) {
  const p = products.find(x => x.id === id);
  if (!p) return;

  let st = LS.getStock(p);
  if (st <= 0) { toast('Artículo agotado ❌'); return; }

  st -= 1;
  LS.setStock(p, st);

  if (st <= 0 && p.restock) {
    LS.setNext(p, LS.calcNext(p));
  }

  // ★ LLAVES DEL CALENDARIO
  if (p.calKey) {
    const gave = awardCalendarKeys(p.calKey);
    if (gave && opts.toastMsg !== false) {
      const desc = describeCalKey(p.calKey);
      toast(`🗝️ ¡Llave(s) añadidas al Calendario! ${desc}`);
    } else if (!gave) {
      toast(`Comprado: ${p.name} — revisa el Calendario`);
    }
  }
  // Tickets a la ruleta
  else {
    const ticketInfo = detectTicketInfo(p);
    if (ticketInfo.isTicket) {
      const gave = ticketInfo.wheelId ? awardTicketsToWheel(ticketInfo.wheelId, ticketInfo.count) : false;
      if (gave) {
        const displayWheel = ticketInfo.wheelId ? ticketInfo.wheelId : 'ruleta';
        if (opts.toastMsg !== false) toast(`Comprado: ${p.name} — +${ticketInfo.count} ticket(s) para ${displayWheel}`);
      } else {
        if (opts.toastMsg !== false) toast(`Comprado: ${p.name} — Ticket guardado localmente`);
      }
    } else {
      if (opts.toastMsg !== false) toast(`Comprado: ${p.name}`);
    }
  }

  // Cupón cooldown
  if (currentCoupon && currentCoupon !== 0) {
    setCouponCooldown(currentCoupon, nextCouponMidnight());
    currentCoupon = 0;
    saveCurrentCoupon();
    renderCouponUI();
  }

  renderAll();
  if (opts.keepModal && currentProduct?.id === id) openModal(id);
}

// Función global para entregar tickets desde fuera de la tienda
window.buyTickets = function(wheelId, amount) {
  try {
    addTickets(wheelId, amount);
    toast(`Has recibido ${amount} ticket(s) de la ruleta ${wheelId}`);
  } catch(e) {
    console.error(e);
    toast('Error al entregar los tickets.');
  }
};

/* ─────────────────────────────────────
   CUPONES
───────────────────────────────────── */
const ALL_COUPONS = [10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100];
const COUPON_LS_KEY = 'mv_coupon_state';
const CURRENT_COUPON_KEY = 'mv_current_coupon';

function loadCouponState() {
  try {
    const raw = localStorage.getItem(COUPON_LS_KEY);
    if (!raw) { const s={}; ALL_COUPONS.forEach(c=>s[c]=0); localStorage.setItem(COUPON_LS_KEY,JSON.stringify(s)); return s; }
    return JSON.parse(raw);
  } catch(e) { const s={}; ALL_COUPONS.forEach(c=>s[c]=0); return s; }
}
function saveCouponState(s) { localStorage.setItem(COUPON_LS_KEY, JSON.stringify(s)) }
function getCouponCooldown(pct) { return Number(loadCouponState()[String(pct)] || 0) }
function setCouponCooldown(pct, ts) { const s=loadCouponState(); s[String(pct)]=ts||0; saveCouponState(s) }

function nextCouponMidnight() { return nextMidnightLocal(1); }

let currentCoupon = Number(localStorage.getItem(CURRENT_COUPON_KEY) || 0);
function saveCurrentCoupon() { localStorage.setItem(CURRENT_COUPON_KEY, String(currentCoupon)) }

function renderCouponUI() {
  const box = $('#couponList');
  if (!box) return;
  const nowTs = now();
  const state = loadCouponState();
  let dirty = false;
  ALL_COUPONS.forEach(c => { const cd=Number(state[c]||0); if (cd>0&&cd<=nowTs){state[c]=0;dirty=true;} });
  if (dirty) saveCouponState(state);

  box.innerHTML = ALL_COUPONS.map(c => {
    const cd = getCouponCooldown(c);
    const active = cd > nowTs;
    const selected = currentCoupon === c;
    if (active) return `<button class="coupon-card" aria-disabled="true" data-percent="${c}">${c}%<span class="cd">↻ ${timeLeft(cd)}</span></button>`;
    return `<button class="coupon-card" data-percent="${c}" data-active="${selected}">${c}%${selected?'<span class="cd">✓ activo</span>':''}</button>`;
  }).join('');

  box.querySelectorAll('.coupon-card:not([aria-disabled="true"])').forEach(btn => {
    btn.addEventListener('click', () => {
      const pct = Number(btn.dataset.percent);
      currentCoupon = currentCoupon === pct ? 0 : pct;
      saveCurrentCoupon(); renderCouponUI(); renderAll();
    });
  });
}
setInterval(renderCouponUI, 1000);

document.addEventListener('click', e => {
  if (e.target?.id === 'couponClearBtn') { currentCoupon=0; saveCurrentCoupon(); renderCouponUI(); renderAll(); }
});

function renderPrice(p) {
  const base = Number(p.price);
  // Los productos de llaves no tienen descuento por cupón (opcional — quitar este if si quieres que sí aplique)
  if (!currentCoupon) return `<span class="p-price-main">${fmt.format(base)}</span>`;
  const final = Math.max(0, Math.round(base - base * currentCoupon / 100));
  return `<span class="p-price-old">${fmt.format(base)}</span><span class="p-price-new">${fmt.format(final)}</span>`;
}

/* ─────────────────────────────────────
   NAVBAR
───────────────────────────────────── */
const navToggle = $('#navToggle');
const navLinks  = $('#navLinks');
navToggle?.addEventListener('click', e => { e.stopPropagation(); navLinks.classList.toggle('open') });
document.addEventListener('click', e => { if (!navToggle?.contains(e.target) && !navLinks?.contains(e.target)) navLinks?.classList.remove('open') });

/* ─────────────────────────────────────
   HUD bars
───────────────────────────────────── */
$$('.hud-bar').forEach(b => b.style.setProperty('--v', b.dataset.val || 50));

/* ─────────────────────────────────────
   PARTÍCULAS (ámbar)
───────────────────────────────────── */
(function particles() {
  const c = $('#bgParticles');
  if (!c) return;
  const ctx = c.getContext('2d');
  const dpi = Math.max(1, devicePixelRatio || 1);
  let w, h, parts;
  const init = () => {
    w = c.width = innerWidth * dpi;
    h = c.height = innerHeight * dpi;
    parts = Array.from({ length: 80 }, () => ({
      x: Math.random()*w, y: Math.random()*h,
      r: (.5 + Math.random()*1.6)*dpi, s: .2 + Math.random()*.7,
      a: .06 + Math.random()*.2,
      hue: 28 + Math.random()*24
    }));
  };
  const tick = () => {
    ctx.clearRect(0, 0, w, h);
    parts.forEach(p => {
      p.y += p.s; p.x += Math.sin(p.y * .0012) * .3;
      if (p.y > h) { p.y = -10; p.x = Math.random()*w; }
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = `hsla(${p.hue},80%,62%,${p.a})`;
      ctx.fill();
    });
    requestAnimationFrame(tick);
  };
  init(); tick(); addEventListener('resize', init);
})();

/* ─────────────────────────────────────
   PARALLAX
───────────────────────────────────── */
(function parallax() {
  const layers = $$('.layer');
  if (!layers.length) return;
  const k = [0, .025, .055, .09];
  const onScroll = () => { const y = scrollY; layers.forEach((el, i) => el.style.transform = `translateY(${y*k[i]}px)`) };
  onScroll(); addEventListener('scroll', onScroll, { passive: true });
})();

/* ─────────────────────────────────────
   REVEAL ON SCROLL
───────────────────────────────────── */
(function reveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); obs.unobserve(e.target) } });
  }, { threshold: .12 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
})();

/* ─────────────────────────────────────
   TOAST
───────────────────────────────────── */
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toast._id);
  toast._id = setTimeout(() => t.classList.remove('show'), 2400);
}

/* ─────────────────────────────────────
   MÚSICA
───────────────────────────────────── */
const audio = document.getElementById("bg-music");
const musicButton = document.querySelector(".floating-music");

if (audio && musicButton) {
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

  window.addEventListener("DOMContentLoaded", () => {
    const musicState = localStorage.getItem("music");
    if (musicState === "on") {
      audio.play().then(() => {
        musicButton.classList.add("active");
      }).catch(() => {
        console.log("Esperando interacción del usuario para reproducir.");
      });
    }
  });
}

/* ─────────────────────────────────────
   INIT
───────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const yr = document.getElementById('y');
  if (yr) yr.textContent = new Date().getFullYear();

  syncStocks();
  renderCouponUI();
  renderAll();

  if (localStorage.getItem('music') === 'on' && audio) {
    audio.play().then(() => { musicButton?.classList.add('active') }).catch(() => {});
  }

  toast('✨ Tienda Moonveil cargada — ¡Bienvenido!');
});

/* ═══════════════════════════════════════════════════════════
   SISTEMA DE FESTIVIDADES
   ══════════════════════════════════════════════════════════ */

const FESTIVE_CONFIG = {
  NUEVO_ANO:   { id:'NUEVO_ANO',   inicio:new Date('2025-12-31'), fin:new Date('2026-01-06T23:59:59'), prioridad:100, nombre:'Año Nuevo' },
  SAN_VALENTIN:{ id:'SAN_VALENTIN',inicio:new Date('2026-02-13'), fin:new Date('2026-02-15T23:59:59'), prioridad:95,  nombre:'San Valentín' },
  CARNAVAL:    { id:'CARNAVAL',    inicio:new Date('2026-02-10'), fin:new Date('2026-02-27T23:59:59'), prioridad:90,  nombre:'Carnaval' },
  DIA_GATO:    { id:'DIA_GATO',    inicio:new Date('2026-08-01'), fin:new Date('2026-08-30T23:59:59'), prioridad:70,  nombre:'Día del Gato' },
  SAN_PATRICIO:{ id:'SAN_PATRICIO',inicio:new Date('2026-03-15'), fin:new Date('2026-03-18T23:59:59'), prioridad:80,  nombre:'San Patricio' },
  PASCUA:      { id:'PASCUA',      inicio:new Date('2026-04-03'), fin:new Date('2026-04-06T23:59:59'), prioridad:85,  nombre:'Pascua' },
  DIA_MADRE:   { id:'DIA_MADRE',   inicio:new Date('2026-05-08'), fin:new Date('2026-05-11T23:59:59'), prioridad:75,  nombre:'Día de la Madre' },
  DIA_PADRE:   { id:'DIA_PADRE',   inicio:new Date('2026-06-19'), fin:new Date('2026-06-22T23:59:59'), prioridad:75,  nombre:'Día del Padre' },
  HALLOWEEN:   { id:'HALLOWEEN',   inicio:new Date('2026-10-25'), fin:new Date('2026-11-01T23:59:59'), prioridad:95,  nombre:'Halloween' },
  DIA_MUERTOS: { id:'DIA_MUERTOS', inicio:new Date('2026-11-01'), fin:new Date('2026-11-03T23:59:59'), prioridad:90,  nombre:'Día de Muertos' },
  NAVIDAD:     { id:'NAVIDAD',     inicio:new Date('2026-12-01'), fin:new Date('2026-12-30T23:59:59'), prioridad:100, nombre:'Navidad' },
  PRIMAVERA:   { id:'PRIMAVERA',   inicio:new Date('2026-03-20'), fin:new Date('2026-06-20T23:59:59'), prioridad:10,  nombre:'Primavera' },
  VERANO:      { id:'VERANO',      inicio:new Date('2026-06-21'), fin:new Date('2026-09-22T23:59:59'), prioridad:10,  nombre:'Verano' },
  OTONO:       { id:'OTONO',       inicio:new Date('2026-09-23'), fin:new Date('2026-12-20T23:59:59'), prioridad:10,  nombre:'Otoño' },
};

const COLOR_PALETTES = {
  NUEVO_ANO:   ['#FFD700','#FF1744','#2196F3','#4CAF50','#FF6B9D','#9C27B0','#00BCD4','#FF5722'],
  SAN_VALENTIN:['#FF1493','#FF69B4','#DC143C','#FF6B9D','#C71585'],
  CARNAVAL:    ['#FF3B30','#FF9500','#FFCC00','#4CD964','#007AFF','#5856D6','#FF2D55'],
  SAN_PATRICIO:['#00FF00','#32CD32','#228B22','#90EE90'],
  HALLOWEEN:   ['#FF6600','#8B00FF','#FF4500','#9932CC'],
  NAVIDAD:     ['#C41E3A','#0F8B3E','#FFD700','#FFFFFF'],
};

class FestMgr {
  constructor() { this.ivs = new Map(); this.els = new Set(); this.maxEls = 200; }
  isActive(c) { const n = new Date(); return n >= c.inicio && n <= c.fin; }
  clean(el, t=0) {
    setTimeout(() => { try { if (el?.parentNode) { el.remove(); this.els.delete(el); } } catch(e) {} }, t);
  }
  stopAll() {
    this.ivs.forEach(iv => clearInterval(iv)); this.ivs.clear();
    this.els.forEach(el => { try { el.remove(); } catch(e) {} }); this.els.clear();
  }
  rnd(a,b) { return Math.random()*(b-a)+a; }
  rndI(a,b){ return Math.floor(this.rnd(a,b)); }
  pick(arr) { return arr[Math.floor(Math.random()*arr.length)]; }
}

class AnoNuevoMgr extends FestMgr {
  start() {
    if (!this.isActive(FESTIVE_CONFIG.NUEVO_ANO) || this.ivs.has('p')) return;
    const c = document.getElementById('newyear-fireworks'); if (!c) return;
    for (let i=0; i<5; i++) setTimeout(()=>this.rocket(), i*500);
    this.ivs.set('p', setInterval(()=>{ if(this.els.size<this.maxEls) this.rocket(); }, 1000+Math.random()*600));
  }
  rocket() {
    const c = document.getElementById('newyear-fireworks'); if (!c) return;
    const el = document.createElement('div');
    el.className = 'newyear-rocket festive-element';
    const col = this.pick(COLOR_PALETTES.NUEVO_ANO);
    el.style.cssText = `color:${col};left:${this.rnd(10,90)}vw;width:${this.rnd(8,14)}px;height:${this.rnd(25,40)}px;animation-duration:${this.rnd(1.2,2)}s`;
    c.appendChild(el); this.els.add(el);
    el.addEventListener('animationend', () => {
      const r = el.getBoundingClientRect();
      this.explode(r.left + r.width/2, r.top + r.height/2, col);
      this.clean(el);
    });
    this.clean(el, 3000);
  }
  explode(x, y, col) {
    const c = document.getElementById('newyear-fireworks'); if (!c) return;
    for (let i=0; i<60; i++) {
      const p = document.createElement('div'); p.className = 'newyear-burst festive-element';
      const pc = Math.random()>.7 ? this.pick(COLOR_PALETTES.NUEVO_ANO) : col;
      const ang = (Math.PI*2*i)/60 + this.rnd(-0.2,0.2);
      const dist = this.rnd(70,150);
      p.style.cssText = `background:${pc};color:${pc};left:${x}px;top:${y}px;width:${this.rnd(4,10)}px;height:${this.rnd(4,10)}px;animation-duration:${this.rnd(0.8,1.4)}s`;
      p.style.setProperty('--dx', Math.cos(ang)*dist+'px');
      p.style.setProperty('--dy', Math.sin(ang)*dist+'px');
      c.appendChild(p); this.els.add(p); this.clean(p, 1600);
    }
    for (let i=0; i<12; i++) {
      const t = document.createElement('div'); t.className = 'newyear-trail festive-element';
      t.style.cssText = `background:${col};left:${x}px;top:${y}px;animation-duration:${this.rnd(0.6,1)}s`;
      const ang = (Math.PI*2*i)/12;
      t.style.setProperty('--dy', Math.sin(ang)*30+'px');
      c.appendChild(t); this.els.add(t); this.clean(t, 1200);
    }
    const txt = document.createElement('span'); txt.className = 'newyear-year-text festive-element';
    txt.style.cssText = `left:${x}px;top:${y}px`;
    txt.textContent = '2026';
    c.appendChild(txt); this.els.add(txt); this.clean(txt, 2200);
  }
}

class SanValentinMgr extends FestMgr {
  constructor() { super(); this.elementos = ['🌹','❤️','💗','💖','💕','🌷','💞','💝','💘']; this.corazones = ['❤️','💖','💗','💕']; }
  start() {
    if (!this.isActive(FESTIVE_CONFIG.SAN_VALENTIN) || this.ivs.has('p')) return;
    const cp = document.getElementById('valentine-petals');
    const ch = document.getElementById('valentine-hearts');
    if (cp) {
      for (let i=0; i<30; i++) setTimeout(()=>this.petal(), i*200);
      this.ivs.set('p', setInterval(()=>{ if(this.els.size<this.maxEls) this.petal(); }, 350));
    }
    if (ch) {
      for (let i=0; i<6; i++) setTimeout(()=>this.heart(), i*700);
      this.ivs.set('h', setInterval(()=>{ if(this.els.size<this.maxEls) this.heart(); }, 1600+Math.random()*800));
    }
  }
  petal() {
    const c = document.getElementById('valentine-petals'); if (!c) return;
    const el = document.createElement('div'); el.className = 'valentine-rose-petal festive-element';
    el.textContent = this.pick(this.elementos);
    el.style.left = this.rnd(0,100)+'%'; el.style.fontSize = this.rnd(18,32)+'px';
    el.style.setProperty('--swing-1', this.rnd(-80,80)+'px');
    el.style.setProperty('--swing-2', this.rnd(-100,100)+'px');
    el.style.setProperty('--swing-3', this.rnd(-60,60)+'px');
    el.style.setProperty('--rotate-1', this.rnd(-90,90)+'deg');
    el.style.setProperty('--rotate-2', this.rnd(-180,180)+'deg');
    el.style.setProperty('--rotate-3', this.rnd(-270,270)+'deg');
    const dur = this.rnd(10,16); el.style.animationDuration = dur+'s';
    c.appendChild(el); this.els.add(el); this.clean(el, dur*1000+500);
  }
  heart() {
    const c = document.getElementById('valentine-hearts'); if (!c) return;
    const el = document.createElement('div'); el.className = 'valentine-heart-float festive-element';
    el.textContent = this.pick(this.corazones);
    el.style.fontSize = this.rnd(32,56)+'px'; el.style.left = this.rnd(5,90)+'vw';
    el.style.setProperty('--swing-x', this.rnd(-80,80)+'px');
    el.style.setProperty('--swing-x-2', this.rnd(-100,100)+'px');
    el.style.setProperty('--rotate-angle', this.rnd(-30,30)+'deg');
    el.style.setProperty('--rotate-final', this.rnd(-360,360)+'deg');
    const dur = this.rnd(4,6); el.style.animationDuration = dur+'s';
    c.appendChild(el); this.els.add(el); this.clean(el, dur*1000+500);
  }
}

class DiaGatoMgr extends FestMgr {
  constructor() { super(); this.gatos = ['🐱','😺','😸','😹','😻','🐈','😼','😽']; }
  start() {
    if (!this.isActive(FESTIVE_CONFIG.DIA_GATO) || this.ivs.has('p')) return;
    const c = document.getElementById('catday-ground'); if (!c) return;
    for (let i=0; i<8; i++) setTimeout(()=>this.gato(), i*1200);
    this.ivs.set('p', setInterval(()=>{ if(this.els.size<20) this.gato(); }, 2500+Math.random()*1500));
  }
  gato() {
    const c = document.getElementById('catday-ground'); if (!c) return;
    const el = document.createElement('div'); el.className = 'catday-walking festive-element';
    el.textContent = this.pick(this.gatos);
    el.style.fontSize = this.rnd(35,60)+'px'; el.style.bottom = this.rnd(5,35)+'vh';
    const dur = this.rnd(7,11); el.style.animationDuration = dur+'s';
    c.appendChild(el); this.els.add(el); this.clean(el, dur*1000+500);
  }
}

class SanPatricioMgr extends FestMgr {
  constructor() { super(); this.elementos = ['🍀','☘️','💚']; }
  start() {
    if (!this.isActive(FESTIVE_CONFIG.SAN_PATRICIO) || this.ivs.has('p')) return;
    const c = document.getElementById('stpatrick-clovers'); if (!c) return;
    for (let i=0; i<25; i++) setTimeout(()=>this.trebol(), i*250);
    this.ivs.set('p', setInterval(()=>{ if(this.els.size<this.maxEls) this.trebol(); }, 450));
  }
  trebol() {
    const c = document.getElementById('stpatrick-clovers'); if (!c) return;
    const el = document.createElement('div'); el.className = 'stpatrick-clover festive-element';
    el.textContent = this.pick(this.elementos);
    el.style.left = this.rnd(0,100)+'%'; el.style.fontSize = this.rnd(20,36)+'px';
    el.style.setProperty('--swing-a', this.rnd(-90,90)+'px');
    el.style.setProperty('--swing-b', this.rnd(-110,110)+'px');
    el.style.setProperty('--swing-c', this.rnd(-70,70)+'px');
    el.style.setProperty('--rotate-a', this.rnd(-120,120)+'deg');
    el.style.setProperty('--rotate-b', this.rnd(-240,240)+'deg');
    el.style.setProperty('--rotate-c', this.rnd(-360,360)+'deg');
    const dur = this.rnd(9,14); el.style.animationDuration = dur+'s';
    c.appendChild(el); this.els.add(el); this.clean(el, dur*1000+500);
  }
}

class PascuaMgr extends FestMgr {
  constructor() { super(); this.elementos = ['🐰','🥚','🐣','🐤','🌷','🌸','🐇','🌺']; }
  start() {
    if (!this.isActive(FESTIVE_CONFIG.PASCUA) || this.ivs.has('p')) return;
    const c = document.getElementById('easter-elements'); if (!c) return;
    for (let i=0; i<22; i++) setTimeout(()=>this.elem(), i*300);
    this.ivs.set('p', setInterval(()=>{ if(this.els.size<this.maxEls) this.elem(); }, 500));
  }
  elem() {
    const c = document.getElementById('easter-elements'); if (!c) return;
    const el = document.createElement('div'); el.className = 'easter-bouncing festive-element';
    el.textContent = this.pick(this.elementos);
    el.style.left = this.rnd(0,100)+'%'; el.style.fontSize = this.rnd(20,34)+'px';
    el.style.setProperty('--bounce-y-1', this.rnd(15,25)+'vh');
    el.style.setProperty('--bounce-y-2', this.rnd(40,50)+'vh');
    el.style.setProperty('--bounce-x-1', this.rnd(-30,30)+'px');
    el.style.setProperty('--bounce-x-2', this.rnd(-50,50)+'px');
    el.style.setProperty('--bounce-r-1', this.rnd(-45,45)+'deg');
    el.style.setProperty('--bounce-r-2', this.rnd(-90,90)+'deg');
    el.style.setProperty('--final-x', this.rnd(-40,40)+'px');
    el.style.setProperty('--final-r', this.rnd(-180,180)+'deg');
    const dur = this.rnd(8,12); el.style.animationDuration = dur+'s';
    c.appendChild(el); this.els.add(el); this.clean(el, dur*1000+500);
  }
}

class DiaMadreMgr extends FestMgr {
  constructor() { super(); this.flores = ['🌹','🌺','🌸','🌻','🌷','💐','🌼','🏵️']; }
  start() {
    if (!this.isActive(FESTIVE_CONFIG.DIA_MADRE) || this.ivs.has('p')) return;
    const c = document.getElementById('mothersday-flowers'); if (!c) return;
    for (let i=0; i<28; i++) setTimeout(()=>this.flor(), i*250);
    this.ivs.set('p', setInterval(()=>{ if(this.els.size<this.maxEls) this.flor(); }, 380));
  }
  flor() {
    const c = document.getElementById('mothersday-flowers'); if (!c) return;
    const el = document.createElement('div'); el.className = 'mothersday-elegant-flower festive-element';
    el.textContent = this.pick(this.flores);
    el.style.left = this.rnd(0,100)+'%'; el.style.fontSize = this.rnd(22,38)+'px';
    el.style.setProperty('--drift-1', this.rnd(-70,70)+'px');
    el.style.setProperty('--drift-2', this.rnd(-90,90)+'px');
    el.style.setProperty('--drift-3', this.rnd(-60,60)+'px');
    el.style.setProperty('--spin-1', this.rnd(-90,90)+'deg');
    el.style.setProperty('--spin-2', this.rnd(-180,180)+'deg');
    el.style.setProperty('--spin-3', this.rnd(-270,270)+'deg');
    const dur = this.rnd(10,15); el.style.animationDuration = dur+'s';
    c.appendChild(el); this.els.add(el); this.clean(el, dur*1000+500);
  }
}

class HalloweenMgr extends FestMgr {
  constructor() { super(); this.elementos = ['🎃','💀','🕷️','🧙','🦇']; this.fantasmas = ['👻']; }
  start() {
    if (!this.isActive(FESTIVE_CONFIG.HALLOWEEN) || this.ivs.has('p')) return;
    const c = document.getElementById('halloween-spooky'); if (!c) return;
    for (let i=0; i<30; i++) setTimeout(()=>this.elem(), i*200);
    this.ivs.set('p', setInterval(()=>{ if(this.els.size<this.maxEls) this.elem(); }, 330));
    for (let i=0; i<3; i++) setTimeout(()=>this.fantasma(), i*1500);
    this.ivs.set('f', setInterval(()=>{ if(this.els.size<this.maxEls) this.fantasma(); }, 4000+Math.random()*3000));
    this.ivs.set('b', setInterval(()=>{ if(Math.random()>.6&&this.els.size<this.maxEls) this.murcielago(); }, 3000));
  }
  elem() {
    const c = document.getElementById('halloween-spooky'); if (!c) return;
    const el = document.createElement('div'); el.className = 'halloween-spooky-element festive-element';
    el.textContent = this.pick(this.elementos);
    el.style.left = this.rnd(0,100)+'%'; el.style.fontSize = this.rnd(22,40)+'px';
    el.style.setProperty('--drift-a', this.rnd(-80,80)+'px');
    el.style.setProperty('--drift-b', this.rnd(-100,100)+'px');
    el.style.setProperty('--drift-c', this.rnd(-70,70)+'px');
    el.style.setProperty('--rot-a', this.rnd(-120,120)+'deg');
    el.style.setProperty('--rot-b', this.rnd(-240,240)+'deg');
    el.style.setProperty('--rot-c', this.rnd(-360,360)+'deg');
    const dur = this.rnd(8,13); el.style.animationDuration = dur+'s';
    c.appendChild(el); this.els.add(el); this.clean(el, dur*1000+500);
  }
  fantasma() {
    const c = document.getElementById('halloween-spooky'); if (!c) return;
    const el = document.createElement('div'); el.className = 'halloween-ghost-float festive-element';
    el.textContent = this.pick(this.fantasmas);
    el.style.fontSize = this.rnd(45,70)+'px'; el.style.left = this.rnd(10,80)+'vw';
    const dur = this.rnd(4,6); el.style.animationDuration = dur+'s';
    c.appendChild(el); this.els.add(el); this.clean(el, dur*1000+500);
  }
  murcielago() {
    const c = document.getElementById('halloween-spooky'); if (!c) return;
    const el = document.createElement('div'); el.className = 'halloween-bat-fly festive-element';
    el.textContent = '🦇'; el.style.fontSize = this.rnd(25,45)+'px';
    el.style.top = this.rnd(10,60)+'vh';
    const dur = this.rnd(3,5); el.style.animationDuration = dur+'s';
    c.appendChild(el); this.els.add(el); this.clean(el, dur*1000+500);
  }
}

class DiaMuertosMgr extends FestMgr {
  constructor() { super(); this.elementos = ['🌼','💀','🕯️','🌺','🦴','🪦']; }
  start() {
    if (!this.isActive(FESTIVE_CONFIG.DIA_MUERTOS) || this.ivs.has('p')) return;
    const c = document.getElementById('dayofdead-marigolds'); if (!c) return;
    for (let i=0; i<25; i++) setTimeout(()=>this.flor(), i*280);
    this.ivs.set('p', setInterval(()=>{ if(this.els.size<this.maxEls) this.flor(); }, 420));
  }
  flor() {
    const c = document.getElementById('dayofdead-marigolds'); if (!c) return;
    const el = document.createElement('div'); el.className = 'dayofdead-marigold festive-element';
    el.textContent = this.pick(this.elementos);
    el.style.left = this.rnd(0,100)+'%'; el.style.fontSize = this.rnd(20,36)+'px';
    el.style.setProperty('--float-1', this.rnd(-75,75)+'px');
    el.style.setProperty('--float-2', this.rnd(-95,95)+'px');
    el.style.setProperty('--float-3', this.rnd(-65,65)+'px');
    el.style.setProperty('--turn-1', this.rnd(-100,100)+'deg');
    el.style.setProperty('--turn-2', this.rnd(-200,200)+'deg');
    el.style.setProperty('--turn-3', this.rnd(-300,300)+'deg');
    const dur = this.rnd(9,14); el.style.animationDuration = dur+'s';
    c.appendChild(el); this.els.add(el); this.clean(el, dur*1000+500);
  }
}

class NavidadMgr extends FestMgr {
  constructor() { super(); this.copos = ['❄','❅','❆']; }
  start() {
    if (!this.isActive(FESTIVE_CONFIG.NAVIDAD) || this.ivs.has('p')) return;
    const c = document.getElementById('christmas-snowfall'); if (!c) return;
    for (let i=0; i<40; i++) setTimeout(()=>this.copo(), i*150);
    this.ivs.set('p', setInterval(()=>{ if(this.els.size<this.maxEls) this.copo(); }, 180));
  }
  copo() {
    const c = document.getElementById('christmas-snowfall'); if (!c) return;
    const el = document.createElement('div'); el.className = 'christmas-snowflake festive-element';
    el.textContent = this.pick(this.copos);
    el.style.left = this.rnd(0,100)+'%'; el.style.fontSize = this.rnd(12,28)+'px';
    el.style.opacity = this.rnd(0.4,0.9).toFixed(2);
    el.style.setProperty('--drift', this.rnd(-50,50)+'px');
    el.style.setProperty('--spin', this.rnd(-360,360)+'deg');
    const dur = this.rnd(10,18); el.style.animationDuration = dur+'s';
    c.appendChild(el); this.els.add(el); this.clean(el, dur*1000+500);
  }
}

class CarnavalMgr extends FestMgr {
  constructor() { super(); this.formas = ['●','■','▲','◆','★','♦','♥','♣','♠']; }
  start() {
    if (!this.isActive(FESTIVE_CONFIG.CARNAVAL) || this.ivs.has('confeti')) return;
    const cc = document.getElementById('carnival-confetti');
    const cf = document.getElementById('carnival-fireworks');
    if (cc) {
      for (let i=0; i<35; i++) setTimeout(()=>this.confeti(), i*120);
      this.ivs.set('confeti', setInterval(()=>{ if(this.els.size<this.maxEls) this.confeti(); }, 160));
    }
    if (cf) {
      for (let i=0; i<5; i++) setTimeout(()=>this.rocket(), i*600);
      this.ivs.set('fuegos', setInterval(()=>{ if(this.els.size<this.maxEls) this.rocket(); }, 1200+Math.random()*700));
    }
  }
  confeti() {
    const c = document.getElementById('carnival-confetti'); if (!c) return;
    const el = document.createElement('div'); el.className = 'carnival-confetti-piece festive-element';
    el.textContent = this.pick(this.formas);
    el.style.left = this.rnd(0,100)+'%'; el.style.fontSize = this.rnd(10,20)+'px';
    el.style.color = this.pick(COLOR_PALETTES.CARNAVAL);
    el.style.setProperty('--drift-confetti', this.rnd(-80,80)+'px');
    el.style.setProperty('--spin-confetti', this.rnd(-720,720)+'deg');
    const dur = this.rnd(6,10); el.style.animationDuration = dur+'s';
    c.appendChild(el); this.els.add(el); this.clean(el, dur*1000+500);
  }
  rocket() {
    const c = document.getElementById('carnival-fireworks'); if (!c) return;
    const el = document.createElement('div'); el.className = 'carnival-rocket festive-element';
    const col = this.pick(COLOR_PALETTES.CARNAVAL);
    el.style.cssText = `background:${col};left:${this.rnd(15,85)}vw;width:${this.rnd(5,9)}px;height:${this.rnd(16,24)}px;animation-duration:${this.rnd(1,1.6)}s`;
    c.appendChild(el); this.els.add(el);
    el.addEventListener('animationend', () => {
      const r = el.getBoundingClientRect();
      this.explode(r.left + r.width/2, r.top + r.height/2, col);
      this.clean(el);
    });
    this.clean(el, 2500);
  }
  explode(x, y, col) {
    const c = document.getElementById('carnival-fireworks'); if (!c) return;
    const num = this.rndI(35,55);
    for (let i=0; i<num; i++) {
      const p = document.createElement('div'); p.className = 'carnival-burst-particle festive-element';
      p.textContent = this.pick(this.formas);
      p.style.fontSize = this.rnd(10,18)+'px';
      p.style.color = this.pick(COLOR_PALETTES.CARNAVAL);
      p.style.left = x+'px'; p.style.top = y+'px';
      const ang = (Math.PI*2*i)/num + this.rnd(-0.2,0.2);
      const dist = this.rnd(60,130);
      p.style.setProperty('--explode-x', Math.cos(ang)*dist+'px');
      p.style.setProperty('--explode-y', Math.sin(ang)*dist+'px');
      p.style.setProperty('--explode-r', this.rnd(-360,360)+'deg');
      p.style.animationDuration = this.rnd(0.8,1.5)+'s';
      c.appendChild(p); this.els.add(p); this.clean(p, 1800);
    }
  }
}

class PrimaveraMgr extends FestMgr {
  constructor() { super(); this.elementos = ['🌸','🌺','🌼','🌻','🌷','🦋','🐝','🌱']; }
  start() {
    if (!this.isActive(FESTIVE_CONFIG.PRIMAVERA) || this.ivs.has('p')) return;
    const c = document.getElementById('spring-blossoms'); if (!c) return;
    for (let i=0; i<18; i++) setTimeout(()=>this.flor(), i*450);
    this.ivs.set('p', setInterval(()=>{ if(this.els.size<50) this.flor(); }, 650));
  }
  flor() {
    const c = document.getElementById('spring-blossoms'); if (!c) return;
    const el = document.createElement('div'); el.className = 'spring-blossom festive-element';
    el.textContent = this.pick(this.elementos);
    el.style.left = this.rnd(0,100)+'%'; el.style.fontSize = this.rnd(18,30)+'px';
    el.style.setProperty('--wind-1', this.rnd(-60,60)+'px');
    el.style.setProperty('--wind-2', this.rnd(-80,80)+'px');
    el.style.setProperty('--wind-3', this.rnd(-50,50)+'px');
    el.style.setProperty('--twirl-1', this.rnd(-90,90)+'deg');
    el.style.setProperty('--twirl-2', this.rnd(-180,180)+'deg');
    el.style.setProperty('--twirl-3', this.rnd(-270,270)+'deg');
    const dur = this.rnd(12,18); el.style.animationDuration = dur+'s';
    c.appendChild(el); this.els.add(el); this.clean(el, dur*1000+500);
  }
}

class VeranoMgr extends FestMgr {
  constructor() { super(); this.elementos = ['☀️','🌊','🏖️','🍉','🍹','🌴','⛱️']; }
  start() {
    if (!this.isActive(FESTIVE_CONFIG.VERANO) || this.ivs.has('p')) return;
    const c = document.getElementById('summer-vibes'); if (!c) return;
    for (let i=0; i<10; i++) setTimeout(()=>this.elem(), i*900);
    this.ivs.set('p', setInterval(()=>{ if(this.els.size<30) this.elem(); }, 2800+Math.random()*1500));
  }
  elem() {
    const c = document.getElementById('summer-vibes'); if (!c) return;
    const el = document.createElement('div'); el.className = 'summer-element festive-element';
    el.textContent = this.pick(this.elementos);
    el.style.fontSize = this.rnd(28,48)+'px'; el.style.left = this.rnd(10,85)+'vw';
    el.style.setProperty('--summer-drift-1', this.rnd(-60,60)+'px');
    el.style.setProperty('--summer-drift-2', this.rnd(-80,80)+'px');
    el.style.setProperty('--summer-drift-3', this.rnd(-70,70)+'px');
    el.style.setProperty('--summer-drift-4', this.rnd(-50,50)+'px');
    el.style.setProperty('--summer-spin-1', this.rnd(-90,90)+'deg');
    el.style.setProperty('--summer-spin-2', this.rnd(-180,180)+'deg');
    el.style.setProperty('--summer-spin-3', this.rnd(-270,270)+'deg');
    el.style.setProperty('--summer-spin-4', this.rnd(-360,360)+'deg');
    const dur = this.rnd(5,8); el.style.animationDuration = dur+'s';
    c.appendChild(el); this.els.add(el); this.clean(el, dur*1000+500);
  }
}

class OtonoMgr extends FestMgr {
  constructor() { super(); this.elementos = ['🍂','🍁','🍄','🌰']; }
  start() {
    if (!this.isActive(FESTIVE_CONFIG.OTONO) || this.ivs.has('p')) return;
    const c = document.getElementById('autumn-leaves'); if (!c) return;
    for (let i=0; i<22; i++) setTimeout(()=>this.hoja(), i*350);
    this.ivs.set('p', setInterval(()=>{ if(this.els.size<this.maxEls) this.hoja(); }, 480));
  }
  hoja() {
    const c = document.getElementById('autumn-leaves'); if (!c) return;
    const el = document.createElement('div'); el.className = 'autumn-falling-leaf festive-element';
    el.textContent = this.pick(this.elementos);
    el.style.left = this.rnd(0,100)+'%'; el.style.fontSize = this.rnd(20,36)+'px';
    for (let i=1;i<=5;i++) el.style.setProperty(`--autumn-${i}`, this.rnd(-80,80)+'px');
    for (let i=1;i<=5;i++) el.style.setProperty(`--leaf-spin-${i}`, this.rnd(-450,450)+'deg');
    const dur = this.rnd(9,14); el.style.animationDuration = dur+'s';
    c.appendChild(el); this.els.add(el); this.clean(el, dur*1000+500);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const mgrs = [
    new AnoNuevoMgr(),
    new SanValentinMgr(),
    new DiaGatoMgr(),
    new SanPatricioMgr(),
    new PascuaMgr(),
    new DiaMadreMgr(),
    new HalloweenMgr(),
    new DiaMuertosMgr(),
    new NavidadMgr(),
    new CarnavalMgr(),
    new PrimaveraMgr(),
    new VeranoMgr(),
    new OtonoMgr(),
  ];
  mgrs.forEach(m => { try { m.start(); } catch(e) { console.warn('Festivity error:', e); } });
});