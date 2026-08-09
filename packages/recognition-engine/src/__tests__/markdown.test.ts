import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseMarkdown } from '../parsers/markdown.js';
import { recognizeBlocks } from '../recognize.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, '..', '..', '..', '..', 'fixtures');

describe('markdown parser', () => {
  it('extrae bloques de una tabla GFM con columnas Hora/Actividad', () => {
    const content = readFileSync(join(fixturesDir, 'rutina-gimnasio.md'), 'utf8');
    const { schedule, recognition } = parseMarkdown(content, { title: 'Rutina' });
    expect(recognition.blocks.length).toBeGreaterThanOrEqual(4);
    expect(schedule.title).toBe('Rutina');
    const first = recognition.blocks[0]!;
    expect(first.startTime).toBe('07:00');
    expect(first.endTime).toBe('08:00');
    expect(first.title).toContain('mañana');
  });

  it('reconoce rangos 24h en texto plano', () => {
    const text = '07:00 - 08:00 Rutina de mañana\n08:00 - 08:30 Desayuno';
    const result = recognizeBlocks(text);
    expect(result.blocks).toHaveLength(2);
    expect(result.blocks[0]!.startTime).toBe('07:00');
    expect(result.blocks[1]!.title).toBe('Desayuno');
  });

  it('devuelve confianza baja y aviso cuando no reconoce horas', () => {
    const text = 'Esto es un documento sin horarios, solo prosa.';
    const result = recognizeBlocks(text);
    expect(result.blocks).toHaveLength(0);
    expect(result.confidence).toBeLessThan(0.34);
    expect(result.warning).not.toBeNull();
  });
});
