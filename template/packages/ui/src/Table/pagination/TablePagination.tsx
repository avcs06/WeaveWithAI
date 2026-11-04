import { usePersistentCallback } from '@packages/utils/hooks';
import { useConfigSync, useValueSync } from '@packages/utils/state';

import { DEFAULT_PAGE_SIZE_OPTIONS } from '../../Pagination';
import { useGetTableStore } from '../store';

import type { TablePaginationProps } from '../Table.types';

/** Config component: controlled with `value`, uncontrolled otherwise. */
export const TablePagination = ({
  value,
  defaultValue,
  onChange: _onChange,
  size,
  content,
  pageSizeOptions,
  totalItems,
  unfilteredTotalItems,
}: TablePaginationProps) => {
  const { store } = useGetTableStore();
  const onChange = usePersistentCallback(_onChange);

  useConfigSync('paginationConfig', {
    size,
    content,
    pageSizeOptions,
    totalItems,
    unfilteredTotalItems,
    onChange,
    controlled: value !== undefined,
  });

  useValueSync(
    value,
    defaultValue ?? {
      pageIndex: 0,
      pageSize: (pageSizeOptions ?? DEFAULT_PAGE_SIZE_OPTIONS)[0],
    },
    store('applyPage'),
  );

  return null;
};
