/* =========================================================
   Álbum de Recuerdos — Moonveil Portal
   ★ Polaroids · Música por foto · Estrellas fugaces
   ========================================================= */

const $ = (q, ctx = document) => ctx.querySelector(q);
const $$ = (q, ctx = document) => Array.from(ctx.querySelectorAll(q));

/* =========================================================
   DATOS DE LAS FOTOGRAFÍAS
   Cada foto tiene: música (nombre del track + URL pública de audio)
   Usamos URLs de audio libres de copyright (freemusicarchive / mixkit)
   img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=700&q=80',
   ========================================================= */
const photos = [
  {
    id: 1,
    title: 'El Primer Recuerdo',
    date: '2023',
    author: 'This Magician',
    category: 'naturaleza',
    stars: 5,
    desc: 'Y todo comenzo con un jugamos... Que curioso que al final se convirtiera en un recuerdo de hace años...',
    img: 'min/house1.png',
    color: '#e8a54b',
    rot: -2.5,
    offsetY: 10,
    tape: 'tape-top tape-warm',
    music: {
      name: 'Golden Leaves — Piano Nostálgico',
      url: 'https://cdn.pixabay.com/audio/2022/08/02/audio_884fe92c21.mp3',
    },
  },
  {
    id: 2,
    title: 'La Casita Del Recuerdo',
    date: '2024',
    author: 'Leon Supreme',
    category: 'naturaleza',
    stars: 5,
    desc: 'Sientete orgulloso de tus creaciones, ya que al final son unicas y hermosas...',
    img: 'min/house4.png',
    color: '#4f8ef7',
    rot: 1.8,
    offsetY: -8,
    tape: 'tape-top tape-blue',
    music: {
      name: 'Ocean Waves — Ambient Suave',
      url: 'https://cdn.pixabay.com/audio/2022/08/02/audio_884fe92c21.mp3',
    },
  },
  {
    id: 3,
    title: 'El Muñequito Del Ayer y Del Mañana',
    date: '24 Dic 2025',
    author: 'This Magician',
    category: 'naturaleza',
    stars: 5,
    desc: 'Tan rapido pasa el tiempo, que aveces no nos damos cuenta de lo que nos estamos perdiendo...',
    img: 'min/snow1.png',
    color: '#c084fc',
    rot: -1.2,
    offsetY: 20,
    tape: 'tape-corner tape-pink',
    music: {
      name: 'Whispered Portrait — Cello Solo',
      url: 'https://cdn.pixabay.com/audio/2022/10/25/audio_946b49444b.mp3',
    },
  },
  {
    id: 4,
    title: 'La Soledad En Una Puerta',
    date: '2024',
    author: 'Leon Supreme',
    category: 'naturaleza',
    stars: 5,
    desc: 'Es esa pausa silenciosa donde la soledad parece grande… pero detrás de la puerta late la compañía, la esperanza y el cariño que nunca se fue.',
    img: 'min/door1.png',
    color: '#60a5fa',
    rot: 2.2,
    offsetY: 0,
    tape: 'tape-top tape-blue',
    music: {
      name: 'Midnight City — Lo-fi Ambient',
      url: 'https://cdn.pixabay.com/audio/2022/08/31/audio_d3b5748d98.mp3',
    },
  },
  {
    id: 5,
    title: 'Mi Querida Casita',
    date: '8 Feb 2023',
    author: 'Ill Almond',
    category: 'naturaleza',
    stars: 5,
    desc: 'Tu obra aqui vale mucho, asi que agradecemos que tu seas el artista...',
    img: 'min/church1.png',
    color: '#34d399',
    rot: -3.0,
    offsetY: 15,
    tape: 'tape-top tape-mint',
    music: {
      name: 'Spring Garden — Flauta Dulce',
      url: 'https://cdn.pixabay.com/audio/2022/01/18/audio_d0c6ff1c23.mp3',
    },
  },
  {
    id: 6,
    title: 'Mi Casita Bella',
    date: '18 Ene 2026',
    author: 'This Magician',
    category: 'naturaleza',
    stars: 5,
    desc: 'Nunca escondas tus habilidades de crear arte tan fantastico, que hay corazones que desean ver ese arte...',
    img: 'min/house2.png',
    color: '#f59e0b',
    rot: 1.5,
    offsetY: -5,
    tape: 'tape-corner tape-warm',
    music: {
      name: 'Fado da Saudade — Guitarra Portuguesa',
      url: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3',
    },
  },
  {
    id: 7,
    title: 'Nunca Te Detengas De Crear',
    date: '25 Ene 2026',
    author: 'This Magician',
    category: 'naturaleza',
    stars: 5,
    desc: 'Eres la unica persona que le da ese toque a tu arte porque sabes que contigo brilla...',
    img: 'min/house3.png',
    color: '#f97316',
    rot: -1.8,
    offsetY: 8,
    tape: 'tape-top tape-pink',
    music: {
      name: 'Creative Flow — Piano Jazz',
      url: 'https://cdn.pixabay.com/audio/2022/10/16/audio_3e714cd2f5.mp3',
    },
  },
  {
    id: 8,
    title: 'La la lava??',
    date: '02 Feb 2026',
    author: '😺✨',
    category: 'naturaleza',
    stars: 5,
    desc: 'Algo que capaz no tenga sentido de ¿porque?, pero es unico...',
    img: 'min/chicken1.png',
    color: '#818cf8',
    rot: 2.8,
    offsetY: -12,
    tape: 'tape-top tape-blue',
    music: {
      name: 'Winter Moon — Sintetizador Celestial',
      url: 'https://cdn.pixabay.com/audio/2022/12/09/audio_eded23ae11.mp3',
    },
  },
  {
    id: 9,
    title: 'Las Beestividades',
    date: '18 Dic 2023',
    author: '😺✨',
    category: 'naturaleza',
    stars: 4,
    desc: 'Quien no vio una abeja celebrando esta beestividad, que curioso que tenga un regalo para ti, es que sabe que eres beespecial...',
    img: 'min/bee1.png',
    color: '#fbbf24',
    rot: -2.0,
    offsetY: 18,
    tape: 'tape-corner tape-warm',
    music: {
      name: 'Bazaar Sunrise — Oud Oriental',
      url: 'https://cdn.pixabay.com/audio/2022/10/30/audio_ffe9c7b6fe.mp3',
    },
  },
  {
    id: 10,
    title: 'Dejando Atras El Pasado Y Miremos El Futuro',
    date: '2025',
    author: 'This Magician',
    category: 'naturaleza',
    stars: 5,
    desc: 'Aveces es bueno dejar eso atras, y asi veremos que tenemos un potencial mas grande de lo que imaginemos...',
    img: 'min/house5.png',
    color: '#06b6d4',
    rot: 1.2,
    offsetY: 5,
    tape: 'tape-top tape-mint',
    music: {
      name: 'Summer Playground — Ukulele Alegre',
      url: 'https://cdn.pixabay.com/audio/2022/01/20/audio_d3b9f94f5e.mp3',
    },
  },
  /*{
    id: 11,
    title: 'Bosque de Niebla',
    date: '3 Nov 2022',
    author: 'Sofía Marín',
    category: 'naturaleza',
    stars: 5,
    desc: 'La niebla convertía cada árbol en un espectro silencioso. Caminé durante horas sin encontrar el final de ese bosque de sueños.',
    img: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=700&q=80',
    color: '#94a3b8',
    rot: -2.8,
    offsetY: -3,
    tape: 'tape-corner tape-blue',
    music: {
      name: 'Misty Forest — Ambient Melancólico',
      url: 'https://cdn.pixabay.com/audio/2022/09/07/audio_02c6e8b5d3.mp3',
    },
  },
  {
    id: 12,
    title: 'Grafiti del Tiempo',
    date: '18 Abr 2023',
    author: 'Marco Delgado',
    category: 'arte',
    stars: 4,
    desc: 'El arte callejero no pide disculpas ni permiso. Solo habla al que se detiene, al que sabe que las paredes también hablan.',
    img: 'https://images.unsplash.com/photo-1533483595632-c5f0e57a1936?w=700&q=80',
    color: '#e879f9',
    rot: 3.2,
    offsetY: 12,
    tape: 'tape-top tape-pink',
    music: {
      name: 'Urban Canvas — Hip-hop Instrumental',
      url: 'https://cdn.pixabay.com/audio/2022/11/22/audio_febc508520.mp3',
    },
  },*/
];

