/* =========================================================
   Moonveil Merchants — Minijuego JS
   Un roguelite de comercio: compra barato, vende caro.
   ========================================================= */

/* ─── DATOS DEL JUEGO ────────────────────────────── */

const GOODS = [
  { id: 'wheat',   name: 'Trigo',         emoji: '🌾', category: 'Alimentos',  basePrice: 12  },
  { id: 'iron',    name: 'Hierro',         emoji: '⚙️',  category: 'Metales',    basePrice: 28  },
  { id: 'silk',    name: 'Seda',           emoji: '🧵', category: 'Lujo',       basePrice: 55  },
  { id: 'spices',  name: 'Especias',       emoji: '🌶️',  category: 'Comercio',   basePrice: 70  },
  { id: 'potions', name: 'Pociones',       emoji: '⚗️',  category: 'Alquimia',   basePrice: 110 },
  { id: 'crystals',name: 'Cristales',      emoji: '💎', category: 'Minerales',  basePrice: 90  },
  { id: 'maps',    name: 'Mapas Arcanos',  emoji: '🗺️',  category: 'Raridades',  basePrice: 160 },
  { id: 'moonstone',name:'Piedra Lunar',   emoji: '🌙', category: 'Raridades',  basePrice: 220 }
];

// Posiciones de nodos en el mapa (en % de ancho/alto)
const MARKETS = [
  {
    id: 'vale',
    name: 'Valle Susurro',
    emoji: '🌿',
    x: 18, y: 30,
    flavor: 'Un pueblo tranquilo rodeado de campos de trigo y jardines medicinales.',
    specialty: 'wheat',
    hates: ['silk', 'maps'],
    multipliers: { wheat: 0.55, iron: 1.1, silk: 1.4, spices: 1.0, potions: 0.9, crystals: 1.1, maps: 1.5, moonstone: 1.2 }
  },
  {
    id: 'peak',
    name: 'Pico Hierro',
    emoji: '⚒️',
    x: 75, y: 22,
    flavor: 'Fortaleza minera en lo alto de las montañas. Los herreros reinan aquí.',
    specialty: 'iron',
    hates: ['wheat', 'spices'],
    multipliers: { wheat: 1.4, iron: 0.5, silk: 1.2, spices: 1.5, potions: 1.1, crystals: 0.8, maps: 1.1, moonstone: 1.3 }
  },
  {
    id: 'harbor',
    name: 'Puerto Seda',
    emoji: '⛵',
    x: 80, y: 68,
    flavor: 'Ciudad portuaria vibrante. Comerciantes de seda y especias llenan sus muelles.',
    specialty: 'silk',
    hates: ['iron', 'crystals'],
    multipliers: { wheat: 1.1, iron: 1.45, silk: 0.5, spices: 0.65, potions: 1.1, crystals: 1.5, maps: 1.2, moonstone: 1.1 }
  },
  {
    id: 'caverns',
    name: 'Cavernas Eternas',
    emoji: '💎',
    x: 25, y: 72,
    flavor: 'Minas profundas donde los cristales crecen como flores. Lugar misterioso.',
    specialty: 'crystals',
    hates: ['wheat', 'silk'],
    multipliers: { wheat: 1.5, iron: 0.9, silk: 1.5, spices: 1.2, potions: 0.85, crystals: 0.45, maps: 1.0, moonstone: 0.6 }
  },
  {
    id: 'shadow',
    name: 'Bazar Sombra',
    emoji: '🌑',
    x: 50, y: 48,
    flavor: 'Mercado secreto al centro del mundo. Precios impredecibles, riesgos enormes.',
    specialty: null,
    hates: [],
    multipliers: { wheat: 1.0, iron: 1.0, silk: 1.0, spices: 1.0, potions: 1.0, crystals: 1.0, maps: 0.55, moonstone: 0.5 }
  }
];

