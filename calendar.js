/**
 * calendar.js — MEJORADO
 *
 * Moonveil Daily Login — Calendario mensual con recompensas diarias.
 * NUEVAS CARACTERÍSTICAS:
 * - Días especiales con marcos dorados
 * - Fondos temáticos por mes
 * - Preview del siguiente mes mejorado (modal visual)
 * - Historial con estadísticas visuales
 * - Mejores animaciones y efectos
 */

/* ---------- Config / keys ---------- */
const LS_KEY_PREFIX = 'mv_daily_';
const LS_STREAK_KEY = 'mv_daily_streak';

// Fecha local exacta
const nowLocal = new Date();
const TODAY = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate());

/* ---------- Configuración de días especiales y temas ---------- */
const SPECIAL_DAYS = {
  // Días que tendrán marco dorado (generalmente badges, items especiales, etc.)
  // Puedes personalizar esto según tus recompensas
  badge: true,        // Todos los días con badges son especiales
  item_special: true, // Items marcados como especiales
  day_5: true,        // Día 5 de cada mes
  day_15: true,       // Día 15 de cada mes
  day_25: true,       // Día 25 de cada mes
  day_31: true,       // Último día (si existe)
};

// Temas por mes
const MONTH_THEMES = {
  10: 'october',    // Octubre - Halloween
  12: 'december',   // Diciembre - Navidad
  2: 'february',    // Febrero - San Valentín
  // Añade más meses según necesites
};

