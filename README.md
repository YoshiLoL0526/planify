# Planify

Aplicación web **self-hosted** para planificar ideas de proyectos: notas con formato y diagramas estilo Excalidraw, con carpetas, etiquetas, búsqueda, comentarios y compartición por roles.

> **Estado:** documentación de diseño (sin código todavía). Toda la especificación está en [`docs/`](docs/README.md).

## Stack

| Capa       | Tecnología                                                   |
| ---------- | ------------------------------------------------------------ |
| App        | Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui |
| Datos      | PostgreSQL 16 + Prisma                                       |
| Auth       | better-auth (email + contraseña, sin proveedor externo)      |
| Notas      | Tiptap                                                       |
| Diagramas  | `@excalidraw/excalidraw` embebido                            |
| Despliegue | Docker Compose en PC propia (LAN; dominio/TLS opcional)      |

## Documentación

Empieza por el índice: [`docs/README.md`](docs/README.md)

- [01 · Visión y alcance](docs/01-vision-y-alcance.md)
- [02 · Requisitos funcionales](docs/02-requisitos-funcionales.md)
- [03 · Requisitos no funcionales](docs/03-requisitos-no-funcionales.md)
- [04 · Casos de uso](docs/04-casos-de-uso.md)
- [05 · Modelo de datos](docs/05-modelo-de-datos.md)
- [06 · Arquitectura técnica](docs/06-arquitectura-tecnica.md)
- [07 · API e interfaces](docs/07-api-e-interfaces.md)
- [08 · Pantallas y flujos](docs/08-pantallas-y-flujos.md)
- [09 · Seguridad y permisos](docs/09-seguridad-y-permisos.md)
- [10 · Despliegue y operación](docs/10-despliegue-y-operacion.md)
- [11 · Roadmap](docs/11-roadmap.md)

## Siguiente paso

Seguir la [Fase 0 del roadmap](docs/11-roadmap.md): montar el esqueleto (Next.js + Tailwind + Prisma + docker dev) y la autenticación.
