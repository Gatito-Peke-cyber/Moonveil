/* =====================================================
   Farm & Craft · minecraft.js
   Sistema completo: corrales · huerto · crafteo · pedidos
   + guardado local + eventos diarios
   ===================================================== */

const SAVE_KEY = 'farmcraft_save_v2';

/* ─── ANIMALES ──────────────────────────────────────────── */
const ANIMALS = {
  cow:     { name:'Vaca',     emoji:'🐄', cost:80,  breedFood:['wheat'],              breedAmt:2, produces:[{item:'milk',  every:1,qty:1}], butcher:{item:'beef',qty:3},   desc:'Leche diaria · Carne al sacrificar',  tip:'Cría con Trigo' },
  chicken: { name:'Gallina',  emoji:'🐔', cost:40,  breedFood:['seeds'],              breedAmt:3, produces:[{item:'egg',   every:1,qty:1},{item:'feather',every:2,qty:2}], desc:'Huevos diarios · Plumas cada 2 días', tip:'Cría con Semillas' },
  sheep:   { name:'Oveja',    emoji:'🐑', cost:60,  breedFood:['wheat'],              breedAmt:2, produces:[{item:'wool',  every:2,qty:2}], butcher:null,                  desc:'Lana cada 2 días',                    tip:'Cría con Trigo' },
  pig:     { name:'Cerdo',    emoji:'🐷', cost:50,  breedFood:['carrot','beetroot'],  breedAmt:2, produces:[],                             butcher:{item:'pork',qty:3},   desc:'Carne al sacrificar (no produce)',     tip:'Cría con Zanahoria/Remolacha' },
  llama:   { name:'Llama',    emoji:'🦙', cost:120, breedFood:['wheat'],              breedAmt:2, produces:[{item:'leather',every:3,qty:2}], butcher:null,                desc:'Cuero cada 3 días',                   tip:'Cría con Trigo' },
  horse:   { name:'Caballo',  emoji:'🐎', cost:200, breedFood:['apple'],              breedAmt:2, produces:[],                             butcher:null, sell:350,         desc:'Para vender (precio alto)',           tip:'Cría con Manzanas' },
};

/* ─── CULTIVOS ──────────────────────────────────────────── */
const CROPS = {
  wheat:     { name:'Trigo',            emoji:'🌾', grow:2, cost:5,  gives:[{item:'wheat',qty:3},{item:'seeds',qty:4}], perennial:false },
  carrot:    { name:'Zanahoria',        emoji:'🥕', grow:2, cost:8,  gives:[{item:'carrot',qty:4}],                    perennial:false },
  beetroot:  { name:'Remolacha',        emoji:'🫚', grow:2, cost:8,  gives:[{item:'beetroot',qty:3}],                  perennial:false },
  sugarcane: { name:'Caña de Azúcar',   emoji:'🎋', grow:3, cost:10, gives:[{item:'sugarcane',qty:4}],                 perennial:false },
  apple:     { name:'Manzano',          emoji:'🍎', grow:4, cost:20, gives:[{item:'apple',qty:3}],                     perennial:true  },
};

/* ─── RECURSOS (items del inventario) ─────────────────── */
const ITEMS = {
  // Animal products
  milk:     { name:'Leche',          emoji:'🥛', category:'prod',    value:15 },
  egg:      { name:'Huevo',          emoji:'🥚', category:'prod',    value:10 },
  feather:  { name:'Pluma',          emoji:'🪶', category:'prod',    value:14 },
  wool:     { name:'Lana',           emoji:'🧶', category:'prod',    value:18 },
  beef:     { name:'Carne de Res',   emoji:'🥩', category:'prod',    value:22 },
  pork:     { name:'Chuleta Cruda',  emoji:'🥓', category:'prod',    value:20 },
  leather:  { name:'Cuero',          emoji:'👜', category:'prod',    value:28 },
  // Crops
  wheat:    { name:'Trigo',          emoji:'🌾', category:'crop',    value:8  },
  seeds:    { name:'Semillas',       emoji:'🌱', category:'crop',    value:3  },
  carrot:   { name:'Zanahoria',      emoji:'🥕', category:'crop',    value:10 },
  beetroot: { name:'Remolacha',      emoji:'🫚', category:'crop',    value:10 },
  sugarcane:{ name:'Caña de Azúcar', emoji:'🎋', category:'crop',    value:9  },
  apple:    { name:'Manzana',        emoji:'🍎', category:'crop',    value:15 },
  // Crafted
  book:     { name:'Libro',          emoji:'📚', category:'crafted', value:120 },
  bread:    { name:'Pan',            emoji:'🍞', category:'crafted', value:55  },
  cake:     { name:'Pastel',         emoji:'🎂', category:'crafted', value:130 },
  wool_jacket:{ name:'Chaqueta',     emoji:'🧥', category:'crafted', value:160 },
  leather_helmet:{ name:'Casco',     emoji:'⛑️', category:'crafted', value:200 },
  arrow:    { name:'Flechas×4',      emoji:'🏹', category:'crafted', value:80  },
  enchanted_book:{ name:'Libro Encantado', emoji:'📖', category:'crafted', value:300 },
  wool_scarf: { name:'Bufanda',      emoji:'🧣', category:'crafted', value:90  },
  carrot_soup:{ name:'Sopa',         emoji:'🥣', category:'crafted', value:60  },
  music_disc: { name:'Disco Musical',emoji:'🎵', category:'crafted', value:450 },
  steak:    { name:'Filete Hecho',   emoji:'🍖', category:'crafted', value:65  },
};

/* ─── RECETAS DE CRAFTEO ──────────────────────────────── */
const RECIPES = [
  { id:'bread',         name:'Pan',              emoji:'🍞', needs:{wheat:3},                           desc:'Básico pero muy pedido' },
  { id:'book',          name:'Libro',            emoji:'📚', needs:{feather:1, leather:1, sugarcane:1}, desc:'Imprescindible para pedidos especiales' },
  { id:'cake',          name:'Pastel',           emoji:'🎂', needs:{milk:1, egg:2, wheat:2},            desc:'Celebración popular en el pueblo' },
  { id:'wool_scarf',    name:'Bufanda',          emoji:'🧣', needs:{wool:2},                            desc:'Perfecta para el invierno' },
  { id:'wool_jacket',   name:'Chaqueta de Lana', emoji:'🧥', needs:{wool:4},                            desc:'Ropa de calidad para los aldeanos' },
  { id:'leather_helmet',name:'Casco de Cuero',   emoji:'⛑️', needs:{leather:5},                         desc:'Protección básica, muy valorada' },
  { id:'arrow',         name:'Flechas (×4)',      emoji:'🏹', needs:{feather:3, sugarcane:1},            desc:'Caza y combate. Vienen de a 4' },
  { id:'steak',         name:'Filete a la Brasa', emoji:'🍖', needs:{beef:2},                            desc:'Carne cocinada, mejor precio' },
  { id:'carrot_soup',   name:'Sopa de Zanahoria', emoji:'🥣', needs:{carrot:2, beetroot:1},              desc:'Sopa nutritiva del pueblo' },
  { id:'enchanted_book',name:'Libro Encantado',   emoji:'📖', needs:{book:2, feather:2},                 desc:'Raro y muy valioso. Alta demanda' },
  { id:'music_disc',    name:'Disco Musical',     emoji:'🎵', needs:{book:1, feather:2, wool:1},         desc:'Artículo de lujo. Vale mucho oro' },
];

