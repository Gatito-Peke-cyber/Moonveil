'use strict';
/**
 * tienda.js — Moonveil Portal Shop v3.0
 * · Todas las secciones: pases, cofres, materiales, historia,
 *   monedas, eventos, pack coins, tickets, llaves cal, superestrellas
 * · Stock real con restock por medianoche
 * · Flash sale con countdown + descuento aleatorio fines de semana
 * · Sand Brill: ofertas relámpago al azar (10-60% off)
 * · Cupones: regular + temporada + Black Friday
 * · Countdown caducidad / próximamente por artículo
 * · Historial en drawer deslizable
 * · Firebase sync
 */

import { db }           from './firebase.js';
import { onAuthChange }  from './auth.js';
import {
  doc, getDoc, updateDoc, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";
import { saveInventory } from './database.js';

/* ══ HELPERS ══ */
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const wait = ms => new Promise(r => setTimeout(r, ms));
const today = () => new Date().toISOString().slice(0,10);

const LS = {
  inv:  'mv_inventory',
  hist: 'mv_shop_purchases',
  ot:   'mv_shop_onetime',
  stock:(id)=>`mv_stock_${id}`,
  rst:  (id)=>`mv_restock_${id}`,
  coup: 'mv_current_coupon',
  coupSc:'mv_sc_active',
};
function lsGet(k,fb=null){try{const v=localStorage.getItem(k);return v!=null?JSON.parse(v):fb;}catch{return fb;}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{}}

/* ══ FIREBASE ══ */
let currentUID=null, syncTO=null;
function scheduleSync(){if(!currentUID)return;clearTimeout(syncTO);syncTO=setTimeout(doSync,2500);}
async function doSync(){
  if(!currentUID)return;
  try{
    const inv=lsGet(LS.inv,{tickets:0,keys:0,superstar_keys:0});
    const hist=lsGet(LS.hist,[]);
    const gachaTickets={};
    ['classic','dark_moon','spring','storm','cyber','abyss'].forEach(id=>{
      gachaTickets[id]=parseInt(localStorage.getItem(`mv_tickets_${id}`)||'0',10);
    });
    await updateDoc(doc(db,'users',currentUID),{
      inventory:inv,shop_purchases:hist,gacha_tickets:gachaTickets,
      updatedAt:serverTimestamp(),
    });
  }catch(e){console.warn('[Shop] sync:',e);}
}
async function loadFromFirebase(uid){
  try{
    const snap=await getDoc(doc(db,'users',uid));if(!snap.exists())return;
    const d=snap.data();
    if(d.inventory){
      const cur=lsGet(LS.inv,{tickets:0,keys:0,superstar_keys:0});
      lsSet(LS.inv,{
        tickets:Math.max(cur.tickets||0,d.inventory.tickets||0),
        keys:Math.max(cur.keys||0,d.inventory.keys||0),
        superstar_keys:Math.max(cur.superstar_keys||0,d.inventory.superstar_keys||0),
      });
    }
    if(d.gacha_tickets){
      Object.entries(d.gacha_tickets).forEach(([rid,count])=>{
        const k=`mv_tickets_${rid}`;
        const local=parseInt(localStorage.getItem(k)||'-1',10);
        localStorage.setItem(k,String(Math.max(local<0?0:local,count||0)));
      });
    }
    if(d.shop_purchases&&Array.isArray(d.shop_purchases)){
      const loc=lsGet(LS.hist,[]);
      if(d.shop_purchases.length>loc.length)lsSet(LS.hist,d.shop_purchases);
    }
  }catch(e){console.warn('[Shop] load:',e);}
}

/* ══ INVENTARIO ══ */
function getInv(){return lsGet(LS.inv,{tickets:0,keys:0,superstar_keys:0});}
function setInv(inv){
  lsSet(LS.inv,inv);renderHUD();
  if(currentUID)saveInventory(currentUID,inv).catch(()=>{});
  scheduleSync();
}
function getGachaT(id){return Math.max(0,parseInt(localStorage.getItem(`mv_tickets_${id}`)||'0',10));}
function addGachaT(id,count){
  const cur=getGachaT(id);
  localStorage.setItem(`mv_tickets_${id}`,String(cur+count));
  renderHUD();scheduleSync();
}
function renderHUD(){
  const inv=getInv();
  const total=['classic','dark_moon','spring','storm','cyber','abyss'].reduce((s,id)=>s+getGachaT(id),inv.tickets||0);
  const setV=(id,v)=>{const el=$(id);if(el)el.textContent=v;};
  setV('#hudTicketsVal',total);setV('#hudKeysVal',inv.keys||0);setV('#hudSuperVal',inv.superstar_keys||0);
  setV('#heroTickets',total);setV('#heroKeys',inv.keys||0);setV('#heroSuper',inv.superstar_keys||0);
}

/* ══ STOCK ══ */
const RESTOCK_DAYS={'24h':1,'7d':7,'30d':30};
function nextMidnight(days=1){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()+days);return d.getTime();}
function getStock(p){
  const v=localStorage.getItem(LS.stock(p.id));
  if(v==null){localStorage.setItem(LS.stock(p.id),String(p.stock));return p.stock;}
  return Math.max(0,parseInt(v,10)||0);
}
function setStock(p,v){localStorage.setItem(LS.stock(p.id),String(Math.max(0,v|0)));}
function getNextRestock(p){const v=localStorage.getItem(LS.rst(p.id));return v?Number(v):null;}
function setNextRestock(p,ts){localStorage.setItem(LS.rst(p.id),ts?String(ts):'null');}
function syncStocks(){
  products.forEach(p=>{
    const rs=localStorage.getItem(LS.rst(p.id));
    if(rs&&rs!=='null'&&Number(rs)<=Date.now()){
      setStock(p,p.stock);
      const d=RESTOCK_DAYS[p.restock];
      setNextRestock(p,d?nextMidnight(d):null);
    }
  });
}

/* ══ FECHAS ══ */
function parseDate(str){if(!str)return null;const d=new Date(str.includes('T')?str:str+'T23:59:59');return isNaN(d)?null:d.getTime();}
function parseDateStart(str){if(!str)return null;const d=new Date(str.includes('T')?str:str+'T00:00:00');return isNaN(d)?null:d.getTime();}
function timeAgo(iso){
  const s=Math.floor((Date.now()-new Date(iso))/1000);
  if(s<60)return'hace un momento';if(s<3600)return`hace ${Math.floor(s/60)}m`;
  if(s<86400)return`hace ${Math.floor(s/3600)}h`;return`hace ${Math.floor(s/86400)}d`;
}

/* ══ COUNTDOWN ══ */
const _cdIvs=new Map();
function startCD(prefix,targetMs){
  if(_cdIvs.has(prefix)){clearInterval(_cdIvs.get(prefix));_cdIvs.delete(prefix);}
  function tick(){
    const diff=Math.max(0,targetMs-Date.now());
    const d=Math.floor(diff/86400000),rem1=diff-d*86400000;
    const h=Math.floor(rem1/3600000),rem2=rem1-h*3600000;
    const m=Math.floor(rem2/60000),s=Math.floor((rem2-m*60000)/1000);
    const pad=n=>String(n).padStart(2,'0');
    const set=(id,v)=>{const el=document.getElementById(`${prefix}-${id}`);if(el)el.textContent=pad(v);};
    set('d',d);set('h',h);set('m',m);set('s',s);
    if(!diff){clearInterval(_cdIvs.get(prefix));_cdIvs.delete(prefix);}
  }
  tick();const iv=setInterval(tick,1000);_cdIvs.set(prefix,iv);
}
function clearAllCDs(){_cdIvs.forEach(iv=>clearInterval(iv));_cdIvs.clear();}

/* ══ CUPONES ══ */
const REGULAR_COUPONS=[10,15,20,25,30,40,50,60,70,80,90,100];
const COUP_STATE_KEY='mv_coupon_state';
function getCoupState(){
  let s=lsGet(COUP_STATE_KEY,{});
  REGULAR_COUPONS.forEach(c=>{if(s[c]==null)s[c]=0;});
  return s;
}
function saveCoupState(s){lsSet(COUP_STATE_KEY,s);}
function getCoupCD(pct){const s=getCoupState();return Number(s[pct]||0);}
function setCoupCD(pct,ts){const s=getCoupState();s[pct]=ts;saveCoupState(s);}

