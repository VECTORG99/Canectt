/**
 * Exportador PDF: usa jsPDF para generar un PDF tabulado sin dependencias
 * de Chromium (headless). Layout vertical A4, tabla con horas y actividades.
 */
import { jsPDF } from 'jspdf';
import type { Schedule } from '@canectt/schema';

export function toPdf(schedule: Schedule): Uint8Array {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Título.
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(schedule.title, margin, 25);

  // Metadatos.
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Zona horaria: ${schedule.timezone}`, margin, 33);
  doc.text(`Generado: ${new Date().toLocaleString('es')}`, margin, 38);

  // Cabecera de tabla.
  const tableTop = 48;
  const rowHeight = 8;
  const colTime = margin;
  const colActivity = margin + 45;
  const colNotes = margin + contentWidth * 0.7;

  doc.setFillColor(240, 240, 240);
  doc.rect(margin, tableTop - 5, contentWidth, rowHeight, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Hora', colTime, tableTop);
  doc.text('Actividad', colActivity, tableTop);
  doc.text('Notas', colNotes, tableTop);

  // Filas.
  const sorted = [...schedule.blocks].sort((a, b) => a.startTime.localeCompare(b.startTime));

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  let y = tableTop + rowHeight;
  const pageHeight = doc.internal.pageSize.getHeight();
  const bottomMargin = 20;

  for (const block of sorted) {
    if (y > pageHeight - bottomMargin) {
      doc.addPage();
      y = 25;
    }
    const time = `${block.startTime} - ${block.endTime}`;
    const title = block.title || 'Bloque';
    const notes = (block.notes ?? '').slice(0, 50);
    doc.text(time, colTime, y);
    doc.text(title, colActivity, y);
    doc.text(notes, colNotes, y);
    y += rowHeight;
  }

  // Pie de página en cada página.
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Canectt — Página ${i}/${pageCount}`, pageWidth / 2, pageHeight - 10, {
      align: 'center',
    });
    doc.setTextColor(0);
  }

  const ab = doc.output('arraybuffer');
  return new Uint8Array(ab);
}
