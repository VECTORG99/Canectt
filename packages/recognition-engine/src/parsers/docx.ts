/**
 * Parser Word (.docx): usa mammoth para convertir a HTML/texto estructurado,
 * luego delega al reconocedor compartido.
 */
import mammoth from 'mammoth';
import { recognizeBlocks, type RecognitionResult } from '../recognize';
import { normalizeToSchedule } from '../normalize';
import type { Schedule } from '@canectt/schema';

export interface ParseDocxOptions {
  title?: string;
  timezone?: string;
}

/** Convierte HTML de mammoth a texto plano, preservando tablas como filas. */
function htmlToText(html: string): string {
  // Reemplazar celdas de tabla por separadores de 2 espacios, filas por saltos.
  return html
    .replace(/<\/td>/gi, '  ')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<th[^>]*>/gi, '')
    .replace(/<\/th>/gi, '  ')
    .replace(/<li[^>]*>/gi, '\n- ')
    .replace(/<\/p>/gi, '\n')
    .replace(/<h[1-6][^>]*>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Parsea un .docx (como Buffer) a un Schedule canónico. */
export async function parseDocx(
  buffer: Buffer | Uint8Array,
  options: ParseDocxOptions = {},
): Promise<{ schedule: Schedule; recognition: RecognitionResult }> {
  const buf = buffer instanceof Uint8Array ? Buffer.from(buffer) : buffer;
  // mammoth espera ArrayBuffer; lo obtenemos desde el Buffer.
  const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const text = htmlToText(result.value);
  const recognition = recognizeBlocks(text);
  const schedule = normalizeToSchedule(recognition, {
    title: options.title,
    timezone: options.timezone,
  });
  return { schedule, recognition };
}
