/* =========================================================
   Moonveil Social — Instagram-style JavaScript
   ========================================================= */

const $ = (q, ctx = document) => ctx.querySelector(q);
const $$ = (q, ctx = document) => Array.from(ctx.querySelectorAll(q));

/* =========================================================
   Navbar responsive
   ========================================================= */
const navToggle = $('#navToggle');
const navLinks = $('#navLinks');

navToggle?.addEventListener('click', (e) => {
  e.stopPropagation();
  navLinks.classList.toggle('open');
});

document.addEventListener('click', (e) => {
  if (!navToggle?.contains(e.target) && !navLinks?.contains(e.target)) {
    navLinks?.classList.remove('open');
  }
});

/* =========================================================
   HUD Bars
   ========================================================= */
(function setHudBars() {
  $$('.hud-bar').forEach(b => {
    const v = +b.dataset.val || 50;
    b.style.setProperty('--v', v);
  });
})();

/* =========================================================
   Partículas de fondo
   ========================================================= */
(function particles() {
  const c = $('#bgParticles');
  if (!c) return;

  const ctx = c.getContext('2d');
  const dpi = Math.max(1, devicePixelRatio || 1);
  let w, h, parts;

  const init = () => {
    w = c.width = innerWidth * dpi;
    h = c.height = innerHeight * dpi;
    parts = new Array(80).fill(0).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: (1 + Math.random() * 2) * dpi,
      s: 0.2 + Math.random(),
      a: 0.15 + Math.random() * 0.35
    }));
  };

  const tick = () => {
    ctx.clearRect(0, 0, w, h);
    parts.forEach(p => {
      p.y += p.s;
      p.x += Math.sin(p.y * 0.002) * 0.35;
      if (p.y > h) {
        p.y = -10;
        p.x = Math.random() * w;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(135,243,157,${p.a})`;
      ctx.fill();
    });
    requestAnimationFrame(tick);
  };

  init();
  tick();
  addEventListener('resize', init);
})();

/* =========================================================
   Parallax
   ========================================================= */
(function parallax() {
  const layers = $$('.layer');
  if (!layers.length) return;

  const k = [0, 0.03, 0.06, 0.1];
  const onScroll = () => {
    const y = scrollY || 0;
    layers.forEach((el, i) => {
      el.style.transform = `translateY(${y * k[i]}px)`;
    });
  };

  onScroll();
  addEventListener('scroll', onScroll, { passive: true });
})();

/* =========================================================
   DATASET - Usuarios y Posts
   ========================================================= */
const users = [
  {
    id: 'u1',
    name: 'Sand Brill',
    username: '@sand_trader',
    avatar: 'vill/vill1.jpg',
    online: true,
    followers: 1247,
    kind: 'options',
    quickReplies: ['¿Hola?', 'Esmeraldas', 'Tradear'],
    brain: {
      options: [
        { label: '¿Hola?', reply: 'Hola! ¿Tienes esmeraldas para tradear?' },
        { label: 'Esmeraldas', reply: 'Me encantan! Son mi obsesión 💎' },
        { label: 'Tradear', reply: 'Siempre estoy listo para un buen trato!' },
        { label: 'Hola', reply: 'Hola, qué tal!' },
        { label: 'Bien', reply: 'Genial! Ahora dame esmeraldas jaja' },
        { label: 'Lobo', reply: 'Runa es el mejor lobo del mundo!' }
      ],
      fallback: 'Mmm... No entiendo, pero hablemos de esmeraldas!'
    }
  },
  {
    id: 'u2',
    name: 'Eduard Moss',
    username: '@granjero_moss',
    avatar: 'vill/villplains.jpg',
    online: true,
    followers: 892,
    kind: 'keyword',
    quickReplies: ['Agricultura', 'Libros', 'Semillas'],
    brain: {
      keywords: {
        'Agricultura': 'La agricultura es mi pasión, colega!',
        'Libros': 'Tengo algunos libros interesantes del pasado...',
        'Semillas': 'Las semillas son el origen de todo!',
        'Hola': 'Hola colega, cómo estás?',
        'Bien': 'Me alegro mucho!',
        'Mal': 'No te pongas así, siempre hay esperanza.',
        'Polen': 'Mi gato Polen es el mejor cazador de la granja!'
      },
      fallback: 'Interesante, colega. Cuéntame más!'
    }
  },
  {
    id: 'u3',
    name: 'Orik Vall',
    username: '@cartografo_orik',
    avatar: 'vill/cartografo.jpg',
    online: true,
    followers: 1056,
    kind: 'keyword',
    quickReplies: ['Mapas', 'Exploración', 'Misterios'],
    brain: {
      keywords: {
        'Mapas': 'Los mapas son mi especialidad, my friend!',
        'Exploración': 'Me encanta explorar nuevos lugares!',
        'Misterios': 'Hay muchos misterios en los mapas antiguos...',
        'Hola': 'Hola my friend! Cómo estás?',
        '2012': 'Ese caso es muy extraño...',
        'Desconocido': 'Hay lugares que aparecen y desaparecen...'
      },
      fallback: 'Interesante observación, my friend!'
    }
  },
  {
    id: 'u4',
    name: 'Steven Moss',
    username: '@bibliotecario_s',
    avatar: 'vill/bibliotecario.jpg',
    online: false,
    followers: 743,
    kind: 'keyword',
    quickReplies: ['Libros', 'Escribir', 'Historias'],
    brain: {
      keywords: {
        'Libros': 'Los libros son portales a otros mundos!',
        'Escribir': 'Escribir es mi mayor pasión!',
        'Historias': 'Cada historia tiene algo especial...',
        'Hola': 'Hola! Qué libro estás leyendo?',
        'Rosa': 'Ah, una novela medieval fascinante...'
      },
      fallback: 'Déjame pensar en eso...'
    }
  },
  {
    id: 'u5',
    name: 'David Kal',
    username: '@davidcito',
    avatar: 'img/babyvillager.jpg',
    online: true,
    followers: 2134,
    kind: 'options',
    quickReplies: ['Hola', 'Dibujar', 'Amigo'],
    brain: {
      options: [
        { label: 'Hola', reply: 'Hola colegita! Cómo estás?' },
        { label: 'Bien', reply: 'Qué bien colegita!' },
        { label: 'Mal', reply: 'No te pongas mal colegita, eres increíble!' },
        { label: 'Dibujar', reply: 'Me encanta dibujar! Es mi pasión!' },
        { label: 'Amigo', reply: 'Sí colegita, somos amigos! 😊' },
        { label: 'Alex', reply: 'Alex es mi lobo favorito!' }
      ],
      fallback: 'Colegita, no entendí pero está bien!'
    }
  },
  {
    id: 'u6',
    name: 'News Villager',
    username: '@news_today',
    avatar: 'gif/news-villager.gif',
    online: true,
    followers: 5678,
    kind: 'options',
    quickReplies: ['Noticias', 'Golem', 'Minecraft'],
    brain: {
      options: [
        { label: 'Noticias', reply: 'Hmm... Aquí con las últimas noticias!' },
        { label: 'Golem', reply: 'El golem está en día libre hoy...' },
        { label: 'Minecraft', reply: 'El mundo de bloques más increíble!' },
        { label: 'Hola', reply: 'Hmm... Saludos!' }
      ],
      fallback: 'Hmm... No tengo esa noticia aún.'
    }
  },
  {
    id: 'u7',
    name: 'Guau Wolf',
    username: '@el_mas_perron',
    avatar: 'vill/photowolf.jpg',
    online: true,
    followers: 3421,
    kind: 'options',
    quickReplies: ['Guau', 'Lobo', 'Perron'],
    brain: {
      options: [
        { label: 'Guau', reply: 'Guau! 🐺' },
        { label: 'Guau?', reply: 'Guau guau!' },
        { label: 'Lobo', reply: 'Auuuuu!' },
        { label: 'Perron', reply: 'Guau! Soy el más perron! 😎' },
        { label: 'Hola', reply: 'Guau guau!' }
      ],
      fallback: 'Guau!'
    }
  }
];

const posts = [
  {
    id: 'p1',
    userId: 'u1',
    image: 'vill/vill1.jpg',
    text: 'Nuevo día, nuevas esmeraldas! 💎✨ Quien quiera tradear que me hable! #Esmeraldas #Trading #MinecraftLife',
    likes: 0,
    verified: true,
    comments: [
      { userId: 'u5', text: 'Qué bonita foto colegita! 😊 Me encanta el brillo!', time: 'Hace 2h' },
      { userId: 'u2', text: 'Buen trading, colega! Siempre con las mejores esmeraldas!', time: 'Hace 1h' },
      { userId: 'u3', text: 'Esas esmeraldas se ven de calidad, my friend!', time: 'Hace 45min' }
    ],
    time: 'Hace 3 horas',
    timestamp: Date.now() - 3 * 60 * 60 * 1000
  },
  {
    id: 'p2',
    userId: 'u5',
    image: 'dav/happyg2.jpg',
    text: 'Mi nuevo dibujo colegitas! Me esforcé mucho 🎨✏️ Espero que les guste! #Arte #Dibujo #MinecraftArt',
    likes: 0,
    verified: false,
    comments: [
      { userId: 'u1', text: 'Está increíble! Tienes mucho talento! 🌟', time: 'Hace 30min' },
      { userId: 'u3', text: 'Muy bonito, my friend! Sigue así!', time: 'Hace 15min' },
      { userId: 'u7', text: 'Guau! Está genial colegita!', time: 'Hace 10min' }
    ],
    time: 'Hace 1 hora',
    timestamp: Date.now() - 1 * 60 * 60 * 1000
  },
  {
    id: 'p3',
    userId: 'u2',
    image: 'vill/villplains.jpg',
    text: 'La cosecha de hoy fue excelente! 🌾🥕 La agricultura es vida, colegas! #Agricultura #Farming #VidaSana',
    likes: 0,
    verified: false,
    comments: [
      { userId: 'u4', text: 'Hermosa cosecha, Eduard! La agricultura es un arte!', time: 'Hace 45min' },
      { userId: 'u5', text: 'Que bonitas zanahorias colegita!', time: 'Hace 30min' }
    ],
    time: 'Hace 5 horas',
    timestamp: Date.now() - 5 * 60 * 60 * 1000
  },
  {
    id: 'p4',
    userId: 'u3',
    image: 'vill/cartografo.jpg',
    text: 'Descubrí un nuevo territorio inexplorado! 🗺️🧭 Los mapas nunca mienten... o sí? #Exploración #Mapas #Aventura',
    likes: 0,
    verified: true,
    comments: [
      { userId: 'u2', text: 'Increíble descubrimiento, my friend!', time: 'Hace 1h' }
    ],
    time: 'Hace 2 horas',
    timestamp: Date.now() - 2 * 60 * 60 * 1000
  },
  {
    id: 'p5',
    userId: 'u7',
    image: 'vill/photowolf.jpg',
    text: 'Guau guau! Auuuuu! 🐺 Soy el más perron de mi cuadra! #Lobo #Perron #WolfLife',
    likes: 0,
    verified: false,
    comments: [
      { userId: 'u5', text: 'Jajaja eres genial! 🐺 El más perron!', time: 'Hace 20min' },
      { userId: 'u1', text: 'El lobo más cool! Auuuu!', time: 'Hace 10min' },
      { userId: 'u6', text: 'Hmm... Noticia de última hora: Lobo se vuelve viral!', time: 'Hace 5min' }
    ],
    time: 'Hace 30 minutos',
    timestamp: Date.now() - 30 * 60 * 1000
  },
  {
    id: 'p6',
    userId: 'u6',
    image: 'gif/news-minecraft.gif',
    text: 'Hmm... Última hora: Aldeano encuentra diamantes! Pero era lapislázuli 💎😅 #Noticias #MinecraftNews #Fails',
    likes: 0,
    verified: true,
    comments: [
      { userId: 'u2', text: 'Jajaja clásico error! Le pasa a todos!', time: 'Hace 1h' },
      { userId: 'u7', text: 'Guau! Qué chistoso!', time: 'Hace 45min' }
    ],
    time: 'Hace 6 horas',
    timestamp: Date.now() - 6 * 60 * 60 * 1000
  },
  {
    id: 'p7',
    userId: 'u4',
    image: 'vill/bibliotecario.jpg',
    text: 'Escribiendo nuevas historias... 📚✍️ La imaginación no tiene límites! #Escritura #Libros #Creatividad',
    likes: 0,
    verified: false,
    comments: [
      { userId: 'u3', text: 'Esperando leer tus historias, my friend!', time: 'Hace 2h' }
    ],
    time: 'Hace 4 horas',
    timestamp: Date.now() - 4 * 60 * 60 * 1000
  },
  {
    id: 'p8',
    userId: 'u1',
    image: 'img/ajolote.gif',
    text: 'Encontré este ajolote! Es tan cute! 🌸💕 Alguien sabe cómo cuidarlo? #Ajolote #Cute #Mascotas',
    likes: 0,
    verified: true,
    comments: [
      { userId: 'u5', text: 'Awww es hermoso colegita! Yo quiero uno!', time: 'Hace 25min' },
      { userId: 'u2', text: 'Los ajolotes necesitan agua limpia, colega!', time: 'Hace 15min' }
    ],
    time: 'Hace 7 horas',
    timestamp: Date.now() - 7 * 60 * 60 * 1000
  },
  {
    id: 'p9',
    userId: 'u3',
    image: 'imagen/panda2.gif',
    text: 'Los pandas son lo mejor! 🐼🎍 Relax y bambú, la vida perfecta! #Panda #Relax #Nature',
    likes: 0,
    verified: true,
    comments: [
      { userId: 'u5', text: 'Los pandas son adorables colegita!', time: 'Hace 3h' }
    ],
    time: 'Hace 8 horas',
    timestamp: Date.now() - 8 * 60 * 60 * 1000
  },
  {
    id: 'p10',
    userId: 'u5',
    image: 'dav/steve2.jpg',
    text: 'Steve es mi héroe! 🗡️⛏️ Algún día seré tan valiente como él! #Steve #Héroe #Inspiración',
    likes: 0,
    verified: false,
    comments: [
      { userId: 'u7', text: 'Guau! Steve es genial! Es el mejor!', time: 'Hace 1h' },
      { userId: 'u1', text: 'Steve es legendario! Todos lo admiramos!', time: 'Hace 40min' }
    ],
    time: 'Hace 9 horas',
    timestamp: Date.now() - 9 * 60 * 60 * 1000
  }
];

/* =========================================================
   Sistema de likes graduales (más realista)
   ========================================================= */
function startGradualLikes() {
  setInterval(() => {
    posts.forEach(post => {
      // Probabilidad de recibir un like (más reciente = más probabilidad)
      const hoursSincePost = (Date.now() - post.timestamp) / (1000 * 60 * 60);
      let probability = 0.15; // 15% base
      
      if (hoursSincePost < 1) probability = 0.4; // 40% si es muy reciente
      else if (hoursSincePost < 3) probability = 0.25; // 25% si es reciente
      else if (hoursSincePost < 6) probability = 0.15; // 15% si es medio reciente
      
      if (Math.random() < probability) {
        post.likes++;
        localStorage.setItem(`post_${post.id}_likes`, post.likes);
        
        // Actualizar UI si el post está visible
        const postElement = $(`.post[data-post="${post.id}"]`);
        if (postElement) {
          const likeBtn = postElement.querySelector('.like-btn span:last-child');
          const likesText = postElement.querySelector('.post-likes');
          if (likeBtn) likeBtn.textContent = post.likes;
          if (likesText) likesText.innerHTML = `${post.likes} Me gusta`;
        }
      }
    });
  }, 8000 + Math.random() * 7000); // Entre 8-15 segundos
}

/* =========================================================
   Estado global y LocalStorage
   ========================================================= */
let currentPage = 1;
const postsPerPage = 3;
let userFollowers = parseInt(localStorage.getItem('userFollowers')) || 247;
let likedPosts = JSON.parse(localStorage.getItem('likedPosts')) || {};
let currentChatUser = null;

// Inicializar likes de posts desde localStorage
posts.forEach(post => {
  post.likes = parseInt(localStorage.getItem(`post_${post.id}_likes`)) || 0;
});

/* =========================================================
   Utilidades
   ========================================================= */
function escape(s) {
  return String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function toast(msg) {
  const toastEl = $('#toast');
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastEl._id);
  toastEl._id = setTimeout(() => toastEl.classList.remove('show'), 2000);
}

function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Hace unos segundos';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days}d`;
}

function formatHashtags(text) {
  return escape(text).replace(/#(\w+)/g, '<span class="hashtag" data-tag="$1">#$1</span>');
}

/* =========================================================
   Incremento de seguidores aleatorio
   ========================================================= */
function increaseFollowers() {
  const chance = Math.random();
  if (chance < 0.3) { // 30% de probabilidad
    const increase = Math.floor(Math.random() * 3) + 1; // 1-3 seguidores
    userFollowers += increase;
    localStorage.setItem('userFollowers', userFollowers);
    $('#userFollowers').textContent = userFollowers;
    toast(`+${increase} nuevo${increase > 1 ? 's' : ''} seguidor${increase > 1 ? 'es' : ''}! 🎉`);
  }
}

// Incremento cada 30-60 segundos
setInterval(increaseFollowers, (30 + Math.random() * 30) * 1000);

/* =========================================================
   Render Sugerencias
   ========================================================= */
function renderSuggestions() {
  const container = $('#suggestions');
  const suggested = users.slice(0, 4);
  
  container.innerHTML = suggested.map(u => `
    <div class="suggestion-item" data-user="${u.id}">
      <div class="suggestion-avatar">
        <img src="${u.avatar}" alt="${escape(u.name)}" />
      </div>
      <div class="suggestion-info">
        <div class="suggestion-name">${escape(u.name)}</div>
        <div class="suggestion-followers">${u.followers} seguidores</div>
      </div>
    </div>
  `).join('');

  $$('.suggestion-item').forEach(el => {
    el.addEventListener('click', () => {
      const userId = el.dataset.user;
      openChat(userId);
    });
  });
}

/* =========================================================
   Render Tendencias
   ========================================================= */
function renderTrending() {
  const container = $('#trending');
  const tags = [
    { tag: 'Esmeraldas', posts: '234 posts' },
    { tag: 'MinecraftLife', posts: '189 posts' },
    { tag: 'Trading', posts: '156 posts' },
    { tag: 'Agricultura', posts: '142 posts' },
    { tag: 'Exploración', posts: '98 posts' }
  ];

  container.innerHTML = tags.map(t => `
    <div class="trending-item" data-tag="${t.tag}">
      <div class="trending-tag">#${t.tag}</div>
      <div class="trending-posts">${t.posts}</div>
    </div>
  `).join('');

  $$('.trending-item').forEach(el => {
    el.addEventListener('click', () => {
      const tag = el.dataset.tag;
      toast(`Mostrando posts con #${tag}`);
    });
  });
}

/* =========================================================
   Render Stories
   ========================================================= */
function renderStories() {
  const container = $('#storiesScroll');
  container.innerHTML = users.map(u => `
    <div class="story-item">
      <div class="story-ring ${Math.random() > 0.5 ? 'seen' : ''}">
        <div class="story-avatar">
          <img src="${u.avatar}" alt="${escape(u.name)}" />
        </div>
      </div>
      <div class="story-name">${escape(u.name.split(' ')[0])}</div>
    </div>
  `).join('');
}

/* =========================================================
   Render Posts con paginación
   ========================================================= */
function renderPosts() {
  const container = $('#postsContainer');
  const sortedPosts = [...posts].sort((a, b) => b.timestamp - a.timestamp);
  
  const startIndex = (currentPage - 1) * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  const pagePosts = sortedPosts.slice(startIndex, endIndex);

  container.innerHTML = pagePosts.map(post => {
    const user = users.find(u => u.id === post.userId);
    const isLiked = likedPosts[post.id] || false;
    const verifiedBadge = post.verified ? '<span class="verified-badge" title="Verificado">✓</span>' : '';
    
    return `
      <article class="post" data-post="${post.id}">
        <div class="post-header">
          <div class="post-user" data-user="${user.id}">
            <div class="post-avatar">
              <img src="${user.avatar}" alt="${escape(user.name)}" />
            </div>
            <div class="post-user-info">
              <div class="post-username">
                ${escape(user.name)}
                ${verifiedBadge}
              </div>
              <div class="post-time">${post.time}</div>
            </div>
          </div>
          <button class="post-menu" title="Más opciones">⋯</button>
        </div>
        
        <div class="post-image" data-image="${post.image}">
          <img src="${post.image}" alt="Post" loading="lazy" />
        </div>
        
        <div class="post-actions">
          <button class="action-btn like-btn ${isLiked ? 'liked' : ''}" data-post="${post.id}" title="${isLiked ? 'Ya no me gusta' : 'Me gusta'}">
            <span>${isLiked ? '❤️' : '🤍'}</span>
            <span>${post.likes}</span>
          </button>
          <button class="action-btn comment-btn" data-post="${post.id}" title="Ver comentarios">
            <span>💬</span>
            <span>${post.comments.length}</span>
          </button>
          <button class="action-btn share-btn" title="Compartir">
            <span>📤</span>
          </button>
        </div>
        
        <div class="post-content">
          ${post.likes > 0 ? `<div class="post-likes">${post.likes} Me gusta</div>` : ''}
          <div class="post-text">
            <strong>${escape(user.name)}</strong> ${formatHashtags(post.text)}
          </div>
          ${post.comments.length > 0 ? 
            `<div class="view-comments" data-post="${post.id}">
              Ver los ${post.comments.length} comentario${post.comments.length > 1 ? 's' : ''}
            </div>` : 
            '<div class="view-comments muted">Sé el primero en comentar</div>'
          }
        </div>
      </article>
    `;
  }).join('');

  // Event listeners
  $$('.like-btn').forEach(btn => {
    btn.addEventListener('click', () => handleLike(btn.dataset.post));
  });

  $$('.comment-btn, .view-comments').forEach(btn => {
    btn.addEventListener('click', () => {
      const postId = btn.dataset.post || btn.closest('.post').dataset.post;
      openComments(postId);
    });
  });

  $$('.post-user, .post-avatar').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const userId = el.dataset.user || el.closest('.post-user').dataset.user;
      openChat(userId);
    });
  });

  $$('.post-image').forEach(el => {
    el.addEventListener('click', () => openImageModal(el.dataset.image));
  });

  $$('.share-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      toast('Post compartido! 📤');
      // Simular compartir incrementando likes
      setTimeout(() => {
        const post = posts.find(p => p.id === btn.closest('.post').dataset.post);
        if (post) {
          post.likes += Math.floor(Math.random() * 3) + 1;
          localStorage.setItem(`post_${post.id}_likes`, post.likes);
          renderPosts();
        }
      }, 500);
    });
  });

  $$('.post-menu').forEach(btn => {
    btn.addEventListener('click', () => {
      toast('Opciones del post');
    });
  });

  $$('.hashtag').forEach(tag => {
    tag.addEventListener('click', (e) => {
      e.stopPropagation();
      toast(`Mostrando posts con #${tag.dataset.tag}`);
    });
  });

  updatePagination();
}

