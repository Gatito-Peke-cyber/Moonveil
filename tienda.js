/**
 * tienda.js — Moonveil Portal Shop v1.0
 * ═══════════════════════════════════════════
 * ✅ Firebase Firestore sync (inventory + purchase history)
 * ✅ Tickets gacha compartidos con premios.js (mv_tickets_<id>)
 * ✅ Inventario del perfil sincronizado (llaves, super-llaves, tickets)
 * ✅ Sistema de cupones / códigos de descuento
 * ✅ Flash sale con countdown real
 * ✅ Historial de compras persistente
 * ✅ Categorías y filtro
 * ✅ NPC mercader con mensajes dinámicos
 * ✅ Sin monedas: todo es gratuito o por eventos/recompensas
 */

'use strict';

import { db }           from './firebase.js';
import { onAuthChange }  from './auth.js';
import {
  doc, getDoc, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";
import { saveInventory } from './database.js';

/* ══════════════════════════════════════
   HELPERS
══════════════════════════════════════ */
const $  = s => document.querySelector(s);
const wait = ms => new Promise(r => setTimeout(r, ms));

const LS = {
  inventory:  'mv_inventory',
  purchases:  'mv_shop_purchases',
  coupons:    'mv_shop_coupons',
  onetime:    'mv_shop_onetime',
};
function lsGet(k,fb=null){ try{const v=localStorage.getItem(k);return v!==null?JSON.parse(v):fb;}catch{return fb;} }
function lsSet(k,v){ try{localStorage.setItem(k,JSON.stringify(v));}catch{} }

/* ══════════════════════════════════════
   FIREBASE
══════════════════════════════════════ */
let currentUID=null, syncTimeout=null;
function scheduleSync(){ if(!currentUID)return; clearTimeout(syncTimeout); syncTimeout=setTimeout(doSync,2000); }
async function doSync(){
  if(!currentUID)return;
  try{
    const inv=lsGet(LS.inventory,{tickets:0,keys:0,superstar_keys:0});
    const hist=lsGet(LS.purchases,[]);
    // Tickets gacha por ruleta
    const gachaTickets={};
    ['classic','dark_moon','spring','storm','cyber','abyss'].forEach(id=>{
      gachaTickets[id]=parseInt(localStorage.getItem(`mv_tickets_${id}`)||'0',10);
    });
    await updateDoc(doc(db,'users',currentUID),{
      inventory:inv, shop_purchases:hist, gacha_tickets:gachaTickets,
      updatedAt:serverTimestamp()
    });
  }catch(e){ console.warn('[Shop] sync:',e); }
}
async function loadFromFirebase(uid){
  try{
    const snap=await getDoc(doc(db,'users',uid)); if(!snap.exists())return;
    const d=snap.data();
    // Inventario base
    if(d.inventory){
      const current=lsGet(LS.inventory,{tickets:0,keys:0,superstar_keys:0});
      const merged={tickets:Math.max(current.tickets||0,d.inventory.tickets||0),keys:Math.max(current.keys||0,d.inventory.keys||0),superstar_keys:Math.max(current.superstar_keys||0,d.inventory.superstar_keys||0)};
      lsSet(LS.inventory,merged);
    }
    // Tickets gacha
    if(d.gacha_tickets){
      Object.entries(d.gacha_tickets).forEach(([rid,count])=>{
        const lsKey=`mv_tickets_${rid}`;
        const local=parseInt(localStorage.getItem(lsKey)||'-1',10);
        localStorage.setItem(lsKey,String(Math.max(local<0?0:local,count||0)));
      });
    }
    // Historial
    if(d.shop_purchases&&Array.isArray(d.shop_purchases)){
      const local=lsGet(LS.purchases,[]);
      if(d.shop_purchases.length>local.length)lsSet(LS.purchases,d.shop_purchases);
    }
  }catch(e){ console.warn('[Shop] load:',e); }
}

/* ══════════════════════════════════════
   CATÁLOGO DE PRODUCTOS
   Sin monedas — todo se da como regalo/evento/código.
   El campo "price" es solo display ("GRATIS" / "EVENTO" / "CÓDIGO").
══════════════════════════════════════ */
const PRODUCTS=[
  /* ── TICKETS GACHA ── */
  {id:'t_classic_5',   cat:'tickets', icon:'💎', name:'Pack Clásico x5',     desc:'5 tickets para la Ruleta Clásica permanente.',
   tags:[{t:'tickets',l:'5 TKT CLÁSICA'}], price:'GRATIS', priceOld:null, discount:null,
   badge:'hot', rarity:'common',  give:{type:'gacha_tickets',wheel:'classic',count:5},    onetime:false},
  {id:'t_classic_10',  cat:'tickets', icon:'💎', name:'Pack Clásico x10',    desc:'10 tickets + bonus de velocidad.',
   tags:[{t:'tickets',l:'10 TKT CLÁSICA'},{t:'bonus',l:'BONUS x1'}], price:'GRATIS', priceOld:null, discount:null,
   badge:'sale', rarity:'common', give:{type:'gacha_tickets',wheel:'classic',count:10},   onetime:false},
  {id:'t_classic_30',  cat:'tickets', icon:'💎', name:'Pack Clásico x30',    desc:'Pack mega de 30 tickets clásicos.',
   tags:[{t:'tickets',l:'30 TKT CLÁSICA'},{t:'bonus',l:'BONUS x5'}], price:'EVENTO', priceOld:null, discount:null,
   badge:'limited', rarity:'epic', give:{type:'gacha_tickets',wheel:'classic',count:30},  onetime:false},
  {id:'t_darkmoon_5',  cat:'tickets', icon:'🌑', name:'Pack Luna Oscura x5', desc:'5 tickets para Luna Oscura (Mar-Abr).',
   tags:[{t:'tickets',l:'5 TKT LUNA'}], price:'GRATIS', priceOld:null, discount:null,
   badge:'new', rarity:'common',  give:{type:'gacha_tickets',wheel:'dark_moon',count:5},  onetime:false},
  {id:'t_darkmoon_15', cat:'tickets', icon:'🌑', name:'Pack Luna Oscura x15',desc:'15 tickets exclusivos de Luna Oscura.',
   tags:[{t:'tickets',l:'15 TKT LUNA'},{t:'bonus',l:'BONUS x3'}], price:'EVENTO', priceOld:null, discount:null,
   badge:'limited', rarity:'epic', give:{type:'gacha_tickets',wheel:'dark_moon',count:15},onetime:false},
  {id:'t_spring_5',   cat:'tickets', icon:'🌸', name:'Pack Primavera x5',   desc:'5 tickets para Primavera Mágica (May-Jun).',
   tags:[{t:'tickets',l:'5 TKT PRIMAVERA'}], price:'GRATIS', priceOld:null, discount:null,
   badge:'new', rarity:'common',  give:{type:'gacha_tickets',wheel:'spring',count:5},     onetime:false},
  {id:'t_storm_5',    cat:'tickets', icon:'⚡', name:'Pack Tormenta x5',    desc:'5 tickets para Tormenta Eléctrica (Ene-Mar).',
   tags:[{t:'tickets',l:'5 TKT TORMENTA'}], price:'GRATIS', priceOld:null, discount:null,
   badge:'sale', rarity:'common', give:{type:'gacha_tickets',wheel:'storm',count:5},      onetime:false},
  {id:'t_cyber_5',    cat:'tickets', icon:'🤖', name:'Pack Cyber x5',       desc:'5 tickets para Cyber Gacha (Jul-Ago).',
   tags:[{t:'tickets',l:'5 TKT CYBER'}], price:'GRATIS', priceOld:null, discount:null,
   badge:'new', rarity:'common',  give:{type:'gacha_tickets',wheel:'cyber',count:5},      onetime:false},
  {id:'t_abyss_5',    cat:'tickets', icon:'🕳️',name:'Pack Abismo x5',      desc:'5 tickets para el Abismo Eterno (Sep-Dic).',
   tags:[{t:'tickets',l:'5 TKT ABISMO'}], price:'GRATIS', priceOld:null, discount:null,
   badge:'new', rarity:'common',  give:{type:'gacha_tickets',wheel:'abyss',count:5},      onetime:false},

  /* ── LLAVES ── */
  {id:'k_basic_3',    cat:'keys', icon:'🗝️', name:'Pack Llaves x3',        desc:'3 llaves de cofre básicas.',
   tags:[{t:'keys',l:'3 LLAVES'}], price:'GRATIS', priceOld:null, discount:null,
   badge:'hot', rarity:'common',  give:{type:'inventory',item:'keys',count:3},            onetime:false},
  {id:'k_basic_10',   cat:'keys', icon:'🗝️', name:'Pack Llaves x10',       desc:'10 llaves — abre más cofres.',
   tags:[{t:'keys',l:'10 LLAVES'},{t:'bonus',l:'+1 SUPER'}], price:'EVENTO', priceOld:null, discount:null,
   badge:'limited', rarity:'epic', give:{type:'inventory_multi',items:[{item:'keys',count:10},{item:'superstar_keys',count:1}]}, onetime:false},
  {id:'k_super_1',    cat:'keys', icon:'⭐', name:'Llave Superestrella',    desc:'1 llave premium para contenido exclusivo.',
   tags:[{t:'super',l:'1 SUPER KEY'}], price:'CÓDIGO', priceOld:null, discount:null,
   badge:'limited', rarity:'epic', give:{type:'inventory',item:'superstar_keys',count:1}, onetime:false},
  {id:'k_super_3',    cat:'keys', icon:'⭐', name:'Pack Super x3',          desc:'3 llaves superestrellas de golpe.',
   tags:[{t:'super',l:'3 SUPER KEYS'},{t:'bonus',l:'BONUS RARO'}], price:'EVENTO', priceOld:null, discount:null,
   badge:null, rarity:'legend', give:{type:'inventory',item:'superstar_keys',count:3},    onetime:false},

  /* ── PACKS COMBINADOS ── */
  {id:'pack_starter', cat:'packs', icon:'📦', name:'Pack Iniciante',        desc:'Todo lo que necesitas para empezar: tickets clásicos + llaves.',
   tags:[{t:'tickets',l:'10 TKT CLÁSICA'},{t:'keys',l:'3 LLAVES'},{t:'free',l:'GRATIS!'}],
   price:'GRATIS', priceOld:null, discount:null,
   badge:'hot', rarity:'common',
   give:{type:'multi',actions:[{type:'gacha_tickets',wheel:'classic',count:10},{type:'inventory',item:'keys',count:3}]},
   onetime:true},
  {id:'pack_explorer',cat:'packs', icon:'🎒', name:'Pack Explorador',       desc:'Pack equilibrado para jugadores activos.',
   tags:[{t:'tickets',l:'15 TKT CLÁSICA'},{t:'keys',l:'5 LLAVES'},{t:'bonus',l:'+2 EVENTOS'}],
   price:'EVENTO', priceOld:null, discount:null,
   badge:'new', rarity:'epic',
   give:{type:'multi',actions:[{type:'gacha_tickets',wheel:'classic',count:15},{type:'inventory',item:'keys',count:5}]},
   onetime:false},
  {id:'pack_legend',  cat:'packs', icon:'🏆', name:'Pack Leyenda',          desc:'El pack definitivo para coleccionistas.',
   tags:[{t:'tickets',l:'30 TKT CLÁSICA'},{t:'super',l:'2 SUPER KEYS'},{t:'bonus',l:'BONUS ÉPICO'}],
   price:'CÓDIGO', priceOld:null, discount:null,
   badge:'limited', rarity:'legend',
   give:{type:'multi',actions:[{type:'gacha_tickets',wheel:'classic',count:30},{type:'inventory',item:'superstar_keys',count:2}]},
   onetime:false},

  /* ── ESPECIALES ── */
  {id:'sp_event_pass',cat:'special', icon:'🎫', name:'Pase de Evento',      desc:'Acceso a misiones dobles y drops especiales por 7 días.',
   tags:[{t:'free',l:'PASE x7 DÍAS'}], price:'GRATIS', priceOld:null, discount:null,
   badge:'hot', rarity:'epic',
   give:{type:'inventory',item:'tickets',count:5},
   onetime:false},
  {id:'sp_vip_day',   cat:'special', icon:'👑', name:'Pase VIP Diario',     desc:'Tickets de bonificación diaria. ¡Reclámalo cada día!',
   tags:[{t:'tickets',l:'3 TKT CLÁSICA'},{t:'free',l:'DIARIO'}], price:'GRATIS', priceOld:null, discount:null,
   badge:'new', rarity:'epic',
   give:{type:'gacha_tickets',wheel:'classic',count:3},
   daily:true, onetime:false},
  {id:'sp_bf_pack',   cat:'special', icon:'🖤', name:'Pack Black Friday',   desc:'Solo disponible con cupón BLACK2026. Pack épico limitado.',
   tags:[{t:'tickets',l:'25 TKT CLÁSICA'},{t:'super',l:'1 SUPER KEY'},{t:'keys',l:'5 LLAVES'}],
   price:'CÓDIGO', priceOld:null, discount:null,
   badge:'limited', rarity:'legend',
   give:{type:'multi',actions:[{type:'gacha_tickets',wheel:'classic',count:25},{type:'inventory',item:'superstar_keys',count:1},{type:'inventory',item:'keys',count:5}]},
   couponRequired:'BLACK2026', onetime:true},
  {id:'sp_welcome',   cat:'special', icon:'🌙', name:'Pack Bienvenida',     desc:'Regalo de bienvenida para nuevos jugadores. ¡Solo una vez!',
   tags:[{t:'tickets',l:'5 TKT CLÁSICA'},{t:'keys',l:'2 LLAVES'},{t:'free',l:'BIENVENIDA'}],
   price:'GRATIS', priceOld:null, discount:null,
   badge:'new', rarity:'common',
   give:{type:'multi',actions:[{type:'gacha_tickets',wheel:'classic',count:5},{type:'inventory',item:'keys',count:2}]},
   onetime:true},

  /* ── EVENTO ── */
  {id:'ev_luna_pack', cat:'event', icon:'🌑', name:'Bundle Luna Oscura',    desc:'Pack especial de la temporada de Luna Oscura.',
   tags:[{t:'tickets',l:'20 TKT LUNA'},{t:'bonus',l:'DOUBLE DROP'}],
   price:'EVENTO', priceOld:null, discount:null,
   badge:'sale', rarity:'epic',
   give:{type:'gacha_tickets',wheel:'dark_moon',count:20},
   onetime:false},
  {id:'ev_storm_last',cat:'event', icon:'⚡', name:'Último Rayo',           desc:'¡Tormenta termina pronto! Pack de despedida.',
   tags:[{t:'tickets',l:'15 TKT TORMENTA'},{t:'bonus',l:'LAST CHANCE'}],
   price:'EVENTO', priceOld:null, discount:null,
   badge:'sale', rarity:'epic',
   give:{type:'gacha_tickets',wheel:'storm',count:15},
   onetime:false},
  {id:'ev_all_access',cat:'event', icon:'🔓', name:'All Access Pass',       desc:'Tickets para TODAS las ruletas activas. El pack definitivo.',
   tags:[{t:'tickets',l:'5x RULETA'},{t:'bonus',l:'ALL WHEELS'}],
   price:'CÓDIGO', priceOld:null, discount:null,
   badge:'limited', rarity:'legend',
   give:{type:'multi',actions:[
     {type:'gacha_tickets',wheel:'classic',count:5},
     {type:'gacha_tickets',wheel:'dark_moon',count:5},
     {type:'gacha_tickets',wheel:'spring',count:5},
     {type:'gacha_tickets',wheel:'storm',count:5},
     {type:'gacha_tickets',wheel:'cyber',count:5},
     {type:'gacha_tickets',wheel:'abyss',count:5},
   ]},
   onetime:false},
];

/* ══════════════════════════════════════
   CUPONES VÁLIDOS
══════════════════════════════════════ */
const VALID_COUPONS={
  'BLACK2026':  { desc:'Pack Black Friday especial', productIds:['sp_bf_pack'] },
  'BIENVENIDA': { desc:'Pack de bienvenida extra',   productIds:['sp_welcome'] },
  'LUNA2026':   { desc:'Bundle Luna Oscura gratis',  productIds:['ev_luna_pack'] },
};

/* ══════════════════════════════════════
   MENSAJES NPC MERCADER
══════════════════════════════════════ */
const NPC_MSGS=[
  '¡Tengo los mejores tickets del portal!',
  'Pack Iniciante disponible GRATIS',
  '¡Código BLACK2026 para el Black Friday!',
  'Los legendarios son rarísimos...',
  '¿Tickets o llaves? Yo tengo todo',
  '¡Compra hoy, gira mañana!',
  'El All Access Pass vale la pena',
  '¡Los stocks limitados se agotan!',
];

/* ══════════════════════════════════════
   ESTADO GLOBAL
══════════════════════════════════════ */
let currentCategory='all', foxInterval=null, flashInterval=null;

/* ══════════════════════════════════════
   INVENTARIO
══════════════════════════════════════ */
function getInventory(){ return lsGet(LS.inventory,{tickets:0,keys:0,superstar_keys:0}); }
function setInventory(inv){
  lsSet(LS.inventory,inv);
  renderHUD();
  if(currentUID) saveInventory(currentUID,inv).catch(()=>{});
  scheduleSync();
}
function getGachaTickets(id){ return Math.max(0,parseInt(localStorage.getItem(`mv_tickets_${id}`)||'0',10)); }
function addGachaTickets(id,count){
  const cur=getGachaTickets(id);
  localStorage.setItem(`mv_tickets_${id}`,String(cur+count));
  renderHUD(); scheduleSync();
  // Notificar a premios.js si está cargado en la misma ventana
  if(window.addTickets) window.addTickets(id,0); // refresca UI sin sumar
}

function renderHUD(){
  const inv=getInventory();
  const totalTkts=['classic','dark_moon','spring','storm','cyber','abyss'].reduce((s,id)=>s+getGachaTickets(id),inv.tickets||0);
  const set=(id,v)=>{ const el=$(id); if(el)el.textContent=v; };
  // HUD header
  const s1=$('#hudTicketsTotal .his-val'); if(s1)s1.textContent=totalTkts;
  const s2=$('#hudKeys .his-val');         if(s2)s2.textContent=inv.keys||0;
  const s3=$('#hudSuperKeys .his-val');    if(s3)s3.textContent=inv.superstar_keys||0;
  // Hero stats
  set('#heroTickets', totalTkts);
  set('#heroKeys',    inv.keys||0);
  set('#heroSuperKeys',inv.superstar_keys||0);
}

/* ══════════════════════════════════════
   HISTORIAL
══════════════════════════════════════ */
function getPurchases(){ return lsGet(LS.purchases,[]); }
function addPurchase(product, note=''){
  const hist=getPurchases();
  hist.unshift({ id:product.id, name:product.name, icon:product.icon, note, date:new Date().toISOString() });
  if(hist.length>50)hist.pop();
  lsSet(LS.purchases,hist);
  renderHistory();
}
function renderHistory(){
  const list=$('#purchasesList'); if(!list)return;
  const hist=getPurchases();
  if(!hist.length){
    list.innerHTML='<div class="empty-hist"><span>📭</span><p>NO HAY COMPRAS AÚN</p></div>';
    return;
  }
  list.innerHTML=hist.map(p=>`
    <div class="purchase-item">
      <span class="pi-icon">${p.icon||'📦'}</span>
      <div class="pi-info">
        <div class="pi-name">${p.name}</div>
        <div class="pi-detail">${p.note||''}</div>
      </div>
      <div class="pi-time">${timeAgo(p.date)}</div>
    </div>`).join('');
}
function timeAgo(iso){
  const s=Math.floor((Date.now()-new Date(iso))/1000);
  if(s<60)return'hace un momento';
  if(s<3600)return`hace ${Math.floor(s/60)}m`;
  if(s<86400)return`hace ${Math.floor(s/3600)}h`;
  return`hace ${Math.floor(s/86400)}d`;
}

/* ══════════════════════════════════════
   ONE-TIME / DAILY CHECK
══════════════════════════════════════ */
function getOneTime(){ return lsGet(LS.onetime,{}); }
function isProductClaimed(product){
  const ot=getOneTime();
  if(product.onetime && ot[product.id]) return true;
  if(product.daily){
    const today=new Date().toDateString();
    return ot[`daily_${product.id}`]===today;
  }
  return false;
}
function markClaimed(product){
  const ot=getOneTime();
  if(product.onetime) ot[product.id]=Date.now();
  if(product.daily) ot[`daily_${product.id}`]=new Date().toDateString();
  lsSet(LS.onetime,ot);
}

/* ══════════════════════════════════════
   EJECUTAR COMPRA / RECOMPENSA
══════════════════════════════════════ */
function executeGive(give, productId){
  if(!give)return;
  if(give.type==='gacha_tickets'){
    addGachaTickets(give.wheel,give.count);
  } else if(give.type==='inventory'){
    const inv=getInventory();
    inv[give.item]=(inv[give.item]||0)+give.count;
    setInventory(inv);
  } else if(give.type==='inventory_multi'){
    const inv=getInventory();
    give.items.forEach(({item,count})=>{ inv[item]=(inv[item]||0)+count; });
    setInventory(inv);
  } else if(give.type==='multi'){
    give.actions.forEach(a=>executeGive(a,productId));
  }
}

function giveReward(product, skipModal=false){
  // Verificar cupón si lo requiere
  if(product.couponRequired){
    const code=prompt('Este producto requiere un cupón. Ingresa tu código:');
    if(!code||code.trim().toUpperCase()!==product.couponRequired){
      toast('Cupón inválido o incorrecto','❌','error'); return;
    }
  }
  if(isProductClaimed(product)){
    toast(product.daily?'Ya reclamaste esto hoy':'Ya reclamaste este ítem','⚠️','error');
    return;
  }
  executeGive(product.give, product.id);
  markClaimed(product);
  addPurchase(product, buildNoteStr(product.give));
  unlockShopTitle(product.id);
  renderProducts(); // actualizar estado claimed
  if(!skipModal) showSuccessModal(product);
  scheduleSync();
}

function buildNoteStr(give){
  if(!give)return'';
  if(give.type==='gacha_tickets')return`+${give.count} tickets ${give.wheel}`;
  if(give.type==='inventory')return`+${give.count} ${give.item.replace('_',' ')}`;
  if(give.type==='inventory_multi')return give.items.map(i=>`+${i.count} ${i.item}`).join(' · ');
  if(give.type==='multi')return give.actions.map(a=>buildNoteStr(a)).join(' · ');
  return'';
}

/* ══════════════════════════════════════
   RENDER PRODUCTOS
══════════════════════════════════════ */
function renderProducts(){
  const grid=$('#productsGrid'); if(!grid)return;
  const filtered=currentCategory==='all'?PRODUCTS:PRODUCTS.filter(p=>p.cat===currentCategory);

  grid.innerHTML=filtered.map(product=>{
    const claimed=isProductClaimed(product);
    const btnClass=claimed?'btn-purchased':'';
    const btnText=claimed?(product.daily?'✓ RECLAMADO HOY':'✓ RECLAMADO'):'RECLAMAR';
    const rarityClass=product.rarity||'common';

    const tagsHTML=product.tags.map(t=>`<span class="pc-tag ${t.t}">${t.l}</span>`).join('');
    const badgeHTML=product.badge?`<div class="pc-badge ${product.badge}">${product.badge.toUpperCase()}</div>`:'';
    const stockHTML=product.stock!==undefined?`<div class="pc-stock ${product.stock<5?'low':''}">${product.stock===0?'AGOTADO':`STOCK: ${product.stock}`}</div>`:'';
    const oldPriceHTML=product.priceOld?`<span class="pc-price-old">${product.priceOld}</span>`:'';
    const discountHTML=product.discount?`<span class="pc-discount">-${product.discount}%</span>`:'';
    const priceClass=product.price==='GRATIS'?'free-price':'';

    return `<div class="product-card reveal" data-id="${product.id}" data-rarity="${rarityClass}">
      <div class="pc-band"></div>
      ${badgeHTML}${stockHTML}
      <div class="pc-body">
        <span class="pc-icon">${product.icon}</span>
        <div class="pc-name">${product.name}</div>
        <div class="pc-desc">${product.desc}</div>
        <div class="pc-contents">${tagsHTML}</div>
      </div>
      <div class="pc-footer">
        <div class="pc-price-row">
          ${oldPriceHTML}
          <span class="pc-price ${priceClass}">${product.price}</span>
          ${discountHTML}
        </div>
        <button class="pc-btn ${btnClass}" data-id="${product.id}" ${claimed&&!product.daily?'disabled':''}>
          ${product.couponRequired?'🔑 '+btnText:btnText}
        </button>
      </div>
    </div>`;
  }).join('');

  // Listeners
  grid.querySelectorAll('.pc-btn:not([disabled])').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const p=PRODUCTS.find(x=>x.id===btn.dataset.id);
      if(p)showConfirmModal(p);
    });
  });

  // Reveal animation
  requestAnimationFrame(()=>{
    grid.querySelectorAll('.reveal').forEach((el,i)=>setTimeout(()=>el.classList.add('visible'),i*40));
  });
}

