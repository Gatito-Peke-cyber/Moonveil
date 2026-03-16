/* =========================================================
   Moonveil Portal — Contactos v2
   Firebase: amigos reales + chat RT + estados + ajustes
   ========================================================= */
import { auth, db, storage } from './firebase.js';
import {
  doc, getDoc, setDoc, addDoc, updateDoc, deleteField,
  collection, onSnapshot, query, orderBy, limit,
  serverTimestamp, arrayUnion
} from 'https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js';
import {
  ref as sRef, uploadBytes, getDownloadURL
} from 'https://www.gstatic.com/firebasejs/12.10.0/firebase-storage.js';

const $ = (q, c = document) => c.querySelector(q);
const $$ = (q, c = document) => Array.from(c.querySelectorAll(q));

/* ──────────────────────────────────────────────────────
   SETTINGS
   ────────────────────────────────────────────────────── */
const DEFAULTS = {
  sound: true, badge: true, fontSize: 'normal',
  wallpaper: 'default', compact: false, enterSend: true,
  lastSeen: true, readReceipts: true, storyVisibility: 'friends',
  profileName: '', statusMsg: 'Aqui en mi World', emojiAvatar: '🌙'
};
function getSettings() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem('mv_chat_settings') || '{}') }; }
  catch { return { ...DEFAULTS }; }
}
function saveSettings(s) {
  localStorage.setItem('mv_chat_settings', JSON.stringify(s));
  applySettings(s);
}
function applySettings(s = getSettings()) {
  const sz = s.fontSize === 'small' ? '0.85rem' : s.fontSize === 'large' ? '1.05rem' : '0.95rem';
  document.documentElement.style.setProperty('--chat-font-size', sz);
  const wps = {
    default: 'linear-gradient(180deg,rgba(20,26,22,.4),rgba(20,26,22,.2)),radial-gradient(700px 420px at 70% -100px,#0d1612 0,transparent 60%),linear-gradient(180deg,#101512,#0e140f)',
    green:  'linear-gradient(180deg,rgba(12,30,18,.6),rgba(8,20,12,.5)),#0a0f0a',
    purple: 'linear-gradient(180deg,rgba(25,12,38,.6),rgba(16,8,28,.5)),#0d0a10',
    blue:   'linear-gradient(180deg,rgba(10,18,36,.6),rgba(6,12,28,.5)),#090b10',
    dark:   'linear-gradient(180deg,#0a0a0a,#080808)',
  };
  const t = $('#thread');
  if (t) t.style.background = wps[s.wallpaper] || wps.default;
  if (t) t.classList.toggle('compact', !!s.compact);
}

/* ──────────────────────────────────────────────────────
   BOT CONTACTS
   ────────────────────────────────────────────────────── */
