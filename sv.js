/* Moonveil Portal - El Caso del Corazón Roto v4.0 - Sistema Mejorado */

const $ = (q, ctx = document) => ctx.querySelector(q);
const $$ = (q, ctx = document) => Array.from(ctx.querySelectorAll(q));

const gameState = {
  initialized: false,
  startDate: Date.now(),
  day: 1,
  maxDays: 45,
  currentView: null,
  currentId: null,
  chats: {},
  suspectProgress: {},
  inventory: [],
  keys: [], // Nuevo: Sistema de llaves
  clues: [],
  rewards: { copper: 0, emeralds: 0 },
  notebook: [],
  unlockedLocations: ['plaza'],
  locationProgress: {},
  evidenceShown: {},
  progress: 0,
  caseSolved: false,
  // Sistema de culpables múltiples
  possibleCulprits: ['orik', 'luna', 'steven'], // 3 posibles culpables
  actualCulprit: null, // Se determina al inicio
  accusedOnce: false
};

// SOSPECHOSOS EXPANDIDOS CON MÁS PROFUNDIDAD
const suspects = [
  {
    id: 'sand',
    name: 'Sand Brill',
    role: 'Comerciante',
    avatar: 'vill/vill1.jpg',
    status: 'victim',
    unlocked: true,
    profile: {
      correo: 'sand.brill@moonveil.mv',
      seccion: 'A-1',
      profesion: 'Comerciante',
      edad: 28,
      sospecha: 'Víctima principal - recibió la primera carta',
      notas: 'Devastado emocionalmente. Amaba a alguien en secreto.'
    },
    evidenceReactions: {
      boligrafo: 'No es mío. Lo he visto en la biblioteca, Steven lo usa.',
      cuaderno_orik: '¡Esto es de Orik! Su letra es inconfundible. ¿Por qué escribiría cosas tan oscuras?',
      papel_fino: 'Este papel... es como el de mi carta. ¿De dónde lo sacaste?',
      diario_luna: '*Se pone pálido* Luna... ella sabía mis secretos. ¿Por qué tendría esto?',
      carta_amor: '*Llora* Esta es la carta que nunca envié... ¿cómo la conseguiste?'
    },
    dialogs: {
      initial: {
        text: 'Detective... La carta era tan cruel. Revelaba mi secreto más profundo.',
        options: [
          { id: 'ver_carta', label: 'Déjame ver la carta' },
          { id: 'amor', label: '¿Problemas amorosos?' },
          { id: 'sumas', label: 'Eh! ¿Sabes cuanto es 1+1?' }
        ]
      },
      ver_carta: {
        text: 'Léela tú mismo... Habla de amor no correspondido. Quien escribió esto sabía exactamente qué decir para herirme.',
        rewards: { item: 'carta_sand', copper: 1 },
        clue: 'Sand recibió carta sobre amor no correspondido',
        options: [{ id: 'quien_sabia', label: '¿Quién sabría esto?' }]
      },
      quien_sabia: {
        text: 'Solo se lo conté a Eduard una noche en la taberna. Pero Orik estaba cerca... y Luna también. Ella siempre escucha todo.',
        clue: 'Sand habló secretos cerca de Orik y Luna',
        unlocks: { location: 'tavern', suspect: 'eduard', suspect2: 'luna' },
        options: [
          { id: 'orik_sospechoso', label: '¿Orik es sospechoso?' },
          { id: 'luna_info', label: '¿Luna escuchaba?' }
        ]
      },
      orik_sospechoso: {
        text: 'Orik cambió hace seis meses. Está... diferente. Más cerrado, más oscuro.',
        clue: 'Orik cambió de comportamiento hace 6 meses',
        unlocks: { suspect: 'orik' },
        options: []
      },
      luna_info: {
        text: 'Luna es florista pero también... observa mucho. Siempre está en el lugar correcto para escuchar secretos.',
        clue: 'Luna tiene hábito de escuchar conversaciones',
        options: []
      },
      amor: {
        text: 'Me gustaba alguien que se fue hace meses. Nunca tuve el valor de decírselo.',
        clue: 'La persona que le gustaba a Sand ya no está en Moonveil',
        options: [{ id: 'quien_sabia', label: '¿Quién lo sabía?' }]
      },
      sumas: {
        text: 'Si es 2',
        clue: 'Creo que si...',
        options: [{ id: 'quien_sabia', label: '¿Quién lo sabía?' },
        { id: 'restas', label: 'No tengo ideas...' }]
      },
      restas: {
        text: 'Orik cambió hace seis meses. Está... diferente. Más cerrado, más oscuro.',
        clue: 'Orik cambió de comportamiento hace 6 meses',
        unlocks: { suspect: 'kevin' },
        options: [{ id: 'quien_sabia', label: '¿Quién lo sabía?' },{ id: 'amor', label: 'Eh!' }]
      },      
    }
  },
  {
    id: 'eduard',
    name: 'Eduard Moss',
    role: 'Granjero',
    avatar: 'vill/villplains.jpg',
    status: 'helpful',
    unlocked: false,
    profile: {
      correo: 'eduard.moss@moonveil.mv',
      seccion: 'A-2',
      profesion: 'Granjero',
      edad: 35,
      sospecha: 'Testigo clave - ha visto cosas',
      notas: 'Hermano de Steven. Observador y honesto.'
    },
    evidenceReactions: {
      boligrafo: 'De la biblioteca, colega. Mi hermano Steven lo usa.',
      cuaderno_orik: '¡Personal! Muy oscuro... no sabía que estaba así, me gustaria saberlo mas pero esperamos saberlo.',
      papel_fino: 'Del almacén de biblioteca. Solo Steven tiene acceso... y quien tenga la llave.',
      diario_luna: 'Luna escribe mucho. A veces la veo en el bosque escribiendo.',
      llave_biblioteca: '¡Esa llave! La vi caer del bolsillo de alguien. No sé de quién.'
    },
    dialogs: {
      initial: {
        text: 'He visto cosas extrañas, colega. Movimientos nocturnos, gente donde no debería estar.',
        options: [
          { id: 'que_viste', label: '¿Qué viste exactamente?' },
          { id: 'orik', label: '¿Viste a ████?' }
        ]
      },
      que_viste: {
        text: 'Vi a ████ de noche con mochila. Papel fino cerca de la biblioteca. Pero también vi a Luna... caminando sola, tarde.',
        clue: 'Orik y Luna vistos en horarios sospechosos',
        rewards: { copper: 2 },
        unlocks: { location: 'forest', location2: 'gardens' },
        options: [
          { id: 'bosque', label: '¿Dónde exactamente?' },
          { id: 'luna_noche', label: '¿Luna de noche?' }
        ]
      },
      bosque: {
        text: 'En el bosque oscuro. Senderos que nadie usa. Orik parecía estar buscando algo o... escondiendo algo.',
        clue: '████ frecuenta bosque oscuro con propósito específico',
        options: []
      },
      luna_noche: {
        text: 'Luna iba hacia los jardines. Tarde, muy tarde. Llevaba algo en las manos.',
        clue: 'Luna vista con algo en manos dirigiéndose a jardines',
        options: []
      },
      orik: {
        text: '████ está diferente. Escribe en su cuaderno siempre. A veces murmura cosas... sobre injusticia y venganza.',
        clue: 'Orik escribe en cuaderno y habla de venganza',
        options: []
      }
    }
  },
  {
    id: 'orik',
    name: 'Orik Vall',
    role: 'Cartógrafo',
    avatar: 'vill/cartografo.jpg',
    status: 'suspicious',
    unlocked: false,
    profile: {
      correo: 'orik.vall@moonveil.mv',
      seccion: 'B-2',
      profesion: 'Cartógrafo',
      edad: 30,
      sospecha: '¡POSIBLE CULPABLE!',
      motivo: 'Le gusta su trabajo y siempre fue asi de romantico o solo era mentira...',
      notas: 'Acceso a mapas, conoce rutas secretas.'
    },
    evidenceReactions: {
      boligrafo: 'Es... común. Muchos lo usan. *Evita contacto visual*',
      cuaderno_orik: '*Se pone pálido y se levanta* ¿D-dónde encontraste eso? ¡Es MUY privado! *Manos temblorosas*',
      papel_fino: 'Yo... trabajo con papel. Para mapas. Es normal. *Voz temblorosa*',
      testimonio_david: '¡Ese niño está mintiendo! No sabe nada.',
      llave_archivo: '¿Cómo... cómo conseguiste eso?',
      diario_luna: '*Confundido* ¿Luna escribió sobre mí? No... no puede ser.'
    },
    dialogs: {
      initial: {
        text: 'Detective, my friend. ¿Investigando las cartas? Es terrible lo que le pasó a Sand.',
        options: [
          { id: 'mapear', label: '¿Mapeas de noche?' },
          { id: 'cartas', label: '¿Sabes de las cartas?' }
        ]
      },
      mapear: {
        text: 'Sí, a veces. La luna ayuda con las sombras. ¿Por qué preguntas?',
        options: [{ id: 'mochila', label: 'Te vieron con mochila' }]
      },
      mochila: {
        text: 'Llevo herramientas de cartografía. Nada extraño, my friend. *Evita mirada*',
        clue: 'Orik nervioso al preguntarle sobre mochila nocturna',
        options: [{ id: 'papel', label: '¿Qué tipo de papel usas?' }]
      },
      papel: {
        text: 'Papel común, my friend. Para mapas. Steven me da acceso... tengo llave del almacén.',
        clue: 'Orik tiene llave del almacén de biblioteca',
        rewards: { emerald: 1 },
        options: []
      },
      cartas: {
        text: 'Paso mucho tiempo fuera. La gente habla en voz alta y luego se sorprende cuando sus secretos salen a la luz.',
        clue: 'Orik admite escuchar secretos de otros',
        options: [{ id: 'secretos', label: '¿Conoces esos secretos?' }]
      },
      secretos: {
        text: 'Uno escucha en tabernas, en plazas. La gente es descuidada. No es mi culpa si no guardan sus secretos.',
        clue: 'Orik justifica conocer secretos ajenos',
        options: [{ id: 'amor', label: '¿Tú tienes secretos de amor?' }]
      },
      amor: {
        text: 'Bueno eso es un tema que capaz ahora, no creo que sea recomendable tratar.',
        clue: 'Orik tiene reacción extrema a pregunta sobre amor',
        rewards: { copper: 2 },
        options: []
      }
    }
  },
  {
    id: 'steven',
    name: 'Steven Moss',
    role: 'Bibliotecario',
    avatar: 'vill/bibliotecario.jpg',
    status: 'suspicious',
    unlocked: false,
    profile: {
      correo: 'steven.moss@moonveil.mv',
      seccion: 'B-1',
      profesion: 'Bibliotecario',
      edad: 32,
      sospecha: '¡POSIBLE CULPABLE!',
      motivo: 'Acceso total a materiales, conoce secretos de libros prestados, ¿y un romantico celoso?',
      notas: 'Hermano de Eduard. Acceso exclusivo a archivo secreto.'
    },
    evidenceReactions: {
      boligrafo: 'Sí, es mío. Lo uso para catalogar. ¿Lo encontraste en algún lugar... comprometedor?',
      papel_fino: '*Suspira* Mi papel pergamino. Falta bastante... alguien lo tomó sin permiso.',
      cuaderno_orik: 'Orik viene seguido. Lee libros sobre... temas oscuros. Nunca imaginé que...',
      diario_luna: '*Lee con atención* Luna escribe hermoso pero... hay amargura aquí.',
      llave_archivo: '*Sorprendido* ¿Cómo conseguiste esto? Solo yo tengo esta llave. Bueno... yo y quien la copió.'
    },
    dialogs: {
      initial: {
        text: '*Susurra* El papel de las cartas viene de aquí. Estoy seguro. He revisado los registros.',
        options: [
          { id: 'papel_falta', label: '¿Falta papel?' },
          { id: 'quien_acceso', label: '¿Quién tiene acceso?' }
        ]
      },
      papel_falta: {
        text: 'Sí... falta suficiente para varias cartas. Y tinta también. Tinta especial, de las que uso para documentos importantes.',
        clue: 'Papel fino y tinta especial desaparecidos',
        rewards: { copper: 1 },
        options: [{ id: 'quien_acceso', label: '¿Quién pudo tomarlo?' }]
      },
      quien_acceso: {
        text: 'Técnicamente, solo yo. Pero... di llaves a Orik hace meses. Y Luna limpia aquí a veces, podría haber... No, no quiero acusar sin pruebas.',
        clue: 'Orik tiene llave, Luna tiene acceso de limpieza',
        rewards: { emerald: 1 },
        unlocks: { suspect: 'orik', suspect2: 'luna', location: 'library' },
        options: [{ id: 'orik_llave', label: '¿Por qué le diste llave a Orik?' }]
      },
      orik_llave: {
        text: '*Incómodo* Orik necesitaba acceso a mapas antiguos para su trabajo. Parecía confiable entonces. Ahora... no estoy seguro.',
        clue: 'Steven le dio llave a Orik para mapas antiguos',
        options: []
      }
    }
  },
  {
    id: 'david',
    name: 'David Kal',
    role: 'El Niño',
    avatar: 'img/babyvillager.jpg',
    status: 'helpful',
    unlocked: true,
    profile: {
      correo: 'da.vid@moonveil.mv',
      seccion: 'C-3',
      profesion: '⌀',
      edad: 10,
      sospecha: 'Testigo inocente clave',
      notas: 'Vio entregas nocturnas. Inocente y honesto.'
    },
    evidenceReactions: {
      cuaderno_orik: '¡Ese cuaderno! Lo vi escribiendo en él de noche en el bosque, colegita.',
      mapa_roto: 'Esos mapas son del señor Orik. Los usa para caminar rutas raras.',
      diario_luna: 'La señora Luna escribe mucho. La vi en el jardín escribiendo y llorando.'
    },
    dialogs: {
      initial: {
        text: '¡Hola colegita! ¿Eres detective de verdad? ¡Vi cosas importantes!',
        options: [{ id: 'que_viste', label: '¿Qué viste?' }]
      },
      que_viste: {
        text: '¡Vi a un señor alto con mapa dejando algo en la puerta de Sand! Y otra vez vi a alguien más... con flores.',
        clue: 'Dos personas diferentes vistas dejando cosas en puertas',
        rewards: { item: 'testimonio_david', copper: 2 },
        options: [
          { id: 'descripcion', label: '¿Cómo era el señor alto?' },
          { id: 'flores', label: '¿Quién tenía flores?' }
        ]
      },
      descripcion: {
        text: 'Alto, con mochila grande. Caminaba rápido mirando un papel. ¡Casi me ve! Me escondí.',
        clue: 'Sospechoso alto con mochila y papel/mapa',
        rewards: { emerald: 1 },
        options: []
      },
      flores: {
        text: 'Era más bajito. O bajita, no sé. Llevaba flores y un papel. Iba despacito, como triste.',
        clue: 'Segunda persona con flores entregando cartas',
        unlocks: { suspect: 'luna' },
        options: []
      }
    }
  },
  {
    id: 'kevin',
    name: 'Kevin Dew',
    role: 'Asistente Municipal',
    avatar: 'vill/booktea.gif',
    status: 'helpful',
    unlocked: false,
    profile: {
      correo: 'dew@moonveil.mv',
      seccion: 'A-1',
      profesion: 'Asistente Municipal',
      edad: 27,
      sospecha: 'Tiene registros oficiales importantes',
      notas: 'Acceso a todos los documentos municipales.'
    },
    evidenceReactions: {
      cuaderno_orik: 'Esto confirma las sospechas. Orik está obsesionado con la venganza.',
      registros_orik: 'Yo te di estos. Son la prueba de sus movimientos.',
      diario_luna: 'Luna también tiene un pasado oscuro. Mira estos registros...',
      expediente_steven: 'Steven tiene acceso a todo. Incluso él podría...'
    },
    dialogs: {
      initial: {
        text: 'He revisado todos los registros. Hay patrones interesantes en compras y movimientos.',
        clue: 'Registros muestran patrones sospechosos',
        rewards: { item: 'registros_municipales' },
        unlocks: { location: 'town_hall' },
        options: [{ id: 'patrones', label: '¿Qué patrones?' }]
      },
      patrones: {
        text: '████ compró material de escritura. Steven pidió tinta especial. Y Luna... Luna tiene salidas nocturnas registradas.',
        clue: 'Tres personas con comportamiento sospechoso',
        rewards: { copper: 2 },
        options: [
          { id: 'motivo_orik', label: '¿Orik tiene motivo?' },
          { id: 'motivo_steven', label: '¿Steven tiene motivo?' },
          { id: 'motivo_luna', label: '¿Luna tiene motivo?' }
        ]
      },
      motivo_orik: {
        text: 'Hace 6 meses, Orik fue rechazado. Solicitó permiso para cortejar y fue... negado. Cambió desde entonces.',
        clue: 'Orik rechazado hace 6 meses oficialmente',
        rewards: { emerald: 1 },
        options: []
      },
      motivo_steven: {
        text: 'Steven... es complejo. Tiene acceso a todo. Y hubo un incidente hace años que está sellado. No puedo decir más.',
        clue: 'Steven tiene expediente sellado',
        options: []
      },
      motivo_luna: {
        text: '*Baja la voz* Luna perdió a alguien hace años. Nunca se recuperó. Hay... resentimiento profundo.',
        clue: 'Luna tiene pérdida personal y resentimiento',
        unlocks: { suspect: 'luna' },
        options: []
      }
    }
  },
  {
    id: 'luna',
    name: 'Luna Stern',
    role: 'Florista',
    avatar: 'vill/pig.jpg',
    status: 'suspicious',
    unlocked: false,
    profile: {
      correo: 'luna@moonveil.mv',
      seccion: 'C-1',
      profesion: 'Florista',
      edad: 29,
      sospecha: '¡POSIBLE CULPABLE!',
      motivo: 'Pérdida personal, acceso a jardines, vista con flores entregando cosas',
      notas: 'Melancólica. Escribe mucho. Conoce secretos del pueblo.'
    },
    evidenceReactions: {
      carta_antigua: '*Lágrimas* Esta carta... la escribí yo. Hace años. ¿Cómo...?',
      boligrafo: 'He visto bolígrafos así. Varios tienen, incluyéndome.',
      diario_luna: '*Se pone pálida* ¡Eso es MÍO! ¿Cómo te atreves a leer cosas privadas?',
      papel_fino: 'Ese papel... lo he visto. Steven me dio algunos para... invitaciones.',
      cuaderno_orik: 'Orik y sus mapas oscuros. Siempre caminando de noche.'
    },
    dialogs: {
      initial: {
        text: '*Voz suave* Vi algo extraño hace semanas... personas entregando cosas en puertas de noche.',
        options: [
          { id: 'detalles', label: 'Cuéntame más' },
          { id: 'tu_participacion', label: '¿Tú estabas ahí?' }
        ]
      },
      detalles: {
        text: 'Era de noche. Una figura alta con mochila. Dejó algo y se fue rápido. Pero... había otra persona también. Más pequeña.',
        clue: 'Luna vio dos personas diferentes entregando cosas',
        rewards: { copper: 1 },
        unlocks: { suspect: 'david' },
        options: [{ id: 'tu_participacion', label: '¿Tú eras la persona pequeña?' }]
      },
      tu_participacion: {
        text: '*Suspira* Yo... yo estaba paseando. No podía dormir. Los recuerdos me atormentan.',
        clue: 'Luna confiesa estar fuera de noche',
        options: [{ id: 'recuerdos', label: '¿Qué recuerdos?' }]
      },
      recuerdos: {
        text: '*Lágrimas* Perdí a alguien hace años. El amor de mi vida. Y todos fueron felices menos yo. A veces... a veces pienso que es injusto.',
        clue: 'Luna tiene dolor profundo por pérdida amorosa',
        rewards: { emerald: 1 },
        options: [{ id: 'injusticia', label: '¿Injusto cómo?' }]
      },
      injusticia: {
        text: '*Voz temblorosa* Que otros tengan lo que yo perdí. Que sean felices cuando yo sufro cada día. Sé que está mal pensar así pero... *Se detiene* Lo siento, no debí decir eso.',
        clue: 'Luna admite resentimiento hacia felicidad ajena',
        rewards: { item: 'diario_luna' },
        options: []
      }
    }
  }
];

