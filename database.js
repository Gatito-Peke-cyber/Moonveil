/* =====================================================
   Moonveil Portal — database.js
   CRUD con Firestore.
   Estructura: users/{uid} → documento con todos los datos
   ===================================================== */

import { db } from './firebase.js';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

/* ── KEYS de localStorage (deben coincidir con perfil.js) ── */
const PERFIL_KEY    = 'mv_perfil';
const BADGES_KEY    = 'mv_badges';
const MISSION_KEY   = 'mv_misiones';
const TIMELINE_KEY  = 'mv_timeline';
const BUZON_KEY     = 'mv_buzon_estado';
const RESET_KEY     = 'mv_mission_resets';
const BASELINE_KEY  = 'mv_baselines';

/* ── HELPER: referencia al documento del usuario ── */
const userRef = (uid) => doc(db, 'users', uid);

/* ─────────────────────────────────────────────────────
   SYNC COMPLETO: Firestore → localStorage
   Llamar al iniciar el perfil para cargar todos los datos
   ───────────────────────────────────────────────────── */
export async function syncAllToLocalStorage(uid) {
  const snap = await getDoc(userRef(uid));
  if (!snap.exists()) return false;

  const data = snap.data();

  /* Perfil principal */
  const profile = {
    nombre:     data.nombre     || 'Aventurero',
    email:      data.email      || '',
    avatar:     data.avatar     || '🌙',
    xp:         data.xp        ?? 0,
    racha:      data.racha      ?? 0,
    horas:      data.horas      ?? 0,
    registrado: data.registrado || new Date().toISOString(),
  };
  localStorage.setItem(PERFIL_KEY, JSON.stringify(profile));

  /* Insignias */
  if (Array.isArray(data.badges)) {
    localStorage.setItem(BADGES_KEY, JSON.stringify(data.badges));
  }

  /* Misiones */
  if (data.misiones && typeof data.misiones === 'object') {
    localStorage.setItem(MISSION_KEY, JSON.stringify(data.misiones));
  }

  /* Timeline */
  if (Array.isArray(data.timeline)) {
    localStorage.setItem(TIMELINE_KEY, JSON.stringify(data.timeline));
  }

  /* Estado del buzón */
  if (data.buzon_estado && typeof data.buzon_estado === 'object') {
    localStorage.setItem(BUZON_KEY, JSON.stringify(data.buzon_estado));
  }

  /* Resets de misiones */
  if (data.mission_resets && typeof data.mission_resets === 'object') {
    localStorage.setItem(RESET_KEY, JSON.stringify(data.mission_resets));
  }

  /* Baselines */
  if (data.baselines && typeof data.baselines === 'object') {
    localStorage.setItem(BASELINE_KEY, JSON.stringify(data.baselines));
  }

  /* Guardar referencia del usuario para checks rápidos */
  localStorage.setItem('mv_user', JSON.stringify({
    uid,
    email:  profile.email,
    nombre: profile.nombre,
    avatar: profile.avatar,
  }));

  return true;
}

/* ─────────────────────────────────────────────────────
   OBTENER PERFIL DEL USUARIO
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

/* ─────────────────────────────────────────────────────
   ACTUALIZAR CAMPOS DEL PERFIL (partial update)
   Ejemplo: updateUserProfile(uid, { xp: 500, racha: 7 })
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
   GUARDAR ESTADO DE MISIONES
   ───────────────────────────────────────────────────── */
export async function saveMisionesEstado(uid, misionesState) {
  try {
    await updateDoc(userRef(uid), {
      misiones:   misionesState,
      updatedAt:  serverTimestamp(),
    });
    return true;
  } catch (e) {
    console.error('[DB] saveMisionesEstado:', e);
    return false;
  }
}

/* ─────────────────────────────────────────────────────
   GUARDAR ESTADO DEL BUZÓN
   ───────────────────────────────────────────────────── */
export async function saveBuzonEstado(uid, buzonState) {
  try {
    await updateDoc(userRef(uid), {
      buzon_estado: buzonState,
      updatedAt:    serverTimestamp(),
    });
    return true;
  } catch (e) {
    console.error('[DB] saveBuzonEstado:', e);
    return false;
  }
}

/* ─────────────────────────────────────────────────────
   AGREGAR EVENTO AL TIMELINE
   Usa arrayUnion para no sobreescribir otros eventos
   + guarda el array completo de localStorage como backup
   ───────────────────────────────────────────────────── */
export async function addTimelineEventDB(uid, event) {
  try {
    /* Leer timeline actual desde localStorage (ya actualizado) */
    let timeline = [];
    try { timeline = JSON.parse(localStorage.getItem(TIMELINE_KEY)||'[]'); } catch {}
    /* Limitar a 60 entradas */
    if (timeline.length > 60) timeline = timeline.slice(0, 60);

    await updateDoc(userRef(uid), {
      timeline:  timeline,
      updatedAt: serverTimestamp(),
    });
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
    await updateDoc(userRef(uid), {
      badges:    badgesArray,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (e) {
    console.error('[DB] saveBadges:', e);
    return false;
  }
}

/* ─────────────────────────────────────────────────────
   GUARDAR RESETS Y BASELINES DE MISIONES
   ───────────────────────────────────────────────────── */
export async function saveMissionResets(uid, resets, baselines) {
  try {
    await updateDoc(userRef(uid), {
      mission_resets: resets,
      baselines:      baselines,
      updatedAt:      serverTimestamp(),
    });
    return true;
  } catch (e) {
    console.error('[DB] saveMissionResets:', e);
    return false;
  }
}

/* ─────────────────────────────────────────────────────
   GUARDAR TODO EL ESTADO LOCAL EN FIRESTORE
   (útil antes de cerrar sesión o como backup periódico)
   ───────────────────────────────────────────────────── */
export async function pushLocalToFirestore(uid) {
  try {
    const getLS = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };

    const profile       = getLS(PERFIL_KEY)   || {};
    const misiones      = getLS(MISSION_KEY)  || {};
    const badges        = getLS(BADGES_KEY)   || [];
    const buzon_estado  = getLS(BUZON_KEY)    || {};
    const mission_resets= getLS(RESET_KEY)    || {};
    const baselines     = getLS(BASELINE_KEY) || {};
    const timeline      = getLS(TIMELINE_KEY) || [];

    await setDoc(userRef(uid), {
      nombre:         profile.nombre     || 'Aventurero',
      email:          profile.email      || '',
      avatar:         profile.avatar     || '🌙',
      xp:             profile.xp         ?? 0,
      racha:          profile.racha      ?? 0,
      horas:          profile.horas      ?? 0,
      registrado:     profile.registrado || new Date().toISOString(),
      misiones,
      badges,
      buzon_estado,
      mission_resets,
      baselines,
      timeline: timeline.slice(0, 60),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return true;
  } catch (e) {
    console.error('[DB] pushLocalToFirestore:', e);
    return false;
  }
}