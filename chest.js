'use strict';
/* ═══════════════════════════════════════════════════════════
   MOONVEIL — COFRES v4.0  ★  chest.js
   SVG cofres espectaculares + lógica de juego completa
═══════════════════════════════════════════════════════════ */

const KEYS_LS    = 'mv_chest_keys_v1';
const HISTORY_LS = 'mv_chest_history_v1';
const MAILBOX_LS = 'mv_chest_mailbox_v1';

/* ─────────────────────────────────────
   DEFINICIÓN DE COFRES
───────────────────────────────────── */
const CHESTS = {
  common:{
    name:'Cofre Común',emoji:'📦',type:'permanent',rarity:'common',
    key:{id:'key_common',name:'Llave Superestrella',emoji:'⭐',color:'#94A3B8'},
    p:{body:'#6B4E2A',bodyHi:'#9A7240',bodySh:'#3A2810',lid:'#7A5C33',lidHi:'#A8844A',lidSh:'#3E2C16',band:'#2E200A',bolt:'#C8A84B',boltHi:'#F0CC70',lock:'#3A2810',lockHi:'#5A3E1A',glow:'rgba(200,168,75,1)'},
    sparkles:['✦','◈'],
    rewards:[
      {name:'Esmeraldas',emoji:'💎',amount:[1,3],chance:35},
      {name:'Lingotes de Cobre',emoji:'🟫',amount:[2,5],chance:30},
      {name:'Pepitas de Hierro',emoji:'⚙️',amount:[1,3],chance:20},
      {name:'Pepitas de Oro',emoji:'⭐',amount:[1,2],chance:10},
      {name:'Llave Superestrella Brillante I',emoji:'💫',amount:[1,5],chance:5,isKey:true,keyId:'key_rare'},
      {name:'Llave Superestrella Brillante II',emoji:'💫',amount:[10,10],chance:1,isKey:true,keyId:'key_rare'},
    ]
  },
  rare:{
    name:'Cofre Raro',emoji:'🔷',type:'permanent',rarity:'rare',
    key:{id:'key_rare',name:'Llave Superestrella Brillante',emoji:'💫',color:'#38BDF8'},
    p:{body:'#0A2240',bodyHi:'#1A4878',bodySh:'#040E1C',lid:'#0D2E58',lidHi:'#1E5090',lidSh:'#060E20',band:'#061020',bolt:'#56CCF2',boltHi:'#A0E8FF',lock:'#040C18',lockHi:'#0E2A44',glow:'rgba(56,189,248,1)'},
    sparkles:['✦','◇'],
    rewards:[
      {name:'Lingotes de Cobre',emoji:'🟫',amount:[2,10],chance:60},
      {name:'Pepitas de Oro',emoji:'⭐',amount:[2,6],chance:28},
      {name:'Esmeraldas',emoji:'💎',amount:[5,12],chance:24},
      {name:'Lingotes de Cobre',emoji:'🟫',amount:[5,10],chance:20},
      {name:'Pepitas de Hierro',emoji:'⚙️',amount:[3,7],chance:15},
      {name:'Diamantes Especiales',emoji:'💠',amount:[1,2],chance:10},
      {name:'Llave Superestrella Especial',emoji:'✨',amount:[1,1],chance:3,isKey:true,keyId:'key_special'},
    ]
  },
  special:{
    name:'Cofre Especial',emoji:'🌿',type:'permanent',rarity:'special',
    key:{id:'key_special',name:'Llave Superestrella Especial',emoji:'✨',color:'#22C55E'},
    p:{body:'#0E2E16',bodyHi:'#1E5228',bodySh:'#060E08',lid:'#143820',lidHi:'#266634',lidSh:'#08100C',band:'#081408',bolt:'#4ADE80',boltHi:'#88F4AA',lock:'#040C06',lockHi:'#0E2412',glow:'rgba(74,222,128,1)'},
    sparkles:['✿','✦'],
    rewards:[
      {name:'Lingotes de Cobre',emoji:'🟫',amount:[8,20],chance:60},
      {name:'Pepitas de Oro',emoji:'⭐',amount:[5,12],chance:25},
      {name:'Diamantes Especiales',emoji:'💠',amount:[1,3],chance:20},
      {name:'Lingotes de Inframundo',emoji:'🔥',amount:[2,5],chance:20},
      {name:'Esmeraldas',emoji:'💎',amount:[10,20],chance:18},
      {name:'Pepitas Rápidas',emoji:'⚡',amount:[100,500],chance:12},
      {name:'Llave Superestrella Épica',emoji:'🔮',amount:[1,1],chance:5,isKey:true,keyId:'key_epic'},
    ]
  },
  epic:{
    name:'Cofre Épico',emoji:'🔮',type:'permanent',rarity:'epic',
    key:{id:'key_epic',name:'Llave Superestrella Épica',emoji:'🔮',color:'#A855F7'},
    p:{body:'#260A46',bodyHi:'#4A1880',bodySh:'#100420',lid:'#2E0E58',lidHi:'#5A2098',lidSh:'#140828',band:'#100428',bolt:'#C084FC',boltHi:'#E8C0FF',lock:'#0C0418',lockHi:'#200838',glow:'rgba(192,132,252,1)'},
    sparkles:['◈','✦'],
    rewards:[
      {name:'Lingotes de Cobre',emoji:'🟫',amount:[10,30],chance:60},
      {name:'Pepitas de Oro',emoji:'⭐',amount:[10,20],chance:22},
      {name:'Diamantes',emoji:'💠',amount:[4,8],chance:20},
      //{name:'Lingotes de Inframundo',emoji:'🔥',amount:[1,4],chance:18},
      {name:'Netherita',emoji:'🌑',amount:[1,4],chance:15},
      //{name:'Pepitas Rápidas',emoji:'⚡',amount:[500,2000],chance:15},
      {name:'Llave Superestrella Legendaria',emoji:'👑',amount:[1,1],chance:10,isKey:true,keyId:'key_legendary'},
    ]
  },
  legendary:{
    name:'Cofre Legendario',emoji:'👑',type:'permanent',rarity:'legendary',
    key:{id:'key_legendary',name:'Llave Superestrella Legendaria',emoji:'👑',color:'#FBBF24'},
    p:{body:'#4A3006',bodyHi:'#8C5C14',bodySh:'#1E1202',lid:'#5C3A08',lidHi:'#A06C18',lidSh:'#281602',band:'#2A1A04',bolt:'#F0C840',boltHi:'#FFE880',lock:'#1A0E02',lockHi:'#3C2408',glow:'rgba(251,191,36,1)'},
    sparkles:['✦','★'],
    rewards:[
      {name:'Lingotes de Cobre',emoji:'🟫',amount:[20,64],chance:60},
      {name:'Diamantes',emoji:'💠',amount:[5,20],chance:20},
      {name:'Netherita',emoji:'🌑',amount:[2,5],chance:18},
      //{name:'Lingotes de Inframundo',emoji:'🔥',amount:[10,20],chance:17},
      //{name:'Pepitas Rápidas',emoji:'⚡',amount:[2000,10000],chance:15},
      {name:'Pepitas de Oro',emoji:'⭐',amount:[20,30],chance:15},
      {name:'Esmeraldas',emoji:'💎',amount:[30,64],chance:10},
      {name:'Llave Superestrella Legendaria',emoji:'👑',amount:[1,1],chance:5,isKey:true,keyId:'key_legendary'},
    ]
  },
  /*newyear:{
    name:'Cofre de Año Nuevo',emoji:'🎆',type:'event',rarity:'event',
    key:{id:'key_newyear',name:'Llave Superestrella de Año Nuevo',emoji:'🎆',color:'#FFD700'},
    p:{body:'#080828',bodyHi:'#14147A',bodySh:'#020210',lid:'#0E0E4A',lidHi:'#1C1C98',lidSh:'#060622',band:'#040418',bolt:'#FFD700',boltHi:'#FFED80',lock:'#020210',lockHi:'#0A0A32',glow:'rgba(255,215,0,1)'},
    sparkles:['✦','🎇'],
    dates:[{start:new Date('2025-12-31'),end:new Date('2026-01-06T23:59:59')},{start:new Date('2026-12-31'),end:new Date('2027-01-06T23:59:59')}],
    rewards:[
      {name:'Pepitas de Oro',emoji:'⭐',amount:[10,25],chance:25},
      {name:'Esmeraldas',emoji:'💎',amount:[15,30],chance:25},
      {name:'Diamantes Especiales',emoji:'💠',amount:[2,5],chance:20},
      {name:'Pepitas Rápidas',emoji:'⚡',amount:[500,2000],chance:18},
      {name:'Lingotes de Inframundo',emoji:'🔥',amount:[5,12],chance:12},
    ]
  },*/
  /*valentine:{
    name:'Cofre de San Valentín',emoji:'💝',type:'event',rarity:'event',
    key:{id:'key_valentine',name:'Llave Superestrella Rosa',emoji:'💝',color:'#F472B6'},
    p:{body:'#4A0A1E',bodyHi:'#8A1838',bodySh:'#200408',lid:'#6A1030',lidHi:'#A01848',lidSh:'#300810',band:'#2E0612',bolt:'#F472B6',boltHi:'#FFB0D8',lock:'#1E0408',lockHi:'#3E0C18',glow:'rgba(244,114,182,1)'},
    sparkles:['💕','✦'],
    dates:[{start:new Date('2026-02-10'),end:new Date('2026-02-16T23:59:59')},{start:new Date('2027-02-10'),end:new Date('2027-02-16T23:59:59')}],
    rewards:[
      {name:'Esmeraldas',emoji:'💎',amount:[10,20],chance:28},
      {name:'Pepitas de Oro',emoji:'⭐',amount:[8,18],chance:25},
      {name:'Diamantes Especiales',emoji:'💠',amount:[2,4],chance:22},
      {name:'Pepitas Rápidas',emoji:'⚡',amount:[300,1200],chance:15},
      {name:'Llave Superestrella Rosa',emoji:'💝',amount:[1,1],chance:10,isKey:true,keyId:'key_valentine'},
    ]
  },*/
  cat:{
    name:'Cofre Gatuno',emoji:'😺',type:'event',rarity:'event',
    key:{id:'key_cat',name:'Llave Superestrella Gatuna',emoji:'😺',color:'#FB923C'},
    p:{body:'#4A2808',bodyHi:'#885010',bodySh:'#200C02',lid:'#6A3A10',lidHi:'#A05C18',lidSh:'#301808',band:'#2E1806',bolt:'#FB923C',boltHi:'#FFC080',lock:'#1E1004',lockHi:'#3C2408',glow:'rgba(251,146,60,1)'},
    sparkles:['🐾','✦'],
    dates:[{start:new Date('2026-02-17'),end:new Date('2026-02-22T23:59:59')},{start:new Date('2026-08-17'),end:new Date('2026-08-22T23:59:59')}],
    rewards:[
      {name:'Lingotes de Cobre',emoji:'🟫',amount:[20,64],chance:30},
      {name:'Esmeraldas',emoji:'💎',amount:[10,64],chance:30},
      {name:'Pepitas de Oro',emoji:'⭐',amount:[10,64],chance:25},
      //{name:'Pepitas Rápidas',emoji:'⚡',amount:[200,800],chance:22},
      {name:'Diamantes',emoji:'💠',amount:[10,40],chance:15},
      {name:'Llave Superestrella Gatuna',emoji:'😺',amount:[1,2],chance:5,isKey:true,keyId:'key_cat'},
      {name:'¿Mala Suerte?¿O el gato se los llevo?',emoji:'🟫',amount:[0,1],chance:1},
    ]
  },
  spring:{
    name:'Cofre de Primavera',emoji:'🌸',type:'event',rarity:'event',
    key:{id:'key_spring',name:'Llave Superestrella Primaveral',emoji:'🌸',color:'#86EFAC'},
    p:{body:'#0C2010',bodyHi:'#1C4020',bodySh:'#040A06',lid:'#143018',lidHi:'#265828',lidSh:'#081008',band:'#081408',bolt:'#86EFAC',boltHi:'#B8FFCC',lock:'#040806',lockHi:'#0C2010',glow:'rgba(134,239,172,1)'},
    sparkles:['🌸','✿'],
    dates:[{start:new Date('2026-03-20'),end:new Date('2026-03-24T23:59:59')}],
    rewards:[
      {name:'Lingotes de Cobre',emoji:'🟫',amount:[30,50],chance:10},
      {name:'Esmeraldas',emoji:'💎',amount:[12,24],chance:30},
      {name:'Pepitas de Oro',emoji:'⭐',amount:[8,18],chance:25},
      {name:'Lingotes de Cobre',emoji:'🟫',amount:[10,20],chance:50},
      {name:'Diamantes',emoji:'💠',amount:[2,4],chance:15},
      //{name:'Pepitas Rápidas',emoji:'⚡',amount:[300,1000],chance:10},
    ]
  },
  /*labor:{
    name:'Cofre del Trabajo',emoji:'⚒️',type:'event',rarity:'event',
    key:{id:'key_labor',name:'Llave Superestrella Laboral',emoji:'⚒️',color:'#94A3B8'},
    p:{body:'#1E2430',bodyHi:'#384858',bodySh:'#080C14',lid:'#2A3040',lidHi:'#445060',lidSh:'#0E1220',band:'#141820',bolt:'#94A3B8',boltHi:'#C8D8E8',lock:'#0C1018',lockHi:'#202C38',glow:'rgba(148,163,184,1)'},
    sparkles:['⚙️','✦'],
    dates:[{start:new Date('2026-04-30'),end:new Date('2026-05-02T23:59:59')}],
    rewards:[
      {name:'Pepitas de Hierro',emoji:'⚙️',amount:[10,25],chance:30},
      {name:'Lingotes de Cobre',emoji:'🟫',amount:[10,20],chance:28},
      {name:'Esmeraldas',emoji:'💎',amount:[8,18],chance:22},
      {name:'Pepitas de Oro',emoji:'⭐',amount:[6,14],chance:15},
      {name:'Diamantes Especiales',emoji:'💠',amount:[1,3],chance:5},
    ]
  },*/
  /*mother:{
    name:'Cofre de la Madre',emoji:'💐',type:'event',rarity:'event',
    key:{id:'key_mother',name:'Llave Superestrella Maternal',emoji:'💐',color:'#F9A8D4'},
    p:{body:'#3A1020',bodyHi:'#702040',bodySh:'#180608',lid:'#4E1828',lidHi:'#8A2848',lidSh:'#220A12',band:'#2E0E1E',bolt:'#F9A8D4',boltHi:'#FFDCEE',lock:'#1E0612',lockHi:'#380E22',glow:'rgba(249,168,212,1)'},
    sparkles:['🌹','💕'],
    dates:[{start:new Date('2026-05-08'),end:new Date('2026-05-12T23:59:59')}],
    rewards:[
      {name:'Esmeraldas',emoji:'💎',amount:[12,25],chance:28},
      {name:'Pepitas de Oro',emoji:'⭐',amount:[8,20],chance:25},
      {name:'Diamantes Especiales',emoji:'💠',amount:[2,5],chance:22},
      {name:'Pepitas Rápidas',emoji:'⚡',amount:[400,1500],chance:15},
      {name:'Llave Superestrella Maternal',emoji:'💐',amount:[1,1],chance:10,isKey:true,keyId:'key_mother'},
    ]
  },*/
  /*father:{
    name:'Cofre del Padre',emoji:'🔧',type:'event',rarity:'event',
    key:{id:'key_father',name:'Llave Superestrella Paterna',emoji:'🔧',color:'#93C5FD'},
    p:{body:'#081830',bodyHi:'#1030580',bodySh:'#020810',lid:'#0C2448',lidHi:'#183C70',lidSh:'#060E20',band:'#061428',bolt:'#93C5FD',boltHi:'#C0E0FF',lock:'#040C18',lockHi:'#0C1C30',glow:'rgba(147,197,253,1)'},
    sparkles:['🔧','✦'],
    dates:[{start:new Date('2026-06-19'),end:new Date('2026-06-23T23:59:59')}],
    rewards:[
      {name:'Pepitas de Hierro',emoji:'⚙️',amount:[10,22],chance:28},
      {name:'Pepitas de Oro',emoji:'⭐',amount:[8,18],chance:25},
      {name:'Esmeraldas',emoji:'💎',amount:[10,22],chance:22},
      {name:'Diamantes Especiales',emoji:'💠',amount:[2,4],chance:15},
      {name:'Pepitas Rápidas',emoji:'⚡',amount:[300,1200],chance:10},
    ]
  },*/
  /*summer:{
    name:'Cofre del Verano',emoji:'☀️',type:'event',rarity:'event',
    key:{id:'key_summer',name:'Llave Superestrella Estival',emoji:'☀️',color:'#FCD34D'},
    p:{body:'#3C2606',bodyHi:'#786010',bodySh:'#180E02',lid:'#503010',lidHi:'#9A6018',lidSh:'#22140A',band:'#2E1E06',bolt:'#FCD34D',boltHi:'#FFF088',lock:'#1E1404',lockHi:'#3C2A08',glow:'rgba(252,211,77,1)'},
    sparkles:['☀️','✦'],
    dates:[{start:new Date('2026-06-21'),end:new Date('2026-06-25T23:59:59')}],
    rewards:[
      {name:'Pepitas de Oro',emoji:'⭐',amount:[12,28],chance:30},
      {name:'Esmeraldas',emoji:'💎',amount:[10,22],chance:25},
      {name:'Diamantes Especiales',emoji:'💠',amount:[2,5],chance:20},
      {name:'Lingotes de Inframundo',emoji:'🔥',amount:[5,12],chance:15},
      {name:'Pepitas Rápidas',emoji:'⚡',amount:[500,2000],chance:10},
    ]
  },*/
  /*dog:{
    name:'Cofre del Perro',emoji:'🐕',type:'event',rarity:'event',
    key:{id:'key_dog',name:'Llave Superestrella Canina',emoji:'🐕',color:'#D97706'},
    p:{body:'#321A06',bodyHi:'#5C3010',bodySh:'#120A02',lid:'#402208',lidHi:'#703E14',lidSh:'#180E04',band:'#201004',bolt:'#D97706',boltHi:'#F0A030',lock:'#100802',lockHi:'#2C1C08',glow:'rgba(217,119,6,1)'},
    sparkles:['🐾','✦'],
    dates:[{start:new Date('2026-08-26'),end:new Date('2026-08-30T23:59:59')}],
    rewards:[
      {name:'Esmeraldas',emoji:'💎',amount:[10,20],chance:30},
      {name:'Pepitas de Oro',emoji:'⭐',amount:[8,16],chance:25},
      {name:'Lingotes de Cobre',emoji:'🟫',amount:[10,22],chance:22},
      {name:'Diamantes Especiales',emoji:'💠',amount:[1,3],chance:15},
      {name:'Pepitas Rápidas',emoji:'⚡',amount:[200,800],chance:8},
    ]
  },*/
  /*drawing:{
    name:'Cofre del Dibujo',emoji:'🎨',type:'event',rarity:'event',
    key:{id:'key_drawing',name:'Llave Superestrella Artística',emoji:'🎨',color:'#C084FC'},
    p:{body:'#200A3E',bodyHi:'#401470',bodySh:'#0C0418',lid:'#2A0E52',lidHi:'#522090',lidSh:'#10082A',band:'#160828',bolt:'#C084FC',boltHi:'#DEB8FF',lock:'#0A0414',lockHi:'#1C0C30',glow:'rgba(192,132,252,1)'},
    sparkles:['🎨','✦'],
    dates:[{start:new Date('2026-09-13'),end:new Date('2026-09-17T23:59:59')}],
    rewards:[
      {name:'Pepitas de Oro',emoji:'⭐',amount:[8,20],chance:28},
      {name:'Diamantes Especiales',emoji:'💠',amount:[2,5],chance:24},
      {name:'Esmeraldas',emoji:'💎',amount:[10,22],chance:22},
      {name:'Pepitas Rápidas',emoji:'⚡',amount:[400,1600],chance:18},
      {name:'Lingotes de Inframundo',emoji:'🔥',amount:[4,10],chance:8},
    ]
  },*/
  /*halloween:{
    name:'Cofre de Halloween',emoji:'🎃',type:'event',rarity:'event',
    key:{id:'key_halloween',name:'Llave Superestrella Calabaza',emoji:'🎃',color:'#F97316'},
    p:{body:'#300A04',bodyHi:'#5A1408',bodySh:'#120402',lid:'#3E1006',lidHi:'#781C0C',lidSh:'#180602',band:'#1C0602',bolt:'#F97316',boltHi:'#FFB060',lock:'#0E0402',lockHi:'#2A0C04',glow:'rgba(249,115,22,1)'},
    sparkles:['🎃','👻'],
    dates:[{start:new Date('2026-10-25'),end:new Date('2026-11-01T23:59:59')}],
    rewards:[
      {name:'Lingotes de Inframundo',emoji:'🔥',amount:[8,18],chance:28},
      {name:'Diamantes Especiales',emoji:'💠',amount:[3,7],chance:24},
      {name:'Netherita',emoji:'🌑',amount:[1,3],chance:20},
      {name:'Pepitas de Oro',emoji:'⭐',amount:[15,30],chance:18},
      {name:'Pepitas Rápidas',emoji:'⚡',amount:[600,2500],chance:10},
    ]
  },*/
  /*christmas:{
    name:'Cofre de Navidad',emoji:'🎄',type:'event',rarity:'event',
    key:{id:'key_christmas',name:'Llave Superestrella Navideña',emoji:'🎄',color:'#4ADE80'},
    p:{body:'#0A2E10',bodyHi:'#185422',bodySh:'#040E06',lid:'#0E3A16',lidHi:'#206A2C',lidSh:'#061008',band:'#061208',bolt:'#4ADE80',boltHi:'#88FAA8',lock:'#040806',lockHi:'#0E1E10',glow:'rgba(74,222,128,1)'},
    sparkles:['❅','⭐'],
    dates:[{start:new Date('2026-12-01'),end:new Date('2026-12-30T23:59:59')}],
    rewards:[
      {name:'Esmeraldas',emoji:'💎',amount:[20,40],chance:22},
      {name:'Pepitas de Oro',emoji:'⭐',amount:[15,30],chance:22},
      {name:'Diamantes Especiales',emoji:'💠',amount:[4,8],chance:20},
      {name:'Netherita',emoji:'🌑',amount:[2,4],chance:16},
      {name:'Lingotes de Inframundo',emoji:'🔥',amount:[8,16],chance:12},
      {name:'Pepitas Rápidas',emoji:'⚡',amount:[1000,4000],chance:8},
    ]
  },*/
};

