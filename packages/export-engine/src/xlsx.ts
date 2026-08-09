/**
 * Exportador Excel (.xlsx): usa exceljs para generar una hoja con
 * columnas Hora inicio / Hora fin / Actividad / Notas.
 */
import ExcelJS from 'exceljs';
import type { Schedule } from '@canectt/schema';

export async function toXlsx(schedule: Schedule): Promise<Uint8Array> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Horario');

  // Cabeceras.
  ws.columns = [
    { header: 'Hora inicio', key: 'startTime', width: 14 },
    { header: 'Hora fin', key: 'endTime', width: 14 },
    { header: 'Actividad', key: 'title', width: 30 },
    { header: 'Notas', key: 'notes', width: 40 },
  ];

  // Estilo de cabecera.
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF0F0F0' },
  };

  const sorted = [...schedule.blocks].sort((a, b) => a.startTime.localeCompare(b.startTime));

  for (const block of sorted) {
    ws.addRow({
      startTime: block.startTime,
      endTime: block.endTime,
      title: block.title || 'Bloque',
      notes: block.notes ?? '',
    });
  }

  const buf = await wb.xlsx.writeBuffer();
  return new Uint8Array(buf);
}
