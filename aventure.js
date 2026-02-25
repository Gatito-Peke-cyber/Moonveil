/* =====================================================
   Aventura Minecraft · aventure.js
   RPG completo: mundos · combate · crafteo · encantamientos
   ===================================================== */

const SAVE_KEY = 'mc_aventura_v3';

/* ─── MATERIALES & DURABILIDADES ────────────────────────── */
const MAT = {
  wood:       { name:'Madera',      emoji:'🪵', swordDmg:4,  axeDmg:7,  pickEff:2, durability:{sword:59,  axe:59,  pick:59,  helmet:55,  chest:80,  legs:75,  boots:65 }},
  stone:      { name:'Piedra',      emoji:'🪨', swordDmg:5,  axeDmg:9,  pickEff:4, durability:{sword:131, axe:131, pick:131, helmet:0,   chest:0,   legs:0,   boots:0  }},
  iron:       { name:'Hierro',      emoji:'⚙️', swordDmg:6,  axeDmg:9,  pickEff:6, durability:{sword:250, axe:250, pick:250, helmet:165, chest:240, legs:225, boots:195}},
  gold:       { name:'Oro',         emoji:'🪙', swordDmg:4,  axeDmg:7,  pickEff:12,durability:{sword:32,  axe:32,  pick:32,  helmet:77,  chest:112, legs:105, boots:91 }},
  diamond:    { name:'Diamante',    emoji:'💎', swordDmg:7,  axeDmg:9,  pickEff:8, durability:{sword:1561,axe:1561,pick:1561,helmet:363, chest:528, legs:495, boots:429}},
  netherite:  { name:'Netherita',   emoji:'🟫', swordDmg:8,  axeDmg:10, pickEff:9, durability:{sword:2031,axe:2031,pick:2031,helmet:407, chest:592, legs:555, boots:481}},
};

/* ─── ENCANTAMIENTOS ───────────────────────────────────── */
const ENCHANTS = {
  mending:           { name:'Reparación',          emoji:'🔧', desc:'Repara con XP al matar mobs', levels:1, appliesTo:['all'] },
  sharpness_1:       { name:'Filo I',              emoji:'⚔️', desc:'+2 daño en ataque',            levels:1, appliesTo:['sword','axe'], dmgBonus:2 },
  sharpness_2:       { name:'Filo II',             emoji:'⚔️', desc:'+4 daño en ataque',            levels:1, appliesTo:['sword','axe'], dmgBonus:4 },
  sharpness_3:       { name:'Filo III',            emoji:'⚔️', desc:'+6 daño en ataque',            levels:1, appliesTo:['sword','axe'], dmgBonus:6 },
  sharpness_4:       { name:'Filo IV',             emoji:'⚔️', desc:'+8 daño en ataque',            levels:1, appliesTo:['sword','axe'], dmgBonus:8 },
  sharpness_5:       { name:'Filo V',              emoji:'⚔️', desc:'+10 daño en ataque',           levels:1, appliesTo:['sword','axe'], dmgBonus:10 },
  smite_1:           { name:'Castigo I',           emoji:'☠️', desc:'+2 daño extra a no-muertos',   levels:1, appliesTo:['sword'], undeadBonus:2 },
  smite_2:           { name:'Castigo II',          emoji:'☠️', desc:'+4 daño extra a no-muertos',   levels:1, appliesTo:['sword'], undeadBonus:4 },
  smite_3:           { name:'Castigo III',         emoji:'☠️', desc:'+6 daño extra a no-muertos',   levels:1, appliesTo:['sword'], undeadBonus:6 },
  looting_1:         { name:'Saqueo I',            emoji:'💰', desc:'+20% más botín de mobs',       levels:1, appliesTo:['sword'], lootBonus:0.2 },
  looting_2:         { name:'Saqueo II',           emoji:'💰', desc:'+40% más botín de mobs',       levels:1, appliesTo:['sword'], lootBonus:0.4 },
  looting_3:         { name:'Saqueo III',          emoji:'💰', desc:'+60% más botín de mobs',       levels:1, appliesTo:['sword'], lootBonus:0.6 },
  fire_aspect_1:     { name:'Asp. Fuego I',        emoji:'🔥', desc:'Prende fuego al enemigo (+2dmg)', levels:1, appliesTo:['sword'], fireDmg:2 },
  fire_aspect_2:     { name:'Asp. Fuego II',       emoji:'🔥', desc:'Prende fuego al enemigo (+4dmg)', levels:1, appliesTo:['sword'], fireDmg:4 },
  knockback_1:       { name:'Impulso I',           emoji:'💨', desc:'+20% reducción contraataque',   levels:1, appliesTo:['sword'], knockback:0.2 },
  knockback_2:       { name:'Impulso II',          emoji:'💨', desc:'+40% reducción contraataque',   levels:1, appliesTo:['sword'], knockback:0.4 },
  protection_1:      { name:'Protección I',        emoji:'🛡️', desc:'-1 daño recibido',              levels:1, appliesTo:['helmet','chest','legs','boots'], dmgReduce:1 },
  protection_2:      { name:'Protección II',       emoji:'🛡️', desc:'-2 daño recibido',              levels:1, appliesTo:['helmet','chest','legs','boots'], dmgReduce:2 },
  protection_3:      { name:'Protección III',      emoji:'🛡️', desc:'-3 daño recibido',              levels:1, appliesTo:['helmet','chest','legs','boots'], dmgReduce:3 },
  protection_4:      { name:'Protección IV',       emoji:'🛡️', desc:'-4 daño recibido',              levels:1, appliesTo:['helmet','chest','legs','boots'], dmgReduce:4 },
  blast_protection_1:{ name:'Blast Prot. I',       emoji:'💣', desc:'-3 dmg explosión',              levels:1, appliesTo:['helmet','chest','legs','boots'], blastReduce:3 },
  blast_protection_2:{ name:'Blast Prot. II',      emoji:'💣', desc:'-5 dmg explosión',              levels:1, appliesTo:['helmet','chest','legs','boots'], blastReduce:5 },
  fire_protection_1: { name:'Prot. Fuego I',       emoji:'🔥', desc:'-2 daño de fuego',              levels:1, appliesTo:['helmet','chest','legs','boots'], fireReduce:2 },
  fire_protection_2: { name:'Prot. Fuego II',      emoji:'🔥', desc:'-4 daño de fuego',              levels:1, appliesTo:['helmet','chest','legs','boots'], fireReduce:4 },
  thorns_1:          { name:'Espinas I',           emoji:'🌵', desc:'Refleja 1 daño al atacante',    levels:1, appliesTo:['chest'], reflectDmg:1 },
  thorns_2:          { name:'Espinas II',          emoji:'🌵', desc:'Refleja 2 daño al atacante',    levels:1, appliesTo:['chest'], reflectDmg:2 },
  thorns_3:          { name:'Espinas III',         emoji:'🌵', desc:'Refleja 3 daño al atacante',    levels:1, appliesTo:['chest'], reflectDmg:3 },
  unbreaking_1:      { name:'Inquebrantable I',    emoji:'⚒️', desc:'50% de no gastar durabilidad',  levels:1, appliesTo:['all'], unbreaking:0.5 },
  unbreaking_2:      { name:'Inquebrantable II',   emoji:'⚒️', desc:'66% de no gastar durabilidad',  levels:1, appliesTo:['all'], unbreaking:0.66 },
  unbreaking_3:      { name:'Inquebrantable III',  emoji:'⚒️', desc:'75% de no gastar durabilidad',  levels:1, appliesTo:['all'], unbreaking:0.75 },
  fortune_1:         { name:'Fortuna I',           emoji:'🍀', desc:'×1.5 minerales al picar',      levels:1, appliesTo:['pick'], fortuneMult:1.5 },
  fortune_2:         { name:'Fortuna II',          emoji:'🍀', desc:'×2 minerales al picar',        levels:1, appliesTo:['pick'], fortuneMult:2 },
  fortune_3:         { name:'Fortuna III',         emoji:'🍀', desc:'×3 minerales al picar',        levels:1, appliesTo:['pick'], fortuneMult:3 },
  efficiency_1:      { name:'Eficiencia I',        emoji:'⚡', desc:'+1 mineral por viaje minero',   levels:1, appliesTo:['pick'], efficiencyBonus:1 },
  efficiency_2:      { name:'Eficiencia II',       emoji:'⚡', desc:'+2 minerales por viaje minero', levels:1, appliesTo:['pick'], efficiencyBonus:2 },
  efficiency_3:      { name:'Eficiencia III',      emoji:'⚡', desc:'+3 minerales por viaje minero', levels:1, appliesTo:['pick'], efficiencyBonus:3 },
  silk_touch:        { name:'Toque de Seda',       emoji:'🫧', desc:'Obtén bloques sin procesar',    levels:1, appliesTo:['pick'] },
  feather_falling_1: { name:'Pl. Ligera I',        emoji:'🪶', desc:'Recibe -2 daño de caída',       levels:1, appliesTo:['boots'], fallReduce:2 },
  feather_falling_2: { name:'Pl. Ligera II',       emoji:'🪶', desc:'Recibe -3 daño de caída',       levels:1, appliesTo:['boots'], fallReduce:3 },
  aqua_affinity:     { name:'Afinidad Acuática',   emoji:'🌊', desc:'+30% botín en ubicaciones de agua', levels:1, appliesTo:['helmet'] },
  respiration_1:     { name:'Respiración I',       emoji:'🫧', desc:'+2 HP extra en combates acuáticos',  levels:1, appliesTo:['helmet'], breathBonus:2 },
  sweeping_edge:     { name:'Barrido',             emoji:'💫', desc:'Ataca a todos los enemigos del área', levels:1, appliesTo:['sword'], sweeping:true },
  power_1:           { name:'Potencia I',          emoji:'💪', desc:'+3 daño con hacha',              levels:1, appliesTo:['axe'], dmgBonus:3 },
  power_2:           { name:'Potencia II',         emoji:'💪', desc:'+5 daño con hacha',              levels:1, appliesTo:['axe'], dmgBonus:5 },
};

