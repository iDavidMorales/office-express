# Office Express

Navegador ligero para Google Workspace: Documentos, Hojas de cálculo,
Presentaciones, Drive, Gmail, Calendar, Meet, Formularios y Keep en un
solo lugar, pensado para equipos sencillos y pantallas táctiles.

![Office Express](assets/icon.svg)

## Qué es

**App de escritorio (Electron/Chromium):** una ventana con mosaicos
grandes estilo tablet. Cada app de Google se abre en su propia pestaña
dentro de la app, con atrás / adelante / recargar y sesión persistente:
inicias sesión con tu cuenta de Google una vez y no se pierde al cerrar.

**Versión web (`web/`):** el mismo lanzador de mosaicos como sitio
estático para Vercel. Google no permite incrustar sus apps en un iframe
(`X-Frame-Options`), así que en la web cada mosaico abre su app en una
pestaña nueva del navegador. La app de escritorio sí las tiene dentro.

La app no tiene login propio y no guarda contraseñas: la sesión vive en
el perfil de Electron de cada usuario, en su propio equipo.

## Instalar (Windows y Mac)

1. Descarga el instalador de la última versión (Releases):
   - Windows: `Office Express Setup 1.0.0.exe` — instalador NSIS.
   - macOS: `Office Express-1.0.0.dmg` — arrastra la app a Aplicaciones.
2. Abre Office Express, toca una app e inicia sesión con tu cuenta
   de Google dentro de la app. Listo.

> **Aviso de instalador sin firmar:** los instaladores de la primera
> versión no están firmados con certificado. Windows (SmartScreen) y
> macOS (Gatekeeper) pueden mostrar una advertencia al abrirlos; hay que
> elegir "Ejecutar de todos modos" / "Abrir". Firmar los instaladores es
> un paso aparte que requiere certificados (Apple Developer y certificado
> de firma de código para Windows).

## Desarrollo

```bash
npm install
npm start
```

## Generar los instaladores

```bash
npm run dist        # Windows y Mac (según la plataforma)
npm run dist:win    # solo Windows (instalador NSIS)
npm run dist:mac    # solo macOS (dmg)
```

Los instaladores quedan en `dist/`.

> Nota: el icono `assets/icon.png` (512×512) se sube al repo por la web
> de GitHub, porque el push por API no admite archivos binarios. Sin él,
> `npm run dist` usa el icono por defecto de Electron. El vector
> `assets/icon.svg` sí está en el repo y es la fuente del logo.

## Versión web (Vercel)

La carpeta `web/` es un sitio estático listo para desplegar:

- **Desde el panel de Vercel:** importa el repo, pon el directorio raíz
  (`Root Directory`) en `web` y despliega. No necesita comando de build.
- **Desde la terminal:** `cd web && vercel` (o `vercel --prod`).

No se despliega solo con subir el repo: el despliegue se hace aparte
cuando se decida.

## Estructura

```
main.js            Proceso principal (ventana, pestañas, BrowserView)
preload.js         Puente seguro renderer <-> main
renderer/          Home táctil + pestañas (index.html, styles.css, renderer.js)
web/               Versión web estática (index.html, styles.css, app.js, vercel.json)
assets/icon.png    Logo de la app (512×512, se sube por web de GitHub)
assets/icon.svg    Logo en vector
```

## Licencia

MIT.
