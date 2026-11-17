# Planify · Sistema de diseño

Documento vivo de la dirección visual **«estudio editorial»**. Describe lo que ya está construido; si el código y este documento discrepan, manda el código.

**Estado:** sistema aplicado a toda la aplicación: acceso, inicio, proyecto, documento (nota y diagrama), comentarios, búsqueda, notificaciones, perfil, ajustes de proyecto, invitaciones, estados de error y vistas móviles. Queda pendiente sustituir el icono raster antiguo de la app por una exportación del SVG.

## Principios

1. **Papel y tinta, no dashboard.** La interfaz se lee como el cuaderno de trabajo de un estudio: superficies cálidas, reglas finas y jerarquía tipográfica.
2. **Un solo acento.** El violeta tinta profundo aparece solo en acción primaria, foco, navegación activa y el lomo de identidad. El resto es neutro.
3. **El color identifica, no decora.** Cada proyecto y etiqueta recibe un color de lomo apagado y determinista a partir de su id (`tagSpineColor`).
4. **Densidad cómoda.** Listas compactas y legibles, contenido con ancho máximo y espacio generoso alrededor. La interfaz no compite con las notas ni con los diagramas.
5. **Movimiento discreto.** Una entrada de página y transiciones de 120–200 ms; nada rebota ni llama la atención.

## Tipografía

| Rol       | Fuente                                            | Uso                                                               |
| --------- | ------------------------------------------------- | ----------------------------------------------------------------- |
| UI        | **Geist** (`--font-sans`)                         | Navegación, formularios, botones, metadatos, cuerpo de la app.    |
| Editorial | **Newsreader** (`--font-serif`, `--font-heading`) | Títulos de página, proyecto, documento, tarjeta y estados vacíos. |

- Base del cuerpo: `15px / 1.6`.
- Escala usada: `10.5–11px` micro, `12–13px` meta, `13–14px` UI, `15px` cuerpo, `17px` título de tarjeta, `20–22px` sección, `32–36px` display.
- Los títulos llevan tracking negativo (`-0.02em` a `-0.035em`). Las etiquetas micro llevan tracking amplio (`0.1em`–`0.13em`).
- La utilidad `micro` (Tailwind) produce micro-mayúsculas con tracking; úsala para eyebrows, contadores y metadatos.

## Color

Los tokens viven en `src/app/globals.css` y están en OKLCH.

| Token                | Claro                                  | Oscuro                              |
| -------------------- | -------------------------------------- | ----------------------------------- |
| `--background`       | papel cálido `oklch(0.982 0.004 85)`   | grafito `oklch(0.175 0.008 265)`    |
| `--foreground`       | tinta `oklch(0.235 0.014 265)`         | papel tenue `oklch(0.935 0.005 85)` |
| `--card`             | `oklch(0.995 0.002 85)`                | `oklch(0.215 0.009 265)`            |
| `--primary`          | violeta tinta `oklch(0.385 0.105 288)` | lavanda `oklch(0.735 0.095 288)`    |
| `--muted-foreground` | `oklch(0.515 0.012 265)`               | `oklch(0.72 0.012 265)`             |
| `--border`           | `oklch(0.905 0.006 85)`                | blanco al 10 %                      |
| `--radius`           | `0.5rem` (8 px)                        | igual                               |

- **Acento:** solo `--primary`. No se añaden acentos secundarios a botones, tarjetas o fondos.
- **Lomos:** `src/lib/tag-color.ts` define seis colores apagados (azul pizarra, verdigrís, salvia, ocre, malva, arcilla). Se aplican a puntos de etiqueta, lomos de tarjeta y el monograma del proyecto.
- **Estados:** destructivo en `--destructive`; nunca se usa rojo para identidad de proyecto.
- **Superficies:** tres niveles: papel (`background`), tarjeta (`card` + borde + sombra de 1–2 px) y overlay (`popover` + borde + sombra).

## Layout

- Contenedor de trabajo: `<PageContainer>` → `max-w-[1180px]`, centrado, padding `20px / 28px / 40px` según breakpoint.
- Sidebar: `256px` expandida, `64px` colapsada. Se conserva el estado en `localStorage` (`planify:sidebar`).
- Cabecera móvil: `56px`, sticky, con logo, búsqueda y notificaciones.
- Ritmo vertical: `gap-8` entre bloques de página, `gap-4/5` dentro de secciones y listas.
- Las listas de documentos son un **ledger**: un contenedor con borde, filas divididas por hairlines, sin tarjetas individuales.
- Ancho de lectura de descripciones: `62ch`.
- Documento: en `lg` el editor ocupa `minmax(0,1fr)` y los comentarios `340px` con una hairline vertical; por debajo, los comentarios pasan debajo del editor.
- El contenido del editor se limita a `74ch` y se centra dentro del panel.

## Componentes clave

| Pieza               | Archivo                                     | Regla                                                                                                |
| ------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Marca               | `src/components/brand/logo.tsx`             | SVG monocromo, página con check. Wordmark en Geist.                                                  |
| Contenedor          | `src/components/layout/page-container.tsx`  | Ancho, padding y animación de entrada.                                                               |
| Estado vacío        | `src/components/ui/empty-state.tsx`         | Composición sin caja, rejilla de plano y arte lineal; una acción primaria.                           |
| Tarjeta de proyecto | `src/components/projects/project-card.tsx`  | Lomo de 3 px, título serif, etiquetas con punto, pie micro con documentos y fecha.                   |
| Fila de documento   | `src/components/documents/document-row.tsx` | Icono 32 px, título 13.5 px, autor 11.5 px, fecha micro a la derecha, menú al 60 % y 100 % al hover. |
| Fila de carpeta     | `src/components/documents/folder-row.tsx`   | Misma retícula que el documento, sin fecha y con contador.                                           |
| Navegación          | `src/components/layout/nav-link.tsx`        | Activo con lavado cálido y regla izquierda de 2 px; sin píldoras.                                    |
| Etiquetas           | `src/components/layout/tags-nav.tsx`        | Punto de color + nombre; contador tabular; acciones al hover.                                        |
| Acceso              | `src/app/(auth)/layout.tsx`                 | Panel de tinta con rejilla de plano y lista numerada; formulario sobre papel.                        |

