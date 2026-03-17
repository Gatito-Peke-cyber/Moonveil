/**
 * tienda.js — Moonveil Portal Shop v3.0
 * ════════════════════════════════════════════
 * ✅ Todas las secciones de la tienda anterior (pases, cofres, tickets, calkeys, superestrellas, materiales, historia, eventos, monedas, pack coins)
 * ✅ Stock real + restock por tiempo
 * ✅ Flash Sale: fines de semana con descuento aleatorio
 * ✅ Ofertas Sand Brill: artículos al azar con descuento 10-60%, renueva cada 8h
 * ✅ Sistema de cupones mejorado (regulares + temporada + Black Friday)
 * ✅ Precios grandes y visibles
 * ✅ Historial como panel desplegable (FAB)
 * ✅ NPC zorrito con mensajes dinámicos
 * ✅ Firebase Firestore sync
 * ✅ Integración con perfil (títulos, inventario)
 * ✅ startsAt / expiresAt para items con fecha
 */

'use strict';

import { db }          from './firebase.js';
import { onAuthChange } from './auth.js';
import {
  doc, getDoc, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";
import { saveInventory } from './database.js';

/* ══════════════════════════════════════
   HELPERS
══════════════════════════════════════ */
const $ = s => document.querySelector(s);
const wait = ms => new Promise(r => setTimeout(r, ms));
const now = () => Date.now();
const H1  = 3600000;
const H8  = 28800000;
const H24 = 86400000;
const DAY_MS = 86400000;

function parseDate(str) {
  if (!str) return null;
  const d = new Date(str.includes('T') ? str : str + 'T23:59:59');
  return isNaN(d) ? null : d.getTime();
}
function parseDateStart(str) {
  if (!str) return null;
  const d = new Date(str.includes('T') ? str : str + 'T00:00:00');
  return isNaN(d) ? null : d.getTime();
}
function nextMidnightLocal(days = 1) {
  const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() + days);
  return d.getTime();
}
function fmtTime(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}
function timeAgo(iso) {
  const s = Math.floor((Date.now()-new Date(iso))/1000);
  if (s<60) return 'hace un momento';
  if (s<3600) return `hace ${Math.floor(s/60)}m`;
  if (s<86400) return `hace ${Math.floor(s/3600)}h`;
  return `hace ${Math.floor(s/86400)}d`;
}
function isWeekend() {
  const d = new Date().getDay();
  return d === 0 || d === 6;
}
function randInt(min, max) { return Math.floor(Math.random()*(max-min+1))+min; }

/* ══════════════════════════════════════
   LOCALSTORAGE
══════════════════════════════════════ */
const LS = {
  inventory:  'mv_inventory',
  purchases:  'mv_shop_purchases',
  onetime:    'mv_shop_onetime',
  coupon:     'mv_current_coupon',
  couponState:'mv_coupon_state',
  scActive:   'mv_sc_active',
  flash:      'mv_flash_sale',
  sandbrill:  'mv_sandbrill_state',
};
function lsGet(k, fb=null) { try{const v=localStorage.getItem(k);return v!==null?JSON.parse(v):fb;}catch{return fb;} }
function lsSet(k, v)       { try{localStorage.setItem(k,JSON.stringify(v));}catch{} }

/* ══════════════════════════════════════
   FIREBASE
══════════════════════════════════════ */
let currentUID = null, syncTimeout = null;
function scheduleSync() { if (!currentUID) return; clearTimeout(syncTimeout); syncTimeout = setTimeout(doSync, 2500); }
async function doSync() {
  if (!currentUID) return;
  try {
    const inv = lsGet(LS.inventory, {tickets:0,keys:0,superstar_keys:0});
    const hist = lsGet(LS.purchases, []);
    const gachaTickets = {};
    ['classic','dark_moon','spring','storm','cyber','abyss','event','elemental'].forEach(id => {
      gachaTickets[id] = parseInt(localStorage.getItem(`mv_tickets_${id}`)||'0',10);
    });
    await updateDoc(doc(db,'users',currentUID), {
      inventory: inv, shop_purchases: hist, gacha_tickets: gachaTickets,
      updatedAt: serverTimestamp()
    });
  } catch(e) { console.warn('[Shop] sync:', e); }
}
async function loadFromFirebase(uid) {
  try {
    const snap = await getDoc(doc(db,'users',uid)); if (!snap.exists()) return;
    const d = snap.data();
    if (d.inventory) {
      const cur = lsGet(LS.inventory, {tickets:0,keys:0,superstar_keys:0});
      const merged = {
        tickets:      Math.max(cur.tickets||0,      d.inventory.tickets||0),
        keys:         Math.max(cur.keys||0,          d.inventory.keys||0),
        superstar_keys:Math.max(cur.superstar_keys||0,d.inventory.superstar_keys||0),
      };
      lsSet(LS.inventory, merged);
    }
    if (d.gacha_tickets) {
      Object.entries(d.gacha_tickets).forEach(([rid,count]) => {
        const lsKey = `mv_tickets_${rid}`;
        const local = parseInt(localStorage.getItem(lsKey)||'-1',10);
        localStorage.setItem(lsKey, String(Math.max(local<0?0:local, count||0)));
      });
    }
    if (d.shop_purchases && Array.isArray(d.shop_purchases)) {
      const local = lsGet(LS.purchases, []);
      if (d.shop_purchases.length > local.length) lsSet(LS.purchases, d.shop_purchases);
    }
  } catch(e) { console.warn('[Shop] load:', e); }
}

/* ══════════════════════════════════════
   INVENTARIO
══════════════════════════════════════ */
function getInventory()  { return lsGet(LS.inventory, {tickets:0,keys:0,superstar_keys:0}); }
function setInventory(inv) {
  lsSet(LS.inventory, inv); renderHUD();
  if (currentUID) saveInventory(currentUID, inv).catch(()=>{});
  scheduleSync();
}
function getGachaTickets(id) { return Math.max(0, parseInt(localStorage.getItem(`mv_tickets_${id}`)||'0',10)); }
function addGachaTickets(id, count) {
  const cur = getGachaTickets(id);
  localStorage.setItem(`mv_tickets_${id}`, String(cur+count));
  renderHUD(); scheduleSync();
}
function renderHUD() {
  const inv = getInventory();
  const allWheels = ['classic','dark_moon','spring','storm','cyber','abyss','event','elemental'];
  const gachaTotal = allWheels.reduce((s,id)=>s+getGachaTickets(id), 0);
  const totalTkts  = (inv.tickets||0) + gachaTotal;
  const set = (id,v) => { const el=$(id); if(el) el.textContent = v; };
  const s1=$('#hudTicketsTotal .his-val'); if(s1) s1.textContent = totalTkts;
  const s2=$('#hudKeys .his-val');         if(s2) s2.textContent = inv.keys||0;
  const s3=$('#hudSuperKeys .his-val');    if(s3) s3.textContent = inv.superstar_keys||0;
  set('#heroTickets',  totalTkts);
  set('#heroKeys',     inv.keys||0);
  set('#heroSuperKeys',inv.superstar_keys||0);
}

/* ══════════════════════════════════════
   STOCK MANAGEMENT
══════════════════════════════════════ */
const RESTOCK_DAYS = { '24h':1, '7d':7, '30d':30 };
const StockLS = {
  get(id, def)  { const v=localStorage.getItem(`mv_stock_${id}`); return v==null?def:Math.max(0,parseInt(v,10)||0); },
  set(id, v)    { localStorage.setItem(`mv_stock_${id}`, String(Math.max(0,v|0))); },
  getNext(id)   { const v=localStorage.getItem(`mv_restock_${id}`); return v==null?null:(v==='null'?null:Number(v)); },
  setNext(id,ts){ localStorage.setItem(`mv_restock_${id}`, ts==null?'null':String(ts)); },
};
function initStock(p) {
  if (localStorage.getItem(`mv_stock_${p.id}`) == null) StockLS.set(p.id, p.stock);
  const ts = StockLS.getNext(p.id);
  if (ts && ts <= now()) {
    StockLS.set(p.id, p.stock);
    const days = p.restock ? RESTOCK_DAYS[p.restock] : null;
    StockLS.setNext(p.id, days ? nextMidnightLocal(days) : null);
  }
}
function buyStock(p) {
  const s = StockLS.get(p.id, p.stock);
  if (s <= 0) return false;
  StockLS.set(p.id, s-1);
  if ((s-1) <= 0 && p.restock) {
    const days = RESTOCK_DAYS[p.restock];
    if (days) StockLS.setNext(p.id, nextMidnightLocal(days));
  }
  return true;
}

/* ══════════════════════════════════════
   ONE-TIME / DAILY
══════════════════════════════════════ */
function getOneTime()  { return lsGet(LS.onetime, {}); }
function isProductClaimed(p) {
  const ot = getOneTime();
  if (p.onetime && ot[p.id]) return true;
  if (p.daily) return ot[`daily_${p.id}`] === new Date().toDateString();
  return false;
}
function markClaimed(p) {
  const ot = getOneTime();
  if (p.onetime) ot[p.id] = Date.now();
  if (p.daily)   ot[`daily_${p.id}`] = new Date().toDateString();
  lsSet(LS.onetime, ot);
}