/* ─── CLIENTES (pool) ─────────────────────────────────── */
const CLIENT_POOL = [
  { name:'Villager Granjero', emoji:'🧑‍🌾', type:'normal',  color:'green',  orders:['milk','egg','wool','bread','wheat','carrot'] },
  { name:'Chef del Pueblo',   emoji:'👨‍🍳', type:'premium', color:'gold',   orders:['milk','egg','cake','bread','carrot_soup','steak'] },
  { name:'Caballero',         emoji:'⚔️', type:'premium', color:'amber',  orders:['leather_helmet','arrow','beef','pork','leather'] },
  { name:'Bibliotecario',     emoji:'📚', type:'special', color:'purple', orders:['book','enchanted_book','feather'] },
  { name:'Modista',           emoji:'🧵', type:'normal',  color:'pink',   orders:['wool','wool_jacket','wool_scarf','feather'] },
  { name:'Gobernador',        emoji:'🏛️', type:'premium', color:'gold',   orders:['cake','music_disc','enchanted_book','wool_jacket'] },
  { name:'Mercader',          emoji:'🏪', type:'normal',  color:'green',  orders:['leather','milk','egg','pork','beef','apple'] },
  { name:'Aventurero',        emoji:'🗡️', type:'normal',  color:'amber',  orders:['arrow','steak','carrot','bread','pork'] },
  { name:'Pastora',           emoji:'🐑', type:'normal',  color:'green',  orders:['wool','wool_scarf','milk','egg'] },
  { name:'Alquimista',        emoji:'🧙', type:'special', color:'purple', orders:['feather','music_disc','sugarcane','book','apple'] },
];

/* ─── EVENTOS DIARIOS ─────────────────────────────────── */
const DAILY_EVENTS = [
  { id:'sunny',    emoji:'🌞', title:'¡Día Soleado!',         desc:'Los animales producen un 50% más hoy.',          type:'good',    effect:'prod_boost',  value:0.5  },
  { id:'rain',     emoji:'🌧️', title:'¡Lluvia de Verano!',    desc:'Los cultivos crecen 1 día extra hoy.',          type:'good',    effect:'crop_boost',  value:1    },
  { id:'fair',     emoji:'🎪', title:'¡Feria del Pueblo!',    desc:'Los pedidos completos pagan un 40% más.',       type:'good',    effect:'order_boost', value:0.4  },
  { id:'wanderer', emoji:'🧳', title:'Mercader Errante',      desc:'Un viajero misterioso te deja 120 💰.',         type:'special', effect:'bonus_gold',  value:120  },
  { id:'nest',     emoji:'🐣', title:'¡Sorpresa del Nido!',   desc:'Las gallinas ponen el doble de huevos hoy.',    type:'good',    effect:'chicken_x2',  value:0    },
  { id:'trade',    emoji:'💎', title:'Precios Premium',       desc:'Los items crafteados valen 2× en pedidos hoy.', type:'special', effect:'craft_x2',    value:0    },
  { id:'storm',    emoji:'⛈️', title:'¡Tormenta!',            desc:'Los cultivos tardan 1 día más.',                type:'bad',     effect:'crop_slow',   value:1    },
  { id:'wolf',     emoji:'🐺', title:'¡Ataque de Lobos!',     desc:'Los corrales están en peligro. Pierdes 1 animal aleatorio (si tienes >1).', type:'bad', effect:'wolf', value:0 },
  { id:'disease',  emoji:'🤧', title:'Enfermedad Animal',     desc:'Un corral aleatorio no produce hoy.',           type:'bad',     effect:'sick',        value:0    },
  { id:'drought',  emoji:'🥵', title:'¡Sequía!',              desc:'Sin lluvia — los cultivos tardan 1 día más hoy.',type:'bad',    effect:'crop_slow',   value:1    },
  { id:'fire',     emoji:'🔥', title:'¡Pequeño Incendio!',    desc:'Un cultivo aleatorio se pierde.',               type:'bad',     effect:'fire',        value:0    },
  { id:'market',   emoji:'📉', title:'Caída del Mercado',     desc:'Los pedidos pagan -30% hoy.',                   type:'bad',     effect:'order_nerf',  value:-0.3 },
  { id:'normal',   emoji:'☀️', title:'Día Normal',            desc:'Sin eventos especiales. ¡Trabaja duro!',        type:'neutral', effect:'none',        value:0    },
  { id:'normal2',  emoji:'🌤️', title:'Buen Día',              desc:'El tiempo es agradable en la granja.',          type:'neutral', effect:'none',        value:0    },
];

/* ─── ESTADO ─────────────────────────────────────────────── */
let G = {};

function newGame() {
  G = {
    gold: 200,
    day: 1, maxDays: 30,
    animals: { cow:2, chicken:3, sheep:2, pig:2, llama:0, horse:0 },
    pendingProd: {},      // { animalId_item: qty }
    prodTimers: {},       // { cow_milk: 0, chicken_feather: 1, ... }
    inv: { wheat:5, seeds:8, carrot:5, beetroot:3 },
    garden: Array.from({length:8}, ()=>({ state:'empty', cropId:null, daysLeft:0, growDays:0, perennial:false })),
    orders: [],
    orderId: 1,
    todayEvent: null,
    orderMultiplier: 1,
    craftMultiplier: 1,
    prodMultiplier:  1,
    sickCorral: null,
    stats: { earned:0, orders:0, crafted:0, harvested:0, animals_bred:0 },
    savedAt: null,
  };

  // Init prod timers
  initProdTimers();
  saveGame();
}

function initProdTimers() {
  Object.keys(ANIMALS).forEach(aid => {
    ANIMALS[aid].produces.forEach(p => {
      const key = aid+'_'+p.item;
      if (G.prodTimers[key] === undefined) G.prodTimers[key] = 0;
    });
  });
}

/* ─── GUARDADO ─────────────────────────────────────────────── */
function saveGame() {
  G.savedAt = new Date().toLocaleString('es');
  localStorage.setItem(SAVE_KEY, JSON.stringify(G));
  toast('💾 Partida guardada');
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch(e) { return null; }
}

function deleteSave() { localStorage.removeItem(SAVE_KEY); }

/* ─── TÍTULO ─────────────────────────────────────────────── */
function renderTitleScreen() {
  const save = loadGame();
  const btns = document.getElementById('title-btns');
  const prev = document.getElementById('save-preview');

  if (save) {
    btns.innerHTML = `
      <button class="btn-main" id="btn-continue">▶️ Continuar Partida</button>
      <button class="btn-main secondary" id="btn-new">🌱 Nueva Partida</button>`;
    prev.style.display = '';
    prev.innerHTML = `<b>Partida guardada:</b> Día ${save.day}/${save.maxDays} · 💰 ${save.gold} oro · Guardado: ${save.savedAt||'Desconocido'}`;
    document.getElementById('btn-continue').addEventListener('click', ()=>{
      G = save;
      initProdTimers();
      startGame();
    });
    document.getElementById('btn-new').addEventListener('click', ()=>{
      if (confirm('¿Seguro? Se borrará la partida guardada.')) {
        deleteSave(); newGame(); startGame();
      }
    });
  } else {
    btns.innerHTML = `<button class="btn-main" id="btn-new-only">🌱 Nueva Partida</button>`;
    document.getElementById('btn-new-only').addEventListener('click', ()=>{ newGame(); startGame(); });
  }
}

function startGame() {
  document.getElementById('game-hud').style.display = '';
  showScreen('game');
  renderAll();
  logAct('system',`🌅 Bienvenido a tu granja. Día ${G.day} de ${G.maxDays}.`);
  logAct('good','💡 Haz clic en los corrales para recoger, reproducir o sacrificar animales.');
  if (G.day === 1) spawnOrders(2);
  updateHUD();
}

/* ─── PANTALLAS ─────────────────────────────────────────────── */
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-'+name)?.classList.add('active');
}

