/**
 * premios_final.js
 *
 * Moonveil — Premios final v1
 *
 * Características implementadas:
 * - Varias ruletas (definidas en JS) con:
 *    - id, title, description, start/end (opcionales), bg (imagen o color), music (opcional)
 *    - rewards: array de { id, label, weight, rarity, img (emoji|dataURL|url), desc }
 * - Tickets separados por ruleta (localStorage)
 * - Misiones reseteables (24h / 7d / 30d) que otorgan tickets a una ruleta
 * - Ruletas temporales: si out-of-range muestran overlay "bloqueada" + partículas
 * - Cambio de fondo y música al cambiar de ruleta (fade audio)
 * - Giro animado con selección ponderada y consolida historial (localStorage)
 * - Previsualización y modal con detalle
 * - Partículas de bloqueo (canvas simple)
 *
 * NOTAS:
 * - Edita la constante ROULETTES para cambiar/añadir ruletas y premios (todo en JS).
 * - Archivos multimedia: usa rutas en assets/ o data URLs.
 */


/* ================= MULTIPLICADOR DE TICKETS ================= */
let TICKET_MULTIPLIER = 1;


/* -------------------------- Helpers -------------------------- */
const $ = (s, ctx=document) => ctx.querySelector(s);
const $$ = (s, ctx=document) => Array.from((ctx||document).querySelectorAll(s));
const el = (t='div', p={}) => { const e=document.createElement(t); Object.assign(e, p); return e; };
function toast(msg, ms=2500){ const t = $('#toast'); if(!t) return console.log(msg); t.textContent = msg; t.classList.add('show'); clearTimeout(t._tm); t._tm = setTimeout(()=> t.classList.remove('show'), ms); }

/* -------------------------- Storage keys -------------------------- */
const LS = {
  tickets: (wheelId) => `mv_tickets_${wheelId}`,
  history: 'mv_prizes_history_v2',
  missions: 'mv_prizes_missions_v1'
};
function getLS(key, fallback=null){ try{ const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }catch(e){ return fallback; } }
function setLS(key, value){ try{ localStorage.setItem(key, JSON.stringify(value)); }catch(e){/* ignore */} }

/* -------------------------- App data (editable) --------------------------
 Each wheel:
  - id: string
  - title: display name
  - desc: short description
  - start/end: optional ISO date strings (YYYY-MM-DD) inclusive
  - bg: url string or color
  - music: url string or null
  - openWhen: optional boolean function (for advanced checks)
  - rewards: array of { id, label, weight, rarity, img, desc }
*/
const ROULETTES = [
  {
    id: 'classic',
    title: 'Clásica',
    desc: 'Premios cotidianos: esmeraldas, monedas y cofres.',
    bg: 'img-pass/catmoon.jpg',
    music: 'ald/music1.mp3',
    start: '2025-01-02',
    end: '2030-01-02',
    rewards: [
      { id:'c1', label:'Esmeraldas x3', weight:70, rarity:'common', img:'💚', desc:'Pequeño paquete de esmeraldas' },
      { id:'c2', label:'Cobre x5', weight:70, rarity:'common', img:'🪙', desc:'Monedas del juego' },
      { id:'c3', label:'Llave x1', weight:60, rarity:'uncommon', img:'📦', desc:'Una llave para un cofre' },
      { id:'c4', label:'Cobre x10', weight:50, rarity:'rare', img:'✨', desc:'Un paquetito mas grande de esmeraldas' },
      { id:'c5', label:'Esmeraldas x20', weight:4, rarity:'epic', img:'💎', desc:'Paquete especial' },
      { id:'c6', label:'Ticket de 10%', weight:4, rarity:'epic', img:'🎟️', desc:'Ticket de Descuento' },
      { id:'c7', label:'Ticket de 20%', weight:4, rarity:'epic', img:'🎟️', desc:'Ticket de Descuento' },
      { id:'c8', label:'Ticket de 30%', weight:4, rarity:'epic', img:'🎟️', desc:'Ticket de Descuento' },
      { id:'c9', label:'Ticket de 40%', weight:4, rarity:'epic', img:'🎟️', desc:'Ticket de Descuento' },
      { id:'c10', label:'Ticket de 50%', weight:4, rarity:'epic', img:'🎟️', desc:'Ticket de Descuento' },
      { id:'c11', label:'Ticket de 100% (x2)', weight:1, rarity:'legend', img:'🎟️', desc:'Ticket de Descuento Especial' },
      { id:'c12', label:'Paquete de cobre (x64)', weight:1, rarity:'legend', img:'✨', desc:'Una garn bolsa' },
    ]
  },
  {
    id: 'mystic',
    title: 'Ruleta de Halloween',
    desc: 'Requiere Tickets de Halloween.',
    bg: null,
    music: 'music/spooky.mp3',
    // example temporally locked ruleta
    start: '2025-10-02',
    end: '2025-12-01',
    rewards: [
      { id:'m1', label:'Esmeradas x40', weight:6, rarity:'rare', img:'💚', desc:'Un paquetito de esmeraldas' },
      { id:'m2', label:'Esmeraldas x10', weight:30, rarity:'common', img:'💚', desc:'Paquete moderado' },
      { id:'m3', label:'Llave (x1)', weight:25, rarity:'uncommon', img:'📦', desc:'La llave de un cofre de la tematica' },
      { id:'m4', label:'Un libro', weight:3, rarity:'legend', img:'🏆', desc:'Un pequeño libro de la temporada' },
      { id:'m13', label:'El pase de la temporada', weight:3, rarity:'legend', img:'🏆', desc:'El pase de esta temporada (Octubre)' },
      { id:'m5', label:'Ticket  de Desc. 50%', weight:4, rarity:'rare', img:'🎟️', desc:'Ticket' },
      { id:'m6', label:'Ticket  de Desc. 40%', weight:4, rarity:'rare', img:'🎟️', desc:'Ticket' },
      { id:'m7', label:'Ticket  de Desc. 30%', weight:4, rarity:'rare', img:'🎟️', desc:'Ticket' },
      { id:'m8', label:'Ticket  de Desc. 20%', weight:4, rarity:'rare', img:'🎟️', desc:'Ticket' },
      { id:'m9', label:'Esmeraldas x5', weight:30, rarity:'common', img:'💚', desc:'Bueno creo que se le cayo un poco mas' },
      { id:'m10', label:'Esmeraldas x1', weight:30, rarity:'common', img:'💚', desc:'Creo que a un aldeano se le cayo' },
      { id:'m11', label:'Esmeraldas x15', weight:30, rarity:'common', img:'💚', desc:'Paquete de una mini bolsa' },
      { id:'m12', label:'Esmeraldas x20', weight:30, rarity:'common', img:'💚', desc:'Paquete de un mini cofre' },
    ]
  },
  /*{
    id: 'elemental',
    title: 'Elemental',
    desc: 'Cofres por elemento y recursos únicos.',
    bg: 'img-pass/catmoon.jpg',
    music: 'music/november.mp3',
    start: '2025-01-02',
    end: '2030-01-02',
    rewards: [
      { id:'e1', label:'Cofre fuego', weight:22, rarity:'uncommon', img:'🔥', desc:'Ítems con tema fuego' },
      { id:'e2', label:'Cofre hielo', weight:22, rarity:'uncommon', img:'❄️', desc:'Ítems con tema hielo' },
      { id:'e3', label:'Recurso raro', weight:18, rarity:'rare', img:'🔮', desc:'Recurso especial' },
      { id:'e4', label:'Esmeraldas x15', weight:10, rarity:'epic', img:'💎', desc:'Paquete valioso' },
      { id:'e5', label:'Ticket Evento', weight:3, rarity:'epic', img:'🎟️', desc:'Ticket para Evento' }
    ]
  },*/
  {
    id: 'event',
    title: 'Evento',
    desc: 'Premios exclusivos del evento (fecha limitada).',
    bg: null,
    music: 'music/1234.mp3',
    start: '2025-12-01',
    end: '2026-01-10',
    rewards: [
      { id:'ev1', label:'Cupon del *%', weight:10, rarity:'rare', img:'🎭', desc:'Quien sabe, cuanto valdra?' },
      { id:'ev2', label:'Esmeraldas x25', weight:6, rarity:'epic', img:'💎', desc:'Paquete generoso' },
      { id:'ev3', label:'████', weight:1, rarity:'legend', img:'🏅', desc:'Lo sabremos, eso creo...' },
      { id:'ev3', label:'Cupon del 100%', weight:1, rarity:'legend', img:'🏅', desc:'Ojito un cupon...' },
      { id:'ev4', label:'Una llave x1', weight:18, rarity:'uncommon', img:'📦', desc:'Cofrecito...' },
      { id:'ev5', label:'Esmeraldas x0', weight:30, rarity:'common', img:'💚', desc:'A nadie se le callo ninguna esmeralda...' },
      { id:'ev6', label:'Esmeraldas x5', weight:30, rarity:'common', img:'💚', desc:'Enserio 5...' },
      { id:'ev7', label:'Esmeraldas x5', weight:30, rarity:'common', img:'💚', desc:'Enserio 5...' },
      { id:'ev8', label:'Esmeraldas x10', weight:30, rarity:'common', img:'💚', desc:'Paquete moderado' },
      { id:'ev9', label:'Esmeraldas x10', weight:30, rarity:'common', img:'💚', desc:'Paquete moderado' },
      { id:'ev10', label:'Esmeraldas x10', weight:30, rarity:'common', img:'💚', desc:'Paquete moderado' },
      { id:'ev11', label:'Esmeraldas x10', weight:30, rarity:'common', img:'💚', desc:'Paquete moderado' },
      { id:'ev12', label:'Esmeraldas x15', weight:30, rarity:'common', img:'💚', desc:'Almenos 5 mas...' },
      { id:'ev13', label:'Esmeraldas x15', weight:30, rarity:'common', img:'💚', desc:'Almenos 5 mas...' },
      { id:'ev14', label:'Esmeraldas x5', weight:30, rarity:'common', img:'💚', desc:'Enserio 5...' },
      { id:'ev15', label:'Esmeraldas x5', weight:30, rarity:'common', img:'💚', desc:'Enserio 5...' },
    ]
  }
];

