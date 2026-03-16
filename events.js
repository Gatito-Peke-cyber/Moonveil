/* =========================================================
   Moonveil Portal — Events Hub (JS v3 + HUD Player)
   ========================================================= */

import { onAuthChange }          from './auth.js';
import { syncAllToLocalStorage } from './database.js';

/* =========================================================
   CATEGORÍAS Y TARJETAS  ← edita aquí
   ========================================================= */
const CATEGORIES = [

  // ── PRINCIPAL ──────────────────────────────────────────
  {
    id: "principal", icon: "🏠", name: "Principal",
    color: "#a855f7",
    items: [
      { title:"Inicio",   desc:"Página de bienvenida del portal.",              emoji:"🌙", url:"inicio.html", bg:"img/picture6.jpg"  },
      { title:"Perfiles Aldeanil", desc:"Explora y gestiona los perfiles de los aldeanos.", emoji:"👤", url:"perfiles.html", bg:"vill/teacher.jpg" },
      { title:"Noticias Aldeanil", desc:"Noticias del mundo.",       emoji:"📰", url:"noticias.html", startDate:"2026-02-23", bg:"gif/villager-news.gif"},
      { title:"Foro Aldeanil",     desc:"Algunas novedades de los aldeanos. Y quien sabe un chisme...", emoji:"💬", url:"foro.html", bg:"vill/booktea.gif"},
      { title:"Contacto Aldeanil", desc:"Pues aqui se habla con los aldeanos del mundo. No todos pero si algunos...", emoji:"📩", url:"contactos.html", bg:"imagen/golem1.jpg"},
      { title:"Updates",  desc:"Registro de todas las actualizaciones.",        emoji:"🔄", url:"updates.html", startDate:"2026-03-01", bg:"img/picture1.jpg"},
      { title:"History",  desc:"Algunas historias, sin concluir...",            emoji:"📜", url:"historia.html", startDate:"2026-05-01", bg:"imagen/diary.jpg"},
      { title:"Cofres, y mas Cofres...", desc:"Aqui hay algunos cofres... ¿Que Sand Brill patrocino?... Pero de igual manera hay cofres, eh!...", emoji:"⭐", url:"chest.html", startDate:"2026-01-01", bg:"img/picture4.jpg"},
    ]
  },

  // ── COMUNIDAD & ECONOMÍA ───────────────────────────────
  {
    id: "economia", icon: "💎", name: "Comunidad & Economía",
    color: "#06b6d4",
    items: [
      { title:"Tradeos", desc:"Sistema de intercambios entre aldeanos, aunque ellos solo piden esmeraldas.¡Que se puede hacer si solo piden eso!", emoji:"🔀", url:"tradeos.html", startDate:"2026-04-10", bg:"img-pass/trading.jpg"},
      { title:"Tienda",  desc:"Compra lo que mas te convenga.¡Y eso si hay cupones!Obvio si tienes...", emoji:"🛒", url:"tienda.html", bg:"img/mine.gif"},
      { title:"Bank",    desc:"Gestiona tus monedas y depósitos.¡Que no se te pase su tiempo!", emoji:"🏦", url:"banco.html", accent:"#10b981", bg:"img/picture3.jpg"},
      { title:"Ruleta",  desc:"¡Prueba tu suerte y gana premios! Y si quieres mas tickets, compralos en la tienda...", emoji:"🎫", url:"premios.html", daysTotal:44, accent:"#f59e0b", startDate:"2026-02-26", bg:"gif/5am.gif"},
      { title:"Posts",   desc:"Bueno, supongo que aqui postean los aldeanos...", emoji:"💬", url:"ins.html", startDate:"2026-04-01", bg:"img/picture2.jpg"},
    ]
  },

  // ── HERRAMIENTAS ──────────────────────────────────────
  {
    id: "herramientas", icon: "🛠️", name: "Herramientas & Minijuegos",
    color: "#06b6d4",
    items: [
      { title:"Calendar", desc:"Calendario de inicio de sesion. Se renueva cada mes.", emoji:"📅", url:"calendar.html", isCalendar:true, accent:"#06b6d4", bg:"gif/rain1.gif"},
      { title:"Sand", desc:"...", emoji:"⚡", url:"SBM-G.html", accent:"#f59e0b", startDate:"2026-02-22", expiry:"2026-04-15", daysTotal:60, bg:"img/picture4.jpg"},
      { title:"Minepass", desc:"Lleguemos hasta las estrellas, tu sabes que no te abandonare, porque eres mi gran amigo. Nunca lo olvides y siempre estara tu amiguito David Kal...", emoji:"🎫", url:"pases.html", startDate:"2026-02-28", expiry:"2026-04-01", daysTotal:30, accent:"#06b6d4", bg:"img/universe1.gif"},
      { title:"Minigame", desc:"Un minijuego, asi que gestiona bien tu dinero y comercia bien... y ten cuidado con los ¡bandidos!... Asi que suerte", emoji:"⭐⭐⭐", url:"min.html", startDate:"2026-02-20", expiry:"2026-04-01", daysTotal:39, accent:"#06b6d4", bg:"gif/noche1.gif"},
      { title:"Harvest Corp", desc:"Maneja tu empresa de cultivos y haz que crezca con esfuerzo y sudor... Pues capaz no tanto pero haz que tu empresa este en lo alto y con marketing capaz llegue aun mas lejos...¡Yo confio en usted jefe!", emoji:"🌟", url:"em.html", startDate:"2026-02-20", expiry:"2026-05-01", daysTotal:69, accent:"#f43f5e", bg:"gif/2am.gif"},
      { title:"████ Master??", desc:"Supongo que el esta vez quizo o tratara de hacer una ¿broma?, bueno eso creemos, pero quien sabe...Que tramara esta vez...", emoji:"🎭", url:"ddb.html", startDate:"2026-03-30", expiry:"2026-04-30", daysTotal:30, accent:"#f43f5e", bg:"imagen/steve3.jpg"},
      { title:"Cultivos Eden", desc:"Hola amigos, aqui les habla Eden y pues quiero que me ayudes a generar mucho dinerito, pues ya que tu eres un estratega en los negocios pues se que tu podras.¿Verdad?", emoji:"🌻", url:"cul.html", startDate:"2026-02-20", expiry:"2026-04-30", daysTotal:30, accent:"#f43f5e", bg:"gif/4am.gif"},
      { title:"Investigaciones", desc:"¡Hola Agente ████! Tenemos que resolver estos casos, por eso necesitamos su ayuda, contamos contigo Agente...", emoji:"🔎", url:"invs.html", startDate:"2026-02-23", expiry:"2026-04-30", daysTotal:50, accent:"#f43f5e", bg:"gif/creaking-minecraft.gif"},
      { title:"Minelife", desc:"¡Hola ████! Bueno,¡eh!... No tengo palabras...", emoji:"🌳", url:"minecraft.html", startDate:"2026-02-20", expiry:"2026-04-30", daysTotal:50, accent:"#f43f5e", bg:"img-pass/fox-xy.jpg"},
      { title:"Minestone", desc:"¡Hola ████! Puedes sobrevivir, con 10 corazones,¿seguro? Pues si creo...!¡", emoji:"🌳", url:"aventure.html", startDate:"2026-02-20", expiry:"2026-04-20", daysTotal:50, accent:"#f59e0b", bg:"img-pass/pokki.jpg"},
    ]
  },

  // ── EVENTOS ESPECIALES ────────────────────────────────
  {
    id: "eventos", icon: "🎉", name: "Eventos Especiales",
    color: "#ec4899",
    items: [
      { title:"Eventos",         desc:"Centro de todos los eventos activos del mundo.",    emoji:"🎫", url:"eventos.html", accent:"#f43f5e", bg:"img-pass/animalsphoto.jpg"},
      { title:"Valentine",       desc:"Evento especial de San Valentín.¿Con un caso por resolver...?", emoji:"💖", url:"sv.html", expiry:"2026-02-20", daysTotal:1, accent:"#ec4899", bg:"ach/5i.png"},
      { title:"Dragon Hunter",   desc:"Caza 20 Ender Dragons y alcanza la gloria.",         emoji:"🐉", url:"dragon.html", expiry:"2026-04-20", daysTotal:20, accent:"#a855f7", bg:"ach/4y.png"},
      { title:"Año Lunar",       desc:"Celebra el Año Nuevo Lunar con recompensas.",        emoji:"🏮", url:"lny.html", expiry:"2026-03-06", daysTotal:18, accent:"#f59e0b", bg:"img-pass/añomine.jpg"},
      { title:"Event Emerald",   desc:"La lluvia de Esmeraldas.",                           emoji:"🟢", url:"emerald.html", startDate:"2026-02-22", expiry:"2026-03-30", daysTotal:6, accent:"#f59e0b", bg:"ach/5y.png"},
      { title:"Anniversary!!",   desc:"Un año mas en este mundo cubico Moonveil...",        emoji:"🎂", url:"ann.html", startDate:"2026-04-10", expiry:"2026-12-30", daysTotal:120, accent:"#f59e0b", bg:"img-pass/partymine.jpg"},
      { title:"Próximo Evento",  desc:"Un nuevo evento se aproxima. ¡Prepárate!",           emoji:"🔮", url:"#", startDate:"2030-04-01", accent:"#818cf8"},
      { title:"Minesafio",       desc:"Seguro es muy facil, espero...",                     emoji:"⚡", url:"batt.html", startDate:"2026-03-04", expiry:"2026-03-10", daysTotal:6, accent:"#f59e0b", bg:"ach/2m.png"},
    ]
  },

  // ── CELEBRACIONES ─────────────────────────────────────
  {
    id: "celebrar", icon: "⭐", name: "Celebraciones",
    color: "#6366f1",
    items: [
      { title:"¡Que recuerdos...!", desc:"Pero no dejemos de seguir creando recuerdos", emoji:"🌳", url:"album.html", startDate:"2026-02-20", expiry:"2026-06-01", daysTotal:50, accent:"#f59e0b", bg:"img/universe1.gif"},
      { title:"♡♡♡♡♡♡♡♡♡♡♡♡♡♡♡",  desc:"Si que es un gran dia...¡Asi que celebremos!", emoji:"🌟", url:"tsm.html", startDate:"2026-04-20", expiry:"2026-04-21", daysTotal:2, accent:"#f59e0b", bg:"dav/alex1.jpg"},
      { title:"♡♡♡♡♡♡♡♡♡♡♡♡♡♡♡",  desc:"Si que es un gran dia...¡Asi que celebremos!", emoji:"🌟", url:"lns.html", startDate:"2026-06-17", expiry:"2026-06-18", daysTotal:2, accent:"#f59e0b", bg:"dav/steve2.jpg"},
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
  const [y,m,d] = str.split("-").map(Number);
  return new Date(y, m-1, d);
}
function cardStatus(item) {
  const now   = today();
  const start = parseDate(item.startDate);
  const end   = parseDate(item.expiry);
  if (end   && now > end)   return "expired";
  if (start && now < start) return "soon";
  return "active";
}
function daysUntil(date) {
  return Math.max(0, Math.ceil((date - today()) / 86400000));
}
function daysSince(date) {
  return Math.max(0, Math.ceil((today() - date) / 86400000));
}
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
  const wrap = document.createElement("div");
  wrap.className = "card-countdown" + (colorClass ? ` card-${colorClass}-cd` : "");

  const PARTS  = ["d","h","m","s"];
  const LABELS = { d:"días", h:"horas", m:"min", s:"seg" };
  const els    = {};

  PARTS.forEach(p => {
    const block = document.createElement("div");
    block.className = "cd-block";
    const val = document.createElement("span");
    val.className = "cd-value"; val.textContent = "00";
    const lbl = document.createElement("span");
    lbl.className = "cd-label"; lbl.textContent = LABELS[p];
    block.append(val, lbl);
    wrap.appendChild(block);
    els[p] = val;
  });

  function update() {
    const v = getValuesFn();
    if (!v) { wrap.innerHTML = '<span class="chip-ok card-chip">¡Comenzó!</span>'; return; }
    els.d.textContent = String(v.d).padStart(2,"0");
    els.h.textContent = String(v.h).padStart(2,"0");
    els.m.textContent = String(v.m).padStart(2,"0");
    els.s.textContent = String(v.s).padStart(2,"0");
  }
  update();
  setInterval(update, 1000);
  return wrap;
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
  const accent = item.accent || categoryColor || "#a855f7";

  const tag  = (status === "active" && item.url && item.url !== "#") ? "a" : "div";
  const card = document.createElement(tag);
  card.className = "hub-card";
  card.style.animationDelay = `${index * 0.07}s`;
  if (tag === "a") card.href = item.url;

  if (status === "expired") card.classList.add("card-locked");
  if (status === "soon")    card.classList.add("card-soon");

  card.style.setProperty("--card-accent", accent);

  if (item.bg) {
    const bgDiv = document.createElement("div");
    bgDiv.className = "card-bg";
    bgDiv.style.backgroundImage = `url('${item.bg}')`;
    card.appendChild(bgDiv);
    const ov = document.createElement("div");
    ov.className = "card-overlay";
    card.appendChild(ov);
  } else {
    const glow = document.createElement("div");
    glow.className = "card-glow";
    glow.style.cssText = `width:140px;height:140px;top:-40px;right:-40px;background:${accent};opacity:0;`;
    card.appendChild(glow);
  }

  const body = document.createElement("div");
  body.className = "card-body";

  const em = document.createElement("div");
  em.className = "card-emoji";
  em.textContent = item.emoji || "📄";
  body.appendChild(em);

  const ti = document.createElement("div");
  ti.className = "card-title";
  ti.textContent = item.title;
  body.appendChild(ti);

  const div = document.createElement("div");
  div.className = "card-divider";
  div.style.background = `linear-gradient(90deg, ${accent}99, ${accent}33)`;
  body.appendChild(div);

  const de = document.createElement("div");
  de.className = "card-desc";
  de.textContent = item.desc || "";
  body.appendChild(de);

  if (status === "expired") {
    const chip = document.createElement("span");
    chip.className = "card-chip chip-exp";
    chip.textContent = "🔒 Evento terminado";
    body.appendChild(chip);
  } else if (status === "soon") {
    const chip = document.createElement("span");
    chip.className = "card-chip chip-soon";
    chip.textContent = "⏳ Próximamente";
    body.appendChild(chip);
    body.appendChild(buildCountdown(makeSoonFn(item.startDate), ""));
  } else if (item.isCalendar) {
    const chip = document.createElement("span");
    chip.className = "card-chip chip-calendar";
    chip.textContent = "📅 Se renueva cada mes";
    body.appendChild(chip);
    body.appendChild(buildCountdown(makeMonthFn(), "month"));
  } else if (item.expiry) {
    const remaining = daysUntil(parseDate(item.expiry));
    const chip = document.createElement("span");
    chip.className = "card-chip chip-ok";
    chip.textContent = remaining > 0
      ? `✅ Activo · termina en ${remaining}d`
      : "✅ Activo · ¡último día!";
    body.appendChild(chip);
    body.appendChild(buildCountdown(makeExpiryFn(item.expiry), "expiry"));
  }

  card.appendChild(body);

  // Barra de progreso
  if (status === "active" && item.expiry && item.daysTotal) {
    const end   = parseDate(item.expiry);
    const start = new Date(end);
    start.setDate(start.getDate() - item.daysTotal);
    const elapsed   = daysSince(start);
    const remaining = Math.max(0, 100 - Math.min(100, Math.round((elapsed / item.daysTotal)*100)));

    const barWrap = document.createElement("div"); barWrap.className = "card-days-bar";
    const fill    = document.createElement("div"); fill.className = "card-days-fill";
    fill.style.cssText = `width:0%;background:linear-gradient(90deg,${accent}cc,${accent})`;
    barWrap.appendChild(fill);
    card.appendChild(barWrap);
    setTimeout(() => { fill.style.width = remaining + "%"; }, 400 + index*65);
  }

  // Barra del mes
  if (status === "active" && item.isCalendar) {
    const { dayOfMonth, totalDays } = daysLeftInMonth();
    const pct = Math.round((dayOfMonth / totalDays) * 100);
    const barWrap = document.createElement("div"); barWrap.className = "card-days-bar";
    const fill    = document.createElement("div"); fill.className = "card-days-fill month-fill";
    fill.style.width = "0%";
    barWrap.appendChild(fill);
    card.appendChild(barWrap);
    setTimeout(() => { fill.style.width = (100-pct) + "%"; }, 400 + index*65);
  }

  if (status === "expired") {
    card.addEventListener("click", e => { e.preventDefault(); toast("🔒 Este evento ya terminó."); });
  }
  if (status === "soon") {
    card.addEventListener("click", e => { e.preventDefault(); toast("⏳ ¡Pronto disponible, espéralo!"); });
  }

  return card;
}

/* =========================================================
   RENDER CATEGORÍAS
   ========================================================= */
function render() {
  const hub = document.getElementById("hubBody");
  if (!hub) return;
  hub.innerHTML = "";

  CATEGORIES.forEach((cat, ci) => {
    const section = document.createElement("section");
    section.className = "category";
    section.style.animationDelay = `${ci * 0.1}s`;

    const header = document.createElement("div");
    header.className = "category-header";
    header.innerHTML = `
      <span class="category-icon">${cat.icon}</span>
      <span class="category-name">${cat.name}</span>
      <span class="category-count">${cat.items.length} sección${cat.items.length!==1?"es":""}</span>
    `;
    section.appendChild(header);

    const grid = document.createElement("div");
    grid.className = "cards-grid";
    cat.items.forEach((item, ii) => grid.appendChild(buildCard(item, ii, cat.color)));
    section.appendChild(grid);
    hub.appendChild(section);
  });
}

/* =========================================================
   NAVBAR TOGGLE
   ========================================================= */
const navToggle = document.getElementById("navToggle");
const navLinks  = document.getElementById("navLinks");
navToggle?.addEventListener("click", e => { e.stopPropagation(); navLinks.classList.toggle("open"); });
document.addEventListener("click", e => {
  if (!navToggle?.contains(e.target) && !navLinks?.contains(e.target))
    navLinks?.classList.remove("open");
});

/* =========================================================
   PARTÍCULAS
   ========================================================= */
(function particles() {
  const c = document.getElementById("bgParticles");
  if (!c) return;
  const ctx = c.getContext("2d");
  const dpi = Math.max(1, devicePixelRatio || 1);
  let w, h, parts;
  const hues = [270,290,310,330,190,210,40,160];

  const init = () => {
    w = c.width  = innerWidth  * dpi;
    h = c.height = innerHeight * dpi;
    parts = Array.from({length:120}, () => ({
      x: Math.random()*w, y: Math.random()*h,
      r: (.6 + Math.random()*2.5)*dpi,
      s: .15 + Math.random()*.7,
      a: .07 + Math.random()*.28,
      hue: hues[Math.floor(Math.random()*hues.length)],
      tw: Math.random()*Math.PI*2,
      tws: .02 + Math.random()*.04
    }));
  };

  const tick = () => {
    ctx.clearRect(0,0,w,h);
    parts.forEach(p => {
      p.y += p.s; p.x += Math.sin(p.y*.001+p.tw)*.4; p.tw += p.tws;
      if (p.y > h) { p.y = -10; p.x = Math.random()*w; }
      const alpha = p.a * (.6 + .4*Math.sin(p.tw));
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle = `hsla(${p.hue},80%,70%,${alpha})`; ctx.fill();
    });
    requestAnimationFrame(tick);
  };
  init(); tick();
  addEventListener("resize", init);
})();

/* =========================================================
   TOAST
   ========================================================= */
function toast(msg) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 2800);
}

