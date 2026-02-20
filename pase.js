/**
 * Moonveil Galactic Pass - Sistema Completo V3 FINAL
 * CORRECCIÓN: Los pases se resetean cada temporada
 * - Compras el pase en Temporada 1 → Solo válido para Temporada 1
 * - Temporada 2 comienza → Necesitas comprar el pase de nuevo
 */

// =================== CONFIGURACIÓN ===================
const CONFIG = {
    TOTAL_LEVELS: 60,
    LEVELS_PER_PAGE: 12,
    BASE_XP_PER_LEVEL: 1000,
    STORAGE_KEY: 'moonveil_galactic_pass_v3_final'
};

// NOMBRES DE TEMPORADAS
const SEASON_NAMES = [
    'ESFERA NEBULOSA',
    'ECLIPSE CÓSMICO',
    'AURORA GALÁCTICA',
    'VÓRTICE ESTELAR',
    'CONSTELACIÓN INFINITA',
    'NEBULOSA OSCURA',
    'PULSAR RADIANTE',
    'SINGULARIDAD CUÁNTICA',
    'HORIZONTE DE EVENTOS',
    'SUPERNOVA PRIMORDIAL'
];

// PRECIOS DE PASES (se pagan cada temporada)
const PASS_PRICES = {
    premium: 500,
    crystal: 1000,
    village: 1500,
    vip: 2500
};

// BONIFICACIONES DIARIAS
const DAILY_BONUSES = [
    {type: 'xp_boost', value: 15, description: '+15% XP en todas las misiones', icon: 'fa-bolt'},
    {type: 'xp_boost', value: 20, description: '+20% XP Extra en todo!', icon: 'fa-star'},
    {type: 'discount', value: 10, description: '10% descuento en mejoras', icon: 'fa-tag'},
    {type: 'discount', value: 15, description: '15% descuento especial!', icon: 'fa-percent'},
    {type: 'mission_reset', value: 50, description: 'Misiones 50% más rápidas', icon: 'fa-sync-alt'},
    {type: 'double_rewards', value: 2, description: '¡Recompensas dobles!', icon: 'fa-gem'}
];

// =================== ESTADO INICIAL ===================
const INITIAL_STATE = {
    seasonNumber: 1,
    seasonStartDate: null,
    seasonEndDate: null,
    playerLevel: 1,
    playerXP: 0,
    maxXP: 1000,
    purchasedPasses: ['free'], // Solo FREE al inicio
    unlockedLevels: new Set([1]),
    claimedRewards: new Set([]),
    currentPage: 1,
    missions: {
        daily: {},
        weekly: {},
        monthly: {}
    },
    treasure: {
        totalGems: 0,
        totalCoins: 0,
        skins: [],
        items: [],
        history: []
    },
    dailyBonus: null,
    lastDailyBonusDate: null,
    musicVolume: 0.3,
    currentMusic: 'free'
};

// =================== DATOS DE MISIONES ===================
const MISSIONS_DATA = {
    daily: [
        {id: 'daily-1', title: 'Viaje Interestelar', description: 'Completa 3 misiones en cualquier galaxia', xp: 500, maxProgress: 3},
        {id: 'daily-2', title: 'Recolección Estelar', description: 'Recolecta 50 fragmentos cósmicos', xp: 300, maxProgress: 50},
        {id: 'daily-3', title: 'Combate Espacial', description: 'Derrota 10 naves enemigas', xp: 400, maxProgress: 10}
    ],
    weekly: [
        {id: 'weekly-1', title: 'Explorador Galáctico', description: 'Completa 15 misiones diarias', xp: 2000, maxProgress: 15},
        {id: 'weekly-2', title: 'Conquistador de Sistemas', description: 'Visita 5 sistemas estelares', xp: 2500, maxProgress: 5}
    ],
    monthly: [
        {id: 'monthly-1', title: 'Maestro Intergaláctico', description: 'Completa 50 intercambios', xp: 8000, maxProgress: 50}
    ]
};

// =================== DATOS DE RECOMPENSAS ===================
const REWARDS_DATA = Array.from({length: 60}, (_, i) => {
    const level = i + 1;
    const rewardTypes = [
        {tier: 'free', name: `${level * 50} Esmeraldas Cósmicas`, icon: 'fa-coins', type: 'currency'},
        {tier: 'premium', name: `Traje Estelar Nv.${level}`, icon: 'fa-user-astronaut', type: 'skin'},
        {tier: 'crystal', name: `Gema de Poder Nv.${level}`, icon: 'fa-gem', type: 'item'},
        {tier: 'village', name: `Mascota Cósmica Nv.${level}`, icon: 'fa-robot', type: 'item'},
        {tier: 'vip', name: `Título Galáctico Nv.${level}`, icon: 'fa-trophy', type: 'item'}
    ];
    const reward = rewardTypes[level % 5];
    return {level, ...reward, xp: level * CONFIG.BASE_XP_PER_LEVEL};
});

