'use strict';
/* =========================================================
   Moonveil Portal — Pases de Temporada (JS) v5
   CAMBIOS v5:
   - Llaves Superestrella en el carril (integradas con chest.js)
   - Cadena de mejoras: Hierro → Oro → Esmeralda → Diamante
   - Sistema de descuentos fácil de activar/desactivar
   - Boosts funcionales (activan multiplicador de XP con timer)
   - Buzón de mensajes en pases (XP, llaves, boosts)
   FIX: claimLevelReward ahora re-fetcha el estado después de
        processReward para no sobreescribir el XP añadido por addXP.
   ========================================================= */

const $ = (q, ctx = document) => ctx.querySelector(q);
const $$ = (q, ctx = document) => Array.from(ctx.querySelectorAll(q));
const esc = s => String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const now = () => Date.now();
const H24 = 86400000, H1 = 3600000, M1 = 60000, S1 = 1000;

const XP_PER_LEVEL = 50;
const MAX_LEVELS   = 60;
const OVERFLOW_XP_PER_REWARD = 300;

/* ═══════════════════════════════════════════════════════════
   STORAGE KEYS
═══════════════════════════════════════════════════════════ */
const CHEST_KEYS_LS  = 'mv_chest_keys_v1'; // Compatible con chest.js
const PASS_BOOSTS_LS = 'mv_active_boosts'; // Boosts activos globales
const PASS_MAIL_LS   = 'mv_pass_mail_claimed';
const GLOBAL_INV     = 'mv_global_inventory';
const TICKETS_BASE   = 'mv_tickets_';

/* ═══════════════════════════════════════════════════════════
   ★ DESCUENTOS ACTIVOS — EDITA AQUÍ PARA ACTIVAR/DESACTIVAR ★

   Para activar: descomenta la línea y cambia el porcentaje
   Para desactivar: añade // al inicio de la línea
   El precio final se calcula automáticamente y se muestra en la UI
═══════════════════════════════════════════════════════════ */
const PASS_DISCOUNTS = {
  // iron:    30,   // 30% desc. → ⟡128 → ⟡89
  // gold:    20,   // 20% desc. → ⟡256 → ⟡204
  // emerald: 15,   // 15% desc. → ⟡384 → ⟡326
  // diamond: 10,   // 10% desc. → ⟡512 → ⟡460
};

/* ═══════════════════════════════════════════════════════════
   MAPEO SUBTIPO LLAVE → ID CHEST.JS
═══════════════════════════════════════════════════════════ */
const SUBTYPE_TO_CHEST_KEY = {
  normal:   'key_common',
  pink:     'key_valentine',
  green:    'key_special',
  future:   'key_legendary',
  special:  'key_special',
  orange:   'key_halloween',
  cat:      'key_cat',
  classic:  'key_common',
};

const REWARD_TYPES = {
  xp:       { emoji:'⭐', name:'XP Bonus',     color:'#fbbf24' },
  emeralds: { emoji:'💎', name:'Gemas',         color:'#34d399' },
  keys:     { emoji:'🔑', name:'Llave',         color:'#60a5fa' },
  tickets:  { emoji:'🎫', name:'Tickets',        color:'#a78bfa' },
  copper:   { emoji:'🪙', name:'Monedas',        color:'#fb923c' },
  chest:    { emoji:'📦', name:'Cofre',          color:'#f59e0b' },
  random:   { emoji:'🎁', name:'Sorpresa',       color:'#ec4899' },
  skin:     { emoji:'🎨', name:'Skin',           color:'#c084fc' },
  pet:      { emoji:'🐾', name:'Mascota',        color:'#f472b6' },
  title:    { emoji:'📜', name:'Título',         color:'#fb923c' },
  banner:   { emoji:'🏳️', name:'Estandarte',    color:'#38bdf8' },
  trail:    { emoji:'✨', name:'Estela',         color:'#a78bfa' },
  boost:    { emoji:'⚡', name:'Boost XP',       color:'#fbbf24' },
};

/* ═══════════════════════════════════════════════════════════
   TIERS
═══════════════════════════════════════════════════════════ */
const TIERS = [
  { id:'stone',   emoji:'⬜', name:'Piedra',    desc:'Novato',   color:'var(--tier-stone)',   unlockPrice: 0 },
  { id:'iron',    emoji:'⬛', name:'Hierro',    desc:'Aprendiz', color:'var(--tier-iron)',    unlockPrice: 128 },
  { id:'gold',    emoji:'🟨', name:'Oro',       desc:'Oficial',  color:'var(--tier-gold)',    unlockPrice: 256 },
  { id:'emerald', emoji:'🟩', name:'Esmeralda', desc:'Experto',  color:'var(--tier-emerald)', unlockPrice: 384 },
  { id:'diamond', emoji:'🔷', name:'Diamante',  desc:'Maestro',  color:'var(--tier-diamond)', unlockPrice: 512 },
];

/* ═══════════════════════════════════════════════════════════
   BUZÓN DE PASES — mensajes que puede recibir el jugador
═══════════════════════════════════════════════════════════ */
const PASS_MAIL_ITEMS = [
  {
    id:'pm_001', title:'¡Bienvenido a los Pases de Temporada!',
    sender:'Equipo Moonveil', emoji:'🎉',
    msg:'Gracias por unirte a los pases de temporada. Aquí tienes un regalo de bienvenida para empezar tu aventura. ¡Que la suerte te acompañe, viajero!',
    rewards:[
      { type:'xp', amount:500, emoji:'⭐', name:'XP Bonus' },
      { type:'keys', keyId:'key_common', amount:3, emoji:'⭐', name:'Llave Superestrella' },
    ]
  },
  {
    id:'pm_115', title:'Regalo VIP del Pase',
    sender:'Sand Brill Premium ✦', emoji:'👑',
    msg:'Incluso Sand Brill se puso generoso esta vez. Un boost de XP intenso y un extra de experiencia para que llegues al nivel máximo. ¡Suerte!',
    rewards:[
      { type:'xp', amount:1000, emoji:'⭐', name:'XP Bonus' },
      { type:'boost', boostHours:4, boostMultiplier:2.0, emoji:'⚡', name:'Boost XP 4h ×2.0' },
    ]
  },
  /*{
    id:'pm_002', title:'Boost de XP de Bienvenida',
    sender:'Sistema Moonveil', emoji:'⚡',
    msg:'Un boost de XP para ayudarte a subir de nivel más rápido. ¡Actívalo en el momento que más te convenga y aprovecha cada misión!',
    rewards:[
      { type:'boost', boostHours:2, boostMultiplier:1.5, emoji:'⚡', name:'Boost XP 2h ×1.5' },
    ]
  },
  {
    id:'pm_003', title:'Pack de Llaves Especiales',
    sender:'Moonveil Events', emoji:'🔮',
    msg:'Por tu dedicación en los pases de temporada te enviamos un pack de llaves para los cofres. ¡Ábrelos en la página de Cofres!',
    rewards:[
      { type:'keys', keyId:'key_rare',    amount:2, emoji:'💫', name:'Llave Superestrella Brillante' },
      { type:'keys', keyId:'key_special', amount:1, emoji:'✨', name:'Llave Superestrella Especial' },
    ]
  },
  {
    id:'pm_004', title:'Compensación de Mantenimiento',
    sender:'Soporte Moonveil', emoji:'💎',
    msg:'Como compensación por las molestias del último mantenimiento del servidor, te enviamos estas gemas y monedas. ¡Gracias por tu paciencia!',
    rewards:[
      { type:'emeralds', amount:150, emoji:'💎', name:'Gemas' },
      { type:'copper',   amount:500, emoji:'🪙', name:'Monedas' },
    ]
  },
  {
    id:'pm_005', title:'Regalo VIP del Pase',
    sender:'Sand Brill Premium ✦', emoji:'👑',
    msg:'Incluso Sand Brill se puso generoso esta vez. Un boost de XP intenso y un extra de experiencia para que llegues al nivel máximo. ¡Suerte!',
    rewards:[
      { type:'xp', amount:1000, emoji:'⭐', name:'XP Bonus' },
      { type:'boost', boostHours:4, boostMultiplier:2.0, emoji:'⚡', name:'Boost XP 4h ×2.0' },
    ]
  },
  {
    id:'pm_006', title:'Pack de Llaves Legendarias',
    sender:'Evento Especial Moonveil', emoji:'🌟',
    msg:'Por completar eventos especiales, te mereces estas llaves legendarias. ¡Úsalas en los cofres más poderosos!',
    rewards:[
      { type:'keys', keyId:'key_epic',      amount:1, emoji:'🔮', name:'Llave Superestrella Épica' },
      { type:'keys', keyId:'key_legendary', amount:1, emoji:'👑', name:'Llave Superestrella Legendaria' },
    ]
  },*/
];

/* ═══════════════════════════════════════════════════════════
   OVERFLOW REWARDS (nivel 60+) — ahora con llaves
═══════════════════════════════════════════════════════════ */
function getOverflowRewardsForPass(pass, tier) {
  const defaults = {
    stone: [
      { type:'keys', emoji:'⭐', name:'Llave Superestrella',           amount:1, keyId:'key_common'  },
      { type:'copper', emoji:'🪙', name:'Monedas',                     amount:2 },
      { type:'keys', emoji:'⭐', name:'Llave Superestrella x2',        amount:2, keyId:'key_common'  },
      { type:'emeralds', emoji:'💎', name:'Gemas',                     amount:1 },
    ],
    iron: [
      { type:'keys', emoji:'💫', name:'Llave Superestrella Brillante', amount:1, keyId:'key_rare'    },
      { type:'copper', emoji:'🪙', name:'Monedas',                     amount:4 },
      { type:'keys', emoji:'💫', name:'Llave Superestrella Brillante', amount:2, keyId:'key_rare'    },
      { type:'emeralds', emoji:'💎', name:'Gemas',                     amount:2 },
    ],
    gold: [
      { type:'keys', emoji:'✨', name:'Llave Superestrella Especial',  amount:1, keyId:'key_special' },
      { type:'copper', emoji:'🪙', name:'Monedas',                     amount:6 },
      { type:'keys', emoji:'💫', name:'Llave Superestrella Brillante', amount:2, keyId:'key_rare'    },
      { type:'emeralds', emoji:'💎', name:'Gemas',                     amount:3 },
    ],
    emerald: [
      { type:'keys', emoji:'🔮', name:'Llave Superestrella Épica',     amount:1, keyId:'key_epic'    },
      { type:'emeralds', emoji:'💎', name:'Gemas',                     amount:8 },
      { type:'keys', emoji:'✨', name:'Llave Superestrella Especial',  amount:2, keyId:'key_special' },
      { type:'copper', emoji:'🪙', name:'Monedas',                     amount:4 },
    ],
    diamond: [
      { type:'keys', emoji:'👑', name:'Llave Superestrella Legendaria',amount:1, keyId:'key_legendary' },
      { type:'emeralds', emoji:'💎', name:'Gemas',                     amount:5 },
      { type:'keys', emoji:'🔮', name:'Llave Superestrella Épica x2',  amount:2, keyId:'key_epic'    },
      { type:'keys', emoji:'👑', name:'Llave Superestrella Legendaria',amount:1, keyId:'key_legendary' },
    ],
  };
  const special = {
    pass_s1:  { all:[ { type:'keys', emoji:'❄️', name:'Llave Superestrella', amount:1, keyId:'key_common'    }, { type:'copper', emoji:'🪙', name:'Monedas', amount:2 }, { type:'emeralds', emoji:'💎', name:'Gemas', amount:1 } ] },
    pass_s2:  { all:[ { type:'keys', emoji:'💗', name:'Llave Corazón',       amount:1, keyId:'key_valentine' }, { type:'copper', emoji:'🪙', name:'Monedas', amount:2 }, { type:'emeralds', emoji:'💎', name:'Gemas', amount:1 } ] },
    pass_s10: { all:[ { type:'keys', emoji:'🎃', name:'Llave Calabaza',      amount:1, keyId:'key_halloween' }, { type:'copper', emoji:'🪙', name:'Monedas', amount:3 }, { type:'keys', emoji:'💫', name:'Llave Brillante', amount:1, keyId:'key_rare' } ] },
    pass_s12: { all:[ { type:'keys', emoji:'🎄', name:'Llave Navideña',      amount:1, keyId:'key_christmas' }, { type:'copper', emoji:'🪙', name:'Monedas', amount:3 }, { type:'keys', emoji:'✨', name:'Llave Especial', amount:1, keyId:'key_special' } ] },
  };
  if (pass && special[pass.id] && special[pass.id].all) return special[pass.id].all;
  return defaults[tier] || defaults.stone;
}

/* ═══════════════════════════════════════════════════════════
   MISIONES DE JUEGO POR TIER
═══════════════════════════════════════════════════════════ */
const PASS_TIER_GAME_MISSIONS = {
  stone: [
    { id:'pg_stone_gather', name:'Recolector de Piedra',   desc:'Recoge 15 bloques de piedra en el mundo.',       emoji:'⛏️', xpReward:160, reward:{ type:'copper', amount:2 },  target:15, category:'Misiones Piedra',   categoryIcon:'⬜' },
    { id:'pg_stone_walk',   name:'Caminante',              desc:'Camina 500 bloques en cualquier dirección.',     emoji:'👣', xpReward:140, reward:{ type:'copper', amount:2 },  target:500,category:'Misiones Piedra',   categoryIcon:'⬜' },
    { id:'pg_stone_sleep',  name:'Buenas Noches',          desc:'Duerme 3 noches en tu cama.',                   emoji:'🛏️',xpReward:120, reward:{ type:'emeralds',amount:1  }, target:3,  category:'Misiones Piedra',   categoryIcon:'⬜' },
  ],
  iron: [
    { id:'pg_iron_mine',    name:'Minero de Hierro',       desc:'Extrae 20 lingotes de hierro.',                 emoji:'⛏️', xpReward:200, reward:{ type:'keys', keyId:'key_common', emoji:'⭐', name:'Llave Superestrella', amount:1 }, target:20, category:'Misiones Hierro',   categoryIcon:'⬛' },
    { id:'pg_iron_smelt',   name:'Fundidor',               desc:'Funde 15 minerales en un horno.',               emoji:'🔥', xpReward:180, reward:{ type:'copper', amount:3 },  target:15, category:'Misiones Hierro',   categoryIcon:'⬛' },
    { id:'pg_iron_armor',   name:'Armador',                desc:'Equipa una pieza de armadura de hierro.',       emoji:'🛡️', xpReward:220, reward:{ type:'emeralds',amount:2  }, target:1,  category:'Misiones Hierro',   categoryIcon:'⬛' },
  ],
  gold: [
    { id:'pg_gold_mine',    name:'Cazador de Oro',         desc:'Extrae 10 bloques de oro.',                     emoji:'🪨', xpReward:260, reward:{ type:'copper', amount:4 },  target:10, category:'Misiones Oro',      categoryIcon:'🟨' },
    { id:'pg_gold_trade',   name:'Comerciante de Oro',     desc:'Intercambia con aldeanos 10 veces.',            emoji:'🏪', xpReward:280, reward:{ type:'keys', keyId:'key_rare', emoji:'💫', name:'Llave Brillante', amount:1 }, target:10, category:'Misiones Oro', categoryIcon:'🟨' },
    { id:'pg_gold_beacon',  name:'Baliza Dorada',          desc:'Activa una baliza.',                            emoji:'💡', xpReward:300, reward:{ type:'emeralds',amount:3  }, target:1,  category:'Misiones Oro',      categoryIcon:'🟨' },
  ],
  emerald: [
    { id:'pg_emer_enchant', name:'Encantador Esmeralda',   desc:'Encanta 5 objetos en la mesa de encantamiento.',emoji:'📖', xpReward:320, reward:{ type:'keys', keyId:'key_special', emoji:'✨', name:'Llave Especial', amount:1 }, target:5,  category:'Misiones Esmeralda',categoryIcon:'🟩' },
    { id:'pg_emer_nether',  name:'Explorador del Nether',  desc:'Mata 10 enemigos en el Nether.',                emoji:'🔥', xpReward:350, reward:{ type:'keys', keyId:'key_special', emoji:'✨', name:'Llave Especial', amount:1 }, target:10, category:'Misiones Esmeralda',categoryIcon:'🟩' },
    { id:'pg_emer_brew',    name:'Alquimista',             desc:'Fabrica 5 pociones en el soporte de pociones.', emoji:'⚗️', xpReward:330, reward:{ type:'emeralds',amount:5  }, target:5,  category:'Misiones Esmeralda',categoryIcon:'🟩' },
  ],
  diamond: [
    { id:'pg_diam_end',     name:'Conquistador del End',   desc:'Derrota 5 endermanes en el End.',               emoji:'🌌', xpReward:450, reward:{ type:'keys', keyId:'key_epic', emoji:'🔮', name:'Llave Épica', amount:1 }, target:5,  category:'Misiones Diamante',categoryIcon:'🔷' },
    { id:'pg_diam_wither',  name:'Cazador del Wither',     desc:'Derrota al Wither una vez.',                    emoji:'💀', xpReward:500, reward:{ type:'keys', keyId:'key_legendary', emoji:'👑', name:'Llave Legendaria', amount:1 }, target:1, category:'Misiones Diamante',categoryIcon:'🔷' },
    { id:'pg_diam_build',   name:'Arquitecto Maestro',     desc:'Coloca 200 bloques en tu construcción.',        emoji:'🏰', xpReward:420, reward:{ type:'emeralds',amount:8  }, target:200,category:'Misiones Diamante',categoryIcon:'🔷' },
  ],
};

