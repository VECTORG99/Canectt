# Política de idioma de la documentación

> Adaptado del patrón de `os-santiago/homedir`, ajustado para Canectt.

## Idioma canónico

**Español** es el idioma canónico de la documentación técnica de Canectt.

Esto es coherente con que el producto en sí (la interfaz de Canectt) es en español, y maximiza la coherencia entre producto y documentación.

## Idioma espejo

**Inglés** se mantiene como espejo para los archivos centrales, con el sufijo `.en.md`:

| Canónico (es)            | Espejo (en)            |
| ------------------------ | ---------------------- |
| `AGENTS.md`              | `AGENTS.en.md`         |
| `CONTEXT.md`             | `CONTEXT.en.md`        |

Si el objetivo cambia a atraer contribuidores de habla inglesa desde el día uno, se puede invertir la relación (inglés canónico, español espejo). La decisión se documenta en `GOVERNANCE.md`.

## Reglas

1. Los cambios se hacen primero en el archivo canónico; el espejo se actualiza en el mismo PR.
2. Si un archivo solo existe en canónico (ej. `CONTRIBUTING.md`), no se exige espejo inmediato, pero se acepta.
3. Los commits y los comentarios de código pueden ir en español o inglés, según el contexto del cambio.
4. Los issues y PRs se escriben en español por defecto; se acepta inglés.
5. El copy de la UI es **siempre** español, desde `apps/web/src/i18n/es.ts`. La estructura del diccionario queda lista para i18n futuro.
