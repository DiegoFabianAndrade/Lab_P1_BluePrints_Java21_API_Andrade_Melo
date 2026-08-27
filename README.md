# Laboratorio 3 — REST API Blueprints

**Arquitecturas de Software (ARSW) — Escuela Colombiana de Ingeniería Julio Garavito**
Java 21 · Spring Boot 3.3.9 · PostgreSQL · springdoc-openapi

Autores: **Diego Fabián Andrade** · **Juan Diego Melo**

API REST para gestionar *blueprints* (planos): cada plano tiene un autor, un nombre y una
secuencia ordenada de puntos `(x, y)`. Los datos se persisten en PostgreSQL y la API expone su
documentación con OpenAPI/Swagger.

---

## Requisitos

| | Versión | Nota |
|---|---|---|
| Java | 21 | |
| Maven | 3.9+ | **no hace falta instalarlo**: el repositorio incluye el wrapper `./mvnw` |
| PostgreSQL | 16 | vía Docker o instalación nativa |

---

## ⭐ Cómo cargar la base de datos

> Esta es la sección a seguir para evaluar el laboratorio.

**La aplicación crea su propio esquema y carga los datos de ejemplo al arrancar.** No hay que
ejecutar ningún script a mano: basta con que exista una base de datos vacía. De eso se encarga
Spring Boot con `spring.sql.init.mode=always`, ejecutando `src/main/resources/schema.sql` y
`src/main/resources/data.sql`. Ambos son idempotentes, así que arrancar varias veces no duplica
datos ni produce errores.

### Opción A — Docker (recomendada)

```bash
docker compose up -d
```

Eso levanta PostgreSQL 16 con la base `blueprints`, usuario `blueprints` y contraseña
`blueprints` en el puerto `5432`, que es justo lo que espera `application.properties`.

Luego se arranca la aplicación:

```bash
./mvnw spring-boot:run
```

Al terminar:

```bash
docker compose down
```

(`docker compose down -v` detiene y además borra los datos.)

### Opción B — PostgreSQL instalado localmente

Si no se dispone de Docker, se crea una vez la base y el usuario:

```sql
CREATE USER blueprints WITH PASSWORD 'blueprints';
CREATE DATABASE blueprints OWNER blueprints;
```

Y se arranca la aplicación igual que en la opción A. Si los datos de conexión son distintos, se
sobrescriben con variables de entorno, sin tocar el código:

| Variable | Valor por defecto |
|---|---|
| `DB_HOST` | `localhost` |
| `DB_PORT` | `5432` |
| `DB_NAME` | `blueprints` |
| `DB_USER` | `blueprints` |
| `DB_PASSWORD` | `blueprints` |

### Verificar que los datos quedaron cargados

```bash
docker exec -it blueprints-db psql -U blueprints -d blueprints -c "SELECT * FROM blueprints;"
```

```bash
docker exec -it blueprints-db psql -U blueprints -d blueprints -c "SELECT * FROM blueprint_points ORDER BY author, name, point_index;"
```

### Ejecutar sin base de datos

Para revisar la API sin levantar PostgreSQL existe el perfil `inmemory`, que usa el repositorio
en memoria:

```bash
./mvnw spring-boot:run "-Dspring-boot.run.profiles=inmemory"
```

---

## Compilar y probar

```bash
./mvnw clean verify
```

En Windows: `.\mvnw.cmd clean verify`

El build **no requiere base de datos**: las pruebas de integración contra PostgreSQL se omiten
automáticamente si no hay un servidor escuchando, y se ejecutan solas cuando sí lo hay.

---

## Documentación de la API

Con la aplicación en ejecución:

- **Swagger UI** — <http://localhost:8080/swagger-ui.html>
- **OpenAPI JSON** — <http://localhost:8080/v3/api-docs>

---

## Endpoints

Ruta base: **`/api/v1/blueprints`**

