/**
 * Rutas de autenticación OAuth 2.0 con Google.
 * Usada UNICAMENTE para autorizar la escritura en Google Calendar,
 * no es un sistema de cuentas general.
 *
 *   GET  /api/auth/google          — inicia el flujo OAuth
 *   GET  /api/auth/google/callback — callback de Google
 *   POST /api/auth/logout          — cerrar sesión
 *
 * El client secret vive solo en el backend, nunca se envía al navegador.
 * La implementación completa con Passport.js + googleapis se completa en Fase 4.
 */
import { Router, type Router as RouterType } from 'express';
import { env } from '../env';

export const authRouter: RouterType = Router();

authRouter.get('/google', (_req, res) => {
  if (!env.GOOGLE_CLIENT_ID) {
    res.status(503).json({
      error:
        'Integración con Google Calendar no configurada. Falta GOOGLE_CLIENT_ID en el backend.',
    });
    return;
  }
  // TODO (Fase 4): redirigir a Passport Google OAuth20.
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: env.GOOGLE_OAUTH_SCOPE,
    access_type: 'offline',
    prompt: 'consent',
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

authRouter.get('/google/callback', (_req, res) => {
  // TODO (Fase 4): intercambiar code por tokens con Passport + googleapis.
  res.json({ message: 'Callback de Google recibido. Implementación completa en Fase 4.' });
});

authRouter.post('/logout', (req, res) => {
  req.session?.destroy(() => {
    res.clearCookie(env.SESSION_COOKIE_NAME);
    res.json({ message: 'Sesión cerrada.' });
  });
});