/* ══════════════════════════════════════
   FLASH SALE SYSTEM
   Activo siempre, pero con descuento extra los fines de semana
══════════════════════════════════════ */
let flashDiscount = 0;
let flashUntil    = 0;
const FLASH_KEY   = 'mv_flash_sale_v2';

function initFlashSale() {
  const saved = lsGet(FLASH_KEY, null);
  const weekend = isWeekend();

  if (saved && saved.until > now() && saved.weekend === weekend) {
    flashDiscount = saved.discount;
    flashUntil    = saved.until;
  } else {
    // Generar nuevo flash sale
    if (weekend) {
      flashDiscount = randInt(15, 40);  // fines de semana: más generoso
    } else {
      flashDiscount = randInt(5, 20);   // días normales: menor
    }
    // Expira a la próxima medianoche
    flashUntil = nextMidnightLocal(1);
    lsSet(FLASH_KEY, { discount: flashDiscount, until: flashUntil, weekend });
  }

  renderFlashBanner();
}

function renderFlashBanner() {
  const fbEl    = $('#flashDiscount');
  const timerEl = $('#flashTimer');
  const textEl  = $('#flashText');
  const banner  = $('#flashBanner');
  if (!fbEl) return;

  const weekend = isWeekend();
  fbEl.textContent = `-${flashDiscount}%`;
  if (textEl) {
    textEl.textContent = weekend
      ? `¡FLASH SALE DE FIN DE SEMANA! Descuento activo en toda la tienda`
      : `¡OFERTA DIARIA! Descuento en toda la tienda`;
  }
  if (banner) {
    banner.style.borderColor = weekend ? 'rgba(239,68,68,0.7)' : 'var(--a2)';
  }
}

function updateFlashTimer() {
  const el = $('#flashTimer');
  if (!el) return;
  const remaining = Math.max(0, flashUntil - now());
  el.textContent = fmtTime(remaining);
  if (remaining === 0) { initFlashSale(); renderProducts(); }
}

/* ══════════════════════════════════════
   SAND BRILL DEALS
   8 artículos al azar con descuento 10-60%, cada 8h
══════════════════════════════════════ */
let sandbrillDeals = [];
let sandbrillUntil = 0;
const SB_KEY = 'mv_sandbrill_v2';

function initSandBrill() {
  const saved = lsGet(SB_KEY, null);
  if (saved && saved.until > now()) {
    sandbrillDeals = saved.deals;
    sandbrillUntil = saved.until;
  } else {
    rollSandBrill();
  }
  renderSandBrill();
}

function rollSandBrill() {
  // Elegir 5-6 productos al azar que tengan precio > 0
  const eligible = PRODUCTS.filter(p => p.price > 0 && p.stock !== 0);
  const shuffled = [...eligible].sort(() => Math.random()-0.5);
  const picks    = shuffled.slice(0, Math.min(6, shuffled.length));
  sandbrillDeals = picks.map(p => ({
    id:       p.id,
    discount: randInt(10, 60),
  }));
  sandbrillUntil = now() + H8;
  lsSet(SB_KEY, { deals: sandbrillDeals, until: sandbrillUntil });
}

function updateSandbrillTimer() {
  const el = $('#sandbrillTimer');
  if (!el) return;
  const remaining = Math.max(0, sandbrillUntil - now());
  el.textContent = fmtTime(remaining);
  if (remaining === 0) { rollSandBrill(); renderSandBrill(); }
}

function renderSandBrill() {
  const grid = $('#sandbrillGrid');
  if (!grid) return;
  if (!sandbrillDeals.length) { grid.innerHTML='<p style="font-family:var(--font-pixel);font-size:0.28rem;color:var(--muted);padding:12px">Sin ofertas disponibles ahora.</p>'; return; }

  const couponPct = getCurrentCouponPct();

  grid.innerHTML = sandbrillDeals.map(deal => {
    const p = PRODUCTS.find(x => x.id === deal.id);
    if (!p) return '';
    const st     = StockLS.get(p.id, p.stock);
    const isOut  = st <= 0;
    const baseDisc = deal.discount;
    const extraDisc = couponPct;
    const totalDisc = Math.min(90, baseDisc + extraDisc);
    const final  = Math.max(1, Math.round(p.price - p.price * totalDisc / 100));
    const isDisabled = isOut || isProductClaimed(p);

    return `<div class="sb-card">
      <div class="sb-card-badge">-${totalDisc}% SAND BRILL</div>
      <div class="sb-card-icon">${p.icon}</div>
      <div class="sb-card-name">${p.name}</div>
      <div class="sb-price-row">
        <span class="sb-price-old">⟡${p.price}</span>
        <span class="sb-price-new">⟡${final}</span>
      </div>
      <div style="font-family:var(--font-pixel);font-size:0.2rem;color:var(--muted);margin-top:4px">📦 Stock: ${st}</div>
      <button class="sb-btn" data-id="${p.id}" data-sbdisc="${totalDisc}" ${isDisabled?'disabled':''}>
        ${isOut?'AGOTADO':isProductClaimed(p)?'RECLAMADO':'COMPRAR'}
      </button>
    </div>`;
  }).join('');

  grid.querySelectorAll('.sb-btn:not(:disabled)').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = PRODUCTS.find(x => x.id === btn.dataset.id);
      if (p) showConfirmModal(p, parseInt(btn.dataset.sbdisc||'0', 10));
    });
  });
}

/* ══════════════════════════════════════
   CUPONES
══════════════════════════════════════ */
const ALL_COUPONS = [10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100];

const SEASONAL_COUPONS = [
  { id:'sv_2026',      name:'💗 San Valentín',style:'valentine', discount:30, startDate:'2026-02-10', endDate:'2026-02-15', maxUses:5, resetDate:'2026-02-13' },
  { id:'newyear_2026', name:'🎆 Año Nuevo',   style:'newyear',   discount:25, startDate:'2025-12-31', endDate:'2026-01-06', maxUses:3, resetDate:'2026-01-01' },
  { id:'halloween_2026',name:'🎃 Halloween',  style:'halloween', discount:40, startDate:'2026-10-25', endDate:'2026-11-01', maxUses:3, resetDate:'2026-10-31' },
  { id:'navidad_2026', name:'🎄 Navidad',     style:'christmas', discount:35, startDate:'2026-12-01', endDate:'2026-12-30', maxUses:5, resetDate:'2026-12-25' },
];

const BLACK_FRIDAY = {
  id:'blackfriday', name:'BLACK FRIDAY', style:'blackfriday', discount:'random', unlimited:true,
  periods:[
    { startDate:'2026-03-02', endDate:'2026-03-03' },
    { startDate:'2026-04-01', endDate:'2026-04-02' },
    { startDate:'2026-11-27', endDate:'2026-11-30' },
  ],
};

let currentCoupon    = Number(localStorage.getItem(LS.coupon)||'0');
let currentScId      = localStorage.getItem(LS.scActive)||null;
let bfCurrentDiscount = null;

function todayStr() { return new Date().toISOString().slice(0,10); }
function isDateInRange(s, e) { const t=todayStr(); return t>=s&&t<=e; }
function isScActive(sc) {
  if (sc.periods) return sc.periods.some(p=>isDateInRange(p.startDate,p.endDate));
  return isDateInRange(sc.startDate, sc.endDate);
}

function getCouponCooldown(pct) { const s=lsGet(LS.couponState,{}); return Number(s[String(pct)]||0); }
function setCouponCooldown(pct,ts){ const s=lsGet(LS.couponState,{}); s[String(pct)]=ts||0; lsSet(LS.couponState,s); }

function getScUsesLeft(sc) {
  const raw = lsGet(`mv_sc_${sc.id}`,null);
  if (!raw) return sc.maxUses;
  const today = todayStr(), state = raw;
  if (sc.resetDate && today>=sc.resetDate && (state.lastReset||'')<sc.resetDate) {
    state.usesLeft = sc.maxUses; state.lastReset = today;
    lsSet(`mv_sc_${sc.id}`, state);
  }
  return state.usesLeft ?? sc.maxUses;
}
function decrementScUses(sc) {
  const raw = lsGet(`mv_sc_${sc.id}`, { usesLeft: sc.maxUses, lastReset: todayStr() });
  raw.usesLeft = Math.max(0, (raw.usesLeft ?? sc.maxUses)-1);
  lsSet(`mv_sc_${sc.id}`, raw);
}

function getCurrentCouponPct() { return currentCoupon || 0; }

function computeFinalPrice(basePrice, extraDiscount = 0) {
  const couponPct = getCurrentCouponPct();
  const totalDisc = Math.min(100, couponPct + extraDiscount);
  if (totalDisc <= 0) return basePrice;
  return Math.max(0, Math.round(basePrice - basePrice * totalDisc / 100));
}

