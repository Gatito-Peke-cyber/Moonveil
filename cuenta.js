/* =====================================================
   Moonveil Portal — cuenta.js v2.0
   Registro local (sin Firebase)
   ===================================================== */
'use strict';

const AVATARS = [
  '🌙','🦊','🐱','🐸','🦄','🐧','🦁','🐼',
  '🤖','👾','🧙','🌟','🐉','🦅','🐢','🎮',
  '⚔️','💎','🔮','🎯','🌈','🏆','👑','🚀',
];

let selectedAvatar = '🌙';

const $ = s => document.querySelector(s);

function toast(msg, type = 'success') {
  const t = $('#toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `show ${type}`;
  clearTimeout(t._tid);
  t._tid = setTimeout(() => { t.className = ''; }, 3200);
}

function setFieldState(wrapId, state, icon = '') {
  const wrap = $(`#${wrapId}`);
  if (!wrap) return;
  wrap.classList.remove('error-state', 'success-state');
  if (state === 'error')   wrap.classList.add('error-state');
  if (state === 'success') wrap.classList.add('success-state');
  const s = wrap.querySelector('.field-status');
  if (s) s.textContent = icon;
}

/* ── Stars ── */
function initStars() {
  const canvas = $('#stars-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W = canvas.width  = window.innerWidth;
  let H = canvas.height = window.innerHeight;
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
      ctx.globalAlpha = s.o;
      ctx.fillStyle = COLORS[s.ci];
      ctx.fillRect(s.x, s.y, s.r, s.r);
      s.y -= s.speed;
      if (s.y < 0) { s.y = H; s.x = Math.random()*W; }
    });
    requestAnimationFrame(draw);
  })();
  window.addEventListener('resize', () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; });
}

/* ── Loader ── */
function hideLoader() {
  const loader = $('#loader');
  if (!loader) return;
  let w = 0; const fill = $('#ld-fill');
  const iv = setInterval(() => {
    w += Math.random()*22+8;
    if (fill) fill.style.width = Math.min(w,100)+'%';
    if (w >= 100) {
      clearInterval(iv);
      setTimeout(() => { loader.style.transition='opacity 0.4s'; loader.style.opacity='0'; setTimeout(()=>loader.style.display='none',400); }, 200);
    }
  }, 55);
}

/* ── Steps ── */
function setStep(n) {
  [1,2,3].forEach(i => {
    const s   = $(`#step-${i}`);
    const p   = $(`#panel-step-${i}`);
    const dot = s?.querySelector('.step-dot');
    if (!s) return;
    s.classList.remove('active','done');
    if      (i < n)  { s.classList.add('done');   if (dot) dot.textContent = '✓'; }
    else if (i === n){ s.classList.add('active'); if (dot) dot.textContent = i;   }
    else             { if (dot) dot.textContent = i; }
    if (p) p.style.display = i === n ? '' : 'none';
  });
}

/* ── Password strength ── */
const STRENGTH_LABELS  = ['MUY DÉBIL','DÉBIL','MEDIA','FUERTE','MUY FUERTE'];
const STRENGTH_CLASSES = ['s1','s1','s2','s3','s4'];
const STRENGTH_COLORS  = ['var(--red)','var(--red)','var(--orange)','var(--yellow)','var(--primary)'];

function measureStrength(p) {
  let s = 0;
  if (p.length >= 6)  s++;
  if (p.length >= 10) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s++;
  return s;
}
function updateStrength(pass) {
  const wrap = $('#strength-wrap'); if (!wrap) return;
  if (!pass) { wrap.style.display='none'; return; }
  wrap.style.display = '';
  const score = measureStrength(pass);
  [1,2,3,4].forEach(i => {
    const bar = $(`#sb${i}`); if (!bar) return;
    bar.className = 'strength-bar';
    if (i <= score) bar.classList.add(STRENGTH_CLASSES[score]);
  });
  const label = $('#strength-label');
  if (label) { label.textContent = STRENGTH_LABELS[score]; label.style.color = STRENGTH_COLORS[score]; }
}

/* ── Avatar picker ── */
function initAvatarPicker() {
  const picker = $('#avatar-picker'); if (!picker) return;
  picker.innerHTML = AVATARS.map(av => `
    <div class="av-opt${av === selectedAvatar ? ' selected' : ''}" data-av="${av}" tabindex="0">${av}</div>
  `).join('');
  picker.querySelectorAll('.av-opt').forEach(opt => {
    const select = () => {
      picker.querySelectorAll('.av-opt').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedAvatar = opt.dataset.av;
      const prev = $('#avatar-preview'); if (prev) prev.textContent = selectedAvatar;
    };
    opt.addEventListener('click', select);
    opt.addEventListener('keydown', e => { if (e.key==='Enter'||e.key===' ') select(); });
  });
}

/* ── Validation ── */
function validateEmail(v)    { return /^\S+@\S+\.\S+$/.test(v.trim()); }
function validatePassword(v) { return v.length >= 6; }
function validateName(v)     { return v.trim().length >= 2; }

