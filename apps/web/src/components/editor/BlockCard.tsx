import { motion } from 'framer-motion';
import { useScheduleStore } from '../../store/scheduleStore';
import { dictionary } from '../../i18n/index';
import { blockDurationMinutes } from './timeUtils';
import type { Block } from '@canectt/schema';

interface BlockCardProps {
  block: Block;
  /** px por minuto (para dimensionar). */
  pxPerMinute: number;
  /** minutos desde medianoche del inicio del día visible. */
  dayStartMinutes: number;
  /** ¿Es un bloque contenedor (tiene hijos)? */
  hasChildren: boolean;
  /** ¿Es un bloque hijo (parentId != null)? */
  isChild: boolean;
  /** Número de columna dentro de un grupo de solapamiento (0-based). */
  column: number;
  /** Total de columnas del grupo de solapamiento. */
  columnCount: number;
  /** Ancho disponible del contenedor en px. */
  containerWidth: number;
}

const GAP_PX = 8;

export function BlockCard({
  block,
  pxPerMinute,
  dayStartMinutes,
  hasChildren,
  isChild,
  column,
  columnCount,
  containerWidth,
}: BlockCardProps) {
  const setEditing = useScheduleStore((s) => s.setEditing);
  const removeBlock = useScheduleStore((s) => s.removeBlock);
  const editingBlockId = useScheduleStore((s) => s.editingBlockId);

  const top = (blockDurationMinutes('00:00', block.startTime) + 0) * pxPerMinute; // placeholder
  void top;
  const startMin =
    parseInt(block.startTime.slice(0, 2), 10) * 60 + parseInt(block.startTime.slice(3, 5), 10);
  const endMin =
    parseInt(block.endTime.slice(0, 2), 10) * 60 + parseInt(block.endTime.slice(3, 5), 10);
  const offsetTop = (startMin - dayStartMinutes) * pxPerMinute;
  const height = (endMin - startMin) * pxPerMinute;

  const colWidth =
    columnCount > 1 ? (containerWidth - GAP_PX * (columnCount - 1)) / columnCount : containerWidth;
  const left = column * (colWidth + GAP_PX);

  const isEditing = editingBlockId === block.id;

  const bgVar = `var(--color-${block.colorToken}-bg)`;
  const onBgVar = `var(--color-${block.colorToken}-on-bg)`;

  return (
    <motion.div
      layout
      layoutId={`block-${block.id}`}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      role="button"
      tabIndex={0}
      aria-label={`${block.title}, ${block.startTime} a ${block.endTime}`}
      aria-pressed={isEditing}
      onClick={() => setEditing(block.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setEditing(block.id);
        }
      }}
      className="group absolute rounded-lg p-3 shadow-e1 transition-shadow hover:shadow-e2 focus-visible:outline-none"
      style={{
        top: offsetTop,
        height: Math.max(height, 28),
        left: isChild ? '8%' : left,
        width: isChild ? '92%' : colWidth,
        background: bgVar,
        color: onBgVar,
        border: hasChildren ? `2px dashed ${onBgVar}` : 'none',
        zIndex: isChild ? 2 : 1,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium" style={{ fontSize: 'var(--font-size-sm)' }}>
            {block.title || dictionary.editor.block.defaultTitle}
          </p>
          <p className="mt-0.5 opacity-80" style={{ fontSize: 'var(--font-size-xs)' }}>
            {block.startTime} – {block.endTime}
          </p>
        </div>
        <button
          type="button"
          aria-label={dictionary.editor.block.delete}
          onClick={(e) => {
            e.stopPropagation();
            removeBlock(block.id);
          }}
          className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          style={{ color: onBgVar }}
        >
          ✕
        </button>
      </div>
      {block.notes && (
        <p className="mt-1 line-clamp-2 opacity-70" style={{ fontSize: 'var(--font-size-xs)' }}>
          {block.notes}
        </p>
      )}
    </motion.div>
  );
}
