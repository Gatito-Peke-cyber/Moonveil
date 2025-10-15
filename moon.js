/* =========================================================
   Moonveil Portal — Aniversario (JS)
   - Confetti (guardado en localStorage)
   - Años en sitio (configurable)
   - Misiones: definidas con cooldown (24h/7d/30d), XP rewards
   - Sistema de niveles 1..20 con XP thresholds
   - Tienda: items con stock y restock periods
   - Insignias: varias categorías + legendarias
   - Novedades & aldeanos mensajes + likes persistentes
   - Persistencia: localStorage (KEYS below)
   ========================================================= */

/* ----------------------------
   Storage keys & helpers
   ---------------------------- */
const LS_KEYS = {
  CONFETTI: 'mv_confetti_seen',
  PROGRESS: 'mv_progress',
  MISSIONS: 'mv_missions',
  SHOP: 'mv_shop',
  BADGES: 'mv_badges',
  VILLAGER_LIKES: 'mv_vlikes',
  LAST_VISIT: 'mv_last_visit',
};

const $ = (s, ctx=document)=> ctx.querySelector(s);
const $$ = (s, ctx=document)=> Array.from(ctx.querySelectorAll(s));

/* ----------------------------
   Config: startDate (site launch) and initial constants
   ---------------------------- */
const SITE_START = '2022-09-26T00:00:00Z'; // ejemplo: inicio del sitio
const NOW = ()=> new Date();
const DAYS = n => n*24*60*60*1000;

/* ----------------------------
   Level table (1..20). You can tune numbers here.
   We'll define required XP to reach each level (cumulative).
   ---------------------------- */
const LEVELS = (()=>{
  // example progressive curve: base + growth
  const arr = [0]; // 0 for level 0 (unused)
  let base = 5;
  for(let L=1; L<=30; L++){
    // increasing formula: base * L * growth
    const need = Math.round((base * L) + Math.pow(L, 2.2) * 15);
    arr.push(need);
  }
  return arr; // arr[1] => xp needed to get to level1? We'll interpret as required XP for that level.
})();

/* ----------------------------
   Missions dataset
   Each mission:
     id, title, desc, xpReward, cooldownMs (24h/7d/30d), type
   ---------------------------- */
const MISSIONS_DEF = [
  {id:'m_daily_1', title:'Ganancias', desc:'Gana 10 de Cobre', xp:10, cooldown: DAYS(1)},
  {id:'m_daily_2', title:'Ganancias 2', desc:'Gana 20 de Cobre', xp:15, cooldown: DAYS(1)},
  {id:'m_daily_3', title:'Ganancias 3', desc:'Gana 40 de Cobre', xp:45, cooldown: DAYS(1)},
  {id:'m_daily_4', title:'Aldeano+', desc:'Obten un aldeano (+1)', xp:30, cooldown: DAYS(1)},
  {id:'m_daily_5', title:'Madera', desc:'Tala 10 de madeera', xp:100, cooldown: DAYS(1)},
  {id:'m_daily_6', title:'Madera+', desc:'Tala 30 de madera', xp:300, cooldown: DAYS(1)},
  {id:'m_daily_7', title:'Brote', desc:'Planta 5 brotes', xp:50, cooldown: DAYS(1)},
  {id:'m_week_1', title:'Brote EX', desc:'Planta 5 brotes diferentes', xp:120, cooldown: DAYS(7)},
  {id:'m_week_2', title:'Madera EX', desc:'Tala 30 de madera, pero de diferentes arboles', xp:200, cooldown: DAYS(7)},
  {id:'m_week_3', title:'Golem!?', desc:'Haz que spawnee un golem', xp:200, cooldown: DAYS(7)},
  {id:'m_week_4', title:'Unlucky', desc:'Obten un aldeano verde', xp:100, cooldown: DAYS(7)},
  {id:'m_month_1', title:'Cats', desc:'Domestica 3 tipos de gatos diferentes', xp:100, cooldown: DAYS(30)},
  {id:'m_month_2', title:'Profesion', desc:'Obten 4 tipos de aldeanos de profesion', xp:200, cooldown: DAYS(30)},
  {id:'m_month_3', title:'Jefe', desc:'Contrata 1', xp:200, cooldown: DAYS(30)},
];