const BOT_CONTACTS = [
  {
    id:'c1',type:'bot',name:'Sand Brill',alias:'███████',
    desc:'Hola, tienes esmeraldas para darme.',
    avatar:'vill/vill1.jpg',avatarType:'img',gold:true,online:true,unread:2,kind:'options',
    quickReplies:['¿Hola?','Sabes de ███','E11-25','Esmeralda','Foto'],
    brain:{
      prompt:'¿Qué necesitas? Bueno yo necesito esmeraldas.',
      options:[
        {label:'¿Hola?',reply:'Hola!, supongo...Que paso...'},
        {label:'Sabes de ███',reply:'Obvio no! Ni se de quien me hablas si esta censurado.'},
        {label:'¿Donde te ubicas?',reply:'Donde, buena pregunta. Ni yo se la verdad...Pero quien sabe, capaz ya nos vimos.'},
        {label:'E11-25',reply:'Uy! Tu sabes que es eso...'},
        {label:'¿E11-25?',reply:'No, la verdad del tema no tengo informacion...Debes creerme.'},
        {label:'Esmeralda',reply:'Me gusta, me encanta.'},
        {label:'Hola',reply:'Pues hola, y que tal supongo.'},
        {label:'Bien',reply:'Que bien, ahora me das esmeraldas.'},
        {label:'Mal',reply:'Creo que tengo tu medicina, pues tradearme.'},
        {label:'Sand Brill',reply:'Quien es, quiero conocerlo, parece una gran persona.'},
        {label:'Lobo',reply:'Pues es bonito tener un lobito que se comporte como perro, no.'},
        {label:'Kevin',reply:'Shhh... JEJE, ni idea de quien es ese tipo...'},
        {label:'Octubre',reply:'Que miedo, pero mas miedo que no me tradeen...'},
        {label:'Trato',reply:'Si me das esmeraldas, hago tu trato de darte 1 pan, ves oferta y demanda...'},
        {label:'Foto',reply:{type:'image',url:'vill/vill1.jpg'}},
        {label:'Ajolote',reply:{type:'image',url:'img/ajolote.gif'}},
        {label:'Audio',reply:{type:'audio',url:'music/1234.mp3'}},
        {label:'Sand',reply:{type:'audio',url:'ald/music1.mp3'}},
        {label:'🐶',reply:'Runa!?...'},
        {label:'Video',reply:{type:'video',url:'vill/wolfmine.mp4'}},
      ],
      fallback:'No entiendo pero, digamos que si, pero con esmeraldas se soluciona...'
    }
  },
  {
    id:'c2',type:'bot',name:'Eduard Moss',alias:'M10-25',
    desc:'Pregunta sin remordimientos, colega.',
    avatar:'vill/villplains.jpg',avatarType:'img',gold:false,online:true,unread:0,kind:'keyword',
    quickReplies:['Hola','Semillas','Tasks1'],
    brain:{
      keywords:{
        'hola':'Hola colega, que tal tu dia...',
        'bien':'Me alegro de que tu dia este asi.',
        'mal':'Colega, no se sienta asi, aveces hay dias asi, pero siempre podemos afrontarlo y seguir.',
        'semillas':'Algo que le da vida a la agricultura, y asi tendremos mas de ellos.',
        'libros':'Te da curiosidad de lo que tienen esos libros, son algo del pasado.',
        'tasks1':'Necesito tu ayuda, me podrias traer x6 stacks de patatas. Y te compensare con x3 stacks de cobre.',
        'tasks2':'Me da miedo cuando estoy solo. Me ayudarias a encontrar a mi mascota Mossesito. Te compensare con x1 stack de cobre.',
        'tasks3':'Trae: 40 Remolachas, 64 Zanahorias, 128 Patatas, 32 Panes. Dejamelo cerca de la torre.',
        '123':'¿Que significa colega?',
        'hermanos':'Disculpe que me dice...Pues no le sabria decir de ello.',
        'brother1':'Este libro, aunque me da pena, no te lo podia ocultar por mas tiempo...',
        'gato':'Pues mi gato Polen es una compania unica colega.',
      },
      fallback:'No entendi lo que me pides colega. Capaz comenzamos con: "Hola".'
    }
  },
  {
    id:'c5',type:'bot',name:'Orik Vall',alias:'El mapitas',
    desc:'Me gusta hacer mapitas.',
    avatar:'vill/cartografo.jpg',avatarType:'img',gold:false,online:true,unread:0,kind:'keyword',
    quickReplies:['Mapa','Ocultas algo','2012'],
    brain:{
      keywords:{
        'mapa':'Si my friend, yo hago mapas.',
        'ocultas algo':'Que pregunta es esa, me estas difamando my friend.',
        '2012':'Si ese caso es muy extraño la verdad, pero no te puedo confirmar porque ni yo se si es real.',
        'desconocido':'Exacto, fue mencionado en mapas y documentales ████ durante siglos. Pero causo polemicas...',
        'mexico':'Si ese caso es muy raro de describir, pero la verdad ni idea si fue real del año 1895.',
        '1895':'En 1997 y 2009 expediciones confirmaron que había desaparecido o nunca existió.',
        'japon':'Pequeña isla en el norte de Japón, desapareció del mar. Redescubierta en 2018, bajo el agua.',
        '2018':'Al final si fue confirmado.',
        '2020':'Usuarios de Google Earth reportan "ciudades" que aparecen y desaparecen por errores de renderizado.',
        'tasks1':'Me gusta mucho los mapas, podrias darme un mapa de nivel 3 completo con todo explorado. Te compensare con x4 cobre.',
        'hola':'Tambien hola para ti y que tuvieras un gran dia y como estas.',
        'bien':'Me alegra, los lugares nuevos o antiguos nos llenan de alegria.',
        'mal':'No te pongas mal, siempre hay lugares nuevos por ser descubiertos.',
      },
      fallback:'Que necesitas my friend'
    }
  },
  {
    id:'c7',type:'bot',name:'Steven Moss',alias:'Librillero',
    desc:'Me gusta escribir mis aventuras.',
    avatar:'vill/bibliotecario.jpg',avatarType:'img',gold:false,online:false,unread:0,kind:'keyword',
    quickReplies:['Rosa','Libro','Tasks1'],
    brain:{
      keywords:{
        'rosa':'Novela ambientada en una abadía medieval donde los monjes mueren misteriosamente.',
        'libro':'Pues si hay muchos libros que leer, cada uno te sumerge a un mundo unico.',
        'leer':'Pues si me gusta leer, pero casi no tanto, porque escribir es mi pasion.',
        'hello':'Hi! How are you!',
        'gato':'😸',
        'tasks1':'Encuentra el libro con el titulo amarillo y tiene numeros raros. Te compensare x3 cobre.',
        'tasks2':'No hay mas por ahora...',
        'tratos':'Habia un bibliotecario que lo que escribia era tan raro, que se involucro con algo que nadie sabe.',
        '1':'Que numero fascinante...O que quieres decir',
      },
      fallback:'¿Que quieres saber, alguna historia?.'
    }
  },
  {
    id:'c10',type:'bot',name:'Kevin Dew',alias:'Asistente',
    desc:'Quiero ayudarte con todas tus dudas que tengas.',
    avatar:'vill/booktea.gif',avatarType:'img',gold:true,online:true,unread:0,kind:'options',
    quickReplies:['Ayuda','Palabra()','Estado','?'],
    brain:{
      prompt:'¿En que te puedo ayudar hoy?',
      options:[
        {label:'Ayuda',reply:'Cual es tu consulta.'},
        {label:'Palabra()',reply:'Tasks, Place, Claim, Game, Book, Crafting, Animal, FAQ'},
        {label:'FAQ',reply:'Si puedes preguntar por el que quieras saber, puedes preguntar (?)'},
        {label:'?',reply:'Vale, aqui va: Eventos, Juegos, Aldeanos, Web, Historia'},
        {label:'Eventos',reply:'Los eventos activos, la mayoria en tu buzon te llegara su informacion a mas detalles.'},
        {label:'Juegos',reply:'Los juegos estan tambien con los eventos, algunos tienen su propio evento.'},
        {label:'Aldeanos',reply:'Algunos aldeanos tienen nombre, y son claves para la historia.'},
        {label:'Web',reply:'La web si compras algo te llegara aveces a los dos dias de minecraft o solo uno.'},
        {label:'Historia',reply:'La historia todavia no esta disponible, estara disponible mas adelante cuando se anuncie.'},
        {label:'Tasks',reply:'Son algunas tareas que algunos aldeanos te piden y te compensan con recompensas.'},
        {label:'Place',reply:'Es el lugar de donde debes dejar lo encomendado.'},
        {label:'Estado',reply:'Todo en orden. Eventos activos, tienda disponible, banco operativo. ✅'},
        {label:'93',reply:'...'},
        {label:'K',reply:'...'},
      ],
      fallback:'Puedes escribir ?'
    }
  },
  {
    id:'c11',type:'bot',name:'Guau!',alias:'El mas perron',
    desc:'Soy el perron de mi cuadra... Guau...',
    avatar:'vill/photowolf.jpg',avatarType:'img',gold:true,online:true,unread:99,kind:'options',
    quickReplies:['Guau','Guau?','Lobo'],
    brain:{
      prompt:'¿Guau?',
      options:[
        {label:'Guau',reply:'Hola! Guau.'},
        {label:'Guau?',reply:'Guau?'},
        {label:'Hola',reply:'Guau! 😸'},
        {label:'Bien',reply:'Guauuuuuu...'},
        {label:'Mal',reply:'Guau... 😿'},
        {label:'Lobo',reply:'Guau...'},
        {label:'Perro',reply:'Guau... 😎'},
        {label:'Octubre',reply:'Auuuuu!!!'},
        {label:'31',reply:'🐺'},
        {label:'Truco',reply:'Guau?😸'},
        {label:'Trato',reply:'Guau!🙀'},
      ],
      fallback:'Guau!'
    }
  },
  {
    id:'c12',type:'bot',name:'David Kal',alias:'El Pequeñin',
    desc:'Seremos grandes algun dia, colegita...',
    avatar:'img/babyvillager.jpg',avatarType:'img',gold:false,online:true,unread:1,kind:'options',
    quickReplies:['Hola','¿Estas Bien?','Dibujo'],
    brain:{
      prompt:'Hola, colegita',
      options:[
        {label:'Hola',reply:'Hola, como estas...'},
        {label:'Bien',reply:'Que bien colegita'},
        {label:'Mal',reply:'No digas eso colegita, recuerda que todavia podemos seguir intentandolo hasta que salga...'},
        {label:'¿Estas Bien?',reply:'Si, colegita, ¿y tu?'},
        {label:'Amigo',reply:'Si colegita, eres increible tu, se mejor cada dia...'},
        {label:'Dibujo',reply:{type:'image',url:'dav/happyg2.jpg'}},
        {label:'Alex',reply:{type:'image',url:'dav/alex1.jpg'}},
        {label:'cancion',reply:{type:'audio',url:'dav/sleep.mp3'}},
        {label:'Triste',reply:'Aveces uno no sabe que hacer, colegita no te rindas asi de facil, tu eres alguien increible, no lo olvides...(Song1)'},
        {label:'Adios',reply:'Hasta luego, porque nos veremos despues, a que si colegita...'},
        {label:'Feliz',reply:'Pues estamos feliz, verdad... :D'},
        {label:'jaja',reply:'Que chistoso verdad'},
      ],
      fallback:'Colegita, no te entendi, pero trato...'
    }
  },
  {
    id:'c14',type:'bot',name:'News!!',alias:'Aqui con las NEWS!!!!!',
    desc:'Aqui informamos nosotros...',
    avatar:'gif/news-villager.gif',avatarType:'img',gold:false,online:true,unread:0,kind:'options',
    quickReplies:['News','Golem','Diamante','Fin'],
    brain:{
      prompt:'Aqui con las noticias, edicion matutina...',
      options:[
        {label:'News',reply:'Hmm… bienvenidos al informativo del día. Hoy hablaremos de lo que realmente importa: ¿por qué los jugadores nunca duermen y siempre abren cofres ajenos?'},
        {label:'Parche',reply:'El parche más reciente de Bedrock añadió mejoras gráficas: reflejos en el agua, nuevas texturas para el cobre y corrección de errores.'},
        {label:'Golem',reply:'Hmm… emergencia en la aldea: el golem de hierro fue acusado de ignorar a un zombi. Dice que estaba en su día libre.'},
        {label:'Granjero',reply:'Hmm… alerta en la aldea: granjero asegura que sus cultivos desaparecen por la noche. Sospechoso principal: el propio jugador.'},
        {label:'Diamante',reply:'Hmm… gran confusión en el pueblo minero. Un jugador aseguró haber encontrado diamantes a simple vista. Sin embargo, era solo lapislázuli.'},
        {label:'Panda',reply:{type:'image',url:'gif/news-minecraft.gif'}},
        {label:'Fin',reply:'Hmm… y así termina otra emisión de Aldeanos al Día. ¡Hasta la próxima, y cuiden sus cultivos!'},
      ],
      fallback:'No tenemos esa noticia.'
    }
  },
  {
    id:'c16',type:'bot',name:'Panda enthusiast',alias:'🎍🐼',
    desc:'Le gusta el bambu 🎍🐼',
    avatar:'imagen/panda1.gif',avatarType:'img',gold:false,online:true,unread:0,kind:'options',
    quickReplies:['Bambu','Dormir','Panda'],
    brain:{
      prompt:'"¡BUENAS NOCHES, HUMANOS! Yo... gordo, feliz y confundido. ¡Démosle un aplauso al bambú!" 🌿👏',
      options:[
        {label:'Bambu',reply:'¡12 kilos al día! Imagínate un buffet libre y un panda con actitud de "esto es todo lo que puedo comer". Es el cliente que los restaurantes temen.'},
        {label:'Dormir',reply:'Si dormir fuera deporte olímpico, el panda tendría 27 medallas. Duerme en árboles, sobre rocas, donde caiga. Nivel: modo hibernación activado 24/7.'},
        {label:'Panda',reply:'El panda es el único animal que puede estar en peligro de extinción y seguir siendo influencer. Posando para la cámara: "Hashtag #PandaVibes"'},
        {label:'#GoodLife',reply:{type:'image',url:'imagen/panda2.gif'}},
      ],
      fallback:'...'
    }
  },
  {
    id:'c17',type:'bot',name:'Allay🎶',alias:'El angel musical',
    desc:'Volvamos a recordar...',
    avatar:'gif/minecraft-allay.gif',avatarType:'img',gold:true,online:true,unread:0,kind:'options',
    quickReplies:['October','November','Sand Brill'],
    brain:{
      prompt:'🎶🎶🎶🎶',
      options:[
        {label:'October',reply:{type:'audio',url:'music/spooky.mp3'}},
        {label:'November',reply:{type:'audio',url:'music/november.mp3'}},
        {label:'Sand Brill',reply:{type:'audio',url:'ald/music1.mp3'}},
        {label:'Shop',reply:{type:'audio',url:'music/1234.mp3'}},
      ],
      fallback:'Todavia no tenemos esa pista...'
    }
  },
];

/* ──────────────────────────────────────────────────────
   STATE
   ────────────────────────────────────────────────────── */
