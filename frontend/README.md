# Mi compra — Frontend Angular 21

Interfaz de la aplicación **Mi compra**. Consume la API del backend (`../backend`) y permite gestionar el catálogo de productos y la lista de la compra.

## Requisitos

- Node.js 22.12 o superior.
- El backend arrancado en `http://localhost:3000`.

## Ejecutar en local

```bash
npm install
npm start
```

Abre `http://localhost:4200`. La aplicación entra directamente al catálogo; no hay inicio de sesión.

Para comprobar la compilación de producción:

```bash
npm run build
```

## Estructura

```text
src/app/
├── core/
│   ├── models/          # Interfaces de la API
│   ├── services/        # Estado y llamadas HTTP por recurso
│   └── api-base.ts      # URL de la API
├── features/
│   ├── productos/       # Catálogo y formulario de productos
│   └── lista-compra/    # Lista de la compra y resumen
├── layout/              # Cabecera, hero, pestañas y pie
├── shared/              # Utilidades compartidas
├── app.config.ts
├── app.routes.ts
└── app.component.ts
```

## Funcionalidad

- Catálogo de productos con nombre, precio y categoría.
- Búsqueda, filtro por categoría, edición y borrado.
- Creación de categorías.
- Lista de la compra con cantidades, marcado de comprados, búsqueda y totales.
- Datos sincronizados con MongoDB mediante la API; `localStorage` no se usa para los datos de negocio.

## Configuración de la API

`src/app/core/api-base.ts` usa `http://localhost:3000/api` en desarrollo y `/api` en producción. Si cambias el puerto del backend, actualiza ese archivo.