const EVENTS = [
  {
    id: 'bandit',
    icon: '🗡️',
    title: '¡Emboscada de Bandidos!',
    desc: 'Un grupo de salteadores te ataca en el camino. Pierdes parte de tu oro en el escape.',
    type: 'negative',
    apply: (state) => {
      const loss = Math.floor(state.gold * (0.1 + Math.random() * 0.15));
      state.gold = Math.max(0, state.gold - loss);
      return `💀 Pierdes ${loss} 🪙 de oro`;
    }
  },
  {
    id: 'festival',
    icon: '🎪',
    title: '¡Festival del Mercado!',
    desc: 'Una fiesta regional hace que todos los precios suban en el siguiente mercado.',
    type: 'positive',
    apply: (state) => {
      state.priceBonus = 1.3;
      return `🎉 ¡Precios +30% en el próximo mercado!`;
    }
  },
  {
    id: 'drought',
    icon: '☀️',
    title: 'Gran Sequía',
    desc: 'La escasez de alimentos dispara el precio del trigo en todas partes por un día.',
    type: 'neutral',
    apply: (state) => {
      state.specialBonus = { goodId: 'wheat', mult: 2.0 };
      return `🌾 Precio del Trigo x2 temporalmente`;
    }
  },
  {
    id: 'treasure',
    icon: '💰',
    title: '¡Tesoro Encontrado!',
    desc: 'Entre unas ruinas, encuentras una bolsa olvidada llena de monedas.',
    type: 'positive',
    apply: (state) => {
      const gain = 50 + Math.floor(Math.random() * 100);
      state.gold += gain;
      return `✨ Encuentras ${gain} 🪙`;
    }
  },
  {
    id: 'dragon',
    icon: '🐉',
    title: '¡Avistamiento de Dragón!',
    desc: 'Un dragón devasta una mina cercana. Los cristales y piedras lunares se vuelven escasos.',
    type: 'neutral',
    apply: (state) => {
      state.specialBonus = { goodId: 'moonstone', mult: 1.8 };
      state.specialBonus2 = { goodId: 'crystals', mult: 1.6 };
      return `💎 Cristales y Piedra Lunar +60-80% de precio`;
    }
  },
  {
    id: 'guild',
    icon: '📜',
    title: '¡Contrato del Gremio!',
    desc: 'El Gremio de Mercaderes te ofrece una recompensa por entregar seda.',
    type: 'positive',
    apply: (state) => {
      state.specialBonus = { goodId: 'silk', mult: 1.7 };
      return `🧵 Precio de la Seda +70% temporalmente`;
    }
  },
  {
    id: 'storm',
    icon: '⛈️',
    title: 'Tormenta de Arena',
    desc: 'Las rutas comerciales se ven afectadas. Pierdes un día extra en el viaje.',
    type: 'negative',
    apply: (state) => {
      state.day = Math.min(20, state.day + 1);
      return `⏳ Pierdes 1 día adicional de viaje`;
    }
  },
  {
    id: 'alchemist',
    icon: '🧙',
    title: '¡Alquimista Errante!',
    desc: 'Un misterioso alquimista te ofrece pociones a mitad de precio por tiempo limitado.',
    type: 'positive',
    apply: (state) => {
      state.specialBonus = { goodId: 'potions', mult: 0.5, isBuy: true };
      return `⚗️ ¡Pociones al 50% de precio al comprar!`;
    }
  }
];

/* ─── ESTADO DEL JUEGO ───────────────────────────── */
let G = {};

function initGame() {
  G = {
    gold: 200,
    day: 1,
    maxDays: 20,
    inventory: [],  // { goodId, qty, buyPrice }
    currentMarket: 'vale',
    prices: {},     // { marketId: { goodId: price } }
    priceHistory: {}, // { marketId: { goodId: [prev, current] } }
    priceBonus: 1,
    specialBonus: null,
    specialBonus2: null,
    totalSpent: 0,
    totalEarned: 0,
    tradesCount: 0,
    marketsVisited: new Set(['vale'])
  };

  generatePrices();
  buildAchievements();
  renderMarket(G.currentMarket);
  showScreen('market');
}

