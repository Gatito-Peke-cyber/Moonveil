/* =========================================================
   Moonveil Portal — pases.js v5.1  (CORREGIDO)
   FIXES:
   · Todas las funciones usadas en onclick="" expuestas en window
   · setActivePass expuesto en window
   · Sincronización Firebase en tiempo real (onSnapshot)
   · claimLevelReward, claimMission, claimAllLevelRewards,
     claimAllMissions, claimPassMail, buyTierUpgrade,
     filterTierView, redirectToShop, openLevelModal
     ahora son accesibles desde el HTML generado dinámicamente
   ========================================================= */

import { db }           from './firebase.js';
import { onAuthChange }  from './auth.js';
import {
  doc, getDoc, updateDoc, onSnapshot, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

/* ── HELPERS ── */
const $  = (q, ctx = document) => ctx.querySelector(q);
const $$ = (q, ctx = document) => Array.from(ctx.querySelectorAll(q));
const esc = s => String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const now = () => Date.now();
const H24 = 86400000, H1 = 3600000, M1 = 60000;

/* ── CONSTANTES ── */
const XP_PER_LEVEL          = 50;
const MAX_LEVELS             = 60;
const OVERFLOW_XP_PER_REWARD = 300;
const CHEST_KEYS_LS          = 'mv_chest_keys_v1';
const PASS_BOOSTS_LS         = 'mv_active_boosts';
const PASS_MAIL_LS           = 'mv_pass_mail_claimed';
const GLOBAL_INV_LS          = 'mv_global_inventory';
const TICKETS_BASE           = 'mv_tickets_';

/* ── FIREBASE STATE ── */
let currentUID = null, _passUnsub = null, _syncTO = null;
let _ignoreNextSnap = false;

function scheduleSync() {
  if (!currentUID) return;
  clearTimeout(_syncTO);
  _syncTO = setTimeout(doFirebaseSync, 2500);
}

async function doFirebaseSync() {
  if (!currentUID) return;
  try {
    const passStates = {};
    PASSES.forEach(p => {
      const raw = localStorage.getItem(`mv_pass_${p.id}`);
      if (raw) { try { passStates[p.id] = JSON.parse(raw); } catch {} }
    });
    const mailClaimed = JSON.parse(localStorage.getItem(PASS_MAIL_LS) || '[]');
    const boosts = JSON.parse(localStorage.getItem(PASS_BOOSTS_LS) || '[]');
    _ignoreNextSnap = true;
    await updateDoc(doc(db, 'users', currentUID), {
      pass_states: passStates,
      pass_mail_claimed: mailClaimed,
      pass_boosts: boosts,
      updatedAt: serverTimestamp(),
    });
    setTimeout(() => { _ignoreNextSnap = false; }, 1500);
  } catch (e) { console.warn('[Pases] sync:', e); _ignoreNextSnap = false; }
}

async function loadFromFirebase(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return;
    applyRemotePassData(snap.data(), true);
  } catch (e) { console.warn('[Pases] load:', e); }
}

