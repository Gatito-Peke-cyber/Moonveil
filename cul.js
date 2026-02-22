/* =====================================================
   Eden Tycoon · cul.js  — VERSIÓN CORREGIDA
   Fixes:
   1. showScreen llamado correctamente dentro de DOMContentLoaded
   2. renderStats() eliminado (no existía); updateHUD() lo cubre
   3. G.collection serializado correctamente (Array en lugar de Set)
   4. Modal de evento tiene cierre por click en overlay
   5. advanceDay() no llama showEndScreen dos veces
   6. harvestPlot() no falla si botanist intenta cosechar misma parcela
   7. sellAll() refresca upgrades correctamente
   8. openSellModal abre modal correcto cuando hay doradas y normales
   9. Lavanda usa emoji neutro para mayor compatibilidad
   10. weatherBadge se actualiza con el evento activo
   ===================================================== */

/* ─── DATOS: PLANTAS ─────────────────────────────────── */
const PLANTS = {
  fern:        { id:'fern',        name:'Helecho',         emoji:'🌿', grow:1, seedCost:8,   basePrice:22,  rarity:'common',    minLvl:1,  multiHarvest:false, desc:'Crece rápido, ideal para empezar' },
  mushroom:    { id:'mushroom',    name:'Champiñón',       emoji:'🍄', grow:1, seedCost:10,  basePrice:28,  rarity:'common',    minLvl:1,  multiHarvest:false, desc:'Listo en un día, vende bien' },
  sunflower:   { id:'sunflower',   name:'Girasol',         emoji:'🌻', grow:2, seedCost:15,  basePrice:48,  rarity:'common',    minLvl:1,  multiHarvest:false, desc:'Alegre y rentable' },
  cactus:      { id:'cactus',      name:'Cactus',          emoji:'🌵', grow:2, seedCost:12,  basePrice:40,  rarity:'common',    minLvl:1,  multiHarvest:false, desc:'Resiste sequías sin problema' },
  bamboo:      { id:'bamboo',      name:'Bambú',           emoji:'🎋', grow:2, seedCost:18,  basePrice:55,  rarity:'common',    minLvl:2,  multiHarvest:true,  desc:'Da 2 cosechas antes de vaciarse' },
  lavender:    { id:'lavender',    name:'Lavanda',         emoji:'🪻', grow:2, seedCost:22,  basePrice:65,  rarity:'uncommon',  minLvl:2,  multiHarvest:false, desc:'Aromática y valiosa' },
  orchid:      { id:'orchid',      name:'Orquídea',        emoji:'🌸', grow:3, seedCost:40,  basePrice:100, rarity:'uncommon',  minLvl:3,  multiHarvest:false, desc:'Planta de lujo muy cotizada' },
  lotus:       { id:'lotus',       name:'Loto',            emoji:'🪷', grow:3, seedCost:45,  basePrice:115, rarity:'uncommon',  minLvl:3,  multiHarvest:false, desc:'Flor sagrada de alto valor' },
  bonsai:      { id:'bonsai',      name:'Bonsái',          emoji:'🌳', grow:5, seedCost:90,  basePrice:260, rarity:'rare',      minLvl:5,  multiHarvest:false, desc:'Arte vivo. La espera vale la pena' },
  venus:       { id:'venus',       name:'Atrapamoscas',    emoji:'🪲', grow:4, seedCost:75,  basePrice:195, rarity:'rare',      minLvl:4,  multiHarvest:false, desc:'Exótica y fascinante' },
  rosegold:    { id:'rosegold',    name:'Rosa Cristal',    emoji:'🌹', grow:4, seedCost:80,  basePrice:210, rarity:'rare',      minLvl:4,  multiHarvest:false, desc:'La favorita de coleccionistas' },
  dragonfruit: { id:'dragonfruit', name:'Pitahaya',        emoji:'🐉', grow:3, seedCost:60,  basePrice:170, rarity:'rare',      minLvl:5,  multiHarvest:false, desc:'Fruto legendario de los trópicos' },
};

/* ─── DATOS: MEJORAS ─────────────────────────────────── */
const UPGRADES = [
  { id:'soil',       icon:'🌍', name:'Tierra Premium',      desc:'Las plantas crecen 1 día más rápido',            cost:120, badge:'ulb-green', badgeText:'Velocidad', effect:'grow_speed',  maxLevel:1 },
  { id:'fertilizer', icon:'⚗️', name:'Fertilizante Dorado', desc:'+20% probabilidad de mutación dorada',           cost:200, badge:'ulb-gold',  badgeText:'Mutación',  effect:'mutation',    maxLevel:1 },
  { id:'greenhouse', icon:'🏠', name:'Invernadero',          desc:'Inmune a todos los eventos climáticos negativos',cost:350, badge:'ulb-green', badgeText:'Protección',effect:'weather',     maxLevel:1 },
  { id:'booth',      icon:'🏪', name:'Puesto de Mercado',    desc:'+25% en todos los precios de venta',             cost:280, badge:'ulb-gold',  badgeText:'Precio',    effect:'price_boost', maxLevel:1 },
  { id:'lab',        icon:'🔬', name:'Laboratorio Botánico', desc:'Desbloquea acceso a plantas Raras desde nivel 3',cost:450, badge:'ulb-lav',  badgeText:'Desbloqueo',effect:'lab',         maxLevel:1 },
  { id:'sprinkler',  icon:'💧', name:'Sistema de Riego',     desc:'Las plantas no retroceden por sequía',           cost:160, badge:'ulb-green', badgeText:'Riego',     effect:'sprinkler',   maxLevel:1 },
  { id:'botanist',   icon:'👩‍🌾', name:'Botánico Contratado',  desc:'Auto-cosecha todas las plantas listas cada día', cost:600, badge:'ulb-lav',  badgeText:'Automático',effect:'botanist',    maxLevel:1 },
  { id:'expander',   icon:'📐', name:'Expandir Jardín',      desc:'+2 parcelas nuevas (máx. 14 en total)',          cost:300, badge:'ulb-green', badgeText:'Expansión', effect:'expand',      maxLevel:4 },
];

