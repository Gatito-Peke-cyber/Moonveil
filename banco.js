'use strict';
/**
 * banco.js — Moonveil Portal Banco v1.0 (pixel art)
 * · Tema azul marino / dorado bancario
 * · Chanchitos pixel SVG con destellos
 * · Acumulación automática, ganancias offline
 * · Firebase Firestore sync entre dispositivos
 */

import { db }          from './firebase.js';
import { onAuthChange } from './auth.js';
import {
  doc, getDoc, updateDoc, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

/* ══ HELPERS ══ */
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

/* ══ CONFIGURACIÓN DE MONEDAS ══
   status: 'active' | 'maintenance' | 'event'
   rate: segundos entre +1
   max: máximo en bóveda (999999 = ilimitado)
═══════════════════════════════════════════ */
function daysFromNow(d) {
  return new Date(Date.now() + d * 86400000);
}

const CURRENCIES = {
  esmeralda: {
    name:'Esmeraldas', icon:'💎', rate:7200, max:50, status:'active',
    cardClass:'card-emerald', accent:'#10b981',
    btnC1:'#059669', btnC2:'#047857',
    sparkles:['✦','✧','✦'],
  },
  cobre: {
    name:'Lingotes de Cobre', icon:'🟫', rate:3600, max:50, status:'active',
    cardClass:'card-copper', accent:'#b45309',
    btnC1:'#b45309', btnC2:'#92400e',
    sparkles:[],
  },
  oro: {
    name:'Pepitas de Oro', icon:'⭐', rate:10800, max:50, status:'active',
    cardClass:'card-oro', accent:'#d4aa4e',
    btnC1:'#d4aa4e', btnC2:'#b8902a',
    sparkles:['✦','⭐','✧'],
    isGold: true,
  },
  hierro: {
    name:'Pepitas de Hierro', icon:'⚙️', rate:5400, max:50, status:'active',
    cardClass:'card-hierro', accent:'#64748b',
    btnC1:'#4b5563', btnC2:'#374151',
    sparkles:[],
  },
  inframundo: {
    name:'Lingotes de Inframundo', icon:'🔥', rate:14400, max:50, status:'active',
    cardClass:'card-inframundo', accent:'#ef4444',
    btnC1:'#ef4444', btnC2:'#991b1b',
    sparkles:[], flames:true,
  },
  ladrillo: {
    name:'Ladrillos', icon:'🧱', rate:2700, max:50, status:'active',
    cardClass:'card-ladrillo', accent:'#dc2626',
    btnC1:'#b91c1c', btnC2:'#7f1d1d',
    sparkles:[],
  },
  rapida: {
    name:'Pepitas Rápidas', icon:'⚡', rate:10, max:999999, status:'active',
    cardClass:'card-rapida', accent:'#8b5cf6',
    btnC1:'#7c3aed', btnC2:'#4c1d95',
    sparkles:[], lightning:true,
  },
  diamante: {
    name:'Diamantes Especiales', icon:'💠', rate:18000, max:50, status:'event',
    cardClass:'card-diamante', accent:'#38bdf8',
    btnC1:'#38bdf8', btnC2:'#0284c7',
    sparkles:['💠','✦','⬦'],
    eventStart: new Date('2026-02-20T00:00:00'),
    eventEnd:   new Date('2026-02-24T23:59:59'),
  },
  netherita: {
    name:'Netherita', icon:'🌑', rate:21600, max:50, status:'maintenance',
    cardClass:'card-netherita', accent:'#4b5563',
    btnC1:'#374151', btnC2:'#1f2937',
    sparkles:[],
    returnDate: daysFromNow(2),
  },
};

const SAVE_KEY = 'moonveilBank_v4';

/* ══ ESTADO ══ */
let bankState = {
  currencies: {},
  log: [],
  firstVisit: Date.now(),
  lastVisit: Date.now(),
  totalEver: 0,
};

/* ══ FIREBASE ══ */
let currentUID = null, syncTO = null;
function scheduleSync() {
  if (!currentUID) return;
  clearTimeout(syncTO);
  syncTO = setTimeout(doSync, 3000);
}
async function doSync() {
  if (!currentUID) return;
  try {
    await updateDoc(doc(db, 'users', currentUID), {
      bank_state: {
        currencies: bankState.currencies,
        totalEver: bankState.totalEver,
        firstVisit: bankState.firstVisit,
        lastVisit: Date.now(),
      },
      updatedAt: serverTimestamp(),
    });
  } catch (e) { console.warn('[Banco] sync:', e); }
}
async function loadFromFirebase(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return;
    const d = snap.data();
    if (d.bank_state) {
      const bs = d.bank_state;
      if (bs.currencies) {
        Object.keys(bs.currencies).forEach(k => {
          if (bankState.currencies[k]) {
            const remote = bs.currencies[k];
            const local  = bankState.currencies[k];
            // Tomar el mayor total y vault acumulado
            bankState.currencies[k].total = Math.max(local.total || 0, remote.total || 0);
            bankState.currencies[k].vault = Math.min(
              CURRENCIES[k]?.max ?? 50,
              Math.max(local.vault || 0, remote.vault || 0)
            );
          }
        });
      }
      if (bs.totalEver > bankState.totalEver) bankState.totalEver = bs.totalEver;
      if (bs.firstVisit && bs.firstVisit < bankState.firstVisit) bankState.firstVisit = bs.firstVisit;
    }
    console.log('[Banco] Firebase cargado');
  } catch (e) { console.warn('[Banco] load:', e); }
}

