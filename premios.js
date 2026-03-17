/**
 * premios.js — Sistema Gacha Moonveil (Firebase Edition)
 * ═══════════════════════════════════════════════════════
 * ✅ Firebase Firestore sincronización cross-device
 * ✅ Tickets compartidos con tienda.html (mv_tickets_<id>)
 * ✅ Inventario vinculado con perfil (mv_inventory + gacha_inventory)
 * ✅ Pity real estilo gacha (épico/20, legendario/60)
 * ✅ Diseño pixel art compatible con el resto del portal
 * ✅ window.addTickets() global para que tienda.js llame aquí
 * ✅ Responsive + compatible móviles
 */

'use strict';

import { db }       from './firebase.js';
import { onAuthChange } from './auth.js';
import {
  doc, getDoc, setDoc, updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

/* ════════════════════════════════════
   HELPERS BÁSICOS
════════════════════════════════════ */
const $  = s => document.querySelector(s);
const $$ = (s, ctx = document) => ctx.querySelectorAll(s);
const wait = ms => new Promise(r => setTimeout(r, ms));

/* ════════════════════════════════════
   CLAVES LOCALSTORAGE
   mv_tickets_<id> → compartida con tienda.js
════════════════════════════════════ */
const LS = {
  tickets:    id => `mv_tickets_${id}`,     // ← compartida con tienda
  pityEpic:   id => `mv_pity_epic_${id}`,
  pityLegend: id => `mv_pity_legend_${id}`,
  gachaInv:   'mv_gacha_inventory',         // inventario gacha local
  boostState: 'mv_gacha_boost',
  stats:      'mv_gacha_stats',
  missions:   'mv_gacha_missions',
  stock:      id => `mv_gacha_stock_${id}`,
};

function lsGet(key, fallback = null) {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

/* ════════════════════════════════════
   FIREBASE
════════════════════════════════════ */
let currentUID = null;
let syncTimeout = null;

function scheduleFirebaseSync() {
  if (!currentUID) return;
  clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => syncGachaToFirebase(), 3000);
}

async function syncGachaToFirebase() {
  if (!currentUID) return;
  try {
    const inv = lsGet(LS.gachaInv, {});
    const stats = lsGet(LS.stats, {});
    const ticketsData = {};
    ROULETTES.forEach(r => { ticketsData[r.id] = getTickets(r.id); });

    await updateDoc(doc(db, 'users', currentUID), {
      gacha_inventory: inv,
      gacha_stats:     stats,
      gacha_tickets:   ticketsData,
      updatedAt:       serverTimestamp(),
    });
  } catch (e) { console.warn('[Gacha] Firebase sync:', e); }
}

async function loadGachaFromFirebase(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return;
    const d = snap.data();

    // Tickets desde Firebase (si hay, priorizar localStorage por seguridad)
    if (d.gacha_tickets) {
      ROULETTES.forEach(r => {
        const lsVal = parseInt(localStorage.getItem(LS.tickets(r.id)) || '-1', 10);
        const fbVal = d.gacha_tickets[r.id] ?? 0;
        // Toma el mayor valor entre local y Firebase para no perder tickets
        const final = Math.max(lsVal < 0 ? 0 : lsVal, fbVal);
        localStorage.setItem(LS.tickets(r.id), String(final));
      });
    }

    // Inventario gacha
    if (d.gacha_inventory) {
      const local = lsGet(LS.gachaInv, {});
      // Merge: sumar counts si el local tiene más (giró offline)
      const merged = { ...d.gacha_inventory };
      Object.keys(local).forEach(k => {
        if (!merged[k]) merged[k] = local[k];
        else if ((local[k].count || 0) > (merged[k].count || 0)) merged[k] = local[k];
      });
      lsSet(LS.gachaInv, merged);
    }

    if (d.gacha_stats) lsSet(LS.stats, d.gacha_stats);
  } catch (e) { console.warn('[Gacha] Load Firebase:', e); }
}

/* ════════════════════════════════════
   RULETAS — AGREGA NUEVAS AQUÍ
   id debe coincidir con tickets de tienda
════════════════════════════════════ */
const ROULETTES = [
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

  /* ═══════════════════════════════════════
     PLANTILLA PARA NUEVA RULETA
     Descomenta y ajusta:
  {
    id: 'event',
    title: 'Evento',
    icon: '🎭',
    desc: 'Premios exclusivos de temporada',
    bg: null,
    music: null,
    start: '2026-04-01',
    end: '2026-06-30',
    rewards: [
      { id:'ev1', label:'Cupón X%',       weight:10, rarity:'rare',   img:'🎭', desc:'Descuento', stock:null },
      { id:'ev2', label:'Esmeraldas x25', weight:6,  rarity:'epic',   img:'💎', desc:'Generoso',  stock:3   },
      { id:'ev3', label:'Gran Premio',    weight:1,  rarity:'legend', img:'🏅', desc:'Rarísimo',  stock:1   },
    ]
  },
  ═══════════════════════════════════════ */
];

/* ════════════════════════════════════
   MISIONES POR RULETA
════════════════════════════════════ */
const MISSIONS_BY_WHEEL = {
  classic: [
    { id:'mc1', title:'Inicia Sesión',  desc:'Nuevo día',    freq:'daily',  reward:{ count:5 } },
    { id:'mc2', title:'200 monedas',    desc:'Recoléctalas', freq:'daily',  reward:{ count:1 } },
    { id:'mc3', title:'20 bloques',     desc:'Rómpelos',     freq:'daily',  reward:{ count:2 } },
    { id:'mc4', title:'1 mini-juego',   desc:'Gana uno',     freq:'weekly', reward:{ count:3 } },
    { id:'mc5', title:'5 biomas',       desc:'Explóralos',   freq:'weekly', reward:{ count:5 } },
  ],
  // event: [
  //   { id:'mev1', title:'1 compra', desc:'En la tienda', freq:'daily', reward:{ count:3 } },
  // ],
};