// =================== ESTADO GLOBAL ===================
let STATE = null;

// =================== FUNCIONES DE ALMACENAMIENTO ===================
function loadState() {
    try {
        const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            parsed.unlockedLevels = new Set(parsed.unlockedLevels || [1]);
            parsed.claimedRewards = new Set(parsed.claimedRewards || []);
            
            if (parsed.seasonEndDate) {
                const endDate = new Date(parsed.seasonEndDate);
                const now = new Date();
                
                if (now > endDate) {
                    return startNewSeason(parsed);
                }
            }
            
            if (!parsed.seasonStartDate || !parsed.seasonEndDate) {
                return initializeSeasonDates(parsed);
            }
            
            return parsed;
        }
    } catch (e) {
        console.error('Error al cargar estado:', e);
    }
    return initializeSeasonDates({...INITIAL_STATE});
}

function initializeSeasonDates(state) {
    const now = new Date();
    state.seasonStartDate = now.toISOString();
    
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + daysInMonth);
    state.seasonEndDate = endDate.toISOString();
    
    return state;
}

function startNewSeason(oldState) {
    console.log('🔄 NUEVA TEMPORADA - Los pases se resetean');
    
    if (!oldState.treasure.history) {
        oldState.treasure.history = [];
    }
    
    // Guardar historial de la temporada anterior
    oldState.treasure.history.push({
        season: oldState.seasonNumber,
        seasonName: SEASON_NAMES[(oldState.seasonNumber - 1) % SEASON_NAMES.length],
        level: oldState.playerLevel,
        rewardsCollected: Array.from(oldState.claimedRewards || []).length,
        passesOwned: [...(oldState.purchasedPasses || ['free'])],
        date: new Date().toISOString()
    });
    
    // IMPORTANTE: Los pases se RESETEAN - Solo FREE queda activo
    const newState = {
        ...oldState,
        seasonNumber: oldState.seasonNumber + 1,
        playerLevel: 1,
        playerXP: 0,
        maxXP: 1000,
        purchasedPasses: ['free'], // ⚠️ RESETEA PASES - Solo FREE
        unlockedLevels: new Set([1]),
        claimedRewards: new Set([]),
        currentPage: 1,
        missions: {daily: {}, weekly: {}, monthly: {}},
        currentMusic: 'free',
        // Mantener el tesoro acumulado
        treasure: oldState.treasure
    };
    
    return initializeSeasonDates(newState);
}

function saveState() {
    try {
        const data = {
            ...STATE,
            unlockedLevels: Array.from(STATE.unlockedLevels),
            claimedRewards: Array.from(STATE.claimedRewards)
        };
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error('Error al guardar estado:', e);
    }
}

// =================== INICIALIZACIÓN ===================
document.addEventListener('DOMContentLoaded', function() {
    STATE = loadState();
    initGalacticPass();
    setupEventListeners();
    updateAllTimers();
    checkDailyBonus();
    updateMusic();
    
    setInterval(updateAllTimers, 1000);
    
    document.getElementById('currentYear').textContent = new Date().getFullYear();
});

function initGalacticPass() {
    initializeMissions();
    updateSeasonInfo();
    updateHUD();
    updateProgressRing();
    renderLevels(STATE.currentPage);
    renderMissions();
    renderTreasure();
    renderTimeline();
    updateTierStatus();
    updateUpgradeDiscounts();
    showSection('pass');
}

function initializeMissions() {
    const now = new Date();
    const today = now.toDateString();
    
    Object.keys(MISSIONS_DATA).forEach(category => {
        if (!STATE.missions[category]) STATE.missions[category] = {};
        
        MISSIONS_DATA[category].forEach(mission => {
            if (!STATE.missions[category][mission.id]) {
                STATE.missions[category][mission.id] = {
                    progress: mission.maxProgress,
                    claimed: false,
                    lastReset: today
                };
            }
        });
    });
    
    saveState();
}

// =================== BONIFICACIÓN DIARIA ===================
function checkDailyBonus() {
    const today = new Date().toDateString();
    
    if (STATE.lastDailyBonusDate !== today) {
        const randomBonus = DAILY_BONUSES[Math.floor(Math.random() * DAILY_BONUSES.length)];
        STATE.dailyBonus = randomBonus;
        STATE.lastDailyBonusDate = today;
        saveState();
        showDailyBonusNotification(randomBonus);
    }
    
    if (STATE.dailyBonus && STATE.dailyBonus.type === 'xp_boost') {
        const boostIndicator = document.getElementById('xpBoostIndicator');
        if (boostIndicator) {
            boostIndicator.style.display = 'flex';
            document.getElementById('xpBoostValue').textContent = `+${STATE.dailyBonus.value}%`;
        }
    }
}