/* ══ PERSISTENCIA LOCAL ══ */
function loadData() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (saved.currencies) {
      Object.keys(saved.currencies).forEach(k => {
        if (bankState.currencies[k]) Object.assign(bankState.currencies[k], saved.currencies[k]);
      });
    }
    if (saved.firstVisit) bankState.firstVisit = saved.firstVisit;
    if (saved.lastVisit)  bankState.lastVisit  = saved.lastVisit;
    if (saved.totalEver)  bankState.totalEver  = saved.totalEver;
    if (saved.log)        bankState.log        = saved.log.slice(0, 120);
  } catch (e) { console.warn('[Banco] loadData:', e); }
}
function saveData() {
  try {
    bankState.lastVisit = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...bankState, lastSave: Date.now() }));
  } catch (e) { console.warn('[Banco] saveData:', e); }
}

/* ══ INIT STATE ══ */
function initState() {
  Object.keys(CURRENCIES).forEach(k => {
    if (!bankState.currencies[k]) {
      bankState.currencies[k] = {
        total: 0,
        vault: 0,
        lastUpdate: Date.now(),
        nextUpdate: Date.now() + CURRENCIES[k].rate * 1000,
      };
    }
  });
}

/* ══ GANANCIAS OFFLINE ══ */
function calcOfflineGains() {
  const diff = Date.now() - bankState.lastVisit;
  if (diff < 2000) return;
  let gained = 0;
  Object.keys(CURRENCIES).forEach(k => {
    const cfg = CURRENCIES[k];
    if (!isRunning(k)) return;
    const st = bankState.currencies[k];
    const rateMs = cfg.rate * 1000;
    const n = Math.floor(diff / rateMs);
    if (n > 0) {
      const space = cfg.max - st.vault;
      const add = Math.min(n, space);
      if (add > 0) {
        st.vault += add;
        gained += add;
        st.nextUpdate = Date.now() + (diff % rateMs === 0 ? rateMs : rateMs - (diff % rateMs));
      }
    }
  });
  if (gained > 0) {
    toast(`⏰ Mientras estabas fuera: +${gained} monedas`, 'info');
    addLog(`Ganancias offline: +${gained} monedas`, 'offline');
  }
  bankState.lastVisit = Date.now();
}

/* ══ EVENTOS ══ */
function isEventActive(k) {
  const cfg = CURRENCIES[k];
  if (cfg.status !== 'event') return false;
  const n = new Date();
  return n >= cfg.eventStart && n <= cfg.eventEnd;
}
function isRunning(k) {
  const cfg = CURRENCIES[k];
  if (cfg.status === 'maintenance') return false;
  if (cfg.status === 'event') return isEventActive(k);
  return true;
}

/* ══ CHANCHITO SVG PIXEL ART ══ */
const PIGGY_COLORS = {
  esmeralda: { body:'#4ade80', shade:'#166534', fill:'#22c55e', nose:'#bbf7d0', eye:'#14532d' },
  cobre:     { body:'#fb923c', shade:'#7c2d12', fill:'#f97316', nose:'#fed7aa', eye:'#431407' },
  oro:       { body:'#fde047', shade:'#713f12', fill:'#facc15', nose:'#fef9c3', eye:'#3f2a00' },
  hierro:    { body:'#94a3b8', shade:'#1e293b', fill:'#64748b', nose:'#e2e8f0', eye:'#0f172a' },
  inframundo:{ body:'#f87171', shade:'#450a0a', fill:'#ef4444', nose:'#fecaca', eye:'#300' },
  ladrillo:  { body:'#f87171', shade:'#7f1d1d', fill:'#dc2626', nose:'#fecaca', eye:'#3f0000' },
  rapida:    { body:'#c084fc', shade:'#2e1065', fill:'#a855f7', nose:'#ede9fe', eye:'#1a0040' },
  diamante:  { body:'#7dd3fc', shade:'#0c4a6e', fill:'#38bdf8', nose:'#e0f2fe', eye:'#082f49' },
  netherita: { body:'#4b5563', shade:'#111827', fill:'#374151', nose:'#9ca3af', eye:'#111827' },
};

