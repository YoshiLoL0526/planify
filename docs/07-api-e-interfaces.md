# 07 · API e interfaces

La app no expone una API pública en el MVP. Este documento define la **interfaz interna** entre el cliente y el servidor, útil como contrato durante la implementación.

## 7.1 Convenciones

- Base: `/api/*` para Route Handlers. Las mutaciones de formularios simples se implementan como **Server Actions**.
- Formato: JSON; fechas en ISO 8601 UTC; IDs `cuid`.
- Autenticación: cookie de sesión (`httpOnly`) gestionada por better-auth. Sin cabeceras de API key en el MVP.
- Paginación: por cursor (`?cursor=…&limit=…`, máx. 50) con `nextCursor` en la respuesta.
- Errores uniformes:

```json
{ "error": { "code": "FORBIDDEN", "message": "No tienes permiso para editar este proyecto.", "details": {} } }
```

| HTTP | `code` | Significado |
|------|--------|-------------|
| 400 | `VALIDATION` | Entrada inválida (Zod). |
| 401 | `UNAUTHENTICATED` | Sin sesión válida. |
| 403 | `FORBIDDEN` | Con sesión, sin permiso. |
| 404 | `NOT_FOUND` | No existe o no es visible para el usuario. |
| 409 | `CONFLICT` | Revisión desactualizada. |
| 413 | `PAYLOAD_TOO_LARGE` | Subida > 20 MB / escena > 10 MB. |
| 429 | `RATE_LIMITED` | Límite de peticiones. |
| 500 | `INTERNAL` | Error no controlado (logueado en servidor). |

## 7.2 Autenticación (gestionada por better-auth)

Montadas en `/api/auth/*` y consumidas con su cliente (`authClient`):

| Endpoint | Uso |
|----------|-----|
| `POST /api/auth/sign-up/email` | Registro (RF-101). |
| `POST /api/auth/sign-in/email` | Inicio de sesión (RF-102). |
| `POST /api/auth/sign-out` | Cierre de sesión (RF-103). |
| `GET /api/auth/get-session` | Sesión actual (usado por RSC y layouts). |
| `POST /api/auth/change-password` | Cambio de contraseña (RF-104). |
| `POST /api/auth/update-user` | Cambio de nombre/email (RF-1001). |

## 7.3 Endpoints propios

Leyenda de implementación: **[R]** Route Handler · **[A]** Server Action.

### Proyectos

| Método y ruta | Descripción | Implementación |
|---|---|---|
| `GET /api/projects?view=active\|favorites\|recent\|archived&folderId&tagId&cursor` | Lista paginada de proyectos del usuario (con rol, favorito y nº de documentos). | [R] |
| `POST /api/projects` | Crear proyecto `{ name, description?, folderId?, tagIds? }`. | [A] |
| `GET /api/projects/{id}` | Detalle + rol del usuario. | RSC |
| `PATCH /api/projects/{id}` | Editar `{ name?, description?, folderId?, status? }`. | [A] |
| `DELETE /api/projects/{id}` | Eliminar `{ confirmName }` (debe coincidir con el nombre). | [A] |
| `PATCH /api/projects/{id}/favorite` | `{ favorite: boolean }`. | [A] |
| `POST /api/projects/{id}/touch` | Actualiza `last_opened_at` (fire-and-forget). | [R] |

### Carpetas y etiquetas

| Método y ruta | Descripción | Implementación |
|---|---|---|
| `POST/PATCH/DELETE /api/folders[/{id}]` | CRUD de carpetas del usuario. | [A] |
| `POST/PATCH/DELETE /api/tags[/{id}]` | CRUD de etiquetas del usuario. | [A] |

### Miembros e invitaciones

| Método y ruta | Descripción | Implementación |
|---|---|---|
| `POST /api/projects/{id}/members` | Agregar miembro `{ email, role }`. Si no existe el usuario, devuelve `{ invitationUrl }` para copiar (CU-09). | [A] |
| `PATCH /api/projects/{id}/members/{memberId}` | Cambiar rol `{ role }` (RF-806). | [A] |
| `DELETE /api/projects/{id}/members/{memberId}` | Quitar miembro (bloquea al último owner). | [A] |
| `POST /api/projects/{id}/invitations` | Crear enlace `{ role, expiresInDays }` → `{ url, expiresAt }` (RF-802). | [A] |
| `DELETE /api/invitations/{id}` | Revocar invitación (RF-803). | [A] |
| `GET /api/invitations/{token}` | Vista previa pública: proyecto, rol, caducidad y estado. | [R] |
| `POST /api/invitations/{token}/accept` | Aceptar e incorporarse (RF-804). | [A] |

### Documentos

