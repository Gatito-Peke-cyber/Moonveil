'use strict';
/* ==============================================
   Moonveil — Calendario de Recompensas (JS) v2
   ─────────────────────────────────────────────
   NUEVAS FEATURES:
   • XP como recompensa directa de día
   • Llaves como recompensa directa de día
   • Cofres bloqueados (requieren llave específica)
   • Llaves de futuro (reclamar hasta 6 días adelante)
   ============================================== */

/* ══════════════════════════════════════════════
   ⚙️  CONFIGURACIÓN
   ══════════════════════════════════════════════ */
const XP_PER_CLAIM   = 80;
const XP_TO_KEY      = 500;
const XP_MILESTONES  = 5;
const MAX_FUTURE_DAYS    = 2;   // Días máximos que puede adelantar una Llave Futuro
const MAX_FUTURE_USES    = 3;   // Usos de Llave Futuro por período
const FUTURE_PERIOD_DAYS = 60;  // Días que dura el período antes de resetearse
const MIN_FUTURE_PER_MONTH = 2; // Mínimo informativo de usos por mes

const FESTIVAL_PERIODS = [
  { name:"San Valentín",    emoji:"💗", keyType:"pink",    keysAwarded:2, start:"02-10", end:"02-14" },
  { name:"Día de la Madre", emoji:"💗", keyType:"pink",    keysAwarded:2, start:"05-08", end:"05-12" },
  { name:"Día del Padre",   emoji:"💗", keyType:"pink",    keysAwarded:2, start:"06-17", end:"06-23" },
  { name:"Navidad",         emoji:"🟢", keyType:"green",   keysAwarded:2, start:"12-24", end:"12-26" },
  { name:"Año Nuevo",       emoji:"🟢", keyType:"green",   keysAwarded:2, start:"12-31", end:"01-01" },
  { name:"Halloween",       emoji:"🎃", keyType:"orange",  keysAwarded:2, start:"10-25", end:"10-31" },
  { name:"Black Friday",    emoji:"🎃", keyType:"orange",  keysAwarded:2, start:"11-28", end:"11-30" },
  { name:"Día del Gato",    emoji:"😺", keyType:"cat",     keysAwarded:3, start:"08-08", end:"08-08" },
  { name:"Día del Perro",   emoji:"😺", keyType:"cat",     keysAwarded:3, start:"07-30", end:"07-30" },
  { name:"Día de la Tierra",emoji:"💜", keyType:"special", keysAwarded:2, start:"04-22", end:"04-22" },
  { name:"Día del Agua",    emoji:"💜", keyType:"special", keysAwarded:2, start:"03-22", end:"03-22" },
  { name:"Día del Niño",    emoji:"💜", keyType:"special", keysAwarded:2, start:"06-01", end:"06-01" },
];

const KEY_TYPES = {
  normal:  { name:"Llave Normal",   emoji:"🔵", shape:"🗝️",   cssClass:"key-normal",  desc:"Recupera días pasados",        futureDays: false },
  pink:    { name:"Llave Rosa",     emoji:"💗", shape:"💗🗝️",  cssClass:"key-pink",    desc:"x2 · San Valentín, Madre, Padre", futureDays: false },
  green:   { name:"Llave Verde",    emoji:"🟢", shape:"🗝️",   cssClass:"key-green",   desc:"x2 · Navidad & Año Nuevo",     futureDays: false },
  orange:  { name:"Llave Naranja",  emoji:"🎃", shape:"🗝️",   cssClass:"key-orange",  desc:"x2 · Halloween & Black Fri",   futureDays: false },
  cat:     { name:"Llave Gato",     emoji:"😺", shape:"🐱🗝️", cssClass:"key-cat",     desc:"x3 · Día del Gato/Perro",      futureDays: false },
  special: { name:"Llave Especial", emoji:"💜", shape:"✨🗝️",  cssClass:"key-special", desc:"x2 · Días especiales",         futureDays: false },
  future:  { name:"Llave Futuro",   emoji:"⏩", shape:"⏩🗝️",  cssClass:"key-future",  desc:"Reclama hasta 2 días adelante",futureDays: true  },
};

/* ══════════════════════════════════════════════
   📦  RECOMPENSAS POR MES
   ══════════════════════════════════════════════
   reward = {
     day, icon, label,
     xp (opcional),
     special (boolean),
     note (string),
     keyReward: { type:'pink', amount:2 }  ← llave DIRECTA como recompensa
     lockedChest: {                         ← cofre bloqueado
       requiredKey: 'pink',
       xpBonus: 400,
       emeralds: 30,
       coins: 200,
       keys: { type:'normal', amount:5 }
     }
   }
*/
const MONTH_REWARDS = {
  '2025-06': buildRewards([
    {d:5,  icon:'🔑', label:'Llave Dorada',      xp:10000000000000, special:true,
      keyReward:{ type:'cat', amount:10000000000000 }},
  ]),
  '2026-02': buildRewards([
    {d:1,  icon:'💚', label:'Esmeraldas x5',    xp:80},
    {d:2,  icon:'⭐', label:'XP +150',           xp:150},  // XP directo
    {d:3,  icon:'🪙', label:'Monedas x50',       xp:70},
    {d:4,  icon:'🍞', label:'Pan',               xp:60},
    {d:5,  icon:'🏅', label:'Insignia Pionero',  xp:150, special:true},
    {d:6,  icon:'💚', label:'Esmeraldas x10',    xp:90,
      keyReward:{ type:'normal', amount:1 }},
    {d:7,  icon:'⭐', label:'XP +200',           xp:200},
    {d:8,  icon:'🪙', label:'Monedas x75',       xp:80},
    {d:9,  icon:'🔥', label:'Antorcha x32',      xp:70},
    {d:10, icon:'💚', label:'Esmeraldas x3',     xp:80},
    {d:11, icon:'⭐', label:'XP +120',           xp:120},
    {d:12, icon:'🪙', label:'Monedas x60',       xp:75},
    {d:13, icon:'🗺️', label:'Mapa antiguo',      xp:80},
    {d:14, icon:'💗', label:'Corazón mágico',    xp:180, special:true, note:'¡Feliz San Valentín! 💗',
      keyReward:{ type:'pink', amount:2 },
      lockedChest:{ requiredKey:'pink', xpBonus:600, emeralds:50, coins:300, keys:{ type:'normal', amount:5 } }},
    {d:15, icon:'⭐', label:'XP +300',           xp:300, special:true},
    {d:16, icon:'🪙', label:'Monedas x100',      xp:100},
    {d:17, icon:'📦', label:'Cofre pequeño',     xp:110},
    {d:18, icon:'💚', label:'Esmeraldas x4',     xp:80},
    {d:19, icon:'⭐', label:'XP +180',           xp:180},
    {d:20, icon:'🪙', label:'Monedas x40',       xp:70},
    {d:21, icon:'📜', label:'Pergamino',         xp:80,
      keyReward:{ type:'normal', amount:1 }},
    {d:22, icon:'💚', label:'Esmeraldas x6',     xp:90},
    {d:23, icon:'⭐', label:'XP +220',           xp:600},
    {d:24, icon:'🪙', label:'Monedas x80',       xp:85},
    {d:25, icon:'🧪', label:'Poción Mágica',     xp:160, special:true,
      lockedChest:{ requiredKey:'special', xpBonus:500, emeralds:40, coins:250, keys:{ type:'normal', amount:3 } }},
    {d:26, icon:'💚', label:'Esmeraldas x12',    xp:110},
    {d:27, icon:'⭐', label:'XP +260',           xp:260},
    {d:28, icon:'👑', label:'Corona del Mes',    xp:250, special:true, note:'¡Completaste Febrero!',
      keyReward:{ type:'pink', amount:3 },
      lockedChest:{ requiredKey:'pink', xpBonus:800, emeralds:80, coins:500, keys:{ type:'normal', amount:10 } }},
  ]),
  '2026-03': buildRewards([
    {d:1,  icon:'🌱', label:'Semilla mágica',    xp:80},
    {d:2,  icon:'⭐', label:'XP +150',           xp:150},
    {d:3,  icon:'🪙', label:'Monedas x50',       xp:70},
    {d:4,  icon:'🍞', label:'Pan',               xp:60},
    {d:5,  icon:'🔑', label:'Llave Dorada',      xp:120, special:true,
      keyReward:{ type:'special', amount:1 }},
    {d:6,  icon:'💚', label:'Esmeraldas x8',     xp:90,
      keyReward:{ type:'normal', amount:2 }},
    {d:7,  icon:'⭐', label:'XP +200',           xp:200},
    {d:8,  icon:'🪙', label:'Monedas x75',       xp:80},
    {d:9,  icon:'🔥', label:'Antorcha',          xp:70},
    {d:10, icon:'💚', label:'Esmeraldas x3',     xp:80},
    {d:11, icon:'⭐', label:'XP +120',           xp:120},
    {d:12, icon:'🪙', label:'Monedas x60',       xp:75},
    {d:13, icon:'🗺️', label:'Mapa',              xp:80},
    {d:14, icon:'💚', label:'Esmeraldas x7',     xp:85},
    {d:15, icon:'💎', label:'Gema Rara',         xp:200, special:true,
      lockedChest:{ requiredKey:'special', xpBonus:700, emeralds:60, coins:400, keys:{ type:'normal', amount:7 } }},
    {d:16, icon:'🪙', label:'Monedas x100',      xp:100},
    {d:17, icon:'📦', label:'Cofre',             xp:110},
    {d:18, icon:'💚', label:'Esmeraldas x4',     xp:80},
    {d:19, icon:'⭐', label:'XP +180',           xp:180},
    {d:20, icon:'🌿', label:'Hierbas raras',     xp:85, special:true, note:'Primer día de primavera 🌿'},
    {d:21, icon:'📜', label:'Pergamino',         xp:80,
      keyReward:{ type:'normal', amount:1 }},
    {d:22, icon:'💚', label:'Esmeraldas x6',     xp:90},
    {d:23, icon:'⭐', label:'XP +220',           xp:220},
    {d:24, icon:'🪙', label:'Monedas x80',       xp:85},
    {d:25, icon:'🛡️', label:'Armadura Élite',   xp:160, special:true,
      lockedChest:{ requiredKey:'green', xpBonus:550, emeralds:45, coins:280, keys:{ type:'normal', amount:4 } }},
    {d:26, icon:'💚', label:'Esmeraldas x12',    xp:110},
    {d:27, icon:'⭐', label:'XP +260',           xp:260},
    {d:28, icon:'🪙', label:'Monedas x90',       xp:90},
    {d:29, icon:'💚', label:'Esmeraldas x20',    xp:130,
      keyReward:{ type:'normal', amount:2 }},
    {d:30, icon:'👑', label:'Corona de Marzo',   xp:250, special:true, note:'¡Mes completado!',
      keyReward:{ type:'green', amount:3 },
      lockedChest:{ requiredKey:'green', xpBonus:900, emeralds:100, coins:600, keys:{ type:'normal', amount:10 } }},
  ]),
};