let currentUser = null;
let myProfile = {};
let friendContacts = [];
let currentId = null;
let currentType = null; // 'bot' | 'friend'
let currentFriendUid = null;
let msgUnsubscribe = null;
let presenceUnsubs = [];
let statusUnsubscribes = [];
let myStatuses = [];
let friendStatuses = {}; // uid -> stories[]
let pendingImageFile = null;
let pendingImageUrl = null; // data URL for preview
const muted = new Set();
const pinned = new Set();
let typingTimer = null;
let typingNode = null;
const seenStatuses = JSON.parse(localStorage.getItem('mv_seen_statuses') || '{}');
// Bot story data (static)
const BOT_STORIES = [
  { id:'st1',contact:'c1',type:'video',url:'video/stevevideo2.mp4',text:'Cuando encuentras una esmeralda,\nno celebras. Respiras hondo y sigues.',start:'2025-12-01',end:'2026-06-01',duration:16000,seen:false },
  { id:'st2',contact:'c1',type:'image',url:'vill/vill1.jpg',text:'Que opinan de mi foto de perfil.\nA que es muy grandiosa',start:'2025-12-01',end:'2026-06-01',seen:false },
  { id:'st5',contact:'c14',type:'image',url:'',text:'🟩 Minecraft Noticias – Edición Matutina\nIniciamos esta jornada cuadrada con información importante.',start:'2025-12-01',end:'2026-06-01',seen:false },
  { id:'st6',contact:'c14',type:'image',url:'gif/creaking-minecraft.gif',text:'🟨 Última hora: varios creakings fueron vistos merodeando zonas residenciales.',start:'2025-12-01',end:'2026-06-01',seen:false },
];
BOT_STORIES.forEach(s => { if (seenStatuses[s.id]) s.seen = true; });

/* ──────────────────────────────────────────────────────
   UTILS
   ────────────────────────────────────────────────────── */
function esc(s) { return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function timeNow() { return new Intl.DateTimeFormat('es-PE',{hour:'2-digit',minute:'2-digit'}).format(new Date()); }
function timeAgo(isoStr) {
  if (!isoStr) return 'Desconocido';
  const diff = Date.now() - new Date(isoStr).getTime();
  const m = Math.floor(diff/60000), h = Math.floor(diff/3600000), d = Math.floor(diff/86400000);
  if (diff < 60000) return 'Ahora mismo';
  if (m < 60) return `hace ${m} min`;
  if (h < 24) return `hace ${h}h`;
  return `hace ${d}d`;
}
function formatText(s) {
  const e = esc(String(s)).replace(/\n/g,'<br>');
  return e.replace(/(https?:\/\/[^\s<]+)/g,'<a href="$1" target="_blank" rel="noopener">$1</a>');
}
function getChatId(a, b) { return [a, b].sort().join('_'); }
function toast(msg, duration = 1800) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), duration);
}
function threadScrollToEnd() {
  requestAnimationFrame(() => { const t = $('#thread'); if (t) t.scrollTop = t.scrollHeight; });
}

/* ──────────────────────────────────────────────────────
   NAVBAR + HUD
   ────────────────────────────────────────────────────── */
const navToggle = $('#navToggle');
const navLinks = $('#navLinks');
navToggle?.addEventListener('click', e => { e.stopPropagation(); navLinks.classList.toggle('open'); });
document.addEventListener('click', e => {
  if (!navToggle?.contains(e.target) && !navLinks?.contains(e.target)) navLinks?.classList.remove('open');
});
(function setHud() {
  $$('.hud-bar').forEach(b => b.style.setProperty('--v', +b.dataset.val || 50));
})();

/* ──────────────────────────────────────────────────────
   PARTICLES + PARALLAX
   ────────────────────────────────────────────────────── */
(function particles() {
  const c = $('#bgParticles'); if (!c) return;
  const ctx = c.getContext('2d'), dpi = Math.max(1, devicePixelRatio || 1); let w, h, pts;
  const init = () => { w = c.width = innerWidth*dpi; h = c.height = innerHeight*dpi; pts = Array.from({length:80},()=>({x:Math.random()*w,y:Math.random()*h,r:(1+Math.random()*2)*dpi,s:.2+Math.random(),a:.15+Math.random()*.35})); };
  const tick = () => { ctx.clearRect(0,0,w,h); pts.forEach(p=>{p.y+=p.s;p.x+=Math.sin(p.y*.002)*.35;if(p.y>h){p.y=-10;p.x=Math.random()*w}ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=`rgba(135,243,157,${p.a})`;ctx.fill()}); requestAnimationFrame(tick); };
  init(); tick(); addEventListener('resize', init);
})();
(function parallax() {
  const layers = $$('.layer'); if (!layers.length) return;
  const k = [0,.03,.06,.1];
  const go = () => { const y = scrollY||0; layers.forEach((el,i)=>el.style.transform=`translateY(${y*k[i]}px)`); };
  go(); addEventListener('scroll', go, {passive:true});
})();

/* ──────────────────────────────────────────────────────
   AUTH + INIT
   ────────────────────────────────────────────────────── */
onAuthStateChanged(auth, async user => {
  if (!user) { window.location.href = 'index.html'; return; }
  currentUser = user;
  await loadMyProfile();
  await loadFriends();
  renderAllContacts();
  loadFriendStatuses();
  renderStoriesBar();
  applySettings();
  loadSettingsUI();
  updatePresenceOnline();
  window.addEventListener('beforeunload', updatePresenceOffline);
});

async function loadMyProfile() {
  const snap = await getDoc(doc(db, 'users', currentUser.uid));
  if (snap.exists()) {
    myProfile = snap.data();
    const s = getSettings();
    const displayName = s.profileName || myProfile.nombre || 'Jugador';
    const statusMsg = s.statusMsg || 'Aqui en mi World';
    const myAvEl = $('#myDisplayName'); if (myAvEl) myAvEl.textContent = displayName;
    const myStEl = $('#myStatusText'); if (myStEl) myStEl.textContent = statusMsg;
    // Avatar
    const av = s.emojiAvatar || myProfile.avatar || '🌙';
    const wrap = $('#myAvatarWrap');
    if (wrap && !av.startsWith('http')) {
      wrap.innerHTML = `<div class="avatar emoji-av" style="width:42px;height:42px">${esc(av)}</div>`;
    }
    // Player ID in settings
    const pid = myProfile.player_id || '';
    if ($('#settPlayerId')) $('#settPlayerId').textContent = pid || '—';
    if ($('#settEmail')) $('#settEmail').textContent = myProfile.email || currentUser.email || '—';
  }
}

/* ──────────────────────────────────────────────────────
   PRESENCE
   ────────────────────────────────────────────────────── */
async function updatePresenceOnline() {
  if (!currentUser) return;
  const s = getSettings();
  try {
    await updateDoc(doc(db,'users',currentUser.uid), {
      presence: { state: s.lastSeen ? 'online' : 'hidden', section: 'contactos', lastSeen: new Date().toISOString() }
    });
  } catch {}
}
async function updatePresenceOffline() {
  if (!currentUser) return;
  try {
    await updateDoc(doc(db,'users',currentUser.uid), {
      presence: { state: 'offline', section: null, lastSeen: new Date().toISOString() }
    });
  } catch {}
}

/* ──────────────────────────────────────────────────────
   LOAD FRIENDS
   ────────────────────────────────────────────────────── */
async function loadFriends() {
  presenceUnsubs.forEach(u => u()); presenceUnsubs = [];
  const snap = await getDoc(doc(db,'users',currentUser.uid));
  if (!snap.exists()) return;
  const uids = snap.data().friends || [];
  if (!uids.length) { renderFriends(); return; }

  const snaps = await Promise.all(uids.map(uid => getDoc(doc(db,'users',uid))));
  friendContacts = snaps.filter(s => s.exists()).map(s => buildFriendContact(s.id, s.data()));

  // Real-time presence for each friend
  friendContacts.forEach(f => {
    const unsub = onSnapshot(doc(db,'users',f.uid), snap => {
      if (!snap.exists()) return;
      const d = snap.data();
      const idx = friendContacts.findIndex(x => x.uid === f.uid);
      if (idx < 0) return;
      friendContacts[idx].online = d.presence?.state === 'online';
      friendContacts[idx].lastSeen = d.presence?.lastSeen || null;
      friendContacts[idx].presenceState = d.presence?.state || 'offline';
      renderFriends();
      if (currentId === f.id && currentType === 'friend') updateChatHeader(friendContacts[idx]);
    });
    presenceUnsubs.push(unsub);
  });

  renderFriends();
}

function buildFriendContact(uid, data) {
  return {
    id: `friend_${uid}`,
    uid,
    type: 'friend',
    name: data.nombre || 'Amigo',
    alias: data.title_active || 'Aventurero',
    avatar: data.avatar || '👤',
    avatarType: 'emoji',
    gold: false,
    online: data.presence?.state === 'online',
    presenceState: data.presence?.state || 'offline',
    lastSeen: data.presence?.lastSeen || null,
    unread: 0,
    playerId: data.player_id || '',
  };
}

