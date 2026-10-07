# 09 · Seguridad y permisos

## 9.1 Autenticación

| Aspecto | Decisión |
|---------|----------|
| Mecanismo | **better-auth** con email + contraseña (sin verificación de email en MVP, RF-101). |
| Contraseñas | Hash robusto con el algoritmo por defecto de better-auth (scrypt) + comparación en tiempo constante. Mínimo 8 caracteres, bloqueo de las más comunes. |
| Sesiones | Cookie `httpOnly`, `secure` (con HTTPS), `sameSite=lax`; 30 días con renovación. Registro en tabla `session` (permite revocar). |
| CSRF | Comprobación de `Origin`/`Referer` en mutaciones (incluido better-auth) + cookies `sameSite`. |
| Brute force | Rate limit en login/registro (9.5) y mensajes de error genéricos. |

## 9.2 Matriz de permisos

| Acción | Owner | Editor | Viewer | No miembro |
|--------|:-----:|:------:|:------:|:----------:|
| Ver proyecto y documentos | ✅ | ✅ | ✅ | ❌ (404) |
| Crear / editar / borrar documentos | ✅ | ✅ | ❌ | ❌ |
| Subir archivos / assets | ✅ | ✅ | ❌ | ❌ |
| Comentar, responder, resolver hilos | ✅ | ✅ | ✅ | ❌ |
| Borrar hilos ajenos (moderación) | ✅ | ❌ | ❌ | ❌ |
| Editar proyecto (nombre, descripción, carpeta, etiquetas propias) | ✅ | ✅* | ❌ | ❌ |
| Marcar favorito / recientes | ✅ | ✅ | ✅ | ❌ |
| Archivar / desarchivar | ✅ | ❌ | ❌ | ❌ |
| Eliminar proyecto | ✅ | ❌ | ❌ | ❌ |
| Agregar/quitar miembros, cambiar roles, gestionar invitaciones | ✅ | ❌ | ❌ | ❌ |

\* El editor puede editar metadatos del proyecto, pero no su estado ni membresías. Cada usuario organiza **sus** carpetas y etiquetas (privadas).

Reglas invariables (verificadas en `server/permissions.ts`):

- Todo proyecto tiene **al menos un `owner`**; nadie puede quitarse/degradarse siendo el último.
- No se puede invitar con rol `owner` (transferencia solo en F2).
- `viewer` siempre recibe la UI y la API en modo lectura para contenido.
- El acceso a un recurso inexistente y a uno sin permiso devuelven **404** (no revelar existencia).

## 9.3 Autorización en el servidor

- Helper central `requireProjectRole(userId, projectId, mín)` que devuelve el rol efectivo o lanza `FORBIDDEN`/`NOT_FOUND`.
- **Todas** las consultas de documentos, comentarios, assets y búsqueda filtran por membresía.
- Las Server Actions y Route Handlers no contienen lógica de permisos propia: delegan en servicios que ya la aplican (doc 06 · 6.5).
- Los enlaces de invitación se validan en servidor: token existente, no revocado, no usado y no caducado.

## 9.4 Validación y saneamiento

| Vector | Medida |
|--------|--------|
| Entradas de API | Schemas **Zod** en servidor para todo body/query; rechazo con 400 `VALIDATION`. |
| Contenido de notas | Se guarda JSON de Tiptap validado contra **whitelist de nodos/marks**; al renderizar se genera HTML controlado (nunca `dangerouslySetInnerHTML` de datos sin sanear). |
| Escenas de diagramas | Validación de forma (Zod) y límite de tamaño (10 MB); `elements` es dato inerte (no se evalúa código). |
| Subidas | Whitelist de MIME (png, jpg, webp, gif, pdf, zip, txt…), **SVG bloqueado** (riesgo XSS) o saneado en F2; límite 20 MB; nombre en disco = UUID; servido con `Content-Type` verificado y `X-Content-Type-Options: nosniff`. |
| Vista previa de enlaces | Protección **SSRF**: solo http/https, DNS resuelto y rangos privados/loopback/link-local/metadata bloqueados, máx. 3 redirecciones, timeout 5 s, 1 MB máx. |
| Menciones | Solo miembros del proyecto; el render de menciones se hace por ID, no por HTML. |
| SQL | Prisma con consultas parametrizadas; el SQL crudo (búsqueda) usa parámetros. |

## 9.5 Rate limiting

| Punto | Límite |
|-------|--------|
| Registro / login | 10 intentos/min por IP |
| Subida de archivos | 30/min por usuario |
| Vista previa de enlaces | 10/min por usuario |
| Creación de invitaciones | 30/h por proyecto |
| Búsqueda | 60/min por usuario |
| API general | 300/min por usuario (techo de seguridad) |

Implementación en memoria del proceso (suficiente para nodo único) con respuesta `429` y cabecera `Retry-After`.

## 9.6 Cabeceras y protección web

- `Content-Security-Policy` restrictiva (self + inline necesario para Next; sin terceros).
- `X-Frame-Options: DENY` (la app no debe embeberse).
- `Referrer-Policy: no-referrer`.
- `X-Content-Type-Options: nosniff`.
- `Strict-Transport-Security` cuando se sirve por HTTPS (Caddy).
- Sin service workers ni conexiones salientes desde el navegador a dominios externos (salvo la navegación a enlaces que el usuario pulse).

## 9.7 Secretos y configuración

- Todo secreto en `.env` (nunca en el repo); `.env.example` documenta las variables.
- `BETTER_AUTH_SECRET` de 32+ bytes aleatorios; rotación documentada (invalida sesiones).
- La base de datos no se expone fuera de la red interna de Docker.
- Backups sin secretos en claro más allá de lo imprescindible; ubicación protegida por permisos del sistema.

## 9.8 Registro abierto: riesgos y mitigaciones

El registro abierto sin verificación (decisión del MVP) es aceptable en red local; si se expone a Internet:

1. Activar el flag `REGISTRATION_OPEN=false` (variable de entorno) una vez creadas las cuentas.
2. Mantener rate limits (9.5) y, si aparecen bots, añadir captcha (F2).
3. Revisar periódicamente usuarios/proyectos nuevos; borrar cuentas basura.

## 9.9 Logs y auditoría

- Log del servidor con `requestId`, usuario, ruta, código de respuesta y duración; **nunca** contraseñas, tokens ni contenido de documentos.
- Eventos relevantes para auditoría en MVP: inicio de sesión fallido, cambio de contraseña, miembros agregados/quitados, invitaciones creadas/revocadas, proyectos eliminados.
- Rotación de logs por Docker (`json-file` con límites); auditoría completa en base de datos queda para F2.

## 9.10 Reset administrativo de contraseña (RF-105)

`scripts/reset-password.mjs`: solicita email y nueva contraseña por consola, recalcula el hash con la misma función que usa better-auth (su módulo de criptografía) y actualiza `account.password`. Requiere acceso a la máquina/contenedores (por eso solo el Admin puede hacerlo). Documentado en [10 · Despliegue](10-despliegue-y-operacion.md).

## 9.11 Checklist de hardening (despliegue)

- [ ] `.env` con secreto único y permisos restringidos (`chmod 600`).
- [ ] Postgres sin puerto publicado; solo red interna de Docker.
- [ ] Contenedores con usuario no root y `restart: unless-stopped`.
- [ ] Backups automáticos verificados con una **restauración de prueba**.
- [ ] HTTPS si hay dominio (Caddy automático); sin HTTP abierto salvo red local.
- [ ] `REGISTRATION_OPEN=false` si el registro ya no es necesario.
- [ ] Actualizaciones aplicadas con backup previo.