/* ═══════════════════════════════════════════════════════════
   MISIONES TEMPLATE
═══════════════════════════════════════════════════════════ */
const MISSIONS_TEMPLATE = [
  { id:'daily_login',   name:'Inicio de sesión diario', desc:'Inicia sesión hoy.',                       emoji:'🌅', reset:'24h',   xpReward:50,   reward:{ type:'copper',   amount:1  }, target:1,    exclusive:null, category:'Diarias',      categoryIcon:'🌤️' },
  { id:'daily_buy50',   name:'Gasta 50 en la Tienda',   desc:'Gasta al menos 50 ⟡ en la tienda.',        emoji:'🛍️',reset:'24h',   xpReward:80,   reward:{ type:'copper',   amount:1  }, target:50,   exclusive:null, category:'Diarias',      categoryIcon:'🌤️', trackId:'shop_spent_daily' },
  { id:'daily_login3',  name:'Racha de 3 días',         desc:'Inicia sesión durante 3 días seguidos.',   emoji:'📅', reset:'24h',   xpReward:120,  reward:{ type:'emeralds', amount:1  }, target:3,    exclusive:null, category:'Diarias',      categoryIcon:'🌤️', trackId:'login_streak' },
  { id:'week_buy200',   name:'Gasta 200 en la Tienda',  desc:'Gasta 200 ⟡ esta semana.',                 emoji:'💰', reset:'7d',    xpReward:200,  reward:{ type:'keys',     amount:1, keyId:'key_common', emoji:'⭐', name:'Llave Superestrella' }, target:200, exclusive:null, category:'Semanales', categoryIcon:'📆', trackId:'shop_spent_weekly' },
  { id:'week_level5',   name:'Alcanza Nivel 5',         desc:'Llega al nivel 5 en este pase.',           emoji:'⬆️', reset:'7d',    xpReward:150,  reward:{ type:'copper',   amount:1 }, target:5,    exclusive:null, category:'Semanales',    categoryIcon:'📆', trackId:'pass_level' },
  { id:'week_level10',  name:'Alcanza Nivel 10',        desc:'Llega al nivel 10 en este pase.',          emoji:'🏆', reset:'7d',    xpReward:250,  reward:{ type:'emeralds', amount:2  }, target:10,   exclusive:null, category:'Semanales',    categoryIcon:'📆', trackId:'pass_level' },
  { id:'bi_buy600',     name:'Gasta 600 en la Tienda',  desc:'Gasta 600 ⟡ total.',                       emoji:'🏦', reset:'12d',   xpReward:300,  reward:{ type:'keys',     amount:1, keyId:'key_rare', emoji:'💫', name:'Llave Brillante' }, target:600, exclusive:null, category:'Bi-semanales', categoryIcon:'🗓️', trackId:'shop_spent_total' },
  { id:'bi_login12',    name:'Racha de 12 días',        desc:'Inicia sesión al menos 12 días.',          emoji:'📆', reset:'12d',   xpReward:280,  reward:{ type:'tickets',  amount:3, subtype:'classic' }, target:12, exclusive:null, category:'Bi-semanales', categoryIcon:'🗓️', trackId:'total_logins' },
  { id:'month_level30', name:'Alcanza Nivel 30',        desc:'Llega al nivel 30 del pase.',              emoji:'💎', reset:'24d',   xpReward:500,  reward:{ type:'keys',     amount:1, keyId:'key_epic', emoji:'🔮', name:'Llave Épica' }, target:30, exclusive:null, category:'Mensuales', categoryIcon:'📅', trackId:'pass_level' },
  { id:'month_buy1500', name:'Gasta 1500 en la Tienda', desc:'Gasta 1500 ⟡ este mes.',                   emoji:'💸', reset:'24d',   xpReward:600,  reward:{ type:'keys',     amount:1, keyId:'key_special', emoji:'✨', name:'Llave Especial' }, target:1500, exclusive:null, category:'Mensuales', categoryIcon:'📅', trackId:'shop_spent_monthly' },
  { id:'uniq_first',    name:'¡Primer Pase!',           desc:'Activa tu primer pase de temporada.',     emoji:'🎉', reset:'unique', xpReward:250,  reward:{ type:'emeralds', amount:2  }, target:1,    exclusive:null, category:'Únicas',       categoryIcon:'🌟' },
  { id:'uniq_level60',  name:'¡Pase Completo!',         desc:'Llega al nivel 60 del pase.',             emoji:'👑', reset:'unique', xpReward:1000, reward:{ type:'keys',     amount:1, keyId:'key_legendary', emoji:'👑', name:'Llave Legendaria' }, target:60, exclusive:null, category:'Únicas', categoryIcon:'🌟', trackId:'pass_level' },
  { id:'game_flowers',  name:'Cosecha de Flores',       desc:'Recoge 10 flores silvestres en el mundo.',emoji:'🌸', reset:'24h', xpReward:10000, reward:{ type:'emeralds', amount:2 }, target:10,  exclusive:null, category:'Misiones de Juego', categoryIcon:'🎮', isGame:true, preCompleted:true },
  { id:'game_wood',     name:'Tala de Madera',          desc:'Tala 20 bloques de madera en el bosque.', emoji:'🪵', reset:'24h', xpReward:200,   reward:{ type:'copper',   amount:2 }, target:20,  exclusive:null, category:'Misiones de Juego', categoryIcon:'🎮', isGame:true, preCompleted:true },
  { id:'game_fish',     name:'Gran Pescador',           desc:'Pesca 15 peces en el río o el lago.',     emoji:'🎣', reset:'24h', xpReward:220,   reward:{ type:'keys', keyId:'key_common', emoji:'⭐', name:'Llave Superestrella', amount:1 }, target:15, exclusive:null, category:'Misiones de Juego', categoryIcon:'🎮', isGame:true, preCompleted:true },
  { id:'game_craft',    name:'Maestro Artesano',        desc:'Crea 5 herramientas en la mesa de trabajo.',emoji:'⚒️',reset:'24h', xpReward:240,   reward:{ type:'copper',   amount:3 }, target:5,   exclusive:null, category:'Misiones de Juego', categoryIcon:'🎮', isGame:true, preCompleted:true },
  { id:'game_mine',     name:'Minero Experto',          desc:'Mina 30 bloques de piedra en las cavernas.',emoji:'⛏️',reset:'24h', xpReward:260,   reward:{ type:'emeralds', amount:2  }, target:30,  exclusive:null, category:'Misiones de Juego', categoryIcon:'🎮', isGame:true, preCompleted:true },
  { id:'game_mob',      name:'Cazador de Mobs',         desc:'Elimina 25 mobs hostiles en el mundo.',   emoji:'⚔️', reset:'24h', xpReward:300,   reward:{ type:'keys', keyId:'key_common', emoji:'⭐', name:'Llave Superestrella', amount:1 }, target:25, exclusive:null, category:'Misiones de Juego', categoryIcon:'🎮', isGame:true, preCompleted:true },
  { id:'game_build',    name:'Constructor',             desc:'Coloca 50 bloques para construir.',       emoji:'🏗️', reset:'24h', xpReward:280,   reward:{ type:'copper',   amount:2 }, target:50,  exclusive:null, category:'Misiones de Juego', categoryIcon:'🎮', isGame:true, preCompleted:true },
  { id:'game_explore',  name:'Explorador',              desc:'Explora 5 biomas distintos.',              emoji:'🗺️', reset:'24h', xpReward:320,   reward:{ type:'keys', keyId:'key_rare', emoji:'💫', name:'Llave Brillante', amount:1 }, target:5, exclusive:null, category:'Misiones de Juego', categoryIcon:'🎮', isGame:true, preCompleted:true },
  { id:'game_farm',     name:'Granjero',                desc:'Cosecha 30 cultivos de tu granja.',       emoji:'🌾', reset:'24h', xpReward:250,   reward:{ type:'copper',   amount:2 }, target:30,  exclusive:null, category:'Misiones de Juego', categoryIcon:'🎮', isGame:true, preCompleted:true },
  { id:'game_trade',    name:'Comerciante',             desc:'Realiza 8 intercambios con aldeanos.',    emoji:'🏪', reset:'24h', xpReward:290,   reward:{ type:'emeralds', amount:2  }, target:8,   exclusive:null, category:'Misiones de Juego', categoryIcon:'🎮', isGame:true, preCompleted:true },
  { id:'iron_bonus',    name:'Misión de Hierro I',      desc:'Exclusiva Hierro: Gasta 100 ⟡.',          emoji:'⬛', reset:'7d',  xpReward:200,   reward:{ type:'keys', keyId:'key_common', emoji:'⭐', name:'Llave Superestrella', amount:1 }, target:100,  exclusive:'iron',    category:'Exclusivas Hierro',    categoryIcon:'⬛', trackId:'shop_spent_weekly' },
  { id:'iron_bonus1',   name:'Misión de Hierro II',     desc:'Exclusiva Hierro: Gasta 200 ⟡.',          emoji:'⬛', reset:'7d',  xpReward:200,   reward:{ type:'keys', keyId:'key_common', emoji:'⭐', name:'Llave Superestrella', amount:2 }, target:200,  exclusive:'iron',    category:'Exclusivas Hierro',    categoryIcon:'⬛', trackId:'shop_spent_weekly' },
  { id:'iron_bonus2',   name:'Misión de Hierro III',    desc:'Exclusiva Hierro: Gasta 300 ⟡.',          emoji:'⬛', reset:'7d',  xpReward:200,   reward:{ type:'keys', keyId:'key_rare', emoji:'💫', name:'Llave Brillante', amount:1 },    target:300,  exclusive:'iron',    category:'Exclusivas Hierro',    categoryIcon:'⬛', trackId:'shop_spent_weekly' },
  { id:'iron_bonus3',   name:'Misión de Hierro IV',     desc:'Exclusiva Hierro: Gasta 2000 ⟡.',         emoji:'⬛', reset:'7d',  xpReward:300,   reward:{ type:'keys', keyId:'key_special', emoji:'✨', name:'Llave Especial', amount:1 },  target:2000, exclusive:'iron',    category:'Exclusivas Hierro',    categoryIcon:'⬛', trackId:'shop_spent_weekly' },
  { id:'gold_bonus',    name:'Misión de Oro I',         desc:'Exclusiva Oro: Alcanza nivel 20.',        emoji:'🟨', reset:'7d',  xpReward:280,   reward:{ type:'keys', keyId:'key_rare', emoji:'💫', name:'Llave Brillante', amount:1 },    target:20,   exclusive:'gold',    category:'Exclusivas Oro',       categoryIcon:'🟨', trackId:'pass_level' },
  { id:'gold_bonus1',   name:'Misión de Oro II',        desc:'Exclusiva Oro: Gasta 100 ⟡.',            emoji:'🟨', reset:'7d',  xpReward:280,   reward:{ type:'keys', keyId:'key_special', emoji:'✨', name:'Llave Especial', amount:1 },  target:100,  exclusive:'gold',    category:'Exclusivas Oro',       categoryIcon:'🟨', trackId:'shop_spent_weekly' },
  { id:'emerald_bonus', name:'Misión Esmeralda',        desc:'Exclusiva Esmeralda: 5 misiones semanales.',emoji:'🟩', reset:'7d', xpReward:380,  reward:{ type:'keys', keyId:'key_epic', emoji:'🔮', name:'Llave Épica', amount:1 },        target:5,    exclusive:'emerald', category:'Exclusivas Esmeralda', categoryIcon:'🟩', trackId:'weekly_missions' },
  { id:'diamond_bonus', name:'Misión Diamante',         desc:'Exclusiva Diamante: Alcanza nivel 50.',   emoji:'🔷', reset:'7d',  xpReward:550,   reward:{ type:'keys', keyId:'key_legendary', emoji:'👑', name:'Llave Legendaria', amount:1 }, target:50, exclusive:'diamond', category:'Exclusivas Diamante',  categoryIcon:'🔷', trackId:'pass_level' },
];

function getAllMissionsForPass(passId) {
  const st = getPassState(passId);
  const tier = st.tier || 'stone';
  const tierOrder = ['stone','iron','gold','emerald','diamond'];
  const tierIdx = tierOrder.indexOf(tier);
  const tierMissions = [];
  tierOrder.forEach((t, idx) => {
    if (idx <= tierIdx && PASS_TIER_GAME_MISSIONS[t]) {
      PASS_TIER_GAME_MISSIONS[t].forEach(m => {
        tierMissions.push({ ...m, isPassMission:true, reset:'24h', preCompleted:true });
      });
    }
  });
  return [...MISSIONS_TEMPLATE, ...tierMissions];
}