/* ----------------------------
   Shop dataset: id, name, desc, price, stock, restockMs
   ---------------------------- */
const SHOP_DEF = [
  {id:'s_confetti_pack', name:'Expansion', desc:'Esta es un expansion', price:128, stock:1, restock: DAYS(7), discount:25},
  {id:'s_confetti_pack2', name:'Expansion', desc:'Esta es un expansion', price:128, stock:1, restock: DAYS(30), discount:75},
  {id:'s_golden_badge', name:'Expansion', desc:'Esta es un expansion', price:128, stock:1, restock: DAYS(1)},
  {id:'s_mystery_box', name:'Expansion', desc:'Esta es un expansion', price:200, stock:1, restock: DAYS(1)},
  {id:'s_mystery_box2', name:'Expansion', desc:'Esta es un expansion', price:128, stock:1, restock: DAYS(7), discount:75},
  {id:'s_mystery_box3', name:'Expansion', desc:'Esta es un expansion', price:128, stock:1, restock: DAYS(7)},
  {id:'s_mystery_box4', name:'Expansion', desc:'Esta es un expansion', price:128, stock:1, restock: DAYS(7), discount:25},
  {id:'s_mystery_box5', name:'Expansion', desc:'Monedas Gratuitas', price:128, stock:1, restock: DAYS(7), discount:100},
  {id:'s_banner', name:'Expansion', desc:'Esta es un expansion', price:2, stock:1, restock: DAYS(365)},
];


/* ----------------------------
   Badges dataset
   Each badge has id, name, desc, icon (text), criteria function (progress)
   ---------------------------- */
const BADGES_DEF = [
  {
    id:'b_first_visit',
    name:'Bienvenido',
    desc:'Entraste por primera vez al evento',
    icon:'fa-solid fa-star', // ⭐ estrella sólida
    tier:'common',
    check: prog => prog.firstVisit === true
  },
  {
    id:'b_lvl5',
    name:'Ascenso V',
    desc:'Alcanza el nivel 5',
    icon:'fa-solid fa-medal', // 🏅 medalla
    tier:'common',
    check: prog => prog.level >=5
  },
  {
    id:'b_lvl10',
    name:'Ascenso X',
    desc:'Alcanza el nivel 10',
    icon:'fa-solid fa-trophy', // 🏆 trofeo
    tier:'rare',
    check: prog => prog.level >=15
  },
  {
    id:'b_lvl20',
    name:'Maestro XX',
    desc:'Alcanza el nivel 20',
    icon:'fa-solid fa-crown', // 👑 corona legendaria
    tier:'legendary',
    check: prog => prog.level >=30
  },
  {
    id:'b_login2',
    name:'Visitante 1 días',
    desc:'Inicia sesión durante 1 días distintos',
    icon:'fa-solid fa-calendar-day', // 📆 calendario de un día
    tier:'common',
    check: prog => prog.streakDays >=1
  },
  {
    id:'b_login3',
    name:'Visitante 10 días',
    desc:'Inicia sesión durante 10 días distintos',
    icon:'fa-solid fa-calendar-day', // 📆 calendario de un día
    tier:'legendary',
    check: prog => prog.streakDays >=10
  },
  {
    id:'b_login4',
    name:'Diario',
    desc:'█████████',
    icon:'fa-solid fa-calendar-day', // 📆 calendario de un día
    tier:'legendary',
    check: prog => prog.streakDays >=20
  },
  {  //Aldeano Popular   --   Alcanza 20 likes en total de los aldeanos
  id:'b_20likes',
  name:'Me gusto',
  desc:'█████████',
  icon:'fa-solid fa-heart', // ❤️
  tier:'legendary',
  check: prog => {
    const totalLikes = Object.values(VILLAGER_LIKES).reduce((a,b)=>a+b,0);
    return totalLikes >= 20; // ← aquí cambias a 100 cuando quieras
  }
}

];


/* ----------------------------
   Novedades & Villagers dataset (sample)
   ---------------------------- */
