/* ============================
   SBM-G v2.0 - JavaScript Mejorado
   Sistema de Terminal Híbrido Profesional
   ============================ */

/* ============================ 
   SECCIÓN 1: UTILIDADES Y CONFIGURACIÓN
   ============================ */

// DOM helpers
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

// Storage helpers
const storage = {
  set(k, v) { localStorage.setItem(`sbmg.v2.${k}`, JSON.stringify(v)); },
  get(k, fallback = null) { 
    const raw = localStorage.getItem(`sbmg.v2.${k}`); 
    return raw ? JSON.parse(raw) : fallback; 
  },
  remove(k) { localStorage.removeItem(`sbmg.v2.${k}`); },
  clearAll() {
    Object.keys(localStorage).forEach(k => { 
      if (k.startsWith('sbmg.v2')) localStorage.removeItem(k); 
    });
  }
};

// Crypto helpers
function ab2b64(buf) {
  const bytes = new Uint8Array(buf);
  let str = '';
  for (let i=0;i<bytes.length;i++) str += String.fromCharCode(bytes[i]);
  return btoa(str);
}
function b642ab(b64) {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i=0;i<bin.length;i++) arr[i] = bin.charCodeAt(i);
  return arr.buffer;
}

// HTML escape
function escapeHtml(str){
  if (str === null || str === undefined) return '';
  return ('' + str).replace(/[&<>"'`]/g, m => 
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;'}[m])
  );
}

/* ============================
   SECCIÓN 2: CONFIGURACIÓN DEL SISTEMA
   ============================ */

const CONFIG = {
  APP_NAME: 'SBM-G v2.0',
  VERSION: '2.0.0',
  DEFAULT_USER: 'guest',
  XP_PER_FILE: 10,
  XP_PER_SECRET: 50,
  XP_PER_MISSION: 100,
  LEVELS: [
    { level: 1, xp: 0, title: 'Novato' },
    { level: 2, xp: 100, title: 'Aprendiz' },
    { level: 3, xp: 300, title: 'Operador' },
    { level: 4, xp: 600, title: 'Experto' },
    { level: 5, xp: 1000, title: 'Maestro' },
    { level: 6, xp: 1500, title: 'Hacker' },
    { level: 7, xp: 2100, title: 'Élite' },
    { level: 8, xp: 2800, title: 'Legendario' },
    { level: 9, xp: 3600, title: 'Mítico' },
    { level: 10, xp: 4500, title: 'Divino' }
  ]
};

/* ============================ 
   SECCIÓN 3: APP STATE
   ============================ */

const App = {
  user: storage.get('user', CONFIG.DEFAULT_USER),
  role: storage.get('role', 'guest'),
  cwd: '/',
  history: storage.get('history', []),
  vfs: null,
  logs: storage.get('logs', []),
  musicOn: false,
  theme: storage.get('theme', 'default'),
  xp: storage.get('xp', 0),
  level: 1,
  sessionStart: Date.now(),
  sessionTime: 0,
  missions: storage.get('missions', []),
  achievements: storage.get('achievements', []),
  security: storage.get('security', 'baja'),
  
  updateStorage() {
    storage.set('user', this.user);
    storage.set('role', this.role);
    storage.set('history', this.history.slice(-100));
    storage.set('logs', this.logs.slice(-100));
    storage.set('xp', this.xp);
    storage.set('missions', this.missions);
    storage.set('achievements', this.achievements);
    storage.set('security', this.security);
    storage.set('theme', this.theme);
  },
  
  addXP(amount, reason = '') {
    const oldLevel = this.level;
    this.xp += amount;
    
    const newLevelData = this.calculateLevel();
    this.level = newLevelData.level;
    
    if (newLevelData.level > oldLevel) {
      this.levelUp(newLevelData.level);
    }
    
    this.updateXPBar();
    storage.set('xp', this.xp);
    addLog('info', `+${amount} XP ${reason ? `(${reason})` : ''}`);
    return amount;
  },
  
  calculateLevel() {
    for (let i = CONFIG.LEVELS.length - 1; i >= 0; i--) {
      if (this.xp >= CONFIG.LEVELS[i].xp) {
        return {
          level: CONFIG.LEVELS[i].level,
          title: CONFIG.LEVELS[i].title,
          currentXP: this.xp,
          nextXP: CONFIG.LEVELS[i + 1] ? CONFIG.LEVELS[i + 1].xp : null,
          progress: CONFIG.LEVELS[i + 1] 
            ? ((this.xp - CONFIG.LEVELS[i].xp) / (CONFIG.LEVELS[i + 1].xp - CONFIG.LEVELS[i].xp)) * 100
            : 100
        };
      }
    }
    return { level: 1, title: 'Novato', progress: 0 };
  },
  
  levelUp(newLevel) {
    const levelData = CONFIG.LEVELS.find(l => l.level === newLevel);
    if (!levelData) return;
    
    showNotification(
      `🎉 ¡Nivel ${newLevel} alcanzado! Eres ahora ${levelData.title}`,
      'success',
      10000
    );
  },
  
  updateXPBar() {
    const levelData = this.calculateLevel();
    const xpFill = $('#xp-fill');
    const levelBadge = $('#level-badge');
    
    if (xpFill) {
      xpFill.style.width = `${levelData.progress}%`;
    }
    
    if (levelBadge) {
      levelBadge.textContent = `Lvl ${levelData.level}`;
      levelBadge.title = `${levelData.title} | ${this.xp} XP`;
    }
    
    const statLevel = $('#stat-level');
    const statXP = $('#stat-xp');
    const statNextXP = $('#stat-next-xp');
    
    if (statLevel) statLevel.textContent = levelData.level;
    if (statXP) statXP.textContent = this.xp;
    if (statNextXP) statNextXP.textContent = levelData.nextXP || 'MAX';
  },
  
  updateSessionTimer() {
    this.sessionTime = Math.floor((Date.now() - this.sessionStart) / 1000);
    const hours = Math.floor(this.sessionTime / 3600);
    const minutes = Math.floor((this.sessionTime % 3600) / 60);
    const seconds = this.sessionTime % 60;
    
    const timerEl = $('#session-timer');
    if (timerEl) {
      timerEl.textContent = 
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    const statTime = $('#stat-time');
    if (statTime) statTime.textContent = `${hours}h ${minutes}m`;
  }
};

/* ============================ 
   SECCIÓN 4: SISTEMA DE NOTIFICACIONES
   ============================ */

function showNotification(message, type = 'info', duration = 5000) {
  const notifications = $('#notifications');
  if (!notifications) return;
  
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <i class="fas ${getNotificationIcon(type)}"></i>
      <span>${escapeHtml(message)}</span>
    </div>
  `;
  
  notifications.appendChild(notification);
  
  const remove = () => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  };
  
  if (duration > 0) {
    setTimeout(remove, duration);
  }
  
  playSound(type);
  return notification;
}

function getNotificationIcon(type) {
  const icons = {
    info: 'fa-info-circle',
    success: 'fa-check-circle',
    warning: 'fa-exclamation-triangle',
    error: 'fa-times-circle'
  };
  return icons[type] || 'fa-info-circle';
}

function playSound(type) {
  const sounds = {
    success: '#sfx-success',
    error: '#sfx-error',
    info: '#sfx-click'
  };
  
  const soundEl = $(sounds[type]);
  if (soundEl) {
    soundEl.currentTime = 0;
    soundEl.play().catch(() => {});
  }
}

/* ============================ 
   SECCIÓN 5: SISTEMA DE MISIONES
   ============================ */

class MissionSystem {
  constructor() {
    this.missions = this.loadMissions();
    this.achievements = this.loadAchievements();
  }
  
  loadMissions() {
    const saved = storage.get('missions_list', []);
    if (saved.length > 0) return saved;
    
    return [
      {
        id: 'first_steps',
        title: 'Primeros Pasos',
        description: 'Ejecuta tu primer comando',
        type: 'command',
        target: 'help',
        reward: { xp: 50 },
        completed: false,
        progress: 0,
        maxProgress: 1
      },
      {
        id: 'explorer',
        title: 'Explorador',
        description: 'Lista el contenido de 3 carpetas diferentes',
        type: 'custom',
        target: 'explore_folders',
        reward: { xp: 100 },
        completed: false,
        progress: 0,
        maxProgress: 3
      },
      {
        id: 'decryptor',
        title: 'Descifrador',
        description: 'Descifra tu primer archivo',
        type: 'command',
        target: 'decrypt',
        reward: { xp: 150 },
        completed: false,
        progress: 0,
        maxProgress: 1
      },
      {
        id: 'hacker',
        title: 'Hacker',
        description: 'Descifra 5 archivos secretos',
        type: 'custom',
        target: 'decrypt_files',
        reward: { xp: 500 },
        completed: false,
        progress: 0,
        maxProgress: 5
      }
    ];
  }
  
  loadAchievements() {
    const saved = storage.get('achievements_list', []);
    if (saved.length > 0) return saved;
    
    return [
      {
        id: 'welcome',
        title: 'Bienvenido',
        description: 'Primer inicio de sesión',
        icon: '👋',
        unlocked: false
      },
      {
        id: 'fast_learner',
        title: 'Aprendiz Rápido',
        description: 'Alcanza nivel 3',
        icon: '🚀',
        unlocked: false
      },
      {
        id: 'master_decryptor',
        title: 'Maestro Descifrador',
        description: 'Descifra 10 archivos',
        icon: '🔓',
        unlocked: false
      }
    ];
  }
  
  checkMissionProgress(type, target, value = 1) {
    this.missions.forEach(mission => {
      if (mission.completed) return;
      
      if (mission.type === type && mission.target === target) {
        mission.progress += value;
        
        if (mission.progress >= mission.maxProgress) {
          this.completeMission(mission.id);
        }
        
        this.updateMissionsUI();
      }
    });
  }
  
  completeMission(missionId) {
    const mission = this.missions.find(m => m.id === missionId);
    if (!mission || mission.completed) return;
    
    mission.completed = true;
    mission.progress = mission.maxProgress;
    
    if (mission.reward.xp) {
      App.addXP(mission.reward.xp, `Misión: ${mission.title}`);
    }
    
    showNotification(
      `🎯 Misión completada: ${mission.title} (+${mission.reward.xp} XP)`,
      'success',
      8000
    );
    
    storage.set('missions_list', this.missions);
  }
  
  unlockAchievement(achievementId) {
    const achievement = this.achievements.find(a => a.id === achievementId);
    if (!achievement || achievement.unlocked) return;
    
    achievement.unlocked = true;
    achievement.unlockedAt = new Date().toISOString();
    
    showNotification(
      `🏆 Logro desbloqueado: ${achievement.title}`,
      'success',
      10000
    );
    
    App.addXP(100, `Logro: ${achievement.title}`);
    storage.set('achievements_list', this.achievements);
  }
  
  updateMissionsUI() {
    const missionsList = $('#missions-list');
    const activeMission = $('#mission-content');
    const progressFill = $('#mission-progress-fill');
    const progressText = $('#mission-progress-text');
    
    if (!missionsList) return;
    
    const firstIncomplete = this.missions.find(m => !m.completed);
    if (firstIncomplete && activeMission) {
      activeMission.innerHTML = `
        <h5>${firstIncomplete.title}</h5>
        <p>${firstIncomplete.description}</p>
        <small>Progreso: ${firstIncomplete.progress}/${firstIncomplete.maxProgress}</small>
      `;
      
      const progress = (firstIncomplete.progress / firstIncomplete.maxProgress) * 100;
      if (progressFill) progressFill.style.width = `${progress}%`;
      if (progressText) progressText.textContent = `${Math.round(progress)}%`;
    }
    
    missionsList.innerHTML = '';
    this.missions.forEach(mission => {
      const missionEl = document.createElement('div');
      missionEl.className = `mission-card ${mission.completed ? 'completed' : ''}`;
      missionEl.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <h5 style="margin: 0; font-size: 13px;">${mission.title}</h5>
          <span>${mission.completed ? '✅' : '🔄'}</span>
        </div>
        <p style="font-size: 12px; margin-bottom: 8px; color: var(--muted);">${mission.description}</p>
        <div style="margin-top: 8px;">
          <div class="progress-bar" style="height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden;">
            <div class="progress-fill" style="height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent-2)); width: ${(mission.progress / mission.maxProgress) * 100}%"></div>
          </div>
          <small style="font-size: 11px; color: var(--muted);">${mission.progress}/${mission.maxProgress} • +${mission.reward.xp} XP</small>
        </div>
      `;
      missionsList.appendChild(missionEl);
    });
  }
  
  updateAchievementsUI() {
    const achievementsList = $('#achievements-list');
    if (!achievementsList) return;
    
    achievementsList.innerHTML = '';
    this.achievements.forEach(achievement => {
      const achievementEl = document.createElement('div');
      achievementEl.className = `achievement ${achievement.unlocked ? 'unlocked' : ''}`;
      achievementEl.innerHTML = `
        <div class="icon" style="font-size: 24px; margin-bottom: 8px;">${achievement.icon}</div>
        <h5 style="font-size: 13px; margin-bottom: 4px;">${achievement.title}</h5>
        <p style="font-size: 11px; color: var(--muted); margin-bottom: 8px;">${achievement.description}</p>
        <div style="font-size: 11px;">
          ${achievement.unlocked ? '✅ Desbloqueado' : '🔒 Bloqueado'}
        </div>
      `;
      achievementsList.appendChild(achievementEl);
    });
  }
}