/* -------------------------- Misiones (reseteables) --------------------------
 Each mission: id, title, desc, reward: { wheelId, count }, freq: 'daily'|'weekly'|'monthly'
*/
const MISSIONS = [
  // CLASSIC
  { id:'ms1', wheelId:'classic', title:'Inicia Sesion', desc:'Hola al nuevo dia.', freq:'daily', reward:{wheelId:'classic', count:5} },
  { id:'ms2', wheelId:'classic', title:'Junta 200 monedas', desc:'Recolecta monedas en el reino.', freq:'daily', reward:{wheelId:'classic', count:1} },
  { id:'ms3', wheelId:'classic', title:'Rompe 20 bloques', desc:'Actividades de exploración.', freq:'daily', reward:{wheelId:'classic', count:2} },
  { id:'ms4', wheelId:'classic', title:'Gana 1 mini-juego', desc:'Cualquier mini-juego cuenta.', freq:'weekly', reward:{wheelId:'classic', count:3} },

  // MYSTIC
  { id:'ms5', wheelId:'mystic', title:'Completa 5 raids', desc:'Activa y completa raids.', freq:'weekly', reward:{wheelId:'mystic', count:1} },
  { id:'ms6', wheelId:'mystic', title:'Abre 3 cofres', desc:'Ay mis cofres.', freq:'weekly', reward:{wheelId:'mystic', count:2} },
  { id:'ms7', wheelId:'mystic', title:'Sobrevive 10 minutos sin daño', desc:'Demuestra habilidad.', freq:'daily', reward:{wheelId:'mystic', count:5} },
  { id:'ms17', wheelId:'mystic', title:'Inicia Sesion', desc:'Conectate hoy.', freq:'daily', reward:{wheelId:'mystic', count:3} },
  { id:'ms18', wheelId:'mystic', title:'Compra algo en la pagina (no cuenta cosas gratis)', desc:'Que me apetece hoy.', freq:'daily', reward:{wheelId:'mystic', count:5} },
  { id:'ms19', wheelId:'mystic', title:'Juega un mundo', desc:'Conectate!', freq:'daily', reward:{wheelId:'mystic', count:5} },
  { id:'ms20', wheelId:'mystic', title:'Intercambia una vez', desc:'Demuestra tu habilidad para comerciar.', freq:'daily', reward:{wheelId:'mystic', count:1} },
  { id:'ms21', wheelId:'mystic', title:'Comercia 10 veces', desc:'Demuestra habilidad para hacer tratos.', freq:'daily', reward:{wheelId:'mystic', count:5} },
  
  // ELEMENTAL
  { id:'ms8', wheelId:'elemental', title:'Usa 3 poderes elementales', desc:'Cualquier elemento sirve.', freq:'daily', reward:{wheelId:'elemental', count:1} },
  { id:'ms9', wheelId:'elemental', title:'Derrota 15 mobs', desc:'Usa armas o magia.', freq:'daily', reward:{wheelId:'elemental', count:1} },
  { id:'ms10', wheelId:'elemental', title:'Vende 500 monedas', desc:'Comercia con aldeanos.', freq:'weekly', reward:{wheelId:'elemental', count:2} },
  { id:'ms11', wheelId:'elemental', title:'Explora 2 biomas nuevos', desc:'Exploración elemental.', freq:'monthly', reward:{wheelId:'elemental', count:3} },

  // EVENT
  { id:'ms12', wheelId:'event', title:'Compra un articulo en la tienda (no cuenta nada gratis)', desc:'¿Que dia sera hoy?', freq:'daily', reward:{wheelId:'event', count:3} },
  { id:'ms13', wheelId:'event', title:'Comercia 5 veces', desc:'Dia de comerciar.', freq:'weekly', reward:{wheelId:'event', count:6} },
  { id:'ms14', wheelId:'event', title:'Derrota 20 mobs', desc:'Solo un poco...', freq:'daily', reward:{wheelId:'event', count:5} },
  { id:'ms15', wheelId:'event', title:'Derrota 40 mobs', desc:'Un poco mas...', freq:'weekly', reward:{wheelId:'event', count:10} },
  { id:'ms16', wheelId:'event', title:'Domestica 5 lobos', desc:'Guau!', freq:'weekly', reward:{wheelId:'event', count:10} },
];


