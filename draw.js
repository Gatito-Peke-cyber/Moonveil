/**
 * draw.js — Moonveil Draw (versión corregida y funcional)
 * 
 * Versión limpia:
 * - Corrige funciones duplicadas (initDraw, promptReplace)
 * - Mantiene toda la funcionalidad original
 * - Verifica existencia de elementos antes de asignar eventos
 */

/* ------------------------------
   Configuración / Constantes
   ------------------------------ */
const STORAGE_KEY = 'mv_draw_v2';
const MAX_STORE_LENGTH = 1024 * 1024 * 5;
const GALLERY_DIM = 800;
const THUMB_DIM = 400;
const MAX_PROCESS_DIM = 1200;

/* ------------------------------
   Estado en memoria
   ------------------------------ */
let images = [];
let currentEditId = null;
let currentLightboxIndex = -1;
let isLightboxZoomed = false;

/* ------------------------------
   Helpers DOM
   ------------------------------ */
const $ = (s, ctx = document) => ctx.querySelector(s);
const $$ = (s, ctx = document) => [...ctx.querySelectorAll(s)];
function el(tag='div', props={}){ const e = document.createElement(tag); Object.assign(e, props); return e; }
function fmt(n){ return Number(n).toLocaleString(); }

/* ------------------------------
   Toast
   ------------------------------ */
function toast(msg, t = 2000){
  const tEl = $('#drawToast');
  if(!tEl) { console.log(msg); return; }
  tEl.textContent = msg;
  tEl.classList.add('show');
  clearTimeout(tEl._tm);
  tEl._tm = setTimeout(()=> tEl.classList.remove('show'), t);
}

/* ------------------------------
   Storage
   ------------------------------ */
function saveToStorage(){
  try{
    const data = JSON.stringify(images);
    if(data.length > MAX_STORE_LENGTH){
      toast('⚠️ Límite de almacenamiento excedido. Usa IndexedDB.');
      return false;
    }
    localStorage.setItem(STORAGE_KEY, data);
    return true;
  }catch(e){
    console.error('saveToStorage error', e);
    return false;
  }
}
function loadFromStorage(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    images = raw ? JSON.parse(raw) : [];
    images = images.map(it => ({
      id: it.id,
      name: it.name || 'Imagen',
      desc: it.desc || '',
      dataURL: it.dataURL,
      type: it.type || 'image',
      createdAt: it.createdAt || Date.now(),
      sizeKB: it.sizeKB || 0,
      width: it.width || 0,
      height: it.height || 0
    }));
  }catch(e){
    console.error('loadFromStorage', e);
    images = [];
  }
}

/* ------------------------------
   Utilidades de imagen
   ------------------------------ */
function fileToImage(file){
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => resolve({ img, name: file.name, size: file.size, type: file.type });
      img.onerror = () => reject(new Error('Formato de imagen inválido'));
      img.src = fr.result;
    };
    fr.onerror = () => reject(new Error('Error leyendo archivo'));
    fr.readAsDataURL(file);
  });
}

function processImageForStorage(source, opts = { crop: true, maxDim: GALLERY_DIM }){
  return new Promise((resolve, reject) => {
    if(typeof source === 'string' && source.startsWith('data:image/gif')) {
      return resolve({ dataURL: source, type: 'image/gif', width: 0, height: 0, sizeKB: Math.round((source.length * 3/4) / 1024) });
    }
    if(source instanceof File){
      fileToImage(source).then(obj => {
        if(obj.type === 'image/gif') {
          const fr = new FileReader();
          fr.onload = ()=> resolve({ dataURL: fr.result, type: 'image/gif', width: obj.img.width, height: obj.img.height, sizeKB: Math.round(obj.size/1024) });
          fr.readAsDataURL(source);
          return;
        }
        const data = imageToSquareDataURL(obj.img, opts.maxDim, opts.crop);
        resolve({ dataURL: data, type: obj.type || 'image', width: obj.img.width, height: obj.img.height, sizeKB: Math.round(obj.size/1024) });
      }).catch(reject);
      return;
    }
    if(source instanceof Image){
      if(source.src.startsWith('data:image/gif')) {
        resolve({ dataURL: source.src, type: 'image/gif', width: source.width, height: source.height, sizeKB: Math.round((source.src.length * 3/4) / 1024) });
        return;
      }
      const data = imageToSquareDataURL(source, opts.maxDim, opts.crop);
      resolve({ dataURL: data, type: 'image', width: source.width, height: source.height, sizeKB: 0 });
      return;
    }
    reject(new Error('source no soportado'));
  });
}