/* =========================================================
   CITAS ROTATIVAS
   ========================================================= */
const quotes = [
  { text: 'La fotografía es el arte de la observación.', author: 'Elliott Erwitt' },
  { text: 'Una fotografía no solo es una imagen, es un instante de vida.', author: 'Alfred Eisenstaedt' },
  { text: 'El mundo siempre será hermoso para quien sepa mirarlo.', author: 'Germán Castro Caycedo' },
  { text: 'Fotografiar es poner la cabeza, el ojo y el corazón en el mismo eje.', author: 'Henri Cartier-Bresson' },
  { text: 'La luz hace la fotografía. Abraza la luz.', author: 'Galen Rowell' },
  { text: 'Un buen retrato es uno en el que el personaje mira a través del fotógrafo.', author: 'John Singer Sargent' },
];

/* =========================================================
   ESTADO GLOBAL
   ========================================================= */
let currentFilter  = 'all';
let currentLbIndex = 0;
let favorites = JSON.parse(localStorage.getItem('album_favorites') || '[]');

// Audio
let currentAudio    = null;
let currentPhotoId  = null;
let progressTimer   = null;

/* =========================================================
   CANVAS: CIELO ESTRELLADO + ESTRELLAS FUGACES
   ========================================================= */
(function initStarCanvas() {
  const canvas = $('#starCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = Math.max(1, devicePixelRatio || 1);
  let W, H, stars = [], shootingStars = [];

  function resize() {
    W = canvas.width  = innerWidth  * dpr;
    H = canvas.height = innerHeight * dpr;
    initStars();
  }

  function initStars() {
    stars = [];
    const count = Math.floor((W * H) / (dpr * 6000));
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * W, y: Math.random() * H,
        r: (.4 + Math.random() * 1.6) * dpr,
        a: .1 + Math.random() * .7,
        speed: .3 + Math.random() * .8,
        phase: Math.random() * Math.PI * 2,
        hue: Math.random() < .7 ? (210 + Math.random() * 30) : (40 + Math.random() * 20),
      });
    }
  }

  function spawnShootingStar() {
    const sx = Math.random() < .5 ? -50 : Math.random() * W * .6;
    const sy = Math.random() * H * .5;
    const angle = .28 + Math.random() * .45;
    const speed = (6 + Math.random() * 10) * dpr;
    shootingStars.push({
      x: sx, y: sy,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      a: .9, decay: .012 + Math.random() * .01, trail: [],
    });
  }

  function drawBackground() {
    const grad = ctx.createRadialGradient(W/2, 0, 0, W/2, H*.5, Math.max(W, H));
    grad.addColorStop(0,   '#0c1540');
    grad.addColorStop(.35, '#070d2a');
    grad.addColorStop(.7,  '#05091e');
    grad.addColorStop(1,   '#04071a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  function drawNebula() {
    const n = (cx, cy, rx, ry, c) => {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
      g.addColorStop(0, c); g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.save(); ctx.scale(1, ry/rx);
      ctx.beginPath(); ctx.arc(cx, cy*(rx/ry), rx, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    };
    n(W*.65, H*.2, W*.22, H*.14, 'rgba(40,60,180,.045)');
    n(W*.2,  H*.5, W*.18, H*.12, 'rgba(100,60,200,.03)');
    n(W*.85, H*.6, W*.15, H*.1,  'rgba(60,120,255,.04)');
  }

  function drawStars(t) {
    stars.forEach(s => {
      const tw = Math.sin(t * s.speed * .001 + s.phase);
      const alpha = s.a * (.7 + .3 * tw);
      const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r*4);
      glow.addColorStop(0, `hsla(${s.hue},80%,92%,${alpha})`);
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r*4, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = `hsla(${s.hue},90%,98%,${alpha})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.fill();
    });
  }

  function drawShootingStars() {
    shootingStars.forEach(ss => {
      ss.trail.push({ x: ss.x, y: ss.y, a: ss.a });
      if (ss.trail.length > 18) ss.trail.shift();

      for (let j = 0; j < ss.trail.length - 1; j++) {
        const p0 = ss.trail[j], p1 = ss.trail[j+1];
        const progress = j / ss.trail.length;
        const grad = ctx.createLinearGradient(p0.x, p0.y, p1.x, p1.y);
        grad.addColorStop(0, `rgba(168,192,255,${p0.a * progress * .5})`);
        grad.addColorStop(1, `rgba(255,248,255,${p0.a * progress})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = (1 + progress * 2.2) * dpr;
        ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
      }
      const hg = ctx.createRadialGradient(ss.x, ss.y, 0, ss.x, ss.y, 6*dpr);
      hg.addColorStop(0, `rgba(255,255,255,${ss.a})`);
      hg.addColorStop(.4, `rgba(180,210,255,${ss.a*.6})`);
      hg.addColorStop(1, 'transparent');
      ctx.fillStyle = hg;
      ctx.beginPath(); ctx.arc(ss.x, ss.y, 6*dpr, 0, Math.PI*2); ctx.fill();

      ss.x += ss.vx; ss.y += ss.vy; ss.a -= ss.decay;
    });
    shootingStars = shootingStars.filter(ss => ss.a > 0 && ss.x < W+200 && ss.y < H+200);
  }

  let lastShoot = 0, shootInterval = 3000 + Math.random() * 4000;
  function animate(t) {
    ctx.clearRect(0, 0, W, H);
    drawBackground(); drawNebula(); drawStars(t); drawShootingStars();
    if (t - lastShoot > shootInterval) {
      spawnShootingStar();
      if (Math.random() < .25) setTimeout(spawnShootingStar, 300 + Math.random() * 400);
      lastShoot = t;
      shootInterval = 3500 + Math.random() * 5000;
    }
    requestAnimationFrame(animate);
  }
  resize();
  requestAnimationFrame(animate);
  addEventListener('resize', resize);
})();

