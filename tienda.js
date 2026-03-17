'use strict';
/**
 * tienda.js — Moonveil Portal Shop v3.0
 * ✅ Secciones completas: Pases, Cofres, Tickets, Llaves Cal,
 *    Superestrellas, Materiales, Historia, Monedas, Eventos, Packs, Especiales
 * ✅ Flash Sale — descuento al azar los fines de semana
 * ✅ Sand Brill — artículos al azar con rebaja 10-60%
 * ✅ Cupones de temporada grandes y visibles
 * ✅ Historial en panel deslizable
 * ✅ Firebase Firestore sync
 * ✅ Stock real con restock por medianoche
 * ✅ Imágenes de productos
 * ✅ NPC zorrito mejorado
 */

import { db }          from './firebase.js';
import { onAuthChange } from './auth.js';
import {
  doc, getDoc, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

/* ── helpers ── */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const wait = ms => new Promise(r => setTimeout(r, ms));

/* ── localStorage ── */
const LS = {
  inventory: 'mv_inventory',
  purchases: 'mv_shop_purchases',
  coupons:   'mv_shop_coupons',
  onetime:   'mv_shop_onetime',
  stocks:    'mv_shop_stocks_v3',
  restocks:  'mv_shop_restocks_v3',
  sbDeals:   'mv_sb_deals',
  sbExpiry:  'mv_sb_expiry',
  flashDisc: 'mv_flash_disc',
  flashExp:  'mv_flash_exp',
};
const lsGet = (k, fb = null) => { try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : fb; } catch { return fb; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

/* ── Firebase ── */
let currentUID = null, syncTimeout = null;
function scheduleSync() { if (!currentUID) return; clearTimeout(syncTimeout); syncTimeout = setTimeout(doSync, 2500); }
async function doSync() {
  if (!currentUID) return;
  try {
    const inv = lsGet(LS.inventory, {tickets:0,keys:0,superstar_keys:0});
    const hist = lsGet(LS.purchases, []);
    const gachaTickets = {};
    ['classic','dark_moon','spring','storm','cyber','abyss'].forEach(id => {
      gachaTickets[id] = parseInt(localStorage.getItem(`mv_tickets_${id}`) || '0', 10);
    });
    await updateDoc(doc(db, 'users', currentUID), {
      inventory: inv, shop_purchases: hist, gacha_tickets: gachaTickets, updatedAt: serverTimestamp()
    });
  } catch(e) { console.warn('[Shop] sync:', e); }
}
async function loadFromFirebase(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return;
    const d = snap.data();
    if (d.inventory) {
      const cur = lsGet(LS.inventory, {tickets:0,keys:0,superstar_keys:0});
      lsSet(LS.inventory, {
        tickets:       Math.max(cur.tickets||0,       d.inventory.tickets||0),
        keys:          Math.max(cur.keys||0,          d.inventory.keys||0),
        superstar_keys:Math.max(cur.superstar_keys||0, d.inventory.superstar_keys||0)
      });
    }
    if (d.gacha_tickets) {
      Object.entries(d.gacha_tickets).forEach(([rid, count]) => {
        const lsKey = `mv_tickets_${rid}`;
        const local = parseInt(localStorage.getItem(lsKey) || '-1', 10);
        localStorage.setItem(lsKey, String(Math.max(local < 0 ? 0 : local, count || 0)));
      });
    }
    if (d.shop_purchases && Array.isArray(d.shop_purchases)) {
      const local = lsGet(LS.purchases, []);
      if (d.shop_purchases.length > local.length) lsSet(LS.purchases, d.shop_purchases);
    }
  } catch(e) { console.warn('[Shop] load:', e); }
}

/* ══════════════════════════════════════
   CATÁLOGO DE PRODUCTOS
══════════════════════════════════════ */
const PRODUCTS = [
  /* ── PASES DE TEMPORADA ── */
  { id:'s1',  cat:'pases', emoji:'🏆', icon:'🏆', name:'Pase Reino del Hielo — T.I',          img:'img-pass/banwar.jpg',      quality:'legend', price:128, stock:1,  restock:null, startsAt:'2026-01-01', expiresAt:'2026-01-31', badge:'limited', desc:'Desbloquea recompensas de enero. Tier Hierro activado.', tags:[{t:'pase',l:'PASE T.I'},{t:'keys',l:'T.HIERRO'}], give:{type:'pass',passId:'pass_s1'}, onetime:false },
  { id:'s2',  cat:'pases', emoji:'🏆', icon:'🏆', name:'Pase Corazones de Redstone — T.II',   img:'img-pass/banhall.jpg',     quality:'legend', price:128, stock:1,  restock:null, startsAt:'2026-02-01', expiresAt:'2026-02-28', badge:'limited', desc:'Desbloquea recompensas de febrero.', tags:[{t:'pase',l:'PASE T.II'},{t:'keys',l:'T.HIERRO'}], give:{type:'pass',passId:'pass_s2'}, onetime:false },
  { id:'s3',  cat:'pases', emoji:'🏆', icon:'🏆', name:'Pase Despertar de la Naturaleza — T.III', img:'img-pass/partymine.jpg', quality:'legend', price:128, stock:1, restock:null, startsAt:'2026-03-01', expiresAt:'2026-03-31', badge:null, desc:'Desbloquea recompensas de marzo.', tags:[{t:'pase',l:'PASE T.III'}], give:{type:'pass',passId:'pass_s3'}, onetime:false },
  { id:'s4',  cat:'pases', emoji:'🏆', icon:'🏆', name:'Pase Lluvia Plateada — T.IV',          img:'img-pass/chrismine.jpg',   quality:'legend', price:128, stock:1, restock:null, startsAt:'2026-04-01', expiresAt:'2026-04-30', badge:null, desc:'Desbloquea recompensas de abril.', tags:[{t:'pase',l:'PASE T.IV'}], give:{type:'pass',passId:'pass_s4'}, onetime:false },
  { id:'s5',  cat:'pases', emoji:'🏆', icon:'🏆', name:'Pase Esencia de la Aurora — T.V',      img:'img-pass/añomine.jpg',     quality:'legend', price:128, stock:1, restock:null, startsAt:'2026-05-01', expiresAt:'2026-05-31', badge:null, desc:'Desbloquea recompensas de mayo.', tags:[{t:'pase',l:'PASE T.V'}], give:{type:'pass',passId:'pass_s5'}, onetime:false },
  { id:'s6',  cat:'pases', emoji:'🏆', icon:'🏆', name:'Pase Imperio del Océano — T.VI',       img:'img-pass/banair.jpg',      quality:'legend', price:128, stock:1, restock:null, startsAt:'2026-06-01', expiresAt:'2026-06-30', badge:null, desc:'Desbloquea recompensas de junio.', tags:[{t:'pase',l:'PASE T.VI'}], give:{type:'pass',passId:'pass_s6'}, onetime:false },

  /* ── COFRES ── */
  { id:'k1', cat:'llaves', emoji:'🗝️', icon:'🗝️', name:'Cofre de Ámbar',     img:'img/chest2.gif', quality:'epic',   price:30, stock:10, restock:'7d',  badge:'hot',    desc:'Abre este cofre de Ámbar y descubre sus secretos.', tags:[{t:'keys',l:'COFRE'}], give:{type:'inventory',item:'keys',count:1}, onetime:false },
  { id:'k2', cat:'llaves', emoji:'🗝️', icon:'🗝️', name:'Cofre de Sueños',    img:'img/chest2.gif', quality:'epic',   price:30, stock:10, restock:'7d',  badge:null,     desc:'Abre este cofre de los Sueños que alguna vez hubo…', tags:[{t:'keys',l:'COFRE'}], give:{type:'inventory',item:'keys',count:1}, onetime:false },
  { id:'k3', cat:'llaves', emoji:'🗝️', icon:'🗝️', name:'Cofre de Moonveil',  img:'img/chest2.gif', quality:'legend', price:10, stock:10, restock:'7d',  badge:'hot',    desc:'El cofre oficial de Moonveil Portal.', tags:[{t:'keys',l:'COFRE'},{t:'keys',l:'LEGENDARIO'}], give:{type:'inventory',item:'keys',count:1}, onetime:false },
  { id:'k4', cat:'llaves', emoji:'🗝️', icon:'🗝️', name:'Cofre de Moonveil II', img:'img/chest2.gif', quality:'legend', price:30, stock:5, restock:'7d', badge:'limited', desc:'Cofre exclusivo de Moonveil.', tags:[{t:'keys',l:'COFRE'},{t:'keys',l:'RARO'}], give:{type:'inventory',item:'keys',count:1}, onetime:false },
  { id:'k_basic_3',  cat:'llaves', emoji:'🗝️', icon:'🗝️', name:'Pack Llaves x3',   img:'img/chest2.gif', quality:'common', price:0,  stock:10, restock:'7d',  badge:'hot',    desc:'3 llaves de cofre básicas.',     tags:[{t:'keys',l:'3 LLAVES'}], give:{type:'inventory',item:'keys',count:3}, onetime:false },
  { id:'k_basic_10', cat:'llaves', emoji:'🗝️', icon:'🗝️', name:'Pack Llaves x10',  img:'img/chest2.gif', quality:'epic',   price:0,  stock:5,  restock:'7d',  badge:'limited', desc:'10 llaves + 1 super llave bonus.', tags:[{t:'keys',l:'10 LLAVES'},{t:'super',l:'+1 SUPER'}], give:{type:'multi',actions:[{type:'inventory',item:'keys',count:10},{type:'inventory',item:'superstar_keys',count:1}]}, onetime:false },

  /* ── TICKETS GACHA ── */
  { id:'t_classic_1',   cat:'tickets', emoji:'💎', icon:'💎', name:'Ticket Clásico',             img:'imagen/ticket5.jpg', quality:'epic', price:10, stock:10, restock:'24h', badge:'hot',  desc:'Ticket para la Ruleta Clásica permanente.', tags:[{t:'tickets',l:'1 TKT'}], give:{type:'gacha_tickets',wheel:'classic',count:1}, onetime:false },
  { id:'t_classic_5',   cat:'tickets', emoji:'💎', icon:'💎', name:'Pack Clásico x5',            img:'imagen/ticket5.jpg', quality:'epic', price:0,  stock:10, restock:'24h', badge:'hot',  desc:'5 tickets para la Ruleta Clásica.', tags:[{t:'tickets',l:'5 TKT CLÁSICA'}], give:{type:'gacha_tickets',wheel:'classic',count:5}, onetime:false },
  { id:'t_classic_10',  cat:'tickets', emoji:'💎', icon:'💎', name:'Pack Clásico x10',           img:'imagen/ticket5.jpg', quality:'epic', price:0,  stock:10, restock:'24h', badge:'sale', desc:'10 tickets + bonus de velocidad.', tags:[{t:'tickets',l:'10 TKT'},{t:'bonus',l:'BONUS x1'}], give:{type:'gacha_tickets',wheel:'classic',count:10}, onetime:false },
  { id:'t_classic_30',  cat:'tickets', emoji:'💎', icon:'💎', name:'Pack Clásico x30',           img:'imagen/ticket5.jpg', quality:'legend', price:0, stock:2, restock:null, badge:'limited', desc:'Pack mega de 30 tickets clásicos.', tags:[{t:'tickets',l:'30 TKT'},{t:'bonus',l:'BONUS x5'}], give:{type:'gacha_tickets',wheel:'classic',count:30}, onetime:false },
  { id:'t_elemental_1', cat:'tickets', emoji:'🎫', icon:'🎫', name:'Ticket de Cobre',            img:'imagen/ticket5.jpg', quality:'epic', price:10, stock:10, restock:'24h', badge:null,   desc:'Ticket para la ruleta elemental.', tags:[{t:'tickets',l:'1 TKT ELEMENTAL'}], give:{type:'gacha_tickets',wheel:'elemental',count:1}, onetime:false },
  { id:'t_elemental_5', cat:'tickets', emoji:'🎫', icon:'🎫', name:'Pack Cobre x5',             img:'imagen/ticket5.jpg', quality:'epic', price:0,  stock:10, restock:'24h', badge:null,   desc:'5 tickets para la ruleta elemental.', tags:[{t:'tickets',l:'5 TKT ELEMENTAL'}], give:{type:'gacha_tickets',wheel:'elemental',count:5}, onetime:false },
  { id:'t_event_1',     cat:'tickets', emoji:'🎪', icon:'🎪', name:'Ticket de Evento',          img:'imagen/ticket5.jpg', quality:'epic', price:10, stock:10, restock:'24h', badge:'new',  desc:'Ticket para la ruleta de eventos.', tags:[{t:'tickets',l:'1 TKT EVENTO'}], give:{type:'gacha_tickets',wheel:'event',count:1}, onetime:false },
  { id:'t_darkmoon_5',  cat:'tickets', emoji:'🌑', icon:'🌑', name:'Pack Luna Oscura x5',       img:'imagen/ticket5.jpg', quality:'epic', price:0,  stock:5, restock:'7d', badge:'new',    desc:'5 tickets para Luna Oscura.', tags:[{t:'tickets',l:'5 TKT LUNA'}], give:{type:'gacha_tickets',wheel:'dark_moon',count:5}, onetime:false },
  { id:'t_welcome',     cat:'tickets', emoji:'🎉', icon:'🎉', name:'¡Bienvenida a los tickets!', img:'imagen/ticket5.jpg', quality:'epic', price:0, stock:1, restock:null, badge:'hot',     desc:'10 tickets de bienvenida. ¡Solo una vez!', tags:[{t:'tickets',l:'10 TKT'},{t:'free',l:'BIENVENIDA'}], give:{type:'gacha_tickets',wheel:'classic',count:10}, onetime:true },
  { id:'t_free_spin',   cat:'tickets', emoji:'🎰', icon:'🎰', name:'Tiros Gratis!!',             img:'imagen/ticket5.jpg', quality:'legend', price:0, stock:1, restock:'30d', badge:'sale', desc:'10 tiros gratis mensuales.', tags:[{t:'tickets',l:'10 TKT'},{t:'free',l:'MENSUAL'}], give:{type:'gacha_tickets',wheel:'classic',count:10}, onetime:false },

  /* ── LLAVES DEL CALENDARIO ── */
  { id:'ck_normal',    cat:'calkeys', emoji:'🔵', icon:'🔵', name:'Llave Normal',                     img:'img/keys1.jpg', quality:'rare',   price:30,  stock:10, restock:'7d',  badge:null,     desc:'Recupera un día perdido en el Calendario de Recompensas.', tags:[{t:'keys',l:'LLAVE NORMAL'}], give:{type:'cal_key',keyType:'normal',amount:1}, onetime:false },
  { id:'ck_pink',      cat:'calkeys', emoji:'💗', icon:'💗', name:'Llave Rosa',                       img:'img/keys1.jpg', quality:'epic',   price:50,  stock:5,  restock:'30d', badge:null,     desc:'Llave especial de San Valentín, Día de la Madre. Da ×2 XP.', tags:[{t:'keys',l:'LLAVE ROSA'}], give:{type:'cal_key',keyType:'pink',amount:1}, onetime:false },
  { id:'ck_green',     cat:'calkeys', emoji:'🟢', icon:'🟢', name:'Llave Verde',                      img:'img/keys1.jpg', quality:'epic',   price:50,  stock:5,  restock:'30d', badge:null,     desc:'Llave de Navidad y Año Nuevo. Da ×2 XP.', tags:[{t:'keys',l:'LLAVE VERDE'}], give:{type:'cal_key',keyType:'green',amount:1}, onetime:false },
  { id:'ck_special',   cat:'calkeys', emoji:'💜', icon:'💜', name:'Llave Especial',                   img:'img/keys1.jpg', quality:'epic',   price:60,  stock:3,  restock:'30d', badge:null,     desc:'Para días únicos especiales. Da ×2 XP.', tags:[{t:'keys',l:'ESPECIAL'}], give:{type:'cal_key',keyType:'special',amount:1}, onetime:false },
  { id:'ck_future',    cat:'calkeys', emoji:'⏩', icon:'⏩', name:'Llave Futuro',                     img:'img/keys1.jpg', quality:'legend', price:100, stock:2,  restock:'30d', badge:'limited', desc:'¡Rarísima! Reclama días que aún no llegaron.', tags:[{t:'keys',l:'FUTURO'},{t:'bonus',l:'RARA'}], give:{type:'cal_key',keyType:'future',amount:1}, onetime:false },
  { id:'ck_pack_all',  cat:'calkeys', emoji:'🎁', icon:'🎁', name:'Pack Definitivo — 1 de Cada',     img:'img/keys1.jpg', quality:'legend', price:280, stock:1,  restock:'30d', badge:'limited', desc:'1 llave de cada tipo. El pack supremo.', tags:[{t:'keys',l:'TODAS LAS LLAVES'}], give:{type:'cal_key_pack',keys:{normal:1,pink:1,green:1,orange:1,cat:1,special:1,future:1}}, onetime:false },

  /* ── LLAVES SUPERESTRELLA ── */
  { id:'sk_common',    cat:'superestrellas', emoji:'⭐', icon:'⭐', name:'Llave Superestrella',          img:'img/keys1.jpg', quality:'common', price:20,  stock:20, restock:'24h', badge:null,     desc:'Llave para abrir el Cofre Común.', tags:[{t:'super',l:'COMÚN'}], give:{type:'super_key',keyId:'key_common',amount:1}, onetime:false },
  { id:'sk_rare',      cat:'superestrellas', emoji:'💫', icon:'💫', name:'Llave Sup. Brillante',         img:'img/keys1.jpg', quality:'rare',   price:40,  stock:15, restock:'24h', badge:null,     desc:'Llave para el Cofre Raro.', tags:[{t:'super',l:'RARO'}], give:{type:'super_key',keyId:'key_rare',amount:1}, onetime:false },
  { id:'sk_special',   cat:'superestrellas', emoji:'✨', icon:'✨', name:'Llave Sup. Especial',          img:'img/keys1.jpg', quality:'epic',   price:80,  stock:10, restock:'7d',  badge:null,     desc:'Llave para el Cofre Especial.', tags:[{t:'super',l:'ESPECIAL'}], give:{type:'super_key',keyId:'key_special',amount:1}, onetime:false },
  { id:'sk_epic',      cat:'superestrellas', emoji:'🔮', icon:'🔮', name:'Llave Sup. Épica',             img:'img/keys1.jpg', quality:'epic',   price:160, stock:5,  restock:'7d',  badge:'limited', desc:'Llave para el Cofre Épico.', tags:[{t:'super',l:'ÉPICO'}], give:{type:'super_key',keyId:'key_epic',amount:1}, onetime:false },
  { id:'sk_legendary', cat:'superestrellas', emoji:'👑', icon:'👑', name:'Llave Sup. Legendaria',        img:'img/keys1.jpg', quality:'legend', price:320, stock:3,  restock:'7d',  badge:'limited', desc:'Llave para el Cofre Legendario. Solo los más valientes.', tags:[{t:'super',l:'LEGENDARIO'}], give:{type:'super_key',keyId:'key_legendary',amount:1}, onetime:false },
  { id:'sk_pack_top',  cat:'superestrellas', emoji:'👑', icon:'👑', name:'Pack Élite — Épica ×2 + Leg ×1', img:'img/keys1.jpg', quality:'legend', price:256, stock:3, restock:'30d', badge:'limited', desc:'El pack de los elegidos.', tags:[{t:'super',l:'PACK ÉLITE'}], give:{type:'super_key_pack',keys:{key_epic:2,key_legendary:1}}, onetime:false },

  /* ── MATERIALES ── */
  { id:'f1', cat:'materiales', emoji:'⚙️', icon:'⚙️', name:'Rieles (x64)',              img:'imagen/phantom.gif', quality:'epic',   price:64,  stock:10, restock:'24h', badge:null,  desc:'Unos rieles que siempre vienen bien.', tags:[{t:'keys',l:'RIELES'}], give:{type:'item',itemName:'Rieles x64'}, onetime:false },
  { id:'f2', cat:'materiales', emoji:'⚙️', icon:'⚙️', name:'Rieles Activadores (x64)', img:'imagen/phantom.gif', quality:'epic',   price:128, stock:10, restock:'24h', badge:null,  desc:'Activemos estos rieles...', tags:[{t:'keys',l:'RIELES ACTIV.'}], give:{type:'item',itemName:'Rieles Activadores x64'}, onetime:false },
  { id:'f3', cat:'materiales', emoji:'⚙️', icon:'⚙️', name:'Rieles x2 (x128)',         img:'imagen/phantom.gif', quality:'epic',   price:64,  stock:2,  restock:'7d',  badge:'hot', desc:'¡Con descuento! Doble pack de rieles.', tags:[{t:'keys',l:'x2 RIELES'}], give:{type:'item',itemName:'Rieles x128'}, onetime:false },
  { id:'f4', cat:'materiales', emoji:'🧱', icon:'🧱', name:'Concreto (x64)',            img:'imagen/phantom.gif', quality:'epic',   price:64,  stock:20, restock:'24h', badge:null,  desc:'Para construir cosas increíbles.', tags:[{t:'keys',l:'CONCRETO'}], give:{type:'item',itemName:'Concreto x64'}, onetime:false },
  { id:'f5', cat:'materiales', emoji:'🔩', icon:'🔩', name:'Bloques de Hierro (x64)',   img:'imagen/phantom.gif', quality:'epic',   price:128, stock:10, restock:'7d',  badge:null,  desc:'Algunos bloques de hierro.', tags:[{t:'keys',l:'BLOQUES HIERRO'}], give:{type:'item',itemName:'Bloques Hierro x64'}, onetime:false },
  { id:'f6', cat:'materiales', emoji:'🔩', icon:'🔩', name:'Bloques Hierro x4 (x256)',  img:'imagen/phantom.gif', quality:'legend', price:128, stock:1,  restock:null,  badge:'hot', desc:'Oferta limitada: 4 stacks de una.', tags:[{t:'keys',l:'BLOQUES x4'},{t:'free',l:'OFERTA'}], give:{type:'item',itemName:'Bloques Hierro x256'}, onetime:false },
  { id:'f7', cat:'materiales', emoji:'💎', icon:'💎', name:'Bloques Diamante x4 (x256)', img:'imagen/phantom.gif', quality:'legend', price:128, stock:1,  restock:null,  badge:'hot', desc:'¡Brillemos con diamantes!', tags:[{t:'keys',l:'DIAMANTES x4'}], give:{type:'item',itemName:'Bloques Diamante x256'}, onetime:false },
  { id:'f8', cat:'materiales', emoji:'💚', icon:'💚', name:'Esmeralda x1',               img:'imagen/phantom.gif', quality:'legend', price:1,   stock:1,  restock:null,  badge:'sale', desc:'Sand Brill te desea una Gran Navidad, pero es tan tacaño que solo da 1.', tags:[{t:'bonus',l:'SAND BRILL'}], give:{type:'item',itemName:'Esmeralda x1'}, onetime:true },

  /* ── HISTORIA ── */
  { id:'l1', cat:'historia', emoji:'📚', icon:'📚', name:'Libro: "Bosque de Jade"',          img:'img/bookmine.jpg', quality:'rare',   price:256, stock:1, restock:null, badge:null,    desc:'Leyendas del bosque de jade, donde los árboles recuerdan.', tags:[{t:'keys',l:'LORE'}], give:{type:'item',itemName:'Libro Bosque de Jade'}, onetime:true },
  { id:'l2', cat:'historia', emoji:'📚', icon:'📚', name:'Libro: "La Negra Noche"',          img:'img/bookmine.jpg', quality:'epic',   price:256, stock:1, restock:null, badge:null,    desc:'Símbolos y runas de la noche más oscura.', tags:[{t:'keys',l:'LORE'}], give:{type:'item',itemName:'Libro La Negra Noche'}, onetime:true },
  { id:'l3', cat:'historia', emoji:'📚', icon:'📚', name:'Libro: "El lado ███ de S██ B███"', img:'img/bookcat.gif',  quality:'legend', price:384, stock:1, restock:null, badge:'limited', desc:'Contenido misterioso. ¿Qué secretos esconde?', tags:[{t:'keys',l:'SECRETO'}], give:{type:'item',itemName:'Libro Secreto'}, onetime:true },
  { id:'l4', cat:'historia', emoji:'📖', icon:'📖', name:'Libro A1',                         img:'img/book.jpg',     quality:'epic',   price:128, stock:1, restock:null, badge:null,    desc:'Un libro de lore.', tags:[{t:'keys',l:'LIBRO'}], give:{type:'item',itemName:'Libro A1'}, onetime:true },
  { id:'l5', cat:'historia', emoji:'📖', icon:'📖', name:'Libro B2',                         img:'img/book.jpg',     quality:'epic',   price:128, stock:1, restock:null, badge:null,    desc:'Un libro de lore.', tags:[{t:'keys',l:'LIBRO'}], give:{type:'item',itemName:'Libro B2'}, onetime:true },

  /* ── LOTE DE MONEDAS ── */
  { id:'m1', cat:'monedas', emoji:'🪙', icon:'🪙', name:'Pegatina de 1 moneda',  img:'img/coin.jpg',      quality:'common', price:0,  stock:1,  restock:'24h', badge:'hot',  desc:'¡Gratis! Una monedita para comenzar.', tags:[{t:'free',l:'GRATIS'}], give:{type:'coins',amount:1}, onetime:false },
  { id:'m2', cat:'monedas', emoji:'🪙', icon:'🪙', name:'Bolsita de 30 monedas', img:'img/coin.jpg',      quality:'rare',   price:15, stock:10, restock:'7d',  badge:null,   desc:'Para trueques y consumibles básicos.', tags:[{t:'keys',l:'30 COINS'}], give:{type:'coins',amount:30}, onetime:false },
  { id:'m3', cat:'monedas', emoji:'🪙', icon:'🪙', name:'Pack de 90 monedas',    img:'img/packcoin.jpg',  quality:'epic',   price:30, stock:10, restock:'7d',  badge:null,   desc:'Relación costo/beneficio equilibrada.', tags:[{t:'keys',l:'90 COINS'}], give:{type:'coins',amount:90}, onetime:false },
  { id:'m4', cat:'monedas', emoji:'🪙', icon:'🪙', name:'Lote de 120 monedas',   img:'img/stackcoin.jpg', quality:'legend', price:60, stock:10, restock:'30d', badge:'hot',  desc:'Ideal para temporadas completas.', tags:[{t:'keys',l:'120 COINS'}], give:{type:'coins',amount:120}, onetime:false },

  /* ── PACK DE MONEDAS (⟡ in-game currency) ── */
  { id:'c1', cat:'packs', emoji:'💰', icon:'💰', name:'Pack de 128⟡',  img:'img/coin.jpg',      quality:'common', price:64,  stock:999, restock:null, badge:null,   desc:'Para trueques y consumibles (2 stacks).', tags:[{t:'keys',l:'128 ⟡'}], give:{type:'ingame_coins',amount:128}, onetime:false },
  { id:'c2', cat:'packs', emoji:'💰', icon:'💰', name:'Pack de 256⟡',  img:'img/packcoin.jpg',  quality:'rare',   price:128, stock:999, restock:null, badge:null,   desc:'Equilibrado (4 stacks).', tags:[{t:'keys',l:'256 ⟡'}], give:{type:'ingame_coins',amount:256}, onetime:false },
  { id:'c3', cat:'packs', emoji:'💰', icon:'💰', name:'Pack de 384⟡',  img:'img/stackcoin.jpg', quality:'epic',   price:256, stock:999, restock:null, badge:'hot',  desc:'Para temporadas completas (6 stacks).', tags:[{t:'keys',l:'384 ⟡'}], give:{type:'ingame_coins',amount:384}, onetime:false },

  /* ── PASES DE EVENTO ── */
  { id:'e1', cat:'eventos', emoji:'🎪', icon:'🎪', name:'Pase en la Oscuridad', img:'img-pass/banhall.jpg',   quality:'legend', price:256, stock:1, restock:'30d', startsAt:'2026-10-20', expiresAt:'2026-11-01', badge:'limited', desc:'Algo se acerca en las sombras...', tags:[{t:'event',l:'EVENTO HALLOWEEN'}], give:{type:'pass',passId:'event_halloween'}, onetime:false },
  { id:'e2', cat:'eventos', emoji:'🐱', icon:'🐱', name:'Pase Gatos 😺✨',      img:'img-pass/catsparty.jpg', quality:'legend', price:256, stock:1, restock:'30d', startsAt:'2026-08-01', expiresAt:'2026-08-30', badge:'new',     desc:'Gatos y más gatos... ¿Gatos?', tags:[{t:'event',l:'DÍA DEL GATO'}], give:{type:'pass',passId:'event_cats'}, onetime:false },

  /* ── ESPECIALES ── */
  { id:'sp_welcome',  cat:'especiales', emoji:'🌙', icon:'🌙', name:'Pack Bienvenida',   img:null, quality:'common', price:0, stock:1, restock:null, badge:'hot',    desc:'Regalo de bienvenida para nuevos jugadores. ¡Solo una vez!', tags:[{t:'tickets',l:'5 TKT CLÁSICA'},{t:'keys',l:'2 LLAVES'},{t:'free',l:'BIENVENIDA'}], give:{type:'multi',actions:[{type:'gacha_tickets',wheel:'classic',count:5},{type:'inventory',item:'keys',count:2}]}, onetime:true },
  { id:'sp_event_pass',cat:'especiales', emoji:'🎫', icon:'🎫', name:'Pase de Evento 7d', img:null, quality:'epic',  price:0, stock:5, restock:'7d', badge:'hot',    desc:'Acceso a misiones dobles y drops especiales por 7 días.', tags:[{t:'tickets',l:'5 TKT'},{t:'free',l:'PASE x7 DÍAS'}], give:{type:'inventory',item:'tickets',count:5}, onetime:false },
  { id:'sp_vip_day',  cat:'especiales', emoji:'👑', icon:'👑', name:'Pase VIP Diario',   img:null, quality:'epic',  price:0, stock:1, restock:'24h', badge:'new',   desc:'Tickets de bonificación diaria. ¡Reclámalo cada día!', tags:[{t:'tickets',l:'3 TKT CLÁSICA'},{t:'free',l:'DIARIO'}], give:{type:'gacha_tickets',wheel:'classic',count:3}, daily:true, onetime:false },
  { id:'sp_bf_pack',  cat:'especiales', emoji:'🖤', icon:'🖤', name:'Pack Black Friday', img:null, quality:'legend', price:0, stock:1, restock:null, badge:'limited', desc:'Solo con cupón BLACK2026. Pack épico limitado.', tags:[{t:'tickets',l:'25 TKT'},{t:'super',l:'1 SUPER KEY'},{t:'keys',l:'5 LLAVES'}], give:{type:'multi',actions:[{type:'gacha_tickets',wheel:'classic',count:25},{type:'inventory',item:'superstar_keys',count:1},{type:'inventory',item:'keys',count:5}]}, couponRequired:'BLACK2026', onetime:true },
  { id:'sp_all_access',cat:'especiales', emoji:'🔓', icon:'🔓', name:'All Access Pass', img:null, quality:'legend', price:0, stock:2, restock:null, badge:'limited', desc:'Tickets para TODAS las ruletas activas.', tags:[{t:'tickets',l:'5x RULETA'},{t:'bonus',l:'ALL WHEELS'}], give:{type:'multi',actions:[{type:'gacha_tickets',wheel:'classic',count:5},{type:'gacha_tickets',wheel:'dark_moon',count:5},{type:'gacha_tickets',wheel:'spring',count:5},{type:'gacha_tickets',wheel:'storm',count:5},{type:'gacha_tickets',wheel:'cyber',count:5},{type:'gacha_tickets',wheel:'abyss',count:5}]}, couponRequired:'ALLACCESS', onetime:false },
];

/* ══════════════════════════════════════
   CUPONES DE TEMPORADA
══════════════════════════════════════ */
const SEASONAL_COUPONS = [
  { id:'sv_2026',      name:'💗 San Valentín', emoji:'💗', style:'valentine', discount:30, startDate:'2026-02-10', endDate:'2026-02-15', maxUses:5, resetDate:'2026-02-13' },
  { id:'newyear_2026', name:'🎆 Año Nuevo',    emoji:'🎆', style:'newyear',   discount:25, startDate:'2025-12-31', endDate:'2026-01-06', maxUses:3, resetDate:'2026-01-01' },
  { id:'halloween_26', name:'🎃 Halloween',    emoji:'🎃', style:'halloween', discount:40, startDate:'2026-10-25', endDate:'2026-11-01', maxUses:3, resetDate:'2026-10-31' },
  { id:'navidad_2026', name:'🎄 Navidad',      emoji:'🎄', style:'christmas', discount:35, startDate:'2026-12-01', endDate:'2026-12-30', maxUses:5, resetDate:'2026-12-25' },
];

const BLACK_FRIDAY_COUPON = {
  id:'blackfriday', name:'BLACK FRIDAY', emoji:'🖤', style:'blackfriday', discount:'random', unlimited:true,
  periods:[
    { startDate:'2026-03-02', endDate:'2026-03-03' },
    { startDate:'2026-11-27', endDate:'2026-11-30' },
  ],
};

const ALL_REG_COUPONS = [10,15,20,25,30,40,50,60,70,80,90,100];

/* ══════════════════════════════════════
   NPC MENSAJES
══════════════════════════════════════ */
const NPC_MSGS = [
  '¡Tengo los mejores artículos del portal!',
  '¡Los pases de temporada valen la pena!',
  '¡Código BLACK2026 para el Black Friday!',
  'Las llaves superestrella son rarísimas...',
  '¿Tickets o llaves? Yo tengo todo 😊',
  '¡Aprovecha las ofertas de Sand Brill!',
  'El All Access Pass vale la pena',
  '¡Los stocks limitados vuelan!',
  'Sand Brill tiene buenas rebajas hoy...',
  '¡Los fines de semana hay Flash Sale!',
];

/* ══════════════════════════════════════
   FLASH SALE — fines de semana o aleatorio
══════════════════════════════════════ */
function isWeekend() {
  const d = new Date().getDay();
  return d === 0 || d === 6;
}

let flashDiscount = 0;
let flashExpiry   = 0;

function initFlashSale() {
  const savedDisc = lsGet(LS.flashDisc, 0);
  const savedExp  = lsGet(LS.flashExp,  0);
  const now = Date.now();

  if (savedDisc && savedExp > now) {
    flashDiscount = savedDisc;
    flashExpiry   = savedExp;
  } else if (isWeekend()) {
    // Generar descuento aleatorio para el fin de semana
    flashDiscount = [10,15,20,25,30,35,40][Math.floor(Math.random()*7)];
    // Expira a medianoche del domingo
    const end = new Date();
    end.setHours(23,59,59,999);
    if (end.getDay() === 6) end.setDate(end.getDate()+1);
    flashExpiry = end.getTime();
    lsSet(LS.flashDisc, flashDiscount);
    lsSet(LS.flashExp,  flashExpiry);
  } else {
    flashDiscount = 0;
    flashExpiry   = 0;
  }
  renderFlashBanner();
}

function renderFlashBanner() {
  const badge = $('#flashDiscountBadge');
  const text  = $('#flashSaleText');
  if (flashDiscount && flashExpiry > Date.now()) {
    if (badge) { badge.textContent = `-${flashDiscount}%`; badge.style.display=''; }
    if (text)  text.textContent = `¡${flashDiscount}% de descuento en TODO el fin de semana!`;
  } else {
    if (badge) badge.style.display = 'none';
    if (text)  text.textContent = '¡Ofertas por tiempo limitado! Vuelve el fin de semana.';
  }
}

function updateFlashTimer() {
  const el = $('#flashTimer');
  if (!el) return;
  const now = new Date();
  let target;
  if (flashExpiry > Date.now()) {
    target = flashExpiry;
  } else {
    // Siguiente medianoche
    target = new Date(now.getFullYear(),now.getMonth(),now.getDate()+1,0,0,0).getTime();
  }
  const diff = Math.max(0, Math.floor((target - Date.now())/1000));
  const h = String(Math.floor(diff/3600)).padStart(2,'0');
  const m = String(Math.floor((diff%3600)/60)).padStart(2,'0');
  const s = String(diff%60).padStart(2,'0');
  el.textContent = `${h}:${m}:${s}`;
}

/* ══════════════════════════════════════
   SAND BRILL DEALS
══════════════════════════════════════ */
let sbDeals = [];
let sbExpiry = 0;

function initSandBrill() {
  const now = Date.now();
  const savedExpiry = lsGet(LS.sbExpiry, 0);
  const savedDeals  = lsGet(LS.sbDeals,  []);

  if (savedExpiry > now && savedDeals.length) {
    sbDeals  = savedDeals;
    sbExpiry = savedExpiry;
  } else {
    refreshSandBrill();
  }
  renderSandBrill();
}

function refreshSandBrill() {
  // Seleccionar 4-6 productos al azar con precio > 0
  const eligible = PRODUCTS.filter(p => p.price > 0 && p.stock > 0);
  const shuffled = eligible.sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random()*3)+4);
  sbDeals = shuffled.map(p => ({
    id: p.id,
    discount: Math.floor(Math.random()*51)+10, // 10-60%
  }));
  // Expira en 2 horas
  sbExpiry = Date.now() + 2 * 60 * 60 * 1000;
  lsSet(LS.sbDeals,  sbDeals);
  lsSet(LS.sbExpiry, sbExpiry);
}

