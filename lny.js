/* =========================================================
   Moonveil Portal — Año Nuevo Lunar 2026 · Año del Caballo
   - Sistema de cartas diarias de fortuna (15 días)
   - Cartas se abren una por día desde el 17 feb 2026
   - Tradiciones del festival en línea de tiempo
   ========================================================= */

const $ = (q, ctx = document) => ctx.querySelector(q);
const $$ = (q, ctx = document) => Array.from(ctx.querySelectorAll(q));

/* =========================================================
   FECHA BASE: Año Nuevo Lunar 2026 (17 de febrero)
   ========================================================= */
const LNY_START = new Date('2026-02-17T00:00:00');
const TOTAL_DAYS = 15;

/* =========================================================
   DATOS DE LOS 15 DÍAS — Cartas de fortuna
   ========================================================= */
const fortuneData = [
  {
    day: 1,
    hanDay: '初一',
    hanChar: '福',
    emoji: '🧨',
    title: 'Año Nuevo · Chūnjié',
    message: 'El primer amanecer del Año del Caballo trae energía inagotable. El Caballo galopa hacia la victoria con fuerza y determinación. Hoy el cielo está pintado de rojo y oro: todo lo que emprendas hoy lleva la bendición del dragón del tiempo.',
    fortune: '马到成功 · El Caballo llega y el éxito florece',
    reward: '🧧 Bolsa Roja · + años de buena fortuna',
  },
  {
    day: 2,
    hanDay: '初二',
    hanChar: '禄',
    emoji: '🐎',
    title: 'Día del Regreso · Huímén',
    message: 'La hija casada regresa al hogar de sus padres. Los caminos se llenan de familia y afecto. El Caballo, noble animal del yang, te recuerda que la velocidad no es todo: detenerse a honrar los lazos del corazón también es sabiduría.',
    fortune: '阖家欢乐 · La familia reunida es el mayor tesoro',
    reward: '💎 64 Diamantes · Protección familiar durante el año',
  },
  {
    day: 3,
    hanDay: '初三',
    hanChar: '寿',
    emoji: '🌸',
    title: 'Día del Ratón · Chìgǒu',
    message: 'El tercer día es tranquilo, día de descanso y reflexión. Chì Gǒu, el dios del fuego y la discordia, vaga por el mundo. Evita confrontaciones y dedica el día a la meditación y el agradecimiento. La calma del Caballo ante la tormenta es su mayor virtud.',
    fortune: '岁岁平安 · Que cada año traiga paz y tranquilidad',
    reward: '🌿 Bayas Luminosas · Salud renovada para el año',
  },
  {
    day: 4,
    hanDay: '初四',
    hanChar: '喜',
    emoji: '🏮',
    title: 'Regreso de los Dioses',
    message: 'Los Dioses del Cielo regresan a la Tierra después de su viaje anual. Las familias preparan ofrendas de incienso y frutas para dar la bienvenida a los Ocho Inmortales. El Caballo es el mensajero entre el mundo terrenal y el celestial.',
    fortune: '神明保佑 · Que los Dioses guíen tu camino',
    reward: '✨ Pico de Netherite · Bendición divina sobre tu hogar',
  },
  {
    day: 5,
    hanDay: '初五',
    hanChar: '财',
    emoji: '💰',
    title: 'Día de la Riqueza · Cái Shén',
    message: '¡El Dios de la Riqueza visita cada hogar! El quinto día rompe el silencio con fuegos artificiales y celebración. El Caballo galopa hacia la prosperidad económica. Abre tus puertas y ventanas esta mañana para dejar entrar la abundancia.',
    fortune: '财源广进 · Que la riqueza fluya sin cesar hacia ti',
    reward: '🪙 256 Monedas · Abundancia y prosperidad financiera',
  },
  {
    day: 6,
    hanDay: '初六',
    hanChar: '吉',
    emoji: '🎋',
    title: 'Apertura de los Negocios',
    message: 'Los comerciantes regresan al trabajo con ofrendas y rituales de buena suerte. Las puertas de los negocios se abren con gran alboroto de petardos. El Caballo, símbolo del trabajo arduo, bendice todos los esfuerzos honestos con éxito merecido.',
    fortune: '生意兴隆 · Que tus negocios florezcan y prosperen',
    reward: '📜 x5 Cupon de 100% · Fortuna en tus proyectos',
  },
  {
    day: 7,
    hanDay: '初七',
    hanChar: '祥',
    emoji: '🌟',
    title: 'Día de la Humanidad · Rén Rì',
    message: 'El séptimo día es el cumpleaños de toda la humanidad, el día en que Nüwa creó a los seres humanos. Todos los mortales celebran su propia existencia. El Caballo lleva en su espalda a la humanidad hacia destinos desconocidos y maravillosos.',
    fortune: '人寿年丰 · Larga vida y años de abundancia para todos',
    reward: '🌍 Armadura de Oro · Conexión con todas las almas',
  },
  {
    day: 8,
    hanDay: '初八',
    hanChar: '瑞',
    emoji: '⭐',
    title: 'Reunión de las Estrellas',
    message: 'La familia de los Jade Emperor celebra su banquete anual. Las estrellas brillan con especial intensidad esta noche. El Caballo levanta su cabeza hacia el cielo nocturno y trota hacia las constelaciones. Es noche de sueños proféticos y visiones luminosas.',
    fortune: '星光护佑 · Las estrellas iluminan tu destino esta noche',
    reward: '✨ Armadura de Caballo de Diamante · Guía celestial para el año que comienza',
  },
  {
    day: 9,
    hanDay: '初九',
    hanChar: '龙',
    emoji: '🐉',
    title: 'Cumpleaños del Jade Emperor',
    message: 'El noveno día es el más sagrado: el cumpleaños del Jade Emperor, gobernante del cielo. Las familias se levantan antes del amanecer para rendir homenaje. El Caballo se inclina ante el trono celestial, símbolo de fuerza que reconoce la sabiduría superior.',
    fortune: '天恩浩荡 · La gracia del cielo es inmensa e inagotable',
    reward: '👑 Casco de Netherite · Autoridad y sabiduría para tomar decisiones',
  },
  {
    day: 10,
    hanDay: '初十',
    hanChar: '石',
    emoji: '🪨',
    title: 'Día de la Piedra · Shí Xī',
    message: 'El décimo día honra a la Diosa de la Piedra. Las piedras de molino descansan hoy: no se muelen granos ni se pican rocas. La solidez de la piedra y la velocidad del Caballo se complementan: construye sobre bases firmes, actúa con decisión.',
    fortune: '稳如泰山 · Firme como el monte Taishan ante cualquier adversidad',
    reward: '✨ 64 Piedras Luminosas · Estabilidad y firmeza en tu vida',
  },
  {
    day: 11,
    hanDay: '十一',
    hanChar: '德',
    emoji: '🎭',
    title: 'Banquete del Yerno',
    message: 'El undécimo día el suegro invita al yerno a un gran banquete. Sobras del festín del día nueve se convierten en manjares para el día once, honrando así el ciclo de la abundancia. El Caballo nos enseña que no hay desperdicio cuando se comparte con amor.',
    fortune: '家和万事兴 · La armonía familiar es fuente de todo éxito',
    reward: '🍜 64 Piedras Rojas · Largos días llenos de alegría',
  },
  {
    day: 12,
    hanDay: '十二',
    hanChar: '明',
    emoji: '🌺',
    title: 'Preparación de Linternas',
    message: 'Los artesanos comienzan a construir las linternas que iluminarán el Gran Festival. Las calles huelen a papel, pegamento y expectativa. El Caballo trota emocionado: en tres días, el cielo se llenará de luz y los deseos volarán entre las estrellas.',
    fortune: '前途光明 · Tu futuro brilla más que mil linternas encendidas',
    reward: '🏮 32 Linternas · Ilumina tu camino en la oscuridad',
  },
  {
    day: 13,
    hanDay: '十三',
    hanChar: '辉',
    emoji: '🎇',
    title: 'Día del General Guan',
    message: 'El decimotercer día honra al General Guan Yu, dios de la guerra y la lealtad. Los comerciantes y guerreros le rinden tributo. El Caballo, compañero del guerrero en batalla, inclina la cabeza ante la valentía y el honor. La lealtad es tu escudo más poderoso.',
    fortune: '忠义无双 · Tu lealtad y honor no tienen igual en este mundo',
    reward: '⚔️ Espada de Netherite · Valentía y justicia en todas tus acciones',
  },
  {
    day: 14,
    hanDay: '十四',
    hanChar: '元',
    emoji: '🌙',
    title: 'Víspera del Festival de Linternas',
    message: 'La luna creciente casi completa ilumina la noche de preparación. Las familias preparan los tang yuan, bolas de arroz dulce que simbolizan la unión. El Caballo descansa esta noche, conservando energía para el gran galope final hacia la luna llena.',
    fortune: '月圆人团圆 · Luna llena, familia reunida, corazón completo',
    reward: '🍡 12 Manzanas Doradas Encantadas · Dulzura y unión en todos tus vínculos',
  },
  {
    day: 15,
    hanDay: '十五',
    hanChar: '圆',
    emoji: '🎆',
    title: 'Festival de Linternas · Yuánxiāo',
    message: '¡La luna llena corona los quince días de celebración! Miles de linternas ascienden hacia el cielo estrellado, llevando consigo los deseos de millones de corazones. El Caballo galopa libre bajo la luna, su melena dorada una estela de luz. Has completado el festival, y tu año entero brilla con esta energía.',
    fortune: '元宵节快乐 · ¡Feliz Festival de Linternas! Tu año será radiante',
    reward: '🎆 Fuego del Yuánxiāo (Creeper) - 64 Cohetes (Nv.3) · Todo tu año desbordará de luz y alegría',
  }
];