## Primitivas

- **Button:** 32 px por defecto, 36 px en `lg`, radio 6 px, foco de 2 px. Primario con sombra interior sutil.
- **Input / Textarea:** 36 px, radio 6 px, borde visible, foco de 2 px, fondo de tarjeta.
- **Card:** borde de 1 px, radio `--radius-xl` (11 px), sombra de 1–2 px, título serif.
- **Badge:** 20 px, radio 6 px, 11 px; `outline` en gris, `secondary` en lavado cálido.
- **Dialog:** overlay tinta al 20 % + blur de 2 px, contenido con borde y sombra.
- **Toast:** neutro (sin `richColors`), para no introducir verdes saturados.

## Superficies

### Documento y editor

- Cabecera editorial: breadcrumb, tipo de documento como icono + micro, título serif editable (`32–36px`) y autor/fecha en micro.
- Panel del editor: radio 12 px, borde y sombra de 1 px; toolbar sticky con fondo `muted/20`, botones de 28 px y estado activo con superficie elevada.
- Contenido: Geist a `15.5px / 1.75`; títulos en Newsreader; bloques de código con tokens GitHub; citas con icono y fondo suave.
- Barra de estado inferior: punto de color + texto micro (`Guardado`, `Cambios sin guardar`, `Guardando…`, `Solo lectura`).
- Diagramas: el lienzo Excalidraw vive dentro del mismo panel; conserva su interfaz nativa y el tema claro/oscuro.

### Comentarios

- En escritorio son una columna lateral de 340 px; en móvil, una sección bajo el editor con separador superior.
- Filtros `Abiertos / Resueltos / Todos` con subrayado, no con píldoras.
- Hilo: metadatos compactos arriba (`hace X · N mensajes`), estado a la derecha, comentarios con avatar de 24 px y acciones al hover.
- Citas: icono `Quote` + fondo `muted/25`, nunca un borde lateral de color.
- Compositor: panel con textarea, cita seleccionada y acciones `Citar` / `Comentar`.

### Búsqueda

- Página con campo de 44 px, filtros de tipo/estado/etiqueta y resultados agrupados en ledger.
- Resultado: icono 32 px, título 13.5 px, snippet 11.5 px, metadatos micro y flecha a la derecha.
- Resaltado de coincidencias: `mark` con `primary/15`, sin amarillo.
- Modal (`Ctrl/⌘+K`): cabecera de 56 px, pestañas de tipo con subrayado, filas compactas y pie con atajos en micro.

### Notificaciones

- Ledger con filas de 32 px de icono, mensaje, proyecto/documento, cita y fecha micro.
- No leída: regla primaria de 2 px, fondo `accent/25`, punto junto al mensaje y acción de marcar leída.
- Cabecera con contador micro y `Marcar todas como leídas`.

### Perfil y ajustes

- Perfil: contenedor `max-w-3xl`, secciones divididas por hairlines dentro de un único panel; los títulos de sección actúan como etiqueta del campo cuando solo hay uno.
- Ajustes de proyecto: `max-w-4xl`, pestañas con contadores, formularios en paneles y listas ledger para miembros, invitaciones e historial.
- Zona peligrosa: borde destructivo suave + icono de aviso, sin borde lateral grueso.
- Invitaciones: página centrada con logo, tarjeta de 512 px, título serif, metadatos como badges y acciones a ancho completo.

### Estados

- `StatusScreen` y estados vacíos comparten rejilla de plano, icono en caja elevada y título serif.
- Los estados vacíos ocupan el alto restante y se centran; no usan cajas dashed.
- Skeletons replican la estructura real (cabecera, ledger, editor + comentarios).

## Reglas de extensión

- Usa `PageContainer` en cualquier vista nueva; no repitas `p-6` ni anchos completos.
- Usa `micro` para etiquetas y metadatos; no inventes tracking a mano.
- Usa `tagSpineColor(id)` para cualquier color de identidad; no añadas colores ad hoc.
- Un solo `Button` primario por bloque. Las acciones secundarias son `outline`, `ghost` o iconos.
- No uses glassmorphism, gradientes decorativos, esquinas de 16–24 px ni glow violeta.
- No uses bordes laterales de color como decoración. Las citas usan icono + fondo; los bordes laterales se reservan para estados funcionales (navegación activa, notificación sin leer) y para el lomo de 3 px de las tarjetas de proyecto, derivado de la etiqueta.
- La rejilla de plano se reserva para estados vacíos y el panel de acceso; no es un fondo general.
- Respeta `prefers-reduced-motion` y los nombres accesibles existentes (la suite E2E depende de ellos).

## Pendiente

- Sustituir el icono raster de la app (`src/app/icon.png`) por una exportación del nuevo SVG cuando se cierre la marca.
- Documentar la procedencia de las capturas y generar una guía visual de componentes si el proyecto crece.
- Si se añade imagen generada o de stock, registrar su procedencia junto al asset.
