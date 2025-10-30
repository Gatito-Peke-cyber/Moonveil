/* =========================================================
   Moonveil Portal — Contactos (JS)
   - Navbar responsive + HUD
   - Partículas + Parallax
   - Dataset de contactos + perfiles
   - Lista + búsqueda + estados + badges
   - Chat estilo WhatsApp (burbujas, typing)
   - Respuestas: por opciones, por keywords, cliché, censura
   - Quick replies por contacto
   - Modal info de contacto
   - Notificaciones (unread) y anclar/silenciar
   ========================================================= */

const $ = (q, ctx=document)=> ctx.querySelector(q);
const $$ = (q, ctx=document)=> Array.from(ctx.querySelectorAll(q));

/* ---------- Navbar ---------- */
const navToggle = $('#navToggle'), navLinks = $('#navLinks');
navToggle?.addEventListener('click', ()=> navLinks.classList.toggle('open'));

/* ---------- HUD ---------- */
(function setHudBars(){
  $$('.hud-bar').forEach(b=>{
    const v = +b.dataset.val || 50;
    b.style.setProperty('--v', v);
  });
})();

/* ---------- Partículas ---------- */
(function particles(){
  const c = $('#bgParticles'); if (!c) return;
  const ctx = c.getContext('2d'); const dpi = Math.max(1, devicePixelRatio||1);
  let w,h,parts;
  const init=()=>{ w=c.width=innerWidth*dpi; h=c.height=innerHeight*dpi;
    parts = new Array(80).fill(0).map(()=>({x:Math.random()*w,y:Math.random()*h,r:1+Math.random()*2*dpi,s:.2+Math.random(),a:.15+Math.random()*.35}))
  };
  const tick=()=>{ ctx.clearRect(0,0,w,h);
    parts.forEach(p=>{ p.y+=p.s; p.x+=Math.sin(p.y*0.002)*0.35; if(p.y>h){p.y=-10;p.x=Math.random()*w}
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fillStyle=`rgba(135,243,157,${p.a})`; ctx.fill();
    });
    requestAnimationFrame(tick);
  };
  init(); tick(); addEventListener('resize', init);
})();

/* ---------- Parallax ---------- */
(function parallax(){
  const layers = $$('.layer'); if (!layers.length) return;
  const k = [0, .03, .06, .1];
  const onScroll = ()=>{ const y = scrollY||0; layers.forEach((el,i)=> el.style.transform=`translateY(${y*k[i]}px)`) };
  onScroll(); addEventListener('scroll', onScroll, {passive:true});
})();

/* =========================================================
   DATASET de Contactos
   - id, name, alias, desc, avatar, mystery, gold, online, unread
   - kind: 'options' | 'keyword' | 'cliche' | 'censored' | 'echo'
   - quickReplies: [..]
   - profile: info para modal
   - brain: definición de respuestas por tipo
   ========================================================= */

