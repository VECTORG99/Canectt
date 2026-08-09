import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BlockEditSchema, type Block, type BlockColorToken } from '@canectt/schema';
import { useScheduleStore } from '../../store/scheduleStore';
import { dictionary } from '../../i18n/index';

const COLOR_OPTIONS: BlockColorToken[] = [
  'block-blue',
  'block-purple',
  'block-coral',
  'block-green',
  'block-amber',
  'block-teal',
];

interface FormValues {
  title: string;
  startTime: string;
  endTime: string;
  colorToken: BlockColorToken;
  notes: string;
  parentId: string;
}

export function BlockEditPanel({ block }: { block: Block }) {
  const updateBlock = useScheduleStore((s) => s.updateBlock);
  const removeBlock = useScheduleStore((s) => s.removeBlock);
  const setEditing = useScheduleStore((s) => s.setEditing);
  const schedule = useScheduleStore((s) => s.schedule);

  const possibleParents = schedule.blocks.filter((b) => b.id !== block.id && b.parentId === null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(BlockEditSchema),
    defaultValues: {
      title: block.title,
      startTime: block.startTime,
      endTime: block.endTime,
      colorToken: block.colorToken,
      notes: block.notes ?? '',
      parentId: block.parentId ?? '',
    },
  });

  // Auto-guardado en cada cambio válido (UX de editor en vivo).
  useEffect(() => {
    const sub = watch((value) => {
      const patch: Partial<Block> = {
        title: value.title ?? block.title,
        startTime: value.startTime ?? block.startTime,
        endTime: value.endTime ?? block.endTime,
        colorToken: value.colorToken ?? block.colorToken,
        notes: value.notes ? String(value.notes) : null,
        parentId: value.parentId ? String(value.parentId) : null,
      };
      updateBlock(block.id, patch);
    });
    return () => sub.unsubscribe();
  }, [
    block.id,
    block.title,
    block.startTime,
    block.endTime,
    block.colorToken,
    block.notes,
    updateBlock,
    watch,
  ]);

  const colorToken = watch('colorToken');

  return (
    <aside
      role="complementary"
      aria-label={dictionary.editor.block.edit}
      className="card sticky top-20 max-h-[80vh] overflow-auto p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-primary text-lg font-bold">{dictionary.editor.block.edit}</h2>
        <button
          type="button"
          aria-label={dictionary.common.close}
          className="btn btn-ghost px-2"
          onClick={() => setEditing(null)}
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit(() => setEditing(null))} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-text-secondary">{dictionary.editor.block.title}</span>
          <input
            type="text"
            {...register('title')}
            className="rounded-md border bg-surface px-3 py-2"
            style={{ borderColor: 'var(--color-border)' }}
          />
          {errors.title && (
            <span className="text-sm" style={{ color: 'var(--color-block-coral-on-bg)' }}>
              {errors.title.message}
            </span>
          )}
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-text-secondary">{dictionary.editor.block.startTime}</span>
            <input
              type="time"
              {...register('startTime')}
              className="rounded-md border bg-surface px-3 py-2"
              style={{ borderColor: 'var(--color-border)' }}
            />
            {errors.startTime && (
              <span className="text-sm" style={{ color: 'var(--color-block-coral-on-bg)' }}>
                {errors.startTime.message}
              </span>
            )}
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-text-secondary">{dictionary.editor.block.endTime}</span>
            <input
              type="time"
              {...register('endTime')}
              className="rounded-md border bg-surface px-3 py-2"
              style={{ borderColor: 'var(--color-border)' }}
            />
            {errors.endTime && (
              <span className="text-sm" style={{ color: 'var(--color-block-coral-on-bg)' }}>
                {errors.endTime.message}
              </span>
            )}
          </label>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm text-text-secondary">{dictionary.editor.block.color}</legend>
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map((c) => (
              <label key={c} className="cursor-pointer">
                <input type="radio" value={c} {...register('colorToken')} className="sr-only" />
                <span
                  className="block h-8 w-8 rounded-full border-2"
                  style={{
                    background: `var(--color-${c}-bg)`,
                    borderColor: colorToken === c ? 'var(--color-accent-blue)' : 'transparent',
                  }}
                  aria-hidden="true"
                />
                <span className="sr-only">{c}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-text-secondary">{dictionary.editor.block.notes}</span>
          <textarea
            {...register('notes')}
            rows={3}
            className="rounded-md border bg-surface px-3 py-2"
            style={{ borderColor: 'var(--color-border)' }}
          />
        </label>

        {possibleParents.length > 0 && (
          <label className="flex flex-col gap-1">
            <span className="text-sm text-text-secondary">
              {dictionary.editor.block.isSubEvent}
            </span>
            <select
              {...register('parentId')}
              className="rounded-md border bg-surface px-3 py-2"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <option value="">—</option>
              {possibleParents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title || dictionary.editor.block.defaultTitle} ({p.startTime}–{p.endTime})
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="mt-2 flex gap-2">
          <button type="submit" className="btn btn-primary">
            {dictionary.common.save}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => removeBlock(block.id)}>
            {dictionary.common.delete}
          </button>
        </div>
      </form>
    </aside>
  );
}
