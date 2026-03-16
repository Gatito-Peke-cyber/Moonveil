/* =========================================================
   Moonveil Portal — Events Hub (JS v4 — Space Edition)
   Firebase Auth · HUD Pixel Art · Shooting Stars
   ========================================================= */
'use strict';

import { onAuthChange, logout } from './auth.js';
import {
  syncAllToLocalStorage,
  PERFIL_KEY,
  BADGES_KEY,
  INVENTORY_KEY,
  PLAYER_ID_KEY,
  TITLES_KEY,
  TITLE_ACTIVE_KEY,
} from './database.js';

/* =========================================================
   NIVEL (igual que perfil.js)
   ========================================================= */
const LEVEL_THR   = [0,100,250,450,700,1000,1400,1850,2400,3000,3700,4500,5500,6800,8400,10200];
const LEVEL_NAMES = ['NOVATO','EXPLORADOR','COMBATIENTE','GUERRERO','ÉLITE','CAMPEÓN','MAESTRO','LEYENDA','SEMIDIÓS','INMORTAL','ARCANO','SUPREMO','MÍTICO','DIVINO','ETERNO','ABSOLUTO'];

function computeLevel(xp) {
  let lv = 1;
  for (let i = 0; i < LEVEL_THR.length; i++) if (xp >= LEVEL_THR[i]) lv = i + 1;
  return Math.min(lv, LEVEL_THR.length);
}
function xpProgress(lv, xp) {
  if (lv >= LEVEL_THR.length) return { pct: 100, cur: xp, next: 'MAX' };
  const base = LEVEL_THR[lv - 1], next = LEVEL_THR[lv];
  return { pct: Math.min(100, ((xp - base) / (next - base)) * 100), cur: xp, next };
}

/* =========================================================
   TÍTULOS (rarity map para colores)
   ========================================================= */
const TITLE_COLORS = {
  comun: '#30d158', raro: '#f5c518', epico: '#bf5af2',
  legendario: '#f5c518', mitico: '#00e5ff', especial: '#30d158',
};

function getTitleDef(titleId) {
  // Mapa básico de títulos — ajusta según tu TITLES_DEF completo
  const map = {
    tl_novato:      { name:'NOVATO',           rarity:'comun'     },
    tl_explorador:  { name:'EXPLORADOR',        rarity:'comun'     },
    tl_combatiente: { name:'COMBATIENTE',       rarity:'raro'      },
    tl_guerrero:    { name:'GUERRERO',          rarity:'raro'      },
    tl_elite:       { name:'ÉLITE',             rarity:'epico'     },
    tl_campeon:     { name:'CAMPEÓN',           rarity:'epico'     },
    tl_maestro:     { name:'MAESTRO',           rarity:'legendario'},
    tl_leyenda:     { name:'LEYENDA DEL PORTAL',rarity:'mitico'    },
    tl_absoluto:    { name:'EL ABSOLUTO',       rarity:'mitico'    },
    tl_dios:        { name:'DIOS DEL PORTAL',   rarity:'mitico'    },
  };
  return map[titleId] || null;
}

/* =========================================================
   HELPER LOCAL STORAGE
   ========================================================= */
function ls(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }

/* =========================================================
   ACTUALIZAR HUD CON DATOS DEL USUARIO
   ========================================================= */
