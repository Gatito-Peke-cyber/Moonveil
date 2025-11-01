/**
 * login.js
 *
 * Moonveil Daily Login — Calendario mensual con recompensas diarias.
 * - Recompensas definidas en MONTH_REWARDS (por año-mes clave)
 * - Persistencia por localStorage (por mes: claimed / lost / streak / lastClaimDate)
 * - Animación cofre al reclamar
 * - Previsualizar siguiente mes
 * - Historial del mes
 *
 * USO:
 * - Edita la constante MONTH_REWARDS para definir recompensas por mes.
 * - Las claves usan formato 'YYYY-MM' (ej: '2025-10').
 */

/* ---------- Config / keys ---------- */
const LS_KEY_PREFIX = 'mv_daily_'; // stored as mv_daily_YYYY-MM
const LS_STREAK_KEY = 'mv_daily_streak'; // global best/active streak (optional)
//const TODAY = new Date(); // for initial display, can be overridden for testing - el anterior usado
// Fecha local exacta (sin depender de UTC)
const nowLocal = new Date();
const TODAY = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate());


/* ---------- Reward definitions (edit aquí) ----------
   Cada mes debe tener un array con objetos por día:
   { day: 1..31, type: 'xp'|'emerald'|'item'|'badge'|'coins', label: 'Esmeraldas x5', value: 5, icon?: dataURL|emoji|string, note?: '...' }
   Puedes añadir tantos meses como quieras. Si el mes no existe, el calendario generará placeholders genéricos.
*/
const MONTH_REWARDS = {
  // Example: October 2025
  '2025-10': [
    { day:1, type:'emerald', label:'Esmeraldas x5', value:5, icon:'💚', note:'Recompensa bienvenida del mes' },
    { day:2, type:'xp', label:'XP +150', value:150, icon:'⭐', note:'Pequeño impulso de XP' },
    { day:3, type:'coins', label:'Monedas x50', value:50, icon:'🪙' },
    { day:4, type:'item', label:'Pan', icon:'🍞', note:'Pan' },
    { day:5, type:'badge', label:'Insignia: Pionero', icon:'🏅' },
    { day:6, type:'emerald', label:'Esmeraldas x10', value:10, icon:'💚' },
    { day:7, type:'xp', label:'XP +200', value:200, icon:'⭐' },
    { day:8, type:'coins', label:'Monedas x75', value:75, icon:'🪙' },
    { day:9, type:'item', label:'Antorcha', icon:'🔥' },
    { day:10, type:'emerald', label:'Esmeraldas x3', value:3, icon:'💚' },
    { day:11, type:'xp', label:'XP +120', value:120, icon:'⭐' },
    { day:12, type:'coins', label:'Monedas x60', value:60, icon:'🪙' },
    { day:13, type:'item', label:'Mapa antiguo', icon:'🗺️' },
    { day:14, type:'emerald', label:'Esmeraldas x7', value:7, icon:'💚' },
    { day:15, type:'xp', label:'XP +300', value:300, icon:'⭐' },
    { day:16, type:'coins', label:'Monedas x100', value:100, icon:'🪙' },
    { day:17, type:'item', label:'Cofre pequeño', icon:'📦' },
    { day:18, type:'emerald', label:'Esmeraldas x4', value:4, icon:'💚' },
    { day:19, type:'xp', label:'XP +180', value:180, icon:'⭐' },
    { day:20, type:'coins', label:'Monedas x40', value:40, icon:'🪙' },
    { day:21, type:'item', label:'Pergamino', icon:'📜' },
    { day:22, type:'emerald', label:'Esmeraldas x6', value:6, icon:'💚' },
    { day:23, type:'xp', label:'XP +220', value:220, icon:'⭐' },
    { day:24, type:'coins', label:'Monedas x80', value:80, icon:'🪙' },
    { day:25, type:'item', label:'Poción', icon:'🧪' },
    { day:26, type:'emerald', label:'Esmeraldas x12', value:12, icon:'💚' },
    { day:27, type:'xp', label:'XP +260', value:260, icon:'⭐' },
    { day:28, type:'coins', label:'Monedas x90', value:90, icon:'🪙' },
    { day:29, type:'item', label:'Estandarte', icon:'🧥', note:'Cosmético especial' },
    { day:30, type:'emerald', label:'Esmeraldas x20', value:20, icon:'💚' },
    { day:31, type:'badge', label:'Insignia: Completo', icon:'🏆', note:'Recompensa del mes (completa)' }
  ],
  // Next month example (November 2025) — previewable
  '2025-11': [
    { day:1, type:'emerald', label:'Esmeraldas x5', value:5, icon:'💚', note:'Recompensa bienvenida del mes' },
    { day:2, type:'xp', label:'XP +150', value:150, icon:'⭐', note:'Pequeño impulso de XP' },
    { day:3, type:'coins', label:'Monedas x50', value:50, icon:'🪙' },
    { day:4, type:'item', label:'Pan', icon:'🍞', note:'Pan' },
    { day:5, type:'badge', label:'1 Llave', icon:'🏅' },
    { day:6, type:'emerald', label:'Esmeraldas x10', value:10, icon:'💚' },
    { day:7, type:'xp', label:'XP +200', value:200, icon:'⭐' },
    { day:8, type:'coins', label:'Monedas x75', value:75, icon:'🪙' },
    { day:9, type:'item', label:'Antorcha', icon:'🔥' },
    { day:10, type:'emerald', label:'Esmeraldas x3', value:3, icon:'💚' },
    { day:11, type:'xp', label:'XP +120', value:120, icon:'⭐' },
    { day:12, type:'coins', label:'Monedas x60', value:60, icon:'🪙' },
    { day:13, type:'item', label:'Mapa', icon:'🗺️' },
    { day:14, type:'emerald', label:'Esmeraldas x7', value:7, icon:'💚' },
    { day:15, type:'xp', label:'XP +300', value:300, icon:'⭐' },
    { day:16, type:'coins', label:'Monedas x100', value:100, icon:'🪙' },
    { day:17, type:'item', label:'Cofre', icon:'📦' },
    { day:18, type:'emerald', label:'Esmeraldas x4', value:4, icon:'💚' },
    { day:19, type:'xp', label:'XP +180', value:180, icon:'⭐' },
    { day:20, type:'coins', label:'Monedas x40', value:40, icon:'🪙' },
    { day:21, type:'item', label:'Mapa', icon:'📜' },
    { day:22, type:'emerald', label:'Esmeraldas x6', value:6, icon:'💚' },
    { day:23, type:'xp', label:'XP +220', value:220, icon:'⭐' },
    { day:24, type:'coins', label:'Monedas x80', value:80, icon:'🪙' },
    { day:25, type:'item', label:'Poción', icon:'🧪' },
    { day:26, type:'emerald', label:'Esmeraldas x12', value:12, icon:'💚' },
    { day:27, type:'xp', label:'XP +260', value:260, icon:'⭐' },
    { day:28, type:'coins', label:'Monedas x90', value:90, icon:'🪙' },
    { day:29, type:'emerald', label:'Esmeraldas x20', value:20, icon:'💚' },
    { day:30, type:'badge', label:'Insignia: Completo', icon:'🏆', note:'Recompensa del mes (completa)' }
  ],
  '2025-12': Array.from({length:30}, (_,i)=>({
    day: i+1,
    type: (i%5===0)?'emerald': (i%3===0)?'xp':'coins',
    label: (i%5===0)?`Esmeraldas x${(i%7)+3}`: (i%3===0)?`XP +${120 + (i*10)}`:`Monedas x${30 + (i*5)}`,
    icon: (i%5===0)?'💚': (i%3===0)?'⭐':'🪙'
  })),
  '2026-01': Array.from({length:30}, (_,i)=>({
    day: i+1,
    type: (i%5===0)?'emerald': (i%3===0)?'xp':'coins',
    label: (i%5===0)?`Esmeraldas x${(i%7)+3}`: (i%3===0)?`XP +${120 + (i*10)}`:`Monedas x${30 + (i*5)}`,
    icon: (i%5===0)?'💚': (i%3===0)?'⭐':'🪙'
  })),
  '2026-02': Array.from({length:30}, (_,i)=>({
    day: i+1,
    type: (i%5===0)?'emerald': (i%3===0)?'xp':'coins',
    label: (i%5===0)?`Esmeraldas x${(i%7)+3}`: (i%3===0)?`XP +${120 + (i*10)}`:`Monedas x${30 + (i*5)}`,
    icon: (i%5===0)?'💚': (i%3===0)?'⭐':'🪙'
  }))
  // Añade más meses siguiendo la clave 'YYYY-MM'
};

