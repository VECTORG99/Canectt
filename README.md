# Canectt

<!-- CI badge placeholder — reemplazar cuando el workflow pr-check.yml exista -->

![CI](https://github.com/canectt/canectt/actions/workflows/pr-check.yml/badge.svg)

> Convertí cualquier documento en un horario editable y llevalo directo a tu calendario, sin copiar y pegar nada a mano.

Canectt convierte cualquier documento (PDF, Word, Excel, Markdown) o entrada manual en una rutina/horario editable de arrastrar y soltar, exportable a documentos (PDF/Word/Excel/Markdown) y directamente al calendario de Google, iOS y Android.

## Estado

Proyecto en desarrollo. Ver [`PLAN.md`](./PLAN.md) para el roadmap y los stage gates (Alpha → Beta → RC → GA).

## Stack

- **Frontend**: React 18 + Vite + TypeScript, Tailwind + tokens CSS, Framer Motion, @dnd-kit, Zustand, React Hook Form + Zod.
- **Backend**: Node.js LTS + Express + Zod; OAuth 2.0 de Google (googleapis) solo para Calendar.
- **Parsing**: unpdf (PDF), mammoth (Word), exceljs (Excel), remark+remark-gfm (Markdown).
- **Export**: @react-pdf/renderer (PDF), docx, exceljs, Markdown propio, ics (RFC 5545), googleapis (Calendar).
- **Tests**: Vitest + React Testing Library; Playwright e2e; axe-core a11y.
- **Licencia**: Apache-2.0.

## Quickstart

Requisitos: Node.js >= 20 y pnpm >= 9.

```bash
pnpm install
cp .env.example .env       # completa GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SESSION_SECRET
pnpm dev:web               # http://localhost:5173
pnpm dev:api               # http://localhost:8787 (en otra terminal)
```

## Docker

```bash
cp .env.example .env       # completa las variables de Google OAuth
docker compose up --build  # web en http://localhost:80, API interno en :8787
```

La arquitectura en producción usa tres servicios: `web` (Caddy sirve los
estáticos del frontend y hace de reverse proxy hacia `/api/*`), `api`
(backend Express) y `db` (PostgreSQL opcional, comentado por defecto). El
navegador solo habla con Caddy en el puerto 80; las llamadas relativas
`/api/*` se proxyan al backend automáticamente.

## Documentación

- [`PLAN.md`](./PLAN.md) — roadmap de implementación.
- [`CONTEXT.md`](./CONTEXT.md) — contexto de producto y arquitectura.
- [`AGENTS.md`](./AGENTS.md) — instrucciones para agentes de código.
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — cómo contribuir.
- [`docs/`](./docs) — documentación técnica.

## Licencia

Apache-2.0. Ver [`LICENSE`](./LICENSE) y [`NOTICE`](./NOTICE).