| Método | Ruta | Descripción | Éxito |
|---|---|---|---|
| `GET` | `/api/v1/blueprints` | Todos los planos | `200` |
| `GET` | `/api/v1/blueprints/{author}` | Planos de un autor | `200` |
| `GET` | `/api/v1/blueprints/{author}/{name}` | Un plano concreto | `200` |
| `POST` | `/api/v1/blueprints` | Registrar un plano nuevo | `201` |
| `PUT` | `/api/v1/blueprints/{author}/{name}/points` | Agregar un punto al final | `202` |

### Ejemplos

```bash
curl http://localhost:8080/api/v1/blueprints/john/house
```

```bash
curl -i -X POST http://localhost:8080/api/v1/blueprints -H 'Content-Type: application/json' -d '{"author":"john","name":"kitchen","points":[{"x":1,"y":1},{"x":2,"y":2}]}'
```

```bash
curl -i -X PUT http://localhost:8080/api/v1/blueprints/john/kitchen/points -H 'Content-Type: application/json' -d '{"x":3,"y":3}'
```

---

## Respuesta uniforme: `ApiResponse<T>`

**Todas** las respuestas —exitosas y de error— comparten la misma estructura:

```java
public record ApiResponse<T>(int code, String message, T data) { }
```

```json
{ "code": 200, "message": "execute ok", "data": { "author": "john", "name": "house", "points": [] } }
```

```json
{ "code": 404, "message": "Blueprint not found: john/nada", "data": null }
```

```json
{ "code": 400, "message": "datos invalidos", "data": { "author": "el autor es obligatorio" } }
```

---

## Códigos HTTP

| Código | Cuándo |
|---|---|
| `200 OK` | Consulta resuelta |
| `201 Created` | Plano creado (incluye cabecera `Location`) |
| `202 Accepted` | Punto agregado |
| `400 Bad Request` | Validación fallida, JSON mal formado o plano duplicado |
| `404 Not Found` | Autor, plano o ruta inexistente |
| `405 Method Not Allowed` | La ruta existe pero no admite ese método |
| `500 Internal Server Error` | Error no previsto (se registra en el log; no se expone el detalle) |

Todos se producen en `GlobalExceptionHandler`, anotado con `@RestControllerAdvice`.

---

## Filtros de puntos

Reducen la cantidad de puntos devueltos y se activan por perfil de Spring:

| Perfil | Efecto |
|---|---|
| *(ninguno)* | Devuelve los puntos sin modificar |
| `redundancy` | Elimina puntos consecutivos duplicados |
| `undersampling` | Conserva uno de cada dos puntos |

```bash
./mvnw spring-boot:run "-Dspring-boot.run.profiles=redundancy"
```

Los perfiles **se pueden combinar**. `BlueprintsServices` recibe una `List<BlueprintsFilter>` y
aplica todos los filtros activos encadenados, en el orden fijado con `@Order`:

```
(0,0) (0,0) (1,1) (1,1) (2,2) (3,3)     6 puntos — sin filtros
(0,0) (1,1) (2,2) (3,3)                 4 puntos — redundancy
(0,0) (1,1) (2,2)                       3 puntos — undersampling
(0,0) (2,2)                             2 puntos — ambos encadenados
```

---

## Arquitectura

```
src/main/java/edu/eci/arsw/blueprints
  ├── model/         Blueprint, Point
  ├── dto/           ApiResponse<T>, NewBlueprintRequest
  ├── persistence/   BlueprintPersistence (contrato) + excepciones
  │    └── impl/     InMemoryBlueprintPersistence, PostgresBlueprintPersistence
  ├── services/      BlueprintsServices
  ├── filters/       BlueprintsFilter + Identity, Redundancy, Undersampling
  ├── controllers/   BlueprintsAPIController, GlobalExceptionHandler
  └── config/        OpenApiConfig
```

### Modelo de datos

