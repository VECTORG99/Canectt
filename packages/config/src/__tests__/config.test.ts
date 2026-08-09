import { describe, it, expect } from 'vitest';
import { scheduleDefaults, ScheduleDefaultsSchema } from '../index.js';

describe('scheduleDefaults', () => {
  it('valida contra el esquema Zod', () => {
    const result = ScheduleDefaultsSchema.safeParse(scheduleDefaults);
    expect(result.success).toBe(true);
  });

  it('tiene un rango de día por defecto válido', () => {
    const { startTime, endTime } = scheduleDefaults.editor.defaultDayRange;
    expect(startTime).toMatch(/^\d{2}:\d{2}$/);
    expect(endTime).toMatch(/^\d{2}:\d{2}$/);
    expect(endTime > startTime).toBe(true);
  });

  it('tiene al menos un color de bloque disponible', () => {
    expect(scheduleDefaults.blockColors.available.length).toBeGreaterThan(0);
    expect(scheduleDefaults.blockColors.default).toBeTruthy();
  });

  it('tiene extensiones aceptadas para los 4 formatos', () => {
    const exts = scheduleDefaults.upload.acceptedExtensions;
    expect(exts).toContain('.pdf');
    expect(exts).toContain('.docx');
    expect(exts).toContain('.md');
    expect(exts).toContain('.xlsx');
  });
});