/* ─────────────────────────────────────
   BUZÓN
───────────────────────────────────── */
const MAILBOX_ITEMS=[
  {id:'mail_001',title:'¡Bienvenido a los Cofres!',sender:'Sistema Moonveil',msg:'Un regalo de bienvenida para empezar tu aventura. ¡Que la suerte te acompañe!',emoji:'🎁',rewards:[{keyId:'key_common',amount:5},{keyId:'key_rare',amount:1}]},
  {id:'mail_002',title:'Pack Gatuno Express',sender:'Los Gatos de Moonveil 😺',msg:'Meow meow meow... (traducción: aquí van tus llaves, humano)',emoji:'😺',rewards:[{keyId:'key_cat',amount:2}]},
  {id:'mail_003',title:'Obsequio del Equipo',sender:'Equipo Moonveil',msg:'Por explorar el mundo. ¡Aquí un pequeño detalle de nuestra parte!',emoji:'✉️',rewards:[{keyId:'key_common',amount:10},{keyId:'key_rare',amount:2},{keyId:'key_special',amount:1}]},
  {id:'mail_004',title:'Sorpresa de Temporada',sender:'Sand Brill',msg:'Incluso Sand Brill se puso generoso esta vez... o tal vez no tanto.',emoji:'🎰',rewards:[{keyId:'key_epic',amount:10}]},
  //{id:'mail_005',title:'Pack de Halloween',sender:'El Espectro de Moonveil 👻',msg:'Truco o trato... ¡esta vez es un trato! Llaves de Halloween para ti.',emoji:'🎃',rewards:[{keyId:'key_halloween',amount:3},{keyId:'key_common',amount:2}]},
  //{id:'mail_006',title:'Felicitaciones Navideñas',sender:'Papá Moonveil 🎅',msg:'Ho ho ho! Aquí tus llaves navideñas especiales. ¡Feliz Navidad!',emoji:'🎄',rewards:[{keyId:'key_christmas',amount:4},{keyId:'key_legendary',amount:1}]},
  //{id:'mail_007',title:'¡Bienvenido a los Cofres!',sender:'Sistema Moonveil',msg:'Un regalo de bienvenida para empezar tu aventura. ¡Que la suerte te acompañe!',emoji:'🎁',rewards:[{keyId:'key_common',amount:9999},{keyId:'key_rare',amount:100}]},
];