| Método y ruta | Descripción | Implementación |
|---|---|---|
| `GET /api/projects/{id}/documents` | Lista de documentos (título, tipo, autor, actualizado, miniatura). | RSC |
| `POST /api/projects/{id}/documents` | Crear `{ type: "NOTE"\|"DIAGRAM" }`. | [A] |
| `PATCH /api/documents/{id}` | Renombrar `{ title }`. | [A] |
| `PATCH /api/documents/{id}/content` | **Autoguardado** (ver 7.4). | [R] |
| `DELETE /api/documents/{id}` | Eliminar documento. | [A] |

### Comentarios

| Método y ruta | Descripción | Implementación |
|---|---|---|
| `GET /api/documents/{id}/threads?status=open\|resolved\|all` | Hilos con sus mensajes y autores. | [R] |
| `POST /api/documents/{id}/threads` | Crear hilo `{ body, anchor? }` (RF-701). | [A] |
| `PATCH /api/threads/{id}` | `{ status: "RESOLVED"\|"OPEN" }` (RF-703). | [A] |
| `POST /api/threads/{id}/comments` | Responder `{ body }`. | [A] |
| `PATCH /api/comments/{id}` | Editar mensaje propio `{ body }`. | [A] |
| `DELETE /api/comments/{id}` | Borrar mensaje propio (o hilo por el owner). | [A] |

### Archivos

| Método y ruta | Descripción | Implementación |
|---|---|---|
| `POST /api/files` | Subida `multipart/form-data`: `file`, `projectId`, `kind` → `{ id, url }`. | [R] |
| `GET /api/files/{id}` | Sirve el archivo si el usuario es miembro del proyecto (cabeceras privadas). | [R] |
| `DELETE /api/files/{id}` | Elimina asset (subidor u owner). | [A] |

### Búsqueda, notificaciones, enlaces y salud

| Método y ruta | Descripción | Implementación |
|---|---|---|
| `GET /api/search?q=&type=&folderId=&tagId=&status=` | Búsqueda global agrupada (RF-303); mínimo 2 caracteres, límite 50 por grupo. | [R] |
| `GET /api/notifications?cursor` | Lista + contador de no leídas. | [R] |
| `PATCH /api/notifications/{id}` | Marcar lectura `{ read: true }`. | [A] |
| `POST /api/notifications/read-all` | Marcar todas. | [A] |
| `GET /api/link-preview?url=` | Metadatos OpenGraph (RF-505). | [R] |
| `GET /api/health` | `{ status: "ok", db: true, version }` para el healthcheck de Docker. | [R] |

## 7.4 Contratos clave

### Autoguardado de nota

```http
PATCH /api/documents/clx123/content
{ "type": "NOTE", "revision": 7, "contentJson": { "type": "doc", "content": [ … ] } }
```

**200:**

```json
{ "revision": 8, "updatedAt": "2026-10-06T18:22:11.000Z" }
```

**409 (conflicto):**

```json
{ "error": { "code": "CONFLICT", "message": "Otra persona guardó cambios.",
  "details": { "currentRevision": 9, "updatedBy": "Ana", "updatedAt": "2026-10-06T18:20:03.000Z" } } }
```

### Autoguardado de diagrama

```http
PATCH /api/documents/clx456/content
{ "type": "DIAGRAM", "revision": 3,
  "scene": { "elements": [ … ], "appState": { "viewBackgroundColor": "#ffffff", "zoom": { "value": 1 } } },
  "assets": { "excalidrawFileId1": "asset_789" },
  "thumbnailFileId": "asset_790" }
```

Mismas respuestas `200`/`409`. El servidor rechaza escenas > 10 MB (`413`) y valida `assets` contra los archivos del proyecto.

### Crear invitación

```http
POST /api/projects/clx789/invitations
{ "role": "EDITOR", "expiresInDays": 7 }
```

**201:**

```json
{ "id": "inv_01", "url": "https://planify.local/invite/8f3a…", "role": "EDITOR",
  "expiresAt": "2026-10-13T18:00:00.000Z" }
```

### Búsqueda

**200:**

```json
{
  "groups": [
    { "type": "project", "items": [ { "id": "…", "title": "App de recetas", "snippet": "…", "projectId": "…" } ] },
    { "type": "note", "items": [ { "id": "…", "title": "Idea general", "snippet": "…comprar dominio…", "projectId": "…" } ] }
  ],
  "nextCursor": null
}
```

### Subida de archivo

```json
POST /api/files   (multipart: file=@foto.png, projectId=clx789, kind=IMAGE)
→ 201 { "id": "asset_789", "url": "/api/files/asset_789", "width": 1200, "height": 800 }
```

## 7.5 Notas de implementación

- Los Route Handlers y las Server Actions **reutilizan los mismos servicios** (`src/server/services`); la elección de uno u otro es solo la forma de transporte (cliente/JS vs formulario).
- Toda respuesta con recursos de proyecto pasa antes por `requireProjectRole`.
- `GET /api/files/{id}` responde con `Cache-Control: private, max-age=3600` y `X-Content-Type-Options: nosniff`.
- Los errores nunca exponen mensajes internos de Prisma/SQL; se mapean a los códigos de la tabla 7.1 y se registran en el log del servidor con un `requestId`.