function showDailyBonusNotification(bonus) {
    const notification = document.getElementById('dailyBonusNotification');
    const description = document.getElementById('bonusDescription');
    
    if (notification && description) {
        description.textContent = bonus.description;
        notification.classList.add('show');
        setTimeout(() => notification.classList.remove('show'), 10000);
    }
}

// =================== ACTUALIZACIÓN DE INTERFAZ ===================
function updateSeasonInfo() {
    const seasonName = SEASON_NAMES[(STATE.seasonNumber - 1) % SEASON_NAMES.length];
    document.getElementById('currentSeasonTitle').textContent = seasonName;
    document.getElementById('currentSeasonNumber').textContent = STATE.seasonNumber;
    
    const footerSeason = document.getElementById('footerSeasonName');
    if (footerSeason) footerSeason.textContent = seasonName;
}

function updateHUD() {
    document.querySelector('.hud-bar.hp').style.setProperty('--v', '82');
    document.querySelector('.hud-bar.xp').style.setProperty('--v', '63');
    
    document.getElementById('currentLevel').textContent = STATE.playerLevel;
    document.getElementById('currentXP').textContent = STATE.playerXP.toLocaleString();
    document.getElementById('maxXP').textContent = STATE.maxXP.toLocaleString();
}

function updateProgressRing() {
    const progressPercent = (STATE.playerXP / STATE.maxXP) * 100;
    const circle = document.querySelector('.progress-ring-circle');
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progressPercent / 100) * circumference;
    
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = offset;
    
    document.getElementById('progressPercent').textContent = `${Math.round(progressPercent)}%`;
}

// =================== TEMPORIZADOR PERSISTENTE ===================
function updateAllTimers() {
    updateSeasonTimer();
    updateMissionTimers();
}

