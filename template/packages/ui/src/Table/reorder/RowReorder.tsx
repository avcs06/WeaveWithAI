import {
  type Announcements,
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
  /** Names a row in announcements, as in its controls' labels. */
  rowLabel: (key: TableRowKey) => string;
  children: ReactNode;
};

/**
 * Drag and drop for the rendered rows; mounted only with `Table.Reorder`. Wraps
 * the row groups inside the body table, so toggling reorder remounts the rows,
 * not the scroll area. Its screen reader markup goes to `document.body`: a
 * `<table>` can't hold it.
 */
export const RowReorder = ({
  data,
  rowKey,
  rowKeys,
  rowLabel,
  children,
}: RowReorderProps) => {
  // dnd-kit's own ids use a module counter, which differs between server and
  // client.
  const id = useId();
  const [draggingKey, setDraggingKey] = useState<UniqueIdentifier>();
  const { sensors, onDragEnd } = useRowReorder({ data, rowKey });

  const position = (key: TableRowKey) =>
    `position ${rowKeys.indexOf(key) + 1} of ${rowKeys.length}`;

  // dnd-kit's defaults read out the raw row keys.
  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      `Picked up ${rowLabel(active.id)}, ${position(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over
        ? `${rowLabel(active.id)} moved to ${position(over.id)}.`
        : `${rowLabel(active.id)} is no longer over a row.`,
    onDragEnd: ({ active, over }) =>
      over
        ? `Dropped ${rowLabel(active.id)} at ${position(over.id)}.`
        : `Dropped ${rowLabel(active.id)}.`,
    onDragCancel: ({ active }) =>
      `Cancelled. ${rowLabel(active.id)} is back at ${position(active.id)}.`,
  };

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
        announcements,
      }}
    >
      <SortableContext items={rowKeys} strategy={verticalListSortingStrategy}>
        <DraggingRowKeyContext value={draggingKey}>
          {children}
        </DraggingRowKeyContext>
      </SortableContext>
    </DndContext>
  );
};
