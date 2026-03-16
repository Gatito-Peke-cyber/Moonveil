/* =====================================================
   Moonveil Portal — admin.js  v1.0
   Lógica del panel de administración
   Solo accesible por usuarios con role === 'admin'
   ===================================================== */
'use strict';

import { onAuthChange, logout } from './auth.js';
import {
  ROLES,
  verifyAdminAccess,
  getAllUsers,
  searchUsers,
  getUsersByRole,
  getUserFull,
  updateUserRole,
  getPortalStats,
} from './admin-database.js';

/* ── Helpers de nivel (mismo que perfil.js) ── */
const LEVEL_THR   = [0,100,250,450,700,1000,1400,1850,2400,3000,3700,4500,5500,6800,8400,10200];
const LEVEL_NAMES = ['NOVATO','EXPLORADOR','COMBATIENTE','GUERRERO','ÉLITE','CAMPEÓN','MAESTRO','LEYENDA','SEMIDIÓS','INMORTAL','ARCANO','SUPREMO','MÍTICO','DIVINO','ETERNO','ABSOLUTO'];

const SECTION_LABELS = {
  resumen:'📊 Resumen', insignias:'🏆 Insignias', misiones:'⚔️ Misiones',
  actividad:'📜 Actividad', buzon:'📬 Buzón', inventario:'🎒 Inventario',
  titulos:'👑 Títulos', social:'👥 Social',
};

function computeLevel(xp) {
  let lv = 1;
  for (let i = 0; i < LEVEL_THR.length; i++) if (xp >= LEVEL_THR[i]) lv = i + 1;
  return Math.min(lv, LEVEL_THR.length);
}

/* ── $ helpers ── */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

/* ── Toast ── */
function toast(msg, type = 'ok') {
  const t = $('#toast'); if (!t) return;
  t.textContent = msg; t.className = `show ${type}`;
  clearTimeout(t._tid);
  t._tid = setTimeout(() => { t.className = ''; }, 3000);
}

/* ── Formato de fecha ── */
function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}
function timeAgo(iso) {
  if (!iso) return '—';
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60)     return 'hace un momento';
  if (s < 3600)   return `hace ${Math.floor(s / 60)}m`;
  if (s < 86400)  return `hace ${Math.floor(s / 3600)}h`;
  if (s < 604800) return `hace ${Math.floor(s / 86400)}d`;
  return fmtDate(iso);
}
function fmtHoras(h) {
  const total = Math.max(0, h || 0);
  const hours = Math.floor(total), mins = Math.floor((total - hours) * 60);
  if (!hours && !mins) return '0m';
  if (!hours) return `${mins}m`;
  if (!mins)  return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/* ── Presencia ── */
function presenceInfo(presence) {
  if (!presence) return { state: 'offline', label: 'DESCONECTADO' };
  const last = presence.lastSeen ? new Date(presence.lastSeen).getTime() : 0;
  const minsAgo = Math.floor((Date.now() - last) / 60000);
  if (presence.state === 'offline' || minsAgo > 5)
    return { state: 'offline', label: 'DESCONECTADO' };
  if (presence.state === 'away')
    return { state: 'away', label: 'AUSENTE' };
  return { state: 'online', label: 'EN LÍNEA' };
}

/* ── Badge de rol HTML ── */
function roleBadgeHTML(role) {
  const r = ROLES[role] || ROLES.user;
  return `<span class="role-badge ${role}">${r.icon} ${r.label}</span>`;
}

/* ── Loader ── */
function hideLoader() {
  const loader = $('#loader'); if (!loader) return;
  let w = 0; const fill = $('#ld-fill');
  const iv = setInterval(() => {
    w += Math.random() * 22 + 8;
    if (fill) fill.style.width = Math.min(w, 100) + '%';
    if (w >= 100) {
      clearInterval(iv);
      setTimeout(() => {
        loader.style.transition = 'opacity 0.4s';
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 400);
      }, 250);
    }
  }, 55);
}