/* ─── ITEMS ─────────────────────────────────────────────── */
const ITEMS = {
  // Stack items (inventory qty)
  emerald:     { n:'Esmeralda',     e:'💎', cat:'mineral', value:10 },
  diamond:     { n:'Diamante',      e:'💎', cat:'mineral', value:0, special:true },
  gold_ingot:  { n:'Lingote de Oro',e:'🪙', cat:'mineral', value:5 },
  iron_ingot:  { n:'Lingote de Hierro',e:'⚙️',cat:'mineral',value:2 },
  coal:        { n:'Carbón',        e:'🖤', cat:'mineral', value:0 },
  redstone:    { n:'Piedra Roja',   e:'🔴', cat:'mineral', value:0 },
  lapis:       { n:'Lapislázuli',   e:'🔵', cat:'mineral', value:0 },
  wood:        { n:'Madera',        e:'🪵', cat:'material',value:0 },
  stone:       { n:'Piedra',        e:'🪨', cat:'material',value:0 },
  leather:     { n:'Cuero',         e:'🟫', cat:'material',value:0 },
  netherite_scrap:{ n:'Fragmento Netherita', e:'🟫', cat:'material', value:0 },
  netherite_ingot:{ n:'Lingote Netherita',   e:'🟫', cat:'material', value:0 },
  iron_sword_broken:{ n:'Espada Hierro Rota', e:'⚙️', cat:'junk',   value:0 },
  // Food
  apple:       { n:'Manzana',       e:'🍎', cat:'food', heal:2, value:0 },
  watermelon:  { n:'Sandía',        e:'🍉', cat:'food', heal:2, value:0 },
  pumpkin:     { n:'Calabaza',      e:'🎃', cat:'food', heal:1, value:0 },
  berries:     { n:'Bayas',         e:'🫐', cat:'food', heal:1, value:0 },
  bread:       { n:'Pan',           e:'🍞', cat:'food', heal:3, value:0 },
  cooked_beef: { n:'Filete Cocido', e:'🥩', cat:'food', heal:4, value:0 },
  rabbit_stew: { n:'Estofado',      e:'🥣', cat:'food', heal:5, value:0 },
  golden_apple:{ n:'Manzana de Oro',e:'🍏', cat:'food', heal:8, value:0, special:true },
  // Seeds/crops
  wheat_seeds: { n:'Semillas Trigo',e:'🌱', cat:'crop', value:0 },
  wheat:       { n:'Trigo',         e:'🌾', cat:'crop', value:0 },
  carrot:      { n:'Zanahoria',     e:'🥕', cat:'food', heal:2, value:0 },
  potato:      { n:'Papa',          e:'🥔', cat:'food', heal:2, value:0 },
  // Enchanted books
  book_mending:{ n:'Libro: Reparación', e:'📗', cat:'book', enchant:'mending' },
  book_sharpness_1:{ n:'Libro: Filo I', e:'📕', cat:'book', enchant:'sharpness_1' },
  book_sharpness_2:{ n:'Libro: Filo II',e:'📕', cat:'book', enchant:'sharpness_2' },
  book_sharpness_3:{ n:'Libro: Filo III',e:'📕',cat:'book', enchant:'sharpness_3' },
  book_sharpness_4:{ n:'Libro: Filo IV', e:'📕',cat:'book', enchant:'sharpness_4' },
  book_sharpness_5:{ n:'Libro: Filo V',  e:'📕',cat:'book', enchant:'sharpness_5' },
  book_smite_1:{ n:'Libro: Castigo I', e:'📘', cat:'book', enchant:'smite_1' },
  book_smite_2:{ n:'Libro: Castigo II',e:'📘', cat:'book', enchant:'smite_2' },
  book_smite_3:{ n:'Libro: Castigo III',e:'📘',cat:'book', enchant:'smite_3' },
  book_protection_1:{ n:'Libro: Protección I', e:'📙', cat:'book', enchant:'protection_1' },
  book_protection_2:{ n:'Libro: Protección II',e:'📙', cat:'book', enchant:'protection_2' },
  book_protection_3:{ n:'Libro: Protección III',e:'📙',cat:'book', enchant:'protection_3' },
  book_protection_4:{ n:'Libro: Protección IV', e:'📙',cat:'book', enchant:'protection_4' },
  book_unbreaking_1:{ n:'Libro: Inquebrantable I', e:'📒', cat:'book', enchant:'unbreaking_1' },
  book_unbreaking_2:{ n:'Libro: Inquebrantable II',e:'📒', cat:'book', enchant:'unbreaking_2' },
  book_unbreaking_3:{ n:'Libro: Inquebrantable III',e:'📒',cat:'book', enchant:'unbreaking_3' },
  book_fortune_1:{ n:'Libro: Fortuna I', e:'📗', cat:'book', enchant:'fortune_1' },
  book_fortune_2:{ n:'Libro: Fortuna II',e:'📗', cat:'book', enchant:'fortune_2' },
  book_fortune_3:{ n:'Libro: Fortuna III',e:'📗',cat:'book', enchant:'fortune_3' },
  book_looting_1:{ n:'Libro: Saqueo I', e:'📕', cat:'book', enchant:'looting_1' },
  book_looting_2:{ n:'Libro: Saqueo II',e:'📕', cat:'book', enchant:'looting_2' },
  book_looting_3:{ n:'Libro: Saqueo III',e:'📕',cat:'book', enchant:'looting_3' },
  book_thorns_2: { n:'Libro: Espinas II',e:'📗', cat:'book', enchant:'thorns_2' },
  book_thorns_3: { n:'Libro: Espinas III',e:'📗',cat:'book', enchant:'thorns_3' },
  book_fire_aspect_1:{ n:'Libro: Asp. Fuego I',e:'📕',cat:'book', enchant:'fire_aspect_1' },
  book_fire_aspect_2:{ n:'Libro: Asp. Fuego II',e:'📕',cat:'book', enchant:'fire_aspect_2' },
  book_blast_protection_2:{ n:'Libro: Blast Prot. II',e:'📙',cat:'book', enchant:'blast_protection_2' },
  book_efficiency_3:{ n:'Libro: Eficiencia III',e:'📗',cat:'book', enchant:'efficiency_3' },
  book_feather_falling_2:{ n:'Libro: Pl. Ligera II',e:'📒',cat:'book', enchant:'feather_falling_2' },
  book_sweeping:{ n:'Libro: Barrido',e:'📕', cat:'book', enchant:'sweeping_edge' },
};

/* ─── ENEMIGOS ──────────────────────────────────────────── */
const ENEMIES = {
  zombie:       { n:'Zombi',             e:'🧟', hp:10, dmg:3, xp:5,  armor:0,  traits:['undead'],        drops:{ wheat:0.3, rotten_flesh:0.6, iron_ingot:0.1 }, rare:false },
  skeleton:     { n:'Esqueleto',         e:'💀', hp:8,  dmg:4, xp:6,  armor:0,  traits:['undead'],        drops:{ arrow:0.5, bone:0.3, bow_wood:0.1 },           rare:false },
  spider:       { n:'Araña',             e:'🕷️', hp:8,  dmg:3, xp:5,  armor:0,  traits:['arthropod'],     drops:{ string:0.5, spider_eye:0.3, coal:0.1 },        rare:false },
  creeper:      { n:'Creeper',           e:'💥', hp:12, dmg:6, xp:8,  armor:0,  traits:['explosive'],     drops:{ gunpowder:0.7, wool:0.2, emerald:0.1 },        rare:false, blastDmg:true },
  cave_spider:  { n:'Araña de Cueva',    e:'🕸️', hp:6,  dmg:4, xp:6,  armor:0,  traits:['arthropod','poison'],drops:{string:0.6,spider_eye:0.5,coal:0.1},       rare:false },
  enderman:     { n:'Enderman',          e:'👾', hp:20, dmg:7, xp:12, armor:0,  traits:['teleport'],      drops:{ ender_pearl:0.5, emerald:0.3, diamond:0.1 },   rare:false },
  witch:        { n:'Bruja',             e:'🧙', hp:15, dmg:5, xp:10, armor:0,  traits:['magic'],         drops:{ potion:0.5, redstone:0.3, lapis:0.2 },         rare:false },
  blaze:        { n:'Blaze',             e:'🔥', hp:14, dmg:6, xp:12, armor:0,  traits:['fire','undead'],  drops:{ blaze_rod:0.7, coal:0.3, gold_ingot:0.2 },    rare:false },
  zombie_armed: { n:'Zombi Armado',      e:'🧟‍♂️',hp:22, dmg:5, xp:18, armor:3,  traits:['undead','armored'], drops:{ iron_ingot:0.7, gold_ingot:0.3, emerald:0.2 }, rare:true },
  skeleton_armored:{ n:'Esqueleto Armado',e:'💂',hp:18,dmg:6,  xp:15, armor:2,  traits:['undead','armored'], drops:{ iron_ingot:0.5, bone:0.4, diamond:0.15, iron_sword:0.2 }, rare:true },
  warden:       { n:'Warden',            e:'👁️', hp:40, dmg:10,xp:50, armor:5,  traits:['boss','sonic'],   drops:{ diamond:0.8, emerald:1.0, netherite_scrap:0.4 }, rare:true },
  evoker:       { n:'Evocador',          e:'🧝', hp:25, dmg:7, xp:30, armor:0,  traits:['boss','magic'],   drops:{ diamond:0.6, emerald:0.7, book_mending:0.3 },  rare:true },
};

/* ─── MUNDOS Y UBICACIONES ──────────────────────────────── */
const WORLDS = {
  forest: {
    n:'Bosque Profundo', e:'🌲', biome:'Bioma Bosque',
    danger:'easy', minLevel:0,
    locations: [
      { id:'clearing',  n:'Claro Soleado',    e:'🌤️', type:'explore', danger:'easy', desc:'Zona tranquila, buenos recursos',loot:['apple','berries','wheat_seeds','wood'],enemies:['zombie','spider'] },
      { id:'dark_wood',  n:'Bosque Oscuro',   e:'🌑', type:'explore', danger:'medium', desc:'Árboles densos. Peligroso de noche',loot:['wood','berries','emerald','leather'],enemies:['zombie','skeleton','spider'] },
      { id:'river',      n:'Río del Bosque',  e:'🌊', type:'explore', danger:'easy', desc:'Recursos acuáticos y pesca',loot:['watermelon','carrot','iron_ingot','wheat'],enemies:['zombie'] },
      { id:'village_f',  n:'Aldea Boscosa',   e:'🏘️', type:'village', danger:'easy', desc:'Aldeanos amistosos. Comercio disponible', special:true },
      { id:'ruin_f',     n:'Ruinas Antiguas', e:'🏚️', type:'structure', danger:'medium', desc:'Tesoros escondidos entre ruinas',loot:['iron_ingot','emerald','book_protection_1','coal'],enemies:['zombie','skeleton'] },
    ]
  },
  cave: {
    n:'Sistema de Cuevas', e:'🕳️', biome:'Bioma Subterráneo',
    danger:'medium', minLevel:0,
    locations:[
      { id:'cave_ent',   n:'Entrada de Cueva', e:'⛏️', type:'mine', danger:'easy', desc:'Minerales básicos: carbón y hierro',loot:['coal','iron_ingot','stone'],enemies:['zombie','spider'] },
      { id:'deep_cave',  n:'Cueva Profunda',   e:'🌋', type:'mine', danger:'medium', desc:'Redstone, lapislázuli y más',loot:['redstone','lapis','iron_ingot','coal','gold_ingot'],enemies:['zombie','cave_spider','skeleton'] },
      { id:'crystal_c',  n:'Cueva Cristalina', e:'💎', type:'mine', danger:'hard', desc:'Diamantes y piedra preciosa',loot:['diamond','lapis','redstone','iron_ingot'],enemies:['cave_spider','enderman','zombie_armed'] },
      { id:'dungeon',    n:'Mazmorras',        e:'🔒', type:'dungeon', danger:'hard', desc:'Zona de monstruos con cofre al final', special:true,loot:['emerald','diamond','gold_ingot','book_sharpness_2'],enemies:['skeleton','zombie','cave_spider'] },
      { id:'deep_dark',  n:'Lo Profundo Oscuro',e:'👁️',type:'explore',danger:'extreme',desc:'¡Cuidado con el Warden!',loot:['netherite_scrap','diamond','emerald','book_mending'],enemies:['warden','cave_spider'] },
    ]
  },
  waterfall: {
    n:'Cascadas Eternas', e:'💧', biome:'Bioma Acuático',
    danger:'easy', minLevel:0,
    locations:[
      { id:'wfall_base', n:'Base de la Cascada', e:'🌊', type:'explore', danger:'easy', desc:'Agua pura y flora acuática',loot:['watermelon','apple','carrot','wheat'],enemies:['zombie'] },
      { id:'ruins_w',    n:'Ruinas Sumergidas',  e:'🏛️', type:'explore', danger:'medium', desc:'Antigua civilización bajo el agua',loot:['emerald','gold_ingot','lapis','book_protection_2'],enemies:['zombie','cave_spider'] },
      { id:'trade_post', n:'Puesto de Comercio', e:'🏪', type:'shop', danger:'easy', desc:'Comerciantes con mercancía especial', special:true },
      { id:'wfall_peak', n:'Cima de la Cascada', e:'⛰️', type:'explore', danger:'medium', desc:'Vista increíble, ¡y buen botín!',loot:['emerald','iron_ingot','berries','book_feather_falling_2'],enemies:['skeleton','witch'] },
    ]
  },
  desert: {
    n:'Desierto Abrasador', e:'🏜️', biome:'Bioma Desierto',
    danger:'medium', minLevel:0,
    locations:[
      { id:'desert_p',   n:'Llanura Árida',     e:'☀️', type:'explore', danger:'easy', desc:'Arena y cactus. Cuidado con el calor',loot:['gold_ingot','coal','pumpkin','leather'],enemies:['zombie','skeleton'] },
      { id:'temple',     n:'Templo del Desierto',e:'🛕', type:'structure', danger:'hard', desc:'Trampa en el suelo. Gran recompensa', special:true,loot:['gold_ingot','diamond','emerald','book_fortune_2'] },
      { id:'pyramid',    n:'Pirámide',           e:'🔺', type:'dungeon', danger:'hard', desc:'Criptas con monstruos y tesoros',loot:['emerald','gold_ingot','diamond','book_looting_2'],enemies:['zombie_armed','skeleton_armored'] },
      { id:'oasis',      n:'Oasis',              e:'🌴', type:'explore', danger:'easy', desc:'Recursos hídricos en el desierto',loot:['watermelon','apple','carrot','wheat_seeds'],enemies:['zombie'] },
      { id:'gold_mine',  n:'Mina de Oro',        e:'🪙', type:'mine', danger:'medium', desc:'Rica en oro y redstone',loot:['gold_ingot','redstone','lapis','coal'],enemies:['zombie','skeleton'] },
    ]
  },
  jungle: {
    n:'Selva Peligrosa', e:'🌴', biome:'Bioma Selva',
    danger:'hard', minLevel:0,
    locations:[
      { id:'jungle_d',   n:'Profundidad Selvática',e:'🌿',type:'explore',danger:'medium',desc:'Rica en madera y frutas exóticas',loot:['wood','apple','berries','carrot','wheat_seeds'],enemies:['spider','zombie','cave_spider'] },
      { id:'jungle_t',   n:'Templo de la Selva',  e:'🏯', type:'structure', danger:'hard', desc:'Mecanismos trampa y gran tesoro', special:true,loot:['emerald','diamond','lapis','book_sharpness_3'] },
      { id:'witch_hut',  n:'Choza de la Bruja',   e:'🧙', type:'dungeon', danger:'hard', desc:'La bruja tiene pociones y magia',loot:['redstone','lapis','book_fire_aspect_1','emerald'],enemies:['witch','spider','cave_spider'] },
      { id:'mansion',    n:'Mansión Abandonada',  e:'🏚️', type:'mansion', danger:'extreme', desc:'Enorme estructura, ¡aterrador!', special:true,loot:['diamond','emerald','book_mending','gold_ingot','book_unbreaking_2'],enemies:['evoker','zombie_armed','zombie'] },
    ]
  },
  mountains: {
    n:'Montañas Nevadas', e:'⛰️', biome:'Bioma Montañas',
    danger:'hard', minLevel:0,
    locations:[
      { id:'peak',       n:'Cima Nevada',         e:'🏔️', type:'explore', danger:'medium', desc:'Vista panorámica, minerales raros',loot:['iron_ingot','coal','emerald','stone'],enemies:['zombie','skeleton','witch'] },
      { id:'iron_mine',  n:'Mina de Hierro',       e:'⛏️', type:'mine', danger:'easy', desc:'Abundante en hierro y piedra',loot:['iron_ingot','coal','stone','redstone'],enemies:['zombie','cave_spider'] },
      { id:'dwarven',    n:'Fortaleza Enana',      e:'🏰', type:'structure', danger:'hard', desc:'Antigua fortaleza llena de tesoros', special:true,loot:['iron_ingot','diamond','gold_ingot','book_efficiency_3','book_unbreaking_3'] },
      { id:'monument',   n:'Monumento Glaciar',   e:'❄️', type:'explore', danger:'extreme', desc:'Misterioso monumento con recompensas',loot:['diamond','emerald','netherite_scrap','book_protection_3'],enemies:['enderman','zombie_armed','skeleton_armored'] },
    ]
  },
  nether: {
    n:'El Nether', e:'🌋', biome:'Bioma Nether',
    danger:'extreme', minLevel:0,
    locations:[
      { id:'nether_w',   n:'Tierras Carmesí',     e:'🔴', type:'explore', danger:'hard', desc:'Suelo rojo, muy peligroso',loot:['netherite_scrap','gold_ingot','blaze_rod','coal'],enemies:['blaze','zombie','zombie_armed'] },
      { id:'fortress',   n:'Fortaleza Nether',    e:'🏯', type:'dungeon', danger:'extreme', desc:'La fortaleza más peligrosa',loot:['blaze_rod','netherite_scrap','diamond','book_fire_aspect_2'],enemies:['blaze','skeleton','warden'] },
      { id:'bastion',    n:'Bastión de Piglins',  e:'🐷', type:'structure', danger:'extreme', desc:'Los Piglins tienen gran tesoro', special:true,loot:['netherite_ingot','gold_ingot','diamond','book_protection_4','emerald'] },
      { id:'nether_shop',n:'Mercader Piglin',     e:'🏪', type:'shop', danger:'hard', desc:'Comercio con Piglins (con oro)', special:true },
    ]
  },
};

