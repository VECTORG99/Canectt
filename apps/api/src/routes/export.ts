/**
 * Rutas de exportación:
 *   POST /api/export/:format      — PDF/Word/Excel/Markdown
 *   POST /api/export/calendar/ics — .ics (iCalendar RFC 5545 con RRULE)
 *
 * El motor de exportación vive en @canectt/export-engine (Fase 4).
 * Mientras tanto, devolvemos 501 para los formatos no implementados aún.
 */
import { Router, type Router as RouterType, type Request, type Response } from 'express';
import { ScheduleSchema, type Schedule } from '@canectt/schema';

export const exportRouter: RouterType = Router();

const FORMATS = ['pdf', 'docx', 'xlsx', 'md'] as const;
type FileFormat = (typeof FORMATS)[number];

function parseSchedule(body: unknown): Schedule | null {
  const parsed = ScheduleSchema.safeParse(body);
  return parsed.success ? parsed.data : null;
}

exportRouter.post('/:format', (req: Request, res: Response) => {
  const format = req.params.format as FileFormat;
  if (!FORMATS.includes(format)) {
    res.status(400).json({ error: `Formato no soportado: ${format}` });
    return;
  }
  const schedule = parseSchedule(req.body);
  if (!schedule) {
    res.status(400).json({ error: 'Horario inválido.' });
    return;
  }
  // TODO (Fase 4): delegar a @canectt/export-engine.
  res.status(501).json({ error: 'Exportación de archivos aún no implementada.' });
});

exportRouter.post('/calendar/ics', (req: Request, res: Response) => {
  const schedule = parseSchedule(req.body);
  if (!schedule) {
    res.status(400).json({ error: 'Horario inválido.' });
    return;
  }
  // TODO (Fase 4): delegar a @canectt/export-engine.toIcs.
  res.status(501).json({ error: 'Exportación .ics aún no implementada.' });
});