/* ══════════════════════════════════════
   MODALES
══════════════════════════════════════ */
function openModal(html){const m=$('#modal'),c=$('#modalContent');if(!m||!c)return;c.innerHTML=html;m.setAttribute('aria-hidden','false');}
function closeModal(){$('#modal')?.setAttribute('aria-hidden','true');}

function showConfirmModal(product){
  const claimed=isProductClaimed(product);
  if(claimed&&!product.daily){ toast('Ya reclamaste este ítem','⚠️','error'); return; }
  const rewardLines=getRewardLines(product.give).map(r=>`
    <div class="bmr-row">
      <span class="bmr-ico">${r.icon}</span>
      <span class="bmr-txt">${r.name}</span>
      <span class="bmr-val">+${r.count}</span>
    </div>`).join('');
  const noteText=product.couponRequired?`<p class="buy-modal-note">🔑 Este producto requiere el cupón <b>${product.couponRequired}</b></p>`:
    product.onetime?`<p class="buy-modal-note">⚠️ Solo puedes reclamar esto <b>UNA VEZ</b></p>`:
    product.daily?`<p class="buy-modal-note">📅 Disponible una vez al día</p>`:'';
  openModal(`
    <span class="buy-modal-icon">${product.icon}</span>
    <div class="buy-modal-name">${product.name}</div>
    <div class="buy-modal-desc">${product.desc}</div>
    <div class="buy-modal-rewards">${rewardLines}</div>
    ${noteText}
    <div class="buy-modal-actions">
      <button class="btn-pixel btn-ghost" onclick="document.getElementById('modal').setAttribute('aria-hidden','true')">CANCELAR</button>
      <button class="btn-pixel btn-gold pulse" id="btnConfirmBuy">✓ CONFIRMAR</button>
    </div>`);
  setTimeout(()=>{
    $('#btnConfirmBuy')?.addEventListener('click',()=>{ closeModal(); giveReward(product,true); showSuccessModal(product); });
  },50);
}

