/* =========================================================
   Moonveil Portal — Dragon Hunter (JS)
   - Sistema simple de checkpoints activables
   - 20 dragones con progreso visual
   - Animaciones y efectos épicos
   ========================================================= */

const $ = (q, ctx = document) => ctx.querySelector(q);
const $$ = (q, ctx = document) => Array.from(ctx.querySelectorAll(q));

/* =========================================================
   CONFIGURACIÓN DE LOS 20 DRAGONES
   - Cambia "active: true" para marcar como completado
   - Cambia "active: false" para marcar como no completado
   ========================================================= */
const dragonProgress = [
  { id: 1, active: true, title: 'Primer Encuentro', desc: 'Tu primer dragón derrotado. El inicio de la leyenda.' },
  { id: 2, active: true, title: 'Doble Victoria', desc: 'Dos dragones caídos. Tu confianza crece.' },
  { id: 3, active: true, title: 'Cazador Prometedor', desc: 'Tres victorias. Ya no hay vuelta atrás.' },
  { id: 4, active: false, title: 'Dominio del End', desc: 'Cuatro dragones. El End es tu hogar ahora.' },
  { id: 5, active: false, title: 'Veterano', desc: 'Cinco dragones. Has visto cosas que otros solo imaginan.' },
  { id: 6, active: false, title: 'Media Docena', desc: 'Seis victorias épicas. Tu nombre resuena en el End.' },
  { id: 7, active: false, title: 'Suerte del Siete', desc: 'Siete dragones caídos. La fortuna te favorece.' },
  { id: 8, active: false, title: 'Octava Maravilla', desc: 'Ocho dragones derrotados. Eres una maravilla.' },
  { id: 9, active: false, title: 'Novena Sinfonía', desc: 'Nueve victorias. Tu historia es épica.' },
  { id: 10, active: false, title: 'Decena Perfecta', desc: 'Diez dragones. Mitad del camino completado.' },
  { id: 11, active: false, title: 'Once Estrellas', desc: 'Once victorias brillan en tu historial.' },
  { id: 12, active: false, title: 'Docena del Destino', desc: 'Doce dragones. El destino te ha elegido.' },
  { id: 13, active: false, title: 'Trece Fortunado', desc: 'Trece victorias. La suerte está de tu lado.' },
  { id: 14, active: false, title: 'Catorce Proezas', desc: 'Catorce dragones. Tus proezas son legendarias.' },
  { id: 15, active: false, title: 'Quince Glorias', desc: 'Quince victorias gloriosas. Tres cuartos completados.' },
  { id: 16, active: false, title: 'Dieciséis Hazañas', desc: 'Dieciséis hazañas épicas. El final se acerca.' },
  { id: 17, active: false, title: 'Diecisiete Triunfos', desc: 'Diecisiete triunfos. Solo tres más para la gloria.' },
  { id: 18, active: false, title: 'Dieciocho Conquistas', desc: 'Dieciocho conquistas. La meta está cerca.' },
  { id: 19, active: false, title: 'Diecinueve Victorias', desc: 'Diecinueve victorias. Un dragón más para la eternidad.' },
  { id: 20, active: false, title: 'DOMADOR SUPREMO', desc: '¡VEINTE DRAGONES! ¡Has alcanzado la gloria absoluta! Tu nombre vivirá por siempre.' }
];

/* =========================================================
   Navbar responsive
   ========================================================= */
const navToggle = $('#navToggle');
const navLinks = $('#navLinks');

navToggle?.addEventListener('click', (e) => {
  e.stopPropagation();
  navLinks.classList.toggle('open');
});

document.addEventListener('click', (e) => {
  if (!navToggle?.contains(e.target) && !navLinks?.contains(e.target)) {
    navLinks?.classList.remove('open');
  }
});

/* =========================================================
   HUD Bars
   ========================================================= */
(function setHudBars() {
  $$('.hud-bar').forEach(b => {
    const v = +b.dataset.val || 50;
    b.style.setProperty('--v', v);
  });
})();

/* =========================================================
   Partículas de fondo
   ========================================================= */