/* ──────────────────────────────────────────────────────
   RENDER CONTACTS
   ────────────────────────────────────────────────────── */
function renderAllContacts() {
  renderFriends();
  renderBots();
}

function renderFriends() {
  const list = $('#friendList'); if (!list) return;
  const divider = $('#dividerFriends');
  const wrap = $('#friendsScrollWrap');
  const q = ($('#searchContacts')?.value || '').toLowerCase().trim();

  const filtered = friendContacts.filter(c =>
    !q || [c.name, c.alias].join(' ').toLowerCase().includes(q)
  ).sort((a, b) => {
    if (pinned.has(a.id) !== pinned.has(b.id)) return pinned.has(a.id) ? -1 : 1;
    if (a.online !== b.online) return a.online ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  if (!filtered.length) {
    list.innerHTML = friendContacts.length ? '' : '<li class="muted" style="padding:8px 14px;font-size:.82rem">Sin amigos aún. ¡Añade desde Perfiles!</li>';
    if (divider) divider.style.display = friendContacts.length ? 'flex' : 'none';
    if (wrap) wrap.style.flex = friendContacts.length ? '0 0 auto' : '0';
    return;
  }

  if (divider) divider.style.display = 'flex';
  if (wrap) {
    const h = Math.min(filtered.length * 64 + 16, 300);
    wrap.style.flex = `0 0 ${h}px`;
  }

  list.innerHTML = filtered.map(c => friendItem(c)).join('');
  $$('.contact', list).forEach(li => li.addEventListener('click', () => selectContact(li.dataset.id)));
}

function renderBots() {
  const list = $('#contactList'); if (!list) return;
  const q = ($('#searchContacts')?.value || '').toLowerCase().trim();
  const filtered = BOT_CONTACTS.filter(c =>
    !q || [c.name, c.alias, c.desc].join(' ').toLowerCase().includes(q)
  ).sort((a, b) => {
    if (pinned.has(a.id) !== pinned.has(b.id)) return pinned.has(a.id) ? -1 : 1;
    if (a.online !== b.online) return a.online ? -1 : 1;
    if (a.unread !== b.unread) return b.unread - a.unread;
    return a.name.localeCompare(b.name);
  });
  list.innerHTML = filtered.map(c => botItem(c)).join('');
  $$('.contact', list).forEach(li => li.addEventListener('click', () => selectContact(li.dataset.id)));
}

function friendItem(c) {
  const isActive = currentId === c.id;
  const av = renderAvatarEl(c, 42);
  const onCls = c.online ? 'online' : '';
  const unread = c.unread ? `<span class="unread friend-unread">${c.unread}</span>` : '';
  const sub = c.online ? '<span class="muted" style="color:#30d158;font-size:.78rem">● En línea</span>' : `<span class="last-seen-text">${timeAgo(c.lastSeen)}</span>`;
  return `
<li class="contact friend-type ${isActive?'active':''}" data-id="${esc(c.id)}" role="option" aria-selected="${isActive}">
  <div class="avatar-wrap ${c.online?'is-online':''}">
    <div class="presence-ring"></div>
    ${av}
    <span class="presence-dot ${onCls}"></span>
  </div>
  <div class="c-meta">
    <div class="name">${esc(c.name)} <span class="badge friend-badge">AMIGO</span></div>
    ${sub}
  </div>
  <div class="c-extra">${unread}</div>
</li>`;
}

function botItem(c) {
  const isActive = currentId === c.id;
  const av = renderAvatarEl(c, 42);
  const gold = c.gold ? `<span class="badge gold">GOLD</span>` : '';
  const dot = `<span class="dot ${c.online?'':'off'}"></span>`;
  const unread = c.unread ? `<span class="unread">${c.unread > 99 ? '99+' : c.unread}</span>` : '';
  return `
<li class="contact ${c.gold?'gold':''} ${isActive?'active':''}" data-id="${esc(c.id)}" role="option" aria-selected="${isActive}">
  <div class="avatar-wrap">
    ${av}
  </div>
  <div class="c-meta">
    <div class="name">${esc(c.name)} ${gold}</div>
    <div class="desc">${esc(c.desc)}</div>
  </div>
  <div class="c-extra">${dot}${unread}</div>
</li>`;
}

function renderAvatarEl(c, size = 42) {
  const style = `width:${size}px;height:${size}px`;
  if (c.avatarType === 'img') {
    return `<div class="avatar" style="${style}"><img alt="${esc(c.name)}" src="${esc(c.avatar)}" /></div>`;
  }
  // emoji
  const av = c.avatar || '👤';
  return `<div class="avatar emoji-av" style="${style};font-size:${size*.55}px">${esc(av)}</div>`;
}

/* ──────────────────────────────────────────────────────
   SELECT CONTACT
   ────────────────────────────────────────────────────── */
function selectContact(id) {
  if (currentId === id) return;
  currentId = id;

  // Clear previous message listener
  if (msgUnsubscribe) { msgUnsubscribe(); msgUnsubscribe = null; }
  currentFriendUid = null;

  // Find contact
  const friend = friendContacts.find(c => c.id === id);
  const bot = BOT_CONTACTS.find(c => c.id === id);
  const c = friend || bot;
  if (!c) return;

  currentType = friend ? 'friend' : 'bot';

  updateChatHeader(c);
  $('#thread').innerHTML = '';
  $('#quickBar').innerHTML = '';
  $('#quickBar').classList.add('hidden');
  clearImagePreview();

  if (friend) {
    c.unread = 0;
    friend.unread = 0;
    renderFriends();
    openFriendChat(friend);
  } else {
    c.unread = 0;
    renderBots();
    openBotChat(bot);
  }
}

function updateChatHeader(c) {
  const peerName = $('#peerName');
  const peerStatus = $('#peerStatus');
  const peerAvatar = $('#peerAvatar');
  if (!peerName) return;
  peerName.textContent = c.name;
  if (c.type === 'friend') {
    const st = c.online ? 'En línea' : `Visto ${timeAgo(c.lastSeen)}`;
    peerStatus.textContent = st;
    peerStatus.style.color = c.online ? '#30d158' : '';
  } else {
    peerStatus.textContent = c.online ? 'En línea' : 'Desconectado';
    peerStatus.style.color = '';
  }
  peerAvatar.innerHTML = renderAvatarEl(c, 42);
}

/* ──────────────────────────────────────────────────────
   BOT CHAT
   ────────────────────────────────────────────────────── */
function openBotChat(c) {
  const greeting = {
    options: c.brain.prompt || '¿Qué opción eliges?',
    keyword: 'Escribe lo que quieras saber.',
    echo: 'Dime algo.',
  }[c.kind] || 'Hola.';
  pushPeer(c, greeting);

  if (c.quickReplies?.length) {
    const qb = $('#quickBar');
    qb.innerHTML = c.quickReplies.map(q => `<button class="qr" data-qr="${esc(q)}">${esc(q)}</button>`).join('');
    qb.classList.remove('hidden');
    $$('.qr', qb).forEach(b => b.addEventListener('click', () => sendMessage(b.dataset.qr)));
  }
  threadScrollToEnd();
}

function computeBotReply(c, text) {
  const t = text.toLowerCase().trim();
  if (c.kind === 'options') {
    const opt = c.brain.options.find(o => o.label.toLowerCase() === t);
    if (!opt) return c.brain.fallback || `Opciones: ${c.brain.options.slice(0,5).map(o=>o.label).join(' · ')}...`;
    return typeof opt.reply === 'string' ? opt.reply : opt.reply;
  }
  if (c.kind === 'keyword') {
    const tbl = c.brain.keywords || {};
    for (const k in tbl) {
      if (new RegExp(`(^|\\s)${k}(\\s|$)`,'i').test(t) || t.includes(k.toLowerCase())) return tbl[k];
    }
    return c.brain.fallback || 'No comprendí. Intenta otra vez.';
  }
  return 'Estoy pensando…';
}

/* ──────────────────────────────────────────────────────
   FRIEND CHAT (FIREBASE)
   ────────────────────────────────────────────────────── */
function openFriendChat(friend) {
  currentFriendUid = friend.uid;
  const chatId = getChatId(currentUser.uid, friend.uid);
  const thread = $('#thread');
  thread.innerHTML = '<div class="empty-hint" style="font-size:.85rem;opacity:.6"><p>Cargando mensajes…</p></div>';

  // Mark as read
  setDoc(doc(db,'chats',chatId), {[`unread_${currentUser.uid}`]: 0}, {merge:true}).catch(()=>{});

  let firstLoad = true;
  msgUnsubscribe = onSnapshot(
    query(collection(db,'chats',chatId,'messages'), orderBy('timestamp','asc'), limit(100)),
    snap => {
      if (firstLoad) {
        firstLoad = false;
        thread.innerHTML = '';
        if (snap.empty) {
          const s = getSettings();
          thread.innerHTML = '<div class="empty-hint"><p class="muted">Sé el primero en escribir 💬</p></div>';
        }
        snap.docs.forEach(d => appendFriendMsg({ id:d.id, ...d.data() }, friend));
      } else {
        snap.docChanges().forEach(change => {
          if (change.type === 'added') {
            const msg = { id: change.doc.id, ...change.doc.data() };
            const emptyHint = thread.querySelector('.empty-hint');
            if (emptyHint) emptyHint.remove();
            appendFriendMsg(msg, friend);
            if (msg.senderId !== currentUser.uid) {
              playNotifSound();
            }
          }
        });
      }
      threadScrollToEnd();
    },
    err => { console.error('msg listener error', err); }
  );

  // Quickbar with helpful prompts for friends
  const qb = $('#quickBar');
  qb.innerHTML = ['👋 Hola!','😄','🎮 Jugando?','🌙'].map(q=>`<button class="qr" data-qr="${esc(q)}">${esc(q)}</button>`).join('');
  qb.classList.remove('hidden');
  $$('.qr', qb).forEach(b => b.addEventListener('click', () => sendMessage(b.dataset.qr)));
}

function appendFriendMsg(msg, friend) {
  const isMine = msg.senderId === currentUser.uid;
  const s = getSettings();
  const node = document.createElement('div');
  node.className = `msg friend-msg ${isMine ? 'me' : 'peer'} ${s.compact ? 'compact' : ''}`;
  node.dataset.msgId = msg.id;

  let bubbleHTML = '';
  if (msg.type === 'image' && msg.imageUrl) {
    bubbleHTML = `<img src="${esc(msg.imageUrl)}" alt="imagen" class="chat-image" onclick="window.open('${esc(msg.imageUrl)}','_blank')" />`;
  } else {
    bubbleHTML = `<div class="text">${formatText(msg.text || '')}</div>`;
  }

  const ticks = isMine && s.readReceipts ? `<span class="read-ticks sent" title="Enviado">✓✓</span>` : '';
  const ts = msg.timestamp?.toDate ? timeNow() : timeNow();

  // Avatar
  let avatarHTML;
  if (isMine) {
    const av = s.emojiAvatar || myProfile.avatar || '👤';
    avatarHTML = av.startsWith('http') || av.includes('/')
      ? `<div class="avatar"><img src="${esc(av)}" alt="" /></div>`
      : `<div class="avatar" style="font-size:1rem">${esc(av)}</div>`;
  } else {
    avatarHTML = renderAvatarEl(friend, 32);
  }

  node.innerHTML = `
    ${avatarHTML}
    <div class="bubble">
      ${bubbleHTML}
      <div class="meta">${ts} ${ticks}</div>
    </div>`;
  $('#thread').appendChild(node);
}

async function sendFriendMessage(text, imageUrl = null) {
  if (!currentFriendUid || !currentUser) return;
  const chatId = getChatId(currentUser.uid, currentFriendUid);
  const s = getSettings();
  const senderName = s.profileName || myProfile.nombre || 'Yo';

  const msgData = {
    senderId: currentUser.uid,
    senderName,
    type: imageUrl ? 'image' : 'text',
    text: imageUrl ? null : text,
    imageUrl: imageUrl || null,
    timestamp: serverTimestamp(),
    read: false,
  };

  try {
    await setDoc(doc(db,'chats',chatId), {
      participants: [currentUser.uid, currentFriendUid],
      lastMessage: imageUrl ? '📷 Imagen' : text,
      lastMessageAt: serverTimestamp(),
      lastMessageBy: currentUser.uid,
      [`unread_${currentFriendUid}`]: serverTimestamp(),
    }, { merge: true });
    await addDoc(collection(db,'chats',chatId,'messages'), msgData);
  } catch(e) { toast('Error enviando mensaje'); console.error(e); }
}

/* ──────────────────────────────────────────────────────
   IMAGE UPLOAD
   ────────────────────────────────────────────────────── */
async function uploadImage(file) {
  const path = `chat_images/${currentUser.uid}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._]/g,'_')}`;
  const r = sRef(storage, path);
  await uploadBytes(r, file);
  return getDownloadURL(r);
}

function setImagePreview(file) {
  pendingImageFile = file;
  const reader = new FileReader();
  reader.onload = e => {
    pendingImageUrl = e.target.result;
    const bar = $('#imgPreviewBar');
    bar.classList.remove('hidden');
    $('#imgPreviewThumb').src = e.target.result;
    $('#imgPreviewName').textContent = file.name;
  };
  reader.readAsDataURL(file);
}

function clearImagePreview() {
  pendingImageFile = null; pendingImageUrl = null;
  const bar = $('#imgPreviewBar'); if (bar) bar.classList.add('hidden');
  const inp = $('#imgInput'); if (inp) inp.value = '';
}

$('#imgInput')?.addEventListener('change', e => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { toast('Imagen muy grande (máx 5MB)'); return; }
  setImagePreview(file);
});
$('#btnAttach')?.addEventListener('click', () => { if (!currentId) { toast('Selecciona un contacto'); return; } $('#imgInput')?.click(); });
$('#imgPreviewRemove')?.addEventListener('click', clearImagePreview);

/* ──────────────────────────────────────────────────────
   SEND MESSAGE (main)
   ────────────────────────────────────────────────────── */
const composer = $('#composer');
const msgInput = $('#msgInput');

composer?.addEventListener('submit', async e => {
  e.preventDefault();
  if (!currentId) { toast('Selecciona un contacto'); return; }
  const text = (msgInput.value || '').trim();
  if (!text && !pendingImageFile) return;
  msgInput.value = '';
  await sendMessage(text);
});

msgInput?.addEventListener('keydown', e => {
  const s = getSettings();
  if (e.key === 'Enter' && !e.shiftKey && s.enterSend) {
    e.preventDefault();
    composer?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  }
});

async function sendMessage(text) {
  if (!currentId) return;

  let imgUrl = null;
  const hasImage = !!pendingImageFile;
  const imgFile = pendingImageFile;
  clearImagePreview();

  // Push my message to thread
  pushMyMsg(text, imgUrl);

  if (currentType === 'friend') {
    // Upload image first if any
    let uploadedUrl = null;
    if (imgFile) {
      try {
        toast('📤 Subiendo imagen…', 3000);
        uploadedUrl = await uploadImage(imgFile);
        toast('✅ Imagen enviada');
      } catch(err) {
        toast('❌ Error subiendo imagen');
        console.error(err); return;
      }
    }
    if (text || uploadedUrl) await sendFriendMessage(text || null, uploadedUrl);
  } else {
    // Bot chat - handle image locally (just show it)
    if (imgFile && !text) return; // no reply to image from bot
    if (!text) return;
    const bot = BOT_CONTACTS.find(c => c.id === currentId);
    if (!bot) return;
    showTypingIndicator();
    setTimeout(() => {
      removeTypingIndicator();
      const reply = computeBotReply(bot, text);
      pushPeer(bot, reply);
      threadScrollToEnd();
    }, 600 + Math.random() * 800);
  }
}

/* ──────────────────────────────────────────────────────
   PUSH MESSAGES UI
   ────────────────────────────────────────────────────── */
function pushMyMsg(text, imgUrl) {
  const s = getSettings();
  const av = s.emojiAvatar || myProfile.avatar || '👤';
  const avatarHTML = av.startsWith('http') || av.includes('/')
    ? `<div class="avatar"><img src="${esc(av)}" alt="" /></div>`
    : `<div class="avatar" style="font-size:1rem">${esc(av)}</div>`;

  const emptyHint = $('#thread .empty-hint');
  if (emptyHint) emptyHint.remove();

  const node = document.createElement('div');
  node.className = `msg me ${s.compact ? 'compact' : ''}`;
  let bubble = '';
  if (pendingImageUrl && text) {
    bubble = `<img src="${esc(pendingImageUrl)}" class="chat-image" alt="imagen enviada"/><div class="text">${formatText(text)}</div>`;
  } else if (pendingImageUrl) {
    bubble = `<img src="${esc(pendingImageUrl)}" class="chat-image" alt="imagen enviada"/>`;
  } else {
    bubble = `<div class="text">${formatText(text)}</div>`;
  }
  node.innerHTML = `
    ${avatarHTML}
    <div class="bubble">
      ${bubble}
      <div class="meta">${timeNow()} <span class="read-ticks sent">✓✓</span></div>
    </div>`;
  $('#thread').appendChild(node);
  threadScrollToEnd();
}

function pushPeer(c, content) {
  const s = getSettings();
  const avatarHTML = renderAvatarEl(c, 32);
  const emptyHint = $('#thread .empty-hint');
  if (emptyHint) emptyHint.remove();

  const node = document.createElement('div');
  node.className = `msg peer ${s.compact ? 'compact' : ''}`;

  let bubbleContent = '';
  if (typeof content === 'string') {
    bubbleContent = `<div class="text">${formatText(content)}</div>`;
  } else if (content?.type === 'image') {
    bubbleContent = `<img src="${esc(content.url)}" alt="imagen" class="chat-image" onclick="window.open('${esc(content.url)}','_blank')" />`;
  } else if (content?.type === 'audio') {
    bubbleContent = `<audio controls src="${esc(content.url)}" class="chat-audio"></audio>`;
  } else if (content?.type === 'video') {
    bubbleContent = `<video controls class="chat-video"><source src="${esc(content.url)}" type="video/mp4"></video>`;
  } else if (content?.type === 'pdf') {
    bubbleContent = `<a href="${esc(content.url)}" target="_blank" class="chat-file">📄 Ver PDF</a>`;
  }

  node.innerHTML = `
    ${avatarHTML}
    <div class="bubble">
      ${bubbleContent}
      <div class="meta">${timeNow()}</div>
    </div>`;
  $('#thread').appendChild(node);
  threadScrollToEnd();
}

/* ──────────────────────────────────────────────────────
   TYPING INDICATOR
   ────────────────────────────────────────────────────── */
function showTypingIndicator() {
  if (typingNode) return;
  typingNode = document.createElement('div');
  typingNode.className = 'typing';
  typingNode.innerHTML = `<span class="dots"><span class="dot"></span><span class="dot"></span><span class="dot"></span></span><small class="muted">escribiendo…</small>`;
  $('#thread').appendChild(typingNode);
  threadScrollToEnd();
}
function removeTypingIndicator() {
  if (!typingNode) return;
  typingNode.remove(); typingNode = null;
}

/* ──────────────────────────────────────────────────────
   EMOJI PANEL
   ────────────────────────────────────────────────────── */
const EMOJIS = {
  smileys:['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','😉','😍','😘','😜','🤔','😎','😢','😭','😡','😱','💀'],
  animals:['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐺','🦋'],
  food:['🍏','🍎','🍊','🍋','🍌','🍉','🍇','🍓','🍒','🍍','🥭','🍕','🍔','🍟','🌭','🍣','🍪'],
  activity:['⚽️','🏀','🏈','⚾️','🎾','🎮','🎲','🎤','🎧','🎬','🎯','🎪'],
  hearts:['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💖','💘','💝'],
};
function loadEmojis(cat) {
  const ec = $('#emojiContent'); if (!ec) return;
  ec.innerHTML = (EMOJIS[cat]||[]).map(e=>`<span>${e}</span>`).join('');
  $$('.emoji-header button').forEach(b=>b.classList.remove('active'));
  $(`[data-category="${cat}"]`)?.classList.add('active');
}
$('#btnEmoji')?.addEventListener('click', () => {
  const p = $('#emojiPanel'); p.classList.toggle('hidden');
  if (!p.classList.contains('hidden')) loadEmojis('smileys');
});
$('#emojiContent')?.addEventListener('click', e => {
  if (e.target.tagName === 'SPAN') { msgInput.value += e.target.textContent; msgInput.focus(); }
});
$$('.emoji-header button').forEach(b => b.addEventListener('click', () => loadEmojis(b.dataset.category)));
document.addEventListener('click', e => {
  const ep = $('#emojiPanel');
  if (ep && !ep.contains(e.target) && e.target !== $('#btnEmoji')) ep.classList.add('hidden');
});

/* ──────────────────────────────────────────────────────
   SEARCH
   ────────────────────────────────────────────────────── */
$('#searchContacts')?.addEventListener('input', () => renderAllContacts());

/* ──────────────────────────────────────────────────────
   CHAT HEADER BUTTONS
   ────────────────────────────────────────────────────── */
$('#btnInfo')?.addEventListener('click', () => {
  if (!currentId) { toast('Selecciona un contacto'); return; }
  const friend = friendContacts.find(c => c.id === currentId);
  const bot = BOT_CONTACTS.find(c => c.id === currentId);
  if (friend) openFriendInfo(friend);
  else if (bot) openBotInfo(bot);
});

$('#btnPin')?.addEventListener('click', () => {
  if (!currentId) return;
  if (pinned.has(currentId)) { pinned.delete(currentId); toast('Desanclado'); }
  else { pinned.add(currentId); toast('📌 Anclado'); }
  renderAllContacts();
});

$('#btnMute')?.addEventListener('click', () => {
  if (!currentId) return;
  if (muted.has(currentId)) { muted.delete(currentId); toast('🔔 Sonido activado'); }
  else { muted.add(currentId); toast('🔕 Silenciado'); }
});

function openFriendInfo(c) {
  $('#modalTitle').textContent = c.name;
  $('#modalBody').innerHTML = `
    <div class="modal-grid">
      <div class="modal-block">
        <h4>Perfil</h4>
        <p style="text-align:center;font-size:2.5rem;margin:8px 0">${esc(c.avatar)}</p>
        <p><strong>Nombre:</strong> ${esc(c.name)}</p>
        <p><strong>Título:</strong> ${esc(c.alias)}</p>
        <p><strong>Player ID:</strong> <code style="font-family:monospace;color:#a5e9ba">${esc(c.playerId||'—')}</code></p>
      </div>
      <div class="modal-block">
        <h4>Estado</h4>
        <p><strong>Conexión:</strong> ${c.online?'🟢 En línea':'⚫ Desconectado'}</p>
        <p><strong>Última vez:</strong> ${c.online?'Ahora':timeAgo(c.lastSeen)}</p>
      </div>
    </div>`;
  openModal('#contactModal');
}

function openBotInfo(c) {
  $('#modalTitle').textContent = c.name;
  $('#modalBody').innerHTML = `
    <div class="modal-grid">
      <div class="modal-block">
        <h4>Perfil</h4>
        <p><strong>Alias:</strong> ${esc(c.alias)}</p>
      </div>
      <div class="modal-block">
        <h4>Estado</h4>
        <p>${c.online?'🟢 En línea':'⚫ Desconectado'}</p>
      </div>
      <div class="modal-block full">
        <h4>Notas</h4>
        <p>${esc(c.desc)}</p>
      </div>
    </div>`;
  openModal('#contactModal');
}

/* ──────────────────────────────────────────────────────
   MODALS
   ────────────────────────────────────────────────────── */
function openModal(sel) {
  const m = $(sel); if (!m) return;
  m.classList.add('show');
  m.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
}
function closeModal(sel) {
  const m = $(sel); if (!m) return;
  m.classList.remove('show');
  m.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
}

$('#modalOverlay')?.addEventListener('click', () => closeModal('#contactModal'));
$('#modalClose')?.addEventListener('click', () => closeModal('#contactModal'));
$('#modalAction')?.addEventListener('click', () => closeModal('#contactModal'));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeModal('#contactModal'); closeModal('#settingsModal'); closeModal('#statusCreatorModal'); }
});