/* ─── RECETAS ────────────────────────────────────────────── */
const RECIPES = {
  // Armas (espadas)
  wood_sword:      { n:'Espada Madera',     e:'🗡️', cat:'armas', needs:{wood:2}, type:'sword', mat:'wood' },
  stone_sword:     { n:'Espada Piedra',     e:'⚔️', cat:'armas', needs:{stone:2,wood:1}, type:'sword', mat:'stone' },
  iron_sword:      { n:'Espada Hierro',     e:'⚔️', cat:'armas', needs:{iron_ingot:2,wood:1}, type:'sword', mat:'iron' },
  gold_sword:      { n:'Espada Oro',        e:'⚔️', cat:'armas', needs:{gold_ingot:2,wood:1}, type:'sword', mat:'gold' },
  diamond_sword:   { n:'Espada Diamante',   e:'💫', cat:'armas', needs:{diamond:2,wood:1}, type:'sword', mat:'diamond' },
  netherite_sword: { n:'Espada Netherita',  e:'🗡️', cat:'armas', needs:{netherite_ingot:1,diamond_sword:1}, type:'sword', mat:'netherite', special:true },
  // Hachas
  wood_axe:        { n:'Hacha Madera',      e:'🪓', cat:'armas', needs:{wood:3}, type:'axe', mat:'wood' },
  stone_axe:       { n:'Hacha Piedra',      e:'🪓', cat:'armas', needs:{stone:3,wood:2}, type:'axe', mat:'stone' },
  iron_axe:        { n:'Hacha Hierro',      e:'🪓', cat:'armas', needs:{iron_ingot:3,wood:2}, type:'axe', mat:'iron' },
  gold_axe:        { n:'Hacha Oro',         e:'🪓', cat:'armas', needs:{gold_ingot:3,wood:2}, type:'axe', mat:'gold' },
  diamond_axe:     { n:'Hacha Diamante',    e:'🪓', cat:'armas', needs:{diamond:3,wood:2}, type:'axe', mat:'diamond' },
  // Picos
  wood_pick:       { n:'Pico Madera',       e:'⛏️', cat:'herramientas', needs:{wood:3}, type:'pick', mat:'wood' },
  stone_pick:      { n:'Pico Piedra',       e:'⛏️', cat:'herramientas', needs:{stone:3,wood:2}, type:'pick', mat:'stone' },
  iron_pick:       { n:'Pico Hierro',       e:'⛏️', cat:'herramientas', needs:{iron_ingot:3,wood:2}, type:'pick', mat:'iron' },
  gold_pick:       { n:'Pico Oro',          e:'⛏️', cat:'herramientas', needs:{gold_ingot:3,wood:2}, type:'pick', mat:'gold' },
  diamond_pick:    { n:'Pico Diamante',     e:'⛏️', cat:'herramientas', needs:{diamond:3,wood:2}, type:'pick', mat:'diamond' },
  netherite_pick:  { n:'Pico Netherita',    e:'⛏️', cat:'herramientas', needs:{netherite_ingot:1,diamond_pick:1}, type:'pick', mat:'netherite', special:true },
  // Armaduras (cascos)
  leather_helmet:  { n:'Casco Cuero',       e:'🪖', cat:'armaduras', needs:{leather:5}, type:'helmet', mat:'leather' },
  iron_helmet:     { n:'Casco Hierro',      e:'⛑️', cat:'armaduras', needs:{iron_ingot:5}, type:'helmet', mat:'iron' },
  gold_helmet:     { n:'Casco Oro',         e:'🪖', cat:'armaduras', needs:{gold_ingot:5}, type:'helmet', mat:'gold' },
  diamond_helmet:  { n:'Casco Diamante',    e:'💎', cat:'armaduras', needs:{diamond:5}, type:'helmet', mat:'diamond' },
  netherite_helmet:{ n:'Casco Netherita',   e:'🪖', cat:'armaduras', needs:{netherite_ingot:1,diamond_helmet:1}, type:'helmet', mat:'netherite', special:true },
  // Pechos
  leather_chest:   { n:'Peto Cuero',        e:'🧥', cat:'armaduras', needs:{leather:8}, type:'chest', mat:'leather' },
  iron_chest:      { n:'Peto Hierro',       e:'🧥', cat:'armaduras', needs:{iron_ingot:8}, type:'chest', mat:'iron' },
  gold_chest:      { n:'Peto Oro',          e:'🧥', cat:'armaduras', needs:{gold_ingot:8}, type:'chest', mat:'gold' },
  diamond_chest:   { n:'Peto Diamante',     e:'💎', cat:'armaduras', needs:{diamond:8}, type:'chest', mat:'diamond' },
  netherite_chest: { n:'Peto Netherita',    e:'🧥', cat:'armaduras', needs:{netherite_ingot:1,diamond_chest:1}, type:'chest', mat:'netherite', special:true },
  // Pantalones
  leather_legs:    { n:'Pantalón Cuero',    e:'👖', cat:'armaduras', needs:{leather:7}, type:'legs', mat:'leather' },
  iron_legs:       { n:'Pantalón Hierro',   e:'👖', cat:'armaduras', needs:{iron_ingot:7}, type:'legs', mat:'iron' },
  gold_legs:       { n:'Pantalón Oro',      e:'👖', cat:'armaduras', needs:{gold_ingot:7}, type:'legs', mat:'gold' },
  diamond_legs:    { n:'Pantalón Diamante', e:'💎', cat:'armaduras', needs:{diamond:7}, type:'legs', mat:'diamond' },
  // Botas
  leather_boots:   { n:'Botas Cuero',       e:'👟', cat:'armaduras', needs:{leather:4}, type:'boots', mat:'leather' },
  iron_boots:      { n:'Botas Hierro',      e:'👟', cat:'armaduras', needs:{iron_ingot:4}, type:'boots', mat:'iron' },
  gold_boots:      { n:'Botas Oro',         e:'👟', cat:'armaduras', needs:{gold_ingot:4}, type:'boots', mat:'gold' },
  diamond_boots:   { n:'Botas Diamante',    e:'💎', cat:'armaduras', needs:{diamond:4}, type:'boots', mat:'diamond' },
  // Comida
  bread_c:         { n:'Pan',               e:'🍞', cat:'comida', needs:{wheat:3}, type:'food', gives:'bread' },
  cooked_beef_c:   { n:'Filete Cocido',     e:'🥩', cat:'comida', needs:{iron_ingot:1,coal:1}, type:'food', gives:'cooked_beef', desc:'Hierro(parrilla)+Carbón' },
  rabbit_stew_c:   { n:'Estofado',          e:'🥣', cat:'comida', needs:{carrot:1,potato:1,coal:1}, type:'food', gives:'rabbit_stew' },
  golden_apple_c:  { n:'Manzana de Oro',    e:'🍏', cat:'comida', needs:{apple:1,gold_ingot:8}, type:'food', gives:'golden_apple', special:true },
  // Misc
  netherite_ingot_c:{ n:'Lingote Netherita',e:'🟫', cat:'misc', needs:{netherite_scrap:4,gold_ingot:4}, type:'misc', gives:'netherite_ingot', special:true },
  iron_ingot_c:    { n:'Fundición Hierro',  e:'⚙️', cat:'misc', needs:{stone:1,coal:1}, type:'misc', gives:'iron_ingot', desc:'(Simula fragua)' },
};