function imageToSquareDataURL(img, maxDim = GALLERY_DIM, crop = true){
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const s = crop ? Math.min(iw, ih) : Math.max(iw, ih);
  const sx = crop ? Math.floor((iw - s)/2) : 0;
  const sy = crop ? Math.floor((ih - s)/2) : 0;
  const target = maxDim && s > maxDim ? maxDim : s;
  const canvas = document.createElement('canvas');
  canvas.width = target;
  canvas.height = target;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(img, sx, sy, s, s, 0, 0, target, target);
  return canvas.toDataURL('image/webp', 0.9);
}

/* ------------------------------
   CRUD
   ------------------------------ */
function addImageObject(item){
  images.unshift(item);
  saveToStorage();
  renderGallery();
}
function removeImageById(id){
  images = images.filter(x => x.id !== id);
  saveToStorage();
  renderGallery();
}
function updateImageById(id, patch){
  const idx = images.findIndex(x => x.id === id);
  if(idx === -1) return false;
  images[idx] = { ...images[idx], ...patch, updatedAt: Date.now() };
  saveToStorage();
  renderGallery();
  return true;
}

/* ------------------------------
   Upload handler
   ------------------------------ */
async function handleFilesUpload(fileList){
  if(!fileList || fileList.length === 0) return;
  const crop = $('#optCrop')?.checked ?? true;
  const resize = $('#optResize')?.checked ?? true;
  const maxDim = resize ? GALLERY_DIM : null;
  let added = 0;
  for(const f of Array.from(fileList)){
    try{
      const processed = await processImageForStorage(f, { crop, maxDim: maxDim || GALLERY_DIM });
      const id = 'img_' + Math.random().toString(36).substr(2,9);
      addImageObject({
        id,
        name: f.name,
        desc: '',
        dataURL: processed.dataURL,
        type: processed.type,
        createdAt: Date.now(),
        sizeKB: processed.sizeKB || Math.round(f.size/1024),
        width: processed.width || 0,
        height: processed.height || 0
      });
      added++;
    }catch(err){
      console.error('handleFilesUpload error', err);
    }
  }
  toast(`${added} imagen(es) añadida(s)`);
}

/* ------------------------------
   Render gallery
   ------------------------------ */
