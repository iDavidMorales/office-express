'use strict';
/**
 * Preload — puente seguro entre el renderer y el proceso principal.
 * No expone Node al renderer: solo la API de Office Express.
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('officeExpress', {
  ready: () => ipcRenderer.send('renderer-ready'),
  openApp: (url, title) => ipcRenderer.send('open-app', { url, title }),
  activateTab: (id) => ipcRenderer.send('activate-tab', id),
  closeTab: (id) => ipcRenderer.send('close-tab', id),
  goHome: () => ipcRenderer.send('go-home'),
  goBack: () => ipcRenderer.send('nav-back'),
  goForward: () => ipcRenderer.send('nav-forward'),
  reload: () => ipcRenderer.send('nav-reload'),
  openExternal: (url) => ipcRenderer.send('open-external', url),
  loadCatalog: () => ipcRenderer.invoke('apps:load-catalog'),
  onTabs: (cb) => ipcRenderer.on('tabs-updated', (_e, data) => cb(data)),
  onNavState: (cb) => ipcRenderer.on('nav-state', (_e, data) => cb(data))
});