/* ─── TIENDA / SHOP ─────────────────────────────────────── */
const SHOPS = {
  village: {
    name:'Comerciante del Pueblo', icon:'🏘️',
    tabs:['general','herramientas','armaduras'],
    items:{
      general:[
        { id:'apple_s',       e:'🍎',n:'Manzana',     cost:2,  cur:'emerald', gives:'apple',      qty:3 },
        { id:'bread_s',       e:'🍞',n:'Pan',          cost:4,  cur:'emerald', gives:'bread',      qty:1 },
        { id:'iron_ingot_s',  e:'⚙️',n:'Lingote Hierro',cost:3, cur:'emerald', gives:'iron_ingot', qty:2 },
        { id:'wheat_s',       e:'🌾',n:'Trigo',        cost:1,  cur:'emerald', gives:'wheat',      qty:5 },
        { id:'book_prot1_s',  e:'📙',n:'Libro Prot. I',cost:15, cur:'emerald', gives:'book_protection_1', qty:1 },
        { id:'book_sharp1_s', e:'📕',n:'Libro Filo I', cost:12, cur:'emerald', gives:'book_sharpness_1',  qty:1 },
      ],
      herramientas:[
        { id:'stone_pick_s',  e:'⛏️',n:'Pico Piedra', cost:8,  cur:'emerald', type:'pick', mat:'stone' },
        { id:'iron_pick_s',   e:'⛏️',n:'Pico Hierro', cost:18, cur:'emerald', type:'pick', mat:'iron'  },
        { id:'iron_axe_s',    e:'🪓',n:'Hacha Hierro',cost:16, cur:'emerald', type:'axe',  mat:'iron'  },
      ],
      armaduras:[
        { id:'iron_helm_s',   e:'⛑️',n:'Casco Hierro', cost:20, cur:'emerald', type:'helmet', mat:'iron' },
        { id:'iron_chest_s',  e:'🧥',n:'Peto Hierro',  cost:28, cur:'emerald', type:'chest',  mat:'iron' },
        { id:'iron_legs_s',   e:'👖',n:'Pantalón Hierro',cost:24,cur:'emerald', type:'legs',   mat:'iron' },
      ],
    }
  },
  nether_shop: {
    name:'Mercader Piglin', icon:'🐷',
    tabs:['general'],
    items:{
      general:[
        { id:'netherite_s',   e:'🟫',n:'Fragmento Netherita',cost:20,cur:'gold_ingot', gives:'netherite_scrap',  qty:1 },
        { id:'blaze_rod_s',   e:'🔥',n:'Vara de Blaze',      cost:5, cur:'gold_ingot', gives:'blaze_rod',        qty:2 },
        { id:'book_fire_s',   e:'📕',n:'Libro Asp. Fuego I', cost:15,cur:'gold_ingot', gives:'book_fire_aspect_1',qty:1 },
        { id:'book_blast_s',  e:'📙',n:'Libro Blast Prot. II',cost:18,cur:'gold_ingot',gives:'book_blast_protection_2',qty:1 },
        { id:'golden_apple_s',e:'🍏',n:'Manzana Oro',        cost:30,cur:'gold_ingot', gives:'golden_apple',     qty:1 },
        { id:'diamond_sword_s',e:'💫',n:'Espada Diamante',   cost:40,cur:'gold_ingot', type:'sword', mat:'diamond' },
      ],
    }
  },
  trade_post: {
    name:'Puesto Comercial', icon:'🏪',
    tabs:['general','libros'],
    items:{
      general:[
        { id:'golden_ap_t',   e:'🍏',n:'Manzana de Oro',     cost:15,cur:'emerald', gives:'golden_apple',  qty:1 },
        { id:'diamond_t',     e:'💎',n:'Diamante',            cost:25,cur:'emerald', gives:'diamond',       qty:1 },
        { id:'leather_t',     e:'🟫',n:'Cuero',               cost:3, cur:'emerald', gives:'leather',       qty:4 },
        { id:'iron_sword_t',  e:'⚔️',n:'Espada Hierro',       cost:20,cur:'emerald', type:'sword', mat:'iron' },
      ],
      libros:[
        { id:'book_mend_t',   e:'📗',n:'Libro Reparación',   cost:35,cur:'emerald', gives:'book_mending',        qty:1 },
        { id:'book_unbr3_t',  e:'📒',n:'Libro Inqueb. III',  cost:28,cur:'emerald', gives:'book_unbreaking_3',   qty:1 },
        { id:'book_fort2_t',  e:'📗',n:'Libro Fortuna II',   cost:22,cur:'emerald', gives:'book_fortune_2',      qty:1 },
        { id:'book_loot2_t',  e:'📕',n:'Libro Saqueo II',    cost:20,cur:'emerald', gives:'book_looting_2',      qty:1 },
      ],
    }
  },
};

/* ─── ESTADO ─────────────────────────────────────────────── */
let G = {};
let combatState = {};
let currentLocData = null;

function newGame() {
  G = {
    hp:10, maxHp:10, xp:0,
    emeralds:5, gold:0,
    world:'forest',
    stacks:{  // stackable items
      wood:10, stone:8, coal:5, wheat:0, wheat_seeds:3,
      iron_ingot:0, gold_ingot:0, diamond:0, emerald:5,
      redstone:0, lapis:0, leather:0, netherite_scrap:0, netherite_ingot:0,
      apple:2, watermelon:0, pumpkin:0, berries:3, carrot:0, potato:0, bread:0,
      cooked_beef:0, rabbit_stew:0, golden_apple:0,
      blaze_rod:0, bone:0, arrow:0, ender_pearl:0, gunpowder:0, string:0,
      spider_eye:0, potion:0,
    },
    books:{},  // { book_mending: 2, ... }
    equipment:[],  // array of gear objects { uid, id, name, emoji, type, mat, dur, maxDur, enchants:[] }
    equipped:{ weapon:null, helmet:null, chest:null, legs:null, boots:null },
    stats:{ kills:0, deaths:0, loots:0, crafted:0, enchanted:0, xpGained:0, explored:0, totalDmg:0 },
    savedAt:null,
    uid:0,
  };
}

function makeGear(id, type, mat, enchants=[]) {
  const durMap = { sword:'sword',axe:'axe',pick:'pick',helmet:'helmet',chest:'chest',legs:'legs',boots:'boots' };
  const matData = MAT[mat]||MAT.wood;
  const maxDur = matData.durability[durMap[type]]||100;
  const names = { sword:'Espada',axe:'Hacha',pick:'Pico',helmet:'Casco',chest:'Peto',legs:'Pantalón',boots:'Botas' };
  const emojis = {
    sword:{wood:'🗡️',stone:'⚔️',iron:'⚔️',gold:'⚔️',diamond:'💫',netherite:'🗡️'},
    axe:  {wood:'🪓',stone:'🪓',iron:'🪓',gold:'🪓',diamond:'🪓',netherite:'🪓'},
    pick: {wood:'⛏️',stone:'⛏️',iron:'⛏️',gold:'⛏️',diamond:'⛏️',netherite:'⛏️'},
    helmet:{leather:'🪖',iron:'⛑️',gold:'🪖',diamond:'💎',netherite:'🪖'},
    chest: {leather:'🧥',iron:'🧥',gold:'🧥',diamond:'💎',netherite:'🧥'},
    legs:  {leather:'👖',iron:'👖',gold:'👖',diamond:'💎',netherite:'👖'},
    boots: {leather:'👟',iron:'👟',gold:'👟',diamond:'💎',netherite:'👟'},
  };
  return {
    uid: ++G.uid,
    id, type, mat,
    name: `${names[type]||type} de ${matData.name}`,
    emoji: (emojis[type]||{})[mat]||'⚔️',
    dur: maxDur, maxDur,
    enchants: [...enchants],
  };
}

/* ─── SAVE / LOAD ────────────────────────────────────────── */
function saveGame() {
  G.savedAt = new Date().toLocaleString('es');
  localStorage.setItem(SAVE_KEY, JSON.stringify(G));
  toast('💾 Guardado');
}

function loadSave() {
  try { const d=localStorage.getItem(SAVE_KEY); return d?JSON.parse(d):null; } catch(e){ return null; }
}
function deleteSave() { localStorage.removeItem(SAVE_KEY); }

/* ─── TÍTULO ─────────────────────────────────────────────── */
function renderTitle() {
  const save = loadSave();
  const btns = document.getElementById('title-btns');
  const prev = document.getElementById('save-preview');
  if (save) {
    btns.innerHTML = '';
    const b1=document.createElement('button'); b1.className='btn-main'; b1.textContent='▶️ Continuar Aventura';
    const b2=document.createElement('button'); b2.className='btn-main secondary'; b2.textContent='🌱 Nueva Partida';
    b1.addEventListener('click',()=>{ G=save; startGame(); });
    b2.addEventListener('click',()=>{
      if(confirm('¿Seguro? Se borrará la partida guardada.')) { deleteSave(); newGame(); startGame(); }
    });
    btns.appendChild(b1); btns.appendChild(b2);
    prev.style.display='';
    prev.innerHTML=`<b>Partida guardada:</b> Mundo: ${WORLDS[save.world]?.n||'?'} · ❤️ ${save.hp}/${save.maxHp} · 💎 ${save.emeralds} · Guardado: ${save.savedAt||'?'}`;
  } else {
    btns.innerHTML='';
    const b=document.createElement('button'); b.className='btn-main'; b.textContent='⚔️ Comenzar Aventura';
    b.addEventListener('click',()=>{ newGame(); startGame(); });
    btns.appendChild(b);
  }
  showScreen('title');
}

function startGame() {
  document.getElementById('game-hud').style.display='';
  showScreen('game');
  renderAll();
  addLog('sys',`⚔️ Aventura iniciada. ¡Explora el mundo!`);
  addLog('good','💡 Haz clic en una ubicación para explorar. Mantente vivo.');
}

function showScreen(n) {
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-'+n)?.classList.add('active');
}

/* ─── HUD ─────────────────────────────────────────────────── */
function updateHUD() {
  document.getElementById('hp-txt').textContent=`${G.hp}/${G.maxHp}`;
  const hearts=Math.ceil(G.hp/2);
  const empties=Math.ceil((G.maxHp-G.hp)/2);
  document.getElementById('hp-hearts').textContent='❤️'.repeat(Math.max(0,hearts))+'🖤'.repeat(Math.max(0,empties));
  document.getElementById('h-em').textContent=G.emeralds;
  document.getElementById('h-gold').textContent=G.gold;
  document.getElementById('h-xp').textContent=G.xp;
  document.getElementById('h-world').textContent=WORLDS[G.world]?.e+' '+WORLDS[G.world]?.n.split(' ')[0];
}

/* ─── RENDER ALL ─────────────────────────────────────────── */
function renderAll() {
  updateHUD();
  renderWorldPanel();
  renderEquipPanel();
  renderInventory();
}

function renderWorldPanel() {
  const w=WORLDS[G.world];
  document.getElementById('wh-icon').textContent=w.e;
  document.getElementById('wh-name').textContent=w.n;
  document.getElementById('wh-sub').textContent=w.biome;

  const grid=document.getElementById('loc-grid');
  grid.innerHTML='';
  w.locations.forEach(loc=>{
    const btn=document.createElement('button');
    btn.className=`loc-btn${loc.special?' special':''}`;
    const dclass={easy:'d-easy',medium:'d-medium',hard:'d-hard',extreme:'d-extreme'}[loc.danger]||'d-easy';
    const dtext={easy:'Fácil',medium:'Medio',hard:'Difícil',extreme:'Extremo'}[loc.danger]||'Normal';
    btn.innerHTML=`<div class="lb-icon">${loc.e}</div><div class="lb-info"><div class="lb-name">${loc.n}</div><div class="lb-desc">${loc.desc}</div><div class="lb-danger ${dclass}">${dtext}</div></div>`;
    btn.addEventListener('click',()=>exploreLocation(loc));
    grid.appendChild(btn);
  });
}

function renderEquipPanel() {
  const slots=[
    {key:'weapon',label:'Arma'},
    {key:'helmet',label:'Casco'},
    {key:'chest',label:'Peto'},
    {key:'legs',label:'Pantalón'},
    {key:'boots',label:'Botas'},
  ];
  const cont=document.getElementById('eq-slots');
  cont.innerHTML='';
  slots.forEach(({key,label})=>{
    const item=G.equipped[key]?G.equipment.find(e=>e.uid===G.equipped[key]):null;
    const div=document.createElement('div');
    div.className=`eq-slot${item?' has-item':''}${item?.enchants?.length?' enchanted':''}`;
    if (item) {
      const pct=Math.round((item.dur/item.maxDur)*100);
      const barClass=pct>50?'eq-dur-green':pct>25?'eq-dur-yellow':'eq-dur-red';
      div.innerHTML=`<div><span class="eq-slot-label">${label}</span><span class="eq-slot-item">${item.emoji} ${item.name}${item.enchants.length?' ✨':''}</span><div class="eq-dur-bar ${barClass}" style="width:${pct}%"></div></div>`;
    } else {
      div.innerHTML=`<div><span class="eq-slot-label">${label}</span><span class="eq-slot-item" style="color:var(--dim)">Vacío</span></div>`;
    }
    div.addEventListener('click',()=>{ if(item) openItemDetail(item); });
    cont.appendChild(div);
  });
}

