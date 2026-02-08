/**
 * premios.js
 * Sistema Gacha Moonveil - VERSIÓN CORREGIDA
 * Compatible con el sistema de tienda original
 */

/* ========== HELPERS ========== */
const $ = (s, ctx = document) => ctx.querySelector(s);
const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));
const el = (t = 'div', p = {}) => {
  const e = document.createElement(t);
  Object.assign(e, p);
  return e;
};

function wait(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

/* ========== STORAGE (usando las mismas keys originales) ========== */
const LS = {
  tickets: (wheelId) => `mv_tickets_${wheelId}`,
  pity: (wheelId) => `mv_gacha_pity_${wheelId}`,
  inventory: 'mv_gacha_inventory_v3',
  missions: 'mv_prizes_missions_v1',
  itemStock: (id) => `mv_gacha_stock_${id}`,
  boostState: 'boostState_v3'
};

function getLS(key, fallback = null) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch (e) {
    return fallback;
  }
}

function setLS(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Error guardando:', e);
  }
}

/* ========== DATOS DE RULETAS (ORIGINALES) ========== */
const ROULETTES = [
  {
    id: 'classic',
    title: 'Clásica',
    icon: '💎',
    desc: 'Premios cotidianos: esmeraldas, monedas y cofres.',
    bg: 'img-pass/catmoon.jpg',
    music: 'ald/music1.mp3',
    start: '2025-01-02',
    end: '2030-01-02',
    rewards: [
      { id:'c1', label:'Esmeraldas x3', weight:70, rarity:'common', img:'💚', desc:'Pequeño paquete de esmeraldas', stock: null },
      { id:'c2', label:'Cobre x5', weight:70, rarity:'common', img:'🪙', desc:'Monedas del juego', stock: null },
      { id:'c3', label:'Llave x1', weight:60, rarity:'uncommon', img:'📦', desc:'Una llave para un cofre', stock: null },
      { id:'c4', label:'Cobre x10', weight:50, rarity:'rare', img:'✨', desc:'Un paquetito mas grande de esmeraldas', stock: null },
      { id:'c5', label:'Esmeraldas x20', weight:4, rarity:'epic', img:'💎', desc:'Paquete especial', stock: null },
      { id:'c6', label:'Ticket de 10%', weight:4, rarity:'epic', img:'🎟️', desc:'Ticket de Descuento', stock: null },
      { id:'c7', label:'Ticket de 20%', weight:4, rarity:'epic', img:'🎟️', desc:'Ticket de Descuento', stock: null },
      { id:'c8', label:'Ticket de 30%', weight:4, rarity:'epic', img:'🎟️', desc:'Ticket de Descuento', stock: null },
      { id:'c9', label:'Ticket de 40%', weight:4, rarity:'epic', img:'🎟️', desc:'Ticket de Descuento', stock: null },
      { id:'c10', label:'Ticket de 50%', weight:4, rarity:'epic', img:'🎟️', desc:'Ticket de Descuento', stock: null },
      { id:'c11', label:'Ticket de 100% (x2)', weight:1, rarity:'legend', img:'🎟️', desc:'Ticket de Descuento Especial', stock: 5 },
      { id:'c12', label:'Paquete de cobre (x64)', weight:1, rarity:'legend', img:'✨', desc:'Una gran bolsa', stock: null },
    ]
  },
  {
    id: 'elemental',
    title: 'Ruleta de 1 cobre',
    icon: '🪙',
    desc: '¿Y porque no? 1 de Cobre',
    bg: 'img-pass/catmoon.jpg',
    music: 'ald/music3.mp3',
    start: '2025-01-02',
    end: '2025-12-23',
    rewards: [
      { id:'e1', label:'Cobre x2', weight:10, rarity:'epic', img:'💎', desc:'Paquete valioso (eso creemos)', stock: null },
      { id:'e2', label:'Ticket (0%)', weight:3, rarity:'common', img:'🎟️', desc:'Ticket con 0', stock: null },
      ...Array.from({ length: 28 }, (_, i) => ({
        id: `e${i + 3}`,
        label: 'Cobre x1',
        weight: 6,
        rarity: 'common',
        img: '🪙',
        desc: 'Un mini paquetito de Cobre',
        stock: null
      })),
      ...Array.from({ length: 10 }, (_, i) => ({
        id: `e${i + 31}`,
        label: `Episodios`,
        weight: 1,
        rarity: 'legend',
        img: '✨',
        desc: `Parte ${i + 1}`,
        stock: 1
      })),
      { id:'e41', label:'Episodios', weight:1, rarity:'legend', img:'✨', desc:'Parte XI', stock: 1 },
      { id:'e42', label:'Vacio', weight:1, rarity:'legend', img:'✨', desc:'¡Nada!', stock: null },
      { id:'e43', label:'Vacio', weight:1, rarity:'legend', img:'✨', desc:'¡Nada!', stock: null },
      { id:'e44', label:'Cobre (x64)', weight:1, rarity:'legend', img:'🪙', desc:'Una gran bolsita de cobre', stock: null },
    ]
  },
  {
    id: 'event',
    title: 'Evento',
    icon: '🎭',
    desc: 'Premios exclusivos del evento (fecha limitada).',
    bg: null,
    music: 'music/1234.mp3',
    start: '2025-12-01',
    end: '2026-01-10',
    rewards: [
      { id:'ev1', label:'Cupon del *%', weight:10, rarity:'rare', img:'🎭', desc:'Quien sabe, cuanto valdra?', stock: null },
      { id:'ev2', label:'Esmeraldas x25', weight:6, rarity:'epic', img:'💎', desc:'Paquete generoso', stock: 3 },
      { id:'ev3', label:'████', weight:1, rarity:'legend', img:'🏅', desc:'Lo sabremos, eso creo...', stock: 1 },
      { id:'ev4', label:'Cupon del 100%', weight:1, rarity:'legend', img:'🏅', desc:'Ojito un cupon...', stock: 2 },
      { id:'ev5', label:'Una llave x1', weight:18, rarity:'uncommon', img:'📦', desc:'Cofrecito...', stock: null },
      ...Array.from({ length: 10 }, (_, i) => ({
        id: `ev${i + 6}`,
        label: `Esmeraldas x${[0,5,5,10,10,10,10,15,15,5][i]}`,
        weight: 30,
        rarity: 'common',
        img: '💚',
        desc: 'Común',
        stock: null
      }))
    ]
  }
];

