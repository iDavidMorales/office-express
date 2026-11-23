'use strict';
/* Office Express — renderer (Electron).
 * Home táctil estilo tablet + barra de pestañas con botones grandes.
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
const tabstripEl = document.getElementById('tabstrip');
const homeView = document.getElementById('homeView');
const addressBar = document.getElementById('addressBar');
const btnBack = document.getElementById('btnBack');
const btnForward = document.getElementById('btnForward');
const btnReload = document.getElementById('btnReload');
const btnHome = document.getElementById('btnHome');
const btnNewTab = document.getElementById('btnNewTab');
const catalogManagerPanel = document.getElementById('catalogManagerPanel');
const toggleCatalogManager = document.getElementById('toggleCatalogManager');
const appEditorForm = document.getElementById('appEditorForm');
const managedAppList = document.getElementById('managedAppList');
const managerMessage = document.getElementById('managerMessage');
const CATALOG_STORAGE_KEY = 'office-express.catalog-overrides.v1';
let localCatalogOverride = readCatalogOverride();
let editingAppId = '';

function readCatalogOverride() {
  try {
    const saved = JSON.parse(localStorage.getItem(CATALOG_STORAGE_KEY) || 'null');
    return saved ? normalizeCatalog(saved) : null;
  } catch (_) { return null; }
}

function saveCatalogOverride(apps, message) {
  localCatalogOverride = normalizeCatalog(apps);
  if (!localCatalogOverride.length) {
    managerMessage.textContent = 'Debe quedar al menos una app en el catálogo.';
    return false;
  }
  localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(localCatalogOverride));
  APPS = localCatalogOverride;
  renderTiles();
  renderManagedApps();
  managerMessage.textContent = message || 'Cambios guardados en este equipo. Descarga el JSON para publicar el catálogo para todos.';
  return true;
}

function renderManagedApps() {
  if (!managedAppList) return;
  managedAppList.replaceChildren();
  APPS.forEach((app) => {
    const item = document.createElement('li');
    const summary = document.createElement('div');
    summary.className = 'managed-app-summary';
    const name = document.createElement('strong');
    name.textContent = app.name;
    const detail = document.createElement('small');
    detail.textContent = `${app.section} · ${app.url}`;
    summary.append(name, detail);
    const actions = document.createElement('div');
    actions.className = 'managed-app-actions';
    const edit = document.createElement('button');
    edit.type = 'button'; edit.className = 'refresh-btn secondary-btn'; edit.textContent = 'Editar';
    edit.addEventListener('click', () => {
      editingAppId = app.id;
      for (const key of ['name', 'url', 'section', 'desc', 'icon', 'color']) appEditorForm.elements[key].value = app[key] || '';
      document.getElementById('saveAppEntry').textContent = 'Guardar cambios';
      document.getElementById('cancelAppEdit').hidden = false;
      appEditorForm.elements.name.focus();
    });
    const remove = document.createElement('button');
    remove.type = 'button'; remove.className = 'refresh-btn danger-btn'; remove.textContent = 'Eliminar';
    remove.addEventListener('click', () => {
      if (APPS.length <= 1) { managerMessage.textContent = 'Debe quedar al menos una app en el catálogo.'; return; }
      saveCatalogOverride(APPS.filter((entry) => entry.id !== app.id), `${app.name} se quitó del catálogo de este equipo.`);
      if (editingAppId === app.id) resetAppEditor();
    });
    actions.append(edit, remove);
    item.append(summary, actions);
    managedAppList.appendChild(item);
  });
}

function resetAppEditor() {
  editingAppId = '';
  appEditorForm.reset();
  appEditorForm.elements.color.value = '#0e7490';
  document.getElementById('saveAppEntry').textContent = 'Agregar app';
  document.getElementById('cancelAppEdit').hidden = true;
}

function appIdFromName(name) {
  return String(name).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64);
}

function catalogExportPayload() {
  return { version: 1, updated_at: new Date().toISOString(), apps: APPS };
}

function downloadCatalog() {
  const blob = new Blob([JSON.stringify(catalogExportPayload(), null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob); link.download = 'apps.json'; link.click();
  URL.revokeObjectURL(link.href);
  managerMessage.textContent = 'Descargado. Reemplaza web/apps.json con este archivo y publica el cambio para sincronizar todos los equipos.';
}

function importCatalogFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || ''));
      const apps = normalizeCatalog(parsed.apps || parsed);
      if (!apps.length) throw new Error('El archivo no contiene apps válidas.');
      saveCatalogOverride(apps, `Catálogo importado (${apps.length} apps). Los cambios quedaron guardados en este equipo.`);
    } catch (error) { managerMessage.textContent = error.message || 'No se pudo importar el JSON.'; }
  };
  reader.readAsText(file);
}

let activeIsHome = true;

function renderTiles() {
  tilesEl.innerHTML = '';
  const sections = new Map();
  for (const app of APPS) {
    const sectionName = String(app.section || 'Aplicaciones').trim() || 'Aplicaciones';
    if (!sections.has(sectionName)) {
      const section = document.createElement('section');
      section.className = 'app-section';
      const heading = document.createElement('h2');
      heading.className = 'app-section-title';
      heading.textContent = sectionName;
      const grid = document.createElement('div');
      grid.className = 'app-grid';
      section.append(heading, grid);
      tilesEl.appendChild(section);
      sections.set(sectionName, grid);
    }
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tile';
    b.style.setProperty('--tile-color', app.color);
    b.title = 'Abrir ' + app.name;
    const icon = document.createElement('span');
    icon.className = 'tile-icon';
    icon.innerHTML = ICONS[app.icon] || ICONS.link;
    const name = document.createElement('span');
    name.className = 'tile-name';
    name.textContent = app.name;
    const desc = document.createElement('span');
    desc.className = 'tile-desc';
    desc.textContent = app.desc;
    b.append(icon, name, desc);
    b.addEventListener('click', () => window.officeExpress.openApp(app.url, app.name));
    sections.get(sectionName).appendChild(b);
  }
  const meta = document.getElementById('appsMeta');
  if (meta) meta.textContent = `${APPS.length} accesos · ${sections.size} secciones`;
}

async function refreshCatalog() {
  if (!window.officeExpress || typeof window.officeExpress.loadCatalog !== 'function') {
    setCatalogStatus('offline', 'Desconectado · usando apps guardadas');
    return false;
  }
  if (refreshCatalogButton) {
    refreshCatalogButton.disabled = true;
    refreshCatalogButton.classList.add('is-loading');
  }
  setCatalogStatus('checking', 'Buscando apps actualizadas…');
  try {
    const result = await window.officeExpress.loadCatalog();
    const apps = normalizeCatalog(result && result.apps);
    if (apps.length) {
      APPS = localCatalogOverride || apps;
      renderTiles();
      renderManagedApps();
    }
    if (result && result.online && apps.length) {
      setCatalogStatus('online', localCatalogOverride ? 'Conectado · cambios locales activos' : result.source === 'remote' ? 'Conectado · catálogo actualizado' : 'Conectado · usando apps guardadas');
      if (preloaderStatus) preloaderStatus.textContent = 'Apps actualizadas. Preparando la ventana…';
      return true;
    }
    setCatalogStatus('offline', 'Desconectado · apps de ejemplo disponibles');
    if (preloaderStatus) preloaderStatus.textContent = 'Sin internet. Abriremos tus apps guardadas…';
    return false;
  } catch (_) {
    if (localCatalogOverride) {
      APPS = localCatalogOverride;
      renderTiles();
      renderManagedApps();
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

function renderTabs(data) {
  tabstripEl.innerHTML = '';
  const active = data.tabs.find(t => t.id === data.activeTabId);
  activeIsHome = !active || active.isHome;
  homeView.classList.toggle('hidden', !activeIsHome);
  for (const tab of data.tabs) {
    const el = document.createElement('div');
    el.className = 'tab' + (tab.id === data.activeTabId ? ' active' : '');
    el.setAttribute('role', 'tab');
    const title = document.createElement('span');
    title.className = 'tab-title';
    title.textContent = tab.title;
    el.appendChild(title);
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'tab-close';
    close.setAttribute('aria-label', 'Cerrar pestaña');
    close.textContent = '×';
    close.addEventListener('click', (ev) => {
      ev.stopPropagation();
      window.officeExpress.closeTab(tab.id);
    });
    el.appendChild(close);
    el.addEventListener('click', () => window.officeExpress.activateTab(tab.id));
    tabstripEl.appendChild(el);
  }
  if (active) {
    addressBar.value = active.isHome
      ? 'Office Express — tus apps de Google en un solo lugar'
      : (active.url || active.title);
  }
}

window.officeExpress.onTabs(renderTabs);
window.officeExpress.onNavState((state) => {
  btnBack.disabled = !state.canGoBack;
  btnForward.disabled = !state.canGoForward;
  if (state.url && document.activeElement !== addressBar) addressBar.value = state.url;
});

btnBack.addEventListener('click', () => window.officeExpress.goBack());
btnForward.addEventListener('click', () => window.officeExpress.goForward());
btnReload.addEventListener('click', () => window.officeExpress.reload());
btnHome.addEventListener('click', () => window.officeExpress.goHome());
btnNewTab.addEventListener('click', () => window.officeExpress.goHome());
addressBar.addEventListener('focus', () => addressBar.select());
addressBar.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  window.officeExpress.navigate(addressBar.value);
});
document.querySelectorAll('.brand-credit a').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    window.officeExpress.openExternal(link.href);
  });
});

renderTiles();
renderManagedApps();
toggleCatalogManager.addEventListener('click', () => {
  const open = catalogManagerPanel.hidden;
  catalogManagerPanel.hidden = !open;
  toggleCatalogManager.setAttribute('aria-expanded', String(open));
});
appEditorForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(appEditorForm);
  const name = String(data.get('name') || '').trim();
  const id = editingAppId || appIdFromName(name);
  const url = String(data.get('url') || '').trim();
  try {
    const parsed = new URL(url);
    if (!/^[a-z0-9_-]{1,64}$/i.test(id) || parsed.protocol !== 'https:') throw new Error('Usa una dirección HTTPS válida.');
    if (!editingAppId && APPS.some((app) => app.id === id)) throw new Error('Ya existe una app con ese nombre/ID.');
    const entry = { id, name, section: String(data.get('section') || '').trim(), desc: String(data.get('desc') || '').trim(), url: parsed.href, color: String(data.get('color') || '#0e7490'), icon: String(data.get('icon') || 'link') };
    if (!entry.name || !entry.section) throw new Error('Completa nombre y sección.');
    const apps = editingAppId ? APPS.map((app) => app.id === editingAppId ? entry : app) : [...APPS, entry];
    if (saveCatalogOverride(apps, `${entry.name} se ${editingAppId ? 'actualizó' : 'agregó'} en este equipo.`)) resetAppEditor();
  } catch (error) { managerMessage.textContent = error.message || 'Revisa los datos de la app.'; }
});
document.getElementById('cancelAppEdit').addEventListener('click', resetAppEditor);
document.getElementById('exportCatalog').addEventListener('click', downloadCatalog);
document.getElementById('importCatalog').addEventListener('click', () => document.getElementById('catalogFile').click());
document.getElementById('catalogFile').addEventListener('change', (event) => {
  if (event.target.files && event.target.files[0]) importCatalogFile(event.target.files[0]);
  event.target.value = '';
});
document.getElementById('resetCatalog').addEventListener('click', () => {
  localStorage.removeItem(CATALOG_STORAGE_KEY);
  localCatalogOverride = null;
  resetAppEditor();
  refreshCatalog();
  managerMessage.textContent = 'Se quitó la copia local. Se cargará el catálogo publicado o el respaldo del instalador.';
});
setCatalogStatus('checking', 'Comprobando conexión…');
refreshCatalogButton && refreshCatalogButton.addEventListener('click', refreshCatalog);
window.addEventListener('offline', () => setCatalogStatus('offline', 'Desconectado · apps de ejemplo disponibles'));
window.addEventListener('online', refreshCatalog);
const initialCatalogLoad = refreshCatalog();
initialCatalogLoad.finally(finishPreloader);
window.officeExpress.ready();
