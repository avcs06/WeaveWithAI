import { useShallow } from 'zustand/react/shallow';

import { getPageCount, getPageIndex } from '../../Pagination';
import { useTableStore } from '../store';

import type { TableStoreState } from '../store.types';
import type { PaginationSlice } from './paginationSlice';

/**
 * `[start, end)` of the current page in the filtered rows. Every row without
 * `Table.Pagination`, and in server mode, where `data` is already the page.
 */
const getPageRange = (
  {
    paginationConfig,
    page,
  }: Pick<PaginationSlice, 'paginationConfig' | 'page'>,
  rowCount: number,
  isClient: boolean,
): [number, number] => {
  if (!isClient || !paginationConfig) return [0, rowCount];
  const pageCount = getPageCount(rowCount, page.pageSize);
  const start = getPageIndex(page.pageIndex, pageCount) * page.pageSize;
  return [start, Math.min(start + page.pageSize, rowCount)];
};

/** Re-renders only when the page range itself changes. */
export const usePageRange = (rowCount: number, isClient: boolean) =>
  useTableStore(
    useShallow((state: TableStoreState) =>
      getPageRange(state, rowCount, isClient),
    ),
  );

/** Server mode renders one page of `data`: rows on earlier pages come first. */
export const useServerPageOffset = (isClient: boolean) =>
  useTableStore((state) =>
    !isClient && state.paginationConfig
      ? state.page.pageIndex * state.page.pageSize
      : 0,
  );
