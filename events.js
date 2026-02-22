/* =========================================================
   Moonveil Portal — Events Hub (JS v3)

   ¿Cómo agregar/editar tarjetas?
   ————————————————————————————————
   Cada tarjeta acepta estos campos:

     title       (string)  — Nombre visible
     desc        (string)  — Descripción corta
     emoji       (string)  — Emoji principal
     url         (string)  — Ruta de la página
     bg          (string)  — (opcional) URL de imagen de fondo
                             Ej: bg: "img/dragon-bg.jpg"
                             Ej: bg: "https://i.imgur.com/abc.jpg"
     expiry      (string)  — (opcional) "YYYY-MM-DD" — fecha en que se bloquea
     startDate   (string)  — (opcional) "YYYY-MM-DD" — antes de esta fecha = cuenta regresiva
     daysTotal   (number)  — (opcional) días totales del evento (para la barra)
     isCalendar  (boolean) — (opcional) true = contador especial de días del mes
     accent      (string)  — (opcional) color CSS del acento de la tarjeta
                             Ej: accent: "#f43f5e"  accent: "#06b6d4"
                             Si no se pone, usa el color de la categoría

   ¿Cómo agregar una categoría?
   ————————————————————————————————
   Al final del array CATEGORIES agrega:
   {
     id:    "mi-id",
     icon:  "⭐",
     name:  "Mi Categoría",
     color: "#6366f1",    ← color de acento de todas sus tarjetas
     items: [ ...tarjetas... ]
   }
   ========================================================= */

/* =========================================================
   CATEGORÍAS Y TARJETAS  ← edita aquí
   ========================================================= */
