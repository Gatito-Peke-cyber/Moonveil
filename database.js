/* =====================================================
   Moonveil Portal — database.js  v2.1
   CRUD con Firestore + fix invitado + inventario + títulos
   ===================================================== */

import { db } from './firebase.js';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

/* ── KEYS de localStorage ── */
export const PERFIL_KEY      = 'mv_perfil';
export const BADGES_KEY      = 'mv_badges';
export const MISSION_KEY     = 'mv_misiones';
export const TIMELINE_KEY    = 'mv_timeline';
export const BUZON_KEY       = 'mv_buzon_estado';
export const RESET_KEY       = 'mv_mission_resets';
export const BASELINE_KEY    = 'mv_baselines';
export const INVENTORY_KEY   = 'mv_inventory';
export const TITLES_KEY      = 'mv_titles_earned';
export const TITLE_ACTIVE_KEY= 'mv_title_active';
export const PLAYER_ID_KEY   = 'mv_player_id';

/* ── Referencia al doc del usuario ── */
const userRef = (uid) => doc(db, 'users', uid);

/* ── Genera un playerID legible desde el UID de Firebase ── */
function generatePlayerID(uid) {
  const clean = uid.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return '#' + clean.slice(0, 4) + '-' + clean.slice(4, 8);
}

/* ── Inventario por defecto ── */
const DEFAULT_INVENTORY = { tickets: 0, keys: 0, superstar_keys: 0 };

/* ─────────────────────────────────────────────────────
   CREAR DOCUMENTO INICIAL DESDE DATOS DE AUTH
   Se llama cuando el usuario existe en Auth pero NO en Firestore
   (ej: registrado localmente con cuenta.js)
   ───────────────────────────────────────────────────── */
export async function createUserFromAuth(uid, authUser) {
  /* Intentar leer datos del localStorage (registro local previo) */
  let localProfile = null;
  try { localProfile = JSON.parse(localStorage.getItem(PERFIL_KEY)); } catch {}

  const nombre   = authUser.displayName
                || localProfile?.nombre
                || authUser.email?.split('@')[0]
                || 'Aventurero';
  const email    = authUser.email || localProfile?.email || '';
  const avatar   = localProfile?.avatar || '🌙';
  const xp       = localProfile?.xp     ?? 200;
  const racha    = localProfile?.racha   ?? 0;
  const horas    = localProfile?.horas   ?? 0;
  const registrado = localProfile?.registrado || new Date().toISOString();

  let timeline   = [];
  try { timeline = JSON.parse(localStorage.getItem(TIMELINE_KEY)) || []; } catch {}
  if (!timeline.length) {
    timeline = [{ icon:'🌙', title:'¡Cuenta creada en Moonveil Portal!', detail:'+200 XP de bienvenida', fecha: new Date().toISOString() }];
  }

  const playerID = generatePlayerID(uid);

  await setDoc(userRef(uid), {
    nombre,
    email,
    avatar,
    xp,
    racha,
    horas,
    registrado,
    misiones:       {},
    badges:         ['b_newcomer'],
    buzon_estado:   {},
    mission_resets: {},
    baselines:      {},
    timeline:       timeline.slice(0, 60),
    inventory:      DEFAULT_INVENTORY,
    titles_earned:  ['tl_novato'],
    title_active:   'tl_novato',
    player_id:      playerID,
    createdAt:      serverTimestamp(),
  }, { merge: true });

  return playerID;
}

/* ─────────────────────────────────────────────────────
   SYNC COMPLETO: Firestore → localStorage
   ───────────────────────────────────────────────────── */
export async function syncAllToLocalStorage(uid, authUser = null) {
  const snap = await getDoc(userRef(uid));

  /* ── Si el doc no existe, crearlo desde datos de auth ── */
  if (!snap.exists()) {
    if (authUser) {
      await createUserFromAuth(uid, authUser);
      /* Reintentar después de crear */
      const snap2 = await getDoc(userRef(uid));
      if (!snap2.exists()) return false;
      return await _applySnapshot(uid, snap2);
    }
    return false;
  }

  return await _applySnapshot(uid, snap);
}