/* ── Stars (igual que portal) ── */
function initStars() {
  const canvas = $('#stars-canvas'); if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W = canvas.width = window.innerWidth, H = canvas.height = window.innerHeight;
  const COLORS = ['#ff2d78', '#bf5af2', '#ffffff', '#00e5ff', '#f5c518'];
  const stars = Array.from({ length: 100 }, () => ({
    x: Math.random() * W, y: Math.random() * H,
    r: Math.random() * 1.5 + 0.4, o: Math.random() * 0.4 + 0.08,
    speed: Math.random() * 0.3 + 0.06,
    ci: Math.floor(Math.random() * COLORS.length),
  }));
  (function draw() {
    ctx.clearRect(0, 0, W, H);
    stars.forEach(s => {
      ctx.globalAlpha = s.o; ctx.fillStyle = COLORS[s.ci];
      ctx.fillRect(s.x, s.y, s.r, s.r);
      s.y -= s.speed; if (s.y < 0) { s.y = H; s.x = Math.random() * W; }
    });
    requestAnimationFrame(draw);
  })();
  window.addEventListener('resize', () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; });
}

/* ═══════════════════════════════════════
   ESTADO GLOBAL
═══════════════════════════════════════ */
let currentAdminUID = null;
let allUsersCache   = [];
let lastVisible     = null;
let hasMore         = false;
let currentPage     = 1;
const PAGE_SIZE     = 30;
let activeRoleFilter = '';
let selectedUserUID  = null;
let selectedUserRole = '';
let pendingRole      = '';

/* ═══════════════════════════════════════
   CARGAR ESTADÍSTICAS
═══════════════════════════════════════ */
async function loadStats() {
  const stats = await getPortalStats();
  if (!stats) return;
  const set = (id, v) => { const el = $(`#${id}`); if (el) el.textContent = v; };
  set('stat-total',    stats.total);
  set('stat-online',   stats.online);
  set('stat-new-today',stats.newToday);
  set('stat-avg-xp',   stats.avgXP.toLocaleString() + ' XP');
  set('stat-verified', stats.verified || 0);
  set('stat-dev',      stats.developer || 0);
  set('stat-admins',   stats.admin || 0);
  set('stat-total-xp', (stats.totalXP || 0).toLocaleString());
  // Animar reveal
  $$('#stats-grid .reveal').forEach((el, i) =>
    setTimeout(() => el.classList.add('visible'), i * 60)
  );
}

/* ═══════════════════════════════════════
   RENDER TABLA
═══════════════════════════════════════ */
function renderTable(users) {
  const tbody = $('#users-tbody'); if (!tbody) return;
  if (!users.length) {
    tbody.innerHTML = `<tr><td colspan="11">
      <div class="table-empty">
        <div class="te-icon">🔍</div>
        <div class="te-text">NO SE ENCONTRARON USUARIOS</div>
      </div>
    </td></tr>`;
    return;
  }
  tbody.innerHTML = users.map(u => {
    const lv = computeLevel(u.xp || 0);
    const pr = presenceInfo(u.presence);
    const role = u.role || 'user';
    const regDate = u.registrado ? fmtDate(u.registrado).split(' ')[0] : '—';
    return `<tr>
      <td class="td-avatar">${u.avatar || '🌙'}</td>
      <td class="td-name">${(u.nombre || 'Aventurero').toUpperCase()}</td>
      <td class="td-pid">${u.player_id || '—'}</td>
      <td class="td-email">${u.email || '—'}</td>
      <td>${roleBadgeHTML(role)}</td>
      <td class="td-xp">⚡ ${(u.xp || 0).toLocaleString()}</td>
      <td><span style="font-family:var(--font-pixel);font-size:0.28rem;color:var(--yellow)">${lv}</span></td>
      <td class="td-racha">🔥 ${u.racha || 0}</td>
      <td>
        <span class="td-presence ${pr.state}">
          <span class="presence-dot ${pr.state}"></span>${pr.label}
        </span>
      </td>
      <td style="font-family:var(--font-pixel);font-size:0.24rem;color:var(--muted)">${regDate}</td>
      <td><button class="btn-user-detail" data-uid="${u.uid}">👁 VER</button></td>
    </tr>`;
  }).join('');

  // Eventos de detalle
  tbody.querySelectorAll('.btn-user-detail').forEach(btn => {
    btn.addEventListener('click', () => openUserModal(btn.dataset.uid));
  });
}