function renderCouponUI() {
  const box = $('#couponList'); if (!box) return;
  const n = now();

  // Validar SC guardado
  const allSCs = [...SEASONAL_COUPONS, BLACK_FRIDAY];
  if (currentScId) {
    const sc = allSCs.find(s=>s.id===currentScId);
    if (!sc || !isScActive(sc)) {
      currentScId = null; bfCurrentDiscount = null; currentCoupon = 0;
      localStorage.removeItem(LS.scActive); localStorage.setItem(LS.coupon,'0');
    }
  }

  const activeSCs = allSCs.filter(sc => isScActive(sc));
  let html = '';

  if (activeSCs.length > 0) {
    activeSCs.forEach(sc => {
      const isSelected = currentScId === sc.id;
      if (sc.id === BLACK_FRIDAY.id) {
        const discLabel = (isSelected && bfCurrentDiscount) ? `🎲 ${bfCurrentDiscount}% OFF` : '% Aleatorio';
        html += `<button class="coupon-card sc-coupon sc-blackfriday" data-sc-id="${sc.id}" data-active="${isSelected}">
          <span class="coupon-pct" style="color:#fbbf24;font-size:0.42rem">🖤 BLACK FRIDAY</span>
          <span class="coupon-lbl">${discLabel}</span>
          <span class="coupon-cd">∞ Sin límite</span>
        </button>`;
      } else {
        const usesLeft = getScUsesLeft(sc), exhausted = usesLeft<=0;
        html += `<button class="coupon-card sc-coupon sc-${sc.style}${exhausted?' sc-exhausted':''}" data-sc-id="${sc.id}" data-active="${isSelected}" ${exhausted?'aria-disabled="true"':''}>
          <span class="coupon-pct">${sc.discount}%</span>
          <span class="coupon-lbl">${sc.name}</span>
          <span class="coupon-cd">${usesLeft}/${sc.maxUses} usos</span>
        </button>`;
      }
    });
    html += `<div class="coupon-sep">── Cupones regulares ──</div>`;
  }

  // Limpiar cooldowns expirados
  const state = lsGet(LS.couponState, {});
  let dirty = false;
  ALL_COUPONS.forEach(c => { if (Number(state[c]||0) > 0 && Number(state[c]) <= n) { state[c]=0; dirty=true; } });
  if (dirty) lsSet(LS.couponState, state);

  ALL_COUPONS.forEach(c => {
    const cd       = getCouponCooldown(c);
    const onCD     = cd > n;
    const selected = currentCoupon === c && !currentScId;
    if (onCD) {
      html += `<button class="coupon-card" aria-disabled="true" data-percent="${c}">
        <span class="coupon-pct">${c}%</span>
        <span class="coupon-cd">↻ ${fmtTime(cd-n)}</span>
      </button>`;
    } else {
      html += `<button class="coupon-card" data-percent="${c}" data-active="${selected}">
        <span class="coupon-pct">${c}%</span>
        ${selected?'<span class="coupon-lbl" style="color:#4ade80">✓ ACTIVO</span>':''}
      </button>`;
    }
  });

  box.innerHTML = html;

  // Badge cupón activo
  const badge = $('#couponActiveBadge');
  if (badge) {
    if (currentCoupon > 0) {
      badge.textContent = `-${currentCoupon}% ACTIVO`;
      badge.style.display = '';
    } else {
      badge.style.display = 'none';
    }
  }

  // Listeners SC
  box.querySelectorAll('.sc-coupon:not([aria-disabled="true"])').forEach(btn => {
    btn.addEventListener('click', () => {
      const scId = btn.dataset.scId;
      if (currentScId === scId) {
        currentScId = null; bfCurrentDiscount = null; currentCoupon = 0;
        localStorage.removeItem(LS.scActive); localStorage.setItem(LS.coupon,'0');
        toast('🎟️ Cupón desactivado','info');
      } else {
        const sc = allSCs.find(s=>s.id===scId); if (!sc) return;
        currentScId = scId;
        localStorage.setItem(LS.scActive, scId);
        if (sc.id === BLACK_FRIDAY.id) {
          bfCurrentDiscount = randInt(10,50);
          currentCoupon = bfCurrentDiscount;
          toast(`🖤 BLACK FRIDAY activado — ${bfCurrentDiscount}% OFF`,'success');
        } else {
          currentCoupon = sc.discount;
          toast(`${sc.name} activado — ${sc.discount}% OFF`,'success');
        }
        localStorage.setItem(LS.coupon, String(currentCoupon));
      }
      renderCouponUI(); renderProducts(); renderSandBrill();
    });
  });

  // Listeners regulares
  box.querySelectorAll('.coupon-card:not([aria-disabled="true"]):not(.sc-coupon)').forEach(btn => {
    btn.addEventListener('click', () => {
      const pct = Number(btn.dataset.percent);
      if (currentScId) { currentScId = null; bfCurrentDiscount = null; localStorage.removeItem(LS.scActive); }
      currentCoupon = (currentCoupon === pct && !currentScId) ? 0 : pct;
      localStorage.setItem(LS.coupon, String(currentCoupon));
      renderCouponUI(); renderProducts(); renderSandBrill();
    });
  });
}