function buildPiggySVG(k) {
  const c = PIGGY_COLORS[k] || PIGGY_COLORS['esmeralda'];
  return `<svg class="piggy-svg" id="svg-${k}" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" style="image-rendering:pixelated">
    <defs><clipPath id="cp-${k}"><ellipse cx="80" cy="90" rx="60" ry="55"/></clipPath></defs>
    <!-- Rabo -->
    <path d="M136,72 Q148,64 144,80 Q140,96 148,88" stroke="${c.shade}" stroke-width="4.5" fill="none" stroke-linecap="round"/>
    <!-- Sombras patas traseras -->
    <ellipse cx="52" cy="147" rx="17" ry="10" fill="${c.shade}" opacity=".7"/>
    <ellipse cx="108" cy="147" rx="17" ry="10" fill="${c.shade}" opacity=".7"/>
    <!-- Patas traseras pixeladas -->
    <circle cx="42" cy="151" r="4" fill="${c.shade}" opacity=".7"/>
    <circle cx="52" cy="153" r="4" fill="${c.shade}" opacity=".7"/>
    <circle cx="62" cy="151" r="4" fill="${c.shade}" opacity=".7"/>
    <circle cx="98" cy="151" r="4" fill="${c.shade}" opacity=".7"/>
    <circle cx="108" cy="153" r="4" fill="${c.shade}" opacity=".7"/>
    <circle cx="118" cy="151" r="4" fill="${c.shade}" opacity=".7"/>
    <!-- Cuerpo -->
    <ellipse cx="80" cy="90" rx="60" ry="55" fill="${c.shade}"/>
    <ellipse cx="80" cy="88" rx="58" ry="53" fill="${c.body}"/>
    <!-- Llenado (animado desde JS) -->
    <rect id="fill-${k}" x="22" y="160" width="116" height="0" fill="${c.fill}" opacity=".5" clip-path="url(#cp-${k})"/>
    <!-- Brillo -->
    <ellipse cx="65" cy="58" rx="22" ry="14" fill="rgba(255,255,255,.18)" transform="rotate(-20,65,58)"/>
    <!-- Orejas -->
    <ellipse cx="36" cy="55" rx="14" ry="18" fill="${c.body}" transform="rotate(-25,36,55)"/>
    <ellipse cx="36" cy="55" rx="8"  ry="12" fill="${c.shade}" opacity=".3" transform="rotate(-25,36,55)"/>
    <ellipse cx="124" cy="55" rx="14" ry="18" fill="${c.body}" transform="rotate(25,124,55)"/>
    <ellipse cx="124" cy="55" rx="8"  ry="12" fill="${c.shade}" opacity=".3" transform="rotate(25,124,55)"/>
    <!-- Ojos -->
    <ellipse cx="63" cy="78" rx="9" ry="9" fill="${c.eye}"/>
    <ellipse cx="97" cy="78" rx="9" ry="9" fill="${c.eye}"/>
    <circle cx="60" cy="74" r="3" fill="rgba(255,255,255,.8)"/>
    <circle cx="94" cy="74" r="3" fill="rgba(255,255,255,.8)"/>
    <circle cx="63" cy="78" r="5" fill="rgba(0,0,0,.75)"/>
    <circle cx="97" cy="78" r="5" fill="rgba(0,0,0,.75)"/>
    <!-- Hocico -->
    <ellipse cx="80" cy="98" rx="20" ry="13" fill="${c.nose}"/>
    <circle cx="73" cy="98" r="5" fill="${c.shade}" opacity=".35"/>
    <circle cx="87" cy="98" r="5" fill="${c.shade}" opacity=".35"/>
    <!-- Ranura de moneda -->
    <rect x="63" y="38" width="34" height="6" rx="2" fill="rgba(0,0,0,.5)"/>
    <rect x="64" y="39" width="32" height="4" rx="1" fill="rgba(0,0,0,.7)"/>
    <!-- Mejillas -->
    <ellipse cx="50" cy="92" rx="11" ry="7" fill="rgba(255,150,150,.22)"/>
    <ellipse cx="110" cy="92" rx="11" ry="7" fill="rgba(255,150,150,.22)"/>
    <!-- Patas delanteras -->
    <ellipse cx="46" cy="132" rx="14" ry="10" fill="${c.body}"/>
    <ellipse cx="114" cy="132" rx="14" ry="10" fill="${c.body}"/>
    <!-- Dedos patas delanteras -->
    <circle cx="37" cy="135" r="4" fill="${c.shade}" opacity=".6"/>
    <circle cx="46" cy="138" r="4" fill="${c.shade}" opacity=".6"/>
    <circle cx="55" cy="135" r="4" fill="${c.shade}" opacity=".6"/>
    <circle cx="105" cy="135" r="4" fill="${c.shade}" opacity=".6"/>
    <circle cx="114" cy="138" r="4" fill="${c.shade}" opacity=".6"/>
    <circle cx="123" cy="135" r="4" fill="${c.shade}" opacity=".6"/>
  </svg>`;
}