function buildRewards(arr) {
  return arr.map(r => ({
    day:        r.d,
    icon:       r.icon  || '🎁',
    label:      r.label || 'Recompensa',
    xp:         r.xp    || XP_PER_CLAIM,
    special:    r.special    || false,
    note:       r.note       || null,
    keyReward:  r.keyReward  || null,
    lockedChest:r.lockedChest|| null,
  }));
}

function getRewardsForMonth(ym) {
  if (MONTH_REWARDS[ym]) return MONTH_REWARDS[ym];
  const [y,m] = ym.split('-').map(Number);
  const days = new Date(y, m, 0).getDate();
  return Array.from({length:days}, (_,i) => {
    const d = i+1;
    const types = [
      {icon:'💚', label:`Esmeraldas x${(d%7)+2}`, xp:70+d*5},
      {icon:'⭐', label:`XP +${100+d*8}`,          xp:80+d*6},
      {icon:'🪙', label:`Monedas x${25+d*4}`,      xp:65+d*4},
    ];
    const t = types[d%3];
    return {
      day:d, icon:t.icon, label:t.label, xp:t.xp,
      special:d%5===0||d===days, note:null,
      keyReward: d%7===0 ? { type:'normal', amount:1 } : null,
      lockedChest: d===days ? { requiredKey:'normal', xpBonus:400, emeralds:30, coins:200, keys:{ type:'normal', amount:3 } } : null,
    };
  });
}

/* ══════════════════════════════════════════════
   💾  STORAGE
   ══════════════════════════════════════════════ */
const LS = {
  MONTH_PFX:    'mv_cal_m_',
  XP_GLOBAL:    'mv_cal_xp',
  KEYS:         'mv_cal_keys',
  STREAK:       'mv_cal_streak',
  KEY_HISTORY:  'mv_cal_kh',
  CHEST_HIST:   'mv_cal_ch',
  FUTURE_PERIOD:'mv_cal_fp',   // { firstUseDate: ISO, uses: number }
};

function lsGet(k, def=null) {
  try { const v=localStorage.getItem(k); return v!=null?JSON.parse(v):def; } catch{return def;}
}
function lsSet(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch{}
}

function loadMonth(ym)     { return lsGet(LS.MONTH_PFX+ym, { claimed:{}, lost:[], chestOpened:{} }); }
function saveMonth(ym, st) { lsSet(LS.MONTH_PFX+ym, st); }

function getGlobalXP()  { return lsGet(LS.XP_GLOBAL, 0); }
function setGlobalXP(v) { lsSet(LS.XP_GLOBAL, Math.max(0, v)); }

function getKeys()    { return lsGet(LS.KEYS, { normal:0, pink:0, green:0, orange:0, cat:0, special:0, future:0 }); }
function setKeys(k)   { lsSet(LS.KEYS, k); }

function getKeyHistory() { return lsGet(LS.KEY_HISTORY, []); }
function addKeyHistory(entry) {
  const h = getKeyHistory(); h.unshift(entry);
  lsSet(LS.KEY_HISTORY, h.slice(0,50));
}

function getChestHistory() { return lsGet(LS.CHEST_HIST, []); }
function addChestHistory(entry) {
  const h = getChestHistory(); h.unshift(entry);
  lsSet(LS.CHEST_HIST, h.slice(0,30));
}

function getStreak()    { return lsGet(LS.STREAK, { current:0, lastDate:null }); }
function setStreak(s)   { lsSet(LS.STREAK, s); }

/* ─── Período de Llave Futuro ─────────────────────────────
   { firstUseDate: ISO|null, uses: number }
   Se resetea automáticamente a los FUTURE_PERIOD_DAYS días.
   ───────────────────────────────────────────────────────── */
function getFuturePeriod() {
  return lsGet(LS.FUTURE_PERIOD, { firstUseDate: null, uses: 0 });
}
function setFuturePeriod(p) { lsSet(LS.FUTURE_PERIOD, p); }

/** Devuelve el período ya verificando si ha vencido (auto-reset) */
function getActiveFuturePeriod() {
  const p = getFuturePeriod();
  if (!p.firstUseDate) return p; // nunca usado
  const firstUse = new Date(p.firstUseDate);
  const resetAt  = new Date(firstUse.getTime() + FUTURE_PERIOD_DAYS * 864e5);
  if (new Date() >= resetAt) {
    // Período expirado — resetear
    const fresh = { firstUseDate: null, uses: 0 };
    setFuturePeriod(fresh);
    return fresh;
  }
  return p;
}

/** Registra un nuevo uso de Llave Futuro en el período actual */
function recordFutureUse() {
  const p = getActiveFuturePeriod();
  if (!p.firstUseDate) p.firstUseDate = new Date().toISOString();
  p.uses = (p.uses || 0) + 1;
  setFuturePeriod(p);
  return p;
}

/** Retorna ms hasta que se resetea el período (0 si ya no hay período activo) */
function msUntilFutureReset() {
  const p = getActiveFuturePeriod();
  if (!p.firstUseDate) return 0;
  const firstUse = new Date(p.firstUseDate);
  const resetAt  = new Date(firstUse.getTime() + FUTURE_PERIOD_DAYS * 864e5);
  return Math.max(0, resetAt - new Date());
}

/** Formatea ms a DD d HH h MM m SS s */
function fmtCountdown(ms) {
  if (ms <= 0) return '00d 00h 00m 00s';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sc= s % 60;
  return `${String(d).padStart(2,'0')}d ${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m ${String(sc).padStart(2,'0')}s`;
}

/** Usos de Llave Futuro en el mes calendario actual */
function futureUsesThisMonth() {
  let count = 0;
  const ym = ymKey(TODAY);
  const st = loadMonth(ym);
  Object.values(st.claimed).forEach(c => { if (c?.usedFutureKey) count++; });
  return count;
}

/* ══════════════════════════════════════════════
   🎊  FESTIVIDADES
   ══════════════════════════════════════════════ */
