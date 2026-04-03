/* =====================================================
   Moonveil Portal — Events Hub JS  HYBRID
   ✦ Hero/Header morado v5
   ✦ Tarjetas + cabeceras de categoría azul espacial v3
   ✦ Toda la lógica de fechas / contadores conservada
   ===================================================== */

   import { onAuthChange, logout } from './auth.js';

   const PERFIL_KEY = 'mv_perfil';
   
   /* ══════════════════════════════════════════
      CATEGORÍAS Y TARJETAS
   ══════════════════════════════════════════ */
   const CATEGORIES = [
     {
       id: "principal", icon: "🏠", name: "Principal",
       color: "#00d4ff",
       items: [
         { title:"Inicio",              desc:"Página de bienvenida del portal.",                      emoji:"🌙", url:"inicio.html",    bg:"img/picture6.jpg"  },
         { title:"Perfiles Aldeanil",   desc:"Explora y gestiona los perfiles de los aldeanos.",      emoji:"👤", url:"perfiles.html",  bg:"vill/teacher.jpg"  },
         { title:"Noticias Aldeanil",   desc:"Noticias del mundo.",                                   emoji:"📰", url:"noticias.html",  startDate:"2026-02-23", bg:"gif/villager-news.gif" },
         { title:"Foro Aldeanil",       desc:"Algunas novedades de los aldeanos. Y quien sabe un chisme...", emoji:"💬", url:"foro.html", bg:"vill/booktea.gif" },
         { title:"Contacto Aldeanil",   desc:"Pues aqui se habla con los aldeanos del mundo. No todos pero si algunos...", emoji:"📩", url:"contactos.html", bg:"imagen/golem1.jpg" },
         { title:"Updates",             desc:"Registro de todas las actualizaciones.",                emoji:"🔄", url:"updates.html",   startDate:"2026-03-01", bg:"img/picture1.jpg" },
         { title:"History",             desc:"Algunas historias, sin concluir...",                   emoji:"📜", url:"historia.html",  startDate:"2026-05-01", bg:"imagen/diary.jpg" },
         { title:"Cofres, y mas Cofres...", desc:"Aqui hay algunos cofres... ¿Que Sand Brill patrocino?...", emoji:"⭐", url:"chest.html", startDate:"2026-01-01", bg:"img/picture4.jpg" },
       ]
     },
     {
       id: "economia", icon: "💎", name: "Comunidad & Economía",
       color: "#3b82f6",
       items: [
         { title:"Tradeos",  desc:"Sistema de intercambios entre aldeanos, aunque ellos solo piden esmeraldas.", emoji:"🔀", url:"tradeos.html", startDate:"2026-04-10", bg:"img-pass/trading.jpg" },
         { title:"Tienda",   desc:"Compra lo que mas te convenga. ¡Y eso si hay cupones! Obvio si tienes...", emoji:"🛒", url:"tienda.html", bg:"img/mine.gif" },
         { title:"Bank",     desc:"Gestiona tus monedas y depósitos. ¡Que no se te pase su tiempo!", emoji:"🏦", url:"banco.html", accent:"#34d399", bg:"img/picture3.jpg" },
         { title:"Ruleta",   desc:"¡Prueba tu suerte y gana premios! Y si quieres mas tickets, compralos en la tienda...", emoji:"🎫", url:"premios.html", daysTotal:44, accent:"#fbbf24", startDate:"2026-02-26", bg:"gif/5am.gif" },
         { title:"Posts",    desc:"Bueno, supongo que aqui postean los aldeanos...", emoji:"💬", url:"ins.html", startDate:"2026-04-01", bg:"img/picture2.jpg" },
       ]
     },
     {
       id: "herramientas", icon: "🛠️", name: "Herramientas & Minijuegos",
       color: "#818cf8",
       items: [
         { title:"Calendar",         desc:"Calendario de inicio de sesion. Se renueva cada mes.", emoji:"📅", url:"calendar.html", isCalendar:true, accent:"#22d3ee", bg:"gif/rain1.gif" },
         { title:"Sand",             desc:"...", emoji:"⚡", url:"SBM-G.html", accent:"#fbbf24", startDate:"2026-02-22", expiry:"2026-04-15", daysTotal:60, bg:"img/picture4.jpg" },
         { title:"Minepass",         desc:"Lleguemos hasta las estrellas, tu sabes que no te abandonare...", emoji:"🎫", url:"pases.html", startDate:"2026-02-28", expiry:"2026-04-01", daysTotal:30, accent:"#00d4ff", bg:"img/universe1.gif" },
         { title:"Minigame",         desc:"Un minijuego, asi que gestiona bien tu dinero... y ten cuidado con los ¡bandidos!...", emoji:"⭐⭐⭐", url:"min.html", startDate:"2026-02-20", expiry:"2026-04-01", daysTotal:39, accent:"#818cf8", bg:"gif/noche1.gif" },
         { title:"Harvest Corp",     desc:"Maneja tu empresa de cultivos y haz que crezca con esfuerzo y sudor...", emoji:"🌟", url:"em.html", startDate:"2026-02-20", expiry:"2026-05-01", daysTotal:69, accent:"#f472b6", bg:"gif/2am.gif" },
         { title:"████ Master??",    desc:"Supongo que el esta vez quizo o tratara de hacer una ¿broma?...", emoji:"🎭", url:"ddb.html", startDate:"2026-03-30", expiry:"2026-04-30", daysTotal:30, accent:"#f87171", bg:"imagen/steve3.jpg" },
         { title:"Cultivos Eden",    desc:"Hola amigos, aqui les habla Eden y pues quiero que me ayudes a generar mucho dinerito...", emoji:"🌻", url:"cul.html", startDate:"2026-02-20", expiry:"2026-04-30", daysTotal:30, accent:"#f472b6", bg:"gif/4am.gif" },
         { title:"Investigaciones",  desc:"¡Hola Agente ████! Tenemos que resolver estos casos...", emoji:"🔎", url:"invs.html", startDate:"2026-02-23", expiry:"2026-04-30", daysTotal:50, accent:"#f87171", bg:"gif/creaking-minecraft.gif" },
         { title:"Minelife",         desc:"¡Hola ████! Bueno, ¡eh!... No tengo palabras...", emoji:"🌳", url:"minecraft.html", startDate:"2026-02-20", expiry:"2026-04-30", daysTotal:50, accent:"#f87171", bg:"img-pass/fox-xy.jpg" },
         { title:"Minestone",        desc:"¡Hola ████! Puedes sobrevivir, con 10 corazones, ¿seguro?...", emoji:"🌳", url:"aventure.html", startDate:"2026-02-20", expiry:"2026-04-20", daysTotal:50, accent:"#fbbf24", bg:"img-pass/pokki.jpg" },
       ]
     },
     {
       id: "eventos", icon: "🎉", name: "Eventos Especiales",
       color: "#f472b6",
       items: [
         { title:"Eventos",        desc:"Centro de todos los eventos activos del mundo.", emoji:"🎫", url:"eventos.html", accent:"#f87171", bg:"img-pass/animalsphoto.jpg" },
         { title:"Valentine",      desc:"Evento especial de San Valentín. ¿Con un caso por resolver...?", emoji:"💖", url:"sv.html", expiry:"2026-02-20", daysTotal:1, accent:"#f472b6", bg:"ach/5i.png" },
         { title:"Dragon Hunter",  desc:"Caza 20 Ender Dragons y alcanza la gloria.", emoji:"🐉", url:"dragon.html", expiry:"2026-04-20", daysTotal:20, accent:"#a78bfa", bg:"ach/4y.png" },
         { title:"Año Lunar",      desc:"Celebra el Año Nuevo Lunar con recompensas.", emoji:"🏮", url:"lny.html", expiry:"2026-03-06", daysTotal:18, accent:"#fbbf24", bg:"img-pass/añomine.jpg" },
         { title:"Event Emerald",  desc:"La lluvia de Esmeraldas.", emoji:"🟢", url:"emerald.html", startDate:"2026-02-22", expiry:"2026-03-30", daysTotal:6, accent:"#34d399", bg:"ach/5y.png" },
         { title:"Anniversary!!",  desc:"Un año mas en este mundo cubico Moonveil...", emoji:"🎂", url:"ann.html", startDate:"2026-04-10", expiry:"2026-12-30", daysTotal:120, accent:"#fbbf24", bg:"img-pass/partymine.jpg" },
         { title:"Próximo Evento", desc:"Un nuevo evento se aproxima. ¡Prepárate!", emoji:"🔮", url:"#", startDate:"2030-04-01", accent:"#818cf8" },
         { title:"Minesafio",      desc:"Seguro es muy facil, espero...", emoji:"⚡", url:"batt.html", startDate:"2026-03-04", expiry:"2026-03-10", daysTotal:6, accent:"#fbbf24", bg:"ach/2m.png" },
       ]
     },
     {
       id: "celebrar", icon: "⭐", name: "Celebraciones",
       color: "#fbbf24",
       items: [
         { title:"¡Que recuerdos...!", desc:"Pero no dejemos de seguir creando recuerdos", emoji:"🌳", url:"album.html", startDate:"2026-02-20", expiry:"2026-06-01", daysTotal:50, accent:"#fbbf24", bg:"img/universe1.gif" },
         { title:"♡♡♡♡♡♡♡♡♡♡♡♡♡♡♡", desc:"Si que es un gran dia... ¡Asi que celebremos!", emoji:"🌟", url:"tsm.html", startDate:"2026-04-20", expiry:"2026-04-21", daysTotal:2, accent:"#f472b6", bg:"dav/alex1.jpg" },
         { title:"♡♡♡♡♡♡♡♡♡♡♡♡♡♡♡", desc:"Si que es un gran dia... ¡Asi que celebremos!", emoji:"🌟", url:"lns.html", startDate:"2026-06-17", expiry:"2026-06-18", daysTotal:2, accent:"#f472b6", bg:"dav/steve2.jpg" },
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
      CONSTRUIR TARJETA — estilo azul espacial v3
   ══════════════════════════════════════════ */
   function buildCard(item, index, categoryColor) {
     const status = cardStatus(item);
     const accent = item.accent || categoryColor || "#00d4ff";
   
     const tag  = (status === "active" && item.url && item.url !== "#") ? "a" : "div";
     const card = document.createElement(tag);
     card.className = "hub-card";
     card.style.animationDelay = `${index * 0.07}s`;
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
   
     const divider = document.createElement("div");
     divider.className = "card-divider";
     divider.style.background = accent;
     body.appendChild(divider);
   
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
   
     /* Barra de progreso */
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
   
     /* Interacciones bloqueadas */
     if (status === "expired") {
       card.addEventListener("click", e => { e.preventDefault(); toast("🔒 Este evento ya terminó."); });
     }
     if (status === "soon") {
       card.addEventListener("click", e => { e.preventDefault(); toast("⏳ ¡Pronto disponible, espéralo!"); });
     }
   
     return card;
   }
   
   /* ══════════════════════════════════════════
      RENDER HUB — cabeceras estilo azul espacial v3
   ══════════════════════════════════════════ */
   function render() {
     const hub = document.getElementById("hubBody");
     if (!hub) return;
     hub.innerHTML = "";
   
     CATEGORIES.forEach((cat, ci) => {
       const section = document.createElement("section");
       section.className = "category";
       section.style.animationDelay = `${ci * 0.1}s`;
   
       /* Cabecera azul espacial v3 */
       const header = document.createElement("div");
       header.className = "category-header";
       header.innerHTML = `
         <span class="category-icon">${cat.icon}</span>
         <span class="category-name">${cat.name}</span>
         <span class="category-count">${cat.items.length} sección${cat.items.length !== 1 ? "es" : ""}</span>
       `;
       section.appendChild(header);
   
       const grid = document.createElement("div");
       grid.className = "cards-grid";
       cat.items.forEach((item, ii) => grid.appendChild(buildCard(item, ii, cat.color)));
       section.appendChild(grid);
       hub.appendChild(section);
     });
   }
   
   /* ══════════════════════════════════════════
      HEADER: datos del usuario
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
     } catch {}
   }
   
   /* ══════════════════════════════════════════
      CANVAS ESPACIAL (estrellas + meteoros magenta)
   ══════════════════════════════════════════ */
   function initSpaceCanvas() {
     const c = document.getElementById("stars-canvas");
     if (!c) return;
     const ctx = c.getContext("2d");
     const dpi = Math.max(1, devicePixelRatio || 1);
     let W, H, stars, shootingStars;
   
     /* Mezcla de colores: magenta del hero + cian de las tarjetas */
     const COLORS = [
       "rgba(192,38,211,",
       "rgba(0,212,255,",
       "rgba(124,58,237,",
       "rgba(240,171,252,",
       "rgba(34,211,238,",
       "rgba(200,224,255,",
     ];
   
     function init() {
       W = c.width  = innerWidth  * dpi;
       H = c.height = innerHeight * dpi;
       stars = Array.from({ length: 200 }, () => ({
         x: Math.random() * W, y: Math.random() * H,
         r: (0.3 + Math.random() * 1.8) * dpi,
         a: 0.1 + Math.random() * 0.6,
         twinkleSpeed: 0.02 + Math.random() * 0.04,
         twinklePhase: Math.random() * Math.PI * 2,
         color: COLORS[Math.floor(Math.random() * COLORS.length)],
         floating: Math.random() > 0.7,
         vy: Math.random() > 0.7 ? (0.04 + Math.random() * 0.18) : 0,
       }));
       shootingStars = [];
     }
   
     function spawnShootingStar() {
       const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.3;
       const speed = (6 + Math.random() * 8) * dpi;
       shootingStars.push({
         x: Math.random() * W * 0.8, y: Math.random() * H * 0.4,
         vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
         length: (80 + Math.random() * 160) * dpi,
         life: 1.0, decay: 0.012 + Math.random() * 0.018,
         color: COLORS[Math.floor(Math.random() * 3)],
         width: (0.8 + Math.random() * 1.4) * dpi,
       });
     }
   
     let shootTimer = 0;
     const shootInterval = 110 + Math.random() * 200;
   
     function tick() {
       ctx.clearRect(0, 0, W, H);
       stars.forEach(s => {
         s.twinklePhase += s.twinkleSpeed;
         const alpha = s.a * (0.5 + 0.5 * Math.sin(s.twinklePhase));
         ctx.beginPath();
         ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
         ctx.fillStyle = s.color + alpha + ")";
         ctx.fill();
         if (s.floating) { s.y -= s.vy; if (s.y < -10) s.y = H + 10; }
       });
   
       shootTimer++;
       if (shootTimer >= shootInterval) { shootTimer = 0; if (shootingStars.length < 3) spawnShootingStar(); }
       shootingStars = shootingStars.filter(m => m.life > 0);
       shootingStars.forEach(m => {
         const hyp = Math.hypot(m.vx, m.vy);
         const tailX = m.x - (m.vx / hyp) * m.length;
         const tailY = m.y - (m.vy / hyp) * m.length;
         const grad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
         grad.addColorStop(0, m.color + "0)");
         grad.addColorStop(0.6, m.color + (m.life * 0.4) + ")");
         grad.addColorStop(1, m.color + m.life + ")");
         ctx.beginPath(); ctx.moveTo(tailX, tailY); ctx.lineTo(m.x, m.y);
         ctx.strokeStyle = grad; ctx.lineWidth = m.width * m.life; ctx.lineCap = "round"; ctx.stroke();
         ctx.beginPath(); ctx.arc(m.x, m.y, m.width * 1.5 * m.life, 0, Math.PI * 2);
         ctx.fillStyle = m.color + m.life + ")"; ctx.fill();
         m.x += m.vx; m.y += m.vy; m.life -= m.decay;
       });
       requestAnimationFrame(tick);
     }
     init(); tick();
     addEventListener("resize", init);
   }
   
   /* ── Loader ── */
   function hideLoader() {
     const loader = document.getElementById("loader"); if (!loader) return;
     let w = 0; const fill = document.getElementById("ld-fill");
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
   
   /* ── Nav mobile ── */
   function initNav() {
     const ham = document.getElementById("hamburger");
     const nav = document.getElementById("main-nav");
     if (ham && nav) {
       ham.addEventListener("click", () => nav.classList.toggle("open"));
       document.addEventListener("click", e => {
         if (!ham.contains(e.target) && !nav.contains(e.target)) nav.classList.remove("open");
       });
     }
   }
   
   /* ── Logout ── */
   function initLogout() {
     document.getElementById("btn-logout")?.addEventListener("click", async () => {
       if (!confirm("¿Cerrar sesión?")) return;
       try { await logout(); } catch {}
       window.location.href = "index.html";
     });
   }
   
   /* ── Back to top ── */
   function initBackToTop() {
     const btn = document.getElementById("back-top"); if (!btn) return;
     window.addEventListener("scroll", () => btn.classList.toggle("show", window.scrollY > 400));
     btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
   }
   
   /* ── Toast ── */
   function toast(msg) {
     const el = document.getElementById("toast"); if (!el) return;
     el.textContent = msg; el.classList.add("show");
     clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove("show"), 2800);
   }
   
   /* ══ INIT ══ */
   document.addEventListener("DOMContentLoaded", () => {
     hideLoader();
     initSpaceCanvas();
     initNav();
     initLogout();
     initBackToTop();
   
     onAuthChange(user => {
       if (!user) { window.location.href = "index.html"; return; }
       loadUserHeader();
       render();
   
       const fy = document.getElementById("footerYear");
       if (fy) fy.textContent = new Date().getFullYear();
   
       const active = CATEGORIES.flatMap(c => c.items).filter(i => cardStatus(i) === "active").length;
       const badge = document.getElementById("heroBadgeCount");
       if (badge) badge.textContent = active;
   
       setTimeout(() => toast(`🌌 ${active} secciones activas esperándote`), 900);
     });
   });