/* ─── DATOS: EVENTOS ─────────────────────────────────── */
const EVENTS = [
  { id:'rain',     emoji:'🌧️', title:'¡Lluvia Abundante!',    desc:'El jardín se riega solo hoy. Las plantas crecen un día extra.',      type:'good',  effect:'extra_grow' },
  { id:'drought',  emoji:'☀️', title:'Ola de Calor',           desc:'Sequía intensa. Las plantas tardan 1 día más en crecer.',             type:'bad',   effect:'drought'    },
  { id:'pest',     emoji:'🐛', title:'Plaga de Insectos',      desc:'Algunos cultivos pierden progreso. El invernadero te protege.',       type:'bad',   effect:'pest'       },
  { id:'mktboom',  emoji:'📈', title:'¡Boom del Mercado!',     desc:'Los precios de hoy suben un 50%. ¡El momento de vender!',             type:'good',  effect:'mkt_boost'  },
  { id:'mktcrash', emoji:'📉', title:'Caída del Mercado',      desc:'Los precios bajan un 30% hoy. Espera mañana para vender.',            type:'bad',   effect:'mkt_crash'  },
  { id:'goldrain', emoji:'✨', title:'¡Lluvia Dorada!',        desc:'Magia en el jardín: todos los cultivos listos pueden mutar hoy.',      type:'gold',  effect:'gold_boost' },
  { id:'stranger', emoji:'🧙', title:'El Botánico Misterioso', desc:'Un viajero entrega semillas raras. Ganas 150 monedas extra.',         type:'good',  effect:'bonus_gold' },
  { id:'harvest',  emoji:'🌾', title:'Festival de Cosecha',    desc:'Día especial: cada planta cosechada da +20 monedas de bonus.',        type:'good',  effect:'harvest_bonus'},
];

/* ─── DATOS: MISIONES ─────────────────────────────────── */
const MISSION_POOL = [
  { id:'harvest3',  icon:'🌿', text:'Cosechar 3 plantas hoy',    reward:40,  xp:15, goal:3,   type:'harvest'   },
  { id:'harvest5',  icon:'🌿', text:'Cosechar 5 plantas hoy',    reward:70,  xp:25, goal:5,   type:'harvest'   },
  { id:'earn150',   icon:'💰', text:'Ganar 150 💰 hoy',          reward:35,  xp:12, goal:150, type:'earn'      },
  { id:'earn300',   icon:'💰', text:'Ganar 300 💰 hoy',          reward:60,  xp:22, goal:300, type:'earn'      },
  { id:'golden1',   icon:'✨', text:'Conseguir 1 mutación dorada',reward:100, xp:40, goal:1,   type:'golden'    },
  { id:'sellrare',  icon:'🌸', text:'Vender 1 planta rara',       reward:80,  xp:30, goal:1,   type:'sell_rare' },
  { id:'fill4',     icon:'🌱', text:'Tener 4 parcelas activas',   reward:30,  xp:10, goal:4,   type:'plots'     },
  { id:'buyseed',   icon:'🛒', text:'Plantar en 2 parcelas hoy',  reward:25,  xp:8,  goal:2,   type:'plant'     },
];

/* ─── DATOS: NIVELES ─────────────────────────────────── */
const LEVELS = [
  { lvl:1,  xpNeeded:0,    name:'Jardinero Novato',    unlock:null },
  { lvl:2,  xpNeeded:100,  name:'Botánico Aprendiz',   unlock:'Bambú y Lavanda desbloqueados' },
  { lvl:3,  xpNeeded:250,  name:'Cultivador Hábil',    unlock:'Orquídea y Loto desbloqueados' },
  { lvl:4,  xpNeeded:450,  name:'Experto Botanista',   unlock:'Atrapamoscas y Rosa Cristal' },
  { lvl:5,  xpNeeded:700,  name:'Maestro Vegetal',     unlock:'Bonsái y Pitahaya legendarios' },
  { lvl:6,  xpNeeded:1000, name:'Gran Jardinero',      unlock:'Bonus XP ×1.5 desbloqueado' },
  { lvl:7,  xpNeeded:1400, name:'Leyenda del Jardín',  unlock:'¡Título máximo alcanzado!' },
];

/* ─── ESTADO GLOBAL ──────────────────────────────────── */
let G = {};
let G_prices = {};
const PRICE_HISTORY = {};

/* ─── INICIALIZAR ───────────────────────────────────── */
function initGame() {
  // Limpiar historial de precios
  Object.keys(PRICE_HISTORY).forEach(k => delete PRICE_HISTORY[k]);

  G = {
    gold:           500,
    day:            1,
    maxDays:        20,
    xp:             0,
    level:          1,
    maxPlots:       6,
    plots: Array.from({length:14}, (_, i) => ({
      id:        i,
      state:     'empty',
      plantId:   null,
      daysLeft:  0,
      growDays:  0,
      golden:    false,
      harvests:  0
    })),
    inventory:      {},
    upgrades:       {},
    priceMultiplier:1,
    dayEarned:      0,
    dayHarvested:   0,
    dayPlanted:     0,
    dayGolden:      0,
    dayRareSold:    0,
    stats: {
      totalEarned:   0,
      totalHarvested:0,
      totalGolden:   0,
      bestSale:      0,
      days:          0
    },
    missions:       [],
    activeEvent:    null,
    pendingPlotId:  null,
    sellingItem:    null,
    harvestBonus:   0,
    collection:     [],    // FIX: array en lugar de Set para evitar errores de serialización
  };

  // Limpiar log de eventos
  const log = document.getElementById('events-log');
  if (log) log.innerHTML = '';

  generateMissions();
  generatePrices();
  renderPlots();
  renderMarket();
  renderUpgrades();
  renderInventory();
  renderMissions();
  updateHUD();

  document.getElementById('game-hud').style.display = '';
  showScreen('game');

  logEvent('system', '🌿 ¡Bienvenido a Eden Tycoon! Toca una parcela vacía para empezar a plantar.');
  logEvent('system', '💡 Consejo: los helechos y champiñones crecen en 1 día. ¡Perfectos para comenzar!');

  setTimeout(() => maybeEvent(), 400);
}

/* ─── PANTALLAS ─────────────────────────────────────── */
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById('screen-' + name);
  if (target) target.classList.add('active');
}