/* ─── INVENTORY ──────────────────────────────────────────── */
function renderInventory() {
  const cont=document.getElementById('inv-display');
  cont.innerHTML='';

  // Equipment
  if (G.equipment.length>0) {
    const title=document.createElement('div');
    title.className='inv-cat-title';title.textContent='⚔️ Equipos';
    cont.appendChild(title);
    G.equipment.forEach(item=>{
      const isEquipped=Object.values(G.equipped).includes(item.uid);
      const pct=Math.round((item.dur/item.maxDur)*100);
      const barClass=pct>50?'dur-bar-green':pct>25?'dur-bar-yellow':'dur-bar-red';
      const div=document.createElement('div');
      div.className=`inv-item${item.enchants.length?' enchanted-item':''}${isEquipped?' equipped':''}`;
      div.innerHTML=`<div class="ii-em">${item.emoji}</div><div class="ii-info"><div class="ii-name">${item.name}${item.enchants.length?' ✨':''}</div><div class="ii-sub">${item.mat} · ${item.dur}/${item.maxDur} dur${isEquipped?' · EQUIPADO':''}</div><div class="ii-dur-bar ${barClass}" style="width:${pct}%"></div></div>`;
      div.addEventListener('click',()=>openItemDetail(item));
      cont.appendChild(div);
    });
  }

  // Books
  const bookIds=Object.keys(G.books||{}).filter(b=>(G.books[b]||0)>0);
  if (bookIds.length>0) {
    const title=document.createElement('div');
    title.className='inv-cat-title';title.textContent='📚 Libros Encantados';
    cont.appendChild(title);
    bookIds.forEach(bid=>{
      const it=ITEMS[bid];
      if(!it) return;
      const div=document.createElement('div');
      div.className='inv-item enchanted-item';
      div.innerHTML=`<div class="ii-em">${it.e}</div><div class="ii-info"><div class="ii-name">${it.n}</div><div class="ii-sub">Encantamiento disponible</div></div><div class="ii-qty">×${G.books[bid]}</div>`;
      div.addEventListener('click',()=>openEnchantModal(bid));
      cont.appendChild(div);
    });
  }

  // Food
  const foods=Object.keys(G.stacks).filter(k=>ITEMS[k]?.cat==='food'&&G.stacks[k]>0);
  if (foods.length>0) {
    const title=document.createElement('div');
    title.className='inv-cat-title';title.textContent='🍎 Comida';
    cont.appendChild(title);
    foods.forEach(fid=>{
      const it=ITEMS[fid];
      const div=document.createElement('div');
      div.className='inv-item';
      div.innerHTML=`<div class="ii-em">${it.e}</div><div class="ii-info"><div class="ii-name">${it.n}</div><div class="ii-sub">+${it.heal} HP al comer</div></div><div class="ii-qty">×${G.stacks[fid]}</div>`;
      div.addEventListener('click',()=>eatFood(fid));
      cont.appendChild(div);
    });
  }

  // Resources
  const resources=Object.keys(G.stacks).filter(k=>{
    const it=ITEMS[k]; if(!it) return false;
    return (it.cat==='mineral'||it.cat==='material'||it.cat==='crop')&&G.stacks[k]>0;
  });
  if (resources.length>0) {
    const title=document.createElement('div');
    title.className='inv-cat-title';title.textContent='⛏️ Recursos';
    cont.appendChild(title);
    resources.forEach(rid=>{
      const it=ITEMS[rid];
      const div=document.createElement('div');
      div.className='inv-item';
      div.innerHTML=`<div class="ii-em">${it.e}</div><div class="ii-info"><div class="ii-name">${it.n}</div></div><div class="ii-qty">×${G.stacks[rid]}</div>`;
      cont.appendChild(div);
    });
  }

  if (!G.equipment.length && !bookIds.length && !foods.length && !resources.length) {
    cont.innerHTML='<div style="text-align:center;padding:30px;color:var(--dim);font-size:.82rem">Inventario vacío<br><small>Explora para conseguir objetos</small></div>';
  }

  renderStatsPanel();
}

function renderStatsPanel() {
  const d=document.getElementById('stats-display');
  const s=G.stats;
  d.innerHTML=`
    <div class="stat-grid">
      <div class="stat-box"><div class="sv-val">${s.kills}</div><div class="sv-lbl">Mobs muertos</div></div>
      <div class="stat-box"><div class="sv-val">${s.loots}</div><div class="sv-lbl">Botines</div></div>
      <div class="stat-box"><div class="sv-val">${s.crafted}</div><div class="sv-lbl">Crafteados</div></div>
      <div class="stat-box"><div class="sv-val">${s.enchanted}</div><div class="sv-lbl">Encantados</div></div>
      <div class="stat-box"><div class="sv-val">${G.xp}</div><div class="sv-lbl">XP Total</div></div>
      <div class="stat-box"><div class="sv-val">${s.totalDmg}</div><div class="sv-lbl">Daño dado</div></div>
      <div class="stat-box"><div class="sv-val">${G.emeralds}</div><div class="sv-lbl">💎 Esmeraldas</div></div>
      <div class="stat-box"><div class="sv-val">${G.gold}</div><div class="sv-lbl">🪙 Oro</div></div>
    </div>
    <div style="padding:10px;font-size:.72rem;color:var(--muted);text-align:center;font-family:var(--mono)">
      Mundo: ${WORLDS[G.world]?.n}<br>
      Explorado: ${s.explored} zonas
    </div>`;
}

/* ─── EXPLORAR UBICACIÓN ─────────────────────────────────── */
function exploreLocation(loc) {
  currentLocData = loc;
  document.querySelectorAll('.loc-btn').forEach(b=>b.classList.remove('active-loc'));
  event?.currentTarget?.classList?.add('active-loc');
  G.stats.explored++;

  if (loc.type==='village'||loc.type==='shop') {
    openShop(loc.id);
    return;
  }
  if (loc.type==='mine') {
    doMineEncounter(loc);
    return;
  }
  if (loc.type==='dungeon'||loc.type==='structure'||loc.type==='mansion') {
    doStructureView(loc);
    return;
  }
  // Normal explore
  doExploreEncounter(loc);
}

function doExploreEncounter(loc) {
  const roll = Math.random();
  let encounterType;
  const danger = loc.danger;
  const enemyChance = {easy:0.35, medium:0.5, hard:0.65, extreme:0.8}[danger]||0.4;

  if (roll < enemyChance) encounterType='combat';
  else if (roll < enemyChance + 0.5) encounterType='loot';
  else encounterType='loot';

  if (encounterType==='combat') {
    const enemyPool = loc.enemies||['zombie'];
    const eid = enemyPool[Math.floor(Math.random()*enemyPool.length)];
    startCombat(eid, loc);
  } else {
    giveLoot(loc, 2+Math.floor(Math.random()*2));
  }
}

function doMineEncounter(loc) {
  // Mine always gives minerals + possible fight
  const pick = G.equipment.find(e=>e.uid===G.equipped.weapon&&e.type==='pick');
  const hasPick = !!pick;
  const pickLevel = hasPick ? Object.keys(MAT).indexOf(pick.mat) : 0;

  // Fortune & efficiency
  let baseLoot = 2 + Math.floor(Math.random()*3);
  if (pick) {
    const fortEn = pick.enchants.find(e=>ENCHANTS[e]?.fortuneMult);
    const effEn  = pick.enchants.find(e=>ENCHANTS[e]?.efficiencyBonus);
    if (fortEn) baseLoot = Math.ceil(baseLoot * ENCHANTS[fortEn].fortuneMult);
    if (effEn)  baseLoot += ENCHANTS[effEn].efficiencyBonus;
  }

  giveLoot(loc, baseLoot);
  if (pick) useDurability('weapon', 5);

  if (Math.random()<0.4) {
    const eid = (loc.enemies||['zombie'])[Math.floor(Math.random()*(loc.enemies||['zombie']).length)];
    setTimeout(()=>startCombat(eid, loc), 1200);
  }
}

function doStructureView(loc) {
  showCenterView('cv-structure');
  const cv=document.getElementById('cv-structure');
  cv.innerHTML=`
    <div class="struct-header">
      <div class="struct-icon">${loc.e}</div>
      <div class="struct-title">${loc.n}</div>
      <div class="struct-desc">${loc.desc}</div>
    </div>
    <div class="struct-actions">
      <button class="action-btn ab-gold" id="sa-loot">💰 Buscar Tesoros</button>
      <button class="action-btn ab-blue" id="sa-explore">🔍 Explorar</button>
      <button class="action-btn ab-red" id="sa-fight">⚔️ Buscar Mobs</button>
      <button class="action-btn ab-em" id="sa-leave">🚪 Salir</button>
    </div>`;

  cv.querySelector('#sa-loot').addEventListener('click',()=>{ giveLoot(loc,3+Math.floor(Math.random()*3)); addLog('gold',`💰 Tesoros encontrados en ${loc.n}`); });
  cv.querySelector('#sa-explore').addEventListener('click',()=>{ giveLoot(loc,2); if(Math.random()<0.4) toast('🔍 Encontraste un pasaje secreto +1 loot'); });
  cv.querySelector('#sa-fight').addEventListener('click',()=>{
    const eid=(loc.enemies||['zombie'])[Math.floor(Math.random()*(loc.enemies||['zombie']).length)];
    startCombat(eid, loc);
  });
  cv.querySelector('#sa-leave').addEventListener('click',()=>{ showCenterView('cv-home'); addLog('sys','🚪 Saliste de la estructura.'); });
}

/* ─── BOTÍN ──────────────────────────────────────────────── */
function giveLoot(loc, count) {
  G.stats.loots++;
  const lootPool = loc.loot || ['wood','stone','coal'];
  const obtainedItems = [];

  for (let i=0;i<count;i++) {
    const itemId = lootPool[Math.floor(Math.random()*lootPool.length)];
    const qty = 1 + Math.floor(Math.random()*3);

    if (itemId.startsWith('book_')) {
      G.books[itemId] = (G.books[itemId]||0) + 1;
      obtainedItems.push({ id:itemId, qty:1, name:ITEMS[itemId]?.n||itemId, emoji:ITEMS[itemId]?.e||'📚', isBook:true });
    } else if (['iron_sword','diamond_sword','iron_pick','diamond_pick','iron_axe'].includes(itemId)) {
      const parts = itemId.split('_');
      const mat   = parts[0];
      const type  = parts[1];
      if (MAT[mat]) {
        const gear = makeGear(itemId, type, mat);
        G.equipment.push(gear);
        obtainedItems.push({ id:itemId, qty:1, name:gear.name, emoji:gear.emoji });
      }
    } else {
      if (G.stacks[itemId]!==undefined) G.stacks[itemId]=(G.stacks[itemId]||0)+qty;
      else { G.stacks[itemId]=qty; }
      // Handle emeralds → to emerald counter
      if (itemId==='emerald') G.emeralds+=qty;
      obtainedItems.push({ id:itemId, qty, name:ITEMS[itemId]?.n||itemId, emoji:ITEMS[itemId]?.e||'📦' });
    }
  }

  showLootView(obtainedItems, loc.n);
  renderInventory(); updateHUD(); saveGame();
}

function showLootView(items, locName) {
  showCenterView('cv-loot');
  const cv=document.getElementById('cv-loot');
  const itemsHtml = items.map(it=>`
    <div class="loot-item">
      <div class="li-em">${it.emoji}</div>
      <div class="li-info"><div class="li-name">${it.name}</div><div class="li-tier">${it.isBook?'📚 Libro Encantado':'Objeto encontrado'}</div></div>
      <div class="li-qty">×${it.qty}</div>
    </div>`).join('');
  cv.innerHTML=`
    <div class="loot-header"><div class="lh-icon">💰</div><div class="lh-title">BOTÍN — ${locName}</div></div>
    <div class="loot-items">${itemsHtml}</div>
    <button class="btn-main" style="margin-top:10px;width:100%" id="loot-continue">→ Continuar Explorando</button>`;
  cv.querySelector('#loot-continue').addEventListener('click',()=>showCenterView('cv-home'));
}

/* ─── COMBATE ─────────────────────────────────────────────── */
function startCombat(enemyId, locRef) {
  const eData = ENEMIES[enemyId];
  if (!eData) { doExploreEncounter(locRef); return; }

  combatState = {
    enemy: { ...eData, id:enemyId, currentHp:eData.hp, maxHp:eData.hp },
    loc: locRef,
    log: [],
    turn: 0,
  };

  addLog('bad',`⚔️ ¡Encuentro con ${eData.e} ${eData.n}! (${eData.hp} HP)`);
  renderCombat();
}

