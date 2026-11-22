'use strict';
/* Office Express — renderer (Electron).
 * Home táctil estilo tablet + barra de pestañas con botones grandes.
 */
const APPS = [
  { id: 'docs', name: 'Documentos', desc: 'Escribe y edita documentos', url: 'https://docs.google.com/document/u/0/', color: '#0e7490', icon: 'doc' },
  { id: 'sheets', name: 'Hojas de cálculo', desc: 'Tablas y cálculos', url: 'https://sheets.google.com/', color: '#0f766e', icon: 'sheet' },
  { id: 'slides', name: 'Presentaciones', desc: 'Diapositivas', url: 'https://slides.google.com/', color: '#155e75', icon: 'slide' },
  { id: 'drive', name: 'Drive', desc: 'Tus archivos en la nube', url: 'https://drive.google.com/', color: '#0b3d5c', icon: 'drive' },
  { id: 'gmail', name: 'Gmail', desc: 'Tu correo', url: 'https://mail.google.com/', color: '#b45309', icon: 'mail' },
  { id: 'calendar', name: 'Calendar', desc: 'Agenda y recordatorios', url: 'https://calendar.google.com/', color: '#1d4ed8', icon: 'calendar' },
  { id: 'meet', name: 'Meet', desc: 'Videollamadas', url: 'https://meet.google.com/', color: '#047857', icon: 'meet' },
  { id: 'forms', name: 'Formularios', desc: 'Encuestas y formularios', url: 'https://forms.google.com/', color: '#6d28d9', icon: 'form' },
  { id: 'keep', name: 'Keep', desc: 'Notas rápidas', url: 'https://keep.google.com/', color: '#a16207', icon: 'keep' },
  { id: 'muse-api-team', name: 'Muse API Team', desc: 'Conecta tu IA al baúl', url: 'https://muse-api-team.vercel.app/', color: '#0f6b70', icon: 'muse' }
];

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
  muse: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>'
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

let activeIsHome = true;

function renderTiles() {
  tilesEl.innerHTML = '';
  for (const app of APPS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tile';
    b.style.setProperty('--tile-color', app.color);
    b.innerHTML = '<span class="tile-icon">' + ICONS[app.icon] + '</span>'
      + '<span class="tile-name">' + app.name + '</span>'
      + '<span class="tile-desc">' + app.desc + '</span>';
    b.addEventListener('click', () => window.officeExpress.openApp(app.url, app.name));
    tilesEl.appendChild(b);
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
    addressBar.textContent = active.isHome
      ? 'Office Express — tus apps de Google en un solo lugar'
      : (active.url || active.title);
  }
}

window.officeExpress.onTabs(renderTabs);
window.officeExpress.onNavState((state) => {
  btnBack.disabled = !state.canGoBack;
  btnForward.disabled = !state.canGoForward;
  if (state.url) addressBar.textContent = state.url;
});

btnBack.addEventListener('click', () => window.officeExpress.goBack());
btnForward.addEventListener('click', () => window.officeExpress.goForward());
btnReload.addEventListener('click', () => window.officeExpress.reload());
btnHome.addEventListener('click', () => window.officeExpress.goHome());
btnNewTab.addEventListener('click', () => window.officeExpress.goHome());

renderTiles();
window.officeExpress.ready();
