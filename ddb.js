/* =========================================================
   Moonveil — Troll Master  |  ddb.js
   Agencia de bromas de Minecraft — Día de los Inocentes
   ========================================================= */

/* ── MATERIALES DE LA TIENDA ─────────────────────────────── */
const MATERIALS = {
  tnt:       { id:'tnt',       name:'TNT',              emoji:'💣', cost:30, rarity:'epic'   },
  slime:     { id:'slime',     name:'Slimeball',         emoji:'🟢', cost:12, rarity:'common' },
  lava:      { id:'lava',      name:'Lava Bucket',       emoji:'🪣', cost:25, rarity:'rare'   },
  dirt:      { id:'dirt',      name:'Dirt Block',        emoji:'🟫', cost:5,  rarity:'common' },
  sand:      { id:'sand',      name:'Sand',              emoji:'🏖️', cost:5,  rarity:'common' },
  gravel:    { id:'gravel',    name:'Gravel',            emoji:'🪨', cost:5,  rarity:'common' },
  sign:      { id:'sign',      name:'Sign',              emoji:'🪧', cost:8,  rarity:'common' },
  dispenser: { id:'dispenser', name:'Dispenser',         emoji:'📦', cost:40, rarity:'rare'   },
  plate:     { id:'plate',     name:'Pressure Plate',    emoji:'⬜', cost:12, rarity:'common' },
  fish:      { id:'fish',      name:'Cod Fish',          emoji:'🐟', cost:8,  rarity:'common' },
  piston:    { id:'piston',    name:'Piston',            emoji:'🔩', cost:35, rarity:'rare'   },
  trapdoor:  { id:'trapdoor',  name:'Trapdoor',          emoji:'🚪', cost:18, rarity:'common' },
  powder:    { id:'powder',    name:'Gunpowder',         emoji:'💨', cost:20, rarity:'rare'   },
  shulker:   { id:'shulker',   name:'Shulker Box',       emoji:'📫', cost:80, rarity:'epic'   },
};

/* ── RECETAS DE BROMAS ───────────────────────────────────── */
const PRANKS = [
  {
    id:'sand_trap',    name:'Trampa de Arena',      emoji:'🏖️',
    desc:'Reemplaza el suelo bajo el objetivo con arena flotante. Al pisarla, ¡cae!',
    recipe: { sand:3, plate:1 },
    risk:20, baseReward:60,  diff:1, type:'normal',
    successFx: ['cayó en el hoyo', 'arena en todos lados', '¡se hundió!'],
    failFx:    ['arena en tu cara', 'la trampa te enganchó a ti']
  },
  {
    id:'lava_door',    name:'Puerta de Lava',        emoji:'🪣',
    desc:'Coloca lava detrás de una puerta. El que abra... ¡sorpresa flamante!',
    recipe: { lava:1, dirt:4 },
    risk:45, baseReward:110, diff:2, type:'risky',
    successFx: ['¡AAAAAH caliente!', 'lava en la cara', 'necesita leche'],
    failFx:    ['quemaste la casa del cliente', 'lava en tus propios pies']
  },
  {
    id:'fish_shower',  name:'Lluvia de Peces',       emoji:'🐟',
    desc:'Dispenser lleno de peces sobre el objetivo. Nada más inocente... y asqueroso.',
    recipe: { dispenser:1, fish:5 },
    risk:15, baseReward:80,  diff:1, type:'normal',
    successFx: ['¡PECES POR TODOS LADOS!', 'huele horrible', 'los gatos lo adoran'],
    failFx:    ['los peces volvieron a tu casa', 'el dispenser se rompió']
  },
  {
    id:'tnt_floor',    name:'TNT Clásico',            emoji:'💣',
    desc:'Suelo de TNT con placa de presión. El más clásico. El más épico.',
    recipe: { tnt:1, plate:2 },
    risk:60, baseReward:200, diff:3, type:'risky',
    successFx: ['¡BOOM!', '¡el servidor tembló!', '¡crater de 10 bloques!'],
    failFx:    ['explosión prematura', 'el crater es tuyo ahora', 'ban temporal del server']
  },
  {
    id:'slime_stick',  name:'Pasillo Slime',          emoji:'🟢',
    desc:'Suelo de slime que hace rebotar al objetivo como una pelota.',
    recipe: { slime:4, plate:1 },
    risk:10, baseReward:50,  diff:1, type:'normal',
    successFx: ['reboooota!', '3 bloques de altura', '¡se cayó del mapa!'],
    failFx:    ['rebotaste tú también', 'slime en la cara']
  },
  {
    id:'fake_portal',  name:'Portal Falso',           emoji:'🌀',
    desc:'Portal decorativo que no lleva a ningún lado. Vergüenza pura.',
    recipe: { gravel:4, sign:2, dispenser:1 },
    risk:25, baseReward:90,  diff:2, type:'normal',
    successFx: ['lleva al desierto', '¡fue al Nether de verdad!', 'pared de roca'],
    failFx:    ['el portal funcionó de verdad', 'tú caíste en él']
  },
  {
    id:'creeper_box',  name:'Caja Creeper',           emoji:'👾',
    desc:'Shulker box llena de creepers spawneados. Al abrir... adiós, casa.',
    recipe: { shulker:1, powder:3, tnt:1 },
    risk:70, baseReward:350, diff:3, type:'epic',
    successFx: ['¡15 creepers sueltos!', '¡KSSSSSS BOOM!', '¡la casa no existe más!'],
    failFx:    ['los creepers te siguieron', 'shulker bug: explotaste tú', 'ban del servidor']
  },
  {
    id:'trapdoor_walk', name:'Paseo al Vacío',         emoji:'🚪',
    desc:'Trapdoor activado por palanca remota. El objetivo "camina" al aire.',
    recipe: { trapdoor:3, plate:1, piston:1 },
    risk:30, baseReward:120, diff:2, type:'risky',
    successFx: ['¡cayó al vacío!', 'fall damage 20', '¡respawn!'],
    failFx:    ['la palanca falló', 'cayeron los dos']
  },
  {
    id:'sign_spam',    name:'Graffiti Total',          emoji:'🪧',
    desc:'Llena la base del objetivo con signos insultantes. Clásico y elegante.',
    recipe: { sign:6 },
    risk:5,  baseReward:40,  diff:1, type:'normal',
    successFx: ['letreros en todo', '¡cubriste 64 bloques!', '¡leyó cada uno!'],
    failFx:    ['te faltaron materiales a mitad']
  },
  {
    id:'piston_launch', name:'Lanzador de Pistón',     emoji:'🚀',
    desc:'Pistón con placa de presión: el objetivo sale disparado por los aires.',
    recipe: { piston:2, plate:1 },
    risk:35, baseReward:130, diff:2, type:'risky',
    successFx: ['voló 40 bloques', '¡orbitó el servidor!', 'aterrizó en el océano'],
    failFx:    ['pistón mal orientado', 'el lanzador te lanzó a ti']
  }
];

