/* ================================================================
   Moonveil Portal — Contactos v3
   Pixel aesthetic · Firebase realtime · All bugs fixed
   ================================================================ */
import { auth, db, storage } from './firebase.js';
import {
  doc, getDoc, setDoc, addDoc, updateDoc,
  collection, onSnapshot, query, orderBy, limit,
  serverTimestamp, arrayUnion
} from 'https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js';
import { ref as sRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/12.10.0/firebase-storage.js';

/* ── Minimal title lookup (mirrors perfil.js) ── */
const TITLES_MAP = {
  tl_novato:{name:'NOVATO',rarity:'comun'},tl_explorador:{name:'EXPLORADOR',rarity:'comun'},
  tl_combatiente:{name:'COMBATIENTE',rarity:'raro'},tl_guerrero:{name:'GUERRERO',rarity:'raro'},
  tl_elite:{name:'ÉLITE',rarity:'epico'},tl_campeon:{name:'CAMPEÓN',rarity:'epico'},
  tl_maestro:{name:'MAESTRO',rarity:'legendario'},tl_leyenda:{name:'LEYENDA DEL PORTAL',rarity:'mitico'},
  tl_constante:{name:'CONSTANTE',rarity:'comun'},tl_perseverante:{name:'PERSEVERANTE',rarity:'raro'},
  tl_incansable:{name:'INCANSABLE',rarity:'legendario'},tl_cazador:{name:'CAZADOR',rarity:'comun'},
  tl_coleccionista:{name:'COLECCIONISTA',rarity:'raro'},tl_supremo_col:{name:'SUPREMO COLECCIONISTA',rarity:'legendario'},
  tl_aventurero:{name:'AVENTURERO',rarity:'comun'},tl_veterano:{name:'VETERANO DE GUERRA',rarity:'raro'},
  tl_sdc:{name:'SEÑOR DE LA GUERRA',rarity:'epico'},tl_rico:{name:'ADINERADO',rarity:'raro'},
  tl_magnate:{name:'MAGNATE DEL XP',rarity:'epico'},tl_dios:{name:'DIOS DEL PORTAL',rarity:'mitico'},
  tl_oscuro:{name:'SEÑOR OSCURO',rarity:'legendario'},tl_eterno:{name:'GUERRERO ETERNO',rarity:'legendario'},
  tl_absoluto:{name:'EL ABSOLUTO',rarity:'mitico'},tl_nexo_caos:{name:'NEXO DEL CAOS',rarity:'mitico'},
  tl_pionero_mar2026:{name:'PIONERO DE LUNA',rarity:'especial'},
};

/* ── Helpers ── */
const $ = (q, c = document) => c.querySelector(q);
const $$ = (q, c = document) => [...c.querySelectorAll(q)];
function esc(s) { return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function timeNow() { return new Intl.DateTimeFormat('es-PE',{hour:'2-digit',minute:'2-digit'}).format(new Date()); }
function timeAgo(iso) {
  if (!iso) return '—';
  const d = Date.now() - new Date(iso).getTime();
  if (d < 60000) return 'ahora';
  if (d < 3600000) return `hace ${Math.floor(d/60000)}m`;
  if (d < 86400000) return `hace ${Math.floor(d/3600000)}h`;
  return `hace ${Math.floor(d/86400000)}d`;
}
function formatText(s) {
  return esc(String(s)).replace(/\n/g,'<br>').replace(/(https?:\/\/[^\s<&]+)/g,'<a href="$1" target="_blank" rel="noopener">$1</a>');
}
function getChatId(a, b) { return [a,b].sort().join('_'); }
function lsGet(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }

/* ── Settings ── */
const S_KEY = 'mv_chat_settings';
const S_DEF = {
  sound:true, badge:true, fontSize:'normal', wallpaper:'default',
  compact:false, enterSend:true, lastSeen:true, readReceipts:true,
  storyVisibility:'friends', profileName:'', statusMsg:'Aqui en mi World', emojiAvatar:'🌙'
};
function getS() { try { return {...S_DEF,...JSON.parse(localStorage.getItem(S_KEY)||'{}')}; } catch { return {...S_DEF}; } }
function saveS(s) { localStorage.setItem(S_KEY, JSON.stringify(s)); applySettings(s); }
function applySettings(s = getS()) {
  const sz = s.fontSize==='small' ? '0.9rem' : s.fontSize==='large' ? '1.15rem' : '1rem';
  document.documentElement.style.setProperty('--msg-font', sz);
  const t = $('#thread');
  if (!t) return;
  t.className = 'chat-thread' + (s.compact ? ' compact' : '');
  const wps = {
    default:'', green:'wp-green', purple:'wp-purple', blue:'wp-blue', dark:'wp-dark'
  };
  if (wps[s.wallpaper]) t.classList.add(wps[s.wallpaper]);
}

/* ── Toast ── */
function toast(msg, type = '') {
  const t = $('#toast'); if (!t) return;
  t.textContent = msg; t.className = `show ${type}`;
  clearTimeout(t._t); t._t = setTimeout(() => t.className = '', 2400);
}

/* ── Stars animation (same as perfil.js) ── */
function initStars() {
  const c = $('#stars-canvas'); if (!c) return;
  const ctx = c.getContext('2d'), dpi = Math.max(1, devicePixelRatio||1);
  const COLS = ['#30d158','#40ff6e','#ffffff','#00e5ff','#f5c518'];
  let W, H, stars;
  const init = () => {
    W = c.width = innerWidth*dpi; H = c.height = innerHeight*dpi;
    stars = Array.from({length:120}, () => ({
      x:Math.random()*W, y:Math.random()*H,
      r:Math.random()*1.4+0.4, o:Math.random()*.45+.08,
      s:Math.random()*.3+.07, ci:Math.floor(Math.random()*COLS.length)
    }));
  };
  const tick = () => {
    ctx.clearRect(0,0,W,H);
    stars.forEach(s => {
      s.y -= s.s;
      if (s.y < 0) { s.y = H; s.x = Math.random()*W; }
      ctx.globalAlpha = s.o;
      ctx.fillStyle = COLS[s.ci];
      ctx.fillRect(s.x, s.y, s.r, s.r);
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(tick);
  };
  init(); tick();
  addEventListener('resize', init);
}

/* ── BOT DATA ── */
const BOTS = [
  {id:'c1',name:'Sand Brill',alias:'███████',desc:'Hola, tienes esmeraldas para darme.',avatar:'vill/vill1.jpg',aType:'img',gold:true,online:true,unread:2,kind:'options',qr:['¿Hola?','E11-25','Esmeralda','Foto','Audio','Video'],
    brain:{prompt:'¿Qué necesitas? Bueno yo necesito esmeraldas.',fallback:'No entiendo pero con esmeraldas se soluciona...',options:[
      {l:'¿Hola?',r:'Hola!, supongo...Que paso...'},{l:'E11-25',r:'Uy! Tu sabes que es eso...'},{l:'Esmeralda',r:'Me gusta, me encanta.'},
      {l:'Hola',r:'Pues hola, y que tal supongo.'},{l:'Bien',r:'Que bien, ahora me das esmeraldas.'},{l:'Mal',r:'Creo que tengo tu medicina, pues tradearme.'},
      {l:'Sand Brill',r:'Quien es, quiero conocerlo, parece una gran persona.'},{l:'Lobo',r:'Pues es bonito tener un lobito que se comporte como perro, no.'},
      {l:'Kevin',r:'Shhh... JEJE, ni idea de quien es ese tipo...'},{l:'Sabes de ███',r:'Obvio no! Si esta censurado.'},
      {l:'Octubre',r:'Que miedo, pero mas miedo que no me tradeen...'},{l:'Trato',r:'Si me das esmeraldas te doy 1 pan.'},
      {l:'Foto',r:{type:'image',url:'vill/vill1.jpg'}},{l:'Ajolote',r:{type:'image',url:'img/ajolote.gif'}},
      {l:'Audio',r:{type:'audio',url:'music/1234.mp3'}},{l:'Sand',r:{type:'audio',url:'ald/music1.mp3'}},
      {l:'🐶',r:'Runa!?...'},{l:'Video',r:{type:'video',url:'vill/wolfmine.mp4'}},
    ]}
  },
  {id:'c2',name:'Eduard Moss',alias:'M10-25',desc:'Pregunta sin remordimientos, colega.',avatar:'vill/villplains.jpg',aType:'img',gold:false,online:true,unread:0,kind:'keyword',qr:['Hola','Semillas','Tasks1'],
    brain:{fallback:'No entendi colega. Prueba con: "Hola"',keywords:{
      'hola':'Hola colega, que tal tu dia...','bien':'Me alegro de que tu dia este asi.','mal':'No se sienta asi colega, siempre podemos afrontarlo.',
      'semillas':'Algo que le da vida a la agricultura.','libros':'Te da curiosidad de los libros, son algo del pasado.',
      'tasks1':'Me podrias traer x6 stacks de patatas? Te compensare con x3 stacks de cobre.','gato':'Pues mi gato Polen es unico colega.','123':'¿Que significa colega?',
    }}
  },
  {id:'c5',name:'Orik Vall',alias:'El mapitas',desc:'Me gusta hacer mapitas.',avatar:'vill/cartografo.jpg',aType:'img',gold:false,online:true,unread:0,kind:'keyword',qr:['Mapa','2012','Desconocido'],
    brain:{fallback:'Que necesitas my friend',keywords:{
      'mapa':'Si my friend, yo hago mapas.','ocultas algo':'Que pregunta, me estas difamando my friend.',
      '2012':'Si ese caso es muy extraño, pero no puedo confirmar.','desconocido':'Fue mencionado en mapas y documentales ████ durante siglos. Pero causo polemicas...',
      'japon':'Pequeña isla en el norte de Japón desapareció del mar. Redescubierta en 2018.','hola':'Hola, que tuvieras un gran dia, como estas.',
    }}
  },
  {id:'c7',name:'Steven Moss',alias:'Librillero',desc:'Me gusta escribir mis aventuras.',avatar:'vill/bibliotecario.jpg',aType:'img',gold:false,online:false,unread:0,kind:'keyword',qr:['Rosa','Libro','Tasks1'],
    brain:{fallback:'¿Que quieres saber, alguna historia?',keywords:{
      'rosa':'Novela ambientada en una abadía medieval donde los monjes mueren misteriosamente.','libro':'Hay muchos libros, cada uno te sumerge a un mundo unico.',
      'leer':'Pues si me gusta leer pero escribir es mi pasion.','hello':'Hi! How are you!','gato':'😸',
      'tasks1':'Encuentra el libro con titulo amarillo y numeros raros. Te compensare x3 cobre.','1':'Que numero fascinante...',
    }}
  },
  {id:'c10',name:'Kevin Dew',alias:'Asistente',desc:'Quiero ayudarte con todas tus dudas.',avatar:'vill/booktea.gif',aType:'img',gold:true,online:true,unread:0,kind:'options',qr:['Ayuda','Palabra()','Estado','?'],
    brain:{prompt:'¿En que te puedo ayudar hoy?',fallback:'Puedes escribir ?',options:[
      {l:'Ayuda',r:'Cual es tu consulta.'},{l:'Palabra()',r:'Tasks, Place, Claim, Game, Book, Crafting, Animal, FAQ'},
      {l:'FAQ',r:'Puedes preguntar (?).'},{l:'?',r:'Vale: Eventos, Juegos, Aldeanos, Web, Historia'},
      {l:'Eventos',r:'Los eventos activos llegarán a tu buzon con mas detalles.'},{l:'Juegos',r:'Los juegos estan con los eventos, algunos tienen su propio evento.'},
      {l:'Aldeanos',r:'Algunos aldeanos tienen nombre y son claves para la historia.'},{l:'Historia',r:'La historia todavia no esta disponible, estara disponible mas adelante.'},
      {l:'Tasks',r:'Tareas que algunos aldeanos piden con recompensas.'},{l:'Place',r:'Lugar donde dejar lo encomendado.'},
      {l:'Estado',r:'Todo en orden. Eventos activos, tienda disponible, banco operativo. ✅'},{l:'93',r:'...'},{l:'K',r:'...'},
    ]}
  },
  {id:'c11',name:'Guau!',alias:'El mas perron',desc:'Soy el perron de mi cuadra... Guau...',avatar:'vill/photowolf.jpg',aType:'img',gold:true,online:true,unread:99,kind:'options',qr:['Guau','Guau?','Lobo'],
    brain:{prompt:'¿Guau?',fallback:'Guau!',options:[
      {l:'Guau',r:'Hola! Guau.'},{l:'Guau?',r:'Guau?'},{l:'Hola',r:'Guau! 😸'},{l:'Bien',r:'Guauuuuuu...'},
      {l:'Mal',r:'Guau... 😿'},{l:'Lobo',r:'Guau...'},{l:'Perro',r:'Guau... 😎'},{l:'Octubre',r:'Auuuuu!!!'},
      {l:'31',r:'🐺'},{l:'Truco',r:'Guau?😸'},{l:'Trato',r:'Guau!🙀'},
    ]}
  },
  {id:'c12',name:'David Kal',alias:'El Pequeñin',desc:'Seremos grandes algun dia, colegita...',avatar:'img/babyvillager.jpg',aType:'img',gold:false,online:true,unread:1,kind:'options',qr:['Hola','¿Estas Bien?','Dibujo'],
    brain:{prompt:'Hola, colegita',fallback:'Colegita, no te entendi, pero trato...',options:[
      {l:'Hola',r:'Hola, como estas...'},{l:'Bien',r:'Que bien colegita'},{l:'Mal',r:'No digas eso colegita, recuerda que todavia podemos seguir intentandolo...'},
      {l:'¿Estas Bien?',r:'Si, colegita, ¿y tu?'},{l:'Amigo',r:'Si colegita, eres increible, se mejor cada dia...'},
      {l:'Dibujo',r:{type:'image',url:'dav/happyg2.jpg'}},{l:'Alex',r:{type:'image',url:'dav/alex1.jpg'}},
      {l:'cancion',r:{type:'audio',url:'dav/sleep.mp3'}},{l:'Triste',r:'No te rindas asi de facil, eres alguien increible, no lo olvides...'},
      {l:'Adios',r:'Hasta luego colegita...'},{l:'Feliz',r:'Pues estamos feliz, verdad... :D'},
    ]}
  },
  {id:'c14',name:'News!!',alias:'Aqui con las NEWS!!!!!',desc:'Aqui informamos nosotros...',avatar:'gif/news-villager.gif',aType:'img',gold:false,online:true,unread:0,kind:'options',qr:['News','Golem','Diamante','Fin'],
    brain:{prompt:'Aqui con las noticias, edicion matutina...',fallback:'No tenemos esa noticia.',options:[
      {l:'News',r:'Hmm… bienvenidos al informativo del día. Hoy: ¿por qué los jugadores nunca duermen y siempre abren cofres ajenos?'},
      {l:'Golem',r:'Hmm… emergencia: el golem de hierro fue acusado de ignorar a un zombi. Dice que estaba en su día libre.'},
      {l:'Granjero',r:'Hmm… alerta: granjero asegura que sus cultivos desaparecen por la noche. Sospechoso: el propio jugador.'},
      {l:'Diamante',r:'Hmm… gran confusión en el pueblo minero. Un jugador aseguró haber encontrado diamantes. Era solo lapislázuli.'},
      {l:'Panda',r:{type:'image',url:'gif/news-minecraft.gif'}},
      {l:'Fin',r:'Hmm… y así termina Aldeanos al Día. ¡Hasta la próxima, cuiden sus cultivos!'},
    ]}
  },
  {id:'c16',name:'Panda enthusiast',alias:'🎍🐼',desc:'Le gusta el bambu 🎍🐼',avatar:'imagen/panda1.gif',aType:'img',gold:false,online:true,unread:0,kind:'options',qr:['Bambu','Dormir','Panda'],
    brain:{prompt:'"¡BUENAS NOCHES! Yo... gordo, feliz y confundido. ¡Aplauso al bambú!" 🌿👏',fallback:'...',options:[
      {l:'Bambu',r:'¡12 kilos al día! Imagínate un buffet libre y un panda con actitud de "esto es todo lo que puedo comer".'},
      {l:'Dormir',r:'Si dormir fuera deporte olímpico, el panda tendría 27 medallas. Nivel: modo hibernación 24/7.'},
      {l:'Panda',r:'El panda es el único animal en peligro de extinción y sigue siendo influencer.'},
      {l:'#GoodLife',r:{type:'image',url:'imagen/panda2.gif'}},
    ]}
  },
  {id:'c17',name:'Allay🎶',alias:'El angel musical',desc:'Volvamos a recordar...',avatar:'gif/minecraft-allay.gif',aType:'img',gold:true,online:true,unread:0,kind:'options',qr:['October','November','Sand Brill'],
    brain:{prompt:'🎶🎶🎶🎶',fallback:'Todavia no tenemos esa pista...',options:[
      {l:'October',r:{type:'audio',url:'music/spooky.mp3'}},{l:'November',r:{type:'audio',url:'music/november.mp3'}},
      {l:'Sand Brill',r:{type:'audio',url:'ald/music1.mp3'}},{l:'Shop',r:{type:'audio',url:'music/1234.mp3'}},
    ]}
  },
];

const BOT_STORIES = [
  {id:'bst1',contact:'c1',type:'video',url:'video/stevevideo2.mp4',text:'Cuando encuentras una esmeralda,\nno celebras. Respiras hondo y sigues.',duration:16000,seen:false},
  {id:'bst2',contact:'c1',type:'image',url:'vill/vill1.jpg',text:'Que opinan de mi foto de perfil.\nA que es muy grandiosa',seen:false},
  {id:'bst3',contact:'c14',type:'image',url:'',text:'🟩 Minecraft Noticias – Edición Matutina\nIniciamos esta jornada cuadrada con información importante.',seen:false},
  {id:'bst4',contact:'c14',type:'image',url:'gif/creaking-minecraft.gif',text:'🟨 Última hora: varios creakings merodeando zonas residenciales.',seen:false},
];
const seenStatuses = JSON.parse(localStorage.getItem('mv_seen_st') || '{}');
BOT_STORIES.forEach(s => { if (seenStatuses[s.id]) s.seen = true; });

/* ── STATE ── */
let CU = null; // currentUser
let myProfile = {};
let friendList = [];
let currentId = null, currentType = null, currentFriendUid = null;
let msgUnsub = null;
let presenceUnsubs = [];
let statusUnsubs = [];
let myStatuses = [];
let friendStatuses = {};
let pendingFile = null, pendingDataUrl = null;
const muted = new Set(), pinned = new Set();
let typingNode = null;

/* ── SCROLL TO END ── */
function scrollThread() { requestAnimationFrame(() => { const t = $('#thread'); if (t) t.scrollTop = t.scrollHeight; }); }

/* ── RENDER AVATAR ── */
function avHTML(av, size) {
  const isImg = av && (av.startsWith('http') || av.includes('/'));
  const px = size * 0.55;
  if (isImg) return `<img src="${esc(av)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block" />`;
  return `<span style="font-size:${px}px;line-height:1">${esc(av||'👤')}</span>`;
}

/* ── TITLE HTML ── */
function titleTag(titleId) {
  if (!titleId) return '';
  const t = TITLES_MAP[titleId];
  if (!t) return '';
  return `<span class="ci-title tp-${t.rarity}" title="${esc(t.name)}">✦ ${esc(t.name)} ✦</span>`;
}

/* ══════════════════════════════════════
   STARS + NAVBAR
══════════════════════════════════════ */
initStars();

const ham = $('#hamburger'), nav = $('#main-nav');
ham?.addEventListener('click', () => nav?.classList.toggle('open'));
document.addEventListener('click', e => {
  if (!ham?.contains(e.target) && !nav?.contains(e.target)) nav?.classList.remove('open');
});

/* ══════════════════════════════════════
   AUTH INIT
══════════════════════════════════════ */
onAuthStateChanged(auth, async user => {
  if (!user) { location.href = 'index.html'; return; }
  CU = user;
  await loadMyProfile();
  await loadFriends();
  renderAll();
  loadFriendStatuses();
  renderStoriesBar();
  applySettings();
  loadSettingsUI();
  setOnline();
  window.addEventListener('beforeunload', setOffline);
});

/* ── loadMyProfile — reads Firebase + localStorage, updates UI ── */
async function loadMyProfile() {
  // 1. Try Firebase
  try {
    const snap = await getDoc(doc(db,'users',CU.uid));
    if (snap.exists()) myProfile = snap.data();
  } catch(e) { console.warn('Profile fetch error', e); }

  // 2. Merge localStorage as fallback
  const lsp = lsGet('mv_perfil') || {};
  if (!myProfile.nombre && lsp.nombre) myProfile = {...lsp, ...myProfile};

  // 3. Determine display values
  const s = getS();
  const name    = s.profileName || myProfile.nombre || CU.displayName || 'JUGADOR';
  const status  = s.statusMsg || 'Aqui en mi World';
  const avatar  = myProfile.avatar || lsp.avatar || '🌙';
  const playerId = myProfile.player_id || localStorage.getItem('mv_player_id') || '';

  // 4. Update header
  const nameEl = $('#myDisplayName'); if (nameEl) nameEl.textContent = name.toUpperCase();
  const stEl   = $('#myStatusText');  if (stEl)  stEl.textContent = status;

  // 5. Update avatar in header
  const avEl = $('#myAvatarHeader');
  if (avEl) {
    const isImg = avatar.startsWith('http') || avatar.includes('/');
    if (isImg) {
      avEl.innerHTML = `<img src="${esc(avatar)}" alt="" style="width:100%;height:100%;object-fit:cover" />`;
    } else {
      avEl.textContent = avatar;
      avEl.style.fontSize = '1.5rem';
    }
  }

  // 6. Settings fields
  const spid = $('#settPlayerId'); if (spid) spid.textContent = playerId || '—';
  const smail = $('#settEmail'); if (smail) smail.textContent = myProfile.email || CU.email || '—';
}

/* ── Presence ── */
async function setOnline() {
  if (!CU) return;
  try {
    await updateDoc(doc(db,'users',CU.uid), {
      presence: { state: getS().lastSeen ? 'online' : 'hidden', section:'contactos', lastSeen: new Date().toISOString() }
    });
  } catch {}
}
async function setOffline() {
  if (!CU) return;
  try { await updateDoc(doc(db,'users',CU.uid), { presence: { state:'offline', section:null, lastSeen: new Date().toISOString() } }); } catch {}
}

/* ══════════════════════════════════════
   FRIENDS LOADING
══════════════════════════════════════ */
async function loadFriends() {
  presenceUnsubs.forEach(u => u()); presenceUnsubs = [];
  try {
    const snap = await getDoc(doc(db,'users',CU.uid));
    if (!snap.exists()) return;
    const uids = snap.data().friends || [];
    if (!uids.length) { renderFriends(); return; }
    const snaps = await Promise.all(uids.map(uid => getDoc(doc(db,'users',uid))));
    friendList = snaps.filter(s => s.exists()).map(s => mkFriend(s.id, s.data()));
    // Real-time presence
    friendList.forEach(f => {
      const unsub = onSnapshot(doc(db,'users',f.uid), snap => {
        if (!snap.exists()) return;
        const d = snap.data();
        const idx = friendList.findIndex(x => x.uid === f.uid);
        if (idx < 0) return;
        friendList[idx].online = d.presence?.state === 'online';
        friendList[idx].lastSeen = d.presence?.lastSeen || null;
        friendList[idx].avatar = d.avatar || friendList[idx].avatar;
        friendList[idx].name = d.nombre || friendList[idx].name;
        friendList[idx].titleId = d.title_active || friendList[idx].titleId;
        friendList[idx].xp = d.xp || 0;
        renderFriends();
        if (currentId === f.id) updateChatHd(friendList[idx]);
      });
      presenceUnsubs.push(unsub);
    });
    renderFriends();
  } catch(e) { console.warn('loadFriends error', e); }
}

function mkFriend(uid, d) {
  return {
    id:`fr_${uid}`, uid, type:'friend',
    name: d.nombre || 'Amigo',
    avatar: d.avatar || '👤',
    titleId: d.title_active || '',
    online: d.presence?.state === 'online',
    lastSeen: d.presence?.lastSeen || null,
    xp: d.xp || 0,
    playerId: d.player_id || '',
    unread: 0
  };
}

/* ══════════════════════════════════════
   RENDER CONTACTS
══════════════════════════════════════ */
function renderAll() { renderFriends(); renderBots(); updateOnlineCount(); }

function renderFriends() {
  const list = $('#friendList'); if (!list) return;
  const div  = $('#dividerFriends');
  const wrap = $('#friendsScrollWrap');
  const q = ($('#searchContacts')?.value||'').toLowerCase();
  const filtered = friendList.filter(c => !q || c.name.toLowerCase().includes(q))
    .sort((a,b) => { if(pinned.has(a.id)!==pinned.has(b.id)) return pinned.has(a.id)?-1:1; if(a.online!==b.online) return a.online?-1:1; return a.name.localeCompare(b.name); });

  if (!friendList.length) {
    if (div) div.style.display = 'none';
    if (wrap) { wrap.style.maxHeight='0'; wrap.style.overflow='hidden'; }
    list.innerHTML = '';
    return;
  }
  if (div) div.style.display = 'flex';
  if (wrap) { wrap.style.maxHeight = Math.min(filtered.length*64+12, 280)+'px'; wrap.style.overflow = 'auto'; }

  list.innerHTML = filtered.map(c => friendItem(c)).join('');
  $$('.contact-item', list).forEach(li => li.addEventListener('click', () => selectContact(li.dataset.id)));
}

function renderBots() {
  const list = $('#contactList'); if (!list) return;
  const q = ($('#searchContacts')?.value||'').toLowerCase();
  const filtered = BOTS.filter(c => !q || [c.name,c.alias,c.desc].join(' ').toLowerCase().includes(q))
    .sort((a,b) => { if(pinned.has(a.id)!==pinned.has(b.id)) return pinned.has(a.id)?-1:1; if(a.online!==b.online) return a.online?-1:1; if(a.unread!==b.unread) return b.unread-a.unread; return a.name.localeCompare(b.name); });
  list.innerHTML = filtered.map(c => botItem(c)).join('');
  $$('.contact-item', list).forEach(li => li.addEventListener('click', () => selectContact(li.dataset.id)));
}

function friendItem(c) {
  const active = currentId===c.id;
  const dotCls = c.online ? 'online' : '';
  const sub = c.online
    ? `<span style="color:var(--primary);font-size:.85rem">● EN LÍNEA</span>`
    : `<span class="ci-sub">${timeAgo(c.lastSeen)}</span>`;
  const title = titleTag(c.titleId);
  const unread = c.unread ? `<span class="ci-unread fr">${c.unread>99?'99+':c.unread}</span>` : '';
  return `<li class="contact-item friend-t ${active?'active':''}" data-id="${esc(c.id)}">
    <div class="ci-av">${avHTML(c.avatar,44)}<div class="ci-online-dot ${dotCls}"></div></div>
    <div class="ci-meta">
      <div class="ci-name"><span class="ci-name-text">${esc(c.name)}</span><span class="ci-badge friend">AMIGO</span></div>
      ${title ? `<div style="margin-top:2px">${title}</div>` : ''}
      ${sub}
    </div>
    <div class="ci-extra">${unread}</div>
  </li>`;
}

function botItem(c) {
  const active = currentId===c.id;
  const goldBadge = c.gold ? `<span class="ci-badge gold">GOLD</span>` : '';
  const onDot = `<div class="ci-online-dot ${c.online?'online':''}"></div>`;
  const unread = c.unread ? `<span class="ci-unread">${c.unread>99?'99+':c.unread}</span>` : '';
  return `<li class="contact-item ${c.gold?'gold-t':''} ${active?'active':''}" data-id="${esc(c.id)}">
    <div class="ci-av">${avHTML(c.avatar,44)}${onDot}</div>
    <div class="ci-meta">
      <div class="ci-name"><span class="ci-name-text">${esc(c.name)}</span>${goldBadge}</div>
      <div class="ci-sub">${esc(c.desc)}</div>
    </div>
    <div class="ci-extra">${unread}</div>
  </li>`;
}

function updateOnlineCount() {
  const n = friendList.filter(f=>f.online).length + BOTS.filter(b=>b.online).length;
  const el = $('#onlineCount'); if (el) el.textContent = `${n} EN LÍNEA`;
}

/* ══════════════════════════════════════
   SELECT CONTACT
══════════════════════════════════════ */
function selectContact(id) {
  if (currentId === id) return;
  if (msgUnsub) { msgUnsub(); msgUnsub = null; }
  currentId = id; currentFriendUid = null;
  clearImgPreview();

  const friend = friendList.find(c=>c.id===id);
  const bot    = BOTS.find(c=>c.id===id);
  const c = friend || bot; if (!c) return;
  currentType = friend ? 'friend' : 'bot';

  updateChatHd(c);
  const th = $('#thread'); th.innerHTML = '';
  const qb = $('#quickBar'); qb.innerHTML = ''; qb.classList.add('hidden');

  if (friend) {
    friend.unread = 0; renderFriends();
    openFriendChat(friend);
  } else {
    bot.unread = 0; renderBots();
    openBotChat(bot);
  }
}

function updateChatHd(c) {
  const av = $('#peerAvatar');
  if (av) {
    const isImg = c.avatar && (c.avatar.startsWith('http')||c.avatar.includes('/'));
    av.style.fontSize = isImg ? '' : '1.5rem';
    av.innerHTML = avHTML(c.avatar, 44);
  }
  const pn = $('#peerName'); if (pn) { pn.textContent = c.name.toUpperCase(); }
  const ps = $('#peerStatus');
  if (ps) {
    if (c.type==='friend') {
      if (c.online) { ps.textContent = '● EN LÍNEA'; ps.className = 'chat-peer-status online'; }
      else { ps.textContent = `Visto ${timeAgo(c.lastSeen)}`; ps.className = 'chat-peer-status'; }
    } else {
      ps.textContent = c.online ? '● EN LÍNEA' : '○ DESCONECTADO';
      ps.className = 'chat-peer-status' + (c.online?' online':'');
    }
  }
}

/* ══════════════════════════════════════
   BOT CHAT
══════════════════════════════════════ */
function openBotChat(bot) {
  const greet = {options:bot.brain.prompt, keyword:'Escribe lo que necesitas saber.', echo:'Dime algo.'}[bot.kind] || 'Hola.';
  pushPeer(bot, greet);
  if (bot.qr?.length) {
    const qb = $('#quickBar');
    qb.innerHTML = bot.qr.map(q=>`<button class="qr" data-q="${esc(q)}">${esc(q)}</button>`).join('');
    qb.classList.remove('hidden');
    $$('.qr',qb).forEach(b => b.addEventListener('click', () => sendMsg(b.dataset.q)));
  }
  scrollThread();
}

function botReply(bot, text) {
  const t = text.toLowerCase().trim();
  if (bot.kind==='options') {
    const opt = bot.brain.options.find(o => o.l.toLowerCase()===t);
    return opt ? (typeof opt.r==='string'?opt.r:opt.r) : bot.brain.fallback;
  }
  if (bot.kind==='keyword') {
    for (const k in bot.brain.keywords) { if (t.includes(k.toLowerCase())) return bot.brain.keywords[k]; }
    return bot.brain.fallback;
  }
  return 'Estoy pensando…';
}

/* ══════════════════════════════════════
   FRIEND CHAT
══════════════════════════════════════ */
function openFriendChat(friend) {
  currentFriendUid = friend.uid;
  const chatId = getChatId(CU.uid, friend.uid);
  const th = $('#thread');
  th.innerHTML = `<div class="chat-empty"><div class="ce-icon" style="font-size:1.5rem">⏳</div><div class="ce-desc">Cargando mensajes...</div></div>`;
  setDoc(doc(db,'chats',chatId), {[`unread_${CU.uid}`]:0}, {merge:true}).catch(()=>{});
  let first = true;
  msgUnsub = onSnapshot(
    query(collection(db,'chats',chatId,'messages'), orderBy('timestamp','asc'), limit(100)),
    snap => {
      if (first) {
        first = false; th.innerHTML = '';
        if (snap.empty) th.innerHTML = `<div class="chat-empty"><div class="ce-icon">💬</div><div class="ce-desc">Sé el primero en escribir</div></div>`;
        snap.docs.forEach(d => appendFriendMsg({id:d.id,...d.data()}, friend));
      } else {
        snap.docChanges().forEach(ch => {
          if (ch.type==='added') {
            const m = {id:ch.doc.id,...ch.doc.data()};
            $('#thread .chat-empty')?.remove();
            appendFriendMsg(m, friend);
            if (m.senderId !== CU.uid) playNotif();
          }
        });
      }
      scrollThread();
    },
    err => { console.error('msg listener', err); th.innerHTML = `<div class="chat-empty"><div class="ce-desc" style="color:var(--red)">Error cargando mensajes. Verifica conexión.</div></div>`; }
  );
  // Quick replies for friends
  const qb = $('#quickBar');
  qb.innerHTML = ['👋 Hola!','😄','🎮 Jugando?','🌙','✌️'].map(q=>`<button class="qr" data-q="${esc(q)}">${esc(q)}</button>`).join('');
  qb.classList.remove('hidden');
  $$('.qr',qb).forEach(b => b.addEventListener('click', () => sendMsg(b.dataset.q)));
}

function appendFriendMsg(msg, friend) {
  const s = getS();
  const isMine = msg.senderId === CU.uid;
  const node = document.createElement('div');
  node.className = `msg friend-msg ${isMine?'me':'peer'} ${s.compact?'compact':''}`;

  // Avatar
  let myAv = s.emojiAvatar || myProfile.avatar || '👤';
  const myAvIsImg = myAv.startsWith('http') || myAv.includes('/');
  const myAvHtml = `<div class="m-av">${avHTML(myAv, 30)}</div>`;
  const friendAvHtml = `<div class="m-av">${avHTML(friend.avatar, 30)}</div>`;

  // Content
  let content = '';
  if (msg.type==='image' && msg.imageUrl) {
    content = `<img src="${esc(msg.imageUrl)}" alt="imagen" class="chat-image" onclick="window.open('${esc(msg.imageUrl)}','_blank')" />`;
  } else {
    content = `<div class="m-text">${formatText(msg.text||'')}</div>`;
  }

  const ticks = isMine && s.readReceipts ? `<span class="m-ticks sent">✓✓</span>` : '';
  // Use timestamp if available
  let ts = timeNow();
  if (msg.timestamp?.toDate) { try { ts = new Intl.DateTimeFormat('es-PE',{hour:'2-digit',minute:'2-digit'}).format(msg.timestamp.toDate()); } catch {} }

  node.innerHTML = `${isMine ? myAvHtml : friendAvHtml}
    <div class="bubble">${content}<div class="m-meta"><span>${ts}</span>${ticks}</div></div>`;
  $('#thread').appendChild(node);
}

async function sendFriendMsg(text, imageUrl) {
  if (!currentFriendUid) return;
  const chatId = getChatId(CU.uid, currentFriendUid);
  const s = getS();
  try {
    await setDoc(doc(db,'chats',chatId), {
      participants:[CU.uid,currentFriendUid],
      lastMessage: imageUrl?'📷 Imagen':text,
      lastMessageAt: serverTimestamp(),
      lastMessageBy: CU.uid,
      [`unread_${currentFriendUid}`]: serverTimestamp()
    },{merge:true});
    await addDoc(collection(db,'chats',chatId,'messages'), {
      senderId:CU.uid, senderName:s.profileName||myProfile.nombre||'Yo',
      type:imageUrl?'image':'text', text:imageUrl?null:text, imageUrl:imageUrl||null,
      timestamp:serverTimestamp(), read:false
    });
  } catch(e) { toast('Error enviando mensaje', 'error'); console.error(e); }
}

/* ══════════════════════════════════════
   SEND MESSAGE
══════════════════════════════════════ */
const composer = $('#composer');
const msgInput = $('#msgInput');

composer?.addEventListener('submit', async e => {
  e.preventDefault();
  if (!currentId) { toast('Selecciona un contacto'); return; }
  const text = (msgInput.value||'').trim();
  if (!text && !pendingFile) return;
  msgInput.value = '';
  await sendMsg(text);
});

msgInput?.addEventListener('keydown', e => {
  if (e.key==='Enter' && !e.shiftKey && getS().enterSend) { e.preventDefault(); composer?.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})); }
});

async function sendMsg(text) {
  if (!currentId) return;
  const file = pendingFile;
  clearImgPreview();
  pushMe(text);
  if (currentType==='friend') {
    let imgUrl = null;
    if (file) {
      try {
        toast('📤 Subiendo imagen...', 'info');
        const path = `chat_images/${CU.uid}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._]/g,'_')}`;
        const r = sRef(storage, path);
        await uploadBytes(r, file);
        imgUrl = await getDownloadURL(r);
        toast('✅ Imagen enviada');
      } catch(e) { toast('❌ Error subiendo imagen', 'error'); return; }
    }
    if (text || imgUrl) await sendFriendMsg(text||null, imgUrl);
  } else {
    if (file && !text) return;
    if (!text) return;
    const bot = BOTS.find(c=>c.id===currentId); if (!bot) return;
    showTyping();
    setTimeout(() => {
      hideTyping();
      pushPeer(bot, botReply(bot, text));
      scrollThread();
    }, 600 + Math.random()*700);
  }
}

/* ── Push messages to UI ── */
function pushMe(text) {
  const s = getS();
  const av = s.emojiAvatar || myProfile.avatar || '👤';
  const th = $('#thread'); if (!th) return;
  th.querySelector('.chat-empty')?.remove();
  const node = document.createElement('div');
  node.className = `msg me ${s.compact?'compact':''}`;
  const content = pendingDataUrl
    ? `<img src="${esc(pendingDataUrl)}" class="chat-image" alt="imagen" />${text?`<div class="m-text">${formatText(text)}</div>`:''}`
    : `<div class="m-text">${formatText(text)}</div>`;
  node.innerHTML = `<div class="m-av">${avHTML(av,30)}</div><div class="bubble">${content}<div class="m-meta"><span>${timeNow()}</span><span class="m-ticks sent">✓✓</span></div></div>`;
  th.appendChild(node); scrollThread();
}

function pushPeer(c, content) {
  const s = getS();
  const th = $('#thread'); if (!th) return;
  th.querySelector('.chat-empty')?.remove();
  const node = document.createElement('div');
  node.className = `msg peer ${s.compact?'compact':''}`;
  let inner = '';
  if (typeof content==='string') inner = `<div class="m-text">${formatText(content)}</div>`;
  else if (content?.type==='image') inner = `<img src="${esc(content.url)}" class="chat-image" alt="imagen" onclick="window.open('${esc(content.url)}','_blank')" />`;
  else if (content?.type==='audio') inner = `<audio controls src="${esc(content.url)}" class="chat-audio"></audio>`;
  else if (content?.type==='video') inner = `<video controls class="chat-video"><source src="${esc(content.url)}" type="video/mp4"></video>`;
  else if (content?.type==='pdf')   inner = `<a href="${esc(content.url)}" target="_blank" class="chat-file">📄 VER PDF</a>`;
  node.innerHTML = `<div class="m-av">${avHTML(c.avatar,30)}</div><div class="bubble">${inner}<div class="m-meta">${timeNow()}</div></div>`;
  th.appendChild(node); scrollThread();
}

function showTyping() {
  if (typingNode) return;
  typingNode = document.createElement('div');
  typingNode.className = 'typing';
  typingNode.innerHTML = `<span class="dots"><span class="dot"></span><span class="dot"></span><span class="dot"></span></span><small>ESCRIBIENDO...</small>`;
  $('#thread').appendChild(typingNode); scrollThread();
}
function hideTyping() { typingNode?.remove(); typingNode = null; }

/* ══════════════════════════════════════
   IMAGE ATTACHMENT
══════════════════════════════════════ */
$('#imgInput')?.addEventListener('change', e => {
  const f = e.target.files?.[0]; if (!f) return;
  if (f.size > 5*1024*1024) { toast('Imagen muy grande (máx 5MB)', 'error'); return; }
  pendingFile = f;
  const reader = new FileReader();
  reader.onload = ev => {
    pendingDataUrl = ev.target.result;
    const bar = $('#imgPreviewBar'); if (!bar) return;
    bar.classList.remove('hidden');
    $('#imgPreviewThumb').src = ev.target.result;
    $('#imgPreviewName').textContent = f.name;
  };
  reader.readAsDataURL(f);
});
$('#btnAttach')?.addEventListener('click', () => { if (!currentId) { toast('Selecciona un contacto'); return; } $('#imgInput')?.click(); });
$('#imgPreviewRemove')?.addEventListener('click', clearImgPreview);
function clearImgPreview() {
  pendingFile = null; pendingDataUrl = null;
  const bar = $('#imgPreviewBar'); if (bar) bar.classList.add('hidden');
  const inp = $('#imgInput'); if (inp) inp.value = '';
}

/* ══════════════════════════════════════
   EMOJI PANEL
══════════════════════════════════════ */
const EMOJIS = {
  smileys:['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','😉','😍','😘','😜','🤔','😎','😢','😭','😡','😱','💀','🤗','😴'],
  animals:['🐶','🐱','🐭','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐺','🦋','🐢','🦄'],
  food:['🍏','🍎','🍊','🍋','🍌','🍉','🍇','🍓','🍕','🍔','🍟','🌭','🍣','🍪','🍰','🧃'],
  activity:['⚽','🏀','🏈','🎾','🎮','🎲','🎤','🎧','🎬','🎯','🎪','🏆','🥇'],
  hearts:['❤️','🧡','💛','💚','💙','💜','🖤','🤍','💖','💘','💝','💕'],
};
function loadEmojis(cat) {
  const ec = $('#emojiContent'); if (!ec) return;
  ec.innerHTML = (EMOJIS[cat]||[]).map(e=>`<span>${e}</span>`).join('');
  $$('.emoji-cats button').forEach(b => b.classList.toggle('active', b.dataset.cat===cat));
}
$('#btnEmoji')?.addEventListener('click', () => {
  const p = $('#emojiPanel'); p.classList.toggle('hidden');
  if (!p.classList.contains('hidden')) loadEmojis('smileys');
});
$('#emojiContent')?.addEventListener('click', e => { if (e.target.tagName==='SPAN') { msgInput.value += e.target.textContent; msgInput.focus(); } });
$$('.emoji-cats button').forEach(b => b.addEventListener('click', () => loadEmojis(b.dataset.cat)));
document.addEventListener('click', e => {
  const ep = $('#emojiPanel');
  if (ep && !ep.contains(e.target) && e.target!==('#btnEmoji')) ep.classList.add('hidden');
});

/* ── Search ── */
$('#searchContacts')?.addEventListener('input', () => renderAll());

/* ── Chat header buttons ── */
$('#btnInfo')?.addEventListener('click', () => {
  if (!currentId) { toast('Selecciona un contacto'); return; }
  const f = friendList.find(c=>c.id===currentId);
  const b = BOTS.find(c=>c.id===currentId);
  if (f) openFriendInfo(f); else if (b) openBotInfo(b);
});
$('#btnPin')?.addEventListener('click', () => {
  if (!currentId) return;
  if (pinned.has(currentId)) { pinned.delete(currentId); toast('Desanclado'); }
  else { pinned.add(currentId); toast('📌 Anclado'); }
  renderAll();
});
$('#btnMute')?.addEventListener('click', () => {
  if (!currentId) return;
  if (muted.has(currentId)) { muted.delete(currentId); toast('🔔 Sonido activado'); }
  else { muted.add(currentId); toast('🔕 Silenciado'); }
});

/* ── Notification sound ── */
function playNotif() {
  if (!getS().sound || muted.has(currentId)) return;
  try { const a = $('#notifSound'); if (a) { a.currentTime=0; a.play().catch(()=>{}); } } catch {}
}

/* ══════════════════════════════════════
   MODALS helpers
══════════════════════════════════════ */
function openModal(id) {
  const m = $(id); if (!m) return;
  m.classList.add('show'); m.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
}
function closeModal(id) {
  const m = $(id); if (!m) return;
  m.classList.remove('show'); m.setAttribute('aria-hidden','true');
  document.body.style.overflow='';
}
document.addEventListener('keydown', e => {
  if (e.key==='Escape') { ['#contactModal','#settingsModal','#statusCreatorModal'].forEach(closeModal); }
});
$('#modalOverlay')?.addEventListener('click', () => closeModal('#contactModal'));
$('#modalClose')?.addEventListener('click',   () => closeModal('#contactModal'));
$('#modalAction')?.addEventListener('click',  () => closeModal('#contactModal'));

function openFriendInfo(c) {
  const t = TITLES_MAP[c.titleId];
  $('#modalTitle').textContent = c.name.toUpperCase();
  $('#modalBody').innerHTML = `<div class="modal-info-grid">
    <div class="mig-block">
      <div class="mig-title">PERFIL</div>
      <div style="font-size:2.5rem;text-align:center;margin:8px 0">${avHTML(c.avatar,60)}</div>
      <div class="mig-row"><strong>Nombre:</strong> ${esc(c.name)}</div>
      <div class="mig-row"><strong>Título:</strong> ${t?`<span class="ci-title tp-${t.rarity}">✦ ${esc(t.name)} ✦</span>`:'—'}</div>
      <div class="mig-row"><strong>Player ID:</strong> <code style="font-family:var(--fp);font-size:.35rem;color:var(--yellow)">${esc(c.playerId||'—')}</code></div>
    </div>
    <div class="mig-block">
      <div class="mig-title">ESTADO</div>
      <div class="mig-row">${c.online?'🟢 EN LÍNEA':'⚫ DESCONECTADO'}</div>
      <div class="mig-row"><strong>Última vez:</strong> ${c.online?'Ahora mismo':timeAgo(c.lastSeen)}</div>
    </div>
  </div>`;
  openModal('#contactModal');
}
function openBotInfo(c) {
  $('#modalTitle').textContent = c.name.toUpperCase();
  $('#modalBody').innerHTML = `<div class="modal-info-grid">
    <div class="mig-block"><div class="mig-title">PERFIL</div><div class="mig-row"><strong>Alias:</strong> ${esc(c.alias)}</div><div class="mig-row"><strong>Tipo:</strong> Personaje NPC</div></div>
    <div class="mig-block"><div class="mig-title">ESTADO</div><div class="mig-row">${c.online?'🟢 EN LÍNEA':'⚫ DESCONECTADO'}</div></div>
    <div class="mig-block full"><div class="mig-title">DESCRIPCIÓN</div><div class="mig-row">${esc(c.desc)}</div></div>
  </div>`;
  openModal('#contactModal');
}

/* ══════════════════════════════════════
   STATUS SYSTEM
══════════════════════════════════════ */
function loadFriendStatuses() {
  statusUnsubs.forEach(u=>u()); statusUnsubs=[];
  // My statuses
  statusUnsubs.push(onSnapshot(doc(db,'userStatuses',CU.uid), snap => {
    const now = new Date();
    myStatuses = snap.exists() ? (snap.data().stories||[]).filter(s=>new Date(s.expiresAt)>now) : [];
    renderStoriesBar();
  }));
  // Friend statuses
  friendList.forEach(f => {
    statusUnsubs.push(onSnapshot(doc(db,'userStatuses',f.uid), snap => {
      const now = new Date();
      friendStatuses[f.uid] = snap.exists() ? (snap.data().stories||[]).filter(s=>new Date(s.expiresAt)>now) : [];
      renderStoriesBar();
    }));
  });
}

function renderStoriesBar() {
  const cont = $('#storiesContainer'); if (!cont) return;
  const s = getS();
  const myAv = myProfile.avatar || s.emojiAvatar || '🌙';
  let html = `<div class="story-bubble my-s ${myStatuses.length?'unseen':''}" data-uid="__me" title="MI ESTADO">
    <div class="sb-ring">${avHTML(myAv,56)}</div>
    <div class="sb-label">YO</div>
  </div>`;

  // Bot stories grouped by contact
  const botGroup = {};
  BOT_STORIES.forEach(st => { if(!botGroup[st.contact]) botGroup[st.contact]=[]; botGroup[st.contact].push(st); });
  Object.entries(botGroup).forEach(([cid, stories]) => {
    const bot = BOTS.find(b=>b.id===cid); if (!bot) return;
    const unseen = stories.some(s=>!s.seen);
    html += `<div class="story-bubble ${unseen?'unseen':'seen'}" data-cid="${esc(cid)}" title="${esc(bot.name)}">
      <div class="sb-ring"><img src="${esc(bot.avatar)}" alt="${esc(bot.name)}" /></div>
      <div class="sb-label">${esc(bot.name.split(' ')[0].toUpperCase())}</div>
    </div>`;
  });

  // Friend statuses
  friendList.forEach(f => {
    const stories = friendStatuses[f.uid]||[];
    if (!stories.length) return;
    const unseen = stories.some(st=>!seenStatuses[st.id]);
    html += `<div class="story-bubble ${unseen?'unseen':'seen'}" data-uid="${esc(f.uid)}" title="${esc(f.name)}">
      <div class="sb-ring">${avHTML(f.avatar,56)}</div>
      <div class="sb-label">${esc(f.name.split(' ')[0].toUpperCase())}</div>
    </div>`;
  });

  cont.innerHTML = html;
  $$('.story-bubble', cont).forEach(el => {
    el.addEventListener('click', () => {
      const uid = el.dataset.uid, cid = el.dataset.cid;
      if (uid==='__me') { myStatuses.length ? openViewer(myStatuses,'Yo',myAv,true) : openStatusCreator(); }
      else if (cid) { const stories = BOT_STORIES.filter(s=>s.contact===cid); const bot=BOTS.find(b=>b.id===cid); if(bot&&stories.length) openViewer(stories,bot.name,bot.avatar,false,true); }
      else if (uid) { const stories=friendStatuses[uid]||[]; const f=friendList.find(x=>x.uid===uid); if(f&&stories.length) openViewer(stories,f.name,f.avatar,false); }
    });
  });
}

/* ── Story viewer ── */
let vList=[], vIdx=0, vTimer=null;
function openViewer(stories, name, avatar, isOwn, isBot=false) {
  vList=stories; vIdx=0;
  const vn=$('#viewerName'); if(vn) vn.textContent = name.toUpperCase();
  const va=$('#viewerAvatar');
  if (va) {
    const isImg = avatar && (avatar.startsWith('http')||avatar.includes('/'));
    va.innerHTML = avHTML(avatar, 44);
    va.style.fontSize = isImg ? '' : '1.5rem';
  }
  $('#storyViewer').style.display='flex';
  loadViewerStory();
}

function loadViewerStory() {
  const s = vList[vIdx]; if (!s) return;
  clearTimeout(vTimer);
  const cont = $('#storyContent'); if (!cont) return;
  cont.style.opacity='0';
  setTimeout(() => {
    // Handle both {url,text} (bot stories) and {content,caption,bgColor} (user stories)
    const mediaUrl = s.url || (s.type!=='text' ? s.content : null) || null;
    const textContent = s.type==='text' ? (s.content || s.text || '') : '';
    const caption = s.caption || (s.type!=='text' ? s.text : '') || '';
    const bg = s.bgColor || '#0a1a10';

    let html = '';
    if (s.type==='video' && mediaUrl) {
      html = `<video src="${esc(mediaUrl)}" autoplay controls style="max-width:90%;max-height:65vh;border:3px solid var(--border)"></video>`;
    } else if (s.type==='audio' && mediaUrl) {
      html = `<audio src="${esc(mediaUrl)}" autoplay controls class="chat-audio" style="width:280px"></audio>`;
    } else if (s.type==='image' && mediaUrl) {
      html = `<img src="${esc(mediaUrl)}" alt="" style="max-width:90%;max-height:65vh;border:3px solid var(--border)" />`;
    } else if (s.type==='text' && textContent) {
      html = `<div class="sv-text-card" style="background:${esc(bg)}"><p>${esc(textContent).replace(/\n/g,'<br>')}</p></div>`;
    }
    if (caption) html += `<div class="sv-caption">${esc(caption).replace(/\n/g,'<br>')}</div>`;

    cont.innerHTML = html || `<div class="sv-text-card" style="background:${esc(bg)}"><p>📡</p></div>`;
    cont.style.opacity='1';

    // Mark seen
    seenStatuses[s.id]=true;
    localStorage.setItem('mv_seen_st', JSON.stringify(seenStatuses));

    // Time
    if (s.createdAt) { const vt=$('#viewerTime'); if(vt) vt.textContent=timeAgo(s.createdAt); }
    const vv=$('#viewerViews'); if(vv) vv.textContent = (s.views?.length>0)?`${s.views.length} vista${s.views.length>1?'s':''}` : '';

    buildVBars();
    const dur = s.duration || 5000;
    vTimer = setTimeout(nextVStory, dur);
  }, 120);
}

function buildVBars() {
  const pb=$('#progressBars'); if(!pb) return;
  pb.innerHTML='';
  vList.forEach((_,i) => {
    const bar=document.createElement('div');
    if (i===vIdx) { const fill=document.createElement('div'); fill.className='sv-bar-fill'; fill.style.animationDuration=(vList[vIdx].duration||5000)+'ms'; bar.appendChild(fill); }
    pb.appendChild(bar);
  });
}
function nextVStory() { if(vIdx<vList.length-1){vIdx++;loadViewerStory();}else closeViewer(); }
function prevVStory() { if(vIdx>0){vIdx--;loadViewerStory();} }
function closeViewer() { const v=$('#storyViewer');if(v)v.style.display='none'; clearTimeout(vTimer); renderStoriesBar(); }

$('#svNext')?.addEventListener('click', nextVStory);
$('#svPrev')?.addEventListener('click', prevVStory);
$('#closeViewer')?.addEventListener('click', closeViewer);
$('#scrollRight')?.addEventListener('click', () => { const c=$('#storiesContainer');if(c)c.scrollLeft+=180; });
$('#scrollLeft')?.addEventListener('click',  () => { const c=$('#storiesContainer');if(c)c.scrollLeft-=180; });

/* ══════════════════════════════════════
   STATUS CREATOR
══════════════════════════════════════ */
let scColor='#0a1a10', scImg=null;

function openStatusCreator() {
  scColor='#0a1a10'; scImg=null;
  const ti=$('#statusTextInput'); if(ti) ti.value='';
  const ci=$('#statusImgCaption'); if(ci) ci.value='';
  const ip=$('#statusImgPreview'); if(ip){ip.src='';ip.classList.add('hidden');}
  const sp=$('#statusTextPreview'); if(sp) sp.style.background=scColor;
  const sp2=$('#statusTextPreviewContent'); if(sp2) sp2.textContent='Tu estado aquí…';
  openModal('#statusCreatorModal');
}

$('#btnAddStatus')?.addEventListener('click', openStatusCreator);
$('#statusCreatorOverlay')?.addEventListener('click',()=>closeModal('#statusCreatorModal'));
$('#statusCreatorClose')?.addEventListener('click', ()=>closeModal('#statusCreatorModal'));
$('#statusCreatorCancel')?.addEventListener('click',()=>closeModal('#statusCreatorModal'));

// Tabs
$$('.stab').forEach(btn => btn.addEventListener('click', () => {
  $$('.stab').forEach(b=>b.classList.remove('active')); btn.classList.add('active');
  $$('.stab-pane').forEach(p=>p.classList.add('hidden'));
  const tp = btn.dataset.tab; const pane = $(`#statusTab${tp.charAt(0).toUpperCase()+tp.slice(1)}`);
  if (pane) pane.classList.remove('hidden');
}));

$('#statusTextInput')?.addEventListener('input', e => {
  const v=e.target.value||'Tu estado aquí…';
  const prev=$('#statusTextPreviewContent'); if(prev) prev.textContent=v;
  const cnt=$('#statusCharCount'); if(cnt) cnt.textContent=e.target.value.length;
});

$$('.sc').forEach(btn => btn.addEventListener('click', () => {
  $$('.sc').forEach(b=>b.classList.remove('active')); btn.classList.add('active');
  scColor=btn.dataset.color;
  const sp=$('#statusTextPreview'); if(sp) sp.style.background=scColor;
}));

$('#statusImgDrop')?.addEventListener('click', ()=>$('#statusImgInput')?.click());
$('#statusImgInput')?.addEventListener('change', e => {
  const f=e.target.files?.[0]; if(!f) return; scImg=f;
  const r=new FileReader(); r.onload=ev=>{
    const p=$('#statusImgPreview'); if(p){p.src=ev.target.result;p.classList.remove('hidden');}
    const d=$('#statusImgDrop'); if(d) d.style.display='none';
  }; r.readAsDataURL(f);
});

$('#statusCreatorPublish')?.addEventListener('click', async () => {
  const btn=$('#statusCreatorPublish'); btn.textContent='⏳ PUBLICANDO...'; btn.disabled=true;
  try {
    const tab = $('.stab.active')?.dataset.tab||'text';
    if (tab==='text') {
      const text=$('#statusTextInput')?.value.trim();
      if (!text){toast('Escribe algo primero','error');btn.textContent='PUBLICAR ►';btn.disabled=false;return;}
      await createStatus('text',text,'',scColor);
    } else {
      if (!scImg){toast('Selecciona una imagen','error');btn.textContent='PUBLICAR ►';btn.disabled=false;return;}
      const cap=$('#statusImgCaption')?.value.trim()||'';
      toast('📤 Subiendo...','info');
      const path=`statuses/${CU.uid}/${Date.now()}_${scImg.name.replace(/[^a-zA-Z0-9._]/g,'_')}`;
      const r=sRef(storage,path); await uploadBytes(r,scImg);
      const url=await getDownloadURL(r);
      await createStatus('image',url,cap,'');
    }
    closeModal('#statusCreatorModal'); toast('✅ Estado publicado (15 días)');
  } catch(e){toast('❌ Error','error');console.error(e);}
  btn.textContent='PUBLICAR ►'; btn.disabled=false;
});

async function createStatus(type,content,caption,bgColor) {
  const id=`st_${Date.now()}`, now=new Date(), exp=new Date(now.getTime()+15*24*3600*1000);
  const story={id,type,content,caption,bgColor,createdAt:now.toISOString(),expiresAt:exp.toISOString(),views:[]};
  await setDoc(doc(db,'userStatuses',CU.uid),{stories:arrayUnion(story)},{merge:true});
}

/* ══════════════════════════════════════
   SETTINGS
══════════════════════════════════════ */
$('#btnSettings')?.addEventListener('click', ()=>openModal('#settingsModal'));
$('#settingsOverlay')?.addEventListener('click',()=>closeModal('#settingsModal'));
$('#settingsClose')?.addEventListener('click', ()=>closeModal('#settingsModal'));

$$('.sn-btn').forEach(btn => btn.addEventListener('click', () => {
  $$('.sn-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active');
  $$('.sett-pane').forEach(p=>p.classList.remove('active'));
  $(`#sett-${btn.dataset.sec}`)?.classList.add('active');
}));

function loadSettingsUI() {
  const s=getS();
  if($('#settSound'))        $('#settSound').checked=s.sound;
  if($('#settBadge'))        $('#settBadge').checked=s.badge;
  if($('#settCompact'))      $('#settCompact').checked=s.compact;
  if($('#settEnterSend'))    $('#settEnterSend').checked=s.enterSend;
  if($('#settLastSeen'))     $('#settLastSeen').checked=s.lastSeen;
  if($('#settReadReceipts')) $('#settReadReceipts').checked=s.readReceipts;
  if($('#settStoryVisibility')) $('#settStoryVisibility').value=s.storyVisibility;
  if($('#settProfileName'))  $('#settProfileName').value=s.profileName||myProfile.nombre||'';
  if($('#settStatusMsg'))    $('#settStatusMsg').value=s.statusMsg;
  const fr=$(`input[name="fontSize"][value="${s.fontSize}"]`); if(fr) fr.checked=true;
  $$('.wp-btn').forEach(b=>b.classList.toggle('active',b.dataset.wp===s.wallpaper));
  // Emoji avatar picker
  const AVOS=['🌙','⚔️','🛡️','🗡️','🧪','📚','🌿','💎','🔮','🦊','🐺','🌟','🎮','🏆','⭐','🔥'];
  const picker=$('#emojiAvatarPicker');
  if(picker) {
    picker.innerHTML=AVOS.map(e=>`<button class="ea-btn ${s.emojiAvatar===e?'active':''}" data-e="${e}">${e}</button>`).join('');
    $$('.ea-btn',picker).forEach(b=>b.addEventListener('click',()=>{$$('.ea-btn',picker).forEach(x=>x.classList.remove('active'));b.classList.add('active');}));
  }
  const pid=localStorage.getItem('mv_player_id')||myProfile.player_id||'';
  if($('#settPlayerId')) $('#settPlayerId').textContent=pid||'—';
  if($('#settEmail'))    $('#settEmail').textContent=myProfile.email||CU?.email||'—';
}

$('#settSaveProfile')?.addEventListener('click', async () => {
  const name=$('#settProfileName')?.value.trim()||'';
  const statusMsg=$('#settStatusMsg')?.value.trim()||'Aqui en mi World';
  const activeEm=$('.ea-btn.active')?.dataset.e||getS().emojiAvatar;
  const s=getS(); s.profileName=name; s.statusMsg=statusMsg; s.emojiAvatar=activeEm;
  saveS(s);
  // Update header immediately
  const dn=$('#myDisplayName'); if(dn) dn.textContent=(name||myProfile.nombre||'JUGADOR').toUpperCase();
  const st=$('#myStatusText'); if(st) st.textContent=statusMsg;
  const avEl=$('#myAvatarHeader');
  if(avEl){avEl.innerHTML='';avEl.textContent=activeEm;avEl.style.fontSize='1.5rem';}
  try { await updateDoc(doc(db,'users',CU.uid),{nombre:name||myProfile.nombre,avatar:activeEm}); } catch{}
  toast('✅ Perfil actualizado');
});

// Toggle checkboxes
[['settSound','sound'],['settBadge','badge'],['settCompact','compact'],['settEnterSend','enterSend'],['settLastSeen','lastSeen'],['settReadReceipts','readReceipts']].forEach(([id,key]) => {
  $(`#${id}`)?.addEventListener('change', e => { const s=getS(); s[key]=e.target.checked; saveS(s); });
});
$$('input[name="fontSize"]').forEach(r=>r.addEventListener('change',e=>{const s=getS();s.fontSize=e.target.value;saveS(s);}));
$$('.wp-btn').forEach(btn=>btn.addEventListener('click',()=>{$$('.wp-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');const s=getS();s.wallpaper=btn.dataset.wp;saveS(s);}));
$('#settStoryVisibility')?.addEventListener('change',e=>{const s=getS();s.storyVisibility=e.target.value;saveS(s);});
$('#settCopyPlayerId')?.addEventListener('click',()=>{const pid=$('#settPlayerId')?.textContent||'';if(pid&&pid!=='—')navigator.clipboard?.writeText(pid).then(()=>toast('📋 ID copiado')).catch(()=>toast('📋 ID copiado'));});
$('#settRequestNotif')?.addEventListener('click',()=>Notification.requestPermission().then(p=>toast(p==='granted'?'🔔 Notificaciones activadas':'❌ Permiso denegado',p==='granted'?'':'error')));
$('#settClearBotChats')?.addEventListener('click',()=>{if(currentType==='bot'&&$('#thread'))$('#thread').innerHTML='';toast('🗑️ Chats limpiados');});
$('#settDeleteStatuses')?.addEventListener('click',async()=>{try{await setDoc(doc(db,'userStatuses',CU.uid),{stories:[]});myStatuses=[];renderStoriesBar();toast('🗑️ Estados eliminados');}catch{toast('❌ Error','error');}});
$('#settSignOut')?.addEventListener('click',async()=>{await setOffline();await signOut(auth);location.href='index.html';});

/* ══════════════════════════════════════
   MUSIC
══════════════════════════════════════ */
window.toggleMusic = function() {
  const a=$('#bg-music'), b=$('#musicBtn');
  if (!a||!b) return;
  if (a.paused) { a.play().then(()=>{b.classList.add('active');localStorage.setItem('music','on');}).catch(()=>{}); }
  else { a.pause(); b.classList.remove('active'); localStorage.setItem('music','off'); }
};
window.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('music')==='on') { const a=$('#bg-music'),b=$('#musicBtn'); a?.play().then(()=>b?.classList.add('active')).catch(()=>{}); }
});

/* ══════════════════════════════════════
   BOT NOTIFICATION SIMULATION
══════════════════════════════════════ */
setInterval(() => {
  const pool=BOTS.filter(c=>c.id!==currentId);
  if(!pool.length) return;
  const c=pool[Math.floor(Math.random()*pool.length)];
  if(muted.has(c.id)||!getS().badge) return;
  c.unread=Math.min(99,(c.unread||0)+1); renderBots();
}, 20000+Math.random()*15000);