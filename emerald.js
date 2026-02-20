/* =========================================================
   Moonveil Portal — Emerald Collector (JS)

   ╔══════════════════════════════════════════════════════╗
   ║           EDITA SOLO ESTA SECCIÓN                    ║
   ║                                                      ║
   ║  Cambia "active: true"  → stack recaudado            ║
   ║  Cambia "active: false" → stack pendiente            ║
   ║                                                      ║
   ║  Cada stack = 64 esmeraldas                          ║
   ║  Total meta = 30 stacks = 1920 esmeraldas            ║
   ╚══════════════════════════════════════════════════════╝
   ========================================================= */

const stackProgress = [
  { id:  1, active: false,  title: 'Primer Stack',         desc: 'Las primeras 64 esmeraldas. El inicio de la fortuna.' },
  { id:  2, active: false,  title: 'Segunda Tanda',        desc: '128 esmeraldas. Tu bolsillo empieza a pesar.' },
  { id:  3, active: false,  title: 'Racha Inicial',        desc: '192 esmeraldas. Los villagers ya te conocen.' },
  { id:  4, active: false, title: 'Cuarta Entrega',       desc: '256 esmeraldas. Un cuarto de stack-milestone.' },
  { id:  5, active: false, title: 'Quinta Victoria',      desc: '320 esmeraldas. Primera recompensa en el horizonte.' },
  { id:  6, active: false, title: 'Sexta Cosecha',        desc: '384 esmeraldas. Los campos de trigo te lo agradecen.' },
  { id:  7, active: false, title: 'Séptimo Cargamento',   desc: '448 esmeraldas. Las carretas no dan abasto.' },
  { id:  8, active: false, title: 'Octava Oleada',        desc: '512 esmeraldas. Un cuarto del camino completado.' },
  { id:  9, active: false, title: 'Novena Remesa',        desc: '576 esmeraldas. El comercio fluye sin parar.' },
  { id: 10, active: false, title: 'Décimo Hito',          desc: '640 esmeraldas. Diez stacks. Eres un mercader respetado.' },
  { id: 11, active: false, title: 'Once en Racha',        desc: '704 esmeraldas. Tu fama se extiende por el servidor.' },
  { id: 12, active: false, title: 'Docena Completa',      desc: '768 esmeraldas. Doce stacks sólidos en el cofre.' },
  { id: 13, active: false, title: 'Trece Fortunado',      desc: '832 esmeraldas. Ni el trece te detiene.' },
  { id: 14, active: false, title: 'Catorce Proezas',      desc: '896 esmeraldas. Casi la mitad. No pares ahora.' },
  { id: 15, active: false, title: '¡MITAD DE LA META!',   desc: '960 esmeraldas. 15 stacks. Punto de no retorno.' },
  { id: 16, active: false, title: 'Más Allá del Límite',  desc: '1024 esmeraldas. Has superado la barrera de los 1000.' },
  { id: 17, active: false, title: 'Decimoséptima Ola',    desc: '1088 esmeraldas. El End tiembla ante tu fortuna.' },
  { id: 18, active: false, title: 'Dieciocho de Oro',     desc: '1152 esmeraldas. El oro palidece ante ti.' },
  { id: 19, active: false, title: 'Diecinueve Glorias',   desc: '1216 esmeraldas. La gloria ya casi se toca.' },
  { id: 20, active: false, title: 'Veinte Perfectos',     desc: '1280 esmeraldas. Dos tercios de la meta. Legendary.' },
  { id: 21, active: false, title: 'Vigésimo Primero',     desc: '1344 esmeraldas. Cada stack más vale más que el anterior.' },
  { id: 22, active: false, title: 'Veintidós Rondas',     desc: '1408 esmeraldas. Solo 8 stacks para la gloria.' },
  { id: 23, active: false, title: 'Veintitrés Épico',     desc: '1472 esmeraldas. Los dioses del server te miran.' },
  { id: 24, active: false, title: 'Veinticuatro Cumbres', desc: '1536 esmeraldas. Cuatro quintos del camino cubiertos.' },
  { id: 25, active: false, title: 'Vigésimo Quinto',      desc: '1600 esmeraldas. 25 stacks. Solo 5 más.' },
  { id: 26, active: false, title: 'Penúltima Recta',      desc: '1664 esmeraldas. Cuatro stacks para la eternidad.' },
  { id: 27, active: false, title: 'Tres para el Final',   desc: '1728 esmeraldas. Tan cerca que se puede oler.' },
  { id: 28, active: false, title: 'Ante Penúltimo',       desc: '1792 esmeraldas. Dos stacks. Respira y empuja.' },
  { id: 29, active: false, title: 'El Último Paso',       desc: '1856 esmeraldas. Un solo stack para la leyenda.' },
  { id: 30, active: false, title: '¡META ALCANZADA!',     desc: '¡1920 ESMERALDAS! ¡30 STACKS! ¡COLECTOR SUPREMO!' }
];