function renderGallery(){
  const grid = $('#galleryGrid');
  if(!grid) return;
  grid.innerHTML = '';
  if(!images.length){
    grid.innerHTML = `<div class="card u-muted" style="padding:20px;text-align:center">No hay imágenes. Sube una usando "Subir imágenes" o arrastra aquí.</div>`;
    $('#countPics') && ($('#countPics').textContent = 0);
    return;
  }
  $('#countPics') && ($('#countPics').textContent = images.length);

  images.forEach((it, idx) => {
    const card = el('div', { className: 'card' });
    const thumb = el('div', { className: 'thumb' });
    thumb.style.backgroundImage = `url('${it.dataURL}')`;
    const overlay = el('div', { className: 'overlay' });

    const mkBtn = (txt, title, fn) => {
      const b = el('button', { className: 'small-btn', innerText: txt });
      b.title = title; b.addEventListener('click', (e)=>{ e.stopPropagation(); fn(); });
      return b;
    };
    overlay.append(
      mkBtn('Ver', 'Ver', ()=>openLightboxAt(idx)),
      mkBtn('Editar', 'Editar', ()=>openEditModal(it.id)),
      mkBtn('Cambiar', 'Reemplazar', ()=>promptReplace(it.id)),
      mkBtn('Descargar', 'Descargar', ()=>downloadDataURL(it.dataURL, it.name)),
      mkBtn('Borrar', 'Eliminar', ()=>{ if(confirm('¿Eliminar esta imagen?')) removeImageById(it.id); })
    );

    const meta = el('div', { className: 'meta' });
    meta.innerHTML = `<div class="title">${it.name}</div><div class="time u-muted">${new Date(it.createdAt).toLocaleString()}</div>`;

    card.addEventListener('click', ()=>openLightboxAt(idx));
    card.append(thumb, overlay, meta);
    grid.appendChild(card);
  });
}

/* ------------------------------
   Edit modal
   ------------------------------ */
function openEditModal(id){
  const item = images.find(x => x.id === id);
  if(!item) return;
  currentEditId = id;
  $('#editPreview').src = item.dataURL;
  $('#editName').value = item.name || '';
  $('#editDesc').value = item.desc || '';
  const modal = $('#editModal');
  modal.style.display = 'grid';
  modal.setAttribute('aria-hidden', 'false');
}
function closeEditModal(){
  const modal = $('#editModal');
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
  currentEditId = null;
}
function saveEditModal(){
  if(!currentEditId) return;
  const name = $('#editName').value.trim() || 'Imagen';
  const desc = $('#editDesc').value.trim();
  updateImageById(currentEditId, { name, desc });
  closeEditModal();
  toast('Datos guardados');
}

/* ------------------------------
   Reemplazar imagen
   ------------------------------ */
function promptReplace(id){
  const input = el('input', { type: 'file', accept: 'image/*' });
  input.style.display = 'none';
  document.body.appendChild(input);
  input.addEventListener('change', async () => {
    const f = input.files && input.files[0];
    if(!f) { input.remove(); return; }
    try{
      const crop = $('#optCrop')?.checked ?? true;
      const resize = $('#optResize')?.checked ?? true;
      const maxDim = resize ? GALLERY_DIM : null;
      const processed = await processImageForStorage(f, { crop, maxDim: maxDim || GALLERY_DIM });
      const patch = { dataURL: processed.dataURL, type: processed.type, sizeKB: processed.sizeKB || Math.round(f.size/1024), width: processed.width || 0, height: processed.height || 0, name: f.name };
      updateImageById(id, patch);
      toast('Imagen reemplazada');
    }catch(err){
      console.error('replace error', err);
      toast('Error al reemplazar imagen');
    }
    input.remove();
  });
  input.click();
}

/* ------------------------------
   Lightbox
   ------------------------------ */
function openLightboxAt(index){
  if(index < 0 || index >= images.length) return;
  currentLightboxIndex = index;
  const item = images[index];
  $('#lbImg').src = item.dataURL;
  $('#lbCaption').textContent = item.name || '';
  const lb = $('#drawLightbox');
  lb.classList.add('is-open');
  lb.setAttribute('aria-hidden', 'false');
  isLightboxZoomed = false;
  $('#lbImg').style.transform = 'scale(1)';
}
function closeLightbox(){
  const lb = $('#drawLightbox');
  lb.classList.remove('is-open');
  lb.setAttribute('aria-hidden', 'true');
  currentLightboxIndex = -1;
}
function lightboxNext(){ if(images.length) openLightboxAt((currentLightboxIndex + 1) % images.length); }
function lightboxPrev(){ if(images.length) openLightboxAt((currentLightboxIndex - 1 + images.length) % images.length); }
function toggleLightboxZoom(){
  const img = $('#lbImg');
  if(!img) return;
  isLightboxZoomed = !isLightboxZoomed;
  img.style.transform = `scale(${isLightboxZoomed ? 1.8 : 1})`;
}

