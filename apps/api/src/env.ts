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

export const env = parsed.data;
export type Env = typeof env;