const CATEGORIES = [

  // ── PRINCIPAL ──────────────────────────────────────────
  {
    id: "principal", icon: "🏠", name: "Principal",
    color: "#a855f7",          // ← púrpura por defecto
    items: [
      { title:"Inicio",   desc:"Página de bienvenida del portal.",              emoji:"🌙", url:"inicio.html"   },
      { title:"Perfiles", desc:"Explora y gestiona los perfiles de los aldeanos.", emoji:"👤", url:"perfiles.html", bg:"vill/teacher.jpg" },
      { title:"Noticias", desc:"Noticias del mundo.",       emoji:"📰", url:"noticias.html" ,startDate: "2026-02-23",bg: "gif/villager-news.gif"},
      { title:"Foro",     desc:"Algunas novedades de los aldeanos. Y quien sabe un chisme...", emoji:"💬", url:"foro.html", bg:"vill/booktea.gif"     },
      { title:"Contacto", desc:"Pues aqui se habla con los aldeanos del mundo. No todos pero si algunos...", emoji:"📩", url:"contactos.html", bg:"imagen/golem1.jpg",},
      { title:"Updates",  desc:"Registro de todas las actualizaciones.",        emoji:"🔄", url:"updates.html" , startDate: "2026-03-01", },
      { title:"History",  desc:"Algunas historias, sin concluir...",  emoji:"📜", url:"historia.html", startDate: "2026-05-01", bg:"imagen/diary.jpg"},
    ]
  },

  // ── COMUNIDAD & ECONOMÍA ───────────────────────────────
  {
    id: "economia", icon: "💎", name: "Comunidad & Economía",
    color: "#06b6d4",          // ← cyan
    items: [
      { title:"Tradeos", desc:"Sistema de intercambios entre aldeanos, aunque ellos solo piden esmeraldas.¡Que se puede hacer si solo piden eso!",   emoji:"🔀", url:"tradeos.html" ,
        startDate: "2026-03-10",
        bg:"img-pass/trading.jpg",
      },
      { title:"Tienda",  desc:"Compra lo que mas te convenga.¡Y eso si hay cupones!Obvio si tienes...", emoji:"🛒", url:"tienda.html", bg:"img/mine.gif"  },
      { title:"Bank",    desc:"Gestiona tus monedas y depósitos.¡Que no se te pase su tiempo!",           emoji:"🏦", url:"banco.html",
        accent: "#10b981"  // verde especial para Bank
      },
      {
        title:"Ruleta",  desc:"¡Prueba tu suerte y gana premios! Y si quieres mas tickets, compralos en la tienda...",
        emoji:"🎫", url:"premios.html",
        daysTotal: 44,
        accent: "#f59e0b",   // ámbar para la ruleta
        startDate: "2026-02-26",
        bg: "gif/5am.gif"
        // expiry: "2026-03-15"
      },
      { title:"Posts", desc:"Bueno, supongo que aqui postean los aldeanos...",   emoji:"💬", url:"ins.html" ,
        startDate: "2026-04-01",
        bg:"",
      },
    ]
  },

  // ── HERRAMIENTAS ──────────────────────────────────────
  {
    id: "herramientas", icon: "🛠️", name: "Herramientas & Minijuegos",
    color: "#06b6d4",
    items: [
      {
        title: "Calendar",
        desc:  "Calendario de inicio de sesion. Se renueva cada mes.",
        emoji: "📅", url: "calendar.html",
        isCalendar: true,
        accent: "#06b6d4",
        bg: "gif/rain1.gif" 
      },
      { title:"Sand", desc:"...", emoji:"⚡", url:"SBM-G.html",
        accent: "#f59e0b",
        startDate: "2026-02-22",
        expiry: "2026-04-15",  daysTotal: 60,
      },
      {
        title: "Minepass",
        desc:  "Lleguemos hasta las estrellas, tu sabes que no te abandonare, porque eres mi gran amigo. Nunca lo olvides y siempre estara tu amiguito David Kal...",
        emoji: "🎫", url: "pase.html",
        startDate: "2026-03-01",
        expiry: "2026-04-01",   daysTotal: 30,
        accent: "#06b6d4",
        bg: "img/universe1.gif"    // ← ej: "img/dragon-bg.jpg"
      },
      {
        title: "Minigame",
        desc:  "Un minijuego, asi que gestiona bien tu dinero y comercia bien... y ten cuidado con los ¡bandidos!... Asi que suerte",
        emoji: "⭐⭐⭐", url: "min.html",
        startDate: "2026-02-20",
        expiry: "2026-04-01", daysTotal: 39,
        accent: "#06b6d4",
        bg: "gif/noche1.gif"    // ← ej: "img/dragon-bg.jpg"
      },
      {
        title: "Harvest Corp",
        desc:  "Maneja tu empresa de cultivos y haz que crezca con esfuerzo y sudor... Pues capaz no tanto pero haz que tu empresa este en lo alto y con marketing capaz llegue aun mas lejos...¡Yo confio en usted jefe!",
        emoji: "🌟", url: "em.html",
        startDate: "2026-02-20",
        expiry: "2026-05-01", daysTotal: 69,
        accent: "#f43f5e",
        bg: "gif/2am.gif"    // ← ej: "img/dragon-bg.jpg"
      },
      {
        title: "████ Master??",
        desc:  "Supongo que el esta vez quizo o tratara de hacer una ¿broma?, bueno eso creemos, pero quien sabe...Que tramara esta vez...",
        emoji: "🎭", url: "ddb.html",
        startDate: "2026-03-30",
        expiry: "2026-04-30", daysTotal: 30,
        accent: "#f43f5e",
        bg: "imagen/steve3.jpg"    // ← ej: "img/dragon-bg.jpg"
      },
      {
        title: "Cultivos Eden",
        desc:  "Hola amigos, aqui les habla Eden y pues quiero que me ayudes a generar mucho dinerito, pues ya que tu eres un estratega en los negocios pues se que tu podras.¿Verdad?",
        emoji: "🌻", url: "cul.html",
        startDate: "2026-02-20",
        expiry: "2026-04-30", daysTotal: 30,
        accent: "#f43f5e",
        bg: "gif/4am.gif"    // ← ej: "img/dragon-bg.jpg"
      },
      {
        title: "Investigaciones",
        desc:  "¡Hola Agente ████! Tenemos que resolver estos casos, por eso necesitamos su ayuda, contamos contigo Agente...",
        emoji: "🔎", url: "invs.html",
        startDate: "2026-02-23",
        expiry: "2026-04-30", daysTotal: 50,
        accent: "#f43f5e",
        bg: "gif/creaking-minecraft.gif"    // ← ej: "img/dragon-bg.jpg"
      },
      {
        title: "Minelife",
        desc:  "¡Hola ████! Bueno,¡eh!... No tengo palabras...",
        emoji: "🌳", url: "minecraft.html",
        startDate: "2026-02-20",
        expiry: "2026-04-30", daysTotal: 50,
        accent: "#f43f5e",
        bg: "img-pass/fox-xy.jpg"    // ← ej: "img/dragon-bg.jpg"
      },
    ]
  },

  // ── EVENTOS ESPECIALES ────────────────────────────────
  {
    id: "eventos", icon: "🎉", name: "Eventos Especiales",
    color: "#ec4899",          // ← rosa
    items: [
      {
        title: "Eventos",
        desc:  "Centro de todos los eventos activos del mundo.",
        emoji: "🎫", url: "eventos.html",
        //expiry: "2026-04-15", daysTotal: 44,
        accent: "#f43f5e", 
        bg:"img-pass/animalsphoto.jpg"
      },
      {
        title: "Valentine",
        desc:  "Evento especial de San Valentín.¿Con un caso por resolver...?",
        emoji: "💖", url: "sv.html",
        expiry: "2026-02-20",   // ya caducó
        daysTotal: 1,
        accent: "#ec4899",
        bg:"ach/5i.png"    // ← pon aquí la URL de imagen: "img/valentine-bg.jpg"
      },
      {
        title: "Dragon Hunter",
        desc:  "Caza 20 Ender Dragons y alcanza la gloria.",
        emoji: "🐉", url: "dragon.html",
        expiry: "2026-04-20", daysTotal: 20,
        accent: "#a855f7",
        bg: "ach/4y.png"    // ← ej: "img/dragon-bg.jpg"
      },
      {
        title: "Año Lunar",
        desc:  "Celebra el Año Nuevo Lunar con recompensas.",
        emoji: "🏮", url: "lny.html",
        expiry: "2026-03-01", daysTotal: 18,
        accent: "#f59e0b",
        bg: "img-pass/añomine.jpg"    // ← ej: "img/lny-bg.jpg"
      },
      {
        title: "Event Emerald",
        desc:  "La lluvia de Esmeraldas.",
        emoji: "🟢", url: "emerald.html",
        startDate: "2026-02-22",
        expiry: "2026-02-28", daysTotal: 18,
        accent: "#f59e0b",
        bg: "ach/5y.png"    // ← ej: "img/lny-bg.jpg"
      },
      {
        title: "Anniversary!!",
        desc:  "Un año mas en este mundo cubico Moonveil...",
        emoji: "🎂", url: "ann.html",
        startDate: "2026-04-10",
        expiry: "2026-12-30",  daysTotal: 120,
        accent: "#f59e0b",
        bg: "img-pass/partymine.jpg"    // ← ej: "img/lny-bg.jpg"
      },
      {
        title: "Próximo Evento",
        desc:  "Un nuevo evento se aproxima. ¡Prepárate!",
        emoji: "🔮", url: "#",
        startDate: "2026-04-01",
        accent: "#818cf8"
      }
    ]
  }

  // ── PLANTILLA NUEVA CATEGORÍA ─────────────────────────
  // {
  //   id: "nueva", icon: "⭐", name: "Nueva Categoría",
  //   color: "#6366f1",
  //   items: [
  //     {
  //       title: "Mi Página", desc: "Descripción.", emoji: "🌟", url: "mi-pagina.html",
  //       bg: "img/mi-fondo.jpg",     ← imagen de fondo (opcional)
  //       accent: "#f43f5e",          ← color de acento (opcional)
  //       expiry: "2026-12-31",       ← caducidad (opcional)
  //       startDate: "2026-06-01",    ← apertura futura (opcional)
  //       daysTotal: 30,              ← días del evento (opcional)
  //       isCalendar: false,          ← contador de mes (opcional)
  //     }
  //   ]
  // }
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
   CUENTA REGRESIVA (reutilizable)
   colorClass: "" | "expiry" | "month"
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

  // Borde de acento sutil
  card.style.setProperty("--card-accent", accent);

  /* ── Fondo de imagen ── */
  if (item.bg) {
    const bgDiv = document.createElement("div");
    bgDiv.className = "card-bg";
    bgDiv.style.backgroundImage = `url('${item.bg}')`;
    card.appendChild(bgDiv);

    const ov = document.createElement("div");
    ov.className = "card-overlay";
    card.appendChild(ov);
  } else {
    /* Sin imagen: orbe de color decorativo en esquina superior derecha */
    const glow = document.createElement("div");
    glow.className = "card-glow";
    glow.style.cssText = `
      width:140px; height:140px;
      top:-40px; right:-40px;
      background:${accent};
      opacity:0;
    `;
    card.appendChild(glow);
  }

  /* ── Cuerpo ── */
  const body = document.createElement("div");
  body.className = "card-body";

  // Emoji
  const em = document.createElement("div");
  em.className = "card-emoji";
  em.textContent = item.emoji || "📄";
  body.appendChild(em);

  // Título
  const ti = document.createElement("div");
  ti.className = "card-title";
  ti.textContent = item.title;
  body.appendChild(ti);

  // Línea separadora con color de acento
  const div = document.createElement("div");
  div.className = "card-divider";
  div.style.background = `linear-gradient(90deg, ${accent}99, ${accent}33)`;
  body.appendChild(div);

  // Descripción
  const de = document.createElement("div");
  de.className = "card-desc";
  de.textContent = item.desc || "";
  body.appendChild(de);

  /* ── Estado ── */
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

  /* ── Barra de progreso ── */
  if (status === "active" && item.expiry && item.daysTotal) {
    const end   = parseDate(item.expiry);
    const start = new Date(end);
    start.setDate(start.getDate() - item.daysTotal);
    const elapsed   = daysSince(start);
    const remaining = Math.max(0, 100 - Math.min(100, Math.round((elapsed / item.daysTotal)*100)));

    const barWrap = document.createElement("div"); barWrap.className = "card-days-bar";
    const fill    = document.createElement("div"); fill.className = "card-days-fill";
    fill.style.cssText = `width:0%; background:linear-gradient(90deg,${accent}cc,${accent})`;
    barWrap.appendChild(fill);
    card.appendChild(barWrap);
    setTimeout(() => { fill.style.width = remaining + "%"; }, 400 + index*65);
  }

  /* Barra del mes */
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

  /* ── Interacciones bloqueadas ── */
  if (status === "expired") {
    card.addEventListener("click", e => { e.preventDefault(); toast("🔒 Este evento ya terminó."); });
  }
  if (status === "soon") {
    card.addEventListener("click", e => { e.preventDefault(); toast("⏳ ¡Pronto disponible, espéralo!"); });
  }

  return card;
}

