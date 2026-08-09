# AGENTS.md — Instrucciones para agentes de código

> Versión canónica en español. Espejo en inglés: `AGENTS.en.md`.
> Contexto de producto/arquitectura (el "por qué"): ver `CONTEXT.md`.

Este archivo lo lee primero cualquier agente de código (Claude Code, Cursor, OpenCode, Copilot, Devin) al entrar al repositorio. Es corto y accionable.

## Comandos

```bash
# Instalar dependencias (requiere pnpm >=9 y Node >=20)
pnpm install

# Desarrollo
pnpm dev:web          # frontend en http://localhost:5173
pnpm dev:api          # backend en http://localhost:8787

# Calidad
pnpm lint             # ESLint en todos los paquetes
pnpm lint:fix         # ESLint con --fix
pnpm format           # Prettier escribe
pnpm format:check     # Prettier solo verifica
pnpm typecheck        # tsc --noEmit en todos los paquetes
pnpm test             # Vitest (unit + component) en todos los paquetes
pnpm test:watch       # Vitest en modo watch
pnpm test:e2e         # Playwright (apps/web)

# Build
pnpm build            # build de todos los paquetes (excepto docs)
pnpm build:web        # solo frontend
pnpm build:api        # solo backend

# CLI de reconocimiento/exportación (scripts aislados, reproducibles)
pnpm recognize:detect -- <archivo>
pnpm recognize:pdf    -- <archivo.pdf>
pnpm recognize:docx   -- <archivo.docx>
pnpm recognize:xlsx   -- <archivo.xlsx>
pnpm recognize:md     -- <archivo.md>
pnpm export:pdf       -- <horario.json>
pnpm export:docx      -- <horario.json>
pnpm export:xlsx      -- <horario.json>
pnpm export:md        -- <horario.json>
pnpm export:ics       -- <horario.json>
pnpm export:google    -- <horario.json>   # requiere sesión OAuth activa
pnpm canectt -- import <archivo>
pnpm canectt -- export --format <formato> <horario.json>
```

## Estructura del repo

```
apps/web/             # Frontend React + Vite
apps/api/             # Backend Express
packages/schema/      # Esquemas Zod + tipos TS (data_model, fuente única)
packages/recognition-engine/  # Parsers + normalizador + reconocedor
packages/export-engine/       # Generadores de archivo y de calendario
packages/design-tokens/       # Variables CSS/JSON de diseño
examples/templates/   # Plantillas descargables de ejemplo (.docx/.pdf/.md/.xlsx)
fixtures/             # Archivos de prueba para parsers/exporters
docs/                 # Documentación técnica y de producto
scripts/              # CLI y orquestadores (canectt)
config/               # Configuración versionada (schedule-defaults.json, time-patterns.json)
.devcontainer/        # Entorno de desarrollo reproducible
.github/workflows/    # CI/CD
.husky/               # Hooks de pre-commit (lint-staged)
```

## Convenciones de código

- **TypeScript estricto** en todo el monorepo (`tsconfig.base.json`). No relajar `strict`.
- **ESLint + Prettier** ya configurados. No reformatear con otro criterio.
- **Nomenclatura**:
  - Archivos: `kebab-case.ts` / `kebab-case.tsx`.
  - Componentes React: `PascalCase`.
  - Tipos/interfaces: `PascalCase`.
  - Hooks: `useCamelCase`.
  - Constantes exportadas: `UPPER_SNAKE_CASE` para config, `camelCase` para el resto.
- **Tokens de diseño** viven en `packages/design-tokens` (variables CSS `--color-*`, radios, sombras, tipografía). Tailwind referencia esas variables: **nunca** escribir un color hex suelto en una clase.
- **Estilos puntuales** permitidos solo si no hay token aplicable; justificar en un comentario.
- **Strings de UI** viven en `apps/web/src/i18n/es.ts` (diccionario centralizado). No escribir texto de UI literal dentro de componentes.
- **Commits**: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `test:`, `ci:`, `build:`, `refactor:`, `perf:`, `style:`, `revert:`). Verificado por commitlint.
- **Imports**: usar rutas del workspace (`@canectt/schema`, `@canectt/design-tokens`, etc.).

## Reglas de negocio no negociables

Ver `PLAN.md` y la especificación original. Resumen:

1. **Sin hardcoding**: colores/espaciados = tokens CSS; textos = diccionario i18n; secretos/URLs = `.env`; rangos/duraciones/tamaños = `config/*.json`.
2. **Sin bugs por construcción**: TS estricto; Zod en cada frontera (API, parsers, formularios); test por parser/exportador; lint+formato obligatorio pre-commit; CI bloquea merges.
3. **Usar lo probado**: librerías maduras y mantenidas. Respetar `explicit_avoid`:
   - **NO** `xlsx` (SheetJS) → usar `exceljs`.
   - **NO** `react-beautiful-dnd` → usar `@dnd-kit`.
   - **NO** `add-to-calendar-button` (licencia Elastic 2.0 incompatible) → implementación propia sobre `ics` + Google Calendar API.
4. **Responsive por defecto**: mobile-first; breakpoints `<640 / 640-1024 / >1024`. Cada pantalla se diseña primero para móvil.
5. **Accesibilidad AA**: foco visible siempre; drag-and-drop operable por teclado (`@dnd-kit` nativo); `prefers-reduced-motion` respetado en todas las animaciones; contraste AA en ambos temas.

## Qué NO hacer

- No commitear `.env` ni credenciales. El client secret de Google vive **solo en el backend**.
- No agregar dependencias nuevas para algo que una librería ya elegida en el stack resuelve, sin justificarlo antes en el PR.
- No saltarse la validación Zod compartida entre frontend y backend (`packages/schema` es la fuente única).
- No tocar `LICENSE` ni `NOTICE` a mano: `NOTICE` se genera en CI con `license-checker`.
- No hardcodear patrones de horario en código: viven en `config/time-patterns.json`.
- No fallar en silencio: PDFs escaneados (<50 chars/página) deben ofrecer el flujo manual, no romper.
- No usar `any` sin justificación explícita en un comentario.

## Definición de terminado (por PR)

Calcado de `PLAN.md`:

- [ ] Lint (ESLint + Prettier) sin errores.
- [ ] `tsc --noEmit` sin errores.
- [ ] Tests Vitest en verde (al menos uno nuevo por parser/exportador tocado).
- [ ] Tests Playwright en verde si el cambio afecta los flujos críticos.
- [ ] Cero secretos detectados por gitleaks.
- [ ] Ningún valor nuevo hardcodeado.
- [ ] UI verificada en 3 breakpoints (móvil/tablet/escritorio) y ambos temas (claro/oscuro).
- [ ] Sin regresiones de accesibilidad (axe-core en CI).
