'use strict';
/**
 * banco.js — Moonveil Portal Banco del Reino v1.0
 * · Pixel art dorado, igual que tienda.js
 * · Chanchitos SVG con colores y animaciones
 * · Acumulación automática + offline gains
 * · Firebase sync (Firestore)
 * · Responsive y sin botón de música
 */

import { db }          from './firebase.js';
import { onAuthChange } from './auth.js';
import {
  doc, getDoc, updateDoc, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

/* ══ HELPERS ══ */
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const wait = ms => new Promise(r => setTimeout(r, ms));

function lsGet(k, fb = null) {
  try { const v = localStorage.getItem(k); return v != null ? JSON.parse(v) : fb; } catch { return fb; }
}
function lsSet(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
}

const SAVE_KEY = 'moonveilBank_v5';

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
    const state = loadState();
    await updateDoc(doc(db, 'users', currentUID), {
      bank_data: state,
      updatedAt: serverTimestamp(),
    });
  } catch (e) { console.warn('[Banco] sync error:', e); }
}
async function loadFromFirebase(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return;
    const d = snap.data();
    if (d.bank_data) {
      const remote = d.bank_data;
      const local  = loadState();
      // Merge: tomar el mayor total histórico por currency
      if (remote.currencies) {
        Object.keys(remote.currencies).forEach(k => {
          if (!local.currencies[k]) return;
          const rem = remote.currencies[k];
          const loc = local.currencies[k];
          if ((rem.total || 0) > (loc.total || 0)) {
            loc.total = rem.total;
          }
          // vault: tomar el mayor
          if ((rem.vault || 0) > (loc.vault || 0)) {
            loc.vault = rem.vault;
          }
        });
        if ((remote.totalEver || 0) > (local.totalEver || 0)) {
          local.totalEver = remote.totalEver;
        }
        if (remote.firstVisit && (!local.firstVisit || remote.firstVisit < local.firstVisit)) {
          local.firstVisit = remote.firstVisit;
        }
        saveState(local);
        console.log('[Banco] Firebase sync OK');
      }
    }
  } catch (e) { console.warn('[Banco] Firebase load error:', e); }
}

/* ══ CONFIG DE MONEDAS ══ */
function daysFromNow(d) {
  return new Date(Date.now() + d * 24 * 60 * 60 * 1000);
}