function updateHUD() {
  const profile   = ls(PERFIL_KEY)   || {};
  const badges    = ls(BADGES_KEY)   || [];
  const inventory = ls(INVENTORY_KEY)|| { tickets:0, keys:0, superstar_keys:0 };
  const playerID  = localStorage.getItem(PLAYER_ID_KEY) || '';
  const activeTitle = localStorage.getItem(TITLE_ACTIVE_KEY) || '';

  const xp    = profile.xp    || 0;
  const racha = profile.racha || 0;
  const lv    = computeLevel(xp);
  const xpInfo = xpProgress(lv, xp);

  // Nombre
  const nameEl = document.getElementById('hudPlayerName');
  if (nameEl) nameEl.textContent = (profile.nombre || 'AVENTURERO').toUpperCase();

  // Avatar
  const avatarEl = document.getElementById('hudAvatar');
  if (avatarEl) avatarEl.textContent = profile.avatar || '🌙';

  // Nivel + Rango
  const lvEl = document.getElementById('hudLevel');
  const rkEl = document.getElementById('hudRank');
  if (lvEl) lvEl.textContent = lv;
  if (rkEl) rkEl.textContent = LEVEL_NAMES[lv - 1] || 'NOVATO';

  // Barra XP
  const xpFill = document.getElementById('hudXpFill');
  const xpVal  = document.getElementById('hudXpVal');
  if (xpFill) setTimeout(() => { xpFill.style.width = xpInfo.pct + '%'; }, 300);
  if (xpVal)  xpVal.textContent = `${xpInfo.cur}/${xpInfo.next}`;

  // Stats rápidos
  const xpTotEl   = document.getElementById('hudXpTotal');
  const rachaEl   = document.getElementById('hudRacha');
  const badgesEl  = document.getElementById('hudBadges');
  if (xpTotEl)  xpTotEl.textContent  = xp;
  if (rachaEl)  rachaEl.textContent  = racha;
  if (badgesEl) badgesEl.textContent = badges.length;

  // Inventario
  const ticketsEl  = document.getElementById('hudTickets');
  const keysEl     = document.getElementById('hudKeys');
  const superKeyEl = document.getElementById('hudSuperKeys');
  if (ticketsEl)  ticketsEl.textContent  = inventory.tickets        || 0;
  if (keysEl)     keysEl.textContent     = inventory.keys           || 0;
  if (superKeyEl) superKeyEl.textContent = inventory.superstar_keys || 0;

  // Player ID
  const pidEl = document.getElementById('hudPlayerId');
  if (pidEl) pidEl.textContent = playerID || '—';

  // Título activo
  const titleBadge = document.getElementById('hudTitleBadge');
  const titleText  = document.getElementById('hudTitleText');
  if (titleBadge && titleText && activeTitle) {
    const tDef = getTitleDef(activeTitle);
    if (tDef) {
      titleText.textContent = tDef.name;
      const color = TITLE_COLORS[tDef.rarity] || '#3b82f6';
      titleBadge.style.color       = color;
      titleBadge.style.borderColor = color + '60';
      titleBadge.style.background  = color + '12';
      titleBadge.style.display     = 'inline-block';
    }
  }
}

/* =========================================================
   COPIAR PLAYER ID
   ========================================================= */
function copyPlayerID() {
  const pid = localStorage.getItem(PLAYER_ID_KEY) || '';
  if (!pid || pid === '—') return;
  navigator.clipboard?.writeText(pid)
    .then(() => toast('📋 ID copiado al portapapeles'))
    .catch(() => {
      const el = document.createElement('textarea');
      el.value = pid; document.body.appendChild(el); el.select();
      document.execCommand('copy'); document.body.removeChild(el);
      toast('📋 ID copiado al portapapeles');
    });
}

/* =========================================================
   CATEGORÍAS Y TARJETAS  ← edita aquí
   ========================================================= */
