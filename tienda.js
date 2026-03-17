'use strict';
/**
 * tienda.js — Moonveil Portal Shop v3.0
 * ✅ Firebase Firestore sync
 * ✅ Todas las secciones de la tienda v2 (pases, cofres, materiales, historia, monedas, eventos, pack coins, tickets, llaves cal, superestrellas)
 * ✅ Cupones de temporada + Black Friday + regulares
 * ✅ Flash Sale con countdown a medianoche
 * ✅ Sand Brill sale (fines de semana + ofertas al azar)
 * ✅ Historial en drawer lateral
 * ✅ Sistema de stock + restock por medianoche
 * ✅ Productos one-time y diarios
 * ✅ Precios grandes y visibles
 * ✅ Integración con perfil (inventario, tickets gacha, llaves calendario, llaves superestrella)
 * ✅ NPC zorrito con mensajes dinámicos
 */

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
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const wait = ms => new Promise(r => setTimeout(r, ms));
const clamp = (v,mn,mx) => Math.min(mx, Math.max(mn, v));

const LS = {
  inventory:  'mv_inventory',
  purchases:  'mv_shop_purchases',
  onetime:    'mv_shop_onetime',
  stock:      id => `mv_stock_${id}`,
  restock:    id => `mv_restock_${id}`,
  couponState:'mv_coupon_state',
  curCoupon:  'mv_current_coupon',
  scActive:   'mv_sc_active',
  sbState:    'mv_sb_state',
};
function lsGet(k,fb=null){try{const v=localStorage.getItem(k);return v!==null?JSON.parse(v):fb;}catch{return fb;}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{}}

/* ══════════════════════════════════════
   FIREBASE
══════════════════════════════════════ */
let currentUID=null, syncTimeout=null;
function scheduleSync(){if(!currentUID)return;clearTimeout(syncTimeout);syncTimeout=setTimeout(doSync,2500);}
async function doSync(){
  if(!currentUID)return;
  try{
    const inv=lsGet(LS.inventory,{tickets:0,keys:0,superstar_keys:0});
    const hist=lsGet(LS.purchases,[]);
    const gachaTickets={};
    ['classic','dark_moon','spring','storm','cyber','abyss'].forEach(id=>{
      gachaTickets[id]=parseInt(localStorage.getItem(`mv_tickets_${id}`)||'0',10);
    });
    await updateDoc(doc(db,'users',currentUID),{
      inventory:inv,shop_purchases:hist,gacha_tickets:gachaTickets,updatedAt:serverTimestamp()
    });
  }catch(e){console.warn('[Shop] sync:',e);}
}
async function loadFromFirebase(uid){
  try{
    const snap=await getDoc(doc(db,'users',uid));if(!snap.exists())return;
    const d=snap.data();
    if(d.inventory){
      const cur=lsGet(LS.inventory,{tickets:0,keys:0,superstar_keys:0});
      const merged={
        tickets:Math.max(cur.tickets||0,d.inventory.tickets||0),
        keys:Math.max(cur.keys||0,d.inventory.keys||0),
        superstar_keys:Math.max(cur.superstar_keys||0,d.inventory.superstar_keys||0)
      };
      lsSet(LS.inventory,merged);
    }
    if(d.gacha_tickets){
      Object.entries(d.gacha_tickets).forEach(([rid,count])=>{
        const lsKey=`mv_tickets_${rid}`;
        const local=parseInt(localStorage.getItem(lsKey)||'-1',10);
        localStorage.setItem(lsKey,String(Math.max(local<0?0:local,count||0)));
      });
    }
    if(d.shop_purchases&&Array.isArray(d.shop_purchases)){
      const local=lsGet(LS.purchases,[]);
      if(d.shop_purchases.length>local.length)lsSet(LS.purchases,d.shop_purchases);
    }
  }catch(e){console.warn('[Shop] load:',e);}
}

/* ══════════════════════════════════════
   STOCK SYSTEM
══════════════════════════════════════ */
const RESTOCK_DAYS={'24h':1,'7d':7,'30d':30};
function nextMidnightLocal(days=1){
  const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()+days);return d.getTime();
}
function getStock(p){
  const v=localStorage.getItem(LS.stock(p.id));
  return v==null?p.stock:Math.max(0,parseInt(v,10)||0);
}
function setStock(p,v){localStorage.setItem(LS.stock(p.id),String(Math.max(0,v|0)));}
function getNextRestock(p){
  const v=localStorage.getItem(LS.restock(p.id));
  return v==null?calcNextRestock(p):(v==='null'?null:Number(v));
}
function setNextRestock(p,ts){localStorage.setItem(LS.restock(p.id),ts==null?'null':String(ts));}
function calcNextRestock(p){
  if(!p.restock)return null;
  const days=RESTOCK_DAYS[p.restock];if(!days)return null;
  return nextMidnightLocal(days);
}
function syncStocks(){
  products.forEach(p=>{
    if(localStorage.getItem(LS.stock(p.id))==null)setStock(p,p.stock);
    if(localStorage.getItem(LS.restock(p.id))==null){setNextRestock(p,null);}
    else{
      const ts=getNextRestock(p);
      if(ts&&ts<=Date.now()){setStock(p,p.stock);setNextRestock(p,calcNextRestock(p));}
    }
  });
}

/* ══════════════════════════════════════
   INVENTARIO
══════════════════════════════════════ */
function getInventory(){return lsGet(LS.inventory,{tickets:0,keys:0,superstar_keys:0});}
function setInventory(inv){
  lsSet(LS.inventory,inv);renderHUD();
  if(currentUID)saveInventory(currentUID,inv).catch(()=>{});
  scheduleSync();
}
function getGachaTickets(id){return Math.max(0,parseInt(localStorage.getItem(`mv_tickets_${id}`)||'0',10));}
function addGachaTickets(id,count){
  const cur=getGachaTickets(id);
  localStorage.setItem(`mv_tickets_${id}`,String(cur+count));
  renderHUD();scheduleSync();
}
// Cal keys
const CAL_KEYS_LS='mv_cal_keys';
const CAL_DEFAULT={normal:0,pink:0,green:0,orange:0,cat:0,special:0,future:0};
function getCalKeys(){try{const r=localStorage.getItem(CAL_KEYS_LS);const k=r?JSON.parse(r):{...CAL_DEFAULT};Object.keys(CAL_DEFAULT).forEach(kk=>{if(k[kk]==null)k[kk]=0;});return k;}catch{return{...CAL_DEFAULT};}}
function addCalKeys(calKey){
  const keys=getCalKeys();
  if(calKey.pack&&calKey.keys){Object.entries(calKey.keys).forEach(([t,a])=>{if(keys[t]!=null)keys[t]+=a;});}
  else if(calKey.type){keys[calKey.type]=(keys[calKey.type]||0)+calKey.amount;}
  localStorage.setItem(CAL_KEYS_LS,JSON.stringify(keys));
}
// Super keys
const CHEST_KEYS_LS='mv_chest_keys_v1';
function getSuperKeys(){try{const r=localStorage.getItem(CHEST_KEYS_LS);return r?JSON.parse(r):{};}catch{return{};}}
function addSuperKeys(sk){
  const keys=getSuperKeys();
  if(sk.pack&&sk.keys){Object.entries(sk.keys).forEach(([id,a])=>{keys[id]=(keys[id]||0)+a;});}
  else if(sk.keyId){keys[sk.keyId]=(keys[sk.keyId]||0)+sk.amount;}
  localStorage.setItem(CHEST_KEYS_LS,JSON.stringify(keys));
}

function renderHUD(){
  const inv=getInventory();
  const gachaWheels=['classic','dark_moon','spring','storm','cyber','abyss'];
  const totalTkts=gachaWheels.reduce((s,id)=>s+getGachaTickets(id),inv.tickets||0);
  const s=($('#hudTicketsVal'),$('#hudKeysVal'),$('#hudSuperVal'));
  const setEl=(id,v)=>{const el=$(id);if(el)el.textContent=v;};
  setEl('#hudTicketsVal',totalTkts);
  setEl('#hudKeysVal',inv.keys||0);
  setEl('#hudSuperVal',inv.superstar_keys||0);
  setEl('#heroTickets',totalTkts);
  setEl('#heroKeys',inv.keys||0);
  setEl('#heroSuperKeys',inv.superstar_keys||0);
}

