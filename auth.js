/* =====================================================
   Moonveil Portal — auth.js
   Funciones de autenticación con Firebase Auth
   Soporta: Email/Password, Google (popup + redirect)
   ===================================================== */

import { auth }                    from './firebase.js';
import { db }                      from './firebase.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

/* ── PROVEEDOR GOOGLE ── */
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

/* ── MENSAJES DE ERROR EN ESPAÑOL ── */
function friendlyError(code) {
  const map = {
    'auth/user-not-found':          'No existe una cuenta con ese correo',
    'auth/wrong-password':          'Contraseña incorrecta',
    'auth/invalid-credential':      'Correo o contraseña incorrectos',
    'auth/email-already-in-use':    'Ese correo ya está registrado',
    'auth/weak-password':           'La contraseña es demasiado débil (mínimo 6 caracteres)',
    'auth/invalid-email':           'Formato de correo inválido',
    'auth/too-many-requests':       'Demasiados intentos. Espera unos minutos',
    'auth/network-request-failed':  'Error de conexión. Revisa tu internet',
    'auth/user-disabled':           'Esta cuenta ha sido deshabilitada',
    'auth/popup-closed-by-user':    'La ventana de Google fue cerrada',
    'auth/popup-blocked':           'Bloqueado por el navegador. Usa otro método',
    'auth/cancelled-popup-request': 'Solicitud cancelada',
    'auth/operation-not-allowed':   'Método de inicio de sesión no habilitado',
  };
  return map[code] || `Error: ${code}`;
}

/* ── CREAR PERFIL EN FIRESTORE (primer registro) ── */
async function createUserDocument(uid, data) {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, {
      nombre:         data.nombre    || 'Aventurero',
      email:          data.email     || '',
      avatar:         data.avatar    || '🌙',
      xp:             data.xp        || 200,
      racha:          0,
      horas:          0,
      registrado:     new Date().toISOString(),
      misiones:       {},
      badges:         ['b_newcomer'],
      buzon_estado:   {},
      mission_resets: {},
      baselines:      {},
      timeline: [{
        icon:   '🌙',
        title:  '¡Cuenta creada en Moonveil Portal!',
        detail: '+200 XP de bienvenida',
        fecha:  new Date().toISOString(),
      }],
      createdAt: serverTimestamp(),
    });
  }
}

/* ─────────────────────────────────────────────────────
   INICIAR SESIÓN CON EMAIL Y CONTRASEÑA
   ───────────────────────────────────────────────────── */
export async function loginWithEmail(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    return { user: cred.user, error: null };
  } catch (e) {
    return { user: null, error: friendlyError(e.code) };
  }
}

/* ─────────────────────────────────────────────────────
   REGISTRAR NUEVO USUARIO CON EMAIL Y CONTRASEÑA
   ───────────────────────────────────────────────────── */
export async function registerWithEmail(displayName, email, password, avatar = '🌙') {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    /* Actualizar displayName en Firebase Auth */
    await updateProfile(cred.user, { displayName });
    /* Crear documento en Firestore */
    await createUserDocument(cred.user.uid, {
      nombre: displayName,
      email:  email.trim(),
      avatar,
      xp:     200,
    });
    return { user: cred.user, error: null };
  } catch (e) {
    return { user: null, error: friendlyError(e.code) };
  }
}

/* ─────────────────────────────────────────────────────
   INICIAR SESIÓN CON GOOGLE
   Intenta popup primero; en caso de error usa redirect
   (útil en móviles o navegadores que bloquean popups)
   ───────────────────────────────────────────────────── */
export async function loginWithGoogle() {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    const user  = cred.user;
    const isNew = cred._tokenResponse?.isNewUser || false;

    if (isNew) {
      await createUserDocument(user.uid, {
        nombre: user.displayName || 'Aventurero',
        email:  user.email || '',
        avatar: '🌙',
        xp:     200,
      });
    }
    return { user, isNew, error: null };
  } catch (e) {
    /* Si el popup fue bloqueado, redirigir */
    if (e.code === 'auth/popup-blocked' || e.code === 'auth/popup-closed-by-user') {
      try {
        sessionStorage.setItem('google_redirect_pending', '1');
        await signInWithRedirect(auth, googleProvider);
        return { redirecting: true };
      } catch (e2) {
        return { user: null, error: friendlyError(e2.code) };
      }
    }
    return { user: null, error: friendlyError(e.code) };
  }
}

/* ─────────────────────────────────────────────────────
   MANEJAR RESULTADO DE REDIRECT DE GOOGLE
   Llamar al inicio de la página de login
   ───────────────────────────────────────────────────── */
export async function handleGoogleRedirect() {
  sessionStorage.removeItem('google_redirect_pending');
  try {
    const result = await getRedirectResult(auth);
    if (!result) return null;

    const user  = result.user;
    const isNew = result._tokenResponse?.isNewUser || false;

    if (isNew) {
      await createUserDocument(user.uid, {
        nombre: user.displayName || 'Aventurero',
        email:  user.email || '',
        avatar: '🌙',
        xp:     200,
      });
    }
    return { user, isNew, error: null };
  } catch (e) {
    return { user: null, error: friendlyError(e.code) };
  }
}

/* ─────────────────────────────────────────────────────
   RECUPERAR CONTRASEÑA
   ───────────────────────────────────────────────────── */
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email.trim());
    return { error: null };
  } catch (e) {
    return { error: friendlyError(e.code) };
  }
}

/* ─────────────────────────────────────────────────────
   CERRAR SESIÓN
   ───────────────────────────────────────────────────── */
export async function logout() {
  try {
    await signOut(auth);
    /* Limpiar caché local relevante */
    ['mv_perfil','mv_user'].forEach(k => localStorage.removeItem(k));
    return { error: null };
  } catch (e) {
    return { error: friendlyError(e.code) };
  }
}

/* ─────────────────────────────────────────────────────
   OBSERVADOR DE ESTADO DE AUTENTICACIÓN
   Llama a callback(user) cuando cambia el estado.
   user = null → no autenticado
   ───────────────────────────────────────────────────── */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

/* ─────────────────────────────────────────────────────
   OBTENER USUARIO ACTUAL (sincrónico)
   ───────────────────────────────────────────────────── */
export function getCurrentUser() {
  return auth.currentUser;
}