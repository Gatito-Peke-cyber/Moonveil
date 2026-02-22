/* ============================================================
   Moonveil Portal — Biblioteca de Historias (JS)
   Tema: Editorial oscuro de lujo · Tinta & Pergamino dorado
   ============================================================ */

'use strict';

/* ─────────────────────────────────────
   Configuración
───────────────────────────────────── */
const CONFIG = {
  STORAGE:  'moonveil_stories_v5',
  PER_PAGE: 9,
  IMG_DEFAULT: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600&h=380&fit=crop',
};

/* ─────────────────────────────────────
   Estado global
───────────────────────────────────── */
const state = {
  unlocked:       new Set(),
  story:          null,
  page:           0,
  pagination:     1,
  currentStoryId: null,
  audioPlaying:   false,
  filters: { category: 'all', rarity: 'all', search: '' },
  sort: 'default',
};

/* ─────────────────────────────────────
   Datos de historias (completo del original + extendido)
───────────────────────────────────── */
const STORIES = [
  {
    id: '1',
    title: 'Crónicas del Bosque Esmeralda',
    category: 'Leyendas',
    rarity: 'common',
    locked: true,
    password: 'leyendas2025',
    music: '',
    desc: 'Donde los árboles guardan secretos milenarios y la luz del alba revela caminos olvidados por el tiempo.',
    pages: [
      {
        type: 'text',
        content: `<h3>Capítulo I: El Bosque Despierta</h3>
          <p class="subtitle">"Donde los árboles guardan secretos milenarios"</p>
          <p>Bajo la luz pálida del amanecer, el Bosque Esmeralda comenzaba a despertar. Los primeros rayos de sol filtraban a través del denso follaje, creando patrones de luz y sombra que parecían danzar sobre el musgo milenario.</p>
          <p>Los habitantes más antiguos del lugar, los árboles centenarios, guardaban en sus anillos historias olvidadas por el tiempo. Cada grieta en su corteza era una línea más en el relato del mundo.</p>
          <p>Ari, una joven exploradora de dieciséis años, pisaba por primera vez este territorio prohibido. Sus botas aplastaban suavemente las hojas caídas, produciendo un crujido que parecía despertar ecos dormidos entre las raíces.</p>`
      },
      {
        type: 'image',
        content: {
          img: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&h=500&fit=crop',
          caption: 'Sendero del Bosque Esmeralda al amanecer'
        }
      },
      {
        type: 'text',
        content: `<h3>Capítulo II: La Voz de las Raíces</h3>
          <p class="subtitle">"Algunos mensajes no requieren palabras"</p>
          <p>El camino se volvió más estrecho a medida que avanzaba. Las ramas se entrelazaban sobre su cabeza formando una catedral natural de madera y hoja. Un murmullo constante, casi imperceptible, llenaba el aire.</p>
          <p>No eran pájaros. No era el viento. Era algo más antiguo, más profundo. Las raíces que afloraban a la superficie parecían vibrar con una frecuencia que resonaba en sus huesos.</p>`
      }
    ]
  },
  {
    id: '2',
    title: 'Sand Brill: El Juramento Verde',
    category: 'Crónicas',
    rarity: 'legend',
    locked: true,
    password: 'esmeraldas',
    music: 'ald/music1.mp3',
    desc: 'No toda riqueza pesa en los bolsillos; algunas pesan en el alma. La historia del hombre que hizo un pacto con las piedras.',
    pages: [
      {
        type: 'text',
        content: `<h3>Prólogo: El Brillo que Llama</h3>
          <p class="subtitle">"No toda riqueza pesa en los bolsillos; algunas pesan en el alma"</p>
          <p>Mucho antes de que su nombre fuera susurrado con respeto —o con temor—, Sand Brill ya caminaba con los ojos fijos en un solo color: el verde profundo de las esmeraldas.</p>
          <p>No era simple avaricia. Para él, cada esmeralda era una promesa, un fragmento del mundo que podía ser poseído, contado y protegido… siempre que estuviera en sus manos.</p>
          <p>El día que encontró la primera piedra en el lecho del río Thornwood, su vida se dividió en dos épocas: antes y después de ese momento.</p>`
      },
      {
        type: 'image',
        content: {
          img: 'vill/vill1.jpg',
          caption: 'El mercado donde Sand Brill comerciaba sus hallazgos'
        }
      },
      {
        type: 'text',
        content: `<h3>Capítulo I: El Primer Trato</h3>
          <p class="subtitle">"Todo contrato tiene un precio escondido en la letra pequeña"</p>
          <p>La feria de Kelvmoor era el mejor lugar para vender piedras preciosas sin hacer preguntas. Sand Brill llegó al alba, antes de que el sol calentara los adoquines, con tres esmeraldas envueltas en cuero bajo su capa.</p>
          <p>El comerciante que le ofreció el precio más alto tenía ojos del mismo color que las piedras. Sand Brill lo notó, pero prefirió ignorarlo. Un error que le costaría tres años de su vida.</p>`
      }
    ]
  },
  {
    id: '3',
    title: 'Evil Never Dies',
    category: 'Historia',
    rarity: 'dex',
    locked: true,
    password: 'Sue Tingey',
    music: 'ald/music2.mp3',
    desc: 'Algunas sombras nunca desaparecen, solo esperan pacientemente en los rincones donde la luz no llega.',
    pages: [
      {
        type: 'text',
        content: `<h3>Prólogo: El Eco del Mal</h3>
          <p class="subtitle">"Algunas sombras nunca desaparecen, solo esperan"</p>
          <p>La lluvia golpeaba los cristales de la antigua mansión Blackwood como dedos esqueléticos buscando entrada. En la biblioteca, las llamas de la chimenea proyectaban sombras danzantes sobre retratos cuyos ojos parecían seguir cada movimiento.</p>
          <p>El detective Marcus Vane llevaba tres semanas investigando los sucesos inexplicables que habían vaciado de habitantes el pueblo de Ashford. Tres semanas sin dormir más de dos horas seguidas. Tres semanas mirando por encima del hombro.</p>`
      },
      {
        type: 'image',
        content: {
          img: 'https://images.unsplash.com/photo-1705247492538-bcef75c74f68?q=80&w=1172',
          caption: 'Mansión Blackwood durante la tormenta del equinoccio'
        }
      },
      {
        type: 'text',
        content: `<h3>Capítulo I: El Pueblo Vacío</h3>
          <p class="subtitle">"El silencio más aterrador no es el de la noche, sino el del mediodía"</p>
          <p>Ashford había sido un pueblo próspero. Lo decían las casas bien construidas, los comercios con letreros pintados con cuidado, la iglesia cuya torre se veía desde tres colinas de distancia.</p>
          <p>Ahora todo eso seguía en pie, perfectamente conservado, como un museo abandonado a toda prisa. Las tazas de café a medio beber. La ropa tendida en los alambres. Un juego de cartas a medio terminar sobre una mesa.</p>
          <p>Pero no había nadie. Ni un alma.</p>`
      }
    ]
  },
  {
    id: '4',
    title: 'El Herrero Olvidado',
    category: 'Historias',
    rarity: 'rare',
    locked: true,
    password: 'herrero2020',
    desc: 'En las Montañas Humeantes, donde el eco del martillo nunca cesa, un herrero forja destinos con sus manos curtidas por el fuego.',
    pages: [
      {
        type: 'text',
        content: `<h3>El Yunque del Destino</h3>
          <p class="subtitle">"Donde el metal canta bajo el martillo"</p>
          <p>En lo más profundo de las Montañas Humeantes, donde el eco del martillo nunca cesa, trabajaba Ragnar el Herrero. Sus manos, curtidas por el fuego y el metal, habían forjado más que armas: habían dado forma a destinos.</p>
          <p>Cada espada que salía de su fragua llevaba en el acero una historia. No era magia en el sentido que los magos de la corte entendían: era algo más sutil, más honesto. Era la suma de sudor, concentración y respeto por el material.</p>`
      },
      {
        type: 'image',
        content: {
          img: 'https://images.unsplash.com/photo-1565689157206-0fddef7589a2?w=800&h=500&fit=crop',
          caption: 'La fragua de las Montañas Humeantes al crepúsculo'
        }
      }
    ]
  },
  {
    id: '5',
    title: 'Codex de la Luna Plateada',
    category: 'Codex',
    rarity: 'legend',
    locked: true,
    password: 'luna2025',
    desc: 'Manuscrito sellado por la Orden de los Vigilantes Nocturnos. Contiene conocimientos prohibidos sobre la influencia lunar en la magia arcana.',
    pages: [
      {
        type: 'text',
        content: `<h3>Prólogo: Las Runas Lunares</h3>
          <p class="subtitle">"Manuscrito sellado por la Orden de los Vigilantes Nocturnos"</p>
          <p>Este códice contiene conocimientos prohibidos sobre la influencia lunar en la magia arcana. Escrito en plata líquida sobre pergamino de piel de fénix, cada página emite un tenue brillo azulado.</p>
          <p>Solo aquellos que han superado el Tercer Velo de Comprensión pueden leer estas páginas sin consecuencias. Para los demás, las palabras aparecen como garabatos sin sentido, como si el propio manuscrito eligiera a sus lectores.</p>
          <p>Si puedes leer esto, has sido elegido. Que la luna guíe tu comprensión.</p>`
      }
    ]
  },
  {
    id: '6',
    title: 'Manual DEX: Teoría Cromática',
    category: 'Dex',
    rarity: 'dex',
    locked: true,
    password: 'Dex2025',
    desc: 'Cuando los colores dejan de ser luz y se convierten en poder. Guía completa del sistema de magia cromática de Moonveil.',
    pages: [
      {
        type: 'text',
        content: `<h3>Introducción a la Magia Cromática</h3>
          <p class="subtitle">"Cuando los colores dejan de ser luz y se convierten en poder"</p>
          <p>La magia cromática opera bajo el principio de que cada color del espectro contiene una energía única que puede ser manipulada por aquellos con la sensibilidad adecuada.</p>
          <p>El rojo evoca pasión y destrucción controlada. El azul, calma y precognición. El verde, vida y sanación. Pero el espectro completo, combinado en proporciones exactas, produce el fenómeno conocido como DEX: la vibración de todos los colores simultáneos.</p>
          <p>Dominar el DEX requiere años de práctica y, según los textos más antiguos, una predisposición innata que no puede enseñarse, solo despertarse.</p>`
      }
    ]
  },
  {
    id: '7',
    title: 'La Torre de los Vientos',
    category: 'Leyendas',
    rarity: 'epic',
    locked: true,
    password: 'vientos2025',
    desc: 'En la cima de la montaña más alta del reino, una torre de piedra negra guarda el secreto de cómo el mundo dejó de cantar.',
    pages: [
      {
        type: 'text',
        content: `<h3>La Torre que Escucha</h3>
          <p class="subtitle">"El viento recuerda todo lo que el tiempo olvida"</p>
          <p>Nadie sabía con certeza cuándo había sido construida la Torre de los Vientos. Los registros más antiguos del reino ya la mencionaban como una estructura anterior, heredada de civilizaciones cuyo nombre se perdió antes de ser escrito.</p>
          <p>Lo que todos sabían —o creían saber— era que la torre escuchaba. No metafóricamente. Literalmente. Si te acercabas a cualquiera de sus cuatro ventanas orientadas hacia los puntos cardinales y susurrabas un secreto, el viento lo llevaba… a algún lugar.</p>`
      },
      {
        type: 'image',
        content: {
          img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=500&fit=crop',
          caption: 'Vista de la cima donde se alza la Torre de los Vientos'
        }
      }
    ]
  },
];

