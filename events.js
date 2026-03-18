/* =========================================================
   Moonveil Portal — Events Hub JS  v4
   + Firebase auth (header usuario)
   + Estrellas fugaces + partículas espaciales
   + Tarjetas pixel art con contadores
   + HUD de stats (shop-style)
   + Búsqueda y filtro por categoría

   ¿Cómo agregar/editar tarjetas?
   ─────────────────────────────────
   title       (string)  — Nombre visible
   desc        (string)  — Descripción corta
   emoji       (string)  — Emoji principal
   url         (string)  — Ruta de la página
   bg          (string)  — URL imagen de fondo (opcional)
   expiry      (string)  — "YYYY-MM-DD" fecha de bloqueo (opcional)
   startDate   (string)  — "YYYY-MM-DD" cuenta regresiva (opcional)
   daysTotal   (number)  — días totales del evento (opcional)
   isCalendar  (boolean) — contador de días del mes (opcional)
   accent      (string)  — color CSS de acento (opcional)
   tags        (array)   — etiquetas de búsqueda (opcional)
   ========================================================= */

import { onAuthChange, logout } from './auth.js';

/* ── Lectura de localStorage ── */
const PERFIL_KEY = 'mv_perfil';

/* ══════════════════════════════════════════
   CATEGORÍAS Y TARJETAS  ← edita aquí
══════════════════════════════════════════ */
const CATEGORIES = [

  // ── PRINCIPAL ──────────────────────────────────────────
  {
    id: "principal", icon: "🏠", name: "Principal",
    color: "#00d4ff",
    items: [
      { title:"Inicio",   desc:"Página de bienvenida del portal.",              emoji:"🌙", url:"inicio.html",    bg:"img/picture6.jpg",   tags:["inicio","bienvenida"] },
      { title:"Perfiles Aldeanil", desc:"Explora y gestiona los perfiles de los aldeanos.", emoji:"👤", url:"perfiles.html", bg:"vill/teacher.jpg",  tags:["perfil","aldeano"] },
      { title:"Noticias Aldeanil", desc:"Noticias del mundo.",       emoji:"📰", url:"noticias.html", startDate:"2026-02-23", bg:"gif/villager-news.gif", tags:["noticias"]},
      { title:"Foro Aldeanil",     desc:"Algunas novedades de los aldeanos. Y quien sabe un chisme...", emoji:"💬", url:"foro.html", bg:"vill/booktea.gif", tags:["foro","chat"] },
      { title:"Contacto Aldeanil", desc:"Pues aqui se habla con los aldeanos del mundo.", emoji:"📩", url:"contactos.html", bg:"imagen/golem1.jpg", tags:["contacto"]},
      { title:"Updates",  desc:"Registro de todas las actualizaciones.",        emoji:"🔄", url:"updates.html",   startDate:"2026-03-01", bg:"img/picture1.jpg", tags:["updates","changelog"]},
      { title:"History",  desc:"Algunas historias, sin concluir…",              emoji:"📜", url:"historia.html",  startDate:"2026-05-01", bg:"imagen/diary.jpg", tags:["historia","lore"]},
      { title:"Cofres, y mas Cofres...", desc:"Aqui hay algunos cofres… ¿Que Sand Brill patrocino?", emoji:"⭐", url:"chest.html", startDate:"2026-01-01", bg:"img/picture4.jpg", tags:["cofre"]},
    ]
  },

  // ── COMUNIDAD & ECONOMÍA ───────────────────────────────
  {
    id: "economia", icon: "💎", name: "Comunidad & Economía",
    color: "#3b82f6",
    items: [
      { title:"Tradeos", desc:"Sistema de intercambios entre aldeanos, aunque ellos solo piden esmeraldas.", emoji:"🔀", url:"tradeos.html", startDate:"2026-04-10", bg:"img-pass/trading.jpg", tags:["tradeos","comercio"]},
      { title:"Tienda",  desc:"Compra lo que mas te convenga. ¡Y eso si hay cupones!", emoji:"🛒", url:"tienda.html", bg:"img/mine.gif", tags:["tienda","shop"]},
      { title:"Bank",    desc:"Gestiona tus monedas y depósitos.", emoji:"🏦", url:"banco.html", accent:"#34d399", bg:"img/picture3.jpg", tags:["banco","monedas"]},
      { title:"Ruleta",  desc:"¡Prueba tu suerte y gana premios!", emoji:"🎫", url:"premios.html", daysTotal:44, accent:"#fbbf24", startDate:"2026-02-26", bg:"gif/5am.gif", tags:["ruleta","suerte"]},
      { title:"Posts",   desc:"Bueno, supongo que aqui postean los aldeanos…", emoji:"💬", url:"ins.html", startDate:"2026-04-01", bg:"img/picture2.jpg", tags:["posts","social"]},
    ]
  },

  // ── HERRAMIENTAS & MINIJUEGOS ──────────────────────────
  {
    id: "herramientas", icon: "🛠️", name: "Herramientas & Minijuegos",
    color: "#818cf8",
    items: [
      { title:"Calendar", desc:"Calendario de inicio de sesion. Se renueva cada mes.", emoji:"📅", url:"calendar.html", isCalendar:true, accent:"#22d3ee", bg:"gif/rain1.gif", tags:["calendario","login"]},
      { title:"Sand", desc:"…", emoji:"⚡", url:"SBM-G.html", accent:"#fbbf24", startDate:"2026-02-22", expiry:"2026-04-15", daysTotal:60, bg:"img/picture4.jpg", tags:["sand","juego"]},
      { title:"Minepass", desc:"Lleguemos hasta las estrellas, tu sabes que no te abandonare…", emoji:"🎫", url:"pases.html", startDate:"2026-02-28", expiry:"2026-04-01", daysTotal:30, accent:"#00d4ff", bg:"img/universe1.gif", tags:["pase","temporada"]},
      { title:"Minigame", desc:"Un minijuego, asi que gestiona bien tu dinero y comercia bien…", emoji:"⭐⭐⭐", url:"min.html", startDate:"2026-02-20", expiry:"2026-04-01", daysTotal:39, accent:"#818cf8", bg:"gif/noche1.gif", tags:["minijuego"]},
      { title:"Harvest Corp", desc:"Maneja tu empresa de cultivos y haz que crezca con esfuerzo y sudor…", emoji:"🌟", url:"em.html", startDate:"2026-02-20", expiry:"2026-05-01", daysTotal:69, accent:"#f472b6", bg:"gif/2am.gif", tags:["empresa","cultivo"]},
      { title:"████ Master??", desc:"Supongo que el esta vez quizo o tratara de hacer una ¿broma?…", emoji:"🎭", url:"ddb.html", startDate:"2026-03-30", expiry:"2026-04-30", daysTotal:30, accent:"#f87171", bg:"imagen/steve3.jpg", tags:["misterio"]},
      { title:"Cultivos Eden", desc:"Hola amigos, aqui les habla Eden y pues quiero que me ayudes…", emoji:"🌻", url:"cul.html", startDate:"2026-02-20", expiry:"2026-04-30", daysTotal:30, accent:"#f472b6", bg:"gif/4am.gif", tags:["cultivo","eden"]},
      { title:"Investigaciones", desc:"¡Hola Agente ████! Tenemos que resolver estos casos…", emoji:"🔎", url:"invs.html", startDate:"2026-02-23", expiry:"2026-04-30", daysTotal:50, accent:"#f87171", bg:"gif/creaking-minecraft.gif", tags:["investigacion","caso"]},
      { title:"Minelife", desc:"¡Hola ████! Bueno, ¡eh!… No tengo palabras…", emoji:"🌳", url:"minecraft.html", startDate:"2026-02-20", expiry:"2026-04-30", daysTotal:50, accent:"#f87171", bg:"img-pass/fox-xy.jpg", tags:["vida","survival"]},
      { title:"Minestone", desc:"¡Hola ████! Puedes sobrevivir, con 10 corazones, ¿seguro?", emoji:"🌳", url:"aventure.html", startDate:"2026-02-20", expiry:"2026-04-20", daysTotal:50, accent:"#fbbf24", bg:"img-pass/pokki.jpg", tags:["aventura","survival"]},
    ]
  },

  // ── EVENTOS ESPECIALES ────────────────────────────────
  {
    id: "eventos", icon: "🎉", name: "Eventos Especiales",
    color: "#f472b6",
    items: [
      { title:"Eventos", desc:"Centro de todos los eventos activos del mundo.", emoji:"🎫", url:"eventos.html", accent:"#f87171", bg:"img-pass/animalsphoto.jpg", tags:["evento","centro"]},
      { title:"Valentine", desc:"Evento especial de San Valentín. ¿Con un caso por resolver…?", emoji:"💖", url:"sv.html", expiry:"2026-02-20", daysTotal:1, accent:"#f472b6", bg:"ach/5i.png", tags:["valentine","amor"]},
      { title:"Dragon Hunter", desc:"Caza 20 Ender Dragons y alcanza la gloria.", emoji:"🐉", url:"dragon.html", expiry:"2026-04-20", daysTotal:20, accent:"#a78bfa", bg:"ach/4y.png", tags:["dragon","hunter"]},
      { title:"Año Lunar", desc:"Celebra el Año Nuevo Lunar con recompensas.", emoji:"🏮", url:"lny.html", expiry:"2026-03-06", daysTotal:18, accent:"#fbbf24", bg:"img-pass/añomine.jpg", tags:["lunar","año nuevo"]},
      { title:"Event Emerald", desc:"La lluvia de Esmeraldas.", emoji:"🟢", url:"emerald.html", startDate:"2026-02-22", expiry:"2026-03-30", daysTotal:6, accent:"#34d399", bg:"ach/5y.png", tags:["esmeralda","evento"]},
      { title:"Anniversary!!", desc:"Un año mas en este mundo cubico Moonveil…", emoji:"🎂", url:"ann.html", startDate:"2026-04-10", expiry:"2026-12-30", daysTotal:120, accent:"#fbbf24", bg:"img-pass/partymine.jpg", tags:["aniversario"]},
      { title:"Próximo Evento", desc:"Un nuevo evento se aproxima. ¡Prepárate!", emoji:"🔮", url:"#", startDate:"2030-04-01", accent:"#818cf8", tags:["proximo","evento"]},
      { title:"Minesafio", desc:"Seguro es muy facil, espero…", emoji:"⚡", url:"batt.html", startDate:"2026-03-04", expiry:"2026-03-10", daysTotal:6, accent:"#fbbf24", bg:"ach/2m.png", tags:["desafio","batalla"]},
    ]
  },

  // ── CELEBRACIONES ─────────────────────────────────────
  {
    id: "celebrar", icon: "⭐", name: "Celebraciones",
    color: "#fbbf24",
    items: [
      { title:"¡Que recuerdos…!", desc:"Pero no dejemos de seguir creando recuerdos", emoji:"🌳", url:"album.html", startDate:"2026-02-20", expiry:"2026-06-01", daysTotal:50, accent:"#fbbf24", bg:"img/universe1.gif", tags:["recuerdos","album"]},
      { title:"♡♡♡♡♡♡♡♡♡♡♡♡♡♡♡", desc:"Si que es un gran dia… ¡Asi que celebremos!", emoji:"🌟", url:"tsm.html", startDate:"2026-04-20", expiry:"2026-04-21", daysTotal:2, accent:"#f472b6", bg:"dav/alex1.jpg", tags:["celebracion"]},
      { title:"♡♡♡♡♡♡♡♡♡♡♡♡♡♡♡", desc:"Si que es un gran dia… ¡Asi que celebremos!", emoji:"🌟", url:"lns.html", startDate:"2026-06-17", expiry:"2026-06-18", daysTotal:2, accent:"#f472b6", bg:"dav/steve2.jpg", tags:["celebracion"]},
    ]
  }
];