/* =========================================================
   POLVO ESTELAR CSS
   ========================================================= */
(function initStardust() {
  const c = $('#stardust');
  if (!c) return;
  for (let i = 0; i < 60; i++) {
    const p = document.createElement('div');
    p.className = 'stardust-particle';
    const size = .5 + Math.random() * 2;
    p.style.cssText = `
      width:${size}px;height:${size}px;
      left:${Math.random()*100}%;top:${Math.random()*100}%;
      --dur:${2+Math.random()*5}s;--delay:${Math.random()*6}s;
      --min-op:${.05+Math.random()*.15};--max-op:${.4+Math.random()*.5};
    `;
    c.appendChild(p);
  }
})();

/* =========================================================
   NAVBAR RESPONSIVE
   ========================================================= */
const navToggle = $('#navToggle');
const navLinks  = $('#navLinks');
navToggle?.addEventListener('click', e => {
  e.stopPropagation(); navLinks.classList.toggle('open');
});
document.addEventListener('click', e => {
  if (!navToggle?.contains(e.target) && !navLinks?.contains(e.target))
    navLinks?.classList.remove('open');
});

/* =========================================================
   STATS HERO
   ========================================================= */
function animateCounter(el, target, dur = 1200) {
  const start = performance.now();
  const tick = now => {
    const pct  = Math.min((now - start) / dur, 1);
    const ease = 1 - Math.pow(1 - pct, 3);
    el.textContent = Math.round(ease * target);
    if (pct < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function updateHeroStats() {
  const years   = [...new Set(photos.map(p => p.date.split(' ').pop()))];
  const authors = [...new Set(photos.map(p => p.author))];
  setTimeout(() => {
    animateCounter($('#totalPhotos'),  photos.length);
    animateCounter($('#totalYears'),   years.length,   900);
    animateCounter($('#totalAuthors'), authors.length, 700);
  }, 600);
}

/* =========================================================
   MÚSICA
   ========================================================= */
function stopMusic() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  clearInterval(progressTimer);
  currentPhotoId = null;

  // UI
  $('#mpFill').style.width = '0%';
  $('#mpToggle').textContent = '▶';
  $('#mpVinyl')?.classList.remove('spinning');
  $('#musicPlayer')?.classList.add('hidden');

  // Quitar badge playing de todas las polaroids
  $$('.polaroid-music-badge').forEach(b => b.classList.remove('playing'));
}

function playPhotoMusic(photoId) {
  const photo = photos.find(p => p.id === photoId);
  if (!photo?.music?.url) return;

  // Si ya está sonando esa foto, pausar/reanudar
  if (currentPhotoId === photoId && currentAudio) {
    if (currentAudio.paused) {
      currentAudio.play();
      $('#mpToggle').textContent = '⏸';
      $('#mpVinyl')?.classList.add('spinning');
    } else {
      currentAudio.pause();
      $('#mpToggle').textContent = '▶';
      $('#mpVinyl')?.classList.remove('spinning');
    }
    return;
  }

  // Nueva canción
  stopMusic();
  currentPhotoId = photoId;
  currentAudio = new Audio(photo.music.url);
  currentAudio.volume = 0.55;
  currentAudio.loop   = true;

  currentAudio.play().then(() => {
    // Mostrar reproductor
    const mp = $('#musicPlayer');
    mp?.classList.remove('hidden');
    $('#mpTitle').textContent = photo.music.name;
    $('#mpSub').textContent   = photo.title;
    $('#mpToggle').textContent = '⏸';
    $('#mpVinyl')?.classList.add('spinning');

    // Barra de progreso
    progressTimer = setInterval(() => {
      if (!currentAudio || currentAudio.duration === 0) return;
      const pct = (currentAudio.currentTime / currentAudio.duration) * 100;
      $('#mpFill').style.width = pct + '%';
    }, 500);

    // Badge en la polaroid
    const badge = $(`.polaroid-wrapper[data-id="${photoId}"] .polaroid-music-badge`);
    badge?.classList.add('playing');

    toast(`🎵 ${photo.music.name}`);
  }).catch(() => {
    toast('⚠️ No se pudo cargar el audio. Puede ser por autoplay.');
  });

  currentAudio.addEventListener('ended', () => {
    $('#mpToggle').textContent = '▶';
    $('#mpVinyl')?.classList.remove('spinning');
  });
}

// Controles del reproductor flotante
$('#mpToggle')?.addEventListener('click', () => {
  if (!currentAudio || !currentPhotoId) return;
  playPhotoMusic(currentPhotoId); // toggle
});
$('#mpStop')?.addEventListener('click', () => {
  stopMusic();
  toast('🎵 Música detenida');
});

/* =========================================================
   GENERAR POLAROIDS
   ========================================================= */
function starsHtml(n, max = 5, cls = 'p-star') {
  return Array.from({length: max}, (_,i) =>
    `<span class="${cls}${i >= n ? ' dim' : ''}">★</span>`
  ).join('');
}

function createPolaroid(data, index) {
  const isFav = favorites.includes(data.id);

  const wrapper = document.createElement('div');
  wrapper.className = 'polaroid-wrapper';
  wrapper.dataset.id = data.id;
  wrapper.dataset.category = data.category;
  wrapper.setAttribute('role', 'listitem');
  wrapper.setAttribute('tabindex', '0');
  wrapper.setAttribute('aria-label', `${data.title} — ${data.author}`);
  wrapper.style.setProperty('--rot', `${data.rot ?? 0}deg`);
  wrapper.style.setProperty('--offset-y', `${data.offsetY ?? 0}px`);
  wrapper.style.setProperty('--anim-delay', `${index * 0.08}s`);

  // Elegir tipo/posición de la cinta
  const tapeClass = data.tape || 'tape-top tape-blue';
  const tapeIsCorner = tapeClass.includes('corner');

  wrapper.innerHTML = `
    <div class="polaroid">
      <!-- Cinta adhesiva -->
      <div class="polaroid-tape ${tapeIsCorner ? 'tape-corner' : 'tape-top'} ${tapeClass.replace('tape-corner','').replace('tape-top','')}"></div>

      <!-- Foto -->
      <div class="polaroid-photo">
        <img
          src="${data.img}"
          alt="${data.title}"
          loading="lazy"
        />
        <div class="polaroid-grain"></div>
        <div class="polaroid-vignette"></div>

        <!-- Etiquetas sobre la foto -->
        <div class="polaroid-tag">${data.category}</div>
        <button class="polaroid-fav${isFav ? ' is-fav' : ''}"
          aria-label="Favorita" title="Marcar como favorita">
          ${isFav ? '♥' : '♡'}
        </button>
        <div class="polaroid-music-badge" title="Música de este recuerdo">
          🎵 ${data.music?.name?.split(' — ')[0] ?? 'Música'}
        </div>
        <div class="polaroid-stars">${starsHtml(data.stars)}</div>
      </div>

      <!-- Zona de escritura -->
      <div class="polaroid-caption">
        <span class="polaroid-handwriting">${data.title}</span>
        <span class="polaroid-date">${data.date}</span>
        <span class="polaroid-author-line">${data.author}</span>
      </div>

      <!-- Número de foto -->
      <span class="polaroid-number">#${String(data.id).padStart(2,'0')}</span>
    </div>
  `;

  // Clic en la foto → abrir lightbox
  wrapper.querySelector('.polaroid-photo img').addEventListener('click', () => openLightbox(data.id));
  wrapper.querySelector('.polaroid-caption').addEventListener('click', () => openLightbox(data.id));
  wrapper.addEventListener('keydown', e => { if (e.key === 'Enter') openLightbox(data.id); });

  // Clic en favorito
  wrapper.querySelector('.polaroid-fav').addEventListener('click', e => {
    e.stopPropagation();
    toggleFavorite(data.id, e.currentTarget);
  });

  // Clic en badge de música
  wrapper.querySelector('.polaroid-music-badge').addEventListener('click', e => {
    e.stopPropagation();
    playPhotoMusic(data.id);
  });

  // Efecto 3D al mover el mouse sobre la polaroid
  const pol = wrapper.querySelector('.polaroid');
  pol.addEventListener('mousemove', e => {
    const rect = pol.getBoundingClientRect();
    const cx   = rect.left + rect.width  / 2;
    const cy   = rect.top  + rect.height / 2;
    const dx   = (e.clientX - cx) / rect.width;
    const dy   = (e.clientY - cy) / rect.height;
    pol.style.transform = `rotateY(${dx*10}deg) rotateX(${-dy*8}deg)`;
    pol.style.transition = 'transform .1s ease';
  });
  pol.addEventListener('mouseleave', () => {
    pol.style.transform = '';
    pol.style.transition = 'transform .4s ease';
  });

  return wrapper;
}

function generateGrid(filter = 'all') {
  const grid = $('#albumGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const list = filter === 'all' ? photos : photos.filter(p => p.category === filter);

  if (list.length === 0) {
    grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:60px 20px;font-family:'Cormorant Garamond',serif;font-style:italic;font-size:1.2rem;">No hay fotografías en esta categoría.</p>`;
    return;
  }

  list.forEach((data, i) => grid.appendChild(createPolaroid(data, i)));
}

/* =========================================================
   FILTROS
   ========================================================= */
$$('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    generateGrid(currentFilter);
  });
});