/* ---------- Utilities ---------- */
const $ = (s, ctx=document) => ctx.querySelector(s);
const $$ = (s, ctx=document) => Array.from((ctx||document).querySelectorAll(s));
const el = (t='div', p={}) => { const e=document.createElement(t); Object.assign(e,p); return e; };
function toast(msg, t=2000){ const tEl = $('#loginToast'); if(!tEl) { console.log(msg); return; } tEl.textContent = msg; tEl.classList.add('show'); clearTimeout(tEl._tm); tEl._tm = setTimeout(()=> tEl.classList.remove('show'), t); }

/* Date helpers */
function ymKey(date){ const y = date.getFullYear(); const m = (date.getMonth()+1).toString().padStart(2,'0'); return `${y}-${m}`; }
function daysInMonth(y,m){ return new Date(y,m,0).getDate(); } // m is 1..12 uses JS zero day trick
function startWeekday(y,m){ return new Date(y,m-1,1).getDay(); } // 0 Sun .. 6 Sat (we'll map Mon..Sun)
//function toLocalDateKey(date){ return date.toISOString().slice(0,10); } - este fue usado antes ----
// Devuelve clave de fecha local (YYYY-MM-DD)
function toLocalDateKey(date){
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}


/* Map JS weekday (Sun=0) to grid where Monday is first */
function weekdayIndex(jsDay){ return jsDay === 0 ? 6 : jsDay - 1; } // returns 0..6 where 0=Mon

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

