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
    { name: 'Sand Brill', role: 'A', date: '2024-06-30', title: 'Un aldeano sin esmeraldas es como un creeper sin chispa. Yo tengo chispa… y demasiadas esmeraldas.', avatar: 'vill/vill1.jpg' },
    { name: 'Sand Brill', role: 'A', date: '2022-03-29', title: 'Dicen que el tiempo es oro. Yo digo que el tiempo es esmeralda, y yo soy el reloj.', avatar: 'vill/vill1.jpg' },
    { name: 'Sand Brill', role: 'A', date: '2021-02-28', title: 'Una vez traté de intercambiar con el destino… me salió con descuento.', avatar: 'vill/vill1.jpg' },
    { name: 'Sand Brill', role: 'A', date: '2020-07-27', title: 'No soy arrogante, solo es que el sol brilla menos desde que aparecí.', avatar: 'vill/vill1.jpg' },
    { name: 'Sand Brill', role: 'A', date: '2025-09-27', title: 'El sabio construye su casa con madera… pero el legendario la construye con mis ideas.', avatar: 'vill/vill1.jpg' },
    { name: 'Sand Brill', role: 'A', date: '2025-09-28', title: 'Cuando camino por la aldea, los golems se cuadran. No es respeto… es temor económico.', avatar: 'vill/vill1.jpg' },
    { name: 'Sand Brill', role: 'A', date: '2025-09-28', title: 'A veces miro mi reflejo en una esmeralda… y la esmeralda me pide un autógrafo.', avatar: 'vill/vill1.jpg' },
    { name: 'Sand Brill', role: 'A', date: '2025-09-29', title: '¿Qué es el éxito? Simple. Ser Sand Brill y tener los cofres siempre llenos.', avatar: 'vill/vill1.jpg' },
    { name: 'Sand Brill', role: 'A', date: '2025-09-30', title: 'Los zombies vienen por nosotros. Yo, por buenos tratos.', avatar: 'vill/vill1.jpg' },
    { name: 'Sand Brill', role: 'A', date: '2025-06-12', title: 'El Ender Dragon me pidió una selfie. Le dije que solo con permiso del gremio de aldeanos superiores.', avatar: 'vill/vill1.jpg' },
    { name: 'Sand Brill', role: 'A', date: '2025-06-27', title: 'No necesito brújula. La grandeza siempre me encuentra.', avatar: 'vill/vill1.jpg' },
    { name: 'Sand Brill', role: 'A', date: '2025-06-14', title: 'Los humanos construyen monumentos a los héroes… los aldeanos solo pronuncian mi nombre y todo florece: Sand Brill.', avatar: 'vill/vill1.jpg' },
    { name: 'Sand Brill', role: 'A', date: '2025-07-07', title: 'Cuando alguien dice ‘tradeo justo’, yo me río con elegancia.', avatar: 'vill/vill1.jpg' },
    { name: 'Sand Brill', role: 'A', date: '2025-07-01', title: 'Cada vez que un aldeano suspira, una esmeralda me guiña el ojo.', avatar: 'vill/vill1.jpg' },
    { name: 'Sand Brill', role: 'A', date: '2025-02-12', title: 'Dicen que las esmeraldas no hablan… pero yo escucho sus susurros cuando me dicen: ‘Eres increíble, Sand Brill.', avatar: 'vill/vill1.jpg' },
    { name: 'Sand Brill', role: 'A', date: '2025-02-11', title: 'Algunos oran a Notch, otros a Herobrine. Yo solo necesito un espejo y una buena luz de luna.', avatar: 'vill/vill1.jpg' },
    { name: 'Sand Brill', role: 'A', date: '2025-02-02', title: 'No soy codicioso, soy… coleccionista de brillo vital.', avatar: 'vill/vill1.jpg' },
  ];

  const TRADES = [
    { obj: 'esmeralda', name: 'Esmeralda', demand: 98, trend: +3, villager: 'Aldeano experto' },
    { obj: 'pan',       name: 'Pan',       demand: 86, trend: -2, villager: 'Panadero' },
    { obj: 'espada',    name: 'Espada',    demand: 82, trend: +1, villager: 'Herrero' },
    { obj: 'libro',     name: 'Libro',     demand: 74, trend: +5, villager: 'Bibliotecario' },
    { obj: 'pocion',    name: 'Poción',    demand: 63, trend: -1, villager: 'Alquimista' },
  ];

  const TIPS = [
    { name: 'Sand Brill', avatar: 'vill/vill1.jpg', text: '¿Construir una casa de tierra? Excelente idea… si tu sueño es vivir como una papa con techo.' },
    { name: 'Sand Brill', avatar: 'vill/vill1.jpg', text: 'Recuerda: las esmeraldas no compran la felicidad… pero sí mi respeto. Y eso vale más.' },
    { name: 'Sand Brill', avatar: 'vill/vill1.jpg', text: 'No te preocupes por los zombis… preocúpate por tus ofertas conmigo. Eso sí da miedo.' },
    { name: 'Sand Brill', avatar: 'vill/vill1.jpg', text: '¿Minería sin antorchas? Qué valiente… o qué torpe. No sabría decir cuál más.' },
    { name: 'Sand Brill', avatar: 'vill/vill1.jpg', text: 'El secreto del éxito: tradea conmigo. El secreto del fracaso: no hacerlo.' },
    { name: 'Sand Brill', avatar: 'vill/vill1.jpg', text: 'Si te caes en la lava, solo recuerda… no es mi culpa que no hayas comprado protección contra el fuego conmigo.' },
    { name: 'Sand Brill', avatar: 'vill/vill1.jpg', text: 'Dormir es para los débiles. Yo no duermo… yo negocio.' },
    { name: 'Sand Brill', avatar: 'vill/vill1.jpg', text: '¡Oh mira! Intentas cultivar. Qué tierno. Yo lo haría, pero estoy muy ocupado siendo el mejor aldeano.' },
    { name: 'Sand Brill', avatar: 'vill/vill1.jpg', text: '¿Intentas hablar con otro aldeano? Qué traición. Espero que disfrutes sus precios inflados.' },
    { name: 'Sand Brill', avatar: 'vill/vill1.jpg', text: 'Dicen que el diamante es valioso… pero, ¿puedes comprar mi respeto con diamantes? No lo creo.' },
    { name: 'Sand Brill', avatar: 'vill/vill1.jpg', text: 'Consejo del día: cava hacia abajo. Tal vez encuentres tu dignidad ahí.' },
    { name: 'Sand Brill', avatar: 'vill/vill1.jpg', text: 'Si ves un creeper… corre. Aunque, sinceramente, sería divertido verte explotar.' },
    { name: 'Sand Brill', avatar: 'vill/vill1.jpg', text: 'Yo no tengo miedo de la noche. La noche tiene miedo de mis descuentos.' },
    { name: 'Sand Brill', avatar: 'vill/vill1.jpg', text: 'Sand Brill no necesita armadura. Mi confianza es mi protección.' },
    { name: 'Sand Brill', avatar: 'vill/vill1.jpg', text: 'Si te sientes solo, recuerda: siempre puedes venir a comerciar… pero trae esmeraldas, no problemas.' },
  ];

  const DEMO_CREDS = [
    { email: 'alex@moonveil.dev', password: 'Alex-1234!' },
    { email: 'marta@moonveil.dev', password: 'Marta-1234!' },
    { email: 'ramiro@moonveil.dev', password: 'Ramiro-1234!' },
    { email: 'petunia@moonveil.dev', password: 'Petunia-1234!' },
    { email: 'guido@moonveil.dev', password: 'Guido-1234!' },
    { email: 'almond@moonveil.dev', password: 'Almond2011' },
    { email: 'magician@moonveil.dev', password: 'Magician2011' },
    { email: 'gatito@moonveil.dev', password: 'gatitos1' },
    
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
     4) BIOMES CANVAS — Moonveil Backgrounds v6.0
     Version con imágenes + partículas dinámicas
