/* Moonveil Portal - JavaScript FINAL */

document.addEventListener('DOMContentLoaded', () => {
  
  // ===== CONFIGURACIÓN DE MÚSICA =====
  // ¡AQUÍ PUEDES PONER LA RUTA DE TU MÚSICA!
  const MUSIC_PATH = 'music/1.mp3'; 
  
  // ===== DATOS =====
  const DEMO_ACCOUNTS = [
    { email: 'alex@moonveil.dev', password: 'Alex-1234!' },
    { email: 'marta@moonveil.dev', password: 'Marta-1234!' },
    { email: 'ramiro@moonveil.dev', password: 'Ramiro-1234!' },
    { email: 'petunia@moonveil.dev', password: 'Petunia-1234!' },
    { email: 'guido@moonveil.dev', password: 'Guido-1234!' },
    { email: 'almond@moonveil.dev', password: 'Almond2011' },
    { email: 'magician@moonveil.dev', password: 'Magician2011' },
    { email: 'gatito@moonveil.dev', password: 'gatitos1' },
  ];

  const EVENTS = [
    { 
      icon: '🎯', 
      title: 'Banco a la vista', 
      description: 'CLos cerditos esperan ser llenados', 
      time: 'Permanente ∞',
      status: 'Activo'
    },
    /*{ 
      icon: '⚔️', 
      title: 'Torneo PvP', 
      description: 'Compite contra otros jugadores en batallas épicas', 
      time: 'Termina en 12 horas',
      status: 'En curso'
    },
    { 
      icon: '🎁', 
      title: 'Recompensas Dobles', 
      description: 'Gana el doble de puntos durante el fin de semana', 
      time: 'Termina en 2 días',
      status: 'Activo'
    },*/
  ];

  const GALLERY = [
    'img-pass/fox-xy.jpg',
    
  ];

  const TIPS = [
    'Un aldeano sin esmeraldas es como un creeper sin chispa. Yo tengo ambos... y el monopolio.',
    'El tiempo es esmeralda, y yo soy el reloj... un Rolex de diamantes brillantes.',
    'Una vez traté de intercambiar con el destino. Me salió con descuento triple.',
    'No soy arrogante. El sol brilla menos desde que aparecí, es física básica.',
    'El sabio construye con madera. El legendario... contrata a Sand Brill.',
    'Las esmeraldas no compran felicidad... pero sí mi respeto eterno. Elige sabiamente.',
  ];

  // ===== MÚSICA DE FONDO =====
  const musicPlayer = document.getElementById('musicPlayer');
  const musicBtn = document.getElementById('musicBtn');
  let audio = null;
  let isPlaying = false;

  // Crear el audio
  if (MUSIC_PATH && MUSIC_PATH !== 'ruta/a/tu/musica.mp3') {
    audio = new Audio(MUSIC_PATH);
    audio.loop = true;
    audio.volume = 0.3;
    
    // Click para play/pause
    musicBtn?.addEventListener('click', () => {
      if (isPlaying) {
        audio.pause();
        isPlaying = false;
        musicPlayer.classList.remove('playing');
      } else {
        audio.play().catch(err => {
          console.error('Error al reproducir:', err);
          showToast('error', 'Error', 'No se pudo reproducir la música');
        });
        isPlaying = true;
        musicPlayer.classList.add('playing');
      }
    });
  } else {
    // Si no hay música configurada, deshabilitar el botón
    if (musicBtn) {
      musicBtn.style.opacity = '0.5';
      musicBtn.style.cursor = 'not-allowed';
      musicBtn.addEventListener('click', () => {
        showToast('info', 'Sin música', 'C-line 8');
      });
    }
  }

  // ===== PARTICLES CANVAS =====
  const canvas = document.getElementById('particlesCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    const particles = [];
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        r: Math.random() * 2.5 + 0.5
      });
    }

    function animate() {
      ctx.clearRect(0, 0, w, h);
      
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(48, 209, 88, 0.6)';
        ctx.fill();
        
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'rgba(48, 209, 88, 0.8)';
      });
      
      requestAnimationFrame(animate);
    }

    animate();

    window.addEventListener('resize', () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    });
  }

  // ===== RELOJ =====
  function updateTime() {
    const now = new Date();
    const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: false };
    const dateOptions = { weekday: 'long', day: 'numeric', month: 'long' };
    const time = now.toLocaleTimeString('es-ES', timeOptions);
    const date = now.toLocaleDateString('es-ES', dateOptions);
    const capitalized = date.charAt(0).toUpperCase() + date.slice(1);
    document.getElementById('headerTime').textContent = `${time} • ${capitalized}`;
  }
  updateTime();
  setInterval(updateTime, 1000);

  // ===== FORM =====
  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const togglePassword = document.getElementById('togglePassword');
  const btnLogin = document.getElementById('btnLogin');
  const strengthMeter = document.getElementById('strengthMeter');
  const strengthProgress = document.getElementById('strengthProgress');
  const strengthText = document.getElementById('strengthText');

  // Toggle password
  togglePassword?.addEventListener('click', () => {
    if (!passwordInput) return;
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    togglePassword.classList.toggle('active');
  });

  // Email validation
  function validateEmail() {
    if (!emailInput) return false;
    const value = emailInput.value.trim();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    
    const errorEl = document.querySelector('[data-error="email"]');
    const checkEl = emailInput.parentElement.querySelector('.input-check');
    
    if (errorEl) errorEl.textContent = valid || !value ? '' : 'Email inválido';
    if (checkEl) checkEl.classList.toggle('show', valid);
    
    return valid;
  }

  // Password strength
  function checkPasswordStrength() {
    if (!passwordInput || !strengthMeter) return;
    
    const value = passwordInput.value;
    
    if (value.length === 0) {
      strengthMeter.classList.remove('active');
      return;
    }
    
    strengthMeter.classList.add('active');
    
    let strength = 0;
    if (value.length >= 8) strength++;
    if (/[a-z]/.test(value)) strength++;
    if (/[A-Z]/.test(value)) strength++;
    if (/\d/.test(value)) strength++;
    if (/[^a-zA-Z0-9]/.test(value)) strength++;
    
    const percent = (strength / 5) * 100;
    const labels = ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Muy fuerte'];
    
    if (strengthProgress) strengthProgress.style.width = percent + '%';
    if (strengthText) strengthText.textContent = labels[strength - 1] || 'Muy débil';
  }

  function validatePassword() {
    if (!passwordInput) return false;
    const valid = passwordInput.value.length >= 8;
    const errorEl = document.querySelector('[data-error="password"]');
    if (errorEl) errorEl.textContent = valid || !passwordInput.value ? '' : 'Mínimo 8 caracteres';
    return valid;
  }

  emailInput?.addEventListener('input', validateEmail);
  passwordInput?.addEventListener('input', () => {
    checkPasswordStrength();
    validatePassword();
  });

  // ===== DEMO ACCOUNTS =====
  const demoList = document.getElementById('demoList');
  if (demoList) {
    DEMO_ACCOUNTS.forEach(acc => {
      const item = document.createElement('div');
      item.className = 'demo-item';
      item.innerHTML = `
        <div>
          <div class="demo-email">${acc.email}</div>
          <div class="demo-pass">${acc.password}</div>
        </div>
        <div class="demo-btn">Usar</div>
      `;
      
      item.addEventListener('click', () => {
        if (emailInput) {
          emailInput.value = acc.email;
          emailInput.dispatchEvent(new Event('input'));
        }
        if (passwordInput) {
          passwordInput.value = acc.password;
          passwordInput.dispatchEvent(new Event('input'));
        }
        showToast('success', '¡Listo!', 'Credenciales cargadas correctamente');
      });
      
      demoList.appendChild(item);
    });
  }

  // ===== FORM SUBMIT =====
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    if (!validateEmail() || !validatePassword()) {
      showToast('error', 'Error', 'Completa todos los campos correctamente');
      return;
    }
    
    const validAccount = DEMO_ACCOUNTS.find(
      acc => acc.email === emailInput.value.trim() && acc.password === passwordInput.value
    );
    
    if (!validAccount) {
      showToast('error', 'Error', 'Credenciales incorrectas');
      return;
    }
    
    btnLogin.classList.add('loading');
    btnLogin.disabled = true;
    
    setTimeout(() => {
      window.location.href = 'inicio.html';
    }, 1500);
  });

  // ===== ACTIVE EVENTS =====
  const eventsList = document.getElementById('eventsList');
  if (eventsList) {
    EVENTS.forEach((event, index) => {
      const item = document.createElement('div');
      item.className = 'event-item';
      item.style.animationDelay = `${index * 0.1}s`;
      item.innerHTML = `
        <div class="event-icon">${event.icon}</div>
        <div class="event-content">
          <div class="event-title">${event.title}</div>
          <div class="event-description">${event.description}</div>
          <div class="event-time">⏰ ${event.time}</div>
        </div>
        <div class="event-status">${event.status}</div>
      `;
      eventsList.appendChild(item);
    });
  }

  // ===== GALLERY ENHANCED =====
  let currentGalleryIndex = 0;
  const galleryMain = document.getElementById('galleryMain');
  const galleryThumbs = document.getElementById('galleryThumbs');

  function renderGallery() {
    if (!galleryMain || !galleryThumbs) return;
    
    // Main image
    galleryMain.innerHTML = '';
    GALLERY.forEach((img, i) => {
      const mainImg = document.createElement('img');
      mainImg.src = img;
      mainImg.alt = `Imagen ${i + 1}`;
      mainImg.className = 'gallery-main-img' + (i === currentGalleryIndex ? ' active' : '');
      galleryMain.appendChild(mainImg);
    });
    
    // Thumbnails
    galleryThumbs.innerHTML = '';
    GALLERY.forEach((img, i) => {
      const thumb = document.createElement('div');
      thumb.className = 'gallery-thumb' + (i === currentGalleryIndex ? ' active' : '');
      thumb.innerHTML = `<img src="${img}" alt="Miniatura ${i + 1}">`;
      thumb.addEventListener('click', () => {
        currentGalleryIndex = i;
        renderGallery();
      });
      galleryThumbs.appendChild(thumb);
    });
  }

  renderGallery();

  // Auto-rotate gallery
  setInterval(() => {
    currentGalleryIndex = (currentGalleryIndex + 1) % GALLERY.length;
    renderGallery();
  }, 5000);

  // ===== TIPS ENHANCED =====
  const tipEnhanced = document.getElementById('tipEnhanced');
  const newTipBtn = document.getElementById('newTipBtn');

  function showRandomTip() {
    const randomTip = TIPS[Math.floor(Math.random() * TIPS.length)];
    if (tipEnhanced) {
      const tipText = tipEnhanced.querySelector('.tip-text');
      if (tipText) {
        tipText.style.opacity = '0';
        setTimeout(() => {
          tipText.textContent = `"${randomTip}"`;
          tipText.style.opacity = '1';
        }, 200);
      }
    }
  }

  showRandomTip();
  newTipBtn?.addEventListener('click', () => {
    showRandomTip();
    const svg = newTipBtn.querySelector('svg');
    if (svg) {
      svg.style.transform = 'rotate(360deg)';
      setTimeout(() => {
        svg.style.transform = 'rotate(0deg)';
      }, 500);
    }
  });

  // ===== LINKS =====
  document.getElementById('forgotLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    showToast('info', 'Recuperar contraseña', 'Esta función estará disponible próximamente');
  });

  document.getElementById('signupLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    showToast('info', 'Crear cuenta', 'El registro estará disponible próximamente');
  });

  document.querySelectorAll('[data-provider]').forEach(btn => {
    btn.addEventListener('click', () => {
      const provider = btn.getAttribute('data-provider');
      const name = provider.charAt(0).toUpperCase() + provider.slice(1);
      showToast('info', 'OAuth', `Autenticación con ${name} próximamente`);
    });
  });

  // ===== TOAST =====
  let toastTimer;
  function showToast(type, title, message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    const toastIcon = document.getElementById('toastIcon');
    const toastTitle = document.getElementById('toastTitle');
    const toastMessage = document.getElementById('toastMessage');
    
    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    
    if (toastIcon) {
      toastIcon.textContent = icons[type] || icons.info;
      toastIcon.className = `toast-icon ${type}`;
    }
    if (toastTitle) toastTitle.textContent = title;
    if (toastMessage) toastMessage.textContent = message;
    
    toast.classList.add('show');
    
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  }

  document.getElementById('toastClose')?.addEventListener('click', () => {
    document.getElementById('toast')?.classList.remove('show');
    clearTimeout(toastTimer);
  });

  window.showToast = showToast;

  console.log('🚀 Moonveil Portal - Sistema iniciado correctamente');
});