/* ── CLIENTES / ENCARGANTES ──────────────────────────────── */
const CLIENTS = [
  { name:'GrumpyVillager_X', avatar:'🧑‍🌾', color:'green',  types:['normal','risky'],  prefix:'Un villager furioso quiere broma a' },
  { name:'HerobrineAlt',     avatar:'👻',   color:'red',    types:['epic','risky'],    prefix:'Herobrine susurra desde el vacío:' },
  { name:'Creeper69',        avatar:'💚',   color:'green',  types:['normal'],          prefix:'Un creeper (de buen humor) encarga broma a' },
  { name:'Notch_ghost',      avatar:'👑',   color:'gold',   types:['epic','risky'],    prefix:'El espíritu de Notch necesita' },
  { name:'XxDarkSteveXx',    avatar:'⚔️',   color:'orange', types:['normal','risky'],  prefix:'Steve muy enojado quiere vengar con broma a' },
  { name:'PhantomQueen',     avatar:'👁️',   color:'purple', types:['epic'],            prefix:'La reina de los Phantoms ordena' },
  { name:'WanderingTroll',   avatar:'🧳',   color:'sky',    types:['normal'],          prefix:'Un Wandering Trader pide broma a' },
  { name:'EnderDragon_Jr',   avatar:'🐉',   color:'purple', types:['epic','risky'],    prefix:'El hijo del Ender Dragon quiere caos en' },
  { name:'GrumpyWitch',      avatar:'🧙',   color:'purple', types:['normal'],          prefix:'Una bruja cobró venganza, pero necesita broma a' },
  { name:'SilentPillar',     avatar:'🗿',   color:'sky',    types:['normal','risky'],  prefix:'El Pillar silencioso pide algo pesado a' },
];

const TARGETS = [
  'el Administrador del Server',
  'el Streamer de turno',
  'el Noob de la aldea',
  'el vecino con castillo de cristal',
  'el jugador AFK de siempre',
  'la chica con las ovejas rosas',
  'el griefer del servidor',
  'el que siempre pone carteles feos',
  'el que robó tu diamante',
  'el constructor obsesivo',
  'el Herobrine imitador',
  'el que rompió el ícono del servidor',
];

/* ── CHAT NPC POOL ───────────────────────────────────────── */
const CHAT_NPCS = [
  { name:'SkeletonNoob',  color:'sky'    }, { name:'CreeperFan2024', color:'green'  },
  { name:'Diamante_Steve',color:'sky'    }, { name:'xXGriefer_ProXx',color:'red'    },
  { name:'EndermanLover', color:'purple' }, { name:'TNT_Queen',      color:'orange' },
  { name:'NachoMinecraft',color:'gold'   }, { name:'PiglinTrader',   color:'orange' },
  { name:'WitchIsBack',   color:'purple' }, { name:'_Steve_',        color:'sky'    },
  { name:'PhantomHunter', color:'green'  }, { name:'ZombieVillager',color:'green'   },
];

