import type { ApplyValue } from '@packages/utils/state';

import type { TableSlice } from '../store.types';
import type { TableExpansionProps, TableRowKey } from '../Table.types';
import type { ReactNode } from 'react';

export type ExpansionConfig = Pick<
  TableExpansionProps<unknown>,
  'onChange' | 'isRowExpandable' | 'isRowDisabled'
> & { controlled: boolean };

export type ExpansionRender = (row: unknown) => ReactNode;

export type ExpansionSlice = {
  /** Undefined without `Table.Expansion`. */
  expansionConfig: ExpansionConfig | undefined;
  /** The expanded row's renderer; undefined without `Table.Expansion`. */
  expansionRender: ExpansionRender | undefined;
  setExpansionRender: (render: ExpansionRender | undefined) => void;
  expandedKeys: ReadonlySet<TableRowKey>;
  applyExpansion: ApplyValue<readonly TableRowKey[]>;
  toggleRowExpansion: (key: TableRowKey) => void;
  /** Expand all / collapse all: other rows are left as they are. */
  setRowsExpanded: (keys: readonly TableRowKey[], expanded: boolean) => void;
};

export const createExpansionSlice: TableSlice<ExpansionSlice> = (set, get) => {
  const emit = (next: Set<TableRowKey>) => {
    const { expansionConfig } = get();
    if (!expansionConfig?.controlled) set({ expandedKeys: next });
    expansionConfig?.onChange?.([...next]);
  };

  return {
    expansionConfig: undefined,
    expansionRender: undefined,
    setExpansionRender: (expansionRender) => set({ expansionRender }),
    expandedKeys: new Set(),
    applyExpansion: (keys) => set({ expandedKeys: new Set(keys) }),
    toggleRowExpansion: (key) => {
      const next = new Set(get().expandedKeys);
      if (!next.delete(key)) next.add(key);
      emit(next);
    },
    setRowsExpanded: (keys, expanded) => {
      const next = new Set(get().expandedKeys);
      keys.forEach((key) => (expanded ? next.add(key) : next.delete(key)));
      emit(next);
    },
  };
};
