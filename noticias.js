'use strict';
/* ==============================================
   Moonveil — Noticias (JS)
   ============================================== */

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

/* ── Estado ── */
const state = {
  sec: 'all', cat: 'all', search: '', sort: 'date-desc',
  view: 'grid', page: 1, perPage: 9,
  read: new Set(),
};
const STORAGE_KEY = 'mv_news_read_v1';

/* ══════════════════════════════
   DATASET DE NOTICIAS
   ══════════════════════════════ */
const NEWS = [
  {
    id:'n1',
    title:'El Animal Sin Nombre',
    desc:'En la aldea, un grupo de aldeanos aseguró haber visto un extraño animal entre los árboles. Algunos dicen que no se ve nada cuando se acercan demasiado.',
    img:'img/cat-mine.jpg',
    mystery:false,
    date:'2025-08-29',
    author:'█████ █████',
    section:'A',
    categories:['biomas','exploración'],
    flags:{relevant:true, discovery:true, rumor:false},
    investigable:true,
  },
  {
    id:'n2',
    title:'Imágenes animadas en los registros',
    desc:'Como algunos archiveros ponen imágenes animadas en las noticias del reino, la pregunta que todos se hacen es: ¿por qué se mueven solas?',
    img:'',
    mystery:true,
    date:'2025-08-29',
    author:'?',
    section:'B',
    categories:['pueblos'],
    flags:{relevant:true, discovery:false, rumor:true},
    investigable:true,
  },
  {
    id:'n3',
    title:'Lo brillante y lo dorado',
    desc:'Se dice haber avistado un allay dorado sobrevolando los campos del este. Su ubicación exacta es desconocida y algunos dudan de su existencia.',
    img:'img/allay.png',
    mystery:false,
    date:'2025-08-15',
    author:'Orik Vall',
    section:'A',
    categories:['exploración'],
    flags:{relevant:true, discovery:false, rumor:false},
    investigable:true,
  },
  {
    id:'n4',
    title:'Aldeano cruzó fronteras',
    desc:'Este aldeano estuvo cuatro días nadando sin parar. Nadie sabe de dónde vino ni qué lo impulsó a cruzar el mar.',
    img:'img/villager.png',
    mystery:false,
    date:'2025-08-05',
    author:'Sev Ark',
    section:'B',
    categories:['biomas'],
    flags:{relevant:false, discovery:true, rumor:false},
    investigable:false,
  },
  {
    id:'n5',
    title:'¡Nuevas clases!',
    desc:'Les traemos nuevas clases disponibles para los habitantes. Ahora se puede hacer pociones avanzadas y más disciplinas mágicas.',
    img:'',
    mystery:true,
    date:'2025-08-27',
    author:'?',
    section:'B',
    categories:['magia','rumores'],
    flags:{relevant:false, discovery:false, rumor:true},
    investigable:false,
  },
  {
    id:'n6',
    title:'Debajo de Nosotros',
    desc:'Resulta que hemos vivido en una mentira. Debajo del suelo que pisamos hay una red de aldeas subterráneas completamente habitadas.',
    img:'img/newsmine.jpg',
    mystery:false,
    date:'2025-08-31',
    author:'S███',
    section:'A',
    categories:['pueblos','oficios'],
    flags:{relevant:true, discovery:false, rumor:false},
    investigable:true,
  },
  {
    id:'n7',
    title:'Peces en quiebra',
    desc:'Los ajolotes están atacando y desplazando a todos los peces del río. Los pescadores reportan pérdidas sin precedentes.',
    img:'img/ajolote.gif',
    mystery:false,
    date:'2025-08-17',
    author:'Nox Vire',
    section:'B',
    categories:['exploración','biomas'],
    flags:{relevant:false, discovery:true, rumor:false},
    investigable:true,
  },
  {
    id:'n8',
    title:'End o Nether: ¿Cuál primero?',
    desc:'Un debate antiguo resurge con fuerza: ¿los exploradores deben ir al Nether o al End primero? Teorías enfrentadas sacuden a los gremios.',
    img:'',
    mystery:true,
    date:'2025-08-11',
    author:'Konn Slate',
    section:'A',
    categories:['magia','exploración'],
    flags:{relevant:false, discovery:false, rumor:true},
    investigable:false,
  },
  {
    id:'n9',
    title:'Ranas por doquier',
    desc:'Hay ranas saltando por todos lados y están destrozando los cultivos. Los granjeros piden soluciones urgentes a los concejales del pueblo.',
    img:'img/frogs.gif',
    mystery:false,
    date:'2025-08-18',
    author:'Edson Villa',
    section:'A',
    categories:['pueblos','oficios'],
    flags:{relevant:true, discovery:false, rumor:false},
    investigable:true,
  },
  {
    id:'n10',
    title:'Nuevas Especies Registradas',
    desc:'Se han avistado variantes nunca antes vistas de animales conocidos. Los cronistas del reino ya trabajan en clasificarlas.',
    img:'img/cow-mine.gif',
    mystery:false,
    date:'2025-08-09',
    author:'Sev Ark',
    section:'B',
    categories:['exploración'],
    flags:{relevant:false, discovery:true, rumor:false},
    investigable:true,
  },
];