/* =========================================================
   RECOMPENSAS
   Se desbloquean automáticamente según los stacks activos.
   "unlock" = cantidad de stacks necesarios para desbloquear.
   ========================================================= */
const rewards = [
  {
    icon: '🌱',
    title: 'Mercader Novato',
    desc: 'Completa 5 stacks (320 esmeraldas)',
    unlock: 5
  },
  {
    icon: '💚',
    title: 'Guardián Verde',
    desc: '¡Mitad completada! 15 stacks (960 esmeraldas)',
    unlock: 15
  },
  {
    icon: '👑',
    title: 'Señor del Comercio',
    desc: 'Alcanza 25 stacks (1600 esmeraldas)',
    unlock: 25
  },
  {
    icon: '🏆',
    title: '¡COLECTOR SUPREMO!',
    desc: '¡30 stacks! ¡1920 esmeraldas! ¡Gloria absoluta!',
    unlock: 30
  }
];

/* =========================================================
   Utilidades
   ========================================================= */
const $ = (q, ctx = document) => ctx.querySelector(q);
const $$ = (q, ctx = document) => Array.from(ctx.querySelectorAll(q));

/* =========================================================
   Navbar responsive
   ========================================================= */
const navToggle = $('#navToggle');
const navLinks  = $('#navLinks');

navToggle?.addEventListener('click', e => {
  e.stopPropagation();
  navLinks.classList.toggle('open');
});
document.addEventListener('click', e => {
  if (!navToggle?.contains(e.target) && !navLinks?.contains(e.target)) {
    navLinks?.classList.remove('open');
  }
});

/* =========================================================
   HUD Bars
   ========================================================= */
(function setHudBars() {
  $$('.hud-bar').forEach(b => {
    b.style.setProperty('--v', +b.dataset.val || 50);
  });
})();

/* =========================================================
   Partículas de fondo (verdes)
   ========================================================= */