function updateSeasonTimer() {
    const endDate = new Date(STATE.seasonEndDate);
    const now = new Date();
    const diff = endDate - now;
    
    if (diff <= 0) {
        document.getElementById('days').textContent = '00';
        document.getElementById('hours').textContent = '00';
        document.getElementById('minutes').textContent = '00';
        document.getElementById('seconds').textContent = '00';
        
        STATE = startNewSeason(STATE);
        saveState();
        initGalacticPass();
        showNotification('🎉 ¡Nueva temporada! Los pases se han reseteado.');
        return;
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    document.getElementById('days').textContent = days.toString().padStart(2, '0');
    document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
    document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
    document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
    
    const endDateDisplay = document.getElementById('endDateDisplay');
    if (endDateDisplay) {
        endDateDisplay.textContent = endDate.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
}

function updateMissionTimers() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setHours(24, 0, 0, 0);
    const diffDaily = tomorrow - now;
    
    const dailyHours = Math.floor(diffDaily / (1000 * 60 * 60));
    const dailyMinutes = Math.floor((diffDaily % (1000 * 60 * 60)) / (1000 * 60));
    const dailySeconds = Math.floor((diffDaily % (1000 * 60)) / 1000);
    
    const dailyReset = document.getElementById('dailyReset');
    if (dailyReset) {
        dailyReset.textContent = `${dailyHours}h ${dailyMinutes}m ${dailySeconds}s`;
    }
    
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + (7 - now.getDay() + 1) % 7 || 7);
    nextMonday.setHours(0, 0, 0, 0);
    const diffWeekly = nextMonday - now;
    
    const weeklyDays = Math.floor(diffWeekly / (1000 * 60 * 60 * 24));
    const weeklyHours = Math.floor((diffWeekly % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    const weeklyReset = document.getElementById('weeklyReset');
    if (weeklyReset) {
        weeklyReset.textContent = `${weeklyDays}d ${weeklyHours}h`;
    }
    
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const diffMonthly = nextMonth - now;
    const monthlyDays = Math.floor(diffMonthly / (1000 * 60 * 60 * 24));
    
    const monthlyReset = document.getElementById('monthlyReset');
    if (monthlyReset) {
        monthlyReset.textContent = `${monthlyDays}d`;
    }
}

// =================== RENDERIZADO DE NIVELES ===================
function renderLevels(page) {
    const container = document.getElementById('levelsGrid');
    const start = (page - 1) * CONFIG.LEVELS_PER_PAGE + 1;
    const end = Math.min(start + CONFIG.LEVELS_PER_PAGE - 1, CONFIG.TOTAL_LEVELS);
    
    container.innerHTML = '';
    document.getElementById('gridRange').textContent = `${start} - ${end}`;
    
    for (let i = start; i <= end; i++) {
        const level = i;
        const reward = REWARDS_DATA[level - 1];
        
        const isCurrent = level === STATE.playerLevel;
        const isLocked = !STATE.unlockedLevels.has(level);
        const isCompleted = level < STATE.playerLevel;
        const isClaimed = STATE.claimedRewards.has(level);
        const hasAccess = STATE.purchasedPasses.includes(reward.tier);
        
        const levelElement = document.createElement('div');
        levelElement.className = 'level-card';
        if (isCurrent) levelElement.classList.add('current');
        if (isCompleted) levelElement.classList.add('completed');
        if (isLocked) levelElement.classList.add('locked');
        
        levelElement.innerHTML = `
            <div class="level-number">NIVEL ${level}</div>
            <div class="level-xp">${reward.xp.toLocaleString()} XP</div>
            <div class="reward-icon ${reward.tier}">
                <i class="fas ${reward.icon}"></i>
            </div>
            <div class="reward-name">${reward.name}</div>
            <div class="reward-tier">${reward.tier.toUpperCase()}</div>
            <button class="claim-btn" 
                ${isClaimed || !hasAccess || isLocked ? 'disabled' : ''}
                data-level="${level}"
                data-tier="${reward.tier}">
                ${isClaimed ? 'RECLAMADO' : 
                  !hasAccess ? 'BLOQUEADO' : 
                  isLocked ? 'BLOQUEADO' : 'RECLAMAR'}
            </button>
        `;
        
        container.appendChild(levelElement);
    }
    
    updateGridNavigation(page);
}

function updateGridNavigation(page) {
    const prevBtn = document.getElementById('prevGrid');
    const nextBtn = document.getElementById('nextGrid');
    
    prevBtn.disabled = page === 1;
    nextBtn.disabled = page * CONFIG.LEVELS_PER_PAGE >= CONFIG.TOTAL_LEVELS;
}

// =================== RENDERIZADO DE MISIONES ===================
function renderMissions() {
    renderMissionCategory('dailyMissions', MISSIONS_DATA.daily, 'daily');
    renderMissionCategory('weeklyMissions', MISSIONS_DATA.weekly, 'weekly');
    renderMissionCategory('monthlyMissions', MISSIONS_DATA.monthly, 'monthly');
    
    let totalXP = 0;
    Object.keys(MISSIONS_DATA).forEach(category => {
        MISSIONS_DATA[category].forEach(mission => {
            const missionState = STATE.missions[category]?.[mission.id];
            if (missionState && !missionState.claimed && missionState.progress >= mission.maxProgress) {
                let xp = mission.xp;
                if (STATE.dailyBonus && STATE.dailyBonus.type === 'xp_boost') {
                    xp = Math.floor(xp * (1 + STATE.dailyBonus.value / 100));
                }
                totalXP += xp;
            }
        });
    });
    
    document.getElementById('totalXP').textContent = totalXP.toLocaleString();
}

function renderMissionCategory(containerId, missions, category) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    missions.forEach(mission => {
        const missionState = STATE.missions[category]?.[mission.id] || {progress: 0, claimed: false};
        const progress = missionState.progress;
        const maxProgress = mission.maxProgress;
        const progressPercent = (progress / maxProgress) * 100;
        const canClaim = !missionState.claimed && progress >= maxProgress;
        
        let xp = mission.xp;
        if (STATE.dailyBonus && STATE.dailyBonus.type === 'xp_boost') {
            xp = Math.floor(xp * (1 + STATE.dailyBonus.value / 100));
        }
        
        const missionElement = document.createElement('div');
        missionElement.className = 'mission-card';
        if (canClaim) missionElement.classList.add('mission-ready');
        
        missionElement.innerHTML = `
            <div class="mission-header">
                <div class="mission-title">${mission.title}</div>
                <div class="mission-xp">
                    <i class="fas fa-bolt"></i>
                    ${xp.toLocaleString()} XP
                </div>
            </div>
            <div class="mission-desc">${mission.description}</div>
            <div class="mission-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercent}%"></div>
                </div>
                <div class="progress-text">
                    <span>${progress}/${maxProgress}</span>
                    <span>${Math.round(progressPercent)}%</span>
                </div>
            </div>
            <div class="mission-footer">
                <div class="mission-timer">
                    <i class="fas fa-clock"></i>
                    ${getMissionResetLabel(category)}
                </div>
                <button class="mission-claim ${canClaim ? 'mission-ready-btn' : ''}" 
                    ${canClaim ? '' : 'disabled'} 
                    data-id="${mission.id}" data-category="${category}">
                    ${missionState.claimed ? 'RECLAMADO' : canClaim ? '¡RECLAMAR!' : 'EN PROGRESO'}
                </button>
            </div>
        `;
        
        container.appendChild(missionElement);
    });
}

function getMissionResetLabel(category) {
    if (category === 'daily') return 'Renueva diario';
    if (category === 'weekly') return 'Renueva semanal';
    if (category === 'monthly') return 'Renueva mensual';
    return 'Sin renovación';
}

// Continuará en el siguiente mensaje...
// =================== TESORO GALÁCTICO ===================
function renderTreasure() {
    const totalGems = STATE.treasure.totalGems || 0;
    const totalCoins = STATE.treasure.totalCoins || 0;
    const totalSkins = STATE.treasure.skins?.length || 0;
    const totalRareItems = STATE.treasure.items?.length || 0;
    
    document.getElementById('totalGemsCollected').textContent = totalGems;
    document.getElementById('totalCoinsCollected').textContent = totalCoins.toLocaleString();
    document.getElementById('totalSkinsCollected').textContent = totalSkins;
    document.getElementById('totalRareItems').textContent = totalRareItems;
    document.getElementById('rewardsCount').textContent = STATE.claimedRewards.size;
    
    renderInventory();
    renderSeasonHistory();
}

function renderInventory() {
    const container = document.getElementById('treasureInventory');
    if (!container) return;
    
    container.innerHTML = '';
    
    const claimedRewards = Array.from(STATE.claimedRewards).map(level => {
        return REWARDS_DATA.find(r => r.level === level);
    }).filter(r => r);
    
    if (claimedRewards.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:var(--star-glow);padding:var(--space-xl);">Aún no has reclamado recompensas</p>';
        return;
    }
    
    claimedRewards.forEach(reward => {
        const item = document.createElement('div');
        item.className = 'inventory-item';
        item.dataset.type = reward.type;
        
        item.innerHTML = `
            <div class="reward-icon ${reward.tier}">
                <i class="fas ${reward.icon}"></i>
            </div>
            <div class="inventory-item-name">${reward.name}</div>
            <div class="inventory-item-count">Nv. ${reward.level}</div>
        `;
        
        container.appendChild(item);
    });
}

function renderSeasonHistory() {
    const container = document.getElementById('seasonHistoryContainer');
    if (!container) return;
    
    const history = STATE.treasure.history || [];
    
    if (history.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:var(--star-glow);padding:var(--space-md);">Primera temporada</p>';
        return;
    }
    
    container.innerHTML = history.map(season => {
        const passesText = season.passesOwned.join(', ').toUpperCase();
        return `
            <div style="padding:var(--space-md);background:rgba(255,255,255,0.03);border-radius:8px;margin-bottom:var(--space-sm);">
                <strong style="color:var(--cosmic-blue);">Temporada ${season.season}: ${season.seasonName}</strong><br>
                <small style="color:var(--star-glow);">Nivel: ${season.level} | Recompensas: ${season.rewardsCollected}</small><br>
                <small style="color:var(--cosmic-yellow);">Pases: ${passesText}</small>
            </div>
        `;
    }).join('');
}

// =================== TIMELINE DE PRÓXIMOS PASES ===================
function renderTimeline() {
    const container = document.getElementById('timelineItems');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (let i = 1; i <= 5; i++) {
        const futureSeasonNumber = STATE.seasonNumber + i;
        const seasonName = SEASON_NAMES[(futureSeasonNumber - 1) % SEASON_NAMES.length];
        
        const currentEnd = new Date(STATE.seasonEndDate);
        const startDate = new Date(currentEnd);
        startDate.setDate(startDate.getDate() + ((i - 1) * 30));
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 30);
        
        const item = document.createElement('div');
        item.className = 'timeline-item';
        
        item.innerHTML = `
            <div class="timeline-content">
                <div class="timeline-season-number">TEMPORADA ${futureSeasonNumber}</div>
                <div class="timeline-season-title">${seasonName}</div>
                <div class="timeline-dates">
                    <span><i class="fas fa-calendar-alt"></i> ${startDate.toLocaleDateString('es-ES')}</span>
                    <span><i class="fas fa-calendar-check"></i> ${endDate.toLocaleDateString('es-ES')}</span>
                </div>
                <div class="timeline-preview">
                    ${getPreviewRewards(futureSeasonNumber)}
                </div>
                <p style="margin-top:var(--space-sm);font-size:12px;color:var(--cosmic-red);">
                    ⚠️ Necesitarás comprar los pases de nuevo para esta temporada
                </p>
            </div>
            <div class="timeline-point"></div>
        `;
        
        container.appendChild(item);
    }
}