const NEWS_ANN = [
  {id:'na1', title:'Casa del Arbol', text:'+1 por niño'},
  {id:'na2', title:'Estanque de peces', text:'+1 por pescador'},
  {id:'na3', title:'Estandarte', text:'+1 por pastor'},
  {id:'na4', title:'Armadura', text:'+1 por armero'},
  {id:'na5', title:'Decoracion', text:'+1 por cantero / +1 por aldeano'},
  {id:'na6', title:'Biblioteca', text:'+1 por bibliotecarios'},
  {id:'na7', title:'Azadas', text:'+1 por herrero'},
  {id:'na8', title:'Papas y mas papas', text:'+1 por granjero'},
  {id:'na9', title:'Babys!', text:'+1 por cada niño'},
  {id:'na10', title:'Ropa bonita', text:'+1 por sastre'},
];

const VILLAGER_MSGS_DEF = [
  {id:'v1', name:'Edward', photo:'', text:'+1 en todas tus ganancias | 20 d'},
  {id:'v2', name:'Cael', photo:'', text:'El aldeano verde no te resta ganancias | 30 d'},
  {id:'v3', name:'Joel', photo:'', text:'Los niños te generan +1 de ganancia | 40 d'},
  {id:'v5', name:'Pablo', photo:'', text:'Te expande 3 zonas gratis - Hace que generes un 20% menos | 10 s'},
  {id:'v6', name:'Robert', photo:'', text:'Te genera un cofre semanal - Hace que el primer dia no ganes nada | 40 s'},
  {id:'v7', name:'Albert', photo:'', text:'¡FELIZ ANIVERSARIO A MOONVEIL!'},
  {id:'v8', name:'Gero', photo:'', text:'Te genera un happy ghats - +1 cama | 20 d'},
  {id:'v9', name:'Brun', photo:'', text:'Hace que tu tienda 2 genere un 10% mas | 30 d'},
  {id:'v9', name:'Seb', photo:'', text:'Ausente generas 1% mas | 30 d'},
  {id:'v10', name:'Sebastian', photo:'', text:'Un aldeano de otra profesion te genera +5 | 50 s'}
];

/* ----------------------------
   Load / Save helpers
   ---------------------------- */
const lsLoad = (k, fallback) => {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch(e){ return fallback; }
};
const lsSave = (k, v) => {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){ /* ignore */ }
};

/* ----------------------------
   Default initial user progress object
   ---------------------------- */
const defaultProgress = {
  xp: 0,
  level: 1,
  firstVisit: false,
  visitedOn: [], // array of dates 'YYYY-MM-DD'
  streakDays: 0,
};

/* ----------------------------
   Initialize application state
   ---------------------------- */
let PROG = lsLoad(LS_KEYS.PROGRESS, null);
if (!PROG) {
  PROG = Object.assign({}, defaultProgress);
  lsSave(LS_KEYS.PROGRESS, PROG);
}
let MISSIONS_STATE = lsLoad(LS_KEYS.MISSIONS, {});
let SHOP_STATE = lsLoad(LS_KEYS.SHOP, {});
let BADGES_STATE = lsLoad(LS_KEYS.BADGES, {});
let VILLAGER_LIKES = lsLoad(LS_KEYS.VILLAGER_LIKES, {});

/* Ensure SHOP_STATE has defaults */
function ensureShopState(){
  SHOP_DEF.forEach(it=>{
    if (!SHOP_STATE[it.id]) {
      SHOP_STATE[it.id] = {
        stock: it.stock,
        lastRestock: new Date().toISOString()
      };
    }
  });
  lsSave(LS_KEYS.SHOP, SHOP_STATE);
}
ensureShopState();

/* Ensure MISSIONS_STATE keys */
function ensureMissionsState(){
  MISSIONS_DEF.forEach(m=>{
    if (!MISSIONS_STATE[m.id]) {
      MISSIONS_STATE[m.id] = { lastCompleted: null };
    }
  });
  lsSave(LS_KEYS.MISSIONS, MISSIONS_STATE);
}
ensureMissionsState();

/* Ensure badges state */
function ensureBadgesState(){
  BADGES_DEF.forEach(b=>{
    if (!BADGES_STATE[b.id]) BADGES_STATE[b.id] = false;
  });
  lsSave(LS_KEYS.BADGES, BADGES_STATE);
}
ensureBadgesState();

