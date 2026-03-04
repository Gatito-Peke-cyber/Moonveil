/* =========================================================
   Moonveil — Arena de Batalla · batt.js
   =========================================================

   ╔══════════════════════════════════════════════════╗
   ║  ZONA DE CONFIGURACIÓN — EDITA SOLO AQUÍ         ║
   ╚══════════════════════════════════════════════════╝

   ─── 1. INFO DEL TORNEO ─────────────────────────── */
const CFG = {
  nombre:  "Copa del Coliseo 2026",
  tamaño:  8,                        // 4, 8 o 16
  inicio:  "2026-03-01T18:00",       // "YYYY-MM-DDTHH:MM"  o null
  fin:     "2026-03-06T11:59",       // "YYYY-MM-DDTHH:MM"  o null
};

/* ─── 2. IMÁGENES DE FONDO DECORATIVAS ─────────────
   Pon la ruta de imágenes que quieras de fondo.
   Se verán difuminadas sin poder hacer clic.
   Ejemplo: "imgs/coliseo.jpg"
   Déjalas en "" si aún no tienes imágenes.            */
const BG_IMAGES = [
  { src: "", side: "left",  opacity: 0.10 },
  { src: "", side: "right", opacity: 0.10 },
];

/* ─── 3. JUGADORES ──────────────────────────────────
   name:   Nombre visible
   image:  Ruta a foto (o "" para usar emoji)
   seed:   1 = favorito · define emparejamientos
   puntos: Puntos de clasificación                     */
const JUGADORES = [
  { name: "Aurelius",   image: "img/foxanimated.jpg", seed: 1, puntos: 0 },
  { name: "Nero",    image: "img/loadingmine.gif", seed: 2, puntos: 0 },
  { name: "Rufus",   image: "img/dogphoto.jpg", seed: 3, puntos: 100 },
  { name: "Brutus",     image: "vill/parrot.gif", seed: 4, puntos: 0 },
  //{ name: "ThisMagician",    image: "vill/vill1.jpg", seed: 5, puntos: 0 },
  { name: "Flavius",    image: "img/allay.png", seed: 6, puntos: 0 },
  { name: "Gaticus",  image: "img/picture5.jpg", seed: 7, puntos: 200 },
  { name: "████",       image: "vill/vill1.jpg", seed: 8, puntos: 0 },
  { name: "Sand Brill?",       image: "vill/vill1.jpg", seed: 5, puntos: 0 },
  // Para torneo de 16 descomenta estas líneas:
  // { name: "Titus",    image: "", seed: 9,  puntos: 210 },
  // { name: "Caligula", image: "", seed: 10, puntos: 185 },
  // { name: "Claudius", image: "", seed: 11, puntos: 165 },
  // { name: "Valerius", image: "", seed: 12, puntos: 140 },
  // { name: "Gaius",    image: "", seed: 13, puntos: 120 },
  // { name: "Publius",  image: "", seed: 14, puntos: 100 },
  // { name: "Quintus",  image: "", seed: 15, puntos:  80 },
  // { name: "Rufus",    image: "", seed: 16, puntos:  60 },
];

/* ─── 4. RESULTADOS ─────────────────────────────────
   Para cada combate pon:
     true  → gana el jugador A (arriba / izquierda)
     false → gana el jugador B (abajo  / derecha)
     null  → pendiente, no jugado aún

   Los ganadores avanzan AUTOMÁTICAMENTE a la siguiente
   ronda con su nombre y foto.

   Emparejamientos de Ronda 1 (tamaño 8):
     R1-M1: seed 1 vs seed 8
     R1-M2: seed 2 vs seed 7
     R1-M3: seed 3 vs seed 6
     R1-M4: seed 4 vs seed 5                          */
const RESULTADOS = {
  // ── RONDA 1 ──────────────── A     vs    B
  "R1-M1": false,   // Aurelius   (#1)  vs  Nero       (#8)
  "R1-M2": false,   // Maximus    (#2)  vs  Spartacus  (#7)
  "R1-M3": true,   // Leonidas   (#3)  vs  Flavius    (#6)
  "R1-M4": true,   // Brutus     (#4)  vs  Cassius    (#5)

  // ── SEMIFINALES ──────────── (se llenan automáticamente)
  "R2-M1": false,
  "R2-M2": true,

  // ── GRAN FINAL ───────────── (se llena automáticamente)
  "R3-M1": true,
};