/* ─────────────────────────────────────
   STORAGE
───────────────────────────────────── */
function getKeys(){try{const r=localStorage.getItem(KEYS_LS);const k=r?JSON.parse(r):{};Object.values(CHESTS).forEach(c=>{if(k[c.key.id]==null)k[c.key.id]=0});return k}catch{return{}}}
function saveKeys(k){localStorage.setItem(KEYS_LS,JSON.stringify(k))}
function getHistory(){try{const r=localStorage.getItem(HISTORY_LS);return r?JSON.parse(r):{}}catch{return{}}}
function saveHistory(h){localStorage.setItem(HISTORY_LS,JSON.stringify(h))}
function getMailbox(){try{const r=localStorage.getItem(MAILBOX_LS);return r?JSON.parse(r):[]}catch{return[]}}
function saveMailbox(m){localStorage.setItem(MAILBOX_LS,JSON.stringify(m))}

/* ═══════════════════════════════════════════════════════════════
   ★★★★★  SVG COFRE — REDISEÑO ESPECTACULAR TOTAL  ★★★★★

   Nuevo concepto visual: cofre de fantasía con:
   - Cuerpo rectangular robusto con madera de 3 tonos + vetas
   - Tapa arqueada con cúpula pronunciada y brillo especular
   - Ornamento central único por rareza (coronas, runas, gemas...)
   - Candado ornamental con arco + cuerpo + agujero de llave
   - Bisagra decorativa central
   - Patas torneadas en la base
   - Halo de luz interior que emerge al abrirse
   - Shadow drop suave bajo el cofre
   - Todos los detalles con highlight + shadow para sensación 3D
═══════════════════════════════════════════════════════════════ */
function makeChestSVG(uid, p, rarity, size='sm'){
  const S  = size==='lg' ? 1.9 : 1;
  const W  = Math.round(112*S);
  const H  = Math.round(104*S);
  const s  = n => (n*S).toFixed(2);
  const id = `x${uid.replace(/[^a-z0-9]/gi,'_')}`;

  /* ── DEFS ── */
  const defs = `<defs>
  <filter id="${id}glow" x="-55%" y="-55%" width="210%" height="210%">
    <feGaussianBlur stdDeviation="${s(3)}" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="${id}sg" x="-25%" y="-25%" width="150%" height="150%">
    <feGaussianBlur stdDeviation="${s(1.5)}" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="${id}drop">
    <feDropShadow dx="0" dy="${s(3)}" stdDeviation="${s(5)}" flood-color="rgba(0,0,0,.7)"/>
  </filter>
  <linearGradient id="${id}bg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${p.bodyHi}"/>
    <stop offset="38%" stop-color="${p.body}"/>
    <stop offset="100%" stop-color="${p.bodySh}"/>
  </linearGradient>
  <linearGradient id="${id}lg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${p.lidHi}"/>
    <stop offset="50%" stop-color="${p.lid}"/>
    <stop offset="100%" stop-color="${p.lidSh}"/>
  </linearGradient>
  <linearGradient id="${id}shine" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="rgba(255,255,255,0)"/>
    <stop offset="35%" stop-color="rgba(255,255,255,.22)"/>
    <stop offset="55%" stop-color="rgba(255,255,255,.1)"/>
    <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
  </linearGradient>
  <radialGradient id="${id}inner" cx="50%" cy="35%" r="60%">
    <stop offset="0%" stop-color="${p.glow}" stop-opacity="1"/>
    <stop offset="70%" stop-color="${p.glow}" stop-opacity=".3"/>
    <stop offset="100%" stop-color="${p.glow}" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="${id}shad" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="rgba(0,0,0,.65)"/>
    <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
  </radialGradient>
</defs>`;

  /* ── SHADOW ── */
  const shadow = `<ellipse cx="${s(56)}" cy="${s(100)}" rx="${s(46)}" ry="${s(6)}" fill="url(#${id}shad)" opacity=".8"/>`;

  /* ── FEET ── */
  const feet = `
<ellipse cx="${s(22)}" cy="${s(95)}" rx="${s(10)}" ry="${s(4.5)}" fill="${p.band}"/>
<ellipse cx="${s(22)}" cy="${s(94)}" rx="${s(7.5)}" ry="${s(2.8)}" fill="rgba(255,255,255,.11)"/>
<ellipse cx="${s(90)}" cy="${s(95)}" rx="${s(10)}" ry="${s(4.5)}" fill="${p.band}"/>
<ellipse cx="${s(90)}" cy="${s(94)}" rx="${s(7.5)}" ry="${s(2.8)}" fill="rgba(255,255,255,.11)"/>`;

  /* ── BODY ── */
  const body = `
<rect x="${s(6)}" y="${s(54)}" width="${s(100)}" height="${s(41)}" rx="${s(8)}" filter="url(#${id}drop)" fill="url(#${id}bg)"/>
<rect x="${s(6)}" y="${s(54)}" width="${s(100)}" height="${s(5)}" rx="${s(4)}" fill="rgba(255,255,255,.1)"/>
<rect x="${s(8)}" y="${s(83)}" width="${s(96)}" height="${s(12)}" rx="${s(5)}" fill="rgba(0,0,0,.2)"/>
<line x1="${s(14)}" y1="${s(62)}" x2="${s(98)}" y2="${s(62)}" stroke="rgba(0,0,0,.12)" stroke-width="${s(.9)}"/>
<line x1="${s(14)}" y1="${s(69)}" x2="${s(98)}" y2="${s(69)}" stroke="rgba(0,0,0,.1)" stroke-width="${s(.8)}"/>
<line x1="${s(14)}" y1="${s(77)}" x2="${s(98)}" y2="${s(77)}" stroke="rgba(0,0,0,.1)" stroke-width="${s(.8)}"/>
<line x1="${s(14)}" y1="${s(85)}" x2="${s(98)}" y2="${s(85)}" stroke="rgba(0,0,0,.08)" stroke-width="${s(.7)}"/>
<polygon points="${s(6)},${s(54)} ${s(1)},${s(57)} ${s(1)},${s(95)} ${s(6)},${s(95)}" fill="${p.bodySh}" opacity=".9"/>
<polygon points="${s(106)},${s(54)} ${s(111)},${s(57)} ${s(111)},${s(95)} ${s(106)},${s(95)}" fill="${p.bodyHi}" opacity=".4"/>`;

  /* ── BODY BAND ── */
  const bodyBand = `
<rect x="${s(6)}" y="${s(68)}" width="${s(100)}" height="${s(10)}" rx="${s(4)}" fill="${p.band}"/>
<rect x="${s(6)}" y="${s(68)}" width="${s(100)}" height="${s(4)}" rx="${s(3.5)}" fill="rgba(255,255,255,.14)"/>
<rect x="${s(6)}" y="${s(74.5)}" width="${s(100)}" height="${s(3.5)}" rx="${s(2.5)}" fill="rgba(0,0,0,.2)"/>
<polygon points="${s(6)},${s(68)} ${s(1)},${s(70)} ${s(1)},${s(78)} ${s(6)},${s(78)}" fill="${p.band}" opacity=".7"/>
<polygon points="${s(106)},${s(68)} ${s(111)},${s(70)} ${s(111)},${s(78)} ${s(106)},${s(78)}" fill="${p.band}" opacity=".5"/>`;

  /* ── RIVETS helper ── */
  const rv = (cx,cy) => `
<circle cx="${s(cx)}" cy="${s(cy)}" r="${s(5.2)}" fill="${p.band}"/>
<circle cx="${s(cx)}" cy="${s(cy)}" r="${s(3.6)}" fill="${p.bolt}" filter="url(#${id}sg)"/>
<circle cx="${s(cx-.9)}" cy="${s(cy-.9)}" r="${s(1.5)}" fill="rgba(255,255,255,.55)"/>`;
  const bodyRivets = rv(20,73)+rv(36,73)+rv(76,73)+rv(92,73);

  /* ── INNER GLOW ── */
  const innerGlow = `<ellipse class="glow-inner" cx="${s(56)}" cy="${s(55)}" rx="${s(38)}" ry="${s(11)}" fill="url(#${id}inner)" opacity="0"/>`;

  /* ─────── LID GROUP ─────── */
  /* Lid rear bevel */
  const lidRear = `<rect x="${s(8)}" y="${s(22)}" width="${s(96)}" height="${s(32)}" rx="${s(5)}" fill="${p.lidSh}" opacity=".75"/>`;
  /* Lid main */
  const lidMain = `<rect x="${s(6)}" y="${s(20)}" width="${s(100)}" height="${s(34)}" rx="${s(7)}" fill="url(#${id}lg)"/>`;
  /* Dome arc */
  const dome    = `<ellipse cx="${s(56)}" cy="${s(20)}" rx="${s(50)}" ry="${s(16)}" fill="${p.lid}"/>`;
  /* Dome highlight */
  const domeHi  = `
<ellipse cx="${s(40)}" cy="${s(12)}" rx="${s(28)}" ry="${s(9.5)}" fill="url(#${id}shine)" opacity=".95" transform="rotate(-9,${s(40)},${s(12)})"/>
<ellipse cx="${s(27)}" cy="${s(9)}" rx="${s(14)}" ry="${s(5.5)}" fill="rgba(255,255,255,.14)" opacity=".85" transform="rotate(-5,${s(27)},${s(9)})"/>`;
  /* Lid wood grain */
  const lidGrain = `
<line x1="${s(14)}" y1="${s(30)}" x2="${s(98)}" y2="${s(30)}" stroke="rgba(0,0,0,.1)" stroke-width="${s(.9)}"/>
<line x1="${s(14)}" y1="${s(37)}" x2="${s(98)}" y2="${s(37)}" stroke="rgba(0,0,0,.09)" stroke-width="${s(.8)}"/>
<line x1="${s(14)}" y1="${s(44)}" x2="${s(98)}" y2="${s(44)}" stroke="rgba(0,0,0,.07)" stroke-width="${s(.7)}"/>`;
  /* Lid sides */
  const lidSides = `
<polygon points="${s(6)},${s(20)} ${s(1)},${s(22)} ${s(1)},${s(54)} ${s(6)},${s(54)}" fill="${p.lidSh}" opacity=".85"/>
<polygon points="${s(106)},${s(20)} ${s(111)},${s(22)} ${s(111)},${s(54)} ${s(106)},${s(54)}" fill="${p.lidHi}" opacity=".32"/>`;
  /* Lid band */
  const lidBand  = `
<rect x="${s(6)}" y="${s(47)}" width="${s(100)}" height="${s(9)}" rx="${s(4)}" fill="${p.band}"/>
<rect x="${s(6)}" y="${s(47)}" width="${s(100)}" height="${s(4)}" rx="${s(3.5)}" fill="rgba(255,255,255,.14)"/>
<rect x="${s(6)}" y="${s(52.5)}" width="${s(100)}" height="${s(3.5)}" rx="${s(2.5)}" fill="rgba(0,0,0,.18)"/>
<polygon points="${s(6)},${s(47)} ${s(1)},${s(49)} ${s(1)},${s(56)} ${s(6)},${s(56)}" fill="${p.band}" opacity=".75"/>
<polygon points="${s(106)},${s(47)} ${s(111)},${s(49)} ${s(111)},${s(56)} ${s(106)},${s(56)}" fill="${p.band}" opacity=".5"/>`;
  /* Lid rivets */
  const lidRivets = rv(20,51.5)+rv(36,51.5)+rv(76,51.5)+rv(92,51.5);
  /* Hinge */
  const hinge = `
<rect x="${s(47)}" y="${s(14)}" width="${s(18)}" height="${s(8)}" rx="${s(4)}" fill="${p.band}"/>
<rect x="${s(48)}" y="${s(14.5)}" width="${s(16)}" height="${s(3.5)}" rx="${s(3)}" fill="rgba(255,255,255,.16)"/>
<circle cx="${s(51)}" cy="${s(18)}" r="${s(2.2)}" fill="${p.bolt}" opacity=".8"/>
<circle cx="${s(61)}" cy="${s(18)}" r="${s(2.2)}" fill="${p.bolt}" opacity=".8"/>`;

  /* ── PER-RARITY ORNAMENT on lid front ── */
  const orn = makeOrnament(rarity, p, id, S);

  /* Assemble lid group */
  const lidGroup = `
<g class="chest-lid-grp" id="lid-${uid}" style="transform-origin:${s(56)}px ${s(54)}px">
  ${lidSides}${lidRear}${lidMain}${dome}${domeHi}${lidGrain}${lidBand}${lidRivets}${hinge}${orn}
</g>`;

  /* ── LOCK ── */
  const lock = `
<path d="M${s(47.5)},${s(44.5)} a${s(8.5)},${s(10.5)} 0 0 1 ${s(17)},0"
  fill="none" stroke="${p.lock}" stroke-width="${s(5.5)}" stroke-linecap="round"/>
<path d="M${s(49)},${s(44.5)} a${s(7)},${s(8.5)} 0 0 1 ${s(14)},0"
  fill="none" stroke="${p.lockHi}" stroke-width="${s(2)}" stroke-linecap="round" opacity=".5"/>
<rect x="${s(41.5)}" y="${s(41.5)}" width="${s(29)}" height="${s(21)}" rx="${s(5.5)}" fill="${p.lock}"/>
<rect x="${s(42.5)}" y="${s(42)}" width="${s(27)}" height="${s(5.5)}" rx="${s(4.5)}" fill="rgba(255,255,255,.11)"/>
<rect x="${s(42.5)}" y="${s(57)}" width="${s(27)}" height="${s(5.5)}" rx="${s(3.5)}" fill="rgba(0,0,0,.22)"/>
<circle cx="${s(56)}" cy="${s(50.5)}" r="${s(4.8)}" fill="rgba(0,0,0,.93)"/>
<rect x="${s(53.6)}" y="${s(53.5)}" width="${s(4.8)}" height="${s(7.5)}" rx="${s(2)}" fill="rgba(0,0,0,.93)"/>
<circle cx="${s(52)}" cy="${s(45.5)}" r="${s(2.2)}" fill="rgba(255,255,255,.24)"/>
<ellipse cx="${s(56)}" cy="${s(50)}" rx="${s(9)}" ry="${s(9)}" fill="${p.glow}" opacity=".18" filter="url(#${id}glow)"/>`;

  return `<svg class="chest-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"
  xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
${defs}${shadow}${feet}${body}${bodyBand}${bodyRivets}${innerGlow}${lidGroup}${lock}
</svg>`;
}

