/**
 * Moonveil - Biblioteca de Historias
 * Dashboard profesional de historias interactivas
 */

// =================== CONFIGURACIÓN ===================
const CONFIG = {
    STORAGE_KEY: 'moonveil_historia_v2',
    DEFAULT_IMAGE: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=250&fit=crop'
};

// =================== ESTADO ===================
const STATE = {
    unlocked: new Set(),
    currentStory: null,
    currentPage: 0,
    isMusicPlaying: false,
    isMuted: false,
    filters: {
        category: 'all',
        rarity: 'all',
        search: ''
    }
};

// =================== DATOS ===================
const STORIES = [
    {
        id: 'leyenda-1',
        title: 'Crónicas del Bosque Esmeralda',
        category: 'Leyendas',
        rarity: 'common',
        //locked: false,
        locked: true,
        password: 'leyendas2025',
        music: '',
        pages: [
            { 
                type: 'text', 
                content: `<div class="page-header">
                    <h3>Capítulo I: El Bosque Despierta</h3>
                    <p class="subtitle">"Donde los árboles guardan secretos milenarios"</p>
                </div>
                <div class="page-content">
                    <p>Bajo la luz pálida del amanecer, el Bosque Esmeralda comenzaba a despertar. Los primeros rayos de sol filtraban a través del denso follaje, creando patrones de luz y sombra que parecían danzar sobre el musgo milenario.</p>
                    <p>Los habitantes más antiguos del lugar, los árboles centenarios, guardaban en sus anillos historias olvidadas por el tiempo. Cada grieta en su corteza era una línea más en el relato del mundo.</p>
                    <div class="quote">
                        "Cuando el viento sopla desde el norte, los árboles susurran nombres olvidados"
                    </div>
                </div>`
            },
            { 
                type: 'image', 
                content: {
                    img: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&h=500&fit=crop',
                    caption: 'Sendero del Bosque Esmeralda al amanecer'
                }
            },
            {
                type: 'text',
                content: `<div class="page-header">
                    <h3>Los Guardianes Silenciosos</h3>
                </div>
                <div class="page-content">
                    <p>Según las leyendas, los primeros habitantes del bosque no fueron humanos, sino espíritus de la naturaleza que tomaron forma de árbol para proteger la tierra.</p>
                    <p>Los aldeanos cuentan que en las noches de luna llena, estos guardianes caminan entre sus copas, vigilando que ningún mal profane su santuario.</p>
                    <ul class="story-list">
                        <li><strong>El Roble Anciano:</strong> Guardián de la sabiduría</li>
                        <li><strong>El Sauce Llorón:</strong> Custodio de los secretos</li>
                        <li><strong>El Abeto Gigante:</strong> Vigía de las fronteras</li>
                    </ul>
                </div>`
            }
        ]
    },

    {
        id: 'leyenda-2',
        title: 'Sand Brill: El Juramento Verde',
        category: 'Crónicas',
        rarity: 'legend',
        locked: true,
        password: 'esmeraldas',
        music: 'ald/music1.mp3',
        pages: [
            {
                type: 'text',
                content: `<div class="page-header">
                    <h3>Prólogo: El Brillo que Llama</h3>
                    <p class="subtitle">"No toda riqueza pesa en los bolsillos; algunas pesan en el alma"</p>
                </div>
                <div class="page-content">
                    <p>Mucho antes de que su nombre fuera susurrado con respeto —o con temor—, Sand Brill ya caminaba con los ojos fijos en un solo color: el verde profundo de las esmeraldas.</p>
                    <p>No era simple avaricia. Para él, cada esmeralda era una promesa, un fragmento del mundo que podía ser poseído, contado y protegido… siempre que estuviera en sus manos.</p>
                    <div class="quote">
                        "El oro se gasta, el hierro se oxida, pero la esmeralda recuerda a quién pertenece."
                    </div>
                </div>`
            },
            {
                type: 'text',
                content: `<div class="page-header">
                    <h3>Capítulo I: El Comerciante que Nunca Perdía</h3>
                    <p class="subtitle">"Donde otros negocian, Sand Brill calcula"</p>
                </div>
                <div class="page-content">
                    <p>En los caminos polvorientos entre aldeas, Sand Brill se hizo conocido como un comerciante impecable. Nunca levantaba la voz, nunca sonreía de más, y jamás aceptaba un trato que no lo beneficiara.</p>
                    <p>Los aldeanos decían que podía oler una esmeralda incluso antes de que apareciera en la mesa de intercambio. Sus ojos brillaban con una intensidad inquietante cuando el trato incluía gemas.</p>
                    <ul class="story-list">
                        <li><strong>Regla uno:</strong> Nunca cambiar una esmeralda por promesas.</li>
                        <li><strong>Regla dos:</strong> Contar las esmeraldas dos veces.</li>
                        <li><strong>Regla tres:</strong> No confiar en quien regala lo verde.</li>
                    </ul>
                </div>`
            },
            {
                type: 'text',
                content: `<div class="page-header">
                    <h3>Capítulo II: La Cámara Bajo la Arena</h3>
                    <p class="subtitle">"Donde la codicia se convierte en arquitectura"</p>
                </div>
                <div class="page-content">
                    <p>Bajo una extensión de arena que nadie sospechaba, Sand Brill construyó su mayor secreto: una cámara subterránea iluminada únicamente por el reflejo de cientos de esmeraldas.</p>
                    <p>No era un tesoro para presumir, sino para contemplar en silencio. Allí bajaba solo, contando una por una, asegurándose de que ninguna lo hubiera abandonado.</p>
                    <div class="quote">
                        "Mientras estén aquí, el mundo sigue en orden."
                    </div>
                </div>`
            },
            {
                type: 'text',
                content: `<div class="page-header">
                    <h3>Capítulo III: El Precio de Perder una</h3>
                    <p class="subtitle">"Una ausencia más ruidosa que un cofre lleno"</p>
                </div>
                <div class="page-content">
                    <p>La noche en que faltó una esmeralda, Sand Brill no durmió. Revisó cofres, contó sombras, midió distancias. Nada faltaba… excepto ella.</p>
                    <p>Desde ese día, su carácter se volvió más frío, más exacto. Los tratos se endurecieron y su mirada dejó de tolerar errores.</p>
                    <p>No buscaba al ladrón. Buscaba restaurar el equilibrio.</p>
                </div>`
            },
            {
                type: 'text',
                content: `<div class="page-header">
                    <h3>Capítulo IV: El Nombre que se Convirtió en Leyenda</h3>
                    <p class="subtitle">"Entre comerciantes y viajeros"</p>
                </div>
                <div class="page-content">
                    <p>Con el tiempo, su nombre dejó de ser solo el de un comerciante. Sand Brill se convirtió en advertencia.</p>
                    <p>Los viajeros decían: <em>“Si negocias con Sand Brill, saldrás con menos palabras y más cuidado.”</em></p>
                    <p>Pero también sabían algo más: ninguna esmeralda confiada a él se perdía jamás.</p>
                </div>`
            },
            {
                type: 'text',
                content: `<div class="page-header">
                    <h3>Epílogo: El Juramento Verde</h3>
                    <p class="subtitle">"La codicia, cuando se ordena, se convierte en legado"</p>
                </div>
                <div class="page-content">
                    <p>Sand Brill no se consideraba avaro. Se veía a sí mismo como un guardián. Un contador del equilibrio del mundo, medido en esmeraldas.</p>
                    <p>Y mientras el verde siga brillando bajo la arena, su juramento permanece intacto.</p>
                    <div class="quote">
                        "No poseo las esmeraldas. Ellas me permiten vigilarlas."
                    </div>
                </div>`
            },
            { 
                type: 'image', 
                content: {
                    img: 'vill/vill1.jpg',
                    caption: 'Sendero del Bosque Esmeralda al amanecer'
                }
            },
            
        ]
    },



    {
    id: 'leyenda-3',
    title: 'Evil Never Dies',
    category: 'Historia',
    rarity: 'dex',
    locked: true,
    password: 'Sue Tingey',
    music: 'ald/music2.mp3',
    pages: [
        { 
            type: 'text', 
            content: `<div class="page-header">
                <h3>Prólogo: El Eco del Mal</h3>
                <p class="subtitle">"Algunas sombras nunca desaparecen, solo esperan"</p>
            </div>
            <div class="page-content">
                <p>La lluvia golpeaba los cristales de la antigua mansión Blackwood como dedos esqueléticos buscando entrada. En la biblioteca, las llamas de la chimenea proyectaban sombras danzantes sobre retratos cuyos ojos parecían seguir cada movimiento.</p>
                <p>Lucius Blackwood sabía que la noche del equinoccio había llegado. Setenta años exactos desde el último ritual, desde el último sacrificio que mantuvo a raya a la entidad.</p>
                <div class="quote">
                    "El mal no muere, solo se transforma, se esconde, y espera su momento"
                </div>
            </div>`
        },
        { 
            type: 'image', 
            content: {
                img: 'https://images.unsplash.com/photo-1705247492538-bcef75c74f68?q=80&w=1172&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                caption: 'Mansión Blackwood durante la tormenta del equinoccio'
            }
        },
        {
            type: 'text',
            content: `<div class="page-header">
                <h3>Capítulo I: La Herencia Maldita</h3>
            </div>
            <div class="page-content">
                <p>Cassandra Blackwood no quería regresar. Diez años habían pasado desde la muerte de su abuelo, pero la herencia obligaba a todos los descendientes a presentarse cada década.</p>
                <p>El testamento era claro: ausentarse significaba renunciar a la fortuna familiar. Pero Cassandra sospechaba que había algo más, algo que su abuelo siempre llamaba "el deber familiar".</p>
                <ul class="story-list">
                    <li><strong>Lucius Blackwood:</strong> Patriarca, guardián del secreto</li>
                    <li><strong>Cassandra:</strong> La nieta escéptica</li>
                    <li><strong>Marcus:</strong> Primo ambicioso</li>
                    <li><strong>Eleanor:</strong> Tía espiritualista</li>
                </ul>
            </div>`
        },
        {
            type: 'image',
            content: {
                img: 'https://images.unsplash.com/photo-1657266111971-8f479e69c00f?q=80&w=688&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                caption: 'El salón principal de Blackwood con los retratos familiares'
            }
        },
        {
            type: 'text',
            content: `<div class="page-header">
                <h3>Capítulo II: El Sótano Prohibido</h3>
            </div>
            <div class="page-content">
                <p>La llave de hierro pesaba más de lo normal en la mano de Lucius. Tres cerraduras protegían la puerta del sótano, cada una correspondiente a un siglo de secretos.</p>
                <p>"Lo que hay abajo nos mantiene a salvo", había dicho su padre. "Pero también nos mantiene prisioneros".</p>
                <p>Cuando la tercera cerradura cedió, un aire helado escapó, llevando consigo el olor a tierra húmeda y algo más antiguo, algo innombrable.</p>
            </div>`
        },
        {
            type: 'text',
            content: `<div class="page-header">
                <h3>Capítulo III: Los Símbolos Olvidados</h3>
            </div>
            <div class="page-content">
                <p>Cassandra encontró el diario de su bisabuela escondido detrás de un ladrillo suelto en la biblioteca. Las páginas amarillentas mostraban diagramas complejos y símbolos que hacían arder sus ojos.</p>
                <div class="quote">
                    "No son decoraciones, son cadenas. Cada símbolo en esta casa es un eslabón que mantiene atrapada a la bestia"
                </div>
                <p>Los dibujos mostraban patrones geométricos repetidos en cada habitación, formando una red de contención alrededor de algo en el centro de la casa.</p>
            </div>`
        },
        {
            type: 'image',
            content: {
                img: 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=800&h=500&fit=crop',
                caption: 'Páginas del diario con símbolos de contención'
            }
        },
        {
            type: 'text',
            content: `<div class="page-header">
                <h3>Capítulo IV: La Primera Desaparición</h3>
            </div>
            <div class="page-content">
                <p>Marcus fue el primero. Argumentó que necesitaba aire fresco después de la tensa cena familiar. Nunca regresó.</p>
                <p>La búsqueda reveló solo sus huellas que terminaban abruptamente en el borde del jardín, como si se hubiera evaporado. Pero en el aire quedaba su aroma a terror, tangible como la niebla.</p>
                <p>Lucius no pareció sorprendido. "Comienza", susurró, observando cómo los símbolos en las paredes comenzaban a brillar débilmente.</p>
            </div>`
        },
        {
            type: 'text',
            content: `<div class="page-header">
                <h3>Capítulo V: Los Susurros en las Paredes</h3>
            </div>
            <div class="page-content">
                <p>La primera noche después de la desaparición, los susurros comenzaron. No venían de un lugar específico, sino de todas partes a la vez.</p>
                <p>Cassandra los oyó en su habitación: promesas de poder, ofertas de conocimiento prohibido, voces que conocían sus secretos más profundos.</p>
                <div class="quote">
                    "Nos conoce, Cassie. Sabe lo que temes, lo que deseas. No puedes esconderte de lo que ya vive dentro de ti"
                </div>
            </div>`
        },
        {
            type: 'image',
            content: {
                img: 'https://images.unsplash.com/photo-1599281874238-0c30e1034fb2?q=80&w=740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                caption: 'El pasillo principal donde comenzaron los susurros'
            }
        },
        {
            type: 'text',
            content: `<div class="page-header">
                <h3>Capítulo VI: El Verdadero Contrato</h3>
            </div>
            <div class="page-content">
                <p>En el archivo familiar, Cassandra encontró el pergamino. No era un testamento, sino un contrato firmado en 1723 por Alistair Blackwood.</p>
                <p>El texto, escrito en una mezcla de latín y algo más antiguo, establecía que cada generación debía ofrecer un miembro de la familia a cambio de prosperidad eterna.</p>
                <p>La firma no estaba hecha con tinta, sino con algo oscuro y seco que Cassandra reconoció con horror: sangre.</p>
            </div>`
        },
        {
            type: 'text',
            content: `<div class="page-header">
                <h3>Capítulo VII: El Espejo que Recuerda</h3>
            </div>
            <div class="page-content">
                <p>El espejo del vestíbulo principal no mostraba reflejos normales. En su superficie aparecían momentos del pasado: los anteriores rituales, los sacrificios, las caras de terror de sus ancestros.</p>
                <p>Eleanor, la tía espiritualista, se quedó horas observando. "No son fantasmas", explicó. "Es la casa recordando. El dolor queda impregnado en las paredes, en los muebles, en el aire mismo".</p>
            </div>`
        },
        {
            type: 'image',
            content: {
                img: 'https://images.unsplash.com/photo-1677052523944-b0fac5730646?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                caption: 'El espejo del vestíbulo mostrando escenas del pasado'
            }
        },
        {
            type: 'text',
            content: `<div class="page-header">
                <h3>Capítulo VIII: El Diario de Alistair</h3>
            </div>
            <div class="page-content">
                <p>El diario del fundador contaba la verdadera historia. Alistair Blackwood no había construido la mansión, la había descubierto.</p>
                <p>"Este lugar ya era antiguo cuando llegué", escribió. "Las piedras susurraban en una lengua muerta. La entidad que habita aquí me ofreció riqueza a cambio de... mantenimiento periódico".</p>
                <p>Las últimas páginas mostraban su arrepentimiento demasiado tarde, cuando ya había comprometido a su descendencia por siglos.</p>
            </div>`
        },
        {
            type: 'text',
            content: `<div class="page-header">
                <h3>Capítulo IX: El Ritual de Contención</h3>
            </div>
            <div class="page-content">
                <p>Lucius preparó los elementos: velas negras, sal de minas olvidadas, hierbas cosechadas en luna menguante.</p>
                <p>"No podemos destruirlo", explicó a Cassandra. "Nuestros ancestros intentaron y solo lo hicieron más fuerte. Solo podemos contenerlo, alimentarlo con lo mínimo para que permanezca dormido".</p>
                <p>Pero Cassandra notó que faltaba un ingrediente en la lista, uno que Lucius evitaba mencionar.</p>
            </div>`
        },
        {
            type: 'image',
            content: {
                img: 'https://images.unsplash.com/photo-1513366208864-87536b8bd7b4?w=800&h=500&fit=crop',
                caption: 'Elementos del ritual de contención preparados en la biblioteca'
            }
        },
        {
            type: 'text',
            content: `<div class="page-header">
                <h3>Capítulo X: El Ingrediente Final</h3>
            </div>
            <div class="page-content">
                <p>Cassandra confrontó a Lucius en la biblioteca. "¿Qué falta en la lista, abuelo?"</p>
                <p>El anciano evitó su mirada. "Sangre. Sangre familiar. Es lo que mantiene el contrato activo, lo que renueva las cadenas".</p>
                <p>"¿Cuánta sangre?"</p>
                <p>El silencio fue respuesta suficiente. No era una gota, ni un vial. Era una vida entera cada generación.</p>
            </div>`
        },
        {
            type: 'text',
            content: `<div class="page-header">
                <h3>Capítulo XI: Eleanor Confiesa</h3>
            </div>
            <div class="page-content">
                <p>La tía Eleanor reunió a los pocos que quedaban en la sala de música. "He estado investigando alternativas por años", dijo, extendiendo manuscritos robados de bibliotecas prohibidas.</p>
                <p>"Hay una manera de revertir el contrato, pero requiere que la entidad nombre su verdadero nombre. Y para eso, debe manifestarse completamente".</p>
                <div class="quote">
                    "Es jugar con fuego, pero el fuego puede purificar tanto como destruir"
                </div>
            </div>`
        },
        {
            type: 'image',
            content: {
                img: 'https://images.unsplash.com/photo-1605815665303-5e20b63ed0ef?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                caption: 'Manuscritos con rituales de reversión encontrados por Eleanor'
            }
        },
        {
            type: 'text',
            content: `<div class="page-header">
                <h3>Capítulo XII: El Verdadero Propósito de Marcus</h3>
            </div>
            <div class="page-content">
                <p>En la habitación de Marcus, Cassandra encontró notas que revelaban su verdadero plan. No había venido por la herencia, sino para liberar a la entidad.</p>
                <p>"Con su poder, seré inmortal", escribió. "Los Blackwood han sido carceleros por siglos. Yo seré su amo".</p>
                <p>Pero las últimas notas mostraban pánico. Había subestimado lo que pretendía controlar.</p>
            </div>`
        },
        {
            type: 'text',
            content: `<div class="page-header">
                <h3>Capítulo XIII: La Manifestación</h3>
            </div>
            <div class="page-content">
                <p>Los símbolos en las paredes comenzaron a sangrar. Primero gotas, luego chorros que escribían mensajes en lenguas olvidadas.</p>
                <p>La temperatura descendió bruscamente. El aliento se condensaba en el aire, formando patrones que repetían una palabra: "Libertad".</p>
                <p>En el centro del salón, las sombras se espesaron, tomando una forma que la mente humana apenas podía procesar.</p>
            </div>`
        },
        {
            type: 'image',
            content: {
                img: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=500&fit=crop',
                caption: 'Los símbolos sangrantes en las paredes del salón'
            }
        },
        {
            type: 'text',
            content: `<div class="page-header">
                <h3>Capítulo XIV: El Nombre Prohibido</h3>
            </div>
            <div class="page-content">
                <p>Eleanor comenzó el canto de invocación, su voz temblorosa pero firme. Las palabras hacían vibrar los cristales y retorcer los muebles.</p>
                <p>La entidad respondió con un sonido que no era sonido, una presión en la mente que amenazaba con reventar cráneos.</p>
                <p>Y entonces, por primera vez en siglos, pronunció su nombre. No con sonidos, sino con imágenes, con memorias robadas, con los sueños más oscuros de cada Blackwood vivo.</p>
            </div>`
        },
        {
            type: 'text',
            content: `<div class="page-header">
                <h3>Capítulo XV: La Trampa de Lucius</h3>
            </div>
            <div class="page-content">
                <p>Lucius reveló su verdadero plan. "Eleanor tenía razón sobre el nombre, pero se equivocaba en el método", dijo mientras dibujaba rápidamente símbolos con su propia sangre.</p>
                <p>"No vamos a destruirlo. Vamos a transferir el contrato. De nuestra familia... a otra".</p>
                <p>Cassandra miró los símbolos y comprendió con horror. No eran de transferencia, sino de copia. El mal no se iba, se duplicaba.</p>
            </div>`
        },
        {
            type: 'image',
            content: {
                img: 'https://images.unsplash.com/photo-1531315630201-bb15abeb1653?w=800&h=500&fit=crop',
                caption: 'Lucius completando los símbolos de transferencia'
            }
        },
        {
            type: 'text',
            content: `<div class="page-header">
                <h3>Capítulo XVI: Cassandra Toma una Decisión</h3>
            </div>
            <div class="page-content">
                <p>Observando a su abuelo traicionar siglos de deber familiar, Cassandra comprendió la verdadera naturaleza del mal.</p>
                <p>No era la entidad en el sótano. Era la cobardía, la ambición, la disposición a sacrificar a otros por seguridad propia.</p>
                <p>Tomó el diario de Alistair y encontró la página que Lucius había arrancado: el ritual de auto-sacrificio que terminaba el contrato para siempre... matando a todos los Blackwood vivos.</p>
            </div>`
        },
        {
            type: 'text',
            content: `<div class="page-header">
                <h3>Capítulo XVII: El Ritual de Fin</h3>
            </div>
            <div class="page-content">
                <p>Mientras Lucius y la entidad forcejeaban en una danza de poder, Cassandra comenzó su propio ritual.</p>
                <p>No usó hierbas ni velas. Usó la verdad. Leyó en voz alta cada traición, cada sacrificio, cada acto de cobardía cometido por sus ancestros.</p>
                <p>Con cada confesión, los símbolos en las paredes se debilitaban. La entidad gritaba, no de ira, sino de miedo. Por primera vez, algo la estaba lastimando realmente.</p>
            </div>`
        },
        {
            type: 'image',
            content: {
                img: 'https://images.unsplash.com/photo-1667303280424-db2f6c99a591?q=80&w=1178&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                caption: 'Cassandra realizando el ritual de verdad'
            }
        },
        {
            type: 'text',
            content: `<div class="page-header">
                <h3>Capítulo XVIII: La Debilidad del Mal</h3>
            </div>
            <div class="page-content">
                <p>Eleanor comprendió primero. "¡El mal se alimenta de secretos! De mentiras aceptadas, de verdades ocultas!".</p>
                <p>Corrió hacia Cassandra y se unió a la confesión. Contó sus propias traiciones, sus envidias, los pequeños males cotidianos que todos cometemos.</p>
                <p>La entidad retrocedió, encogiéndose. La luz que emitía Cassandra no era mágica, era simplemente honestidad, y eso era lo único que no podía tolerar.</p>
            </div>`
        },
        {
            type: 'text',
            content: `<div class="page-header">
                <h3>Capítulo XIX: Lucius se Enfrenta a su Legado</h3>
            </div>
            <div class="page-content">
                <p>El patriarca cayó de rodillas, no por la entidad, sino por el peso de sus decisiones. "Creí que estaba protegiéndonos", sollozó.</p>
                <p>"Protegías tu miedo", respondió Cassandra sin juzgar. "Y el miedo siempre elige mal".</p>
                <p>Lucius miró a la entidad, ahora reducida a un susurro, y comprendió que él había sido su mejor aliado durante décadas.</p>
            </div>`
        },
        {
            type: 'image',
            content: {
                img: 'https://images.unsplash.com/photo-1513366208864-87536b8bd7b4?w=800&h=500&fit=crop',
                caption: 'Lucius confrontando sus decisiones pasadas'
            }
        },
        {
            type: 'text',
            content: `<div class="page-header">
                <h3>Capítulo XX: El Verdadero Sacrificio</h3>
            </div>
            <div class="page-content">
                <p>Cassandra tomó la decisión final. No sacrificaría a su familia, ni siquiera a Lucius. En cambio, ofreció lo único que tenía que la entidad realmente quería.</p>
                <p>"Toma mi capacidad de olvidar", dijo. "Toma mi habilidad para ignorar el dolor ajeno. Toma mi indiferencia".</p>
                <p>No era sangre lo que ofrecía, sino su humanidad. Y la entidad, que se alimentaba de la inhumanidad, no pudo aceptar sin negar su propia naturaleza.</p>
            </div>`
        },
        {
            type: 'text',
            content: `<div class="page-header">
                <h3>Capítulo XXI: La Paradoja Final</h3>
            </div>
            <div class="page-content">
                <p>Atrapada en la paradoja, la entidad comenzó a desvanecerse. No podía tomar lo ofrecido sin dejar de ser lo que era.</p>
                <p>Pero en su lugar, dejó una advertencia: "Soy solo una forma. El verdadero mal son las decisiones que justificáis. Mientras exista el miedo, existiré".</p>
                <div class="quote">
                    "El mal nunca muere porque nunca vivió. Solo somos nosotros, eligiendo ver monstruos en lugar de espejos"
                </div>
            </div>`
        },
        {
            type: 'image',
            content: {
                img: 'https://images.unsplash.com/photo-1491319669671-30014eb16b8d?q=80&w=1059&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                caption: 'La disolución de la entidad en el salón principal'
            }
        },
        {
            type: 'text',
            content: `<div class="page-header">
                <h3>Capítulo XXII: El Amanecer Después</h3>
            </div>
            <div class="page-content">
                <p>El sol amaneció sobre Blackwood por primera vez sin la niebla perpetua. Los símbolos en las paredes se habían convertido en simples patrones decorativos.</p>
                <p>Marcus apareció en el jardín, desorientado pero vivo. La entidad lo había mantenido en un estado de suspensión, alimentándose de su ambición.</p>
                <p>La familia se reunió en el salón, no por obligación, sino por elección. Tenían décadas de conversaciones pendientes.</p>
            </div>`
        },
        {
            type: 'text',
            content: `<div class="page-header">
                <h3>Capítulo XXIII: La Nueva Misión</h3>
            </div>
            <div class="page-content">
                <p>Cassandra no destruyó los diarios ni los manuscritos. Los organizó en la biblioteca, creando el "Archivo Blackwood de Decisiones Éticas".</p>
                <p>"Nuestra familia fue prisionera del miedo durante siglos", anunció. "Ahora seremos estudiantes de la valentía. No perfectos, pero conscientes".</p>
                <p>La mansión se convirtió en un centro de estudio, abierto a quienes buscaban entender cómo el mío corrompe las mejores intenciones.</p>
            </div>`
        },
        {
            type: 'image',
            content: {
                img: 'https://images.unsplash.com/photo-1641565187914-363ce21932a3?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                caption: 'La biblioteca reorganizada como Archivo de Decisiones Éticas'
            }
        },
        {
            type: 'text',
            content: `<div class="page-header">
                <h3>Capítulo XXIV: Lucius Encuentra Redención</h3>
            </div>
            <div class="page-content">
                <p>El antiguo patriarca dedicó sus años restantes a documentar cada error, cada justificación, cada momento en que eligió el miedo sobre la compasión.</p>
                <p>"Mi legado no será de protección", escribió en su nuevo diario. "Será de advertencia. El mal no comienza con rituales o sacrificios. Comienza con 'es por su bien'. Comienza con 'no hay otra opción'".</p>
                <p>Murió en paz, no porque hubiera sido perdonado, sino porque había aprendido a perdonarse lo suficiente para cambiar.</p>
            </div>`
        },
        {
            type: 'text',
            content: `<div class="page-header">
                <h3>Capítulo XXV: Eleanor Descubre su Poder</h3>
            </div>
            <div class="page-content">
                <p>La tía espiritualista descubrió que su verdadero don no era contactar espíritus, sino reconocer el dolor humano.</p>
                <p>Comenzó a trabajar con familias disfuncionales, usando las lecciones de Blackwood para ayudarles a romper ciclos de abuso mucho más comunes pero igualmente dañinos.</p>
                <div class="quote">
                    "Los fantasmas en las paredes dan miedo, pero los fantasmas en nuestras costumbres son los que realmente nos poseen"
                </div>
            </div>`
        },
        {
            type: 'image',
            content: {
                img: 'https://images.unsplash.com/photo-1531315630201-bb15abeb1653?w=800&h=500&fit=crop',
                caption: 'Eleanor trabajando con familias en el salón renovado'
            }
        },
        {
            type: 'text',
            content: `<div class="page-header">
                <h3>Capítulo XXVI: Marcus Reconstruye</h3>
            </div>
            <div class="page-content">
                <p>El primo ambicioso pasó meses recuperándose. La entidad había mostrado su futuro si obtenía el poder: solo, paranoico, destruyendo todo lo que amaba por miedo a perderlo.</p>
                <p>Usó sus habilidades empresariales no para acumular riqueza, sino para crear fundaciones que ayudaran a otros a reconocer cuándo la ambición se convertía en avaricia.</p>
                <p>"Casi me convierto en lo que temía", admitió en sus charlas. "Y eso es lo más aterrador: que el remedio se convierta en la enfermedad".</p>
            </div>`
        },
        {
            type: 'text',
            content: `<div class="page-header">
                <h3>Capítulo XXVII: La Biblioteca Viviente</h3>
            </div>
            <div class="page-content">
                <p>Cassandra transformó la mansión en una institución única. Cada habitación contaba una parte de la historia familiar, no para horrorizar, sino para educar.</p>
                <p>Visitantes venían de todo el mundo, no por morbo, sino para estudiar cómo familias normales pueden caer en dinámicas destructivas.</p>
                <ul class="story-list">
                    <li><strong>Sala de las Justificaciones:</strong> Donde cada excusa estaba documentada</li>
                    <li><strong>Galería de las Consecuencias:</strong> Efectos de decisiones egoístas</li>
                    <li><strong>Ala de la Recuperación:</strong> Historias de cambio y redención</li>
                </ul>
            </div>`
        },
        {
            type: 'image',
            content: {
                img: 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=800&h=500&fit=crop',
                caption: 'La Sala de las Justificaciones en la biblioteca viviente'
            }
        },
        {
            type: 'text',
            content: `<div class="page-header">
                <h3>Capítulo XXVIII: Los Nuevos Símbolos</h3>
            </div>
            <div class="page-content">
                <p>En lugar de borrar los símbolos de contención, Cassandra los modificó. Con ayuda de artistas y terapeutas, los transformó en representaciones de conceptos positivos.</p>
                <p>Donde antes había runas de miedo, ahora había patrones que representaban empatía. Donde había círculos de contención, ahora había espirales de crecimiento.</p>
                <p>La casa misma se curó, no exorcizando fantasmas, sino transformando su energía.</p>
            </div>`
        },
        {
            type: 'text',
            content: `<div class="page-header">
                <h3>Capítulo XXIX: La Noche del Equinoccio, Diez Años Después</h3>
            </div>
            <div class="page-content">
                <p>La familia se reunió nuevamente, pero esta vez no por obligación. Vinieron con sus propias familias, con amigos, con personas cuyas vidas habían tocado positivamente.</p>
                <p>En el jardín, donde Marcus desapareció, ahora crecía un árbol plantado el día de su retorno. Sus raíces eran profundas, sus ramas fuertes.</p>
                <p>Cassandra miró alrededor y sintió algo nuevo: no seguridad, sino aceptación. El mal nunca moriría completamente, pero el bien tampoco.</p>
            </div>`
        },
        {
            type: 'image',
            content: {
                img: 'https://images.unsplash.com/photo-1559464002-71620a2fd907?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                caption: 'La reunión familiar en el equinoccio diez años después'
            }
        },
        {
            type: 'text',
            content: `<div class="page-header">
                <h3>Capítulo XXX: El Último Diario</h3>
            </div>
            <div class="page-content">
                <p>Cassandra escribió la última entrada en lo que sería el diario final de los Blackwood.</p>
                <p>"Hoy comprendí la verdadera profecía. 'Evil Never Dies' no era una amenaza, era una advertencia. Y también una esperanza".</p>
                <div class="quote">
                    "Si el mal nunca muere, significa que siempre tenemos oportunidades de enfrentarlo. Si nunca desaparece, nunca podemos decir 'es demasiado tarde'. Cada momento es una elección, y en cada elección hay una posibilidad de luz"
                </div>
                <p>Cerrando el diario, supo que la historia continuaría, pero ya no como una maldición, sino como una lección, una herramienta, un faro.</p>
            </div>`
        },
        {
            type: 'text',
            content: `<div class="page-header">
                <h3>Epílogo: Las Sombras que Quedan</h3>
                <p class="subtitle">"La luz no elimina las sombras, solo nos permite verlas claramente"</p>
            </div>
            <div class="page-content">
                <p>A veces, en los rincones más oscuros de Blackwood, aún se siente un frío inexplicable. A veces, los susurros regresan, pero ahora dicen cosas diferentes.</p>
                <p>Dicen: "Recuerda". Dicen: "Elige". Dicen: "Ama a pesar del miedo".</p>
                <p>Cassandra ya vieja, camina por los pasillos sintiendo no terror, sino gratitud. Las sombras siguen allí, pero ahora son maestras, no amas.</p>
                <p>El mal nunca muere. Pero tampoco muere la capacidad de elegir diferente. Y en ese equilibrio, en esa batalla eterna, reside todo lo que significa ser humano.</p>
                <div class="quote-final">
                </div>
            </div>`
        },
        {
            type: 'image',
            content: {
                img: 'https://images.unsplash.com/photo-1546616781-c198c4859ee7?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                caption: 'Mansión Blackwood bajo la luz del atardecer, transformada pero aún misteriosa'
            }
        }
    ]
},

    {
        id: 'historia-1',
        title: 'El Herrero Olvidado',
        category: 'Historias',
        rarity: 'rare',
        //locked: false,
        locked: true,
        password: 'herrero2020',
        music: '',
        pages: [
            {
                type: 'text',
                content: `<div class="page-header">
                    <h3>El Yunque del Destino</h3>
                    <p class="subtitle">"Donde el metal canta bajo el martillo"</p>
                </div>
                <div class="page-content">
                    <p>En lo más profundo de las Montañas Humeantes, donde el eco del martillo nunca cesa, trabajaba Ragnar el Herrero. Sus manos, curtidas por el fuego y el metal, habían forjado más que armas: habían dado forma a destinos.</p>
                    <p>La forja de Ragnar era única. No utilizaba carbón común, sino brasas de corazón de dragón, lo que otorgaba a sus creaciones propiedades extraordinarias.</p>
                </div>`
            },
            {
                type: 'image',
                content: {
                    img: 'img/villagerstar.jpg',
                    caption: 'Forja ancestral en las Montañas Humeantes'
                }
            }
        ]
    },
    {
        id: 'codex-1',
        title: 'Codex de la Luna Plateada',
        category: 'Codex',
        rarity: 'legend',
        locked: true,
        password: 'luna2025',
        music: '',
        pages: [
            {
                type: 'text',
                content: `<div class="page-header">
                    <h3>Prólogo: Las Runas Lunares</h3>
                    <p class="subtitle">"Manuscrito sellado por la Orden de los Vigilantes Nocturnos"</p>
                </div>
                <div class="page-content">
                    <p>Este códice contiene conocimientos prohibidos sobre la influencia lunar en la magia arcana. Escrito en plata líquida sobre pergamino de piel de fénix, cada página emite un tenue brillo azulado durante las noches de luna llena.</p>
                    <div class="warning">
                        ⚠️ <strong>ADVERTENCIA:</strong> Este conocimiento está reservado para iniciados. Su mal uso puede tener consecuencias catastróficas.
                    </div>
                </div>`
            },
            {
                type: 'image',
                content: {
                    img: 'https://images.unsplash.com/photo-1531315630201-bb15abeb1653?w=800&h=500&fit=crop',
                    caption: 'Página iluminada del Codex Lunar'
                }
            }
        ]
    },
    {
        id: 'dex-1',
        title: 'Manual DEX: Teoría Cromática',
        category: 'Dex',
        rarity: 'dex',
        //locked: false,
        locked: true,
        password: 'Dex2025',
        music: '',
        pages: [
            {
                type: 'text',
                content: `<div class="page-header">
                    <h3>Introducción a la Magia Cromática</h3>
                    <p class="subtitle">"Cuando los colores dejan de ser luz y se convierten en poder"</p>
                </div>
                <div class="page-content">
                    <p>La magia cromática opera bajo el principio de que cada color del espectro contiene una energía única que puede ser manipulada por aquellos con la sensibilidad adecuada.</p>
                    <div class="color-grid">
                        <div class="color-item" style="background: #ef4444;">
                            <span>Rojo - Fuerza</span>
                        </div>
                        <div class="color-item" style="background: #3b82f6;">
                            <span>Azul - Sabiduría</span>
                        </div>
                        <div class="color-item" style="background: #10b981;">
                            <span>Verde - Naturaleza</span>
                        </div>
                        <div class="color-item" style="background: #f59e0b;">
                            <span>Ámbar - Creatividad</span>
                        </div>
                    </div>
                </div>`
            }
        ]
    }
];