const CATEGORIES = [

  // ── PRINCIPAL ──────────────────────────────────────────
  {
    id: "principal", icon: "🏠", name: "Principal",
    color: "#a855f7",
    items: [
      { title:"Inicio",            desc:"Página de bienvenida del portal.",                                                             emoji:"🌙", url:"inicio.html",    bg:"img/picture6.jpg"   },
      { title:"Perfiles Aldeanil", desc:"Explora y gestiona los perfiles de los aldeanos.",                                             emoji:"👤", url:"perfiles.html",  bg:"vill/teacher.jpg"   },
      { title:"Noticias Aldeanil", desc:"Noticias del mundo.",                                                                          emoji:"📰", url:"noticias.html",  startDate:"2026-02-23", bg:"gif/villager-news.gif" },
      { title:"Foro Aldeanil",     desc:"Algunas novedades de los aldeanos. Y quien sabe un chisme...",                                 emoji:"💬", url:"foro.html",       bg:"vill/booktea.gif"   },
      { title:"Contacto Aldeanil", desc:"Pues aqui se habla con los aldeanos del mundo. No todos pero si algunos...",                   emoji:"📩", url:"contactos.html", bg:"imagen/golem1.jpg"  },
      { title:"Updates",           desc:"Registro de todas las actualizaciones.",                                                        emoji:"🔄", url:"updates.html",   startDate:"2026-03-01", bg:"img/picture1.jpg" },
      { title:"History",           desc:"Algunas historias, sin concluir...",                                                            emoji:"📜", url:"historia.html",  startDate:"2026-05-01", bg:"imagen/diary.jpg" },
      { title:"Cofres, y mas Cofres...", desc:"Aqui hay algunos cofres... ¿Que Sand Brill patrocino?... Pero de igual manera hay cofres!", emoji:"⭐", url:"chest.html", startDate:"2026-01-01", bg:"img/picture4.jpg" },
    ]
  },

  // ── COMUNIDAD & ECONOMÍA ───────────────────────────────
  {
    id: "economia", icon: "💎", name: "Comunidad & Economía",
    color: "#06b6d4",
    items: [
      { title:"Tradeos", desc:"Sistema de intercambios entre aldeanos, aunque ellos solo piden esmeraldas. ¡Que se puede hacer!",    emoji:"🔀", url:"tradeos.html", startDate:"2026-04-10", bg:"img-pass/trading.jpg" },
      { title:"Tienda",  desc:"Compra lo que mas te convenga. ¡Y eso si hay cupones! Obvio si tienes...",                            emoji:"🛒", url:"tienda.html",  bg:"img/mine.gif" },
      { title:"Bank",    desc:"Gestiona tus monedas y depósitos. ¡Que no se te pase su tiempo!",                                    emoji:"🏦", url:"banco.html",   accent:"#10b981", bg:"img/picture3.jpg" },
      { title:"Ruleta",  desc:"¡Prueba tu suerte y gana premios! Y si quieres mas tickets, compralos en la tienda...",               emoji:"🎫", url:"premios.html", daysTotal:44, accent:"#f59e0b", startDate:"2026-02-26", bg:"gif/5am.gif" },
      { title:"Posts",   desc:"Bueno, supongo que aqui postean los aldeanos...",                                                     emoji:"💬", url:"ins.html",     startDate:"2026-04-01", bg:"img/picture2.jpg" },
    ]
  },

  // ── HERRAMIENTAS & MINIJUEGOS ─────────────────────────
  {
    id: "herramientas", icon: "🛠️", name: "Herramientas & Minijuegos",
    color: "#06b6d4",
    items: [
      { title:"Calendar",       desc:"Calendario de inicio de sesion. Se renueva cada mes.",          emoji:"📅", url:"calendar.html",  isCalendar:true, accent:"#06b6d4",  bg:"gif/rain1.gif"                },
      { title:"Sand",           desc:"...",                                                            emoji:"⚡", url:"SBM-G.html",     accent:"#f59e0b", startDate:"2026-02-22", expiry:"2026-04-15", daysTotal:60, bg:"img/picture4.jpg" },
      { title:"Minepass",       desc:"Lleguemos hasta las estrellas, tu sabes que no te abandonare.", emoji:"🎫", url:"pases.html",      accent:"#06b6d4", startDate:"2026-02-28", expiry:"2026-04-01", daysTotal:30, bg:"img/universe1.gif" },
      { title:"Minigame",       desc:"Un minijuego, gestiona bien tu dinero y comercia bien... ¡cuidado con los bandidos!",
                                                                                                       emoji:"⭐⭐⭐", url:"min.html",  accent:"#06b6d4", startDate:"2026-02-20", expiry:"2026-04-01", daysTotal:39, bg:"gif/noche1.gif" },
      { title:"Harvest Corp",   desc:"Maneja tu empresa de cultivos y haz que crezca con esfuerzo y sudor...",
                                                                                                       emoji:"🌟", url:"em.html",        accent:"#f43f5e", startDate:"2026-02-20", expiry:"2026-05-01", daysTotal:69, bg:"gif/2am.gif" },
      { title:"████ Master??",  desc:"Supongo que el esta vez quizo o tratara de hacer una ¿broma?",  emoji:"🎭", url:"ddb.html",       accent:"#f43f5e", startDate:"2026-03-30", expiry:"2026-04-30", daysTotal:30, bg:"imagen/steve3.jpg" },
      { title:"Cultivos Eden",  desc:"Hola amigos, aqui les habla Eden y pues quiero que me ayudes a generar mucho dinerito.",
                                                                                                       emoji:"🌻", url:"cul.html",       accent:"#f43f5e", startDate:"2026-02-20", expiry:"2026-04-30", daysTotal:30, bg:"gif/4am.gif" },
      { title:"Investigaciones",desc:"¡Hola Agente ████! Tenemos que resolver estos casos.",          emoji:"🔎", url:"invs.html",      accent:"#f43f5e", startDate:"2026-02-23", expiry:"2026-04-30", daysTotal:50, bg:"gif/creaking-minecraft.gif" },
      { title:"Minelife",       desc:"¡Hola ████! Bueno, ¡eh!... No tengo palabras...",               emoji:"🌳", url:"minecraft.html", accent:"#f43f5e", startDate:"2026-02-20", expiry:"2026-04-30", daysTotal:50, bg:"img-pass/fox-xy.jpg" },
      { title:"Minestone",      desc:"¡Hola ████! Puedes sobrevivir con 10 corazones, ¿seguro?",     emoji:"🌳", url:"aventure.html",  accent:"#f59e0b", startDate:"2026-02-20", expiry:"2026-04-20", daysTotal:50, bg:"img-pass/pokki.jpg" },
    ]
  },

  // ── EVENTOS ESPECIALES ────────────────────────────────
  {
    id: "eventos", icon: "🎉", name: "Eventos Especiales",
    color: "#ec4899",
    items: [
      { title:"Eventos",        desc:"Centro de todos los eventos activos del mundo.",                emoji:"🎫", url:"eventos.html",  accent:"#f43f5e", bg:"img-pass/animalsphoto.jpg" },
      { title:"Valentine",      desc:"Evento especial de San Valentín. ¿Con un caso por resolver...?",emoji:"💖", url:"sv.html",       accent:"#ec4899", expiry:"2026-02-20", daysTotal:1, bg:"ach/5i.png" },
      { title:"Dragon Hunter",  desc:"Caza 20 Ender Dragons y alcanza la gloria.",                    emoji:"🐉", url:"dragon.html",   accent:"#a855f7", expiry:"2026-04-20", daysTotal:20, bg:"ach/4y.png" },
      { title:"Año Lunar",      desc:"Celebra el Año Nuevo Lunar con recompensas.",                   emoji:"🏮", url:"lny.html",      accent:"#f59e0b", expiry:"2026-03-06", daysTotal:18, bg:"img-pass/añomine.jpg" },
      { title:"Event Emerald",  desc:"La lluvia de Esmeraldas.",                                       emoji:"🟢", url:"emerald.html",  accent:"#f59e0b", startDate:"2026-02-22", expiry:"2026-03-30", daysTotal:6, bg:"ach/5y.png" },
      { title:"Anniversary!!",  desc:"Un año mas en este mundo cubico Moonveil...",                   emoji:"🎂", url:"ann.html",      accent:"#f59e0b", startDate:"2026-04-10", expiry:"2026-12-30", daysTotal:120, bg:"img-pass/partymine.jpg" },
      { title:"Próximo Evento", desc:"Un nuevo evento se aproxima. ¡Prepárate!",                      emoji:"🔮", url:"#",             accent:"#818cf8", startDate:"2030-04-01" },
      { title:"Minesafio",      desc:"Seguro es muy facil, espero...",                                 emoji:"⚡", url:"batt.html",     accent:"#f59e0b", startDate:"2026-03-04", expiry:"2026-03-10", daysTotal:6, bg:"ach/2m.png" },
    ]
  },

  // ── CELEBRACIONES ─────────────────────────────────────
  {
    id: "celebrar", icon: "⭐", name: "Celebraciones",
    color: "#6366f1",
    items: [
      { title:"¡Que recuerdos...!", desc:"Pero no dejemos de seguir creando recuerdos",             emoji:"🌳", url:"album.html", accent:"#f59e0b", startDate:"2026-02-20", expiry:"2026-06-01", daysTotal:50, bg:"img/universe1.gif" },
      { title:"♡♡♡♡♡♡♡♡♡♡♡♡♡♡♡",  desc:"Si que es un gran dia... ¡Asi que celebremos!",           emoji:"🌟", url:"tsm.html",   accent:"#f59e0b", startDate:"2026-04-20", expiry:"2026-04-21", daysTotal:2, bg:"dav/alex1.jpg" },
      { title:"♡♡♡♡♡♡♡♡♡♡♡♡♡♡♡",  desc:"Si que es un gran dia... ¡Asi que celebremos!",           emoji:"🌟", url:"lns.html",   accent:"#f59e0b", startDate:"2026-06-17", expiry:"2026-06-18", daysTotal:2, bg:"dav/steve2.jpg" },
    ]
  },
];