const SEASONAL_COUPONS=[
  {id:'sv_2026',name:'💗 San Valentín',emoji:'💗',style:'sc-valentine',discount:30,startDate:'2026-02-10',endDate:'2026-02-15',maxUses:5,resetDate:'2026-02-13'},
  {id:'newyear_2026',name:'🎆 Año Nuevo',emoji:'🎆',style:'sc-newyear',discount:25,startDate:'2025-12-31',endDate:'2026-01-06',maxUses:3,resetDate:'2026-01-01'},
  {id:'halloween_2026',name:'🎃 Halloween',emoji:'🎃',style:'sc-halloween',discount:40,startDate:'2026-10-25',endDate:'2026-11-01',maxUses:3,resetDate:'2026-10-31'},
  {id:'navidad_2026',name:'🎄 Navidad',emoji:'🎄',style:'sc-christmas',discount:35,startDate:'2026-12-01',endDate:'2026-12-30',maxUses:5,resetDate:'2026-12-25'},
];
const BLACK_FRIDAY={
  id:'blackfriday',name:'BLACK FRIDAY',emoji:'🖤',style:'bf-coupon',
  discount:'random',unlimited:true,
  periods:[
    {startDate:'2026-11-27',endDate:'2026-11-30'},
    {startDate:'2026-03-01',endDate:'2026-03-02'},
  ],
};
function isScActive(sc){
  const t=today();
  if(sc.periods)return sc.periods.some(p=>t>=p.startDate&&t<=p.endDate);
  return t>=sc.startDate&&t<=sc.endDate;
}
function getScUsesLeft(sc){
  const raw=lsGet(`mv_sc_${sc.id}`,null);
  if(!raw)return sc.maxUses;
  const t=today();
  let state=raw;
  if(sc.resetDate&&t>=sc.resetDate&&(state.lastReset||'')<sc.resetDate){
    state={usesLeft:sc.maxUses,lastReset:t};
    lsSet(`mv_sc_${sc.id}`,state);
  }
  return state.usesLeft??sc.maxUses;
}
function decScUses(sc){
  const state=lsGet(`mv_sc_${sc.id}`,{usesLeft:sc.maxUses,lastReset:today()});
  state.usesLeft=Math.max(0,(state.usesLeft??sc.maxUses)-1);
  lsSet(`mv_sc_${sc.id}`,state);
}

let currentCoupon=Number(lsGet(LS.coup,0));
let currentScId=lsGet(LS.coupSc,null);
let bfDiscount=null;
function saveCurrentCoupon(){lsSet(LS.coup,currentCoupon);}
function saveCurrentScId(id){lsSet(LS.coupSc,id);currentScId=id;}

function getPriceWithCoupon(base){
  if(!currentCoupon)return{final:base,old:null};
  const final=Math.max(0,Math.round(base-base*currentCoupon/100));
  return{final,old:base};
}

/* ══ FLASH SALE ══ */
let flashDiscount=0;
function isWeekend(){const d=new Date().getDay();return d===0||d===6;}
function initFlashSale(){
  // Fines de semana: descuento aleatorio 15-40%
  if(isWeekend()){
    const stored=lsGet('mv_flash_sale',null);
    const thisWeekend=today().slice(0,7);// year-month
    if(stored&&stored.week===thisWeekend){
      flashDiscount=stored.discount;
    } else {
      flashDiscount=Math.floor(Math.random()*26)+15;// 15-40
      lsSet('mv_flash_sale',{week:thisWeekend,discount:flashDiscount});
    }
    const textEl=$('#flashText');
    if(textEl)textEl.textContent=`¡FLASH SALE DE FIN DE SEMANA! ${flashDiscount}% en TODO`;
  } else {
    flashDiscount=0;
    const textEl=$('#flashText');
    if(textEl)textEl.textContent='Vuelve el finde para el Flash Sale ⚡';
  }
  // Countdown hasta medianoche
  setInterval(()=>{
    const now=new Date(),mn=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1,0,0,0);
    const diff=Math.max(0,Math.floor((mn-now)/1000));
    const h=String(Math.floor(diff/3600)).padStart(2,'0');
    const m=String(Math.floor((diff%3600)/60)).padStart(2,'0');
    const s=String(diff%60).padStart(2,'0');
    const el=$('#flashTimer');if(el)el.textContent=`${h}:${m}:${s}`;
  },1000);
}

