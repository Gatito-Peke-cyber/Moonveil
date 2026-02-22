'use strict';
/* ==============================================
   Moonveil — Investigaciones (JS)
   Sistema completo de investigación con:
   - Votos verdadero/falso por caso
   - Countdown con días/horas/minutos/segundos
   - Casos expirados bloqueados
   - Historial de votos en localStorage
   - Filtros: activos, por expirar, expirados, votados, sin votar
   - Modal de detalle con votación
   - Caso destacado desde URL ?id=
   ============================================== */

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const STORAGE_VOTES = 'mv_inv_votes_v1';
const EXPIRING_THRESHOLD_HOURS = 24; // si faltan ≤24h se considera "por expirar"

/* ══════════════════════════════
   BASE DE DATOS DE CASOS
   Cada caso tiene:
   - id: debe coincidir con la noticia si viene de noticias
   - deadline: null = sin expiración | Date ISO string
   - votes: objeto con totales iniciales (pueden ser 0)
   ══════════════════════════════ */
const CASES = [
  {
    id: 'n1',
    title: 'El Animal Sin Nombre',
    desc: 'En la aldea, un grupo de aldeanos aseguró haber visto un extraño animal entre los árboles. Algunos dicen que no se ve nada cuando se acercan demasiado. ¿La criatura realmente existe o es una alucinación colectiva?',
    longDesc: 'Cinco aldeanos de distintos hogares reportaron de forma independiente haber avistado una criatura de mediano tamaño moviéndose entre la línea de árboles al amanecer. Las descripciones varían: algunos hablan de un animal parecido a un gato pero del tamaño de un zorro; otros mencionan que brilla levemente. Ninguno logró acercarse más de 20 bloques antes de que la criatura "desapareciera".',
    author: '█████ █████',
    section: 'A',
    categories: ['biomas', 'exploración'],
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 días
    votes: { true: 14, false: 7 },
    clues: ['Cinco testigos independientes', 'Las huellas encontradas no corresponden a ninguna especie conocida', 'La criatura solo fue vista al amanecer'],
    verdict: null,
  },
  {
    id: 'n2',
    title: 'Imágenes animadas en los registros',
    desc: '¿Por qué algunos archivos del reino muestran imágenes que se mueven solas? Los escribas están desconcertados.',
    longDesc: 'Tres pergaminos del archivo central del reino fueron reportados como "activos": las ilustraciones en su interior parecen moverse. El archivero mayor descartó la posibilidad de magia menor. Un experto en runas indicó que podría ser una forma de magia documental avanzada, pero nadie ha podido confirmar o negar el fenómeno.',
    author: '?',
    section: 'B',
    categories: ['magia', 'pueblos'],
    deadline: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(), // 18 horas (por expirar pronto)
    votes: { true: 5, false: 22 },
    clues: ['Los pergaminos solo se activan con luz solar directa', 'Dos de los tres fueron escritos por el mismo escriba', 'El escriba desapareció hace tres semanas'],
    verdict: null,
  },
  {
    id: 'n3',
    title: 'El Allay Dorado',
    desc: 'Se dice haber avistado un allay dorado sobrevolando los campos del este. ¿Existe realmente?',
    longDesc: 'El allay dorado es considerado una variante de leyenda. Solo existe en dos registros históricos y ambos son considerados apócrifos. Sin embargo, tres cazadores que operaban en la región este del reino reportaron haberlo visto sobrevolando a gran altura. Uno de ellos afirma que cantaba una melodía que nunca había escuchado.',
    author: 'Orik Vall',
    section: 'A',
    categories: ['exploración'],
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 días
    votes: { true: 31, false: 12 },
    clues: ['Tres cazadores con testimonios similares', 'No hay imágenes ni evidencia física', 'Los allay dorados aparecen en textos del año 3 del reino'],
    verdict: null,
  },
  {
    id: 'n6',
    title: 'Aldeas Subterráneas',
    desc: 'Debajo del suelo que pisamos hay una red de aldeas habitadas. ¿Es esto posible?',
    longDesc: 'Un minero que excavaba en dirección sur a 40 bloques de profundidad afirma haber escuchado voces y música proveniente de una dirección lateral. Cuando siguió el sonido, encontró lo que describió como "calles de roca pulida con antorchas y ollas de cocina activas". Cuando intentó entrar, algo lo repelió y se despertó en la superficie.',
    author: 'S███',
    section: 'A',
    categories: ['pueblos', 'oficios'],
    deadline: null, // sin expiración
    votes: { true: 48, false: 19 },
    clues: ['El minero regresó con polvo en sus botas que no corresponde a ninguna roca de la región', 'Su pico tenía marcas de desgaste inusual', 'Tres mineros de otras regiones reportaron experiencias similares'],
    verdict: null,
  },
  {
    id: 'n7',
    title: 'Los Ajolotes contra los Peces',
    desc: 'Los ajolotes están atacando sistemáticamente a los peces. ¿Es un comportamiento nuevo o siempre fue así?',
    longDesc: 'Los pescadores del río Bluestream reportan que en los últimos 14 días la población de peces cayó un 70%. Los ajolotes han sido vistos cazando en grupos, comportamiento nunca antes observado. Un biólogo del reino indica que esto podría ser un cambio de comportamiento provocado por una alteración en el ecosistema.',
    author: 'Nox Vire',
    section: 'B',
    categories: ['exploración', 'biomas'],
    deadline: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // EXPIRADO hace 2h
    votes: { true: 67, false: 8 },
    clues: ['El río presentó coloración inusual 2 semanas antes', 'Los ajolotes se mueven en grupos de 6 a 8', 'No se han encontrado cadáveres de peces, solo desaparecen'],
    verdict: 'true', // ya tiene veredicto
  },
  {
    id: 'n9',
    title: 'La Invasión de las Ranas',
    desc: 'Ranas por doquier. ¿Hay alguna causa sobrenatural o es simplemente sobrepoblación?',
    longDesc: 'Los granjeros de la región central han perdido entre el 30% y el 50% de sus cultivos en los últimos 7 días. Las ranas aparecieron de la noche a la mañana, sin patrón de migración conocido. El chamán del pueblo afirma que el comportamiento no es natural, que "alguien las llamó".',
    author: 'Edson Villa',
    section: 'A',
    categories: ['pueblos', 'oficios'],
    deadline: new Date(Date.now() + 11 * 60 * 60 * 1000).toISOString(), // 11 horas (por expirar)
    votes: { true: 23, false: 41 },
    clues: ['Las ranas no comen los cultivos que bordean el bosque del norte', 'Todas las ranas tienen el mismo patrón dorsal inusual', 'El chamán desapareció después de dar su declaración'],
    verdict: null,
  },
  {
    id: 'n10',
    title: 'Nuevas Variantes de Animales',
    desc: 'Variantes nunca antes vistas de animales conocidos. ¿Evolución natural o intervención?',
    longDesc: 'Los cronistas del reino han catalogado 7 nuevas variantes de animales domésticos y salvajes en los últimos dos meses: vacas con manchas en forma de runas, ovejas con lana iridiscente, gallinas que ponen huevos que brillan de noche. Los magos de la corte investigan si hay un origen arcano.',
    author: 'Sev Ark',
    section: 'B',
    categories: ['exploración'],
    deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 días
    votes: { true: 88, false: 11 },
    clues: ['Las variantes aparecieron primero cerca del Lago Opalino', 'Los animales afectados no se reproducen con animales normales', 'Un mago encontró rastros de magia de transformación en la zona'],
    verdict: null,
  },
];

