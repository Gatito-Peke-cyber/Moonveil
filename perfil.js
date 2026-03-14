/* =====================================================
   Moonveil Portal — perfil.js  (módulo ES)
   Firebase Auth + Firestore sincronizado
   localStorage = caché rápido
   Firestore    = persistencia real
   ===================================================== */
'use strict';

import { onAuthChange, logout }   from './auth.js';
import {
  syncAllToLocalStorage,
  updateUserProfile,
  saveMisionesEstado,
  saveBuzonEstado,
  addTimelineEventDB,
  saveBadges,
  saveMissionResets,
  pushLocalToFirestore,
} from './database.js';

/* ── KEYS localStorage ── */
const PERFIL_KEY    = 'mv_perfil';
const BADGES_KEY    = 'mv_badges';
const MISSION_KEY   = 'mv_misiones';
const TIMELINE_KEY  = 'mv_timeline';
const BUZON_KEY     = 'mv_buzon_estado';
const LAST_VISIT_KEY= 'mv_last_visit';
const RESET_KEY     = 'mv_mission_resets';
const BASELINE_KEY  = 'mv_baselines';
const BADGE_SEEN_KEY= 'mv_badges_seen';

/* ── UID del usuario activo (asignado tras auth) ── */
let currentUID = null;

/* ── LEVEL THRESHOLDS ── */
const LEVEL_THR   = [0,100,250,450,700,1000,1400,1850,2400,3000,3700,4500,5500,6800,8400,10200];
const LEVEL_NAMES = ['NOVATO','EXPLORADOR','COMBATIENTE','GUERRERO','ÉLITE','CAMPEÓN','MAESTRO','LEYENDA','SEMIDIÓS','INMORTAL','ARCANO','SUPREMO','MÍTICO','DIVINO','ETERNO','ABSOLUTO'];

/* ── BADGES ── */
const BADGES = [
  { id:'b_newcomer',  icon:'🌱', name:'RECIÉN LLEGADO',   desc:'Únete al Portal',              req:'registro',    xp:50,  cat:'portal'    },
  { id:'b_daily1',    icon:'🔥', name:'RACHA x3',          desc:'3 días seguidos activo',       req:'racha>=3',    xp:40,  cat:'racha'     },
  { id:'b_daily2',    icon:'💥', name:'RACHA x7',          desc:'7 días seguidos activo',       req:'racha>=7',    xp:80,  cat:'racha'     },
  { id:'b_daily3',    icon:'🌋', name:'RACHA x30',         desc:'30 días seguidos activo',      req:'racha>=30',   xp:300, cat:'racha'     },
  { id:'b_xp1',       icon:'⚡', name:'100 XP',            desc:'Acumular 100 XP',              req:'xp>=100',     xp:20,  cat:'xp'        },
  { id:'b_xp2',       icon:'💎', name:'1K XP',             desc:'Acumular 1000 XP',             req:'xp>=1000',    xp:80,  cat:'xp'        },
  { id:'b_xp3',       icon:'👑', name:'10K XP',            desc:'Acumular 10000 XP',            req:'xp>=10000',   xp:400, cat:'xp'        },
  { id:'b_lv5',       icon:'⭐', name:'NIVEL 5',            desc:'Alcanzar el nivel 5',          req:'nivel>=5',    xp:75,  cat:'portal'    },
  { id:'b_lv10',      icon:'💫', name:'NIVEL 10',           desc:'Alcanzar el nivel 10',         req:'nivel>=10',   xp:150, cat:'portal'    },
  { id:'b_lv15',      icon:'🚀', name:'NIVEL MÁXIMO',       desc:'Alcanzar el nivel 15',         req:'nivel>=15',   xp:500, cat:'legendaria'},
  { id:'b_m5',        icon:'⚔️', name:'5 MISIONES',         desc:'Completar 5 misiones',         req:'misiones>=5', xp:50,  cat:'pvp'       },
  { id:'b_m20',       icon:'🏹', name:'20 MISIONES',        desc:'Completar 20 misiones',        req:'misiones>=20',xp:150, cat:'pvp'       },
  { id:'b_m50',       icon:'🗡️', name:'50 MISIONES',        desc:'Completar 50 misiones',        req:'misiones>=50',xp:400, cat:'pvp'       },
  { id:'b_hour8',     icon:'⏱', name:'HORA LIBRE',         desc:'8h en el portal',              req:'horas>=8',    xp:60,  cat:'portal'    },
  { id:'b_hour24',    icon:'🕐', name:'VETERANO',           desc:'24h en el portal',             req:'horas>=24',   xp:120, cat:'portal'    },
  { id:'b_badge5',    icon:'🎖️', name:'COLECCIONISTA',      desc:'Obtener 5 insignias',          req:'badges>=5',   xp:60,  cat:'portal'    },
  { id:'b_badge10',   icon:'🏅', name:'CAZADOR',            desc:'Obtener 10 insignias',         req:'badges>=10',  xp:120, cat:'portal'    },
  { id:'b_badge20',   icon:'🌟', name:'LEYENDA DEL PORTAL', desc:'Obtener 20 insignias',         req:'badges>=20',  xp:500, cat:'legendaria'},
  { id:'b_hidden1',   icon:'❓', name:'???',                desc:'Misterio por descubrir…',      req:'oculta_1',    xp:200, cat:'oculta'    },
  { id:'b_hidden2',   icon:'🌀', name:'NEXO OSCURO',        desc:'Solo los elegidos lo saben',   req:'oculta_2',    xp:500, cat:'oculta'    },
  { id:'b_portal1',   icon:'🌙', name:'HIJO DE MOONVEIL',   desc:'Ser miembro del portal',       req:'dias>=7',     xp:100, cat:'portal'    },
  { id:'b_portal2',   icon:'🏰', name:'CIUDADANO',          desc:'30 días como miembro',         req:'dias>=30',    xp:200, cat:'portal'    },
  { id:'b_pvp1',      icon:'🥊', name:'PRIMER COMBATE',     desc:'Completa tu primera misión PvP',req:'pvp>=1',     xp:50,  cat:'pvp'       },
  { id:'b_pvp10',     icon:'🏆', name:'GLADIADOR',          desc:'10 misiones PvP completadas',  req:'pvp>=10',     xp:250, cat:'legendaria'},
];

