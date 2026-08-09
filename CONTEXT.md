# CONTEXT.md — Contexto de producto y arquitectura

> Versión canónica en español. Espejo en inglés: `CONTEXT.en.md`.
> Instrucciones operativas para agentes: ver `AGENTS.md`.

## Qué es Canectt

**Canectt** convierte cualquier documento (PDF, Word, Excel, Markdown) o entrada manual en una rutina/horario editable de arrastrar y soltar, exportable a documentos (PDF/Word/Excel/Markdown) y directamente al calendario de Google, iOS y Android.

El pitch en una frase: _"Convertí cualquier documento en un horario editable y llevalo directo a tu calendario, sin copiar y pegar nada a mano."_

## A quién sirve

A cualquier persona que tenga su rutina/horario escrito en un documento (un PDF del gimnasio, un Word con el plan de estudios, un Excel con turnos, un Markdown personal) y quiera convertirlo en algo editable y terminarlo en su calendario sin copiar y pegar a mano.

## Por qué existe

Copiar y pegar un horario desde un documento al calendario es tedioso y propenso a errores (horarios mal copiados, recurrencias que se olvidan, eventos que se solapan sin querer). Canectt automatiza el reconocimiento del horario dentro del documento, lo lleva a un editor visual donde se puede ajustar arrastrando bloques, y lo exporta tanto a archivos como al calendario —incluyendo recurrencias (RRULE) y manejo de eventos anidados/solapados—.

## Decisiones de arquitectura (y su razón)

### Stack Node.js + React

Pedido explícito del usuario. Cada librería se eligió por ser el estándar probado de su categoría en 2026, no por ser la más nueva.

### Monorepo con pnpm workspaces

Frontend, backend y paquetes compartidos (`schema`, `recognition-engine`, `export-engine`, `design-tokens`) viven juntos para que el esquema Zod sea una sola fuente de verdad compartida entre frontend y backend —cero duplicación de validación—.

### Esquema canónico único (`packages/schema`)

Todo parser de importación y todo editor manual producen/consumen la misma forma `Schedule`/`Block`. Esto evita que cada formato tenga su propia lógica incompatible con las demás.

### Árbol de reconocimiento (`packages/recognition-engine`)

Un único punto de entrada detecta el formato por magic bytes (no por extensión) y deriva al parser correspondiente. Los cuatro parsers (PDF/Word/Excel/Markdown) convergen en un normalizador compartido que reconoce patrones de horario desde `config/time-patterns.json` —agregar un formato de hora nuevo no requiere tocar código, solo config—.

### Sin base de datos en el MVP

El pedido original no menciona cuentas de usuario ni guardar horarios. El MVP es un flujo de una sola sesión: importar/crear → editar → exportar. El login con Google se usa **únicamente** para autorizar la escritura en Google Calendar, no como sistema de cuentas. Guardar horarios/historial queda como extensión opcional de Fase 2 (PostgreSQL vía Prisma).

### Calendario universal vía .ics + Google Calendar API

- **.ics** (estándar iCalendar, RFC 5545) cubre Apple Calendar, Outlook y Android genérico con un solo archivo.
- **Google Calendar API** (OAuth 2.0) cubre Google y, de forma indirecta, Android (el calendario nativo de Android casi siempre está respaldado por Google Calendar).
- No existe una API pública de Apple para que un sitio web cree eventos directamente en iOS sin intervención del usuario: se cubre con .ics. Es una limitación real de la plataforma, no una elección de diseño evitable.
- **Recurrencias**: se traducen a RRULE (RFC 5545) tanto en .ics como en Google Calendar —"la rutina del gimnasio de 7 a 8am, de lunes a viernes" se crea como UN solo evento recurrente, no cinco sueltos—.

### Por qué no `add-to-calendar-button`

Su licencia (Elastic License 2.0) prohíbe explícitamente usarla dentro de un producto que ofrezca esa misma función como servicio —que es justo el caso de Canectt—. Se construye la función propia sobre `ics` + Google Calendar API.

### Por qué no `xlsx` (SheetJS)

Vulnerabilidades de seguridad conocidas y sin parchear en su versión gratuita (ReDoS, prototype pollution). Se usa `exceljs` (mantenida activamente, sirve para leer y escribir).

### Por qué no `react-beautiful-dnd`

Discontinuada oficialmente por Atlassian. Se usa `@dnd-kit` (estándar de facto en 2026, accesible por teclado nativo, soporta sensores táctiles).

### Por qué `unpdf` para PDF

Envoltorio moderno sobre pdf.js (motor de Mozilla) que funciona en Node y serverless sin dependencias nativas. `pdf-parse` arrastra `canvas` que rompe builds serverless. Limitación real: ningún parser lee PDFs escaneados (imagen sin capa de texto); si la extracción devuelve <50 chars/página, se ofrece el flujo manual en vez de fallar en silencio. OCR con `tesseract.js` queda como extensión futura.

### Identidad visual Google/Gemini

Superficies neutras y amplias, tipografía Google Sans, esquinas redondeadas (Material 3), sombras suaves, movimiento discreto. El degradado de marca se reserva como acento puntual (logo, botón principal), nunca como fondo dominante. Google Sans se autohospeda (no CDN externo) para que la web no dependa de terceros.

### Gobernanza de repo

Patrones tomados de `VECTORG99/Artemisa` y `os-santiago/homedir`: `AGENTS.md` + `CONTEXT.md` como archivos centrales para agentes; paquete completo de archivos de contribución (`CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `GOVERNANCE.md`); múltiples workflows de CI especializados en vez de uno solo; `.coderabbit.yaml` para revisión asistida por IA; `.gitleaks.toml` para escaneo de secretos (crítico por las credenciales OAuth de Google); commitlint con Conventional Commits; `.devcontainer/` para entorno reproducible; release stage gates (Alpha → Beta → RC → GA).

### Idioma

- UI: español (diccionario centralizado en `apps/web/src/i18n/es.ts`, listo para i18n futuro).
- Documentación técnica: español canónico + inglés espejo —coherente con que el producto es en español—.

## Supuestos clave

1. **MVP sin cuentas ni base de datos**: flujo de una sola sesión. Avisar si se necesita guardar horarios desde el día uno.
2. **Android se cubre vía Google Calendar** (no hay API pública separada de Android).
3. **iOS se cubre vía .ics** (no hay API pública de Apple para crear eventos sin intervención del usuario).
4. **El botón "Ejemplos"** asume que el equipo prepara plantillas reales en `examples/templates/`. La especificación no puede generar esas imágenes por sí sola.
5. **El degradado y la paleta** son punto de partida coherente con Gemini/Google, no branding final inamovible.
6. **La sección de gobernanza** se adaptó de Artemisa y homedir; no se copió contenido específico (ej. el programa "Bounty Hunters" de homedir queda fuera por no haber sido pedido).

## Estado actual

Ver `PLAN.md` para el roadmap detallado y `CHANGELOG.md` para el historial de versiones.
