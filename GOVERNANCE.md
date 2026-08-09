# GOVERNANCE.md — Gobernanza de Canectt

## Filosofía

Canectt es un proyecto open source (Apache-2.0) que se desarrolla con una combinación de personas y agentes de código. La gobernanza busca ser transparente, ligera y documentada desde el día uno, aunque el equipo inicial sea pequeño.

## Roles

### Colaborador/a

Cualquier persona que abra un PR aceptado, reporte un bug útil, contribuya con documentación o participe en discussions. No requiere permisos especiales.

### Mantenedor/a

Persona con permisos de escritura en el repositorio y capacidad de aprobar/mergear PRs. Responsabilidades:

- Revisar PRs con criterio técnico y respeto por las [reglas no negociables](./AGENTS.md#reglas-de-negocio-no-negociables).
- Asegurar que los checks de CI pasen antes de mergear.
- Mantener `PLAN.md`, `CONTEXT.md` y `AGENTS.md` actualizados.
- Cerrar issues resueltos y moderar discussions.

### Lead maintainer

Mantenedor con responsabilidad adicional sobre la dirección del proyecto, releases y la rama protegida. En la fase inicial, es quien inició el proyecto.

## Cómo convertirse en mantenedor

No hay checklist rígido, pero se valoran:

- Historial de PRs de calidad que respetan las convenciones del repo.
- Participación sostenida en revisiones y discussions.
- Conocimiento demostrado del dominio (parsing, exportación, calendarios, accesibilidad).
- Capacidad de mentorear a otras personas y agentes.

La decisión la toma el lead maintainer, consultando a los mantenedores existentes. Se documenta en `MAINTAINERS.md` (cuando exista).

## Toma de decisiones

- **Decisiones pequeñas** (bugs, refactor menor, docs): el primer mantenedor que aprueba, mergea.
- **Decisiones medianas** (nueva feature dentro del alcance de `PLAN.md`): un PR con discusión abierta; se mergea con al menos una aprobación de mantenedor y CI verde.
- **Decisiones grandes** (cambios de arquitectura, nuevas dependencias fuera del stack, cambios de licencia, cambios en este archivo): se documentan en un Issue o Discussion con etiqueta `governance`, se busca consenso y, en su defecto, decide el lead maintainer.

Todas las decisiones que afecten al proyecto se documentan en commits/PRs visibles. No hay decisiones privadas que afecten al código.

## Agentes de código

Los agentes (Claude Code, Cursor, OpenCode, Copilot, Devin, etc.) pueden operar en el repo bajo la responsabilidad de un colaborador humano. Sus contribuciones se someten a las mismas reglas que las humanas. La revisión asistida por IA (`.coderabbit.yaml`) es una primera pasada automática y **nunca** reemplaza la aprobación humana requerida para mergear a `main`.

## Release stage gates

Adaptado de `os-santiago/homedir`. Ver [`PLAN.md`](./PLAN.md#stage-gates-resumen) para los criterios completos:

- **Alpha** → **Beta** → **Release Candidate** → **General Availability**.

Cada stage gate se alcanza cuando se cumplen sus criterios. El avance se documenta en `CHANGELOG.md` y se etiqueta con un tag de versión (`v0.1.0-alpha`, `v0.2.0-beta`, etc.).
