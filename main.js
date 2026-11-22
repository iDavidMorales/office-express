'use strict';
/**
 * Office Express — navegador ligero (Electron/Chromium) para Google Workspace.
 * - Pantalla principal con mosaicos táctiles (estilo tablet).
 * - Cada app de Google se abre en su propia pestaña (BrowserView).
 * - Sesión persistente: el login de Google se guarda en el perfil de
 *   Electron del usuario y no se pierde al cerrar la app.
 * - Sin login propio y sin guardar contraseñas en la app.
 */
const { app, BrowserWindow, BrowserView, ipcMain, session, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const PARTITION = 'persist:office-express';
const HOME_URL = 'https://docs.google.com/document/u/0/';
const SMOKE_TEST = process.argv.includes('--smoke-test');
const SMOKE_OUT = process.env.SMOKE_OUT || '/tmp/office-express-smoke.json';

// --- Identidad de Chrome para el inicio de sesión con Google ---
// Google bloquea el sign-in desde navegadores embebidos ("This browser or
// app may not be secure", 403 disallowed_useragent). Pero un User-Agent de
// Chrome "pelado", sin más, también lo rechaza: Google compara la identidad
// de la petición (UA + client hints) con la del JavaScript de la página
// (navigator.userAgentData y window.chrome), y en Electron window.chrome
// es un objeto vacío y no hay client hints. Por eso se cubren las tres
// capas de forma consistente, con el Chromium real que trae Electron, sin
// inventar otro navegador:
//   1. UA de Chrome de escritorio con versión reducida (Chrome/<mayor>.0.0.0),
//      sin los tokens "Electron" ni de la app.
//   2. Cabeceras Sec-CH-UA (client hints) en las peticiones a Google.
//   3. navigator.userAgentData + window.chrome en las páginas de Google,
//      inyectados al inicio del documento (google-identity-preload.js).
// Advertencia honesta: es un objetivo móvil — Google puede endurecer la
// detección en el futuro; ver README, "Inicio de sesión con Google".
const CHROME_MAJOR = parseInt((process.versions.chrome || '130').split('.')[0], 10) || 130;
const CHROME_VERSION = `${CHROME_MAJOR}.0.0.0`;
const PLATFORM_TOKEN = process.platform === 'darwin'
  ? 'Macintosh; Intel Mac OS X 10_15_7'
  : process.platform === 'win32'
    ? 'Windows NT 10.0; Win64; x64'
    : 'X11; Linux x86_64';
const CHROME_UA = `Mozilla/5.0 (${PLATFORM_TOKEN}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROME_VERSION} Safari/537.36`;
const CH_PLATFORM = process.platform === 'darwin' ? 'macOS' : process.platform === 'win32' ? 'Windows' : 'Linux';

// Fallback para todos los webContents creados después de este punto.
app.userAgentFallback = CHROME_UA;

function configureGoogleSession() {
  const appSession = session.fromPartition(PARTITION);
  appSession.setUserAgent(CHROME_UA);
  // Client hints que Chrome envía con cada petición. Un UA completo de
  // Chrome sin client hints es una marca de navegador sintético.
  appSession.webRequest.onBeforeSendHeaders(
    { urls: ['*://*.google.com/*', '*://*.gstatic.com/*', '*://*.googleusercontent.com/*', '*://*.googleapis.com/*'] },
    (details, callback) => {
      const headers = details.requestHeaders;
      if (!headers['Sec-CH-UA']) {
        headers['Sec-CH-UA'] = `"Google Chrome";v="${CHROME_MAJOR}", "Chromium";v="${CHROME_MAJOR}", "Not-A.Brand";v="99"`;
      }
      if (!headers['Sec-CH-UA-Mobile']) headers['Sec-CH-UA-Mobile'] = '?0';
      if (!headers['Sec-CH-UA-Platform']) headers['Sec-CH-UA-Platform'] = `"${CH_PLATFORM}"`;
      callback({ requestHeaders: headers });
    }
  );
}

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
      || host === 'googleusercontent.com' || host.endsWith('.googleusercontent.com')
      // Muse API Team (baúl): sus enlaces se quedan dentro de la app.
      || host === 'muse-api-team.vercel.app';
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
      sandbox: true,
      preload: path.join(__dirname, 'google-identity-preload.js')
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
  configureGoogleSession();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  if (SMOKE_TEST) {
    // Prueba de humo + sonda de inicio de sesión con Google: verifica que
    // el home renderiza, que docs.google.com carga en una pestaña y que la
    // página de sign-in de Google muestra el formulario (no el bloqueo
    // "This browser or app may not be secure" / 403 disallowed_useragent).
    // También reporta la identidad que ve Google: User-Agent, client hints
    // (navigator.userAgentData) y window.chrome.
    const result = { homeReady: false, docsLoaded: false, docsUrl: '', docsTitle: '', probe: null, blocked: null, error: null };
    const deadline = setTimeout(() => {
      result.error = 'timeout esperando carga';
      finishSmoke(result, 1);
    }, 120000);
    deadline.unref();

    const PROBE_JS = `(() => {
      const txt = (document.body ? document.body.innerText : '').slice(0, 1500);
      const lower = txt.toLowerCase();
      let uaData = null;
      try {
        const d = navigator.userAgentData;
        uaData = d ? { brands: d.brands, mobile: d.mobile, platform: d.platform } : null;
      } catch (e) { uaData = { error: String(e) }; }
      return {
        url: location.href,
        title: document.title,
        userAgent: navigator.userAgent,
        uaData,
        chromeKeys: window.chrome ? Object.keys(window.chrome) : null,
        chromeApp: !!(window.chrome && window.chrome.app),
        chromeLoadTimes: !!(window.chrome && typeof window.chrome.loadTimes === 'function'),
        hasEmailInput: !!document.querySelector('input[type="email"]'),
        hasIdentifierInput: !!document.querySelector('input[name="identifier"]'),
        flowName: (new URLSearchParams(location.search).get('flowName') || ''),
        hasPasswordInput: !!document.querySelector('input[type="password"]'),
        bodyHasNotSecure: lower.includes('may not be secure')
          || lower.includes("couldn't sign you in")
          || lower.includes('no es seguro')
          || lower.includes('no se pudo iniciar sesión'),
        bodySnippet: txt.replace(/\\s+/g, ' ').slice(0, 500)
      };
    })()`;

    ipcMain.once('renderer-ready', () => {
      homeReady = true;
      result.homeReady = true;
      const tab = createTab(HOME_URL, 'Documentos');
      tab.view.webContents.once('did-finish-load', () => {
        result.docsLoaded = true;
        result.docsUrl = tab.view.webContents.getURL();
        result.docsTitle = tab.view.webContents.getTitle();
        // La página de sign-in renderiza su formulario de forma asíncrona;
        // esperar unos segundos antes de leer el contenido.
        setTimeout(() => {
          tab.view.webContents.executeJavaScript(PROBE_JS).then((probe) => {
            result.probe = probe;
            result.blocked = probe.bodyHasNotSecure && !probe.hasEmailInput && !probe.hasIdentifierInput;
            finishSmoke(result, result.blocked ? 2 : 0);
          }).catch((e) => {
            result.error = `probe falló: ${e && e.message ? e.message : e}`;
            finishSmoke(result, 1);
          });
        }, 6000);
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
