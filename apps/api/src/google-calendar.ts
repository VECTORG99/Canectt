/**
 * Integración con Google Calendar API.
 * Usa googleapis (SDK oficial de Google) para crear eventos en el calendario
 * del usuario autenticado. El client secret vive solo en el backend.
 */
import { google, type calendar_v3 } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';
import type { Schedule, Block } from '@canectt/schema';
import type { RecurrenceType } from '@canectt/export-engine';
import { env } from './env.js';

const SCOPES = [env.GOOGLE_OAUTH_SCOPE];

/** Crea el cliente OAuth2 de Google. */
export function createOAuth2Client(): OAuth2Client {
  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI,
  );
}

/** Genera la URL de autorización para iniciar el flujo OAuth. */
export function getAuthUrl(state?: string): string {
  const client = createOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state,
  });
}

/** Intercambia el code por tokens y los guarda en la sesión. */
export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string;
  refreshToken: string | null;
  expiryDate: number | null;
}> {
  const client = createOAuth2Client();
  const { tokens } = await client.getToken(code);
  if (!tokens.access_token) {
    throw new Error('Google no devolvió access_token.');
  }
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? null,
    expiryDate: tokens.expiry_date ?? null,
  };
}

/** Crea un cliente Calendar autenticado con los tokens del usuario. */
function createCalendarClient(
  accessToken: string,
  refreshToken: string | null,
): calendar_v3.Calendar {
  const client = createOAuth2Client();
  client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken ?? undefined,
  });
  return google.calendar({ version: 'v3', auth: client });
}

/** Convierte un Block a un objeto event de Google Calendar. */
function blockToEvent(
  block: Block,
  schedule: Schedule,
  startDate: string,
  recurrence: RecurrenceType,
  count: number,
  byDay?: string[],
): calendar_v3.Schema$Event {
  const recurrenceRule: string[] = [];
  switch (recurrence) {
    case 'daily':
      recurrenceRule.push(`RRULE:FREQ=DAILY;COUNT=${count}`);
      break;
    case 'weekdays':
      recurrenceRule.push(`RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;COUNT=${count}`);
      break;
    case 'weekly':
      recurrenceRule.push(`RRULE:FREQ=WEEKLY;COUNT=${count}`);
      break;
    case 'custom':
      if (byDay && byDay.length > 0) {
        recurrenceRule.push(`RRULE:FREQ=WEEKLY;BYDAY=${byDay.join(',')};COUNT=${count}`);
      }
      break;
  }

  return {
    summary: block.title || 'Bloque',
    description: block.notes ?? undefined,
    start: {
      dateTime: `${startDate}T${block.startTime}:00`,
      timeZone: schedule.timezone,
    },
    end: {
      dateTime: `${startDate}T${block.endTime}:00`,
      timeZone: schedule.timezone,
    },
    recurrence: recurrenceRule.length > 0 ? recurrenceRule : undefined,
  };
}

export interface PushToCalendarOptions {
  accessToken: string;
  refreshToken: string | null;
  startDate: string;
  recurrence: RecurrenceType;
  /** Días específicos para recurrencia 'custom'. */
  byDay?: string[];
  count?: number;
  /** ID del calendario de Google (default: calendario primario). */
  calendarId?: string;
}

export interface PushResult {
  created: number;
  errors: string[];
}

/** Crea eventos en Google Calendar para cada bloque del horario. */
export async function pushScheduleToCalendar(
  schedule: Schedule,
  options: PushToCalendarOptions,
): Promise<PushResult> {
  const calendar = createCalendarClient(options.accessToken, options.refreshToken);
  const calendarId = options.calendarId ?? 'primary';
  const count = options.count ?? 30;

  let created = 0;
  const errors: string[] = [];

  for (const block of schedule.blocks) {
    const event = blockToEvent(
      block,
      schedule,
      options.startDate,
      options.recurrence,
      count,
      options.byDay,
    );
    try {
      await calendar.events.insert({ calendarId, requestBody: event });
      created++;
    } catch (err) {
      errors.push(`Error al crear "${block.title}": ${(err as Error).message}`);
    }
  }

  return { created, errors };
}
