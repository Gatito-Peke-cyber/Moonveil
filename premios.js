/**
 * premios.js — Sistema Gacha Moonveil v3.1
 * ════════════════════════════════════════
 * ✅ SYNC EN TIEMPO REAL: onSnapshot cross-device
 * ✅ Tickets, inventario gacha y pity sincronizados al instante
 * ✅ Responsive móvil: misiones visibles en panel inferior
 * ✅ Misiones bloqueadas si la ruleta no ha iniciado
 * ✅ Timers más grandes y legibles
 * ✅ Pity legendario: probabilidad creciente desde tiro 1 (soft pity desde 45)
 * ✅ Últimos premios: muestra los N del último lote (x1 → 1, x10 → 10)
 * ✅ Botón LIMPIAR inventario por ruleta individual
 * ✅ window.addTickets() para tienda.js
 */

'use strict';

import { db }           from './firebase.js';
import { onAuthChange }  from './auth.js';
import {
  doc, getDoc, updateDoc, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

const $  = s => document.querySelector(s);
const wait = ms => new Promise(r => setTimeout(r, ms));

/* ══════════════════════════════════════
   LOCALSTORAGE
══════════════════════════════════════ */
const LS = {
  tickets:    id => `mv_tickets_${id}`,
  pityEpic:   id => `mv_pity_epic_${id}`,
  pityLegend: id => `mv_pity_legend_${id}`,
  gachaInv:  'mv_gacha_inventory',
  boostState:'mv_gacha_boost',
  stats:     'mv_gacha_stats',
  missions:  'mv_gacha_missions',
  stock:     id => `mv_gacha_stock_${id}`,
  lastPrizes:'mv_gacha_last_prizes',
};
function lsGet(k,fb=null){ try{const v=localStorage.getItem(k);return v!==null?JSON.parse(v):fb;}catch{return fb;} }
function lsSet(k,v){ try{localStorage.setItem(k,JSON.stringify(v));}catch{} }

/* ══════════════════════════════════════
   FIREBASE — SYNC EN TIEMPO REAL
══════════════════════════════════════ */
let currentUID=null, syncTimeout=null;
let _gachaUnsub=null;       // unsubscribe del onSnapshot
let _ignoreNextSnapshot=false; // evitar loop cuando nosotros mismos actualizamos

function scheduleSync(){
  if(!currentUID)return;
  clearTimeout(syncTimeout);
  syncTimeout=setTimeout(doSync,3000);
}

async function doSync(){
  if(!currentUID)return;
  try{
    const inv=lsGet(LS.gachaInv,{}), stats=lsGet(LS.stats,{}), tix={};
    ROULETTES.forEach(r=>{ tix[r.id]=getTickets(r.id); });

    // Guardar también el pity para sincronizarlo entre dispositivos
    const pityData={};
    ROULETTES.forEach(r=>{
      pityData[`pity_epic_${r.id}`]  = getPityEpic(r.id);
      pityData[`pity_legend_${r.id}`]= getPityLeg(r.id);
    });

    _ignoreNextSnapshot=true;
    await updateDoc(doc(db,'users',currentUID),{
      gacha_inventory: inv,
      gacha_stats:     stats,
      gacha_tickets:   tix,
      gacha_pity:      pityData,
      updatedAt:       serverTimestamp(),
    });
    // Resetear el flag tras un delay para que el snapshot no rebote
    setTimeout(()=>{ _ignoreNextSnapshot=false; }, 1500);
  }catch(e){
    console.warn('[Gacha] sync:',e);
    _ignoreNextSnapshot=false;
  }
}

/**
 * Aplicar datos remotos llegados desde otro dispositivo via onSnapshot
 */
function applyRemoteData(data){
  let changed=false;

  // ── Tickets: tomar el mayor valor por ruleta ──
  if(data.gacha_tickets){
    ROULETTES.forEach(r=>{
      const remote=data.gacha_tickets[r.id]??0;
      const local=getTickets(r.id);
      if(remote>local){
        localStorage.setItem(LS.tickets(r.id), String(remote));
        changed=true;
      }
    });
  }

  // ── Inventario gacha: fusionar (tomar el mayor count por ítem) ──
  if(data.gacha_inventory){
    const local=lsGet(LS.gachaInv,{});
    const merged={...data.gacha_inventory};
    Object.keys(local).forEach(k=>{
      if(!merged[k]) merged[k]=local[k];
      else if((local[k].count||0)>(merged[k].count||0)) merged[k]=local[k];
    });
    if(JSON.stringify(merged)!==JSON.stringify(local)){
      lsSet(LS.gachaInv,merged);
      changed=true;
    }
  }

  // ── Stats: tomar el mayor totalSpins y totalPrizes ──
  if(data.gacha_stats){
    const local=lsGet(LS.stats,{totalSpins:0,totalPrizes:0});
    const merged={
      totalSpins:  Math.max(local.totalSpins||0,  data.gacha_stats.totalSpins||0),
      totalPrizes: Math.max(local.totalPrizes||0, data.gacha_stats.totalPrizes||0),
    };
    if(JSON.stringify(merged)!==JSON.stringify(local)){
      lsSet(LS.stats,merged);
      changed=true;
    }
  }

  // ── Pity: tomar el más alto (el que más giró) ──
  if(data.gacha_pity){
    ROULETTES.forEach(r=>{
      const remoteEpic  = data.gacha_pity[`pity_epic_${r.id}`]??0;
      const remoteLeg   = data.gacha_pity[`pity_legend_${r.id}`]??0;
      const localEpic   = getPityEpic(r.id);
      const localLeg    = getPityLeg(r.id);
      if(remoteEpic>localEpic){
        localStorage.setItem(LS.pityEpic(r.id), String(remoteEpic));
        changed=true;
      }
      if(remoteLeg>localLeg){
        localStorage.setItem(LS.pityLegend(r.id), String(remoteLeg));
        changed=true;
      }
    });
  }

  if(changed){
    renderTicketsDisplay();
    renderHUDTickets();
    updateCurrentWheelInfo();
    renderStats();
    updatePityUI();
    updateInventoryBadge();
    console.log('[Gacha] 🔄 Sincronizado desde otro dispositivo');
  }
}

/**
 * Iniciar listener en tiempo real del documento del usuario
 * Equivalente al onSnapshot de contactos/perfil
 */
function startRealtimeListener(uid){
  if(_gachaUnsub){ _gachaUnsub(); _gachaUnsub=null; }

  _gachaUnsub=onSnapshot(
    doc(db,'users',uid),
    (snap)=>{
      if(!snap.exists())return;
      if(_ignoreNextSnapshot){
        console.log('[Gacha] Snapshot propio — ignorado');
        return;
      }
      applyRemoteData(snap.data());
    },
    (err)=>{ console.warn('[Gacha] onSnapshot error:',err); }
  );

  console.log('[Gacha] ✅ Listener en tiempo real activo');
}

async function loadFromFirebase(uid){
  try{
    const snap=await getDoc(doc(db,'users',uid)); if(!snap.exists())return;
    const d=snap.data();
    if(d.gacha_tickets) ROULETTES.forEach(r=>{
      const lv=parseInt(localStorage.getItem(LS.tickets(r.id))||'-1',10);
      const fv=d.gacha_tickets[r.id]??0;
      localStorage.setItem(LS.tickets(r.id),String(Math.max(lv<0?0:lv,fv)));
    });
    if(d.gacha_inventory){
      const local=lsGet(LS.gachaInv,{}), merged={...d.gacha_inventory};
      Object.keys(local).forEach(k=>{ if(!merged[k])merged[k]=local[k]; else if((local[k].count||0)>(merged[k].count||0))merged[k]=local[k]; });
      lsSet(LS.gachaInv,merged);
    }
    if(d.gacha_stats) lsSet(LS.stats,d.gacha_stats);
    // Cargar pity desde Firebase al iniciar
    if(d.gacha_pity){
      ROULETTES.forEach(r=>{
        const remoteEpic=d.gacha_pity[`pity_epic_${r.id}`]??0;
        const remoteLeg =d.gacha_pity[`pity_legend_${r.id}`]??0;
        const localEpic =getPityEpic(r.id);
        const localLeg  =getPityLeg(r.id);
        if(remoteEpic>localEpic) localStorage.setItem(LS.pityEpic(r.id),  String(remoteEpic));
        if(remoteLeg >localLeg)  localStorage.setItem(LS.pityLegend(r.id), String(remoteLeg));
      });
    }
  }catch(e){ console.warn('[Gacha] load:',e); }
}

/* ══════════════════════════════════════
   RULETAS
══════════════════════════════════════ */
const NOW=new Date(), YR=NOW.getFullYear();
const ROULETTES=[
  { id:'classic', title:'Clásica', icon:'💎', desc:'Premios cotidianos siempre disponibles. ¡Siempre activa!', bg:null, music:null, start:null, end:null,
    rewards:[
      {id:'c1', label:'Esmeraldas x3', weight:70, rarity:'common',   img:'💚', desc:'Paquete pequeño',  stock:null},
      {id:'c2', label:'Cobre x5',      weight:70, rarity:'common',   img:'🪙', desc:'Monedas básicas',  stock:null},
      {id:'c3', label:'Llave x1',      weight:60, rarity:'uncommon', img:'📦', desc:'Llave de cofre',   stock:null},
      {id:'c4', label:'Cobre x10',     weight:50, rarity:'rare',     img:'✨', desc:'Paquete mediano',  stock:null},
      {id:'c5', label:'Esmeraldas x20',weight:4,  rarity:'epic',     img:'💎', desc:'¡Especial!',       stock:null},
      {id:'c6', label:'Cupón 10%',     weight:4,  rarity:'epic',     img:'🎟️', desc:'Descuento tienda', stock:null},
      {id:'c7', label:'Cupón 20%',     weight:4,  rarity:'epic',     img:'🎟️', desc:'Descuento tienda', stock:null},
      {id:'c8', label:'Cupón 30%',     weight:4,  rarity:'epic',     img:'🎟️', desc:'Descuento tienda', stock:null},
      {id:'c9', label:'Cupón 50%',     weight:4,  rarity:'epic',     img:'🎟️', desc:'Gran descuento',   stock:null},
      {id:'c10',label:'Cobre x25',     weight:4,  rarity:'epic',     img:'🪙', desc:'Bolsa grande',     stock:null},
      {id:'c11',label:'Cupón 100% x2', weight:1,  rarity:'legend',   img:'🎟️', desc:'¡Gratis!',         stock:5},
      {id:'c12',label:'Cobre x64',     weight:1,  rarity:'legend',   img:'✨', desc:'Gran bolsa',       stock:null},
    ]
  },
  { id:'dark_moon', title:'Luna Oscura', icon:'🌑', desc:'Temporada de Luna Oscura. Premios de las sombras y rarísimas reliquias.', bg:null, music:null, start:`${YR}-03-01`, end:`${YR}-04-30`,
    rewards:[
      {id:'dm1', label:'Fragmento Sombra', weight:60, rarity:'common',   img:'🌑', desc:'Fragmento oscuro',  stock:null},
      {id:'dm2', label:'Cristal Nocturno', weight:50, rarity:'common',   img:'💜', desc:'Cristal básico',    stock:null},
      {id:'dm3', label:'Velo de Luna',     weight:40, rarity:'uncommon', img:'🌙', desc:'Tejido lunar',      stock:null},
      {id:'dm4', label:'Esencia Oscura',   weight:30, rarity:'uncommon', img:'🌫️',desc:'Esencia rara',      stock:null},
      {id:'dm5', label:'Gema Umbral',      weight:15, rarity:'rare',     img:'🟣', desc:'Gema poderosa',     stock:null},
      {id:'dm6', label:'Orbe de Sombra',   weight:8,  rarity:'rare',     img:'🔮', desc:'Orbe mágico',       stock:null},
      {id:'dm7', label:'Máscara Lunar',    weight:3,  rarity:'epic',     img:'🎭', desc:'Épico de evento',   stock:20},
      {id:'dm8', label:'Armadura de Luna', weight:3,  rarity:'epic',     img:'🛡️', desc:'Protección lunar',  stock:15},
      {id:'dm9', label:'Reliquia Oscura',  weight:1,  rarity:'legend',   img:'⚫', desc:'Rarísima reliquia', stock:3},
      {id:'dm10',label:'Corona de Eclipse',weight:1,  rarity:'legend',   img:'👑', desc:'Solo 2 existen',    stock:2},
    ]
  },
  { id:'spring', title:'Primavera Mágica', icon:'🌸', desc:'Flores encantadas y premios de temporada. ¡Pronto disponible!', bg:null, music:null, start:`${YR}-05-01`, end:`${YR}-06-30`,
    rewards:[
      {id:'sp1', label:'Pétalo Mágico',     weight:60, rarity:'common',   img:'🌸', desc:'Pétalo encantado', stock:null},
      {id:'sp2', label:'Rocío de Flor',     weight:55, rarity:'common',   img:'💧', desc:'Agua primaveral',  stock:null},
      {id:'sp3', label:'Hoja Verde',        weight:45, rarity:'uncommon', img:'🌿', desc:'Hoja rara',        stock:null},
      {id:'sp4', label:'Flor Solar',        weight:35, rarity:'uncommon', img:'🌻', desc:'Flor del sol',     stock:null},
      {id:'sp5', label:'Cristal Flora',     weight:15, rarity:'rare',     img:'🌺', desc:'Cristal floral',   stock:null},
      {id:'sp6', label:'Aura de Bloom',     weight:8,  rarity:'rare',     img:'✨', desc:'Aura brillante',   stock:null},
      {id:'sp7', label:'Hada de Primavera', weight:3,  rarity:'epic',     img:'🧚', desc:'Guardiana floral', stock:10},
      {id:'sp8', label:'Jardín Eterno',     weight:3,  rarity:'epic',     img:'🌳', desc:'Ítem especial',    stock:10},
      {id:'sp9', label:'Reina de Flores',   weight:1,  rarity:'legend',   img:'👸', desc:'Suprema rareza',   stock:3},
      {id:'sp10',label:'Semilla Inmortal',  weight:1,  rarity:'legend',   img:'🌱', desc:'Da vida eterna',   stock:2},
    ]
  },
  { id:'storm', title:'Tormenta Eléctrica', icon:'⚡', desc:'El poder del rayo en tus manos. ¡Termina pronto!', bg:null, music:null, start:`${YR}-01-01`, end:`${YR}-03-31`,
    rewards:[
      {id:'st1', label:'Chispa Eléctrica',  weight:65, rarity:'common',   img:'⚡', desc:'Energía básica',   stock:null},
      {id:'st2', label:'Núcleo de Voltio',  weight:55, rarity:'common',   img:'🔋', desc:'Núcleo cargado',   stock:null},
      {id:'st3', label:'Rayo Comprimido',   weight:40, rarity:'uncommon', img:'🌩️',desc:'Rayo embotellado', stock:null},
      {id:'st4', label:'Plasma Tormentoso', weight:30, rarity:'uncommon', img:'🔵', desc:'Plasma energético',stock:null},
      {id:'st5', label:'Celda de Tormenta', weight:12, rarity:'rare',     img:'🌀', desc:'Celda poderosa',   stock:null},
      {id:'st6', label:'Escudo de Rayos',   weight:8,  rarity:'rare',     img:'🛡️', desc:'Protección máxima',stock:null},
      {id:'st7', label:'Tridente Eléctrico',weight:3,  rarity:'epic',     img:'⚔️', desc:'Arma de tormenta', stock:12},
      {id:'st8', label:'Armadura Voltaica', weight:3,  rarity:'epic',     img:'🦾', desc:'Súper protección', stock:12},
      {id:'st9', label:'Dios del Rayo',     weight:1,  rarity:'legend',   img:'🌟', desc:'Poder supremo',    stock:2},
      {id:'st10',label:'Cetro de Tormenta', weight:1,  rarity:'legend',   img:'🔱', desc:'Solo 1 existe',    stock:1},
    ]
  },
  { id:'cyber', title:'Cyber Gacha', icon:'🤖', desc:'Premios del mundo digital. Abre en julio. ¡Prepárate!', bg:null, music:null, start:`${YR}-07-01`, end:`${YR}-08-31`,
    rewards:[
      {id:'cy1', label:'Bit de Datos',    weight:65, rarity:'common',   img:'💾', desc:'Dato digital',      stock:null},
      {id:'cy2', label:'Chip Básico',     weight:55, rarity:'common',   img:'🔲', desc:'Chip simple',       stock:null},
      {id:'cy3', label:'Circuito Raro',   weight:40, rarity:'uncommon', img:'⚙️', desc:'Circuito especial', stock:null},
      {id:'cy4', label:'Módulo IA',       weight:30, rarity:'uncommon', img:'🧠', desc:'IA integrada',      stock:null},
      {id:'cy5', label:'Núcleo Cuántico', weight:12, rarity:'rare',     img:'🔬', desc:'Tecnología punta',  stock:null},
      {id:'cy6', label:'Servidor Elite',  weight:8,  rarity:'rare',     img:'🖥️', desc:'Servidor premium',  stock:null},
      {id:'cy7', label:'Android Épico',   weight:3,  rarity:'epic',     img:'🤖', desc:'Androide raro',     stock:8},
      {id:'cy8', label:'Holo-Escudo',     weight:3,  rarity:'epic',     img:'🔵', desc:'Escudo holográfico',stock:8},
      {id:'cy9', label:'Singularidad',    weight:1,  rarity:'legend',   img:'🌐', desc:'El origen',         stock:2},
      {id:'cy10',label:'IA Omnisciente',  weight:1,  rarity:'legend',   img:'👁️', desc:'Ve todo',           stock:1},
    ]
  },
  { id:'abyss', title:'Abismo Eterno', icon:'🕳️', desc:'Lo más oscuro del portal. Solo los valientes se atreven.', bg:null, music:null, start:`${YR}-09-01`, end:`${YR}-12-31`,
    rewards:[
      {id:'ab1', label:'Polvo del Abismo', weight:65, rarity:'common',   img:'🕳️',desc:'Polvo oscuro',      stock:null},
      {id:'ab2', label:'Eco Eterno',       weight:55, rarity:'common',   img:'🌊', desc:'Eco del vacío',    stock:null},
      {id:'ab3', label:'Lágrima del Vacío',weight:40, rarity:'uncommon', img:'💧', desc:'Lágrima rara',     stock:null},
      {id:'ab4', label:'Fragmento Oscuro', weight:30, rarity:'uncommon', img:'🌑', desc:'Fragmento denso',  stock:null},
      {id:'ab5', label:'Cristal Abisal',   weight:12, rarity:'rare',     img:'💎', desc:'Cristal profundo', stock:null},
      {id:'ab6', label:'Voz del Abismo',   weight:8,  rarity:'rare',     img:'🔊', desc:'Poder de la voz',  stock:null},
      {id:'ab7', label:'Señor Oscuro',     weight:3,  rarity:'epic',     img:'😈', desc:'Entidad poderosa', stock:8},
      {id:'ab8', label:'Armadura Abisal',  weight:3,  rarity:'epic',     img:'🦂', desc:'Armadura extrema', stock:8},
      {id:'ab9', label:'El Devorador',     weight:1,  rarity:'legend',   img:'🐉', desc:'Bestia legendaria',stock:2},
      {id:'ab10',label:'Vacío Supremo',    weight:1,  rarity:'legend',   img:'♾️', desc:'El infinito',      stock:1},
    ]
  },
];

/* ══════════════════════════════════════
   MISIONES
══════════════════════════════════════ */
const MISSIONS_BY_WHEEL={
  classic:[
    {id:'mc1',title:'Inicia sesión hoy',    desc:'Entra al portal',     freq:'daily',  reward:{count:5}},
    {id:'mc2',title:'Recolecta 200 monedas',desc:'En el juego',         freq:'daily',  reward:{count:1}},
    {id:'mc3',title:'Rompe 20 bloques',     desc:'En cualquier mundo',  freq:'daily',  reward:{count:2}},
    {id:'mc4',title:'Gana 1 mini-juego',    desc:'Cualquier modo',      freq:'weekly', reward:{count:3}},
    {id:'mc5',title:'Explora 5 biomas',     desc:'Biomas distintos',    freq:'weekly', reward:{count:5}},
  ],
  dark_moon:[
    {id:'dm_m1',title:'Entra de noche',      desc:'Entre 20:00-23:59',  freq:'daily',  reward:{count:4}},
    {id:'dm_m2',title:'Derrota 10 enemigos', desc:'En modo oscuro',     freq:'daily',  reward:{count:2}},
    {id:'dm_m3',title:'Completa 1 ritual',   desc:'Ritual nocturno',    freq:'daily',  reward:{count:3}},
    {id:'dm_m4',title:'5 días de racha',     desc:'Esta semana',        freq:'weekly', reward:{count:6}},
    {id:'dm_m5',title:'Derrota al jefe',     desc:'Jefe de Luna Oscura',freq:'weekly', reward:{count:8}},
  ],
  spring:[
    {id:'sp_m1',title:'Recoge 10 flores',   desc:'En el jardín',       freq:'daily',  reward:{count:3}},
    {id:'sp_m2',title:'Planta 5 semillas',  desc:'En tu parcela',      freq:'daily',  reward:{count:2}},
    {id:'sp_m3',title:'Visita el jardín',   desc:'Área de primavera',  freq:'daily',  reward:{count:1}},
    {id:'sp_m4',title:'Cosecha 50 plantas', desc:'Esta semana',        freq:'weekly', reward:{count:7}},
    {id:'sp_m5',title:'Doma una mariposa',  desc:'Criatura de evento', freq:'weekly', reward:{count:6}},
  ],
  storm:[
    {id:'st_m1',title:'Carga 100 voltios',  desc:'Estación de carga',  freq:'daily',  reward:{count:4}},
    {id:'st_m2',title:'Sobrevive 5 rayos',  desc:'Zona de tormenta',   freq:'daily',  reward:{count:2}},
    {id:'st_m3',title:'Activa generador',   desc:'En tu base',         freq:'daily',  reward:{count:3}},
    {id:'st_m4',title:'Elimina 20 drones',  desc:'Esta semana',        freq:'weekly', reward:{count:7}},
    {id:'st_m5',title:'Derrota al Titán',   desc:'Jefe de tormenta',   freq:'weekly', reward:{count:9}},
  ],
  cyber:[
    {id:'cy_m1',title:'Hackea 3 sistemas',  desc:'Modo hacker',        freq:'daily',  reward:{count:4}},
    {id:'cy_m2',title:'Mina 50 bits',       desc:'Minería digital',    freq:'daily',  reward:{count:2}},
    {id:'cy_m3',title:'Actualiza tu IA',    desc:'Laboratorio cyber',  freq:'daily',  reward:{count:3}},
    {id:'cy_m4',title:'Completa circuito',  desc:'Esta semana',        freq:'weekly', reward:{count:8}},
    {id:'cy_m5',title:'Vence a la IA',      desc:'Jefe del sistema',   freq:'weekly', reward:{count:10}},
  ],
  abyss:[
    {id:'ab_m1',title:'Desciende al abismo',desc:'Zona oscura',        freq:'daily',  reward:{count:5}},
    {id:'ab_m2',title:'Encuentra 5 ecos',   desc:'Ecos del vacío',     freq:'daily',  reward:{count:2}},
    {id:'ab_m3',title:'Sobrevive 10 min',   desc:'En el abismo',       freq:'daily',  reward:{count:3}},
    {id:'ab_m4',title:'Derrota 15 sombras', desc:'Esta semana',        freq:'weekly', reward:{count:8}},
    {id:'ab_m5',title:'Vence al Devorador', desc:'Jefe final',         freq:'weekly', reward:{count:12}},
  ],
};

const FOX_MESSAGES={
  classic:  ['¡La clásica nunca falla!','Épico cada 20 tiros','Legendario soft pity desde 45','¡Gira y gana!','Siempre activa'],
  dark_moon:['Sientes la oscuridad...','¡La luna te llama!','Las sombras guardan tesoros','¡Evento limitado!','No pierdas la Luna Oscura'],
  spring:   ['¡Las flores te esperan!','La primavera trae suerte','¡Pronto disponible!','Guarda tus tickets','Temporada floral en camino'],
  storm:    ['¡El rayo te da poder!','¡Termina pronto!','Usa tickets antes de que acabe','El Titán espera','¡Última oportunidad!'],
  cyber:    ['El futuro llega en julio','Tecnología de punta','¡Guarda energía!','La IA te observa','Modo hacker activado'],
  abyss:    ['Lo profundo te llama...','Solo los valientes giran','¡El abismo recompensa!','¿Te atreves?','Septiembre: la oscuridad llega'],
  default:  ['¡Gira y gana!','Épico cada 20','Legendario: soft pity 45+','Buena suerte','¡Colecciona todo!'],
};

/* ══════════════════════════════════════
   ESTADO GLOBAL
══════════════════════════════════════ */
let currentWheelId=ROULETTES[0].id, spinning=false, currentAudio=null, TICKET_MULT=1;
let foxInterval=null, timerInterval=null, boostInterval=null;

/* ══════════════════════════════════════
   STATS
══════════════════════════════════════ */
function getStats(){ return lsGet(LS.stats,{totalSpins:0,totalPrizes:0}); }
function updateStats(d){ lsSet(LS.stats,{...getStats(),...d}); renderStats(); scheduleSync(); }
function renderStats(){
  const s=getStats(), total=ROULETTES.reduce((sum,r)=>sum+getTickets(r.id),0);
  if($('#totalTickets'))$('#totalTickets').textContent=total;
  if($('#totalPrizes')) $('#totalPrizes').textContent=s.totalPrizes||0;
  if($('#totalSpins'))  $('#totalSpins').textContent=s.totalSpins||0;
}

/* ══════════════════════════════════════
   TICKETS
══════════════════════════════════════ */
function getTickets(id){ return Math.max(0,parseInt(localStorage.getItem(LS.tickets(id))||'0',10)); }
function setTickets(id,n){
  localStorage.setItem(LS.tickets(id),String(Math.max(0,Math.floor(n))));
  renderTicketsDisplay(); renderHUDTickets(); updateCurrentWheelInfo(); renderStats(); scheduleSync();
}
function addTickets(id,count){
  const wheel=ROULETTES.find(r=>r.id===id); if(!wheel){console.warn(`[Gacha] ruleta "${id}" no existe`);return;}
  const real=Math.round(count*TICKET_MULT);
  setTickets(id,getTickets(id)+real);
  toast(TICKET_MULT>1?`+${real} tickets "${wheel.title}" (x${TICKET_MULT} boost!)`:`+${real} tickets para "${wheel.title}"`, '🎟️');
}
window.addTickets         = addTickets;
window.renderTicketCounts = ()=>renderTicketsDisplay();
window.renderHUDTickets   = renderHUDTickets;

/* ══════════════════════════════════════
   INVENTARIO GACHA + ÚLTIMOS PREMIOS
══════════════════════════════════════ */
function getGachaInv(){ return lsGet(LS.gachaInv,{}); }

function addToGachaInv(wheelId,reward){
  const inv=getGachaInv(), key=`${wheelId}_${reward.id}`;
  if(!inv[key]) inv[key]={wheelId,rewardId:reward.id,label:reward.label,img:reward.img,rarity:reward.rarity,count:0,lastObtained:null};
  inv[key].count++; inv[key].lastObtained=new Date().toISOString();
  lsSet(LS.gachaInv,inv);
  updateStats({totalPrizes:(getStats().totalPrizes||0)+1});
  updateInventoryBadge(); scheduleSync();
}

function clearWheelInventory(wheelId){
  if(!confirm(`¿Limpiar todo el inventario de "${ROULETTES.find(r=>r.id===wheelId)?.title||wheelId}"?`)) return;
  const inv=getGachaInv();
  Object.keys(inv).forEach(k=>{ if(inv[k].wheelId===wheelId) delete inv[k]; });
  lsSet(LS.gachaInv,inv);
  updateInventoryBadge(); scheduleSync();
  toast('Inventario limpiado','🗑️');
}

function updateInventoryBadge(){
  const inv=getGachaInv(), n=Object.values(inv).filter(i=>i.wheelId===currentWheelId).length;
  if($('#invBadge'))$('#invBadge').textContent=n;
}

function showInventory(){
  const inv=getGachaInv(), items=Object.values(inv).filter(i=>i.wheelId===currentWheelId);
  const wname=ROULETTES.find(w=>w.id===currentWheelId)?.title||currentWheelId;
  const wid=currentWheelId;
  if(!items.length){
    openModal(`
      <h2>INVENTARIO — ${wname}</h2>
      <p style="font-family:var(--font-vt);font-size:1.15rem;color:var(--muted);text-align:center;padding:30px">Aún no has ganado nada aquí.<br>¡Gira la ruleta!</p>
      <div style="text-align:center;margin-top:14px">
        <button class="btn-pixel btn-purple" onclick="document.getElementById('modal').setAttribute('aria-hidden','true')">CERRAR</button>
      </div>`);
    return;
  }
  const order={legend:0,epic:1,rare:2,uncommon:3,common:4};
  items.sort((a,b)=>(order[a.rarity]??5)-(order[b.rarity]??5));
  const cards=items.map(i=>`
    <div class="prize-card ${i.rarity}" style="padding:14px;text-align:center">
      <div class="prize-img">${i.img}</div>
      <div class="prize-name">${i.label}</div>
      <div class="prize-rarity" style="color:${rarityColor(i.rarity)}">${i.rarity.toUpperCase()}</div>
      <div style="font-family:var(--font-pixel);font-size:0.55rem;color:#c4b5fd;margin-top:8px">x${i.count}</div>
    </div>`).join('');
  openModal(`
    <h2>INVENTARIO — ${wname}</h2>
    <p style="font-family:var(--font-vt);font-size:1.1rem;color:var(--muted);text-align:center;margin-bottom:14px">
      ${items.length} tipos · ${items.reduce((s,i)=>s+i.count,0)} ítems totales
    </p>
    <div class="prize-grid-modal">${cards}</div>
    <div style="display:flex;gap:10px;justify-content:center;margin-top:16px;flex-wrap:wrap">
      <button class="btn-pixel btn-ghost" id="btnClearInv">🗑️ LIMPIAR INVENTARIO</button>
      <button class="btn-pixel btn-purple" onclick="document.getElementById('modal').setAttribute('aria-hidden','true')">CERRAR</button>
    </div>`);
  setTimeout(()=>{
    $('#btnClearInv')?.addEventListener('click',()=>{
      closeModal();
      clearWheelInventory(wid);
    });
  },50);
}

/* ══════════════════════════════════════
   ÚLTIMOS PREMIOS
══════════════════════════════════════ */
function saveLastPrizes(rewards){
  lsSet(LS.lastPrizes, rewards.map(r=>({img:r.img,label:r.label,rarity:r.rarity,desc:r.desc})));
}
function renderLastPrizesPanel(rewards){
  const c=$('#lastPrize'); if(!c) return;
  if(!rewards||!rewards.length){
    c.innerHTML=`<div class="no-prize"><div class="no-prize-ico">?</div><p>AÚN NO HAS GIRADO</p></div>`;
    return;
  }
  if(rewards.length===1){
    const r=rewards[0];
    c.innerHTML=`
      <div class="prize-card ${r.rarity}">
        <div class="prize-img">${r.img}</div>
        <div class="prize-name">${r.label}</div>
        <div class="prize-rarity" style="color:${rarityColor(r.rarity)}">${r.rarity.toUpperCase()}</div>
      </div>`;
  } else {
    const cards=rewards.map(r=>`
      <div class="last-prize-mini ${r.rarity}" title="${r.label}">
        <div class="lpm-img">${r.img}</div>
        <div class="lpm-name">${r.label}</div>
        <div class="lpm-rar" style="color:${rarityColor(r.rarity)}">${r.rarity.slice(0,3).toUpperCase()}</div>
      </div>`).join('');
    c.innerHTML=`<div class="last-prize-grid">${cards}</div>`;
  }
}

/* ══════════════════════════════════════
   TIEMPO
══════════════════════════════════════ */
function isWheelActive(w){ if(!w.start&&!w.end)return true; const now=new Date(); if(w.start&&now<new Date(w.start+'T00:00:00'))return false; if(w.end&&now>new Date(w.end+'T23:59:59'))return false; return true; }
function getTimeUntilStart(w){ if(!w.start)return null; return Math.max(0,new Date(w.start+'T00:00:00')-new Date()); }
function getTimeUntilEnd(w){ if(!w.end)return null; return Math.max(0,new Date(w.end+'T23:59:59')-new Date()); }
function formatMs(ms){
  if(ms<=0)return'Finalizada';
  const s=Math.floor(ms/1000),m=Math.floor(s/60),h=Math.floor(m/60),d=Math.floor(h/24);
  const pad=n=>String(n).padStart(2,'0');
  if(d>0)return`${d}d ${pad(h%24)}h ${pad(m%60)}m ${pad(s%60)}s`;
  if(h>0)return`${pad(h)}h ${pad(m%60)}m ${pad(s%60)}s`;
  if(m>0)return`${pad(m)}m ${pad(s%60)}s`;
  return`${pad(s)}s`;
}
function formatTime(sec){
  const h=String(Math.floor(sec/3600)).padStart(2,'0'),m=String(Math.floor((sec%3600)/60)).padStart(2,'0'),s=String(sec%60).padStart(2,'0');
  return`${h}:${m}:${s}`;
}

/* ══════════════════════════════════════
   PITY
══════════════════════════════════════ */
function getPityEpic(id)  { return parseInt(localStorage.getItem(LS.pityEpic(id))  ||'0',10); }
function setPityEpic(id,v){ localStorage.setItem(LS.pityEpic(id),  String(v)); updatePityUI(); }
function getPityLeg(id)   { return parseInt(localStorage.getItem(LS.pityLegend(id))||'0',10); }
function setPityLeg(id,v) { localStorage.setItem(LS.pityLegend(id),String(v)); updatePityUI(); }

function updatePityUI(){
  const pe=getPityEpic(currentWheelId), pl=getPityLeg(currentWheelId);
  const ep=((pe%20)/20)*100, lp=(pl/60)*100;
  if($('#pityFillEpic'))  $('#pityFillEpic').style.width  =ep+'%';
  if($('#pityFillLegend'))$('#pityFillLegend').style.width=lp+'%';
  if($('#currentPity'))   $('#currentPity').textContent   =`E:${20-(pe%20)} L:${pl}/60`;
  if($('#hudFillEpic'))   $('#hudFillEpic').style.width   =ep+'%';
  if($('#hudFillLeg'))    $('#hudFillLeg').style.width    =lp+'%';
}

/* ══════════════════════════════════════
   STOCK
══════════════════════════════════════ */
function getStock(id)  { const v=localStorage.getItem(LS.stock(id)); return v!==null?parseInt(v,10):null; }
function setStock(id,v){ if(v===null)localStorage.removeItem(LS.stock(id)); else localStorage.setItem(LS.stock(id),String(Math.max(0,v))); }
function initStocks()  { ROULETTES.forEach(w=>w.rewards.forEach(r=>{ if(r.stock!==null&&getStock(r.id)===null)setStock(r.id,r.stock); })); }
function useStock(id)  { const c=getStock(id); if(c!==null){ if(c<=0)return false; setStock(id,c-1); } return true; }

/* ══════════════════════════════════════
   PICK CON PITY
══════════════════════════════════════ */
function pickWithPity(wheelId){
  const wheel=ROULETTES.find(w=>w.id===wheelId); if(!wheel)return null;
  const pe=getPityEpic(wheelId), pl=getPityLeg(wheelId);
  const avail=wheel.rewards.filter(r=>{ const s=getStock(r.id); return s===null||s>0; });
  if(!avail.length){ toast('Sin premios disponibles','⚠️'); return null; }
  const epics  =avail.filter(r=>r.rarity==='epic');
  const legends=avail.filter(r=>r.rarity==='legend');

  if(pl>=60&&legends.length){
    const r=legends[Math.floor(Math.random()*legends.length)];
    setPityEpic(wheelId,pe+1); setPityLeg(wheelId,0); return r;
  }
  if(pl>=45&&legends.length){
    const extra=(pl-44)*0.06;
    if(Math.random()<extra){
      const r=legends[Math.floor(Math.random()*legends.length)];
      setPityEpic(wheelId,pe+1); setPityLeg(wheelId,0); return r;
    }
  }
  if(pe>=20&&epics.length){
    const r=epics[Math.floor(Math.random()*epics.length)];
    setPityEpic(wheelId,0); setPityLeg(wheelId,pl+1); return r;
  }
  const total=avail.reduce((s,r)=>s+r.weight,0);
  let rng=Math.random()*total;
  for(const r of avail){
    rng-=r.weight;
    if(rng<=0){
      if(r.rarity==='legend')   { setPityLeg(wheelId,0);   setPityEpic(wheelId,pe+1); }
      else if(r.rarity==='epic'){ setPityEpic(wheelId,0);  setPityLeg(wheelId,pl+1); }
      else                      { setPityEpic(wheelId,pe+1); setPityLeg(wheelId,pl+1); }
      return r;
    }
  }
  return avail[avail.length-1];
}

/* ══════════════════════════════════════
   RENDER RULETA SVG
══════════════════════════════════════ */
function renderWheel(wheelId){
  const wheel=ROULETTES.find(w=>w.id===wheelId); if(!wheel)return;
  const container=$('#wheel'); container.innerHTML='';
  const cssSize=getComputedStyle(document.documentElement).getPropertyValue('--wheel-size').trim();
  const size=parseInt(cssSize)||420, r=size/2, cx=r, cy=r, n=wheel.rewards.length, deg=360/n;
  const colorMap={common:'rgba(156,163,175,0.08)',uncommon:'rgba(52,211,153,0.10)',rare:'rgba(96,165,250,0.10)',epic:'rgba(192,132,252,0.15)',legend:'rgba(251,191,36,0.18)'};
  const wrapper=document.createElement('div'); wrapper.className='wheel-wrapper';
  Object.assign(wrapper.style,{width:`${size}px`,height:`${size}px`,position:'relative',transformOrigin:'center center',transition:'transform 4.5s cubic-bezier(0.14,0.9,0.26,1)'});
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('width',size); svg.setAttribute('height',size); svg.style.overflow='visible';
  const bgC=document.createElementNS('http://www.w3.org/2000/svg','circle');
  bgC.setAttribute('cx',cx); bgC.setAttribute('cy',cy); bgC.setAttribute('r',r); bgC.setAttribute('fill','#0d0b15');
  svg.appendChild(bgC);
  wheel.rewards.forEach((reward,i)=>{
    const sa=(i*deg-90)*Math.PI/180, ea=((i+1)*deg-90)*Math.PI/180;
    const x1=cx+r*Math.cos(sa),y1=cy+r*Math.sin(sa),x2=cx+r*Math.cos(ea),y2=cy+r*Math.sin(ea);
    const large=deg>180?1:0;
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d',`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`);
    path.setAttribute('fill',colorMap[reward.rarity]||'rgba(255,255,255,0.04)');
    path.setAttribute('stroke','rgba(139,92,246,0.2)'); path.setAttribute('stroke-width','1.5');
    svg.appendChild(path);
    const line=document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1',cx); line.setAttribute('y1',cy); line.setAttribute('x2',x1); line.setAttribute('y2',y1);
    line.setAttribute('stroke','rgba(139,92,246,0.3)'); line.setAttribute('stroke-width','2');
    svg.appendChild(line);
    const mid=(sa+ea)/2, tx=cx+(r*0.68)*Math.cos(mid), ty=cy+(r*0.68)*Math.sin(mid);
    const emoji=document.createElementNS('http://www.w3.org/2000/svg','text');
    emoji.setAttribute('x',tx); emoji.setAttribute('y',ty);
    emoji.setAttribute('text-anchor','middle'); emoji.setAttribute('dominant-baseline','middle');
    emoji.setAttribute('font-size','18'); emoji.textContent=reward.img||'?';
    svg.appendChild(emoji);
  });
  const edge=document.createElementNS('http://www.w3.org/2000/svg','circle');
  edge.setAttribute('cx',cx); edge.setAttribute('cy',cy); edge.setAttribute('r',r-2);
  edge.setAttribute('stroke','rgba(139,92,246,0.6)'); edge.setAttribute('stroke-width','4'); edge.setAttribute('fill','none');
  svg.appendChild(edge);
  wrapper.appendChild(svg); container.appendChild(wrapper);
  updateCurrentWheelInfo(); updatePityUI(); checkWheelLock(wheel); updateSpinButtons();
}

/* ══════════════════════════════════════
   LOCK
══════════════════════════════════════ */
function checkWheelLock(wheel){
  const lockEl=$('#wheelLock'),txt=$('#lockText'),rangeEl=$('#lockRange'); if(!lockEl)return;
  if(!isWheelActive(wheel)){
    lockEl.hidden=false;
    const ts=getTimeUntilStart(wheel),te=getTimeUntilEnd(wheel);
    if(ts&&ts>0){ txt.textContent='PRÓXIMAMENTE'; rangeEl.textContent=`Inicia en ${formatMs(ts)}`; }
    else        { txt.textContent='FINALIZADA';   rangeEl.textContent=wheel.end?new Date(wheel.end+'T23:59:59').toLocaleDateString('es-ES'):'—'; }
  } else { lockEl.hidden=true; }
}
function updateSpinButtons(){
  const wheel=ROULETTES.find(w=>w.id===currentWheelId), active=wheel&&isWheelActive(wheel);
  const b1=$('#btnSpin'),b10=$('#btnSpin10');
  if(b1) { b1.disabled=!active||spinning;  b1.style.pointerEvents=(!active||spinning)?'none':''; }
  if(b10){ b10.disabled=!active||spinning; b10.style.pointerEvents=(!active||spinning)?'none':''; }
}

/* ══════════════════════════════════════
   GIRO
══════════════════════════════════════ */
async function spinWheel(times=1){
  if(spinning)return;
  const wheel=ROULETTES.find(w=>w.id===currentWheelId);
  if(!wheel||!isWheelActive(wheel)){ toast('Ruleta no disponible','🔒'); return; }
  const tix=getTickets(currentWheelId);
  if(tix<times){ toast(`Necesitas ${times} ticket${times>1?'s':''} para "${wheel.title}"`, '⚠️'); return; }
  setTickets(currentWheelId,tix-times);
  spinning=true; updateSpinButtons();
  updateStats({totalSpins:(getStats().totalSpins||0)+times});
  const results=[];
  for(let i=0;i<times;i++){
    const reward=pickWithPity(currentWheelId); if(!reward)continue;
    if(!useStock(reward.id)){ toast(`"${reward.label}" agotado`,'⚠️'); continue; }
    addToGachaInv(currentWheelId,reward); results.push(reward);
  }
  if(!results.length){ spinning=false; updateSpinButtons(); return; }
  const last=results[results.length-1];
  const wrapEl=$('.wheel-wrapper');
  if(wrapEl){
    wrapEl.style.transition='none'; wrapEl.style.transform='rotate(0deg)'; void wrapEl.offsetWidth;
    const idx=wheel.rewards.findIndex(r=>r.id===last.id);
    const segDeg=360/wheel.rewards.length;
    wrapEl.style.transition='transform 4.5s cubic-bezier(0.14,0.9,0.26,1)';
    wrapEl.style.transform=`rotate(${6*360+(270-(idx*segDeg+segDeg/2))}deg)`;
  }
  const tickIv=setInterval(()=>beep(120,0.02),80);
  await wait(4600); clearInterval(tickIv);
  spinning=false; updateSpinButtons();
  saveLastPrizes(results);
  renderLastPrizesPanel(results);
  times===1 ? showPrizeModal(last) : showMultiPrizeModal(results);
  beep(880,0.05,0.06);
  // Forzar sync inmediato después de un giro (no esperar el delay de 3s)
  scheduleSync();
}

/* ══════════════════════════════════════
   MODALES
══════════════════════════════════════ */
function rarityColor(r){ return{common:'#9ca3af',uncommon:'#34d399',rare:'#60a5fa',epic:'#c084fc',legend:'#fbbf24'}[r]||'#fff'; }
function openModal(html){ const m=$('#modal'),c=$('#modalContent'); if(!m||!c)return; c.innerHTML=html; m.setAttribute('aria-hidden','false'); }
function closeModal(){ $('#modal')?.setAttribute('aria-hidden','true'); }

function showPrizeModal(reward){
  openModal(`
    <div style="text-align:center;padding:20px">
      <div style="font-size:80px;margin-bottom:14px">${reward.img}</div>
      <h2 style="color:${rarityColor(reward.rarity)};text-shadow:2px 2px 0 #000">${reward.label}</h2>
      <p style="font-family:var(--font-vt);font-size:1.2rem;color:var(--muted);margin:10px 0">${reward.desc}</p>
      <span style="display:inline-block;font-family:var(--font-pixel);font-size:0.34rem;padding:5px 14px;border:2px solid ${rarityColor(reward.rarity)};color:${rarityColor(reward.rarity)};background:rgba(0,0,0,0.4)">
        ${reward.rarity.toUpperCase()}
      </span>
      <div style="margin-top:24px">
        <button class="btn-pixel btn-purple" onclick="document.getElementById('modal').setAttribute('aria-hidden','true')">¡GENIAL!</button>
      </div>
    </div>`);
}
function showMultiPrizeModal(rewards){
  const cards=rewards.map(r=>`
    <div class="prize-card-sm ${r.rarity}">
      <div class="pcm-img">${r.img}</div>
      <div class="pcm-name">${r.label}</div>
      <div class="pcm-rarity" style="color:${rarityColor(r.rarity)}">${r.rarity.toUpperCase()}</div>
    </div>`).join('');
  openModal(`
    <h2>TIRADA x${rewards.length}</h2>
    <div class="prize-grid-modal">${cards}</div>
    <div style="text-align:center">
      <button class="btn-pixel btn-purple large" onclick="document.getElementById('modal').setAttribute('aria-hidden','true')">CONTINUAR</button>
    </div>`);
}

/* ══════════════════════════════════════
   PREVIEW
══════════════════════════════════════ */
function showPreview(){
  const wheel=ROULETTES.find(w=>w.id===currentWheelId); if(!wheel)return;
  const cards=wheel.rewards.map(r=>{
    const s=getStock(r.id), stk=s!==null?`Stock: ${s}`:'Ilimitado';
    return`<div class="prize-card-sm ${r.rarity}">
      <div class="pcm-img">${r.img}</div>
      <div class="pcm-name">${r.label}</div>
      <div class="pcm-rarity" style="color:${rarityColor(r.rarity)}">${r.rarity.toUpperCase()}</div>
      <div style="font-family:var(--font-pixel);font-size:0.22rem;color:var(--muted);margin-top:4px">${stk}</div>
      <div style="font-family:var(--font-vt);font-size:0.9rem;color:var(--dim)">${r.desc}</div>
    </div>`;
  }).join('');
  openModal(`
    <h2>PREMIOS — ${wheel.title.toUpperCase()}</h2>
    <div class="prize-grid-modal">${cards}</div>
    <div style="text-align:center">
      <button class="btn-pixel btn-purple" onclick="document.getElementById('modal').setAttribute('aria-hidden','true')">CERRAR</button>
    </div>`);
}

function showRules(){
  openModal(`
    <h2>REGLAS DEL SISTEMA GACHA</h2>
    <div class="rules-body">
      <h3>TICKETS</h3>
      <ul>
        <li>Cada ruleta tiene sus propios tickets independientes</li>
        <li>Se compran en la <a href="tienda.html" style="color:var(--a)">Tienda</a> y llegan automáticamente</li>
        <li>También se ganan completando misiones</li>
      </ul>
      <h3>PITY / GARANTÍA</h3>
      <ul>
        <li><strong>Épico: garantizado cada 20 tiros</strong></li>
        <li><strong>Legendario: puede salir antes de los 60 tiros</strong> (probabilidad creciente desde tiro 45)</li>
        <li><strong>Hard pity legendario: tiro 60</strong> — siempre sale</li>
      </ul>
      <h3>MISIONES</h3>
      <ul>
        <li>Diarias: se resetean a las 00:00 hora local</li>
        <li>Semanales: se resetean cada lunes a las 00:00</li>
        <li>Las misiones de ruletas no iniciadas están bloqueadas</li>
      </ul>
      <h3>INVENTARIO</h3>
      <ul>
        <li>Cada ruleta tiene su propio inventario</li>
        <li>Puedes limpiar el inventario de cada ruleta por separado</li>
      </ul>
    </div>
    <div style="text-align:center;margin-top:18px">
      <button class="btn-pixel btn-purple large" onclick="document.getElementById('modal').setAttribute('aria-hidden','true')">ENTENDIDO</button>
    </div>`);
}

/* ══════════════════════════════════════
   TABS RULETAS
══════════════════════════════════════ */
function renderWheelTabs(){
  const container=$('#wheelTabs'); if(!container)return;
  container.innerHTML='';
  ROULETTES.forEach(wheel=>{
    const active=isWheelActive(wheel), ts=getTimeUntilStart(wheel), te=getTimeUntilEnd(wheel);
    let timerHTML='';
    if(te===null)     timerHTML='<span class="tab-timer permanent">PERMANENTE</span>';
    else if(ts&&ts>0) timerHTML=`<span class="tab-timer upcoming" data-wheel="${wheel.id}" data-ts="${Date.now()+ts}">ABRE EN: ${formatMs(ts)}</span>`;
    else if(te>0)     timerHTML=`<span class="tab-timer ${te<604800000?'ending-soon':''}" data-wheel="${wheel.id}" data-te="${Date.now()+te}">CIERRA: ${formatMs(te)}</span>`;
    else              timerHTML='<span class="tab-timer expired">FINALIZADA</span>';
    const tab=document.createElement('div');
    tab.className=`wheel-tab${wheel.id===currentWheelId?' active':''}`;
    tab.innerHTML=`
      <span class="tab-ico">${wheel.icon}</span>
      <span class="tab-name">${wheel.title.toUpperCase()}</span>
      <span class="tab-desc">${wheel.desc}</span>
      ${timerHTML}
      <span class="tab-status ${active?'active':'locked'}"></span>`;
    tab.addEventListener('click',()=>switchWheel(wheel.id));
    container.appendChild(tab);
  });
}
function switchWheel(id){
  currentWheelId=id;
  renderWheelTabs(); renderWheel(id); renderMissions();
  updateCurrentWheelInfo();
  const wheel=ROULETTES.find(w=>w.id===id);
  if(wheel)updateBackground(wheel);
  updateInventoryBadge(); updateFoxMessage();
}
function updateWheelTimers(){
  document.querySelectorAll('.tab-timer[data-wheel]').forEach(el=>{
    const endMs=el.dataset.te?parseInt(el.dataset.te):null, startMs=el.dataset.ts?parseInt(el.dataset.ts):null, now=Date.now();
    if(endMs!==null)  { const diff=endMs-now;   el.textContent=diff>0?`CIERRA: ${formatMs(diff)}`:'FINALIZADA'; }
    if(startMs!==null){ const diff=startMs-now; el.textContent=diff>0?`ABRE EN: ${formatMs(diff)}`:'¡ABIERTA!'; }
  });
  const wheel=ROULETTES.find(w=>w.id===currentWheelId);
  if(wheel){ checkWheelLock(wheel); updateSpinButtons(); }
}

/* ══════════════════════════════════════
   INFO RULETA
══════════════════════════════════════ */
function updateCurrentWheelInfo(){
  const wheel=ROULETTES.find(w=>w.id===currentWheelId); if(!wheel)return;
  if($('#currentWheelName'))    $('#currentWheelName').textContent    =wheel.title.toUpperCase();
  if($('#currentWheelTickets')) $('#currentWheelTickets').textContent =getTickets(currentWheelId);
  if($('#wheelDesc'))           $('#wheelDesc').textContent           =wheel.desc;
  updatePityUI();
  const expEl=$('#wheelExpire'); if(!expEl)return;
  const te=getTimeUntilEnd(wheel), ts=getTimeUntilStart(wheel);
  if(te===null){ expEl.textContent='PERMANENTE'; expEl.style.cssText='display:inline-block;color:#ffb700;border-color:rgba(251,191,36,0.3)'; }
  else if(ts&&ts>0){ expEl.textContent=`ABRE EN: ${formatMs(ts)}`; expEl.style.cssText='display:inline-block;color:#60a5fa;border-color:rgba(96,165,250,0.3)'; }
  else if(te>0){ expEl.textContent=`CIERRA EN: ${formatMs(te)}`; expEl.style.cssText=te<604800000?'display:inline-block;color:#ff6b6b;border-color:rgba(239,68,68,0.3)':'display:inline-block;color:#ffb700;border-color:rgba(255,165,0,0.3)'; }
  else expEl.style.display='none';
}

/* ══════════════════════════════════════
   TICKETS DISPLAY
══════════════════════════════════════ */
function renderTicketsDisplay(){
  const box=$('#ticketsDisplay'); if(!box)return; box.innerHTML='';
  ROULETTES.forEach(wheel=>{
    const badge=document.createElement('div'); badge.className='ticket-badge';
    badge.innerHTML=`<div class="tb-ico">${wheel.icon}</div><div class="tb-info"><div class="tb-name">${wheel.title.toUpperCase()}</div><div class="tb-count">${getTickets(wheel.id)}</div></div>`;
    box.appendChild(badge);
  });
  renderHUDTickets();
}
function renderHUDTickets(){
  const box=$('#hudTickets'); if(!box)return; box.innerHTML='';
  ROULETTES.forEach(wheel=>{
    const slot=document.createElement('div'); slot.className='hud-ticket-slot'; slot.title=`Tickets ${wheel.title}`;
    slot.innerHTML=`<span class="t-ico">${wheel.icon}</span><span>${getTickets(wheel.id)}</span>`;
    box.appendChild(slot);
  });
}

/* ══════════════════════════════════════
   MISIONES
══════════════════════════════════════ */
function getMissionsState(){ return lsGet(LS.missions,{}); }
function setMissionsState(s){ lsSet(LS.missions,s); }
function todayStr(){ const d=new Date(); return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function weekStr(){
  const d=new Date(); d.setHours(0,0,0,0);
  const day=d.getDay(), diff=day===0?-6:1-day;
  d.setDate(d.getDate()+diff);
  return`${d.getFullYear()}-W${String(Math.ceil((d-new Date(d.getFullYear(),0,1))/604800000)).padStart(2,'0')}`;
}
function isMissionDone(id,freq){
  const s=getMissionsState()[id]; if(!s||!s.completedAt)return false;
  if(freq==='daily') return s.resetDate===todayStr();
  if(freq==='weekly')return s.resetDate===weekStr();
  return!!s.completedAt;
}
function msUntilMidnight(){ const now=new Date(),mn=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1,0,0,0,0); return Math.max(0,mn-now); }
function msUntilMonday(){ const now=new Date(),day=now.getDay(),du=day===1?7:(8-day)%7||7,mn=new Date(now.getFullYear(),now.getMonth(),now.getDate()+du,0,0,0,0); return Math.max(0,mn-now); }

function renderMissions(){
  const box=$('#missionsList'); if(!box)return; box.innerHTML='';
  const wheel=ROULETTES.find(w=>w.id===currentWheelId);
  const missions=MISSIONS_BY_WHEEL[currentWheelId]||[];
  let available=0;

  if(wheel&&!isWheelActive(wheel)&&getTimeUntilStart(wheel)&&getTimeUntilStart(wheel)>0){
    box.innerHTML=`
      <div class="missions-locked-msg">
        <div class="mlm-ico">🔒</div>
        <div class="mlm-txt">MISIONES BLOQUEADAS</div>
        <div class="mlm-sub">La ruleta aún no ha iniciado. Las misiones estarán disponibles cuando abra.</div>
      </div>`;
    if($('#missionsBadge'))$('#missionsBadge').textContent=0;
    return;
  }

  if(!missions.length){
    box.innerHTML='<p style="font-family:var(--font-pixel);font-size:0.28rem;color:var(--muted);padding:12px;line-height:2.2">SIN MISIONES</p>';
    if($('#missionsBadge'))$('#missionsBadge').textContent=0;
    return;
  }

  const hasDailies=missions.some(m=>m.freq==='daily'), hasWeeklies=missions.some(m=>m.freq==='weekly');
  let header='';
  if(hasDailies){
    const sec=Math.floor(msUntilMidnight()/1000);
    header+=`<div class="mission-reset-row daily-reset"><span class="mcd-label">DIARIAS RESET:</span><span class="mcd-val" id="mcd-daily">${formatTime(sec)}</span></div>`;
  }
  if(hasWeeklies){
    const sec=Math.floor(msUntilMonday()/1000);
    header+=`<div class="mission-reset-row weekly-reset"><span class="mcd-label">SEMANALES RESET:</span><span class="mcd-val" id="mcd-weekly">${formatTime(sec)}</span></div>`;
  }
  if(header){ const h=document.createElement('div'); h.innerHTML=header; box.appendChild(h); }

  missions.forEach(m=>{
    const done=isMissionDone(m.id,m.freq); if(!done)available++;
    const div=document.createElement('div'); div.className=`mission-item${done?' completed':''}`;
    div.innerHTML=`
      <div class="mi-title">${m.title}</div>
      <div class="mi-desc">${m.desc}</div>
      <div class="mi-foot">
        <div class="mi-tags">
          <span class="mi-tag ${m.freq}">${m.freq==='daily'?'DIARIA':'SEMANAL'}</span>
          <span class="mi-tag reward">+${m.reward.count} TKT</span>
        </div>
        <button class="mi-btn" ${done?'disabled':''}>${done?'✓':'▶'}</button>
      </div>`;
    div.querySelector('.mi-btn')?.addEventListener('click',()=>{ if(!done)completeMission(m.id,m.freq,m.reward.count); });
    box.appendChild(div);
  });
  if($('#missionsBadge'))$('#missionsBadge').textContent=available;
}

function completeMission(id,freq,count){
  if(isMissionDone(id,freq)){ toast('Misión ya completada','✓'); return; }
  const state=getMissionsState();
  state[id]={completedAt:Date.now(),resetDate:freq==='daily'?todayStr():weekStr()};
  setMissionsState(state);
  addTickets(currentWheelId,count); renderMissions();
}
function updateMissionCountdowns(){
  const daily=$('#mcd-daily'); if(daily)daily.textContent=formatTime(Math.floor(msUntilMidnight()/1000));
  const weekly=$('#mcd-weekly'); if(weekly)weekly.textContent=formatTime(Math.floor(msUntilMonday()/1000));
}

/* ══════════════════════════════════════
   MÚSICA / BOOST / NPC / TOAST / BEEP / STARS
══════════════════════════════════════ */
function playMusic(url){ if(currentAudio){currentAudio.pause();currentAudio=null;} if(!url)return; const a=new Audio(url);a.loop=true;a.volume=0.3;a.play().catch(()=>{});currentAudio=a; }
function updateBackground(wheel){ playMusic(wheel.music||null); }

const BOOST_DUR=3600;
let boostState=lsGet(LS.boostState,{activeUntil:0,cooldownUntil:0});
function getTonightMidnight(){ const d=new Date();d.setHours(24,0,0,0);return d.getTime(); }
function updateBoostUI(){
  const now=Date.now(),btn=$('#multiplierBtn'),timer=$('#boostTimer'),status=$('#boostStatus');
  if(!btn||!timer||!status)return;
  if(boostState.activeUntil>now){
    const diff=Math.floor((boostState.activeUntil-now)/1000);
    btn.disabled=true; btn.textContent='ACTIVO x2'; timer.textContent=formatTime(diff); status.textContent='ACTIVO x2'; TICKET_MULT=2;
  } else if(boostState.cooldownUntil>now){
    const diff=Math.floor((boostState.cooldownUntil-now)/1000);
    btn.disabled=true; btn.textContent='COOLDOWN'; timer.textContent=formatTime(diff); status.textContent='COOLDOWN'; TICKET_MULT=1;
  } else {
    btn.disabled=false; btn.textContent='ACTIVAR x2'; timer.textContent=''; status.textContent='DISPONIBLE'; TICKET_MULT=1;
  }
}

function initFox(){ updateFoxMessage(); foxInterval=setInterval(updateFoxMessage,9000); }
function updateFoxMessage(){
  const d=$('#npc-dialog'); if(!d)return;
  const msgs=FOX_MESSAGES[currentWheelId]||FOX_MESSAGES.default;
  d.textContent=msgs[Math.floor(Math.random()*msgs.length)];
}

function toast(msg,icon='✓',type=''){
  const t=$('#toast'); if(!t)return;
  t.textContent=`${icon} ${msg}`; t.className=`toast show ${type}`;
  clearTimeout(t._tm); t._tm=setTimeout(()=>t.classList.remove('show'),3200);
}

let _actx=null;
function getACtx(){ if(!_actx&&(window.AudioContext||window.webkitAudioContext))_actx=new(window.AudioContext||window.webkitAudioContext)(); return _actx; }
function beep(freq=440,dur=0.03,vol=0.03){ const ctx=getACtx();if(!ctx)return; const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=freq;g.gain.value=vol;o.connect(g);g.connect(ctx.destination);o.start();setTimeout(()=>o.stop(),dur*1000); }

function initStars(){
  const canvas=$('#bgParticles'); if(!canvas)return;
  canvas.width=window.innerWidth; canvas.height=window.innerHeight;
  const ctx=canvas.getContext('2d');
  const COLS=['#8b5cf6','#c4b5fd','#ffffff','#6d28d9','#fbbf24'];
  const stars=Array.from({length:80},()=>({x:Math.random()*canvas.width,y:Math.random()*canvas.height,r:Math.random()*2+0.5,o:Math.random()*0.4+0.1,speed:Math.random()*0.25+0.06,ci:Math.floor(Math.random()*COLS.length)}));
  (function draw(){ctx.clearRect(0,0,canvas.width,canvas.height);stars.forEach(s=>{ctx.globalAlpha=s.o;ctx.fillStyle=COLS[s.ci];ctx.fillRect(Math.floor(s.x),Math.floor(s.y),Math.ceil(s.r),Math.ceil(s.r));s.y-=s.speed;if(s.y<0){s.y=canvas.height;s.x=Math.random()*canvas.width;}});requestAnimationFrame(draw);})();
  window.addEventListener('resize',()=>{canvas.width=window.innerWidth;canvas.height=window.innerHeight;});
}

function initReveal(){
  const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}});},{threshold:0.12});
  document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
}
function initNav(){ const btn=$('#hamburger'),nav=$('#main-nav'); if(btn&&nav)btn.addEventListener('click',()=>nav.classList.toggle('open')); }
function initTickets(){ ROULETTES.forEach(r=>{ if(localStorage.getItem(LS.tickets(r.id))===null)localStorage.setItem(LS.tickets(r.id),'5'); }); }

