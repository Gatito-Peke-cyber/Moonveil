/* =========================================================
   Moonveil — Harvest Corp  |  em.js
   Gestión de empresa de alimentos: planta, cosecha, negocia
   ========================================================= */

/* ── DATOS: CULTIVOS ───────────────────────────────────── */
const CROPS = {
  wheat:    { id:'wheat',    name:'Trigo',          emoji:'🌾', grow:2, seedCost:8,  basePrice:18, category:'Básico',   rare:false },
  potato:   { id:'potato',   name:'Patata',         emoji:'🥔', grow:2, seedCost:12, basePrice:22, category:'Básico',   rare:false },
  carrot:   { id:'carrot',   name:'Zanahoria',      emoji:'🥕', grow:2, seedCost:15, basePrice:28, category:'Básico',   rare:false },
  beetroot: { id:'beetroot', name:'Remolacha',      emoji:'🫚', grow:2, seedCost:14, basePrice:24, category:'Básico',   rare:false },
  watermelon:{id:'watermelon',name:'Sandía',        emoji:'🍉', grow:3, seedCost:28, basePrice:55, category:'Especial',  rare:false },
  pumpkin:  { id:'pumpkin',  name:'Calabaza',       emoji:'🎃', grow:3, seedCost:32, basePrice:65, category:'Especial',  rare:false },
  berries:  { id:'berries',  name:'Bayas',          emoji:'🫐', grow:3, seedCost:25, basePrice:50, category:'Especial',  rare:false },
  apple:    { id:'apple',    name:'Manzana',        emoji:'🍎', grow:4, seedCost:45, basePrice:90, category:'Premium',  rare:false },
  goldapple:{ id:'goldapple',name:'Manzana Dorada', emoji:'🍏', grow:6, seedCost:220,basePrice:520,category:'Legendario',rare:true  }
};

/* ── DATOS: CAMPAÑAS DE MARKETING ─────────────────────── */
const CAMPAIGNS = [
  { id:'social',   icon:'📱', name:'Redes Sociales', cost:60,  repGain:8,  buyersBonus:2, effectDesc:'Atrae compradores regulares',       msgCount:5 },
  { id:'radio',    icon:'📻', name:'Radio Local',    cost:100, repGain:14, buyersBonus:2, effectDesc:'Trae compradores al por mayor',      msgCount:5 },
  { id:'brand',    icon:'🏆', name:'Marca Premium',  cost:220, repGain:28, buyersBonus:2, effectDesc:'Compradores premium de alta oferta', msgCount:6 },
  { id:'newspaper',icon:'📰', name:'Periódico',      cost:50,  repGain:5,  buyersBonus:2, effectDesc:'Alcance amplio, precios normales',   msgCount:4 }
];

/* ── DATOS: COMPRADORES ────────────────────────────────── */
const BUYER_POOL = [
  { name:'Granjero Pete',      avatar:'🧑‍🌾', type:'regular'   },
  { name:'Mercado Luna',       avatar:'🏪',  type:'bulk'      },
  { name:'Cocinera Mariana',   avatar:'👩‍🍳', type:'premium'   },
  { name:'Don Rodrigo',        avatar:'🧓',  type:'regular'   },
  { name:'Restaurante Ébano',  avatar:'🍽️',  type:'premium'   },
  { name:'Almacén Torrente',   avatar:'🏭',  type:'bulk'      },
  { name:'Herbolaria Selene',  avatar:'🌿',  type:'premium'   },
  { name:'Taberna del Norte',  avatar:'🍺',  type:'regular'   },
  { name:'Despensa Real',      avatar:'👑',  type:'desperate' },
  { name:'Mercader Halim',     avatar:'🧕',  type:'regular'   },
  { name:'Chef Beaumont',      avatar:'🤵',  type:'premium'   },
  { name:'Sra. Carvajal',      avatar:'👩',  type:'regular'   },
  { name:'Almacén del Puerto', avatar:'⚓',  type:'bulk'      },
  { name:'Herrero Björn',      avatar:'🔨',  type:'regular'   },
  { name:'Mago Alquímico',     avatar:'🧙',  type:'desperate' }
];

