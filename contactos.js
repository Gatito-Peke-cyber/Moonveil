/* ================================================================
   Moonveil Portal — Contactos v4
   UPDATED: group description · save icon btn · kick member · creation date
   ================================================================ */
import { auth, db, storage } from './firebase.js';
import {
  doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc,
  collection, onSnapshot, query, orderBy, limit,
  serverTimestamp, arrayUnion, arrayRemove, getDocs, where
} from 'https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js';
/* Firebase Storage ya no se usa — imágenes van a Cloudinary */
/* import { ref as sRef, uploadBytes, getDownloadURL } from '...storage.js'; */

/* ── Cloudinary config ── */
const CLOUDINARY_CLOUD  = 'dmi37poer';
const CLOUDINARY_PRESET = 'moonveil_uploads'; // Unsigned preset (crea en Cloudinary Dashboard > Settings > Upload > Upload presets > Signing Mode: Unsigned)

/* ── Title map ── */
const TM = {
  tl_novato:{n:'NOVATO',r:'comun'},tl_explorador:{n:'EXPLORADOR',r:'comun'},
  tl_combatiente:{n:'COMBATIENTE',r:'raro'},tl_guerrero:{n:'GUERRERO',r:'raro'},
  tl_elite:{n:'ÉLITE',r:'epico'},tl_campeon:{n:'CAMPEÓN',r:'epico'},
  tl_maestro:{n:'MAESTRO',r:'legendario'},tl_leyenda:{n:'LEYENDA DEL PORTAL',r:'mitico'},
  tl_constante:{n:'CONSTANTE',r:'comun'},tl_perseverante:{n:'PERSEVERANTE',r:'raro'},
  tl_incansable:{n:'INCANSABLE',r:'legendario'},tl_cazador:{n:'CAZADOR',r:'comun'},
  tl_coleccionista:{n:'COLECCIONISTA',r:'raro'},tl_supremo_col:{n:'SUPREMO COLECCIONISTA',r:'legendario'},
  tl_aventurero:{n:'AVENTURERO',r:'comun'},tl_veterano:{n:'VETERANO DE GUERRA',r:'raro'},
  tl_sdc:{n:'SEÑOR DE LA GUERRA',r:'epico'},tl_rico:{n:'ADINERADO',r:'raro'},
  tl_magnate:{n:'MAGNATE DEL XP',r:'epico'},tl_dios:{n:'DIOS DEL PORTAL',r:'mitico'},
  tl_oscuro:{n:'SEÑOR OSCURO',r:'legendario'},tl_eterno:{n:'GUERRERO ETERNO',r:'legendario'},
  tl_absoluto:{n:'EL ABSOLUTO',r:'mitico'},tl_nexo_caos:{n:'NEXO DEL CAOS',r:'mitico'},
  tl_pionero_mar2026:{n:'PIONERO DE LUNA',r:'especial'},
};