/* ============================ 
   SECCIÓN 6: ASISTENTE AI MEJORADO
   ============================ */

class AIAssistant {
  constructor() {
    this.context = [];
    this.maxContext = 10;
    this.responses = {
      '¿cómo cifro un archivo?': {
        answer: `Para cifrar un archivo:

1. Usa el comando: encrypt <ruta_archivo>
2. Ingresa una contraseña cuando te la pida
3. El archivo quedará cifrado

Ejemplo: encrypt /docs/secreto.txt

Para descifrar: decrypt <ruta_archivo>

¡Ganas ${CONFIG.XP_PER_FILE} XP por cifrar archivos!`,
        examples: ['encrypt /docs/manual.txt', 'decrypt /secrets/hidden_1.enc']
      },
      
      '¿cómo gano xp?': {
        answer: `Puedes ganar XP de estas formas:

• ${CONFIG.XP_PER_FILE} XP - Por cada archivo que abras o leas
• ${CONFIG.XP_PER_SECRET} XP - Por descifrar archivos secretos
• ${CONFIG.XP_PER_MISSION} XP - Por completar misiones
• 100 XP - Por desbloquear logros
• 100 XP - Por encontrar flags (FLAG{...})

Escribe "missions" para ver tus misiones activas.`,
        commands: ['missions', 'stats', 'achievements']
      },
      
      '¿qué comandos hay?': {
        answer: `Comandos principales:

NAVEGACIÓN:
• ls [ruta] - Listar archivos
• cd [ruta] - Cambiar directorio
• tree [ruta] - Ver árbol de carpetas
• pwd - Ver directorio actual

ARCHIVOS:
• cat <archivo> - Ver contenido
• open <archivo> - Abrir en editor
• touch <archivo> - Crear archivo
• mkdir <carpeta> - Crear carpeta

CIFRADO:
• encrypt <archivo> - Cifrar
• decrypt <archivo> - Descifrar

SISTEMA:
• help - Ver ayuda completa
• status - Ver estado
• missions - Ver misiones
• stats - Ver estadísticas`,
        tip: 'Escribe "help" para ver la lista completa de comandos'
      },
      
      '¿dónde están los secretos?': {
        answer: `Los archivos secretos están en:

📁 /secrets - Carpeta principal de secretos
🔒 Archivos .enc - Archivos cifrados
🎌 flag-*.txt - Archivos con flags

PISTAS:
• Revisa /docs/manual.txt para pistas
• Los archivos hidden_*.enc tienen passwords únicos
• Algunos archivos en /secrets están sin cifrar

Usa "ls /secrets" para verlos todos.
Usa "decrypt <archivo>" para intentar descifrarlos.

¡Ganas ${CONFIG.XP_PER_SECRET} XP por cada secreto descifrado!`,
        commands: ['ls /secrets', 'cat /secrets/readme_secrets.txt', 'decrypt /secrets/hidden_1.enc']
      },
      
      'ayuda': {
        answer: `¿En qué puedo ayudarte?

Preguntas frecuentes:
• ¿Cómo cifro un archivo?
• ¿Cómo gano XP?
• ¿Qué comandos hay?
• ¿Dónde están los secretos?
• ¿Cómo cambio el tema?
• ¿Cómo creo archivos?

También puedo ayudarte con:
- Navegación en el sistema
- Comandos específicos
- Misiones y logros
- Configuración

¡Pregunta lo que quieras!`
      },
      
      '¿cómo cambio el tema?': {
        answer: `Para cambiar el tema:

Usa: theme <nombre>

Temas disponibles:
• default - Tema original (azul/verde)
• hacker - Estilo Matrix (verde)
• ocean - Azul oceánico
• purple - Morado oscuro
• solarized - Tema solarizado
• matrix - Estilo Matrix completo

Ejemplo: theme hacker

También puedes escribir "themes" para ver la lista.`,
        commands: ['theme hacker', 'themes']
      },
      
      '¿cómo creo archivos?': {
        answer: `Para crear archivos:

DESDE TERMINAL:
• touch <nombre> - Crear archivo vacío
• mkdir <nombre> - Crear carpeta

DESDE EXPLORADOR:
• Click en el botón "+" (nuevo archivo)
• Click en el botón carpeta (nueva carpeta)

DESDE EDITOR:
• Abre un archivo: open <archivo>
• Edita el contenido
• Guarda con el botón "Guardar"

Ejemplos:
touch mi_archivo.txt
mkdir mi_carpeta
open /docs/nuevo.txt`,
        tip: '¡Ganas XP por crear archivos!'
      }
    };
  }
  
