/* loader.js - Moonveil professional loader
   - Inserta el loader en todas las páginas EXCEPTO index ("/" o index.html)
   - Controla animaciones, partículas (canvas) y la barra de progreso
   - Muestra consejos aleatorios de Sand Brill
   - Reproduce un "hmhmmm" de aldeano (opcional)
   - Permite "Omitir" (skip) la animación y limpiar correctamente
   ------------------------------------------------------------
   NOTAS:
   - Cambia `VILLAGER_SOUND_URL` si prefieres otra fuente
   - El loader intenta simular carga realista (preloads / fake steps)
   - Maneja errores por autoplay y políticas de audio
*/

/* --------------- CONFIG --------------- */
const VILLAGER_SOUND_URL = "";
/* 
  Nota: la URL usada arriba es un ejemplo público. Si prefieres subir tu propio audio, 
  colócalo en tu repo y cambia la constante: "./assets/sounds/villager.mp3"
*/

/* Sand Brill tips (user-approved style) */
const sandBrillTips = [
  "Si quieres algo, consíguelo… o mírame conseguirlo yo primero. Es más inspirador.",
  "No todos pueden brillar como una esmeralda. Pero oye, tú… puedes intentar no verte tan opaco.",
  "La perfección no es para todos. Por suerte yo ya nací así.",
  "Recuerda: si dudas, haz lo que yo haría. Si no sabes qué haría… simplemente elige la opción más brillante y obvia.",
  "Sí, claro, ignora mis consejos. Seguro que te va increíble sin mí. Como siempre… ¿verdad?",
  "Si no puedes alcanzar tus metas, al menos asegúrate de que yo pueda ver tu esfuerzo desde aquí arriba.",
  "No te preocupes, algún día todo te saldrá bien… estadísticamente… quizás…",
  "Tú sigue intentando. Me encanta ver a la gente esforzarse por cosas que yo haría en 30 segundos.",
  "Toma decisiones con cuidado… recuerda que siempre estoy observando si eliges bien.",
  "Aprende de tus errores. O mírame, que es más rápido.",
  "Acumula logros como yo acumulo esmeraldas. En silencio. Con paciencia. Y con una sonrisa que incomode.",
  "Nunca aceptes menos de lo que brilla. La vida es demasiado corta para minerales comunes.",
  "Si algo no vale esmeraldas… no vale tu tiempo.",
  "Yo no fallo. A veces hago pausas épicas.",
  "Tu sombra llegó antes que tú. Ya le pregunté a dónde vas.",
  "Si brillo demasiado, avísame. No quiero cegarte… todavía.",
  "No estás solo. Pero aún no decides si eso es bueno o malo.",
  "Si escuchas un aldeano cerca… quizás no sea un aldeano.",
  "No busques la salida. Ella te encontrará tarde o temprano.",
  "Las esmeraldas brillan. Yo también. Uno de los dos te está mirando ahora."
];

/* Simulated load steps (mensaje y duración aproximada en ms) */
const LOAD_STEPS = [
  { label: "Inicializando subsistemas", time: 520 },
  { label: "Cargando algunos textos", time: 760 },
  { label: "Restaurando...", time: 420 },
  { label: "Sincronizando...", time: 620 },
  { label: "Llamando a los aldeanos", time: 400 },
  { label: "Generando...", time: 980 },
  { label: "Aplicando....", time: 540 },
  { label: "Finalizando", time: 460 }
];