/* ─────────────────────────────────────
   PER-RARITY ORNAMENTS
───────────────────────────────────── */
function makeOrnament(rarity, p, id, S){
  const s = n => (n*S).toFixed(2);
  switch(rarity){

    case 'legendary': return `
<g filter="url(#${id}glow)">
  <!-- Crown base -->
  <path d="M${s(38)},${s(41)} l${s(3.5)},${s(-10)} l${s(10)},${s(9)} l${s(9)},${s(-9)} l${s(3.5)},${s(10)} v${s(7)} h${s(-26)} z"
    fill="${p.bolt}" opacity=".95"/>
  <path d="M${s(40)},${s(41.5)} l${s(2.5)},${s(-7.5)} l${s(10)},${s(8)} l${s(9)},${s(-8)} l${s(2.5)},${s(7.5)}"
    fill="rgba(255,255,255,.3)" opacity=".9"/>
  <!-- Crown points -->
  <circle cx="${s(56)}" cy="${s(30)}" r="${s(3.5)}" fill="${p.boltHi}"/>
  <circle cx="${s(56)}" cy="${s(30)}" r="${s(2)}" fill="rgba(255,255,255,.6)"/>
  <circle cx="${s(40.5)}" cy="${s(40)}" r="${s(2.8)}" fill="${p.boltHi}"/>
  <circle cx="${s(40.5)}" cy="${s(40)}" r="${s(1.4)}" fill="rgba(255,255,255,.55)"/>
  <circle cx="${s(71.5)}" cy="${s(40)}" r="${s(2.8)}" fill="${p.boltHi}"/>
  <circle cx="${s(71.5)}" cy="${s(40)}" r="${s(1.4)}" fill="rgba(255,255,255,.55)"/>
  <!-- Side gems -->
  <polygon points="${s(30)},${s(32)} ${s(35)},${s(36)} ${s(30)},${s(40)} ${s(25)},${s(36)}" fill="${p.bolt}" opacity=".8"/>
  <polygon points="${s(82)},${s(32)} ${s(87)},${s(36)} ${s(82)},${s(40)} ${s(77)},${s(36)}" fill="${p.bolt}" opacity=".8"/>
</g>`;

    case 'epic': return `
<g filter="url(#${id}glow)">
  <!-- Arcane sigil: outer diamond -->
  <polygon points="${s(56)},${s(22)} ${s(68)},${s(32)} ${s(56)},${s(42)} ${s(44)},${s(32)}"
    fill="${p.bolt}" opacity=".9"/>
  <polygon points="${s(56)},${s(25)} ${s(65)},${s(32)} ${s(56)},${s(39)} ${s(47)},${s(32)}"
    fill="rgba(255,255,255,.2)"/>
  <!-- Inner diamond -->
  <polygon points="${s(56)},${s(27)} ${s(63)},${s(32)} ${s(56)},${s(37)} ${s(49)},${s(32)}"
    fill="${p.bolt}" opacity=".7"/>
  <circle cx="${s(56)}" cy="${s(32)}" r="${s(3.5)}" fill="rgba(255,255,255,.55)"/>
  <!-- Corner rune dots -->
  <circle cx="${s(44)}" cy="${s(25)}" r="${s(3)}" fill="${p.bolt}" opacity=".8"/>
  <circle cx="${s(44)}" cy="${s(25)}" r="${s(1.5)}" fill="rgba(255,255,255,.4)"/>
  <circle cx="${s(68)}" cy="${s(25)}" r="${s(3)}" fill="${p.bolt}" opacity=".8"/>
  <circle cx="${s(68)}" cy="${s(25)}" r="${s(1.5)}" fill="rgba(255,255,255,.4)"/>
  <circle cx="${s(44)}" cy="${s(39)}" r="${s(3)}" fill="${p.bolt}" opacity=".7"/>
  <circle cx="${s(68)}" cy="${s(39)}" r="${s(3)}" fill="${p.bolt}" opacity=".7"/>
  <!-- rune lines -->
  <line x1="${s(56)}" y1="${s(22)}" x2="${s(56)}" y2="${s(18)}" stroke="${p.bolt}" stroke-width="${s(2)}" stroke-linecap="round" opacity=".7"/>
  <line x1="${s(68)}" y1="${s(32)}" x2="${s(73)}" y2="${s(32)}" stroke="${p.bolt}" stroke-width="${s(2)}" stroke-linecap="round" opacity=".6"/>
  <line x1="${s(44)}" y1="${s(32)}" x2="${s(39)}" y2="${s(32)}" stroke="${p.bolt}" stroke-width="${s(2)}" stroke-linecap="round" opacity=".6"/>
</g>`;

    case 'rare': return `
<g filter="url(#${id}sg)">
  <!-- Center gem hexagon -->
  <polygon points="${s(56)},${s(22)} ${s(65)},${s(27)} ${s(65)},${s(37)} ${s(56)},${s(42)} ${s(47)},${s(37)} ${s(47)},${s(27)}"
    fill="${p.bolt}" opacity=".92"/>
  <!-- Gem facets -->
  <polygon points="${s(56)},${s(22)} ${s(65)},${s(27)} ${s(56)},${s(28)}" fill="rgba(255,255,255,.45)"/>
  <polygon points="${s(56)},${s(22)} ${s(47)},${s(27)} ${s(56)},${s(28)}" fill="rgba(255,255,255,.2)"/>
  <polygon points="${s(56)},${s(28)} ${s(65)},${s(27)} ${s(65)},${s(37)} ${s(56)},${s(32)}" fill="rgba(0,0,0,.12)"/>
  <polygon points="${s(56)},${s(32)} ${s(65)},${s(37)} ${s(56)},${s(42)} ${s(47)},${s(37)}" fill="rgba(0,0,0,.18)"/>
  <circle cx="${s(56)}" cy="${s(32)}" r="${s(2.5)}" fill="rgba(255,255,255,.5)"/>
  <!-- Side small gems -->
  <polygon points="${s(39)},${s(27)} ${s(44)},${s(30)} ${s(44)},${s(36)} ${s(39)},${s(39)} ${s(34)},${s(36)} ${s(34)},${s(30)}" fill="${p.bolt}" opacity=".75"/>
  <polygon points="${s(73)},${s(27)} ${s(78)},${s(30)} ${s(78)},${s(36)} ${s(73)},${s(39)} ${s(68)},${s(36)} ${s(68)},${s(30)}" fill="${p.bolt}" opacity=".75"/>
  <polygon points="${s(39)},${s(28.5)}" fill="rgba(255,255,255,.4)"/>
  <circle cx="${s(39)}" cy="${s(33)}" r="${s(1.5)}" fill="rgba(255,255,255,.4)"/>
  <circle cx="${s(73)}" cy="${s(33)}" r="${s(1.5)}" fill="rgba(255,255,255,.4)"/>
</g>`;

    case 'special': return `
<g filter="url(#${id}sg)">
  <!-- Central flower -->
  <circle cx="${s(56)}" cy="${s(32)}" r="${s(6.5)}" fill="${p.bolt}" opacity=".88"/>
  <!-- Petals -->
  <ellipse cx="${s(48)}" cy="${s(24)}" rx="${s(4.2)}" ry="${s(7)}" fill="${p.bolt}" opacity=".72" transform="rotate(-36,${s(48)},${s(24)})"/>
  <ellipse cx="${s(64)}" cy="${s(24)}" rx="${s(4.2)}" ry="${s(7)}" fill="${p.bolt}" opacity=".72" transform="rotate(36,${s(64)},${s(24)})"/>
  <ellipse cx="${s(48)}" cy="${s(40)}" rx="${s(4.2)}" ry="${s(7)}" fill="${p.bolt}" opacity=".68" transform="rotate(36,${s(48)},${s(40)})"/>
  <ellipse cx="${s(64)}" cy="${s(40)}" rx="${s(4.2)}" ry="${s(7)}" fill="${p.bolt}" opacity=".68" transform="rotate(-36,${s(64)},${s(40)})"/>
  <ellipse cx="${s(56)}" cy="${s(22)}" rx="${s(4)}" ry="${s(6.5)}" fill="${p.bolt}" opacity=".7"/>
  <ellipse cx="${s(56)}" cy="${s(42)}" rx="${s(4)}" ry="${s(6.5)}" fill="${p.bolt}" opacity=".65"/>
  <!-- Center -->
  <circle cx="${s(56)}" cy="${s(32)}" r="${s(4.5)}" fill="${p.boltHi}" opacity=".85"/>
  <circle cx="${s(56)}" cy="${s(32)}" r="${s(2.5)}" fill="rgba(255,255,255,.6)"/>
</g>`;

    case 'common': return `
<g opacity=".9">
  <!-- Cross bolt -->
  <rect x="${s(52.5)}" y="${s(23.5)}" width="${s(7)}" height="${s(17)}" rx="${s(2.2)}" fill="${p.bolt}" filter="url(#${id}sg)"/>
  <rect x="${s(46.5)}" y="${s(29.5)}" width="${s(19)}" height="${s(5)}" rx="${s(2.2)}" fill="${p.bolt}" filter="url(#${id}sg)"/>
  <circle cx="${s(56)}" cy="${s(32)}" r="${s(3.5)}" fill="${p.boltHi}" opacity=".85"/>
  <circle cx="${s(56)}" cy="${s(32)}" r="${s(1.8)}" fill="rgba(255,255,255,.55)"/>
  <!-- Corner bolts -->
  <circle cx="${s(40)}" cy="${s(26)}" r="${s(2.8)}" fill="${p.bolt}" opacity=".65"/>
  <circle cx="${s(40)}" cy="${s(26)}" r="${s(1.2)}" fill="rgba(255,255,255,.35)"/>
  <circle cx="${s(72)}" cy="${s(26)}" r="${s(2.8)}" fill="${p.bolt}" opacity=".65"/>
  <circle cx="${s(72)}" cy="${s(26)}" r="${s(1.2)}" fill="rgba(255,255,255,.35)"/>
</g>`;

    case 'event':
    default: return `
<g filter="url(#${id}glow)">
  <!-- Star burst -->
  <circle cx="${s(56)}" cy="${s(32)}" r="${s(7.5)}" fill="${p.bolt}" opacity=".9"/>
  ${[0,45,90,135,180,225,270,315].map((a,i)=>{
    const rad=a*Math.PI/180, len=i%2===0 ? 14 : 9;
    const x1=(56+10*Math.cos(rad))*S, y1=(32+10*Math.sin(rad))*S;
    const x2=(56+len*Math.cos(rad))*S, y2=(32+len*Math.sin(rad))*S;
    return `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}"
      stroke="${p.bolt}" stroke-width="${(i%2===0 ? 3 : 2)*S}" stroke-linecap="round" opacity="${i%2===0 ? .92 : .72}"/>`;
  }).join('')}
  <circle cx="${s(56)}" cy="${s(32)}" r="${s(5)}" fill="${p.boltHi}" opacity=".9"/>
  <circle cx="${s(56)}" cy="${s(32)}" r="${s(2.5)}" fill="rgba(255,255,255,.6)"/>
</g>`;
  }
}