function getPreviewRewards(seasonNumber) {
    const icons = ['fa-crown', 'fa-gem', 'fa-star', 'fa-trophy'];
    const tiers = ['premium', 'crystal', 'village', 'vip'];
    
    return icons.map((icon, i) => `
        <div class="timeline-reward-preview">
            <div class="reward-icon ${tiers[i % tiers.length]}">
                <i class="fas ${icon}"></i>
            </div>
            <span>T${seasonNumber} Especial</span>
        </div>
    `).join('');
}

// =================== SISTEMA DE MEJORAS ===================
function updateUpgradeDiscounts() {
    if (STATE.dailyBonus && STATE.dailyBonus.type === 'discount') {
        const discountPercent = STATE.dailyBonus.value;
        
        document.querySelectorAll('.upgrade-card').forEach(card => {
            const tier = card.dataset.tier;
            if (tier === 'free') return;
            
            const originalPrice = PASS_PRICES[tier];
            const discountedPrice = Math.floor(originalPrice * (1 - discountPercent / 100));
            
            const discountBadge = card.querySelector('.daily-discount');
            const originalPriceEl = card.querySelector('.original-price');
            const finalPriceEl = card.querySelector('.final-price');
            
            if (discountBadge && originalPriceEl && finalPriceEl) {
                discountBadge.style.display = 'flex';
                discountBadge.querySelector('.discount-percent').textContent = `-${discountPercent}%`;
                
                originalPriceEl.textContent = originalPrice;
                originalPriceEl.style.display = 'inline';
                finalPriceEl.textContent = discountedPrice;
            }
        });
    }
}