/* ── DATOS: COMENTARIOS DE CHAT ────────────────────────── */
const CHAT_COMMENTS = {
  social: {
    positive: [
      'Acabo de ver su anuncio, ¡esas bayas se ven increíbles! 🫐',
      'Les voy a contar a mis vecinos sobre esta granja, ¡parece buenísima!',
      '¡Eso del trigo fresco me convence! ¿Cuándo hay disponible?',
      'Vi la publicación. ¡Definitivamente voy a comprar algo esta semana!',
      'Las fotos de las sandías... madre mía 🍉 ¡Ya quiero ir!'
    ],
    neutral: [
      'Meh, otro anuncio más... veremos si cumplen.',
      'Los precios no están mal, pero tampoco son una ganga.',
      'Interesante. ¿Tienen manzanas doradas? Eso sí me llamaría más.',
      '¿Entregan a domicilio? Ahí sí vendría todos los días.',
      'El algoritmo me lo mostró 5 veces. Bien, pues... tomad nota.'
    ],
    negative: [
      'El anuncio estaba bien pero mi vecino me dijo que la última cosecha decepcionó 🤷',
      'Mucho marketing, ¿y la calidad qué? Lo estoy viendo.',
      'Hay granjas más conocidas. Necesitan más reputación primero.'
    ],
    buyer: [
      '¡Me encanta el anuncio! Necesito 12 unidades de algo. ¡Os contrato! 💰',
      'Soy chef y busco proveedores. Vi su publicidad, ¡llámame!',
      'El restaurante necesita suministros. Vuestra granja parece ideal.'
    ]
  },
  radio: {
    positive: [
      '¡Escuché el programa! Esas patatas de Harvest Corp suenan geniales 🥔',
      'El locutor habló maravillas. ¡Pedido confirmado mañana!',
      'Mi abuela también escuchó la radio y quiere encargar zanahorias 🥕',
      'Nunca había comprado por mayoreo pero el precio que mencionaron me convenció.',
      'El jingle se me quedó en la cabeza, jajaja. ¡Ya quiero mis remolachas!'
    ],
    neutral: [
      'Me pareció interesante el programa. A ver qué tal la calidad.',
      'Radio... ya nadie escucha radio. Pero bueno, algo llegó.',
      '¿Hacen descuentos por volumen? Ahí me interesa.',
    ],
    buyer: [
      '¡Distribución regional aquí! Queremos comprar al por mayor. ¡Un gran lote!',
      'Escuché que tienen calabazas. Las necesito URGENTE para el festival 🎃'
    ]
  },
  brand: {
    positive: [
      '¡La marca Harvest Corp ya tiene peso! Confío plenamente en sus productos 🌟',
      'Calidad certificada, los precios lo valen. Comprador fiel desde hoy.',
      'Esta granja se está convirtiendo en referente. ¡Mis respetos!',
      'Los packaging nuevos están 🔥. Definitivamente una compra premium.',
      'Reputación bien merecida. Llevan tiempo haciendo bien las cosas.',
      'Mi círculo social habla de Harvest Corp como el estándar de oro 👑'
    ],
    neutral: [
      'Bonita imagen de marca, habrá que ver si los productos justifican el hype.',
      'El rebranding mola. Pero sigan siendo honestos con la calidad.',
    ],
    buyer: [
      '¡Somos distribuidores nacionales! Su marca es perfecta para nuestro catálogo premium 💼',
      'Un hotel 5 estrellas interesado. Solo trabajamos con proveedores de renombre como ustedes.'
    ]
  },
  newspaper: {
    positive: [
      '¡Leí el artículo! ¡Qué empresa tan interesante la de Harvest Corp!',
      'Me enteré por el periódico. Enhorabuena por la cobertura. Compro algo esta semana.',
      'Mis padres lo leyeron y quieren encargar sus verduras aquí de ahora en adelante.',
      'Buen artículo, muy completo. Confío más ahora en la granja.'
    ],
    neutral: [
      'Leí el artículo. No está mal. ¿Tienen página web?',
      'Interesante nota. Las fotos podrían ser mejores jajaja.',
    ],
    buyer: [
      '¡Leyendo el periódico vi su granja! Necesito 8 sandías para un evento 🍉',
    ]
  }
};

const NPC_NAMES = ['TwentyThreeVillager','GranjaGuru99','FoodieElena','MercadoJose','DonCarlos_Jr','ChefNicolás','LaCocinaMx','FarmLover2025','HarvestKing','PatataQueen','ZanahoriaPRO','VerduraFeliz','AlmaDeCocinera','ElGranero'];
const NPC_AVATARS = ['👩','👨','🧑','👩‍🌾','🧑‍🍳','👩‍💼','🧔','👧','🧒','👴','🧕','👨‍💼','👩‍🦱','🧓'];

/* ── ESTADO ────────────────────────────────────────────── */
let G = {};

function initGame() {
  G = {
    money:     500,
    day:       1,
    maxDays:   30,
    rep:       0,
    plots:     Array.from({length:6}, (_,i) => ({ id:i, state:'empty', cropId:null, daysLeft:0, growTime:0 })),
    inventory: {},
    buyers:    [],
    buyerIdCounter: 1,
    chatMessages:   0,
    stats:     { revenue:0, expenses:0, harvested:0, deals:0, mktSpent:0 },
    pendingPlotId: null,
    pendingMkSell: null
  };

  renderPlots();
  renderBuyers();
  renderMarketSell();
  renderCampaigns();
  updateHUD();
  document.getElementById('game-hud').style.display = '';
  showScreen('game');
  addChat('system', '🌾 HarvestBot', '¡Tu empresa está abierta! Planta cultivos y espera compradores. El día pasa cuando pulsas "Día Siguiente". ¡Buena suerte!', 0);
  setTimeout(() => {
    addChat('system', '📊 Tutorial', 'Consejo: Planta trigo o patatas primero (2 días). Cuando crezcan, usa marketing para atraer compradores con mejores ofertas.', 500);
  }, 1000);
  spawnInitialBuyers();
}

/* ── NAVEGACIÓN ────────────────────────────────────────── */
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('screen-' + name);
  if (el) el.classList.add('active');
}

