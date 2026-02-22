/* ============================================================
   Moonveil Portal — Banco del Reino (JS v4)
   ============================================================
   - Chanchitos SVG mejorados con cara y animaciones
   - Acumulación automática en background
   - Sistema de eventos con countdown
   - Bóvedas con mantenimiento
   - Header idéntico a tienda.js
   ============================================================ */

'use strict';

/* ─────────────────────────────────────
   Config de monedas
───────────────────────────────────── */
const CURRENCIES = {
  esmeralda:  { name:'Esmeraldas',             icon:'💎', rate:7200,  max:50,  status:'active',  colorVar:'--c-emerald', iconClass:'ci-emerald',  btnC1:'#059669', btnC2:'#047857', badgeClass:'',            accent:'#10b981', sparkles:['✦','✧'] },
  cobre:      { name:'Lingotes de Cobre',       icon:'🟫', rate:3600,  max:50,  status:'active',  colorVar:'--c-copper',  iconClass:'ci-copper',   btnC1:'#b45309', btnC2:'#92400e', badgeClass:'',            accent:'#d97706', sparkles:[] },
  oro:        { name:'Pepitas de Oro',          icon:'⭐', rate:10800, max:50,  status:'active',  colorVar:'--c-gold',    iconClass:'ci-gold',     btnC1:'#d4aa4e', btnC2:'#b8902a', badgeClass:'badge-gold',  accent:'#d4aa4e', sparkles:['✦','⭐','✧'], isGold:true },
  hierro:     { name:'Pepitas de Hierro',       icon:'⚙️', rate:5400,  max:50,  status:'active',  colorVar:'--c-iron',    iconClass:'ci-iron',     btnC1:'#4b5563', btnC2:'#374151', badgeClass:'',            accent:'#6b7280', sparkles:[] },
  inframundo: { name:'Lingotes de Inframundo',  icon:'🔥', rate:14400, max:50,  status:'active',  colorVar:'--c-nether',  iconClass:'ci-nether',   btnC1:'#ef4444', btnC2:'#991b1b', badgeClass:'badge-nether',accent:'#f87171', flames:true, btnText:'color:#fff' },
  ladrillo:   { name:'Ladrillos',               icon:'🧱', rate:2700,  max:50,  status:'active',  colorVar:'--c-brick',   iconClass:'ci-brick',    btnC1:'#b91c1c', btnC2:'#7f1d1d', badgeClass:'',            accent:'#ef4444', sparkles:[] },
  rapida:     { name:'Pepitas Rápidas',         icon:'⚡', rate:10,    max:999999, status:'active',colorVar:'--c-rapid', iconClass:'ci-rapid',     btnC1:'#7c3aed', btnC2:'#4c1d95', badgeClass:'badge-rapid', accent:'#8b5cf6', lightning:true, btnText:'color:#fff' },
  diamante:   {
    name:'Diamantes Especiales', icon:'💠', rate:18000, max:50, status:'event',
    colorVar:'--c-diamond', iconClass:'ci-diamond', btnC1:'#38bdf8', btnC2:'#0284c7',
    badgeClass:'badge-diamond', accent:'#38bdf8', sparkles:['💠','✦','⬦'], btnText:'color:#000',
    eventStart: new Date('2026-02-10T00:00:00'),
    eventEnd:   new Date('2026-02-20T23:59:59'),
  },
  netherita:  {
    name:'Netherita', icon:'🌑', rate:21600, max:50, status:'maintenance',
    colorVar:'--c-netherita', iconClass:'ci-netherita', btnC1:'#374151', btnC2:'#1f2937',
    badgeClass:'badge-disabled', accent:'#4b5563', sparkles:[],
    returnDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
  },
};

const SAVE_KEY = 'moonveilBank_v4';

/* ─────────────────────────────────────
   Estado del banco
───────────────────────────────────── */
let bankState = {
  currencies: {},
  log: [],
  firstVisit: Date.now(),
  lastVisit: Date.now(),
  totalEver: 0,
};