function upgradePass(tier) {
    if (STATE.purchasedPasses.includes(tier)) {
        showNotification(`¡Ya tienes el pase ${tier.toUpperCase()} esta temporada!`);
        return;
    }
    
    let price = PASS_PRICES[tier];
    
    if (STATE.dailyBonus && STATE.dailyBonus.type === 'discount') {
        price = Math.floor(price * (1 - STATE.dailyBonus.value / 100));
    }
    
    const seasonName = SEASON_NAMES[(STATE.seasonNumber - 1) % SEASON_NAMES.length];
    
    if (!confirm(`¿Comprar Pase ${tier.toUpperCase()} por ${price} puntos?\n\n⚠️ Este pase solo es válido para la Temporada ${STATE.seasonNumber}: ${seasonName}\nAl terminar esta temporada, necesitarás comprarlo de nuevo.`)) {
        return;
    }
    
    STATE.purchasedPasses.push(tier);
    STATE.currentMusic = tier;
    updateMusic();
    updateTierStatus();
    renderLevels(STATE.currentPage);
    saveState();
    
    showNotification(`✅ ¡Pase ${tier.toUpperCase()} adquirido para esta temporada!`);
    createConfetti();
}

function updateTierStatus() {
    document.querySelectorAll('.tier-card').forEach(card => {
        const tier = card.dataset.tier;
        const status = card.querySelector('.tier-status');
        
        if (status) {
            if (STATE.purchasedPasses.includes(tier)) {
                status.className = 'tier-status active';
                status.innerHTML = '<i class="fas fa-check-circle"></i><span>ACTIVO</span>';
            } else {
                status.className = 'tier-status locked';
                status.innerHTML = '<i class="fas fa-lock"></i><span>BLOQUEADO</span>';
            }
        }
    });
}

// =================== SISTEMA DE MÚSICA ===================
function updateMusic() {
    ['free', 'premium', 'crystal', 'village', 'vip'].forEach(tier => {
        const audio = document.getElementById(`music${tier.charAt(0).toUpperCase() + tier.slice(1)}`);
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
    });
    
    const highestTier = getHighestPurchasedTier();
    const musicId = `music${highestTier.charAt(0).toUpperCase() + highestTier.slice(1)}`;
    const audio = document.getElementById(musicId);
    
    if (audio) {
        audio.volume = STATE.musicVolume || 0.3;
        audio.play().catch(e => console.log('Autoplay bloqueado:', e));
    }
}

function getHighestPurchasedTier() {
    const tierOrder = ['vip', 'village', 'crystal', 'premium', 'free'];
    for (const tier of tierOrder) {
        if (STATE.purchasedPasses.includes(tier)) {
            return tier;
        }
    }
    return 'free';
}