/* ─── HUD ─────────────────────────────────────────────────── */
function updateHUD() {
  document.getElementById('h-gold').textContent = G.gold.toLocaleString();
  document.getElementById('h-day').textContent  = G.day;
  const invTotal = Object.values(G.inv).reduce((a,b)=>a+b,0);
  document.getElementById('h-invcount').textContent = invTotal;

  if (G.todayEvent) {
    const el = document.getElementById('h-event-badge');
    el.textContent = G.todayEvent.emoji+' '+G.todayEvent.title;
    el.style.borderColor = G.todayEvent.type==='bad'?'rgba(239,83,80,.4)':G.todayEvent.type==='special'?'rgba(249,168,37,.4)':'rgba(93,148,38,.4)';
    el.style.color = G.todayEvent.type==='bad'?'#ff8a80':G.todayEvent.type==='special'?'var(--gold)':'var(--leaf)';
    el.style.background = G.todayEvent.type==='bad'?'rgba(239,83,80,.1)':G.todayEvent.type==='special'?'rgba(249,168,37,.08)':'rgba(93,148,38,.12)';
  }

  // Orders badge
  const pending = G.orders.length;
  const badge = document.getElementById('pedidos-badge');
  if (pending > 0) { badge.textContent = pending; badge.style.display = 'inline-flex'; }
  else badge.style.display = 'none';
}

function renderAll() {
  renderCorrales();
  renderHuerto();
  renderCrafteo();
  renderTienda('animales');
  renderPedidos();
  renderInventory();
  renderSidebar();
  updateHUD();
}

/* ─── CORRALES ─────────────────────────────────────────────── */
function renderCorrales() {
  const grid = document.getElementById('corrales-grid');
  grid.innerHTML = '';

  Object.entries(ANIMALS).forEach(([aid, aData]) => {
    const count = G.animals[aid] || 0;
    const pendingKey = Object.keys(G.pendingProd).filter(k=>k.startsWith(aid+'_'));
    const totalPending = pendingKey.reduce((a,k)=>a+G.pendingProd[k],0);
    const hasPending = totalPending > 0;

    const card = document.createElement('div');
    card.className = 'corral-card' + (hasPending?' has-pending':'');

    // Animal bars (visual count, max 8)
    const maxBars = 8;
    const bars = Array.from({length:Math.min(maxBars,Math.max(1,count))},(_,i)=>
      `<div class="abar${i>=count?' empty':''}"></div>`).join('');

    // Production summary
    const prodSummary = aData.produces.map(p=>{
      const timer = G.prodTimers[aid+'_'+p.item]||0;
      return `<div class="prod-chip">${ITEMS[p.item]?.emoji||''} cada ${p.every}d (T-${timer})</div>`;
    }).join('');

    // Pending collection
    const pendingStr = hasPending
      ? pendingKey.map(k=>{ const [,item]=k.split('_'); return `${ITEMS[item]?.emoji||''}×${G.pendingProd[k]}`; }).join(' ')
      : '';

    // Action buttons
    const canBreed  = count >= 2;
    const canSlaughter = aData.butcher && count > 0;
    const canSell   = aData.sell && count > 0;

    card.innerHTML = `
      <div class="corral-head">
        <div class="corral-emoji">${aData.emoji}</div>
        <div class="corral-info">
          <div class="corral-name">${aData.name}</div>
          <div class="corral-count">${count} animales · ${aData.tip}</div>
          <div class="animal-bars">${bars}</div>
        </div>
      </div>
      ${hasPending
        ? `<div class="corral-pending" data-aid="${aid}">🧺 Recoger: ${pendingStr}</div>`
        : `<div class="corral-pending corral-pending-hidden" data-aid="${aid}"></div>`}
      <div class="corral-prod">${prodSummary||'<div class="prod-chip">Sin producción diaria</div>'}</div>
      <div class="corral-actions">
        <button class="ca-btn green" data-action="buy" data-aid="${aid}" title="Comprar">🛒 Comprar</button>
        <button class="ca-btn amber ${!canBreed?'':''}${!canBreed?' ':''}" data-action="breed" data-aid="${aid}" ${!canBreed?'disabled':''} title="Reproducir (≥2)">🐣 Criar</button>
        ${aData.sell
          ? `<button class="ca-btn blue" data-action="sell-horse" data-aid="${aid}" ${!canSell?'disabled':''}>💰 Vender</button>`
          : aData.butcher
            ? `<button class="ca-btn red" data-action="slaughter" data-aid="${aid}" ${!canSlaughter?'disabled':''}>⚔️ Sacrificar</button>`
            : `<button class="ca-btn" style="visibility:hidden">-</button>`
        }
      </div>`;

    // Collect pending
    card.querySelector('.corral-pending')?.addEventListener('click', ()=>collectPending(aid));

    // Buttons
    card.querySelectorAll('[data-action]').forEach(btn=>{
      const action = btn.dataset.action;
      btn.addEventListener('click', ()=>{
        if (action==='buy') goToBuyAnimal(aid);
        else if (action==='breed') openBreedModal(aid);
        else if (action==='slaughter') openSlaughterModal(aid);
        else if (action==='sell-horse') openHorseModal(aid);
      });
    });

    grid.appendChild(card);
  });
}

function collectPending(aid) {
  const keys = Object.keys(G.pendingProd).filter(k=>k.startsWith(aid+'_'));
  if (keys.length===0) return;
  const collected = [];
  keys.forEach(k=>{
    const [,item]=k.split('_');
    const qty = G.pendingProd[k];
    addInv(item, qty);
    collected.push(`${ITEMS[item]?.emoji||''}×${qty}`);
    delete G.pendingProd[k];
  });
  toast(`✅ Recolectado: ${collected.join(' ')}`);
  logAct('good',`🧺 ${ANIMALS[aid].name}: recogiste ${collected.join(' ')}`);
  renderCorrales();
  renderInventory();
  updateHUD();
  saveGame();
}

/* ── BREED MODAL ── */
let breedTarget = null;
function openBreedModal(aid) {
  breedTarget = aid;
  const a = ANIMALS[aid];
  document.getElementById('breed-title').textContent = `🐣 Reproducir ${a.emoji} ${a.name}`;

  const canBreed = G.animals[aid] >= 2;
  const foodReqs = a.breedFood.map(f=>{
    const have = G.inv[f]||0;
    const need = a.breedAmt;
    const ok = have >= need;
    return { f, have, need, ok };
  });
  // At least one food option must be met
  const canDo = canBreed && foodReqs.some(r=>r.ok);

  const body = document.getElementById('breed-body');
  body.innerHTML = `
    <div class="info-block ${!canBreed?'warning':'success'}">
      <b>${a.name}s disponibles:</b> ${G.animals[aid]}<br>
      <b>Necesitas:</b> Al menos 2 animales del mismo tipo.
    </div>
    <div class="info-block success">
      <b>Comida para criar (elige una opción):</b>
      <div class="req-chips">
        ${foodReqs.map(r=>`<div class="req-chip ${r.ok?'rc-ok':'rc-bad'}">${ITEMS[r.f]?.emoji||''}×${r.need} (tienes ${r.have})</div>`).join('')}
      </div>
    </div>
    <div class="result-preview">🎉 Resultado: +1 ${a.emoji} ${a.name} bebé</div>
    <button class="btn-main" id="breed-confirm" ${!canDo?'disabled':''}>🐣 Criar (+1 ${a.name})</button>`;

  document.getElementById('breed-confirm').addEventListener('click', ()=>doBreed(aid));
  document.getElementById('modal-breed').classList.remove('hidden');
}