/* ════════════════════════════════════
   MENSAJES DEL ZORRITO
════════════════════════════════════ */
const FOX_MESSAGES = {
  classic: ['¡La clásica nunca falla!','Épico cada 20 tiros','Legendario a los 60 tiros','¡Buena suerte!','Esmeraldas y monedas'],
  default: ['¡Gira y gana!','¡Buena suerte!','Épico cada 20','Legendario cada 60','¡Colecciona todo!']
};

/* ════════════════════════════════════
   ESTADO GLOBAL
════════════════════════════════════ */
let currentWheelId  = ROULETTES[0].id;
let spinning        = false;
let currentAudio    = null;
let TICKET_MULT     = 1;
let foxInterval     = null;
let timerInterval   = null;
let boostInterval   = null;

/* ════════════════════════════════════
   ESTADÍSTICAS
════════════════════════════════════ */
function getStats()        { return lsGet(LS.stats, { totalSpins:0, totalPrizes:0 }); }
function updateStats(d)    { lsSet(LS.stats, { ...getStats(), ...d }); renderStats(); scheduleFirebaseSync(); }
function renderStats() {
  const s = getStats();
  const total = ROULETTES.reduce((sum, r) => sum + getTickets(r.id), 0);
  if ($('#totalTickets')) $('#totalTickets').textContent = total;
  if ($('#totalPrizes'))  $('#totalPrizes').textContent  = s.totalPrizes  || 0;
  if ($('#totalSpins'))   $('#totalSpins').textContent   = s.totalSpins   || 0;
}

/* ════════════════════════════════════
   TICKETS
   Clave compartida con tienda.js: mv_tickets_<id>
════════════════════════════════════ */
function getTickets(id) {
  return Math.max(0, parseInt(localStorage.getItem(LS.tickets(id)) || '0', 10));
}
function setTickets(id, count) {
  localStorage.setItem(LS.tickets(id), String(Math.max(0, Math.floor(count))));
  renderTicketsDisplay();
  renderHUDTickets();
  updateCurrentWheelInfo();
  renderStats();
  scheduleFirebaseSync();
}

/**
 * addTickets(wheelId, count)
 * ══════════════════════════
 * Función GLOBAL llamada por tienda.js cuando el usuario compra tickets.
 * También se puede llamar manualmente para dar tickets por misiones, etc.
 */
function addTickets(id, count) {
  const wheel = ROULETTES.find(r => r.id === id);
  if (!wheel) {
    console.warn(`[Gacha] addTickets: ruleta "${id}" no existe`);
    return;
  }
  const real = Math.round(count * TICKET_MULT);
  setTickets(id, getTickets(id) + real);
  toast(
    TICKET_MULT > 1
      ? `+${real} tickets "${wheel.title}" (x${TICKET_MULT} boost!)`
      : `+${real} tickets para "${wheel.title}"`,
    '🎟️'
  );
}

/* Exponer globalmente para tienda.js */
window.addTickets       = addTickets;
window.renderTicketCounts = () => renderTicketsDisplay();
window.renderHUDTickets   = renderHUDTickets;

/* ════════════════════════════════════
   INVENTARIO GACHA
   Se sincroniza con Firebase y con la
   sección de Inventario del perfil
════════════════════════════════════ */
function getGachaInv() { return lsGet(LS.gachaInv, {}); }

function addToGachaInv(wheelId, reward) {
  const inv = getGachaInv();
  const key = `${wheelId}_${reward.id}`;
  if (!inv[key]) {
    inv[key] = {
      wheelId, rewardId: reward.id, label: reward.label,
      img: reward.img, rarity: reward.rarity, count: 0,
      lastObtained: null
    };
  }
  inv[key].count++;
  inv[key].lastObtained = new Date().toISOString();
  lsSet(LS.gachaInv, inv);

  // También actualizamos el inventario del perfil si aplica
  syncGachaToProfileInventory(inv);

  const stats = getStats();
  updateStats({ totalPrizes: (stats.totalPrizes || 0) + 1 });
  updateInventoryBadge();
  scheduleFirebaseSync();
}

/**
 * syncGachaToProfileInventory
 * Convierte el inventario gacha a formato del perfil
 * para que perfil.html lo muestre en la sección Inventario
 */
function syncGachaToProfileInventory(inv) {
  try {
    const profileInv = lsGet('mv_inventory', { tickets:0, keys:0, superstar_keys:0 });
    // El inventario gacha se guarda aparte en mv_gacha_inventory
    // El perfil lo leerá directamente con esa clave.
    // No sobrescribimos los ítems base del perfil (tickets, keys, etc.)
    localStorage.setItem('mv_gacha_inventory', JSON.stringify(inv));
  } catch {}
}

function updateInventoryBadge() {
  const inv  = getGachaInv();
  const count = Object.values(inv).filter(i => i.wheelId === currentWheelId).length;
  if ($('#invBadge')) $('#invBadge').textContent = count;
}

function showInventory() {
  const inv  = getGachaInv();
  const items = Object.values(inv).filter(i => i.wheelId === currentWheelId);
  const wname = ROULETTES.find(w => w.id === currentWheelId)?.title || currentWheelId;

  if (!items.length) {
    openModal(`
      <h2>INVENTARIO — ${wname}</h2>
      <p style="font-family:var(--font-vt);font-size:1rem;color:var(--muted);text-align:center;padding:32px">
        Aún no has ganado nada aquí.
      </p>
      <div style="text-align:center;margin-top:16px">
        <button class="btn-pixel btn-purple" onclick="document.getElementById('modal').setAttribute('aria-hidden','true')">CERRAR</button>
      </div>
    `);
    return;
  }

  const order = { legend:0, epic:1, rare:2, uncommon:3, common:4 };
  items.sort((a, b) => (order[a.rarity] ?? 5) - (order[b.rarity] ?? 5));

  const cards = items.map(i => `
    <div class="prize-card ${i.rarity}" style="padding:14px;text-align:center">
      <div class="prize-img">${i.img}</div>
      <div class="prize-name">${i.label}</div>
      <div class="prize-rarity" style="color:${rarityColor(i.rarity)}">${i.rarity.toUpperCase()}</div>
      <div style="font-family:var(--font-pixel);font-size:0.55rem;color:#c4b5fd;margin-top:8px">x${i.count}</div>
    </div>
  `).join('');

  openModal(`
    <h2>INVENTARIO — ${wname}</h2>
    <p style="font-family:var(--font-vt);font-size:1rem;color:var(--muted);text-align:center;margin-bottom:14px">
      ${items.length} tipos · ${items.reduce((s,i)=>s+i.count,0)} ítems totales
    </p>
    <div class="prize-grid-modal">${cards}</div>
    <div style="text-align:center">
      <button class="btn-pixel btn-purple" onclick="document.getElementById('modal').setAttribute('aria-hidden','true')">CERRAR</button>
    </div>
  `);
}