/* ══ PRODUCTOS ══ */
const products=[
  /* PASES DE TEMPORADA */
  {id:'s1',sec:'pases',emoji:'🏆',name:'Pase Reino del Hielo Eterno — T.I',img:'img-pass/banwar.jpg',quality:'legendary',price:128,stock:1,restock:null,startsAt:'2026-01-01',expiresAt:'2026-01-31',desc:'Desbloquea recompensas de la temporada de Enero.',tags:['pase','cosmético'],gold:true},
  {id:'s2',sec:'pases',emoji:'🏆',name:'Pase Corazones de Redstone — T.II', img:'img-pass/banhall.jpg',quality:'legendary',price:128,stock:1,restock:null,startsAt:'2026-02-01',expiresAt:'2026-02-28',desc:'Desbloquea recompensas de Febrero.',tags:['pase'],gold:true},
  {id:'s3',sec:'pases',emoji:'🏆',name:'Pase Despertar de la Naturaleza — T.III',img:'img-pass/partymine.jpg',quality:'legendary',price:128,stock:1,restock:null,startsAt:'2026-03-01',expiresAt:'2026-03-31',desc:'Temporada de Marzo.',tags:['pase'],gold:true},
  {id:'s4',sec:'pases',emoji:'🏆',name:'Pase Cántico de la Lluvia Plateada — T.IV',img:'img-pass/chrismine.jpg',quality:'legendary',price:128,stock:1,restock:null,startsAt:'2026-04-01',expiresAt:'2026-04-30',desc:'Temporada de Abril.',tags:['pase'],gold:true},
  {id:'s5',sec:'pases',emoji:'🏆',name:'Pase Esencia de la Aurora — T.V',img:'img-pass/añomine.jpg',quality:'legendary',price:128,stock:1,restock:null,startsAt:'2026-05-01',expiresAt:'2026-05-31',desc:'Temporada de Mayo.',tags:['pase'],gold:true},
  {id:'s6',sec:'pases',emoji:'🏆',name:'Pase Imperio del Océano Profundo — T.VI',img:'img-pass/banair.jpg',quality:'legendary',price:128,stock:1,restock:null,startsAt:'2026-06-01',expiresAt:'2026-06-30',desc:'Temporada de Junio.',tags:['pase'],gold:true},
  {id:'s7',sec:'pases',emoji:'🏆',name:'Pase Reinos Dorados — T.VII',img:'img-pass/dancingmine.jpg',quality:'legendary',price:128,stock:1,restock:null,startsAt:'2026-07-01',expiresAt:'2026-07-31',desc:'Temporada de Julio.',tags:['pase'],gold:true},
  {id:'s8',sec:'pases',emoji:'🏆',name:'Pase Sombras de la Noche — T.VIII',img:'img-pass/squemine.jpg',quality:'legendary',price:128,stock:1,restock:null,startsAt:'2026-08-01',expiresAt:'2026-08-31',desc:'Temporada de Agosto.',tags:['pase'],gold:true},
  {id:'s9',sec:'pases',emoji:'🏆',name:'Pase Mundo Encantado — T.IX',img:'img-pass/squemine.jpg',quality:'legendary',price:128,stock:1,restock:null,startsAt:'2026-09-01',expiresAt:'2026-09-30',desc:'Temporada de Septiembre.',tags:['pase'],gold:true},
  {id:'s10',sec:'pases',emoji:'🏆',name:'Pase Pesadilla del Nether — T.X',img:'img-pass/squemine.jpg',quality:'legendary',price:128,stock:1,restock:null,startsAt:'2026-10-01',expiresAt:'2026-10-31',desc:'Temporada de Octubre.',tags:['pase'],gold:true},
  {id:'s11',sec:'pases',emoji:'🏆',name:'Pase Guardianes del Invierno — T.XI',img:'img-pass/squemine.jpg',quality:'legendary',price:128,stock:1,restock:null,startsAt:'2026-11-01',expiresAt:'2026-11-30',desc:'Temporada de Noviembre.',tags:['pase'],gold:true},
  {id:'s12',sec:'pases',emoji:'🏆',name:'Pase Estrella de Ender — T.XII',img:'img-pass/squemine.jpg',quality:'legendary',price:128,stock:1,restock:null,startsAt:'2026-12-01',expiresAt:'2026-12-31',desc:'Temporada de Diciembre.',tags:['pase'],gold:true},

  /* COFRES */
  {id:'k1',sec:'llaves',emoji:'🗝️',name:'Cofre de Ámbar',img:'img/chest2.gif',quality:'epic',price:30,stock:10,restock:'7d',desc:'Abre este cofre de Ámbar.',tags:['cofre','épico']},
  {id:'k2',sec:'llaves',emoji:'🗝️',name:'Cofre de Sueños',img:'img/chest2.gif',quality:'epic',price:30,stock:10,restock:'7d',desc:'Abre este cofre de los Sueños.',tags:['cofre','épico']},
  {id:'k3',sec:'llaves',emoji:'🗝️',name:'Cofre de Moonveil',img:'img/chest2.gif',quality:'legendary',price:10,stock:10,restock:'7d',desc:'Abre este cofre Moonveil.',tags:['cofre','legendario'],gold:true},
  {id:'k4',sec:'llaves',emoji:'🗝️',name:'Cofre de Moonveil II',img:'img/chest2.gif',quality:'legendary',price:30,stock:5,restock:'7d',desc:'Abre este cofre Moon por ████.',tags:['cofre','█████'],gold:true},

  /* MATERIALES */
  {id:'f1',sec:'cosas',emoji:'⚙️',name:'Rieles (x64)',img:'imagen/phantom.gif',quality:'epic',price:64,stock:10,restock:'24h',desc:'Unos rieles que siempre vienen bien.',tags:['rieles']},
  {id:'f2',sec:'cosas',emoji:'⚙️',name:'Rieles Activadores (x64)',img:'imagen/phantom.gif',quality:'epic',price:128,stock:10,restock:'24h',desc:'Activemos estos rieles.',tags:['rieles','velocidad']},
  {id:'f3',sec:'cosas',emoji:'⚙️',name:'Rieles x64 (Pack x2)',img:'imagen/phantom.gif',quality:'epic',price:64,stock:2,restock:'7d',desc:'Pack doble de rieles ¡con descuento!',tags:['rieles'],gold:true},
  {id:'f4',sec:'cosas',emoji:'🧱',name:'Concreto (x64)',img:'imagen/phantom.gif',quality:'epic',price:64,stock:20,restock:'24h',desc:'Para construir.',tags:['concreto','construcción']},
  {id:'f5',sec:'cosas',emoji:'🔩',name:'Bloques de Hierro (x64)',img:'imagen/phantom.gif',quality:'epic',price:128,stock:10,restock:'7d',desc:'Bloques de hierro.',tags:['bloques']},
  {id:'f6',sec:'cosas',emoji:'🔩',name:'Bloques de Hierro x64 (Pack x4)',img:'imagen/phantom.gif',quality:'legendary',price:128,stock:1,desc:'Oferta y demanda, ¿seguro?',tags:['bloques','oferta'],gold:true},
  {id:'f7',sec:'cosas',emoji:'💎',name:'Bloques de Diamante x64 (Pack x4)',img:'imagen/phantom.gif',quality:'legendary',price:128,stock:1,desc:'Bueno brillemos.',tags:['bloques','oferta'],gold:true},
  {id:'f8',sec:'cosas',emoji:'💚',name:'Esmeralda x1',img:'imagen/phantom.gif',quality:'legendary',price:1,stock:1,desc:'Sand Brill te desea Feliz Navidad con 1 sola esmeralda.',tags:['Sand Brill'],gold:true},

  /* HISTORIA */
  {id:'l1',sec:'historia',emoji:'📚',name:'Libro: "Bosque de Jade"',img:'img/bookmine.jpg',quality:'rare',price:256,stock:1,desc:'Leyendas de…',tags:['lore','bioma']},
  {id:'l2',sec:'historia',emoji:'📚',name:'Libro: "La Negra Noche"',img:'img/bookmine.jpg',quality:'epic',price:256,stock:1,desc:'Símbolos…',tags:['runas','forja']},
  {id:'l3',sec:'historia',emoji:'📚',name:'Libro: "El lado ███ de S██ B███"',img:'img/bookcat.gif',quality:'legendary',price:384,stock:1,desc:'█████████.',tags:['reliquia','desierto'],gold:true},
  {id:'l4',sec:'historia',emoji:'📖',name:'Libro A1',img:'img/book.jpg',quality:'epic',price:128,stock:1,desc:'Un libro.',tags:['libro']},
  {id:'l5',sec:'historia',emoji:'📖',name:'Libro B2',img:'img/book.jpg',quality:'epic',price:128,stock:1,desc:'Un libro.',tags:['libro']},
  {id:'l6',sec:'historia',emoji:'📖',name:'Libro A2',img:'img/book.jpg',quality:'epic',price:128,stock:1,desc:'Un libro.',tags:['libro']},
  {id:'l7',sec:'historia',emoji:'📖',name:'Libro C3',img:'img/book.jpg',quality:'epic',price:128,stock:1,desc:'Un libro.',tags:['libro']},

  /* LOTE MONEDAS */
  {id:'m1',sec:'materiales',emoji:'🪙',name:'Pegatina de 1c.',img:'img/coin.jpg',quality:'common',price:0,stock:1,restock:'24h',desc:'Gratis.',tags:['coin','monedas']},
  {id:'m2',sec:'materiales',emoji:'🪙',name:'Bolsita de 30c.',img:'img/coin.jpg',quality:'rare',price:15,stock:10,restock:'7d',desc:'Para trueques y consumibles básicos.',tags:['coin','monedas']},
  {id:'m3',sec:'materiales',emoji:'🪙',name:'Pack de 90c.',img:'img/packcoin.jpg',quality:'epic',price:30,stock:10,restock:'7d',desc:'Relación costo/beneficio equilibrada.',tags:['pack-coin','monedas']},
  {id:'m4',sec:'materiales',emoji:'🪙',name:'Lote de 120c.',img:'img/stackcoin.jpg',quality:'legendary',price:60,stock:10,restock:'30d',desc:'Ideal para temporadas.',tags:['stack-coin','monedas'],gold:true},

  /* EVENTOS */
  {id:'e1',sec:'eventos',emoji:'🎪',name:'Pase en la Oscuridad',img:'img-pass/banhall.jpg',quality:'legendary',price:256,stock:1,restock:'30d',startsAt:'2026-10-20',expiresAt:'2026-11-01',desc:'Algo tal vez... Se acerca…',tags:['evento'],gold:true},
  {id:'e2',sec:'eventos',emoji:'🐱',name:'Pase Gatos 😺✨',img:'img-pass/catsparty.jpg',quality:'legendary',price:256,stock:1,restock:'30d',startsAt:'2026-08-01',expiresAt:'2026-08-30',desc:'Gatos y más gatos… ¿Gatos?',tags:['evento','nocturno']},

  /* PACK MONEDAS */
  {id:'c1',sec:'monedas',emoji:'💰',name:'Pack de 128r.',img:'img/coin.jpg',quality:'common',price:64,stock:999,desc:'2 stacks. Para trueques y consumibles.',tags:['monedas','pack']},
  {id:'c2',sec:'monedas',emoji:'💰',name:'Pack de 256r.',img:'img/packcoin.jpg',quality:'rare',price:128,stock:999,desc:'4 stacks. Relación equilibrada.',tags:['monedas','pack']},
  {id:'c3',sec:'monedas',emoji:'💰',name:'Pack de 384r.',img:'img/stackcoin.jpg',quality:'epic',price:256,stock:999,desc:'6 stacks. Ideal para temporadas completas.',tags:['monedas','pack'],gold:true},

  /* TICKETS */
  {id:'t_classic_1',sec:'tickets',emoji:'🎫',name:'Ticket Clásico',img:'imagen/ticket5.jpg',quality:'epic',price:10,stock:10,restock:'24h',amount:1,wheelId:'classic',desc:'Ticket para la Ruleta Clásica.',tags:['ticket','clásico']},
  {id:'t_elemental_1',sec:'tickets',emoji:'🎫',name:'Ticket 1 de Cobre',img:'imagen/ticket5.jpg',quality:'epic',price:10,stock:10,restock:'24h',amount:1,wheelId:'elemental',desc:'Ticket para la Ruleta Elemental.',tags:['ticket','elemental']},
  {id:'t_event_1',sec:'tickets',emoji:'🎫',name:'Ticket Evento',img:'imagen/ticket5.jpg',quality:'epic',price:10,stock:10,restock:'24h',amount:1,wheelId:'event',desc:'Ticket para la Ruleta de Eventos.',tags:['ticket','evento']},
  {id:'t_classic_2',sec:'tickets',emoji:'🎫',name:'Ticket Clásico x5',img:'imagen/ticket5.jpg',quality:'epic',price:30,stock:10,restock:'24h',amount:5,wheelId:'classic',desc:'5 Tickets para la Ruleta Clásica.',tags:['ticket','clásico']},
  {id:'t_elemental_2',sec:'tickets',emoji:'🎫',name:'Ticket 1 de Cobre x5',img:'imagen/ticket5.jpg',quality:'epic',price:30,stock:10,restock:'24h',amount:5,wheelId:'elemental',desc:'5 Tickets Elementales.',tags:['ticket','elemental']},
  {id:'t_event_2',sec:'tickets',emoji:'🎫',name:'Ticket Evento x5',img:'imagen/ticket5.jpg',quality:'epic',price:30,stock:10,restock:'24h',amount:5,wheelId:'event',desc:'5 Tickets de Eventos.',tags:['ticket','evento']},
  {id:'t_classic_3',sec:'tickets',emoji:'🎉',name:'¡Bienvenida a los tickets!',img:'imagen/ticket5.jpg',quality:'epic',price:0,stock:1,amount:10,wheelId:'classic',desc:'10 Tickets gratis para empezar.',tags:['ticket','clásico','gratis'],gold:true},
  {id:'t_classic_4',sec:'tickets',emoji:'🎰',name:'Tiros Gratis!!',img:'imagen/ticket5.jpg',quality:'epic',price:0,stock:1,restock:'30d',amount:10,wheelId:'classic',desc:'10 Tickets gratis mensuales.',tags:['ticket','clásico','gratis'],gold:true},

  /* LLAVES CALENDARIO */
  {id:'ck_normal',sec:'calkeys',emoji:'🔵',name:'Llave Normal',img:'img/keys1.jpg',quality:'rare',price:30,stock:10,restock:'7d',desc:'Recupera un día perdido en el Calendario.',tags:['llave','calendario'],calKey:{type:'normal',amount:1}},
  {id:'ck_pink',sec:'calkeys',emoji:'💗',name:'Llave Rosa',img:'img/keys1.jpg',quality:'epic',price:50,stock:5,restock:'30d',desc:'Para San Valentín, Día de la Madre y Padre. Da ×2 XP.',tags:['llave','festival'],calKey:{type:'pink',amount:1}},
  {id:'ck_green',sec:'calkeys',emoji:'🟢',name:'Llave Verde',img:'img/keys1.jpg',quality:'epic',price:50,stock:5,restock:'30d',desc:'Navidad y Año Nuevo. Da ×2 XP.',tags:['llave','navidad'],calKey:{type:'green',amount:1}},
  {id:'ck_orange',sec:'calkeys',emoji:'🎃',name:'Llave Naranja',img:'img/keys1.jpg',quality:'epic',price:50,stock:5,restock:'30d',desc:'Halloween y Black Friday. Da ×2.',tags:['llave','halloween'],calKey:{type:'orange',amount:1}},
  {id:'ck_cat',sec:'calkeys',emoji:'😺',name:'Llave Gato',img:'img/keys1.jpg',quality:'epic',price:60,stock:3,restock:'30d',desc:'Día del Gato y del Perro. Da ×3. ¡Meow!',tags:['llave','gato'],calKey:{type:'cat',amount:1}},
  {id:'ck_special',sec:'calkeys',emoji:'💜',name:'Llave Especial',img:'img/keys1.jpg',quality:'epic',price:60,stock:3,restock:'30d',desc:'Días únicos especiales. Da ×2.',tags:['llave','especial'],calKey:{type:'special',amount:1}},
  {id:'ck_future',sec:'calkeys',emoji:'⏩',name:'Llave Futuro',img:'img/keys1.jpg',quality:'legendary',price:100,stock:2,restock:'30d',desc:'¡Rarísima! Reclama días hasta 2 días en el futuro.',tags:['llave','futuro','rara'],calKey:{type:'future',amount:1},gold:true},
  {id:'ck_pack_all',sec:'calkeys',emoji:'🎁',name:'Pack Definitivo — 1 de Cada',img:'img/keys1.jpg',quality:'legendary',price:280,stock:1,restock:'30d',desc:'Pack supremo: 1 llave de cada tipo.',tags:['pack','todas'],calKey:{pack:true,keys:{normal:1,pink:1,green:1,orange:1,cat:1,special:1,future:1}},gold:true},
  {id:'ck_pack_3normal',sec:'calkeys',emoji:'🔵',name:'Pack: 3 Llaves Normales',img:'img/keys1.jpg',quality:'rare',price:75,stock:5,restock:'7d',desc:'3 Llaves Normales.',tags:['pack','normal'],calKey:{pack:true,keys:{normal:3}}},
  {id:'ck_pack_fest',sec:'calkeys',emoji:'🌟',name:'Pack Festival — Rosa+Verde+Naranja',img:'img/keys1.jpg',quality:'epic',price:120,stock:3,restock:'30d',desc:'Pack festividades: Rosa, Verde, Naranja.',tags:['pack','festival'],calKey:{pack:true,keys:{pink:1,green:1,orange:1}}},

  /* LLAVES SUPERESTRELLA */
  {id:'sk_common',sec:'superestrellas',emoji:'⭐',name:'Llave Superestrella',img:'img/keys1.jpg',quality:'common',price:20,stock:20,restock:'24h',desc:'Para el Cofre Común.',tags:['llave','superestrella','cofre'],superKey:{keyId:'key_common',amount:1}},
  {id:'sk_rare',sec:'superestrellas',emoji:'💫',name:'Llave Superestrella Brillante',img:'img/keys1.jpg',quality:'rare',price:40,stock:15,restock:'24h',desc:'Para el Cofre Raro.',tags:['llave','superestrella'],superKey:{keyId:'key_rare',amount:1}},
  {id:'sk_special',sec:'superestrellas',emoji:'✨',name:'Llave Superestrella Especial',img:'img/keys1.jpg',quality:'epic',price:80,stock:10,restock:'7d',desc:'Para el Cofre Especial.',tags:['llave','superestrella'],superKey:{keyId:'key_special',amount:1}},
  {id:'sk_epic',sec:'superestrellas',emoji:'🔮',name:'Llave Superestrella Épica',img:'img/keys1.jpg',quality:'epic',price:160,stock:5,restock:'7d',desc:'Para el Cofre Épico.',tags:['llave','superestrella'],superKey:{keyId:'key_epic',amount:1}},
  {id:'sk_legendary',sec:'superestrellas',emoji:'👑',name:'Llave Superestrella Legendaria',img:'img/keys1.jpg',quality:'legendary',price:320,stock:3,restock:'7d',desc:'Para el Cofre Legendario.',tags:['llave','superestrella'],gold:true,superKey:{keyId:'key_legendary',amount:1}},
  {id:'sk_newyear',sec:'superestrellas',emoji:'🎆',name:'Llave Sup. Año Nuevo',img:'img/keys1.jpg',quality:'legendary',price:64,stock:3,restock:'24h',startsAt:'2026-12-31',expiresAt:'2027-01-06',desc:'Abre el Cofre de Año Nuevo.',tags:['llave','evento'],gold:true,superKey:{keyId:'key_newyear',amount:1}},
  {id:'sk_halloween',sec:'superestrellas',emoji:'🎃',name:'Llave Sup. Calabaza',img:'img/keys1.jpg',quality:'legendary',price:70,stock:3,restock:'24h',startsAt:'2026-10-25',expiresAt:'2026-11-01',desc:'Abre el Cofre de Halloween.',tags:['llave','evento','halloween'],gold:true,superKey:{keyId:'key_halloween',amount:1}},
  {id:'sk_christmas',sec:'superestrellas',emoji:'🎄',name:'Llave Sup. Navideña',img:'img/keys1.jpg',quality:'legendary',price:70,stock:3,restock:'24h',startsAt:'2026-12-01',expiresAt:'2026-12-30',desc:'Abre el Cofre de Navidad.',tags:['llave','evento','navidad'],gold:true,superKey:{keyId:'key_christmas',amount:1}},
  {id:'sk_cat',sec:'superestrellas',emoji:'😺',name:'Llave Sup. Gatuna',img:'img/keys1.jpg',quality:'epic',price:60,stock:3,restock:'24h',startsAt:'2026-08-17',expiresAt:'2026-08-22',desc:'Abre el Cofre Gatuno.',tags:['llave','evento','gato'],superKey:{keyId:'key_cat',amount:1}},
  {id:'sk_pack_starter',sec:'superestrellas',emoji:'📦',name:'Pack Inicio — Común ×3 + Brillante ×1',img:'img/keys1.jpg',quality:'rare',price:55,stock:10,restock:'7d',desc:'Pack perfecto para empezar.',tags:['pack','llave'],superKey:{pack:true,keys:{key_common:3,key_rare:1}}},
  {id:'sk_pack_top',sec:'superestrellas',emoji:'👑',name:'Pack Élite — Épica ×2 + Legendaria ×1',img:'img/keys1.jpg',quality:'legendary',price:256,stock:3,restock:'30d',desc:'El pack de los elegidos.',tags:['pack','llave'],gold:true,superKey:{pack:true,keys:{key_epic:2,key_legendary:1}}},
];