/* ── HUD ───────────────────────────────────────────────── */
function updateHUD() {
  document.getElementById('h-money').textContent = G.money.toLocaleString();
  document.getElementById('h-day').textContent   = G.day;
  document.getElementById('h-rep').textContent   = G.rep;

  // Inventario
  const items = Object.entries(G.inventory).filter(([,v]) => v > 0);
  document.getElementById('h-inv').textContent = items.length === 0
    ? 'Vacío'
    : items.map(([id,qty]) => `${CROPS[id].emoji}×${qty}`).join(' ');

  // Rep bar (max 100)
  const repPct = Math.min(100, G.rep);
  document.getElementById('rep-fill').style.width = repPct + '%';

  // Estación
  const seasons = ['☀️ Primavera','🌞 Verano','🍂 Otoño','❄️ Invierno'];
  const si = Math.floor(((G.day-1)/30)*4);
  document.getElementById('season-badge').textContent = seasons[Math.min(3,si)];

  // Buyers count
  document.getElementById('buyers-count').textContent = G.buyers.length;
  document.getElementById('chat-count').textContent   = G.chatMessages;
}

/* ── PARCELAS ──────────────────────────────────────────── */
function renderPlots() {
  const grid = document.getElementById('plots-grid');
  grid.innerHTML = '';

  G.plots.forEach(plot => {
    const div = document.createElement('div');
    div.className = 'plot ' + plot.state;
    div.dataset.id = plot.id;

    if (plot.state === 'empty') {
      div.innerHTML = `
        <div class="plot-icon">🟫</div>
        <div class="plot-label">Vacía</div>
        <div class="plot-days">Clic para plantar</div>`;
      div.addEventListener('click', () => openPlantModal(plot.id));

    } else if (plot.state === 'planted') {
      const crop = CROPS[plot.cropId];
      const progress = ((crop.grow - plot.daysLeft) / crop.grow) * 100;
      div.innerHTML = `
        <div class="plot-icon">${crop.emoji}</div>
        <div class="plot-label">${crop.name}</div>
        <div class="plot-days">⏳ ${plot.daysLeft} día${plot.daysLeft!==1?'s':''} más</div>
        <div class="plot-progress" style="width:${progress}%"></div>`;

    } else if (plot.state === 'ready') {
      const crop = CROPS[plot.cropId];
      div.innerHTML = `
        <div class="plot-badge">¡LISTO!</div>
        <div class="plot-icon">${crop.emoji}</div>
        <div class="plot-label">${crop.name}</div>
        <div class="plot-days" style="color:var(--lime)">✅ Cosechar</div>`;
      div.addEventListener('click', () => harvestPlot(plot.id));
    }

    grid.appendChild(div);
  });
}

function openPlantModal(plotId) {
  G.pendingPlotId = plotId;
  document.getElementById('plant-plot-num').textContent = plotId + 1;
  const picker = document.getElementById('crop-picker');
  picker.innerHTML = '';

  Object.values(CROPS).forEach(crop => {
    const btn = document.createElement('button');
    btn.className = 'crop-option';
    const canAfford = G.money >= crop.seedCost;
    if (!canAfford) btn.disabled = true;

    btn.innerHTML = `
      ${crop.rare ? '<div class="crop-rare-badge">✨ RARO</div>' : ''}
      <div class="crop-emoji">${crop.emoji}</div>
      <div class="crop-oname">${crop.name}</div>
      <div class="crop-details">
        <span class="crop-seed-cost">🌱 Semilla: ${crop.seedCost} 💰</span>
        <span>⏱️ Crece en: ${crop.grow} días</span>
        <span>💵 Precio base: ${crop.basePrice} 💰</span>
      </div>
    `;
    btn.addEventListener('click', () => plantCrop(crop.id));
    picker.appendChild(btn);
  });

  document.getElementById('modal-plant').classList.remove('hidden');
}

function plantCrop(cropId) {
  const crop = CROPS[cropId];
  if (G.money < crop.seedCost) { toast('❌ No tienes suficiente dinero'); return; }
  G.money -= crop.seedCost;
  G.stats.expenses += crop.seedCost;

  const plot = G.plots[G.pendingPlotId];
  plot.state   = 'planted';
  plot.cropId  = cropId;
  plot.daysLeft= crop.grow;
  plot.growTime= crop.grow;

  document.getElementById('modal-plant').classList.add('hidden');
  toast(`🌱 Plantaste ${crop.emoji} ${crop.name} — listo en ${crop.grow} días`);
  renderPlots();
  updateHUD();
}

function harvestPlot(plotId) {
  const plot = G.plots[plotId];
  const crop = CROPS[plot.cropId];
  const qty  = 1 + Math.floor(Math.random() * 3); // 1-3 unidades por cosecha

  G.inventory[crop.id] = (G.inventory[crop.id] || 0) + qty;
  G.stats.harvested += qty;

  plot.state   = 'empty';
  plot.cropId  = null;
  plot.daysLeft= 0;

  toast(`🎉 ¡Cosechaste ${qty}× ${crop.emoji} ${crop.name}!`);
  addChat('system','🌾 Granja',`¡Cosecha exitosa! +${qty} ${crop.emoji} ${crop.name} en inventario.`, 0);

  renderPlots();
  renderMarketSell();
  renderBuyers(); // actualiza botones
  updateHUD();
}