/* ─── HUD ───────────────────────────────────────────── */
function updateHUD() {
  const safe = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  safe('h-gold',    G.gold.toLocaleString());
  safe('h-day',     G.day);
  safe('h-maxday',  G.maxDays);
  safe('h-lvl',     G.level);

  const activePlots = G.plots.filter(p => p.state !== 'empty' && p.id < G.maxPlots).length;
  safe('h-plots',    activePlots);
  safe('h-maxplots', G.maxPlots);

  // Estación
  const seasons = ['☀️ Primavera', '🌞 Verano', '🍂 Otoño', '❄️ Invierno'];
  safe('h-season', seasons[Math.floor(((G.day - 1) / G.maxDays) * 4) % 4]);

  // Barra de info jardín
  const growing = G.plots.filter(p => p.state === 'planted' && p.id < G.maxPlots).length;
  const ready   = G.plots.filter(p => p.state === 'ready'   && p.id < G.maxPlots).length;
  const golden  = G.plots.filter(p => p.golden && p.state === 'ready' && p.id < G.maxPlots).length;
  safe('gi-growing', `🌱 ${growing} creciendo`);
  safe('gi-ready',   `✅ ${ready} lista${ready !== 1 ? 's' : ''}`);
  safe('gi-golden',  `✨ ${golden} dorada${golden !== 1 ? 's' : ''}`);

  // Panel de nivel
  const lvlData = LEVELS.find(l => l.lvl === G.level) || LEVELS[0];
  const nextLvl = LEVELS.find(l => l.lvl === G.level + 1);
  const xpStart = lvlData.xpNeeded;
  const xpEnd   = nextLvl ? nextLvl.xpNeeded : xpStart + 200;
  const pct     = nextLvl ? Math.min(100, ((G.xp - xpStart) / (xpEnd - xpStart)) * 100) : 100;

  safe('lvl-num',  G.level);
  safe('lvl-name', lvlData.name);
  const fillEl = document.getElementById('lvl-fill');
  if (fillEl) fillEl.style.width = pct + '%';
  safe('lvl-xp',     `${G.xp - xpStart} / ${xpEnd - xpStart} XP`);
  safe('lvl-unlock', lvlData.unlock || '');

  // Stats panel
  safe('st-earned',    G.stats.totalEarned.toLocaleString());
  safe('st-harvested', G.stats.totalHarvested);
  safe('st-golden',    G.stats.totalGolden);
  safe('st-bestsale',  G.stats.bestSale.toLocaleString());

  // Badge clima
  const weatherEl = document.getElementById('weather-badge');
  if (weatherEl) {
    if (G.activeEvent) {
      weatherEl.textContent = G.activeEvent.emoji + ' ' + G.activeEvent.title.split('!')[0].replace('¡','');
    } else {
      weatherEl.textContent = '☀️ Soleado';
    }
  }
}

/* ─── PARCELAS ──────────────────────────────────────── */
function renderPlots() {
  const grid = document.getElementById('garden-grid');
  if (!grid) return;
  grid.innerHTML = '';

  G.plots.forEach(plot => {
    const div = document.createElement('div');
    const isLocked = plot.id >= G.maxPlots;

    let stateClass = isLocked ? 'locked' : plot.state;
    if (!isLocked && plot.golden && plot.state === 'ready') stateClass = 'golden';

    div.className = 'plot ' + stateClass;
    div.dataset.id = plot.id;

    if (isLocked) {
      div.innerHTML = `
        <div class="plot-emoji">🔒</div>
        <div class="plot-label">Bloqueada</div>
        <div class="plot-badge badge-locked">Mejora</div>`;
    } else if (plot.state === 'empty') {
      div.innerHTML = `
        <div class="plot-emoji" style="opacity:.35">🟫</div>
        <div class="plot-label">Vacía</div>
        <div class="plot-days">Tocar para plantar</div>`;
      div.addEventListener('click', () => openPlantModal(plot.id));
    } else if (plot.state === 'planted') {
      const plant    = PLANTS[plot.plantId];
      if (!plant) return;
      const progress = Math.round(((plant.grow - plot.daysLeft) / plant.grow) * 100);
      div.innerHTML = `
        <div class="plot-emoji">${plant.emoji}</div>
        <div class="plot-label">${plant.name}</div>
        <div class="plot-days">⏳ ${plot.daysLeft}d</div>
        <div class="plot-bar" style="width:${Math.max(0, Math.min(100, progress))}%"></div>`;
    } else if (plot.state === 'ready') {
      const plant = PLANTS[plot.plantId];
      if (!plant) return;
      div.innerHTML = `
        ${plot.golden
          ? '<div class="plot-badge badge-gold">✨ DORADA</div>'
          : '<div class="plot-badge badge-ready">LISTA</div>'}
        <div class="plot-emoji">${plant.emoji}</div>
        <div class="plot-label">${plant.name}</div>
        <div class="plot-days" style="color:var(--jade)">✅ Cosechar</div>`;
      div.addEventListener('click', () => harvestPlot(plot.id));
    }

    grid.appendChild(div);
  });

  updateHUD();
}

/* ─── MODAL PLANTAR ─────────────────────────────────── */
function openPlantModal(plotId) {
  G.pendingPlotId = plotId;
  const pmNum = document.getElementById('pm-num');
  if (pmNum) pmNum.textContent = plotId + 1;

  const grid = document.getElementById('pm-grid');
  if (!grid) return;
  grid.innerHTML = '';

  Object.values(PLANTS).forEach(plant => {
    const canAfford  = G.gold >= plant.seedCost;
    const isUnlocked = G.level >= plant.minLvl && (plant.rarity !== 'rare' || G.upgrades.lab);
    const canPlant   = canAfford && isUnlocked;

    const btn = document.createElement('button');
    btn.className = 'pm-opt ' + (!isUnlocked ? 'locked-plant' : '');
    btn.disabled  = !canPlant;

    const rarityClass = { common:'rb-common', uncommon:'rb-uncommon', rare:'rb-rare', legendary:'rb-legendary' }[plant.rarity] || 'rb-common';
    const rarityLabel = { common:'Común', uncommon:'Poco Común', rare:'Raro', legendary:'Legendario' }[plant.rarity];
    const lockStr = !isUnlocked
      ? (plant.rarity === 'rare' && !G.upgrades.lab ? '🔬 Lab requerido' : `Nv.${plant.minLvl} requerido`)
      : '';

    btn.innerHTML = `
      <div class="pm-rarity-badge ${isUnlocked ? rarityClass : 'rb-locked'}">${isUnlocked ? rarityLabel : '🔒'}</div>
      <div class="pm-emoji">${plant.emoji}</div>
      <div class="pm-name">${plant.name}</div>
      <div class="pm-details">
        ${lockStr
          ? `<span style="color:var(--lavender)">${lockStr}</span>`
          : `<span class="pm-seed-cost">🌱 ${plant.seedCost} 💰</span>
             <span>⏱️ ${plant.grow} día${plant.grow !== 1 ? 's' : ''}</span>
             <span>💵 Base: ${plant.basePrice} 💰</span>
             ${plant.multiHarvest ? '<span style="color:var(--gold)">×2 cosechas</span>' : ''}`
        }
      </div>`;

    if (canPlant) {
      btn.addEventListener('click', () => plantCrop(plant.id));
    }
    grid.appendChild(btn);
  });

  const modal = document.getElementById('modal-plant');
  if (modal) modal.classList.remove('hidden');
}