// LOCACIONES EXPANDIDAS CON SISTEMA DE LLAVES
const locations = [
  {
    id: 'plaza',
    name: 'Plaza del Mercado',
    description: 'Corazón comercial de Moonveil',
    locked: false,
    icon: '🏛️',
    areas: {
      zona_central: {
        name: 'Zona Central',
        icon: '🏛️',
        locked: false,
        items: [
          { id: 'moneda1', type: 'reward', icon: '🪙', found: false, reward: { copper: 1 } },
          { id: 'empty1', type: 'empty', icon: '❓', found: false }
        ]
      },
      puestos: {
        name: 'Puestos',
        icon: '🏪',
        locked: false,
        items: [
          { id: 'carta_tirada', type: 'clue', icon: '💌', name: 'Carta Arrugada', found: false, clue: 'Carta arrugada encontrada en plaza - borrador fallido' }
        ]
      },
      callejon: {
        name: 'Callejón Oscuro',
        icon: '🌑',
        locked: false,
        items: [
          { id: 'rastros_papel', type: 'clue', icon: '📄', name: 'Rastros de Papel', found: false, clue: 'Pequeños trozos de papel fino en el suelo' }
        ]
      }
    }
  },
  {
    id: 'library',
    name: 'Biblioteca Municipal',
    description: 'Repositorio de conocimiento y secretos',
    locked: true,
    icon: '📚',
    areas: {
      sala_principal: {
        name: 'Sala Principal',
        icon: '📚',
        locked: false,
        items: [
          { id: 'libro_desamor', type: 'clue', icon: '📖', name: 'Libro sobre Desamor', found: false, clue: 'Libro muy usado recientemente sobre corazones rotos' },
          { id: 'moneda2', type: 'reward', icon: '🪙', found: false, reward: { copper: 2 } }
        ]
      },
      archivos: {
        name: 'Sala de Archivos',
        icon: '📋',
        locked: false,
        items: [
          { id: 'fragmento_carta', type: 'evidence', icon: '📄', name: 'Fragmento de Carta', found: false, clue: 'Borrador con letra familiar - parece practicada' },
          { id: 'tinta_especial', type: 'evidence', icon: '🖋️', name: 'Tinta Especial', found: false, clue: 'Tinta negra de calidad - casi vacía' }
        ]
      },
      sotano: {
        name: 'Sótano de Suministros',
        icon: '⬇️',
        locked: true,
        requiresKey: 'llave_sotano',
        items: [
          { id: 'cofre1', type: 'chest', icon: '📦', found: false, reward: { copper: 3, emerald: 1 } },
          { id: 'boligrafo', type: 'evidence', icon: '🖊️', name: 'Bolígrafo', found: false, clue: 'Bolígrafo usado recientemente - tinta coincide' },
          { id: 'llave_archivo', type: 'key', icon: '🔑', name: 'Llave del Archivo', found: false, unlocks: 'archivo_secreto', clue: 'Llave oxidada - abre algo importante' }
        ]
      },
      archivo_secreto: {
        name: 'Archivo Secreto',
        icon: '🔐',
        locked: true,
        requiresKey: 'llave_archivo',
        items: [
          { id: 'expediente_steven', type: 'evidence', icon: '📁', name: 'Expediente Sellado', found: false, clue: 'Expediente de Steven con información clasificada' },
          { id: 'registros_antiguos', type: 'evidence', icon: '📜', name: 'Registros Antiguos', found: false, clue: 'Registros de hace años - nombre de Luna aparece' }
        ]
      }
    }
  },
  {
    id: 'forest',
    name: 'Bosque Oscuro',
    description: 'Senderos ocultos y secretos enterrados',
    locked: true,
    icon: '🌲',
    areas: {
      sendero: {
        name: 'Sendero Principal',
        icon: '🌲',
        locked: false,
        items: [
          { id: 'mapa_roto', type: 'evidence', icon: '🗺️', name: 'Mapa Roto', found: false, clue: 'Mapa con rutas nocturnas marcadas - letra de cartógrafo' }
        ]
      },
      claro: {
        name: 'Claro de Luna',
        icon: '🌙',
        locked: false,
        items: [
          { id: 'cuaderno_orik', type: 'evidence', icon: '📔', name: 'Cuaderno de ████', found: false, clue: 'Escritos llenos de amargura y planes de "justicia"' },
          { id: 'carta_antigua', type: 'letter', icon: '💔', name: 'Carta de Amor Antigua', found: false, content: 'Carta de amor nunca enviada. Autor desconocido. Habla de un amor imposible y dolor eterno.', clue: 'Carta de amor no enviada - ¿de quién?' }
        ]
      },
      zona_profunda: {
        name: 'Zona Profunda',
        icon: '🌑',
        locked: false,
        items: [
          { id: 'cofre2', type: 'chest', icon: '📦', found: false, reward: { emerald: 2 } },
          { id: 'llave_sotano', type: 'key', icon: '🔑', name: 'Llave del Sótano', found: false, unlocks: 'sotano', clue: 'Llave escondida en el bosque - ¿quién la dejó?' }
        ]
      },
      escondite: {
        name: 'Escondite Secreto',
        icon: '🕳️',
        locked: true,
        requiresKey: 'llave_escondite',
        items: [
          { id: 'diario_luna', type: 'evidence', icon: '📓', name: 'Diario de Luna', found: false, clue: 'Diario con pensamientos oscuros sobre venganza e injusticia' },
          { id: 'cartas_guardadas', type: 'evidence', icon: '✉️', name: 'Cartas Guardadas', found: false, clue: 'Borradores de cartas crueles - múltiples intentos' }
        ]
      }
    }
  },
  {
    id: 'tavern',
    name: 'La Taberna',
    description: 'Donde los secretos fluyen con el alcohol',
    locked: true,
    icon: '🍺',
    areas: {
      salon: {
        name: 'Salón Principal',
        icon: '🍺',
        locked: false,
        items: [
          { id: 'nota_testigo', type: 'clue', icon: '📝', name: 'Nota de Camarero', found: false, clue: '████ hablaba solo, molesto, sobre "justicia merecida"' },
          { id: 'moneda3', type: 'reward', icon: '🪙', found: false, reward: { copper: 2 } }
        ]
      },
      almacen: {
        name: 'Almacén',
        icon: '📦',
        locked: false,
        items: [
          { id: 'cofre3', type: 'chest', icon: '📦', found: false, reward: { copper: 5 } }
        ]
      },
      habitaciones: {
        name: 'Habitaciones',
        icon: '🚪',
        locked: false,
        items: [
          { id: 'conversacion_grabada', type: 'clue', icon: '🎙️', name: 'Conversación Escuchada', found: false, clue: 'Luna y Sand hablaron aquí hace meses - testigo lo recuerda' }
        ]
      }
    }
  },
  {
    id: 'town_hall',
    name: 'Ayuntamiento',
    description: 'Registros oficiales y verdades documentadas',
    locked: true,
    icon: '🏛️',
    areas: {
      oficina: {
        name: 'Oficina Principal',
        icon: '🏛️',
        locked: false,
        items: [
          { id: 'registro_compras', type: 'evidence', icon: '📋', name: 'Registro de Compras', found: false, clue: 'Orik compró papel y tinta hace 2 meses' },
          { id: 'registro_salidas', type: 'evidence', icon: '📊', name: 'Registro de Salidas', found: false, clue: 'Salidas nocturnas registradas: Orik, Steven, Luna' }
        ]
      },
      archivo: {
        name: 'Archivo Municipal',
        icon: '📚',
        locked: false,
        items: [
          { id: 'expediente_rechazo', type: 'evidence', icon: '💔', name: 'Expediente de Rechazo', found: false, clue: 'Solicitud de ████ rechazada hace 6 meses' },
          { id: 'cofre4', type: 'chest', icon: '📦', found: false, reward: { emerald: 3 } }
        ]
      },
      boveda: {
        name: 'Bóveda de Secretos',
        icon: '🔐',
        locked: true,
        requiresKey: 'llave_boveda',
        items: [
          { id: 'expediente_luna', type: 'evidence', icon: '📁', name: 'Expediente de Luna', found: false, clue: 'Pérdida trágica hace 5 años - prometido murió' },
          { id: 'lista_victimas', type: 'evidence', icon: '📋', name: 'Lista de Víctimas', found: false, clue: 'Todas las víctimas tienen conexión - amor o felicidad' }
        ]
      }
    }
  },
  {
    id: 'gardens',
    name: 'Jardines de Luna',
    description: 'Flores y melancolía',
    locked: true,
    icon: '🌺',
    areas: {
      jardin_central: {
        name: 'Jardín Central',
        icon: '🌺',
        locked: false,
        items: [
          { id: 'papel_fino', type: 'evidence', icon: '📄', name: 'Papel Fino', found: false, clue: 'Papel para cartas formales - mismo que las cartas crueles' }
        ]
      },
      invernadero: {
        name: 'Invernadero',
        icon: '🌿',
        locked: false,
        items: [
          { id: 'cofre5', type: 'chest', icon: '📦', found: false, reward: { copper: 4, emerald: 1 } },
          { id: 'notas_luna', type: 'clue', icon: '📝', name: 'Notas de Luna', found: false, clue: 'Notas sobre "hacer que otros sientan mi dolor"' }
        ]
      },
      taller: {
        name: 'Taller Personal',
        icon: '🎨',
        locked: true,
        requiresKey: 'llave_escondite',
        items: [
          { id: 'materiales_escritura', type: 'evidence', icon: '✒️', name: 'Materiales de Escritura', found: false, clue: 'Plumas, tinta, papel - exactamente los mismos de las cartas' },
          { id: 'llave_boveda', type: 'key', icon: '🔑', name: 'Llave de la Bóveda', found: false, unlocks: 'boveda', clue: 'Llave robada del ayuntamiento' }
        ]
      }
    }
  },
  {
    id: 'archives',
    name: 'Archivos Históricos',
    description: 'Pasado enterrado pero no olvidado',
    locked: true,
    icon: '📚',
    areas: {
      sala_lectura: {
        name: 'Sala de Lectura',
        icon: '📖',
        locked: false,
        items: [
          { id: 'periodicos_antiguos', type: 'clue', icon: '📰', name: 'Periódicos Antiguos', found: false, clue: 'Artículo sobre muerte trágica hace 5 años - prometido de Luna' }
        ]
      },
      registros: {
        name: 'Registros Civiles',
        icon: '📋',
        locked: false,
        items: [
          { id: 'conexiones', type: 'evidence', icon: '🕸️', name: 'Mapa de Conexiones', found: false, clue: 'Todas las víctimas están conectadas por relaciones pasadas' }
        ]
      }
    }
  },
  {
    id: 'manor',
    name: 'Mansión Abandonada',
    description: 'Donde los secretos duermen',
    locked: true,
    icon: '🏚️',
    areas: {
      entrada: {
        name: 'Entrada',
        icon: '🚪',
        locked: false,
        items: [
          { id: 'empty2', type: 'empty', icon: '❓', found: false }
        ]
      },
      salon: {
        name: 'Salón',
        icon: '🛋️',
        locked: false,
        items: [
          { id: 'retrato', type: 'clue', icon: '🖼️', name: 'Retrato Antiguo', found: false, clue: 'Retrato de Luna con su prometido fallecido' }
        ]
      },
      estudio: {
        name: 'Estudio',
        icon: '📚',
        locked: true,
        requiresKey: 'llave_estudio',
        items: [
          { id: 'prueba_definitiva', type: 'evidence', icon: '🔍', name: 'Prueba Definitiva', found: false, clue: 'Evidencia concluyente del verdadero culpable' },
          { id: 'confesion_escrita', type: 'evidence', icon: '📜', name: 'Confesión', found: false, clue: 'Carta donde el culpable admite sus planes' }
        ]
      }
    }
  }
];