/* ========== MISIONES (ORIGINALES) ========== */
const MISSIONS = [
  { id:'ms1', wheelId:'classic', title:'Inicia Sesion', desc:'Hola al nuevo dia.', freq:'daily', reward:{wheelId:'classic', count:5} },
  { id:'ms2', wheelId:'classic', title:'Junta 200 monedas', desc:'Recolecta monedas en el reino.', freq:'daily', reward:{wheelId:'classic', count:1} },
  { id:'ms3', wheelId:'classic', title:'Rompe 20 bloques', desc:'Actividades de exploración.', freq:'daily', reward:{wheelId:'classic', count:2} },
  { id:'ms4', wheelId:'classic', title:'Gana 1 mini-juego', desc:'Cualquier mini-juego cuenta.', freq:'weekly', reward:{wheelId:'classic', count:3} },
  
  { id:'ms8', wheelId:'elemental', title:'¿Vamos de Compras?', desc:'Compra en la tienda, no cuenta lo gratis (x2)', freq:'daily', reward:{wheelId:'elemental', count:3} },
  { id:'ms9', wheelId:'elemental', title:'¿Y mi gato?', desc:'Domestica un gato (x1)', freq:'daily', reward:{wheelId:'elemental', count:1} },
  { id:'ms10', wheelId:'elemental', title:'Dia de Gastos', desc:'Compra articulos que sumen 500', freq:'daily', reward:{wheelId:'elemental', count:5} },
  { id:'ms11', wheelId:'elemental', title:'Dia de Comercio', desc:'Comercia con un aldeano (x5)', freq:'daily', reward:{wheelId:'elemental', count:3} },
  { id:'ms22', wheelId:'elemental', title:'¡Giremos una mas!', desc:'Gasta 5 tickets en una ruleta, menos en la misma', freq:'daily', reward:{wheelId:'elemental', count:2} },
  { id:'ms23', wheelId:'elemental', title:'Un dia mas', desc:'Pasa 1 dia', freq:'daily', reward:{wheelId:'elemental', count:1} },
  
  { id:'ms12', wheelId:'event', title:'Compra un articulo en la tienda (no cuenta nada gratis)', desc:'¿Que dia sera hoy?', freq:'daily', reward:{wheelId:'event', count:3} },
  { id:'ms13', wheelId:'event', title:'Comercia 5 veces', desc:'Dia de comerciar.', freq:'weekly', reward:{wheelId:'event', count:6} },
  { id:'ms14', wheelId:'event', title:'Derrota 20 mobs', desc:'Solo un poco...', freq:'daily', reward:{wheelId:'event', count:5} },
  { id:'ms15', wheelId:'event', title:'Derrota 40 mobs', desc:'Un poco mas...', freq:'weekly', reward:{wheelId:'event', count:10} },
  { id:'ms16', wheelId:'event', title:'Domestica 5 lobos', desc:'Guau!', freq:'weekly', reward:{wheelId:'event', count:10} },
];

/* ========== ESTADO GLOBAL ========== */
let currentWheelId = ROULETTES[0].id;
let spinning = false;
let currentAudio = null;
let TICKET_MULTIPLIER = 1;

/* ========== TICKETS (compatible con sistema original) ========== */
function getTickets(wheelId) {
  return parseInt(localStorage.getItem(LS.tickets(wheelId)) || '0', 10);
}

function setTickets(wheelId, count) {
  localStorage.setItem(LS.tickets(wheelId), String(Math.max(0, Math.floor(count))));
  renderTicketsDisplay();
  updateCurrentWheelInfo();
}

// FUNCIÓN GLOBAL para compatibilidad con tienda
function addTickets(wheelId, count) {
  const realGain = count * TICKET_MULTIPLIER;
  setTickets(wheelId, getTickets(wheelId) + realGain);
  if (TICKET_MULTIPLIER > 1) {
    toast(`+${realGain} tickets (x${TICKET_MULTIPLIER} boost)`, '✨');
  } else {
    toast(`+${realGain} tickets de ${wheelId}`, '🎟️');
  }
}

// Exponer globalmente
window.addTickets = addTickets;

/* ========== PITY ========== */
function getPity(wheelId) {
  return parseInt(localStorage.getItem(LS.pity(wheelId)) || '0', 10);
}