/* ══════════════════════════════════════
   PRODUCTS CATALOG
══════════════════════════════════════ */
const PRODUCTS = [

  /* ── PASES DE TEMPORADA ── */
  { id:'s1',  cat:'pases', icon:'🏆', name:'Pase Reino del Hielo Eterno — T.I',    img:'img-pass/banwar.jpg',      rarity:'legend', price:128, stock:1, restock:null, startsAt:'2026-01-01', expiresAt:'2026-01-31', badge:'limited', desc:'Desbloquea recompensas de Enero. Tier Hierro activado al comprar.',    tags:[{t:'pase',l:'PASE TEMP'}],  give:{type:'pass',passId:'pass_s1'}  },
  { id:'s2',  cat:'pases', icon:'🏆', name:'Pase Corazones de Redstone — T.II',    img:'img-pass/banhall.jpg',     rarity:'legend', price:128, stock:1, restock:null, startsAt:'2026-02-01', expiresAt:'2026-02-28', badge:'new',     desc:'Desbloquea recompensas de Febrero.',    tags:[{t:'pase',l:'PASE TEMP'}],  give:{type:'pass',passId:'pass_s2'}  },
  { id:'s3',  cat:'pases', icon:'🏆', name:'Pase Despertar de la Naturaleza — T.III',img:'img-pass/partymine.jpg', rarity:'legend', price:128, stock:1, restock:null, startsAt:'2026-03-01', expiresAt:'2026-03-31', badge:null,      desc:'Desbloquea recompensas de Marzo.',      tags:[{t:'pase',l:'PASE TEMP'}],  give:{type:'pass',passId:'pass_s3'}  },
  { id:'s4',  cat:'pases', icon:'🏆', name:'Pase Cántico de la Lluvia — T.IV',     img:'img-pass/chrismine.jpg',  rarity:'legend', price:128, stock:1, restock:null, startsAt:'2026-04-01', expiresAt:'2026-04-30', badge:null,      desc:'Desbloquea recompensas de Abril.',      tags:[{t:'pase',l:'PASE TEMP'}],  give:{type:'pass',passId:'pass_s4'}  },
  { id:'s5',  cat:'pases', icon:'🏆', name:'Pase Esencia de la Aurora — T.V',      img:'img-pass/añomine.jpg',    rarity:'legend', price:128, stock:1, restock:null, startsAt:'2026-05-01', expiresAt:'2026-05-31', badge:null,      desc:'Desbloquea recompensas de Mayo.',       tags:[{t:'pase',l:'PASE TEMP'}],  give:{type:'pass',passId:'pass_s5'}  },
  { id:'s6',  cat:'pases', icon:'🏆', name:'Pase Imperio del Océano — T.VI',       img:'img-pass/banair.jpg',     rarity:'legend', price:128, stock:1, restock:null, startsAt:'2026-06-01', expiresAt:'2026-06-30', badge:null,      desc:'Desbloquea recompensas de Junio.',      tags:[{t:'pase',l:'PASE TEMP'}],  give:{type:'pass',passId:'pass_s6'}  },
  { id:'s7',  cat:'pases', icon:'🏆', name:'Pase Reinos Dorados — T.VII',          img:'img-pass/dancingmine.jpg',rarity:'legend', price:128, stock:1, restock:null, startsAt:'2026-07-01', expiresAt:'2026-07-31', badge:null,      desc:'Desbloquea recompensas de Julio.',      tags:[{t:'pase',l:'PASE TEMP'}],  give:{type:'pass',passId:'pass_s7'}  },
  { id:'s8',  cat:'pases', icon:'🏆', name:'Pase Sombras de la Noche — T.VIII',    img:'img-pass/squemine.jpg',   rarity:'legend', price:128, stock:1, restock:null, startsAt:'2026-08-01', expiresAt:'2026-08-31', badge:null,      desc:'Desbloquea recompensas de Agosto.',     tags:[{t:'pase',l:'PASE TEMP'}],  give:{type:'pass',passId:'pass_s8'}  },
  { id:'s9',  cat:'pases', icon:'🏆', name:'Pase Mundo Encantado — T.IX',          img:'img-pass/squemine.jpg',   rarity:'legend', price:128, stock:1, restock:null, startsAt:'2026-09-01', expiresAt:'2026-09-30', badge:null,      desc:'Desbloquea recompensas de Septiembre.', tags:[{t:'pase',l:'PASE TEMP'}],  give:{type:'pass',passId:'pass_s9'}  },
  { id:'s10', cat:'pases', icon:'🏆', name:'Pase Pesadilla del Nether — T.X',      img:'img-pass/squemine.jpg',   rarity:'legend', price:128, stock:1, restock:null, startsAt:'2026-10-01', expiresAt:'2026-10-31', badge:null,      desc:'Desbloquea recompensas de Octubre.',    tags:[{t:'pase',l:'PASE TEMP'}],  give:{type:'pass',passId:'pass_s10'} },
  { id:'s11', cat:'pases', icon:'🏆', name:'Pase Guardianes del Invierno — T.XI',  img:'img-pass/squemine.jpg',   rarity:'legend', price:128, stock:1, restock:null, startsAt:'2026-11-01', expiresAt:'2026-11-30', badge:null,      desc:'Desbloquea recompensas de Noviembre.',  tags:[{t:'pase',l:'PASE TEMP'}],  give:{type:'pass',passId:'pass_s11'} },
  { id:'s12', cat:'pases', icon:'🏆', name:'Pase Estrella de Ender — T.XII',       img:'img-pass/squemine.jpg',   rarity:'legend', price:128, stock:1, restock:null, startsAt:'2026-12-01', expiresAt:'2026-12-31', badge:null,      desc:'Desbloquea recompensas de Diciembre.',  tags:[{t:'pase',l:'PASE TEMP'}],  give:{type:'pass',passId:'pass_s12'} },

  /* ── COFRES ── */
  { id:'k1', cat:'llaves', icon:'🗝️', name:'Cofre de Ámbar',       img:'img/chest2.gif', rarity:'epic',   price:30,  stock:10, restock:'7d',  badge:'hot',     desc:'Abre este cofre de Ámbar.',                tags:[{t:'keys',l:'COFRE ÉPICO'}],  give:{type:'chest',chestId:'amber'},     onetime:false },
  { id:'k2', cat:'llaves', icon:'🗝️', name:'Cofre de Sueños',      img:'img/chest2.gif', rarity:'epic',   price:30,  stock:10, restock:'7d',  badge:null,      desc:'Abre este cofre de los Sueños.',           tags:[{t:'keys',l:'COFRE ÉPICO'}],  give:{type:'chest',chestId:'dreams'},    onetime:false },
  { id:'k3', cat:'llaves', icon:'🗝️', name:'Cofre de Moonveil',    img:'img/chest2.gif', rarity:'legend', price:10,  stock:10, restock:'7d',  badge:'hot',     desc:'Abre este cofre Moon-Veil.',               tags:[{t:'keys',l:'COFRE LEGEND'}], give:{type:'chest',chestId:'moonveil'},  onetime:false },
  { id:'k4', cat:'llaves', icon:'🗝️', name:'Cofre de Moonveil II', img:'img/chest2.gif', rarity:'legend', price:30,  stock:5,  restock:'7d',  badge:'limited', desc:'Abre este cofre Moon por ████.',           tags:[{t:'keys',l:'COFRE LEGEND'}], give:{type:'chest',chestId:'moonveil2'}, onetime:false },

  /* ── TICKETS ── */
  { id:'t_classic_1',   cat:'tickets', icon:'🎫', name:'Ticket Clásico',            img:'imagen/ticket5.jpg', rarity:'epic',   price:10,  stock:10, restock:'24h', badge:'hot',  desc:'Ticket para la Ruleta Clásica.',      tags:[{t:'tickets',l:'x1 CLÁSICA'}],   give:{type:'gacha_tickets',wheel:'classic',count:1},   onetime:false },
  { id:'t_classic_5',   cat:'tickets', icon:'💎', name:'Ticket Clásico x5',         img:'imagen/ticket5.jpg', rarity:'epic',   price:30,  stock:10, restock:'24h', badge:null,   desc:'5 tickets para la Ruleta Clásica.',   tags:[{t:'tickets',l:'x5 CLÁSICA'}],   give:{type:'gacha_tickets',wheel:'classic',count:5},   onetime:false },
  { id:'t_classic_10',  cat:'tickets', icon:'💎', name:'Pack Clásico x10',          img:'imagen/ticket5.jpg', rarity:'epic',   price:50,  stock:10, restock:'24h', badge:'sale', desc:'10 tickets clásicos. Valor ideal.',   tags:[{t:'tickets',l:'x10 CLÁSICA'}],  give:{type:'gacha_tickets',wheel:'classic',count:10},  onetime:false },
  { id:'t_classic_bienvenida',cat:'tickets',icon:'🎉',name:'¡Bienvenida a los tickets!',img:'imagen/ticket5.jpg',rarity:'epic',price:0,stock:1,restock:null,badge:'hot',desc:'Regalo de bienvenida: 10 tickets clásicos.',tags:[{t:'tickets',l:'x10 CLÁSICA'},{t:'free',l:'GRATIS'}],give:{type:'gacha_tickets',wheel:'classic',count:10},onetime:true },
  { id:'t_classic_free', cat:'tickets', icon:'🎰', name:'Tiros Gratis (mensual)',    img:'imagen/ticket5.jpg', rarity:'epic',   price:0,   stock:1,  restock:'30d', badge:'new',  desc:'10 tickets clásicos gratis, ¡reclámalos!',tags:[{t:'tickets',l:'x10 CLÁSICA'},{t:'free',l:'MENSUAL'}],give:{type:'gacha_tickets',wheel:'classic',count:10},onetime:false,daily:false },
  { id:'t_elemental_1', cat:'tickets', icon:'🎫', name:'Ticket Elemental',          img:'imagen/ticket5.jpg', rarity:'epic',   price:10,  stock:10, restock:'24h', badge:null,   desc:'Ticket para la Ruleta Elemental.',    tags:[{t:'tickets',l:'x1 ELEMENTAL'}], give:{type:'gacha_tickets',wheel:'elemental',count:1}, onetime:false },
  { id:'t_elemental_5', cat:'tickets', icon:'🎫', name:'Pack Elemental x5',         img:'imagen/ticket5.jpg', rarity:'epic',   price:40,  stock:5,  restock:'7d',  badge:null,   desc:'5 tickets elementales.',              tags:[{t:'tickets',l:'x5 ELEMENTAL'}], give:{type:'gacha_tickets',wheel:'elemental',count:5}, onetime:false },
  { id:'t_event_1',     cat:'tickets', icon:'🎫', name:'Ticket de Evento',          img:'imagen/ticket5.jpg', rarity:'epic',   price:10,  stock:10, restock:'24h', badge:null,   desc:'Ticket para la Ruleta de Eventos.',   tags:[{t:'tickets',l:'x1 EVENTO'}],    give:{type:'gacha_tickets',wheel:'event',count:1},    onetime:false },
  { id:'t_event_5',     cat:'tickets', icon:'🎫', name:'Pack Evento x5',            img:'imagen/ticket5.jpg', rarity:'epic',   price:40,  stock:5,  restock:'7d',  badge:'new',  desc:'5 tickets de eventos.',               tags:[{t:'tickets',l:'x5 EVENTO'}],    give:{type:'gacha_tickets',wheel:'event',count:5},    onetime:false },

  /* ── LLAVES DEL CALENDARIO ── */
  { id:'ck_normal',   cat:'calkeys', icon:'🔵', name:'Llave Normal',                    img:'img/keys1.jpg', rarity:'rare',   price:30,  stock:10, restock:'7d',  badge:'hot', desc:'Recupera un día perdido en el Calendario de Recompensas.',  tags:[{t:'keys',l:'LLAVE NORMAL'}],    give:{type:'calkey',keyType:'normal',amount:1},  onetime:false },
  { id:'ck_pink',     cat:'calkeys', icon:'💗', name:'Llave Rosa',                      img:'img/keys1.jpg', rarity:'epic',   price:50,  stock:5,  restock:'30d', badge:null,  desc:'Llave de San Valentín y Día de la Madre. Da ×2 en XP.',    tags:[{t:'keys',l:'LLAVE ROSA'}],      give:{type:'calkey',keyType:'pink',amount:1},    onetime:false },
  { id:'ck_green',    cat:'calkeys', icon:'🟢', name:'Llave Verde',                     img:'img/keys1.jpg', rarity:'epic',   price:50,  stock:5,  restock:'30d', badge:null,  desc:'Llave de Navidad y Año Nuevo. Da ×2 en XP.',               tags:[{t:'keys',l:'LLAVE VERDE'}],     give:{type:'calkey',keyType:'green',amount:1},   onetime:false },
  { id:'ck_orange',   cat:'calkeys', icon:'🎃', name:'Llave Naranja',                   img:'img/keys1.jpg', rarity:'epic',   price:50,  stock:5,  restock:'30d', badge:null,  desc:'Llave de Halloween y Black Friday.',                       tags:[{t:'keys',l:'LLAVE NARANJA'}],   give:{type:'calkey',keyType:'orange',amount:1},  onetime:false },
  { id:'ck_cat',      cat:'calkeys', icon:'😺', name:'Llave Gato',                      img:'img/keys1.jpg', rarity:'epic',   price:60,  stock:3,  restock:'30d', badge:null,  desc:'Llave del Día del Gato. Da ×3 en la barra. ¡Meow!',       tags:[{t:'keys',l:'LLAVE GATO'}],      give:{type:'calkey',keyType:'cat',amount:1},     onetime:false },
  { id:'ck_special',  cat:'calkeys', icon:'💜', name:'Llave Especial',                  img:'img/keys1.jpg', rarity:'epic',   price:60,  stock:3,  restock:'30d', badge:null,  desc:'Para días únicos: Día de la Tierra, del Agua, del Niño.',  tags:[{t:'keys',l:'LLAVE ESPECIAL'}],  give:{type:'calkey',keyType:'special',amount:1}, onetime:false },
  { id:'ck_future',   cat:'calkeys', icon:'⏩', name:'Llave Futuro',                    img:'img/keys1.jpg', rarity:'legend', price:100, stock:2,  restock:'30d', badge:'limited',desc:'¡Rarísima! Permite reclamar días futuros.',             tags:[{t:'keys',l:'LLAVE FUTURO'},{t:'bonus',l:'RARA'}],give:{type:'calkey',keyType:'future',amount:1},onetime:false },
  { id:'ck_pack_all', cat:'calkeys', icon:'🎁', name:'Pack Definitivo — 1 de Cada',     img:'img/keys1.jpg', rarity:'legend', price:280, stock:1,  restock:'30d', badge:'limited',desc:'¡Pack supremo! 1 llave de cada tipo.',                  tags:[{t:'keys',l:'PACK COMPLETO'}],   give:{type:'calkey_multi',keys:{normal:1,pink:1,green:1,orange:1,cat:1,special:1,future:1}}, onetime:false },

  /* ── SUPERESTRELLAS ── */
  { id:'sk_common',    cat:'superestrellas', icon:'⭐', name:'Llave Superestrella',             img:'img/keys1.jpg', rarity:'common', price:20,  stock:20, restock:'24h', badge:null,      desc:'Llave para abrir el Cofre Común.',               tags:[{t:'super',l:'COFRE COMÚN'}],    give:{type:'superkey',keyId:'key_common',amount:1},   onetime:false },
  { id:'sk_rare',      cat:'superestrellas', icon:'💫', name:'Llave Superestrella Brillante',   img:'img/keys1.jpg', rarity:'rare',   price:40,  stock:15, restock:'24h', badge:null,      desc:'Llave para abrir el Cofre Raro.',                tags:[{t:'super',l:'COFRE RARO'}],     give:{type:'superkey',keyId:'key_rare',amount:1},     onetime:false },
  { id:'sk_special',   cat:'superestrellas', icon:'✨', name:'Llave Superestrella Especial',    img:'img/keys1.jpg', rarity:'epic',   price:80,  stock:10, restock:'7d',  badge:null,      desc:'Llave para abrir el Cofre Especial.',            tags:[{t:'super',l:'COFRE ESPECIAL'}], give:{type:'superkey',keyId:'key_special',amount:1},  onetime:false },
  { id:'sk_epic',      cat:'superestrellas', icon:'🔮', name:'Llave Superestrella Épica',       img:'img/keys1.jpg', rarity:'epic',   price:160, stock:5,  restock:'7d',  badge:null,      desc:'Llave para abrir el Cofre Épico.',               tags:[{t:'super',l:'COFRE ÉPICO'}],    give:{type:'superkey',keyId:'key_epic',amount:1},     onetime:false },
  { id:'sk_legendary', cat:'superestrellas', icon:'👑', name:'Llave Superestrella Legendaria',  img:'img/keys1.jpg', rarity:'legend', price:320, stock:3,  restock:'7d',  badge:'limited', desc:'Llave para abrir el Cofre Legendario.',          tags:[{t:'super',l:'COFRE LEGEND'}],   give:{type:'superkey',keyId:'key_legendary',amount:1},onetime:false },
  { id:'sk_pack_starter',cat:'superestrellas',icon:'📦',name:'Pack Inicio — Común ×3 + Brillante ×1',img:'img/keys1.jpg',rarity:'rare',price:55,stock:10,restock:'7d',badge:null,desc:'Pack perfecto para comenzar en los cofres.',tags:[{t:'super',l:'PACK INICIO'}],give:{type:'superkey_multi',keys:{key_common:3,key_rare:1}},onetime:false },
  { id:'sk_pack_top',  cat:'superestrellas', icon:'👑', name:'Pack Élite — Épica ×2 + Legend ×1',img:'img/keys1.jpg', rarity:'legend', price:256, stock:3,  restock:'30d', badge:'limited', desc:'El pack de los elegidos.',                       tags:[{t:'super',l:'PACK ÉLITE'}],     give:{type:'superkey_multi',keys:{key_epic:2,key_legendary:1}},onetime:false },

  /* ── LOTE DE MONEDAS ── */
  { id:'m1', cat:'materiales', icon:'🪙', name:'Pegatina de 1c.',  img:'img/coin.jpg',     rarity:'common', price:0,   stock:1,  restock:'24h', badge:null,  desc:'Gratis. Solo una al día.',                      tags:[{t:'free',l:'GRATIS'},{t:'keys',l:'MONEDA'}], give:{type:'coins',amount:1},   onetime:false, daily:true },
  { id:'m2', cat:'materiales', icon:'🪙', name:'Bolsita de 30c.',  img:'img/coin.jpg',     rarity:'rare',   price:15,  stock:10, restock:'7d',  badge:null,  desc:'Para trueques y consumibles básicos.',          tags:[{t:'keys',l:'30 MONEDAS'}],                   give:{type:'coins',amount:30},  onetime:false },
  { id:'m3', cat:'materiales', icon:'🪙', name:'Pack de 90c.',     img:'img/packcoin.jpg', rarity:'epic',   price:30,  stock:10, restock:'7d',  badge:'hot', desc:'Relación costo/beneficio equilibrada.',         tags:[{t:'keys',l:'90 MONEDAS'}],                   give:{type:'coins',amount:90},  onetime:false },
  { id:'m4', cat:'materiales', icon:'🪙', name:'Lote de 120c.',    img:'img/stackcoin.jpg',rarity:'legend', price:60,  stock:10, restock:'30d', badge:null,  desc:'Ideal para temporadas.',                        tags:[{t:'keys',l:'120 MONEDAS'}],                  give:{type:'coins',amount:120}, onetime:false },

  /* ── HISTORIA ── */
  { id:'l1', cat:'historia', icon:'📚', name:'Libro: "Bosque de Jade"',          img:'img/bookmine.jpg', rarity:'rare',   price:256, stock:1, restock:null, badge:null,      desc:'Leyendas del bioma del bosque antiguo.',     tags:[{t:'historia',l:'LORE BIOMA'}],  give:{type:'lore',bookId:'bosque_jade'},    onetime:true },
  { id:'l2', cat:'historia', icon:'📚', name:'Libro: "La Negra Noche"',          img:'img/bookmine.jpg', rarity:'epic',   price:256, stock:1, restock:null, badge:null,      desc:'Símbolos y runas del mundo oscuro.',         tags:[{t:'historia',l:'LORE RUNAS'}],  give:{type:'lore',bookId:'negra_noche'},   onetime:true },
  { id:'l3', cat:'historia', icon:'📚', name:'Libro: "El lado ███ de S██ B███"', img:'img/bookcat.gif',  rarity:'legend', price:384, stock:1, restock:null, badge:'limited', desc:'██████ ████ de Sand Brill. ¿Qué oculta?',    tags:[{t:'historia',l:'LORE SECRETO'}], give:{type:'lore',bookId:'secreto_sb'},    onetime:true },
  { id:'l4', cat:'historia', icon:'📖', name:'Libro A1',                          img:'img/book.jpg',     rarity:'epic',   price:128, stock:1, restock:null, badge:null,      desc:'Un libro del portal.',                       tags:[{t:'historia',l:'LIBRO'}],       give:{type:'lore',bookId:'libro_a1'},      onetime:true },
  { id:'l5', cat:'historia', icon:'📖', name:'Libro B2',                          img:'img/book.jpg',     rarity:'epic',   price:128, stock:1, restock:null, badge:null,      desc:'Un libro del portal.',                       tags:[{t:'historia',l:'LIBRO'}],       give:{type:'lore',bookId:'libro_b2'},      onetime:true },
  { id:'l6', cat:'historia', icon:'📖', name:'Libro A2',                          img:'img/book.jpg',     rarity:'epic',   price:128, stock:1, restock:null, badge:null,      desc:'Un libro del portal.',                       tags:[{t:'historia',l:'LIBRO'}],       give:{type:'lore',bookId:'libro_a2'},      onetime:true },
  { id:'l7', cat:'historia', icon:'📖', name:'Libro C3',                          img:'img/book.jpg',     rarity:'epic',   price:128, stock:1, restock:null, badge:null,      desc:'Un libro del portal.',                       tags:[{t:'historia',l:'LIBRO'}],       give:{type:'lore',bookId:'libro_c3'},      onetime:true },

  /* ── MATERIALES (cosas) ── */
  { id:'f1', cat:'cosas', icon:'⚙️', name:'Rieles (x64)',                img:'imagen/phantom.gif', rarity:'epic',   price:64,  stock:10, restock:'24h', badge:null,  desc:'Unos rieles que siempre vienen bien.',         tags:[{t:'keys',l:'RIELES x64'}],    give:{type:'material',mat:'rails',amount:64},   onetime:false },
  { id:'f2', cat:'cosas', icon:'⚙️', name:'Rieles Activadores (x64)',    img:'imagen/phantom.gif', rarity:'epic',   price:128, stock:10, restock:'24h', badge:null,  desc:'Activemos estos rieles…',                      tags:[{t:'keys',l:'RIELES ACT'}],    give:{type:'material',mat:'rails_act',amount:64},onetime:false },
  { id:'f3', cat:'cosas', icon:'⚙️', name:'Rieles (x64) x2',             img:'imagen/phantom.gif', rarity:'epic',   price:64,  stock:2,  restock:'7d',  badge:'hot', desc:'Un x2 en rieles. ¡Con descuento!',             tags:[{t:'keys',l:'RIELES x128'}],   give:{type:'material',mat:'rails',amount:128},  onetime:false },
  { id:'f4', cat:'cosas', icon:'🧱', name:'Concreto (x64)',               img:'imagen/phantom.gif', rarity:'epic',   price:64,  stock:20, restock:'24h', badge:null,  desc:'Para construir.',                              tags:[{t:'keys',l:'CONCRETO x64'}],  give:{type:'material',mat:'concrete',amount:64},onetime:false },
  { id:'f5', cat:'cosas', icon:'🔩', name:'Bloques de Hierro (x64)',      img:'imagen/phantom.gif', rarity:'epic',   price:128, stock:10, restock:'7d',  badge:null,  desc:'Algunos bloques de hierro.',                   tags:[{t:'keys',l:'HIERRO x64'}],    give:{type:'material',mat:'iron',amount:64},    onetime:false },
  { id:'f6', cat:'cosas', icon:'🔩', name:'Bloques de Hierro (x64) x4',  img:'imagen/phantom.gif', rarity:'legend', price:128, stock:1,  restock:null,  badge:'hot', desc:'Pack oferta de hierro. ¡Aprovéchalo!',         tags:[{t:'keys',l:'HIERRO x256'},{t:'bonus',l:'OFERTA'}],give:{type:'material',mat:'iron',amount:256},onetime:false },
  { id:'f7', cat:'cosas', icon:'💎', name:'Bloques de Diamante (x64) x4',img:'imagen/phantom.gif', rarity:'legend', price:128, stock:1,  restock:null,  badge:'limited',desc:'Bueno brillemos…',                          tags:[{t:'keys',l:'DIAMANTE x256'},{t:'bonus',l:'OFERTA'}],give:{type:'material',mat:'diamond',amount:256},onetime:false },
  { id:'f8', cat:'cosas', icon:'💚', name:'Esmeralda x1',                 img:'imagen/phantom.gif', rarity:'legend', price:1,   stock:1,  restock:null,  badge:'sale', desc:'Sand Brill te desea Feliz Navidad… y da solo 1 esmeralda 😅',tags:[{t:'keys',l:'ESMERALDA'}],give:{type:'material',mat:'emerald',amount:1},onetime:false },

  /* ── PASES DE EVENTO ── */
  { id:'e1', cat:'eventos', icon:'🎪', name:'Pase en la Oscuridad', img:'img-pass/banhall.jpg',   rarity:'legend', price:256, stock:1, restock:'30d', startsAt:'2026-10-20', expiresAt:'2026-11-01', badge:'limited', desc:'Algo que tal vez... se acerca. Acceso a misiones de la oscuridad.', tags:[{t:'pase',l:'EVENTO ESPECIAL'}], give:{type:'event_pass',eventId:'darkness'}, onetime:false },
  { id:'e2', cat:'eventos', icon:'🐱', name:'Pase Gatos 😺✨',       img:'img-pass/catsparty.jpg', rarity:'legend', price:256, stock:1, restock:'30d', startsAt:'2026-08-01', expiresAt:'2026-08-30', badge:'new',     desc:'Gatos y más gatos… ¿Gatos?',                                       tags:[{t:'pase',l:'EVENTO GATOS'}],   give:{type:'event_pass',eventId:'cats'},     onetime:false },

  /* ── PACK DE MONEDAS (coins) ── */
  { id:'c1', cat:'monedas', icon:'💰', name:'Pack de 128r.', img:'img/coin.jpg',      rarity:'common', price:64,  stock:999, restock:null, badge:null, desc:'Para trueques y consumibles básicos. (2 stacks)',  tags:[{t:'keys',l:'128 COINS'}],  give:{type:'coins_raw',amount:128}, onetime:false },
  { id:'c2', cat:'monedas', icon:'💰', name:'Pack de 256r.', img:'img/packcoin.jpg',  rarity:'rare',   price:128, stock:999, restock:null, badge:null, desc:'Relación costo/beneficio equilibrada. (4 stacks)',  tags:[{t:'keys',l:'256 COINS'}], give:{type:'coins_raw',amount:256}, onetime:false },
  { id:'c3', cat:'monedas', icon:'💰', name:'Pack de 384r.', img:'img/stackcoin.jpg', rarity:'epic',   price:256, stock:999, restock:null, badge:null, desc:'Ideal para temporadas completas. (6 stacks)',       tags:[{t:'keys',l:'384 COINS'}],  give:{type:'coins_raw',amount:384}, onetime:false },
];