function showSuccessModal(product){
  const lines=getRewardLines(product.give).map(r=>`
    <div class="bmr-row">
      <span class="bmr-ico">${r.icon}</span>
      <span class="bmr-txt">${r.name}</span>
      <span class="bmr-val">+${r.count}</span>
    </div>`).join('');
  openModal(`
    <div style="text-align:center;padding:10px 0">
      <span style="font-size:4rem;display:block;margin-bottom:14px;filter:drop-shadow(0 0 18px var(--a))">${product.icon}</span>
      <h2>¡RECOMPENSA OBTENIDA!</h2>
      <div style="font-family:var(--font-pixel);font-size:0.4rem;color:var(--text);margin-bottom:16px;line-height:1.8">${product.name}</div>
      <div class="buy-modal-rewards">${lines}</div>
      <button class="btn-pixel btn-gold large" onclick="document.getElementById('modal').setAttribute('aria-hidden','true')" style="margin-top:8px">¡GENIAL!</button>
    </div>`);
  beep(880,0.08,0.06); setTimeout(()=>beep(1100,0.06,0.05),150);
}

function getRewardLines(give){
  const lines=[];
  if(!give)return lines;
  if(give.type==='gacha_tickets') lines.push({icon:'🎟️',name:`Tickets ${give.wheel.replace('_',' ')}`,count:give.count});
  else if(give.type==='inventory') lines.push({icon:give.item==='keys'?'🗝️':give.item==='superstar_keys'?'⭐':'🎫',name:give.item.replace(/_/g,' '),count:give.count});
  else if(give.type==='inventory_multi') give.items.forEach(({item,count})=>lines.push({icon:item==='keys'?'🗝️':'⭐',name:item.replace(/_/g,' '),count}));
  else if(give.type==='multi') give.actions.forEach(a=>lines.push(...getRewardLines(a)));
  return lines;
}