function buildPiggyHTML(k, cfg) {
  const extras = cfg.sparkles && cfg.sparkles.length
    ? cfg.sparkles.slice(0,3).map(s => `<span class="piggy-sparkle">${s}</span>`).join('')
    : '';
  const lightning = cfg.lightning ? `<span class="piggy-lightning">⚡</span>` : '';
  const flames    = cfg.flames
    ? `<span class="piggy-flame">🔥</span><span class="piggy-flame">🔥</span>`
    : '';
  const disabled = cfg.status === 'maintenance' ? 'disabled' : '';

  return `<div class="piggy-wrap ${disabled}" id="piggy-${k}" title="Clic para animar">
    ${buildPiggySVG(k)}
    <div class="piggy-amount-badge" id="piggy-badge-${k}">0</div>
    ${extras}${lightning}${flames}
  </div>`;
}

/* ══ CONSTRUIR TARJETA ══ */
function buildCard(k, idx) {
  const cfg = CURRENCIES[k];
  const rateStr = cfg.rate >= 3600
    ? `+1 cada ${cfg.rate/3600}h`
    : cfg.rate >= 60
    ? `+1 cada ${cfg.rate/60}min`
    : `+1 cada ${cfg.rate}s`;

  const tag = cfg.status === 'event'
    ? `<div class="card-tag tag-event">🎉 EVENTO</div>`
    : cfg.status === 'maintenance'
    ? `<div class="card-tag tag-maint">⚠️ MANT.</div>`
    : '';

  const overlay = cfg.status === 'event'
    ? `<div class="card-overlay" id="overlay-${k}">
        <div class="overlay-inner">
          <div class="overlay-ico" id="ov-ico-${k}">🎪</div>
          <div class="overlay-title" id="ov-title-${k}">Cargando…</div>
          <div class="overlay-msg" id="ov-msg-${k}"></div>
          <div class="overlay-cd" id="ov-cd-${k}"></div>
        </div>
       </div>`
    : cfg.status === 'maintenance'
    ? `<div class="card-overlay" id="overlay-${k}">
        <div class="overlay-inner">
          <div class="overlay-ico">🔧</div>
          <div class="overlay-title">EN MANTENIMIENTO</div>
          <div class="overlay-msg">Esta bóveda está siendo reparada</div>
          <div class="overlay-eta" id="eta-${k}">Calculando…</div>
        </div>
       </div>`
    : '';

  const maxLabel = cfg.max > 10000 ? '∞' : cfg.max;

  return `
  <div class="currency-card ${cfg.cardClass}" id="card-${k}" style="animation-delay:${idx*0.06}s">
    <div class="card-accent-band"></div>
    ${tag}
    <div class="card-top">
      <div class="currency-icon ${cfg.status==='maintenance'?'disabled':''}">${cfg.icon}</div>
      <div class="currency-meta">
        <div class="currency-name">${cfg.name}</div>
        <div class="currency-rate">${rateStr}</div>
        ${cfg.status==='event'?`<div class="currency-event-date">📅 ${fmtDate(cfg.eventStart)} → ${fmtDate(cfg.eventEnd)}</div>`:''}
        ${cfg.status==='maintenance'?`<div class="currency-maint-msg">🔧 En reparación</div>`:''}
      </div>
      <div class="vault-badge" id="vault-badge-${k}">0</div>
    </div>

    <div class="piggy-container" style="position:relative">
      ${overlay}
      ${buildPiggyHTML(k, cfg)}
    </div>

    <div class="vault-progress-wrap">
      <div class="vault-progress-label">
        <span>BÓVEDA</span>
        <span id="vault-label-${k}">0/${maxLabel}</span>
      </div>
      <div class="vault-progress-bg">
        <div class="vault-progress-bar" id="vault-bar-${k}" style="width:0%"></div>
      </div>
    </div>

    <div class="card-stats">
      <div class="cstat">
        <div class="cstat-label">GUARDADO</div>
        <div class="cstat-value highlight" id="stat-total-${k}">0</div>
      </div>
      <div class="cstat">
        <div class="cstat-label">BÓVEDA</div>
        <div class="cstat-value" id="stat-vault-${k}">0</div>
      </div>
      <div class="cstat">
        <div class="cstat-label">PRÓXIMA</div>
        <div class="cstat-value" id="stat-next-${k}">—</div>
      </div>
    </div>

    <button class="btn-collect"
            id="btn-${k}"
            data-currency="${k}"
            style="--btn-c1:${cfg.btnC1};--btn-c2:${cfg.btnC2}"
            ${cfg.status==='maintenance'?'disabled':''}>
      ${cfg.icon} RECOLECTAR ${cfg.name.toUpperCase()}
    </button>
  </div>`;
}

