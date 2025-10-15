/* =========================================================
   Moonveil Portal — JS: Ranking Épico
   - Navbar responsive + HUD
   - Partículas + parallax
   - Render dinámico de 10 tablas de ranking
   - Ordenar por columna, resaltar top 1/2/3
   - Refresco simulado (intervalo) + botones (pausar/reanudar)
   - Censurado con animación
   - Reveal on scroll + toasts
   ========================================================= */

const $ = (q, ctx = document) => ctx.querySelector(q);
const $$ = (q, ctx = document) => Array.from(ctx.querySelectorAll(q));

/* ---------- Navbar responsive ---------- */
const navToggle = $('#navToggle');
const navLinks = $('#navLinks');
navToggle?.addEventListener('click', ()=> navLinks.classList.toggle('open'));

/* ---------- Año footer ---------- */
$('#y').textContent = new Date().getFullYear();

/* ---------- HUD ---------- */
(function setHudBars(){
  $$('.hud-bar').forEach(b=>{
    const v = +b.dataset.val || 50;
    b.style.setProperty('--v', v);
  });
})();

/* ---------- Partículas ---------- */
(function particles(){
  const c = $('#bgParticles');
  if (!c) return;
  const ctx = c.getContext('2d');
  const dpi = Math.max(1, window.devicePixelRatio || 1);
  let w, h, parts;

  const init = () => {
    w = c.width = innerWidth * dpi;
    h = c.height = innerHeight * dpi;
    parts = new Array(90).fill(0).map(() => ({
      x: Math.random()*w, y: Math.random()*h,
      r: 1 + Math.random()*2*dpi,
      s: .25 + Math.random()*1.1,
      a: .15 + Math.random()*.35
    }));
  };

  const tick = () => {
    ctx.clearRect(0,0,w,h);
    parts.forEach(p=>{
      p.y += p.s; p.x += Math.sin(p.y*0.002)*0.35;
      if (p.y > h) { p.y = -10; p.x = Math.random()*w; }
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle = `rgba(135,243,157,${p.a})`;
      ctx.fill();
    });
    requestAnimationFrame(tick);
  };

  init(); tick();
  addEventListener('resize', init);
})();

/* ---------- Parallax ---------- */
(function parallax(){
  const layers = $$('.layer');
  if (!layers.length) return;
  const k = [0, 0.03, 0.06, 0.1];
  const onScroll = () => {
    const y = scrollY || 0;
    layers.forEach((el, i) => el.style.transform = `translateY(${y*k[i]}px)`);
  };
  onScroll();
  addEventListener('scroll', onScroll, { passive:true });
})();

/* =========================================================
   Datos de ranking (semilla)
   Cada item: { name, cat, val, trend }
   - val: número base
   - trend: número (- / +) que se mostrará con flecha/estado
   ========================================================= */