/* =========================================================
   Paginación
   ========================================================= */
function updatePagination() {
  const totalPages = Math.ceil(posts.length / postsPerPage);
  $('#pageInfo').textContent = `Página ${currentPage} de ${totalPages}`;
  $('#prevPage').disabled = currentPage === 1;
  $('#nextPage').disabled = currentPage === totalPages;
}

$('#prevPage')?.addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    renderPosts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

$('#nextPage')?.addEventListener('click', () => {
  const totalPages = Math.ceil(posts.length / postsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderPosts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

/* =========================================================
   Like de posts
   ========================================================= */
function handleLike(postId) {
  const post = posts.find(p => p.id === postId);
  if (!post) return;

  const isLiked = likedPosts[postId] || false;
  
  if (isLiked) {
    post.likes = Math.max(0, post.likes - 1);
    delete likedPosts[postId];
  } else {
    post.likes++;
    likedPosts[postId] = true;
  }

  localStorage.setItem(`post_${postId}_likes`, post.likes);
  localStorage.setItem('likedPosts', JSON.stringify(likedPosts));
  
  renderPosts();
  
  if (!isLiked) {
    toast('❤️ Te gusta este post!');
  }
}

/* =========================================================
   Modal de comentarios mejorado
   ========================================================= */
function openComments(postId) {
  const post = posts.find(p => p.id === postId);
  if (!post) return;

  const user = users.find(u => u.id === post.userId);
  const modal = $('#commentsModal');
  const body = $('#commentsBody');
  const isLiked = likedPosts[postId] || false;

  // Imagen del post
  $('#commentsPostImage').src = post.image;
  
  // Usuario del post
  $('#commentsUserAvatar').src = user.avatar;
  $('#commentsUserName').textContent = user.name;
  
  // Likes y tiempo
  $('#commentsLikesCount').innerHTML = `<strong>${post.likes}</strong> Me gusta`;
  $('#commentsTime').textContent = post.time.toUpperCase();

  // Botón de like del modal
  const likeBtn = $('#commentsLikeBtn');
  const heartIcon = likeBtn.querySelector('.heart-icon');
  heartIcon.textContent = isLiked ? '❤️' : '🤍';
  likeBtn.className = isLiked ? 'action-icon-btn liked' : 'action-icon-btn';
  
  likeBtn.onclick = () => {
    handleLike(postId);
    const newLiked = likedPosts[postId] || false;
    heartIcon.textContent = newLiked ? '❤️' : '🤍';
    likeBtn.className = newLiked ? 'action-icon-btn liked' : 'action-icon-btn';
    $('#commentsLikesCount').innerHTML = `<strong>${post.likes}</strong> Me gusta`;
  };

  // Comentarios
  if (post.comments.length === 0) {
    body.innerHTML = `
      <div style="text-align:center;padding:40px 20px;color:var(--muted);">
        <div style="font-size:3rem;margin-bottom:12px;">💬</div>
        <h4 style="margin:0 0 8px;color:var(--text);">Sin comentarios aún</h4>
        <p style="font-size:0.9rem;">Sé el primero en comentar</p>
      </div>
    `;
  } else {
    body.innerHTML = post.comments.map(c => {
      const commentUser = users.find(u => u.id === c.userId);
      return `
        <div class="comment">
          <div class="comment-avatar">
            <img src="${commentUser.avatar}" alt="${escape(commentUser.name)}" />
          </div>
          <div class="comment-content">
            <div class="comment-header">
              <span class="comment-user">${escape(commentUser.name)}</span>
              <span class="comment-time">${c.time}</span>
            </div>
            <div class="comment-text">${escape(c.text)}</div>
            <div class="comment-actions">
              <span class="comment-action">Me gusta</span>
              <span class="comment-action">Responder</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Añadir event listeners a las acciones de comentarios
    $$('.comment-action', body).forEach(action => {
      action.addEventListener('click', () => {
        toast(action.textContent === 'Me gusta' ? '❤️ Te gusta este comentario' : '💬 Responder no disponible');
      });
    });
  }

  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

$('#closeComments')?.addEventListener('click', closeCommentsModal);
$('#commentsOverlay')?.addEventListener('click', closeCommentsModal);

function closeCommentsModal() {
  const modal = $('#commentsModal');
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

/* =========================================================
   Modal de imagen
   ========================================================= */
function openImageModal(imageSrc) {
  const modal = $('#imageModal');
  $('#modalImage').src = imageSrc;
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
}

$('#closeImage')?.addEventListener('click', closeImageModal);
$('#imageOverlay')?.addEventListener('click', closeImageModal);

function closeImageModal() {
  const modal = $('#imageModal');
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
}

/* =========================================================
   Render DM List
   ========================================================= */
function renderDMList() {
  const container = $('#dmList');
  const dmUsers = users.filter(u => u.online).slice(0, 5);

  container.innerHTML = dmUsers.map(u => `
    <div class="dm-item" data-user="${u.id}">
      <div class="dm-avatar ${u.online ? 'online' : ''}">
        <img src="${u.avatar}" alt="${escape(u.name)}" />
      </div>
      <div class="dm-info">
        <div class="dm-name">${escape(u.name)}</div>
        <div class="dm-last">Toca para chatear</div>
      </div>
      ${Math.random() > 0.7 ? '<span class="dm-badge">1</span>' : ''}
    </div>
  `).join('');

  $$('.dm-item').forEach(el => {
    el.addEventListener('click', () => openChat(el.dataset.user));
  });
}

/* =========================================================
   Chat Privado Mejorado
   ========================================================= */
function openChat(userId) {
  const user = users.find(u => u.id === userId);
  if (!user) return;

  currentChatUser = user;
  const modal = $('#chatModal');
  
  $('#chatUserAvatar').src = user.avatar;
  $('#chatUserName').textContent = user.name;
  
  // Estado online/offline
  const statusDot = $('.status-dot', modal);
  const statusText = $('#chatStatusText');
  if (user.online) {
    statusDot.classList.remove('offline');
    statusText.textContent = 'En línea';
  } else {
    statusDot.classList.add('offline');
    statusText.textContent = 'Desconectado';
  }
  
  // Mensaje de bienvenida
  $('#chatBody').innerHTML = `
    <div class="chat-welcome">
      <div class="chat-welcome-avatar">
        <img src="${user.avatar}" alt="${escape(user.name)}" />
      </div>
      <h4>${escape(user.name)}</h4>
      <p style="margin-bottom:16px;">${escape(user.username)}</p>
      <p style="font-size:0.9rem;">
        ${user.followers} seguidores · ${user.online ? 'Activo ahora' : 'Desconectado'}
      </p>
      <p style="margin-top:12px;font-size:0.85rem;">
        Escribe un mensaje o usa las respuestas rápidas abajo
      </p>
    </div>
  `;

  renderQuickReplies(user);
  
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  
  setTimeout(() => $('#chatInput').focus(), 300);
}

function renderQuickReplies(user) {
  const container = $('#chatQuickReplies');
  if (!user.quickReplies || user.quickReplies.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = user.quickReplies.map(reply => 
    `<button class="quick-reply-btn" data-text="${escape(reply)}">${escape(reply)}</button>`
  ).join('');

  $$('.quick-reply-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sendChatMessage(btn.dataset.text);
    });
  });
}

// Llamadas simuladas
$('#chatVideoCall')?.addEventListener('click', () => {
  toast('📹 Iniciando videollamada...');
  setTimeout(() => toast('❌ El usuario no está disponible'), 1500);
});

$('#chatCall')?.addEventListener('click', () => {
  toast('📞 Iniciando llamada...');
  setTimeout(() => toast('❌ El usuario no puede atender'), 1500);
});

$('#chatEmoji')?.addEventListener('click', () => toast('😊 Panel de emojis - Próximamente'));
$('#chatGif')?.addEventListener('click', () => toast('GIF Panel de GIFs - Próximamente'));

$('#chatComposer')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const input = $('#chatInput');
  const text = input.value.trim();
  if (!text || !currentChatUser) return;
  
  sendChatMessage(text);
  input.value = '';
});

function sendChatMessage(text) {
  if (!currentChatUser) return;

  const body = $('#chatBody');
  
  // Limpiar mensaje de bienvenida si existe
  const welcome = body.querySelector('.chat-welcome');
  if (welcome) welcome.remove();
  
  // Mensaje del usuario
  appendChatMessage('me', text);

  // Mostrar typing
  showTyping();

  // Respuesta del bot
  setTimeout(() => {
    hideTyping();
    const reply = computeChatReply(currentChatUser, text);
    appendChatMessage('peer', reply);
  }, 800 + Math.random() * 1200);
}

function appendChatMessage(sender, text) {
  const body = $('#chatBody');
  const user = currentChatUser;
  
  const msg = document.createElement('div');
  msg.className = `chat-message ${sender}`;
  
  const time = new Date().toLocaleTimeString('es-PE', {hour:'2-digit',minute:'2-digit'});
  const statusIcon = sender === 'me' ? '<span class="message-status"></span>' : '';
  
  if (sender === 'me') {
    msg.innerHTML = `
      <div class="chat-message-avatar">
        <img src="img/imper.jpg" alt="Tú" />
      </div>
      <div class="chat-bubble">
        <div class="chat-text">${escape(text)}</div>
        <div class="chat-meta">${time} ${statusIcon}</div>
      </div>
    `;
  } else {
    msg.innerHTML = `
      <div class="chat-message-avatar">
        <img src="${user.avatar}" alt="${escape(user.name)}" />
      </div>
      <div class="chat-bubble">
        <div class="chat-text">${escape(text)}</div>
        <div class="chat-meta">${time}</div>
      </div>
    `;
  }
  
  body.appendChild(msg);
  body.scrollTop = body.scrollHeight;
}

function showTyping() {
  const body = $('#chatBody');
  const typing = document.createElement('div');
  typing.className = 'typing-indicator';
  typing.id = 'typingIndicator';
  typing.innerHTML = `
    <span class="typing-dot"></span>
    <span class="typing-dot"></span>
    <span class="typing-dot"></span>
  `;
  body.appendChild(typing);
  body.scrollTop = body.scrollHeight;
}

function hideTyping() {
  $('#typingIndicator')?.remove();
}

function computeChatReply(user, text) {
  const t = text.toLowerCase();

  if (user.kind === 'options') {
    const opt = user.brain.options.find(o => o.label.toLowerCase() === t);
    return opt ? opt.reply : (user.brain.fallback || 'Interesante...');
  }

  if (user.kind === 'keyword') {
    for (const pattern in user.brain.keywords) {
      const re = new RegExp(`\\b(${pattern})\\b`, 'i');
      if (re.test(t)) return user.brain.keywords[pattern];
    }
    return user.brain.fallback || 'No entiendo, pero gracias por escribir!';
  }

  return 'Gracias por tu mensaje!';
}

$('#closeChat')?.addEventListener('click', closeChatModal);
$('#chatOverlay')?.addEventListener('click', closeChatModal);

function closeChatModal() {
  const modal = $('#chatModal');
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  currentChatUser = null;
}

/* =========================================================
   Música de fondo
   ========================================================= */
window.toggleMusic = function () {
  const audio = $('#bg-music');
  const musicButton = $('.floating-music');

  if (audio && musicButton) {
    if (audio.paused) {
      audio.play().then(() => {
        musicButton.classList.add('active');
        localStorage.setItem('music', 'on');
      }).catch(err => {
        console.warn('No se pudo reproducir la música:', err);
      });
    } else {
      audio.pause();
      musicButton.classList.remove('active');
      localStorage.setItem('music', 'off');
    }
  }
};

window.addEventListener('DOMContentLoaded', () => {
  const audio = $('#bg-music');
  const musicButton = $('.floating-music');
  const musicState = localStorage.getItem('music');

  if (audio && musicButton && musicState === 'on') {
    audio.play().then(() => {
      musicButton.classList.add('active');
    }).catch(() => {
      console.log('Esperando interacción del usuario para reproducir.');
    });
  }
});

/* =========================================================
   Inicialización
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  renderSuggestions();
  renderTrending();
  renderStories();
  renderPosts();
  renderDMList();
  
  $('#userFollowers').textContent = userFollowers;
  
  // Iniciar sistema de likes graduales
  startGradualLikes();
  
  console.log('🎮 Moonveil Social cargado!');
  console.log('📊 Total de posts:', posts.length);
  console.log('👥 Total de usuarios:', users.length);
  console.log('💚 Sistema de likes graduales activado!');
});

// Cerrar modales con ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeCommentsModal();
    closeChatModal();
    closeImageModal();
  }
});