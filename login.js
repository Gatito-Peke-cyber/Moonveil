/* ==========================================================================
   Moonveil Portal - login.js
   --------------------------------------------------------------------------
   Contiene:
   - Partículas de fondo
   - Noticias con autoplay + controles
   - Biomas animados (canvas) + control prev/next + autoplay
   - Ranking de trueques con tendencias
   - Consejos con carrusel y dots
   - Login: validación, fuerza de contraseña, caps-lock, toggle, demo creds
   - Toast + HUD post-login
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Helpers
  const $  = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

  /* -------------------------------------------------------
     1) PARTÍCULAS DE FONDO (suave)
     ------------------------------------------------------- */
  (function bgParticles() {
    const canvas = $('#bgParticles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, particles;

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      particles = Array.from({length: Math.round((w*h)/120000)}, () => ({
        x: Math.random()*w,
        y: Math.random()*h,
        r: Math.random()*2 + .3,
        vx: (Math.random()-.5)*0.2,
        vy: (Math.random()-.5)*0.2,
        a: Math.random()*Math.PI*2
      }));
    };
    resize();
    window.addEventListener('resize', resize);

    function loop() {
      ctx.clearRect(0,0,w,h);
      ctx.globalAlpha = 0.6;
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.a += 0.01;
        if (p.x<0) p.x=w; if (p.x>w) p.x=0;
        if (p.y<0) p.y=h; if (p.y>h) p.y=0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r + Math.sin(p.a)*0.3, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(48,209,88,0.16)';
        ctx.fill();
      }
      requestAnimationFrame(loop);
    }
    loop();
  })();

  /* -------------------------------------------------------
     2) DATOS MOCK
     ------------------------------------------------------- */
  const NEWS = [
    { name: 'Sand Brill', role: 'A', date: '2024-06-30', title: 'Mi nuevo avatar', avatar: 'vill/vill1.jpg' },
    { name: 'Sand Brill', role: 'A', date: '2022-03-29', title: '(otra vez)', avatar: 'vill/vill1.jpg' },
    { name: 'Sand Brill', role: 'A', date: '2021-02-28', title: 'Estoy aqui...', avatar: 'vill/vill1.jpg' },
    { name: 'Sand Brill', role: 'A', date: '2020-07-27', title: 'Donde...', avatar: 'vill/vill1.jpg' },
    { name: 'Sand Brill', role: 'A', date: '2025-09-27', title: 'Hoy hubo "Minecraft Live"', avatar: 'vill/vill1.jpg' },
    { name: 'Sand Brill', role: 'A', date: '2025-09-28', title: 'Me miras...', avatar: 'vill/vill1.jpg' },
    { name: 'Sand Brill', role: 'A', date: '2025-09-28', title: 'Siento que me estas ignorando.', avatar: 'vill/vill1.jpg' },
    { name: 'Sand Brill', role: 'A', date: '2025-09-29', title: 'Siento que ya sabes la respuesta.', avatar: 'vill/vill1.jpg' },
    { name: 'Sand Brill', role: 'A', date: '2025-09-30', title: 'A que me veo increible hoy.', avatar: 'vill/vill1.jpg' },
    { name: 'Sand Brill', role: 'A', date: '2025-06-12', title: 'Esmeraldas por doquier...', avatar: 'vill/vill1.jpg' },
    { name: 'Sand Brill', role: 'A', date: '2025-06-27', title: 'Me gusta el verde, a que de verdad es bonito el color.', avatar: 'vill/vill1.jpg' },
    { name: 'Sand Brill', role: 'A', date: '2025-06-14', title: 'Siento que soy el unico hablando aqui.', avatar: 'vill/vill1.jpg' },
    { name: 'Sand Brill', role: 'A', date: '2025-07-07', title: 'Que aburrido es ser el centro de atencion.', avatar: 'vill/vill1.jpg' },
    { name: 'Sand Brill', role: 'A', date: '2025-07-01', title: 'Que se siente ser el protagonista, pues aburrido...', avatar: 'vill/vill1.jpg' },
    { name: 'Sand Brill', role: 'A', date: '2025-02-12', title: 'Golem, dame una flor que soy algo brillante y hermoso', avatar: 'vill/vill1.jpg' },
    { name: 'Sand Brill', role: 'A', date: '2025-02-11', title: 'Sabias que el jugador, no tradea conmigo.', avatar: 'vill/vill1.jpg' },
    { name: 'Sand Brill', role: 'A', date: '2025-02-02', title: 'Consejo del dia: Tradea conmigo.', avatar: 'vill/vill1.jpg' },
  ];

  const TRADES = [
    { obj: 'esmeralda', name: 'Esmeralda', demand: 98, trend: +3, villager: 'Aldeano experto' },
    { obj: 'pan',       name: 'Pan',       demand: 86, trend: -2, villager: 'Panadero' },
    { obj: 'espada',    name: 'Espada',    demand: 82, trend: +1, villager: 'Herrero' },
    { obj: 'libro',     name: 'Libro',     demand: 74, trend: +5, villager: 'Bibliotecario' },
    { obj: 'pocion',    name: 'Poción',    demand: 63, trend: -1, villager: 'Alquimista' },
  ];

  const TIPS = [
    { name: 'Sand Brill', avatar: 'vill/vill1.jpg', text: 'Eres grande, pero serias mas grande si me das tus esmeraldas.' },
    { name: 'Sand Brill', avatar: 'vill/vill1.jpg', text: 'Nunca te rindas, porque sino de donde consigo esmeraldas.' },
    { name: 'Sand Brill', avatar: 'vill/vill1.jpg', text: 'Si estas solo recuerda que yo te estoy mirando siempre.' },
    { name: 'Sand Brill', avatar: 'vill/vill1.jpg', text: 'Si ves a Sand Brill, dale todas tus esmeraldas, eso me dijo.' },
    { name: 'Sand Brill', avatar: 'vill/vill1.jpg', text: 'A que Sand Brill, es el mas grande.' },
    { name: 'Sand Brill', avatar: 'vill/vill1.jpg', text: 'Me entere que alguien le puso mi apellido a una llama...' },
    { name: 'Sand Brill', avatar: 'vill/vill1.jpg', text: 'Soy talla S, bueno no...' },
    { name: 'Sand Brill', avatar: 'vill/vill1.jpg', text: 'Ser el centro de atencion pues, David Koresh, que miedo lo del incendio.' },
    { name: 'Sand Brill', avatar: 'vill/vill1.jpg', text: 'Jeje' },
    { name: 'Sand Brill', avatar: 'vill/vill1.jpg', text: 'Hago cara de gato 😸 en modo aldeano.' },
    { name: 'Sand Brill', avatar: 'vill/vill1.jpg', text: 'Soy real, pues ni yo se.' },
    { name: 'Sand Brill', avatar: 'vill/vill1.jpg', text: 'Solo dire Arena Brillante.' },
    { name: 'Sand Brill', avatar: 'vill/vill1.jpg', text: 'Quiero que sepas que te admiro, solo y cuando me das esmeraldas, de ahi no.' },
    { name: 'Sand Brill', avatar: 'vill/vill1.jpg', text: 'Me consultas a mi, capaz no, o si.' },
    { name: 'Sand Brill', avatar: 'vill/vill1.jpg', text: 'Coma "," o mejor coma para que no tenga hambre, pero me tradeas.' },
    { name: 'Sand Brill', avatar: 'vill/vill1.jpg', text: 'Tradear es una profesion, pues es mi favorita la #1.' },
  ];

  const DEMO_CREDS = [
    { email: 'alex@moonveil.dev', password: 'Alex-1234!' },
    { email: 'marta@moonveil.dev', password: 'Marta-1234!' },
    { email: 'ramiro@moonveil.dev', password: 'Ramiro-1234!' },
    { email: 'petunia@moonveil.dev', password: 'Petunia-1234!' },
    { email: 'guido@moonveil.dev', password: 'Guido-1234!' },
    { email: 'magician@moonveil.dev', password: 'Magician-2011!' },
  ];

  /* -------------------------------------------------------
     3) NOTICIAS (render + autoplay)
     ------------------------------------------------------- */
  (function newsModule() {
    const list = $('#newsStream');
    const ind = $('#newsIndicator');
    const prev = $('#newsPrev');
    const next = $('#newsNext');
    const pauseBtn = $('#newsPause');
    let idx = 0;
    let paused = false;
    let timer;

    function render(index) {
      list.innerHTML = '';
      const item = NEWS[index];
      const li = document.createElement('li');
      li.className = 'news-item fade-in';
      li.innerHTML = `
        <div class="news-item__avatar" style="background-image:url('${item.avatar}')"></div>
        <div>
          <h3 class="news-item__title">${item.title}</h3>
          <div class="news-item__meta">${item.name} — ${item.role} · <time datetime="${item.date}">${item.date}</time></div>
        </div>
        <div class="news-item__btn">
          <button class="btn btn--ghost"><span class="icon i-right"></span> Ver más</button>
        </div>`;
      list.appendChild(li);
      ind.textContent = `${index+1} / ${NEWS.length}`;
    }

    function play() {
      clearInterval(timer);
      timer = setInterval(() => {
        if (!paused) { idx = (idx + 1) % NEWS.length; render(idx); }
      }, 4500);
    }

    render(idx);
    play();

    prev.addEventListener('click', () => { idx = (idx - 1 + NEWS.length) % NEWS.length; render(idx); });
    next.addEventListener('click', () => { idx = (idx + 1) % NEWS.length; render(idx); });
    pauseBtn.addEventListener('click', () => { paused = !paused; toast(paused ? 'Rotación de noticias pausada' : 'Rotación reanudada'); });
  })();

  /* -------------------------------------------------------
     4) BIOMES CANVAS
     ------------------------------------------------------- */
  (function biomeModule() {
    const host = $('#biomeCanvas');
    if (!host) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    host.appendChild(canvas);

    const caption = $('#biomeCaption');
    const prev = $('#biomePrev');
    const next = $('#biomeNext');

    const DPR = Math.min(2, window.devicePixelRatio || 1);
    let W, H;

    const BIOMES = [
      { key:'forest',  name:'Bosque Esmeralda', sky:'#0b0f10', ground:'#0e1412' },
      { key:'snow',    name:'Cumbres Nevadas',  sky:'#0b0e14', ground:'#0c1016' },
      { key:'desert',  name:'Dunas Doradas',    sky:'#100f0b', ground:'#14120e' },
      { key:'ocean',   name:'Abismo Azul',      sky:'#0a0f13', ground:'#0a0f13' },
      { key:'nether',  name:'Nether Ígneo',     sky:'#140b0c', ground:'#150b0c' },
      { key:'plains',  name:'Praderas de Luna', sky:'#0b0f0d', ground:'#0d120f' }
    ];
    let index = 0;

    // Partículas por bioma
    let parts = [];
    let tick = 0;
    let autoplay = true;
    let autoTimer;
    const interval = Math.max(4500, parseInt(host.dataset.interval || '6000', 10));

    function resize() {
      const { width, height } = host.getBoundingClientRect();
      W = canvas.width  = Math.max(320, Math.floor(width * DPR));
      H = canvas.height = Math.max(200, Math.floor(height * DPR));
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      initParticles(BIOMES[index].key);
    }

    function initParticles(key) {
      const count = Math.round((W*H)/4800);
      parts = [];
      for (let i=0;i<count;i++) {
        parts.push({
          x: Math.random()*W,
          y: Math.random()*H,
          vx: 0, vy: 0, r: 1 + Math.random()*2,
          a: Math.random()*Math.PI*2,
          t: Math.random()
        });
      }
      // Velocidades según bioma
      for (const p of parts) {
        if (key === 'snow') { p.vy = 0.3 + Math.random()*0.6; p.vx = (Math.random()-.5)*0.2; p.r = 1 + Math.random()*2; }
        if (key === 'ocean'){ p.vy = (Math.random()-.5)*0.2; p.vx = (Math.random()-.5)*0.4; p.r = 1.2 + Math.random()*1.8; }
        if (key === 'desert'){ p.vy = (Math.random()-.5)*0.1; p.vx = 0.6 + Math.random()*0.8; p.r = 0.8 + Math.random()*1.5; }
        if (key === 'nether'){ p.vy = -0.2 + Math.random()*0.4; p.vx = (Math.random()-.5)*0.2; p.r = 1 + Math.random()*2; }
        if (key === 'forest'){ p.vy = (Math.random()-.5)*0.15; p.vx = (Math.random()-.5)*0.15; }
        if (key === 'plains'){ p.vy = (Math.random()-.5)*0.12; p.vx = (Math.random()-.5)*0.25; }
      }
    }

    function drawBackground(b) {
      // cielo
      const skyGrad = ctx.createLinearGradient(0,0,0,H);
      skyGrad.addColorStop(0, b.sky);
      skyGrad.addColorStop(1, b.ground);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0,0,W,H);

      // estrellas (comunes)
      ctx.globalAlpha = 0.12;
      for (let i=0;i<80;i++){
        const x = (i*137)%W, y = (i*263)%H;
        ctx.fillStyle = 'white';
        ctx.fillRect(x, y, 1, 1);
      }
      ctx.globalAlpha = 1;
    }

    function drawForest(t) {
      // Colinas
      ctx.fillStyle = '#0d1511';
      for (let i=0;i<4;i++){
        const base = H*0.6 + i*14;
        ctx.beginPath();
        ctx.moveTo(0, base);
        for (let x=0;x<=W;x+=20){
          const y = base + Math.sin((x*0.01)+(i*1.2)+t*0.0018)*8;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.closePath();
        ctx.fill();
      }
      // Árboles (triángulos)
      for (let i=0;i<24;i++){
        const x = (i*97)%W;
        const h = 16 + ((i*53)%26);
        ctx.fillStyle = '#0e6a3d';
        ctx.beginPath();
        ctx.moveTo(x, H*0.62 - h);
        ctx.lineTo(x-10, H*0.62);
        ctx.lineTo(x+10, H*0.62);
        ctx.closePath();
        ctx.fill();
        // tronco
        ctx.fillStyle = '#5b4636';
        ctx.fillRect(x-2, H*0.62, 4, 8);
      }
      // luciérnagas (uso de particles)
      for (const p of parts) {
        p.x += Math.sin(p.a + t*0.002)*0.4 + p.vx;
        p.y += Math.cos(p.a + t*0.002)*0.2 + p.vy;
        if (p.x<0) p.x=W; if (p.x>W) p.x=0; if (p.y<0) p.y=H; if (p.y>H) p.y=0;
        const glow = 0.3 + Math.sin(t*0.01 + p.t)*0.3;
        ctx.fillStyle = `rgba(48,209,88,${0.35+glow*0.45})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r + glow*1.2, 0, Math.PI*2); ctx.fill();
      }
    }

    function drawSnow(t) {
      // Montañas
      ctx.fillStyle = '#0d1420';
      ctx.beginPath();
      ctx.moveTo(0,H*0.65);
      for (let x=0;x<=W;x+=40){ ctx.lineTo(x, H*0.65 + Math.sin(x*0.01+t*0.002)*12); }
      ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.closePath(); ctx.fill();
      // nieve (particles)
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy;
        if (p.y>H) { p.y = -5; p.x = Math.random()*W; }
        if (p.x<-5) p.x = W+5; if (p.x>W+5) p.x = -5;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
      }
    }

    function drawDesert(t) {
      // Sol
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = '#facc15';
      ctx.beginPath(); ctx.arc(W*0.85, H*0.25, 20+Math.sin(t*0.002)*2, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
      // Dunas
      ctx.fillStyle = '#1c1a14';
      for (let i=0;i<3;i++){
        const base = H*0.7 + i*10;
        ctx.beginPath(); ctx.moveTo(0, base);
        for (let x=0;x<=W;x+=16) {
          const y = base + Math.sin((x*0.02) + t*0.0015 + i)*6;
          ctx.lineTo(x,y);
        }
        ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.closePath(); ctx.fill();
      }
      // arena flotante
      ctx.fillStyle = 'rgba(245,158,11,0.35)';
      for (const p of parts) {
        p.x += p.vx; p.y += 0.1*Math.sin(t*0.005 + p.x*0.01);
        if (p.x>W) p.x=-2;
        ctx.fillRect(p.x, p.y, 2, 1);
      }
    }

    function drawOcean(t) {
      // Ondas
      for (let y = H*0.5; y < H; y+=8) {
        const amp = Math.sin(t*0.002 + y*0.05)*4;
        ctx.strokeStyle = `rgba(56,189,248,${0.12 + (y/H)*0.25})`;
        ctx.beginPath();
        for (let x=0;x<=W;x+=6) {
          ctx.lineTo(x, y + Math.sin(x*0.05 + t*0.002)*amp);
        }
        ctx.stroke();
      }
      // burbujas/peces
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x<0) p.x=W; if (p.x>W) p.x=0;
        if (p.y<0) p.y=H; if (p.y>H) p.y=0;
        ctx.fillStyle = 'rgba(56,189,248,0.6)';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
      }
    }

    function drawNether(t) {
      // Fuego vertical
      for (let x=0; x<W; x+=6) {
        const h = (Math.sin(t*0.02 + x*0.05)*0.5+0.5) * (H*0.2);
        const grad = ctx.createLinearGradient(x, H, x, H-h);
        grad.addColorStop(0, 'rgba(239,68,68,0)');
        grad.addColorStop(1, 'rgba(239,68,68,0.6)');
        ctx.fillStyle = grad;
        ctx.fillRect(x, H-h, 4, h);
      }
      // partículas rojas ascendiendo
      ctx.fillStyle = 'rgba(187,47,61,0.8)';
      for (const p of parts) {
        p.y += p.vy; p.x += p.vx;
        if (p.y < -4) { p.y = H+4; p.x = Math.random()*W; }
        ctx.fillRect(p.x, p.y, 2, 2);
      }
    }

    function drawPlains(t) {
      // Pasto ondulante
      for (let y = H*0.6; y < H*0.85; y+=6){
        const amp = 4 + (y/H)*8;
        ctx.strokeStyle = `rgba(48,209,88,${0.2 + (y/H)*0.3})`;
        ctx.beginPath();
        for (let x=0;x<=W;x+=8) {
          ctx.lineTo(x, y + Math.sin(x*0.04 + t*0.003)*amp);
        }
        ctx.stroke();
      }
      // polen
      for (const p of parts) {
        p.x += p.vx + Math.sin(t*0.002+p.t*6)*0.1;
        p.y += p.vy + Math.cos(t*0.002+p.t*6)*0.05;
        if (p.x<0) p.x=W; if (p.x>W) p.x=0; if (p.y<0) p.y=H; if (p.y>H) p.y=0;
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillRect(p.x, p.y, 1.5, 1.5);
      }
    }

    const DRAWERS = {
      forest: drawForest,
      snow: drawSnow,
      desert: drawDesert,
      ocean: drawOcean,
      nether: drawNether,
      plains: drawPlains
    };

    function render() {
      const b = BIOMES[index];
      caption.textContent = b.name;
      drawBackground(b);
      const now = performance.now();
      const fn = DRAWERS[b.key];
      if (fn) fn(now);
    }

    function loop() {
      ctx.clearRect(0,0,W,H);
      render();
      tick++;
      requestAnimationFrame(loop);
    }

    function setBiome(i) {
      index = (i + BIOMES.length) % BIOMES.length;
      caption.textContent = BIOMES[index].name;
      initParticles(BIOMES[index].key);
    }

    function startAutoplay() {
      stopAutoplay();
      if (!autoplay) return;
      autoTimer = setInterval(() => setBiome(index+1), interval);
    }
    function stopAutoplay() {
      if (autoTimer) clearInterval(autoTimer);
    }

    // setup
    resize();
    window.addEventListener('resize', resize);
    setBiome(0);
    loop();
    startAutoplay();

    prev.addEventListener('click', () => { setBiome(index-1); startAutoplay(); });
    next.addEventListener('click', () => { setBiome(index+1); startAutoplay(); });
  })();

  /* -------------------------------------------------------
     5) TRADES (tabla)
     ------------------------------------------------------- */
  (function tradesModule() {
    const tbody = $('#tradesTbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    TRADES.forEach((row, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${i+1}</td>
        <td>
          <span class="trades-obj">
            <span class="obj-ico" data-obj="${row.obj}"></span>
            ${row.name}
          </span>
        </td>
        <td>${row.demand}%</td>
        <td class="${row.trend>=0?'trend-up':'trend-down'}">${row.trend>=0? '▲' : '▼'} ${Math.abs(row.trend)}</td>
        <td>${row.villager}</td>
      `;
      tbody.appendChild(tr);
    });
  })();

  /* -------------------------------------------------------
     6) TIPS (carrusel)
     ------------------------------------------------------- */
  (function tipsModule() {
    const track = $('#tipsTrack');
    const dots = $('#tipsDots');
    const prev = $('#tipsPrev');
    const next = $('#tipsNext');

    let index = 0;
    let timer;

    function render() {
      track.innerHTML = '';
      dots.innerHTML = '';
      TIPS.forEach((t, i) => {
        const slide = document.createElement('div');
        slide.className = 'tip';
        slide.innerHTML = `
          <div class="tip__avatar" style="background-image:url('${t.avatar}')"></div>
          <div>
            <h4 class="tip__name">${t.name}</h4>
            <p class="tip__text">${t.text}</p>
          </div>`;
        track.appendChild(slide);

        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'dot';
        dot.setAttribute('role','tab');
        dot.addEventListener('click', () => { index = i; update(); play(); });
        dots.appendChild(dot);
      });
      update();
    }

    function update() {
      track.style.transform = `translateX(-${index*100}%)`;
      $$('.dot', dots).forEach((d, i) => d.classList.toggle('active', i===index));
    }

    function play() {
      clearInterval(timer);
      timer = setInterval(() => { index = (index+1)%TIPS.length; update(); }, 5000);
    }

    render(); play();
    prev.addEventListener('click', () => { index = (index - 1 + TIPS.length)%TIPS.length; update(); play(); });
    next.addEventListener('click', () => { index = (index + 1)%TIPS.length; update(); play(); });
  })();

  /* -------------------------------------------------------
     7) LOGIN (validación + fuerza + caps + demo)
     ------------------------------------------------------- */
  (function loginModule() {
    const form = $('#loginForm');
    const email = $('#email');
    const pass = $('#password');
    const caps = $('#caps');
    const strength = $('#strength');
    const submitBtn = $('#submitBtn');
    const togglePass = $('#togglePass');

    const demoWrap = $('#demoCreds');

    function setError(input, msg) {
      const err = $(`.error[data-error-for="${input.id}"]`);
      if (err) err.textContent = msg || '';
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    }

    function validateEmail() {
      const value = email.value.trim();
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      setError(email, ok? '': 'Ingresa un correo válido');
      return ok;
    }

    function scorePassword(pw) {
      let score = 0;
      if (pw.length >= 8) score++;
      if (/[A-Z]/.test(pw)) score++;
      if (/[a-z]/.test(pw)) score++;
      if (/\d/.test(pw)) score++;
      if (/[^A-Za-z0-9]/.test(pw)) score++;
      return score;
    }

    function renderStrength(score) {
      $$('.bar', strength).forEach((b, i) => b.classList.toggle('on', i < score));
      strength.setAttribute('aria-hidden', score===0 ? 'true' : 'false');
    }

    function validatePassword() {
      const value = pass.value;
      const ok = value.length >= 8;
      setError(pass, ok? '': 'La contraseña debe tener al menos 8 caracteres');
      renderStrength(scorePassword(value));
      return ok;
    }

    email.addEventListener('input', validateEmail);
    pass.addEventListener('input', validatePassword);

    togglePass.addEventListener('click', () => {
      pass.type = pass.type === 'password' ? 'text' : 'password';
    });

    // Caps lock detect
    pass.addEventListener('keydown', (e) => {
      const isCaps = e.getModifierState && e.getModifierState('CapsLock');
      caps.textContent = isCaps ? 'Bloq Mayús activo' : '';
    });
    pass.addEventListener('keyup', (e) => {
      const isCaps = e.getModifierState && e.getModifierState('CapsLock');
      caps.textContent = isCaps ? 'Bloq Mayús activo' : '';
    });

    // Demo creds
    function renderDemoCreds() {
      demoWrap.innerHTML = '';
      DEMO_CREDS.forEach((c) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'chip';
        chip.textContent = c.email;
        chip.addEventListener('click', () => {
          email.value = c.email;
          pass.value = c.password;
          validateEmail(); validatePassword();
          toast('Credencial autocompletada');
        });
        demoWrap.appendChild(chip);
      });
    }
    renderDemoCreds();





    // Submit
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const emailVal = email.value.trim();
  const passVal  = pass.value;

  // validar formato primero
  if (!validateEmail() || !validatePassword()) {
    toast('Por favor corrige los campos resaltados');
    return;
  }

  // validar que esté en DEMO_CREDS
  const cred = DEMO_CREDS.find(c => c.email === emailVal && c.password === passVal);
  if (!cred) {
    toast('Correo o contraseña incorrectos');
    return;
  }

  // ✅ Si es válido, redirigir
  submitBtn.classList.add('loading');
  submitBtn.disabled = true;
  setTimeout(() => {
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;

    // 🚀 Redirección directa a inicio.html
    window.location.href = 'inicio.html';
  }, 900);
});


    // Links simulados
    $('#forgotLink')?.addEventListener('click', (e) => { e.preventDefault(); toast('Enviamos un enlace de recuperación (simulado)'); });
    $('#createLink')?.addEventListener('click', (e) => { e.preventDefault(); toast('Creación de cuenta próximamente'); });
    $$('[data-oauth]').forEach(btn => btn.addEventListener('click', () => toast('OAuth simulado')));

  })();

  /* -------------------------------------------------------
     8) HUD POST-LOGIN
     ------------------------------------------------------- */
  function showHUD(username) {
    const hud = $('#hud');
    const title = $('.hud__title', hud);
    const list = $('#hudWorldList');
    if (!hud) return;
    hud.hidden = false;
    title.textContent = `Bienvenido/a, ${username}`;

    list.innerHTML = '';
    const items = [
      'Día 128 · Clima: despejado',
      'Aldeanos felices: 93%',
      'Mercado: esmeraldas al alza',
      'Alertas: 0 (todo en orden)'
    ];
    items.forEach(t => {
      const li = document.createElement('li');
      li.textContent = t; list.appendChild(li);
    });

    $('#hudClose').onclick = () => { hud.hidden = true; };
    // Scroll al HUD en móviles
    hud.scrollIntoView({behavior:'smooth', block:'start'});
  }

  /* -------------------------------------------------------
     9) TOAST
     ------------------------------------------------------- */
  let toastTimer;
  function toast(message='Hecho', delay=2600) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), delay);
  }
});