/* ═══════════════════════════════════════════════════════════
   RECOMPENSAS DE NIVEL — carril con Llaves Superestrella
═══════════════════════════════════════════════════════════ */
function makeDefaultLevels() {
  const levels = [];

  /* ── FILA GRATIS: recursos + llaves en hitos ── */
  const freeRewards = [
    { type:'xp',       emoji:'⭐', name:'XP Bonus',   amount:150 }, // 1
    { type:'copper',   emoji:'🪙', name:'Monedas',     amount:5 }, // 2
    { type:'xp',       emoji:'⭐', name:'XP Bonus',   amount:150 }, // 3
    { type:'copper',   emoji:'🪙', name:'Monedas',     amount:10 }, // 4
    { type:'emeralds', emoji:'💎', name:'Gemas',       amount:5  }, // 5
    { type:'xp',       emoji:'⭐', name:'XP Bonus',   amount:200 }, // 6
    { type:'copper',   emoji:'🪙', name:'Monedas',     amount:10 }, // 7
    { type:'xp',       emoji:'⭐', name:'XP Bonus',   amount:200 }, // 8
    { type:'copper',   emoji:'🪙', name:'Monedas',     amount:10 }, // 9
    { type:'keys',     emoji:'⭐', name:'Llave Superestrella',           amount:1, keyId:'key_common'  }, // 10 HITO
    { type:'xp',       emoji:'⭐', name:'XP Bonus',   amount:250 }, // 11
    { type:'copper',   emoji:'🪙', name:'Monedas',     amount:10 }, // 12
    { type:'xp',       emoji:'⭐', name:'XP Bonus',   amount:250 }, // 13
    { type:'copper',   emoji:'🪙', name:'Monedas',     amount:10 }, // 14
    { type:'emeralds', emoji:'💎', name:'Gemas',       amount:10  }, // 15
    { type:'xp',       emoji:'⭐', name:'XP Bonus',   amount:300 }, // 16
    { type:'copper',   emoji:'🪙', name:'Monedas',     amount:15 }, // 17
    { type:'xp',       emoji:'⭐', name:'XP Bonus',   amount:300 }, // 18
    { type:'copper',   emoji:'🪙', name:'Monedas',     amount:15 }, // 19
    { type:'keys',     emoji:'⭐', name:'Llave Superestrella x2',       amount:2, keyId:'key_common'  }, // 20 HITO
    { type:'xp',       emoji:'⭐', name:'XP Bonus',   amount:350 }, // 21
    { type:'copper',   emoji:'🪙', name:'Monedas',     amount:15 }, // 22
    { type:'xp',       emoji:'⭐', name:'XP Bonus',   amount:350 }, // 23
    { type:'copper',   emoji:'🪙', name:'Monedas',     amount:10 }, // 24
    { type:'emeralds', emoji:'💎', name:'Gemas',       amount:10  }, // 25
    { type:'xp',       emoji:'⭐', name:'XP Bonus',   amount:400 }, // 26
    { type:'copper',   emoji:'🪙', name:'Monedas',     amount:10 }, // 27
    { type:'xp',       emoji:'⭐', name:'XP Bonus',   amount:400 }, // 28
    { type:'copper',   emoji:'🪙', name:'Monedas',     amount:15 }, // 29
    { type:'keys',     emoji:'💫', name:'Llave Superestrella Brillante',amount:1, keyId:'key_rare'    }, // 30 HITO
    { type:'xp',       emoji:'⭐', name:'XP Bonus',   amount:450 }, // 31
    { type:'copper',   emoji:'🪙', name:'Monedas',     amount:15 }, // 32
    { type:'xp',       emoji:'⭐', name:'XP Bonus',   amount:450 }, // 33
    { type:'copper',   emoji:'🪙', name:'Monedas',     amount:10 }, // 34
    { type:'emeralds', emoji:'💎', name:'Gemas',       amount:10  }, // 35
    { type:'xp',       emoji:'⭐', name:'XP Bonus',   amount:500 }, // 36
    { type:'copper',   emoji:'🪙', name:'Monedas',     amount:10 }, // 37
    { type:'xp',       emoji:'⭐', name:'XP Bonus',   amount:500 }, // 38
    { type:'copper',   emoji:'🪙', name:'Monedas',     amount:10 }, // 39
    { type:'keys',     emoji:'💫', name:'Llave Superestrella Brillante',amount:2, keyId:'key_rare'    }, // 40 HITO
    { type:'xp',       emoji:'⭐', name:'XP Bonus',   amount:550 }, // 41
    { type:'copper',   emoji:'🪙', name:'Monedas',     amount:10 }, // 42
    { type:'xp',       emoji:'⭐', name:'XP Bonus',   amount:550 }, // 43
    { type:'copper',   emoji:'🪙', name:'Monedas',     amount:10 }, // 44
    { type:'emeralds', emoji:'💎', name:'Gemas',       amount:10 }, // 45
    { type:'xp',       emoji:'⭐', name:'XP Bonus',   amount:600 }, // 46
    { type:'copper',   emoji:'🪙', name:'Monedas',     amount:10 }, // 47
    { type:'xp',       emoji:'⭐', name:'XP Bonus',   amount:600 }, // 48
    { type:'copper',   emoji:'🪙', name:'Monedas',     amount:10 }, // 49
    { type:'keys',     emoji:'✨', name:'Llave Superestrella Especial', amount:1, keyId:'key_special' }, // 50 HITO
    { type:'xp',       emoji:'⭐', name:'XP Bonus',   amount:700 }, // 51
    { type:'copper',   emoji:'🪙', name:'Monedas',     amount:10 }, // 52
    { type:'xp',       emoji:'⭐', name:'XP Bonus',   amount:700 }, // 53
    { type:'copper',   emoji:'🪙', name:'Monedas',     amount:10 }, // 54
    { type:'emeralds', emoji:'💎', name:'Gemas',       amount:10 }, // 55
    { type:'xp',       emoji:'⭐', name:'XP Bonus',   amount:800 }, // 56
    { type:'copper',   emoji:'🪙', name:'Monedas',     amount:20 }, // 57
    { type:'xp',       emoji:'⭐', name:'XP Bonus',   amount:800 }, // 58
    { type:'copper',   emoji:'🪙', name:'Monedas',     amount:20 }, // 59
    { type:'keys',     emoji:'✨', name:'Llave Superestrella Especial x2',amount:2,keyId:'key_special'}, // 60 HITO FINAL
  ];

  /* ── FILA PAGADA: llaves Superestrella por nivel ── */
  const paidRewards = [
    { type:'keys',     emoji:'⭐', name:'Llave Superestrella',           amount:3, keyId:'key_common'  }, // 1
    { type:'copper',   emoji:'🪙', name:'Monedas',                       amount:10 },                    // 2
    { type:'keys',     emoji:'⭐', name:'Llave Superestrella',           amount:3, keyId:'key_common'  }, // 3
    { type:'boost',    emoji:'⚡', name:'Boost XP 1h',                  amount:1, boostHours:1, boostMultiplier:1.5 }, // 4
    { type:'keys',     emoji:'⭐', name:'Llave Superestrella x2',        amount:2, keyId:'key_common'  }, // 5
    { type:'copper',   emoji:'🪙', name:'Monedas',                       amount:10 },                    // 6
    { type:'keys',     emoji:'⭐', name:'Llave Superestrella',           amount:1, keyId:'key_common'  }, // 7
    { type:'emeralds', emoji:'💎', name:'Gemas',                         amount:10 },                     // 8
    { type:'keys',     emoji:'⭐', name:'Llave Superestrella x2',        amount:2, keyId:'key_common'  }, // 9
    { type:'keys',     emoji:'💫', name:'Llave Superestrella Brillante', amount:1, keyId:'key_rare'    }, // 10 HITO
    { type:'copper',   emoji:'🪙', name:'Monedas',                       amount:10 },                    // 11
    { type:'keys',     emoji:'⭐', name:'Llave Superestrella x2',        amount:2, keyId:'key_common'  }, // 12
    { type:'boost',    emoji:'⚡', name:'Boost XP 2h',                  amount:2, boostHours:2, boostMultiplier:1.5 }, // 13
    { type:'keys',     emoji:'💫', name:'Llave Superestrella Brillante', amount:3, keyId:'key_rare'    }, // 14
    { type:'keys',     emoji:'⭐', name:'Llave Superestrella x3',        amount:3, keyId:'key_common'  }, // 15
    { type:'copper',   emoji:'🪙', name:'Monedas',                       amount:10 },                    // 16
    { type:'keys',     emoji:'💫', name:'Llave Superestrella Brillante', amount:1, keyId:'key_rare'    }, // 17
    { type:'emeralds', emoji:'💎', name:'Gemas',                         amount:10 },                     // 18
    { type:'keys',     emoji:'⭐', name:'Llave Superestrella x2',        amount:2, keyId:'key_common'  }, // 19
    { type:'keys',     emoji:'✨', name:'Llave Superestrella Especial',  amount:1, keyId:'key_special' }, // 20 HITO
    { type:'copper',   emoji:'🪙', name:'Monedas',                       amount:10 },                    // 21
    { type:'keys',     emoji:'💫', name:'Llave Superestrella Brillante', amount:4, keyId:'key_rare'    }, // 22
    { type:'boost',    emoji:'⚡', name:'Boost XP 4h',                  amount:1, boostHours:4, boostMultiplier:1.75 }, // 23
    { type:'keys',     emoji:'✨', name:'Llave Superestrella Especial',  amount:1, keyId:'key_special' }, // 24
    { type:'keys',     emoji:'💫', name:'Llave Superestrella Brillante', amount:2, keyId:'key_rare'    }, // 25
    { type:'copper',   emoji:'🪙', name:'Monedas',                       amount:10 },                    // 26
    { type:'keys',     emoji:'✨', name:'Llave Superestrella Especial',  amount:1, keyId:'key_special' }, // 27
    { type:'emeralds', emoji:'💎', name:'Gemas',                         amount:10 },                     // 28
    { type:'keys',     emoji:'💫', name:'Llave Superestrella Brillante', amount:2, keyId:'key_rare'    }, // 29
    { type:'keys',     emoji:'🔮', name:'Llave Superestrella Épica',     amount:1, keyId:'key_epic'    }, // 30 HITO
    { type:'copper',   emoji:'🪙', name:'Monedas',                       amount:10 },                    // 31
    { type:'keys',     emoji:'✨', name:'Llave Superestrella Especial',  amount:2, keyId:'key_special' }, // 32
    { type:'boost',    emoji:'⚡', name:'Boost XP 8h',                  amount:1, boostHours:8, boostMultiplier:1.75 }, // 33
    { type:'keys',     emoji:'🔮', name:'Llave Superestrella Épica',     amount:1, keyId:'key_epic'    }, // 34
    { type:'keys',     emoji:'✨', name:'Llave Superestrella Especial',  amount:2, keyId:'key_special' }, // 35
    { type:'copper',   emoji:'🪙', name:'Monedas',                       amount:10 },                    // 36
    { type:'keys',     emoji:'🔮', name:'Llave Superestrella Épica',     amount:1, keyId:'key_epic'    }, // 37
    { type:'emeralds', emoji:'💎', name:'Gemas',                         amount:10 },                    // 38
    { type:'keys',     emoji:'✨', name:'Llave Superestrella Especial',  amount:2, keyId:'key_special' }, // 39
    { type:'keys',     emoji:'🔮', name:'Llave Superestrella Épica',     amount:2, keyId:'key_epic'    }, // 40 HITO
    { type:'copper',   emoji:'🪙', name:'Monedas',                       amount:10 },                    // 41
    { type:'keys',     emoji:'🔮', name:'Llave Superestrella Épica',     amount:1, keyId:'key_epic'    }, // 42
    { type:'boost',    emoji:'⚡', name:'Boost XP 12h',                 amount:1, boostHours:12, boostMultiplier:2.0 }, // 43
    { type:'keys',     emoji:'🔮', name:'Llave Superestrella Épica',     amount:2, keyId:'key_epic'    }, // 44
    { type:'keys',     emoji:'✨', name:'Llave Superestrella Especial',  amount:3, keyId:'key_special' }, // 45
    { type:'copper',   emoji:'🪙', name:'Monedas',                       amount:10 },                    // 46
    { type:'keys',     emoji:'🔮', name:'Llave Superestrella Épica',     amount:2, keyId:'key_epic'    }, // 47
    { type:'emeralds', emoji:'💎', name:'Gemas',                         amount:10 },                    // 48
    { type:'keys',     emoji:'🔮', name:'Llave Superestrella Épica',     amount:2, keyId:'key_epic'    }, // 49
    { type:'keys',     emoji:'👑', name:'Llave Superestrella Legendaria',amount:1, keyId:'key_legendary'}, // 50 HITO
    { type:'copper',   emoji:'🪙', name:'Monedas',                       amount:10 },                    // 51
    { type:'keys',     emoji:'🔮', name:'Llave Superestrella Épica',     amount:2, keyId:'key_epic'    }, // 52
    { type:'boost',    emoji:'⚡', name:'Boost XP 24h',                 amount:1, boostHours:24, boostMultiplier:2.0 }, // 53
    { type:'keys',     emoji:'👑', name:'Llave Superestrella Legendaria',amount:1, keyId:'key_legendary'}, // 54
    { type:'keys',     emoji:'🔮', name:'Llave Superestrella Épica',     amount:3, keyId:'key_epic'    }, // 55
    { type:'copper',   emoji:'🪙', name:'Monedas',                       amount:10 },                   // 56
    { type:'keys',     emoji:'👑', name:'Llave Superestrella Legendaria',amount:1, keyId:'key_legendary'}, // 57
    { type:'emeralds', emoji:'💎', name:'Gemas',                         amount:20 },                    // 58
    { type:'keys',     emoji:'👑', name:'Llave Superestrella Legendaria',amount:3, keyId:'key_legendary'}, // 59
    { type:'keys',     emoji:'👑', name:'¡Llave Legendaria x3!',         amount:6, keyId:'key_legendary'}, // 60 HITO FINAL
  ];

  for (let i = 0; i < MAX_LEVELS; i++) {
    levels.push({ free: freeRewards[i] || freeRewards[0], paid: paidRewards[i] || paidRewards[0] });
  }
  return levels;
}

/* ═══════════════════════════════════════════════════════════
   DEFINICIÓN DE PASES
═══════════════════════════════════════════════════════════ */
const PASSES = [
  {
    id:'pass_s1', name:'Reino del Hielo Eterno', season:'Temporada I', emoji:'❄️',
    description:'El reino helado despierta. Recompensas de invierno y más.',
    startDate:'2026-01-01', endDate:'2026-01-31', music:'music/8.mp3', bg:'img-pass/banwar.jpg', shopItemId:'s1',
    levels: (() => {
      const ls = makeDefaultLevels();
      ls[9].paid  = { type:'keys', emoji:'❄️', name:'Llave Hielo',          amount:1, keyId:'key_common'   };
      ls[19].paid = { type:'keys', emoji:'💫', name:'Llave Brillante x2',   amount:2, keyId:'key_rare'     };
      ls[29].paid = { type:'keys', emoji:'✨', name:'Llave Especial',       amount:1, keyId:'key_special'  };
      ls[39].paid = { type:'keys', emoji:'🔮', name:'Llave Épica x2',       amount:2, keyId:'key_epic'     };
      ls[49].paid = { type:'keys', emoji:'👑', name:'Llave Legendaria',     amount:1, keyId:'key_legendary'};
      ls[59].free = { type:'emeralds', emoji:'💎', name:'Gemas Especiales', amount:750 };
      ls[59].paid = { type:'keys', emoji:'👑', name:'¡Llave Legendaria x3!',amount:3, keyId:'key_legendary'};
      return ls;
    })(),
  },
  {
    id:'pass_s2', name:'Corazones de Redstone', season:'Temporada II', emoji:'💕',
    description:'El amor florece entre circuitos y redstone. ¡Romántico!',
    startDate:'2026-02-01', endDate:'2026-02-28', music:'music/1234.mp3', bg:'img-pass/banhall.jpg', shopItemId:'s2',
    levels: (() => {
      const ls = makeDefaultLevels();
      ls[4].paid  = { type:'keys', emoji:'💗', name:'Llave Corazón x2',    amount:2, keyId:'key_valentine' };
      ls[9].paid  = { type:'keys', emoji:'💗', name:'Llave Corazón',       amount:1, keyId:'key_valentine' };
      ls[19].paid = { type:'keys', emoji:'💗', name:'Llave Corazón x3',    amount:3, keyId:'key_valentine' };
      ls[29].paid = { type:'keys', emoji:'✨', name:'Llave Especial',      amount:1, keyId:'key_special'  };
      ls[39].paid = { type:'keys', emoji:'🔮', name:'Llave Épica',         amount:1, keyId:'key_epic'     };
      ls[49].paid = { type:'keys', emoji:'👑', name:'Llave Legendaria',    amount:1, keyId:'key_legendary'};
      ls[59].paid = { type:'keys', emoji:'👑', name:'¡Llave Legendaria x3!',amount:3,keyId:'key_legendary'};
      return ls;
    })(),
  },
  { id:'pass_s3',  name:'Despertar de la Naturaleza', season:'Temporada III',  emoji:'🌿', description:'La naturaleza renace con poder ancestral.', startDate:'2026-03-01', endDate:'2026-03-31', music:'music/8.mp3', bg:'img-pass/partymine.jpg', shopItemId:'s3', levels:makeDefaultLevels() },
  { id:'pass_s4',  name:'Cántico de la Lluvia Plateada', season:'Temporada IV', emoji:'🌧️', description:'La lluvia plateada trae secretos del mundo antiguo.', startDate:'2026-04-01', endDate:'2026-04-30', music:'music/8.mp3', bg:'img-pass/chrismine.jpg', shopItemId:'s4', levels:makeDefaultLevels() },
  { id:'pass_s5',  name:'Esencia de la Aurora', season:'Temporada V',          emoji:'🌅', description:'La aurora ilumina el camino hacia nuevas conquistas.', startDate:'2026-05-01', endDate:'2026-05-31', music:'music/8.mp3', bg:'img-pass/añomine.jpg', shopItemId:'s5', levels:makeDefaultLevels() },
  { id:'pass_s6',  name:'Imperio del Océano Profundo', season:'Temporada VI',  emoji:'🌊', description:'Las profundidades del océano guardan tesoros sin igual.', startDate:'2026-06-01', endDate:'2026-06-30', music:'music/8.mp3', bg:'img-pass/banair.jpg', shopItemId:'s6', levels:makeDefaultLevels() },
  //{ id:'pass_s7',  name:'Reinos Dorados', season:'Temporada VII',              emoji:'👑', description:'El oro fluye por los reinos del verano ardiente.', startDate:'2026-07-01', endDate:'2026-07-31', music:'music/8.mp3', bg:'img-pass/dancingmine.jpg', shopItemId:'s7', levels:makeDefaultLevels() },
  //{ id:'pass_s8',  name:'Sombras de la Noche', season:'Temporada VIII',        emoji:'🌙', description:'Las sombras nocturnas revelan poder oscuro y misterioso.', startDate:'2026-08-01', endDate:'2026-08-31', music:'music/8.mp3', bg:'img-pass/squemine.jpg', shopItemId:'s8', levels:makeDefaultLevels() },
  //{ id:'pass_s9',  name:'Mundo Encantado', season:'Temporada IX',              emoji:'✨', description:'La magia recorre cada rincón de Moonveil.', startDate:'2026-09-01', endDate:'2026-09-30', music:'music/8.mp3', bg:'img-pass/squemine.jpg', shopItemId:'s9', levels:makeDefaultLevels() },
  /*{
    id:'pass_s10', name:'Pesadilla del Nether', season:'Temporada X', emoji:'🔥',
    description:'El Nether se despierta y sus pesadillas cobran vida.', startDate:'2026-10-01', endDate:'2026-10-31', music:'music/8.mp3', bg:'img-pass/banhall.jpg', shopItemId:'s10',
    levels: (() => {
      const ls = makeDefaultLevels();
      ls[4].paid  = { type:'keys', emoji:'🎃', name:'Llave Halloween',    amount:1, keyId:'key_halloween'};
      ls[9].paid  = { type:'keys', emoji:'🎃', name:'Llave Halloween x2', amount:2, keyId:'key_halloween'};
      ls[19].paid = { type:'keys', emoji:'✨', name:'Llave Especial',     amount:1, keyId:'key_special' };
      ls[29].paid = { type:'keys', emoji:'🔮', name:'Llave Épica',        amount:1, keyId:'key_epic'    };
      ls[59].paid = { type:'keys', emoji:'👑', name:'¡Llave Legendaria x3!',amount:3,keyId:'key_legendary'};
      return ls;
    })(),
  },
  { id:'pass_s11', name:'Guardianes del Invierno', season:'Temporada XI', emoji:'🛡️', description:'Los guardianes protegen el reino del frío eterno.', startDate:'2026-11-01', endDate:'2026-11-30', music:'music/8.mp3', bg:'img-pass/squemine.jpg', shopItemId:'s11', levels:makeDefaultLevels() },
  {
    id:'pass_s12', name:'Estrella de Ender', season:'Temporada XII', emoji:'⭐',
    description:'La Estrella de Ender brilla en la oscuridad del fin del año.', startDate:'2026-12-01', endDate:'2026-12-31', music:'music/8.mp3', bg:'img-pass/chrismine.jpg', shopItemId:'s12',
    levels: (() => {
      const ls = makeDefaultLevels();
      ls[4].paid  = { type:'keys', emoji:'🎄', name:'Llave Navideña',     amount:1, keyId:'key_christmas'};
      ls[9].paid  = { type:'keys', emoji:'🎄', name:'Llave Navideña x2',  amount:2, keyId:'key_christmas'};
      ls[19].paid = { type:'keys', emoji:'✨', name:'Llave Especial',     amount:1, keyId:'key_special' };
      ls[29].paid = { type:'keys', emoji:'🔮', name:'Llave Épica',        amount:1, keyId:'key_epic'    };
      ls[39].paid = { type:'keys', emoji:'👑', name:'Llave Legendaria x2',amount:2, keyId:'key_legendary'};
      ls[59].free = { type:'emeralds', emoji:'💎', name:'Gemas Especiales', amount:1000 };
      ls[59].paid = { type:'keys', emoji:'👑', name:'¡Llave Legendaria x3!',amount:3,keyId:'key_legendary'};
      return ls;
    })(),
  },*/
];