// -----------------------------
// SISTEMA DE PITY DURO (GACHA)
// -----------------------------
function getPity(rouletteId) {
  return parseInt(localStorage.getItem("pity_"+rouletteId) || "0", 10);
}

function setPity(rouletteId, value) {
  localStorage.setItem("pity_"+rouletteId, value);
}

function pickWithPity(rouletteId, rewards) {

  // --- cargar pity ---
  let pity = getPity(rouletteId);

  // --- encontrar épicos y legendarios ---
  const epicRewards = rewards
    .map((r,i)=> ({...r, index:i}))
    .filter(r => r.rarity === "epic");

  const legendRewards = rewards
    .map((r,i)=> ({...r, index:i}))
    .filter(r => r.rarity === "legend");

  // ---------- PITY DURO ----------
  // 40 = legendario garantizado
  if (pity >= 40 && legendRewards.length > 0) {
    const forced = legendRewards[Math.floor(Math.random() * legendRewards.length)];
    setPity(rouletteId, 0); 
    return forced.index;
  }

  // 20 = épico garantizado
  if (pity >= 20 && epicRewards.length > 0) {
    const forced = epicRewards[Math.floor(Math.random() * epicRewards.length)];
    setPity(rouletteId, 0);
    return forced.index;
  }

  // ---------- TIRADA NORMAL ----------
  const idx = pickWeightedIndex(rewards);
  const reward = rewards[idx];

  // ---------- ACTUALIZAR PITY ----------
  if (reward.rarity === "epic" || reward.rarity === "legend") {
    setPity(rouletteId, 0); // éxito → reset
  } else {
    setPity(rouletteId, pity + 1); // fallo → acumula pity
  }

  return idx;
}


/* -------------------------- State helpers -------------------------- */
function ticketsKey(id){ return LS.tickets(id); }
function getTickets(id){ return parseInt(localStorage.getItem(ticketsKey(id)) || '0', 10); }
function setTickets(id, n){ localStorage.setItem(ticketsKey(id), String(Math.max(0, Math.floor(n)))); renderTicketCounts(); renderHUDTickets(); }
//function addTickets(id, n=1){ setTickets(id, getTickets(id) + n); }   -- Tickets!!!

function addTickets(id, n=1){
  const realGain = n * TICKET_MULTIPLIER;
  setTickets(id, getTickets(id) + realGain);
}


/* History helpers */
function pushHistory(entry){
  const arr = getLS(LS.history, []);
  arr.unshift(entry);
  setLS(LS.history, arr.slice(0,200));
  renderHistory();
}

/* Missions state */
function getMissionsState(){ return getLS(LS.missions, {}); }
function setMissionsState(state){ setLS(LS.missions, state); }

/* -------------------------- Utility: dates & reset -------------------------- */
function todayKey(){ const d=new Date(); return d.toISOString().slice(0,10); }
function parseDate(s){ if(!s) return null; const t = new Date(s + 'T00:00:00'); return isNaN(t) ? null : t; }
function inRangeToday(startIso, endIso){
  const now = new Date(); if(!startIso && !endIso) return true;
  const start = parseDate(startIso); const end = parseDate(endIso);
  if(start && now < start) return false;
  if(end && now > new Date(end.getTime() + (24*60*60*1000 - 1))) return false; // inclusive end day
  return true;
}
function formatShortDate(iso){
  if(!iso) return '';
  const d = parseDate(iso); if(!d) return iso; return d.toLocaleDateString();
}

/* -------------------------- UI rendering -------------------------- */
function populateWheelSelect(){
  const sel = $('#wheelSelect'); sel.innerHTML = '';
  ROULETTES.forEach(r => {
    const opt = el('option',{ value: r.id, innerText: r.title });
    sel.appendChild(opt);
  });
}

// --- EVENTO: cuando cambia la ruleta, refrescar misiones ---
$('#wheelSelect').addEventListener('change', (e)=>{
  const wheelId = e.target.value;
  renderMissions(wheelId);
});



function renderTicketCounts(){
  const box = $('#ticketCounts'); box.innerHTML = '';
  ROULETTES.forEach(r => {
    const row = el('div',{ className:'ticket-item' });
    row.innerHTML = `<div><strong>${r.title}</strong><div class="u-muted" style="font-size:12px">${r.desc}</div></div>
                     <div><span data-ticket="${r.id}">${getTickets(r.id)}</span> 🎟️</div>`;
    box.appendChild(row);
  });
}
function renderHUDTickets(){
  const hud = $('#hudTickets'); hud.innerHTML = '';
  ROULETTES.forEach(r => {
    const elb = el('div',{ className:'hud-ticket', innerHTML:`<strong style="margin-right:8px">${r.title}</strong><span data-hud="${r.id}">${getTickets(r.id)}</span>` });
    elb.style.marginRight='10px';
    hud.appendChild(elb);
  });
}

