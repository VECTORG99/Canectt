import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useScheduleStore } from '../../store/scheduleStore';
import { dictionary } from '../../i18n/index';
import { blocksOverlap, type Block, type Schedule, type RecurrenceFreq } from '@canectt/schema';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: [0.2, 0, 0, 1] as const },
};

type FileFormat = 'pdf' | 'docx' | 'xlsx' | 'md';
type RecurrenceType = 'none' | 'daily' | 'weekdays' | 'weekly' | 'custom';

/** Convierte RecurrenceFreq (esquema canónico) a RecurrenceType (API) de forma type-safe. */
function freqToRecurrence(freq: RecurrenceFreq): RecurrenceType {
  switch (freq) {
    case 'NONE':
      return 'none';
    case 'DAILY':
      return 'daily';
    case 'WEEKDAYS':
      return 'weekdays';
    case 'WEEKLY':
      return 'weekly';
    case 'CUSTOM':
      return 'custom';
  }
}

interface ConflictGroup {
  id: string;
  blocks: Block[];
  /** 'overlap' = solapados sin relación padre-hijo; 'nested' = padre+ hijos. */
  kind: 'overlap' | 'nested';
}

/** Detecta grupos que requieren revisión antes de exportar al calendario. */
function detectConflicts(blocks: Block[]): ConflictGroup[] {
  const groups: ConflictGroup[] = [];

  // Anidados: padre + sus hijos.
  const childrenByParent = new Map<string, Block[]>();
  for (const b of blocks) {
    if (b.parentId) {
      const arr = childrenByParent.get(b.parentId) ?? [];
      arr.push(b);
      childrenByParent.set(b.parentId, arr);
    }
  }
  for (const [parentId, children] of childrenByParent) {
    const parent = blocks.find((b) => b.id === parentId);
    if (parent) {
      groups.push({
        id: `nested-${parentId}`,
        kind: 'nested',
        blocks: [parent, ...children],
      });
    }
  }

  // Solapados (sin relación padre-hijo).
  const roots = blocks.filter((b) => b.parentId === null);
  const visited = new Set<string>();
  for (const a of roots) {
    if (visited.has(a.id)) continue;
    const cluster: Block[] = [a];
    visited.add(a.id);
    for (const b of roots) {
      if (visited.has(b.id)) continue;
      if (cluster.some((c) => blocksOverlap(c, b))) {
        cluster.push(b);
        visited.add(b.id);
      }
    }
    if (cluster.length > 1) {
      const ids = new Set(cluster.map((c) => c.id));
      const alreadyNested = groups.some((g) => g.blocks.every((b) => ids.has(b.id)));
      if (!alreadyNested) {
        groups.push({ id: `overlap-${a.id}`, kind: 'overlap', blocks: cluster });
      }
    }
  }

  return groups;
}

/**
 * Aplica la resolución de conflictos al horario:
 * - 'separate': deja los bloques como están (eventos separados).
 * - 'combine': fusiona los bloques del grupo en un solo evento, mencionando
 *   los sub-eventos en la descripción.
 */
function applyResolutions(
  schedule: Schedule,
  conflicts: ConflictGroup[],
  resolutions: Record<string, 'separate' | 'combine'>,
): Schedule {
  const blocksToRemove = new Set<string>();
  const blocksToUpdate = new Map<string, { notes: string }>();

  for (const group of conflicts) {
    if (resolutions[group.id] !== 'combine') continue;
    // Combinar: el primer bloque (o el padre) absorbe a los demás.
    const [primary, ...rest] = group.blocks;
    if (!primary) continue;
    const subEventNames = rest.map((b) => `${b.title} (${b.startTime}–${b.endTime})`).join('; ');
    const existingNotes = primary.notes ?? '';
    const combinedNotes = [existingNotes, existingNotes ? '' : '', `Sub-eventos: ${subEventNames}`]
      .filter(Boolean)
      .join('\n');
    blocksToUpdate.set(primary.id, { notes: combinedNotes });
    for (const b of rest) {
      blocksToRemove.add(b.id);
    }
  }

  const blocks = schedule.blocks
    .filter((b) => !blocksToRemove.has(b.id))
    .map((b) => {
      const update = blocksToUpdate.get(b.id);
      return update ? { ...b, notes: update.notes } : b;
    });

  return { ...schedule, blocks };
}