/* ══ GRID MAPPING ══ */
const GRID_MAP={
  pases:'gridPases',llaves:'gridCofres',cosas:'gridMats',historia:'gridHistoria',
  materiales:'gridLoteMonedas',eventos:'gridEventos',monedas:'gridPackMonedas',
  tickets:'gridTickets',calkeys:'gridCalKeys',superestrellas:'gridSuper',
};
const SEC_MAP={pases:'secPases',llaves:'secLlaves',cosas:'secCosas',historia:'secHistoria',materiales:'secMateriales',eventos:'secEventos',monedas:'secMonedas',tickets:'secTickets',calkeys:'secCalKeys',superestrellas:'secSuper'};

/* ══ CAL KEY INFO ══ */
const CAL_KEY_INFO={
  normal:{emoji:'🔵',name:'Llave Normal'},pink:{emoji:'💗',name:'Llave Rosa'},
  green:{emoji:'🟢',name:'Llave Verde'},orange:{emoji:'🎃',name:'Llave Naranja'},
  cat:{emoji:'😺',name:'Llave Gato'},special:{emoji:'💜',name:'Llave Especial'},
  future:{emoji:'⏩',name:'Llave Futuro'},
};
const SUPER_KEY_INFO={
  key_common:{emoji:'⭐',name:'Común',color:'#94A3B8'},key_rare:{emoji:'💫',name:'Brillante',color:'#38BDF8'},
  key_special:{emoji:'✨',name:'Especial',color:'#22C55E'},key_epic:{emoji:'🔮',name:'Épica',color:'#A855F7'},
  key_legendary:{emoji:'👑',name:'Legendaria',color:'#FBBF24'},
  key_newyear:{emoji:'🎆',name:'Año Nuevo',color:'#FFD700'},key_halloween:{emoji:'🎃',name:'Calabaza',color:'#F97316'},
  key_christmas:{emoji:'🎄',name:'Navideña',color:'#4ADE80'},key_cat:{emoji:'😺',name:'Gatuna',color:'#FB923C'},
};
const CAL_KEYS_LS='mv_cal_keys';
function awardCalKeys(calKey){
  try{
    let keys=lsGet(CAL_KEYS_LS,{normal:0,pink:0,green:0,orange:0,cat:0,special:0,future:0});
    if(calKey.pack&&calKey.keys){Object.entries(calKey.keys).forEach(([t,a])=>{keys[t]=(keys[t]||0)+a;});}
    else if(calKey.type){keys[calKey.type]=(keys[calKey.type]||0)+calKey.amount;}
    lsSet(CAL_KEYS_LS,keys);return true;
  }catch{return false;}
}
const CHEST_KEYS_LS='mv_chest_keys_v1';
function awardSuperKeys(superKey){
  try{
    let keys=lsGet(CHEST_KEYS_LS,{});
    if(superKey.pack&&superKey.keys){Object.entries(superKey.keys).forEach(([k,a])=>{keys[k]=(keys[k]||0)+a;});}
    else if(superKey.keyId){keys[superKey.keyId]=(keys[superKey.keyId]||0)+superKey.amount;}
    lsSet(CHEST_KEYS_LS,keys);return true;
  }catch{return false;}
}

