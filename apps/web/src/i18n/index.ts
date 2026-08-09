import { es, type Dictionary } from './es';

/**
 * Punto único de acceso al diccionario de UI.
 * Hoy solo español; cuando se agregue un segundo idioma, este archivo
 * selecciona según el locale activo.
 */
export const dictionary: Dictionary = es;

export type { Dictionary };
