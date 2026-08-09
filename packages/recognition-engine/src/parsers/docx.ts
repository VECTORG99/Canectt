/**
 * Parser Word (.docx): usa mammoth para convertir a HTML/texto estructurado,
 * luego delega al reconocedor compartido.
 */
import mammoth from 'mammoth';
import { recognizeBlocks, type RecognitionResult } from '../recognize.js';
import { normalizeToSchedule } from '../normalize.js';
import type { Schedule } from '@canectt/schema';

export interface ParseDocxOptions {
  title?: string;
  timezone?: string;
}

/** Convierte HTML de mammoth a texto plano, preservando tablas como filas. */
function htmlToText(html: string): string {
  // Reemplazar celdas de tabla por separadores de 2 espacios, filas por saltos.
  // Nota: mammoth envuelve el contenido de cada <td> en <p>; si convertimos
  // </p> a '\n' la hora y la actividad quedan en líneas separadas y el
  // reconocedor no las asocia. Por eso <p>/</p> se vuelven espacios, y la
  // estructura de filas la dan </td> (2 espacios) y </tr> (salto).
  return html
    .replace(/<\/td>/gi, '  ')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<th[^>]*>/gi, '')
    .replace(/<\/th>/gi, '  ')
    .replace(/<li[^>]*>/gi, '\n- ')
    .replace(/<p[^>]*>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<h[1-6][^>]*>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Parsea un .docx (como Buffer) a un Schedule canónico. */
export async function parseDocx(
  buffer: Buffer | Uint8Array,
  options: ParseDocxOptions = {},
): Promise<{ schedule: Schedule; recognition: RecognitionResult }> {
  const buf = buffer instanceof Uint8Array ? Buffer.from(buffer) : buffer;
  // mammoth 1.12 acepta `buffer` (Node Buffer) o `path`; el campo
  // `arrayBuffer` está declarado en los tipos pero NO implementado en el
  // runtime, así que usamos `buffer` que sí funciona.
  const result = await mammoth.convertToHtml({ buffer: buf });
  const text = htmlToText(result.value);
  const recognition = recognizeBlocks(text);
  const schedule = normalizeToSchedule(recognition, {
    title: options.title,
    timezone: options.timezone,
  });
  return { schedule, recognition };
}