/* ════════════════════════════════════
   TIEMPO / FECHAS
════════════════════════════════════ */
function isWheelActive(wheel) {
  if (!wheel.start && !wheel.end) return true;
  const now = new Date();
  if (wheel.start && now < new Date(wheel.start + 'T00:00:00')) return false;
  if (wheel.end   && now > new Date(wheel.end   + 'T23:59:59')) return false;
  return true;
}
function getTimeUntilStart(wheel) {
  if (!wheel.start) return null;
  return Math.max(0, new Date(wheel.start + 'T00:00:00') - new Date());
}
function getTimeUntilEnd(wheel) {
  if (!wheel.end) return null;
  return Math.max(0, new Date(wheel.end + 'T23:59:59') - new Date());
}
function formatTimeRemaining(ms) {
  if (ms <= 0) return 'Finalizada';
  const s = Math.floor(ms/1000), m = Math.floor(s/60), h = Math.floor(m/60), d = Math.floor(h/24);
  if (d > 0) return `${d}d ${h%24}h`;
  if (h > 0) return `${h}h ${m%60}m`;
  if (m > 0) return `${m}m ${s%60}s`;
  return `${s}s`;
}
function formatTime(sec) {
  const h  = String(Math.floor(sec/3600)).padStart(2,'0');
  const m  = String(Math.floor((sec%3600)/60)).padStart(2,'0');
  const ss = String(sec%60).padStart(2,'0');
  return `${h}:${m}:${ss}`;
}

/* ════════════════════════════════════
   PITY
════════════════════════════════════ */
function getPityEpic(id)    { return parseInt(localStorage.getItem(LS.pityEpic(id))   || '0', 10); }
function setPityEpic(id, v) { localStorage.setItem(LS.pityEpic(id), String(v)); updatePityUI(); scheduleFirebaseSync(); }
function getPityLeg(id)     { return parseInt(localStorage.getItem(LS.pityLegend(id)) || '0', 10); }
function setPityLeg(id, v)  { localStorage.setItem(LS.pityLegend(id), String(v)); updatePityUI(); scheduleFirebaseSync(); }

function updatePityUI() {
  const pe = getPityEpic(currentWheelId);
  const pl = getPityLeg(currentWheelId);
  const epicPct   = ((pe % 20) / 20)  * 100;
  const legPct    = (pl / 60)          * 100;

  if ($('#pityFillEpic'))   $('#pityFillEpic').style.width   = epicPct + '%';
  if ($('#pityFillLegend')) $('#pityFillLegend').style.width = legPct  + '%';
  if ($('#currentPity'))    $('#currentPity').textContent    = `E:${20-(pe%20)} L:${pl}/60`;
  if ($('#hudFillEpic'))    $('#hudFillEpic').style.width    = epicPct + '%';
  if ($('#hudFillLeg'))     $('#hudFillLeg').style.width     = legPct  + '%';
}

/* ════════════════════════════════════
   STOCK DE ÍTEMS
════════════════════════════════════ */
function getStock(id)    { const v = localStorage.getItem(LS.stock(id)); return v !== null ? parseInt(v,10) : null; }
function setStock(id, v) { if (v === null) localStorage.removeItem(LS.stock(id)); else localStorage.setItem(LS.stock(id), String(Math.max(0,v))); }

function initStocks() {
  ROULETTES.forEach(w => w.rewards.forEach(r => {
    if (r.stock !== null && getStock(r.id) === null) setStock(r.id, r.stock);
  }));
}

function useStock(id) {
  const cur = getStock(id);
  if (cur !== null) {
    if (cur <= 0) return false;
    setStock(id, cur - 1);
  }
  return true;
}

/* ════════════════════════════════════
   PICK CON PITY
════════════════════════════════════ */
function pickWithPity(wheelId) {
  const wheel = ROULETTES.find(w => w.id === wheelId);
  if (!wheel) return null;

  const pe = getPityEpic(wheelId);
  const pl = getPityLeg(wheelId);
  const avail = wheel.rewards.filter(r => { const s = getStock(r.id); return s === null || s > 0; });
  if (!avail.length) { toast('¡No quedan premios disponibles!', '⚠️'); return null; }

  const epics   = avail.filter(r => r.rarity === 'epic');
  const legends = avail.filter(r => r.rarity === 'legend');

  // Garantía legendaria a los 60
  if (pl >= 60 && legends.length) {
    const r = legends[Math.floor(Math.random() * legends.length)];
    setPityEpic(wheelId, pe + 1);
    setPityLeg(wheelId, 0);
    return r;
  }
  // Garantía épica cada 20
  if (pe >= 20 && epics.length) {
    const r = epics[Math.floor(Math.random() * epics.length)];
    setPityEpic(wheelId, 0);
    setPityLeg(wheelId, pl + 1);
    return r;
  }

  const total = avail.reduce((sum, r) => sum + r.weight, 0);
  let rng = Math.random() * total;
  for (const r of avail) {
    rng -= r.weight;
    if (rng <= 0) {
      if (r.rarity === 'legend')    { setPityLeg(wheelId, 0);   setPityEpic(wheelId, pe+1); }
      else if (r.rarity === 'epic') { setPityEpic(wheelId, 0);  setPityLeg(wheelId, pl+1); }
      else                          { setPityEpic(wheelId, pe+1); setPityLeg(wheelId, pl+1); }
      return r;
    }
  }
  return avail[avail.length - 1];
}