/* ---------- Calendar state model ----------
   state = {
     claimed: { 'YYYY-MM-DD': { day, reward, time } },
     lost: ['YYYY-MM-DD', ...],
     lastClaimDate: 'YYYY-MM-DD' | null,
     streak: number
   }
*/
function initEmptyState(){ return { claimed: {}, lost: [], lastClaimDate: null, streak: 0 }; }

/* ---------- UI render logic ---------- */
let viewDate = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1); // first day of current viewed month

function renderHeader(){
  const monthTitle = $('#monthTitle');
  const y = viewDate.getFullYear();
  const m = viewDate.toLocaleString(undefined, { month:'long' });
  monthTitle.textContent = `${m} ${y}`;
  const todayLabel = $('#todayLabel');
  todayLabel.textContent = new Date().toLocaleDateString(undefined,{ weekday:'long', year:'numeric', month:'long', day:'numeric' });
  // streak
  const streak = parseInt(localStorage.getItem(LS_STREAK_KEY) || '0',10);
  $('#streakCount').textContent = streak;
}

/* Build calendar cells for current viewDate */
function buildCalendar(){
  const grid = $('#calendarGrid');
  grid.innerHTML = '';
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth() + 1; // 1..12
  const days = daysInMonth(year, month);
  const startJsDow = startWeekday(year, month); // 0..6 (Sun..Sat)
  const leading = weekdayIndex(startJsDow); // 0..6 where 0=Mon
  // get reward list for this month
  const ym = `${year}-${String(month).padStart(2,'0')}`;
  const rewards = (MONTH_REWARDS[ym] || []).slice(); // may be empty

  // load or init state
  let state = loadMonthState(ym);
  if(!state){ state = initEmptyState(); saveMonthState(ym, state); }

  // Create leading empty slots
  for(let i=0;i<leading;i++){
    const cell = el('div', { className:'day-cell cell-empty', role:'gridcell' });
    cell.innerHTML = '';
    grid.appendChild(cell);
  }

  // Today's date string for comparison
  const today = new Date();
  const todayKey = toLocalDateKey(today);

  // Build day cells
  for(let d=1; d<=days; d++){
    const dateObj = new Date(year, month-1, d);
    const dateKey = toLocalDateKey(dateObj);
    const cell = el('button', { className:'day-cell', role:'gridcell', tabIndex:0 });
    cell.dataset.date = dateKey;

    // number
    const num = el('div', { className:'day-number' }); num.textContent = d;
    cell.appendChild(num);

    // reward info
    const rewardObj = rewards.find(r => r.day === d);
    const rewardWrap = el('div', { className:'day-reward' });
    const icon = el('div', { className:'reward-icon' });
    icon.innerHTML = rewardObj ? (rewardObj.icon || '🎁') : '—';
    const txt = el('div'); txt.textContent = rewardObj ? (rewardObj.label || 'Recompensa') : '—';
    rewardWrap.appendChild(icon); rewardWrap.appendChild(txt);
    cell.appendChild(rewardWrap);

    // state badge
    const badge = el('div', { className:'state-badge' });

    // determine status: future / claimed / lost / available/today
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
      // today is available if not claimed yet
      cell.classList.add('cell-today');
      badge.textContent = 'Disponible';
      badge.classList.add('available');
    } else if(dateObj < today){
      // past not claimed -> lost
      // If it's past and neither claimed nor lost recorded, mark as lost automatically
      if(!lost){
        // mark lost automatically only if stored state doesn't have it; we will not save lost automatically until user loads month to avoid overwriting
        // but for visual clarity mark it as lost in UI if not claimed.
        cell.classList.add('cell-lost');
        badge.textContent = 'Perdido';
        badge.classList.add('lost');
      }
    } else {
      // future
      cell.classList.add('cell-future');
      badge.textContent = 'Futuro';
    }

    cell.appendChild(badge);

    // Click opens modal for reward (or claim if today)
    cell.addEventListener('click', ()=> openRewardModal(dateKey, rewardObj, ym));
    cell.addEventListener('keydown', (e)=> { if(e.key === 'Enter') openRewardModal(dateKey, rewardObj, ym); });

    grid.appendChild(cell);
  }

  // trailing empty slots to fill grid to full weeks (optional)
  const totalCells = leading + days;
  const trailing = (7 - (totalCells % 7)) % 7;
  for(let i=0;i<trailing;i++){
    const cell = el('div', { className:'day-cell cell-empty' });
    grid.appendChild(cell);
  }

  // Update month progress and claimStatus
  updateMonthProgress(ym);
}