/* ---------- Reward definitions ---------- */
const MONTH_REWARDS = {
  '2025-10': [
    { day:1, type:'emerald', label:'Esmeraldas x5', value:5, icon:'💚', note:'Recompensa bienvenida del mes' },
    { day:2, type:'xp', label:'XP +150', value:150, icon:'⭐', note:'Pequeño impulso de XP' },
    { day:3, type:'coins', label:'Monedas x50', value:50, icon:'🪙' },
    { day:4, type:'item', label:'Pan', icon:'🍞', note:'Pan' },
    { day:5, type:'badge', label:'Insignia: Pionero', icon:'🏅', special: true },
    { day:6, type:'emerald', label:'Esmeraldas x10', value:10, icon:'💚' },
    { day:7, type:'xp', label:'XP +200', value:200, icon:'⭐' },
    { day:8, type:'coins', label:'Monedas x75', value:75, icon:'🪙' },
    { day:9, type:'item', label:'Antorcha', icon:'🔥' },
    { day:10, type:'emerald', label:'Esmeraldas x3', value:3, icon:'💚' },
    { day:11, type:'xp', label:'XP +120', value:120, icon:'⭐' },
    { day:12, type:'coins', label:'Monedas x60', value:60, icon:'🪙' },
    { day:13, type:'item', label:'Mapa antiguo', icon:'🗺️' },
    { day:14, type:'emerald', label:'Esmeraldas x7', value:7, icon:'💚' },
    { day:15, type:'xp', label:'XP +300', value:300, icon:'⭐', special: true },
    { day:16, type:'coins', label:'Monedas x100', value:100, icon:'🪙' },
    { day:17, type:'item', label:'Cofre pequeño', icon:'📦' },
    { day:18, type:'emerald', label:'Esmeraldas x4', value:4, icon:'💚' },
    { day:19, type:'xp', label:'XP +180', value:180, icon:'⭐' },
    { day:20, type:'coins', label:'Monedas x40', value:40, icon:'🪙' },
    { day:21, type:'item', label:'Pergamino', icon:'📜' },
    { day:22, type:'emerald', label:'Esmeraldas x6', value:6, icon:'💚' },
    { day:23, type:'xp', label:'XP +220', value:220, icon:'⭐' },
    { day:24, type:'coins', label:'Monedas x80', value:80, icon:'🪙' },
    { day:25, type:'item', label:'Poción Mágica', icon:'🧪', special: true },
    { day:26, type:'emerald', label:'Esmeraldas x12', value:12, icon:'💚' },
    { day:27, type:'xp', label:'XP +260', value:260, icon:'⭐' },
    { day:28, type:'coins', label:'Monedas x90', value:90, icon:'🪙' },
    { day:29, type:'item', label:'Estandarte', icon:'🧥', note:'Cosmético especial' },
    { day:30, type:'emerald', label:'Esmeraldas x20', value:20, icon:'💚' },
    { day:31, type:'badge', label:'Insignia: Completo', icon:'🏆', note:'Recompensa del mes (completa)', special: true }
  ],
  '2025-11': [
    { day:1, type:'emerald', label:'Esmeraldas x5', value:5, icon:'💚', note:'Recompensa bienvenida del mes' },
    { day:2, type:'xp', label:'XP +150', value:150, icon:'⭐', note:'Pequeño impulso de XP' },
    { day:3, type:'coins', label:'Monedas x50', value:50, icon:'🪙' },
    { day:4, type:'item', label:'Pan', icon:'🍞', note:'Pan' },
    { day:5, type:'badge', label:'1 Llave Dorada', icon:'🔑', special: true },
    { day:6, type:'emerald', label:'Esmeraldas x10', value:10, icon:'💚' },
    { day:7, type:'xp', label:'XP +200', value:200, icon:'⭐' },
    { day:8, type:'coins', label:'Monedas x75', value:75, icon:'🪙' },
    { day:9, type:'item', label:'Antorcha', icon:'🔥' },
    { day:10, type:'emerald', label:'Esmeraldas x3', value:3, icon:'💚' },
    { day:11, type:'xp', label:'XP +120', value:120, icon:'⭐' },
    { day:12, type:'coins', label:'Monedas x60', value:60, icon:'🪙' },
    { day:13, type:'item', label:'Mapa', icon:'🗺️' },
    { day:14, type:'emerald', label:'Esmeraldas x7', value:7, icon:'💚' },
    { day:15, type:'badge', label:'Gema Rara', icon:'💎', special: true },
    { day:16, type:'coins', label:'Monedas x100', value:100, icon:'🪙' },
    { day:17, type:'item', label:'Cofre', icon:'📦' },
    { day:18, type:'emerald', label:'Esmeraldas x4', value:4, icon:'💚' },
    { day:19, type:'xp', label:'XP +180', value:180, icon:'⭐' },
    { day:20, type:'coins', label:'Monedas x40', value:40, icon:'🪙' },
    { day:21, type:'item', label:'Mapa', icon:'📜' },
    { day:22, type:'emerald', label:'Esmeraldas x6', value:6, icon:'💚' },
    { day:23, type:'xp', label:'XP +220', value:220, icon:'⭐' },
    { day:24, type:'coins', label:'Monedas x80', value:80, icon:'🪙' },
    { day:25, type:'badge', label:'Armadura Élite', icon:'🛡️', special: true },
    { day:26, type:'emerald', label:'Esmeraldas x12', value:12, icon:'💚' },
    { day:27, type:'xp', label:'XP +260', value:260, icon:'⭐' },
    { day:28, type:'coins', label:'Monedas x90', value:90, icon:'🪙' },
    { day:29, type:'emerald', label:'Esmeraldas x20', value:20, icon:'💚' },
    { day:30, type:'badge', label:'Corona del Mes', icon:'👑', note:'Recompensa del mes (completa)', special: true }
  ],
  '2025-12': Array.from({length:31}, (_,i)=>({
    day: i+1,
    type: (i%5===0)?'emerald': (i%3===0)?'xp':'coins',
    label: (i%5===0)?`Esmeraldas x${(i%7)+3}`: (i%3===0)?`XP +${120 + (i*10)}`:`Monedas x${30 + (i*5)}`,
    icon: (i%5===0)?'💚': (i%3===0)?'⭐':'🪙',
    special: (i+1)%5===0 || (i+1)===31
  })),
  '2026-01': Array.from({length:31}, (_,i)=>({
    day: i+1,
    type: (i%5===0)?'emerald': (i%3===0)?'xp':'coins',
    label: (i%5===0)?`Esmeraldas x${(i%7)+3}`: (i%3===0)?`XP +${120 + (i*10)}`:`Monedas x${30 + (i*5)}`,
    icon: (i%5===0)?'💚': (i%3===0)?'⭐':'🪙',
    special: (i+1)%5===0 || (i+1)===31
  })),
  '2026-02': Array.from({length:28}, (_,i)=>({
    day: i+1,
    type: (i%5===0)?'emerald': (i%3===0)?'xp':'coins',
    label: (i%5===0)?`Esmeraldas x${(i%7)+3}`: (i%3===0)?`XP +${120 + (i*10)}`:`Monedas x${30 + (i*5)}`,
    icon: (i%5===0)?'💚': (i%3===0)?'⭐':'🪙',
    special: (i+1)%5===0 || (i+1)===14 || (i+1)===28
  }))
};