/* ─────────────────────────────────────
   Init
───────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initState();
  loadData();
  buildGrid();
  calcOfflineGains();
  startLoop();
  bindEvents();
  setupNavbar();
  setupParticles();
  setupParallax();
  setupReveal();
  setupMusic();
  updateYear();
  log('Sistema bancario inicializado correctamente', 'system');
  toast('🏦 Banco del Reino listo');
});

function updateYear() {
  const el = document.getElementById('y');
  if (el) el.textContent = new Date().getFullYear();
}

/* ─────────────────────────────────────
   Estado inicial
───────────────────────────────────── */
function initState() {
  Object.keys(CURRENCIES).forEach(k => {
    bankState.currencies[k] = { total: 0, vault: 0, lastUpdate: Date.now(), nextUpdate: Date.now() + CURRENCIES[k].rate * 1000 };
  });
}

/* ─────────────────────────────────────
   Persistencia
───────────────────────────────────── */
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
  } catch(e) { console.warn('loadData error:', e) }
}

function saveData() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...bankState, lastSave: Date.now() }));
  } catch(e) { console.warn('saveData error:', e) }
}

/* ─────────────────────────────────────
   Ganancias offline
───────────────────────────────────── */
function calcOfflineGains() {
  const diff = Date.now() - bankState.lastVisit;
  if (diff < 1000) return;
  let gained = 0;
  Object.keys(CURRENCIES).forEach(k => {
    const cfg = CURRENCIES[k];
    if (cfg.status === 'maintenance') return;
    if (cfg.status === 'event' && !isEventActive(k)) return;
    const st = bankState.currencies[k];
    const rateMs = cfg.rate * 1000;
    const n = Math.floor(diff / rateMs);
    if (n > 0) {
      const space = cfg.max - st.vault;
      const add = Math.min(n, space);
      if (add > 0) { st.vault += add; gained += add; st.nextUpdate = Date.now() + (diff % rateMs === 0 ? rateMs : rateMs - (diff % rateMs)); }
    }
  });
  if (gained > 0) { toast(`⏰ Mientras estabas fuera: +${gained} monedas`); log(`Ganancias offline: +${gained} monedas`, 'auto'); }
  bankState.lastVisit = Date.now();
}

/* ─────────────────────────────────────
   Eventos
───────────────────────────────────── */
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

