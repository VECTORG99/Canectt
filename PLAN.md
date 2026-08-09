# PLAN.md — Canectt

Plan maestro de implementación, derivado de la especificación JSON `prompt_meta` (Canectt).
Este archivo es la fuente de verdad para el orden de ejecución. Releer antes de cada fase.

## Principios rectores (no negociables)

1. **Sin hardcoding**: colores/espaciados = tokens CSS; textos = diccionario centralizado; secretos/URLs = `.env`; rangos/duraciones/tamaños = `config/*.json` versionado.
2. **Sin bugs por construcción**: TS estricto en todo el monorepo; Zod en cada frontera; tests por parser/exportador; lint+formato obligatorio pre-commit; CI bloquea merges.
3. **Usar lo probado**: librerías maduras y mantenidas; respetar `explicit_avoid` (no `xlsx` SheetJS, no `react-beautiful-dnd`, no `add-to-calendar-button`).
4. **Responsive por defecto**: mobile-first; breakpoints `<640 / 640-1024 / >1024`.

## Stack (resumen)

- **Frontend**: React 18 + Vite + TS, Tailwind + tokens CSS, Framer Motion, @dnd-kit, Zustand, React Hook Form + Zod.
- **Backend**: Node.js LTS + Express + Zod; Passport.js (Google OAuth20) solo para Calendar.
- **Parsing**: unpdf (PDF), mammoth (Word), exceljs (Excel), remark+remark-gfm (Markdown).
- **Export archivos**: @react-pdf/renderer, docx, exceljs, plantilla propia+remark-stringify.
- **Calendario**: ics (adamgibbons) + googleapis + OAuth 2.0; RRULE para recurrencias.
- **Tests**: Vitest + React Testing Library; Playwright e2e; axe-core a11y.
- **Tooling**: pnpm workspaces, ESLint+Prettier, Husky+lint-staged, commitlint, GitHub Actions.
- **Licencia**: Apache-2.0.

## Estructura del monorepo

```
Canectt/
├─ apps/
│  ├─ web/                # React + Vite
│  └─ api/                # Express
├─ packages/
│  ├─ schema/             # Zod + tipos TS (data_model, fuente única)
│  ├─ recognition-engine/ # parsers + normalize + recognize
│  ├─ export-engine/      # generadores archivo + calendario
│  └─ design-tokens/      # variables CSS/JSON
├─ examples/templates/    # plantillas descargables (.docx/.pdf/.md/.xlsx)
├─ fixtures/              # archivos de prueba para parsers/exporters
├─ docs/                  # documentación técnica y de producto
├─ scripts/               # CLI y orquestadores (canectt)
├─ .devcontainer/
├─ .github/workflows/
├─ .husky/
├─ AGENTS.md / AGENTS.en.md
├─ CONTEXT.md / CONTEXT.en.md
├─ CONTRIBUTING.md / CODE_OF_CONDUCT.md / SECURITY.md / GOVERNANCE.md
├─ CHANGELOG.md
├─ LICENSE / NOTICE
├─ PLAN.md (este archivo)
└─ configs de tooling (.editorconfig, .prettierrc, .eslintrc, .commitlintrc, .gitleaks.toml, .coderabbit.yaml, .env.example, .nvmrc)
```

## Fases y orden (con dependencias)