/* ──────────────────────────────────────────────────────
   STATUS SYSTEM
   ────────────────────────────────────────────────────── */
function loadFriendStatuses() {
  statusUnsubscribes.forEach(u => u()); statusUnsubscribes = [];

  // My own statuses
  const myUnsub = onSnapshot(doc(db,'userStatuses',currentUser.uid), snap => {
    if (snap.exists()) {
      const now = new Date();
      myStatuses = (snap.data().stories || []).filter(s => new Date(s.expiresAt) > now);
    } else { myStatuses = []; }
    renderStoriesBar();
  });
  statusUnsubscribes.push(myUnsub);

  // Friend statuses
  friendContacts.forEach(f => {
    const unsub = onSnapshot(doc(db,'userStatuses',f.uid), snap => {
      const now = new Date();
      if (snap.exists()) {
        friendStatuses[f.uid] = (snap.data().stories || []).filter(s => new Date(s.expiresAt) > now);
      } else { friendStatuses[f.uid] = []; }
      renderStoriesBar();
    });
    statusUnsubscribes.push(unsub);
  });
}

function renderStoriesBar() {
  const container = $('#storiesContainer'); if (!container) return;
  let html = '';

  // My status bubble
  const myHasStories = myStatuses.length > 0;
  const s = getSettings();
  const myAv = s.emojiAvatar || myProfile.avatar || '🌙';
  const myAvHtml = myAv.startsWith('http') || myAv.includes('/')
    ? `<img src="${esc(myAv)}" alt="yo" />`
    : `<div class="story-ring-emoji">${esc(myAv)}</div>`;
  html += `
    <div class="story-bubble my-status ${myHasStories?'unseen':''}" data-story-uid="__me" title="Mi estado">
      <div class="story-ring">${myAvHtml}</div>
      <div class="story-label">Yo</div>
    </div>`;

  // Bot stories
  const botsByContact = {};
  BOT_STORIES.forEach(s => {
    if (!botsByContact[s.contact]) botsByContact[s.contact] = [];
    botsByContact[s.contact].push(s);
  });
  Object.entries(botsByContact).forEach(([cid, stories]) => {
    const bot = BOT_CONTACTS.find(b => b.id === cid); if (!bot) return;
    const anyUnseen = stories.some(s => !s.seen);
    html += `
      <div class="story-bubble ${anyUnseen?'unseen':'seen'}" data-story-contact="${esc(cid)}" title="${esc(bot.name)}">
        <div class="story-ring"><img src="${esc(bot.avatar)}" alt="${esc(bot.name)}" /></div>
        <div class="story-label">${esc(bot.name.split(' ')[0])}</div>
      </div>`;
  });

  // Friend statuses
  friendContacts.forEach(f => {
    const stories = friendStatuses[f.uid] || [];
    if (!stories.length) return;
    const anyUnseen = stories.some(s => !seenStatuses[s.id]);
    const avEl = f.avatarType === 'img'
      ? `<img src="${esc(f.avatar)}" alt="${esc(f.name)}" />`
      : `<div class="story-ring-emoji">${esc(f.avatar)}</div>`;
    html += `
      <div class="story-bubble ${anyUnseen?'unseen':'seen'}" data-story-uid="${esc(f.uid)}" title="${esc(f.name)}">
        <div class="story-ring">${avEl}</div>
        <div class="story-label">${esc(f.name.split(' ')[0])}</div>
      </div>`;
  });

  container.innerHTML = html;

  // Bind click
  $$('.story-bubble', container).forEach(el => {
    el.addEventListener('click', () => {
      const cid = el.dataset.storyContact;
      const uid = el.dataset.storyUid;
      if (uid === '__me') {
        if (myStatuses.length) openStatusViewer(myStatuses, myProfile.nombre || 'Yo', myAv, true);
        else openStatusCreator();
      } else if (cid) {
        const stories = BOT_STORIES.filter(s => s.contact === cid);
        const bot = BOT_CONTACTS.find(b => b.id === cid);
        if (bot && stories.length) openStatusViewer(stories, bot.name, bot.avatar, false, true);
      } else if (uid) {
        const stories = friendStatuses[uid] || [];
        const f = friendContacts.find(x => x.uid === uid);
        if (f && stories.length) openStatusViewer(stories, f.name, f.avatar, false);
      }
    });
  });
}