const CURRENCIES = {
  esmeralda: {
    name: 'Esmeraldas', icon: '💎', rate: 7200, max: 50,
    status: 'active',
    bodyColor: '#4ade80', shadeColor: '#166534', fillColor: '#22c55e', noseColor: '#bbf7d0', eyeColor: '#14532d',
    accent: '#10b981', btnBg: '#059669', btnBg2: '#047857', btnText: '#000',
    sparkles: ['✦', '✧', '✦'], gold: false,
  },
  cobre: {
    name: 'Lingotes de Cobre', icon: '🟫', rate: 3600, max: 50,
    status: 'active',
    bodyColor: '#fb923c', shadeColor: '#7c2d12', fillColor: '#f97316', noseColor: '#fed7aa', eyeColor: '#431407',
    accent: '#d97706', btnBg: '#b45309', btnBg2: '#92400e', btnText: '#fff',
    sparkles: [], gold: false,
  },
  oro: {
    name: 'Pepitas de Oro', icon: '⭐', rate: 10800, max: 50,
    status: 'active',
    bodyColor: '#fde047', shadeColor: '#713f12', fillColor: '#facc15', noseColor: '#fef9c3', eyeColor: '#3f2a00',
    accent: '#d4aa4e', btnBg: '#d4aa4e', btnBg2: '#b8902a', btnText: '#000',
    sparkles: ['✦', '⭐', '✧'], gold: true,
  },
  hierro: {
    name: 'Pepitas de Hierro', icon: '⚙️', rate: 5400, max: 50,
    status: 'active',
    bodyColor: '#94a3b8', shadeColor: '#1e293b', fillColor: '#64748b', noseColor: '#e2e8f0', eyeColor: '#0f172a',
    accent: '#6b7280', btnBg: '#4b5563', btnBg2: '#374151', btnText: '#fff',
    sparkles: [], gold: false,
  },
  inframundo: {
    name: 'Lingotes de Inframundo', icon: '🔥', rate: 14400, max: 50,
    status: 'active',
    bodyColor: '#f87171', shadeColor: '#450a0a', fillColor: '#ef4444', noseColor: '#fecaca', eyeColor: '#300000',
    accent: '#f87171', btnBg: '#ef4444', btnBg2: '#991b1b', btnText: '#fff',
    sparkles: [], flames: true, gold: false,
  },
  ladrillo: {
    name: 'Ladrillos', icon: '🧱', rate: 2700, max: 50,
    status: 'active',
    bodyColor: '#f87171', shadeColor: '#7f1d1d', fillColor: '#dc2626', noseColor: '#fecaca', eyeColor: '#3f0000',
    accent: '#ef4444', btnBg: '#b91c1c', btnBg2: '#7f1d1d', btnText: '#fff',
    sparkles: [], gold: false,
  },
  rapida: {
    name: 'Pepitas Rápidas', icon: '⚡', rate: 10, max: 999999,
    status: 'active',
    bodyColor: '#c084fc', shadeColor: '#2e1065', fillColor: '#a855f7', noseColor: '#ede9fe', eyeColor: '#1a0040',
    accent: '#8b5cf6', btnBg: '#7c3aed', btnBg2: '#4c1d95', btnText: '#fff',
    sparkles: [], lightning: true, gold: false, isRapid: true,
  },
  diamante: {
    name: 'Diamantes Especiales', icon: '💠', rate: 18000, max: 50,
    status: 'event',
    bodyColor: '#7dd3fc', shadeColor: '#0c4a6e', fillColor: '#38bdf8', noseColor: '#e0f2fe', eyeColor: '#082f49',
    accent: '#38bdf8', btnBg: '#38bdf8', btnBg2: '#0284c7', btnText: '#000',
    sparkles: ['💠', '✦', '⬦'], gold: false,
    eventStart: new Date('2026-02-20T00:00:00'),
    eventEnd:   new Date('2026-02-24T23:59:59'),
  },
  netherita: {
    name: 'Netherita', icon: '🌑', rate: 21600, max: 50,
    status: 'maintenance',
    bodyColor: '#4b5563', shadeColor: '#111827', fillColor: '#374151', noseColor: '#9ca3af', eyeColor: '#111827',
    accent: '#4b5563', btnBg: '#374151', btnBg2: '#1f2937', btnText: '#6b7280',
    sparkles: [], gold: false,
    returnDate: daysFromNow(2),
  },
};

/* ══ ESTADO ══ */
function defaultState() {
  const currencies = {};
  Object.keys(CURRENCIES).forEach(k => {
    currencies[k] = { total: 0, vault: 0, lastUpdate: Date.now(), nextUpdate: Date.now() + CURRENCIES[k].rate * 1000 };
  });
  return { currencies, log: [], firstVisit: Date.now(), lastVisit: Date.now(), totalEver: 0 };
}
function loadState() { return lsGet(SAVE_KEY, null) || defaultState(); }
function saveState(s) { lsSet(SAVE_KEY, s); }

let state = defaultState();