/* ─── 5. PREMIOS POR PUESTO ─────────────────────────
   Agrega o quita entradas libremente.                */
const PREMIOS = [
  {
    puesto: 1, clase: "oro", medalla: "🥇", titulo: "Campeón · VICTOR",
    items: [
      //{ icon: "👑", nombre: "Corona Imperial",       desc: "Casco Netherite · Prot.IV, Sin Romper III" },
      { icon: "🎆", nombre: "Puntos",    desc: "Se te otorga 200 puntos" },
      { icon: "🪙", nombre: "256 Monedas de Oro",    desc: "Riqueza del Coliseo" },
      { icon: "🎆", nombre: "64 Cohetes Nivel 3",    desc: "Celebración de victoria" },
      { icon: "⚔️", nombre: "Espada de Diamante",      desc: "..." },
      { icon: "⚔️", nombre: "Pico de Diamante",      desc: "SI!! minerales, eso creo..." },
      { icon: "⚔️", nombre: "Hacha de Diamante",      desc: "ok??----" },
      //{ icon: "🏆", nombre: "Título: Gladiator Rex", desc: "Rango exclusivo de campeón" },
    ]
  },
  {
    puesto: 2, clase: "plata", medalla: "🥈", titulo: "Subcampeón · SECUNDUS",
    items: [
      { icon: "🎆", nombre: "Puntos",    desc: "Se te otorga 100 puntos" },
      { icon: "⚔️", nombre: "Espada de Diamante",      desc: "Al final si era una espada..." },
      { icon: "🪙", nombre: "128 Monedas de Oro",    desc: "Premio del finalista" },
      //{ icon: "🧧", nombre: "3 Sobres Rojos",        desc: "Bonus festivo" },
    ]
  },
  {
    puesto: 3, clase: "bronce", medalla: "🥉", titulo: "Tercer Lugar · TERTIUS",
    items: [
      //{ icon: "🛡️", nombre: "Armadura Diamante",     desc: "Protección III completa" },
      { icon: "🎆", nombre: "Puntos",    desc: "Se te otorga 50 puntos" },
      { icon: "🪙", nombre: "64 Monedas de Oro",     desc: "Premio de bronce" },
    ]
  },
  {
    puesto: 4, clase: "normal", medalla: "🎖️", titulo: "Cuarto Lugar",
    items: [
      //{ icon: "🌿", nombre: "32 Bayas Luminosas",    desc: "Por tu esfuerzo en la arena" },
      { icon: "🎆", nombre: "Puntos",    desc: "Se te otorga 10 puntos" },
      { icon: "🪙", nombre: "32 Monedas de Oro",     desc: "Premio de consolación" },
    ]
  },
  {
    puesto: "5-8", clase: "normal", medalla: "⚜️", titulo: "Puestos 5–8",
    items: [
      //{ icon: "📜", nombre: "Cupón ×1 100%",         desc: "Válido en tienda del servidor" },
      //{ icon: "🌿", nombre: "16 Bayas Luminosas",    desc: "Por participar" },
      { icon: "🪙", nombre: "16 Monedas de Oro",     desc: "Premio de consolación" },
    ]
  },
];

/* ╔══════════════════════════════════════════════════╗
   ║  FIN DE CONFIGURACIÓN — no editar más abajo      ║
   ╚══════════════════════════════════════════════════╝ */
//"🗡","⚔","🛡","🏹","⚡","🔱","🪖","👊","🔥","💀","🌩","🦅","🏺","🧱","⚗","🔮"
const EMOJIS = [];

const $  = (s,c=document)=>c.querySelector(s);
const $$ = (s,c=document)=>[...c.querySelectorAll(s)];
const pad = n=>String(n).padStart(2,"0");

function toast(msg){
  const el=$("#toast"); if(!el) return;
  el.textContent=msg; el.classList.add("show");
  clearTimeout(el._t); el._t=setTimeout(()=>el.classList.remove("show"),3800);
}