/* ── MISIONES ── */
const MISSION_DEF = {
  daily: [
    { id:'d01', name:'PRIMERA VISITA',  desc:'Visita tu perfil hoy',          icon:'👤', max:1,   xp:10,  tipo:'daily' },
    { id:'d02', name:'EXPLORADOR',      desc:'Visita 3 secciones distintas',  icon:'🗺️', max:3,   xp:15,  tipo:'daily' },
    { id:'d03', name:'RACHA ACTIVA',    desc:'Mantén tu racha de hoy',        icon:'🔥', max:1,   xp:10,  tipo:'daily' },
    { id:'d04', name:'BUZÓN HOY',       desc:'Lee un mensaje del buzón',      icon:'📬', max:1,   xp:10,  tipo:'daily' },
    { id:'d05', name:'5 MINUTOS',       desc:'Pasa 5 min en el portal',       icon:'⏱', max:1,   xp:10,  tipo:'daily' },
    { id:'d06', name:'INSIGNIAS',       desc:'Revisa tus insignias hoy',      icon:'🏆', max:1,   xp:5,   tipo:'daily' },
  ],
  weekly: [
    { id:'w01', name:'RACHA x5',        desc:'5 días activos esta semana',    icon:'🔥', max:5,   xp:80,  tipo:'weekly' },
    { id:'w02', name:'XP x100',         desc:'Gana 100 XP esta semana',       icon:'⚡', max:100, xp:100, tipo:'weekly' },
    { id:'w03', name:'BUZÓN LIMPIO',    desc:'Lee todos los mensajes',        icon:'📭', max:1,   xp:40,  tipo:'weekly' },
    { id:'w04', name:'10 MISIONES',     desc:'Completa 10 misiones total',    icon:'⚔️', max:10,  xp:90,  tipo:'weekly' },
    { id:'w05', name:'PERFIL COMPLETO', desc:'Actualiza tu nombre o avatar',  icon:'👤', max:1,   xp:50,  tipo:'weekly' },
    { id:'w06', name:'ACTIVIDAD',       desc:'Registra 5 eventos en timeline',icon:'📜', max:5,   xp:60,  tipo:'weekly' },
  ],
  monthly: [
    { id:'m01', name:'50 MISIONES',     desc:'Completa 50 misiones total',    icon:'🏃', max:50,  xp:200, tipo:'monthly' },
    { id:'m02', name:'RACHA x20',       desc:'Racha de 20 días activo',       icon:'🌋', max:20,  xp:250, tipo:'monthly' },
    { id:'m03', name:'XP x500',         desc:'Acumula 500 XP este mes',       icon:'💰', max:500, xp:180, tipo:'monthly' },
    { id:'m04', name:'NIVEL UP',        desc:'Sube al menos un nivel',        icon:'🆙', max:1,   xp:150, tipo:'monthly' },
    { id:'m05', name:'10 INSIGNIAS',    desc:'Desbloquea 10 insignias',       icon:'🏅', max:10,  xp:300, tipo:'monthly' },
  ],
};

/* ── BUZÓN ── */
const BUZON_MESSAGES = [
  { id:'bz01', cat:'novedad', icon:'🆕', title:'¡NUEVO TORNEO PvP DISPONIBLE!',   text:'El Torneo Semanal de Moonveil ya está activo. ¡Inscríbete y compite por el Top 1 del ranking! Recompensas épicas para los 3 primeros.',                               fecha: new Date(Date.now()-1*60*60*1000).toISOString(),   expira: null },
  { id:'bz02', cat:'evento',  icon:'⏰', title:'RAID NOCTURNO — 2H PARA EMPEZAR', text:'El Raid Nocturno de esta semana comenzará en 2 horas. Prepara tu equipo y alista tus estrategias.',                                                                        fecha: new Date(Date.now()-2*60*60*1000).toISOString(),   expira: new Date(Date.now()+20*60*60*1000).toISOString() },
  { id:'bz03', cat:'logro',   icon:'🏆', title:'¡BIENVENIDO AL PORTAL!',           text:'Has completado el registro en Moonveil Portal. Tu avatar y perfil ya están activos. ¡Explora todas las secciones y acumula XP!',                                          fecha: new Date(Date.now()-1*24*60*60*1000).toISOString(), expira: null },
  { id:'bz04', cat:'sistema', icon:'🔧', title:'MANTENIMIENTO PROGRAMADO',         text:'El portal estará en mantenimiento el próximo domingo de 2:00 a 4:00 AM (hora local). Guarda tu progreso con anticipación.',                                               fecha: new Date(Date.now()-2*24*60*60*1000).toISOString(), expira: new Date(Date.now()-10*60*60*1000).toISOString() },
  { id:'bz05', cat:'novedad', icon:'🎉', title:'TEMPORADA DE LUNA OSCURA',         text:'¡Comienza la Temporada de Luna Oscura! Nuevos eventos, 3 insignias especiales de temporada y misiones exclusivas por tiempo limitado.',                                   fecha: new Date(Date.now()-2*24*60*60*1000).toISOString(), expira: new Date(Date.now()+25*24*60*60*1000).toISOString() },
  { id:'bz06', cat:'evento',  icon:'⚡', title:'MISIONES DIARIAS PENDIENTES',       text:'Tienes misiones diarias sin completar. ¡Complétalas antes de medianoche para mantener tu racha y no perder los bonos XP!',                                               fecha: new Date(Date.now()-3*24*60*60*1000).toISOString(), expira: null },
  { id:'bz07', cat:'logro',   icon:'🌟', title:'RACHA DE 7 DÍAS DESBLOQUEADA',     text:'¡Felicitaciones! Mantuviste una racha de 7 días seguidos. Has desbloqueado la insignia "RACHA x7" y 80 XP de bonificación extra.',                                       fecha: new Date(Date.now()-4*24*60*60*1000).toISOString(), expira: null },
  { id:'bz08', cat:'novedad', icon:'🌙', title:'ACTUALIZACIÓN DEL PORTAL v2.6',    text:'Moonveil Portal se ha actualizado a la versión 2.6. Nuevo sistema de buzón, insignias mejoradas, perfiles con edición de nombre, y más.',                                fecha: new Date(Date.now()-5*24*60*60*1000).toISOString(), expira: null },
  { id:'bz09', cat:'sistema', icon:'🔒', title:'AVISO DE PRIVACIDAD ACTUALIZADO',  text:'Hemos actualizado nuestra política de privacidad. Los cambios entran en vigor en 30 días. Puedes leer los detalles en la sección de Soporte.',                          fecha: new Date(Date.now()-7*24*60*60*1000).toISOString(), expira: new Date(Date.now()+23*24*60*60*1000).toISOString() },
  { id:'bz10', cat:'evento',  icon:'🎯', title:'¡BANCO A LA VISTA ACTIVO!',        text:'El evento permanente Banco a la Vista sigue activo. Los cerditos esperan ser llenados. ¡Acumula XP y sube de rango sin límite!',                                         fecha: new Date(Date.now()-8*24*60*60*1000).toISOString(), expira: null },
];