/* ══════════════════════════════════════════
   UTILIDADES DE FECHA
══════════════════════════════════════════ */
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

/* ══════════════════════════════════════════
   CUENTA REGRESIVA
══════════════════════════════════════════ */
function buildCountdown(getValuesFn, colorClass) {
  const wrap = document.createElement("div");
  wrap.className = "card-countdown" + (colorClass ? ` card-${colorClass}-cd` : "");

  const PARTS  = ["d","h","m","s"];
  const LABELS = { d:"días", h:"hrs", m:"min", s:"seg" };
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
      wrap.innerHTML = '<span class="card-chip chip-ok">¡COMENZÓ!</span>';
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

/* ══════════════════════════════════════════
   CONSTRUIR TARJETA  (shop-style)
══════════════════════════════════════════ */
function buildCard(item, index, categoryColor) {
  const status = cardStatus(item);
  const accent = item.accent || categoryColor || "#00d4ff";

  // Color más oscuro para la banda
  const accentD = accent + "88"; // semi-transparente como versión dark

  const tag  = (status === "active" && item.url && item.url !== "#") ? "a" : "div";
  const card = document.createElement(tag);
  card.className = "hub-card reveal";
  card.style.animationDelay = `${index * 0.07}s`;
  if (tag === "a") card.href = item.url;

  if (status === "expired") card.classList.add("card-locked");
  if (status === "soon")    card.classList.add("card-soon");

  card.style.setProperty("--card-accent", accent);
  card.style.setProperty("--card-accent-d", accentD);

  // ── Banda superior (shop style) ──
  const band = document.createElement("div");
  band.className = "card-band";
  band.style.background = `linear-gradient(90deg, ${accentD}, ${accent}, ${accentD})`;
  card.appendChild(band);

  // ── Badge de estado ──
  const stateBadge = document.createElement("div");
  stateBadge.className = "card-status-badge";
  if (status === "expired") {
    stateBadge.className += " csb-expired";
    stateBadge.textContent = "⌛ CERRADO";
  } else if (status === "soon") {
    stateBadge.className += " csb-soon";
    stateBadge.textContent = "⏳ PRÓXIMO";
  } else {
    stateBadge.className += " csb-active";
    stateBadge.textContent = "✦ ACTIVO";
  }
  card.appendChild(stateBadge);

  // ── Fondo de imagen ──
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

  // ── Overlay de bloqueo/próximo ──
  if (status === "expired" || status === "soon") {
    const ol = document.createElement("div");
    ol.className = "card-img-overlay";
    const otxt = document.createElement("div");
    otxt.className = "card-overlay-txt";
    otxt.textContent = status === "expired" ? "⌛ EVENTO TERMINADO" : "⏳ PRÓXIMAMENTE";
    ol.appendChild(otxt);
    card.appendChild(ol);
  }

  // ── Cuerpo ──
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

  const divider = document.createElement("div");
  divider.className = "card-divider";
  divider.style.background = accent;
  body.appendChild(divider);

  const de = document.createElement("div");
  de.className = "card-desc";
  de.textContent = item.desc || "";
  body.appendChild(de);

  // Tags
  if (item.tags && item.tags.length) {
    const tagWrap = document.createElement("div");
    tagWrap.className = "card-tags";
    item.tags.slice(0,3).forEach(t => {
      const tg = document.createElement("span");
      tg.className = "card-tag";
      tg.textContent = "#" + t;
      tagWrap.appendChild(tg);
    });
    body.appendChild(tagWrap);
  }

  // Estado / countdowns
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
    chip.textContent = "📅 RENOV. MENSUAL";
    body.appendChild(chip);
    body.appendChild(buildCountdown(makeMonthFn(), "month"));

  } else if (item.expiry) {
    const remaining = daysUntil(parseDate(item.expiry));
    const chip = document.createElement("span");
    chip.className = "card-chip chip-ok";
    chip.textContent = remaining > 0
      ? `✅ ACTIVO · TERMINA EN ${remaining}D`
      : "✅ ACTIVO · ¡ÚLTIMO DÍA!";
    body.appendChild(chip);
    body.appendChild(buildCountdown(makeExpiryFn(item.expiry), "expiry"));
  }

  card.appendChild(body);

  // ── Footer (state-row + botones estilo shop) ──
  const footer = document.createElement("div");
  footer.className = "card-footer";

  // state-row (como pc-stock-row)
  if (status === "active") {
    const stateRow = document.createElement("div");
    stateRow.className = "card-state-row";
    const lbl = document.createElement("span");
    lbl.className = "card-state-label";
    lbl.textContent = item.expiry ? "⏰ TERMINA:" : item.isCalendar ? "📅 RENUEVA:" : "🌌 ESTADO:";
    const val = document.createElement("span");
    val.className = "card-state-val";

    if (item.isCalendar) {
      const { d } = daysLeftInMonth();
      val.className += " val-cal";
      val.textContent = `${d}d`;
    } else if (item.expiry) {
      const rem = daysUntil(parseDate(item.expiry));
      val.textContent = rem > 0 ? `${rem}d` : "HOY";
    } else {
      val.textContent = "ACTIVO";
    }

    stateRow.append(lbl, val);
    footer.appendChild(stateRow);
  } else if (status === "soon") {
    const stateRow = document.createElement("div");
    stateRow.className = "card-state-row";
    const lbl = document.createElement("span");
    lbl.className = "card-state-label";
    lbl.textContent = "📅 INICIA:";
    const val = document.createElement("span");
    val.className = "card-state-val val-soon";
    val.textContent = item.startDate || "—";
    stateRow.append(lbl, val);
    footer.appendChild(stateRow);
  } else if (status === "expired") {
    const stateRow = document.createElement("div");
    stateRow.className = "card-state-row";
    const lbl = document.createElement("span");
    lbl.className = "card-state-label";
    lbl.textContent = "⌛ TERMINÓ:";
    const val = document.createElement("span");
    val.className = "card-state-val val-exp";
    val.textContent = item.expiry || "—";
    stateRow.append(lbl, val);
    footer.appendChild(stateRow);
  }

  // Botones acción
  const actions = document.createElement("div");
  actions.className = "card-actions";

  // Botón detalle (siempre)
  const btnDetail = document.createElement("button");
  btnDetail.className = "card-btn";
  btnDetail.dataset.id = item.title;
  btnDetail.textContent = "INFO";
  btnDetail.addEventListener("click", (e) => {
    e.preventDefault();
    showInfoToast(item, status);
  });
  actions.appendChild(btnDetail);

  // Botón ir
  const btnGo = document.createElement("button");
  btnGo.className = "card-btn-go";
  if (status === "expired") {
    btnGo.textContent = "🔒 CERRADO";
    btnGo.disabled = true;
    btnGo.addEventListener("click", e => { e.preventDefault(); toast("🔒 Este evento ya terminó.", "error"); });
  } else if (status === "soon") {
    btnGo.textContent = "⏳ PRONTO";
    btnGo.disabled = true;
    btnGo.addEventListener("click", e => { e.preventDefault(); toast("⏳ ¡Pronto disponible, espéralo!", "info"); });
  } else if (item.url === "#") {
    btnGo.textContent = "🔮 MISTERIO";
    btnGo.disabled = true;
  } else {
    btnGo.textContent = "▶ IR AHORA";
    btnGo.addEventListener("click", (e) => {
      if (tag !== "a") {
        e.preventDefault();
        window.location.href = item.url;
      }
    });
  }
  actions.appendChild(btnGo);
  footer.appendChild(actions);
  card.appendChild(footer);

  // ── Barra de progreso ──
  if (status === "active" && item.expiry && item.daysTotal) {
    const end   = parseDate(item.expiry);
    const start = new Date(end);
    start.setDate(start.getDate() - item.daysTotal);
    const elapsed   = daysSince(start);
    const remaining = Math.max(0, 100 - Math.min(100, Math.round((elapsed / item.daysTotal)*100)));

    const barWrap = document.createElement("div"); barWrap.className = "card-days-bar";
    const fill    = document.createElement("div"); fill.className = "card-days-fill";
    fill.style.cssText = `width:0%;background:linear-gradient(90deg,${accent}99,${accent})`;
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

  return card;
}

/* ══════════════════════════════════════════
   INFO TOAST (al presionar INFO)
══════════════════════════════════════════ */
function showInfoToast(item, status) {
  const msgs = {
    active: `🌌 ${item.title} — Activo${item.expiry ? ` · Termina: ${item.expiry}` : ""}`,
    soon:   `⏳ ${item.title} — Disponible desde ${item.startDate}`,
    expired:`🔒 ${item.title} — Terminó el ${item.expiry}`,
  };
  toast(msgs[status] || `📄 ${item.title}`, status === "expired" ? "error" : status === "soon" ? "info" : "success");
}

/* ══════════════════════════════════════════
   ESTADO GENERAL + HUD STATS
══════════════════════════════════════════ */
function computeStats() {
  const all = CATEGORIES.flatMap(c => c.items);
  const active  = all.filter(i => cardStatus(i) === "active").length;
  const soon    = all.filter(i => cardStatus(i) === "soon").length;
  const expired = all.filter(i => cardStatus(i) === "expired").length;
  return { active, soon, expired };
}

function renderStats() {
  const { active, soon, expired } = computeStats();
  const setV = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  setV("heroBadgeCount", active);
  setV("heroSoonCount",  soon);
  setV("heroExpCount",   expired);
}

/* ══════════════════════════════════════════
   ESTADO DE FILTROS
══════════════════════════════════════════ */
let currentCat  = "all";
let searchText  = "";

/* ══════════════════════════════════════════
   RENDER HUB
══════════════════════════════════════════ */
function render() {
  const hub = document.getElementById("hubBody");
  if (!hub) return;
  hub.innerHTML = "";

  const q = searchText.trim().toLowerCase();

  CATEGORIES.forEach((cat, ci) => {
    // Filtrar ítems
    const items = cat.items.filter(item => {
      // Filtro de categoría
      if (currentCat !== "all" && cat.id !== currentCat) return false;
      // Filtro de búsqueda
      if (q) {
        const txt = `${item.title} ${item.desc} ${(item.tags||[]).join(" ")}`.toLowerCase();
        if (!txt.includes(q)) return false;
      }
      return true;
    });

    // Si no hay ítems tras filtrar, skip
    if (currentCat !== "all" && cat.id !== currentCat) return;
    if (q && items.length === 0) return;

    const section = document.createElement("section");
    section.className = "category reveal";
    section.style.animationDelay = `${ci * 0.1}s`;
    section.dataset.catId = cat.id;

    const header = document.createElement("div");
    header.className = "category-header";
    header.innerHTML = `
      <span class="category-icon">${cat.icon}</span>
      <span class="category-name">${cat.name}</span>
      <span class="category-count">${items.length} sección${items.length!==1?"es":""}</span>
    `;
    section.appendChild(header);

    const grid = document.createElement("div");
    grid.className = "cards-grid";

    if (items.length === 0) {
      grid.innerHTML = '<div class="cards-empty">Sin resultados en esta categoría.</div>';
    } else {
      items.forEach((item, ii) => grid.appendChild(buildCard(item, ii, cat.color)));
    }

    section.appendChild(grid);
    hub.appendChild(section);
  });

  // Si búsqueda no dio nada
  if (!hub.children.length) {
    hub.innerHTML = '<div class="cards-empty" style="padding:60px;font-size:0.4rem">🔍 Sin resultados para "' + q + '"</div>';
  }

  // Trigger reveal
  initReveal();
}

/* ══════════════════════════════════════════
   BARRA DE CATEGORÍAS
══════════════════════════════════════════ */
function buildCatBar() {
  const bar = document.getElementById("hubCatBar");
  if (!bar) return;
  bar.innerHTML = "";

  const allBtn = document.createElement("button");
  allBtn.className = "hub-cat-btn active";
  allBtn.dataset.cat = "all";
  allBtn.textContent = "TODO";
  bar.appendChild(allBtn);

  CATEGORIES.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "hub-cat-btn";
    btn.dataset.cat = cat.id;
    btn.textContent = `${cat.icon} ${cat.name}`;
    bar.appendChild(btn);
  });

  bar.querySelectorAll(".hub-cat-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      bar.querySelectorAll(".hub-cat-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentCat = btn.dataset.cat;
      render();
    });
  });
}

