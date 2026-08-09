import { create } from 'zustand';
import {
  createEmptyBlock,
  createEmptySchedule,
  withRecomputedOverlap,
  type Block,
  type Schedule,
} from '@canectt/schema';

interface ScheduleStore {
  schedule: Schedule;
  /** ID del bloque actualmente en edición (panel abierto), o null. */
  editingBlockId: string | null;
  /** Carga un horario completo (desde importación o creación manual). */
  load: (schedule: Schedule) => void;
  /** Crea un horario vacío con defaults. */
  reset: () => void;
  /** Actualiza metadatos del horario (título, rango, recurrencia, timezone). */
  updateMeta: (
    patch: Partial<Pick<Schedule, 'title' | 'dayRange' | 'recurrence' | 'timezone'>>,
  ) => void;
  /** Agrega un bloque y recalcula solapamientos. */
  addBlock: (partial?: Partial<Block>) => string;
  /** Actualiza un bloque por id y recalcula solapamientos. */
  updateBlock: (id: string, patch: Partial<Block>) => void;
  /** Elimina un bloque por id (y sus hijos si los tuviera) y recalcula. */
  removeBlock: (id: string) => void;
  /** Abre/cierra el panel de edición de un bloque. */
  setEditing: (id: string | null) => void;
}

export const useScheduleStore = create<ScheduleStore>((set) => ({
  schedule: createEmptySchedule(),
  editingBlockId: null,

  load: (schedule) => set({ schedule: withRecomputedOverlap(schedule), editingBlockId: null }),

  reset: () => set({ schedule: createEmptySchedule(), editingBlockId: null }),

  updateMeta: (patch) => set((state) => ({ schedule: { ...state.schedule, ...patch } })),

  addBlock: (partial) => {
    const id = partial?.id ?? crypto.randomUUID();
    set((state) => {
      const block = createEmptyBlock({ ...partial, id });
      const blocks = [...state.schedule.blocks, block];
      return {
        schedule: withRecomputedOverlap({ ...state.schedule, blocks }),
        editingBlockId: id,
      };
    });
    return id;
  },

  updateBlock: (id, patch) =>
    set((state) => {
      const blocks = state.schedule.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b));
      return { schedule: withRecomputedOverlap({ ...state.schedule, blocks }) };
    }),

  removeBlock: (id) =>
    set((state) => {
      // Eliminar también los hijos (parent_id === id).
      const blocks = state.schedule.blocks.filter((b) => b.id !== id && b.parentId !== id);
      return {
        schedule: withRecomputedOverlap({ ...state.schedule, blocks }),
        editingBlockId: state.editingBlockId === id ? null : state.editingBlockId,
      };
    }),

  setEditing: (id) => set({ editingBlockId: id }),
}));