/* ══════════════════════════════════════
   FLASH SALE COUNTDOWN
   Termina a medianoche diaria
══════════════════════════════════════ */
function updateFlashTimer(){
  const now=new Date(), midnight=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1,0,0,0,0);
  const diff=Math.max(0,Math.floor((midnight-now)/1000));
  const h=String(Math.floor(diff/3600)).padStart(2,'0');
  const m=String(Math.floor((diff%3600)/60)).padStart(2,'0');
  const s=String(diff%60).padStart(2,'0');
  const el=$('#flashTimer'); if(el)el.textContent=`${h}:${m}:${s}`;
}

/* ══════════════════════════════════════
   PARTÍCULAS / MONEDAS
══════════════════════════════════════ */
function initCoins(){
  const canvas=$('#bgCoins'); if(!canvas)return;
  canvas.width=window.innerWidth; canvas.height=window.innerHeight;
  const ctx=canvas.getContext('2d');
  const SYMS=['🪙','💰','✨','💛','⭐'];
  const coins=Array.from({length:30},()=>({
    x:Math.random()*canvas.width, y:Math.random()*canvas.height,
    size:Math.random()*10+8, speed:Math.random()*0.4+0.1,
    sym:SYMS[Math.floor(Math.random()*SYMS.length)],
    o:Math.random()*0.3+0.05
  }));
  (function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    coins.forEach(c=>{
      ctx.globalAlpha=c.o; ctx.font=`${c.size}px serif`;
      ctx.fillText(c.sym,c.x,c.y);
      c.y-=c.speed; if(c.y<-20){c.y=canvas.height+10;c.x=Math.random()*canvas.width;}
    });
    requestAnimationFrame(draw);
  })();
  window.addEventListener('resize',()=>{canvas.width=window.innerWidth;canvas.height=window.innerHeight;});
}