/* ══════════════════════════════════════
   NPC MESSAGES
══════════════════════════════════════ */
const NPC_MSGS = [
  '¡Tengo los mejores artículos del portal!',
  '¿Sand Brill tiene ofertas hoy!',
  '¡Cupón BLACK FRIDAY disponible!',
  'Los legendarios son rarísimos…',
  '¿Tickets o llaves? ¡Yo tengo todo!',
  '¡El Flash Sale termina pronto!',
  'Los pases de temporada valen la pena',
  '¡No dejes que el stock se agote!',
  'Una llave futuro… ¡muy poderosa!',
  '¡Los fines de semana hay más descuento!',
];

/* ══════════════════════════════════════
   HISTORIAL
══════════════════════════════════════ */
function getPurchases()  { return lsGet(LS.purchases, []); }
function addPurchase(p, note='') {
  const hist = getPurchases();
  hist.unshift({ id:p.id, name:p.name, icon:p.icon, note, date:new Date().toISOString() });
  if (hist.length > 50) hist.pop();
  lsSet(LS.purchases, hist);
  renderHistory();
  updateHistoryBadge();
}
function renderHistory() {
  const list = $('#purchasesList'); if (!list) return;
  const hist = getPurchases();
  if (!hist.length) {
    list.innerHTML='<div class="empty-hist"><span>📭</span><p>SIN COMPRAS AÚN</p></div>';
    return;
  }
  list.innerHTML = hist.map(p=>`
    <div class="purchase-item">
      <span class="pi-icon">${p.icon||'📦'}</span>
      <div class="pi-info">
        <div class="pi-name">${p.name}</div>
        <div class="pi-detail">${p.note||''}</div>
      </div>
      <div class="pi-time">${timeAgo(p.date)}</div>
    </div>`).join('');
}
function updateHistoryBadge() {
  const cnt = getPurchases().length;
  const badge = $('#historyCount');
  if (!badge) return;
  if (cnt > 0) { badge.textContent = cnt; badge.style.display=''; }
  else          { badge.style.display='none'; }
}