function renderCombat() {
  showCenterView('cv-combat');
  const cv=document.getElementById('cv-combat');
  const e=combatState.enemy;
  const hpPct=Math.round((e.currentHp/e.maxHp)*100);

  const traitsHtml=e.traits.map(t=>{
    const tc={undead:'tc-undead',explosive:'tc-fire',armored:'tc-armor',boss:'tc-boss',poison:'tc-poison',fire:'tc-fire'}[t]||'tc-armor';
    return `<span class="trait-chip ${tc}">${t}</span>`;
  }).join('');

  const logHtml=combatState.log.slice(-4).map(l=>`<div class="cl-line ${l.type}">${l.msg}</div>`).join('');

  // Weapon options
  const weapons=[
    ...G.equipment.filter(g=>['sword','axe'].includes(g.type)&&g.dur>0).map(g=>`<option value="${g.uid}">${g.emoji} ${g.name} (${g.dur}/${g.maxDur}) ${g.enchants.length?'✨':''}</option>`),
    `<option value="fists">👊 Puños (1 dmg)</option>`
  ].join('');

  // Food for healing
  const foodsHtml=Object.keys(G.stacks).filter(k=>ITEMS[k]?.cat==='food'&&G.stacks[k]>0)
    .map(k=>`<option value="${k}">${ITEMS[k].e} ${ITEMS[k].n} (+${ITEMS[k].heal}HP) ×${G.stacks[k]}</option>`).join('');

  cv.innerHTML=`
    <div class="combat-header">
      <div class="combat-title">⚔️ COMBATE — Turno ${combatState.turn+1}</div>
      <div class="enemy-display">
        <div class="enemy-big-icon">${e.e}</div>
        <div class="enemy-info">
          <div class="enemy-name">${e.n}${e.armor>0?` 🛡️${e.armor}`:''}</div>
          <div class="enemy-hp-bar"><div class="enemy-hp-fill" style="width:${hpPct}%"></div></div>
          <div class="enemy-hp-txt">${e.currentHp}/${e.maxHp} HP</div>
          <div class="enemy-traits">${traitsHtml}</div>
        </div>
      </div>
      <div class="combat-log-mini">${logHtml}</div>
      <div class="weapon-select-row">
        <label>Arma:</label>
        <select id="combat-weapon-sel">${weapons}</select>
      </div>
      ${foodsHtml?`<div class="weapon-select-row"><label>Comer (en combate):</label><select id="food-sel"><option value="">-- Sin comer --</option>${foodsHtml}</select></div>`:''}
    </div>
    <div class="combat-actions">
      <button class="ca-btn ca-blue" id="cb-attack">⚔️ Atacar</button>
      <button class="ca-btn ca-green" id="cb-eat" ${!foodsHtml?'disabled':''}>🍎 Comer</button>
      <button class="ca-btn ca-gold" id="cb-defend">🛡️ Defender (-2 daño)</button>
      <button class="ca-btn ca-red" id="cb-run">🏃 Huir (50%)</button>
    </div>`;

  // Pre-select current weapon
  const sel=cv.querySelector('#combat-weapon-sel');
  if (G.equipped.weapon) { const uid=G.equipped.weapon; if(sel) sel.value=uid; }

  cv.querySelector('#cb-attack')?.addEventListener('click',()=>combatAttack());
  cv.querySelector('#cb-eat')?.addEventListener('click',()=>combatEat());
  cv.querySelector('#cb-defend')?.addEventListener('click',()=>combatDefend());
  cv.querySelector('#cb-run')?.addEventListener('click',()=>combatRun());
}

function calcPlayerDamage(weaponUid) {
  if (weaponUid==='fists') return 1;
  const gear=G.equipment.find(g=>g.uid===+weaponUid);
  if (!gear) return 1;
  const matData=MAT[gear.mat];
  let dmg = gear.type==='axe' ? matData.axeDmg : matData.swordDmg;

  // Enchantments
  gear.enchants.forEach(encId=>{
    const enc=ENCHANTS[encId];
    if (!enc) return;
    if (enc.dmgBonus) dmg+=enc.dmgBonus;
    if (enc.fireDmg && !combatState.enemy.traits?.includes('fire')) dmg+=enc.fireDmg;
    // Smite bonus vs undead
    if (enc.undeadBonus && combatState.enemy.traits?.includes('undead')) dmg+=enc.undeadBonus;
  });

  return Math.max(1, dmg);
}

function calcArmorReduction() {
  let reduction = 0;
  const slots=['helmet','chest','legs','boots'];
  slots.forEach(slot=>{
    const uid=G.equipped[slot];
    if (!uid) return;
    const gear=G.equipment.find(g=>g.uid===uid);
    if (!gear||gear.dur<=0) return;
    const armorBase={leather:1,iron:2,gold:1.5,diamond:3,netherite:3.5}[gear.mat]||1;
    reduction+=armorBase;
    gear.enchants.forEach(encId=>{
      const enc=ENCHANTS[encId];
      if (enc?.dmgReduce) reduction+=enc.dmgReduce;
      if (enc?.blastReduce&&combatState.enemy.traits?.includes('explosive')) reduction+=enc.blastReduce;
      if (enc?.fireReduce&&combatState.enemy.traits?.includes('fire')) reduction+=enc.fireReduce;
    });
  });
  return Math.floor(reduction);
}

function combatAttack(defending=false) {
  const sel=document.getElementById('combat-weapon-sel');
  const weaponUid=sel?sel.value:'fists';
  const dmg=calcPlayerDamage(weaponUid);
  const e=combatState.enemy;

  // Armor reduction on enemy
  let finalDmg=Math.max(1,dmg-e.armor);
  e.currentHp=Math.max(0,e.currentHp-finalDmg);
  G.stats.totalDmg+=finalDmg;

  combatState.log.push({type:'cl-player',msg:`⚔️ Atacaste al ${e.n} por ${finalDmg} daño. (HP: ${e.currentHp}/${e.maxHp})`});
  addLog('good',`⚔️ Atacaste al ${e.e}${e.n} por ${finalDmg} daño.`);

  // Durability on weapon
  if (weaponUid!=='fists') {
    const gear=G.equipment.find(g=>g.uid===+weaponUid);
    if (gear) useDurabilityOnGear(gear, 2);
  }

  // Knockback: chance to reduce counter damage
  let counterMult=1;
  if (weaponUid!=='fists') {
    const gear=G.equipment.find(g=>g.uid===+weaponUid);
    const kb=gear?.enchants.map(e=>ENCHANTS[e]?.knockback||0).reduce((a,b)=>a+b,0)||0;
    counterMult=1-kb;
  }

  if (e.currentHp<=0) {
    enemyDied();
    return;
  }

  // Enemy attacks back
  if (!defending) {
    enemyAttack(counterMult);
  } else {
    // Defending reduces dmg
    enemyAttack(counterMult*0.5);
  }
}

function combatDefend() {
  combatState.log.push({type:'cl-system',msg:`🛡️ Te preparas para defender. Recibirás menos daño.`});
  combatAttack(true);
}

function combatEat() {
  const sel=document.getElementById('food-sel');
  const fid=sel?.value;
  if (!fid||!G.stacks[fid]||G.stacks[fid]<=0) { toast('❌ Sin comida'); return; }
  eatFood(fid);
  combatState.log.push({type:'cl-system',msg:`🍎 Comiste ${ITEMS[fid]?.n||fid}. +${ITEMS[fid]?.heal||2} HP`});
  // Enemy still attacks
  enemyAttack(1);
}

function combatRun() {
  if (Math.random()<0.5) {
    combatState.log.push({type:'cl-player',msg:'🏃 ¡Escapaste del combate!'});
    addLog('sys','🏃 Huiste del combate.');
    showCenterView('cv-home');
  } else {
    combatState.log.push({type:'cl-enemy',msg:'❌ No pudiste huir. ¡El enemigo ataca!'});
    enemyAttack(1);
  }
}

function enemyAttack(mult=1) {
  const e=combatState.enemy;
  let eDmg=Math.max(1,e.dmg-calcArmorReduction());
  eDmg=Math.max(1,Math.round(eDmg*mult));

  // Thorns
  let thorns=0;
  const chestUid=G.equipped.chest;
  if (chestUid) {
    const chestGear=G.equipment.find(g=>g.uid===chestUid);
    if (chestGear) thorns=chestGear.enchants.map(enc=>ENCHANTS[enc]?.reflectDmg||0).reduce((a,b)=>a+b,0);
  }

  G.hp=Math.max(0,G.hp-eDmg);
  combatState.turn++;

  // Durability on armor
  ['helmet','chest','legs','boots'].forEach(slot=>{
    const uid=G.equipped[slot];
    if (uid) {
      const gear=G.equipment.find(g=>g.uid===uid);
      if (gear) useDurabilityOnGear(gear,1);
    }
  });

  combatState.log.push({type:'cl-enemy',msg:`${e.e} ${e.n} te atacó por ${eDmg} daño. Tu HP: ${G.hp}/${G.maxHp}`});
  addLog('bad',`${e.e} ${e.n} te hizo ${eDmg} daño. HP: ${G.hp}/${G.maxHp}`);

  if (thorns>0 && e.currentHp>0) {
    e.currentHp=Math.max(0,e.currentHp-thorns);
    combatState.log.push({type:'cl-player',msg:`🌵 Espinas reflejaron ${thorns} daño al ${e.n}!`});
    if (e.currentHp<=0) { enemyDied(); return; }
  }

  updateHUD();
  if (G.hp<=0) { playerDied(); return; }

  renderCombat();
}

function enemyDied() {
  const e=combatState.enemy;
  G.stats.kills++;
  const xpGain=e.xp;
  G.xp+=xpGain;
  G.stats.xpGained+=xpGain;

  combatState.log.push({type:'cl-player',msg:`🏆 ¡Derrotaste al ${e.n}! +${xpGain} XP`});
  addLog('gold',`🏆 ¡${e.e} ${e.n} derrotado! +${xpGain} XP`);

  // Mending: repair equipped items
  const mendingXp=Math.min(xpGain, 20);
  let mendingApplied=false;
  Object.values(G.equipped).forEach(uid=>{
    if (!uid) return;
    const gear=G.equipment.find(g=>g.uid===uid);
    if (!gear||!gear.enchants.includes('mending')) return;
    const repairAmt=Math.round(mendingXp*1.5);
    gear.dur=Math.min(gear.maxDur, gear.dur+repairAmt);
    addLog('enc',`🔧 Reparación: ${gear.name} recuperó ${repairAmt} durabilidad.`);
    mendingApplied=true;
  });

  // Looting bonus
  let lootMult=1;
  const weaponUid=document.getElementById('combat-weapon-sel')?.value;
  if (weaponUid&&weaponUid!=='fists') {
    const gear=G.equipment.find(g=>g.uid===+weaponUid);
    if (gear) {
      const lb=gear.enchants.map(enc=>ENCHANTS[enc]?.lootBonus||0).reduce((a,b)=>a+b,0);
      lootMult=1+lb;
    }
  }

  // Drops
  const drops=Object.entries(e.drops||{});
  const dropped=[];
  drops.forEach(([itemId,chance])=>{
    if (Math.random()<chance*lootMult) {
      const qty=1+Math.floor(Math.random()*2);
      if (itemId.startsWith('book_')) {
        G.books[itemId]=(G.books[itemId]||0)+1;
        dropped.push(`${ITEMS[itemId]?.e||'📚'}${ITEMS[itemId]?.n||itemId}`);
      } else if (['iron_sword','diamond_sword'].includes(itemId)) {
        const parts=itemId.split('_');
        const gear=makeGear(itemId,parts[1],parts[0]);
        G.equipment.push(gear);
        dropped.push(`${gear.emoji}${gear.name}`);
      } else {
        if (G.stacks[itemId]!==undefined) G.stacks[itemId]=(G.stacks[itemId]||0)+qty;
        else G.stacks[itemId]=qty;
        if (itemId==='emerald') G.emeralds+=qty;
        dropped.push(`${ITEMS[itemId]?.e||'📦'}×${qty}`);
      }
    }
  });

  const dropsStr = dropped.length ? dropped.join(', ') : 'Nada';
  toast(`✅ ${e.e} Derrotado! Drops: ${dropsStr}`);

  renderInventory(); updateHUD();
  showCenterView('cv-home');
  saveGame();
}

