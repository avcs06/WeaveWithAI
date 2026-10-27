import { isEqual, isEqualWith, omit } from 'lodash-es';
import { isValidElement } from 'react';

import type { TableSlice } from '../store.types';
import type { TableColumnData, TableColumnRender } from '../Table.types';

export type ColumnsSlice = {
  columns: Record<string, TableColumnData>;
  columnRenders: Record<string, TableColumnRender | undefined>;
  /** Column ids in the order the columns render. */
  columnOrder: string[];
  setColumn: (column: TableColumnData) => void;
  setColumnRender: (id: string, render: TableColumnRender | undefined) => void;
  /** Also drops the id from the order. */
  removeColumn: (id: string) => void;
  setColumnOrder: (ids: string[]) => void;
};

/**
 * Compares a column's props by value. Without React Compiler, inline props
 * (`filter={{…}}`, a JSX `title`) are new on every render; an equal column
 * keeps its stored object, so rows aren't filtered and sorted again.
 * Functions, like `computed`, compare by reference: a new one may compute
 * something else.
 */
const isSameConfig = (a: unknown, b: unknown): boolean =>
  isEqualWith(a, b, (left, right) =>
    isValidElement(left) && isValidElement(right)
      ? left.type === right.type &&
        left.key === right.key &&
        isSameConfig(left.props, right.props)
      : undefined,
  );

export const createColumnsSlice: TableSlice<ColumnsSlice> = (set) => ({
  columns: {},
  columnRenders: {},
  columnOrder: [],
  setColumn: (column) =>
    set((state) =>
      isSameConfig(state.columns[column.id], column)
        ? state
        : { columns: { ...state.columns, [column.id]: column } },
    ),
  setColumnRender: (id, render) =>
    set((state) => ({
      columnRenders: { ...state.columnRenders, [id]: render },
    })),
  removeColumn: (id) =>
    set((state) => ({
      columns: omit(state.columns, id),
      columnRenders: omit(state.columnRenders, id),
      columnOrder: state.columnOrder.includes(id)
        ? state.columnOrder.filter((other) => other !== id)
        : state.columnOrder,
    })),
  // Keeps the previous array when nothing moved, so subscribers don't re-render.
  setColumnOrder: (ids) =>
    set((state) =>
      isEqual(ids, state.columnOrder) ? state : { columnOrder: ids },
    ),
});