/* ── DÍA SIGUIENTE ─────────────────────────────────────── */
function advanceDay() {
  if (G.day >= G.maxDays) { showEndScreen(); return; }

  G.day++;

  // Avanzar cultivos
  G.plots.forEach(plot => {
    if (plot.state === 'planted') {
      plot.daysLeft--;
      if (plot.daysLeft <= 0) {
        plot.state = 'ready';
        const crop = CROPS[plot.cropId];
        toast(`🔔 ¡${crop.emoji} ${crop.name} lista para cosechar!`);
        addChat('system','🌾 Granja', `¡El cultivo de ${crop.emoji} ${crop.name} está listo! Haz clic para cosechar.`, 0);
      }
    }
  });

  // Expirar compradores
  G.buyers = G.buyers.filter(b => b.expiresDay >= G.day);

  // Nuevos compradores orgánicos (1-2 por día)
  const organic = 1 + (Math.random() < 0.35 ? 1 : 0);
  for (let i = 0; i < organic; i++) spawnBuyer('organic');

  // Noticias del mercado ocasional
  if (G.day % 5 === 0) marketNews();

  if (G.day >= G.maxDays) {
    setTimeout(() => showEndScreen(), 600);
  }

  renderPlots();
  renderBuyers();
  renderMarketSell();
  updateHUD();
}

function marketNews() {
  const news = [
    { msg: '📈 ¡El precio de las sandías sube por el calor! Los compradores pagan más.', crop:'watermelon' },
    { msg: '📉 Sobreabundancia de trigo en el mercado. Precios algo bajos esta semana.', crop:'wheat' },
    { msg: '🎃 ¡Festival de Calabazas! Demanda altísima de calabazas.', crop:'pumpkin' },
    { msg: '🍎 Un chef famoso mencionó las manzanas de la región. ¡Se dispara la demanda!', crop:'apple' },
    { msg: '🫐 Las bayas están de moda en la ciudad. ¡Los restaurantes las piden a gritos!', crop:'berries' }
  ];
  const n = news[Math.floor(Math.random() * news.length)];
  addChat('neutral','📰 Noticias', n.msg, 0);
}

/* ── COMPRADORES ───────────────────────────────────────── */
function spawnInitialBuyers() {
  spawnBuyer('organic');
  spawnBuyer('organic');
}

function spawnBuyer(source, type = null, preferCrop = null) {
  const typeWeights = source === 'brand' ? ['premium','premium','premium','desperate'] :
                      source === 'radio' ? ['bulk','bulk','regular','desperate'] :
                      ['regular','regular','bulk','premium'];

  const chosenType = type || typeWeights[Math.floor(Math.random() * typeWeights.length)];
  const poolEntry  = BUYER_POOL.filter(b => b.type === chosenType || chosenType === 'any');
  const bpEntry    = poolEntry.length > 0 ? poolEntry[Math.floor(Math.random()*poolEntry.length)] : BUYER_POOL[0];

  // Escoger qué cultivo quiere comprar
  const cropList   = Object.values(CROPS).filter(c => !c.rare || chosenType === 'premium' || G.rep >= 60);
  const crop       = preferCrop ? CROPS[preferCrop] : cropList[Math.floor(Math.random()*cropList.length)];

  // Cantidad según tipo
  const qtyMap = { premium:[ 2, 6], bulk:[ 10,20], regular:[ 3, 8], desperate:[ 1, 4] };
  const [qMin,qMax] = qtyMap[chosenType] || [3,8];
  const qty = qMin + Math.floor(Math.random() * (qMax - qMin + 1));

  // Precio oferta según tipo y reputación
  const repMult  = 1 + (G.rep / 200);
  const multMap  = { premium:[1.4,2.0], bulk:[0.85,1.05], regular:[1.05,1.3], desperate:[1.8,2.8] };
  const [mMin,mMax] = multMap[chosenType] || [1,1.3];
  const mult     = mMin + Math.random() * (mMax - mMin);
  const perUnit  = Math.round(crop.basePrice * mult * repMult);

  const buyer = {
    id:          G.buyerIdCounter++,
    name:        bpEntry.name,
    avatar:      bpEntry.avatar,
    type:        chosenType,
    cropId:      crop.id,
    qty,
    perUnit,
    expiresDay:  G.day + (chosenType === 'desperate' ? 2 : 3 + Math.floor(Math.random()*2)),
    source
  };

  G.buyers.push(buyer);
  renderBuyers();
  updateHUD();
}