const IDLE_CHAT = [
  ['green',  'SkeletonNoob',   'alguien sabe donde farmear hierro?'],
  ['sky',    '_Steve_',        'acabo de hacer mi primera espada de diamante!!'],
  ['orange', 'TNT_Queen',      'quien exploto mi base???? >:(('],
  ['purple', 'EndermanLover',  'los endermans son mis amigos uwu'],
  ['red',    'xXGriefer_ProXx','jajajajaja griefer vida'],
  ['gold',   'NachoMinecraft', 'hoy es el dia de las bromas en el server 😂'],
  ['sky',    'Diamante_Steve', 'se vende stack de diamantes, ofertas al privado'],
  ['green',  'PhantomHunter',  'no duermo para que no salgan phantoms lol'],
  ['orange', 'PiglinTrader',   'cambiamos oro por basura xd'],
  ['purple', 'WitchIsBack',    'tengo pociones de veneno si alguien quiere... 👀'],
  ['sky',    '_Steve_',        'quien eres tu Herobrine no existes'],
  ['green',  'CreeperFan2024', 'los creepers no explotan si les das amor ok?'],
  ['gold',   'NachoMinecraft', 'admin cuando actualizan el server?????'],
  ['red',    'xXGriefer_ProXx','soy inocente yo no fui'],
  ['sky',    'Diamante_Steve', 'y a ti quien te dijo que puedes buildar aqui'],
];

/* ── ESTADO ──────────────────────────────────────────────── */
let G = {};

function initGame() {
  G = {
    emeralds:    300,
    day:         1,
    maxDays:     15,
    chaos:       0,
    pranksCompleted: 0,
    backfires:       0,
    emeraldsEarned:  0,
    bestPrankName:   null,
    bestPrankReward: 0,
    materials:   {},
    orders:      [],
    selectedOrder: null,
    orderIdCounter: 1,
    chatInterval:   null,
    onlinePlayers:  12 + Math.floor(Math.random()*20)
  };

  renderShop();
  renderMaterials();
  renderOrders();
  renderWorkshop();
  updateHUD();
  document.getElementById('game-hud').style.display = '';
  showScreen('game');

  addChat('system','[SERVER]','El servidor arrancó. Hoy es 28 de diciembre. 🎭 Troll Master está ONLINE.','system');
  addChat('gold','NachoMinecraft','ESTE ES EL DÍA DE LAS BROMAS MUCHACHOS','positive');
  addChat('orange','TNT_Queen','yo no me fío de nadie hoy jajaja','neutral');

  spawnOrders(3);
  startIdleChat();
}

/* ── PANTALLAS ───────────────────────────────────────────── */
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-'+name)?.classList.add('active');
}

/* ── HUD ─────────────────────────────────────────────────── */
function updateHUD() {
  document.getElementById('h-em').textContent    = G.emeralds.toLocaleString();
  document.getElementById('h-day').textContent   = G.day;
  document.getElementById('h-rep').textContent   = G.chaos + '%';
  document.getElementById('h-pranks').textContent= G.pranksCompleted;
  document.getElementById('online-count').textContent = G.onlinePlayers;
}

/* ── TIENDA ──────────────────────────────────────────────── */
function renderShop() {
  const grid = document.getElementById('shop-grid');
  grid.innerHTML = '';
  Object.values(MATERIALS).forEach(mat => {
    const div = document.createElement('div');
    div.className = 'shop-item';
    div.innerHTML = `
      <div class="shop-rarity rarity-${mat.rarity}">${mat.rarity}</div>
      <div class="shop-item-emoji">${mat.emoji}</div>
      <div class="shop-item-name">${mat.name}</div>
      <div class="shop-item-price">${mat.cost} 💎</div>
      <div class="shop-item-stock">Stock: ∞</div>`;
    div.addEventListener('click', () => openBuyModal(mat));
    grid.appendChild(div);
  });
}

let buyingMat = null;
function openBuyModal(mat) {
  buyingMat = mat;
  document.getElementById('buy-icon').textContent  = mat.emoji;
  document.getElementById('buy-name').textContent  = mat.name;
  document.getElementById('buy-price-info').textContent = `${mat.cost} 💎 por unidad`;
  const input = document.getElementById('buy-qty');
  input.value = 1;
  input.max   = Math.floor(G.emeralds / mat.cost) || 1;
  updateBuyTotal();
  document.getElementById('modal-buy').classList.remove('hidden');
}

function updateBuyTotal() {
  const qty = Math.max(1, +document.getElementById('buy-qty').value || 1);
  document.getElementById('buy-total').textContent = (qty * buyingMat.cost).toLocaleString() + ' 💎';
}

function confirmBuy() {
  const qty   = Math.max(1, +document.getElementById('buy-qty').value || 1);
  const total = qty * buyingMat.cost;
  if (total > G.emeralds) { toast('❌ No tienes suficientes esmeraldas'); return; }
  G.emeralds -= total;
  G.materials[buyingMat.id] = (G.materials[buyingMat.id] || 0) + qty;
  document.getElementById('modal-buy').classList.add('hidden');
  toast(`✅ Compraste ${qty}× ${buyingMat.emoji} ${buyingMat.name}`);
  renderMaterials();
  renderWorkshop();
  updateHUD();
}

