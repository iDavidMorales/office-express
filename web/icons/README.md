# Iconos personalizados del catálogo

Sube aquí SVG o PNG (recomendado: 256 × 256 o 512 × 512, fondo transparente). Después indica la ruta en `web/apps.json` dentro de la app:

```json
{
  "id": "notion",
  "name": "Notion",
  "section": "Productividad",
  "desc": "Notas y proyectos",
  "url": "https://www.notion.so/",
  "color": "#111827",
  "icon": "link",
  "icon_url": "icons/notion.svg"
}
```

El camino `icon_url` es relativo a `web/apps.json`. Al guardar los archivos en GitHub, la versión web y Office Express los cargan del catálogo publicado. Si cambias un icono manteniendo el mismo nombre, agrega una versión como `?v=2` al final de `icon_url` para evitar caché. Si el archivo de imagen falla, se muestra el icono vectorial indicado en `icon`.

Usa archivos de icono propios o con permiso de uso. El catálogo acepta también una URL absoluta que empiece con `https://`.