function playerDied() {
  addLog('bad',`💀 ¡MORISTE ante ${combatState.enemy?.e} ${combatState.enemy?.n}!`);
  G.stats.deaths++;
  deleteSave();
  setTimeout(()=>showEndScreen(false), 800);
}

/* ─── DURABILIDAD ────────────────────────────────────────── */
function useDurabilityOnGear(gear, amount) {
  if (!gear) return;
  // Unbreaking enchant
  const ub=gear.enchants.find(e=>ENCHANTS[e]?.unbreaking);
  if (ub) {
    const chance=ENCHANTS[ub].unbreaking;
    if (Math.random()<chance) return;
  }
  gear.dur=Math.max(0,gear.dur-amount);
  if (gear.dur<=0) {
    addLog('bad',`💔 ${gear.name} se ha roto!`);
    // Remove from equipped
    Object.keys(G.equipped).forEach(slot=>{ if(G.equipped[slot]===gear.uid) G.equipped[slot]=null; });
    G.equipment=G.equipment.filter(g=>g.uid!==gear.uid);
    toast(`💔 ¡${gear.name} se rompió!`);
  }
}

function useDurability(slot, amount) {
  const uid=G.equipped[slot];
  if (!uid) return;
  const gear=G.equipment.find(g=>g.uid===uid);
  useDurabilityOnGear(gear,amount);
}

/* ─── COMER ──────────────────────────────────────────────── */
function eatFood(itemId) {
  const it=ITEMS[itemId];
  if (!it||!G.stacks[itemId]||G.stacks[itemId]<=0) return;
  const heal=it.heal||2;
  G.hp=Math.min(G.maxHp,G.hp+heal);
  G.stacks[itemId]--;
  toast(`🍎 Comiste ${it.e} ${it.n}. +${heal} HP. HP: ${G.hp}/${G.maxHp}`);
  addLog('good',`🍎 ${it.n}: +${heal} HP → ${G.hp}/${G.maxHp}`);
  updateHUD(); renderInventory();
}

/* ─── TIENDA ─────────────────────────────────────────────── */
let currentShopTab='general';
function openShop(locId) {
  const shopData=SHOPS[locId]||SHOPS.village;
  currentShopTab=shopData.tabs[0];
  showCenterView('cv-shop');
  renderShop(locId, shopData);
}

function renderShop(locId, shopData) {
  const cv=document.getElementById('cv-shop');
  const balance=shopData.items[currentShopTab]?.[0]?.cur==='gold_ingot'?`🪙 Oro: ${G.gold}`:`💎 Esmeraldas: ${G.emeralds}`;
  const tabsHtml=shopData.tabs.map(t=>`<button class="stab${t===currentShopTab?' active':''}" data-t="${t}">${{general:'General',herramientas:'Herramientas',armaduras:'Armaduras',libros:'Libros'}[t]||t}</button>`).join('');
  const items=shopData.items[currentShopTab]||[];
  const itemsHtml=items.map(it=>{
    const curAmt=it.cur==='gold_ingot'?G.gold:G.emeralds;
    const canBuy=curAmt>=it.cost;
    const curEmoji=it.cur==='gold_ingot'?'🪙':'💎';
    return `<div class="shop-it"><div class="si-em">${it.e}</div><div class="si-info"><div class="si-name">${it.n}</div><div class="si-desc">${it.desc||''}</div></div><div class="si-price">${it.cost} ${curEmoji}</div><button class="btn-shop-buy" data-sid="${it.id||it.n}" ${!canBuy?'disabled':''}>Comprar</button></div>`;
  }).join('');

  cv.innerHTML=`
    <div class="shop-header"><div class="sh-icon">${shopData.icon}</div><div class="sh-title">${shopData.name}</div><div class="sh-balance">${balance}</div></div>
    <div class="shop-tabs">${tabsHtml}</div>
    <div class="shop-items-grid">${itemsHtml||'<div style="padding:20px;text-align:center;color:var(--dim)">Sin stock</div>'}</div>
    <button class="btn-main secondary" style="margin-top:12px;width:100%" id="shop-leave">🚪 Salir de la tienda</button>`;

  cv.querySelector('#shop-leave')?.addEventListener('click',()=>showCenterView('cv-home'));
  cv.querySelectorAll('.stab').forEach(b=>b.addEventListener('click',()=>{ currentShopTab=b.dataset.t; renderShop(locId,shopData); }));
  cv.querySelectorAll('.btn-shop-buy').forEach((btn,idx)=>{
    btn.addEventListener('click',()=>buyShopItem(items[idx], locId, shopData));
  });
}

function buyShopItem(it, locId, shopData) {
  const cur=it.cur==='gold_ingot'?'gold':'emeralds';
  if (G[cur]<it.cost) { toast('❌ Sin fondos'); return; }
  G[cur]-=it.cost;

  if (it.type&&['sword','axe','pick','helmet','chest','legs','boots'].includes(it.type)) {
    const gear=makeGear(it.id||it.type+'_'+it.mat, it.type, it.mat);
    G.equipment.push(gear);
    toast(`✅ Compraste ${gear.emoji} ${gear.name}`);
    addLog('gold',`🛒 Compraste: ${gear.name}`);
  } else if (it.gives) {
    if (it.gives.startsWith('book_')) {
      G.books[it.gives]=(G.books[it.gives]||0)+(it.qty||1);
    } else {
      G.stacks[it.gives]=(G.stacks[it.gives]||0)+(it.qty||1);
      if (it.gives==='emerald') G.emeralds+=(it.qty||1);
    }
    toast(`✅ Compraste ${ITEMS[it.gives]?.e||'📦'} ${ITEMS[it.gives]?.n||it.gives} ×${it.qty||1}`);
    addLog('gold',`🛒 Compraste: ${ITEMS[it.gives]?.n||it.gives}`);
  }

  renderInventory(); updateHUD();
  renderShop(locId, shopData);
  saveGame();
}

/* ─── CRAFTEO ────────────────────────────────────────────── */
let currentCraftCat='armas';
function renderCraftModal() {
  const list=document.getElementById('craft-list');
  list.innerHTML='';
  const filtered=Object.entries(RECIPES).filter(([,r])=>r.cat===currentCraftCat);

  filtered.forEach(([id,recipe])=>{
    const canCraft=checkCanCraft(recipe);
    const card=document.createElement('div');
    card.className=`craft-card${!canCraft?' cant-craft':''}`;

    const needsHtml=Object.entries(recipe.needs).map(([item,qty])=>{
      const have=G.stacks[item]||G.equipment.filter(e=>e.id===item).length||0;
      const ok=have>=qty;
      const en=ITEMS[item]?.e||RECIPES[item]?.e||'📦';
      const nm=ITEMS[item]?.n||RECIPES[item]?.n||item;
      return `<div class="cn-chip ${ok?'cn-ok':'cn-bad'}">${en}×${qty}${!ok?`(${have})`:''}</div>`;
    }).join('');

    card.innerHTML=`
      <div class="cc-top">
        <div class="cc-em">${recipe.e}</div>
        <div><div class="cc-name">${recipe.n}</div><div class="cc-mat">${recipe.mat?MAT[recipe.mat]?.name:'—'}</div></div>
      </div>
      <div class="cc-needs">${needsHtml}</div>`;

    if (canCraft) card.addEventListener('click',()=>doCraft(id,recipe));
    list.appendChild(card);
  });
}

function checkCanCraft(recipe) {
  return Object.entries(recipe.needs).every(([item,qty])=>{
    if (G.stacks[item]!==undefined) return G.stacks[item]>=qty;
    // Check if it's a craftable item in equipment
    const inEquip=G.equipment.filter(e=>e.id===item).length;
    return inEquip>=qty;
  });
}

function doCraft(id, recipe) {
  if (!checkCanCraft(recipe)) { toast('❌ Sin materiales'); return; }

  // Consume materials
  Object.entries(recipe.needs).forEach(([item,qty])=>{
    if (G.stacks[item]!==undefined) G.stacks[item]-=qty;
    else {
      // consume from equipment (for netherite upgrade)
      let toConsume=qty;
      G.equipment=G.equipment.filter(g=>{
        if (g.id===item&&toConsume>0) { toConsume--; return false; }
        return true;
      });
    }
  });

  // Give result
  if (recipe.type==='food') {
    G.stacks[recipe.gives]=(G.stacks[recipe.gives]||0)+1;
    toast(`✅ Crafteaste ${ITEMS[recipe.gives]?.e||'🍞'} ${ITEMS[recipe.gives]?.n||recipe.gives}`);
  } else if (recipe.type==='misc') {
    G.stacks[recipe.gives]=(G.stacks[recipe.gives]||0)+1;
    toast(`✅ Crafteaste ${ITEMS[recipe.gives]?.e||'📦'} ${ITEMS[recipe.gives]?.n||recipe.gives}`);
  } else {
    const gear=makeGear(id, recipe.type, recipe.mat);
    G.equipment.push(gear);
    toast(`✅ Crafteaste ${gear.emoji} ${gear.name}!`);
    addLog('gold',`⚗️ Crafteaste: ${gear.name}`);
  }

  G.stats.crafted++;
  renderCraftModal();
  renderInventory(); updateHUD(); saveGame();
}

/* ─── ITEM DETAIL ────────────────────────────────────────── */
function openItemDetail(gear) {
  const isEquipped=Object.values(G.equipped).includes(gear.uid);
  const equippedSlot=Object.keys(G.equipped).find(k=>G.equipped[k]===gear.uid);
  const pct=Math.round((gear.dur/gear.maxDur)*100);

  document.getElementById('ii-icon').textContent=gear.emoji;
  document.getElementById('ii-name').textContent=gear.name;
  document.getElementById('ii-tier').textContent=`${MAT[gear.mat]?.name||gear.mat} · ${gear.type} ${isEquipped?'· ✅ EQUIPADO':''}`;

  const body=document.getElementById('item-detail-body');
  const encHtml=gear.enchants.length
    ? gear.enchants.map(e=>`<span class="ench-tag">✨ ${ENCHANTS[e]?.name||e}</span>`).join('')
    : '<span style="color:var(--dim);font-size:.78rem">Sin encantamientos</span>';

  const matData=MAT[gear.mat];
  const atk=gear.type==='axe'?matData.axeDmg:gear.type==='sword'?matData.swordDmg:0;

  body.innerHTML=`
    <div class="id-stat-row">
      <div class="id-stat"><div class="ids-val">${pct}%</div><div class="ids-lbl">Durabilidad</div></div>
      <div class="id-stat"><div class="ids-val">${gear.dur}/${gear.maxDur}</div><div class="ids-lbl">Usos restantes</div></div>
      ${atk>0?`<div class="id-stat"><div class="ids-val">${atk}</div><div class="ids-lbl">Daño base</div></div>`:''}
    </div>
    <div><div style="font-size:.72rem;color:var(--muted);margin-bottom:5px;font-family:var(--mono)">ENCANTAMIENTOS</div><div class="enchant-list">${encHtml}</div></div>
    <div class="id-actions">
      ${!isEquipped?`<button class="idb-btn idb-equip" id="idb-equip">⚔️ Equipar</button>`:''}
      ${isEquipped?`<button class="idb-btn idb-unequip" id="idb-unequip">🔄 Desequipar</button>`:''}
      <button class="idb-btn idb-enchant" id="idb-enc">📖 Aplicar Encantamiento</button>
    </div>`;

  body.querySelector('#idb-equip')?.addEventListener('click',()=>{ equipItem(gear); document.getElementById('modal-item').classList.add('hidden'); });
  body.querySelector('#idb-unequip')?.addEventListener('click',()=>{ G.equipped[equippedSlot]=null; renderEquipPanel(); renderInventory(); document.getElementById('modal-item').classList.add('hidden'); toast(`🔄 Desequipaste ${gear.name}`); });
  body.querySelector('#idb-enc')?.addEventListener('click',()=>{ document.getElementById('modal-item').classList.add('hidden'); openEnchantForItem(gear); });

  document.getElementById('modal-item').classList.remove('hidden');
}

function equipItem(gear) {
  const slotMap={sword:'weapon',axe:'weapon',pick:'weapon',helmet:'helmet',chest:'chest',legs:'legs',boots:'boots'};
  const slot=slotMap[gear.type];
  if (!slot) return;
  G.equipped[slot]=gear.uid;
  toast(`✅ Equipaste ${gear.emoji} ${gear.name}`);
  addLog('good',`⚔️ Equipaste: ${gear.name}`);
  renderEquipPanel(); renderInventory(); updateHUD();
}