/* ══════════════════════════════════════════
   HEADER: cargar datos del usuario
══════════════════════════════════════════ */
function loadUserHeader() {
  try {
    const raw = localStorage.getItem(PERFIL_KEY);
    if (!raw) return;
    const p = JSON.parse(raw);

    const avatarEl   = document.getElementById("nav-avatar");
    const usernameEl = document.getElementById("nav-username");
    const xpEl       = document.getElementById("xp-display");

    if (avatarEl)   avatarEl.textContent   = p.avatar  || "🌙";
    if (usernameEl) usernameEl.textContent = (p.nombre || "EXPLORADOR").toUpperCase();
    if (xpEl)       xpEl.textContent       = `⚡ ${p.xp || 0} XP`;
  } catch { /* sin datos locales */ }
}

/* ══════════════════════════════════════════
   PARTÍCULAS ESPACIALES + ESTRELLAS FUGACES
══════════════════════════════════════════ */
function initSpaceCanvas() {
  const c = document.getElementById("stars-canvas");
  if (!c) return;
  const ctx = c.getContext("2d");
  const dpi = Math.max(1, devicePixelRatio || 1);

  let W, H, stars, shootingStars;

  const COLORS = [
    "rgba(0,212,255,",
    "rgba(59,130,246,",
    "rgba(129,140,248,",
    "rgba(167,139,250,",
    "rgba(34,211,238,",
    "rgba(200,224,255,",
  ];

  function init() {
    W = c.width  = innerWidth  * dpi;
    H = c.height = innerHeight * dpi;

    stars = Array.from({ length: 200 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: (0.3 + Math.random() * 1.8) * dpi,
      a: 0.1 + Math.random() * 0.6,
      twinkleSpeed: 0.02 + Math.random() * 0.04,
      twinklePhase: Math.random() * Math.PI * 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      floating: Math.random() > 0.7,
      vy: Math.random() > 0.7 ? (0.05 + Math.random() * 0.2) : 0,
    }));

    shootingStars = [];
  }

  function spawnShootingStar() {
    const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.3;
    const speed = (6 + Math.random() * 8) * dpi;
    const length= (80 + Math.random() * 160) * dpi;
    const colorIdx = Math.random() > 0.7 ? 1 : 0;
    shootingStars.push({
      x: Math.random() * W * 0.8,
      y: Math.random() * H * 0.4,
      vx:  Math.cos(angle) * speed,
      vy:  Math.sin(angle) * speed,
      length,
      life: 1.0,
      decay: 0.012 + Math.random() * 0.018,
      color: COLORS[colorIdx],
      width: (0.8 + Math.random() * 1.4) * dpi,
    });
  }

  let shootTimer = 0;
  let shootInterval = 110 + Math.random() * 200;

  function tick() {
    ctx.clearRect(0, 0, W, H);

    stars.forEach(s => {
      s.twinklePhase += s.twinkleSpeed;
      const alpha = s.a * (0.5 + 0.5 * Math.sin(s.twinklePhase));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = s.color + alpha + ")";
      ctx.fill();

      if (s.floating) {
        s.y -= s.vy;
        if (s.y < -10) s.y = H + 10;
      }
    });

    shootTimer++;
    if (shootTimer >= shootInterval) {
      shootTimer = 0;
      shootInterval = 110 + Math.random() * 200;
      if (shootingStars.length < 3) spawnShootingStar();
    }

    shootingStars = shootingStars.filter(m => m.life > 0);

    shootingStars.forEach(m => {
      const tailX = m.x - (m.vx / Math.hypot(m.vx, m.vy)) * m.length;
      const tailY = m.y - (m.vy / Math.hypot(m.vx, m.vy)) * m.length;

      const grad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
      grad.addColorStop(0, m.color + "0)");
      grad.addColorStop(0.6, m.color + (m.life * 0.4) + ")");
      grad.addColorStop(1,   m.color + m.life + ")");

      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(m.x, m.y);
      ctx.strokeStyle = grad;
      ctx.lineWidth = m.width * m.life;
      ctx.lineCap = "round";
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(m.x, m.y, m.width * 1.5 * m.life, 0, Math.PI * 2);
      ctx.fillStyle = m.color + m.life + ")";
      ctx.fill();

      m.x += m.vx;
      m.y += m.vy;
      m.life -= m.decay;
    });

    requestAnimationFrame(tick);
  }

  init();
  tick();
  addEventListener("resize", init);
}