/* render missions; check reset timers */
function renderMissions(wheelId){
  const box = $('#missionsList');
  box.innerHTML = '';

  const msState = getMissionsState();

  // filtrar misiones que pertenecen a esta ruleta
  const missions = MISSIONS.filter(m => m.wheelId === wheelId);

  missions.forEach(m => {
    const state = msState[m.id] || { completedAt:null, lastReset:null };
    const completed = !!state.completedAt;

    const div = el('div', { className:'mission compact' });

    div.innerHTML = `
      <div class="m-icon">${missionIcon(m.freq)}</div>

      <div class="m-body">
        <div class="m-title">${m.title}</div>
        <div class="m-sub">${m.desc}</div>

        <div class="m-meta">
          <span class="tag ${m.freq}">${freqLabel(m.freq)}</span>
          <span class="tag reward">🎟️ +${m.reward.count}</span>
        </div>
      </div>

      <div class="m-actions">
        <button class="m-btn" ${completed ? 'disabled' : ''}>
          ${completed ? '✔' : '▶'}
        </button>
      </div>
    `;

    div.querySelector('.m-btn').addEventListener('click', ()=>{
      if(!completed) completeMission(m.id);
    });

    box.appendChild(div);
  });
}

function freqLabel(f){
  return {
    daily:'Diaria',
    weekly:'Semanal',
    monthly:'Mensual'
  }[f] || f;
}

function missionIcon(f){
  return {
    daily:'🌞',
    weekly:'📅',
    monthly:'🌙'
  }[f] || '⭐';
}




function shouldResetMission(mission, state) {
  const now = Date.now();
  const last = state.lastReset || 0;

  const freqMs = {
    daily: 24 * 60 * 60 * 1000,
    weekly: 7 * 24 * 60 * 60 * 1000,
    monthly: 30 * 24 * 60 * 60 * 1000
  }[mission.freq];

  return (now - last) >= freqMs;
}


/* render history */
function renderHistory(){
  const box = $('#prizeHistory');
  const arr = getLS(LS.history, []);
  box.innerHTML = '';
  if(!arr.length){ box.textContent = 'No hay premios aún.'; return; }
  arr.slice(0,50).forEach(it => {
    const node = el('div',{ className:'history-item' });
    const img = el('div',{ className:'img', innerText: it.img || '🎁' });
    const meta = el('div',{ innerHTML:`<strong>${it.label}</strong><div class="u-muted" style="font-size:12px">${it.wheel} • ${new Date(it.time).toLocaleString()}</div>` });
    node.appendChild(img); node.appendChild(meta);
    box.appendChild(node);
  });
}

/* render wheel sectors */
/* -------------------------- render wheel (mejorado visualmente) -------------------------- */
function renderWheel(wheelId) {
  const container = $('#wheel');
  container.innerHTML = '';
  const wheel = ROULETTES.find(w => w.id === wheelId);
  if (!wheel) return;

  const rewards = wheel.rewards;
  const n = rewards.length;
  const size = 480;
  const radius = size / 2;
  const center = radius;
  const anglePer = 360 / n;

  // wrapper principal
  const wrapper = el('div', { className: 'wheel-wrapper' });
  Object.assign(wrapper.style, {
    width: `${size}px`,
    height: `${size}px`,
    position: 'relative',
    margin: '0 auto',
    transformOrigin: 'center center',
    transition: 'transform 5s cubic-bezier(.12,.85,.29,1.1)',
    borderRadius: '50%',
    boxShadow: 'inset 0 0 35px rgba(0,0,0,.6), 0 0 45px rgba(48,209,88,0.3)'
  });

  // SVG principal
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  Object.assign(svg.style, {
    borderRadius: '50%',
    overflow: 'visible',
    position: 'absolute',
    left: '0',
    top: '0',
    transformOrigin: 'center center'
  });

  // ----- Gradientes y defs -----
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `
    <radialGradient id="gradWheel" cx="50%" cy="50%" r="75%">
      <stop offset="0%" stop-color="#0b120c"/>
      <stop offset="100%" stop-color="#101a12"/>
    </radialGradient>

    <linearGradient id="gradEdge" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00ff95" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#00b56d" stop-opacity="0.1"/>
    </linearGradient>

    <radialGradient id="gradShine" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.18)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>

    <radialGradient id="gradHalo" cx="50%" cy="50%" r="85%">
      <stop offset="70%" stop-color="rgba(48,209,88,0)"/>
      <stop offset="100%" stop-color="rgba(48,209,88,0.15)"/>
    </radialGradient>
  `;
  svg.appendChild(defs);

  // Fondo base con halo
  const halo = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  halo.setAttribute('cx', center);
  halo.setAttribute('cy', center);
  halo.setAttribute('r', radius);
  halo.setAttribute('fill', 'url(#gradHalo)');
  halo.style.animation = 'haloPulse 6s ease-in-out infinite alternate';
  svg.appendChild(halo);

  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  bg.setAttribute('cx', center);
  bg.setAttribute('cy', center);
  bg.setAttribute('r', radius);
  bg.setAttribute('fill', 'url(#gradWheel)');
  svg.appendChild(bg);

  // ----- Sectores -----
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
    if (r.rarity === 'common') fill = 'rgba(255,255,255,0.05)';
    else if (r.rarity === 'uncommon') fill = 'rgba(80,255,140,0.09)';
    else if (r.rarity === 'rare') fill = 'rgba(0,150,255,0.09)';
    else if (r.rarity === 'epic') fill = 'rgba(190,0,255,0.10)';
    else if (r.rarity === 'legend') fill = 'rgba(255,215,0,0.13)';

    path.setAttribute('d', d);
    path.setAttribute('fill', fill);
    path.setAttribute('stroke', 'rgba(255,255,255,0.07)');
    path.setAttribute('stroke-width', '1');
    svg.appendChild(path);

    // icono
    const midAngle = (start + end) / 2;
    const tx = center + (radius * 0.64) * Math.cos(midAngle);
    const ty = center + (radius * 0.64) * Math.sin(midAngle);
    const emoji = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    emoji.setAttribute('x', tx);
    emoji.setAttribute('y', ty);
    emoji.setAttribute('text-anchor', 'middle');
    emoji.setAttribute('alignment-baseline', 'middle');
    emoji.setAttribute('font-size', '22');
    emoji.setAttribute('opacity', '0.92');
    emoji.textContent = r.img || '🎁';
    svg.appendChild(emoji);

    // etiqueta
    const tx2 = center + (radius * 0.5) * Math.cos(midAngle);
    const ty2 = center + (radius * 0.5) * Math.sin(midAngle);
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', tx2);
    label.setAttribute('y', ty2);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('alignment-baseline', 'middle');
    label.setAttribute('font-size', '11');
    label.setAttribute('fill', '#e0e0e0');
    label.textContent = r.label;
    svg.appendChild(label);
  });

  // borde luminoso + halo interior
  const edge = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  edge.setAttribute('cx', center);
  edge.setAttribute('cy', center);
  edge.setAttribute('r', radius - 2);
  edge.setAttribute('stroke', 'url(#gradEdge)');
  edge.setAttribute('stroke-width', '5');
  edge.setAttribute('fill', 'none');
  svg.appendChild(edge);

  const shine = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  shine.setAttribute('cx', center);
  shine.setAttribute('cy', center);
  shine.setAttribute('r', radius * 0.63);
  shine.setAttribute('fill', 'url(#gradShine)');
  shine.style.animation = 'spinShine 8s linear infinite';
  svg.appendChild(shine);

  wrapper.appendChild(svg);

  // puntero dorado superior
  /*const pointer = el('div', { className: 'wheel-pointer' });
  Object.assign(pointer.style, {
    position: 'absolute',
    top: '-15px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '0',
    height: '0',
    borderLeft: '10px solid transparent',
    borderRight: '10px solid transparent',
    borderBottom: '18px solid gold',
    filter: 'drop-shadow(0 0 6px rgba(255,215,0,0.6))'
  });
  container.appendChild(pointer);*/

  // puntero dorado inferior (flecha hacia abajo)
