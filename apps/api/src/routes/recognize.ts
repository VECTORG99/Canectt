/**
 * POST /api/recognize
 * Recibe un archivo (Word/PDF/Excel/Markdown), valida por magic bytes y tamaño,
 * orquesta el árbol de reconocimiento y devuelve un Schedule canónico.
 */
import { Router, type Router as RouterType } from 'express';
import multer from 'multer';
import { recognize } from '@canectt/recognition-engine';
import { ScheduleSchema } from '@canectt/schema';
import { env } from '../env';
import { asyncHandler } from '../asyncHandler';

export const recognizeRouter: RouterType = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.UPLOAD_MAX_BYTES },
});

recognizeRouter.post(
  '/',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: 'No se recibió ningún archivo.' });
      return;
    }
    const data = new Uint8Array(req.file.buffer);
    const filename = req.file.originalname;
    const body = req.body as { title?: string };
    const title = body.title ?? filename.replace(/\.[^.]+$/, '');

    const result = await recognize({ data, filename, title });

    // Validar contra el esquema canónico antes de devolver.
    const parsed = ScheduleSchema.safeParse(result.schedule);
    const schedule = parsed.success ? parsed.data : result.schedule;

    res.json({
      schedule,
      format: result.format,
      warning: result.warning,
      confidence: result.confidence,
      scanned: result.scanned,
    });
  }),
);