/* silent=true → no re-render (carga inicial), false → re-render (otro dispositivo) */
function applyRemotePassData(data, silent = false) {
  let changed = false;

  if (data.pass_states) {
    Object.entries(data.pass_states).forEach(([passId, remoteState]) => {
      const localRaw = localStorage.getItem(`mv_pass_${passId}`);
      const local = localRaw ? (() => { try { return JSON.parse(localRaw); } catch { return {}; } })() : {};
      const merged = {
        ...local,
        ...remoteState,
        level: Math.max(local.level || 1, remoteState.level || 1),
        xp:    Math.max(local.xp    || 0, remoteState.xp    || 0),
      };
      if (Array.isArray(remoteState.claimedLevels) && Array.isArray(local.claimedLevels)) {
        merged.claimedLevels = [...new Set([...(local.claimedLevels || []), ...(remoteState.claimedLevels || [])])];
      }
      if (remoteState.missions && local.missions) {
        merged.missions = { ...local.missions };
        Object.entries(remoteState.missions).forEach(([mId, ms]) => {
          const lm = local.missions[mId] || {};
          merged.missions[mId] = {
            ...lm, ...ms,
            progress: Math.max(lm.progress || 0, ms.progress || 0),
            claimed: lm.claimed || ms.claimed,
          };
        });
      }
      // Sync tier: tomar el mayor tier
      if (remoteState.tier && local.tier) {
        const tIdx = TIER_ORDER.indexOf(remoteState.tier);
        const lIdx = TIER_ORDER.indexOf(local.tier);
        if (tIdx > lIdx) merged.tier = remoteState.tier;
        else merged.tier = local.tier;
      }
      localStorage.setItem(`mv_pass_${passId}`, JSON.stringify(merged));
      changed = true;
    });
  }

  if (data.pass_mail_claimed && Array.isArray(data.pass_mail_claimed)) {
    const local = JSON.parse(localStorage.getItem(PASS_MAIL_LS) || '[]');
    const merged = [...new Set([...local, ...data.pass_mail_claimed])];
    if (merged.length !== local.length) {
      localStorage.setItem(PASS_MAIL_LS, JSON.stringify(merged));
      changed = true;
    }
  }

  if (data.pass_boosts && Array.isArray(data.pass_boosts)) {
    const localBoosts = JSON.parse(localStorage.getItem(PASS_BOOSTS_LS) || '[]');
    const allBoosts = [...localBoosts, ...data.pass_boosts];
    const seen = new Set();
    const merged = allBoosts.filter(b => {
      if (!b || b.expiry <= now()) return false;
      const key = `${b.multiplier}_${b.expiry}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    lsSet(PASS_BOOSTS_LS, merged);
    changed = true;
  }

  if (!silent && changed && activePassId) {
    renderTrack(activePassId);
    renderMissions(activePassId);
    renderInventory(activePassId);
    renderPassMailbox();
    updateHUD(activePassId);
    renderPassHeader(activePassId);
    console.log('[Pases] 🔄 Sincronizado desde otro dispositivo');
  }
}

function startRealtimeListener(uid) {
  if (_passUnsub) { _passUnsub(); _passUnsub = null; }
  _passUnsub = onSnapshot(
    doc(db, 'users', uid),
    snap => {
      if (!snap.exists()) return;
      if (_ignoreNextSnap) { return; }
      applyRemotePassData(snap.data(), false);
    },
    err => console.warn('[Pases] onSnapshot error:', err)
  );
  console.log('[Pases] ✅ Listener en tiempo real activo');
}

/* ── STORAGE HELPERS ── */
function lsGet(k, fb = null) { try { const v = localStorage.getItem(k); return v != null ? JSON.parse(v) : fb; } catch { return fb; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

/* ══════════════════════════════════════════════════════════
   TIERS
══════════════════════════════════════════════════════════ */
const TIERS = [
  { id:'stone',   emoji:'⬜', name:'Piedra',    desc:'Novato',   unlockPrice:0   },
  { id:'iron',    emoji:'⬛', name:'Hierro',    desc:'Aprendiz', unlockPrice:128 },
  { id:'gold',    emoji:'🟨', name:'Oro',       desc:'Oficial',  unlockPrice:256 },
  { id:'emerald', emoji:'🟩', name:'Esmeralda', desc:'Experto',  unlockPrice:384 },
  { id:'diamond', emoji:'🔷', name:'Diamante',  desc:'Maestro',  unlockPrice:512 },
];
const TIER_ORDER = ['stone','iron','gold','emerald','diamond'];

/* ══════════════════════════════════════════════════════════
   RECOMPENSAS DE NIVEL
   ⚠️  freeRewards[] y paidRewards[] vacíos — rellenar tú mismo
══════════════════════════════════════════════════════════ */
function makeDefaultLevels() {
  const levels = [];

  const freeRewards = [
    // índice 0 = nivel 1  …  índice 59 = nivel 60
    // Ejemplo: { type:'keys', emoji:'⭐', name:'Llave Superestrella', amount:1, keyId:'key_common' }
  ];

  const paidRewards = [
    // Ejemplo: { type:'keys', emoji:'💫', name:'Llave Brillante', amount:1, keyId:'key_rare' }
  ];

  const fallbackFree = { type:'xp',      emoji:'⭐', name:'XP Bonus', amount:50 };
  const fallbackPaid = { type:'emeralds', emoji:'💎', name:'Gemas',    amount:10 };

  for (let i = 0; i < MAX_LEVELS; i++) {
    levels.push({
      free: freeRewards[i] || fallbackFree,
      paid: paidRewards[i] || fallbackPaid,
    });
  }
  return levels;
}

/* ══════════════════════════════════════════════════════════
   DEFINICIÓN DE PASES
══════════════════════════════════════════════════════════ */
const PASSES = [
  {
    id:'pass_s1',  name:'Reino del Hielo Eterno', season:'Temporada I',   emoji:'❄️',
    description:'El reino helado despierta. Recompensas de invierno y más.',
    startDate:'2026-01-01', endDate:'2026-01-31', music:'music/8.mp3', bg:'img-pass/banwar.jpg', shopItemId:'s1',
    levels: (() => {
      const ls = makeDefaultLevels();
      ls[9].paid  = { type:'keys', emoji:'❄️', name:'Llave Hielo',          amount:1, keyId:'key_common'    };
      ls[19].paid = { type:'keys', emoji:'💫', name:'Llave Brillante x2',   amount:2, keyId:'key_rare'      };
      ls[29].paid = { type:'keys', emoji:'✨', name:'Llave Especial',       amount:1, keyId:'key_special'   };
      ls[39].paid = { type:'keys', emoji:'🔮', name:'Llave Épica x2',       amount:2, keyId:'key_epic'      };
      ls[49].paid = { type:'keys', emoji:'👑', name:'Llave Legendaria',     amount:1, keyId:'key_legendary' };
      ls[59].paid = { type:'keys', emoji:'👑', name:'Llave Legendaria x3!', amount:3, keyId:'key_legendary' };
      return ls;
    })(),
  },
  {
    id:'pass_s2',  name:'Corazones de Redstone', season:'Temporada II',  emoji:'💕',
    description:'El amor florece entre circuitos y redstone. ¡Romántico!',
    startDate:'2026-02-01', endDate:'2026-02-28', music:'music/1234.mp3', bg:'img-pass/banhall.jpg', shopItemId:'s2',
    levels: (() => {
      const ls = makeDefaultLevels();
      ls[4].paid  = { type:'keys', emoji:'💗', name:'Llave Corazón x2',    amount:2, keyId:'key_valentine' };
      ls[9].paid  = { type:'keys', emoji:'💗', name:'Llave Corazón',       amount:1, keyId:'key_valentine' };
      ls[19].paid = { type:'keys', emoji:'💗', name:'Llave Corazón x3',    amount:3, keyId:'key_valentine' };
      ls[29].paid = { type:'keys', emoji:'✨', name:'Llave Especial',      amount:1, keyId:'key_special'  };
      ls[39].paid = { type:'keys', emoji:'🔮', name:'Llave Épica',         amount:1, keyId:'key_epic'     };
      ls[59].paid = { type:'keys', emoji:'👑', name:'Llave Legendaria x3!',amount:3, keyId:'key_legendary'};
      return ls;
    })(),
  },
  { id:'pass_s3',  name:'Despertar de la Naturaleza',     season:'Temporada III',  emoji:'🌿', description:'La naturaleza renace.',           startDate:'2026-03-01', endDate:'2026-03-31', music:'music/8.mp3', bg:'img-pass/partymine.jpg',  shopItemId:'s3',  levels:makeDefaultLevels() },
  { id:'pass_s4',  name:'Cántico de la Lluvia Plateada',  season:'Temporada IV',   emoji:'🌧️',description:'La lluvia plateada trae secretos.',startDate:'2026-04-01', endDate:'2026-04-30', music:'music/8.mp3', bg:'img-pass/chrismine.jpg',  shopItemId:'s4',  levels:makeDefaultLevels() },
  { id:'pass_s5',  name:'Esencia de la Aurora',           season:'Temporada V',    emoji:'🌅', description:'La aurora ilumina el camino.',    startDate:'2026-05-01', endDate:'2026-05-31', music:'music/8.mp3', bg:'img-pass/añomine.jpg',    shopItemId:'s5',  levels:makeDefaultLevels() },
  { id:'pass_s6',  name:'Imperio del Océano Profundo',    season:'Temporada VI',   emoji:'🌊', description:'Las profundidades del océano.',   startDate:'2026-06-01', endDate:'2026-06-30', music:'music/8.mp3', bg:'img-pass/banair.jpg',     shopItemId:'s6',  levels:makeDefaultLevels() },
  { id:'pass_s7',  name:'Reinos Dorados',                 season:'Temporada VII',  emoji:'👑', description:'El oro fluye por los reinos.',    startDate:'2026-07-01', endDate:'2026-07-31', music:'music/8.mp3', bg:'img-pass/dancingmine.jpg', shopItemId:'s7',  levels:makeDefaultLevels() },
  { id:'pass_s8',  name:'Sombras de la Noche',            season:'Temporada VIII', emoji:'🌙', description:'Las sombras nocturnas.',          startDate:'2026-08-01', endDate:'2026-08-31', music:'music/8.mp3', bg:'img-pass/squemine.jpg',   shopItemId:'s8',  levels:makeDefaultLevels() },
  { id:'pass_s9',  name:'Mundo Encantado',                season:'Temporada IX',   emoji:'✨', description:'La magia recorre Moonveil.',      startDate:'2026-09-01', endDate:'2026-09-30', music:'music/8.mp3', bg:'img-pass/squemine.jpg',   shopItemId:'s9',  levels:makeDefaultLevels() },
  {
    id:'pass_s10', name:'Pesadilla del Nether', season:'Temporada X', emoji:'🔥',
    description:'El Nether se despierta.',
    startDate:'2026-10-01', endDate:'2026-10-31', music:'music/8.mp3', bg:'img-pass/banhall.jpg', shopItemId:'s10',
    levels: (() => {
      const ls = makeDefaultLevels();
      ls[4].paid  = { type:'keys', emoji:'🎃', name:'Llave Halloween',     amount:1, keyId:'key_halloween' };
      ls[9].paid  = { type:'keys', emoji:'🎃', name:'Llave Halloween x2',  amount:2, keyId:'key_halloween' };
      ls[29].paid = { type:'keys', emoji:'🔮', name:'Llave Épica',         amount:1, keyId:'key_epic'      };
      ls[59].paid = { type:'keys', emoji:'👑', name:'Llave Legendaria x3!',amount:3, keyId:'key_legendary' };
      return ls;
    })(),
  },
  { id:'pass_s11', name:'Guardianes del Invierno', season:'Temporada XI',  emoji:'🛡️',description:'Los guardianes del frío eterno.', startDate:'2026-11-01', endDate:'2026-11-30', music:'music/8.mp3', bg:'img-pass/squemine.jpg',  shopItemId:'s11', levels:makeDefaultLevels() },
  {
    id:'pass_s12', name:'Estrella de Ender', season:'Temporada XII', emoji:'⭐',
    description:'La Estrella de Ender brilla.',
    startDate:'2026-12-01', endDate:'2026-12-31', music:'music/8.mp3', bg:'img-pass/chrismine.jpg', shopItemId:'s12',
    levels: (() => {
      const ls = makeDefaultLevels();
      ls[4].paid  = { type:'keys', emoji:'🎄', name:'Llave Navideña',      amount:1, keyId:'key_christmas' };
      ls[9].paid  = { type:'keys', emoji:'🎄', name:'Llave Navideña x2',   amount:2, keyId:'key_christmas' };
      ls[19].paid = { type:'keys', emoji:'✨', name:'Llave Especial',      amount:1, keyId:'key_special'  };
      ls[29].paid = { type:'keys', emoji:'🔮', name:'Llave Épica',         amount:1, keyId:'key_epic'      };
      ls[39].paid = { type:'keys', emoji:'👑', name:'Llave Legendaria x2', amount:2, keyId:'key_legendary' };
      ls[59].paid = { type:'keys', emoji:'👑', name:'Llave Legendaria x3!',amount:3, keyId:'key_legendary' };
      return ls;
    })(),
  },
];

/* ══════════════════════════════════════════════════════════
   BUZÓN
══════════════════════════════════════════════════════════ */
const PASS_MAIL_ITEMS = [
  {
    id:'pm_001', title:'¡Bienvenido a los Pases!', sender:'Equipo Moonveil', emoji:'🎉',
    msg:'Gracias por unirte a los pases de temporada. ¡Que la suerte te acompañe, viajero!',
    rewards:[
      { type:'xp',   amount:500,  emoji:'⭐', name:'XP Bonus' },
      { type:'keys', keyId:'key_common', amount:3, emoji:'⭐', name:'Llave Superestrella' },
    ],
  },
  {
    id:'pm_002', title:'Boost de XP de Bienvenida', sender:'Sistema Moonveil', emoji:'⚡',
    msg:'Un boost de XP para ayudarte a subir de nivel más rápido. ¡Aprovecha cada misión!',
    rewards:[
      { type:'boost', boostHours:2, boostMultiplier:1.5, emoji:'⚡', name:'Boost XP 2h ×1.5' },
    ],
  },
];

/* ══════════════════════════════════════════════════════════
   MEJORAS DE TIER
══════════════════════════════════════════════════════════ */
const TIER_UPGRADES = [
  {
    id:'stone', tierClass:'stone', emoji:'⬜', name:'Pase Piedra', subtitle:'Novato — Gratis',
    desc:'El pase base, completamente gratis. Accede a recompensas gratis en los 60 niveles.',
    price:0, isFree:true,
    features:['Recompensas gratis en los 60 niveles','Llaves Superestrella en hitos','Misiones diarias y semanales','Inventario global y buzón'],
  },
  {
    id:'iron', tierClass:'iron', emoji:'⬛', name:'Pase Hierro', subtitle:'Aprendiz',
    desc:'Desbloquea las recompensas de pago en todos los niveles.',
    price:128, requiresShopPurchase:true,
    features:['Todo lo de Piedra','Llaves Superestrella en 60 niveles','Misiones exclusivas de Hierro'],
  },
  {
    id:'gold', tierClass:'gold', emoji:'🟨', name:'Pase Oro', subtitle:'Oficial',
    desc:'×1.5 llaves en recompensas de pago. Requiere Pase Hierro.',
    price:256, requiresPrev:'iron',
    features:['Todo lo de Hierro','×1.5 en cantidad de llaves','Misiones exclusivas de Oro'],
  },
  {
    id:'emerald', tierClass:'emerald', emoji:'🟩', name:'Pase Esmeralda', subtitle:'Experto',
    desc:'Llaves épicas adicionales. Requiere Pase Oro.',
    price:384, requiresPrev:'gold',
    features:['Todo lo de Oro','Llaves Épicas en hitos','XP de misiones ×1.25'],
  },
  {
    id:'diamond', tierClass:'diamond', emoji:'🔷', name:'Pase Diamante', subtitle:'Maestro',
    desc:'×2 en TODAS las recompensas. Requiere Pase Esmeralda.',
    price:512, requiresPrev:'emerald',
    features:['Todo lo anterior','×2 en TODAS las llaves','Boost XP permanente ×1.5'],
  },
];

/* ══════════════════════════════════════════════════════════
   MISIONES TEMPLATE
══════════════════════════════════════════════════════════ */
const MISSIONS_TEMPLATE = [
  { id:'daily_login',   name:'Inicio de sesión',     desc:'Inicia sesión hoy.',                    emoji:'🌅',reset:'24h',  xpReward:50,  reward:{type:'copper',amount:1},                                                                        target:1,   category:'Diarias',           categoryIcon:'🌤️' },
  { id:'daily_buy50',   name:'Gasta 50 en Tienda',   desc:'Gasta al menos 50 ⟡.',                  emoji:'🛍️',reset:'24h',  xpReward:80,  reward:{type:'copper',amount:1},                                                                        target:50,  category:'Diarias',           categoryIcon:'🌤️', trackId:'shop_spent_daily' },
  { id:'daily_login3',  name:'Racha de 3 días',      desc:'Inicia sesión 3 días seguidos.',         emoji:'📅',reset:'24h',  xpReward:120, reward:{type:'emeralds',amount:1},                                                                      target:3,   category:'Diarias',           categoryIcon:'🌤️', trackId:'login_streak' },
  { id:'week_buy200',   name:'Gasta 200 en Tienda',  desc:'Gasta 200 ⟡ esta semana.',               emoji:'💰',reset:'7d',   xpReward:200, reward:{type:'keys',amount:1,keyId:'key_common',emoji:'⭐',name:'Llave'},                               target:200, category:'Semanales',         categoryIcon:'📆', trackId:'shop_spent_weekly' },
  { id:'week_level5',   name:'Alcanza Nivel 5',      desc:'Llega al nivel 5 en este pase.',         emoji:'⬆️',reset:'7d',   xpReward:150, reward:{type:'copper',amount:1},                                                                        target:5,   category:'Semanales',         categoryIcon:'📆', trackId:'pass_level' },
  { id:'week_level10',  name:'Alcanza Nivel 10',     desc:'Llega al nivel 10 en este pase.',        emoji:'🏆',reset:'7d',   xpReward:250, reward:{type:'emeralds',amount:2},                                                                      target:10,  category:'Semanales',         categoryIcon:'📆', trackId:'pass_level' },
  { id:'bi_buy600',     name:'Gasta 600 en Tienda',  desc:'Gasta 600 ⟡ total.',                     emoji:'🏦',reset:'12d',  xpReward:300, reward:{type:'keys',amount:1,keyId:'key_rare',emoji:'💫',name:'Llave Brillante'},                        target:600, category:'Bi-semanales',      categoryIcon:'🗓️', trackId:'shop_spent_total' },
  { id:'bi_login12',    name:'Racha de 12 días',     desc:'Inicia sesión al menos 12 días.',        emoji:'📆',reset:'12d',  xpReward:280, reward:{type:'tickets',amount:3,subtype:'classic'},                                                    target:12,  category:'Bi-semanales',      categoryIcon:'🗓️', trackId:'total_logins' },
  { id:'month_lv30',    name:'Alcanza Nivel 30',     desc:'Llega al nivel 30 del pase.',            emoji:'💎',reset:'24d',  xpReward:500, reward:{type:'keys',amount:1,keyId:'key_epic',emoji:'🔮',name:'Llave Épica'},                            target:30,  category:'Mensuales',         categoryIcon:'📅', trackId:'pass_level' },
  { id:'month_buy1500', name:'Gasta 1500 en Tienda', desc:'Gasta 1500 ⟡ este mes.',                 emoji:'💸',reset:'24d',  xpReward:600, reward:{type:'keys',amount:1,keyId:'key_special',emoji:'✨',name:'Llave Especial'},                     target:1500,category:'Mensuales',         categoryIcon:'📅', trackId:'shop_spent_monthly' },
  { id:'uniq_first',    name:'¡Primer Pase!',        desc:'Activa tu primer pase de temporada.',   emoji:'🎉',reset:'unique',xpReward:250, reward:{type:'emeralds',amount:2},                                                                      target:1,   category:'Únicas',            categoryIcon:'🌟' },
  { id:'uniq_lv60',     name:'¡Pase Completo!',      desc:'Llega al nivel 60 del pase.',           emoji:'👑',reset:'unique',xpReward:1000,reward:{type:'keys',amount:1,keyId:'key_legendary',emoji:'👑',name:'Llave Legendaria'},                 target:60,  category:'Únicas',            categoryIcon:'🌟', trackId:'pass_level' },
  { id:'game_flowers',  name:'Cosecha de Flores',    desc:'Recoge 10 flores silvestres.',           emoji:'🌸',reset:'24h',  xpReward:100, reward:{type:'emeralds',amount:2},                                                                      target:10,  category:'Misiones de Juego', categoryIcon:'🎮', isGame:true, preCompleted:true },
  { id:'game_wood',     name:'Tala de Madera',       desc:'Tala 20 bloques de madera.',             emoji:'🪵',reset:'24h',  xpReward:200, reward:{type:'copper',amount:2},                                                                        target:20,  category:'Misiones de Juego', categoryIcon:'🎮', isGame:true, preCompleted:true },
  { id:'game_fish',     name:'Gran Pescador',        desc:'Pesca 15 peces.',                        emoji:'🎣',reset:'24h',  xpReward:220, reward:{type:'keys',amount:1,keyId:'key_common',emoji:'⭐',name:'Llave'},                               target:15,  category:'Misiones de Juego', categoryIcon:'🎮', isGame:true, preCompleted:true },
  { id:'game_mine',     name:'Minero Experto',       desc:'Mina 30 bloques de piedra.',             emoji:'⛏️',reset:'24h',  xpReward:260, reward:{type:'emeralds',amount:2},                                                                      target:30,  category:'Misiones de Juego', categoryIcon:'🎮', isGame:true, preCompleted:true },
  { id:'game_mob',      name:'Cazador de Mobs',      desc:'Elimina 25 mobs hostiles.',              emoji:'⚔️',reset:'24h',  xpReward:300, reward:{type:'keys',amount:1,keyId:'key_common',emoji:'⭐',name:'Llave'},                               target:25,  category:'Misiones de Juego', categoryIcon:'🎮', isGame:true, preCompleted:true },
  { id:'iron_bonus',    name:'Misión Hierro I',      desc:'Exclusiva Hierro: Gasta 100 ⟡.',         emoji:'⬛',reset:'7d',   xpReward:200, reward:{type:'keys',amount:1,keyId:'key_common',emoji:'⭐',name:'Llave'},                               target:100, category:'Exclusivas Hierro',  categoryIcon:'⬛', exclusive:'iron',    trackId:'shop_spent_weekly' },
  { id:'gold_bonus',    name:'Misión Oro I',         desc:'Exclusiva Oro: Alcanza nivel 20.',       emoji:'🟨',reset:'7d',   xpReward:280, reward:{type:'keys',amount:1,keyId:'key_rare',emoji:'💫',name:'Llave Brillante'},                       target:20,  category:'Exclusivas Oro',    categoryIcon:'🟨', exclusive:'gold',    trackId:'pass_level' },
  { id:'emerald_bonus', name:'Misión Esmeralda',     desc:'Exclusiva Esmeralda: 5 misiones sem.',  emoji:'🟩',reset:'7d',   xpReward:380, reward:{type:'keys',amount:1,keyId:'key_epic',emoji:'🔮',name:'Llave Épica'},                            target:5,   category:'Exclusivas Esmeralda',categoryIcon:'🟩', exclusive:'emerald', trackId:'weekly_missions' },
  { id:'diamond_bonus', name:'Misión Diamante',      desc:'Exclusiva Diamante: Alcanza nivel 50.', emoji:'🔷',reset:'7d',   xpReward:550, reward:{type:'keys',amount:1,keyId:'key_legendary',emoji:'👑',name:'Llave Legendaria'},                 target:50,  category:'Exclusivas Diamante',categoryIcon:'🔷', exclusive:'diamond', trackId:'pass_level' },
];

/* ══════════════════════════════════════════════════════════
   OVERFLOW REWARDS
══════════════════════════════════════════════════════════ */
function getOverflowRewards(tier) {
  const defaults = {
    stone:   [{ type:'keys', emoji:'⭐', name:'Llave Superestrella', amount:1, keyId:'key_common'    }, { type:'copper', emoji:'🪙', name:'Monedas', amount:2 }],
    iron:    [{ type:'keys', emoji:'💫', name:'Llave Brillante',     amount:1, keyId:'key_rare'      }, { type:'copper', emoji:'🪙', name:'Monedas', amount:3 }],
    gold:    [{ type:'keys', emoji:'✨', name:'Llave Especial',      amount:1, keyId:'key_special'   }, { type:'copper', emoji:'🪙', name:'Monedas', amount:4 }],
    emerald: [{ type:'keys', emoji:'🔮', name:'Llave Épica',         amount:1, keyId:'key_epic'      }, { type:'emeralds', emoji:'💎', name:'Gemas',  amount:5 }],
    diamond: [{ type:'keys', emoji:'👑', name:'Llave Legendaria',    amount:1, keyId:'key_legendary' }, { type:'emeralds', emoji:'💎', name:'Gemas',  amount:8 }],
  };
  return defaults[tier] || defaults.stone;
}

/* ══════════════════════════════════════════════════════════
   PERSISTENCIA DE ESTADO
══════════════════════════════════════════════════════════ */
const PASS_STATE_DEFAULTS = {
  tier:'stone', xp:0, level:1, claimedLevels:[],
  inventory:{}, missions:{}, shopBought:false,
  overflowXP:0, overflowRewardIdx:0,
  stats:{ shopSpentDaily:0, shopSpentWeekly:0, shopSpentMonthly:0, shopSpentTotal:0, loginStreak:0, totalLogins:0, lastLoginDate:null, weeklyMissionsDone:0 },
};

function getPassState(passId) {
  try {
    const raw = localStorage.getItem(`mv_pass_${passId}`);
    if (!raw) return JSON.parse(JSON.stringify(PASS_STATE_DEFAULTS));
    const parsed = JSON.parse(raw);
    return { ...JSON.parse(JSON.stringify(PASS_STATE_DEFAULTS)), ...parsed };
  } catch { return JSON.parse(JSON.stringify(PASS_STATE_DEFAULTS)); }
}

function savePassState(passId, state) {
  try { localStorage.setItem(`mv_pass_${passId}`, JSON.stringify(state)); } catch {}
  scheduleSync();
}

function getGlobalInventory() { return lsGet(GLOBAL_INV_LS, {}); }
function saveGlobalInventory(inv) { lsSet(GLOBAL_INV_LS, inv); }

function addToInventory(passId, passName, key, emoji, name, amount) {
  const st = getPassState(passId);
  if (!st.inventory) st.inventory = {};
  if (!st.inventory[key]) st.inventory[key] = { count:0, emoji, name };
  st.inventory[key].count += amount;
  savePassState(passId, st);

  const glob = getGlobalInventory();
  const gk = `${passName}::${key}`;
  if (!glob[gk]) glob[gk] = { count:0, emoji, name, passName };
  glob[gk].count += amount;
  saveGlobalInventory(glob);
}

/* ══════════════════════════════════════════════════════════
   CHEST KEYS / TICKETS
══════════════════════════════════════════════════════════ */
function awardChestKey(keyId, amount) {
  const keys = lsGet(CHEST_KEYS_LS, {});
  keys[keyId] = (keys[keyId] || 0) + amount;
  lsSet(CHEST_KEYS_LS, keys);
}
function awardTicket(subtype, amount) {
  const k = `${TICKETS_BASE}${subtype || 'classic'}`;
  const cur = parseInt(localStorage.getItem(k) || '0', 10);
  localStorage.setItem(k, String(cur + amount));
}

/* ══════════════════════════════════════════════════════════
   SISTEMA DE BOOSTS
══════════════════════════════════════════════════════════ */
function getActiveBoosts() { return lsGet(PASS_BOOSTS_LS, []).filter(b => b && b.expiry > now()); }
function saveActiveBoosts(b) { lsSet(PASS_BOOSTS_LS, b); }
function getBoostMultiplier() { const b = getActiveBoosts(); return b.length ? Math.max(...b.map(x => x.multiplier)) : 1; }
function getTopBoost() { const b = getActiveBoosts(); return b.length ? b.sort((a,x) => x.multiplier - a.multiplier)[0] : null; }

function activateBoost(passId, hours, multiplier, label) {
  const boosts = getActiveBoosts();
  boosts.push({ multiplier, expiry: now() + hours * H1, label: label || `Boost XP ×${multiplier}`, passId });
  saveActiveBoosts(boosts);
  toast(`⚡ ${label || `Boost ×${multiplier}`} activado por ${hours}h!`);
  if (activePassId) updateHUD(activePassId);
  startBoostTimer();
  scheduleSync();
}

let _boostTimerIv = null;
function startBoostTimer() {
  if (_boostTimerIv) return;
  _boostTimerIv = setInterval(() => {
    if (activePassId) updateHUD(activePassId);
    if (!getActiveBoosts().length) { clearInterval(_boostTimerIv); _boostTimerIv = null; }
  }, 1000);
}

/* ══════════════════════════════════════════════════════════
   PROCESAR RECOMPENSA
══════════════════════════════════════════════════════════ */
function processReward(passId, passName, reward, mult = 1) {
  if (!reward) return;
  const amt = Math.max(1, Math.round((reward.amount || 1) * mult));
  const r = { ...reward, amount: amt };
  switch (r.type) {
    case 'xp':
      addXP(passId, amt);
      addToInventory(passId, passName, 'xp', '⭐', 'XP Bonus', amt);
      break;
    case 'emeralds':
      addToInventory(passId, passName, 'emeralds', '💎', 'Gemas', amt);
      break;
    case 'keys': {
      const kid = r.keyId || 'key_common';
      awardChestKey(kid, amt);
      addToInventory(passId, passName, `key_${kid}`, r.emoji || '🔑', r.name || 'Llave', amt);
      break;
    }
    case 'tickets':
      awardTicket(r.subtype || 'classic', amt);
      addToInventory(passId, passName, `ticket_${r.subtype||'classic'}`, '🎫', r.name || 'Ticket', amt);
      break;
    case 'copper':
      addToInventory(passId, passName, 'copper', '🪙', 'Monedas', amt);
      break;
    case 'boost':
      activateBoost(passId, r.boostHours || 1, r.boostMultiplier || 1.5, r.name);
      addToInventory(passId, passName, `boost_${now()}`, '⚡', r.name || 'Boost XP', 1);
      break;
    case 'random': {
      const opts = [
        { type:'keys',     emoji:'⭐', name:'Llave x3',              amount:3, keyId:'key_common'    },
        { type:'emeralds', emoji:'💎', name:'Gemas',                 amount:100                      },
        { type:'keys',     emoji:'💫', name:'Llave Brillante x2',   amount:2, keyId:'key_rare'       },
        { type:'keys',     emoji:'👑', name:'Llave Legendaria',      amount:1, keyId:'key_legendary' },
      ];
      const chosen = opts[Math.floor(Math.random() * opts.length)];
      processReward(passId, passName, chosen);
      toast(`🎁 Sorpresa: ${chosen.emoji} ${chosen.name} ×${chosen.amount}`);
      break;
    }
    default:
      addToInventory(passId, passName, `item_${now()}`, r.emoji || '📦', r.name || 'Ítem', amt);
  }
}

/* ══════════════════════════════════════════════════════════
   XP / NIVELES
══════════════════════════════════════════════════════════ */
function addXP(passId, baseAmount) {
  const boostMult = getBoostMultiplier();
  const amount = Math.round(baseAmount * boostMult);
  if (boostMult > 1) toast(`⚡ Boost ×${boostMult} → +${amount} XP (base: ${baseAmount})`);
  const st = getPassState(passId);
  st.xp = (st.xp || 0) + amount;
  while (st.level < MAX_LEVELS) {
    const needed = st.level * XP_PER_LEVEL;
    if (st.xp >= needed) { st.xp -= needed; st.level += 1; toast(`⬆️ ¡Subiste al nivel ${st.level}!`); }
    else break;
  }
  if (st.level >= MAX_LEVELS) {
    const pass = PASSES.find(p => p.id === passId);
    st.overflowXP = (st.overflowXP || 0) + st.xp; st.xp = 0;
    const overflows = getOverflowRewards(st.tier);
    while (st.overflowXP >= OVERFLOW_XP_PER_REWARD) {
      st.overflowXP -= OVERFLOW_XP_PER_REWARD;
      const idx = (st.overflowRewardIdx || 0) % overflows.length;
      st.overflowRewardIdx = idx + 1;
      processReward(passId, pass ? pass.name : passId, overflows[idx]);
    }
  }
  savePassState(passId, st);
  trackMissionProgress(passId, 'pass_level', 0);
}

function getXPForLevel(level) { return level * XP_PER_LEVEL; }

function getPassStatus(pass) {
  const n = now();
  const s = new Date(pass.startDate + 'T00:00:00').getTime();
  const e = new Date(pass.endDate + 'T23:59:59').getTime();
  if (n < s) return 'upcoming';
  if (n > e) return 'ended';
  return 'active';
}

/* ══════════════════════════════════════════════════════════
   MISIONES — RESET Y ESTADO
══════════════════════════════════════════════════════════ */
function getNextMidnight() { const d = new Date(); d.setHours(24, 0, 0, 0); return d.getTime(); }
function getNextReset(resetType) {
  const m = getNextMidnight();
  return { '24h':m, '7d':m+6*H24, '12d':m+11*H24, '24d':m+23*H24 }[resetType] || m;
}

function getMissionState(passId, mId) {
  const st = getPassState(passId);
  return (st.missions || {})[mId] || { progress:0, claimed:false, resetAt:0 };
}
function saveMissionState(passId, mId, mst) {
  const st = getPassState(passId);
  if (!st.missions) st.missions = {};
  st.missions[mId] = mst;
  savePassState(passId, st);
}

function checkMissionReset(passId, m) {
  if (m.reset === 'unique') return;
  const mst = getMissionState(passId, m.id);
  const n = now();
  if (!mst.resetAt) {
    saveMissionState(passId, m.id, { progress:m.preCompleted?m.target:0, claimed:false, resetAt:getNextReset(m.reset) });
    return;
  }
  if (n > mst.resetAt) {
    saveMissionState(passId, m.id, { progress:m.preCompleted?m.target:0, claimed:false, resetAt:getNextReset(m.reset) });
  }
}

function isMissionUnlocked(passId, m) {
  if (!m.exclusive) return true;
  const st = getPassState(passId);
  return TIER_ORDER.indexOf(st.tier || 'stone') >= TIER_ORDER.indexOf(m.exclusive);
}

function isTierOwned(st, tierId) {
  return TIER_ORDER.indexOf(st.tier || 'stone') >= TIER_ORDER.indexOf(tierId);
}

function trackMissionProgress(passId, trackId, amount = 1) {
  MISSIONS_TEMPLATE.filter(m => m.trackId === trackId).forEach(m => {
    const mst = getMissionState(passId, m.id);
    if (mst.claimed) return;
    if (trackId === 'pass_level') {
      const st = getPassState(passId);
      mst.progress = Math.min(m.target, st.level);
    } else {
      mst.progress = Math.min(m.target, (mst.progress || 0) + amount);
    }
    saveMissionState(passId, m.id, mst);
  });
}

/* ══════════════════════════════════════════════════════════
   UI — ESTADO ACTIVO
══════════════════════════════════════════════════════════ */
let activePassId = null;
let _headerCDIv = null, _missBanIv = null;

function setActivePass(passId) {
  activePassId = passId;
  $$('.pass-card-btn').forEach(b => b.classList.toggle('is-active', b.dataset.passId === passId));
  recordDailyLogin(passId);
  initGameMissions(passId);
  $('#passMainSec').style.display = '';
  $('#noPassSec').style.display = 'none';
  setTimeout(() => {
    const el = $('#passMainSec');
    if (el) el.scrollIntoView({ behavior:'smooth', block:'start' });
  }, 100);
  renderPassHeader(passId);
  renderTrack(passId);
  renderMissions(passId);
  renderInventory(passId);
  renderMejoras(passId);
  renderPassMailbox();
  updateHUD(passId);
  loadPassMusic(passId);
}

/* ── DAILY LOGIN ── */
function recordDailyLogin(passId) {
  const st = getPassState(passId);
  if (!st.stats) st.stats = {};
  const today = new Date().toDateString();
  if (st.stats.lastLoginDate === today) { trackMissionProgress(passId, 'pass_level', 0); return; }
  st.stats.lastLoginDate = today;
  st.stats.totalLogins = (st.stats.totalLogins || 0) + 1;
  const yesterday = new Date(now() - H24).toDateString();
  if (st.stats.lastLoginPrev === yesterday) st.stats.loginStreak = (st.stats.loginStreak || 0) + 1;
  else st.stats.loginStreak = 1;
  st.stats.lastLoginPrev = today;
  savePassState(passId, st);

  const dlMst = getMissionState(passId, 'daily_login');
  dlMst.progress = Math.min(1, (dlMst.progress || 0) + 1);
  saveMissionState(passId, 'daily_login', dlMst);

  MISSIONS_TEMPLATE.filter(m => m.trackId === 'login_streak').forEach(m => {
    const ms = getMissionState(passId, m.id);
    if (!ms.claimed) { ms.progress = Math.min(m.target, st.stats.loginStreak); saveMissionState(passId, m.id, ms); }
  });
  MISSIONS_TEMPLATE.filter(m => m.trackId === 'total_logins').forEach(m => {
    const ms = getMissionState(passId, m.id);
    if (!ms.claimed) { ms.progress = Math.min(m.target, st.stats.totalLogins); saveMissionState(passId, m.id, ms); }
  });
  trackMissionProgress(passId, 'pass_level', 0);
}

function initGameMissions(passId) {
  MISSIONS_TEMPLATE.filter(m => m.isGame && m.preCompleted).forEach(m => {
    const mst = getMissionState(passId, m.id);
    if (!mst.resetAt || now() > mst.resetAt) {
      saveMissionState(passId, m.id, { progress:m.target, claimed:false, resetAt:getNextMidnight() });
    } else if (mst.progress < m.target) {
      saveMissionState(passId, m.id, { ...mst, progress:m.target });
    }
  });
}

/* ══════════════════════════════════════════════════════════
   RENDER: CABECERA DEL PASE
══════════════════════════════════════════════════════════ */
function renderPassHeader(passId) {
  const pass = PASSES.find(p => p.id === passId);
  if (!pass) return;
  const st = getPassState(passId);
  if (_headerCDIv) { clearInterval(_headerCDIv); _headerCDIv = null; }
  const status = getPassStatus(pass);
  const tierInfo = TIERS.find(t => t.id === (st.tier || 'stone')) || TIERS[0];
  const tc = ({
    stone:   {text:'var(--tier-stone)',  border:'rgba(156,163,175,0.4)',bg:'rgba(156,163,175,0.15)'},
    iron:    {text:'var(--tier-iron)',   border:'rgba(209,213,219,0.4)',bg:'rgba(209,213,219,0.15)'},
    gold:    {text:'var(--tier-gold)',   border:'rgba(251,191,36,0.4)', bg:'rgba(251,191,36,0.12)'},
    emerald: {text:'var(--tier-emerald)',border:'rgba(52,211,153,0.4)', bg:'rgba(52,211,153,0.12)'},
    diamond: {text:'var(--tier-diamond)',border:'rgba(103,232,249,0.4)',bg:'rgba(103,232,249,0.12)'},
  })[st.tier || 'stone'];
  const isMax = st.level >= MAX_LEVELS;
  const totalXP = isMax ? OVERFLOW_XP_PER_REWARD : getXPForLevel(st.level);
  const curXP = isMax ? ((st.overflowXP||0) % OVERFLOW_XP_PER_REWARD) : (st.xp || 0);
  const pct = Math.min(100, Math.round((curXP / totalXP) * 100));
  const statusLabels = { active:'● ACTIVO', upcoming:'○ PRÓXIMO', ended:'✕ FINALIZADO' };
  const endMs   = new Date(pass.endDate   + 'T23:59:59').getTime();
  const startMs = new Date(pass.startDate + 'T00:00:00').getTime();
  const nowMs   = now();
  const card = $('#passHeaderCard');
  if (!card) return;
  card.innerHTML = `
    <div class="phc-bg" style="background-image:url('${esc(pass.bg||'')}')"></div>
    <div class="phc-bg-overlay"></div>
    <div class="phc-tier-badge" style="color:${tc.text};border-color:${tc.border};background:${tc.bg}">
      ${tierInfo.emoji} ${tierInfo.name} — ${tierInfo.desc}
    </div>
    <div class="phc-inner">
      <div class="phc-left">
        <div class="phc-badges">
          <span class="phc-badge phc-badge-season">${esc(pass.season)}</span>
          <span class="phc-badge phc-badge-${status}">${statusLabels[status]}</span>
          ${isMax?'<span class="phc-badge" style="color:var(--tier-gold);border-color:rgba(251,191,36,0.5);background:rgba(251,191,36,0.1)">🏆 NIVEL MÁXIMO</span>':''}
        </div>
        <div class="phc-title-wrap">
          <span class="phc-emoji">${pass.emoji}</span>
          <h2 class="phc-name">${esc(pass.name)}</h2>
        </div>
        <p class="phc-desc">${esc(pass.description)}</p>
        <div class="phc-dates-row">
          <span class="phc-date-pill">📅 Inicio: ${pass.startDate}</span>
          <span class="phc-date-pill">🏁 Fin: ${pass.endDate}</span>
        </div>
        <div class="phc-xp-section">
          <div class="phc-xp-header">
            <span class="phc-xp-header-left">${tierInfo.emoji} ${tierInfo.name} · ${isMax?'🏆 NIVEL MÁX.':'NIVEL '+st.level+' / '+MAX_LEVELS}</span>
            <span class="phc-xp-header-right">${curXP} / ${totalXP} XP · ${pct}%</span>
          </div>
          <div class="phc-xp-bar">
            <div class="phc-xp-fill ${isMax?'is-maxlevel':''}" style="width:${pct}%"></div>
          </div>
          <div class="phc-level-row">
            <span>${isMax?'Cada '+OVERFLOW_XP_PER_REWARD+' XP = Llave Especial':'Nivel '+st.level}</span>
            <span>${isMax?'':'Nivel '+(st.level+1)}</span>
          </div>
        </div>
      </div>
      <div class="phc-countdown">
        <span class="phc-cd-label">${nowMs>endMs?'⏰ FINALIZADO':nowMs<startMs?'⏳ COMIENZA EN':'⏰ FINALIZA EN'}</span>
        <div class="phc-cd-blocks">
          <div class="phc-cd-block"><span class="phc-cd-val" id="hcd-d">--</span><span class="phc-cd-lbl">días</span></div>
          <div class="phc-cd-block"><span class="phc-cd-val" id="hcd-h">--</span><span class="phc-cd-lbl">hrs</span></div>
          <div class="phc-cd-block"><span class="phc-cd-val" id="hcd-m">--</span><span class="phc-cd-lbl">min</span></div>
          <div class="phc-cd-block"><span class="phc-cd-val" id="hcd-s">--</span><span class="phc-cd-lbl">seg</span></div>
        </div>
      </div>
    </div>`;
  const targetMs = nowMs < startMs ? startMs : endMs;
  const pad = n => String(n).padStart(2,'0');
  const tickH = () => {
    const diff = Math.max(0, targetMs - now());
    const d=Math.floor(diff/H24), h=Math.floor((diff%H24)/H1), m=Math.floor((diff%H1)/M1), s=Math.floor((diff%M1)/1000);
    const setV = (id, v) => { const el=document.getElementById(id); if(el) el.textContent=pad(v); };
    setV('hcd-d',d); setV('hcd-h',h); setV('hcd-m',m); setV('hcd-s',s);
  };
  tickH();
  _headerCDIv = setInterval(tickH, 1000);
}

/* ══════════════════════════════════════════════════════════
   RENDER: CARRIL DE RECOMPENSAS
══════════════════════════════════════════════════════════ */
function renderTrack(passId) {
  const pass = PASSES.find(p => p.id === passId);
  const st   = getPassState(passId);
  if (!pass) return;
  renderMaxLevelBanner(passId);
  const hasPaid    = (st.tier || 'stone') !== 'stone';
  const tierInfo   = TIERS.find(t => t.id === (st.tier || 'stone')) || TIERS[0];
  const paidColors = { stone:'rgba(156,163,175,.5)', iron:'rgba(209,213,219,.5)', gold:'rgba(251,191,36,.7)', emerald:'rgba(52,211,153,.7)', diamond:'rgba(103,232,249,.7)' };
  const paidColor  = paidColors[st.tier || 'stone'];
  const mult       = st.tier==='gold'?1.5:st.tier==='diamond'?2:1;

  const selBar = $('#passTrackTierSelector');
  if (selBar) {
    selBar.innerHTML = TIERS.map(t => {
      const owned = isTierOwned(st, t.id);
      const isAct = (st.tier || 'stone') === t.id;
      return `<button class="tier-pill ${t.id} ${isAct?'active':''} ${!owned?'locked':''}" onclick="window._filterTierView('${passId}','${t.id}')">
        ${t.emoji} ${t.name} <span style="font-size:0.7em;opacity:0.6">${owned?'✓':'🔒'}</span>
      </button>`;
    }).join('');
  }

  const legendPaidEl = document.getElementById('legendPaidLabel');
  if (legendPaidEl) legendPaidEl.textContent = hasPaid ? `Pagado (${tierInfo.emoji} ${tierInfo.name})` : 'Pagado (Hierro+)';

  let pendingTrack = 0;
  for (let i = 0; i < MAX_LEVELS; i++) {
    const isDone = st.level > (i+1) || st.level >= MAX_LEVELS;
    if (!isDone) continue;
    if (!(st.claimedLevels||[]).includes(`free_${i}`)) pendingTrack++;
    if (hasPaid && !(st.claimedLevels||[]).includes(`paid_${i}`)) pendingTrack++;
  }
  const claimAllWrap = $('#claimAllTrackWrap');
  if (claimAllWrap) {
    if (pendingTrack > 0) {
      claimAllWrap.innerHTML = `<button class="claim-all-btn" onclick="window._claimAllLevelRewards('${passId}')">✨ RECLAMAR TODO <span class="claim-all-badge">${pendingTrack}</span></button>`;
      claimAllWrap.style.display = '';
    } else {
      claimAllWrap.innerHTML = '';
      claimAllWrap.style.display = 'none';
    }
  }

  let numCells='', freeRow='', paidRow='', xpCells='';
  for (let i = 0; i < MAX_LEVELS; i++) {
    const lvlNum  = i + 1;
    const lvlData = pass.levels[i] || makeDefaultLevels()[i];
    const isDone  = st.level > lvlNum || st.level >= MAX_LEVELS;
    const isCur   = st.level === lvlNum && st.level < MAX_LEVELS;
    const isMile  = lvlNum % 10 === 0;
    const clFree  = (st.claimedLevels||[]).includes(`free_${i}`);
    const clPaid  = (st.claimedLevels||[]).includes(`paid_${i}`);
    const freeR   = lvlData.free;
    const paidR   = lvlData.paid;

    numCells += `<div class="track-level-cell ${isMile?'milestone-num':''} ${isCur?'current-num':''}">${lvlNum}${isMile?' ★':''}</div>`;

    let fnc = `track-node free-node ${clFree?'node-claimed':isDone?'node-done':isCur?'node-current':'node-locked'} ${isMile?'milestone-node':''}`;
    freeRow += `<div class="track-node-cell ${isMile?'milestone-cell':''} ${isCur?'current-cell':''}">
      <div class="${fnc}" onclick="window._openLevelModal(${i},'free')">
        <span class="node-emoji">${freeR?freeR.emoji||'⭐':'⭐'}</span>
        ${isDone&&!clFree?'<div class="node-badge">!</div>':''}
      </div>
      <div class="node-label">${freeR?esc(freeR.name):''}</div>
      ${freeR?`<div class="node-amount">×${freeR.amount}</div>`:''}
    </div>`;

    let pnc = `track-node paid-node ${clPaid?'node-claimed':!hasPaid?'node-locked-tier':isDone?'node-done':isCur?'node-current':'node-locked'} ${isMile?'milestone-node':''}`;
    paidRow += `<div class="track-node-cell ${isMile?'milestone-cell':''} ${isCur?'current-cell':''}">
      <div class="${pnc}" onclick="window._openLevelModal(${i},'paid')">
        <span class="node-emoji">${paidR?paidR.emoji||'🟨':'🟨'}${!hasPaid?'<span style="font-size:.65rem;position:absolute;bottom:-4px;right:-4px">🔒</span>':''}</span>
        ${hasPaid&&isDone&&!clPaid?'<div class="node-badge">!</div>':''}
      </div>
      <div class="node-label">${paidR?esc(paidR.name):''}</div>
      ${paidR?`<div class="node-amount" style="color:var(--tier-gold)">×${Math.round(paidR.amount*mult)}</div>`:''}
    </div>`;

    xpCells += `<div class="xp-cell ${isCur?'current-xp':''}">${lvlNum*XP_PER_LEVEL} XP</div>`;
  }

  const container = $('#passTrackContainer');
  if (!container) return;
  container.innerHTML = `
    <div class="track-header-row">
      <div class="track-header-label free-hlbl">⬜ GRATIS</div>
      <div class="track-scroll-wrap" id="trackHScroll"><div class="track-header-nums">${numCells}</div></div>
    </div>
    <div class="track-rows-inner">
      <div class="track-row-label free-lbl">⬜ GRATIS · PIEDRA</div>
      <div class="track-scroll-wrap" id="trackFScroll"><div style="display:flex;min-width:max-content">${freeRow}</div></div>
    </div>
    <div class="track-rows-inner" style="border-top:2px solid ${paidColor}22">
      <div class="track-row-label paid-lbl" style="color:${paidColor}">${tierInfo.emoji} ${tierInfo.name.toUpperCase()}</div>
      <div class="track-scroll-wrap" id="trackPScroll"><div style="display:flex;min-width:max-content">${paidRow}</div></div>
    </div>
    <div class="track-xp-row"><div class="track-xp-inner"><div class="xp-cell-blank"></div>${xpCells}</div></div>`;
  syncTrackScrolls();
  setTimeout(() => {
    const idx = st.level >= MAX_LEVELS ? MAX_LEVELS - 4 : Math.max(0, st.level - 4);
    ['trackHScroll','trackFScroll','trackPScroll'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.scrollLeft = idx * 88;
    });
  }, 150);
}

function syncTrackScrolls() {
  const ids = ['trackHScroll','trackFScroll','trackPScroll'];
  let syncing = false;
  ids.forEach(id => {
    const el = document.getElementById(id); if (!el) return;
    el.addEventListener('scroll', () => {
      if (syncing) return; syncing = true;
      ids.forEach(oid => { if(oid!==id){const o=document.getElementById(oid);if(o)o.scrollLeft=el.scrollLeft;} });
      const xp = $('.track-xp-row'); if (xp) xp.scrollLeft = el.scrollLeft;
      setTimeout(() => syncing = false, 10);
    });
  });
}

function renderMaxLevelBanner(passId) {
  const st = getPassState(passId);
  const banner = $('#passMaxLevelBanner');
  if (!banner) return;
  if (st.level < MAX_LEVELS) { banner.classList.add('hidden'); return; }
  banner.classList.remove('hidden');
  const ovArr = getOverflowRewards(st.tier || 'stone');
  const nextR = ovArr[(st.overflowRewardIdx||0) % ovArr.length];
  const xpStored = (st.overflowXP||0) % OVERFLOW_XP_PER_REWARD;
  const earned   = Math.floor((st.overflowXP||0) / OVERFLOW_XP_PER_REWARD);
  banner.innerHTML = `
    <span class="pmlb-icon">🏆</span>
    <div class="pmlb-info">
      <div class="pmlb-title">¡NIVEL MÁXIMO! — OVERFLOW XP → LLAVES ESPECIALES</div>
      <div class="pmlb-sub">Cada <strong>${OVERFLOW_XP_PER_REWARD} XP</strong> = Llave Superestrella. Obtenidas: <strong>${earned}</strong></div>
      <div class="pmlb-rewards">
        <span class="pmlb-pill">XP: ${xpStored} / ${OVERFLOW_XP_PER_REWARD}</span>
        ${nextR?`<span class="pmlb-pill">Próxima: ${nextR.emoji} ${nextR.name}</span>`:''}
        <span class="pmlb-pill">Faltan: ${OVERFLOW_XP_PER_REWARD - xpStored} XP</span>
      </div>
    </div>`;
}

/* ══════════════════════════════════════════════════════════
   MODAL DE NIVEL
══════════════════════════════════════════════════════════ */
function openLevelModal(levelIndex, row = 'free') {
  if (!activePassId) return;
  const pass = PASSES.find(p => p.id === activePassId);
  const st   = getPassState(activePassId);
  const lvlNum  = levelIndex + 1;
  const lvlData = pass.levels[levelIndex] || makeDefaultLevels()[levelIndex];
  const isDone  = st.level > lvlNum || st.level >= MAX_LEVELS;
  const status  = getPassStatus(pass);
  if (status === 'upcoming') { toast(`⏳ Este pase no ha comenzado. ¡Espera al ${pass.startDate}!`); return; }
  const clFree  = (st.claimedLevels||[]).includes(`free_${levelIndex}`);
  const clPaid  = (st.claimedLevels||[]).includes(`paid_${levelIndex}`);
  const hasPaid = (st.tier || 'stone') !== 'stone';
  const freeR   = lvlData.free;
  const paidR   = lvlData.paid;
  const canClaimFree = isDone && !clFree;
  const canClaimPaid = hasPaid && isDone && !clPaid;
  const tierInfo = TIERS.find(t => t.id === (st.tier || 'stone')) || TIERS[0];
  const mult     = st.tier==='gold'?1.5:st.tier==='diamond'?2:1;
  const modal    = document.getElementById('rewardModal');
  const titleEl  = document.getElementById('rewardTitle');
  if (titleEl) titleEl.textContent = `NIVEL ${lvlNum}${lvlNum%10===0?' ✦ HITO ÉPICO':''}`;
  const bodyEl   = document.getElementById('rewardBody');
  if (bodyEl) bodyEl.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:10px">
      <div style="padding:18px;background:rgba(156,163,175,0.06);border:2px solid ${clFree?'rgba(52,211,153,0.4)':'rgba(156,163,175,0.25)'};box-shadow:3px 3px 0 #000;text-align:center;position:relative">
        ${clFree?'<div style="position:absolute;top:8px;right:8px;font-family:var(--font-pixel);font-size:0.26rem;color:#34d399">✓</div>':''}
        <div style="font-family:var(--font-pixel);font-size:0.28rem;color:var(--tier-stone);margin-bottom:10px;letter-spacing:1px">⬜ GRATIS</div>
        <div style="font-size:2.4rem;margin-bottom:8px">${freeR?freeR.emoji||'⭐':'—'}</div>
        <div style="font-family:var(--font-pixel);font-size:0.3rem;color:var(--text);line-height:1.8">${freeR?esc(freeR.name):'—'}</div>
        ${freeR?`<div style="font-family:var(--font-pixel);font-size:0.28rem;color:#a5b4fc;margin-top:4px">×${freeR.amount}</div>`:''}
        ${freeR&&freeR.type==='keys'?`<div style="font-family:var(--font-pixel);font-size:0.22rem;color:#60a5fa;margin-top:6px">🔑 Va a Cofres</div>`:''}
        ${!isDone?`<div style="font-family:var(--font-pixel);font-size:0.22rem;color:var(--dim);margin-top:8px">🔒 Bloqueado</div>`:''}
        ${canClaimFree?`<button style="margin-top:10px;height:34px;padding:0 14px;font-family:var(--font-pixel);font-size:0.28rem;background:linear-gradient(135deg,#6b7280,#9ca3af);color:#fff;border:2px solid var(--tier-stone);box-shadow:2px 2px 0 #000;cursor:pointer" onclick="window._claimLevelReward(${levelIndex},'free')">⬜ RECLAMAR</button>`:''}
        ${clFree?`<div style="margin-top:8px;font-family:var(--font-pixel);font-size:0.26rem;color:#34d399">✓ Reclamado</div>`:''}
      </div>
      <div style="padding:18px;background:${hasPaid?'rgba(251,191,36,0.06)':'rgba(0,0,0,0.15)'};border:2px solid ${clPaid?'rgba(52,211,153,0.4)':'rgba(251,191,36,0.3)'};box-shadow:3px 3px 0 #000;text-align:center;position:relative${!hasPaid?';filter:grayscale(0.7);opacity:0.6':''}">
        ${clPaid?'<div style="position:absolute;top:8px;right:8px;font-family:var(--font-pixel);font-size:0.26rem;color:#34d399">✓</div>':''}
        <div style="font-family:var(--font-pixel);font-size:0.28rem;color:${hasPaid?'var(--tier-gold)':'var(--dim)'};margin-bottom:10px;letter-spacing:1px">${tierInfo.emoji} ${tierInfo.name}</div>
        <div style="font-size:2.4rem;margin-bottom:8px">${paidR?paidR.emoji||'🟨':'—'}</div>
        <div style="font-family:var(--font-pixel);font-size:0.3rem;color:var(--text);line-height:1.8">${paidR?esc(paidR.name):'—'}</div>
        ${paidR?`<div style="font-family:var(--font-pixel);font-size:0.28rem;color:var(--tier-gold);margin-top:4px">×${Math.round(paidR.amount*mult)}</div>`:''}
        ${paidR&&paidR.type==='keys'?`<div style="font-family:var(--font-pixel);font-size:0.22rem;color:#60a5fa;margin-top:6px">🔑 Va a Cofres</div>`:''}
        ${!hasPaid?`<div style="font-family:var(--font-pixel);font-size:0.22rem;color:var(--dim);margin-top:8px">🔒 Requiere Pase Hierro+</div>`:''}
        ${hasPaid&&!isDone?`<div style="font-family:var(--font-pixel);font-size:0.22rem;color:var(--dim);margin-top:8px">🔒 Bloqueado</div>`:''}
        ${canClaimPaid?`<button style="margin-top:10px;height:34px;padding:0 14px;font-family:var(--font-pixel);font-size:0.28rem;background:linear-gradient(135deg,#f59e0b,#fbbf24);color:#000;border:2px solid var(--tier-gold);box-shadow:2px 2px 0 #000;cursor:pointer" onclick="window._claimLevelReward(${levelIndex},'paid')">✨ RECLAMAR</button>`:''}
        ${clPaid?`<div style="margin-top:8px;font-family:var(--font-pixel);font-size:0.26rem;color:#34d399">✓ Reclamado</div>`:''}
      </div>
    </div>`;
  const claimBtn = document.getElementById('rewardClaim');
  const canAny   = canClaimFree || canClaimPaid;
  claimBtn.disabled    = !canAny;
  claimBtn.textContent = canAny ? '✨ RECLAMAR AMBAS' : (isDone ? '✓ YA RECLAMADO' : '🔒 BLOQUEADO');
  claimBtn.onclick = () => {
    if (canClaimFree) claimLevelReward(levelIndex, 'free');
    if (canClaimPaid) claimLevelReward(levelIndex, 'paid');
    if (canClaimFree || canClaimPaid) closeRewardModal();
  };
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function claimLevelReward(levelIndex, row = 'free') {
  if (!activePassId) return;
  const pass = PASSES.find(p => p.id === activePassId);
  const st   = getPassState(activePassId);
  const lvlNum = levelIndex + 1;
  if (st.level <= lvlNum && st.level < MAX_LEVELS) { toast('⚠️ Aún no alcanzaste este nivel'); return; }
  const claimKey = `${row}_${levelIndex}`;
  if ((st.claimedLevels||[]).includes(claimKey)) { toast('Ya reclamaste esta recompensa'); return; }
  if (getPassStatus(pass) === 'upcoming') { toast('⏳ Este pase no ha comenzado'); return; }
  const lvlData  = pass.levels[levelIndex] || makeDefaultLevels()[levelIndex];
  const hasPaid  = (st.tier || 'stone') !== 'stone';
  if (row === 'paid' && !hasPaid) { toast('🔒 Necesitas Pase Hierro+ para recompensas de pago'); return; }
  const reward   = row === 'paid' ? lvlData.paid : lvlData.free;
  if (!reward)   { toast('Sin recompensa disponible'); return; }
  const mult     = st.tier==='gold'?1.5:st.tier==='diamond'?2:1;
  processReward(activePassId, pass.name, reward, mult);
  const freshSt  = getPassState(activePassId);
  freshSt.claimedLevels = [...(freshSt.claimedLevels||[]), claimKey];
  savePassState(activePassId, freshSt);
  toast(`✨ Reclamado: ${reward.emoji} ${reward.name} ×${Math.round(reward.amount*mult)}`);
  renderPassHeader(activePassId);
  renderTrack(activePassId);
  renderInventory(activePassId);
  updateHUD(activePassId);
}

function claimAllLevelRewards(passId) {
  if (!passId) return;
  const pass = PASSES.find(p => p.id === passId);
  if (!pass || getPassStatus(pass) !== 'active') { toast('⏳/🔒 Pase no disponible'); return; }
  const st      = getPassState(passId);
  const hasPaid = (st.tier || 'stone') !== 'stone';
  const mult    = st.tier==='gold'?1.5:st.tier==='diamond'?2:1;
  let total     = 0;
  for (let i = 0; i < MAX_LEVELS; i++) {
    const isDone  = st.level > (i+1) || st.level >= MAX_LEVELS;
    if (!isDone) continue;
    const lvlData = pass.levels[i] || makeDefaultLevels()[i];
    const freshSt = getPassState(passId);
    if (!freshSt.claimedLevels.includes(`free_${i}`) && lvlData.free) {
      processReward(passId, pass.name, lvlData.free, 1);
      const s2 = getPassState(passId);
      s2.claimedLevels = [...(s2.claimedLevels||[]), `free_${i}`];
      savePassState(passId, s2);
      total++;
    }
    if (hasPaid) {
      const s3 = getPassState(passId);
      if (!s3.claimedLevels.includes(`paid_${i}`) && lvlData.paid) {
        processReward(passId, pass.name, lvlData.paid, mult);
        const s4 = getPassState(passId);
        s4.claimedLevels = [...(s4.claimedLevels||[]), `paid_${i}`];
        savePassState(passId, s4);
        total++;
      }
    }
  }
  toast(total > 0 ? `✨ ¡${total} recompensas reclamadas!` : '📭 No hay recompensas pendientes');
  renderPassHeader(passId);
  renderTrack(passId);
  renderInventory(passId);
  updateHUD(passId);
}

function closeRewardModal() {
  document.getElementById('rewardModal')?.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

/* ══════════════════════════════════════════════════════════
   RENDER: MISIONES
══════════════════════════════════════════════════════════ */
function renderMissions(passId) {
  const pass     = PASSES.find(p => p.id === passId);
  const status   = getPassStatus(pass);
  const container = $('#missionsGrid');
  const banner    = $('#missionsBanner');
  if (!container) return;
  if (_missBanIv) { clearInterval(_missBanIv); _missBanIv = null; }

  if (status === 'ended') {
    if (banner) { banner.classList.remove('hidden'); banner.className='missions-banner ended'; banner.innerHTML=`<span class="ban-icon">🔒</span><div><div class="ban-title">PASE FINALIZADO</div><div class="ban-sub">Este pase ya terminó.</div></div>`; }
    container.innerHTML = '';
    return;
  }
  if (status === 'upcoming') {
    const startMs = new Date(pass.startDate+'T00:00:00').getTime();
    if (banner) { banner.classList.remove('hidden'); banner.className='missions-banner upcoming'; }
    const renderBan = () => {
      if (!banner) return;
      const diff = Math.max(0, startMs - now());
      const d=Math.floor(diff/H24), h=Math.floor((diff%H24)/H1), m=Math.floor((diff%H1)/M1), s=Math.floor((diff%M1)/1000);
      const pad = n => String(n).padStart(2,'0');
      banner.innerHTML=`<span class="ban-icon">⏳</span><div><div class="ban-title">PRÓXIMAMENTE</div><div class="ban-sub">Las misiones se activan cuando empiece el pase.</div></div><div class="ban-cd">${pad(d)}d ${pad(h)}:${pad(m)}:${pad(s)}</div>`;
    };
    renderBan();
    _missBanIv = setInterval(renderBan, 1000);
    container.innerHTML = '';
    return;
  }
  if (banner) banner.classList.add('hidden');

  MISSIONS_TEMPLATE.forEach(m => checkMissionReset(passId, m));

  const claimable = MISSIONS_TEMPLATE.filter(m => {
    if (!isMissionUnlocked(passId, m)) return false;
    const mst = getMissionState(passId, m.id);
    return !mst.claimed && mst.progress >= m.target;
  });

  const claimAllMWrap = $('#claimAllMissionsWrap');
  if (claimAllMWrap) {
    if (claimable.length > 0) {
      claimAllMWrap.innerHTML = `<button class="claim-all-btn" onclick="window._claimAllMissions('${passId}')">📋 RECLAMAR TODO <span class="claim-all-badge">${claimable.length}</span></button>`;
      claimAllMWrap.style.display = '';
    } else {
      claimAllMWrap.innerHTML = '';
      claimAllMWrap.style.display = 'none';
    }
  }

  const groups = {};
  MISSIONS_TEMPLATE.forEach(m => {
    if (!groups[m.category]) groups[m.category] = { icon:m.categoryIcon, missions:[] };
    groups[m.category].missions.push(m);
  });

  const pad = n => String(n).padStart(2,'0');
  const timeLeft = ts => {
    const diff = Math.max(0, ts - now());
    const d=Math.floor(diff/H24), h=Math.floor((diff%H24)/H1), m=Math.floor((diff%H1)/M1);
    if(d>=1) return `${d}d ${h}h`;
    if(h>=1) return `${h}h ${m}m`;
    return `${m}m`;
  };

  let html = '';
  for (const [cat, {icon, missions}] of Object.entries(groups)) {
    const done = missions.filter(m => getMissionState(passId, m.id).claimed).length;
    html += `<div class="mission-group-block">
      <div class="mission-group-header">
        <span class="mgb-icon">${icon}</span>
        <span class="mgb-title">${esc(cat)}</span>
        <span class="mgb-count">${done}/${missions.length} completadas</span>
      </div><div style="display:flex;flex-direction:column;gap:6px">`;
    missions.forEach(m => {
      const mst      = getMissionState(passId, m.id);
      const unlocked = isMissionUnlocked(passId, m);
      const canClaim = mst.progress >= m.target && !mst.claimed && unlocked;
      const claimed  = mst.claimed;
      const progress = Math.min(m.target, mst.progress || 0);
      const pct      = Math.round((progress / m.target) * 100);
      const resetLabels = { 'unique':'🔂 Única','24h':'↻ Diaria','7d':'↻ Semanal','12d':'↻ 12d','24d':'↻ Mensual' };
      const cdLabel  = mst.resetAt && !claimed && m.reset !== 'unique' && now() < mst.resetAt
        ? `<span class="mc-cooldown">↻ en ${timeLeft(mst.resetAt)}</span>`
        : '';
      const rEmoji   = m.reward?.emoji || '🎁';
      html += `<div class="mission-card ${claimed?'completed':''} ${!unlocked?'locked':''} ${m.exclusive?'exclusive':''} ${m.isGame?'game-mission':''}">
        <div class="mc-icon-wrap">${m.emoji}</div>
        <div class="mc-info">
          <div class="mc-top">
            <span class="mc-name">${esc(m.name)}</span>
            <div class="mc-badges">
              ${m.exclusive?`<span class="mc-badge tier">${m.exclusive.charAt(0).toUpperCase()+m.exclusive.slice(1)}</span>`:''}
              ${m.isGame?'<span class="mc-badge game">🎮 Juego</span>':''}
              <span class="mc-badge reset">${resetLabels[m.reset]||'↻'}</span>
            </div>
          </div>
          <span class="mc-desc">${esc(m.desc)}</span>
          ${unlocked?`<div class="mc-progress-wrap">
            <div class="mc-progress-row"><span class="mc-progress-txt">${progress} / ${m.target} (${pct}%)</span>${cdLabel}</div>
            <div class="mc-bar-track"><div class="mc-bar-fill ${pct>=100?'full':''}" style="width:${pct}%"></div></div>
          </div>`:`<span style="font-family:var(--font-pixel);font-size:0.24rem;color:var(--dim);margin-top:4px;display:block">🔒 Requiere tier ${esc(m.exclusive)}</span>`}
        </div>
        <div class="mc-reward-col">
          <div class="mc-reward-pill">
            <span class="mc-reward-xp">+${m.xpReward} XP</span>
            <span class="mc-reward-item">${rEmoji} <strong>×${m.reward?.amount||1}</strong></span>
          </div>
          ${claimed?'<span class="mc-claimed">✓ HECHO</span>':canClaim?`<button class="mc-claim-btn" onclick="window._claimMission('${m.id}')">✨ RECLAMAR</button>`:`<button class="mc-claim-btn" disabled>${pct}%</button>`}
        </div>
      </div>`;
    });
    html += `</div></div>`;
  }
  container.innerHTML = html;
}

function claimMission(mId) {
  if (!activePassId) return;
  const pass = PASSES.find(p => p.id === activePassId);
  if (getPassStatus(pass) !== 'active') { toast('🔒 Pase no activo'); return; }
  const m = MISSIONS_TEMPLATE.find(x => x.id === mId);
  if (!m) return;
  const mst = getMissionState(activePassId, mId);
  if (mst.claimed)           { toast('Misión ya reclamada');    return; }
  if (mst.progress < m.target) { toast('⚠️ Misión no completada'); return; }
  addXP(activePassId, m.xpReward);
  processReward(activePassId, pass.name, m.reward);
  mst.claimed = true;
  saveMissionState(activePassId, mId, mst);
  const st = getPassState(activePassId);
  if (!st.stats) st.stats = {};
  if (m.reset === '7d') {
    st.stats.weeklyMissionsDone = (st.stats.weeklyMissionsDone||0) + 1;
    savePassState(activePassId, st);
  }
  trackMissionProgress(activePassId, 'weekly_missions', 1);
  toast(`✅ ${m.name} → +${m.xpReward} XP`);
  renderMissions(activePassId);
  renderPassHeader(activePassId);
  updateHUD(activePassId);
}

function claimAllMissions(passId) {
  if (!passId) return;
  const pass = PASSES.find(p => p.id === passId);
  if (!pass || getPassStatus(pass) !== 'active') { toast('🔒 Pase no activo'); return; }
  let total = 0;
  MISSIONS_TEMPLATE.forEach(m => {
    if (!isMissionUnlocked(passId, m)) return;
    const mst = getMissionState(passId, m.id);
    if (mst.claimed || mst.progress < m.target) return;
    addXP(passId, m.xpReward);
    processReward(passId, pass.name, m.reward);
    mst.claimed = true;
    saveMissionState(passId, m.id, mst);
    const st = getPassState(passId);
    if (!st.stats) st.stats = {};
    if (m.reset === '7d') {
      st.stats.weeklyMissionsDone = (st.stats.weeklyMissionsDone||0) + 1;
      savePassState(passId, st);
    }
    trackMissionProgress(passId, 'weekly_missions', 1);
    total++;
  });
  toast(total > 0 ? `✅ ¡${total} misiones reclamadas!` : '📭 No hay misiones por reclamar');
  renderMissions(passId);
  renderPassHeader(passId);
  renderInventory(passId);
  updateHUD(passId);
}

/* ══════════════════════════════════════════════════════════
   SHOP SPEND TRACKING
══════════════════════════════════════════════════════════ */
function recordShopSpend(passId, amount) {
  if (!passId || !amount) return;
  const st = getPassState(passId);
  if (!st.stats) st.stats = {};
  st.stats.shopSpentDaily   = (st.stats.shopSpentDaily||0)   + amount;
  st.stats.shopSpentWeekly  = (st.stats.shopSpentWeekly||0)  + amount;
  st.stats.shopSpentMonthly = (st.stats.shopSpentMonthly||0) + amount;
  st.stats.shopSpentTotal   = (st.stats.shopSpentTotal||0)   + amount;
  savePassState(passId, st);
  MISSIONS_TEMPLATE.filter(m => m.trackId && m.trackId.startsWith('shop_spent')).forEach(m => {
    const mst = getMissionState(passId, m.id); if (mst.claimed) return;
    const map = { shop_spent_daily:'shopSpentDaily', shop_spent_weekly:'shopSpentWeekly', shop_spent_monthly:'shopSpentMonthly', shop_spent_total:'shopSpentTotal' };
    mst.progress = Math.min(m.target, st.stats[map[m.trackId]||'shopSpentTotal']||0);
    saveMissionState(passId, m.id, mst);
  });
  if (activePassId === passId) renderMissions(passId);
}

window.notifyPassShopSpend = function(amount) {
  const n = now();
  PASSES.forEach(p => {
    const s = new Date(p.startDate+'T00:00:00').getTime();
    const e = new Date(p.endDate+'T23:59:59').getTime();
    if (n >= s && n <= e) recordShopSpend(p.id, amount);
  });
  if (activePassId) recordShopSpend(activePassId, amount);
};

function processShopSpendQueue() {
  const QUEUE_KEY = 'mv_shop_spend_queue';
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return;
    const queue = JSON.parse(raw);
    if (queue?.length) queue.forEach(item => { if (item?.amount > 0) window.notifyPassShopSpend(item.amount); });
    localStorage.removeItem(QUEUE_KEY);
  } catch {}
}

/* ══════════════════════════════════════════════════════════
   RENDER: INVENTARIO
══════════════════════════════════════════════════════════ */
function renderInventory(passId) {
  const pass = PASSES.find(p => p.id === passId);
  const st   = getPassState(passId);
  const grid = $('#invGrid'); if (!grid) return;
  const entries = Object.entries(st.inventory || {});
  if (!entries.length) {
    grid.innerHTML = '<div class="inv-empty">📭 Sin recompensas aún. ¡Completa niveles y misiones!</div>';
    return;
  }
  grid.innerHTML = entries.map(([, item]) => `
    <div class="inv-item">
      <span class="inv-item-emoji">${item.emoji}</span>
      <span class="inv-item-name">${esc(item.name)}</span>
      <span class="inv-item-count">×${item.count}</span>
      <span class="inv-item-source">${esc(pass?.name||passId)}</span>
    </div>`).join('');
}

function renderGlobalInventory() {
  const glob = getGlobalInventory();
  const el   = $('#globalModalBody'); if (!el) return;
  const entries = Object.entries(glob);
  if (!entries.length) { el.innerHTML='<div class="inv-empty">📭 Inventario global vacío.</div>'; return; }
  const byPass = {};
  entries.forEach(([, item]) => {
    const pn = item.passName || 'Global';
    if (!byPass[pn]) byPass[pn] = [];
    byPass[pn].push(item);
  });
  el.innerHTML = Object.entries(byPass).map(([pn, items]) => `
    <div style="margin-bottom:20px">
      <div style="font-family:var(--font-pixel);font-size:0.38rem;color:#a5b4fc;margin-bottom:10px;padding:8px 12px;background:var(--card);border:2px solid var(--border)">${esc(pn)}</div>
      <div class="inv-grid">${items.map(item=>`<div class="inv-item"><span class="inv-item-emoji">${item.emoji}</span><span class="inv-item-name">${esc(item.name)}</span><span class="inv-item-count">×${item.count}</span></div>`).join('')}</div>
    </div>`).join('');
}

/* ══════════════════════════════════════════════════════════
   RENDER: MEJORAS
══════════════════════════════════════════════════════════ */
function renderMejoras(passId) {
  const st        = getPassState(passId);
  const container = $('#mejorasGrid'); if (!container) return;
  container.innerHTML = TIER_UPGRADES.map(u => {
    const owned   = isTierOwned(st, u.id);
    const hasReq  = !u.requiresPrev || isTierOwned(st, u.requiresPrev);
    const isStone = u.id === 'stone';
    const isIron  = u.id === 'iron';
    const featHtml = (u.features||[]).map(f=>`<div class="mejora-feature"><span class="mejora-feat-dot"></span><span>${esc(f)}</span></div>`).join('');
    let footerHtml;
    if (isStone) {
      footerHtml = `<div class="mejora-price-wrap"><span class="mejora-price-label">Precio</span><span class="mejora-price" style="color:#34d399">GRATIS</span></div>${owned?'<div class="mejora-owned-badge">✓ ACTIVO — INCLUIDO</div>':''}`;
    } else if (owned) {
      footerHtml = `<div class="mejora-price-wrap"><span class="mejora-price-label">Estado</span></div><div class="mejora-owned-badge">✓ ${u.emoji} ${u.name} ACTIVO</div>`;
    } else if (isIron && !st.shopBought) {
      footerHtml = `<div class="mejora-price-wrap"><span class="mejora-price-label">Precio</span><span class="mejora-price">⟡${u.price}</span></div><button class="mejora-buy-btn" onclick="window._redirectToShop('${passId}')">🛒 IR A LA TIENDA</button>`;
    } else if (!hasReq) {
      const reqT = TIER_UPGRADES.find(t => t.id === u.requiresPrev);
      footerHtml = `<div class="mejora-price-wrap"><span class="mejora-price-label">Requiere</span><span class="mejora-price" style="font-size:0.36rem;color:var(--muted)">${reqT?.emoji||''} ${reqT?.name||u.requiresPrev}</span></div><button class="mejora-buy-btn" disabled>🔒 BLOQUEADO</button>`;
    } else {
      footerHtml = `<div class="mejora-price-wrap"><span class="mejora-price-label">Precio</span><span class="mejora-price">⟡${u.price}</span></div><button class="mejora-buy-btn" onclick="window._buyTierUpgrade('${passId}','${u.id}')">⬆️ ACTIVAR TIER</button>`;
    }
    return `<div class="mejora-card tier-${u.tierClass} ${owned?'owned':''}">
      <div class="mejora-card-band"></div>
      <div class="mejora-hero">
        <div class="mejora-icon">${u.emoji}</div>
        <div class="mejora-text">
          <div class="mejora-tier-label">${esc(u.subtitle||u.name)}</div>
          <div class="mejora-name">${esc(u.name)}</div>
          <div class="mejora-desc">${esc(u.desc)}</div>
          ${isStone?'<span class="mejora-free-badge">✓ Gratis para todos</span>':''}
        </div>
      </div>
      ${featHtml?`<div class="mejora-features">${featHtml}</div>`:''}
      <div class="mejora-footer">${footerHtml}</div>
    </div>`;
  }).join('');
}

function buyTierUpgrade(passId, tierId) {
  const u = TIER_UPGRADES.find(x => x.id === tierId); if (!u) return;
  const st = getPassState(passId);
  if (isTierOwned(st, tierId)) { toast('Ya tienes este tier'); return; }
  if (u.requiresPrev && !isTierOwned(st, u.requiresPrev)) {
    toast(`⚠️ Necesitas el ${TIER_UPGRADES.find(t=>t.id===u.requiresPrev)?.name||u.requiresPrev} primero`);
    return;
  }
  if (TIER_ORDER.indexOf(tierId) > TIER_ORDER.indexOf(st.tier || 'stone')) {
    st.tier = tierId;
    savePassState(passId, st);
    toast(`✨ ¡${u.name} activado!`);
    renderMejoras(passId);
    renderTrack(passId);
    renderPassHeader(passId);
    updateHUD(passId);
    renderMissions(passId);
  }
}

function redirectToShop(passId) {
  toast('🛒 Redirigiendo a la Tienda…');
  setTimeout(() => { window.location.href = 'tienda.html#secPases'; }, 800);
}

/* ══════════════════════════════════════════════════════════
   ACTIVAR TIER DESDE TIENDA (llamado por tienda.js)
══════════════════════════════════════════════════════════ */
window.activatePassTier = function(passId, tierId) {
  const st = getPassState(passId);
  if (TIER_ORDER.indexOf(tierId) > TIER_ORDER.indexOf(st.tier || 'stone')) {
    st.tier = tierId;
    st.shopBought = true;
    savePassState(passId, st);
    if (activePassId === passId) {
      renderMejoras(passId);
      renderTrack(passId);
      renderPassHeader(passId);
      updateHUD(passId);
      renderMissions(passId);
    }
    scheduleSync();
  }
};

window.onPassPurchasedFromShop = function(shopItemId) {
  const pass = PASSES.find(p => p.shopItemId === shopItemId); if (!pass) return;
  window.activatePassTier(pass.id, 'iron');
  toast(`✨ Pase "${pass.name}" desbloqueado → Tier Hierro activado`);
};

/* ══════════════════════════════════════════════════════════
   RENDER: BUZÓN
══════════════════════════════════════════════════════════ */
function renderPassMailbox() {
  const container = $('#passMailboxList'); if (!container) return;
  const claimed   = lsGet(PASS_MAIL_LS, []);
  const unread    = PASS_MAIL_ITEMS.filter(m => !claimed.includes(m.id)).length;
  const badge     = $('#mailboxBadgePases');
  if (badge) {
    badge.textContent = unread;
    badge.classList.toggle('hidden', unread === 0);
  }
  container.innerHTML = PASS_MAIL_ITEMS.map(item => {
    const isClaimed  = claimed.includes(item.id);
    const rewardsHtml = item.rewards.map(r => {
      if (r.type === 'boost') return `<span class="pmail-reward-tag boost">⚡ ${r.name}</span>`;
      return `<span class="pmail-reward-tag">${r.emoji||'🎁'} ${r.name} ×${r.amount||1}</span>`;
    }).join('');
    return `<div class="pmail-item ${isClaimed?'claimed':'unread'}">
      <div class="pmail-icon">${item.emoji}</div>
      <div class="pmail-body">
        <div class="pmail-title">${esc(item.title)}</div>
        <div class="pmail-sender">De: ${esc(item.sender)}</div>
        <div class="pmail-msg">${esc(item.msg)}</div>
        <div class="pmail-rewards">${rewardsHtml}</div>
      </div>
      <div class="pmail-action">
        ${isClaimed
          ?'<span class="pmail-claimed-tag">✅ RECLAMADO</span>'
          :`<button class="btn-pixel btn-pass btn-sm" onclick="window._claimPassMail('${item.id}')">🎁 RECLAMAR</button>`}
      </div>
    </div>`;
  }).join('');
}

function claimPassMail(mailId) {
  if (!activePassId) { toast('⚠️ Selecciona un pase primero'); return; }
  const item    = PASS_MAIL_ITEMS.find(m => m.id === mailId); if (!item) return;
  const claimed = lsGet(PASS_MAIL_LS, []);
  if (claimed.includes(mailId)) { toast('Ya reclamaste este mensaje'); return; }
  const pass = PASSES.find(p => p.id === activePassId);
  claimed.push(mailId);
  lsSet(PASS_MAIL_LS, claimed);
  item.rewards.forEach(r => {
    switch (r.type) {
      case 'xp':
        addXP(activePassId, r.amount||0);
        addToInventory(activePassId, pass.name, 'xp_mail', '⭐', 'XP Bonus', r.amount||0);
        break;
      case 'keys':
        awardChestKey(r.keyId, r.amount||1);
        addToInventory(activePassId, pass.name, `key_${r.keyId}`, r.emoji||'🔑', r.name||'Llave', r.amount||1);
        toast(`✨ ${r.emoji} ${r.name} ×${r.amount}`);
        break;
      case 'boost':
        activateBoost(activePassId, r.boostHours||1, r.boostMultiplier||1.5, r.name);
        break;
      case 'emeralds':
        addToInventory(activePassId, pass.name, 'emeralds', '💎', 'Gemas', r.amount||0);
        toast(`💎 +${r.amount} Gemas`);
        break;
      case 'copper':
        addToInventory(activePassId, pass.name, 'copper', '🪙', 'Monedas', r.amount||0);
        toast(`🪙 +${r.amount} Monedas`);
        break;
    }
  });
  toast(`📬 ¡${item.title}!`);
  scheduleSync();
  renderPassMailbox();
  renderPassHeader(activePassId);
  renderInventory(activePassId);
  updateHUD(activePassId);
}

/* ══════════════════════════════════════════════════════════
   HUD
══════════════════════════════════════════════════════════ */
function updateHUD(passId) {
  const st       = getPassState(passId);
  const tierInfo = TIERS.find(t => t.id === (st.tier || 'stone')) || TIERS[0];
  const isMax    = st.level >= MAX_LEVELS;
  const totalXP  = isMax ? OVERFLOW_XP_PER_REWARD : getXPForLevel(st.level);
  const curXP    = isMax ? ((st.overflowXP||0) % OVERFLOW_XP_PER_REWARD) : (st.xp||0);
  const pct      = Math.min(100, Math.round((curXP/totalXP)*100));
  const setEl    = (id, val) => { const el=document.getElementById(id); if(el) el.textContent=val; };
  setEl('hudTier',  `${tierInfo.emoji} ${tierInfo.name}${isMax?' 🏆':''}`);
  const fill = document.getElementById('hudXPFill');
  if (fill) fill.style.width = `${pct}%`;
  setEl('hudXPTxt', isMax ? `${curXP}/${totalXP} XP ★` : `${st.xp||0}/${totalXP} XP`);
  setEl('hudLevel', isMax ? 'NIVEL MÁX.' : `Nv.${st.level}`);
  const boostWrap = document.getElementById('hudBoostWrap');
  const boost     = getTopBoost();
  if (boostWrap) {
    if (boost) {
      boostWrap.classList.remove('hidden');
      const diff = Math.max(0, boost.expiry - now());
      const h=Math.floor(diff/H1), m=Math.floor((diff%H1)/M1), s=Math.floor((diff%M1)/1000);
      const pad = n => String(n).padStart(2,'0');
      setEl('hudBoostMult',  `×${boost.multiplier}`);
      setEl('hudBoostTimer', `${pad(h)}:${pad(m)}:${pad(s)}`);
    } else {
      boostWrap.classList.add('hidden');
    }
  }
}

/* ══════════════════════════════════════════════════════════
   SLIDER DE PASES
══════════════════════════════════════════════════════════ */
function renderPassSelector() {
  const track = $('#passSliderTrack');
  const dots  = $('#sliderDots');
  if (!track) return;
  const nowMs = now();
  track.innerHTML = PASSES.map((p, idx) => {
    const sMs   = new Date(p.startDate+'T00:00:00').getTime();
    const eMs   = new Date(p.endDate+'T23:59:59').getTime();
    const status = nowMs<sMs?'upcoming':nowMs>eMs?'ended':'active';
    const st     = getPassState(p.id);
    const isMax  = st.level >= MAX_LEVELS;
    const totalXP = isMax ? OVERFLOW_XP_PER_REWARD : getXPForLevel(st.level);
    const curXP   = isMax ? ((st.overflowXP||0)%OVERFLOW_XP_PER_REWARD) : (st.xp||0);
    const pct     = Math.min(100, Math.round((curXP/totalXP)*100));
    const slabels = { active:'● ACTIVO', upcoming:'○ PRÓXIMO', ended:'✕ FINALIZADO' };
    return `<button class="pass-card-btn" data-pass-id="${p.id}" onclick="window._setActivePass('${p.id}')" style="animation-delay:${idx*0.04}s">
      <div class="pcb-status-bar ${status}"></div>
      <div class="pcb-art">
        <img src="${esc(p.bg||'')}" alt="${esc(p.name)}" loading="lazy">
        <div class="pcb-art-overlay"></div>
        <span class="pcb-emoji-big">${p.emoji}</span>
      </div>
      <div class="pcb-active-check">✓</div>
      <div class="pcb-body">
        <span class="pcb-season">${esc(p.season)}</span>
        <span class="pcb-name">${esc(p.name)}</span>
        <span class="pcb-dates">${p.startDate} → ${p.endDate}</span>
        <div class="pcb-meta">
          <span class="pcb-badge ${status}">${slabels[status]}</span>
          <span class="pcb-level">Nv.<span>${isMax?'MÁX':st.level}</span></span>
        </div>
        <div class="pcb-xp-bar"><div class="pcb-xp-fill" style="width:${pct}%"></div></div>
      </div>
    </button>`;
  }).join('');

  if (dots) {
    dots.innerHTML = PASSES.map((_, i) => `<button class="slider-dot" data-idx="${i}"></button>`).join('');
    $$('.slider-dot', dots).forEach(d => d.addEventListener('click', () => scrollTo(parseInt(d.dataset.idx))));
  }

  let cur = 0;
  const leftBtn  = $('#sliderLeft');
  const rightBtn = $('#sliderRight');
  const updateArrows = () => {
    if (leftBtn)  leftBtn.disabled  = cur <= 0;
    if (rightBtn) rightBtn.disabled = cur >= PASSES.length - 1;
    $$('.slider-dot', dots).forEach((d, i) => d.classList.toggle('active', i === cur));
  };
  const scrollTo = idx => {
    cur = Math.max(0, Math.min(PASSES.length-1, idx));
    track.scrollLeft = cur * (220+12);
    updateArrows();
  };
  leftBtn?.addEventListener('click',  () => scrollTo(cur-1));
  rightBtn?.addEventListener('click', () => scrollTo(cur+1));
  track.addEventListener('scroll', () => { cur = Math.round(track.scrollLeft/(220+12)); updateArrows(); });

  let isDown=false, sX=0, sL=0;
  track.addEventListener('mousedown', e => { isDown=true; track.classList.add('grabbing'); sX=e.pageX-track.offsetLeft; sL=track.scrollLeft; });
  track.addEventListener('mouseleave', () => { isDown=false; track.classList.remove('grabbing'); });
  track.addEventListener('mouseup',   () => { isDown=false; track.classList.remove('grabbing'); });
  track.addEventListener('mousemove', e => { if(!isDown) return; e.preventDefault(); track.scrollLeft=sL-(e.pageX-track.offsetLeft-sX)*1.5; });

  updateArrows();
  const activeIdx = PASSES.findIndex(p => {
    const s = new Date(p.startDate+'T00:00:00').getTime();
    const e = new Date(p.endDate+'T23:59:59').getTime();
    return nowMs >= s && nowMs <= e;
  });
  if (activeIdx >= 0) setTimeout(() => scrollTo(activeIdx), 200);
}

/* ══════════════════════════════════════════════════════════
   MÚSICA
══════════════════════════════════════════════════════════ */
let currentPassMusic = null;
const audio    = document.getElementById('pass-music');
const musicOrb = document.getElementById('musicOrb');

function loadPassMusic(passId) {
  const pass = PASSES.find(p => p.id === passId);
  if (!pass || !audio || pass.music === currentPassMusic) return;
  currentPassMusic = pass.music;
  const wasPlaying = !audio.paused;
  audio.src = pass.music;
  audio.load();
  if (wasPlaying || localStorage.getItem('pass_music') === 'on') audio.play().catch(() => {});
}

window.togglePassMusic = function() {
  if (!audio) return;
  if (audio.paused) {
    audio.play().then(() => { musicOrb?.classList.add('active'); localStorage.setItem('pass_music','on'); }).catch(() => {});
  } else {
    audio.pause(); musicOrb?.classList.remove('active'); localStorage.setItem('pass_music','off');
  }
};

/* ══════════════════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════════════════ */
function toast(msg) {
  const t = $('#toast'); if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._id);
  toast._id = setTimeout(() => t.classList.remove('show'), 2800);
}

/* ══════════════════════════════════════════════════════════
   PARTÍCULAS
══════════════════════════════════════════════════════════ */
(function particles() {
  const c = $('#bgParticles'); if (!c) return;
  const ctx = c.getContext('2d');
  const dpi = Math.max(1, devicePixelRatio||1);
  let w, h, parts;
  const init = () => {
    w = c.width  = innerWidth  * dpi;
    h = c.height = innerHeight * dpi;
    parts = Array.from({length:80}, () => ({
      x:   Math.random()*w, y:    Math.random()*h,
      r:   (.3+Math.random()*1.2)*dpi,
      s:   .12+Math.random()*.4,
      a:   .03+Math.random()*.12,
      hue: 220+Math.random()*60,
    }));
  };
  const tick = () => {
    ctx.clearRect(0,0,w,h);
    parts.forEach(p => {
      p.y += p.s; p.x += Math.sin(p.y*.001)*.3;
      if (p.y > h) { p.y=-10; p.x=Math.random()*w; }
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle = `hsla(${p.hue},65%,65%,${p.a})`; ctx.fill();
    });
    requestAnimationFrame(tick);
  };
  init(); tick(); addEventListener('resize', init);
})();

/* ══════════════════════════════════════════════════════════
   REVEAL
══════════════════════════════════════════════════════════ */
(function reveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold:.08 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
})();

/* ══════════════════════════════════════════════════════════
   TABS
══════════════════════════════════════════════════════════ */
$$('.ptab').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.ptab').forEach(b => b.classList.remove('is-on'));
    btn.classList.add('is-on');
    $$('.pass-tab-content').forEach(c => c.classList.add('hidden'));
    const name  = btn.dataset.tab;
    const tabEl = document.getElementById(`tab${name.charAt(0).toUpperCase()+name.slice(1)}`);
    if (tabEl) tabEl.classList.remove('hidden');
    if (name === 'buzon') renderPassMailbox();
    if (name === 'misiones' && activePassId) renderMissions(activePassId);
    if (name === 'inventario' && activePassId) renderInventory(activePassId);
    if (name === 'mejoras' && activePassId) renderMejoras(activePassId);
    if (name === 'recompensas' && activePassId) renderTrack(activePassId);
  });
});