function generatePrices() {
  MARKETS.forEach(market => {
    if (!G.prices[market.id]) G.prices[market.id] = {};
    if (!G.priceHistory[market.id]) G.priceHistory[market.id] = {};

    GOODS.forEach(good => {
      const prevPrice = G.prices[market.id][good.id] || null;
      const mult = market.multipliers[good.id] || 1;
      const variance = 0.85 + Math.random() * 0.3;

      // Bazar Sombra tiene más varianza
      const extraVariance = (market.id === 'shadow') ? (0.7 + Math.random() * 0.6) : 1;
      const newPrice = Math.round(good.basePrice * mult * variance * extraVariance * (G.priceBonus || 1));

      G.priceHistory[market.id][good.id] = [prevPrice, newPrice];
      G.prices[market.id][good.id] = Math.max(5, newPrice);
    });
  });

  // Aplicar bonus especiales temporales
  if (G.specialBonus) {
    const { goodId, mult, isBuy } = G.specialBonus;
    if (isBuy) {
      // Descuento de compra solo en mercado actual
      G.prices[G.currentMarket][goodId] = Math.round(G.prices[G.currentMarket][goodId] * mult);
    } else {
      MARKETS.forEach(m => {
        G.prices[m.id][goodId] = Math.round(G.prices[m.id][goodId] * mult);
      });
    }
  }
  if (G.specialBonus2) {
    const { goodId, mult } = G.specialBonus2;
    MARKETS.forEach(m => {
      G.prices[m.id][goodId] = Math.round(G.prices[m.id][goodId] * mult);
    });
  }
}

/* ─── NAVEGACIÓN DE PANTALLAS ────────────────────── */
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('screen-' + name);
  if (el) el.classList.add('active');
}

/* ─── RENDERIZAR MERCADO ─────────────────────────── */
function renderMarket(marketId) {
  const market = MARKETS.find(m => m.id === marketId);
  if (!market) return;

  document.getElementById('market-name').textContent = market.name;
  document.getElementById('market-flavor').textContent = market.flavor;
  document.getElementById('market-icon-big').textContent = market.emoji;

  const goodsList = document.getElementById('goods-list');
  goodsList.innerHTML = '';

  GOODS.forEach(good => {
    const price = G.prices[marketId][good.id];
    const history = G.priceHistory[marketId][good.id];
    const prevPrice = history ? history[0] : null;
    let trendHTML = '<span class="trend flat">— —</span>';

    if (prevPrice !== null) {
      const diff = price - prevPrice;
      if (diff > 0)       trendHTML = `<span class="trend up">▲ +${diff}</span>`;
      else if (diff < 0)  trendHTML = `<span class="trend down">▼ ${diff}</span>`;
      else                trendHTML = `<span class="trend flat">— —</span>`;
    }

    const invItem = G.inventory.find(i => i.goodId === good.id);
    const hasSellable = invItem && invItem.qty > 0;

    const row = document.createElement('div');
    row.className = 'good-row';
    row.innerHTML = `
      <div class="good-info">
        <span class="good-emoji">${good.emoji}</span>
        <div>
          <div class="good-name">${good.name}</div>
          <div class="good-category">${good.category}</div>
        </div>
      </div>
      <div class="good-price">${price} 🪙</div>
      <div>${trendHTML}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        <button class="btn-buy" data-good="${good.id}" data-price="${price}">Comprar</button>
        <button class="btn-sell" data-good="${good.id}" data-price="${price}" ${!hasSellable ? 'disabled' : ''}>
          Vender
        </button>
      </div>
    `;
    goodsList.appendChild(row);
  });

  // Event delegation
  goodsList.querySelectorAll('.btn-buy').forEach(btn => {
    btn.addEventListener('click', () => openTradeModal('buy', btn.dataset.good, +btn.dataset.price));
  });
  goodsList.querySelectorAll('.btn-sell').forEach(btn => {
    if (!btn.disabled) btn.addEventListener('click', () => openTradeModal('sell', btn.dataset.good, +btn.dataset.price));
  });

  renderInventory();
  updateHUD();
}