/* ─────────────────────────────────────
   ★ GENERADOR DE CHANCHITO SVG ★
   Chanchito con cuerpo redondeado, cara,
   orejas, rabo y llenado animado
───────────────────────────────────── */
function buildPiggyHTML(k, cfg) {
  const colors = {
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
  const c = colors[k] || colors['esmeralda'];
  const pct = cfg.max > 999 ? 0 : 0; // starts 0, updated by JS

  /* SVG del chanchito */
  const svg = `
  <svg class="piggy-svg" id="svg-${k}" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <clipPath id="cp-${k}">
        <ellipse cx="80" cy="90" rx="60" ry="55"/>
      </clipPath>
    </defs>

    <!-- Rabo -->
    <path d="M136,72 Q148,64 144,80 Q140,96 148,88" stroke="${c.shade}" stroke-width="4.5" fill="none" stroke-linecap="round"/>

    <!-- Patas traseras -->
    <ellipse cx="52" cy="147" rx="17" ry="10" fill="${c.shade}" opacity=".7"/>
    <ellipse cx="108" cy="147" rx="17" ry="10" fill="${c.shade}" opacity=".7"/>
    <!-- Dedos -->
    <circle cx="42" cy="151" r="4" fill="${c.shade}" opacity=".7"/>
    <circle cx="52" cy="153" r="4" fill="${c.shade}" opacity=".7"/>
    <circle cx="62" cy="151" r="4" fill="${c.shade}" opacity=".7"/>
    <circle cx="98" cy="151" r="4" fill="${c.shade}" opacity=".7"/>
    <circle cx="108" cy="153" r="4" fill="${c.shade}" opacity=".7"/>
    <circle cx="118" cy="151" r="4" fill="${c.shade}" opacity=".7"/>

    <!-- Cuerpo principal -->
    <ellipse cx="80" cy="90" rx="60" ry="55" fill="${c.shade}" />
    <ellipse cx="80" cy="88" rx="58" ry="53" fill="${c.body}" />

    <!-- Llenado animado (fill) -->
    <rect id="fill-${k}" x="22" y="${160}" width="116" height="0" fill="${c.fill}" opacity=".45" clip-path="url(#cp-${k})"/>

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
    <!-- Reflejos ojos -->
    <circle cx="60" cy="74" r="3" fill="rgba(255,255,255,.8)"/>
    <circle cx="94" cy="74" r="3" fill="rgba(255,255,255,.8)"/>
    <!-- Pupilas -->
    <circle cx="63" cy="78" r="5" fill="rgba(0,0,0,.75)"/>
    <circle cx="97" cy="78" r="5" fill="rgba(0,0,0,.75)"/>

    <!-- Hocico -->
    <ellipse cx="80" cy="98" rx="20" ry="13" fill="${c.nose}"/>
    <circle cx="73" cy="98" r="5" fill="${c.shade}" opacity=".35"/>
    <circle cx="87" cy="98" r="5" fill="${c.shade}" opacity=".35"/>

    <!-- Ranura de monedas (top) -->
    <rect x="63" y="38" width="34" height="6" rx="3" fill="rgba(0,0,0,.35)"/>

    <!-- Mejillas -->
    <ellipse cx="50" cy="92" rx="11" ry="7" fill="rgba(255,150,150,.22)"/>
    <ellipse cx="110" cy="92" rx="11" ry="7" fill="rgba(255,150,150,.22)"/>

    <!-- Patas delanteras -->
    <ellipse cx="46" cy="132" rx="14" ry="10" fill="${c.body}"/>
    <ellipse cx="114" cy="132" rx="14" ry="10" fill="${c.body}"/>
    <!-- Dedos delanteros -->
    <circle cx="37" cy="135" r="4" fill="${c.shade}" opacity=".6"/>
    <circle cx="46" cy="138" r="4" fill="${c.shade}" opacity=".6"/>
    <circle cx="55" cy="135" r="4" fill="${c.shade}" opacity=".6"/>
    <circle cx="105" cy="135" r="4" fill="${c.shade}" opacity=".6"/>
    <circle cx="114" cy="138" r="4" fill="${c.shade}" opacity=".6"/>
    <circle cx="123" cy="135" r="4" fill="${c.shade}" opacity=".6"/>
  </svg>`;

  /* Extras */
  const extras = cfg.sparkles && cfg.sparkles.length
    ? cfg.sparkles.slice(0,3).map(s => `<span class="piggy-sparkle">${s}</span>`).join('')
    : '';
  const lightning = cfg.lightning ? `<span class="piggy-lightning">⚡</span>` : '';
  const flames    = cfg.flames    ? `<span class="piggy-flame">🔥</span><span class="piggy-flame">🔥</span>` : '';

  return `
    <div class="piggy-wrap ${cfg.status === 'maintenance' ? 'disabled' : ''}"
         id="piggy-${k}" title="${cfg.name}">
      ${svg}
      <div class="piggy-badge" id="badge-${k}" style="--badge-color:${cfg.accent}">0</div>
      ${extras}${lightning}${flames}
    </div>`;
}

/* ─────────────────────────────────────
   Construir grid de tarjetas
───────────────────────────────────── */
function buildGrid() {
  const grid = document.getElementById('currencyGrid');
  if (!grid) return;
  grid.innerHTML = Object.keys(CURRENCIES).map((k, i) => buildCard(k, i)).join('');

  // Bind collect buttons
  grid.querySelectorAll('.btn-collect').forEach(btn => {
    btn.addEventListener('click', () => collectCurrency(btn.dataset.currency));
  });

  // Init fills & badges
  Object.keys(CURRENCIES).forEach(k => {
    updateFill(k);
    updateBadge(k);
  });

  // Start overlays
  Object.keys(CURRENCIES).forEach(k => {
    const cfg = CURRENCIES[k];
    if (cfg.status === 'event') setupEventOverlay(k);
    if (cfg.status === 'maintenance') setupMaintOverlay(k);
  });
}

function buildCard(k, idx) {
  const cfg = CURRENCIES[k];
  const isGold = cfg.isGold;
  const overlayHTML = cfg.status === 'event'
    ? `<div class="event-overlay" id="overlay-${k}">
        <div class="overlay-inner">
          <div class="overlay-ico" id="overlay-ico-${k}">🎪</div>
          <div class="overlay-title" id="overlay-title-${k}">Cargando…</div>
          <div class="overlay-msg"   id="overlay-msg-${k}"></div>
          <div class="overlay-countdown" id="overlay-cd-${k}"></div>
        </div>
       </div>`
    : cfg.status === 'maintenance'
    ? `<div class="maint-overlay" id="overlay-${k}">
        <div class="overlay-inner">
          <div class="overlay-ico">🔧</div>
          <div class="overlay-title">En Mantenimiento</div>
          <div class="overlay-msg">Esta bóveda está siendo reparada</div>
          <div class="overlay-eta" id="eta-${k}">Regreso: calculando…</div>
        </div>
       </div>`
    : '';

  const tag = cfg.status === 'event'   ? `<div class="card-tag tag-event">🎉 EVENTO</div>` :
              cfg.status === 'maintenance' ? `<div class="card-tag tag-maint">⚠️ MANT.</div>` : '';

  const btnStyle = `--btn-c1:${cfg.btnC1};--btn-c2:${cfg.btnC2}`;
  const btnTextStyle = cfg.btnText || '';
  const rateStr = cfg.rate >= 3600 ? `+1 cada ${cfg.rate/3600}h` :
                  cfg.rate >= 60   ? `+1 cada ${cfg.rate/60}min` :
                                     `+1 cada ${cfg.rate}s`;

  return `
  <div class="currency-card ${isGold?'gold-card':''}" data-key="${k}" id="card-${k}"
       style="--card-accent:${cfg.accent}; animation-delay:${idx*.06}s">
    ${tag}
    <div class="card-header">
      <div class="currency-icon ${cfg.iconClass}">${cfg.icon}</div>
      <div class="currency-info">
        <h3>${cfg.name}</h3>
        <p class="rate">${rateStr}</p>
        ${cfg.status === 'event' ? `<p class="event-date">📅 ${fmtDate(cfg.eventStart)} – ${fmtDate(cfg.eventEnd)}</p>` : ''}
        ${cfg.status === 'maintenance' ? `<p class="maint-msg">🔧 En reparación</p>` : ''}
      </div>
      <div class="currency-badge ${cfg.badgeClass}" id="cbadge-${k}">0</div>
    </div>

    <div class="piggy-container">
      ${overlayHTML}
      ${buildPiggyHTML(k, cfg)}
    </div>

    <div class="vault-progress" title="Bóveda"><div class="vault-progress-bar" id="vaultbar-${k}" style="--progress-color:${cfg.accent}; width:0%"></div></div>

    <div class="currency-stats">
      <div class="stat">
        <span class="label">Guardado</span>
        <span class="value" id="total-${k}" style="color:${cfg.accent}">0</span>
      </div>
      <div class="stat">
        <span class="label">Bóveda</span>
        <span class="value" id="vault-${k}">0/${cfg.max > 10000 ? '∞' : cfg.max}</span>
      </div>
      <div class="stat">
        <span class="label">Próxima</span>
        <span class="value" id="next-${k}">—</span>
      </div>
    </div>

    <button class="btn-collect" data-currency="${k}"
            style="${btnStyle}" ${cfg.status === 'maintenance' ? 'disabled' : ''}>
      <span class="btn-shine"></span>
      <span style="${btnTextStyle}" id="btnlbl-${k}">Recolectar</span>
    </button>
  </div>`;
}

function fmtDate(d) {
  return d.toLocaleDateString('es', { day:'numeric', month:'short' });
}

/* ─────────────────────────────────────
   Loop principal (cada segundo)
───────────────────────────────────── */
let lastSave = Date.now();

function startLoop() {
  setInterval(() => {
    const now = Date.now();
    Object.keys(CURRENCIES).forEach(k => tick(k, now));
    updateGlobalStats();
    updateCollectAllBtn();
    if (now - lastSave > 30000) { saveData(); lastSave = now; }
  }, 1000);

  // Events check cada minuto
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
    if (st.vault >= cfg.max) toast(`📦 Bóveda de ${cfg.name} ¡llena!`);
    updateCardStats(k);
  }
  updateNextDisplay(k, st.nextUpdate - now);
}