/* ----------------------------
   Utility functions
   ---------------------------- */
const fmt = n => new Intl.NumberFormat('es-PE').format(n);
const todayISO = () => (new Date()).toISOString().slice(0,10);
const dateKey = d => (new Date(d)).toISOString().slice(0,10);

function addXP(amount){
  PROG.xp += amount;
  // recalc level:
  let lvl = PROG.level;
  // We'll compute cumulative threshold: current threshold value at next level
  function xpForLevel(L) { return LEVELS[L] || 9999999; }

  // If xp exceeds requirement for next level, level up
  while (lvl < 40 && PROG.xp >= xpForLevel(lvl+1)) {
    lvl++;
  }
  PROG.level = lvl;
  lsSave(LS_KEYS.PROGRESS, PROG);
  checkBadges();
  renderProgress();
}

/* ----------------------------
   Confetti: show once unless forced.
   Uses canvas confetti approximation.
   ---------------------------- */
function showConfettiIfNeeded(){
  const seen = lsLoad(LS_KEYS.CONFETTI, false);
  if (seen) return;
  showConfetti();
  lsSave(LS_KEYS.CONFETTI, true);
}

function showConfetti(duration=3500){
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpi = Math.max(1, window.devicePixelRatio || 1);

  function resize(){
    canvas.width = innerWidth * dpi;
    canvas.height = innerHeight * dpi;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    ctx.setTransform(dpi,0,0,dpi,0,0);
  }
  resize();
  window.addEventListener('resize', resize);

  const pieces = [];
  const colors = ['#ffbe0b','#fb5607','#ff006e','#8338ec','#3a86ff','#16a34a','#30d158'];
  for (let i=0;i<220;i++){
    pieces.push({
      x: Math.random()*innerWidth,
      y: Math.random()*-innerHeight/2,
      vx: (Math.random()-0.5)*6,
      vy: 2 + Math.random()*6,
      size: 6 + Math.random()*8,
      rot: Math.random()*360,
      o: 0.9 + Math.random()*0.1,
      color: colors[Math.floor(Math.random()*colors.length)]
    });
  }

  let running = true;
  const start = performance.now();
  function frame(t){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    pieces.forEach(p=>{
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.03;
      p.rot += 6;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI/180);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.o;
      ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size*0.6);
      ctx.restore();
    });
    if (performance.now() - start < duration) {
      requestAnimationFrame(frame);
    } else {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      running = false;
    }
  }
  requestAnimationFrame(frame);
}

/* ----------------------------
   Renderers
   ---------------------------- */
function renderProgress(){
  // years on site
  const years = Math.max(0, Math.floor((Date.now() - new Date(SITE_START)) / (365.25*24*60*60*1000)));
  $('#yearsCount').textContent = years;

  $('#totalXP').textContent = fmt(PROG.xp);
  $('#lvl').textContent = PROG.level;

  // XP bar: percent to next level
  const curLevel = PROG.level;
  const curXp = PROG.xp;
  const nextReq = LEVELS[curLevel+1] || LEVELS[curLevel];
  const curReq = LEVELS[curLevel] || 0;
  const needForNext = Math.max(0, nextReq - curReq);
  const rel = needForNext ? Math.min(100, Math.round((curXp - curReq) / needForNext * 100)) : 100;
  $('#xpFill').style.width = rel + '%';
  $('#xpText').textContent = `${fmt(curXp)} XP`;
  $('#xpNext').textContent = `Siguiente: ${fmt(Math.max(0, nextReq - curXp))} XP`;
}