function setPity(wheelId, value) {
  localStorage.setItem(LS.pity(wheelId), String(value));
  updatePityIndicator();
}

function updatePityIndicator() {
  const pity = getPity(currentWheelId);
  const fill = $('#pityFill');
  const percentage = (pity / 40) * 100;
  fill.style.width = `${percentage}%`;
  
  if (pity >= 40) {
    fill.style.background = 'linear-gradient(90deg, var(--rarity-legend), var(--gold))';
  } else if (pity >= 20) {
    fill.style.background = 'linear-gradient(90deg, var(--rarity-epic), var(--rarity-legend))';
  } else {
    fill.style.background = 'linear-gradient(90deg, var(--accent), var(--gold))';
  }
}

/* ========== STOCK ========== */
function getItemStock(itemId) {
  const key = LS.itemStock(itemId);
  const stored = localStorage.getItem(key);
  return stored !== null ? parseInt(stored, 10) : null;
}

function setItemStock(itemId, stock) {
  if (stock === null) {
    localStorage.removeItem(LS.itemStock(itemId));
  } else {
    localStorage.setItem(LS.itemStock(itemId), String(Math.max(0, stock)));
  }
}

function initItemStocks() {
  ROULETTES.forEach(wheel => {
    wheel.rewards.forEach(reward => {
      if (reward.stock !== null) {
        const stored = getItemStock(reward.id);
        if (stored === null) {
          setItemStock(reward.id, reward.stock);
        }
      }
    });
  });
}

function decreaseItemStock(itemId) {
  const current = getItemStock(itemId);
  if (current !== null && current > 0) {
    setItemStock(itemId, current - 1);
    return true;
  }
  return current === null;
}

/* ========== INVENTARIO SEPARADO POR RULETA ========== */
function getInventory() {
  return getLS(LS.inventory, {});
}

function addToInventory(wheelId, reward) {
  const inv = getInventory();
  const key = `${wheelId}_${reward.id}`;
  
  if (!inv[key]) {
    inv[key] = {
      wheelId,
      rewardId: reward.id,
      label: reward.label,
      img: reward.img,
      rarity: reward.rarity,
      count: 0,
      lastObtained: null
    };
  }
  
  inv[key].count++;
  inv[key].lastObtained = new Date().toISOString();
  
  setLS(LS.inventory, inv);
}

/* ========== GIRO CON PITY ========== */
function pickRewardWithPity(wheelId) {
  const wheel = ROULETTES.find(w => w.id === wheelId);
  if (!wheel) return null;
  
  const pity = getPity(wheelId);
  
  const availableRewards = wheel.rewards.filter(r => {
    const stock = getItemStock(r.id);
    return stock === null || stock > 0;
  });
  
  if (availableRewards.length === 0) {
    toast('¡No hay más premios disponibles!', '⚠️');
    return null;
  }
  
  const epicRewards = availableRewards.filter(r => r.rarity === 'epic');
  const legendRewards = availableRewards.filter(r => r.rarity === 'legend');
  
  // PITY 40 = legendario
  if (pity >= 40 && legendRewards.length > 0) {
    const reward = legendRewards[Math.floor(Math.random() * legendRewards.length)];
    setPity(wheelId, 0);
    return reward;
  }
  
  // PITY 20 = épico
  if (pity >= 20 && epicRewards.length > 0) {
    const reward = epicRewards[Math.floor(Math.random() * epicRewards.length)];
    setPity(wheelId, 0);
    return reward;
  }
  
  // Tirada normal
  const totalWeight = availableRewards.reduce((sum, r) => sum + r.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < availableRewards.length; i++) {
    random -= availableRewards[i].weight;
    if (random <= 0) {
      const reward = availableRewards[i];
      
      if (reward.rarity === 'epic' || reward.rarity === 'legend') {
        setPity(wheelId, 0);
      } else {
        setPity(wheelId, pity + 1);
      }
      
      return reward;
    }
  }
  
  return availableRewards[availableRewards.length - 1];
}