  async processQuery(question) {
    const lowerQuery = question.toLowerCase().trim();
    
    // Buscar coincidencia exacta
    if (this.responses[lowerQuery]) {
      const response = this.responses[lowerQuery];
      let answer = `🤖 ${response.answer}`;
      
      if (response.commands) {
        answer += `\n\nComandos relacionados:`;
        response.commands.forEach(cmd => {
          answer += `\n• ${cmd}`;
        });
      }
      
      if (response.examples) {
        answer += `\n\nEjemplos:`;
        response.examples.forEach(ex => {
          answer += `\n• ${ex}`;
        });
      }
      
      if (response.tip) {
        answer += `\n\n💡 ${response.tip}`;
      }
      
      this.addToContext(question, answer);
      return answer;
    }
    
    // Buscar coincidencias parciales
    for (const [key, response] of Object.entries(this.responses)) {
      if (lowerQuery.includes(key.split(' ')[0]) || key.includes(lowerQuery.split(' ')[0])) {
        let answer = `🤖 ${response.answer}`;
        
        if (response.commands) {
          answer += `\n\nComandos relacionados: ${response.commands.join(', ')}`;
        }
        
        this.addToContext(question, answer);
        return answer;
      }
    }
    
    // Respuestas por palabra clave
    if (lowerQuery.includes('comando') || lowerQuery.includes('command')) {
      return this.processQuery('¿qué comandos hay?');
    }
    if (lowerQuery.includes('cifr') || lowerQuery.includes('encrypt') || lowerQuery.includes('decrypt')) {
      return this.processQuery('¿cómo cifro un archivo?');
    }
    if (lowerQuery.includes('xp') || lowerQuery.includes('experiencia') || lowerQuery.includes('nivel')) {
      return this.processQuery('¿cómo gano xp?');
    }
    if (lowerQuery.includes('secret') || lowerQuery.includes('flag') || lowerQuery.includes('oculto')) {
      return this.processQuery('¿dónde están los secretos?');
    }
    if (lowerQuery.includes('tema') || lowerQuery.includes('theme') || lowerQuery.includes('color')) {
      return this.processQuery('¿cómo cambio el tema?');
    }
    if (lowerQuery.includes('crear') || lowerQuery.includes('nuevo') || lowerQuery.includes('archivo')) {
      return this.processQuery('¿cómo creo archivos?');
    }
    
    // Respuesta por defecto
    const defaultResponse = `🤖 No tengo una respuesta específica para "${question}".

Pero puedo ayudarte con:
• Comandos del sistema
• Cifrado y descifrado
• Ganar XP y niveles
• Encontrar secretos
• Cambiar temas
• Crear archivos

Prueba preguntando:
• ¿Qué comandos hay?
• ¿Cómo gano XP?
• ¿Dónde están los secretos?

O escribe "help" en la terminal para ver todos los comandos.`;
    
    this.addToContext(question, defaultResponse);
    return defaultResponse;
  }
  
  addToContext(query, response) {
    this.context.push({
      query,
      response,
      timestamp: new Date().toISOString()
    });
    
    if (this.context.length > this.maxContext) {
      this.context.shift();
    }
  }
  
  clearContext() {
    this.context = [];
  }
}

/* ============================ 
   SECCIÓN 7: SISTEMA DE TEMAS
   ============================ */

class ThemeSystem {
  static themes = {
    default: 'theme-default',
    hacker: 'theme-hacker',
    ocean: 'theme-ocean',
    purple: 'theme-purple',
    solarized: 'theme-solarized',
    matrix: 'theme-matrix'
  };
  
  static applyTheme(themeName) {
    const container = $('#sbm-container');
    if (!container) return;
    
    Object.values(this.themes).forEach(themeClass => {
      container.classList.remove(themeClass);
    });
    
    const themeClass = this.themes[themeName] || this.themes.default;
    container.classList.add(themeClass);
    
    App.theme = themeName;
    storage.set('theme', themeName);
  }
}

/* ============================ 
   SECCIÓN 8: SISTEMA DE ARCHIVOS VIRTUAL (VFS)
   FÁCIL DE EXPANDIR
   ============================ */

// GUÍA PARA AGREGAR ARCHIVOS:
// 1. Copia el formato de un archivo existente
// 2. Para archivos normales: { name: 'nombre.txt', type: 'file', open: true, content: 'contenido' }
// 3. Para archivos cifrados: { name: 'secreto.enc', type: 'file', locked: true, password: 'pass123', content: 'contenido' }
// 4. Para carpetas: { name: 'carpeta', type: 'dir', children: [...] }
// 5. Las carpetas pueden tener subcarpetas infinitas

const DEFAULT_VFS = {
  name: '/',
  type: 'dir',
  children: [
    {
      name: 'README.md',
      type: 'file',
      open: true,
      content: `# SBM-G v2.0 — Sistema Virtual Híbrido

Bienvenido al entorno virtual profesional.
Explora usando comandos como: ls, cd, cat, open, decrypt, tree

SISTEMA DE NIVELES:
- Gana XP descifrando secretos
- Completa misiones para avanzar
- Desbloquea contenido especial

Escribe 'help' para ver todos los comandos.
Escribe 'ai' seguido de tu pregunta para usar el asistente.`
    },
    
    // Carpeta DOCS con subcarpetas
    {
      name: 'docs',
      type: 'dir',
      children: [
        { 
          name: 'manual.txt',
          type: 'file',
          open: true,
          content: `Manual General SBM-G v2.0

COMANDOS BÁSICOS:
- help: Ver ayuda completa
- ls: Listar archivos
- cd: Cambiar carpeta
- cat: Ver archivo
- open: Abrir en editor

CIFRADO:
- decrypt <archivo>: Descifrar
- encrypt <archivo>: Cifrar

PISTAS:
- Password de hidden_5.enc: M2sQw18L
- Busca en /secrets para encontrar archivos ocultos
- Completa misiones para ganar XP`
        },
        {
          name: 'about.txt',
          type: 'file',
          locked: true,
          password: 'docs4521',
          content: `Información Interna SBM-G v2.0

Sistema híbrido profesional con:
- Sistema de niveles y XP
- Misiones y logros
- Asistente AI integrado
- Estadísticas avanzadas
- Temas personalizables
- Cifrado AES-GCM real

Este archivo estaba protegido. ¡Bien hecho!`
        },
        // Subcarpeta dentro de docs
        {
          name: 'tutoriales',
          type: 'dir',
          children: [
            {
              name: 'primeros_pasos.txt',
              type: 'file',
              open: true,
              content: `Tutorial: Primeros Pasos

1. Explora con "ls" y "cd"
2. Lee archivos con "cat"
3. Busca secretos en /secrets
4. Descifra archivos con "decrypt"
5. Gana XP y sube de nivel

¡Diviértete explorando!`
            },
            {
              name: 'comandos_avanzados.txt',
              type: 'file',
              locked: true,
              password: 'tuto777',
              content: `Comandos Avanzados

- tree: Ver árbol completo
- search <término>: Buscar en archivos
- sudo <comando>: Ejecutar como root
- theme <nombre>: Cambiar tema
- ai <pregunta>: Preguntar al asistente

¡Descubriste el tutorial avanzado!`
            }
          ]
        }
      ]
    },
    
    // Carpeta PROJECTS con subcarpetas
    {
      name: 'projects',
      type: 'dir',
      children: [
        { 
          name: 'plan.md',
          type: 'file',
          open: true,
          content: `# Plan del Proyecto SBM-G

## Objetivos
1. Mejorar UI con nuevos temas
2. Añadir sistema de misiones
3. Integrar asistente AI
4. Sistema de niveles y XP

## Estado
En progreso - 80% completado`
        },
        { 
          name: 'secret_project.enc',
          type: 'file',
          locked: true,
          password: 'projA77X',
          content: `Proyecto Ultra Secreto

Nombre: SB-OMEGA
Objetivo: Prototipo de IA interna
Estado: 63% completado
Nivel requerido: 3

¡Encontraste el proyecto secreto!`
        },
        // Subcarpeta de código fuente
        {
          name: 'source_code',
          type: 'dir',
          children: [
            { 
              name: 'main.js',
              type: 'file',
              open: true,
              content: '// Código principal del proyecto\nconsole.log("SBM-G System Online");\n\n// TODO: Implementar módulo de seguridad'
            },
            { 
              name: 'config.json',
              type: 'file',
              open: true,
              content: '{\n  "version": "2.0",\n  "debug": false,\n  "features": ["ai", "missions", "crypto"]\n}'
            }
          ]
        }
      ]
    },
    
    // Carpeta SECRETS con muchos archivos
    {
      name: 'secrets',
      type: 'dir',
      children: [
        {
          name: 'readme_secrets.txt',
          type: 'file',
          open: true,
          content: `Esta carpeta contiene archivos cifrados.

Usa "decrypt <archivo>" para descifrarlos.
¡Ganas ${CONFIG.XP_PER_SECRET} XP por cada archivo descifrado!

PISTAS:
- Revisa /docs/manual.txt
- Password de hidden_5.enc: M2sQw18L
- Algunos passwords están en otros archivos`
        },
        {
          name: 'hidden_1.enc',
          type: 'file',
          locked: true,
          password: 'R2k9Lpa3',
          content: 'Report hidden #1: Anomalía detectada en módulo A. (+50 XP)'
        },
        {
          name: 'hidden_2.enc',
          type: 'file',
          locked: true,
          password: 'K8qT4mBz',
          content: 'Log interno #2: Usuario root ha intentado acceder sin permisos. (+50 XP)'
        },
        {
          name: 'hidden_3.enc',
          type: 'file',
          locked: true,
          password: 'Vx9pP12e',
          content: 'Confidencial #3: Parámetros del sistema no deben ser alterados. (+50 XP)'
        },
        {
          name: 'hidden_4.enc',
          type: 'file',
          locked: true,
          password: 'B4tZ97kR',
          content: 'Documento #4: Instrucciones de mantenimiento privado. (+50 XP)'
        },
        {
          name: 'hidden_5.enc',
          type: 'file',
          locked: true,
          password: 'M2sQw18L',
          content: 'Hidden #5: Token interno para procesos automatizados. (+50 XP)\n\nPista: El password de hidden_6 es Hq7B1nZp'
        },
        {
          name: 'hidden_6.enc',
          type: 'file',
          locked: true,
          password: 'Hq7B1nZp',
          content: 'Registro #6: Eventos sospechosos almacenados correctamente. (+50 XP)'
        },
        {
          name: 'flag-1.txt',
          type: 'file',
          locked: true,
          password: 'FlagA12!',
          content: 'FLAG{sbm_hidden_flag_1}\n\n¡Encontraste el primer flag! +100 XP'
        },
        {
          name: 'flag-2.txt',
          type: 'file',
          locked: true,
          password: 'YTR44p@2',
          content: 'FLAG{sbm_hidden_flag_2}\n\n¡Segundo flag encontrado! +100 XP'
        },
        {
          name: 'hint_1.txt',
          type: 'file',
          open: true,
          content: 'Pista: El password de hidden_5.enc es "M2sQw18L"'
        }
      ]
    },
    
    // Carpeta SYSTEM
    {
      name: 'system',
      type: 'dir',
      children: [
        { 
          name: 'config.enc',
          type: 'file',
          locked: true,
          password: 'sysadmin',
          content: `CONFIGURACIÓN DEL SISTEMA SBM-G
Versión: ${CONFIG.VERSION}
Usuario: ${App.user}
Nivel: ${App.level}
XP: ${App.xp}

Archivo de sistema descifrado.`
        },
        { 
          name: 'stats.json',
          type: 'file',
          open: true,
          content: `{
  "user": "${App.user}",
  "level": ${App.level},
  "xp": ${App.xp},
  "files_decrypted": 0,
  "missions_completed": 0
}`
        }
      ]
    },
    
    // Carpeta USER
    {
      name: 'user',
      type: 'dir',
      children: [
        { 
          name: 'profile.json',
          type: 'file',
          open: true,
          content: `{
  "username": "${App.user}",
  "level": ${App.level},
  "xp": ${App.xp},
  "role": "${App.role}",
  "joined": "${new Date().toISOString().split('T')[0]}"
}`
        },
        { 
          name: 'notes.txt',
          type: 'file',
          open: true,
          content: `Notas personales de ${App.user}:
- Recordar revisar logs diariamente
- Cambiar passwords periódicamente
- Backup importante cada semana

(Este archivo se puede editar)`
        }
      ]
    },
    
    // Carpeta .HIDDEN
    {
      name: '.hidden',
      type: 'dir',
      children: [
        { 
          name: 'backdoor.txt',
          type: 'file',
          locked: true,
          password: 'rootPASS',
          content: `Backdoor encontrado.
Acceso root permitido si tienes la clave.
Nivel requerido: 5

¡Has descubierto un backdoor secreto!`
        },
        { 
          name: '.config',
          type: 'file',
          open: true,
          content: `Configuración oculta:
auto_update=true
stealth_mode=on
debug_level=2
ai_assistant=enabled`
        }
      ]
    }
  ]
};