async function _applySnapshot(uid, snap) {
  const data = snap.data();

  /* ── Perfil principal ── */
  const profile = {
    nombre:     data.nombre      || 'Aventurero',
    email:      data.email       || '',
    avatar:     data.avatar      || '🌙',
    xp:         data.xp          ?? 0,
    racha:      data.racha        ?? 0,
    horas:      data.horas        ?? 0,
    nivel:      data.nivel        ?? 1,
    registrado: data.registrado  || new Date().toISOString(),
  };
  localStorage.setItem(PERFIL_KEY, JSON.stringify(profile));

  /* ── Insignias ── */
  if (Array.isArray(data.badges))
    localStorage.setItem(BADGES_KEY, JSON.stringify(data.badges));

  /* ── Misiones ── */
  if (data.misiones && typeof data.misiones === 'object')
    localStorage.setItem(MISSION_KEY, JSON.stringify(data.misiones));

  /* ── Timeline ── */
  if (Array.isArray(data.timeline))
    localStorage.setItem(TIMELINE_KEY, JSON.stringify(data.timeline));

  /* ── Buzón ── */
  if (data.buzon_estado && typeof data.buzon_estado === 'object')
    localStorage.setItem(BUZON_KEY, JSON.stringify(data.buzon_estado));

  /* ── Resets ── */
  if (data.mission_resets && typeof data.mission_resets === 'object')
    localStorage.setItem(RESET_KEY, JSON.stringify(data.mission_resets));

  /* ── Baselines ── */
  if (data.baselines && typeof data.baselines === 'object')
    localStorage.setItem(BASELINE_KEY, JSON.stringify(data.baselines));

  /* ── Inventario ── */
  const inventory = data.inventory && typeof data.inventory === 'object'
    ? { ...DEFAULT_INVENTORY, ...data.inventory }
    : DEFAULT_INVENTORY;
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));

  /* ── Títulos ── */
  if (Array.isArray(data.titles_earned))
    localStorage.setItem(TITLES_KEY, JSON.stringify(data.titles_earned));

  if (data.title_active)
    localStorage.setItem(TITLE_ACTIVE_KEY, data.title_active);

  /* ── Player ID ── */
  const playerID = data.player_id || generatePlayerID(uid);
  localStorage.setItem(PLAYER_ID_KEY, playerID);

  /* ── Si el doc no tiene player_id aún, guardarlo ── */
  if (!data.player_id) {
    updateDoc(snap.ref || doc(db,'users',uid), { player_id: playerID }).catch(() => {});
  }

  /* ── Referencia de sesión ── */
  localStorage.setItem('mv_user', JSON.stringify({
    uid,
    email:    profile.email,
    nombre:   profile.nombre,
    avatar:   profile.avatar,
    player_id: playerID,
  }));

  return true;
}

/* ─────────────────────────────────────────────────────
   ACTUALIZAR PERFIL (partial update)
   ───────────────────────────────────────────────────── */
export async function updateUserProfile(uid, data) {
  try {
    await updateDoc(userRef(uid), { ...data, updatedAt: serverTimestamp() });
    return true;
  } catch (e) {
    console.error('[DB] updateUserProfile:', e);
    return false;
  }
}

/* ─────────────────────────────────────────────────────
   GUARDAR INVENTARIO
   ───────────────────────────────────────────────────── */
export async function saveInventory(uid, inventory) {
  try {
    await updateDoc(userRef(uid), { inventory, updatedAt: serverTimestamp() });
    return true;
  } catch (e) {
    console.error('[DB] saveInventory:', e);
    return false;
  }
}

/* ─────────────────────────────────────────────────────
   GUARDAR TÍTULOS
   ───────────────────────────────────────────────────── */
export async function saveTitlesData(uid, titlesEarned, titleActive) {
  try {
    await updateDoc(userRef(uid), {
      titles_earned: titlesEarned,
      title_active:  titleActive,
      updatedAt:     serverTimestamp(),
    });
    return true;
  } catch (e) {
    console.error('[DB] saveTitlesData:', e);
    return false;
  }
}

/* ─────────────────────────────────────────────────────
   GUARDAR MISIONES
   ───────────────────────────────────────────────────── */
