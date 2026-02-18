/* =========================================================
   Moonveil Portal — JS: Inicio / Bienvenida
   CON EFECTOS ESPECIALES COMPLETOS PARA TODOS LOS ENLACES
   ========================================================= */

const $ = (q, ctx = document) => ctx.querySelector(q);
const $$ = (q, ctx = document) => Array.from(ctx.querySelectorAll(q));

/* ---------- Navbar responsive ---------- */
const navToggle = $('#navToggle');
const navLinks = $('#navLinks');
if (navToggle) {
  navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
}

/* ---------- Año footer ---------- */
const yEl = $('#y');
if (yEl) yEl.textContent = new Date().getFullYear();

/* ---------- HUD barras ---------- */
const setHudBars = () => {
  $$('.hud-bar').forEach(bar => {
    const v = +bar.dataset.val || 50;
    bar.style.setProperty('--v', v);
  });
};
setHudBars();

/* ========== SISTEMA DE COUNTDOWN MEJORADO ========== */
function getDetailedCountdown(targetDays) {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(now.getDate() + targetDays);
  
  const diff = endDate - now;
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return { days, hours, minutes, seconds, total: diff };
}

function formatCountdown(countdown, short = false) {
  const { days, hours, minutes, seconds } = countdown;
  
  if (short) {
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m ${seconds}s`;
  }
  
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function getDaysInCurrentMonth() {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysLeft = lastDay.getDate() - now.getDate();
  return daysLeft;
}

/* ========== EFECTOS ESPECIALES PARA CADA ENLACE ========== */
(function navSpecialEffects() {
  
  // 1. VALENTINE - Corazones flotantes
  const valentineLink = $('[data-effect="valentine"]');
  if (valentineLink) {
    const targetDays = parseInt(valentineLink.dataset.days) || 2;
    
    function updateValentine() {
      const countdown = getDetailedCountdown(targetDays);
      valentineLink.setAttribute('data-days-left', `♥ ${formatCountdown(countdown, true)}`);
    }
    updateValentine();
    setInterval(updateValentine, 1000);
    
    setInterval(() => {
      if (!valentineLink.matches(':hover')) return;
      const heart = document.createElement('span');
      heart.textContent = ['♥', '💕', '💖'][Math.floor(Math.random() * 3)];
      heart.style.cssText = `
        position: fixed; color: #ff69b4; font-size: ${Math.random() * 10 + 10}px;
        pointer-events: none; z-index: 9999; animation: float-up 2s ease-out forwards; opacity: 0.8;
      `;
      const rect = valentineLink.getBoundingClientRect();
      heart.style.left = rect.left + Math.random() * rect.width + 'px';
      heart.style.top = rect.bottom + 'px';
      document.body.appendChild(heart);
      setTimeout(() => heart.remove(), 2000);
    }, 300);
    
    if (!$('#valentine-float-style')) {
      const style = document.createElement('style');
      style.id = 'valentine-float-style';
      style.textContent = `
        @keyframes float-up {
          0% { transform: translateY(0) rotate(0deg); opacity: 0.8; }
          100% { transform: translateY(-80px) rotate(20deg); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // 2. PASS - Contador de días con planetas
  const passLink = $('[data-effect="planet"]');
  if (passLink) {
    const targetDays = parseInt(passLink.dataset.days) || 30;
    
    function updatePass() {
      const countdown = getDetailedCountdown(targetDays);
      passLink.setAttribute('data-days-left', formatCountdown(countdown, true));
    }
    updatePass();
    setInterval(updatePass, 1000);
  }

  // 3. BANK - Estrellitas flotantes
  const bankLink = $('[data-effect="sparkle"]');
  if (bankLink) {
    setInterval(() => {
      if (!bankLink.matches(':hover')) return;
      const sparkle = document.createElement('span');
      sparkle.textContent = ['✦', '✧', '✨', '💰', '💵'][Math.floor(Math.random() * 5)];
      sparkle.style.cssText = `
        position: fixed; color: #ffd700; font-size: ${Math.random() * 8 + 8}px;
        pointer-events: none; z-index: 9999; animation: sparkle-burst 1.5s ease-out forwards; opacity: 1;
      `;
      const rect = bankLink.getBoundingClientRect();
      sparkle.style.left = rect.left + Math.random() * rect.width + 'px';
      sparkle.style.top = rect.top + Math.random() * rect.height + 'px';
      document.body.appendChild(sparkle);
      setTimeout(() => sparkle.remove(), 1500);
    }, 200);
    
    if (!$('#sparkle-burst-style')) {
      const style = document.createElement('style');
      style.id = 'sparkle-burst-style';
      style.textContent = `
        @keyframes sparkle-burst {
          0% { transform: scale(0) rotate(0deg); opacity: 1; }
          50% { opacity: 1; }
          100% { transform: scale(1.5) rotate(180deg); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // 4. SAND - Texto de terminal cambiante
  const codeLink = $('[data-effect="code"]');
  if (codeLink) {
    const commands = [
      'sudo mkdir', 'npm install', 'git commit', 'docker run', 'apt-get',
      'chmod +x', 'ls -la', './compile', 'make build', 'rm -rf'
    ];
    let cmdIndex = 0;
    const originalText = codeLink.textContent;
    
    setInterval(() => {
      if (codeLink.matches(':hover')) {
        codeLink.textContent = commands[cmdIndex];
        cmdIndex = (cmdIndex + 1) % commands.length;
      } else {
        codeLink.textContent = originalText;
        cmdIndex = 0;
      }
    }, 800);
  }

  // 5. PERFILES - Avatares flotantes
  const profilesLink = $('[data-effect="profiles"]');
  if (profilesLink) {
    setInterval(() => {
      if (!profilesLink.matches(':hover')) return;
      const avatar = document.createElement('span');
      avatar.textContent = ['👤', '👥', '🧑', '👨', '👩'][Math.floor(Math.random() * 5)];
      avatar.style.cssText = `
        position: fixed; font-size: ${Math.random() * 8 + 10}px;
        pointer-events: none; z-index: 9999; animation: profiles-float 2s ease-out forwards; opacity: 0.8;
      `;
      const rect = profilesLink.getBoundingClientRect();
      avatar.style.left = rect.left + Math.random() * rect.width + 'px';
      avatar.style.top = rect.top + 'px';
      document.body.appendChild(avatar);
      setTimeout(() => avatar.remove(), 2000);
    }, 400);
    
    if (!$('#profiles-float-style')) {
      const style = document.createElement('style');
      style.id = 'profiles-float-style';
      style.textContent = `
        @keyframes profiles-float {
          0% { transform: translateY(0) scale(1); opacity: 0.8; }
          100% { transform: translateY(-60px) scale(0.5); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // 6. CALENDAR - Contador de días del mes
  const calendarLink = $('[data-effect="calendar"]');
  if (calendarLink) {
    function updateCalendar() {
      const daysLeft = getDaysInCurrentMonth();
      calendarLink.setAttribute('data-days-month', `${daysLeft} días restantes`);
    }
    updateCalendar();
    setInterval(updateCalendar, 3600000); // Actualizar cada hora
  }

  // 7. EVENTOS - Animales con countdown
  const eventsLink = $('[data-effect="events"]');
  if (eventsLink) {
    const targetDays = parseInt(eventsLink.dataset.days) || 44;
    
    function updateEvents() {
      const countdown = getDetailedCountdown(targetDays);
      eventsLink.setAttribute('data-countdown', formatCountdown(countdown, true));
    }
    updateEvents();
    setInterval(updateEvents, 1000);
    
    setInterval(() => {
      if (!eventsLink.matches(':hover')) return;
      const animal = document.createElement('span');
      animal.textContent = ['🦊', '🐺', '🦝', '🦌', '🐻'][Math.floor(Math.random() * 5)];
      animal.style.cssText = `
        position: fixed; font-size: ${Math.random() * 8 + 12}px;
        pointer-events: none; z-index: 9999; animation: animals-run 2s ease-out forwards;
      `;
      const rect = eventsLink.getBoundingClientRect();
      animal.style.left = rect.left + 'px';
      animal.style.top = rect.bottom + 'px';
      document.body.appendChild(animal);
      setTimeout(() => animal.remove(), 2000);
    }, 600);
    
    if (!$('#animals-run-style')) {
      const style = document.createElement('style');
      style.id = 'animals-run-style';
      style.textContent = `
        @keyframes animals-run {
          0% { transform: translateX(0) translateY(0); opacity: 1; }
          100% { transform: translateX(50px) translateY(-30px); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // 8. RULETA - Contador con giro
  const rouletteLink = $('[data-effect="roulette"]');
  if (rouletteLink) {
    const targetDays = parseInt(rouletteLink.dataset.days) || 44;
    
    function updateRoulette() {
      const countdown = getDetailedCountdown(targetDays);
      rouletteLink.setAttribute('data-countdown', formatCountdown(countdown, true));
    }
    updateRoulette();
    setInterval(updateRoulette, 1000);
  }

  // 9. FORO - Burbujas de comentarios
  const forumLink = $('[data-effect="forum"]');
  if (forumLink) {
    setInterval(() => {
      if (!forumLink.matches(':hover')) return;
      const bubble = document.createElement('span');
      bubble.textContent = ['💬', '💭', '🗨️'][Math.floor(Math.random() * 3)];
      bubble.style.cssText = `
        position: fixed; font-size: ${Math.random() * 8 + 10}px;
        pointer-events: none; z-index: 9999; animation: bubble-float 2s ease-out forwards;
      `;
      const rect = forumLink.getBoundingClientRect();
      bubble.style.left = rect.right + 'px';
      bubble.style.top = rect.top + Math.random() * rect.height + 'px';
      document.body.appendChild(bubble);
      setTimeout(() => bubble.remove(), 2000);
    }, 500);
    
    if (!$('#bubble-float-style')) {
      const style = document.createElement('style');
      style.id = 'bubble-float-style';
      style.textContent = `
        @keyframes bubble-float {
          0% { transform: translateX(0) scale(0.5); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateX(40px) scale(1); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // 10. CONTACTO - Notificaciones estilo WhatsApp
  const contactLink = $('[data-effect="contact"]');
  if (contactLink) {
    setInterval(() => {
      if (!contactLink.matches(':hover')) return;
      const notif = document.createElement('span');
      notif.textContent = ['📱', '📞', '💬'][Math.floor(Math.random() * 3)];
      notif.style.cssText = `
        position: fixed; font-size: 12px;
        pointer-events: none; z-index: 9999; animation: notif-ping 1s ease-out forwards;
      `;
      const rect = contactLink.getBoundingClientRect();
      notif.style.left = rect.right - 5 + 'px';
      notif.style.top = rect.top - 5 + 'px';
      document.body.appendChild(notif);
      setTimeout(() => notif.remove(), 1000);
    }, 800);
    
    if (!$('#notif-ping-style')) {
      const style = document.createElement('style');
      style.id = 'notif-ping-style';
      style.textContent = `
        @keyframes notif-ping {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // 11. DRAWING - Trazos de pincel
  const drawLink = $('[data-effect="draw"]');
  if (drawLink) {
    setInterval(() => {
      if (!drawLink.matches(':hover')) return;
      const stroke = document.createElement('span');
      stroke.textContent = ['🎨', '🖌️', '✏️', '🖍️'][Math.floor(Math.random() * 4)];
      stroke.style.cssText = `
        position: fixed; font-size: 12px;
        pointer-events: none; z-index: 9999; animation: draw-stroke 1.5s ease-out forwards;
      `;
      const rect = drawLink.getBoundingClientRect();
      stroke.style.left = rect.left + Math.random() * rect.width + 'px';
      stroke.style.top = rect.top + Math.random() * rect.height + 'px';
      document.body.appendChild(stroke);
      setTimeout(() => stroke.remove(), 1500);
    }, 600);
    
    if (!$('#draw-stroke-style')) {
      const style = document.createElement('style');
      style.id = 'draw-stroke-style';
      style.textContent = `
        @keyframes draw-stroke {
          0% { transform: rotate(0deg) scale(0.5); opacity: 1; }
          100% { transform: rotate(360deg) scale(1.5); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // 12. UPDATES - Flechas ascendentes
  const updatesLink = $('[data-effect="updates"]');
  if (updatesLink) {
    setInterval(() => {
      if (!updatesLink.matches(':hover')) return;
      const arrow = document.createElement('span');
      arrow.textContent = ['⬆️', '🔼', '⏫'][Math.floor(Math.random() * 3)];
      arrow.style.cssText = `
        position: fixed; font-size: 10px;
        pointer-events: none; z-index: 9999; animation: arrow-rise 2s ease-out forwards;
      `;
      const rect = updatesLink.getBoundingClientRect();
      arrow.style.left = rect.left + Math.random() * rect.width + 'px';
      arrow.style.top = rect.bottom + 'px';
      document.body.appendChild(arrow);
      setTimeout(() => arrow.remove(), 2000);
    }, 700);
    
    if (!$('#arrow-rise-style')) {
      const style = document.createElement('style');
      style.id = 'arrow-rise-style';
      style.textContent = `
        @keyframes arrow-rise {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-60px); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // 13. NOTICIAS - Papeles volando
  const newsLink = $('[data-effect="news"]');
  if (newsLink) {
    setInterval(() => {
      if (!newsLink.matches(':hover')) return;
      const paper = document.createElement('span');
      paper.textContent = ['📰', '📄', '🗞️'][Math.floor(Math.random() * 3)];
      paper.style.cssText = `
        position: fixed; font-size: 12px;
        pointer-events: none; z-index: 9999; animation: paper-fly 2s ease-out forwards;
      `;
      const rect = newsLink.getBoundingClientRect();
      paper.style.left = rect.left + 'px';
      paper.style.top = rect.top + 'px';
      document.body.appendChild(paper);
      setTimeout(() => paper.remove(), 2000);
    }, 800);
    
    if (!$('#paper-fly-style')) {
      const style = document.createElement('style');
      style.id = 'paper-fly-style';
      style.textContent = `
        @keyframes paper-fly {
          0% { transform: translateX(0) rotate(0deg); opacity: 1; }
          100% { transform: translateX(50px) rotate(180deg); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // 14. TRADEOS - Esmeraldas intercambiándose
  const tradeLink = $('[data-effect="trade"]');
  if (tradeLink) {
    setInterval(() => {
      if (!tradeLink.matches(':hover')) return;
      const gem = document.createElement('span');
      gem.textContent = ['💎', '💰', '🪙'][Math.floor(Math.random() * 3)];
      gem.style.cssText = `
        position: fixed; font-size: 12px;
        pointer-events: none; z-index: 9999; animation: gem-swap 1.5s ease-in-out forwards;
      `;
      const rect = tradeLink.getBoundingClientRect();
      gem.style.left = (Math.random() > 0.5 ? rect.left : rect.right) + 'px';
      gem.style.top = rect.top + 'px';
      document.body.appendChild(gem);
      setTimeout(() => gem.remove(), 1500);
    }, 600);
    
    if (!$('#gem-swap-style')) {
      const style = document.createElement('style');
      style.id = 'gem-swap-style';
      style.textContent = `
        @keyframes gem-swap {
          0% { transform: translateX(0); opacity: 1; }
          50% { transform: translateX(30px); opacity: 0.5; }
          100% { transform: translateX(0); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // 15. TIENDA - Tickets y bolsas
  const shopLink = $('[data-effect="shop"]');
  if (shopLink) {
    setInterval(() => {
      if (!shopLink.matches(':hover')) return;
      const item = document.createElement('span');
      item.textContent = ['🎫', '🛍️', '🎁', '🏷️'][Math.floor(Math.random() * 4)];
      item.style.cssText = `
        position: fixed; font-size: 12px;
        pointer-events: none; z-index: 9999; animation: shop-drop 2s ease-out forwards;
      `;
      const rect = shopLink.getBoundingClientRect();
      item.style.left = rect.left + Math.random() * rect.width + 'px';
      item.style.top = rect.top - 10 + 'px';
      document.body.appendChild(item);
      setTimeout(() => item.remove(), 2000);
    }, 700);
    
    if (!$('#shop-drop-style')) {
      const style = document.createElement('style');
      style.id = 'shop-drop-style';
      style.textContent = `
        @keyframes shop-drop {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(60px) rotate(360deg); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // 16. HISTORY - Páginas de libro
  const historyLink = $('[data-effect="history"]');
  if (historyLink) {
    setInterval(() => {
      if (!historyLink.matches(':hover')) return;
      const page = document.createElement('span');
      page.textContent = ['📖', '📜', '📃'][Math.floor(Math.random() * 3)];
      page.style.cssText = `
        position: fixed; font-size: 12px;
        pointer-events: none; z-index: 9999; animation: page-turn 2s ease-out forwards;
      `;
      const rect = historyLink.getBoundingClientRect();
      page.style.left = rect.left + 'px';
      page.style.top = rect.top + 'px';
      document.body.appendChild(page);
      setTimeout(() => page.remove(), 2000);
    }, 900);
    
    if (!$('#page-turn-style')) {
      const style = document.createElement('style');
      style.id = 'page-turn-style';
      style.textContent = `
        @keyframes page-turn {
          0% { transform: rotateY(0deg); opacity: 1; }
          100% { transform: rotateY(180deg); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // 17. POSTS - Notas volando
  const postsLink = $('[data-effect="posts"]');
  if (postsLink) {
    setInterval(() => {
      if (!postsLink.matches(':hover')) return;
      const post = document.createElement('span');
      post.textContent = ['📝', '📋', '✍️'][Math.floor(Math.random() * 3)];
      post.style.cssText = `
        position: fixed; font-size: 12px;
        pointer-events: none; z-index: 9999; animation: post-fly 2s ease-out forwards;
      `;
      const rect = postsLink.getBoundingClientRect();
      post.style.left = rect.left + Math.random() * rect.width + 'px';
      post.style.top = rect.top + 'px';
      document.body.appendChild(post);
      setTimeout(() => post.remove(), 2000);
    }, 750);
    
    if (!$('#post-fly-style')) {
      const style = document.createElement('style');
      style.id = 'post-fly-style';
      style.textContent = `
        @keyframes post-fly {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-50px) scale(0.5); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // 18. ANNIVERSARY - Confetti
  const anniversaryLink = $('[data-effect="anniversary"]');
  if (anniversaryLink) {
    setInterval(() => {
      if (!anniversaryLink.matches(':hover')) return;
      const confetti = document.createElement('span');
      confetti.textContent = ['🎉', '🎊', '🎈', '🎂'][Math.floor(Math.random() * 4)];
      confetti.style.cssText = `
        position: fixed; font-size: 12px;
        pointer-events: none; z-index: 9999; animation: confetti-fall 2s ease-out forwards;
      `;
      const rect = anniversaryLink.getBoundingClientRect();
      confetti.style.left = rect.left + Math.random() * rect.width + 'px';
      confetti.style.top = rect.top - 20 + 'px';
      document.body.appendChild(confetti);
      setTimeout(() => confetti.remove(), 2000);
    }, 400);
    
    if (!$('#confetti-fall-style')) {
      const style = document.createElement('style');
      style.id = 'confetti-fall-style';
      style.textContent = `
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(80px) rotate(720deg); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }

})();

/* ---------- Partículas de fondo ---------- */
(function particles(){
  const c = $('#bgParticles');
  if (!c) return;
  const ctx = c.getContext('2d');
  const dpi = Math.max(1, window.devicePixelRatio || 1);
  let w, h, parts;

  const init = () => {
    w = c.width = innerWidth * dpi;
    h = c.height = innerHeight * dpi;
    parts = new Array(90).fill(0).map(() => ({
      x: Math.random()*w, y: Math.random()*h,
      r: 1 + Math.random()*2*dpi,
      s: .2 + Math.random()*1.2,
      a: .15 + Math.random()*.35
    }));
  };

  const tick = () => {
    ctx.clearRect(0,0,w,h);
    parts.forEach(p=>{
      p.y += p.s; p.x += Math.sin(p.y*0.002)*0.4;
      if (p.y > h) { p.y = -10; p.x = Math.random()*w; }
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle = `rgba(135,243,157,${p.a})`;
      ctx.fill();
    });
    requestAnimationFrame(tick);
  };

  init(); tick();
  addEventListener('resize', init);
})();

/* ---------- Parallax simple ---------- */
(function parallax(){
  const layers = $$('.layer');
  if (!layers.length) return;
  const k = [0, 0.03, 0.06, 0.1];

  const onScroll = () => {
    const y = window.scrollY || 0;
    layers.forEach((el, i) => {
      el.style.transform = `translateY(${y * k[i]}px)`;
    });
  };
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });
})();

/* ---------- Data: 12 tarjetas ---------- */
const ITEMS = [
  {
    name: 'Ba██ier',
    category: 'bloques',
    img: 'img/barrier.jpg',
    desc: '¿Este item?'
  },
];

/* ---------- Estado y referencias ---------- */
const cardsEl = $('#cards');
const chips = $$('.chip');
const qInput = $('#q');
const countVisible = $('#countVisible');
const countTotal = $('#countTotal');
const btnShuffle = $('#btnShuffle');
const btnSort = $('#btnSort');
const btnClear = $('#btnClear');

countTotal.textContent = ITEMS.length.toString();

let currentFilter = 'all';
let query = '';
let currentList = ITEMS.slice();

/* ---------- Render de tarjetas ---------- */
function cardTemplate(it, i){
  return `
  <article class="card reveal" data-category="${it.category}" data-name="${escapeHtml(it.name)}" data-desc="${escapeHtml(it.desc)}">
    <button class="card__media" data-lightbox="${i}" aria-label="Ampliar ${escapeHtml(it.name)}">
      <img src="${it.img}" alt="${escapeHtml(it.name)} — ${it.category}" loading="lazy" />
    </button>
    <div class="card__body">
      <h3 class="card__title">${escapeHtml(it.name)}</h3>
      <p class="card__desc">${escapeHtml(it.desc)}</p>
    </div>
    <footer class="card__meta">
      <span class="tag">${capitalize(it.category)}</span>
    </footer>
  </article>`;
}

function render(list){
  cardsEl.innerHTML = list.map((it,i)=> cardTemplate(it,i)).join('');
  updateVisibleCount();
  observeReveal();
  bindLightboxTriggers();
}

function updateVisibleCount(){
  const v = $$('.card', cardsEl).length;
  countVisible.textContent = v.toString();
}

/* ---------- Filtros ---------- */
chips.forEach(chip=>{
  chip.addEventListener('click', ()=>{
    chips.forEach(c=>c.classList.remove('active'));
    chip.classList.add('active');
    currentFilter = chip.dataset.filter || 'all';
    applyFilters();
    toast(`Filtro aplicado: ${chip.textContent}`);
  });
});

/* ---------- Búsqueda ---------- */
if (qInput){
  qInput.addEventListener('input', ()=>{
    query = qInput.value.trim().toLowerCase();
    applyFilters();
  });
}

/* ---------- Mezclar y ordenar ---------- */
btnShuffle?.addEventListener('click', ()=>{
  currentList = currentList
    .map(v=>[Math.random(),v])
    .sort((a,b)=>a[0]-b[0])
    .map(v=>v[1]);
  render(currentList);
  toast('Colección mezclada');
});

btnSort?.addEventListener('click', ()=>{
  currentList = currentList.slice().sort((a,b)=> a.name.localeCompare(b.name,'es',{sensitivity:'base'}));
  render(currentList);
  toast('Ordenado A→Z');
});

/* ---------- Limpiar ---------- */
btnClear?.addEventListener('click', ()=>{
  currentFilter = 'all';
  chips.forEach(c=>c.classList.remove('active'));
  chips[0].classList.add('active');
  qInput.value = '';
  query = '';
  currentList = ITEMS.slice();
  render(currentList);
  toast('Filtros limpiados');
});

/* ---------- Aplicar filtros y búsqueda ---------- */
function applyFilters(){
  const base = ITEMS.filter(it => currentFilter==='all' ? true : it.category === currentFilter);
  if (!query){
    currentList = base;
  } else {
    currentList = base.filter(it =>
      it.name.toLowerCase().includes(query) ||
      it.desc.toLowerCase().includes(query)
    );
  }
  render(currentList);
}

/* ---------- Lightbox ---------- */
const lb = $('#lightbox');
const lbImg = $('#lbImg');
const lbCap = $('#lbCaption');
const lbPrev = $('#lbPrev');
const lbNext = $('#lbNext');
const lbClose = $('#lbClose');
let lbIndex = -1;

function bindLightboxTriggers(){
  $$('[data-lightbox]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const i = +btn.dataset.lightbox;
      openLightbox(i);
    });
  });
}

function openLightbox(i){
  const item = currentList[i];
  if (!item) return;
  lbIndex = i;
  lbImg.src = item.img;
  lbImg.alt = `${item.name} — ${item.category}`;
  lbCap.textContent = `${item.name} — ${item.category}`;
  lb.setAttribute('aria-hidden','false');
  lb.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  lbClose.focus();
}

function closeLightbox(){
  lb.classList.remove('is-open');
  lb.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
  lbIndex = -1;
}

function navLightbox(dir){
  if (lbIndex < 0) return;
  lbIndex = (lbIndex + dir + currentList.length) % currentList.length;
  const item = currentList[lbIndex];
  lbImg.src = item.img;
  lbImg.alt = `${item.name} — ${item.category}`;
  lbCap.textContent = `${item.name} — ${item.category}`;
}

lbPrev?.addEventListener('click', ()=>navLightbox(-1));
lbNext?.addEventListener('click', ()=>navLightbox(1));
lbClose?.addEventListener('click', closeLightbox);

addEventListener('keydown', (e)=>{
  if (!lb.classList.contains('is-open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') navLightbox(-1);
  if (e.key === 'ArrowRight') navLightbox(1);
});

/* ---------- Reveal on scroll ---------- */
let revealObs;
function observeReveal(){
  if (revealObs) revealObs.disconnect();
  revealObs = new IntersectionObserver((entries)=>{
    entries.forEach(ent=>{
      if (ent.isIntersecting){
        ent.target.classList.add('is-in');
        revealObs.unobserve(ent.target);
      }
    });
  },{threshold:.15});
  $$('.reveal').forEach(el=>revealObs.observe(el));
}
observeReveal();

/* ---------- Stats demo ---------- */
$('#btnBoost')?.addEventListener('click', ()=>{
  const xp = $('.hud-bar.xp');
  const cur = +xp.dataset.val || 0;
  const nv = Math.min(100, cur + 10);
  xp.dataset.val = nv;
  xp.style.setProperty('--v', nv);
  $('#stTrades').textContent = (+$('#stTrades').textContent + 5).toString();
  toast('¡Experiencia potenciada +10!');
});

$('#btnSync')?.addEventListener('click', ()=>{
  toast('Sincronizando… listo ✅');
});

/* ---------- Toast ---------- */
let toastTimeout;
function toast(msg){
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(()=> t.classList.remove('show'), 1800);
}

/* ---------- Accesibilidad: focus trap lightbox ---------- */
(function a11yLightbox(){
  const focusable = () => $$('.lightbox.is-open button, .lightbox.is-open img');
  addEventListener('keydown', (e)=>{
    if (e.key !== 'Tab' || !lb.classList.contains('is-open')) return;
    const f = focusable();
    if (!f.length) return;
    const first = f[0], last = f[f.length-1];
    if (e.shiftKey && document.activeElement === first){
      last.focus(); e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === last){
      first.focus(); e.preventDefault();
    }
  });
})();

/* ---------- Utilidades ---------- */
function capitalize(s){return s.charAt(0).toUpperCase()+s.slice(1)}
function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}

/* ---------- Inicializaciones ---------- */
document.addEventListener('DOMContentLoaded',()=>{
  setHudBars();
  render(currentList);
});