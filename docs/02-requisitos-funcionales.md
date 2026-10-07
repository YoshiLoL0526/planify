# 02 · Requisitos funcionales

Convenciones:

- **Fase**: `MVP` = fase 1 · `F2` = fase 2 · `F3` = ideas futuras.
- Los requisitos sin fase marcada son MVP.
- Referencias cruzadas: `CU-xx` → [Casos de uso](04-casos-de-uso.md) · `RNF-xx` → [Requisitos no funcionales](03-requisitos-no-funcionales.md).

---

## Módulo 1 — Cuentas y sesión

| ID | Requisito | Fase |
|----|-----------|------|
| RF-101 | Registro abierto con **email + contraseña y nombre**. No se envía email de verificación. | MVP |
| RF-102 | Inicio de sesión con email + contraseña; sesión persistente en cookie `httpOnly`. | MVP |
| RF-103 | Cierre de sesión desde el menú de usuario. | MVP |
| RF-104 | Cambio de contraseña estando autenticado (pide la contraseña actual). | MVP |
| RF-105 | Recuperación de contraseña por EMAIL: no existe en el MVP; el administrador puede restablecerla por línea de comandos / SQL (documentado en despliegue). | MVP |
| RF-106 | Verificación de email y reset de contraseña self-service. | F2 |

**Reglas de negocio**

- La contraseña debe tener mínimo 8 caracteres; se rechazan contraseñas presentes en listas de las más comunes.
- El email es único (sin distinguir mayúsculas).
- Registro e inicio de sesión están limitados por *rate limit* (ver [09 · Seguridad](09-seguridad-y-permisos.md)).

---

## Módulo 2 — Proyectos

| ID | Requisito | Fase |
|----|-----------|------|
| RF-201 | Crear proyecto con **nombre** (obligatorio) y **descripción** (opcional); el creador pasa a ser `owner`. | MVP |
| RF-202 | Listar proyectos del usuario (propios y compartidos) con paginación; cada tarjeta muestra nombre, descripción, nº de documentos, miembros y fecha de actualización. | MVP |
| RF-203 | Editar nombre y descripción (owner/editor). | MVP |
| RF-204 | Archivar y desarchivar (owner). Los archivados desaparecen de las vistas principales y aparecen en «Archivados». | MVP |
| RF-205 | Eliminar proyecto (owner) con confirmación escribiendo el nombre; borra en cascada documentos, comentarios y membresías. | MVP |
| RF-206 | Marcar/desmarcar **favorito** (por usuario y proyecto); sección «Favoritos». | MVP |
| RF-207 | Registrar y mostrar **recientes** (últimos proyectos abiertos por usuario). | MVP |
| RF-208 | Mover proyecto a una carpeta y sacarlo de ella. | MVP |
| RF-209 | Asignar y quitar etiquetas. | MVP |
| RF-210 | Indicar visualmente que un proyecto es compartido (avatares/contador de miembros). | MVP |
| RF-211 | Duplicar proyecto (con o sin documentos). | F2 |
| RF-212 | Crear proyecto a partir de una plantilla. | F3 |

**Reglas de negocio**

- Solo el `owner` puede archivar, eliminar y gestionar miembros.
- Al eliminar una carpeta o etiqueta, los proyectos NO se borran: solo pierden esa agrupación.
- Un proyecto archivado es de solo lectura para `editor` y `viewer` (el owner puede desarchivar).

---

## Módulo 3 — Organización y búsqueda

| ID | Requisito | Fase |
|----|-----------|------|
| RF-301 | **Carpetas**: crear, renombrar y eliminar (planas, sin anidar). Sidebar con listado y número de proyectos. | MVP |
| RF-302 | **Etiquetas**: crear, renombrar y eliminar; se pueden aplicar varias a un proyecto; filtro por una o varias etiquetas. | MVP |
| RF-303 | **Búsqueda global** por: nombre de proyecto, descripción, título de documento, contenido de notas, etiquetas y carpetas. Resultados agrupados con fragmento de contexto y enlace directo. | MVP |
| RF-304 | La búsqueda ignora acentos y mayúsculas (`cancion` encuentra «Canción»). | MVP |
| RF-305 | Filtros en resultados: tipo (proyecto/nota/diagrama), carpeta, etiqueta, estado. | MVP |
| RF-306 | La búsqueda respeta permisos: solo muestra proyectos donde el usuario es miembro. | MVP |
| RF-307 | Búsqueda dentro de comentarios. | F2 |
| RF-308 | Historial de búsquedas recientes. | F3 |

**Reglas de negocio**

- Carpetas y etiquetas son **por usuario** (cada persona organiza a su manera), aunque el proyecto sea compartido.
- Eliminar una etiqueta la quita de todos los proyectos, sin borrar proyectos.

---

## Módulo 4 — Documentos (contenedor común)