/* ─── Emparejamientos por seed ─── */
function seedPairs(n){
  if(n===4)  return [[0,3],[1,2]];
  if(n===8)  return [[0,7],[1,6],[2,5],[3,4]];
  if(n===16) return [[0,15],[1,14],[2,13],[3,12],[4,11],[5,10],[6,9],[7,8]];
  return Array.from({length:n/2},(_,i)=>[i,n-1-i]);
}

/* ─── Estado ─── */
let T = { rounds:[], matches:{}, champion:null };
let modalMatchId = null;
let timerTick = null;

/* ─── Construir torneo ─── */
function buildTournament(){
  const size  = CFG.tamaño;
  const jugs  = [...JUGADORES].slice(0,size).sort((a,b)=>a.seed-b.seed);
  const pairs = seedPairs(size);
  const totalR= Math.log2(size);
  T = { rounds:[], matches:{}, champion:null };

  const r1ids=[];
  pairs.forEach(([ia,ib],mi)=>{
    const id=`R1-M${mi+1}`;
    T.matches[id]={
      id, round:1, matchNum:mi+1,
      a:{...jugs[ia], advanced:null, emoji:EMOJIS[ia]||"⚔"},
      b:{...jugs[ib], advanced:null, emoji:EMOJIS[ib]||"⚔"},
      resultado: RESULTADOS[id]??null,
    };
    r1ids.push(id);
  });
  T.rounds.push({label:"RONDA 1", ids:r1ids});

  let prev=size/2;
  for(let r=2;r<=totalR;r++){
    const ids=[],count=prev/2;
    const lbl = r===totalR?"GRAN FINAL":r===totalR-1?"SEMIFINALES":"CUARTOS DE FINAL";
    for(let m=1;m<=count;m++){
      const id=`R${r}-M${m}`;
      T.matches[id]={id,round:r,matchNum:m,a:null,b:null,resultado:RESULTADOS[id]??null};
      ids.push(id);
    }
    T.rounds.push({label:lbl,ids});
    prev=count;
  }

  T.rounds.forEach(rd=>rd.ids.forEach(id=>{ if(T.matches[id].resultado!==null) applyResult(id); }));
}

function applyResult(matchId){
  const m=T.matches[matchId];
  if(!m||m.resultado===null||!m.a||!m.b) return;
  const winA=m.resultado;
  m.a.advanced=winA; m.b.advanced=!winA;
  const winner=winA?m.a:m.b;
  const nid=nextMatch(matchId);
  if(nid){
    const slot=nextSlot(matchId), nxt=T.matches[nid], copy={...winner,advanced:null};
    if(slot===0) nxt.a=copy; else nxt.b=copy;
    if(nxt.resultado!==null&&nxt.a&&nxt.b) applyResult(nid);
  } else { T.champion={...winner}; }
}

function nextMatch(id){
  const[,r,m]=id.match(/R(\d+)-M(\d+)/);
  const nid=`R${+r+1}-M${Math.ceil(+m/2)}`;
  return T.matches[nid]?nid:null;
}
function nextSlot(id){
  const[,,m]=id.match(/R(\d+)-M(\d+)/);
  return(+m-1)%2;
}

/* ─── Render bracket ─── */
function renderBracket(){
  const cont=$("#bracketContainer"); if(!cont) return;
  cont.innerHTML="";

  T.rounds.forEach((rd,rIdx)=>{
    /* Espaciado vertical: cada ronda duplica el gap entre cards */
    const gapMultiplier = Math.pow(2,rIdx);

    const col=document.createElement("div");
    col.className="br-col";

    const lbl=document.createElement("div");
    lbl.className="br-col-label";
    lbl.textContent=rd.label;
    col.appendChild(lbl);

    const stack=document.createElement("div");
    stack.className="br-stack";
    /* Distribuir los matches verticalmente */
    stack.style.setProperty("--gap-mult", gapMultiplier);

    rd.ids.forEach((matchId,mIdx)=>{
      stack.appendChild(buildMatchCard(T.matches[matchId], rIdx, rd.ids.length, mIdx));
    });

    col.appendChild(stack);
    cont.appendChild(col);

    /* Flecha conectora entre rondas */
    if(rIdx<T.rounds.length-1){
      const arr=document.createElement("div");
      arr.className="br-arrow";
      arr.innerHTML=`<span class="arr-line"></span><span class="arr-head">›</span>`;
      cont.appendChild(arr);
    }
  });

  /* Podio */
  const cw=$("#championBlock");
  if(cw){ if(T.champion){ cw.classList.remove("hidden"); renderChampion(T.champion); } else cw.classList.add("hidden"); }
}