/* ========== RENDERIZADO DE RULETA ========== */
function renderWheel(wheelId) {
  const wheel = ROULETTES.find(w => w.id === wheelId);
  if (!wheel) return;
  
  const container = $('#wheel');
  container.innerHTML = '';
  
  const rewards = wheel.rewards;
  const n = rewards.length;
  const size = 440;
  const radius = size / 2;
  const center = radius;
  const anglePer = 360 / n;
  
  const wrapper = el('div', { className: 'wheel-wrapper' });
  Object.assign(wrapper.style, {
    width: `${size}px`,
    height: `${size}px`,
    position: 'relative',
    transformOrigin: 'center center',
    transition: 'transform 5s cubic-bezier(0.12, 0.85, 0.29, 1.1)'
  });
  
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.style.overflow = 'visible';
  
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `
    <radialGradient id="gradWheel">
      <stop offset="0%" stop-color="#0f141c"/>
      <stop offset="100%" stop-color="#161b26"/>
    </radialGradient>
    <linearGradient id="gradEdge" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(48,209,88,0.6)"/>
      <stop offset="100%" stop-color="rgba(48,209,88,0.1)"/>
    </linearGradient>
  `;
  svg.appendChild(defs);
  
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  bg.setAttribute('cx', center);
  bg.setAttribute('cy', center);
  bg.setAttribute('r', radius);
  bg.setAttribute('fill', 'url(#gradWheel)');
  svg.appendChild(bg);
  
  rewards.forEach((r, i) => {
    const start = (i * anglePer - 90) * Math.PI / 180;
    const end = ((i + 1) * anglePer - 90) * Math.PI / 180;
    const x1 = center + radius * Math.cos(start);
    const y1 = center + radius * Math.sin(start);
    const x2 = center + radius * Math.cos(end);
    const y2 = center + radius * Math.sin(end);
    const largeArc = anglePer > 180 ? 1 : 0;
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const d = `M ${center},${center} L ${x1},${y1} A ${radius},${radius} 0 ${largeArc} 1 ${x2},${y2} Z`;
    
    let fill = 'rgba(255,255,255,0.03)';
    if (r.rarity === 'common') fill = 'rgba(255,255,255,0.04)';
    else if (r.rarity === 'uncommon') fill = 'rgba(74,222,128,0.08)';
    else if (r.rarity === 'rare') fill = 'rgba(59,130,246,0.08)';
    else if (r.rarity === 'epic') fill = 'rgba(168,85,247,0.10)';
    else if (r.rarity === 'legend') fill = 'rgba(251,191,36,0.12)';
    
    path.setAttribute('d', d);
    path.setAttribute('fill', fill);
    path.setAttribute('stroke', 'rgba(255,255,255,0.06)');
    path.setAttribute('stroke-width', '1');
    svg.appendChild(path);
    
    const midAngle = (start + end) / 2;
    const tx = center + (radius * 0.65) * Math.cos(midAngle);
    const ty = center + (radius * 0.65) * Math.sin(midAngle);
    const emoji = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    emoji.setAttribute('x', tx);
    emoji.setAttribute('y', ty);
    emoji.setAttribute('text-anchor', 'middle');
    emoji.setAttribute('alignment-baseline', 'middle');
    emoji.setAttribute('font-size', '20');
    emoji.textContent = r.img || '🎁';
    svg.appendChild(emoji);
  });
  
  const edge = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  edge.setAttribute('cx', center);
  edge.setAttribute('cy', center);
  edge.setAttribute('r', radius - 3);
  edge.setAttribute('stroke', 'url(#gradEdge)');
  edge.setAttribute('stroke-width', '4');
  edge.setAttribute('fill', 'none');
  svg.appendChild(edge);
  
  wrapper.appendChild(svg);
  container.appendChild(wrapper);
  
  updateCurrentWheelInfo();
  updatePityIndicator();
  checkWheelLock(wheel);
}

/* ========== BLOQUEO CORREGIDO ========== */
function checkWheelLock(wheel) {
  const lockEl = $('#wheelLock');
  const txt = $('#lockText');
  const rangeEl = $('#lockRange');
  
  if (!lockEl || !txt || !rangeEl) return;
  
  const now = new Date();
  const start = wheel.start ? new Date(wheel.start + 'T00:00:00') : null;
  const end = wheel.end ? new Date(wheel.end + 'T23:59:59') : null;
  
  // FIX: Verificar correctamente si está activa
  const active = (!start || now >= start) && (!end || now <= end);
  
  if (!active) {
    lockEl.hidden = false;
    
    if (start && now < start) {
      txt.textContent = '✨ Próximamente';
      rangeEl.textContent = `Disponible desde ${start.toLocaleDateString('es-ES')}`;
    } else if (end && now > end) {
      txt.textContent = '⏳ Finalizada';
      rangeEl.textContent = `Finalizó el ${end.toLocaleDateString('es-ES')}`;
    }
  } else {
    lockEl.hidden = true;
  }
}

/* ========== GIRO ========== */
async function spinWheel(times = 1) {
  if (spinning) return;
  
  const wheel = ROULETTES.find(w => w.id === currentWheelId);
  if (!wheel) return;
  
  const tickets = getTickets(currentWheelId);
  if (tickets < times) {
    toast(`Necesitas ${times} tickets`, '⚠️');
    return;
  }
  
  // Verificar disponibilidad
  const now = new Date();
  const start = wheel.start ? new Date(wheel.start + 'T00:00:00') : null;
  const end = wheel.end ? new Date(wheel.end + 'T23:59:59') : null;
  const active = (!start || now >= start) && (!end || now <= end);
  
  if (!active) {
    toast('Esta ruleta está cerrada', '🔒');
    return;
  }
  
  setTickets(currentWheelId, tickets - times);
  spinning = true;
  
  const results = [];
  
  for (let i = 0; i < times; i++) {
    const reward = pickRewardWithPity(currentWheelId);
    if (!reward) {
      spinning = false;
      return;
    }
    
    const stockOk = decreaseItemStock(reward.id);
    if (!stockOk) {
      toast(`${reward.label} agotado`, '⚠️');
      continue;
    }
    
    addToInventory(currentWheelId, reward);
    results.push(reward);
  }
  
  if (results.length === 0) {
    spinning = false;
    return;
  }
  
  // Animación
  const lastReward = results[results.length - 1];
  const wheelEl = $('.wheel-wrapper');
  
  wheelEl.style.transition = 'none';
  wheelEl.style.transform = 'rotate(0deg)';
  void wheelEl.offsetWidth;
  
  const rewards = wheel.rewards;
  const idx = rewards.findIndex(r => r.id === lastReward.id);
  const anglePer = 360 / rewards.length;
  const targetCenter = idx * anglePer + anglePer / 2;
  const spins = 6;
  const finalRotation = spins * 360 + (270 - targetCenter);
  
  wheelEl.style.transition = 'transform 4.5s cubic-bezier(0.12, 0.85, 0.29, 1.1)';
  wheelEl.style.transform = `rotate(${finalRotation}deg)`;
  
  const tickInterval = setInterval(() => beep(120, 0.02), 100);
  await wait(4600);
  clearInterval(tickInterval);
  
  spinning = false;
  
  if (times === 1) {
    showPrizeModal(lastReward);
  } else {
    showMultiPrizeModal(results);
  }
  
  updateLastPrize(lastReward);
  beep(880, 0.05, 0.06);
}

