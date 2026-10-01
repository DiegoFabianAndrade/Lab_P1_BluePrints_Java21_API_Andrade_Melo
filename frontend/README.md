# Cliente React de Blueprints (Parte 5)

**Arquitecturas de Software (ARSW) — Escuela Colombiana de Ingeniería Julio Garavito**
React 18 · Vite 7 · Redux Toolkit · Axios · React Router · Vitest + Testing Library

Autores: **Diego Fabián Andrade** · **Juan Diego Melo**

SPA que consume la API REST de Blueprints de este mismo repositorio (Labs 3 y 4). El enunciado original del laboratorio está en [ENUNCIADO.md](./ENUNCIADO.md) y el glosario en [DEFINICIONES.md](./DEFINICIONES.md).

---

## Cómo arrancar

Requisitos: Node.js 18 o superior y el backend corriendo en `http://localhost:8080` (ver el [README raíz](../README.md)).

```bash
cd frontend
npm install
cp .env.example .env      # en PowerShell: Copy-Item .env.example .env
npm run dev
```

Abre `http://localhost:5173`.

### Variables de entorno

| Variable            | Valor por defecto       | Descripción                                                               |
| ------------------- | ----------------------- | ------------------------------------------------------------------------- |
| `VITE_API_BASE_URL` | `http://localhost:8080` | Raíz del backend REST (`/auth/login` y `/api/v1/blueprints`).             |
| `VITE_STOMP_BASE`   | `http://localhost:8080` | Endpoint base del broker WebSocket / STOMP (`/ws-blueprints`).            |
| `VITE_IO_BASE`      | `http://localhost:3001` | URL base del servidor Socket.IO (en caso de usar backend Node).           |
| `VITE_USE_MOCK`     | `false`                 | `true` usa `apimock` (memoria, sin backend); `false` usa `apiclient`.     |

Las variables `VITE_*` se leen en tiempo de build, así que después de cambiar el `.env` hay que reiniciar `npm run dev`.

### Tiempo Real (STOMP & Socket.IO)

El cliente incluye un selector de tecnología de tiempo real en la vista principal:
- **STOMP (Spring Boot WebSocket):** Conecta a `/ws-blueprints`, se suscribe a `/topic/blueprints.{author}.{name}` y publica puntos a `/app/draw` con payload `{ author, name, point: { x, y } }`.
- **Socket.IO (Node.js):** Conecta vía websocket, emite `join-room` a la sala `blueprints.{author}.{name}` y emite eventos `draw-event`.
- **Desactivado (Manual):** Modo borrador local con guardado manual (`addPoint` / `updatePoints`).

Al abrir dos pestañas sobre el mismo plano con STOMP activado, cualquier clic en el lienzo se refleja instantáneamente en ambas pantallas.

### Usuarios del backend

| Usuario     | Contraseña     |
| ----------- | -------------- |
| `student`   | `student123`   |
| `assistant` | `assistant123` |

En modo `apimock` el login acepta cualquier usuario y contraseña no vacíos.

---

## Contrato con el backend

El andamiaje del laboratorio asumía `GET /api/blueprints` y `POST /api/auth/login`. Nuestro backend expone un contrato distinto y el cliente se adaptó a él:

| Operación del servicio         | Método y ruta                                   | Scope              |
| ------------------------------ | ----------------------------------------------- | ------------------ |
| `login(username, password)`    | `POST /auth/login`                              | público            |
| `getAll()`                     | `GET /api/v1/blueprints`                        | `blueprints.read`  |
| `getByAuthor(author)`          | `GET /api/v1/blueprints/{author}`               | `blueprints.read`  |
| `getByAuthorAndName(a, n)`     | `GET /api/v1/blueprints/{author}/{name}`        | `blueprints.read`  |
| `create(blueprint)`            | `POST /api/v1/blueprints`                       | `blueprints.write` |
| `addPoint(author, name, p)`    | `PUT /api/v1/blueprints/{author}/{name}/points` | `blueprints.write` |
| `update(author, name, points)` | `PUT /api/v1/blueprints/{author}/{name}`        | `blueprints.write` |
| `remove(author, name)`         | `DELETE /api/v1/blueprints/{author}/{name}`     | `blueprints.write` |

Detalles que el cliente resuelve por su cuenta:

- El login devuelve `{ access_token, token_type, expires_in }`; el cliente guarda `access_token`.
- Todas las respuestas de negocio vienen envueltas en `{ code, message, data }`; `apiclient` desempaqueta `data`.
- El backend habilita CORS para `http://localhost:5173` y `http://localhost:4173` (configurable con `blueprints.cors.allowed-origins`).

---

## Arquitectura

