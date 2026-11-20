'use strict';
/**
 * Office Express — navegador ligero (Electron/Chromium) para Google Workspace.
 * - Pantalla principal con mosaicos táctiles (estilo tablet).
 * - Cada app de Google se abre en su propia pestaña (BrowserView).
 * - Sesión persistente: el login de Google se guarda en el perfil de
 *   Electron del usuario y no se pierde al cerrar la app.
 * - Sin login propio y sin guardar contraseñas en la app.
 */
const { app, BrowserWindow, BrowserView, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const PARTITION = 'persist:office-express';
const HOME_URL = 'https://docs.google.com/document/u/0/';
const SMOKE_TEST = process.argv.includes('--smoke-test');
const SMOKE_OUT = process.env.SMOKE_OUT || '/tmp/office-express-smoke.json';

// Altura (px) de la barra superior táctil (pestañas + navegación).
const CHROME_HEIGHT = 128;

app.setName('Office Express');
if (process.platform === 'win32') app.setAppUserModelId('com.officeexpress.app');

let win = null;
let tabs = []; // { id, title, url, view|null, isHome }
let activeTabId = null;
let tabSeq = 0;
let homeReady = false;

function allowedInApp(url) {
  try {
    const host = new URL(url).hostname;
    return host === 'google.com' || host.endsWith('.google.com')
      || host === 'gstatic.com' || host.endsWith('.gstatic.com')
      || host === 'googleusercontent.com' || host.endsWith('.googleusercontent.com');
  } catch (_) { return false; }
}

function sendTabs() {
  if (win && !win.isDestroyed()) {
    win.webContents.send('tabs-updated', {
      tabs: tabs.map(t => ({ id: t.id, title: t.title, url: t.url, isHome: t.isHome })),
      activeTabId
    });
  }
}

function layoutViews() {
  if (!win || win.isDestroyed()) return;
  const bounds = win.getContentBounds();
  const content = {
    x: 0,
    y: CHROME_HEIGHT,
    width: bounds.width,
    height: Math.max(0, bounds.height - CHROME_HEIGHT)
  };
  for (const t of tabs) {
    if (t.view) {
      if (t.id === activeTabId && !t.isHome) {
        t.view.setBounds(content);
        t.view.setAutoResize({ width: true, height: true });
      } else {
        t.view.setBounds({ x: 0, y: 0, width: 0, height: 0 });
      }
    }
  }
}

function sendNavState(tab) {
  if (!win || win.isDestroyed() || !tab || !tab.view) return;
  const wc = tab.view.webContents;
  win.webContents.send('nav-state', {
    canGoBack: wc.navigationHistory.canGoBack(),
    canGoForward: wc.navigationHistory.canGoForward(),
    url: wc.getURL(),
    title: wc.getTitle()
  });
}

function attachView(tab) {
  if (!tab.view || !win || win.isDestroyed()) return;
  if (!win.getBrowserViews().includes(tab.view)) win.addBrowserView(tab.view);
  const wc = tab.view.webContents;
  wc.removeAllListeners('did-navigate');
  wc.removeAllListeners('did-finish-load');
  wc.removeAllListeners('page-title-updated');
  wc.on('did-navigate', () => { tab.url = wc.getURL(); sendTabs(); sendNavState(tab); });
  wc.on('did-finish-load', () => { tab.url = wc.getURL(); tab.title = wc.getTitle() || tab.title; sendTabs(); sendNavState(tab); });
  wc.on('page-title-updated', (_e, title) => { tab.title = title; sendTabs(); });
  wc.setWindowOpenHandler(({ url }) => {
    if (allowedInApp(url)) {
      createTab(url);
    } else {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });
  layoutViews();
}

function createTab(url, title) {
  const id = ++tabSeq;
  const view = new BrowserView({
    webPreferences: {
      partition: PARTITION,
      contextIsolation: true,
      sandbox: true
    }
  });
  const tab = { id, title: title || 'Cargando…', url, view, isHome: false };
  tabs.push(tab);
  attachView(tab);
  activateTab(id);
  view.webContents.loadURL(url);
  return tab;
}

function createHomeTab() {
  const id = ++tabSeq;
  const tab = { id, title: 'Inicio', url: 'office-express://home', view: null, isHome: true };
  tabs.push(tab);
  return tab;
}

function activateTab(id) {
  const tab = tabs.find(t => t.id === id);
  if (!tab) return;
  activeTabId = id;
  if (win && !win.isDestroyed()) {
    for (const t of tabs) {
      if (t.view && win.getBrowserViews().includes(t.view)) win.removeBrowserView(t.view);
    }
    if (tab.view) attachView(tab);
    layoutViews();
  }
  sendTabs();
  if (tab.view) sendNavState(tab);
}

function closeTab(id) {
  const idx = tabs.findIndex(t => t.id === id);
  if (idx === -1) return;
  const [tab] = tabs.splice(idx, 1);
  if (tab.view) {
    if (win && !win.isDestroyed() && win.getBrowserViews().includes(tab.view)) {
      win.removeBrowserView(tab.view);
    }
    tab.view.webContents.destroy();
  }
  if (tabs.length === 0) createHomeTab();
  if (activeTabId === id) {
    activateTab(tabs[Math.max(0, idx - 1)].id);
  } else {
    layoutViews();
    sendTabs();
  }
}

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    title: 'Office Express',
    backgroundColor: '#0b3d5c',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  win.on('resize', layoutViews);
  win.on('closed', () => { win = null; });

  createHomeTab();
  activateTab(tabs[0].id);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  if (SMOKE_TEST) {
    // Prueba de humo: verifica que el home renderiza y que
    // docs.google.com carga dentro de una pestaña (BrowserView).
    const result = { homeReady: false, docsLoaded: false, docsUrl: '', docsTitle: '', error: null };
    const deadline = setTimeout(() => {
      result.error = 'timeout esperando carga';
      finishSmoke(result, 1);
    }, 90000);
    deadline.unref();

    ipcMain.once('renderer-ready', () => {
      homeReady = true;
      result.homeReady = true;
      const tab = createTab(HOME_URL, 'Documentos');
      tab.view.webContents.once('did-finish-load', () => {
        result.docsLoaded = true;
        result.docsUrl = tab.view.webContents.getURL();
        result.docsTitle = tab.view.webContents.getTitle();
        finishSmoke(result, 0);
      });
      tab.view.webContents.once('did-fail-load', (_e, code, desc) => {
        result.error = `did-fail-load ${code}: ${desc}`;
        finishSmoke(result, 1);
      });
    });
  }
});