/* Exclude loader on index / root */
const isIndexPage = location.pathname.endsWith("/") || location.pathname.endsWith("/index.html") || location.pathname === "";
if (isIndexPage) {
  // do nothing if index
} else {
  /* --------------- Inject HTML (same markup as loader.html) --------------- */
  /* --------------- Inject HTML (loader con cubo) --------------- */
const loaderHTML = `
  <div id="moonveil-loader" aria-hidden="true" role="status" aria-label="Cargando Moonveil">
    <div class="mv-bg">
      <canvas id="mv-particles" class="mv-canvas" aria-hidden="true"></canvas>
      <div class="mv-layers">
        <div class="mv-layer mv-layer--far"></div>
        <div class="mv-layer mv-layer--mid"></div>
        <div class="mv-layer mv-layer--near"></div>
      </div>
    </div>

    <div class="mv-panel" role="dialog" aria-live="polite">
      <div class="mv-top">
        <!-- LOGO REEMPLAZADO: ahora tiene el cubito -->
        <div class="mv-logo" aria-hidden="true">
          <div class="mv-cube" aria-hidden="true"></div>
        </div>

        <div class="mv-title">
          <h2 class="mv-title__main">Moonveil</h2>
          <div class="mv-subtitle">Portal · Cargando experiencia</div>
        </div>
      </div>

      <div class="mv-body">
        <div class="mv-progress-wrap" aria-hidden="true">
          <div class="mv-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
            <div class="mv-progress-bar" id="mv-progress-bar"></div>
          </div>

          <div class="mv-progress-aux">
            <div class="mv-step" id="mv-step">Inicializando...</div>
            <div class="mv-percent" id="mv-percent">0%</div>
          </div>
        </div>

        <div class="mv-tip-wrap" aria-hidden="true">
          <div class="mv-tip-label">Consejo de Sand Brill</div>
          <div class="mv-tip" id="mv-tip">Preparando consejo...</div>
        </div>

        <div class="mv-footer-ui">
          <div class="mv-hud">
            <div class="mv-hud__slot mv-hud__emerald" title="Esmeraldas"></div>
            <div class="mv-hud__slot mv-hud__heart" title="Integridad"></div>
            <div class="mv-hud__slot mv-hud__clock" title="Tiempo"></div>
          </div>
          <div class="mv-cta">
            <button class="mv-btn mv-btn--ghost" id="mv-skip" aria-label="Omitir carga">Omitir</button>
          </div>
        </div>
      </div>
    </div>

    <div id="mv-live" class="sr-only" aria-live="polite" aria-atomic="true"></div>
  </div>`;


  document.body.insertAdjacentHTML('afterbegin', loaderHTML);

  /* ----------------- References ----------------- */
  const loaderEl = document.getElementById('moonveil-loader');
  const progressBar = document.getElementById('mv-progress-bar');
  const percentEl = document.getElementById('mv-percent');
  const stepEl = document.getElementById('mv-step');
  const tipEl = document.getElementById('mv-tip');
  const skipBtn = document.getElementById('mv-skip');
  const liveRegion = document.getElementById('mv-live');
  const canvas = document.getElementById('mv-particles');

  /* ----------------- Audio ----------------- */
  let villagerAudio = new Audio(VILLAGER_SOUND_URL);
  villagerAudio.preload = 'auto';
  villagerAudio.volume = 0.38;

  /* ----------------- Helper utilities ----------------- */
  function clamp(n, a = 0, b = 100) { return Math.max(a, Math.min(b, n)); }
  function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

  /* ----------------- Tip selection ----------------- */
  function pickTip(){
    const i = Math.floor(Math.random() * sandBrillTips.length);
    return sandBrillTips[i];
  }
  tipEl.textContent = pickTip();

  /* ----------------- Progress simulation ----------------- */
  async function simulateLoad(){
    // distribute percentages across steps
    const total = LOAD_STEPS.reduce((s, st) => s + st.time, 0);
    let acc = 0;
    let lastPercent = 0;
    for (let i = 0; i < LOAD_STEPS.length; i++){
      const st = LOAD_STEPS[i];
      stepEl.textContent = st.label;
      liveRegion.textContent = st.label;

      // animate progress for this step
      const startPercent = lastPercent;
      const portion = st.time / total;
      const endPercent = clamp(Math.round((startPercent + portion * 100)));
      const steps = Math.max(12, Math.round(st.time / 35));
      for (let s = 0; s <= steps; s++){
        const t = s / steps;
        // smooth ease
        const eased = Math.pow(t, 0.9);
        const curr = Math.round(startPercent + (endPercent - startPercent) * eased);
        updateProgress(curr);
        await sleep(st.time / steps);
      }
      lastPercent = endPercent;
      acc += st.time;
    }

    // final ramp
    for (let p = lastPercent; p <= 100; p++){
      updateProgress(p);
      await sleep(8 + Math.random() * 6);
    }
  }

  function updateProgress(n){
    const pct = clamp(n, 0, 100);
    progressBar.style.width = pct + "%";
    percentEl.textContent = pct + "%";
    progressBar.setAttribute('aria-valuenow', pct);
  }

  /* ----------------- Particles (simple performant) ----------------- */
  (function setupParticles() {
    const ctx = canvas.getContext('2d');
    let w = canvas.width = innerWidth;
    let h = canvas.height = innerHeight;
    const particles = [];
    const N = Math.max(28, Math.round((w*h) / 100000)); // density scales with screen
    const palette = [
      getComputedStyle(document.documentElement).getPropertyValue('--primary') || '#30d158',
      getComputedStyle(document.documentElement).getPropertyValue('--primary-2') || '#16a34a',
      getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#ffc43d',
      '#ffffff30'
    ];

    // create particles
    for (let i=0;i<N;i++){
      particles.push({
        x: Math.random()*w,
        y: Math.random()*h,
        vx: (Math.random()*0.6 - 0.25),
        vy: (Math.random()*0.4 - 0.05),
        r: Math.random()*1.8 + 0.4,
        c: palette[Math.floor(Math.random()*palette.length)],
        drift: Math.random()*0.8 + 0.2,
        alpha: Math.random()*0.6 + 0.08
      });
    }

    let last = performance.now();
    function resize(){
      w = canvas.width = innerWidth;
      h = canvas.height = innerHeight;
    }
    window.addEventListener('resize', resize);

    function step(now){
      const dt = Math.min(60, now - last) / 16.666;
      last = now;
      ctx.clearRect(0,0,w,h);

      // subtle gradient behind particles to enrich tone
      const g = ctx.createLinearGradient(0,0,0,h);
      g.addColorStop(0, 'rgba(2,6,3,0.06)');
      g.addColorStop(1, 'rgba(5,8,6,0.08)');
      ctx.fillStyle = g;
      ctx.fillRect(0,0,w,h);

      for (let p of particles){
        p.x += p.vx * dt * p.drift;
        p.y += p.vy * dt * p.drift;
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -30) p.y = h + 30;
        if (p.y > h + 30) p.y = -30;

        ctx.beginPath();
        ctx.fillStyle = p.c;
        ctx.globalAlpha = p.alpha;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  })();

  /* ----------------- Play villager sound once on open (if possible) ----------------- */
  function tryPlayAudio(){
    villagerAudio.play().catch(e => {
      // autoplay prevented; play on user gesture
      // attach a one-time handler to the skip button or document
      const onFirst = () => {
        villagerAudio.play().catch(()=>{});
        document.removeEventListener('click', onFirst);
      };
      document.addEventListener('click', onFirst, { once: true });
    });
  }

  /* ----------------- Skip & cleanup logic ----------------- */
  let finished = false;
  async function cleanupAndHide(){
    if (finished) return;
    finished = true;
    // set progress to 100 instantly
    updateProgress(100);
    percentEl.textContent = '100%';
    stepEl.textContent = 'Completado';
    liveRegion.textContent = 'Carga completada';
    // small visual pulse
    loaderEl.classList.add('mv-hide');
    try {
      // attempt to play final chime softly
      villagerAudio.currentTime = 0;
      villagerAudio.volume = 0.26;
      villagerAudio.play().catch(()=>{});
    } catch(e){}
    // remove element after transition
    setTimeout(() => {
      loaderEl.remove();
      // focus first focusable element on page for accessibility
      try {
        const af = document.querySelector('a, button, input, [tabindex]:not([tabindex="-1"])');
        if (af) af.focus();
      } catch(e){}
    }, 680);
  }

  skipBtn.addEventListener('click', () => {
    cleanupAndHide();
  });


  //esto se volvera activar mas adelante porfa... no olvidar              ---- Here!!!
  /* Also hide on history navigation or if page already loaded */
  /*window.addEventListener('pageshow', (e) => {
    if (document.readyState === 'complete') {
      cleanupAndHide();
    }
  });*/

  /* If page loads quickly, ensure we don't show long */
  let autoHideTimeout = setTimeout(() => {
    // if not completed after long time, let simulate still run but ensure it will finish
    // fallback cleanup after 14s
    cleanupAndHide();
  }, 14000);

  /* Trigger sequence */
  (async function main(){
    // try to play sound
    tryPlayAudio();

    // give tiny initial delay for visual polish
    await sleep(140);

    // animate a subtle "initial" percent to 6% quickly
    updateProgress(6);
    percentEl.textContent = '6%';

    // run the simulated load
    await simulateLoad();

    // small pause then cleanup
    await sleep(240);
    cleanupAndHide();
    clearTimeout(autoHideTimeout);
  })();

  /* ----------------- Accessibility: remove loader from accessibility tree after hide ----------------- */
  const observer = new MutationObserver((mutations) => {
    // not needed now; kept for future advanced behaviours
  });
  observer.observe(loaderEl, { attributes: true, childList: true, subtree: true });

  /* ----------------- end insertion block ----------------- */
}