function renderMaterials() {
  const grid = document.getElementById('materials-grid');
  const items = Object.entries(G.materials).filter(([,v]) => v > 0);
  if (items.length === 0) {
    grid.innerHTML = '<p class="muted-sm" style="padding:10px">Sin materiales. Ve a la tienda.</p>';
    return;
  }
  grid.innerHTML = items.map(([id, qty]) => {
    const m = MATERIALS[id];
    return `<div class="mat-chip"><span class="mat-chip-emoji">${m.emoji}</span>${m.name} ×${qty}</div>`;
  }).join('');
}

/* ── ENCARGOS ────────────────────────────────────────────── */
function spawnOrders(count) {
  for (let i = 0; i < count; i++) {
    const prank   = PRANKS[Math.floor(Math.random() * PRANKS.length)];
    const client  = CLIENTS[Math.floor(Math.random() * CLIENTS.length)];
    const target  = TARGETS[Math.floor(Math.random() * TARGETS.length)];
    const isEpic  = prank.type === 'epic' && G.chaos >= 30;

    // Reward scales with chaos level
    const chaosBonus   = 1 + (G.chaos / 100) * 0.5;
    const reward       = Math.round(prank.baseReward * chaosBonus * (0.9 + Math.random()*.2));
    const expiresDay   = G.day + 2 + Math.floor(Math.random() * 2);

    const order = {
      id:         G.orderIdCounter++,
      prank,
      client,
      target,
      reward,
      expiresDay,
      isEpic: isEpic || prank.type === 'epic'
    };

    // Avoid duplicates
    if (!G.orders.find(o => o.prank.id === prank.id)) {
      G.orders.push(order);
    }
  }
  renderOrders();
}

function renderOrders() {
  const list = document.getElementById('orders-list');
  document.getElementById('orders-badge').textContent = G.orders.length + ' pendientes';

  if (G.orders.length === 0) {
    list.innerHTML = `<div class="empty-state"><div>😴</div><p>Sin encargos.</p><p class="muted-sm">Avanza el día o usa Modo Caos.</p></div>`;
    return;
  }

  list.innerHTML = '';
  G.orders.forEach(order => {
    const { prank, client, target, reward, expiresDay, isEpic } = order;
    const daysLeft = expiresDay - G.day;
    const stars    = Array.from({length:3}, (_,i) => `<span class="diff-star ${i < prank.diff ? 'lit' : ''}">⭐</span>`).join('');
    const tagType  = isEpic ? 'epic' : prank.type === 'risky' ? 'risky' : 'normal';
    const tagText  = isEpic ? '⚡ ÉPICO' : prank.type === 'risky' ? '⚠️ RIESGO' : '✅ NORMAL';
    const isSelected = G.selectedOrder?.id === order.id;

    const card = document.createElement('div');
    card.className = `order-card ${isEpic ? 'epic' : ''} ${isSelected ? 'selected' : ''}`;
    card.innerHTML = `
      <div class="order-tag tag-${tagType}">${tagText}</div>
      <div class="order-top">
        <div class="order-avatar">${client.avatar}</div>
        <div class="order-name-row">
          <div class="order-client ${client.color}">${client.name}</div>
          <div class="order-type-tag">${client.prefix}</div>
        </div>
        <div class="order-expires">⏰ ${daysLeft}d</div>
      </div>
      <div class="order-target">
        <span>${prank.emoji}</span>
        <span class="order-prank-name">${prank.name}</span>
        <span style="color:var(--muted);font-size:.75rem">→ ${target}</span>
        <span class="order-reward">${reward} 💎</span>
      </div>
      <div class="order-diff">${stars}</div>`;
    card.addEventListener('click', () => selectOrder(order));
    list.appendChild(card);
  });
}

function selectOrder(order) {
  G.selectedOrder = order;
  renderOrders();
  renderWorkshop();
  toast(`📋 Encargo seleccionado: ${order.prank.emoji} ${order.prank.name}`);
}

