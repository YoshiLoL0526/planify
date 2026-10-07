# 01 · Visión y alcance

## 1.1 Qué es Planify

Planify es una aplicación web para **convertir ideas de proyectos en planes concretos**. Dentro de cada proyecto se pueden crear:

- **Notas** con texto enriquecido, checklists, imágenes, adjuntos y enlaces con vista previa.
- **Diagramas** de diseño estilo pizarra (Excalidraw): bocetos, arquitecturas, wireframes, mapas mentales…

Todo organizado con carpetas, etiquetas, favoritos, búsqueda global y estados (activo/archivado), y compartible con otras personas mediante roles (propietario/editor/lector) y enlaces de invitación.

La aplicación es **self-hosted**: se despliega en una PC propia con Docker y los datos nunca salen de casa.

## 1.2 Problema y propuesta de valor

Las ideas de proyecto se dispersan entre notas sueltas, apps de dibujo, correos y mensajes. Las herramientas existentes son o demasiado pesadas (Miro, Notion) o demasiado simples (una libreta).

Planify propone:

1. **Un sitio único**: notas y diagramas conviven en el mismo proyecto.
2. **Rápido para pensar**: editor cómodo y pizarra con fricción mínima.
3. **Datos propios**: self-hosted, sin telemetría, sin cuentas en la nube ajena.
4. **Colaboración cuando haga falta**: roles y comentarios; tiempo real en fase 2.

## 1.3 Usuarios y contexto de uso

| Actor | Descripción |
|-------|-------------|
| **Usuario registrado** | Persona con cuenta que crea y gestiona sus proyectos. |
| **Propietario (owner)** | Miembro que creó el proyecto (o recibió la propiedad). Gestiona miembros y ajustes. |
| **Editor** | Miembro que puede crear y modificar documentos y comentar. |
| **Lector (viewer)** | Miembro que puede ver el proyecto, sus documentos y comentar (sin modificar contenido). |
| **Visitante** | Persona sin sesión: puede registrarse, iniciar sesión o abrir un enlace de invitación. |
| **Administrador del servidor** | Quien opera el despliegue (la misma persona que usa la app): backups, actualizaciones, reset de contraseñas. |

Contexto previsto: uso personal o de un grupo muy pequeño (familia, amigos, equipo informal). Desktop-first; móvil para consultar y comentar.

## 1.4 Principios del producto

1. **Simple y directo**: cada pantalla hace una cosa clara; sin configuraciones innecesarias.
2. **El servidor es la autoridad**: permisos y validaciones siempre en el backend.
3. **Progresivo**: el MVP funciona completo sin tiempo real ni correo; ambas cosas se añaden después sin rediseñar.
4. **En español**: toda la interfaz, mensajes de error y documentación.
5. **Fácil de operar**: un `docker compose up` y poco más.

## 1.5 Alcance del MVP (fase 1)

- Cuentas: registro abierto (email + contraseña, sin verificación), inicio/cierre de sesión, cambio de contraseña, perfil.
- Proyectos: crear, editar, archivar, eliminar, favoritos, recientes.
- Organización: carpetas (sin anidar), etiquetas, búsqueda global, vista de archivados.
- Documentos: lista por proyecto; notas y diagramas como unidades independientes.
- Notas: editor enriquecido con checklists, imágenes, adjuntos y enlaces con vista previa.
- Diagramas: Excalidraw embebido con autoguardado y miniaturas.
- Colaboración asíncrona: miembros con roles, invitaciones por enlace, comentarios en hilos, notificaciones in-app.
- Despliegue: Docker Compose en la PC servidor, con backups.

## 1.6 Fuera del MVP (decisiones tomadas)

| Funcionalidad | Fase | Nota |
|---------------|------|------|
| Tiempo real (co-edición, presencia, comentarios en vivo) | F2 | Liveblocks recomendado; Yjs self-hosted como alternativa. |
| Exportar/importar (PNG, SVG, `.excalidraw`, backup JSON, PDF) | F2 | Decidido explícitamente dejarlo para el futuro. |
| Correo (invitaciones, reset de contraseña, avisos) | F2 | Requiere SMTP; el MVP usa enlaces copiables. |
| Historial de versiones de documentos | F2 | |
| Gestión de tareas | F2 | Las notas permiten checklists, pero sin entidad "tarea". |
| Papelera / restauración | F2 | MVP: borrado con confirmación, sin recuperación. |
| Enlaces públicos de solo lectura sin cuenta | F2 | |
| Duplicar proyectos/documentos, plantillas | F2 | |
| Orden manual de documentos (drag & drop) | F2 | MVP ordena por actualización. |
| Tema oscuro, avatar con imagen subida, preferencias de notificación | F2 | |
| Multi-idioma (i18n), OAuth, 2FA, PWA, API pública, IA | F3 | Ideas, sin compromiso. |

## 1.7 Glosario

| Término | Significado |
|---------|-------------|
| **Proyecto** | Contenedor principal: tiene nombre, descripción, miembros y documentos. |
| **Documento** | Unidad dentro de un proyecto; puede ser una **nota** o un **diagrama**. |
| **Nota** | Documento de texto enriquecido. |
| **Diagrama** | Documento de pizarra basado en Excalidraw (escena). |
| **Escena** | Datos del diagrama: elementos, estado de la vista y archivos incrustados. |
| **Carpeta** | Agrupación de proyectos (plana, sin subcarpetas en MVP). |
| **Etiqueta** | Marca transversal para clasificar proyectos. |
| **Miembro** | Usuario con acceso a un proyecto y un rol. |
| **Rol** | `owner`, `editor` o `viewer`. |
| **Invitación** | Enlace con rol y caducidad que permite unirse a un proyecto. |
| **Hilo** | Conversación de comentarios anclada (o no) a un punto de un documento. |
| **Asset** | Archivo subido (imagen, adjunto, miniatura) guardado en el servidor. |
| **Snapshot** | Copia del contenido de un documento guardada en la base de datos. |

## 1.8 Criterio de éxito del MVP

Poder recorrer el ciclo completo **sin salir de Planify**:

> Idea → proyecto → notas con checklists e imágenes → diagrama → compartir con otra persona → comentar y resolver → buscar y reencontrar → archivarlo cuando termina.

Y hacerlo desde la PC servidor, con los datos respaldados y accesibles por cualquiera en la red local.