/* =========================================================
   TRADICIONES DEL FESTIVAL — Línea de tiempo
   ========================================================= */
const traditions = [
  { id: 1, icon: '🧨', title: 'Fuegos Artificiales', name: 'Yānhuǒ 烟火', desc: 'Los petardos ahuyentan al monstruo Nian y atraen la buena fortuna. El ruido es proporcional a la prosperidad que se espera en el nuevo año.' },
  { id: 2, icon: '🥟', title: 'Dumplings', name: 'Jiǎozi 饺子', desc: 'Con forma de monedas antiguas, los jiaozi traen riqueza. Las familias del norte de China los preparan juntas en la víspera de Año Nuevo.' },
  { id: 3, icon: '🧧', title: 'Sobres Rojos', name: 'Hóngbāo 红包', desc: 'Los adultos casados regalan sobres rojos con dinero a los niños y jóvenes solteros. El rojo simboliza la buena suerte y aleja el mal.' },
  { id: 4, icon: '🌸', title: 'Flores de Cerezo', name: 'Méihuā 梅花', desc: 'Los mercados florales se llenan de melocotoneros, naranjos y ramas de ciruela. Cada flor anuncia la primavera y la renovación del ciclo vital.' },
  { id: 5, icon: '🏮', title: 'Festival de Linternas', name: 'Yuánxiāo Jié 元宵节', desc: 'El día quince marca el final con miles de linternas elevándose al cielo. Parejas resuelven acertijos escritos en linternas para encontrar fortuna.' },
  { id: 6, icon: '💃', title: 'Danza del León', name: 'Shīzi Wǔ 狮子舞', desc: 'Dos bailarines bajo un traje de león realizan acrobacias para alejar a los espíritus malignos y atraer la prosperidad a los comercios.' },
  { id: 7, icon: '🐉', title: 'Danza del Dragón', name: 'Lóng Wǔ 龙舞', desc: 'Un dragón de tela de 50 metros manipulado por decenas de personas ondea por las calles. El dragón chino es símbolo de poder, sabiduría y buena suerte.' },
  { id: 8, icon: '🍊', title: 'Mandarinas y Pomelos', name: 'Júzi 桔子', desc: 'Regalar cítricos es augurio de abundancia y felicidad: la palabra oro (jīn 金) suena parecida a naranja en cantonés. La mesa familiar nunca les falta.' },
];

