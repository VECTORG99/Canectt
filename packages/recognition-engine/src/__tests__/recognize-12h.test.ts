import { describe, it, expect } from 'vitest';
import { recognizeBlocks, normalize12hTime } from '../recognize.js';

describe('recognizeBlocks — patrón 12h con am/pm', () => {
  it('reconoce "8am-9am" sin minutos', () => {
    const result = recognizeBlocks('8am-9am Mañana');
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]!.startTime).toBe('08:00');
    expect(result.blocks[0]!.endTime).toBe('09:00');
    expect(result.blocks[0]!.title).toBe('Mañana');
  });

  it('reconoce "8:00 AM - 9:00 PM" con minutos y mayúsculas', () => {
    const result = recognizeBlocks('8:00 AM - 9:00 PM Trabajo');
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]!.startTime).toBe('08:00');
    expect(result.blocks[0]!.endTime).toBe('21:00');
    expect(result.blocks[0]!.title).toBe('Trabajo');
  });

  it('reconoce "8 a.m. - 9 a.m." con puntos y espacios', () => {
    const result = recognizeBlocks('8 a.m. - 9 a.m. Desayuno');
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]!.startTime).toBe('08:00');
    expect(result.blocks[0]!.endTime).toBe('09:00');
    expect(result.blocks[0]!.title).toBe('Desayuno');
  });

  it('reconoce "12pm-1pm" (mediodía a 1pm)', () => {
    const result = recognizeBlocks('12pm-1pm Almuerzo');
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]!.startTime).toBe('12:00');
    expect(result.blocks[0]!.endTime).toBe('13:00');
  });

  it('reconoce "12am-1am" (medianoche a 1am)', () => {
    const result = recognizeBlocks('12am-1am Madrugada');
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]!.startTime).toBe('00:00');
    expect(result.blocks[0]!.endTime).toBe('01:00');
  });

  it('reconoce "8:30 PM - 10:00 PM" con minutos distintos', () => {
    const result = recognizeBlocks('8:30 PM - 10:00 PM Cine');
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]!.startTime).toBe('20:30');
    expect(result.blocks[0]!.endTime).toBe('22:00');
  });

  it('reconoce múltiples rangos 12h en un documento', () => {
    const text = '8am-9am Mañana\n9am-10am Trabajo\n6pm-7pm Gimnasio';
    const result = recognizeBlocks(text);
    expect(result.blocks).toHaveLength(3);
    expect(result.blocks[0]!.startTime).toBe('08:00');
    expect(result.blocks[1]!.startTime).toBe('09:00');
    expect(result.blocks[2]!.startTime).toBe('18:00');
  });
});

describe('normalize12hTime', () => {
  it('convierte 8am a 08:00', () => {
    expect(normalize12hTime(8, 0, 'am')).toBe('08:00');
  });

  it('convierte 12am a 00:00 (medianoche)', () => {
    expect(normalize12hTime(12, 0, 'am')).toBe('00:00');
  });

  it('convierte 12pm a 12:00 (mediodía)', () => {
    expect(normalize12hTime(12, 0, 'pm')).toBe('12:00');
  });

  it('convierte 1pm a 13:00', () => {
    expect(normalize12hTime(1, 30, 'pm')).toBe('13:30');
  });

  it('maneja variantes de formato (a.m., A.M., am)', () => {
    expect(normalize12hTime(8, 0, 'a.m.')).toBe('08:00');
    expect(normalize12hTime(8, 0, 'A.M.')).toBe('08:00');
    expect(normalize12hTime(8, 0, 'AM')).toBe('08:00');
  });
});