/* ─────────────────────────────────────
   HELPERS
───────────────────────────────────── */
function isEventAvailable(id){const c=CHESTS[id];if(c.type!=='event')return true;const n=new Date();return c.dates.some(d=>n>=d.start&&n<=d.end)}
function fmtDate(d){return d.toLocaleDateString('es-ES',{day:'2-digit',month:'2-digit',year:'numeric'})}
function fmtDateRange(d){return`${fmtDate(d.start)} → ${fmtDate(d.end)}`}
function qualLabel(r){return{common:'Común',rare:'Raro',special:'Especial',epic:'Épico',legendary:'Legendario',event:'Evento'}[r]||r}
function rollReward(id){
  const rw=CHESTS[id].rewards,roll=Math.random()*100;let c=0;
  for(const r of rw){c+=r.chance;if(roll<=c){
    const a=r.amount[0]===r.amount[1]?r.amount[0]:r.amount[0]+Math.floor(Math.random()*(r.amount[1]-r.amount[0]+1));
    return{...r,rolledAmount:a};
  }}
  const last=rw[rw.length-1];return{...last,rolledAmount:last.amount[0]};
}

/* ─────────────────────────────────────
   CARD BUILD
───────────────────────────────────── */
function buildChestCard(id, cfg, keys, idx){
  const count=keys[cfg.key.id]||0;
  const isEvent=cfg.type==='event';
  const avail=isEventAvailable(id);
  const rClass=`rarity-${cfg.rarity}`;

  const datesHTML=isEvent?`<div class="card-dates">${cfg.dates.map(d=>`<span class="date-range ${avail?'date-active':'date-future'}">${fmtDateRange(d)}</span>`).join('')}</div>`:'';
  const statusBadge=isEvent?(avail?`<span class="event-badge available">🟢 Disponible</span>`:`<span class="event-badge locked">🔒 No disponible</span>`):'';
  const sparklesHTML=(cfg.sparkles||[]).slice(0,3).map(sp=>`<span class="chest-sparkle" aria-hidden="true">${sp}</span>`).join('');
  const orbsHTML=`
    <div class="chest-orb" style="--rc:${cfg.key.color}"></div>
    <div class="chest-orb" style="--rc:${cfg.key.color}"></div>
    <div class="chest-orb" style="--rc:${cfg.key.color}"></div>
    <div class="chest-orb" style="--rc:${cfg.key.color}"></div>`;

  return `
<article class="chest-card ${rClass} ${avail?'':'chest-locked'}" data-id="${id}" style="animation-delay:${idx*.07}s">
  <div class="chest-card-inner">
    <div class="card-top">
      <span class="card-name-tag ${rClass}-tag">${qualLabel(cfg.rarity)}</span>
      ${statusBadge}
    </div>
    <div class="card-chest-wrap">
      <div class="chest-float-badge" id="floatBadge-${id}" style="--rc:${cfg.key.color};--rcg:${cfg.key.color}44" title="${cfg.key.name}">
        ${cfg.key.emoji} <span id="floatCount-${id}">${count}</span>
      </div>
      <div class="chest-glow-ring"></div>
      <div class="chest-glow-ring chest-glow-ring-2"></div>
      <div class="chest-container" id="chestContainer-${id}">
        ${makeChestSVG(id, cfg.p, cfg.rarity, 'sm')}
        <div class="chest-particles" id="particles-${id}"></div>
      </div>
      ${sparklesHTML}${orbsHTML}
    </div>
    <div class="card-info">
      <h3 class="card-title">${cfg.emoji} ${cfg.name}</h3>
      <p class="card-key-name">${cfg.key.emoji} ${cfg.key.name}</p>
      ${datesHTML}
    </div>
    <div class="card-actions">
      <button class="btn-info" data-info="${id}" title="Ver recompensas">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </button>
      <button class="btn-open ${count<1||!avail?'disabled':''}" data-open="${id}" ${count<1||!avail?'disabled':''}>
        <span class="btn-open-shine"></span>
        ${count<1?'🔑 Sin llave':!avail?'🔒 Bloqueado':'✨ Abrir Cofre'}
      </button>
    </div>
  </div>
</article>`;
}