/* ── TALLER ──────────────────────────────────────────────── */
function renderWorkshop() {
  const el = document.getElementById('active-recipe');

  if (!G.selectedOrder) {
    el.innerHTML = `<div class="no-recipe"><span style="font-size:3rem">🔨</span><p>Selecciona un encargo<br>del panel izquierdo</p></div>`;
    document.getElementById('craft-status').textContent = 'Selecciona un encargo para craftear';
    document.getElementById('btn-execute').classList.add('hidden');
    return;
  }

  const { prank, target, reward } = G.selectedOrder;
  const recipe = prank.recipe;

  // Check if we have all materials
  let canCraft = true;
  const ingHTML = Object.entries(recipe).map(([matId, needed]) => {
    const have    = G.materials[matId] || 0;
    const ok      = have >= needed;
    if (!ok) canCraft = false;
    const mat     = MATERIALS[matId];
    return `
      <div class="ing-item ${ok ? 'have' : 'missing'}">
        <span class="ing-emoji">${mat.emoji}</span>
        <div>
          <div class="ing-name">${mat.name}</div>
          <div style="font-size:.7rem;color:var(--muted)">${have}/${needed}</div>
        </div>
        <span class="ing-check ${ok ? 'ok' : 'missing'}">${ok ? '✓ OK' : '✗ Falta'}</span>
      </div>`;
  }).join('');

  const riskClass = prank.risk < 25 ? 'risk-low' : prank.risk < 55 ? 'risk-med' : 'risk-high';
  const riskLabel = prank.risk < 25 ? 'BAJO' : prank.risk < 55 ? 'MEDIO' : 'ALTO';

  el.innerHTML = `
    <div class="recipe-header">
      <div class="recipe-emoji">${prank.emoji}</div>
      <div>
        <div class="recipe-name">${prank.name}</div>
        <div class="recipe-desc">${prank.desc}</div>
        <div style="font-size:.75rem;color:var(--muted);margin-top:4px">Objetivo: <b style="color:var(--text)">${target}</b></div>
      </div>
      <div class="recipe-reward-tag">
        <div class="recipe-reward-val">${reward} 💎</div>
        <div class="recipe-reward-lbl">recompensa</div>
      </div>
    </div>

    <div class="recipe-ingredients">
      <div class="ing-title">Materiales necesarios</div>
      <div class="ing-grid">${ingHTML}</div>
    </div>

    <div class="recipe-risk ${riskClass}">
      <div class="ing-title" style="margin-bottom:6px">Riesgo de backfire</div>
      <div class="risk-bar-wrap">
        <div class="risk-bar"><div class="risk-fill" style="width:${prank.risk}%"></div></div>
        <span class="risk-label" style="color:${prank.risk<25?'var(--creeper)':prank.risk<55?'var(--gold)':'var(--tnt)'}">${prank.risk}% ${riskLabel}</span>
      </div>
    </div>`;

  document.getElementById('craft-status').textContent = canCraft
    ? '✅ Materiales listos — ¡ejecuta la broma!'
    : '❌ Faltan materiales — compra en la tienda';

  const execBtn = document.getElementById('btn-execute');
  if (canCraft) execBtn.classList.remove('hidden');
  else execBtn.classList.add('hidden');
}

/* ── EJECUTAR BROMA ──────────────────────────────────────── */
function executePrank() {
  if (!G.selectedOrder) return;
  const order = G.selectedOrder;
  const { prank, client, target, reward } = order;

  // Consumir materiales
  Object.entries(prank.recipe).forEach(([matId, qty]) => {
    G.materials[matId] = (G.materials[matId] || 0) - qty;
  });

  // Calcular resultado (con bonus de caos)
  const chaosDiminish = Math.max(0, G.chaos - 50) * 0.002; // a más caos, más errores
  const successChance = (100 - prank.risk) / 100 - chaosDiminish;
  const roll          = Math.random();
  const isSuccess     = roll < successChance;
  const isCritical    = roll < successChance * 0.2; // critico: 20% de los éxitos
  const isBackfire    = !isSuccess;

  let title, desc, rewardText, rewardAmt, anim, reactions;

  if (isCritical) {
    const fx   = prank.successFx[Math.floor(Math.random()*prank.successFx.length)];
    const bonus = Math.round(reward * 0.5);
    rewardAmt  = reward + bonus;
    title      = '🌟 ¡CRÍTICO LEGENDARIO!';
    desc       = `La broma salió PERFECTA. ${fx}. El servidor entero lo presenció.`;
    rewardText = `+${rewardAmt} 💎 (+${bonus} bonus crítico)`;
    anim       = '🌟';
    reactions  = buildChatReactions(client, target, prank, 'critical');
    G.chaos    = Math.min(100, G.chaos + 12);

  } else if (isSuccess) {
    const fx   = prank.successFx[Math.floor(Math.random()*prank.successFx.length)];
    rewardAmt  = reward;
    title      = '✅ ¡BROMA EXITOSA!';
    desc       = `${fx}. ${target} no lo vio venir. ${client.name} pagará encantado.`;
    rewardText = `+${rewardAmt} 💎`;
    anim       = prank.emoji;
    reactions  = buildChatReactions(client, target, prank, 'success');
    G.chaos    = Math.min(100, G.chaos + 6);

  } else {
    const fx   = prank.failFx[Math.floor(Math.random()*prank.failFx.length)];
    rewardAmt  = 0;
    title      = '💀 ¡BACKFIRE!';
    desc       = `La broma salió mal. ${fx}. ${client.name} pide un reembolso.`;
    rewardText = `+0 💎 (materiales perdidos)`;
    anim       = '💀';
    reactions  = buildChatReactions(client, target, prank, 'fail');
    G.backfires++;
    G.chaos = Math.max(0, G.chaos - 5);
  }

  // Aplicar resultado
  G.emeralds      += rewardAmt;
  G.emeraldsEarned+= rewardAmt;
  G.pranksCompleted++;
  if (rewardAmt > G.bestPrankReward) {
    G.bestPrankReward = rewardAmt;
    G.bestPrankName   = prank.name;
  }

  // Quitar orden
  G.orders      = G.orders.filter(o => o.id !== order.id);
  G.selectedOrder = null;

  // Mostrar modal resultado
  showResultModal(anim, title, desc, rewardText, rewardAmt > 0, reactions);

  // Chat reactions
  reactions.forEach((r, i) => setTimeout(() => addChat(r.color, r.name, r.msg, r.type), 400 + i*500));

  renderMaterials();
  renderOrders();
  renderWorkshop();
  updateHUD();

  if (G.day >= G.maxDays && G.orders.length === 0) setTimeout(showEndScreen, 1200);
}