/* ── Estado ── */
const iState = {
  filter: 'all',
  search: '',
  votes: {},   // { [caseId]: 'true' | 'false' }
  voteTimes: {}, // { [caseId]: ISO string }
};

/* ── localStorage ── */
function loadVotes() {
  try {
    const d = JSON.parse(localStorage.getItem(STORAGE_VOTES) || '{}');
    iState.votes = d.votes || {};
    iState.voteTimes = d.voteTimes || {};
  } catch(e) {}
}
function saveVotes() {
  try { localStorage.setItem(STORAGE_VOTES, JSON.stringify({ votes: iState.votes, voteTimes: iState.voteTimes })); } catch(e) {}
}

/* ── Canvas ── */
function setupCanvas() {
  const cv = $('#bgCanvas'); if (!cv) return;
  const ctx = cv.getContext('2d');
  const dpr = Math.max(1, devicePixelRatio || 1);
  let w, h, pts;
  const init = () => {
    w = cv.width  = innerWidth  * dpr;
    h = cv.height = innerHeight * dpr;
    pts = Array.from({length:55}, () => ({
      x:Math.random()*w, y:Math.random()*h,
      r:(.3+Math.random()*1.2)*dpr, s:.1+Math.random()*.45,
      a:.04+Math.random()*.1, hue:140+Math.random()*25,
    }));
  };
  const draw = () => {
    ctx.clearRect(0,0,w,h);
    pts.forEach(p => {
      p.y -= p.s; p.x += Math.sin(p.y*.002)*.3;
      if (p.y<-10){p.y=h+10;p.x=Math.random()*w;}
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`hsla(${p.hue},80%,55%,${p.a})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  };
  init(); draw(); addEventListener('resize', init);
}

/* ── Utilidades de tiempo ── */
function getRemainingMs(deadline) {
  if (!deadline) return Infinity;
  return new Date(deadline).getTime() - Date.now();
}
function isExpired(c) { return getRemainingMs(c.deadline) <= 0; }
function isExpiring(c) {
  const ms = getRemainingMs(c.deadline);
  return ms > 0 && ms <= EXPIRING_THRESHOLD_HOURS * 3600 * 1000;
}
function formatCountdown(ms) {
  if (ms <= 0) return null;
  const totalS = Math.floor(ms / 1000);
  const d = Math.floor(totalS / 86400);
  const h = Math.floor((totalS % 86400) / 3600);
  const m = Math.floor((totalS % 3600) / 60);
  const s = totalS % 60;
  return { d, h, m, s };
}

/* ── Stats hero ── */
const _nt = {};
function animN(id, target) {
  const el = document.getElementById(id); if (!el) return;
  clearInterval(_nt[id]); let c=0;
  _nt[id]=setInterval(()=>{c=Math.min(c+Math.max(1,Math.ceil(target/30)),target);el.textContent=c;if(c>=target)clearInterval(_nt[id]);},25);
}
function updateHeroStats() {
  const open     = CASES.filter(c=>!isExpired(c)).length;
  const expiring = CASES.filter(isExpiring).length;
  const expired  = CASES.filter(isExpired).length;
  const voted    = Object.keys(iState.votes).length;
  animN('isTotal',   CASES.length);
  animN('isOpen',    open);
  animN('isExpiring',expiring);
  animN('isExpired', expired);
  animN('isVoted',   voted);
}

/* ── Filtrado ── */
function getFiltered() {
  return CASES.filter(c => {
    const q = iState.search.toLowerCase();
    const txtOk = !q || `${c.title} ${c.desc} ${c.author} ${c.categories.join(' ')}`.toLowerCase().includes(q);
    const exp = isExpired(c);
    const expg = isExpiring(c);
    const myVote = iState.votes[c.id];
    let fOk = false;
    switch(iState.filter) {
      case 'all':      fOk = true; break;
      case 'open':     fOk = !exp; break;
      case 'expiring': fOk = expg; break;
      case 'expired':  fOk = exp; break;
      case 'voted':    fOk = !!myVote; break;
      case 'unvoted':  fOk = !myVote && !exp; break;
      default:         fOk = true;
    }
    return fOk && txtOk;
  });
}

/* ── Votar ── */
function voteCase(caseId, verdict) {
  const c = CASES.find(x=>x.id===caseId); if (!c) return;
  if (isExpired(c)) { showToast('Este caso ha expirado. No se puede votar.', 'error'); return; }
  const prev = iState.votes[caseId];
  if (prev) {
    if (prev === verdict) { showToast('Ya votaste esta opción en este caso.', 'warn'); return; }
    // Cambiar voto
    const prevKey = prev === 'true' ? 'true' : 'false';
    const newKey  = verdict === 'true' ? 'true' : 'false';
    c.votes[prevKey] = Math.max(0, c.votes[prevKey] - 1);
    c.votes[newKey]++;
    showToast('Voto cambiado correctamente.', 'info');
  } else {
    c.votes[verdict === 'true' ? 'true' : 'false']++;
    showToast(verdict === 'true' ? '✅ Votaste: VERDADERO' : '❌ Votaste: FALSO', 'success');
  }
  iState.votes[caseId]  = verdict;
  iState.voteTimes[caseId] = new Date().toISOString();
  saveVotes();
  updateHeroStats();
  renderGrid();
  renderVoteLog();
  // Actualizar modal si está abierto
  if ($('#caseModal.open') && _openModalId === caseId) openCaseModal(caseId);
}

/* ── Build countdown HTML (pequeño) ── */
function buildCountdownHTML(c) {
  const exp = isExpired(c);
  const expg= isExpiring(c);
  if (!c.deadline) {
    return `<div class="cc-countdown"><div class="cdt-label"><span class="cdt-dot"></span>Sin fecha límite</div></div>`;
  }
  if (exp) {
    return `<div class="cc-countdown is-expired-box">
      <div class="cdt-label"><span class="cdt-dot expired"></span>CASO CERRADO — EXPIRADO</div>
      ${c.verdict ? `<div style="font-family:var(--mono);font-size:.7rem;color:var(--green);margin-top:4px">Veredicto: ${c.verdict==='true'?'✅ VERDADERO':'❌ FALSO'}</div>` : ''}
    </div>`;
  }
  const ms = getRemainingMs(c.deadline);
  const t  = formatCountdown(ms);
  const cls = expg ? 'is-expiring-box' : '';
  const unitCls = expg ? 'expiring' : '';
  const numStyle = expg ? 'color:var(--amber)' : '';
  return `<div class="cc-countdown ${cls}">
    <div class="cdt-label"><span class="cdt-dot ${expg?'expiring':''}"></span>Tiempo restante</div>
    <div class="cdt-nums">
      ${t.d>0?`<div class="cdt-unit ${unitCls}"><span class="cdt-n" style="${numStyle}" id="cdt-${c.id}-d">${t.d}</span><span class="cdt-l">días</span></div><span class="cdt-sep">:</span>`:''}
      <div class="cdt-unit ${unitCls}"><span class="cdt-n" style="${numStyle}" id="cdt-${c.id}-h">${String(t.h).padStart(2,'0')}</span><span class="cdt-l">hrs</span></div>
      <span class="cdt-sep">:</span>
      <div class="cdt-unit ${unitCls}"><span class="cdt-n" style="${numStyle}" id="cdt-${c.id}-m">${String(t.m).padStart(2,'0')}</span><span class="cdt-l">min</span></div>
      <span class="cdt-sep">:</span>
      <div class="cdt-unit ${unitCls}"><span class="cdt-n" style="${numStyle}" id="cdt-${c.id}-s">${String(t.s).padStart(2,'0')}</span><span class="cdt-l">seg</span></div>
    </div>
  </div>`;
}

/* ── Build tarjeta de caso ── */
function buildCaseCard(c, idx, featured=false) {
  const exp   = isExpired(c);
  const expg  = isExpiring(c);
  const myV   = iState.votes[c.id];
  const totalV= c.votes.true + c.votes.false;
  const pctT  = totalV ? Math.round(c.votes.true/totalV*100) : 50;
  const pctF  = 100 - pctT;
  const delay = `${idx*0.06}s`;

  const statusTag = exp
    ? `<span class="cc-tag ct-expired">🔒 CERRADO</span>`
    : expg
    ? `<span class="cc-tag ct-expiring">⏰ POR EXPIRAR</span>`
    : `<span class="cc-tag ct-open">⚡ ACTIVO</span>`;
  const cats = c.categories.map(ct=>`<span class="cc-tag ct-cat">${esc(ct)}</span>`).join('');
  const myVoteTag = myV ? `<span class="cc-tag ct-voted">✓ ${myV==='true'?'VERDADERO':'FALSO'}</span>` : '';

  const voteSection = `
    <div class="cc-vote">
      <div class="vote-bar-wrap">
        <div class="vb-row">
          <span class="vb-label">Verdadero</span>
          <div class="vb-track"><div class="vb-fill-true" style="width:${pctT}%"></div></div>
          <span class="vb-pct" style="color:var(--green)">${pctT}%</span>
        </div>
        <div class="vb-row">
          <span class="vb-label">Falso</span>
          <div class="vb-track"><div class="vb-fill-false" style="width:${pctF}%"></div></div>
          <span class="vb-pct" style="color:var(--red)">${pctF}%</span>
        </div>
      </div>
      <div class="vote-total">${totalV} voto${totalV!==1?'s':''} totales</div>
      <div class="vote-btns">
        <button class="vbtn vbtn-true${myV==='true'?' voted':''}" data-vote="true" data-id="${c.id}" ${exp||c.verdict?'disabled':''}>
          ✅ Verdadero (${c.votes.true})
        </button>
        <button class="vbtn vbtn-false${myV==='false'?' voted':''}" data-vote="false" data-id="${c.id}" ${exp||c.verdict?'disabled':''}>
          ❌ Falso (${c.votes.false})
        </button>
      </div>
      ${myV?`<div class="vote-my">Tu voto: ${myV==='true'?'✅ Verdadero':'❌ Falso'}</div>`:''}
      ${c.verdict?`<div class="vote-my" style="color:var(--amber)">Veredicto oficial: ${c.verdict==='true'?'✅ VERDADERO':'❌ FALSO'}</div>`:''}
    </div>`;

  return `<article class="case-card${featured?' feat-case-card':''}${exp?' is-expired':''}${expg?' is-expiring':''}${myV==='true'?' voted-true':''}${myV==='false'?' voted-false':''}"
    style="animation-delay:${delay}" data-cid="${c.id}">
    <div class="cc-head">
      <div class="cc-tags">${statusTag}${cats}${myVoteTag}</div>
      <div class="cc-id">ID: ${esc(c.id)} · Sec.${esc(c.section)}</div>
      <h3 class="cc-title">${esc(c.title)}</h3>
      <p class="cc-desc">${esc(c.desc)}</p>
      <div class="cc-author">✍️ ${esc(c.author)}</div>
    </div>
    ${buildCountdownHTML(c)}
    ${voteSection}
    <div class="cc-foot">
      <button class="btn-detail" data-detail="${c.id}">Ver expediente</button>
      <button class="btn-share" data-share="${c.id}">🔗 Compartir</button>
    </div>
  </article>`;
}

/* ── Render grid ── */
function renderGrid() {
  const grid = $('#caseGrid'); if (!grid) return;
  const items = getFiltered();
  const countEl = $('#invCount');
  if (countEl) countEl.textContent = `${items.length} caso${items!==1?'s':''}`;
  if (!items.length) {
    grid.innerHTML = `<div class="case-empty"><div class="case-empty-ico">🔍</div><h3>Sin expedientes</h3><p>Ajusta los filtros</p></div>`;
    return;
  }
  grid.innerHTML = items.map((c,i) => buildCaseCard(c,i)).join('');
  bindCardEvents(grid);
}

function bindCardEvents(container) {
  $$(  '[data-vote]', container).forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      voteCase(btn.dataset.id, btn.dataset.vote);
    });
  });
  $$('[data-detail]', container).forEach(btn => {
    btn.addEventListener('click', () => openCaseModal(btn.dataset.detail));
  });
  $$('[data-share]', container).forEach(btn => {
    btn.addEventListener('click', () => shareCase(btn.dataset.share));
  });
}

/* ── Featured case from URL ── */
function renderFeaturedCase() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) return;
  const c = CASES.find(x=>x.id===id);
  if (!c) return;
  const sec = $('#featSec'); if (!sec) return;
  sec.style.display = 'block';
  const container = $('#featCase'); if (!container) return;
  container.innerHTML = buildCaseCard(c, 0, true);
  bindCardEvents(container);
  // Scroll hacia él
  setTimeout(() => sec.scrollIntoView({behavior:'smooth', block:'center'}), 400);
  showToast(`📋 Expediente "${c.title}" cargado`, 'info');
}

/* ── Modal detalle caso ── */
let _openModalId = null;
let _modalCountdownTimer = null;

function openCaseModal(id) {
  const c = CASES.find(x=>x.id===id); if (!c) return;
  _openModalId = id;
  const content = $('#cmContent'); if (!content) return;
  const exp  = isExpired(c);
  const expg = isExpiring(c);
  const myV  = iState.votes[id];
  const totalV = c.votes.true + c.votes.false;
  const pctT = totalV ? Math.round(c.votes.true/totalV*100) : 50;
  const pctF = 100 - pctT;

  const statusTag = exp
    ? `<span class="cc-tag ct-expired">🔒 CERRADO</span>`
    : expg
    ? `<span class="cc-tag ct-expiring">⏰ POR EXPIRAR</span>`
    : `<span class="cc-tag ct-open">⚡ ACTIVO</span>`;
  const cats = c.categories.map(ct=>`<span class="cc-tag ct-cat">${esc(ct)}</span>`).join('');

  // Countdown grande
  let cdHtml = '';
  if (!c.deadline) {
    cdHtml = `<div class="cm-countdown"><div class="cm-cdt-label">⏳ Sin fecha de caducidad</div></div>`;
  } else if (exp) {
    cdHtml = `<div class="cm-countdown" style="border-color:rgba(255,59,59,.2);background:rgba(255,59,59,.04)">
      <div class="cm-cdt-label" style="color:var(--red)">🔒 CASO CERRADO — EXPIRADO</div>
    </div>`;
  } else {
    const ms = getRemainingMs(c.deadline);
    const t  = formatCountdown(ms);
    const cc = expg ? 'amber' : '';
    cdHtml = `<div class="cm-countdown${expg?' style="border-color:rgba(255,179,0,.2)"':''}">
      <div class="cm-cdt-label">⏳ Tiempo restante para investigar</div>
      <div class="cm-cdt-nums">
        ${t.d>0?`<div class="cm-cdt-unit"><span class="cm-cdt-n ${cc}" id="cm-cdt-d">${t.d}</span><span class="cm-cdt-l">días</span></div><span class="cm-cdt-sep">:</span>`:''}
        <div class="cm-cdt-unit"><span class="cm-cdt-n ${cc}" id="cm-cdt-h">${String(t.h).padStart(2,'0')}</span><span class="cm-cdt-l">horas</span></div>
        <span class="cm-cdt-sep">:</span>
        <div class="cm-cdt-unit"><span class="cm-cdt-n ${cc}" id="cm-cdt-m">${String(t.m).padStart(2,'0')}</span><span class="cm-cdt-l">minutos</span></div>
        <span class="cm-cdt-sep">:</span>
        <div class="cm-cdt-unit"><span class="cm-cdt-n ${cc}" id="cm-cdt-s">${String(t.s).padStart(2,'0')}</span><span class="cm-cdt-l">segundos</span></div>
      </div>
    </div>`;
  }

  content.innerHTML = `
    <div class="cm-head">
      <div class="cm-tags">${statusTag}${cats}</div>
      <h2 class="cm-title">${esc(c.title)}</h2>
      <div class="cm-meta">
        <span>✍️ ${esc(c.author)}</span>
        <span>Sección ${esc(c.section)}</span>
        <span>ID: ${esc(c.id)}</span>
        ${c.deadline?`<span>Límite: ${new Date(c.deadline).toLocaleString('es-PE')}</span>`:'<span>Sin límite</span>'}
      </div>
    </div>
    <div class="cm-body">
      <p class="cm-desc">${esc(c.longDesc || c.desc)}</p>
      ${cdHtml}
      <div class="cm-grid">
        <div class="cm-block">
          <h4>📋 Pistas del Caso</h4>
          <ul>${(c.clues||[]).map(cl=>`<li>${esc(cl)}</li>`).join('')||'<li>Sin pistas registradas</li>'}</ul>
        </div>
        <div class="cm-block">
          <h4>📊 Estado de la Investigación</h4>
          <p>${exp?'Este caso ha expirado. Los resultados son definitivos.':expg?'⚠️ Este caso expira pronto. ¡Tu voto aún cuenta!':'La investigación sigue abierta. Tu voto ayuda a determinar la verdad.'}</p>
          ${c.verdict?`<p style="margin-top:8px;color:var(--amber);font-weight:600">Veredicto Oficial: ${c.verdict==='true'?'✅ VERDADERO':'❌ FALSO'}</p>`:''}
        </div>
        <div class="cm-block full">
          <div class="cm-vote-section">
            <div class="cm-vote-title">📊 Resultados de la Comunidad</div>
            <div class="cm-vote-bars">
              <div class="cm-vb-row">
                <span class="cm-vb-label">Verdadero</span>
                <div class="cm-vb-track"><div class="cm-vb-fill true" style="width:${pctT}%"></div></div>
                <span class="cm-vb-pct" style="color:var(--green)">${pctT}%</span>
              </div>
              <div class="cm-vb-row">
                <span class="cm-vb-label">Falso</span>
                <div class="cm-vb-track"><div class="cm-vb-fill false" style="width:${pctF}%"></div></div>
                <span class="cm-vb-pct" style="color:var(--red)">${pctF}%</span>
              </div>
            </div>
            <div class="cm-vote-summary">
              <div class="cm-vs"><div class="cm-vs-n" style="color:var(--green)">${c.votes.true}</div><div class="cm-vs-l">Verdadero</div></div>
              <div class="cm-vs"><div class="cm-vs-n" style="color:var(--red)">${c.votes.false}</div><div class="cm-vs-l">Falso</div></div>
              <div class="cm-vs"><div class="cm-vs-n" style="color:var(--cyan)">${totalV}</div><div class="cm-vs-l">Total</div></div>
            </div>
            <div class="cm-vote-btns">
              <button class="vbtn vbtn-true${myV==='true'?' voted':''}" data-vote="true" data-id="${c.id}" ${exp||c.verdict?'disabled':''}>
                ✅ Verdadero (${c.votes.true})
              </button>
              <button class="vbtn vbtn-false${myV==='false'?' voted':''}" data-vote="false" data-id="${c.id}" ${exp||c.verdict?'disabled':''}>
                ❌ Falso (${c.votes.false})
              </button>
            </div>
            ${myV?`<div class="vote-my" style="margin-top:6px">Tu voto: ${myV==='true'?'✅ Verdadero':'❌ Falso'}</div>`:''}
          </div>
        </div>
      </div>
      <div class="cm-actions">
        <a class="cm-btn cm-btn-back" href="noticias.html">← Volver a Noticias</a>
        <button class="cm-btn cm-btn-share" id="cmShareBtn">🔗 Compartir</button>
        <button class="cm-btn cm-btn-close" id="cmCloseBtn">Cerrar</button>
      </div>
    </div>
  `;

  // Bind votos en modal
  $$('[data-vote]', content).forEach(btn => {
    btn.addEventListener('click', () => voteCase(btn.dataset.id, btn.dataset.vote));
  });
  $('#cmShareBtn')?.addEventListener('click', () => shareCase(id));
  $('#cmCloseBtn')?.addEventListener('click', closeCaseModal);

  $('#caseModal')?.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Countdown en modal (actualización en vivo)
  clearInterval(_modalCountdownTimer);
  if (c.deadline && !exp) {
    _modalCountdownTimer = setInterval(() => {
      const ms2 = getRemainingMs(c.deadline);
      if (ms2 <= 0) { clearInterval(_modalCountdownTimer); openCaseModal(id); return; }
      const t2 = formatCountdown(ms2);
      if($('#cm-cdt-d')) $('#cm-cdt-d').textContent = t2.d;
      if($('#cm-cdt-h')) $('#cm-cdt-h').textContent = String(t2.h).padStart(2,'0');
      if($('#cm-cdt-m')) $('#cm-cdt-m').textContent = String(t2.m).padStart(2,'0');
      if($('#cm-cdt-s')) $('#cm-cdt-s').textContent = String(t2.s).padStart(2,'0');
    }, 1000);
  }
}
function closeCaseModal() {
  clearInterval(_modalCountdownTimer);
  _openModalId = null;
  $('#caseModal')?.classList.remove('open');
  document.body.style.overflow = '';
}

/* ── Compartir ── */
function shareCase(id) {
  const url = `${location.origin}${location.pathname}?id=${id}`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(()=>showToast('🔗 Enlace copiado al portapapeles', 'success'));
  } else {
    showToast('URL: ' + url, 'info');
  }
}

/* ── Vote Log ── */
function renderVoteLog() {
  const log = $('#voteLog'); if (!log) return;
  const entries = Object.entries(iState.votes);
  if (!entries.length) {
    log.innerHTML = `<div class="vlog-empty">No has investigado ningún caso aún.</div>`;
    return;
  }
  log.innerHTML = entries.map(([id, verdict]) => {
    const c = CASES.find(x=>x.id===id);
    const timeStr = iState.voteTimes[id] ? new Date(iState.voteTimes[id]).toLocaleString('es-PE') : '—';
    const ico = verdict === 'true' ? '✅' : '❌';
    return `<div class="vlog-entry">
      <span class="vlog-ico">${ico}</span>
      <div class="vlog-info">
        <div class="vlog-title">${c ? esc(c.title) : `Caso #${id}`}</div>
        <div class="vlog-meta">${timeStr} · ${c?`Sec. ${c.section}`:'—'}</div>
      </div>
      <span class="vlog-verdict ${verdict==='true'?'vlog-true':'vlog-false'}">${verdict==='true'?'VERDADERO':'FALSO'}</span>
    </div>`;
  }).join('');
}

/* ── Countdown en tiempo real (tarjetas) ── */
function startCountdownTick() {
  setInterval(() => {
    CASES.forEach(c => {
      if (!c.deadline || isExpired(c)) return;
      const ms = getRemainingMs(c.deadline);
      if (ms <= 0) { renderGrid(); return; } // refresca si acaba de expirar
      const t = formatCountdown(ms);
      const d = document.getElementById(`cdt-${c.id}-d`);
      const h = document.getElementById(`cdt-${c.id}-h`);
      const m = document.getElementById(`cdt-${c.id}-m`);
      const s = document.getElementById(`cdt-${c.id}-s`);
      if (d) d.textContent = t.d;
      if (h) h.textContent = String(t.h).padStart(2,'0');
      if (m) m.textContent = String(t.m).padStart(2,'0');
      if (s) s.textContent = String(t.s).padStart(2,'0');
    });
  }, 1000);
}

/* ── Navbar ── */
function setupNav() {
  const toggle=$('#navToggle'); const links=$('#navLinks');
  toggle?.addEventListener('click',e=>{e.stopPropagation();links?.classList.toggle('open');});
  document.addEventListener('click',e=>{if(!toggle?.contains(e.target)&&!links?.contains(e.target))links?.classList.remove('open');});
  $$('.hud-bar').forEach(b=>b.style.setProperty('--v',b.dataset.val||50));
}

/* ── Filtros ── */
function setupFilters() {
  $('#invChips')?.addEventListener('click',e=>{
    const b=e.target.closest('[data-f]'); if(!b) return;
    iState.filter=b.dataset.f;
    $$('#invChips .nchip').forEach(c=>c.classList.remove('active'));
    b.classList.add('active');
    renderGrid();
  });
  let timer;
  $('#invSearch')?.addEventListener('input',e=>{
    clearTimeout(timer);
    timer=setTimeout(()=>{iState.search=e.target.value.trim();renderGrid();},250);
  });
  $('#clearVotesBtn')?.addEventListener('click',()=>{
    if(!confirm('¿Borrar todo tu historial de votos?')) return;
    iState.votes={}; iState.voteTimes={};
    saveVotes(); updateHeroStats(); renderGrid(); renderVoteLog();
    showToast('Historial borrado','warn');
  });
}

/* ── Modal eventos ── */
function setupModal() {
  $('#cmOverlay')?.addEventListener('click',closeCaseModal);
  $('#cmClose')?.addEventListener('click',closeCaseModal);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeCaseModal();});
}

/* ── Reveal ── */
function setupReveal(){
  const obs=new IntersectionObserver(e=>e.forEach(en=>{if(en.isIntersecting){en.target.classList.add('in');obs.unobserve(en.target);}}),{threshold:.07});
  $$('.reveal').forEach(el=>obs.observe(el));
}

/* ── Toast ── */
let _toastT;
function showToast(msg,type='success'){
  const t=$('#toast');if(!t)return;
  t.textContent=msg;t.className=`toast ${type} show`;
  clearTimeout(_toastT);_toastT=setTimeout(()=>t.classList.remove('show'),2800);
}

/* ── Helpers ── */
function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}

/* ── Año ── */
$('#yr') && ($('#yr').textContent = new Date().getFullYear());

/* ── INIT ── */
document.addEventListener('DOMContentLoaded',()=>{
  loadVotes();
  setupCanvas();
  setupNav();
  setupFilters();
  setupModal();
  setupReveal();
  updateHeroStats();
  renderFeaturedCase();
  renderGrid();
  renderVoteLog();
  startCountdownTick();
  console.log('⚗️ Moonveil Investigaciones — Cargado');
});