const pointer = el('div', { className: 'wheel-pointer' });
Object.assign(pointer.style, {
  position: 'absolute',
  bottom: '-15px',        // antes top
  left: '50%',
  transform: 'translateX(-50%)',
  width: '0',
  height: '0',
  borderLeft: '10px solid transparent',
  borderRight: '10px solid transparent',
  borderTop: '18px solid gold',  // antes borderBottom
  filter: 'drop-shadow(0 0 6px rgba(255,215,0,0.6))'
});
container.appendChild(pointer);


  container.appendChild(wrapper);
  container.dataset.wheelId = wheelId;
  $('#wheelDesc').textContent = wheel.desc || '';

  /// 🔹 Si la ruleta tiene fechas definidas, muestra el estado correspondiente
if (typeof checkWheelLock === 'function') {
  checkWheelLock(wheel);
}
}



/* -------------------------- Background & music -------------------------- */
let audioCtx = null;
let currentAudio = null;
let currentVolume = 0.6;
function ensureAudio(){
  if(!audioCtx && (window.AudioContext || window.webkitAudioContext)){
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}
function fadeAudio(inOut='out', duration=600){
  if(!currentAudio) return Promise.resolve();
  return new Promise(res => {
    const step = 40; const steps = duration/step;
    let i = 0;
    const start = inOut==='out' ? currentVolume : 0;
    const end = inOut==='out' ? 0 : currentVolume;
    const delta = (end - start) / steps;
    const t = setInterval(()=> {
      i++; const vol = Math.min(1, Math.max(0, start + delta*i));
      currentAudio.volume = vol;
      if(i>=steps){ clearInterval(t); if(inOut==='out'){ currentAudio.pause(); currentAudio.currentTime = 0; currentAudio = null; } res(); }
    }, step);
  });
}
async function playMusic(url){
  if(!url){ if(currentAudio){ await fadeAudio('out',300); } return; }
  // fade out existing
  if(currentAudio){ await fadeAudio('out',300); }
  // create new audio
  const a = new Audio(url);
  a.loop = true; a.volume = 0;
  a.play().catch(()=>{ /* user gesture required in some browsers */ });
  currentAudio = a;
  // fade in
  const step = 40; const duration = 800; const steps = duration/step; let i=0;
  const t = setInterval(()=>{ i++; a.volume = Math.min(currentVolume, (i/steps)*currentVolume); if(i>=steps){ clearInterval(t); } }, step);
}

/* background transition */
function updateWheelBackground(wheel){
  const layer = $('#wheelBackdrop');
  // simple: set background color or image
  if(wheel.bg){
    layer.style.backgroundImage = `url("${wheel.bg}")`;
    layer.style.backgroundSize = 'cover';
    layer.style.backgroundPosition = 'center';
  } else {
    layer.style.backgroundImage = '';
    // color by wheel id (fallback)
    const colors = { classic:'linear-gradient(180deg,#062b18,#04120a)', mystic:'linear-gradient(180deg,#2f0f3f,#07040a)', elemental:'linear-gradient(180deg,#06283f,#031018)', event:'linear-gradient(180deg,#2b2005,#0a0602)' };
    layer.style.background = colors[wheel.id] || 'linear-gradient(180deg,rgba(48,209,88,0.02),transparent)';
  }
  // music
  if(wheel.music){ playMusic(wheel.music); } else { playMusic(null); }
}

/* -------------------------- Wheel lock (temporal) -------------------------- */
/* -----------------------------------------------------------
   checkWheelLock — Verifica estado de ruleta (activa / próxima / finalizada)
   Estética profesional con animaciones y texto dinámico
----------------------------------------------------------- */
function checkWheelLock(wheel) {
  const lockEl   = $('#wheelLock');
  const txt      = $('#lockText');
  const rangeEl  = $('#lockRange');
  const particles = $('#lockParticles');

  if (!lockEl || !txt || !rangeEl) return;

  const now   = new Date();
  const start = new Date(wheel.start);
  const end   = new Date(wheel.end);
  const active = now >= start && now <= end;

  // Limpia estados visuales previos
  lockEl.classList.remove('soon', 'ended', 'active');

  if (!active) {
    lockEl.hidden = false;

    if (now < start) {
      // 🟢 Ruleta aún no disponible
      txt.textContent = '✨ Próximamente';
      rangeEl.textContent = `Disponible desde ${start.toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })}`;
      lockEl.classList.add('soon');
      startLockParticles('soon', particles);
    } 
    else if (now > end) {
      // 🔴 Ruleta finalizada
      txt.textContent = '⏳ Evento finalizado';
      rangeEl.textContent = `Finalizó el ${end.toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })}`;
      lockEl.classList.add('ended');
      startLockParticles('ended', particles);
    }
  } else {
    // 🟣 Activa
    lockEl.hidden = true;
    lockEl.classList.add('active');
    stopLockParticles(particles);
  }
}


/* -------------------------- Lock particles (simple) -------------------------- */
let lockParticlesRAF = null;
function startLockParticles(){
  const canvas = $('#lockParticles'); if(!canvas) return;
  canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight;
  const ctx = canvas.getContext('2d');
  const particles = Array.from({length:40}, ()=> ({
    x: Math.random()*canvas.width, y: Math.random()*canvas.height,
    vx: (Math.random()-0.5)*0.6, vy: -0.1 - Math.random()*0.4, life: 50 + Math.random()*120, age: Math.random()*100, size: 1+Math.random()*3, color: `rgba(255,255,255,${0.02 + Math.random()*0.12})`
  }));
  function frame(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    particles.forEach(p=>{
      p.x += p.vx; p.y += p.vy; p.age++;
      if(p.y < -10 || p.age > p.life){ p.x = Math.random()*canvas.width; p.y = canvas.height + Math.random()*40; p.age = 0; }
      ctx.beginPath(); ctx.fillStyle = p.color; ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill();
    });
    lockParticlesRAF = requestAnimationFrame(frame);
  }
  if(!lockParticlesRAF) frame();
}
function stopLockParticles(){ if(lockParticlesRAF){ cancelAnimationFrame(lockParticlesRAF); lockParticlesRAF = null; const c = $('#lockParticles'); if(c) c.getContext('2d').clearRect(0,0,c.width,c.height); } }

/* -------------------------- Spin logic -------------------------- */
let spinning = false;
async function spinCurrentWheel(){
  if(spinning) return;
  const wheelId = $('#wheelSelect').value;
  const wheel = ROULETTES.find(w=>w.id===wheelId);
  if(!wheel) return;
  if(!inRangeToday(wheel.start, wheel.end)){ toast('Esta ruleta está cerrada temporalmente.'); return; }
  const tickets = getTickets(wheelId);
  if(tickets <= 0){ toast('No tienes tickets para esta ruleta. Completa misiones.'); return; }

  // consume ticket
  setTickets(wheelId, tickets - 1);

  // pick weighted
  //const idx = pickWeightedIndex(wheel.rewards);
  const idx = pickWithPity(wheel.id, wheel.rewards);


  // compute rotation
  const parts = wheel.rewards.length;
  const anglePer = 360 / parts;
  //const targetCenter = idx*anglePer + anglePer/2;

  // ================ FIX REAL ================
  // REFERENCIA REAL DEL WHEEL
  const wheelEl = $('#wheel .wheel-wrapper');

  // 1) RESET COMPLETO del giro anterior (OBLIGATORIO)
  wheelEl.style.transition = 'none';
  wheelEl.style.transform = 'rotate(0deg)';
  void wheelEl.offsetWidth;   // <-- sin esto NO funciona nunca el segundo giro
  // ==========================================

  spinning = true;

  // 2) GIRO REAL (siempre 6 vueltas)
  const spins = 6; 
  //const finalRotation = spins * 360 + (270 - targetCenter);


  const targetCenter = idx * anglePer + anglePer / 2;

// Ajuste fino para que el ángulo final coincida EXACTO con targetCenter
const finalRotation = spins * 360 + (270 - targetCenter);


  // 3) APLICAR EL GIRO REAL
  wheelEl.style.transition = `transform 4.2s cubic-bezier(.14,.9,.26,1)`;
  wheelEl.style.transformOrigin = 'center center';
  wheelEl.style.transform = `rotate(${finalRotation}deg)`;

  // -------------- SONIDO --------------
  const tickInterval = setInterval(()=> { beep(120,0.02); }, 110);
  await wait(4400);
  clearInterval(tickInterval);

  // 4) PEQUEÑA ESTABILIZACIÓN
  wheelEl.style.transition = `transform 4s cubic-bezier(.14,.9,.26,1)`;
  wheelEl.style.transform = `rotate(${finalRotation + rand(-6,6)}deg)`;
  await wait(650);

  // -------------- CÁLCULO DEL PREMIO --------------
  const normalized = ((finalRotation % 360) + 360) % 360;
  const landedAngle = (360 - (normalized - 90) + 360) % 360;
  let landedIndex = Math.floor(((landedAngle + anglePer/2) % 360) / anglePer) % parts;
  if(landedIndex < 0) landedIndex = 0;

  //const prize = wheel.rewards[landedIndex] || wheel.rewards[idx];

  // el pity manda SIEMPRE
const prize = wheel.rewards[idx];
landedIndex = idx;


  // guardar historial
  pushHistory({ wheel: wheelId, label: prize.label, img: prize.img, rarity: prize.rarity, time: new Date().toISOString() });

  // mostrar modal
  showPrizeModal(prize, wheelId);

  // actualizar ultimo premio
  $('#lastPrize').textContent = `${prize.label} • ${prize.rarity}`;

  spinning = false;
}


/* weighted pick */
function pickWeightedIndex(items) {
  // Suma total de pesos
  const totalWeight = items.reduce((acc, it) => acc + (it.weight || 0), 0);

  // Número aleatorio entre 0 y totalWeight
  let r = Math.random() * totalWeight;

  // Se recorre restando los pesos de cada premio
  for (let i = 0; i < items.length; i++) {
    r -= items[i].weight;
    if (r <= 0) return i;
  }

  // fallback (debería ser imposible)
  return items.length - 1;
}

function rand(min, max){ return Math.random()*(max-min)+min; }
function wait(ms){ return new Promise(res=>setTimeout(res, ms)); }

/* simple beep using WebAudio (small) */
let _audioCtx = null;
function getAudioCtx(){ if(!_audioCtx && (window.AudioContext || window.webkitAudioContext)) _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); return _audioCtx; }
function beep(freq=440, dur=0.03, vol=0.03){
  const ctx = getAudioCtx(); if(!ctx) return;
  const o = ctx.createOscillator(); const g = ctx.createGain();
  o.type = 'sine'; o.frequency.value = freq; g.gain.value = vol;
  o.connect(g); g.connect(ctx.destination); o.start();
  setTimeout(()=> o.stop(), dur*1000);
}