/* ========== MODALES ========== */
function showPrizeModal(reward) {
  const modal = $('#modal');
  const content = $('#modalContent');
  
  content.innerHTML = `
    <div style="text-align:center">
      <div style="font-size:72px;margin-bottom:14px;animation:prizeReveal 0.8s ease">${reward.img}</div>
      <h2 style="color:var(--rarity-${reward.rarity});margin-bottom:6px">${reward.label}</h2>
      <p style="color:var(--muted);margin-bottom:14px">${reward.desc}</p>
      <div class="tag rarity-${reward.rarity}" style="display:inline-block;padding:6px 14px;font-size:11px;text-transform:uppercase">
        ${reward.rarity}
      </div>
      <div style="margin-top:20px">
        <button id="btnAck" class="btn btn--primary">¡Genial!</button>
      </div>
    </div>
  `;
  
  $('#btnAck').addEventListener('click', () => modal.setAttribute('aria-hidden', 'true'));
  modal.setAttribute('aria-hidden', 'false');
}

function showMultiPrizeModal(rewards) {
  const modal = $('#modal');
  const content = $('#modalContent');
  
  let html = `<h2 style="text-align:center;margin-bottom:20px">¡Tirada x${rewards.length}!</h2>`;
  html += `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:18px">`;
  
  rewards.forEach(r => {
    html += `
      <div class="prize-card rarity-${r.rarity}" style="padding:10px">
        <div style="font-size:36px;margin-bottom:6px">${r.img}</div>
        <div style="font-size:12px;font-weight:600">${r.label}</div>
        <div class="tag ${r.rarity}" style="margin-top:4px;font-size:9px">${r.rarity}</div>
      </div>
    `;
  });
  
  html += `</div>`;
  html += `<div style="text-align:center"><button id="btnAckMulti" class="btn btn--primary">Continuar</button></div>`;
  
  content.innerHTML = html;
  $('#btnAckMulti').addEventListener('click', () => modal.setAttribute('aria-hidden', 'true'));
  modal.setAttribute('aria-hidden', 'false');
}

function updateLastPrize(reward) {
  const container = $('#lastPrize');
  container.innerHTML = `
    <div class="prize-card rarity-${reward.rarity}">
      <div class="prize-img">${reward.img}</div>
      <div class="prize-name">${reward.label}</div>
      <div class="prize-rarity" style="color:var(--rarity-${reward.rarity})">${reward.rarity}</div>
    </div>
  `;
}

/* ========== INVENTARIO SEPARADO POR RULETA ========== */
function showInventory() {
  const inv = getInventory();
  
  // Filtrar por ruleta actual
  const itemsThisWheel = Object.values(inv).filter(item => item.wheelId === currentWheelId);
  
  const wheelName = ROULETTES.find(w => w.id === currentWheelId)?.title || currentWheelId;
  
  const modal = $('#modal');
  const content = $('#modalContent');
  
  if (itemsThisWheel.length === 0) {
    content.innerHTML = `
      <h2>📦 Inventario - ${wheelName}</h2>
      <p style="text-align:center;color:var(--muted);padding:36px">No has ganado nada de esta ruleta aún.</p>
      <div style="text-align:center"><button id="btnCloseInv" class="btn btn--ghost">Cerrar</button></div>
    `;
    $('#btnCloseInv').addEventListener('click', () => modal.setAttribute('aria-hidden', 'true'));
    modal.setAttribute('aria-hidden', 'false');
    return;
  }
  
  // Ordenar por rareza
  itemsThisWheel.sort((a, b) => {
    const rarityOrder = { legend: 0, epic: 1, rare: 2, uncommon: 3, common: 4 };
    return rarityOrder[a.rarity] - rarityOrder[b.rarity];
  });
  
  let html = `<h2>📦 Inventario - ${wheelName} (${itemsThisWheel.length} tipos)</h2>`;
  html += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;margin:18px 0;max-height:58vh;overflow-y:auto">`;
  
  itemsThisWheel.forEach(item => {
    html += `
      <div class="prize-card rarity-${item.rarity}" style="padding:12px">
        <div style="font-size:42px;margin-bottom:6px">${item.img}</div>
        <div style="font-weight:700;font-size:13px;margin-bottom:3px">${item.label}</div>
        <div class="tag ${item.rarity}" style="margin-bottom:6px;font-size:9px">${item.rarity}</div>
        <div style="font-size:16px;font-weight:700;color:var(--gold)">x${item.count}</div>
      </div>
    `;
  });
  
  html += `</div><div style="text-align:center"><button id="btnCloseInv" class="btn btn--ghost">Cerrar</button></div>`;
  
  content.innerHTML = html;
  $('#btnCloseInv').addEventListener('click', () => modal.setAttribute('aria-hidden', 'true'));
  modal.setAttribute('aria-hidden', 'false');
}