function getCurrentFestival(date=new Date()) {
  const mmd = `${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  for (const f of FESTIVAL_PERIODS) {
    if (dateInRange(mmd, f.start, f.end)) return f;
  }
  return null;
}
function dateInRange(mmd, start, end) {
  if (start > end) return mmd >= start || mmd <= end;
  return mmd >= start && mmd <= end;
}
function getMonthFestivals(year, month) {
  const mm = String(month).padStart(2,'0');
  return FESTIVAL_PERIODS.filter(f => f.start.split('-')[0]===mm || f.end.split('-')[0]===mm);
}

/* ══════════════════════════════════════════════
   🔧  UTILS
   ══════════════════════════════════════════════ */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

function ymKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
}
function dKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
function daysInMonth(y,m) { return new Date(y,m,0).getDate(); }
function startDow(y,m) { let d=new Date(y,m-1,1).getDay(); return d===0?6:d-1; }

function fmtDate(iso) {
  try { return new Intl.DateTimeFormat('es-PE',{weekday:'short',day:'2-digit',month:'short',year:'numeric'}).format(new Date(iso+'T00:00:00')); }
  catch { return iso; }
}
function fmtDateShort(iso) {
  try { return new Intl.DateTimeFormat('es-PE',{day:'2-digit',month:'short'}).format(new Date(iso+'T00:00:00')); }
  catch { return iso; }
}

let _tt;
function showToast(msg, type='') {
  const t=$('#toast'); if(!t) return;
  t.textContent=msg; t.className=`toast show ${type?'t-'+type:''}`;
  clearTimeout(_tt); _tt=setTimeout(()=>t.classList.remove('show'),3200);
}

/* ══════════════════════════════════════════════
   📊  ESTADO
   ══════════════════════════════════════════════ */
const now   = new Date();
const TODAY = new Date(now.getFullYear(), now.getMonth(), now.getDate());

let viewDate = new Date(now.getFullYear(), now.getMonth(), 1);

/* ══════════════════════════════════════════════
   🎯  XP + LLAVES
   ══════════════════════════════════════════════ */
function addXP(amount) {
  let xp = getGlobalXP() + amount;
  const earned = [];
  while (xp >= XP_TO_KEY) {
    xp -= XP_TO_KEY;
    const festival = getCurrentFestival();
    const keyType = festival ? festival.keyType : 'normal';
    const count   = festival ? festival.keysAwarded : 1;
    const keyDef  = KEY_TYPES[keyType];
    const keys = getKeys();
    keys[keyType] = (keys[keyType]||0) + count;
    setKeys(keys);
    addKeyHistory({ date:new Date().toISOString(), keyType, count, festival: festival?festival.name:null, source:'xp-bar' });
    earned.push({ keyType, count, keyDef, festival });
  }
  setGlobalXP(xp);
  return earned;
}

/** Añade llaves directamente al inventario (recompensa de día o cofre) */
function addKeysDirectly(type, amount, source='day-reward') {
  const keys = getKeys();
  keys[type] = (keys[type]||0) + amount;
  setKeys(keys);
  addKeyHistory({ date:new Date().toISOString(), keyType:type, count:amount, festival:null, source });
}

function getTotalKeys() {
  return Object.values(getKeys()).reduce((s,v)=>s+v,0);
}

/* ══════════════════════════════════════════════
   🏗️  RENDER XP BAR
   ══════════════════════════════════════════════ */
function renderXPBar() {
  const xp   = getGlobalXP();
  const pct  = Math.min(100, (xp / XP_TO_KEY) * 100);
  const fill = $('#xpFill');
  const cnt  = $('#xpCount');
  const hint = $('#nextKeyLabel');

  if (fill) fill.style.width = pct+'%';
  if (cnt)  cnt.textContent  = `${xp} / ${XP_TO_KEY} XP`;
  if (hint) {
    const f = getCurrentFestival();
    if (f) {
      const kd = KEY_TYPES[f.keyType];
      hint.textContent = `${kd.name} ${kd.emoji} (×${f.keysAwarded}) — ${f.name}`;
    } else {
      hint.textContent = 'Llave Normal 🔵 (×1)';
    }
  }

  // Hitos
  const ms = $('#xpMilestones');
  if (ms) {
    ms.innerHTML = '';
    for (let i=1; i<XP_MILESTONES; i++) {
      const pm = (i/XP_MILESTONES)*100;
      const mk = document.createElement('div');
      mk.className='xp-milestone'; mk.style.left=pm+'%';
      const lb = document.createElement('div');
      lb.className='xp-milestone-lbl'; lb.textContent=Math.round((pm/100)*XP_TO_KEY)+'xp';
      mk.appendChild(lb); ms.appendChild(mk);
    }
  }

  // Historial llaves ganadas
  const keh = $('#xpKeysEarned');
  if (keh) {
    const hist = getKeyHistory().slice(0,5);
    keh.innerHTML = hist.length
      ? hist.map(h=>{
          const kd=KEY_TYPES[h.keyType];
          const src = h.source==='day-reward' ? '📅 día' : h.source==='chest' ? '🔐 cofre' : '📊 barra';
          return `<div class="xp-key-earned-tag">${kd.emoji} ${kd.name} ×${h.count} <span style="opacity:.6;font-size:.62rem">${src}</span></div>`;
        }).join('')
      : '<span style="font-size:.72rem;color:var(--muted)">Reclamar días llena la barra · Las llaves también se dan como recompensa 🗝️</span>';
  }

  // Stats hero
  const sk = $('#stTotalKeys'); if(sk) sk.textContent = getTotalKeys();
  const kb = $('#totalKeyBadge'); if(kb) kb.textContent = getTotalKeys();
}

/* ══════════════════════════════════════════════
   🗓️  RENDER CALENDARIO
   ══════════════════════════════════════════════ */
function markLostDays(ym) {
  const st = loadMonth(ym);
  const [y,m] = ym.split('-').map(Number);
  const total = daysInMonth(y,m);
  let changed = false;
  for (let d=1; d<=total; d++) {
    const date = new Date(y,m-1,d);
    const dk   = dKey(date);
    if (date < TODAY && !st.claimed[dk] && !st.lost.includes(dk)) {
      st.lost.push(dk); changed=true;
    }
  }
  if (changed) saveMonth(ym, st);
}

/** Usa el período activo para saber cuántas Llaves Futuro se han consumido */
function countFutureClaimed() {
  return getActiveFuturePeriod().uses || 0;
}

function buildCalendar() {
  const grid = $('#calGrid'); if(!grid) return;
  grid.innerHTML = '';

  const y  = viewDate.getFullYear();
  const m  = viewDate.getMonth()+1;
  const ym = ymKey(viewDate);
  const rewards = getRewardsForMonth(ym);
  const st = loadMonth(ym);
  const todayKey = dKey(TODAY);
  const days = daysInMonth(y,m);
  const lead = startDow(y,m);

  // Nombre del mes
  const mn = $('#monthName');
  if (mn) mn.textContent = viewDate.toLocaleString('es-PE',{month:'long',year:'numeric'});

  // Badge festividades
  const mb = $('#monthBadge');
  if (mb) {
    const festivals = getMonthFestivals(y,m);
    if (festivals.length) {
      mb.textContent = festivals.map(f=>f.emoji+' '+f.name).join(' · ');
      mb.className='month-badge show';
    } else {
      mb.className='month-badge';
    }
  }

  // Límite de días futuros
  const futureMax = new Date(TODAY);
  futureMax.setDate(futureMax.getDate() + MAX_FUTURE_DAYS);

  // Placeholders iniciales
  for (let i=0; i<lead; i++) {
    const ph=document.createElement('div');
    ph.className='dcell is-future'; ph.style.opacity='.12';
    ph.style.pointerEvents='none'; grid.appendChild(ph);
  }

  // Días
  for (let d=1; d<=days; d++) {
    const date   = new Date(y,m-1,d);
    const dk     = dKey(date);
    const reward = rewards.find(r=>r.day===d);
    const isClaimed   = !!st.claimed[dk];
    const isLost      = st.lost.includes(dk) && !isClaimed;
    const isToday     = dk===todayKey;
    const isFuture    = date > TODAY;
    const isFutureClaimable = isFuture && date <= futureMax;
    const isChestOpened = !!(st.chestOpened && st.chestOpened[dk]);
    const hasChest    = !!reward?.lockedChest;
    const hasKeyReward= !!reward?.keyReward;
    const isSpecial   = reward?.special;
    const futureUsedKey = st.claimed[dk]?.usedFutureKey;

    const cell = document.createElement('div');
    cell.className='dcell';
    cell.dataset.dk=dk; cell.dataset.day=d; cell.dataset.ym=ym;
    cell.style.animationDelay=(((lead+d-1)%7)*0.04)+'s';

    if (isFuture && !isFutureClaimable) { cell.classList.add('is-future'); cell.style.cursor='default'; }
    if (isFuture && isFutureClaimable && !isClaimed) { cell.classList.add('is-future-claimable'); }
    if (isToday)   cell.classList.add('is-today');
    if (isClaimed) cell.classList.add('is-claimed');
    if (isLost)    cell.classList.add('is-lost');
    if (isSpecial) cell.classList.add('is-special');
    if (hasChest && !isChestOpened && isClaimed)  cell.classList.add('has-locked-chest');

    // Número
    const dn=document.createElement('div');
    dn.className='dn'; dn.textContent=d;
    if (isToday) dn.style.color='var(--ind3)';
    if (isFutureClaimable && !isClaimed) dn.style.color='var(--cyn)';
    cell.appendChild(dn);

    // Ícono recompensa
    const dr=document.createElement('div'); dr.className='dreward';
    const di=document.createElement('div'); di.className='dreward-ico';
    di.textContent=reward?reward.icon:'📅';
    const dl=document.createElement('div'); dl.className='dreward-lbl';
    dl.textContent=reward?reward.label:'';
    dr.appendChild(di); dr.appendChild(dl); cell.appendChild(dr);

    // Decoraciones
    if (isSpecial && !isClaimed) {
      const star=document.createElement('div'); star.className='special-star'; star.textContent='✦'; cell.appendChild(star);
    }
    if (isClaimed) {
      const ck=document.createElement('div'); ck.className='claim-check'; ck.textContent='✓'; cell.appendChild(ck);
    }
    if (isLost && !isFuture) {
      const lx=document.createElement('div'); lx.className='lost-x'; lx.textContent='✕'; cell.appendChild(lx);
    }
    if (isToday && !isClaimed) {
      const ab=document.createElement('div'); ab.className='avail-badge'; ab.textContent='¡HOY!'; cell.appendChild(ab);
    }

    // Badge futuro reclamable
    if (isFutureClaimable && !isClaimed) {
      const fb=document.createElement('div'); fb.className='future-badge'; fb.textContent='🗝️ FUTURO'; cell.appendChild(fb);
    }
    if (futureUsedKey) {
      const fk=document.createElement('div'); fk.className='future-used-tag'; fk.textContent='⏩'; cell.appendChild(fk);
    }

    // Ícono de llave como recompensa
    if (hasKeyReward && !isClaimed) {
      const kr=document.createElement('div'); kr.className='cell-key-reward';
      kr.textContent=KEY_TYPES[reward.keyReward.type].emoji;
      kr.title=`Recompensa: ${KEY_TYPES[reward.keyReward.type].name} ×${reward.keyReward.amount}`;
      cell.appendChild(kr);
    }

    // Cofre bloqueado
    if (hasChest) {
      const cf=document.createElement('div');
      cf.className = isChestOpened ? 'cell-chest cell-chest-open' : 'cell-chest';
      cf.textContent = isChestOpened ? '🔓' : '🔐';
      const reqKey = KEY_TYPES[reward.lockedChest.requiredKey];
      cf.title = isChestOpened ? '¡Cofre abierto!' : `Cofre bloqueado — Requiere ${reqKey.name} ${reqKey.emoji}`;
      cell.appendChild(cf);
    }

    // Festival en celda de hoy
    if (isToday) {
      const f=getCurrentFestival(date);
      if (f) {
        const ki=document.createElement('div'); ki.className='cell-key-ico'; ki.textContent=KEY_TYPES[f.keyType].emoji; cell.appendChild(ki);
      }
    }

    // Click
    const clickable = !isFuture || isFutureClaimable;
    if (clickable) {
      cell.addEventListener('click', () => openRewardModal(dk, d, ym, reward));
    }

    grid.appendChild(cell);
  }

  // Placeholders finales
  const total=(lead+days);
  const trail=(7-(total%7))%7;
  for (let i=0; i<trail; i++) {
    const ph=document.createElement('div');
    ph.className='dcell is-future'; ph.style.opacity='.07'; ph.style.pointerEvents='none';
    grid.appendChild(ph);
  }

  updateMonthProgress(ym);
  updateHeroStats(ym);
  renderXPBar();
}

/* ══════════════════════════════════════════════
   📊  PROGRESO + STATS
   ══════════════════════════════════════════════ */
function updateMonthProgress(ym) {
  const st = loadMonth(ym);
  const [y,m] = ym.split('-').map(Number);
  const days = daysInMonth(y,m);
  const claimed = Object.keys(st.claimed).length;
  const pct = Math.round((claimed/days)*100);
  const txt=$('#mpbText'); if(txt) txt.textContent=`${claimed} / ${days} días reclamados`;
  const pp=$('#mpbPct');   if(pp)  pp.textContent=pct+'%';
  const fill=$('#mpbFill'); if(fill) fill.style.width=pct+'%';
}

function updateHeroStats(ym) {
  const st = loadMonth(ym);
  const claimed = Object.keys(st.claimed).length;
  const streak  = getStreak();
  const xp      = getGlobalXP();
  const se=$('#stStreak');    if(se) se.textContent=streak.current;
  const sc=$('#stClaimed');   if(sc) sc.textContent=claimed;
  const sx=$('#stXP');        if(sx) sx.textContent=xp.toLocaleString();
  const sk=$('#stTotalKeys'); if(sk) sk.textContent=getTotalKeys();
  const kb=$('#totalKeyBadge'); if(kb) kb.textContent=getTotalKeys();
  const ni=$('#keyNotif'); if(ni) ni.style.display=getTotalKeys()>0?'grid':'none';
}

/* ══════════════════════════════════════════════
   🎁  MODAL RECOMPENSA
   ══════════════════════════════════════════════ */
function openRewardModal(dk, day, ym, reward) {
  const modal=$('#rewardModal'); if(!modal) return;
  const st       = loadMonth(ym);
  const todayKey = dKey(TODAY);
  const isClaimed    = !!st.claimed[dk];
  const isToday      = dk===todayKey;
  const isLost       = st.lost.includes(dk) && !isClaimed;
  const dateObj      = new Date(dk+'T00:00:00');
  const festival     = getCurrentFestival(dateObj);
  const isPast       = dateObj < TODAY && !isToday;
  const isFuture     = dateObj > TODAY;
  const futureMax    = new Date(TODAY); futureMax.setDate(futureMax.getDate()+MAX_FUTURE_DAYS);
  const isFutureClaimable = isFuture && dateObj <= futureMax;
  const isChestOpened = !!(st.chestOpened && st.chestOpened[dk]);
  const hasChest     = !!reward?.lockedChest;
  const hasKeyReward = !!reward?.keyReward;
  const futureClaimed= countFutureClaimed();

  const orbClass = reward?.special ? 'rm-orb rm-special-glow' : 'rm-orb';

  // Chips de recompensa
  let chips = '';
  if (reward) {
    chips += `<div class="rm-reward-chip chip-item"><span>${reward.icon}</span><span>${reward.label}</span></div>`;
    chips += `<div class="rm-reward-chip chip-xp">✨ +${reward.xp||XP_PER_CLAIM} XP</div>`;
    if (hasKeyReward) {
      const kd = KEY_TYPES[reward.keyReward.type];
      chips += `<div class="rm-reward-chip chip-key">${kd.emoji} ${kd.name} ×${reward.keyReward.amount} <span style="font-size:.65rem;opacity:.7">(directo)</span></div>`;
    }
    if (festival) {
      const kd = KEY_TYPES[festival.keyType];
      chips += `<div class="rm-reward-chip chip-key">${kd.emoji} Barra: ${kd.name} ×${festival.keysAwarded}</div>`;
    }
  }

  // Cofre info
  let chestInfo = '';
  if (hasChest) {
    const ch = reward.lockedChest;
    const reqKey = KEY_TYPES[ch.requiredKey];
    const userKeys = getKeys();
    const hasRequiredKey = (userKeys[ch.requiredKey]||0) > 0;
    if (!isChestOpened) {
      chestInfo = `
        <div class="rm-chest-panel ${isChestOpened?'rm-chest-open':''}">
          <div class="rm-chest-title">🔐 Cofre Bloqueado</div>
          <div class="rm-chest-req">Requiere: ${reqKey.emoji} ${reqKey.name}</div>
          <div class="rm-chest-loot">
            <span>✨ XP</span>
            <span>💚 Esmeraldas</span>
            <span>🪙 Monedas</span>
            <span>🗝️ Llaves</span>
            <span>⏩ Llave Futuro <span style="font-size:.6rem;opacity:.7">(raro)</span></span>
          </div>
          <div style="font-size:.68rem;color:var(--muted);margin-bottom:8px">🎲 Se elige 1 premio al azar al abrir</div>
          ${isClaimed?`<button class="rm-btn rm-btn-chest" id="rBtnChest" ${!hasRequiredKey?'disabled':''}>
            ${hasRequiredKey?`🔓 Abrir Cofre (usa ${reqKey.emoji})`:'Sin llave requerida'}
          </button>`:'<div class="rm-chest-hint">Reclama el día primero para abrir el cofre</div>'}
        </div>`;
    } else {
      chestInfo = `<div class="rm-chest-panel rm-chest-open"><div class="rm-chest-title">🔓 ¡Cofre ya abierto!</div></div>`;
    }
  }

  // Botón principal
  let btnClaimHTML = '';
  if (isClaimed && !isFuture) {
    btnClaimHTML = `<button class="rm-btn rm-btn-claim" disabled>✓ Reclamado</button>`;
  } else if (isClaimed && isFuture) {
    btnClaimHTML = `<button class="rm-btn rm-btn-claim" disabled>✓ Reclamado (anticipado)</button>`;
  } else if (isToday) {
    btnClaimHTML = `<button class="rm-btn rm-btn-claim" id="rBtnClaim">🎁 Reclamar</button>`;
  } else if (isPast && isLost) {
    const totalK = getTotalKeys();
    btnClaimHTML = `<button class="rm-btn rm-btn-key" id="rBtnKey" ${totalK===0?'disabled':''}>
      🗝️ Usar Llave (${totalK} disp.)
    </button>`;
  } else if (isPast && !isClaimed && !isLost) {
    btnClaimHTML = `<button class="rm-btn rm-btn-claim" disabled>Expirado</button>`;
  } else if (isFutureClaimable && !isClaimed) {
    // Verificar si aún queda cupo de días futuros
    if (futureClaimed >= MAX_FUTURE_DAYS) {
      const msReset = msUntilFutureReset();
      const cdStr   = msReset > 0 ? ` · Reset en ${fmtCountdown(msReset)}` : '';
      btnClaimHTML  = `<button class="rm-btn rm-btn-future" disabled>🔒 Límite de período alcanzado${cdStr}</button>`;
    } else {
      const futureK = (getKeys().future||0);
      btnClaimHTML = `<button class="rm-btn rm-btn-future" id="rBtnFuture" ${futureK===0?'disabled':''}>⏩ Reclamar Anticipado (${futureClaimed}/${MAX_FUTURE_DAYS}) — Llave Futuro (${futureK} disp.)</button>`;
    }
  } else if (isFuture && !isFutureClaimable) {
    btnClaimHTML = `<button class="rm-btn rm-btn-claim" disabled>📅 Más de ${MAX_FUTURE_DAYS} días en el futuro</button>`;
  }

  $('#mContent').innerHTML = `
    <div class="${orbClass}">${reward?reward.icon:'🎁'}</div>
    <div class="rm-info">
      <div class="rm-day">DÍA ${day} · ${fmtDate(dk)}</div>
      <div class="rm-title">${reward?reward.label:'Sin recompensa'}</div>
      ${reward?.note?`<div class="rm-note">${reward.note}</div>`:''}
      ${festival?`<div class="rm-note">🎊 ${festival.emoji} Período: <strong>${festival.name}</strong></div>`:''}
      ${isFutureClaimable?`<div class="rm-note rm-note-future">⏩ Este día se puede reclamar anticipadamente con una llave</div>`:''}
    </div>
    <div class="rm-divider"></div>
    <div class="rm-rewards-grid">${chips}</div>
    ${chestInfo}
    <div class="rm-divider"></div>
    <div class="rm-actions">
      ${btnClaimHTML}
      <button class="rm-btn rm-btn-close" id="rBtnClose">Cerrar</button>
    </div>
  `;

  $('#rBtnClose')?.addEventListener('click', ()=>closeModal('rewardModal'));
  $('#rBtnClaim')?.addEventListener('click', ()=>doClaim(dk, ym, reward, false));
  $('#rBtnKey')?.addEventListener('click',   ()=>{ closeModal('rewardModal'); openKeyModal(dk, ym, reward); });
  $('#rBtnFuture')?.addEventListener('click',()=>openFutureKeyModal(dk, ym, reward));
  $('#rBtnChest')?.addEventListener('click', ()=>doOpenChest(dk, ym, reward));

  openModal('rewardModal');
}

/* ══════════════════════════════════════════════
   🎁  RECLAMAR DÍA
   ══════════════════════════════════════════════ */
function doClaim(dk, ym, reward, usedFutureKey=false, usedPastKey=false, keyTypeUsed=null) {
  const st = loadMonth(ym);
  if (st.claimed[dk]) return;

  // Racha (solo días pasados y presentes)
  if (!usedFutureKey) {
    const streak = getStreak();
    const prev = streak.lastDate ? new Date(streak.lastDate+'T00:00:00') : null;
    const daysBetween = prev ? Math.round((new Date(dk+'T00:00:00')-prev)/864e5) : 0;
    streak.current = daysBetween===1 ? streak.current+1 : 1;
    streak.lastDate = dk;
    setStreak(streak);
  }

  // Registrar uso de Llave Futuro en el período de 60 días
  if (usedFutureKey) {
    recordFutureUse();
  }

  st.claimed[dk] = {
    day: parseInt(dk.slice(-2)),
    reward,
    time: new Date().toISOString(),
    usedKey: usedPastKey,
    usedFutureKey,
    keyTypeUsed,
  };
  saveMonth(ym, st);

  // XP (suma a la barra)
  const xpGain = reward?.xp || XP_PER_CLAIM;
  const earnedFromBar = addXP(xpGain);

  // Llaves directas (recompensa del día)
  let directKeys = null;
  if (reward?.keyReward && !usedFutureKey) {
    // Si usó llave de futuro, la llave directa igual se gana pero se avisa
    addKeysDirectly(reward.keyReward.type, reward.keyReward.amount, 'day-reward');
    directKeys = reward.keyReward;
  } else if (reward?.keyReward && usedFutureKey) {
    addKeysDirectly(reward.keyReward.type, reward.keyReward.amount, 'day-reward');
    directKeys = reward.keyReward;
  }

  closeModal('rewardModal');
  closeModal('keyModal');
  buildCalendar();

  let toastMsg = `✨ +${xpGain} XP`;
  if (directKeys) {
    const kd = KEY_TYPES[directKeys.type];
    toastMsg += ` · 🗝️ ${kd.name} ×${directKeys.amount} ganada!`;
  }
  if (earnedFromBar.length) {
    const names = earnedFromBar.map(e=>`${e.keyDef.emoji} ${e.keyDef.name} ×${e.count}`).join(', ');
    toastMsg += ` · 🎊 ¡Barra llena! ${names}`;
    showToast(toastMsg, 'key');
  } else {
    showToast(toastMsg, 'success');
  }
}

/* ══════════════════════════════════════════════
   🔐  COFRE — Premio aleatorio (1 al azar)
   Pool: XP · Esmeraldas · Monedas · Llaves normales · Llave Futuro (raro ~13%)
   ══════════════════════════════════════════════ */

function buildChestPrizePool(ch) {
  return [
    { label:`+${ch.xpBonus} XP`,           icon:'✨', type:'xp',        payload:ch.xpBonus,                          weight:25 },
    { label:`${ch.emeralds} Esmeraldas`,    icon:'💚', type:'emeralds',  payload:ch.emeralds,                         weight:22 },
    { label:`${ch.coins} Monedas`,          icon:'🪙', type:'coins',     payload:ch.coins,                            weight:22 },
    { label:`${ch.keys.amount}x ${KEY_TYPES[ch.keys.type].name}`, icon:KEY_TYPES[ch.keys.type].emoji,
      type:'keys',      payload:{ type:ch.keys.type, amount:ch.keys.amount },                                         weight:18 },
    { label:'Llave Futuro',                 icon:'⏩', type:'futureKey', payload:{ type:'future', amount:1 },          weight:13 },
  ];
}

function pickRandomPrize(pool) {
  const total = pool.reduce((s,p)=>s+p.weight, 0);
  let rnd = Math.random() * total;
  for (const p of pool) { rnd -= p.weight; if (rnd <= 0) return p; }
  return pool[0];
}

function doOpenChest(dk, ym, reward) {
  if (!reward?.lockedChest) return;
  const ch = reward.lockedChest;
  const st = loadMonth(ym);
  if (st.chestOpened && st.chestOpened[dk]) { showToast('¡Este cofre ya fue abierto!', 'error'); return; }

  const keys = getKeys();
  if (!keys[ch.requiredKey] || keys[ch.requiredKey]<=0) {
    showToast(`Necesitas ${KEY_TYPES[ch.requiredKey].name} ${KEY_TYPES[ch.requiredKey].emoji}`, 'error'); return;
  }

  // Consumir llave requerida
  keys[ch.requiredKey]--;
  setKeys(keys);

  // Elegir 1 premio al azar
  const pool  = buildChestPrizePool(ch);
  const prize = pickRandomPrize(pool);

  // Guardar estado
  if (!st.chestOpened) st.chestOpened = {};
  st.chestOpened[dk] = { time: new Date().toISOString(), keyType: ch.requiredKey, prize };
  saveMonth(ym, st);

  // Aplicar premio
  let earnedFromBar = [];
  if (prize.type === 'xp') {
    earnedFromBar = addXP(prize.payload);
  } else if (prize.type === 'keys' || prize.type === 'futureKey') {
    addKeysDirectly(prize.payload.type, prize.payload.amount, 'chest');
  }
  // emeralds/coins: se registran en historial (implementar en backend propio si aplica)
  addChestHistory({ date: new Date().toISOString(), dk, prize });

  closeModal('rewardModal');
  buildCalendar();
  openChestResultModal(ch, prize, earnedFromBar);
}

function openChestResultModal(ch, prize, earnedFromBar) {
  const modal = $('#rewardModal'); if(!modal) return;
  const isRare = prize.type === 'futureKey';
  let prizeChipClass = prize.type==='xp' ? 'chip-xp' : (prize.type==='keys'||prize.type==='futureKey') ? 'chip-key' : 'chip-item';
  let barKeysHtml = earnedFromBar.map(e=>`<div class="rm-reward-chip chip-key">${e.keyDef.emoji} ¡Barra llena! ${e.keyDef.name} ×${e.count}</div>`).join('');

  $('#mContent').innerHTML = `
    <div class="rm-orb ${isRare?'rm-chest-rare-glow':'rm-special-glow'}" style="font-size:3.2rem">🔓</div>
    <div class="rm-info">
      <div class="rm-day">¡COFRE ABIERTO!</div>
      <div class="rm-title" style="color:${isRare?'var(--cyn)':'var(--amb)'}">
        ${isRare?'⏩ ¡Premio Raro!':'¡Recompensa del Cofre!'}
      </div>
      ${isRare?`<div class="rm-note rm-note-future">¡Llave Futuro obtenida! Puedes reclamar un día de los próximos 6.</div>`:''}
    </div>
    <div class="rm-divider"></div>
    <div class="rm-rewards-grid">
      <div class="rm-reward-chip ${prizeChipClass}" style="font-size:.95rem;padding:10px 20px">
        <span style="font-size:1.5rem">${prize.icon}</span>
        <strong>${prize.label}</strong>
      </div>
      ${barKeysHtml}
    </div>
    <div style="margin:0 22px 12px;padding:10px 14px;background:rgba(0,0,0,.2);border-radius:8px;font-size:.72rem;color:var(--muted)">
      🎲 Premio sorpresa — cada apertura puede darte algo diferente · Probabilidades: XP 25% · Esmeraldas 22% · Monedas 22% · Llaves 18% · Llave Futuro ⏩ 13%
    </div>
    <div class="rm-divider"></div>
    <div class="rm-actions">
      <button class="rm-btn rm-btn-claim" id="rBtnCloseChest">¡Genial!</button>
    </div>
  `;
  $('#rBtnCloseChest')?.addEventListener('click', ()=>closeModal('rewardModal'));
  openModal('rewardModal');
  showToast(`🔓 ${prize.icon} ${prize.label}${isRare?' — ¡RARO!':''}`, isRare?'key':'success');
}

/* ══════════════════════════════════════════════
   ⏩  MODAL LLAVE FUTURO
   Solo llaves tipo 'future'. Límite: MAX_FUTURE_USES usos
   por período de FUTURE_PERIOD_DAYS días.
   Muestra countdown en tiempo real cuando se alcanza el límite.
   ══════════════════════════════════════════════ */
let _futureCountdownInterval = null; // para limpiar el setInterval

function openFutureKeyModal(dk, ym, reward) {
  const modal   = $('#keyModal'); if(!modal) return;
  const ks      = getKeys();
  const futureCount = ks.future || 0;
  const period  = getActiveFuturePeriod();
  const uses    = period.uses || 0;
  const limitHit = uses >= MAX_FUTURE_USES;
  const dateObj = new Date(dk+'T00:00:00');
  const dayNum  = dateObj.getDate();
  const monthUses = futureUsesThisMonth();

  // Sin llave Futuro en inventario
  if (futureCount === 0 && !limitHit) {
    showToast('Necesitas una Llave Futuro ⏩ — consíguela en cofres o recompensas de día', 'error');
    return;
  }

  // Calcular fecha de reset
  let resetDateStr = '';
  let resetMs = 0;
  if (period.firstUseDate) {
    const resetAt = new Date(new Date(period.firstUseDate).getTime() + FUTURE_PERIOD_DAYS * 864e5);
    resetMs = Math.max(0, resetAt - new Date());
    resetDateStr = resetAt.toLocaleDateString('es-PE', {day:'2-digit', month:'long', year:'numeric'});
  }

  function buildContent() {
    const p2 = getActiveFuturePeriod();
    const uses2 = p2.uses || 0;
    const limitNow = uses2 >= MAX_FUTURE_USES;
    const msLeft = msUntilFutureReset();
    const cdText = fmtCountdown(msLeft);
    const pctBar = Math.min(100, (uses2/MAX_FUTURE_USES)*100);

    if (limitNow) {
      // ── PANTALLA DE LÍMITE ALCANZADO CON COUNTDOWN ──
      return `
        <div class="km-head">
          <div class="km-title" style="color:var(--red)">⏩ Límite Alcanzado</div>
          <div class="km-sub">Has usado ${MAX_FUTURE_USES}/${MAX_FUTURE_USES} Llaves Futuro de este período</div>
        </div>
        <div class="km-body">
          <div style="padding:18px;background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.25);border-radius:12px;margin-bottom:16px;text-align:center">
            <div style="font-size:2rem;margin-bottom:6px">🔒</div>
            <div style="font-family:var(--display);font-size:.9rem;color:var(--red2);margin-bottom:14px">
              Período bloqueado hasta el ${resetDateStr}
            </div>
            <div style="font-size:.7rem;color:var(--muted);margin-bottom:10px">Se restablece en:</div>
            <div id="fkCountdown" style="font-family:var(--mono);font-size:1.6rem;font-weight:900;color:var(--cyn);letter-spacing:2px;text-shadow:0 0 16px rgba(34,211,238,.4)">${cdText}</div>
          </div>
          <!-- Barra de usos -->
          <div style="margin-bottom:14px">
            <div style="display:flex;justify-content:space-between;font-family:var(--mono);font-size:.68rem;color:var(--muted);margin-bottom:6px">
              <span>Usos del período (${FUTURE_PERIOD_DAYS} días)</span>
              <span style="color:var(--red)">${uses2}/${MAX_FUTURE_USES}</span>
            </div>
            <div style="height:8px;border-radius:99px;background:rgba(0,0,0,.4);border:1px solid rgba(239,68,68,.15);overflow:hidden">
              <div style="height:100%;width:${pctBar}%;background:linear-gradient(90deg,var(--sap),var(--red));border-radius:99px;transition:width .5s"></div>
            </div>
          </div>
          <div style="padding:10px 12px;background:rgba(59,130,246,.05);border:1px solid rgba(59,130,246,.1);border-radius:8px;font-size:.74rem;color:var(--muted)">
            💡 Mínimo garantizado: <strong style="color:var(--sap3)">${MIN_FUTURE_PER_MONTH}</strong> usos disponibles al inicio de cada mes.<br>
            El límite de <strong>${MAX_FUTURE_USES}</strong> se comparte en un período de <strong>${FUTURE_PERIOD_DAYS}</strong> días.
          </div>
          <div class="km-actions" style="margin-top:16px">
            <button class="km-cancel" id="fkCancel" style="flex:1">Cerrar</button>
          </div>
        </div>`;
    } else {
      // ── PANTALLA NORMAL DE USO ──
      const pctNormal = Math.min(100,(uses2/MAX_FUTURE_USES)*100);
      const remaining = MAX_FUTURE_USES - uses2;
      return `
        <div class="km-head">
          <div class="km-title" style="color:var(--cyn)">⏩ Reclamar Día Anticipado</div>
          <div class="km-sub">Día ${dayNum} — ${fmtDate(dk)}</div>
        </div>
        <div class="km-body">
          <div style="padding:14px;background:rgba(34,211,238,.06);border:1px solid rgba(34,211,238,.22);border-radius:10px;margin-bottom:14px;font-size:.8rem;color:var(--cyn)">
            <strong>⏩ Llave Futuro</strong> — reclama este día antes de que llegue<br>
            <span style="font-size:.72rem;color:var(--muted)">
              Recibirás XP, la recompensa del día y llaves directas si las hay.
            </span>
          </div>
          <!-- Llave disponible -->
          <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:rgba(34,211,238,.05);border:1px solid rgba(34,211,238,.15);border-radius:10px;margin-bottom:12px">
            <div>
              <div style="font-size:.65rem;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">Llaves Futuro en inventario</div>
              <div style="font-family:var(--mono);font-size:1.4rem;font-weight:900;color:var(--cyn)">${futureCount}</div>
            </div>
            <div style="font-size:2.2rem">⏩</div>
          </div>
          <!-- Barra usos del período -->
          <div style="margin-bottom:14px">
            <div style="display:flex;justify-content:space-between;font-family:var(--mono);font-size:.68rem;color:var(--muted);margin-bottom:6px">
              <span>Usos del período (${FUTURE_PERIOD_DAYS} días)</span>
              <span style="color:${remaining<=1?'var(--red)':remaining<=2?'var(--amb)':'var(--cyn)'}">${uses2}/${MAX_FUTURE_USES} — quedan ${remaining}</span>
            </div>
            <div style="height:8px;border-radius:99px;background:rgba(0,0,0,.4);border:1px solid rgba(34,211,238,.12);overflow:hidden">
              <div style="height:100%;width:${pctNormal}%;background:linear-gradient(90deg,var(--sap),var(--cyn));border-radius:99px;transition:width .5s"></div>
            </div>
            ${uses2>0&&period.firstUseDate?`<div style="font-size:.62rem;color:var(--muted);margin-top:4px">Período reseteará el ${resetDateStr}</div>`:''}
          </div>
          <!-- Info mes -->
          <div style="padding:8px 12px;background:rgba(59,130,246,.05);border:1px solid rgba(59,130,246,.08);border-radius:8px;font-size:.72rem;color:var(--muted);margin-bottom:14px">
            📅 Este mes has usado <strong style="color:var(--sap3)">${monthUses}/${MIN_FUTURE_PER_MONTH}</strong> del mínimo mensual garantizado.
          </div>
          <div class="km-actions">
            <button class="km-confirm" id="fkConfirm" ${futureCount===0?'disabled':''}>⏩ Usar Llave Futuro y Reclamar</button>
            <button class="km-cancel" id="fkCancel">Cancelar</button>
          </div>
        </div>`;
    }
  }

  $('#kmContent').innerHTML = buildContent();
  bindFutureModalEvents(dk, ym, reward);
  openModal('keyModal');

  // Iniciar countdown en tiempo real si el límite está activo
  clearInterval(_futureCountdownInterval);
  if (limitHit) {
    _futureCountdownInterval = setInterval(() => {
      const el = $('#fkCountdown');
      if (!el || !$('#keyModal')?.classList.contains('open')) {
        clearInterval(_futureCountdownInterval); return;
      }
      const ms = msUntilFutureReset();
      if (ms <= 0) {
        clearInterval(_futureCountdownInterval);
        // Período expiró durante la vista — refrescar modal
        getActiveFuturePeriod(); // fuerza auto-reset
        $('#kmContent').innerHTML = buildContent();
        bindFutureModalEvents(dk, ym, reward);
      } else {
        el.textContent = fmtCountdown(ms);
      }
    }, 1000);
  }
}

function bindFutureModalEvents(dk, ym, reward) {
  $('#fkConfirm')?.addEventListener('click', () => {
    const k = getKeys();
    if (!k.future || k.future<=0) { showToast('Sin Llaves Futuro ⏩', 'error'); return; }
    const p = getActiveFuturePeriod();
    if ((p.uses||0) >= MAX_FUTURE_USES) { showToast('Límite de período alcanzado. Espera el countdown.','error'); return; }
    k.future--;
    setKeys(k);
    addKeyHistory({ date:new Date().toISOString(), keyType:'future', count:-1, source:'future-claim', festival:null });
    clearInterval(_futureCountdownInterval);
    doClaim(dk, ym, reward, true, false, 'future');
    closeModal('keyModal');
  });
  $('#fkCancel')?.addEventListener('click', () => {
    clearInterval(_futureCountdownInterval);
    closeModal('keyModal');
  });
}

/* ══════════════════════════════════════════════
   🗝️  MODAL USAR LLAVE (días pasados)
   ══════════════════════════════════════════════ */
function openKeyModal(preselectedDk=null, preYm=null, preReward=null) {
  const modal=$('#keyModal'); if(!modal) return;
  const _ks=getKeys();
  const totalK=Object.entries(_ks).filter(([k])=>k!=='future').reduce((s,[,v])=>s+v,0);
  if (totalK===0) { showToast('No tienes llaves para días pasados 😔 (La Llave Futuro ⏩ solo sirve para días adelantados)','error'); return; }

  const lostDays = collectLostDays();
  if (!lostDays.length && !preselectedDk) {
    showToast('No tienes días perdidos que recuperar 🎉'); return;
  }

  // Excluir llave 'future' — solo sirve para días futuros, no pasados
  const pastKeys = getKeys();
  let selectedKey = Object.keys(pastKeys).find(k=>k!=='future'&&pastKeys[k]>0)||'normal';
  let selectedDay = preselectedDk||null;

  function render() {
    const ks=getKeys();
    const k2=Object.keys(KEY_TYPES).filter(k=>k!=='future'&&ks[k]>0); // excluir future
    const keyBtns=k2.map(k=>{
      const kd=KEY_TYPES[k];
      return `<button class="km-key-btn ${kd.cssClass} ${k===selectedKey?'selected':''}" data-ktype="${k}">
        ${kd.emoji} ${kd.name} <span style="font-family:var(--mono)">(${ks[k]})</span>
      </button>`;
    }).join('');

    const dayBtns=lostDays.map(ld=>{
      const r=getRewardsForMonth(ld.ym).find(x=>x.day===ld.day);
      const sel=ld.dk===selectedDay?'selected':'';
      return `<button class="km-day-btn ${sel}" data-dk="${ld.dk}" data-ym="${ld.ym}" data-day="${ld.day}">
        <span class="km-day-d">${ld.day}</span>
        <span style="font-size:.9rem">${r?r.icon:'🎁'}</span>
        <span class="km-day-lbl">${fmtDateShort(ld.dk)}</span>
      </button>`;
    }).join('');

    $('#kmContent').innerHTML = `
      <div class="km-head">
        <div class="km-title">🗝️ Recuperar Día Perdido</div>
        <div class="km-sub">Elige una llave y el día a recuperar</div>
      </div>
      <div class="km-body">
        <div class="km-sel-label">Selecciona una llave</div>
        <div class="km-key-selector">${keyBtns}</div>
        <div class="km-days-label">Días perdidos (${lostDays.length})</div>
        <div class="km-days-grid">${dayBtns}</div>
        <div class="km-actions">
          <button class="km-confirm" id="kmConfirm" ${!selectedDay?'disabled':''}>🗝️ Recuperar Día</button>
          <button class="km-cancel" id="kmCancel">Cancelar</button>
        </div>
      </div>
    `;

    $$('.km-key-btn').forEach(b=>{
      b.addEventListener('click',()=>{
        selectedKey=b.dataset.ktype;
        $$('.km-key-btn').forEach(x=>x.classList.remove('selected'));
        b.classList.add('selected');
      });
    });
    $$('.km-day-btn').forEach(b=>{
      b.addEventListener('click',()=>{
        selectedDay=b.dataset.dk;
        $$('.km-day-btn').forEach(x=>x.classList.remove('selected'));
        b.classList.add('selected');
        const conf=$('#kmConfirm'); if(conf) conf.disabled=false;
      });
    });

    if (preselectedDk) {
      const preBtn=$(`.km-day-btn[data-dk="${preselectedDk}"]`);
      if (preBtn) { preBtn.classList.add('selected'); selectedDay=preselectedDk; const c=$('#kmConfirm'); if(c) c.disabled=false; }
    }

    $('#kmConfirm')?.addEventListener('click',()=>doUseKey(selectedKey,selectedDay));
    $('#kmCancel')?.addEventListener('click',()=>closeModal('keyModal'));
  }

  render();
  openModal('keyModal');
}

function collectLostDays() {
  const lost=[];
  for (let offset=0; offset<=3; offset++) {
    const d=new Date(TODAY.getFullYear(),TODAY.getMonth()-offset,1);
    const ym=ymKey(d);
    const st=loadMonth(ym);
    st.lost.forEach(dk=>{ if(!st.claimed[dk]) lost.push({ dk, ym, day:parseInt(dk.slice(-2)) }); });
  }
  return lost.sort((a,b)=>b.dk.localeCompare(a.dk));
}

function doUseKey(keyType, dk) {
  if (!dk) { showToast('Selecciona un día primero','error'); return; }
  const keys=getKeys();
  if (!keys[keyType]||keys[keyType]<=0) { showToast('No tienes ese tipo de llave','error'); return; }
  keys[keyType]--;
  setKeys(keys);

  const dayNum=parseInt(dk.slice(-2));
  const ym=dk.substring(0,7);
  const st=loadMonth(ym);
  const reward=getRewardsForMonth(ym).find(r=>r.day===dayNum);

  st.lost=st.lost.filter(x=>x!==dk);
  st.claimed[dk]={ day:dayNum, reward, time:new Date().toISOString(), usedKey:true, usedFutureKey:false, keyTypeUsed:keyType };
  saveMonth(ym,st);

  const xpGain=reward?.xp||XP_PER_CLAIM;
  const earnedFromBar=addXP(xpGain);

  // Llaves directas del día recuperado
  let directKeys=null;
  if (reward?.keyReward) {
    addKeysDirectly(reward.keyReward.type, reward.keyReward.amount, 'day-reward');
    directKeys=reward.keyReward;
  }

  closeModal('keyModal');
  buildCalendar();

  const kd=KEY_TYPES[keyType];
  let msg=`🗝️ ¡Día ${dayNum} recuperado con ${kd.emoji}! +${xpGain} XP`;
  if (directKeys) msg+=` · ${KEY_TYPES[directKeys.type].emoji} ×${directKeys.amount} ganada`;
  if (earnedFromBar.length) msg+=` · ¡Barra llena!`;
  showToast(msg,'key');
}

/* ══════════════════════════════════════════════
   📦  MODAL INVENTARIO
   ══════════════════════════════════════════════ */
function openInventoryModal() {
  const modal=$('#inventoryModal'); if(!modal) return;
  const keys=getKeys();
  const hist=getKeyHistory().slice(0,10);
  const chestHist=getChestHistory().slice(0,5);
  const totalK=getTotalKeys();
  const lostCount=collectLostDays().length;
  const futureClaimed=countFutureClaimed();
  const futurePeriodData=getActiveFuturePeriod();

  const slots=Object.entries(KEY_TYPES).map(([k,kd])=>{
    const cnt=keys[k]||0;
    return `<div class="key-slot ${kd.cssClass}">
      <div class="key-slot-ico">${kd.emoji}</div>
      <div class="key-slot-name">${kd.name}</div>
      <div class="key-slot-count" style="color:${cnt>0?'inherit':'var(--dim)'}">${cnt}</div>
      <div class="key-slot-qty">${kd.desc}</div>
    </div>`;
  }).join('');

  const histRows=hist.length?hist.map(h=>{
    const kd=KEY_TYPES[h.keyType];
    const srcIcon = h.count<0?'⏩ fut':h.source==='day-reward'?'📅 día':h.source==='chest'?'🔐 cofre':'📊 barra';
    return `<div style="display:flex;align-items:center;gap:10px;padding:7px 10px;border-radius:8px;background:rgba(59,130,246,.04);border:1px solid rgba(59,130,246,.07);font-size:.78rem">
      <span>${kd.emoji}</span>
      <div style="flex:1">
        <span style="font-weight:600;color:var(--sap3)">${kd.name} ${h.count>0?'×'+h.count:'usada'}</span>
        <span style="font-size:.65rem;color:var(--muted);margin-left:6px">${srcIcon}</span>
      </div>
      <span style="font-size:.65rem;color:var(--muted)">${new Date(h.date).toLocaleDateString('es-PE')}</span>
    </div>`;
  }).join(''):`<div style="text-align:center;color:var(--muted);padding:14px;font-size:.82rem">¡Reclama días para ganar llaves!</div>`;

  $('#invContent').innerHTML = `
    <div class="inv-head">
      <div class="inv-title">🗝️ Inventario de Llaves</div>
      <div class="inv-sub">Total: ${totalK} llave${totalK!==1?'s':''} · Días perdidos: ${lostCount} · Días futuros usados: ${futureClaimed}/${MAX_FUTURE_DAYS}</div>
    </div>
    <div class="inv-body">
      <div class="inv-section">
        <div class="inv-section-title">Tus Llaves</div>
        <div class="key-slots">${slots}</div>
      </div>

      <div class="inv-use-keys">
        <div class="inv-use-hint">
          <strong>🗝️ Recuperar día perdido</strong>
          Usa una llave para reclamar un día pasado
        </div>
        <button class="inv-use-btn" id="invUsBtn" ${totalK===0||lostCount===0?'disabled':''}>
          ${totalK===0?'Sin llaves':lostCount===0?'Sin días perdidos':'🗝️ Recuperar día'}
        </button>
      </div>

      <div class="inv-use-keys" style="margin-top:8px;background:rgba(34,211,238,.04);border-color:rgba(34,211,238,.15)">
        <div class="inv-use-hint">
          <strong style="color:var(--cyn)">⏩ Período Llave Futuro (${FUTURE_PERIOD_DAYS} días)</strong>
          <span style="font-size:.72rem">
            Usos: ${futureClaimed}/${MAX_FUTURE_USES} · Este mes: ${futureUsesThisMonth()}/${MIN_FUTURE_PER_MONTH} mín.
            ${futureClaimed>0&&futurePeriodData.firstUseDate?`<br>Reseteará: ${new Date(new Date(futurePeriodData.firstUseDate).getTime()+FUTURE_PERIOD_DAYS*864e5).toLocaleDateString('es-PE',{day:'2-digit',month:'long',year:'numeric'})}`:''}</span>
        </div>
        <div style="text-align:right;min-width:60px">
          <span style="font-family:var(--mono);font-size:1.2rem;font-weight:900;color:${futureClaimed>=MAX_FUTURE_USES?'var(--red)':futureClaimed>=MAX_FUTURE_USES-1?'var(--amb)':'var(--cyn)'}">${futureClaimed}/${MAX_FUTURE_USES}</span>
          ${futureClaimed>=MAX_FUTURE_USES?`<div id="invFutureCd" style="font-family:var(--mono);font-size:.6rem;color:var(--red);margin-top:2px">${fmtCountdown(msUntilFutureReset())}</div>`:''}
        </div>
      </div>

      <div class="inv-section" style="margin-top:18px">
        <div class="inv-section-title">Historial de llaves</div>
        ${histRows}
      </div>

      <div class="inv-section" style="margin-top:18px">
        <div class="inv-section-title">Cómo ganar llaves</div>
        <div style="font-size:.78rem;color:var(--muted);line-height:1.8">
          📊 <strong style="color:var(--ind3)">Barra XP</strong> — llenarla al máximo (${XP_TO_KEY} XP) da llaves automáticamente<br>
          📅 <strong style="color:var(--sap3)">Recompensa de día</strong> — algunos días dan llaves directamente<br>
          🔐 <strong style="color:var(--amb)">Cofres</strong> — ábrelos con la llave específica · 13% de chance de ganar ⏩ Llave Futuro<br>
          ⏩ <strong style="color:var(--cyn)">Llave Futuro</strong> — exclusiva para reclamar hasta 6 días adelante · no recupera días pasados<br><br>
          <span style="color:var(--key-normal)">● Normal ×1</span> — meses regulares · también recupera días · abre cofres normales<br>
          <span style="color:var(--key-pink)">● Rosa ×2</span> — San Valentín, Madre, Padre<br>
          <span style="color:var(--key-green)">● Verde ×2</span> — Navidad, Año Nuevo<br>
          <span style="color:var(--key-orange)">● Naranja ×2</span> — Halloween, Black Friday<br>
          <span style="color:var(--key-cat)">● Gato ×3</span> — Día del Gato/Perro<br>
          <span style="color:var(--key-special)">● Especial ×2</span> — Tierra, Agua, Niño…<br>
          <span style="color:var(--cyn)">⏩ Llave Futuro</span> — reclamar días futuros · solo de cofres o recompensas de día
        </div>
      </div>
    </div>
  `;

  $('#invUsBtn')?.addEventListener('click',()=>{ closeModal('inventoryModal'); openKeyModal(); });
  openModal('inventoryModal');
}

/* ══════════════════════════════════════════════
   👁  MODAL PREVIEW
   ══════════════════════════════════════════════ */
function openPreviewModal() {
  const modal=$('#previewModal'); if(!modal) return;
  const next=new Date(viewDate.getFullYear(),viewDate.getMonth()+1,1);
  const ym=ymKey(next);
  const rewards=getRewardsForMonth(ym);
  const festivals=getMonthFestivals(next.getFullYear(),next.getMonth()+1);

  const cells=rewards.map(r=>{
    let extras='';
    if (r.keyReward) extras+=`<div style="font-size:.6rem;color:var(--sap3)">${KEY_TYPES[r.keyReward.type].emoji}×${r.keyReward.amount}</div>`;
    if (r.lockedChest) extras+=`<div style="font-size:.6rem;color:var(--amb)">🔐</div>`;
    return `<div class="pv-cell${r.special?' pv-special':''}">
      <div class="pv-d">Día ${r.day}</div>
      <div class="pv-ico">${r.icon}</div>
      <div class="pv-lbl">${r.label}</div>
      ${extras}
    </div>`;
  }).join('');

  const specials=rewards.filter(r=>r.special||r.lockedChest||r.keyReward);
  const hlItems=specials.map(r=>`
    <div class="pv-hl-item">
      <div class="pv-hl-ico">${r.icon}</div>
      <div>
        <div class="pv-hl-day">Día ${r.day}</div>
        <div class="pv-hl-lbl">${r.label}
          ${r.keyReward?` <span style="font-size:.65rem;color:var(--sap3)">+ ${KEY_TYPES[r.keyReward.type].emoji}×${r.keyReward.amount}</span>`:''}
          ${r.lockedChest?` <span style="font-size:.65rem;color:var(--amb)">🔐 cofre</span>`:''}
        </div>
      </div>
    </div>`).join('');

  $('#pvContent').innerHTML = `
    <div class="pv-head">
      <div class="pv-title">👁 ${next.toLocaleString('es-PE',{month:'long',year:'numeric'}).toUpperCase()}</div>
    </div>
    <div class="pv-body">
      ${festivals.length?`<div style="margin-bottom:12px;padding:10px;border-radius:8px;background:rgba(59,130,246,.07);border:1px solid rgba(59,130,246,.15);font-size:.8rem;color:var(--sap3)">
        🎊 ${festivals.map(f=>f.emoji+' '+f.name).join(' · ')}
      </div>`:''}
      <div class="pv-mini-grid">${cells}</div>
      ${specials.length?`<div class="pv-highlights"><div class="pv-hl-title">⭐ DESTACADOS</div><div class="pv-hl-list">${hlItems}</div></div>`:''}
    </div>
  `;
  openModal('previewModal');
}

/* ══════════════════════════════════════════════
   📜  MODAL HISTORIAL
   ══════════════════════════════════════════════ */
function openHistoryModal() {
  const modal=$('#historyModal'); if(!modal) return;
  const ym=ymKey(viewDate);
  const st=loadMonth(ym);
  const [y,m]=ym.split('-').map(Number);
  const total=daysInMonth(y,m);
  const claimed=Object.keys(st.claimed);
  const lostC=st.lost.filter(dk=>!st.claimed[dk]).length;
  const pct=Math.round((claimed.length/total)*100);
  const streak=getStreak();
  const xpTotal=claimed.reduce((s,dk)=>s+(st.claimed[dk]?.reward?.xp||XP_PER_CLAIM),0);
  const usedKeys=claimed.filter(dk=>st.claimed[dk]?.usedKey).length;
  const futureUsed=claimed.filter(dk=>st.claimed[dk]?.usedFutureKey).length;
  const chestsOpened=st.chestOpened?Object.keys(st.chestOpened).length:0;

  const statCards=[
    {ico:'🎁',v:claimed.length,l:'Reclamados'},
    {ico:'📊',v:pct+'%',l:'Progreso'},
    {ico:'🔥',v:streak.current,l:'Racha'},
    {ico:'❌',v:lostC,l:'Perdidos'},
    {ico:'⭐',v:xpTotal,l:'XP ganado'},
    {ico:'🗝️',v:usedKeys,l:'Llaves pasadas'},
    {ico:'⏩',v:futureUsed,l:'Reclamados futuro'},
    {ico:'🔐',v:chestsOpened,l:'Cofres abiertos'},
  ].map(s=>`<div class="hm-stat"><div class="hm-stat-ico">${s.ico}</div><div class="hm-stat-v">${s.v}</div><div class="hm-stat-l">${s.l}</div></div>`).join('');

  const rows=claimed.sort().reverse().map(dk=>{
    const e=st.claimed[dk]; const r=e.reward;
    const tags=[];
    if (e.usedKey) tags.push(`<span style="color:var(--cyn);font-size:.62rem">🗝️ llave pasada</span>`);
    if (e.usedFutureKey) tags.push(`<span style="color:var(--ind3);font-size:.62rem">⏩ anticipado</span>`);
    const chestOpen=st.chestOpened&&st.chestOpened[dk];
    if (chestOpen) tags.push(`<span style="color:var(--amb);font-size:.62rem">🔓 cofre</span>`);
    return `<div class="hm-item">
      <div class="hm-item-ico">${r?r.icon:'🎁'}</div>
      <div class="hm-item-info">
        <div class="hm-item-date">${fmtDate(dk)} ${tags.join(' ')}</div>
        <div class="hm-item-lbl">${r?r.label:'Recompensa'}</div>
      </div>
      <div class="hm-item-xp">+${r?.xp||XP_PER_CLAIM} XP</div>
    </div>`;
  }).join('');

  $('#hmContent').innerHTML = `
    <div class="hm-head">
      <div class="hm-title">📜 Historial</div>
      <div class="hm-sub">${viewDate.toLocaleString('es-PE',{month:'long',year:'numeric'})}</div>
    </div>
    <div class="hm-stats">${statCards}</div>
    <div class="hm-list">${rows||'<div class="hm-empty"><div class="hm-empty-ico">📭</div><div>Sin reclamaciones aún</div></div>'}</div>
  `;
  openModal('historyModal');
}

/* ══════════════════════════════════════════════
   🪟  MODALS
   ══════════════════════════════════════════════ */
function openModal(id)  { const m=$('#'+id); if(m){ m.classList.add('open'); document.body.style.overflow='hidden'; } }
function closeModal(id) { const m=$('#'+id); if(m){ m.classList.remove('open'); document.body.style.overflow=''; } }

document.addEventListener('click', e => {
  const bd = e.target;
  if (['mBd','kmBd','invBd','pvBd','hmBd'].includes(bd.id)) {
    $$('.modal.open').forEach(m=>{ m.classList.remove('open'); document.body.style.overflow=''; });
    clearInterval(_futureCountdownInterval);
  }
  if (e.target.closest('.m-close')) {
    const modal=e.target.closest('.modal');
    if (modal) { modal.classList.remove('open'); document.body.style.overflow=''; }
  }
});
document.addEventListener('keydown', e => {
  if (e.key==='Escape') {
    $$('.modal.open').forEach(m=>{ m.classList.remove('open'); document.body.style.overflow=''; });
    clearInterval(_futureCountdownInterval);
  }
});

/* ══════════════════════════════════════════════
   🖼️  NAVBAR + CANVAS + REVEAL
   ══════════════════════════════════════════════ */
function setupNav() {
  const toggle=$('#navToggle'), links=$('#navLinks');
  toggle?.addEventListener('click',e=>{ e.stopPropagation(); links?.classList.toggle('open'); });
  document.addEventListener('click',e=>{ if(!toggle?.contains(e.target)&&!links?.contains(e.target)) links?.classList.remove('open'); });
  $$('.hud-bar').forEach(b=>b.style.setProperty('--v',b.dataset.val||50));
}

function setupCanvas() {
  const cv=$('#bgCanvas'); if(!cv) return;
  const ctx=cv.getContext('2d');
  const dpr=Math.max(1,devicePixelRatio||1);
  let w,h,pts;
  const init=()=>{
    w=cv.width=innerWidth*dpr; h=cv.height=innerHeight*dpr;
    pts=Array.from({length:50},()=>({
      x:Math.random()*w, y:Math.random()*h,
      r:(.2+Math.random()*.9)*dpr, s:.07+Math.random()*.3, a:.02+Math.random()*.07,
      hue: 210+Math.random()*50,
    }));
  };
  const draw=()=>{
    ctx.clearRect(0,0,w,h);
    pts.forEach(p=>{
      p.y-=p.s; p.x+=Math.sin(p.y*.002)*.25;
      if(p.y<-5){ p.y=h+5; p.x=Math.random()*w; }
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`hsla(${p.hue},75%,65%,${p.a})`; ctx.fill();
    });
    requestAnimationFrame(draw);
  };
  init(); draw(); addEventListener('resize',init);
}

function setupReveal() {
  const obs=new IntersectionObserver(en=>en.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); obs.unobserve(e.target); } }),{threshold:.06});
  $$('.reveal').forEach(el=>obs.observe(el));
}

/* ══════════════════════════════════════════════
   🚀  BOOT
   ══════════════════════════════════════════════ */
function boot() {
  setupNav(); setupCanvas(); setupReveal();

  const tl=$('#todayLabel');
  if(tl) tl.textContent=TODAY.toLocaleDateString('es-PE',{weekday:'long',year:'numeric',month:'long',day:'numeric'});

  const yr=$('#yr'); if(yr) yr.textContent=new Date().getFullYear();

  markLostDays(ymKey(viewDate));
  buildCalendar();

  $('#prevMonth')?.addEventListener('click',()=>{
    viewDate=new Date(viewDate.getFullYear(),viewDate.getMonth()-1,1);
    markLostDays(ymKey(viewDate)); buildCalendar();
  });
  $('#nextMonth')?.addEventListener('click',()=>{
    viewDate=new Date(viewDate.getFullYear(),viewDate.getMonth()+1,1);
    markLostDays(ymKey(viewDate)); buildCalendar();
  });

  $('#btnPreview')?.addEventListener('click',openPreviewModal);
  $('#btnHistory')?.addEventListener('click',openHistoryModal);
  $('#btnInventory')?.addEventListener('click',openInventoryModal);
  $('#keyInventoryBtn')?.addEventListener('click',openInventoryModal);

  console.log(`🌙 Moonveil Calendario v2 — XP_TO_KEY:${XP_TO_KEY} | MAX_FUTURE_DAYS:${MAX_FUTURE_DAYS} | MAX_FUTURE_USES:${MAX_FUTURE_USES} | PERIOD:${FUTURE_PERIOD_DAYS}d`);
}

document.addEventListener('DOMContentLoaded', boot);

window.MvCalendar = {
  FESTIVAL_PERIODS, KEY_TYPES, MONTH_REWARDS,
  XP_TO_KEY, XP_PER_CLAIM, MAX_FUTURE_DAYS, MAX_FUTURE_USES, FUTURE_PERIOD_DAYS, MIN_FUTURE_PER_MONTH,
  addXP, addKeysDirectly, getKeys, setKeys, getGlobalXP, setGlobalXP,
  getFuturePeriod, getActiveFuturePeriod, recordFutureUse, msUntilFutureReset, fmtCountdown,
  buildCalendar, openInventoryModal, openKeyModal,
};