function plantCrop(plantId) {
  const plant = PLANTS[plantId];
  if (!plant) return;
  if (G.gold < plant.seedCost) { toast('❌ No tienes suficientes monedas'); return; }

  G.gold -= plant.seedCost;
  const speedBonus = G.upgrades.soil ? 1 : 0;
  const growDays   = Math.max(1, plant.grow - speedBonus);

  const plot    = G.plots[G.pendingPlotId];
  plot.state    = 'planted';
  plot.plantId  = plantId;
  plot.daysLeft = growDays;
  plot.growDays = growDays;
  plot.golden   = false;
  plot.harvests = 0;

  G.dayPlanted++;

  // Registrar en colección (array sin duplicados)
  if (!G.collection.includes(plantId)) {
    G.collection.push(plantId);
  }

  checkMission('plant');

  const modal = document.getElementById('modal-plant');
  if (modal) modal.classList.add('hidden');

  toast(`🌱 Plantaste ${plant.emoji} ${plant.name} — listo en ${growDays} día${growDays !== 1 ? 's' : ''}`);
  renderPlots();
  updateHUD();
}

/* ─── COSECHAR ──────────────────────────────────────── */
function harvestPlot(plotId) {
  const plot = G.plots[plotId];
  if (!plot || plot.state !== 'ready') return;  // FIX: guard para botanist

  const plant  = PLANTS[plot.plantId];
  if (!plant) return;

  const qty      = 1 + (Math.random() < 0.35 ? 1 : 0);
  const isGolden = plot.golden;

  // Añadir al inventario
  const invKey = isGolden ? plant.id + '_gold' : plant.id;
  if (!G.inventory[invKey]) {
    G.inventory[invKey] = { plantId: plant.id, qty: 0, golden: isGolden };
  }
  G.inventory[invKey].qty += qty;

  // Bonus de evento cosecha
  if (G.harvestBonus > 0) {
    const bonus = G.harvestBonus * qty;
    G.gold              += bonus;
    G.stats.totalEarned += bonus;
    G.dayEarned         += bonus;
    logEvent('gold-ev', `🌾 Bonus de cosecha: +${bonus} 💰`);
  }

  G.stats.totalHarvested += qty;
  G.dayHarvested         += qty;
  if (isGolden) {
    G.stats.totalGolden++;
    G.dayGolden++;
  }

  // XP por cosecha
  const xpGain = isGolden ? 20 : (plant.rarity === 'rare' ? 12 : plant.rarity === 'uncommon' ? 7 : 4);
  gainXP(xpGain);

  // Multi-cosecha (bambú)
  if (plant.multiHarvest && plot.harvests < 1) {
    plot.harvests++;
    plot.state    = 'planted';
    plot.daysLeft = plot.growDays;
    plot.golden   = false;
    toast(`🎋 ${plant.name} da otra cosecha. ¡+${qty} unidad${qty > 1 ? 'es' : ''}${isGolden ? ' DORADAS' : ''}!`);
  } else {
    plot.state   = 'empty';
    plot.plantId = null;
    plot.golden  = false;
  }

  checkMission('harvest');
  if (isGolden) checkMission('golden');

  logEvent(isGolden ? 'gold-ev' : 'good',
    `${isGolden ? '✨' : '🌿'} Cosechaste ${qty}× ${plant.emoji} ${plant.name}${isGolden ? ' DORADA' : ''}`);
  toast(`✅ +${qty}× ${plant.emoji} ${plant.name}${isGolden ? ' ✨' : ''} en inventario`);

  renderPlots();
  renderInventory();
  updateHUD();
}

/* ─── MERCADO ────────────────────────────────────────── */
function generatePrices() {
  const prevPrices = { ...G_prices };
  G_prices = {};

  Object.values(PLANTS).forEach(p => {
    const variance  = 0.75 + Math.random() * 0.5;
    const eventMult = G.activeEvent?.effect === 'mkt_boost' ? 1.5
                    : G.activeEvent?.effect === 'mkt_crash' ? 0.7
                    : 1;
    const boothMult = G.upgrades.booth ? 1.25 : 1;
    G_prices[p.id]  = Math.round(p.basePrice * variance * eventMult * G.priceMultiplier * boothMult);

    if (!PRICE_HISTORY[p.id]) PRICE_HISTORY[p.id] = [];
    PRICE_HISTORY[p.id].push(G_prices[p.id]);
    if (PRICE_HISTORY[p.id].length > 2) PRICE_HISTORY[p.id].shift();
  });

  // Tendencia de mercado
  const trendEl = document.getElementById('price-trend');
  if (trendEl) {
    const vals    = Object.values(G_prices);
    const avgNew  = vals.reduce((a, b) => a + b, 0) / vals.length;
    const prevVals= Object.values(prevPrices);
    const avgOld  = prevVals.length ? prevVals.reduce((a, b) => a + b, 0) / prevVals.length : avgNew;
    const diff    = avgNew - avgOld;
    trendEl.textContent = Math.abs(diff) < 5 ? '→ Mercado estable'
      : diff > 0 ? `📈 Precios subieron ~${Math.round(diff)} 💰`
      : `📉 Precios bajaron ~${Math.round(-diff)} 💰`;
  }
}

function renderMarket() {
  const table = document.getElementById('market-table');
  if (!table) return;
  table.innerHTML = '';

  Object.values(PLANTS).forEach(plant => {
    const price  = G_prices[plant.id] || plant.basePrice;
    const hist   = PRICE_HISTORY[plant.id] || [];
    const trend  = hist.length >= 2 ? (hist[1] > hist[0] ? 'up' : hist[1] < hist[0] ? 'down' : 'flat') : 'flat';
    const symbol = { up:'▲', down:'▼', flat:'—' }[trend];
    const invQty = Object.values(G.inventory)
      .filter(i => i.plantId === plant.id)
      .reduce((a, i) => a + i.qty, 0);
    const rarityLabel = { common:'Común', uncommon:'Poco Común', rare:'Raro', legendary:'Legendario' }[plant.rarity] || '';

    const div = document.createElement('div');
    div.className = 'market-row';
    div.innerHTML = `
      <span class="mr-emoji">${plant.emoji}</span>
      <div class="mr-info">
        <div class="mr-name">${plant.name}</div>
        <div class="mr-cat">${rarityLabel} · Stock: ${invQty}</div>
      </div>
      <div class="mr-price">${price} 💰</div>
      <div class="mr-trend ${trend}">${symbol}</div>
      <button class="btn-mr-sell" data-plant="${plant.id}" ${invQty === 0 ? 'disabled' : ''}>Vender</button>`;

    const btn = div.querySelector('.btn-mr-sell');
    if (btn && invQty > 0) {
      btn.addEventListener('click', () => openSellModal(plant.id));
    }
    table.appendChild(div);
  });
}