/* ---------- Utilities ---------- */
const $ = (s, ctx=document) => ctx.querySelector(s);
const $$ = (s, ctx=document) => Array.from((ctx||document).querySelectorAll(s));
const el = (t='div', p={}) => { const e=document.createElement(t); Object.assign(e,p); return e; };

function toast(msg, icon='✨', t=2500){ 
  const tEl = $('#loginToast'); 
  const tMsg = $('#toastMessage');
  const tIcon = $('#toastIcon');
  if(!tEl || !tMsg) { console.log(msg); return; } 
  tMsg.textContent = msg; 
  tIcon.textContent = icon;
  tEl.classList.add('show'); 
  clearTimeout(tEl._tm); 
  tEl._tm = setTimeout(()=> tEl.classList.remove('show'), t); 
}

/* Date helpers */
function ymKey(date){ 
  const y = date.getFullYear(); 
  const m = (date.getMonth()+1).toString().padStart(2,'0'); 
  return `${y}-${m}`; 
}

function daysInMonth(y,m){ return new Date(y,m,0).getDate(); }
function startWeekday(y,m){ return new Date(y,m-1,1).getDay(); }

function toLocalDateKey(date){
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function weekdayIndex(jsDay){ return jsDay === 0 ? 6 : jsDay - 1; }

/* ---------- Storage helpers ---------- */
function storageKeyForMonth(ym){ return LS_KEY_PREFIX + ym; }

function loadMonthState(ym){
  try{
    const raw = localStorage.getItem(storageKeyForMonth(ym));
    if(!raw) return null;
    return JSON.parse(raw);
  }catch(e){ console.error('loadMonthState', e); return null; }
}

function saveMonthState(ym, state){
  try{ localStorage.setItem(storageKeyForMonth(ym), JSON.stringify(state)); }catch(e){ console.error('saveMonthState', e); }
}

function initEmptyState(){ return { claimed: {}, lost: [], lastClaimDate: null, streak: 0 }; }

/* ---------- Determinar si un día es especial ---------- */
function isSpecialDay(day, rewardObj){
  if(!rewardObj) return false;
  
  // Si el reward tiene la propiedad special: true
  if(rewardObj.special === true) return true;
  
  // Si es un badge
  if(SPECIAL_DAYS.badge && rewardObj.type === 'badge') return true;
  
  // Días específicos
  if(SPECIAL_DAYS[`day_${day}`]) return true;
  
  return false;
}

/* ---------- UI render logic ---------- */
let viewDate = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);

function renderHeader(){
  const monthTitle = $('#monthTitle');
  const monthName = monthTitle.querySelector('.month-name');
  const themeBadge = $('#monthThemeBadge');
  
  const y = viewDate.getFullYear();
  const m = viewDate.toLocaleString(undefined, { month:'long' });
  monthName.textContent = `${m} ${y}`;
  
  // Mostrar badge de tema si existe
  const monthNum = viewDate.getMonth() + 1;
  const theme = MONTH_THEMES[monthNum];
  if(theme){
    themeBadge.textContent = getThemeLabel(theme);
    themeBadge.classList.add('active');
  } else {
    themeBadge.textContent = '';
    themeBadge.classList.remove('active');
  }
  
  const todayLabel = $('#todayLabel');
  todayLabel.textContent = new Date().toLocaleDateString(undefined,{ weekday:'long', year:'numeric', month:'long', day:'numeric' });
  
  // streak
  const streak = parseInt(localStorage.getItem(LS_STREAK_KEY) || '0',10);
  $('#streakCount').textContent = streak;
}

function getThemeLabel(theme){
  const labels = {
    'october': '🎃 Halloween',
    'december': '🎄 Navidad',
    'february': '💝 San Valentín',
    'special': '⭐ Especial'
  };
  return labels[theme] || '';
}