function fmtDate(d) {
  return d.toLocaleDateString('es', { day:'numeric', month:'short' });
}

/* ══ BUILD GRID ══ */
let cardOrder = null;
function buildGrid() {
  const grid = $('#currencyGrid');
  if (!grid) return;
  const keys = cardOrder || Object.keys(CURRENCIES);
  grid.innerHTML = keys.map((k, i) => buildCard(k, i)).join('');

  // Bind botones
  grid.querySelectorAll('.btn-collect').forEach(btn => {
    btn.addEventListener('click', () => collectCurrency(btn.dataset.currency));
  });

  // Piggy click
  grid.querySelectorAll('.piggy-wrap').forEach(el => {
    el.addEventListener('click', () => {
      el.style.animation = 'none';
      requestAnimationFrame(() => {
        el.style.animation = '';
        const svg = el.querySelector('.piggy-svg');
        if (svg) svg.style.animation = 'piggyWiggle 0.5s ease';
        setTimeout(() => { if (svg) svg.style.animation = ''; }, 500);
      });
    });
  });

  // Render visual inicial con datos cargados
  Object.keys(CURRENCIES).forEach(k => {
    updateFill(k);
    updateBadge(k);
    updateCardStats(k);
    if (CURRENCIES[k].status === 'event')       setupEventOverlay(k);
    if (CURRENCIES[k].status === 'maintenance') setupMaintOverlay(k);
  });
}

/* ══ MAIN LOOP (cada 1s) ══ */
let lastAutoSave = Date.now();
function startLoop() {
  setInterval(() => {
    const now = Date.now();
    Object.keys(CURRENCIES).forEach(k => tick(k, now));
    updateGlobalStats();
    updateCollectAllBtn();
    if (now - lastAutoSave > 30000) { saveData(); lastAutoSave = now; }
  }, 1000);

  setInterval(() => {
    Object.keys(CURRENCIES).forEach(k => {
      if (CURRENCIES[k].status === 'event') setupEventOverlay(k);
    });
  }, 60000);
}

function tick(k, now) {
  const cfg = CURRENCIES[k];
  const st  = bankState.currencies[k];
  if (!isRunning(k)) { updateNextDisplay(k, null); return; }
  if (now >= st.nextUpdate && st.vault < cfg.max) {
    st.vault++;
    st.lastUpdate = now;
    st.nextUpdate = now + cfg.rate * 1000;
    updateFill(k);
    updateBadge(k);
    updateCardStats(k);
    if (st.vault >= cfg.max) {
      toast(`📦 ¡Bóveda de ${cfg.name} llena!`, 'info');
    }
  }
  updateNextDisplay(k, st.nextUpdate - now);
}

/* ══ UI UPDATES ══ */
function updateFill(k) {
  const cfg = CURRENCIES[k];
  const st  = bankState.currencies[k];
  const pct = cfg.max > 10000 ? 0 : Math.min(100, (st.vault / cfg.max) * 100);

  // SVG fill
  const fillEl = document.getElementById(`fill-${k}`);
  if (fillEl) {
    const bodyH = 110;
    const fillH = (pct / 100) * bodyH;
    fillEl.setAttribute('y', String(145 - fillH));
    fillEl.setAttribute('height', String(fillH));
  }

  // Barra de progreso
  const bar = document.getElementById(`vault-bar-${k}`);
  if (bar) bar.style.width = pct + '%';

  const labelEl = document.getElementById(`vault-label-${k}`);
  if (labelEl) {
    const maxLabel = cfg.max > 10000 ? '∞' : cfg.max;
    labelEl.textContent = `${st.vault}/${maxLabel}`;
  }
}