/* ══ ESTADO UI ══ */
let currentSection='all', searchText='', currentModal=null;

/* ══ RENDER PRINCIPAL ══ */
function renderAll(){
  clearAllCDs();
  const now=Date.now();
  // Filtrar por sección y búsqueda
  const filtered=products.filter(p=>{
    const secOk=currentSection==='all'||p.sec===currentSection;
    const q=searchText.trim().toLowerCase();
    const txt=`${p.name} ${p.quality} ${p.desc} ${(p.tags||[]).join(' ')}`.toLowerCase();
    return secOk&&(!q||txt.includes(q));
  });

  // Limpiar grids
  Object.values(GRID_MAP).forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML='';});

  // Mostrar/ocultar secciones
  Object.entries(SEC_MAP).forEach(([sec,secId])=>{
    const el=document.getElementById(secId);if(!el)return;
    const hasItems=filtered.some(p=>p.sec===sec);
    el.style.display=(currentSection==='all'||currentSection===sec)&&hasItems?'':'none';
  });

  const pendingCDs=[];
  filtered.forEach((p,i)=>{
    const gridId=GRID_MAP[p.sec];
    const grid=document.getElementById(gridId);if(!grid)return;
    const {html,cds}=buildCard(p,i);
    grid.insertAdjacentHTML('beforeend',html);
    cds.forEach(c=>pendingCDs.push(c));
  });

  // Botones
  $$('.pc-btn:not([disabled])').forEach(btn=>{
    btn.addEventListener('click',()=>openConfirmModal(btn.dataset.id));
  });
  $$('.pc-btn-detail').forEach(btn=>{
    btn.addEventListener('click',()=>openDetailModal(btn.dataset.id));
  });

  // Iniciar CDs
  pendingCDs.forEach(({prefix,targetMs})=>startCD(prefix,targetMs));
}

function buildCard(p,idx){
  const now=Date.now();
  const st=getStock(p);
  const startMs=parseDateStart(p.startsAt);
  const expMs=parseDate(p.expiresAt);
  const isUpcoming=!!(startMs&&startMs>now);
  const isExpired=!!(expMs&&expMs<now);
  const isOut=st<=0;
  const isDisabled=isOut||isUpcoming||isExpired;

  const cds=[];
  const q=p.quality||'common';

  // Estado badge
  let stateBadge='';
  if(isExpired) stateBadge=`<div class="pc-state-badge expired">⌛ CADUCADO</div>`;
  else if(isUpcoming) stateBadge=`<div class="pc-state-badge upcoming">⏳ PRÓXIMO</div>`;
  else if(isOut) stateBadge=`<div class="pc-state-badge out">❌ AGOTADO</div>`;
  else if(st<=3&&p.stock>1) stateBadge=`<div class="pc-state-badge limited">⚠️ ÚLTIMOS</div>`;
  else if(p.sec==='eventos') stateBadge=`<div class="pc-state-badge event">🎪 EVENTO</div>`;

  // Overlay
  let overlay='';
  if(isExpired){
    overlay=`<div class="pc-overlay"><div class="pc-overlay-txt">⌛ CADUCADO</div><div class="pc-overlay-sub">Oferta finalizada</div></div>`;
  } else if(isUpcoming&&startMs){
    const pfx=`cd-up-${p.id}`;
    cds.push({prefix:pfx,targetMs:startMs});
    overlay=`<div class="pc-overlay">
      <div class="pc-overlay-txt">⏳ PRÓXIMAMENTE</div>
      <div class="pc-overlay-cd">
        <div class="pc-cd-block"><span class="pc-cd-val" id="${pfx}-d">--</span><span class="pc-cd-lbl">días</span></div>
        <div class="pc-cd-block"><span class="pc-cd-val" id="${pfx}-h">--</span><span class="pc-cd-lbl">hrs</span></div>
        <div class="pc-cd-block"><span class="pc-cd-val" id="${pfx}-m">--</span><span class="pc-cd-lbl">min</span></div>
        <div class="pc-cd-block"><span class="pc-cd-val" id="${pfx}-s">--</span><span class="pc-cd-lbl">seg</span></div>
      </div>
    </div>`;
  } else if(isOut){
    const next=getNextRestock(p);
    overlay=`<div class="pc-overlay"><div class="pc-overlay-txt">❌ AGOTADO</div>${next?`<div class="pc-overlay-sub">↻ Restock aprox. ${new Date(next).toLocaleDateString('es-PE',{day:'2-digit',month:'short'})}</div>`:''}</div>`;
  }

  // Precio con cupón y flash
  let basePrice=p.price;
  let flashAdded=false;
  if(flashDiscount&&basePrice>0&&!isDisabled){basePrice=Math.round(basePrice*(1-flashDiscount/100));flashAdded=true;}
  const {final:finalPrice,old:oldPrice}=getPriceWithCoupon(basePrice);
  let priceHTML='';
  if(p.price===0){
    priceHTML=`<span class="pc-price free-price">GRATIS</span>`;
  } else {
    const showOld=(oldPrice&&oldPrice!==finalPrice)||(flashAdded&&p.price!==basePrice);
    const originalShow=flashAdded?p.price:null;
    if(originalShow) priceHTML+=`<span class="pc-price-old">⟡${originalShow}</span>`;
    if(oldPrice&&oldPrice!==finalPrice) priceHTML+=`<span class="pc-price-old">⟡${oldPrice}</span>`;
    priceHTML+=`<span class="pc-price">⟡${finalPrice}</span>`;
    if(currentCoupon) priceHTML+=`<span class="pc-discount">-${currentCoupon}%</span>`;
    else if(flashAdded) priceHTML+=`<span class="pc-discount">-${flashDiscount}%</span>`;
  }

  // Stock
  const stockClass=st===0?'no-stock':st<=3?'low-stock':'';
  const stockLabel=st===0?'AGOTADO':st===999?'∞ Ilimitado':`STOCK: ${st}`;
  const restockStr=p.restock?`↻ ${p.restock}`:p.stock>1?'Sin restock':'—';

  // Countdown expiración
  let expiryHTML='';
  if(expMs&&!isExpired&&!isUpcoming){
    const pfx=`cd-exp-${p.id}`;
    cds.push({prefix:pfx,targetMs:expMs});
    expiryHTML=`<div class="pc-expiry">
      <div class="pc-expiry-lbl">⏰ Caduca en:</div>
      <div class="pc-expiry-cd">
        <div class="pc-exp-block"><span class="pc-exp-val" id="${pfx}-d">--</span><span class="pc-exp-lbl">días</span></div>
        <div class="pc-exp-block"><span class="pc-exp-val" id="${pfx}-h">--</span><span class="pc-exp-lbl">hrs</span></div>
        <div class="pc-exp-block"><span class="pc-exp-val" id="${pfx}-m">--</span><span class="pc-exp-lbl">min</span></div>
        <div class="pc-exp-block"><span class="pc-exp-val" id="${pfx}-s">--</span><span class="pc-exp-lbl">seg</span></div>
      </div>
    </div>`;
  }

  // Tags
  const tagsHTML=(p.tags||[]).map(t=>`<span class="pc-tag">#${esc(t)}</span>`).join('');
  // CalKey icons
  let calKeyIcons='';
  if(p.calKey){
    const entries=p.calKey.pack&&p.calKey.keys?Object.entries(p.calKey.keys):[[p.calKey.type,p.calKey.amount]];
    calKeyIcons=`<div class="pc-calkey-icons">${entries.map(([t,a])=>{const info=CAL_KEY_INFO[t]||{emoji:'🗝️'};return`<span class="ck-mini">${info.emoji}<sub>×${a}</sub></span>`;}).join('')}</div>`;
  }
  let superKeyIcons='';
  if(p.superKey){
    const entries=p.superKey.pack&&p.superKey.keys?Object.entries(p.superKey.keys):[[p.superKey.keyId,p.superKey.amount]];
    superKeyIcons=`<div class="pc-superkey-icons">${entries.map(([k,a])=>{const info=SUPER_KEY_INFO[k]||{emoji:'⭐'};return`<span class="ck-mini" style="border-color:${info.color}44;color:${info.color}">${info.emoji}<sub>×${a}</sub></span>`;}).join('')}</div>`;
  }
  // Badge ticket amount
  const amtBadge=p.amount&&p.amount>1?`<span class="pc-tag" style="color:#93c5fd;border-color:rgba(96,165,250,0.3)">🎫 x${p.amount}</span>`:'';

  const btnLabel=isDisabled?(isExpired?'CADUCADO':isUpcoming?'PRÓXIMO':'AGOTADO'):'COMPRAR';

  const html=`<div class="product-card reveal" data-rarity="${q}" data-id="${p.id}" style="animation-delay:${idx*0.04}s">
    <div class="pc-band"></div>
    <div class="pc-quality-badge ${q}">${q.toUpperCase()}</div>
    ${stateBadge}
    <div class="pc-img">
      <img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy">
      ${overlay}
    </div>
    <div class="pc-body">
      <div class="pc-name">${p.emoji?' '+esc(p.emoji)+' ':''}${esc(p.name)}</div>
      ${calKeyIcons}${superKeyIcons}
      <div class="pc-desc">${esc(p.desc)}</div>
      ${expiryHTML}
      <div class="pc-tags">${tagsHTML}${amtBadge}</div>
    </div>
    <div class="pc-footer">
      <div class="pc-stock-row">
        <span class="pc-stock ${stockClass}">${stockLabel}</span>
        <span class="pc-restock">${restockStr}</span>
      </div>
      <div class="pc-price-row">${priceHTML}</div>
      <div class="pc-actions">
        <button class="pc-btn-detail" data-id="${p.id}">DETALLES</button>
        <button class="pc-btn" data-id="${p.id}" ${isDisabled?'disabled':''}>${btnLabel}</button>
      </div>
    </div>
  </div>`;

  return{html,cds};
}

