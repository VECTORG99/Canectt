/**
 * recognize: reconocedor de patrones de horario, compartido por los 4 parsers.
 * Los patrones viven en config/time-patterns.json (versionado), NUNCA como
 * regex sueltas dentro del código de cada parser.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface TimePattern {
  id: string;
  description: string;
  regex: string;
  groups: Record<string, number>;
}

export interface TimePatternsConfig {
  version: number;
  patterns: TimePattern[];
  tableHeaders: {
    timeColumnNames: string[];
    activityColumnNames: string[];
    endColumnNames: string[];
  };
  dayNames: {
    es: string[];
    en: string[];
    abbreviations: string[];
  };
  recurrenceKeywords: {
    daily: string[];
    weekdays: string[];
    weekly: string[];
  };
}

let cachedConfig: TimePatternsConfig | null = null;

/** Carga (y cachea) la configuración de patrones desde config/time-patterns.json. */
export function loadTimePatterns(configPath?: string): TimePatternsConfig {
  if (cachedConfig && !configPath) return cachedConfig;
  const path = configPath ?? join(__dirname, '..', '..', '..', 'config', 'time-patterns.json');
  const raw = readFileSync(path, 'utf8');
  cachedConfig = JSON.parse(raw) as TimePatternsConfig;
  return cachedConfig;
}

