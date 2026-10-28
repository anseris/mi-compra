# Mi compra

Aplicación full stack para guardar un catálogo personal de productos y preparar la lista de la compra con cálculo automático del total.

El proyecto sigue la misma arquitectura que `control-gastos-proyect`: frontend Angular, API REST con Express y base de datos MongoDB. No tiene cuentas ni inicio de sesión: es una aplicación de un solo usuario.

## Stack

- **Frontend:** Angular 21 (standalone components, rutas lazy, signals y `HttpClient`).
- **Backend:** Node.js + Express 5 + TypeScript.
- **Base de datos:** MongoDB con Mongoose 8.

## Estructura

```text
mi-compra/
├── backend/
│   ├── src/
│   │   ├── config/          # Conexión con MongoDB
│   │   ├── controllers/     # Lógica de cada recurso
│   │   ├── models/          # Esquemas de Mongoose
│   │   ├── routes/          # Endpoints de la API
│   │   ├── services/        # Datos iniciales y lógica reutilizable
│   │   ├── app.ts           # Configuración de Express
│   │   └── server.ts        # Arranque del servidor
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/        # API base, modelos y servicios
│   │   │   ├── features/    # productos y lista de la compra
│   │   │   ├── layout/      # Cabecera, hero, pestañas y pie
│   │   │   ├── shared/      # Utilidades compartidas
│   │   │   ├── app.config.ts
│   │   │   ├── app.routes.ts
│   │   │   └── app.component.ts
│   │   ├── main.ts
│   │   └── styles.css
│   ├── .gitignore
│   ├── angular.json
│   └── package.json
├── .gitignore
├── package.json
└── README.md
```

## Requisitos

- Node.js 22.12 o superior (Angular 21).
- npm.
- Una base de datos MongoDB local o una cuenta de MongoDB Atlas.

## Puesta en marcha

### 1. Instalar dependencias

```bash
npm run install:all
```

### 2. Configurar el backend

Copia `backend/.env.example` a `backend/.env` y rellena los valores:

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/miCompra
CORS_ORIGINS=http://localhost:4200,http://127.0.0.1:4200
```

> En este entorno ya existe un `backend/.env` apuntando a la base de datos `miCompra` de Atlas. No lo subas a Git: está incluido en `.gitignore`.

### 3. Arrancar el backend

```bash
npm run dev:backend
```

La API queda disponible en `http://localhost:3000/api` y el healthcheck en `http://localhost:3000/api/health`.

La primera vez que arranca, el backend crea las 9 categorías iniciales si la base de datos no tiene ninguna.

### 4. Arrancar el frontend

En otra terminal:

```bash
npm run dev:frontend
```

Abre `http://localhost:4200` y empieza a usar la aplicación; no hay pantalla de acceso.

> Si el puerto `3000` ya está ocupado por otro proyecto (por ejemplo `control-gastos-proyect`), detén ese backend o cambia `PORT` en `backend/.env` y la URL de `frontend/src/app/core/api-base.ts`.

## Scripts

Desde la raíz:

| Comando | Descripción |
| --- | --- |
| `npm run install:all` | Instala las dependencias del backend y del frontend. |
| `npm run dev:backend` | Arranca la API en modo desarrollo con recarga automática. |
| `npm run dev:frontend` | Arranca Angular en `http://localhost:4200`. |
| `npm run build` | Compila backend y frontend para producción. |
| `npm run typecheck` | Comprueba los tipos del backend. |

También puedes usar los scripts de cada carpeta: `npm run dev`, `npm run build` y `npm start` en `backend`; `npm start` y `npm run build` en `frontend`.

## API