function renderSandBrill() {
  const section = $('#sandbrill-section');
  if (!section) return;

  if (!sbDeals.length) { section.style.display = 'none'; return; }
  section.style.display = '';
  section.classList.add('visible');

  const grid = $('#sbDeals');
  if (!grid) return;

  grid.innerHTML = sbDeals.map(deal => {
    const p = PRODUCTS.find(x => x.id === deal.id);
    if (!p) return '';
    const st    = getStock(p);
    const orig  = p.price;
    const final = Math.max(0, Math.round(orig - orig * deal.discount / 100));
    const claimed = isOneTimeClaimed(p);

    // Aplicar también el cupón activo
    const withCoupon = currentCoupon
      ? Math.max(0, Math.round(final - final * currentCoupon / 100))
      : final;

    return `<div class="sb-card reveal" data-id="${p.id}" data-sb-discount="${deal.discount}">
      <div class="sb-card-discount">-${deal.discount}%</div>
      <span class="sb-card-img">${p.emoji}</span>
      <div class="sb-card-name">${p.name}</div>
      <div class="sb-card-prices">
        <span class="sb-price-old">⟡${orig}</span>
        <span class="sb-price-new">⟡${withCoupon}</span>
      </div>
      <button class="sb-btn" data-id="${p.id}" ${(st<=0||claimed) ? 'disabled' : ''}>
        ${claimed ? '✓ RECLAMADO' : st<=0 ? 'AGOTADO' : 'OBTENER'}
      </button>
    </div>`;
  }).join('');

  grid.querySelectorAll('.sb-btn:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => {
      const deal = sbDeals.find(d => d.id === btn.dataset.id);
      const p    = PRODUCTS.find(x => x.id === btn.dataset.id);
      if (!p || !deal) return;
      showConfirmModal(p, deal.discount);
    });
  });

  requestAnimationFrame(() => {
    grid.querySelectorAll('.reveal').forEach((el,i) => setTimeout(() => el.classList.add('visible'),i*60));
  });
}