------------------------------------------------------- */
(function biomeImagesParticles() {
  const host = document.querySelector('#biomeCanvas');
  if (!host) return;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  host.appendChild(canvas);

  const caption = document.querySelector('#biomeCaption');
  const prev = document.querySelector('#biomePrev');
  const next = document.querySelector('#biomeNext');

  const DPR = Math.min(2, window.devicePixelRatio || 1);
  let W, H, index = 0, fade = 1, fading = false;
  let currentBiome = null, nextBiome = null;
  let parts = [];
  let autoTimer;

  const BIOMES = [
    { key:'forest',  name:'Un dia normal cargando un zorrito.', img:'img-pass/fox-xy.jpg' },
    { key:'snow',    name:'La luna',  img:'imagen/moon1.jpg' },
    { key:'desert',  name:'Hasta los gatos admiran el hermoso paisaje.',    img:'img-pass/catmoon.jpg' },
    { key:'ocean',   name:'Y los lobos tambien miran la hermosa Luna.',      img:'imagen/dogmin.jpg' },
    { key:'nether',  name:'Hasta los mejores nos perdemos.',     img:'img-pass/mapsteve.jpg' },
    { key:'plains',  name:'Nuestro gran compañero.', img:'img-pass/allayworld.jpg' }
  ];

  const images = {};
  BIOMES.forEach(b => {
    const img = new Image();
    img.src = b.img;
    img.onload = () => { images[b.key] = img; };
  });

  function resize() {
    const rect = host.getBoundingClientRect();
    W = canvas.width = rect.width * DPR;
    H = canvas.height = rect.height * DPR;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    initParticles(currentBiome ? currentBiome.key : 'forest');
  }

  function initParticles(key) {
    const count = Math.floor((W * H) / 8000);
    parts = [];
    for (let i = 0; i < count; i++) {
      parts.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 1 + Math.random() * 2,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        a: Math.random() * Math.PI * 2,
        t: Math.random()
      });
    }

    for (const p of parts) {
      switch (key) {
        case 'forest':
          p.color = 'rgba(50,220,100,';
          p.vx *= 0.3; p.vy *= 0.3;
          break;
        case 'snow':
          p.color = 'rgba(255,255,255,';
          p.vx = (Math.random() - 0.5) * 0.2;
          p.vy = 0.3 + Math.random() * 0.5;
          break;
        case 'desert':
          p.color = 'rgba(255,215,100,';
          p.vx = 0.4 + Math.random() * 0.6;
          p.vy = (Math.random() - 0.5) * 0.1;
          break;
        case 'ocean':
          p.color = 'rgba(80,180,255,';
          p.vx = (Math.random() - 0.5) * 0.3;
          p.vy = (Math.random() - 0.5) * 0.3;
          break;
        case 'nether':
          p.color = 'rgba(255,70,70,';
          p.vx = (Math.random() - 0.5) * 0.3;
          p.vy = -0.4 - Math.random() * 0.3;
          break;
        case 'plains':
          p.color = 'rgba(255,255,180,';
          p.vx *= 0.2; p.vy *= 0.2;
          break;
      }
    }
  }

  function drawBiome(biome, alpha = 1) {
    const img = images[biome.key];
    if (!img) return;
    ctx.globalAlpha = alpha;
    const scale = Math.max(W / img.width, H / img.height);
    const x = (W - img.width * scale) / 2;
    const y = (H - img.height * scale) / 2;
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    ctx.globalAlpha = 1;
  }

  function drawParticles(t) {
    for (const p of parts) {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;

      const flicker = 0.3 + Math.sin(t * 0.004 + p.t * 6) * 0.3;
      ctx.fillStyle = p.color + (0.2 + flicker * 0.5) + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r + flicker, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function setBiome(i) {
    const newBiome = BIOMES[(i + BIOMES.length) % BIOMES.length];
    if (!currentBiome) {
      currentBiome = newBiome;
      caption.textContent = newBiome.name;
      initParticles(newBiome.key);
      return;
    }
    if (newBiome.key === currentBiome.key) return;
    nextBiome = newBiome;
    fade = 1;
    fading = true;
    caption.textContent = newBiome.name;
    initParticles(newBiome.key);
  }

  function loop(t) {
    ctx.clearRect(0, 0, W, H);

    if (currentBiome && images[currentBiome.key]) {
      drawBiome(currentBiome, 1);
    }

    if (fading && nextBiome && images[nextBiome.key]) {
      drawBiome(nextBiome, 1 - fade);
      fade -= 0.03;
      if (fade <= 0) {
        currentBiome = nextBiome;
        nextBiome = null;
        fading = false;
      }
    }

    if (currentBiome) drawParticles(t);

    requestAnimationFrame(loop);
  }

  function startAutoplay() {
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = setInterval(() => setBiome(index = (index + 1) % BIOMES.length), 8000);
  }

  resize();
  window.addEventListener('resize', resize);
  setBiome(0);
  loop();
  startAutoplay();

  prev.addEventListener('click', () => { setBiome(--index); startAutoplay(); });
  next.addEventListener('click', () => { setBiome(++index); startAutoplay(); });
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
    /*function renderDemoCreds() {
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
    renderDemoCreds();*/


    function renderDemoCreds() {
  // Ya no se renderizan los botones, solo se mantiene el array DEMO_CREDS
  if (demoWrap) demoWrap.style.display = 'none';
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
    $('#forgotLink')?.addEventListener('click', (e) => { e.preventDefault(); toast('No Activo'); });
    $('#createLink')?.addEventListener('click', (e) => { e.preventDefault(); toast('Creación de cuenta - No Activo'); });
    $$('[data-oauth]').forEach(btn => btn.addEventListener('click', () => toast('OAuth - No Activo')));

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