const contacts = [
  {
    id:'c1',
    name:'Sand Brill',
    alias:'███████',
    desc:'Hola, tienes esmeraldas para darme.',
    avatar:'vill/vill1.jpg',
    mystery:false, gold:true, online:true, unread:2,
    kind:'options',
    quickReplies:['¿Hola?','Sabes de ███','¿Donde te ubicas?','E11-25','¿E11-25?'],
    profile:{
      correo:'sand.brill@moonveil.mv', seccion:'A-1', profesion:'█████████',
      pasatiempos:['Caminar','Dibujar','Pintar','Tradear'],
      mascotas:['Lobo "Runa"'],
      colorFav:'Verde Esmeralda'
    },
    brain:{
      prompt:'¿Qué necesitas?-Bueno yo necesito esmeraldas.',
      options:[
        { label:'¿Hola?', reply:'Hola!, supongo...Que paso...' },
        { label:'Sabes de ███', reply:'Obvio no! Ni se de quien me hablas si esta censurado.' },
        { label:'¿Donde te ubicas?', reply:'Donde, buena pregunta.Ni yo se la verdad...Pero quien sabe, capaz ya nos vimos.' },
        { label:'E11-25', reply:'Uy! Tu sabes que es eso...' },
        { label:'¿E11-25?', reply:'No, la verdad del tema no tengo informacion...Debes creerme.' },
        { label:'Esmeralda', reply:'Me gusta, me encanta.' },
        { label:'JUgador', reply:'Pues es alguien, espera osea tu...' },
        { label:'Hola', reply:'Pues hola, y que tal supongo.' },
        { label:'Bien', reply:'Que bien, ahora me das esmeraldas.' },
        { label:'Mal', reply:'Creo que tengo tu medicina, pues tradearme.' },
        { label:'Sand Brill', reply:'Quien es, quiero conocerlo, parece una gran persona.' },
        { label:'Y tu', reply:'Pues, esmeraldas, pero nada...' },
        { label:'Lobo', reply:'Pues es bonito tener un lobito que se comporte como perro, no.' },
        { label:'Octubre', reply:'Que miedo, pero mas miedo que no me tradeen...' },
        { label:'Truco', reply:'Mi truco es persuadir' },
        { label:'Trato', reply:'Si me das esmeraldas, hago tu trato de darte 1 pan, ves oferta y demanda...' },
        { label:'Kevin', reply:'Shhh... JEJE, ni idea de quien es ese tipo...' },
        { label:'Foto', reply:{ type:'image', url:'vill/vill1.jpg' } },
        { label:'Ajolote', reply:{ type:'image', url:'img/ajolote.gif' } },
        { label:'PDF', reply:{ type:'pdf', url:'pdf/SecretSand.pdf' } },
        { label:'Audio', reply:{ type:'audio', url:'music/1234.mp3' } },
        { label:'Sand', reply:{ type:'audio', url:'ald/music1.mp3' } },
        { label:'🐶', reply:'Runa!?...' },
      ],
      fallback: 'No entiendo pero, digamos que si, pero con esmeraldas se soluciona...'
    }
  },
  {   //    |     ,    |
    id:'c2',
    name:'Eduard Moss',
    alias:'███████',
    desc:'Pregunta sin remordimientos, colega.',
    avatar:'vill/villplains.jpg',
    mystery:false, gold:false, online:true, unread:0,
    kind:'keyword',
    quickReplies:['Que libros leiste','Puedo leer esos libros','123','Semillas'],
    profile:{ correo:'eduard.moss@moonveil.mv', seccion:'A-2', profesion:'Granjero', pasatiempos:['Caminar','Cultivar'], mascotas:['Gato "Polen"'], colorFav:'Verde Lima' },
    brain:{
      keywords:{
        'Que libros leiste': 'Te da curiosidad de lo que tienen esos libros, son algo del pasado.',
        'Puedo leer esos libros': 'A si que tienes curiosidad, pues te dejaria pero... Siento que todavia no estoy listo...Pero cuando quieras puedes pedirlo, solo escribe(Tasks3)',
        'Tasks3': 'Sabia que querias saberlo, pues aqui va...Pero antes me tendras que traer esto porfa: 40 Remolachas, 64 Zanahorias, 128 Patatas, 32 Panes, y donde los dejo, escribe(Place524)',
        'Place524': 'Dejamelo cerca del lugar de la torre que esta cerca del año, y habra un Shulker y lo dejas ahi colega.Y escoje cual quieres (Book1)/(Book2)/(████) solo 1 sin trampas.Y que pasa con el que esta censurado, pues es un libro que todavia no me gustaria que lo sepas.',
        'Book1': 'No te preocupes te llegara en tu buzon de tu casa principal.',
        'Book2': 'No te preocupes te llegara en tu buzon de tu casa principal.',
        'Tasks1': 'Necesito tu ayuda, me podrias traer x6 stacks de patatas. Y te compensare con x3 stacks de cobre.',
        'Tasks2': 'Me da miedo cuando estoy solo, se que estan mis compañeros. Pero me ayudarias a encontrar a mi mascota Mossesito.Te compensare con x1 stack de cobre.',
        '123': '¿Que significa colega?',
        'Semillas': 'Algo que le da vida a la agricultura, y asi tendremos mas de ellos.',
        'Hermanos': 'Disculpe que me dice...Pues no le sabria decir de ello.',
        'Hola': 'Hola colega, que tal tu dia...',
        'Bien': 'Me alegro de que tu dia este asi.',
        'Mal': 'Colega, no se sienta asi, aveces hay dias asi, pero siempre podemos afrontarlo y seguir.',
        'Brother1': 'Este libro, aunque me da pena, no te lo podia ocultar por mas tiempo, aunque no se como te enteraste.',
      },
      fallback:'No entendi lo que me pides colega. Capaz mejor comenzamos con un hola: “Hola”.'
    }
  },
  {
    id:'c3',
    name:'Sev Ark',
    alias:'████',
    desc:'Los Mitos son algo increible, como algo sin confirmar.',
    avatar:'',
    mystery:true, gold:false, online:false, unread:4,
    kind:'cliche',
    //quickReplies:['rumor','portal','mapa','eco'],
    profile:{ correo:'sev.ark@moonveil.mv', seccion:'A-2', profesion:'████', pasatiempos:['Mitos'], mascotas:['Gato "Sombra"'], colorFav:'Verde Menta' },
    brain:{
      cliches:[
        'No puedo...',
        'No hay nada que decir...',
        'Sin palabras, la verdad nada que decir...',
        'Aveces no hay nada que decir.'
      ]
    }
  },
  { //kind:'censored', bueno esto era 
    id:'c4',
    name:'Brun Tallow',
    alias:'El sin flechas',
    desc:'Me gusta el tiro con arco, pero y mis¡Flechas!',
    avatar:'img/imgmine.jpg',
    mystery:false, gold:false, online:true, unread:1,
    kind:'censored',
    quickReplies:['Flechas','Flechas','Flechas'],
    profile:{ correo:'brun.tallow@moonveil.mv', seccion:'B-1', profesion:'Flechero', pasatiempos:['Tiro con Arco'], mascotas:['Loro "Gatt"'], colorFav:'Azul Cielo' },
    brain:{
      banned:['Flechas','Flechitas','Flechas Grandes','Mini Flechas'],
      reply3:'...'
    }
  },
  {
    id:'c5',
    name:'Orik Vall',
    alias:'El mapitas',
    desc:'Me gusta hacer mapitas.',
    avatar:'vill/cartografo.jpg',
    mystery:false, gold:false, online:true, unread:0,
    kind:'keyword',
    quickReplies:['Mapa','Ocultas algo','2012','Desconocido'],
    profile:{ correo:'orik.vall@moonveil.mv', seccion:'B-2', profesion:'Cartografo', pasatiempos:['Mapeo', 'Exploracion'], mascotas:['Zorro "Brist"'], colorFav:'Amarillo Vainilla' },
    brain:{
      keywords:{
        'Mapa':'Si my friend, yo hago mapas.',
        'Ocultas algo':'Que pregunta es esa, me estas difamando my friend.',
        '2012':'Si ese caso es muy extraño la verdad, pero no te puedo confirmar porque ni yo se si es real.',
        'Desconocido':'Exacto, fue mencionado en mapas y documentales ████ durante siglos.Pero causo polemicas...',
        'Mexico':'Si ese caso es muy raro de describir, pero la verdad ni idea si fue real del año 1895.',
        '1895':'En 1997 y 2009 expediciones confirmaron que había desaparecido o nunca existió.Que opinas tu...',
        '1997':'Causo polemicas,pero bueno de ahi ya ni idea...',
        '2009':'Bueno, era problemas que afectaba limites petroleros.',
        'Japon':'Pequeña isla en el norte de Japón, desapareció literalmente del mar (se hundió o erosionó). Redescubierta en 2018, pero bajo el agua.',
        '2018':'Al final si fue confirmado.',
        '2020':'Usuarios de Google Earth reportan “aeropuertos” o “ciudades” que aparecen y desaparecen temporalmente por errores de renderizado o censura satelital.',
        '1674':'Apareció en mapas durante más de 200 años. Marinos decían haberla visto, pero nunca se confirmó. En 1970 se comprobó que no existía.',
        '1970':'Bueno al final no existio, pero quien sabe si fue o no real.',
        '1721':'Supuesta isla entre Argentina y la Antártida, reportada por el Capitán Cowley. No se volvió a encontrar jamás.',
        '2025':'Bueno no hay datos exactos, pero la cosa seria lo del 2020 hasta la actualidad porque se dice que hay fallas (pq).',
        'pq':'Como se, pues la verdad me llegan muchas fuentes de que aveces tiene fallas, pero aunque mas se da en America del Norte pues no puedo decirlo de mas.',
        'Tasks1':'Me gusta mucho los mapas, podrias darme un mapa de nivel 3 completo con todo explorado, te compensare con x4 cobre.(Place827)',
        'Place827':'Me lo dejas en donde hay un mapa grande y esta completo de la zona.',
        'Tasks2':'Por ahora no tengo mas tareas, pero la cosa es que capaz mas despues tenga mas.',
        'Hola':'Tambien hola para ti y que tuvieras un gran dia y como estas.',
        'Bien':'Me alegra, los lugares nuevos o antiguos nos llenan de alegria.',
        'Mal':'No te pongas mal, porque siempre hay lugares nuevos por ser descubiertos.'
      },
      fallback:'Que necesitas my friend'
    }
  },
  {
    id:'c6',
    name:'Nox Vire',
    alias:'████',
    desc:'Algunos, solo dicen que saben, pero realmente saben...',
    avatar:'',
    mystery:true, gold:false, online:true, unread:3,
    kind:'options',
    quickReplies:['Casos','Se puede confiar en ti','Y tu foto de perfil','████'],
    profile:{ correo:'nox.vire@moonveil.mv', seccion:'C-3', profesion:'████', pasatiempos:['Leer'], mascotas:['Burro "Ancla"'], colorFav:'Beige' },
    brain:{
      prompt:'¿Qué te interesa saber?',
      options:[
        {label:'NXIVM', reply:'Usaban el discurso de autoayuda y crecimiento espiritual para manipular y explotar a personas..'},
        {label:'Hola', reply:'Hola, supongo.'},
        {label:'Casos', reply:'Que caso te gustaria saber.Obviamente algunos ni idea.'},
        {label:'E11-25', reply:'Bueno ese caso en especifico, la cosa es que un niño, fue como investigado por un tal desconocido, pero la verdad en si como tal no estoy tan informado de ese caso, pero la verdad es que el niño esta ████.'},
        {label:'L9-25', reply:'Sobre este caso, la verdad es que nunca se pudo encontrar, su caso es de verdad un misterio que aun no lo se la verdad.'},
        {label:'D13-25', reply:'Lastimosamente, este caso en especifico la verdad, es un poco raro, pero en la realidad me hubiera gustado cambiar ese final.'},
        {label:'Z-15', reply:'Ni idea, porque tengo el presentimiento de que este caso todavia no sucedio.'},
        {label:'K', reply:'Sobre este caso, pues te soy sincero no es un caso el nombre, su nombre en realidad es ████.'},
        {label:'G', reply:'Bueno este tambien es un nombre, pero sinceramente ni idea de donde salieron, pero su nombre es ████.'},
        {label:'Se puede confiar en ti', reply:'Pues no te dire, si puedes o no, pero eso depende de ti.'},
        {label:'Y tu foto de perfil', reply:'Pues para que quieres saber, pues la verdad es que no te serviria mucho.'},
        {label:'████', reply:'Que gracioso, pues la verdad es que no sabria si es verdad o no.'},
        {label:'1', reply:'Pues sale de un 2-1 ¿no?'},
        {label:'Tasks1', reply:'Entonces querias como algun encargo, pues la verdad no tengo ninguno, pero tal vez investigar sobre el caso M14.(Claim1)'},
        {label:'Claim1', reply:'Pues primero lo dejas en el lugar donde diga mi nombre esta detras de una puerta, y lo compensare con x6 cobre'},
      ],
      fallback: '...'
    }
  },
  {
    id:'c7',
    name:'Steven Moss',
    alias:'Librillero',
    desc:'Me gusta escribir mis aventuras.',
    avatar:'vill/bibliotecario.jpg',
    mystery:false, gold:false, online:false, unread:0,
    kind:'keyword',
    quickReplies:['Rosa','Libro','1','0'],
    profile:{ correo:'steven.moss@moonveil.mv', seccion:'B-1', profesion:'Bibliotecario', pasatiempos:['Escribir','Leer'], mascotas:['Vaca "Rodolf"'], colorFav:'Rosa' },
    brain:{
      keywords:{
        'Rosa':'Novela ambientada en una abadía medieval donde los monjes mueren misteriosamente.',
        'Sabueso':'Encuentran un texto que invoca horrores antiguos.',
        'Tratos':'Bueno, sabias que habia un bibliotecario que lo que escribia era tan raro, que se involucro con algo que nadie sabe y la verdad nadie sabe que le paso.',
        'Si':'Pues la verdad hay muchos libros interesantes pero por ahora, quien sabe.',
        'No':'Pues la verdad si no quieres ahora pues mas adelante capaz te interese.',
        'Gallina':'Sabias que hay un libro que tiene ese nombre, pero con algo de muerte en el nombre...',
        'Libro':'Pues si hay muchos libros que leer, cada uno te sumerje a un mundo unico.',
        'Leer':'Pues si me gusta leer, pero casi no tanto, porque escribir es mi pasion.',
        'Hello':'Hi! How are you!',
        'Gato':'😸',
        'Tasks1':'Pues encuentra el libro con el titulo amarillo y tiene numeros raros, me da curiosidad leerlo, te compensare x3 cobre.(Place111)',
        'Place111':'Pues dejalo en donde hay un atril solito y colocalo ahi y ya...',
        'Tasks2':'No hay mas por ahora...',
        'Atril':'Pues si, donde se colocan los libros',
        '1':'Que numero fascinante...O que quieres decir'
      }, fallback:'¿Que quieres saber, alguna historia?.'
    }
  },
  {
    id:'c8',
    name:'████',
    alias:'████',
    desc:'Peces espectrales en tormentas.',
    avatar:'https://images.unsplash.com/photo-1525134479668-1bee5c7c6845?q=80&w=600&auto=format&fit=crop',
    mystery:true, gold:false, online:true, unread:0,
    kind:'echo',
    //quickReplies:['¿Dónde?', '¿Cebo?', '¿Hora?', 'Consejo'],
    profile:{ correo:'@moonveil.mv', seccion:'B-1', profesion:'████', pasatiempos:['',''], mascotas:[' ""'], colorFav:'' },
    brain:{ preface:'Capaz quieras saberlo: ' }
  },
  {
    id:'c9',
    name:'Konn Slate',
    alias:'████',
    desc:'O tal vez no.',
    avatar:'',
    mystery:true, gold:false, online:true, unread:1,
    kind:'cliche',
    quickReplies:['A','W','S','D','G','Q','P','E'],
    profile:{ correo:'konn.slate@moonveil.mv', seccion:'A-1', profesion:'████', pasatiempos:[''], mascotas:[], colorFav:'Verde Lima' },
    brain:{ cliches:['...','Ok','Z','Up','Down','Right','Left'] }
  },
  {
    id:'c10',
    name:'Kevin Dew',
    alias:'Asistente',
    desc:'Quiero ayudarte con todas tus dudas que tengas.',
    avatar:'vill/booktea.gif',
    mystery:false, gold:true, online:true, unread:0,
    kind:'options',
    quickReplies:['Ayuda','Palabra()','Estado','Reiniciar'],
    profile:{ correo:'dew@moonveil.mv', seccion:'A-1', profesion:'Asistente', pasatiempos:[''], mascotas:[], colorFav:'' },
    brain:{
      prompt:'¿En que te puedo ayudar hoy?',
      options:[
        {label:'Ayuda', reply:'Cual es tu consulta.'},
        {label:'Palabra()', reply:'Tasks, Place, Claim, Game, Book, Crafting, Animal, FAQ'},
        {label:'FAQ', reply:'Si puedes preguntar por el que quieras saber, puedes preguntar (?)'},
        {label:'?', reply:'Vale, aqui va, Eventos, Juegos, Aldeanos, Web, Historia'},
        {label:'Eventos', reply:'Vale, los eventos que estan activos, la mayoria en tu buzon te llegara su informacion a mas detalles.'},
        {label:'Juegos', reply:'Los juegos estan tambien con los eventos, pues algunos tienen su propio evento, pero tambien te llegara a mas a detalles de algunos.'},
        {label:'Aldeanos', reply:'Algunos aldeanos tienen nombre, y son claves para la historia.'},
        {label:'Web', reply:'La web si compras algo te llegara aveces a los dos dias de minecraft o solo uno.'},
        {label:'Historia', reply:'La historia todavia en el juego no esta disponible, estara disponible mas adelante cuando se anuncie.'},
        {label:'Tasks', reply:'Son algunas tareas que algunos aldeanos te piden y te compensan con algunas recompensas.'},
        {label:'Place', reply:'Es el lugar de donde debes dejar lo encomendado.'},
        {label:'Claim', reply:'Algunos no te mencionan la recompensa, pero al escribir eso, te sale su recompensa.'},
        {label:'Crafting', reply:'Algunos necesitan que craftees cosas especificas.'},
        {label:'Animal', reply:'Aveces algunos tienen animales que necesitan que los busques.'},
        {label:'Aniversario', reply:'Pues es un evento que se celebra un año mas del Mundo.'},
        {label:'Game', reply:'Algunos tienen minijuegos, te especificaran algunos.'},
        {label:'Book', reply:'Algunos tienen libros que capaz son interesantes.'},
        {label:'Game1', reply:'Este evento no tiene libro especifico, pero es algo sencillo de entender, esta en la web.'},
        {label:'93', reply:'...'},
        {label:'K', reply:'...'}
      ],
      fallback: 'Puedes escribir ?'
    }
  },
  {
    id:'c11',
    name:'Guau!',
    alias:'El mas perron',
    desc:'Soy el perron de mi cuadra... Guau...',
    avatar:'vill/photowolf.jpg',
    mystery:false, gold:true, online:true, unread:99,
    kind:'options',
    quickReplies:['Guau','Guau?'],
    profile:{
      correo:'guau@moonveil.mv', seccion:'G-UAU', profesion:'Ser perron 😎',
      pasatiempos:['Guauuuu','Guau','Guauauauau','Auuuuu!'],
      mascotas:['Guau "Auuu"'],
      colorFav:'Guau'
    },
    brain:{
      prompt:'¿Guau?',
      options:[
        { label:'Guau', reply:'Hola! Guau.' },
        { label:'Guau?', reply:'Guau?' },
        { label:'Hola', reply:'Guau! 😸' },
        { label:'Bien', reply:'Guauuuuuu...' },
        { label:'Mal', reply:'Guau... 😿' },
        { label:'Como estas', reply:'Guau...!' },
        { label:'y tu', reply:'Guauuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu...!' },
        { label:'Lobo', reply:'Guau...' },
        { label:'Perro', reply:'Guau... 😎' },
        { label:'Perron', reply:'Guau🎶' },
        { label:'Tu eres el mas', reply:'Guau....!' },
        { label:'Octubre', reply:'Auuuuu!!!' },
        { label:'31', reply:'🐺' },
        { label:'Truco', reply:'Guau?😸' },
        { label:'Trato', reply:'Guau!🙀' },
        { label:'Kevin', reply:'Guau...! 🙀' },
        { label:'German', reply:'Guau...😸' }
      ],
      fallback: 'Guau!'
    }
  },
  {
    id:'c12',
    name:'David Kal',
    alias:'El Pequeñin',
    desc:'Seremos grandes algun dia, colegita...',
    avatar:'img/babyvillager.jpg',
    mystery:false, gold:false, online:true, unread:1,
    kind:'options',
    quickReplies:['Hola','¿Estas Bien?'],
    profile:{
      correo:'da.vid@moonveil.mv', seccion:'C-3', profesion:'⌀',
      pasatiempos:['Jugar', 'Dibujar'],
      mascotas:['Lobo "Alex"'],
      colorFav:'Verde'
    },
    brain:{
      prompt:'Hola, colegita',
      options:[
        { label:'Hola', reply:'Hola, como estas...' },
        { label:'Bien', reply:'Que bien colegita' },
        { label:'Mal', reply:'No digas eso colegita, recuerda que todavia podemos seguir intentandolo hasta que salga...' },
        { label:'¿Estas Bien?', reply:'Si, colegita, ¿y tu?' },
        { label:'Daniel Morcombe', reply:'Colegita, no se quien sera, solo se que me respondio en un post del foro, nada mas...' },
        { label:'PDF', reply:'Colegita, no tengo ningun pdf, perdon...' },
        { label:'Amigo', reply:'Si colegita, eres increible tu, se mejor cada dia...' },
        { label:'audio', reply:'Colegita no tengo ninguno, pero tengo uno, nose de quien sera, pero es vergonzoso...(Song)' },
        { label:'imagen', reply:'Tampoco tengo ninguna imagen...' },
        { label:'David', reply:'Si asi me llamo, pues la verdad asi es como me conocen o me conociste...' },
        { label:'Tu eres el mas', reply:'Guau....!' },
        { label:'Octubre', reply:'Si, de que te disfrasaras, colegita...' },
        { label:'31', reply:'Pues es un dia que ya se acerca, pues no se que mas decirte...' },
        { label:'Nose', reply:'Yo tampoco, jeje' },
        { label:'Dibujo', reply:{ type:'image', url:'dav/happyg2.jpg' } },
        { label:'Bonito', reply:'Gracias, es un dibujo mas.' },
        { label:'Me gusta', reply:'Gracias, me esfuerzo mucho cada dia.' },
        { label:'Kevin', reply:'¿Quien es?...' },
        { label:'Song', reply:{ type:'audio', url:'ald/music1.mp3' } },
        { label:'Dibujar', reply:'Sabes que hay un evento de dibujos, colegita... Sabes, puedes participar la verdad.' },
        { label:'Adios', reply:'Hasta luego, porque nos veremos despues, a que si colegita...' },
        { label:'Alex', reply:{ type:'image', url:'dav/alex1.jpg' } },
        { label:'Steve', reply:{ type:'image', url:'dav/steve2.jpg' } },
        { label:'cancion', reply:{ type:'audio', url:'dav/sleep.mp3' } },
        { label:'Triste', reply:'Aveces uno no sabe que hacer, colegita no te rindas asi de facil, tu eres alguien increible, no lo olvides...(Song1)' },
        { label:'Song1', reply:'Colegita, sabia que querias saber aqui esta (cancion)/(duracion), aunque colegita capaz cancion no te carge, pesa mucho pero puedes escribir (songlink)' },
        { label:'Duracion', reply:'Pues la cancion dura casi como 3 horas colegita, no es necesario escucharla toda...' },
        { label:'Donde estas', reply:'Colegita, estare ahi siempre que lo necesites, pero ahora... ni idea jeje' },
        { label:'Quien', reply:'Gabriel?...' },
        { label:'songlink', reply:'https://youtu.be/2AH5t_o7lmg?si=mApag20_haaBbZFI' },
        { label:'jaja', reply:'Que chistoso verdad' },
        { label:'Feliz', reply:'Pues estamos feliz, verdad... :D' },
      ],
      fallback: 'Colegita, no te entendi, pero trato...'
    }
  },
  {
    id:'c13',
    name:'Creaking',
    alias:'Lo oscuridad del bosque',
    desc:'Evento...',
    avatar:'img-pass/crepitante.jpg',
    mystery:false, gold:false, online:true, unread:0,
    kind:'options',
    quickReplies:['Event'],
    profile:{
      correo:'event@moonveil.mv', seccion:'', profesion:'',
      pasatiempos:[''],
      mascotas:[''],
      colorFav:''
    },
    brain:{
      prompt:'Creaking...',
      options:[
        { label:'Event', reply:'El evento inicia el dia 25 de Octubre hasta el dia 2 de Noviembre' },
        { label:'Hola', reply:'No hay tiempo para eso...' },
        { label:'1', reply:'La parte 1 comienza desde el dia 25' },
        { label:'2', reply:'La parte 2 comienza el dia 31' },
        { label:'3', reply:'No hay parte 3...' },
        { label:'Como estas', reply:'Algo tiene que ver con el evento?' },
        { label:'creacion', reply:'Pues como tal no' },
        { label:'Dibujo', reply:{ type:'image', url:'img-pass/crepitante.jpg' } },
      ],
      fallback: 'Guau!'
    }
  },
];