function updateSbTimer() {
  const el = $('#sbTimer');
  if (!el) return;
  const diff = Math.max(0, Math.floor((sbExpiry - Date.now())/1000));
  if (diff === 0) {
    refreshSandBrill();
    renderSandBrill();
    renderProducts();
    return;
  }
  const m = String(Math.floor(diff/60)).padStart(2,'0');
  const s = String(diff%60).padStart(2,'0');
  el.textContent = `${m}:${s}`;
}

/* ══════════════════════════════════════
   CUPONES
══════════════════════════════════════ */
let currentCoupon   = 0;
let currentScId     = localStorage.getItem('mv_sc_active') || null;
let bfCurrentDisc   = null;

function todayStr() { return new Date().toISOString().slice(0,10); }
function isDateInRange(s,e) { const t=todayStr(); return t>=s&&t<=e; }
function isScActive(sc) {
  if (sc.periods) return sc.periods.some(p=>isDateInRange(p.startDate,p.endDate));
  return isDateInRange(sc.startDate, sc.endDate);
}

function getScState(sc) { try{const r=localStorage.getItem(`mv_sc_${sc.id}`);return r?JSON.parse(r):null;}catch{return null;} }
function setScState(sc, state) { localStorage.setItem(`mv_sc_${sc.id}`, JSON.stringify(state)); }
function syncScState(sc) {
  const today = todayStr();
  let state = getScState(sc);
  if (!state) { state={usesLeft:sc.maxUses,lastReset:today}; setScState(sc,state); return state; }
  if (sc.resetDate) {
    const lastReset = state.lastReset||'';
    if (today>=sc.resetDate&&lastReset<sc.resetDate) { state.usesLeft=sc.maxUses; state.lastReset=today; setScState(sc,state); }
  }
  return state;
}
function getScUsesLeft(sc) { return syncScState(sc).usesLeft; }
function decrementScUses(sc) {
  const state=syncScState(sc);
  if(state.usesLeft>0){state.usesLeft-=1;setScState(sc,state);}
}