/* =========================================================
   HUD — Títulos con rareza (copia mínima para el hub)
   ========================================================= */
const HUD_TITLES = [
  { id:"tl_novato",          name:"NOVATO",                rarity:"comun"      },
  { id:"tl_explorador",      name:"EXPLORADOR",             rarity:"comun"      },
  { id:"tl_constante",       name:"CONSTANTE",              rarity:"comun"      },
  { id:"tl_cazador",         name:"CAZADOR",                rarity:"comun"      },
  { id:"tl_aventurero",      name:"AVENTURERO",             rarity:"comun"      },
  { id:"tl_combatiente",     name:"COMBATIENTE",            rarity:"raro"       },
  { id:"tl_guerrero",        name:"GUERRERO",               rarity:"raro"       },
  { id:"tl_perseverante",    name:"PERSEVERANTE",           rarity:"raro"       },
  { id:"tl_coleccionista",   name:"COLECCIONISTA",          rarity:"raro"       },
  { id:"tl_veterano",        name:"VETERANO DE GUERRA",     rarity:"raro"       },
  { id:"tl_rico",            name:"ADINERADO",              rarity:"raro"       },
  { id:"tl_elite",           name:"ÉLITE",                  rarity:"epico"      },
  { id:"tl_campeon",         name:"CAMPEÓN",                rarity:"epico"      },
  { id:"tl_sdc",             name:"SEÑOR DE LA GUERRA",     rarity:"epico"      },
  { id:"tl_magnate",         name:"MAGNATE DEL XP",         rarity:"epico"      },
  { id:"tl_maestro",         name:"MAESTRO",                rarity:"legendario" },
  { id:"tl_incansable",      name:"INCANSABLE",             rarity:"legendario" },
  { id:"tl_supremo_col",     name:"SUPREMO COLECCIONISTA",  rarity:"legendario" },
  { id:"tl_oscuro",          name:"SEÑOR OSCURO",           rarity:"legendario" },
  { id:"tl_eterno",          name:"GUERRERO ETERNO",        rarity:"legendario" },
  { id:"tl_leyenda",         name:"LEYENDA DEL PORTAL",     rarity:"legendario" },
  { id:"tl_absoluto",        name:"EL ABSOLUTO",            rarity:"mitico"     },
  { id:"tl_nexo_caos",       name:"NEXO DEL CAOS",          rarity:"mitico"     },
  { id:"tl_dios",            name:"DIOS DEL PORTAL",        rarity:"mitico"     },
  { id:"tl_pionero_mar2026", name:"PIONERO DE LUNA",        rarity:"especial"   },
];