/* ═══════════════════════════════════════════════════════════
   MEJORAS DE TIER
   ★ CADENA: Stone → Iron → Gold → Emerald → Diamond
═══════════════════════════════════════════════════════════ */
const TIER_UPGRADES = [
  {
    id:'stone', name:'Pase Piedra', subtitle:'Novato — Gratis', emoji:'⬜', tierClass:'stone',
    desc:'El pase base, completamente gratis. Accede a recompensas gratis en los 60 niveles y a las misiones de juego.',
    price: 0, isFree: true,
    features:['Recompensas gratis en los 60 niveles','Llaves Superestrella en hitos','Misiones diarias y semanales','Misiones de juego desbloqueadas','Inventario global y buzón'],
  },
  {
    id:'iron', name:'Pase Hierro', subtitle:'Aprendiz', emoji:'⬛', tierClass:'iron',
    desc:'Desbloquea las recompensas PAID (Llaves Superestrella) de todos los niveles. Necesario para desbloquear Oro.',
    price:128, requiresShopPurchase:true, requiresPrev:null,
    features:['Todo lo de Piedra','Llaves Superestrella en los 60 niveles','Misiones exclusivas de Hierro','Monedas adicionales en misiones'],
  },
  {
    id:'gold', name:'Pase Oro', subtitle:'Oficial', emoji:'🟨', tierClass:'gold',
    desc:'×1.5 llaves en recompensas. Requiere Pase Hierro primero. Necesario para Esmeralda.',
    price:256, requiresPrev:'iron',
    features:['Todo lo de Hierro','×1.5 en cantidad de llaves','Misiones exclusivas de Oro','Cofres con mejor tasa de drop'],
  },
  {
    id:'emerald', name:'Pase Esmeralda', subtitle:'Experto', emoji:'🟩', tierClass:'emerald',
    desc:'Llaves épicas y legendarias adicionales. Requiere Pase Oro primero. Necesario para Diamante.',
    price:384, requiresPrev:'gold',
    features:['Todo lo de Oro','Llaves Épicas en hitos especiales','Misiones exclusivas Esmeralda','XP de misiones ×1.25'],
  },
  {
    id:'diamond', name:'Pase Diamante', subtitle:'Maestro', emoji:'🔷', tierClass:'diamond',
    desc:'×2 en TODAS las recompensas y llaves legendarias garantizadas. Requiere Pase Esmeralda primero.',
    price:512, requiresPrev:'emerald',
    features:['Todo lo anterior','×2 en TODAS las llaves y recompensas','Llaves Legendarias en hitos','¡Llave Legendaria x3 garantizada en Nv.60!','Boost XP permanente ×1.5'],
  },
];

/* ═══════════════════════════════════════════════════════════
   PERSISTENCIA
═══════════════════════════════════════════════════════════ */
function getPassState(passId) {
  const defaults = {
    tier: 'stone', xp: 0, level: 1, claimedLevels: [],
    inventory: {}, missions: {}, shopBought: false,
    overflowXP: 0, overflowRewardIdx: 0,
    stats: { totalSpent:0, shopSpentDaily:0, shopSpentWeekly:0, shopSpentMonthly:0, shopSpentTotal:0, loginStreak:0, totalLogins:0, lastLoginDate:null, weeklyMissionsDone:0 },
  };
  try { const raw = localStorage.getItem(`mv_pass_${passId}`); return raw ? { ...defaults, ...JSON.parse(raw) } : defaults; }
  catch { return defaults; }
}
function savePassState(passId, state) {
  try { localStorage.setItem(`mv_pass_${passId}`, JSON.stringify(state)); } catch(e) {}
}
function getGlobalInventory() {
  try { const raw = localStorage.getItem(GLOBAL_INV); return raw ? JSON.parse(raw) : {}; }
  catch { return {}; }
}
function saveGlobalInventory(inv) {
  try { localStorage.setItem(GLOBAL_INV, JSON.stringify(inv)); } catch(e) {}
}
function addToInventory(passId, passName, itemKey, emoji, name, amount) {
  const st = getPassState(passId);
  if (!st.inventory[itemKey]) st.inventory[itemKey] = { count: 0, emoji, name };
  st.inventory[itemKey].count += amount;
  savePassState(passId, st);
  const globalKey = `${passName}::${itemKey}`;
  const glob = getGlobalInventory();
  if (!glob[globalKey]) glob[globalKey] = { count: 0, emoji, name, passName };
  glob[globalKey].count += amount;
  saveGlobalInventory(glob);
}

/* ─── Llaves de cofres (compatible con chest.js) ─── */
function awardChestKey(keyId, amount) {
  try {
    const raw = localStorage.getItem(CHEST_KEYS_LS);
    const keys = raw ? JSON.parse(raw) : {};
    keys[keyId] = (keys[keyId] || 0) + amount;
    localStorage.setItem(CHEST_KEYS_LS, JSON.stringify(keys));
  } catch(e) {}
}
function awardTicket(subtype, amount) {
  try {
    const key = `${TICKETS_BASE}${subtype || 'classic'}`;
    const cur = parseInt(localStorage.getItem(key) || '0', 10);
    localStorage.setItem(key, String(cur + amount));
  } catch(e) {}
}

/* ═══════════════════════════════════════════════════════════
   SISTEMA DE BOOSTS — funcional con temporizador
═══════════════════════════════════════════════════════════ */
function getActiveBoosts() {
  try { const raw = localStorage.getItem(PASS_BOOSTS_LS); return raw ? JSON.parse(raw) : []; }
  catch { return []; }
}
function saveActiveBoosts(boosts) {
  try { localStorage.setItem(PASS_BOOSTS_LS, JSON.stringify(boosts)); } catch(e) {}
}
function cleanExpiredBoosts() {
  const boosts = getActiveBoosts().filter(b => b.expiry > now());
  saveActiveBoosts(boosts);
}
function getBoostMultiplier() {
  cleanExpiredBoosts();
  const boosts = getActiveBoosts();
  if (!boosts.length) return 1;
  return Math.max(...boosts.map(b => b.multiplier));
}
function getTopBoost() {
  cleanExpiredBoosts();
  const boosts = getActiveBoosts();
  if (!boosts.length) return null;
  return boosts.sort((a,b) => b.multiplier - a.multiplier)[0];
}
function activateBoost(passId, hours, multiplier, label) {
  const boosts = getActiveBoosts();
  const expiry = now() + hours * H1;
  boosts.push({ multiplier, expiry, label: label || `Boost XP ×${multiplier}`, passId });
  saveActiveBoosts(boosts);
  toast(`⚡ ${label || `Boost ×${multiplier}`} activado por ${hours}h!`);
  updateHUD(passId || activePassId);
  startBoostTimer();
}

let boostTimerInterval = null;
function startBoostTimer() {
  if (boostTimerInterval) return;
  boostTimerInterval = setInterval(() => {
    cleanExpiredBoosts();
    if (activePassId) updateHUD(activePassId);
    if (!getActiveBoosts().length) {
      clearInterval(boostTimerInterval);
      boostTimerInterval = null;
    }
  }, 1000);
}

/* ═══════════════════════════════════════════════════════════
   BUZÓN DE PASES
═══════════════════════════════════════════════════════════ */
function getPassMailClaimed() {
  try { const raw = localStorage.getItem(PASS_MAIL_LS); return raw ? JSON.parse(raw) : []; }
  catch { return []; }
}
function savePassMailClaimed(list) {
  try { localStorage.setItem(PASS_MAIL_LS, JSON.stringify(list)); } catch(e) {}
}

function renderPassMailbox() {
  const container = $('#passMailboxList');
  if (!container) return;
  const claimed = getPassMailClaimed();
  const unread = PASS_MAIL_ITEMS.filter(m => !claimed.includes(m.id)).length;
  const badge = $('#mailboxBadgePases');
  if (badge) { badge.textContent = unread; badge.style.display = unread > 0 ? 'flex' : 'none'; }

  container.innerHTML = PASS_MAIL_ITEMS.map(item => {
    const isClaimed = claimed.includes(item.id);
    const rewardsHtml = item.rewards.map(r => {
      if (r.type === 'boost') return `<span class="pmail-reward-tag boost-tag">⚡ ${r.name} ×${r.boostMultiplier}</span>`;
      return `<span class="pmail-reward-tag" style="color:${REWARD_TYPES[r.type]?.color||'#a5b4fc'};">${r.emoji || REWARD_TYPES[r.type]?.emoji||'🎁'} ${r.name} ×${r.amount||1}</span>`;
    }).join('');
    return `<div class="pmail-item ${isClaimed ? 'pmail-claimed' : 'pmail-unread'}">
      <div class="pmail-icon">${item.emoji}</div>
      <div class="pmail-body">
        <div class="pmail-title">${esc(item.title)}</div>
        <div class="pmail-sender">De: ${esc(item.sender)}</div>
        <div class="pmail-msg">${esc(item.msg)}</div>
        <div class="pmail-rewards">${rewardsHtml}</div>
      </div>
      <div class="pmail-action">
        ${isClaimed
          ? '<span class="pmail-claimed-tag">✅ Reclamado</span>'
          : `<button class="mc-claim-btn" onclick="claimPassMail('${item.id}')">🎁 Reclamar</button>`
        }
      </div>
    </div>`;
  }).join('');
}

function claimPassMail(mailId) {
  if (!activePassId) { toast('⚠️ Selecciona un pase primero'); return; }
  const item = PASS_MAIL_ITEMS.find(m => m.id === mailId);
  if (!item) return;
  const claimed = getPassMailClaimed();
  if (claimed.includes(mailId)) { toast('Ya reclamaste este mensaje'); return; }

  const pass = PASSES.find(p => p.id === activePassId);
  claimed.push(mailId);
  savePassMailClaimed(claimed);

  item.rewards.forEach(r => {
    switch(r.type) {
      case 'xp':
        addXP(activePassId, r.amount || 0);
        addToInventory(activePassId, pass.name, 'xp_mail', '⭐', 'XP Bonus', r.amount||0);
        break;
      case 'keys':
        awardChestKey(r.keyId, r.amount || 1);
        addToInventory(activePassId, pass.name, `key_${r.keyId}`, r.emoji||'🔑', r.name||'Llave', r.amount||1);
        toast(`✨ Recibido: ${r.emoji} ${r.name} ×${r.amount}`);
        break;
      case 'boost':
        activateBoost(activePassId, r.boostHours || 1, r.boostMultiplier || 1.5, r.name);
        break;
      case 'emeralds':
        addToInventory(activePassId, pass.name, 'emeralds', '💎', 'Gemas', r.amount||0);
        toast(`💎 Recibido: ${r.amount} Gemas`);
        break;
      case 'copper':
        addToInventory(activePassId, pass.name, 'copper', '🪙', 'Monedas', r.amount||0);
        toast(`🪙 Recibido: ${r.amount} Monedas`);
        break;
    }
  });

  toast(`📬 ¡Mensaje reclamado: ${item.title}!`);
  renderPassMailbox();
  renderPassHeader(activePassId);
  renderInventory(activePassId);
  updateHUD(activePassId);
}