/* ─────────────────────────────────────
   UI updates
───────────────────────────────────── */
function updateFill(k) {
  const cfg = CURRENCIES[k];
  const st  = bankState.currencies[k];
  const pct = cfg.max > 10000 ? 0 : Math.min(100, (st.vault / cfg.max) * 100);

  // SVG fill rect animado
  const fillEl = document.getElementById(`fill-${k}`);
  if (fillEl) {
    const bodyH = 110; // altura del cuerpo SVG
    const fillH = (pct / 100) * bodyH;
    fillEl.setAttribute('y', String(145 - fillH));
    fillEl.setAttribute('height', String(fillH));
  }

  // Barra de progreso
  const bar = document.getElementById(`vaultbar-${k}`);
  if (bar) bar.style.width = pct + '%';
}

function updateBadge(k) {
  const st = bankState.currencies[k];
  const el = document.getElementById(`cbadge-${k}`);
  const pg = document.getElementById(`badge-${k}`);
  if (el) { el.textContent = st.vault; el.classList.toggle('show', st.vault > 0); }
  if (pg) pg.textContent = st.vault;
}

function updateCardStats(k) {
  const cfg = CURRENCIES[k];
  const st  = bankState.currencies[k];
  const tel = document.getElementById(`total-${k}`);
  const vel = document.getElementById(`vault-${k}`);
  if (tel) tel.textContent = st.total;
  if (vel) vel.textContent = `${st.vault}/${cfg.max > 10000 ? '∞' : cfg.max}`;
}