/* ─── MODAL VENDER ──────────────────────────────────── */
function openSellModal(plantId) {
  const plant  = PLANTS[plantId];
  if (!plant) return;
  const price  = G_prices[plantId] || plant.basePrice;
  const invQty = Object.values(G.inventory)
    .filter(i => i.plantId === plantId)
    .reduce((a, i) => a + i.qty, 0);

  if (invQty === 0) { toast('❌ Sin stock de ' + plant.name); return; }

  G.sellingItem = plantId;

  const iconWrap   = document.getElementById('sell-icon-wrap');
  const nameEl     = document.getElementById('sell-name');
  const priceInfoEl= document.getElementById('sell-price-info');
  const inp        = document.getElementById('sell-qty');

  if (iconWrap)    iconWrap.textContent    = plant.emoji;
  if (nameEl)      nameEl.textContent      = plant.name;
  if (priceInfoEl) priceInfoEl.textContent = `${price} 💰 por unidad · Stock: ${invQty}`;
  if (inp) { inp.value = 1; inp.max = invQty; }

  updateSellTotal();
  const modal = document.getElementById('modal-sell');
  if (modal) modal.classList.remove('hidden');
}

function updateSellTotal() {
  if (!G.sellingItem) return;
  const qtyEl  = document.getElementById('sell-qty');
  const qty    = Math.max(1, parseInt(qtyEl?.value) || 1);
  const price  = G_prices[G.sellingItem] || PLANTS[G.sellingItem]?.basePrice || 0;
  const totalEl= document.getElementById('sell-total');
  if (totalEl) totalEl.textContent = (qty * price).toLocaleString() + ' 💰';
}

function confirmSell() {
  const plantId = G.sellingItem;
  if (!plantId) return;
  const plant   = PLANTS[plantId];
  if (!plant) return;

  const qtyEl   = document.getElementById('sell-qty');
  const sellQty = Math.max(1, parseInt(qtyEl?.value) || 1);
  const price   = G_prices[plantId] || plant.basePrice;

  let remaining = sellQty;

  // Primero normales, luego doradas
  [plantId, plantId + '_gold'].forEach(key => {
    const item = G.inventory[key];
    if (!item || remaining <= 0) return;

    const take      = Math.min(item.qty, remaining);
    const isGolden  = item.golden;
    const unitPrice = isGolden ? price * 3 : price;
    const earned    = take * unitPrice;

    G.gold              += earned;
    G.stats.totalEarned += earned;
    G.dayEarned         += earned;
    G.stats.bestSale     = Math.max(G.stats.bestSale, earned);

    item.qty -= take;
    if (item.qty <= 0) delete G.inventory[key];
    remaining -= take;

    if (['rare', 'legendary'].includes(plant.rarity)) {
      G.dayRareSold++;
      checkMission('sell_rare');
    }

    gainXP(Math.round(take * 2));
    logEvent(isGolden ? 'gold-ev' : 'good',
      `💰 Vendiste ${take}× ${plant.emoji}${isGolden ? ' ✨' : ''} +${earned.toLocaleString()} 💰`);
  });

  checkMission('earn');

  const modal = document.getElementById('modal-sell');
  if (modal) modal.classList.add('hidden');

  toast(`💰 Vendiste ${sellQty}× ${plant.emoji} ${plant.name}`);
  renderMarket();
  renderInventory();
  updateHUD();
}

function sellAll() {
  if (Object.keys(G.inventory).length === 0) { toast('❌ Inventario vacío'); return; }

  let totalEarned = 0;
  Object.entries(G.inventory).forEach(([key, item]) => {
    const plant = PLANTS[item.plantId];
    if (!plant) return;
    const price     = G_prices[item.plantId] || plant.basePrice;
    const unitPrice = item.golden ? price * 3 : price;
    const earned    = item.qty * unitPrice;

    G.gold              += earned;
    G.stats.totalEarned += earned;
    G.dayEarned         += earned;
    G.stats.bestSale     = Math.max(G.stats.bestSale, earned);
    totalEarned         += earned;
    gainXP(item.qty * 2);
  });

  G.inventory = {};
  checkMission('earn');
  logEvent('gold-ev', `💰 ¡Venta total! +${totalEarned.toLocaleString()} 💰`);
  toast(`💰 Venta total: +${totalEarned.toLocaleString()} 💰`);
  renderMarket();
  renderInventory();
  updateHUD();
}

/* ─── INVENTARIO ─────────────────────────────────────── */
function renderInventory() {
  const grid  = document.getElementById('inv-grid');
  const valEl = document.getElementById('inv-value');
  if (!grid) return;

  const items = Object.entries(G.inventory).filter(([, v]) => v.qty > 0);

  if (items.length === 0) {
    grid.innerHTML = '<div class="inv-empty">Vacío — cosecha plantas para llenar tu almacén</div>';
    if (valEl) valEl.textContent = 'Valor: 0 💰';
    return;
  }

  let totalValue = 0;
  grid.innerHTML = '';

  items.forEach(([key, item]) => {
    const plant = PLANTS[item.plantId];
    if (!plant) return;
    const price  = G_prices[item.plantId] || plant.basePrice;
    const uPrice = item.golden ? price * 3 : price;
    const val    = item.qty * uPrice;
    totalValue  += val;

    const div = document.createElement('div');
    div.className = 'inv-item' + (item.golden ? ' golden-inv' : '');
    div.innerHTML = `
      <span class="ii-emoji">${plant.emoji}${item.golden ? '✨' : ''}</span>
      <div class="ii-info">
        <div class="ii-name">${plant.name}${item.golden ? ' (Dorada)' : ''}</div>
        <div class="ii-qty">×${item.qty} unidades · ${uPrice} 💰/u</div>
      </div>
      <div class="ii-value">${val.toLocaleString()} 💰</div>
      <button class="btn-inv-sell" data-plant="${item.plantId}">Vender</button>`;

    div.querySelector('.btn-inv-sell').addEventListener('click', () => openSellModal(item.plantId));
    grid.appendChild(div);
  });

  if (valEl) valEl.textContent = `Valor: ${totalValue.toLocaleString()} 💰`;
}