/* ─────────────────────────────────────
   Rareza: utilidades
───────────────────────────────────── */
const RARITY_ORDER = { common:1, rare:2, special:3, epic:4, mythic:5, legend:6, dex:7 };
const RARITY_NAMES = { common:'Común', rare:'Rara', special:'Especial', epic:'Épica', mythic:'Mítica', legend:'Legendaria', dex:'DEX' };
const RARITY_COLORS = {
  common:  '#9ca3af', rare:  '#60a5fa', special: '#a78bfa',
  epic:    '#c084fc', mythic:'#fbbf24', legend:  '#f87171', dex: '#fff'
};
const rarityName  = r => RARITY_NAMES[r] || r;
const rarityColor = r => RARITY_COLORS[r] || '#fff';

/* ─────────────────────────────────────
   DOM helpers
───────────────────────────────────── */
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

/* ─────────────────────────────────────
   Persistencia
───────────────────────────────────── */
function save() {
  try { localStorage.setItem(CONFIG.STORAGE, JSON.stringify({ unlocked: [...state.unlocked] })) } catch(e) {}
}
function loadStorage() {
  try {
    const d = JSON.parse(localStorage.getItem(CONFIG.STORAGE) || '{}');
    if (d.unlocked) state.unlocked = new Set(d.unlocked);
  } catch(e) {}
}