/* ------------------------------
   Export / Import
   ------------------------------ */
function exportBackup(){
  const blob = new Blob([JSON.stringify(images)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: `moonveil_backup_${new Date().toISOString().slice(0,10)}.json` });
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast('Backup exportado');
}
function importBackupFile(file){
  const fr = new FileReader();
  fr.onload = () => {
    try{
      const parsed = JSON.parse(fr.result);
      if(Array.isArray(parsed)){
        images = parsed.concat(images);
        saveToStorage();
        renderGallery();
        toast('Backup importado');
      } else throw new Error('Formato inválido');
    }catch(e){ toast('Error importando archivo'); }
  };
  fr.readAsText(file);
}

/* ------------------------------
   placeholder SVG
   ------------------------------ */
function placeholderSVG(text = 'Draw'){
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><rect width='100%' height='100%' fill='#0d1710'/><text x='50%' y='50%' font-family='monospace' font-size='28' fill='#9fd8a6' text-anchor='middle' dominant-baseline='middle'>${text}</text></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

/* ------------------------------
   Init principal
   ------------------------------ */
function initDraw(){
  loadFromStorage();
  renderGallery();
  $('#heroPreview') && ($('#heroPreview').src = placeholderSVG('Draw'));

  const fileInput = $('#fileInput');
  if(fileInput) fileInput.addEventListener('change', e => { handleFilesUpload(e.target.files); e.target.value=''; });

  const dropZone = $('#dropZone');
  if(dropZone){
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dropzone--over'); });
    dropZone.addEventListener('dragleave', e => dropZone.classList.remove('dropzone--over'));
    dropZone.addEventListener('drop', e => { e.preventDefault(); dropZone.classList.remove('dropzone--over'); handleFilesUpload(e.dataTransfer.files); });
    dropZone.addEventListener('click', () => $('#fileInput')?.click());
  }

  $('#btnClearAll')?.addEventListener('click', () => {
    if(confirm('¿Borrar TODAS las imágenes locales?')){
      images = []; saveToStorage(); renderGallery(); toast('Galería borrada');
    }
  });

  $('#btnExport')?.addEventListener('click', exportBackup);
  $('#btnImport')?.addEventListener('click', () => {
    const input = el('input', { type: 'file', accept: 'application/json' });
    document.body.appendChild(input);
    input.addEventListener('change', ()=>{ if(input.files[0]) importBackupFile(input.files[0]); input.remove(); });
    input.click();
  });

  $('#editClose')?.addEventListener('click', closeEditModal);
  $('#editSave')?.addEventListener('click', saveEditModal);
  $('#editReplace')?.addEventListener('click', ()=>{ if(currentEditId) promptReplace(currentEditId); });

  $('#lbClose')?.addEventListener('click', closeLightbox);
  $('#lbNext')?.addEventListener('click', lightboxNext);
  $('#lbPrev')?.addEventListener('click', lightboxPrev);
  $('#lbImg')?.addEventListener('dblclick', toggleLightboxZoom);

  document.addEventListener('keydown', (e)=>{
    if($('#drawLightbox')?.classList.contains('is-open')){
      if(e.key==='Escape') closeLightbox();
      if(e.key==='ArrowRight') lightboxNext();
      if(e.key==='ArrowLeft') lightboxPrev();
      if(e.key==='+') toggleLightboxZoom();
    }
    if($('#editModal')?.style.display==='grid' && e.key==='Escape') closeEditModal();
  });

  $('#drawLightbox')?.addEventListener('click', ev=>{
    if(ev.target=== $('#drawLightbox')) closeLightbox();
  });

  toast('🟢 Draw listo — sube tus imágenes');
}

document.addEventListener('DOMContentLoaded', initDraw);