/* ── Helpers ── */
const $ = (q, c = document) => c.querySelector(q);
const $$ = (q, c = document) => [...c.querySelectorAll(q)];
const esc = s => String(s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const timeNow = () => new Intl.DateTimeFormat('es-PE',{hour:'2-digit',minute:'2-digit'}).format(new Date());
const timeAgo = iso => {
  if (!iso) return '—';
  const d = Date.now() - new Date(iso).getTime();
  if (d<60000) return 'ahora';
  if (d<3600000) return `hace ${Math.floor(d/60000)}m`;
  if (d<86400000) return `hace ${Math.floor(d/3600000)}h`;
  return `hace ${Math.floor(d/86400000)}d`;
};
const fmtText = s => esc(String(s)).replace(/\n/g,'<br>').replace(/(https?:\/\/[^\s<&]+)/g,'<a href="$1" target="_blank" rel="noopener">$1</a>');
const chatId = (a,b) => [a,b].sort().join('_');
const lsGet = k => { try{return JSON.parse(localStorage.getItem(k));}catch{return null;} };
const fmtDateLong = iso => {
  if(!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('es-PE',{day:'2-digit',month:'long',year:'numeric'});
  } catch { return '—'; }
};

/* ── Settings ── */
const S_DEF = {sound:true,badge:true,fontSize:'normal',wallpaper:'default',compact:false,enterSend:true,lastSeen:true,readReceipts:true,storyVisibility:'friends',profileName:'',statusMsg:'Aqui en mi World',emojiAvatar:'🌙'};
const getS = () => { try{return {...S_DEF,...JSON.parse(localStorage.getItem('mv_chat_settings')||'{}')};}catch{return{...S_DEF};} };
const saveS = s => { localStorage.setItem('mv_chat_settings',JSON.stringify(s)); applySettings(s); };
function applySettings(s=getS()) {
  const sz = s.fontSize==='small'?'14px':s.fontSize==='large'?'18px':'16px';
  document.documentElement.style.setProperty('--msg-font',sz);
  const t = $('#thread'); if(!t) return;
  const wps = {default:'',green:'wp-green',purple:'wp-purple',blue:'wp-blue',dark:'wp-dark'};
  t.className = 'chat-thread' + (s.compact?' compact':'') + (wps[s.wallpaper]?' '+wps[s.wallpaper]:'');
}

/* ── Toast ── */
function toast(msg,type='') {
  const t=$('#toast'); if(!t) return;
  t.textContent=msg; t.className=`show ${type}`;
  clearTimeout(t._t); t._t=setTimeout(()=>t.className='',2500);
}

/* ── Stars ── */
function initStars() {
  const c=$('#stars-canvas'); if(!c) return;
  const ctx=c.getContext('2d'), dpi=Math.max(1,devicePixelRatio||1);
  const COLS=['#30d158','#40ff6e','#ffffff','#00e5ff','#f5c518'];
  let W,H,stars;
  const init=()=>{ W=c.width=innerWidth*dpi; H=c.height=innerHeight*dpi; stars=Array.from({length:100},()=>({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.4+0.4,o:Math.random()*.4+.06,s:Math.random()*.3+.06,ci:Math.floor(Math.random()*COLS.length)})); };
  const tick=()=>{ ctx.clearRect(0,0,W,H); stars.forEach(s=>{s.y-=s.s;if(s.y<0){s.y=H;s.x=Math.random()*W;}ctx.globalAlpha=s.o;ctx.fillStyle=COLS[s.ci];ctx.fillRect(s.x,s.y,s.r,s.r);}); ctx.globalAlpha=1; requestAnimationFrame(tick); };
  init(); tick(); addEventListener('resize',init);
}

/* ── BOT DATA ── */
const BOTS = [
  {id:'c1',name:'Sand Brill',alias:'███████',desc:'Hola, tienes esmeraldas para darme.',avatar:'vill/vill1.jpg',aT:'img',gold:true,online:true,unread:2,kind:'options',qr:['¿Hola?','E11-25','Esmeralda','Foto','Video'],
    brain:{prompt:'¿Qué necesitas? Bueno yo necesito esmeraldas.',fallback:'No entiendo pero con esmeraldas se soluciona...',opts:[
      {l:'¿Hola?',r:'Hola!, supongo...Que paso...'},{l:'E11-25',r:'Uy! Tu sabes que es eso...'},{l:'Esmeralda',r:'Me gusta, me encanta.'},
      {l:'Hola',r:'Pues hola, y que tal supongo.'},{l:'Bien',r:'Que bien, ahora me das esmeraldas.'},{l:'Mal',r:'Creo que tengo tu medicina, pues tradearme.'},
      {l:'Sand Brill',r:'Quien es, parece una gran persona.'},{l:'Lobo',r:'Pues es bonito tener un lobito como perro, no.'},
      {l:'Kevin',r:'Shhh... JEJE, ni idea...'},{l:'Trato',r:'Si me das esmeraldas te doy 1 pan.'},
      {l:'Foto',r:{type:'image',url:'vill/vill1.jpg'}},{l:'Ajolote',r:{type:'image',url:'img/ajolote.gif'}},
      {l:'Audio',r:{type:'audio',url:'music/1234.mp3'}},{l:'Sand',r:{type:'audio',url:'ald/music1.mp3'}},
      {l:'🐶',r:'Runa!?...'},{l:'Video',r:{type:'video',url:'vill/wolfmine.mp4'}},
    ]}
  },
  {id:'c2',name:'Eduard Moss',alias:'M10-25',desc:'Pregunta sin remordimientos, colega.',avatar:'vill/villplains.jpg',aT:'img',gold:false,online:true,unread:0,kind:'keyword',qr:['Hola','Semillas','Tasks1'],
    brain:{fallback:'No entendi colega. Prueba con: "Hola"',kw:{hola:'Hola colega, que tal tu dia...',bien:'Me alegro colega.',mal:'No se sienta así, siempre podemos afrontarlo.',semillas:'Algo que le da vida a la agricultura.',tasks1:'Me podrias traer x6 stacks de patatas? Te compenso con x3 cobre.',gato:'Pues mi gato Polen es unico colega.',}}
  },
  {id:'c5',name:'Orik Vall',alias:'El mapitas',desc:'Me gusta hacer mapitas.',avatar:'vill/cartografo.jpg',aT:'img',gold:false,online:true,unread:0,kind:'keyword',qr:['Mapa','2012','Desconocido'],
    brain:{fallback:'Que necesitas my friend',kw:{mapa:'Si my friend, yo hago mapas.','ocultas algo':'Me estas difamando my friend.',2012:'Ese caso es muy extraño, no puedo confirmar.',desconocido:'Fue mencionado en mapas ████ durante siglos. Causo polemicas...',japon:'Isla en Japón desapareció del mar. Redescubierta en 2018.',hola:'Hola, que tuvieras un gran dia.',}}
  },
  {id:'c7',name:'Steven Moss',alias:'Librillero',desc:'Me gusta escribir mis aventuras.',avatar:'vill/bibliotecario.jpg',aT:'img',gold:false,online:false,unread:0,kind:'keyword',qr:['Rosa','Libro','Tasks1'],
    brain:{fallback:'¿Que quieres saber, alguna historia?',kw:{rosa:'Novela ambientada en una abadía medieval.',libro:'Hay muchos libros, cada uno te sumerge a un mundo.',leer:'Me gusta leer pero escribir es mi pasion.',hello:'Hi! How are you!',gato:'😸',tasks1:'Encuentra el libro amarillo con numeros raros. Te compenso x3 cobre.',}}
  },
  {id:'c10',name:'Kevin Dew',alias:'Asistente',desc:'Quiero ayudarte con todas tus dudas.',avatar:'vill/booktea.gif',aT:'img',gold:true,online:true,unread:0,kind:'options',qr:['Ayuda','Palabra()','Estado','?'],
    brain:{prompt:'¿En que te puedo ayudar hoy?',fallback:'Puedes escribir ?',opts:[
      {l:'Ayuda',r:'Cual es tu consulta.'},{l:'Palabra()',r:'Tasks, Place, Claim, Game, Book, Crafting, Animal, FAQ'},
      {l:'?',r:'Vale: Eventos, Juegos, Aldeanos, Web, Historia'},{l:'Eventos',r:'Los eventos activos llegarán a tu buzon.'},
      {l:'Aldeanos',r:'Algunos aldeanos tienen nombre y son claves para la historia.'},{l:'Historia',r:'La historia todavia no esta disponible.'},
      {l:'Tasks',r:'Tareas que algunos aldeanos piden con recompensas.'},{l:'Estado',r:'Todo en orden. ✅'},{l:'93',r:'...'},{l:'K',r:'...'},
    ]}
  },
  {id:'c11',name:'Guau!',alias:'El mas perron',desc:'Soy el perron de mi cuadra... Guau...',avatar:'vill/photowolf.jpg',aT:'img',gold:true,online:true,unread:99,kind:'options',qr:['Guau','Lobo','Perro'],
    brain:{prompt:'¿Guau?',fallback:'Guau!',opts:[
      {l:'Guau',r:'Hola! Guau.'},{l:'Guau?',r:'Guau?'},{l:'Hola',r:'Guau! 😸'},{l:'Bien',r:'Guauuuuuu...'},{l:'Mal',r:'Guau... 😿'},
      {l:'Lobo',r:'Guau...'},{l:'Perro',r:'Guau... 😎'},{l:'Octubre',r:'Auuuuu!!!'},{l:'31',r:'🐺'},{l:'Trato',r:'Guau!🙀'},
    ]}
  },
  {id:'c12',name:'David Kal',alias:'El Pequeñin',desc:'Seremos grandes algun dia, colegita...',avatar:'img/babyvillager.jpg',aT:'img',gold:false,online:true,unread:1,kind:'options',qr:['Hola','¿Estas Bien?','Dibujo'],
    brain:{prompt:'Hola, colegita',fallback:'Colegita, no te entendi, pero trato...',opts:[
      {l:'Hola',r:'Hola, como estas...'},{l:'Bien',r:'Que bien colegita'},{l:'Mal',r:'No digas eso colegita, tu eres alguien increible...'},
      {l:'¿Estas Bien?',r:'Si, colegita, ¿y tu?'},{l:'Amigo',r:'Si colegita, eres increible, se mejor cada dia...'},
      {l:'Dibujo',r:{type:'image',url:'dav/happyg2.jpg'}},{l:'Alex',r:{type:'image',url:'dav/alex1.jpg'}},
      {l:'cancion',r:{type:'audio',url:'dav/sleep.mp3'}},{l:'Adios',r:'Hasta luego colegita...'},{l:'Feliz',r:'Pues estamos feliz :D'},
    ]}
  },
  {id:'c14',name:'News!!',alias:'Aqui con las NEWS!!!!!',desc:'Aqui informamos nosotros...',avatar:'gif/news-villager.gif',aT:'img',gold:false,online:true,unread:0,kind:'options',qr:['News','Golem','Diamante','Fin'],
    brain:{prompt:'Aqui con las noticias, edicion matutina...',fallback:'No tenemos esa noticia.',opts:[
      {l:'News',r:'Hmm… bienvenidos. Hoy: ¿por qué los jugadores nunca duermen y abren cofres ajenos?'},
      {l:'Golem',r:'Hmm… emergencia: el golem de hierro ignoró a un zombi. Dice que estaba en su día libre.'},
      {l:'Diamante',r:'Hmm… gran confusión. Un jugador aseguró haber encontrado diamantes. Era solo lapislázuli.'},
      {l:'Panda',r:{type:'image',url:'gif/news-minecraft.gif'}},
      {l:'Fin',r:'Hmm… y así termina Aldeanos al Día. ¡Cuiden sus cultivos!'},
    ]}
  },
  {id:'c16',name:'Panda enthusiast',alias:'🎍🐼',desc:'Le gusta el bambu 🎍🐼',avatar:'imagen/panda1.gif',aT:'img',gold:false,online:true,unread:0,kind:'options',qr:['Bambu','Dormir','Panda'],
    brain:{prompt:'"¡BUENAS NOCHES! Yo... gordo, feliz y confundido. ¡Aplauso al bambú!" 🌿👏',fallback:'...',opts:[
      {l:'Bambu',r:'¡12 kilos al día! El cliente que los restaurantes temen.'},
      {l:'Dormir',r:'Si dormir fuera deporte olímpico, el panda tendría 27 medallas.'},
      {l:'Panda',r:'El panda sigue siendo influencer aunque esté en peligro de extinción.'},
      {l:'#GoodLife',r:{type:'image',url:'imagen/panda2.gif'}},
    ]}
  },
  {id:'c17',name:'Allay🎶',alias:'El angel musical',desc:'Volvamos a recordar...',avatar:'gif/minecraft-allay.gif',aT:'img',gold:true,online:true,unread:0,kind:'options',qr:['October','November','Sand Brill'],
    brain:{prompt:'🎶🎶🎶🎶',fallback:'Todavia no tenemos esa pista...',opts:[
      {l:'October',r:{type:'audio',url:'music/spooky.mp3'}},{l:'November',r:{type:'audio',url:'music/november.mp3'}},
      {l:'Sand Brill',r:{type:'audio',url:'ald/music1.mp3'}},{l:'Shop',r:{type:'audio',url:'music/1234.mp3'}},
    ]}
  },
];

const BOT_STORIES=[
  {id:'bst1',contact:'c1',type:'video',url:'video/stevevideo2.mp4',text:'Cuando encuentras una esmeralda,\nno celebras. Respiras hondo y sigues.',duration:16000,seen:false},
  {id:'bst2',contact:'c1',type:'image',url:'vill/vill1.jpg',text:'Que opinan de mi foto de perfil.',seen:false},
  {id:'bst3',contact:'c14',type:'image',url:'',text:'🟩 Minecraft Noticias – Edición Matutina',seen:false},
  {id:'bst4',contact:'c14',type:'image',url:'gif/creaking-minecraft.gif',text:'🟨 Última hora: varios creakings merodeando.',seen:false},
];
const seenStatuses=JSON.parse(localStorage.getItem('mv_seen_st')||'{}');
BOT_STORIES.forEach(s=>{if(seenStatuses[s.id])s.seen=true;});

/* ── STATE ── */
let CU=null, myProfile={};
let friendList=[], groupList=[];
let currentId=null, currentType=null, currentFriendUid=null, currentGroupId=null;
let msgUnsub=null, presenceUnsubs=[], statusUnsubs=[];
let myStatuses=[], friendStatuses={};
let pendingFile=null, pendingDataUrl=null;
const muted=new Set(), pinned=new Set();
let typingNode=null;
const localSentIds = new Set();

/* ── Scroll thread ── */
const scrollThread=()=>requestAnimationFrame(()=>{const t=$('#thread');if(t)t.scrollTop=t.scrollHeight;});

/* ── Click en imágenes del chat para abrir en nueva pestaña ── */
document.addEventListener('click', e => {
  const img = e.target.closest('img.chat-image');
  if (!img) return;
  const url = img.dataset.fullurl || img.src;
  if (url && !url.startsWith('data:')) window.open(url, '_blank');
});

/* ── Avatar HTML ── */
const avHTML=(av,sz)=>{
  const isImg=av&&(av.startsWith('http')||av.includes('/'));
  if(isImg)return`<img src="${esc(av)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block" />`;
  return`<span style="font-size:${sz*.55}px;line-height:1">${esc(av||'👤')}</span>`;
};

/* ── Title tag ── */
const titleTag=(tid)=>{
  const t=TM[tid]; if(!t) return '';
  return`<span class="ci-title tp-${t.r}" title="${esc(t.n)}">✦ ${esc(t.n)} ✦</span>`;
};

/* ── STARS + NAV ── */
initStars();
const ham=$('#hamburger'),nav=$('#main-nav');
ham?.addEventListener('click',()=>nav?.classList.toggle('open'));
document.addEventListener('click',e=>{if(!ham?.contains(e.target)&&!nav?.contains(e.target))nav?.classList.remove('open');});

/* ── MOBILE PANEL SWITCHING ── */
const panelLeft=$('#panelLeft'), panelRight=$('#panelRight');
function showChatPanel() {
  if (window.innerWidth <= 820) {
    panelRight?.classList.add('active');
    panelLeft?.classList.add('hidden-mobile');
    $('#btnBack')?.classList.remove('hidden');
  }
}
function showContactsPanel() {
  if (window.innerWidth <= 820) {
    panelRight?.classList.remove('active');
    panelLeft?.classList.remove('hidden-mobile');
    $('#btnBack')?.classList.add('hidden');
  }
}
$('#btnBack')?.addEventListener('click', showContactsPanel);
window.addEventListener('resize',()=>{ if(window.innerWidth>820){panelRight?.classList.remove('active');panelLeft?.classList.remove('hidden-mobile');$('#btnBack')?.classList.add('hidden');} });

/* ══════════════════════════════════════
   AUTH INIT
══════════════════════════════════════ */
onAuthStateChanged(auth, async user => {
  if (!user) { location.href='index.html'; return; }
  CU=user;
  await loadMyProfile();
  await loadFriends();
  await loadGroups();
  renderAll();
  loadFriendStatuses();
  renderStoriesBar();
  applySettings();
  loadSettingsUI();
  setOnline();
  window.addEventListener('beforeunload',setOffline);
});

async function loadMyProfile() {
  try { const s=await getDoc(doc(db,'users',CU.uid)); if(s.exists()) myProfile=s.data(); } catch {}
  const lsp=lsGet('mv_perfil')||{};
  if(!myProfile.nombre&&lsp.nombre) myProfile={...lsp,...myProfile};

  const s=getS();
  const name=s.profileName||myProfile.nombre||CU.displayName||'JUGADOR';
  const status=s.statusMsg||'Aqui en mi World';
  const avatar=myProfile.avatar||lsp.avatar||'🌙';
  const pid=myProfile.player_id||localStorage.getItem('mv_player_id')||'';

  const ne=$('#myDisplayName');if(ne)ne.textContent=name.toUpperCase();
  const se=$('#myStatusText');if(se)se.textContent=status;
  const avEl=$('#myAvatarHeader');
  if(avEl){
    const isImg=avatar.startsWith('http')||avatar.includes('/');
    avEl.innerHTML=isImg?`<img src="${esc(avatar)}" alt="" style="width:100%;height:100%;object-fit:cover" />`:'';
    if(!isImg){avEl.textContent=avatar;avEl.style.fontSize='1.4rem';}
  }
  if($('#settPlayerId'))$('#settPlayerId').textContent=pid||'—';
  if($('#settEmail'))$('#settEmail').textContent=myProfile.email||CU.email||'—';
}

async function setOnline(){if(!CU)return;try{await updateDoc(doc(db,'users',CU.uid),{presence:{state:getS().lastSeen?'online':'hidden',section:'contactos',lastSeen:new Date().toISOString()}});}catch{}}
async function setOffline(){if(!CU)return;try{await updateDoc(doc(db,'users',CU.uid),{presence:{state:'offline',section:null,lastSeen:new Date().toISOString()}});}catch{}}

/* ══════════════════════════════════════
   LOAD FRIENDS
══════════════════════════════════════ */
async function loadFriends() {
  presenceUnsubs.forEach(u=>u()); presenceUnsubs=[];
  try {
    const s=await getDoc(doc(db,'users',CU.uid)); if(!s.exists()) return;
    const uids=s.data().friends||[]; if(!uids.length){renderFriends();return;}
    const snaps=await Promise.all(uids.map(uid=>getDoc(doc(db,'users',uid))));
    friendList=snaps.filter(s=>s.exists()).map(s=>mkFriend(s.id,s.data()));
    friendList.forEach(f=>{
      // ── Listener de presencia
      presenceUnsubs.push(onSnapshot(doc(db,'users',f.uid),snap=>{
        if(!snap.exists()) return;
        const d=snap.data(), idx=friendList.findIndex(x=>x.uid===f.uid); if(idx<0) return;
        Object.assign(friendList[idx],{online:d.presence?.state==='online',lastSeen:d.presence?.lastSeen||null,avatar:d.avatar||friendList[idx].avatar,name:d.nombre||friendList[idx].name,titleId:d.title_active||friendList[idx].titleId});
        renderFriends(); if(currentId===f.id)updateChatHd(friendList[idx]);
      }));

      // ── Listener de mensajes no leídos: escucha mensajes del amigo con read:false
      const cid=chatId(CU.uid,f.uid);
      presenceUnsubs.push(onSnapshot(
        query(collection(db,'chats',cid,'messages'),where('senderId','==',f.uid),where('read','==',false),limit(99)),
        snap=>{
          const idx=friendList.findIndex(x=>x.uid===f.uid); if(idx<0) return;
          // Si el chat está abierto no mostramos badge
          const count = currentId===friendList[idx].id ? 0 : snap.size;
          if(friendList[idx].unread===count) return; // sin cambio, no re-render
          friendList[idx].unread=count;
          renderFriends();
          // Si hay nuevos mensajes y el chat no está abierto, notificamos
          if(count>0 && currentId!==friendList[idx].id) playNotif();
        },
        ()=>{} // si falla el query (índice faltante) ignoramos silenciosamente
      ));
    });
    renderFriends();
  } catch(e){console.warn('loadFriends',e);}
}
function mkFriend(uid,d){return{id:`fr_${uid}`,uid,type:'friend',name:d.nombre||'Amigo',avatar:d.avatar||'👤',titleId:d.title_active||'',online:d.presence?.state==='online',lastSeen:d.presence?.lastSeen||null,playerId:d.player_id||'',unread:0};}

/* ══════════════════════════════════════
   LOAD GROUPS
══════════════════════════════════════ */
async function loadGroups() {
  try {
    const q = query(collection(db,'groups'), where('members','array-contains',CU.uid));
    const snap = await getDocs(q);
    groupList = snap.docs.map(d=>mkGroup(d.id,d.data()));
    groupList.forEach(g=>{
      onSnapshot(doc(db,'groups',g.id),snap2=>{
        if(!snap2.exists()) return;
        const d=snap2.data(), idx=groupList.findIndex(x=>x.id===g.id); if(idx<0) return;
        groupList[idx].name=d.name||groupList[idx].name;
        groupList[idx].icon=d.icon||groupList[idx].icon;
        groupList[idx].iconUrl=d.iconUrl||groupList[idx].iconUrl;
        groupList[idx].description=d.description||groupList[idx].description||'';
        renderGroups();
      });
    });
    renderGroups();
  } catch(e){console.warn('loadGroups',e);}
}

/* mkGroup now includes description and createdAt */
function mkGroup(id,d){
  let createdAt = null;
  try {
    if(d.createdAt?.toDate) createdAt = d.createdAt.toDate().toISOString();
    else if(d.createdAt) createdAt = d.createdAt;
  } catch {}
  return {
    id, type:'group', name:d.name||'Grupo', icon:d.icon||'👥',
    iconUrl:d.iconUrl||null, description:d.description||'',
    members:d.members||[], createdBy:d.createdBy||'',
    createdAt, unread:0
  };
}

/* ══════════════════════════════════════
   RENDER ALL
══════════════════════════════════════ */
function renderAll(){renderGroups();renderFriends();renderBots();updateOnlineCount();}

function renderGroups(){
  const list=$('#groupList'),div=$('#dividerGroups'),wrap=$('#groupsScrollWrap'); if(!list) return;
  const q=($('#searchContacts')?.value||'').toLowerCase();
  const filtered=groupList.filter(c=>!q||c.name.toLowerCase().includes(q));
  if(!groupList.length){if(div)div.style.display='none';if(wrap){wrap.style.maxHeight='0';wrap.style.overflow='hidden';}list.innerHTML='';return;}
  if(div)div.style.display='flex';
  if(wrap){wrap.style.maxHeight=Math.min(filtered.length*68+10,260)+'px';wrap.style.overflow='auto';}
  list.innerHTML=filtered.map(c=>groupItem(c)).join('');
  $$('.contact-item',list).forEach(li=>li.addEventListener('click',()=>selectContact(li.dataset.id)));
}
function groupItem(c){
  const active=currentId===c.id;
  const avEl=c.iconUrl?`<img src="${esc(c.iconUrl)}" alt="" />`:`<span style="font-size:1.4rem">${esc(c.icon)}</span>`;
  const unread=c.unread?`<span class="ci-unread gr">${c.unread>99?'99+':c.unread}</span>`:'';
  const descHtml=c.description?`<div class="ci-desc">${esc(c.description)}</div>`:'';
  return`<li class="contact-item group-t ${active?'active':''}" data-id="${esc(c.id)}">
    <div class="ci-av">${avEl}</div>
    <div class="ci-meta">
      <div class="ci-name"><span class="ci-name-text">${esc(c.name)}</span><span class="ci-badge group">GRUPO</span></div>
      ${descHtml}
      <div class="ci-sub">${c.members.length} miembros</div>
    </div>
    <div class="ci-extra">${unread}</div>
  </li>`;
}

function renderFriends(){
  const list=$('#friendList'),div=$('#dividerFriends'),wrap=$('#friendsScrollWrap'); if(!list) return;
  const q=($('#searchContacts')?.value||'').toLowerCase();
  const filtered=friendList.filter(c=>!q||c.name.toLowerCase().includes(q)).sort((a,b)=>{if(pinned.has(a.id)!==pinned.has(b.id))return pinned.has(a.id)?-1:1;if(a.online!==b.online)return a.online?-1:1;return a.name.localeCompare(b.name);});
  if(!friendList.length){if(div)div.style.display='none';if(wrap){wrap.style.maxHeight='0';wrap.style.overflow='hidden';}list.innerHTML='';return;}
  if(div)div.style.display='flex';
  if(wrap){wrap.style.maxHeight=Math.min(filtered.length*64+10,280)+'px';wrap.style.overflow='auto';}
  list.innerHTML=filtered.map(c=>friendItem(c)).join('');
  $$('.contact-item',list).forEach(li=>li.addEventListener('click',()=>selectContact(li.dataset.id)));
}
function friendItem(c){
  const active=currentId===c.id;
  const sub=c.online?`<span style="color:var(--primary);font-size:.85rem">● EN LÍNEA</span>`:`<span class="ci-sub">${timeAgo(c.lastSeen)}</span>`;
  const title=titleTag(c.titleId);
  const unread=c.unread?`<span class="ci-unread fr">${c.unread>99?'99+':c.unread}</span>`:'';
  const dotCls=c.online?'online':'';
  return`<li class="contact-item friend-t ${active?'active':''}" data-id="${esc(c.id)}">
    <div class="ci-av">${avHTML(c.avatar,44)}<div class="ci-online-dot ${dotCls}"></div></div>
    <div class="ci-meta">
      <div class="ci-name"><span class="ci-name-text">${esc(c.name)}</span><span class="ci-badge friend">AMIGO</span></div>
      ${title?`<div>${title}</div>`:''}
      ${sub}
    </div>
    <div class="ci-extra">${unread}</div>
  </li>`;
}
function renderBots(){
  const list=$('#contactList'); if(!list) return;
  const q=($('#searchContacts')?.value||'').toLowerCase();
  const filtered=BOTS.filter(c=>!q||[c.name,c.alias,c.desc].join(' ').toLowerCase().includes(q)).sort((a,b)=>{if(pinned.has(a.id)!==pinned.has(b.id))return pinned.has(a.id)?-1:1;if(a.online!==b.online)return a.online?-1:1;if(a.unread!==b.unread)return b.unread-a.unread;return a.name.localeCompare(b.name);});
  list.innerHTML=filtered.map(c=>botItem(c)).join('');
  $$('.contact-item',list).forEach(li=>li.addEventListener('click',()=>selectContact(li.dataset.id)));
}
function botItem(c){
  const active=currentId===c.id;
  const goldBadge=c.gold?`<span class="ci-badge gold">GOLD</span>`:'';
  const unread=c.unread?`<span class="ci-unread">${c.unread>99?'99+':c.unread}</span>`:'';
  return`<li class="contact-item ${c.gold?'gold-t':''} ${active?'active':''}" data-id="${esc(c.id)}">
    <div class="ci-av">${avHTML(c.avatar,44)}<div class="ci-online-dot ${c.online?'online':''}"></div></div>
    <div class="ci-meta"><div class="ci-name"><span class="ci-name-text">${esc(c.name)}</span>${goldBadge}</div><div class="ci-sub">${esc(c.desc)}</div></div>
    <div class="ci-extra">${unread}</div>
  </li>`;
}
function updateOnlineCount(){const n=friendList.filter(f=>f.online).length+BOTS.filter(b=>b.online).length;const el=$('#onlineCount');if(el)el.textContent=`${n} EN LÍNEA`;}

/* ══════════════════════════════════════
   SELECT CONTACT
══════════════════════════════════════ */
function selectContact(id){
  if(currentId===id){showChatPanel();return;}
  if(msgUnsub){msgUnsub();msgUnsub=null;}
  currentId=id;currentFriendUid=null;currentGroupId=null;
  clearImgPreview();

  const grp=groupList.find(c=>c.id===id);
  const frn=friendList.find(c=>c.id===id);
  const bot=BOTS.find(c=>c.id===id);
  const c=grp||frn||bot; if(!c) return;
  currentType=grp?'group':frn?'friend':'bot';

  updateChatHd(c);
  $('#thread').innerHTML='';
  const qb=$('#quickBar');qb.innerHTML='';qb.classList.add('hidden');

  if(grp){grp.unread=0;renderGroups();currentGroupId=grp.id;openGroupChat(grp);}
  else if(frn){
    frn.unread=0;
    // Reset también el campo en Firestore para que el listener no vuelva a disparar
    const fcid=chatId(CU.uid,frn.uid);
    setDoc(doc(db,'chats',fcid),{[`unread_${CU.uid}`]:0},{merge:true}).catch(()=>{});
    renderFriends();openFriendChat(frn);
  }
  else{bot.unread=0;renderBots();openBotChat(bot);}

  showChatPanel();
}

function updateChatHd(c){
  const av=$('#peerAvatar');
  if(av){
    const isImg=c.iconUrl||(c.avatar&&(c.avatar.startsWith('http')||c.avatar.includes('/')));
    av.style.fontSize=isImg?'':'1.4rem';
    av.innerHTML=c.iconUrl?`<img src="${esc(c.iconUrl)}" alt="" />`:(c.icon&&!c.avatar?`<span>${esc(c.icon)}</span>`:avHTML(c.avatar||c.icon||'👥',44));
  }
  const pn=$('#peerName');if(pn)pn.textContent=c.name.toUpperCase();
  const ps=$('#peerStatus');
  if(ps){
    if(c.type==='friend'){if(c.online){ps.textContent='● EN LÍNEA';ps.className='chat-peer-status online';}else{ps.textContent=`Visto ${timeAgo(c.lastSeen)}`;ps.className='chat-peer-status';}}
    else if(c.type==='group'){
      const descText=c.description?` · ${c.description}`:'';
      ps.textContent=`${c.members.length} miembros${descText}`;ps.className='chat-peer-status';
    }
    else{ps.textContent=c.online?'● EN LÍNEA':'○ DESCONECTADO';ps.className='chat-peer-status'+(c.online?' online':'');}
  }
}

/* ══════════════════════════════════════
   BOT CHAT
══════════════════════════════════════ */
function openBotChat(bot){
  const greet={options:bot.brain.prompt,keyword:'Escribe lo que necesitas.',echo:'Dime algo.'}[bot.kind]||'Hola.';
  pushPeer(bot,greet);
  if(bot.qr?.length){const qb=$('#quickBar');qb.innerHTML=bot.qr.map(q=>`<button class="qr" data-q="${esc(q)}">${esc(q)}</button>`).join('');qb.classList.remove('hidden');$$('.qr',qb).forEach(b=>b.addEventListener('click',()=>sendMsg(b.dataset.q)));}
  scrollThread();
}
function botReply(bot,text){
  const t=text.toLowerCase().trim();
  if(bot.kind==='options'){const opt=bot.brain.opts.find(o=>o.l.toLowerCase()===t);return opt?(typeof opt.r==='string'?opt.r:opt.r):bot.brain.fallback;}
  if(bot.kind==='keyword'){for(const k in bot.brain.kw){if(t.includes(k.toLowerCase()))return bot.brain.kw[k];}return bot.brain.fallback;}
  return 'Estoy pensando…';
}

/* ══════════════════════════════════════
   FRIEND CHAT
══════════════════════════════════════ */
function openFriendChat(friend){
  currentFriendUid=friend.uid;
  const cid=chatId(CU.uid,friend.uid);
  const th=$('#thread');
  th.innerHTML=`<div class="chat-empty"><div class="ce-desc">Cargando...</div></div>`;
  // Marcar todos los mensajes del amigo como leídos en Firestore
  setDoc(doc(db,'chats',cid),{[`unread_${CU.uid}`]:0},{merge:true}).catch(()=>{});
  getDocs(query(collection(db,'chats',cid,'messages'),where('senderId','==',friend.uid),where('read','==',false))).then(snap=>{
    snap.forEach(d=>updateDoc(d.ref,{read:true}).catch(()=>{}));
  }).catch(()=>{});
  let first=true;
  msgUnsub=onSnapshot(query(collection(db,'chats',cid,'messages'),orderBy('timestamp','asc'),limit(120)),
    snap=>{
      if(first){
        first=false; th.innerHTML='';
        if(snap.empty) th.innerHTML=`<div class="chat-empty"><div class="ce-icon">💬</div><div class="ce-desc">Sé el primero en escribir</div></div>`;
        snap.docs.forEach(d=>appendMsg({id:d.id,...d.data()},friend,'friend'));
      } else {
        snap.docChanges().forEach(ch=>{
          if(ch.type==='added'){
            const m={id:ch.doc.id,...ch.doc.data()};
            if(m.senderId===CU.uid&&localSentIds.has(m._localId||'X')){localSentIds.delete(m._localId);const p=$(`[data-local-id="${CSS.escape(m._localId)}"]`);if(p)p.remove();}
            $('#thread .chat-empty')?.remove();
            appendMsg(m,friend,'friend');
            if(m.senderId!==CU.uid)playNotif();
          }
        });
      }
      scrollThread();
    },
    err=>{console.error('msg listener',err);th.innerHTML=`<div class="chat-empty"><div class="ce-desc" style="color:var(--red)">Error de conexión</div></div>`;}
  );
  const qb=$('#quickBar');
  qb.innerHTML=['👋 Hola!','😄','🎮 Jugando?','🌙','✌️'].map(q=>`<button class="qr" data-q="${esc(q)}">${esc(q)}</button>`).join('');
  qb.classList.remove('hidden');
  $$('.qr',qb).forEach(b=>b.addEventListener('click',()=>sendMsg(b.dataset.q)));
}

/* ══════════════════════════════════════
   GROUP CHAT
══════════════════════════════════════ */
function openGroupChat(group){
  const th=$('#thread');
  th.innerHTML=`<div class="chat-empty"><div class="ce-desc">Cargando grupo...</div></div>`;
  let first=true;

  const buildQuery = (ordered=true) => ordered
    ? query(collection(db,'groupChats',group.id,'messages'), orderBy('timestamp','asc'), limit(120))
    : query(collection(db,'groupChats',group.id,'messages'), limit(120));

  const startListen = (ordered=true) => {
    if(msgUnsub){msgUnsub();msgUnsub=null;}
    msgUnsub=onSnapshot(buildQuery(ordered),
      snap=>{
        if(first){
          first=false; th.innerHTML='';
          if(snap.empty) th.innerHTML=`<div class="chat-empty"><div class="ce-icon">👥</div><div class="ce-desc">¡Empieza la conversación!</div></div>`;
          const docs = ordered ? snap.docs : [...snap.docs].sort((a,b)=>{const ta=a.data().timestamp?.toMillis?.()||0,tb=b.data().timestamp?.toMillis?.()||0;return ta-tb;});
          docs.forEach(d=>appendMsg({id:d.id,...d.data()},group,'group'));
        } else {
          snap.docChanges().forEach(ch=>{
            if(ch.type==='added'){
              const m={id:ch.doc.id,...ch.doc.data()};
              if(m.senderId===CU.uid&&localSentIds.has(m._localId||'X')){localSentIds.delete(m._localId);const p=$(`[data-local-id="${CSS.escape(m._localId)}"]`);if(p)p.remove();}
              $('#thread .chat-empty')?.remove();
              appendMsg(m,group,'group');
              if(m.senderId!==CU.uid)playNotif();
            }
          });
        }
        scrollThread();
      },
      err=>{
        console.warn('group snap err',err.code, err.message);
        if(ordered && (err.code==='failed-precondition'||err.message?.includes('index'))){
          first=true; startListen(false);
        } else {
          th.innerHTML=`<div class="chat-empty"><div class="ce-desc" style="color:var(--red)">Error cargando mensajes<br><small>${err.code||err.message}</small></div></div>`;
        }
      }
    );
  };
  startListen(true);
  const qb=$('#quickBar');
  qb.innerHTML=['👋','😄','🎮','🔥','⭐'].map(q=>`<button class="qr" data-q="${esc(q)}">${esc(q)}</button>`).join('');
  qb.classList.remove('hidden');
  $$('.qr',qb).forEach(b=>b.addEventListener('click',()=>sendMsg(b.dataset.q)));
}

/* ══════════════════════════════════════
   appendMsg
══════════════════════════════════════ */
function appendMsg(msg, contact, chatType) {
  const s=getS();
  const isMine=msg.senderId===CU.uid;
  const node=document.createElement('div');
  node.className=`msg ${chatType}-msg ${isMine?'me':'peer'} ${s.compact?'compact':''}`;

  let avHtml='';
  if(isMine){
    const av=s.emojiAvatar||myProfile.avatar||'👤';
    avHtml=`<div class="m-av">${avHTML(av,28)}</div>`;
  } else {
    if(chatType==='group'){
      const sender=friendList.find(f=>f.uid===msg.senderId);
      const sav=sender?.avatar||'👤';
      avHtml=`<div class="m-av">${avHTML(sav,28)}</div>`;
    } else {
      avHtml=`<div class="m-av">${avHTML(contact.avatar,28)}</div>`;
    }
  }

  let senderName='';
  if(chatType==='group'&&!isMine){
    const sn=msg.senderName||'Jugador';
    senderName=`<div class="m-sender">${esc(sn.toUpperCase())}</div>`;
  }

  let content='';
  if(msg.type==='image'&&msg.imageUrl){
    const url=msg.imageUrl;
    content=`<img src="${url}" alt="imagen" class="chat-image" loading="lazy" data-fullurl="${url}" onerror="this.onerror=null;this.src='';this.alt='🖼️ No disponible'" />`;
  } else {
    content=`<div class="m-text">${fmtText(msg.text||'')}</div>`;
  }

  let ts=timeNow();
  if(msg.timestamp?.toDate){try{ts=new Intl.DateTimeFormat('es-PE',{hour:'2-digit',minute:'2-digit'}).format(msg.timestamp.toDate());}catch{}}

  const ticks=isMine&&s.readReceipts?`<span class="m-ticks sent">✓✓</span>`:'';
  node.innerHTML=`${avHtml}<div class="bubble">${senderName}${content}<div class="m-meta"><span>${ts}</span>${ticks}</div></div>`;
  $('#thread').appendChild(node);
}

/* ══════════════════════════════════════
   SEND TO FIREBASE
══════════════════════════════════════ */
async function sendFriendMsg(text,imageUrl,localId){
  const cid=chatId(CU.uid,currentFriendUid);
  const s=getS();
  const data={senderId:CU.uid,senderName:s.profileName||myProfile.nombre||'Yo',type:imageUrl?'image':'text',text:imageUrl?null:text,imageUrl:imageUrl||null,timestamp:serverTimestamp(),read:false,_localId:localId};
  try {
    await setDoc(doc(db,'chats',cid),{participants:[CU.uid,currentFriendUid],lastMessage:imageUrl?'📷 Imagen':text,lastMessageAt:serverTimestamp(),lastMessageBy:CU.uid,[`unread_${currentFriendUid}`]:serverTimestamp()},{merge:true});
    await addDoc(collection(db,'chats',cid,'messages'),data);
  } catch(e){toast('Error enviando','error');console.error(e);}
}
async function sendGroupMsg(text,imageUrl,localId){
  if(!currentGroupId) return;
  const s=getS();
  const data={senderId:CU.uid,senderName:s.profileName||myProfile.nombre||'Yo',type:imageUrl?'image':'text',text:imageUrl?null:text,imageUrl:imageUrl||null,timestamp:serverTimestamp(),read:false,_localId:localId};
  try {
    await setDoc(doc(db,'groupChats',currentGroupId),{groupId:currentGroupId,lastMessage:imageUrl?'📷 Imagen':text,lastMessageAt:serverTimestamp(),lastMessageBy:CU.uid},{merge:true});
    await addDoc(collection(db,'groupChats',currentGroupId,'messages'),data);
  } catch(e){toast('Error enviando','error');console.error(e);}
}

/* ══════════════════════════════════════
   IMAGE UPLOAD — Cloudinary (gratis, sin plan de paga)
   URL pública visible para todos los usuarios.
   REQUIERE: crear un upload preset sin firma en Cloudinary:
     Dashboard → Settings → Upload → Upload presets
     → Add upload preset → Signing Mode: Unsigned → nombre: moonveil_uploads
══════════════════════════════════════ */
async function uploadImg(file, folder = 'chat_images') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_PRESET);
  formData.append('folder', `moonveil/${folder}`);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Cloudinary error ${res.status}`);
  }

  const data = await res.json();
  return data.secure_url; // URL HTTPS pública, visible para todos
}

$('#imgInput')?.addEventListener('change',e=>{
  const f=e.target.files?.[0]; if(!f) return;
  if(f.size>5*1024*1024){toast('Imagen muy grande (máx 5MB)','error');return;}
  pendingFile=f;
  const reader=new FileReader();
  reader.onload=ev=>{
    pendingDataUrl=ev.target.result;
    const bar=$('#imgPreviewBar'); if(!bar) return;
    bar.classList.remove('hidden');
    $('#imgPreviewThumb').src=ev.target.result;
    $('#imgPreviewName').textContent=f.name;
  };
  reader.readAsDataURL(f);
});
$('#btnAttach')?.addEventListener('click',()=>{if(!currentId){toast('Selecciona un contacto');return;}$('#imgInput')?.click();});
$('#imgPreviewRemove')?.addEventListener('click',clearImgPreview);
function clearImgPreview(){pendingFile=null;pendingDataUrl=null;const b=$('#imgPreviewBar');if(b)b.classList.add('hidden');const i=$('#imgInput');if(i)i.value='';}

/* ══════════════════════════════════════
   SEND MESSAGE
══════════════════════════════════════ */
const composer=$('#composer'), msgInput=$('#msgInput');
composer?.addEventListener('submit',async e=>{
  e.preventDefault();
  if(!currentId){toast('Selecciona un contacto');return;}
  const text=(msgInput.value||'').trim();
  if(!text&&!pendingFile) return;
  msgInput.value='';
  await sendMsg(text);
  msgInput.focus();
});
msgInput?.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&!e.shiftKey&&getS().enterSend){e.preventDefault();composer?.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));}
});

async function sendMsg(text){
  if(!currentId) return;
  const file=pendingFile, dataUrl=pendingDataUrl;
  clearImgPreview();

  if(currentType==='bot'){
    pushPeer({name:'me',avatar:getS().emojiAvatar||myProfile.avatar||'👤',aT:'emoji'},text,'_me');
    if(!text) return;
    const bot=BOTS.find(c=>c.id===currentId); if(!bot) return;
    showTyping();
    setTimeout(()=>{hideTyping();pushPeer(bot,botReply(bot,text));scrollThread();},600+Math.random()*700);
    return;
  }

  const localId=`local_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  localSentIds.add(localId);
  showOptimisticMsg(text, dataUrl, localId);

  if(currentType==='friend'){
    if(file){
      try{
        toast('📤 Subiendo imagen...','info');
        const url=await uploadImg(file);
        removeOptimistic(localId);
        await sendFriendMsg(text||null,url,localId);
        toast('✅ Imagen enviada');
      } catch(e){toast(`❌ Error: ${e.code||'revisa reglas de Storage'},'error`);removeOptimistic(localId);localSentIds.delete(localId);}
    } else if(text){
      await sendFriendMsg(text,null,localId);
    }
  } else if(currentType==='group'){
    if(file){
      try{
        toast('📤 Subiendo imagen...','info');
        const url=await uploadImg(file,'group_images');
        removeOptimistic(localId);
        await sendGroupMsg(text||null,url,localId);
        toast('✅ Imagen enviada');
      } catch(e){toast(`❌ Error: ${e.code||'revisa reglas de Storage'},'error`);removeOptimistic(localId);localSentIds.delete(localId);}
    } else if(text){
      await sendGroupMsg(text,null,localId);
    }
  }
}

