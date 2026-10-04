import type { ApplyValue } from '@packages/utils/state';

import type { TableSlice } from '../store.types';
import type {
  TablePaginationProps,
  TablePaginationValue,
} from '../Table.types';

export const DEFAULT_PAGE_SIZE_OPTIONS: readonly number[] = [10, 25, 50, 100];

export type PaginationConfig = Omit<
  TablePaginationProps,
  'value' | 'defaultValue'
> & { controlled: boolean };

export type PaginationSlice = {
  /** Undefined without `Table.Pagination`. */
  paginationConfig: PaginationConfig | undefined;
  page: TablePaginationValue;
  applyPage: ApplyValue<TablePaginationValue>;

  setPageIndex: (pageIndex: number) => void;
  setPageSize: (pageSize: number) => void;
  /** Sorting or filtering in the table: first page, scrolled to the top. */
  restartPage: () => void;
  /**
   * `restartPage` for a sort or filter `value` from the parent: a controlled
   * page is the parent's to set. This also covers the table's own change
   * coming back as `value`, which already restarted.
   */
  restartUncontrolledPage: () => void;
};

export const createPaginationSlice: TableSlice<PaginationSlice> = (
  set,
  get,
) => {
  const emitPage = (page: TablePaginationValue) => {
    const { paginationConfig } = get();
    if (!paginationConfig?.controlled) set({ page });
    paginationConfig?.onChange?.(page);
  };

  const goToFirstPage = () => {
    const { page } = get();
    if (page.pageIndex !== 0) emitPage({ ...page, pageIndex: 0 });
  };

  return {
    paginationConfig: undefined,
    page: { pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE_OPTIONS[0] },
    applyPage: (page) => set({ page }),

    setPageIndex: (pageIndex) => {
      emitPage({ ...get().page, pageIndex });
      get().scrollToTop();
    },
    setPageSize: (pageSize) => {
      emitPage({ pageIndex: 0, pageSize });
      get().scrollToTop();
    },
    restartPage: () => {
      goToFirstPage();
      get().scrollToTop();
    },
    restartUncontrolledPage: () => {
      if (!get().paginationConfig?.controlled) goToFirstPage();
      get().scrollToTop();
    },
  };
};
