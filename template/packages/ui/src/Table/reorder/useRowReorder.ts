import {
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';

import { useGetTableStore } from '../store';

import type { TableRowKey } from '../Table.types';

type UseRowReorderOptions = {
  data: readonly unknown[];
  rowKey: (row: unknown) => TableRowKey;
};

export const useRowReorder = ({ data, rowKey }: UseRowReorderOptions) => {
  const { store } = useGetTableStore();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  /** Indexes refer to `data`, so they stay valid across pages and filters. */
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const onReorder = store('reorderConfig')?.onReorder;
    if (!onReorder || !over || active.id === over.id) return;

    const fromIndex = data.findIndex((row) => rowKey(row) === active.id);
    const toIndex = data.findIndex((row) => rowKey(row) === over.id);
    if (fromIndex < 0 || toIndex < 0) return;

    onReorder({
      rowKey: active.id,
      fromIndex,
      toIndex,
      rows: arrayMove([...data], fromIndex, toIndex),
    });
  };

  return { sensors, onDragEnd };
};
