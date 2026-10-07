# Planify — Documentación del proyecto

Planify es una aplicación web **self-hosted** para planificar ideas de proyectos: cada proyecto reúne **notas con formato** y **diagramas estilo Excalidraw**, con organización por carpetas y etiquetas, comentarios en hilos y compartición con roles.

> **Estado:** documentación de diseño. Todavía no hay código. El objetivo de estos documentos es fijar *qué* se va a construir y *con qué tecnología* antes de empezar a implementar.

---

## Índice de la documentación

| # | Documento | Contenido |
|---|-----------|-----------|
| 01 | [Visión y alcance](01-vision-y-alcance.md) | Qué es Planify, usuarios, principios, alcance del MVP y futuro, glosario. |
| 02 | [Requisitos funcionales](02-requisitos-funcionales.md) | Todo lo que la aplicación hace, por módulos, numerado (`RF-xxx`). |
| 03 | [Requisitos no funcionales](03-requisitos-no-funcionales.md) | Rendimiento, usabilidad, seguridad, operación (`RNF-xx`). |
| 04 | [Casos de uso](04-casos-de-uso.md) | Flujos detallados por caso de uso (`CU-xx`). |
| 05 | [Modelo de datos](05-modelo-de-datos.md) | Entidades, campos, relaciones, índices y ERD. |
| 06 | [Arquitectura técnica](06-arquitectura-tecnica.md) | Stack, capas, estructura de carpetas, flujos técnicos clave. |
| 07 | [API e interfaces](07-api-e-interfaces.md) | Endpoints REST, server actions, contratos y ejemplos. |
| 08 | [Pantallas y flujos](08-pantallas-y-flujos.md) | Mapa de pantallas, UX, estados y flujos de navegación. |
| 09 | [Seguridad y permisos](09-seguridad-y-permisos.md) | Autenticación, matriz de roles, validación, hardening. |
| 10 | [Despliegue y operación](10-despliegue-y-operacion.md) | Docker Compose en la PC servidor, backups, actualizaciones. |
| 11 | [Roadmap](11-roadmap.md) | Fases de implementación, riesgos y criterios de salida. |

---

## Decisiones clave (resumen)

| Tema | Decisión | Motivo |
|------|----------|--------|
| Framework | **Next.js (App Router) + TypeScript** | Fullstack en un solo repo; RSC, server actions y route handlers; ecosistema enorme. |
| UI | **Tailwind CSS + shadcn/ui** | Rápido, accesible, sin dependencias de diseño externas. |
| Editor de diagramas | **`@excalidraw/excalidraw` embebido** | Look & feel exacto de Excalidraw, MIT, sin construirlo desde cero. |
| Base de datos | **PostgreSQL + Prisma** | Relacional, robusto, migraciones versionadas; Postgres en contenedor. |
| Autenticación | **Email + contraseña con `better-auth`** | Sin proveedor externo; sesiones y tablas gestionadas por la librería. |
| Tiempo real | **Fuera del MVP.** Fase 2: Liveblocks (recomendado) o Yjs self-hosted | No bloquea el MVP; el modelo de datos no cambiará al añadirlo. |
| Correo | **Sin SMTP en el MVP**: invitaciones por enlace + notificaciones in-app | Cero dependencias externas. Reset de contraseña administrativo. |
| Infraestructura | **PC propia con Docker** (acceso por LAN; dominio/TLS opcional) | Datos en casa, coste 0. |
| Idioma | **Español** (UI y documentación) | Usuario principal hispanohablante. |
| Estructura | **Documentos por proyecto** (notas y diagramas como unidades independientes) | Más simple y escalable que un muro único. |
| Compartir | **Miembros con roles** (owner/editor/viewer) + enlaces de invitación | Control fino sin depender de correo. |
| Comentarios | **Hilos por documento** (asíncronos en MVP, en vivo en F2) | Feedback contextual sin realtime. |
| Historial | **Autoguardado sin versiones** en MVP | Menos complejidad; versionado en F2. |
| Export/Import | **Fase futura** (decidido explícitamente) | No bloquea el MVP. |

---

## Convenciones de esta documentación

- `RF-xxx` = requisito funcional · `RNF-xx` = requisito no funcional · `CU-xx` = caso de uso.
- Etiqueta de fase en cada requisito: **MVP** (fase 1) · **F2** (fase 2) · **F3** (ideas futuras).
- Los enlaces entre documentos son relativos a esta carpeta `docs/`.
- Toda decisión técnica relevante se justifica en [06 · Arquitectura](06-arquitectura-tecnica.md) con sus alternativas descartadas.
