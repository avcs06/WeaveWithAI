import { FROZEN_EMPTY_OBJECT } from '@packages/utils/constants';
import { isEqual, omit } from 'lodash-es';

import type { ApplyValue } from '@packages/utils/state';

import { isFilterEmpty } from './utils';

import type { TableSlice } from '../store.types';
import type {
  TableColumnFilterValue,
  TableFilterProps,
  TableFilterValue,
} from '../Table.types';

type FilterConfig = Pick<TableFilterProps, 'onChange'> & {
  controlled: boolean;
};

export type FilterSlice = {
  filters: TableFilterValue;
  filterConfig: FilterConfig;
  /** A change from outside after mount starts over from the first page. */
  applyFilters: ApplyValue<TableFilterValue>;
  /** Empty values remove the column from the query; equal values do nothing. */
  setColumnFilter: (
    columnId: string,
    value: TableColumnFilterValue | undefined,
  ) => void;
};

export const createFilterSlice: TableSlice<FilterSlice> = (set, get) => ({
  filters: FROZEN_EMPTY_OBJECT<TableFilterValue>(),
  filterConfig: { controlled: false },
  applyFilters: (filters, initial) => {
    if (isEqual(get().filters, filters)) return;
    set({ filters });
    if (!initial) get().restartUncontrolledPage();
  },
  setColumnFilter: (columnId, value) => {
    const { filters, filterConfig, restartPage } = get();
    const normalized = value && !isFilterEmpty(value) ? value : undefined;
    if (isEqual(filters[columnId], normalized)) return;

    const rest = omit(filters, columnId);
    const next = normalized ? { ...rest, [columnId]: normalized } : rest;
    if (!filterConfig.controlled) set({ filters: next });
    filterConfig.onChange?.(next);
    restartPage();
  },
});
