import { timeToMinutes, minutesToTime } from '@canectt/schema';

export { timeToMinutes, minutesToTime };

/** Duración de un bloque en minutos. */
export function blockDurationMinutes(start: string, end: string): number {
  return timeToMinutes(end) - timeToMinutes(start);
}

/** Snap de un valor en minutos al intervalo más cercano. */
export function snapMinutes(value: number, snap: number): number {
  return Math.round(value / snap) * snap;
}

/** Altura en px para una duración dada, según la altura de fila por minuto. */
export function minutesToHeight(minutes: number, pxPerMinute: number): number {
  return Math.max(minutes * pxPerMinute, 24);
}

/** Offset top en px desde el inicio de la grilla para una hora dada. */
export function timeToTop(time: string, dayStartMinutes: number, pxPerMinute: number): number {
  return Math.max(timeToMinutes(time) - dayStartMinutes, 0) * pxPerMinute;
}
