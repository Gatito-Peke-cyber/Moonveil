/* =====================================================
   Moonveil Portal — admin-database.js  v1.0
   Funciones de base de datos exclusivas para admins
   ===================================================== */

import { db } from './firebase.js';
import {
  collection, getDocs, getDoc, doc, updateDoc,
  query, orderBy, limit, startAfter, where,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

/* ══════════════════════════════════════════
   DEFINICIÓN DE ROLES
   ══════════════════════════════════════════
   Para dar el primer rol admin:
   1. Ve a Firebase Console → Firestore → colección "users"
   2. Abre el documento del usuario (su UID como ID)
   3. Agrega o edita el campo: role = "admin"
   Después de eso, ese admin puede gestionar los demás roles desde el panel.
   ══════════════════════════════════════════ */
export const ROLES = {
  user: {
    id: 'user',
    label: 'USUARIO',
    icon: '👤',
    color: '#4a7060',
    priority: 0,
  },
  verified: {
    id: 'verified',
    label: 'VERIFICADO',
    icon: '✓',
    color: '#00e5ff',
    priority: 1,
  },
  developer: {
    id: 'developer',
    label: 'DEVELOPER',
    icon: '🛠️',
    color: '#bf5af2',
    priority: 2,
  },
  admin: {
    id: 'admin',
    label: 'ADMIN',
    icon: '👑',
    color: '#ff2d78',
    priority: 3,
  },
};

/* ── Helpers de verificación de rol ── */
export async function getUserRole(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? (snap.data().role || 'user') : 'user';
  } catch { return 'user'; }
}

export async function isAdminUser(uid) {
  const role = await getUserRole(uid);
  return role === 'admin';
}

export async function isDeveloperOrAdmin(uid) {
  const role = await getUserRole(uid);
  return ['admin', 'developer'].includes(role);
}

export async function isVerifiedOrAbove(uid) {
  const role = await getUserRole(uid);
  return ['admin', 'developer', 'verified'].includes(role);
}

/** Verifica acceso al panel admin (solo 'admin') */
export async function verifyAdminAccess(uid) {
  if (!uid) return false;
  return await isAdminUser(uid);
}

/* ── Obtener todos los usuarios paginados ── */
export async function getAllUsers(pageSize = 40, lastVisible = null) {
  try {
    let q = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );
    if (lastVisible) {
      q = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        limit(pageSize)
      );
    }
    const snap = await getDocs(q);
    return {
      users: snap.docs.map(d => ({ uid: d.id, ...d.data() })),
      lastDoc: snap.docs[snap.docs.length - 1] || null,
      hasMore: snap.docs.length === pageSize,
    };
  } catch (e) {
    console.error('[AdminDB] getAllUsers:', e);
    return { users: [], lastDoc: null, hasMore: false };
  }
}

/** Buscar usuario por player_id o email exacto */
export async function searchUsers(term) {
  try {
    const t = term.trim().toUpperCase();
    // Buscar por Player ID
    if (t.startsWith('#') || t.includes('-')) {
      const pid = t.startsWith('#') ? t : '#' + t;
      const q = query(collection(db, 'users'), where('player_id', '==', pid));
      const snap = await getDocs(q);
      if (!snap.empty) return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
    }
    // Buscar por email (minúscula)
    const qEmail = query(collection(db, 'users'), where('email', '==', term.trim().toLowerCase()));
    const snapEmail = await getDocs(qEmail);
    if (!snapEmail.empty) return snapEmail.docs.map(d => ({ uid: d.id, ...d.data() }));
    return [];
  } catch (e) {
    console.error('[AdminDB] searchUsers:', e);
    return [];
  }
}

/** Obtener usuarios filtrados por rol */
export async function getUsersByRole(role) {
  try {
    const q = query(collection(db, 'users'), where('role', '==', role));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
  } catch (e) {
    console.error('[AdminDB] getUsersByRole:', e);
    return [];
  }
}

/** Obtener datos completos de un usuario */
export async function getUserFull(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? { uid: snap.id, ...snap.data() } : null;
  } catch { return null; }
}

/** Cambiar rol de un usuario (solo admins pueden llamar esto) */
export async function updateUserRole(adminUID, targetUID, newRole) {
  try {
    if (!Object.keys(ROLES).includes(newRole)) {
      console.error('[AdminDB] Rol inválido:', newRole);
      return false;
    }
    // No se puede degradar a otro admin (protección básica)
    const targetRole = await getUserRole(targetUID);
    if (targetRole === 'admin' && newRole !== 'admin') {
      // Permitir solo si el admin lo decide conscientemente
      // (lógica de confirmación en el frontend)
    }
    await updateDoc(doc(db, 'users', targetUID), {
      role: newRole,
      role_updated_by: adminUID,
      role_updated_at: serverTimestamp(),
    });
    return true;
  } catch (e) {
    console.error('[AdminDB] updateUserRole:', e);
    return false;
  }
}

/** Estadísticas generales del portal */
export async function getPortalStats() {
  try {
    const snap = await getDocs(collection(db, 'users'));
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    const stats = {
      total: 0,
      online: 0,
      admin: 0,
      developer: 0,
      verified: 0,
      user: 0,
      totalXP: 0,
      avgXP: 0,
      newToday: 0,
    };
    const today = new Date().toDateString();
    snap.docs.forEach(d => {
      const data = d.data();
      stats.total++;
      const role = data.role || 'user';
      stats[role] = (stats[role] || 0) + 1;
      stats.totalXP += data.xp || 0;
      if (data.presence?.state === 'online') {
        const last = data.presence?.lastSeen ? new Date(data.presence.lastSeen).getTime() : 0;
        if (last > fiveMinAgo) stats.online++;
      }
      if (data.createdAt) {
        const created = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
        if (created.toDateString() === today) stats.newToday++;
      }
    });
    stats.avgXP = stats.total ? Math.floor(stats.totalXP / stats.total) : 0;
    return stats;
  } catch (e) {
    console.error('[AdminDB] getPortalStats:', e);
    return null;
  }
}