/* ═══════════════════════════════════════
   CARGAR USUARIOS (paginado)
═══════════════════════════════════════ */
async function loadUsers(reset = false) {
  const refreshBtn = $('#btn-refresh');
  if (refreshBtn) refreshBtn.classList.add('spinning');

  if (reset) {
    lastVisible = null;
    currentPage = 1;
    allUsersCache = [];
  }

  let result;
  if (activeRoleFilter) {
    const roleUsers = await getUsersByRole(activeRoleFilter);
    result = { users: roleUsers, lastDoc: null, hasMore: false };
  } else {
    result = await getAllUsers(PAGE_SIZE, reset ? null : lastVisible);
  }

  if (reset) {
    allUsersCache = result.users;
  } else {
    allUsersCache = [...allUsersCache, ...result.users];
  }

  lastVisible = result.lastDoc;
  hasMore     = result.hasMore;

  renderTable(reset ? result.users : allUsersCache);

  const pageInfo = $('#page-info');
  if (pageInfo) pageInfo.textContent = `Mostrando ${allUsersCache.length} usuario(s)`;

  const btnNext = $('#btn-next'), btnPrev = $('#btn-prev');
  if (btnNext) btnNext.disabled = !hasMore;
  if (btnPrev) btnPrev.disabled = currentPage <= 1;

  if (refreshBtn) refreshBtn.classList.remove('spinning');
}

/* ═══════════════════════════════════════
   BUSCAR USUARIO
═══════════════════════════════════════ */
async function handleSearch() {
  const val = $('#user-search-input')?.value.trim();
  if (!val) { loadUsers(true); return; }
  toast('🔍 Buscando...', 'info');
  const results = await searchUsers(val);
  renderTable(results);
  const pageInfo = $('#page-info');
  if (pageInfo) pageInfo.textContent = `${results.length} resultado(s) para "${val}"`;
  toast(results.length ? `✓ ${results.length} resultado(s)` : '❌ Sin resultados', results.length ? 'ok' : 'error');
}

