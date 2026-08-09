#!/usr/bin/env tsx
/**
 * CLI: exporta un Schedule (JSON) a Google Calendar.
 * Requiere variables de entorno GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
 * GOOGLE_REFRESH_TOKEN (OAuth2 legado/token de larga vida).
 *
 * Uso: pnpm run export:google -- <horario.json> [--recurrence=daily] [--start=2024-01-01] [--count=30] [--calendarId=primary]
 */
import { readFileSync } from 'node:fs';
import { google } from 'googleapis';
import type { Schedule } from '@canectt/schema';

const file = process.argv[2];
if (!file) {
  console.error(
    'Uso: pnpm run export:google -- <horario.json> [--recurrence=daily] [--start=2024-01-01] [--count=30] [--calendarId=primary]',
  );
  process.exit(1);
}

const flags = process.argv.slice(3).reduce<Record<string, string>>((acc, arg) => {
  const m = arg.match(/^--(\w+)=(.+)$/);
  if (m) acc[m[1]!] = m[2]!;
  return acc;
}, {});

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

if (!clientId || !clientSecret || !refreshToken) {
  console.error(
    'Faltan variables de entorno: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN',
  );
  process.exit(1);
}

const schedule = JSON.parse(readFileSync(file, 'utf8')) as Schedule;
const recurrence = (flags.recurrence ?? 'none') as
  'none' | 'daily' | 'weekdays' | 'weekly' | 'custom';
const startDate = flags.start ?? new Date().toISOString().slice(0, 10);
const count = flags.count ? Number(flags.count) : 30;
const calendarId = flags.calendarId ?? 'primary';

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, 'urn:ietf:wg:oauth:2.0:oob');
oauth2Client.setCredentials({ refresh_token: refreshToken });
const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

function rrule(rec: typeof recurrence): string | undefined {
  switch (rec) {
    case 'daily':
      return `FREQ=DAILY;COUNT=${count}`;
    case 'weekdays':
      return `FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;COUNT=${count}`;
    case 'weekly':
      return `FREQ=WEEKLY;COUNT=${count}`;
    case 'custom': {
      const byDay = schedule.recurrence.byDay;
      if (!byDay || byDay.length === 0) return undefined;
      return `FREQ=WEEKLY;BYDAY=${byDay.join(',')};COUNT=${count}`;
    }
    default:
      return undefined;
  }
}

const rule = rrule(recurrence);
let created = 0;
const errors: string[] = [];

for (const block of schedule.blocks) {
  try {
    await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: block.title || 'Bloque',
        description: block.notes ?? undefined,
        // Pasamos wall time + timeZone (igual que apps/api/src/google-calendar.ts).
        // Google interpreta la hora en la zona del horario, sin depender del
        // huso horario del host que ejecuta el script.
        start: { dateTime: `${startDate}T${block.startTime}:00`, timeZone: schedule.timezone },
        end: { dateTime: `${startDate}T${block.endTime}:00`, timeZone: schedule.timezone },
        recurrence: rule ? [rule] : undefined,
      },
    });
    created++;
  } catch (err) {
    errors.push(`${block.title}: ${(err as Error).message}`);
  }
}

console.log(`Eventos creados: ${created}/${schedule.blocks.length}`);
if (errors.length > 0) {
  console.error('Errores:');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