/* ══════════════════════════════════════
   REWARD EXECUTION
══════════════════════════════════════ */
function executeGive(give) {
  if (!give) return;
  const { type } = give;

  if (type === 'gacha_tickets') {
    addGachaTickets(give.wheel, give.count);
    if (window.addTickets) window.addTickets(give.wheel, 0);

  } else if (type === 'pass') {
    try {
      const raw   = localStorage.getItem(`mv_pass_${give.passId}`);
      const state = raw ? JSON.parse(raw) : {};
      const tiers = ['stone','iron','gold','emerald','diamond'];
      if (tiers.indexOf(state.tier||'stone') < 1) {
        state.tier = 'iron'; state.shopBought = true;
        localStorage.setItem(`mv_pass_${give.passId}`, JSON.stringify(state));
      }
      if (window.activatePassFromShop) window.activatePassFromShop(give.passId);
    } catch(e) { console.warn('[Shop] pass error:', e); }

  } else if (type === 'superkey') {
    const ckls = 'mv_chest_keys_v1';
    const raw  = localStorage.getItem(ckls);
    const keys = raw ? JSON.parse(raw) : {};
    keys[give.keyId] = (keys[give.keyId]||0) + give.amount;
    localStorage.setItem(ckls, JSON.stringify(keys));
    if (window.onChestKeyPurchasedFromShop) window.onChestKeyPurchasedFromShop(give);

  } else if (type === 'superkey_multi') {
    const ckls = 'mv_chest_keys_v1';
    const raw  = localStorage.getItem(ckls);
    const keys = raw ? JSON.parse(raw) : {};
    Object.entries(give.keys).forEach(([k,a]) => { keys[k]=(keys[k]||0)+a; });
    localStorage.setItem(ckls, JSON.stringify(keys));

  } else if (type === 'calkey') {
    const cals = 'mv_cal_keys';
    const raw  = localStorage.getItem(cals);
    const keys = raw ? JSON.parse(raw) : {};
    keys[give.keyType] = (keys[give.keyType]||0) + give.amount;
    localStorage.setItem(cals, JSON.stringify(keys));

  } else if (type === 'calkey_multi') {
    const cals = 'mv_cal_keys';
    const raw  = localStorage.getItem(cals);
    const keys = raw ? JSON.parse(raw) : {};
    Object.entries(give.keys).forEach(([k,a]) => { keys[k]=(keys[k]||0)+a; });
    localStorage.setItem(cals, JSON.stringify(keys));

  } else if (type === 'chest') {
    const inv = getInventory(); inv.keys=(inv.keys||0)+1; setInventory(inv);

  } else if (type === 'coins' || type === 'coins_raw' || type === 'material' || type === 'lore' || type === 'event_pass') {
    // These are fulfilled externally; we just record the purchase
    console.log('[Shop] External fulfillment:', type, give);
  }
}