/* ════════════════════════════════════
   RENDER RULETA SVG
════════════════════════════════════ */
function renderWheel(wheelId) {
  const wheel = ROULETTES.find(w => w.id === wheelId);
  if (!wheel) return;
  const container = $('#wheel');
  container.innerHTML = '';

  const size = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--wheel-size')) || 420;
  const r = size / 2, cx = r, cy = r;
  const n = wheel.rewards.length;
  const deg = 360 / n;

  const colorMap = {
    common:   'rgba(156,163,175,0.08)', uncommon: 'rgba(52,211,153,0.10)',
    rare:     'rgba(96,165,250,0.10)',  epic:     'rgba(192,132,252,0.15)',
    legend:   'rgba(251,191,36,0.18)'
  };

  const wrapper = document.createElement('div');
  wrapper.className = 'wheel-wrapper';
  Object.assign(wrapper.style, {
    width:`${size}px`, height:`${size}px`, position:'relative',
    transformOrigin:'center center',
    transition:'transform 4.5s cubic-bezier(0.14,0.9,0.26,1)'
  });

  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.style.overflow = 'visible';

  // Fondo
  const bg = document.createElementNS('http://www.w3.org/2000/svg','circle');
  bg.setAttribute('cx',cx); bg.setAttribute('cy',cy); bg.setAttribute('r',r);
  bg.setAttribute('fill','#0d0b15');
  svg.appendChild(bg);

  // Sectores
  wheel.rewards.forEach((reward, i) => {
    const startAngle = (i * deg - 90)     * Math.PI / 180;
    const endAngle   = ((i+1)*deg - 90)   * Math.PI / 180;
    const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle),   y2 = cy + r * Math.sin(endAngle);
    const large = deg > 180 ? 1 : 0;

    const path = document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d', `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`);
    path.setAttribute('fill', colorMap[reward.rarity] || 'rgba(255,255,255,0.04)');
    path.setAttribute('stroke', 'rgba(139,92,246,0.2)');
    path.setAttribute('stroke-width', '1.5');
    svg.appendChild(path);

    // Separador pixel-style
    const line = document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1',cx); line.setAttribute('y1',cy);
    line.setAttribute('x2',x1); line.setAttribute('y2',y1);
    line.setAttribute('stroke','rgba(139,92,246,0.3)'); line.setAttribute('stroke-width','2');
    svg.appendChild(line);

    // Emoji / texto
    const mid = (startAngle + endAngle) / 2;
    const tx = cx + (r * 0.68) * Math.cos(mid);
    const ty = cy + (r * 0.68) * Math.sin(mid);
    const emoji = document.createElementNS('http://www.w3.org/2000/svg','text');
    emoji.setAttribute('x', tx); emoji.setAttribute('y', ty);
    emoji.setAttribute('text-anchor','middle'); emoji.setAttribute('dominant-baseline','middle');
    emoji.setAttribute('font-size','18');
    emoji.textContent = reward.img || '?';
    svg.appendChild(emoji);
  });

  // Borde exterior
  const edge = document.createElementNS('http://www.w3.org/2000/svg','circle');
  edge.setAttribute('cx',cx); edge.setAttribute('cy',cy); edge.setAttribute('r',r-2);
  edge.setAttribute('stroke','rgba(139,92,246,0.6)'); edge.setAttribute('stroke-width','4');
  edge.setAttribute('fill','none');
  svg.appendChild(edge);

  // Grid pixel overlay (inner lines cada 10px)
  const gridGroup = document.createElementNS('http://www.w3.org/2000/svg','g');
  gridGroup.setAttribute('opacity','0.04');
  for (let gx = 0; gx <= size; gx += 12) {
    const vLine = document.createElementNS('http://www.w3.org/2000/svg','line');
    vLine.setAttribute('x1',gx); vLine.setAttribute('y1',0); vLine.setAttribute('x2',gx); vLine.setAttribute('y2',size);
    vLine.setAttribute('stroke','#8b5cf6'); vLine.setAttribute('stroke-width','1');
    gridGroup.appendChild(vLine);
  }
  svg.insertBefore(gridGroup, svg.firstChild);

  wrapper.appendChild(svg);
  container.appendChild(wrapper);

  updateCurrentWheelInfo();
  updatePityUI();
  checkWheelLock(wheel);
  updateSpinButtons();
}

/* ════════════════════════════════════
   BLOQUEO / LOCK
════════════════════════════════════ */
function checkWheelLock(wheel) {
  const lockEl = $('#wheelLock'), txt = $('#lockText'), rangeEl = $('#lockRange');
  if (!lockEl) return;
  const active = isWheelActive(wheel);
  if (!active) {
    lockEl.hidden = false;
    const ts = getTimeUntilStart(wheel), te = getTimeUntilEnd(wheel);
    if (ts && ts > 0) { txt.textContent = 'PROXIMA'; rangeEl.textContent = `Inicia en ${formatTimeRemaining(ts)}`; }
    else              { txt.textContent = 'FINALIZADA'; rangeEl.textContent = wheel.end ? new Date(wheel.end+'T23:59:59').toLocaleDateString('es-ES') : '—'; }
  } else {
    lockEl.hidden = true;
  }
}

function updateSpinButtons() {
  const wheel = ROULETTES.find(w => w.id === currentWheelId);
  const active = wheel && isWheelActive(wheel);
  if ($('#btnSpin'))  $('#btnSpin').disabled  = !active || spinning;
  if ($('#btnSpin10'))$('#btnSpin10').disabled = !active || spinning;
}

