# Laboratorio 3 — REST API Blueprints (Parte 1 y Parte 2)

**Arquitecturas de Software (ARSW) — Escuela Colombiana de Ingeniería Julio Garavito**  
Java 21 · Spring Boot 3.3.9 · PostgreSQL · Spring Security (OAuth2 / JWT) · springdoc-openapi

Autores: **Diego Fabián Andrade** · **Juan Diego Melo**

API REST para gestionar planos arquitectónicos (*blueprints*): cada plano cuenta con un autor, un nombre y una secuencia ordenada de puntos `(x, y)`. Los datos se persisten en PostgreSQL (o repositorio en memoria), la API está protegida como **OAuth2 Resource Server** mediante **JSON Web Tokens (JWT)** firmados con **RS256**, y expone su documentación interactiva mediante Swagger/OpenAPI con soporte de autenticación Bearer.

---

## Requisitos

| Componente | Versión | Detalle |
|---|---|---|
| Java | 21 | JDK 21 LTS |
| Maven | 3.9+ | Incluido mediante el wrapper `./mvnw` |
| PostgreSQL | 16 | Vía Docker (`docker compose`) o instalación local |

---

## ⭐ Cómo cargar la base de datos

**La aplicación crea su propio esquema y carga los datos de ejemplo al arrancar.** Spring Boot ejecuta `src/main/resources/schema.sql` y `src/main/resources/data.sql` de forma idempotente con `spring.sql.init.mode=always`.

### Opción A — Docker (Recomendada)

```bash
docker compose up -d
```

Levanta el contenedor PostgreSQL 16 con usuario `blueprints`, contraseña `blueprints` y base `blueprints` en el puerto `5432`.

Para iniciar la aplicación:

```bash
./mvnw spring-boot:run
```

Para detener el contenedor al finalizar:

```bash
docker compose down
```

### Opción B — PostgreSQL Local

```sql
CREATE USER blueprints WITH PASSWORD 'blueprints';
CREATE DATABASE blueprints OWNER blueprints;
```

Variables de entorno configurables: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.

### Ejecución sin base de datos (Perfil `inmemory`)

```bash
./mvnw spring-boot:run "-Dspring-boot.run.profiles=inmemory"
```

---

## Compilar y Probar

```bash
./mvnw clean verify
```

En Windows PowerShell:
```powershell
.\mvnw.cmd clean verify
```

El build **no requiere base de datos obligatoria**: las pruebas de integración contra PostgreSQL se habilitan automáticamente si el motor responde, y se omiten sin fallar cuando no hay base de datos levantada.

---

## 🔐 Seguridad y Autenticación con JWT (OAuth 2.0)

La API opera como un **Resource Server OAuth2** validando tokens JWT firmados asimétricamente con **RS256** (RSA 2048 bits).

### 1. Usuarios en Memoria para Autenticación

| Usuario | Contraseña | Scopes Asignados |
|---|---|---|
| `student` | `student123` | `blueprints.read`, `blueprints.write` |
| `assistant` | `assistant123` | `blueprints.read`, `blueprints.write` |

### 2. Obtener Token de Acceso (`POST /auth/login`)

```bash
curl -i -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"student","password":"student123"}'
```

Respuesta `200 OK`:
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### 3. Consumo de Endpoints Protegidos con Bearer Token