/* ─── INVENTARIO ─────────────────────────────────── */
function renderInventory() {
  const list = document.getElementById('inv-list');
  const totalQty = G.inventory.reduce((s, i) => s + i.qty, 0);

  // HUD
  document.getElementById('inv-fill').style.width = (totalQty / 20 * 100) + '%';
  document.getElementById('inv-text').textContent = totalQty + '/20';
  document.getElementById('hud-inv').textContent = totalQty;

  if (G.inventory.length === 0) {
    list.innerHTML = '<p class="inv-empty">Tu inventario está vacío</p>';
    return;
  }

  list.innerHTML = '';
  G.inventory.forEach(item => {
    const good = GOODS.find(g => g.id === item.goodId);
    const currentPrice = G.prices[G.currentMarket][item.goodId];
    const profit = (currentPrice - item.buyPrice) * item.qty;
    const profitText = profit >= 0
      ? `<span style="color:#4ade80">+${profit} 🪙</span>`
      : `<span style="color:#f87171">${profit} 🪙</span>`;

    const el = document.createElement('div');
    el.className = 'inv-item';
    el.innerHTML = `
      <span class="inv-item-emoji">${good.emoji}</span>
      <div class="inv-item-info">
        <div class="inv-item-name">${good.name} ×${item.qty}</div>
        <div class="inv-item-qty-price">Costo: ${item.buyPrice} 🪙 · Aquí: ${currentPrice} 🪙 · ${profitText}</div>
      </div>
    `;
    list.appendChild(el);
  });

  // Stats
  const spent  = G.inventory.reduce((s, i) => s + i.buyPrice * i.qty, 0);
  const earned = G.totalEarned;
  const profit = earned - G.totalSpent;
  document.getElementById('stat-spent').textContent  = G.totalSpent + ' 🪙';
  document.getElementById('stat-earned').textContent = earned + ' 🪙';
  const profitEl = document.getElementById('stat-profit');
  profitEl.textContent = profit + ' 🪙';
  profitEl.className   = profit >= 0 ? 'success-text' : 'danger-text';
}

/* ─── MODAL COMPRA/VENTA ─────────────────────────── */
let modalMode = null, modalGoodId = null, modalPrice = 0;

function openTradeModal(mode, goodId, price) {
  modalMode   = mode;
  modalGoodId = goodId;
  modalPrice  = price;

  const good = GOODS.find(g => g.id === goodId);
  const modal = document.getElementById('trade-modal');
  const invItem = G.inventory.find(i => i.goodId === goodId);
  const maxQty  = mode === 'buy'
    ? Math.min(Math.floor(G.gold / price), 20 - G.inventory.reduce((s,i) => s + i.qty, 0))
    : (invItem ? invItem.qty : 0);

  document.getElementById('modal-icon').textContent   = good.emoji;
  document.getElementById('modal-title').textContent  = good.name;
  document.getElementById('modal-price-info').textContent =
    mode === 'buy' ? `Precio: ${price} 🪙 por unidad` : `Vendes a: ${price} 🪙 por unidad`;
  document.getElementById('modal-confirm').textContent =
    mode === 'buy' ? '✅ Comprar' : '💰 Vender';
  document.getElementById('modal-confirm').className =
    'btn-main ' + (mode === 'buy' ? '' : 'gold');

  const input = document.getElementById('qty-input');
  input.value = Math.max(1, Math.min(maxQty, 1));
  input.max   = maxQty;

  updateModalTotal();
  modal.classList.remove('hidden');
  input.focus();
}

function updateModalTotal() {
  const qty   = Math.max(1, +document.getElementById('qty-input').value || 1);
  const total = qty * modalPrice;
  const good  = GOODS.find(g => g.id === modalGoodId);
  const invItem = G.inventory.find(i => i.goodId === modalGoodId);
  const maxQty = modalMode === 'buy'
    ? Math.min(Math.floor(G.gold / modalPrice), 20 - G.inventory.reduce((s,i) => s + i.qty, 0))
    : (invItem ? invItem.qty : 0);

  document.getElementById('modal-total').textContent = total + ' 🪙';

  let warning = '';
  if (modalMode === 'buy' && total > G.gold)       warning = '⚠️ No tienes suficiente oro';
  else if (modalMode === 'buy' && qty > maxQty && maxQty <= 0)
    warning = '⚠️ Inventario lleno';
  else if (qty > maxQty)
    warning = `⚠️ Máximo disponible: ${maxQty}`;
  document.getElementById('modal-warning').textContent = warning;
}