/* ══ LOGICA DE TIEMPO ══ */
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
function calcOfflineGains() {
  const diff = Date.now() - state.lastVisit;
  if (diff < 1000) return;
  let gained = 0;
  Object.keys(CURRENCIES).forEach(k => {
    if (!isRunning(k)) return;
    const cfg = CURRENCIES[k];
    const st  = state.currencies[k];
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
    toast(`⏰ +${gained} monedas mientras estabas fuera`, 'info');
    addLog(`Ganancias offline: +${gained} monedas`, 'auto');
  }
  state.lastVisit = Date.now();
}

/* ══ GENERADOR SVG DEL CHANCHITO ══ */
function buildPiggySVG(k, cfg) {
  const c = {
    body: cfg.bodyColor, shade: cfg.shadeColor,
    fill: cfg.fillColor, nose: cfg.noseColor, eye: cfg.eyeColor,
  };
  const id = `cp-${k}`;
  return `<svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" width="140" height="140" style="display:block;margin:0 auto">
    <defs>
      <clipPath id="${id}">
        <ellipse cx="80" cy="90" rx="60" ry="55"/>
      </clipPath>
    </defs>
    <!-- cola -->
    <path d="M136,72 Q148,64 144,80 Q140,96 148,88" stroke="${c.shade}" stroke-width="4.5" fill="none" stroke-linecap="round"/>
    <!-- sombra patas traseras -->
    <ellipse cx="52" cy="147" rx="17" ry="10" fill="${c.shade}" opacity=".7"/>
    <ellipse cx="108" cy="147" rx="17" ry="10" fill="${c.shade}" opacity=".7"/>
    <!-- patas -->
    <circle cx="42" cy="151" r="4" fill="${c.shade}" opacity=".7"/>
    <circle cx="52" cy="153" r="4" fill="${c.shade}" opacity=".7"/>
    <circle cx="62" cy="151" r="4" fill="${c.shade}" opacity=".7"/>
    <circle cx="98" cy="151" r="4" fill="${c.shade}" opacity=".7"/>
    <circle cx="108" cy="153" r="4" fill="${c.shade}" opacity=".7"/>
    <circle cx="118" cy="151" r="4" fill="${c.shade}" opacity=".7"/>
    <!-- cuerpo sombra -->
    <ellipse cx="80" cy="90" rx="60" ry="55" fill="${c.shade}"/>
    <!-- cuerpo -->
    <ellipse cx="80" cy="88" rx="58" ry="53" fill="${c.body}"/>
    <!-- llenado del chanchito -->
    <rect id="pigfill-${k}" x="22" y="160" width="116" height="0" fill="${c.fill}" opacity=".5" clip-path="url(#${id})"/>
    <!-- brillo -->
    <ellipse cx="65" cy="58" rx="22" ry="14" fill="rgba(255,255,255,.18)" transform="rotate(-20,65,58)"/>
    <!-- orejas -->
    <ellipse cx="36" cy="55" rx="14" ry="18" fill="${c.body}" transform="rotate(-25,36,55)"/>
    <ellipse cx="36" cy="55" rx="8"  ry="12" fill="${c.shade}" opacity=".3" transform="rotate(-25,36,55)"/>
    <ellipse cx="124" cy="55" rx="14" ry="18" fill="${c.body}" transform="rotate(25,124,55)"/>
    <ellipse cx="124" cy="55" rx="8"  ry="12" fill="${c.shade}" opacity=".3" transform="rotate(25,124,55)"/>
    <!-- ojos blancos -->
    <ellipse cx="63" cy="78" rx="9" ry="9" fill="${c.eye}"/>
    <ellipse cx="97" cy="78" rx="9" ry="9" fill="${c.eye}"/>
    <circle cx="60" cy="74" r="3" fill="rgba(255,255,255,.8)"/>
    <circle cx="94" cy="74" r="3" fill="rgba(255,255,255,.8)"/>
    <!-- pupilas -->
    <circle cx="63" cy="78" r="5" fill="rgba(0,0,0,.75)"/>
    <circle cx="97" cy="78" r="5" fill="rgba(0,0,0,.75)"/>
    <!-- hocico -->
    <ellipse cx="80" cy="98" rx="20" ry="13" fill="${c.nose}"/>
    <circle cx="73" cy="98" r="5" fill="${c.shade}" opacity=".35"/>
    <circle cx="87" cy="98" r="5" fill="${c.shade}" opacity=".35"/>
    <!-- ranura monedas -->
    <rect x="63" y="38" width="34" height="6" rx="3" fill="rgba(0,0,0,.35)"/>
    <!-- cachetes -->
    <ellipse cx="50" cy="92" rx="11" ry="7" fill="rgba(255,150,150,.22)"/>
    <ellipse cx="110" cy="92" rx="11" ry="7" fill="rgba(255,150,150,.22)"/>
    <!-- patas delanteras -->
    <ellipse cx="46" cy="132" rx="14" ry="10" fill="${c.body}"/>
    <ellipse cx="114" cy="132" rx="14" ry="10" fill="${c.body}"/>
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
    ? cfg.sparkles.slice(0, 3).map(s => `<span class="pig-sparkle">${s}</span>`).join('')
    : '';
  const lightning = cfg.lightning ? `<span class="pig-lightning">⚡</span>` : '';
  const flames    = cfg.flames
    ? `<div class="pig-flames"><span class="pig-flame">🔥</span><span class="pig-flame">🔥</span></div>` : '';

  return `
    <div class="piggy-anim ${cfg.status === 'maintenance' ? 'disabled' : ''}" id="piggy-${k}">
      ${buildPiggySVG(k, cfg)}
      <div class="pig-sparkles">${extras}${lightning}</div>
      ${flames}
    </div>`;
}

/* ══ BUILD GRID ══ */
function buildGrid() {
  const grid = $('#vaultsGrid');
  if (!grid) return;
  grid.innerHTML = Object.keys(CURRENCIES).map((k, i) => buildCard(k, i)).join('');
  // Bind buttons
  grid.querySelectorAll('.vc-btn[data-k]').forEach(btn => {
    btn.addEventListener('click', () => collectCurrency(btn.dataset.k));
  });
  // Click en chanchito = recolectar
  grid.querySelectorAll('.piggy-anim[id^="piggy-"]').forEach(el => {
    el.addEventListener('click', () => {
      const k = el.id.replace('piggy-', '');
      collectCurrency(k);
    });
  });
  // Restore fill + badge
  Object.keys(CURRENCIES).forEach(k => { updateFill(k); updateBadge(k); updateStats(k); });
  // Overlays
  Object.keys(CURRENCIES).forEach(k => {
    if (CURRENCIES[k].status === 'event') setupEventOverlay(k);
    if (CURRENCIES[k].status === 'maintenance') setupMaintOverlay(k);
  });
}

function buildCard(k, idx) {
  const cfg = CURRENCIES[k];
  const rateStr = cfg.rate >= 3600 ? `+1 cada ${cfg.rate/3600}h` :
                  cfg.rate >= 60   ? `+1 cada ${cfg.rate/60}min` :
                                     `+1 cada ${cfg.rate}s`;

  let stateBadge = '';
  if (cfg.status === 'event')       stateBadge = `<div class="vc-state-badge event">🎪 EVENTO</div>`;
  if (cfg.status === 'maintenance') stateBadge = `<div class="vc-state-badge maint">🔧 MANT.</div>`;
  if (cfg.isRapid)                  stateBadge = `<div class="vc-state-badge rapid">⚡ RÁPIDA</div>`;

  let overlayHTML = '';
  if (cfg.status === 'event') {
    overlayHTML = `<div class="vc-overlay" id="overlay-${k}">
      <div class="vc-overlay-inner">
        <div class="vc-overlay-ico" id="ov-ico-${k}">🎪</div>
        <div class="vc-overlay-title" id="ov-title-${k}">Cargando…</div>
        <div class="vc-overlay-msg" id="ov-msg-${k}"></div>
        <div class="vc-overlay-cd" id="ov-cd-${k}"></div>
      </div>
    </div>`;
  } else if (cfg.status === 'maintenance') {
    overlayHTML = `<div class="vc-overlay" id="overlay-${k}">
      <div class="vc-overlay-inner">
        <div class="vc-overlay-ico">🔧</div>
        <div class="vc-overlay-title">EN MANTENIMIENTO</div>
        <div class="vc-overlay-msg">Esta bóveda está en reparación</div>
        <div class="vc-overlay-eta" id="ov-eta-${k}">Calculando…</div>
      </div>
    </div>`;
  }

  const btnDisabled = cfg.status === 'maintenance' ? 'disabled' : '';
  const dateInfo = cfg.status === 'event'
    ? `<div class="vc-date">📅 ${fmtDate(cfg.eventStart)} – ${fmtDate(cfg.eventEnd)}</div>` : '';

  const cardClasses = [
    'vault-card reveal',
    cfg.gold ? 'is-gold' : '',
    cfg.status === 'event' ? 'is-event' : '',
    cfg.status === 'maintenance' ? 'is-maint' : '',
    cfg.isRapid ? 'is-rapid' : '',
  ].filter(Boolean).join(' ');

  return `
  <div class="${cardClasses}" id="card-${k}" style="animation-delay:${idx * 0.05}s">
    <div class="vc-band"></div>
    ${stateBadge}
    <div class="vc-head">
      <div class="vc-icon" style="border-color:${cfg.accent}">${cfg.icon}</div>
      <div class="vc-info">
        <div class="vc-name">${cfg.name}</div>
        <div class="vc-rate">${rateStr}</div>
        ${dateInfo}
      </div>
    </div>
    <div class="vc-piggy-wrap" style="position:relative">
      ${overlayHTML}
      <div class="vault-count-badge zero" id="badge-${k}">0</div>
      ${buildPiggyHTML(k, cfg)}
    </div>
    <div class="vc-fill-bar-wrap">
      <div class="vc-fill-label">
        <span class="vc-fill-lbl">BÓVEDA</span>
        <span class="vc-fill-pct" id="fillpct-${k}">0%</span>
      </div>
      <div class="vc-fill-track">
        <div class="vc-fill-bar" id="fillbar-${k}" style="width:0%;background:linear-gradient(90deg,${cfg.btnBg},${cfg.accent})"></div>
      </div>
    </div>
    <div class="vc-stats">
      <div class="vc-stat">
        <span class="vc-stat-lbl">GUARDADO</span>
        <span class="vc-stat-val" id="total-${k}" style="color:${cfg.accent}">0</span>
      </div>
      <div class="vc-stat">
        <span class="vc-stat-lbl">BÓVEDA</span>
        <span class="vc-stat-val" id="vault-${k}">0/${cfg.max > 10000 ? '∞' : cfg.max}</span>
      </div>
      <div class="vc-stat">
        <span class="vc-stat-lbl">PRÓXIMA</span>
        <span class="vc-stat-val blue" id="next-${k}">—</span>
      </div>
    </div>
    <button class="vc-btn" data-k="${k}" ${btnDisabled}
      style="border-color:${cfg.accent};background:${cfg.btnBg};color:${cfg.btnText}"
      id="btn-${k}">
      🪙 RECOLECTAR ${cfg.name.toUpperCase()}
    </button>
  </div>`;
}

function fmtDate(d) {
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short' });
}

/* ══ OVERLAYS ══ */
const _cdIvs = new Map();
function setupEventOverlay(k) {
  const cfg     = CURRENCIES[k];
  const overlay = $(`#overlay-${k}`);
  const btn     = $(`#btn-${k}`);
  if (!overlay || !btn) return;
  const active = isEventActive(k);
  overlay.style.display = active ? 'none' : 'flex';
  btn.disabled = !active;
  const now = new Date();
  const ico   = $(`#ov-ico-${k}`);
  const title = $(`#ov-title-${k}`);
  const msg   = $(`#ov-msg-${k}`);
  const cd    = $(`#ov-cd-${k}`);
  if (active) {
    startOverlayCd(k, cfg.eventEnd, 'Termina en: ');
  } else if (now < cfg.eventStart) {
    if (ico) ico.textContent = '⏳';
    if (title) title.textContent = 'PRÓXIMAMENTE';
    if (msg) msg.textContent = 'Este evento comienza pronto';
    startOverlayCd(k, cfg.eventStart, 'Comienza en: ');
  } else {
    if (ico) ico.textContent = '✅';
    if (title) title.textContent = 'EVENTO FINALIZADO';
    if (msg) msg.textContent = '¡Gracias por participar!';
    if (cd) cd.textContent = '';
    state.currencies[k].vault = 0;
    updateFill(k); updateBadge(k);
  }
}
function startOverlayCd(k, target, prefix) {
  const el = $(`#ov-cd-${k}`);
  if (!el) return;
  if (_cdIvs.has(k)) { clearInterval(_cdIvs.get(k)); }
  const fn = () => {
    const diff = target - new Date();
    if (diff <= 0) { el.textContent = prefix + '¡YA!'; clearInterval(_cdIvs.get(k)); setupEventOverlay(k); return; }
    const d = Math.floor(diff/86400000), h = Math.floor((diff%86400000)/3600000);
    const m = Math.floor((diff%3600000)/60000), s = Math.floor((diff%60000)/1000);
    el.textContent = prefix + (d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`);
  };
  fn();
  _cdIvs.set(k, setInterval(fn, 1000));
}
function setupMaintOverlay(k) {
  const cfg = CURRENCIES[k];
  if (!cfg.returnDate) return;
  const el = $(`#ov-eta-${k}`);
  if (!el) return;
  const diff = cfg.returnDate - new Date();
  if (diff <= 0) { el.textContent = 'Regresa pronto'; return; }
  const d = Math.floor(diff/86400000), h = Math.floor((diff%86400000)/3600000);
  el.textContent = `Regreso estimado: ${d}d ${h}h`;
}

/* ══ LLENADO DEL CHANCHITO (SVG rect) ══ */
function updateFill(k) {
  const cfg = CURRENCIES[k];
  const st  = state.currencies[k];
  const pct = cfg.max > 10000 ? 0 : Math.min(100, (st.vault / cfg.max) * 100);

  // Rect SVG
  const fillEl = document.getElementById(`pigfill-${k}`);
  if (fillEl) {
    const bodyH = 110;
    const fillH = (pct / 100) * bodyH;
    fillEl.setAttribute('y',      String(145 - fillH));
    fillEl.setAttribute('height', String(fillH));
  }
  // Barra debajo
  const bar  = $(`#fillbar-${k}`);
  const pctEl= $(`#fillpct-${k}`);
  if (bar)   bar.style.width = pct + '%';
  if (pctEl) pctEl.textContent = Math.round(pct) + '%';
}

function updateBadge(k) {
  const st  = state.currencies[k];
  const cfg = CURRENCIES[k];
  const el  = $(`#badge-${k}`);
  if (!el) return;
  el.textContent = st.vault > 10000 ? st.vault.toLocaleString() : st.vault;
  el.classList.toggle('zero', st.vault === 0);
  el.classList.toggle('full', st.vault >= cfg.max && cfg.max <= 10000);
}

function updateStats(k) {
  const cfg = CURRENCIES[k];
  const st  = state.currencies[k];
  const tel = $(`#total-${k}`);
  const vel = $(`#vault-${k}`);
  if (tel) tel.textContent = st.total.toLocaleString();
  if (vel) vel.textContent = `${st.vault.toLocaleString()}/${cfg.max > 10000 ? '∞' : cfg.max}`;
}

function updateNext(k, msLeft) {
  const el = $(`#next-${k}`);
  if (!el) return;
  if (msLeft == null) { el.textContent = '—'; return; }
  if (msLeft <= 0)    { el.textContent = '¡AHORA!'; return; }
  const cfg = CURRENCIES[k];
  el.textContent = formatTime(msLeft, cfg.rate < 60);
}

/* ══ ESTADÍSTICAS GLOBALES ══ */
function updateGlobalStats() {
  let totalVault = 0, totalEver = 0, activeV = 0;
  Object.keys(CURRENCIES).forEach(k => {
    const st = state.currencies[k];
    totalVault += st.vault;
    totalEver  += st.total;
    if (isRunning(k)) activeV++;
  });
  state.totalEver = totalEver;
  setTxt('#heroTotal',    totalVault.toLocaleString());
  setTxt('#heroActive',   activeV);
  setTxt('#heroHistoric', totalEver.toLocaleString());
  const diff = Date.now() - state.firstVisit;
  const days = Math.floor(diff / 86400000);
  const hrs  = Math.floor((diff % 86400000) / 3600000);
  setTxt('#heroUptime', `${days}d ${hrs}h`);

  // Botón recolectar todo
  const canAny = Object.keys(CURRENCIES).some(k => isRunning(k) && state.currencies[k].vault > 0);
  const btn = $('#collectAllBtn');
  if (btn) btn.disabled = !canAny;
}

function setTxt(sel, val) { const el = $(sel); if (el) el.textContent = val; }

/* ══ LOOP PRINCIPAL ══ */
let lastSave = Date.now();
function startLoop() {
  setInterval(() => {
    const now = Date.now();
    Object.keys(CURRENCIES).forEach(k => tick(k, now));
    updateGlobalStats();
    if (now - lastSave > 30000) { saveState(state); lastSave = now; scheduleSync(); }
  }, 1000);
  // Check eventos cada minuto
  setInterval(() => {
    Object.keys(CURRENCIES).forEach(k => {
      if (CURRENCIES[k].status === 'event') setupEventOverlay(k);
    });
  }, 60000);
}

function tick(k, now) {
  const cfg = CURRENCIES[k];
  const st  = state.currencies[k];
  if (!isRunning(k)) { updateNext(k, null); return; }
  if (now >= st.nextUpdate && st.vault < cfg.max) {
    st.vault++;
    st.lastUpdate = now;
    st.nextUpdate = now + cfg.rate * 1000;
    updateFill(k);
    updateBadge(k);
    updateStats(k);
    if (st.vault >= cfg.max) {
      toast(`📦 ¡Bóveda de ${cfg.name} llena!`, 'success');
      const badge = $(`#badge-${k}`);
      if (badge) badge.classList.add('full');
    }
  }
  updateNext(k, st.nextUpdate - now);
}

/* ══ RECOLECCIÓN ══ */
function collectCurrency(k) {
  const cfg = CURRENCIES[k];
  const st  = state.currencies[k];
  if (cfg.status === 'maintenance') { toast('⚠️ En mantenimiento', 'error'); return; }
  if (!isRunning(k))                { toast('Evento no disponible', 'error'); return; }
  if (st.vault === 0)               { toast(`No hay ${cfg.name} que recolectar`); return; }

  const amount = st.vault;
  st.total += amount;
  st.vault = 0;
  state.totalEver += amount;

  updateFill(k); updateBadge(k); updateStats(k); updateGlobalStats();
  animateCollect(k, amount, cfg.icon);
  addLog(`Recolectadas ${amount} ${cfg.name}`, 'collect');
  toast(`✅ +${amount} ${cfg.name} recolectadas`, 'success');
  saveState(state);
  scheduleSync();
}

function collectAll() {
  let total = 0;
  Object.keys(CURRENCIES).forEach(k => {
    if (!isRunning(k) || state.currencies[k].vault === 0) return;
    const cfg = CURRENCIES[k];
    const st  = state.currencies[k];
    total += st.vault;
    st.total += st.vault;
    st.vault = 0;
    updateFill(k); updateBadge(k); updateStats(k);
  });
  if (!total) { toast('No hay monedas para recolectar'); return; }
  state.totalEver += total;
  updateGlobalStats();
  addLog(`Recolección total: ${total} monedas`, 'collect');
  toast(`🎁 ¡Recolectaste ${total} monedas!`, 'success');
  saveState(state);
  scheduleSync();
}

/* ══ ANIMACIÓN DE RECOLECCIÓN (monedas volando) ══ */
function animateCollect(k, amount, icon) {
  const el = $(`#piggy-${k}`);
  if (el) {
    el.animate([
      { transform: 'scale(1) rotate(0deg)' },
      { transform: 'scale(1.15) rotate(-5deg)', offset: .3 },
      { transform: 'scale(1.15) rotate(5deg)',  offset: .6 },
      { transform: 'scale(1) rotate(0deg)' },
    ], { duration: 500, easing: 'cubic-bezier(.34,1.56,.64,1)' });
  }
  const rect = el?.getBoundingClientRect();
  const cx = rect ? rect.left + rect.width / 2  : window.innerWidth / 2;
  const cy = rect ? rect.top  + rect.height / 2 : window.innerHeight / 2;
  for (let i = 0; i < Math.min(amount, 14); i++) {
    setTimeout(() => spawnCoin(cx, cy, icon), i * 50);
  }
}

function spawnCoin(x, y, icon) {
  const d = document.createElement('div');
  d.textContent = icon;
  Object.assign(d.style, {
    position: 'fixed', left: x + 'px', top: y + 'px',
    fontSize: '1.6rem', pointerEvents: 'none', zIndex: '9999',
    transform: 'translate(-50%,-50%)',
  });
  document.body.appendChild(d);
  const ang = Math.random() * Math.PI * 2;
  const dist = 60 + Math.random() * 60;
  d.animate([
    { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
    { transform: `translate(calc(-50% + ${Math.cos(ang)*dist}px), calc(-50% + ${Math.sin(ang)*dist - 30}px)) scale(.2) rotate(${ang*180/Math.PI}deg)`, opacity: 0 },
  ], { duration: 700, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => d.remove();
}

/* ══ LOG ══ */
function addLog(msg, type = 'system') {
  state.log.unshift({ t: Date.now(), msg, type });
  if (state.log.length > 120) state.log = state.log.slice(0, 120);
  renderLog();
}
function renderLog() {
  const el = $('#activityLog');
  if (!el) return;
  if (!state.log.length) {
    el.innerHTML = `<div class="log-entry system"><span class="log-time">—</span><span class="log-msg">Sin actividad reciente</span></div>`;
    return;
  }
  el.innerHTML = state.log.slice(0, 30).map(e => {
    const d = new Date(e.t);
    const time = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    return `<div class="log-entry ${e.type}"><span class="log-time">${time}</span><span class="log-msg">${e.msg}</span></div>`;
  }).join('');
}

/* ══ SORT ══ */
let currentSort = 'default';
function applySort() {
  const keys = Object.keys(CURRENCIES);
  const sorted = [...keys].sort((a, b) => {
    const sa = state.currencies[a];
    const sb = state.currencies[b];
    switch (currentSort) {
      case 'vault-desc':  return sb.vault - sa.vault;
      case 'total-desc':  return sb.total - sa.total;
      case 'rate-asc':    return CURRENCIES[a].rate - CURRENCIES[b].rate;
      default:            return keys.indexOf(a) - keys.indexOf(b);
    }
  });
  const grid = $('#vaultsGrid');
  if (grid) sorted.forEach(k => { const el = $(`#card-${k}`); if (el) grid.appendChild(el); });
}

/* ══ PARTICLES (reutilizado de tienda) ══ */
function initCoins() {
  const canvas = $('#bgCoins');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W = canvas.width = window.innerWidth;
  let H = canvas.height = window.innerHeight;
  const SYMS = ['🪙','💰','✨','💛','⭐','💎'];
  const coins = Array.from({ length: 28 }, () => ({
    x: Math.random() * W, y: Math.random() * H,
    size: Math.random() * 10 + 7,
    speed: Math.random() * 0.35 + 0.08,
    sym: SYMS[Math.floor(Math.random() * SYMS.length)],
    o: Math.random() * 0.2 + 0.04,
  }));
  (function draw() {
    ctx.clearRect(0, 0, W, H);
    coins.forEach(c => {
      ctx.globalAlpha = c.o;
      ctx.font = `${c.size}px serif`;
      ctx.fillText(c.sym, c.x, c.y);
      c.y -= c.speed;
      if (c.y < -20) { c.y = H + 10; c.x = Math.random() * W; }
    });
    requestAnimationFrame(draw);
  })();
  window.addEventListener('resize', () => {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  });
}

/* ══ REVEAL ══ */
function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}
const _revObs = new MutationObserver(() => {
  document.querySelectorAll('.reveal:not(.visible)').forEach(el => {
    if (!el._revObserved) {
      el._revObserved = true;
      const o = new IntersectionObserver(ents => {
        ents.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); o.unobserve(e.target); } });
      }, { threshold: 0.08 });
      o.observe(el);
    }
  });
});

/* ══ TOAST ══ */
function toast(msg, type = '') {
  const t = $('#toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `toast show ${type}`;
  clearTimeout(t._tm);
  t._tm = setTimeout(() => t.classList.remove('show'), 3000);
}

/* ══ FORMATO DE TIEMPO ══ */
function formatTime(ms, isSeconds = false) {
  if (ms <= 0) return '¡AHORA!';
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
  console.log('🏦 Moonveil Banco del Reino v1.0');

  // Cargar estado
  state = loadState();
  // Si faltan monedas nuevas, inicializar
  Object.keys(CURRENCIES).forEach(k => {
    if (!state.currencies[k]) {
      state.currencies[k] = { total: 0, vault: 0, lastUpdate: Date.now(), nextUpdate: Date.now() + CURRENCIES[k].rate * 1000 };
    }
  });

  calcOfflineGains();
  initReveal();
  initCoins();
  buildGrid();
  startLoop();
  renderLog();
  updateGlobalStats();

  // Observe new .reveal elements
  setTimeout(() => {
    _revObs.observe(document.body, { childList: true, subtree: true });
    document.querySelectorAll('.reveal').forEach(el => {
      const o = new IntersectionObserver(ents => {
        ents.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); o.unobserve(e.target); } });
      }, { threshold: 0.05 });
      o.observe(el);
    });
  }, 100);

  // Collect all
  $('#collectAllBtn')?.addEventListener('click', collectAll);

  // Sort pills
  $$('.sort-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.sort-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSort = btn.dataset.sort || 'default';
      applySort();
    });
  });
  $('#sortBtn')?.addEventListener('click', () => {
    const sorts = ['default','vault-desc','total-desc','rate-asc'];
    const idx = sorts.indexOf(currentSort);
    currentSort = sorts[(idx + 1) % sorts.length];
    $$('.sort-pill').forEach(b => b.classList.toggle('active', b.dataset.sort === currentSort));
    applySort();
    toast(`Ordenado: ${currentSort}`);
  });

  // Clear log
  $('#clearLogBtn')?.addEventListener('click', () => {
    state.log = [];
    addLog('Registro limpiado', 'system');
  });

  // Hamburger
  const ham = $('#hamburger'), nav = $('#main-nav');
  ham?.addEventListener('click', () => nav?.classList.toggle('open'));

  // Save before unload
  window.addEventListener('beforeunload', () => { saveState(state); });

  // Firebase auth
  onAuthChange(async user => {
    if (!user) return;
    currentUID = user.uid;
    await loadFromFirebase(user.uid);
    // Re-render con datos de Firebase
    Object.keys(CURRENCIES).forEach(k => { updateFill(k); updateBadge(k); updateStats(k); });
    updateGlobalStats();
    addLog('Sincronizado con Firebase', 'system');
    console.log('✅ Banco Firebase OK:', user.uid);
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();