/* ========== MÚSICA ========== */
async function playMusic(url) {
  if (!url) {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    return;
  }
  
  if (currentAudio) {
    currentAudio.pause();
  }
  
  const audio = new Audio(url);
  audio.loop = true;
  audio.volume = 0.4;
  audio.play().catch(() => {});
  currentAudio = audio;
}

/* ========== FONDO ========== */
function updateBackground(wheel) {
  const layer = $('#bgLayer');
  
  if (wheel.bg) {
    layer.style.backgroundImage = `url("${wheel.bg}")`;
  } else {
    layer.style.backgroundImage = '';
  }
  
  if (wheel.music) {
    playMusic(wheel.music);
  } else {
    playMusic(null);
  }
}

/* ========== MISIONES ========== */
function getMissionsState() {
  return getLS(LS.missions, {});
}

function setMissionsState(state) {
  setLS(LS.missions, state);
}

function renderMissions() {
  const box = $('#missionsList');
  box.innerHTML = '';
  
  const msState = getMissionsState();
  const missions = MISSIONS.filter(m => m.wheelId === currentWheelId);
  
  let availableCount = 0;
  
  missions.forEach(m => {
    const state = msState[m.id] || { completedAt: null, lastReset: null };
    const completed = !!state.completedAt;
    
    if (!completed) availableCount++;
    
    const freqIcons = { daily: '🌞', weekly: '📅', monthly: '🌙' };
    const freqLabels = { daily: 'Diaria', weekly: 'Semanal', monthly: 'Mensual' };
    
    const div = el('div', { className: `mission${completed ? ' completed' : ''}` });
    div.innerHTML = `
      <div class="m-icon">${freqIcons[m.freq]}</div>
      <div class="m-body">
        <div class="m-title">${m.title}</div>
        <div class="m-sub">${m.desc}</div>
        <div class="m-meta">
          <span class="tag ${m.freq}">${freqLabels[m.freq]}</span>
          <span class="tag reward">🎟️ +${m.reward.count}</span>
        </div>
      </div>
      <div class="m-actions">
        <button class="m-btn" ${completed ? 'disabled' : ''}>
          ${completed ? '✓' : '▶'}
        </button>
      </div>
    `;
    
    div.querySelector('.m-btn').addEventListener('click', () => {
      if (!completed) completeMission(m.id);
    });
    
    box.appendChild(div);
  });
  
  const badge = $('#missionsBadge');
  if (badge) badge.textContent = availableCount;
}

function completeMission(id) {
  const msState = getMissionsState();
  const m = MISSIONS.find(x => x.id === id);
  if (!m) return;
  
  const state = msState[id] || { completedAt: null, lastReset: Date.now() };
  
  if (state.completedAt) {
    toast('Misión ya completada', '✓');
    return;
  }
  
  state.completedAt = Date.now();
  msState[id] = state;
  setMissionsState(msState);
  
  addTickets(m.reward.wheelId, m.reward.count);
  renderMissions();
}

function resetMissionsIfNeeded() {
  const state = getMissionsState();
  const now = new Date();
  let changed = false;
  
  MISSIONS.forEach(m => {
    const s = state[m.id] || {};
    const lastReset = s.lastReset ? new Date(s.lastReset) : null;
    let shouldReset = false;
    
    if (!lastReset) {
      shouldReset = true;
    } else {
      if (m.freq === 'daily') {
        shouldReset = !(lastReset.toDateString() === now.toDateString());
      } else if (m.freq === 'weekly') {
        const diff = Math.floor((now - lastReset) / (1000 * 60 * 60 * 24));
        if (diff >= 7) shouldReset = true;
      } else if (m.freq === 'monthly') {
        const diff = Math.floor((now - lastReset) / (1000 * 60 * 60 * 24));
        if (diff >= 30) shouldReset = true;
      }
    }
    
    if (shouldReset) {
      state[m.id] = { completedAt: null, lastReset: now.toISOString() };
      changed = true;
    }
  });
  
  if (changed) setMissionsState(state);
}

/* ========== TABS ========== */
function renderWheelTabs() {
  const container = $('#wheelTabs');
  container.innerHTML = '';
  
  ROULETTES.forEach(wheel => {
    const tab = el('div', { className: 'wheel-tab' });
    if (wheel.id === currentWheelId) tab.classList.add('active');
    
    const now = new Date();
    const start = wheel.start ? new Date(wheel.start + 'T00:00:00') : null;
    const end = wheel.end ? new Date(wheel.end + 'T23:59:59') : null;
    const active = (!start || now >= start) && (!end || now <= end);
    
    tab.innerHTML = `
      <span class="wheel-tab-icon">${wheel.icon}</span>
      <span class="wheel-tab-name">${wheel.title}</span>
      <span class="wheel-tab-desc">${wheel.desc}</span>
      <span class="wheel-tab-status ${active ? 'active' : 'locked'}">${active ? '●' : '🔒'}</span>
    `;
    
    tab.addEventListener('click', () => {
      currentWheelId = wheel.id;
      renderWheelTabs();
      renderWheel(wheel.id);
      renderMissions();
      updateCurrentWheelInfo();
      updateBackground(wheel);
    });
    
    container.appendChild(tab);
  });
}