function renderBuyers() {
  const list = document.getElementById('buyers-list');

  if (G.buyers.length === 0) {
    list.innerHTML = `
      <div class="no-buyers">
        <div style="font-size:3rem;margin-bottom:10px;">🔍</div>
        <p>Sin compradores activos.</p>
        <p class="muted">¡Usa marketing para atraerlos!</p>
      </div>`;
    return;
  }

  // Agrupar por cultivo para detectar subastas
  const byCrop = {};
  G.buyers.forEach(b => {
    if (!byCrop[b.cropId]) byCrop[b.cropId] = [];
    byCrop[b.cropId].push(b);
  });

  list.innerHTML = '';

  // Mostrar subastas primero
  Object.entries(byCrop).forEach(([cropId, buyers]) => {
    if (buyers.length >= 2) {
      const crop      = CROPS[cropId];
      const best      = buyers.reduce((a,b) => a.perUnit > b.perUnit ? a : b);
      const hasStock  = (G.inventory[cropId] || 0) >= Math.min(...buyers.map(b=>b.qty));

      const card = document.createElement('div');
      card.className = 'buyer-card auction-card';
      card.innerHTML = `
        <div class="buyer-type-badge badge-auction">⚡ SUBASTA</div>
        <div class="buyer-top">
          <div class="buyer-avatar">${crop.emoji}</div>
          <div class="buyer-name-row">
            <div class="buyer-name">⚡ ¡${buyers.length} compradores quieren ${crop.name}!</div>
            <div class="buyer-type">Mejor oferta: <b style="color:var(--gold)">${best.perUnit} 💰/u</b> · Haz clic para ver la subasta</div>
          </div>
        </div>
        <div class="buyer-actions">
          <button class="btn-auction-enter" ${!hasStock?'disabled':''}>
            ⚡ Entrar a Subasta ${!hasStock?'(sin stock)':''}
          </button>
        </div>`;
      if (hasStock) card.addEventListener('click', () => openAuction(cropId, buyers));
      list.appendChild(card);
    }
  });

  // Compradores individuales (no en subasta)
  G.buyers.forEach(buyer => {
    const cropBuyers = byCrop[buyer.cropId];
    if (cropBuyers.length >= 2) return; // ya está en subasta

    const crop     = CROPS[buyer.cropId];
    const total    = buyer.qty * buyer.perUnit;
    const hasStock = (G.inventory[buyer.cropId] || 0) >= buyer.qty;
    const typeLabels = { premium:'⭐ Premium', bulk:'📦 Por Mayor', regular:'👤 Regular', desperate:'🔥 Urgente' };
    const badgeClass = { premium:'badge-premium', bulk:'badge-bulk', regular:'', desperate:'badge-desperate' };

    const daysLeft = buyer.expiresDay - G.day;

    const card = document.createElement('div');
    card.className = 'buyer-card ' + buyer.type;
    card.innerHTML = `
      ${badgeClass[buyer.type] ? `<div class="buyer-type-badge ${badgeClass[buyer.type]}">${typeLabels[buyer.type]}</div>` : ''}
      <div class="buyer-top">
        <div class="buyer-avatar">${buyer.avatar}</div>
        <div class="buyer-name-row">
          <div class="buyer-name">${buyer.name}</div>
          <div class="buyer-type">${typeLabels[buyer.type]}</div>
        </div>
        <div class="buyer-expires">Expira en ${daysLeft} día${daysLeft!==1?'s':''}</div>
      </div>
      <div class="buyer-want">
        <div class="buyer-want-crop">${crop.emoji} ${crop.name}</div>
        <div class="buyer-want-qty">×${buyer.qty}</div>
        <div class="buyer-price-per">${buyer.perUnit} 💰/u</div>
      </div>
      <div style="font-size:.8rem;color:var(--muted);margin-bottom:10px;">
        Total: <b style="color:var(--gold)">${total.toLocaleString()} 💰</b>
        · Stock: ${G.inventory[buyer.cropId]||0} disponibles
      </div>
      <div class="buyer-actions">
        <button class="btn-accept" data-id="${buyer.id}" ${!hasStock?'disabled title="Sin stock suficiente"':''}>
          ${hasStock ? '✅ Aceptar Trato' : '❌ Sin stock'}
        </button>
      </div>`;

    const btn = card.querySelector('.btn-accept');
    if (!btn.disabled) btn.addEventListener('click', () => acceptDeal(buyer.id));
    list.appendChild(card);
  });
}

function acceptDeal(buyerId) {
  const buyer = G.buyers.find(b => b.id === buyerId);
  if (!buyer) return;
  const crop  = CROPS[buyer.cropId];
  const stock = G.inventory[buyer.cropId] || 0;
  if (stock < buyer.qty) { toast('❌ No tienes suficiente stock'); return; }

  const total = buyer.qty * buyer.perUnit;
  G.inventory[buyer.cropId] -= buyer.qty;
  if (G.inventory[buyer.cropId] <= 0) delete G.inventory[buyer.cropId];
  G.money += total;
  G.stats.revenue  += total;
  G.stats.deals++;
  G.buyers = G.buyers.filter(b => b.id !== buyerId);

  toast(`💰 ¡Trato cerrado! +${total.toLocaleString()} 💰 de ${buyer.name}`);
  addChat('buyer-msg', buyer.avatar + ' ' + buyer.name, `¡Trato hecho! Llevamos ${buyer.qty}× ${crop.emoji} ${crop.name}. ¡Un placer negociar con Harvest Corp! 🤝`, 0);

  renderBuyers();
  renderMarketSell();
  updateHUD();
}

