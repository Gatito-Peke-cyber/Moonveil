// ==========================================
// BANCO DEL REINO - MOONVEIL PORTAL v3.0
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
  
  // ========== CONFIGURACIÓN ==========
  const CONFIG = {
    currencies: {
      esmeralda: { rate: 7200, max: 50, status: 'active', name: 'Esmeraldas' },
      cobre: { rate: 3600, max: 50, status: 'active', name: 'Lingotes de Cobre' },
      oro: { rate: 10800, max: 50, status: 'active', name: 'Pepitas de Oro' },
      hierro: { rate: 5400, max: 50, status: 'active', name: 'Pepitas de Hierro' },
      inframundo: { rate: 14400, max: 50, status: 'active', name: 'Lingotes de Inframundo' },
      ladrillo: { rate: 2700, max: 50, status: 'active', name: 'Ladrillos' },
      rapida: { rate: 10, max: 999999, status: 'active', name: 'Pepitas Rápidas' },
      diamante: { 
        rate: 18000, 
        max: 50, 
        status: 'event',
        name: 'Diamantes',
        eventStart: new Date('2026-02-10T00:00:00'),
        eventEnd: new Date('2026-02-20T23:59:59')
      },
      netherita: { 
        rate: 21600, 
        max: 50, 
        status: 'maintenance',
        name: 'Netherita',
        returnDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000)
      }
    },
    saveKey: 'moonveilBank_v3',
    logMaxEntries: 100
  };

  // ========== ESTADO DEL BANCO ==========
  const bankState = {
    currencies: {},
    activityLog: [],
    stats: {
      totalCollected: 0,
      firstVisit: Date.now(),
      lastVisit: Date.now()
    }
  };

  // ========== INICIALIZACIÓN ==========
  function init() {
    updateYear();
    initializeCurrencies();
    loadSavedData();
    updateAllDisplays();
    startAutoUpdate();
    setupEventListeners();
    checkEventStatus();
    addLog('Sistema bancario inicializado correctamente', 'system');
  }

  function updateYear() {
    const yearEl = document.getElementById('currentYear');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  function initializeCurrencies() {
    Object.keys(CONFIG.currencies).forEach(key => {
      bankState.currencies[key] = {
        total: 0,
        vault: 0,
        lastUpdate: Date.now(),
        nextUpdate: Date.now() + (CONFIG.currencies[key].rate * 1000)
      };
    });
  }

  // ========== GESTIÓN DE DATOS ==========
  function loadSavedData() {
    try {
      const saved = localStorage.getItem(CONFIG.saveKey);
      if (!saved) return;

      const data = JSON.parse(saved);
      
      if (data.currencies) {
        Object.keys(data.currencies).forEach(key => {
          if (bankState.currencies[key]) {
            bankState.currencies[key] = {
              ...bankState.currencies[key],
              ...data.currencies[key]
            };
          }
        });
      }

      if (data.stats) {
        bankState.stats = { ...bankState.stats, ...data.stats };
      }

      if (data.activityLog) {
        bankState.activityLog = data.activityLog.slice(0, CONFIG.logMaxEntries);
      }

      calculateOfflineGains();
      
    } catch (e) {
      console.error('Error al cargar datos:', e);
    }
  }

  function saveData() {
    try {
      const dataToSave = {
        currencies: bankState.currencies,
        stats: bankState.stats,
        activityLog: bankState.activityLog,
        lastSave: Date.now()
      };
      localStorage.setItem(CONFIG.saveKey, JSON.stringify(dataToSave));
    } catch (e) {
      console.error('Error al guardar datos:', e);
    }
  }

  function calculateOfflineGains() {
    const now = Date.now();
    const timePassed = now - bankState.stats.lastVisit;
    
    if (timePassed < 1000) return;

    let totalGains = 0;

    Object.keys(CONFIG.currencies).forEach(key => {
      const config = CONFIG.currencies[key];
      const state = bankState.currencies[key];
      
      // No calcular si está en mantenimiento
      if (config.status === 'maintenance') return;
      
      // No calcular si es evento y no está activo
      if (config.status === 'event' && !isEventActive(key)) return;

      const rateMs = config.rate * 1000;
      const gains = Math.floor(timePassed / rateMs);
      
      if (gains > 0) {
        const space = config.max - state.vault;
        const toAdd = Math.min(gains, space);
        
        if (toAdd > 0) {
          state.vault += toAdd;
          totalGains += toAdd;
          state.lastUpdate = now - (timePassed % rateMs);
          state.nextUpdate = state.lastUpdate + rateMs;
        }
      }
    });

    if (totalGains > 0) {
      showToast(`¡Ganaste ${totalGains} monedas mientras estabas ausente!`);
      addLog(`Ganancias automáticas: +${totalGains} monedas`, 'auto');
    }

    bankState.stats.lastVisit = now;
  }

  // ========== EVENTOS ==========
  function checkEventStatus() {
    const now = new Date();
    
    Object.keys(CONFIG.currencies).forEach(key => {
      const config = CONFIG.currencies[key];
      
      if (config.status === 'event') {
        const active = isEventActive(key);
        updateEventDisplay(key, active);
      } else if (config.status === 'maintenance') {
        updateMaintenanceDisplay(key);
      }
    });
  }

  function isEventActive(currency) {
    const config = CONFIG.currencies[currency];
    if (config.status !== 'event') return false;
    
    const now = new Date();
    return now >= config.eventStart && now <= config.eventEnd;
  }

  function updateEventDisplay(currency, isActive) {
    const overlay = document.getElementById(`eventOverlay${capitalize(currency)}`);
    const btn = document.querySelector(`.btn-collect[data-currency="${currency}"]`);
    const btnText = document.getElementById(`btnText${capitalize(currency)}`);
    
    if (!overlay || !btn) return;

    const now = new Date();
    const config = CONFIG.currencies[currency];
    
    if (isActive) {
      overlay.style.display = 'none';
      btn.disabled = false;
      if (btnText) btnText.textContent = 'Recolectar';
      updateCountdown(currency, config.eventEnd, 'Tiempo restante: ');
    } else {
      overlay.style.display = 'flex';
      btn.disabled = true;
      
      if (now < config.eventStart) {
        // Evento próximo
        const icon = overlay.querySelector('.overlay-icon');
        const title = overlay.querySelector('h4');
        const message = overlay.querySelector('p');
        
        if (icon) icon.textContent = ''; //icono aqui
        if (title) title.textContent = 'Próximamente';
        if (message) message.textContent = 'Este evento comenzará pronto';
        if (btnText) btnText.textContent = 'Evento no disponible';
        
        updateCountdown(currency, config.eventStart, 'Comienza en: ');
        
      } else if (now > config.eventEnd) {
        // Evento terminado
        const icon = overlay.querySelector('.overlay-icon');
        const title = overlay.querySelector('h4');
        const message = overlay.querySelector('p');
        const countdown = document.getElementById(`eventCountdown${capitalize(currency)}`);
        
        if (icon) icon.textContent = '';   // icono 2 aqui
        if (title) title.textContent = 'Evento Finalizado';
        if (message) message.textContent = '¡Gracias por participar!';
        if (countdown) countdown.textContent = '';
        if (btnText) btnText.textContent = 'Evento finalizado';
        
        // Limpiar la bóveda si el evento terminó
        if (bankState.currencies[currency].vault > 0) {
          bankState.currencies[currency].vault = 0;
          updatePiggyFill(currency);
        }
      }
    }
  }

  function updateCountdown(currency, targetDate, prefix = '') {
    const countdownEl = document.getElementById(`eventCountdown${capitalize(currency)}`);
    if (!countdownEl) return;

    const updateFn = () => {
      const now = new Date();
      const diff = targetDate - now;
      
      if (diff <= 0) {
        countdownEl.textContent = prefix + '¡Ya!';
        checkEventStatus();
        return;
      }

      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((diff % (60 * 1000)) / 1000);

      let timeStr = '';
      if (days > 0) timeStr = `${days}d ${hours}h`;
      else if (hours > 0) timeStr = `${hours}h ${minutes}m`;
      else if (minutes > 0) timeStr = `${minutes}m ${seconds}s`;
      else timeStr = `${seconds}s`;

      countdownEl.textContent = prefix + timeStr;
    };

    updateFn();
    setInterval(updateFn, 1000);
  }

  function updateMaintenanceDisplay(currency) {
    const config = CONFIG.currencies[currency];
    const returnEl = document.getElementById(`return${capitalize(currency)}`);
    const etaEl = document.getElementById(`eta${capitalize(currency)}`);
    
    if (!config.returnDate) return;

    const now = new Date();
    const diff = config.returnDate - now;
    
    if (diff <= 0) {
      if (returnEl) returnEl.textContent = 'Pronto';
      if (etaEl) etaEl.textContent = 'Pronto';
      return;
    }

    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const timeStr = `${days}d ${hours}h`;
    
    if (returnEl) returnEl.textContent = timeStr;
    if (etaEl) etaEl.textContent = timeStr;
  }

  // ========== ACTUALIZACIÓN DE DISPLAYS ==========
  function updateAllDisplays() {
    updateGlobalStats();
    
    Object.keys(CONFIG.currencies).forEach(key => {
      updateCurrencyDisplay(key);
      updatePiggyFill(key);
      updateBadge(key);
    });
    
    updateCollectButtons();
    updateActivityLog();
  }

  function updateGlobalStats() {
    let totalCoins = 0;
    let activeVaults = 0;

    Object.keys(CONFIG.currencies).forEach(key => {
      const state = bankState.currencies[key];
      const config = CONFIG.currencies[key];
      
      totalCoins += state.total;
      
      if (config.status === 'active' || (config.status === 'event' && isEventActive(key))) {
        activeVaults++;
      }
    });

    const totalCoinsEl = document.getElementById('totalCoins');
    const activeVaultsEl = document.getElementById('activeVaults');
    const uptimeEl = document.getElementById('uptime');

    if (totalCoinsEl) totalCoinsEl.textContent = totalCoins;
    if (activeVaultsEl) activeVaultsEl.textContent = activeVaults;
    
    if (uptimeEl) {
      const diff = Date.now() - bankState.stats.firstVisit;
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      uptimeEl.textContent = `${days}d ${hours}h`;
    }
  }

  function updateCurrencyDisplay(currency) {
    const config = CONFIG.currencies[currency];
    const state = bankState.currencies[currency];
    const now = Date.now();

    // Actualizar totales
    const totalEl = document.getElementById(`total${capitalize(currency)}`);
    if (totalEl) totalEl.textContent = state.total;

    const vaultEl = document.getElementById(`vault${capitalize(currency)}`);
    if (vaultEl) vaultEl.textContent = `${state.vault}/${config.max}`;

    const counterEl = document.getElementById(`counter${capitalize(currency)}`);
    if (counterEl) counterEl.textContent = state.vault;

    // Verificar si debe ganar moneda
    if (config.status === 'active' || (config.status === 'event' && isEventActive(currency))) {
      if (now >= state.nextUpdate && state.vault < config.max) {
        state.vault++;
        state.lastUpdate = now;
        state.nextUpdate = now + (config.rate * 1000);
        
        updatePiggyFill(currency);
        updateBadge(currency);
        
        if (state.vault >= config.max) {
          showToast(`¡La bóveda de ${config.name} está llena!`);
        }
        
        saveData();
      }
    }

    // Actualizar próxima ganancia
    const nextEl = document.getElementById(`next${capitalize(currency)}`);
    if (nextEl && (config.status === 'active' || (config.status === 'event' && isEventActive(currency)))) {
      const timeToNext = state.nextUpdate - now;
      nextEl.textContent = formatTime(timeToNext, currency === 'rapida');
    }
  }

  function updatePiggyFill(currency) {
    const config = CONFIG.currencies[currency];
    const state = bankState.currencies[currency];
    
    const fillEl = document.getElementById(`fill${capitalize(currency)}`);
    if (!fillEl) return;

    const percentage = (state.vault / config.max) * 100;
    fillEl.style.height = `${Math.min(percentage, 100)}%`;
  }

  function updateBadge(currency) {
    const state = bankState.currencies[currency];
    const badgeEl = document.getElementById(`badge${capitalize(currency)}`);
    
    if (!badgeEl) return;

    if (state.vault > 0) {
      badgeEl.textContent = state.vault;
      badgeEl.classList.add('show');
    } else {
      badgeEl.classList.remove('show');
    }
  }

  function updateCollectButtons() {
    let canCollectAny = false;

    Object.keys(CONFIG.currencies).forEach(key => {
      const config = CONFIG.currencies[key];
      const state = bankState.currencies[key];
      const btn = document.querySelector(`.btn-collect[data-currency="${key}"]`);
      
      if (!btn) return;

      const canCollect = state.vault > 0 && 
                        (config.status === 'active' || 
                         (config.status === 'event' && isEventActive(key)));

      btn.disabled = !canCollect;

      if (canCollect) canCollectAny = true;
    });

    const collectAllBtn = document.getElementById('collectAllBtn');
    if (collectAllBtn) {
      collectAllBtn.disabled = !canCollectAny;
    }
  }

  // ========== RECOLECCIÓN ==========
  function collectCurrency(currency) {
    const config = CONFIG.currencies[currency];
    const state = bankState.currencies[currency];

    if (config.status === 'maintenance') {
      showToast(`${config.name} está en mantenimiento`);
      return;
    }

    if (config.status === 'event' && !isEventActive(currency)) {
      showToast(`El evento de ${config.name} no está disponible`);
      return;
    }

    if (state.vault === 0) {
      showToast(`No hay ${config.name} para recolectar`);
      return;
    }

    const amount = state.vault;
    state.total += amount;
    state.vault = 0;
    bankState.stats.totalCollected += amount;

    updatePiggyFill(currency);
    updateBadge(currency);
    updateCurrencyDisplay(currency);
    updateGlobalStats();
    
    animateCollection(currency, amount);
    addLog(`Recolectadas ${amount} ${config.name}`, 'collect');
    showToast(`¡Recolectaste ${amount} ${config.name}!`);
    
    saveData();
  }

  function collectAll() {
    let totalCollected = 0;
    const collected = [];

    Object.keys(CONFIG.currencies).forEach(key => {
      const config = CONFIG.currencies[key];
      const state = bankState.currencies[key];
      
      const canCollect = state.vault > 0 && 
                        (config.status === 'active' || 
                         (config.status === 'event' && isEventActive(key)));

      if (canCollect) {
        const amount = state.vault;
        state.total += amount;
        state.vault = 0;
        totalCollected += amount;
        
        collected.push({ currency: key, amount });
        
        updatePiggyFill(key);
        updateBadge(key);
        updateCurrencyDisplay(key);
      }
    });

    if (totalCollected === 0) {
      showToast('No hay monedas para recolectar');
      return;
    }

    bankState.stats.totalCollected += totalCollected;
    updateGlobalStats();
    
    collected.forEach(item => {
      animateCollection(item.currency, item.amount);
    });
    
    addLog(`Recolección total: ${totalCollected} monedas`, 'collect');
    showToast(`¡Recolectaste ${totalCollected} monedas en total!`);
    
    saveData();
  }

  // ========== ANIMACIONES ==========
  function animateCollection(currency, amount) {
    const piggyEl = document.getElementById(`piggy${capitalize(currency)}`);
    if (!piggyEl) return;

    piggyEl.classList.add('piggy-shake');
    setTimeout(() => piggyEl.classList.remove('piggy-shake'), 500);

    // Crear partículas
    const rect = piggyEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const particleCount = Math.min(amount, 15);

    for (let i = 0; i < particleCount; i++) {
      setTimeout(() => {
        createCoinParticle(centerX, centerY, currency);
      }, i * 50);
    }
  }

  function createCoinParticle(x, y, currency) {
    const particle = document.createElement('div');
    particle.style.position = 'fixed';
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    particle.style.fontSize = '1.5rem';
    particle.style.pointerEvents = 'none';
    particle.style.zIndex = '10000';
    particle.textContent = getCurrencyIcon(currency);
    
    document.body.appendChild(particle);

    const angle = Math.random() * Math.PI * 2;
    const distance = 80 + Math.random() * 40;
    const targetX = x + Math.cos(angle) * distance;
    const targetY = y + Math.sin(angle) * distance;

    const animation = particle.animate([
      { 
        transform: 'translate(-50%, -50%) scale(1) rotate(0deg)',
        opacity: 1
      },
      { 
        transform: `translate(${targetX - x}px, ${targetY - y}px) scale(0.5) rotate(360deg)`,
        opacity: 0
      }
    ], {
      duration: 800,
      easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)'
    });

    animation.onfinish = () => {
      if (particle.parentNode) {
        particle.parentNode.removeChild(particle);
      }
    };
  }

  // ========== LOG DE ACTIVIDAD ==========
  function addLog(message, type = 'normal') {
    const entry = {
      time: Date.now(),
      message,
      type
    };

    bankState.activityLog.unshift(entry);
    
    if (bankState.activityLog.length > CONFIG.logMaxEntries) {
      bankState.activityLog = bankState.activityLog.slice(0, CONFIG.logMaxEntries);
    }

    updateActivityLog();
  }

  function updateActivityLog() {
    const logEl = document.getElementById('activityLog');
    if (!logEl) return;

    logEl.innerHTML = '';

    const entries = bankState.activityLog.slice(0, 20);
    
    if (entries.length === 0) {
      logEl.innerHTML = '<div class="log-entry"><span class="log-msg">No hay actividad reciente</span></div>';
      return;
    }

    entries.forEach(entry => {
      const div = document.createElement('div');
      div.className = `log-entry ${entry.type}`;
      
      const time = new Date(entry.time);
      const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
      
      div.innerHTML = `
        <span class="log-time">${timeStr}</span>
        <span class="log-msg">${entry.message}</span>
      `;
      
      logEl.appendChild(div);
    });
  }

  // ========== EVENT LISTENERS ==========
  function setupEventListeners() {
    // Botones de recolección individual
    document.querySelectorAll('.btn-collect').forEach(btn => {
      btn.addEventListener('click', function() {
        const currency = this.getAttribute('data-currency');
        if (currency) collectCurrency(currency);
      });
    });

    // Botón recolectar todo
    const collectAllBtn = document.getElementById('collectAllBtn');
    if (collectAllBtn) {
      collectAllBtn.addEventListener('click', collectAll);
    }

    // Animación de la bóveda
    const vaultDoor = document.getElementById('vaultDoor');
    if (vaultDoor) {
      vaultDoor.addEventListener('click', animateVault);
    }
  }

  function animateVault() {
    const vaultDoor = document.getElementById('vaultDoor');
    if (!vaultDoor) return;

    vaultDoor.style.transform = 'scale(1.1) rotate(-10deg)';
    
    setTimeout(() => {
      vaultDoor.style.transform = '';
    }, 500);

    let total = 0;
    Object.values(bankState.currencies).forEach(state => {
      total += state.total;
    });

    showToast(`Bóveda: ${total} monedas guardadas`);
  }

  // ========== AUTO-UPDATE ==========
  function startAutoUpdate() {
    // Actualizar cada segundo
    setInterval(() => {
      Object.keys(CONFIG.currencies).forEach(updateCurrencyDisplay);
      updateCollectButtons();
    }, 1000);

    // Verificar eventos cada minuto
    setInterval(checkEventStatus, 60000);

    // Guardar cada 30 segundos
    setInterval(saveData, 30000);

    // Actualizar stats cada 5 segundos
    setInterval(updateGlobalStats, 5000);
  }

  // ========== UTILIDADES ==========
  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function formatTime(ms, isSeconds = false) {
    if (ms <= 0) return '¡Ahora!';

    if (isSeconds) {
      const seconds = Math.floor(ms / 1000);
      return `${seconds}s`;
    }

    const hours = Math.floor(ms / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((ms % (60 * 1000)) / 1000);

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  }

  function getCurrencyIcon(currency) {
    const icons = {
      esmeralda: '💎',
      cobre: '🟫',
      oro: '⭐',
      hierro: '⚙️',
      inframundo: '🔥',
      ladrillo: '🧱',
      rapida: '⚡',
      diamante: '💠',
      netherita: '🌑'
    };
    return icons[currency] || '💰';
  }

  function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  // ========== INICIAR ==========
  init();
});