/**
 * POST /api/recognize
 * Recibe un archivo (Word/PDF/Excel/Markdown), valida por magic bytes y tamaño,
 * orquesta el árbol de reconocimiento y devuelve un Schedule canónico.
 */
import { Router, type Router as RouterType } from 'express';
import multer from 'multer';
import { recognize } from '@canectt/recognition-engine';
import { ScheduleSchema } from '@canectt/schema';
import { env } from '../env.js';
import { asyncHandler } from '../asyncHandler.js';

export const recognizeRouter: RouterType = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.UPLOAD_MAX_BYTES },
});

recognizeRouter.post(
  '/',
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        // MulterError (ej. archivo demasiado grande) → 400, no 500.
        const status = err instanceof multer.MulterError ? 400 : 500;
        const message = err instanceof Error ? err.message : 'Error al subir el archivo.';
        res.status(status).json({ error: message });
        return;
      }
      next();
    });
  },
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