/* ══════════════════════════════════════════════════════════
   MODAL: INVENTARIO GLOBAL
══════════════════════════════════════════════════════════ */
function openGlobalModal()  { renderGlobalInventory(); document.getElementById('globalModal')?.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; }
function closeGlobalModal() { document.getElementById('globalModal')?.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }
$('#btnGlobalInv')?.addEventListener('click', openGlobalModal);
$('#globalOverlay')?.addEventListener('click', closeGlobalModal);
$('#globalClose')?.addEventListener('click',   closeGlobalModal);
$('#globalCloseBtn')?.addEventListener('click', closeGlobalModal);

/* ══════════════════════════════════════════════════════════
   MODAL REWARD: CLOSE
══════════════════════════════════════════════════════════ */
$('#rewardOverlay')?.addEventListener('click', closeRewardModal);
$('#rewardClose')?.addEventListener('click',   closeRewardModal);
$('#rewardCloseBtn')?.addEventListener('click', closeRewardModal);

/* ══════════════════════════════════════════════════════════
   HAMBURGER
══════════════════════════════════════════════════════════ */
const ham = $('#hamburger'), nav = $('#main-nav');
ham?.addEventListener('click', e => { e.stopPropagation(); nav?.classList.toggle('open'); });
document.addEventListener('click', e => { if (!ham?.contains(e.target) && !nav?.contains(e.target)) nav?.classList.remove('open'); });