/* ═══════════════════════════════════════════════════════════
   PROCESAR RECOMPENSA — ahora con llaves de cofres funcionales y boosts
═══════════════════════════════════════════════════════════ */
function processReward(passId, passName, reward, multiplier = 1) {
  const amt = Math.round((reward.amount || 1) * multiplier);
  const r = { ...reward, amount: amt };

  switch (r.type) {
    case 'xp':
      addXP(passId, amt);
      addToInventory(passId, passName, 'xp', '⭐', 'XP Bonus', amt);
      break;
    case 'emeralds':
      addToInventory(passId, passName, 'emeralds', '💎', 'Gemas', amt);
      break;
    case 'keys': {
      const keyId = r.keyId || SUBTYPE_TO_CHEST_KEY[r.subtype] || 'key_common';
      awardChestKey(keyId, amt);
      addToInventory(passId, passName, `key_${keyId}`, r.emoji || '🔑', r.name || 'Llave Superestrella', amt);
      break;
    }
    case 'tickets':
      awardTicket(r.subtype || 'classic', amt);
      addToInventory(passId, passName, `ticket_${r.subtype||'classic'}`, '🎫', r.name || 'Ticket', amt);
      break;
    case 'copper':
      addToInventory(passId, passName, 'copper', '🪙', 'Monedas', amt);
      break;
    case 'chest':
      awardChestKey('key_common', amt);
      addToInventory(passId, passName, 'key_common', '⭐', 'Llave Superestrella', amt);
      break;
    case 'skin':
      addToInventory(passId, passName, `skin_${Date.now()}`, '🎨', r.name || 'Skin', 1);
      break;
    case 'pet':
      addToInventory(passId, passName, `pet_${Date.now()}`, '🐾', r.name || 'Mascota', 1);
      break;
    case 'title':
      addToInventory(passId, passName, `title_${Date.now()}`, '📜', r.name || 'Título', 1);
      break;
    case 'banner':
      addToInventory(passId, passName, `banner_${Date.now()}`, '🏳️', r.name || 'Estandarte', 1);
      break;
    case 'trail':
      addToInventory(passId, passName, `trail_${Date.now()}`, '✨', r.name || 'Estela', 1);
      break;
    case 'boost': {
      const hours = r.boostHours || 1;
      const bMult = r.boostMultiplier || 1.5;
      activateBoost(passId, hours, bMult, r.name || `Boost XP ${hours}h`);
      addToInventory(passId, passName, `boost_${Date.now()}`, '⚡', r.name || 'Boost XP', 1);
      break;
    }
    case 'random': {
      const options = [
        { type:'keys', emoji:'⭐', name:'Llave Superestrella x3',        amount:3, keyId:'key_common'   },
        { type:'emeralds', emoji:'💎', name:'Gemas',                      amount:100 },
        { type:'keys', emoji:'💫', name:'Llave Brillante x2',            amount:2, keyId:'key_rare'     },
        { type:'copper', emoji:'🪙', name:'Monedas',                      amount:500 },
        { type:'keys', emoji:'✨', name:'Llave Especial',                amount:1, keyId:'key_special'  },
        { type:'keys', emoji:'👑', name:'Llave Legendaria',              amount:1, keyId:'key_legendary'},
      ];
      const chosen = options[Math.floor(Math.random() * options.length)];
      processReward(passId, passName, chosen);
      toast(`🎁 Sorpresa: ${chosen.emoji} ${chosen.name} ×${chosen.amount}`);
      break;
    }
  }
}

/* ═══════════════════════════════════════════════════════════
   XP / NIVELES CON OVERFLOW — aplica boost multiplicador
═══════════════════════════════════════════════════════════ */
function addXP(passId, baseAmount) {
  const boostMult = getBoostMultiplier();
  const amount = Math.round(baseAmount * boostMult);
  if (boostMult > 1) toast(`⚡ Boost ×${boostMult} → +${amount} XP (base: ${baseAmount})`);

  const st = getPassState(passId);
  st.xp = (st.xp || 0) + amount;

  while (st.level < MAX_LEVELS) {
    const xpNeeded = st.level * XP_PER_LEVEL;
    if (st.xp >= xpNeeded) {
      st.xp -= xpNeeded;
      st.level = (st.level || 1) + 1;
      toast(`⬆️ ¡Subiste al nivel ${st.level} del pase!`);
      if (st.level >= MAX_LEVELS) toast('🏆 ¡Nivel Máximo 60! El XP ahora da Llaves Superestrella especiales.');
    } else break;
  }

  if (st.level >= MAX_LEVELS) {
    st.overflowXP = (st.overflowXP || 0) + st.xp;
    st.xp = 0;
    const pass = PASSES.find(p => p.id === passId);
    const overflowRewards = getOverflowRewardsForPass(pass, st.tier);
    let rewardsGiven = 0;
    while (st.overflowXP >= OVERFLOW_XP_PER_REWARD) {
      st.overflowXP -= OVERFLOW_XP_PER_REWARD;
      const idx = (st.overflowRewardIdx || 0) % overflowRewards.length;
      st.overflowRewardIdx = idx + 1;
      const reward = overflowRewards[idx];
      const mult = st.tier === 'gold' ? 1.5 : st.tier === 'diamond' ? 2 : 1;
      processReward(passId, pass ? pass.name : passId, reward, mult);
      rewardsGiven++;
      if (rewardsGiven <= 3) toast(`🌟 Overflow: ${reward.emoji} ${reward.name} ×${Math.round(reward.amount * mult)}`);
    }
  }
  savePassState(passId, st);
}

function getXPForLevel(level) { return level * XP_PER_LEVEL; }

function getPassStatus(pass) {
  const nowMs   = now();
  const startMs = new Date(pass.startDate + 'T00:00:00').getTime();
  const endMs   = new Date(pass.endDate + 'T23:59:59').getTime();
  if (nowMs < startMs) return 'upcoming';
  if (nowMs > endMs) return 'ended';
  return 'active';
}

/* ═══════════════════════════════════════════════════════════
   UI PRINCIPAL
═══════════════════════════════════════════════════════════ */
let activePassId = null;
let headerCDInterval = null;
let missionBannerInterval = null;

function setActivePass(passId) {
  activePassId = passId;
  $$('.pass-card-btn').forEach(b => b.classList.toggle('is-active', b.dataset.passId === passId));
  recordDailyLogin(passId);
  initGameMissions(passId);
  $('#passMainSec').style.display = '';
  $('#noPassSec').style.display = 'none';
  setTimeout(() => { const el = $('#passMainSec'); if (el) el.scrollIntoView({ behavior:'smooth', block:'start' }); }, 100);
  renderPassHeader(passId);
  renderTrack(passId);
  renderMissions(passId);
  renderInventory(passId);
  renderMejoras(passId);
  renderPassMailbox();
  updateHUD(passId);
  loadPassMusic(passId);
}

function initGameMissions(passId) {
  const allMissions = getAllMissionsForPass(passId);
  allMissions.filter(m => (m.isGame || m.isPassMission) && m.preCompleted).forEach(m => {
    const mst = getMissionState(passId, m.id);
    const needsReset = m.reset === '24h' && mst.resetAt && now() > mst.resetAt;
    const neverInit = !mst.resetAt;
    if (neverInit || needsReset) {
      saveMissionState(passId, m.id, { progress: m.target, claimed: false, resetAt: now() + H24 });
    } else if (mst.progress < m.target) {
      saveMissionState(passId, m.id, { ...mst, progress: m.target });
    }
  });
}

/* ─── CABECERA DEL PASE ─── */
function renderPassHeader(passId) {
  const pass = PASSES.find(p => p.id === passId);
  if (!pass) return;
  const st = getPassState(passId);
  if (headerCDInterval) { clearInterval(headerCDInterval); headerCDInterval = null; }

  const status   = getPassStatus(pass);
  const endMs    = new Date(pass.endDate + 'T23:59:59').getTime();
  const startMs  = new Date(pass.startDate + 'T00:00:00').getTime();
  const nowMs    = now();
  const statusLabel = { active:'Activo', upcoming:'Próximamente', ended:'Finalizado' }[status];

  const tierInfo = TIERS.find(t => t.id === st.tier) || TIERS[0];
  const isMaxLevel = st.level >= MAX_LEVELS;
  const totalXP  = isMaxLevel ? OVERFLOW_XP_PER_REWARD : getXPForLevel(st.level);
  const currentXP = isMaxLevel ? (st.overflowXP || 0) % OVERFLOW_XP_PER_REWARD : (st.xp || 0);
  const pct      = Math.min(100, Math.round((currentXP / totalXP) * 100));

  const tierColors       = { stone:'rgba(156,163,175,.15)', iron:'rgba(209,213,219,.15)', gold:'rgba(251,191,36,.15)', emerald:'rgba(52,211,153,.15)', diamond:'rgba(103,232,249,.15)' };
  const tierBorderColors = { stone:'rgba(156,163,175,.3)',  iron:'rgba(209,213,219,.3)',  gold:'rgba(251,191,36,.3)',  emerald:'rgba(52,211,153,.3)',  diamond:'rgba(103,232,249,.3)'  };
  const tierTextColors   = { stone:'#9ca3af', iron:'#d1d5db', gold:'#fbbf24', emerald:'#34d399', diamond:'#67e8f9' };

  const card = $('#passHeaderCard');
  if (!card) return;

  const overflowRewards = isMaxLevel ? getOverflowRewardsForPass(pass, st.tier) : [];
  const nextOverflowIdx = isMaxLevel ? (st.overflowRewardIdx || 0) % overflowRewards.length : 0;
  const nextOverflow = isMaxLevel && overflowRewards.length ? overflowRewards[nextOverflowIdx] : null;

  card.innerHTML = `
    <div class="phc-bg" style="background-image:url('${esc(pass.bg||'')}')"></div>
    <div class="phc-bg-overlay"></div>
    <div class="phc-tier-badge" style="background:${tierColors[st.tier]||'rgba(99,102,241,.12)'};border:1px solid ${tierBorderColors[st.tier]||'rgba(99,102,241,.25)'};color:${tierTextColors[st.tier]||'#a5b4fc'}">
      ${tierInfo.emoji} ${tierInfo.name} · ${tierInfo.desc}
    </div>
    <div class="phc-inner">
      <div class="phc-left">
        <div class="phc-badges">
          <span class="phc-badge phc-badge-season">${esc(pass.season)}</span>
          <span class="phc-badge phc-badge-status-${status}">${status==='active'?'● ':status==='upcoming'?'○ ':'✕ '}${statusLabel}</span>
          ${isMaxLevel?'<span class="phc-badge" style="background:rgba(251,191,36,.15);border:1px solid rgba(251,191,36,.35);color:#fbbf24">🏆 Nivel Máximo</span>':''}
        </div>
        <div class="phc-title-wrap">
          <span class="phc-emoji">${pass.emoji}</span>
          <h2 class="phc-name">${esc(pass.name)}</h2>
        </div>
        <p class="phc-desc">${esc(pass.description)}</p>
        <div class="phc-dates-row">
          <span class="phc-date-pill">📅 Inicio: ${pass.startDate}</span>
          <span class="phc-date-pill">🏁 Fin: ${pass.endDate}</span>
        </div>
      </div>
      <div class="phc-countdown">
        <span class="phc-cd-label">${nowMs>endMs?'⏰ Pase finalizado':nowMs<startMs?'⏳ Comienza en':'⏰ Finaliza en'}</span>
        <div class="phc-cd-blocks">
          <div class="phc-cd-block"><span class="phc-cd-val" id="hcd-d">--</span><span class="phc-cd-lbl">días</span></div>
          <div class="phc-cd-block"><span class="phc-cd-val" id="hcd-h">--</span><span class="phc-cd-lbl">hrs</span></div>
          <div class="phc-cd-block"><span class="phc-cd-val" id="hcd-m">--</span><span class="phc-cd-lbl">min</span></div>
          <div class="phc-cd-block"><span class="phc-cd-val" id="hcd-s">--</span><span class="phc-cd-lbl">seg</span></div>
        </div>
      </div>
      <div class="phc-xp-section">
        <div class="phc-xp-header">
          <div class="phc-xp-info">
            <span style="color:var(--muted);font-size:.82rem">${tierInfo.emoji} ${tierInfo.name} ·</span>
            ${isMaxLevel?`<span>🏆 <strong>Nivel Máx.</strong> — Overflow XP</span>`:`<span>Nivel <strong>${st.level}</strong> / ${MAX_LEVELS}</span>`}
          </div>
          <div class="phc-xp-info">
            <span class="phc-level-pct">${pct}%</span>
            <span style="color:var(--muted);font-size:.8rem">${currentXP} / ${totalXP} XP</span>
          </div>
        </div>
        <div class="phc-xp-bar">
          <div class="phc-xp-fill ${isMaxLevel?'is-maxlevel':''}" id="phcXPFill" style="width:${pct}%"></div>
        </div>
        <div class="phc-level-markers">
          ${isMaxLevel
            ?`<span style="color:#fbbf24">🌟 Cada ${OVERFLOW_XP_PER_REWARD} XP = Llave Superestrella especial</span>
              <span style="color:#fbbf24">${nextOverflow?nextOverflow.emoji+' '+nextOverflow.name:''}</span>`
            :`<span>Nivel ${st.level}</span><span>Nivel ${st.level+1}</span>`}
        </div>
      </div>
    </div>`;

  const targetMs = nowMs < startMs ? startMs : endMs;
  function tickHeader() {
    const diff = Math.max(0, targetMs - now());
    const d = Math.floor(diff/H24), h = Math.floor((diff%H24)/H1), m = Math.floor((diff%H1)/M1), s = Math.floor((diff%M1)/S1);
    const pad = n => String(n).padStart(2,'0');
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = pad(v); };
    set('hcd-d',d); set('hcd-h',h); set('hcd-m',m); set('hcd-s',s);
  }
  tickHeader();
  headerCDInterval = setInterval(tickHeader, 1000);
}