/* ─────────────────────────────────────
   RENDER
───────────────────────────────────── */
function renderPermanentChests(){
  const g=document.getElementById('gridPermanent');if(!g)return;
  const k=getKeys();
  g.innerHTML=Object.entries(CHESTS).filter(([,c])=>c.type==='permanent').map(([id,cfg],i)=>buildChestCard(id,cfg,k,i)).join('');
  bindCardEvents(g);
}
function renderEventChests(){
  const g=document.getElementById('gridEvents');if(!g)return;
  const k=getKeys();
  g.innerHTML=Object.entries(CHESTS).filter(([,c])=>c.type==='event').map(([id,cfg],i)=>buildChestCard(id,cfg,k,i)).join('');
  bindCardEvents(g);
}
function bindCardEvents(ctx){
  ctx.querySelectorAll('[data-open]').forEach(b=>{b.addEventListener('click',()=>{if(!b.disabled)openChest(b.dataset.open)})});
  ctx.querySelectorAll('[data-info]').forEach(b=>{b.addEventListener('click',()=>showInfo(b.dataset.info))});
}

/* ─────────────────────────────────────
   KEY INVENTORY
───────────────────────────────────── */
function renderKeyInventory(){
  const w=document.getElementById('keyInventory');if(!w)return;
  const k=getKeys();
  w.innerHTML=Object.values(CHESTS).map(cfg=>{
    const n=k[cfg.key.id]||0;
    return`<div class="key-slot ${n>0?'has-key':'empty-key'}" title="${cfg.key.name}">
      <span class="key-slot-emoji">${cfg.key.emoji}</span>
      <span class="key-slot-count" style="color:${cfg.key.color}">${n}</span>
      <span class="key-slot-name">${cfg.key.name.replace('Llave Superestrella ','').replace('Llave ','')}</span>
    </div>`;
  }).join('');
}