function confirmTrade() {
  let qty = +document.getElementById('qty-input').value || 1;
  if (qty < 1) return;

  if (modalMode === 'buy') {
    const total   = qty * modalPrice;
    const invTotal = G.inventory.reduce((s,i) => s + i.qty, 0);
    if (total > G.gold)         { toast('❌ No tienes suficiente oro'); return; }
    if (invTotal + qty > 20)    { toast('❌ Inventario lleno (máx. 20)'); return; }

    G.gold -= total;
    G.totalSpent += total;
    G.tradesCount++;

    const existing = G.inventory.find(i => i.goodId === modalGoodId);
    if (existing) {
      // Precio promedio ponderado
      const totalQty  = existing.qty + qty;
      existing.buyPrice = Math.round((existing.buyPrice * existing.qty + modalPrice * qty) / totalQty);
      existing.qty    = totalQty;
    } else {
      G.inventory.push({ goodId: modalGoodId, qty, buyPrice: modalPrice });
    }

    const good = GOODS.find(g => g.id === modalGoodId);
    toast(`🛒 Compraste ${qty}× ${good.emoji} ${good.name} por ${total} 🪙`);

  } else {
    const existing = G.inventory.find(i => i.goodId === modalGoodId);
    if (!existing || existing.qty < qty) { toast('❌ No tienes suficiente en inventario'); return; }

    const total = qty * modalPrice;
    G.gold += total;
    G.totalEarned += total;
    G.tradesCount++;
    existing.qty -= qty;
    if (existing.qty <= 0) G.inventory = G.inventory.filter(i => i.goodId !== modalGoodId);

    const good = GOODS.find(g => g.id === modalGoodId);
    const profit = (modalPrice - existing.buyPrice) * qty;
    const pIcon  = profit >= 0 ? '📈' : '📉';
    toast(`💰 Vendiste ${qty}× ${good.emoji} ${good.name} por ${total} 🪙 ${pIcon} ${profit > 0 ? '+' : ''}${profit}`);
  }

  document.getElementById('trade-modal').classList.add('hidden');
  renderMarket(G.currentMarket);
  updateHUD();
  checkEndConditions();
}

/* ─── MAPA MUNDIAL ───────────────────────────────── */
function renderWorldMap() {
  const container = document.getElementById('world-map');
  const svg       = document.getElementById('map-svg');

  // Limpiar nodos previos (no el SVG)
  container.querySelectorAll('.market-node').forEach(n => n.remove());

  // Dibujar líneas de conexión en SVG
  svg.innerHTML = '';
  const w = container.offsetWidth  || 900;
  const h = container.offsetHeight || 500;
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

  // Conectar todos con el Bazar Sombra (centro) y adyacentes
  const connections = [
    ['vale',   'shadow'], ['peak',   'shadow'], ['harbor', 'shadow'],
    ['caverns','shadow'], ['vale',   'peak'],   ['harbor', 'caverns']
  ];
  connections.forEach(([a, b]) => {
    const mA = MARKETS.find(m => m.id === a);
    const mB = MARKETS.find(m => m.id === b);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', mA.x / 100 * w);
    line.setAttribute('y1', mA.y / 100 * h);
    line.setAttribute('x2', mB.x / 100 * w);
    line.setAttribute('y2', mB.y / 100 * h);
    svg.appendChild(line);
  });

  // Crear nodos
  MARKETS.forEach(market => {
    const node = document.createElement('div');
    node.className = 'market-node' + (market.id === G.currentMarket ? ' current' : '');
    node.style.left = market.x + '%';
    node.style.top  = market.y + '%';

    // Encontrar buen precio relativo para hint
    const bestGood   = GOODS.reduce((best, g) => {
      return (G.prices[market.id][g.id] < G.prices[market.id][best.id]) ? g : best;
    });

    node.innerHTML = `
      <div class="node-circle">${market.emoji}</div>
      <div class="node-name">${market.name}</div>
      <div class="node-price-hint">${bestGood.emoji} barato aquí</div>
    `;

    if (market.id !== G.currentMarket) {
      node.addEventListener('click', () => travelTo(market.id));
    } else {
      node.style.cursor = 'default';
    }

    container.appendChild(node);
  });
}