/* ── AVATARS ── */
const AVATARS = ['🌙','🦊','🐱','🐸','🦄','🐧','🦁','🐼','🤖','👾','🧙','🌟','🐉','🦅','🐢','🎮','⚔️','💎','🔮','🎯','🌈','🏆','👑','🚀'];

/* ── HELPERS ── */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
function ls(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }
function lsSet(k,v) { localStorage.setItem(k, JSON.stringify(v)); }

function toast(msg, type = 'success') {
  const t = $('#toast'); if (!t) return;
  t.textContent = msg; t.className = `show ${type}`;
  clearTimeout(t._tid);
  t._tid = setTimeout(() => { t.className = ''; }, 2800);
}

/* ── Sync helpers: llama a Firebase en background, sin bloquear UI ── */
function fbSaveProfile(data)       { if (currentUID) updateUserProfile(currentUID, data).catch(console.warn); }
function fbSaveMissions(state)     { if (currentUID) saveMisionesEstado(currentUID, state).catch(console.warn); }
function fbSaveBuzon(state)        { if (currentUID) saveBuzonEstado(currentUID, state).catch(console.warn); }
function fbSaveTimeline(event)     { if (currentUID) addTimelineEventDB(currentUID, event).catch(console.warn); }
function fbSaveBadgesList(arr)     { if (currentUID) saveBadges(currentUID, arr).catch(console.warn); }
function fbSaveResets(r,b)         { if (currentUID) saveMissionResets(currentUID, r, b).catch(console.warn); }

function getProfile()   { return ls(PERFIL_KEY)   || { nombre:'INVITADO', email:'', avatar:'🌙', xp:0, racha:0, nivel:1, horas:0, registrado: new Date().toISOString() }; }
function getMissions()  { return ls(MISSION_KEY)  || {}; }
function getTimeline()  { return ls(TIMELINE_KEY) || []; }
function getBuzonState(){ return ls(BUZON_KEY)    || {}; }
function getBadges()    { return ls(BADGES_KEY)   || []; }
function getBaselines() { return ls(BASELINE_KEY) || {}; }

/* ── LEVEL ── */
function computeLevel(xp) {
  let lv = 1;
  for (let i = 0; i < LEVEL_THR.length; i++) if (xp >= LEVEL_THR[i]) lv = i+1;
  return Math.min(lv, LEVEL_THR.length);
}
function xpForNextLevel(lv, xp) {
  const idx = lv;
  if (idx >= LEVEL_THR.length) return { pct:100 };
  const base = LEVEL_THR[lv-1], next = LEVEL_THR[idx];
  return { pct: Math.min(100, ((xp-base)/(next-base))*100) };
}

/* ── DATES ── */
function timeAgo(iso) {
  const d = new Date(iso), now = new Date(), s = Math.floor((now-d)/1000);
  if (s < 60)    return 'hace un momento';
  if (s < 3600)  return `hace ${Math.floor(s/60)}m`;
  if (s < 86400) return `hace ${Math.floor(s/3600)}h`;
  if (s < 604800)return `hace ${Math.floor(s/86400)}d`;
  return d.toLocaleDateString('es-PE', { day:'2-digit', month:'short', year:'numeric' });
}
function formatDate(iso) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;
}
function getTodayStr()  { const n=new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`; }
function getWeekStr()   { const d=new Date(); d.setHours(0,0,0,0); const day=d.getDay(), diff=day===0?-6:1-day; d.setDate(d.getDate()+diff); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function getMonthStr()  { const n=new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`; }

/* ── EARNED BADGES ── */
function getEarnedBadgeIds(p) {
  const xp=p.xp||0, racha=p.racha||0, lv=computeLevel(xp);
  const mDone = Object.values(getMissions()).filter(m=>m?.done).length;
  const earned = new Set(getBadges());
  const memberDays = Math.floor((new Date()-new Date(p.registrado||0))/86400000);

  for (const b of BADGES) {
    let pass = false; const r = b.req;
    if      (r==='registro')  pass = true;
    else if (r==='oculta_1')  pass = racha>=5 && xp>=500;
    else if (r==='oculta_2')  pass = lv>=8 && mDone>=30;
    else {
      const m = r.match(/^(\w+)>=([\d.]+)$/);
      if (m) {
        const [,key,val] = m, v = Number(val);
        switch(key) {
          case 'racha':    pass = racha    >= v; break;
          case 'xp':       pass = xp       >= v; break;
          case 'nivel':    pass = lv       >= v; break;
          case 'misiones': pass = mDone    >= v; break;
          case 'horas':    pass = (p.horas||0) >= v; break;
          case 'dias':     pass = memberDays >= v; break;
          case 'pvp':      pass = mDone    >= v; break;
          case 'badges':   pass = earned.size >= v; break;
        }
      }
    }
    if (pass) earned.add(b.id);
  }
  for (const b of BADGES) {
    const m = b.req.match(/^badges>=(\d+)$/);
    if (m && earned.size >= Number(m[1])) earned.add(b.id);
  }
  const arr = [...earned]; lsSet(BADGES_KEY, arr);
  fbSaveBadgesList(arr);
  return earned;
}