/* ── SUBASTA ───────────────────────────────────────────── */
function openAuction(cropId, buyers) {
  const crop = CROPS[cropId];
  const sorted = [...buyers].sort((a,b) => b.perUnit - a.perUnit);

  document.getElementById('auc-icon').textContent = crop.emoji;
  document.getElementById('auc-title').textContent = `⚡ SUBASTA — ${crop.name}`;
  document.getElementById('auc-sub').textContent   = `${buyers.length} compradores compiten. Elige al mejor postor.`;

  const container = document.getElementById('auction-bids');
  container.innerHTML = '';

  sorted.forEach((buyer, idx) => {
    const total    = buyer.qty * buyer.perUnit;
    const isBest   = idx === 0;
    const hasStock = (G.inventory[cropId] || 0) >= buyer.qty;
    const typeLabels = { premium:'⭐ Premium', bulk:'📦 Mayorista', regular:'👤 Regular', desperate:'🔥 Urgente' };

    const div = document.createElement('div');
    div.className = 'auction-bid' + (isBest ? ' best' : '');
    div.innerHTML = `
      ${isBest ? '<div class="auction-best-tag">🏆 MEJOR OFERTA</div>' : ''}
      <div class="auction-bid-avatar">${buyer.avatar}</div>
      <div class="auction-bid-info">
        <div class="auction-bid-name">${buyer.name} <span style="font-size:.75rem;color:var(--muted)">(${typeLabels[buyer.type]})</span></div>
        <div class="auction-bid-offer">Quiere: ${buyer.qty}× ${crop.emoji} · ${buyer.perUnit} 💰/u</div>
      </div>
      <div>
        <div class="auction-bid-total">${total.toLocaleString()} 💰</div>
        ${!hasStock ? '<div style="font-size:.7rem;color:#f87171">Sin stock</div>' : ''}
      </div>`;

    if (hasStock) {
      div.addEventListener('click', () => {
        acceptDeal(buyer.id);
        document.getElementById('modal-auction').classList.add('hidden');
        addChat('neutral','🔨 Subasta', `¡Subasta resuelta! ${buyer.name} se lleva ${buyer.qty}× ${crop.emoji} ${crop.name} por ${total.toLocaleString()} 💰.`, 0);
      });
    }
    container.appendChild(div);
  });

  document.getElementById('modal-auction').classList.remove('hidden');
}

/* ── MERCADO BASE ──────────────────────────────────────── */
function renderMarketSell() {
  const grid = document.getElementById('market-sell-grid');
  const items = Object.entries(G.inventory).filter(([,v]) => v > 0);

  if (items.length === 0) {
    grid.innerHTML = '<p class="muted" style="padding:12px;font-size:.9rem">Tu inventario está vacío</p>';
    return;
  }

  grid.innerHTML = '';
  items.forEach(([cropId, qty]) => {
    const crop = CROPS[cropId];
    const price= crop.basePrice;
    const div  = document.createElement('div');
    div.className = 'market-item';
    div.innerHTML = `
      <span class="market-item-emoji">${crop.emoji}</span>
      <div class="market-item-info">
        <div class="market-item-name">${crop.name}</div>
        <div class="market-item-qty">×${qty} disponibles</div>
      </div>
      <div class="market-item-price">${price} 💰/u</div>
      <button class="btn-mksell" data-crop="${cropId}">Vender</button>`;
    div.querySelector('.btn-mksell').addEventListener('click', () => openMkSellModal(cropId));
    grid.appendChild(div);
  });
}

let mkSellCropId = null;
function openMkSellModal(cropId) {
  mkSellCropId = cropId;
  const crop = CROPS[cropId];
  const qty  = G.inventory[cropId] || 0;

  document.getElementById('mksell-icon').textContent   = crop.emoji;
  document.getElementById('mksell-title').textContent  = `Vender ${crop.name}`;
  document.getElementById('mksell-price').textContent  = `Precio base: ${crop.basePrice} 💰 por unidad`;
  const input = document.getElementById('mksell-qty');
  input.value = Math.min(1, qty);
  input.max   = qty;
  updateMkSellTotal();
  document.getElementById('modal-mksell').classList.remove('hidden');
}

function updateMkSellTotal() {
  const qty   = Math.max(1, +document.getElementById('mksell-qty').value || 1);
  const crop  = CROPS[mkSellCropId];
  const total = qty * crop.basePrice;
  document.getElementById('mksell-total').textContent = total.toLocaleString() + ' 💰';
}

function confirmMkSell() {
  const qty  = Math.max(1, +document.getElementById('mksell-qty').value || 1);
  const crop = CROPS[mkSellCropId];
  const stock= G.inventory[mkSellCropId] || 0;

  if (qty > stock) { toast('❌ No tienes suficiente stock'); return; }

  const total = qty * crop.basePrice;
  G.inventory[mkSellCropId] -= qty;
  if (G.inventory[mkSellCropId] <= 0) delete G.inventory[mkSellCropId];
  G.money += total;
  G.stats.revenue += total;
  G.stats.deals++;

  document.getElementById('modal-mksell').classList.add('hidden');
  toast(`📦 Vendiste ${qty}× ${crop.emoji} ${crop.name} en mercado — +${total.toLocaleString()} 💰`);
  renderMarketSell();
  renderBuyers();
  updateHUD();
}