/* ─────────────────────────────────────
   RENDER principal
───────────────────────────────────── */
function render() {
  renderStats();
  renderCategoryChips();
  renderGrid();
}

/* ─────────────────────────────────────
   Stats del hero
───────────────────────────────────── */
function renderStats() {
  const total    = STORIES.length;
  const unlocked = STORIES.filter(s => !s.locked || state.unlocked.has(s.id)).length;
  const locked   = total - unlocked;
  const pages    = STORIES.reduce((sum, s) => sum + s.pages.length, 0);
  const pct      = total ? (unlocked / total * 100) : 0;

  animCount('st-total',    total);
  animCount('st-unlocked', unlocked);
  animCount('st-locked',   locked);
  animCount('st-pages',    pages);

  const fill = $('#progressFill');
  if (fill) fill.style.width = pct + '%';

  const lbl = $('#progressLabel');
  if (lbl) lbl.textContent = `${Math.round(pct)}% completado`;

  const yearEl = $('#y');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

let _animTimers = {};
function animCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  clearInterval(_animTimers[id]);
  let cur = 0;
  const step = Math.max(1, Math.ceil(target / 40));
  _animTimers[id] = setInterval(() => {
    cur = Math.min(cur + step, target);
    el.textContent = cur;
    if (cur >= target) clearInterval(_animTimers[id]);
  }, 20);
}