```
blueprints(author, name)                                PK (author, name)
blueprint_points(id, author, name, point_index, x, y)   FK -> blueprints
                                                        UNIQUE (author, name, point_index)
```

`point_index` **preserva el orden** de los puntos. Un plano es una *secuencia*, no un conjunto:
si el orden se pierde, la figura cambia y los filtros dejan de tener sentido.

---

## Buenas prácticas aplicadas

**1. Versionamiento de la API.** La ruta base es `/api/v1/blueprints`. Un cambio futuro de
contrato puede publicarse como `/api/v2` sin romper a los clientes existentes.

**2. Contrato de respuesta uniforme.** El record genérico `ApiResponse<T>` evita que el cliente
tenga que adivinar la forma de la respuesta según el caso: siempre encuentra `code`, `message` y
`data`. Los errores usan el mismo sobre que los éxitos.

**3. DTOs separados del dominio.** `NewBlueprintRequest` define qué puede enviar el cliente, con
independencia de la entidad `Blueprint`. Sus anotaciones de validación rechazan peticiones mal
formadas con `400` antes de que lleguen a la capa de servicios.

**4. Manejo de errores centralizado.** `GlobalExceptionHandler` traduce cada excepción a su
código HTTP. El controlador quedó sin bloques `try/catch` y la lógica de cada endpoint es una
sola línea. El manejador genérico de `Exception` registra la traza completa en el log pero
devuelve un mensaje genérico, para no filtrar detalles internos.

**5. Inversión de dependencias en la persistencia.** La migración a PostgreSQL **no modificó la
interfaz `BlueprintPersistence`**: se añadió otra implementación y ni los servicios ni el
controlador se enteraron del cambio. Ese es el valor de programar contra abstracciones.

**6. Configuración externalizada.** Las credenciales admiten sobrescritura por variables de
entorno, así que el mismo artefacto sirve en distintos entornos sin recompilar.

**7. Filtros componibles.** Los filtros se inyectan como `List<BlueprintsFilter>` y se aplican
encadenados. Agregar un filtro nuevo no obliga a tocar `BlueprintsServices`.

**8. Pruebas que no dependen del entorno.** Las pruebas de la capa web corren con el perfil
`inmemory`, y las de persistencia se omiten solas cuando no hay base de datos. `mvn clean install`
funciona en cualquier máquina, con o sin PostgreSQL.

---

## Pruebas

| Clase | Qué verifica | Requiere BD |
|---|---|---|
| `BlueprintsSmokeTest` | El contexto de Spring se construye | no |
| `FiltersTest` | Lógica de cada filtro de forma aislada | no |
| `BlueprintsServicesFilterTest` | Encadenamiento de filtros por perfil | no |
| `BlueprintsAPIControllerTest` | Contrato HTTP con MockMvc: rutas, códigos y sobre | no |
| `PostgresBlueprintPersistenceTest` | Persistencia real contra PostgreSQL | **sí** |

---

## Evidencias

En [`docs/EVIDENCIAS.md`](docs/EVIDENCIAS.md): transcripciones reales de peticiones HTTP con sus
códigos de estado y demostración de los filtros. Las capturas de Swagger UI están en
[`docs/evidencias/`](docs/evidencias/).

---

## Mapa de las actividades del laboratorio

| Actividad | Dónde quedó implementada |
|---|---|
| 1. Familiarización con el código base | — |
| 2. Migración a PostgreSQL | `persistence/impl/PostgresBlueprintPersistence.java`, `schema.sql`, `data.sql`, `docker-compose.yml` |
| 3. Buenas prácticas REST | `dto/ApiResponse.java`, `controllers/BlueprintsAPIController.java`, `controllers/GlobalExceptionHandler.java` |
| 4. OpenAPI / Swagger | `config/OpenApiConfig.java` y anotaciones `@Operation` del controlador |
| 5. Filtros de blueprints | `filters/`, `services/BlueprintsServices.java` |