/* Build calendar cells for current viewDate */
function buildCalendar(){
  const grid = $('#calendarGrid');
  const shell = $('.calendar-shell');
  grid.innerHTML = '';
  
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth() + 1;
  const days = daysInMonth(year, month);
  const startJsDow = startWeekday(year, month);
  const leading = weekdayIndex(startJsDow);
  
  const ym = `${year}-${String(month).padStart(2,'0')}`;
  const rewards = (MONTH_REWARDS[ym] || []).slice();
  
  // Aplicar tema al calendario
  const theme = MONTH_THEMES[month];
  if(theme){
    shell.setAttribute('data-theme', theme);
  } else {
    shell.removeAttribute('data-theme');
  }
  
  let state = loadMonthState(ym);
  if(!state){ state = initEmptyState(); saveMonthState(ym, state); }
  
  // Create leading empty slots
  for(let i=0;i<leading;i++){
    const cell = el('div', { className:'day-cell cell-empty', role:'gridcell' });
    cell.innerHTML = '';
    grid.appendChild(cell);
  }
  
  const today = new Date();
  const todayKey = toLocalDateKey(today);
  
  // Build day cells
  for(let d=1; d<=days; d++){
    const dateObj = new Date(year, month-1, d);
    const dateKey = toLocalDateKey(dateObj);
    const cell = el('button', { className:'day-cell', role:'gridcell', tabIndex:0 });
    cell.dataset.date = dateKey;
    
    const num = el('div', { className:'day-number' }); 
    num.textContent = d;
    cell.appendChild(num);
    
    const rewardObj = rewards.find(r => r.day === d);
    const rewardWrap = el('div', { className:'day-reward' });
    const icon = el('div', { className:'reward-icon' });
    icon.innerHTML = rewardObj ? (rewardObj.icon || '🎁') : '—';
    const txt = el('div'); 
    txt.textContent = rewardObj ? (rewardObj.label || 'Recompensa') : '—';
    rewardWrap.appendChild(icon); 
    rewardWrap.appendChild(txt);
    cell.appendChild(rewardWrap);
    
    // Determinar si es día especial
    if(isSpecialDay(d, rewardObj)){
      cell.classList.add('special-day');
      const specialBadge = el('div', { className:'special-badge' });
      specialBadge.textContent = 'ESPECIAL';
      cell.appendChild(specialBadge);
    }
    
    const badge = el('div', { className:'state-badge' });
    
    const isFuture = dateObj > today && (viewDate.getMonth() === today.getMonth()) ? true : dateObj > today;
    const claimed = state.claimed && state.claimed[dateKey];
    const lost = state.lost && state.lost.includes(dateKey);
    
    if(claimed){
      cell.classList.add('cell-claimed');
      badge.textContent = 'Reclamado';
      badge.classList.add('claimed');
    } else if(lost){
      cell.classList.add('cell-lost');
      badge.textContent = 'Perdido';
      badge.classList.add('lost');
    } else if(dateKey === todayKey){
      cell.classList.add('cell-today');
      badge.textContent = 'Disponible';
      badge.classList.add('available');
    } else if(dateObj < today){
      if(!lost){
        cell.classList.add('cell-lost');
        badge.textContent = 'Perdido';
        badge.classList.add('lost');
      }
    } else {
      cell.classList.add('cell-future');
      badge.textContent = 'Futuro';
    }
    
    cell.appendChild(badge);
    
    cell.addEventListener('click', ()=> openRewardModal(dateKey, rewardObj, ym));
    cell.addEventListener('keydown', (e)=> { if(e.key === 'Enter') openRewardModal(dateKey, rewardObj, ym); });
    
    grid.appendChild(cell);
  }
  
  const totalCells = leading + days;
  const trailing = (7 - (totalCells % 7)) % 7;
  for(let i=0;i<trailing;i++){
    const cell = el('div', { className:'day-cell cell-empty' });
    grid.appendChild(cell);
  }
  
  updateMonthProgress(ym);
}