/* ---------- Open reward modal (shows details and allows claim) ---------- */
function openRewardModal(dateKey, rewardObj, ym){
  const modal = $('#rewardModal');
  const wrap = $('#chestWrap');
  const content = $('#rewardContent');
  content.innerHTML = '';

  const title = el('div', { className:'reward-title' });
  title.textContent = `Día ${dateKey.slice(-2)} — ${ (rewardObj && rewardObj.label) ? rewardObj.label : 'Sin recompensa definida' }`;
  content.appendChild(title);

  const note = el('div', { className:'u-muted', innerHTML: rewardObj && rewardObj.note ? rewardObj.note : '' });
  content.appendChild(note);

  // show details
  const detail = el('div', { style:'margin-top:12px' });
  const type = el('div'); type.innerHTML = `<strong>Tipo:</strong> ${rewardObj ? rewardObj.type : 'N/A'}`;
  detail.appendChild(type);
  if(rewardObj && rewardObj.value) { const v = el('div'); v.innerHTML = `<strong>Valor:</strong> ${rewardObj.value}`; detail.appendChild(v); }
  content.appendChild(detail);

  // Claim button logic
  const btnClaim = $('#btnClaim');
  const btnClose = $('#btnCloseReward');

  // reset chest state
  wrap.querySelectorAll('.chest').forEach(c => c.classList.remove('open'));

  // load month state
  let state = loadMonthState(ym) || initEmptyState();

  const today = new Date();
  const todayKey = toLocalDateKey(today);

  // determine if this date is claimable (only claim on its day)
  const isToday = (dateKey === todayKey);
  const alreadyClaimed = state.claimed && state.claimed[dateKey];

  if(alreadyClaimed){
    $('#btnClaim').disabled = true;
    $('#btnClaim').textContent = 'Ya reclamado';
  } else if(!isToday){
    $('#btnClaim').disabled = true;
    if(new Date(dateKey) > today) $('#btnClaim').textContent = 'No disponible (futuro)';
    else $('#btnClaim').textContent = 'No disponible (pasado)';
  } else {
    $('#btnClaim').disabled = false;
    $('#btnClaim').textContent = 'Reclamar';
  }

  // store current modal context
  modal._context = { dateKey, rewardObj, ym };

  // show modal
  modal.setAttribute('aria-hidden','false');

  // Claim handler
  function claimHandler(){
    // protective
    if($('#btnClaim').disabled) return;

    // add claimed entry
    const now = new Date();
    if(!state) state = initEmptyState();
    state.claimed[dateKey] = { day: parseInt(dateKey.slice(-2),10), reward: rewardObj || null, time: now.toISOString() };

    // update streak: if lastClaimDate is yesterday then streak++ else reset to 1
    if(state.lastClaimDate){
      const last = new Date(state.lastClaimDate);
      const diffDays = Math.round((new Date(dateKey) - new Date(state.lastClaimDate))/(1000*60*60*24));
      if(diffDays === 1) state.streak = (state.streak || 0) + 1;
      else state.streak = 1;
    } else {
      state.streak = 1;
    }
    state.lastClaimDate = dateKey;

    // save
    saveMonthState(ym, state);
    // save global streak
    const globalStreak = parseInt(localStorage.getItem(LS_STREAK_KEY) || '0',10);
    localStorage.setItem(LS_STREAK_KEY, Math.max(globalStreak, state.streak));

    // animate chest
    playChestAnimation();

    // update UI after animation
    setTimeout(()=>{
      modal.setAttribute('aria-hidden','true');
      buildCalendar(); // re-render
      updateMonthProgress(ym);
      toast('Recompensa reclamada: ' + (rewardObj ? rewardObj.label : 'Sin etiqueta'));
    }, 900);
  }

  // attach listeners (remove previous)
  btnClaim.onclick = claimHandler;
  btnClose.onclick = ()=> { modal.setAttribute('aria-hidden','true'); };

  // show reward preview in content (icon)
  const preview = el('div', { style:'margin-top:10px' });
  const bigIcon = el('div', { style:'font-size:32px;margin-bottom:6px' }); bigIcon.textContent = rewardObj ? (rewardObj.icon || '🎁') : '—';
  preview.appendChild(bigIcon);
  content.appendChild(preview);
}