```
frontend/
├─ src/
│  ├─ services/
│  │  ├─ httpClient.js         Axios + interceptores (JWT en cada petición, errores legibles)
│  │  ├─ apiclient.js          API REST real
│  │  ├─ apimock.js            Datos en memoria con la misma interfaz
│  │  └─ blueprintsService.js  Elige apimock o apiclient según VITE_USE_MOCK
│  ├─ features/
│  │  ├─ blueprints/blueprintsSlice.js  Thunks, loading/error por thunk, selectores memoizados
│  │  └─ auth/authSlice.js              Sesión JWT, rehidratada desde localStorage
│  ├─ components/
│  │  ├─ BlueprintCanvas.jsx   Lienzo 520×360 con encuadre automático y modo de dibujo
│  │  ├─ BlueprintTable.jsx    Tabla: nombre, número de puntos, Open (y Delete con sesión)
│  │  ├─ BlueprintForm.jsx     Formulario de creación con validación
│  │  ├─ ErrorBanner.jsx       Aviso de error con botón Reintentar
│  │  ├─ PrivateRoute.jsx      Redirige al login si no hay token
│  │  └─ TopBlueprints.jsx     Top 5 por puntos (selector memoizado)
│  ├─ pages/                   BlueprintsPage, NewBlueprintPage, BlueprintDetailPage, LoginPage, NotFound
│  ├─ store/index.js           configureStore + makeStore (reutilizado en pruebas)
│  └─ App.jsx, main.jsx, styles.css
├─ tests/                      Vitest + Testing Library
├─ Dockerfile, nginx.conf      Imagen estática servida por nginx con fallback de SPA
└─ .env.example, vite.config.js, vitest.config.js, eslint.config.js, .prettierrc
```

### Flujo principal

1. `BlueprintsPage` despacha `fetchAll` al montarse (alimenta el top 5).
2. El usuario escribe un autor y pulsa **Get blueprints** → `fetchByAuthor` → la tabla muestra nombre, número de puntos y **Open**.
3. **Open** despacha `fetchBlueprint`; el nombre del plano actual se lee del estado global con `selectCurrentName` y se pinta en un campo de texto de solo lectura. El lienzo dibuja segmentos consecutivos y marca cada punto.
4. Con sesión iniciada, **Dibujar puntos** activa el modo interactivo: cada click agrega un punto al borrador (línea punteada verde) y **Guardar** lo envía (`addPoint` si es uno, `updatePoints` si son varios).
5. **Delete** aplica un borrado optimista: la fila desaparece de inmediato y se restaura si el servidor responde con error.
6. **Nuevo blueprint** vive en `/blueprints/new`, protegida por `PrivateRoute`.

---

## Mapa de requerimientos del laboratorio

| Requerimiento                                  | Dónde está                                                                                     |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 1. Canvas con id propio y 520×360              | `components/BlueprintCanvas.jsx` (`id="blueprint-canvas"`)                                     |
| 2. Listar planos de un autor en tabla          | `pages/BlueprintsPage.jsx` + `components/BlueprintTable.jsx`                                   |
| 3. Open: nombre actual, puntos y dibujo        | `fetchBlueprint` → `selectCurrentName` → campo de texto; `BlueprintCanvas` dibuja              |
| 4. `apimock` / `apiclient` con misma interfaz  | `services/apimock.js`, `services/apiclient.js`, conmutación en `services/blueprintsService.js` |
| 5. Nombre actual desde Redux, sin tocar el DOM | `selectCurrentName`, componentes con props y estado                                            |
| 6. Estilos                                     | `styles.css` (tarjetas, tabla, botones, banner, responsive)                                    |
| 7. Pruebas unitarias                           | `tests/` (45 pruebas: canvas, formulario, página, slices, servicios, ruta protegida)           |

Actividades sugeridas implementadas: estados `loading/error` por thunk, selectores memoizados (top 5), `PrivateRoute`, CRUD completo con `PUT` y `DELETE`, borrado optimista con reversión, lienzo interactivo con **Guardar**, banner con **Reintentar**, GitHub Actions (`frontend-ci.yml`) y Docker.

---

## Scripts

| Script                  | Qué hace                                   |
| ----------------------- | ------------------------------------------ |
| `npm run dev`           | Servidor de desarrollo de Vite             |
| `npm run build`         | Build de producción en `dist/`             |
| `npm run preview`       | Sirve el build de producción               |
| `npm test`              | Vitest en modo `--run`                     |
| `npm run test:ui`       | Vitest en modo interactivo                 |
| `npm run test:coverage` | Cobertura (requiere `@vitest/coverage-v8`) |
| `npm run lint`          | ESLint 9 (flat config)                     |
| `npm run format`        | Prettier: escribe                          |
| `npm run format:check`  | Prettier: solo verifica (usado en CI)      |

---

## Docker

Desde la raíz del repositorio:

```bash
docker compose up -d --build
```

Levanta PostgreSQL, la API (`http://localhost:8080`) y el cliente (`http://localhost:5173`, nginx). La URL de la API se incrusta en el build del cliente mediante el argumento `VITE_API_BASE_URL` del `docker-compose.yml`.

Solo el cliente:

```bash
docker build -t blueprints-web --build-arg VITE_API_BASE_URL=http://localhost:8080 ./frontend
docker run --rm -p 5173:80 blueprints-web
```

---

## CI

`.github/workflows/frontend-ci.yml` se ejecuta en cada push o pull request que toque `frontend/` y corre, en orden: `npm ci`, Prettier (`format:check`), ESLint, Vitest y `vite build`. El `dist/` resultante se publica como artefacto del workflow.