/* =========================================================
   Estado
   ========================================================= */
let currentId = null;
let typingId = null;
let muted = new Set();
let pinned = new Set();

/* =========================================================
   Selectores
   ========================================================= */
const contactList = $('#contactList');
const searchContacts = $('#searchContacts');
const thread = $('#thread');
const quickBar = $('#quickBar');

const peerAvatar = $('#peerAvatar');
const peerName = $('#peerName');
const peerStatus = $('#peerStatus');

const composer = $('#composer');
//const msgInput = $('#msgInput');

const btnInfo = $('#btnInfo');
const btnPin = $('#btnPin');
const btnMute = $('#btnMute');

const contactModal = $('#contactModal');
const modalOverlay = $('#modalOverlay');
const modalClose = $('#modalClose');
const modalTitle = $('#modalTitle');
const modalBody = $('#modalBody');
const modalAction = $('#modalAction');

const toastEl = $('#toast');

/* =========================================================
   Render lista de contactos
   ========================================================= */
function renderContacts(list = contacts){
  const q = (searchContacts.value||'').toLowerCase().trim();
  const items = list
    .filter(c => !q || [c.name,c.alias,c.desc].join(' ').toLowerCase().includes(q))
    .sort((a,b)=>{
      // Orden: anclados arriba, luego online, luego por unread, luego alfabético
      const pa = +pinned.has(a.id), pb = +pinned.has(b.id);
      if (pa!==pb) return pb-pa;
      if (a.online!==b.online) return (a.online? -1 : 1);
      if (a.unread!==b.unread) return b.unread-a.unread;
      return a.name.localeCompare(b.name);
    })
    .map(c => contactItem(c))
    .join('');

  contactList.innerHTML = items || `<li class="muted" style="padding:10px">Sin resultados</li>`;

  // Bind
  $$('.contact', contactList).forEach(li=>{
    li.addEventListener('click', ()=>{
      selectContact(li.dataset.id);
    });
  });
}
function contactItem(c){
  const avatar = c.mystery
    ? `<div class="avatar mystery">?</div>`
    : `<div class="avatar"><img alt="Foto de ${escape(c.name)}" src="${escape(c.avatar)}"></div>`;
  const gold = c.gold ? `<span class="badge gold" title="Destacado">GOLD</span>` : '';
  const dot = `<span class="dot ${c.online? '' : 'off'}" title="${c.online?'En línea':'Desconectado'}"></span>`;
  const unread = c.unread? `<span class="unread" aria-label="${c.unread} mensajes no leídos">${c.unread}</span>` : '';

  return `
<li class="contact ${c.gold?'gold':''} ${currentId===c.id?'active':''}" data-id="${c.id}" role="option" aria-selected="${currentId===c.id}">
  ${avatar}
  <div class="c-meta">
    <div class="name">${escape(c.name)} ${gold}</div>
    <div class="desc">${escape(c.desc)}</div>
  </div>
  <div class="c-extra">
    ${dot}
    ${unread}
  </div>
</li>`;
}