const DATA = {
  foodSold: [
    {name:'Pan crujiente', cat:'Horno', val: 1280, trend:+12},
    {name:'Sopa de champiñón', cat:'Caldo', val: 980, trend:-8},
    {name:'Tarta de calabaza', cat:'Repostería', val: 860, trend:+4},
    {name:'Filete asado', cat:'Proteína', val: 790, trend:+6},
    {name:'Galleta', cat:'Dulce', val: 720, trend:+2},
    {name:'Zanahoria', cat:'Huerto', val: 610, trend:-3},
    {name:'Patata cocida', cat:'Huerto', val: 580, trend:+8},
    {name:'Remolacha', cat:'Huerto', val: 540, trend:-4},
    {name:'Pastel', cat:'Repostería', val: 520, trend:+3},
    {name:'Estofado de conejo', cat:'Caldo', val: 480, trend:+1},
  ],
  weaponUsed: [
    {name:'Espada de diamante', cat:'Cuerpo a cuerpo', val: 3400, trend:+14},
    {name:'Arco', cat:'A distancia', val: 2890, trend:+3},
    {name:'Tridente', cat:'Especial', val: 1500, trend:-6},
    {name:'Ballesta', cat:'A distancia', val: 1330, trend:+5},
    {name:'Hacha de netherita', cat:'Cuerpo a cuerpo', val: 1120, trend:+7},
    {name:'Espada de hierro', cat:'Cuerpo a cuerpo', val: 980, trend:-2},
    {name:'Poción lanzable', cat:'Alquimia', val: 810, trend:+4},
    {name:'Dagas talladas', cat:'Cuerpo a cuerpo', val: 700, trend:+2},
    {name:'Caña con anzuelo', cat:'Truco', val: 420, trend:-1},
    {name:'Varita canalizadora', cat:'Especial', val: 350, trend:+1},
  ],
  mobKilled: [
    {name:'Zombi', cat:'Pradera', val: 5400, trend:+28},
    {name:'Esqueleto', cat:'Bosque', val: 4980, trend:+13},
    {name:'Creeper', cat:'Bosque', val: 4680, trend:-7},
    {name:'Araña', cat:'Cueva', val: 3990, trend:+9},
    {name:'Enderman', cat:'Llanuras', val: 2210, trend:+2},
    {name:'Bruja', cat:'Pantano', val: 1440, trend:-3},
    {name:'Ahogado', cat:'Costa', val: 1200, trend:+4},
    {name:'Slime', cat:'Pantano', val: 980, trend:+1},
    {name:'Guardia', cat:'Océano', val: 720, trend:-2},
    {name:'Pícaro', cat:'Pueblo', val: 510, trend:+1},
  ],
  foodEaten: [
    {name:'Manzana', cat:'Fruta', val: 2100, trend:+6},
    {name:'Pan', cat:'Cereal', val: 1990, trend:+4},
    {name:'Baya dulce', cat:'Baya', val: 1650, trend:+3},
    {name:'Patata cocida', cat:'Tubérculo', val: 1600, trend:+5},
    {name:'Guiso de remolacha', cat:'Caldo', val: 1290, trend:-2},
    {name:'Tarta de calabaza', cat:'Postre', val: 1250, trend:+1},
    {name:'Carne asada', cat:'Proteína', val: 1200, trend:+2},
    {name:'Galleta', cat:'Dulce', val: 1100, trend:+1},
    {name:'Zanahoria', cat:'Huerto', val: 1000, trend:-3},
    {name:'Pastel', cat:'Postre', val: 820, trend:+2},
  ],
  villagerTraded: [
    {name:'Sand Brill', cat:'Cantero', val: 620, trend:+8},
    {name:'Mira Flint', cat:'Cartógrafa', val: 590, trend:+5},
    {name:'Orik Vale', cat:'Herrero', val: 565, trend:+3},
    {name:'Yara Dew', cat:'Artesana', val: 520, trend:+4},
    {name:'Rhea Moss', cat:'Alquimista', val: 510, trend:-1},
    {name:'Brun Tallow', cat:'Guardián', val: 480, trend:+2},
    {name:'Ena Vale', cat:'Aprendiz', val: 440, trend:+1},
    {name:'Sev Ark', cat:'Rastreador', val: 410, trend:+6},
    {name:'Konn Slate', cat:'Centinela', val: 380, trend:+2},
    {name:'Nox Vire', cat:'Espía', val: 330, trend:-3},
  ],
  toolWorn: [
    {name:'Pico de diamante', cat:'Diamante', val: 4300, trend:+10},
    {name:'Hacha de hierro', cat:'Hierro', val: 3120, trend:+6},
    {name:'Pala de netherita', cat:'Netherita', val: 2800, trend:+4},
    {name:'Azada de madera', cat:'Madera', val: 1990, trend:-3},
    {name:'Pico de piedra', cat:'Piedra', val: 1800, trend:+1},
    {name:'Hacha de diamante', cat:'Diamante', val: 1600, trend:+2},
    {name:'Pala de hierro', cat:'Hierro', val: 1390, trend:+1},
    {name:'Azada de oro', cat:'Oro', val: 1250, trend:-2},
    {name:'Cizallas', cat:'Acero', val: 900, trend:+2},
    {name:'Martillo rúnico', cat:'Épico', val: 620, trend:+1},
  ],
  structureVisited: [
    {name:'Fortaleza del Nether', cat:'Nether', val: 720, trend:+9},
    {name:'Templo del desierto', cat:'Desierto', val: 690, trend:+4},
    {name:'Mansión del bosque', cat:'Bosque', val: 620, trend:+3},
    {name:'Monumento oceánico', cat:'Océano', val: 580, trend:+2},
    {name:'Pueblo', cat:'Llanuras', val: 550, trend:+1},
    {name:'Ciudad antigua', cat:'Cueva', val: 520, trend:-2},
    {name:'Iglú', cat:'Nevado', val: 480, trend:+1},
    {name:'Portal en ruinas', cat:'Mixto', val: 455, trend:+2},
    {name:'Bastión', cat:'Nether', val: 430, trend:-1},
    {name:'Barco hundido', cat:'Océano', val: 400, trend:+2},
  ],
  oreMined: [
    {name:'Carbón', cat:'Y 96–136', val: 9600, trend:+11},
    {name:'Hierro', cat:'Y -24–56', val: 8100, trend:+7},
    {name:'Cobre', cat:'Y 0–96', val: 7400, trend:+5},
    {name:'Redstone', cat:'Y -64–16', val: 6900, trend:+3},
    {name:'Oro', cat:'Y -64–32', val: 5200, trend:+4},
    {name:'Lapis', cat:'Y -32–32', val: 4200, trend:+2},
    {name:'Diamante', cat:'Y -64–16', val: 3500, trend:+6},
    {name:'Esmeralda', cat:'Y -16–256', val: 1900, trend:+1},
    {name:'Cuarzo (Nether)', cat:'Nether', val: 1500, trend:-2},
    {name:'Netherita', cat:'Y 8–22', val: 420, trend:+1},
  ],
  bookPopular: [
    {name:'Eficiencia', cat:'IV', val: 2100, trend:+8},
    {name:'Irrompibilidad', cat:'III', val: 1980, trend:+6},
    {name:'Fortuna', cat:'III', val: 1800, trend:+5},
    {name:'Poder', cat:'V', val: 1600, trend:+4},
    {name:'Espinas', cat:'III', val: 1200, trend:-1},
    {name:'Protección', cat:'IV', val: 1100, trend:+2},
    {name:'Afinidad acuática', cat:'I', val: 900, trend:+1},
    {name:'Respiración', cat:'III', val: 860, trend:+1},
    {name:'Aspecto ígneo', cat:'II', val: 820, trend:-2},
    {name:'Saeta múltiple', cat:'I', val: 600, trend:+1},
  ],
};