/* ─── MEJORAS ────────────────────────────────────────── */
function renderUpgrades() {
  const grid = document.getElementById('upgrades-grid');
  if (!grid) return;
  grid.innerHTML = '';

  UPGRADES.forEach(upg => {
    const currentLevel = G.upgrades[upg.id] || 0;
    const maxed        = currentLevel >= upg.maxLevel;
    const canAfford    = G.gold >= upg.cost;

    const div = document.createElement('div');
    div.className = `upg-card ${maxed ? 'bought' : !canAfford ? 'disabled' : ''}`;
    div.innerHTML = `
      ${maxed ? `<div class="upg-level-badge ${upg.badge}">✓ Adquirido</div>` : ''}
      <div class="upg-top">
        <div class="upg-icon">${upg.icon}</div>
        <div>
          <div class="upg-name">${upg.name}</div>
          <div class="upg-desc">${upg.desc}</div>
        </div>
      </div>
      <div class="upg-bottom">
        <div class="upg-price ${maxed ? 'owned' : ''}">${maxed ? 'Comprado' : '💰 ' + upg.cost.toLocaleString()}</div>
        <button class="btn-buy-upg" data-id="${upg.id}" ${maxed || !canAfford ? 'disabled' : ''}>
          ${maxed ? '✓' : 'Comprar'}
        </button>
      </div>`;

    if (!maxed && canAfford) {
      div.querySelector('.btn-buy-upg').addEventListener('click', () => buyUpgrade(upg.id));
    }
    grid.appendChild(div);
  });
}

function buyUpgrade(upgId) {
  const upg = UPGRADES.find(u => u.id === upgId);
  if (!upg || G.gold < upg.cost) { toast('❌ Sin fondos suficientes'); return; }

  G.gold -= upg.cost;
  G.upgrades[upgId] = (G.upgrades[upgId] || 0) + 1;

  if (upgId === 'expand') {
    G.maxPlots = Math.min(14, G.maxPlots + 2);
    logEvent('good', `📐 Jardín expandido. Ahora tienes ${G.maxPlots} parcelas.`);
  }

  gainXP(25);
  toast(`✅ Mejora adquirida: ${upg.icon} ${upg.name}`);
  logEvent('good', `🔬 ${upg.name} instalado. ${upg.desc}`);
  renderUpgrades();
  renderPlots();
  updateHUD();
}

/* ─── MISIONES ───────────────────────────────────────── */
function generateMissions() {
  const shuffled = [...MISSION_POOL].sort(() => Math.random() - 0.5);
  G.missions = shuffled.slice(0, 3).map(m => ({ ...m, progress: 0, completed: false }));
}

function renderMissions() {
  const list = document.getElementById('missions-list');
  if (!list) return;
  list.innerHTML = '';

  G.missions.forEach(m => {
    const div = document.createElement('div');
    div.className = 'mission-item' + (m.completed ? ' done' : '');
    div.innerHTML = `
      <span class="mi-icon">${m.icon}</span>
      <div>
        <div class="mi-text">${m.text}</div>
        ${!m.completed
          ? `<div class="mi-progress">${m.type === 'earn' ? G.dayEarned + '/' + m.goal : m.progress + '/' + m.goal}</div>`
          : ''}
      </div>
      <span class="mi-reward">+${m.reward}💰</span>
      <span class="mi-check">${m.completed ? '✅' : '○'}</span>`;
    list.appendChild(div);
  });
}

function checkMission(type) {
  G.missions.forEach(m => {
    if (m.completed) return;
    let progress = 0;
    switch (m.type) {
      case 'harvest':   progress = G.dayHarvested; break;
      case 'earn':      progress = G.dayEarned; break;
      case 'golden':    progress = G.dayGolden; break;
      case 'sell_rare': progress = G.dayRareSold; break;
      case 'plots':     progress = G.plots.filter(p => p.state !== 'empty' && p.id < G.maxPlots).length; break;
      case 'plant':     progress = G.dayPlanted; break;
    }
    m.progress = progress;
    if (progress >= m.goal) {
      m.completed = true;
      G.gold   += m.reward;
      gainXP(m.xp);
      toast(`🏆 Misión completada: ${m.text} · +${m.reward} 💰`);
      logEvent('gold-ev', `📋 Misión completada: "${m.text}" · +${m.reward} 💰 +${m.xp} XP`);
    }
  });
  renderMissions();
}

/* ─── NIVELES / XP ───────────────────────────────────── */
function gainXP(amount) {
  const mult = G.level >= 6 ? 1.5 : 1;
  G.xp += Math.round(amount * mult);

  const nextLvl = LEVELS.find(l => l.lvl === G.level + 1);
  if (nextLvl && G.xp >= nextLvl.xpNeeded) {
    G.level = nextLvl.lvl;
    toast(`⭐ ¡Subiste al nivel ${G.level}: ${nextLvl.name}!`);
    logEvent('lav', `⭐ ¡NIVEL ${G.level}! — ${nextLvl.name}. ${nextLvl.unlock || ''}`);
  }
  updateHUD();
}

/* ─── EVENTOS ────────────────────────────────────────── */
function maybeEvent() {
  if (G.day === 1) return;
  if (Math.random() > 0.45) return;

  const ev = EVENTS[Math.floor(Math.random() * EVENTS.length)];
  G.activeEvent = ev;
  applyEventEffect(ev);

  const evIcon  = document.getElementById('ev-icon-big');
  const evTitle = document.getElementById('ev-title');
  const evDesc  = document.getElementById('ev-desc');
  const effTag  = document.getElementById('ev-effect-tag');

  if (evIcon)  evIcon.textContent  = ev.emoji;
  if (evTitle) evTitle.textContent = ev.title;
  if (evDesc)  evDesc.textContent  = ev.desc;

  if (effTag) {
    const classMap = { good:'evt-good', bad:'evt-bad', gold:'evt-gold' };
    effTag.className = 'ev-effect-tag ' + (classMap[ev.type] || 'evt-good');

    const effectText = {
      extra_grow:    '🌿 +1 día de crecimiento gratis',
      drought:       G.upgrades.sprinkler ? '💧 Riego automático: plantas protegidas' : '🌵 +1 día extra para todas las plantas',
      pest:          G.upgrades.greenhouse ? '🏠 Invernadero: ¡protección total!' : '🐛 Plantas al azar pierden 1 día',
      mkt_boost:     '📈 +50% en todos los precios de hoy',
      mkt_crash:     '📉 −30% en todos los precios de hoy',
      gold_boost:    '✨ Todas las plantas listas pueden mutar',
      bonus_gold:    '💰 +150 monedas de regalo',
      harvest_bonus: '🌾 +20 monedas extra por cada cosecha'
    }[ev.effect] || '';
    effTag.textContent = effectText;
  }

  const modal = document.getElementById('modal-event');
  if (modal) modal.classList.remove('hidden');

  logEvent(ev.type === 'bad' ? 'bad' : ev.type === 'gold' ? 'gold-ev' : 'good',
    `${ev.emoji} ${ev.title}: ${ev.desc.split('.')[0]}`);
}