/* ─────────────────────────────────────
   Chips de categoría
───────────────────────────────────── */
function renderCategoryChips() {
  const cats = ['all', ...new Set(STORIES.map(s => s.category))];
  const container = $('#catChips');
  if (!container) return;
  container.innerHTML = cats.map(c => {
    const label  = c === 'all' ? 'Todas' : c;
    const active = state.filters.category === c ? ' active' : '';
    return `<button class="fchip fchip-all${active}" data-cat="${c}">${label}</button>`;
  }).join('');
  container.addEventListener('click', e => {
    const btn = e.target.closest('[data-cat]');
    if (!btn) return;
    state.filters.category = btn.dataset.cat;
    state.pagination = 1;
    $$('#catChips .fchip').forEach(b => b.classList.toggle('active', b === btn));
    renderGrid();
  });
}

/* ─────────────────────────────────────
   Grid de historias
───────────────────────────────────── */
function getFiltered() {
  let list = STORIES.filter(s => {
    if (state.filters.category !== 'all' && s.category !== state.filters.category) return false;
    if (state.filters.rarity   !== 'all' && s.rarity   !== state.filters.rarity)   return false;
    if (state.filters.search) {
      const q = state.filters.search.toLowerCase();
      if (!s.title.toLowerCase().includes(q) &&
          !s.category.toLowerCase().includes(q) &&
          !(s.desc || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  switch (state.sort) {
    case 'title-az':     list = list.slice().sort((a,b) => a.title.localeCompare(b.title)); break;
    case 'title-za':     list = list.slice().sort((a,b) => b.title.localeCompare(a.title)); break;
    case 'pages-desc':   list = list.slice().sort((a,b) => b.pages.length - a.pages.length); break;
    case 'rarity':       list = list.slice().sort((a,b) => (RARITY_ORDER[b.rarity]||0) - (RARITY_ORDER[a.rarity]||0)); break;
    case 'unlocked':     list = list.slice().sort((a,b) => {
      const ua = !a.locked || state.unlocked.has(a.id);
      const ub = !b.locked || state.unlocked.has(b.id);
      return ub - ua;
    }); break;
  }
  return list;
}

function renderGrid() {
  const grid = $('#storiesGrid');
  if (!grid) return;

  const filtered = getFiltered();
  const total    = Math.ceil(filtered.length / CONFIG.PER_PAGE);
  if (state.pagination > total) state.pagination = Math.max(1, total);
  const start  = (state.pagination - 1) * CONFIG.PER_PAGE;
  const slice  = filtered.slice(start, start + CONFIG.PER_PAGE);

  const countEl = $('#resultsCount');
  if (countEl) countEl.textContent = `${filtered.length} historia${filtered.length !== 1 ? 's' : ''}`;

  if (!slice.length) {
    grid.innerHTML = `<div class="lib-empty">
      <div class="lib-empty-ico">📚</div>
      <h3>Sin resultados</h3>
      <p>Prueba con otros filtros o busca otro término</p>
    </div>`;
    renderPagination(0);
    return;
  }

  grid.innerHTML = slice.map((s, i) => buildCard(s, i)).join('');
  renderPagination(total);
  setupCardEvents();
}

/* ─────────────────────────────────────
   Construcción de tarjeta
───────────────────────────────────── */
function buildCard(s, idx) {
  const unlocked = !s.locked || state.unlocked.has(s.id);
  const img   = s.pages.find(p => p.type === 'image')?.content?.img || CONFIG.IMG_DEFAULT;
  const desc  = (s.desc || stripTags(s.pages.find(p => p.type === 'text')?.content || '').slice(0, 110) + '…');
  const color = rarityColor(s.rarity);
  const delay = `${idx * 0.07}s`;

  return `
  <div class="story-card ${!unlocked ? 'locked' : ''}" data-id="${s.id}"
       style="--rarity-color:${color}; animation-delay:${delay}">
    <div class="card-cover">
      <img src="${img}" alt="${s.title}" loading="lazy"
           onerror="this.src='${CONFIG.IMG_DEFAULT}'"/>
      <div class="card-cover-overlay"></div>
      <div class="card-top-row">
        <span class="rarity-badge rb-${s.rarity}">${rarityName(s.rarity)}</span>
        ${!unlocked ? '<span class="lock-badge">🔒</span>' : '<span class="lock-badge">🔓</span>'}
      </div>
      <div class="card-cat-row">
        <span class="cat-tag">${s.category}</span>
      </div>
    </div>
    <div class="card-body">
      <h3 class="card-title">${s.title}</h3>
      <p class="card-desc">${desc}</p>
      <div class="card-divider"><span class="div-diamond">◆</span></div>
      <div class="card-meta">
        <span>📖 ${s.pages.length} pág.</span>
        ${s.music ? '<span>🎵 Audio</span>' : ''}
        <span style="color:${color};font-weight:600">${rarityName(s.rarity)}</span>
      </div>
    </div>
    <div class="card-foot">
      <button class="btn-read" data-action="read" data-id="${s.id}">
        ${!unlocked ? '🔓 Desbloquear' : '📖 Leer'}
      </button>
      <button class="btn-info-card" data-action="info" data-id="${s.id}" title="Info">ℹ️</button>
    </div>
  </div>`;
}

function setupCardEvents() {
  $$('[data-action]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = btn.dataset.id;
      if (btn.dataset.action === 'read') readStory(id);
      if (btn.dataset.action === 'info') showInfo(id);
    });
  });
}

/* ─────────────────────────────────────
   Paginación
───────────────────────────────────── */
function renderPagination(total) {
  const pg = $('#pagination');
  if (!pg) return;
  if (total <= 1) { pg.innerHTML = ''; return; }

  const p = state.pagination;
  let html = `<button class="pgbtn" onclick="goPage(${p-1})" ${p===1?'disabled':''}>←</button>`;
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - p) <= 1) {
      html += `<button class="pgbtn ${i===p?'active':''}" onclick="goPage(${i})">${i}</button>`;
    } else if (i === p-2 || i === p+2) {
      html += '<span style="color:var(--dim);padding:0 4px">…</span>';
    }
  }
  html += `<button class="pgbtn" onclick="goPage(${p+1})" ${p===total?'disabled':''}>→</button>`;
  pg.innerHTML = html;
}

