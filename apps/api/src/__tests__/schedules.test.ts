/**
 * Tests de los endpoints CRUD de horarios (/api/schedules).
 *
 * Mockeamos Prisma para no necesitar PostgreSQL en CI.
 * Verificamos que el wiring de los endpoints es correcto.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import type { Schedule } from '@canectt/schema';
import { createEmptySchedule } from '@canectt/schema';

// Mock de Prisma
const mockCreate = vi.fn();
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock('../db.js', () => ({
  prisma: {
    schedule: {
      create: (args: never): unknown => mockCreate(args),
      findUnique: (args: never): unknown => mockFindUnique(args),
      update: (args: never): unknown => mockUpdate(args),
      delete: (args: never): unknown => mockDelete(args),
    },
  },
}));

// Mock de env
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
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    CORS_ALLOWED_ORIGINS: 'http://localhost:5173',
  },
}));

function makeSchedule(): Schedule {
  return createEmptySchedule({ title: 'Test Schedule' });
}

describe('CRUD /api/schedules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /api/schedules → 201 con horario creado', async () => {
    const app = createApp();
    const schedule = makeSchedule();
    mockCreate.mockResolvedValue({
      id: schedule.id,
      title: schedule.title,
      timezone: schedule.timezone,
      data: schedule,
    });

    const res = await request(app).post('/api/schedules').send({ schedule });

    expect(res.status).toBe(201);
    expect((res.body as { id: string }).id).toBe(schedule.id);
    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it('POST /api/schedules → 400 si schedule es inválido', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/schedules')
      .send({ schedule: { invalid: true } });

    expect(res.status).toBe(400);
    expect((res.body as { error: string }).error).toMatch(/inválido/i);
  });

  it('GET /api/schedules/:id → 200 con horario existente', async () => {
    const app = createApp();
    const schedule = makeSchedule();
    mockFindUnique.mockResolvedValue({
      id: schedule.id,
      title: schedule.title,
      timezone: schedule.timezone,
      data: schedule,
    });

    const res = await request(app).get(`/api/schedules/${schedule.id}`);

    expect(res.status).toBe(200);
    expect((res.body as { id: string }).id).toBe(schedule.id);
  });

  it('GET /api/schedules/:id → 404 si no existe', async () => {
    const app = createApp();
    mockFindUnique.mockResolvedValue(null);

    const res = await request(app).get('/api/schedules/nonexistent');

    expect(res.status).toBe(404);
  });

  it('PUT /api/schedules/:id → 200 con horario actualizado', async () => {
    const app = createApp();
    const schedule = makeSchedule();
    mockUpdate.mockResolvedValue({
      id: schedule.id,
      title: 'Updated',
      timezone: schedule.timezone,
      data: { ...schedule, title: 'Updated' },
    });

    const res = await request(app)
      .put(`/api/schedules/${schedule.id}`)
      .send({ schedule: { ...schedule, title: 'Updated' } });

    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledOnce();
  });

  it('DELETE /api/schedules/:id → 204 al eliminar', async () => {
    const app = createApp();
    mockDelete.mockResolvedValue({});

    const res = await request(app).delete('/api/schedules/test-id');

    expect(res.status).toBe(204);
    expect(mockDelete).toHaveBeenCalledOnce();
  });

  it('DELETE /api/schedules/:id → 404 si no existe', async () => {
    const app = createApp();
    mockDelete.mockRejectedValue(new Error('Record not found'));

    const res = await request(app).delete('/api/schedules/nonexistent');

    expect(res.status).toBe(404);
  });
});
