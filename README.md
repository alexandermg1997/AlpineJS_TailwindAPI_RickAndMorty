# Rick & Morty Explorer

Aplicacion frontend construida con Alpine.js y Tailwind CSS para explorar personajes de la API de Rick and Morty.

## Caracteristicas

- Carga automatica de personajes al abrir la pagina.
- Busqueda por nombre y filtros por estado, genero y especie.
- Paginacion con estado sincronizado en la URL.
- Modal de detalle por personaje.
- Favoritos persistidos en `localStorage`.
- Interfaz responsive con estados de carga, error y vacio.

## Scripts

- `npm run dev`: recompila `final.css` en modo watch.
- `npm run build`: genera `final.css` optimizado para produccion.

## Stack

- Alpine.js via CDN.
- Tailwind CSS v4.
- Rick and Morty API.