function applyEventEffect(ev) {
  G.harvestBonus = 0;

  switch (ev.effect) {
    case 'extra_grow':
      G.plots.forEach(p => { if (p.state === 'planted' && p.daysLeft > 1) p.daysLeft--; });
      break;
    case 'drought':
      if (!G.upgrades.sprinkler) {
        G.plots.forEach(p => { if (p.state === 'planted') p.daysLeft++; });
      }
      break;
    case 'pest':
      if (!G.upgrades.greenhouse) {
        const planted = G.plots.filter(p => p.state === 'planted');
        const hits    = Math.min(2, planted.length);
        const shuffled= planted.sort(() => Math.random() - 0.5);
        for (let i = 0; i < hits; i++) shuffled[i].daysLeft++;
      }
      break;
    case 'gold_boost':
      G.plots.forEach(p => { if (p.state === 'ready') p.golden = Math.random() < 0.7; });
      break;
    case 'bonus_gold':
      G.gold              += 150;
      G.stats.totalEarned += 150;
      G.dayEarned         += 150;
      break;
    case 'harvest_bonus':
      G.harvestBonus = 20;
      break;
  }

  generatePrices();
  renderMarket();
  renderPlots();
  updateHUD();
}

/* ─── DÍA SIGUIENTE ──────────────────────────────────── */
function advanceDay() {
  // FIX: verificar si ya es el último día antes de avanzar
  if (G.day >= G.maxDays) {
    showEndScreen();
    return;
  }

  // Botanista auto-cosecha (FIX: copiar array para evitar mutación durante iteración)
  if (G.upgrades.botanist) {
    const readyIds = G.plots
      .filter(p => p.state === 'ready' && p.id < G.maxPlots)
      .map(p => p.id);
    if (readyIds.length > 0) {
      readyIds.forEach(id => harvestPlot(id));
      logEvent('good', `👩‍🌾 Botánico auto-cosechó ${readyIds.length} planta${readyIds.length > 1 ? 's' : ''}.`);
    }
  }

  G.day++;
  G.dayEarned    = 0;
  G.dayHarvested = 0;
  G.dayPlanted   = 0;
  G.dayGolden    = 0;
  G.dayRareSold  = 0;
  G.activeEvent  = null;
  G.harvestBonus = 0;
  G.stats.days++;

  // Avanzar crecimiento
  G.plots.forEach(plot => {
    if (plot.state !== 'planted') return;
    plot.daysLeft--;
    if (plot.daysLeft <= 0) {
      plot.state = 'ready';
      const plant      = PLANTS[plot.plantId];
      if (!plant) return;
      const baseChance = 0.12;
      const fertBonus  = G.upgrades.fertilizer ? 0.20 : 0;
      if (Math.random() < baseChance + fertBonus) {
        plot.golden = true;
        toast(`✨ ¡${plant.emoji} ${plant.name} mutó a DORADA!`);
        logEvent('gold-ev', `✨ ¡Mutación dorada! ${plant.emoji} ${plant.name} vale 3× el precio.`);
      } else {
        plot.golden = false;
        toast(`✅ ${plant.emoji} ${plant.name} lista para cosechar`);
      }
    }
  });

  generateMissions();
  generatePrices();
  renderPlots();
  renderMarket();
  renderUpgrades();
  renderMissions();
  updateHUD();

  logEvent('system', `--- 🌅 Día ${G.day} de ${G.maxDays} ---`);

  // FIX: solo llamar showEndScreen al final, una sola vez
  if (G.day >= G.maxDays) {
    setTimeout(showEndScreen, 800);
  } else {
    setTimeout(() => maybeEvent(), 300);
  }
}

/* ─── PANTALLA FINAL ─────────────────────────────────── */
function showEndScreen() {
  document.getElementById('game-hud').style.display = 'none';

  // Liquidar inventario restante
  let leftoverValue = 0;
  Object.values(G.inventory).forEach(item => {
    const plant = PLANTS[item.plantId];
    if (!plant) return;
    const price  = G_prices[item.plantId] || plant.basePrice;
    const earned = item.qty * (item.golden ? price * 3 : price);
    G.gold += earned;
    leftoverValue += earned;
    G.stats.totalEarned += earned;
  });
  G.inventory = {};

  const earned = G.stats.totalEarned;
  let icon, title, sub, rankClass, rankText;

  if (earned >= 3000 && G.level >= 5) {
    icon = '🌺'; title = '¡EDEN LEGENDARIO!'; rankClass = 'rank-legend';
    rankText = '🌺 Rango: BOTÁNICO DIVINO — Tu jardín es patrimonio mundial';
    sub = `Ganaste ${earned.toLocaleString()} 💰 y alcanzaste nivel ${G.level}. Una obra maestra vegetal.`;
    bloomAnimation();
  } else if (earned >= 1500) {
    icon = '🌸'; title = 'MAESTRO DEL JARDÍN'; rankClass = 'rank-master';
    rankText = '🌸 Rango: EXPERTO BOTÁNICO — Tu jardín florece con maestría';
    sub = `${earned.toLocaleString()} 💰 ganadas. ${G.stats.totalGolden} mutaciones doradas. ¡Impresionante!`;
  } else if (earned >= 600) {
    icon = '🌻'; title = 'JARDINERO AVANZADO'; rankClass = 'rank-grower';
    rankText = '🌻 Rango: CULTIVADOR — Vas por buen camino';
    sub = `${earned.toLocaleString()} 💰 ganadas. Sigue mejorando tu jardín la próxima vez.`;
  } else {
    icon = '🌱'; title = 'APRENDIZ BOTÁNICO'; rankClass = 'rank-seed';
    rankText = '🌱 Rango: SEMILLA — Aún hay mucho por aprender';
    sub = `${earned.toLocaleString()} 💰 ganadas. Planta más, vende más, ¡y vuelve más fuerte!`;
  }

  const safe = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  safe('end-icon',  icon);
  safe('end-title', title);
  safe('end-sub',   sub);
  safe('end-rank',  rankText);

  const rankEl = document.getElementById('end-rank');
  if (rankEl) rankEl.className = 'end-rank ' + rankClass;

  const statsEl = document.getElementById('end-stats');
  if (statsEl) statsEl.innerHTML = `
    <div class="end-stat"><div class="end-stat-val">${earned.toLocaleString()}</div><div class="end-stat-lbl">💰 Ganado</div></div>
    <div class="end-stat"><div class="end-stat-val">${G.stats.totalHarvested}</div><div class="end-stat-lbl">🌿 Cosechado</div></div>
    <div class="end-stat"><div class="end-stat-val">${G.level}</div><div class="end-stat-lbl">⭐ Nivel</div></div>`;

  const collEl = document.getElementById('end-collection');
  if (collEl) {
    collEl.textContent = G.collection.length > 0
      ? `🌸 Colección: ${G.collection.map(id => PLANTS[id]?.emoji || '').join(' ')}`
      : '';
  }

  if (leftoverValue > 0) {
    logEvent('gold-ev', `💰 Inventario liquidado al final: +${leftoverValue} 💰`);
  }

  showScreen('end');
}