/* ════════════════════════════════════
   GIRO
════════════════════════════════════ */
async function spinWheel(times = 1) {
  if (spinning) return;
  const wheel = ROULETTES.find(w => w.id === currentWheelId);
  if (!wheel || !isWheelActive(wheel)) { toast('Ruleta no disponible', '🔒'); return; }

  const tix = getTickets(currentWheelId);
  if (tix < times) { toast(`Necesitas ${times} ticket${times>1?'s':''} para "${wheel.title}"`, '⚠️'); return; }

  setTickets(currentWheelId, tix - times);
  spinning = true;
  updateSpinButtons();

  const stats = getStats();
  updateStats({ totalSpins: (stats.totalSpins || 0) + times });

  // Calcular resultados
  const results = [];
  for (let i = 0; i < times; i++) {
    const reward = pickWithPity(currentWheelId);
    if (!reward) continue;
    if (!useStock(reward.id)) { toast(`"${reward.label}" agotado`, '⚠️'); continue; }
    addToGachaInv(currentWheelId, reward);
    results.push(reward);
  }

  if (!results.length) { spinning = false; updateSpinButtons(); return; }

  // Animación ruleta
  const last = results[results.length - 1];
  const wrapEl = $('.wheel-wrapper');
  if (wrapEl) {
    wrapEl.style.transition = 'none';
    wrapEl.style.transform  = 'rotate(0deg)';
    void wrapEl.offsetWidth;
    const idx     = wheel.rewards.findIndex(r => r.id === last.id);
    const segDeg  = 360 / wheel.rewards.length;
    const finalRot= 6 * 360 + (270 - (idx * segDeg + segDeg / 2));
    wrapEl.style.transition = 'transform 4.5s cubic-bezier(0.14,0.9,0.26,1)';
    wrapEl.style.transform  = `rotate(${finalRot}deg)`;
  }

  // Beeps mientras gira
  const tickIv = setInterval(() => beep(120, 0.02), 80);
  await wait(4600);
  clearInterval(tickIv);

  spinning = false;
  updateSpinButtons();

  times === 1 ? showPrizeModal(last) : showMultiPrizeModal(results);
  updateLastPrize(last);
  beep(880, 0.05, 0.06);
}

/* ════════════════════════════════════
   MODALES DE PREMIOS
════════════════════════════════════ */
function rarityColor(r) {
  return { common:'#9ca3af', uncommon:'#34d399', rare:'#60a5fa', epic:'#c084fc', legend:'#fbbf24' }[r] || '#fff';
}

function openModal(html) {
  const m = $('#modal'), c = $('#modalContent');
  if (!m || !c) return;
  c.innerHTML = html;
  m.setAttribute('aria-hidden', 'false');
}
function closeModal() { $('#modal')?.setAttribute('aria-hidden', 'true'); }

function showPrizeModal(reward) {
  openModal(`
    <div style="text-align:center;padding:20px">
      <div style="font-size:80px;margin-bottom:14px">${reward.img}</div>
      <h2 style="color:${rarityColor(reward.rarity)};text-shadow:2px 2px 0 #000">${reward.label}</h2>
      <p style="font-family:var(--font-vt);font-size:1rem;color:var(--muted);margin:10px 0">${reward.desc}</p>
      <span style="display:inline-block;font-family:var(--font-pixel);font-size:0.28rem;padding:5px 12px;border:2px solid ${rarityColor(reward.rarity)};color:${rarityColor(reward.rarity)};background:rgba(0,0,0,0.4)">
        ${reward.rarity.toUpperCase()}
      </span>
      <div style="margin-top:24px">
        <button class="btn-pixel btn-purple" onclick="document.getElementById('modal').setAttribute('aria-hidden','true')">GENIAL!</button>
      </div>
    </div>
  `);
}

function showMultiPrizeModal(rewards) {
  const cards = rewards.map(r => `
    <div class="prize-card-sm ${r.rarity}">
      <div class="pcm-img">${r.img}</div>
      <div class="pcm-name">${r.label}</div>
      <div class="pcm-rarity" style="color:${rarityColor(r.rarity)}">${r.rarity.toUpperCase()}</div>
    </div>
  `).join('');
  openModal(`
    <h2>TIRADA x${rewards.length}</h2>
    <div class="prize-grid-modal">${cards}</div>
    <div style="text-align:center">
      <button class="btn-pixel btn-purple large" onclick="document.getElementById('modal').setAttribute('aria-hidden','true')">CONTINUAR</button>
    </div>
  `);
}

function updateLastPrize(reward) {
  const c = $('#lastPrize');
  if (!c) return;
  c.innerHTML = `
    <div class="prize-card ${reward.rarity}">
      <div class="prize-img">${reward.img}</div>
      <div class="prize-name">${reward.label}</div>
      <div class="prize-rarity" style="color:${rarityColor(reward.rarity)}">${reward.rarity.toUpperCase()}</div>
    </div>
  `;
}

/* ════════════════════════════════════
   PREVIEW DE PREMIOS
════════════════════════════════════ */
function showPreview() {
  const wheel = ROULETTES.find(w => w.id === currentWheelId);
  if (!wheel) return;
  const cards = wheel.rewards.map(r => {
    const s = getStock(r.id);
    const stockTxt = s !== null ? `Stock: ${s}` : 'Ilimitado';
    return `
      <div class="prize-card-sm ${r.rarity}">
        <div class="pcm-img">${r.img}</div>
        <div class="pcm-name">${r.label}</div>
        <div class="pcm-rarity" style="color:${rarityColor(r.rarity)}">${r.rarity.toUpperCase()}</div>
        <div style="font-family:var(--font-pixel);font-size:0.2rem;color:var(--muted);margin-top:4px">${stockTxt}</div>
        <div style="font-family:var(--font-vt);font-size:0.8rem;color:var(--dim)">${r.desc}</div>
      </div>
    `;
  }).join('');
  openModal(`
    <h2>PREMIOS — ${wheel.title}</h2>
    <div class="prize-grid-modal">${cards}</div>
    <div style="text-align:center">
      <button class="btn-pixel btn-purple" onclick="document.getElementById('modal').setAttribute('aria-hidden','true')">CERRAR</button>
    </div>
  `);
}