function validateStep1() {
  let ok = true;
  const checks = [
    { id:'nombre',   wrap:'nombre-wrap',   err:'nombreErr',   fn:validateName,     msg:'MÍNIMO 2 CARACTERES' },
    { id:'apellido', wrap:'apellido-wrap', err:'apellidoErr', fn:validateName,     msg:'MÍNIMO 2 CARACTERES' },
    { id:'email',    wrap:'email-wrap',    err:'emailErr',    fn:validateEmail,    msg:'CORREO INVÁLIDO'      },
    { id:'password', wrap:'pass-wrap',     err:'passErr',     fn:validatePassword, msg:'MÍNIMO 6 CARACTERES'  },
  ];
  checks.forEach(({ id, wrap, err, fn, msg }) => {
    const val = $(`#${id}`)?.value || '';
    if (!fn(val)) {
      const el = $(`#${err}`); if (el) el.textContent = msg;
      setFieldState(wrap, 'error', '✗'); ok = false;
    } else {
      const el = $(`#${err}`); if (el) el.textContent = '';
      setFieldState(wrap, 'success', '✓');
    }
  });
  const pass = $('#password')?.value || '';
  const conf = $('#confirm')?.value  || '';
  if (conf !== pass || !conf) {
    const el = $('#confirmErr'); if (el) el.textContent = 'LAS CONTRASEÑAS NO COINCIDEN';
    setFieldState('confirm-wrap', 'error', '✗'); ok = false;
  } else {
    const el = $('#confirmErr'); if (el) el.textContent = '';
    setFieldState('confirm-wrap', 'success', '✓');
  }
  if (!$('#terms')?.checked) {
    const el = $('#termsErr'); if (el) el.textContent = 'DEBES ACEPTAR LOS TÉRMINOS';
    ok = false;
  } else {
    const el = $('#termsErr'); if (el) el.textContent = '';
  }
  return ok;
}

/* ── MAIN ── */
document.addEventListener('DOMContentLoaded', () => {
  hideLoader();
  initStars();
  setStep(1);

  const form = $('#registerForm'); if (!form) return;

  /* Live validation */
  [
    ['nombre','nombre-wrap','nombreErr',validateName,'MÍNIMO 2 CARACTERES'],
    ['apellido','apellido-wrap','apellidoErr',validateName,'MÍNIMO 2 CARACTERES'],
    ['email','email-wrap','emailErr',validateEmail,'CORREO INVÁLIDO'],
    ['password','pass-wrap','passErr',validatePassword,'MÍNIMO 6 CARACTERES'],
  ].forEach(([id,wrap,err,fn,msg]) => {
    const el = $(`#${id}`); if (!el) return;
    const run = () => {
      const ok = fn(el.value);
      setFieldState(wrap, ok ? 'success' : 'error', ok ? '✓' : '✗');
      const errEl = $(`#${err}`); if (errEl) errEl.textContent = ok ? '' : msg;
    };
    el.addEventListener('blur', run);
    el.addEventListener('input', () => { if ($(`#${err}`)?.textContent) run(); });
  });

  $('#password')?.addEventListener('input', e => updateStrength(e.target.value));

  $('#confirm')?.addEventListener('input', () => {
    const pass = $('#password')?.value||''; const conf = $('#confirm')?.value||'';
    const ok = conf === pass && conf.length > 0;
    setFieldState('confirm-wrap', ok ? 'success' : 'error', ok ? '✓' : '✗');
    const el = $('#confirmErr'); if (el) el.textContent = ok ? '' : 'LAS CONTRASEÑAS NO COINCIDEN';
  });

  /* Toggle passwords */
  [['togglePass1','password'],['togglePass2','confirm']].forEach(([btnId, inputId]) => {
    $(`#${btnId}`)?.addEventListener('click', () => {
      const input = $(`#${inputId}`);
      const isPw = input.type === 'password';
      input.type = isPw ? 'text' : 'password';
      $(`#${btnId}`).textContent = isPw ? '🙈' : '👁';
    });
  });

  /* Step 1 → Step 2 */
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!validateStep1()) { toast('⚠ Corrige los errores', 'error'); return; }
    initAvatarPicker();
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* Back */
  $('#btn-back')?.addEventListener('click', () => { setStep(1); window.scrollTo({top:0,behavior:'smooth'}); });

  /* Step 2 → Step 3: Create account */
  $('#btn-confirm-avatar')?.addEventListener('click', () => {
    const btn = $('#btn-confirm-avatar');
    btn.disabled = true; btn.textContent = '⟳ CREANDO CUENTA...';

    const nombre   = $('#nombre')?.value.trim()   || '';
    const apellido = $('#apellido')?.value.trim() || '';
    const email    = $('#email')?.value.trim()    || '';
    const nickname = $('#nickname')?.value.trim() || '';
    const displayName = nickname || `${nombre} ${apellido}`.trim();

    /* Save to localStorage */
    const profile = {
      nombre: displayName,
      email,
      avatar: selectedAvatar,
      xp: 200,
      racha: 0,
      nivel: 1,
      horas: 0,
      registrado: new Date().toISOString(),
    };
    localStorage.setItem('mv_perfil', JSON.stringify(profile));
    localStorage.setItem('mv_user', JSON.stringify({ email, nombre: displayName, avatar: selectedAvatar }));

    /* Badge: Recién Llegado */
    const badges = JSON.parse(localStorage.getItem('mv_badges')||'[]');
    if (!badges.includes('b_newcomer')) {
      badges.push('b_newcomer');
      localStorage.setItem('mv_badges', JSON.stringify(badges));
    }

    /* Timeline */
    const events = JSON.parse(localStorage.getItem('mv_timeline')||'[]');
    events.unshift({ icon:'🌙', title:'¡Cuenta creada en Moonveil Portal!', detail:'+200 XP de bienvenida', fecha: new Date().toISOString() });
    localStorage.setItem('mv_timeline', JSON.stringify(events));

    toast('🎉 ¡CUENTA CREADA! BIENVENIDO/A', 'success');
    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    btn.disabled = false; btn.textContent = '▶ CREAR MI CUENTA';
    setTimeout(() => { window.location.href = 'perfil.html'; }, 4000);
  });

  $('#btn-go-profile')?.addEventListener('click', () => { window.location.href = 'perfil.html'; });

  /* Social */
  ['btn-google','btn-discord'].forEach(id => {
    $(`#${id}`)?.addEventListener('click', () => toast('⚡ Próximamente disponible', 'info'));
  });
});