/* ============================ 
   SECCIÓN 9: VFS HELPERS
   ============================ */

function loadVFS() {
  const saved = storage.get('vfs', null);
  if (!saved) {
    App.vfs = DEFAULT_VFS;
    storage.set('vfs', App.vfs);
  } else {
    App.vfs = mergeNodes(DEFAULT_VFS, saved);
    storage.set('vfs', App.vfs);
  }
}

function mergeNodes(defaultNode, savedNode) {
  if (!savedNode) return JSON.parse(JSON.stringify(defaultNode));
  const result = JSON.parse(JSON.stringify(savedNode));
  
  if (defaultNode.type === "dir") {
    if (!result.children) result.children = [];
    const map = new Map(result.children.map(c => [c.name, c]));
    
    for (const dChild of defaultNode.children || []) {
      if (!map.has(dChild.name)) {
        result.children.push(JSON.parse(JSON.stringify(dChild)));
      } else {
        const savedChild = map.get(dChild.name);
        if (dChild.type === "dir") {
          const merged = mergeNodes(dChild, savedChild);
          Object.assign(savedChild, merged);
        }
      }
    }
  }
  
  return result;
}

function resolvePath(path) {
  if (!path) return App.cwd;
  path = String(path).trim();
  if (path === '/') return '/';
  let parts;
  if (path.startsWith('/')) parts = path.split('/').filter(Boolean);
  else parts = App.cwd.split('/').filter(Boolean).concat(path.split('/').filter(Boolean));
  const out = [];
  for (const p of parts) {
    if (p === '.' || p === '') continue;
    if (p === '..') out.pop();
    else out.push(p);
  }
  return '/' + out.join('/');
}

function getNode(path) {
  const clean = resolvePath(path);
  if (clean === '/') return App.vfs;
  const parts = clean.split('/').filter(Boolean);
  let cur = App.vfs;
  for (const p of parts) {
    if (!cur.children) return null;
    cur = cur.children.find(x => x.name === p);
    if (!cur) return null;
  }
  return cur;
}

function getParent(path) {
  const clean = resolvePath(path);
  if (clean === '/') return null;
  const parts = clean.split('/').filter(Boolean);
  parts.pop();
  const parentPath = '/' + parts.join('/');
  return getNode(parentPath || '/');
}

function persistVFS() {
  storage.set('vfs', App.vfs);
  renderTree();
}

/* ============================ 
   SECCIÓN 10: RENDERIZADO UI
   ============================ */

function renderTree() {
  const fileTreeEl = $('#file-tree');
  if (!fileTreeEl) return;
  
  const out = [];
  function walk(node, depth=0) {
    const indent = '  '.repeat(depth);
    const icon = node.type === 'dir' ? '📁' : (node.locked ? '🔒' : '📄');
    out.push(`${indent}${icon} ${node.name}`);
    if (node.type === 'dir' && node.children) {
      for (const c of node.children) walk(c, depth+1);
    }
  }
  walk(App.vfs, 0);
  fileTreeEl.textContent = out.join('\n');
  
  // Quick secrets
  const quickSecretsEl = $('#quick-secrets');
  if (quickSecretsEl) {
    const secrets = [];
    function gatherSecrets(node, p='/') {
      if (node.type === 'file' && node.locked) {
        secrets.push({name:node.name, path: p + (p.endsWith('/') ? '' : '/') + node.name});
      } else if (node.children) {
        for (const c of node.children) {
          gatherSecrets(c, p + (node.name === '/' ? '' : node.name + '/'));
        }
      }
    }
    gatherSecrets(App.vfs, '/');
    quickSecretsEl.innerHTML = '';
    secrets.slice(0,8).forEach(s => {
      const li = document.createElement('li');
      li.textContent = `🔒 ${s.path}`;
      li.addEventListener('click', () => {
        $('#terminal-input').value = `decrypt ${s.path}`;
        $('#terminal-input').focus();
      });
      quickSecretsEl.appendChild(li);
    });
  }
  
  // Update counts
  const fileCount = (function countFiles(n){ 
    let cnt = 0; 
    if (n.type==='file') return 1; 
    if (n.children) for (const c of n.children) cnt += countFiles(c); 
    return cnt; 
  })(App.vfs);
  
  const lockedCount = (function countLocked(n){ 
    let cnt = 0; 
    if (n.type==='file' && n.locked) return 1; 
    if (n.children) for (const c of n.children) cnt += countLocked(c); 
    return cnt; 
  })(App.vfs);
  
  const uiCount = $('#ui-count');
  const lockedCountEl = $('#locked-count');
  const statFiles = $('#stat-files');
  const statLocked = $('#stat-locked');
  
  if (uiCount) uiCount.textContent = fileCount;
  if (lockedCountEl) lockedCountEl.textContent = lockedCount;
  if (statFiles) statFiles.textContent = fileCount;
  if (statLocked) statLocked.textContent = lockedCount;
}

