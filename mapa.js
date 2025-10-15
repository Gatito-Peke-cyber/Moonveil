/* =========================================================
   Moonveil Portal — MAPA (JS)
   Aviso: Este render es una aproximación client-side que
   utiliza ruido (Simplex/Perlin-like) y reglas deterministas
   basadas en la semilla 3903589. No intenta replicar con
   exactitud el worldgen oficial de Bedrock; está pensado
   para ofrecer una vista estilizada coherente (biomas,
   estructuras probables, cuadrícula por chunk, etc.).
   ========================================================= */

const $ = (q, ctx = document) => ctx.querySelector(q);
const $$ = (q, ctx = document) => Array.from(ctx.querySelectorAll(q));

/* ---------- Navbar responsive + Año ---------- */
const navToggle = $('#navToggle');
const navLinks = $('#navLinks');
navToggle?.addEventListener('click', ()=> navLinks.classList.toggle('open'));
$('#y').textContent = new Date().getFullYear();

/* ---------- HUD bars ---------- */
(function setHudBars(){
  $$('.hud-bar').forEach(b=>{
    const v = +b.dataset.val || 50;
    b.style.setProperty('--v', v);
  });
})();

/* ---------- Partículas de fondo ---------- */
(function particles(){
  const c = $('#bgParticles'); if(!c) return;
  const ctx = c.getContext('2d'); const dpi = Math.max(1, devicePixelRatio||1);
  let w,h,parts;
  const init = ()=>{ w=c.width=innerWidth*dpi; h=c.height=innerHeight*dpi;
    parts = new Array(90).fill(0).map(()=>({x:Math.random()*w,y:Math.random()*h,r:1+Math.random()*2*dpi,s:.25+Math.random()*1.1,a:.15+Math.random()*.35}));
  };
  const tick = ()=>{
    ctx.clearRect(0,0,w,h);
    for(const p of parts){ p.y+=p.s; p.x+=Math.sin(p.y*0.002)*0.35;
      if(p.y>h){p.y=-10; p.x=Math.random()*w;}
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fillStyle=`rgba(135,243,157,${p.a})`; ctx.fill();
    }
    requestAnimationFrame(tick);
  };
  init(); tick(); addEventListener('resize', init);
})();

/* ---------- Parallax ---------- */
(function parallax(){
  const layers = $$('.layer'); if(!layers.length) return;
  const k=[0,0.03,0.06,0.1];
  const onScroll = ()=>{ const y=scrollY||0; layers.forEach((el,i)=> el.style.transform=`translateY(${y*k[i]}px)`); };
  onScroll(); addEventListener('scroll', onScroll, {passive:true});
})();

/* =========================================================
   CONFIGURACIÓN DEL MAPA
   ========================================================= */
const SEED = 3903589; // 👈 Semilla solicitada
$('#seedLabel').textContent = String(SEED);

const MAP = {
  tile: 4,        // px por "bloque" pintado (abstracto)
  chunk: 16,      // tamaño chunk
  gridEvery: 1,   // dibujar línea por cada chunk
  minZoom: 0.5,
  maxZoom: 8,
  startZoom: 1.75,
  // área base en bloques abstractos (no reales) para viewport
  worldSpan: 8192, // +/- 4096 por eje en coords lógicas
  // mini
  miniSpan: 2048
};

const LAYERS = {
  biomes: true,
  grid: true,
  structures: true,
  mobs: true,
  height: false,
  heatmap: false,
  waypoints: true
};

/* =========================================================
   RUIDO Y RNG DETERMINISTAS
   - PRNG: mulberry32 / xorshift32
   - Simplex/Perlin like (2D)
   ========================================================= */