/* =========================================================
   RENDER
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
   NAVBAR
   ========================================================= */
const navToggle = document.getElementById("navToggle");
const navLinks  = document.getElementById("navLinks");
navToggle?.addEventListener("click", e => { e.stopPropagation(); navLinks.classList.toggle("open"); });
document.addEventListener("click", e => {
  if (!navToggle?.contains(e.target) && !navLinks?.contains(e.target))
    navLinks?.classList.remove("open");
});

/* =========================================================
   HUD BARS
   ========================================================= */
document.querySelectorAll(".hud-bar").forEach(b => {
  b.style.setProperty("--v", b.dataset.val || 50);
});

/* =========================================================
   PARTÍCULAS — coloridas y variadas
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
   INIT
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  render();

  const fy = document.getElementById("footerYear");
  if (fy) fy.textContent = new Date().getFullYear();

  const active = CATEGORIES.flatMap(c => c.items).filter(i => cardStatus(i) === "active").length;
  const badge  = document.getElementById("heroBadgeCount");
  if (badge) badge.textContent = active;

  // Easter egg
  document.querySelector(".ht-accent")?.addEventListener("click", () => {
    const msgs = ["✨ ¡Moonveil Portal!","🌙 ¡Que empiece la aventura!","💫 ¡Explora todo!","🚀 ¡Eres una leyenda!"];
    toast(msgs[Math.floor(Math.random()*msgs.length)]);
  });

  setTimeout(() => toast(`🌙 ${active} secciones activas esperándote`), 900);
});