function doBreed(aid) {
  const a = ANIMALS[aid];
  const foodReqs = a.breedFood.map(f=>({f, have:G.inv[f]||0, need:a.breedAmt}));
  const usable = foodReqs.find(r=>r.have>=r.need);
  if (!usable) { toast('❌ No tienes comida suficiente'); return; }
  if (G.animals[aid] < 2) { toast('❌ Necesitas al menos 2 '+a.name+'s'); return; }

  removeInv(usable.f, usable.breedAmt||a.breedAmt);
  G.animals[aid]++;
  G.stats.animals_bred++;
  document.getElementById('modal-breed').classList.add('hidden');
  toast(`🐣 ¡+1 ${a.emoji} ${a.name}! Ahora tienes ${G.animals[aid]}.`);
  logAct('good',`🐣 Criaste un ${a.name}. Total: ${G.animals[aid]}`);
  renderCorrales(); updateHUD(); saveGame();
}

/* ── SLAUGHTER MODAL ── */
let slaughterTarget = null;
function openSlaughterModal(aid) {
  slaughterTarget = aid;
  const a = ANIMALS[aid];
  if (!a.butcher) return;
  const count = G.animals[aid];

  const body = document.getElementById('sl-body');
  document.getElementById('sl-title').textContent = `⚔️ Sacrificar ${a.emoji} ${a.name}`;

  let slQty = 1;
  const updatePreview = ()=>{
    const obtains = `+${slQty*a.butcher.qty} ${ITEMS[a.butcher.item]?.emoji||''} ${ITEMS[a.butcher.item]?.name||''}`;
    const remaining = count - slQty;
    body.querySelector('#sl-preview').textContent = obtains;
    body.querySelector('#sl-remaining').textContent = `Te quedarán: ${remaining} ${a.name}${remaining!==1?'s':''}`;
    body.querySelector('#sl-remaining').style.color = remaining===0?'var(--red)':'var(--muted)';
    body.querySelector('#sl-qty').value = slQty;
  };

  body.innerHTML = `
    <div class="info-block warning">⚠️ Al sacrificar ${a.name}s obtienes carne, pero reduces tu manada.<br>Si llegas a 0 no podrás producir más sin comprar nuevos.</div>
    <div class="info-block success">
      Obtendrás: <b id="sl-preview"></b> por animal<br>
      <span id="sl-remaining" style="font-size:.8rem"></span>
    </div>
    <div class="qty-row" style="justify-content:center">
      <button class="q-btn" id="sl-minus">−</button>
      <input class="q-inp" type="number" id="sl-qty" value="1" min="1" max="${count}"/>
      <button class="q-btn" id="sl-plus">＋</button>
    </div>
    <button class="btn-main gold" id="sl-confirm">⚔️ Sacrificar</button>`;

  updatePreview();
  body.querySelector('#sl-minus').addEventListener('click',()=>{ slQty=Math.max(1,slQty-1); updatePreview(); });
  body.querySelector('#sl-plus').addEventListener('click',()=>{ slQty=Math.min(count,slQty+1); updatePreview(); });
  body.querySelector('#sl-qty').addEventListener('input',e=>{ slQty=Math.max(1,Math.min(count,+e.target.value||1)); updatePreview(); });
  body.querySelector('#sl-confirm').addEventListener('click',()=>doSlaughter(aid,slQty));
  document.getElementById('modal-slaughter').classList.remove('hidden');
}

function doSlaughter(aid, qty) {
  const a = ANIMALS[aid];
  if (!a.butcher||G.animals[aid]<qty) return;
  G.animals[aid] -= qty;
  const obtained = qty * a.butcher.qty;
  addInv(a.butcher.item, obtained);
  document.getElementById('modal-slaughter').classList.add('hidden');
  toast(`⚔️ Sacrificaste ${qty} ${a.emoji}. +${obtained} ${ITEMS[a.butcher.item]?.emoji||''}`);
  logAct(G.animals[aid]===0?'bad':'good',`⚔️ ${qty} ${a.name} sacrificados. +${obtained} ${ITEMS[a.butcher.item]?.name||''}`);
  renderCorrales(); renderInventory(); updateHUD(); saveGame();
}

/* ── HORSE SELL MODAL ── */
function openHorseModal(aid) {
  const a = ANIMALS[aid];
  const count = G.animals[aid];
  let sellQty = 1;
  const body = document.getElementById('horse-body');

  const upd = ()=>{
    const earn = sellQty * a.sell;
    body.querySelector('#hs-total').textContent = earn.toLocaleString()+' 💰';
    body.querySelector('#hs-qty').value = sellQty;
  };
  body.innerHTML = `
    <div style="padding:18px;display:flex;flex-direction:column;gap:14px;align-items:center">
      <div class="info-block success">Tienes <b>${count} 🐎 Caballos</b>. Cada uno vale <b>${a.sell} 💰</b>.</div>
      <div class="qty-row">
        <button class="q-btn" id="hs-minus">−</button>
        <input class="q-inp" type="number" id="hs-qty" value="1" min="1" max="${count}"/>
        <button class="q-btn" id="hs-plus">＋</button>
      </div>
      <div style="font-size:1rem;color:var(--muted)">Total: <strong id="hs-total" style="color:var(--gold);font-family:var(--mono)"></strong></div>
      <button class="btn-main gold" id="hs-confirm">💰 Vender</button>
    </div>`;
  upd();
  body.querySelector('#hs-minus').addEventListener('click',()=>{ sellQty=Math.max(1,sellQty-1); upd(); });
  body.querySelector('#hs-plus').addEventListener('click',()=>{ sellQty=Math.min(count,sellQty+1); upd(); });
  body.querySelector('#hs-qty').addEventListener('input',e=>{ sellQty=Math.max(1,Math.min(count,+e.target.value||1)); upd(); });
  body.querySelector('#hs-confirm').addEventListener('click',()=>{
    G.animals[aid] -= sellQty;
    const earn = sellQty * a.sell;
    G.gold += earn; G.stats.earned += earn;
    document.getElementById('modal-horse').classList.add('hidden');
    toast(`💰 Vendiste ${sellQty} 🐎 por ${earn.toLocaleString()} 💰`);
    logAct('gold',`🐎 Vendiste ${sellQty} Caballo${sellQty>1?'s':''}. +${earn.toLocaleString()} 💰`);
    renderCorrales(); updateHUD(); saveGame();
  });
  document.getElementById('modal-horse').classList.remove('hidden');
}

function goToBuyAnimal(aid) {
  // Switch to tienda tab, animal category
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t=>t.classList.remove('active'));
  document.querySelector('[data-tab="tienda"]').classList.add('active');
  document.getElementById('tab-tienda').classList.add('active');
  renderTienda('animales');
  toast('🛒 Compra de animales en la Tienda');
}

/* ─── HUERTO ─────────────────────────────────────────────── */
function renderHuerto() {
  const grid = document.getElementById('huerto-grid');
  grid.innerHTML = '';
  G.garden.forEach((slot, i) => {
    const div = document.createElement('div');
    let className = 'crop-slot';
    if (slot.state==='ready') className += slot.perennial?' perennial-ready':' ready';
    div.className = className;

    if (slot.state==='empty') {
      div.innerHTML = `<div class="cs-emoji" style="opacity:.3">🟫</div><div class="cs-label">Vacía</div><div class="cs-days">Tocar</div>`;
      div.addEventListener('click',()=>openPlantModal(i));
    } else if (slot.state==='growing') {
      const crop = CROPS[slot.cropId];
      const pct  = Math.round(((crop.grow-slot.daysLeft)/crop.grow)*100);
      div.innerHTML = `<div class="cs-emoji">${crop.emoji}</div><div class="cs-label">${crop.name}</div><div class="cs-days">⏳${slot.daysLeft}d</div><div class="cs-bar" style="width:${pct}%"></div>`;
    } else if (slot.state==='ready') {
      const crop = CROPS[slot.cropId];
      div.innerHTML = `<div class="cs-badge ${slot.perennial?'csb-gold':'csb-ready'}">${slot.perennial?'🌳':'✅'}</div><div class="cs-emoji">${crop.emoji}</div><div class="cs-label">${crop.name}</div><div class="cs-days" style="color:var(--grass)">Cosechar</div>`;
      div.addEventListener('click',()=>harvestPlot(i));
    }
    grid.appendChild(div);
  });
}

