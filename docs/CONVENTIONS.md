# docs/CONVENTIONS.md — Convenciones de código de Canectt

> Fuente canónica de convenciones. Resumen operativo también en `AGENTS.md`.

## TypeScript

- `strict: true` en todo el monorepo (`tsconfig.base.json`). No relajar.
- `noUncheckedIndexedAccess: true` — el acceso a arrays/records por índice devuelve `T | undefined`; tratar el caso undefined.
- Sin `any` sin justificación explícita en un comentario.
- `type-imports` consistentes (`import type { ... }`).
- Errores de TS son errores de CI: cero `@ts-ignore` sin justificación.

## Estructura de archivos

- `kebab-case.ts` / `kebab-case.tsx` para archivos.
- `PascalCase` para componentes React y tipos/interfaces.
- `useCamelCase` para hooks.
- `camelCase` para funciones y variables.
- `UPPER_SNAKE_CASE` para constantes exportadas de configuración.

## Imports

- Orden: (1) librerías externas, (2) paquetes del workspace (`@canectt/*`), (3) imports relativos.
- Usar rutas del workspace: `@canectt/schema`, `@canectt/design-tokens`, `@canectt/recognition-engine`, `@canectt/export-engine`.
- Sin imports circulares entre paquetes.

## Tokens de diseño

- Todos los colores, radios, sombras y tipografía viven como variables CSS en `packages/design-tokens`.
- Tailwind referencia esas variables en `tailwind.config.ts` (`colors: { surface: 'var(--color-surface)' }`).
- **Nunca** escribir un hex color suelto en una clase o en `style={{}}`.
- ESLint bloquea literales hex fuera de `packages/design-tokens`.

## Strings de UI

- Toda la UI en español, en `apps/web/src/i18n/es.ts`.
- **Nunca** escribir texto de UI literal dentro de un componente.
- Estructura del diccionario: claves anidadas por pantalla/sección (`landing.hero.title`, `creation.import.continue`, etc.).

## Configuración vs. código

- Rangos de horas, duración por defecto, snap, tamaños máximos → `config/schedule-defaults.json`.
- Patrones de horario (regex) → `config/time-patterns.json`.
- Secretos y URLs → `.env` (nunca commitear).
- Ningún valor de negocio hardcoded en componentes.

## Validación

- Zod en cada frontera:
  - Backend: cada request body/query/params validado con un schema Zod.
  - Parsers: la salida de cada parser se valida contra `ScheduleSchema` antes de devolverla.
  - Forms: React Hook Form + Zod, reusando el MISMO schema del backend (`@canectt/schema`).
- El esquema canónico vive una sola vez en `packages/schema`.

## Commits

- Conventional Commits, verificado por commitlint.
- `feat(<scope>): ...`, `fix(<scope>): ...`, `docs: ...`, `chore: ...`, `test: ...`, `ci: ...`, `build: ...`, `refactor: ...`, `perf: ...`, `style: ...`, `revert: ...`.
- Scopes: `web`, `api`, `schema`, `recognition`, `export`, `design-tokens`, `docs`, `ci`.
- Header ≤ 100 caracteres.
- Cuerpo en español o inglés, según el contexto del cambio.

## Tests

- Vitest para unit y component.
- Un test por parser y por exportador (en `packages/*/src/__tests__/`).
- Fixtures en `fixtures/` (archivos reales de entrada).
- Playwright para e2e (3 flujos críticos).
- axe-core para a11y en CI.
- Nombrar tests descriptivamente: `describe('pdf parser', () => { it('extrae una tabla de horarios de un PDF con capa de texto', ...) })`.

## Accesibilidad

- Foco visible siempre (no `outline: none` sin reemplazo visible).
- Drag-and-drop operable por teclado (`@dnd-kit` nativo).
- `prefers-reduced-motion` respetado en todas las animaciones.
- Contraste AA en ambos temas.
- Etiquetas `aria-*` donde el nombre visible no basta.
- Imágenes con `alt` descriptivo (o `alt=""` si son decorativas).

## Responsive

- Mobile-first: media queries con `min-width`, no `max-width` como base.
- Breakpoints: `<640` móvil, `640-1024` tablet, `>1024` escritorio.
- Cada pantalla se diseña primero para móvil.
- El editor de horario tiene variante de interacción en móvil (botón editar siempre visible + campos numéricos de hora).
