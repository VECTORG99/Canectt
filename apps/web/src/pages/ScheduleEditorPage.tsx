import { motion } from 'framer-motion';
import { useScheduleStore } from '../store/scheduleStore';
import { dictionary } from '../i18n/index';
import { ScheduleGrid } from '../components/editor/ScheduleGrid';
import { BlockEditPanel } from '../components/editor/BlockEditPanel';
import { ExportFlow } from '../components/export/ExportFlow';
import type { RecurrenceFreq, Weekday } from '@canectt/schema';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.2, 0, 0, 1] as const },
};

const RECURRENCE_OPTIONS: {
  value: RecurrenceFreq;
  key: 'none' | 'daily' | 'weekdays' | 'weekly' | 'custom';
}[] = [
  { value: 'NONE', key: 'none' },
  { value: 'DAILY', key: 'daily' },
  { value: 'WEEKDAYS', key: 'weekdays' },
  { value: 'WEEKLY', key: 'weekly' },
  { value: 'CUSTOM', key: 'custom' },
];

const WEEKDAYS: Weekday[] = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

// Lista acotada de zonas IANA habituales en LATAM + UTC. El usuario puede
// escribir cualquier zona IANA válida en el input si la suya no está.
const COMMON_TIMEZONES = [
  'America/Santiago',
  'America/Argentina/Buenos_Aires',
  'America/Bogota',
  'America/Lima',
  'America/Mexico_City',
  'America/Montevideo',
  'America/Guayaquil',
  'Atlantic/Canary',
  'Europe/Madrid',
  'UTC',
];

export default function ScheduleEditorPage() {
  const schedule = useScheduleStore((s) => s.schedule);
  const editingBlockId = useScheduleStore((s) => s.editingBlockId);
  const updateMeta = useScheduleStore((s) => s.updateMeta);
  const addBlock = useScheduleStore((s) => s.addBlock);

  const editingBlock = schedule.blocks.find((b) => b.id === editingBlockId) ?? null;

  function toggleWeekday(day: Weekday) {
    const current = schedule.recurrence.byDay ?? [];
    const next = current.includes(day) ? current.filter((d) => d !== day) : [...current, day];
    updateMeta({ recurrence: { ...schedule.recurrence, byDay: next } });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <motion.div {...fadeUp} className="mb-6 flex flex-col gap-2">
        <label className="flex flex-col gap-1">
          <span className="sr-only">{dictionary.editor.title}</span>
          <input
            type="text"
            value={schedule.title}
            onChange={(e) => updateMeta({ title: e.target.value })}
            placeholder={dictionary.editor.untitled}
            className="font-primary text-3xl font-bold bg-transparent text-text-primary outline-none"
            aria-label={dictionary.editor.title}
          />
        </label>
        <div className="flex flex-wrap gap-3 text-sm text-text-secondary">
          <label className="flex items-center gap-1">
            <span>{dictionary.editor.dayRange.start}</span>
            <input
              type="time"
              value={schedule.dayRange.startTime}
              onChange={(e) =>
                updateMeta({ dayRange: { ...schedule.dayRange, startTime: e.target.value } })
              }
              className="rounded-md border bg-surface px-2 py-1"
              style={{ borderColor: 'var(--color-border)' }}
            />
          </label>
          <label className="flex items-center gap-1">
            <span>{dictionary.editor.dayRange.end}</span>
            <input
              type="time"
              value={schedule.dayRange.endTime}
              onChange={(e) =>
                updateMeta({ dayRange: { ...schedule.dayRange, endTime: e.target.value } })
              }
              className="rounded-md border bg-surface px-2 py-1"
              style={{ borderColor: 'var(--color-border)' }}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>{dictionary.editor.timezone.label}</span>
            <input
              list="canectt-timezones"
              value={schedule.timezone}
              onChange={(e) => updateMeta({ timezone: e.target.value })}
              className="rounded-md border bg-surface px-2 py-1"
              style={{ borderColor: 'var(--color-border)' }}
              aria-describedby="tz-helper"
            />
            <datalist id="canectt-timezones">
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz} value={tz} />
              ))}
            </datalist>
            <span id="tz-helper" className="text-xs">
              {dictionary.editor.timezone.helper}
            </span>
          </label>
        </div>

        {/* Recurrencia: se traduce a RRULE al exportar al calendario. */}
        <div className="mt-2 flex flex-col gap-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-text-secondary">{dictionary.editor.recurrence.label}</span>
            <select
              value={schedule.recurrence.freq}
              onChange={(e) =>
                updateMeta({
                  recurrence: {
                    freq: e.target.value as RecurrenceFreq,
                    byDay:
                      e.target.value === 'CUSTOM' ? (schedule.recurrence.byDay ?? []) : undefined,
                  },
                })
              }
              className="w-fit rounded-md border bg-surface px-2 py-1"
              style={{ borderColor: 'var(--color-border)' }}
            >
              {RECURRENCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {dictionary.editor.recurrence[opt.key]}
                </option>
              ))}
            </select>
          </label>
          {schedule.recurrence.freq === 'CUSTOM' && (
            <fieldset className="flex flex-wrap gap-2">
              <legend className="sr-only">{dictionary.editor.recurrence.days}</legend>
              {WEEKDAYS.map((day) => {
                const active = schedule.recurrence.byDay?.includes(day) ?? false;
                return (
                  <label
                    key={day}
                    className="cursor-pointer rounded-md border px-2 py-1 text-xs"
                    style={{
                      borderColor: active ? 'var(--color-accent-blue)' : 'var(--color-border)',
                      background: active ? 'var(--color-surface-variant)' : 'transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleWeekday(day)}
                      className="sr-only"
                    />
                    {dictionary.editor.recurrence.weekdaysShort[day]}
                  </label>
                );
              })}
            </fieldset>
          )}
        </div>
      </motion.div>

      <div className="grid gap-6 desktop:grid-cols-[1fr_360px]">
        <motion.div {...fadeUp} className="flex flex-col gap-4">
          <button
            type="button"
            className="btn btn-primary btn-shine self-start"
            onClick={() => addBlock({ title: dictionary.editor.block.defaultTitle })}
          >
            {dictionary.editor.addBlock}
          </button>
          <ScheduleGrid />
        </motion.div>

        <div>
          {editingBlock ? (
            <BlockEditPanel block={editingBlock} />
          ) : (
            <div className="card p-5 text-text-secondary">{dictionary.editor.empty}</div>
          )}
        </div>
      </div>

      <ExportFlow />
    </div>
  );
}