function goPage(p) {
  const total = Math.ceil(getFiltered().length / CONFIG.PER_PAGE);
  if (p < 1 || p > total) return;
  state.pagination = p;
  renderGrid();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ─────────────────────────────────────
   LEER historia
───────────────────────────────────── */
function readStory(id) {
  const s = STORIES.find(x => x.id === id);
  if (!s) return;

  if (s.locked && !state.unlocked.has(id)) {
    openUnlock(id);
    return;
  }

  state.story = s;
  state.page  = 0;
  state.currentStoryId = id;

  const ttlEl  = $('#modalTitle');
  const metaEl = $('#modalMeta');
  const rarEl  = $('#modalRarityTag');

  if (ttlEl)  ttlEl.textContent  = s.title;
  if (metaEl) metaEl.textContent = `${rarityName(s.rarity)} · ${s.category} · ${s.pages.length} páginas`;
  if (rarEl) {
    rarEl.textContent  = rarityName(s.rarity);
    rarEl.className    = `modal-rarity-tag rb-${s.rarity}`;
    rarEl.style.color  = rarityColor(s.rarity);
    rarEl.style.background = rarityColor(s.rarity) + '22';
    rarEl.style.borderColor= rarityColor(s.rarity) + '55';
  }

  updateBookPages();
  openModal('storyModal');

  if (s.music) {
    const audio = $('#audioPlayer');
    audio.src  = s.music;
    audio.loop = true;
    audio.play().catch(() => {});
    syncAudioDock(s.music, true);
  }
}

function updateBookPages() {
  const s   = state.story;
  const lEl = $('#leftPage');
  const rEl = $('#rightPage');
  const curEl = $('#curPage');
  const totEl = $('#totPage');
  const prev  = $('#prevBtn');
  const next  = $('#nextBtn');

  if (lEl) lEl.innerHTML = renderPageContent(s.pages[state.page]);
  if (rEl) rEl.innerHTML = renderPageContent(s.pages[state.page + 1]);

  const displayPage = Math.floor(state.page / 2) + 1;
  const totalPages  = Math.ceil(s.pages.length / 2);

  if (curEl) curEl.textContent = displayPage;
  if (totEl) totEl.textContent = totalPages;
  if (prev)  prev.disabled = state.page === 0;
  if (next)  next.disabled = state.page + 2 >= s.pages.length;
}

function renderPageContent(p) {
  if (!p) return `<div style="display:grid;place-items:center;height:100%;color:#9a8f7e;font-style:italic;font-family:'Cormorant Garamond',serif">— Fin —</div>`;
  if (p.type === 'text') return p.content;
  return `
    <img src="${p.content.img}" alt="${p.content.caption || ''}"
         onerror="this.src='${CONFIG.IMG_DEFAULT}'"
         style="width:100%;border-radius:8px;margin-bottom:12px"/>
    ${p.content.caption ? `<p class="img-caption">${p.content.caption}</p>` : ''}`;
}

function nextPage() {
  if (!state.story) return;
  if (state.page + 2 < state.story.pages.length) {
    state.page += 2;
    animPageTurn();
    updateBookPages();
  }
}

function prevPage() {
  if (!state.story) return;
  if (state.page > 0) {
    state.page -= 2;
    animPageTurn();
    updateBookPages();
  }
}

function animPageTurn() {
  const wrap = $('#bookWrap');
  if (!wrap) return;
  wrap.style.transition = 'transform .18s ease';
  wrap.style.transform  = 'scaleX(.97)';
  setTimeout(() => { wrap.style.transform = 'scaleX(1)'; }, 180);
}

/* ─────────────────────────────────────
   DESBLOQUEO
───────────────────────────────────── */
function openUnlock(id) {
  const s = STORIES.find(x => x.id === id);
  if (!s) return;
  state.currentStoryId = id;

  const nameEl = $('#unlockName');
  if (nameEl) nameEl.textContent = `"${s.title}"`;

  const inp = $('#passwordInput');
  if (inp) { inp.value = ''; inp.type = 'password'; }

  openModal('unlockModal');
  setTimeout(() => inp?.focus(), 180);
}

function attemptUnlock() {
  const s = STORIES.find(x => x.id === state.currentStoryId);
  if (!s) return;
  const inp  = $('#passwordInput');
  const pass = inp?.value.trim() ?? '';

  if (s.password && pass !== s.password) {
    showToast('Contraseña incorrecta', 'error');
    inp?.animate([
      { transform:'translateX(0)' }, { transform:'translateX(-8px)' },
      { transform:'translateX(8px)'}, { transform:'translateX(0)' }
    ], { duration:400, iterations:2 });
    return;
  }

  state.unlocked.add(s.id);
  save();
  closeModal('unlockModal');
  showToast(`¡"${s.title}" desbloqueada!`, 'success');
  render();
  setTimeout(() => readStory(s.id), 500);
}

/* ─────────────────────────────────────
   INFO modal
───────────────────────────────────── */
function showInfo(id) {
  const s = STORIES.find(x => x.id === id);
  if (!s) return;
  state.currentStoryId = id;

  const unlocked = !s.locked || state.unlocked.has(id);
  const img = s.pages.find(p => p.type === 'image')?.content?.img || CONFIG.IMG_DEFAULT;

  const cover = $('#infoCoverImg');
  if (cover) {
    cover.style.background = `linear-gradient(to bottom, rgba(6,6,10,.05), rgba(6,6,10,.5)), url('${img}') center/cover no-repeat`;
  }

  setText('infoTitle',  s.title);
  const rarEl  = $('#infoRarityTag');
  const catEl  = $('#infoCategoryTag');
  if (rarEl) { rarEl.textContent = rarityName(s.rarity); rarEl.style.color = rarityColor(s.rarity) }
  if (catEl) { catEl.textContent = s.category }

  setText('iPages',  s.pages.length);
  setText('iAudio',  s.music ? 'Sí 🎵' : 'No');
  setText('iStatus', unlocked ? 'Desbloqueada 🔓' : 'Bloqueada 🔒');
  const lockIco = $('#iLockIco');
  if (lockIco) lockIco.textContent = unlocked ? '🔓' : '🔒';

  const descText = s.desc || stripTags(s.pages.find(p => p.type === 'text')?.content || '').slice(0, 200) + '…';
  setText('iDesc', descText);

  openModal('infoModal');
}

/* ─────────────────────────────────────
   Audio Dock
───────────────────────────────────── */
function syncAudioDock(title = '', playing = false) {
  const dock = $('#audioDock');
  const titleEl = $('#audioTitle');
  const playBtn = $('#playBtn');
  if (dock)    dock.classList.toggle('playing', playing);
  if (titleEl) titleEl.textContent = title ? title.split('/').pop().replace('.mp3','') : 'Sin música';
  if (playBtn) playBtn.textContent = playing ? '⏸' : '▶';
}

/* ─────────────────────────────────────
   Modales
───────────────────────────────────── */
function openModal(id) {
  const el = $(`#${id}`);
  if (!el) return;
  el.classList.add('open');
  el.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  const el = $(`#${id}`);
  if (!el) return;
  el.classList.remove('open');
  el.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  if (id === 'storyModal') {
    const a = $('#audioPlayer');
    if (a) { a.pause(); a.currentTime = 0; }
    syncAudioDock('', false);
  }
}

/* ─────────────────────────────────────
   Toast
───────────────────────────────────── */
let _toastTimer;
function showToast(msg, type = 'success') {
  const el = $('#toast');
  if (!el) return;
  el.textContent = msg;
  el.className   = `toast ${type} show`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

/* ─────────────────────────────────────
   Canvas de partículas (tinta flotante)
───────────────────────────────────── */
function setupCanvas() {
  const canvas = $('#bgCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = Math.max(1, devicePixelRatio || 1);
  let w, h, pts;

  const init = () => {
    w = canvas.width  = innerWidth  * dpr;
    h = canvas.height = innerHeight * dpr;
    pts = Array.from({ length: 55 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: (.4 + Math.random() * 1.4) * dpr,
      s: .12 + Math.random() * .42,
      a: .03 + Math.random() * .11,
      /* mezcla de tonos dorados/sepia/amber */
      hue: 30 + Math.random() * 25,
      sat: 55 + Math.random() * 35,
    }));
  };

  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    pts.forEach(p => {
      p.y -= p.s;
      p.x += Math.sin(p.y * .0015 + p.hue) * .35;
      if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue},${p.sat}%,60%,${p.a})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  };
  init(); draw();
  addEventListener('resize', init);
}

/* ─────────────────────────────────────
   Parallax del fondo
───────────────────────────────────── */
function setupParallax() {
  const layers = $$('.layer');
  const k = [0, .015, .04, .075];
  const fn = () => layers.forEach((l, i) => l.style.transform = `translateY(${scrollY * k[i]}px)`);
  fn(); addEventListener('scroll', fn, { passive: true });
}

/* ─────────────────────────────────────
   Reveal on scroll
───────────────────────────────────── */
function setupReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); obs.unobserve(e.target); }
    });
  }, { threshold: .08 });
  $$('.reveal').forEach(el => obs.observe(el));
}

