/* =========================================================
   Moonveil Portal — JS: Tradeos
   - Navbar + HUD + Partículas + Parallax
   - Dataset: 8 aldeanos, 10 tradeos cada uno (80 items)
   - Stock persistente por item (localStorage)
   - Reset por ítem: 24h / 7d / 30d (contador visible)
   - Canjear descuenta stock, bloquea al 0, reinicia al vencimiento
   - Búsqueda + filtros por chips + orden
   - Modal de detalle + compartir
   - Animaciones reveal + toast
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
    parts = new Array(80).fill(0).map(() => ({
      x: Math.random()*w, y: Math.random()*h,
      r: 1 + Math.random()*2*dpi,
      s: .25 + Math.random()*1.0,
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
   Utils
   ========================================================= */
const LS_KEY = 'mv.tradeos.v1';
const NOW = ()=> Date.now();

const DUR = {
  '24h': 24*60*60*1000,
  '12h': 12*60*60*1000,
  '7d' : 7*24*60*60*1000,
  '30d': 30*24*60*60*1000
};

function fmtLeft(ms){
  if (ms <= 0) return '0s';
  const s = Math.floor(ms/1000);
  const d = Math.floor(s/86400);
  const h = Math.floor((s%86400)/3600);
  const m = Math.floor((s%3600)/60);
  const ss= s%60;
  if (d>0) return `${d}d ${h}h ${m}m`;
  if (h>0) return `${h}h ${m}m ${ss}s`;
  if (m>0) return `${m}m ${ss}s`;
  return `${ss}s`;
}

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}

/* =========================================================
   Imágenes inline (SVG generadas)
   ========================================================= */