// Función para determinar culpable al inicio
function determineActualCulprit() {
  // Sistema dinámico: el culpable real se determina al iniciar el juego
  // Esto hace que cada partida sea diferente
  const culprits = ['orik', 'luna', 'steven'];
  const randomIndex = Math.floor(Math.random() * culprits.length);
  gameState.actualCulprit = culprits[randomIndex];
  
  // Ajustar evidencia según el culpable
  adjustEvidenceForCulprit(gameState.actualCulprit);
  
  console.log('🎯 Culpable determinado:', gameState.actualCulprit);
}

function adjustEvidenceForCulprit(culprit) {
  // Ajustar pistas según quién sea el culpable real
  // Esto hace que la evidencia apunte correctamente
  
  if (culprit === 'orik') {
    // Orik es el culpable: ajustar pistas para que apunten a él
    console.log('🗺️ Culpable: Orik el Cartógrafo');
  } else if (culprit === 'luna') {
    // Luna es la culpable: las flores, el dolor, la venganza
    console.log('🌺 Culpable: Luna la Florista');
  } else if (culprit === 'steven') {
    // Steven es el culpable: acceso total, motivo oculto
    console.log('📚 Culpable: Steven el Bibliotecario');
  }
}

// INICIALIZACIÓN
function initGame() {
  setupNavbar();
  setupParticles();
  setupTabs();
  setupModals();
  setupSaveButton();
  setupKeyButton();
  checkSavedGame();
}