/* =========================================================
   Selección de contacto
   ========================================================= */
function selectContact(id){
  if (currentId === id) return;

  const c = contacts.find(x=> x.id===id);
  if (!c) return;

  // set current
  currentId = id;
  renderContacts();

  // header peer
  peerName.textContent = c.name;
  peerStatus.textContent = c.online ? 'En línea' : 'Desconectado';
  peerAvatar.innerHTML = c.mystery
    ? `<div class="avatar mystery">?</div>`
    : `<div class="avatar"><img alt="Foto de ${escape(c.name)}" src="${escape(c.avatar)}"></div>`;

  // clear thread + quick replies
  thread.innerHTML = '';
  quickBar.innerHTML = '';
  quickBar.classList.add('hidden');

  // reset unread
  c.unread = 0; renderContacts();

  // saludo inicial según tipo
  greetContact(c);

  // scroll
  threadScrollToEnd();
}

/* =========================================================
   Saludo inicial por tipo
   ========================================================= */
function greetContact(c){
  const hello = {
    'options': c.brain.prompt || '¿Qué opción eliges?',
    'keyword': 'Escoge de lo que necesitas saber.',
    'cliche': 'Tengo frases, ¿lo sabías?',
    'censored': 'Puedes hablar...',
    'echo': 'Dime algo de lo que necesites saber.'
  }[c.kind];

  if (hello) pushPeer(c, hello);

  // quick replies
  if (c.quickReplies?.length){
    quickBar.innerHTML = c.quickReplies.map(q => `<button class="qr" data-qr="${escape(q)}">${escape(q)}</button>`).join('');
    quickBar.classList.remove('hidden');
    $$('.qr', quickBar).forEach(b=>{
      b.addEventListener('click', ()=> {
        sendMessage(b.dataset.qr);
      });
    });
  }
}