// Status viewer
let viewerList = [], viewerIndex = 0, viewerTimer = null;

function openStatusViewer(stories, name, avatar, isOwn, isBot = false) {
  viewerList = stories; viewerIndex = 0;
  const vn = $('#viewerName'); if (vn) vn.textContent = name;
  const va = $('#viewerAvatar');
  if (va) {
    if (avatar.startsWith('http') || avatar.includes('/')) { va.src = avatar; va.style.fontSize = ''; }
    else { va.src = ''; va.style.fontSize = '1.8rem'; va.alt = avatar; va.title = avatar; }
  }
  const viewer = $('#storyViewer'); if (!viewer) return;
  viewer.style.display = 'flex';
  loadViewerStory();
}

function loadViewerStory() {
  const s = viewerList[viewerIndex]; if (!s) return;
  clearTimeout(viewerTimer);
  const content = $('#storyContent'); if (!content) return;
  content.style.opacity = '0';
  setTimeout(() => {
    let html = '';
    if (s.type === 'video') html = `<video src="${esc(s.url)}" autoplay controls class="" style="max-width:90%;max-height:70vh;border-radius:16px"></video>`;
    else if (s.type === 'image' && s.url) html = `<img src="${esc(s.url)}" alt="" />`;
    else html = '';
    const caption = s.text || s.caption || '';
    if (caption) {
      if (s.type === 'text' || (!s.url && s.type !== 'audio')) {
        html = `<div class="story-text-card" style="background:${esc(s.bgColor||'#1a2a1e')}"><p>${esc(caption).replace(/\n/g,'<br>')}</p></div>`;
      } else {
        html += `<p class="story-caption">${esc(caption).replace(/\n/g,'<br>')}</p>`;
      }
    }
    if (s.type === 'audio') html = `<audio src="${esc(s.url)}" autoplay controls style="margin-bottom:16px"></audio>${caption ? `<p class="story-caption">${esc(caption)}</p>` : ''}`;
    content.innerHTML = html;
    content.style.opacity = '1';

    // Mark as seen
    seenStatuses[s.id] = true;
    localStorage.setItem('mv_seen_statuses', JSON.stringify(seenStatuses));
    if (!s.isBot) {
      const uid = viewerList._uid;
      if (uid) updateDoc(doc(db,'userStatuses',uid), { [`stories.${s.id}.views`]: arrayUnion(currentUser.uid) }).catch(()=>{});
    }

    // Time info
    if (s.createdAt) $('#viewerTime').textContent = timeAgo(s.createdAt);
    const vs = s.views?.length || 0; $('#viewerViews').textContent = vs > 0 ? `${vs} vista${vs>1?'s':''}` : '';

    // Progress bars
    buildViewerBars();
    const dur = s.duration || 5000;
    viewerTimer = setTimeout(() => nextViewerStory(), dur);
  }, 100);
}

