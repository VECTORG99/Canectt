/**
 * Orquestador del árbol de reconocimiento: un único punto de entrada
 * detecta el formato del archivo y lo deriva al parser correspondiente.
 * Los cuatro parsers convergen en el mismo normalizador.
 */
import { detectFormat, type DetectedFormat } from './detect-format';
import { parseMarkdown } from './parsers/markdown';
import { parsePdf } from './parsers/pdf';
import { parseDocx } from './parsers/docx';
import { parseXlsx } from './parsers/xlsx';
import { ScheduleSchema, type Schedule } from '@canectt/schema';

export interface RecognizeInput {
  /** Contenido binario del archivo. */
  data: Uint8Array;
  /** Nombre original del archivo (para fallback de extensión). */
  filename?: string;
  /** Título sugerido para el horario. */
  title?: string;
  /** Zona horaria IANA. */
  timezone?: string;
}

export interface RecognizeOutput {
  schedule: Schedule;
  format: DetectedFormat;
  /** Aviso de confianza baja o PDF escaneado (null si todo bien). */
  warning: string | null;
  /** Confianza 0-1. */
  confidence: number;
  /** True si se detectó PDF escaneado. */
  scanned: boolean;
}

/** Ejecuta el pipeline completo de reconocimiento. */
export async function recognize(input: RecognizeInput): Promise<RecognizeOutput> {
  const format = detectFormat(input.data, input.filename);

  let schedule: Schedule;
  let confidence = 1;
  let warning: string | null = null;
  let scanned = false;

  switch (format) {
    case 'markdown': {
      const text = new TextDecoder().decode(input.data);
      const r = parseMarkdown(text, { title: input.title, timezone: input.timezone });
      schedule = r.schedule;
      confidence = r.recognition.confidence;
      warning = r.recognition.warning;
      break;
    }
    case 'pdf': {
      const r = await parsePdf(input.data, { title: input.title, timezone: input.timezone });
      schedule = r.schedule;
      confidence = r.recognition.confidence;
      warning = r.recognition.warning;
      scanned = r.scanned;
      break;
    }
    case 'docx': {
      const r = await parseDocx(input.data, { title: input.title, timezone: input.timezone });
      schedule = r.schedule;
      confidence = r.recognition.confidence;
      warning = r.recognition.warning;
      break;
    }
    case 'xlsx': {
      const r = await parseXlsx(input.data, { title: input.title, timezone: input.timezone });
      schedule = r.schedule;
      confidence = r.recognition.confidence;
      warning = r.recognition.warning;
      break;
    }
    default:
      throw new Error(
        `Formato no soportado. Aceptamos PDF, Word (.docx), Markdown (.md) y Excel (.xlsx).`,
      );
  }

  // Validar contra el esquema canónico antes de devolver.
  const parsed = ScheduleSchema.safeParse(schedule);
  if (!parsed.success) {
    // Si la validación falla, devolvemos el horario parcial + aviso.
    warning =
      warning ??
      'El horario reconocido tiene inconsistencias. Te dejamos lo que pudimos reconocer para que lo revises a mano.';
    confidence = Math.min(confidence, 0.5);
  }

  return { schedule, format, warning, confidence, scanned };
}
