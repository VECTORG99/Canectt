import { useMemo, useRef, useState, type MouseEvent } from 'react';
import { useScheduleStore } from '../../store/scheduleStore';
import { dictionary } from '../../i18n/index';
import { timeToMinutes, minutesToTime } from './timeUtils';
import { BlockCard } from './BlockCard';
import type { Block } from '@canectt/schema';

const ROW_HEIGHT_PX = 64; // móvil: 56 — ver config/schedule-defaults.json
const HOUR_LABEL_WIDTH = 56;

interface ColumnAssignment {
  block: Block;
  column: number;
  columnCount: number;
}

/** Asigna columnas a bloques que se solapan (sin relación padre-hijo). */
function assignColumns(blocks: Block[]): ColumnAssignment[] {
  // Solo bloques raíz (sin parentId) se columnan; los hijos se indentan dentro del padre.
  const roots = blocks.filter((b) => b.parentId === null);
  const children = blocks.filter((b) => b.parentId !== null);

  // Ordenar por inicio.
  const sorted = [...roots].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  // Greedy column assignment.
  const assignments = new Map<string, { column: number; columnCount: number }>();
  const columnEnds: number[] = []; // columnEnds[i] = fin (min) de la última reunión en columna i

  // Primero calcular grupos de solapamiento para saber columnCount por bloque.
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);

  const dayStart = timeToMinutes(schedule.dayRange.startTime);
  const dayEnd = timeToMinutes(schedule.dayRange.endTime);
  const totalMinutes = dayEnd - dayStart;
  const pxPerMinute = ROW_HEIGHT_PX / 60;
  const totalHeight = totalMinutes * pxPerMinute;

  const hours = useMemo(() => {
    const arr: { label: string; minutes: number }[] = [];
    for (let m = dayStart; m <= dayEnd; m += 60) {
      arr.push({ label: minutesToTime(m), minutes: m });
    }
    return arr;
  }, [dayStart, dayEnd]);

  const assignments = useMemo(() => assignColumns(schedule.blocks), [schedule.blocks]);

  // Observar ancho del contenedor para columnas responsivas.
  useMemo(() => {
    if (containerRef.current) {
      const w = containerRef.current.clientWidth - HOUR_LABEL_WIDTH;
      if (w > 0 && w !== containerWidth) setContainerWidth(w);
    }
  }, [containerWidth]);

  function handleEmptyClick(e: MouseEvent<HTMLDivElement>) {
    // Solo crear si el clic fue directamente en la grilla (no en un bloque).
    if (e.target !== e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const minutes = Math.round(y / pxPerMinute + dayStart);
    const snapped = Math.round(minutes / 15) * 15;
    const start = minutesToTime(snapped);
    const end = minutesToTime(snapped + 30);
    addBlock({ startTime: start, endTime: end, title: dictionary.editor.block.defaultTitle });
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
  );
}
