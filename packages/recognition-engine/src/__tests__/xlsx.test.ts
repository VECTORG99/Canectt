import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import ExcelJS from 'exceljs';
import { parseXlsx } from '../parsers/xlsx.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, '..', '..', '..', '..', 'fixtures');

describe('xlsx parser', () => {
  it('extrae bloques de un .xlsx con columnas Hora/Actividad', async () => {
    const data = readFileSync(join(fixturesDir, 'rutina-gimnasio.xlsx'));
    const { schedule, recognition } = await parseXlsx(new Uint8Array(data), { title: 'Rutina' });
    expect(recognition.blocks.length).toBeGreaterThanOrEqual(4);
    expect(schedule.title).toBe('Rutina');
    const first = recognition.blocks[0]!;
    expect(first.startTime).toBe('07:00');
    expect(first.endTime).toBe('08:00');
    expect(first.title).toContain('mañana');
  });

  it('ordena los bloques por hora de inicio', async () => {
    const data = readFileSync(join(fixturesDir, 'rutina-gimnasio.xlsx'));
    const { schedule } = await parseXlsx(new Uint8Array(data), { title: 'R' });
    const starts = schedule.blocks.map((b) => b.startTime);
    const sorted = [...starts].sort();
    expect(starts).toEqual(sorted);
  });

  it('preserva celdas vacías sin desalinear columnas', async () => {
    // Construir un .xlsx in-memory con una celda vacía en la columna "Actividad"
    // de la segunda fila. Si el parser colapsa celdas vacías (join con 2
    // espacios + split por 2+ espacios), la columna "Notas" se desplazaría
    // a la posición de "Actividad" y el título del segundo bloque sería
    // "Nota 2" en vez de "" (celda vacía real).
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Horario');
    ws.columns = [
      { header: 'Hora inicio', key: 'startTime', width: 14 },
      { header: 'Hora fin', key: 'endTime', width: 14 },
      { header: 'Actividad', key: 'title', width: 20 },
      { header: 'Notas', key: 'notes', width: 30 },
    ];
    // Fila 1 (cabecera) — ya puesta por ws.columns.
    // Fila 2: todas las columnas llenas.
    ws.addRow({ startTime: '08:00', endTime: '09:00', title: 'Actividad 1', notes: 'Nota 1' });
    // Fila 3: "Actividad" vacía — la columna "Notas" NO debe desplazarse
    // a la posición de "Actividad".
    ws.addRow({ startTime: '09:00', endTime: '10:00', title: '', notes: 'Nota 2' });

    const buf = await wb.xlsx.writeBuffer();
    const { recognition } = await parseXlsx(new Uint8Array(buf), { title: 'Test' });

    // Debe reconocer 2 bloques por las horas de inicio/fin.
    expect(recognition.blocks).toHaveLength(2);
    // El primer bloque tiene título "Actividad 1".
    expect(recognition.blocks[0]!.title).toBe('Actividad 1');
    // El segundo bloque tiene hora correcta.
    expect(recognition.blocks[1]!.startTime).toBe('09:00');
    expect(recognition.blocks[1]!.endTime).toBe('10:00');
    // El título del segundo bloque debe ser "" (celda vacía), NO "Nota 2"
    // (que es lo que pasaría si las celdas vacías se colapsaran y "Notas"
    // se desplazara a la columna "Actividad").
    expect(recognition.blocks[1]!.title).toBe('');
  });
});