function rollBFDisc() { bfCurrentDisc = Math.floor(Math.random()*21)+10; return bfCurrentDisc; }

function getCouponCooldown(pct) {
  try{const v=JSON.parse(localStorage.getItem('mv_coupon_state')||'{}');return Number(v[String(pct)]||0);}catch{return 0;}
}
function setCouponCooldown(pct,ts) {
  try{const v=JSON.parse(localStorage.getItem('mv_coupon_state')||'{}');v[String(pct)]=ts||0;localStorage.setItem('mv_coupon_state',JSON.stringify(v));}catch{}
}
function nextMidnight() { const d=new Date();d.setDate(d.getDate()+1);d.setHours(0,0,0,0);return d.getTime(); }

currentCoupon = Number(localStorage.getItem('mv_current_coupon')||0);
function saveCurrentCoupon() { localStorage.setItem('mv_current_coupon', String(currentCoupon)); }

function validateCurrentCoupon() {
  if (!currentScId) return;
  const allSCs = [...SEASONAL_COUPONS, BLACK_FRIDAY_COUPON];
  const sc = allSCs.find(s=>s.id===currentScId);
  if (!sc||!isScActive(sc)) {
    currentScId=null;localStorage.removeItem('mv_sc_active');
    bfCurrentDisc=null;currentCoupon=0;saveCurrentCoupon();
  } else if (sc.id===BLACK_FRIDAY_COUPON.id) {
    if (!bfCurrentDisc) { rollBFDisc(); currentCoupon=bfCurrentDisc; saveCurrentCoupon(); }
  }
}

