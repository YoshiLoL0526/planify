# 04 · Casos de uso

Actores: **Visitante**, **Usuario**, **Owner** (propietario), **Editor**, **Viewer** (lector), **Admin** (operador del servidor).

Cada caso usa el formato: precondiciones → flujo principal → flujos alternativos → postcondiciones → requisitos relacionados.

---

## CU-01 · Registrarse

- **Actor:** Visitante.
- **Precondiciones:** sin sesión; conoce nombre, email y contraseña a usar.
- **Flujo principal:**
  1. Abre `/register`.
  2. Completa nombre, email y contraseña.
  3. El sistema valida formato, unicidad del email, política de contraseña y rate limit.
  4. Se crea la cuenta y se inicia sesión automáticamente.
  5. Es redirigido al inicio, o de vuelta a la invitación pendiente si venía de `/invite/[token]`.
- **Alternativos:**
  - Email ya registrado → mensaje «Ese email ya tiene cuenta. Inicia sesión».
  - Contraseña débil → mensaje con los requisitos.
  - Demasiados intentos → error 429 con tiempo de espera.
- **Postcondiciones:** usuario autenticado con cuenta creada.
- **Relacionados:** RF-101, RF-102 · CU-11.

## CU-02 · Iniciar y cerrar sesión

- **Actor:** Visitante / Usuario.
- **Flujo principal:** abre `/login`, introduce email y contraseña; al validar se crea sesión y va al inicio. «Cerrar sesión» en el menú de usuario invalida la sesión y vuelve a `/login`.
- **Alternativos:** credenciales incorrectas → mensaje genérico «Email o contraseña incorrectos» (sin revelar cuál falló); rate limit → 429.
- **Relacionados:** RF-102, RF-103.

## CU-03 · Crear y organizar un proyecto

- **Actor:** Usuario.
- **Precondiciones:** sesión iniciada.
- **Flujo principal:**
  1. Pulsa «Nuevo proyecto».
  2. Escribe nombre (obligatorio) y descripción (opcional).
  3. (Opcional) elige carpeta y etiquetas.
  4. Guarda: es `owner`, queda activo y se abre su vista.
- **Alternativos:** nombre vacío → error en el campo; carpeta/etiqueta inexistente → error.
- **Postcondiciones:** proyecto creado con membresía `owner`, listo para recibir documentos.
- **Relacionados:** RF-201, RF-208, RF-209 · CU-09/CU-10 (compartir).

## CU-04 · Buscar contenido

- **Actor:** Usuario.
- **Precondiciones:** sesión iniciada.
- **Flujo principal:**
  1. Escribe en la barra de búsqueda (o atajo de teclado).
  2. El sistema busca en proyectos, documentos, contenido de notas y etiquetas **solo de proyectos donde es miembro**.
  3. Muestra resultados agrupados con fragmento de contexto.
  4. Al hacer clic, navega al proyecto/documento.
- **Alternativos:** sin resultados → estado vacío con sugerencias; resultados > 50 → «ver más».
- **Relacionados:** RF-303 a RF-306.

## CU-05 · Crear y editar una nota

- **Actor:** Owner / Editor.
- **Precondiciones:** miembro con permiso de edición; proyecto abierto.
- **Flujo principal:**
  1. Pulsa «Nuevo documento → Nota».
  2. La nota se crea con título por defecto y el editor recibe el foco.
  3. Escribe con formato: títulos, listas, negrita, checklists…
  4. El autoguardado entra en acción tras la pausa; el indicador muestra «Guardando…» → «Guardado».
- **Alternativos:**
  - Otro usuario guardó antes → se muestra aviso de conflicto (CU-08).
  - Viewer intenta editar → editor en solo lectura (no se muestra toolbar de formato).
- **Postcondiciones:** contenido persistido; la nota aparece actualizada en la lista y en la búsqueda.
- **Relacionados:** RF-401 a RF-407, RF-501, RF-502, RF-506.

## CU-06 · Adjuntar imagen, archivo o enlace en una nota

- **Actor:** Owner / Editor.
- **Flujo principal (imagen):** pega una imagen del portapapeles o usa «Subir imagen» → se sube al servidor → aparece embebida.
- **Flujo principal (adjunto):** usa «Adjuntar archivo» → se sube → aparece como tarjeta con nombre y tamaño.
- **Flujo principal (enlace):** escribe/pega una URL → el servidor obtiene metadatos → se inserta tarjeta con título, descripción e imagen; si falla, queda un enlace simple.
- **Alternativos:** archivo > 20 MB → rechazado con mensaje; tipo bloqueado → rechazado; URL inaccesible → enlace simple.
- **Relacionados:** RF-503, RF-504, RF-505.

## CU-07 · Crear y editar un diagrama

- **Actor:** Owner / Editor.
- **Precondiciones:** proyecto abierto.
- **Flujo principal:**
  1. Pulsa «Nuevo documento → Diagrama».
  2. Se abre Excalidraw a pantalla completa.
  3. Dibuja con las herramientas estándar (formas, flechas, texto, imágenes…).
  4. El autoguardado persiste la escena y genera la miniatura.
- **Alternativos:** viewer intenta dibujar → modo solo lectura; pegar imágenes → se suben como assets (RF-603).
- **Postcondiciones:** diagrama guardado y visible en la lista con su miniatura.
- **Relacionados:** RF-601 a RF-605.

## CU-08 · Resolver un conflicto de guardado (concurrencia)

- **Actor:** Editor.
- **Precondiciones:** el documento fue modificado por otra persona desde que este usuario lo cargó.
- **Flujo principal:**
  1. El usuario edita y el autoguardado intenta persistir.
  2. El servidor detecta que la revisión enviada es antigua y **no sobrescribe**.
  3. La app muestra un aviso: «Otra persona guardó cambios en este documento».
  4. Opciones: **Recargar** (descarta lo local y carga lo más reciente) o **Sobrescribir** (conserva lo local y descarta lo remoto, con confirmación explícita).