/* ── RENDER HEADER ── */
function renderHeader() {
  const p = getProfile(), lv = computeLevel(p.xp||0);
  const earned = getEarnedBadgeIds(p);
  const mDone  = Object.values(getMissions()).filter(m=>m?.done).length;
  const lvInfo = xpForNextLevel(lv, p.xp||0);

  const set = (id,v) => { const el=$(`#${id}`); if(el) el.textContent=v; };
  set('profile-name',  (p.nombre||'INVITADO').toUpperCase());
  set('profile-email', p.email||'');
  set('profile-tag',   `▸ ${LEVEL_NAMES[lv-1]||'NOVATO'} · NIVEL ${lv}`);
  set('avatar-display', p.avatar||'🌙');
  set('level-num',  lv);
  set('xp-val',     p.xp||0);
  set('xp-next',    LEVEL_THR[lv] || 'MAX');
  set('xp-display', `⚡ ${p.xp||0} XP`);
  set('stat-insignias', earned.size);
  set('stat-racha',     p.racha||0);
  set('stat-misiones',  mDone);
  set('stat-xp',        p.xp||0);
  set('hero-rango',  LEVEL_NAMES[lv-1]||'NOVATO');
  set('hero-horas',  `${Math.floor(p.horas||0)}h`);
  set('hero-racha',  `🔥 ${p.racha||0} días`);
  set('hero-desde',  p.registrado ? formatDate(p.registrado) : '—');

  const xpBar = $('#xp-bar-fill');
  if (xpBar) xpBar.style.width = lvInfo.pct+'%';
}

/* ── STARS ── */
function initStars() {
  const canvas = $('#stars-canvas'); if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W = canvas.width = window.innerWidth, H = canvas.height = window.innerHeight;
  const COLORS = ['#30d158','#40ff6e','#ffffff','#00e5ff','#f5c518'];
  const stars = Array.from({length:130}, () => ({ x:Math.random()*W, y:Math.random()*H, r:Math.random()*1.5+0.5, o:Math.random()*0.5+0.1, speed:Math.random()*0.3+0.08, ci:Math.floor(Math.random()*COLORS.length) }));
  (function draw() {
    ctx.clearRect(0,0,W,H);
    stars.forEach(s => { ctx.globalAlpha=s.o; ctx.fillStyle=COLORS[s.ci]; ctx.fillRect(s.x,s.y,s.r,s.r); s.y-=s.speed; if(s.y<0){s.y=H;s.x=Math.random()*W;} });
    requestAnimationFrame(draw);
  })();
  window.addEventListener('resize', () => { W=canvas.width=window.innerWidth; H=canvas.height=window.innerHeight; });
}

/* ── LOADER ── */
function hideLoader() {
  const loader = $('#loader'); if (!loader) return;
  let w=0; const fill=$('#ld-fill');
  const iv = setInterval(() => {
    w += Math.random()*18+6; if(fill) fill.style.width=Math.min(w,100)+'%';
    if (w>=100) { clearInterval(iv); setTimeout(()=>{ loader.style.transition='opacity 0.4s'; loader.style.opacity='0'; setTimeout(()=>loader.style.display='none',400); },300); }
  }, 70);
}

/* ── RACHA ── */
function updateRacha() {
  const p = getProfile(), today = new Date().toDateString();
  const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
  if (lastVisit === today) return;
  const ayer = new Date(); ayer.setDate(ayer.getDate()-1);
  p.racha = lastVisit === ayer.toDateString() ? (p.racha||0)+1 : 1;
  localStorage.setItem(LAST_VISIT_KEY, today);
  lsSet(PERFIL_KEY, p);
  fbSaveProfile({ racha: p.racha });
}

/* ── MISSION RESETS ── */
function checkMissionResets() {
  const resets = ls(RESET_KEY)||{}, mState = getMissions();
  const bls = getBaselines(), p = getProfile();
  let changed = false;
  if (resets.daily !== getTodayStr()) {
    bls.daily = { xp:p.xp||0, misiones:Object.values(mState).filter(m=>m?.done).length };
    MISSION_DEF.daily.forEach(m => delete mState[m.id]);
    resets.daily = getTodayStr(); changed = true;
  }
  if (resets.weekly !== getWeekStr()) {
    bls.weekly = { xp:p.xp||0 }; MISSION_DEF.weekly.forEach(m => delete mState[m.id]);
    resets.weekly = getWeekStr(); changed = true;
  }
  if (resets.monthly !== getMonthStr()) {
    bls.monthly = { nivel:computeLevel(p.xp||0) }; MISSION_DEF.monthly.forEach(m => delete mState[m.id]);
    resets.monthly = getMonthStr(); changed = true;
  }
  if (changed) {
    lsSet(MISSION_KEY, mState); lsSet(RESET_KEY, resets); lsSet(BASELINE_KEY, bls);
    fbSaveMissions(mState);
    fbSaveResets(resets, bls);
  }
}

/* ── SECTIONS VISITED ── */
function getSectionsToday() {
  const today = new Date().toDateString();
  try { const d=JSON.parse(localStorage.getItem('mv_sections')||'{}'); return d.date===today ? d : {date:today,sections:[]}; }
  catch { return {date:today,sections:[]}; }
}
function recordSectionVisit(tabName) {
  const data = getSectionsToday();
  if (!data.sections.includes(tabName)) { data.sections.push(tabName); localStorage.setItem('mv_sections', JSON.stringify(data)); }
  if (data.sections.length >= 3) completeMissionSilent('d02');
}

/* ── TIMELINE ── */
function addTimelineEvent(ev) {
  const event = { ...ev, fecha: new Date().toISOString() };
  const events = getTimeline(); events.unshift(event);
  if (events.length > 60) events.pop();
  lsSet(TIMELINE_KEY, events);
  fbSaveTimeline(event);
}
function countTimelineToday() {
  const today = new Date().toDateString();
  return getTimeline().filter(e => new Date(e.fecha).toDateString()===today).length;
}

/* ── MISSION COMPLETE ── */
function completeMission(mid, silent=false) {
  const all = [...MISSION_DEF.daily,...MISSION_DEF.weekly,...MISSION_DEF.monthly];
  const m = all.find(x => x.id===mid); if (!m) return;
  const mState = getMissions(); if (mState[mid]?.done) return;
  mState[mid] = { prog:m.max, done:true };
  lsSet(MISSION_KEY, mState);
  const p = getProfile(); p.xp = (p.xp||0)+m.xp; lsSet(PERFIL_KEY, p);
  addTimelineEvent({ icon:'⚔️', title:`Misión: ${m.name}`, detail:`+${m.xp} XP` });
  fbSaveMissions(mState);
  fbSaveProfile({ xp: p.xp });
  if (!silent) { toast(`⚔️ ${m.name} +${m.xp} XP`,'success'); renderMissions(); renderHeader(); renderResumen(); }
}
function completeMissionSilent(mid) { completeMission(mid, true); }