/* prize modal */
function showPrizeModal(prize, wheelId){
  const modal = $('#modal'); const content = $('#modalContent'); content.innerHTML = '';
  const html = `
    <div style="display:flex;gap:16px;align-items:center">
      <div style="font-size:64px">${prize.img || '🎁'}</div>
      <div>
        <h2 style="margin:0">${prize.label}</h2>
        <div class="u-muted" style="margin-top:6px">${prize.desc || ''}</div>
        <div style="margin-top:8px"><small class="u-muted">Ruleta: ${wheelId} — Rareza: ${prize.rarity || 'n/a'}</small></div>
      </div>
    </div>
    <div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end">
      <button id="btnAcknow" class="btn btn--ghost">Aceptar</button>
    </div>
  `;
  content.innerHTML = html;
  $('#modalClose').addEventListener('click', ()=> modal.setAttribute('aria-hidden','true'));
  $('#btnAcknow').addEventListener('click', ()=> modal.setAttribute('aria-hidden','true'));
  modal.setAttribute('aria-hidden','false');
  // small fanfare
  beep(880,0.05,0.06); beep(660,0.08,0.07);
}




function showFivePrizesModal(prizes, wheelId) {
  const modal = $('#modal');
  const content = $('#modalContent');

  let html = `
    <h2>Tirada x5 — ${wheelId}</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-top:12px">
  `;

  for (const p of prizes) {
    html += `
      <div style="padding:10px;border-radius:10px;background:#0e1a17;border:1px solid rgba(255,255,255,0.06)">
        <div style="font-size:40px">${p.img || "🎁"}</div>
        <strong>${p.label}</strong>
        <div class="u-muted">${p.rarity}</div>
      </div>
    `;
  }

  html += `</div>
    <div style="margin-top:18px;text-align:right">
      <button id="btnAcknow5" class="btn btn--ghost">Aceptar</button>
    </div>
  `;

  content.innerHTML = html;

  $('#btnAcknow5').addEventListener('click', () => {
    modal.setAttribute('aria-hidden','true');
  });

  modal.setAttribute('aria-hidden','false');

  beep(880,0.05,0.06); beep(660,0.08,0.07);
}

