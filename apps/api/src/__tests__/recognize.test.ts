import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from '../app';

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

describe('GET /api/health', () => {
  it('devuelve ok', async () => {
    const app = createApp();
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    const body = res.body as HealthResponse;
    expect(body.status).toBe('ok');
  });
});