/* ════════════════════════════════════
   REGLAS
════════════════════════════════════ */
function showRules() {
  openModal(`
    <h2>REGLAS DEL SISTEMA GACHA</h2>
    <div class="rules-body">
      <h3>TICKETS</h3>
      <ul>
        <li>Cada ruleta tiene sus propios tickets independientes</li>
        <li>Se compran en la <a href="tienda.html" style="color:var(--a)">Tienda</a> y llegan aquí automáticamente</li>
        <li>También se ganan completando misiones diarias/semanales</li>
      </ul>
      <h3>PITY / GARANTIA</h3>
      <ul>
        <li><strong>Épico garantizado cada 20 tiros</strong> — el contador no se resetea entre ruletas</li>
        <li><strong>Legendario garantizado a los 60 tiros</strong> — sí se resetea al obtenerlo</li>
        <li>Puedes obtener raridades altas antes del pity con suerte</li>
      </ul>
      <h3>INVENTARIO</h3>
      <ul>
        <li>Los ítems se suman automáticamente (x2, x3, etc.)</li>
        <li>Cada ruleta tiene su inventario visible aquí y en tu Perfil</li>
      </ul>
      <h3>DISPONIBILIDAD</h3>
      <ul>
        <li><strong>Clásica:</strong> Permanente — siempre disponible</li>
        <li>Ruletas de evento tienen fechas de inicio y fin</li>
      </ul>
      <h3>BOOST x2</h3>
      <ul>
        <li>Duplica tickets de misiones por 1 hora</li>
        <li>Cooldown hasta medianoche del mismo día</li>
      </ul>
    </div>
    <div style="text-align:center;margin-top:20px">
      <button class="btn-pixel btn-purple large" onclick="document.getElementById('modal').setAttribute('aria-hidden','true')">ENTENDIDO</button>
    </div>
  `);
}

/* ════════════════════════════════════
   TABS / SELECTOR DE RULETAS
════════════════════════════════════ */
function renderWheelTabs() {
  const container = $('#wheelTabs');
  if (!container) return;
  container.innerHTML = '';
  ROULETTES.forEach(wheel => {
    const active = isWheelActive(wheel);
    const ts = getTimeUntilStart(wheel), te = getTimeUntilEnd(wheel);
    let timerHTML = '';
    if (te === null)        timerHTML = '<span class="tab-timer permanent">PERMANENTE</span>';
    else if (ts && ts > 0)  timerHTML = `<span class="tab-timer upcoming" data-wheel="${wheel.id}">PROXIMAMENTE</span>`;
    else if (te > 0)        timerHTML = `<span class="tab-timer ${te < 604800000 ? 'ending-soon' : ''}" data-wheel="${wheel.id}">${formatTimeRemaining(te)}</span>`;
    else                    timerHTML = '<span class="tab-timer expired">FINALIZADA</span>';

    const tab = document.createElement('div');
    tab.className = `wheel-tab${wheel.id === currentWheelId ? ' active' : ''}`;
    tab.innerHTML = `
      <span class="tab-ico">${wheel.icon}</span>
      <span class="tab-name">${wheel.title.toUpperCase()}</span>
      <span class="tab-desc">${wheel.desc}</span>
      ${timerHTML}
      <span class="tab-status ${active ? 'active' : 'locked'}"></span>
    `;
    tab.addEventListener('click', () => switchWheel(wheel.id));
    container.appendChild(tab);
  });
}

function switchWheel(id) {
  currentWheelId = id;
  renderWheelTabs();
  renderWheel(id);
  renderMissions();
  updateCurrentWheelInfo();
  const wheel = ROULETTES.find(w => w.id === id);
  if (wheel) updateBackground(wheel);
  updateInventoryBadge();
  updateFoxMessage();
}

function updateWheelTimers() {
  ROULETTES.forEach(wheel => {
    const el = $(`.tab-timer[data-wheel="${wheel.id}"]`);
    if (!el) return;
    const ts = getTimeUntilStart(wheel), te = getTimeUntilEnd(wheel);
    if (ts && ts > 0) el.textContent = `PRONTO: ${formatTimeRemaining(ts)}`;
    else if (te !== null && te > 0) {
      el.textContent  = formatTimeRemaining(te);
      el.className    = `tab-timer ${te < 604800000 ? 'ending-soon' : ''}`;
    }
  });
  const wheel = ROULETTES.find(w => w.id === currentWheelId);
  if (wheel) { checkWheelLock(wheel); updateSpinButtons(); }
}

/* ════════════════════════════════════
   INFO RULETA ACTUAL
════════════════════════════════════ */
function updateCurrentWheelInfo() {
  const wheel = ROULETTES.find(w => w.id === currentWheelId);
  if (!wheel) return;
  if ($('#currentWheelName'))    $('#currentWheelName').textContent    = wheel.title.toUpperCase();
  if ($('#currentWheelTickets')) $('#currentWheelTickets').textContent = getTickets(currentWheelId);
  if ($('#wheelDesc'))           $('#wheelDesc').textContent           = wheel.desc;
  updatePityUI();

  const expEl = $('#wheelExpire');
  if (!expEl) return;
  const te = getTimeUntilEnd(wheel), ts = getTimeUntilStart(wheel);
  if (te === null) {
    expEl.textContent = 'PERMANENTE';
    expEl.style.cssText = 'display:inline-block;color:#ffb700;border-color:rgba(251,191,36,0.3)';
  } else if (ts && ts > 0) {
    expEl.textContent = `PROXIMAMENTE: ${formatTimeRemaining(ts)}`;
    expEl.style.cssText = 'display:inline-block;color:#60a5fa;border-color:rgba(96,165,250,0.3)';
  } else if (te > 0) {
    expEl.textContent = `TERMINA EN: ${formatTimeRemaining(te)}`;
    expEl.style.cssText = te < 604800000
      ? 'display:inline-block;color:#ff6b6b;border-color:rgba(239,68,68,0.3)'
      : 'display:inline-block;color:#ffb700;border-color:rgba(255,165,0,0.3)';
  } else {
    expEl.style.display = 'none';
  }
}

