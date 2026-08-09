/**
 * Punto único de acceso a la configuración versionada de Canectt.
 * Fuente de verdad: config/schedule-defaults.json.
 *
 * El JSON se importa con import attributes (`with { type: 'json' }`), que es
 * compatible con Vite (browser) y Node 20.10+ (runtime). La ruta relativa
 * funciona tanto desde src/ (Vite/tsx/vitest) como desde dist/ (Node, tras
 * tsc con rootDir=./src) porque en ambos casos se sube 3 niveles hasta la
 * raíz del repo. Se valida con Zod en tiempo de carga.
 */
import scheduleDefaultsJson from '../../../config/schedule-defaults.json' with { type: 'json' };
import { ScheduleDefaultsSchema, type ScheduleDefaults } from './schema.js';

const parsed = ScheduleDefaultsSchema.safeParse(scheduleDefaultsJson);
if (!parsed.success) {
  throw new Error(
    'config/schedule-defaults.json inválido: ' + JSON.stringify(parsed.error.flatten()),
  );
}

export const scheduleDefaults: ScheduleDefaults = parsed.data;
export default scheduleDefaults;
export { ScheduleDefaultsSchema, type ScheduleDefaults } from './schema.js';