function buildChatReactions(client, target, prank, outcome) {
  const victims = [
    { name:'El_Noob_Victima', color:'sky' },
    { name:target.replace(/\s/g,'_'), color:'red' },
  ];
  const reactions = [];

  if (outcome === 'critical') {
    reactions.push({ color:'gold', name:client.name, msg:`LOOL PERFECTO!!!! ${prank.emoji} ERES EL MEJOR TROLL MASTER`, type:'positive' });
    reactions.push({ color:'red',  name:victims[1].name, msg:`¿QUÉ FUE ESO???? ADMIN ADMIN ADMIN!!!`, type:'angry' });
    reactions.push({ color:'green',name:'CreeperFan2024', msg:`JAJAJAJAJAJAJ eso fue increible`, type:'positive' });
    reactions.push({ color:'sky',  name:'_Steve_', msg:`lo vi todo desde mi ventana de cristal LMAO`, type:'positive' });
    reactions.push({ color:'purple',name:'WitchIsBack', msg:`tengo pociones de reparo si las necesitas ${prank.emoji}`, type:'neutral' });

  } else if (outcome === 'success') {
    reactions.push({ color:'gold', name:client.name, msg:`jajaja exactamente lo que pedí! 💎 pagado`, type:'positive' });
    reactions.push({ color:'red',  name:victims[1].name, msg:`QUE... QUIEN FUE??? >:(((`, type:'angry' });
    reactions.push({ color:'green',name:'CreeperFan2024', msg:`no pude no ver eso JAJAJAJA`, type:'positive' });
    reactions.push({ color:'orange',name:'TNT_Queen', msg:`respeto. no es fácil ${prank.name} sin que salga mal`, type:'neutral' });

  } else {
    reactions.push({ color:'gold', name:client.name, msg:`oye... eso no era lo que acordamos...`, type:'neutral' });
    reactions.push({ color:'green',name:'SkeletonNoob', msg:`looool el troll master se troleó solo XDDD`, type:'positive' });
    reactions.push({ color:'red',  name:victims[1].name, msg:`jajaja te lo mereces por intentar trollearme`, type:'angry' });
    reactions.push({ color:'sky',  name:'Diamante_Steve', msg:`F en el chat`, type:'neutral' });
  }
  return reactions;
}

function showResultModal(anim, title, desc, rewardText, isPositive, reactions) {
  document.getElementById('result-anim').textContent  = anim;
  document.getElementById('result-title').textContent = title;
  document.getElementById('result-desc').textContent  = desc;
  const rew = document.getElementById('result-reward');
  rew.textContent  = rewardText;
  rew.className    = 'result-reward' + (isPositive ? '' : ' negative');

  document.getElementById('result-reactions').innerHTML = reactions.slice(0,3).map(r =>
    `<div class="reaction-line"><span class="chat-name ${r.color}">${r.name}:</span> ${r.msg}</div>`
  ).join('');

  const card = document.getElementById('result-card');
  card.style.borderColor = isPositive ? 'rgba(34,197,94,.5)' : 'rgba(239,68,68,.5)';

  document.getElementById('modal-result').classList.remove('hidden');
}

/* ── MODO CAOS ───────────────────────────────────────────── */
function activateChaos() {
  if (G.emeralds < 50) { toast('❌ Necesitas 50 💎 para el Modo Caos'); return; }
  G.emeralds -= 50;
  G.chaos = Math.min(100, G.chaos + 20);
  spawnOrders(3);
  addChat('system','[SISTEMA]','⚠️ MODO CAOS ACTIVADO — encargos épicos llegando al servidor...','system');
  addChat('orange','TNT_Queen','algo raro pasa hoy en el servidor... lo presiento','neutral');
  addChat('red','xXGriefer_ProXx','MODO CAOS???? WOOOOO','positive');
  toast('🌋 ¡MODO CAOS! +3 encargos épicos. Caos: '+G.chaos+'%');
  updateHUD();
}