/* =========================================================
   Estado y referencias de UI
   ========================================================= */
const REFRESH_SEC = 12;
const refreshSecEl = $('#refreshSec');
refreshSecEl.textContent = REFRESH_SEC;

const btnRefresh = $('#btnRefresh');
const btnPause = $('#btnPause');
const btnResume = $('#btnResume');
const btnReset = $('#btnReset');

let timer = null;
let paused = false;

/* ---------- Render inicial ---------- */
document.addEventListener('DOMContentLoaded', ()=>{
  renderAllTables();
  observeReveal();
  startAutoRefresh();
});

/* =========================================================
   Renderizado de tablas
   ========================================================= */
function renderAllTables(){
  $$('.rank-table').forEach(tbl=>{
    const key = tbl.dataset.key;
    const data = DATA[key] ? DATA[key].slice() : [];
    renderTable(tbl, data);
    bindSorting(tbl, key);
  });
}

function renderTable(tbl, list){
  const tbody = $('tbody', tbl);
  tbody.innerHTML = list
    .map((row, i)=> rowTemplate(row, i+1))
    .join('');
  // aplicar clases top 1/2/3
  $$('tr', tbody).forEach((tr, i)=>{
    tr.dataset.pos = String(i+1);
    const posCell = $('.rank-pos', tr);
    if (!posCell) return;
    if (i===0) posCell.classList.add('gold');
    else if (i===1) posCell.classList.add('silver');
    else if (i===2) posCell.classList.add('bronze');
  });
}

function rowTemplate(row, pos){
  const trendCls = row.trend > 0 ? 'up' : (row.trend < 0 ? 'down' : 'neutral');
  const trendSym = row.trend > 0 ? '▲' : (row.trend < 0 ? '▼' : '•');
  return `
    <tr class="rank-row" data-pos="${pos}">
      <td class="rank-cell rank-pos">${pos}</td>
      <td class="rank-cell rank-name">${escapeHtml(row.name)}</td>
      <td class="rank-cell rank-cat">${escapeHtml(row.cat)}</td>
      <td class="rank-cell rank-val">${fmt(row.val)}</td>
      <td class="rank-cell rank-trend ${trendCls}">${trendSym} ${Math.abs(row.trend)}</td>
    </tr>
  `;
}

/* =========================================================
   Ordenación por columnas
   ========================================================= */