function openPlantModal(slotIdx) {
  document.getElementById('plnt-num').textContent = slotIdx+1;
  const opts = document.getElementById('plant-options');
  opts.innerHTML = '';

  Object.entries(CROPS).forEach(([cid,crop])=>{
    const hasSeed = (G.inv.seeds||0) >= 1 || G.gold >= crop.cost;
    const canAfford = G.gold >= crop.cost;
    const btn = document.createElement('button');
    btn.className = 'po-btn';
    btn.disabled  = !canAfford;
    btn.innerHTML = `
      <div class="po-emoji">${crop.emoji}</div>
      <div class="po-name">${crop.name}</div>
      <div class="po-info">
        <span class="po-cost">🌱 ${crop.cost} 💰</span>
        <span>⏱️ ${crop.grow} días</span>
        ${crop.perennial?'<span style="color:var(--gold)">♻️ Perenne</span>':''}
        <span>Da: ${crop.gives.map(g=>`${ITEMS[g.item]?.emoji||''}×${g.qty}`).join(' ')}</span>
      </div>`;
    btn.addEventListener('click',()=>plantCrop(slotIdx, cid));
    opts.appendChild(btn);
  });

  document.getElementById('modal-plant').classList.remove('hidden');
}

function plantCrop(slotIdx, cropId) {
  const crop = CROPS[cropId];
  if (G.gold < crop.cost) { toast('❌ Sin oro suficiente'); return; }
  G.gold -= crop.cost;
  const slot = G.garden[slotIdx];
  slot.state   = 'growing';
  slot.cropId  = cropId;
  slot.daysLeft= crop.grow;
  slot.growDays= crop.grow;
  slot.perennial = crop.perennial;
  document.getElementById('modal-plant').classList.add('hidden');
  toast(`🌱 Plantaste ${crop.emoji} ${crop.name} — lista en ${crop.grow} días`);
  logAct('good',`🌱 Plantaste ${crop.emoji} ${crop.name} (${crop.grow}d)`);
  renderHuerto(); updateHUD(); saveGame();
}

function harvestPlot(slotIdx) {
  const slot  = G.garden[slotIdx];
  const crop  = CROPS[slot.cropId];
  crop.gives.forEach(g=>{ addInv(g.item, g.qty); });
  G.stats.harvested++;
  const obtained = crop.gives.map(g=>`${ITEMS[g.item]?.emoji||''}×${g.qty}`).join(' ');
  toast(`✅ Cosechaste ${crop.emoji}: ${obtained}`);
  logAct('gold',`🌾 ${crop.name} cosechada: ${obtained}`);
  if (slot.perennial) {
    // Stays planted, resets timer
    slot.state    = 'growing';
    slot.daysLeft = crop.grow;
  } else {
    slot.state = 'empty'; slot.cropId = null;
  }
  renderHuerto(); renderInventory();
  checkMissionProgress();
  updateHUD(); saveGame();
}

/* ─── CRAFTEO ────────────────────────────────────────────── */
function renderCrafteo() {
  const grid = document.getElementById('recipes-grid');
  grid.innerHTML = '';

  RECIPES.forEach(recipe => {
    const canCraft = canCraftRecipe(recipe);
    const card = document.createElement('div');
    card.className = 'recipe-card' + (!canCraft?' cant-craft':'');

    const needsHtml = Object.entries(recipe.needs).map(([item,qty])=>{
      const have = G.inv[item]||0;
      const ok   = have >= qty;
      const em   = ITEMS[item]?.emoji||'';
      return `<div class="rn-chip ${ok?'rn-ok':'rn-missing'}">${em}×${qty}${!ok?` (${have})`:''}</div>`;
    }).join('');

    card.innerHTML = `
      <div class="rc-top">
        <div class="rc-emoji">${recipe.emoji}</div>
        <div class="rc-info">
          <div class="rc-name">${recipe.name}</div>
          <div class="rc-value">Valor: ${ITEMS[recipe.id]?.value||0} 💰</div>
        </div>
      </div>
      <div class="rc-needs">${needsHtml}</div>`;

    if (canCraft) card.addEventListener('click',()=>openCraftModal(recipe));
    grid.appendChild(card);
  });
}

function canCraftRecipe(recipe) {
  return Object.entries(recipe.needs).every(([item,qty])=>(G.inv[item]||0)>=qty);
}

function openCraftModal(recipe) {
  document.getElementById('mc-icon').textContent = recipe.emoji;
  document.getElementById('mc-name').textContent = recipe.name;
  document.getElementById('mc-desc').textContent = recipe.desc||'';

  const body = document.getElementById('mc-body');
  const needsHtml = Object.entries(recipe.needs).map(([item,qty])=>{
    const em = ITEMS[item]?.emoji||'';
    const have = G.inv[item]||0;
    return `<div class="rn-chip rn-ok">${em} ${ITEMS[item]?.name||item} ×${qty} (tienes ${have})</div>`;
  }).join('');

  let craftQty = 1;
  const maxPossible = Math.max(1, Math.min(...Object.entries(recipe.needs).map(([item,qty])=>Math.floor((G.inv[item]||0)/qty))));

  const upd = ()=>{
    body.querySelector('#cr-qty').value = craftQty;
    body.querySelector('#cr-total-val').textContent = (craftQty * (ITEMS[recipe.id]?.value||0)).toLocaleString();
  };

  body.innerHTML = `
    <div style="padding:0 20px 8px">
      <div class="rc-needs" style="margin-bottom:12px">${needsHtml}</div>
      <div class="result-preview">Producirás: ${recipe.emoji} ${recipe.name} · Valor: <span id="cr-total-val"></span> 💰</div>
      <div class="qty-row" style="justify-content:center;margin:14px 0">
        <button class="q-btn" id="cr-minus">−</button>
        <input class="q-inp" type="number" id="cr-qty" value="1" min="1" max="${maxPossible}"/>
        <button class="q-btn" id="cr-plus">＋</button>
      </div>
      <button class="btn-main" id="cr-confirm">⚗️ Craftear</button>
    </div>`;

  upd();
  body.querySelector('#cr-minus').addEventListener('click',()=>{ craftQty=Math.max(1,craftQty-1); upd(); });
  body.querySelector('#cr-plus').addEventListener('click',()=>{ craftQty=Math.min(maxPossible,craftQty+1); upd(); });
  body.querySelector('#cr-qty').addEventListener('input',e=>{ craftQty=Math.max(1,Math.min(maxPossible,+e.target.value||1)); upd(); });
  body.querySelector('#cr-confirm').addEventListener('click',()=>doCraft(recipe, craftQty));
  document.getElementById('modal-craft').classList.remove('hidden');
}

function doCraft(recipe, qty) {
  if (!canCraftRecipe(recipe)) { toast('❌ Sin materiales'); return; }
  Object.entries(recipe.needs).forEach(([item,need])=>removeInv(item, need*qty));
  addInv(recipe.id, qty);
  G.stats.crafted += qty;
  document.getElementById('modal-craft').classList.add('hidden');
  toast(`⚗️ Crafteaste ${qty}× ${recipe.emoji} ${recipe.name}`);
  logAct('gold',`⚗️ Crafteado: ${qty}× ${recipe.emoji} ${recipe.name}`);
  renderCrafteo(); renderInventory(); updateHUD(); saveGame();
}