// =================== UTILIDADES ===================
const DOM = {
    get: (selector) => document.querySelector(selector),
    getAll: (selector) => document.querySelectorAll(selector),
    create: (tag, classes = '', content = '') => {
        const el = document.createElement(tag);
        if (classes) el.className = classes;
        if (content) el.innerHTML = content;
        return el;
    }
};

// =================== GESTIÓN DE ESTADO ===================
function loadState() {
    try {
        const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (saved) {
            const data = JSON.parse(saved);
            STATE.unlocked = new Set(data.unlocked || []);
            STATE.isMuted = data.isMuted || false;
        }
    } catch (error) {
        console.warn('Error cargando estado:', error);
    }
}

function saveState() {
    const data = {
        unlocked: Array.from(STATE.unlocked),
        isMuted: STATE.isMuted,
        lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
}

// =================== INTERFAZ - DASHBOARD ===================
function renderDashboard() {
    renderFilters();
    renderStats();
    renderStoriesGrid();
    setupEventListeners();
}

function renderFilters() {
    const container = DOM.get('#categoryChips');
    if (!container) return;

    // Categorías
    const categories = ['Todas', ...new Set(STORIES.map(s => s.category))];
    container.innerHTML = '';
    
    categories.forEach(category => {
        const button = DOM.create('button', 'chip', category);
        button.dataset.category = category === 'Todas' ? 'all' : category;
        
        if ((category === 'Todas' && STATE.filters.category === 'all') || 
            category === STATE.filters.category) {
            button.classList.add('active');
        }
        
        container.appendChild(button);
    });
}

function renderStats() {
    const unlockedCount = STORIES.filter(s => STATE.unlocked.has(s.id) || !s.locked).length;
    const totalCount = STORIES.length;
    
    const stats = DOM.get('#unlockedCount');
    if (stats) {
        stats.textContent = `${unlockedCount}/${totalCount}`;
    }
    
    const year = DOM.get('#y');
    if (year) {
        year.textContent = new Date().getFullYear();
    }
}

function renderStoriesGrid() {
    const grid = DOM.get('#storiesGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    const filteredStories = filterStories();
    
    if (filteredStories.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📚</div>
                <h3>No se encontraron historias</h3>
                <p class="muted">Intenta cambiar los filtros o la búsqueda</p>
            </div>
        `;
        return;
    }
    
    filteredStories.forEach(story => {
        const storyCard = createStoryCard(story);
        grid.appendChild(storyCard);
    });
}

function filterStories() {
    return STORIES.filter(story => {
        // Filtrar por categoría
        if (STATE.filters.category !== 'all' && story.category !== STATE.filters.category) {
            return false;
        }
        
        // Filtrar por rareza
        if (STATE.filters.rarity !== 'all' && story.rarity !== STATE.filters.rarity) {
            return false;
        }
        
        // Filtrar por búsqueda
        if (STATE.filters.search) {
            const searchTerm = STATE.filters.search.toLowerCase();
            const inTitle = story.title.toLowerCase().includes(searchTerm);
            const inCategory = story.category.toLowerCase().includes(searchTerm);
            const inContent = story.pages.some(page => 
                page.type === 'text' && 
                page.content.toLowerCase().includes(searchTerm)
            );
            
            if (!inTitle && !inCategory && !inContent) {
                return false;
            }
        }
        
        return true;
    });
}

function createStoryCard(story) {
    const isUnlocked = STATE.unlocked.has(story.id) || !story.locked;
    const isLocked = story.locked && !isUnlocked;
    
    const card = DOM.create('article', 'story-card');
    if (isLocked) card.classList.add('locked');
    
    const previewImg = story.pages.find(p => p.type === 'image')?.content?.img || CONFIG.DEFAULT_IMAGE;
    
    card.innerHTML = `
        <div class="card-header">
            <div class="rarity-badge ${story.rarity}">
                ${getRarityLabel(story.rarity)}
            </div>
            ${isLocked ? '<div class="lock-badge">🔒</div>' : ''}
        </div>
        <div class="card-image">
            <img src="${previewImg}" alt="${story.title}" loading="lazy">
            <div class="card-overlay">
                <span class="category-tag">${story.category}</span>
            </div>
        </div>
        <div class="card-content">
            <h3 class="card-title">${story.title}</h3>
            <p class="card-description">${getStoryPreview(story)}</p>
            <div class="card-stats">
                <span class="stat"><i>📖</i> ${story.pages.length} páginas</span>
                ${story.music ? '<span class="stat"><i>🎵</i> Audio</span>' : ''}
            </div>
        </div>
        <div class="card-actions">
            <button class="btn btn-primary" data-action="read" data-id="${story.id}">
                ${isLocked ? '🔓 Desbloquear' : '📖 Leer'}
            </button>
            <button class="btn btn-ghost" data-action="info" data-id="${story.id}">
                ℹ️ Info
            </button>
        </div>
    `;
    
    return card;
}

function getStoryPreview(story) {
    const textContent = story.pages.find(p => p.type === 'text')?.content || '';
    const plainText = textContent.replace(/<[^>]+>/g, '');
    return plainText.substring(0, 120) + '...';
}

function getRarityLabel(rarity) {
    const labels = {
        common: 'Común',
        rare: 'Rara',
        special: 'Especial',
        epic: 'Épica',
        mythic: 'Mítica',
        legend: 'Legendaria',
        dex: 'DEX'
    };
    return labels[rarity] || rarity;
}

// =================== LECTOR DE HISTORIAS ===================
function openStory(storyId) {
    const story = STORIES.find(s => s.id === storyId);
    if (!story) {
        showToast('Historia no encontrada', 'error');
        return;
    }
    
    // Verificar si está bloqueada
    if (story.locked && !STATE.unlocked.has(storyId)) {
        showUnlockModal(story);
        return;
    }
    
    STATE.currentStory = story;
    STATE.currentPage = 0;
    
    showStoryModal();
    renderStoryPages();
    playStoryAudio(story);
}

function showStoryModal() {
    const modal = DOM.get('#storyModal');
    if (!modal) return;
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Configurar teclado
    document.addEventListener('keydown', handleStoryKeyboard);
}

function hideStoryModal() {
    const modal = DOM.get('#storyModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    document.body.style.overflow = '';
    stopStoryAudio();
    document.removeEventListener('keydown', handleStoryKeyboard);
    
    STATE.currentStory = null;
    STATE.currentPage = 0;
}

function renderStoryPages() {
    if (!STATE.currentStory) return;
    
    const story = STATE.currentStory;
    const title = DOM.get('#storyTitle');
    const meta = DOM.get('#storyMeta');
    const pageIndex = DOM.get('#currentPage');
    const totalPages = DOM.get('#totalPages');
    const leftPage = DOM.get('#leftPage');
    const rightPage = DOM.get('#rightPage');
    
    if (title) title.textContent = story.title;
    if (meta) meta.textContent = `${getRarityLabel(story.rarity)} • ${story.category}`;
    if (pageIndex) pageIndex.textContent = STATE.currentPage + 1;
    if (totalPages) totalPages.textContent = story.pages.length;
    
    // Renderizar páginas
    const leftContent = story.pages[STATE.currentPage];
    const rightContent = story.pages[STATE.currentPage + 1];
    
    if (leftPage) leftPage.innerHTML = renderPageContent(leftContent);
    if (rightPage) rightPage.innerHTML = renderPageContent(rightContent);
}

function renderPageContent(page) {
    if (!page) {
        return '<div class="page-empty"><p>Fin del capítulo</p></div>';
    }
    
    switch (page.type) {
        case 'text':
            return `<div class="page-text">${page.content}</div>`;
        
        case 'image':
            return `
                <div class="page-image">
                    <img src="${page.content.img}" alt="${page.content.caption || ''}">
                    ${page.content.caption ? `<p class="image-caption">${page.content.caption}</p>` : ''}
                </div>
            `;
            
        default:
            return `<div class="page-text">${page.content || ''}</div>`;
    }
}

function nextPage() {
    if (!STATE.currentStory || STATE.currentPage + 2 >= STATE.currentStory.pages.length) {
        showToast('Fin de la historia', 'info');
        return;
    }
    
    STATE.currentPage += 2;
    renderStoryPages();
}

function prevPage() {
    if (STATE.currentPage <= 0) {
        showToast('Inicio de la historia', 'info');
        return;
    }
    
    STATE.currentPage = Math.max(0, STATE.currentPage - 2);
    renderStoryPages();
}

function handleStoryKeyboard(event) {
    switch (event.key) {
        case 'ArrowRight':
            nextPage();
            break;
        case 'ArrowLeft':
            prevPage();
            break;
        case 'Escape':
            hideStoryModal();
            break;
    }
}

// =================== SISTEMA DE DESBLOQUEO ===================
let pendingUnlockStory = null;

function showUnlockModal(story) {
    pendingUnlockStory = story;
    
    const modal = DOM.get('#unlockModal');
    if (!modal) return;
    
    const title = modal.querySelector('.unlock-title');
    const hint = modal.querySelector('.unlock-hint');
    const input = modal.querySelector('#unlockPassword');
    
    if (title) title.textContent = story.title;
    if (hint) hint.textContent = story.password ? 'Requiere contraseña' : '¿Desbloquear esta historia?';
    if (input) {
        input.value = '';
        input.focus();
    }
    
    modal.style.display = 'block';
}

function hideUnlockModal() {
    const modal = DOM.get('#unlockModal');
    if (modal) {
        modal.style.display = 'none';
    }
    pendingUnlockStory = null;
}

function attemptUnlock(password) {
    if (!pendingUnlockStory) return;
    
    const story = pendingUnlockStory;
    
    // Verificar contraseña (si existe)
    if (story.password && password !== story.password) {
        showToast('Contraseña incorrecta', 'error');
        return;
    }
    
    // Desbloquear
    STATE.unlocked.add(story.id);
    saveState();
    
    hideUnlockModal();
    showToast('¡Historia desbloqueada!', 'success');
    
    // Actualizar interfaz
    renderStats();
    renderStoriesGrid();
    
    // Abrir la historia
    setTimeout(() => openStory(story.id), 500);
}

// =================== AUDIO ===================
function playStoryAudio(story) {
    if (!story.music) return;
    
    const audio = DOM.get('#storyAudio');
    if (!audio) return;
    
    audio.src = story.music;
    audio.volume = STATE.isMuted ? 0 : 0.6;
    audio.loop = true;
    
    audio.play().catch(error => {
        console.log('Audio requiere interacción del usuario');
    });
}

function stopStoryAudio() {
    const audio = DOM.get('#storyAudio');
    if (audio) {
        audio.pause();
        audio.currentTime = 0;
    }
}

function toggleAudio() {
    const audio = DOM.get('#storyAudio');
    if (!audio) return;
    
    if (audio.paused) {
        audio.play();
        showToast('Música activada', 'info');
    } else {
        audio.pause();
        showToast('Música pausada', 'info');
    }
}

function toggleMute() {
    STATE.isMuted = !STATE.isMuted;
    
    const audio = DOM.get('#storyAudio');
    if (audio) {
        audio.muted = STATE.isMuted;
        audio.volume = STATE.isMuted ? 0 : 0.6;
    }
    
    const muteBtn = DOM.get('#muteBtn');
    if (muteBtn) {
        muteBtn.textContent = STATE.isMuted ? '🔊 Activar sonido' : '🔇 Silenciar';
    }
    
    showToast(STATE.isMuted ? 'Sonido silenciado' : 'Sonido activado', 'info');
    saveState();
}

// =================== NOTIFICACIONES ===================
function showToast(message, type = 'info') {
    // Crear toast si no existe
    let toastContainer = DOM.get('#toastContainer');
    if (!toastContainer) {
        toastContainer = DOM.create('div', 'toast-container');
        document.body.appendChild(toastContainer);
    }
    
    const toast = DOM.create('div', `toast toast-${type}`);
    toast.innerHTML = `
        <span class="toast-icon">${getToastIcon(type)}</span>
        <span class="toast-message">${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Mostrar
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function getToastIcon(type) {
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    return icons[type] || 'ℹ️';
}

// =================== EVENT LISTENERS ===================
function setupEventListeners() {
    // Delegación de eventos para las cards
    document.addEventListener('click', handleCardClick);
    
    // Filtros
    setupFilterListeners();
    
    // Controles del modal de historia
    setupStoryControls();
    
    // Sistema de desbloqueo
    setupUnlockListeners();
    
    // Controles de audio
    setupAudioControls();
    
    // Exportar/Importar
    setupExportImport();
}

function handleCardClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    
    const action = button.dataset.action;
    const storyId = button.dataset.id;
    
    switch (action) {
        case 'read':
            openStory(storyId);
            break;
        case 'info':
            showStoryInfo(storyId);
            break;
    }
}

function setupFilterListeners() {
    // Categorías
    const categoryChips = DOM.get('#categoryChips');
    if (categoryChips) {
        categoryChips.addEventListener('click', (event) => {
            const chip = event.target.closest('.chip');
            if (!chip || !chip.dataset.category) return;
            
            // Actualizar filtro
            STATE.filters.category = chip.dataset.category;
            
            // Actualizar chips activos
            DOM.getAll('#categoryChips .chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            
            // Renderizar
            renderStoriesGrid();
        });
    }
    
    // Rarezas
    const rarityChips = DOM.get('#rarityChips');
    if (rarityChips) {
        rarityChips.addEventListener('click', (event) => {
            const chip = event.target.closest('.chip');
            if (!chip || !chip.dataset.rarity) return;
            
            STATE.filters.rarity = chip.dataset.rarity;
            
            DOM.getAll('#rarityChips .chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            
            renderStoriesGrid();
        });
    }
    
    // Búsqueda
    const searchInput = DOM.get('#searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (event) => {
            STATE.filters.search = event.target.value;
            renderStoriesGrid();
        });
    }
}

function setupStoryControls() {
    // Cerrar modal
    const closeBtn = DOM.get('#closeStory');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideStoryModal);
    }
    
    // Navegación
    const nextBtn = DOM.get('#nextPage');
    if (nextBtn) {
        nextBtn.addEventListener('click', nextPage);
    }
    
    const prevBtn = DOM.get('#prevPage');
    if (prevBtn) {
        prevBtn.addEventListener('click', prevPage);
    }
}

function setupUnlockListeners() {
    // Botón de desbloquear
    const unlockBtn = DOM.get('#unlockSubmit');
    if (unlockBtn) {
        unlockBtn.addEventListener('click', () => {
            const input = DOM.get('#unlockPassword');
            attemptUnlock(input ? input.value : '');
        });
    }
    
    // Cancelar
    const cancelBtn = DOM.get('#unlockCancel');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideUnlockModal);
    }
    
    // Enter para enviar
    const passwordInput = DOM.get('#unlockPassword');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                attemptUnlock(passwordInput.value);
            }
        });
    }
}