function svgItem(bg1, bg2, icon){
  return `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'>
  <defs>
    <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0' stop-color='${bg1}'/><stop offset='1' stop-color='${bg2}'/>
    </linearGradient>
  </defs>
  <rect width='100%' height='100%' rx='28' fill='url(#g)'/>
  <g transform='translate(128 128)'>
    <circle r='74' fill='rgba(0,0,0,.15)'/>
    <text x='0' y='14' text-anchor='middle' font-size='92' fill='rgba(255,255,255,.9)' font-family='Outfit'>${icon}</text>
  </g>
</svg>`)}`
}
const ICONS = {
  bread: svgItem('#6fbf6d','#2f7a45','🍞'),
  apple: svgItem('#79c47f','#2a7342','🍎'),
  stew:  svgItem('#9cc46f','#436a39','🥣'),
  fish:  svgItem('#79b6e8','#2f5b91','🐟'),
  arrow: svgItem('#88a0b6','#3b5368','🏹'),
  sword: svgItem('#eab308','#8a4f00','🗡️'),
  pick:  svgItem('#b0b8c9','#5c697d','⛏️'),
  shield:svgItem('#9bb8c4','#3d5c6b','🛡️'),
  torch: svgItem('#f59e0b','#92400e','🔥'),
  map:   svgItem('#a3e635','#3f6212','🗺️'),
  book:  svgItem('#c084fc','#6d28d9','📘'),
  gem:   svgItem('#34d399','#065f46','💎'),
  bottle:svgItem('#60a5fa','#1e3a8a','🧪'),
  bow:   svgItem('#93c5fd','#2563eb','🏹'),
  bell:  svgItem('#fbbf24','#92400e','🔔'),
  carrot:svgItem('#86efac','#14532d','🥕'),
  honey: svgItem('#fde68a','#a16207','🍯'),
  pearl: svgItem('#a78bfa','#4c1d95','🪄'),
  mystery: svgItem('#9ca3af','#374151','❓'),
  eye:   svgItem('#a3a3a3','#404040','👁️'),
  feather:svgItem('#fde68a','#a16207','🪶'),
  paper: svgItem('#94a3b8','#334155','📜'),
  axe:   svgItem('#e2e8f0','#64748b','🪓'),
  helmet:svgItem('#f8fafc','#475569','⛑️'),
  potion:svgItem('#c084fc','#6d28d9','🧴'),
};

/* =========================================================
   DATASET
   - 8 traders (secciones) * 10 items = 80 tradeos
   - Campos ítem:
     id, trader, name, details, rarity (common|rare|epic|legend), cost (emeralds:number),
     cats:string[], stockMax:number, restock:'24h'|'7d'|'30d'|'12h', img, legendary?:true
   ========================================================= */

const TRADERS = [
  { key:'sand',  name:'Sand Brill',         tagline:'Logística y básicos',              color:'#30d158' },
  { key:'lira',  name:'Lira Moon',          tagline:'Utilitarios y cosméticos',         color:'#60a5fa' },
  { key:'orlin', name:'Orlin Forge',        tagline:'Forja y combate',                  color:'#f59e0b' },
  { key:'rhea',  name:'Rhea Moss',          tagline:'Herbolaria y pociones',            color:'#c084fc' },
  { key:'konn',  name:'Konn Slate',         tagline:'Minería y exploración',            color:'#93c5fd' },
  { key:'mira',  name:'Mira Flint',         tagline:'Arqueología y mapas',              color:'#86efac' },
  { key:'arcano',name:'Maestro Arcano',     tagline:'Encantamientos y grimorios',       color:'#a78bfa' },
  { key:'mister',name:'Aldeano Misterioso', tagline:'Rarezas y bienes velados',         color:'#eab308' },
];

// helper para crear 10 ítems variados por trader
function itemsFor(trader){
  switch(trader){
    case 'sand': return [
      it('bread', 'Pan horneado', 'Alimento básico para expediciones largas.', 'common', 1, ['alimentos'], 12, '24h', ICONS.bread),
      it('apple', 'Manzana roja', 'Crujiente, fresca. Ideal para pícnics al borde del bioma.', 'common', 1, ['alimentos'], 10, '24h', ICONS.apple),
      it('stew', 'Estofado campestre', 'Restaura más que el pan. Caliente y con hierbas.', 'rare', 3, ['alimentos'], 8, '24h', ICONS.stew),
      it('map', 'Mapa simple', 'Papelería base para cartografiar zonas seguras.', 'common', 2, ['utilidad'], 8, '7d', ICONS.map),
      it('torch', 'Antorchas x16', 'Lote para cuevas y campamentos. No incluye soporte.', 'common', 2, ['utilidad'], 14, '24h', ICONS.torch),
      it('feather', 'Pluma de mensajero', 'Tinta mejor adherida y trazos suaves.', 'rare', 2, ['utilidad'], 9, '7d', ICONS.feather),
      it('paper', 'Papel fino x8', 'Papel de fibra lunar, resistente a humedad.', 'rare', 3, ['utilidad'], 10, '7d', ICONS.paper),
      it('bell', 'Campana de aviso', 'Llamado de reunión o alerta aldeana.', 'epic', 8, ['utilidad'], 3, '30d', ICONS.bell),
      it('honey', 'Miel pura', 'Dulce energético. Ideal para travesías.', 'rare', 3, ['alimentos'], 6, '7d', ICONS.honey),
      it('bread-g', 'Cesta del panadero', 'Selección premium del horno ancestral.', 'legend', 12, ['alimentos','legendario'], 2, '30d', ICONS.bread, true),
    ];
    case 'lira': return [
      it('book', 'Cosméticos lumínicos', 'Pigmento brillante para armaduras.', 'rare', 4, ['cosméticos','utilidad'], 6, '7d', ICONS.book),
      it('bottle', 'Frasco pulcro', 'Cristal templado para pociones sensibles.', 'common', 1, ['utilidad'], 14, '24h', ICONS.bottle),
      it('map2', 'Marcas de ruta', 'Stickers mágicos reutilizables para mapas.', 'epic', 6, ['utilidad'], 4, '7d', ICONS.map),
      it('feather2', 'Pluma noble', 'Trazos plateados para pergaminos reales.', 'epic', 7, ['cosméticos'], 4, '30d', ICONS.feather),
      it('paper2', 'Pergamino perfumado', 'Aroma tenue, no distrae a bibliotecarios.', 'rare', 3, ['cosméticos'], 7, '7d', ICONS.paper),
      it('gem', 'Crisol de esmeralda', 'Brillo extra al engastar joyas.', 'rare', 5, ['utilidad'], 5, '7d', ICONS.gem),
      it('apple2', 'Caramelo de manzana', 'Para ferias nocturnas del bazar.', 'common', 1, ['alimentos'], 12, '24h', ICONS.apple),
      it('torch2', 'Farol elegante', 'Iluminación cálida, diseño minimal.', 'epic', 6, ['utilidad','cosméticos'], 4, '7d', ICONS.torch),
      it('book-g', 'Estuche maestro', 'Set deluxe de estilismo lunar.', 'legend', 14, ['cosméticos','legendario'], 2, '30d', ICONS.book, true),
      it('paper-g', 'Colección Edición Dorada', 'Papelería de gala con filo áureo.', 'legend', 16, ['cosméticos','legendario'], 1, '30d', ICONS.paper, true),
    ];
    case 'orlin': return [
      it('sword', 'Espada de hierro', 'Balanceada, buen filo.', 'rare', 6, ['armas'], 5, '7d', ICONS.sword),
      it('axe', 'Hacha templada', 'Buen daño y tala eficiente.', 'rare', 5, ['armas','herramientas'], 6, '7d', ICONS.axe),
      it('pick', 'Pico resistente', 'Durabilidad reforzada.', 'rare', 5, ['herramientas'], 6, '7d', ICONS.pick),
      it('shield', 'Escudo robusto', 'Bloqueo confiable en hordas.', 'epic', 7, ['armas','defensa'], 4, '7d', ICONS.shield),
      it('arrow', 'Flechas x32', 'Lote con pluma rectificada.', 'common', 2, ['armas'], 12, '24h', ICONS.arrow),
      it('helmet', 'Casco con visera', 'Protección frontal y lateral.', 'rare', 5, ['defensa'], 5, '7d', ICONS.helmet),
      it('sword2', 'Espada afilada+', 'Mejor filo y agarre.', 'epic', 9, ['armas'], 3, '7d', ICONS.sword),
      it('bow', 'Arco curvado', 'Proyección estable.', 'epic', 8, ['armas'], 3, '7d', ICONS.bow),
      it('ingot', 'Lingotes x4', 'Para reforja o crafteo.', 'rare', 4, ['utilidad','metal'], 8, '24h', ICONS.ingot || ICONS.gem),
      it('sword-g', 'Hoja dorada de Orlin', 'Forja maestra; leyenda local.', 'legend', 18, ['armas','legendario'], 1, '30d', ICONS.sword, true),
    ];
    case 'rhea': return [
      it('potion1', 'Poción de curación', 'Emergencias y raids.', 'epic', 7, ['pociones'], 4, '7d', ICONS.potion),
      it('potion2', 'Poción de velocidad', 'Sprint extendido.', 'rare', 5, ['pociones'], 6, '7d', ICONS.potion),
      it('stew2', 'Sopa de raíces', 'Restaura y calienta.', 'rare', 3, ['alimentos'], 8, '24h', ICONS.stew),
      it('honey2', 'Miel herbal', 'Cuida la garganta.', 'rare', 3, ['alimentos'], 8, '7d', ICONS.honey),
      it('feather3', 'Pluma curativa', 'Textil con microhebras.', 'rare', 4, ['utilidad'], 6, '7d', ICONS.feather),
      it('bottle2', 'Viales x6', 'Vidrio claro reforzado.', 'common', 2, ['utilidad'], 12, '24h', ICONS.bottle),
      it('apple3', 'Trocitos glaseados', 'Snack energético.', 'common', 1, ['alimentos'], 12, '24h', ICONS.apple),
      it('paper3', 'Recetario básico', 'Formulas de campo.', 'rare', 3, ['utilidad'], 7, '7d', ICONS.paper),
      it('book2', 'Herbario de bolsillo', 'Identificación de plantas.', 'epic', 6, ['utilidad'], 4, '7d', ICONS.book),
      it('potion-g', 'Elixir lunar de Rhea', 'Restitución mística.', 'legend', 16, ['pociones','legendario'], 1, '30d', ICONS.potion, true),
    ];
    case 'konn': return [
      it('torch3', 'Antorchas húmedas x16', 'No se apagan fácil.', 'rare', 3, ['utilidad'], 10, '24h', ICONS.torch),
      it('pick2', 'Pico equilibrado', 'Menos fatiga.', 'rare', 5, ['herramientas'], 6, '7d', ICONS.pick),
      it('map3', 'Bosque subterráneo', 'Croquis de cuevas vivas.', 'epic', 7, ['mapas','utilidad'], 3, '7d', ICONS.map),
      it('shield2', 'Escudo minero', 'Refuerzo de remaches.', 'rare', 5, ['defensa'], 5, '7d', ICONS.shield),
      it('stew3', 'Guiso salado', 'Mejora la moral.', 'common', 2, ['alimentos'], 10, '24h', ICONS.stew),
      it('arrow2', 'Flechas perforantes x24', 'Buena penetración.', 'rare', 4, ['armas'], 8, '24h', ICONS.arrow),
      it('helmet2', 'Casco con lámpara', 'Visión clara.', 'epic', 8, ['defensa','utilidad'], 3, '7d', ICONS.helmet),
      it('axe2', 'Hachuela reforzada', 'Roca sedimentaria ok.', 'rare', 5, ['herramientas'], 4, '7d', ICONS.axe),
      it('paper4', 'Plan de túneles', 'Marcas de seguridad.', 'rare', 3, ['utilidad'], 6, '7d', ICONS.paper),
      it('pick-g', 'Pico de pizarra dorada', 'Golpe certero.', 'legend', 17, ['herramientas','legendario'], 1, '30d', ICONS.pick, true),
    ];
    case 'mira': return [
      it('map4', 'Mapa arqueológico', 'Sitios de interés.', 'epic', 7, ['mapas'], 3, '7d', ICONS.map),
      it('paper5', 'Bitácora compacta', 'Notas de campo.', 'common', 2, ['utilidad'], 10, '24h', ICONS.paper),
      it('book3', 'Glosario rúnico', 'Traducción primaria.', 'epic', 8, ['utilidad','encantados'], 3, '7d', ICONS.book),
      it('gem2', 'Fragmento vítreo', 'Eco de portales.', 'rare', 4, ['reliquias'], 6, '7d', ICONS.gem),
      it('feather4', 'Pluma de archivo', 'Cero manchas.', 'rare', 3, ['utilidad'], 7, '7d', ICONS.feather),
      it('torch4', 'Lámpara fría', 'Luz blanca constante.', 'rare', 4, ['utilidad'], 6, '7d', ICONS.torch),
      it('paper6', 'Calco de petroglifos', 'Para análisis.', 'rare', 3, ['reliquias','utilidad'], 7, '7d', ICONS.paper),
      it('myst', 'Símbolo misterioso', 'Cifrado incompleto.', 'epic', 9, ['reliquias'], 2, '30d', ICONS.mystery),
      it('map5', 'Carta del desierto', 'Dunas y oasis.', 'rare', 4, ['mapas'], 6, '7d', ICONS.map),
      it('map-g', 'Atlas de Moonveil', 'Compendio maestro.', 'legend', 20, ['mapas','legendario'], 1, '30d', ICONS.map, true),
    ];
    case 'arcano': return [
      it('book4', 'Tomo de golpeo', 'Encantamiento menor.', 'epic', 9, ['encantados'], 3, '7d', ICONS.book),
      it('book5', 'Tomo de agilidad', 'Movimiento fluido.', 'epic', 9, ['encantados'], 3, '7d', ICONS.book),
      it('pearl', 'Perla de maná', 'Carga arcanista.', 'rare', 6, ['encantados'], 5, '7d', ICONS.pearl),
      it('potion3', 'Poción de enfoque', 'Mayor precisión.', 'rare', 5, ['pociones'], 5, '7d', ICONS.potion),
      it('eye', 'Ojo vidente', 'Rutas alternativas.', 'epic', 10, ['utilidad','encantados'], 2, '30d', ICONS.eye),
      it('feather5', 'Pluma rúnica', 'Trazo canalizador.', 'rare', 5, ['encantados'], 5, '7d', ICONS.feather),
      it('paper7', 'Pergamino arcano', 'Sella hechizos.', 'epic', 8, ['encantados'], 3, '7d', ICONS.paper),
      it('torch5', 'Antorcha etérea', 'Fuego frío.', 'rare', 5, ['utilidad'], 4, '7d', ICONS.torch),
      it('book6', 'Grimorio menor', 'Base ritual.', 'epic', 9, ['encantados'], 2, '7d', ICONS.book),
      it('book-g', 'Grimorio dorado', 'Arte mayor de sello.', 'legend', 24, ['encantados','legendario'], 1, '30d', ICONS.book, true),
    ];
    case 'mister': return [
      it('myst2', 'Bolsa velada', 'Contenido aleatorio…', 'epic', 8, ['rareza'], 3, '7d', ICONS.mystery),
      it('gem3', 'Gema empañada', 'Parece respirar.', 'rare', 6, ['rareza'], 4, '7d', ICONS.gem),
      it('bread2', 'Pan olvidado', 'Sabe mejor de noche.', 'common', 1, ['alimentos'], 8, '24h', ICONS.bread),
      it('map6', 'Mapa incompleto', 'Faltan cuadrantes.', 'rare', 5, ['mapas'], 5, '7d', ICONS.map),
      it('bottle3', 'Vial sellado', 'No se abre fácil.', 'rare', 4, ['rareza'], 4, '7d', ICONS.bottle),
      it('paper8', 'Hoja borrosa', 'Texto refractado.', 'common', 2, ['rareza'], 8, '24h', ICONS.paper),
      it('eye2', 'Pupila errante', 'Sigue al portador.', 'epic', 10, ['rareza'], 2, '30d', ICONS.eye),
      it('feather6', 'Pluma negra', 'Absorbe luz.', 'rare', 5, ['rareza'], 4, '7d', ICONS.feather),
      it('torch6', 'Antorcha invertida', 'Luz desde la sombra.', 'epic', 9, ['rareza'], 2, '7d', ICONS.torch),
      it('myst-g', 'Símbolo dorado', 'Rompecabezas final.', 'legend', 26, ['rareza','legendario'], 1, '30d', ICONS.mystery, true),
    ];
  }
  return [];
}

function it(id, name, details, rarity, emeralds, cats, stockMax, restock, img, legendary=false){
  return { id, name, details, rarity, cost:{emeralds}, cats, stockMax, restock, img, legendary };
}

const DATA = TRADERS.map(t=> ({
  trader: t.key,
  items: itemsFor(t.key).map(x=> ({...x, trader:t.key}))
}));

/* =========================================================
   Estado (localStorage)
   - Guardamos por itemId: { stock, nextReset }
   ========================================================= */
function loadState(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  }catch(e){ return {}; }
}
function saveState(s){
  try{ localStorage.setItem(LS_KEY, JSON.stringify(s)); }catch(e){}
}

let STATE = loadState();

/* Inicializa stock si no existe; resetea si pasó el tiempo */
function ensureItemState(item){
  const key = itemKey(item);
  let st = STATE[key];
  const now = NOW();
  const dur = DUR[item.restock] || DUR['7d'];
  if (!st){
    st = { stock:item.stockMax, nextReset: now + dur };
    STATE[key] = st; return st;
  }
  // reset si corresponde
  if (now >= st.nextReset){
    st.stock = item.stockMax;
    st.nextReset = now + dur;
  }
  return st;
}

function itemKey(item){ return `${item.trader}:${item.id}`; }

/* =========================================================
   Render
   ========================================================= */
const grids = {
  sand:  $('#gridSand'),
  lira:  $('#gridLira'),
  orlin: $('#gridOrlin'),
  rhea:  $('#gridRhea'),
  konn:  $('#gridKonn'),
  mira:  $('#gridMira'),
  arcano:$('#gridArc'),
  mister:$('#gridMis'),
};

function renderAll(dlist){
  Object.values(grids).forEach(g=> g.innerHTML = '');
  dlist.forEach(section=>{
    const grid = grids[section.trader];
    section.items.forEach(item=>{
      const st = ensureItemState(item);
      grid.appendChild(card(item, st));
    });
  });
  saveState(STATE);
}

function card(item, st){
  const wrap = document.createElement('article');
  wrap.className = 'trade-card';
  if (item.legendary || item.rarity === 'legend') wrap.classList.add('legendary');

  // thumb
  const thumb = document.createElement('div'); thumb.className = 'trade-thumb';
  const img = document.createElement('img'); img.alt = item.name; img.loading='lazy'; img.src=item.img;
  thumb.appendChild(img);

  // body
  const body = document.createElement('div'); body.className = 'trade-body';
  const h = document.createElement('h3'); h.className='trade-title'; h.textContent = item.name;
  const p = document.createElement('p'); p.className='trade-desc'; p.textContent = item.details;

  // meta (costo + rareza)
  const meta = document.createElement('div'); meta.className='trade-meta';
  const cost = document.createElement('span'); cost.className='cost'; cost.title = 'Costo en esmeraldas';
  cost.innerHTML = `<span class="emer"></span> ${item.cost.emeralds} esmeraldas`;
  const rar = document.createElement('span'); rar.className='rarity ' + mapRarity(item.rarity); rar.textContent = labelRarity(item.rarity);
  meta.append(cost, rar);

  const badges = document.createElement('div'); badges.className='badges';
  item.cats.forEach(c=>{
    const b = document.createElement('span'); b.className = 'badge ' + mapBadge(item.rarity);
    b.textContent = c; badges.appendChild(b);
  });

  body.append(h, p, meta, badges);

  // CTA
  const cta = document.createElement('div'); cta.className='trade-cta';
  const stock = document.createElement('div'); stock.className='stock';
  const bar = document.createElement('div'); bar.className='bar';
  bar.style.setProperty('--p', (st.stock/item.stockMax).toFixed(2));
  const sTxt = document.createElement('small');
  sTxt.innerHTML = `Stock: <b>${st.stock}</b>/<span>${item.stockMax}</span>`;
  if (st.stock <= Math.ceil(item.stockMax*0.25)) sTxt.classList.add('low');

  const timer = document.createElement('small'); timer.className='timer'; timer.dataset.key=itemKey(item);
  timer.title = 'Tiempo para restablecer stock';
  timer.textContent = '—';

  stock.append(bar, sTxt, timer);

  const actions = document.createElement('div');
  const btn = document.createElement('button'); btn.className='btn btn--primary'; btn.textContent='Canjear';
  btn.disabled = st.stock<=0;
  btn.addEventListener('click', ()=>{
    const key = itemKey(item);
    const curr = STATE[key] || ensureItemState(item);
    if (curr.stock>0){
      curr.stock -= 1;
      if (curr.stock<=0) curr.stock=0;
      saveState(STATE);
      // actualizar UI
      sTxt.innerHTML = `Stock: <b>${curr.stock}</b>/<span>${item.stockMax}</span>`;
      if (curr.stock <= Math.ceil(item.stockMax*0.25)) sTxt.classList.add('low'); else sTxt.classList.remove('low');
      bar.style.setProperty('--p', (curr.stock/item.stockMax).toFixed(2));
      if (curr.stock===0) btn.disabled=true;
      toast(`Canjeaste: ${item.name}`);
    }else{
      toast('Sin stock. Espera restablecimiento.');
    }
  });

  const btnMore = document.createElement('button'); btnMore.className='btn btn--ghost'; btnMore.textContent='Ver más';
  btnMore.addEventListener('click', ()=> openModal(item, st));

  actions.append(btn, btnMore);

  cta.append(stock, actions);

  wrap.append(thumb, body, cta);
  return wrap;
}

function mapRarity(r){
  return r==='legend'?'legend':r==='epic'?'epic':r==='rare'?'rare':'common';
}
function labelRarity(r){
  return r==='legend'?'LEGENDARIO':r==='epic'?'ÉPICO':r==='rare'?'RARO':'COMÚN';
}
function mapBadge(r){
  return r==='legend'?'legend':r==='epic'?'epic':r==='rare'?'rare':'common';
}

/* =========================================================
   Tabs / Filtros / Orden / Buscador
   ========================================================= */
const tabs = $$('.tab');
tabs.forEach(t=> t.addEventListener('click', ()=>{
  tabs.forEach(x=> x.classList.remove('is-active'));
  t.classList.add('is-active');
  const section = t.dataset.tab;
  $$('.trades-section').forEach(sec=> sec.hidden = sec.dataset.section !== section);
  toast(`Sección: ${t.textContent}`);
  observeReveal();
}));

const chipEls = $$('.chip');
const chipsActive = new Set();
chipEls.forEach(ch=>{
  ch.addEventListener('click', ()=>{
    const key = ch.dataset.chip.toLowerCase();
    if (chipsActive.has(key)){ chipsActive.delete(key); ch.classList.remove('is-on'); }
    else { chipsActive.add(key); ch.classList.add('is-on'); }
    updateView();
  });
});

const sortSel = $('#sortBy');
sortSel.addEventListener('change', ()=> updateView());

const searchInput = $('#searchInput');
const btnClear = $('#btnClear');
searchInput.addEventListener('keydown',(e)=>{
  if (e.key === 'Enter'){ e.preventDefault(); updateView(); }
});
btnClear.addEventListener('click', ()=>{
  searchInput.value = '';
  chipsActive.clear();
  chipEls.forEach(c=>c.classList.remove('is-on'));
  sortSel.value = 'name_asc';
  updateView();
});

function updateView(){
  const term = searchInput.value.trim().toLowerCase();
  const chips = Array.from(chipsActive);

  // clonar dataset
  let list = DATA.map(s=> ({ trader:s.trader, items:s.items.slice() }));

  // filtros por chips
  if (chips.length){
    list = list.map(sec=>{
      const items = sec.items.filter(n=>{
        const rareOk = chips.some(c=> ['legendario','legend','épico','raro','común'].includes(c) && matchRarityChip(c, n.rarity));
        const restOk = chips.some(c=> ['24h','7d','30d','12h'].includes(c) && n.restock===c);
        const catOk  = chips.some(c=> (n.cats||[]).map(x=>x.toLowerCase()).includes(c));
        return rareOk || restOk || catOk;
      });
      return {...sec, items};
    });
  }

  // búsqueda
  if (term){
    list = list.map(sec=>{
      const items = sec.items.filter(n=>{
        const hay = [
          n.name, n.details, ...(n.cats||[]), sec.trader
        ].join(' ').toLowerCase();
        return hay.includes(term);
      });
      return {...sec, items};
    });
  }

  // orden
  const cmp = getSort(sortSel.value);
  list = list.map(sec=> ({...sec, items: sec.items.sort(cmp)}));

  renderAll(list);
  observeReveal();
}

function matchRarityChip(c, r){
  if (c==='legendario' || c==='legend') return r==='legend';
  if (c==='épico') return r==='epic';
  if (c==='raro') return r==='rare';
  if (c==='común') return r==='common';
  return false;
}

function getSort(mode){
  switch(mode){
    case 'name_asc':  return (a,b)=> a.name.localeCompare(b.name,'es',{sensitivity:'base'});
    case 'name_desc': return (a,b)=> b.name.localeCompare(a.name,'es',{sensitivity:'base'});
    case 'cost_asc':  return (a,b)=> a.cost.emeralds - b.cost.emeralds;
    case 'cost_desc': return (a,b)=> b.cost.emeralds - a.cost.emeralds;
    case 'rarity_desc':
      const rank = v=> ({legend:3,epic:2,rare:1,common:0})[v] ?? 0;
      return (a,b)=> rank(b.rarity) - rank(a.rarity);
    case 'stock_desc':
      return (a,b)=> {
        const A = ensureItemState(a).stock, B = ensureItemState(b).stock;
        return B - A;
      };
    default: return ()=>0;
  }
}

/* =========================================================
   Timers: actualizar cuenta regresiva + resets
   ========================================================= */
function tickTimers(){
  // actualiza timers visibles y resetea stock si corresponde
  const now = NOW();
  DATA.forEach(sec=>{
    sec.items.forEach(item=>{
      const key = itemKey(item);
      let st = STATE[key] || ensureItemState(item);
      if (now >= st.nextReset){
        // reset
        const dur = DUR[item.restock] || DUR['7d'];
        st.stock = item.stockMax;
        st.nextReset = now + dur;
        // si la tarjeta está en DOM, refrescar
        const tEl = document.querySelector(`.timer[data-key="${CSS.escape(key)}"]`);
        const sEl = tEl?.previousElementSibling; // small stock
        const bar = tEl?.parentElement?.querySelector('.bar');
        if (sEl){
          sEl.innerHTML = `Stock: <b>${st.stock}</b>/<span>${item.stockMax}</span>`;
          if (st.stock <= Math.ceil(item.stockMax*0.25)) sEl.classList.add('low'); else sEl.classList.remove('low');
        }
        if (bar){ bar.style.setProperty('--p', (st.stock/item.stockMax).toFixed(2)); }
        // reactivar botón de canje si estaba deshabilitado
        const card = tEl?.closest('.trade-card');
        const btn = card?.querySelector('.btn.btn--primary');
        if (btn) btn.disabled = st.stock<=0;
        toast(`Stock restablecido: ${item.name}`);
        saveState(STATE);
      }
      // actualizar texto de timer
      const left = Math.max(0, st.nextReset - now);
      const tEl = document.querySelector(`.timer[data-key="${CSS.escape(key)}"]`);
      if (tEl) tEl.textContent = `⏳ ${fmtLeft(left)}`;
    });
  });
}
setInterval(tickTimers, 1000);

/* =========================================================
   Modal
   ========================================================= */
const modal = $('#modal');
const mBody = $('#mBody');
$$('[data-close]', modal).forEach(el=> el.addEventListener('click', closeModal));
modal.addEventListener('click', (e)=>{ if (e.target?.dataset?.close !== undefined) closeModal(); });
addEventListener('keydown', (e)=>{ if (e.key==='Escape' && !modal.hidden) closeModal(); });

function openModal(item, st){
  modal.hidden = false;
  const traderName = TRADERS.find(t=>t.key===item.trader)?.name || item.trader;
  mBody.innerHTML = `
    <div class="m-hero">
      <div class="thumb"><img src="${item.img}" alt="${escapeHtml(item.name)}"></div>
      <div>
        <h3>${escapeHtml(item.name)}</h3>
        <p>${escapeHtml(item.details)}</p>
        <p class="muted">Aldeano: <b>${escapeHtml(traderName)}</b> · Rareza: <b>${labelRarity(item.rarity)}</b> · Costo: <b>${item.cost.emeralds} esmeraldas</b></p>
        <div class="badges">
          ${(item.cats||[]).map(c=>`<span class="badge ${mapBadge(item.rarity)}">${escapeHtml(c)}</span>`).join('')}
        </div>
      </div>
    </div>
    <p class="muted">Stock actual: <b>${st?.stock ?? '—'}</b> / ${item.stockMax} · Restablece cada <b>${item.restock}</b></p>
  `;
  $('#mTitle').textContent = `Detalle — ${item.name}`;
  $('#btnShare').onclick = ()=> shareItem(item);
}
function closeModal(){ modal.hidden = true; }

async function shareItem(item){
  const txt = `${item.name} — ${labelRarity(item.rarity)} · ${item.cost.emeralds} esmeraldas`;
  try{
    await navigator.clipboard.writeText(txt);
    toast('Copiado al portapapeles');
  }catch(e){
    toast('No se pudo copiar');
  }
}

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
  t._id = setTimeout(()=> t.classList.remove('show'), 1400);
}

/* =========================================================
   Boot
   ========================================================= */
document.addEventListener('DOMContentLoaded', ()=>{
  // construir dataset expandido (80 ítems)
  const dlist = DATA;

  // render inicial
  renderAll(dlist);

  // mostrar primera sección (sand)
  $$('.trades-section').forEach(sec=> sec.hidden = sec.dataset.section !== 'sand');

  // activar reveal
  observeReveal();

  // tick inmediato para timers
  tickTimers();
});
