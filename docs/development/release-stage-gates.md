# Release Stage Gates

> Adaptado de `os-santiago/homedir`. Criterios por etapa.

## Alpha

- Flujo Manual completo (crear, arrastrar, editar, exportar a archivo) funcionando de punta a punta.
- Importación de al menos un formato (Markdown) funcionando.
- Sin integración de calendario todavía.

## Beta

- Los 4 formatos de importación (PDF/Word/Excel/Markdown) funcionando con el árbol de reconocimiento.
- Exportación a los 4 formatos de archivo (PDF/Word/Excel/Markdown).
- Exportación a `.ics`.
- Primera versión de "Conectar con Google Calendar".

## Release Candidate (RC)

- Manejo de eventos anidados/solapados con su paso de revisión antes de exportar, resuelto.
- Recurrencia de rutinas (RRULE) en `.ics` y Google Calendar.
- Suite e2e cubriendo los 3 flujos críticos en verde:
  1. importar → editar → exportar archivo
  2. importar → editar → exportar a Google Calendar
  3. crear manualmente → exportar
- Auditoría de accesibilidad AA pasada (axe-core en CI).
- Auditoría de licencias de dependencias sin hallazgos.

## General Availability (GA)

- Documentación completa (README, AGENTS.md, CONTEXT.md, CONTRIBUTING.md publicados).
- Demo pública desplegada.
- Rendimiento validado (code splitting, preload de fuentes, sin bundle inflado en landing).
- Política de idioma de documentación definida (ver `documentation-language-policy.md`).

## Versionado

- `v0.x.0-alpha` — Alpha.
- `v0.x.0-beta` — Beta.
- `v0.x.0-rc.N` — Release Candidate N.
- `v1.0.0` — primera General Availability.