/* =========================================================
   UTILIDADES DE FECHA
   ========================================================= */
function today() {
  const d = new Date(); d.setHours(0,0,0,0); return d;
}
function parseDate(str) {
  if (!str) return null;
  const [y,m,d] = str.split('-').map(Number);
  return new Date(y, m-1, d);
}
function cardStatus(item) {
  const now   = today();
  const start = parseDate(item.startDate);
  const end   = parseDate(item.expiry);
  if (end   && now > end)   return 'expired';
  if (start && now < start) return 'soon';
  return 'active';
}
function daysUntil(date) { return Math.max(0, Math.ceil((date - today()) / 86400000)); }
function daysSince(date)  { return Math.max(0, Math.ceil((today() - date) / 86400000)); }
function daysLeftInMonth() {
  const now  = new Date();
  const last = new Date(now.getFullYear(), now.getMonth()+1, 0);
  last.setHours(23,59,59,999);
  const diff = last - now;
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor(diff / 3600000)  % 24,
    m: Math.floor(diff / 60000)    % 60,
    s: Math.floor(diff / 1000)     % 60,
    totalDays: last.getDate(),
    dayOfMonth: now.getDate()
  };
}

/* =========================================================
   CUENTA REGRESIVA
   ========================================================= */
function buildCountdown(getValuesFn, colorClass) {
  const wrap = document.createElement('div');
  wrap.className = 'card-countdown' + (colorClass ? ` card-${colorClass}-cd` : '');
  const PARTS  = ['d','h','m','s'];
  const LABELS = { d:'días', h:'horas', m:'min', s:'seg' };
  const els    = {};
  PARTS.forEach(p => {
    const block = document.createElement('div');
    block.className = 'cd-block';
    const val = document.createElement('span'); val.className = 'cd-value'; val.textContent = '00';
    const lbl = document.createElement('span'); lbl.className = 'cd-label'; lbl.textContent = LABELS[p];
    block.append(val, lbl); wrap.appendChild(block); els[p] = val;
  });
  function update() {
    const v = getValuesFn();
    if (!v) { wrap.innerHTML = '<span class="chip-ok card-chip">¡Comenzó!</span>'; return; }
    els.d.textContent = String(v.d).padStart(2,'0');
    els.h.textContent = String(v.h).padStart(2,'0');
    els.m.textContent = String(v.m).padStart(2,'0');
    els.s.textContent = String(v.s).padStart(2,'0');
  }
  update(); setInterval(update, 1000); return wrap;
}
function makeSoonFn(dateStr) {
  const t = parseDate(dateStr);
  return () => {
    const d = t - new Date(); if (d <= 0) return null;
    return { d:Math.floor(d/86400000), h:Math.floor(d/3600000)%24, m:Math.floor(d/60000)%60, s:Math.floor(d/1000)%60 };
  };
}
function makeExpiryFn(dateStr) {
  const t = parseDate(dateStr); t.setHours(23,59,59,999);
  return () => {
    const d = t - new Date(); if (d <= 0) return null;
    return { d:Math.floor(d/86400000), h:Math.floor(d/3600000)%24, m:Math.floor(d/60000)%60, s:Math.floor(d/1000)%60 };
  };
}
function makeMonthFn() {
  return () => {
    const v = daysLeftInMonth();
    if (v.d===0&&v.h===0&&v.m===0&&v.s===0) return null;
    return v;
  };
}