/* =========================================================
   FAVORITOS
   ========================================================= */
function toggleFavorite(id, btn) {
  const idx = favorites.indexOf(id);
  if (idx === -1) {
    favorites.push(id);
    btn.classList.add('is-fav'); btn.textContent = '♥';
    toast('♥ Añadida a favoritas');
  } else {
    favorites.splice(idx, 1);
    btn.classList.remove('is-fav'); btn.textContent = '♡';
    toast('♡ Quitada de favoritas');
  }
  localStorage.setItem('album_favorites', JSON.stringify(favorites));
}

/* =========================================================
   LIGHTBOX
   ========================================================= */
const lightbox = $('#lightbox');

function getVisible() {
  return currentFilter === 'all' ? photos : photos.filter(p => p.category === currentFilter);
}

function openLightbox(id) {
  const vis = getVisible();
  currentLbIndex = vis.findIndex(p => p.id === id);
  if (currentLbIndex === -1) return;
  loadLightbox(vis[currentLbIndex]);
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
}

function loadLightbox(data) {
  // Foto con fade
  const img = $('#lbImg');
  img.style.opacity = '0';
  setTimeout(() => {
    img.src = data.img;
    img.alt = data.title;
    img.onload = () => { img.style.opacity = '1'; img.style.transition = 'opacity .3s'; };
  }, 80);

  // Texto del polaroid grande
  $('#lbCaption').textContent = data.title;
  $('#lbFooterDate').textContent = data.date;
  $('#lbFooterStars').innerHTML = starsHtml(data.stars, 5, '').replace(/★/g, '<span>★</span>').replace(/<span> /g, '<span class="dim">★</span>');
  // Manera más limpia de hacer las estrellitas en el footer del polaroid
  const fstars = $('#lbFooterStars');
  fstars.innerHTML = Array.from({length:5},(_,i)=>`<span${i>=data.stars?' class="dim"':''}>★</span>`).join('');

  // Datos laterales
  $('#lbTag').textContent    = data.category;
  $('#lbDate').textContent   = data.date;
  $('#lbTitle').textContent  = data.title;
  $('#lbDesc').textContent   = data.desc;
  $('#lbAuthor').textContent = data.author;
  $('#lbStars').innerHTML    = Array.from({length:5},(_,i)=>
    `<span class="lb-star${i>=data.stars?' dim':''}" >★</span>`
  ).join('');

  // Música
  const musicBox  = $('#lbMusicBox');
  const musicName = $('#lbMusicName');
  const musicBtn  = $('#lbMusicPlay');
  if (data.music) {
    musicBox.style.display  = '';
    musicName.textContent   = data.music.name;
    const isPlaying = currentPhotoId === data.id && currentAudio && !currentAudio.paused;
    musicBtn.textContent    = isPlaying ? '⏸ Pausar' : '▶ Escuchar';
    musicBtn.classList.toggle('playing', isPlaying);
    musicBtn.onclick = () => {
      playPhotoMusic(data.id);
      const nowPlaying = currentPhotoId === data.id && currentAudio && !currentAudio.paused;
      musicBtn.textContent = nowPlaying ? '⏸ Pausar' : '▶ Escuchar';
      musicBtn.classList.toggle('playing', nowPlaying);
    };
  } else {
    musicBox.style.display = 'none';
  }

  // Favorito
  const favBtn = $('#lbFav');
  const isFav  = favorites.includes(data.id);
  favBtn.textContent = isFav ? '♥ Favorita' : '♡ Favorita';
  favBtn.classList.toggle('active', isFav);
  favBtn.onclick = () => {
    const idx = favorites.indexOf(data.id);
    if (idx === -1) {
      favorites.push(data.id); favBtn.textContent = '♥ Favorita'; favBtn.classList.add('active');
      toast('♥ Añadida a favoritas');
    } else {
      favorites.splice(idx,1); favBtn.textContent = '♡ Favorita'; favBtn.classList.remove('active');
      toast('♡ Quitada de favoritas');
    }
    localStorage.setItem('album_favorites', JSON.stringify(favorites));
    // Actualizar en la polaroid
    const pw = $(`.polaroid-wrapper[data-id="${data.id}"] .polaroid-fav`);
    if (pw) { pw.classList.toggle('is-fav', !favorites.includes(data.id) ? false : true); pw.textContent = favorites.includes(data.id) ? '♥' : '♡'; }
  };

  // Compartir
  $('#lbShare').onclick = () => {
    if (navigator.share) {
      navigator.share({ title: data.title, text: `${data.title} — ${data.author}\n${data.desc}` }).catch(()=>{});
    } else {
      navigator.clipboard?.writeText(`${data.title} — ${data.author}`);
      toast('✦ Copiado al portapapeles');
    }
  };
}