function buildNoteStr(give) {
  if (!give) return '';
  const { type } = give;
  if (type==='gacha_tickets')   return `+${give.count} tickets ${give.wheel}`;
  if (type==='pass')             return `Pase ${give.passId} — Tier Hierro`;
  if (type==='superkey')        { const SKINFO={key_common:'Común',key_rare:'Brillante',key_special:'Especial',key_epic:'Épica',key_legendary:'Legendaria'}; return `+${give.amount} Llave ${SKINFO[give.keyId]||give.keyId}`; }
  if (type==='superkey_multi')  return Object.entries(give.keys).map(([k,a])=>`+${a} ${k}`).join(' · ');
  if (type==='calkey')          return `+${give.amount} Llave Cal ${give.keyType}`;
  if (type==='calkey_multi')    return Object.entries(give.keys).map(([k,a])=>`+${a} ${k}`).join(' · ');
  if (type==='chest')           return `+1 llave de cofre`;
  if (type==='coins')           return `+${give.amount} monedas`;
  if (type==='coins_raw')       return `+${give.amount} monedas raw`;
  if (type==='material')        return `+${give.amount} ${give.mat}`;
  if (type==='lore')            return `Libro: ${give.bookId}`;
  if (type==='event_pass')      return `Pase evento: ${give.eventId}`;
  return '';
}

/* ══════════════════════════════════════
   BUY FLOW
══════════════════════════════════════ */
function canBuy(p) {
  const startMs  = parseDateStart(p.startsAt);
  const expMs    = parseDate(p.expiresAt);
  if (startMs && startMs > now()) return { ok:false, reason:'PRÓXIMAMENTE' };
  if (expMs   && expMs   < now()) return { ok:false, reason:'CADUCADO'     };
  const st = StockLS.get(p.id, p.stock);
  if (st <= 0) return { ok:false, reason:'AGOTADO' };
  if (isProductClaimed(p)) return { ok:false, reason: p.daily?'RECLAMADO HOY':'YA RECLAMADO' };
  return { ok:true };
}

function showConfirmModal(p, extraDisc = 0) {
  const check = canBuy(p);
  if (!check.ok) { toast(check.reason, 'error'); return; }

  const couponPct  = getCurrentCouponPct();
  const totalDisc  = Math.min(100, couponPct + extraDisc + (flashDiscount || 0));
  const base       = Number(p.price)||0;
  const final      = Math.max(0, Math.round(base - base * totalDisc / 100));
  const isFree     = base === 0;
  const priceHTML  = isFree
    ? `<div class="buy-modal-price free">GRATIS</div>`
    : totalDisc > 0
      ? `<div class="buy-modal-price"><span style="text-decoration:line-through;color:var(--muted);font-size:0.5rem">⟡${base}</span> → ⟡${final} <span style="font-size:0.38rem;color:#4ade80">(-${totalDisc}%)</span></div>`
      : `<div class="buy-modal-price">⟡${base}</div>`;

  const noteText = p.onetime
    ? `<p class="buy-modal-note">⚠️ Solo puedes reclamar esto <b>UNA VEZ</b></p>`
    : p.daily
      ? `<p class="buy-modal-note">📅 Disponible una vez al día</p>`
      : '';

  openModal(`
    <span class="buy-modal-icon">${p.icon}</span>
    <div class="buy-modal-name">${p.name}</div>
    <div class="buy-modal-desc">${p.desc}</div>
    ${priceHTML}
    ${noteText}
    <div class="buy-modal-actions">
      <button class="btn-pixel btn-ghost" onclick="document.getElementById('modal').setAttribute('aria-hidden','true')">CANCELAR</button>
      <button class="btn-pixel btn-gold pulse" id="btnConfirmBuy">✓ CONFIRMAR</button>
    </div>`);

  setTimeout(() => {
    $('#btnConfirmBuy')?.addEventListener('click', () => {
      closeModal();
      doBuy(p, totalDisc);
    });
  }, 50);
}

function doBuy(p, appliedDisc = 0) {
  const check = canBuy(p);
  if (!check.ok) { toast(check.reason, 'error'); return; }

  if (!buyStock(p)) { toast('Stock agotado ❌', 'error'); return; }

  executeGive(p.give);
  markClaimed(p);
  addPurchase(p, buildNoteStr(p.give));
  unlockShopTitle(p.id);

  // Manejar cupón tras compra
  if (currentScId) {
    const sc = [...SEASONAL_COUPONS, BLACK_FRIDAY].find(s=>s.id===currentScId);
    if (sc) {
      if (sc.id === BLACK_FRIDAY.id) {
        // BF: re-roll
        bfCurrentDiscount = randInt(10,50);
        currentCoupon = bfCurrentDiscount;
        localStorage.setItem(LS.coupon, String(currentCoupon));
      } else {
        decrementScUses(sc);
        if (getScUsesLeft(sc) <= 0) {
          currentScId = null; currentCoupon = 0; bfCurrentDiscount = null;
          localStorage.removeItem(LS.scActive); localStorage.setItem(LS.coupon,'0');
          toast('🎟️ Usos del cupón agotados','info');
        }
      }
    }
  } else if (currentCoupon > 0) {
    setCouponCooldown(currentCoupon, nextMidnightLocal(1));
    currentCoupon = 0;
    localStorage.setItem(LS.coupon,'0');
  }

  showSuccessModal(p);
  renderProducts();
  renderCouponUI();
  renderSandBrill();
  scheduleSync();
}

function showSuccessModal(p) {
  openModal(`
    <div style="text-align:center;padding:10px 0">
      <span style="font-size:4rem;display:block;margin-bottom:14px;filter:drop-shadow(0 0 18px var(--a))">${p.icon}</span>
      <h2>¡RECOMPENSA OBTENIDA!</h2>
      <div style="font-family:var(--font-pixel);font-size:0.38rem;color:var(--text);margin-bottom:16px;line-height:2">${p.name}</div>
      <div style="font-family:var(--font-vt);font-size:1.1rem;color:var(--muted);margin-bottom:20px">${buildNoteStr(p.give)}</div>
      <button class="btn-pixel btn-gold large pulse" onclick="document.getElementById('modal').setAttribute('aria-hidden','true')" style="margin-top:8px">🎉 ¡GENIAL!</button>
    </div>`);
}

/* ══════════════════════════════════════
   RENDER PRODUCTS
══════════════════════════════════════ */
let currentCategory = 'all';