function updateStatusUI() {
  const uiUser = $('#ui-user');
  const uiRole = $('#ui-role');
  const promptUser = $('#prompt-user');
  const statusText = $('#status-text');
  const statusIndicator = $('#status-indicator');
  const uiSecurity = $('#ui-security');
  const statUser = $('#stat-user');
  
  if (uiUser) uiUser.textContent = App.user;
  if (uiRole) uiRole.textContent = App.role;
  if (promptUser) promptUser.textContent = App.user;
  if (statUser) statUser.textContent = App.user;
  if (uiSecurity) uiSecurity.textContent = App.security;
  
  if (statusText) statusText.textContent = App.role;
  if (statusIndicator) {
    statusIndicator.className = 'status';
    if (App.role === 'root') statusIndicator.classList.add('status-root');
    else if (App.role === 'user') statusIndicator.classList.add('status-user');
    else statusIndicator.classList.add('status-guest');
  }
}

function startClock() {
  setInterval(() => {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2,'0');
    const mm = String(d.getMinutes()).padStart(2,'0');
    const clockEl = $('#clock');
    if (clockEl) clockEl.textContent = `${hh}:${mm}`;
  }, 1000);
}

/* ============================ 
   SECCIÓN 11: TERMINAL OUTPUT
   ============================ */