/* ── COUNTDOWN ── */
function formatCountdown(secs) {
  if (secs<=0) return '00m 00s'; const pad=n=>String(n).padStart(2,'0');
  const d=Math.floor(secs/86400), h=Math.floor((secs%86400)/3600), min=Math.floor((secs%3600)/60), s=secs%60;
  if (d>0) return `${d}d ${pad(h)}h ${pad(min)}m`;
  if (h>0) return `${pad(h)}h ${pad(min)}m ${pad(s)}s`;
  return `${pad(min)}m ${pad(s)}s`;
}
function getSecsUntilReset() {
  const now=new Date();
  const nextMidnight=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1);
  const dailySecs=Math.max(0,Math.floor((nextMidnight-now)/1000));
  const ws=new Date(now); ws.setHours(0,0,0,0); const day=ws.getDay(); ws.setDate(ws.getDate()+(day===0?1:8-day));
  const weeklySecs=Math.max(0,Math.floor((ws-now)/1000));
  const nextMonth=new Date(now.getFullYear(),now.getMonth()+1,1);
  return { dailySecs, weeklySecs, monthlySecs:Math.max(0,Math.floor((nextMonth-now)/1000)) };
}
let countdownInterval;
function startCountdowns() {
  function update() {
    const {dailySecs,weeklySecs,monthlySecs}=getSecsUntilReset();
    const d=$('#cd-daily-val');   if(d)  d.textContent=formatCountdown(dailySecs);
    const w=$('#cd-weekly-val');  if(w)  w.textContent=formatCountdown(weeklySecs);
    const mo=$('#cd-monthly-val');if(mo) mo.textContent=formatCountdown(monthlySecs);
  }
  update();
  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(update, 1000);
}

/* ── RENDER RESUMEN ── */
function renderResumen() {
  const p=getProfile(), earned=getEarnedBadgeIds(p);
  const mDone=Object.values(getMissions()).filter(m=>m?.done).length;
  const safe=(n,max)=>Math.min(100,(n/max)*100).toFixed(0)+'%';
  const set=(id,v)=>{const el=$(`#${id}`);if(el)el.textContent=v;};
  set('rc-xp',p.xp||0); set('rc-racha',p.racha||0);
  set('rc-insignias',earned.size); set('rc-misiones',mDone);
  const bXp=$('#rc-bar-xp');    if(bXp)    bXp.style.width=safe(p.xp||0,10000);
  const bRacha=$('#rc-bar-racha');if(bRacha)bRacha.style.width=safe(p.racha||0,30);
  const bInsig=$('#rc-bar-insig');if(bInsig)bInsig.style.width=safe(earned.size,BADGES.length);
  const bMis=$('#rc-bar-mis');  if(bMis)  bMis.style.width=safe(mDone,50);
  const events=getTimeline().slice(0,5);
  const rTl=$('#resumen-timeline');
  if (rTl) {
    rTl.innerHTML = events.length
      ? events.map(e=>`<div class="mini-event"><span class="me-icon">${e.icon||'📌'}</span><div><div class="me-text">${e.title}</div><div class="me-time">${timeAgo(e.fecha)}</div></div></div>`).join('')
      : '<p style="font-family:var(--font-pixel);font-size:0.32rem;color:var(--muted)">SIN ACTIVIDAD AÚN</p>';
  }
}

/* ── RENDER BADGES ── */
let badgeCatFilter = '';
function renderBadges() {
  const p=getProfile(), earnedIds=getEarnedBadgeIds(p);
  const seen=ls(BADGE_SEEN_KEY)||[];
  const filtered=badgeCatFilter ? BADGES.filter(b=>b.cat===badgeCatFilter) : BADGES;
  const set=(id,v)=>{const el=$(`#${id}`);if(el)el.textContent=v;};
  set('badges-earned',earnedIds.size); set('badges-total',BADGES.length);
  const bbEl=$('#badges-bar-fill');if(bbEl)bbEl.style.width=(earnedIds.size/BADGES.length*100).toFixed(0)+'%';
  const grid=$('#badges-grid'); if(!grid) return;
  grid.innerHTML=filtered.map(b=>{
    const isEarned=earnedIds.has(b.id), isNew=isEarned&&!seen.includes(b.id);
    return `<div class="badge-card ${isEarned?'earned':'locked'} ${isNew?'badge-new-glow':''} reveal" data-bid="${b.id}">
      ${!isEarned?'<span class="badge-locked-label">🔒</span>':''}
      <span class="badge-icon">${b.icon}</span>
      <div class="badge-name">${b.name}</div>
      <div class="badge-desc">${b.desc}</div>
      <div class="badge-xp">${isEarned?`✓ +${b.xp} XP`:`🔒 +${b.xp} XP`}</div>
    </div>`;
  }).join('');
  requestAnimationFrame(()=>{ $$('#badges-grid .reveal').forEach((el,i)=>setTimeout(()=>el.classList.add('visible'),i*25)); });
  const newBadges=[...earnedIds].filter(id=>!seen.includes(id));
  if (newBadges.length) {
    lsSet(BADGE_SEEN_KEY,[...seen,...newBadges]);
    setTimeout(()=>celebrateBadge(BADGES.find(b=>b.id===newBadges[0])),600);
  }
}
function celebrateBadge(badge) {
  if (!badge) return;
  const modal=$('#badge-modal'), body=$('#badge-modal-body'); if(!modal||!body) return;
  body.innerHTML=`<div class="badge-celebrate"><span class="bc-icon">${badge.icon}</span><div class="bc-title">✦ INSIGNIA DESBLOQUEADA ✦</div><div class="bc-name">${badge.name}</div><div class="bc-desc">${badge.desc}</div><div class="bc-xp">+${badge.xp} XP GANADOS</div></div>`;
  modal.classList.add('show'); document.body.style.overflow='hidden';
}

