/* =====================================================
   Moonveil Portal — database.js  v2.5
   + gacha_inventory sincronizado
   + Tickets de ruleta en Firestore
   + Inventario del perfil muestra tickets gacha
   + active_pass_tier: tier visible en contactos
   ===================================================== */

import { db } from './firebase.js';
import {
  doc, getDoc, setDoc, updateDoc,
  arrayUnion, arrayRemove,
  collection, query, where, getDocs,
  onSnapshot, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

/* ── KEYS localStorage ── */
export const PERFIL_KEY       = 'mv_perfil';
export const BADGES_KEY       = 'mv_badges';
export const MISSION_KEY      = 'mv_misiones';
export const TIMELINE_KEY     = 'mv_timeline';
export const BUZON_KEY        = 'mv_buzon_estado';
export const RESET_KEY        = 'mv_mission_resets';
export const BASELINE_KEY     = 'mv_baselines';
export const INVENTORY_KEY    = 'mv_inventory';
export const TITLES_KEY       = 'mv_titles_earned';
export const TITLE_ACTIVE_KEY = 'mv_title_active';
export const PLAYER_ID_KEY    = 'mv_player_id';
export const FRIENDS_KEY      = 'mv_friends';
export const GACHA_INV_KEY    = 'mv_gacha_inventory';
export const GACHA_TICKETS_KEY = 'mv_gacha_tickets';

/* ── TIER de pase activo (para contactos) ──
   Estructura en Firestore: active_pass_tier = { tierId, passId, passName, expiresAt }
   tierId: 'stone' | 'iron' | 'gold' | 'emerald' | 'diamond'
   expiresAt: ISO string con la fecha de fin del pase activo
*/
export const PASS_TIER_KEY = 'mv_active_pass_tier';

const userRef = uid => doc(db, 'users', uid);
const DEFAULT_INVENTORY = { tickets: 0, keys: 0, superstar_keys: 0 };

function generatePlayerID(uid) {
  const clean = uid.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return '#' + clean.slice(0, 4) + '-' + clean.slice(4, 8);
}

/* ─── TIER ORDER para comparación ─── */
const TIER_ORDER = ['stone', 'iron', 'gold', 'emerald', 'diamond'];

/**
 * Devuelve el tier de mayor rango entre dos tiers.
 */
function maxTier(a, b) {
  const ia = TIER_ORDER.indexOf(a || 'stone');
  const ib = TIER_ORDER.indexOf(b || 'stone');
  return ia >= ib ? (a || 'stone') : (b || 'stone');
}

/* ─── CREAR DOC INICIAL ─── */
export async function createUserFromAuth(uid, authUser) {
  let lp = null;
  try { lp = JSON.parse(localStorage.getItem(PERFIL_KEY)); } catch {}
  const nombre   = authUser.displayName || lp?.nombre || authUser.email?.split('@')[0] || 'Aventurero';
  const email    = authUser.email || lp?.email || '';
  const avatar   = lp?.avatar || '🌙';
  const xp       = lp?.xp ?? 200;
  const playerID = generatePlayerID(uid);
  let timeline   = [];
  try { timeline = JSON.parse(localStorage.getItem(TIMELINE_KEY)) || []; } catch {}
  if (!timeline.length) timeline = [{ icon:'🌙', title:'¡Cuenta creada en Moonveil Portal!', detail:'+200 XP de bienvenida', fecha: new Date().toISOString() }];

  await setDoc(userRef(uid), {
    nombre, email, avatar, xp,
    racha: lp?.racha ?? 0, horas: lp?.horas ?? 0,
    registrado: lp?.registrado || new Date().toISOString(),
    misiones: {}, badges: ['b_newcomer'], buzon_estado: {},
    mission_resets: {}, baselines: {},
    timeline: timeline.slice(0, 60),
    inventory: DEFAULT_INVENTORY,
    titles_earned: ['tl_novato'], title_active: 'tl_novato',
    player_id: playerID,
    friends: [],
    presence: { state: 'offline', section: null, lastSeen: new Date().toISOString() },
    gacha_inventory: {},
    gacha_tickets: {},
    gacha_stats: { totalSpins: 0, totalPrizes: 0 },
    /* Tier del pase activo — null = sin pase / solo piedra gratis */
    active_pass_tier: null,
    createdAt: serverTimestamp(),
  }, { merge: true });
  return playerID;
}

/* ─── SYNC: Firestore → localStorage ─── */
export async function syncAllToLocalStorage(uid, authUser = null) {
  const snap = await getDoc(userRef(uid));
  if (!snap.exists()) {
    if (authUser) {
      await createUserFromAuth(uid, authUser);
      const snap2 = await getDoc(userRef(uid));
      if (!snap2.exists()) return false;
      return _applySnapshot(uid, snap2);
    }
    return false;
  }
  return _applySnapshot(uid, snap);
}

function _applySnapshot(uid, snap) {
  const d = snap.data();
  const profile = {
    nombre: d.nombre || 'Aventurero', email: d.email || '',
    avatar: d.avatar || '🌙', xp: d.xp ?? 0,
    racha: d.racha ?? 0, horas: d.horas ?? 0,
    nivel: d.nivel ?? 1, registrado: d.registrado || new Date().toISOString(),
  };
  localStorage.setItem(PERFIL_KEY, JSON.stringify(profile));
  if (Array.isArray(d.badges))        localStorage.setItem(BADGES_KEY,       JSON.stringify(d.badges));
  if (d.misiones)                     localStorage.setItem(MISSION_KEY,      JSON.stringify(d.misiones));
  if (Array.isArray(d.timeline))      localStorage.setItem(TIMELINE_KEY,     JSON.stringify(d.timeline));
  if (d.buzon_estado)                 localStorage.setItem(BUZON_KEY,        JSON.stringify(d.buzon_estado));
  if (d.mission_resets)               localStorage.setItem(RESET_KEY,        JSON.stringify(d.mission_resets));
  if (d.baselines)                    localStorage.setItem(BASELINE_KEY,     JSON.stringify(d.baselines));
  if (Array.isArray(d.titles_earned)) localStorage.setItem(TITLES_KEY,       JSON.stringify(d.titles_earned));
  if (d.title_active)                 localStorage.setItem(TITLE_ACTIVE_KEY, d.title_active);
  if (Array.isArray(d.friends))       localStorage.setItem(FRIENDS_KEY,      JSON.stringify(d.friends));
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(d.inventory ? { ...DEFAULT_INVENTORY, ...d.inventory } : DEFAULT_INVENTORY));

  /* Gacha */
  if (d.gacha_inventory) localStorage.setItem(GACHA_INV_KEY,    JSON.stringify(d.gacha_inventory));
  if (d.gacha_stats)     localStorage.setItem('mv_gacha_stats', JSON.stringify(d.gacha_stats));
  if (d.gacha_tickets) {
    Object.entries(d.gacha_tickets).forEach(([rid, count]) => {
      const lsKey = `mv_tickets_${rid}`;
      const local = parseInt(localStorage.getItem(lsKey) || '-1', 10);
      const final = Math.max(local < 0 ? 0 : local, count || 0);
      localStorage.setItem(lsKey, String(final));
    });
  }

  /* Tier del pase activo */
  if (d.active_pass_tier !== undefined) {
    localStorage.setItem(PASS_TIER_KEY, JSON.stringify(d.active_pass_tier));
  }

  const playerID = d.player_id || generatePlayerID(uid);
  localStorage.setItem(PLAYER_ID_KEY, playerID);
  if (!d.player_id) updateDoc(userRef(uid), { player_id: playerID }).catch(() => {});
  localStorage.setItem('mv_user', JSON.stringify({ uid, email: profile.email, nombre: profile.nombre, avatar: profile.avatar, player_id: playerID }));
  return true;
}