/* ---------- Open reward modal ---------- */
function openRewardModal(dateKey, rewardObj, ym){
  const modal = $('#rewardModal');
  const content = $('#rewardContent');
  content.innerHTML = '';
  
  const title = el('div', { className:'reward-title' });
  const dayNum = dateKey.slice(-2);
  title.textContent = `Día ${dayNum} — ${ (rewardObj && rewardObj.label) ? rewardObj.label : 'Sin recompensa definida' }`;
  content.appendChild(title);
  
  if(rewardObj && rewardObj.note){
    const note = el('div', { className:'u-muted', style:'margin-top:8px' });
    note.innerHTML = rewardObj.note;
    content.appendChild(note);
  }
  
  const detail = el('div', { style:'margin-top:16px' });
  const type = el('div', {style:'margin-bottom:8px'}); 
  type.innerHTML = `<strong>Tipo:</strong> <span style="color:var(--accent)">${rewardObj ? rewardObj.type : 'N/A'}</span>`;
  detail.appendChild(type);
  
  if(rewardObj && rewardObj.value) { 
    const v = el('div'); 
    v.innerHTML = `<strong>Valor:</strong> <span style="color:var(--gold)">${rewardObj.value}</span>`; 
    detail.appendChild(v); 
  }
  content.appendChild(detail);
  
  const btnClaim = $('#btnClaim');
  const btnClose = $('#btnCloseReward');
  
  let state = loadMonthState(ym) || initEmptyState();
  
  const today = new Date();
  const todayKey = toLocalDateKey(today);
  
  const isToday = (dateKey === todayKey);
  const alreadyClaimed = state.claimed && state.claimed[dateKey];
  
  if(alreadyClaimed){
    btnClaim.disabled = true;
    btnClaim.textContent = 'Ya reclamado ✓';
  } else if(!isToday){
    btnClaim.disabled = true;
    if(new Date(dateKey) > today) btnClaim.textContent = 'No disponible (futuro)';
    else btnClaim.textContent = 'No disponible (pasado)';
  } else {
    btnClaim.disabled = false;
    btnClaim.innerHTML = '<span class="btn-shimmer"></span>Reclamar Recompensa';
  }
  
  modal._context = { dateKey, rewardObj, ym };
  modal.setAttribute('aria-hidden','false');
  
  function claimHandler(){
    if(btnClaim.disabled) return;
    
    const now = new Date();
    if(!state) state = initEmptyState();
    state.claimed[dateKey] = { day: parseInt(dateKey.slice(-2),10), reward: rewardObj || null, time: now.toISOString() };
    
    if(state.lastClaimDate){
      const diffDays = Math.round((new Date(dateKey) - new Date(state.lastClaimDate))/(1000*60*60*24));
      if(diffDays === 1) state.streak = (state.streak || 0) + 1;
      else state.streak = 1;
    } else {
      state.streak = 1;
    }
    state.lastClaimDate = dateKey;
    
    saveMonthState(ym, state);
    const globalStreak = parseInt(localStorage.getItem(LS_STREAK_KEY) || '0',10);
    localStorage.setItem(LS_STREAK_KEY, Math.max(globalStreak, state.streak));
    
    // Animación del orb
    playOrbAnimation();
    
    setTimeout(()=>{
      modal.setAttribute('aria-hidden','true');
      buildCalendar();
      updateMonthProgress(ym);
      toast('¡Recompensa reclamada!', rewardObj ? rewardObj.icon : '🎁', 2500);
    }, 1200);
  }
  
  btnClaim.onclick = claimHandler;
  btnClose.onclick = ()=> { modal.setAttribute('aria-hidden','true'); };
  
  // Preview del reward en el modal
  const preview = el('div', { style:'margin-top:16px; text-align:center' });
  const bigIcon = el('div', { style:'font-size:48px; margin-bottom:8px; filter: drop-shadow(0 4px 16px rgba(48,209,88,.3))' }); 
  bigIcon.textContent = rewardObj ? (rewardObj.icon || '🎁') : '—';
  preview.appendChild(bigIcon);
  content.appendChild(preview);
}

/* ---------- Orb Animation ---------- */
function playOrbAnimation(){
  const orb = document.querySelector('.reward-orb');
  if(!orb) return;
  orb.style.animation = 'none';
  setTimeout(()=> {
    orb.style.animation = '';
  }, 10);
}

/* ---------- Update month progress UI ---------- */
function updateMonthProgress(ym){
  const state = loadMonthState(ym) || initEmptyState();
  const claimedCount = Object.keys(state.claimed || {}).length;
  const [y,m] = ym.split('-').map(s=>parseInt(s,10));
  const totalDays = daysInMonth(y,m);
  
  $('#monthProgress').textContent = `${claimedCount}/${totalDays}`;
  
  const today = new Date();
  const todayKey = toLocalDateKey(today);
  const claimedToday = state.claimed && state.claimed[todayKey];
  $('#claimStatus').textContent = claimedToday ? '✓ Reclamado hoy' : '⏳ Pendiente';
  
  const percent = Math.round((claimedCount / totalDays) * 100);
  $('#progressPercent').textContent = `${percent}%`;
  
  $('#streakCount').textContent = state.streak || 0;
}