function buildMatchCard(m, rIdx, total, mIdx){
  const wrap=document.createElement("div");
  wrap.className="match-wrap";

  const ready=m.a&&m.b&&m.resultado===null;
  const done=m.resultado!==null;

  const card=document.createElement("div");
  card.className="match-card"+(ready?" card-ready":"")+(done?" card-done":"");
  card.dataset.matchId=m.id;

  /* Número */
  const numEl=document.createElement("div");
  numEl.className="match-label";
  numEl.textContent=`COMBATE ${(rIdx)*10+m.matchNum}`;
  card.appendChild(numEl);

  /* Jugador A */
  card.appendChild(buildSlot(m.a, true, m.resultado));
  /* Separador */
  const sep=document.createElement("div");
  sep.className="match-sep";
  sep.innerHTML=`<div class="sep-line"></div><span class="sep-vs">VS</span><div class="sep-line"></div>`;
  card.appendChild(sep);
  /* Jugador B */
  card.appendChild(buildSlot(m.b, false, m.resultado));

  if(ready){ card.addEventListener("click",()=>openModal(m.id)); card.title="Click para registrar resultado"; }

  wrap.appendChild(card);
  return wrap;
}

function buildSlot(f, isA, resultado){
  const slot=document.createElement("div");
  slot.className="player-slot";
  if(!f){ slot.classList.add("slot-tbd"); slot.innerHTML=`<div class="slot-av slot-av-empty">?</div><div class="slot-info"><span class="slot-name dim-txt">Por definir</span></div><span class="slot-icon"></span>`; return slot; }

  const won  = (isA && resultado===true) || (!isA && resultado===false);
  const lost = (isA && resultado===false)||(!isA && resultado===true);
  if(won)  slot.classList.add("slot-win");
  if(lost) slot.classList.add("slot-lose");

  const av=f.image?`<img class="slot-av" src="${f.image}" alt="${f.name}" onerror="this.style.display='none';this.insertAdjacentHTML('afterend','<div class=\\'slot-av slot-av-emoji\\'>${f.emoji||"⚔"}</div>')">`:`<div class="slot-av slot-av-emoji">${f.emoji||"⚔"}</div>`;
  const statusIcon=won?"✔":lost?"✗":"";

  slot.innerHTML=`${av}<div class="slot-info"><span class="slot-name">${f.name}</span><span class="slot-seed">#${f.seed}</span></div><span class="slot-icon${won?" icon-win":lost?" icon-lose":""}">${statusIcon}</span>`;
  return slot;
}

function renderChampion(c){
  const n=$("#champName"); if(n) n.textContent=c.name;
  const img=$("#champImg"),ph=$("#champPh");
  if(!img||!ph) return;
  if(c.image){ img.src=c.image; img.style.display="block"; ph.style.display="none"; }
  else { img.style.display="none"; ph.style.display="flex"; ph.textContent=c.emoji||"⚔"; }
}

/* ─── Modal ─── */
function openModal(matchId){
  const m=T.matches[matchId];
  if(!m||!m.a||!m.b||m.resultado!==null) return;
  modalMatchId=matchId;
  const rd=T.rounds[m.round-1];
  $("#mdSubtitle").textContent=`${rd?.label||""} · Combate ${m.matchNum}`;
  setMdFighter("A",m.a); setMdFighter("B",m.b);
  $("#battleModal").classList.add("open");
  document.body.style.overflow="hidden";
}
function setMdFighter(s,f){
  $(`#md${s}Name`).textContent=f.name;
  $(`#md${s}Seed`).textContent=`#${f.seed}`;
  const img=$(`#md${s}Img`),ph=$(`#md${s}Ph`);
  if(f.image){ img.src=f.image; img.style.display="block"; ph.style.display="none"; }
  else { img.style.display="none"; ph.style.display="flex"; ph.textContent=f.emoji||"⚔"; }
}
function closeModal(){ $("#battleModal").classList.remove("open"); document.body.style.overflow=""; modalMatchId=null; }