/* ── DÍA SIGUIENTE ───────────────────────────────────────── */
function advanceDay() {
  if (G.day >= G.maxDays) { showEndScreen(); return; }
  G.day++;

  // Expirar encargos
  const before = G.orders.length;
  G.orders = G.orders.filter(o => o.expiresDay >= G.day);
  const expired = before - G.orders.length;
  if (expired > 0) {
    toast(`⚠️ ${expired} encargo${expired>1?'s':''} expirado${expired>1?'s':''}`);
    addChat('system','[SERVER]',`${expired} encargo${expired>1?'s expirarón':' expiró'} sin completar.`,'system');
  }

  // Nuevos encargos (2-3 diarios)
  const count = 2 + (Math.random() < 0.4 ? 1 : 0);
  spawnOrders(count);

  // Chat de noche
  addChat('green','PhantomHunter','nueva noche, nuevas bromas 😈','neutral');
  if (G.chaos > 50) addChat('red','xXGriefer_ProXx','el caos está al '+G.chaos+'%... tiemblen...','positive');

  if (G.day >= G.maxDays) {
    setTimeout(showEndScreen, 600);
    return;
  }

  G.selectedOrder = null;
  renderOrders();
  renderWorkshop();
  updateHUD();
}

/* ── IDLE CHAT ───────────────────────────────────────────── */
function startIdleChat() {
  if (G.chatInterval) clearInterval(G.chatInterval);
  let idx = Math.floor(Math.random() * IDLE_CHAT.length);
  G.chatInterval = setInterval(() => {
    if (G.day > G.maxDays) { clearInterval(G.chatInterval); return; }
    const line = IDLE_CHAT[idx % IDLE_CHAT.length];
    addChat(line[0], line[1], line[2], 'neutral');
    idx++;
    // Random online player count drift
    G.onlinePlayers = Math.max(8, Math.min(40, G.onlinePlayers + Math.floor(Math.random()*3-1)));
    document.getElementById('online-count').textContent = G.onlinePlayers;
  }, 7000 + Math.random()*5000);
}

function addChat(color, name, msg, type='neutral') {
  const feed = document.getElementById('chat-feed');
  if (!feed) return;

  const now  = new Date();
  const time = now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0');

  const div = document.createElement('div');
  div.className = 'chat-line';
  div.innerHTML = `<span class="chat-time">[${time}]</span> <span class="chat-name ${color}">${name}</span><span class="chat-msg ${type}">: ${msg}</span>`;
  feed.appendChild(div);

  // Keep max 80 messages
  while (feed.children.length > 80) feed.removeChild(feed.firstChild);
  feed.scrollTop = feed.scrollHeight;
}

/* ── PANTALLA FINAL ──────────────────────────────────────── */
function showEndScreen() {
  clearInterval(G.chatInterval);
  document.getElementById('game-hud').style.display = 'none';

  const net = G.emeraldsEarned;
  let icon, title, sub, rankClass, rankText;

  if (G.pranksCompleted >= 12 && net >= 1500) {
    icon='👑'; title='¡LEYENDA DEL TROLL!'; rankClass='rank-legend';
    rankText='💜 Rango: HEROBRINE APRENDIZ — El caos te reconoce';
    sub=`${G.pranksCompleted} bromas completadas. Ganaste ${net.toLocaleString()} 💎. El servidor te tiene miedo.`;
    launchConfetti();
  } else if (G.pranksCompleted >= 7 && net >= 600) {
    icon='💣'; title='MAESTRO DEL CAOS'; rankClass='rank-master';
    rankText='🟠 Rango: CREEPER VIP — Los villagers lloran contigo';
    sub=`${G.pranksCompleted} bromas bien ejecutadas, ${G.backfires} backfires. Buena temporada, troll.`;
  } else if (G.pranksCompleted >= 3) {
    icon='😂'; title='NOVATO DEL TROLL'; rankClass='rank-rookie';
    rankText='💚 Rango: GRIEFER APRENDIZ — Tienes potencial';
    sub=`${G.pranksCompleted} bromas. ${G.backfires} backfires te delataron. Practica más.`;
  } else {
    icon='💀'; title='EL TROLL TROLLEADO'; rankClass='rank-noob';
    rankText='⬜ Rango: NOOB — Hasta los creepers te compadecen';
    sub=`Solo ${G.pranksCompleted} bromas. ${G.backfires} backfires. ¡Vuelve a intentarlo, campeón!`;
  }

  document.getElementById('end-icon').textContent  = icon;
  document.getElementById('end-title').textContent = title;
  document.getElementById('end-sub').textContent   = sub;
  document.getElementById('end-rank').textContent  = rankText;
  document.getElementById('end-rank').className    = 'end-rank '+rankClass;
  document.getElementById('end-stats').innerHTML   = `
    <div class="end-stat"><div class="end-stat-val">${G.pranksCompleted}</div><div class="end-stat-lbl">💣 Bromas</div></div>
    <div class="end-stat"><div class="end-stat-val">${net.toLocaleString()}</div><div class="end-stat-lbl">💎 Ganancias</div></div>
    <div class="end-stat"><div class="end-stat-val">${G.backfires}</div><div class="end-stat-lbl">💀 Backfires</div></div>`;
  document.getElementById('best-prank').innerHTML = G.bestPrankName
    ? `🏆 Mejor broma: <b>${G.bestPrankName}</b> — ${G.bestPrankReward} 💎`
    : '🎭 Sin bromas memorables esta temporada.';

  showScreen('end');
}