- **Postcondiciones:** contenido consistente; nunca se pierden datos en silencio.
- **Relacionados:** RF-407 · RNF-01.

## CU-09 · Agregar un miembro por email

- **Actor:** Owner.
- **Flujo principal:**
  1. En «Compartir», escribe el email y elige rol (`editor` o `viewer`).
  2. Si el email corresponde a un usuario registrado → se agrega como miembro y recibe notificación.
  3. Si no existe → el sistema genera una invitación por enlace y la muestra lista para copiar.
- **Alternativos:** ya es miembro → mensaje; email propio → mensaje.
- **Relacionados:** RF-801, RF-901 · CU-10.

## CU-10 · Invitar por enlace

- **Actor:** Owner.
- **Flujo principal:**
  1. «Compartir → Crear enlace de invitación».
  2. Elige rol y caducidad (1/7/30 días).
  3. El sistema genera un enlace de un solo uso y lo copia al portapapeles.
  4. El owner lo envía por el medio que prefiera (WhatsApp, email personal…).
- **Alternativos:** revocar antes de usarse; regenerar (los anteriores dejan de valer).
- **Postcondiciones:** invitación pendiente visible en la lista de invitaciones.
- **Relacionados:** RF-802, RF-803 · CU-11.

## CU-11 · Aceptar una invitación

- **Actor:** Visitante / Usuario.
- **Precondiciones:** dispone de un enlace válido `/invite/[token]`.
- **Flujo principal (con sesión):**
  1. Abre el enlace; el sistema valida token, caducidad y estado.
  2. Pulsa «Unirme al proyecto»; se crea la membresía con el rol de la invitación.
  3. Se marca la invitación como usada y se abre el proyecto.
- **Flujo principal (sin sesión):**
  1. Abre el enlace y ve el resumen del proyecto y el rol ofrecido.
  2. Se registra (CU-01) o inicia sesión (CU-02).
  3. Vuelve automáticamente a la invitación y la acepta.
- **Alternativos:** token inválido/caducado/revocado/usado → pantalla con el motivo y acceso al inicio.
- **Relacionados:** RF-804, RF-805.

## CU-12 · Comentar y resolver un hilo

- **Actor:** Cualquier miembro (incluido viewer).
- **Flujo principal:**
  1. Abre el panel de comentarios del documento.
  2. Crea un hilo (general o anclado a un elemento/bloque si está disponible).
  3. Escribe el comentario; puede mencionar a miembros con `@`.
  4. Otro miembro responde; los implicados reciben notificación.
  5. El hilo se marca como **resuelto**; desaparece de la vista por defecto y puede reabrirse.
- **Alternativos:** editar/borrar el propio mensaje; mención a no-miembro → no se sugiere.
- **Relacionados:** RF-701 a RF-706, RF-901.

## CU-13 · Gestionar miembros y roles

- **Actor:** Owner.
- **Flujo principal:**
  1. Abre «Ajustes del proyecto → Miembros».
  2. Cambia el rol de un miembro (editor ⇄ viewer).
  3. O lo quita del proyecto (conserva sus comentarios y documentos, que pasan a mostrar «Miembro eliminado» si ya no está).
- **Alternativos:** intentar quitar/degradar al último owner → bloqueado con mensaje.
- **Relacionados:** RF-806, RF-807.

## CU-14 · Gestionar notificaciones

- **Actor:** Usuario.
- **Flujo principal:**
  1. La campana muestra el contador de no leídas.
  2. Abre la lista: «Te agregaron a X», «Nuevo comentario en Y», «@tú en Z»…
  3. Hace clic en una → navega al origen (proyecto, documento o hilo).
  4. Puede marcar una o todas como leídas.
- **Relacionados:** RF-901 a RF-904.

## CU-15 · Archivar, favoritos y recientes

- **Actor:** Owner (archivar) / Usuario (favoritos y recientes).
- **Flujo principal:**
  1. Desde la tarjeta o vista del proyecto, el owner lo **archiva**.
  2. Desaparece de las vistas activas y aparece en «Archivados» (solo lectura para editor/viewer).
  3. Cualquier miembro puede marcar un proyecto como **favorito** o abrirlo desde **Recientes**.
  4. El owner puede **desarchivar** en cualquier momento.
- **Relacionados:** RF-204, RF-206, RF-207, RF-304.

## CU-16 · Gestionar perfil y contraseña

- **Actor:** Usuario.
- **Flujo principal:**
  1. Abre «Ajustes → Perfil».
  2. Edita nombre y/o email (se valida unicidad y formato).
  3. Cambia la contraseña indicando la actual y la nueva.
- **Alternativos:** contraseña actual incorrecta → error; email en uso → error.
- **Relacionados:** RF-1001 a RF-1003.

## CU-17 (fase 2) · Colaborar en tiempo real

- **Actor:** Owner / Editor en el mismo documento.
- **Flujo principal:** ambos abren el mismo documento; ven cursores y presencia; los cambios se sincronizan al instante; los comentarios aparecen en vivo. Los guardados siguen generando snapshots en Postgres.
- **Relacionados:** RF-606, RF-707.

## CU-18 (fase 2) · Exportar e importar

- **Actor:** Miembro.
- **Flujo principal:** exporta un diagrama (PNG/SVG/`.excalidraw`), importa un `.excalidraw` existente, o descarga un backup completo del proyecto (JSON) / documento (PDF).
- **Relacionados:** decisiones de F2 en [01 · Visión](01-vision-y-alcance.md).