function buildViewerBars() {
  const pb = $('#progressBars'); if (!pb) return;
  pb.innerHTML = '';
  viewerList.forEach((_, i) => {
    const bar = document.createElement('div');
    if (i === viewerIndex) {
      const line = document.createElement('div');
      line.className = 'progress-line';
      const dur = viewerList[viewerIndex]?.duration || 5000;
      line.style.animationDuration = dur + 'ms';
      bar.appendChild(line);
    }
    pb.appendChild(bar);
  });
}

function nextViewerStory() {
  if (viewerIndex < viewerList.length - 1) { viewerIndex++; loadViewerStory(); }
  else closeStatusViewer();
}
function prevViewerStory() {
  if (viewerIndex > 0) { viewerIndex--; loadViewerStory(); }
}
function closeStatusViewer() {
  const v = $('#storyViewer'); if (v) v.style.display = 'none';
  clearTimeout(viewerTimer);
  renderStoriesBar();
}

$('.next-story')?.addEventListener('click', nextViewerStory);
$('.prev-story')?.addEventListener('click', prevViewerStory);
$('#closeViewer')?.addEventListener('click', closeStatusViewer);
$('.scroll-right')?.addEventListener('click', () => { const c = $('#storiesContainer'); if(c) c.scrollLeft += 200; });
$('.scroll-left')?.addEventListener('click', () => { const c = $('#storiesContainer'); if(c) c.scrollLeft -= 200; });

/* ──────────────────────────────────────────────────────
   STATUS CREATOR
   ────────────────────────────────────────────────────── */
let statusSelectedColor = '#1a2a1e';
let statusSelectedImg = null;
let statusSelectedImgUrl = null;

function openStatusCreator() {
  statusSelectedColor = '#1a2a1e';
  statusSelectedImg = null; statusSelectedImgUrl = null;
  const ti = $('#statusTextInput'); if (ti) ti.value = '';
  const ci = $('#statusImgCaption'); if (ci) ci.value = '';
  const ip = $('#statusImgPreview'); if (ip) { ip.src=''; ip.classList.add('hidden'); }
  const preview = $('#statusTextPreview'); if (preview) preview.style.background = statusSelectedColor;
  const prev = $('#statusTextPreviewContent'); if (prev) prev.textContent = 'Tu estado aquí…';
  openModal('#statusCreatorModal');
}

$('#btnAddStatus')?.addEventListener('click', openStatusCreator);
$('#statusCreatorOverlay')?.addEventListener('click', () => closeModal('#statusCreatorModal'));
$('#statusCreatorClose')?.addEventListener('click', () => closeModal('#statusCreatorModal'));
$('#statusCreatorCancel')?.addEventListener('click', () => closeModal('#statusCreatorModal'));

// Tabs
$$('.status-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.status-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    $$('.status-tab-content').forEach(c => c.classList.add('hidden'));
    $(`#statusTab${btn.dataset.tab.charAt(0).toUpperCase()+btn.dataset.tab.slice(1)}`)?.classList.remove('hidden');
  });
});

// Text preview
$('#statusTextInput')?.addEventListener('input', e => {
  const val = e.target.value || 'Tu estado aquí…';
  const prev = $('#statusTextPreviewContent'); if (prev) prev.textContent = val;
  const cnt = $('#statusCharCount'); if (cnt) cnt.textContent = e.target.value.length;
});

// Color picker
$$('.color-swatch').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.color-swatch').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    statusSelectedColor = btn.dataset.color;
    const p = $('#statusTextPreview'); if (p) p.style.background = statusSelectedColor;
  });
});

// Image drop area
$('#statusImgDrop')?.addEventListener('click', () => $('#statusImgInput')?.click());
$('#statusImgInput')?.addEventListener('change', e => {
  const file = e.target.files?.[0]; if (!file) return;
  statusSelectedImg = file;
  const reader = new FileReader();
  reader.onload = ev => {
    statusSelectedImgUrl = ev.target.result;
    const p = $('#statusImgPreview');
    if (p) { p.src = ev.target.result; p.classList.remove('hidden'); }
    const d = $('#statusImgDrop'); if (d) d.style.display = 'none';
  };
  reader.readAsDataURL(file);
});

