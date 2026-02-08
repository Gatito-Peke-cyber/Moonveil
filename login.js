/* ==========================================================================
   Moonveil Portal - DISEÑO COMPLETAMENTE NUEVO
   JavaScript para diseño futurista centrado
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  
  /* ===== DATOS ===== */
  const THOUGHTS = [
    { text: 'Un aldeano sin esmeraldas es como un creeper sin chispa.', author: 'Sand Brill' },
    { text: 'El tiempo no es oro... es esmeralda, y yo soy el reloj.', author: 'Sand Brill' },
    { text: 'No soy arrogante, el sol brilla menos desde que aparecí.', author: 'Sand Brill' },
    { text: 'El sabio construye con madera, el legendario con mis ideas.', author: 'Sand Brill' },
    { text: 'Los golems se cuadran. No es respeto... es temor económico.', author: 'Sand Brill' },
  ];

  const GALLERY = [
    { title: 'Zorrito aventurero', img: 'img-pass/fox-xy.jpg' },
    { title: 'Luna brillante', img: 'imagen/moon1.jpg' },
    { title: 'Gato contemplativo', img: 'img-pass/catmoon.jpg' },
    { title: 'Lobo lunar', img: 'imagen/dogmin.jpg' },
    { title: 'Explorador perdido', img: 'img-pass/mapsteve.jpg' },
    { title: 'Compañero Allay', img: 'img-pass/allayworld.jpg' }
  ];

  const TIPS = [
    '¿Casa de tierra? Perfecto... si quieres vivir como una papa.',
    'Las esmeraldas no compran felicidad, pero sí mi respeto.',
    'No temas a los zombis, teme a mis precios.',
    'Minería sin antorchas: valiente o torpe, no sabría decir.',
    'El éxito: tradea conmigo. El fracaso: no hacerlo.',
  ];

  const DEMO_CREDS = [
    { email: 'alex@moonveil.dev', password: 'Alex-1234!' },
    { email: 'marta@moonveil.dev', password: 'Marta-1234!' },
    { email: 'ramiro@moonveil.dev', password: 'Ramiro-1234!' },
    { email: 'petunia@moonveil.dev', password: 'Petunia-1234!' },
    { email: 'guido@moonveil.dev', password: 'Guido-1234!' },
    { email: 'almond@moonveil.dev', password: 'Almond2011' },
    { email: 'magician@moonveil.dev', password: 'Magician2011' },
    { email: 'gatito@moonveil.dev', password: 'gatitos1' },
  ];

  /* ===== ESTRELLAS ===== */
  const starsLayer = document.getElementById('starsLayer');
  if (starsLayer) {
    for (let i = 0; i < 50; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      star.style.animationDelay = Math.random() * 4 + 's';
      starsLayer.appendChild(star);
    }
  }

  /* ===== AURORA CANVAS ===== */
  const auroraCanvas = document.getElementById('auroraCanvas');
  if (auroraCanvas) {
    const ctx = auroraCanvas.getContext('2d');
    let w, h;

    function resize() {
      w = auroraCanvas.width = window.innerWidth;
      h = auroraCanvas.height = window.innerHeight;
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      
      const gradient = ctx.createLinearGradient(0, 0, w, h);
      gradient.addColorStop(0, 'rgba(48, 209, 88, 0.05)');
      gradient.addColorStop(0.5, 'rgba(56, 189, 248, 0.03)');
      gradient.addColorStop(1, 'rgba(48, 209, 88, 0.05)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
      
      requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    draw();
  }

  /* ===== WIDGET: PENSAMIENTOS ===== */
  let thoughtIndex = 0;
  const thoughtDisplay = document.getElementById('thoughtDisplay');
  const thoughtDots = document.getElementById('thoughtDots');
  const thoughtPrev = document.getElementById('thoughtPrev');
  const thoughtNext = document.getElementById('thoughtNext');

  function renderThought() {
    if (!thoughtDisplay) return;
    const thought = THOUGHTS[thoughtIndex];
    thoughtDisplay.innerHTML = `
      <p class="thought-text">${thought.text}</p>
      <div class="thought-author">— ${thought.author}</div>
    `;
    
    if (thoughtDots) {
      thoughtDots.innerHTML = '';
      THOUGHTS.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.className = 'thought-dot' + (i === thoughtIndex ? ' active' : '');
        dot.addEventListener('click', () => {
          thoughtIndex = i;
          renderThought();
        });
        thoughtDots.appendChild(dot);
      });
    }
  }

  if (thoughtPrev) {
    thoughtPrev.addEventListener('click', () => {
      thoughtIndex = (thoughtIndex - 1 + THOUGHTS.length) % THOUGHTS.length;
      renderThought();
    });
  }

  if (thoughtNext) {
    thoughtNext.addEventListener('click', () => {
      thoughtIndex = (thoughtIndex + 1) % THOUGHTS.length;
      renderThought();
    });
  }

  renderThought();
  setInterval(() => {
    thoughtIndex = (thoughtIndex + 1) % THOUGHTS.length;
    renderThought();
  }, 6000);

  /* ===== WIDGET: GALERÍA ===== */
  let galleryIndex = 0;
  const holoGallery = document.getElementById('holoGallery');
  const galleryInfo = document.getElementById('galleryInfo');

  function renderGallery() {
    if (!holoGallery) return;
    
    holoGallery.innerHTML = '';
    GALLERY.forEach((item, i) => {
      const img = document.createElement('img');
      img.src = item.img;
      img.alt = item.title;
      img.className = 'gallery-image' + (i === galleryIndex ? ' active' : '');
      holoGallery.appendChild(img);
    });

    if (galleryInfo) {
      galleryInfo.innerHTML = `<span class="gallery-title">${GALLERY[galleryIndex].title} (${galleryIndex + 1}/${GALLERY.length})</span>`;
    }
  }

  renderGallery();
  setInterval(() => {
    galleryIndex = (galleryIndex + 1) % GALLERY.length;
    renderGallery();
  }, 4000);

  /* ===== WIDGET: CONSEJO MÁGICO ===== */
  const magicTip = document.getElementById('magicTip');
  const revealTip = document.getElementById('revealTip');

  if (revealTip) {
    revealTip.addEventListener('click', () => {
      const randomTip = TIPS[Math.floor(Math.random() * TIPS.length)];
      
      if (magicTip) {
        magicTip.classList.add('revealing');
        setTimeout(() => {
          magicTip.innerHTML = `
            <div class="tip-shimmer"></div>
            <p class="tip-content">${randomTip}</p>
          `;
          magicTip.classList.remove('revealing');
        }, 500);
      }
    });
  }

  /* ===== FORMULARIO ===== */
  const form = document.getElementById('portalForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const togglePassword = document.getElementById('togglePassword');
  const capsWarning = document.getElementById('capsWarning');
  const submitButton = document.getElementById('submitButton');
  const gaugeCircle = document.getElementById('gaugeCircle');
  const gaugeText = document.getElementById('gaugeText');

  // Toggle password
  if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', () => {
      const type = passwordInput.type === 'password' ? 'text' : 'password';
      passwordInput.type = type;
    });
  }

  // Caps lock
  if (passwordInput && capsWarning) {
    passwordInput.addEventListener('keydown', (e) => {
      if (e.getModifierState && e.getModifierState('CapsLock')) {
        capsWarning.classList.add('active');
      } else {
        capsWarning.classList.remove('active');
      }
    });
  }

  // Password strength
  if (passwordInput && gaugeCircle && gaugeText) {
    passwordInput.addEventListener('input', () => {
      const value = passwordInput.value;
      let score = 0;
      
      if (value.length >= 8) score++;
      if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
      if (/\d/.test(value)) score++;
      if (/[^a-zA-Z0-9]/.test(value)) score++;

      const percent = (score / 4) * 100;
      const offset = 283 - (283 * percent / 100);
      gaugeCircle.style.strokeDashoffset = offset;

      const labels = ['Débil', 'Media', 'Buena', 'Fuerte'];
      gaugeText.textContent = value.length > 0 ? labels[score - 1] || '-' : '-';
    });
  }

  // Validación
  function validateEmail() {
    if (!emailInput) return false;
    const value = emailInput.value.trim();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    
    const error = document.querySelector('[data-error="email"]');
    if (error) error.textContent = valid ? '' : 'Email inválido';
    
    return valid;
  }

  function validatePassword() {
    if (!passwordInput) return false;
    const valid = passwordInput.value.length >= 8;
    
    const error = document.querySelector('[data-error="password"]');
    if (error) error.textContent = valid ? '' : 'Mínimo 8 caracteres';
    
    return valid;
  }

  if (emailInput) {
    emailInput.addEventListener('blur', validateEmail);
  }

  if (passwordInput) {
    passwordInput.addEventListener('blur', validatePassword);
  }

  // Submit
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      if (!validateEmail() || !validatePassword()) {
        showToast('error', 'Error', 'Completa todos los campos correctamente');
        return;
      }

      const emailVal = emailInput.value.trim();
      const passVal = passwordInput.value;

      const valid = DEMO_CREDS.find(c => c.email === emailVal && c.password === passVal);
      
      if (!valid) {
        showToast('error', 'Acceso denegado', 'Credenciales incorrectas');
        return;
      }

      // Loading
      submitButton.classList.add('loading');
      const particles = document.getElementById('buttonParticles');
      if (particles) {
        particles.innerHTML = '';
        for (let i = 0; i < 6; i++) {
          const p = document.createElement('div');
          p.className = 'particle';
          p.style.left = 20 + i * 10 + '%';
          p.style.animationDelay = i * 0.1 + 's';
          particles.appendChild(p);
        }
      }

      setTimeout(() => {
        window.location.href = 'inicio.html';
      }, 1500);
    });
  }

  /* ===== DEMO ACCOUNTS ===== */
  const demoTrigger = document.getElementById('demoTrigger');
  const demoPanel = document.getElementById('demoPanel');

  if (demoTrigger && demoPanel) {
    demoTrigger.addEventListener('click', () => {
      demoPanel.classList.toggle('active');
    });

    const grid = document.createElement('div');
    grid.className = 'demo-grid';
    
    DEMO_CREDS.forEach(cred => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'demo-item';
      item.innerHTML = `
        <div class="demo-item-info">
          <div class="demo-email">${cred.email}</div>
          <div class="demo-pass">${cred.password}</div>
        </div>
        <div class="demo-use">Usar</div>
      `;
      item.addEventListener('click', () => {
        if (emailInput) emailInput.value = cred.email;
        if (passwordInput) passwordInput.value = cred.password;
        demoPanel.classList.remove('active');
        showToast('success', 'Listo', 'Credenciales cargadas');
        
        // Trigger validation
        if (emailInput) emailInput.dispatchEvent(new Event('blur'));
        if (passwordInput) {
          passwordInput.dispatchEvent(new Event('input'));
          passwordInput.dispatchEvent(new Event('blur'));
        }
      });
      grid.appendChild(item);
    });
    
    demoPanel.appendChild(grid);
  }

  /* ===== LINKS ===== */
  const forgotLink = document.getElementById('forgotLink');
  if (forgotLink) {
    forgotLink.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('info', 'Función no disponible', 'Recuperación de contraseña próximamente');
    });
  }

  const createLink = document.getElementById('createLink');
  if (createLink) {
    createLink.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('info', 'Próximamente', 'Registro de cuentas próximamente');
    });
  }

  // OAuth
  document.querySelectorAll('[data-provider]').forEach(btn => {
    btn.addEventListener('click', () => {
      const provider = btn.getAttribute('data-provider');
      showToast('info', 'OAuth', `Autenticación con ${provider} próximamente`);
    });
  });

  /* ===== TOAST SYSTEM ===== */
  let toastTimer;
  function showToast(type, title, message) {
    const toast = document.getElementById('quantumToast');
    if (!toast) return;

    const iconEl = document.getElementById('toastIcon');
    const titleEl = document.getElementById('toastTitle');
    const messageEl = document.getElementById('toastMessage');

    const icons = {
      success: '✓',
      error: '✕',
      info: 'ℹ',
      warning: '⚠'
    };

    if (iconEl) iconEl.textContent = icons[type] || icons.info;
    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.textContent = message;

    toast.classList.add('show');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);

    const dismiss = document.getElementById('toastDismiss');
    if (dismiss) {
      dismiss.onclick = () => {
        toast.classList.remove('show');
        clearTimeout(toastTimer);
      };
    }
  }

  console.log('🌙 Moonveil Portal - Sistema iniciado');
});