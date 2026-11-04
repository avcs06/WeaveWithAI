import type { TableSlice } from '../store.types';
import type { TableReorderProps } from '../Table.types';

export type ReorderConfig = TableReorderProps<unknown>;

export type ReorderSlice = {
  /** Undefined without `Table.Reorder`. */
  reorderConfig: ReorderConfig | undefined;
};

export const createReorderSlice: TableSlice<ReorderSlice> = () => ({
  reorderConfig: undefined,
});