/* preview modal */
function openPreview(wheelId){
  const wheel = ROULETTES.find(w=>w.id===wheelId); if(!wheel) return;
  const modal = $('#modal'); const content = $('#modalContent');
  content.innerHTML = `<h3>Premios — ${wheel.title}</h3><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px;margin-top:8px">` +
    wheel.rewards.map(r=>`<div style="padding:8px;border-radius:8px;background:linear-gradient(180deg,#07120f,#06100d);border:1px solid rgba(255,255,255,.02)"><div style="font-size:28px">${r.img||'🎁'}</div><strong>${r.label}</strong><div class="u-muted" style="font-size:12px">${r.rarity}</div><div class="u-muted" style="font-size:12px">${r.desc||''}</div></div>`).join('') +
    `</div>`;
  $('#modalClose').addEventListener('click', ()=> modal.setAttribute('aria-hidden','true'));
  modal.setAttribute('aria-hidden','false');
}

/* complete mission (simulate progress) */
function completeMission(id){
  const msState = getMissionsState();
  const m = MISSIONS.find(x => x.id === id);
  if(!m) return;

  const state = msState[id] || { completedAt:null, lastReset:Date.now() };

  if(state.completedAt){
    toast("Esta misión ya está completada.");
    return;
  }

  // Marcar completada
  state.completedAt = Date.now();
  msState[id] = state;
  setMissionsState(msState);

  // Dar tickets
  addTickets(m.reward.wheelId, m.reward.count);

  toast(`Misión completada. +${m.reward.count} ticket(s) de ${m.reward.wheelId}`);

  // Refrescar UI manteniendo la ruleta seleccionada
  const wheelId = $('#wheelSelect').value;
  renderMissions(wheelId);
}


/* reset missions by frequency (to be called at boot) */
function resetMissionsIfNeeded(){
  const state = getMissionsState();
  const now = new Date();
  let changed = false;
  MISSIONS.forEach(m => {
    const s = state[m.id] || {};
    const lastReset = s.lastReset ? new Date(s.lastReset) : null;
    // compute delim based on freq
    let shouldReset = false;
    if(!lastReset) shouldReset = true;
    else {
      if(m.freq === 'daily'){
        // if lastReset was on previous day
        shouldReset = !(lastReset.toDateString() === now.toDateString());
      } else if(m.freq === 'weekly'){
        // reset if 7+ days passed or week number changed
        const diff = Math.floor((now - lastReset)/(1000*60*60*24));
        if(diff >= 7) shouldReset = true;
      } else if(m.freq === 'monthly'){
        const diff = Math.floor((now - lastReset)/(1000*60*60*24));
        if(diff >= 30) shouldReset = true;
      }
    }
    if(shouldReset){
      state[m.id] = { completedAt: null, lastReset: now.toISOString() };
      changed = true;
    }
  });
  if(changed) setMissionsState(state);
}

/* -------------------------- Wiring: UI events -------------------------- */
function wireEvents(){
  $('#wheelSelect').addEventListener('change', (e)=> {
    const id = e.target.value;
    renderWheel(id);

    // 🔥 MUY IMPORTANTE
    const w = ROULETTES.find(r => r.id === id);
    updateExpireBox(w);

    const wheel = ROULETTES.find(w=>w.id===id);
    updateExpireBox(wheel); // ← AQUI es nuevo jeje
    // music change (if wheel has music use it)
    if(wheel && wheel.music){ playMusic(wheel.music); } else { playMusic(null); }
  });
  $('#btnPreview').addEventListener('click', ()=> openPreview($('#wheelSelect').value));
  $('#btnSpin').addEventListener('click', ()=> spinCurrentWheel());
  $('#modalClose').addEventListener('click', ()=> $('#modal').setAttribute('aria-hidden','true'));
  $('#btnSpin5').addEventListener('click', () => spinFiveTimes());

  $('#btnOpenRules').addEventListener('click', ()=> {
    const modal = $('#modal'); const c = $('#modalContent');
    c.innerHTML = `<h3>Reglas</h3><ul><li>Cada ruleta usa sus propios tickets.</li><li>Completa misiones para recibir tickets.</li><li>Las ruletas temporales se muestran pero están bloqueadas hasta sus fechas.</li></ul>`;
    modal.setAttribute('aria-hidden','false');
  });
}



