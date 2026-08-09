import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePdf } from '../parsers/pdf.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, '..', '..', '..', '..', 'fixtures');

describe('pdf parser', () => {
  it('extrae bloques de un PDF con capa de texto', async () => {
    const data = readFileSync(join(fixturesDir, 'rutina-gimnasio.pdf'));
    const { schedule, recognition, scanned } = await parsePdf(new Uint8Array(data), {
      title: 'Rutina',
    });
    expect(scanned).toBe(false);
    expect(recognition.blocks.length).toBeGreaterThanOrEqual(4);
    expect(schedule.title).toBe('Rutina');
    const first = recognition.blocks[0]!;
    expect(first.startTime).toBe('07:00');
    expect(first.endTime).toBe('08:00');
    expect(first.title).toContain('mañana');
  });

  it('marca como escaneado un PDF sin capa de texto', async () => {
    // PDF mínimo con una sola página vacía (sin texto extraíble).
    // Construimos un PDF con un stream de contenido vacío.
    const emptyPdf =
      '%PDF-1.4\n1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << >> /Contents 4 0 R >>endobj\n4 0 obj<< /Length 0 >>\nstream\n\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000238 00000 n \ntrailer<< /Size 5 /Root 1 0 R >>\nstartxref\n278\n%%EOF';
    const { recognition, scanned } = await parsePdf(new TextEncoder().encode(emptyPdf), {
      title: 'Vacío',
      scannedThreshold: 50,
    });
    expect(scanned).toBe(true);
    expect(recognition.confidence).toBe(0);
    expect(recognition.warning).not.toBeNull();
  });
});