/* ── RENDER MISSIONS ── */
function renderMissions() {
  const p=getProfile(), mState=getMissions(), bls=getBaselines();
  const xp=p.xp||0, racha=p.racha||0;
  const mDone=Object.values(mState).filter(m=>m?.done).length;
  const sections=getSectionsToday().sections.length, tlToday=countTimelineToday();
  const {dailySecs,weeklySecs,monthlySecs}=getSecsUntilReset();
  const bWeek=bls.weekly||{xp:0}, bMonth=bls.monthly||{nivel:1};

  function computeProg(m,st) {
    if(st?.done) return m.max;
    let prog=st?.prog||0;
    switch(m.id) {
      case 'd01': prog=1; break;
      case 'd02': prog=Math.min(sections,m.max); break;
      case 'd03': prog=racha>=1?1:0; break;
      case 'd04': prog=st?.prog||0; break;
      case 'd05': prog=st?.prog||0; break;
      case 'd06': prog=st?.prog||0; break;
      case 'w01': prog=Math.min(racha,m.max); break;
      case 'w02': prog=Math.min(Math.max(0,xp-(bWeek.xp||0)),m.max); break;
      case 'w03': prog=st?.prog||0; break;
      case 'w04': prog=Math.min(mDone,m.max); break;
      case 'w05': prog=st?.prog||0; break;
      case 'w06': prog=Math.min(tlToday,m.max); break;
      case 'm01': prog=Math.min(mDone,m.max); break;
      case 'm02': prog=Math.min(racha,m.max); break;
      case 'm03': prog=Math.min(Math.max(0,xp-(bMonth.xp||0)),m.max); break;
      case 'm04': prog=Math.min(Math.max(0,computeLevel(xp)-(bMonth.nivel||1)),m.max); break;
      case 'm05': prog=Math.min(getEarnedBadgeIds(p).size,m.max); break;
    }
    return prog;
  }

  function renderGroup(defs, containerId, cdId, cdSecs, cdClass) {
    const el=$(containerId); if(!el) return;
    const col=el.closest('.missions-col');
    let cdWrap=document.getElementById(cdId);
    if (!cdWrap&&col) { cdWrap=document.createElement('div'); cdWrap.className=`mission-countdown ${cdClass}`; cdWrap.id=cdId; col.insertBefore(cdWrap,el); }
    if (cdWrap) cdWrap.innerHTML=`<span class="cd-icon">⟳</span><span class="cd-label">RESET EN:</span><span class="cd-val" id="${cdId}-val">${formatCountdown(cdSecs)}</span>`;
    el.innerHTML=defs.map(m=>{
      const st=mState[m.id], prog=computeProg(m,st), done=st?.done||prog>=m.max;
      const pct=Math.min(100,(prog/m.max)*100).toFixed(0), canClaim=!st?.done&&prog>=m.max;
      return `<div class="mission-item ${done?'done':''}" data-mid="${m.id}">
        <div class="mi-header"><span class="mi-name">${m.icon} ${m.name}</span><span class="mi-xp">+${m.xp} XP</span></div>
        <div class="mi-desc">${m.desc}</div>
        <div class="mi-progress"><div class="mi-progress-fill" style="width:${done?100:pct}%"></div></div>
        <div class="mi-foot">
          <span class="mi-count">${done?m.max:prog}/${m.max}</span>
          ${done?`<span class="mi-done-label">✓ COMPLETA</span>`:canClaim?`<button class="btn btn-complete" data-mid="${m.id}">⚡ RECLAMAR</button>`:prog>0?`<span class="mi-prog-label">${pct}%</span>`:''}
        </div>
      </div>`;
    }).join('');
    el.querySelectorAll('.btn-complete').forEach(btn => btn.addEventListener('click', ()=>{ completeMission(btn.dataset.mid); renderMissions(); }));
  }

  renderGroup(MISSION_DEF.daily,   '#mission-daily',   'cd-daily',   dailySecs,   'daily');
  renderGroup(MISSION_DEF.weekly,  '#mission-weekly',  'cd-weekly',  weeklySecs,  'weekly');
  renderGroup(MISSION_DEF.monthly, '#mission-monthly', 'cd-monthly', monthlySecs, 'monthly');
  startCountdowns();
}

/* ── RENDER TIMELINE ── */
function renderTimeline() {
  const events=getTimeline(), tl=$('#timeline'), empty=$('#timeline-empty');
  if(!tl) return;
  if(!events.length) { tl.style.display='none'; if(empty)empty.style.display='block'; return; }
  tl.style.display=''; if(empty)empty.style.display='none';
  tl.innerHTML=events.map((e,i)=>`<div class="tl-event">
    <div class="tl-icon-wrap"><div class="tl-icon">${e.icon||'📌'}</div>${i<events.length-1?'<div class="tl-line"></div>':''}</div>
    <div class="tl-body"><div class="tl-title">${e.title}</div>${e.detail?`<div class="tl-detail">${e.detail}</div>`:''}<div class="tl-time">${timeAgo(e.fecha)}</div></div>
  </div>`).join('');
}