function bindSorting(tbl, key){
  const heads = $$('thead th', tbl);
  let sortState = { col:'pos', dir:'asc' };

  heads.forEach(th=>{
    th.addEventListener('click', ()=>{
      const col = th.dataset.sort || 'pos';
      // reset marca visual
      heads.forEach(h=>h.classList.remove('is-sorted','desc'));
      th.classList.add('is-sorted');

      // alternar dirección si misma col
      if (sortState.col === col){
        sortState.dir = sortState.dir === 'asc' ? 'desc' : 'asc';
        if (sortState.dir === 'desc') th.classList.add('desc');
      } else {
        sortState.col = col;
        sortState.dir = 'asc';
      }

      const list = DATA[key].slice();
      const cmp = getComparator(col, sortState.dir);
      list.sort(cmp);
      renderTable(tbl, list);
    });
  });
}

function getComparator(col, dir){
  const mult = dir === 'asc' ? 1 : -1;
  if (col === 'pos'){
    return (a,b)=> mult * (a.val===b.val ? a.name.localeCompare(b.name) : b.val - a.val);
  }
  if (col === 'name'){
    return (a,b)=> mult * a.name.localeCompare(b.name, 'es', {sensitivity:'base'});
  }
  if (col === 'cat'){
    return (a,b)=> mult * a.cat.localeCompare(b.cat, 'es', {sensitivity:'base'});
  }
  if (col === 'val'){
    return (a,b)=> mult * (a.val - b.val);
  }
  if (col === 'trend'){
    return (a,b)=> mult * (a.trend - b.trend);
  }
  return ()=>0;
}

/* =========================================================
   Auto-Refresh (simulado)
   ========================================================= */
function startAutoRefresh(){
  stopAutoRefresh();
  timer = setInterval(()=> { if (!paused) simulateTick(); }, REFRESH_SEC*1000);
}
function stopAutoRefresh(){
  if (timer) clearInterval(timer);
  timer = null;
}

btnRefresh?.addEventListener('click', ()=>{
  simulateTick();
  toast('Datos actualizados');
});
btnPause?.addEventListener('click', ()=>{
  paused = true; btnPause.disabled = true; btnResume.disabled = false;
  toast('Pausa');
});
btnResume?.addEventListener('click', ()=>{
  paused = false; btnPause.disabled = false; btnResume.disabled = true;
  toast('Reanudado');
});
btnReset?.addEventListener('click', ()=>{
  resetData();
  renderAllTables();
  toast('Datos reiniciados');
});

/* ---------- Simulación de actualización ---------- */
function simulateTick(){
  // peq. ruido aleatorio por dataset
  Object.keys(DATA).forEach(k=>{
    if (k==='censored') return;
    const arr = DATA[k];
    arr.forEach(it=>{
      const jitter = randInt(-5, 12);
      it.val = Math.max(0, it.val + jitter*randInt(1,3));
      it.trend = Math.max(-20, Math.min(20, Math.round(it.trend*0.6 + jitter*0.8)));
    });
    // resort por valor desc para afectar "pos"
    arr.sort((a,b)=> b.val - a.val || a.name.localeCompare(b.name,'es'));
  });

  // re-render
  $$('.rank-table').forEach(tbl=>{
    const key = tbl.dataset.key;
    const data = DATA[key] ? DATA[key].slice() : [];
    renderTable(tbl, data);
  });
}

function resetData(){
  // No tenemos snapshot profundo, pero para demo basta con normalizar tendencias
  Object.values(DATA).forEach(arr=>{
    arr.forEach(it => it.trend = randInt(-5, 10));
  });
}

/* =========================================================
   Censurado animado (pings periódicos)
   ========================================================= */
(function censoredPulse(){
  const card = document.querySelector('.rank-card.censored');
  if (!card) return;
  const box = card.querySelector('.censored-box');
  let t = 0;
  setInterval(()=>{
    t++;
    if (t % 4 === 0){
      box.style.filter = 'contrast(1.3) saturate(1.1)';
      setTimeout(()=> box.style.filter = '', 300);
    }
  }, 1400);
})();

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
  clearTimeout(toast._id);
  t._id = setTimeout(()=> t.classList.remove('show'), 1500);
}

/* =========================================================
   Helpers
   ========================================================= */
function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}
function fmt(n){return new Intl.NumberFormat('es-PE').format(n)}
function randInt(a,b){return Math.floor(Math.random()*(b-a+1))+a}
