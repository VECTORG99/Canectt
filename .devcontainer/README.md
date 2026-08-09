# Dev Container — Canectt

Entorno de desarrollo reproducible para Canectt, pensado tanto para personas como para agentes de código que operen dentro de un contenedor (VS Code Dev Containers, GitHub Codespaces, etc.).

## Qué incluye

- Node.js 20 (ver `.nvmrc`).
- pnpm 9.
- Extensiones de VS Code: ESLint, Prettier, Tailwind CSS IntelliSense, Playwright, Jest runner, MDX, YAML.
- `pnpm install` se ejecuta automáticamente al crear el contenedor.

## Cómo usarlo

### VS Code

1. Instala la extensión "Dev Containers".
2. Abre el repo en VS Code.
3. `Ctrl/Cmd+Shift+P` → "Dev Containers: Reopen in Container".

### GitHub Codespaces

1. En el repo de GitHub, "Code" → "Codespaces" → "Create codespace on main".

## Puertos

- `5173` — frontend (apps/web).
- `8787` — backend (apps/api).

## Variables de entorno

Crea `.env` desde `.env.example` y completa los valores necesarios (en particular `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SESSION_SECRET`).