/* ══════════════════════════════════════════════════════════
   ESCAPE KEY
══════════════════════════════════════════════════════════ */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeRewardModal(); closeGlobalModal(); }
});

/* ══════════════════════════════════════════════════════════
   EXPONER FUNCIONES EN window
   ← ESTO ES LO QUE FALTABA: los onclick="" en HTML dinámico
     necesitan acceder a estas funciones desde el scope global
══════════════════════════════════════════════════════════ */
window._setActivePass        = setActivePass;
window._openLevelModal       = openLevelModal;
window._claimLevelReward     = claimLevelReward;
window._claimAllLevelRewards = claimAllLevelRewards;
window._claimMission         = claimMission;
window._claimAllMissions     = claimAllMissions;
window._claimPassMail        = claimPassMail;
window._buyTierUpgrade       = buyTierUpgrade;
window._redirectToShop       = redirectToShop;
window._filterTierView       = function(passId, tierId) {
  const st = getPassState(passId);
  if (!isTierOwned(st, tierId)) {
    toast(`🔒 Necesitas el Pase ${TIERS.find(t=>t.id===tierId)?.name||tierId}`);
    return;
  }
  $$('.tier-pill').forEach(p => p.classList.toggle('active', p.classList.contains(tierId)));
};

/* ══════════════════════════════════════════════════════════
   BOOT
══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  console.log('🏆 Moonveil Pases v5.1 — Corregido');
  processShopSpendQueue();
  renderPassSelector();
  if (localStorage.getItem('pass_music') === 'on' && audio) musicOrb?.classList.add('active');
  const boosts = getActiveBoosts();
  if (boosts.length) startBoostTimer();

  const nowMs = now();
  const activePass = PASSES.find(p => {
    const s = new Date(p.startDate+'T00:00:00').getTime();
    const e = new Date(p.endDate+'T23:59:59').getTime();
    return nowMs >= s && nowMs <= e;
  });
  const firstPass = activePass || PASSES[0];
  setActivePass(firstPass.id);
  updateHUD(firstPass.id);
  setTimeout(() => toast('✨ ¡Pases de Temporada cargados!'), 500);

  /* ── FIREBASE AUTH + SYNC ── */
  onAuthChange(async user => {
    if (!user) {
      if (_passUnsub) { _passUnsub(); _passUnsub = null; }
      currentUID = null;
      return;
    }
    currentUID = user.uid;

    // Carga inicial desde Firestore
    await loadFromFirebase(user.uid);

    // Re-renderizar con datos de Firebase
    if (activePassId) {
      renderPassHeader(activePassId);
      renderTrack(activePassId);
      renderMissions(activePassId);
      renderInventory(activePassId);
      renderPassMailbox();
      updateHUD(activePassId);
      renderMejoras(activePassId);
    }

    // Listener en tiempo real para sincronizar entre dispositivos
    startRealtimeListener(user.uid);
    console.log('✅ Pases Firebase OK + Listener activo:', user.uid);
  });

  window.addEventListener('beforeunload', () => {
    if (_passUnsub) { _passUnsub(); _passUnsub = null; }
  });
});