/* ══════════════════════════════════════
   NPC
══════════════════════════════════════ */
function initNPC(){
  const d=$('#npc-dialog'); if(!d)return;
  let i=0;
  function upd(){ d.textContent=NPC_MSGS[i%NPC_MSGS.length]; i++; }
  upd(); foxInterval=setInterval(upd,8000);
}

/* ══════════════════════════════════════
   REVEAL
══════════════════════════════════════ */
function initReveal(){
  const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}});},{threshold:0.1});
  document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
}

/* ══════════════════════════════════════
   TOAST / BEEP
══════════════════════════════════════ */
function toast(msg,icon='✓',type='success'){
  const t=$('#toast'); if(!t)return;
  t.textContent=`${icon} ${msg}`; t.className=`toast show ${type}`;
  clearTimeout(t._tm); t._tm=setTimeout(()=>t.classList.remove('show'),3200);
}
let _actx=null;
function beep(freq=440,dur=0.05,vol=0.04){
  if(!_actx&&(window.AudioContext||window.webkitAudioContext))_actx=new(window.AudioContext||window.webkitAudioContext)();
  if(!_actx)return;
  const o=_actx.createOscillator(),g=_actx.createGain();
  o.type='sine';o.frequency.value=freq;g.gain.value=vol;
  o.connect(g);g.connect(_actx.destination);o.start();
  setTimeout(()=>o.stop(),dur*1000);
}