/* ─── PRESENCIA ─── */
export async function updatePresence(uid, state, section) {
  try {
    await updateDoc(userRef(uid), {
      presence: { state, section: section || null, lastSeen: new Date().toISOString() },
    });
    return true;
  } catch { return false; }
}

/* ─── SOCIAL ─── */
export async function searchUserByPlayerID(playerID) {
  try {
    const q = query(collection(db, 'users'), where('player_id', '==', playerID));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { uid: d.id, ...d.data() };
  } catch (e) { console.error('[DB] searchUserByPlayerID:', e); return null; }
}

export async function addFriendByUID(uid, friendUID) {
  try {
    await Promise.all([
      updateDoc(userRef(uid),       { friends: arrayUnion(friendUID), updatedAt: serverTimestamp() }),
      updateDoc(userRef(friendUID), { friends: arrayUnion(uid),       updatedAt: serverTimestamp() }),
    ]);
    return true;
  } catch (e) { console.error('[DB] addFriendByUID:', e); return false; }
}

export async function removeFriendByUID(uid, friendUID) {
  try {
    await Promise.all([
      updateDoc(userRef(uid),       { friends: arrayRemove(friendUID), updatedAt: serverTimestamp() }),
      updateDoc(userRef(friendUID), { friends: arrayRemove(uid),       updatedAt: serverTimestamp() }),
    ]);
    return true;
  } catch (e) { console.error('[DB] removeFriendByUID:', e); return false; }
}

