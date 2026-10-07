# 11 · Roadmap

Tamaños orientativos: **S** (1–2 días), **M** (3–5 días), **L** (1–2 semanas). A ritmo de desarrollo propio.

## Fase 0 · Fundaciones (semana 1)

| # | Tarea | Tamaño |
|---|-------|--------|
| 0.1 | Repo, Next.js + TypeScript + Tailwind + shadcn/ui, ESLint/Prettier. | S |
| 0.2 | Docker dev (solo Postgres) + Prisma + esquema inicial (doc 05). | S |
| 0.3 | better-auth (registro, login, sesión, logout) + layout privado con sidebar. | M |
| 0.4 | Textos de UI centralizados (español), toasts, manejo de errores. | S |

**Salida:** se puede registrar, iniciar sesión y ver un inicio vacío tras `npm run dev`.

## Fase 1 · MVP

### 1.1 · Proyectos (**M**)
- [x] Crear/editar/eliminar/archivar con confirmación (RF-201 a RF-205).
- [x] Listado con favoritos y recientes (RF-202, RF-206, RF-207).
- [x] Carpeta y etiquetas por usuario, filtros en el inicio (RF-208, RF-209).

### 1.2 · Documentos (**M**)
- [x] Lista por proyecto, creación de nota/diagrama, renombrado, borrado (RF-401 a RF-405).
- [x] Rutas y breadcrumbs; actualización de `last_opened_at`.

### 1.3 · Notas Tiptap (**L**)
- [x] Editor con formato, checklists, imágenes y adjuntos (RF-501 a RF-504).
- [x] Vista previa de enlaces con caché y protección SSRF (RF-505).
- [x] Autoguardado con revisión + extracción de texto (RF-406, RF-407, RF-506).

### 1.4 · Diagramas Excalidraw (**L**)
- [x] Envoltorio dinámico (sin SSR), modo lectura para viewers (RF-601, RF-605).
- [x] Persistencia de escena + assets externos + rehidratación (RF-602, RF-603).
- [x] Miniaturas (RF-604).

### 1.5 · Organización y búsqueda (**M**)
- [x] Búsqueda global con `unaccent`/`pg_trgm`, filtros y fragmentos (RF-303 a RF-306).
- [x] Vistas Favoritos/Recientes/Archivados (RF-204, RF-206, RF-207).

### 1.6 · Compartir (**M**)
- [x] Miembros por email, roles y salvaguardas (RF-801, RF-806, RF-807).
- [x] Enlaces de invitación con caducidad y revocación; pantalla `/invite/[token]` (RF-802 a RF-805).

### 1.7 · Comentarios y notificaciones (**L**)
- [x] Hilos con anclaje, respuestas, resolver/reabrir, menciones (RF-701 a RF-706).
- [x] Eventos → notificaciones y campana con sondeo (RF-901 a RF-904).

### 1.8 · Pulido y despliegue (**M**)
- [x] Estados vacíos, atajos, accesibilidad básica, responsive (RNF-02, RNF-03).
- [x] Dockerfile + compose + Caddy + script de backup; despliegue en la PC servidor (doc 10).
- [x] E2E Playwright de flujos críticos; pruebas unitarias de permisos.

**Salida del MVP:** el criterio de éxito de [01 · Visión](01-vision-y-alcance.md#18-criterio-de-éxito-del-mvp) cumplido en la PC servidor, con backups diarios.

## Fase 2 · Colaboración y extras

| Área | Detalle | Tamaño |
|------|---------|--------|
| Tiempo real | Liveblocks (elección recomendada) en notas y diagramas; presencia, cursores; comentarios y notificaciones en vivo. | L |
| Export/Import | PNG/SVG/`.excalidraw`, importar `.excalidraw`, backup JSON, PDF del proyecto. | M/L |
| Correo (opcional) | SMTP externo (Resend/Brevo): invitaciones por email, reset de contraseña, avisos. | M |
| Historial | Versiones automáticas de documentos con restaurar (aprovechando Yjs/Liveblocks si aplica). | L |
| Tareas | Checklists ya en MVP; entidad Tarea con estados si se necesita. | M |
| Usabilidad | Duplicar proyecto/documento, orden manual, papelera, tema oscuro, preferencias de notificación, avatar subido. | M |
| Enlaces públicos | Compartir proyecto en solo lectura sin cuenta. | M |
| Operación | Uptime Kuma, limpieza de assets huérfanos, auditoría en BD. | S/M |

## Fase 3 · Ideas (sin compromiso)

- Plantillas de proyecto.
- PWA / uso offline ligero.
- IA: resúmenes de notas, generación de diagramas desde texto, sugerencias.
- API pública + tokens.
- Espacios de equipo (workspaces) con múltiples owners.
- Multi-idioma (i18n), OAuth, SSO.

## Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|:------------:|:-------:|------------|
| El binding Yjs para Excalidraw (si se elige self-hosted) es comunitario y puede quedar sin mantenimiento | Media | Alto | Preferir Liveblocks; encapsular la capa `DocumentSync` (6.10) para poder cambiar. |
| Crecimiento de alcance («ya que estoy…») | Alta | Medio | Este roadmap y la etiqueta de fase en cada requisito son el contrato. |
| Pérdida de datos por fallo de la PC servidor | Media | Alto | Backups diarios + copia externa + restauración de prueba. |
| Exposición a Internet con registro abierto | Baja | Alto | `REGISTRATION_OPEN=false`, rate limits, TLS, guía 9.8/10.13. |
| Nodo único se queda corto | Baja | Medio | Límites conocidos (RNF-08); migrar a VPS con más recursos es cambiar `docker compose`. |
| Excalidraw cambia su API entre versiones | Baja | Medio | Versión fijada en `package.json`; el envoltorio aísla el resto de la app. |

## Definición de «hecho» (por tarea)

1. Cumple sus RF y reglas de negocio.
2. Permisos verificados en servidor.
3. Validación Zod de entradas.
4. Estados de carga/vacío/error cuidados.
5. Textos en español.
6. Prueba (unitaria o e2e) si toca lógica crítica.
7. Documentación actualizada si cambia algo de estos docs.
