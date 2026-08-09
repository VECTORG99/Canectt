/**
 * Test E2E del flujo OAuth de Google Calendar.
 *
 * Como no tenemos credenciales reales de Google, mockeamos `googleapis`
 * para simular el flujo completo:
 *   1. GET /api/auth/google → redirige a Google
 *   2. GET /api/auth/google/callback → intercambia code por tokens
 *   3. GET /api/auth/status → verifica sesión
 *   4. POST /api/auth/google/push → crea eventos en Calendar
 *   5. POST /api/auth/logout → cierra sesión
 *
 * Esto verifica que el wiring del flujo OAuth es correcto sin necesitar
 * credenciales reales. Para una verificación con Google real, ver issue #11.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import type { Schedule } from '@canectt/schema';
import { createEmptySchedule, createEmptyBlock } from '@canectt/schema';

// Mock de googleapis para simular las llamadas a Google.
const mockGetToken = vi.fn();
const mockEventsInsert = vi.fn();
const mockGenerateAuthUrl = vi.fn();

vi.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: class MockOAuth2Client {
        generateAuthUrl(opts: { state?: string }) {
          mockGenerateAuthUrl(opts);
          return `https://accounts.google.com/o/oauth2/auth?state=${opts.state}&scope=calendar`;
        }
        getToken(code: string) {
          mockGetToken(code);
          return Promise.resolve({
            tokens: {
              access_token: 'mock-access-token',
              refresh_token: 'mock-refresh-token',
              expiry_date: Date.now() + 3600000,
            },
          });
        }
        setCredentials() {}
      },
    },
    calendar: () => ({
      events: {
        insert: mockEventsInsert,
      },
    }),
  },
}));

// Mock de env para que GOOGLE_CLIENT_ID esté configurado.
vi.mock('../env.js', () => ({
  env: {
    NODE_ENV: 'test',
    API_PORT: 8787,
    API_PUBLIC_URL: 'http://localhost:8787',
    WEB_PUBLIC_URL: 'http://localhost:5173',
    GOOGLE_CLIENT_ID: 'mock-client-id',
    GOOGLE_CLIENT_SECRET: 'mock-client-secret',
    GOOGLE_REDIRECT_URI: 'http://localhost:8787/api/auth/google/callback',
    GOOGLE_OAUTH_SCOPE: 'https://www.googleapis.com/auth/calendar.events',
    SESSION_SECRET: 'test-session-secret-at-least-32-chars-long',
    SESSION_COOKIE_MAX_AGE_MS: 600000,
    SESSION_COOKIE_NAME: 'canectt_sid',
    UPLOAD_MAX_BYTES: 10485760,
    UPLOAD_TIMEOUT_MS: 30000,
    DATABASE_URL: '',
    CORS_ALLOWED_ORIGINS: 'http://localhost:5173',
  },
}));

function makeSchedule(): Schedule {
  const schedule = createEmptySchedule({
    title: 'Test OAuth',
    timezone: 'America/Santiago',
  });
  const block = createEmptyBlock({ title: 'Mañana', startTime: '07:00', endTime: '08:00' });
  return { ...schedule, blocks: [block] };
}

describe('Flujo OAuth de Google Calendar (mockeado)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEventsInsert.mockResolvedValue({ data: { id: 'event-1' } });
  });

  it('GET /api/auth/google → 302 redirect a Google', async () => {
    const app = createApp();
    const res = await request(app).get('/api/auth/google');
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('accounts.google.com');
    expect(mockGenerateAuthUrl).toHaveBeenCalledOnce();
  });

  it('GET /api/auth/google/callback → intercambia code por tokens y redirige', async () => {
    const app = createApp();
    // Primero iniciar OAuth para obtener state válido en la sesión.
    const startRes = await request(app).get('/api/auth/google');
    const cookies = startRes.headers['set-cookie'] as unknown as string[];

    // Extraer state de la URL de redirect.
    const location = startRes.headers.location as string;
    const stateMatch = location.match(/state=([^&]+)/);
    const state = stateMatch?.[1];

    // Callback con el state correcto.
    const res = await request(app)
      .get('/api/auth/google/callback')
      .query({ code: 'mock-auth-code', state })
      .set('Cookie', cookies);
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('google=connected');
    expect(mockGetToken).toHaveBeenCalledWith('mock-auth-code');
  });

  it('GET /api/auth/google/callback → 400 si state CSRF no coincide', async () => {
    const app = createApp();
    const res = await request(app)
      .get('/api/auth/google/callback')
      .query({ code: 'mock-auth-code', state: 'wrong-state' });
    expect(res.status).toBe(400);
    expect((res.body as { error: string }).error).toMatch(/state csrf/i);
  });

  it('GET /api/auth/status → { connected: false } sin sesión', async () => {
    const app = createApp();
    const res = await request(app).get('/api/auth/status');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ connected: false });
  });

  it('POST /api/auth/google/push → 401 sin sesión', async () => {
    const app = createApp();
    const res = await request(app).post('/api/auth/google/push').send({ schedule: makeSchedule() });
    expect(res.status).toBe(401);
  });

  it('flujo completo: OAuth → status → push → logout', async () => {
    const app = createApp();

    // 1. Iniciar OAuth.
    const startRes = await request(app).get('/api/auth/google');
    const cookies = startRes.headers['set-cookie'] as unknown as string[];
    const location = startRes.headers.location as string;
    const state = location.match(/state=([^&]+)/)?.[1];

    // 2. Callback para obtener tokens.
    await request(app)
      .get('/api/auth/google/callback')
      .query({ code: 'mock-auth-code', state })
      .set('Cookie', cookies);

    // 3. Verificar status (conectado).
    const statusRes = await request(app).get('/api/auth/status').set('Cookie', cookies);
    expect(statusRes.status).toBe(200);
    expect(statusRes.body).toEqual({ connected: true });

    // 4. Push a Calendar.
    const pushRes = await request(app)
      .post('/api/auth/google/push')
      .send({
        schedule: makeSchedule(),
        recurrence: 'daily',
        count: 7,
        startDate: '2025-01-06',
      })
      .set('Cookie', cookies);
    expect(pushRes.status).toBe(200);
    const pushBody = pushRes.body as { created: number; errors: string[] };
    expect(pushBody.created).toBe(1);
    expect(pushBody.errors).toEqual([]);
    expect(mockEventsInsert).toHaveBeenCalledOnce();

    // 5. Logout.
    const logoutRes = await request(app).post('/api/auth/logout').set('Cookie', cookies);
    expect(logoutRes.status).toBe(200);

    // 6. Verificar status (desconectado).
    const statusAfter = await request(app).get('/api/auth/status').set('Cookie', cookies);
    expect(statusAfter.body).toEqual({ connected: false });
  });
});