function printLine(text, cls='') {
  const terminalOutput = $('#terminal-output');
  if (!terminalOutput) return;
  
  const div = document.createElement('div');
  div.className = 'terminal-line ' + cls;
  div.textContent = text;
  terminalOutput.appendChild(div);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function printHTML(html) {
  const terminalOutput = $('#terminal-output');
  if (!terminalOutput) return;
  
  const div = document.createElement('div');
  div.className = 'terminal-line';
  div.innerHTML = html;
  terminalOutput.appendChild(div);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function printCommand(cmd) {
  const terminalOutput = $('#terminal-output');
  if (!terminalOutput) return;
  
  const div = document.createElement('div');
  div.className = 'terminal-line cmd';
  div.innerHTML = `<span class="prompt">${App.user}@SBM-G:${App.cwd}$</span> ${escapeHtml(cmd)}`;
  terminalOutput.appendChild(div);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function addLog(level, message) {
  const entry = { time: new Date().toISOString(), level, message };
  App.logs.push(entry);
  storage.set('logs', App.logs);
  
  const logsOutput = $('#logs-output');
  if (logsOutput) {
    const el = document.createElement('div');
    el.className = `log-entry ${level}`;
    el.textContent = `[${entry.time}] ${entry.level.toUpperCase()} — ${entry.message}`;
    logsOutput.appendChild(el);
    logsOutput.scrollTop = logsOutput.scrollHeight;
  }
}

/* ============================ 
   SECCIÓN 12: CRYPTO HELPERS
   ============================ */

async function deriveKeyFromPass(pass, saltB64 = null) {
  const enc = new TextEncoder().encode(pass);
  let salt;
  if (saltB64) salt = b642ab(saltB64);
  else salt = crypto.getRandomValues(new Uint8Array(16)).buffer;
  const baseKey = await crypto.subtle.importKey('raw', enc, {name:'PBKDF2'}, false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({
    name:'PBKDF2', salt, iterations: 150000, hash: 'SHA-256'
  }, baseKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt','decrypt']);
  return { key, salt: ab2b64(salt) };
}

async function encryptWithKey(key, plaintext) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const pt = new TextEncoder().encode(plaintext);
  const ct = await crypto.subtle.encrypt({ name:'AES-GCM', iv }, key, pt);
  const combined = new Uint8Array(iv.byteLength + ct.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ct), iv.byteLength);
  return ab2b64(combined.buffer);
}

async function decryptWithKey(key, b64data) {
  try {
    const buf = b642ab(b64data);
    const combined = new Uint8Array(buf);
    const iv = combined.slice(0, 12);
    const ct = combined.slice(12).buffer;
    const ptBuf = await crypto.subtle.decrypt({ name:'AES-GCM', iv }, key, ct);
    return new TextDecoder().decode(ptBuf);
  } catch (err) {
    throw new Error('Decrypt failed');
  }
}

/* ============================ 
   SECCIÓN 13: COMANDOS
   ============================ */

function cmd_help() {
  printHTML(`<div class="file-preview"><strong>SBM-G v${CONFIG.VERSION} — Sistema de Comandos</strong><hr>
  <strong>Navegación:</strong><br>
  <code>ls [path]</code> — listar carpeta<br>
  <code>tree [path]</code> — árbol de carpetas<br>
  <code>cd [path]</code> — cambiar carpeta<br>
  <code>pwd</code> — mostrar ruta actual<br><br>
  
  <strong>Archivos:</strong><br>
  <code>cat &lt;file&gt;</code> — ver archivo<br>
  <code>open &lt;file&gt;</code> — abrir en editor<br>
  <code>touch &lt;file&gt;</code> — crear archivo vacío<br>
  <code>mkdir &lt;dir&gt;</code> — crear carpeta<br>
  <code>rm &lt;path&gt;</code> — eliminar<br>
  <code>search &lt;term&gt;</code> — buscar texto<br><br>
  
  <strong>Cifrado:</strong><br>
  <code>encrypt &lt;file&gt;</code> — cifrar archivo<br>
  <code>decrypt &lt;file&gt;</code> — descifrar archivo<br><br>
  
  <strong>Sistema:</strong><br>
  <code>whoami</code> — Usuario actual<br>
  <code>history</code> — Historial de comandos<br>
  <code>clear</code> — Limpiar terminal<br>
  <code>status</code> — Estado del sistema<br>
  <code>missions</code> — Ver misiones<br>
  <code>stats</code> — Ver estadísticas<br>
  <code>achievements</code> — Ver logros<br><br>
  
  <strong>Multimedia:</strong><br>
  <code>play</code> — Reproducir música<br>
  <code>stop</code> — Detener música<br><br>
  
  <strong>Temas:</strong><br>
  <code>theme &lt;name&gt;</code> — Cambiar tema<br>
  <code>themes</code> — Listar temas<br><br>
  
  <strong>Asistente AI:</strong><br>
  <code>ai &lt;pregunta&gt;</code> — Preguntar al asistente<br><br>
  
  <hr><em>¡Gana XP descifrando archivos y completando misiones!</em></div>`);
}

function cmd_ls(args) {
  const path = args[0] ? resolvePath(args[0]) : App.cwd;
  const node = getNode(path);
  if (!node) { printLine(`ls: no existe: ${path}`, 'error'); return; }
  if (node.type !== 'dir') { printLine(`ls: ${path} no es carpeta`, 'error'); return; }
  
  missionSystem.checkMissionProgress('custom', 'explore_folders', 0.5);
  
  node.children.forEach(child => {
    const mark = child.type === 'dir' ? '📁' : (child.locked ? '🔒' : '📄');
    printLine(`${mark}  ${child.name}`);
  });
}

function cmd_tree(args) {
  const path = args[0] ? resolvePath(args[0]) : App.cwd;
  const node = getNode(path);
  if (!node) { printLine(`tree: no existe: ${path}`, 'error'); return; }
  const out = [];
  function walk(n, depth=0) {
    const pad = '  '.repeat(depth);
    const icon = n.type==='dir' ? '📁' : (n.locked ? '🔒' : '📄');
    out.push(pad + icon + ' ' + n.name);
    if (n.type==='dir' && n.children) for (const c of n.children) walk(c, depth+1);
  }
  walk(node,0);
  printHTML(`<div class="file-preview"><pre>${out.join('\n')}</pre></div>`);
}

function cmd_cd(args) {
  const target = args[0] ? resolvePath(args[0]) : '/';
  const node = getNode(target);
  if (!node) { printLine(`cd: no existe: ${target}`, 'error'); return; }
  if (node.type !== 'dir') { printLine(`cd: no es carpeta: ${target}`, 'error'); return; }
  App.cwd = target;
  const promptPath = $('#prompt-path');
  if (promptPath) promptPath.textContent = App.cwd;
  printLine(`→ ${target}`, 'success');
}

function cmd_pwd() { printLine(App.cwd); }

function cmd_cat(args) {
  if (!args[0]) { printLine('cat: falta archivo', 'error'); return; }
  const node = getNode(resolvePath(args[0]));
  if (!node) { printLine('cat: no encontrado', 'error'); return; }
  if (node.type !== 'file') { printLine('cat: no es archivo', 'error'); return; }
  
  if (node.locked && !node.plain) { 
    printLine('cat: archivo cifrado. Usa decrypt <file> primero.', 'warning'); 
    return; 
  }
  
  printHTML(`<div class="file-preview"><pre>${escapeHtml(node.plain || node.content || '')}</pre></div>`);
  App.addXP(CONFIG.XP_PER_FILE, `Archivo leído: ${node.name}`);
}

function cmd_open(args) {
  if (!args[0]) { printLine('open: falta archivo', 'error'); return; }
  const node = getNode(resolvePath(args[0]));
  if (!node) { printLine('open: no encontrado', 'error'); return; }
  if (node.type !== 'file') { printLine('open: no es archivo', 'error'); return; }
  
  if (node.locked && !node.plain) { 
    printLine('open: archivo cifrado. Usa decrypt <file> primero.', 'warning'); 
    return; 
  }
  
  const editorInfo = $('#editor-info');
  const editorText = $('#editor-text');
  
  if (editorInfo) editorInfo.textContent = resolvePath(args[0]);
  if (editorText) {
    editorText.value = node.plain || node.content || '';
    updateEditorStatus();
  }
  
  switchPanel('editor');
  App.addXP(CONFIG.XP_PER_FILE, `Archivo abierto: ${node.name}`);
}

function cmd_touch(args) {
  if (!args[0]) { printLine('touch: falta archivo', 'error'); return; }
  const p = resolvePath(args[0]);
  const parent = getParent(p);
  if (!parent) { printLine('touch: path no válido', 'error'); return; }
  const name = p.split('/').filter(Boolean).pop();
  if (!parent.children) parent.children = [];
  if (parent.children.find(x=>x.name===name)) { printLine('touch: ya existe', 'error'); return; }
  parent.children.push({ name, type:'file', open:true, content:'' });
  persistVFS();
  printLine(`✓ Archivo creado: ${p}`, 'success');
  missionSystem.checkMissionProgress('custom', 'create_files', 1);
}

function cmd_mkdir(args) {
  if (!args[0]) { printLine('mkdir: falta carpeta', 'error'); return; }
  const p = resolvePath(args[0]);
  const parent = getParent(p);
  if (!parent) { printLine('mkdir: path no válido', 'error'); return; }
  const name = p.split('/').filter(Boolean).pop();
  if (!parent.children) parent.children = [];
  if (parent.children.find(x=>x.name===name)) { printLine('mkdir: ya existe', 'error'); return; }
  parent.children.push({ name, type:'dir', children:[] });
  persistVFS();
  printLine(`✓ Carpeta creada: ${p}`, 'success');
}

function cmd_rm(args) {
  if (!args[0]) { printLine('rm: falta ruta', 'error'); return; }
  const p = resolvePath(args[0]);
  const parent = getParent(p);
  if (!parent) { printLine('rm: no válido', 'error'); return; }
  const name = p.split('/').filter(Boolean).pop();
  const idx = parent.children.findIndex(x=>x.name===name);
  if (idx === -1) { printLine('rm: no encontrado', 'error'); return; }
  parent.children.splice(idx,1);
  persistVFS();
  printLine(`✓ Eliminado: ${p}`, 'success');
}

function cmd_search(args) {
  const q = args.join(' ').toLowerCase();
  if (!q) { printLine('search: falta término', 'error'); return; }
  const results = [];
  function walk(n, path='/') {
    if (n.type === 'file') {
      const text = (n.plain || n.open ? (n.plain || n.content || '') : '');
      if ((text && text.toLowerCase().includes(q)) || (n.name && n.name.toLowerCase().includes(q))) {
        results.push({path, name:n.name, locked: !!n.locked});
      }
    } else if (n.children) {
      for (const c of n.children) walk(c, path + (n.name === '/' ? '' : n.name + '/'));
    }
  }
  walk(App.vfs, '/');
  if (!results.length) printLine('search: sin resultados', 'warning');
  else {
    printLine(`Encontrados ${results.length} resultado(s):`, 'info');
    results.forEach(r => printLine(`  ${r.locked ? '🔒' : '📄'} ${r.path}${r.path.endsWith('/')?'':'/'}${r.name}`));
  }
}

async function cmd_encrypt(args) {
  if (!args[0]) { printLine('encrypt: falta archivo', 'error'); return; }
  const node = getNode(resolvePath(args[0]));
  if (!node) { printLine('encrypt: no encontrado', 'error'); return; }
  if (node.type !== 'file') { printLine('encrypt: no es archivo', 'error'); return; }
  
  const pass = prompt(`Ingresa contraseña para cifrar ${node.name}:`);
  if (!pass) { printLine('encrypt: cancelado', 'warning'); return; }
  
  try {
    const derived = await deriveKeyFromPass(pass);
    const ct = await encryptWithKey(derived.key, node.content || node.plain || '');
    node.content = ct;
    node.locked = true;
    if (!node.meta) node.meta = {};
    node.meta.salt = derived.salt;
    if (node.plain) delete node.plain;
    persistVFS();
    printLine(`✓ Archivo cifrado: ${resolvePath(args[0])}`, 'success');
    addLog('info', `encrypt ${resolvePath(args[0])}`);
  } catch (e) {
    printLine('encrypt: error: ' + e.message, 'error');
  }
}

async function cmd_decrypt(args) {
  if (!args[0]) { printLine("decrypt: falta archivo", 'error'); return; }
  
  const path = resolvePath(args[0]);
  const node = getNode(path);
  
  if (!node) { printLine("decrypt: no encontrado", 'error'); return; }
  if (node.type !== "file") { printLine("decrypt: no es archivo", 'error'); return; }
  if (!node.locked) { printLine("decrypt: el archivo no está cifrado", 'warning'); return; }
  
  const pass = prompt(`Ingresa contraseña para ${node.name}:`);
  if (!pass) { printLine("decrypt: cancelado", 'warning'); return; }
  
  // Simple password check
  if (node.password) {
    if (pass === node.password) {
      node.plain = node.content;
      node.locked = false;
      persistVFS();
      printLine(`✓ Archivo descifrado: ${path}`, 'success');
      addLog('info', `decrypt ${path}`);
      
      App.addXP(CONFIG.XP_PER_SECRET, `Archivo descifrado: ${node.name}`);
      missionSystem.checkMissionProgress('custom', 'decrypt_files', 1);
      missionSystem.checkMissionProgress('custom', 'discover_secrets', 1);
      missionSystem.checkMissionProgress('command', 'decrypt', 1);
      
      if (node.content && node.content.includes('FLAG{')) {
        printLine('🎌 ¡FLAG encontrado! +100 XP', 'success');
        App.addXP(100, `Flag en ${node.name}`);
      }
      
    } else {
      printLine("decrypt: contraseña incorrecta", 'error');
    }
    return;
  }
  
  // AES-GCM decrypt
  try {
    const salt = node.meta?.salt;
    if (!salt) { printLine("decrypt: sin salt — archivo no compatible", 'error'); return; }
    
    const derived = await deriveKeyFromPass(pass, salt);
    const plaintext = await decryptWithKey(derived.key, node.content);
    
    node.plain = plaintext;
    node.locked = false;
    persistVFS();
    
    printLine(`✓ Archivo descifrado: ${path}`, 'success');
    addLog("info", `decrypt ${path}`);
    
    App.addXP(CONFIG.XP_PER_SECRET, `Archivo descifrado (AES): ${node.name}`);
    missionSystem.checkMissionProgress('custom', 'decrypt_files', 1);
    missionSystem.checkMissionProgress('custom', 'discover_secrets', 1);
    missionSystem.checkMissionProgress('command', 'decrypt', 1);
    
    if (plaintext.includes('FLAG{')) {
      printLine('🎌 ¡FLAG encontrado! +100 XP', 'success');
      App.addXP(100, `Flag en ${node.name}`);
    }
    
  } catch (err) {
    printLine("decrypt: contraseña incorrecta o archivo dañado", 'error');
  }
}

function cmd_whoami() {
  const levelData = App.calculateLevel();
  printHTML(`<div class="file-preview">
    <strong>Usuario:</strong> ${App.user}<br>
    <strong>Rol:</strong> ${App.role}<br>
    <strong>Nivel:</strong> ${levelData.level} (${levelData.title})<br>
    <strong>XP:</strong> ${App.xp}<br>
    <strong>Progreso:</strong> ${Math.round(levelData.progress)}%
  </div>`);
}

function cmd_history() {
  if (App.history.length === 0) {
    printLine('history: sin historial', 'info');
    return;
  }
  App.history.forEach((h,i)=> printLine(`${i+1}\t${h}`));
}

function cmd_clear() {
  const terminalOutput = $('#terminal-output');
  if (terminalOutput) terminalOutput.innerHTML = '';
}

function cmd_missions() {
  printLine('=== Sistema de Misiones ===', 'info');
  missionSystem.missions.forEach(mission => {
    const status = mission.completed ? '✅' : '🔄';
    const progress = `(${mission.progress}/${mission.maxProgress})`;
    printLine(`${status} ${mission.title}: ${mission.description} ${progress}`);
  });
  printLine('');
  printLine('Escribe "stats" para ver estadísticas detalladas.', 'info');
}

function cmd_stats() {
  const levelData = App.calculateLevel();
  const fileCount = (function countFiles(n){ 
    let cnt = 0; 
    if (n.type==='file') return 1; 
    if (n.children) for (const c of n.children) cnt += countFiles(c); 
    return cnt; 
  })(App.vfs);
  
  const lockedCount = (function countLocked(n){ 
    let cnt = 0; 
    if (n.type==='file' && n.locked) return 1; 
    if (n.children) for (const c of n.children) cnt += countLocked(c); 
    return cnt; 
  })(App.vfs);
  
  const completedMissions = missionSystem.missions.filter(m => m.completed).length;
  const unlockedAchievements = missionSystem.achievements.filter(a => a.unlocked).length;
  
  printHTML(`<div class="file-preview">
    <strong>Estadísticas de ${App.user}</strong><hr>
    <strong>Usuario:</strong> ${App.user}<br>
    <strong>Rol:</strong> ${App.role}<br>
    <strong>Nivel:</strong> ${levelData.level} (${levelData.title})<br>
    <strong>XP:</strong> ${App.xp} / ${levelData.nextXP || 'MAX'}<br>
    <strong>Progreso:</strong> ${Math.round(levelData.progress)}%<br><hr>
    <strong>Archivos:</strong> ${fileCount}<br>
    <strong>Cifrados:</strong> ${lockedCount}<br>
    <strong>Misiones:</strong> ${completedMissions}/${missionSystem.missions.length}<br>
    <strong>Logros:</strong> ${unlockedAchievements}/${missionSystem.achievements.length}<br><hr>
    <strong>Tiempo:</strong> ${Math.floor(App.sessionTime / 60)} minutos
  </div>`);
}

function cmd_status() {
  const levelData = App.calculateLevel();
  printHTML(`<div class="file-preview">
    <strong>Estado del Sistema SBM-G v${CONFIG.VERSION}</strong><hr>
    <strong>Sistema:</strong> Operativo ✓<br>
    <strong>Usuario:</strong> ${App.user} (${App.role})<br>
    <strong>Nivel:</strong> ${levelData.level} - ${levelData.title}<br>
    <strong>XP:</strong> ${App.xp} / ${levelData.nextXP || 'MAX'}<br>
    <strong>Seguridad:</strong> ${App.security}<br>
    <strong>Música:</strong> ${App.musicOn ? 'Reproduciendo 🎵' : 'Detenida'}<br>
    <strong>Tema:</strong> ${App.theme}<br><hr>
    <em>Sistema local • Todo se guarda en tu navegador</em>
  </div>`);
}

function cmd_theme(args) {
  if (!args[0]) {
    printLine('theme: falta nombre', 'error');
    printLine('Temas: default, hacker, ocean, purple, solarized, matrix', 'info');
    return;
  }
  
  const theme = args[0].toLowerCase();
  const themes = ['default', 'hacker', 'ocean', 'purple', 'solarized', 'matrix'];
  
  if (!themes.includes(theme)) {
    printLine(`Tema no válido: ${theme}`, 'error');
    printLine('Temas: ' + themes.join(', '), 'info');
    return;
  }
  
  ThemeSystem.applyTheme(theme);
  printLine(`✓ Tema: ${theme}`, 'success');
}

function cmd_themes() {
  printLine('Temas disponibles:', 'info');
  printLine('• default - Tema original (azul/verde)');
  printLine('• hacker - Estilo Matrix (verde)');
  printLine('• ocean - Azul oceánico');
  printLine('• purple - Morado oscuro');
  printLine('• solarized - Tema solarizado');
  printLine('• matrix - Estilo Matrix completo');
  printLine('');
  printLine('Uso: theme <nombre>', 'info');
}

async function cmd_ai(args) {
  if (!args.length) {
    printLine('ai: falta pregunta', 'error');
    printLine('Ejemplo: ai ¿cómo cifrar un archivo?', 'info');
    return;
  }
  
  const question = args.join(' ');
  printLine(`🤖 Pregunta: ${question}`, 'info');
  
  try {
    const response = await aiAssistant.processQuery(question);
    printLine(response);
  } catch (error) {
    printLine(`❌ Error: ${error.message}`, 'error');
  }
}

function cmd_achievements() {
  printLine('=== Logros ===', 'info');
  missionSystem.achievements.forEach(achievement => {
    const status = achievement.unlocked ? '✅' : '🔒';
    printLine(`${status} ${achievement.icon} ${achievement.title}: ${achievement.description}`);
  });
}

function cmd_play() {
  const bgAudio = $('#bg-audio');
  if (bgAudio) {
    bgAudio.play().then(() => {
      App.musicOn = true;
      printLine('♪ Música reproducida', 'success');
    }).catch(() => {
      printLine('No se pudo reproducir', 'warning');
    });
  }
}

function cmd_stop() {
  const bgAudio = $('#bg-audio');
  if (bgAudio) {
    bgAudio.pause();
    App.musicOn = false;
    printLine('♪ Música detenida', 'success');
  }
}

/* ============================ 
   SECCIÓN 14: COMMAND DISPATCHER
   ============================ */

async function handleCommandLine(raw) {
  const line = String(raw || '').trim();
  if (!line) return;
  
  printCommand(line);
  App.history.push(line);
  
  const parts = line.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);
  
  try {
    switch (cmd) {
      case 'help': cmd_help(); break;
      case 'ls': cmd_ls(args); break;
      case 'tree': cmd_tree(args); break;
      case 'cd': cmd_cd(args); break;
      case 'pwd': cmd_pwd(); break;
      case 'cat': cmd_cat(args); break;
      case 'open': cmd_open(args); break;
      case 'touch': cmd_touch(args); break;
      case 'mkdir': cmd_mkdir(args); break;
      case 'rm': cmd_rm(args); break;
      case 'search': cmd_search(args); break;
      case 'encrypt': await cmd_encrypt(args); break;
      case 'decrypt': await cmd_decrypt(args); break;
      case 'whoami': cmd_whoami(); break;
      case 'history': cmd_history(); break;
      case 'clear': cmd_clear(); break;
      case 'missions': cmd_missions(); break;
      case 'stats': cmd_stats(); break;
      case 'status': cmd_status(); break;
      case 'theme': cmd_theme(args); break;
      case 'themes': cmd_themes(); break;
      case 'ai': await cmd_ai(args); break;
      case 'ask': await cmd_ai(args); break;
      case 'achievements': cmd_achievements(); break;
      case 'play': cmd_play(); break;
      case 'stop': cmd_stop(); break;
      default:
        printLine(`Comando no reconocido: ${cmd}`, 'error');
        printLine('Escribe "help" para ver comandos disponibles', 'info');
    }
    
    missionSystem.checkMissionProgress('command', cmd);
    
  } catch (e) {
    printLine('Error: ' + e.message, 'error');
    console.error('Command error:', e);
  }
}

/* ============================ 
   SECCIÓN 15: PANEL SWITCHING
   ============================ */

function switchPanel(panelName) {
  $$('.panel').forEach(panel => panel.classList.add('hidden'));
  
  const panel = $(`#panel-${panelName}`);
  if (panel) {
    panel.classList.remove('hidden');
  }
  
  $$('.tab').forEach(tab => tab.classList.remove('active'));
  const tab = $(`.tab[data-tab="${panelName}"]`);
  if (tab) tab.classList.add('active');
}

function updateEditorStatus() {
  const editorText = $('#editor-text');
  const editorSize = $('#editor-size');
  const editorLines = $('#editor-lines');
  
  if (!editorText) return;
  if (editorSize) editorSize.textContent = editorText.value.length;
  if (editorLines) editorLines.textContent = editorText.value.split('\n').length;
}

/* ============================ 
   SECCIÓN 16: EVENT BINDINGS
   ============================ */

function setupEventListeners() {
  // Terminal form
  const terminalForm = $('#terminal-form');
  const terminalInput = $('#terminal-input');
  
  if (terminalForm) {
    terminalForm.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const cmd = terminalInput.value;
      terminalInput.value = '';
      await handleCommandLine(cmd);
    });
  }
  
  // Terminal input shortcuts
  if (terminalInput) {
    terminalInput.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowUp') {
        ev.preventDefault();
        if (App.history.length > 0) {
          terminalInput.value = App.history[App.history.length - 1];
        }
      } else if (ev.key === 'Tab') {
        ev.preventDefault();
        const commands = ['help', 'ls', 'cd', 'cat', 'open', 'decrypt', 'encrypt', 'tree', 'search'];
        const current = terminalInput.value;
        const matches = commands.filter(cmd => cmd.startsWith(current));
        if (matches.length === 1) {
          terminalInput.value = matches[0] + ' ';
        }
      }
    });
    terminalInput.focus();
  }
  
  // Editor save
  const btnSave = $('#btn-save');
  const editorInfo = $('#editor-info');
  const editorText = $('#editor-text');
  
  if (btnSave) {
    btnSave.addEventListener('click', () => {
      const path = editorInfo.textContent;
      const node = getNode(path);
      if (!node) { printLine('Guardar: archivo no encontrado', 'error'); return; }
      node.content = editorText.value;
      node.open = true;
      node.locked = false;
      if (node.plain) delete node.plain;
      persistVFS();
      printLine(`✓ Guardado: ${path}`, 'success');
      switchPanel('terminal');
    });
  }
  
  // Close editor
  const btnCloseEditor = $('#btn-close-editor');
  if (btnCloseEditor) {
    btnCloseEditor.addEventListener('click', () => {
      switchPanel('terminal');
    });
  }
  
  // Editor text changes
  if (editorText) {
    editorText.addEventListener('input', updateEditorStatus);
  }
  
  // Refresh tree
  const refreshTree = $('#refresh-tree');
  if (refreshTree) {
    refreshTree.addEventListener('click', () => {
      renderTree();
      printLine('✓ Explorer actualizado', 'success');
    });
  }
  
  // New file
  const newFile = $('#new-file');
  if (newFile) {
    newFile.addEventListener('click', () => {
      const name = prompt('Nombre del archivo:');
      if (!name) return;
      
      const parent = getNode(App.cwd);
      if (!parent || parent.type !== 'dir') {
        printLine('Error: No se puede crear aquí', 'error');
        return;
      }
      
      if (!parent.children) parent.children = [];
      if (parent.children.find(x => x.name === name)) {
        printLine('Error: Ya existe', 'error');
        return;
      }
      
      parent.children.push({ 
        name, 
        type: 'file', 
        open: true,
        content: ''
      });
      
      persistVFS();
      printLine(`✓ Archivo creado: ${App.cwd}/${name}`, 'success');
      App.addXP(CONFIG.XP_PER_FILE, `Creado: ${name}`);
      missionSystem.checkMissionProgress('custom', 'create_files', 1);
    });
  }
  
  // New folder
  const newFolder = $('#new-folder');
  if (newFolder) {
    newFolder.addEventListener('click', () => {
      const name = prompt('Nombre de la carpeta:');
      if (!name) return;
      
      const parent = getNode(App.cwd);
      if (!parent || parent.type !== 'dir') {
        printLine('Error: No se puede crear aquí', 'error');
        return;
      }
      
      if (!parent.children) parent.children = [];
      if (parent.children.find(x => x.name === name)) {
        printLine('Error: Ya existe', 'error');
        return;
      }
      
      parent.children.push({ 
        name, 
        type: 'dir', 
        children: [] 
      });
      
      persistVFS();
      printLine(`✓ Carpeta creada: ${App.cwd}/${name}`, 'success');
    });
  }
  
  // Toggle music
  const toggleMusic = $('#toggle-music');
  const bgAudio = $('#bg-audio');
  
  if (toggleMusic && bgAudio) {
    toggleMusic.addEventListener('click', () => {
      if (App.musicOn) {
        bgAudio.pause();
        App.musicOn = false;
        printLine('♪ Música pausada', 'success');
      } else {
        bgAudio.play().then(() => {
          App.musicOn = true;
          printLine('♪ Música reproducida', 'success');
        }).catch(() => {
          printLine('No se pudo reproducir', 'warning');
        });
      }
    });
  }
  
  // Fullscreen
  const btnFullscreen = $('#btn-fullscreen');
  if (btnFullscreen) {
    btnFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {
          printLine('No se pudo entrar en pantalla completa', 'warning');
        });
      } else {
        document.exitFullscreen();
      }
    });
  }
  
  // Theme button
  const btnThemes = $('#btn-themes');
  if (btnThemes) {
    btnThemes.addEventListener('click', () => {
      handleCommandLine('themes');
    });
  }
  
  // Panel navigation
  $$('[data-action]').forEach(btn => {
    btn.addEventListener('click', (ev) => {
      const action = ev.target.closest('[data-action]').dataset.action;
      switchPanel(action);
    });
  });
  
  // Quick commands
  $$('.quick-cmd, .cmd-chip').forEach(btn => {
    btn.addEventListener('click', (ev) => {
      const cmd = ev.target.dataset.cmd;
      if (cmd && terminalInput) {
        terminalInput.value = cmd;
        terminalInput.focus();
      }
    });
  });
  
  // AI quick questions
  $$('.ai-quick-btn').forEach(btn => {
    btn.addEventListener('click', async (ev) => {
      const question = ev.target.closest('.ai-quick-btn').dataset.question;
      if (question) {
        const aiMessage = $('#ai-message');
        if (aiMessage) aiMessage.textContent = 'Pensando...';
        
        try {
          const response = await aiAssistant.processQuery(question);
          if (aiMessage) aiMessage.textContent = response;
        } catch (error) {
          if (aiMessage) aiMessage.textContent = 'Error: ' + error.message;
        }
      }
    });
  });
  
  // AI send
  const aiSend = $('#ai-send');
  const aiInput = $('#ai-input');
  const aiMessage = $('#ai-message');
  
  if (aiSend && aiInput) {
    aiSend.addEventListener('click', async () => {
      const question = aiInput.value.trim();
      if (!question) return;
      
      aiInput.value = '';
      if (aiMessage) aiMessage.textContent = 'Pensando...';
      
      try {
        const response = await aiAssistant.processQuery(question);
        if (aiMessage) aiMessage.textContent = response;
      } catch (error) {
        if (aiMessage) aiMessage.textContent = 'Error: ' + error.message;
      }
    });
  }
  
  if (aiInput) {
    aiInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && aiSend) {
        aiSend.click();
      }
    });
  }
  
  // Scan secrets
  const btnScanSecrets = $('#btn-scan-secrets');
  if (btnScanSecrets) {
    btnScanSecrets.addEventListener('click', () => {
      handleCommandLine('ls /secrets');
    });
  }
  
  // Hint button
  const btnHint = $('#btn-hint');
  if (btnHint) {
    btnHint.addEventListener('click', () => {
      printLine('💡 Pista: Revisa /docs/manual.txt para passwords', 'info');
      printLine('💡 Password de hidden_5.enc: M2sQw18L', 'info');
    });
  }
  
  // Reset button
  const btnReset = $('#btn-reset');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (confirm('¿Resetear toda la aplicación? Se perderán todos los datos.')) {
        storage.clearAll();
        localStorage.clear();
        location.reload();
      }
    });
  }
  
  // Export all
  const btnExportAll = $('#btn-export-all');
  if (btnExportAll) {
    btnExportAll.addEventListener('click', () => {
      const data = {
        app: CONFIG.APP_NAME,
        version: CONFIG.VERSION,
        timestamp: new Date().toISOString(),
        state: {
          user: App.user,
          xp: App.xp,
          level: App.level,
          role: App.role
        },
        vfs: App.vfs,
        missions: missionSystem.missions,
        achievements: missionSystem.achievements,
        logs: App.logs.slice(-100)
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sbm_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      printLine('✓ Backup exportado', 'success');
    });
  }
  
  // Clear logs
  const btnClearLogs = $('#btn-clear-logs');
  const logsOutput = $('#logs-output');
  if (btnClearLogs && logsOutput) {
    btnClearLogs.addEventListener('click', () => {
      App.logs = [];
      storage.set('logs', App.logs);
      logsOutput.innerHTML = '';
      printLine('✓ Logs limpiados', 'success');
    });
  }
  
  // Export logs
  const btnExportLogs = $('#btn-export-logs');
  if (btnExportLogs) {
    btnExportLogs.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(App.logs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sbm_logs.json';
      a.click();
      URL.revokeObjectURL(url);
      printLine('✓ Logs exportados', 'success');
    });
  }
}

