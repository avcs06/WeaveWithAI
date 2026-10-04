import { isEqual } from 'lodash-es';

import type { ApplyValue } from '@packages/utils/state';

import { getNextSort } from './utils';

import type { TableSlice } from '../store.types';
import type { TableSortProps, TableSortValue } from '../Table.types';

type SortConfig = Pick<TableSortProps, 'onChange'> & { controlled: boolean };

export type SortSlice = {
  sort: TableSortValue;
  sortConfig: SortConfig;
  /** A change from outside after mount starts over from the first page. */
  applySort: ApplyValue<TableSortValue>;
  /** asc → desc → unsorted. */
  toggleSort: (columnId: string) => void;
};

export const createSortSlice: TableSlice<SortSlice> = (set, get) => ({
  sort: null,
  sortConfig: { controlled: false },
  applySort: (sort, initial) => {
    if (isEqual(get().sort, sort)) return;
    set({ sort });
    if (!initial) get().restartUncontrolledPage();
  },
  toggleSort: (columnId) => {
    const { sort, sortConfig, restartPage } = get();
    const next = getNextSort(sort, columnId);
    if (!sortConfig.controlled) set({ sort: next });
    sortConfig.onChange?.(next);
    restartPage();
  },
});
