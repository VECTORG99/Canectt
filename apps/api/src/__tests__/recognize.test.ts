import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from '../app.js';
import { createEmptySchedule, createEmptyBlock } from '@canectt/schema';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, '..', '..', '..', '..', 'fixtures');

interface RecognizeResponse {
  schedule: { blocks: unknown[] };
  format: string;
  warning: string | null;
  confidence: number;
  scanned: boolean;
}
interface ErrorResponse {
  error: string;
}
interface HealthResponse {
  status: string;
  version: string;
}

function makeSchedule() {
  const schedule = createEmptySchedule({ title: 'Test' });
  const b1 = createEmptyBlock({ title: 'Mañana', startTime: '07:00', endTime: '08:00' });
  return { ...schedule, blocks: [b1] };
}

describe('POST /api/recognize', () => {
  it('devuelve 400 si no se envía archivo', async () => {
    const app = createApp();
    const res = await request(app).post('/api/recognize').send({});
    expect(res.status).toBe(400);
    const body = res.body as ErrorResponse;
    expect(body.error).toMatch(/archivo/i);
  });

  it('reconoce un Markdown y devuelve un Schedule', async () => {
    const app = createApp();
    const buf = readFileSync(join(fixturesDir, 'rutina-gimnasio.md'));
    const res = await request(app).post('/api/recognize').attach('file', buf, 'rutina-gimnasio.md');
    expect(res.status).toBe(200);
    const body = res.body as RecognizeResponse;
    expect(body.schedule).toBeDefined();
    expect(body.schedule.blocks.length).toBeGreaterThanOrEqual(4);
    expect(body.format).toBe('markdown');
  });
});

describe('POST /api/export/calendar/ics', () => {
  it('genera un .ics válido con horas en UTC', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/export/calendar/ics')
      .send({ schedule: makeSchedule(), recurrence: 'daily', count: 7, startDate: '2025-01-06' });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/calendar');
    const text = res.text;
    expect(text).toContain('BEGIN:VCALENDAR');
    expect(text).toContain('SUMMARY:Mañana');
    expect(text).toContain('RRULE:FREQ=DAILY;COUNT=7');
    // UTC con sufijo Z (no floating local).
    expect(text).toMatch(/DTSTART:\d{8}T\d{6}Z/);
  });

  it('devuelve 400 si recurrence es inválido', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/export/calendar/ics')
      .send({ schedule: makeSchedule(), recurrence: 'invalid' });
    expect(res.status).toBe(400);
    const body = res.body as ErrorResponse;
    expect(body.error).toMatch(/parámetros de exportación/i);
  });

  it('devuelve 400 si count es negativo', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/export/calendar/ics')
      .send({ schedule: makeSchedule(), count: -1 });
    expect(res.status).toBe(400);
    const body = res.body as ErrorResponse;
    expect(body.error).toMatch(/parámetros de exportación/i);
  });

  it('devuelve 400 si startDate tiene formato inválido', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/export/calendar/ics')
      .send({ schedule: makeSchedule(), startDate: 'not-a-date' });
    expect(res.status).toBe(400);
    const body = res.body as ErrorResponse;
    expect(body.error).toMatch(/parámetros de exportación/i);
  });

  it('devuelve 400 si byDay contiene un día inválido', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/export/calendar/ics')
      .send({ schedule: makeSchedule(), byDay: ['XX'] });
    expect(res.status).toBe(400);
    const body = res.body as ErrorResponse;
    expect(body.error).toMatch(/parámetros de exportación/i);
  });
});

describe('POST /api/export/md', () => {
  it('genera un Markdown tabulado', async () => {
    const app = createApp();
    const res = await request(app).post('/api/export/md').send(makeSchedule());
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/markdown');
    expect(res.text).toContain('# Test');
    expect(res.text).toContain('07:00 - 08:00');
  });
});

describe('GET /api/health', () => {
  it('devuelve ok', async () => {
    const app = createApp();
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    const body = res.body as HealthResponse;
    expect(body.status).toBe('ok');
  });
});
