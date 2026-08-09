/**
 * App Express de Canectt.
 * Responsabilidades: recibir archivos, orquestar reconocimiento, manejar OAuth
 * de Google y generar exportaciones. El client secret NUNCA se envía al navegador.
 */
import express, { type Request, type Response, type NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import { env } from './env.js';
import { recognizeRouter } from './routes/recognize.js';
import { exportRouter } from './routes/export.js';
import { authRouter } from './routes/auth.js';
import { schedulesRouter } from './routes/schedules.js';

export function createApp(): express.Express {
  const app = express();

  // Seguridad: cabeceras, CORS, rate limit, body parsing.
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ALLOWED_ORIGINS.split(',').map((s) => s.trim()),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(
    session({
      name: env.SESSION_COOKIE_NAME,
      secret: env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: env.SESSION_COOKIE_MAX_AGE_MS,
      },
    }),
  );
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 60,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
    }),
  );

  // Healthcheck.
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', version: '0.1.0' });
  });

  // Rutas.
  app.use('/api/recognize', recognizeRouter);
  app.use('/api/export', exportRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/schedules', schedulesRouter);

  // Manejo de errores centralizado.
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    const status = (err as { status?: number }).status ?? 500;
    // Errores 4xx del cliente: el mensaje es seguro de mostrar (fue producido
    // por nuestro propio código de validación). Errores 5xx: nunca exponer
    // detalles internos al cliente; se loguean en el servidor.
    if (status >= 500) {
      res.status(status).json({ error: 'Error interno del servidor.' });
      return;
    }
    res.status(status).json({ error: err.message || 'Error en la solicitud.' });
  });

  return app;
}