export async function saveMisionesEstado(uid, misionesState) {
  try {
    await updateDoc(userRef(uid), { misiones: misionesState, updatedAt: serverTimestamp() });
    return true;
  } catch (e) {
    console.error('[DB] saveMisionesEstado:', e);
    return false;
  }
}

/* ─────────────────────────────────────────────────────
   GUARDAR BUZÓN
   ───────────────────────────────────────────────────── */
export async function saveBuzonEstado(uid, buzonState) {
  try {
    await updateDoc(userRef(uid), { buzon_estado: buzonState, updatedAt: serverTimestamp() });
    return true;
  } catch (e) {
    console.error('[DB] saveBuzonEstado:', e);
    return false;
  }
}

/* ─────────────────────────────────────────────────────
   AGREGAR EVENTO AL TIMELINE
   ───────────────────────────────────────────────────── */
export async function addTimelineEventDB(uid, event) {
  try {
    let timeline = [];
    try { timeline = JSON.parse(localStorage.getItem(TIMELINE_KEY) || '[]'); } catch {}
    if (timeline.length > 60) timeline = timeline.slice(0, 60);
    await updateDoc(userRef(uid), { timeline, updatedAt: serverTimestamp() });
    return true;
  } catch (e) {
    console.error('[DB] addTimelineEventDB:', e);
    return false;
  }
}

/* ─────────────────────────────────────────────────────
   GUARDAR INSIGNIAS
   ───────────────────────────────────────────────────── */
export async function saveBadges(uid, badgesArray) {
  try {
    await updateDoc(userRef(uid), { badges: badgesArray, updatedAt: serverTimestamp() });
    return true;
  } catch (e) {
    console.error('[DB] saveBadges:', e);
    return false;
  }
}

/* ─────────────────────────────────────────────────────
   GUARDAR RESETS Y BASELINES
   ───────────────────────────────────────────────────── */
export async function saveMissionResets(uid, resets, baselines) {
  try {
    await updateDoc(userRef(uid), {
      mission_resets: resets,
      baselines,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (e) {
    console.error('[DB] saveMissionResets:', e);
    return false;
  }
}

/* ─────────────────────────────────────────────────────
   PUSH LOCAL → FIRESTORE (backup completo)
   ───────────────────────────────────────────────────── */
export async function pushLocalToFirestore(uid) {
  try {
    const getLS = (k, fallback = null) => {
      try { return JSON.parse(localStorage.getItem(k)); } catch { return fallback; }
    };

    const profile      = getLS(PERFIL_KEY)       || {};
    const misiones     = getLS(MISSION_KEY)      || {};
    const badges       = getLS(BADGES_KEY)       || [];
    const buzon_estado = getLS(BUZON_KEY)        || {};
    const resets       = getLS(RESET_KEY)        || {};
    const baselines    = getLS(BASELINE_KEY)     || {};
    const timeline     = getLS(TIMELINE_KEY)     || [];
    const inventory    = getLS(INVENTORY_KEY)    || { tickets:0, keys:0, superstar_keys:0 };
    const titles_earned= getLS(TITLES_KEY)       || ['tl_novato'];
    const title_active = localStorage.getItem(TITLE_ACTIVE_KEY) || 'tl_novato';
    const player_id    = localStorage.getItem(PLAYER_ID_KEY) || '';

    await setDoc(userRef(uid), {
      nombre:         profile.nombre      || 'Aventurero',
      email:          profile.email       || '',
      avatar:         profile.avatar      || '🌙',
      xp:             profile.xp          ?? 0,
      racha:          profile.racha        ?? 0,
      horas:          profile.horas        ?? 0,
      registrado:     profile.registrado  || new Date().toISOString(),
      misiones,
      badges,
      buzon_estado,
      mission_resets: resets,
      baselines,
      timeline:       timeline.slice(0, 60),
      inventory,
      titles_earned,
      title_active,
      player_id,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return true;
  } catch (e) {
    console.error('[DB] pushLocalToFirestore:', e);
    return false;
  }
}

/* ─────────────────────────────────────────────────────
   OBTENER PERFIL
   ───────────────────────────────────────────────────── */
export async function getUserProfile(uid) {
  try {
    const snap = await getDoc(userRef(uid));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.error('[DB] getUserProfile:', e);
    return null;
  }
}