/* ══════════════════════════════════════
   FECHAS
══════════════════════════════════════ */
function parseDate(str){if(!str)return null;const d=new Date(str.includes('T')?str:str+'T23:59:59');return isNaN(d)?null:d.getTime();}
function parseDateStart(str){if(!str)return null;const d=new Date(str.includes('T')?str:str+'T00:00:00');return isNaN(d)?null:d.getTime();}
function todayStr(){return new Date().toISOString().slice(0,10);}
function isDateInRange(start,end){const t=todayStr();return t>=start&&t<=end;}
function timeLeft(ts){
  const diff=Math.max(0,ts-Date.now());
  const d=Math.floor(diff/86400000),h=Math.floor((diff%86400000)/3600000);
  const m=Math.floor((diff%3600000)/60000),s=Math.floor((diff%60000)/1000);
  if(d>=1)return`${d}d ${h}h`;if(h>=1)return`${h}h ${m}m`;return`${m}m ${s}s`;
}
function timeAgo(iso){
  const s=Math.floor((Date.now()-new Date(iso))/1000);
  if(s<60)return'hace un momento';
  if(s<3600)return`hace ${Math.floor(s/60)}m`;
  if(s<86400)return`hace ${Math.floor(s/3600)}h`;
  return`hace ${Math.floor(s/86400)}d`;
}

/* ══════════════════════════════════════
   ONE-TIME / DAILY
══════════════════════════════════════ */
function getOneTime(){return lsGet(LS.onetime,{});}
function isProductClaimed(product){
  const ot=getOneTime();
  if(product.onetime&&ot[product.id])return true;
  if(product.daily){const today=new Date().toDateString();return ot[`daily_${product.id}`]===today;}
  return false;
}
function markClaimed(product){
  const ot=getOneTime();
  if(product.onetime)ot[product.id]=Date.now();
  if(product.daily)ot[`daily_${product.id}`]=new Date().toDateString();
  lsSet(LS.onetime,ot);
}

/* ══════════════════════════════════════
   CUPONES
══════════════════════════════════════ */
const ALL_COUPONS=[10,15,20,25,30,40,50];
const SEASONAL_COUPONS=[
  {id:'sv_2026',name:'💗 San Valentín',emoji:'💗',style:'sc-valentine',discount:30,
   startDate:'2026-02-10',endDate:'2026-02-15',maxUses:5,resetDate:'2026-02-13'},
  {id:'newyear_2026',name:'🎆 Año Nuevo',emoji:'🎆',style:'sc-newyear',discount:25,
   startDate:'2025-12-31',endDate:'2026-01-06',maxUses:3,resetDate:'2026-01-01'},
  {id:'halloween_2026',name:'🎃 Halloween',emoji:'🎃',style:'sc-halloween',discount:40,
   startDate:'2026-10-25',endDate:'2026-11-01',maxUses:3,resetDate:'2026-10-31'},
  {id:'navidad_2026',name:'🎄 Navidad',emoji:'🎄',style:'sc-christmas',discount:35,
   startDate:'2026-12-01',endDate:'2026-12-30',maxUses:5,resetDate:'2026-12-25'},
];
const BLACK_FRIDAY_COUPON={
  id:'blackfriday',name:'BLACK FRIDAY',emoji:'🖤',style:'sc-blackfriday',discount:'random',unlimited:true,
  periods:[
    {startDate:'2026-03-02',endDate:'2026-03-03'},
    {startDate:'2026-04-01',endDate:'2026-04-02'},
    {startDate:'2026-11-27',endDate:'2026-11-30'},
  ],
};

function isSeasonalCouponActive(sc){
  if(sc.periods)return sc.periods.some(p=>isDateInRange(p.startDate,p.endDate));
  return isDateInRange(sc.startDate,sc.endDate);
}
function getScState(sc){try{const r=localStorage.getItem(`mv_sc_${sc.id}`);return r?JSON.parse(r):null;}catch{return null;}}
function setScState(sc,s){localStorage.setItem(`mv_sc_${sc.id}`,JSON.stringify(s));}
function syncScState(sc){
  const today=todayStr();let s=getScState(sc);
  if(!s){s={usesLeft:sc.maxUses,lastReset:today};setScState(sc,s);return s;}
  if(sc.resetDate&&today>=sc.resetDate&&(s.lastReset||'')<sc.resetDate){
    s.usesLeft=sc.maxUses;s.lastReset=today;setScState(sc,s);
  }
  return s;
}
function getScUses(sc){return syncScState(sc).usesLeft;}
function decrementSc(sc){const s=syncScState(sc);if(s.usesLeft>0){s.usesLeft--;setScState(sc,s);}}

let bfDiscount=null;
function rollBF(){bfDiscount=Math.floor(Math.random()*41)+10;return bfDiscount;}
let currentSeasonalId=localStorage.getItem(LS.scActive)||null;
function saveSeasonalId(id){currentSeasonalId=id;id?localStorage.setItem(LS.scActive,id):localStorage.removeItem(LS.scActive);}

let currentCoupon=Number(localStorage.getItem(LS.curCoupon)||0);
function saveCoupon(){localStorage.setItem(LS.curCoupon,String(currentCoupon));}

function getCouponState(){
  try{const r=localStorage.getItem(LS.couponState);if(!r){const s={};ALL_COUPONS.forEach(c=>s[c]=0);localStorage.setItem(LS.couponState,JSON.stringify(s));return s;}return JSON.parse(r);}
  catch{const s={};ALL_COUPONS.forEach(c=>s[c]=0);return s;}
}
function setCouponCooldown(pct,ts){const s=getCouponState();s[String(pct)]=ts||0;localStorage.setItem(LS.couponState,JSON.stringify(s));}
function getCouponCooldown(pct){return Number(getCouponState()[String(pct)]||0);}

function getActiveCouponPct(){
  if(currentSeasonalId){
    if(currentSeasonalId===BLACK_FRIDAY_COUPON.id)return bfDiscount||0;
    const sc=SEASONAL_COUPONS.find(s=>s.id===currentSeasonalId);
    if(sc)return sc.discount;
  }
  return currentCoupon||0;
}

function applyDiscount(price){
  const pct=getActiveCouponPct();
  if(!pct||price<=0)return{final:price,pct:0};
  return{final:Math.max(0,Math.round(price-price*pct/100)),pct};
}

function renderCouponUI(){
  const box=$('#couponList');if(!box)return;
  const nowTs=Date.now();
  const st=getCouponState();let dirty=false;
  ALL_COUPONS.forEach(c=>{const cd=Number(st[c]||0);if(cd>0&&cd<=nowTs){st[c]=0;dirty=true;}});
  if(dirty)localStorage.setItem(LS.couponState,JSON.stringify(st));

  // Validate seasonal
  const allSCs=[...SEASONAL_COUPONS,BLACK_FRIDAY_COUPON];
  const activeSCs=allSCs.filter(sc=>isSeasonalCouponActive(sc));
  if(currentSeasonalId){
    const still=activeSCs.find(sc=>sc.id===currentSeasonalId);
    if(!still){saveSeasonalId(null);bfDiscount=null;currentCoupon=0;saveCoupon();}
  }

  let html='';
  if(activeSCs.length){
    activeSCs.forEach(sc=>{
      const isSelected=currentSeasonalId===sc.id;
      if(sc.id===BLACK_FRIDAY_COUPON.id){
        const dl=isSelected&&bfDiscount?`🎲 ${bfDiscount}% OFF`:'% ALEATORIO';
        html+=`<button class="coupon-card ${sc.style}" data-sc-id="${sc.id}" data-active="${isSelected}">
          <span class="sc-bf-title">${sc.name}</span>
          <span class="cd">${dl}</span><span class="cd">∞ Sin límite</span>
        </button>`;
      }else{
        const uses=getScUses(sc);const ex=uses<=0;
        html+=`<button class="coupon-card ${sc.style}${ex?' ':''}" data-sc-id="${sc.id}" data-active="${isSelected}" ${ex?'aria-disabled="true"':''}>
          <span>${sc.name}</span>
          <span class="cd">${sc.discount}% OFF</span>
          <span class="cd" style="font-size:0.18rem">${uses}/${sc.maxUses} usos</span>
        </button>`;
      }
    });
    html+=`<div class="coupon-sep">─── CUPONES REGULARES ───</div>`;
  }
  html+=ALL_COUPONS.map(c=>{
    const cd=getCouponCooldown(c);const active=cd>nowTs;
    const selected=currentCoupon===c&&!currentSeasonalId;
    if(active)return`<button class="coupon-card coupon-std" aria-disabled="true" data-percent="${c}"><span>${c}%</span><span class="cd">↻ ${timeLeft(cd)}</span></button>`;
    return`<button class="coupon-card coupon-std" data-percent="${c}" data-active="${selected}"><span>${c}% OFF</span>${selected?'<span class="cd">✓ ACTIVO</span>':''}</button>`;
  }).join('');
  box.innerHTML=html;

  // Seasonal listeners
  box.querySelectorAll('.coupon-card[data-sc-id]:not([aria-disabled])').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const scId=btn.dataset.scId;
      if(currentSeasonalId===scId){saveSeasonalId(null);bfDiscount=null;currentCoupon=0;saveCoupon();toast('🎟️ Cupón desactivado','info');}
      else{
        const sc=allSCs.find(s=>s.id===scId);if(!sc)return;
        saveSeasonalId(scId);
        if(sc.id===BLACK_FRIDAY_COUPON.id){const d=rollBF();currentCoupon=d;toast(`🖤 BLACK FRIDAY activado — ${d}% OFF`,'success');}
        else{currentCoupon=sc.discount;toast(`${sc.emoji} Cupón ${sc.name} — ${sc.discount}% OFF`,'success');}
        saveCoupon();
      }
      renderCouponUI();renderProducts();
    });
  });
  // Regular listeners
  box.querySelectorAll('.coupon-card[data-percent]:not([aria-disabled])').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const pct=Number(btn.dataset.percent);
      if(currentSeasonalId){saveSeasonalId(null);bfDiscount=null;}
      currentCoupon=(currentCoupon===pct&&!currentSeasonalId)?0:pct;
      saveCoupon();renderCouponUI();renderProducts();
    });
  });
}

