/* =====================================================
   Moonveil Portal — login.js  (módulo ES)
   Firebase Auth — Email/Password + Google
   ===================================================== */
import {
  loginWithEmail,
  loginWithGoogle,
  handleGoogleRedirect,
  resetPassword,
  onAuthChange,
} from './auth.js';

const MUSIC_PATH = 'music/1.mp3';

/* ── HELPERS ── */
const $ = s => document.querySelector(s);

function toast(msg, type = 'success') {
  const t = $('#toast'); if (!t) return;
  t.textContent = msg;
  t.className = `show ${type}`;
  clearTimeout(t._tid);
  t._tid = setTimeout(() => { t.className = ''; }, 3200);
}

function validateEmail(v)    { return /^\S+@\S+\.\S+$/.test(v.trim()); }
function validatePassword(v) { return v.length >= 6; }

function setFieldState(wrapId, state, icon = '') {
  const wrap = $(`#${wrapId}`); if (!wrap) return;
  wrap.classList.remove('error-state', 'success-state');
  if (state === 'error')   wrap.classList.add('error-state');
  if (state === 'success') wrap.classList.add('success-state');
  const s = wrap.querySelector('.field-status');
  if (s) s.textContent = icon;
}

/* ── STARS ── */
function initStars() {
  const canvas = $('#stars-canvas'); if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W = canvas.width = window.innerWidth, H = canvas.height = window.innerHeight;
  const COLORS = ['#30d158','#40ff6e','#ffffff','#00e5ff','#f5c518'];
  const stars = Array.from({ length: 120 }, () => ({
    x: Math.random()*W, y: Math.random()*H,
    r: Math.random()*1.6+0.4, o: Math.random()*0.5+0.1,
    speed: Math.random()*0.3+0.08,
    ci: Math.floor(Math.random()*COLORS.length),
  }));
  (function draw() {
    ctx.clearRect(0, 0, W, H);
    stars.forEach(s => {
      ctx.globalAlpha = s.o; ctx.fillStyle = COLORS[s.ci];
      ctx.fillRect(s.x, s.y, s.r, s.r);
      s.y -= s.speed; if (s.y < 0) { s.y = H; s.x = Math.random()*W; }
    });
    requestAnimationFrame(draw);
  })();
  window.addEventListener('resize', () => {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  });
}

/* ── LOADER ── */
function hideLoader() {
  const loader = $('#loader'); if (!loader) return;
  let w = 0; const fill = $('#ld-fill');
  const iv = setInterval(() => {
    w += Math.random()*20+8;
    if (fill) fill.style.width = Math.min(w,100)+'%';
    if (w >= 100) {
      clearInterval(iv);
      setTimeout(() => {
        loader.style.transition = 'opacity 0.4s';
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 400);
      }, 250);
    }
  }, 60);
}

/* ── CLOCK ── */
function initClock() {
  function update() {
    const now = new Date();
    const t = now.toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit', hour12:false });
    const d = now.toLocaleDateString('es-ES', { weekday:'short', day:'numeric', month:'short' });
    const el = $('#headerTime');
    if (el) el.textContent = `${t} · ${d.toUpperCase()}`;
  }
  update();
  setInterval(update, 1000);
}

/* ── MUSIC ── */
function initMusic() {
  const player = $('#musicPlayer');
  const btn    = $('#musicBtn');
  if (!btn) return;
  let audio = null, playing = false;
  if (MUSIC_PATH) {
    audio = new Audio(MUSIC_PATH);
    audio.loop = true;
    audio.volume = 0.25;
  }
  btn.addEventListener('click', () => {
    if (!audio) return;
    if (playing) {
      audio.pause(); playing = false; player?.classList.remove('playing');
    } else {
      audio.play().catch(() => toast('❌ No se pudo reproducir el audio','error'));
      playing = true; player?.classList.add('playing');
    }
  });
}