/* ── MARKETING ─────────────────────────────────────────── */
function renderCampaigns() {
  const grid = document.getElementById('campaigns-grid');
  grid.innerHTML = '';

  CAMPAIGNS.forEach(camp => {
    const canAfford = G.money >= camp.cost;
    const btn = document.createElement('button');
    btn.className = 'campaign-card' + (!canAfford ? ' cant-afford' : '');
    btn.disabled  = !canAfford;
    btn.innerHTML = `
      <div class="camp-icon">${camp.icon}</div>
      <div class="camp-name">${camp.name}</div>
      <div class="camp-cost">${camp.cost} 💰</div>
      <div class="camp-effect">${camp.effectDesc}</div>`;
    btn.addEventListener('click', () => runCampaign(camp));
    grid.appendChild(btn);
  });
}

function runCampaign(camp) {
  if (G.money < camp.cost) { toast('❌ No tienes suficiente dinero'); return; }
  G.money        -= camp.cost;
  G.rep           = Math.min(100, G.rep + camp.repGain);
  G.stats.mktSpent+= camp.cost;

  toast(`📢 ¡Campaña "${camp.name}" lanzada! -${camp.cost} 💰`);
  addChat('system','📢 Marketing',`¡Campaña ${camp.icon} ${camp.name} en marcha! Espera los comentarios...`, 0);

  const pool = CHAT_COMMENTS[camp.id];
  const allComments = [
    ...shuffle([...pool.positive]).slice(0, 2),
    ...shuffle([...pool.neutral]).slice(0, 1),
    ...(G.rep < 20 && pool.negative ? shuffle([...pool.negative]).slice(0, 1) : []),
    ...shuffle([...pool.buyer]).slice(0, 1)
  ];

  // Stagger comments to feel like real-time replies
  allComments.forEach((msg, idx) => {
    setTimeout(() => {
      const npcIdx  = Math.floor(Math.random() * NPC_NAMES.length);
      const isPositive = pool.positive.includes(msg);
      const isNegative = pool.negative?.includes(msg);
      const isBuyer    = pool.buyer.includes(msg);
      const type = isBuyer ? 'buyer-msg' : isPositive ? 'positive' : isNegative ? 'negative' : 'neutral';
      const author = NPC_AVATARS[npcIdx] + ' ' + NPC_NAMES[npcIdx];
      addChat(type, author, msg, 0);

      // Si el mensaje es de un posible comprador, añadir comprador
      if (isBuyer) {
        setTimeout(() => spawnBuyer(camp.id, camp.id === 'brand' ? 'premium' : camp.id === 'radio' ? 'bulk' : null), 1200);
      }
    }, 800 + idx * 900);
  });

  // Bonus de compradores por la campaña
  setTimeout(() => {
    for (let i = 0; i < camp.buyersBonus; i++) {
      const type = camp.id === 'brand' ? 'premium' : camp.id === 'radio' ? 'bulk' : null;
      spawnBuyer(camp.id, type);
    }
    addChat('system','📊 Sistema', `La campaña atrajo ${camp.buyersBonus} nuevos compradores. +${camp.repGain} reputación.`, 0);
  }, allComments.length * 900 + 1200);

  renderCampaigns();
  updateHUD();
}

/* ── CHAT ──────────────────────────────────────────────── */
function addChat(type, author, msg, delay) {
  const action = () => {
    const feed = document.getElementById('chat-feed');
    const div  = document.createElement('div');
    div.className = 'chat-bubble ' + type;

    const now  = new Date();
    const time = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');

    div.innerHTML = `
      <div class="bubble-author">
        ${author}
        <span class="bubble-time">${time}</span>
      </div>
      ${msg}`;

    feed.appendChild(div);
    feed.scrollTop = feed.scrollHeight;
    G.chatMessages++;
    document.getElementById('chat-count').textContent = G.chatMessages;
  };

  if (delay > 0) setTimeout(action, delay);
  else action();
}