function travelTo(marketId) {
  if (marketId === G.currentMarket) return;
  if (G.day >= G.maxDays) { showEndScreen(); return; }

  G.currentMarket = marketId;
  G.marketsVisited.add(marketId);
  G.day++;

  // Reset bonos temporales
  G.priceBonus   = 1;
  G.specialBonus = null;
  G.specialBonus2= null;

  // ¿Hay evento?
  const eventChance = 0.55;
  if (Math.random() < eventChance) {
    const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    triggerEvent(event, marketId);
  } else {
    generatePrices();
    renderMarket(G.currentMarket);
    showScreen('market');
    updateHUD();
    if (G.day >= G.maxDays && G.inventory.length === 0) showEndScreen();
  }
}

function triggerEvent(event, destMarket) {
  const effectText = event.apply(G);

  document.getElementById('event-icon').textContent  = event.icon;
  document.getElementById('event-title').textContent = event.title;
  document.getElementById('event-desc').textContent  = event.desc;

  const effectEl = document.getElementById('event-effect');
  effectEl.textContent  = effectText;
  effectEl.className    = 'event-effect ' + event.type;

  showScreen('event');

  document.getElementById('btn-continue-event').onclick = () => {
    generatePrices();
    renderMarket(G.currentMarket);
    showScreen('market');
    updateHUD();
    if (G.day >= G.maxDays && G.inventory.length === 0) showEndScreen();
  };
}

/* ─── HUD ─────────────────────────────────────────── */
function updateHUD() {
  document.getElementById('hud-gold').textContent = G.gold.toLocaleString();
  document.getElementById('hud-day').textContent  = G.day;
  const totalQty = G.inventory.reduce((s,i) => s + i.qty, 0);
  document.getElementById('hud-inv').textContent  = totalQty;
}

/* ─── LOGROS (ACHIEVEMENTS) ─────────────────────── */
function buildAchievements() { /* Placeholder para futura expansión */ }

/* ─── FIN DEL JUEGO ──────────────────────────────── */
function checkEndConditions() {
  if (G.day >= G.maxDays) showEndScreen();
}

function showEndScreen() {
  const { gold, day, tradesCount, marketsVisited } = G;
  const invValue = G.inventory.reduce((s,i) => {
    const best = Math.max(...MARKETS.map(m => G.prices[m.id][i.goodId]));
    return s + best * i.qty;
  }, 0);
  const totalWealth = gold + invValue;

  let titleText, subtitleText, rankClass, rankText;

  if (totalWealth >= 2000) {
    titleText    = '👑 LEYENDA COMERCIAL';
    subtitleText = `¡Imposible! Acumulaste ${totalWealth.toLocaleString()} 🪙. Tu nombre será recordado eternamente en los mercados de Moonveil.`;
    rankClass    = 'rank-legend';
    rankText     = '🏆 Rango: LEYENDA — Los reyes te envidian';
  } else if (totalWealth >= 1000) {
    titleText    = '💰 META ALCANZADA';
    subtitleText = `¡Extraordinario! Terminaste con ${totalWealth.toLocaleString()} 🪙. Eres un verdadero maestro del comercio.`;
    rankClass    = 'rank-master';
    rankText     = '⭐ Rango: MAESTRO MERCADER — El gremio te respeta';
  } else if (totalWealth >= 400) {
    titleText    = '📦 COMERCIANTE DECENTE';
    subtitleText = `Terminaste con ${totalWealth.toLocaleString()} 🪙. No está mal para un novato, ¡pero el mundo espera más de ti!`;
    rankClass    = 'rank-novice';
    rankText     = '🌱 Rango: APRENDIZ — Aún queda mucho por aprender';
  } else {
    titleText    = '💸 BOLSILLOS VACÍOS';
    subtitleText = `Solo ${totalWealth.toLocaleString()} 🪙... Los bandidos te comieron vivo. Inténtalo de nuevo, mercader.`;
    rankClass    = 'rank-broke';
    rankText     = '💀 Rango: ARRUINADO — Mejor vuelve a la granja';
  }

  document.getElementById('end-icon').textContent    = totalWealth >= 1000 ? '👑' : totalWealth >= 400 ? '🎒' : '💸';
  document.getElementById('end-title').textContent   = titleText;
  document.getElementById('end-subtitle').textContent = subtitleText;
  document.getElementById('end-rank').textContent    = rankText;
  document.getElementById('end-rank').className      = 'end-rank ' + rankClass;

  document.getElementById('end-stats').innerHTML = `
    <div class="end-stat">
      <div class="end-stat-val">${totalWealth.toLocaleString()}</div>
      <div class="end-stat-label">🪙 Riqueza Total</div>
    </div>
    <div class="end-stat">
      <div class="end-stat-val">${gold.toLocaleString()}</div>
      <div class="end-stat-label">💰 Oro en Mano</div>
    </div>
    <div class="end-stat">
      <div class="end-stat-val">${tradesCount}</div>
      <div class="end-stat-label">📊 Transacciones</div>
    </div>
    <div class="end-stat">
      <div class="end-stat-val">${marketsVisited.size}/5</div>
      <div class="end-stat-label">🗺️ Mercados Visitados</div>
    </div>
  `;

  showScreen('end');
}