/* ========== INFO ACTUAL ========== */
function updateCurrentWheelInfo() {
  const wheel = ROULETTES.find(w => w.id === currentWheelId);
  if (!wheel) return;
  
  $('#currentWheelName').textContent = wheel.title;
  $('#currentWheelTickets').textContent = `${getTickets(currentWheelId)}`;
  $('#currentPity').textContent = `${getPity(currentWheelId)}/40`;
  $('#wheelDesc').textContent = wheel.desc;
  
  const expireBox = $('#wheelExpire');
  if (wheel.end) {
    const now = new Date();
    const end = new Date(wheel.end + 'T23:59:59');
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    
    if (diff > 0 && diff <= 30) {
      expireBox.textContent = `⏳ Quedan ${diff} día${diff === 1 ? '' : 's'}`;
      expireBox.style.display = 'inline-block';
    } else {
      expireBox.style.display = 'none';
    }
  } else {
    expireBox.style.display = 'none';
  }
}

/* ========== TICKETS DISPLAY ========== */
function renderTicketsDisplay() {
  const box = $('#ticketsDisplay');
  box.innerHTML = '';
  
  ROULETTES.forEach(wheel => {
    const badge = el('div', { className: 'ticket-badge' });
    badge.innerHTML = `
      <div class="ticket-icon">${wheel.icon}</div>
      <div class="ticket-info">
        <div class="ticket-name">${wheel.title}</div>
        <div class="ticket-count">${getTickets(wheel.id)}</div>
      </div>
    `;
    box.appendChild(badge);
  });
}

/* ========== BOOST ========== */
const BOOST_DURATION = 60 * 60;
let boostState = getLS(LS.boostState, { activeUntil: 0, cooldownUntil: 0 });
let boostInterval = null;

function getTonightMidnight() {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d.getTime();
}

function updateBoostUI() {
  const now = Date.now();
  const btn = $('#multiplierBtn');
  const timer = $('#boostTimer');
  
  if (boostState.activeUntil > now) {
    const diff = Math.floor((boostState.activeUntil - now) / 1000);
    btn.disabled = true;
    btn.classList.add('active');
    btn.textContent = `x2`;
    timer.textContent = formatTime(diff);
    TICKET_MULTIPLIER = 2;
  } else if (boostState.cooldownUntil > now) {
    const diff = Math.floor((boostState.cooldownUntil - now) / 1000);
    btn.disabled = true;
    btn.classList.remove('active');
    btn.textContent = 'Espera';
    timer.textContent = formatTime(diff);
    TICKET_MULTIPLIER = 1;
    
    if (now >= boostState.cooldownUntil) {
      boostState.cooldownUntil = 0;
      setLS(LS.boostState, boostState);
    }
  } else {
    btn.disabled = false;
    btn.classList.remove('active');
    btn.textContent = 'Activar';
    timer.textContent = '';
    TICKET_MULTIPLIER = 1;
  }
}