| ID | Requisito | Fase |
|----|-----------|------|
| RF-401 | Dentro de un proyecto, listar documentos mostrando: tipo (nota/diagrama), título, autor, última actualización y miniatura del diagrama si aplica. | MVP |
| RF-402 | Crear documento eligiendo tipo: **nota** o **diagrama**. | MVP |
| RF-403 | Renombrar título en línea; título por defecto «Nota sin título» / «Diagrama sin título». | MVP |
| RF-404 | Eliminar documento con confirmación (owner/editor). | MVP |
| RF-405 | Cada documento tiene URL propia navegable (permite enlazar/compartir internamente). | MVP |
| RF-406 | Autoguardado: el contenido se guarda automáticamente tras una pausa y al salir de la página; indicador de estado («Guardando…» / «Guardado»). | MVP |
| RF-407 | Control de concurrencia optimista: si otro usuario guardó una versión más reciente, el guardado no pisa datos silenciosamente; se avisa y se ofrece recargar o sobrescribir. | MVP |
| RF-408 | Orden de la lista: por última actualización descendente. | MVP |
| RF-409 | Reordenar documentos manualmente (arrastrar y soltar). | F2 |
| RF-410 | Duplicar documento. | F2 |
| RF-411 | Papelera de documentos con restauración. | F2 |

**Reglas de negocio**

- Un documento pertenece a un único proyecto.
- `viewer` no puede crear, editar ni eliminar documentos (sí comentar, ver módulo 7).
- El guardado registra autor y fecha de la última modificación.

---

## Módulo 5 — Notas (editor enriquecido)

| ID | Requisito | Fase |
|----|-----------|------|
| RF-501 | Editor WYSIWYG con: títulos (H1–H3), negrita, cursiva, subrayado, tachado, listas con viñetas y numeradas, cita, separador y enlaces. | MVP |
| RF-502 | **Checklists** interactivas dentro de la nota (marcar/desmarcar). | MVP |
| RF-503 | **Imágenes**: pegar desde el portapapeles o subir; se muestran embebidas y se pueden redimensionar (ancho). | MVP |
| RF-504 | **Adjuntos**: subir archivos (PDF, ZIP, etc.) que aparecen como tarjeta descargable con nombre y tamaño. | MVP |
| RF-505 | **Enlaces con vista previa**: al pegar una URL se genera una tarjeta con título, descripción y miniatura del sitio; si falla, queda como enlace simple. | MVP |
| RF-506 | Extracción de texto plano del contenido para la búsqueda global (transparente para el usuario). | MVP |
| RF-507 | Tablas, bloques de código y fórmulas. | F2 |
| RF-508 | Comentarios anclados a párrafos concretos dentro de la nota. | F2 |

**Reglas de negocio**

- Límite de subida: 20 MB por archivo (configurable).
- Los archivos subidos pertenecen al proyecto y solo los ven sus miembros.
- La vista previa de enlaces se obtiene en el servidor (nunca desde el navegador) y se cachea.

---

## Módulo 6 — Diagramas (Excalidraw)

| ID | Requisito | Fase |
|----|-----------|------|
| RF-601 | Editor Excalidraw embebido a pantalla completa en el documento, con la interfaz en español. | MVP |
| RF-602 | Se conserva la escena completa: elementos, estilo y propiedades de la vista relevantes (zoom, fondo); al reabrir, el diagrama aparece tal cual se dejó. | MVP |
| RF-603 | Imágenes dentro del diagrama: al pegar/soltar una imagen se sube como asset y se incrusta; al cargar el diagrama se rehidrata. | MVP |
| RF-604 | Miniatura (PNG) generada al guardar y usada en la lista de documentos. | MVP |
| RF-605 | Herramientas estándar de Excalidraw disponibles (formas, flechas, texto, láser, deshacer/rehacer, zoom, exportar localmente desde el propio editor). | MVP |
| RF-606 | Colaboración en vivo (cursores, edición simultánea, presencia). | F2 |
| RF-607 | Comentarios anclados a elementos del diagrama, con resaltado del elemento al abrir el hilo. | F2 |

**Reglas de negocio**

- La escena se guarda como JSON versionado; incluye referencia a los assets, no los datos binarios embebidos en el JSON de la base de datos.
- El editor respeta el rol: `viewer` lo abre en modo solo lectura (sin toolbar de edición).

---

## Módulo 7 — Comentarios

| ID | Requisito | Fase |
|----|-----------|------|
| RF-701 | Crear hilos de comentarios en un documento; el anclaje puede ser general (documento) o a un punto (bloque de nota / elemento de diagrama si está disponible). | MVP |
| RF-702 | Responder dentro de un hilo; editar y borrar los propios mensajes (mostrando «editado» si aplica). | MVP |
| RF-703 | Resolver y reabrir hilos; los resueltos se ocultan por defecto (filtro «mostrar resueltos»). | MVP |
| RF-704 | Menciones `@usuario` a miembros del proyecto; la persona mencionada recibe notificación. Los no miembros no se pueden mencionar. | MVP |
| RF-705 | Panel de comentarios del documento: lista de hilos con autor, fecha, estado y fragmento; contador de hilos abiertos. | MVP |
| RF-706 | Todos los roles (incluido `viewer`) pueden comentar; resolver puede hacerlo el autor del hilo, un `editor` o el `owner`. | MVP |
| RF-707 | Actualización en vivo de hilos y respuestas (sin recargar). | F2 |
| RF-708 | Marcadores visuales de hilos abiertos sobre el diagrama. | F2 |