export async function getFriendsData(friendUIDs) {
  if (!friendUIDs?.length) return [];
  try {
    const snaps = await Promise.all(friendUIDs.map(id => getDoc(doc(db, 'users', id))));
    return snaps.filter(s => s.exists()).map(s => ({ uid: s.id, ...s.data() }));
  } catch (e) { console.error('[DB] getFriendsData:', e); return []; }
}

export function subscribeFriendPresence(friendUIDs, callback) {
  if (!friendUIDs?.length) return () => {};
  const unsubs = friendUIDs.map(uid =>
    onSnapshot(doc(db, 'users', uid),
      snap => { if (snap.exists()) callback(snap.id, snap.data()); },
      err  => console.warn('[DB] snap err:', err)
    )
  );
  return () => unsubs.forEach(u => u());
}

/* ─── CRUD estándar ─── */
export async function updateUserProfile(uid, data) {
  try { await updateDoc(userRef(uid), { ...data, updatedAt: serverTimestamp() }); return true; }
  catch (e) { console.error('[DB] updateUserProfile:', e); return false; }
}
export async function saveInventory(uid, inventory) {
  try { await updateDoc(userRef(uid), { inventory, updatedAt: serverTimestamp() }); return true; }
  catch { return false; }
}
export async function saveTitlesData(uid, titlesEarned, titleActive) {
  try { await updateDoc(userRef(uid), { titles_earned: titlesEarned, title_active: titleActive, updatedAt: serverTimestamp() }); return true; }
  catch { return false; }
}
export async function saveMisionesEstado(uid, misionesState) {
  try { await updateDoc(userRef(uid), { misiones: misionesState, updatedAt: serverTimestamp() }); return true; }
  catch { return false; }
}
export async function saveBuzonEstado(uid, buzonState) {
  try { await updateDoc(userRef(uid), { buzon_estado: buzonState, updatedAt: serverTimestamp() }); return true; }
  catch { return false; }
}
export async function addTimelineEventDB(uid) {
  try {
    let tl = []; try { tl = JSON.parse(localStorage.getItem(TIMELINE_KEY)||'[]'); } catch {}
    await updateDoc(userRef(uid), { timeline: tl.slice(0,60), updatedAt: serverTimestamp() });
    return true;
  } catch { return false; }
}
export async function saveBadges(uid, badgesArray) {
  try { await updateDoc(userRef(uid), { badges: badgesArray, updatedAt: serverTimestamp() }); return true; }
  catch { return false; }
}
export async function saveMissionResets(uid, resets, baselines) {
  try { await updateDoc(userRef(uid), { mission_resets: resets, baselines, updatedAt: serverTimestamp() }); return true; }
  catch { return false; }
}
export async function getUserProfile(uid) {
  try { const s = await getDoc(userRef(uid)); return s.exists() ? s.data() : null; }
  catch { return null; }
}

/* ─── GACHA: guardar inventario y tickets ─── */
export async function saveGachaData(uid, { inventory, stats, tickets }) {
  try {
    const data = { updatedAt: serverTimestamp() };
    if (inventory) data.gacha_inventory = inventory;
    if (stats)     data.gacha_stats     = stats;
    if (tickets)   data.gacha_tickets   = tickets;
    await updateDoc(userRef(uid), data);
    return true;
  } catch (e) { console.error('[DB] saveGachaData:', e); return false; }
}