function useCoupon(price){
  const d=applyDiscount(price);
  if(d.pct>0){
    if(currentSeasonalId===BLACK_FRIDAY_COUPON.id){
      rollBF();currentCoupon=bfDiscount;saveCoupon();
    }else if(currentSeasonalId){
      const sc=SEASONAL_COUPONS.find(s=>s.id===currentSeasonalId);
      if(sc){decrementSc(sc);if(getScUses(sc)<=0){saveSeasonalId(null);currentCoupon=0;bfDiscount=null;saveCoupon();toast('🎟️ Usos del cupón agotados!');}}
    }else if(currentCoupon){
      setCouponCooldown(currentCoupon,nextMidnightLocal(1));
      currentCoupon=0;saveCoupon();
    }
    renderCouponUI();
  }
  return d;
}

/* ══════════════════════════════════════
   FLASH SALE COUNTDOWN
══════════════════════════════════════ */
function updateFlashTimer(){
  const now=new Date(),midnight=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1,0,0,0,0);
  const diff=Math.max(0,Math.floor((midnight-now)/1000));
  const h=String(Math.floor(diff/3600)).padStart(2,'0');
  const m=String(Math.floor((diff%3600)/60)).padStart(2,'0');
  const s=String(diff%60).padStart(2,'0');
  const el=$('#flashTimer');if(el)el.textContent=`${h}:${m}:${s}`;
}

/* ══════════════════════════════════════
   FLASH SALE WEEKEND DISCOUNT
   Los fines de semana hay descuento global
══════════════════════════════════════ */
function getFlashSaleDiscount(){
  const day=new Date().getDay();// 0=Sun, 6=Sat
  if(day===0||day===6){
    // 10-40% al azar pero consistente por día
    const seed=new Date().toDateString();
    let hash=0;for(let i=0;i<seed.length;i++)hash=(hash*31+seed.charCodeAt(i))&0xFFFFFF;
    return 10+((hash%4)*10);// 10, 20, 30 o 40
  }
  return 0;
}

function getEffectiveDiscount(price){
  const couponDiscount=getActiveCouponPct();
  const flashDiscount=getFlashSaleDiscount();
  const total=Math.min(90,couponDiscount+flashDiscount);// cap 90%
  if(!total||price<=0)return{final:price,pct:0,flash:flashDiscount,coupon:couponDiscount};
  return{final:Math.max(0,Math.round(price-price*total/100)),pct:total,flash:flashDiscount,coupon:couponDiscount};
}

function updateFlashBanner(){
  const flash=$('#flashBanner');if(!flash)return;
  const disc=getFlashSaleDiscount();
  const descEl=flash.querySelector('.fb-desc');
  if(disc>0&&descEl)descEl.textContent=`🔥 DESCUENTO DE FIN DE SEMANA: ${disc}% EN TODO`;
  else if(descEl)descEl.textContent='Ofertas activas hasta medianoche';
}

/* ══════════════════════════════════════
   SAND BRILL SALE
   Fines de semana + puede aparecer en días
   especiales, con artículos al azar
══════════════════════════════════════ */
const SB_REFRESH_H=4;// refresca cada 4h
function isSandBrillActive(){
  const day=new Date().getDay();return day===0||day===6;
}
function getSBState(){return lsGet(LS.sbState,{items:[],nextRefresh:0});}
function pickSBItems(){
  // Elegir 4 artículos al azar de las secciones no-pases
  const pool=products.filter(p=>p.section!=='pases'&&p.price>0&&p.stock!==0);
  const shuffled=[...pool].sort(()=>Math.random()-0.5).slice(0,4);
  return shuffled.map(p=>{
    const disc=10+Math.floor(Math.random()*5)*10;// 10,20,30,40,50%
    return{id:p.id,discount:disc};
  });
}
function refreshSBIfNeeded(){
  if(!isSandBrillActive())return;
  let state=getSBState();
  if(!state.items.length||state.nextRefresh<=Date.now()){
    state.items=pickSBItems();
    state.nextRefresh=Date.now()+SB_REFRESH_H*3600000;
    lsSet(LS.sbState,state);
  }
}

function renderSandBrill(){
  const panel=$('#sandbrill');if(!panel)return;
  if(!isSandBrillActive()){panel.style.display='none';return;}
  panel.style.display='';
  refreshSBIfNeeded();
  const state=getSBState();
  // Timer
  const timerEl=$('#sbTimer');
  if(timerEl&&state.nextRefresh>Date.now())timerEl.textContent=timeLeft(state.nextRefresh);

  const grid=$('#sbGrid');if(!grid)return;
  grid.innerHTML=state.items.map(item=>{
    const p=products.find(x=>x.id===item.id);if(!p)return'';
    const st=getStock(p);
    const disc=item.discount;
    const base=p.price||0;
    const final=Math.max(0,Math.round(base-base*disc/100));
    const claimed=p.onetime&&isProductClaimed(p);
    return`<div class="sb-card">
      <div class="sb-card-header">
        <div>
          <div class="sb-card-name">${esc(p.name)}</div>
          <div style="font-family:var(--font-vt);font-size:0.85rem;color:var(--muted);margin-top:2px">${esc(p.desc)}</div>
        </div>
        <span class="sb-card-icon">${p.emoji||'📦'}</span>
      </div>
      <div class="sb-price-row">
        <span class="sb-old">⟡${base}</span>
        <span class="sb-new">⟡${final}</span>
        <span class="sb-discount-badge">-${disc}%</span>
      </div>
      <div style="font-family:var(--font-pixel);font-size:0.2rem;color:var(--muted);margin-bottom:6px">📦 Stock: ${st}</div>
      <button class="sb-buy" data-id="${p.id}" data-sbdisc="${disc}" ${(st<=0||claimed)?'disabled':''}>
        ${claimed?'YA RECLAMADO':st<=0?'AGOTADO':'✓ COMPRAR'}
      </button>
    </div>`;
  }).join('');
  grid.querySelectorAll('.sb-buy:not([disabled])').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const p=products.find(x=>x.id===btn.dataset.id);if(!p)return;
      const disc=Number(btn.dataset.sbdisc);
      const base=p.price||0;
      const final=Math.max(0,Math.round(base-base*disc/100));
      purchaseProduct(p,{forceFinal:final,forceDisc:disc,skipModal:false});
    });
  });
}

