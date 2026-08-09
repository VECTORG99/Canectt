import { useMemo, useRef, useState, useEffect, type MouseEvent } from 'react';
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  closestCenter,
} from '@dnd-kit/core';
import { useScheduleStore } from '../../store/scheduleStore';
import { dictionary } from '../../i18n/index';
import { timeToMinutes, minutesToTime, snapMinutes } from './timeUtils';
import { BlockCard } from './BlockCard';
import { scheduleDefaults } from '@canectt/config';
import type { Block } from '@canectt/schema';

const ROW_HEIGHT_PX = scheduleDefaults.editor.rowHeightPx;
const MOBILE_ROW_HEIGHT_PX = scheduleDefaults.editor.mobileRowHeightPx;
const SNAP_MINUTES = scheduleDefaults.editor.defaultSnapMinutes;
const DEFAULT_BLOCK_DURATION = scheduleDefaults.editor.defaultBlockDurationMinutes;
const HOUR_LABEL_WIDTH = 56;

interface ColumnAssignment {
  block: Block;
  column: number;
  columnCount: number;
}

/** Asigna columnas a bloques que se solapan (sin relación padre-hijo). */
function assignColumns(blocks: Block[]): ColumnAssignment[] {
  const roots = blocks.filter((b) => b.parentId === null);
  const children = blocks.filter((b) => b.parentId !== null);

  const sorted = [...roots].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  const assignments = new Map<string, { column: number; columnCount: number }>();
  const columnEnds: number[] = [];

  type Group = { members: Block[]; maxEnd: number };
  const groups: Group[] = [];
  for (const block of sorted) {
    const start = timeToMinutes(block.startTime);
    const end = timeToMinutes(block.endTime);
    let placed = false;
    for (const g of groups) {
      if (start < g.maxEnd) {
        g.members.push(block);
        g.maxEnd = Math.max(g.maxEnd, end);
        placed = true;
        break;
      }
    }
    if (!placed) groups.push({ members: [block], maxEnd: end });
  }

  for (const g of groups) {
    const count = g.members.length;
    columnEnds.length = 0;
    for (const block of g.members) {
      const start = timeToMinutes(block.startTime);
      const end = timeToMinutes(block.endTime);
      let col = -1;
      for (let i = 0; i < columnEnds.length; i++) {
        if (columnEnds[i]! <= start) {
          col = i;
          break;
        }
      }
      if (col === -1) {
        col = columnEnds.length;
        columnEnds.push(end);
      } else {
        columnEnds[col] = end;
      }
      assignments.set(block.id, { column: col, columnCount: count });
    }
  }

  const result: ColumnAssignment[] = [];
  for (const block of roots) {
    const a = assignments.get(block.id) ?? { column: 0, columnCount: 1 };
    result.push({ block, column: a.column, columnCount: a.columnCount });
  }
  for (const block of children) {
    result.push({ block, column: 0, columnCount: 1 });
  }
  return result;
}