let smokeFinished = false;
function finishSmoke(result, code) {
  if (smokeFinished) return;
  smokeFinished = true;
  try { fs.writeFileSync(SMOKE_OUT, JSON.stringify(result, null, 2)); } catch (_) {}
  // eslint-disable-next-line no-console
  console.log('[smoke-test]', JSON.stringify(result));
  app.exit(code);
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('renderer-ready', () => { homeReady = true; });
ipcMain.on('open-app', (_e, { url, title }) => { if (url) createTab(url, title); });
ipcMain.on('activate-tab', (_e, id) => activateTab(id));
ipcMain.on('close-tab', (_e, id) => closeTab(id));
ipcMain.on('go-home', () => {
  let home = tabs.find(t => t.isHome);
  if (!home) home = createHomeTab();
  activateTab(home.id);
});
ipcMain.on('nav-back', () => {
  const t = tabs.find(x => x.id === activeTabId);
  if (t && t.view && t.view.webContents.navigationHistory.canGoBack()) t.view.webContents.navigationHistory.goBack();
});
ipcMain.on('nav-forward', () => {
  const t = tabs.find(x => x.id === activeTabId);
  if (t && t.view && t.view.webContents.navigationHistory.canGoForward()) t.view.webContents.navigationHistory.goForward();
});
ipcMain.on('nav-reload', () => {
  const t = tabs.find(x => x.id === activeTabId);
  if (t && t.view) t.view.webContents.reload();
});
ipcMain.on('open-external', (_e, url) => { if (url) shell.openExternal(url); });