async function spinFiveTimes() {
  if (spinning) return;

  const wheelId = $('#wheelSelect').value;
  const wheel = ROULETTES.find(w=>w.id===wheelId);
  if (!wheel) return;

  if (!inRangeToday(wheel.start, wheel.end)) {
    toast("Esta ruleta está cerrada temporalmente.");
    return;
  }

  let tickets = getTickets(wheelId);
  if (tickets < 5) {
    toast("Necesitas 5 tickets para tirar x5.");
    return;
  }

  // Consumir tickets
  setTickets(wheelId, tickets - 5);

  // Calcular 5 premios reales (NO animación)
  const results = [];
  for (let i = 0; i < 5; i++) {
    const idx = pickWithPity(wheel.id, wheel.rewards);
    const prize = wheel.rewards[idx];

    results.push(prize);

    pushHistory({
      wheel: wheelId,
      label: prize.label,
      img: prize.img,
      rarity: prize.rarity,
      time: new Date().toISOString()
    });
  }

  // ----------- ANIMACIÓN: hacer girar la ruleta UNA VEZ -----------

  const wheelEl = $('#wheel .wheel-wrapper');

  // resetear giro anterior
  wheelEl.style.transition = 'none';
  wheelEl.style.transform = 'rotate(0deg)';
  void wheelEl.offsetWidth;

  spinning = true;

  // animar hacia un premio aleatorio solo para el efecto visual
  const randomFakeIndex = Math.floor(Math.random() * wheel.rewards.length);
  const parts = wheel.rewards.length;
  const anglePer = 360 / parts;
  const targetCenter = randomFakeIndex * anglePer + anglePer / 2;

  const spins = 6;
  const finalRotation = spins * 360 + (270 - targetCenter);

  // aplicar giro
  wheelEl.style.transition = `transform 4.2s cubic-bezier(.14,.9,.26,1)`;
  wheelEl.style.transform = `rotate(${finalRotation}deg)`;

  // ticks sonido
  const tickInterval = setInterval(()=> { beep(120,0.02); }, 110);
  await wait(4400);
  clearInterval(tickInterval);

  // estabilización
  wheelEl.style.transition = `transform 4s cubic-bezier(.14,.9,.26,1)`;
  wheelEl.style.transform = `rotate(${finalRotation + rand(-6,6)}deg)`;
  await wait(650);

  spinning = false;

  // ----------- MOSTRAR PREMIOS REALES -----------

  showFivePrizesModal(results, wheelId);
  toast("Tirada x5 completada.");
}



/* -------------------------- Init boot -------------------------- */
function boot(){
  // ensure some tickets seeded for testing if none exist
  ROULETTES.forEach(r=> { if(localStorage.getItem(ticketsKey(r.id)) === null) localStorage.setItem(ticketsKey(r.id), '1'); });
  populateWheelSelect();
  renderTicketCounts();
  renderHUDTickets();
  renderMissions();
  renderHistory();
  //updateExpireBox(ROULETTES[0]);
  //updateExpireBox(wheel); // ← AQUI supuestamente este no, pero el de arriba si
  // initial wheel
  $('#wheelSelect').value = ROULETTES[0].id;
  renderWheel(ROULETTES[0].id);

  updateExpireBox(ROULETTES[0]);
  // reset missions based on freq
  resetMissionsIfNeeded();
  // wire events
  wireEvents();
  // responsive: resize lock canvas
  window.addEventListener('resize', ()=> {
    const c = $('#lockParticles'); if(c){ c.width = c.clientWidth; c.height = c.clientHeight; }
  });
}

/* startup */
document.addEventListener('DOMContentLoaded', ()=> {
  try{ boot(); }catch(e){ console.error(e); }
});

/* -------------------------- Expose API for debugging -------------------------- */
window.MoonveilPrizes = {
  ROULETTES,
  MISSIONS,
  addTickets,
  setTickets,
  getTickets,
  pushHistory
};













function getDaysDifference(dateStr) {
  const now = new Date();
  const target = new Date(dateStr);
  const diff = target - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function updateExpireBox(wheel) {
  const box = $('#expireBox');

  if (!wheel.start || !wheel.end) {
    box.style.display = "none";
    return;
  }

  const daysToStart = getDaysDifference(wheel.start);
  const daysToEnd   = getDaysDifference(wheel.end);

  // 🔒 Aún no empieza
  if (daysToStart > 0) {
    box.textContent = `🔒 Disponible en ${daysToStart} día${daysToStart===1?"":"s"}`;
    box.style.display = "block";
    return;
  }

  // ⏳ Ya inició pero no ha terminado
  if (daysToEnd > 0) {
    box.textContent = `⏳ Quedan ${daysToEnd} día${daysToEnd===1?"":"s"}`;
    box.style.display = "block";
    return;
  }

  // Expirada
  box.style.display = "none";
}







const multBtn = document.getElementById('multiplierBtn');

const BOOST_DURATION = 60*60; // 1 hora
const LS_KEY_BOOST = "boostState_v3";

let boostState = loadBoostState();
let interval = null;

function loadBoostState() {
  const s = localStorage.getItem(LS_KEY_BOOST);
  return s ? JSON.parse(s) : {
    activeUntil: 0,
    cooldownUntil: 0
  };
}

function saveBoostState() {
  localStorage.setItem(LS_KEY_BOOST, JSON.stringify(boostState));
}

/* ----------------- Medianoche ----------------- */
function getTonightMidnight() {
  const d = new Date();
  d.setHours(24, 0, 0, 0); // próxima medianoche
  return d.getTime();
}

/* ----------------- UI ----------------- */
function updateBoostUI() {
  const now = Date.now();

  // 1) BOOST ACTIVO
  if (boostState.activeUntil > now) {

    const diff = Math.floor((boostState.activeUntil - now) / 1000);
    multBtn.disabled = true;
    multBtn.classList.add("active");
    multBtn.textContent = "x2 (" + formatTime(diff) + ")";
    TICKET_MULTIPLIER = 2;
    return;
  }

  // 2) COOLDOWN HASTA MEDIANOCHE
  if (boostState.cooldownUntil > now) {

    const diff = Math.floor((boostState.cooldownUntil - now) / 1000);
    multBtn.disabled = true;
    multBtn.classList.remove("active");
    //Disponible en -- se coloca en " aqui!!"
    multBtn.textContent = " " + formatTime(diff);
    TICKET_MULTIPLIER = 1;

    // Si ya pasó medianoche → reset automático
    if (now >= boostState.cooldownUntil) {
      boostState.cooldownUntil = 0;
      saveBoostState();
    }
    return;
  }

  // 3) DISPONIBLE
  multBtn.disabled = false;
  multBtn.classList.remove("active");
  multBtn.textContent = "Usar x2";
  TICKET_MULTIPLIER = 1;
}

/* ----------------- Activación ----------------- */
multBtn.addEventListener("click", () => {
  const now = Date.now();

  if (boostState.activeUntil > now) return;
  if (boostState.cooldownUntil > now) return;

  // ACTIVAR BOOST
  boostState.activeUntil = now + BOOST_DURATION * 1000;

  // COOLDOWN hasta la medianoche siguiente
  boostState.cooldownUntil = getTonightMidnight();

  saveBoostState();
  updateBoostUI();
});

/* ----------------- Intervalo ----------------- */
function startInterval() {
  if (interval) clearInterval(interval);
  interval = setInterval(updateBoostUI, 1000);
}

/* ----------------- Formato ----------------- */
function formatTime(sec) {
  const h = String(Math.floor(sec / 3600)).padStart(2, '0');
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

/* ----------------- Init ----------------- */
updateBoostUI();
startInterval();