function checkSavedGame() {
  const saved = loadGame();
  if (saved) {
    $('#continueGameBtn').style.display = 'block';
    $('#resetGameBtn').style.display = 'block';
    $('#continueGameBtn').addEventListener('click', continueGame);
    $('#resetGameBtn').addEventListener('click', () => {
      if (confirm('¿Borrar todo el progreso? Esta acción no se puede deshacer.')) {
        localStorage.removeItem('moonveil_heartbreak_save_v4');
        location.reload();
      }
    });
  }
  $('#newGameBtn').addEventListener('click', () => {
    if (saved && !confirm('¿Empezar nueva partida? Perderás todo el progreso actual.')) return;
    startNewGame();
  });
}

function startNewGame() {
  Object.assign(gameState, {
    initialized: true,
    startDate: Date.now(),
    day: 1,
    currentView: null,
    currentId: null,
    chats: {},
    suspectProgress: {},
    inventory: [],
    keys: [],
    clues: [],
    rewards: { copper: 0, emeralds: 0 },
    notebook: [],
    unlockedLocations: ['plaza'],
    locationProgress: {},
    evidenceShown: {},
    progress: 0,
    caseSolved: false,
    accusedOnce: false,
    actualCulprit: null
  });
  
  // Determinar culpable
  determineActualCulprit();
  
  addNotebookEntry('Día 1 - Inicio', 'Caso iniciado. Víctima principal: Sand Brill. Cartas anónimas crueles están destruyendo vidas. Debo encontrar al culpable.');
  saveGame();
  startGame();
}

function continueGame() {
  if (!loadGame()) {
    toast('❌ No se pudo cargar el juego');
    return;
  }
  startGame();
}

function startGame() {
  $('#introScreen').style.display = 'none';
  $('#gameContainer').style.display = 'grid';
  renderSuspects();
  renderLocations();
  renderProfiles();
  updateHUD();
  renderNotebook();
  renderInventory();
  toast('🔍 Investigación en curso...');
}

// SETUP FUNCTIONS
function setupNavbar() {
  const t = $('#navToggle');
  const l = $('#navLinks');
  t?.addEventListener('click', e => {
    e.stopPropagation();
    l.classList.toggle('open');
  });
  document.addEventListener('click', e => {
    if (!t?.contains(e.target) && !l?.contains(e.target)) {
      l?.classList.remove('open');
    }
  });
}