/* ============================ 
   SECCIÓN 17: INITIALIZATION
   ============================ */

let missionSystem, aiAssistant;

function bootstrap() {
  // Initialize systems
  missionSystem = new MissionSystem();
  aiAssistant = new AIAssistant();
  
  // Load VFS
  loadVFS();
  
  // Initialize UI
  renderTree();
  updateStatusUI();
  startClock();
  
  // Initialize themes
  ThemeSystem.applyTheme(App.theme);
  
  // Initialize missions UI
  missionSystem.updateMissionsUI();
  missionSystem.updateAchievementsUI();
  
  // Update XP bar
  App.updateXPBar();
  
  // Load logs
  const savedLogs = storage.get('logs', null);
  const logsOutput = $('#logs-output');
  if (savedLogs && logsOutput) {
    savedLogs.forEach(l => {
      const el = document.createElement('div');
      el.className = `log-entry ${l.level}`;
      el.textContent = `[${l.time}] ${l.level.toUpperCase()} — ${l.message}`;
      logsOutput.appendChild(el);
    });
  }
  
  // Welcome message
  printHTML(`<div class="file-preview"><strong>${CONFIG.APP_NAME}</strong><br>Terminal híbrida profesional<br><hr>Bienvenido, ${App.user}!<br>Nivel: ${App.level} | XP: ${App.xp}<br>Escribe <code>help</code> para empezar.<br><br>💡 <strong>Nuevo:</strong> Pregunta al asistente AI!<br>Usa: <code>ai &lt;pregunta&gt;</code><br>Ejemplo: <code>ai ¿cómo gano XP?</code><br><hr><small>Sistema local • Todo se guarda en tu navegador</small></div>`);
  addLog('info', 'SBM-G v2.0 iniciado');
  
  // Unlock welcome achievement
  missionSystem.unlockAchievement('welcome');
  
  // Check first command mission
  missionSystem.checkMissionProgress('command', 'help', 0.5);
  
  // Setup event listeners
  setupEventListeners();
  
  // Timers
  setInterval(() => {
    App.updateSessionTimer();
    App.updateStorage();
    missionSystem.updateMissionsUI();
    missionSystem.updateAchievementsUI();
    App.updateXPBar();
    updateStatusUI();
  }, 1000);
  
  // Auto-save
  setInterval(() => {
    persistVFS();
    addLog('debug', 'autosave');
  }, 8000);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', bootstrap);

// Expose debug helpers
window.SBMG = {
  App, 
  storage, 
  getNode, 
  resolvePath, 
  persistVFS, 
  handleCommandLine, 
  missionSystem, 
  aiAssistant,
  ThemeSystem
};