/* ── FIN ───────────────────────────────────────────────── */
function showEndScreen() {
  // Valorar inventario al precio de mercado
  const invValue = Object.entries(G.inventory).reduce((sum,[id,qty]) => sum + CROPS[id].basePrice * qty, 0);
  const totalWealth = G.money + invValue;
  const netProfit   = totalWealth - 500; // empezamos con 500

  let titleText, subText, rankClass, rankText, icon;

  if (netProfit >= 3500) {
    icon='👑'; titleText='¡IMPERIO AGRÍCOLA!'; rankClass='rank-empire';
    rankText='👑 Rango: MAGNATE — Tu empresa domina el mundo';
    subText=`¡Extraordinario! Ganancia neta: ${netProfit.toLocaleString()} 💰. Los mercados de Moonveil te pertenecen.`;
  } else if (netProfit >= 1500) {
    icon='🏭'; titleText='CORPORACIÓN ESTABLECIDA'; rankClass='rank-corp';
    rankText='🏭 Rango: DIRECTIVO — Harvest Corp es un nombre respetado';
    subText=`¡Muy bien! Ganancia neta: ${netProfit.toLocaleString()} 💰. Tu empresa tiene futuro brillante.`;
  } else if (netProfit >= 200) {
    icon='🚜'; titleText='GRANJERO DECENTE'; rankClass='rank-grower';
    rankText='🌱 Rango: PRODUCTOR — Aún hay margen de mejora';
    subText=`No está mal. Ganancia neta: ${netProfit.toLocaleString()} 💰. Aplica más marketing la próxima vez.`;
  } else {
    icon='💸'; titleText='EN NÚMEROS ROJOS'; rankClass='rank-broke';
    rankText='❌ Rango: QUIEBRA — Vuelve a la granja familiar';
    subText=`Ganancia neta: ${netProfit.toLocaleString()} 💰. Demasiados gastos, pocas ventas. ¡Inténtalo de nuevo!`;
  }

  document.getElementById('end-icon').textContent  = icon;
  document.getElementById('end-title').textContent = titleText;
  document.getElementById('end-sub').textContent   = subText;
  document.getElementById('end-rank').textContent  = rankText;
  document.getElementById('end-rank').className    = 'end-rank ' + rankClass;
  document.getElementById('end-stats').innerHTML   = `
    <div class="end-stat"><div class="end-stat-val">${totalWealth.toLocaleString()}</div><div class="end-stat-lbl">💰 Riqueza</div></div>
    <div class="end-stat"><div class="end-stat-val">${G.stats.harvested}</div><div class="end-stat-lbl">🌾 Cosechado</div></div>
    <div class="end-stat"><div class="end-stat-val">${G.stats.deals}</div><div class="end-stat-lbl">🤝 Tratos</div></div>
  `;

  document.getElementById('game-hud').style.display = 'none';
  showScreen('end');
}

/* ── UTILIDADES ────────────────────────────────────────── */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2800);
}

/* ── PARTÍCULAS ────────────────────────────────────────── */
(function particles() {
  const c = document.getElementById('bgParticles');
  if (!c) return;
  const ctx = c.getContext('2d');
  const dpi = Math.max(1, devicePixelRatio || 1);
  let w, h, parts;
  const init = () => {
    w = c.width  = innerWidth  * dpi;
    h = c.height = innerHeight * dpi;
    parts = Array.from({length:70}, () => ({
      x: Math.random()*w, y: Math.random()*h,
      r: (.5+Math.random()*1.8)*dpi, s: .12+Math.random()*.4,
      a: .06+Math.random()*.18,
      hue: Math.random()>.5 ? 35+Math.random()*20 : 90+Math.random()*30
    }));
  };
  const tick = () => {
    ctx.clearRect(0,0,w,h);
    parts.forEach(p => {
      p.y += p.s; p.x += Math.sin(p.y*.003)*.25;
      if (p.y > h) { p.y=-10; p.x=Math.random()*w; }
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle = `hsla(${p.hue},80%,65%,${p.a})`; ctx.fill();
    });
    requestAnimationFrame(tick);
  };
  init(); tick();
  addEventListener('resize', init);
})();

/* ── NAVBAR RESPONSIVE ─────────────────────────────────── */
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');
navToggle?.addEventListener('click', e => { e.stopPropagation(); navLinks.classList.toggle('open'); });
document.addEventListener('click', e => {
  if (!navToggle?.contains(e.target) && !navLinks?.contains(e.target)) navLinks?.classList.remove('open');
});

/* ── LISTENERS PRINCIPALES ─────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  // Iniciar juego
  document.getElementById('btn-start').addEventListener('click', initGame);

  // Reiniciar
  document.getElementById('btn-restart').addEventListener('click', () => {
    document.getElementById('game-hud').style.display = 'none';
    showScreen('title');
  });

  // Día siguiente
  document.getElementById('btn-nextday').addEventListener('click', advanceDay);

  // Cerrar modal plantar
  document.getElementById('plant-close').addEventListener('click', () => {
    document.getElementById('modal-plant').classList.add('hidden');
  });
  document.getElementById('modal-plant').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-plant')) document.getElementById('modal-plant').classList.add('hidden');
  });

  // Cerrar modal subasta
  document.getElementById('auction-close').addEventListener('click', () => {
    document.getElementById('modal-auction').classList.add('hidden');
  });

  // Modal vender mercado
  document.getElementById('mksell-close').addEventListener('click', () => document.getElementById('modal-mksell').classList.add('hidden'));
  document.getElementById('modal-mksell').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-mksell')) document.getElementById('modal-mksell').classList.add('hidden');
  });
  document.getElementById('mksell-minus').addEventListener('click', () => {
    const inp = document.getElementById('mksell-qty');
    inp.value = Math.max(1, +inp.value - 1);
    updateMkSellTotal();
  });
  document.getElementById('mksell-plus').addEventListener('click', () => {
    const inp = document.getElementById('mksell-qty');
    inp.value = Math.min(+inp.max, +inp.value + 1);
    updateMkSellTotal();
  });
  document.getElementById('mksell-qty').addEventListener('input', updateMkSellTotal);
  document.getElementById('mksell-confirm').addEventListener('click', confirmMkSell);

  // Pantalla inicial activa
  showScreen('title');
});