function mulberry32(a){ return function(){ let t = a += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function xorshift32(a){ return function(){ a ^= a << 13; a ^= a >>> 17; a ^= a << 5; return ((a>>>0) / 4294967296); }; }

function hash2i(x,z,seed=SEED){
  // mezcla simple determinista
  let h = (x*374761393 + z*668265263) ^ seed;
  h = (h ^ (h>>13)) * 1274126177;
  return h ^ (h>>16);
}
function rand2(x,z,seed=SEED){ return ((hash2i(x,z,seed)>>>0) / 4294967296); }

// Gradientes para ruido
const GRADS = [];
(function initGrads(){
  const R = mulberry32(SEED);
  for(let i=0;i<256;i++){
    const a = R()*Math.PI*2;
    GRADS[i] = {x:Math.cos(a), y:Math.sin(a)};
  }
})();
function fade(t){ return t*t*t*(t*(t*6-15)+10); }
function lerp(a,b,t){ return a + (b-a)*t; }
function dotGrid(ix,iz,x,z){
  const g = GRADS[(hash2i(ix,iz) & 255)];
  const dx = x - ix, dz = z - iz;
  return dx*g.x + dz*g.y;
}
function noise2(x,z){
  const x0 = Math.floor(x), z0 = Math.floor(z);
  const x1 = x0+1, z1 = z0+1;
  const sx = fade(x - x0), sz = fade(z - z0);
  const n00 = dotGrid(x0,z0,x,z);
  const n10 = dotGrid(x1,z0,x,z);
  const n01 = dotGrid(x0,z1,x,z);
  const n11 = dotGrid(x1,z1,x,z);
  const ix0 = lerp(n00,n10,sx);
  const ix1 = lerp(n01,n11,sx);
  return lerp(ix0,ix1,sz); // [-1,1]
}
function fbm(x,z, oct=5, lac=2.0, gain=0.5, scale=0.008){
  let amp=1, freq=1, sum=0, norm=0;
  for(let i=0;i<oct;i++){
    sum += amp * noise2(x*scale*freq, z*scale*freq);
    norm += amp; amp*=gain; freq*=lac;
  }
  return sum / norm; // [-1,1] aproximado
}

/* =========================================================
   CLASIFICACIÓN DE BIOMAS
   - Altura base con fbm
   - Húmedad con fbm desplazada
   - Temperatura con fbm desplazada
   Regla sencilla pero estética.
   ========================================================= */
function biomeAt(x,z){
  const h = fbm(x,z,5,2.1,0.5,0.0035);        // altura
  const m = fbm(x+1234,z-5678,4,2.0,0.55,0.006); // humedad
  const t = fbm(x-9999,z+9999,4,2.2,0.55,0.0065); // temp

  // océanos por altura baja
  if (h < -0.18) return {id:'ocean', color:'#0a1520', name:'Océano', h,m,t};
  // desierto: temp alta, humedad baja
  if (t > 0.22 && m < -0.05 && h > -0.15) return {id:'desert', color:'#c9b25b', name:'Desierto', h,m,t};
  // nieve: temp baja
  if (t < -0.18 && h > -0.12) return {id:'snow', color:'#dfe9f5', name:'Nieve', h,m,t};
  // montaña: altura alta
  if (h > 0.26) return {id:'mountain', color:'#8d9aa9', name:'Montaña', h,m,t};
  // bosque: humedad alta
  if (m > 0.18) return {id:'forest', color:'#2f6b3f', name:'Bosque', h,m,t};
  // llanuras por defecto
  return {id:'plains', color:'#3ba35c', name:'Llanuras', h,m,t};
}

/* =========================================================
   ESTRUCTURAS (SIMULADAS)
   - Aldeas: patrón sobreamostrado en planicie/llanuras/bosque
   - Templos: en desierto
   - Stronghold: círculo grande con fases (probables)
   - Portales arruinados: aleatorios ponderados
   Nota: determinista por chunk.
   ========================================================= */
function structInChunk(cx, cz){
  // Determinismo por chunk
  const r = rand2(cx,cz);
  const centerX = cx*MAP.chunk + MAP.chunk/2;
  const centerZ = cz*MAP.chunk + MAP.chunk/2;
  const b = biomeAt(centerX, centerZ);

  // Aldea (plains/forest/desert con prob moderada)
  if ((b.id==='plains' || b.id==='forest' || b.id==='desert') && r > 0.985){
    return {type:'village', name:'Aldea', x:centerX, z:centerZ, color:'#ffd166'};
  }
  // Templo desierto
  if (b.id==='desert' && r > 0.992){
    return {type:'temple', name:'Templo del desierto', x:centerX, z:centerZ, color:'#f4a261'};
  }
  // Portal arruinado: baja prob general
  if (r < 0.002){
    return {type:'ruin', name:'Portal arruinado', x:centerX, z:centerZ, color:'#c084fc'};
  }
  // Stronghold (anillos probabilísticos)
  const dist = Math.hypot(centerX, centerZ);
  const ring = Math.round(dist/1200);
  if (ring===1 && r>0.997){ return {type:'stronghold', name:'Stronghold (prob.)', x:centerX, z:centerZ, color:'#60a5fa'}; }

  return null;
}

/* =========================================================
   CALOR DE MOBS (SIMULADO)
   - Altas tasas en llanuras/desierto de noche (proxy)
   - Usamos ruido rápido con seed desplazada
   ========================================================= */
function mobHeat(x,z){
  const n = fbm(x+7777,z-3333,3,2.3,0.6,0.02);
  return Math.max(0, n); // [0,1] aproximado
}

/* =========================================================
   RENDER PRINCIPAL
   - Canvas a tiles, cache de tiles (offscreen)
   - Zoom/pan con inercia
   - Capas según toggles
   ========================================================= */
const canvas = $('#map');
const ctx = canvas.getContext('2d');

const miniCanvas = $('#miniCanvas');
const miniCtx = miniCanvas.getContext('2d');
const miniFrame = $('#miniFrame');

let view = {
  x: 0, // centro en mundo lógico
  z: 0,
  zoom: MAP.startZoom
};

let dragging = false;
let last = {x:0, y:0};
let vel = {x:0, y:0};
let raf = 0;

let tileCache = new Map();  // key => canvas
let structCache = new Map(); // key => struct[] por región
let heatCache = new Map();   // key => imageData por tile

function resize(){
  const dpr = Math.max(1, devicePixelRatio||1);
  const w = canvas.clientWidth * dpr;
  const h = canvas.clientHeight * dpr;
  canvas.width = w; canvas.height = h;

  // mini
  const mw = miniCanvas.clientWidth * dpr;
  const mh = miniCanvas.clientHeight * dpr;
  miniCanvas.width = mw; miniCanvas.height = mh;

  draw(); drawMini();
}
addEventListener('resize', resize);

/* ---------- Interacción: pan ---------- */
canvas.addEventListener('mousedown', e=>{
  dragging = true; last.x = e.clientX; last.y = e.clientY; vel.x=0; vel.y=0;
});
addEventListener('mouseup', ()=> dragging=false);
addEventListener('mouseleave', ()=> dragging=false);
addEventListener('mousemove', e=>{
  if(!dragging) return;
  const dx = e.clientX - last.x; const dy = e.clientY - last.y;
  last.x = e.clientX; last.y = e.clientY;
  const scale = 1 / view.zoom;
  view.x -= dx * 4 * scale;
  view.z -= dy * 4 * scale;
  vel.x = dx; vel.y = dy;
  draw(); drawMini();
});

/* ---------- Interacción: zoom rueda ---------- */
canvas.addEventListener('wheel', e=>{
  e.preventDefault();
  const delta = Math.sign(e.deltaY);
  const oldZoom = view.zoom;
  const nz = clamp(view.zoom * (delta>0 ? 0.9 : 1.1), MAP.minZoom, MAP.maxZoom);

  // zoom focal al puntero
  const rect = canvas.getBoundingClientRect();
  const px = (e.clientX - rect.left) * (Math.max(1, devicePixelRatio||1));
  const pz = (e.clientY - rect.top)  * (Math.max(1, devicePixelRatio||1));
  const worldBefore = screenToWorld(px,pz,oldZoom);
  const worldAfter  = screenToWorld(px,pz,nz);
  view.x += (worldBefore.x - worldAfter.x);
  view.z += (worldBefore.z - worldAfter.z);

  view.zoom = nz;
  $('#hudZoom').textContent = view.zoom.toFixed(2)+'x';
  draw(); drawMini();
},{passive:false});

/* ---------- Botones rápidos ---------- */
$('#zoomIn').addEventListener('click', ()=>{ view.zoom=clamp(view.zoom*1.2, MAP.minZoom, MAP.maxZoom); $('#hudZoom').textContent=view.zoom.toFixed(2)+'x'; draw(); drawMini(); });
$('#zoomOut').addEventListener('click', ()=>{ view.zoom=clamp(view.zoom/1.2, MAP.minZoom, MAP.maxZoom); $('#hudZoom').textContent=view.zoom.toFixed(2)+'x'; draw(); drawMini(); });
$('#resetView').addEventListener('click', ()=>{ view={x:0,z:0,zoom:MAP.startZoom}; $('#hudZoom').textContent=view.zoom.toFixed(2)+'x'; draw(); drawMini(); });
$('#dropPin').addEventListener('click', ()=> addWaypointAtCenter());

/* ---------- Coordenadas HUD + crosshair + tooltip ---------- */
const hudX = $('#hudX'), hudZ = $('#hudZ'), hudZoom = $('#hudZoom');
const tooltip = $('#tooltip');
const crosshair = $('#crosshair');

canvas.addEventListener('mousemove', e=>{
  const dpi = Math.max(1,devicePixelRatio||1);
  const rect = canvas.getBoundingClientRect();
  const px = (e.clientX - rect.left)*dpi;
  const pz = (e.clientY - rect.top)*dpi;
  const w = screenToWorld(px,pz,view.zoom);
  hudX.textContent = Math.round(w.x);
  hudZ.textContent = Math.round(w.z);
  crosshair.style.left = `${e.clientX-9}px`;
  crosshair.style.top = `${e.clientY-9}px`;

  // tooltip de bioma
  const b = biomeAt(Math.round(w.x), Math.round(w.z));
  tooltip.textContent = `${b.name} · h:${b.h.toFixed(2)} m:${b.m.toFixed(2)} t:${b.t.toFixed(2)}`;
  tooltip.style.left = `${e.clientX}px`;
  tooltip.style.top = `${e.clientY - 18}px`;
  tooltip.classList.add('show');
});
canvas.addEventListener('mouseleave', ()=>{
  tooltip.classList.remove('show');
  crosshair.style.left = `-1000px`;
});

/* ---------- Ir a coordenadas ---------- */
$('#btnGo').addEventListener('click', ()=>{
  const x = parseInt($('#coordX').value||'0',10);
  const z = parseInt($('#coordZ').value||'0',10);
  focusTo(x,z);
});
$('#btnHome').addEventListener('click', ()=> focusTo(0,0));

function focusTo(x,z){
  view.x = x; view.z = z; draw(); drawMini(); toast(`Vista centrada en (${x}, ${z})`);
}

/* ---------- Capas y export/import ---------- */
$$('.chip[data-layer]').forEach(c=>{
  c.addEventListener('click', ()=>{
    const k = c.dataset.layer;
    LAYERS[k] = !LAYERS[k];
    c.classList.toggle('is-on', LAYERS[k]);
    draw(); drawMini();
  });
});

$$('.chip[data-action]').forEach(c=>{
  c.addEventListener('click', ()=>{
    const act = c.dataset.action;
    if (act==='export') exportWaypoints();
    if (act==='import') $('#importFile').click();
  });
});
$('#importFile').addEventListener('change', importWaypoints);

/* =========================================================
   TILE RENDER
   - región de pantalla => rango mundo
   - key por tile (tx,tz,zoomIndex) para cache
   ========================================================= */
function worldToScreen(x,z,zoom=view.zoom){
  const dpr = Math.max(1,devicePixelRatio||1);
  const cx = canvas.width/2, cz = canvas.height/2;
  const scale = zoom;
  return { x: cx + (x - view.x) * scale, z: cz + (z - view.z) * scale };
}
function screenToWorld(px,pz,zoom=view.zoom){
  const cx = canvas.width/2, cz = canvas.height/2;
  const scale = zoom;
  return { x: view.x + (px - cx)/scale, z: view.z + (pz - cz)/scale };
}

function draw(){
  if(raf) cancelAnimationFrame(raf);
  raf = requestAnimationFrame(_draw);
}
function _draw(){
  const dpr = Math.max(1,devicePixelRatio||1);
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // rango visible en mundo
  const topLeft = screenToWorld(0,0);
  const bottomRight = screenToWorld(canvas.width,canvas.height);
  const vx0 = Math.floor(topLeft.x);
  const vz0 = Math.floor(topLeft.z);
  const vx1 = Math.ceil(bottomRight.x);
  const vz1 = Math.ceil(bottomRight.z);

  const step = MAP.tile * (1/view.zoom); // tamaño base lógico escalado
  const tileSizeWorld = Math.max(4, Math.floor(8/ (view.zoom))); // granularidad

  // pintar biomas
  if (LAYERS.biomes || LAYERS.height || LAYERS.heatmap){
    const sx = Math.floor(vx0 / tileSizeWorld) * tileSizeWorld;
    const sz = Math.floor(vz0 / tileSizeWorld) * tileSizeWorld;

    for(let z=sz; z<=vz1; z+=tileSizeWorld){
      for(let x=sx; x<=vx1; x+=tileSizeWorld){
        const key = `${x}|${z}|${tileSizeWorld}|${Math.round(view.zoom*10)}`;
        let tile = tileCache.get(key);
        if (!tile){
          tile = renderTile(x,z,tileSizeWorld);
          tileCache.set(key, tile);
          if (tileCache.size>1200){ // LRU simple: limpiar alguno
            const it = tileCache.keys().next();
            tileCache.delete(it.value);
          }
        }
        const p0 = worldToScreen(x,z);
        const p1 = worldToScreen(x+tileSizeWorld,z+tileSizeWorld);
        ctx.drawImage(tile, p0.x, p0.z, p1.x-p0.x, p1.z-p0.z);
      }
    }
  }

  // cuadrícula por chunk
  if (LAYERS.grid){
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = 'rgba(255,255,255,.12)';
    ctx.lineWidth = 1;
    const CH = MAP.chunk;
    const startCx = Math.floor(vx0/CH)*CH;
    const startCz = Math.floor(vz0/CH)*CH;
    for(let x=startCx; x<=vx1; x+=CH){
      const p0 = worldToScreen(x,vz0); const p1 = worldToScreen(x,vz1);
      ctx.beginPath(); ctx.moveTo(p0.x+.5,p0.z); ctx.lineTo(p1.x+.5,p1.z); ctx.stroke();
    }
    for(let z=startCz; z<=vz1; z+=CH){
      const p0 = worldToScreen(vx0,z); const p1 = worldToScreen(vx1,z);
      ctx.beginPath(); ctx.moveTo(p0.x,p0.z+.5); ctx.lineTo(p1.x,p1.z+.5); ctx.stroke();
    }
    ctx.restore();
  }

  // estructuras
  if (LAYERS.structures){
    drawStructures(vx0,vz0,vx1,vz1);
  }

  // calor de mobs
  if (LAYERS.mobs){
    drawMobHeat(vx0,vz0,vx1,vz1);
  }

  // waypoints
  if (LAYERS.waypoints){
    drawWaypoints();
  }
}

function renderTile(x0,z0,size){
  const cvs = document.createElement('canvas');
  cvs.width = size; cvs.height = size;
  const c = cvs.getContext('2d');

  // Base: biomes
  const img = c.createImageData(size,size);
  const data = img.data;
  for(let dz=0; dz<size; dz++){
    for(let dx=0; dx<size; dx++){
      const x = x0 + dx;
      const z = z0 + dz;
      const b = biomeAt(x,z);
      const col = hex2rgb(b.color);
      const i = (dz*size + dx)*4;
      data[i]=col.r; data[i+1]=col.g; data[i+2]=col.b; data[i+3]=255;
    }
  }

  // capa altura (opcional)
  if (LAYERS.height){
    for(let dz=0; dz<size; dz++){
      for(let dx=0; dx<size; dx++){
        const x = x0 + dx, z = z0 + dz;
        const h = fbm(x,z,5,2.1,0.5,0.0035);
        const v = Math.floor((h+1)*127);
        const i = (dz*size + dx)*4;
        data[i]=v; data[i+1]=v; data[i+2]=v; data[i+3]=190;
      }
    }
  }

  // heatmap densidad (opcional)
  if (LAYERS.heatmap){
    for(let dz=0; dz<size; dz++){
      for(let dx=0; dx<size; dx++){
        const x = x0 + dx, z = z0 + dz;
        const d = fbm(x+2500,z-1400,3,2.2,0.6,0.01); // densidad
        const v = Math.max(0,d);
        const i = (dz*size + dx)*4;
        // overlay rojizo
        data[i] = Math.min(255, data[i] + v*90);
        data[i+1] = Math.max(0, data[i+1] - v*50);
        data[i+2] = Math.max(0, data[i+2] - v*50);
      }
    }
  }

  c.putImageData(img,0,0);
  return cvs;
}

/* ---------- Estructuras ---------- */
function drawStructures(vx0,vz0,vx1,vz1){
  const CH = MAP.chunk;
  const cminx = Math.floor(vx0/CH), cmaxx = Math.floor(vx1/CH);
  const cminz = Math.floor(vz0/CH), cmaxz = Math.floor(vz1/CH);
  ctx.save();
  ctx.fillStyle = '#000'; ctx.strokeStyle = 'rgba(0,0,0,.45)';

  for(let cz=cminz; cz<=cmaxz; cz++){
    for(let cx=cminx; cx<=cmaxx; cx++){
      const key = `${cx}|${cz}`;
      let list = structCache.get(key);
      if (!list){
        const s = structInChunk(cx,cz);
        list = s ? [s] : [];
        structCache.set(key, list);
        if (structCache.size>4000){
          // limpieza simple
          const it = structCache.keys().next();
          structCache.delete(it.value);
        }
      }
      if (!list.length) continue;
      for(const s of list){
        const p = worldToScreen(s.x,s.z);
        ctx.beginPath();
        ctx.arc(p.x,p.z, 4.5, 0, Math.PI*2);
        ctx.fillStyle = s.color;
        ctx.fill();
        ctx.stroke();

        // etiqueta discreta
        ctx.font = '12px Outfit, sans-serif';
        ctx.fillStyle = 'rgba(0,0,0,.55)';
        ctx.fillText(s.name, p.x+7, p.z-7);
        ctx.fillStyle = 'rgba(255,255,255,.9)';
        ctx.fillText(s.name, p.x+6, p.z-8);

        // hitbox para click
        addHitbox({x:s.x, z:s.z, type:s.type, name:s.name, color:s.color});
      }
    }
  }
  ctx.restore();
}

/* ---------- Calor de mobs ---------- */
function drawMobHeat(vx0,vz0,vx1,vz1){
  const step = 12 / view.zoom; // resol
  ctx.save();
  ctx.globalAlpha = 0.22;
  for(let z=vz0; z<=vz1; z+=step){
    for(let x=vx0; x<=vx1; x+=step){
      const h = mobHeat(x,z);
      if (h<0.1) continue;
      const p0 = worldToScreen(x,z);
      ctx.fillStyle = `rgba(239,68,68,${h*0.35})`;
      ctx.fillRect(p0.x, p0.z, step*view.zoom, step*view.zoom);
    }
  }
  ctx.restore();
}

/* =========================================================
   HITBOXES para clicks (estructura/waypoint)
   ========================================================= */
let hits = [];
function resetHitboxes(){ hits.length = 0; }
function addHitbox(obj){ hits.push(obj); }

canvas.addEventListener('click', e=>{
  const pt = getWorldAtEvent(e);
  // buscar hit cercano
  let best = null, bestD = 9999;
  for(const h of hits){
    const d = Math.hypot(h.x-pt.x, h.z-pt.z);
    if (d<12 && d<bestD){ best=h; bestD=d; }
  }
  if (best){
    openDetail(best);
  } else {
    // si no hay hit, popup rápido para crear waypoint
    openDetail({type:'point', name:'Punto', x:Math.round(pt.x), z:Math.round(pt.z), color:'#87f39d'});
  }
});

function getWorldAtEvent(e){
  const dpi = Math.max(1,devicePixelRatio||1);
  const rect = canvas.getBoundingClientRect();
  const px = (e.clientX - rect.left)*dpi;
  const pz = (e.clientY - rect.top)*dpi;
  return screenToWorld(px,pz);
}

/* =========================================================
   MINIMAPA
   ========================================================= */
function drawMini(){
  const dpr = Math.max(1,devicePixelRatio||1);
  const mw = miniCanvas.width, mh = miniCanvas.height;
  miniCtx.clearRect(0,0,mw,mh);

  const span = MAP.miniSpan; // área que representa el minimapa
  // pintar simplificado por bloques grandes
  const step = 8; // resolución mini
  for(let z=-span; z<=span; z+=step){
    for(let x=-span; x<=span; x+=step){
      const b = biomeAt(x,z);
      miniCtx.fillStyle = b.color;
      const u = (x+span)/(span*2) * mw;
      const v = (z+span)/(span*2) * mh;
      miniCtx.fillRect(u,v, mw/(span*2/step), mh/(span*2/step));
    }
  }

  // marco de vista
  const tl = worldToMini(screenToWorld(0,0));
  const br = worldToMini(screenToWorld(canvas.width, canvas.height));
  const x = Math.min(tl.x, br.x);
  const y = Math.min(tl.z, br.z);
  const w = Math.abs(tl.x - br.x);
  const h = Math.abs(tl.z - br.z);

  miniFrame.style.left = `${miniCanvas.getBoundingClientRect().left + x/ dpr}px`;
  miniFrame.style.top  = `${miniCanvas.getBoundingClientRect().top  + y/ dpr}px`;
  miniFrame.style.width = `${w / dpr}px`;
  miniFrame.style.height= `${h / dpr}px`;
}

function worldToMini(pt){
  const mw = miniCanvas.width, mh = miniCanvas.height;
  const span = MAP.miniSpan;
  return {
    x: (pt.x + span)/(span*2) * mw,
    z: (pt.z + span)/(span*2) * mh
  };
}

/* =========================================================
   WAYPOINTS
   - Guardar en localStorage
   - Lista CRUD
   ========================================================= */
const wpKey = 'moonveil.waypoints.v1';
let waypoints = loadWaypoints();

function loadWaypoints(){
  try{
    const j = localStorage.getItem(wpKey);
    if (!j) return [];
    const arr = JSON.parse(j);
    return Array.isArray(arr)? arr : [];
  }catch{return []}
}
function saveWaypoints(){
  localStorage.setItem(wpKey, JSON.stringify(waypoints));
  renderWaypointsList();
  draw();
  drawMini();
}
function addWaypointAtCenter(){
  const p = screenToWorld(canvas.width/2, canvas.height/2);
  const b = biomeAt(p.x,p.z);
  const wp = {
    id: 'wp_'+Date.now(),
    name: `Punto ${waypoints.length+1}`,
    x: Math.round(p.x), z: Math.round(p.z),
    color: pickColorByBiome(b.id),
    note: `Biome: ${b.name}`
  };
  waypoints.push(wp); saveWaypoints();
  toast(`Waypoint agregado en (${wp.x}, ${wp.z})`);
}
function drawWaypoints(){
  resetHitboxes();
  for(const w of waypoints){
    const p = worldToScreen(w.x,w.z);
    ctx.save();
    ctx.beginPath();
    ctx.arc(p.x,p.z, 5, 0, Math.PI*2);
    ctx.fillStyle = w.color; ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.stroke();
    ctx.font = '12px Outfit, sans-serif';
    ctx.fillStyle = 'rgba(0,0,0,.55)';
    ctx.fillText(w.name, p.x+7, p.z-7);
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.fillText(w.name, p.x+6, p.z-8);
    ctx.restore();

    addHitbox({type:'waypoint', ...w});
  }
}
function renderWaypointsList(){
  const box = $('#wpList');
  if (!waypoints.length){ box.innerHTML = `<p class="muted">Sin waypoints aún. Usa el pin o haz click en el mapa.</p>`; return; }
  box.innerHTML = waypoints.map(w=>`
    <div class="wp-item">
      <div>
        <h4>${escape(w.name)}</h4>
        <div class="wp-meta"><span>(${w.x}, ${w.z})</span><span style="color:${w.color}">●</span></div>
      </div>
      <div class="wp-actions">
        <button class="btn-sm" data-f="${w.id}">Enfocar</button>
        <button class="btn-sm" data-e="${w.id}">Editar</button>
        <button class="btn-sm" data-d="${w.id}">Borrar</button>
      </div>
    </div>
  `).join('');

  // bind
  $$('#wpList [data-f]').forEach(b=> b.addEventListener('click', ()=> {
    const id = b.dataset.f; const w = waypoints.find(x=>x.id===id); if(!w) return;
    focusTo(w.x,w.z);
  }));
  $$('#wpList [data-e]').forEach(b=> b.addEventListener('click', ()=> {
    const id = b.dataset.e; const w = waypoints.find(x=>x.id===id); if(!w) return;
    openDetail({type:'waypoint', ...w});
  }));
  $$('#wpList [data-d]').forEach(b=> b.addEventListener('click', ()=> {
    const id = b.dataset.d; const i = waypoints.findIndex(x=>x.id===id); if(i<0) return;
    waypoints.splice(i,1); saveWaypoints(); toast('Waypoint eliminado');
  }));

  $('#clearWp').onclick = ()=>{
    if (!waypoints.length) return;
    if (confirm('¿Eliminar todos los waypoints?')){
      waypoints = []; saveWaypoints();
    }
  };
}
renderWaypointsList();

function pickColorByBiome(id){
  switch(id){
    case 'ocean': return '#38bdf8';
    case 'plains': return '#22c55e';
    case 'forest': return '#16a34a';
    case 'desert': return '#f59e0b';
    case 'snow': return '#60a5fa';
    case 'mountain': return '#a3a3a3';
    default: return '#87f39d';
  }
}

/* ---------- Export/Import ---------- */
function exportWaypoints(){
  const blob = new Blob([JSON.stringify(waypoints,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'moonveil-waypoints.json'; a.click();
  URL.revokeObjectURL(url);
  toast('Waypoints exportados');
}
function importWaypoints(e){
  const f = e.target.files[0]; if(!f) return;
  const r = new FileReader();
  r.onload = () => {
    try{
      const arr = JSON.parse(r.result);
      if (Array.isArray(arr)){
        waypoints = arr; saveWaypoints(); toast('Waypoints importados');
      } else toast('Archivo inválido');
    }catch{ toast('No se pudo importar'); }
  };
  r.readAsText(f);
  e.target.value = '';
}

/* =========================================================
   DETALLE (MODAL)
   ========================================================= */
const modal = $('#detailModal');
const modalOverlay = $('#detailOverlay');
const modalClose = $('#detailClose');
const modalTitle = $('#detailTitle');
const modalBody = $('#detailBody');
const modalFocus = $('#detailFocus');

function openDetail(obj){
  modalTitle.textContent = obj.name || 'Detalle';
  const content = [];

  if (obj.type==='waypoint'){
    content.push(`<p><b>Waypoint:</b> ${escape(obj.name)}</p>`);
    content.push(`<p><b>Coordenadas:</b> (${obj.x}, ${obj.z})</p>`);
    content.push(`<p><b>Color:</b> <span style="color:${obj.color}">●</span></p>`);
    content.push(`<div class="u-pad-8 u-border u-br-10"><label>Renombrar</label><input id="wpName" style="width:100%;height:36px;border-radius:10px;border:1px solid rgba(255,255,255,.08);background:#0f1411;color:#e8f3ea;padding:0 10px" value="${escape(obj.name)}"/></div>`);
    content.push(`<div class="u-pad-8 u-border u-br-10"><label>Nota</label><textarea id="wpNote" style="width:100%;height:80px;border-radius:10px;border:1px solid rgba(255,255,255,.08);background:#0f1411;color:#e8f3ea;padding:8px">${escape(obj.note||'')}</textarea></div>`);
    content.push(`<div class="u-pad-8 u-border u-br-10"><label>Color</label><input id="wpColor" type="color" value="${obj.color}"/></div>`);
    modalBody.innerHTML = content.join('');

    modalFocus.onclick = ()=>{
      focusTo(obj.x, obj.z);
      closeDetail();
    };

    // guardar cambios al cerrar
    modalClose.onclick = ()=>{
      const n = $('#wpName').value.trim() || obj.name;
      const note = $('#wpNote').value || '';
      const col = $('#wpColor').value || obj.color;
      const i = waypoints.findIndex(w=>w.id===obj.id);
      if (i>=0){ waypoints[i].name=n; waypoints[i].note=note; waypoints[i].color=col; saveWaypoints(); }
      closeDetail();
    };
    modalOverlay.onclick = modalClose.onclick;

  } else if (obj.type==='point'){
    const b = biomeAt(obj.x,obj.z);
    content.push(`<p><b>Ubicación:</b> (${Math.round(obj.x)}, ${Math.round(obj.z)})</p>`);
    content.push(`<p><b>Bioma:</b> ${b.name}</p>`);
    modalBody.innerHTML = content.join('');
    modalFocus.onclick = ()=>{ focusTo(obj.x,obj.z); closeDetail(); };
    modalClose.onclick = closeDetail; modalOverlay.onclick = closeDetail;

  } else {
    // estructura
    const b = biomeAt(obj.x,obj.z);
    content.push(`<p><b>Tipo:</b> ${obj.name}</p>`);
    content.push(`<p><b>Posible ubicación:</b> (${Math.round(obj.x)}, ${Math.round(obj.z)})</p>`);
    content.push(`<p><b>Bioma:</b> ${b.name}</p>`);
    modalBody.innerHTML = content.join('');
    modalFocus.onclick = ()=>{ focusTo(obj.x,obj.z); closeDetail(); };
    modalClose.onclick = closeDetail; modalOverlay.onclick = closeDetail;
  }

  modal.classList.add('show');
  modal.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
}
function closeDetail(){
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
}

/* =========================================================
   UTILIDADES
   ========================================================= */
function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
function hex2rgb(hex){
  const h = hex.replace('#',''); const n = parseInt(h,16);
  if (h.length===6) return {r:(n>>16)&255, g:(n>>8)&255, b:n&255};
  // 3 dígitos
  return {r:((n>>8)&15)*17, g:((n>>4)&15)*17, b:(n&15)*17};
}
function escape(s){return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function toast(msg){
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(t._id); t._id = setTimeout(()=> t.classList.remove('show'), 1400);
}

/* =========================================================
   OBSERVERS Y ARRANQUE
   ========================================================= */
let revealObs;
function observeReveal(){
  if (revealObs) revealObs.disconnect();
  revealObs = new IntersectionObserver((entries)=>{
    entries.forEach(ent=>{
      if (ent.isIntersecting){ ent.target.classList.add('is-in'); revealObs.unobserve(ent.target); }
    });
  },{threshold:.15});
  $$('.reveal').forEach(el=>revealObs.observe(el));
}
observeReveal();

/* ---------- Inicializar ---------- */
function init(){
  resize();
  hudZoom.textContent = view.zoom.toFixed(2)+'x';
  draw(); drawMini();
}
addEventListener('load', init);

/* =========================================================
   NOTA SOBRE LA “REALIDAD” DEL MAPA
   ---------------------------------------------------------
   - Este sistema es determinista y usa la semilla 3903589
     para generar una distribución coherente de biomas y
     estructuras probables en client-side.
   - Para calcar 1:1 el worldgen Bedrock real se necesitaría
     replicar el generador oficial o consumir un servicio
     externo con datos precomputados. Aquí mantenemos el
     diseño, rendimiento y estética dentro del portal,
     priorizando la experiencia interactiva.
   - Puedes ajustar las funciones fbm()/biomeAt()/structInChunk()
     para aproximaciones más fieles.
   ========================================================= */
