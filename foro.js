/* =========================================================
   Moonveil Portal — Foro (JS)
   - Navbar responsive + HUD
   - Partículas + Parallax
   - Dataset de hilos (12)
   - Render de tarjetas + quick comments
   - Filtros + búsqueda
   - Modal de lectura completa
   - Reveal on scroll + Toast
   ========================================================= */

const $ = (q, ctx=document)=>ctx.querySelector(q);
const $$ = (q, ctx=document)=>Array.from(ctx.querySelectorAll(q));

/* ---------- Navbar responsive ---------- */
const navToggle = $('#navToggle');
const navLinks = $('#navLinks');
navToggle?.addEventListener('click', ()=> navLinks.classList.toggle('open'));

/* ---------- HUD bars ---------- */
(function setHudBars(){
  $$('.hud-bar').forEach(b=>{
    const v = +b.dataset.val || 50;
    b.style.setProperty('--v', v);
  });
})();

/* ---------- Partículas (decor) ---------- */
(function particles(){
  const c = $('#bgParticles'); if(!c) return;
  const ctx = c.getContext('2d');
  const dpi = Math.max(1, window.devicePixelRatio||1);
  let w,h,p;

  function init(){
    w = c.width = innerWidth * dpi;
    h = c.height = innerHeight * dpi;
    p = new Array(80).fill(0).map(()=>({
      x:Math.random()*w,y:Math.random()*h,r:1+Math.random()*2*dpi,s:.25+Math.random()*1,a:.15+Math.random()*.35
    }));
  }
  function tick(){
    ctx.clearRect(0,0,w,h);
    p.forEach(o=>{
      o.y += o.s; o.x += Math.sin(o.y*0.002)*0.35;
      if(o.y>h){o.y=-10; o.x=Math.random()*w;}
      ctx.beginPath(); ctx.arc(o.x,o.y,o.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(135,243,157,${o.a})`; ctx.fill();
    });
    requestAnimationFrame(tick);
  }
  init(); tick(); addEventListener('resize', init);
})();

/* ---------- Parallax ---------- */
(function parallax(){
  const layers = $$('.layer'); if(!layers.length) return;
  const k = [0, .03, .06, .1];
  const onScroll=()=>{
    const y = scrollY||0;
    layers.forEach((el,i)=> el.style.transform = `translateY(${y*k[i]}px)`);
  };
  onScroll(); addEventListener('scroll', onScroll, {passive:true});
})();

/* =========================================================
   DATASET — 12 hilos
   Campos:
   id, title, author, date (ISO), cover (img opcional), mystery(bool),
   excerpt, tags[], featured(bool), comments[{author, avatar?, text, date}]
   ========================================================= */
const threads = [
  {
    id:'t1',
    title:'El animal sin nombre',
    author:'█████████',
    date:'2025-08-29',
    cover:'img/cat-mine.jpg',
    mystery:false,
    featured:true,
    excerpt:'En la aldea, un grupo de aldeanos aseguró haber visto un extraño animal entre los arboles y algunos dicen que no se ve nada.',
    tags:['biomas','exploración'],
    comments:[
      {author:'Sand Brill', text:'Pues yo lo que veo nada porque estoy ciego...O un gato...', date:'2025-08-30'},
      {author:'Eduard Moss', text:'Donde ves un gato. Tu estas un poco mal creo.', date:'2025-08-30'},
      {author:'Sand Brill', text:'Como que mal, ahi se ve el gato. Necesitas lentes.', date:'2025-08-30'},
      {author:'Autor⁂', text:'Quien sabe, pero la verdad ni yo se, si es un gato...', date:'2025-08-31'},
      {author:'Nox Vire', text:'Solo veo un pedazo de verde en la imagen...', date:'2025-09-01'},
      {author:'Orik Vall', text:'Bueno, ni idea que miran, pero veo un bonito lugar para comer, ¡Yumm!', date:'2025-08-30'}
    ]
  },
  {
    id:'t2',
    title:'¡Nuevas clases!',
    author:'?',
    date:'2025-08-27',
    cover:'',
    mystery:true,
    featured:false,
    excerpt:'Les traemos nuevas clases. Ahora se puede hacer pociones y mas...',
    tags:['rumor'],
    comments:[
      {author:'Sev Ark', text:'Como...', date:'2025-08-28'},
      {author:'Sand Brill', text:'Comiendo...😹', date:'2025-08-28'},
      {author:'Orik Vall', text:'😹', date:'2025-08-29'},
      {author:'Eduard Moss', text:'😸', date:'2025-08-29'},
      {author:'Konn Slate', text:'No gracias.', date:'2025-08-30'},
      {author:'Autor⁂', text:'¡Gracias por unirte a nosotros Konn Slate!', date:'2025-08-31'}
    ]
  },
  {
    id:'t3',
    title:'Lo brillante y lo dorado',
    author:'Orik Vall',
    date:'2025-08-15',
    cover:'img/allay.png',
    mystery:false,
    featured:true,
    excerpt:'Se dice avistar un allay dorado. Pero su ubicacion es desconocida.',
    tags:['taller'],
    comments:[
      {author:'Edd Vall', text:'Muy bonito.', date:'2025-08-16'},
      {author:'Sand Brill', text:'Quiero uno, donde se consige.', date:'2025-08-26'},
      {author:'Sev Ark', text:'La verdad, esta bonito, pero que paso...', date:'2025-08-26'},
      {author:'Konn Slate', text:'Que paso con el titulo, no va con lo que dice...', date:'2025-08-30'}
    ]
  },
  {
    id:'t4',
    title:'Aldeano, cruzo fronteras',
    author:'Sev Ark',
    date:'2025-08-05',
    cover:'img/villager.png',
    mystery:false,
    featured:false,
    excerpt:'Este aldeano estuvo 4 dias nadando, pero no se sabe de donde vino.',
    tags:['exploración'],
    comments:[
      {author:'Konn Slate', text:'Vino de mi casa, pero se escapo.😹', date:'2025-08-14'},
      {author:'Mira Flint', text:'Hermosas tomas. ¿Supongo?', date:'2025-08-24'},
      {author:'Konn Slate', text:'😹', date:'2025-08-28'},
    ]
  },
  {
    id:'t5',
    title:'Debajo de Nosotros',
    author:'S███',
    date:'2025-08-31',
    cover:'img/newsmine.jpg',
    mystery:false,
    featured:true,
    excerpt:'Resulta que estuvimos en una mentira...Resulta que debajo de nosotros hay aldeanos.',
    tags:['pueblos'],
    comments:[
      {author:'Sand Brill', text:'Esta es la mejor noticia de todas, a que si.', date:'2025-09-01'},
      {author:'Edd Vall', text:'Y que deberia ver...', date:'2025-09-04'},
      {author:'Konn Slate', text:'El Sand tas bien, porque es un periodico nada mas...', date:'2025-09-06'},
      {author:'Eduard Moss', text:'La verdad siento que lo que dices es falso, perdon pero esta es mi postura.', date:'2025-09-09'},
      {author:'Sand Brill', text:'Como se atreven a decir esto, es muy real, pero sin pruebas.', date:'2025-09-10'},
      {author:'Autor⁂', text:'Exacto mi querido Sand Brill, se que es la mejor, pero le tienen envidia, es eso.', date:'2025-09-11'}
    ]
  },
  {
    id:'t6',
    title:'Peces en quiebra',
    author:'Nox Vire',
    date:'2025-08-17',
    cover:'img/ajolote.gif',
    mystery:false,
    featured:false,
    excerpt:'Los ajolotes estan matando a todos nuestros peces, debemos hacer algo.',
    tags:['biomas','fauna'],
    comments:[
      {author:'Kevin Dew', text:'Son tan monos...Que si no los quieren, yo los quiero.', date:'2025-08-22'},
      {author:'Sand Brill', text:'Si son hermosos, pero y de los peces nadie se preocupa.', date:'2025-08-24'},
      {author:'Edd Vall', text:'Los peces, pues a mi me da igual.', date:'2025-08-26'},
      {author:'Eduard Moss', text:'Pues despues quien comercia con los pescadores.😿', date:'2025-08-27'},
      {author:'Sev Ark', text:'Pues quien comercia con el pescador.', date:'2025-08-28'},
      {author:'Pescador?', text:'Como!Que nadie comercia con nosotros, pues somos los #1 de tradeados.', date:'2025-08-28'},
      {author:'Autor⁂', text:'Si ustedes lo dicen, pues sera.😹', date:'2025-08-28'}
    ]
  },
  {
    id:'t7',
    title:'End?',
    author:'Konn Slate',
    date:'2025-08-11',
    cover:'',
    mystery:true,
    featured:false,
    excerpt:'¿Nether o End?',
    tags:['magia','ruinas','rumor'],
    comments:[
      {author:'Orik Vall', text:'Me suena a interferencia, pero suena.', date:'2025-08-20'},
      {author:'█████████', text:'Interesante', date:'2025-08-21'},
      {author:'Sand Brill', text:'Verdad que es interesante...', date:'2025-08-21'},
      {author:'Kevin Dew', text:'End', date:'2025-08-23'},
      {author:'Edson Villa', text:'Ok.', date:'2025-08-26'}
    ]
  },
  {
    id:'t8',
    title:'Ranas por doquier',
    author:'Edson Villa',
    date:'2025-08-18',
    cover:'img/frogs.gif',
    mystery:false,
    featured:true,
    excerpt:'Hay ranas saltando por todos lados, y malogran nuestros cultivos.',
    tags:['biomas','fauna'],
    comments:[
      {author:'Mira Flint', text:'¡Increible!', date:'2025-09-01'},
      {author:'Sand Brill', text:'Miren como me muevo, soy el rey de la pista.', date:'2025-09-04'},
      {author:'Nox Vire', text:'Salta y salta.', date:'2025-09-06'},
      {author:'Eduard Moss', text:'Se mueve el Sand como las serpientes.', date:'2025-09-06'},
      {author:'Autor⁂', text:'Pues si da ganas de bailar...Pero y mis cultivos.😿', date:'2025-09-08'}
    ]
  },
  {
    id:'t9',
    title:'Nuevas Especies',
    author:'Sev Ark',
    date:'2025-08-09',
    cover:'img/cow-mine.gif',
    mystery:false,
    featured:false,
    excerpt:'Se dice que hay nuevas especies de animales, bueno mas bien variantes.Como habran aparecido.',
    tags:['biomas'],
    comments:[
      {author:'Eduard Moss', text:'Nuevas Especies¡Yey!', date:'2025-08-18'},
      {author:'Sand Brill', text:'Oh guau...Que mas.', date:'2025-08-19'},
      {author:'Nox Vire', text:'Que bonita vaca o toro.', date:'2025-08-20'},
      {author:'Kevin Dew', text:'Rojo.', date:'2025-08-22'},
      {author:'German Moon', text:'😸', date:'2025-08-22'}
    ]
  }
];

/* =========================================================
   Selectores
   ========================================================= */
const list = $('#foroList');
const chipType = $('#chipType');
const searchInput = $('#searchInput');
const clearSearch = $('#clearSearch');

const wThreads = $('#wThreads');
const wComments = $('#wComments');
const wFeatured = $('#wFeatured');

const modal = $('#foroModal');
const modalOverlay = $('#modalOverlay');
const modalClose = $('#modalClose');
const modalTitle = $('#modalTitle');
const modalBody = $('#modalBody');
const modalAction = $('#modalAction');

/* =========================================================
   Estado
   ========================================================= */
let filterType = 'all'; // all | destacados | misterio | recientes
let q = '';

/* =========================================================
   Init
   ========================================================= */
document.addEventListener('DOMContentLoaded', ()=>{
  renderStats();
  renderList();
  observeReveal();
});

/* =========================================================
   Render: estadísticas del hero
   ========================================================= */
function renderStats(){
  const totalThreads = threads.length;
  const totalComments = threads.reduce((acc,t)=> acc + t.comments.length, 0);
  const totalFeatured = threads.filter(t=> t.featured).length;

  wThreads.textContent = totalThreads;
  wComments.textContent = totalComments;
  wFeatured.textContent = totalFeatured;
}

/* =========================================================
   Render: lista de hilos
   ========================================================= */
function renderList(){
  const items = threads
    .filter(m => {
      if (filterType==='destacados') return m.featured;
      if (filterType==='misterio') return m.mystery;
      if (filterType==='recientes') return true; // se ordenan abajo
      return true;
    })
    .filter(m => {
      if (!q) return true;
      const txt = `${m.title} ${m.author} ${m.excerpt} ${m.tags.join(' ')}`.toLowerCase();
      return txt.includes(q);
    })
    .sort((a,b)=>{
      if (filterType==='recientes') return new Date(b.date) - new Date(a.date);
      // por defecto: destacados arriba, luego fecha
      if (a.featured !== b.featured) return a.featured? -1 : 1;
      return new Date(b.date) - new Date(a.date);
    });

  list.innerHTML = items.map(threadCard).join('') || emptyBlock('No hay hilos para mostrar.');

  // Eventos por tarjeta
  $$('.btn-read').forEach(btn=>{
    btn.addEventListener('click', ()=> openModal(btn.dataset.id));
  });
  $$('.btn-quick').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const box = btn.closest('.thread').querySelector('.thread__quick');
      box.classList.toggle('show');
      btn.textContent = box.classList.contains('show') ? 'Ocultar' : 'Ver comentarios';
    });
  });
}

function threadCard(m){
  const gold = m.featured ? 'gold' : '';
  const media = m.mystery
    ? `<div class="thread__media mystery" aria-label="Imagen misteriosa">?</div>`
    : `<div class="thread__media"><img src="${escape(m.cover||'')}" alt="Portada del hilo: ${escape(m.title)}" loading="lazy"></div>`;
  const tags = m.tags.map(t=> `<span class="tag">#${escape(t)}</span>`).join('');
  const quick = m.comments.slice(0,2).map(c=> quickItem(c)).join('');

  return `
  <article class="thread ${gold} reveal">
    ${media}
    <div class="thread__body">
      <h3 class="thread__title">${escape(m.title)}</h3>
      <div class="thread__meta"><span>${fmtDate(m.date)}</span> · <span>por ${escape(m.author)}</span></div>
      <p class="thread__desc">${escape(m.excerpt)}</p>
    </div>
    <div class="thread__foot">
      <div class="thread__tags">${tags}</div>
      <div class="thread__actions">
        <button class="btn-sm btn-quick" type="button">Ver comentarios</button>
        <button class="btn-sm btn-read" type="button" data-id="${m.id}">Leer</button>
      </div>
    </div>
    <div class="thread__quick" aria-live="polite">
      ${quick || '<span class="muted">Sin comentarios aún.</span>'}
    </div>
  </article>`;
}

function quickItem(c){
  return `
  <div class="quick-item">
    <div class="avatar" aria-hidden="true"></div>
    <div class="q-body">
      <div class="q-name">${escape(c.author)} <span class="muted">· ${fmtDate(c.date)}</span></div>
      <div class="q-text">${escape(c.text)}</div>
    </div>
  </div>`;
}

function emptyBlock(text){
  return `<div class="thread" style="grid-column:1/-1"><div class="thread__body"><p class="muted">${escape(text)}</p></div></div>`;
}

/* =========================================================
   Filtros + búsqueda
   ========================================================= */
chipType.addEventListener('click', e=>{
  const btn = e.target.closest('.chip'); if(!btn) return;
  $$('.chip', chipType).forEach(c=> c.classList.remove('is-on'));
  btn.classList.add('is-on');
  filterType = btn.dataset.type;
  renderList();
  toast(`Filtro: ${filterType}`);
});

searchInput.addEventListener('input', ()=>{
  q = (searchInput.value||'').trim().toLowerCase();
  renderList();
});
clearSearch.addEventListener('click', ()=>{
  searchInput.value=''; q=''; renderList();
});

/* =========================================================
   Modal de lectura
   ========================================================= */
function openModal(id){
  const m = threads.find(x=> x.id===id); if(!m) return;
  modalTitle.textContent = m.title;

  const media = m.mystery
    ? `<div class="media mystery">?</div>`
    : `<div class="media"><img src="${escape(m.cover||'')}" alt="Portada de ${escape(m.title)}"></div>`;

  const posts = [
    {author:m.author, date:m.date, text:m.excerpt, isOP:true},
    ...m.comments
  ];

  modalBody.innerHTML = `
    <div class="modal-hero">
      ${media}
      <div class="info">
        <h3>${escape(m.title)}</h3>
        <div class="meta"><span>${fmtDate(m.date)}</span> · <span>por ${escape(m.author)}</span></div>
        <div class="tags" style="margin-top:6px">${m.tags.map(t=>`<span class="tag">#${escape(t)}</span>`).join('')}</div>
      </div>
    </div>
    <div class="modal-thread">
      ${posts.map(p=> modalPost(p)).join('')}
    </div>
  `;

  modal.classList.add('show');
  modal.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';

  modalAction.onclick = ()=>{ toast('Marcado como leído'); closeModal(); };
}

function modalPost(p){
  return `
  <article class="post">
    <div class="avatar" aria-hidden="true"></div>
    <div class="p-body">
      <div class="meta">${p.isOP ? '<strong>OP</strong> · ' : ''}${escape(p.author)} · ${fmtDate(p.date)}</div>
      <div class="text">${escape(p.text)}</div>
    </div>
  </article>`;
}

function closeModal(){
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden','true');
  document.body.style.overflow='';
}
modalOverlay.addEventListener('click', closeModal);
modalClose.addEventListener('click', closeModal);
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeModal(); });

/* =========================================================
   Reveal on scroll + Toast
   ========================================================= */
let revealObs;
function observeReveal(){
  if (revealObs) revealObs.disconnect();
  revealObs = new IntersectionObserver((entries)=>{
    entries.forEach(ent=>{
      if (ent.isIntersecting){
        ent.target.classList.add('is-in');
        revealObs.unobserve(ent.target);
      }
    });
  },{threshold:.15});
  $$('.reveal').forEach(el=>revealObs.observe(el));
}
function toast(msg){
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._id);
  t._id = setTimeout(()=> t.classList.remove('show'), 1400);
}

/* =========================================================
   Helpers
   ========================================================= */
function escape(s){return String(s??'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function fmtDate(iso){
  try{
    const d = new Date(iso);
    return new Intl.DateTimeFormat('es-PE',{year:'numeric',month:'short',day:'2-digit'}).format(d);
  }catch{return iso}
}







// ---------- Música de fondo ----------
const audio = document.getElementById("bg-music");
const musicButton = document.querySelector(".floating-music");

// Asegúrate de que el botón y el audio existan
if (audio && musicButton) {
  // Alternar música al hacer clic
  musicButton.addEventListener("click", () => {
    if (audio.paused) {
      audio.play().then(() => {
        musicButton.classList.add("active");
        localStorage.setItem("music", "on");
      }).catch(err => {
        console.warn("No se pudo reproducir la música:", err);
      });
    } else {
      audio.pause();
      musicButton.classList.remove("active");
      localStorage.setItem("music", "off");
    }
  });

  // Revisar estado al cargar
  window.addEventListener("DOMContentLoaded", () => {
    const musicState = localStorage.getItem("music");
    if (musicState === "on") {
      // Solo reproducir si el usuario ya interactuó antes
      audio.play().then(() => {
        musicButton.classList.add("active");
      }).catch(() => {
        console.log("Esperando interacción del usuario para reproducir.");
      });
    }
  });
}