function updateNextDisplay(k, msLeft) {
  const el = document.getElementById(`next-${k}`);
  if (!el) return;
  if (msLeft == null) { el.textContent = '—'; return; }
  el.textContent = msLeft <= 0 ? '¡Ahora!' : formatTime(msLeft, CURRENCIES[k].rate < 60);
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
  set('totalCoins',  totalVault);
  set('activeVaults',activeV);
  set('totalEver',   totalEver);
  const diff = Date.now() - bankState.firstVisit;
  const days = Math.floor(diff / 86400000);
  const hrs  = Math.floor((diff % 86400000) / 3600000);
  set('uptime', `${days}d ${hrs}h`);
}

function updateCollectAllBtn() {
  const canAny = Object.keys(CURRENCIES).some(k => isRunning(k) && bankState.currencies[k].vault > 0);
  const btn = document.getElementById('collectAllBtn');
  if (btn) btn.disabled = !canAny;
}

function set(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }

/* ─────────────────────────────────────
   Overlay de evento
───────────────────────────────────── */
function setupEventOverlay(k) {
  const cfg = CURRENCIES[k];
  const overlay = document.getElementById(`overlay-${k}`);
  const btn     = document.querySelector(`[data-currency="${k}"]`);
  const lbl     = document.getElementById(`btnlbl-${k}`);
  if (!overlay || !btn) return;

  const active = isEventActive(k);
  overlay.style.display = active ? 'none' : 'flex';
  btn.disabled = !active;

  const now = new Date();
  const ico = document.getElementById(`overlay-ico-${k}`);
  const ttl = document.getElementById(`overlay-title-${k}`);
  const msg = document.getElementById(`overlay-msg-${k}`);
  const cd  = document.getElementById(`overlay-cd-${k}`);

  if (active) {
    if (lbl) lbl.textContent = 'Recolectar';
    startOverlayCd(k, cfg.eventEnd, 'Tiempo restante: ');
  } else if (now < cfg.eventStart) {
    if (ico) ico.textContent = '⏳';
    if (ttl) ttl.textContent = 'Próximamente';
    if (msg) msg.textContent = 'Este evento comenzará pronto';
    if (lbl) lbl.textContent = 'Evento no disponible';
    startOverlayCd(k, cfg.eventStart, 'Comienza en: ');
  } else {
    if (ico) ico.textContent = '✅';
    if (ttl) ttl.textContent = 'Evento Finalizado';
    if (msg) msg.textContent = '¡Gracias por participar!';
    if (cd)  cd.textContent  = '';
    if (lbl) lbl.textContent = 'Evento finalizado';
    bankState.currencies[k].vault = 0;
    updateFill(k); updateBadge(k);
  }
}