/* =========================================================
   CONSTRUIR TARJETA
   ========================================================= */
function buildCard(item, index, categoryColor) {
  const status = cardStatus(item);
  const accent = item.accent || categoryColor || '#3b82f6';

  const tag  = (status === 'active' && item.url && item.url !== '#') ? 'a' : 'div';
  const card = document.createElement(tag);
  card.className = 'hub-card';
  card.style.animationDelay = `${index * 0.07}s`;
  if (tag === 'a') card.href = item.url;

  if (status === 'expired') card.classList.add('card-locked');
  if (status === 'soon')    card.classList.add('card-soon');

  card.style.setProperty('--card-accent', accent);

  if (item.bg) {
    const bgDiv = document.createElement('div');
    bgDiv.className = 'card-bg';
    bgDiv.style.backgroundImage = `url('${item.bg}')`;
    card.appendChild(bgDiv);
    const ov = document.createElement('div'); ov.className = 'card-overlay';
    card.appendChild(ov);
  } else {
    const glow = document.createElement('div'); glow.className = 'card-glow';
    glow.style.cssText = `width:140px;height:140px;top:-40px;right:-40px;background:${accent};opacity:0;`;
    card.appendChild(glow);
  }

  const body = document.createElement('div'); body.className = 'card-body';

  const em = document.createElement('div'); em.className = 'card-emoji';
  em.textContent = item.emoji || '📄'; body.appendChild(em);

  const ti = document.createElement('div'); ti.className = 'card-title';
  ti.textContent = item.title; body.appendChild(ti);

  const div = document.createElement('div'); div.className = 'card-divider';
  div.style.background = `linear-gradient(90deg,${accent}99,${accent}33)`;
  body.appendChild(div);

  const de = document.createElement('div'); de.className = 'card-desc';
  de.textContent = item.desc || ''; body.appendChild(de);

  if (status === 'expired') {
    const chip = document.createElement('span'); chip.className = 'card-chip chip-exp';
    chip.textContent = '🔒 Evento terminado'; body.appendChild(chip);
  } else if (status === 'soon') {
    const chip = document.createElement('span'); chip.className = 'card-chip chip-soon';
    chip.textContent = '⏳ Próximamente'; body.appendChild(chip);
    body.appendChild(buildCountdown(makeSoonFn(item.startDate), ''));
  } else if (item.isCalendar) {
    const chip = document.createElement('span'); chip.className = 'card-chip chip-calendar';
    chip.textContent = '📅 Se renueva cada mes'; body.appendChild(chip);
    body.appendChild(buildCountdown(makeMonthFn(), 'month'));
  } else if (item.expiry) {
    const remaining = daysUntil(parseDate(item.expiry));
    const chip = document.createElement('span'); chip.className = 'card-chip chip-ok';
    chip.textContent = remaining > 0 ? `✅ Activo · termina en ${remaining}d` : '✅ Activo · ¡último día!';
    body.appendChild(chip);
    body.appendChild(buildCountdown(makeExpiryFn(item.expiry), 'expiry'));
  }

  card.appendChild(body);

  // Barra de progreso
  if (status === 'active' && item.expiry && item.daysTotal) {
    const end   = parseDate(item.expiry);
    const start = new Date(end); start.setDate(start.getDate() - item.daysTotal);
    const elapsed   = daysSince(start);
    const remaining = Math.max(0, 100 - Math.min(100, Math.round((elapsed / item.daysTotal)*100)));
    const barWrap = document.createElement('div'); barWrap.className = 'card-days-bar';
    const fill    = document.createElement('div'); fill.className = 'card-days-fill';
    fill.style.cssText = `width:0%;background:linear-gradient(90deg,${accent}cc,${accent})`;
    barWrap.appendChild(fill); card.appendChild(barWrap);
    setTimeout(() => { fill.style.width = remaining + '%'; }, 400 + index*65);
  }
  if (status === 'active' && item.isCalendar) {
    const { dayOfMonth, totalDays } = daysLeftInMonth();
    const pct = Math.round((dayOfMonth / totalDays) * 100);
    const barWrap = document.createElement('div'); barWrap.className = 'card-days-bar';
    const fill    = document.createElement('div'); fill.className = 'card-days-fill month-fill';
    fill.style.width = '0%'; barWrap.appendChild(fill); card.appendChild(barWrap);
    setTimeout(() => { fill.style.width = (100-pct) + '%'; }, 400 + index*65);
  }

  if (status === 'expired') {
    card.addEventListener('click', e => { e.preventDefault(); toast('🔒 Este evento ya terminó.'); });
  }
  if (status === 'soon') {
    card.addEventListener('click', e => { e.preventDefault(); toast('⏳ ¡Pronto disponible, espéralo!'); });
  }

  return card;
}