/* Missions & UI render */
function renderMissions(){
  const grid = $('#missionsGrid');
  grid.innerHTML = MISSIONS_DEF.map(m => {
    const state = MISSIONS_STATE[m.id] || { lastCompleted: null };
    const last = state.lastCompleted ? new Date(state.lastCompleted) : null;
    const can = last ? (Date.now() - last.getTime() >= m.cooldown) : true;
    const cooldownText = last ? timeUntilNext(last.getTime() + m.cooldown) : 'Disponible';
    return `
      <div class="mission-card" data-id="${m.id}">
        <div class="mission-header">
          <div class="mission-title">${escapeHtml(m.title)}</div>
          <div class="kicker">${m.xp} XP</div>
        </div>
        <div class="mission-desc">${escapeHtml(m.desc)}</div>
        <div class="mission-meta">
          <div class="kicker">Cooldown: ${msToReadable(m.cooldown)}</div>
          <div class="kicker">Estado: ${can ? '<strong>Disponible</strong>' : '<span class="muted">Reutilizable en ' + cooldownText + '</span>'}</div>
        </div>
        <div class="mission-actions">
          <button class="btn" ${can ? '' : 'disabled'} data-action="claim" data-id="${m.id}">${can ? 'Completar' : 'Esperar'}</button>
          <button class="btn-ghost" data-action="info" data-id="${m.id}">Detalles</button>
        </div>
      </div>
    `;
  }).join('');
}

/* Quick lists */
function renderQuickLists(){
  // missions quick
  const mq = $('#missionsQuick');
  mq.innerHTML = MISSIONS_DEF.map(m=>{
    const last = MISSIONS_STATE[m.id]?.lastCompleted ? new Date(MISSIONS_STATE[m.id].lastCompleted) : null;
    const can = last ? (Date.now() - last.getTime() >= m.cooldown) : true;
    return `<li>${escapeHtml(m.title)} <span class="kicker">${can ? 'Disponible' : 'En cooldown'}</span></li>`;
  }).join('');

  const sq = $('#shopQuick');
  sq.innerHTML = SHOP_DEF.map(it=>{
    const s = SHOP_STATE[it.id] ? SHOP_STATE[it.id].stock : it.stock;
    return `<li>${escapeHtml(it.name)} <span class="kicker">${s>0? 'Stock: '+s : 'Agotado'}</span></li>`;
  }).join('');
}

/* Levels list */
function renderLevels(){
  const el = $('#levelsList');
  el.innerHTML = LEVELS.slice(1).map((req,idx)=>{
    const level = idx+1;
    return `<li${PROG.level===level ? ' style="border-color:var(--primary);box-shadow:0 8px 20px rgba(48,209,88,.06)"' : ''}>Nivel ${level} <span class="need">${fmt(req)} XP</span></li>`;
  }).join('');
}

/* Shop render */
/*nction renderShop(){
  const grid = $('#shopGrid');
  grid.innerHTML = SHOP_DEF.map(it=>{
    const sObj = SHOP_STATE[it.id];
    const stock = sObj ? sObj.stock : 0;
    const restockLabel = timeUntilNext(new Date(sObj.lastRestock).getTime() + it.restock);
    return `
      <div class="shop-item" data-id="${it.id}">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <strong>${escapeHtml(it.name)}</strong>
          <span class="kicker">${fmt(it.price)} ✦</span>
        </div>
        <div class="kicker">${escapeHtml(it.desc)}</div>
        <div class="stock">Stock: ${stock > 0 ? stock : '<span class="sold">Agotado</span>'}</div>
        <div class="kicker">Restock: ${msToReadable(it.restock)} (${restockLabel})</div>
        <div style="margin-top:8px;display:flex;gap:8px">
          <button class="btn" ${stock>0 ? '' : 'disabled'} data-buy="${it.id}">Comprar</button>
          <button class="btn-ghost" data-buy-info="${it.id}">Info</button>
        </div>
      </div>
    `;
  }).join('');
}*/



