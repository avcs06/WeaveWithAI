import type { ApplyValue } from '@packages/utils/state';

import type { TableSlice } from '../store.types';
import type { TableRowKey, TableSelectionProps } from '../Table.types';

export type SelectionConfig = Pick<
  TableSelectionProps<unknown>,
  'onChange' | 'isRowSelectable' | 'isRowDisabled'
> & { controlled: boolean };

export type SelectionSlice = {
  /** Undefined without `Table.Selection`. */
  selectionConfig: SelectionConfig | undefined;
  selectedKeys: ReadonlySet<TableRowKey>;
  applySelection: ApplyValue<readonly TableRowKey[]>;

  /** Select-all: other selections are left as they are. */
  setRowsSelected: (keys: readonly TableRowKey[], selected: boolean) => void;
  toggleRowSelection: (key: TableRowKey) => void;
};

export const createSelectionSlice: TableSlice<SelectionSlice> = (set, get) => {
  const emit = (next: Set<TableRowKey>) => {
    const { selectionConfig } = get();
    if (!selectionConfig?.controlled) set({ selectedKeys: next });
    selectionConfig?.onChange?.([...next]);
  };

  return {
    selectionConfig: undefined,
    selectedKeys: new Set(),
    applySelection: (keys) => set({ selectedKeys: new Set(keys) }),

    toggleRowSelection: (key) => {
      const next = new Set(get().selectedKeys);
      if (!next.delete(key)) next.add(key);
      emit(next);
    },
    setRowsSelected: (keys, selected) => {
      const next = new Set(get().selectedKeys);
      keys.forEach((key) => (selected ? next.add(key) : next.delete(key)));
      emit(next);
    },
  };
};