/* ════════════════════════════════════
   DISPLAY DE TICKETS
════════════════════════════════════ */
function renderTicketsDisplay() {
  const box = $('#ticketsDisplay');
  if (!box) return;
  box.innerHTML = '';
  ROULETTES.forEach(wheel => {
    const badge = document.createElement('div');
    badge.className = 'ticket-badge';
    badge.innerHTML = `
      <div class="tb-ico">${wheel.icon}</div>
      <div class="tb-info">
        <div class="tb-name">${wheel.title.toUpperCase()}</div>
        <div class="tb-count">${getTickets(wheel.id)}</div>
      </div>
    `;
    box.appendChild(badge);
  });
  renderHUDTickets();
}

function renderHUDTickets() {
  const box = $('#hudTickets');
  if (!box) return;
  box.innerHTML = '';
  ROULETTES.forEach(wheel => {
    const slot = document.createElement('div');
    slot.className = 'hud-ticket-slot';
    slot.title = `Tickets ${wheel.title}`;
    slot.innerHTML = `<span class="t-ico">${wheel.icon}</span><span>${getTickets(wheel.id)}</span>`;
    box.appendChild(slot);
  });
}

/* ════════════════════════════════════
   MISIONES
════════════════════════════════════ */
function getMissionsState() { return lsGet(LS.missions, {}); }
function setMissionsState(s) { lsSet(LS.missions, s); }

function renderMissions() {
  const box = $('#missionsList');
  if (!box) return;
  box.innerHTML = '';
  const state    = getMissionsState();
  const missions = MISSIONS_BY_WHEEL[currentWheelId] || [];
  let available  = 0;

  if (!missions.length) {
    box.innerHTML = '<p style="font-family:var(--font-pixel);font-size:0.24rem;color:var(--muted);padding:12px;line-height:2">SIN MISIONES</p>';
    return;
  }

  const freqColors = { daily:'daily', weekly:'weekly', monthly:'monthly' };
  missions.forEach(m => {
    const done = !!state[m.id]?.completedAt;
    if (!done) available++;
    const div = document.createElement('div');
    div.className = `mission-item${done ? ' completed' : ''}`;
    div.innerHTML = `
      <div class="mi-title">${m.title}</div>
      <div class="mi-desc">${m.desc}</div>
      <div class="mi-foot">
        <div class="mi-tags">
          <span class="mi-tag ${freqColors[m.freq] || 'daily'}">${m.freq.toUpperCase()}</span>
          <span class="mi-tag reward">+${m.reward.count} TICKET</span>
        </div>
        <button class="mi-btn" ${done ? 'disabled' : ''}>${done ? '✓' : '▶'}</button>
      </div>
    `;
    div.querySelector('.mi-btn')?.addEventListener('click', () => {
      if (!done) completeMission(m.id);
    });
    box.appendChild(div);
  });

  if ($('#missionsBadge')) $('#missionsBadge').textContent = available;
}

function completeMission(id) {
  const state    = getMissionsState();
  const allMiss  = Object.values(MISSIONS_BY_WHEEL).flat();
  const m        = allMiss.find(x => x.id === id);
  if (!m) return;
  if (state[id]?.completedAt) { toast('Misión ya completada', '✓'); return; }
  state[id] = { completedAt: Date.now() };
  setMissionsState(state);
  addTickets(currentWheelId, m.reward.count);
  renderMissions();
}

function resetMissionsIfNeeded() {
  const state = getMissionsState();
  const now   = new Date();
  let changed = false;
  const all   = Object.values(MISSIONS_BY_WHEEL).flat();
  all.forEach(m => {
    const s      = state[m.id] || {};
    const lastR  = s.lastReset ? new Date(s.lastReset) : null;
    let reset    = !lastR;
    if (lastR) {
      const diff = (now - lastR) / 86400000;
      if (m.freq === 'daily'   && lastR.toDateString() !== now.toDateString()) reset = true;
      if (m.freq === 'weekly'  && diff >= 7)  reset = true;
      if (m.freq === 'monthly' && diff >= 30) reset = true;
    }
    if (reset) { state[m.id] = { completedAt:null, lastReset:now.toISOString() }; changed = true; }
  });
  if (changed) setMissionsState(state);
}

/* ════════════════════════════════════
   MÚSICA / FONDO
════════════════════════════════════ */
function playMusic(url) {
  if (currentAudio) { currentAudio.pause(); currentAudio = null; }
  if (!url) return;
  const audio = new Audio(url);
  audio.loop = true; audio.volume = 0.3;
  audio.play().catch(() => {});
  currentAudio = audio;
}
function updateBackground(wheel) {
  playMusic(wheel.music || null);
}

/* ════════════════════════════════════
   BOOST x2
════════════════════════════════════ */
const BOOST_DURATION = 3600; // segundos
let boostState = lsGet(LS.boostState, { activeUntil:0, cooldownUntil:0 });

function getTonightMidnight() {
  const d = new Date(); d.setHours(24,0,0,0); return d.getTime();
}

function updateBoostUI() {
  const now = Date.now();
  const btn = $('#multiplierBtn'), timer = $('#boostTimer'), status = $('#boostStatus');
  if (!btn || !timer || !status) return;

  if (boostState.activeUntil > now) {
    const diff = Math.floor((boostState.activeUntil - now) / 1000);
    btn.disabled = true; btn.textContent = 'ACTIVO x2';
    timer.textContent = formatTime(diff); status.textContent = 'ACTIVO x2';
    TICKET_MULT = 2;
  } else if (boostState.cooldownUntil > now) {
    const diff = Math.floor((boostState.cooldownUntil - now) / 1000);
    btn.disabled = true; btn.textContent = 'COOLDOWN';
    timer.textContent = formatTime(diff); status.textContent = 'COOLDOWN';
    TICKET_MULT = 1;
  } else {
    btn.disabled = false; btn.textContent = 'ACTIVAR x2';
    timer.textContent = ''; status.textContent = 'DISPONIBLE';
    TICKET_MULT = 1;
  }
}