function setupParticles() {
  const c = $('#bgParticles');
  if (!c) return;
  const ctx = c.getContext('2d');
  const dpi = Math.max(1, devicePixelRatio || 1);
  let w, h, parts;
  
  const init = () => {
    w = c.width = innerWidth * dpi;
    h = c.height = innerHeight * dpi;
    parts = new Array(60).fill(0).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: (1 + Math.random() * 2) * dpi,
      s: 0.3 + Math.random() * 0.5,
      a: 0.1 + Math.random() * 0.2
    }));
  };
  
  const tick = () => {
    ctx.clearRect(0, 0, w, h);
    parts.forEach(p => {
      p.y += p.s;
      p.x += Math.sin(p.y * 0.003) * 0.4;
      if (p.y > h) {
        p.y = -10;
        p.x = Math.random() * w;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(236,72,153,${p.a})`;
      ctx.fill();
    });
    requestAnimationFrame(tick);
  };
  
  init();
  tick();
  addEventListener('resize', init);
}

// RENDERING FUNCTIONS
function renderSuspects() {
  const list = $('#suspectsList');
  if (!list) return;
  
  list.innerHTML = suspects.map(s => {
    const unlocked = s.unlocked || gameState.suspectProgress[s.id]?.talked;
    const locked = !unlocked;
    
    return `<li class="suspect-item ${locked ? 'locked' : ''} ${gameState.currentView === 'suspect' && gameState.currentId === s.id ? 'active' : ''}" data-id="${s.id}">
      <div class="avatar">${locked ? '🔒' : `<img src="${s.avatar}" alt="${s.name}">`}</div>
      <div class="suspect-info">
        <div class="suspect-name">
          ${s.name}
          <span class="badge ${locked ? 'locked' : s.status}">${getStatusLabel(s.status, locked)}</span>
        </div>
        <div class="suspect-role">${locked ? '???' : s.role}</div>
      </div>
    </li>`;
  }).join('');
  
  $$('.suspect-item:not(.locked)', list).forEach(item => {
    item.addEventListener('click', () => selectSuspect(item.dataset.id));
  });
}

function renderLocations() {
  const list = $('#locationsList');
  if (!list) return;
  
  list.innerHTML = locations.map(loc => {
    const unlocked = gameState.unlockedLocations.includes(loc.id);
    const locked = !unlocked;
    const hasLockedAreas = !locked && Object.values(loc.areas).some(area => area.requiresKey && !gameState.keys.includes(area.requiresKey));
    
    return `<li class="location-item ${locked ? 'locked' : ''} ${gameState.currentView === 'location' && gameState.currentId === loc.id ? 'active' : ''}" data-id="${loc.id}">
      <div class="location-visual ${loc.id}">
        ${locked ? '<span class="icon">🔒</span>' : `<span class="icon">${loc.icon}</span>`}
      </div>
      <div class="location-info">
        <div class="location-name">
          ${loc.name}
          ${hasLockedAreas ? '<span class="badge requires-key">🔑</span>' : ''}
          ${locked ? '<span class="badge locked">🔒</span>' : ''}
        </div>
        <div class="location-desc">${locked ? 'Desbloquear con pistas' : loc.description}</div>
      </div>
    </li>`;
  }).join('');
  
  $$('.location-item:not(.locked)', list).forEach(item => {
    item.addEventListener('click', () => selectLocation(item.dataset.id));
  });
}

// SUSPECT SELECTION
function selectSuspect(id) {
  const suspect = suspects.find(s => s.id === id);
  if (!suspect) return;
  
  gameState.currentView = 'suspect';
  gameState.currentId = id;
  updateActiveSelection();
  
  $('#dialogAvatar').innerHTML = `<img src="${suspect.avatar}" alt="${suspect.name}">`;
  $('#dialogName').textContent = suspect.name;
  $('#dialogRole').textContent = suspect.role;
  $('#btnDeclare').disabled = false;
  $('#btnShowEvidence').disabled = false;
  $('#btnResetChat').disabled = false;
  
  $('#locationExplorer').classList.add('hidden');
  $('#dialogThread').classList.remove('hidden');
  $('#dialogOptions').classList.add('hidden');
  
  loadSuspectChat(suspect);
  
  if (!gameState.suspectProgress[id]) {
    gameState.suspectProgress[id] = { talked: true, dialogPath: [] };
  }
  
  renderProfiles();
  saveGame();
}

function loadSuspectChat(suspect) {
  const thread = $('#dialogThread');
  const chatHistory = gameState.chats[suspect.id] || [];
  
  thread.innerHTML = '';
  
  if (chatHistory.length === 0) {
    addNotebookEntry(`Interrogatorio: ${suspect.name}`, `Comenzaste a interrogar a ${suspect.name}.`);
    showSuspectDialog(suspect, 'initial');
  } else {
    chatHistory.forEach(msg => {
      const msgDiv = document.createElement('div');
      msgDiv.className = `dialog-msg ${msg.sender}`;
      msgDiv.innerHTML = `
        <div class="avatar">${msg.sender === 'peer' ? `<img src="${suspect.avatar}" alt="${suspect.name}">` : '<img src="img/imper.jpg" alt="Detective">'}</div>
        <div class="bubble">
          <div class="text">${msg.text}</div>
          <div class="meta">${msg.time}</div>
        </div>`;
      thread.appendChild(msgDiv);
    });
    thread.scrollTop = thread.scrollHeight;
    showSuspectOptions(suspect);
  }
}

function showSuspectDialog(suspect, dialogId) {
  const dialog = suspect.dialogs[dialogId];
  if (!dialog) return;
  
  const thread = $('#dialogThread');
  const chatHistory = gameState.chats[suspect.id] || [];
  
  const msg = { sender: 'peer', text: dialog.text, time: timeNow() };
  chatHistory.push(msg);
  gameState.chats[suspect.id] = chatHistory;
  
  const msgDiv = document.createElement('div');
  msgDiv.className = 'dialog-msg peer';
  msgDiv.innerHTML = `
    <div class="avatar"><img src="${suspect.avatar}" alt="${suspect.name}"></div>
    <div class="bubble">
      <div class="text">${dialog.text}</div>
      <div class="meta">${msg.time}</div>
    </div>`;
  thread.appendChild(msgDiv);
  thread.scrollTop = thread.scrollHeight;
  
  if (dialog.clue) addClue(dialog.clue);
  
  if (dialog.rewards) {
    if (dialog.rewards.item) addToInventory(dialog.rewards.item);
    if (dialog.rewards.copper) {
      gameState.rewards.copper += dialog.rewards.copper;
      showReward('🪙', `+${dialog.rewards.copper} Cobre`);
    }
    if (dialog.rewards.emerald) {
      gameState.rewards.emeralds += dialog.rewards.emerald;
      showReward('💎', `+${dialog.rewards.emerald} Esmeralda`);
    }
  }
  
  if (dialog.unlocks) {
    if (dialog.unlocks.location) unlockLocation(dialog.unlocks.location);
    if (dialog.unlocks.location2) unlockLocation(dialog.unlocks.location2);
    if (dialog.unlocks.suspect) unlockSuspect(dialog.unlocks.suspect);
    if (dialog.unlocks.suspect2) unlockSuspect(dialog.unlocks.suspect2);
  }
  
  if (!gameState.suspectProgress[suspect.id]) {
    gameState.suspectProgress[suspect.id] = { talked: true, dialogPath: [] };
  }
  gameState.suspectProgress[suspect.id].dialogPath.push(dialogId);
  
  if (dialog.options && dialog.options.length > 0) {
    showDialogOptions(suspect, dialog.options);
  } else {
    $('#dialogOptions').classList.add('hidden');
  }
  
  updateHUD();
  saveGame();
}

function showDialogOptions(suspect, options) {
  const optionsDiv = $('#dialogOptions');
  optionsDiv.innerHTML = options.map(opt => {
    const disabled = !suspect.dialogs[opt.id];
    return `<button class="dialog-option" data-next="${opt.id}" ${disabled ? 'disabled' : ''}>${opt.label}</button>`;
  }).join('');
  optionsDiv.classList.remove('hidden');
  
  $$('.dialog-option:not(:disabled)', optionsDiv).forEach(btn => {
    btn.addEventListener('click', () => handleDialogChoice(suspect, btn.dataset.next, btn.textContent));
  });
}

function showSuspectOptions(suspect) {
  const progress = gameState.suspectProgress[suspect.id];
  if (!progress || !progress.dialogPath.length) return;
  
  const lastDialog = progress.dialogPath[progress.dialogPath.length - 1];
  const dialog = suspect.dialogs[lastDialog];
  
  if (dialog && dialog.options && dialog.options.length > 0) {
    showDialogOptions(suspect, dialog.options);
  }
}

function handleDialogChoice(suspect, nextId, choiceText) {
  const thread = $('#dialogThread');
  const chatHistory = gameState.chats[suspect.id] || [];
  
  const msg = { sender: 'detective', text: choiceText, time: timeNow() };
  chatHistory.push(msg);
  gameState.chats[suspect.id] = chatHistory;
  
  const msgDiv = document.createElement('div');
  msgDiv.className = 'dialog-msg detective';
  msgDiv.innerHTML = `
    <div class="avatar"><img src="img/imper.jpg" alt="Detective"></div>
    <div class="bubble">
      <div class="text">${choiceText}</div>
      <div class="meta">${msg.time}</div>
    </div>`;
  thread.appendChild(msgDiv);
  thread.scrollTop = thread.scrollHeight;
  
  $('#dialogOptions').classList.add('hidden');
  
  setTimeout(() => showSuspectDialog(suspect, nextId), 500);
}

// LOCATION SELECTION
function selectLocation(id) {
  const location = locations.find(l => l.id === id);
  if (!location) return;
  
  gameState.currentView = 'location';
  gameState.currentId = id;
  updateActiveSelection();
  
  $('#dialogAvatar').innerHTML = `<div class="location-visual ${id}"><span class="icon">${location.icon}</span></div>`;
  $('#dialogName').textContent = location.name;
  $('#dialogRole').textContent = 'Explorar áreas';
  $('#btnDeclare').disabled = true;
  $('#btnShowEvidence').disabled = true;
  $('#btnResetChat').disabled = true;
  
  $('#dialogThread').classList.add('hidden');
  $('#dialogOptions').classList.add('hidden');
  $('#locationExplorer').classList.remove('hidden');
  $('#locationTitle').textContent = location.name;
  
  showLocationAreas(location);
  
  if (!gameState.locationProgress[id]) {
    gameState.locationProgress[id] = { areas: {}, items: [] };
    addNotebookEntry(`Visitaste: ${location.name}`, location.description);
  }
  
  saveGame();
}

function showLocationAreas(location) {
  const grid = $('#areasGrid');
  const searchArea = $('#searchArea');
  
  grid.style.display = 'grid';
  searchArea.innerHTML = '';
  
  grid.innerHTML = Object.entries(location.areas).map(([areaId, area]) => {
    const explored = gameState.locationProgress[location.id]?.areas[areaId];
    const locked = area.requiresKey && !gameState.keys.includes(area.requiresKey);
    
    return `<div class="area-card ${explored ? 'explored' : ''} ${locked ? 'locked' : ''}" data-area-id="${areaId}">
      <div class="icon">${area.icon}</div>
      <div class="label">${area.name}</div>
      ${explored ? '<small style="color:#6ee7b7;">✓ Explorado</small>' : ''}
      ${locked ? '<small style="color:#fbbf24;">🔒 Requiere llave</small>' : ''}
    </div>`;
  }).join('');
  
  $$('.area-card:not(.locked)', grid).forEach(card => {
    card.addEventListener('click', () => exploreArea(location, card.dataset.areaId));
  });
  
  $$('.area-card.locked', grid).forEach(card => {
    card.addEventListener('click', () => {
      const area = location.areas[card.dataset.areaId];
      toast(`🔒 Necesitas: ${getKeyName(area.requiresKey)}`);
    });
  });
  
  $('#btnBackToAreas').addEventListener('click', () => showLocationAreas(location));
}

function exploreArea(location, areaId) {
  const area = location.areas[areaId];
  if (!area) return;
  
  if (!gameState.locationProgress[location.id].areas[areaId]) {
    gameState.locationProgress[location.id].areas[areaId] = true;
    addNotebookEntry(`Exploraste: ${area.name}`, `En ${location.name}`);
  }
  
  $('#areasGrid').style.display = 'none';
  const searchArea = $('#searchArea');
  
  searchArea.innerHTML = `
    <h4 style="margin-bottom:16px;color:var(--heart);">${area.name}</h4>
    <div class="search-grid">
      ${area.items.map(item => {
        const found = gameState.locationProgress[location.id].items.includes(item.id);
        const isChest = item.type === 'chest';
        const isKey = item.type === 'key';
        
        return `<div class="search-item ${found ? 'found' : ''} ${isChest ? 'chest' : ''} ${isKey ? 'key-item' : ''}" data-item-id="${item.id}">
          <div class="icon">${item.icon}</div>
          <div class="label">${found ? '✓ Encontrado' : '¿?'}</div>
        </div>`;
      }).join('')}
    </div>`;
  
  $$('.search-item:not(.found)', searchArea).forEach(item => {
    item.addEventListener('click', () => findAreaItem(location, areaId, item.dataset.itemId));
  });
  
  saveGame();
  renderLocations();
}

function findAreaItem(location, areaId, itemId) {
  const area = location.areas[areaId];
  const item = area.items.find(i => i.id === itemId);
  
  if (!item || gameState.locationProgress[location.id].items.includes(itemId)) return;
  
  gameState.locationProgress[location.id].items.push(itemId);
  
  if (item.type === 'empty') {
    toast('❌ Nada aquí...');
  } else if (item.type === 'reward') {
    if (item.reward.copper) {
      gameState.rewards.copper += item.reward.copper;
      toast(`🪙 +${item.reward.copper} Cobre`);
    }
    if (item.reward.emerald) {
      gameState.rewards.emeralds += item.reward.emerald;
      toast(`💎 +${item.reward.emerald} Esmeralda`);
    }
  } else if (item.type === 'chest') {
    openChest(item);
  } else if (item.type === 'key') {
    findKey(item);
  } else {
    addToInventory(itemId, item);
    if (item.clue) addClue(item.clue);
    toast(`✨ ¡${item.name}!`);
  }
  
  exploreArea(location, areaId);
  updateHUD();
  saveGame();
}

function openChest(chest) {
  const modal = $('#chestModal');
  let contents = [];
  
  if (chest.reward.copper) {
    gameState.rewards.copper += chest.reward.copper;
    contents.push(`🪙 ${chest.reward.copper} Cobre`);
  }
  if (chest.reward.emerald) {
    gameState.rewards.emeralds += chest.reward.emerald;
    contents.push(`💎 ${chest.reward.emerald} Esmeralda`);
  }
  
  $('#chestContents').innerHTML = contents.join('<br>');
  modal.classList.add('show');
  setTimeout(() => modal.classList.remove('show'), 2500);
}

function findKey(keyItem) {
  gameState.keys.push(keyItem.unlocks);
  addToInventory(keyItem.id, keyItem);
  
  const modal = $('#keyModal');
  $('#keyDescription').innerHTML = `<strong>${keyItem.name}</strong><br><br>${keyItem.clue}`;
  modal.classList.add('show');
  
  addNotebookEntry('🔑 Llave Encontrada', `${keyItem.name}: ${keyItem.clue}`);
  toast(`🔑 ¡${keyItem.name}!`);
  
  setTimeout(() => modal.classList.remove('show'), 3000);
  renderLocations(); // Actualizar para mostrar áreas desbloqueadas
}

function getKeyName(keyId) {
  const keyNames = {
    'llave_sotano': 'Llave del Sótano',
    'llave_archivo': 'Llave del Archivo',
    'llave_escondite': 'Llave del Escondite',
    'llave_boveda': 'Llave de la Bóveda',
    'llave_estudio': 'Llave del Estudio'
  };
  return keyNames[keyId] || 'Llave especial';
}

// EVIDENCE SYSTEM
$('#btnShowEvidence')?.addEventListener('click', () => {
  if (!gameState.currentId || gameState.currentView !== 'suspect') return;
  
  const modal = $('#evidenceModal');
  const suspect = suspects.find(s => s.id === gameState.currentId);
  $('#evidenceTarget').textContent = suspect.name;
  
  const list = $('#evidenceList');
  const showableItems = gameState.inventory.filter(i => 
    i.type === 'evidence' || i.type === 'letter' || i.type === 'clue'
  );
  
  if (showableItems.length === 0) {
    list.innerHTML = '<p class="muted">No tienes evidencia para mostrar aún.</p>';
  } else {
    list.innerHTML = showableItems.map(item => `
      <div class="evidence-item" data-item-id="${item.id}">
        <div class="icon">${item.icon}</div>
        <div class="name">${item.name}</div>
      </div>
    `).join('');
    
    $$('.evidence-item', list).forEach(el => {
      el.addEventListener('click', () => showEvidenceToSuspect(suspect, el.dataset.itemId));
    });
  }
  
  modal.classList.add('show');
});

function showEvidenceToSuspect(suspect, itemId) {
  closeModals();
  
  const item = gameState.inventory.find(i => i.id === itemId);
  if (!item) return;
  
  if (!gameState.evidenceShown[suspect.id]) {
    gameState.evidenceShown[suspect.id] = {};
  }
  
  if (gameState.evidenceShown[suspect.id][itemId]) {
    toast('Ya mostraste esto antes');
    return;
  }
  
  gameState.evidenceShown[suspect.id][itemId] = true;
  
  const reaction = suspect.evidenceReactions?.[itemId] || 
    '*Mira el objeto detenidamente* Interesante... pero no sé mucho sobre esto.';
  
  const thread = $('#dialogThread');
  const chatHistory = gameState.chats[suspect.id] || [];
  
  // Mensaje detective
  const detectiveMsg = { sender: 'detective', text: `*Muestras: ${item.name}*`, time: timeNow() };
  chatHistory.push(detectiveMsg);
  
  const detectiveMsgDiv = document.createElement('div');
  detectiveMsgDiv.className = 'dialog-msg detective';
  detectiveMsgDiv.innerHTML = `
    <div class="avatar"><img src="img/imper.jpg" alt="Detective"></div>
    <div class="bubble">
      <div class="text">*Muestras: ${item.name}*</div>
      <div class="meta">${detectiveMsg.time}</div>
    </div>`;
  thread.appendChild(detectiveMsgDiv);
  
  // Mensaje reacción
  const reactionMsg = { sender: 'peer', text: reaction, time: timeNow() };
  chatHistory.push(reactionMsg);
  
  const reactionMsgDiv = document.createElement('div');
  reactionMsgDiv.className = 'dialog-msg peer';
  reactionMsgDiv.innerHTML = `
    <div class="avatar"><img src="${suspect.avatar}" alt="${suspect.name}"></div>
    <div class="bubble">
      <div class="text">${reaction}</div>
      <div class="meta">${reactionMsg.time}</div>
    </div>`;
  thread.appendChild(reactionMsgDiv);
  
  gameState.chats[suspect.id] = chatHistory;
  thread.scrollTop = thread.scrollHeight;
  
  // Clue extra por mostrar evidencia clave
  if (itemId === 'cuaderno_orik' || itemId === 'diario_luna' || itemId === 'expediente_steven') {
    addClue(`${suspect.name} reaccionó fuertemente a ${item.name}`);
  }
  
  addNotebookEntry('Evidencia Mostrada', `Mostraste "${item.name}" a ${suspect.name}`);
  saveGame();
  toast(`✓ Mostraste evidencia a ${suspect.name}`);
}

// RESET CHAT
$('#btnResetChat')?.addEventListener('click', () => {
  if (!gameState.currentId || gameState.currentView !== 'suspect') return;
  
  const modal = $('#resetChatModal');
  const suspect = suspects.find(s => s.id === gameState.currentId);
  $('#resetTarget').textContent = suspect.name;
  modal.classList.add('show');
});

$('#confirmReset')?.addEventListener('click', () => {
  const id = gameState.currentId;
  delete gameState.chats[id];
  delete gameState.suspectProgress[id];
  delete gameState.evidenceShown[id];
  
  closeModals();
  toast('🔄 Chat reiniciado');
  selectSuspect(id);
  saveGame();
});

// ACCUSATION SYSTEM
$('#btnDeclare')?.addEventListener('click', () => {
  if (!gameState.currentId || gameState.currentView !== 'suspect') return;
  
  const modal = $('#declareModal');
  const suspect = suspects.find(s => s.id === gameState.currentId);
  $('#declareTarget').textContent = suspect.name;
  $('#declareReasons').value = '';
  
  const evidenceSummary = $('#evidenceSummary');
  evidenceSummary.innerHTML = `
    <h4>Tu evidencia:</h4>
    <ul style="padding-left:20px;">
      <li>Pistas: ${gameState.clues.length}/30</li>
      <li>Objetos: ${gameState.inventory.length}</li>
      <li>Llaves: ${gameState.keys.length}</li>
      <li>Progreso: ${Math.round(gameState.progress)}%</li>
    </ul>
    <p style="margin-top:12px;"><strong>⚠️ Solo tienes UNA oportunidad. Elige sabiamente.</strong></p>
  `;
  
  modal.classList.add('show');
});

$('#confirmDeclare')?.addEventListener('click', () => {
  if (gameState.accusedOnce) {
    toast('⚠️ Ya acusaste a alguien.');
    return;
  }
  
  const accusedId = gameState.currentId;
  const reasons = $('#declareReasons').value;
  
  gameState.accusedOnce = true;
  closeModals();
  
  if (accusedId === gameState.actualCulprit) {
    showEnding(true, reasons, accusedId);
  } else {
    showEnding(false, reasons, accusedId);
  }
  
  saveGame();
});

function showEnding(success, reasons, accusedId) {
  const modal = $('#endingModal');
  const content = $('#endingContent');
  const accused = suspects.find(s => s.id === accusedId);
  const actualCulpritData = suspects.find(s => s.id === gameState.actualCulprit);
  
  if (success) {
    const culpritStories = {
      orik: `Orik Vall confesó entre lágrimas. Rechazado hace 6 meses por alguien que también rechazó a Sand, su dolor se convirtió en venganza. 
      
      "Si yo no puedo ser feliz, nadie lo será", susurró.
      
      Usando sus conocimientos de cartógrafo, entregaba cartas por rutas nocturnas secretas que solo él conocía. Su cuaderno revelaba meses de planificación meticulosa.`,
      
      luna: `Luna Stern colapsó al ser confrontada. La pérdida de su prometido hace 5 años la consumió en amargura.
      
      "Todos fueron felices mientras yo sufría", admitió entre sollozos.
      
      Como florista, conocía los secretos del pueblo. Las flores que entregaba escondían cartas crueles. Su diario revelaba un plan para "hacer que otros sintieran su dolor".`,
      
      steven: `Steven Moss se derrumbó al ver la evidencia. Su acceso total a la biblioteca y los registros le dio poder sobre los secretos de todos.
      
      "Merecían saber la verdad sobre sí mismos", argumentó fríamente.
      
      Como bibliotecario, había leído confesiones privadas en libros prestados, cartas olvidadas en páginas. Usó ese conocimiento para destruir vidas con precisión quirúrgica.`
    };
    
    content.innerHTML = `
      <div class="ending-result">🎉</div>
      <h2 class="ending-title">¡Caso Resuelto!</h2>
      <div class="ending-story">
        <p><strong>Culpable: ${actualCulpritData.name}</strong></p>
        <p>${culpritStories[gameState.actualCulprit]}</p>
        <p class="highlight">Moonveil puede comenzar a sanar. ¡Excelente trabajo, detective!</p>
        ${reasons ? `<p style="margin-top:20px;padding:16px;background:rgba(48,209,88,.1);border-radius:8px;border:1px solid rgba(48,209,88,.2);"><strong>Tus razones:</strong><br>${reasons}</p>` : ''}
      </div>
      <div class="ending-stats">
        <div class="stat-box">
          <div class="stat-value">${gameState.day}</div>
          <div class="stat-label">Días</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${gameState.clues.length}</div>
          <div class="stat-label">Pistas</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${gameState.keys.length}</div>
          <div class="stat-label">Llaves</div>
        </div>
      </div>
      <div class="ending-actions">
        <button class="btn btn--primary" onclick="location.href='inicio.html'">
          <span class="btn-text">Volver al Portal</span>
        </button>
        <button class="btn btn--secondary" onclick="resetAndRestart()">
          <span class="btn-text">Jugar de Nuevo</span>
        </button>
      </div>
    `;
  } else {
    content.innerHTML = `
      <div class="ending-result">😢</div>
      <h2 class="ending-title">Caso Sin Resolver</h2>
      <div class="ending-story">
        <p><strong>Acusaste a: ${accused.name}</strong></p>
        <p>Desafortunadamente, ${accused.name} no era el culpable.</p>
        <p class="highlight">El verdadero culpable era: ${actualCulpritData.name}</p>
        <p>${actualCulpritData.profile.motivo}</p>
        <p>Las cartas continúan... Moonveil sigue sufriendo.</p>
        ${reasons ? `<p style="margin-top:20px;padding:16px;background:rgba(239,68,68,.1);border-radius:8px;border:1px solid rgba(239,68,68,.2);"><strong>Tus razones:</strong><br>${reasons}</p>` : ''}
      </div>
      <div class="ending-stats">
        <div class="stat-box">
          <div class="stat-value">${gameState.day}</div>
          <div class="stat-label">Días</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${gameState.clues.length}/30</div>
          <div class="stat-label">Pistas</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${Math.round(gameState.progress)}%</div>
          <div class="stat-label">Progreso</div>
        </div>
      </div>
      <div class="ending-actions">
        <button class="btn btn--primary" onclick="location.href='inicio.html'">
          <span class="btn-text">Volver</span>
        </button>
        <button class="btn btn--secondary" onclick="resetAndRestart()">
          <span class="btn-text">Intentar de Nuevo</span>
        </button>
      </div>
    `;
  }
  
  modal.classList.add('show');
  gameState.caseSolved = true;
  saveGame();
}

window.resetAndRestart = function() {
  localStorage.removeItem('moonveil_heartbreak_save_v4');
  location.reload();
};

// UTILITY FUNCTIONS
function addClue(clueText) {
  if (!gameState.clues.includes(clueText)) {
    gameState.clues.push(clueText);
    addNotebookEntry('📌 Pista', clueText);
    toast('📌 ¡Nueva pista!');
  }
}

function addToInventory(itemId, itemData = null) {
  if (gameState.inventory.find(i => i.id === itemId)) return;
  
  if (!itemData) {
    itemData = findItemInLocations(itemId);
  }
  
  const item = {
    id: itemId,
    name: itemData?.name || getItemName(itemId),
    icon: itemData?.icon || '📦',
    type: itemData?.type || 'evidence',
    content: itemData?.content,
    clue: itemData?.clue
  };
  
  gameState.inventory.push(item);
  renderInventory();
  saveGame();
}

function findItemInLocations(itemId) {
  for (const loc of locations) {
    for (const [areaId, area] of Object.entries(loc.areas)) {
      const item = area.items.find(i => i.id === itemId);
      if (item) return item;
    }
  }
  return null;
}

function addNotebookEntry(title, text) {
  gameState.notebook.push({
    day: gameState.day,
    title: title,
    text: text,
    time: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
  });
  renderNotebook();
  saveGame();
}

function renderNotebook() {
  const content = $('#notebookContent');
  if (!content) return;
  
  content.innerHTML = gameState.notebook.map(entry => `
    <div class="note-entry">
      <span class="note-time">Día ${entry.day} - ${entry.time}</span>
      <strong>${entry.title}</strong>
      <p>${entry.text}</p>
    </div>
  `).reverse().join('');
}

function renderInventory() {
  const grid = $('#inventoryGrid');
  if (!grid) return;
  
  if (gameState.inventory.length === 0) {
    grid.innerHTML = '<div class="empty-inventory"><span class="icon">📦</span><p>No tienes objetos</p></div>';
  } else {
    grid.innerHTML = gameState.inventory.map(item => `
      <div class="inv-item ${item.type}" data-item-id="${item.id}">
        <div class="icon">${item.icon}</div>
        <div class="name">${item.name}</div>
      </div>
    `).join('');
    
    $$('.inv-item', grid).forEach(el => {
      el.addEventListener('click', () => useItem(el.dataset.itemId));
    });
  }
}

function useItem(itemId) {
  const item = gameState.inventory.find(i => i.id === itemId);
  if (!item) return;
  
  const modal = $('#itemModal');
  $('#itemModalTitle').textContent = item.name;
  const body = $('#itemModalBody');
  
  if (item.type === 'letter') {
    body.innerHTML = `
      <div style="background:linear-gradient(135deg,#f5f5f0,#e8e8dc);color:#2d1810;padding:30px;border-radius:12px;font-family:Georgia,serif;box-shadow:0 8px 24px rgba(0,0,0,.2);">
        <h3 style="text-align:center;color:#8b4513;margin-bottom:20px;border-bottom:2px solid #8b4513;padding-bottom:10px;">${item.name}</h3>
        <p style="line-height:1.8;white-space:pre-wrap;">${item.content}</p>
        ${item.clue ? `<p style="font-style:italic;color:#6b4423;margin-top:20px;padding-top:20px;border-top:1px solid #d4b896;">💡 <strong>Pista:</strong> ${item.clue}</p>` : ''}
      </div>
    `;
  } else if (item.type === 'key') {
    body.innerHTML = `
      <div style="text-align:center;">
        <div style="font-size:6rem;margin:20px 0;animation:keyRotate 2s ease-in-out infinite;">${item.icon}</div>
        <h4 style="color:#fbbf24;margin-bottom:12px;">${item.name}</h4>
        <p style="background:rgba(255,196,61,.1);padding:16px;border-radius:8px;border:1px solid rgba(255,196,61,.3);"><strong>Desbloquea:</strong> ${getKeyName(item.id)}</p>
        ${item.clue ? `<p style="margin-top:16px;background:rgba(96,165,250,.1);padding:16px;border-radius:8px;border:1px solid rgba(96,165,250,.2);"><strong>Pista:</strong> ${item.clue}</p>` : ''}
      </div>
    `;
  } else {
    body.innerHTML = `
      <div style="text-align:center;">
        <div style="font-size:5rem;margin:20px 0;">${item.icon}</div>
        <h4 style="color:var(--heart);margin-bottom:12px;">${item.name}</h4>
        ${item.clue ? `<p style="background:rgba(96,165,250,.1);padding:16px;border-radius:8px;border:1px solid rgba(96,165,250,.2);"><strong>Pista:</strong> ${item.clue}</p>` : ''}
      </div>
    `;
  }
  
  modal.classList.add('show');
}

function renderProfiles() {
  const content = $('#profilesContent');
  if (!content) return;
  
  const unlockedSuspects = suspects.filter(s => s.unlocked || gameState.suspectProgress[s.id]?.talked);
  
  if (unlockedSuspects.length === 0) {
    content.innerHTML = '<p class="muted">Interroga a los sospechosos para desbloquear sus perfiles detallados.</p>';
  } else {
    content.innerHTML = unlockedSuspects.map(s => `
      <div class="profile-card">
        <h4>${s.profile.sospecha ? '🔍' : ''} ${s.name}</h4>
        <div class="profile-field"><strong>Correo:</strong> <span>${s.profile.correo}</span></div>
        <div class="profile-field"><strong>Profesión:</strong> <span>${s.profile.profesion}</span></div>
        ${s.profile.edad ? `<div class="profile-field"><strong>Edad:</strong> <span>${s.profile.edad}</span></div>` : ''}
        ${s.profile.sospecha ? `<div class="profile-field"><strong>Evaluación:</strong> <span style="color:var(--danger);">${s.profile.sospecha}</span></div>` : ''}
        ${s.profile.motivo ? `<div class="profile-field"><strong>Motivo:</strong> <span style="color:var(--warning);">${s.profile.motivo}</span></div>` : ''}
        ${s.profile.notas ? `<div class="profile-field"><strong>Notas:</strong> <span>${s.profile.notas}</span></div>` : ''}
      </div>
    `).join('');
  }
}

function updateHUD() {
  const totalClues = 30;
  const progress = Math.min(100, (gameState.clues.length / totalClues) * 100);
  gameState.progress = progress;
  
  $('.hud-bar.progress')?.style.setProperty('--v', progress);
  $('#progressPercent').textContent = Math.round(progress);
  
  $('.hud-bar.clues')?.style.setProperty('--v', (gameState.clues.length / totalClues) * 100);
  $('#clueCount').textContent = gameState.clues.length;
  
  $('#invCount').textContent = gameState.inventory.length;
  $('#keyCount').textContent = gameState.keys.length;
  $('#rewardCount').textContent = gameState.rewards.copper + gameState.rewards.emeralds;
  $('#caseTimer').textContent = `Día ${gameState.day}`;
}

function updateActiveSelection() {
  $$('.suspect-item, .location-item').forEach(item => item.classList.remove('active'));
  
  if (gameState.currentView === 'suspect') {
    $(`.suspect-item[data-id="${gameState.currentId}"]`)?.classList.add('active');
  } else if (gameState.currentView === 'location') {
    $(`.location-item[data-id="${gameState.currentId}"]`)?.classList.add('active');
  }
}

function unlockLocation(locationId) {
  if (!gameState.unlockedLocations.includes(locationId)) {
    gameState.unlockedLocations.push(locationId);
    const location = locations.find(l => l.id === locationId);
    
    if (location) {
      toast(`🗺️ Desbloqueaste: ${location.name}`);
      addNotebookEntry('Nueva Locación', `Desbloqueaste: ${location.name}`);
    }
    
    renderLocations();
    saveGame();
  }
}

function unlockSuspect(suspectId) {
  const suspect = suspects.find(s => s.id === suspectId);
  
  if (suspect && !suspect.unlocked) {
    suspect.unlocked = true;
    toast(`👤 Desbloqueaste: ${suspect.name}`);
    addNotebookEntry('Nuevo Sospechoso', `Desbloqueaste: ${suspect.name}`);
    renderSuspects();
    saveGame();
  }
}

function showReward(icon, text) {
  toast(`${icon} ${text}`);
}

function setupTabs() {
  $$('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      const parent = tab.closest('.panel');
      
      $$('.tab', parent).forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      $$('.tab-content', parent).forEach(content => {
        if (content.id === `${tabName}Tab`) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });
    });
  });
  
  $('#inventoryBtn')?.addEventListener('click', () => switchToTab('inventory'));
  $('#notebookBtn')?.addEventListener('click', () => switchToTab('notebook'));
  $('#rewardsBtn')?.addEventListener('click', () => {
    toast(`💰 ${gameState.rewards.copper} cobre, ${gameState.rewards.emeralds} esmeraldas`);
  });
}

function setupKeyButton() {
  $('#keysBtn')?.addEventListener('click', () => {
    if (gameState.keys.length === 0) {
      toast('🔑 No tienes llaves aún');
    } else {
      const keyList = gameState.keys.map(k => getKeyName(k)).join(', ');
      toast(`🔑 Llaves: ${keyList}`);
    }
  });
}

function switchToTab(tabName) {
  const panel = $('.panel--info');
  $$('.tab', panel).forEach(t => t.classList.remove('active'));
  $(`[data-tab="${tabName}"]`, panel)?.classList.add('active');
  
  $$('.tab-content', panel).forEach(c => c.classList.remove('active'));
  $(`#${tabName}Tab`).classList.add('active');
}

function setupModals() {
  $$('.modal-close').forEach(btn => btn.addEventListener('click', closeModals));
  $$('.modal__overlay').forEach(overlay => overlay.addEventListener('click', closeModals));
}

function closeModals() {
  $$('.modal').forEach(modal => modal.classList.remove('show'));
}

function setupSaveButton() {
  $('#btnSave')?.addEventListener('click', () => {
    saveGame();
    toast('💾 Juego guardado');
  });
}

function saveGame() {
  const saveData = {
    version: '4.0',
    timestamp: Date.now(),
    state: gameState
  };
  localStorage.setItem('moonveil_heartbreak_save_v4', JSON.stringify(saveData));
}

function loadGame() {
  const saved = localStorage.getItem('moonveil_heartbreak_save_v4');
  if (!saved) return null;
  
  try {
    const data = JSON.parse(saved);
    const daysPassed = (Date.now() - data.timestamp) / (1000 * 60 * 60 * 24);
    
    if (daysPassed > 30) {
      localStorage.removeItem('moonveil_heartbreak_save_v4');
      toast('⏰ Partida expiró (30 días)');
      return null;
    }
    
    Object.assign(gameState, data.state);
    return data;
  } catch (e) {
    console.error('Error cargando:', e);
    return null;
  }
}

function getStatusLabel(status, locked) {
  if (locked) return '🔒';
  
  const labels = {
    victim: 'Víctima',
    suspicious: 'Sospechoso',
    helpful: 'Colaborador',
    witness: 'Testigo'
  };
  
  return labels[status] || status;
}

function getItemName(itemId) {
  const names = {
    carta_sand: 'Carta de Sand',
    testimonio_david: 'Testimonio de David',
    registros_municipales: 'Registros Municipales',
    registros_orik: 'Registros de Orik',
    boligrafo: 'Bolígrafo',
    cuaderno_orik: 'Cuaderno de Orik',
    papel_fino: 'Papel Fino',
    mapa_roto: 'Mapa Roto',
    carta_antigua: 'Carta de Amor Antigua',
    diario_luna: 'Diario de Luna',
    llave_sotano: 'Llave del Sótano',
    llave_archivo: 'Llave del Archivo',
    llave_escondite: 'Llave del Escondite',
    llave_boveda: 'Llave de la Bóveda',
    llave_estudio: 'Llave del Estudio'
  };
  
  return names[itemId] || 'Objeto Misterioso';
}

function timeNow() {
  return new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._id);
  el._id = setTimeout(() => el.classList.remove('show'), 2500);
}

window.toggleMusic = function() {
  const audio = $('#bg-music');
  const btn = $('.floating-music');
  
  if (audio && btn) {
    if (audio.paused) {
      audio.play().then(() => {
        btn.style.background = 'linear-gradient(145deg,#00e676,#00c853)';
      }).catch(err => console.warn('Audio error:', err));
    } else {
      audio.pause();
      btn.style.background = 'linear-gradient(145deg,#ef4444,#dc2626)';
    }
  }
};

// INICIAR JUEGO
document.addEventListener('DOMContentLoaded', initGame);