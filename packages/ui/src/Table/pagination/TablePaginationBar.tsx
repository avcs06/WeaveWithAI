import { classNames } from '@packages/styles/classNames';
import React, { memo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useGetTableStore, useTableStore } from '../store';

import { PageControls } from './PageControls';
import { PaginationInfo } from './PaginationInfo';
import { DEFAULT_PAGE_SIZE_OPTIONS } from './paginationSlice';
import * as styles from './TablePaginationBar.css';
import { getPageCount, getPageIndex } from './utils';

import type { TableStoreState } from '../store.types';
import type { TableMode } from '../Table.types';

export type TablePaginationBarProps = {
  /** The table's name; names the page navigation. */
  caption: string;
  /** Filtered rows; `data` itself in server mode. */
  rowCount: number;
  /** `data.length`: the unfiltered count in client mode. */
  dataCount: number;
  mode: TableMode;
  loading: boolean;
};

const selectConfig = ({
  paginationConfig: config,
  infiniteScrollConfig,
}: TableStoreState) => ({
  paginated: config !== undefined,
  size: config?.size ?? 'full',
  content: config?.content ?? 'text',
  pageSizeOptions: config?.pageSizeOptions ?? DEFAULT_PAGE_SIZE_OPTIONS,
  totalItems: config?.totalItems ?? infiniteScrollConfig?.totalItems,
  unfilteredTotalItems: config?.unfilteredTotalItems,
});

/**
 * Info on the left; with `Table.Pagination`, page controls on the right,
 * centered to each other.
 */
export const TablePaginationBar = memo(
  ({
    caption,
    rowCount,
    dataCount,
    mode,
    loading,
  }: TablePaginationBarProps) => {
    const isClient = mode === 'client';
    const { store } = useGetTableStore();

    const {
      paginated,
      size,
      content,
      pageSizeOptions,
      totalItems,
      unfilteredTotalItems,
    } = useTableStore(useShallow(selectConfig));
    const page = useTableStore('page');
    const filtered = useTableStore(
      (state) => Object.keys(state.filters).length > 0,
    );
    const selectedCount = useTableStore((state) =>
      state.selectionConfig ? state.selectedKeys.size : undefined,
    );

    // Server mode counts from the totals it is given.
    const filteredCount = isClient ? rowCount : (totalItems ?? rowCount);
    const totalCount = isClient ? dataCount : unfilteredTotalItems;
    const pageCount = getPageCount(filteredCount, page.pageSize);
    const pageIndex = getPageIndex(page.pageIndex, pageCount);

    return (
      <div
        className={classNames(
          styles.paginationBar,
          'flex-row-gap-3 items-center justify-between flex-wrap px-1.5 py-2',
        )}
      >
        <PaginationInfo
          range={
            paginated
              ? {
                  from: filteredCount ? pageIndex * page.pageSize + 1 : 0,
                  to: Math.min(filteredCount, (pageIndex + 1) * page.pageSize),
                }
              : undefined
          }
          shownCount={rowCount}
          filteredCount={filteredCount}
          totalCount={totalCount}
          filtered={filtered}
          selectedCount={selectedCount}
        />
        {paginated && (
          <PageControls
            label={`${caption} pagination`}
            size={size}
            content={content}
            pageIndex={pageIndex}
            pageSize={page.pageSize}
            pageCount={pageCount}
            pageSizeOptions={pageSizeOptions}
            disabled={loading}
            onPageIndexChange={store('setPageIndex')}
            onPageSizeChange={store('setPageSize')}
          />
        )}
      </div>
    );
  },
);
TablePaginationBar.displayName = 'TablePaginationBar';