/* ---------- Auto-mark lost days ---------- */
function markLostDaysAutomatically(ym){
  const state = loadMonthState(ym) || initEmptyState();
  const [y,m] = ym.split('-').map(s=>parseInt(s,10));
  const total = daysInMonth(y,m);
  const today = new Date();
  
  for(let d=1; d<=total; d++){
    const dt = new Date(y,m-1,d);
    const key = toLocalDateKey(dt);
    if(dt < new Date(today.getFullYear(), today.getMonth(), today.getDate())){
      if(!state.claimed[key] && !state.lost.includes(key)){
        state.lost.push(key);
      }
    }
  }
  saveMonthState(ym, state);
}

/* ---------- PREVIEW NEXT MONTH MODAL (MEJORADO) ---------- */
function openPreviewModal(){
  const modal = $('#previewModal');
  const content = $('#previewContent');
  const highlights = $('#previewHighlights');
  const titleEl = $('#previewTitle');
  
  content.innerHTML = '';
  highlights.innerHTML = '';
  
  const nextMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
  const ym = ymKey(nextMonth);
  const rewards = MONTH_REWARDS[ym];
  
  if(!rewards || rewards.length === 0){
    content.innerHTML = '<p style="text-align:center; color:var(--muted); padding:40px;">No hay recompensas definidas para este mes</p>';
    modal.setAttribute('aria-hidden','false');
    return;
  }
  
  const monthName = nextMonth.toLocaleString(undefined, { month:'long', year:'numeric' });
  titleEl.textContent = `Preview — ${monthName}`;
  
  // Crear mini calendario de preview
  rewards.forEach(r => {
    const dayEl = el('div', { className:'preview-day' });
    if(r.special || isSpecialDay(r.day, r)){
      dayEl.classList.add('special');
    }
    
    const num = el('div', { className:'preview-day-number' });
    num.textContent = `Día ${r.day}`;
    
    const icon = el('div', { className:'preview-day-icon' });
    icon.textContent = r.icon || '🎁';
    
    const label = el('div', { className:'preview-day-label' });
    label.textContent = r.label || 'Recompensa';
    
    dayEl.appendChild(num);
    dayEl.appendChild(icon);
    dayEl.appendChild(label);
    
    content.appendChild(dayEl);
  });
  
  // Destacar recompensas especiales
  const specialRewards = rewards.filter(r => r.special || isSpecialDay(r.day, r));
  if(specialRewards.length > 0){
    const h3 = el('h3');
    h3.textContent = '⭐ Recompensas Especiales';
    highlights.appendChild(h3);
    
    const list = el('div', { className:'highlight-list' });
    specialRewards.forEach(r => {
      const item = el('div', { className:'highlight-item' });
      
      const icon = el('div', { className:'highlight-icon' });
      icon.textContent = r.icon || '🎁';
      
      const info = el('div', { className:'highlight-info' });
      const day = el('div', { className:'highlight-day' });
      day.textContent = `Día ${r.day}`;
      const reward = el('div', { className:'highlight-reward' });
      reward.textContent = r.label || 'Recompensa';
      
      info.appendChild(day);
      info.appendChild(reward);
      
      item.appendChild(icon);
      item.appendChild(info);
      list.appendChild(item);
    });
    highlights.appendChild(list);
  }
  
  modal.setAttribute('aria-hidden','false');
}

$('#previewClose').addEventListener('click', ()=> $('#previewModal').setAttribute('aria-hidden','true'));