/* =========================================================
   Eventos de búsqueda y composer
   ========================================================= */
searchContacts.addEventListener('input', ()=> renderContacts());

composer.addEventListener('submit', (e)=>{
  e.preventDefault();
  if (!currentId) return toast('Selecciona un contacto');
  const txt = (msgInput.value||'').trim();
  if (!txt) return;
  sendMessage(txt);
  msgInput.value = '';
});


//emojis

// === PANEL DE EMOJIS PROFESIONAL ===
const emojiPanel = document.getElementById('emojiPanel');
const emojiContent = document.getElementById('emojiContent');
const btnEmoji = document.getElementById('btnEmoji');
const msgInput = document.getElementById('msgInput');

const emojis = {
  smileys: ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','😉','😍','😘','😜','🤔','😎','😢','😭','😡','😱','💀'],
  animals: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵'],
  food: ['🍏','🍎','🍊','🍋','🍌','🍉','🍇','🍓','🍒','🍍','🥭','🍕','🍔','🍟','🌭','🍣','🍪'],
  activity: ['⚽️','🏀','🏈','⚾️','🎾','🏐','🎱','🏓','🎮','🎲','🎤','🎧','🎬'],
  hearts: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💖','💘','💝']
};

// Cargar emojis por categoría
function loadEmojis(category) {
  emojiContent.innerHTML = emojis[category]
    .map(e => `<span>${e}</span>`)
    .join('');
  document.querySelectorAll('.emoji-header button').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-category="${category}"]`).classList.add('active');
}

// Mostrar/ocultar panel
btnEmoji?.addEventListener('click', () => {
  emojiPanel.classList.toggle('hidden');
  if (!emojiPanel.classList.contains('hidden')) loadEmojis('smileys');
});

// Insertar emoji seleccionado
emojiContent?.addEventListener('click', e => {
  if (e.target.tagName === 'SPAN') {
    msgInput.value += e.target.textContent;
    msgInput.focus();
  }
});

// Cambiar categoría
document.querySelectorAll('.emoji-header button').forEach(btn => {
  btn.addEventListener('click', () => loadEmojis(btn.dataset.category));
});

// Cerrar al hacer clic fuera
document.addEventListener('click', e => {
  if (!emojiPanel.contains(e.target) && e.target !== btnEmoji) {
    emojiPanel.classList.add('hidden');
  }
});



$('#btnAttach')?.addEventListener('click', ()=> toast('Adjuntar - No se implementara 😸'));

/* =========================================================
   Envío + respuesta
   ========================================================= */
function sendMessage(text){
  const me = { avatar: 'img/imper.jpg' };
  pushMe(me, text);

  const c = contacts.find(x=> x.id===currentId);
  if (!c) return;

  // mostrar typing
  showTyping();

  setTimeout(()=> {
    hideTyping();
    const reply = computeReply(c, text);
    pushPeer(c, reply);
    threadScrollToEnd();
  }, 800 + Math.random()*800);
}

/* =========================================================
   Tipos de “cerebro”

   ASI ERA EL DE CENSORED
   case 'censored':{
      const banned = c.brain.banned || [];
      let out = text;
      banned.forEach(w=>{
        const re = new RegExp(w, 'ig');
        out = out.replace(re, '█████');
      });
      return `${c.brain.reply}\n> ${escape(out)}`;
    }
   ========================================================= */
function computeReply(c, text) {
  const t = text.toLowerCase();

  switch(c.kind){
  case 'options':{
    const opt = c.brain.options.find(o => o.label.toLowerCase() === t);

    // 👇 Si no hay coincidencia, usa fallback o lista de opciones
    if (!opt)
      return c.brain.fallback || 
             `Opciones: ${c.brain.options.map(o => o.label).join(' · ')}`;

    // 🔹 Si el reply es texto, devuélvelo normal
    if (typeof opt.reply === 'string') return opt.reply;

    // 🔹 Si el reply es un objeto (imagen/pdf/audio)
    if (typeof opt.reply === 'object' && opt.reply.type) {
      return opt.reply;
    }

    return 'No entendí eso.';
  }


    case 'keyword': {
      const table = c.brain.keywords || {};
      for (const pattern in table) {
        const re = new RegExp(`\\b(${pattern})\\b`, 'i');
        if (re.test(t)) return table[pattern];
      }
      return c.brain.fallback || 'No comprendí. Intenta otra vez.';
    }

    case 'cliche': {
      const arr = c.brain.cliches || ['No confirmo ni niego.'];
      return arr[Math.floor(Math.random() * arr.length)];
    }

    case 'censored': {
      const banned = c.brain.banned || [];
      let out = text;
      banned.forEach(w => {
        const re = new RegExp(w, 'ig');
        out = out.replace(re, '');
      });
      return `${c.brain.reply}\n ${escape(out)}`;
    }

    case 'echo': {
      const tip = [
        'Seguro que esto está correcto ████...',
        'A veces la información de ███ puede estar equivocada.',
        'Seguro que el caso ████ es real.',
        'El secreto es de █████.',
        'Y quien sabe el secreto, nada más que █████.',
        'Te resumo el secreto es sobre █████ que está █████ de █████.',
        'Qué pasó con el caso █████.',
        'El código E11-25 lo ha escrito █████.',
        'El código A16-25 se lo llevó █████.',
        'El del foro quién será █████.',
        'Siento que te ocultan algo frente a tu cara █████.',
        'Esto va para el jugador, █████ te esconde un secreto.',
        'A mí como tal no me encontró, pero tu jugador siempre █████ estuvo ahí...',
        'Porque █████ está aquí también.',
        'Aquí son las █████, pero quién sabe si esto es real.',
        'El escondite debajo de la █████... averígualo, por mí.',
        'El profe █████ asesinó a █████, se suponía que era un informante.',
        'Estuvo siempre cerca █████, y como fuimos ciegos...',
        'Por favor, tengo miedo de █████...',
        'Él no puede saber que estás leyendo esto, él me █████.'
      ];
      return `${c.brain.preface || ''}"${text}" — ${
        tip[Math.floor(Math.random() * tip.length)]
      }`;
    }

    default:
      return 'Estoy pensando…';
  }
}


/* =========================================================
   Push de mensajes
   ========================================================= */
/*function pushPeer(c, text){
  const node = document.createElement('div');
  node.className = 'msg peer';
  node.innerHTML = `
    <div class="avatar ${c.mystery?'mystery':''}">
      ${c.mystery? '?' : `<img alt="Foto de ${escape(c.name)}" src="${escape(c.avatar)}">`}
    </div>
    <div class="bubble">
      <div class="text">${formatText(text)}</div>
      <div class="meta">${timeNow()}</div>
    </div>
  `;
  thread.appendChild(node);
  threadScrollToEnd();
}*/


function pushPeer(c, content){
  const node = document.createElement('div');
  node.className = 'msg peer';
  let bubbleHTML = '';

  if (typeof content === 'string') {
    // Si es texto normal
    bubbleHTML = `<div class="text">${formatText(content)}</div>`;
  } else if (content.type === 'image') {
    bubbleHTML = `<div class="text"><img src="${content.url}" alt="imagen" class="chat-image"></div>`;
  } else if (content.type === 'pdf') {
    bubbleHTML = `<div class="text"><a href="${content.url}" target="_blank" class="chat-file">📄 Ver PDF</a></div>`;
  } else if (content.type === 'audio') {
    bubbleHTML = `<div class="text"><audio controls src="${content.url}" class="chat-audio"></audio></div>`;
  }

  node.innerHTML = `
    <div class="avatar ${c.mystery?'mystery':''}">
      ${c.mystery ? '?' : `<img alt="Foto de ${escape(c.name)}" src="${escape(c.avatar)}">`}
    </div>
    <div class="bubble">
      ${bubbleHTML}
      <div class="meta">${timeNow()}</div>
    </div>
  `;
  thread.appendChild(node);
  threadScrollToEnd();
}


function pushMe(me, text){
  const node = document.createElement('div');
  node.className = 'msg me';
  node.innerHTML = `
    <div class="avatar"><img alt="" src="${escape(me.avatar)}"></div>
    <div class="bubble">
      <div class="text">${formatText(text)}</div>
      <div class="meta">${timeNow()}</div>
    </div>
  `;
  thread.appendChild(node);
  threadScrollToEnd();
}

/* typing indicator */
function showTyping(){
  if (typingId) return;
  const n = document.createElement('div');
  n.className = 'typing';
  n.innerHTML = `
    <span class="dots">
      <span class="dot"></span><span class="dot"></span><span class="dot"></span>
    </span>
    <small class="muted">escribiendo…</small>
  `;
  thread.appendChild(n);
  typingId = n;
  threadScrollToEnd();
}
function hideTyping(){
  if (!typingId) return;
  typingId.remove(); typingId = null;
}

/* =========================================================
   Header actions: info, pin, mute
   ========================================================= */
btnInfo.addEventListener('click', ()=>{
  if (!currentId) return toast('Selecciona un contacto');
  const c = contacts.find(x=> x.id===currentId);
  openContactInfo(c);
});

btnPin.addEventListener('click', ()=>{
  if (!currentId) return toast('Selecciona un contacto');
  if (pinned.has(currentId)){ pinned.delete(currentId); toast('Desanclado'); }
  else { pinned.add(currentId); toast('Anclado'); }
  renderContacts();
});

btnMute.addEventListener('click', ()=>{
  if (!currentId) return toast('Selecciona un contacto');
  if (muted.has(currentId)){ muted.delete(currentId); toast('Sonido activado'); }
  else { muted.add(currentId); toast('Silenciado'); }
});

/* =========================================================
   Modal de información del contacto
   ========================================================= */
function openContactInfo(c){
  if (!c) return;
  modalTitle.textContent = c.name;
  modalBody.innerHTML = `
    <div class="modal-grid">
      <div class="modal-block">
        <h4>Perfil</h4>
        <p><strong>Alias:</strong> ${escape(c.alias)}</p>
        <p><strong>Sección:</strong> ${escape(c.profile.seccion||'—')}</p>
        <p><strong>Profesión:</strong> ${escape(c.profile.profesion||'—')}</p>
        <p><strong>Correo:</strong> ${escape(c.profile.correo||'—')}</p>
      </div>
      <div class="modal-block">
        <h4>Preferencias</h4>
        <p><strong>Color favorito:</strong> ${escape(c.profile.colorFav||'—')}</p>
        <p><strong>Pasatiempos:</strong> ${(c.profile.pasatiempos||[]).map(escape).join(', ')||'—'}</p>
        <p><strong>Mascotas:</strong> ${(c.profile.mascotas||[]).map(escape).join(', ')||'—'}</p>
      </div>
      <div class="modal-block full">
        <h4>Notas</h4>
        <p>${escape(c.desc)}</p>
      </div>
    </div>
  `;
  contactModal.classList.add('show');
  contactModal.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
  modalAction.onclick = closeModal;
}

function closeModal(){
  contactModal.classList.remove('show');
  contactModal.setAttribute('aria-hidden','true');
  document.body.style.overflow='';
}

modalOverlay.addEventListener('click', closeModal);
modalClose.addEventListener('click', closeModal);
document.addEventListener('keydown', e=>{ if (e.key==='Escape') closeModal(); });

/* =========================================================
   Utilidades
   ========================================================= */
function formatText(s){
  // convierte URLs simples a enlaces y saltos de línea
  const esc = escape(String(s)).replace(/\n/g,'<br>');
  return esc.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
}
function timeNow(){
  const d = new Date();
  return new Intl.DateTimeFormat('es-PE', {hour:'2-digit', minute:'2-digit'}).format(d);
}
function escape(s){return String(s).replace(/[&<>"']/g, m=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function toast(msg){
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastEl._id);
  toastEl._id = setTimeout(()=> toastEl.classList.remove('show'), 1400);
}
function threadScrollToEnd(){ thread.scrollTop = thread.scrollHeight; }

/* =========================================================
   Inicialización
   ========================================================= */
document.addEventListener('DOMContentLoaded', ()=>{
  // año no requerido aquí, solo render de lista
  renderContacts();
  // seleccionar por defecto el primero destacado o el primero
  const first = contacts.find(c=> c.gold) || contacts[0];
  if (first) selectContact(first.id);
});

/* =========================================================
   Simulación de notificaciones (no intrusivo)
   ========================================================= */
setInterval(()=>{
  // elige un contacto offline o no actual
  const pool = contacts.filter(c=> c.id!==currentId);
  if (!pool.length) return;
  const i = Math.floor(Math.random()*pool.length);
  const c = pool[i];
  if (muted.has(c.id)) return; // si está silenciado, no notificamos
  c.unread = Math.min(9, (c.unread||0) + 1);
  renderContacts();
}, 12000 + Math.random()*8000);