/* ---------- Chest animation ----------
   Simply toggles CSS classes to open lid and sparkles.
*/
function playChestAnimation(){
  const chest = document.querySelector('.chest');
  if(!chest) return;
  chest.classList.add('open');
  setTimeout(()=> chest.classList.remove('open'), 1200);
}

/* ---------- Update month progress UI ---------- */
function updateMonthProgress(ym){
  const state = loadMonthState(ym) || initEmptyState();
  const claimedCount = Object.keys(state.claimed || {}).length;
  // total days in current viewed month
  const [y,m] = ym.split('-').map(s=>parseInt(s,10));
  const totalDays = daysInMonth(y,m);
  $('#monthProgress').textContent = `${claimedCount}/${totalDays} reclamadas`;
  // claimStatus
  const today = new Date();
  const todayKey = toLocalDateKey(today);
  const claimedToday = state.claimed && state.claimed[todayKey];
  $('#claimStatus').textContent = claimedToday ? 'Has reclamado hoy' : 'No reclamado hoy';
  // update streak display
  $('#streakCount').textContent = state.streak || 0;
}

/* ---------- Auto-mark lost days when month loads ----------
   We mark past days that are not claimed as 'lost' in the state for persistence.
*/
function markLostDaysAutomatically(ym){
  const state = loadMonthState(ym) || initEmptyState();
  const [y,m] = ym.split('-').map(s=>parseInt(s,10));
  const total = daysInMonth(y,m);
  const today = new Date();
  for(let d=1; d<=total; d++){
    const dt = new Date(y,m-1,d);
    const key = toLocalDateKey(dt);
    if(dt < new Date(today.getFullYear(), today.getMonth(), today.getDate())){
      // past day
      if(!state.claimed[key] && !state.lost.includes(key)){
        state.lost.push(key);
      }
    }
  }
  saveMonthState(ym, state);
}