/* ══════════════════════════════════════
   BOOT
══════════════════════════════════════ */
function boot(){
  console.log('🎡 Moonveil Gacha v3.1 — Sync Edition');
  initStocks(); initTickets();
  renderWheelTabs(); renderWheel(currentWheelId); renderMissions();
  renderTicketsDisplay(); renderHUDTickets();
  updateCurrentWheelInfo(); updatePityUI(); updateBoostUI(); renderStats(); updateInventoryBadge();
  const wheel=ROULETTES.find(w=>w.id===currentWheelId);
  if(wheel)updateBackground(wheel);
  const lp=lsGet(LS.lastPrizes,null);
  if(lp&&lp.length)renderLastPrizesPanel(lp);
  initStars(); initReveal(); initNav(); initFox();
  boostInterval=setInterval(updateBoostUI,1000);
  timerInterval=setInterval(()=>{ updateWheelTimers(); updateCurrentWheelInfo(); updateMissionCountdowns(); },1000);

  $('#btnSpin')?.addEventListener('click',()=>spinWheel(1));
  $('#btnSpin10')?.addEventListener('click',()=>spinWheel(10));
  $('#btnPreview')?.addEventListener('click',showPreview);
  $('#btnInventory')?.addEventListener('click',showInventory);
  $('#btnOpenRules')?.addEventListener('click',showRules);
  $('#modalClose')?.addEventListener('click',closeModal);
  document.addEventListener('keydown',e=>{ if(e.key==='Escape')closeModal(); });

  $('#multiplierBtn')?.addEventListener('click',()=>{
    const now=Date.now();
    if(boostState.activeUntil>now||boostState.cooldownUntil>now)return;
    boostState={activeUntil:now+BOOST_DUR*1000,cooldownUntil:getTonightMidnight()};
    lsSet(LS.boostState,boostState); updateBoostUI(); toast('Boost x2 activado — 1 hora','⚡');
  });

  // ══ FIREBASE AUTH + LISTENER EN TIEMPO REAL ══
  onAuthChange(async user=>{
    if(!user){
      // Si cierra sesión, cancelar el listener
      if(_gachaUnsub){ _gachaUnsub(); _gachaUnsub=null; }
      return;
    }
    currentUID=user.uid;

    // 1. Carga inicial (getDoc — rápido, una sola vez)
    await loadFromFirebase(user.uid);
    renderTicketsDisplay(); renderHUDTickets(); updateCurrentWheelInfo(); renderStats(); updatePityUI(); updateInventoryBadge();

    // 2. Listener en tiempo real (onSnapshot)
    // Sincroniza automáticamente cuando el otro dispositivo gira o compra tickets
    startRealtimeListener(user.uid);

    console.log('✅ Gacha Firebase OK + Listener activo:',user.uid);
  });

  // Limpiar listener al cerrar la página
  window.addEventListener('beforeunload',()=>{
    if(_gachaUnsub){ _gachaUnsub(); _gachaUnsub=null; }
  });
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
else boot();

window.MoonveilGacha={ROULETTES,addTickets,getTickets,getPityEpic,getPityLeg,getGachaInv,getStats,isWheelActive};