function navigateLb(dir) {
  const vis = getVisible();
  currentLbIndex = (currentLbIndex + dir + vis.length) % vis.length;
  loadLightbox(vis[currentLbIndex]);
}

$('#lbClose')?.addEventListener('click', closeLightbox);
$('#lbOverlay')?.addEventListener('click', closeLightbox);
$('#lbPrev')?.addEventListener('click', () => navigateLb(-1));
$('#lbNext')?.addEventListener('click', () => navigateLb(1));

document.addEventListener('keydown', e => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape')      closeLightbox();
  if (e.key === 'ArrowRight')  navigateLb(1);
  if (e.key === 'ArrowLeft')   navigateLb(-1);
});

let touchX0 = 0;
lightbox?.addEventListener('touchstart', e => { touchX0 = e.touches[0].clientX; });
lightbox?.addEventListener('touchend',   e => {
  const dx = e.changedTouches[0].clientX - touchX0;
  if (Math.abs(dx) > 50) navigateLb(dx < 0 ? 1 : -1);
});

/* =========================================================
   CITAS ROTATIVAS
   ========================================================= */
function rotateQuote() {
  const el = $('#rotatingQuote');
  if (!el) return;
  let i = 0;
  const update = () => {
    const q = quotes[i++ % quotes.length];
    el.style.cssText = 'opacity:0;transform:translateY(10px);transition:all .5s ease';
    setTimeout(() => {
      el.innerHTML = `<p>"${q.text}"</p><cite>— ${q.author}</cite>`;
      el.style.cssText = 'opacity:1;transform:none;transition:all .5s ease';
    }, 500);
  };
  update();
  setInterval(update, 6000);
}

/* =========================================================
   TOAST
   ========================================================= */
const toastEl = $('#toast');
function toast(msg) {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastEl._t);
  toastEl._t = setTimeout(() => toastEl.classList.remove('show'), 3000);
}

/* =========================================================
   INICIALIZACIÓN
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  generateGrid();
  updateHeroStats();
  rotateQuote();
  setTimeout(() => toast('📷 ¡Bienvenido! Haz clic en 🎵 para escuchar la música de cada recuerdo'), 1400);
});