/* ─── PARTÍCULAS ─────────────────────────────────── */
(function particles() {
  const c = document.getElementById('bgParticles');
  if (!c) return;
  const ctx = c.getContext('2d');
  const dpi = Math.max(1, devicePixelRatio || 1);
  let w, h, parts;

  const init = () => {
    w = c.width  = innerWidth  * dpi;
    h = c.height = innerHeight * dpi;
    parts = Array.from({ length: 80 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: (0.5 + Math.random() * 2) * dpi,
      s: 0.15 + Math.random() * 0.5,
      a: 0.08 + Math.random() * 0.2,
      hue: Math.random() > 0.7 ? 45 : 145 + Math.random() * 20
    }));
  };

  const tick = () => {
    ctx.clearRect(0, 0, w, h);
    parts.forEach(p => {
      p.y += p.s;
      p.x += Math.sin(p.y * 0.003) * 0.3;
      if (p.y > h) { p.y = -10; p.x = Math.random() * w; }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 80%, 65%, ${p.a})`;
      ctx.fill();
    });
    requestAnimationFrame(tick);
  };

  init(); tick();
  addEventListener('resize', init);
})();

/* ─── NAVBAR RESPONSIVE ──────────────────────────── */
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');
navToggle?.addEventListener('click', e => {
  e.stopPropagation();
  navLinks.classList.toggle('open');
});
document.addEventListener('click', e => {
  if (!navToggle?.contains(e.target) && !navLinks?.contains(e.target)) {
    navLinks?.classList.remove('open');
  }
});

/* ─── TOAST ──────────────────────────────────────── */
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2800);
}

/* ─── EVENT LISTENERS ────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  // Título → Iniciar
  document.getElementById('btn-start').addEventListener('click', () => {
    initGame();
  });

  // Restart
  document.getElementById('btn-restart').addEventListener('click', () => {
    showScreen('title');
    setTimeout(() => {
      toast('💚 ¡Buena suerte, mercader!');
    }, 300);
  });

  // Volver al mapa desde el mercado
  document.getElementById('btn-back-map').addEventListener('click', () => {
    renderWorldMap();
    showScreen('map');
  });

  // Botón de viajar desde panel inventario
  document.getElementById('btn-open-map').addEventListener('click', () => {
    renderWorldMap();
    showScreen('map');
  });

  // Modal controles
  document.getElementById('modal-close').addEventListener('click', () => {
    document.getElementById('trade-modal').classList.add('hidden');
  });

  document.getElementById('trade-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('trade-modal')) {
      document.getElementById('trade-modal').classList.add('hidden');
    }
  });

  const qtyInput = document.getElementById('qty-input');
  document.getElementById('qty-minus').addEventListener('click', () => {
    qtyInput.value = Math.max(1, (+qtyInput.value || 1) - 1);
    updateModalTotal();
  });
  document.getElementById('qty-plus').addEventListener('click', () => {
    const max = +qtyInput.max || 99;
    qtyInput.value = Math.min(max, (+qtyInput.value || 1) + 1);
    updateModalTotal();
  });
  qtyInput.addEventListener('input', updateModalTotal);

  document.getElementById('modal-confirm').addEventListener('click', confirmTrade);

  // Pantalla título activa
  showScreen('title');
  setTimeout(() => toast('💚 ¡Bienvenido a Moonveil Merchants!'), 500);
});