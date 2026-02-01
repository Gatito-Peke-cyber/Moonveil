// Banco de Moonveil - Sistema mejorado con recolección

document.addEventListener('DOMContentLoaded', function() {
  // Actualizar año en el footer
  document.getElementById('currentYear').textContent = new Date().getFullYear();
  
  // Datos iniciales del banco (todos en 0)
  const bankData = {
    esmeralda: {
      count: 0,           // Cantidad total recolectada
      piggyCount: 0,      // Cantidad en el chanchito
      rate: 3 * 60 * 60,  // 3 horas en segundos
      lastUpdate: Date.now(),
      nextUpdate: Date.now() + (3 * 60 * 60 * 1000),
      maxPiggy: 50        // Capacidad máxima del chanchito
    },
    cobre: {
      count: 0,
      piggyCount: 0,
      rate: 1 * 60 * 60,  // 1 hora en segundos
      lastUpdate: Date.now(),
      nextUpdate: Date.now() + (1 * 60 * 60 * 1000),
      maxPiggy: 50
    },
    oro: {
      count: 0,
      piggyCount: 0,
      rate: 2 * 60 * 60,  // 2 horas en segundos
      lastUpdate: Date.now(),
      nextUpdate: Date.now() + (2 * 60 * 60 * 1000),
      maxPiggy: 50
    },
    hierro: {
      count: 0,
      piggyCount: 0,
      rate: 1.5 * 60 * 60, // 1.5 horas en segundos
      lastUpdate: Date.now(),
      nextUpdate: Date.now() + (1.5 * 60 * 60 * 1000),
      maxPiggy: 50
    },
    rapida: {
      count: 0,
      piggyCount: 0,
      rate: 10,           // 10 segundos
      lastUpdate: Date.now(),
      nextUpdate: Date.now() + (10 * 1000),
      maxPiggy: 50
    },
    activityLog: [],
    lastVisit: localStorage.getItem('moonveilBankLastVisit') || Date.now(),
    totalGains: 0,
    firstVisit: localStorage.getItem('moonveilBankFirstVisit') || Date.now()
  };
  
  // Cargar datos guardados
  loadSavedData();
  
  // Inicializar la interfaz
  initializeUI();
  
  // Configurar temporizadores de acumulación automática
  setupAutoAccumulation();
  
  // Configurar eventos
  setupEventListeners();
  
  // Generar reporte diario
  generateDailyReport();
  
  // Cargar registro de actividad
  loadActivityLog();
  
  // Actualizar estadísticas
  updateStatistics();
  
  // Función para inicializar la interfaz
  function initializeUI() {
    // Actualizar contadores y tiempos
    updateCurrencyDisplays();
    
    // Actualizar niveles de llenado de chanchitos
    updatePiggyBankFills();
    
    // Configurar animación de la puerta
    setupVaultDoor();
    
    // Actualizar badges
    updateBadges();
  }
  
  // Función para cargar datos guardados
  function loadSavedData() {
    const savedData = localStorage.getItem('moonveilBankData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        
        // Actualizar datos solo si la estructura es válida
        if (parsedData.esmeralda && parsedData.cobre && parsedData.oro && parsedData.hierro) {
          // Actualizar contadores
          bankData.esmeralda.count = parsedData.esmeralda.count || 0;
          bankData.cobre.count = parsedData.cobre.count || 0;
          bankData.oro.count = parsedData.oro.count || 0;
          bankData.hierro.count = parsedData.hierro.count || 0;
          bankData.rapida.count = parsedData.rapida?.count || 0;
          
          // Actualizar cantidades en chanchitos
          bankData.esmeralda.piggyCount = parsedData.esmeralda.piggyCount || 0;
          bankData.cobre.piggyCount = parsedData.cobre.piggyCount || 0;
          bankData.oro.piggyCount = parsedData.oro.piggyCount || 0;
          bankData.hierro.piggyCount = parsedData.hierro.piggyCount || 0;
          bankData.rapida.piggyCount = parsedData.rapida?.piggyCount || 0;
          
          // Actualizar tiempos de última actualización
          const now = Date.now();
          const lastSave = parsedData.lastSave || now;
          const timeSinceLastSave = now - lastSave;
          
          // Calcular acumulaciones automáticas basadas en el tiempo transcurrido
          calculateAutoAccumulations(timeSinceLastSave);
          
          // Actualizar actividad
          bankData.activityLog = parsedData.activityLog || [];
          bankData.totalGains = parsedData.totalGains || 0;
          
          // Actualizar primera visita si existe
          if (parsedData.firstVisit) {
            bankData.firstVisit = parsedData.firstVisit;
            localStorage.setItem('moonveilBankFirstVisit', bankData.firstVisit);
          }
        }
      } catch (e) {
        console.error('Error al cargar datos del banco:', e);
      }
    } else {
      // Primera vez que el usuario usa el banco
      addToActivityLog(`${formatTime(new Date())} - ¡Bienvenido al Banco Moonveil! Tus monedas comenzarán a acumularse automáticamente.`);
    }
  }
  
  // Función para calcular acumulaciones automáticas durante tiempo offline
  function calculateAutoAccumulations(timePassedMs) {
    const currencies = ['esmeralda', 'cobre', 'oro', 'hierro', 'rapida'];
    
    currencies.forEach(currency => {
      const currencyData = bankData[currency];
      const rateMs = currencyData.rate * 1000; // Convertir segundos a ms
      const autoGains = Math.floor(timePassedMs / rateMs);
      
      if (autoGains > 0) {
        // Añadir ganancias al chanchito (hasta el máximo)
        const availableSpace = currencyData.maxPiggy - currencyData.piggyCount;
        const gainsToAdd = Math.min(autoGains, availableSpace);
        
        if (gainsToAdd > 0) {
          currencyData.piggyCount += gainsToAdd;
          
          // Registrar ganancias automáticas
          for (let i = 0; i < gainsToAdd; i++) {
            addToActivityLog(`${formatTime(new Date())} - Ganancia automática: +1 ${getCurrencyName(currency)}`);
          }
          
          // Mostrar notificación por ganancias offline
          if (timePassedMs > 60000) { // Más de 1 minuto offline
            showNotification(`¡Has ganado ${gainsToAdd} ${getCurrencyName(currency)} mientras estabas fuera!`);
          }
          
          // Actualizar tiempo de última actualización
          currencyData.lastUpdate = Date.now() - (timePassedMs % rateMs);
          currencyData.nextUpdate = currencyData.lastUpdate + rateMs;
        }
      }
    });
  }
  
  // Función para configurar acumulación automática
  function setupAutoAccumulation() {
    // Actualizar cada segundo para monedas rápidas
    setInterval(updateCurrencyDisplays, 1000);
    
    // Guardar datos cada 30 segundos
    setInterval(saveBankData, 30000);
  }
  
  // Función para actualizar las visualizaciones de moneda
  function updateCurrencyDisplays() {
    const now = Date.now();
    
    // Para cada moneda
    Object.keys(bankData).forEach(currency => {
      if (currency === 'activityLog' || currency === 'lastVisit' || currency === 'totalGains' || currency === 'firstVisit') return;
      
      const currencyData = bankData[currency];
      
      // Actualizar contadores
      document.getElementById(`count${capitalizeFirst(currency)}`).textContent = currencyData.count;
      document.getElementById(`piggyCount${capitalizeFirst(currency)}`).textContent = `${currencyData.piggyCount}/${currencyData.maxPiggy}`;
      document.getElementById(`coin${capitalizeFirst(currency)}`).textContent = currencyData.piggyCount;
      
      // Verificar si es hora de una ganancia automática
      if (now >= currencyData.nextUpdate) {
        // Verificar si hay espacio en el chanchito
        if (currencyData.piggyCount < currencyData.maxPiggy) {
          currencyData.piggyCount++;
          currencyData.lastUpdate = now;
          currencyData.nextUpdate = now + (currencyData.rate * 1000);
          
          // Actualizar llenado del chanchito
          updatePiggyBankFill(currency);
          
          // Actualizar badge
          updateBadge(currency);
          
          // Registrar en actividad solo si no está lleno
          if (currencyData.piggyCount < currencyData.maxPiggy) {
            addToActivityLog(`${formatTime(new Date())} - Ganancia automática: +1 ${getCurrencyName(currency)}`);
          }
          
          // Mostrar notificación si el chanchito está casi lleno
          if (currencyData.piggyCount >= currencyData.maxPiggy * 0.8) {
            if (currencyData.piggyCount === currencyData.maxPiggy) {
              showNotification(`¡Chanchito de ${getCurrencyName(currency)} está lleno! ¡Recolecta para seguir ganando!`);
            } else if (currencyData.piggyCount % 10 === 0) {
              showNotification(`¡Chanchito de ${getCurrencyName(currency)} tiene ${currencyData.piggyCount} monedas!`);
            }
          }
        } else {
          // El chanchito está lleno, actualizar tiempo pero no añadir más
          currencyData.nextUpdate = now + (currencyData.rate * 1000);
        }
      }
      
      // Actualizar tiempo para próxima ganancia
      const timeToNext = currencyData.nextUpdate - now;
      updateNextTimeDisplay(currency, timeToNext);
    });
    
    // Actualizar botones de recolección
    updateCollectButtons();
    
    // Actualizar estadísticas
    updateStatistics();
  }
  
  // Función para actualizar el display del tiempo próximo
  function updateNextTimeDisplay(currency, timeMs) {
    const element = document.getElementById(`next${capitalizeFirst(currency)}`);
    if (!element) return;
    
    if (timeMs <= 0) {
      element.textContent = "¡Ahora!";
      return;
    }
    
    if (currency === 'rapida') {
      // Mostrar segundos para moneda rápida
      const seconds = Math.floor(timeMs / 1000);
      element.textContent = `${seconds}s`;
    } else {
      // Mostrar horas y minutos para otras monedas
      const hours = Math.floor(timeMs / (60 * 60 * 1000));
      const minutes = Math.floor((timeMs % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((timeMs % (60 * 1000)) / 1000);
      
      if (hours > 0) {
        element.textContent = `${hours}h ${minutes}m`;
      } else if (minutes > 0) {
        element.textContent = `${minutes}m ${seconds}s`;
      } else {
        element.textContent = `${seconds}s`;
      }
    }
  }
  
  // Función para actualizar los niveles de llenado de chanchitos
  function updatePiggyBankFills() {
    Object.keys(bankData).forEach(currency => {
      if (currency === 'activityLog' || currency === 'lastVisit' || currency === 'totalGains' || currency === 'firstVisit') return;
      updatePiggyBankFill(currency);
    });
  }
  
  function updatePiggyBankFill(currency) {
    const currencyData = bankData[currency];
    
    // Calcular porcentaje de llenado
    const fillPercentage = Math.min((currencyData.piggyCount / currencyData.maxPiggy) * 100, 100);
    
    // Aplicar al elemento
    const fillElement = document.getElementById(`fill${capitalizeFirst(currency)}`);
    if (fillElement) {
      fillElement.style.height = `${fillPercentage}%`;
    }
    
    // Actualizar display de monedas
    const coinDisplay = document.getElementById(`coin${capitalizeFirst(currency)}`);
    if (coinDisplay) {
      coinDisplay.textContent = currencyData.piggyCount;
    }
  }
  
  // Función para actualizar badges
  function updateBadges() {
    Object.keys(bankData).forEach(currency => {
      if (currency === 'activityLog' || currency === 'lastVisit' || currency === 'totalGains' || currency === 'firstVisit') return;
      updateBadge(currency);
    });
  }
  
  function updateBadge(currency) {
    const currencyData = bankData[currency];
    const badgeElement = document.getElementById(`badge${capitalizeFirst(currency)}`);
    
    if (badgeElement && currencyData.piggyCount > 0) {
      badgeElement.textContent = currencyData.piggyCount;
      badgeElement.classList.add('show');
    } else if (badgeElement) {
      badgeElement.classList.remove('show');
    }
  }
  
  // Función para configurar eventos
  function setupEventListeners() {
    // Botones de recolectar
    document.querySelectorAll('.btn-collect').forEach(button => {
      button.addEventListener('click', function() {
        const currency = this.getAttribute('data-currency');
        collectCurrency(currency);
      });
    });
    
    // Botón de recolectar todo
    document.getElementById('btnCollectAll').addEventListener('click', function() {
      collectAllCurrencies();
    });
    
    // Botones de filtro de registro
    document.getElementById('btnToday').addEventListener('click', function() {
      setActiveLogFilter('today');
      filterActivityLog('today');
    });
    
    document.getElementById('btnWeek').addEventListener('click', function() {
      setActiveLogFilter('week');
      filterActivityLog('week');
    });
    
    document.getElementById('btnMonth').addEventListener('click', function() {
      setActiveLogFilter('month');
      filterActivityLog('month');
    });
    
    // Botón de limpiar registro
    document.getElementById('btnClearLog').addEventListener('click', function() {
      if (confirm('¿Estás seguro de que quieres limpiar el registro de actividad? Esta acción no se puede deshacer.')) {
        bankData.activityLog = [];
        filterActivityLog('today');
        saveBankData();
        showNotification('Registro de actividad limpiado');
      }
    });
    
    // Puerta de la bóveda
    document.getElementById('vaultDoor').addEventListener('click', function() {
      openVault();
    });
    
    // Inicializar filtro "Hoy" como activo
    setActiveLogFilter('today');
  }
  
  // Función para actualizar estado de botones de recolección
  function updateCollectButtons() {
    let canCollectAny = false;
    
    Object.keys(bankData).forEach(currency => {
      if (currency === 'activityLog' || currency === 'lastVisit' || currency === 'totalGains' || currency === 'firstVisit') return;
      
      const currencyData = bankData[currency];
      const button = document.querySelector(`.btn-collect[data-currency="${currency}"]`);
      
      if (button) {
        if (currencyData.piggyCount > 0) {
          button.disabled = false;
          button.innerHTML = `<span class="btn-icon">🔄</span> Recolectar ${getCurrencyName(currency)} (${currencyData.piggyCount})`;
          canCollectAny = true;
        } else {
          button.disabled = true;
          button.innerHTML = `<span class="btn-icon">🔄</span> Recolectar ${getCurrencyName(currency)}`;
        }
      }
    });
    
    // Actualizar botón de recolectar todo
    const collectAllBtn = document.getElementById('btnCollectAll');
    if (collectAllBtn) {
      collectAllBtn.disabled = !canCollectAny;
    }
  }
  
  // Función para recolectar una moneda específica
  function collectCurrency(currency) {
    const currencyData = bankData[currency];
    
    if (currencyData.piggyCount <= 0) {
      showNotification(`No hay ${getCurrencyName(currency)} para recolectar`);
      return;
    }
    
    const collectedAmount = currencyData.piggyCount;
    currencyData.count += collectedAmount;
    currencyData.piggyCount = 0;
    bankData.totalGains += collectedAmount;
    
    // Actualizar visualización
    document.getElementById(`count${capitalizeFirst(currency)}`).textContent = currencyData.count;
    
    // Actualizar llenado del chanchito
    updatePiggyBankFill(currency);
    
    // Actualizar badge
    updateBadge(currency);
    
    // Animar el chanchito
    animatePiggyCollection(currency);
    
    // Registrar en actividad
    addToActivityLog(`${formatTime(new Date())} - Recolección: +${collectedAmount} ${getCurrencyName(currency)}`);
    
    // Mostrar animación de monedas
    animateCoinCollection(currency, collectedAmount);
    
    // Mostrar notificación
    showNotification(`¡Recolectaste ${collectedAmount} ${getCurrencyName(currency)}!`);
    
    // Actualizar estadísticas
    updateStatistics();
    
    // Guardar datos
    saveBankData();
  }
  
  // Función para recolectar todas las monedas
  function collectAllCurrencies() {
    let totalCollected = 0;
    const currenciesToCollect = [];
    
    Object.keys(bankData).forEach(currency => {
      if (currency === 'activityLog' || currency === 'lastVisit' || currency === 'totalGains' || currency === 'firstVisit') return;
      
      const currencyData = bankData[currency];
      if (currencyData.piggyCount > 0) {
        totalCollected += currencyData.piggyCount;
        currenciesToCollect.push({
          name: currency,
          amount: currencyData.piggyCount
        });
      }
    });
    
    if (totalCollected === 0) {
      showNotification('No hay monedas para recolectar');
      return;
    }
    
    // Recolectar cada moneda
    currenciesToCollect.forEach(item => {
      const currencyData = bankData[item.name];
      currencyData.count += item.amount;
      currencyData.piggyCount = 0;
      
      // Actualizar visualización
      document.getElementById(`count${capitalizeFirst(item.name)}`).textContent = currencyData.count;
      updatePiggyBankFill(item.name);
      updateBadge(item.name);
      animatePiggyCollection(item.name);
      
      // Registrar en actividad
      addToActivityLog(`${formatTime(new Date())} - Recolección: +${item.amount} ${getCurrencyName(item.name)}`);
    });
    
    bankData.totalGains += totalCollected;
    
    // Mostrar animación masiva
    animateMassiveCollection(currenciesToCollect);
    
    // Mostrar notificación
    showNotification(`¡Recolectaste ${totalCollected} monedas en total!`);
    
    // Actualizar estadísticas
    updateStatistics();
    
    // Guardar datos
    saveBankData();
  }
  
  // Función para animar la recolección del chanchito
  function animatePiggyCollection(currency) {
    const piggyElement = document.getElementById(`piggy${capitalizeFirst(currency)}`);
    if (piggyElement) {
      piggyElement.classList.add('piggy-shake');
      setTimeout(() => {
        piggyElement.classList.remove('piggy-shake');
      }, 500);
    }
  }
  
  // Función para animar la colección de monedas
  function animateCoinCollection(currency, amount) {
    const piggyElement = document.getElementById(`piggy${capitalizeFirst(currency)}`);
    if (!piggyElement) return;
    
    const rect = piggyElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Crear elementos de moneda
    const coinsToShow = Math.min(amount, 15); // Limitar a 15 monedas máximo
    
    for (let i = 0; i < coinsToShow; i++) {
      const coin = document.createElement('div');
      coin.className = 'coin-animation';
      coin.textContent = getCurrencySymbol(currency);
      coin.style.position = 'fixed';
      coin.style.left = `${centerX}px`;
      coin.style.top = `${centerY}px`;
      coin.style.fontSize = '1.5rem';
      coin.style.zIndex = '10000';
      coin.style.pointerEvents = 'none';
      coin.style.transform = 'translate(-50%, -50%)';
      
      // Añadir al documento
      document.body.appendChild(coin);
      
      // Animación
      const angle = (i / coinsToShow) * Math.PI * 2;
      const distance = 100 + Math.random() * 50;
      const targetX = centerX + Math.cos(angle) * distance;
      const targetY = centerY + Math.sin(angle) * distance;
      
      const animation = coin.animate([
        { 
          transform: 'translate(-50%, -50%) scale(1) rotate(0deg)', 
          opacity: 1 
        },
        { 
          transform: `translate(${targetX - centerX}px, ${targetY - centerY}px) scale(0.5) rotate(360deg)`, 
          opacity: 0 
        }
      ], {
        duration: 800 + Math.random() * 400,
        easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)'
      });
      
      // Eliminar después de la animación
      animation.onfinish = () => coin.remove();
    }
  }
  
  // Función para animar recolección masiva
  function animateMassiveCollection(currencies) {
    // Crear un efecto especial para recolección masiva
    const particles = document.createElement('div');
    particles.style.position = 'fixed';
    particles.style.top = '0';
    particles.style.left = '0';
    particles.style.width = '100%';
    particles.style.height = '100%';
    particles.style.zIndex = '9999';
    particles.style.pointerEvents = 'none';
    particles.style.opacity = '0';
    
    document.body.appendChild(particles);
    
    // Animación de aparición
    particles.animate([
      { opacity: 0 },
      { opacity: 1 }
    ], {
      duration: 300,
      fill: 'forwards'
    });
    
    // Crear partículas para cada tipo de moneda
    currencies.forEach(currencyItem => {
      const symbol = getCurrencySymbol(currencyItem.name);
      const particlesCount = Math.min(currencyItem.amount, 30);
      
      for (let i = 0; i < particlesCount; i++) {
        setTimeout(() => {
          const particle = document.createElement('div');
          particle.textContent = symbol;
          particle.style.position = 'fixed';
          particle.style.fontSize = '1.2rem';
          particle.style.zIndex = '10000';
          particle.style.pointerEvents = 'none';
          
          // Posición inicial aleatoria en la pantalla
          const startX = Math.random() * window.innerWidth;
          const startY = Math.random() * window.innerHeight;
          particle.style.left = `${startX}px`;
          particle.style.top = `${startY}px`;
          
          particles.appendChild(particle);
          
          // Animación hacia el centro
          const centerX = window.innerWidth / 2;
          const centerY = window.innerHeight / 2;
          
          particle.animate([
            { 
              transform: 'translate(0, 0) scale(1) rotate(0deg)', 
              opacity: 1 
            },
            { 
              transform: `translate(${centerX - startX}px, ${centerY - startY}px) scale(0) rotate(720deg)`, 
              opacity: 0 
            }
          ], {
            duration: 1000 + Math.random() * 500,
            easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)'
          });
          
          // Eliminar después de la animación
          setTimeout(() => {
            if (particle.parentNode) {
              particle.parentNode.removeChild(particle);
            }
          }, 1500);
        }, i * 30);
      }
    });
    
    // Eliminar contenedor después de un tiempo
    setTimeout(() => {
      particles.animate([
        { opacity: 1 },
        { opacity: 0 }
      ], {
        duration: 300,
        fill: 'forwards'
      }).onfinish = () => {
        if (particles.parentNode) {
          particles.parentNode.removeChild(particles);
        }
      };
    }, 2000);
  }
  
  // Función para configurar la puerta de la bóveda
  function setupVaultDoor() {
    const vaultDoor = document.getElementById('vaultDoor');
    
    // Añadir efecto de hover
    vaultDoor.addEventListener('mouseenter', function() {
      this.style.transform = 'scale(1.05) rotate(2deg)';
    });
    
    vaultDoor.addEventListener('mouseleave', function() {
      this.style.transform = 'scale(1) rotate(0deg)';
    });
  }
  
  // Función para abrir la bóveda
  function openVault() {
    const vaultDoor = document.getElementById('vaultDoor');
    
    // Animación de apertura
    vaultDoor.style.transform = 'scale(1.1) rotate(-15deg)';
    vaultDoor.style.boxShadow = '0 0 50px rgba(48, 209, 88, 0.8)';
    
    // Mostrar estadísticas al abrir la bóveda
    const totalWealth = bankData.esmeralda.count + bankData.cobre.count + 
                        bankData.oro.count + bankData.hierro.count + bankData.rapida.count;
    
    showNotification(`¡Bóveda abierta! Riqueza total: ${totalWealth} monedas`);
    
    // Reproducir sonido (simulado)
    playVaultSound();
    
    // Volver a la normalidad después de 2 segundos
    setTimeout(() => {
      vaultDoor.style.transform = 'scale(1) rotate(0deg)';
      vaultDoor.style.boxShadow = '';
    }, 2000);
  }
  
  // Función para simular sonido de bóveda
  function playVaultSound() {
    // En una implementación real, aquí cargarías un archivo de audio
    console.log('🔓 Sonido de bóveda abriéndose');
  }
  
  // Función para generar reporte diario
  function generateDailyReport() {
    const lastVisit = new Date(parseInt(bankData.lastVisit));
    const now = new Date();
    const timeSinceLastVisit = now - lastVisit;
    
    // Calcular ganancias desde la última visita
    let dailyGains = 0;
    Object.keys(bankData).forEach(currency => {
      if (currency === 'activityLog' || currency === 'lastVisit' || currency === 'totalGains' || currency === 'firstVisit') return;
      
      const rateMs = bankData[currency].rate * 1000;
      const gains = Math.floor(timeSinceLastVisit / rateMs);
      dailyGains += Math.min(gains, bankData[currency].maxPiggy);
    });
    
    // Actualizar reporte
    const reportElement = document.getElementById('dailyReport');
    if (dailyGains > 0) {
      reportElement.innerHTML = `
        <strong>¡Bienvenido de vuelta!</strong><br>
        Mientras estabas fuera has ganado <span style="color: var(--primary); font-weight: bold;">${dailyGains} monedas</span> automáticamente.
      `;
    } else if (timeSinceLastVisit > 60000) { // Más de 1 minuto
      const hoursSince = Math.floor(timeSinceLastVisit / (60 * 60 * 1000));
      const minutesSince = Math.floor((timeSinceLastVisit % (60 * 60 * 1000)) / (60 * 1000));
      
      reportElement.innerHTML = `
        <strong>¡Bienvenido al Banco Moonveil!</strong><br>
        Tus monedas están acumulándose automáticamente. La próxima ganancia está muy cerca.
      `;
    }
    
    // Actualizar última visita
    bankData.lastVisit = Date.now();
    localStorage.setItem('moonveilBankLastVisit', bankData.lastVisit);
  }
  
  // Función para cargar registro de actividad
  function loadActivityLog() {
    // Si no hay actividades, crear algunas de ejemplo
    if (bankData.activityLog.length === 0) {
      addToActivityLog(`${formatTime(new Date())} - ¡Bienvenido al Banco Moonveil! Tus monedas comenzarán a acumularse automáticamente.`);
    }
    
    // Mostrar actividades de hoy por defecto
    filterActivityLog('today');
  }
  
  // Función para filtrar registro de actividad
  function filterActivityLog(filter) {
    const logEntries = document.getElementById('logEntries');
    if (!logEntries) return;
    
    logEntries.innerHTML = '';
    
    const now = new Date();
    let filteredLog = [];
    
    if (filter === 'today') {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      filteredLog = bankData.activityLog.filter(entry => entry.time >= startOfToday);
    } else if (filter === 'week') {
      const startOfWeek = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)).getTime();
      filteredLog = bankData.activityLog.filter(entry => entry.time >= startOfWeek);
    } else if (filter === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      filteredLog = bankData.activityLog.filter(entry => entry.time >= startOfMonth);
    }
    
    // Limitar a 50 entradas
    filteredLog = filteredLog.slice(0, 50);
    
    // Mostrar entradas
    if (filteredLog.length === 0) {
      const emptyEntry = document.createElement('div');
      emptyEntry.className = 'log-entry';
      emptyEntry.innerHTML = `
        <div class="log-icon">📝</div>
        <div class="log-message" style="text-align: center; width: 100%; color: var(--muted);">
          No hay actividades en este período
        </div>
      `;
      logEntries.appendChild(emptyEntry);
    } else {
      filteredLog.forEach(entry => {
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        
        // Determinar icono basado en el tipo de actividad
        let icon = '💰';
        if (entry.message.includes('automática')) icon = '⚡';
        if (entry.message.includes('Recolección')) icon = '🔄';
        if (entry.message.includes('Bienvenido')) icon = '🏦';
        
        logEntry.innerHTML = `
          <div class="log-icon">${icon}</div>
          <div class="log-time">${formatTime(new Date(entry.time), true)}</div>
          <div class="log-message">${entry.message}</div>
        `;
        
        logEntries.appendChild(logEntry);
      });
    }
    
    // Hacer scroll al final
    logEntries.scrollTop = 0;
  }
  
  // Función para añadir al registro de actividad
  function addToActivityLog(message) {
    const newEntry = {
      time: Date.now(),
      message: message
    };
    
    // Añadir al principio del array
    bankData.activityLog.unshift(newEntry);
    
    // Mantener solo las últimas 200 entradas
    if (bankData.activityLog.length > 200) {
      bankData.activityLog = bankData.activityLog.slice(0, 200);
    }
    
    // Actualizar visualización si el filtro actual está activo
    const activeFilter = document.querySelector('.btn-log.active');
    if (activeFilter) {
      const filter = activeFilter.id === 'btnToday' ? 'today' : 
                    activeFilter.id === 'btnWeek' ? 'week' : 'month';
      filterActivityLog(filter);
    }
  }
  
  // Función para actualizar estadísticas
  function updateStatistics() {
    // Calcular riqueza total (recolectada)
    const totalWealth = bankData.esmeralda.count + bankData.cobre.count + 
                        bankData.oro.count + bankData.hierro.count + bankData.rapida.count;
    document.getElementById('totalWealth').textContent = totalWealth;
    
    // Calcular tiempo total desde primera visita
    const timeSinceFirst = Date.now() - bankData.firstVisit;
    const days = Math.floor(timeSinceFirst / (24 * 60 * 60 * 1000));
    const hours = Math.floor((timeSinceFirst % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    document.getElementById('totalTime').textContent = `${days}d ${hours}h`;
    
    // Ganancias totales
    document.getElementById('totalGains').textContent = bankData.totalGains;
    
    // Moneda favorita (la que más tiene recolectada)
    const currencies = [
      { name: 'Esmeralda', count: bankData.esmeralda.count },
      { name: 'Cobre', count: bankData.cobre.count },
      { name: 'Oro', count: bankData.oro.count },
      { name: 'Hierro', count: bankData.hierro.count },
      { name: 'Rápida', count: bankData.rapida.count }
    ];
    
    const favorite = currencies.reduce((prev, current) => 
      (prev.count > current.count) ? prev : current
    );
    
    document.getElementById('favCurrency').textContent = favorite.count > 0 ? favorite.name : '-';
  }
  
  // Función para guardar datos del banco
  function saveBankData() {
    const dataToSave = {
      esmeralda: { 
        count: bankData.esmeralda.count, 
        piggyCount: bankData.esmeralda.piggyCount,
        lastUpdate: bankData.esmeralda.lastUpdate
      },
      cobre: { 
        count: bankData.cobre.count, 
        piggyCount: bankData.cobre.piggyCount,
        lastUpdate: bankData.cobre.lastUpdate
      },
      oro: { 
        count: bankData.oro.count, 
        piggyCount: bankData.oro.piggyCount,
        lastUpdate: bankData.oro.lastUpdate
      },
      hierro: { 
        count: bankData.hierro.count, 
        piggyCount: bankData.hierro.piggyCount,
        lastUpdate: bankData.hierro.lastUpdate
      },
      rapida: { 
        count: bankData.rapida.count, 
        piggyCount: bankData.rapida.piggyCount,
        lastUpdate: bankData.rapida.lastUpdate
      },
      activityLog: bankData.activityLog,
      totalGains: bankData.totalGains,
      firstVisit: bankData.firstVisit,
      lastSave: Date.now()
    };
    
    localStorage.setItem('moonveilBankData', JSON.stringify(dataToSave));
  }
  
  // Función para mostrar notificación
  function showNotification(message) {
    // Crear toast si no existe
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.classList.add('show');
    
    // Eliminar después de 3 segundos
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
  
  // Función para establecer filtro de registro activo
  function setActiveLogFilter(filter) {
    // Remover clase active de todos los botones
    document.querySelectorAll('.btn-log').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Añadir clase active al botón correspondiente
    let buttonId = 'btnToday';
    if (filter === 'week') buttonId = 'btnWeek';
    if (filter === 'month') buttonId = 'btnMonth';
    
    const button = document.getElementById(buttonId);
    if (button) {
      button.classList.add('active');
    }
  }
  
  // Funciones de utilidad
  function capitalizeFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  
  function getCurrencyName(currency) {
    const names = {
      esmeralda: 'Esmeralda',
      cobre: 'Lingote de Cobre',
      oro: 'Pepita de Oro',
      hierro: 'Pepita de Hierro',
      rapida: 'Pepita Rápida'
    };
    return names[currency] || currency;
  }
  
  function getCurrencySymbol(currency) {
    const symbols = {
      esmeralda: '💎',
      cobre: '🟫',
      oro: '🟨',
      hierro: '⬜',
      rapida: '⚡'
    };
    return symbols[currency] || '💰';
  }
  
  function formatTime(date, showDate = false) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    
    if (showDate) {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    
    return `${hours}:${minutes}:${seconds}`;
  }
  
  // Añadir estilos para toast si no existen en inicio.css
  if (!document.querySelector('#banco-toast-styles')) {
    const style = document.createElement('style');
    style.id = 'banco-toast-styles';
    style.textContent = `
      .toast {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: var(--primary);
        color: #061009;
        padding: 12px 24px;
        border-radius: 12px;
        box-shadow: var(--shadow), 0 5px 15px rgba(0,0,0,0.3);
        z-index: 10000;
        font-weight: bold;
        text-align: center;
        min-width: 300px;
        max-width: 90%;
        opacity: 0;
        transition: transform 0.3s var(--bezier), opacity 0.3s var(--bezier);
        pointer-events: none;
      }
      
      .toast.show {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
      }
      
      .coin-animation {
        animation: coinFloat 1s ease-out forwards;
      }
      
      @keyframes coinFloat {
        0% {
          transform: translate(-50%, -50%) scale(1) rotate(0deg);
          opacity: 1;
        }
        100% {
          transform: translate(var(--tx, 0), var(--ty, -100px)) scale(0) rotate(360deg);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Guardar datos iniciales
  saveBankData();
});