/* =========================================================
   HELPERS DE FECHA
   ========================================================= */
function getDayOfFestival() {
  const now = new Date();
  const diffMs = now - LNY_START;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  return diffDays; // Día 1 = 17 feb, Día 2 = 18 feb, etc.
}

function isCardAvailable(day) {
  return getDayOfFestival() >= day;
}

function isCardOpenedToday(day) {
  const key = `lny2026_card_${day}_opened`;
  const saved = localStorage.getItem(key);
  if (!saved) return false;

  // Verificar que fue abierta en el día correcto del festival
  const savedFestivalDay = parseInt(localStorage.getItem(`lny2026_card_${day}_festDay`) || '0');
  return savedFestivalDay === day;
}

function markCardOpened(day) {
  const key = `lny2026_card_${day}_opened`;
  localStorage.setItem(key, 'true');
  localStorage.setItem(`lny2026_card_${day}_festDay`, String(day));
}

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
   Partículas de fondo (doradas/rojas)
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
    parts = new Array(120).fill(0).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: (0.8 + Math.random() * 2.5) * dpi,
      s: 0.15 + Math.random() * 0.7,
      a: 0.12 + Math.random() * 0.35,
      hue: Math.random() < 0.6 ? (350 + Math.random() * 20) : (35 + Math.random() * 15), // rojo o dorado
      drift: (Math.random() - 0.5) * 0.4,
    }));
  };

  const tick = () => {
    ctx.clearRect(0, 0, w, h);
    parts.forEach(p => {
      p.y -= p.s * 0.4; // partículas suben (efecto festivo)
      p.x += p.drift;
      if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
      if (p.x < 0 || p.x > w) p.drift *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 85%, 65%, ${p.a})`;
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
  const k = [0, 0.02, 0.05, 0.08];
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
  const opened = fortuneData.filter(d => isCardOpenedToday(d.day)).length;
  const festDay = Math.min(Math.max(getDayOfFestival(), 0), TOTAL_DAYS);
  const percent = Math.round((opened / TOTAL_DAYS) * 100);

  $('#daysOpened').textContent = opened;
  $('#dayProgress').textContent = percent + '%';

  const currentDay = getDayOfFestival();
  if (currentDay >= 1 && currentDay <= TOTAL_DAYS) {
    const d = fortuneData[currentDay - 1];
    $('#currentDay').textContent = d ? d.hanDay : `Día ${currentDay}`;
  } else if (currentDay > TOTAL_DAYS) {
    $('#currentDay').textContent = '圆满';
  } else {
    $('#currentDay').textContent = '初一';
  }

  const bar = $('#globalProgressBar');
  if (bar) bar.style.width = percent + '%';
}

/* =========================================================
   Generar Grilla de Cartas
   ========================================================= */
function generateFortuneGrid() {
  const grid = $('#fortuneGrid');
  if (!grid) return;

  grid.innerHTML = '';
  const currentFestDay = getDayOfFestival();

  fortuneData.forEach((data) => {
    const available = isCardAvailable(data.day);
    const opened = isCardOpenedToday(data.day);
    const isToday = data.day === currentFestDay;

    const card = document.createElement('div');
    card.className = 'fortune-card' +
      (!available ? ' locked' : '') +
      (opened ? ' opened' : '') +
      (isToday && available && !opened ? ' today' : '');
    card.dataset.day = data.day;

    card.innerHTML = `
      <div class="card-inner">
        <div class="card-face card-front">
          <div class="card-day-num">${data.hanDay}</div>
          <div class="card-day-label">Día ${data.day}</div>
          <div class="card-main-icon">${data.emoji}</div>
          <div class="card-han">${data.hanChar}</div>
          ${opened ? `<div class="card-opened-badge">Abierta</div>` : ''}
          ${!available ? `<div class="card-lock-overlay">🔒</div>` : ''}
        </div>
      </div>
    `;

    if (available) {
      card.addEventListener('click', () => openFortuneModal(data, opened));
    } else {
      const daysUntil = data.day - currentFestDay;
      card.addEventListener('click', () => {
        toast(`🔒 Esta carta se abre en ${daysUntil} día${daysUntil > 1 ? 's' : ''} · ${data.hanDay}`);
      });
    }

    grid.appendChild(card);
  });
}

/* =========================================================
   Modal de Carta de Fortuna
   ========================================================= */
const modal = $('#cardModal');
const modalOverlay = $('#modalOverlay');
const modalClose = $('#modalClose');
const openCardBtn = $('#openCardBtn');
const openedMark = $('#openedMark');

let currentModalData = null;

function openFortuneModal(data, alreadyOpened) {
  currentModalData = data;

  $('#modalDayBadge').textContent = `${data.hanDay} · Día ${data.day} del Festival`;
  $('#modalHan').textContent = data.hanChar;
  $('#modalTitle').textContent = data.title;
  $('#modalMessage').textContent = data.message;
  $('#modalFortune').textContent = data.fortune;
  $('#rewardText').textContent = data.reward;

  if (alreadyOpened) {
    openCardBtn.classList.add('hidden');
    openedMark.classList.remove('hidden');
  } else {
    openCardBtn.classList.remove('hidden');
    openedMark.classList.add('hidden');
  }

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

modalClose?.addEventListener('click', closeModal);
modalOverlay?.addEventListener('click', closeModal);

openCardBtn?.addEventListener('click', () => {
  if (!currentModalData) return;

  markCardOpened(currentModalData.day);

  // Animación en la carta de la grilla
  const cardEl = $(`.fortune-card[data-day="${currentModalData.day}"]`);
  if (cardEl) {
    cardEl.classList.add('opened', 'just-opened');
    cardEl.classList.remove('today');
    setTimeout(() => cardEl.classList.remove('just-opened'), 800);
    spawnConfetti(cardEl);

    // Actualizar contenido de la carta
    const lockOverlay = cardEl.querySelector('.card-lock-overlay');
    if (lockOverlay) lockOverlay.remove();
    const openedBadge = document.createElement('div');
    openedBadge.className = 'card-opened-badge';
    openedBadge.textContent = 'Abierta';
    cardEl.querySelector('.card-face')?.appendChild(openedBadge);
  }

  openCardBtn.classList.add('hidden');
  openedMark.classList.remove('hidden');

  updateStats();

  // Mensaje festivo
  const msgs = [
    `🎊 ¡Carta ${currentModalData.hanDay} abierta! Que la fortuna te acompañe.`,
    `🧧 ¡${currentModalData.title} desbloqueado! Un día más de bendiciones.`,
    `🏮 ¡Maravilloso! ${currentModalData.hanChar} ilumina tu camino hoy.`,
  ];
  toast(msgs[Math.floor(Math.random() * msgs.length)]);

  if (fortuneData.filter(d => isCardOpenedToday(d.day)).length === TOTAL_DAYS) {
    setTimeout(() => {
      closeModal();
      confettiCelebration();
      toast('🎆 ¡元宵节！ ¡Has completado los 15 días del festival!');
    }, 1200);
  }
});

/* =========================================================
   Efectos de confeti
   ========================================================= */
function spawnConfetti(targetEl) {
  const colors = ['#e11d48', '#f59e0b', '#fbbf24', '#f97316', '#fde68a', '#fff'];
  const rect = targetEl.getBoundingClientRect();

  for (let i = 0; i < 12; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.cssText = `
      left: ${rect.left + rect.width / 2 + (Math.random() - 0.5) * rect.width}px;
      top: ${rect.top}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      width: ${4 + Math.random() * 8}px;
      height: ${4 + Math.random() * 8}px;
      animation-duration: ${0.5 + Math.random() * 0.6}s;
      animation-delay: ${Math.random() * 0.2}s;
      position: fixed;
    `;
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 1000);
  }
}

function confettiCelebration() {
  const colors = ['#e11d48', '#f59e0b', '#fbbf24', '#f97316', '#fde68a', '#fff', '#10b981'];
  for (let i = 0; i < 60; i++) {
    setTimeout(() => {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.cssText = `
        left: ${Math.random() * 100}vw;
        top: -20px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        width: ${6 + Math.random() * 10}px;
        height: ${6 + Math.random() * 10}px;
        animation-duration: ${1 + Math.random()}s;
        position: fixed;
      `;
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 2000);
    }, i * 30);
  }
}

/* =========================================================
   Generar Línea de Tiempo de Tradiciones
   ========================================================= */
function generateTimeline() {
  const timeline = $('#lnyTimeline');
  if (!timeline) return;

  timeline.innerHTML = '';

  traditions.forEach((item, index) => {
    const checkpoint = document.createElement('div');
    checkpoint.className = 'checkpoint active';
    checkpoint.style.animationDelay = `${index * 0.07}s`;

    checkpoint.innerHTML = `
      <div class="checkpoint-content">
        <div class="checkpoint-number">${item.name}</div>
        <h3 class="checkpoint-title">${item.title}</h3>
        <p class="checkpoint-desc">${item.desc}</p>
      </div>
      <div class="checkpoint-icon">${item.icon}</div>
      <div class="checkpoint-content">
        <p class="checkpoint-desc" style="opacity:.75; font-style:italic;">
          Tradición milenaria del Año Nuevo Lunar celebrada en toda China y el mundo.
        </p>
      </div>
    `;

    timeline.appendChild(checkpoint);
  });
}

/* =========================================================
   Toast
   ========================================================= */
const toastEl = $('#toast');

function toast(msg) {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastEl._id);
  toastEl._id = setTimeout(() => toastEl.classList.remove('show'), 3000);
}

/* =========================================================
   Música
   ========================================================= */
window.toggleMusic = function () {
  const audio = $('#bg-music');
  const btn = $('.floating-music');
  if (!audio || !btn) return;

  if (audio.paused) {
    audio.play().then(() => {
      btn.classList.add('active');
      localStorage.setItem('lnyMusic', 'on');
      toast('🎵 Música festiva activada 春节快乐');
    }).catch(() => {
      toast('⚠️ Interactúa con la página primero para activar la música');
    });
  } else {
    audio.pause();
    btn.classList.remove('active');
    localStorage.setItem('lnyMusic', 'off');
    toast('🔇 Música desactivada');
  }
};

/* =========================================================
   Scroll Reveal
   ========================================================= */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'none';
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -80px 0px' });

/* =========================================================
   Inicialización
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  generateFortuneGrid();
  generateTimeline();
  updateStats();

  // Scroll reveal
  window.addEventListener('load', () => {
    $$('.checkpoint').forEach(el => observer.observe(el));
  });

  // Restaurar música
  const audio = $('#bg-music');
  const btn = $('.floating-music');
  if (audio && btn && localStorage.getItem('lnyMusic') === 'on') {
    audio.play().then(() => btn.classList.add('active')).catch(() => {});
  }

  // Mensaje de bienvenida
  setTimeout(() => {
    const festDay = getDayOfFestival();
    const opened = fortuneData.filter(d => isCardOpenedToday(d.day)).length;

    if (festDay < 1) {
      toast('🐎 El Año del Caballo comienza el 17 de febrero de 2026');
    } else if (festDay > TOTAL_DAYS) {
      toast('🎆 El Festival ha concluido · 马年大吉');
    } else {
      const d = fortuneData[festDay - 1];
      if (d) {
        const msg = opened >= festDay
          ? `🏮 Día ${d.hanDay} del festival · ${opened}/${TOTAL_DAYS} cartas abiertas`
          : `🧧 ¡Hoy es ${d.hanDay}! Abre tu carta de fortuna del día ${festDay}`;
        toast(msg);
      }
    }
  }, 1000);

  // Easter egg en el título
  $('.horse-text')?.addEventListener('click', () => {
    const phrases = [
      '🐎 马到成功 · ¡El Caballo llega y el éxito florece!',
      '🧨 新年快乐 · ¡Feliz Año Nuevo Lunar!',
      '🏮 元宵节快乐 · ¡Feliz Festival de Linternas!',
      '🎆 恭喜发财 · ¡Que la prosperidad llegue a ti!',
      '🌸 岁岁平安 · ¡Que cada año traiga paz!',
    ];
    toast(phrases[Math.floor(Math.random() * phrases.length)]);
    confettiCelebration();
  });

  // Caracteres chinos: efecto al hacer clic
  $$('.han-char').forEach((el, i) => {
    el.style.cursor = 'pointer';
    el.addEventListener('click', () => {
      const blessings = ['福 · Felicidad', '马 · Caballo', '年 · Año', '吉 · Fortuna', '祥 · Prosperidad'];
      toast(`✨ ${blessings[i] || '春节快乐'}`);
    });
  });
});