function renderCouponUI() {
  const box = $('#couponList');
  if (!box) return;
  const nowTs = Date.now();
  let html = '';

  // Temporada activos
  const allSCs = [...SEASONAL_COUPONS, BLACK_FRIDAY_COUPON];
  const activeSCs = allSCs.filter(sc=>isScActive(sc));

  if (activeSCs.length) {
    activeSCs.forEach(sc => {
      const isSelected = currentScId === sc.id;
      if (sc.id === BLACK_FRIDAY_COUPON.id) {
        const discLabel = (isSelected && bfCurrentDisc) ? `🎲 ${bfCurrentDisc}% OFF` : '% Aleatorio';
        html += `<button class="coupon-card sc-blackfriday" data-sc-id="${sc.id}" data-active="${isSelected}">
          <span class="bf-title">${sc.name}</span>
          <span class="cd">${discLabel}</span><span class="cd" style="font-size:0.2rem;opacity:.6">∞ Sin límite</span>
        </button>`;
      } else {
        const usesLeft = getScUsesLeft(sc);
        const ex = usesLeft<=0;
        html += `<button class="coupon-card sc-${sc.style}${ex?' sc-exhausted':''}" data-sc-id="${sc.id}" data-active="${isSelected}" ${ex?'aria-disabled="true"':''}>
          <span style="font-weight:900;font-size:0.34rem">${sc.name}</span>
          <span class="cd" style="font-size:0.34rem">${sc.discount}% OFF</span>
          <span class="cd">${usesLeft}/${sc.maxUses} usos restantes</span>
        </button>`;
      }
    });
    html += '<div class="coupon-sep">── Cupones regulares ──</div>';
  }

  // Cupones regulares
  html += ALL_REG_COUPONS.map(c => {
    const cd = getCouponCooldown(c);
    const active = cd > nowTs;
    const selected = currentCoupon===c && !currentScId;
    if (active) {
      const diff = Math.max(0,Math.floor((cd-nowTs)/1000));
      const h=Math.floor(diff/3600),m=Math.floor((diff%3600)/60);
      return `<button class="coupon-card cc-regular" aria-disabled="true" data-percent="${c}">${c}%<span class="cd">↻ ${h}h${m}m</span></button>`;
    }
    return `<button class="coupon-card cc-regular" data-percent="${c}" data-active="${selected}">${c}% OFF${selected?'<span class="cd">✓ ACTIVO</span>':''}</button>`;
  }).join('');

  box.innerHTML = html;

  // Label activo
  const lbl = $('#couponActiveLbl');
  if (lbl) {
    if (currentCoupon && currentCoupon > 0) {
      lbl.textContent = `${currentCoupon}% DESC ACTIVO`;
      lbl.style.display = '';
    } else {
      lbl.style.display = 'none';
    }
  }

  // Listeners SC
  box.querySelectorAll('.sc-blackfriday,.sc-valentine,.sc-newyear,.sc-halloween,.sc-christmas').forEach(btn => {
    if (btn.getAttribute('aria-disabled')==='true') return;
    btn.addEventListener('click', () => {
      const scId = btn.dataset.scId;
      if (currentScId===scId) {
        currentScId=null;localStorage.removeItem('mv_sc_active');
        bfCurrentDisc=null;currentCoupon=0;saveCurrentCoupon();
        toast('🎟️ Cupón desactivado','info');
      } else {
        const sc=allSCs.find(s=>s.id===scId);if(!sc)return;
        currentScId=scId;localStorage.setItem('mv_sc_active',scId);
        if(sc.id===BLACK_FRIDAY_COUPON.id){
          const d=rollBFDisc();currentCoupon=d;toast(`🖤 BLACK FRIDAY activado — ${d}% OFF`,'success');
        } else {
          currentCoupon=sc.discount;toast(`${sc.emoji} Cupón activado — ${sc.discount}% OFF`,'success');
        }
        saveCurrentCoupon();
      }
      renderCouponUI();renderProducts();renderSandBrill();
    });
  });

  // Listeners regulares
  box.querySelectorAll('.cc-regular:not([aria-disabled="true"])').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const pct=Number(btn.dataset.percent);
      if(currentScId){currentScId=null;localStorage.removeItem('mv_sc_active');bfCurrentDisc=null;}
      currentCoupon=(currentCoupon===pct&&!currentScId)?0:pct;
      saveCurrentCoupon();renderCouponUI();renderProducts();renderSandBrill();
    });
  });
}