/* ══════════════════════════════════════
   CATÁLOGO DE PRODUCTOS
══════════════════════════════════════ */
const products=[
  /* ── PASES DE TEMPORADA ── */
  {id:'s1', emoji:'🏆', name:'Pase Reino del Hielo Eterno — Temporada I',    img:'img-pass/banwar.jpg',      quality:'legendary', price:128, stock:1, restock:null, startsAt:'2026-01-01', expiresAt:'2026-01-31', section:'pases', gold:true, desc:'Desbloquea recompensas de la temporada de Enero.',     tags:['pase','temporada'], badge:'new'},
  {id:'s2', emoji:'🏆', name:'Pase Corazones de Redstone — Temporada II',    img:'img-pass/banhall.jpg',     quality:'legendary', price:128, stock:1, restock:null, startsAt:'2026-02-01', expiresAt:'2026-02-28', section:'pases', gold:true, desc:'Desbloquea recompensas de la temporada de Febrero.',   tags:['pase','temporada'], badge:null},
  {id:'s3', emoji:'🏆', name:'Pase Despertar de la Naturaleza — Temporada III',img:'img-pass/partymine.jpg', quality:'legendary', price:128, stock:1, restock:null, startsAt:'2026-03-01', expiresAt:'2026-03-31', section:'pases', gold:true, desc:'Desbloquea recompensas de la temporada de Marzo.',     tags:['pase','temporada'], badge:'hot'},
  {id:'s4', emoji:'🏆', name:'Pase Cántico de la Lluvia Plateada — Temp. IV',img:'img-pass/chrismine.jpg',  quality:'legendary', price:128, stock:1, restock:null, startsAt:'2026-04-01', expiresAt:'2026-04-30', section:'pases', gold:true, desc:'Desbloquea recompensas de la temporada de Abril.',     tags:['pase','temporada'], badge:null},
  {id:'s5', emoji:'🏆', name:'Pase Esencia de la Aurora — Temporada V',      img:'img-pass/añomine.jpg',    quality:'legendary', price:128, stock:1, restock:null, startsAt:'2026-05-01', expiresAt:'2026-05-31', section:'pases', gold:true, desc:'Desbloquea recompensas de la temporada de Mayo.',     tags:['pase','temporada'], badge:null},
  {id:'s6', emoji:'🏆', name:'Pase Imperio del Océano Profundo — Temp. VI',  img:'img-pass/banair.jpg',     quality:'legendary', price:128, stock:1, restock:null, startsAt:'2026-06-01', expiresAt:'2026-06-30', section:'pases', gold:true, desc:'Desbloquea recompensas de la temporada de Junio.',    tags:['pase','temporada'], badge:null},
  {id:'s7', emoji:'🏆', name:'Pase Reinos Dorados — Temporada VII',          img:'img-pass/dancingmine.jpg',quality:'legendary', price:128, stock:1, restock:null, startsAt:'2026-07-01', expiresAt:'2026-07-31', section:'pases', gold:true, desc:'Desbloquea recompensas de la temporada de Julio.',    tags:['pase','temporada'], badge:null},
  {id:'s8', emoji:'🏆', name:'Pase Sombras de la Noche — Temporada VIII',    img:'img-pass/squemine.jpg',   quality:'legendary', price:128, stock:1, restock:null, startsAt:'2026-08-01', expiresAt:'2026-08-31', section:'pases', gold:true, desc:'Desbloquea recompensas de la temporada de Agosto.',   tags:['pase','temporada'], badge:null},
  {id:'s9', emoji:'🏆', name:'Pase Mundo Encantado — Temporada IX',          img:'img-pass/squemine.jpg',   quality:'legendary', price:128, stock:1, restock:null, startsAt:'2026-09-01', expiresAt:'2026-09-30', section:'pases', gold:true, desc:'Desbloquea recompensas de la temporada de Septiembre.',tags:['pase','temporada'], badge:null},
  {id:'s10',emoji:'🏆', name:'Pase Pesadilla del Nether — Temporada X',      img:'img-pass/squemine.jpg',   quality:'legendary', price:128, stock:1, restock:null, startsAt:'2026-10-01', expiresAt:'2026-10-31', section:'pases', gold:true, desc:'Desbloquea recompensas de la temporada de Octubre.',  tags:['pase','temporada'], badge:null},
  {id:'s11',emoji:'🏆', name:'Pase Guardianes del Invierno — Temporada XI',  img:'img-pass/squemine.jpg',   quality:'legendary', price:128, stock:1, restock:null, startsAt:'2026-11-01', expiresAt:'2026-11-30', section:'pases', gold:true, desc:'Desbloquea recompensas de la temporada de Noviembre.',tags:['pase','temporada'], badge:null},
  {id:'s12',emoji:'🏆', name:'Pase Estrella de Ender — Temporada XII',       img:'img-pass/squemine.jpg',   quality:'legendary', price:128, stock:1, restock:null, startsAt:'2026-12-01', expiresAt:'2026-12-31', section:'pases', gold:true, desc:'Desbloquea recompensas de la temporada de Diciembre.',tags:['pase','temporada'], badge:null},

  /* ── COFRES ── */
  {id:'k1',emoji:'🗝️',name:'Cofre de Ámbar',      img:'img/chest2.gif', quality:'epic',      price:30,  stock:10, restock:'7d',  section:'llaves', desc:'Abre este cofre de Ámbar.',                          tags:['cofre','epico']},
  {id:'k2',emoji:'🗝️',name:'Cofre de Sueños',     img:'img/chest2.gif', quality:'epic',      price:30,  stock:10, restock:'7d',  section:'llaves', desc:'Abre este cofre de los Sueños.',                    tags:['cofre','epico']},
  {id:'k3',emoji:'🗝️',name:'Cofre de Moonveil',   img:'img/chest2.gif', quality:'legendary', price:10,  stock:10, restock:'7d',  section:'llaves', desc:'Abre este cofre Moon-Veil.',                         tags:['cofre','legendario'],badge:'hot'},
  {id:'k4',emoji:'🗝️',name:'Cofre de Moonveil II',img:'img/chest2.gif', quality:'legendary', price:30,  stock:5,  restock:'7d',  section:'llaves', desc:'Abre este cofre Moon por ████.',                    tags:['cofre','████'],badge:'limited'},

  /* ── MATERIALES ── */
  {id:'f1',emoji:'⚙️',name:'Rieles (x64)',               img:'imagen/phantom.gif', quality:'epic', price:64,  stock:10, restock:'24h', section:'cosas', desc:'Unos rieles que siempre vienen bien.',         tags:['rieles']},
  {id:'f2',emoji:'⚙️',name:'Rieles Activadores (x64)',   img:'imagen/phantom.gif', quality:'epic', price:128, stock:10, restock:'24h', section:'cosas', desc:'Activemos estos rieles...',                     tags:['rieles','activados']},
  {id:'f3',emoji:'⚙️',name:'Rieles x2 Pack',             img:'imagen/phantom.gif', quality:'epic', price:64,  stock:2,  restock:'7d',  section:'cosas', desc:'Un x2 en rieles con descuento.',               tags:['rieles'],badge:'sale'},
  {id:'f4',emoji:'🧱',name:'Concreto (x64)',              img:'imagen/phantom.gif', quality:'epic', price:64,  stock:20, restock:'24h', section:'cosas', desc:'Para construir.',                              tags:['concreto']},
  {id:'f5',emoji:'🔩',name:'Bloques de Hierro (x64)',     img:'imagen/phantom.gif', quality:'epic', price:128, stock:10, restock:'7d',  section:'cosas', desc:'Algunos bloques de hierro.',                   tags:['bloques']},
  {id:'f6',emoji:'🔩',name:'Bloques de Hierro (x64) x4', img:'imagen/phantom.gif', quality:'legendary', price:128, stock:1, restock:null, section:'cosas', desc:'Oferta y demanda.',                        tags:['bloques','oferta'],badge:'limited'},
  {id:'f7',emoji:'💎',name:'Bloques de Diamante (x64) x4',img:'imagen/phantom.gif',quality:'legendary', price:128, stock:1, restock:null, section:'cosas', desc:'Bueno brillemos...',                       tags:['bloques','diamante'],badge:'limited'},
  {id:'f8',emoji:'💚',name:'Esmeralda x1',                img:'imagen/phantom.gif', quality:'legendary', price:1,  stock:1,  restock:null,  section:'cosas', desc:'Sand Brill te desea lo mejor, pero es tan tacaño que solo da 1 esmeralda.',tags:['sand','brill'],badge:'hot'},

  /* ── HISTORIA ── */
  {id:'l1',emoji:'📚',name:'Libro: "Bosque de Jade"',          img:'img/bookmine.jpg',quality:'rare',      price:256,stock:1,restock:null,section:'historia',desc:'Leyendas del bioma.',            tags:['lore','bioma']},
  {id:'l2',emoji:'📚',name:'Libro: "La Negra Noche"',          img:'img/bookmine.jpg',quality:'epic',      price:256,stock:1,restock:null,section:'historia',desc:'Símbolos y runas.',              tags:['runas','forja']},
  {id:'l3',emoji:'📚',name:'Libro: "El lado ███ de S██ B███"', img:'img/bookcat.gif', quality:'legendary', price:384,stock:1,restock:null,section:'historia',desc:'█████████.',                      tags:['reliquia'],badge:'limited'},
  {id:'l4',emoji:'📖',name:'Libro A1',img:'img/book.jpg',quality:'epic',price:128,stock:1,restock:null,section:'historia',desc:'Un libro.',tags:['libro']},
  {id:'l5',emoji:'📖',name:'Libro B2',img:'img/book.jpg',quality:'epic',price:128,stock:1,restock:null,section:'historia',desc:'Un libro.',tags:['libro']},
  {id:'l6',emoji:'📖',name:'Libro A2',img:'img/book.jpg',quality:'epic',price:128,stock:1,restock:null,section:'historia',desc:'Un libro.',tags:['libro']},
  {id:'l7',emoji:'📖',name:'Libro C3',img:'img/book.jpg',quality:'epic',price:128,stock:1,restock:null,section:'historia',desc:'Un libro.',tags:['libro']},

  /* ── LOTE MONEDAS ── */
  {id:'m1',emoji:'🪙',name:'Pegatina de 1 moneda',img:'img/coin.jpg',quality:'common',   price:0,  stock:1,  restock:'24h',section:'materiales',desc:'Gratis.',                            tags:['moneda'],onetime:false,daily:true},
  {id:'m2',emoji:'🪙',name:'Bolsita de 30 monedas',img:'img/coin.jpg',quality:'rare',    price:15, stock:10, restock:'7d', section:'materiales',desc:'Para trueques básicos.',             tags:['moneda']},
  {id:'m3',emoji:'🪙',name:'Pack de 90 monedas',   img:'img/packcoin.jpg',quality:'epic',price:30, stock:10, restock:'7d', section:'materiales',desc:'Relación costo/beneficio equilibrada.',tags:['moneda','pack']},
  {id:'m4',emoji:'🪙',name:'Lote de 120 monedas',  img:'img/stackcoin.jpg',quality:'legendary',price:60,stock:10,restock:'30d',section:'materiales',desc:'Ideal para temporadas.',         tags:['moneda','lote'],badge:'hot'},

  /* ── PASES DE EVENTO ── */
  {id:'e1',emoji:'🎪',name:'Pase en la Oscuridad',img:'img-pass/banhall.jpg',  quality:'legendary',price:256,stock:1,restock:'30d',startsAt:'2026-10-20',expiresAt:'2026-11-01',section:'eventos',desc:'Algo se acerca...',    tags:['evento'],badge:'limited'},
  {id:'e2',emoji:'🐱',name:'Pase Gatos 😺✨',      img:'img-pass/catsparty.jpg',quality:'legendary',price:256,stock:1,restock:'30d',startsAt:'2026-08-01',expiresAt:'2026-08-30',section:'eventos',desc:'Gatos y más gatos...', tags:['evento','gatos'],badge:'new'},

  /* ── PACK DE MONEDAS ── */
  {id:'c1',emoji:'💰',name:'Pack de 128 roubles',img:'img/coin.jpg',     quality:'common',price:64, stock:999,restock:null,section:'monedas',desc:'Para trueques (2 stacks).',           tags:['monedas','pack']},
  {id:'c2',emoji:'💰',name:'Pack de 256 roubles',img:'img/packcoin.jpg', quality:'rare',  price:128,stock:999,restock:null,section:'monedas',desc:'Relación equilibrada (4 stacks).',    tags:['monedas','pack']},
  {id:'c3',emoji:'💰',name:'Pack de 384 roubles',img:'img/stackcoin.jpg',quality:'epic',  price:256,stock:999,restock:null,section:'monedas',desc:'Para temporadas completas (6 stacks).',tags:['monedas','pack'],badge:'hot'},

  /* ── TICKETS ── */
  {id:'t_classic_1', emoji:'🎫',name:'Ticket Clásico',            img:'imagen/ticket5.jpg',quality:'epic',price:10,stock:10,restock:'24h',section:'tickets',desc:'Ticket para la ruleta clásica.',  tags:['ticket','clasico'],         give:{type:'gacha_tickets',wheel:'classic',  count:1}},
  {id:'t_elemental_1',emoji:'🎫',name:'Ticket Elemental (Cobre)',  img:'imagen/ticket5.jpg',quality:'epic',price:10,stock:10,restock:'24h',section:'tickets',desc:'Ticket para la ruleta elemental.',tags:['ticket','elemental'],        give:{type:'gacha_tickets',wheel:'elemental',count:1}},
  {id:'t_event_1',   emoji:'🎫',name:'Ticket de Evento',          img:'imagen/ticket5.jpg',quality:'epic',price:10,stock:10,restock:'24h',section:'tickets',desc:'Ticket para ruletas de eventos.',  tags:['ticket','evento'],           give:{type:'gacha_tickets',wheel:'event',    count:1}},
  {id:'t_classic_5', emoji:'🎫',name:'Ticket Clásico x5',         img:'imagen/ticket5.jpg',quality:'epic',price:30,stock:10,restock:'24h',section:'tickets',desc:'Pack de 5 tickets clásicos.',      tags:['ticket','clasico'],badge:'sale', give:{type:'gacha_tickets',wheel:'classic',  count:5}},
  {id:'t_elemental_5',emoji:'🎫',name:'Ticket Elemental x5',      img:'imagen/ticket5.jpg',quality:'epic',price:30,stock:10,restock:'24h',section:'tickets',desc:'Pack de 5 tickets elementales.',   tags:['ticket','elemental'],        give:{type:'gacha_tickets',wheel:'elemental',count:5}},
  {id:'t_event_5',   emoji:'🎫',name:'Ticket Evento x5',          img:'imagen/ticket5.jpg',quality:'epic',price:30,stock:10,restock:'24h',section:'tickets',desc:'Pack de 5 tickets de evento.',     tags:['ticket','evento'],           give:{type:'gacha_tickets',wheel:'event',    count:5}},
  {id:'t_welcome',   emoji:'🎉',name:'¡Bienvenida! Tickets x10',  img:'imagen/ticket5.jpg',quality:'epic',price:0, stock:1, restock:null,  section:'tickets',desc:'Pack de bienvenida: 10 tickets clásicos.',tags:['ticket','gratis'],badge:'new',give:{type:'gacha_tickets',wheel:'classic',count:10},onetime:true},
  {id:'t_free10',    emoji:'🎰',name:'Tiros Gratis x10',          img:'imagen/ticket5.jpg',quality:'epic',price:0, stock:1, restock:'30d', section:'tickets',desc:'10 tickets gratuitos cada mes.', tags:['ticket','gratis'],badge:'hot',give:{type:'gacha_tickets',wheel:'classic',count:10}},

  /* ── LLAVES DEL CALENDARIO ── */
  {id:'ck_normal', emoji:'🔵',name:'Llave Normal',               img:'img/keys1.jpg',quality:'rare',      price:30, stock:10,restock:'7d',  section:'calkeys',desc:'Recupera un día perdido en el Calendario.',  tags:['llave','calendario'],calKey:{type:'normal', amount:1}},
  {id:'ck_pink',   emoji:'💗',name:'Llave Rosa',                 img:'img/keys1.jpg',quality:'epic',      price:50, stock:5, restock:'30d', section:'calkeys',desc:'Para San Valentín, Día de la Madre y Padre.',tags:['llave','festival'],  calKey:{type:'pink',   amount:1}},
  {id:'ck_green',  emoji:'🟢',name:'Llave Verde',                img:'img/keys1.jpg',quality:'epic',      price:50, stock:5, restock:'30d', section:'calkeys',desc:'Para Navidad y Año Nuevo.',                  tags:['llave','navidad'],   calKey:{type:'green',  amount:1}},
  {id:'ck_orange', emoji:'🎃',name:'Llave Naranja',              img:'img/keys1.jpg',quality:'epic',      price:50, stock:5, restock:'30d', section:'calkeys',desc:'Para Halloween y Black Friday.',             tags:['llave','halloween'], calKey:{type:'orange', amount:1}},
  {id:'ck_cat',    emoji:'😺',name:'Llave Gato',                 img:'img/keys1.jpg',quality:'epic',      price:60, stock:3, restock:'30d', section:'calkeys',desc:'Para el Día del Gato y del Perro. ¡Meow!', tags:['llave','gato'],      calKey:{type:'cat',    amount:1},badge:'limited'},
  {id:'ck_special',emoji:'💜',name:'Llave Especial',             img:'img/keys1.jpg',quality:'epic',      price:60, stock:3, restock:'30d', section:'calkeys',desc:'Para días únicos y especiales.',             tags:['llave','especial'],  calKey:{type:'special',amount:1}},
  {id:'ck_future', emoji:'⏩',name:'Llave Futuro',               img:'img/keys1.jpg',quality:'legendary', price:100,stock:2, restock:'30d', section:'calkeys',desc:'¡Rara! Reclama días futuros del Calendario.',tags:['llave','futuro','rara'],calKey:{type:'future',amount:1},badge:'limited'},
  {id:'ck_pack_all',emoji:'🎁',name:'Pack Definitivo — 1 de Cada',img:'img/keys1.jpg',quality:'legendary',price:280,stock:1, restock:'30d', section:'calkeys',desc:'El pack supremo con 1 llave de cada tipo.', tags:['llave','pack'],      calKey:{pack:true,keys:{normal:1,pink:1,green:1,orange:1,cat:1,special:1,future:1}},badge:'limited'},

  /* ── LLAVES SUPERESTRELLA ── */
  {id:'sk_common',   emoji:'⭐',name:'Llave Superestrella',             img:'img/keys1.jpg',quality:'common',   price:20, stock:20,restock:'24h',section:'superestrellas',desc:'Abre el Cofre Común.',              tags:['llave','superestrella','cofre'],superKey:{keyId:'key_common',   amount:1}},
  {id:'sk_rare',     emoji:'💫',name:'Llave Sup. Brillante',           img:'img/keys1.jpg',quality:'rare',     price:40, stock:15,restock:'24h',section:'superestrellas',desc:'Abre el Cofre Raro.',               tags:['llave','superestrella','raro'], superKey:{keyId:'key_rare',     amount:1}},
  {id:'sk_special',  emoji:'✨',name:'Llave Sup. Especial',            img:'img/keys1.jpg',quality:'epic',     price:80, stock:10,restock:'7d', section:'superestrellas',desc:'Abre el Cofre Especial.',           tags:['llave','superestrella','especial'],superKey:{keyId:'key_special',  amount:1}},
  {id:'sk_epic',     emoji:'🔮',name:'Llave Sup. Épica',               img:'img/keys1.jpg',quality:'epic',     price:160,stock:5, restock:'7d', section:'superestrellas',desc:'Abre el Cofre Épico.',              tags:['llave','superestrella','epico'], superKey:{keyId:'key_epic',     amount:1}},
  {id:'sk_legendary',emoji:'👑',name:'Llave Sup. Legendaria',          img:'img/keys1.jpg',quality:'legendary',price:320,stock:3, restock:'7d', section:'superestrellas',desc:'Solo los valientes merecen el oro.',tags:['llave','superestrella','legend'],superKey:{keyId:'key_legendary', amount:1},badge:'limited'},
  {id:'sk_halloween',emoji:'🎃',name:'Llave Sup. Calabaza',            img:'img/keys1.jpg',quality:'legendary',price:70, stock:3, restock:'24h',startsAt:'2026-10-25',expiresAt:'2026-11-01',section:'superestrellas',desc:'Llave de Halloween.',tags:['llave','evento','halloween'],superKey:{keyId:'key_halloween',amount:1}},
  {id:'sk_christmas',emoji:'🎄',name:'Llave Sup. Navideña',            img:'img/keys1.jpg',quality:'legendary',price:70, stock:3, restock:'24h',startsAt:'2026-12-01',expiresAt:'2026-12-30',section:'superestrellas',desc:'Llave de Navidad.',tags:['llave','evento','navidad'],superKey:{keyId:'key_christmas',amount:1}},
  {id:'sk_pack_starter',emoji:'📦',name:'Pack Inicio — Común ×3 + Brillante ×1',img:'img/keys1.jpg',quality:'rare',price:55,stock:10,restock:'7d',section:'superestrellas',desc:'El pack para comenzar.',tags:['pack','superestrella'],superKey:{pack:true,keys:{key_common:3,key_rare:1}}},
  {id:'sk_pack_top', emoji:'👑',name:'Pack Élite — Épica ×2 + Legendaria ×1',  img:'img/keys1.jpg',quality:'legendary',price:256,stock:3,restock:'30d',section:'superestrellas',desc:'El pack de los elegidos.',tags:['pack','superestrella','legend'],superKey:{pack:true,keys:{key_epic:2,key_legendary:1}},badge:'limited'},
];