/* ─── ENCANTAMIENTOS ─────────────────────────────────────── */
let enchantTargetGear=null;
function openEnchantModal(bookId) {
  // Show all equipment to select where to apply
  const bookItem=ITEMS[bookId];
  if (!bookItem||(G.books[bookId]||0)<=0) return;
  const encId=bookItem.enchant;
  const enc=ENCHANTS[encId];
  if (!enc) return;

  document.getElementById('enc-title').textContent=`📖 Encantar con ${enc.name}`;
  const body=document.getElementById('enc-body');

  const compatible=G.equipment.filter(gear=>{
    const appliesTo=enc.appliesTo||[];
    return appliesTo.includes(gear.type)||appliesTo.includes('all');
  });

  if (!compatible.length) {
    body.innerHTML=`<div style="padding:16px;text-align:center;color:var(--muted)">No tienes equipo compatible con este encantamiento.<br><small>${enc.appliesTo?.join(', ')||'todos'}</small></div>`;
    document.getElementById('modal-enchant').classList.remove('hidden');
    return;
  }

  body.innerHTML=`
    <div style="padding:12px 16px">
      <div class="enc-book-list">
        ${compatible.map(gear=>{
          const alreadyHas=gear.enchants.includes(encId);
          return `<div class="enc-book ${alreadyHas?'cant-enc':''}" data-uid="${gear.uid}">
            <div class="eb-em">${gear.emoji}</div>
            <div class="eb-info"><div class="eb-name">${gear.name}</div><div class="eb-desc">${alreadyHas?'Ya tiene este encantamiento':'Compatible — clic para encantar'}</div></div>
            <div class="eb-qty">${G.books[bookId]}× libros</div>
          </div>`;
        }).join('')}
      </div>
    </div>`;

  body.querySelectorAll('.enc-book:not(.cant-enc)').forEach(div=>{
    div.addEventListener('click',()=>{
      const uid=+div.dataset.uid;
      applyEnchantment(uid, encId, bookId);
      document.getElementById('modal-enchant').classList.add('hidden');
    });
  });

  document.getElementById('modal-enchant').classList.remove('hidden');
}

function openEnchantForItem(gear) {
  const availableBooks=Object.keys(G.books||{}).filter(b=>(G.books[b]||0)>0&&ITEMS[b]?.enchant);
  if (!availableBooks.length) { toast('❌ No tienes libros encantados'); return; }

  document.getElementById('enc-title').textContent=`📖 Encantar ${gear.name}`;
  const body=document.getElementById('enc-body');

  const compatible=availableBooks.filter(bid=>{
    const encId=ITEMS[bid]?.enchant;
    const enc=ENCHANTS[encId];
    if (!enc) return false;
    return enc.appliesTo?.includes(gear.type)||enc.appliesTo?.includes('all');
  });

  if (!compatible.length) {
    body.innerHTML=`<div style="padding:16px;text-align:center;color:var(--muted)">No tienes libros compatibles con este equipo.</div>`;
    document.getElementById('modal-enchant').classList.remove('hidden');
    return;
  }

  body.innerHTML=`
    <div style="padding:12px 16px">
      <div class="enc-item-preview">${gear.emoji} <b>${gear.name}</b>${gear.enchants.length?` ✨ ${gear.enchants.length} encant.`:''}</div>
      <div class="enc-book-list">
        ${compatible.map(bid=>{
          const encId=ITEMS[bid].enchant;
          const enc=ENCHANTS[encId];
          const alreadyHas=gear.enchants.includes(encId);
          return `<div class="enc-book ${alreadyHas?'cant-enc':''}" data-bid="${bid}">
            <div class="eb-em">${ITEMS[bid].e}</div>
            <div class="eb-info"><div class="eb-name">${enc?.name||encId}</div><div class="eb-desc">${alreadyHas?'Ya aplicado':enc?.desc||''}</div></div>
            <div class="eb-qty">×${G.books[bid]}</div>
          </div>`;
        }).join('')}
      </div>
    </div>`;

  body.querySelectorAll('.enc-book:not(.cant-enc)').forEach(div=>{
    div.addEventListener('click',()=>{
      const bid=div.dataset.bid;
      const encId=ITEMS[bid]?.enchant;
      applyEnchantment(gear.uid, encId, bid);
      document.getElementById('modal-enchant').classList.add('hidden');
    });
  });

  document.getElementById('modal-enchant').classList.remove('hidden');
}

function applyEnchantment(gearUid, encId, bookId) {
  const gear=G.equipment.find(g=>g.uid===gearUid);
  if (!gear||gear.enchants.includes(encId)) return;
  gear.enchants.push(encId);
  G.books[bookId]--;
  if (G.books[bookId]<=0) delete G.books[bookId];
  G.stats.enchanted++;
  toast(`✨ ${gear.name} encantado con ${ENCHANTS[encId]?.name||encId}!`);
  addLog('enc',`✨ Encantamiento: ${ENCHANTS[encId]?.name||encId} aplicado a ${gear.name}`);
  renderInventory(); renderEquipPanel(); saveGame();
}

/* ─── WORLD PICKER ───────────────────────────────────────── */
function renderWorldPicker() {
  const grid=document.getElementById('world-pick-grid');
  grid.innerHTML='';
  Object.entries(WORLDS).forEach(([id,w])=>{
    const btn=document.createElement('div');
    btn.className=`world-btn${id===G.world?' active-world':''}`;
    btn.innerHTML=`<div class="wb-icon">${w.e}</div><div class="wb-name">${w.n}</div><div class="wb-desc">${w.biome} · Peligro: ${w.danger}</div>`;
    btn.addEventListener('click',()=>{
      G.world=id;
      document.getElementById('modal-world').classList.add('hidden');
      renderWorldPanel(); renderAll();
      addLog('sys',`🌍 Viajaste a ${w.n}.`);
      saveGame();
    });
    grid.appendChild(btn);
  });
}

/* ─── FIN ────────────────────────────────────────────────── */
function showEndScreen(survived=false) {
  document.getElementById('game-hud').style.display='none';

  const kills=G.stats.kills;
  const crafted=G.stats.crafted;
  const loots=G.stats.loots;

  let icon,title,sub,rankClass,rankText;
  if (!survived) {
    icon='💀'; title='FIN DE LA AVENTURA';
    sub=`Fuiste derrotado, pero tu leyenda vive. ${kills} mobs eliminados, ${loots} botines encontrados.`;
    if (kills>=20) { rankClass='er-hero'; rankText='⭐ Rango: HÉROE CAÍDO — Moriste con honor'; }
    else if (kills>=10) { rankClass='er-adventurer'; rankText='🗡️ Rango: AVENTURERO CAÍDO'; }
    else { rankClass='er-novice'; rankText='🌱 Rango: NOVATO CAÍDO'; }
  } else {
    icon='🏆'; title='¡LEYENDA MINECRAFT!';
    sub=`Sobreviviste la aventura. ${kills} mobs, ${crafted} objetos crafteados.`;
    rankClass='er-legend'; rankText='👑 LEYENDA DEL MUNDO';
  }

  document.getElementById('end-icon').textContent=icon;
  document.getElementById('end-title').textContent=title;
  document.getElementById('end-sub').textContent=sub;
  document.getElementById('end-rank').textContent=rankText;
  document.getElementById('end-rank').className='end-rank '+rankClass;
  document.getElementById('end-stats').innerHTML=`
    <div class="end-stat"><div class="es-val">${kills}</div><div class="es-lbl">Mobs muertos</div></div>
    <div class="end-stat"><div class="es-val">${loots}</div><div class="es-lbl">Botines</div></div>
    <div class="end-stat"><div class="es-val">${crafted}</div><div class="es-lbl">Crafteados</div></div>`;

  showScreen('end');
}

/* ─── HELPERS ────────────────────────────────────────────── */
function showCenterView(id) {
  document.querySelectorAll('.cv').forEach(v=>{ v.classList.remove('active-cv'); v.style.display='none'; });
  const el=document.getElementById(id);
  if (el) { el.style.display='flex'; el.classList.add('active-cv'); }
}

function addLog(type,msg) {
  const feed=document.getElementById('log-display');
  if (!feed) return;
  const div=document.createElement('div');
  const cls={good:'ll-good',bad:'ll-bad',gold:'ll-gold',sys:'ll-sys',enc:'ll-enc'}[type]||'ll-sys';
  div.className=`log-line ${cls}`;
  div.textContent=msg;
  feed.appendChild(div);
  while(feed.children.length>60) feed.removeChild(feed.firstChild);
  feed.scrollTop=feed.scrollHeight;
}

function toast(msg) {
  const el=document.getElementById('toast');
  el.textContent=msg; el.classList.add('show');
  clearTimeout(el._t); el._t=setTimeout(()=>el.classList.remove('show'),2700);
}

/* ─── BG CANVAS ──────────────────────────────────────────── */
(function(){
  const c=document.getElementById('bgCanvas');
  if(!c) return;
  const ctx=c.getContext('2d');
  const dpi=Math.max(1,devicePixelRatio||1);
  let w,h,pts;
  const init=()=>{
    w=c.width=innerWidth*dpi; h=c.height=innerHeight*dpi;
    pts=Array.from({length:70},()=>({
      x:Math.random()*w,y:Math.random()*h,
      r:(.2+Math.random()*.9)*dpi,s:.04+Math.random()*.15,
      a:.03+Math.random()*.09,
      hue:200+Math.random()*60,
    }));
  };
  const tick=()=>{
    ctx.clearRect(0,0,w,h);
    pts.forEach(p=>{
      p.y+=p.s; p.x+=Math.sin(p.y*.004)*.2;
      if(p.y>h){p.y=-6;p.x=Math.random()*w}
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`hsla(${p.hue},70%,55%,${p.a})`;ctx.fill();
    });
    requestAnimationFrame(tick);
  };
  init(); tick();
  addEventListener('resize',init);
})();

/* ─── NAVBAR ─────────────────────────────────────────────── */
const navT=document.getElementById('navToggle');
const navL=document.getElementById('navLinks');
navT?.addEventListener('click',e=>{e.stopPropagation();navL.classList.toggle('open')});
document.addEventListener('click',e=>{if(!navT?.contains(e.target)&&!navL?.contains(e.target))navL?.classList.remove('open')});

/* ─── INIT ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded',()=>{
  // Right panel tabs
  document.querySelectorAll('.rpt').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('.rpt').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('.rp-section').forEach(s=>{ s.classList.remove('active'); s.style.display='none'; });
      btn.classList.add('active');
      const id='rp-'+btn.dataset.rpt;
      const sec=document.getElementById(id);
      if (sec) { sec.classList.add('active'); sec.style.display='flex'; }
      if (btn.dataset.rpt==='stats') renderStatsPanel();
    });
  });

  // World change
  document.getElementById('btn-change-world')?.addEventListener('click',()=>{
    renderWorldPicker();
    document.getElementById('modal-world').classList.remove('hidden');
  });
  document.getElementById('world-close')?.addEventListener('click',()=>document.getElementById('modal-world').classList.add('hidden'));

  // Craft modal
  document.getElementById('btn-craft-open')?.addEventListener('click',()=>{
    renderCraftModal();
    document.getElementById('modal-craft').classList.remove('hidden');
  });
  document.getElementById('craft-close')?.addEventListener('click',()=>document.getElementById('modal-craft').classList.add('hidden'));
  document.querySelectorAll('.ccat').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('.ccat').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      currentCraftCat=btn.dataset.cc;
      renderCraftModal();
    });
  });

  // Item & enchant modals close
  document.getElementById('item-close')?.addEventListener('click',()=>document.getElementById('modal-item').classList.add('hidden'));
  document.getElementById('enc-close')?.addEventListener('click',()=>document.getElementById('modal-enchant').classList.add('hidden'));

  // Overlay click closes
  document.querySelectorAll('.modal-ov').forEach(ov=>ov.addEventListener('click',e=>{ if(e.target===ov) ov.classList.add('hidden'); }));

  // Save
  document.getElementById('btn-save-hud')?.addEventListener('click',saveGame);

  // End screen restart
  document.getElementById('btn-end-restart')?.addEventListener('click',()=>{ renderTitle(); });

  renderTitle();
});