/**
 * normalize: convierte el resultado del reconocedor a la forma canónica
 * de data_model.schedule y calcula overlap_group_id automáticamente.
 */
import {
  computeOverlapGroups,
  createEmptyBlock,
  createEmptySchedule,
  withRecomputedOverlap,
  type Schedule,
  type BlockColorToken,
} from '@canectt/schema';
import { scheduleDefaults } from '@canectt/config';
import type { RecognizedBlock, RecognitionResult } from './recognize.js';

export interface NormalizeOptions {
  title?: string;
  timezone?: string;
  /** Color por defecto para los bloques reconocidos. */
  defaultColor?: BlockColorToken;
  /** Rango visible del día. */
  dayRange?: { startTime: string; endTime: string };
}

/** Convierte RecognizedBlock[] a Schedule canónico. */
export function normalizeToSchedule(
  result: RecognitionResult,
  options: NormalizeOptions = {},
): Schedule {
  const schedule = createEmptySchedule({
    title: options.title ?? 'Horario importado',
    timezone: options.timezone ?? scheduleDefaults.export.defaultTimezone,
    dayRange: options.dayRange ?? { ...scheduleDefaults.editor.defaultDayRange },
  });

  const defaultColorToken = scheduleDefaults.blockColors.default as BlockColorToken;
  const color: BlockColorToken = options.defaultColor ?? defaultColorToken;

  const blocks = result.blocks.map((rb: RecognizedBlock) =>
    createEmptyBlock({
      title: rb.title,
      startTime: rb.startTime,
      endTime: rb.endTime,
      colorToken: color,
      notes: rb.notes ?? null,
    }),
  );

  // computeOverlapGroups recalcula overlapGroupId.
  const withGroups = computeOverlapGroups(blocks);
  return withRecomputedOverlap({ ...schedule, blocks: withGroups });
}
