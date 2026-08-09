/**
 * Rutas de autenticación OAuth 2.0 con Google.
 * Usada UNICAMENTE para autorizar la escritura en Google Calendar,
 * no es un sistema de cuentas general.
 *
 *   GET  /api/auth/google          — inicia el flujo OAuth
 *   GET  /api/auth/google/callback — callback de Google, intercambia code por tokens
 *   POST /api/auth/logout          — cerrar sesión
 *   POST /api/auth/google/push     — crea eventos en Calendar (requiere sesión con tokens)
 *
 * El client secret vive solo en el backend, nunca se envía al navegador.
 */
import { Router, type Router as RouterType, type Request, type Response } from 'express';
import { ScheduleSchema } from '@canectt/schema';
import type { RecurrenceType } from '@canectt/export-engine';
import { env } from '../env';
import { getAuthUrl, exchangeCodeForTokens, pushScheduleToCalendar } from '../google-calendar';
import { asyncHandler } from '../asyncHandler';

export const authRouter: RouterType = Router();

interface SessionData {
  googleAccessToken?: string;
  googleRefreshToken?: string | null;
}

function getSession(req: Request): SessionData {
  return (req.session as SessionData) ?? {};
}

authRouter.get('/google', (req: Request, res: Response) => {
  if (!env.GOOGLE_CLIENT_ID) {
    res.status(503).json({
      error:
        'Integración con Google Calendar no configurada. Falta GOOGLE_CLIENT_ID en el backend.',
    });
    return;
  }
  // Guardar de dónde viene para redirigir tras el callback.
  const returnTo = (req.query.returnTo as string | undefined) ?? '/';
  const url = getAuthUrl(returnTo);
  res.redirect(url);
});

authRouter.get(
  '/google/callback',
  asyncHandler(async (req: Request, res: Response) => {
    const code = req.query.code as string | undefined;
    if (!code) {
      res.status(400).json({ error: 'Falta el código de autorización.' });
      return;
    }
    try {
      const tokens = await exchangeCodeForTokens(code);
      const session = req.session as SessionData;
      session.googleAccessToken = tokens.accessToken;
      session.googleRefreshToken = tokens.refreshToken;
      // Redirigir de vuelta al editor.
      const returnTo = (req.query.state as string | undefined) ?? '/';
      res.redirect(returnTo);
    } catch (err) {
      res.status(500).json({ error: `Error en OAuth: ${(err as Error).message}` });
    }
  }),
);

authRouter.post('/logout', (req, res) => {
  req.session?.destroy(() => {
    res.clearCookie(env.SESSION_COOKIE_NAME);
    res.json({ message: 'Sesión cerrada.' });
  });
});

authRouter.get('/status', (req: Request, res: Response) => {
  const session = getSession(req);
  res.json({ connected: Boolean(session.googleAccessToken) });
});

authRouter.post(
  '/google/push',
  asyncHandler(async (req: Request, res: Response) => {
    const session = getSession(req);
    if (!session.googleAccessToken) {
      res.status(401).json({ error: 'No autenticado con Google.' });
      return;
    }
    const body = req.body as {
      schedule?: unknown;
      startDate?: string;
      recurrence?: RecurrenceType;
      count?: number;
      calendarId?: string;
    };
    const parsed = ScheduleSchema.safeParse(body.schedule);
    if (!parsed.success) {
      res.status(400).json({ error: 'Horario inválido.' });
      return;
    }
    const result = await pushScheduleToCalendar(parsed.data, {
      accessToken: session.googleAccessToken,
      refreshToken: session.googleRefreshToken ?? null,
      startDate: body.startDate ?? new Date().toISOString().slice(0, 10),
      recurrence: body.recurrence ?? 'none',
      count: body.count,
      calendarId: body.calendarId,
    });
    res.json(result);
  }),
);
