# AGENTS.en.md — Instructions for code agents (English mirror)

> Canonical version in Spanish: `AGENTS.md`.
> Product/architecture context (the "why"): see `CONTEXT.en.md`.

This is the first file any code agent (Claude Code, Cursor, OpenCode, Copilot, Devin) reads when entering the repository. It is short and actionable.

## Commands

```bash
# Install dependencies (requires pnpm >=9 and Node >=20)
pnpm install

# Development
pnpm dev:web          # frontend at http://localhost:5173
pnpm dev:api          # backend at http://localhost:8787

# Quality
pnpm lint             # ESLint across all packages
pnpm lint:fix         # ESLint with --fix
pnpm format           # Prettier writes
pnpm format:check     # Prettier check only
pnpm typecheck        # tsc --noEmit across all packages
pnpm test             # Vitest (unit + component) across all packages
pnpm test:watch       # Vitest in watch mode
pnpm test:e2e         # Playwright (apps/web)

# Build
pnpm build            # build all packages (except docs)
pnpm build:web        # frontend only
pnpm build:api        # backend only

# Recognition/export CLI (isolated, reproducible scripts)
pnpm recognize:detect -- <file>
pnpm recognize:pdf    -- <file.pdf>
pnpm recognize:docx   -- <file.docx>
pnpm recognize:xlsx   -- <file.xlsx>
pnpm recognize:md     -- <file.md>
pnpm export:pdf       -- <schedule.json>
pnpm export:docx      -- <schedule.json>
pnpm export:xlsx      -- <schedule.json>
pnpm export:md        -- <schedule.json>
pnpm export:ics       -- <schedule.json>
pnpm export:google    -- <schedule.json>   # requires active OAuth session
pnpm canectt -- import <file>
pnpm canectt -- export --format <format> <schedule.json>
```

## Repo structure

```
apps/web/             # React + Vite frontend
apps/api/             # Express backend
packages/schema/      # Zod schemas + TS types (canonical data_model)
packages/recognition-engine/  # Parsers + normalizer + recognizer
packages/export-engine/       # File and calendar generators
packages/design-tokens/       # CSS/JSON design variables
examples/templates/   # Downloadable example templates (.docx/.pdf/.md/.xlsx)
fixtures/             # Test files for parsers/exporters
docs/                 # Technical and product documentation
scripts/              # CLI and orchestrators (canectt)
config/               # Versioned config (schedule-defaults.json, time-patterns.json)
.devcontainer/        # Reproducible dev environment
.github/workflows/    # CI/CD
.husky/               # Pre-commit hooks (lint-staged)
```

## Code conventions

- **Strict TypeScript** across the monorepo (`tsconfig.base.json`). Do not relax `strict`.
- **ESLint + Prettier** already configured. Do not reformat with a different criterion.
- **Naming**:
  - Files: `kebab-case.ts` / `kebab-case.tsx`.
  - React components: `PascalCase`.
  - Types/interfaces: `PascalCase`.
  - Hooks: `useCamelCase`.
  - Exported constants: `UPPER_SNAKE_CASE` for config, `camelCase` otherwise.
- **Design tokens** live in `packages/design-tokens` (CSS variables `--color-*`, radii, shadows, typography). Tailwind references those variables: **never** write a loose hex color in a class.
- **One-off styles** allowed only when no token applies; justify in a comment.
- **UI strings** live in `apps/web/src/i18n/es.ts` (centralized dictionary). Do not write literal UI text inside components.
- **Commits**: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `test:`, `ci:`, `build:`, `refactor:`, `perf:`, `style:`, `revert:`). Enforced by commitlint.
- **Imports**: use workspace paths (`@canectt/schema`, `@canectt/design-tokens`, etc.).

## Non-negotiable business rules

See `PLAN.md` and the original spec. Summary:

1. **No hardcoding**: colors/spacing = CSS tokens; text = i18n dictionary; secrets/URLs = `.env`; ranges/durations/sizes = `config/*.json`.
2. **No bugs by construction**: strict TS; Zod at every boundary (API, parsers, forms); tests per parser/exporter; lint+format mandatory pre-commit; CI blocks merges.
3. **Use what works**: mature, maintained libraries. Respect `explicit_avoid`:
   - **NO** `xlsx` (SheetJS) → use `exceljs`.
   - **NO** `react-beautiful-dnd` → use `@dnd-kit`.
   - **NO** `add-to-calendar-button` (Elastic 2.0 license incompatible) → own implementation over `ics` + Google Calendar API.
4. **Responsive by default**: mobile-first; breakpoints `<640 / 640-1024 / >1024`. Design for mobile first.
5. **Accessibility AA**: focus always visible; drag-and-drop keyboard-operable (`@dnd-kit` native); `prefers-reduced-motion` respected in all animations; AA contrast in both themes.

## What NOT to do

- Do not commit `.env` or credentials. The Google client secret lives **only in the backend**.
- Do not add new dependencies for something an already-chosen library solves, without justifying it first in the PR.
- Do not bypass the shared Zod validation between frontend and backend (`packages/schema` is the single source of truth).
- Do not edit `LICENSE` or `NOTICE` by hand: `NOTICE` is generated in CI with `license-checker`.
- Do not hardcode time patterns in code: they live in `config/time-patterns.json`.
- Do not fail silently: scanned PDFs (<50 chars/page) must offer the manual flow, not break.
- Do not use `any` without explicit justification in a comment.

## Definition of done (per PR)

Mirrored from `PLAN.md`:

- [ ] Lint (ESLint + Prettier) clean.
- [ ] `tsc --noEmit` clean.
- [ ] Vitest tests green (at least one new test per touched parser/exporter).
- [ ] Playwright tests green if the change affects critical flows.
- [ ] Zero secrets detected by gitleaks.
- [ ] No new hardcoded values.
- [ ] UI verified at 3 breakpoints (mobile/tablet/desktop) and both themes (light/dark).
- [ ] No accessibility regressions (axe-core in CI).