// =================== RECLAMAR RECOMPENSAS ===================
function claimLevelReward(level, tier) {
    if (STATE.claimedRewards.has(level)) {
        showNotification('¡Recompensa ya reclamada!');
        return;
    }
    
    if (!STATE.purchasedPasses.includes(tier)) {
        showNotification(`Necesitas el pase ${tier.toUpperCase()}`);
        showSection('upgrade');
        return;
    }
    
    if (!STATE.unlockedLevels.has(level)) {
        showNotification('¡Nivel bloqueado!');
        return;
    }
    
    STATE.claimedRewards.add(level);
    
    const reward = REWARDS_DATA[level - 1];
    
    if (reward.type === 'currency') {
        const amount = parseInt(reward.name.match(/\d+/)[0]);
        STATE.treasure.totalCoins = (STATE.treasure.totalCoins || 0) + amount;
    } else if (reward.type === 'item') {
        STATE.treasure.totalGems = (STATE.treasure.totalGems || 0) + 1;
        if (!STATE.treasure.items) STATE.treasure.items = [];
        STATE.treasure.items.push(reward.name);
    } else if (reward.type === 'skin') {
        if (!STATE.treasure.skins) STATE.treasure.skins = [];
        STATE.treasure.skins.push(reward.name);
    }
    
    showRewardModal(reward);
    renderLevels(STATE.currentPage);
    renderTreasure();
    saveState();
}

function claimMissionReward(missionId, category) {
    const missionData = MISSIONS_DATA[category]?.find(m => m.id === missionId);
    const missionState = STATE.missions[category]?.[missionId];
    
    if (!missionData || !missionState) return;
    
    if (missionState.claimed) {
        showNotification('¡Ya reclamaste esta misión!');
        return;
    }
    
    if (missionState.progress < missionData.maxProgress) {
        showNotification('¡Aún no completas esta misión!');
        return;
    }
    
    missionState.claimed = true;
    
    let xpEarned = missionData.xp;
    const xpBoost = getXPBoost();
    xpEarned = Math.floor(xpEarned * (1 + xpBoost / 100));
    
    addXP(xpEarned);
    
    updateHUD();
    updateProgressRing();
    renderMissions();
    renderLevels(STATE.currentPage);
    
    saveState();
    
    showNotification(`¡+${xpEarned.toLocaleString()} XP obtenidos!`);
    createConfetti();
}

function addXP(xpAmount) {
    STATE.playerXP += xpAmount;
    
    while (STATE.playerXP >= STATE.maxXP) {
        STATE.playerXP -= STATE.maxXP;
        STATE.playerLevel++;
        STATE.maxXP = Math.floor(STATE.maxXP * 1.1);
        STATE.unlockedLevels.add(STATE.playerLevel);
        
        showNotification(`¡NIVEL ${STATE.playerLevel} ALCANZADO!`);
    }
}

function getXPBoost() {
    let boost = 0;
    
    if (STATE.purchasedPasses.includes('vip')) boost += 100;
    else if (STATE.purchasedPasses.includes('village')) boost += 75;
    else if (STATE.purchasedPasses.includes('crystal')) boost += 50;
    else if (STATE.purchasedPasses.includes('premium')) boost += 20;
    
    if (STATE.dailyBonus && STATE.dailyBonus.type === 'xp_boost') {
        boost += STATE.dailyBonus.value;
    }
    
    return boost;
}