### Fase 0 — Scaffolding (sin lógica de negocio)
- [0.1] Estructura de carpetas + `pnpm-workspace.yaml` + `package.json` raíz.
- [0.2] Tooling: TS estricto base, ESLint+Prettier, commitlint, Husky+lint-staged, `.editorconfig`, `.nvmrc`, `.env.example`.
- [0.3] Gobernanza: `AGENTS.md`/`AGENTS.en.md`, `CONTEXT.md`/`CONTEXT.en.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `GOVERNANCE.md`, `LICENSE`, `NOTICE`, `CHANGELOG.md`, `README.md`.
- [0.4] Plantillas GitHub: `PULL_REQUEST_TEMPLATE.md`, `ISSUE_TEMPLATE/*`, `config.yml`.
- [0.5] CI/CD: `pr-check.yml`, `pr-e2e.yml`, `pr-quality-suite.yml`, `secret-scan.yml`, `release.yml`.
- [0.6] `.devcontainer/` reproducible.
- [0.7] `.gitleaks.toml`, `.coderabbit.yaml`.
- **Commit**: `chore: scaffold monorepo + tooling + gobernanza`.

### Fase 1 — Fundación compartida
- [1.1] `packages/design-tokens`: variables CSS (`--color-*`, radios, sombras, tipografía) en light/dark; build a JSON+CSS consumible.
- [1.2] `packages/schema`: esquema Zod de `Schedule` y `Block` (data_model canónico) + tipos TS derivados + helpers (`computeOverlapGroups`, validación `parent_id`, `end_time > start_time`).
- [1.3] `config/schedule-defaults.json` y `config/time-patterns.json` (versionados, no hardcodeados).
- **Commit**: `feat(schema): tokens de diseño + esquema canónico de horario`.

### Fase 2 — Frontend Alpha (flujo Manual completo)
- [2.1] `apps/web`: Vite + React 18 + TS estricto; Tailwind referenciando tokens; Framer Motion; @dnd-kit; Zustand; React Hook Form + Zod.
- [2.2] Autohospedaje de Google Sans (descarga a `apps/web/public/fonts/` + `@font-face` + preload de pesos usados).
- [2.3] Theme provider (claro/oscuro/sistema) con Context + persistencia en `localStorage` + reacción a `prefers-color-scheme`.
- [2.4] Diccionario de strings centralizado (`src/i18n/es.ts`) — único idioma inicial, listo para i18n.
- [2.5] Router (React Router) con rutas `/`, `/crear`, `/horario/:id`, `/horario/:id/exportar`.
- [2.6] Layout + Header sticky (logo SVG, nav Inicio/Comenzar con shine hover, theme toggle).
- [2.7] Landing page (hero con título "Canectt" en Google Sans, descripción, CTA "Comenzar", footer).
- [2.8] Creation hub (containers Importar/Manual, chips de formatos, botón Ejemplos, botones Adelante).
- [2.9] Schedule editor:
  - Grilla vertical de horas (eje Y), rango configurable.
  - Bloques "sticky notes" (color token, título, rango), arrastre vertical con snap, resize desde bordes, doble-clic → panel edición, eliminar.
  - Crear bloque (clic en espacio vacío / FAB) con duración por defecto configurable.
  - Anidados (parent_id) y solapados (overlap_group_id) — visual contenedor/columnas.
  - Responsive: en móvil, botón editar siempre visible + campos numéricos de hora.
  - Estado global con Zustand.
- [2.10] Export flow (archivos): sección "Exportar" con PDF/Word/Excel/Markdown; llama al backend (Fase 3/4) o genera en cliente según corresponda.
- [2.11] Code splitting por ruta; preload de fuentes.
- **Commits**: `feat(web): theme + header + landing`, `feat(web): creation hub`, `feat(web): schedule editor (flujo manual)`, `feat(web): export flow de archivos`.

### Fase 3 — Backend + recognition engine (Beta)
- [3.1] `apps/api`: Express + TS estricto + Zod por request; helmet, CORS configurable, rate-limit, manejo de errores centralizado.
- [3.2] Endpoint `POST /api/recognize` (upload con validación por magic bytes + límite tamaño/tiempo).
- [3.3] `packages/recognition-engine`:
  - `detect-format.ts` (magic bytes).
  - `parsers/pdf.ts` (unpdf) con fallback a flujo manual si <50 chars/página.
  - `parsers/docx.ts` (mammoth).
  - `parsers/xlsx.ts` (exceljs).
  - `parsers/markdown.ts` (remark+remark-gfm).
  - `recognize.ts` (patrones desde `config/time-patterns.json`).
  - `normalize.ts` (→ schema canónico + `computeOverlapGroups`).
  - `validate.ts` (Zod + aviso de confianza baja).
- [3.4] Scripts CLI: `recognize:detect`, `recognize:pdf`, `recognize:docx`, `recognize:xlsx`, `recognize:md`.
- [3.5] Fixtures + tests unitarios por parser (reproducible).
- **Commits**: `feat(api): servidor Express + endpoint recognize`, `feat(recognition): parsers pdf/docx/xlsx/md + normalizador`.

### Fase 4 — Export engine + Google Calendar (Beta)
- [4.1] `packages/export-engine`:
  - `to-pdf.ts` (@react-pdf/renderer).
  - `to-docx.ts` (docx).
  - `to-xlsx.ts` (exceljs).
  - `to-md.ts` (plantilla + remark-stringify round-trip).
  - `to-ics.ts` (ics + RRULE).
  - `to-google-calendar.ts` (googleapis + OAuth).
- [4.2] Endpoints `POST /api/export/:format` y `POST /api/export/calendar/ics`.
- [4.3] Google OAuth con Passport.js (passport-google-oauth20), cookie firmada httpOnly, sesión corta.
- [4.4] Endpoint `GET /api/auth/google`, `GET /api/auth/google/callback`, `POST /api/export/calendar/google`.
- [4.5] Paso de revisión pre-export (anidados/solapados) — UI + backend.
- [4.6] Botón "Exportar al calendario" propio: enlace Google Calendar render + .ics + Conectar con Google.
- [4.7] Scripts CLI: `export:pdf`, `export:docx`, `export:xlsx`, `export:md`, `export:ics`, `export:google`, `canectt` orquestador.
- [4.8] Fixtures + tests por exportador.
- **Commits**: `feat(export): pdf/docx/xlsx/md`, `feat(export): ics + RRULE`, `feat(api): OAuth Google + Calendar API`, `feat(web): paso de revisión + botón calendario`.

### Fase 5 — Tests e2e + calidad (RC)
- [5.1] Playwright: 3 flujos críticos (importar→editar→exportar archivo; importar→editar→Google Calendar; manual→exportar).
- [5.2] axe-core en CI sobre pantallas principales.
- [5.3] Auditoría de licencias de dependencias (license-checker).
- [5.4] Cobertura reportada (Codecov o equivalente open source).
- **Commit**: `test: e2e + a11y + auditoría licencias`.

### Fase 6 — Despliegue + docs finales (GA)
- [6.1] `Dockerfile` por app + `docker-compose.yml` (web, api, postgres opcional).
- [6.2] `docs/` completo (CONVENTIONS, arquitectura, política de idioma, release-stage-gates).
- [6.3] `README.md` con badge de CI, quickstart, enlaces.
- [6.4] Plantillas de ejemplo (`examples/templates/*`).
- **Commit**: `docs: documentación final + docker + plantillas`.

## Criterios de terminado por PR (calcados de la spec)

- Lint (ESLint+Prettier) sin errores.
- `tsc --noEmit` sin errores.
- Tests Vitest en verde (al menos uno nuevo por parser/exportador tocado).
- Tests Playwright en verde si el cambio los afecta.
- Cero secretos (gitleaks).
- Ningún valor nuevo hardcodeado.
- UI verificada en 3 breakpoints + ambos temas.
- Sin regresiones a11y (axe-core).

## Stage gates (resumen)

- **Alpha**: flujo Manual completo + importación de un formato (Markdown).
- **Beta**: 4 formatos import + 4 export archivo + .ics + primera versión Google Calendar.
- **RC**: anidados/solapados con paso de revisión + RRULE + e2e 3 flujos + a11y AA + auditoría licencias.
- **GA**: docs completas + demo pública + rendimiento validado + política de idioma.

## Notas operativas para el agente

- Releer este `PLAN.md` al iniciar cada fase.
- Un commit Conventional Commit por hito visible.
- Si una decisión no está cubierta: priorizar (1) que funcione sin bugs, (2) librerías probadas, (3) nada hardcodeado, (4) responsive.
- Idioma de UI: español, literal desde `src/i18n/es.ts`.
- Idioma de docs técnicas: español canónico + inglés espejo.