const _cdIvs = new Map();
function startOverlayCd(k, target, prefix) {
  const el = document.getElementById(`overlay-cd-${k}`);
  if (!el) return;
  if (_cdIvs.has(k)) { clearInterval(_cdIvs.get(k)); }
  const fn = () => {
    const diff = target - new Date();
    if (diff <= 0) { el.textContent = prefix + '¡Ya!'; clearInterval(_cdIvs.get(k)); setupEventOverlay(k); return; }
    const d = Math.floor(diff/86400000), h = Math.floor((diff%86400000)/3600000);
    const m = Math.floor((diff%3600000)/60000), s = Math.floor((diff%60000)/1000);
    let str = d>0 ? `${d}d ${h}h` : h>0 ? `${h}h ${m}m` : m>0 ? `${m}m ${s}s` : `${s}s`;
    el.textContent = prefix + str;
  };
  fn();
  _cdIvs.set(k, setInterval(fn, 1000));
}

/* ─────────────────────────────────────
   Overlay de mantenimiento
───────────────────────────────────── */
function setupMaintOverlay(k) {
  const cfg = CURRENCIES[k];
  if (!cfg.returnDate) return;
  const el = document.getElementById(`eta-${k}`);
  if (!el) return;
  const diff = cfg.returnDate - new Date();
  if (diff <= 0) { el.textContent = 'Pronto'; return; }
  const d = Math.floor(diff/86400000), h = Math.floor((diff%86400000)/3600000);
  el.textContent = `Regreso estimado: ${d}d ${h}h`;
}

/* ─────────────────────────────────────
   Recolección
───────────────────────────────────── */
function collectCurrency(k) {
  const cfg = CURRENCIES[k];
  const st  = bankState.currencies[k];
  if (cfg.status === 'maintenance') { toast('⚠️ En mantenimiento'); return; }
  if (!isRunning(k))                { toast('Evento no disponible'); return; }
  if (st.vault === 0)               { toast(`No hay ${cfg.name} para recolectar`); return; }

  const amount = st.vault;
  st.total += amount; st.vault = 0;
  bankState.totalEver += amount;

  updateFill(k); updateBadge(k); updateCardStats(k); updateGlobalStats();
  animateCollect(k, amount);
  log(`Recolectadas ${amount} ${cfg.name}`, 'collect');
  toast(`✅ +${amount} ${cfg.name} recolectadas`);
  saveData();
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
  if (!total) { toast('No hay monedas para recolectar'); return; }
  bankState.totalEver += total;
  updateGlobalStats();
  log(`Recolección total: ${total} monedas`, 'collect');
  toast(`🎁 ¡Recolectaste ${total} monedas en total!`);
  saveData();
}