$('#statusCreatorPublish')?.addEventListener('click', async () => {
  const btn = $('#statusCreatorPublish');
  btn.textContent = '⏳ Publicando…'; btn.disabled = true;
  try {
    const activeTab = $('.status-tab.active')?.dataset.tab || 'text';
    if (activeTab === 'text') {
      const text = $('#statusTextInput')?.value.trim();
      if (!text) { toast('Escribe algo primero'); btn.textContent='Publicar Estado'; btn.disabled=false; return; }
      await createStatus('text', text, '', statusSelectedColor);
    } else {
      if (!statusSelectedImg) { toast('Selecciona una imagen'); btn.textContent='Publicar Estado'; btn.disabled=false; return; }
      const caption = $('#statusImgCaption')?.value.trim() || '';
      toast('📤 Subiendo…', 3000);
      const path = `statuses/${currentUser.uid}/${Date.now()}_${statusSelectedImg.name.replace(/[^a-zA-Z0-9._]/g,'_')}`;
      const r = sRef(storage, path);
      await uploadBytes(r, statusSelectedImg);
      const url = await getDownloadURL(r);
      await createStatus('image', url, caption, '');
    }
    closeModal('#statusCreatorModal');
    toast('✅ Estado publicado (válido 15 días)');
  } catch(e) { toast('❌ Error publicando estado'); console.error(e); }
  btn.textContent = 'Publicar Estado'; btn.disabled = false;
});

async function createStatus(type, content, caption, bgColor) {
  const id = `st_${Date.now()}`;
  const now = new Date();
  const exp = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
  const story = { id, type, content, caption, bgColor, createdAt: now.toISOString(), expiresAt: exp.toISOString(), views: [] };
  await setDoc(doc(db,'userStatuses',currentUser.uid), { stories: arrayUnion(story) }, { merge: true });
}

/* ──────────────────────────────────────────────────────
   SETTINGS
   ────────────────────────────────────────────────────── */
$('#btnSettings')?.addEventListener('click', () => openModal('#settingsModal'));
$('#settingsOverlay')?.addEventListener('click', () => closeModal('#settingsModal'));
$('#settingsClose')?.addEventListener('click', () => closeModal('#settingsModal'));

// Nav sections
$$('.sett-nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.sett-nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    $$('.sett-section').forEach(s => s.classList.remove('active'));
    $(`#sett-${btn.dataset.section}`)?.classList.add('active');
  });
});

function loadSettingsUI() {
  const s = getSettings();
  if ($('#settSound')) $('#settSound').checked = s.sound;
  if ($('#settBadge')) $('#settBadge').checked = s.badge;
  if ($('#settCompact')) $('#settCompact').checked = s.compact;
  if ($('#settEnterSend')) $('#settEnterSend').checked = s.enterSend;
  if ($('#settLastSeen')) $('#settLastSeen').checked = s.lastSeen;
  if ($('#settReadReceipts')) $('#settReadReceipts').checked = s.readReceipts;
  if ($('#settStoryVisibility')) $('#settStoryVisibility').value = s.storyVisibility;
  if ($('#settProfileName')) $('#settProfileName').value = s.profileName;
  if ($('#settStatusMsg')) $('#settStatusMsg').value = s.statusMsg;

  // Font size radio
  const fr = $(`input[name="fontSize"][value="${s.fontSize}"]`);
  if (fr) fr.checked = true;

  // Wallpaper
  $$('.wp-opt').forEach(b => b.classList.toggle('active', b.dataset.wp === s.wallpaper));

  // Emoji avatar picker
  const EMOJI_AVOS = ['🌙','⚔️','🛡️','🗡️','🧪','📚','🌿','💎','🔮','🦊','🐺','🌟'];
  const picker = $('#emojiAvatarPicker');
  if (picker) {
    picker.innerHTML = EMOJI_AVOS.map(e =>
      `<button class="emoji-av-btn ${s.emojiAvatar===e?'active':''}" data-emoji="${e}">${e}</button>`
    ).join('');
    $$('.emoji-av-btn', picker).forEach(b => b.addEventListener('click', () => {
      $$('.emoji-av-btn', picker).forEach(x => x.classList.remove('active'));
      b.classList.add('active');
    }));
  }

  // Player ID + email
  const pid = localStorage.getItem('mv_player_id') || myProfile.player_id || '';
  if ($('#settPlayerId')) $('#settPlayerId').textContent = pid || '—';
  if ($('#settEmail')) $('#settEmail').textContent = myProfile.email || currentUser?.email || '—';
}

// Save profile
$('#settSaveProfile')?.addEventListener('click', async () => {
  const name = $('#settProfileName')?.value.trim() || '';
  const statusMsg = $('#settStatusMsg')?.value.trim() || 'Aqui en mi World';
  const activeEmoji = $('.emoji-av-btn.active')?.dataset.emoji || getSettings().emojiAvatar;
  const s = getSettings();
  s.profileName = name;
  s.statusMsg = statusMsg;
  s.emojiAvatar = activeEmoji;
  saveSettings(s);
  if ($('#myDisplayName')) $('#myDisplayName').textContent = name || myProfile.nombre || 'Jugador';
  if ($('#myStatusText')) $('#myStatusText').textContent = statusMsg;
  const aw = $('#myAvatarWrap');
  if (aw) aw.innerHTML = `<div class="avatar emoji-av" style="width:42px;height:42px;font-size:1.3rem">${esc(activeEmoji)}</div>`;
  try {
    await updateDoc(doc(db,'users',currentUser.uid), { nombre: name || myProfile.nombre, avatar: activeEmoji });
  } catch {}
  toast('✅ Perfil actualizado');
});

// Toggle settings save
['settSound','settBadge','settCompact','settEnterSend','settLastSeen','settReadReceipts'].forEach(id => {
  $(`#${id}`)?.addEventListener('change', e => {
    const s = getSettings();
    const key = id.replace('sett','').charAt(0).toLowerCase() + id.replace('sett','').slice(1);
    // map IDs to keys
    const keyMap = {settSound:'sound',settBadge:'badge',settCompact:'compact',settEnterSend:'enterSend',settLastSeen:'lastSeen',settReadReceipts:'readReceipts'};
    s[keyMap[id]] = e.target.checked;
    saveSettings(s);
  });
});

$$('input[name="fontSize"]').forEach(r => r.addEventListener('change', e => {
  const s = getSettings(); s.fontSize = e.target.value; saveSettings(s);
}));

$$('.wp-opt').forEach(btn => btn.addEventListener('click', () => {
  $$('.wp-opt').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const s = getSettings(); s.wallpaper = btn.dataset.wp; saveSettings(s);
}));

$('#settStoryVisibility')?.addEventListener('change', e => {
  const s = getSettings(); s.storyVisibility = e.target.value; saveSettings(s);
});

$('#settCopyPlayerId')?.addEventListener('click', () => {
  const pid = $('#settPlayerId')?.textContent || '';
  if (pid && pid !== '—') { navigator.clipboard.writeText(pid).then(() => toast('📋 Player ID copiado')); }
});

$('#settRequestNotif')?.addEventListener('click', () => {
  Notification.requestPermission().then(p => toast(p === 'granted' ? '🔔 Notificaciones activadas' : '❌ Permiso denegado'));
});

$('#settClearBotChats')?.addEventListener('click', () => {
  if (currentType === 'bot') { $('#thread').innerHTML = ''; }
  toast('🗑️ Chats de bots limpiados');
});

$('#settDeleteStatuses')?.addEventListener('click', async () => {
  try {
    await setDoc(doc(db,'userStatuses',currentUser.uid), { stories: [] });
    myStatuses = [];
    renderStoriesBar();
    toast('🗑️ Estados eliminados');
  } catch { toast('❌ Error eliminando estados'); }
});

$('#settSignOut')?.addEventListener('click', async () => {
  await updatePresenceOffline();
  await signOut(auth);
  window.location.href = 'index.html';
});

/* ──────────────────────────────────────────────────────
   NOTIFICATION SOUND
   ────────────────────────────────────────────────────── */
function playNotifSound() {
  const s = getSettings();
  if (!s.sound) return;
  if (muted.has(currentId)) return;
  try {
    const a = $('#notifSound');
    if (a) { a.currentTime = 0; a.play().catch(()=>{}); }
  } catch {}
}

/* ──────────────────────────────────────────────────────
   MUSIC
   ────────────────────────────────────────────────────── */
window.toggleMusic = function() {
  const audio = $('#bg-music');
  const btn = $('.floating-music');
  if (!audio || !btn) return;
  if (audio.paused) {
    audio.play().then(() => { btn.classList.add('active'); localStorage.setItem('music','on'); }).catch(()=>{});
  } else {
    audio.pause(); btn.classList.remove('active'); localStorage.setItem('music','off');
  }
};

window.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('music') === 'on') {
    const a = $('#bg-music'), b = $('.floating-music');
    a?.play().then(() => b?.classList.add('active')).catch(()=>{});
  }
});

/* ──────────────────────────────────────────────────────
   SIMULATE BOT NOTIFICATIONS (optional)
   ────────────────────────────────────────────────────── */
setInterval(() => {
  const pool = BOT_CONTACTS.filter(c => c.id !== currentId);
  if (!pool.length) return;
  const c = pool[Math.floor(Math.random() * pool.length)];
  if (muted.has(c.id)) return;
  const s = getSettings();
  if (!s.badge) return;
  c.unread = Math.min(99, (c.unread || 0) + 1);
  renderBots();
}, 18000 + Math.random() * 12000);