/* ── Persistencia de leídas ── */
function loadRead() {
  try { const d = JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]'); state.read = new Set(d); } catch(e) {}
}
function saveRead() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...state.read])); } catch(e) {}
}

/* ── Canvas fondo ── */
function setupCanvas() {
  const cv = $('#bgCanvas');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const dpr = Math.max(1, devicePixelRatio || 1);
  let w, h, pts;
  const init = () => {
    w = cv.width  = innerWidth  * dpr;
    h = cv.height = innerHeight * dpr;
    pts = Array.from({length:60}, () => ({
      x:Math.random()*w, y:Math.random()*h,
      r:(.3+Math.random()*1.2)*dpr,
      s:.15+Math.random()*.5,
      a:.04+Math.random()*.12,
      hue:180+Math.random()*30,
    }));
  };
  const draw = () => {
    ctx.clearRect(0,0,w,h);
    pts.forEach(p => {
      p.y -= p.s; p.x += Math.sin(p.y*.002)*0.3;
      if (p.y<-10){p.y=h+10;p.x=Math.random()*w;}
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`hsla(${p.hue},80%,60%,${p.a})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  };
  init(); draw(); addEventListener('resize', init);
}

/* ── Ticker ── */
function setupTicker() {
  const inner = $('#tickerInner');
  if (!inner) return;
  const titles = NEWS.map(n => `⬥ ${n.title}`).join('   ');
  inner.textContent = titles + '   ' + titles;
}

/* ── Reloj ── */
function setupClock() {
  const el = $('#heroClock');
  if (!el) return;
  const tick = () => {
    const now = new Date();
    const d = now.toLocaleDateString('es-PE', {weekday:'short',day:'2-digit',month:'short',year:'numeric'});
    const t = now.toLocaleTimeString('es-PE', {hour:'2-digit',minute:'2-digit',second:'2-digit'});
    el.innerHTML = `${d}<br/>${t}`;
  };
  tick(); setInterval(tick, 1000);
}

/* ── Stats hero ── */
function updateStats() {
  const total  = NEWS.length;
  const rel    = NEWS.filter(n=>n.flags.relevant).length;
  const inv    = NEWS.filter(n=>n.investigable).length;
  const read   = state.read.size;
  animN('stTotal', total); animN('stRel', rel);
  animN('stInv', inv); animN('stRead', read);
}
const _nt = {};
function animN(id, target) {
  const el = document.getElementById(id); if (!el) return;
  clearInterval(_nt[id]); let c=0;
  _nt[id]=setInterval(()=>{c=Math.min(c+Math.max(1,Math.ceil(target/30)),target);el.textContent=c;if(c>=target)clearInterval(_nt[id]);},25);
}

/* ── Filtrado ── */
function getFiltered() {
  let list = NEWS.filter(n => {
    const secOk = state.sec==='all'||(state.sec==='relevantes'&&n.flags.relevant)||(state.sec==='A'&&n.section==='A')||(state.sec==='B'&&n.section==='B')||(state.sec==='descubrimientos'&&n.flags.discovery)||(state.sec==='rumores'&&n.flags.rumor)||(state.sec==='investigables'&&n.investigable);
    const catOk = state.cat==='all'||n.categories.includes(state.cat);
    const q=state.search.toLowerCase();
    const txtOk=!q||`${n.title} ${n.desc} ${n.author} ${n.categories.join(' ')}`.toLowerCase().includes(q);
    return secOk&&catOk&&txtOk;
  });
  if (state.sort==='date-asc') list=list.slice().sort((a,b)=>new Date(a.date)-new Date(b.date));
  else if (state.sort==='date-desc') list=list.slice().sort((a,b)=>new Date(b.date)-new Date(a.date));
  else if (state.sort==='title') list=list.slice().sort((a,b)=>a.title.localeCompare(b.title));
  return list;
}

/* ── Render carrusel ── */
let carIdx=0, carPaused=false, carTimer=null, carItems=[];
function renderCarousel() {
  const track = $('#carTrack'); const dotsEl = $('#carDots');
  if (!track||!dotsEl) return;
  carItems = NEWS.filter(n=>n.flags.relevant);
  if (!carItems.length) { $('#carouselSec')&&($('#carouselSec').style.display='none'); return; }
  track.innerHTML = carItems.map(buildCarSlide).join('');
  dotsEl.innerHTML = carItems.map((_,i)=>`<button class="cdot${i===0?' active':''}" data-i="${i}"></button>`).join('');
  bindCarouselBtns(); updateCarCounter(); startCar();
}
function buildCarSlide(n) {
  const media = n.mystery||!n.img
    ? `<div class="car-img"><div class="car-img-placeholder">${n.mystery?'?':'📰'}</div></div>`
    : `<div class="car-img"><img src="${esc(n.img)}" alt="${esc(n.title)}" loading="lazy"/></div>`;
  const cats = n.categories.map(c=>`<span class="ccat">${esc(c)}</span>`).join('');
  const invBtn = n.investigable
    ? `<a class="btn-inv" href="invs.html?id=${n.id}" title="Investigar">⚗️ Investigar</a>`
    : `<button class="btn-inv" disabled>No investigable</button>`;
  return `<article class="car-slide${n.flags.relevant?' is-relevant':''}" data-id="${n.id}">
    ${media}
    <div class="car-body">
      <div class="car-cats">${cats}</div>
      <h3 class="car-title">${esc(n.title)}</h3>
      <p class="car-desc">${esc(n.desc)}</p>
      <div class="car-meta"><span>${fmtDate(n.date)}</span><span>Sec.${esc(n.section)}</span><span>${esc(n.author)}</span></div>
    </div>
    <div class="car-foot">
      <button class="btn-ver" data-open="${n.id}">Ver más</button>
      ${invBtn}
    </div>
  </article>`;
}
function bindCarouselBtns() {
  $$('#carTrack [data-open]').forEach(b=>b.addEventListener('click',()=>openModal(b.dataset.open)));
  $$('#carDots .cdot').forEach(d=>d.addEventListener('click',()=>{carIdx=+d.dataset.i;moveCar(0);setCarDots();}));
  $('#carPrev')?.addEventListener('click',()=>moveCar(-1));
  $('#carNext')?.addEventListener('click',()=>moveCar(1));
  $('#carPause')?.addEventListener('click',()=>{carPaused=!carPaused;$('#carPause').textContent=carPaused?'▶':'⏸';showToast(carPaused?'Carrusel pausado':'Carrusel reanudado');});
}
function moveCar(inc) {
  if (!carItems.length) return;
  carIdx=(carIdx+inc+carItems.length)%carItems.length;
  const track=$('#carTrack'); if (!track) return;
  const slide=track.children[carIdx];
  if (slide) slide.scrollIntoView({behavior:'smooth',block:'nearest',inline:'start'});
  setCarDots(); updateCarCounter();
}
function setCarDots() { $$('#carDots .cdot').forEach((d,i)=>d.classList.toggle('active',i===carIdx)); }
function updateCarCounter() { const el=$('#carIdx'); if(el)el.textContent=`${carIdx+1} / ${carItems.length}`; }
function startCar() { stopCar(); carTimer=setInterval(()=>{if(!carPaused)moveCar(1);},5000); }
function stopCar()  { if(carTimer)clearInterval(carTimer); }

/* ── Render grid ── */
function renderGrid(containerEl, items, showPagination=false) {
  if (!containerEl) return;
  if (!items.length) {
    containerEl.innerHTML=`<div class="grid-empty"><div class="grid-empty-ico">📋</div><h3>Sin resultados</h3><p>Ajusta los filtros o busca otro término</p></div>`;
    return;
  }
  let slice = items;
  if (showPagination) {
    const total=Math.ceil(items.length/state.perPage);
    if(state.page>total)state.page=Math.max(1,total);
    const s=(state.page-1)*state.perPage;
    slice=items.slice(s,s+state.perPage);
  }
  containerEl.innerHTML = slice.map((n,i)=>buildCard(n,i)).join('');
  containerEl.className=`news-grid view-${state.view}`;
  // Bind botones
  $$('[data-open]',containerEl).forEach(b=>b.addEventListener('click',()=>openModal(b.dataset.open)));
  $$('[data-inv]',containerEl).forEach(b=>{ if(!b.disabled) b.addEventListener('click',()=>goInvestigate(b.dataset.inv)); });
  if (showPagination) renderPag(Math.ceil(items.length/state.perPage));
}

function buildCard(n,idx) {
  const isRead = state.read.has(n.id);
  const delay  = `${idx*0.05}s`;
  const media  = n.mystery||!n.img
    ? `<div class="nc-img"><div class="nc-img-ph">${n.mystery?'🔮':'📰'}</div></div>`
    : `<div class="nc-img"><img src="${esc(n.img)}" alt="${esc(n.title)}" loading="lazy"/></div>`;
  const topBadge = n.flags.relevant?`<span class="nc-badge badge-rel">📌 HOT</span>`:(n.mystery?`<span class="nc-badge badge-mys">? MISTERIO</span>`:'');
  const disc  = n.flags.discovery?`<span class="nc-badge badge-disc">🔍</span>`:'';
  const rum   = n.flags.rumor?`<span class="nc-badge badge-rum">💬</span>`:'';
  const readB = isRead?`<span class="nc-badge badge-read">✓ LEÍDA</span>`:'';
  const cats  = n.categories.map(c=>`<span class="ncc">${esc(c)}</span>`).join('');
  const invBtn = n.investigable
    ? `<a class="btn-ver btn-inv" href="invs.html?id=${n.id}" style="text-decoration:none;display:inline-flex;align-items:center;justify-content:center;">⚗️ Investigar</a>`
    : '';
  return `<article class="ncard${n.flags.relevant?' is-relevant':''}${isRead?' is-read':''}${n.flags.rumor?' is-rumor':''}${n.flags.discovery?' is-discovery':''}"
    data-section="${esc(n.section)}" style="animation-delay:${delay}" data-id="${n.id}">
    ${media}
    <div class="nc-badges">
      <div style="display:flex;gap:5px">${topBadge}${disc}${rum}</div>
      <div style="display:flex;gap:5px">${readB}</div>
    </div>
    <div class="nc-body">
      <div class="nc-cats">${cats}</div>
      <h3 class="nc-title">${esc(n.title)}</h3>
      <p class="nc-desc">${esc(n.desc)}</p>
      <div class="nc-meta">
        <span>📅 ${fmtDate(n.date)}</span>
        <span>✍️ ${esc(n.author)}</span>
        <span>Sec.${esc(n.section)}</span>
      </div>
    </div>
    <div class="nc-foot">
      <button class="btn-ver" data-open="${n.id}">Ver más</button>
      ${invBtn}
    </div>
  </article>`;
}

function renderPag(total) {
  const wrap=$('#pagWrap'); if(!wrap) return;
  if(total<=1){wrap.innerHTML='';return;}
  const p=state.page;
  let html=`<button class="pgbtn" onclick="goPage(${p-1})" ${p===1?'disabled':''}>←</button>`;
  for(let i=1;i<=total;i++){
    if(i===1||i===total||Math.abs(i-p)<=1) html+=`<button class="pgbtn${i===p?' active':''}" onclick="goPage(${i})">${i}</button>`;
    else if(i===p-2||i===p+2) html+=`<span style="color:var(--dim);padding:0 4px">…</span>`;
  }
  html+=`<button class="pgbtn" onclick="goPage(${p+1})" ${p===total?'disabled':''}>→</button>`;
  wrap.innerHTML=html;
}
window.goPage = function(p){state.page=p;renderAll();window.scrollTo({top:0,behavior:'smooth'});};

/* ── Render ALL sections ── */
function renderAll() {
  const filtered = getFiltered();
  $('#resCount') && ($('#resCount').textContent=`${filtered.length} resultado${filtered.length!==1?'s':''}`);
  renderGrid($('#newsGrid'), filtered, true);
  renderGrid($('#gridA'), NEWS.filter(n=>n.section==='A').filter(applyBaseFilter));
  renderGrid($('#gridB'), NEWS.filter(n=>n.section==='B').filter(applyBaseFilter));
  renderGrid($('#gridDisc'), NEWS.filter(n=>n.flags.discovery).filter(applyBaseFilter));
  renderGrid($('#gridRumor'), NEWS.filter(n=>n.flags.rumor).filter(applyBaseFilter));
}
function applyBaseFilter(n) {
  const catOk=state.cat==='all'||n.categories.includes(state.cat);
  const q=state.search.toLowerCase();
  const txtOk=!q||`${n.title} ${n.desc} ${n.author}`.toLowerCase().includes(q);
  return catOk&&txtOk;
}

/* ── Modal detalle ── */
function openModal(id) {
  const n = NEWS.find(x=>x.id===id); if(!n) return;
  const panel=$('#mPanel'); const content=$('#mContent'); if(!panel||!content) return;
  // Marcar como leída
  state.read.add(id); saveRead(); updateStats();

  const media = n.mystery||!n.img
    ? `<div class="m-img"><div class="m-img-ph">${n.mystery?'🔮':'📰'}</div></div>`
    : `<div class="m-img"><img src="${esc(n.img)}" alt="${esc(n.title)}"/></div>`;
  const catTags = n.categories.map(c=>`<span class="m-stag" style="background:rgba(0,232,122,.1);border:1px solid rgba(0,232,122,.25);color:var(--green)">${esc(c)}</span>`).join('');
  const secTag  = `<span class="m-stag" style="background:rgba(255,179,0,.1);border:1px solid rgba(255,179,0,.3);color:var(--amber)">Sec. ${esc(n.section)}</span>`;
  const flags   = [n.flags.relevant&&'📌 Relevante',n.flags.discovery&&'🔍 Descubrimiento',n.flags.rumor&&'💬 Rumor'].filter(Boolean);

  const invLink = n.investigable
    ? `<a class="m-btn m-btn-inv" href="invs.html?id=${n.id}" style="text-decoration:none;display:inline-flex;align-items:center;justify-content:center;">⚗️ Investigar caso</a>`
    : `<button class="m-btn m-btn-inv" disabled style="opacity:.35;cursor:not-allowed">No investigable</button>`;

  content.innerHTML=`
    <div class="m-hero">${media}<div class="m-overlay"></div></div>
    <div class="m-head-info">
      <div class="m-section-tags">${secTag}${catTags}</div>
      <h2 class="m-title">${esc(n.title)}</h2>
      <div class="m-meta-row">
        <span>📅 ${fmtDate(n.date)}</span>
        <span>✍️ ${esc(n.author)}</span>
        <span>ID: ${esc(n.id)}</span>
      </div>
    </div>
    <div class="m-body">
      <p class="m-desc">${esc(n.desc)}</p>
      <div class="m-blocks-grid">
        <div class="m-block">
          <h4>Clasificación</h4>
          <ul>${flags.length?flags.map(f=>`<li>${f}</li>`).join(''):'<li>Sin clasificación especial</li>'}</ul>
        </div>
        <div class="m-block">
          <h4>Estado de investigación</h4>
          <p>${n.investigable?'✅ Este caso <strong>puede ser investigado</strong>. Accede a la sala de investigaciones para evaluar su veracidad.':'⛔ Este caso no está disponible para investigación.'}</p>
        </div>
        <div class="m-block" style="grid-column:1/-1">
          <h4>Contexto adicional</h4>
          <p>Archivo #${esc(n.id)} — Sección ${esc(n.section)}. Categorías: ${n.categories.map(esc).join(', ')}. Reportado por ${esc(n.author)} el ${fmtDate(n.date)}.</p>
        </div>
      </div>
      <div class="m-actions">
        ${invLink}
        <button class="m-btn m-btn-mark" id="mMarkBtn">${state.read.has(n.id)?'✓ Marcada como leída':'Marcar como leída'}</button>
        <button class="m-btn m-btn-primary" id="mCloseBtn">Cerrar</button>
      </div>
    </div>
  `;
  $('#mMarkBtn')?.addEventListener('click',()=>{state.read.add(n.id);saveRead();updateStats();showToast('Marcada como leída','success');renderAll();});
  $('#mCloseBtn')?.addEventListener('click',closeModal);
  const modal=$('#newsModal'); modal.classList.add('open'); modal.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
  renderAll(); // actualiza el punto de leída
}
function closeModal(){
  const m=$('#newsModal'); m.classList.remove('open'); m.setAttribute('aria-hidden','true');
  document.body.style.overflow='';
}

/* ── Investigar ── */
function goInvestigate(id) { window.location.href=`invs.html?id=${id}`; }

/* ── Navbar ── */
function setupNav() {
  const toggle=$('#navToggle'); const links=$('#navLinks');
  toggle?.addEventListener('click',e=>{e.stopPropagation();links?.classList.toggle('open');});
  document.addEventListener('click',e=>{if(!toggle?.contains(e.target)&&!links?.contains(e.target))links?.classList.remove('open');});
  $$('.hud-bar').forEach(b=>b.style.setProperty('--v',b.dataset.val||50));
}

/* ── Filtros ── */
function setupFilters() {
  let timer;
  $('#searchInput')?.addEventListener('input',e=>{clearTimeout(timer);timer=setTimeout(()=>{state.search=e.target.value.trim();state.page=1;renderAll();},250);});
  $('#chipSections')?.addEventListener('click',e=>{const b=e.target.closest('[data-sec]');if(!b)return;state.sec=b.dataset.sec;state.page=1;$$('#chipSections .nchip').forEach(c=>c.classList.remove('active'));b.classList.add('active');renderAll();});
  $('#chipCats')?.addEventListener('click',e=>{const b=e.target.closest('[data-cat]');if(!b)return;state.cat=b.dataset.cat;state.page=1;$$('#chipCats .nchip').forEach(c=>c.classList.remove('active'));b.classList.add('active');renderAll();});
  $('#sortSel')?.addEventListener('change',e=>{state.sort=e.target.value;state.page=1;renderAll();});
  $('#vGrid')?.addEventListener('click',()=>setView('grid'));
  $('#vList')?.addEventListener('click',()=>setView('list'));
  $('#vMag')?.addEventListener('click',()=>setView('mag'));
  function setView(v){state.view=v;$('#vGrid').classList.toggle('active',v==='grid');$('#vList').classList.toggle('active',v==='list');$('#vMag').classList.toggle('active',v==='mag');renderAll();}
}

/* ── Modal eventos ── */
function setupModal() {
  $('#mOverlay')?.addEventListener('click',closeModal);
  $('#mClose')?.addEventListener('click',closeModal);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
}

/* ── Parallax ── */
function setupParallax(){
  const layers=$$('.layer');
  const k=[0,.03,.06,.1];
  const fn=()=>layers.forEach((l,i)=>l.style.transform=`translateY(${scrollY*k[i]}px)`);
  fn(); addEventListener('scroll',fn,{passive:true});
}

/* ── Reveal ── */
function setupReveal(){
  const obs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');obs.unobserve(e.target);}}),{threshold:.07});
  $$('.reveal').forEach(el=>obs.observe(el));
}

/* ── Toast ── */
let toastT;
function showToast(msg,type='success'){
  const t=$('#toast');if(!t)return;
  t.textContent=msg;t.className=`toast ${type} show`;
  clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),2800);
}
window.showToast=showToast;

/* ── Helpers ── */
function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function fmtDate(iso){try{return new Intl.DateTimeFormat('es-PE',{year:'numeric',month:'short',day:'2-digit'}).format(new Date(iso));}catch{return iso;}}

/* ── Año ── */
$('#yr') && ($('#yr').textContent = new Date().getFullYear());

/* ── INIT ── */
document.addEventListener('DOMContentLoaded',()=>{
  loadRead();
  setupCanvas();
  setupTicker();
  setupClock();
  setupNav();
  setupFilters();
  setupModal();
  setupParallax();
  setupReveal();
  updateStats();
  renderCarousel();
  renderAll();
  console.log('📰 Moonveil Noticias — Cargado');
});