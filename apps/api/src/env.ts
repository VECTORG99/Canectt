/**
 * Carga y validación de variables de entorno del backend.
 * Nunca acceder a process.env directamente en el resto del código:
 * importar desde aquí.
 */
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().default(8787),
  API_PUBLIC_URL: z.string().url().default('http://localhost:8787'),
  WEB_PUBLIC_URL: z.string().url().default('http://localhost:5173'),

  GOOGLE_CLIENT_ID: z.string().default(''),
  GOOGLE_CLIENT_SECRET: z.string().default(''),
  GOOGLE_REDIRECT_URI: z.string().default('http://localhost:8787/api/auth/google/callback'),
  GOOGLE_OAUTH_SCOPE: z.string().default('https://www.googleapis.com/auth/calendar.events'),

  // En producción el SESSION_SECRET debe proveerse explícitamente y ser robusto
  // (>= 32 bytes de entropía). En desarrollo/test se permite un valor por defecto.
  SESSION_SECRET: z.string().default('dev-insecure-secret-change-me'),
  SESSION_COOKIE_MAX_AGE_MS: z.coerce.number().default(600000),
  SESSION_COOKIE_NAME: z.string().default('canectt_sid'),

  UPLOAD_MAX_BYTES: z.coerce.number().default(10485760),
  UPLOAD_TIMEOUT_MS: z.coerce.number().default(30000),

  DATABASE_URL: z.string().default(''),

  CORS_ALLOWED_ORIGINS: z.string().default('http://localhost:5173'),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Variables de entorno inválidas:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const env = parsed.data;

// Defensa en profundidad: en producción no arrancar con un secret inseguro.
// Esto evita que un despliegue mal configurado firme cookies con un valor conocido.
if (env.NODE_ENV === 'production') {
  const INSECURE_SECRETS = new Set([
    'dev-insecure-secret-change-me',
    'change-me-in-production',
    '',
  ]);
  if (INSECURE_SECRETS.has(env.SESSION_SECRET) || env.SESSION_SECRET.length < 32) {
    console.error(
      'SESSION_SECRET inseguro para producción: debe estar definido, tener >= 32 caracteres ' +
        'y no ser un valor por defecto. Generá uno con `openssl rand -base64 64`.',
    );
    process.exit(1);
  }
  // OAuth de Google es requerido para el flujo de exportación a Calendar.
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    console.error(
      'GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET son obligatorios en producción para ' +
        'la integración con Google Calendar.',
    );
    process.exit(1);
  }
}

export { env };
export type Env = typeof env;