/* ══════════════════════════════════════════════════════
   TIER DEL PASE ACTIVO — visible en contactos
   ══════════════════════════════════════════════════════

   saveActivePassTier(uid, tierId, passId, passName, expiresAt)
   ─ Calcula el tier de mayor rango entre TODOS los pases
     activos (aún no expirados) y lo guarda en Firestore.

   Se llama desde pases.js cada vez que:
     · El usuario activa/compra un tier (activatePassTier)
     · En el boot de pases.js para sincronizar estado actual

   La lógica de "mayor rango gana" está aquí para que
   contactos.js no necesite conocer la lógica de pases.
   ══════════════════════════════════════════════════════ */

/**
 * Recalcula y guarda el tier de mayor rango activo en Firestore.
 * @param {string} uid  - UID del usuario autenticado
 * @param {Array}  allPassTiers - Array de { tierId, passId, passName, expiresAt }
 *                 Representan TODOS los pases con sus tiers actuales.
 *                 Los que tengan tierId === 'stone' o expiresAt pasado se ignoran
 *                 para la medalla (pero stone sigue siendo el estado base).
 */
export async function saveActivePassTier(uid, allPassTiers) {
  try {
    const now = new Date().toISOString();
    /* Filtramos solo los no-expirados */
    const valid = (allPassTiers || []).filter(pt =>
      pt && pt.expiresAt && pt.expiresAt > now
    );

    let best = null;
    for (const pt of valid) {
      if (!best) { best = pt; continue; }
      if (TIER_ORDER.indexOf(pt.tierId) > TIER_ORDER.indexOf(best.tierId)) {
        best = pt;
      }
    }

    /* Guardamos en Firestore: null si solo hay stone o nada activo */
    const toSave = (best && best.tierId !== 'stone') ? best : null;
    await updateDoc(userRef(uid), {
      active_pass_tier: toSave,
      updatedAt: serverTimestamp(),
    });
    localStorage.setItem(PASS_TIER_KEY, JSON.stringify(toSave));
    return true;
  } catch (e) {
    console.error('[DB] saveActivePassTier:', e);
    return false;
  }
}

/* ─── PUSH LOCAL → FIRESTORE (backup completo) ─── */
export async function pushLocalToFirestore(uid) {
  try {
    const gl = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
    const profile = gl(PERFIL_KEY) || {};
    const gachaTickets = {};
    ['classic','event','elemental'].forEach(rid => {
      const v = parseInt(localStorage.getItem(`mv_tickets_${rid}`) || '0', 10);
      if (!isNaN(v)) gachaTickets[rid] = v;
    });

    const passTier = gl(PASS_TIER_KEY);

    await setDoc(userRef(uid), {
      nombre:         profile.nombre     || 'Aventurero',
      email:          profile.email      || '',
      avatar:         profile.avatar     || '🌙',
      xp:             profile.xp         ?? 0,
      racha:          profile.racha       ?? 0,
      horas:          profile.horas       ?? 0,
      registrado:     profile.registrado || new Date().toISOString(),
      misiones:       gl(MISSION_KEY)   || {},
      badges:         gl(BADGES_KEY)    || [],
      buzon_estado:   gl(BUZON_KEY)     || {},
      mission_resets: gl(RESET_KEY)     || {},
      baselines:      gl(BASELINE_KEY)  || {},
      timeline:       (gl(TIMELINE_KEY) || []).slice(0, 60),
      inventory:      gl(INVENTORY_KEY) || { tickets:0, keys:0, superstar_keys:0 },
      titles_earned:  gl(TITLES_KEY)    || ['tl_novato'],
      title_active:   localStorage.getItem(TITLE_ACTIVE_KEY) || 'tl_novato',
      player_id:      localStorage.getItem(PLAYER_ID_KEY)    || '',
      friends:        gl(FRIENDS_KEY)   || [],
      gacha_inventory: gl(GACHA_INV_KEY)        || {},
      gacha_stats:     gl('mv_gacha_stats')      || { totalSpins:0, totalPrizes:0 },
      gacha_tickets:   gachaTickets,
      active_pass_tier: passTier || null,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return true;
  } catch (e) { console.error('[DB] pushLocalToFirestore:', e); return false; }
}