/* =====================================================
   Moonveil Portal — firebase.js  v2
   Añadido: Firebase Storage
   ===================================================== */

import { initializeApp }  from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getAuth }        from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { getFirestore }   from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";
import { getStorage }     from "https://www.gstatic.com/firebasejs/12.10.0/firebase-storage.js";

const firebaseConfig = {
  apiKey:            "AIzaSyDfEd2hVLCuk03gufsPYTvEMyqESXMTdWw",
  authDomain:        "moonveil-portal.firebaseapp.com",
  projectId:         "moonveil-portal",
  storageBucket:     "moonveil-portal.firebasestorage.app",
  messagingSenderId: "480597962994",
  appId:             "1:480597962994:web:6245174570461dd3cca06b",
  measurementId:     "G-17HSVX753M"
};

const app = initializeApp(firebaseConfig);

export const auth    = getAuth(app);
export const db      = getFirestore(app);
export const storage = getStorage(app);