function declareWinner(winnerIsA){
  if(!modalMatchId) return;
  const m=T.matches[modalMatchId];
  m.resultado=winnerIsA;
  RESULTADOS[modalMatchId]=winnerIsA;
  closeModal();
  applyResult(modalMatchId);
  renderBracket();
  renderLeaderboard();
  const winner=winnerIsA?m.a:m.b, loser=winnerIsA?m.b:m.a;
  toast(`⚔ ${winner.name} VICTORIOSO · ${loser.name} eliminado`);
  if(T.champion) setTimeout(()=>toast(`👑 ¡${T.champion.name} es el CAMPEÓN!`),600);
  console.log(`%c[ARENA] ${modalMatchId}`,"color:#f59e0b;font-weight:bold",{ganador_es_A:winnerIsA,A_avanza:m.a.advanced,B_avanza:m.b.advanced,ganador:winner.name,eliminado:loser.name});
}

/* ─── Clasificación ─── */
function renderLeaderboard(){
  const tbody=$("#lbBody"); if(!tbody) return;
  const sorted=[...JUGADORES].sort((a,b)=>b.puntos-a.puntos);
  const max=sorted[0]?.puntos||1;
  tbody.innerHTML="";
  sorted.forEach((j,i)=>{
    const pos=i+1, medal=pos===1?"🥇":pos===2?"🥈":pos===3?"🥉":`${pos}`;
    const cls=pos===1?"lb-gold":pos===2?"lb-silver":pos===3?"lb-bronze":"";
    const av=j.image?`<img class="lb-av" src="${j.image}" alt="${j.name}" onerror="this.style.display='none';this.insertAdjacentHTML('afterend','<div class=\\'lb-av lb-av-emoji\\'>${EMOJIS[j.seed-1]||"⚔"}</div>')"`:`<div class="lb-av lb-av-emoji">${EMOJIS[j.seed-1]||"⚔"}</div>`;
    const tr=document.createElement("tr");
    tr.className=cls;
    tr.innerHTML=`<td class="lb-pos">${medal}</td><td class="lb-player">${av}<span class="lb-pname">${j.name}</span></td><td class="lb-pts">${j.puntos.toLocaleString()} <span class="lb-pts-lbl">pts</span></td><td class="lb-bar-td"><div class="lb-bar"><div class="lb-fill" style="width:${Math.round(j.puntos/max*100)}%"></div></div></td>`;
    tbody.appendChild(tr);
  });
}

/* ─── Premios ─── */
function renderPremios(){
  const g=$("#premiosGrid"); if(!g) return; g.innerHTML="";
  PREMIOS.forEach(p=>{
    const c=document.createElement("div");
    c.className=`premio-card premio-${p.clase}`;
    c.innerHTML=`<div class="pr-head"><span class="pr-medal">${p.medalla}</span><span class="pr-title">${p.titulo}</span></div><div class="pr-items">${p.items.map(it=>`<div class="pr-item"><span class="pr-icon">${it.icon}</span><div><strong>${it.nombre}</strong><small>${it.desc}</small></div></div>`).join("")}</div>`;
    g.appendChild(c);
  });
}

/* ─── Imágenes de fondo decorativas ─── */
function applyBgImages(){
  BG_IMAGES.forEach(bg=>{
    if(!bg.src) return;
    const d=document.createElement("div");
    d.className=`bg-img-deco`;
    Object.assign(d.style,{
      position:"fixed", top:"0", [bg.side]:"0",
      width:"20%", height:"100%",
      backgroundImage:`url('${bg.src}')`,
      backgroundSize:"cover", backgroundPosition:"center",
      opacity:bg.opacity,
      pointerEvents:"none",
      zIndex:"-1",
      WebkitMaskImage:`linear-gradient(to ${bg.side==="left"?"right":"left"},rgba(0,0,0,0.85),transparent)`,
      maskImage:`linear-gradient(to ${bg.side==="left"?"right":"left"},rgba(0,0,0,0.85),transparent)`,
      userSelect:"none",
    });
    document.body.appendChild(d);
  });
}