function launchConfetti() {
  const burst = document.getElementById('confetti-burst');
  const colors = ['#22c55e','#f97316','#a855f7','#eab308','#ef4444','#38bdf8'];
  for (let i = 0; i < 60; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.left = Math.random()*100+'%';
    p.style.background = colors[Math.floor(Math.random()*colors.length)];
    p.style.animationDuration = (1.5+Math.random()*2)+'s';
    p.style.animationDelay    = (Math.random()*.8)+'s';
    burst.appendChild(p);
    setTimeout(() => p.remove(), 4000);
  }
}

/* ── ESTRELLAS ───────────────────────────────────────────── */
(function makeStars() {
  const container = document.getElementById('stars');
  for (let i = 0; i < 80; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    s.style.left   = Math.random()*100+'%';
    s.style.top    = Math.random()*60+'%';
    s.style.setProperty('--tw-dur', (2+Math.random()*4)+'s');
    s.style.setProperty('--tw-del', (Math.random()*5)+'s');
    container.appendChild(s);
  }
})();

/* ── PARTÍCULAS ──────────────────────────────────────────── */
(function particles() {
  const c = document.getElementById('bgParticles');
  if (!c) return;
  const ctx = c.getContext('2d');
  const dpi = Math.max(1, devicePixelRatio||1);
  let w, h, parts;
  const init = () => {
    w = c.width  = innerWidth  * dpi;
    h = c.height = innerHeight * dpi;
    parts = Array.from({length:50}, () => ({
      x: Math.random()*w, y: Math.random()*h,
      r: (.4+Math.random()*1.4)*dpi, s: .08+Math.random()*.3,
      a: .04+Math.random()*.12,
      // green creeper or orange TNT particles
      hue: Math.random()>.4 ? 130+Math.random()*20 : 25+Math.random()*15
    }));
  };
  const tick = () => {
    ctx.clearRect(0,0,w,h);
    parts.forEach(p => {
      p.y += p.s; p.x += Math.sin(p.y*.004)*.2;
      if (p.y>h) { p.y=-10; p.x=Math.random()*w; }
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`hsla(${p.hue},80%,60%,${p.a})`; ctx.fill();
    });
    requestAnimationFrame(tick);
  };
  init(); tick();
  addEventListener('resize', init);
})();

/* ── NAVBAR ──────────────────────────────────────────────── */
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');
navToggle?.addEventListener('click', e => { e.stopPropagation(); navLinks.classList.toggle('open'); });
document.addEventListener('click', e => {
  if (!navToggle?.contains(e.target) && !navLinks?.contains(e.target)) navLinks?.classList.remove('open');
});

/* ── TOAST ───────────────────────────────────────────────── */
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2800);
}

/* ── LISTENERS ───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-start').addEventListener('click', initGame);
  document.getElementById('btn-restart').addEventListener('click', () => showScreen('title'));
  document.getElementById('btn-nextday').addEventListener('click', advanceDay);
  document.getElementById('btn-chaos').addEventListener('click', activateChaos);
  document.getElementById('btn-execute').addEventListener('click', executePrank);

  // Tienda toggle
  const shopPanel = document.getElementById('shop-panel');
  const chatPanel = document.getElementById('chat-panel');
  document.getElementById('btn-shop-toggle').addEventListener('click', () => {
    shopPanel.classList.remove('hidden'); chatPanel.classList.add('hidden');
  });
  document.getElementById('btn-shop-close').addEventListener('click', () => {
    shopPanel.classList.add('hidden'); chatPanel.classList.remove('hidden');
  });

  // Modal compra
  document.getElementById('buy-close').addEventListener('click', () => document.getElementById('modal-buy').classList.add('hidden'));
  document.getElementById('modal-buy').addEventListener('click', e => { if(e.target===document.getElementById('modal-buy')) document.getElementById('modal-buy').classList.add('hidden'); });
  document.getElementById('buy-minus').addEventListener('click', () => { const i=document.getElementById('buy-qty'); i.value=Math.max(1,+i.value-1); updateBuyTotal(); });
  document.getElementById('buy-plus').addEventListener('click',  () => { const i=document.getElementById('buy-qty'); i.value=Math.min(+i.max||99,+i.value+1); updateBuyTotal(); });
  document.getElementById('buy-qty').addEventListener('input', updateBuyTotal);
  document.getElementById('buy-confirm').addEventListener('click', confirmBuy);

  // Modal resultado
  document.getElementById('result-close').addEventListener('click', () => document.getElementById('modal-result').classList.add('hidden'));

  showScreen('title');
});