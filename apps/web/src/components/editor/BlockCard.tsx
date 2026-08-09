import { motion } from 'framer-motion';
import { useDraggable } from '@dnd-kit/core';
import { useScheduleStore } from '../../store/scheduleStore';
import { dictionary } from '../../i18n/index';
import { timeToMinutes } from './timeUtils';
import type { Block } from '@canectt/schema';

interface BlockCardProps {
  block: Block;
  /** px por minuto (para dimensionar). */
  pxPerMinute: number;
  /** minutos desde medianoche del inicio del día visible. */
  dayStartMinutes: number;
  /** minutos desde medianoche del fin del día visible. */
  dayEndMinutes: number;
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
const HANDLE_HEIGHT_PX = 8;

export function BlockCard({
  block,
  pxPerMinute,
  dayStartMinutes,
  dayEndMinutes,
  hasChildren,
  isChild,
  column,
  columnCount,
  containerWidth,
}: BlockCardProps) {
  const setEditing = useScheduleStore((s) => s.setEditing);
  const removeBlock = useScheduleStore((s) => s.removeBlock);
  const editingBlockId = useScheduleStore((s) => s.editingBlockId);

  const startMin = timeToMinutes(block.startTime);
  const endMin = timeToMinutes(block.endTime);
  const offsetTop = (startMin - dayStartMinutes) * pxPerMinute;
  const height = (endMin - startMin) * pxPerMinute;

  const colWidth =
    columnCount > 1 ? (containerWidth - GAP_PX * (columnCount - 1)) / columnCount : containerWidth;
  const left = column * (colWidth + GAP_PX);

  const isEditing = editingBlockId === block.id;

  const bgVar = `var(--color-${block.colorToken}-bg)`;
  const onBgVar = `var(--color-${block.colorToken}-on-bg)`;

  // Draggable principal: mover el bloque verticalmente.
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: block.id,
    data: { type: 'move' },
  });

  // Handle superior: cambiar hora de inicio (resize).
  const {
    attributes: topAttrs,
    listeners: topListeners,
    setNodeRef: setTopRef,
    transform: topTransform,
    isDragging: topDragging,
  } = useDraggable({
    id: `${block.id}-resize-top`,
    data: { type: 'resize-top' },
  });

  // Handle inferior: cambiar hora de fin (resize).
  const {
    attributes: bottomAttrs,
    listeners: bottomListeners,
    setNodeRef: setBottomRef,
    transform: bottomTransform,
    isDragging: bottomDragging,
  } = useDraggable({
    id: `${block.id}-resize-bottom`,
    data: { type: 'resize-bottom' },
  });

  // Transform en tiempo real durante el arrastre (feedback visual).
  const dragY = transform?.y ?? 0;
  const topDragY = topTransform?.y ?? 0;
  const bottomDragY = bottomTransform?.y ?? 0;

  // Durante move: desplazar todo el bloque.
  // Durante resize-top: desplazar solo el borde superior (cambia offsetTop y height).
  // Durante resize-bottom: desplazar solo el borde inferior (cambia height).
  const liveOffsetTop = offsetTop + (isDragging ? dragY : topDragging ? topDragY : 0);
  const liveHeight = height + (topDragging ? -topDragY : 0) + (bottomDragging ? bottomDragY : 0);

  // Limitar visualmente dentro del rango del día.
  const clampedTop = Math.max(0, liveOffsetTop);
  const maxBottom = (dayEndMinutes - dayStartMinutes) * pxPerMinute;
  const clampedHeight = Math.min(liveHeight, maxBottom - clampedTop);

  return (
    <motion.div
      layout
      layoutId={`block-${block.id}`}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
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
      className="group absolute touch-none rounded-lg p-3 shadow-e1 transition-shadow hover:shadow-e2 focus-visible:outline-none"
      style={{
        top: clampedTop,
        height: Math.max(clampedHeight, 28),
        left: isChild ? '8%' : left,
        width: isChild ? '92%' : colWidth,
        background: bgVar,
        color: onBgVar,
        border: hasChildren ? `2px dashed ${onBgVar}` : 'none',
        zIndex: isChild ? 2 : isDragging ? 10 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
      }}
    >
      {/* Handle superior (resize) */}
      {!isChild && (
        <div
          ref={setTopRef}
          {...topAttrs}
          {...topListeners}
          className="absolute left-0 right-0 top-0 cursor-ns-resize"
          style={{ height: HANDLE_HEIGHT_PX }}
          aria-hidden="true"
          onPointerDown={(e) => e.stopPropagation()}
        />
      )}

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
          onPointerDown={(e) => e.stopPropagation()}
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

      {/* Handle inferior (resize) */}
      {!isChild && (
        <div
          ref={setBottomRef}
          {...bottomAttrs}
          {...bottomListeners}
          className="absolute bottom-0 left-0 right-0 cursor-ns-resize"
          style={{ height: HANDLE_HEIGHT_PX }}
          aria-hidden="true"
          onPointerDown={(e) => e.stopPropagation()}
        />
      )}
    </motion.div>
  );
}