/* =========================================================
   RENDER CATEGORÍAS
   ========================================================= */
function render() {
  const hub = document.getElementById('hubBody');
  if (!hub) return;
  hub.innerHTML = '';

  CATEGORIES.forEach((cat, ci) => {
    const section = document.createElement('section');
    section.className = 'category';
    section.style.animationDelay = `${ci * 0.1}s`;

    const header = document.createElement('div');
    header.className = 'category-header';
    header.innerHTML = `
      <span class="category-icon">${cat.icon}</span>
      <span class="category-name">${cat.name}</span>
      <span class="category-count">${cat.items.length} sección${cat.items.length !== 1 ? 'es' : ''}</span>
    `;
    section.appendChild(header);

    const grid = document.createElement('div'); grid.className = 'cards-grid';
    cat.items.forEach((item, ii) => grid.appendChild(buildCard(item, ii, cat.color)));
    section.appendChild(grid);
    hub.appendChild(section);
  });
}

/* =========================================================
   NAVBAR
   ========================================================= */
function initNavbar() {
  const navToggle = document.getElementById('navToggle');
  const navLinks  = document.getElementById('navLinks');
  navToggle?.addEventListener('click', e => { e.stopPropagation(); navLinks.classList.toggle('open'); });
  document.addEventListener('click', e => {
    if (!navToggle?.contains(e.target) && !navLinks?.contains(e.target))
      navLinks?.classList.remove('open');
  });
}