/* ─── TIENDA ─────────────────────────────────────────────── */
const SHOP_DATA = {
  animales: Object.entries(ANIMALS).map(([id,a])=>({ id, emoji:a.emoji, name:a.name, price:a.cost, desc:a.desc, type:'animal' })),
  semillas: [
    { id:'wheat',     emoji:'🌾', name:'Semillas Trigo',     price:5,  desc:'Grow 2d → Trigo+Semillas', type:'seed', cropId:'wheat' },
    { id:'carrot',    emoji:'🥕', name:'Semillas Zanahoria', price:8,  desc:'Grow 2d → 4 Zanahorias',  type:'seed', cropId:'carrot' },
    { id:'beetroot',  emoji:'🫚', name:'Semillas Remolacha', price:8,  desc:'Grow 2d → 3 Remolachas',  type:'seed', cropId:'beetroot' },
    { id:'sugarcane', emoji:'🎋', name:'Caña de Azúcar',     price:10, desc:'Grow 3d → 4 Cañas',       type:'seed', cropId:'sugarcane' },
    { id:'apple',     emoji:'🍎', name:'Plantón Manzano',    price:20, desc:'Grow 4d, perenne → Manzanas', type:'seed', cropId:'apple' },
  ],
  materiales: [
    { id:'feather',   emoji:'🪶', name:'Pluma extra',        price:18,  desc:'Para craftear libros/flechas', type:'item', itemId:'feather' },
    { id:'leather',   emoji:'👜', name:'Cuero extra',        price:30,  desc:'Para craftear cascos/libros',  type:'item', itemId:'leather' },
    { id:'wheat_bulk',emoji:'🌾', name:'Trigo ×5',           price:35,  desc:'Bulk de trigo',                type:'item_bulk', itemId:'wheat', qty:5 },
    { id:'seeds_bulk',emoji:'🌱', name:'Semillas ×10',       price:25,  desc:'Bulk de semillas',             type:'item_bulk', itemId:'seeds', qty:10 },
  ]
};

let currentShopCat = 'animales';
function renderTienda(cat) {
  currentShopCat = cat;
  document.querySelectorAll('.shop-cat').forEach(b=>b.classList.toggle('active', b.dataset.cat===cat));
  const items = SHOP_DATA[cat]||[];
  const grid  = document.getElementById('shop-grid');
  grid.innerHTML = '';
  items.forEach(item=>{
    const canAfford = G.gold >= item.price;
    const div = document.createElement('div');
    div.className = 'shop-item' + (!canAfford?' cant-buy':'');
    div.innerHTML = `
      <div class="si-emoji">${item.emoji}</div>
      <div class="si-name">${item.name}</div>
      <div class="si-price">${item.price} 💰</div>
      <div class="si-desc">${item.desc}</div>`;
    if (canAfford) div.addEventListener('click',()=>buyShopItem(item));
    grid.appendChild(div);
  });
}

function buyShopItem(item) {
  if (G.gold < item.price) { toast('❌ No tienes suficiente oro'); return; }
  G.gold -= item.price;
  if (item.type==='animal') {
    G.animals[item.id] = (G.animals[item.id]||0)+1;
    toast(`✅ Compraste 1 ${item.emoji} ${item.name}!`);
    logAct('good',`🛒 Compraste: ${item.emoji} ${item.name}`);
    renderCorrales();
  } else if (item.type==='seed') {
    // Add to "seed supply" — just gold already spent, plant in huerto
    toast(`✅ Semillas de ${item.name} en inventario! Planta en el Huerto.`);
    // Actually, redirect to planting - give them back as a "seed item" they can use
    addInv('seeds', 1);
    logAct('good',`🌱 Compraste semillas de ${item.name}. Ve al Huerto para plantar.`);
  } else if (item.type==='item') {
    addInv(item.itemId, 1);
    toast(`✅ Compraste ${item.emoji} ${item.name}`);
  } else if (item.type==='item_bulk') {
    addInv(item.itemId, item.qty);
    toast(`✅ Compraste ${item.qty}× ${item.emoji}`);
  }
  renderTienda(currentShopCat);
  renderInventory(); updateHUD(); saveGame();
}

/* ─── PEDIDOS ─────────────────────────────────────────────── */
function spawnOrders(count) {
  for (let i=0;i<count;i++) {
    const client = CLIENT_POOL[Math.floor(Math.random()*CLIENT_POOL.length)];
    const numItems = 1 + Math.floor(Math.random()*2);
    const items = [];
    const used = new Set();

    for (let j=0;j<numItems;j++) {
      const pool = client.orders.filter(o=>!used.has(o)&&ITEMS[o]);
      if (!pool.length) break;
      const itemId = pool[Math.floor(Math.random()*pool.length)];
      used.add(itemId);
      const qty = 1 + Math.floor(Math.random()*3);
      items.push({ itemId, qty });
    }

    if (!items.length) continue;
    const baseReward = items.reduce((a,{itemId,qty})=>a+(ITEMS[itemId]?.value||20)*qty,0);
    const isPremium  = client.type==='premium'||client.type==='special';
    const mult       = isPremium ? 1.4 : 1.1;
    const reward     = Math.round(baseReward * mult * (0.9+Math.random()*.2));

    G.orders.push({
      id: G.orderId++,
      client: client.name,
      emoji:  client.emoji,
      type:   client.type,
      items,
      reward,
      expires: G.day + 3 + Math.floor(Math.random()*3),
    });
  }
  renderPedidos();
  updateHUD();
}

function renderPedidos() {
  const list = document.getElementById('pedidos-list');
  if (!G.orders.length) {
    list.innerHTML = '<div class="empty-orders">No hay pedidos activos.<br>¡Avanza el día para que lleguen clientes!</div>';
    return;
  }
  list.innerHTML = '';
  G.orders.forEach(order=>{
    const daysLeft = order.expires - G.day;
    const isUrgent = daysLeft <= 1;
    const isPremium= order.type==='premium'||order.type==='special';
    const canFulfill = order.items.every(({itemId,qty})=>(G.inv[itemId]||0)>=qty);
    const effectiveReward = Math.round(order.reward * G.orderMultiplier);

    const card = document.createElement('div');
    card.className = `order-card ${isPremium?'premium':''} ${isUrgent?'urgent':''}`;
    card.innerHTML = `
      <div class="order-tag ${isPremium?'ot-premium':isUrgent?'ot-urgent':'ot-normal'}">${isPremium?'⭐ Premium':isUrgent?'🔥 Urgente':'Normal'}</div>
      <div class="order-top">
        <div class="order-avatar">${order.emoji}</div>
        <div>
          <div class="order-client-name">${order.client}</div>
          <div class="order-client-type">${{premium:'Cliente Premium',special:'Cliente Especial',normal:'Cliente Regular'}[order.type]||'Cliente'}</div>
        </div>
        <div class="order-expires">⏰ ${daysLeft}d</div>
      </div>
      <div class="order-items">
        ${order.items.map(({itemId,qty})=>{
          const it = ITEMS[itemId];
          const have = G.inv[itemId]||0;
          const ok = have >= qty;
          return `<div class="oi-chip ${ok?'have':'missing'}">${it?.emoji||''} ${it?.name||itemId} ×${qty}${!ok?` (${have})`:''}</div>`;
        }).join('')}
      </div>
      <div class="order-bottom">
        <div class="order-reward">${effectiveReward} 💰</div>
        <button class="btn-complete-order" data-id="${order.id}" ${!canFulfill?'disabled':''}>
          ${canFulfill?'✅ Entregar':'❌ Sin stock'}
        </button>
      </div>`;
    card.querySelector('.btn-complete-order').addEventListener('click',()=>fulfillOrder(order.id));
    list.appendChild(card);
  });
}