export function ExportFlow() {
  const schedule = useScheduleStore((s) => s.schedule);
  const conflicts = useMemo(() => detectConflicts(schedule.blocks), [schedule.blocks]);
  const [reviewed, setReviewed] = useState(false);
  const [resolutionByGroup, setResolutionByGroup] = useState<
    Record<string, 'separate' | 'combine'>
  >({});
  const [busy, setBusy] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [pushResult, setPushResult] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  // Detectar si volvemos de OAuth (parámetro google=connected en la URL).
  useEffect(() => {
    if (searchParams.get('google') === 'connected') {
      setGoogleConnected(true);
    }
    // Verificar estado real de la sesión.
    fetch('/api/auth/status')
      .then((r) => r.json())
      .then((data: { connected?: boolean }) => setGoogleConnected(Boolean(data.connected)))
      .catch(() => {
        /* ignore */
      });
  }, [searchParams]);

  const needsReview = conflicts.length > 0 && !reviewed;

  /** Horario con resoluciones aplicadas (para exportación). */
  const resolvedSchedule = useMemo(
    () => applyResolutions(schedule, conflicts, resolutionByGroup),
    [schedule, conflicts, resolutionByGroup],
  );

  async function downloadFile(format: FileFormat) {
    setBusy(true);
    try {
      const res = await fetch('/api/export/' + format, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resolvedSchedule),
      });
      if (!res.ok) throw new Error('export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${schedule.title || 'horario'}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setPushResult(dictionary.export.calendar.fileError);
    } finally {
      setBusy(false);
    }
  }

  async function downloadIcs() {
    setBusy(true);
    try {
      const res = await fetch('/api/export/calendar/ics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedule: resolvedSchedule,
          recurrence: freqToRecurrence(schedule.recurrence.freq),
          byDay: schedule.recurrence.byDay,
        }),
      });
      if (!res.ok) throw new Error('ics failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${schedule.title || 'horario'}.ics`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setPushResult(dictionary.export.calendar.icsError);
    } finally {
      setBusy(false);
    }
  }

  function connectGoogle() {
    // Inicia flujo OAuth en el backend, con returnTo a la página actual.
    const currentPath = window.location.pathname;
    window.location.href = `/api/auth/google?returnTo=${encodeURIComponent(currentPath)}`;
  }

  async function pushToGoogle() {
    setBusy(true);
    setPushResult(null);
    try {
      const res = await fetch('/api/auth/google/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedule: resolvedSchedule,
          recurrence: freqToRecurrence(schedule.recurrence.freq),
          byDay: schedule.recurrence.byDay,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setPushResult(body.error ?? dictionary.export.calendar.error);
        return;
      }
      const result = (await res.json()) as { created: number; errors: string[] };
      if (result.errors.length > 0) {
        setPushResult(`${dictionary.export.calendar.error} (${result.errors.length} errores)`);
      } else {
        setPushResult(dictionary.export.calendar.success);
      }
    } catch {
      setPushResult(dictionary.export.calendar.error);
    } finally {
      setBusy(false);
    }
  }

  if (needsReview) {
    return (
      <motion.section {...fadeUp} className="card mt-8 p-6" aria-labelledby="review-title">
        <h2 id="review-title" className="font-primary text-2xl font-bold">
          {dictionary.export.calendar.reviewTitle}
        </h2>
        <p className="mt-2 text-text-secondary">{dictionary.export.calendar.reviewDescription}</p>

        <div className="mt-6 flex flex-col gap-6">
          {conflicts.map((g) => (
            <div
              key={g.id}
              className="rounded-md border p-4"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <p className="mb-3 font-medium">
                {g.blocks.map((b) => b.title || dictionary.editor.block.defaultTitle).join(' · ')}
              </p>
              <div className="flex flex-col gap-2">
                <label className="flex items-start gap-2">
                  <input
                    type="radio"
                    name={g.id}
                    value="separate"
                    checked={resolutionByGroup[g.id] !== 'combine'}
                    onChange={() => setResolutionByGroup((r) => ({ ...r, [g.id]: 'separate' }))}
                  />
                  <span>{dictionary.export.calendar.optionSeparate}</span>
                </label>
                <label className="flex items-start gap-2">
                  <input
                    type="radio"
                    name={g.id}
                    value="combine"
                    checked={resolutionByGroup[g.id] === 'combine'}
                    onChange={() => setResolutionByGroup((r) => ({ ...r, [g.id]: 'combine' }))}
                  />
                  <span>{dictionary.export.calendar.optionCombine}</span>
                </label>
              </div>
            </div>
          ))}
        </div>

        <button type="button" className="btn btn-primary mt-6" onClick={() => setReviewed(true)}>
          {dictionary.export.calendar.continue}
        </button>
      </motion.section>
    );
  }

  return (
    <motion.section
      {...fadeUp}
      className="mt-10 flex flex-col gap-8"
      aria-labelledby="export-title"
    >
      <h2 id="export-title" className="sr-only">
        {dictionary.export.files.title}
      </h2>

      {/* Exportar al calendario (va primero: caso de uso principal). */}
      <div className="card p-6">
        <h3 className="font-primary text-xl font-bold">{dictionary.export.calendar.title}</h3>
        <div className="mt-4 flex flex-col gap-3 tablet:flex-row tablet:flex-wrap">
          {googleConnected ? (
            <button
              type="button"
              className="btn btn-primary btn-shine"
              onClick={pushToGoogle}
              disabled={busy}
            >
              {busy
                ? dictionary.export.calendar.creatingEvents
                : dictionary.export.calendar.connectGoogle}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-shine"
              onClick={connectGoogle}
              disabled={busy}
            >
              {dictionary.export.calendar.connectGoogle}
            </button>
          )}
          <button type="button" className="btn btn-ghost" onClick={downloadIcs} disabled={busy}>
            {dictionary.export.calendar.downloadIcs}
          </button>
        </div>
        {pushResult && (
          <p
            role="status"
            className="mt-3 text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {pushResult}
          </p>
        )}
      </div>

      {/* Exportar archivos */}
      <div className="card p-6">
        <h3 className="font-primary text-xl font-bold">{dictionary.export.files.title}</h3>
        <div className="mt-4 flex flex-col gap-3 tablet:flex-row tablet:flex-wrap">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => downloadFile('pdf')}
            disabled={busy}
          >
            {dictionary.export.files.pdf}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => downloadFile('docx')}
            disabled={busy}
          >
            {dictionary.export.files.word}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => downloadFile('xlsx')}
            disabled={busy}
          >
            {dictionary.export.files.excel}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => downloadFile('md')}
            disabled={busy}
          >
            {dictionary.export.files.markdown}
          </button>
        </div>
      </div>
    </motion.section>
  );
}
