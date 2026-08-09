import { describe, it, expect } from 'vitest';
import {
  ScheduleSchema,
  BlockSchema,
  BlockEditSchema,
  TimeStringSchema,
  createEmptySchedule,
  createEmptyBlock,
  computeOverlapGroups,
  withRecomputedOverlap,
  timeToMinutes,
  minutesToTime,
} from '../index.js';

describe('TimeStringSchema', () => {
  it('acepta HH:mm válidas', () => {
    expect(TimeStringSchema.safeParse('00:00').success).toBe(true);
    expect(TimeStringSchema.safeParse('23:59').success).toBe(true);
    expect(TimeStringSchema.safeParse('08:30').success).toBe(true);
  });
  it('rechaza formatos inválidos', () => {
    expect(TimeStringSchema.safeParse('24:00').success).toBe(false);
    expect(TimeStringSchema.safeParse('8:30').success).toBe(false);
    expect(TimeStringSchema.safeParse('08:60').success).toBe(false);
    expect(TimeStringSchema.safeParse('abc').success).toBe(false);
  });
});

describe('BlockSchema', () => {
  it('rechaza endTime <= startTime', () => {
    const block = createEmptyBlock({ startTime: '10:00', endTime: '10:00' });
    expect(BlockSchema.safeParse(block).success).toBe(false);
  });
  it('rechaza parentId igual al propio id', () => {
    const block = createEmptyBlock({ parentId: '00000000-0000-0000-0000-000000000000' });
    block.id = '00000000-0000-0000-0000-000000000000';
    expect(BlockSchema.safeParse(block).success).toBe(false);
  });
});

describe('BlockEditSchema', () => {
  const validBase = {
    title: 'Bloque',
    startTime: '08:00',
    endTime: '09:00',
    colorToken: 'block-blue' as const,
    notes: '',
  };
  it('acepta parentId vacío (string "") y lo coerce a null (caso del <select> HTML)', () => {
    const result = BlockEditSchema.safeParse({ ...validBase, parentId: '' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.parentId).toBeNull();
  });
  it('acepta parentId null explícito', () => {
    const result = BlockEditSchema.safeParse({ ...validBase, parentId: null });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.parentId).toBeNull();
  });
  it('acepta parentId undefined y lo defaultea a null', () => {
    const result = BlockEditSchema.safeParse({ ...validBase });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.parentId).toBeNull();
  });
  it('acepta un UUID válido como parentId', () => {
    const result = BlockEditSchema.safeParse({
      ...validBase,
      parentId: '00000000-0000-0000-0000-000000000000',
    });
    expect(result.success).toBe(true);
  });
  it('rechaza un parentId que no es UUID ni vacío/null', () => {
    const result = BlockEditSchema.safeParse({ ...validBase, parentId: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });
});

describe('ScheduleSchema', () => {
  it('valida un horario vacío', () => {
    const schedule = createEmptySchedule();
    expect(ScheduleSchema.safeParse(schedule).success).toBe(true);
  });
  it('rechaza dayRange con endTime <= startTime', () => {
    const schedule = createEmptySchedule({ dayRange: { startTime: '23:00', endTime: '06:00' } });
    expect(ScheduleSchema.safeParse(schedule).success).toBe(false);
  });
  it('rechaza un bloque anidado cuyo rango excede al padre', () => {
    const parent = createEmptyBlock({ startTime: '07:00', endTime: '09:00', title: 'Padre' });
    const child = createEmptyBlock({
      startTime: '08:30',
      endTime: '09:30',
      parentId: parent.id,
      title: 'Hijo',
    });
    const schedule = createEmptySchedule({ blocks: [parent, child] });
    expect(ScheduleSchema.safeParse(schedule).success).toBe(false);
  });
  it('acepta un bloque anidado dentro del rango del padre', () => {
    const parent = createEmptyBlock({ startTime: '07:00', endTime: '09:00', title: 'Padre' });
    const child = createEmptyBlock({
      startTime: '07:30',
      endTime: '08:00',
      parentId: parent.id,
      title: 'Hijo',
    });
    const schedule = createEmptySchedule({ blocks: [parent, child] });
    expect(ScheduleSchema.safeParse(schedule).success).toBe(true);
  });
});

describe('computeOverlapGroups', () => {
  it('asigna null cuando no hay solapamientos', () => {
    const a = createEmptyBlock({ startTime: '08:00', endTime: '09:00' });
    const b = createEmptyBlock({ startTime: '09:00', endTime: '10:00' });
    const result = computeOverlapGroups([a, b]);
    expect(result.every((r) => r.overlapGroupId === null)).toBe(true);
  });
  it('asigna el mismo groupId a bloques que se solapan', () => {
    const a = createEmptyBlock({ startTime: '08:00', endTime: '09:30' });
    const b = createEmptyBlock({ startTime: '09:00', endTime: '10:00' });
    const result = computeOverlapGroups([a, b]);
    expect(result[0]!.overlapGroupId).not.toBeNull();
    expect(result[0]!.overlapGroupId).toBe(result[1]!.overlapGroupId);
  });
  it('no asigna grupo a bloques anidados', () => {
    const parent = createEmptyBlock({ startTime: '08:00', endTime: '10:00' });
    const child = createEmptyBlock({ startTime: '08:30', endTime: '09:00', parentId: parent.id });
    const result = computeOverlapGroups([parent, child]);
    expect(child.id).toBeDefined();
    const childResult = result.find((r) => r.id === child.id);
    expect(childResult?.overlapGroupId).toBeNull();
  });
});

describe('time helpers', () => {
  it('timeToMinutes y minutesToTime son inversos', () => {
    expect(minutesToTime(timeToMinutes('08:30'))).toBe('08:30');
    expect(minutesToTime(timeToMinutes('23:59'))).toBe('23:59');
    expect(minutesToTime(timeToMinutes('00:00'))).toBe('00:00');
  });
});

describe('withRecomputedOverlap', () => {
  it('devuelve un nuevo Schedule con overlapGroupId recalculado', () => {
    const a = createEmptyBlock({ startTime: '08:00', endTime: '09:30' });
    const b = createEmptyBlock({ startTime: '09:00', endTime: '10:00' });
    const schedule = createEmptySchedule({ blocks: [a, b] });
    const result = withRecomputedOverlap(schedule);
    expect(result.blocks[0]!.overlapGroupId).not.toBeNull();
    expect(result.blocks[0]!.overlapGroupId).toBe(result.blocks[1]!.overlapGroupId);
  });
});