function fulfillOrder(orderId) {
  const order = G.orders.find(o=>o.id===orderId);
  if (!order) return;
  const canFulfill = order.items.every(({itemId,qty})=>(G.inv[itemId]||0)>=qty);
  if (!canFulfill) { toast('❌ No tienes todos los materiales'); return; }

  order.items.forEach(({itemId,qty})=>removeInv(itemId,qty));
  const earned = Math.round(order.reward * G.orderMultiplier);
  G.gold += earned;
  G.stats.earned += earned;
  G.stats.orders++;
  G.orders = G.orders.filter(o=>o.id!==orderId);

  toast(`📦 Pedido entregado! +${earned} 💰`);
  logAct('gold',`📦 Pedido de ${order.client}: +${earned.toLocaleString()} 💰`);
  renderPedidos(); renderInventory(); updateHUD(); saveGame();
}

/* ─── INVENTARIO ─────────────────────────────────────────── */
function renderInventory() {
  const cont = document.getElementById('inv-compact');
  const items = Object.entries(G.inv).filter(([,v])=>v>0);
  if (!items.length) { cont.innerHTML = '<div class="inv-empty-msg">Sin items aún</div>'; return; }
  cont.innerHTML = items.map(([id,qty])=>{
    const it = ITEMS[id];
    const isCrafted = it?.category==='crafted';
    return `<div class="inv-chip ${isCrafted?'crafted':''}" title="${it?.name||id}: ${qty}">${it?.emoji||''}${it?.name||id} ×${qty}</div>`;
  }).join('');
}

function addInv(id, qty) { G.inv[id] = (G.inv[id]||0)+qty; }
function removeInv(id, qty) { G.inv[id] = Math.max(0,(G.inv[id]||0)-qty); if(!G.inv[id]) delete G.inv[id]; }

/* ─── SIDEBAR ─────────────────────────────────────────────── */
function renderSidebar() {
  if (!G.todayEvent) return;
  const ev = G.todayEvent;
  const card = document.getElementById('event-card');
  card.className = `event-card ${ev.type==='bad'?'event-bad':ev.type==='special'?'event-special':'event-good'}`;
  document.getElementById('ec-icon').textContent  = ev.emoji;
  document.getElementById('ec-title').textContent = ev.title;
  document.getElementById('ec-desc').textContent  = ev.desc;
}

function logAct(type, msg) {
  const log = document.getElementById('activity-log');
  if (!log) return;
  const div = document.createElement('div');
  div.className = 'log-line ' + type;
  div.textContent = `[D${G.day}] ${msg}`;
  log.appendChild(div);
  while (log.children.length > 60) log.removeChild(log.firstChild);
  log.scrollTop = log.scrollHeight;
}

/* ─── DÍA SIGUIENTE ──────────────────────────────────────── */
function advanceDay() {
  if (G.day >= G.maxDays) { endGame(); return; }

  // 1. Reset day modifiers
  G.orderMultiplier = 1;
  G.craftMultiplier = 1;
  G.prodMultiplier  = 1;
  G.sickCorral      = null;

  G.day++;

  // 2. Pick daily event
  const roll = Math.random();
  let ev;
  if (roll < 0.35) ev = DAILY_EVENTS.find(e=>e.id==='normal')||DAILY_EVENTS[12];
  else ev = DAILY_EVENTS[Math.floor(Math.random()*(DAILY_EVENTS.length-2))]; // skip last 2 normals
  if (ev.id==='normal'||ev.id==='normal2') ev = DAILY_EVENTS[Math.floor(Math.random()*(DAILY_EVENTS.length))];
  G.todayEvent = ev;

  // 3. Apply event
  applyDailyEvent(ev);

  // 4. Animal production
  Object.entries(ANIMALS).forEach(([aid, aData]) => {
    const count = G.animals[aid]||0;
    if (!count) return;
    if (G.sickCorral===aid) { logAct('bad',`🤧 ${aData.name}s enfermas: sin producción hoy.`); return; }

    aData.produces.forEach(p => {
      const key = aid+'_'+p.item;
      G.prodTimers[key] = (G.prodTimers[key]||0)-1;
      if (G.prodTimers[key] <= 0) {
        let qty = p.qty * count;
        if (G.prodMultiplier !== 1) qty = Math.floor(qty * (1+G.prodMultiplier));
        if (ev.effect==='chicken_x2' && aid==='chicken' && p.item==='egg') qty *= 2;
        G.pendingProd[key] = (G.pendingProd[key]||0) + qty;
        G.prodTimers[key] = p.every;
        logAct('good',`🐾 ${aData.emoji} ${aData.name}: +${qty} ${ITEMS[p.item]?.emoji||''} listo para recoger`);
      }
    });
  });

  // 5. Grow garden
  G.garden.forEach(slot => {
    if (slot.state!=='growing') return;
    slot.daysLeft--;
    if (slot.daysLeft<=0) {
      slot.state='ready';
      const crop=CROPS[slot.cropId];
      toast(`✅ ${crop.emoji} ${crop.name} lista para cosechar!`);
    }
  });

  // 6. Expire orders
  const before = G.orders.length;
  G.orders = G.orders.filter(o=>o.expires>=G.day);
  const expired = before - G.orders.length;
  if (expired>0) { logAct('bad',`⏰ ${expired} pedido${expired>1?'s':''} expirado${expired>1?'s':''}.`); }

  // 7. Spawn new orders
  const newOrdCount = 1 + (Math.random()<0.5?1:0) + (G.day%5===0?1:0);
  spawnOrders(newOrdCount);

  // 8. Show event modal
  showDayEventModal(ev);

  // 9. Update
  renderAll();
  logAct('system',`--- 🌅 Día ${G.day} de ${G.maxDays} ---`);
  saveGame();

  if (G.day >= G.maxDays) setTimeout(endGame, 1500);
}

function applyDailyEvent(ev) {
  switch(ev.effect) {
    case 'prod_boost':
      G.prodMultiplier = ev.value;
      break;
    case 'crop_boost':
      G.garden.forEach(s=>{ if(s.state==='growing'&&s.daysLeft>1) s.daysLeft--; });
      logAct('good','🌧️ Lluvia: cultivos avanzan 1 día extra!');
      break;
    case 'crop_slow':
      G.garden.forEach(s=>{ if(s.state==='growing') s.daysLeft++; });
      logAct('bad',`${ev.emoji} Clima adverso: cultivos atrasados 1 día.`);
      break;
    case 'order_boost':
      G.orderMultiplier = 1 + ev.value;
      break;
    case 'order_nerf':
      G.orderMultiplier = 1 + ev.value; // ev.value is -0.3
      break;
    case 'bonus_gold':
      G.gold += ev.value;
      G.stats.earned += ev.value;
      logAct('gold',`🧳 Mercader Errante: +${ev.value} 💰`);
      break;
    case 'craft_x2':
      G.craftMultiplier = 2;
      break;
    case 'wolf': {
      const types = Object.keys(ANIMALS).filter(aid=>G.animals[aid]>1);
      if (types.length) {
        const target = types[Math.floor(Math.random()*types.length)];
        G.animals[target]--;
        logAct('bad',`🐺 Ataque: perdiste 1 ${ANIMALS[target].emoji} ${ANIMALS[target].name}!`);
      }
      break;
    }
    case 'sick': {
      const types2 = Object.keys(ANIMALS).filter(aid=>G.animals[aid]>0);
      if (types2.length) {
        G.sickCorral = types2[Math.floor(Math.random()*types2.length)];
      }
      break;
    }
    case 'fire': {
      const growing = G.garden.map((s,i)=>({s,i})).filter(({s})=>s.state==='growing');
      if (growing.length) {
        const target = growing[Math.floor(Math.random()*growing.length)];
        const cn = CROPS[target.s.cropId]?.name||'cultivo';
        G.garden[target.i] = {state:'empty',cropId:null,daysLeft:0,growDays:0,perennial:false};
        logAct('bad',`🔥 ¡Incendio! Se perdió tu ${cn}.`);
      }
      break;
    }
  }
}