/* ══════════════════════════════════════
   RENDER DE PRECIO
══════════════════════════════════════ */
function renderPriceHTML(p,forceFinal=null,forceDisc=null){
  const base=p.price||0;
  let final=base,pct=0;
  if(forceFinal!=null){final=forceFinal;pct=forceDisc||0;}
  else{const d=getEffectiveDiscount(base);final=d.final;pct=d.pct;}
  if(base===0){
    return`<div class="pc-price-row"><span class="pc-price free-price">GRATIS</span></div>`;
  }
  if(pct>0){
    return`<div class="pc-price-row">
      <span class="pc-price-old">⟡${base}</span>
      <span class="pc-price">⟡${final}</span>
      <span class="pc-discount">-${pct}%</span>
    </div>`;
  }
  const cssClass=p.price==='CÓDIGO'?'code-price':p.price==='EVENTO'?'event-price':'';
  return`<div class="pc-price-row">
    <span class="pc-price ${cssClass}">⟡${base}</span>
  </div>`;
}

/* ══════════════════════════════════════
   ESTADO GLOBAL UI
══════════════════════════════════════ */
let currentCategory='all';
let searchText='';
let foxInterval=null;

/* ══════════════════════════════════════
   RENDER PRODUCTS
══════════════════════════════════════ */
function renderProducts(){
  const grid=$('#productsGrid');if(!grid)return;
  const nowTs=Date.now();

  const filtered=products.filter(p=>{
    const secOk=currentCategory==='all'||p.section===currentCategory;
    const q=(searchText||'').trim().toLowerCase();
    const txt=`${p.name} ${p.quality} ${p.desc||''} ${(p.tags||[]).join(' ')}`.toLowerCase();
    return secOk&&(!q||txt.includes(q));
  });

  if(!filtered.length){grid.innerHTML='<div class="p-empty">No se encontraron artículos</div>';return;}

  grid.innerHTML=filtered.map((p,i)=>{
    const st=getStock(p);
    const next=getNextRestock(p);
    const startMs=parseDateStart(p.startsAt);
    const expMs=parseDate(p.expiresAt);
    const isOut=st<=0;
    const isUpcoming=!!(startMs&&startMs>nowTs);
    const isExpired=!!(expMs&&expMs<nowTs);
    const isDisabled=isOut||isUpcoming||isExpired;
    const claimed=isProductClaimed(p);

    const rarity=p.quality==='legendary'?'legend':p.quality==='epic'?'epic':p.quality==='rare'?'rare':'common';

    // Overlay
    let overlay='';
    if(isOut)overlay=`<div class="pc-overlay"><div class="pc-overlay-box out"><span class="pco-label">AGOTADO</span><span class="pco-sub">${next?`Restock en: ${timeLeft(next)}`:'Sin restock'}</span></div></div>`;
    else if(isExpired)overlay=`<div class="pc-overlay"><div class="pc-overlay-box expired"><span class="pco-label">⌛ CADUCADO</span><span class="pco-sub">Oferta finalizada</span></div></div>`;
    else if(isUpcoming)overlay=`<div class="pc-overlay"><div class="pc-overlay-box soon"><span class="pco-label">⏳ PRÓXIMAMENTE</span><span class="pco-sub">Desde: ${p.startsAt}</span></div></div>`;

    const badgeHTML=p.badge?`<div class="pc-badge ${p.badge}">${p.badge.toUpperCase()}</div>`:'';

    // Tags
    const tagCls={pase:'pase',ticket:'tickets',llave:'keys',cofre:'keys',moneda:'monedas',lore:'lore',pack:'free',super:'super',bonus:'bonus'};
    const tagsHTML=(p.tags||[]).slice(0,3).map(t=>{
      const match=Object.entries(tagCls).find(([k])=>t.toLowerCase().includes(k));
      const cls=match?match[1]:'free';
      return`<span class="pc-tag ${cls}">${t.toUpperCase()}</span>`;
    }).join('');

    // Stock row
    const stockHTML=p.stock<999?`<div class="pc-stock ${st<=2?'low':''}">📦 Stock: ${st} ${p.restock?`· ↻ ${p.restock}`:''}</div>`:'';

    // Img (try to load, fallback)
    const imgHTML=p.img?`<div class="pc-img"><img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy" onerror="this.style.display='none'">${overlay}</div>`:'';

    // Btn label
    let btnLabel=claimed&&p.daily?'✓ RECLAMADO HOY':claimed?'✓ RECLAMADO':p.onetime&&claimed?'✓ RECLAMADO':'OBTENER';
    if(isExpired)btnLabel='⌛ CADUCADO';
    if(isUpcoming)btnLabel='⏳ PRONTO';

    const priceHTML=renderPriceHTML(p);

    return`<div class="product-card reveal" data-id="${p.id}" data-rarity="${rarity}" style="animation-delay:${i*0.04}s">
      <div class="pc-band"></div>
      ${imgHTML}
      ${badgeHTML}
      <div class="pc-body">
        <span class="pc-icon">${p.emoji||'📦'}</span>
        <div class="pc-name">${esc(p.name)}</div>
        <div class="pc-desc">${esc(p.desc||'')}</div>
        <div class="pc-tags">${tagsHTML}</div>
      </div>
      <div class="pc-footer">
        ${stockHTML}
        ${priceHTML}
        <div class="pc-btn-row">
          <button class="pc-btn-detail" data-id="${p.id}">INFO</button>
          <button class="pc-btn ${(claimed&&!p.daily)||isDisabled?'claimed':''}" data-id="${p.id}"
            ${(claimed&&!p.daily)||isDisabled?'disabled':''}>${btnLabel}</button>
        </div>
      </div>
    </div>`;
  }).join('');

  requestAnimationFrame(()=>{
    grid.querySelectorAll('.reveal').forEach((el,i)=>setTimeout(()=>el.classList.add('visible'),i*35));
  });

  // Listeners
  grid.querySelectorAll('.pc-btn:not([disabled])').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const p=products.find(x=>x.id===btn.dataset.id);if(p)showConfirmModal(p);
    });
  });
  grid.querySelectorAll('.pc-btn-detail').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const p=products.find(x=>x.id===btn.dataset.id);if(p)showDetailModal(p);
    });
  });
}