/* ══════════════════════════════════════
   NAV
══════════════════════════════════════ */
function initNav(){const btn=$('#hamburger'),nav=$('#main-nav');if(btn&&nav)btn.addEventListener('click',()=>nav.classList.toggle('open'));}

/* ══════════════════════════════════════
   BOOT
══════════════════════════════════════ */
function boot(){
  console.log('🛒 Moonveil Shop v1.0');
  initReveal(); initNav(); initCoins(); initNPC();
  renderHUD(); renderProducts(); renderHistory();
  flashInterval=setInterval(updateFlashTimer,1000); updateFlashTimer();

  // Categorías
  document.querySelectorAll('.cat-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('.cat-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory=btn.dataset.cat||'all';
      renderProducts();
      initReveal();
    });
  });

  // Modal cerrar
  $('#modalClose')?.addEventListener('click',closeModal);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});

  // Limpiar historial
  $('#btnClearHistory')?.addEventListener('click',()=>{
    if(!confirm('¿Limpiar todo el historial de compras?'))return;
    lsSet(LS.purchases,[]); renderHistory();
    toast('Historial limpiado','🗑️','info');
  });

  // Firebase auth
  onAuthChange(async user=>{
    if(!user)return;
    currentUID=user.uid;
    await loadFromFirebase(user.uid);
    renderHUD(); renderHistory();
    console.log('✅ Shop Firebase OK:',user.uid);
  });
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
else boot();

/* ══════════════════════════════════════
   DESBLOQUEAR TÍTULOS DE TIENDA
══════════════════════════════════════ */
function unlockShopTitle(productId){
  try{
    const SHOP_TITLE_TRIGGERS={
      // Al reclamar cualquier cosa por primera vez → título "PRIMER CLIENTE"
      _any: 'tl_first_buy',
      // Al reclamar el Black Friday
      'sp_bf_pack': 'tl_black_friday',
      // Al reclamar All Access
      'ev_all_access': 'tl_all_access',
    };
    const earned=lsGet('mv_titles_earned',['tl_novato']);
    const toAdd=[];
    if(SHOP_TITLE_TRIGGERS._any && !earned.includes(SHOP_TITLE_TRIGGERS._any))
      toAdd.push(SHOP_TITLE_TRIGGERS._any);
    if(SHOP_TITLE_TRIGGERS[productId] && !earned.includes(SHOP_TITLE_TRIGGERS[productId]))
      toAdd.push(SHOP_TITLE_TRIGGERS[productId]);
    if(toAdd.length){
      lsSet('mv_titles_earned',[...new Set([...earned,...toAdd])]);
      console.log('[Shop] Títulos desbloqueados:',toAdd);
    }
  }catch{}
}