/* ══════════════════════════════════════════
   REVEAL ANIMATION
══════════════════════════════════════════ */
function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll(".reveal:not(.visible)").forEach(el => obs.observe(el));
}

/* ══════════════════════════════════════════
   LOADER
══════════════════════════════════════════ */
function hideLoader() {
  const loader = document.getElementById("loader");
  if (!loader) return;
  let w = 0;
  const fill = document.getElementById("ld-fill");
  const iv = setInterval(() => {
    w += Math.random() * 18 + 6;
    if (fill) fill.style.width = Math.min(w, 100) + "%";
    if (w >= 100) {
      clearInterval(iv);
      setTimeout(() => {
        loader.style.transition = "opacity 0.4s";
        loader.style.opacity = "0";
        setTimeout(() => loader.style.display = "none", 400);
      }, 300);
    }
  }, 70);
}

/* ══════════════════════════════════════════
   NAVBAR MOBILE
══════════════════════════════════════════ */
function initNav() {
  const ham = document.getElementById("hamburger");
  const nav = document.getElementById("main-nav");
  if (ham && nav) {
    ham.addEventListener("click", () => nav.classList.toggle("open"));
    document.addEventListener("click", e => {
      if (!ham.contains(e.target) && !nav.contains(e.target))
        nav.classList.remove("open");
    });
  }
}