/* ── BUZÓN ── */
let buzonFilter='';
function isBuzonExpired(msg) { return msg.expira && new Date()>new Date(msg.expira); }
function getBuzonExpireInfo(msg) {
  if(!msg.expira) return null;
  const now=new Date(), exp=new Date(msg.expira);
  if(now>exp) return {expired:true,label:'CADUCADO'};
  const diffMs=exp-now, diffH=Math.floor(diffMs/3600000), diffD=Math.floor(diffH/24), urgent=diffH<24;
  const label=diffD>1?`Caduca en ${diffD}d`:diffH>=1?`Caduca en ${diffH}h`:`Caduca en ${Math.floor(diffMs/60000)}m`;
  return {expired:false,label,urgent};
}
function formatBuzonDate(iso) {
  const d=new Date(iso), now=new Date(), diffMs=now-d, diffH=Math.floor(diffMs/3600000), diffMin=Math.floor(diffMs/60000);
  if(diffMin<1) return 'hace un momento';
  if(diffMin<60) return `hace ${diffMin}m`;
  if(diffH<24) return `hace ${diffH}h`;
  const dd=String(d.getDate()).padStart(2,'0'), mm=String(d.getMonth()+1).padStart(2,'0');
  return `${dd}-${mm}-${d.getFullYear()}`;
}
function renderBuzon() {
  const state=getBuzonState();
  let msgs=[...BUZON_MESSAGES]; if(buzonFilter) msgs=msgs.filter(m=>m.cat===buzonFilter);
  const unread=BUZON_MESSAGES.filter(m=>!state[m.id]&&!isBuzonExpired(m)).length;
  const cEl=$('#buzon-unread-count'); if(cEl){cEl.textContent=unread||'';cEl.style.display=unread?'':'none';}
  const tabBuzon=$('[data-tab="buzon"]'); if(tabBuzon) tabBuzon.textContent=unread>0?`📬 BUZÓN (${unread})`:`📬 BUZÓN`;
  const list=$('#buzon-list'), empty=$('#buzon-empty'); if(!list) return;
  if(!msgs.length){list.innerHTML='';if(empty)empty.style.display='block';return;}
  if(empty)empty.style.display='none';
  list.innerHTML=msgs.map(m=>{
    const read=!!state[m.id], expired=isBuzonExpired(m), expInfo=getBuzonExpireInfo(m);
    let expBadge='';
    if(expInfo){if(expInfo.expired)expBadge=`<span class="bm-expire expired">💀 CADUCADO</span>`;else if(expInfo.urgent)expBadge=`<span class="bm-expire urgent">⚡ ${expInfo.label}</span>`;else expBadge=`<span class="bm-expire normal">⏳ ${expInfo.label}</span>`;}
    return `<div class="buzon-msg ${read?'read':'unread'} ${expired?'buzon-expired':''}" data-bid="${m.id}">
      <span class="bm-icon">${m.icon}</span>
      <div class="bm-body">
        <div class="bm-header"><span class="bm-title">${m.title}</span><span class="bm-cat ${m.cat}">${m.cat.toUpperCase()}</span>${expBadge}</div>
        <div class="bm-text">${m.text}</div>
        <div class="bm-footer"><div class="bm-time">📅 ${formatBuzonDate(m.fecha)}</div>${expired?'<div style="font-family:var(--font-pixel);font-size:0.24rem;color:var(--muted)">Mensaje caducado</div>':''}</div>
      </div>
      ${!read&&!expired?'<div class="bm-unread-dot"></div>':''}
    </div>`;
  }).join('');
  list.querySelectorAll('.buzon-msg:not(.buzon-expired)').forEach(el=>el.addEventListener('click',()=>markBuzonRead(el.dataset.bid)));
}
function markBuzonRead(id) {
  const state=getBuzonState(); if(state[id]) return;
  state[id]=true; lsSet(BUZON_KEY,state);
  fbSaveBuzon(state);
  completeMissionSilent('d04');
  renderBuzon(); renderMissions(); renderHeader();
  toast('📬 MENSAJE LEÍDO','success');
}

/* ── TABS ── */
function initTabs() {
  $$('.tab').forEach(tab=>{
    tab.addEventListener('click',()=>{
      $$('.tab').forEach(t=>t.classList.remove('active'));
      $$('.tab-panel').forEach(p=>p.classList.remove('active'));
      tab.classList.add('active');
      const panel=$(`#tab-${tab.dataset.tab}`); if(panel)panel.classList.add('active');
      recordSectionVisit(tab.dataset.tab);
      switch(tab.dataset.tab){
        case 'insignias': renderBadges(); completeMissionSilent('d06'); break;
        case 'misiones':  renderMissions(); break;
        case 'actividad': renderTimeline(); break;
        case 'buzon':     renderBuzon(); break;
        case 'resumen':   renderResumen(); break;
      }
    });
  });
}

/* ── AVATAR MODAL ── */
function initAvatar() {
  const btn=$('#btn-change-avatar'), modal=$('#avatar-modal'), close=$('#avatar-modal-close'), picker=$('#avatar-picker');
  if(!btn||!modal||!picker) return;
  btn.addEventListener('click',()=>{
    const p=getProfile();
    picker.innerHTML=AVATARS.map(av=>`<div class="av-opt ${av===p.avatar?'selected':''}" data-av="${av}">${av}</div>`).join('');
    picker.querySelectorAll('.av-opt').forEach(opt=>{
      opt.addEventListener('click',()=>{
        const p2=getProfile(); p2.avatar=opt.dataset.av; lsSet(PERFIL_KEY,p2);
        fbSaveProfile({ avatar: opt.dataset.av });
        modal.classList.remove('show'); document.body.style.overflow='';
        renderHeader(); completeMissionSilent('w05');
        addTimelineEvent({icon:'🎨',title:'Avatar actualizado',detail:opt.dataset.av});
        toast(`🎨 AVATAR: ${opt.dataset.av}`,'success');
      });
    });
    modal.classList.add('show'); document.body.style.overflow='hidden';
  });
  close?.addEventListener('click',()=>{modal.classList.remove('show');document.body.style.overflow='';});
  modal.addEventListener('click',e=>{if(e.target===modal){modal.classList.remove('show');document.body.style.overflow='';}});
}

/* ── EDIT NAME ── */
function initNameEdit() {
  const btnEdit=$('#btn-edit-name'), modal=$('#name-edit-modal'), input=$('#name-edit-input');
  const btnSave=$('#name-edit-save'), btnCancel=$('#name-edit-cancel'), btnClose=$('#name-edit-close'), charCount=$('#name-char-count');
  if(!btnEdit||!modal||!input||!btnSave) return;
  btnEdit.addEventListener('click',()=>{
    const p=getProfile(); input.value=p.nombre||''; updateChar();
    modal.classList.add('show'); document.body.style.overflow='hidden';
    setTimeout(()=>input.focus(),100);
  });
  function updateChar(){const len=input.value.trim().length;if(charCount)charCount.textContent=`${len}/24`;btnSave.disabled=len<2||len>24;}
  input.addEventListener('input',updateChar);
  input.addEventListener('keydown',e=>{if(e.key==='Enter')btnSave.click();if(e.key==='Escape')closeModal();});
  btnSave.addEventListener('click',async()=>{
    const newName=input.value.trim(); if(!newName||newName.length<2) return;
    btnSave.disabled=true; btnSave.textContent='⟳ GUARDANDO...';
    const p=getProfile(), old=p.nombre; p.nombre=newName; lsSet(PERFIL_KEY,p);
    fbSaveProfile({ nombre: newName });
    renderHeader(); closeModal();
    addTimelineEvent({icon:'✏️',title:'Nombre actualizado',detail:`${old} → ${newName}`});
    completeMissionSilent('w05');
    toast(`✓ NOMBRE: ${newName.toUpperCase()}`,'success');
    btnSave.disabled=false; btnSave.textContent='✓ GUARDAR';
  });
  function closeModal(){modal.classList.remove('show');document.body.style.overflow='';btnSave.disabled=false;btnSave.textContent='✓ GUARDAR';}
  btnClose?.addEventListener('click',closeModal);
  btnCancel?.addEventListener('click',closeModal);
  modal?.addEventListener('click',e=>{if(e.target===modal)closeModal();});
}