/* ══════════════════════════════════════
   MODALES
══════════════════════════════════════ */
function openModal(html){
  const m=$('#modal'),c=$('#modalContent');if(!m||!c)return;
  c.innerHTML=html;m.setAttribute('aria-hidden','false');
}
function closeModal(){$('#modal')?.setAttribute('aria-hidden','true');}

function showConfirmModal(product){
  const claimed=isProductClaimed(product);
  if(claimed&&!product.daily){toast('Ya reclamaste este ítem','⚠️','error');return;}
  const {final,pct}=getEffectiveDiscount(product.price||0);
  const base=product.price||0;

  let priceRowHTML='';
  if(base===0)priceRowHTML=`<div class="buy-modal-price-row"><span class="bmp-final" style="color:var(--green)">GRATIS</span></div>`;
  else if(pct>0)priceRowHTML=`<div class="buy-modal-price-row"><span class="bmp-original">⟡${base}</span><span class="bmp-final">⟡${final}</span><span class="bmp-discount">-${pct}%</span></div>`;
  else priceRowHTML=`<div class="buy-modal-price-row"><span class="bmp-final">⟡${base}</span></div>`;

  const noteText=product.onetime?`<p class="buy-modal-note">⚠️ Solo puedes reclamar esto <b>UNA VEZ</b></p>`:
    product.daily?`<p class="buy-modal-note">📅 Disponible una vez al día</p>`:'';

  openModal(`
    <span class="buy-modal-icon">${product.emoji||'📦'}</span>
    <div class="buy-modal-name">${esc(product.name)}</div>
    <div class="buy-modal-desc">${esc(product.desc||'')}</div>
    ${priceRowHTML}
    ${noteText}
    <div class="buy-modal-actions">
      <button class="btn-pixel btn-ghost" onclick="document.getElementById('modal').setAttribute('aria-hidden','true')">CANCELAR</button>
      <button class="btn-pixel btn-gold pulse" id="btnConfirmBuy">✓ CONFIRMAR</button>
    </div>`);
  setTimeout(()=>{
    $('#btnConfirmBuy')?.addEventListener('click',()=>{closeModal();purchaseProduct(product);});
  },50);
}

