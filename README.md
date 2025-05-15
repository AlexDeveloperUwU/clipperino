# Clipperino

Clipperino es una herramienta web para gestionar, seleccionar y exportar fragmentos ("clips") de transcripciones de audio o video. Permite importar archivos CSV con transcripciones, seleccionar líneas relevantes, agruparlas en clips personalizados y exportar estos clips en formato JSON o Markdown. También puedes importar y visualizar clips previamente exportados en formato JSON.

## Características principales

- **Importación de CSV**: Carga archivos CSV con transcripciones segmentadas por tiempo.
- **Selección de líneas**: Marca líneas específicas para crear clips personalizados.
- **Gestión de clips**: Asigna nombre, edita y elimina clips fácilmente.
- **Exportación**: Descarga tus clips en formato JSON o Markdown.
- **Visor de JSON**: Importa archivos JSON de clips y visualiza su contenido detalladamente.
- **Persistencia local**: Los datos se guardan automáticamente en el navegador (localStorage).

## Uso

1. **Importar transcripciones**: Haz clic en "Importar CSV" y selecciona tu archivo de transcripciones.
2. **Seleccionar líneas**: Marca las líneas que quieras incluir en un clip.
3. **Crear un clip**: Haz clic en "Añadir clip", ponle un nombre y guarda.
4. **Gestionar clips**: Edita el nombre o elimina clips desde la lista.
5. **Exportar**: Usa los botones para descargar tus clips en JSON o Markdown.
6. **Visor JSON**: Cambia a la pestaña "Visor JSON" para importar y explorar archivos de clips en formato JSON.

## Formato de CSV esperado

El archivo CSV debe tener al menos tres columnas: `inicio`, `fin` y `transcripcion`. Ejemplo:

```
Inicio (HH:MM:SS),Fin (HH:MM:SS),Transcripción
0:00:00,0:00:29, ¡Suscríbete al canal!
0:00:30,0:00:59, ¡Suscríbete al canal!
0:01:00,0:01:29, ¡Suscríbete al canal!
...
## Instalación y ejecución

No requiere instalación. Solo abre `index.html` en tu navegador favorito.

## Tecnologías utilizadas

- HTML, CSS (TailwindCSS), JavaScript
- FontAwesome para iconos
```