/* ─── BANNER NIVEL MÁXIMO ─── */
function renderMaxLevelBanner(passId) {
  const pass = PASSES.find(p => p.id === passId);
  const st   = getPassState(passId);
  const banner = $('#passMaxLevelBanner');
  if (!banner) return;
  if (st.level < MAX_LEVELS) { banner.classList.add('hidden'); return; }
  banner.classList.remove('hidden');
  const overflowRewards = getOverflowRewardsForPass(pass, st.tier);
  const nextIdx  = (st.overflowRewardIdx || 0) % overflowRewards.length;
  const nextR    = overflowRewards[nextIdx];
  const xpStored = (st.overflowXP || 0) % OVERFLOW_XP_PER_REWARD;
  const xpToNext = OVERFLOW_XP_PER_REWARD - xpStored;
  const totalEarned = Math.floor((st.overflowXP || 0) / OVERFLOW_XP_PER_REWARD);
  banner.innerHTML = `
    <span class="pmlb-icon">🏆</span>
    <div class="pmlb-info">
      <div class="pmlb-title">¡Nivel Máximo! — Overflow XP → Llaves Superestrella</div>
      <div class="pmlb-sub">Sigues ganando XP. Cada <strong>${OVERFLOW_XP_PER_REWARD} XP</strong> te da una Llave Superestrella especial. Recompensas obtenidas: <strong>${totalEarned}</strong></div>
      <div class="pmlb-rewards">
        <span class="pmlb-reward-pill">XP acumulada: ${xpStored} / ${OVERFLOW_XP_PER_REWARD}</span>
        ${nextR?`<span class="pmlb-reward-pill">Próxima: ${nextR.emoji} ${nextR.name}</span>`:''}
        <span class="pmlb-xp-needed">Faltan ${xpToNext} XP</span>
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   CARRIL DE RECOMPENSAS
═══════════════════════════════════════════════════════════ */
function renderTrack(passId) {
  const pass = PASSES.find(p => p.id === passId);
  const st   = getPassState(passId);
  if (!pass) return;
  renderMaxLevelBanner(passId);
  const hasPaid  = st.tier !== 'stone';
  const tierInfo = TIERS.find(t => t.id === st.tier) || TIERS[0];

  const selector = $('#passTrackTierSelector');
  if (selector) {
    selector.innerHTML = TIERS.map(t => {
      const owned   = isTierOwned(st, t.id);
      const isActive = st.tier === t.id;
      return `<button class="tier-selector-pill ${t.id} ${isActive?'active':''} ${!owned?'locked':''}"
        title="${esc(t.desc)}" onclick="filterTierView('${passId}','${t.id}')">
        ${t.emoji} ${t.name} <span style="font-size:.7rem;opacity:.7">${owned?'✓':'🔒'}</span>
      </button>`;
    }).join('');
  }

  const legendPaidEl = document.getElementById('legendPaidLabel');
  if (legendPaidEl) legendPaidEl.textContent = hasPaid ? `Pagado (${tierInfo.emoji} ${tierInfo.name})` : 'Pagado (Hierro+)';

  const container = $('#passTrackContainer');
  if (!container) return;

  let numCells='', freeRowCells='', paidRowCells='', xpCells='';

  for (let i = 0; i < MAX_LEVELS; i++) {
    const levelNum    = i + 1;
    const levelData   = pass.levels[i] || makeDefaultLevels()[i];
    const isDone      = st.level > levelNum;
    const isCurrent   = st.level === levelNum && st.level < MAX_LEVELS;
    const isMaxed     = st.level >= MAX_LEVELS;
    const isMilestone = levelNum % 10 === 0;
    const isSmallHito = levelNum % 5 === 0 && !isMilestone;
    const claimedFree = (st.claimedLevels||[]).includes(`free_${i}`);
    const claimedPaid = (st.claimedLevels||[]).includes(`paid_${i}`);
    const freeR = levelData.free;
    const paidR = levelData.paid;

    const numClass = `track-level-num-cell ${isMilestone?'milestone-num':''} ${isCurrent?'current-num':''}`;
    numCells += `<div class="${numClass}" style="${isSmallHito?'color:rgba(251,191,36,.5)':''}">${levelNum}${isMilestone?' ★':''}</div>`;

    let freeNodeClass = `track-node free-node`;
    if (claimedFree)          freeNodeClass += ' node-claimed';
    else if (isDone||isMaxed) freeNodeClass += ' node-done';
    else if (isCurrent)       freeNodeClass += ' node-current';
    else                      freeNodeClass += ' node-locked';
    if (isMilestone)          freeNodeClass += ' milestone-node';
    const freeHasBadge = (isDone||isMaxed) && !claimedFree;

    freeRowCells += `
      <div class="track-node-cell ${isMilestone?'milestone-cell':''} ${isCurrent?'current-cell':''}">
        <div class="${freeNodeClass}" onclick="openLevelModal(${i},'free')" title="${freeR?esc(freeR.name):''}">
          <span class="node-emoji">${freeR?(freeR.emoji||'⭐'):'⭐'}</span>
          ${freeHasBadge?'<div class="node-badge">!</div>':''}
        </div>
        <div class="node-label">${freeR?esc(freeR.name):''}</div>
        ${freeR?`<div class="node-amount">×${freeR.amount}</div>`:''}
      </div>`;

    let paidNodeClass = `track-node paid-node`;
    if (claimedPaid)               paidNodeClass += ' node-claimed';
    else if (!hasPaid)             paidNodeClass += ' node-locked-tier';
    else if (isDone||isMaxed)      paidNodeClass += ' node-done';
    else if (isCurrent)            paidNodeClass += ' node-current';
    else                           paidNodeClass += ' node-locked';
    if (isMilestone)               paidNodeClass += ' milestone-node';
    const paidHasBadge = hasPaid && (isDone||isMaxed) && !claimedPaid;

    paidRowCells += `
      <div class="track-node-cell ${isMilestone?'milestone-cell':''} ${isCurrent?'current-cell':''}">
        <div class="${paidNodeClass}" onclick="openLevelModal(${i},'paid')" title="${paidR?esc(paidR.name):''}">
          <span class="node-emoji">${paidR?(paidR.emoji||'🟨'):'🟨'}${!hasPaid?'<span style="font-size:.7rem;position:absolute;bottom:-4px;right:-4px">🔒</span>':''}</span>
          ${paidHasBadge?'<div class="node-badge">!</div>':''}
        </div>
        <div class="node-label">${paidR?esc(paidR.name):''}</div>
        ${paidR?`<div class="node-amount" style="color:var(--tier-gold)">×${paidR.amount}</div>`:''}
      </div>`;

    xpCells += `<div class="xp-cell ${isCurrent?'current-xp':''}">${levelNum*XP_PER_LEVEL} XP</div>`;
  }

  const paidRowColors = { stone:'rgba(156,163,175,.5)', iron:'rgba(209,213,219,.5)', gold:'rgba(251,191,36,.7)', emerald:'rgba(52,211,153,.7)', diamond:'rgba(103,232,249,.7)' };
  const paidColor = paidRowColors[st.tier] || paidRowColors.stone;

  container.innerHTML = `
    <div class="pass-track-header">
      <div class="track-header-label free-label">⬜ GRATIS</div>
      <div class="track-header-scroll" id="trackHeaderScroll">
        <div class="track-header-nums">${numCells}</div>
      </div>
    </div>
    <div class="pass-track-rows">
      <div class="track-row-label free-row-label">⬜ GRATIS · PIEDRA</div>
      <div class="track-rows-scroll" id="trackFreeScroll">
        <div class="track-rows-inner"><div class="track-row">${freeRowCells}</div></div>
      </div>
    </div>
    <div class="pass-track-rows" style="border-top:2px solid ${paidColor}22">
      <div class="track-row-label paid-row-label" style="color:${paidColor}">
        ${tierInfo.emoji} PAGADO · ${tierInfo.name.toUpperCase()}
      </div>
      <div class="track-rows-scroll" id="trackPaidScroll">
        <div class="track-rows-inner"><div class="track-row">${paidRowCells}</div></div>
      </div>
    </div>
    <div class="pass-track-xp-row">
      <div class="pass-track-xp-inner">
        <div class="xp-cell-blank"></div>${xpCells}
      </div>
    </div>`;

  syncTrackScrolls();
  setTimeout(() => {
    const idx = st.level >= MAX_LEVELS ? MAX_LEVELS - 4 : Math.max(0, st.level - 4);
    const offset = idx * 86;
    ['trackHeaderScroll','trackFreeScroll','trackPaidScroll'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.scrollLeft = offset;
    });
  }, 150);
}

function syncTrackScrolls() {
  const ids = ['trackHeaderScroll','trackFreeScroll','trackPaidScroll'];
  let syncing = false;
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('scroll', () => {
      if (syncing) return; syncing = true;
      ids.forEach(otherId => { if (otherId!==id) { const other=document.getElementById(otherId); if(other) other.scrollLeft=el.scrollLeft; } });
      const xpRow = $('.pass-track-xp-row'); if (xpRow) xpRow.scrollLeft = el.scrollLeft;
      setTimeout(() => syncing = false, 10);
    });
  });
}

function filterTierView(passId, tierId) {
  const st = getPassState(passId);
  if (!isTierOwned(st, tierId)) { toast(`🔒 Necesitas comprar el Pase ${TIERS.find(t=>t.id===tierId)?.name||tierId}`); return; }
  $$('.tier-selector-pill').forEach(p => p.classList.toggle('active', p.classList.contains(tierId)));
}

/* ─── MODAL DE NIVEL ─── */
function openLevelModal(levelIndex, row='free') {
  if (!activePassId) return;
  const pass     = PASSES.find(p => p.id === activePassId);
  const st       = getPassState(activePassId);
  const levelNum = levelIndex + 1;
  const levelData = pass.levels[levelIndex] || makeDefaultLevels()[levelIndex];
  const isDone   = st.level > levelNum || st.level >= MAX_LEVELS;
  const status   = getPassStatus(pass);
  if (status === 'upcoming') { toast(`⏳ Este pase no ha comenzado aún. ¡Espera al ${pass.startDate}!`); return; }

  const claimedFree = (st.claimedLevels||[]).includes(`free_${levelIndex}`);
  const claimedPaid = (st.claimedLevels||[]).includes(`paid_${levelIndex}`);
  const hasPaid     = st.tier !== 'stone';
  const freeR = levelData.free;
  const paidR = levelData.paid;
  if ($('#rewardTitle')) $('#rewardTitle').textContent = `Nivel ${levelNum}${levelNum%10===0?' ✦ Hito Épico':levelNum%5===0?' ★ Hito':''}`;

  const canClaimFree = isDone && !claimedFree;
  const canClaimPaid = hasPaid && isDone && !claimedPaid;
  const tierInfo = TIERS.find(t => t.id === st.tier) || TIERS[0];

  $('#rewardBody').innerHTML = `
    <div class="reward-modal-content">
      <span class="reward-big-emoji">${row==='paid'&&paidR?paidR.emoji:(freeR?freeR.emoji:'⭐')}</span>
      <span class="reward-name">Nivel ${levelNum}</span>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;width:100%;margin-top:10px">
        <div style="padding:16px;border-radius:14px;background:rgba(156,163,175,.07);border:1px solid ${claimedFree?'rgba(52,211,153,.4)':'rgba(156,163,175,.2)'};text-align:center;position:relative">
          ${claimedFree?'<div style="position:absolute;top:8px;right:8px;font-size:.7rem;color:#34d399;font-weight:700">✓</div>':''}
          <div style="font-size:.65rem;color:#9ca3af;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;font-weight:700">⬜ GRATIS</div>
          <div style="font-size:2rem">${freeR?freeR.emoji:'—'}</div>
          <div style="font-size:.85rem;color:var(--text);margin-top:6px;font-weight:600">${freeR?esc(freeR.name):'—'}</div>
          ${freeR?`<div style="font-size:.8rem;color:#9ca3af;font-family:'Space Mono',monospace;margin-top:3px">×${freeR.amount}</div>`:''}
          ${freeR&&freeR.type==='keys'?`<div style="font-size:.7rem;color:#60a5fa;margin-top:4px;">🔑 Va a Cofres</div>`:''}
          ${canClaimFree?`<button style="margin-top:10px;height:30px;padding:0 14px;border-radius:99px;font-size:.75rem;font-weight:700;background:linear-gradient(135deg,#6b7280,#9ca3af);color:#fff;cursor:pointer;" onclick="claimLevelReward(${levelIndex},'free')">⬜ Reclamar</button>`:''}
          ${claimedFree?'<div style="margin-top:8px;font-size:.75rem;color:#34d399;font-weight:700">✓ Reclamado</div>':''}
          ${!isDone?'<div style="margin-top:8px;font-size:.72rem;color:var(--dim)">🔒 Bloqueado</div>':''}
        </div>
        <div style="padding:16px;border-radius:14px;background:${hasPaid?'rgba(251,191,36,.07)':'rgba(0,0,0,.15)'};border:1px solid ${claimedPaid?'rgba(52,211,153,.4)':'rgba(251,191,36,.25)'};text-align:center;position:relative${!hasPaid?';filter:grayscale(.7);opacity:.6':''}">
          ${claimedPaid?'<div style="position:absolute;top:8px;right:8px;font-size:.7rem;color:#34d399;font-weight:700">✓</div>':''}
          <div style="font-size:.65rem;color:${hasPaid?'#fbbf24':'var(--dim)'};margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;font-weight:700">${tierInfo.emoji} ${tierInfo.name}</div>
          <div style="font-size:2rem">${paidR?paidR.emoji:'—'}</div>
          <div style="font-size:.85rem;color:var(--text);margin-top:6px;font-weight:600">${paidR?esc(paidR.name):'—'}</div>
          ${paidR?`<div style="font-size:.8rem;color:#fbbf24;font-family:'Space Mono',monospace;margin-top:3px">×${paidR.amount}</div>`:''}
          ${paidR&&paidR.type==='keys'?`<div style="font-size:.7rem;color:#60a5fa;margin-top:4px;">🔑 Va a Cofres</div>`:''}
          ${paidR&&paidR.type==='boost'?`<div style="font-size:.7rem;color:#fbbf24;margin-top:4px;">⚡ Se activa al reclamar</div>`:''}
          ${!hasPaid?`<div style="margin-top:8px;font-size:.72rem;color:var(--dim)">🔒 Requiere Pase Hierro+</div>`:''}
          ${hasPaid&&canClaimPaid?`<button style="margin-top:10px;height:30px;padding:0 14px;border-radius:99px;font-size:.75rem;font-weight:700;background:linear-gradient(135deg,#f59e0b,#fbbf24);color:#000;cursor:pointer;" onclick="claimLevelReward(${levelIndex},'paid')">✨ Reclamar</button>`:''}
          ${hasPaid&&claimedPaid?'<div style="margin-top:8px;font-size:.75rem;color:#34d399;font-weight:700">✓ Reclamado</div>':''}
          ${hasPaid&&!isDone?'<div style="margin-top:8px;font-size:.72rem;color:var(--dim)">🔒 Bloqueado</div>':''}
        </div>
      </div>
      ${status==='ended'?`<div style="background:rgba(156,163,175,.07);border:1px solid rgba(156,163,175,.2);border-radius:10px;padding:10px 16px;width:100%;text-align:center;font-size:.84rem;color:#6b7280">⚠️ Este pase ha finalizado</div>`:''}
    </div>`;

  const claimBtn = $('#rewardClaim');
  const canClaimAny = canClaimFree || canClaimPaid;
  claimBtn.disabled = !canClaimAny;
  claimBtn.textContent = canClaimAny ? '✨ Reclamar Ambas' : (isDone ? '✓ Ya reclamado' : '🔒 Bloqueado');
  claimBtn.onclick = () => {
    if (canClaimFree) claimLevelReward(levelIndex,'free');
    if (canClaimPaid) claimLevelReward(levelIndex,'paid');
    if (canClaimFree||canClaimPaid) closeRewardModal();
  };
  const modal = $('#rewardModal');
  modal.classList.add('open'); modal.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
}

/* ════════════════════════════════════════════════════════════
   ★ FIX: claimLevelReward — re-fetch estado DESPUÉS de
     processReward para no sobreescribir el XP añadido por addXP
════════════════════════════════════════════════════════════ */
function claimLevelReward(levelIndex, row='free') {
  if (!activePassId) return;
  const pass = PASSES.find(p => p.id === activePassId);
  const st   = getPassState(activePassId);
  const levelNum = levelIndex + 1;
  if (st.level <= levelNum && st.level < MAX_LEVELS) { toast('⚠️ Aún no alcanzaste este nivel'); return; }
  const claimKey = `${row}_${levelIndex}`;
  if ((st.claimedLevels||[]).includes(claimKey)) { toast('Ya reclamaste esta recompensa'); return; }
  if (getPassStatus(pass) === 'upcoming') { toast('⏳ Este pase no ha comenzado'); return; }
  const levelData = pass.levels[levelIndex] || makeDefaultLevels()[levelIndex];
  const hasPaid   = st.tier !== 'stone';
  if (row === 'paid' && !hasPaid) { toast('🔒 Necesitas Pase Hierro+ para reclamar recompensas de pago'); return; }
  const reward = row === 'paid' ? levelData.paid : levelData.free;
  if (!reward) { toast('Sin recompensa disponible'); return; }
  const mult = st.tier === 'gold' ? 1.5 : st.tier === 'diamond' ? 2 : 1;

  // Procesa la recompensa (addXP guarda el estado internamente)
  processReward(activePassId, pass.name, reward, mult);

  // ★ FIX: re-fetch el estado DESPUÉS de processReward para no
  //   sobreescribir el XP que addXP acaba de guardar en localStorage
  const freshSt = getPassState(activePassId);
  freshSt.claimedLevels = [...(freshSt.claimedLevels||[]), claimKey];
  savePassState(activePassId, freshSt);

  toast(`✨ Reclamado: ${reward.emoji} ${reward.name} ×${Math.round(reward.amount * mult)}`);
  renderPassHeader(activePassId); renderTrack(activePassId); renderInventory(activePassId); updateHUD(activePassId);
}

function closeRewardModal() {
  const modal = $('#rewardModal');
  modal.classList.remove('open'); modal.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
}
$('#rewardOverlay')?.addEventListener('click', closeRewardModal);
$('#rewardClose')?.addEventListener('click', closeRewardModal);
$('#rewardCloseBtn')?.addEventListener('click', closeRewardModal);

/* ═══════════════════════════════════════════════════════════
   MISIONES
═══════════════════════════════════════════════════════════ */
function getMissionState(passId, missionId) {
  const st = getPassState(passId);
  return st.missions?.[missionId] || { progress:0, claimed:false, resetAt:0 };
}
function saveMissionState(passId, missionId, mst) {
  const st = getPassState(passId);
  if (!st.missions) st.missions = {};
  st.missions[missionId] = mst;
  savePassState(passId, st);
}
function getMsForReset(reset) {
  return { '24h':H24, '7d':7*H24, '12d':12*H24, '24d':24*H24 }[reset] || null;
}
function checkMissionReset(passId, mission) {
  if (mission.reset === 'unique') return;
  const mst = getMissionState(passId, mission.id);
  const resetMs = getMsForReset(mission.reset);
  if (!resetMs) return;
  if (!mst.resetAt) { saveMissionState(passId, mission.id, { ...mst, resetAt: now()+resetMs }); return; }
  if (now() > mst.resetAt) {
    const newState = { progress:0, claimed:false, resetAt:now()+resetMs };
    if ((mission.isGame||mission.isPassMission) && mission.preCompleted) newState.progress = mission.target;
    saveMissionState(passId, mission.id, newState);
  }
}
function isMissionUnlocked(passId, mission) {
  if (!mission.exclusive) return true;
  const st = getPassState(passId);
  const order = ['stone','iron','gold','emerald','diamond'];
  return order.indexOf(st.tier) >= order.indexOf(mission.exclusive);
}

function renderMissions(passId) {
  const pass    = PASSES.find(p => p.id === passId);
  const status  = getPassStatus(pass);
  const container = $('#missionsGrid');
  const banner    = $('#missionsBanner');
  if (!container) return;
  if (missionBannerInterval) { clearInterval(missionBannerInterval); missionBannerInterval = null; }

  if (status === 'ended') {
    banner?.classList.remove('hidden');
    banner.className = 'missions-locked-banner is-ended';
    banner.innerHTML = `<span class="ban-icon">🔒</span><div class="ban-text"><div class="ban-title">Pase Finalizado</div><div class="ban-sub">Este pase ya terminó.</div></div>`;
    container.innerHTML = ''; return;
  }
  if (status === 'upcoming') {
    banner?.classList.remove('hidden');
    banner.className = 'missions-locked-banner is-upcoming';
    const startMs = new Date(pass.startDate+'T00:00:00').getTime();
    const renderCountdown = () => {
      const diff = Math.max(0, startMs - now());
      const d=Math.floor(diff/H24), h=Math.floor((diff%H24)/H1), m=Math.floor((diff%H1)/M1), s=Math.floor((diff%M1)/S1);
      const pad = n => String(n).padStart(2,'0');
      banner.innerHTML=`<span class="ban-icon">⏳</span><div class="ban-text"><div class="ban-title">Pase no disponible aún</div><div class="ban-sub">Las misiones se activarán cuando comience el pase.</div></div><div class="ban-countdown">${pad(d)}d ${pad(h)}:${pad(m)}:${pad(s)}</div>`;
    };
    renderCountdown();
    missionBannerInterval = setInterval(renderCountdown, 1000);
    container.innerHTML = ''; return;
  }
  banner?.classList.add('hidden');

  const allMissions = getAllMissionsForPass(passId);
  allMissions.forEach(m => checkMissionReset(passId, m));

  const groups = {};
  allMissions.forEach(m => {
    if (!groups[m.category]) groups[m.category] = { icon:m.categoryIcon, missions:[] };
    groups[m.category].missions.push(m);
  });

  let html = '';
  for (const [cat, {icon, missions}] of Object.entries(groups)) {
    const completedCount = missions.filter(m => getMissionState(passId, m.id).claimed).length;
    html += `<div class="mission-group-block">
      <div class="mission-group-header">
        <span class="mgb-icon">${icon}</span>
        <span class="mgb-title">${esc(cat)}</span>
        <span class="mgb-count">${completedCount}/${missions.length} completadas</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:7px">`;

    missions.forEach(m => {
      const mst = getMissionState(passId, m.id);
      const unlocked = isMissionUnlocked(passId, m);
      const canClaim = mst.progress >= m.target && !mst.claimed && unlocked;
      const isClaimed = mst.claimed;
      const progress = Math.min(m.target, mst.progress||0);
      const pct = Math.round((progress/m.target)*100);
      const isGame = !!m.isGame, isPassM = !!m.isPassMission;
      const resetLabel = { 'unique':'🔂 Única','24h':'↻ Diaria','7d':'↻ Semanal','12d':'↻ 12 días','24d':'↻ Mensual' }[m.reset]||'↻';
      let cdLabel = '';
      if (mst.resetAt && !isClaimed && m.reset !== 'unique' && now() < mst.resetAt) cdLabel = `<span class="mc-cooldown">↻ en ${timeLeft(mst.resetAt)}</span>`;
      const rewardEmoji = m.reward?.emoji || (REWARD_TYPES[m.reward?.type]||REWARD_TYPES.random).emoji;
      const tierBadge  = m.exclusive ? `<span class="mc-tier-badge">${m.exclusive.charAt(0).toUpperCase()+m.exclusive.slice(1)}</span>` : '';
      const gameBadge  = isGame  ? `<span class="mc-game-badge">🎮 Juego</span>` : '';
      const passBadge  = isPassM ? `<span class="mc-pass-badge">🏆 Pase</span>` : '';
      const cardClass  = `mission-card ${isClaimed?'completed':''} ${!unlocked?'locked':''} ${m.exclusive?'exclusive':''} ${isGame?'game-mission':''} ${isPassM?'pass-mission':''}`;

      html += `<div class="${cardClass}">
        <div class="mc-icon-wrap">${m.emoji}</div>
        <div class="mc-info">
          <div class="mc-top">
            <span class="mc-name">${esc(m.name)}</span>
            <div class="mc-badges">${tierBadge}${gameBadge}${passBadge}<span class="mc-reset-badge">${resetLabel}</span></div>
          </div>
          <span class="mc-desc">${esc(m.desc)}</span>
          ${unlocked?`<div class="mc-progress-wrap">
            <div class="mc-progress-row">
              <span class="mc-progress-txt">${progress} / ${m.target} (${pct}%)</span>${cdLabel}
            </div>
            <div class="mc-progress-bar-track">
              <div class="mc-progress-fill ${pct>=100?'full':''}" style="width:${pct}%"></div>
            </div>
          </div>`:`<span style="font-size:.75rem;color:var(--dim);margin-top:4px;display:block">🔒 Requiere tier ${esc(m.exclusive)}</span>`}
        </div>
        <div class="mc-reward-col">
          <div class="mc-reward-pill">
            <span class="mc-reward-xp">+${m.xpReward} XP</span>
            <span class="mc-reward-item">${rewardEmoji} <strong>×${m.reward?.amount||1}</strong></span>
          </div>
          ${isClaimed
            ?'<span class="mc-claimed">✓ Completada</span>'
            :canClaim?`<button class="mc-claim-btn" onclick="claimMission('${m.id}')">✨ Reclamar</button>`
            :`<button class="mc-claim-btn" disabled>${pct}%</button>`}
        </div>
      </div>`;
    });
    html += `</div></div>`;
  }
  container.innerHTML = html;
}