/* ═══════════════════════════════════════
   MODAL DETALLE DE USUARIO
═══════════════════════════════════════ */
async function openUserModal(uid) {
  toast('⟳ Cargando datos del usuario...', 'info');
  const u = await getUserFull(uid);
  if (!u) { toast('❌ No se pudo cargar el usuario', 'error'); return; }

  selectedUserUID  = uid;
  selectedUserRole = u.role || 'user';
  pendingRole      = selectedUserRole;

  const lv = computeLevel(u.xp || 0);
  const pr = presenceInfo(u.presence);

  // Header
  const set = (id, v) => { const el = $(`#${id}`); if (el) el.textContent = v; };
  const setHTML = (id, v) => { const el = $(`#${id}`); if (el) el.innerHTML = v; };

  set('muh-avatar', u.avatar || '🌙');
  set('muh-name', (u.nombre || 'Aventurero').toUpperCase());
  set('muh-email', u.email || '—');
  set('muh-pid', u.player_id || '—');
  set('muh-uid', `UID: ${uid}`);
  setHTML('muh-role-badge', roleBadgeHTML(u.role || 'user'));

  // Stats
  set('mu-xp',   (u.xp || 0).toLocaleString());
  set('mu-level', lv + ' — ' + (LEVEL_NAMES[lv - 1] || ''));
  set('mu-racha', (u.racha || 0) + ' días');
  set('mu-horas', fmtHoras(u.horas));
  set('mu-badges', Array.isArray(u.badges) ? u.badges.length : 0);
  set('mu-friends', Array.isArray(u.friends) ? u.friends.length : 0);

  // Info de contacto
  set('mu-info-email', u.email || '—');
  set('mu-info-pid',   u.player_id || '—');
  set('mu-info-uid',   uid);
  set('mu-info-reg',   u.registrado ? fmtDate(u.registrado) : '—');
  set('mu-info-lastseen', u.presence?.lastSeen ? timeAgo(u.presence.lastSeen) : '—');
  set('mu-info-title', u.title_active || '—');
  set('mu-info-section', u.presence?.section ? (SECTION_LABELS[u.presence.section] || u.presence.section) : '—');

  // Insignias
  const badges = Array.isArray(u.badges) ? u.badges : [];
  set('mu-badges-count', badges.length);
  const badgeIcons = {
    b_newcomer:'🌱', b_daily1:'🔥', b_daily2:'💥', b_daily3:'🌋',
    b_xp1:'⚡', b_xp2:'💎', b_xp3:'👑', b_lv5:'⭐', b_lv10:'💫', b_lv15:'🚀',
    b_m5:'⚔️', b_m20:'🏹', b_m50:'🗡️', b_hour8:'⏱', b_hour24:'🕐',
    b_badge5:'🎖️', b_badge10:'🏅', b_badge20:'🌟', b_hidden1:'❓', b_hidden2:'🌀',
    b_portal1:'🌙', b_portal2:'🏰', b_pvp1:'🥊', b_pvp10:'🏆',
  };
  const badgesHTML = badges.length
    ? badges.map(bid => `<span class="mb-chip">${badgeIcons[bid] || '🎖'} ${bid}</span>`).join('')
    : '<span style="font-family:var(--font-pixel);font-size:0.26rem;color:var(--muted)">Sin insignias</span>';
  setHTML('mu-badges-list', badgesHTML);

  // Inventario
  const inv = u.inventory || {};
  set('mu-inv-tickets',   inv.tickets || 0);
  set('mu-inv-keys',      inv.keys || 0);
  set('mu-inv-superkeys', inv.superstar_keys || 0);

  // Timeline
  const tl = Array.isArray(u.timeline) ? u.timeline.slice(0, 10) : [];
  const tlEl = $('#mu-timeline');
  if (tlEl) {
    tlEl.innerHTML = tl.length
      ? tl.map(e => `
          <div class="mt-event">
            <div class="mt-icon">${e.icon || '📌'}</div>
            <div>
              <div class="mt-title">${e.title || ''}</div>
              ${e.detail ? `<div class="mt-detail">${e.detail}</div>` : ''}
              <div class="mt-time">${timeAgo(e.fecha)}</div>
            </div>
          </div>`).join('')
      : '<span style="font-family:var(--font-pixel);font-size:0.26rem;color:var(--muted)">Sin actividad</span>';
  }

  // Gestión de rol
  setHTML('rm-current-badge', roleBadgeHTML(u.role || 'user'));
  $$('.btn-role').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.role === selectedUserRole);
  });
  const saveBtn = $('#btn-save-role');
  if (saveBtn) saveBtn.disabled = true;
  const warn = $('#rm-warning');
  if (warn) warn.classList.remove('show');

  // Mostrar modal
  const modal = $('#user-modal');
  if (modal) { modal.classList.add('show'); document.body.style.overflow = 'hidden'; }
  toast('');
}

function closeModal() {
  const modal = $('#user-modal');
  if (modal) { modal.classList.remove('show'); document.body.style.overflow = ''; }
  selectedUserUID  = null;
  selectedUserRole = '';
  pendingRole      = '';
}

/* ═══════════════════════════════════════
   GESTIÓN DE ROL
═══════════════════════════════════════ */
function initRoleButtons() {
  $$('.btn-role').forEach(btn => {
    btn.addEventListener('click', () => {
      pendingRole = btn.dataset.role;
      $$('.btn-role').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');

      const warn   = $('#rm-warning');
      const saveBtn = $('#btn-save-role');

      // Advertencia si se asigna admin
      if (pendingRole === 'admin' && selectedUserRole !== 'admin') {
        if (warn) warn.classList.add('show');
      } else {
        if (warn) warn.classList.remove('show');
      }

      // Habilitar guardar solo si el rol cambió
      if (saveBtn) saveBtn.disabled = pendingRole === selectedUserRole;
    });
  });

  $('#btn-save-role')?.addEventListener('click', async () => {
    if (!selectedUserUID || !pendingRole || pendingRole === selectedUserRole) return;

    const confirmMsg = pendingRole === 'admin'
      ? `⚠ ¿Asignar ROL ADMIN a este usuario? Tendrá acceso completo al panel.`
      : `¿Cambiar rol a ${(ROLES[pendingRole] || {}).label || pendingRole}?`;

    if (!confirm(confirmMsg)) return;

    const saveBtn = $('#btn-save-role');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = '⟳ GUARDANDO...'; }

    const ok = await updateUserRole(currentAdminUID, selectedUserUID, pendingRole);

    if (ok) {
      selectedUserRole = pendingRole;
      const badgeEl = $('#muh-role-badge');
      if (badgeEl) badgeEl.innerHTML = roleBadgeHTML(pendingRole);
      const currentBadge = $('#rm-current-badge');
      if (currentBadge) currentBadge.innerHTML = roleBadgeHTML(pendingRole);
      const warn = $('#rm-warning');
      if (warn) warn.classList.remove('show');

      // Actualizar en la tabla en memoria
      const cached = allUsersCache.find(u => u.uid === selectedUserUID);
      if (cached) cached.role = pendingRole;
      renderTable(allUsersCache);

      toast(`✓ ROL ACTUALIZADO → ${(ROLES[pendingRole] || {}).label || pendingRole}`, 'ok');
    } else {
      toast('❌ No se pudo actualizar el rol', 'error');
    }

    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = '💾 GUARDAR ROL'; }
  });
}