function renderShop(){
  const grid = $('#shopGrid');
  grid.innerHTML = SHOP_DEF.map(it=>{
    const sObj = SHOP_STATE[it.id];
    const stock = sObj ? sObj.stock : 0;
    const restockLabel = timeUntilNext(new Date(sObj.lastRestock).getTime() + it.restock);

    // --- descuentos ---
    let finalPrice = it.price;
    let discountBadge = '';
    let priceHtml = `${fmt(it.price)} ✦`;
    if (it.discount && it.discount > 0){
      finalPrice = Math.max(0, Math.floor(it.price * (1 - it.discount/100)));
      discountBadge = `<span class="discount-badge">-${it.discount}%</span>`;
      if (finalPrice === 0){
        priceHtml = `<span class="price-free">Gratis 🎉</span> <span class="old-price">${fmt(it.price)} ✦</span>`;
      } else {
        priceHtml = `<span class="price-discount">${fmt(finalPrice)} ✦</span> <span class="old-price">${fmt(it.price)} ✦</span>`;
      }
    }

    return `
  <div class="shop-item ${it.discount ? 'has-discount' : ''}" data-id="${it.id}">
    ${discountBadge ? `<div class="discount-flag">${finalPrice === 0 ? '🎉 GRATIS' : `-${it.discount}%`}</div>` : ''}
    <div style="display:flex;justify-content:space-between;align-items:center">
      <strong>${escapeHtml(it.name)}</strong>
      <span>${priceHtml}</span>
    </div>
    <div class="kicker">${escapeHtml(it.desc)}</div>
    <div class="stock">Stock: ${stock > 0 ? stock : '<span class="sold">Agotado</span>'}</div>
    <div class="kicker">Restock: ${msToReadable(it.restock)} (${restockLabel})</div>
    <div style="margin-top:8px;display:flex;gap:8px">
      <button class="btn" ${stock>0 ? '' : 'disabled'} data-buy="${it.id}">Comprar</button>
      <button class="btn-ghost" data-buy-info="${it.id}">Info</button>
    </div>
  </div>
`;

  }).join('');
}


/* Badges */
function renderBadgesPanel(){
  const panel = $('#badgesPanel');
  panel.innerHTML = BADGES_DEF.map(b=>{
    const unlocked = BADGES_STATE[b.id];
    return `
      <div class="badge-card ${b.tier==='legendary' && unlocked ? 'legendary' : ''}" data-id="${b.id}">
        <div class="badge-icon"><i class="${b.icon}"></i></div>

        <div>
          <div><strong>${escapeHtml(b.name)}</strong> ${unlocked ? '<span class="kicker"> (Desbloqueada)</span>' : ''}</div>
          <div class="kicker">${escapeHtml(b.desc)}</div>
        </div>
      </div>
    `;
  }).join('');
}

function renderBadgesGrid(){
  $('#badgesGrid').innerHTML = BADGES_DEF.map(b=>{
    const unlocked = BADGES_STATE[b.id];
    return `
      <div class="badge-card ${b.tier==='legendary' && unlocked ? 'legendary' : ''}">
        <div class="badge-icon"><i class="${b.icon}"></i></div>

        <div>
          <div><strong>${escapeHtml(b.name)}</strong></div>
          <div class="kicker">${escapeHtml(b.desc)}</div>
          <div class="kicker">${unlocked ? 'Desbloqueada' : 'Bloqueada'}</div>
        </div>
      </div>
    `;
  }).join('');
}

/* News & villagers */
function renderNewsAnn(){
  $('#newsAnn').innerHTML = NEWS_ANN.map(n=>`<div class="ann-card"><strong>${escapeHtml(n.title)}</strong><div class="kicker">${escapeHtml(n.text)}</div></div>`).join('');
}
function renderVillagerMsgs(){
  const wrap = $('#villagerMsgs');
  wrap.innerHTML = VILLAGER_MSGS_DEF.map(v=>{
    const likes = VILLAGER_LIKES[v.id] || 0;
    const photo = v.photo ? `<img src="${escapeHtml(v.photo)}" alt="${escapeHtml(v.name)}">` : `<div class="avatar">?</div>`;
    return `
      <div class="villager" data-id="${v.id}">
        ${photo}
        <div class="body">
          <div><strong>${escapeHtml(v.name)}</strong></div>
          <div class="kicker">${escapeHtml(v.text)}</div>
        </div>
        <div class="actions">
          <button class="btn-ghost" data-like="${v.id}">❤ ${likes}</button>
        </div>
      </div>
    `;
  }).join('');
}

/* ----------------------------
   Utilities: cooldown/checks
   ---------------------------- */
function msToReadable(ms){
  if (ms >= DAYS(30)) return Math.round(ms/DAYS(30)) + ' mes(es)';
  if (ms >= DAYS(7)) return Math.round(ms/DAYS(7)) + ' semana(s)';
  if (ms >= DAYS(1)) return Math.round(ms/DAYS(1)) + ' día(s)';
  if (ms >= 3600000) return Math.round(ms/3600000) + ' h';
  return Math.round(ms/60000) + ' min';
}