function showDetailModal(product){
  const st=getStock(product);
  const next=getNextRestock(product);
  const priceHTML=renderPriceHTML(product);
  openModal(`
    <h2>${product.emoji||'📦'} ${esc(product.name)}</h2>
    ${product.img?`<img class="detail-modal-img" src="${esc(product.img)}" alt="${esc(product.name)}" onerror="this.style.display='none'">` :''}
    <p style="font-family:var(--font-vt);font-size:1rem;color:var(--muted);margin-bottom:14px">${esc(product.desc||'')}</p>
    <div class="detail-meta-grid">
      <div class="detail-meta-item"><strong>PRECIO</strong>${priceHTML}</div>
      <div class="detail-meta-item"><strong>STOCK</strong>${st} unidades</div>
      <div class="detail-meta-item"><strong>CALIDAD</strong>${product.quality?.toUpperCase()||'—'}</div>
      <div class="detail-meta-item"><strong>SECCIÓN</strong>${product.section?.toUpperCase()||'—'}</div>
      ${product.restock?`<div class="detail-meta-item"><strong>RESTOCK</strong>${product.restock}${next?` (${timeLeft(next)})`:''}` :''}
      ${product.startsAt?`<div class="detail-meta-item"><strong>DISPONIBLE</strong>${product.startsAt}</div>`:''}
      ${product.expiresAt?`<div class="detail-meta-item"><strong>CADUCA</strong>${product.expiresAt}</div>`:''}
    </div>
    <div style="margin-top:14px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
      <button class="btn-pixel btn-ghost" onclick="document.getElementById('modal').setAttribute('aria-hidden','true')">CERRAR</button>
      <button class="btn-pixel btn-gold" id="btnDetailBuy">OBTENER</button>
    </div>`);
  setTimeout(()=>{
    $('#btnDetailBuy')?.addEventListener('click',()=>{closeModal();showConfirmModal(product);});
  },50);
}

function showSuccessModal(product,finalPrice,pct){
  openModal(`
    <div style="text-align:center;padding:10px 0">
      <span style="font-size:4rem;display:block;margin-bottom:14px;filter:drop-shadow(0 0 18px var(--a))">${product.emoji||'📦'}</span>
      <h2>¡RECOMPENSA OBTENIDA!</h2>
      <div style="font-family:var(--font-pixel);font-size:0.36rem;color:var(--text);margin-bottom:8px;line-height:1.8">${esc(product.name)}</div>
      ${pct>0?`<div style="font-family:var(--font-pixel);font-size:0.28rem;color:var(--green);margin-bottom:8px">✓ ${pct}% DE DESCUENTO APLICADO — ⟡${finalPrice}</div>`:''}
      <button class="btn-pixel btn-gold" onclick="document.getElementById('modal').setAttribute('aria-hidden','true')" style="margin-top:8px">¡GENIAL!</button>
    </div>`);
}

/* ══════════════════════════════════════
   PURCHASE
══════════════════════════════════════ */
function purchaseProduct(product,opts={}){
  const nowTs=Date.now();
  const startMs=parseDateStart(product.startsAt);
  if(startMs&&startMs>nowTs){toast('⏳ Esta oferta aún no está disponible','','error');return;}
  const expMs=parseDate(product.expiresAt);
  if(expMs&&expMs<nowTs){toast('⌛ Esta oferta ya ha caducado','','error');return;}
  const st=getStock(product);
  if(st<=0){toast('Artículo agotado ❌','','error');return;}
  if(isProductClaimed(product)&&!product.daily){toast('Ya reclamaste este ítem','','error');return;}

  // Stock
  setStock(product,st-1);
  if((st-1)<=0&&product.restock)setNextRestock(product,calcNextRestock(product));

  // Descuento
  let {final:finalPrice,pct}=opts.forceFinal!=null
    ?{final:opts.forceFinal,pct:opts.forceDisc||0}
    :getEffectiveDiscount(product.price||0);
  if(!opts.forceFinal)useCoupon(product.price||0);

  // Ejecutar give
  executeGive(product);
  markClaimed(product);

  // Historial
  addPurchase(product,buildNoteStr(product));

  // Pases
  if(product.section==='pases'&&typeof window.activatePassFromShop==='function'){
    window.activatePassFromShop(product.id);
  }

  renderProducts();
  renderSandBrill();
  scheduleSync();

  if(!opts.skipModal)showSuccessModal(product,finalPrice,pct);
  toast(`✓ ${product.name}`,'','success');
}