/* Umbrales de nivel */
const HUD_LVL_THR = [0,100,250,450,700,1000,1400,1850,2400,3000,3700,4500,5500,6800,8400,10200];

function hudLS(key, fallback = null) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

function hudLevel(xp) {
  let lv = 1;
  for (let i = 0; i < HUD_LVL_THR.length; i++) if (xp >= HUD_LVL_THR[i]) lv = i + 1;
  return Math.min(lv, HUD_LVL_THR.length);
}

function hudXpPct(lv, xp) {
  if (lv >= HUD_LVL_THR.length) return 100;
  const base = HUD_LVL_THR[lv - 1], next = HUD_LVL_THR[lv];
  return Math.min(100, Math.max(0, ((xp - base) / (next - base)) * 100));
}

function hudAnimateBar(elId, pct) {
  const el = document.getElementById(elId);
  if (!el) return;
  requestAnimationFrame(() => {
    setTimeout(() => {
      el.style.setProperty("--v", Math.round(pct));
      el.setAttribute("aria-valuenow", Math.round(pct));
    }, 120);
  });
}

function hudSet(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

/* ── Actualiza todo el HUD con datos de localStorage ── */
function initHUD() {
  const profile  = hudLS("mv_perfil",    {});
  const inv      = hudLS("mv_inventory", {});
  const badges   = hudLS("mv_badges",    []);
  const missions = hudLS("mv_misiones",  {});
  const titleId  = localStorage.getItem("mv_title_active") || "tl_novato";

  const xp     = profile.xp    ?? 0;
  const racha  = profile.racha ?? 0;
  const lv     = hudLevel(xp);
  const xpPct  = hudXpPct(lv, xp);
  const hpPct  = Math.min(100, Math.round((racha / 30) * 100));
  const mDone  = Object.values(missions).filter(m => m?.done).length;

  // Avatar
  const avatarEl = document.getElementById("hudAvatarEmoji");
  if (avatarEl) avatarEl.textContent = profile.avatar || "🌙";

  // Nombre (truncado para no romper layout)
  const rawName = (profile.nombre || "AVENTURERO").toUpperCase();
  hudSet("hudPlayerName", rawName.length > 11 ? rawName.slice(0, 10) + "…" : rawName);

  // Nivel
  hudSet("hudLevelChip", `Nv.${lv}`);

  // Título activo con rareza
  const titleEl = document.getElementById("hudPlayerTitle");
  if (titleEl) {
    const t = HUD_TITLES.find(x => x.id === titleId);
    if (t) {
      titleEl.textContent = `✦ ${t.name} ✦`;
      titleEl.dataset.rarity = t.rarity;
      titleEl.hidden = false;
    } else {
      titleEl.hidden = true;
    }
  }

  // Barra Racha (HP)
  hudAnimateBar("hudHpBar", hpPct);
  hudSet("hudHpVal", `${racha}d`);

  // Barra XP al siguiente nivel
  hudAnimateBar("hudXpBar", Math.round(xpPct));
  hudSet("hudXpVal", xp >= 1000
    ? `${(xp/1000).toFixed(1)}k XP`
    : `${xp} XP`);

  // Mini stats
  hudSet("hudRachaVal",    racha);
  hudSet("hudBadgesVal",   badges.length);
  hudSet("hudMissionsVal", mDone);

  // Inventario
  hudSet("hudTickets",   inv.tickets        ?? 0);
  hudSet("hudKeys",      inv.keys           ?? 0);
  hudSet("hudSuperKeys", inv.superstar_keys ?? 0);
}

/* =========================================================
   INIT
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  render();

  // Footer año
  const fy = document.getElementById("footerYear");
  if (fy) fy.textContent = new Date().getFullYear();

  // Contador secciones activas
  const active = CATEGORIES.flatMap(c => c.items).filter(i => cardStatus(i) === "active").length;
  const badge  = document.getElementById("heroBadgeCount");
  if (badge) badge.textContent = active;

  // HUD — carga inmediata desde localStorage (sin esperar a Firebase)
  initHUD();

  // HUD — sincroniza con Firebase en segundo plano
  onAuthChange(async (user) => {
    if (!user) return;
    try {
      await syncAllToLocalStorage(user.uid, user);
      initHUD(); // refresca con datos reales del servidor
    } catch (err) {
      console.warn("[Hub HUD] Firebase sync error:", err);
    }
  });

  // Easter egg en el título
  document.querySelector(".ht-accent")?.addEventListener("click", () => {
    const msgs = [
      "✨ ¡Moonveil Portal!",
      "🌙 ¡Que empiece la aventura!",
      "💫 ¡Explora todo!",
      "🚀 ¡Eres una leyenda!",
    ];
    toast(msgs[Math.floor(Math.random() * msgs.length)]);
  });

  setTimeout(() => toast(`🌙 ${active} secciones activas esperándote`), 900);
});