export function ScheduleGrid() {
  const schedule = useScheduleStore((s) => s.schedule);
  const addBlock = useScheduleStore((s) => s.addBlock);
  const updateBlock = useScheduleStore((s) => s.updateBlock);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar mobile para usar rowHeightPx adecuado.
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Observar ancho del contenedor para columnas responsivas.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width - HOUR_LABEL_WIDTH;
        if (w > 0) setContainerWidth(w);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const rowHeight = isMobile ? MOBILE_ROW_HEIGHT_PX : ROW_HEIGHT_PX;
  const dayStart = timeToMinutes(schedule.dayRange.startTime);
  const dayEnd = timeToMinutes(schedule.dayRange.endTime);
  const totalMinutes = dayEnd - dayStart;
  const pxPerMinute = rowHeight / 60;
  const totalHeight = totalMinutes * pxPerMinute;

  const hours = useMemo(() => {
    const arr: { label: string; minutes: number }[] = [];
    for (let m = dayStart; m <= dayEnd; m += 60) {
      arr.push({ label: minutesToTime(m), minutes: m });
    }
    return arr;
  }, [dayStart, dayEnd]);

  const assignments = useMemo(() => assignColumns(schedule.blocks), [schedule.blocks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, delta } = event;
    const id = String(active.id);
    const block = schedule.blocks.find((b) => b.id === id);
    if (!block) return;

    const deltaMinutes = snapMinutes(Math.round(delta.y / pxPerMinute), SNAP_MINUTES);
    if (deltaMinutes === 0) return;

    const type = active.data.current?.type as 'move' | 'resize-top' | 'resize-bottom' | undefined;
    if (!type) return;

    if (type === 'move') {
      const newStart = Math.max(
        dayStart,
        Math.min(dayEnd - 5, timeToMinutes(block.startTime) + deltaMinutes),
      );
      const duration = timeToMinutes(block.endTime) - timeToMinutes(block.startTime);
      const newEnd = Math.min(dayEnd, newStart + duration);
      updateBlock(id, {
        startTime: minutesToTime(newStart),
        endTime: minutesToTime(newEnd),
      });
    } else if (type === 'resize-top') {
      const currentStart = timeToMinutes(block.startTime);
      const currentEnd = timeToMinutes(block.endTime);
      const newStart = Math.max(
        dayStart,
        Math.min(
          currentEnd - scheduleDefaults.editor.minBlockDurationMinutes,
          currentStart + deltaMinutes,
        ),
      );
      updateBlock(id, { startTime: minutesToTime(newStart) });
    } else if (type === 'resize-bottom') {
      const currentStart = timeToMinutes(block.startTime);
      const currentEnd = timeToMinutes(block.endTime);
      const newEnd = Math.min(
        dayEnd,
        Math.max(
          currentStart + scheduleDefaults.editor.minBlockDurationMinutes,
          currentEnd + deltaMinutes,
        ),
      );
      updateBlock(id, { endTime: minutesToTime(newEnd) });
    }
  }

  function handleEmptyClick(e: MouseEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const minutes = snapMinutes(Math.round(y / pxPerMinute + dayStart), SNAP_MINUTES);
    const start = minutesToTime(minutes);
    const end = minutesToTime(minutes + DEFAULT_BLOCK_DURATION);
    addBlock({
      startTime: start,
      endTime: end,
      title: dictionary.editor.block.defaultTitle,
    });
  }

  const childIdsByParent = new Map<string, Block[]>();
  for (const b of schedule.blocks) {
    if (b.parentId) {
      const arr = childIdsByParent.get(b.parentId) ?? [];
      arr.push(b);
      childIdsByParent.set(b.parentId, arr);
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex select-none">
        {/* Eje de horas */}
        <div className="relative" style={{ width: HOUR_LABEL_WIDTH }}>
          {hours.map((h) => (
            <div
              key={h.label}
              className="absolute right-2 -translate-y-1/2 text-text-secondary"
              style={{
                top: (h.minutes - dayStart) * pxPerMinute,
                fontSize: 'var(--font-size-xs)',
              }}
            >
              {h.label}
            </div>
          ))}
        </div>

        {/* Grilla de bloques */}
        <div
          ref={containerRef}
          className="relative flex-1 rounded-lg border"
          style={{
            height: totalHeight,
            borderColor: 'var(--color-border)',
            background: 'var(--color-surface-variant)',
          }}
          onClick={handleEmptyClick}
          role="application"
          aria-label={dictionary.editor.title}
        >
          {/* Líneas de hora */}
          {hours.map((h) => (
            <div
              key={h.label}
              className="absolute left-0 right-0 border-t"
              style={{
                top: (h.minutes - dayStart) * pxPerMinute,
                borderColor: 'var(--color-border)',
                opacity: 0.5,
              }}
              aria-hidden="true"
            />
          ))}

          {/* Bloques raíz */}
          {assignments
            .filter((a) => a.block.parentId === null)
            .map((a) => (
              <div key={a.block.id} style={{ position: 'absolute', inset: 0 }}>
                <BlockCard
                  block={a.block}
                  pxPerMinute={pxPerMinute}
                  dayStartMinutes={dayStart}
                  dayEndMinutes={dayEnd}
                  hasChildren={(childIdsByParent.get(a.block.id)?.length ?? 0) > 0}
                  isChild={false}
                  column={a.column}
                  columnCount={a.columnCount}
                  containerWidth={containerWidth}
                />
                {/* Hijos dibujados encima, indentados */}
                {(childIdsByParent.get(a.block.id) ?? []).map((child) => (
                  <BlockCard
                    key={child.id}
                    block={child}
                    pxPerMinute={pxPerMinute}
                    dayStartMinutes={dayStart}
                    dayEndMinutes={dayEnd}
                    hasChildren={false}
                    isChild={true}
                    column={0}
                    columnCount={1}
                    containerWidth={containerWidth}
                  />
                ))}
              </div>
            ))}

          {schedule.blocks.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-text-secondary">
              {dictionary.editor.empty}
            </div>
          )}
        </div>
      </div>
    </DndContext>
  );
}