function timeUntilNext(msTimestamp){
  const diff = msTimestamp - Date.now();
  if (diff <= 0) return 'ahora';
  const d = Math.floor(diff / DAYS(1));
  const h = Math.floor((diff % DAYS(1)) / (3600000));
  const m = Math.floor((diff % 3600000)/60000);
  if (d>0) return `${d}d ${h}h`;
  if (h>0) return `${h}h ${m}m`;
  return `${m}m`;
}

/* ----------------------------
   Actions: complete mission, buy, like, badges check
   ---------------------------- */
function completeMission(id){
  const m = MISSIONS_DEF.find(x=>x.id===id);
  if (!m) return;
  const now = new Date();
  MISSIONS_STATE[id] = { lastCompleted: now.toISOString() };
  lsSave(LS_KEYS.MISSIONS, MISSIONS_STATE);
  addXP(m.xp);
  toast(`Completaste "${m.title}" y ganaste ${m.xp} XP`);
  renderMissions(); renderQuickLists(); checkBadges(); saveProgressTimestamp();
}

function buyItem(id){
  const def = SHOP_DEF.find(i=>i.id===id);
  if (!def) return;
  const s = SHOP_STATE[id];
  if (!s || s.stock <= 0) { toast('Agotado'); return; }
  s.stock -= 1;
  if (s.stock < 0) s.stock = 0;
  s.lastRestock = s.lastRestock || new Date().toISOString();
  lsSave(LS_KEYS.SHOP, SHOP_STATE);
  toast(`Compraste ${def.name}`);
  renderShop(); renderQuickLists();
}

function likeVillager(id){
  VILLAGER_LIKES[id] = (VILLAGER_LIKES[id] || 0) + 1;
  lsSave(LS_KEYS.VILLAGER_LIKES, VILLAGER_LIKES);
  renderVillagerMsgs();
   checkBadges(); // 👈 importante
}



/* Badges check */
function checkBadges(){
  // update PROG.level maybe already updated
  const progSnapshot = Object.assign({}, PROG);
  // extra fields:
  progSnapshot.visitedOn = progSnapshot.visitedOn || [];
  progSnapshot.streakDays = progSnapshot.streakDays || 0;
  BADGES_DEF.forEach(b=>{
    const unlocked = BADGES_STATE[b.id];
    if (!unlocked && b.check(progSnapshot)){
      BADGES_STATE[b.id] = true;
      toast(`Insignia desbloqueada: ${b.name}`);
    }
  });
  lsSave(LS_KEYS.BADGES, BADGES_STATE);
  renderBadgesPanel(); renderBadgesGrid();
}

/* ----------------------------
   Tick: restock logic (shop) and mission availability check
   ---------------------------- */
function restockShop(){
  SHOP_DEF.forEach(def=>{
    const st = SHOP_STATE[def.id];
    if (!st) return;
    const next = new Date(st.lastRestock).getTime() + def.restock;
    if (Date.now() >= next){
      // restock to full
      st.stock = def.stock;
      st.lastRestock = new Date().toISOString();
    }
  });
  lsSave(LS_KEYS.SHOP, SHOP_STATE);
}

/* periodic tick to update UI timers & restocks */
function tick(){
  restockShop();
  renderShop();
  renderMissions();
  renderQuickLists();
  renderVillagerMsgs();
}

/* ----------------------------
   Events binding
   ---------------------------- */