function executeGive(product){
  if(product.give){
    const g=product.give;
    if(g.type==='gacha_tickets')addGachaTickets(g.wheel,g.count);
    else if(g.type==='inventory'){const inv=getInventory();inv[g.item]=(inv[g.item]||0)+g.count;setInventory(inv);}
  }
  if(product.calKey)addCalKeys(product.calKey);
  if(product.superKey)addSuperKeys(product.superKey);
  renderHUD();
}

function buildNoteStr(product){
  if(product.give){
    const g=product.give;
    if(g.type==='gacha_tickets')return`+${g.count} tickets ${g.wheel}`;
    if(g.type==='inventory')return`+${g.count} ${g.item}`;
  }
  if(product.calKey){
    const ck=product.calKey;
    if(ck.pack)return`Llaves calendario pack`;
    return`+${ck.amount} llave ${ck.type}`;
  }
  if(product.superKey){
    const sk=product.superKey;
    if(sk.pack)return`Super llaves pack`;
    return`+${sk.amount} super llave`;
  }
  return`⟡${product.price||0}`;
}

/* ══════════════════════════════════════
   HISTORIAL
══════════════════════════════════════ */
function getPurchases(){return lsGet(LS.purchases,[]);}
function addPurchase(product,note=''){
  const hist=getPurchases();
  hist.unshift({id:product.id,name:product.name,icon:product.emoji||'📦',note,date:new Date().toISOString()});
  if(hist.length>50)hist.pop();
  lsSet(LS.purchases,hist);renderHistory();
}
function renderHistory(){
  const list=$('#histList');if(!list)return;
  const hist=getPurchases();
  if(!hist.length){
    list.innerHTML='<div class="hist-empty"><span>📭</span><p>SIN COMPRAS AÚN</p></div>';
    return;
  }
  list.innerHTML=hist.map(p=>`
    <div class="hist-item">
      <span class="hi-icon">${p.icon||'📦'}</span>
      <div class="hi-info">
        <div class="hi-name">${esc(p.name)}</div>
        <div class="hi-note">${esc(p.note||'')}</div>
      </div>
      <div class="hi-time">${timeAgo(p.date)}</div>
    </div>`).join('');
  // Badge
  const badge=$('#histBadge');
  if(badge){badge.style.display=hist.length?'grid':'none';badge.textContent=hist.length>9?'9+':hist.length;}
}

/* ══════════════════════════════════════
   NPC ZORRITO
══════════════════════════════════════ */
const NPC_MSGS=[
  '¡Tengo los mejores items del portal!',
  'Pack de bienvenida disponible GRATIS',
  'Fin de semana = descuentos de Sand Brill',
  'Los legendarios son rarísimos...',
  '¡Cupones activos hoy!',
  '¡Compra hoy, gira mañana!',
  '¿Llaves o tickets? ¡Yo tengo todo!',
  '¡Los pases te dan muchas recompensas!',
  'Las llaves del calendario son clave 🔑',
  '¡Black Friday con descuentos aleatorios!',
];
function initNPC(){
  const d=$('#npcDialog');if(!d)return;
  let i=0;
  const upd=()=>{d.textContent=NPC_MSGS[i%NPC_MSGS.length];i++;};
  upd();foxInterval=setInterval(upd,7000);
}

/* ══════════════════════════════════════
   PARTÍCULAS
══════════════════════════════════════ */
function initCoins(){
  const canvas=$('#bgCoins');if(!canvas)return;
  const ctx=canvas.getContext('2d');
  const dpi=Math.max(1,devicePixelRatio||1);
  const init=()=>{canvas.width=innerWidth*dpi;canvas.height=innerHeight*dpi;};
  const SYMS=['🪙','💰','✨','💛','⭐'];
  let coins=[];
  const mkCoins=()=>{
    coins=Array.from({length:30},()=>({
      x:Math.random()*canvas.width,y:Math.random()*canvas.height,
      size:(Math.random()*10+8)*dpi,speed:(Math.random()*0.4+0.1)*dpi,
      sym:SYMS[Math.floor(Math.random()*SYMS.length)],
      o:Math.random()*0.3+0.05
    }));
  };
  init();mkCoins();
  (function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    coins.forEach(c=>{
      ctx.globalAlpha=c.o;ctx.font=`${c.size}px serif`;
      ctx.fillText(c.sym,c.x,c.y);
      c.y-=c.speed;if(c.y<-20){c.y=canvas.height+10;c.x=Math.random()*canvas.width;}
    });
    requestAnimationFrame(draw);
  })();
  window.addEventListener('resize',()=>{init();mkCoins();});
}

/* ══════════════════════════════════════
   TOAST
══════════════════════════════════════ */
function toast(msg,icon='',type='success'){
  const t=$('#toast');if(!t)return;
  t.textContent=`${icon?icon+' ':''}${msg}`;t.className=`toast show ${type}`;
  clearTimeout(t._tm);t._tm=setTimeout(()=>t.classList.remove('show'),3000);
}

/* ══════════════════════════════════════
   REVEAL
══════════════════════════════════════ */
function initReveal(){
  const obs=new IntersectionObserver(entries=>{
    entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}});
  },{threshold:0.1});
  document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
}

/* ══════════════════════════════════════
   NAV
══════════════════════════════════════ */
function initNav(){
  const btn=$('#hamburger'),nav=$('#main-nav');
  if(btn&&nav)btn.addEventListener('click',()=>nav.classList.toggle('open'));
}

/* ══════════════════════════════════════
   HISTORIAL DRAWER
══════════════════════════════════════ */
function initHistDrawer(){
  const fab=$('#histFab'),drawer=$('#histDrawer'),backdrop=$('#histBackdrop'),close=$('#histClose');
  const open=()=>{drawer.setAttribute('aria-hidden','false');backdrop.classList.add('show');}
  const closeFn=()=>{drawer.setAttribute('aria-hidden','true');backdrop.classList.remove('show');}
  fab?.addEventListener('click',open);
  close?.addEventListener('click',closeFn);
  backdrop?.addEventListener('click',closeFn);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeFn();});

  $('#btnClearHistory')?.addEventListener('click',()=>{
    if(!confirm('¿Limpiar historial de compras?'))return;
    lsSet(LS.purchases,[]);renderHistory();toast('Historial limpiado','🗑️','info');
  });
}

/* ══════════════════════════════════════
   SAND BRILL TIMER
══════════════════════════════════════ */
function updateSBTimer(){
  if(!isSandBrillActive())return;
  const state=getSBState();
  const el=$('#sbTimer');
  if(el&&state.nextRefresh>Date.now())el.textContent=timeLeft(state.nextRefresh);
}

/* ══════════════════════════════════════
   BOOT
══════════════════════════════════════ */
function boot(){
  console.log('🛒 Moonveil Tienda v3.0');
  syncStocks();

  // Validate seasonal coupon
  if(currentSeasonalId){
    const allSCs=[...SEASONAL_COUPONS,BLACK_FRIDAY_COUPON];
    const sc=allSCs.find(s=>s.id===currentSeasonalId);
    if(!sc||!isSeasonalCouponActive(sc)){
      saveSeasonalId(null);bfDiscount=null;currentCoupon=0;saveCoupon();
    }else if(sc.id===BLACK_FRIDAY_COUPON.id){rollBF();currentCoupon=bfDiscount;saveCoupon();}
  }

  initReveal();initNav();initCoins();initNPC();initHistDrawer();

  renderHUD();renderHistory();renderCouponUI();
  updateFlashBanner();updateFlashTimer();
  renderSandBrill();
  renderProducts();

  // Intervalos
  setInterval(updateFlashTimer,1000);
  setInterval(updateSBTimer,5000);
  setInterval(()=>{syncStocks();renderProducts();},60000);

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
  $('#searchClear')?.addEventListener('click',()=>{if($('#searchInput'))$('#searchInput').value='';searchText='';renderProducts();});

  // Clear coupon
  $('#btnClearCoupon')?.addEventListener('click',()=>{
    currentCoupon=0;saveSeasonalId(null);bfDiscount=null;saveCoupon();
    renderCouponUI();renderProducts();toast('Cupón desactivado','','info');
  });

  // Modal
  $('#modalClose')?.addEventListener('click',closeModal);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});

  // Firebase auth
  onAuthChange(async user=>{
    if(!user)return;
    currentUID=user.uid;
    await loadFromFirebase(user.uid);
    renderHUD();renderHistory();
    console.log('✅ Tienda Firebase OK:',user.uid);
  });
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
else boot();