/* ---------- History modal ---------- */
function openHistoryModal(){
  const modal = $('#historyModal');
  const content = $('#historyContent');
  content.innerHTML = '<h3>Historial (mes actual)</h3>';

  const ym = ymKey(viewDate);
  const state = loadMonthState(ym) || initEmptyState();
  const list = el('div', { className:'history-list' });

  // list claimed days with reward
  const claimedKeys = Object.keys(state.claimed || {}).sort();
  if(claimedKeys.length === 0){
    content.appendChild(el('div',{ className:'u-muted', innerText: 'No hay reclamaciones este mes.' }));
  } else {
    claimedKeys.forEach(k => {
      const entry = state.claimed[k];
      const item = el('div', { className:'history-item' });
      const left = el('div'); left.innerHTML = `<strong>${k}</strong> — Día ${entry.day}`;
      const right = el('div'); right.textContent = entry.reward ? (entry.reward.label || entry.reward.type) : '—';
      item.appendChild(left); item.appendChild(right);
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
$('#btnPreviewNext').addEventListener('click', ()=> {
  // show next month rewards in a toast or modal (preview)
  const next = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
  const key = ymKey(next);
  const list = MONTH_REWARDS[key];
  if(!list || list.length===0){ toast('No hay recompensas predefinidas para ' + key); return; }
  // simple preview via toast summarizing first 3 days
  const preview = list.slice(0,3).map(r => `${r.day}: ${r.label}`).join(' — ');
  toast('Preview ' + key + ' — ' + preview, 4200);
});
$('#btnHistory').addEventListener('click', openHistoryModal);

/* ---------- Modal close reward */
$('#rewardClose').addEventListener('click', ()=> $('#rewardModal').setAttribute('aria-hidden','true'));

/* ---------- Main bootstrap ---------- */
function bootMonth(){
  renderHeader();
  const ym = ymKey(viewDate);
  // mark lost days persistently if viewing a month that contains past days
  markLostDaysAutomatically(ym);
  buildCalendar();
  updateMonthProgress(ym);
}

/* ---------- Boot app on DOM ready ---------- */
document.addEventListener('DOMContentLoaded', ()=> {
  try{
    // fuerza el mes actual (por si se quedó en octubre u otro)
    const now = new Date();
    viewDate = new Date(now.getFullYear(), now.getMonth(), 1);

    // actualiza también la constante TODAY si la usas más adelante
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
  loadMonthState,
  saveMonthState,
  buildCalendar,
  bootMonth
};
