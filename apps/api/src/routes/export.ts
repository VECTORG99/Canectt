/**
 * Rutas de exportación:
 *   POST /api/export/:format      — PDF/Word/Excel/Markdown
 *   POST /api/export/calendar/ics — .ics (iCalendar RFC 5545 con RRULE)
 *
 * Delega al @canectt/export-engine. El client secret de Google NUNCA
 * se envía al navegador; la escritura a Calendar se hace desde el backend.
 */
import { Router, type Router as RouterType, type Request, type Response } from 'express';
import { ScheduleSchema, ExportOptionsSchema, type Schedule } from '@canectt/schema';
import { exportSchedule } from '@canectt/export-engine';
import { asyncHandler } from '../asyncHandler.js';

export const exportRouter: RouterType = Router();

const FILE_FORMATS = ['pdf', 'docx', 'xlsx', 'md'] as const;
type FileFormat = (typeof FILE_FORMATS)[number];

function parseSchedule(body: unknown): Schedule | null {
  const parsed = ScheduleSchema.safeParse(body);
  return parsed.success ? parsed.data : null;
}

exportRouter.post(
  '/:format',
  asyncHandler(async (req: Request, res: Response) => {
    const format = req.params.format as FileFormat;
    if (!FILE_FORMATS.includes(format)) {
      res.status(400).json({ error: `Formato no soportado: ${format}` });
      return;
    }
    const schedule = parseSchedule(req.body);
    if (!schedule) {
      res.status(400).json({ error: 'Horario inválido.' });
      return;
    }
    const result = await exportSchedule(schedule, format);
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="horario.${result.extension}"`);
    res.send(Buffer.from(result.data));
  }),
);

exportRouter.post(
  '/calendar/ics',
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = ExportOptionsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Parámetros de exportación inválidos.',
        details: parsed.error.flatten(),
      });
      return;
    }
    const { schedule, recurrence, byDay, startDate, count } = parsed.data;
    const result = await exportSchedule(schedule, 'ics', {
      recurrence,
      byDay,
      startDate,
      count,
    });
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="horario.ics"`);
    res.send(Buffer.from(result.data));
  }),
);
