/**
 * Rutas de autenticación OAuth 2.0 con Google.
 * Usada UNICAMENTE para autorizar la escritura en Google Calendar,
 * no es un sistema de cuentas general.
 *
 *   GET  /api/auth/google          — inicia el flujo OAuth
 *   GET  /api/auth/google/callback — callback de Google, intercambia code por tokens
 *   POST /api/auth/logout          — cerrar sesión
 *   GET  /api/auth/status          — ¿hay sesión con tokens de Google?
 *   POST /api/auth/google/push     — crea eventos en Calendar (requiere sesión con tokens)
 *
 * El client secret vive solo en el backend, nunca se envía al navegador.
 */
import { Router, type Router as RouterType, type Request, type Response } from 'express';
import { randomBytes } from 'node:crypto';
import { ScheduleSchema } from '@canectt/schema';
import type { RecurrenceType } from '@canectt/export-engine';
import { env } from '../env.js';
import { getAuthUrl, exchangeCodeForTokens, pushScheduleToCalendar } from '../google-calendar.js';
import { asyncHandler } from '../asyncHandler.js';

export const authRouter: RouterType = Router();

interface SessionData {
  googleAccessToken?: string;
  googleRefreshToken?: string | null;
  /** Token CSRF para validar el callback de OAuth. */
  oauthState?: string;
  /** Ruta de retorno segura (validada, solo rutas internas relativas). */
  returnTo?: string;
}

function getSession(req: Request): SessionData {
  return (req.session as SessionData) ?? {};
}

/**
 * Valida que returnTo sea una ruta interna segura (relativa, empieza con /,
 * no es una URL absoluta ni //). Previene open redirect.
 */
function sanitizeReturnTo(raw: unknown): string {
  if (typeof raw !== 'string' || raw.length === 0) return '/';
  // Solo permitir rutas que empiecen con / y no con // (protocolo relativo).
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/';
  // No permitir caracteres que puedan romper el header de redirección.
  if (/[\r\n]/.test(raw)) return '/';
  return raw;
}

authRouter.get('/google', (req: Request, res: Response) => {
  if (!env.GOOGLE_CLIENT_ID) {
    res.status(503).json({
      error:
        'Integración con Google Calendar no configurada. Falta GOOGLE_CLIENT_ID en el backend.',
    });
    return;
  }
  const session = getSession(req);
  // Generar state CSRF aleatorio y guardarlo en la sesión.
  const state = randomBytes(16).toString('hex');
  session.oauthState = state;
  // Guardar returnTo sanitizado para redirigir tras el callback.
  session.returnTo = sanitizeReturnTo(req.query.returnTo);
  const url = getAuthUrl(state);
  res.redirect(url);
});

authRouter.get(
  '/google/callback',
  asyncHandler(async (req: Request, res: Response) => {
    const code = req.query.code as string | undefined;
    const state = req.query.state as string | undefined;
    if (!code) {
      res.status(400).json({ error: 'Falta el código de autorización.' });
      return;
    }
    const session = getSession(req);
    // Validar CSRF: el state debe coincidir con el guardado en la sesión.
    if (!state || !session.oauthState || state !== session.oauthState) {
      res.status(400).json({ error: 'State CSRF inválido. Reiniciá el flujo de conexión.' });
      return;
    }
    // Limpiar el state usado.
    session.oauthState = undefined;
    try {
      const tokens = await exchangeCodeForTokens(code);
      session.googleAccessToken = tokens.accessToken;
      session.googleRefreshToken = tokens.refreshToken;
      // Redirigir de vuelta usando el returnTo sanitizado guardado en la sesión.
      // Añadimos ?google=connected para que el frontend pueda detectar el
      // regreso exitoso de OAuth y actualizar su estado de conexión.
      const returnTo = session.returnTo ?? '/';
      session.returnTo = undefined;
      const separator = returnTo.includes('?') ? '&' : '?';
      res.redirect(`${returnTo}${separator}google=connected`);
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
      byDay?: string[];
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
      byDay: body.byDay,
      count: body.count,
      calendarId: body.calendarId,
    });
    res.json(result);
  }),
);
