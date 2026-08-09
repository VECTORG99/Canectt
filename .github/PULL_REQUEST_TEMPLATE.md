# Pull Request

## ¿Qué problema resuelve?

<!-- Describe el problema o la motivación. Referencia el issue si existe: Closes #N -->

## Qué cambia

<!-- Bullet points de los cambios concretos. -->

## Checklist de definición de terminado

- [ ] Lint (ESLint + Prettier) sin errores (`pnpm lint`).
- [ ] Type-check sin errores (`pnpm typecheck`).
- [ ] Tests unitarios/de componente en verde (`pnpm test`).
- [ ] Tests e2e en verde si el cambio afecta flujos críticos (`pnpm test:e2e`).
- [ ] Cero secretos detectados por gitleaks.
- [ ] Ningún valor nuevo hardcodeado (tokens CSS, i18n, .env, config/*.json).
- [ ] UI verificada en 3 breakpoints (móvil/tablet/escritorio) y ambos temas.
- [ ] Sin regresiones de accesibilidad (foco visible, contraste AA, prefers-reduced-motion).
- [ ] Al menos un test nuevo por parser/exportador tocado (si aplica).

## Screenshots / GIF (si toca UI)

<!-- Pega capturas en móvil, tablet y escritorio, en tema claro y oscuro. -->

## Notas para revisión

<!-- Cualquier contexto que ayude a revisar: decisiones tomadas, alternativas descartadas, dependencias entre PRs. -->