/* ─────────────────────────────────────
   Animación de recolección
───────────────────────────────────── */
function animateCollect(k, amount) {
  const el = document.getElementById(`piggy-${k}`);
  if (!el) return;
  el.style.animation = 'none';
  requestAnimationFrame(() => {
    el.style.animation = '';
    el.animate([
      { transform: 'scale(1) rotate(0deg)' },
      { transform: 'scale(1.12) rotate(-5deg)', offset: .3 },
      { transform: 'scale(1.12) rotate(5deg)',  offset: .6 },
      { transform: 'scale(1) rotate(0deg)' }
    ], { duration: 500, easing: 'cubic-bezier(.34,1.56,.64,1)' });
  });
  const rect = el.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top  + rect.height / 2;
  for (let i = 0; i < Math.min(amount, 12); i++) {
    setTimeout(() => spawnCoin(cx, cy, CURRENCIES[k].icon), i * 55);
  }
}

function spawnCoin(x, y, icon) {
  const d = document.createElement('div');
  d.textContent = icon;
  Object.assign(d.style, {
    position:'fixed', left:x+'px', top:y+'px', fontSize:'1.4rem',
    pointerEvents:'none', zIndex:'9999', transform:'translate(-50%,-50%)',
  });
  document.body.appendChild(d);
  const ang = Math.random() * Math.PI * 2;
  const dist = 60 + Math.random() * 50;
  d.animate([
    { transform:'translate(-50%,-50%) scale(1)', opacity:1 },
    { transform:`translate(calc(-50% + ${Math.cos(ang)*dist}px), calc(-50% + ${Math.sin(ang)*dist}px)) scale(.3) rotate(${ang*180/Math.PI}deg)`, opacity:0 }
  ], { duration:750, easing:'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => d.remove();
}

/* ─────────────────────────────────────
   Vault door animation
───────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const vaultBtn = document.getElementById('vaultOpenBtn');
  if (vaultBtn) {
    vaultBtn.addEventListener('click', () => {
      const door = document.getElementById('vaultDoor');
      if (door) {
        door.animate([
          { transform:'scale(1) rotate(0deg)' },
          { transform:'scale(1.08) rotate(-8deg)', offset:.4 },
          { transform:'scale(1) rotate(0deg)' }
        ], { duration:600, easing:'cubic-bezier(.34,1.56,.64,1)' });
      }
      let t = 0;
      Object.values(bankState.currencies).forEach(st => t += st.total);
      toast(`🏦 Bóveda maestra: ${t} monedas acumuladas histórico`);
    });
  }
});

/* ─────────────────────────────────────
   Log de actividad
───────────────────────────────────── */
function log(msg, type = 'normal') {
  bankState.log.unshift({ t: Date.now(), msg, type });
  if (bankState.log.length > 120) bankState.log = bankState.log.slice(0, 120);
  renderLog();
}

function renderLog() {
  const el = document.getElementById('activityLog');
  if (!el) return;
  el.innerHTML = bankState.log.slice(0, 25).map(e => {
    const d = new Date(e.t);
    const time = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    return `<div class="log-entry ${e.type}"><span class="log-time">${time}</span><span class="log-msg">${e.msg}</span></div>`;
  }).join('') || '<div class="log-entry"><span class="log-msg" style="color:#3d5070">Sin actividad reciente</span></div>';
}

/* ─────────────────────────────────────
   Sort
───────────────────────────────────── */
function bindEvents() {
  document.getElementById('collectAllBtn')?.addEventListener('click', collectAll);
  document.getElementById('clearLogBtn')?.addEventListener('click', () => {
    bankState.log = [];
    log('Registro limpiado', 'system');
  });

  document.getElementById('sortSelect')?.addEventListener('change', e => {
    const keys = Object.keys(CURRENCIES);
    const sorted = [...keys].sort((a, b) => {
      const sa = bankState.currencies[a];
      const sb = bankState.currencies[b];
      switch(e.target.value) {
        case 'vault-desc':  return sb.vault - sa.vault;
        case 'total-desc':  return sb.total - sa.total;
        case 'rate-asc':    return CURRENCIES[a].rate - CURRENCIES[b].rate;
        default:            return keys.indexOf(a) - keys.indexOf(b);
      }
    });
    const grid = document.getElementById('currencyGrid');
    if (grid) sorted.forEach(k => { const el = document.getElementById(`card-${k}`); if (el) grid.appendChild(el); });
  });
}

/* ─────────────────────────────────────
   Navbar
───────────────────────────────────── */
function setupNavbar() {
  const toggle = document.getElementById('navToggle');
  const links  = document.getElementById('navLinks');
  toggle?.addEventListener('click', e => { e.stopPropagation(); links?.classList.toggle('open') });
  document.addEventListener('click', e => {
    if (!toggle?.contains(e.target) && !links?.contains(e.target)) links?.classList.remove('open');
  });
  document.querySelectorAll('.hud-bar').forEach(b => b.style.setProperty('--v', b.dataset.val || 50));
}

/* ─────────────────────────────────────
   Partículas (azul/dorado)
───────────────────────────────────── */
function setupParticles() {
  const c = document.getElementById('bgParticles');
  if (!c) return;
  const ctx = c.getContext('2d');
  const dpi = Math.max(1, devicePixelRatio || 1);
  let w, h, pts;
  const init = () => {
    w = c.width  = innerWidth  * dpi;
    h = c.height = innerHeight * dpi;
    pts = Array.from({ length: 70 }, () => ({
      x: Math.random()*w, y: Math.random()*h,
      r: (.4 + Math.random()*1.5)*dpi, s: .15 + Math.random()*.5,
      a: .04 + Math.random()*.14,
      hue: Math.random() > .4 ? (210 + Math.random()*30) : (42 + Math.random()*12),
    }));
  };
  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    pts.forEach(p => {
      p.y += p.s; p.x += Math.sin(p.y * .001) * .4;
      if (p.y > h) { p.y = -10; p.x = Math.random()*w; }
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = `hsla(${p.hue},70%,62%,${p.a})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  };
  init(); draw(); addEventListener('resize', init);
}

/* ─────────────────────────────────────
   Parallax
───────────────────────────────────── */
function setupParallax() {
  const layers = Array.from(document.querySelectorAll('.layer'));
  if (!layers.length) return;
  const k = [0, .025, .055, .09];
  const fn = () => { const y = scrollY; layers.forEach((l, i) => l.style.transform = `translateY(${y*k[i]}px)`) };
  fn(); addEventListener('scroll', fn, { passive:true });
}

/* ─────────────────────────────────────
   Reveal on scroll
───────────────────────────────────── */
function setupReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); obs.unobserve(e.target) } });
  }, { threshold: .1 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

/* ─────────────────────────────────────
   Música
───────────────────────────────────── */
function setupMusic() {
  const audio = document.getElementById('bg-music');
  const btn   = document.querySelector('.floating-music');
  if (!audio || !btn) return;
  btn.addEventListener('click', () => {
    audio.paused
      ? audio.play().then(() => { btn.classList.add('active'); localStorage.setItem('music','on') }).catch(()=>{})
      : (audio.pause(), btn.classList.remove('active'), localStorage.setItem('music','off'));
  });
  if (localStorage.getItem('music') === 'on') {
    audio.play().then(() => btn.classList.add('active')).catch(()=>{});
  }
}
window.toggleMusic = function() { document.querySelector('.floating-music')?.click() };

/* ─────────────────────────────────────
   Toast
───────────────────────────────────── */
function toast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 2500);
}

/* ─────────────────────────────────────
   Utilidades
───────────────────────────────────── */
function formatTime(ms, isSeconds = false) {
  if (ms <= 0) return '¡Ahora!';
  if (isSeconds) return `${Math.ceil(ms/1000)}s`;
  const h = Math.floor(ms/3600000);
  const m = Math.floor((ms%3600000)/60000);
  const s = Math.floor((ms%60000)/1000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}