function formatTime(sec) {
  const h = String(Math.floor(sec / 3600)).padStart(2, '0');
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

$('#multiplierBtn').addEventListener('click', () => {
  const now = Date.now();
  
  if (boostState.activeUntil > now || boostState.cooldownUntil > now) return;
  
  boostState.activeUntil = now + BOOST_DURATION * 1000;
  boostState.cooldownUntil = getTonightMidnight();
  
  setLS(LS.boostState, boostState);
  updateBoostUI();
  toast('¡Boost x2 activado por 1 hora!', '⚡');
});

function startBoostInterval() {
  if (boostInterval) clearInterval(boostInterval);
  boostInterval = setInterval(updateBoostUI, 1000);
}

/* ========== TOAST ========== */
function toast(msg, icon = '✓') {
  const t = $('#toast');
  const iconEl = $('.toast-icon', t);
  const textEl = $('.toast-text', t);
  
  if (iconEl) iconEl.textContent = icon;
  if (textEl) textEl.textContent = msg;
  
  t.classList.add('show');
  clearTimeout(t._tm);
  t._tm = setTimeout(() => t.classList.remove('show'), 3000);
}

/* ========== BEEP ========== */
let _audioCtx = null;
function getAudioCtx() {
  if (!_audioCtx && (window.AudioContext || window.webkitAudioContext)) {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return _audioCtx;
}

function beep(freq = 440, dur = 0.03, vol = 0.03) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.value = freq;
  g.gain.value = vol;
  o.connect(g);
  g.connect(ctx.destination);
  o.start();
  setTimeout(() => o.stop(), dur * 1000);
}

/* ========== PREVIEW ========== */
function showPreview() {
  const wheel = ROULETTES.find(w => w.id === currentWheelId);
  if (!wheel) return;
  
  const modal = $('#modal');
  const content = $('#modalContent');
  
  let html = `<h2>👁️ Premios — ${wheel.title}</h2>`;
  html += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;margin:18px 0;max-height:58vh;overflow-y:auto">`;
  
  wheel.rewards.forEach(r => {
    const stock = getItemStock(r.id);
    const stockText = stock !== null ? `Stock: ${stock}` : 'Ilimitado';
    
    html += `
      <div class="prize-card rarity-${r.rarity}" style="padding:10px">
        <div style="font-size:36px;margin-bottom:6px">${r.img}</div>
        <div style="font-weight:700;font-size:12px;margin-bottom:3px">${r.label}</div>
        <div class="tag ${r.rarity}" style="margin:3px 0;font-size:9px">${r.rarity}</div>
        <div style="font-size:10px;color:var(--muted)">${stockText}</div>
        <div style="font-size:10px;color:var(--muted);margin-top:3px">${r.desc}</div>
      </div>
    `;
  });
  
  html += `</div><div style="text-align:center"><button id="btnClosePrev" class="btn btn--ghost">Cerrar</button></div>`;
  
  content.innerHTML = html;
  $('#btnClosePrev').addEventListener('click', () => modal.setAttribute('aria-hidden', 'true'));
  modal.setAttribute('aria-hidden', 'false');
}

/* ========== REGLAS ========== */
function showRules() {
  const modal = $('#modal');
  const content = $('#modalContent');
  
  content.innerHTML = `
    <h2>📜 Reglas del Sistema Gacha</h2>
    <div style="line-height:1.7;color:var(--muted);font-size:14px">
      <h3 style="color:var(--text);margin-top:18px">🎟️ Tickets</h3>
      <ul style="margin:8px 0 8px 20px">
        <li>Cada ruleta tiene sus propios tickets</li>
        <li>Completa misiones para obtener tickets gratis</li>
        <li>También puedes comprarlos en la tienda</li>
      </ul>
      
      <h3 style="color:var(--text);margin-top:18px">🎲 Sistema de Pity</h3>
      <ul style="margin:8px 0 8px 20px">
        <li><strong style="color:var(--rarity-epic)">20 tiros</strong> sin épico/legendario → Épico garantizado</li>
        <li><strong style="color:var(--rarity-legend)">40 tiros</strong> sin legendario → Legendario garantizado</li>
        <li>El contador se resetea al obtener un premio épico o legendario</li>
      </ul>
      
      <h3 style="color:var(--text);margin-top:18px">📦 Stock Limitado</h3>
      <ul style="margin:8px 0 8px 20px">
        <li>Algunos items legendarios tienen stock limitado</li>
        <li>Una vez agotados, no volverán a aparecer</li>
        <li>Los items "Ilimitado" siempre están disponibles</li>
      </ul>
      
      <h3 style="color:var(--text);margin-top:18px">🎯 Misiones</h3>
      <ul style="margin:8px 0 8px 20px">
        <li><strong style="color:#22c55e">Diarias:</strong> Se resetean cada 24h</li>
        <li><strong style="color:#3b82f6">Semanales:</strong> Se resetean cada 7 días</li>
        <li><strong style="color:#a855f7">Mensuales:</strong> Se resetean cada 30 días</li>
      </ul>
      
      <h3 style="color:var(--text);margin-top:18px">⚡ Boost x2</h3>
      <ul style="margin:8px 0 8px 20px">
        <li>Duplica los tickets obtenidos por 1 hora</li>
        <li>Después entra en cooldown hasta medianoche</li>
        <li>Úsalo sabiamente para maximizar recompensas</li>
      </ul>
    </div>
    <div style="text-align:center;margin-top:22px">
      <button id="btnCloseRules" class="btn btn--primary">Entendido</button>
    </div>
  `;
  
  $('#btnCloseRules').addEventListener('click', () => modal.setAttribute('aria-hidden', 'true'));
  modal.setAttribute('aria-hidden', 'false');
}

/* ========== PARTÍCULAS ========== */
function initParticles() {
  const canvas = $('#bgParticles');
  if (!canvas) return;
  
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  const ctx = canvas.getContext('2d');
  const particles = [];
  
  for (let i = 0; i < 40; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.4 + 0.2
    });
  }
  
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(48, 209, 88, ${p.opacity})`;
      ctx.fill();
    });
    
    requestAnimationFrame(animate);
  }
  
  animate();
  
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

/* ========== INICIALIZACIÓN ========== */
function boot() {
  initItemStocks();
  
  // Tickets iniciales
  ROULETTES.forEach(r => {
    if (localStorage.getItem(LS.tickets(r.id)) === null) {
      localStorage.setItem(LS.tickets(r.id), '3');
    }
  });
  
  resetMissionsIfNeeded();
  
  renderWheelTabs();
  renderWheel(currentWheelId);
  renderMissions();
  renderTicketsDisplay();
  updateCurrentWheelInfo();
  updateBoostUI();
  startBoostInterval();
  
  const wheel = ROULETTES.find(w => w.id === currentWheelId);
  if (wheel) updateBackground(wheel);
  
  initParticles();
  
  $('#btnSpin').addEventListener('click', () => spinWheel(1));
  $('#btnSpin10').addEventListener('click', () => spinWheel(10));
  $('#btnPreview').addEventListener('click', showPreview);
  $('#btnInventory').addEventListener('click', showInventory);
  $('#btnOpenRules').addEventListener('click', showRules);
  $('#modalClose').addEventListener('click', () => $('#modal').setAttribute('aria-hidden', 'true'));
  
  console.log('✨ Sistema Gacha Moonveil iniciado');
  console.log('📌 Función addTickets() disponible globalmente para tienda');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

/* ========== API GLOBAL ========== */
window.MoonveilGacha = {
  ROULETTES,
  MISSIONS,
  addTickets,  // EXPORTADA para tienda
  getTickets,
  getPity,
  getInventory
};