function showOptimisticMsg(text,dataUrl,localId){
  const s=getS(), av=s.emojiAvatar||myProfile.avatar||'👤';
  const th=$('#thread'); if(!th) return;
  th.querySelector('.chat-empty')?.remove();
  const node=document.createElement('div');
  node.className=`msg me ${currentType}-msg ${s.compact?'compact':''} pending`;
  node.setAttribute('data-local-id',localId);
  let content='';
  if(dataUrl){content=`<img src="${dataUrl}" class="chat-image" alt="enviando..." />`;}
  if(text){content+=`<div class="m-text">${fmtText(text)}</div>`;}
  node.innerHTML=`<div class="m-av">${avHTML(av,28)}</div><div class="bubble">${content}<div class="m-meta"><span>${timeNow()}</span><span class="m-ticks" style="font-size:.27rem;animation:spin .8s linear infinite">⟳</span></div></div>`;
  th.appendChild(node);
  scrollThread();
}
function removeOptimistic(localId){const el=$(`[data-local-id="${CSS.escape(localId)}"]`);if(el)el.remove();}

/* ── Push peer message (bots) ── */
function pushPeer(c,content){
  const s=getS(); const th=$('#thread'); if(!th) return;
  th.querySelector('.chat-empty')?.remove();
  const node=document.createElement('div');
  node.className=`msg peer ${s.compact?'compact':''}`;
  let inner='';
  if(typeof content==='string') inner=`<div class="m-text">${fmtText(content)}</div>`;
  else if(content?.type==='image') inner=`<img src="${esc(content.url)}" class="chat-image" alt="" onclick="window.open('${esc(content.url)}','_blank')" />`;
  else if(content?.type==='audio') inner=`<audio controls src="${esc(content.url)}" class="chat-audio"></audio>`;
  else if(content?.type==='video') inner=`<video controls class="chat-video"><source src="${esc(content.url)}" type="video/mp4"></video>`;
  else if(content?.type==='pdf') inner=`<a href="${esc(content.url)}" target="_blank" class="chat-file">📄 VER PDF</a>`;
  if(c.name==='me'){node.className=`msg me ${s.compact?'compact':''}`;node.innerHTML=`<div class="m-av">${avHTML(c.avatar||'👤',28)}</div><div class="bubble"><div class="m-text">${fmtText(typeof content==='string'?content:'')}</div><div class="m-meta"><span>${timeNow()}</span><span class="m-ticks sent">✓✓</span></div></div>`;th.appendChild(node);scrollThread();return;}
  node.innerHTML=`<div class="m-av">${avHTML(c.avatar,28)}</div><div class="bubble">${inner}<div class="m-meta">${timeNow()}</div></div>`;
  th.appendChild(node); scrollThread();
}