/* ════════════════════════════════════
   ZORRITO NPC
════════════════════════════════════ */
function initFox() { updateFoxMessage(); foxInterval = setInterval(updateFoxMessage, 9000); }
function updateFoxMessage() {
  const d = $('#npc-dialog');
  if (!d) return;
  const msgs = FOX_MESSAGES[currentWheelId] || FOX_MESSAGES.default;
  d.textContent = msgs[Math.floor(Math.random() * msgs.length)];
}

/* ════════════════════════════════════
   TOAST
════════════════════════════════════ */
function toast(msg, icon = '✓', type = '') {
  const t = $('#toast');
  if (!t) return;
  t.textContent = `${icon} ${msg}`;
  t.className = `toast show ${type}`;
  clearTimeout(t._tm);
  t._tm = setTimeout(() => t.classList.remove('show'), 3200);
}

/* ════════════════════════════════════
   BEEP
════════════════════════════════════ */
let _actx = null;
function getAudioCtx() {
  if (!_actx && (window.AudioContext || window.webkitAudioContext))
    _actx = new (window.AudioContext || window.webkitAudioContext)();
  return _actx;
}
function beep(freq = 440, dur = 0.03, vol = 0.03) {
  const ctx = getAudioCtx(); if (!ctx) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sine'; o.frequency.value = freq; g.gain.value = vol;
  o.connect(g); g.connect(ctx.destination); o.start();
  setTimeout(() => o.stop(), dur * 1000);
}

/* ════════════════════════════════════
   PARTÍCULAS / ESTRELLAS
════════════════════════════════════ */
function initStars() {
  const canvas = $('#bgParticles');
  if (!canvas) return;
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx   = canvas.getContext('2d');
  const COLS  = ['#8b5cf6','#c4b5fd','#ffffff','#6d28d9','#fbbf24'];
  const stars = Array.from({ length:80 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 2 + 0.5,
    o: Math.random() * 0.4 + 0.1,
    speed: Math.random() * 0.25 + 0.06,
    ci: Math.floor(Math.random() * COLS.length),
  }));
  (function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    stars.forEach(s => {
      // Pixel style: quadrados pequeños
      ctx.globalAlpha = s.o;
      ctx.fillStyle   = COLS[s.ci];
      ctx.fillRect(Math.floor(s.x), Math.floor(s.y), Math.ceil(s.r), Math.ceil(s.r));
      s.y -= s.speed;
      if (s.y < 0) { s.y = canvas.height; s.x = Math.random() * canvas.width; }
    });
    requestAnimationFrame(draw);
  })();
  window.addEventListener('resize', () => {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

/* ════════════════════════════════════
   REVEAL ANIMATION
════════════════════════════════════ */
function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold:0.12 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

/* ════════════════════════════════════
   NAV HAMBURGER
════════════════════════════════════ */
function initNav() {
  const btn = $('#hamburger'), nav = $('#main-nav');
  if (btn && nav) btn.addEventListener('click', () => nav.classList.toggle('open'));
}

/* ════════════════════════════════════
   INIT DE TICKETS (primer uso)
════════════════════════════════════ */
function initTickets() {
  ROULETTES.forEach(r => {
    if (localStorage.getItem(LS.tickets(r.id)) === null) {
      localStorage.setItem(LS.tickets(r.id), '5');
    }
  });
}

/* ════════════════════════════════════
   BOOT
════════════════════════════════════ */
function boot() {
  console.log('🎡 Moonveil Gacha iniciando…');
  initStocks();
  initTickets();
  resetMissionsIfNeeded();

  renderWheelTabs();
  renderWheel(currentWheelId);
  renderMissions();
  renderTicketsDisplay();
  renderHUDTickets();
  updateCurrentWheelInfo();
  updatePityUI();
  updateBoostUI();
  renderStats();
  updateInventoryBadge();

  const wheel = ROULETTES.find(w => w.id === currentWheelId);
  if (wheel) updateBackground(wheel);

  initStars();
  initReveal();
  initNav();
  initFox();

  // Intervalos
  boostInterval = setInterval(updateBoostUI, 1000);
  timerInterval = setInterval(() => { updateWheelTimers(); updateCurrentWheelInfo(); }, 1000);

  // Botones
  $('#btnSpin')?.addEventListener('click', () => spinWheel(1));
  $('#btnSpin10')?.addEventListener('click', () => spinWheel(10));
  $('#btnPreview')?.addEventListener('click', showPreview);
  $('#btnInventory')?.addEventListener('click', showInventory);
  $('#btnOpenRules')?.addEventListener('click', showRules);
  $('#modalClose')?.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  $('#multiplierBtn')?.addEventListener('click', () => {
    const now = Date.now();
    if (boostState.activeUntil > now || boostState.cooldownUntil > now) return;
    boostState = {
      activeUntil:    now + BOOST_DURATION * 1000,
      cooldownUntil:  getTonightMidnight(),
    };
    lsSet(LS.boostState, boostState);
    updateBoostUI();
    toast('Boost x2 activado — 1 hora', '⚡');
  });

  // Firebase auth observer
  onAuthChange(async user => {
    if (!user) return;
    currentUID = user.uid;
    await loadGachaFromFirebase(user.uid);
    renderTicketsDisplay();
    renderHUDTickets();
    updateCurrentWheelInfo();
    renderStats();
    console.log('✅ Gacha sincronizado con Firebase uid:', user.uid);
  });

  console.log('✨ window.addTickets expuesto para tienda.js');
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

/* API pública */
window.MoonveilGacha = {
  ROULETTES, addTickets, getTickets, getPityEpic: getPityEpic, getPityLeg: getPityLeg,
  getGachaInv, getStats, isWheelActive,
};