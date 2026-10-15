# Planify

Aplicación web **self-hosted** para planificar ideas de proyectos: notas con formato y diagramas estilo Excalidraw, con carpetas, etiquetas, búsqueda global, comentarios en hilos y compartición por roles.

> **Estado:** MVP (fase 1 del [roadmap](docs/11-roadmap.md)) completado — proyectos, documentos, notas Tiptap, diagramas Excalidraw, búsqueda, compartir, comentarios, notificaciones, perfil de usuario y despliegue con Docker + backups. La fase 2 (tiempo real, export/import, correo) está planificada en [docs/11](docs/11-roadmap.md).

## Stack

| Capa       | Tecnología                                                      |
| ---------- | --------------------------------------------------------------- |
| App        | Next.js 16 (App Router) + TypeScript + Tailwind CSS + shadcn/ui |
| Datos      | PostgreSQL 16 + Prisma 7                                        |
| Auth       | better-auth (email + contraseña, sin proveedor externo)         |
| Notas      | Tiptap                                                          |
| Diagramas  | `@excalidraw/excalidraw` embebido                               |
| Pruebas    | Vitest (unitarias) + Playwright (E2E)                           |
| Despliegue | Docker Compose en PC propia (LAN; dominio/TLS opcional)         |

## Desarrollo local

```bash
# 1. Base de datos (Postgres en localhost:5433)
npm run db:up

# 2. Dependencias y variables de entorno
npm install
cp .env.example .env        # rellenar BETTER_AUTH_SECRET, etc.

# 3. Esquema y arranque
npm run db:migrate
npm run dev                 # http://localhost:3000
```

### Calidad

```bash
npm run check       # lint + tipos + tests unitarios (Vitest)
npm run test:e2e    # E2E de Playwright (usa su propia BD y puerto 3100)
```

El primer usuario se registra desde `/register` (el registro se cierra con `REGISTRATION_OPEN=false`).

## Scripts útiles

| Comando                                            | Para qué                                            |
| -------------------------------------------------- | --------------------------------------------------- |
| `npm run dev` / `build` / `start`                  | Desarrollo, build y arranque de producción de Next. |
| `npm run db:up` / `db:down`                        | Postgres de desarrollo en Docker.                   |
| `npm run db:migrate` / `db:generate` / `db:studio` | Migraciones, cliente Prisma y Prisma Studio.        |
| `npm run db:reset-password`                        | Reset administrativo de contraseña (RF-105).        |
| `npm run check`                                    | Lint + tipos + tests unitarios.                     |
| `npm run test:e2e`                                 | Flujos E2E críticos con Playwright.                 |

## Despliegue y operación

Docker Compose de producción (app + Postgres + migraciones + Caddy opcional para HTTPS), backups diarios y runbook de actualización: [docs/10 · Despliegue y operación](docs/10-despliegue-y-operacion.md).

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