function renderProducts() {
  const grid = $('#productsGrid'); if (!grid) return;
  const filtered = currentCategory==='all' ? PRODUCTS : PRODUCTS.filter(p=>p.cat===currentCategory);

  if (!filtered.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;font-family:var(--font-pixel);font-size:0.32rem;color:var(--muted)">Sin productos en esta categoría.</div>`;
    return;
  }

  const couponPct = getCurrentCouponPct();
  const isFlash   = flashDiscount > 0;

  grid.innerHTML = filtered.map((p, idx) => {
    const startMs  = parseDateStart(p.startsAt);
    const expMs    = parseDate(p.expiresAt);
    const isUpcoming = !!(startMs && startMs > now());
    const isExpired  = !!(expMs   && expMs   < now());
    const st = StockLS.get(p.id, p.stock);
    const isOut = st <= 0;
    const claimed = isProductClaimed(p);

    const base   = Number(p.price)||0;
    const isFree = base === 0;

    // Calcular precio con descuento (cupón + flash)
    const totalDisc = isFlash ? Math.min(100, couponPct + flashDiscount) : couponPct;
    const finalPrc  = (!isFree && totalDisc > 0) ? Math.max(0, Math.round(base - base * totalDisc / 100)) : base;
    const hasDisc   = !isFree && totalDisc > 0;

    const priceHTML = isFree
      ? `<span class="pc-price-main free-price">GRATIS</span>`
      : hasDisc
        ? `<span class="pc-price-old">⟡${base}</span><span class="pc-price-discounted">⟡${finalPrc}</span>`
        : `<span class="pc-price-main">⟡${base}</span>`;

    const discBadgeHTML = hasDisc
      ? `<span class="pc-discount-badge">-${totalDisc}%</span>`
      : '';

    const tagsHTML    = (p.tags||[]).map(t=>`<span class="pc-tag ${t.t}">${t.l}</span>`).join('');
    const badgeHTML   = p.badge ? `<div class="pc-badge ${p.badge}">${p.badge.toUpperCase()}</div>` : '';
    const rarityClass = p.rarity || 'common';

    // Stock display
    const stockClass  = st <= 3 ? 'low' : '';
    const stockText   = st >= 999 ? '∞' : String(st);
    const restockEl   = p.restock ? `<span class="pc-restock">↻ ${p.restock}</span>` : '';

    // Overlay
    let overlayHTML = '';
    if (isExpired)  overlayHTML = `<div class="pc-overlay"><div class="pc-overlay-box"><div class="pc-overlay-title">⌛ CADUCADO</div><div class="pc-overlay-sub">Oferta finalizada</div></div></div>`;
    if (isUpcoming) overlayHTML = `<div class="pc-overlay"><div class="pc-overlay-box"><div class="pc-overlay-title" style="color:#93c5fd">⏳ PRÓXIMAMENTE</div><div class="pc-overlay-sub">${p.startsAt}</div></div></div>`;
    if (isOut && !isExpired && !isUpcoming) overlayHTML = `<div class="pc-overlay" style="background:rgba(0,0,0,0.5)"><div class="pc-overlay-box"><div class="pc-overlay-title">AGOTADO</div><div class="pc-overlay-sub">${p.restock?`↻ ${p.restock}` : 'Sin restock'}</div></div></div>`;

    const isDisabled  = isOut || isExpired || isUpcoming || (claimed && !p.daily);
    let btnText = claimed && p.daily ? '✓ RECLAMADO HOY' : claimed ? '✓ RECLAMADO' : 'COMPRAR';
    if (isOut)      btnText = 'AGOTADO';
    if (isExpired)  btnText = 'CADUCADO';
    if (isUpcoming) btnText = 'PRÓXIMAMENTE';
    const btnClass = (claimed || isDisabled) ? (isOut?'btn-out':'btn-purchased') : '';

    return `<div class="product-card reveal" data-id="${p.id}" data-rarity="${rarityClass}" style="animation-delay:${idx*0.04}s">
      <div class="pc-band"></div>
      ${badgeHTML}
      ${overlayHTML}
      <div class="pc-body">
        <span class="pc-icon">${p.icon}</span>
        <div class="pc-name">${p.name}</div>
        <div class="pc-desc">${p.desc}</div>
        <div class="pc-contents">${tagsHTML}</div>
      </div>
      <div class="pc-footer">
        <div class="pc-stock-row">
          <span class="pc-stock ${stockClass}">📦 ${stockText}</span>
          ${restockEl}
        </div>
        <div class="pc-price-row">
          ${priceHTML}
          ${discBadgeHTML}
        </div>
        <button class="pc-btn ${btnClass}" data-id="${p.id}" ${isDisabled?'disabled':''}>
          ${btnText}
        </button>
      </div>
    </div>`;
  }).join('');

  // Animación reveal
  requestAnimationFrame(() => {
    grid.querySelectorAll('.reveal').forEach((el,i) => setTimeout(()=>el.classList.add('visible'),i*35));
  });

  // Listeners
  grid.querySelectorAll('.pc-btn:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = PRODUCTS.find(x=>x.id===btn.dataset.id);
      if (p) showConfirmModal(p);
    });
  });
}

/* ══════════════════════════════════════
   MODAL
══════════════════════════════════════ */
function openModal(html) {
  const m=$('#modal'), c=$('#modalContent'); if(!m||!c) return;
  c.innerHTML = html;
  m.setAttribute('aria-hidden','false');
}
function closeModal() { $('#modal')?.setAttribute('aria-hidden','true'); }

/* ══════════════════════════════════════
   TITLES UNLOCK
══════════════════════════════════════ */
function unlockShopTitle(productId) {
  try {
    const triggers = { _any:'tl_first_buy', sp_bf_pack:'tl_black_friday', ev_all_access:'tl_all_access' };
    const earned   = lsGet('mv_titles_earned', ['tl_novato']);
    const toAdd    = [];
    if (!earned.includes(triggers._any)) toAdd.push(triggers._any);
    if (triggers[productId] && !earned.includes(triggers[productId])) toAdd.push(triggers[productId]);
    if (toAdd.length) lsSet('mv_titles_earned', [...new Set([...earned,...toAdd])]);
  } catch {}
}

/* ══════════════════════════════════════
   PARTICLES
══════════════════════════════════════ */
function initCoins() {
  const canvas = $('#bgCoins'); if (!canvas) return;
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  const SYMS = ['🪙','💰','✨','💛','⭐','🔶'];
  const coins = Array.from({length:25},()=>({
    x:Math.random()*canvas.width, y:Math.random()*canvas.height,
    size:Math.random()*10+7, speed:Math.random()*0.35+0.08,
    sym:SYMS[Math.floor(Math.random()*SYMS.length)],
    o:Math.random()*0.25+0.04
  }));
  (function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    coins.forEach(c=>{
      ctx.globalAlpha=c.o; ctx.font=`${c.size}px serif`;
      ctx.fillText(c.sym,c.x,c.y);
      c.y-=c.speed;
      if(c.y<-20){c.y=canvas.height+10;c.x=Math.random()*canvas.width;}
    });
    requestAnimationFrame(draw);
  })();
  window.addEventListener('resize',()=>{canvas.width=window.innerWidth;canvas.height=window.innerHeight;});
}

/* ══════════════════════════════════════
   NPC
══════════════════════════════════════ */
function initNPC() {
  const d = $('#npc-dialog'); if (!d) return;
  let i = 0;
  function upd() { d.textContent = NPC_MSGS[i%NPC_MSGS.length]; i++; }
  upd(); setInterval(upd, 7000);
}

/* ══════════════════════════════════════
   TOAST / BEEP
══════════════════════════════════════ */
function toast(msg, type='success') {
  const t = $('#toast'); if (!t) return;
  t.textContent=`${msg}`; t.className=`toast show ${type}`;
  clearTimeout(t._tm); t._tm=setTimeout(()=>t.classList.remove('show'),3000);
}

/* ══════════════════════════════════════
   NAV / HAMBURGER
══════════════════════════════════════ */
function initNav() {
  const btn = $('#hamburger'), nav = $('#main-nav');
  if (btn && nav) btn.addEventListener('click', ()=>nav.classList.toggle('open'));
}

/* ══════════════════════════════════════
   HISTORY PANEL
══════════════════════════════════════ */
function initHistoryPanel() {
  const fab = $('#historyFab'), panel = $('#historyPanel');
  const closeBtn = $('#historyClose');
  if (!fab || !panel) return;
  fab.addEventListener('click', () => {
    const isOpen = panel.classList.toggle('open');
    panel.setAttribute('aria-hidden', String(!isOpen));
  });
  closeBtn?.addEventListener('click', () => {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden','true');
  });
  $('#btnClearHistory')?.addEventListener('click', ()=>{
    if (!confirm('¿Limpiar todo el historial?')) return;
    lsSet(LS.purchases, []);
    renderHistory();
    updateHistoryBadge();
    toast('Historial limpiado','info');
  });
}

/* ══════════════════════════════════════
   REVEAL ON SCROLL
══════════════════════════════════════ */
function initReveal() {
  const obs = new IntersectionObserver(entries=>{
    entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}});
  },{threshold:0.1});
  document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
}

/* ══════════════════════════════════════
   BOOT
══════════════════════════════════════ */
function boot() {
  console.log('🛒 Moonveil Shop v3.0');

  // Init stock for all products
  PRODUCTS.forEach(p => initStock(p));

  initReveal(); initNav(); initCoins(); initNPC();
  initHistoryPanel();
  renderHUD(); renderHistory(); updateHistoryBadge();
  renderCouponUI();
  initFlashSale(); initSandBrill();

  // Category buttons
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.cat || 'all';
      renderProducts();
    });
  });

  renderProducts();

  // Modal close
  $('#modalClose')?.addEventListener('click', closeModal);
  $('#modal .modal-backdrop')?.addEventListener('click', closeModal);
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeModal(); });

  // Coupon clear
  document.addEventListener('click', e=>{
    if (e.target?.id==='couponClearBtn') {
      currentCoupon=0; currentScId=null; bfCurrentDiscount=null;
      localStorage.setItem(LS.coupon,'0');
      localStorage.removeItem(LS.scActive);
      renderCouponUI(); renderProducts(); renderSandBrill();
      toast('Cupón desactivado','info');
    }
  });

  // Timers
  setInterval(()=>{ updateFlashTimer(); updateSandbrillTimer(); renderCouponUI(); }, 1000);

  // Firebase
  onAuthChange(async user=>{
    if (!user) return;
    currentUID = user.uid;
    await loadFromFirebase(user.uid);
    renderHUD(); renderHistory();
    console.log('✅ Shop Firebase OK:', user.uid);
  });
}

if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot);
else boot();