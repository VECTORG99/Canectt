import { motion } from 'framer-motion';
import { useScheduleStore } from '../store/scheduleStore';
import { dictionary } from '../i18n/index';
import { ScheduleGrid } from '../components/editor/ScheduleGrid';
import { BlockEditPanel } from '../components/editor/BlockEditPanel';
import { ExportFlow } from '../components/export/ExportFlow';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.2, 0, 0, 1] as const },
};

export default function ScheduleEditorPage() {
  const schedule = useScheduleStore((s) => s.schedule);
  const editingBlockId = useScheduleStore((s) => s.editingBlockId);
  const updateMeta = useScheduleStore((s) => s.updateMeta);
  const addBlock = useScheduleStore((s) => s.addBlock);

  const editingBlock = schedule.blocks.find((b) => b.id === editingBlockId) ?? null;

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