/* =========================================================
   LOGOUT
   ========================================================= */
function initLogout() {
  document.getElementById('btnLogout')?.addEventListener('click', async e => {
    e.preventDefault();
    if (!confirm('¿Cerrar sesión?')) return;
    try { await logout(); } catch {}
    window.location.href = 'index.html';
  });
}

/* =========================================================
   TOAST
   ========================================================= */
function toast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2800);
}

/* =========================================================
   LOADER PIXEL ART
   ========================================================= */
function hideLoader() {
  const loader = document.getElementById('hudLoader');
  const fill   = document.getElementById('hlFill');
  if (!loader) return;
  let w = 0;
  const iv = setInterval(() => {
    w += Math.random() * 18 + 6;
    if (fill) fill.style.width = Math.min(w, 100) + '%';
    if (w >= 100) {
      clearInterval(iv);
      setTimeout(() => {
        loader.style.transition = 'opacity .4s';
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 400);
      }, 250);
    }
  }, 60);
}

/* =========================================================
   PARTÍCULAS + ESTRELLAS FUGACES
   ========================================================= */
(function particles() {
  const c = document.getElementById('bgParticles');
  if (!c) return;
  const ctx = c.getContext('2d');
  const dpi = Math.max(1, devicePixelRatio || 1);
  let w, h, parts, shootingStars = [];

  /* Paleta azul/espacio */
  const hues = [210, 220, 195, 235, 260, 180, 200, 50];

  /* ── Inicializar ── */
  const init = () => {
    w = c.width  = innerWidth  * dpi;
    h = c.height = innerHeight * dpi;

    parts = Array.from({ length: 130 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: (.5 + Math.random() * 2) * dpi,
      s: .12 + Math.random() * .55,
      a: .06 + Math.random() * .25,
      hue: hues[Math.floor(Math.random() * hues.length)],
      tw:  Math.random() * Math.PI * 2,
      tws: .015 + Math.random() * .035,
    }));
  };

  /* ── Crear estrella fugaz ── */
  function spawnShootingStar() {
    // Arranca desde la parte superior o lateral izquierda
    const fromTop = Math.random() < .6;
    shootingStars.push({
      x:     fromTop ? Math.random() * w * .7 : 0,
      y:     fromTop ? Math.random() * h * .25 : Math.random() * h * .4,
      vx:    (5 + Math.random() * 8)  * dpi,
      vy:    (2 + Math.random() * 4)  * dpi,
      len:   (90 + Math.random() * 130) * dpi,
      alpha: 1,
      decay: .018 + Math.random() * .014,
      hue:   210 + Math.random() * 40,
    });
  }

  /* Lanzar estrellas fugaces periódicamente */
  function scheduleStar() {
    setTimeout(() => {
      spawnShootingStar();
      if (Math.random() < .35) setTimeout(spawnShootingStar, 150 + Math.random() * 200); // doble
      scheduleStar();
    }, 2200 + Math.random() * 4000);
  }

  /* ── Loop de animación ── */
  const tick = () => {
    ctx.clearRect(0, 0, w, h);

    /* Partículas flotantes */
    parts.forEach(p => {
      p.y  += p.s;
      p.x  += Math.sin(p.y * .001 + p.tw) * .35;
      p.tw += p.tws;
      if (p.y > h) { p.y = -10; p.x = Math.random() * w; }
      const alpha = p.a * (.6 + .4 * Math.sin(p.tw));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue},80%,70%,${alpha})`;
      ctx.fill();
    });

    /* Estrellas fugaces */
    shootingStars = shootingStars.filter(s => s.alpha > 0);
    shootingStars.forEach(s => {
      const tailX = s.x - (s.vx / Math.hypot(s.vx, s.vy)) * s.len;
      const tailY = s.y - (s.vy / Math.hypot(s.vx, s.vy)) * s.len;

      const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
      grad.addColorStop(0, `hsla(${s.hue},90%,90%,0)`);
      grad.addColorStop(.7, `hsla(${s.hue},90%,90%,${s.alpha * .5})`);
      grad.addColorStop(1, `hsla(${s.hue},100%,100%,${s.alpha})`);

      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(s.x, s.y);
      ctx.strokeStyle = grad;
      ctx.lineWidth   = 2 * dpi * s.alpha;
      ctx.lineCap     = 'round';
      ctx.stroke();

      /* Destello en la punta */
      ctx.beginPath();
      ctx.arc(s.x, s.y, 2.5 * dpi * s.alpha, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${s.hue},100%,100%,${s.alpha})`;
      ctx.fill();

      s.x     += s.vx;
      s.y     += s.vy;
      s.alpha -= s.decay;
    });

    requestAnimationFrame(tick);
  };

  init(); tick();
  scheduleStar();
  addEventListener('resize', init);
})();

