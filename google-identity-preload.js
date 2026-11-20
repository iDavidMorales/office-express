'use strict';
/**
 * google-identity-preload.js — identidad de Chrome para las pestañas.
 *
 * Se ejecuta al inicio de cada documento en las BrowserView de Office
 * Express. Google compara la identidad de la petición (User-Agent +
 * client hints) con la del JavaScript de la página (navigator.userAgentData
 * y window.chrome). En Electron, window.chrome es un objeto vacío y no hay
 * client hints, así que el sign-in puede rechazar el navegador aunque el
 * User-Agent ya sea el de Chrome. Este preload completa la identidad en el
 * mundo principal de la página, antes de que corran sus scripts.
 *
 * Solo actúa en hosts de Google (google.com, gstatic.com,
 * googleusercontent.com, googleapis.com). En cualquier otra página no
 * toca nada. Todo va envuelto en try/catch: si algo falla, la página
 * carga igual, sin el shim.
 *
 * No guarda ni lee contraseñas, no toca cookies ni sesiones: solo presenta
 * la identidad del Chromium que ya trae Electron (misma versión mayor).
 */
const { webFrame } = require('electron');

const GOOGLE_HOSTS = ['google.com', 'gstatic.com', 'googleusercontent.com', 'googleapis.com'];

function isGoogleHost(host) {
  try {
    const h = String(host || '').toLowerCase();
    return GOOGLE_HOSTS.some((d) => h === d || h.endsWith('.' + d));
  } catch (_) {
    return false;
  }
}

// Código que corre en el mundo principal de la página (worldId 0), al
// inicio del documento. Deriva la versión y la plataforma del propio
// User-Agent, que main.js ya fija como Chrome de escritorio.
const SHIM_CODE = `(function () {
  try {
    if (!/google\\.com$|gstatic\\.com$|googleusercontent\\.com$|googleapis\\.com$/.test(location.hostname || '')) return;
    var m = /Chrome\\/(\\d+)/.exec(navigator.userAgent || '');
    var major = m ? m[1] : '130';
    var ua = navigator.userAgent || '';
    var platform = /Macintosh/.test(ua) ? 'macOS' : (/Windows/.test(ua) ? 'Windows' : 'Linux');
    var brands = [
      { brand: 'Google Chrome', version: major },
      { brand: 'Chromium', version: major },
      { brand: 'Not-A.Brand', version: '99' }
    ];
    var uaData = {
      brands: brands,
      mobile: false,
      platform: platform,
      getHighEntropyValues: function () {
        return Promise.resolve({
          architecture: 'x86',
          bitness: '64',
          brands: brands,
          fullVersionList: brands.map(function (b) { return { brand: b.brand, version: b.version + '.0.0.0' }; }),
          mobile: false,
          model: '',
          platform: platform,
          platformVersion: platform === 'Windows' ? '15.0.0' : (platform === 'macOS' ? '14.7.0' : '6.8.0'),
          uaFullVersion: major + '.0.0.0',
          wow64: false
        });
      }
    };
    try {
      Object.defineProperty(navigator, 'userAgentData', { value: uaData, configurable: true, enumerable: true });
    } catch (_) { /* si no se puede redefinir, se deja el original */ }

    var chromeObj = window.chrome || {};
    if (!chromeObj.app) {
      chromeObj.app = {
        isInstalled: false,
        getDetails: function () { return null; },
        getIsInstalled: function () { return false; },
        installState: function () { return 'not_installed'; },
        runningState: function () { return 'cannot_run'; }
      };
    }
    if (!chromeObj.csi) {
      var t = Math.round(performance.now());
      chromeObj.csi = { startE: t, onloadT: t, pageT: t, tran: 15 };
    }
    if (typeof chromeObj.loadTimes !== 'function') {
      chromeObj.loadTimes = function () {
        var now = (performance.timing ? performance.timing.navigationStart : Date.now()) / 1000;
        return {
          requestTime: now, startLoadTime: now, commitLoadTime: now,
          finishDocumentLoadTime: now, finishLoadTime: now, firstPaintTime: 0,
          firstPaintAfterLoadTime: 0, navigationType: 'Other',
          wasFetchedViaSpdy: false, wasNpnNegotiated: true,
          npnNegotiatedProtocol: 'h2', wasAlternateProtocolAvailable: false,
          connectionInfo: 'h2'
        };
      };
    }
    if (!chromeObj.runtime) chromeObj.runtime = {};
    window.chrome = chromeObj;
  } catch (_) { /* nunca romper la carga por el shim */ }
})();`;

try {
  if (typeof location !== 'undefined' && isGoogleHost(location.hostname)) {
    webFrame.executeJavaScriptInIsolatedWorld(0, [{ code: SHIM_CODE }]);
  }
} catch (_) {
  // Sin webFrame (p. ej. preload con sandbox estricto): la página carga
  // igual, solo sin el shim de identidad JS. El UA y los client hints
  // siguen activos desde main.js.
}