document.addEventListener('click', (e)=>{
  const btn = e.target.closest('[data-action="claim"]');
  if (btn){ const id = btn.dataset.id; completeMission(id); return; }

  const info = e.target.closest('[data-action="info"]');
  if (info){ const id = info.dataset.id; const m = MISSIONS_DEF.find(x=>x.id===id); alert(`${m.title}\n\n${m.desc}\nRecompensa: ${m.xp} XP\nRestablece: ${msToReadable(m.cooldown)}`); return; }

  const buyBtn = e.target.closest('[data-buy]');
  if (buyBtn){ const id = buyBtn.dataset.buy; buyItem(id); return; }

  const buyInfo = e.target.closest('[data-buy-info]');
  if (buyInfo){ const id = buyInfo.dataset.buyInfo; const def = SHOP_DEF.find(s=>s.id===id); alert(`${def.name}\n\n${def.desc}\nPrecio: ${fmt(def.price)}\nStock: ${SHOP_STATE[id].stock}`); return; }

  const likeBtn = e.target.closest('[data-like]');
  if (likeBtn){ const id = likeBtn.dataset.like; likeVillager(id); return; }

  const openBadge = e.target.closest('.badge-card');
  if (openBadge){ const id = openBadge.dataset.id; const def = BADGES_DEF.find(b=>b.id===id); if (def) alert(`${def.name}\n\n${def.desc}`); return; }

  const tab = e.target.closest('.tab');
  if (tab){ switchTab(tab.dataset.tab); return; }
});

/* ----------------------------
   Tab switching
   ---------------------------- */
function switchTab(name){
  $$('.tab').forEach(t=> t.classList.toggle('is-on', t.dataset.tab===name));
  $$('.tab-panel').forEach(p=>{
    const id = p.id.replace('panel-','');
    const show = id === name;
    p.classList.toggle('hidden', !show);
    p.setAttribute('aria-hidden', !show);
  });
}

/* ----------------------------
   Init function
   ---------------------------- */
function init(){
  // show confetti first-time
  showConfettiIfNeeded();

  // save first visit / visited dates
  if (!PROG.firstVisit){
    PROG.firstVisit = true;
    PROG.visitedOn = PROG.visitedOn || [];
    PROG.visitedOn.push(todayISO());
    PROG.streakDays = 1;
    lsSave(LS_KEYS.PROGRESS, PROG);
    lsSave(LS_KEYS.PROGRESS, PROG);
    toast('¡Bienvenido al evento de aniversario!');
  } else {
    // push today's date if not present (track visits)
    PROG.visitedOn = PROG.visitedOn || [];
    const today = todayISO();
    if (!PROG.visitedOn.includes(today)){
      PROG.visitedOn.push(today);
      // update streakDays naive approach: if last visit was yesterday increment
      // but for demo keep simple: increase if last date is yesterday
      const last = PROG.visitedOn[PROG.visitedOn.length - 2];
      if (last){
        const lastD = new Date(last), tD = new Date(today);
        const diffDays = Math.round((tD - lastD)/(1000*60*60*24));
        if (diffDays === 1) PROG.streakDays = (PROG.streakDays || 0) + 1;
        else PROG.streakDays = 1;
      } else {
        PROG.streakDays = 1;
      }
      lsSave(LS_KEYS.PROGRESS, PROG);
    }
  }

  renderProgress();
  renderMissions();
  renderQuickLists();
  renderLevels();
  renderShop();
  renderBadgesPanel();
  renderBadgesGrid();
  renderNewsAnn();
  renderVillagerMsgs();

  // bind buy/claim buttons inside dynamic content (delegated above)
  // start tick
  tick();
  setInterval(tick, 20000); // every 20s update restocks/timers UI
  // small UI reveals
  setTimeout(()=> $$('.reveal').forEach(el=> el.classList.add('is-in')), 200);
}

/* ----------------------------
   Helpers & safety
   ---------------------------- */
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, t => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[t])); }
function msToReadableShort(ms){
  if (ms > DAYS(1)) return Math.round(ms/DAYS(1)) + 'd';
  if (ms > 3600000) return Math.round(ms/3600000)+'h';
  return Math.round(ms/60000)+'m';
}

/* ----------------------------
   Small UI helpers
   ---------------------------- */
function toast(msg, time=1600){
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._id);
  t._id = setTimeout(()=> t.classList.remove('show'), time);
}

/* ----------------------------
   Start app on DOM ready
   ---------------------------- */
document.addEventListener('DOMContentLoaded', ()=>{
  init();
});

/* ----------------------------
   Expose some debug helpers to console for extension:
   window.MV = { addXP, completeMission, buyItem, PROG, SHOP_STATE, MISSIONS_STATE }
   ---------------------------- */
window.MV = { addXP, completeMission, buyItem, PROG, SHOP_STATE, MISSIONS_STATE, BADGES_STATE };