**Reglas de negocio**

- Un mensaje pertenece a su autor: solo él puede editarlo/borrarlo (el owner del proyecto puede borrar hilos completos por moderación).
- Un hilo resuelto no acepta respuestas nuevas hasta reabrirlo.

---

## Módulo 8 — Compartir y permisos

| ID | Requisito | Fase |
|----|-----------|------|
| RF-801 | Agregar a un **usuario existente** como miembro indicando su email y rol (`editor` o `viewer`). | MVP |
| RF-802 | Crear **enlaces de invitación** con rol, caducidad (1/7/30 días) y un solo uso; se copian al portapapeles para enviarlos manualmente (WhatsApp, email personal, etc.). | MVP |
| RF-803 | Ver, revocar y regenerar invitaciones pendientes (owner). | MVP |
| RF-804 | Aceptar invitación: con sesión se une al proyecto; sin sesión se registra o inicia sesión y vuelve a la invitación. | MVP |
| RF-805 | Invitación inválida, caducada, revocada o ya usada muestra un mensaje claro y ofrece ir al inicio. | MVP |
| RF-806 | Cambiar el rol de un miembro y quitarlo (owner). El último `owner` no puede quitarse ni degradarse a sí mismo. | MVP |
| RF-807 | La UI muestra el rol del usuario y oculta/deshabilita acciones no permitidas. | MVP |
| RF-808 | Transferir la propiedad del proyecto a otro miembro. | F2 |
| RF-809 | Enlace público de solo lectura sin necesidad de cuenta. | F2 |

**Reglas de negocio**

- No se puede invitar en el rol `owner`; la propiedad se transfiere (RF-808, F2).
- El propietario no puede quedar sin miembros: mínimo un `owner` siempre.
- Al eliminar una invitación, el enlace deja de funcionar inmediatamente.
- Agregar por email a alguien sin cuenta genera automáticamente una invitación por enlace (que se muestra para copiar).

---

## Módulo 9 — Notificaciones in-app

| ID | Requisito | Fase |
|----|-----------|------|
| RF-901 | Eventos notificables: te agregaron a un proyecto, nuevo comentario en alguno de tus documentos, respuesta a tu hilo, mención, cambio de tu rol, proyecto archivado/eliminado por el owner. | MVP |
| RF-902 | Campana con contador de no leídas; lista con: tipo, origen, fecha y enlace directo al elemento. | MVP |
| RF-903 | Marcar una o todas como leídas. | MVP |
| RF-904 | Actualización del contador sin recargar la página (sondeo periódico). | MVP |
| RF-905 | Preferencias por tipo de notificación (activar/desactivar). | F2 |
| RF-906 | Notificaciones en vivo (push por tiempo real) y por email. | F2 |

**Reglas de negocio**

- Las notificaciones son **por usuario** y nunca se comparten entre miembros.
- No se notifica al autor de la acción (p. ej., tu propio comentario no te notifica).
- Retención: se eliminan automáticamente a los 90 días.

---

## Módulo 10 — Perfil y ajustes

| ID | Requisito | Fase |
|----|-----------|------|
| RF-1001 | Editar nombre y email (sin verificación de email; se valida formato y unicidad). | MVP |
| RF-1002 | Cambiar contraseña (ver RF-104). | MVP |
| RF-1003 | Avatar generado con iniciales y color derivado del nombre. | MVP |
| RF-1004 | Cerrar sesión (ver RF-103). | MVP |
| RF-1005 | Subir foto de avatar. | F2 |
| RF-1006 | Tema oscuro/claro. | F2 |
| RF-1007 | Eliminar cuenta con confirmación (y decidir destino de sus proyectos). | F2 |

---

## Trazabilidad rápida requisito → caso de uso

| Módulo | Casos de uso relacionados |
|--------|---------------------------|
| 1 · Cuentas | CU-01, CU-02, CU-16 |
| 2 · Proyectos | CU-03, CU-15 |
| 3 · Organización y búsqueda | CU-04, CU-15 |
| 4 · Documentos | CU-05, CU-07, CU-08 |
| 5 · Notas | CU-05, CU-06 |
| 6 · Diagramas | CU-07, CU-08 |
| 7 · Comentarios | CU-12 |
| 8 · Compartir | CU-09, CU-10, CU-11, CU-13 |
| 9 · Notificaciones | CU-14 |
| 10 · Perfil | CU-16 |
