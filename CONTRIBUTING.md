# CONTRIBUTING.md — Cómo contribuir a Canectt

¡Gracias por tu interés en contribuir a Canectt! Este proyecto se desarrolla con una combinación de personas y agentes de código; las mismas reglas aplican a ambos.

## Antes de empezar

1. Lee [`CONTEXT.md`](./CONTEXT.md) para entender el "por qué" del proyecto.
2. Lee [`AGENTS.md`](./AGENTS.md) para conocer comandos, estructura y convenciones (sí, también si eres una persona; está pensado para ser leído por cualquiera).
3. Lee [`PLAN.md`](./PLAN.md) para saber en qué fase está el proyecto y qué falta.

## Levantar el proyecto local

Requisitos: Node.js >= 20 (ver `.nvmrc`) y pnpm >= 9.

```bash
git clone <repo-url> canectt
cd canectt
pnpm install
cp .env.example .env       # completa los valores necesarios
pnpm dev:web               # http://localhost:5173
pnpm dev:api               # http://localhost:8787
```

Alternativa reproducible: abrir el repo en un contenedor con el `.devcontainer/` (VS Code Dev Containers o GitHub Codespaces).

## Flujo de branches

Trunk-based con ramas cortas:

- `main` — rama protegida, siempre verde.
- `feat/<tema>` — nuevas funcionalidades.
- `fix/<tema>` — correcciones de bugs.
- `docs/<tema>` — solo documentación.
- `chore/<tema>` — tooling, dependencias, refactor menor.

Abre un PR contra `main`. Squash-merge con el mensaje Conventional Commit correspondiente.

## Formato de commits

Conventional Commits, verificado automáticamente por commitlint:

```
feat(<scope>): <descripción>
fix(<scope>): <descripción>
docs: <descripción>
chore: <descripción>
test: <descripción>
ci: <descripción>
```

Scopes típicos: `web`, `api`, `schema`, `recognition`, `export`, `design-tokens`, `docs`, `ci`.

## Checks antes de abrir un PR

Ejecuta localmente:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Si tu cambio toca UI, verifica en los 3 breakpoints (móvil <640, tablet 640-1024, escritorio >1024) y en ambos temas (claro/oscuro).

La plantilla de PR incluye un checklist que replica la [definición de terminado](./AGENTS.md#definición-de-terminado-por-pr).

## Reglas no negociables

Ver [`AGENTS.md`](./AGENTS.md#reglas-de-negocio-no-negociables). Resumen:

1. Sin hardcoding (tokens, i18n, .env, config/*.json).
2. Sin bugs por construcción (TS estricto, Zod en fronteras, tests).
3. Usar lo probado (respetar `explicit_avoid`).
4. Responsive por defecto (mobile-first).
5. Accesibilidad AA.

## Reportar bugs o proponer features

Usa las plantillas de Issues de GitHub:

- [Bug report](../../issues/new?template=bug_report.md)
- [Feature request](../../issues/new?template=feature_request.md)

Para preguntas que no son bugs ni features, usa [Discussions](../../discussions) (si está habilitado) o abre un Issue con la plantilla `config.yml` que redirige.

## Código de conducta

Al participar aceptas cumplir el [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md). Aplica igual a colaboradores humanos y a lo que un agente puede hacer en nombre de un colaborador.

## Seguridad

Para reportar una vulnerabilidad de forma responsable, lee [`SECURITY.md`](./SECURITY.md). **No** abras un Issue público para vulnerabilidades.
