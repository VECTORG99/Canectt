/**
 * Exportador Word (.docx): usa la librería docx para generar un documento
 * con título, metadatos y tabla de horario.
 */
import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  TextRun,
} from 'docx';
import type { Schedule } from '@canectt/schema';

export async function toDocx(schedule: Schedule): Promise<Uint8Array> {
  const sorted = [...schedule.blocks].sort((a, b) => a.startTime.localeCompare(b.startTime));

  const headerRow = new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Hora', bold: true })] })],
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Actividad', bold: true })] })],
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Notas', bold: true })] })],
      }),
    ],
  });

  const dataRows = sorted.map(
    (block) =>
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph(`${block.startTime} - ${block.endTime}`)],
          }),
          new TableCell({
            children: [new Paragraph(block.title || 'Bloque')],
          }),
          new TableCell({
            children: [new Paragraph(block.notes ?? '')],
          }),
        ],
      }),
  );

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: schedule.title, bold: true })],
          }),
          new Paragraph({
            children: [new TextRun({ text: `Zona horaria: ${schedule.timezone}`, italics: true })],
          }),
          new Paragraph({ children: [new TextRun({ text: '' })] }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [headerRow, ...dataRows],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  return new Uint8Array(await blob.arrayBuffer());
}
