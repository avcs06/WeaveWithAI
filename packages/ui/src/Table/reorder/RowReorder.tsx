import {
  closestCenter,
  DndContext,
  type ScreenReaderInstructions,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import React, {
  createContext,
  type ReactNode,
  useContext,
  useId,
  useState,
} from 'react';

import { useRowReorder } from './useRowReorder';

import type { TableRowKey } from '../Table.types';

const MODIFIERS = [restrictToVerticalAxis];

const SCREEN_READER_INSTRUCTIONS: ScreenReaderInstructions = {
  draggable:
    'To pick up a row, press Space or Enter. Move it with the arrow keys, drop it with Space or Enter, or cancel with Escape.',
};

const DraggingRowKeyContext = createContext<UniqueIdentifier | undefined>(
  undefined,
);

/** Key of the row being dragged; undefined without `Table.Reorder`. */
export const useDraggingRowKey = () => useContext(DraggingRowKeyContext);

export type RowReorderProps = {
  /** All rows, for drag-and-drop indexes. */
  data: readonly unknown[];
  rowKey: (row: unknown) => TableRowKey;
  /** Keys of the rendered rows, in order. */
  rowKeys: TableRowKey[];
  children: ReactNode;
};

/**
 * Drag and drop for the rendered rows; mounted only with `Table.Reorder`.
 * It wraps the row groups inside the body table, so turning reorder on or off
 * remounts the rows, not the scroll area. Its screen reader markup goes to
 * `document.body`: a `<table>` can't hold it.
 */
export const RowReorder = ({
  data,
  rowKey,
  rowKeys,
  children,
}: RowReorderProps) => {
  // dnd-kit's own ids come from a module counter, which differs between the
  // server and the client.
  const id = useId();
  const [draggingKey, setDraggingKey] = useState<UniqueIdentifier>();
  const { sensors, onDragEnd } = useRowReorder({ data, rowKey });

  return (
    <DndContext
      id={id}
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={MODIFIERS}
      onDragStart={({ active }) => setDraggingKey(active.id)}
      onDragEnd={(event) => {
        setDraggingKey(undefined);
        onDragEnd(event);
      }}
      onDragCancel={() => setDraggingKey(undefined)}
      accessibility={{
        // Rendered only after mount, when `document` exists.
        container: typeof document === 'undefined' ? undefined : document.body,
        screenReaderInstructions: SCREEN_READER_INSTRUCTIONS,
      }}
    >
      <SortableContext items={rowKeys} strategy={verticalListSortingStrategy}>
        <DraggingRowKeyContext.Provider value={draggingKey}>
          {children}
        </DraggingRowKeyContext.Provider>
      </SortableContext>
    </DndContext>
  );
};
