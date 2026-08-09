/**
 * Helpers del esquema canónico.
 * - computeOverlapGroups: agrupa bloques que se solapan en el tiempo sin
 *   relación padre-hijo. El campo `overlapGroupId` se recalcula en cada cambio,
 *   nunca se guarda a mano.
 * - createEmptySchedule / createEmptyBlock: factories convenientes.
 */
import type { Block, Schedule } from './schedule.js';

/**
 * Genera un UUID v4 usando la Web Crypto API (disponible en navegadores
 * modernos y en Node.js >= 19). Isomórfica: sin dependencia de node:crypto.
 */
interface CryptoWithUuid {
  randomUUID?: () => string;
}
function uuid(): string {
  // En Node 20+ y navegadores, `crypto` es global. En entornos sin
  // `crypto.randomUUID`, caemos a un fallback RFC4122 v4.
  const g = globalThis as { crypto?: CryptoWithUuid };
  const c = g.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  // Fallback determinista a partir de Math.random (no criptográfico).
  const rnd = (n: number) => Math.floor(Math.random() * n);
  const hex = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) out += '-';
    else if (i === 14) out += '4';
    else if (i === 19) out += hex[(rnd(4) & 0x3) | 0x8];
    else out += hex[rnd(16)];
  }
  return out;
}

/** Convierte "HH:mm" a minutos desde medianoche. */
export function timeToMinutes(t: string): number {
  const parts = t.split(':').map(Number);
  const h = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  return h * 60 + m;
}

/** Convierte minutos desde medianoche a "HH:mm". */
export function minutesToTime(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** ¿Se solapan dos bloques en el tiempo? (intervalos semi-abiertos: [start, end)) */
export function blocksOverlap(a: Block, b: Block): boolean {
  const aStart = timeToMinutes(a.startTime);
  const aEnd = timeToMinutes(a.endTime);
  const bStart = timeToMinutes(b.startTime);
  const bEnd = timeToMinutes(b.endTime);
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Calcula overlapGroupId para todos los bloques del horario.
 * Dos bloques comparten grupo si se solapan en el tiempo Y no tienen relación
 * padre-hijo entre sí. Los bloques anidados (parentId != null) no arrastran
 * su propio grupo: heredan visualmente el espacio del padre.
 *
 * Devuelve una copia nueva de los bloques con overlapGroupId asignado.
 */
export function computeOverlapGroups(blocks: Block[]): Block[] {
  // Solo consideramos bloques "raíz" (sin parentId) para el agrupamiento de solapamientos.
  const roots = blocks.filter((b) => b.parentId === null);
  const groups: Block[][] = [];

  for (const block of roots) {
    let placed = false;
    for (const group of groups) {
      if (group.some((g) => blocksOverlap(g, block))) {
        group.push(block);
        placed = true;
        break;
      }
    }
    if (!placed) groups.push([block]);
  }

  // Asignar IDs de grupo: solo a grupos con más de un miembro (solapamiento real).
  const groupIdByBlockId = new Map<string, string | null>();
  groups.forEach((group, idx) => {
    if (group.length > 1) {
      const gid = `overlap-${idx + 1}`;
      for (const b of group) groupIdByBlockId.set(b.id, gid);
    } else {
      groupIdByBlockId.set(group[0]!.id, null);
    }
  });

  // Los bloques anidados no reciben grupo propio.
  for (const b of blocks) {
    if (b.parentId !== null) groupIdByBlockId.set(b.id, null);
  }

  return blocks.map((b) => ({ ...b, overlapGroupId: groupIdByBlockId.get(b.id) ?? null }));
}

/** Crea un bloque vacío con defaults razonables. */
export function createEmptyBlock(partial: Partial<Block> = {}): Block {
  const id = partial.id ?? uuid();
  return {
    id,
    title: partial.title ?? '',
    startTime: partial.startTime ?? '09:00',
    endTime: partial.endTime ?? '09:30',
    colorToken: partial.colorToken ?? 'block-blue',
    notes: partial.notes ?? null,
    parentId: partial.parentId ?? null,
    overlapGroupId: partial.overlapGroupId ?? null,
  };
}

/** Crea un horario vacío con defaults razonables. */
export function createEmptySchedule(partial: Partial<Schedule> = {}): Schedule {
  return {
    id: partial.id ?? uuid(),
    title: partial.title ?? 'Mi horario',
    dayRange: partial.dayRange ?? { startTime: '06:00', endTime: '23:00' },
    recurrence: partial.recurrence ?? { freq: 'NONE' },
    timezone: partial.timezone ?? 'America/Santiago',
    blocks: partial.blocks ?? [],
  };
}

/** Reaplica computeOverlapGroups a un Schedule y devuelve uno nuevo. */
export function withRecomputedOverlap(schedule: Schedule): Schedule {
  return { ...schedule, blocks: computeOverlapGroups(schedule.blocks) };
}
