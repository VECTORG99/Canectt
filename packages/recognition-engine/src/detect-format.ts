/**
 * detect-format: identifica el tipo real de archivo por su firma binaria
 * (magic bytes), no solo por la extensión del nombre.
 *
 * Evita el bug de "subieron un .docx que en realidad es otra cosa".
 */
export type DetectedFormat = 'pdf' | 'docx' | 'xlsx' | 'markdown' | 'unknown';

interface MagicSignature {
  format: DetectedFormat;
  /** Offset desde el inicio del archivo. */
  offset: number;
  /** Bytes esperados en ese offset. */
  bytes: number[];
}

// Firmas binarias conocidas.
const SIGNATURES: MagicSignature[] = [
  // PDF: %PDF-
  { format: 'pdf', offset: 0, bytes: [0x25, 0x50, 0x44, 0x46, 0x2d] },
  // OOXML (docx, xlsx, pptx): PK\x03\x04 (ZIP local file header)
  // Distinguimos docx vs xlsx por el contenido del ZIP (ver más abajo).
];

/** ¿El buffer empieza con los bytes dados en el offset dado? */
function matches(buf: Uint8Array, sig: MagicSignature): boolean {
  if (buf.length < sig.offset + sig.bytes.length) return false;
  return sig.bytes.every((b, i) => buf[sig.offset + i] === b);
}

/**
 * Detecta el formato real de un archivo.
 * Para formatos OOXML (ZIP), inspecciona los nombres de archivo internos
 * para distinguir .docx (word/) de .xlsx (xl/).
 */
export function detectFormat(buf: Uint8Array, filename?: string): DetectedFormat {
  // PDF por magic bytes.
  if (matches(buf, SIGNATURES[0]!)) return 'pdf';

  // OOXML: empieza con PK\x03\x04 (ZIP).
  const isZip =
    buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04;
  if (isZip) {
    // Buscar pistas en los primeros bytes del ZIP (nombres de entradas internas).
    const sample = Buffer.from(buf.slice(0, Math.min(buf.length, 4096))).toString('latin1');
    if (sample.includes('word/')) return 'docx';
    if (sample.includes('xl/')) return 'xlsx';
    // Si es ZIP pero no sabemos, caemos a la extensión del nombre.
    if (filename) {
      const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
      if (ext === '.docx') return 'docx';
      if (ext === '.xlsx') return 'xlsx';
    }
    return 'unknown';
  }

  // Markdown: texto plano. Heurística — si no es binario y la extensión es .md, es markdown.
  if (filename) {
    const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
    if (ext === '.md' || ext === '.markdown') {
      // Verificar que parece texto (no contiene bytes nulos en los primeros 512 bytes).
      const sample = buf.slice(0, Math.min(buf.length, 512));
      const hasNull = sample.some((b) => b === 0);
      if (!hasNull) return 'markdown';
    }
  }

  return 'unknown';
}
