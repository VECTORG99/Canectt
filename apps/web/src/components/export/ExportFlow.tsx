import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useScheduleStore } from '../../store/scheduleStore';
import { dictionary } from '../../i18n/index';
import { blocksOverlap, type Block } from '@canectt/schema';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: [0.2, 0, 0, 1] as const },
};

type FileFormat = 'pdf' | 'docx' | 'xlsx' | 'md';

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
      // Evitar duplicar grupos que ya son anidados.
      const ids = new Set(cluster.map((c) => c.id));
      const alreadyNested = groups.some((g) => g.blocks.every((b) => ids.has(b.id)));
      if (!alreadyNested) {
        groups.push({ id: `overlap-${a.id}`, kind: 'overlap', blocks: cluster });
      }
    }
  }

  return groups;
}

export function ExportFlow() {
  const schedule = useScheduleStore((s) => s.schedule);
  const conflicts = useMemo(() => detectConflicts(schedule.blocks), [schedule.blocks]);
  const [reviewed, setReviewed] = useState(false);
  const [resolutionByGroup, setResolutionByGroup] = useState<
    Record<string, 'separate' | 'combine'>
  >({});
  const [busy, setBusy] = useState(false);

  const needsReview = conflicts.length > 0 && !reviewed;

  async function downloadFile(format: FileFormat) {
    setBusy(true);
    try {
      const res = await fetch('/api/export/' + format, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schedule),
      });
      if (!res.ok) throw new Error('export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ext = format === 'md' ? 'md' : format;
      a.download = `${schedule.title || 'horario'}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // TODO: feedback de error visible.
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
        body: JSON.stringify(schedule),
      });
      if (!res.ok) throw new Error('ics failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${schedule.title || 'horario'}.ics`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  function connectGoogle() {
    // Inicia flujo OAuth en el backend.
    window.location.href = '/api/auth/google';
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
          <button
            type="button"
            className="btn btn-primary btn-shine"
            onClick={connectGoogle}
            disabled={busy}
          >
            {dictionary.export.calendar.connectGoogle}
          </button>
          <button type="button" className="btn btn-ghost" onClick={downloadIcs} disabled={busy}>
            {dictionary.export.calendar.downloadIcs}
          </button>
        </div>
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