function showTyping(){if(typingNode)return;typingNode=document.createElement('div');typingNode.className='typing';typingNode.innerHTML='<span class="dots"><span class="dot"></span><span class="dot"></span><span class="dot"></span></span><small>ESCRIBIENDO...</small>';$('#thread').appendChild(typingNode);scrollThread();}
function hideTyping(){typingNode?.remove();typingNode=null;}

/* ══════════════════════════════════════
   EMOJI PANEL
══════════════════════════════════════ */
const EMOJIS={smileys:['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','😉','😍','😘','😜','🤔','😎','😢','😭','😡','😱','💀','🤗'],animals:['🐶','🐱','🐰','🦊','🐻','🐼','🐯','🦁','🐮','🐷','🐸','🐺','🦋','🐢','🦄'],food:['🍏','🍊','🍋','🍌','🍉','🍇','🍓','🍕','🍔','🍟','🍣','🍪','🍰'],activity:['⚽','🏀','🎮','🎲','🎤','🎧','🎬','🎯','🏆','🥇'],hearts:['❤️','🧡','💛','💚','💙','💜','🖤','💖','💘','💝']};
function loadEmojis(cat){const ec=$('#emojiContent');if(!ec)return;ec.innerHTML=(EMOJIS[cat]||[]).map(e=>`<span>${e}</span>`).join('');$$('.emoji-cats button').forEach(b=>b.classList.toggle('active',b.dataset.cat===cat));}
$('#btnEmoji')?.addEventListener('click',()=>{const p=$('#emojiPanel');p.classList.toggle('hidden');if(!p.classList.contains('hidden'))loadEmojis('smileys');});
$('#emojiContent')?.addEventListener('click',e=>{if(e.target.tagName==='SPAN'){msgInput.value+=e.target.textContent;msgInput.focus();}});
$$('.emoji-cats button').forEach(b=>b.addEventListener('click',()=>loadEmojis(b.dataset.cat)));
document.addEventListener('click',e=>{const ep=$('#emojiPanel');if(ep&&!ep.contains(e.target)&&e.target.id!=='btnEmoji')ep.classList.add('hidden');});

/* ── Search ── */
$('#searchContacts')?.addEventListener('input',()=>renderAll());

/* ── Chat header buttons ── */
$('#btnInfo')?.addEventListener('click',()=>{
  if(!currentId){toast('Selecciona un contacto');return;}
  const g=groupList.find(c=>c.id===currentId);
  const f=friendList.find(c=>c.id===currentId);
  const b=BOTS.find(c=>c.id===currentId);
  if(g) openGroupSettings(g); else if(f) openFriendInfo(f); else if(b) openBotInfo(b);
});
$('#btnPin')?.addEventListener('click',()=>{if(!currentId)return;if(pinned.has(currentId)){pinned.delete(currentId);toast('Desanclado');}else{pinned.add(currentId);toast('📌 Anclado');}renderAll();});
$('#btnMute')?.addEventListener('click',()=>{if(!currentId)return;if(muted.has(currentId)){muted.delete(currentId);toast('🔔 Sonido activado');}else{muted.add(currentId);toast('🔕 Silenciado');}});

function playNotif(){if(!getS().sound||muted.has(currentId))return;try{const a=$('#notifSound');if(a){a.currentTime=0;a.play().catch(()=>{});}}catch{}}