/* ══ SAND BRILL ══ */
let sbProducts=[];
function pickSBProducts(){
  const eligible=products.filter(p=>{
    const now=Date.now();
    const startMs=parseDateStart(p.startsAt);
    const expMs=parseDate(p.expiresAt);
    const st=getStock(p);
    return p.price>0&&st>0&&!(startMs&&startMs>now)&&!(expMs&&expMs<now);
  });
  // Mezclar y elegir 4
  const shuffled=[...eligible].sort(()=>Math.random()-0.5);
  sbProducts=shuffled.slice(0,4).map(p=>({
    ...p,
    sbDiscount:Math.floor(Math.random()*51)+10,// 10-60%
  }));
}
function renderSBGrid(){
  const grid=$('#sbGrid');if(!grid)return;
  if(!sbProducts.length){grid.innerHTML='<div style="font-family:var(--font-pixel);font-size:0.28rem;color:var(--muted);padding:20px">No hay ofertas disponibles ahora.</div>';return;}
  grid.innerHTML=sbProducts.map(p=>{
    const disc=p.sbDiscount;
    const finalP=Math.max(1,Math.round(p.price*(1-disc/100)));
    const st=getStock(p);
    return`<div class="sb-card">
      <div class="sb-discount-badge">-${disc}%</div>
      <div class="sb-card-header">
        <span class="sb-card-icon">${p.emoji||'📦'}</span>
        <span class="sb-card-name">${esc(p.name)}</span>
      </div>
      <div class="sb-prices">
        <span class="sb-price-old">⟡${p.price}</span>
        <span class="sb-price-new">⟡${finalP}</span>
      </div>
      ${st>0
        ?`<button class="sb-btn" data-id="${p.id}" data-disc="${disc}" data-final="${finalP}">¡COMPRAR OFERTA!</button>`
        :`<div class="sb-out-label">AGOTADO</div>`
      }
    </div>`;
  }).join('');
  grid.querySelectorAll('.sb-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const id=btn.dataset.id,finalP=Number(btn.dataset.final),disc=Number(btn.dataset.disc);
      const p=products.find(x=>x.id===id);if(!p)return;
      buySBProduct(p,finalP,disc);
    });
  });
}
function buySBProduct(p,finalPrice,disc){
  const st=getStock(p);
  if(st<=0){toast('¡Agotado!','error');return;}
  setStock(p,st-1);
  if(p.restock&&st-1<=0){
    const days=RESTOCK_DAYS[p.restock];
    if(days)setNextRestock(p,nextMidnight(days));
  }
  deliverProduct(p);
  addPurchase(p,`Sand Brill -${disc}% → ⟡${finalPrice}`);
  toast(`🦊 ¡Oferta de Sand Brill! ${p.name} (${-disc}%)`, 'success');
  renderSBGrid();renderAll();
}

/* ══ COMPRA ══ */
function deliverProduct(p){
  if(p.calKey){awardCalKeys(p.calKey);}
  else if(p.superKey){awardSuperKeys(p.superKey);}
  else if(p.wheelId&&p.amount){
    // Tickets gacha
    addGachaT(p.wheelId,p.amount);
  } else if(p.sec==='pases'){
    // Activar pase
    activatePass(p.id);
  } else if(p.sec==='materiales'||p.sec==='monedas'){
    // Monedas virtuales — solo registrar
  } else {
    // Default: registrar compra
  }
  renderHUD();
  scheduleSync();
}
function activatePass(shopId){
  const passMap={s1:'pass_s1',s2:'pass_s2',s3:'pass_s3',s4:'pass_s4',s5:'pass_s5',s6:'pass_s6',s7:'pass_s7',s8:'pass_s8',s9:'pass_s9',s10:'pass_s10',s11:'pass_s11',s12:'pass_s12'};
  const passId=passMap[shopId];if(!passId)return;
  try{
    const key=`mv_pass_${passId}`;
    const raw=localStorage.getItem(key);
    const state=raw?JSON.parse(raw):{};
    const order=['stone','iron','gold','emerald','diamond'];
    if(order.indexOf(state.tier||'stone')<1){state.tier='iron';state.shopBought=true;localStorage.setItem(key,JSON.stringify(state));}
  }catch(e){console.warn(e);}
}

function getEffectivePrice(p){
  let base=p.price;
  if(flashDiscount&&base>0)base=Math.round(base*(1-flashDiscount/100));
  if(currentCoupon&&base>0)base=Math.max(0,Math.round(base-base*currentCoupon/100));
  return base;
}

function openConfirmModal(id){
  const p=products.find(x=>x.id===id);if(!p)return;
  const now=Date.now();
  const startMs=parseDateStart(p.startsAt),expMs=parseDate(p.expiresAt);
  if(startMs&&startMs>now){toast('⏳ Aún no disponible','error');return;}
  if(expMs&&expMs<now){toast('⌛ Oferta caducada','error');return;}
  const st=getStock(p);
  if(st<=0){toast('❌ Sin stock','error');return;}

  const finalPrice=getEffectivePrice(p);
  const origPrice=p.price;
  const discPct=origPrice>0?Math.round((origPrice-finalPrice)/origPrice*100):0;

  const rewardLines=getRewardLines(p);
  const rwHTML=rewardLines.map(r=>`<div class="bmr-row"><span class="bmr-ico">${r.icon}</span><span class="bmr-txt">${r.name}</span><span class="bmr-val">+${r.count}</span></div>`).join('');

  let priceSection='';
  if(origPrice===0){priceSection=`<div class="buy-modal-price" style="color:var(--green)">GRATIS</div>`;}
  else if(discPct>0){
    priceSection=`<div class="buy-modal-price-old">Precio original: ⟡${origPrice}</div><div class="buy-modal-price">⟡${finalPrice} <span style="font-size:0.4rem;color:var(--red)">(-${discPct}%)</span></div>`;
  } else {
    priceSection=`<div class="buy-modal-price">⟡${finalPrice}</div>`;
  }

  openModal(`
    <span class="buy-modal-icon">${p.emoji||'📦'}</span>
    <div class="buy-modal-name">${esc(p.name)}</div>
    <div class="buy-modal-desc">${esc(p.desc)}</div>
    ${rwHTML?`<div class="buy-modal-rewards">${rwHTML}</div>`:''}
    ${priceSection}
    <div class="buy-modal-actions">
      <button class="btn-pixel btn-ghost" onclick="document.getElementById('modal').setAttribute('aria-hidden','true')">CANCELAR</button>
      <button class="btn-pixel btn-gold pulse" id="btnConfirmBuy">✓ CONFIRMAR</button>
    </div>
  `);
  setTimeout(()=>{
    const btn=$('#btnConfirmBuy');
    if(btn)btn.addEventListener('click',()=>{
      closeModal();
      executeBuy(p,finalPrice,discPct);
    });
  },50);
}