/* ---------- HISTORY MODAL (MEJORADO) ---------- */
function openHistoryModal(){
  const modal = $('#historyModal');
  const content = $('#historyContent');
  const stats = $('#historyStats');
  const subtitle = $('#historySubtitle');
  
  content.innerHTML = '';
  stats.innerHTML = '';
  
  const ym = ymKey(viewDate);
  const state = loadMonthState(ym) || initEmptyState();
  
  const monthName = viewDate.toLocaleString(undefined, { month:'long', year:'numeric' });
  subtitle.textContent = monthName;
  
  // Estadísticas del mes
  const claimedCount = Object.keys(state.claimed || {}).length;
  const [y,m] = ym.split('-').map(s=>parseInt(s,10));
  const totalDays = daysInMonth(y,m);
  const lostCount = state.lost ? state.lost.length : 0;
  const percent = Math.round((claimedCount / totalDays) * 100);
  
  const statCards = [
    { icon:'🎁', value:claimedCount, label:'Reclamadas' },
    { icon:'📊', value:`${percent}%`, label:'Progreso' },
    { icon:'🔥', value:state.streak || 0, label:'Racha' },
    { icon:'❌', value:lostCount, label:'Perdidas' }
  ];
  
  statCards.forEach(stat => {
    const card = el('div', { className:'history-stat-card' });
    const icon = el('div', { className:'history-stat-icon' });
    icon.textContent = stat.icon;
    const value = el('div', { className:'history-stat-value' });
    value.textContent = stat.value;
    const label = el('div', { className:'history-stat-label' });
    label.textContent = stat.label;
    
    card.appendChild(icon);
    card.appendChild(value);
    card.appendChild(label);
    stats.appendChild(card);
  });
  
  // Lista de recompensas reclamadas
  const claimedKeys = Object.keys(state.claimed || {}).sort().reverse();
  
  if(claimedKeys.length === 0){
    const empty = el('div', { className:'history-empty' });
    const emptyIcon = el('div', { className:'history-empty-icon' });
    emptyIcon.textContent = '📭';
    const emptyText = el('p');
    emptyText.textContent = 'No hay reclamaciones este mes';
    empty.appendChild(emptyIcon);
    empty.appendChild(emptyText);
    content.appendChild(empty);
  } else {
    const list = el('div', { className:'history-list' });
    claimedKeys.forEach(k => {
      const entry = state.claimed[k];
      const item = el('div', { className:'history-item' });
      
      const icon = el('div', { className:'history-item-icon' });
      icon.textContent = entry.reward ? (entry.reward.icon || '🎁') : '🎁';
      
      const info = el('div', { className:'history-item-info' });
      const date = el('div', { className:'history-item-date' });
      date.textContent = new Date(k).toLocaleDateString(undefined, { weekday:'long', day:'numeric', month:'long' });
      const reward = el('div', { className:'history-item-reward' });
      reward.textContent = entry.reward ? (entry.reward.label || 'Recompensa') : 'Recompensa';
      const type = el('div', { className:'history-item-type' });
      type.textContent = entry.reward ? entry.reward.type : '—';
      
      info.appendChild(date);
      info.appendChild(reward);
      info.appendChild(type);
      
      item.appendChild(icon);
      item.appendChild(info);
      list.appendChild(item);
    });
    content.appendChild(list);
  }
  
  modal.setAttribute('aria-hidden','false');
}

$('#historyClose').addEventListener('click', ()=> $('#historyModal').setAttribute('aria-hidden','true'));

/* ---------- Month navigation ---------- */
$('#prevMonth').addEventListener('click', ()=> {
  viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
  bootMonth();
});

$('#nextMonth').addEventListener('click', ()=> {
  viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
  bootMonth();
});

$('#btnPreviewNext').addEventListener('click', openPreviewModal);
$('#btnHistory').addEventListener('click', openHistoryModal);

/* ---------- Modal close reward */
$('#rewardClose').addEventListener('click', ()=> $('#rewardModal').setAttribute('aria-hidden','true'));

/* ---------- Close modals on backdrop click ---------- */
document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', (e) => {
    if(e.target === modal || e.target.classList.contains('modal__backdrop')){
      modal.setAttribute('aria-hidden','true');
    }
  });
});

/* ---------- Main bootstrap ---------- */
function bootMonth(){
  renderHeader();
  const ym = ymKey(viewDate);
  markLostDaysAutomatically(ym);
  buildCalendar();
  updateMonthProgress(ym);
}

/* ---------- Boot app on DOM ready ---------- */
document.addEventListener('DOMContentLoaded', ()=> {
  try{
    const now = new Date();
    viewDate = new Date(now.getFullYear(), now.getMonth(), 1);
    
    TODAY.setFullYear(now.getFullYear());
    TODAY.setMonth(now.getMonth());
    TODAY.setDate(now.getDate());
    
    bootMonth();
  }catch(e){
    console.error('boot error', e);
  }
});

/* ---------- Utilities for author (expose) ---------- */
window.MoonveilDaily = {
  MONTH_REWARDS,
  MONTH_THEMES,
  SPECIAL_DAYS,
  loadMonthState,
  saveMonthState,
  buildCalendar,
  bootMonth,
  isSpecialDay
};