function setupAudioControls() {
    const toggleBtn = DOM.get('#toggleAudio');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleAudio);
    }
    
    const muteBtn = DOM.get('#muteBtn');
    if (muteBtn) {
        muteBtn.addEventListener('click', toggleMute);
        // Actualizar texto inicial
        muteBtn.textContent = STATE.isMuted ? '🔊 Activar sonido' : '🔇 Silenciar';
    }
}

function setupExportImport() {
    const exportBtn = DOM.get('#exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportProgress);
    }
    
    const importBtn = DOM.get('#importBtn');
    if (importBtn) {
        importBtn.addEventListener('click', () => {
            const fileInput = DOM.get('#importFile');
            if (fileInput) fileInput.click();
        });
    }
    
    const fileInput = DOM.get('#importFile');
    if (fileInput) {
        fileInput.addEventListener('change', importProgress);
    }
}

function exportProgress() {
    const data = {
        unlocked: Array.from(STATE.unlocked),
        exportedAt: new Date().toISOString(),
        totalStories: STORIES.length
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moonveil-progress-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Progreso exportado', 'success');
}

function importProgress(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.unlocked && Array.isArray(data.unlocked)) {
                STATE.unlocked = new Set(data.unlocked);
                saveState();
                renderStats();
                renderStoriesGrid();
                showToast('Progreso importado', 'success');
            } else {
                showToast('Archivo inválido', 'error');
            }
        } catch (error) {
            showToast('Error al importar', 'error');
        }
    };
    reader.readAsText(file);
}

function showStoryInfo(storyId) {
    const story = STORIES.find(s => s.id === storyId);
    if (!story) return;
    
    const isUnlocked = STATE.unlocked.has(storyId) || !story.locked;
    
    showToast(`
        <strong>${story.title}</strong><br>
        <small>Categoría: ${story.category} | Rareza: ${getRarityLabel(story.rarity)}</small><br>
        <small>Estado: ${isUnlocked ? '🔓 Desbloqueada' : '🔒 Bloqueada'}</small>
    `, 'info');
}

// =================== INICIALIZACIÓN ===================
function initialize() {
    console.log('🔄 Inicializando Moonveil Stories...');
    
    // Cargar estado
    loadState();
    
    // Renderizar dashboard
    renderDashboard();
    
    console.log('✅ Moonveil Stories listo');
}

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}

// Manejo de errores
window.addEventListener('error', (event) => {
    console.error('Error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Promesa rechazada:', event.reason);
});