function openDetailModal(id){
  const p=products.find(x=>x.id===id);if(!p)return;
  const now=Date.now();
  const st=getStock(p);
  const startMs=parseDateStart(p.startsAt),expMs=parseDate(p.expiresAt);
  const isDisabled=st<=0||(startMs&&startMs>now)||(expMs&&expMs<now);

  const ql={legendary:{bg:'rgba(245,158,11,0.2)',border:'rgba(245,158,11,0.5)',color:'#fde68a'},epic:{bg:'rgba(168,85,247,0.18)',border:'rgba(168,85,247,0.4)',color:'#d8b4fe'},rare:{bg:'rgba(56,189,248,0.18)',border:'rgba(56,189,248,0.3)',color:'#7dd3fc'},common:{bg:'rgba(156,163,175,0.12)',border:'rgba(156,163,175,0.2)',color:'#d1d5db'}}[p.quality||'common']||{};

  let calKeyBlock='',superKeyBlock='';
  if(p.calKey){
    const entries=p.calKey.pack&&p.calKey.keys?Object.entries(p.calKey.keys):[[p.calKey.type,p.calKey.amount]];
    const owned=lsGet(CAL_KEYS_LS,{});
    calKeyBlock=`<h3 style="font-family:var(--font-pixel);font-size:0.34rem;color:var(--gold);margin:14px 0 8px">🔑 LLAVES A RECIBIR</h3>${entries.map(([t,a])=>{const info=CAL_KEY_INFO[t]||{emoji:'🗝️',name:t};return`<div class="bmr-row" style="background:rgba(245,158,11,0.05);border:1px solid rgba(245,158,11,0.12);padding:8px 10px;margin-bottom:4px"><span class="bmr-ico">${info.emoji}</span><span class="bmr-txt">${info.name}</span><span class="bmr-val">+${a} <small style="font-size:0.22rem;color:var(--muted)">(tienes ${owned[t]||0})</small></span></div>`;}).join('')}`;
  }
  if(p.superKey){
    const entries=p.superKey.pack&&p.superKey.keys?Object.entries(p.superKey.keys):[[p.superKey.keyId,p.superKey.amount]];
    const owned=lsGet(CHEST_KEYS_LS,{});
    superKeyBlock=`<h3 style="font-family:var(--font-pixel);font-size:0.34rem;color:var(--gold);margin:14px 0 8px">⭐ LLAVES A RECIBIR</h3>${entries.map(([k,a])=>{const info=SUPER_KEY_INFO[k]||{emoji:'⭐',name:k,color:'#fbbf24'};return`<div class="bmr-row" style="background:${info.color}0d;border:1px solid ${info.color}22;padding:8px 10px;margin-bottom:4px"><span class="bmr-ico">${info.emoji}</span><span class="bmr-txt" style="color:${info.color}">${info.name}</span><span class="bmr-val">+${a} <small style="font-size:0.22rem;color:var(--muted)">(tienes ${owned[k]||0})</small></span></div>`;}).join('')}`;
  }

  const finalPrice=getEffectivePrice(p);
  const rstLabel=p.restock?({
    '24h':'Cada día a medianoche','7d':'Cada 7 días','30d':'Cada 30 días',
  }[p.restock]||p.restock):'Sin restock';

  openModal(`
    <h2>${esc(p.name)}</h2>
    <div class="mdl-img"><img src="${esc(p.img)}" alt="${esc(p.name)}"></div>
    <span class="mdl-quality" style="background:${ql.bg};border-color:${ql.border};color:${ql.color}">${(p.quality||'common').toUpperCase()}${p.gold?' · ★ DESTACADO':''}</span>
    <div class="mdl-desc">${esc(p.desc)}</div>
    <div class="mdl-meta">
      <div class="mdl-meta-item">💰 Precio: <strong>⟡${p.price===0?'GRATIS':p.price}</strong></div>
      <div class="mdl-meta-item">📦 Stock: <strong>${st===999?'Ilimitado':st}</strong></div>
      <div class="mdl-meta-item">↻ Restock: <strong>${rstLabel}</strong></div>
      <div class="mdl-meta-item">🏷️ Sección: <strong>${p.sec}</strong></div>
      ${p.startsAt?`<div class="mdl-meta-item">📅 Desde: <strong>${p.startsAt}</strong></div>`:''}
      ${p.expiresAt?`<div class="mdl-meta-item">⏰ Caduca: <strong>${p.expiresAt}</strong></div>`:''}
    </div>
    ${calKeyBlock}${superKeyBlock}
    <div class="buy-modal-actions">
      <button class="btn-pixel btn-ghost" onclick="document.getElementById('modal').setAttribute('aria-hidden','true')">CERRAR</button>
      <button class="btn-pixel btn-gold" id="mdlBtnBuy" ${isDisabled?'disabled':''}>⟡${finalPrice===0?'GRATIS':finalPrice} · COMPRAR</button>
    </div>
  `);
  setTimeout(()=>{
    const btn=$('#mdlBtnBuy');
    if(btn&&!isDisabled)btn.addEventListener('click',()=>{closeModal();openConfirmModal(p.id);});
  },50);
}

function executeBuy(p,finalPrice,discPct){
  const st=getStock(p);
  if(st<=0){toast('❌ Sin stock','error');return;}
  setStock(p,st-1);
  if(p.restock&&st-1<=0){
    const days=RESTOCK_DAYS[p.restock];
    if(days)setNextRestock(p,nextMidnight(days));
  }
  deliverProduct(p);
  addPurchase(p,discPct>0?`-${discPct}% → ⟡${finalPrice}`:'');
  // Gastar cupón
  if(currentCoupon){
    if(currentScId){
      const sc=[...SEASONAL_COUPONS,BLACK_FRIDAY].find(s=>s.id===currentScId);
      if(sc&&sc.id===BLACK_FRIDAY.id){/* BF no se agota */}
      else if(sc){decScUses(sc);if(getScUsesLeft(sc)<=0){saveCurrentScId(null);currentCoupon=0;saveCurrentCoupon();toast('🎟️ Usos de cupón agotados','info');}}
    } else {
      setCoupCD(currentCoupon,nextMidnight(1));
      currentCoupon=0;saveCurrentCoupon();
    }
    renderCoupons();
  }
  renderAll();
  showSuccessModal(p,finalPrice);
}

function showSuccessModal(p,finalPrice){
  const rLines=getRewardLines(p);
  const rwHTML=rLines.map(r=>`<div class="bmr-row"><span class="bmr-ico">${r.icon}</span><span class="bmr-txt">${r.name}</span><span class="bmr-val">+${r.count}</span></div>`).join('');
  openModal(`
    <div style="text-align:center;padding:10px 0">
      <span style="font-size:4rem;display:block;margin-bottom:14px;filter:drop-shadow(0 0 18px var(--a))">${p.emoji||'📦'}</span>
      <h2>¡COMPRA EXITOSA!</h2>
      <div style="font-family:var(--font-pixel);font-size:0.36rem;color:var(--text);margin-bottom:16px;line-height:1.8">${esc(p.name)}</div>
      ${rwHTML?`<div class="buy-modal-rewards">${rwHTML}</div>`:''}
      <button class="btn-pixel btn-gold large" onclick="document.getElementById('modal').setAttribute('aria-hidden','true')" style="margin-top:8px">¡GENIAL!</button>
    </div>
  `);
}

function getRewardLines(p){
  const lines=[];
  if(p.wheelId&&p.amount)lines.push({icon:'🎟️',name:`Tickets ${p.wheelId}`,count:p.amount});
  else if(p.calKey){
    const entries=p.calKey.pack&&p.calKey.keys?Object.entries(p.calKey.keys):[[p.calKey.type,p.calKey.amount]];
    entries.forEach(([t,a])=>{const info=CAL_KEY_INFO[t]||{emoji:'🗝️',name:t};lines.push({icon:info.emoji,name:info.name,count:a});});
  } else if(p.superKey){
    const entries=p.superKey.pack&&p.superKey.keys?Object.entries(p.superKey.keys):[[p.superKey.keyId,p.superKey.amount]];
    entries.forEach(([k,a])=>{const info=SUPER_KEY_INFO[k]||{emoji:'⭐',name:k};lines.push({icon:info.emoji,name:info.name,count:a});});
  } else if(p.sec==='pases')lines.push({icon:'🏆',name:'Pase Activado (Tier Hierro)',count:1});
  else lines.push({icon:p.emoji||'📦',name:p.name,count:1});
  return lines;
}

/* ══ HISTORIAL ══ */
function getPurchases(){return lsGet(LS.hist,[]);}
function addPurchase(p,note=''){
  const hist=getPurchases();
  hist.unshift({id:p.id,name:p.name,icon:p.emoji||'📦',note,date:new Date().toISOString()});
  if(hist.length>60)hist.pop();
  lsSet(LS.hist,hist);
  renderHistory();
  scheduleSync();
}
function renderHistory(){
  const list=$('#purchasesList');if(!list)return;
  const hist=getPurchases();
  if(!hist.length){list.innerHTML='<div class="empty-hist"><span>📭</span><p>SIN COMPRAS AÚN</p></div>';return;}
  list.innerHTML=hist.map(h=>`
    <div class="purchase-item">
      <span class="pi-icon">${h.icon||'📦'}</span>
      <div class="pi-info">
        <div class="pi-name">${esc(h.name)}</div>
        <div class="pi-detail">${esc(h.note||'')}</div>
      </div>
      <div class="pi-time">${timeAgo(h.date)}</div>
    </div>`).join('');
}