function showDayEventModal(ev) {
  document.getElementById('dme-icon').textContent  = ev.emoji;
  document.getElementById('dme-title').textContent = ev.title;
  document.getElementById('dme-desc').textContent  = ev.desc;
  const tag = document.getElementById('dme-tag');
  const cls = {good:'dmet-good',special:'dmet-gold',bad:'dmet-bad',neutral:'dmet-good'}[ev.type]||'dmet-good';
  tag.className = 'dme-tag '+cls;
  tag.textContent = {good:'✅ Evento Positivo',special:'✨ Evento Especial',bad:'⚠️ Evento Negativo',neutral:'📋 Sin Evento'}[ev.type]||'';
  document.getElementById('modal-dayevent').classList.remove('hidden');
}

function checkMissionProgress() { /* For future expansion */ }

/* ─── FIN DEL JUEGO ──────────────────────────────────────── */
function endGame() {
  deleteSave();
  document.getElementById('game-hud').style.display = 'none';

  // Liquidate inventory
  const invValue = Object.entries(G.inv).reduce((a,[id,qty])=>a+(ITEMS[id]?.value||0)*qty,0);
  G.gold += invValue;
  G.stats.earned += invValue;

  const earned = G.stats.earned;
  let icon,title,sub,rankClass,rankText;

  if (earned>=3500&&G.stats.orders>=15) {
    icon='🏆';title='¡LEYENDA DE LA GRANJA!';rankClass='er-legend';
    rankText='👑 Rango: MAGNATE GANADERO — Tu Imperio es famoso en todo el mundo';
    sub=`Impresionante. ${earned.toLocaleString()} 💰 ganadas, ${G.stats.orders} pedidos. La granja más rica del servidor.`;
  } else if (earned>=1800) {
    icon='🌟';title='MAESTRO GRANJERO';rankClass='er-master';
    rankText='⭐ Rango: GRANJERO EXPERTO — Todos en el pueblo te conocen';
    sub=`${earned.toLocaleString()} 💰 ganadas. ${G.stats.crafted} objetos crafteados. ¡Excelente trabajo!`;
  } else if (earned>=700) {
    icon='🌾';title='GRANJERO ESTABLECIDO';rankClass='er-farm';
    rankText='🌿 Rango: COLONO — Tienes una granja funcional';
    sub=`${earned.toLocaleString()} 💰 ganadas. Aún hay mucho por mejorar. ¡Sigue así!`;
  } else {
    icon='🌱';title='APRENDIZ DE GRANJERO';rankClass='er-noob';
    rankText='🌱 Rango: NOVATO — La granja apenas empieza';
    sub=`${earned.toLocaleString()} 💰 ganadas. Practica más con los animales y el crafteo.`;
  }

  document.getElementById('end-icon').textContent = icon;
  document.getElementById('end-title').textContent = title;
  document.getElementById('end-sub').textContent = sub;
  document.getElementById('end-rank').textContent = rankText;
  document.getElementById('end-rank').className = 'end-rank '+rankClass;
  document.getElementById('end-stats').innerHTML = `
    <div class="end-stat"><div class="es-val">${earned.toLocaleString()}</div><div class="es-lbl">💰 Ganado</div></div>
    <div class="end-stat"><div class="es-val">${G.stats.orders}</div><div class="es-lbl">📦 Pedidos</div></div>
    <div class="end-stat"><div class="es-val">${G.stats.crafted}</div><div class="es-lbl">⚗️ Crafteado</div></div>`;

  showScreen('end');
}

/* ─── CANVAS BG ──────────────────────────────────────────── */
(function bgCanvas(){
  const c = document.getElementById('bgCanvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  const dpi = Math.max(1, devicePixelRatio||1);
  let w,h,parts;
  const init=()=>{
    w=c.width=innerWidth*dpi; h=c.height=innerHeight*dpi;
    parts=Array.from({length:55},()=>({
      x:Math.random()*w,y:Math.random()*h,
      r:(.3+Math.random()*1.2)*dpi,s:.05+Math.random()*.2,
      a:.04+Math.random()*.1,
      hue:90+Math.random()*50,
    }));
  };
  const tick=()=>{
    ctx.clearRect(0,0,w,h);
    parts.forEach(p=>{
      p.y+=p.s; p.x+=Math.sin(p.y*.004)*.25;
      if(p.y>h){p.y=-8;p.x=Math.random()*w}
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`hsla(${p.hue},65%,50%,${p.a})`;ctx.fill();
    });
    requestAnimationFrame(tick);
  };
  init();tick();
  addEventListener('resize',init);
})();

/* ─── NAVBAR ─────────────────────────────────────────────── */
const navT=document.getElementById('navToggle');
const navL=document.getElementById('navLinks');
navT?.addEventListener('click',e=>{e.stopPropagation();navL.classList.toggle('open')});
document.addEventListener('click',e=>{if(!navT?.contains(e.target)&&!navL?.contains(e.target))navL?.classList.remove('open')});

/* ─── TOAST ─────────────────────────────────────────────── */
function toast(msg){
  const el=document.getElementById('toast');
  el.textContent=msg;el.classList.add('show');
  clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),2800);
}

/* ─── LISTENERS ──────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded',()=>{

  renderTitleScreen();

  document.getElementById('btn-save').addEventListener('click',saveGame);
  document.getElementById('btn-nextday').addEventListener('click',advanceDay);
  document.getElementById('btn-restart').addEventListener('click',()=>{ showScreen('title'); renderTitleScreen(); });

  // Tabs
  document.querySelectorAll('.tab').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t=>t.classList.remove('active'));
      btn.classList.add('active');
      const tabId='tab-'+btn.dataset.tab;
      document.getElementById(tabId)?.classList.add('active');
      if(btn.dataset.tab==='crafteo') renderCrafteo();
      if(btn.dataset.tab==='pedidos') renderPedidos();
      if(btn.dataset.tab==='inventory') renderInventory();
    });
  });

  // Shop cats
  document.querySelectorAll('.shop-cat').forEach(btn=>{
    btn.addEventListener('click',()=>renderTienda(btn.dataset.cat));
  });

  // Modal closes
  document.getElementById('plnt-close').addEventListener('click',()=>document.getElementById('modal-plant').classList.add('hidden'));
  document.getElementById('breed-close').addEventListener('click',()=>document.getElementById('modal-breed').classList.add('hidden'));
  document.getElementById('sl-close').addEventListener('click',()=>document.getElementById('modal-slaughter').classList.add('hidden'));
  document.getElementById('mc-close').addEventListener('click',()=>document.getElementById('modal-craft').classList.add('hidden'));
  document.getElementById('horse-close').addEventListener('click',()=>document.getElementById('modal-horse').classList.add('hidden'));
  document.getElementById('dme-close').addEventListener('click',()=>document.getElementById('modal-dayevent').classList.add('hidden'));

  // Close modals clicking overlay
  document.querySelectorAll('.modal-ov').forEach(ov=>{
    ov.addEventListener('click',e=>{
      if(e.target===ov) ov.classList.add('hidden');
    });
  });

  // Show title
  showScreen('title');
});