/* ─────────────────────────────────────
   OPEN CHEST
───────────────────────────────────── */
function openChest(id){
  const cfg=CHESTS[id],k=getKeys();
  if((k[cfg.key.id]||0)<1){toast('❌ No tienes esa llave');return}
  if(!isEventAvailable(id)){toast('🔒 Este cofre no está disponible ahora');return}
  k[cfg.key.id]=Math.max(0,(k[cfg.key.id]||0)-1);saveKeys(k);
  const reward=rollReward(id);
  if(reward.isKey&&reward.keyId){k[reward.keyId]=(k[reward.keyId]||0)+reward.rolledAmount;saveKeys(k)}
  addToHistory(id,cfg,reward);
  showOpeningModal(id,cfg,reward);
  renderAll();
}

/* ─────────────────────────────────────
   HISTORY
───────────────────────────────────── */
function addToHistory(chestId,cfg,reward){
  const h=getHistory();
  if(!h[chestId])h[chestId]={chestName:cfg.name,emoji:cfg.emoji,items:{}};
  const key=reward.name;
  if(!h[chestId].items[key])h[chestId].items[key]={emoji:reward.emoji,total:0,opens:0};
  h[chestId].items[key].total+=reward.rolledAmount;h[chestId].items[key].opens++;
  saveHistory(h);
}
function renderHistory(){
  const w=document.getElementById('historyWrap');if(!w)return;
  const h=getHistory(),entries=Object.entries(h);
  if(!entries.length){w.innerHTML=`<div class="history-empty">Aún no has abierto ningún cofre. ¡Consigue llaves y empieza!</div>`;return}
  w.innerHTML=entries.map(([cid,data])=>{
    const cfg=CHESTS[cid],rClass=cfg?`rarity-${cfg.rarity}`:'';
    const items=Object.entries(data.items).map(([name,info])=>`<div class="history-item"><span class="hi-emoji">${info.emoji}</span><span class="hi-name">${name}</span><span class="hi-total" style="color:${cfg?.p?.bolt||'#7ec8ff'}">×${info.total}</span></div>`).join('');
    return`<div class="history-chest ${rClass}"><div class="history-chest-header"><span class="hch-emoji">${data.emoji}</span><strong>${data.chestName}</strong></div><div class="history-items">${items}</div></div>`;
  }).join('');
}

/* ─────────────────────────────────────
   MAILBOX
───────────────────────────────────── */
function renderMailbox(){
  const list=document.getElementById('mailboxList');if(!list)return;
  const claimed=getMailbox();
  const unread=MAILBOX_ITEMS.filter(m=>!claimed.includes(m.id)).length;
  document.querySelectorAll('#mailboxBadge').forEach(b=>{b.textContent=unread;b.style.display=unread>0?'flex':'none'});
  list.innerHTML=MAILBOX_ITEMS.map(item=>{
    const isClaimed=claimed.includes(item.id);
    const keysHTML=item.rewards.map(r=>{const ki=Object.values(CHESTS).find(c=>c.key.id===r.keyId)?.key;return ki?`<span class="mail-reward-tag" style="border-color:${ki.color};color:${ki.color}">${ki.emoji} ×${r.amount}</span>`:''}).join('');
    return`<div class="mail-item ${isClaimed?'claimed':'unclaimed'}">
      <div class="mail-icon">${item.emoji}</div>
      <div class="mail-body"><div class="mail-title">${item.title}</div><div class="mail-sender">De: ${item.sender}</div><div class="mail-msg">${item.msg}</div><div class="mail-rewards">${keysHTML}</div></div>
      <div class="mail-action">${isClaimed?`<span class="mail-claimed-tag">✅ Reclamado</span>`:`<button class="btn-claim" data-mail="${item.id}">🎁 Reclamar</button>`}</div>
    </div>`;
  }).join('');
  list.querySelectorAll('[data-mail]').forEach(b=>b.addEventListener('click',()=>claimMail(b.dataset.mail)));
}
function claimMail(mailId){
  const item=MAILBOX_ITEMS.find(m=>m.id===mailId);if(!item)return;
  const claimed=getMailbox();if(claimed.includes(mailId)){toast('Ya reclamaste este correo');return}
  claimed.push(mailId);saveMailbox(claimed);
  const k=getKeys();item.rewards.forEach(r=>{k[r.keyId]=(k[r.keyId]||0)+r.amount});saveKeys(k);
  const sum=item.rewards.map(r=>{const ki=Object.values(CHESTS).find(c=>c.key.id===r.keyId)?.key;return ki?`${ki.emoji}×${r.amount}`:''}).join(' ');
  toast(`📬 ¡Llaves recibidas! ${sum}`);renderAll();
}
function toggleMailbox(){
  const w=document.getElementById('mailboxWrap'),sec=document.getElementById('secMailbox');if(!w)return;
  const open=w.classList.toggle('open');
  if(open)setTimeout(()=>sec?.scrollIntoView({behavior:'smooth',block:'start'}),80);
}

/* ─────────────────────────────────────
   OPENING MODAL
───────────────────────────────────── */
function showOpeningModal(id, cfg, reward){
  const modal=document.getElementById('openingModal');if(!modal)return;
  document.getElementById('modalChestSvg').innerHTML=makeChestSVG('modal_'+id,cfg.p,cfg.rarity,'lg');
  document.getElementById('modalChestName').textContent=`${cfg.emoji} ${cfg.name}`;
  const rv=document.getElementById('rewardReveal');rv.style.display='none';rv.classList.remove('reward-show');
  modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
  setTimeout(()=>{document.querySelector('#modalChestSvg .chest-svg')?.classList.add('shake-anim')},120);
  setTimeout(()=>{
    const lid=document.querySelector('#modalChestSvg .chest-lid-grp');
    const glow=document.querySelector('#modalChestSvg .glow-inner');
    if(lid){lid.style.transition='transform .8s cubic-bezier(.34,1.56,.64,1)';lid.style.transition='transform .2s';
lid.style.transform='translateY(-20px)';}
    if(glow){glow.style.transition='opacity .5s';glow.style.opacity='1';glow.style.animation='glowPulse 1s ease-in-out infinite alternate'}
    spawnParticles('modalParticles',cfg.p.bolt,cfg.p.glow);
  },720);
  setTimeout(()=>{
    rv.style.display='flex';
    document.getElementById('rewardEmoji').textContent=reward.emoji;
    document.getElementById('rewardName').textContent=reward.name;
    document.getElementById('rewardAmount').textContent=`×${reward.rolledAmount}`;
    const rt=document.getElementById('rewardRarity');
    rt.textContent=reward.isKey?'🔑 ¡Llave!':getRarityLabel(reward.chance);
    rt.className=`reward-rarity-tag ${reward.isKey?'rarity-legendary':getRarityClass(reward.chance)}`;
    setTimeout(()=>rv.classList.add('reward-show'),50);
  },1520);
}
function getRarityLabel(c){if(c<=3)return'✦ Ultra Raro';if(c<=8)return'★ Muy Raro';if(c<=15)return'◆ Raro';if(c<=25)return'● Normal';return'○ Común'}
function getRarityClass(c){if(c<=3)return'rarity-legendary';if(c<=8)return'rarity-epic';if(c<=15)return'rarity-rare';if(c<=25)return'rarity-special';return'rarity-common'}
function spawnParticles(cid, c1, c2){
  const el=document.getElementById(cid);if(!el)return;el.innerHTML='';
  const colors=[c1,c2,'#7ec8ff','#fff','#c8e8ff'];
  for(let i=0;i<42;i++){
    const p=document.createElement('div');p.className='open-particle';
    const ang=(Math.PI*2*i)/42+(Math.random()-.5)*.5,dist=50+Math.random()*95;
    p.style.cssText=`background:${colors[i%colors.length]};left:50%;top:42%;width:${4+Math.random()*7}px;height:${4+Math.random()*7}px;border-radius:${Math.random()>.4?'50%':'2px'};--dx:${(Math.cos(ang)*dist).toFixed(1)}px;--dy:${(Math.sin(ang)*dist).toFixed(1)}px;animation:particleBurst 1s cubic-bezier(.2,.8,.3,1) ${(i*.022).toFixed(3)}s forwards;`;
    el.appendChild(p);
  }
}