$('#couponClearBtn')?.addEventListener('click',()=>{
  currentCoupon=0;saveCurrentCoupon();
  currentScId=null;localStorage.removeItem('mv_sc_active');bfCurrentDisc=null;
  renderCouponUI();renderProducts();renderSandBrill();
  toast('Cupón desactivado','info');
});

/* ══════════════════════════════════════
   STOCK MANAGEMENT
══════════════════════════════════════ */
const RESTOCK_DAYS = {'24h':1,'7d':7,'30d':30};

function getStock(p) {
  const v = lsGet(LS.stocks,{});
  return v[p.id] != null ? Math.max(0,v[p.id]) : p.stock;
}
function setStock(p,v) {
  const stocks = lsGet(LS.stocks,{});
  stocks[p.id] = Math.max(0,v|0);
  lsSet(LS.stocks, stocks);
}
function getRestock(p) {
  const v = lsGet(LS.restocks,{});
  return v[p.id];
}
function setRestock(p,ts) {
  const restocks = lsGet(LS.restocks,{});
  restocks[p.id] = ts||null;
  lsSet(LS.restocks, restocks);
}
function calcNextRestock(p) {
  if(!p.restock) return null;
  const days=RESTOCK_DAYS[p.restock];if(!days) return null;
  const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()+days);
  return d.getTime();
}

function syncStocks() {
  PRODUCTS.forEach(p=>{
    if(lsGet(LS.stocks,{})[p.id]==null) setStock(p,p.stock);
    const rt = getRestock(p);
    if(rt && rt <= Date.now()) { setStock(p,p.stock); setRestock(p, calcNextRestock(p)); }
  });
}

/* ══════════════════════════════════════
   INVENTARIO
══════════════════════════════════════ */
function getInventory(){ return lsGet(LS.inventory,{tickets:0,keys:0,superstar_keys:0}); }
function setInventory(inv){
  lsSet(LS.inventory,inv);renderHUD();
  if(currentUID){ import('./database.js').then(({saveInventory})=>saveInventory(currentUID,inv).catch(()=>{})); }
  scheduleSync();
}
function getGachaTickets(id){ return Math.max(0,parseInt(localStorage.getItem(`mv_tickets_${id}`)||'0',10)); }
function addGachaTickets(id,count){
  const cur=getGachaTickets(id);
  localStorage.setItem(`mv_tickets_${id}`,String(cur+count));
  renderHUD();scheduleSync();
  if(window.addTickets) window.addTickets(id,0);
}
function addCalKey(type,amount){
  try{
    const k='mv_cal_keys';
    const keys=lsGet(k,{normal:0,pink:0,green:0,orange:0,cat:0,special:0,future:0});
    keys[type]=(keys[type]||0)+amount;
    lsSet(k,keys);
  }catch{}
}
function addSuperKey(keyId,amount){
  try{
    const k='mv_chest_keys_v1';
    const keys=lsGet(k,{});
    keys[keyId]=(keys[keyId]||0)+amount;
    lsSet(k,keys);
  }catch{}
}

function renderHUD(){
  const inv=getInventory();
  const totalTkts=['classic','dark_moon','spring','storm','cyber','abyss'].reduce((s,id)=>s+getGachaTickets(id),inv.tickets||0);
  const set=(id,v)=>{const el=document.getElementById(id);if(el&&el.querySelector('.his-val')){el.querySelector('.his-val').textContent=v;}else if(el){el.textContent=v;}};
  const hudSlot=(slot,v)=>{const el=$(slot);if(el){const s=el.querySelector('.his-val');if(s)s.textContent=v;}};
  hudSlot('#hudTicketsTotal',totalTkts);
  hudSlot('#hudKeys',inv.keys||0);
  hudSlot('#hudSuperKeys',inv.superstar_keys||0);
  const setId=(id,v)=>{const el=$(`#${id}`);if(el)el.textContent=v;};
  setId('heroTickets',totalTkts);
  setId('heroKeys',inv.keys||0);
  setId('heroSuperKeys',inv.superstar_keys||0);
}

/* ══════════════════════════════════════
   ONE-TIME / DAILY
══════════════════════════════════════ */
function getOneTime(){ return lsGet(LS.onetime,{}); }
function isOneTimeClaimed(product){
  const ot=getOneTime();
  if(product.onetime&&ot[product.id]) return true;
  if(product.daily){ return ot[`daily_${product.id}`]===new Date().toDateString(); }
  return false;
}
function markClaimed(product){
  const ot=getOneTime();
  if(product.onetime) ot[product.id]=Date.now();
  if(product.daily)   ot[`daily_${product.id}`]=new Date().toDateString();
  lsSet(LS.onetime,ot);
}

/* ══════════════════════════════════════
   DATES
══════════════════════════════════════ */
function parseDate(str){ if(!str)return null;const d=new Date(str.includes('T')?str:str+'T23:59:59');return isNaN(d)?null:d.getTime(); }
function parseDateStart(str){ if(!str)return null;const d=new Date(str.includes('T')?str:str+'T00:00:00');return isNaN(d)?null:d.getTime(); }

/* ══════════════════════════════════════
   EXECUTE GIVE
══════════════════════════════════════ */
function executeGive(give){
  if(!give)return;
  switch(give.type){
    case 'gacha_tickets': addGachaTickets(give.wheel,give.count); break;
    case 'inventory':     { const inv=getInventory();inv[give.item]=(inv[give.item]||0)+give.count;setInventory(inv); break; }
    case 'multi':         give.actions.forEach(a=>executeGive(a)); break;
    case 'pass':          activatePass(give.passId); break;
    case 'cal_key':       addCalKey(give.keyType, give.amount); break;
    case 'cal_key_pack':  Object.entries(give.keys).forEach(([t,a])=>addCalKey(t,a)); break;
    case 'super_key':     addSuperKey(give.keyId, give.amount); break;
    case 'super_key_pack':Object.entries(give.keys).forEach(([k,a])=>addSuperKey(k,a)); break;
    case 'coins':         break; // gestionado en-game
    case 'ingame_coins':  break;
    case 'item':          break;
  }
}

function activatePass(passId){
  try{
    const key=`mv_pass_${passId}`;
    const raw=localStorage.getItem(key);
    const state=raw?JSON.parse(raw):{};
    const tierOrder=['stone','iron','gold','emerald','diamond'];
    const currIdx=tierOrder.indexOf(state.tier||'stone');
    if(currIdx<1){state.tier='iron';state.shopBought=true;localStorage.setItem(key,JSON.stringify(state));}
    if(typeof window.onPassPurchasedFromShop==='function') window.onPassPurchasedFromShop(passId);
  }catch{}
}

function buildNoteStr(give){
  if(!give)return'';
  switch(give.type){
    case 'gacha_tickets':  return `+${give.count} tickets ${give.wheel}`;
    case 'inventory':      return `+${give.count} ${give.item.replace(/_/g,' ')}`;
    case 'multi':          return give.actions.map(a=>buildNoteStr(a)).join(' · ');
    case 'pass':           return `Pase activado (Tier Hierro)`;
    case 'cal_key':        return `+${give.amount} llave ${give.keyType}`;
    case 'cal_key_pack':   return 'Pack de llaves de calendario';
    case 'super_key':      return `+${give.amount} llave superestrella`;
    case 'super_key_pack': return 'Pack de llaves superestrella';
    case 'coins':          return `+${give.amount} monedas`;
    case 'ingame_coins':   return `+${give.amount} ⟡`;
    case 'item':           return give.itemName||'Ítem';
    default: return '';
  }
}