/* ═══════════════════════════════════════
   INICIALIZACIÓN PRINCIPAL
═══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  hideLoader();
  initStars();

  onAuthChange(async (user) => {
    if (!user) { window.location.href = 'index.html'; return; }

    // Verificar si el usuario es admin
    const isAdmin = await verifyAdminAccess(user.uid);

    if (!isAdmin) {
      // Mostrar pantalla de acceso denegado
      const denied = $('#access-denied');
      if (denied) denied.classList.add('show');
      return;
    }

    // Acceso concedido
    currentAdminUID = user.uid;

    const header  = $('#main-header');
    const content = $('#main-content');
    if (header)  header.style.display  = '';
    if (content) content.style.display = '';

    // Mostrar nombre del admin en header
    const navUser = $('#nav-user-name');
    if (navUser) {
      const lsUser = localStorage.getItem('mv_user');
      const userData = lsUser ? JSON.parse(lsUser) : {};
      navUser.textContent = (userData.nombre || user.email || 'Admin').toUpperCase();
    }

    const uidDisplay = $('#admin-uid-display');
    if (uidDisplay) uidDisplay.textContent = `UID: ${user.uid.slice(0, 12)}...`;

    // Cargar stats y usuarios
    await Promise.all([loadStats(), loadUsers(true)]);

    // Logout
    $('#btn-logout')?.addEventListener('click', async () => {
      if (!confirm('¿Cerrar sesión del panel admin?')) return;
      await logout();
      window.location.href = 'index.html';
    });

    // Búsqueda
    $('#btn-search')?.addEventListener('click', handleSearch);
    $('#user-search-input')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') handleSearch();
    });

    // Refresh
    $('#btn-refresh')?.addEventListener('click', () => {
      $('#user-search-input').value = '';
      activeRoleFilter = '';
      $$('.rf-btn').forEach(b => b.classList.remove('active'));
      $$('.rf-btn')[0]?.classList.add('active');
      loadUsers(true);
    });

    // Filtros por rol
    $$('.rf-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.rf-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeRoleFilter = btn.dataset.role || '';
        $('#user-search-input').value = '';
        loadUsers(true);
      });
    });

    // Paginación
    $('#btn-next')?.addEventListener('click', async () => {
      if (!hasMore) return;
      currentPage++;
      const result = await getAllUsers(PAGE_SIZE, lastVisible);
      lastVisible = result.lastDoc;
      hasMore     = result.hasMore;
      allUsersCache = [...allUsersCache, ...result.users];
      renderTable(result.users);
      const pi = $('#page-info');
      if (pi) pi.textContent = `Mostrando ${allUsersCache.length} usuario(s)`;
      $('#btn-next').disabled = !hasMore;
      $('#btn-prev').disabled = currentPage <= 1;
    });

    // Modal
    $('#modal-close')?.addEventListener('click', closeModal);
    $('#user-modal')?.addEventListener('click', e => {
      if (e.target === $('#user-modal')) closeModal();
    });

    // Botones de rol en modal
    initRoleButtons();
  });
});