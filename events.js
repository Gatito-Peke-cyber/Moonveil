/* =========================================================
   Moonveil Portal — events.js  v4
   Pixel Art Space Theme · Firebase Auth · Shooting Stars

   ¿Cómo agregar/editar tarjetas?
   ————————————————————————————————
   Cada tarjeta acepta:
     title      (string)  — Nombre visible
     desc       (string)  — Descripción corta
     emoji      (string)  — Emoji principal
     url        (string)  — Ruta de la página
     bg         (string)  — (opcional) URL imagen de fondo
     expiry     (string)  — (opcional) "YYYY-MM-DD" — fecha en que se bloquea
     startDate  (string)  — (opcional) "YYYY-MM-DD" — antes de esta = próximamente
     daysTotal  (number)  — (opcional) días totales del evento (barra de progreso)
     isCalendar (boolean) — (opcional) true = contador días del mes
     accent     (string)  — (opcional) color CSS del acento de la tarjeta
   ========================================================= */

import { auth }   from './firebase.js';
import { onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";

/* ── Presencia (opcional, no bloquea si falla) ── */
async function tryUpdatePresence(uid, state, section) {
  try {
    const { updatePresence } = await import('./database.js');
    await updatePresence(uid, state, section);
  } catch { /* silencioso */ }
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
      { title:"Inicio",            desc:"Página de bienvenida del portal.",                        emoji:"🌙", url:"inicio.html",    bg:"img/picture6.jpg"        },
      { title:"Perfiles Aldeanil", desc:"Explora y gestiona los perfiles de los aldeanos.",        emoji:"👤", url:"perfiles.html",  bg:"vill/teacher.jpg"        },
      { title:"Noticias Aldeanil", desc:"Noticias del mundo.",                                     emoji:"📰", url:"noticias.html",  bg:"gif/villager-news.gif",   startDate:"2026-02-23" },
      { title:"Foro Aldeanil",     desc:"Novedades de los aldeanos. Y quien sabe algún chisme...", emoji:"💬", url:"foro.html",      bg:"vill/booktea.gif"         },
      { title:"Contacto Aldeanil", desc:"Habla con los aldeanos del mundo.",                       emoji:"📩", url:"contactos.html", bg:"imagen/golem1.jpg"        },
      { title:"Updates",           desc:"Registro de todas las actualizaciones.",                  emoji:"🔄", url:"updates.html",   bg:"img/picture1.jpg",        startDate:"2026-03-01" },
      { title:"History",           desc:"Algunas historias, sin concluir...",                      emoji:"📜", url:"historia.html",  bg:"imagen/diary.jpg",        startDate:"2026-05-01" },
      { title:"Cofres, y mas Cofres...", desc:"¡Sand Brill patrocina! Hay cofres esperándote...", emoji:"⭐", url:"chest.html",     bg:"img/picture4.jpg",        startDate:"2026-01-01" },
    ]
  },

  // ── COMUNIDAD & ECONOMÍA ───────────────────────────────
  {
    id: "economia", icon: "💎", name: "Comunidad & Economía",
    color: "#06b6d4",
    items: [
      { title:"Tradeos", desc:"Intercambios entre aldeanos — ¡solo aceptan esmeraldas!",          emoji:"🔀", url:"tradeos.html", bg:"img-pass/trading.jpg",   startDate:"2026-04-10" },
      { title:"Tienda",  desc:"Compra lo que más te convenga. ¡Y hay cupones!",                   emoji:"🛒", url:"tienda.html",  bg:"img/mine.gif"            },
      { title:"Bank",    desc:"Gestiona tus monedas y depósitos. ¡Que no se pase su tiempo!",     emoji:"🏦", url:"banco.html",   bg:"img/picture3.jpg",       accent:"#10b981" },
      { title:"Ruleta",  desc:"¡Prueba tu suerte y gana premios! Más tickets en la tienda...",    emoji:"🎫", url:"premios.html", bg:"gif/5am.gif",             daysTotal:44, accent:"#f59e0b", startDate:"2026-02-26" },
      { title:"Posts",   desc:"Bueno, supongo que aquí postean los aldeanos...",                  emoji:"💬", url:"ins.html",     bg:"img/picture2.jpg",        startDate:"2026-04-01" },
    ]
  },

  // ── HERRAMIENTAS & MINIJUEGOS ─────────────────────────
  {
    id: "herramientas", icon: "🛠️", name: "Herramientas & Minijuegos",
    color: "#06b6d4",
    items: [
      { title:"Calendar",         desc:"Calendario de inicio de sesión. Se renueva cada mes.",                                              emoji:"📅", url:"calendar.html",  bg:"gif/rain1.gif",            isCalendar:true, accent:"#06b6d4" },
      { title:"Sand",             desc:"...",                                                                                                emoji:"⚡", url:"SBM-G.html",     bg:"img/picture4.jpg",         accent:"#f59e0b",  startDate:"2026-02-22", expiry:"2026-04-15", daysTotal:60 },
      { title:"Minepass",         desc:"Lleguemos hasta las estrellas, tu sabes que no te abandonaré, porque eres mi gran amigo...",        emoji:"🎫", url:"pases.html",     bg:"img/universe1.gif",        accent:"#06b6d4",  startDate:"2026-02-28", expiry:"2026-04-01", daysTotal:30 },
      { title:"Minigame",         desc:"Un minijuego — gestiona bien tu dinero y ten cuidado con los ¡bandidos!",                          emoji:"⭐⭐⭐", url:"min.html", bg:"gif/noche1.gif",           accent:"#06b6d4",  startDate:"2026-02-20", expiry:"2026-04-01", daysTotal:39 },
      { title:"Harvest Corp",     desc:"Maneja tu empresa de cultivos y haz que crezca. ¡Yo confío en usted jefe!",                        emoji:"🌟", url:"em.html",        bg:"gif/2am.gif",              accent:"#f43f5e",  startDate:"2026-02-20", expiry:"2026-05-01", daysTotal:69 },
      { title:"████ Master??",    desc:"¿Broma? ¿O algo más? Quien sabe qué tramará esta vez...",                                          emoji:"🎭", url:"ddb.html",       bg:"imagen/steve3.jpg",        accent:"#f43f5e",  startDate:"2026-03-30", expiry:"2026-04-30", daysTotal:30 },
      { title:"Cultivos Eden",    desc:"Ayuda a Eden a generar mucho dinerito. ¿Verdad que puedes, estratega?",                            emoji:"🌻", url:"cul.html",       bg:"gif/4am.gif",              accent:"#f43f5e",  startDate:"2026-02-20", expiry:"2026-04-30", daysTotal:30 },
      { title:"Investigaciones",  desc:"¡Hola Agente ████! Tenemos casos por resolver. Contamos contigo...",                               emoji:"🔎", url:"invs.html",      bg:"gif/creaking-minecraft.gif",accent:"#f43f5e", startDate:"2026-02-23", expiry:"2026-04-30", daysTotal:50 },
      { title:"Minelife",         desc:"¡Hola ████! Bueno, ¡eh!... No tengo palabras...",                                                  emoji:"🌳", url:"minecraft.html", bg:"img-pass/fox-xy.jpg",      accent:"#f43f5e",  startDate:"2026-02-20", expiry:"2026-04-30", daysTotal:50 },
      { title:"Minestone",        desc:"¡Hola ████! ¿Puedes sobrevivir con 10 corazones? Seguro que sí...",                               emoji:"🌳", url:"aventure.html",  bg:"img-pass/pokki.jpg",        accent:"#f59e0b", startDate:"2026-02-20", expiry:"2026-04-20", daysTotal:50 },
    ]
  },

  // ── EVENTOS ESPECIALES ────────────────────────────────
  {
    id: "eventos", icon: "🎉", name: "Eventos Especiales",
    color: "#ec4899",
    items: [
      { title:"Eventos",        desc:"Centro de todos los eventos activos del mundo.",           emoji:"🎫", url:"eventos.html",  bg:"img-pass/animalsphoto.jpg", accent:"#f43f5e" },
      { title:"Valentine",      desc:"Evento especial de San Valentín. ¿Con un caso por resolver?", emoji:"💖", url:"sv.html",  bg:"ach/5i.png",                accent:"#ec4899", expiry:"2026-02-20", daysTotal:1 },
      { title:"Dragon Hunter",  desc:"Caza 20 Ender Dragons y alcanza la gloria.",              emoji:"🐉", url:"dragon.html",   bg:"ach/4y.png",                accent:"#a855f7", expiry:"2026-04-20", daysTotal:20 },
      { title:"Año Lunar",      desc:"Celebra el Año Nuevo Lunar con recompensas.",             emoji:"🏮", url:"lny.html",      bg:"img-pass/añomine.jpg",      accent:"#f59e0b", expiry:"2026-03-06", daysTotal:18 },
      { title:"Event Emerald",  desc:"La lluvia de Esmeraldas.",                                emoji:"🟢", url:"emerald.html",  bg:"ach/5y.png",                accent:"#10b981", startDate:"2026-02-22", expiry:"2026-03-30", daysTotal:6 },
      { title:"Anniversary!!", desc:"Un año más en este mundo cúbico Moonveil...",              emoji:"🎂", url:"ann.html",      bg:"img-pass/partymine.jpg",    accent:"#f59e0b", startDate:"2026-04-10", expiry:"2026-12-30", daysTotal:120 },
      { title:"Próximo Evento", desc:"Un nuevo evento se aproxima. ¡Prepárate!",                emoji:"🔮", url:"#",             accent:"#818cf8",               startDate:"2030-04-01" },
      { title:"Minesafio",      desc:"Seguro es muy fácil, espero...",                          emoji:"⚡", url:"batt.html",     bg:"ach/2m.png",                accent:"#f59e0b", startDate:"2026-03-04", expiry:"2026-03-10", daysTotal:6 },
    ]
  },

  // ── CELEBRACIONES ─────────────────────────────────────
  {
    id: "celebrar", icon: "⭐", name: "Celebraciones",
    color: "#6366f1",
    items: [
      { title:"¡Que recuerdos...!",         desc:"Pero no dejemos de seguir creando recuerdos",            emoji:"🌳", url:"album.html", bg:"img/universe1.gif",  accent:"#f59e0b", startDate:"2026-02-20", expiry:"2026-06-01", daysTotal:50 },
      { title:"♡♡♡♡♡♡♡♡♡♡♡♡♡♡♡",            desc:"Si que es un gran dia...¡Asi que celebremos!",           emoji:"🌟", url:"tsm.html",   bg:"dav/alex1.jpg",      accent:"#f59e0b", startDate:"2026-04-20", expiry:"2026-04-21", daysTotal:2 },
      { title:"♡♡♡♡♡♡♡♡♡♡♡♡♡♡♡",            desc:"Si que es un gran dia...¡Asi que celebremos!",           emoji:"🌟", url:"lns.html",   bg:"dav/steve2.jpg",     accent:"#f59e0b", startDate:"2026-06-17", expiry:"2026-06-18", daysTotal:2 },
    ]
  }
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
    if (!v) {
      wrap.innerHTML = '<span class="card-chip chip-ok" style="margin-top:8px">¡COMENZÓ!</span>';
      return;
    }
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
   CONSTRUIR TARJETA (Pixel Art)
   ========================================================= */