function updateBadge(k) {
  const st = bankState.currencies[k];
  const vb = document.getElementById(`vault-badge-${k}`);
  const pb = document.getElementById(`piggy-badge-${k}`);
  if (vb) vb.textContent = st.vault;
  if (pb) pb.textContent = st.vault;
}

function updateCardStats(k) {
  const cfg = CURRENCIES[k];
  const st  = bankState.currencies[k];
  const te = document.getElementById(`stat-total-${k}`);
  const ve = document.getElementById(`stat-vault-${k}`);
  if (te) te.textContent = st.total;
  if (ve) ve.textContent = `${st.vault}/${cfg.max > 10000 ? '∞' : cfg.max}`;
}

function updateNextDisplay(k, msLeft) {
  const el = document.getElementById(`stat-next-${k}`);
  if (!el) return;
  if (msLeft == null) { el.textContent = '—'; return; }
  el.textContent = msLeft <= 0 ? '¡YA!' : formatTime(msLeft, CURRENCIES[k].rate < 60);
}

function updateGlobalStats() {
  let totalVault = 0, totalEver = 0, activeV = 0;
  Object.keys(CURRENCIES).forEach(k => {
    const st = bankState.currencies[k];
    totalVault += st.vault;
    totalEver  += st.total;
    if (isRunning(k)) activeV++;
  });
  bankState.totalEver = totalEver;

  setVal('#heroTotalVault',  totalVault);
  setVal('#heroTotalEver',   totalEver);
  setVal('#heroActiveVaults',activeV);
  setVal('#hudTotalVal',     totalVault);

  const ready = Object.keys(CURRENCIES).filter(k => isRunning(k) && bankState.currencies[k].vault > 0).length;
  setVal('#hudReadyVal', ready);

  const diff = Date.now() - bankState.firstVisit;
  const days = Math.floor(diff / 86400000);
  const hrs  = Math.floor((diff % 86400000) / 3600000);
  setVal('#heroUptime', `${days}d ${hrs}h`);
}

function updateCollectAllBtn() {
  const canAny = Object.keys(CURRENCIES).some(k => isRunning(k) && bankState.currencies[k].vault > 0);
  const btn = $('#collectAllBtn');
  if (btn) {
    btn.disabled = !canAny;
    if (canAny) btn.classList.add('pulse-blue');
    else btn.classList.remove('pulse-blue');
  }
}

function setVal(sel, val) {
  const el = $(sel); if (el) el.textContent = val;
}

/* ══ OVERLAY EVENTO ══ */
const _cdIvs = new Map();
function setupEventOverlay(k) {
  const cfg = CURRENCIES[k];
  const overlay = document.getElementById(`overlay-${k}`);
  const btn = document.getElementById(`btn-${k}`);
  if (!overlay || !btn) return;

  const active = isEventActive(k);
  overlay.style.display = active ? 'none' : 'flex';
  btn.disabled = !active;

  const now = new Date();
  const ico   = document.getElementById(`ov-ico-${k}`);
  const title = document.getElementById(`ov-title-${k}`);
  const msg   = document.getElementById(`ov-msg-${k}`);
  const cd    = document.getElementById(`ov-cd-${k}`);

  if (active) {
    startOverlayCd(k, cfg.eventEnd, '⏰ TERMINA EN: ');
  } else if (now < cfg.eventStart) {
    if (ico)   ico.textContent   = '⏳';
    if (title) title.textContent = 'PRÓXIMAMENTE';
    if (msg)   msg.textContent   = 'Evento comenzará pronto';
    startOverlayCd(k, cfg.eventStart, '⏳ EMPIEZA EN: ');
  } else {
    if (ico)   ico.textContent   = '✅';
    if (title) title.textContent = 'EVENTO FINALIZADO';
    if (msg)   msg.textContent   = '¡Gracias por participar!';
    if (cd)    cd.textContent    = '';
    btn.disabled = true;
  }
}

