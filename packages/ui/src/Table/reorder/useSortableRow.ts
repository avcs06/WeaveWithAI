import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { usePersistentCallback } from '@packages/utils/hooks';

import type { TableRowKey } from '../Table.types';

export type GroupRef = (element: HTMLTableSectionElement | null) => void;

type UseSortableRowOptions = {
  rowKey: TableRowKey;
  /** A sort is active: nothing moves. */
  sortActive: boolean;
  /** This row can't be dragged, but stays a drop target. */
  dragDisabled: boolean;
  measureRef?: GroupRef;
};

/** Sortable wiring for one row group: its ref, drag transform and handle props. */
export const useSortableRow = ({
  rowKey,
  sortActive,
  dragDisabled,
  measureRef,
}: UseSortableRowOptions) => {
  const {
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: rowKey,
    disabled: sortActive || { draggable: dragDisabled, droppable: false },
  });

  const groupRef = usePersistentCallback(
    (element: HTMLTableSectionElement | null) => {
      setNodeRef(element);
      measureRef?.(element);
    },
  );

  return {
    groupRef,
    dragging: isDragging,
    style: { transform: CSS.Translate.toString(transform), transition },
    handleRef: setActivatorNodeRef,
    handleProps: { ...attributes, ...listeners },
  };
};
