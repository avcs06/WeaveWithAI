import { omit } from 'lodash-es';

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

const sameIds = (a: string[], b: string[]) =>
  a.length === b.length && a.every((id, index) => id === b[index]);

export const createColumnsSlice: TableSlice<ColumnsSlice> = (set) => ({
  columns: {},
  columnRenders: {},
  columnOrder: [],
  setColumn: (column) =>
    set((state) => ({ columns: { ...state.columns, [column.id]: column } })),
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
      sameIds(ids, state.columnOrder) ? state : { columnOrder: ids },
    ),
});