```bash
curl -i http://localhost:8080/api/v1/blueprints \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

- Peticiones sin token o con token inválido devuelven `401 Unauthorized`.
- Peticiones con scopes insuficientes devuelven `403 Forbidden`.

---

## Documentación OpenAPI / Swagger UI

Con la aplicación en ejecución:

- **Swagger UI:** [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **OpenAPI JSON:** [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

> En Swagger UI, pulsa el botón **Authorize** e ingresa el token obtenido de `/auth/login` (o en formato `Bearer <token>`) para probar los endpoints interactivos.

---

## Endpoints

Ruta base: **`/api/v1/blueprints`**

| Método | Ruta | Scope Requerido | Descripción | Código Éxito |
|---|---|---|---|:---:|
| `POST` | `/auth/login` | *Público* | Iniciar sesión y emitir JWT | `200` |
| `GET` | `/api/v1/blueprints` | `blueprints.read` | Listar todos los planos | `200` |
| `GET` | `/api/v1/blueprints/{author}` | `blueprints.read` | Planos de un autor específico | `200` |
| `GET` | `/api/v1/blueprints/{author}/{name}` | `blueprints.read` | Obtener un plano específico | `200` |
| `POST` | `/api/v1/blueprints` | `blueprints.write` | Registrar un nuevo plano | `201` |
| `PUT` | `/api/v1/blueprints/{author}/{name}/points` | `blueprints.write` | Agregar un punto al final del plano | `202` |

---

## Formato de Respuesta: `ApiResponse<T>`

Todas las respuestas de negocio comparten la misma estructura:

```json
{
  "code": 200,
  "message": "execute ok",
  "data": [ ... ]
}
```

---

## Filtros de Planos

Se activan por perfiles de Spring Boot y se aplican en cadena ordenada:

| Perfil | Acción |
|---|---|
| *(ninguno)* | Retorna los puntos originales |
| `redundancy` | Elimina puntos consecutivos duplicados |
| `undersampling` | Conserva un punto de cada dos (submuestreo) |

Ejemplo:
```bash
./mvnw spring-boot:run "-Dspring-boot.run.profiles=redundancy,undersampling"
```

---

## Arquitectura

```
src/main/java/edu/eci/arsw/blueprints
  ├── model/         Blueprint, Point
  ├── dto/           ApiResponse<T>, NewBlueprintRequest
  ├── persistence/   BlueprintPersistence + Postgres/InMemory
  ├── services/      BlueprintsServices
  ├── filters/       BlueprintsFilter + Identity, Redundancy, Undersampling
  ├── controllers/   BlueprintsAPIController, GlobalExceptionHandler
  ├── auth/          AuthController
  ├── security/      SecurityConfig, MethodSecurityConfig, JwtKeyProvider, InMemoryUserService, RsaKeyProperties
  └── config/        OpenApiConfig
```

---

## Buenas Prácticas Aplicadas

1. **Seguridad Stateless con OAuth2 Resource Server:** Validación de JWT en cada petición sin estado de sesión en servidor (`SessionCreationPolicy.STATELESS`).
2. **Criptografía Asimétrica (RS256):** Firma con llave privada RSA y verificación de integridad y autenticidad con llave pública.
3. **Control de Acceso por Scopes:** Separación de privilegios de lectura (`blueprints.read`) y escritura (`blueprints.write`) mediante `@PreAuthorize`.
4. **Versionamiento de la API:** Ruta base `/api/v1/blueprints`.
5. **Respuesta uniforme:** Estandarización de formato mediante `ApiResponse<T>`.
6. **Desacoplamiento con DTOs:** Validación de entrada con `jakarta.validation`.
7. **Manejo Centralizado de Excepciones:** `GlobalExceptionHandler` mapeando errores a códigos HTTP `400`, `401`, `403`, `404`, `405`.
8. **Inversión de Dependencias y Modularidad:** Persistencia y filtros intercambiables mediante perfiles Spring.

---

## Pruebas Automatizadas

| Clase de Prueba | Objetivo | Requiere BD |
|---|---|:---:|
| `BlueprintsSmokeTest` | Carga del contexto Spring | No |
| `AuthControllerTest` | Autenticación y emisión de JWT en `/auth/login` | No |
| `BlueprintsAPIControllerTest` | Seguridad por scopes, MockMvc y contratos HTTP | No |
| `FiltersTest` | Lógica unitaria de filtros de redundancia y submuestreo | No |
| `BlueprintsServicesFilterTest` | Integración de filtros por perfiles Spring | No |
| `PostgresBlueprintPersistenceTest` | Persistencia real en PostgreSQL | **Sí** |

---

## Mapa de Actividades del Laboratorio

| Actividad | Implementación |
|---|---|
| 1. Familiarización con código base | Análisis y estructura modular del proyecto |
| 2. Persistencia en PostgreSQL + Docker | `PostgresBlueprintPersistence`, `schema.sql`, `data.sql`, `docker-compose.yml` |
| 3. Buenas prácticas REST | `/api/v1/blueprints`, `ApiResponse`, `NewBlueprintRequest`, `GlobalExceptionHandler` |
| 4. Documentación OpenAPI / Swagger | `OpenApiConfig`, esquemas y anotaciones `@Operation` |
| 5. Filtros de Blueprints | `IdentityFilter`, `RedundancyFilter`, `UndersamplingFilter`, perfiles Spring |
| 6. Seguridad JWT / OAuth 2.0 | `SecurityConfig`, `JwtKeyProvider`, `AuthController`, `@PreAuthorize` por scopes |