/* ─────────────────────────────────────
   INFO MODAL
───────────────────────────────────── */
function showInfo(id){
  const cfg=CHESTS[id],modal=document.getElementById('infoModal');if(!modal)return;
  document.getElementById('infoChestName').textContent=`${cfg.emoji} ${cfg.name}`;
  document.getElementById('infoKeyName').textContent=`${cfg.key.emoji} ${cfg.key.name}`;
  let di='';
  if(cfg.type==='event'){const av=isEventAvailable(id);di=`<div class="info-dates"><strong>Fechas de apertura:</strong>${cfg.dates.map(d=>`<span class="${av?'date-active':'date-future'}">${fmtDateRange(d)}</span>`).join('')}</div>`}
  document.getElementById('infoDates').innerHTML=di;
  document.getElementById('infoRewardsTable').innerHTML=[...cfg.rewards].sort((a,b)=>a.chance-b.chance).map(r=>`<tr><td class="irw-emoji">${r.emoji}</td><td class="irw-name">${r.name}${r.isKey?'<span class="key-tag">LLAVE</span>':''}</td><td class="irw-amt">${r.amount[0]}–${r.amount[1]}</td><td class="irw-pct">${r.chance}%</td><td class="irw-bar"><div class="irw-fill" style="width:${r.chance}%;background:${cfg.p.bolt}"></div></td></tr>`).join('');
  modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
}

/* ─────────────────────────────────────
   RENDER ALL
───────────────────────────────────── */
function renderAll(){renderPermanentChests();renderEventChests();renderKeyInventory();renderHistory();renderMailbox()}

/* ─────────────────────────────────────
   CLOSE MODAL
───────────────────────────────────── */
function closeModal(id){const m=document.getElementById(id);if(!m)return;m.classList.remove('open');m.setAttribute('aria-hidden','true');document.body.style.overflow=''}

/* ─────────────────────────────────────
   NAVBAR
───────────────────────────────────── */
function setupNavbar(){
  const toggle=document.getElementById('navToggle'),links=document.getElementById('navLinks');
  toggle?.addEventListener('click',e=>{e.stopPropagation();links?.classList.toggle('open')});
  document.addEventListener('click',e=>{if(!toggle?.contains(e.target)&&!links?.contains(e.target))links?.classList.remove('open')});
  document.querySelectorAll('.hud-bar').forEach(b=>b.style.setProperty('--v',b.dataset.val||50));
}

/* ─────────────────────────────────────
   BACKGROUND PARTICLES
───────────────────────────────────── */
function setupParticles(){
  const c=document.getElementById('bgParticles');if(!c)return;
  const ctx=c.getContext('2d'),dpi=Math.max(1,devicePixelRatio);
  let w,h,stars,nebulae;const ss=[];
  function init(){
    w=c.width=innerWidth*dpi;h=c.height=innerHeight*dpi;
    stars=Array.from({length:280},()=>({x:Math.random()*w,y:Math.random()*h,r:(.3+Math.random()*1.6)*dpi,alpha:.1+Math.random()*.85,ts:.004+Math.random()*.012,tp:Math.random()*Math.PI*2,hue:Math.random()<.7?210+Math.random()*40:Math.random()*360,sat:Math.random()<.6?20+Math.random()*40:60+Math.random()*30}));
    nebulae=Array.from({length:5},()=>({x:Math.random()*w,y:Math.random()*h,r:(120+Math.random()*200)*dpi,hue:[200,220,250,270,190][Math.floor(Math.random()*5)],alpha:.015+Math.random()*.025}));
  }
  function spawnSS(){
    const sx=(.3+Math.random()*.7)*w,sy=Math.random()*h*.4,ang=(160+Math.random()*40)*Math.PI/180,spd=(3+Math.random()*5)*dpi;
    ss.push({x:sx,y:sy,vx:Math.cos(ang)*spd,vy:Math.sin(ang)*spd,length:(80+Math.random()*160)*dpi,alpha:1,life:1,decay:.012+Math.random()*.018,width:(.8+Math.random()*1.4)*dpi});
  }
  function schSS(){spawnSS();setTimeout(schSS,2500+Math.random()*6500)}
  function draw(){
    ctx.clearRect(0,0,w,h);
    nebulae.forEach(n=>{const g=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,n.r);g.addColorStop(0,`hsla(${n.hue},60%,55%,${n.alpha})`);g.addColorStop(1,`hsla(${n.hue},60%,55%,0)`);ctx.beginPath();ctx.arc(n.x,n.y,n.r,0,Math.PI*2);ctx.fillStyle=g;ctx.fill()});
    stars.forEach(s=>{s.tp+=s.ts;const tw=.5+.5*Math.sin(s.tp),a=s.alpha*(.5+.5*tw);if(tw>.95&&s.r>1.2*dpi){ctx.save();ctx.globalAlpha=a*.6;ctx.strokeStyle=`hsla(${s.hue},${s.sat}%,90%,1)`;ctx.lineWidth=.5*dpi;const sl=s.r*2.5;ctx.beginPath();ctx.moveTo(s.x-sl,s.y);ctx.lineTo(s.x+sl,s.y);ctx.moveTo(s.x,s.y-sl);ctx.lineTo(s.x,s.y+sl);ctx.stroke();ctx.restore()}ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fillStyle=`hsla(${s.hue},${s.sat}%,92%,${a})`;ctx.fill()});
    for(let i=ss.length-1;i>=0;i--){const s=ss[i];s.x+=s.vx;s.y+=s.vy;s.life-=s.decay;s.alpha=Math.max(0,s.life);if(s.alpha<=0||s.x<-200||s.y>h+200){ss.splice(i,1);continue}const tx=s.x-Math.cos(Math.atan2(s.vy,s.vx))*s.length,ty=s.y-Math.sin(Math.atan2(s.vy,s.vx))*s.length,g=ctx.createLinearGradient(tx,ty,s.x,s.y);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.6,`rgba(180,220,255,${s.alpha*.4})`);g.addColorStop(1,`rgba(255,255,255,${s.alpha})`);ctx.save();ctx.lineWidth=s.width;ctx.strokeStyle=g;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(s.x,s.y);ctx.stroke();const hg=ctx.createRadialGradient(s.x,s.y,0,s.x,s.y,s.width*4);hg.addColorStop(0,`rgba(255,255,255,${s.alpha})`);hg.addColorStop(1,'rgba(180,220,255,0)');ctx.beginPath();ctx.arc(s.x,s.y,s.width*4,0,Math.PI*2);ctx.fillStyle=hg;ctx.fill();ctx.restore()}
    requestAnimationFrame(draw);
  }
  init();draw();setTimeout(schSS,1200);addEventListener('resize',init);
}

function setupParallax(){
  const layers=Array.from(document.querySelectorAll('.layer'));if(!layers.length)return;
  const k=[0,.025,.055,.09];const fn=()=>{const y=scrollY;layers.forEach((l,i)=>l.style.transform=`translateY(${y*k[i]}px)`)};
  fn();addEventListener('scroll',fn,{passive:true});
}
function setupReveal(){
  const obs=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-in');obs.unobserve(e.target)}})},{threshold:.1});
  document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
}

/* ─────────────────────────────────────
   MUSIC
───────────────────────────────────── */
function setupMusic(){
  const audio=document.getElementById('bg-music'),btn=document.querySelector('.floating-music');if(!audio||!btn)return;
  btn.addEventListener('click',()=>audio.paused?audio.play().then(()=>{btn.classList.add('active');localStorage.setItem('music','on')}).catch(()=>{}):(audio.pause(),btn.classList.remove('active'),localStorage.setItem('music','off')));
  if(localStorage.getItem('music')==='on')audio.play().then(()=>btn.classList.add('active')).catch(()=>{});
}
window.toggleMusic=()=>document.querySelector('.floating-music')?.click();

/* ─────────────────────────────────────
   TOAST
───────────────────────────────────── */
function toast(msg){const t=document.getElementById('toast');if(!t)return;t.textContent=msg;t.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove('show'),2600)}

/* ─────────────────────────────────────
   INIT
───────────────────────────────────── */
document.addEventListener('DOMContentLoaded',()=>{
  setupNavbar();setupParticles();setupParallax();setupReveal();setupMusic();
  const yr=document.getElementById('y');if(yr)yr.textContent=new Date().getFullYear();
  renderAll();
  document.getElementById('openModalClose')?.addEventListener('click',()=>closeModal('openingModal'));
  document.getElementById('openModalOverlay')?.addEventListener('click',()=>closeModal('openingModal'));
  document.getElementById('infoModalClose')?.addEventListener('click',()=>closeModal('infoModal'));
  document.getElementById('infoModalOverlay')?.addEventListener('click',()=>closeModal('infoModal'));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal('openingModal');closeModal('infoModal')}});
  document.getElementById('mailboxBtn')?.addEventListener('click',toggleMailbox);
  document.getElementById('mailboxToggleBtn')?.addEventListener('click',toggleMailbox);
  toast('🌌 Sistema de Cofres cargado — ¡Buena suerte, viajero estelar!');
});