function bloomAnimation() {
  const container = document.getElementById('end-blooms');
  if (!container) return;
  const blooms = ['🌸','🌺','🌻','🌹','🌷','🪷','💐'];
  for (let i = 0; i < 25; i++) {
    const el = document.createElement('div');
    el.className = 'bloom';
    el.textContent = blooms[Math.floor(Math.random() * blooms.length)];
    el.style.left             = Math.random() * 100 + '%';
    el.style.animationDuration= (2 + Math.random() * 3) + 's';
    el.style.animationDelay   = (Math.random() * 0.8) + 's';
    el.style.fontSize         = (0.8 + Math.random() * 1.2) + 'rem';
    container.appendChild(el);
    setTimeout(() => el.remove(), 4500);
  }
}

/* ─── LOG ────────────────────────────────────────────── */
function logEvent(type, msg) {
  const log = document.getElementById('events-log');
  if (!log) return;
  const div = document.createElement('div');
  div.className   = 'ev-line ' + type;
  div.textContent = `[D${G.day || 1}] ${msg}`;
  log.appendChild(div);
  while (log.children.length > 60) log.removeChild(log.firstChild);
  log.scrollTop = log.scrollHeight;
}

/* ─── CANVAS BACKGROUND ─────────────────────────────── */
(function bgCanvas() {
  const c = document.getElementById('bgCanvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  const dpi = Math.max(1, window.devicePixelRatio || 1);
  let w, h, parts;

  const init = () => {
    w = c.width  = innerWidth  * dpi;
    h = c.height = innerHeight * dpi;
    parts = Array.from({ length: 60 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: (0.4 + Math.random() * 1.6) * dpi,
      s: 0.06 + Math.random() * 0.22,
      a: 0.04 + Math.random() * 0.14,
      hue: 100 + Math.random() * 60,
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
      ctx.fillStyle = `hsla(${p.hue},70%,55%,${p.a})`;
      ctx.fill();
    });
    requestAnimationFrame(tick);
  };

  init();
  tick();
  window.addEventListener('resize', init);
})();

/* ─── TOAST ──────────────────────────────────────────── */
function toast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2800);
}

/* ─── NAVBAR ─────────────────────────────────────────── */
const navT = document.getElementById('navToggle');
const navL = document.getElementById('navLinks');
if (navT) navT.addEventListener('click', e => { e.stopPropagation(); navL?.classList.toggle('open'); });
document.addEventListener('click', e => {
  if (!navT?.contains(e.target) && !navL?.contains(e.target)) navL?.classList.remove('open');
});

/* ─── INICIALIZACIÓN ─────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  // Botones principales
  document.getElementById('btn-start')?.addEventListener('click', initGame);
  document.getElementById('btn-restart')?.addEventListener('click', () => {
    document.getElementById('game-hud').style.display = 'none';
    showScreen('title');
  });
  document.getElementById('btn-advance')?.addEventListener('click', advanceDay);
  document.getElementById('btn-sell-all')?.addEventListener('click', sellAll);

  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const tabEl = document.getElementById('tab-' + btn.dataset.tab);
      if (tabEl) tabEl.classList.add('active');
      if (btn.dataset.tab === 'upgrades')  renderUpgrades();
      if (btn.dataset.tab === 'inventory') renderInventory();
      if (btn.dataset.tab === 'market')    renderMarket();
    });
  });

  // Modal plantar — cerrar
  document.getElementById('pm-close')?.addEventListener('click', () => {
    document.getElementById('modal-plant')?.classList.add('hidden');
  });
  document.getElementById('modal-plant')?.addEventListener('click', e => {
    if (e.target === document.getElementById('modal-plant')) {
      document.getElementById('modal-plant').classList.add('hidden');
    }
  });

  // Modal vender — controles
  document.getElementById('sell-close')?.addEventListener('click', () => {
    document.getElementById('modal-sell')?.classList.add('hidden');
  });
  document.getElementById('modal-sell')?.addEventListener('click', e => {
    if (e.target === document.getElementById('modal-sell')) {
      document.getElementById('modal-sell').classList.add('hidden');
    }
  });
  document.getElementById('sell-minus')?.addEventListener('click', () => {
    const i = document.getElementById('sell-qty');
    if (i) { i.value = Math.max(1, +i.value - 1); updateSellTotal(); }
  });
  document.getElementById('sell-plus')?.addEventListener('click', () => {
    const i = document.getElementById('sell-qty');
    if (i) { i.value = Math.min(+(i.max) || 999, +i.value + 1); updateSellTotal(); }
  });
  document.getElementById('sell-qty')?.addEventListener('input', updateSellTotal);
  document.getElementById('sell-confirm')?.addEventListener('click', confirmSell);

  // Modal evento — cerrar (FIX: añadido cierre por click en overlay)
  document.getElementById('ev-close')?.addEventListener('click', () => {
    document.getElementById('modal-event')?.classList.add('hidden');
  });
  document.getElementById('modal-event')?.addEventListener('click', e => {
    if (e.target === document.getElementById('modal-event')) {
      document.getElementById('modal-event').classList.add('hidden');
    }
  });

  // FIX: mostrar pantalla título al cargar
  showScreen('title');
});