/* ══════════════════════════════════════════
   LOGOUT
══════════════════════════════════════════ */
function initLogout() {
  document.getElementById("btn-logout")?.addEventListener("click", async () => {
    if (!confirm("¿Cerrar sesión?")) return;
    try { await logout(); } catch {}
    window.location.href = "index.html";
  });
}

/* ══════════════════════════════════════════
   BACK TO TOP
══════════════════════════════════════════ */
function initBackToTop() {
  const btn = document.getElementById("back-top");
  if (!btn) return;
  window.addEventListener("scroll", () =>
    btn.classList.toggle("show", window.scrollY > 400)
  );
  btn.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" })
  );
}

/* ══════════════════════════════════════════
   BÚSQUEDA
══════════════════════════════════════════ */
function initSearch() {
  const input = document.getElementById("hubSearch");
  const clear = document.getElementById("hubSearchClear");

  input?.addEventListener("input", e => {
    searchText = e.target.value || "";
    render();
  });
  clear?.addEventListener("click", () => {
    if (input) input.value = "";
    searchText = "";
    render();
  });
}

/* ══════════════════════════════════════════
   TOAST
══════════════════════════════════════════ */
function toast(msg, type = "success") {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.className = `toast show ${type}`;
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 3000);
}

/* ══════════════════════════════════════════
   INIT
══════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  hideLoader();
  initSpaceCanvas();
  initNav();
  initLogout();
  initBackToTop();
  initSearch();
  buildCatBar();

  onAuthChange(user => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }
    loadUserHeader();
    renderStats();
    render();

    const fy = document.getElementById("footerYear");
    if (fy) fy.textContent = new Date().getFullYear();

    setTimeout(() => {
      const { active } = computeStats();
      toast(`🌌 ${active} secciones activas esperándote`, "success");
    }, 900);
  });
});