(function particles() {
  const c = $('#bgParticles');
  if (!c) return;
  const ctx = c.getContext('2d');
  const dpi = Math.max(1, devicePixelRatio || 1);
  let w, h, parts;

  const init = () => {
    w = c.width  = innerWidth  * dpi;
    h = c.height = innerHeight * dpi;
    parts = Array.from({ length: 100 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: (1 + Math.random() * 2.5) * dpi,
      s: 0.2 + Math.random() * 0.8,
      a: 0.1 + Math.random() * 0.35,
      hue: 140 + Math.random() * 30
    }));
  };

  const tick = () => {
    ctx.clearRect(0, 0, w, h);
    parts.forEach(p => {
      p.y += p.s;
      p.x += Math.sin(p.y * 0.002) * 0.4;
      if (p.y > h) { p.y = -10; p.x = Math.random() * w; }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 75%, 60%, ${p.a})`;
      ctx.fill();
    });
    requestAnimationFrame(tick);
  };

  init();
  tick();
  addEventListener('resize', init);
})();

/* =========================================================
   Parallax
   ========================================================= */
(function parallax() {
  const layers = $$('.layer');
  if (!layers.length) return;
  const k = [0, 0.03, 0.06, 0.1];
  const onScroll = () => {
    const y = scrollY || 0;
    layers.forEach((el, i) => {
      el.style.transform = `translateY(${y * k[i]}px)`;
    });
  };
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });
})();

/* =========================================================
   Actualizar estadísticas
   ========================================================= */
function updateStats() {
  const completed  = stackProgress.filter(s => s.active).length;
  const total      = stackProgress.length;
  const emeralds   = completed * 64;
  const percent    = Math.round((completed / total) * 100);
  const remaining  = total - completed;

  $('#stacksCount').textContent    = completed;
  $('#emeraldsCount').textContent  = emeralds.toLocaleString();
  $('#progressPercent').textContent = percent + '%';
  $('#remainingStacks').textContent = remaining;

  // Barra de progreso
  const bar = $('#globalProgressBar');
  bar.style.width = percent + '%';

  // Desbloquear logros
  updateAchievements(completed);
}

/* =========================================================
   Actualizar recompensas
   ========================================================= */
function updateAchievements(completedStacks) {
  $$('.achievement-card').forEach(card => {
    const unlock = +card.dataset.unlock;
    const isUnlocked = completedStacks >= unlock;
    card.classList.toggle('unlocked', isUnlocked);
    card.classList.toggle('locked',   !isUnlocked);
  });
}

/* =========================================================
   Generar recompensas en el DOM
   ========================================================= */
function buildAchievements() {
  const grid = $('#achievementsGrid');
  if (!grid) return;
  grid.innerHTML = '';

  rewards.forEach(r => {
    const card = document.createElement('div');
    card.className = 'achievement-card locked';
    card.dataset.unlock = r.unlock;
    card.innerHTML = `
      <div class="achievement-icon">${r.icon}</div>
      <div class="achievement-info">
        <h4>${r.title}</h4>
        <p>${r.desc}</p>
      </div>
      <div class="achievement-lock">🔒</div>
    `;
    grid.appendChild(card);
  });
}

/* =========================================================
   Generar línea de tiempo de 30 stacks
   ========================================================= */
function generateTimeline() {
  const timeline = $('#stacksTimeline');
  if (!timeline) return;
  timeline.innerHTML = '';

  stackProgress.forEach((stack, index) => {
    const checkpoint = document.createElement('div');
    checkpoint.className = 'checkpoint' + (stack.active ? ' active' : '');
    checkpoint.style.animationDelay = `${index * 0.04}s`;
    checkpoint.dataset.id = stack.id;

    checkpoint.innerHTML = `
      <div class="checkpoint-content">
        <div class="checkpoint-number">Stack #${stack.id} · ${stack.id * 64} esm.</div>
        <h3 class="checkpoint-title">${stack.title}</h3>
        <p class="checkpoint-desc">${stack.desc}</p>
      </div>

      <div class="checkpoint-icon ${stack.active ? '' : 'locked'}">
        ${stack.active ? '💚' : '🔒'}
      </div>

      <div class="checkpoint-content">
        ${stack.active
          ? `<div class="checkpoint-status" style="color:var(--success);font-weight:700;font-size:1.1rem;">✓ Recaudado</div>
             <div style="margin-top:8px;color:var(--muted);font-size:.9rem;">+64 esmeraldas</div>`
          : `<div class="checkpoint-status" style="color:var(--muted);font-weight:600;">⏳ Pendiente</div>
             <div style="margin-top:8px;color:var(--muted);font-size:.9rem;opacity:.6;">${64 - (stack.id % 64 || 64)} faltan para este</div>`
        }
      </div>
    `;

    checkpoint.addEventListener('click', () => showDetails(stack));
    timeline.appendChild(checkpoint);
  });

  updateStats();
}

/* =========================================================
   Panel de detalles
   ========================================================= */
const detailsPanel = $('#detailsPanel');
const panelContent = $('#panelContent');
const closeDetails = $('#closeDetails');

function showDetails(stack) {
  if (!detailsPanel || !panelContent) return;

  const emeralds   = stack.id * 64;
  const statusHTML = stack.active
    ? `<div style="color:var(--success);font-weight:700;font-size:1.2rem;margin-bottom:15px;">✓ Stack Recaudado</div>`
    : `<div style="color:var(--muted);font-weight:700;font-size:1.2rem;margin-bottom:15px;">🔒 Stack Pendiente</div>`;

  // Ver si desbloquea alguna recompensa
  const rewardUnlocked = rewards.find(r => r.unlock === stack.id);

  panelContent.innerHTML = `
    <div style="text-align:center;margin-bottom:25px;">
      <div style="font-size:4rem;margin-bottom:15px;filter:drop-shadow(0 0 20px rgba(16,185,129,.6));">
        ${stack.active ? '💚' : '🔒'}
      </div>
      <div style="font-family:'Cinzel',serif;font-size:.9rem;color:var(--muted);margin-bottom:8px;">
        STACK #${stack.id} DE 30
      </div>
      <h3 style="font-family:'Cinzel',serif;font-size:1.8rem;margin:0 0 15px;
        background:linear-gradient(135deg,#10b981,#fbbf24);-webkit-background-clip:text;
        -webkit-text-fill-color:transparent;background-clip:text;">
        ${stack.title}
      </h3>
      ${statusHTML}
    </div>

    <div style="background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.2);border-radius:12px;padding:20px;margin-bottom:16px;">
      <h4 style="margin:0 0 10px;color:var(--em-green);">📦 Información del Stack</h4>
      <p style="margin:0 0 8px;color:var(--text);line-height:1.6;">${stack.desc}</p>
      <p style="margin:0;color:var(--muted);font-size:.9rem;">
        Esmeraldas acumuladas al llegar aquí: <strong style="color:var(--em-bright)">${emeralds.toLocaleString()}</strong>
      </p>
    </div>

    ${rewardUnlocked ? `
    <div style="background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.25);border-radius:12px;padding:20px;margin-bottom:16px;">
      <h4 style="margin:0 0 10px;color:var(--em-gold);">🏆 ¡Este stack desbloquea una recompensa!</h4>
      <p style="margin:0;font-weight:700;color:var(--text);">${rewardUnlocked.icon} ${rewardUnlocked.title}</p>
    </div>` : ''}

    ${stack.active ? `
    <div style="background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.2);border-radius:12px;padding:20px;">
      <h4 style="margin:0 0 10px;color:var(--success);">💰 Contenido del Stack</h4>
      <ul style="margin:0;padding-left:20px;line-height:1.8;color:var(--text);">
        <li>64 Esmeraldas recaudadas</li>
        <li>Stack #${stack.id} completado ✓</li>
        <li>Progreso: ${Math.round((stack.id / 30) * 100)}% de la meta</li>
      </ul>
    </div>` : `
    <div style="background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:12px;padding:20px;">
      <h4 style="margin:0 0 10px;color:var(--danger);">⚔️ Pendiente</h4>
      <p style="margin:0;line-height:1.6;color:var(--muted);">
        Cuando tengas este stack, cambia <code style="background:rgba(16,185,129,.15);padding:2px 6px;border-radius:4px;color:var(--em-bright)">active: false</code>
        a <code style="background:rgba(16,185,129,.15);padding:2px 6px;border-radius:4px;color:var(--em-bright)">active: true</code> en el archivo JS.
      </p>
    </div>`}
  `;

  detailsPanel.classList.add('open');
}

closeDetails?.addEventListener('click', () => {
  detailsPanel?.classList.remove('open');
});

document.addEventListener('click', e => {
  if (detailsPanel?.classList.contains('open') &&
      !detailsPanel.contains(e.target) &&
      !e.target.closest('.checkpoint')) {
    detailsPanel.classList.remove('open');
  }
});

/* =========================================================
   Toast
   ========================================================= */
const toastEl = $('#toast');
function toast(msg) {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastEl._id);
  toastEl._id = setTimeout(() => toastEl.classList.remove('show'), 2800);
}

/* =========================================================
   Música
   ========================================================= */
window.toggleMusic = function () {
  const audio = $('#bg-music');
  const btn   = $('.floating-music');
  if (!audio || !btn) return;
  if (audio.paused) {
    audio.play().then(() => {
      btn.classList.add('active');
      localStorage.setItem('emMusic', 'on');
      toast('🎵 Música activada');
    }).catch(() => toast('⚠️ Error al reproducir música'));
  } else {
    audio.pause();
    btn.classList.remove('active');
    localStorage.setItem('emMusic', 'off');
    toast('🔇 Música desactivada');
  }
};

/* =========================================================
   Inicialización
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  buildAchievements();
  generateTimeline();

  // Música
  const audio = $('#bg-music');
  const btn   = $('.floating-music');
  if (audio && btn && localStorage.getItem('emMusic') === 'on') {
    audio.play().then(() => btn.classList.add('active')).catch(() => {});
  }

  // Mensaje de bienvenida
  setTimeout(() => {
    const completed = stackProgress.filter(s => s.active).length;
    const emeralds  = completed * 64;
    if (completed === 0) {
      toast('💚 ¡Bienvenido! Meta: 30 stacks (1920 esmeraldas).');
    } else if (completed === 30) {
      toast('👑 ¡META COMPLETA! 1920/1920 esmeraldas. ¡LEYENDA!');
    } else {
      toast(`💚 Progreso: ${completed}/30 stacks · ${emeralds.toLocaleString()}/1920 esmeraldas`);
    }
  }, 1000);

  // Easter egg
  $('.emerald-text')?.addEventListener('click', () => {
    const msgs = ['💚 ¡Cada esmeralda vale!', '🏪 Los villagers te respetan', '💎 Mercader legendario', '🌿 La fortuna te acompaña'];
    toast(msgs[Math.floor(Math.random() * msgs.length)]);
  });
});

/* =========================================================
   Scroll reveal
   ========================================================= */
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'none';
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -100px 0px' });

window.addEventListener('load', () => {
  $$('.checkpoint').forEach(el => observer.observe(el));
});