# CC Analytics — Backend API REST

Backend RESTful de la plataforma deportiva **CC Analytics (Colo-Colo)** para la asignatura **Desarrollo Fullstack II (Duoc UC)**.

## ¿Para qué sirve?
Reemplaza los datos simulados en memoria del frontend React (`cc-analytics-react`) por una **API REST real** conectada a una base de datos relacional SQLite (`cc_analytics.db`), con **autenticación por tokens JWT**, **control de permisos por rol (RBAC)** y documentación interactiva en **Swagger UI**.

## ¿Qué incluye?
- **Servidor y Base de Datos:** Node.js + Express + SQLite (`sql.js`) con 7 tablas relacionales (`usuarios`, `jugadores`, `directrices`, `partidos`, `formaciones`, `registros_medicos`, `tickets_soporte`) y carga inicial automática (`seed`).
- **Seguridad JWT y Roles (RBAC):**
  - `ADMIN` (`admin@colocolo.cl` / `colo2026`): Acceso total CRUD en todos los módulos.
  - `CUERPO_TECNICO` (`tecnico@colocolo.cl` / `tecnico2026`): Gestión operativa de directrices tácticas, formaciones y centro médico (sin borrados administrativos).
  - `ANALISTA_LECTURA` (`consulta@colocolo.cl` / `consulta2026`): Solo lectura en plantel, formaciones y calendario + creación de tickets en soporte (sin acceso clínico a `/medico`).
- **Rutas principales (`/api/v1` y `/api/v2`):**
  - `GET /api/health` — Estado del servidor y conteo base (pública).
  - `POST /api/v1/auth/login` y `GET /api/v1/auth/me` — Inicio de sesión JWT y validación de sesión activa (`F5`).
  - `/api/v1/jugadores` y `GET /api/v2/jugadores` — CRUD del plantel y listado v2 enriquecido con directrices y promedios.
  - `/api/v1/formaciones` — Esquemas y ajustes de la pizarra táctica.
  - `/api/v1/medico` — Fichas clínicas, fases y alta médica sincronizada con el plantel.
  - `/api/v1/partidos` — Calendario y fixture (`?tipo=proximo` / `anterior`).
  - `/api/v1/soporte` — Mesa de ayuda y gestión de tickets.
- **Documentación Swagger:** Interfaz interactiva disponible en `/api-docs` con autenticación Bearer JWT.
- **Pruebas automatizadas:** Suite con `node:test` (`tests/api.test.js`) usando base de datos aislada.

---

## Cómo ejecutarlo

### 1. Ejecutar solo el Backend (para probar la API y Swagger)
```bash
npm install
npm run dev
```
- Servidor activo en: `http://localhost:3001`
- Documentación Swagger: `http://localhost:3001/api-docs`
- Chequeo de salud: `http://localhost:3001/api/health`

Comandos útiles:
- `npm test` — Corre las 6 pruebas automatizadas sin tocar tu base real.
- `npm run seed` — Reinicia `cc_analytics.db` con los datos iniciales de fábrica.

### 2. Ejecutarlo junto al Frontend React (`cc-analytics-react`)
Necesitas **2 terminales** abiertas al mismo tiempo:
1. **Terminal 1 (Backend — puerto `3001`):**
   ```bash
   cd cc-analytics-backend
   npm run dev
   ```
2. **Terminal 2 (Frontend — puerto `5173`):**
   ```bash
   cd cc-analytics-react
   npm run dev
   ```
Luego abre `http://localhost:5173` en tu navegador.