function startOverlayCd(k, target, prefix) {
  const el = document.getElementById(`ov-cd-${k}`);
  if (!el) return;
  if (_cdIvs.has(k)) clearInterval(_cdIvs.get(k));
  const fn = () => {
    const diff = target - new Date();
    if (diff <= 0) { el.textContent = prefix + '¡YA!'; clearInterval(_cdIvs.get(k)); setupEventOverlay(k); return; }
    const d = Math.floor(diff/86400000), h = Math.floor((diff%86400000)/3600000);
    const m = Math.floor((diff%3600000)/60000),  s = Math.floor((diff%60000)/1000);
    el.textContent = prefix + (d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`);
  };
  fn();
  _cdIvs.set(k, setInterval(fn, 1000));
}

/* ══ OVERLAY MANTENIMIENTO ══ */
function setupMaintOverlay(k) {
  const cfg = CURRENCIES[k];
  if (!cfg.returnDate) return;
  const el = document.getElementById(`eta-${k}`);
  if (!el) return;
  const diff = cfg.returnDate - new Date();
  if (diff <= 0) { el.textContent = 'Pronto'; return; }
  const d = Math.floor(diff/86400000), h = Math.floor((diff%86400000)/3600000);
  el.textContent = `Regreso: ${d}d ${h}h aprox.`;
}

/* ══ RECOLECCIÓN ══ */
function collectCurrency(k) {
  const cfg = CURRENCIES[k];
  const st  = bankState.currencies[k];
  if (cfg.status === 'maintenance') { toast('⚠️ En mantenimiento', 'error'); return; }
  if (!isRunning(k))                { toast('Evento no disponible', 'error'); return; }
  if (st.vault === 0)               { toast(`No hay ${cfg.name} para recolectar`, 'info'); return; }

  const amount = st.vault;
  st.total += amount;
  st.vault = 0;
  bankState.totalEver += amount;

  updateFill(k); updateBadge(k); updateCardStats(k); updateGlobalStats();
  animateCollect(k, amount, cfg.icon);
  addLog(`Recolectadas ${amount} ${cfg.name}`, 'collect');
  toast(`✅ +${amount} ${cfg.name} recolectadas`, 'success');
  saveData();
  scheduleSync();
}

function collectAll() {
  let total = 0;
  Object.keys(CURRENCIES).forEach(k => {
    const cfg = CURRENCIES[k];
    const st  = bankState.currencies[k];
    if (!isRunning(k) || st.vault === 0) return;
    total += st.vault;
    st.total += st.vault; st.vault = 0;
    updateFill(k); updateBadge(k); updateCardStats(k);
  });
  if (!total) { toast('No hay monedas para recolectar', 'info'); return; }
  bankState.totalEver += total;
  updateGlobalStats();
  addLog(`Recolección total: ${total} monedas`, 'collect');
  toast(`🎁 ¡+${total} monedas recolectadas!`, 'success');
  saveData();
  scheduleSync();
}

/* ══ ANIMACIÓN DE RECOLECCIÓN ══ */
function animateCollect(k, amount, icon) {
  const wrap = document.getElementById(`piggy-${k}`);
  if (!wrap) return;
  wrap.animate([
    { transform:'scale(1) rotate(0deg)' },
    { transform:'scale(1.15) rotate(-6deg)', offset:.3 },
    { transform:'scale(1.15) rotate(6deg)',  offset:.6 },
    { transform:'scale(1) rotate(0deg)' }
  ], { duration:500, easing:'cubic-bezier(.34,1.56,.64,1)' });

  const rect = wrap.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top  + rect.height / 2;
  for (let i = 0; i < Math.min(amount, 12); i++) {
    setTimeout(() => spawnCoin(cx, cy, icon), i * 55);
  }
}

function spawnCoin(x, y, icon) {
  const d = document.createElement('div');
  d.textContent = icon;
  Object.assign(d.style, {
    position:'fixed', left:x+'px', top:y+'px', fontSize:'1.6rem',
    pointerEvents:'none', zIndex:'9999', transform:'translate(-50%,-50%)',
    fontFamily:'serif',
  });
  document.body.appendChild(d);
  const ang  = Math.random() * Math.PI * 2;
  const dist = 60 + Math.random() * 50;
  d.animate([
    { transform:'translate(-50%,-50%) scale(1)', opacity:1 },
    { transform:`translate(calc(-50% + ${Math.cos(ang)*dist}px), calc(-50% + ${Math.sin(ang)*dist}px)) scale(.2)`, opacity:0 }
  ], { duration:800, easing:'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => d.remove();
}

/* ══ LOG ══ */
function addLog(msg, type = 'normal') {
  bankState.log.unshift({ t: Date.now(), msg, type });
  if (bankState.log.length > 120) bankState.log = bankState.log.slice(0, 120);
  renderLog();
}
function renderLog() {
  const el = $('#activityLog');
  if (!el) return;
  el.innerHTML = bankState.log.slice(0, 30).map(e => {
    const d = new Date(e.t);
    const time = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    return `<div class="log-entry ${e.type}">
      <span class="log-time">${time}</span>
      <span class="log-msg">${e.msg}</span>
    </div>`;
  }).join('') || '<div class="log-entry"><span class="log-msg" style="opacity:0.4">Sin actividad reciente</span></div>';
}

/* ══ SORT ══ */
function applySortListeners() {
  $$('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.sort-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const sortType = btn.dataset.sort;
      const keys = Object.keys(CURRENCIES);
      const sorted = [...keys].sort((a, b) => {
        const sa = bankState.currencies[a];
        const sb = bankState.currencies[b];
        switch (sortType) {
          case 'vault-desc':  return sb.vault - sa.vault;
          case 'total-desc':  return sb.total - sa.total;
          case 'rate-asc':    return CURRENCIES[a].rate - CURRENCIES[b].rate;
          default:            return keys.indexOf(a) - keys.indexOf(b);
        }
      });
      cardOrder = sorted;
      buildGrid();
    });
  });
}

/* ══ PARTICLES BACKGROUND ══ */
function initParticles() {
  const canvas = $('#bgCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = Math.max(1, devicePixelRatio || 1);
  let W, H, pts;
  const init = () => {
    W = canvas.width  = innerWidth  * dpr;
    H = canvas.height = innerHeight * dpr;
    pts = Array.from({ length: 60 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: (.4 + Math.random() * 1.5) * dpr,
      s: .1 + Math.random() * .4,
      a: .03 + Math.random() * .1,
      hue: Math.random() > .4 ? (210 + Math.random() * 30) : (42 + Math.random() * 12),
    }));
  };
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    pts.forEach(p => {
      p.y += p.s; p.x += Math.sin(p.y * .001) * .3;
      if (p.y > H) { p.y = -10; p.x = Math.random() * W; }
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue},70%,62%,${p.a})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  };
  init(); draw();
  addEventListener('resize', init);
}

/* ══ REVEAL ══ */
function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}
const _mutObs = new MutationObserver(() => {
  document.querySelectorAll('.reveal:not(.visible)').forEach(el => {
    if (!el._rev) {
      el._rev = true;
      const o = new IntersectionObserver(ents => {
        ents.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); o.unobserve(e.target); } });
      }, { threshold: 0.05 });
      o.observe(el);
    }
  });
});

/* ══ TOAST ══ */
function toast(msg, type = 'info') {
  const t = $('#toast'); if (!t) return;
  t.textContent = msg; t.className = `toast show ${type}`;
  clearTimeout(t._tm); t._tm = setTimeout(() => t.classList.remove('show'), 3000);
}

/* ══ FORMAT TIME ══ */
function formatTime(ms, isSeconds = false) {
  if (ms <= 0) return '¡YA!';
  if (isSeconds) return `${Math.ceil(ms / 1000)}s`;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/* ══ BOOT ══ */
function boot() {
  console.log('🏦 Moonveil Banco v1.0');
  initState();
  loadData();
  calcOfflineGains();
  initReveal();
  initParticles();
  buildGrid();
  startLoop();
  applySortListeners();
  updateGlobalStats();
  updateCollectAllBtn();
  renderLog();
  addLog('Sistema bancario iniciado', 'system');

  setTimeout(() => {
    _mutObs.observe(document.body, { childList: true, subtree: true });
    document.querySelectorAll('.reveal').forEach(el => {
      const o = new IntersectionObserver(ents => {
        ents.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); o.unobserve(e.target); } });
      }, { threshold: 0.05 });
      o.observe(el);
    });
  }, 100);

  // Botones
  $('#collectAllBtn')?.addEventListener('click', collectAll);
  $('#clearLogBtn')?.addEventListener('click', () => {
    bankState.log = [];
    renderLog();
    addLog('Registro limpiado', 'system');
  });

  // Hamburger
  const ham = $('#hamburger'), nav = $('#main-nav');
  ham?.addEventListener('click', () => nav?.classList.toggle('open'));

  // Guardar antes de cerrar
  window.addEventListener('beforeunload', () => { saveData(); });

  // Firebase auth
  onAuthChange(async user => {
    if (!user) return;
    currentUID = user.uid;
    await loadFromFirebase(user.uid);
    // Re-render con datos de Firebase
    Object.keys(CURRENCIES).forEach(k => {
      updateFill(k); updateBadge(k); updateCardStats(k);
    });
    updateGlobalStats();
    updateCollectAllBtn();
    console.log('✅ Banco Firebase OK:', user.uid);
    addLog('Cuenta sincronizada con Firebase', 'system');
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();