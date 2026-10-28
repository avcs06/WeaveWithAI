import { useMemo } from 'react';

import { filterRows } from '../filtering';
import { sortRows } from '../sorting';
import { useTableStore } from '../store';

import type { TableColumnData } from '../Table.types';

type UseClientRowsProps<T> = {
  data: readonly T[];
  columns: TableColumnData[];
  enabled: boolean;
};

/** Client mode: filter, then sort. Server mode returns `data` untouched. */
export const useClientRows = <T>({
  data,
  columns,
  enabled,
}: UseClientRowsProps<T>) => {
  const sort = useTableStore('sort');
  const filters = useTableStore('filters');

  return useMemo(() => {
    if (!enabled) return data;
    const filtered = filterRows(data, columns, filters);
    const sortColumn =
      sort && columns.find((column) => column.id === sort.columnId);
    return sortColumn
      ? sortRows(filtered, sortColumn, sort.direction)
      : filtered;
  }, [data, columns, sort, filters, enabled]);
};