/* ─── Timer ─── */
function startTimer(){
  const s=CFG.inicio?new Date(CFG.inicio):null, e=CFG.fin?new Date(CFG.fin):null;
  const wrap=$("#timerWrap");
  if(!s&&!e){ if(wrap) wrap.style.display="none"; return; }
  if(wrap) wrap.style.display="";
  const ds=$("#tcStart"),de=$("#tcEnd");
  if(ds&&s) ds.textContent=s.toLocaleDateString("es-ES",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
  if(de&&e) de.textContent=e.toLocaleDateString("es-ES",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
  if(timerTick) clearInterval(timerTick);
  function tick(){
    const now=new Date(); let target,status;
    if(s&&now<s){ target=s; status="⚔ COMIENZA EN"; }
    else if(e&&now<e){ target=e; status="🔥 EN PROGRESO"; }
    else { ["tD","tH","tM","tS"].forEach(i=>$(`#${i}`).textContent="00"); $("#tcStatus").textContent="🏆 FINALIZADO"; clearInterval(timerTick); return; }
    const d=Math.max(0,target-now);
    $("#tD").textContent=pad(Math.floor(d/86400000));
    $("#tH").textContent=pad(Math.floor(d%86400000/3600000));
    $("#tM").textContent=pad(Math.floor(d%3600000/60000));
    $("#tS").textContent=pad(Math.floor(d%60000/1000));
    $("#tcStatus").textContent=status;
  }
  tick(); timerTick=setInterval(tick,1000);
}

/* ─── Partículas ─── */
(function particles(){
  const c=$("#bgParticles"); if(!c) return;
  const ctx=c.getContext("2d"), dpi=Math.max(1,devicePixelRatio||1);
  let w,h,ps;
  const init=()=>{ w=c.width=innerWidth*dpi; h=c.height=innerHeight*dpi; ps=Array.from({length:55},()=>({ x:Math.random()*w,y:Math.random()*h,r:(0.4+Math.random()*1.6)*dpi,s:0.06+Math.random()*0.35,a:0.03+Math.random()*0.12,hue:Math.random()<0.6?355+Math.random()*15:38+Math.random()*12,dx:(Math.random()-0.5)*0.2 })); };
  const tick=()=>{ ctx.clearRect(0,0,w,h); ps.forEach(p=>{ p.y-=p.s*0.2;p.x+=p.dx; if(p.y<-4){p.y=h+4;p.x=Math.random()*w;} if(p.x<0||p.x>w)p.dx*=-1; ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=`hsla(${p.hue},88%,62%,${p.a})`;ctx.fill(); }); requestAnimationFrame(tick); };
  init(); tick(); addEventListener("resize",init);
})();

/* ─── Navbar ─── */
(function nav(){
  const t=$("#navToggle"),l=$("#navLinks");
  t?.addEventListener("click",e=>{ e.stopPropagation(); l.classList.toggle("open"); });
  document.addEventListener("click",e=>{ if(!t?.contains(e.target)&&!l?.contains(e.target)) l?.classList.remove("open"); });
})();

/* ─── Tabs ─── */
function initTabs(){
  $$(".tab-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{
      $$(".tab-btn").forEach(b=>b.classList.remove("active"));
      $$(".tab-panel").forEach(p=>p.classList.remove("active"));
      btn.classList.add("active");
      const panel=$("#panel-"+btn.dataset.tab);
      if(panel) panel.classList.add("active");
    });
  });
}

/* ─── INIT ─── */
document.addEventListener("DOMContentLoaded",()=>{
  $$(".cfg-nombre").forEach(el=>el.textContent=CFG.nombre);
  buildTournament();
  renderBracket();
  renderLeaderboard();
  renderPremios();
  startTimer();
  initTabs();
  applyBgImages();

  $("#mdClose")?.addEventListener("click",closeModal);
  $("#mdOverlay")?.addEventListener("click",closeModal);
  $("#btnWinA")?.addEventListener("click",()=>declareWinner(true));
  $("#btnWinB")?.addEventListener("click",()=>declareWinner(false));

  toast(`🏛 ${CFG.nombre} · ${CFG.tamaño} gladiadores listos`);
});

window.arenaState=()=>{
  const rows={};
  Object.entries(T.matches).forEach(([id,m])=>{
    rows[id]={A:m.a?.name||"TBD",B:m.b?.name||"TBD","true=GanaA":m.resultado,"A_avanza":m.a?.advanced??null,"B_avanza":m.b?.advanced??null};
  });
  console.table(rows); return rows;
};