/* ─────────────────────────────────────
   Navbar
───────────────────────────────────── */
function setupNavbar() {
  const toggle = $('#navToggle');
  const links  = $('#navLinks');
  toggle?.addEventListener('click', e => { e.stopPropagation(); links?.classList.toggle('open'); });
  document.addEventListener('click', e => {
    if (!toggle?.contains(e.target) && !links?.contains(e.target)) links?.classList.remove('open');
  });
  $$('.hud-bar').forEach(b => b.style.setProperty('--v', b.dataset.val || 50));
}

/* ─────────────────────────────────────
   Bindings de eventos
───────────────────────────────────── */
function setupEvents() {
  /* Búsqueda */
  let searchTimer;
  $('#searchInput')?.addEventListener('input', e => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.filters.search = e.target.value.trim();
      state.pagination = 1;
      renderGrid();
    }, 280);
  });

  /* Chips de rareza */
  $('#rarChips')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-rar]');
    if (!btn) return;
    state.filters.rarity = btn.dataset.rar;
    state.pagination = 1;
    $$('#rarChips .fchip').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderGrid();
  });

  /* Sort */
  $('#sortSelect')?.addEventListener('change', e => {
    state.sort = e.target.value;
    state.pagination = 1;
    renderGrid();
  });

  /* Botones del modal libro */
  $('#nextBtn')?.addEventListener('click', nextPage);
  $('#prevBtn')?.addEventListener('click', prevPage);

  /* Cerrar modales (overlay y X) */
  $('#storyOverlay')?.addEventListener('click', () => closeModal('storyModal'));
  $('#closeStory')?.addEventListener('click',   () => closeModal('storyModal'));
  $('#unlockOverlay')?.addEventListener('click', () => closeModal('unlockModal'));
  $('#cancelUnlock')?.addEventListener('click',  () => closeModal('unlockModal'));
  $('#infoOverlay')?.addEventListener('click',   () => closeModal('infoModal'));
  $('#closeInfo')?.addEventListener('click',     () => closeModal('infoModal'));

  /* Botones del modal desbloqueo */
  $('#unlockBtn')?.addEventListener('click', attemptUnlock);
  $('#eyeToggle')?.addEventListener('click', () => {
    const inp = $('#passwordInput');
    if (!inp) return;
    inp.type = inp.type === 'password' ? 'text' : 'password';
  });

  /* Botón leer desde modal info */
  $('#readInfoBtn')?.addEventListener('click', () => {
    closeModal('infoModal');
    readStory(state.currentStoryId);
  });

  /* Audio dock */
  $('#playBtn')?.addEventListener('click', () => {
    const a = $('#audioPlayer');
    if (!a) return;
    a.paused ? a.play().catch(() => {}) : a.pause();
    syncAudioDock(a.src, !a.paused);
  });
  $('#muteBtn')?.addEventListener('click', () => {
    const a = $('#audioPlayer');
    if (!a) return;
    a.muted = !a.muted;
    const btn = $('#muteBtn');
    if (btn) btn.textContent = a.muted ? '🔇' : '🔊';
  });
  $('#audioPlayer')?.addEventListener('play',  () => syncAudioDock($('#audioPlayer').src, true));
  $('#audioPlayer')?.addEventListener('pause', () => syncAudioDock($('#audioPlayer').src, false));

  /* Vault / bóveda decorativa — hero clic */
  /* Teclado */
  document.addEventListener('keydown', e => {
    if ($('#storyModal')?.classList.contains('open')) {
      if (e.key === 'ArrowRight') nextPage();
      if (e.key === 'ArrowLeft')  prevPage();
      if (e.key === 'Escape')     closeModal('storyModal');
    }
    if ($('#unlockModal')?.classList.contains('open')) {
      if (e.key === 'Enter')  attemptUnlock();
      if (e.key === 'Escape') closeModal('unlockModal');
    }
    if ($('#infoModal')?.classList.contains('open')) {
      if (e.key === 'Escape') closeModal('infoModal');
    }
  });
}

/* ─────────────────────────────────────
   Helpers
───────────────────────────────────── */
function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
function stripTags(html)  { return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }

/* ─────────────────────────────────────
   INIT
───────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  loadStorage();
  setupCanvas();
  setupParallax();
  setupReveal();
  setupNavbar();
  setupEvents();
  render();
  console.log('📚 Moonveil Biblioteca — Cargada');
});

/* Exponer goPage globalmente para los botones de paginación */
window.goPage = goPage;