// =================== NAVEGACIÓN ===================
function showSection(section) {
    document.querySelectorAll('.galactic-section').forEach(sec => {
        sec.classList.remove('active');
    });
    
    document.querySelectorAll('.planet-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const sectionElement = document.getElementById(`${section}-section`);
    if (sectionElement) {
        sectionElement.classList.add('active');
    }
    
    const button = document.querySelector(`[data-section="${section}"]`);
    if (button) {
        button.classList.add('active');
    }
    
    sectionElement?.scrollIntoView({behavior: 'smooth', block: 'start'});
}

// =================== UTILIDADES UI ===================
function showRewardModal(reward) {
    const modal = document.getElementById('rewardModal');
    const icon = document.getElementById('modalRewardIcon');
    const tier = document.getElementById('modalRewardTier');
    const name = document.getElementById('modalRewardName');
    const level = document.getElementById('modalRewardLevel');
    const desc = document.getElementById('modalRewardDesc');
    
    icon.className = 'reward-icon-large';
    icon.style.background = `linear-gradient(135deg, ${getTierColor(reward.tier)}, transparent)`;
    icon.style.borderColor = getTierColor(reward.tier);
    icon.innerHTML = `<i class="fas ${reward.icon}"></i>`;
    
    tier.textContent = reward.tier.toUpperCase();
    tier.style.background = getTierColor(reward.tier);
    name.textContent = reward.name;
    level.textContent = `Nivel ${reward.level}`;
    desc.textContent = `¡Una recompensa ${reward.tier} de tu viaje galáctico!`;
    
    modal.style.display = 'flex';
    createConfetti();
    
    modal.onclick = (e) => {
        if (e.target === modal) hideRewardModal();
    };
    
    document.querySelector('.confirm-btn').onclick = hideRewardModal;
}

function hideRewardModal() {
    document.getElementById('rewardModal').style.display = 'none';
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'galactic-notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, var(--cosmic-blue), var(--cosmic-purple));
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        z-index: 1000;
        animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        font-family: var(--font-secondary);
        font-weight: 600;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function createConfetti() {
    const container = document.createElement('div');
    container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9999;
    `;
    
    document.body.appendChild(container);
    
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: absolute;
            width: 10px;
            height: 10px;
            background: ${getRandomColor()};
            top: -20px;
            left: ${Math.random() * 100}%;
            border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
            animation: confetti-fall ${1 + Math.random() * 2}s linear forwards;
        `;
        
        container.appendChild(confetti);
    }
    
    setTimeout(() => {
        container.remove();
    }, 3000);
}

function getRandomColor() {
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function getTierColor(tier) {
    const colors = {
        free: '#64748b',
        premium: '#3b82f6',
        crystal: '#8b5cf6',
        village: '#10b981',
        vip: '#f59e0b'
    };
    return colors[tier] || '#3b82f6';
}

// =================== EVENT LISTENERS ===================
function setupEventListeners() {
    document.querySelectorAll('.planet-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            showSection(this.dataset.section);
        });
    });
    
    document.getElementById('prevGrid')?.addEventListener('click', () => {
        if (STATE.currentPage > 1) {
            STATE.currentPage--;
            renderLevels(STATE.currentPage);
        }
    });
    
    document.getElementById('nextGrid')?.addEventListener('click', () => {
        if (STATE.currentPage * CONFIG.LEVELS_PER_PAGE < CONFIG.TOTAL_LEVELS) {
            STATE.currentPage++;
            renderLevels(STATE.currentPage);
        }
    });
    
    document.addEventListener('click', function(e) {
        if (e.target.closest('.claim-btn')) {
            const button = e.target.closest('.claim-btn');
            const level = parseInt(button.dataset.level);
            const tier = button.dataset.tier;
            
            if (!button.disabled) {
                claimLevelReward(level, tier);
            }
        }
        
        if (e.target.closest('.mission-claim')) {
            const button = e.target.closest('.mission-claim');
            const missionId = button.dataset.id;
            const category = button.dataset.category;
            
            if (!button.disabled) {
                claimMissionReward(missionId, category);
            }
        }
        
        if (e.target.closest('.upgrade-btn')) {
            const button = e.target.closest('.upgrade-btn');
            const tier = button.dataset.tier;
            upgradePass(tier);
        }
    });
    
    document.getElementById('claimAllBtn')?.addEventListener('click', claimAllRewards);
    document.getElementById('quickUpgrade')?.addEventListener('click', () => showSection('upgrade'));
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.dataset.filter;
            document.querySelectorAll('.inventory-item').forEach(item => {
                if (filter === 'all' || item.dataset.type === filter) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });
    
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('open');
        });
        
        document.addEventListener('click', (e) => {
            if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
                navLinks.classList.remove('open');
            }
        });
    }
}

function claimAllRewards() {
    const start = (STATE.currentPage - 1) * CONFIG.LEVELS_PER_PAGE + 1;
    const end = Math.min(start + CONFIG.LEVELS_PER_PAGE - 1, CONFIG.TOTAL_LEVELS);
    
    let claimedCount = 0;
    
    for (let level = start; level <= end; level++) {
        if (!STATE.claimedRewards.has(level) && STATE.unlockedLevels.has(level)) {
            const reward = REWARDS_DATA[level - 1];
            if (reward && STATE.purchasedPasses.includes(reward.tier)) {
                STATE.claimedRewards.add(level);
                claimedCount++;
            }
        }
    }
    
    if (claimedCount > 0) {
        renderLevels(STATE.currentPage);
        renderTreasure();
        saveState();
        
        showNotification(`¡${claimedCount} recompensas reclamadas!`);
        createConfetti();
    } else {
        showNotification('No hay recompensas disponibles en esta página');
    }
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    @keyframes confetti-fall {
        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
        100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
    }
`;
document.head.appendChild(style);

console.log('✅ Moonveil Galactic Pass V3 FINAL - Los pases se resetean cada temporada');
console.log('📦 Temporada actual:', STATE.seasonNumber);
console.log('🎫 Pases activos:', STATE.purchasedPasses);