(function particles() {
  const c = $('#bgParticles');
  if (!c) return;

  const ctx = c.getContext('2d');
  const dpi = Math.max(1, devicePixelRatio || 1);
  let w, h, parts;

  const init = () => {
    w = c.width = innerWidth * dpi;
    h = c.height = innerHeight * dpi;
    parts = new Array(100).fill(0).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: (1 + Math.random() * 2.5) * dpi,
      s: 0.2 + Math.random() * 0.8,
      a: 0.15 + Math.random() * 0.4,
      hue: 280 + Math.random() * 40 // Púrpura/magenta
    }));
  };

  const tick = () => {
    ctx.clearRect(0, 0, w, h);
    parts.forEach(p => {
      p.y += p.s;
      p.x += Math.sin(p.y * 0.002) * 0.4;
      if (p.y > h) {
        p.y = -10;
        p.x = Math.random() * w;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 80%, 65%, ${p.a})`;
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
   Actualizar Estadísticas
   ========================================================= */
function updateStats() {
  const completed = dragonProgress.filter(d => d.active).length;
  const total = dragonProgress.length;
  const percent = Math.round((completed / total) * 100);
  const remaining = total - completed;

  $('#dragonCount').textContent = completed;
  $('#progressPercent').textContent = percent + '%';
  $('#remainingCount').textContent = remaining;

  // Actualizar barra de progreso global
  const bar = $('#globalProgressBar');
  bar.style.width = percent + '%';
  bar.style.setProperty('--progress-width', percent + '%');

  // Actualizar logros
  updateAchievements(completed);
}

/* =========================================================
   Actualizar Logros
   ========================================================= */
function updateAchievements(count) {
  $$('.achievement-card').forEach(card => {
    const unlock = +card.dataset.unlock;
    if (count >= unlock) {
      card.classList.add('unlocked');
      card.classList.remove('locked');
    } else {
      card.classList.remove('unlocked');
      card.classList.add('locked');
    }
  });
}

/* =========================================================
   Generar Línea de Tiempo de 20 Dragones
   ========================================================= */
function generateTimeline() {
  const timeline = $('#dragonTimeline');
  if (!timeline) return;

  timeline.innerHTML = '';

  dragonProgress.forEach((dragon, index) => {
    const checkpoint = document.createElement('div');
    checkpoint.className = 'checkpoint' + (dragon.active ? ' active' : '');
    checkpoint.style.animationDelay = `${index * 0.05}s`;
    checkpoint.dataset.id = dragon.id;

    // Alternar contenido a izquierda/derecha
    const isEven = index % 2 === 0;

    checkpoint.innerHTML = `
      <div class="checkpoint-content">
        <div class="checkpoint-number">Dragón #${dragon.id}</div>
        <h3 class="checkpoint-title">${dragon.title}</h3>
        <p class="checkpoint-desc">${dragon.desc}</p>
      </div>
      
      <div class="checkpoint-icon ${dragon.active ? '' : 'locked'}">
        ${dragon.active ? '🐉' : '🔒'}
      </div>
      
      <div class="checkpoint-content">
        ${dragon.active ? 
          `<div class="checkpoint-status" style="color: var(--success); font-weight: 600;">✓ Completado</div>` :
          `<div class="checkpoint-status" style="color: var(--muted); font-weight: 600;">⏳ Pendiente</div>`
        }
      </div>
    `;

    // Click para ver detalles
    checkpoint.addEventListener('click', () => {
      showDetails(dragon);
    });

    timeline.appendChild(checkpoint);
  });

  updateStats();
}

/* =========================================================
   Panel de Detalles
   ========================================================= */
const detailsPanel = $('#detailsPanel');
const panelContent = $('#panelContent');
const closeDetails = $('#closeDetails');

function showDetails(dragon) {
  if (!detailsPanel || !panelContent) return;

  const statusHTML = dragon.active ? 
    `<div style="color: var(--success); font-weight: 700; font-size: 1.2rem; margin-bottom: 15px;">✓ Dragón Derrotado</div>` :
    `<div style="color: var(--muted); font-weight: 700; font-size: 1.2rem; margin-bottom: 15px;">🔒 Dragón Pendiente</div>`;

  panelContent.innerHTML = `
    <div style="text-align: center; margin-bottom: 25px;">
      <div style="font-size: 4rem; margin-bottom: 15px; filter: drop-shadow(0 0 20px rgba(217,70,239,.6));">
        ${dragon.active ? '🐉' : '🔒'}
      </div>
      <div style="font-family: 'Cinzel', serif; font-size: 0.9rem; color: var(--muted); margin-bottom: 8px;">
        DRAGÓN #${dragon.id}
      </div>
      <h3 style="font-family: 'Cinzel', serif; font-size: 1.8rem; margin: 0 0 15px; background: linear-gradient(135deg, #d946ef, #fbbf24); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
        ${dragon.title}
      </h3>
      ${statusHTML}
    </div>

    <div style="background: rgba(217,70,239,.1); border: 1px solid rgba(217,70,239,.2); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
      <h4 style="margin: 0 0 10px; color: var(--dragon-purple);">📜 Descripción</h4>
      <p style="margin: 0; line-height: 1.6; color: var(--text);">${dragon.desc}</p>
    </div>

    ${dragon.active ? `
      <div style="background: rgba(16,185,129,.1); border: 1px solid rgba(16,185,129,.2); border-radius: 12px; padding: 20px;">
        <h4 style="margin: 0 0 10px; color: var(--success);">🏆 Recompensas Obtenidas</h4>
        <ul style="margin: 0; padding-left: 20px; line-height: 1.8; color: var(--text);">
          <li>+1000 XP</li>
          <li>Huevo de Dragón</li>
          <li>Logro Desbloqueado</li>
          <li>Gloria Eterna</li>
        </ul>
      </div>
    ` : `
      <div style="background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.2); border-radius: 12px; padding: 20px;">
        <h4 style="margin: 0 0 10px; color: var(--danger);">⚔️ Requisitos</h4>
        <p style="margin: 0; line-height: 1.6; color: var(--muted);">
          Debes completar los dragones anteriores antes de desbloquear este desafío.
        </p>
      </div>
    `}
  `;

  detailsPanel.classList.add('open');
}

closeDetails?.addEventListener('click', () => {
  detailsPanel?.classList.remove('open');
});

// Cerrar panel al hacer clic fuera
document.addEventListener('click', (e) => {
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
  toastEl._id = setTimeout(() => toastEl.classList.remove('show'), 2500);
}

/* =========================================================
   Música de fondo
   ========================================================= */
window.toggleMusic = function () {
  const audio = $('#bg-music');
  const musicButton = $('.floating-music');

  if (audio && musicButton) {
    if (audio.paused) {
      audio.play().then(() => {
        musicButton.classList.add('active');
        localStorage.setItem('dragonMusic', 'on');
        toast('🎵 Música activada');
      }).catch(err => {
        console.warn('No se pudo reproducir la música:', err);
        toast('⚠️ Error al reproducir música');
      });
    } else {
      audio.pause();
      musicButton.classList.remove('active');
      localStorage.setItem('dragonMusic', 'off');
      toast('🔇 Música desactivada');
    }
  }
};

/* =========================================================
   Inicialización
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  // Generar timeline
  generateTimeline();

  // Restaurar música
  const audio = $('#bg-music');
  const musicButton = $('.floating-music');
  const musicState = localStorage.getItem('dragonMusic');

  if (audio && musicButton && musicState === 'on') {
    audio.play().then(() => {
      musicButton.classList.add('active');
    }).catch(() => {
      console.log('Esperando interacción del usuario para reproducir.');
    });
  }

  // Mensaje de bienvenida
  setTimeout(() => {
    const completed = dragonProgress.filter(d => d.active).length;
    if (completed === 0) {
      toast('🐉 ¡Bienvenido, Cazador! Derrota 20 dragones para la gloria.');
    } else if (completed === 20) {
      toast('👑 ¡LEYENDA ABSOLUTA! Has completado todos los dragones.');
    } else {
      toast(`⚔️ Progreso: ${completed}/20 dragones derrotados`);
    }
  }, 1000);

  // Easter egg: Click en el título
  $('.dragon-text')?.addEventListener('click', () => {
    const emoji = ['🐉', '🔥', '⚔️', '👑', '💎', '✨'];
    const random = emoji[Math.floor(Math.random() * emoji.length)];
    toast(`${random} ¡Que la fuerza del dragón te acompañe! ${random}`);
  });
});

/* =========================================================
   Scroll reveal para checkpoints
   ========================================================= */
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'none';
    }
  });
}, observerOptions);

window.addEventListener('load', () => {
  $$('.checkpoint').forEach(el => observer.observe(el));
});