/* =========================================================
   INIT PRINCIPAL
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {

  hideLoader();
  initNavbar();
  initLogout();

  /* Player ID — copiar al clic */
  document.getElementById('hudIdSection')?.addEventListener('click', copyPlayerID);
  document.getElementById('hudIdSection')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') copyPlayerID();
  });

  /* Escuchar auth de Firebase */
  onAuthChange(async (user) => {
    if (!user) {
      window.location.href = 'index.html';
      return;
    }

    /* Sincronizar datos desde Firestore → localStorage */
    try {
      await syncAllToLocalStorage(user.uid, user);
    } catch (err) {
      console.warn('[Hub] sync error:', err);
    }

    /* Actualizar HUD */
    updateHUD();

    /* Renderizar tarjetas */
    render();

    /* Badge de secciones activas */
    const active = CATEGORIES.flatMap(c => c.items).filter(i => cardStatus(i) === 'active').length;
    const badge  = document.getElementById('heroBadgeCount');
    if (badge) badge.textContent = active;

    /* Año en footer */
    const fy = document.getElementById('footerYear');
    if (fy) fy.textContent = new Date().getFullYear();

    /* Toast de bienvenida */
    setTimeout(() => toast(`🌌 ¡Bienvenido! ${active} secciones activas`), 800);
  });

  /* Easter egg en el título */
  document.querySelector('.ht-accent')?.addEventListener('click', () => {
    const msgs = ['✨ ¡Moonveil Portal!','🌌 ¡Que empiece la aventura!','💫 ¡Explora el universo!','🚀 ¡Leyenda del espacio!'];
    toast(msgs[Math.floor(Math.random() * msgs.length)]);
  });
});