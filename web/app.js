'use strict';
/* Office Express — versión web (estática, para Vercel).
 * Mismos mosaicos táctiles que la app de escritorio.
 * Diferencia real: Google bloquea el iframe (X-Frame-Options), así que
 * cada mosaico abre su app en una pestaña nueva del navegador.
 */
let APPS = Array.isArray(window.OFFICE_APPS) ? window.OFFICE_APPS : [];
const preloader = document.getElementById('appPreloader');
const progressTrack = preloader && preloader.querySelector('.progress-track');
const progressFill = document.getElementById('preloaderProgress');
const preloaderStatus = document.getElementById('preloaderStatus');
const catalogStatus = document.getElementById('catalogStatus');
const catalogStatusText = document.getElementById('catalogStatusText');
const refreshCatalogButton = document.getElementById('refreshCatalog');
const bootStartedAt = performance.now();
const MIN_PRELOAD_MS = 4000;
let bootProgress = 8;
const bootTimer = setInterval(() => {
  const elapsed = performance.now() - bootStartedAt;
  bootProgress = Math.min(94, 8 + (elapsed / MIN_PRELOAD_MS) * 86);
  if (progressFill) progressFill.style.width = bootProgress + '%';
  if (progressTrack) progressTrack.setAttribute('aria-valuenow', String(bootProgress));
}, 100);

function finishPreloader() {
  clearInterval(bootTimer);
  const remaining = Math.max(0, MIN_PRELOAD_MS - (performance.now() - bootStartedAt));
  window.setTimeout(() => {
    if (progressFill) progressFill.style.width = '100%';
    if (progressTrack) progressTrack.setAttribute('aria-valuenow', '100');
    if (preloaderStatus) preloaderStatus.textContent = 'Listo. Elige una app para empezar.';
    window.setTimeout(() => preloader && preloader.classList.add('is-hidden'), 300);
  }, remaining);
}

function setCatalogStatus(state, message) {
  if (catalogStatus) catalogStatus.dataset.state = state;
  if (catalogStatusText) catalogStatusText.textContent = message;
}

function normalizeCatalog(rows) {
  if (!Array.isArray(rows)) return [];
  const seen = new Set();
  return rows.slice(0, 80).filter((app) => {
    if (!app || typeof app !== 'object' || !app.id || !app.name) return false;
    let url;
    try { url = new URL(String(app.url || '')); } catch (_) { return false; }
    const id = String(app.id);
    if (seen.has(id) || url.protocol !== 'https:') return false;
    seen.add(id);
    return true;
  }).map((app) => ({
    id: String(app.id), section: String(app.section || 'Aplicaciones').slice(0, 48),
    name: String(app.name).slice(0, 64), desc: String(app.desc || '').slice(0, 140),
    url: new URL(String(app.url)).href,
    color: /^#[\da-f]{6}$/i.test(String(app.color || '')) ? String(app.color) : '#ffb347',
    icon: String(app.icon || 'link').slice(0, 24)
  }));
}

const ICONS = {
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h6"/></svg>',
  sheet: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg>',
  slide: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M9 21h6M12 18v3"/></svg>',
  drive: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3h8l8 12-4 6H4L0 15z"/><path d="M8 3L0 15M16 3l8 12M12 9l4 6H8z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 6L22 7"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  meet: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="6" width="14" height="12" rx="2"/><path d="M15 10l7-3v10l-7-3z"/></svg>',
  form: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
  keep: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a7 7 0 0 1 7 7c0 2.4-1.2 4-2.5 5.5-.9 1-1.5 2-1.5 3.5h-6c0-1.5-.6-2.5-1.5-3.5C6.2 13 5 11.4 5 9a7 7 0 0 1 7-7z"/><path d="M9 21h6"/></svg>',
  muse: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
  design: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="m16 3 5 5M10 14l9-9 3 3-9 9-4 1z"/></svg>',
  scissors: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="m8.2 8.2 12.3 12.3M14.5 9.5 20.5 3.5M8.2 15.8 12 12"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7L12 5"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7L12 19"/></svg>'
};

const tilesEl = document.getElementById('tiles');
function renderCatalog(apps) {
  APPS = normalizeCatalog(apps);
  if (!APPS.length) return false;
  tilesEl.replaceChildren();
  const sectionGrids = new Map();
  for (const app of APPS) {
    const sectionName = String(app.section || 'Aplicaciones').trim() || 'Aplicaciones';
    if (!sectionGrids.has(sectionName)) {
      const section = document.createElement('section');
      section.className = 'app-section';
      const heading = document.createElement('h2');
      heading.className = 'app-section-title';
      heading.textContent = sectionName;
      const grid = document.createElement('div');
      grid.className = 'app-grid';
      section.append(heading, grid);
      tilesEl.appendChild(section);
      sectionGrids.set(sectionName, grid);
    }
    const link = document.createElement('a');
    link.className = 'tile';
    link.href = app.url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.title = 'Abrir ' + app.name;
    link.style.setProperty('--tile-color', app.color);
    const icon = document.createElement('span');
    icon.className = 'tile-icon';
    icon.innerHTML = ICONS[app.icon] || ICONS.link;
    const name = document.createElement('span');
    name.className = 'tile-name';
    name.textContent = app.name;
    const desc = document.createElement('span');
    desc.className = 'tile-desc';
    desc.textContent = app.desc;
    link.append(icon, name, desc);
    sectionGrids.get(sectionName).appendChild(link);
  }
  const appsMeta = document.getElementById('appsMeta');
  if (appsMeta) appsMeta.textContent = `${APPS.length} accesos · ${sectionGrids.size} secciones`;
  return true;
}

async function refreshCatalog() {
  if (refreshCatalogButton) {
    refreshCatalogButton.disabled = true;
    refreshCatalogButton.classList.add('is-loading');
  }
  setCatalogStatus('checking', 'Buscando apps actualizadas…');
  let endpointReached = false;
  try {
    if (!navigator.onLine) throw new Error('offline');
    const response = await fetch(new URL('apps.json', location.href), {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(2500)
    });
    endpointReached = true;
    if (!response.ok) throw new Error('catalog_unavailable');
    const payload = await response.json();
    const updated = renderCatalog(payload && payload.apps);
    if (!updated) throw new Error('invalid_catalog');
    setCatalogStatus('online', 'Conectado · catálogo actualizado');
    if (preloaderStatus) preloaderStatus.textContent = 'Apps actualizadas. Preparando la ventana…';
    return true;
  } catch (_) {
    if (endpointReached) {
      setCatalogStatus('online', 'Conectado · usando apps guardadas');
      if (preloaderStatus) preloaderStatus.textContent = 'Catálogo guardado. Preparando la ventana…';
      return true;
    }
    setCatalogStatus('offline', 'Desconectado · apps de ejemplo disponibles');
    if (preloaderStatus) preloaderStatus.textContent = 'Sin internet. Abriremos tus apps guardadas…';
    return false;
  } finally {
    if (refreshCatalogButton) {
      refreshCatalogButton.disabled = false;
      refreshCatalogButton.classList.remove('is-loading');
    }
  }
}

renderCatalog(APPS);
setCatalogStatus('checking', 'Comprobando conexión…');
refreshCatalogButton && refreshCatalogButton.addEventListener('click', refreshCatalog);
window.addEventListener('offline', () => setCatalogStatus('offline', 'Desconectado · apps de ejemplo disponibles'));
window.addEventListener('online', refreshCatalog);
refreshCatalog().finally(finishPreloader);