/* ══ CUPONES RENDER ══ */
function renderCoupons(){
  const box=$('#couponList');if(!box)return;
  const now=Date.now();
  // Limpiar cooldowns vencidos
  const state=getCoupState();
  let dirty=false;
  REGULAR_COUPONS.forEach(c=>{if(Number(state[c]||0)>0&&Number(state[c])<=now){state[c]=0;dirty=true;}});
  if(dirty)saveCoupState(state);

  const allSC=[...SEASONAL_COUPONS,BLACK_FRIDAY];
  const activeSC=allSC.filter(sc=>isScActive(sc));

  // Validar sc guardado
  if(currentScId){
    if(!activeSC.find(sc=>sc.id===currentScId)){
      saveCurrentScId(null);bfDiscount=null;currentCoupon=0;saveCurrentCoupon();
    }
  }

  let html='';
  // Black Friday / SC
  activeSC.forEach(sc=>{
    const isSel=currentScId===sc.id;
    if(sc.id===BLACK_FRIDAY.id){
      const dLabel=isSel&&bfDiscount?`🎲 ${bfDiscount}% OFF`:'% Aleatorio';
      html+=`<button class="coupon-card bf-coupon${isSel?' active-coupon':''}" data-sc-id="${sc.id}">
        <span class="coupon-bf-title">${sc.name}</span>
        <span class="coupon-sub">${dLabel}</span>
        <span class="coupon-sub" style="font-size:0.2rem;opacity:0.7">∞ Sin límite</span>
      </button>`;
    } else {
      const uses=getScUsesLeft(sc);
      const exh=uses<=0;
      html+=`<button class="coupon-card ${sc.style||''}${isSel?' active-coupon':''}${exh?' disabled-coupon':''}" data-sc-id="${sc.id}" ${exh?'disabled':''}>
        <span>${sc.name}</span>
        <span class="coupon-sub">${sc.discount}% OFF</span>
        <span class="coupon-sub" style="font-size:0.2rem">${uses}/${sc.maxUses} usos</span>
      </button>`;
    }
  });
  if(activeSC.length){html+=`<div class="coupon-sep">── Cupones regulares ──</div>`;}
  // Regulares
  html+=REGULAR_COUPONS.map(c=>{
    const cd=getCoupCD(c);const active=Number(cd)>now;
    const isSel=currentCoupon===c&&!currentScId;
    if(active){
      const diff=Math.max(0,Number(cd)-now);
      const h=Math.floor(diff/3600000),m=Math.floor((diff%3600000)/60000);
      return`<button class="coupon-card disabled-coupon" disabled>${c}%<span class="coupon-sub">↻ ${h}h ${m}m</span></button>`;
    }
    return`<button class="coupon-card${isSel?' active-coupon':''}" data-pct="${c}">${c}%${isSel?'<span class="coupon-sub">✓ activo</span>':''}</button>`;
  }).join('');
  box.innerHTML=html;

  // Listeners SC
  box.querySelectorAll('[data-sc-id]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const scId=btn.dataset.scId;
      if(currentScId===scId){saveCurrentScId(null);bfDiscount=null;currentCoupon=0;saveCurrentCoupon();toast('Cupón desactivado','info');}
      else{
        const sc=allSC.find(s=>s.id===scId);if(!sc)return;
        saveCurrentScId(scId);
        if(sc.id===BLACK_FRIDAY.id){bfDiscount=Math.floor(Math.random()*41)+10;currentCoupon=bfDiscount;toast(`🖤 BLACK FRIDAY ${bfDiscount}% OFF activado`,'success');}
        else{currentCoupon=sc.discount;toast(`${sc.emoji} ${sc.name} — ${sc.discount}% OFF activado`,'success');}
        saveCurrentCoupon();
      }
      renderCoupons();renderAll();
    });
  });
  // Listeners regulares
  box.querySelectorAll('[data-pct]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const pct=Number(btn.dataset.pct);
      if(currentScId){saveCurrentScId(null);bfDiscount=null;}
      currentCoupon=currentCoupon===pct&&!currentScId?0:pct;
      saveCurrentCoupon();renderCoupons();renderAll();
    });
  });
}
setInterval(renderCoupons,30000);

/* ══ MODAL ══ */
function openModal(html){
  const m=$('#modal'),c=$('#modalContent');if(!m||!c)return;
  c.innerHTML=html;m.setAttribute('aria-hidden','false');
}
function closeModal(){$('#modal')?.setAttribute('aria-hidden','true');}

/* ══ TOAST ══ */
function toast(msg,type='success'){
  const t=$('#toast');if(!t)return;
  t.textContent=msg;t.className=`toast show ${type}`;
  clearTimeout(t._tm);t._tm=setTimeout(()=>t.classList.remove('show'),3000);
}

/* ══ NPC ══ */
const NPC_MSGS=[
  '¡Los mejores productos del portal!',
  '¿Ya viste los pases de temporada?',
  '¡Flash Sale activo el finde!',
  '🦊 ¡Mis ofertas son irresistibles!',
  'Los legendarios son rarísimos…',
  '¡Los stocks limitados se agotan!',
  '¿Tickets o llaves? Tengo todo',
  '¡Código especial para más descuentos!',
];
let npcIdx=0,npcIv=null;
function initNPC(){
  const d=$('#npc-dialog');if(!d)return;
  d.textContent=NPC_MSGS[0];
  npcIv=setInterval(()=>{npcIdx=(npcIdx+1)%NPC_MSGS.length;d.textContent=NPC_MSGS[npcIdx];},9000);
}

/* ══ PARTICLES ══ */
function initCoins(){
  const canvas=$('#bgCoins');if(!canvas)return;
  const ctx=canvas.getContext('2d');
  let W=canvas.width=window.innerWidth,H=canvas.height=window.innerHeight;
  const SYMS=['🪙','💰','✨','💛','⭐'];
  const coins=Array.from({length:28},()=>({x:Math.random()*W,y:Math.random()*H,size:Math.random()*10+7,speed:Math.random()*0.35+0.08,sym:SYMS[Math.floor(Math.random()*SYMS.length)],o:Math.random()*0.25+0.05}));
  (function draw(){ctx.clearRect(0,0,W,H);coins.forEach(c=>{ctx.globalAlpha=c.o;ctx.font=`${c.size}px serif`;ctx.fillText(c.sym,c.x,c.y);c.y-=c.speed;if(c.y<-20){c.y=H+10;c.x=Math.random()*W;}});requestAnimationFrame(draw);})();
  window.addEventListener('resize',()=>{W=canvas.width=window.innerWidth;H=canvas.height=window.innerHeight;});
}

/* ══ REVEAL ══ */
function initReveal(){
  const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}});},{threshold:0.08});
  document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
}
const _revealObs=new MutationObserver(()=>{
  document.querySelectorAll('.reveal:not(.visible)').forEach(el=>{
    if(!el._revealObserved){el._revealObserved=true;const o=new IntersectionObserver(ents=>{ents.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');o.unobserve(e.target);}});},{threshold:0.08});o.observe(el);}
  });
});

/* ══ BOOT ══ */
function boot(){
  console.log('🛒 Moonveil Shop v3.0');
  initReveal();initCoins();initNPC();
  initFlashSale();
  syncStocks();
  renderHUD();
  renderCoupons();
  pickSBProducts();
  renderSBGrid();
  renderAll();
  renderHistory();

  // Rerender grids después para reveal
  setTimeout(()=>{
    _revealObs.observe(document.body,{childList:true,subtree:true});
    document.querySelectorAll('.reveal').forEach(el=>{
      const o=new IntersectionObserver(ents=>{ents.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');o.unobserve(e.target);}});},{threshold:0.05});o.observe(el);
    });
  },100);

  // Categorías
  document.querySelectorAll('.cat-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('.cat-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      currentSection=btn.dataset.sec||'all';
      renderAll();
    });
  });

  // Búsqueda
  $('#searchInput')?.addEventListener('input',e=>{searchText=e.target.value||'';renderAll();});
  $('#clearSearch')?.addEventListener('click',()=>{const i=$('#searchInput');if(i)i.value='';searchText='';renderAll();});

  // Modal
  $('#modalClose')?.addEventListener('click',closeModal);
  $('#modal .modal-backdrop')?.addEventListener('click',closeModal);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});

  // Sin cupón
  $('#btnNoCoupon')?.addEventListener('click',()=>{
    currentCoupon=0;saveCurrentCoupon();saveCurrentScId(null);bfDiscount=null;
    renderCoupons();renderAll();toast('Cupón eliminado','info');
  });

  // Historial drawer
  const drawer=$('#histDrawer'),backdrop=$('#histBackdrop');
  $('#histToggle')?.addEventListener('click',()=>{
    drawer?.classList.toggle('open');
    backdrop?.classList.toggle('open');
    if(drawer?.classList.contains('open'))renderHistory();
  });
  $('#histClose')?.addEventListener('click',()=>{drawer?.classList.remove('open');backdrop?.classList.remove('open');});
  backdrop?.addEventListener('click',()=>{drawer?.classList.remove('open');backdrop.classList.remove('open');});
  $('#btnClearHistory')?.addEventListener('click',()=>{
    if(!confirm('¿Limpiar historial?'))return;
    lsSet(LS.hist,[]);renderHistory();toast('Historial limpiado','info');
  });

  // Sand Brill refresh
  $('#btnRefreshSB')?.addEventListener('click',()=>{pickSBProducts();renderSBGrid();toast('🦊 Nuevas ofertas de Sand Brill','success');});

  // Hamburger
  const ham=$('#hamburger'),nav=$('#main-nav');
  ham?.addEventListener('click',()=>nav?.classList.toggle('open'));

  // Firebase auth
  onAuthChange(async user=>{
    if(!user)return;
    currentUID=user.uid;
    await loadFromFirebase(user.uid);
    renderHUD();renderHistory();
    console.log('✅ Shop Firebase OK:',user.uid);
  });
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
else boot();