/** Convierte "8am"/"8:30 PM" a "HH:mm" 24h. */
export function normalize12hTime(hour: number, minute: number, ampm: string): string {
  const ampmLower = ampm.toLowerCase().replace(/[.\s]/g, '');
  let h = hour;
  if (ampmLower === 'pm' && h < 12) h += 12;
  if (ampmLower === 'am' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export interface RecognizedBlock {
  title: string;
  startTime: string;
  endTime: string;
  notes?: string | null;
}

export interface RecognitionResult {
  blocks: RecognizedBlock[];
  /** Confianza: 0-1. Baja si se reconocieron pocas horas. */
  confidence: number;
  /** Aviso si la confianza es baja (para invitar a completar a mano). */
  warning: string | null;
}

/** Reconoce bloques de horario en un texto plano. */
export function recognizeBlocks(text: string, config?: TimePatternsConfig): RecognitionResult {
  const cfg = config ?? loadTimePatterns();
  const blocks: RecognizedBlock[] = [];

  // Patrón de rango 24h: "08:00 - 09:00"
  const range24 = cfg.patterns.find((p) => p.id === 'range-24h-hhmm');
  if (range24) {
    const re = new RegExp(range24.regex, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const startRaw = m[range24.groups['start'] ?? 1] ?? '';
      const endRaw = m[range24.groups['end'] ?? 3] ?? '';
      const start = padTime(startRaw);
      const end = padTime(endRaw);
      // El título es el texto que sigue al rango en la misma línea.
      const lineEnd = text.indexOf('\n', m.index);
      const restOfLine = text
        .slice(m.index + m[0].length, lineEnd === -1 ? text.length : lineEnd)
        .trim();
      const title = restOfLine.replace(/^[\s\-–—:|]+/, '').trim() || 'Bloque';
      blocks.push({ title, startTime: start, endTime: end });
    }
  }

  // Patrón de rango 12h: "8am-9am", "8:00 AM - 9:00 PM"
  // Usamos flag 'i' para que coincida con AM/PM, am/pm, A.M./P.M. etc.
  const range12 = cfg.patterns.find((p) => p.id === 'range-12h-ampm');
  if (range12) {
    const re = new RegExp(range12.regex, 'gi');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const startHour = parseInt(m[range12.groups['startHour'] ?? 2] ?? '0', 10);
      const startMin = parseInt(m[range12.groups['startMinute'] ?? 3] ?? '0', 10) || 0;
      const startAmPm = m[range12.groups['startAmPm'] ?? 4] ?? 'am';
      const endHour = parseInt(m[range12.groups['endHour'] ?? 5] ?? '0', 10);
      const endMin = parseInt(m[range12.groups['endMinute'] ?? 6] ?? '0', 10) || 0;
      const endAmPm = m[range12.groups['endAmPm'] ?? 7] ?? 'am';
      const lineEnd = text.indexOf('\n', m.index);
      const restOfLine = text
        .slice(m.index + m[0].length, lineEnd === -1 ? text.length : lineEnd)
        .trim();
      const title = restOfLine.replace(/^[\s\-–—:|]+/, '').trim() || 'Bloque';
      blocks.push({
        title,
        startTime: normalize12hTime(startHour, startMin, startAmPm),
        endTime: normalize12hTime(endHour, endMin, endAmPm),
      });
    }
  }

  // Si no encontramos rangos, buscar tabla Hora/Actividad.
  if (blocks.length === 0) {
    blocks.push(...recognizeTable(text, cfg));
  }

  const confidence = blocks.length === 0 ? 0 : Math.min(blocks.length / 3, 1);
  const warning =
    confidence < 0.34
      ? 'Reconocimos pocas o ninguna hora en el documento. Te dejamos el horario iniciado para que lo completes a mano.'
      : null;

  return { blocks, confidence, warning };
}

/** Reconoce bloques a partir de una tabla textual (columnas Hora/Actividad). */
function recognizeTable(text: string, cfg: TimePatternsConfig): RecognizedBlock[] {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const timeNames = new Set(cfg.tableHeaders.timeColumnNames.map((s) => s.toLowerCase()));
  const activityNames = new Set(cfg.tableHeaders.activityColumnNames.map((s) => s.toLowerCase()));
  const endNames = new Set(cfg.tableHeaders.endColumnNames.map((s) => s.toLowerCase()));

  // Detectar fila de encabezado.
  let headerIdx = -1;
  let timeCol = -1;
  let activityCol = -1;
  let endCol = -1;

  // Matching por palabra: dividimos la celda en palabras y comprobamos si
  // alguna está en el conjunto de nombres de columna. Así "Hora inicio"
  // (palabras: "hora", "inicio") matchea, pero "descripción" no matchea
  // "de" por subcadena. Toleramos encabezados compuestos sin falsos positivos.
  const matchesAny = (cell: string, names: Set<string>): boolean => {
    const words = cell.split(/[\s/_-]+/).filter(Boolean);
    return words.some((w) => names.has(w));
  };

  for (let i = 0; i < lines.length; i++) {
    const cells = splitRow(lines[i]!);
    const lower = cells.map((c) => c.toLowerCase());
    const ti = lower.findIndex((c) => matchesAny(c, timeNames));
    const ai = lower.findIndex((c) => matchesAny(c, activityNames));
    if (ti !== -1 && ai !== -1) {
      headerIdx = i;
      timeCol = ti;
      activityCol = ai;
      endCol = lower.findIndex((c) => matchesAny(c, endNames));
      break;
    }
  }

  if (headerIdx === -1) return [];

  const out: RecognizedBlock[] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cells = splitRow(lines[i]!);
    if (cells.length <= Math.max(timeCol, activityCol)) continue;
    const timeCell = cells[timeCol]!.trim();
    const activityCell = cells[activityCol]?.trim() ?? 'Bloque';
    // timeCell puede ser "08:00 - 09:00" o "08:00" (con columna end aparte).
    const rangeMatch = timeCell.match(/(\d{1,2}:\d{2})\s*[-–a]+\s*(\d{1,2}:\d{2})/);
    if (rangeMatch && rangeMatch[1] && rangeMatch[2]) {
      out.push({
        title: activityCell,
        startTime: padTime(rangeMatch[1]),
        endTime: padTime(rangeMatch[2]),
      });
    } else if (endCol !== -1 && cells[endCol]) {
      out.push({
        title: activityCell,
        startTime: padTime(timeCell),
        endTime: padTime(cells[endCol]!.trim()),
      });
    }
  }
  return out;
}

/** Divide una fila de tabla por | , \t o múltiples espacios. */
function splitRow(line: string): string[] {
  if (line.includes('|')) {
    // Para filas delimitadas por | (markdown, etc.): split por | y trim.
    // Solo removemos los artefactos vacíos del | inicial/final, pero
    // PRESERVAMOS celdas vacías intermedias (columnas vacías reales).
    const parts = line.split('|').map((c) => c.trim());
    while (parts.length > 0 && parts[0] === '') parts.shift();
    while (parts.length > 0 && parts[parts.length - 1] === '') parts.pop();
    return parts;
  }
  if (line.includes('\t')) return line.split('\t').map((c) => c.trim());
  // Múltiples espacios: dividir en 2 o más espacios seguidos.
  return line.split(/\s{2,}/).map((c) => c.trim());
}

/** Padea "8:00" a "08:00". */
function padTime(t: string): string {
  const m = t.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return t;
  return `${m[1]!.padStart(2, '0')}:${m[2]}`;
}