/* ── MAIN ── */
document.addEventListener('DOMContentLoaded', async () => {
  hideLoader();
  initStars();
  initClock();
  initMusic();

  /* Detectar vuelta de redirect de Google (móvil/Netlify) */
  if (sessionStorage.getItem('google_redirect_pending')) {
    toast('⟳ Procesando inicio con Google...','info');
    const result = await handleGoogleRedirect();
    if (result?.user) {
      toast('✓ SESIÓN INICIADA CON GOOGLE','success');
      setTimeout(() => { window.location.href = 'perfil.html'; }, 700);
      return;
    }
    if (result?.error) toast(`❌ ${result.error}`,'error');
  }

  /* Si ya hay sesión activa, redirigir directamente */
  onAuthChange(user => {
    if (user) window.location.href = 'perfil.html';
  });

  const form       = $('#loginForm');
  const emailInput = $('#email');
  const passInput  = $('#password');
  const emailErr   = $('#emailErr');
  const passErr    = $('#passErr');
  const toggleBtn  = $('#togglePass');
  const rememberCb = $('#remember');
  const submitBtn  = $('#submitBtn');
  const submitText = $('#submit-text');
  const submitLoad = $('#submit-loading');

  if (!form) return;

  /* Restaurar email recordado */
  const savedEmail = localStorage.getItem('mv_remember_email');
  if (savedEmail && emailInput) {
    emailInput.value = savedEmail;
    if (rememberCb) rememberCb.checked = true;
  }

  /* Toggle password visibility */
  toggleBtn?.addEventListener('click', () => {
    const isPw = passInput.type === 'password';
    passInput.type = isPw ? 'text' : 'password';
    toggleBtn.textContent = isPw ? '🙈' : '👁';
  });

  /* Validación en vivo — email */
  emailInput?.addEventListener('blur', () => {
    if (!emailInput.value) return;
    const ok = validateEmail(emailInput.value);
    setFieldState('email-wrap', ok ? 'success' : 'error', ok ? '✓' : '✗');
    if (emailErr) emailErr.textContent = ok ? '' : 'CORREO INVÁLIDO';
  });
  emailInput?.addEventListener('input', () => {
    if (!emailErr?.textContent) return;
    const ok = validateEmail(emailInput.value);
    setFieldState('email-wrap', ok ? 'success' : 'error', ok ? '✓' : '✗');
    if (emailErr) emailErr.textContent = ok ? '' : 'CORREO INVÁLIDO';
  });

  /* Validación en vivo — contraseña */
  passInput?.addEventListener('blur', () => {
    if (!passInput.value) return;
    const ok = validatePassword(passInput.value);
    setFieldState('pass-wrap', ok ? 'success' : 'error', ok ? '✓' : '✗');
    if (passErr) passErr.textContent = ok ? '' : 'MÍNIMO 6 CARACTERES';
  });

  /* ── Olvidé mi contraseña ── */
  $('#forgotLink')?.addEventListener('click', async e => {
    e.preventDefault();
    const email = emailInput?.value.trim() || '';
    if (!validateEmail(email)) {
      toast('⚠ Escribe tu correo primero','error');
      emailInput?.focus();
      return;
    }
    const { error } = await resetPassword(email);
    if (error) { toast(`❌ ${error}`,'error'); return; }
    toast('📧 CORREO DE RECUPERACIÓN ENVIADO','success');
  });

  /* ── Botones sociales (Google y Discord) ── */
  document.querySelectorAll('[data-provider]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const provider = btn.dataset.provider;

      if (provider === 'google') {
        btn.disabled = true;
        const orig = btn.innerHTML;
        btn.innerHTML = `<span style="font-family:var(--font-pixel);font-size:0.35rem">⟳ CONECTANDO...</span>`;
        toast('⟳ Conectando con Google...','info');

        const result = await loginWithGoogle();

        if (result?.redirecting) {
          toast('⟳ Redirigiendo a Google...','info');
          return;
        }
        btn.disabled = false;
        btn.innerHTML = orig;

        if (result?.error) { toast(`❌ ${result.error}`,'error'); return; }
        if (result?.user)  {
          toast('✓ SESIÓN INICIADA','success');
          setTimeout(() => { window.location.href = 'perfil.html'; }, 700);
        }
      } else {
        toast(`⚡ ${provider.toUpperCase()} — Próximamente`,'info');
      }
    });
  });

  /* ── Submit Email/Password ── */
  form.addEventListener('submit', async e => {
    e.preventDefault();

    /* Limpiar errores previos */
    if (emailErr) emailErr.textContent = '';
    if (passErr)  passErr.textContent  = '';
    setFieldState('email-wrap', '');
    setFieldState('pass-wrap',  '');

    let ok = true;
    if (!validateEmail(emailInput.value)) {
      if (emailErr) emailErr.textContent = 'CORREO INVÁLIDO';
      setFieldState('email-wrap','error','✗'); ok = false;
    }
    if (!validatePassword(passInput.value)) {
      if (passErr) passErr.textContent = 'MÍNIMO 6 CARACTERES';
      setFieldState('pass-wrap','error','✗'); ok = false;
    }
    if (!ok) { toast('⚠ Corrige los errores','error'); return; }

    /* Bloquear UI mientras espera */
    submitBtn.disabled = true;
    if (submitText) submitText.hidden = true;
    if (submitLoad) submitLoad.hidden = false;

    const { user, error } = await loginWithEmail(
      emailInput.value.trim(),
      passInput.value
    );

    if (error) {
      submitBtn.disabled = false;
      if (submitText) submitText.hidden = false;
      if (submitLoad) submitLoad.hidden = true;
      setFieldState('email-wrap','error','✗');
      setFieldState('pass-wrap','error','✗');
      toast(`❌ ${error}`,'error');
      return;
    }

    /* Recordar email si está marcado */
    if (rememberCb?.checked) {
      localStorage.setItem('mv_remember_email', emailInput.value.trim());
    } else {
      localStorage.removeItem('mv_remember_email');
    }

    setFieldState('email-wrap','success','✓');
    setFieldState('pass-wrap','success','✓');
    toast('✓ SESIÓN INICIADA — REDIRIGIENDO...','success');
    setTimeout(() => { window.location.href = 'perfil.html'; }, 1000);
  });
});