/* ══════════════════════════════════════
   PURCHASE FLOW
══════════════════════════════════════ */
function effectivePrice(product, extraDisc = 0) {
  const base = Number(product.price) || 0;
  let disc = currentCoupon || 0;
  if (flashDiscount && flashExpiry > Date.now()) disc = Math.max(disc, flashDiscount);
  disc = Math.max(disc, extraDisc);
  return { base, disc, final: Math.max(0, Math.round(base - base * disc / 100)) };
}

function giveReward(product, extraDisc = 0, skipModal = false) {
  if (product.couponRequired) {
    const code = prompt(`Este producto requiere un cupón. Ingresa tu código:`);
    if (!code || code.trim().toUpperCase() !== product.couponRequired) {
      toast('Cupón inválido o incorrecto','error'); return;
    }
  }
  if (isOneTimeClaimed(product)) {
    toast(product.daily ? 'Ya reclamaste esto hoy' : 'Ya reclamaste este ítem','error');
    return;
  }
  const st = getStock(product);
  if (st <= 0) { toast('Artículo agotado','error'); return; }

  // Verificar fechas
  const startMs = parseDateStart(product.startsAt);
  const expMs   = parseDate(product.expiresAt);
  if (startMs && startMs > Date.now()) { toast('Este artículo aún no está disponible','error'); return; }
  if (expMs   && expMs   < Date.now()) { toast('Este artículo ha caducado','error'); return; }

  setStock(product, st - 1);
  if (st - 1 <= 0 && product.restock) setRestock(product, calcNextRestock(product));

  executeGive(product.give);
  markClaimed(product);
  addPurchase(product, buildNoteStr(product.give));
  renderProducts();
  renderSandBrill();
  renderHUD();
  updateHistCount();

  // Cupón regular: poner en cooldown
  if (currentScId) {
    const allSCs=[...SEASONAL_COUPONS,BLACK_FRIDAY_COUPON];
    const sc=allSCs.find(s=>s.id===currentScId);
    if(sc&&sc.id!==BLACK_FRIDAY_COUPON.id){
      decrementScUses(sc);
      if(getScUsesLeft(sc)<=0){currentScId=null;localStorage.removeItem('mv_sc_active');currentCoupon=0;bfCurrentDisc=null;saveCurrentCoupon();toast('🎟️ Usos del cupón agotados','info');}
    } else if(sc&&sc.id===BLACK_FRIDAY_COUPON.id){ rollBFDisc();currentCoupon=bfCurrentDisc;saveCurrentCoupon(); }
    renderCouponUI();
  } else if(currentCoupon&&currentCoupon!==0){
    setCouponCooldown(currentCoupon, nextMidnight());currentCoupon=0;saveCurrentCoupon();renderCouponUI();
  }

  scheduleSync();
  if (!skipModal) showSuccessModal(product);
}

/* ══════════════════════════════════════
   HISTORIAL
══════════════════════════════════════ */
function getPurchases(){ return lsGet(LS.purchases,[]); }
function addPurchase(product, note=''){
  const hist=getPurchases();
  hist.unshift({id:product.id,name:product.name,icon:product.emoji||product.icon||'📦',note,date:new Date().toISOString()});
  if(hist.length>60)hist.pop();
  lsSet(LS.purchases,hist);
  renderHistory();
}
function renderHistory(){
  const list=$('#purchasesList');if(!list)return;
  const hist=getPurchases();
  if(!hist.length){list.innerHTML='<div class="empty-hist"><span>📭</span><p>SIN COMPRAS AÚN</p></div>';return;}
  list.innerHTML=hist.map(p=>`<div class="purchase-item">
    <span class="pi-icon">${p.icon||'📦'}</span>
    <div class="pi-info">
      <div class="pi-name">${p.name}</div>
      <div class="pi-detail">${p.note||''}</div>
    </div>
    <div class="pi-time">${timeAgo(p.date)}</div>
  </div>`).join('');
}
function updateHistCount(){
  const el=$('#histCount');if(!el)return;
  const count=getPurchases().length;
  el.textContent=count;el.style.display=count?'':'none';
}
function timeAgo(iso){
  const s=Math.floor((Date.now()-new Date(iso))/1000);
  if(s<60)return'ahora';if(s<3600)return`${Math.floor(s/60)}m`;
  if(s<86400)return`${Math.floor(s/3600)}h`;return`${Math.floor(s/86400)}d`;
}

/* ══════════════════════════════════════
   RENDER PRODUCTS
══════════════════════════════════════ */
let currentCategory = 'all';
let searchText = '';

