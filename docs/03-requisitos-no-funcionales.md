# 03 · Requisitos no funcionales

## RNF-01 · Rendimiento

| Aspecto | Objetivo |
|---------|----------|
| Primera carga de la app (LAN) | < 2,5 s hasta interactiva en un equipo moderno. |
| Navegación entre pantallas | < 500 ms percibidos (RSC + skeletons). |
| Guardado percibido | El indicador pasa a «Guardado» en < 1 s tras la pausa de edición. |
| Editor de notas | Sin tirones perceptibles al escribir con documentos de hasta ~10.000 palabras. |
| Diagramas | Fluido con escenas de hasta ~500 elementos; sin degradar el resto de la app. |
| Búsqueda global | < 500 ms con hasta ~10.000 documentos. |
| Listas | Paginadas; nunca se cargan colecciones completas. |

## RNF-02 · Usabilidad

- Interfaz íntegramente en **español** (incluidos errores y estados vacíos).
- Acciones destructivas siempre con confirmación (escribir el nombre en borrados de proyecto).
- Confirmación visual de acciones (toasts): guardado, copiado de enlace, miembro agregado.
- Estados vacíos con explicación y llamada a la acción («Aún no tienes proyectos. Crea el primero»).
- Desktop-first: la experiencia óptima es con teclado y ratón. Móvil: consulta, lectura y comentarios.

## RNF-03 · Accesibilidad

- Contraste mínimo AA (WCAG 2.1) en texto y controles.
- Navegación completa por teclado en los flujos principales (login, proyectos, notas, comentarios).
- Foco visible y orden lógico de tabulación.
- Formularios con etiquetas asociadas y errores descritos en texto.
- Atajos de teclado documentados en la app (ayuda).

## RNF-04 · Compatibilidad

- Últimas 2 versiones estables de Chrome, Edge, Firefox y Safari.
- Resolución mínima soportada: 1024×768 (óptima ≥ 1440×900).
- Sin soporte de Internet Explorer ni navegadores sin JavaScript moderno.
- Excalidraw requiere navegador con Canvas/WebGL estándar (todos los anteriores lo cumplen).

## RNF-05 · Seguridad

Detalle completo en [09 · Seguridad y permisos](09-seguridad-y-permisos.md). Resumen:

- Autorización en servidor para **cada** operación (nunca confiar en el cliente).
- Contraseñas con hash robusto; sesiones con cookies `httpOnly`, `secure`, `sameSite`.
- Validación de entradas con Zod; saneamiento del contenido enriquecido.
- Límites de subida y *rate limiting* en puntos sensibles.
- Sin dependencias de terceros en el MVP (no salen datos a Internet).

## RNF-06 · Disponibilidad y operación

| Aspecto | Objetivo |
|---------|----------|
| Disponibilidad | La app está disponible cuando la PC servidor está encendida (no hay HA en MVP). |
| Backups | **Diarios automáticos**: base de datos (dump) + carpeta de subidas. Retención 7 diarios + 4 semanales. |
| RPO | Pérdida máxima aceptable de datos: 24 h (una copia diaria). |
| RTO | Restauración manual en < 1 h siguiendo el runbook de despliegue. |
| Actualizaciones | Sin downtime planificado más de unos minutos (`docker compose up -d --build`). |
| Monitorización | Healthcheck del contenedor + revisión manual de logs. Uptime Kuma u similar como mejora F2. |

## RNF-07 · Mantenibilidad

- TypeScript en modo estricto en todo el proyecto.
- Migraciones de base de datos versionadas con Prisma (nunca cambios manuales en producción).
- ESLint + Prettier con configuración única; CI local opcional (script `npm run check`).
- Pruebas: unitarias para lógica de permisos/validaciones/extracción de texto; end-to-end (Playwright) para los flujos críticos: registro, proyecto, nota, diagrama, compartir, comentarios.
- Documentación de decisiones en `docs/` mantenida junto al código.

## RNF-08 · Escalabilidad y límites

- Arquitectura de **nodo único**: suficiente para decenas de usuarios y miles de documentos.
- La app no escala horizontalmente en el MVP (sesiones en cookie + Postgres local); se documenta como limitación consciente.
- Límites explícitos del sistema (valores por defecto, configurables):

| Límite | Valor |
|--------|-------|
| Tamaño por archivo subido | 20 MB |
| Tamaño máximo de escena de diagrama | 10 MB (JSON) |
| Longitud de comentario | 4.000 caracteres |
| Longitud de nota (texto plano) | Recomendado < 200.000 caracteres |
| Invitación: caducidad | 7 días (opciones 1/7/30) |
| Invitación: usos | 1 |
| Sesión | 30 días con renovación |
| Retención de notificaciones | 90 días |
| Resultados de búsqueda | 50 por grupo, con «ver más» |
| Rate limit login/registro | 10 intentos/minuto por IP |
| Rate limit subidas | 30/minuto por usuario |
| Rate limit vista previa de enlaces | 10/minuto por usuario |

## RNF-09 · Privacidad y datos

- Todos los datos viven en la infraestructura del propietario (PC servidor).
- Sin analítica, telemetría ni CDNs de terceros en el MVP.
- Los archivos se sirven autenticados por sesión; ninguna URL es pública por defecto.
- Derecho al olvido: exportación y borrado completo de cuenta previstos en F2.

## RNF-10 · Internacionalización

- MVP: español únicamente, pero todo el texto de UI centralizado en un solo módulo para no bloquear una futura i18n (F3).
- Fechas en formato `dd/mm/aaaa`; zona horaria del servidor (configurable).

## RNF-11 · Coste

- Coste recurrente objetivo: **0 €** (PC propia ya existente; software libre).
- Sin planes de pago, sin licencias obligatorias, sin servicios en la nube en el MVP.
- Fase 2 con tiempo real: prever free tier de Liveblocks (o self-hosted Yjs con coste 0).