/* ── BADGE MODAL ── */
function initBadgeModal() {
  const close=$('#badge-modal-close'), modal=$('#badge-modal');
  close?.addEventListener('click',()=>{modal?.classList.remove('show');document.body.style.overflow='';});
  modal?.addEventListener('click',e=>{if(e.target===modal){modal.classList.remove('show');document.body.style.overflow='';}});
}

/* ── NAV ── */
function initNav() {
  const ham=$('#hamburger'), nav=$('#main-nav');
  if(ham&&nav) ham.addEventListener('click',()=>nav.classList.toggle('open'));
}

/* ── LOGOUT ── */
function initLogout() {
  $('#btn-logout')?.addEventListener('click', async () => {
    if (!confirm('¿Cerrar sesión?')) return;
    /* Sincronizar último estado antes de salir */
    if (currentUID) {
      toast('⟳ Guardando progreso...','info');
      await pushLocalToFirestore(currentUID);
    }
    await logout();
    window.location.href = 'index.html';
  });
}

/* ── BACK TO TOP ── */
function initBackToTop() {
  const btn=$('#back-top'); if(!btn) return;
  window.addEventListener('scroll',()=>btn.classList.toggle('show',window.scrollY>400));
  btn.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
}

/* ── RECORD VISIT ── */
function recordVisit() {
  updateRacha();
  const events=getTimeline(), today=new Date().toDateString();
  if(!events.some(e=>new Date(e.fecha).toDateString()===today&&e.title.includes('perfil'))) {
    addTimelineEvent({icon:'🌙',title:'Visitaste tu perfil',detail:'Hoy'});
  }
  completeMissionSilent('d01');
  const p=getProfile(); if((p.racha||0)>=1) completeMissionSilent('d03');
  recordSectionVisit('resumen');
  /* Misión de 5 minutos */
  setTimeout(()=>{ completeMissionSilent('d05'); renderMissions(); renderHeader(); }, 5*60*1000);
}

/* ── PLATFORM TIMER (Horas activo) ── */
function startHoursTimer() {
  /* Cada minuto suma 1/60 de hora y sincroniza con Firestore cada 5 min */
  let syncCounter = 0;
  setInterval(() => {
    const p=getProfile(); p.horas=(p.horas||0)+(1/60); lsSet(PERFIL_KEY,p);
    syncCounter++;
    if (syncCounter >= 5) {
      syncCounter=0;
      fbSaveProfile({ horas: p.horas });
    }
  }, 60*1000);
}

/* ── SYNC VISUAL INDICATOR ── */
function showSyncIndicator(text='⟳ SINCRONIZANDO...') {
  const xpBadge=$('#xp-display'); if(xpBadge)xpBadge.style.opacity='0.5';
  toast(text,'info');
}
function hideSyncIndicator() {
  const xpBadge=$('#xp-display'); if(xpBadge)xpBadge.style.opacity='1';
}

/* ──────────────────────────────────────────────────────
   MAIN — Con Firebase Auth
   ────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  hideLoader();
  initStars();
  initNav();
  initTabs();
  initAvatar();
  initNameEdit();
  initBadgeModal();
  initLogout();
  initBackToTop();

  /* Filtros de insignias */
  $$('.bf-btn').forEach(btn=>btn.addEventListener('click',()=>{
    $$('.bf-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active'); badgeCatFilter=btn.dataset.cat||'';
    renderBadges();
  }));

  /* Buzón controles */
  $('#btn-mark-all')?.addEventListener('click',()=>{
    const state=getBuzonState();
    BUZON_MESSAGES.filter(m=>!isBuzonExpired(m)).forEach(m=>{state[m.id]=true;});
    lsSet(BUZON_KEY,state); fbSaveBuzon(state);
    completeMissionSilent('d04'); completeMissionSilent('w03');
    renderBuzon(); renderMissions(); renderHeader(); toast('📭 TODOS LEÍDOS','success');
  });
  $('#buzon-filter')?.addEventListener('change',e=>{buzonFilter=e.target.value;renderBuzon();});

  /* Timeline: limpiar */
  $('#btn-clear-timeline')?.addEventListener('click',()=>{
    if(!confirm('¿Limpiar historial de actividad?')) return;
    lsSet(TIMELINE_KEY,[]);
    if(currentUID) addTimelineEventDB(currentUID,{}).catch(()=>{});
    renderTimeline(); toast('🗑 HISTORIAL BORRADO','error');
  });

  /* ── Observador de Firebase Auth ── */
  let firstLoad = true;
  onAuthChange(async (user) => {
    /* No autenticado → redirigir al login */
    if (!user) {
      window.location.href = 'index.html';
      return;
    }

    currentUID = user.uid;

    if (firstLoad) {
      firstLoad = false;
      showSyncIndicator('⟳ CARGANDO TU PROGRESO...');
      try {
        await syncAllToLocalStorage(user.uid);
        hideSyncIndicator();
        toast('✓ PROGRESO SINCRONIZADO','success');
      } catch (err) {
        hideSyncIndicator();
        console.warn('[Perfil] Error de sincronización:', err);
        toast('⚠ Usando datos locales','info');
      }

      /* Después del sync, inicializar todo */
      checkMissionResets();
      startHoursTimer();
      renderHeader();
      renderResumen();
      renderBuzon();
      recordVisit();

      /* Renderizar tab activo si no es el default */
      const activeTab = document.querySelector('.tab.active');
      if (activeTab && activeTab.dataset.tab !== 'resumen') {
        switch(activeTab.dataset.tab) {
          case 'insignias': renderBadges(); break;
          case 'misiones':  renderMissions(); break;
          case 'actividad': renderTimeline(); break;
          case 'buzon':     renderBuzon(); break;
        }
      }
    }
  });
});