function renderProducts(){
  const grid=$('#productsGrid');if(!grid)return;

  const nowTs = Date.now();
  const filtered = PRODUCTS.filter(p => {
    const catOk = currentCategory==='all'||p.cat===currentCategory;
    const q = (searchText||'').trim().toLowerCase();
    const txt = `${p.name} ${p.cat} ${p.desc} ${(p.tags||[]).map(t=>t.l).join(' ')}`.toLowerCase();
    return catOk && (!q || txt.includes(q));
  });

  if (!filtered.length) {
    grid.innerHTML=`<div class="products-empty"><div class="pe-ico">🔍</div><p>SIN RESULTADOS</p></div>`;
    return;
  }

  grid.innerHTML = filtered.map((product, idx) => {
    const st      = getStock(product);
    const claimed = isOneTimeClaimed(product);
    const startMs = parseDateStart(product.startsAt);
    const expMs   = parseDate(product.expiresAt);
    const isUpcoming = !!(startMs && startMs > nowTs);
    const isExpired  = !!(expMs   && expMs   < nowTs);
    const isOut      = st <= 0;
    const isDisabled = isOut || isUpcoming || isExpired || (claimed && !product.daily);

    const { base, disc, final } = effectivePrice(product);

    let priceHTML = '';
    if (product.price === 0 || base === 0) {
      priceHTML = `<span class="pc-price free-price">GRATIS</span>`;
    } else if (disc > 0) {
      priceHTML = `<span class="pc-price-old">⟡${base}</span><span class="pc-final-price">⟡${final}</span><span class="pc-discount">-${disc}%</span>`;
    } else if (product.couponRequired) {
      priceHTML = `<span class="pc-price code-price">🔑 CÓDIGO</span>`;
    } else {
      priceHTML = `<span class="pc-price">⟡${base}</span>`;
    }

    const tagsHTML = (product.tags||[]).map(t=>`<span class="pc-tag ${t.t}">${t.l}</span>`).join('');
    const badgeHTML = product.badge ? `<div class="pc-badge ${product.badge}">${product.badge.toUpperCase()}</div>` : '';

    // Overlay
    let overlay = '';
    if (isExpired) {
      overlay = `<div class="pc-out-overlay"><div class="pc-out-badge"><strong>⌛ CADUCADO</strong><span>Oferta finalizada</span></div></div>`;
    } else if (isUpcoming) {
      overlay = `<div class="pc-out-overlay" style="background:rgba(0,0,0,0.7)"><div class="pc-out-badge" style="border-color:#60a5fa"><strong style="color:#93c5fd">⏳ PRONTO</strong><span>Desde ${product.startsAt}</span></div></div>`;
    } else if (isOut) {
      overlay = `<div class="pc-out-overlay"><div class="pc-out-badge"><strong>AGOTADO</strong><span>${product.restock?'Restock automático':'Sin restock'}</span></div></div>`;
    }

    // Imagen o emoji
    const imgHTML = product.img
      ? `<div class="pc-img-wrap">
           <img src="${product.img}" alt="${product.name}" loading="lazy" onerror="this.style.display='none';this.parentElement.style.display='flex';this.parentElement.style.alignItems='center';this.parentElement.style.justifyContent='center';this.parentElement.innerHTML='<span style=font-size:3rem>${product.emoji||'📦'}</span>'"/>
           ${badgeHTML}
           ${overlay}
         </div>`
      : `<div class="pc-body" style="padding-top:20px">`;

    const hasImg = !!product.img;

    let btnText, btnClass;
    if (isExpired)     { btnText='⌛ CADUCADO'; btnClass=''; }
    else if(isUpcoming){ btnText='⏳ PRÓXIMAMENTE'; btnClass=''; }
    else if(isOut)     { btnText='AGOTADO'; btnClass=''; }
    else if(claimed && product.onetime){ btnText='✓ RECLAMADO'; btnClass='btn-purchased'; }
    else if(claimed && product.daily)  { btnText='✓ HOY RECLAMADO'; btnClass='btn-purchased'; }
    else if(product.couponRequired)    { btnText='🔑 RECLAMAR'; btnClass='btn-code'; }
    else               { btnText='RECLAMAR'; btnClass=''; }

    return `<div class="product-card reveal" data-id="${product.id}" data-rarity="${product.quality}" style="animation-delay:${idx*0.04}s">
      <div class="pc-band"></div>
      ${hasImg ? imgHTML : ''}
      <div class="pc-body" style="${!hasImg?'padding-top:20px':''}">
        ${!hasImg ? `<span class="pc-icon">${product.emoji||'📦'}</span>` : ''}
        ${!hasImg && product.badge ? `<div class="pc-badge ${product.badge}" style="position:absolute;top:28px;right:12px">${product.badge.toUpperCase()}</div>` : ''}
        ${!hasImg ? overlay : ''}
        <div class="pc-name">${product.name}</div>
        <div class="pc-desc">${product.desc}</div>
        <div class="pc-contents">${tagsHTML}</div>
      </div>
      <div class="pc-footer">
        <div class="pc-price-row">${priceHTML}</div>
        ${st <= 5 && st > 0 ? `<div class="pc-stock-info low-stock">⚠️ SOLO ${st} EN STOCK</div>` : ''}
        <button class="pc-btn ${btnClass}" data-id="${product.id}" ${isDisabled?'disabled':''}>
          ${btnText}
        </button>
      </div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.pc-btn:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = PRODUCTS.find(x=>x.id===btn.dataset.id);
      if(p) showConfirmModal(p);
    });
  });

  requestAnimationFrame(() => {
    grid.querySelectorAll('.reveal').forEach((el,i) => setTimeout(() => el.classList.add('visible'), i*30));
  });
}

/* ══════════════════════════════════════
   MODALES
══════════════════════════════════════ */
function openModal(html){ const m=$('#modal'),c=$('#modalContent');if(!m||!c)return;c.innerHTML=html;m.setAttribute('aria-hidden','false'); }
function closeModal(){ $('#modal')?.setAttribute('aria-hidden','true'); }

function showConfirmModal(product, extraDisc = 0) {
  if (isOneTimeClaimed(product) && !product.daily) { toast('Ya reclamaste este ítem','error'); return; }

  const { base, disc, final } = effectivePrice(product, extraDisc);
  const totalDisc = Math.max(disc, extraDisc);

  let priceSection = '';
  if (base === 0) {
    priceSection = `<div class="buy-modal-price-row"><span class="bmp-free">✨ GRATIS ✨</span></div>`;
  } else if (totalDisc > 0) {
    priceSection = `<div class="buy-modal-price-row"><span class="bmp-original">⟡${base}</span><span class="bmp-final">⟡${final}</span><span class="pc-discount">-${totalDisc}%</span></div>`;
  } else {
    priceSection = `<div class="buy-modal-price-row"><span class="bmp-final">⟡${base}</span></div>`;
  }

  const noteText = product.couponRequired
    ? `<p class="buy-modal-note">🔑 Requiere cupón: <b>${product.couponRequired}</b></p>`
    : product.onetime ? `<p class="buy-modal-note">⚠️ Solo puedes reclamar esto <b>UNA VEZ</b></p>`
    : product.daily   ? `<p class="buy-modal-note">📅 Disponible una vez al día</p>` : '';

  openModal(`
    <span class="buy-modal-icon">${product.emoji||product.icon||'📦'}</span>
    <div class="buy-modal-name">${product.name}</div>
    <div class="buy-modal-desc">${product.desc}</div>
    ${priceSection}
    <div class="buy-modal-rewards"><div class="bmr-row"><span class="bmr-ico">${product.emoji||'📦'}</span><span class="bmr-txt">${buildNoteStr(product.give)||product.name}</span><span class="bmr-val">+1</span></div></div>
    ${noteText}
    <div class="buy-modal-actions">
      <button class="btn-pixel btn-ghost" onclick="document.getElementById('modal').setAttribute('aria-hidden','true')">CANCELAR</button>
      <button class="btn-pixel btn-gold pulse" id="btnConfirmBuy">✓ CONFIRMAR</button>
    </div>`);

  setTimeout(() => {
    $('#btnConfirmBuy')?.addEventListener('click', () => {
      closeModal();
      giveReward(product, extraDisc, true);
      showSuccessModal(product);
    });
  }, 50);
}

function showSuccessModal(product) {
  openModal(`
    <div style="text-align:center;padding:10px 0">
      <span style="font-size:4rem;display:block;margin-bottom:14px;filter:drop-shadow(0 0 18px var(--a))">${product.emoji||product.icon||'📦'}</span>
      <h2>¡RECOMPENSA OBTENIDA!</h2>
      <div style="font-family:var(--font-pixel);font-size:0.4rem;color:var(--text);margin-bottom:16px;line-height:1.8">${product.name}</div>
      <div class="buy-modal-rewards"><div class="bmr-row"><span class="bmr-ico">${product.emoji||'📦'}</span><span class="bmr-txt">${buildNoteStr(product.give)||product.name}</span></div></div>
      <button class="btn-pixel btn-gold large" onclick="document.getElementById('modal').setAttribute('aria-hidden','true')" style="margin-top:16px">¡GENIAL!</button>
    </div>`);
}

/* ══════════════════════════════════════
   HISTORIAL PANEL
══════════════════════════════════════ */
function openHistoryPanel(){
  const panel=$('#historyPanel');const overlay=$('#historyOverlay');
  if(!panel)return;
  panel.setAttribute('aria-hidden','false');
  overlay?.classList.add('active');
  document.body.style.overflow='hidden';
}
function closeHistoryPanel(){
  const panel=$('#historyPanel');const overlay=$('#historyOverlay');
  panel?.setAttribute('aria-hidden','true');
  overlay?.classList.remove('active');
  document.body.style.overflow='';
}

$('#historyFabBtn')?.addEventListener('click',openHistoryPanel);
$('#historyClose')?.addEventListener('click',closeHistoryPanel);
$('#historyOverlay')?.addEventListener('click',closeHistoryPanel);
$('#btnClearHistory')?.addEventListener('click',()=>{
  if(!confirm('¿Limpiar todo el historial?'))return;
  lsSet(LS.purchases,[]);renderHistory();updateHistCount();
  toast('Historial limpiado','info');
});

/* ══════════════════════════════════════
   NPC
══════════════════════════════════════ */
function initNPC(){
  const d=$('#npc-dialog');if(!d)return;
  let i=0;
  function upd(){d.textContent=NPC_MSGS[i%NPC_MSGS.length];i++;}
  upd();setInterval(upd,8000);
}

/* ══════════════════════════════════════
   PARTÍCULAS
══════════════════════════════════════ */
function initCoins(){
  const canvas=$('#bgCoins');if(!canvas)return;
  canvas.width=window.innerWidth;canvas.height=window.innerHeight;
  const ctx=canvas.getContext('2d');
  const SYMS=['🪙','💰','✨','💛','⭐'];
  const coins=Array.from({length:25},()=>({x:Math.random()*canvas.width,y:Math.random()*canvas.height,size:Math.random()*10+8,speed:Math.random()*0.4+0.1,sym:SYMS[Math.floor(Math.random()*SYMS.length)],o:Math.random()*0.25+0.04}));
  (function draw(){ctx.clearRect(0,0,canvas.width,canvas.height);coins.forEach(c=>{ctx.globalAlpha=c.o;ctx.font=`${c.size}px serif`;ctx.fillText(c.sym,c.x,c.y);c.y-=c.speed;if(c.y<-20){c.y=canvas.height+10;c.x=Math.random()*canvas.width;}});requestAnimationFrame(draw);})();
  window.addEventListener('resize',()=>{canvas.width=window.innerWidth;canvas.height=window.innerHeight;});
}

/* ══════════════════════════════════════
   REVEAL
══════════════════════════════════════ */
function initReveal(){
  const obs=new IntersectionObserver(entries=>{
    entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}});
  },{threshold:0.08});
  document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
}

/* ══════════════════════════════════════
   TOAST / NAV
══════════════════════════════════════ */
function toast(msg,type='success'){
  const t=$('#toast');if(!t)return;
  t.textContent=`${msg}`;t.className=`toast show ${type}`;
  clearTimeout(t._tm);t._tm=setTimeout(()=>t.classList.remove('show'),3000);
}

function initNav(){
  const btn=$('#hamburger'),nav=$('#main-nav');
  if(btn&&nav)btn.addEventListener('click',()=>nav.classList.toggle('open'));
}

/* ══════════════════════════════════════
   BOOT
══════════════════════════════════════ */
function boot(){
  console.log('🛒 Moonveil Shop v3.0');
  syncStocks();
  initReveal();initNav();initCoins();initNPC();
  renderHUD();renderHistory();updateHistCount();

  // Flash sale
  initFlashSale();

  // Sand Brill
  initSandBrill();

  // Cupones
  validateCurrentCoupon();
  renderCouponUI();
  setInterval(renderCouponUI,30000);

  // Render productos
  renderProducts();

  // Flash timer
  setInterval(updateFlashTimer,1000);
  updateFlashTimer();

  // Sand Brill timer
  setInterval(updateSbTimer,1000);

  // Categorías
  $$('.cat-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      $$('.cat-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory=btn.dataset.cat||'all';
      renderProducts();initReveal();
    });
  });

  // Búsqueda
  $('#searchInput')?.addEventListener('input',e=>{searchText=e.target.value||'';renderProducts();});
  $('#clearSearch')?.addEventListener('click',()=>{if($('#searchInput'))$('#searchInput').value='';searchText='';renderProducts();});

  // Modal
  $('#modalClose')?.addEventListener('click',closeModal);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();closeHistoryPanel();}});

  // Firebase auth
  onAuthChange(async user=>{
    if(!user)return;
    currentUID=user.uid;
    await loadFromFirebase(user.uid);
    renderHUD();renderHistory();updateHistCount();
    console.log('✅ Shop Firebase OK:',user.uid);
  });
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
else boot();