function buildCard(item, index, categoryColor) {
  const status = cardStatus(item);
  const accent = item.accent || categoryColor || "#00e5ff";

  const tag  = (status === "active" && item.url && item.url !== "#") ? "a" : "div";
  const card = document.createElement(tag);
  card.className = "hub-card";
  card.style.animationDelay = `${index * 0.06}s`;
  if (tag === "a") card.href = item.url;

  if (status === "expired") card.classList.add("card-locked");
  if (status === "soon")    card.classList.add("card-soon");

  card.style.setProperty("--card-accent", accent);

  /* Fondo imagen */
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
    glow.style.cssText = `width:120px;height:120px;top:-30px;right:-30px;background:${accent};opacity:0;`;
    card.appendChild(glow);
  }

  /* Cuerpo */
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
  body.appendChild(div);

  const de = document.createElement("div");
  de.className = "card-desc";
  de.textContent = item.desc || "";
  body.appendChild(de);

  /* Estado */
  if (status === "expired") {
    const chip = document.createElement("span");
    chip.className = "card-chip chip-exp";
    chip.textContent = "🔒 EVENTO TERMINADO";
    body.appendChild(chip);

  } else if (status === "soon") {
    const chip = document.createElement("span");
    chip.className = "card-chip chip-soon";
    chip.textContent = "⏳ PRÓXIMAMENTE";
    body.appendChild(chip);
    body.appendChild(buildCountdown(makeSoonFn(item.startDate), ""));

  } else if (item.isCalendar) {
    const chip = document.createElement("span");
    chip.className = "card-chip chip-calendar";
    chip.textContent = "📅 RENUEVA CADA MES";
    body.appendChild(chip);
    body.appendChild(buildCountdown(makeMonthFn(), "month"));

  } else if (item.expiry) {
    const remaining = daysUntil(parseDate(item.expiry));
    const chip = document.createElement("span");
    chip.className = "card-chip chip-ok";
    chip.textContent = remaining > 0
      ? `✅ ACTIVO · ${remaining}D`
      : "✅ ACTIVO · ¡HOY!";
    body.appendChild(chip);
    body.appendChild(buildCountdown(makeExpiryFn(item.expiry), "expiry"));
  }

  card.appendChild(body);

  /* Barra de progreso */
  if (status === "active" && item.expiry && item.daysTotal) {
    const end   = parseDate(item.expiry);
    const start = new Date(end);
    start.setDate(start.getDate() - item.daysTotal);
    const elapsed   = daysSince(start);
    const remaining = Math.max(0, 100 - Math.min(100, Math.round((elapsed / item.daysTotal)*100)));

    const barWrap = document.createElement("div"); barWrap.className = "card-days-bar";
    const fill    = document.createElement("div"); fill.className    = "card-days-fill";
    fill.style.cssText = `width:0%; background:linear-gradient(90deg,${accent}aa,${accent})`;
    barWrap.appendChild(fill);
    card.appendChild(barWrap);
    setTimeout(() => { fill.style.width = remaining + "%"; }, 420 + index*60);
  }

  /* Barra del mes */
  if (status === "active" && item.isCalendar) {
    const { dayOfMonth, totalDays } = daysLeftInMonth();
    const pct = Math.round((dayOfMonth / totalDays) * 100);
    const barWrap = document.createElement("div"); barWrap.className = "card-days-bar";
    const fill    = document.createElement("div"); fill.className    = "card-days-fill month-fill";
    fill.style.width = "0%";
    barWrap.appendChild(fill);
    card.appendChild(barWrap);
    setTimeout(() => { fill.style.width = (100-pct) + "%"; }, 420 + index*60);
  }

  /* Click bloqueado */
  if (status === "expired") {
    card.addEventListener("click", e => {
      e.preventDefault();
      card.classList.add("shake");
      setTimeout(() => card.classList.remove("shake"), 450);
      toast("🔒 ESTE EVENTO YA TERMINÓ");
    });
  }
  if (status === "soon") {
    card.addEventListener("click", e => { e.preventDefault(); toast("⏳ ¡PRONTO DISPONIBLE!"); });
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
    section.style.animationDelay = `${ci * 0.08}s`;

    const header = document.createElement("div");
    header.className = "category-header";
    header.innerHTML = `
      <span class="category-icon">${cat.icon}</span>
      <span class="category-name">${cat.name}</span>
      <span class="category-count">${cat.items.length} SECCIÓN${cat.items.length !== 1 ? "ES" : ""}</span>
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
   ESTRELLAS FUGACES + PARTÍCULAS ESPACIALES
   ========================================================= */
function initStars() {
  const canvas = document.getElementById("starsCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const dpi = Math.max(1, window.devicePixelRatio || 1);
  let W, H, stars, shootingStars;

  /* Colores espaciales */
  const COLORS = ["#00e5ff","#7b2fff","#a855f7","#ff2d9b","#ffffff","#ffd700","#66f9ff"];

  const init = () => {
    W = canvas.width  = window.innerWidth  * dpi;
    H = canvas.height = window.innerHeight * dpi;

    /* Estrellas fijas */
    stars = Array.from({ length: 140 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: (.5 + Math.random() * 2) * dpi,
      a: .06 + Math.random() * .25,
      speed: .05 + Math.random() * .4,
      ci: Math.floor(Math.random() * COLORS.length),
      tw: Math.random() * Math.PI * 2,
      tws: .02 + Math.random() * .03
    }));

    /* Estrellas fugaces */
    shootingStars = Array.from({ length: 4 }, () => createShootingStar());
  };

  function createShootingStar() {
    return {
      x: Math.random() * W,
      y: Math.random() * H * 0.5,
      len: (80 + Math.random() * 200) * dpi,
      speed: (3 + Math.random() * 8) * dpi,
      angle: (25 + Math.random() * 20) * Math.PI / 180, /* diagonal */
      alpha: 0,
      maxAlpha: .6 + Math.random() * .4,
      state: "appearing", /* appearing | moving | fading | waiting */
      wait: Math.random() * 300,
      waitTick: 0,
      color: COLORS[Math.floor(Math.random() * 3)] /* cyan/purple/pink */
    };
  }

  function updateShootingStar(s) {
    if (s.state === "waiting") {
      s.waitTick++;
      if (s.waitTick >= s.wait) {
        Object.assign(s, createShootingStar());
        s.state = "appearing";
        s.waitTick = 0;
      }
      return;
    }
    if (s.state === "appearing") {
      s.alpha += .04;
      if (s.alpha >= s.maxAlpha) s.state = "moving";
    }
    if (s.state === "moving") {
      s.x += Math.cos(s.angle) * s.speed;
      s.y += Math.sin(s.angle) * s.speed;
      if (s.x > W || s.y > H) s.state = "fading";
    }
    if (s.state === "fading") {
      s.alpha -= .06;
      s.x += Math.cos(s.angle) * s.speed;
      s.y += Math.sin(s.angle) * s.speed;
      if (s.alpha <= 0) { s.state = "waiting"; s.wait = 120 + Math.random() * 400; s.waitTick = 0; }
    }
  }

  function drawShootingStar(s) {
    if (s.alpha <= 0) return;
    const tailX = s.x - Math.cos(s.angle) * s.len;
    const tailY = s.y - Math.sin(s.angle) * s.len;
    const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
    grad.addColorStop(0, `rgba(255,255,255,0)`);
    grad.addColorStop(0.7, `${s.color}${Math.floor(s.alpha * 160).toString(16).padStart(2,"0")}`);
    grad.addColorStop(1, `rgba(255,255,255,${s.alpha * 0.9})`);
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(s.x, s.y);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.5 * dpi;
    ctx.stroke();
    /* puntito brillante en la cabeza */
    ctx.beginPath();
    ctx.arc(s.x, s.y, 2 * dpi, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
    ctx.fill();
  }

  const tick = () => {
    ctx.clearRect(0, 0, W, H);

    /* Nebulosas de fondo (radiales estáticas, muy sutiles) */
    [
      { x: W*.15, y: H*.2,  r: W*.35, c: "rgba(0,229,255,.025)"  },
      { x: W*.85, y: H*.75, r: W*.3,  c: "rgba(123,47,255,.03)"  },
      { x: W*.5,  y: H*.5,  r: W*.4,  c: "rgba(255,45,155,.015)" },
    ].forEach(nb => {
      const g = ctx.createRadialGradient(nb.x, nb.y, 0, nb.x, nb.y, nb.r);
      g.addColorStop(0, nb.c); g.addColorStop(1, "transparent");
      ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
    });

    /* Estrellas fijas */
    stars.forEach(s => {
      s.y += s.speed * 0.12;
      s.x += Math.sin(s.y * .0005 + s.tw) * .3;
      s.tw += s.tws;
      if (s.y > H) { s.y = -5; s.x = Math.random() * W; }
      const alpha = s.a * (.6 + .4 * Math.sin(s.tw));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `${COLORS[s.ci]}${Math.floor(alpha * 255).toString(16).padStart(2,"0")}`;
      ctx.fill();
    });

    /* Estrellas fugaces */
    shootingStars.forEach(s => { updateShootingStar(s); drawShootingStar(s); });

    requestAnimationFrame(tick);
  };

  init();
  tick();
  window.addEventListener("resize", init);
}

/* =========================================================
   HUD — CARGAR DATOS DEL USUARIO (localStorage)
   ========================================================= */
function loadHUDData() {
  try {
    const profile  = JSON.parse(localStorage.getItem("mv_perfil") || "{}");
    const inventory= JSON.parse(localStorage.getItem("mv_inventory") || "{}");
    const badges   = JSON.parse(localStorage.getItem("mv_badges") || "[]");

    /* Nombre y avatar */
    const name   = (profile.nombre || "AVENTURERO").toUpperCase();
    const avatar = profile.avatar || "🌙";
    const xp     = profile.xp || 0;

    const LEVEL_THR = [0,100,250,450,700,1000,1400,1850,2400,3000,3700,4500,5500,6800,8400,10200];
    let lv = 1;
    LEVEL_THR.forEach((t, i) => { if (xp >= t) lv = i+1; });
    lv = Math.min(lv, LEVEL_THR.length);
    const nextXP   = LEVEL_THR[lv] || 10200;
    const prevXP   = LEVEL_THR[lv-1] || 0;
    const xpPct    = Math.min(100, Math.round(((xp - prevXP) / (nextXP - prevXP)) * 100));
    const hpPct    = Math.min(100, Math.round((profile.racha || 0) / 30 * 100)) || 88;

    /* Nav CTA */
    const hudAvatar = document.getElementById("hudAvatar");
    const hudXP     = document.getElementById("hudXP");
    if (hudAvatar) hudAvatar.textContent = avatar;
    if (hudXP)     hudXP.textContent     = `⚡ ${xp} XP`;

    /* HUD strip */
    const hpiName  = document.getElementById("hpiName");
    const hpiLevel = document.getElementById("hpiLevel");
    if (hpiName)  hpiName.textContent  = name;
    if (hpiLevel) hpiLevel.textContent = `Nv.${lv}`;

    /* Barras */
    const barXPFill = document.getElementById("barXPFill");
    const barHPFill = document.getElementById("barHPFill");
    const barXPVal  = document.getElementById("barXPVal");
    const barHPVal  = document.getElementById("barHPVal");
    if (barXPFill) setTimeout(() => { barXPFill.style.width = xpPct + "%"; }, 400);
    if (barHPFill) setTimeout(() => { barHPFill.style.width = hpPct + "%"; }, 400);
    if (barXPVal)  barXPVal.textContent = xpPct;
    if (barHPVal)  barHPVal.textContent = hpPct;

    /* Slots inventario */
    const sTickets  = document.getElementById("slotTickets");
    const sKeys     = document.getElementById("slotKeys");
    const sSuperKeys= document.getElementById("slotSuperKeys");
    if (sTickets)   sTickets.textContent   = inventory.tickets        || 0;
    if (sKeys)      sKeys.textContent      = inventory.keys           || 0;
    if (sSuperKeys) sSuperKeys.textContent = inventory.superstar_keys || 0;

  } catch(e) {
    console.warn("[HUD] Error cargando datos:", e);
  }
}

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
   LOADER
   ========================================================= */
function hideLoader() {
  const loader = document.getElementById("loader");
  if (!loader) return;
  let w = 0;
  const fill = document.getElementById("ld-fill");
  const iv = setInterval(() => {
    w += Math.random() * 20 + 5;
    if (fill) fill.style.width = Math.min(w, 100) + "%";
    if (w >= 100) {
      clearInterval(iv);
      setTimeout(() => {
        loader.style.transition = "opacity 0.4s";
        loader.style.opacity    = "0";
        setTimeout(() => loader.style.display = "none", 400);
      }, 250);
    }
  }, 60);
}

/* =========================================================
   NAVBAR HAMBURGER + BACK TO TOP
   ========================================================= */
function initNav() {
  const ham = document.getElementById("hamburger");
  const nav = document.getElementById("main-nav");
  ham?.addEventListener("click", () => nav.classList.toggle("open"));
  document.addEventListener("click", e => {
    if (!ham?.contains(e.target) && !nav?.contains(e.target))
      nav?.classList.remove("open");
  });
}

function initBackToTop() {
  const btn = document.getElementById("backTop");
  if (!btn) return;
  window.addEventListener("scroll", () => btn.classList.toggle("show", window.scrollY > 400));
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

/* =========================================================
   LOGOUT
   ========================================================= */
function initLogout() {
  document.getElementById("btnLogout")?.addEventListener("click", async (e) => {
    e.preventDefault();
    if (!confirm("¿Cerrar sesión?")) return;
    try {
      await signOut(auth);
    } catch {}
    window.location.href = "index.html";
  });
}

/* =========================================================
   INIT
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  hideLoader();
  initStars();
  initNav();
  initBackToTop();
  initLogout();

  /* Footer año */
  const fy = document.getElementById("footerYear");
  if (fy) fy.textContent = new Date().getFullYear();

  /* Verificar autenticación */
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      /* No autenticado → redirigir */
      window.location.href = "index.html";
      return;
    }

    /* Cargar HUD con datos del usuario */
    loadHUDData();

    /* Renderizar tarjetas */
    render();

    /* Badge de secciones activas */
    const active = CATEGORIES.flatMap(c => c.items)
      .filter(i => cardStatus(i) === "active").length;
    const badge = document.getElementById("heroBadgeCount");
    if (badge) badge.textContent = active;

    /* Actualizar presencia */
    tryUpdatePresence(user.uid, "online", "hub");

    /* Toast de bienvenida */
    const name = JSON.parse(localStorage.getItem("mv_perfil") || "{}").nombre || "AVENTURERO";
    setTimeout(() => toast(`🌌 BIENVENIDO, ${name.toUpperCase()}! · ${active} SECCIONES ACTIVAS`), 900);
  });

  /* Easter egg en el título */
  document.querySelector(".ht-main")?.addEventListener("click", () => {
    const msgs = [
      "🌌 ¡MOONVEIL PORTAL!",
      "✦ ¡QUE EMPIECE LA AVENTURA!",
      "💫 ¡EXPLORA EL COSMOS!",
      "🚀 ¡LEYENDA DEL ESPACIO!"
    ];
    toast(msgs[Math.floor(Math.random() * msgs.length)]);
  });
});