function claimMission(missionId) {
  if (!activePassId) return;
  const pass = PASSES.find(p => p.id === activePassId);
  const status = getPassStatus(pass);
  if (status === 'upcoming') { toast('⏳ Este pase no ha comenzado'); return; }
  if (status === 'ended')    { toast('🔒 Este pase ya finalizó'); return; }
  const allMissions = getAllMissionsForPass(activePassId);
  const m = allMissions.find(x => x.id === missionId);
  if (!m) return;
  const mst = getMissionState(activePassId, missionId);
  if (mst.claimed) { toast('Misión ya reclamada'); return; }
  if (mst.progress < m.target) { toast('⚠️ Misión no completada'); return; }
  addXP(activePassId, m.xpReward);
  processReward(activePassId, pass.name, m.reward);
  mst.claimed = true;
  saveMissionState(activePassId, missionId, mst);
  const st = getPassState(activePassId);
  if (!st.stats) st.stats = {};
  if (m.reset === '7d') st.stats.weeklyMissionsDone = (st.stats.weeklyMissionsDone||0)+1;
  savePassState(activePassId, st);
  trackMissionProgress(activePassId,'weekly_missions',1);
  toast(`✅ Misión: ${m.name} → +${m.xpReward} XP`);
  renderMissions(activePassId); renderPassHeader(activePassId); updateHUD(activePassId);
}

function trackMissionProgress(passId, trackId, amount=1) {
  if (!passId) return;
  const allMissions = getAllMissionsForPass(passId);
  allMissions.filter(m => m.trackId === trackId).forEach(m => {
    const mst = getMissionState(passId, m.id);
    if (mst.claimed) return;
    if (trackId === 'pass_level') { const st=getPassState(passId); mst.progress=Math.min(m.target,st.level); }
    else mst.progress = Math.min(m.target,(mst.progress||0)+amount);
    saveMissionState(passId, m.id, mst);
  });
}

function recordShopSpend(passId, amount) {
  if (!passId||!amount) return;
  const st = getPassState(passId);
  if (!st.stats) st.stats = {};
  st.stats.shopSpentDaily   = (st.stats.shopSpentDaily||0)+amount;
  st.stats.shopSpentWeekly  = (st.stats.shopSpentWeekly||0)+amount;
  st.stats.shopSpentMonthly = (st.stats.shopSpentMonthly||0)+amount;
  st.stats.shopSpentTotal   = (st.stats.shopSpentTotal||0)+amount;
  savePassState(passId,st);
  const allMissions = getAllMissionsForPass(passId);
  allMissions.filter(m => m.trackId&&m.trackId.startsWith('shop_spent')).forEach(m => {
    const mst = getMissionState(passId,m.id);
    if (mst.claimed) return;
    let spentKey = 'shopSpentTotal';
    if (m.trackId==='shop_spent_daily')   spentKey='shopSpentDaily';
    if (m.trackId==='shop_spent_weekly')  spentKey='shopSpentWeekly';
    if (m.trackId==='shop_spent_monthly') spentKey='shopSpentMonthly';
    if (m.trackId==='shop_spent_total')   spentKey='shopSpentTotal';
    mst.progress=Math.min(m.target,st.stats[spentKey]||0);
    saveMissionState(passId,m.id,mst);
  });
  if (activePassId===passId) renderMissions(passId);
}

window.notifyPassShopSpend = function(amount) {
  const nowMs = now();
  PASSES.forEach(p => {
    const s=new Date(p.startDate+'T00:00:00').getTime(), e=new Date(p.endDate+'T23:59:59').getTime();
    if (nowMs>=s&&nowMs<=e) recordShopSpend(p.id,amount);
  });
  if (activePassId) recordShopSpend(activePassId,amount);
};

function processShopSpendQueue() {
  const QUEUE_KEY = 'mv_shop_spend_queue';
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return;
    const queue = JSON.parse(raw);
    if (!queue||!queue.length) return;
    queue.forEach(item => { if (item&&item.amount>0) window.notifyPassShopSpend(item.amount); });
    localStorage.removeItem(QUEUE_KEY);
  } catch(e) {}
}

function recordDailyLogin(passId) {
  const st = getPassState(passId);
  if (!st.stats) st.stats = {};
  const today = new Date().toDateString();
  if (st.stats.lastLoginDate === today) { trackMissionProgress(passId,'pass_level',0); return; }
  st.stats.lastLoginDate = today;
  st.stats.totalLogins = (st.stats.totalLogins||0)+1;
  const yesterday = new Date(Date.now()-H24).toDateString();
  if (st.stats.lastLoginPrev===yesterday) st.stats.loginStreak=(st.stats.loginStreak||0)+1;
  else st.stats.loginStreak=1;
  st.stats.lastLoginPrev=today;
  savePassState(passId,st);
  const mst=getMissionState(passId,'daily_login');
  mst.progress=Math.min(1,(mst.progress||0)+1);
  saveMissionState(passId,'daily_login',mst);
  const allMissions=getAllMissionsForPass(passId);
  allMissions.filter(m=>m.trackId==='login_streak').forEach(m=>{const ms=getMissionState(passId,m.id);if(!ms.claimed){ms.progress=Math.min(m.target,st.stats.loginStreak);saveMissionState(passId,m.id,ms);}});
  allMissions.filter(m=>m.trackId==='total_logins').forEach(m=>{const ms=getMissionState(passId,m.id);if(!ms.claimed){ms.progress=Math.min(m.target,st.stats.totalLogins);saveMissionState(passId,m.id,ms);}});
  trackMissionProgress(passId,'pass_level',0);
}