Todas las rutas son públicas y no requieren cabeceras de autenticación.

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/api/health` | Comprueba que la API está funcionando. |
| `GET` | `/api/categorias` | Lista las categorías. |
| `GET` | `/api/secciones` | Lista las secciones y sus subsecciones. |
| `POST` | `/api/secciones` | Crea una sección. |
| `POST` | `/api/secciones/:id/subsecciones` | Añade una subsección a la sección indicada. |
| `POST` | `/api/categorias` | Crea una categoría. |
| `PUT` | `/api/categorias/:id` | Modifica una categoría. |
| `DELETE` | `/api/categorias/:id` | Elimina una categoría sin productos asociados. |
| `GET` | `/api/productos` | Lista el catálogo. |
| `POST` | `/api/productos` | Crea un producto. |
| `PUT` | `/api/productos/:id` | Modifica un producto. |
| `DELETE` | `/api/productos/:id` | Elimina un producto (la lista conserva sus artículos). |
| `GET` | `/api/lista?listaId=<id>` | Lista los artículos de la lista indicada (sin `listaId`, usa la predeterminada). |
| `GET` | `/api/listas` | Lista las listas guardadas; crea la predeterminada si no existe. |
| `POST` | `/api/listas` | Crea una lista con nombre. |
| `DELETE` | `/api/listas/:id` | Elimina una lista personalizada y sus artículos (no permite eliminar la predeterminada). |
| `POST` | `/api/lista` | Añade el `productoId` a la lista indicada por `listaId`; si ya está pendiente, suma cantidad. |
| `PATCH` | `/api/lista/:id?listaId=<id>` | Cambia la cantidad o el estado `comprado` del artículo de la lista indicada. |
| `DELETE` | `/api/lista/:id?listaId=<id>` | Quita un artículo de la lista indicada. |
| `DELETE` | `/api/lista/comprados?listaId=<id>` | Quita los artículos comprados de la lista indicada. |

## Modelo de datos

- **categorias:** nombre único, emoji y color.
- **secciones:** sección y sus subsecciones (Entrada/E1-E4, Centro/C1-C4, Fondo/F1 y secciones sin subsecciones).
- **productos:** nombre, precio, referencias a categoría y sección, y subsección opcional.
- **listas_compra:** nombre de cada lista y marca de lista predeterminada.
- **secciones:** sección, orden de presentación y subsecciones disponibles.
- **lista_compra:** referencia a la lista y al producto, copia de nombre/precio/categoría, cantidad y estado de comprado.

La lista guarda una **copia** de los datos del producto para que eliminar un producto del catálogo no rompa la compra en curso. Al editar un producto o una categoría, el backend sincroniza los artículos que ya están en la lista.

## Comportamiento de la aplicación

- Catálogo con búsqueda, filtro por categoría, edición y borrado.
- Productos clasificados por sección y subsección, con filtros dependientes en el catálogo.
- Creación de categorías propias; la base de datos recibe 9 categorías iniciales la primera vez.
- Lista de la compra con cantidades, marcado de comprados, búsqueda y totales.
- Filtros de lista por sección y subsección, además de categoría.
- Creación y selección de varias listas de compra, con sus artículos guardados por separado.
- Los cambios se guardan en MongoDB y se comparten entre dispositivos.

## Producción

1. Compila ambas partes con `npm run build`.
2. Sirve `frontend/dist/mi-compra/browser` con el servidor web que prefieras.
3. Publica el backend con `npm --prefix backend start`.
4. Configura `MONGODB_URI` y `CORS_ORIGINS` en el entorno del servidor.
5. Si el frontend y la API no comparten dominio, configura `API_HOST` al compilar el frontend y añade el dominio del frontend a `CORS_ORIGINS`.

## Despliegue en Render

El archivo `render.yaml` configura dos servicios: una API Node en `backend` y
una web estática Angular en `frontend`. En Render, crea un **Blueprint** desde
este repositorio. Cuando Render lo solicite, configura `MONGODB_URI` con la URI
de conexión de MongoDB Atlas. Si los servicios ya están creados, añade la misma
variable en **Dashboard → mi-compra-api → Environment** y guarda los cambios
para que Render vuelva a desplegar la API. No guardes esta URI en el repositorio.
Render solicitará también `CORS_ORIGINS`: indica el dominio HTTPS del servicio estático
(por ejemplo, `https://mi-compra-frontend.onrender.com`). El host de la API
(`API_HOST`) se enlaza automáticamente para el frontend.

La API requiere una base MongoDB accesible desde Render. Si usas MongoDB Atlas,
permite las conexiones entrantes desde Render en la configuración de Network
Access y utiliza un usuario de base de datos con acceso únicamente a la base
que necesita la aplicación.

El frontend se compila con configuración Angular de producción y publica
`frontend/dist/mi-compra/browser`. El backend escucha el puerto `PORT`
proporcionado por Render y expone `/api/health` como health check.

> La aplicación no tiene autenticación. Aunque CORS limita qué sitios web
> pueden llamar a la API desde un navegador, no impide que terceros accedan
> directamente a sus endpoints públicos. No guardes datos sensibles y considera
> incorporar autenticación antes de usarla con información privada.
#   m i - c o m p r a  
 