/* ══════════════════════════════════════
   MODALS
══════════════════════════════════════ */
const openModal=id=>{const m=$(id);if(!m)return;m.classList.add('show');m.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';};
const closeModal=id=>{const m=$(id);if(!m)return;m.classList.remove('show');m.setAttribute('aria-hidden','true');document.body.style.overflow='';};
document.addEventListener('keydown',e=>{if(e.key==='Escape')['#contactModal','#settingsModal','#statusCreatorModal','#groupModal','#groupSettingsModal'].forEach(closeModal);});
$('#modalOverlay')?.addEventListener('click',()=>closeModal('#contactModal'));
$('#modalClose')?.addEventListener('click',()=>closeModal('#contactModal'));
$('#modalAction')?.addEventListener('click',()=>closeModal('#contactModal'));

function openFriendInfo(c){
  const t=TM[c.titleId];
  $('#modalTitle').textContent=c.name.toUpperCase();
  $('#modalBody').innerHTML=`<div class="modal-info-grid">
    <div class="mig-block"><div class="mig-title">PERFIL</div><div style="font-size:2rem;text-align:center;margin:8px 0">${avHTML(c.avatar,52)}</div>
      <div class="mig-row"><strong>Nombre:</strong> ${esc(c.name)}</div>
      <div class="mig-row"><strong>Título:</strong> ${t?`<span class="ci-title tp-${t.r}">✦${esc(t.n)}✦</span>`:'—'}</div>
      <div class="mig-row"><strong>ID:</strong> <code style="font-family:var(--fp);font-size:.3rem;color:var(--yellow)">${esc(c.playerId||'—')}</code></div>
    </div>
    <div class="mig-block"><div class="mig-title">ESTADO</div>
      <div class="mig-row">${c.online?'🟢 EN LÍNEA':'⚫ DESCONECTADO'}</div>
      <div class="mig-row"><strong>Visto:</strong> ${c.online?'Ahora mismo':timeAgo(c.lastSeen)}</div>
    </div>
  </div>`;
  openModal('#contactModal');
}
function openBotInfo(c){
  $('#modalTitle').textContent=c.name.toUpperCase();
  $('#modalBody').innerHTML=`<div class="modal-info-grid"><div class="mig-block"><div class="mig-title">PERFIL</div><div class="mig-row"><strong>Alias:</strong> ${esc(c.alias)}</div></div><div class="mig-block"><div class="mig-title">ESTADO</div><div class="mig-row">${c.online?'🟢 EN LÍNEA':'⚫ DESCONECTADO'}</div></div><div class="mig-block full"><div class="mig-title">DESC.</div><div class="mig-row">${esc(c.desc)}</div></div></div>`;
  openModal('#contactModal');
}

/* ══════════════════════════════════════
   GROUP SETTINGS — UPDATED with description, kick, creation date, save icon btn
══════════════════════════════════════ */
const GROUP_EMOJIS_SETTINGS=['👥','⚔️','🎮','🌙','🔥','💎','🏆','🌿','🚀','🎯','🎵','⭐','🐺','🦊','🌈','💜'];
let gsCurrentGroup=null, gsNewIconFile=null, gsNewIconEmoji=null;

function openGroupSettings(group){
  gsCurrentGroup=group;
  gsNewIconFile=null; gsNewIconEmoji=null;
  const isCreator=group.createdBy===CU.uid;

  // Header
  $('#groupSettingsTitle').textContent=`⚙️ ${group.name.toUpperCase()}`;

  // Icon preview
  const iconWrap=$('#gsIconWrap');
  if(iconWrap){
    iconWrap.innerHTML=group.iconUrl
      ?`<img src="${group.iconUrl}" alt="" />`
      :`<span>${esc(group.icon||'👥')}</span>`;
  }

  // Name + meta
  const nd=$('#gsGroupNameDisplay');if(nd)nd.textContent=group.name;
  const gm=$('#gsGroupMeta');if(gm)gm.textContent=`${group.members.length} miembros · ${isCreator?'eres el creador':'miembro'}`;

  // Creation date
  const gd=$('#gsCreatedDate');
  if(gd) gd.textContent = group.createdAt ? fmtDateLong(group.createdAt) : '—';

  // Description
  const descDisplay=$('#gsGroupDescDisplay');
  if(descDisplay){
    descDisplay.textContent = group.description || 'Sin descripción';
    descDisplay.classList.toggle('empty', !group.description);
  }
  const descInput=$('#gsDescInput');
  if(descInput) descInput.value = group.description||'';
  $('#gsDescEditRow')?.classList.add('hidden');

  // Show/hide edit buttons based on creator
  const editDescBtn=$('#gsBtnEditDesc');
  if(editDescBtn) editDescBtn.style.display=isCreator?'':'none';

  // Edit name row visibility
  $('#gsNameEditRow')?.classList.add('hidden');
  const editBtn=$('#gsBtnEditName');
  if(editBtn) editBtn.style.display=isCreator?'':'none';

  // Icon section visibility
  const iconSec=$('#gsIconSection');
  if(iconSec) iconSec.style.display=isCreator?'':'none';

  // Hide save icon bar initially
  $('#gsSaveIconBar')?.classList.add('hidden');

  // Build emoji grid for settings
  const gg=$('#gsEmojiGrid');
  if(gg){
    gg.innerHTML=GROUP_EMOJIS_SETTINGS.map(e=>`<button class="group-em" data-ge="${e}">${e}</button>`).join('');
    $$('.group-em',gg).forEach(b=>b.addEventListener('click',()=>{
      gsNewIconEmoji=b.dataset.ge;gsNewIconFile=null;
      $$('.group-em',gg).forEach(x=>x.classList.remove('active'));b.classList.add('active');
      const iw=$('#gsIconWrap');if(iw){iw.innerHTML='';iw.textContent=gsNewIconEmoji;}
      // Show save icon bar
      $('#gsSaveIconBar')?.classList.remove('hidden');
    }));
  }
  const gs=$('#gsImgStatus');if(gs)gs.textContent='';

  // Members list
  renderGsMembers(group,isCreator);

  // Add member section
  const addSec=$('#gsAddSection');
  if(addSec) addSec.style.display=isCreator?'':'none';
  if(isCreator) renderGsAddList(group);

  // Footer buttons
  const leaveBtn=$('#gsBtnLeave');
  const dissolveBtn=$('#gsBtnDissolve');
  if(leaveBtn){
    leaveBtn.style.display=isCreator?'none':'';
    leaveBtn.textContent='🚪 SALIR DEL GRUPO';
  }
  if(dissolveBtn){
    dissolveBtn.classList.toggle('hidden',!isCreator);
  }

  openModal('#groupSettingsModal');
}

/* renderGsMembers — with kick button for creator */
function renderGsMembers(group,isCreator){
  const list=$('#gsMembersList'),cnt=$('#gsMemberCount');
  if(!list) return;
  if(cnt) cnt.textContent=`(${group.members.length})`;
  const s=getS();
  list.innerHTML=group.members.map(uid=>{
    const isMe=uid===CU.uid;
    const f=friendList.find(x=>x.uid===uid);
    const name=isMe?(s.profileName||myProfile.nombre||'Tú'):(f?f.name:'Miembro');
    const avatar=isMe?(s.emojiAvatar||myProfile.avatar||'👤'):(f?f.avatar:'👤');
    const online=isMe?true:(f?f.online:false);
    const titleId=isMe?'':(f?f.titleId:'');
    const t=titleId?TM[titleId]:null;
    const isCreatorMember=uid===group.createdBy;
    const canKick=isCreator&&!isMe&&!isCreatorMember;
    return`<div class="gs-member ${online?'online-m':''}">
      <div class="gs-m-av">${avHTML(avatar,36)}<div class="gs-m-status-dot ${online?'online':''}"></div></div>
      <div class="gs-m-info">
        <div class="gs-m-name">${esc(name)}${isMe?' <span style="color:var(--muted);font-size:.75em">(Tú)</span>':''}${isCreatorMember?'<span class="gs-creator-chip">★ CREADOR</span>':''}</div>
        ${t?`<div class="gs-m-title ci-title tp-${t.r}">✦ ${esc(t.n)} ✦</div>`:''}
        <div class="gs-m-conn ${online?'online':'offline'}">${online?'● EN LÍNEA':'○ DESCONECTADO'}</div>
      </div>
      ${canKick?`<button class="gs-kick-btn" data-uid="${esc(uid)}">✕ EXPULSAR</button>`:''}
    </div>`;
  }).join('');

  // Kick event listeners
  list.querySelectorAll('.gs-kick-btn').forEach(btn=>{
    btn.addEventListener('click',async()=>{
      const uid=btn.dataset.uid;
      const f=friendList.find(x=>x.uid===uid);
      const name=f?f.name:'este miembro';
      if(!confirm(`¿Expulsar a ${name} del grupo "${gsCurrentGroup.name}"?`)) return;
      btn.disabled=true;btn.textContent='⟳';
      await kickMemberFromGroup(gsCurrentGroup.id, uid);
      toast(`✅ ${name} expulsado del grupo`);
    });
  });
}

/* ── Kick member ── */
async function kickMemberFromGroup(groupId, uid){
  try {
    await updateDoc(doc(db,'groups',groupId),{members:arrayRemove(uid)});
    const idx=groupList.findIndex(x=>x.id===groupId);
    if(idx>=0){
      groupList[idx].members=groupList[idx].members.filter(m=>m!==uid);
      if(gsCurrentGroup?.id===groupId) gsCurrentGroup.members=gsCurrentGroup.members.filter(m=>m!==uid);
      const isCreator=groupList[idx].createdBy===CU.uid;
      renderGsMembers(groupList[idx],isCreator);
      const cnt=$('#gsMemberCount');
      if(cnt) cnt.textContent=`(${groupList[idx].members.length})`;
      const gm=$('#gsGroupMeta');
      if(gm) gm.textContent=`${groupList[idx].members.length} miembros · eres el creador`;
      renderGroups();
    }
  } catch(e){toast('❌ Error expulsando','error');console.error(e);}
}

function renderGsAddList(group){
  const list=$('#gsAddList'); if(!list) return;
  const notIn=friendList.filter(f=>!group.members.includes(f.uid));
  if(!notIn.length){list.innerHTML=`<p class="gs-no-friends">Todos tus amigos ya están en el grupo</p>`;return;}
  list.innerHTML=notIn.map(f=>{
    return`<div class="gs-add-row" data-uid="${esc(f.uid)}">
      <div style="width:32px;height:32px;border:2px solid var(--border);display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0">${avHTML(f.avatar,32)}</div>
      <span style="font-family:var(--fp);font-size:.26rem;color:var(--white);flex:1">${esc(f.name.toUpperCase())}</span>
      <button class="gs-add-btn" data-uid="${esc(f.uid)}">➕ AÑADIR</button>
    </div>`;
  }).join('');
  $$('.gs-add-btn',list).forEach(btn=>btn.addEventListener('click',async()=>{
    const uid=btn.dataset.uid; btn.disabled=true; btn.textContent='⟳';
    await addMemberToGroup(gsCurrentGroup.id,uid);
    btn.closest('.gs-add-row').remove();
    toast(`✅ Miembro añadido`);
  }));
}

/* Group settings event listeners */
$('#groupSettingsClose')?.addEventListener('click',()=>closeModal('#groupSettingsModal'));
$('#groupSettingsOverlay')?.addEventListener('click',()=>closeModal('#groupSettingsModal'));

$('#gsBtnEditName')?.addEventListener('click',()=>{
  const row=$('#gsNameEditRow');row?.classList.remove('hidden');
  const inp=$('#gsNameInput');if(inp){inp.value=gsCurrentGroup?.name||'';inp.focus();}
});
$('#gsCancelName')?.addEventListener('click',()=>$('#gsNameEditRow')?.classList.add('hidden'));
$('#gsSaveName')?.addEventListener('click',async()=>{
  const name=$('#gsNameInput')?.value.trim(); if(!name)return;
  const btn=$('#gsSaveName');btn.disabled=true;btn.textContent='⟳';
  try{
    await updateDoc(doc(db,'groups',gsCurrentGroup.id),{name});
    gsCurrentGroup.name=name;
    const idx=groupList.findIndex(x=>x.id===gsCurrentGroup.id);
    if(idx>=0)groupList[idx].name=name;
    $('#gsGroupNameDisplay').textContent=name;
    $('#groupSettingsTitle').textContent=`⚙️ ${name.toUpperCase()}`;
    renderGroups(); updateChatHd(gsCurrentGroup);
    $('#gsNameEditRow')?.classList.add('hidden');
    toast('✅ Nombre actualizado');
  }catch(e){toast('❌ Error','error');console.error(e);}
  btn.disabled=false;btn.textContent='✓';
});

/* Description edit */
$('#gsBtnEditDesc')?.addEventListener('click',()=>{
  const row=$('#gsDescEditRow');row?.classList.remove('hidden');
  const inp=$('#gsDescInput');if(inp){inp.value=gsCurrentGroup?.description||'';inp.focus();}
});
$('#gsCancelDesc')?.addEventListener('click',()=>$('#gsDescEditRow')?.classList.add('hidden'));
$('#gsSaveDesc')?.addEventListener('click',async()=>{
  const desc=$('#gsDescInput')?.value.trim()||'';
  const btn=$('#gsSaveDesc');btn.disabled=true;btn.textContent='⟳';
  try{
    await updateDoc(doc(db,'groups',gsCurrentGroup.id),{description:desc});
    gsCurrentGroup.description=desc;
    const idx=groupList.findIndex(x=>x.id===gsCurrentGroup.id);
    if(idx>=0) groupList[idx].description=desc;
    const display=$('#gsGroupDescDisplay');
    if(display){display.textContent=desc||'Sin descripción';display.classList.toggle('empty',!desc);}
    $('#gsDescEditRow')?.classList.add('hidden');
    updateChatHd(gsCurrentGroup);
    renderGroups();
    toast('✅ Descripción actualizada');
  }catch(e){toast('❌ Error','error');console.error(e);}
  btn.disabled=false;btn.textContent='✓ GUARDAR';
});

/* Group icon image upload */
$('#gsBtnImgIcon')?.addEventListener('click',()=>$('#gsIconImgInput')?.click());
$('#gsIconImgInput')?.addEventListener('change',e=>{
  const f=e.target.files?.[0]; if(!f) return;
  gsNewIconFile=f; gsNewIconEmoji=null;
  const r=new FileReader(); r.onload=ev=>{
    const iw=$('#gsIconWrap');if(iw)iw.innerHTML=`<img src="${ev.target.result}" alt="" />`;
    const gs=$('#gsImgStatus');if(gs)gs.textContent=f.name.slice(0,20)+'...';
    // Show save bar
    $('#gsSaveIconBar')?.classList.remove('hidden');
  }; r.readAsDataURL(f);
});

/* EXPLICIT SAVE ICON BUTTON */
$('#gsBtnSaveIcon')?.addEventListener('click',saveGroupIcon);

async function saveGroupIcon(){
  if(!gsNewIconEmoji&&!gsNewIconFile){toast('Elige un emoji o imagen primero','info');return;}
  const btn=$('#gsBtnSaveIcon');if(btn){btn.disabled=true;btn.textContent='⟳ GUARDANDO...';}
  try{
    let iconUrl=gsCurrentGroup.iconUrl||null;
    let icon=gsCurrentGroup.icon||'👥';
    if(gsNewIconFile){
      toast('📤 Subiendo icono...','info');
      try{iconUrl=await uploadImg(gsNewIconFile,'group_icons');}
      catch(uploadErr){toast(`❌ Error Storage: ${uploadErr.code||uploadErr.message}`,'error');if(btn){btn.disabled=false;btn.textContent='💾 GUARDAR ICONO';}return;}
    }
    if(gsNewIconEmoji){icon=gsNewIconEmoji;iconUrl=null;}
    await updateDoc(doc(db,'groups',gsCurrentGroup.id),{icon,iconUrl:iconUrl||null});
    gsCurrentGroup.icon=icon;gsCurrentGroup.iconUrl=iconUrl||null;
    const idx=groupList.findIndex(x=>x.id===gsCurrentGroup.id);
    if(idx>=0){groupList[idx].icon=icon;groupList[idx].iconUrl=iconUrl||null;}
    renderGroups(); updateChatHd(gsCurrentGroup);
    gsNewIconFile=null;gsNewIconEmoji=null;
    $('#gsSaveIconBar')?.classList.add('hidden');
    toast('✅ Icono actualizado');
  }catch(e){toast('❌ Error','error');console.error(e);}
  if(btn){btn.disabled=false;btn.textContent='💾 GUARDAR ICONO';}
}

$('#gsBtnLeave')?.addEventListener('click',async()=>{
  if(!gsCurrentGroup) return;
  if(!confirm(`¿Salir del grupo "${gsCurrentGroup.name}"?`)) return;
  const btn=$('#gsBtnLeave');btn.disabled=true;btn.textContent='⟳';
  try{
    await updateDoc(doc(db,'groups',gsCurrentGroup.id),{members:arrayRemove(CU.uid)});
    groupList=groupList.filter(g=>g.id!==gsCurrentGroup.id);
    if(currentId===gsCurrentGroup.id){
      currentId=null;currentType=null;currentGroupId=null;
      if(msgUnsub){msgUnsub();msgUnsub=null;}
      $('#thread').innerHTML='<div class="chat-empty"><div class="ce-icon">📡</div><div class="ce-title">MOONVEIL CHAT</div><div class="ce-desc">Selecciona un contacto</div></div>';
      showContactsPanel();
    }
    closeModal('#groupSettingsModal');renderGroups();
    toast('✅ Saliste del grupo');
  }catch(e){toast('❌ Error','error');console.error(e);btn.disabled=false;btn.textContent='🚪 SALIR';}
});

$('#gsBtnDissolve')?.addEventListener('click',async()=>{
  if(!gsCurrentGroup) return;
  if(!confirm(`¿Disolver permanentemente el grupo "${gsCurrentGroup.name}"?`)) return;
  const btn=$('#gsBtnDissolve');btn.disabled=true;btn.textContent='⟳';
  try{
    await deleteDoc(doc(db,'groups',gsCurrentGroup.id));
    groupList=groupList.filter(g=>g.id!==gsCurrentGroup.id);
    if(currentId===gsCurrentGroup.id){
      currentId=null;currentType=null;currentGroupId=null;
      if(msgUnsub){msgUnsub();msgUnsub=null;}
      $('#thread').innerHTML='<div class="chat-empty"><div class="ce-icon">📡</div><div class="ce-title">MOONVEIL CHAT</div><div class="ce-desc">Selecciona un contacto</div></div>';
      showContactsPanel();
    }
    closeModal('#groupSettingsModal');renderGroups();
    toast('✅ Grupo disuelto');
  }catch(e){toast('❌ Error','error');console.error(e);btn.disabled=false;btn.textContent='💥 DISOLVER';}
});

async function addMemberToGroup(groupId,uid){
  await updateDoc(doc(db,'groups',groupId),{members:arrayUnion(uid)});
  const idx=groupList.findIndex(x=>x.id===groupId);
  if(idx>=0&&!groupList[idx].members.includes(uid)){
    groupList[idx].members.push(uid);
    if(gsCurrentGroup?.id===groupId)gsCurrentGroup.members.push(uid);
    renderGsMembers(groupList[idx],groupList[idx].createdBy===CU.uid);
    renderGroups();
  }
}

/* ══════════════════════════════════════
   GROUP CREATION — now includes description
══════════════════════════════════════ */
let groupSelectedMembers=new Set(), groupIconEmoji='👥', groupIconFile=null;
const GROUP_EMOJIS=['👥','⚔️','🎮','🌙','🔥','💎','🏆','🌿','🚀','🎯','🎵','⭐'];

function openGroupModal(){
  groupSelectedMembers=new Set([CU.uid]);
  groupIconEmoji='👥'; groupIconFile=null;
  const gip=$('#groupIconPreview');if(gip){gip.innerHTML='';gip.textContent='👥';}
  const gni=$('#groupNameInput');if(gni)gni.value='';
  const gdi=$('#groupDescInput');if(gdi)gdi.value='';
  renderGroupEmojiGrid();
  renderGroupMembersList();
  renderGroupSelectedChips();
  openModal('#groupModal');
}

function renderGroupEmojiGrid(){
  const grid=$('#groupEmojiGrid'); if(!grid) return;
  grid.innerHTML=GROUP_EMOJIS.map(e=>`<button class="group-em ${groupIconEmoji===e?'active':''}" data-ge="${e}">${e}</button>`).join('');
  $$('.group-em',grid).forEach(b=>b.addEventListener('click',()=>{groupIconEmoji=b.dataset.ge;groupIconFile=null;const p=$('#groupIconPreview');if(p){p.innerHTML='';p.textContent=groupIconEmoji;}$$('.group-em',grid).forEach(x=>x.classList.remove('active'));b.classList.add('active');}));
}
function renderGroupMembersList(){
  const cont=$('#groupMembersList'),nf=$('#groupNoFriends'); if(!cont) return;
  if(!friendList.length){if(nf)nf.style.display='block';return;}
  if(nf)nf.style.display='none';
  cont.innerHTML=friendList.map(f=>{
    const sel=groupSelectedMembers.has(f.uid);
    return`<div class="group-member-row ${sel?'selected':''}" data-uid="${esc(f.uid)}">
      <div class="gm-av">${avHTML(f.avatar,32)}</div>
      <span class="gm-name">${esc(f.name.toUpperCase())}</span>
      <span class="gm-check">${sel?'✓':''}</span>
    </div>`;
  }).join('');
  $$('.group-member-row',cont).forEach(row=>row.addEventListener('click',()=>{
    const uid=row.dataset.uid;
    if(groupSelectedMembers.has(uid))groupSelectedMembers.delete(uid);
    else groupSelectedMembers.add(uid);
    renderGroupMembersList(); renderGroupSelectedChips();
  }));
}
function renderGroupSelectedChips(){
  const cont=$('#groupSelectedChips'),cnt=$('#groupSelectedCount'); if(!cont) return;
  const members=[...groupSelectedMembers].filter(uid=>uid!==CU.uid);
  if(cnt)cnt.textContent=members.length;
  cont.innerHTML=members.map(uid=>{
    const f=friendList.find(x=>x.uid===uid);
    const name=f?f.name:'?';
    return`<div class="gsc">${esc(name)}<button data-uid="${esc(uid)}">✕</button></div>`;
  }).join('');
  $$('.gsc button',cont).forEach(b=>b.addEventListener('click',()=>{groupSelectedMembers.delete(b.dataset.uid);renderGroupMembersList();renderGroupSelectedChips();}));
}

$('#btnNewGroup')?.addEventListener('click',openGroupModal);
$('#groupModalOverlay')?.addEventListener('click',()=>closeModal('#groupModal'));
$('#groupModalClose')?.addEventListener('click',()=>closeModal('#groupModal'));
$('#groupModalCancel')?.addEventListener('click',()=>closeModal('#groupModal'));
$('#btnGroupImgPick')?.addEventListener('click',()=>$('#groupImgInput')?.click());
$('#groupImgInput')?.addEventListener('change',e=>{
  const f=e.target.files?.[0]; if(!f) return;
  groupIconFile=f;
  const r=new FileReader(); r.onload=ev=>{const p=$('#groupIconPreview');if(p){p.innerHTML=`<img src="${esc(ev.target.result)}" alt="" />`;}};r.readAsDataURL(f);
});

$('#groupModalCreate')?.addEventListener('click',async()=>{
  const btn=$('#groupModalCreate'); btn.textContent='⟳ CREANDO...'; btn.disabled=true;
  const name=$('#groupNameInput')?.value.trim();
  const description=$('#groupDescInput')?.value.trim()||'';
  if(!name){toast('Escribe un nombre','error');btn.textContent='CREAR GRUPO ►';btn.disabled=false;return;}
  const members=[...groupSelectedMembers];
  if(members.length<2){toast('Agrega al menos un amigo','error');btn.textContent='CREAR GRUPO ►';btn.disabled=false;return;}
  try{
    let iconUrl=null;
    if(groupIconFile){toast('📤 Subiendo icono...','info');iconUrl=await uploadImg(groupIconFile,'group_icons');}
    const gRef=await addDoc(collection(db,'groups'),{name,icon:groupIconEmoji,iconUrl,description,members,createdBy:CU.uid,createdAt:serverTimestamp()});
    const newGroup={id:gRef.id,type:'group',name,icon:groupIconEmoji,iconUrl,description,members,createdAt:new Date().toISOString(),unread:0};
    groupList.push(newGroup);
    renderGroups();
    closeModal('#groupModal');
    toast(`✅ Grupo "${name}" creado`);
    selectContact(gRef.id);
  } catch(e){toast('❌ Error creando grupo','error');console.error(e);}
  btn.textContent='CREAR GRUPO ►'; btn.disabled=false;
});

/* ══════════════════════════════════════
   STATUS SYSTEM
══════════════════════════════════════ */
function loadFriendStatuses(){
  statusUnsubs.forEach(u=>u()); statusUnsubs=[];
  statusUnsubs.push(onSnapshot(doc(db,'userStatuses',CU.uid),snap=>{
    const now=new Date();
    myStatuses=snap.exists()?(snap.data().stories||[]).filter(s=>new Date(s.expiresAt)>now):[];
    renderStoriesBar();
  }));
  friendList.forEach(f=>{
    statusUnsubs.push(onSnapshot(doc(db,'userStatuses',f.uid),snap=>{
      const now=new Date();
      friendStatuses[f.uid]=snap.exists()?(snap.data().stories||[]).filter(s=>new Date(s.expiresAt)>now):[];
      renderStoriesBar();
    }));
  });
}

function renderStoriesBar(){
  const cont=$('#storiesContainer'); if(!cont) return;
  const s=getS(), myAv=myProfile.avatar||s.emojiAvatar||'🌙';
  let html=`<div class="story-bubble my-s ${myStatuses.length?'unseen':''}" data-uid="__me" title="MI ESTADO">
    <div class="sb-ring">${avHTML(myAv,52)}</div><div class="sb-label">YO</div>
  </div>`;
  const bg={};BOT_STORIES.forEach(st=>{if(!bg[st.contact])bg[st.contact]=[];bg[st.contact].push(st);});
  Object.entries(bg).forEach(([cid,stories])=>{
    const bot=BOTS.find(b=>b.id===cid); if(!bot) return;
    const unseen=stories.some(s=>!s.seen);
    html+=`<div class="story-bubble ${unseen?'unseen':'seen'}" data-cid="${esc(cid)}" title="${esc(bot.name)}">
      <div class="sb-ring"><img src="${esc(bot.avatar)}" alt="" /></div><div class="sb-label">${esc(bot.name.split(' ')[0])}</div>
    </div>`;
  });
  friendList.forEach(f=>{
    const stories=friendStatuses[f.uid]||[]; if(!stories.length) return;
    const unseen=stories.some(st=>!seenStatuses[st.id]);
    html+=`<div class="story-bubble ${unseen?'unseen':'seen'}" data-uid="${esc(f.uid)}" title="${esc(f.name)}">
      <div class="sb-ring">${avHTML(f.avatar,52)}</div><div class="sb-label">${esc(f.name.split(' ')[0])}</div>
    </div>`;
  });
  cont.innerHTML=html;
  $$('.story-bubble',cont).forEach(el=>{
    el.addEventListener('click',()=>{
      const uid=el.dataset.uid,cid=el.dataset.cid;
      if(uid==='__me'){myStatuses.length?openViewer(myStatuses,'Yo',myAv):openStatusCreator();}
      else if(cid){const stories=BOT_STORIES.filter(s=>s.contact===cid);const bot=BOTS.find(b=>b.id===cid);if(bot&&stories.length)openViewer(stories,bot.name,bot.avatar);}
      else if(uid){const stories=friendStatuses[uid]||[];const f=friendList.find(x=>x.uid===uid);if(f&&stories.length)openViewer(stories,f.name,f.avatar);}
    });
  });
}

/* ── Story viewer ── */
let vList=[],vIdx=0,vTimer=null;
function openViewer(stories,name,avatar){
  vList=stories;vIdx=0;
  const vn=$('#viewerName');if(vn)vn.textContent=name.toUpperCase();
  const va=$('#viewerAvatar');
  if(va){va.innerHTML=avHTML(avatar,42);va.style.fontSize=(avatar&&(avatar.startsWith('http')||avatar.includes('/')))?'':'1.4rem';}
  $('#storyViewer').style.display='flex';
  loadViewerStory();
}
function loadViewerStory(){
  const s=vList[vIdx]; if(!s) return;
  clearTimeout(vTimer);
  const cont=$('#storyContent');if(!cont)return;
  cont.style.opacity='0';
  setTimeout(()=>{
    const mediaUrl=s.url||(s.type!=='text'?s.content:null)||null;
    const textContent=s.type==='text'?(s.content||s.text||''):'';
    const caption=s.caption||(s.type!=='text'?s.text:'')||'';
    const bg=s.bgColor||'#0a1a10';
    let html='';
    if(s.type==='video'&&mediaUrl) html=`<video src="${esc(mediaUrl)}" autoplay controls style="max-width:90%;max-height:62vh;border:3px solid var(--border)"></video>`;
    else if(s.type==='audio'&&mediaUrl) html=`<audio src="${esc(mediaUrl)}" autoplay controls style="width:260px"></audio>`;
    else if(s.type==='image'&&mediaUrl) html=`<img src="${esc(mediaUrl)}" alt="" style="max-width:90%;max-height:62vh;border:3px solid var(--border)" />`;
    else if(s.type==='text'&&textContent) html=`<div class="sv-text-card" style="background:${esc(bg)}"><p>${esc(textContent).replace(/\n/g,'<br>')}</p></div>`;
    if(caption) html+=`<div class="sv-caption">${esc(caption).replace(/\n/g,'<br>')}</div>`;
    cont.innerHTML=html||`<div class="sv-text-card" style="background:${esc(bg)}"><p>📡</p></div>`;
    cont.style.opacity='1';
    seenStatuses[s.id]=true; localStorage.setItem('mv_seen_st',JSON.stringify(seenStatuses));
    if(s.createdAt){const vt=$('#viewerTime');if(vt)vt.textContent=timeAgo(s.createdAt);}
    const vv=$('#viewerViews');if(vv)vv.textContent=(s.views?.length>0)?`${s.views.length} vista${s.views.length>1?'s':''}` : '';
    buildVBars();
    vTimer=setTimeout(nextVStory,s.duration||5000);
  },120);
}
function buildVBars(){const pb=$('#progressBars');if(!pb)return;pb.innerHTML='';vList.forEach((_,i)=>{const bar=document.createElement('div');if(i===vIdx){const fill=document.createElement('div');fill.className='sv-bar-fill';fill.style.animationDuration=(vList[vIdx].duration||5000)+'ms';bar.appendChild(fill);}pb.appendChild(bar);});}
const nextVStory=()=>vIdx<vList.length-1?(vIdx++,loadViewerStory()):closeViewer();
const prevVStory=()=>vIdx>0&&(vIdx--,loadViewerStory());
function closeViewer(){const v=$('#storyViewer');if(v)v.style.display='none';clearTimeout(vTimer);renderStoriesBar();}
$('#svNext')?.addEventListener('click',nextVStory);
$('#svPrev')?.addEventListener('click',prevVStory);
$('#closeViewer')?.addEventListener('click',closeViewer);
$('#scrollRight')?.addEventListener('click',()=>{const c=$('#storiesContainer');if(c)c.scrollLeft+=160;});
$('#scrollLeft')?.addEventListener('click',()=>{const c=$('#storiesContainer');if(c)c.scrollLeft-=160;});

/* ── Status Creator ── */
let scColor='#0a1a10', scImg=null;
function openStatusCreator(){
  scColor='#0a1a10';scImg=null;
  const ti=$('#statusTextInput');if(ti)ti.value='';
  const ci=$('#statusImgCaption');if(ci)ci.value='';
  const ip=$('#statusImgPreview');if(ip){ip.src='';ip.classList.add('hidden');}
  const sd=$('#statusImgDrop');if(sd)sd.style.display='';
  const sp=$('#statusTextPreview');if(sp)sp.style.background=scColor;
  const sp2=$('#statusTextPreviewContent');if(sp2)sp2.textContent='Tu estado aquí…';
  openModal('#statusCreatorModal');
}
$('#btnAddStatus')?.addEventListener('click',openStatusCreator);
$('#statusCreatorOverlay')?.addEventListener('click',()=>closeModal('#statusCreatorModal'));
$('#statusCreatorClose')?.addEventListener('click',()=>closeModal('#statusCreatorModal'));
$('#statusCreatorCancel')?.addEventListener('click',()=>closeModal('#statusCreatorModal'));
$$('.stab').forEach(btn=>btn.addEventListener('click',()=>{
  $$('.stab').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
  $$('.stab-pane').forEach(p=>p.classList.add('hidden'));
  $(`#statusTab${btn.dataset.tab.charAt(0).toUpperCase()+btn.dataset.tab.slice(1)}`)?.classList.remove('hidden');
}));
$('#statusTextInput')?.addEventListener('input',e=>{const v=e.target.value||'Tu estado aquí…';const prev=$('#statusTextPreviewContent');if(prev)prev.textContent=v;const cnt=$('#statusCharCount');if(cnt)cnt.textContent=e.target.value.length;});
$$('.sc').forEach(btn=>btn.addEventListener('click',()=>{$$('.sc').forEach(b=>b.classList.remove('active'));btn.classList.add('active');scColor=btn.dataset.color;const sp=$('#statusTextPreview');if(sp)sp.style.background=scColor;}));
$('#statusImgDrop')?.addEventListener('click',()=>$('#statusImgInput')?.click());
$('#statusImgInput')?.addEventListener('change',e=>{
  const f=e.target.files?.[0]; if(!f) return;
  if(f.size>5*1024*1024){toast('Imagen muy grande (máx 5MB)','error');return;}
  scImg=f;
  const r=new FileReader(); r.onload=ev=>{
    const p=$('#statusImgPreview');if(p){p.src=ev.target.result;p.classList.remove('hidden');}
    const d=$('#statusImgDrop');if(d)d.style.display='none';
  }; r.readAsDataURL(f);
});
$('#statusCreatorPublish')?.addEventListener('click',async()=>{
  const btn=$('#statusCreatorPublish');
  btn.textContent='⏳...';btn.disabled=true;
  const reset=()=>{btn.textContent='PUBLICAR ►';btn.disabled=false;};
  try{
    const tab=$('.stab.active')?.dataset.tab||'text';
    if(tab==='text'){
      const text=$('#statusTextInput')?.value.trim();
      if(!text){toast('Escribe algo primero','error');reset();return;}
      await createStatus('text',text,'',scColor);
      closeModal('#statusCreatorModal');
      toast('✅ Estado publicado (15 días)');
    } else {
      if(!scImg){toast('Selecciona una imagen primero','error');reset();return;}
      toast('📤 Subiendo imagen...','info');
      let url;
      try{
        url=await uploadImg(scImg,'statuses');
      } catch(uploadErr){
        console.error('upload error',uploadErr);
        toast(`❌ Error al subir: ${uploadErr.code||uploadErr.message||'revisa reglas de Storage'}`, 'error');
        reset(); return;
      }
      const cap=$('#statusImgCaption')?.value.trim()||'';
      await createStatus('image',url,cap,'');
      closeModal('#statusCreatorModal');
      toast('✅ Estado publicado (15 días)');
    }
  } catch(e){
    console.error('publish status error',e);
    toast(`❌ Error: ${e.code||e.message||'inténtalo de nuevo'}`, 'error');
  }
  reset();
});
async function createStatus(type,content,caption,bgColor){
  const id=`st_${Date.now()}`,now=new Date(),exp=new Date(now.getTime()+15*24*3600*1000);
  await setDoc(doc(db,'userStatuses',CU.uid),{stories:arrayUnion({id,type,content,caption,bgColor,createdAt:now.toISOString(),expiresAt:exp.toISOString(),views:[]})},{merge:true});
}

/* ══════════════════════════════════════
   SETTINGS
══════════════════════════════════════ */
$('#btnSettings')?.addEventListener('click',()=>openModal('#settingsModal'));
$('#settingsOverlay')?.addEventListener('click',()=>closeModal('#settingsModal'));
$('#settingsClose')?.addEventListener('click',()=>closeModal('#settingsModal'));
$$('.sn-btn').forEach(btn=>btn.addEventListener('click',()=>{$$('.sn-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');$$('.sett-pane').forEach(p=>p.classList.remove('active'));$(`#sett-${btn.dataset.sec}`)?.classList.add('active');}));
function loadSettingsUI(){
  const s=getS();
  const fields={settSound:'sound',settBadge:'badge',settCompact:'compact',settEnterSend:'enterSend',settLastSeen:'lastSeen',settReadReceipts:'readReceipts'};
  Object.entries(fields).forEach(([id,key])=>{const el=$(`#${id}`);if(el)el.checked=s[key];});
  if($('#settStoryVisibility'))$('#settStoryVisibility').value=s.storyVisibility;
  if($('#settProfileName'))$('#settProfileName').value=s.profileName||myProfile.nombre||'';
  if($('#settStatusMsg'))$('#settStatusMsg').value=s.statusMsg;
  const fr=$(`input[name="fontSize"][value="${s.fontSize}"]`);if(fr)fr.checked=true;
  $$('.wp-btn').forEach(b=>b.classList.toggle('active',b.dataset.wp===s.wallpaper));
  const AVOS=['🌙','⚔️','🛡️','🗡️','🧪','📚','🌿','💎','🔮','🦊','🐺','🌟','🎮','🏆','⭐','🔥'];
  const picker=$('#emojiAvatarPicker');
  if(picker){picker.innerHTML=AVOS.map(e=>`<button class="ea-btn ${s.emojiAvatar===e?'active':''}" data-e="${e}">${e}</button>`).join('');$$('.ea-btn',picker).forEach(b=>b.addEventListener('click',()=>{$$('.ea-btn',picker).forEach(x=>x.classList.remove('active'));b.classList.add('active');}));}
  const pid=localStorage.getItem('mv_player_id')||myProfile.player_id||'';
  if($('#settPlayerId'))$('#settPlayerId').textContent=pid||'—';
  if($('#settEmail'))$('#settEmail').textContent=myProfile.email||CU?.email||'—';
}
$('#settSaveProfile')?.addEventListener('click',async()=>{
  const name=$('#settProfileName')?.value.trim()||'';
  const statusMsg=$('#settStatusMsg')?.value.trim()||'Aqui en mi World';
  const activeEm=$('.ea-btn.active')?.dataset.e||getS().emojiAvatar;
  const s=getS();s.profileName=name;s.statusMsg=statusMsg;s.emojiAvatar=activeEm;saveS(s);
  const dn=$('#myDisplayName');if(dn)dn.textContent=(name||myProfile.nombre||'JUGADOR').toUpperCase();
  const st=$('#myStatusText');if(st)st.textContent=statusMsg;
  const avEl=$('#myAvatarHeader');if(avEl){avEl.innerHTML='';avEl.textContent=activeEm;avEl.style.fontSize='1.4rem';}
  try{await updateDoc(doc(db,'users',CU.uid),{nombre:name||myProfile.nombre,avatar:activeEm});}catch{}
  toast('✅ Perfil actualizado');
});
const fields2={settSound:'sound',settBadge:'badge',settCompact:'compact',settEnterSend:'enterSend',settLastSeen:'lastSeen',settReadReceipts:'readReceipts'};
Object.entries(fields2).forEach(([id,key])=>{$(`#${id}`)?.addEventListener('change',e=>{const s=getS();s[key]=e.target.checked;saveS(s);});});
$$('input[name="fontSize"]').forEach(r=>r.addEventListener('change',e=>{const s=getS();s.fontSize=e.target.value;saveS(s);}));
$$('.wp-btn').forEach(btn=>btn.addEventListener('click',()=>{$$('.wp-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');const s=getS();s.wallpaper=btn.dataset.wp;saveS(s);}));
$('#settStoryVisibility')?.addEventListener('change',e=>{const s=getS();s.storyVisibility=e.target.value;saveS(s);});
$('#settCopyPlayerId')?.addEventListener('click',()=>{const pid=$('#settPlayerId')?.textContent||'';if(pid&&pid!=='—')navigator.clipboard?.writeText(pid).then(()=>toast('📋 ID copiado'));});
$('#settRequestNotif')?.addEventListener('click',()=>Notification.requestPermission().then(p=>toast(p==='granted'?'🔔 Notificaciones activadas':'❌ Permiso denegado',p==='granted'?'':'error')));
$('#settClearBotChats')?.addEventListener('click',()=>{if(currentType==='bot'&&$('#thread'))$('#thread').innerHTML='';toast('🗑️ Chats limpiados');});
$('#settDeleteStatuses')?.addEventListener('click',async()=>{try{await setDoc(doc(db,'userStatuses',CU.uid),{stories:[]});myStatuses=[];renderStoriesBar();toast('🗑️ Estados eliminados');}catch{toast('❌ Error','error');}});
$('#settSignOut')?.addEventListener('click',async()=>{await setOffline();await signOut(auth);location.href='index.html';});

/* ── Music ── */
window.toggleMusic=function(){const a=$('#bg-music'),b=$('#musicBtn');if(!a||!b)return;if(a.paused){a.play().then(()=>{b.classList.add('active');localStorage.setItem('music','on');}).catch(()=>{});}else{a.pause();b.classList.remove('active');localStorage.setItem('music','off');}};
window.addEventListener('DOMContentLoaded',()=>{if(localStorage.getItem('music')==='on'){const a=$('#bg-music'),b=$('#musicBtn');a?.play().then(()=>b?.classList.add('active')).catch(()=>{});}});

/* ── Bot notification sim ── */
setInterval(()=>{const pool=BOTS.filter(c=>c.id!==currentId);if(!pool.length)return;const c=pool[Math.floor(Math.random()*pool.length)];if(muted.has(c.id)||!getS().badge)return;c.unread=Math.min(99,(c.unread||0)+1);renderBots();},22000+Math.random()*15000);


/* =====================================================================
   contactos_pass_tier.js  v1.0
   Módulo auxiliar — lógica de TIER DEL PASE para contactos.js

   Puedes importarlo directamente, o copiar sus funciones en contactos.js.
   ===================================================================== */

/*
 * DATOS DEL TIER:
 * ───────────────
 * Firestore guarda en cada usuario:
 *   active_pass_tier: {
 *     tierId:   'stone' | 'iron' | 'gold' | 'emerald' | 'diamond'
 *     passId:   'pass_s3'
 *     passName: 'Despertar de la Naturaleza'
 *     expiresAt: '2026-03-31T23:59:59'  ← ISO string
 *   }
 *   o  active_pass_tier: null  (sin pase pagado activo)
 *
 * Si expiresAt < ahora → se ignora (pase terminado, color blanco)
 * Si tierId === 'stone' → también sin medalla (es gratis, no se muestra)
 */

/* ── Mapeo de tier → estilos ─────────────────────────────────────────
   color:      color CSS del nombre del amigo en la lista de contactos
   glow:       sombra de texto sutil
   medalEmoji: emoji de medalla que aparece junto al nombre
   medalClass: clase CSS de la medalla (para animaciones)
   label:      texto corto para tooltip/accesibilidad
   ─────────────────────────────────────────────────────────────────── */
export const PASS_TIER_STYLES = {
  stone: {
    color:      'var(--white)',   /* Sin cambio: blanco normal */
    glow:       'none',
    medalEmoji: null,             /* Sin medalla */
    medalClass: '',
    label:      'Pase Piedra',
  },
  iron: {
    color:      '#c0c8d0',
    glow:       '0 0 6px rgba(180,195,210,0.55)',
    medalEmoji: '⬛',
    medalClass: 'pt-medal pt-iron',
    label:      'Pase Hierro',
  },
  gold: {
    color:      '#f5c518',
    glow:       '0 0 8px rgba(245,197,24,0.55)',
    medalEmoji: '🟨',
    medalClass: 'pt-medal pt-gold',
    label:      'Pase Oro',
  },
  emerald: {
    color:      '#2eef8a',
    glow:       '0 0 10px rgba(46,239,138,0.65)',
    medalEmoji: '🟩',
    medalClass: 'pt-medal pt-emerald',
    label:      'Pase Esmeralda',
  },
  diamond: {
    color:      null,             /* Multicolor → ver CSS */
    glow:       '0 0 12px rgba(103,232,249,0.6)',
    medalEmoji: '🔷',
    medalClass: 'pt-medal pt-diamond',
    label:      'Pase Diamante',
  },
};

/* ── Devuelve el tier efectivo de un amigo (o 'stone' si expiró/nulo) ── */
export function getEffectiveTier(friendData) {
  const pt = friendData?.active_pass_tier;
  if (!pt || !pt.tierId || !pt.expiresAt) return 'stone';
  const now = new Date().toISOString();
  if (pt.expiresAt < now) return 'stone';   /* Pase terminado */
  return pt.tierId || 'stone';
}

/* ── HTML del nombre con color y medalla ────────────────────────────── */
export function buildNameWithTier(name, tier) {
  const style = PASS_TIER_STYLES[tier] || PASS_TIER_STYLES.stone;
  const safeName = name.replace(/[&<>"']/g, m =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])
  );

  /* Construir el span del nombre */
  let nameHtml;
  if (tier === 'diamond') {
    /* Nombre con gradiente arcoíris animado */
    nameHtml = `<span class="ci-name-text pt-name-diamond">${safeName}</span>`;
  } else if (tier !== 'stone' && style.color) {
    nameHtml = `<span class="ci-name-text" style="color:${style.color};${style.glow !== 'none' ? `text-shadow:${style.glow}` : ''}">${safeName}</span>`;
  } else {
    nameHtml = `<span class="ci-name-text">${safeName}</span>`;
  }

  /* Medalla (solo si no es stone) */
  const medalHtml = (tier !== 'stone' && style.medalClass)
    ? `<span class="${style.medalClass}" title="${style.label}"></span>`
    : '';

  return nameHtml + medalHtml;
}

/* ── Tooltip del tier ────────────────────────────────────────────────── */
export function getTierTooltip(friendData) {
  const pt = friendData?.active_pass_tier;
  if (!pt || !pt.tierId || pt.tierId === 'stone') return '';
  const now = new Date().toISOString();
  if (!pt.expiresAt || pt.expiresAt < now) return '';
  const style = PASS_TIER_STYLES[pt.tierId];
  if (!style) return '';
  const fecha = pt.expiresAt.slice(0, 10);
  return `${style.label} — ${pt.passName || ''} (hasta ${fecha})`;
}





/* =====================================================================
   contactos_patch.js  v1.0
   ─────────────────────────────────────────────────────────────────────
   Contiene ÚNICAMENTE las funciones de contactos.js que necesitas
   REEMPLAZAR para añadir el sistema de tier de pase.

   INSTRUCCIONES:
   1. Pega el bloque de IMPORTS al inicio del archivo contactos.js
   2. Busca cada función marcada con ── REEMPLAZAR ── y sustitúyela
   3. Añade los event-listener marcados con ── AÑADIR ──
   ===================================================================== */

/* ══════════════════════════════════════════════════════
   PASO 1 — IMPORTS (añadir al principio de contactos.js)
   ══════════════════════════════════════════════════════ */
import {
  getEffectiveTier,
  buildNameWithTier,
  getTierTooltip,
  PASS_TIER_STYLES,
} from './contactos_pass_tier.js';


/* ══════════════════════════════════════════════════════
   PASO 2 — Helpers internos de tier
   Añadir en la sección de "Helpers" de contactos.js
   ══════════════════════════════════════════════════════ */

/**
 * Extrae el tier efectivo de los datos de un snapshot de Firestore/amigo.
 * Reutiliza la lógica del módulo auxiliar.
 */
const getFriendTier = (friendData) => getEffectiveTier(friendData);

/**
 * Clases CSS para el borde izquierdo del contact-item según tier.
 */
const tierItemClass = (tier) => {
  if (!tier || tier === 'stone') return '';
  return `tier-${tier}`;
};

/**
 * Badge HTML del tier (junto al badge AMIGO).
 */
const tierBadgeHtml = (tier) => {
  const labels = {
    iron:    '⬛ HIERRO',
    gold:    '★ ORO',
    emerald: '◆ ESMERALDA',
    diamond: '◈ DIAMANTE',
  };
  if (!tier || tier === 'stone' || !labels[tier]) return '';
  return `<span class="ci-badge tier-${tier}">${labels[tier]}</span>`;
};

/**
 * Aplica las clases/estilos de tier a la cabecera del chat derecho.
 */
function applyChatHeaderTier(tier) {
  const pn = $('#peerName');
  if (!pn) return;
  /* Limpiar clases anteriores */
  pn.className = 'chat-peer-name';
  if (tier && tier !== 'stone') {
    pn.classList.add(`tier-${tier}`);
  }
}


/* ══════════════════════════════════════════════════════
   PASO 3 — Modificar mkFriend
   ── REEMPLAZAR la función mkFriend completa ──
   ══════════════════════════════════════════════════════ */
function mkFriend(uid, d) {
  return {
    id:         `fr_${uid}`,
    uid,
    type:       'friend',
    name:       d.nombre || 'Amigo',
    avatar:     d.avatar || '👤',
    titleId:    d.title_active || '',
    online:     d.presence?.state === 'online',
    lastSeen:   d.presence?.lastSeen || null,
    playerId:   d.player_id || '',
    unread:     0,
    /* ── NUEVO: tier del pase activo ── */
    passTier:   getEffectiveTier(d),   /* 'stone' | 'iron' | 'gold' | 'emerald' | 'diamond' */
    passData:   d.active_pass_tier || null,  /* objeto completo para tooltip */
  };
}


/* ══════════════════════════════════════════════════════
   PASO 4 — Modificar el listener de presencia en loadFriends
   ── REEMPLAZAR el bloque del onSnapshot de presencia ──

   Dentro de loadFriends(), busca:
     presenceUnsubs.push(onSnapshot(doc(db,'users',f.uid), snap => {
       ...
       Object.assign(friendList[idx], { online:..., lastSeen:..., avatar:..., name:..., titleId:... });
       ...
     }));

   Y reemplázalo por:
   ══════════════════════════════════════════════════════ */
presenceUnsubs.push(onSnapshot(doc(db, 'users', f.uid),
  snap => {
    if (!snap.exists()) return;
    const d = snap.data();
    const idx = friendList.findIndex(x => x.uid === f.uid);
    if (idx < 0) return;
    Object.assign(friendList[idx], {
      online:    d.presence?.state === 'online',
      lastSeen:  d.presence?.lastSeen || null,
      avatar:    d.avatar || friendList[idx].avatar,
      name:      d.nombre || friendList[idx].name,
      titleId:   d.title_active || friendList[idx].titleId,
      /* ── NUEVO: actualizar tier en tiempo real ── */
      passTier:  getEffectiveTier(d),
      passData:  d.active_pass_tier || null,
    });
    renderFriends();
    if (currentId === f.id) {
      updateChatHd(friendList[idx]);
      applyChatHeaderTier(friendList[idx].passTier);
    }
  },
  err => console.warn('[DB] snap err:', err)
));


/* ══════════════════════════════════════════════════════
   PASO 5 — Reemplazar friendItem completo
   ── REEMPLAZAR la función friendItem completa ──
   ══════════════════════════════════════════════════════ */
function friendItem(c) {
  const active  = currentId === c.id;
  const tier    = c.passTier || 'stone';
  const tierCls = tierItemClass(tier);

  /* Estado online/offline */
  const sub = c.online
    ? `<span style="color:var(--primary);font-size:.85rem">● EN LÍNEA</span>`
    : `<span class="ci-sub">${timeAgo(c.lastSeen)}</span>`;

  /* Título decorativo */
  const title = titleTag(c.titleId);

  /* Unread badge */
  const unread = c.unread
    ? `<span class="ci-unread fr">${c.unread > 99 ? '99+' : c.unread}</span>`
    : '';

  /* Online dot */
  const dotCls = c.online ? 'online' : '';

  /* Nombre con color de tier y medalla */
  const nameWithMedal = buildNameWithTier(c.name, tier);

  /* Badge de tier (solo si no es stone) */
  const tBadge = tierBadgeHtml(tier);

  /* Tooltip del tier para accesibilidad */
  const tooltip = getTierTooltip(c);
  const titleAttr = tooltip ? ` title="${esc(tooltip)}"` : '';

  return `<li class="contact-item friend-t ${tierCls} ${active ? 'active' : ''}"
            data-id="${esc(c.id)}"${titleAttr}>
    <div class="ci-av">
      ${avHTML(c.avatar, 44)}
      <div class="ci-online-dot ${dotCls}"></div>
    </div>
    <div class="ci-meta">
      <div class="ci-name">
        ${nameWithMedal}
        <span class="ci-badge friend">AMIGO</span>
        ${tBadge}
      </div>
      ${title ? `<div>${title}</div>` : ''}
      ${sub}
    </div>
    <div class="ci-extra">${unread}</div>
  </li>`;
}


/* ══════════════════════════════════════════════════════
   PASO 6 — Modificar selectContact para aplicar tier
             al abrir el chat derecho
   ── Dentro de selectContact, DESPUÉS de updateChatHd(c) ──
   Añade:

     updateChatHd(c);
     // ── NUEVO: aplicar color de tier en cabecera ──
     if (currentType === 'friend') {
       const frn = friendList.find(x => x.id === id);
       applyChatHeaderTier(frn?.passTier || 'stone');
     } else {
       applyChatHeaderTier('stone');
     }
   ══════════════════════════════════════════════════════ */


/* ══════════════════════════════════════════════════════
   PASO 7 — Modificar openFriendInfo para mostrar tier
   ── REEMPLAZAR openFriendInfo completo ──
   ══════════════════════════════════════════════════════ */
function openFriendInfo(c) {
  const t    = TM[c.titleId];
  const tier = c.passTier || 'stone';
  const ts   = PASS_TIER_STYLES[tier] || PASS_TIER_STYLES.stone;
  const pt   = c.passData;
  const hasPaidTier = tier !== 'stone';

  /* Bloque de tier del pase */
  const tierBlock = hasPaidTier ? `
    <div class="mig-block full">
      <div class="mig-title">🏆 PASE ACTIVO</div>
      <div class="mig-row">
        <span class="pt-medal ${ts.medalClass}" style="display:inline-flex;margin-right:6px;vertical-align:middle"></span>
        <strong>${ts.label}</strong>
        ${pt?.passName ? ` · ${esc(pt.passName)}` : ''}
      </div>
      ${pt?.expiresAt ? `<div class="mig-row" style="color:var(--muted);font-size:.85rem">Hasta: ${esc(pt.expiresAt.slice(0,10))}</div>` : ''}
    </div>` : '';

  $('#modalTitle').textContent = c.name.toUpperCase();
  $('#modalBody').innerHTML = `<div class="modal-info-grid">
    <div class="mig-block">
      <div class="mig-title">PERFIL</div>
      <div style="font-size:2rem;text-align:center;margin:8px 0">${avHTML(c.avatar, 52)}</div>
      <div class="mig-row"><strong>Nombre:</strong> ${esc(c.name)}</div>
      <div class="mig-row"><strong>Título:</strong> ${t ? `<span class="ci-title tp-${t.r}">✦${esc(t.n)}✦</span>` : '—'}</div>
      <div class="mig-row"><strong>ID:</strong> <code style="font-family:var(--fp);font-size:.3rem;color:var(--yellow)">${esc(c.playerId || '—')}</code></div>
    </div>
    <div class="mig-block">
      <div class="mig-title">ESTADO</div>
      <div class="mig-row">${c.online ? '🟢 EN LÍNEA' : '⚫ DESCONECTADO'}</div>
      <div class="mig-row"><strong>Visto:</strong> ${c.online ? 'Ahora mismo' : timeAgo(c.lastSeen)}</div>
    </div>
    ${tierBlock}
  </div>`;
  openModal('#contactModal');
}


/* ══════════════════════════════════════════════════════
   PASO 8 — Actualizar gsMembers (Group Settings)
             para mostrar tier de amigos dentro del grupo
   ── En renderGsMembers, el campo gs-m-title ya existe.
      Solo añadir el tier badge junto al nombre ──

   Dentro de renderGsMembers, busca:
     <div class="gs-m-name">${esc(name)}...

   Y añade justo después del nombre:
     ${tier && tier !== 'stone' ? `<span class="pt-medal ${PASS_TIER_STYLES[tier]?.medalClass||''}" title="${PASS_TIER_STYLES[tier]?.label||''}"></span>` : ''}

   Para obtener el tier de un miembro del grupo:
     const f = friendList.find(x => x.uid === uid);
     const tier = f?.passTier || 'stone';
   ══════════════════════════════════════════════════════ */


/* ══════════════════════════════════════════════════════
   RESUMEN DE CAMBIOS EN contactos.js
   ══════════════════════════════════════════════════════
   1. Añadir imports de contactos_pass_tier.js
   2. Añadir helpers: getFriendTier, tierItemClass,
      tierBadgeHtml, applyChatHeaderTier
   3. Reemplazar mkFriend → añadir passTier y passData
   4. En loadFriends → listener de presencia: añadir
      passTier y passData en Object.assign, llamar
      applyChatHeaderTier si es el chat abierto
   5. Reemplazar friendItem completo
   6. En selectContact → tras updateChatHd(), llamar
      applyChatHeaderTier
   7. Reemplazar openFriendInfo → añadir bloque de tier
   8. En renderGsMembers → añadir medalla junto al nombre

   ARCHIVOS EXTRA NECESARIOS:
   · contactos_pass_tier.js  (módulo auxiliar)
   · contactos_pass_tier.css (añadir al final de contactos.css
     o con <link> en contactos.html)
   ══════════════════════════════════════════════════════ */