/* ─── INVENTARIO ─── */
function renderInventory(passId) {
  const pass=PASSES.find(p=>p.id===passId), st=getPassState(passId);
  const grid=$('#invGrid');
  if (!grid) return;
  const entries=Object.entries(st.inventory||{});
  if (!entries.length){grid.innerHTML='<div class="inv-empty">📭 Sin recompensas aún. ¡Completa niveles y misiones!</div>';return;}
  grid.innerHTML=entries.map(([key,item])=>`
    <div class="inv-item">
      <span class="inv-item-emoji">${item.emoji}</span>
      <span class="inv-item-name">${esc(item.name)}</span>
      <span class="inv-item-count">×${item.count}</span>
      <span class="inv-item-source">${esc(pass?.name||passId)}</span>
    </div>`).join('');
}
function renderGlobalInventory() {
  const glob=getGlobalInventory(), el=$('#globalModalBody');
  if (!el) return;
  const entries=Object.entries(glob);
  if (!entries.length){el.innerHTML='<div class="inv-empty">📭 El inventario global está vacío.</div>';return;}
  const byPass={};
  entries.forEach(([key,item])=>{const pn=item.passName||'Global';if(!byPass[pn])byPass[pn]=[];byPass[pn].push(item);});
  el.innerHTML=Object.entries(byPass).map(([pn,items])=>`
    <h4 style="font-family:Cinzel,serif;color:#a5b4fc;font-size:.9rem;margin:16px 0 8px 0">${esc(pn)}</h4>
    <div class="inv-grid">${items.map(item=>`<div class="inv-item"><span class="inv-item-emoji">${item.emoji}</span><span class="inv-item-name">${esc(item.name)}</span><span class="inv-item-count">×${item.count}</span></div>`).join('')}</div>`).join('');
}
$('#btnGlobalInv')?.addEventListener('click',openGlobalModal);
function openGlobalModal(){renderGlobalInventory();const m=$('#globalModal');m.classList.add('open');m.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';}
function closeGlobalModal(){const m=$('#globalModal');m.classList.remove('open');m.setAttribute('aria-hidden','true');document.body.style.overflow='';}
$('#globalOverlay')?.addEventListener('click',closeGlobalModal);
$('#globalClose')?.addEventListener('click',closeGlobalModal);
$('#globalCloseBtn')?.addEventListener('click',closeGlobalModal);

/* ═══════════════════════════════════════════════════════════
   MEJORAS (TIERS) — con cadena Hierro→Oro→Esmeralda→Diamante y descuentos
═══════════════════════════════════════════════════════════ */
function isTierOwned(st, tierId) {
  const order = ['stone','iron','gold','emerald','diamond'];
  return order.indexOf(tierId) <= order.indexOf(st.tier);
}

function renderMejoras(passId) {
  const st = getPassState(passId);
  const container = $('#mejorasGrid');
  if (!container) return;

  const paidTiers = ['iron','gold','emerald','diamond'];
  const currentPaidTier = paidTiers.slice().reverse().find(t => isTierOwned(st,t)) || null;
  const paidTierInfo = currentPaidTier ? TIERS.find(t=>t.id===currentPaidTier) : null;

  container.innerHTML = TIER_UPGRADES.map(u => {
    const owned   = isTierOwned(st, u.id);
    const hasReq  = !u.requiresPrev || isTierOwned(st, u.requiresPrev);
    const isStone = u.id === 'stone';
    const isIron  = u.id === 'iron';

    const discountPct = PASS_DISCOUNTS[u.id] || 0;
    const origPrice   = u.price;
    const finalPrice  = discountPct > 0 ? Math.round(origPrice * (1 - discountPct/100)) : origPrice;
    const priceHtml   = discountPct > 0
      ? `<span class="mejora-price-orig">⟡${origPrice}</span>
         <span class="mejora-price mejora-price-sale">⟡${finalPrice}</span>
         <span class="mejora-discount-badge">-${discountPct}%</span>`
      : `<span class="mejora-price">⟡${finalPrice}</span>`;

    let footerHtml;
    if (isStone) {
      footerHtml = `
        <div class="mejora-price-wrap"><span class="mejora-price-label">Precio</span><span class="mejora-price" style="color:#34d399">GRATIS</span></div>
        ${owned?'<div class="mejora-owned-badge">✓ Activo — Incluido con el pase</div>':''}`;
    } else if (owned) {
      footerHtml = `
        <div class="mejora-price-wrap"><span class="mejora-price-label">Estado</span></div>
        <div class="mejora-owned-badge">✓ Activado — ${u.emoji} ${u.name}</div>`;
    } else if (isIron && !st.shopBought) {
      footerHtml = `
        <div class="mejora-price-wrap">
          <span class="mejora-price-label">Precio</span>${priceHtml}
        </div>
        <button class="mejora-buy-btn" onclick="redirectToShop('${passId}')">🛒 Ir a la Tienda</button>`;
    } else if (!hasReq) {
      const reqTier = TIER_UPGRADES.find(t=>t.id===u.requiresPrev);
      footerHtml = `
        <div class="mejora-price-wrap"><span class="mejora-price-label">Requiere</span><span class="mejora-price" style="font-size:.85rem;color:var(--muted)">${reqTier?.emoji||''} Pase ${reqTier?.name?.replace('Pase ','')}</span></div>
        <button class="mejora-buy-btn" disabled>🔒 Necesitas ${reqTier?.name||u.requiresPrev}</button>`;
    } else {
      footerHtml = `
        <div class="mejora-price-wrap">
          <span class="mejora-price-label">Precio</span>${priceHtml}
        </div>
        <button class="mejora-buy-btn" onclick="buyTierUpgrade('${passId}','${u.id}')">Activar Tier</button>`;
    }

    const featuresHtml = (u.features||[]).map(f=>`
      <div class="mejora-feature"><span class="mejora-feature-dot"></span><span>${esc(f)}</span></div>`).join('');

    const activePaidDisplay = !isStone && paidTierInfo && owned && (u.id===currentPaidTier)
      ? `<div class="mejora-active-tier-display">
          <span class="mejora-active-tier-icon">${paidTierInfo.emoji}</span>
          <div><div style="font-size:.65rem;color:var(--muted);text-transform:uppercase;letter-spacing:1px">Tu tier activo</div>
          <div class="mejora-active-tier-name">${paidTierInfo.emoji} ${paidTierInfo.name} — ${paidTierInfo.desc}</div></div>
        </div>` : '';

    const chainHint = !isStone && u.requiresPrev
      ? `<div style="font-size:.68rem;color:var(--dim);margin-top:6px;display:flex;align-items:center;gap:5px">
           <span style="color:${owned?'#34d399':'var(--dim)'}">
             ${TIER_UPGRADES.find(t=>t.id===u.requiresPrev)?.emoji||''} ${TIER_UPGRADES.find(t=>t.id===u.requiresPrev)?.name||u.requiresPrev}
           </span>
           <span>→</span>
           <span style="color:${owned?'#34d399':'var(--text)'};font-weight:700">${u.emoji} ${u.name}</span>
         </div>` : '';

    return `
      <div class="mejora-card tier-${u.tierClass} ${owned?'owned':''}">
        <div class="mejora-card-bar"></div>
        <div class="mejora-hero">
          <div class="mejora-icon-wrap">${u.emoji}</div>
          <div class="mejora-text">
            <div class="mejora-tier-label">${esc(u.subtitle||u.name)}</div>
            <div class="mejora-name">${esc(u.name)}</div>
            <div class="mejora-desc">${esc(u.desc)}</div>
            ${chainHint}
            ${isStone?'<span class="mejora-free-badge">✓ Gratis para todos</span>':''}
          </div>
        </div>
        ${activePaidDisplay}
        ${featuresHtml?`<div class="mejora-features">${featuresHtml}</div>`:''}
        <div class="mejora-footer">${footerHtml}</div>
      </div>`;
  }).join('');
}

function buyTierUpgrade(passId, tierId) {
  const u = TIER_UPGRADES.find(x=>x.id===tierId);
  if (!u) return;
  const st = getPassState(passId);
  if (isTierOwned(st,tierId)) { toast('Ya tienes este tier'); return; }
  const reqPrev = u.requiresPrev;
  if (reqPrev && !isTierOwned(st, reqPrev)) {
    const reqTier = TIER_UPGRADES.find(t=>t.id===reqPrev);
    toast(`⚠️ Necesitas el ${reqTier?.name||reqPrev} primero`);
    return;
  }
  const tierOrder = ['stone','iron','gold','emerald','diamond'];
  const newIdx = tierOrder.indexOf(tierId), currIdx = tierOrder.indexOf(st.tier);
  if (newIdx > currIdx) {
    st.tier = tierId; savePassState(passId,st);
    toast(`✨ ¡${TIER_UPGRADES.find(t=>t.id===tierId)?.name||tierId} activado!`);
    renderMejoras(passId); renderTrack(passId); renderPassHeader(passId); updateHUD(passId);
    initGameMissions(passId); renderMissions(passId);
  }
}
function redirectToShop(passId) {
  toast('🛒 Redirigiendo a la Tienda…');
  setTimeout(()=>{ window.location.href='tienda.html#secPases'; }, 800);
}
window.activatePassTier = function(passId, tierId) {
  const st = getPassState(passId);
  const tierOrder = ['stone','iron','gold','emerald','diamond'];
  if (tierOrder.indexOf(tierId) > tierOrder.indexOf(st.tier||'stone')) {
    st.tier=tierId; st.shopBought=true; savePassState(passId,st);
    if (activePassId===passId) {
      renderMejoras(passId); renderTrack(passId); renderPassHeader(passId); updateHUD(passId);
      initGameMissions(passId); renderMissions(passId);
    }
  }
};

/* ─── HUD ─── */
function updateHUD(passId) {
  const st       = getPassState(passId);
  const tierInfo = TIERS.find(t=>t.id===st.tier)||TIERS[0];
  const isMax    = st.level >= MAX_LEVELS;
  const totalXP  = isMax ? OVERFLOW_XP_PER_REWARD : getXPForLevel(st.level);
  const curXP    = isMax ? ((st.overflowXP||0)%OVERFLOW_XP_PER_REWARD) : (st.xp||0);
  const pct      = Math.min(100,Math.round((curXP/totalXP)*100));
  if ($('#hudTier'))   $('#hudTier').textContent   = `${tierInfo.emoji} ${tierInfo.name}${isMax?' 🏆':''}`;
  if ($('#hudXPFill')) $('#hudXPFill').style.width = `${pct}%`;
  if ($('#hudXPTxt'))  $('#hudXPTxt').textContent  = isMax?`${curXP}/${totalXP} XP ★`:`${st.xp}/${totalXP} XP`;
  if ($('#hudLevel'))  $('#hudLevel').textContent  = isMax?`Nivel MÁX.`:`Nivel ${st.level}`;

  const boostWrap = $('#hudBoostWrap');
  const boost = getTopBoost();
  if (boostWrap) {
    if (boost) {
      boostWrap.classList.remove('hidden');
      const diff = Math.max(0, boost.expiry - now());
      const h=Math.floor(diff/H1), m=Math.floor((diff%H1)/M1), s=Math.floor((diff%M1)/S1);
      const pad = n=>String(n).padStart(2,'0');
      const multEl=$('#hudBoostMult'), timerEl=$('#hudBoostTimer');
      if(multEl) multEl.textContent=`×${boost.multiplier}`;
      if(timerEl) timerEl.textContent=`${pad(h)}:${pad(m)}:${pad(s)}`;
    } else {
      boostWrap.classList.add('hidden');
    }
  }
}

/* ─── TABS ─── */
$$('.ptab').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.ptab').forEach(b=>b.classList.remove('is-on'));
    btn.classList.add('is-on');
    $$('.pass-tab-content').forEach(c=>c.classList.add('hidden'));
    const name=btn.dataset.tab;
    const tabEl=document.getElementById(`tab${name.charAt(0).toUpperCase()+name.slice(1)}`);
    if (tabEl) tabEl.classList.remove('hidden');
    if (name==='buzon') renderPassMailbox();
  });
});

/* ═══════════════════════════════════════════════════════════
   SLIDER HORIZONTAL DE PASES
═══════════════════════════════════════════════════════════ */
function renderPassSelector() {
  const track=$('#passSliderTrack'), dots=$('#sliderDots');
  if (!track) return;
  const nowMs = now();

  track.innerHTML = PASSES.map((p,idx) => {
    const startMs=new Date(p.startDate+'T00:00:00').getTime(), endMs=new Date(p.endDate+'T23:59:59').getTime();
    const status = nowMs<startMs?'upcoming':nowMs>endMs?'ended':'active';
    const statusLabels={upcoming:'Próximo',ended:'Finalizado',active:'● Activo'};
    const st=getPassState(p.id);
    const isMax=st.level>=MAX_LEVELS;
    const totalXP=isMax?OVERFLOW_XP_PER_REWARD:getXPForLevel(st.level);
    const curXP=isMax?((st.overflowXP||0)%OVERFLOW_XP_PER_REWARD):(st.xp||0);
    const pct=Math.min(100,Math.round((curXP/totalXP)*100));
    return `<button class="pass-card-btn" data-pass-id="${p.id}" onclick="setActivePass('${p.id}')" style="animation-delay:${idx*.04}s">
      <div class="pcb-status-bar ${status}"></div>
      <div class="pcb-art">
        <img src="${esc(p.bg||'')}" alt="${esc(p.name)}" loading="lazy">
        <div class="pcb-art-overlay"></div>
        <span class="pcb-emoji-big">${p.emoji}</span>
      </div>
      <div class="pcb-active-check">✓</div>
      <div class="pcb-body">
        <span class="pcb-season">${esc(p.season)}</span>
        <span class="pcb-name">${esc(p.name)}</span>
        <span class="pcb-dates">${p.startDate} → ${p.endDate}</span>
        <div class="pcb-meta">
          <span class="pcb-badge ${status}">${statusLabels[status]}</span>
          <span class="pcb-level">Nv.<span>${isMax?'MÁX':st.level}</span></span>
        </div>
        <div class="pcb-xp-bar"><div class="pcb-xp-fill" style="width:${pct}%"></div></div>
      </div>
    </button>`;
  }).join('');

  if (dots) {
    dots.innerHTML = PASSES.map((_,i)=>`<button class="slider-dot" data-idx="${i}" aria-label="Pase ${i+1}"></button>`).join('');
    $$('.slider-dot',dots).forEach(d=>d.addEventListener('click',()=>scrollSliderTo(parseInt(d.dataset.idx))));
  }

  const leftBtn=$('#sliderLeft'), rightBtn=$('#sliderRight');
  let currentSlide=0;
  function updateArrows(){
    if(leftBtn) leftBtn.disabled=currentSlide<=0;
    if(rightBtn) rightBtn.disabled=currentSlide>=PASSES.length-1;
    $$('.slider-dot',dots).forEach((d,i)=>d.classList.toggle('active',i===currentSlide));
  }
  function scrollSliderTo(idx){
    currentSlide=Math.max(0,Math.min(PASSES.length-1,idx));
    track.scrollLeft=currentSlide*(220+14); updateArrows();
  }
  leftBtn?.addEventListener('click',()=>scrollSliderTo(currentSlide-1));
  rightBtn?.addEventListener('click',()=>scrollSliderTo(currentSlide+1));
  track.addEventListener('scroll',()=>{currentSlide=Math.round(track.scrollLeft/(220+14));updateArrows();});
  let isDown=false,startX,scrollLeft;
  track.addEventListener('mousedown',e=>{isDown=true;track.classList.add('grabbing');startX=e.pageX-track.offsetLeft;scrollLeft=track.scrollLeft;});
  track.addEventListener('mouseleave',()=>{isDown=false;track.classList.remove('grabbing');});
  track.addEventListener('mouseup',()=>{isDown=false;track.classList.remove('grabbing');});
  track.addEventListener('mousemove',e=>{if(!isDown)return;e.preventDefault();const x=e.pageX-track.offsetLeft;const walk=(x-startX)*1.5;track.scrollLeft=scrollLeft-walk;});
  updateArrows();
  const activeIdx=PASSES.findIndex(p=>{const s=new Date(p.startDate+'T00:00:00').getTime(),e=new Date(p.endDate+'T23:59:59').getTime();return nowMs>=s&&nowMs<=e;});
  if (activeIdx>=0) setTimeout(()=>scrollSliderTo(activeIdx),200);
}

/* ─── MÚSICA ─── */
let currentPassMusic=null;
const audio=document.getElementById('pass-music'), musicOrb=document.getElementById('musicOrb');
function loadPassMusic(passId){
  const pass=PASSES.find(p=>p.id===passId);
  if(!pass||!audio||pass.music===currentPassMusic)return;
  currentPassMusic=pass.music; const wasPlaying=!audio.paused;
  audio.src=pass.music; audio.load();
  if(wasPlaying||localStorage.getItem('pass_music')==='on') audio.play().catch(()=>{});
}
window.togglePassMusic=function(){
  if(!audio)return;
  if(audio.paused){audio.play().then(()=>{musicOrb?.classList.add('active');localStorage.setItem('pass_music','on');}).catch(()=>{});}
  else{audio.pause();musicOrb?.classList.remove('active');localStorage.setItem('pass_music','off');}
};

/* ─── UTILS ─── */
function timeLeft(ts){
  const diff=Math.max(0,ts-now());
  const d=Math.floor(diff/H24),h=Math.floor((diff%H24)/H1),m=Math.floor((diff%H1)/M1),s=Math.floor((diff%M1)/S1);
  if(d>=1)return`${d}d ${h}h`;if(h>=1)return`${h}h ${m}m`;return`${m}m ${s}s`;
}
function toast(msg){
  const t=$('#toast');t.textContent=msg;t.classList.add('show');
  clearTimeout(toast._id);toast._id=setTimeout(()=>t.classList.remove('show'),2800);
}

/* ─── PARTÍCULAS ─── */
(function particles(){
  const c=$('#bgParticles');if(!c)return;
  const ctx=c.getContext('2d'),dpi=Math.max(1,devicePixelRatio||1);
  let w,h,parts;
  const init=()=>{
    w=c.width=innerWidth*dpi;h=c.height=innerHeight*dpi;
    parts=Array.from({length:90},()=>({x:Math.random()*w,y:Math.random()*h,r:(.4+Math.random()*1.4)*dpi,s:.15+Math.random()*.5,a:.04+Math.random()*.16,hue:220+Math.random()*60}));
  };
  const tick=()=>{
    ctx.clearRect(0,0,w,h);
    parts.forEach(p=>{
      p.y+=p.s;p.x+=Math.sin(p.y*.001)*.4;
      if(p.y>h){p.y=-10;p.x=Math.random()*w;}
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`hsla(${p.hue},70%,65%,${p.a})`;ctx.fill();
    });
    requestAnimationFrame(tick);
  };
  init();tick();addEventListener('resize',init);
})();

/* ─── NAVBAR ─── */
const navToggle=$('#navToggle'), navLinks=$('#navLinks');
navToggle?.addEventListener('click',e=>{e.stopPropagation();navLinks.classList.toggle('open')});
document.addEventListener('click',e=>{if(!navToggle?.contains(e.target)&&!navLinks?.contains(e.target))navLinks?.classList.remove('open')});

/* ─── REVEAL ─── */
(function reveal(){
  const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-in');obs.unobserve(e.target);}});},{threshold:.1});
  document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
})();

document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeRewardModal();closeGlobalModal();}});

/* ─── INTEGRACIÓN CON TIENDA ─── */
window.onPassPurchasedFromShop=function(shopItemId){
  const pass=PASSES.find(p=>p.shopItemId===shopItemId);
  if(!pass)return;
  window.activatePassTier(pass.id,'iron');
  toast(`✨ Pase "${pass.name}" desbloqueado → Tier Hierro activado`);
};

/* ─── INIT ─── */
document.addEventListener('DOMContentLoaded',()=>{
  processShopSpendQueue();
  renderPassSelector();
  if(localStorage.getItem('pass_music')==='on'&&audio) musicOrb?.classList.add('active');
  cleanExpiredBoosts();
  if(getActiveBoosts().length) startBoostTimer();

  const nowMs=now();
  const activePass=PASSES.find(p=>{
    const s=new Date(p.startDate+'T00:00:00').getTime(),e=new Date(p.endDate+'T23:59:59').getTime();
    return nowMs>=s&&nowMs<=e;
  });

  if(activePass) setActivePass(activePass.id);
  else           setActivePass(PASSES[0].id);

  updateHUD(activePass?activePass.id:PASSES[0].id);
  setTimeout(()=>toast('✨ Pases de Temporada — ¡Bienvenido!'),500);
});