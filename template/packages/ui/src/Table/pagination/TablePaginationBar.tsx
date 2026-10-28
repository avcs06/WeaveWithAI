import { classNames } from '@packages/styles/classNames';
import React, { memo, type RefObject, useLayoutEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { Button } from '../../Button';
import {
  DEFAULT_PAGE_SIZE_OPTIONS,
  Pagination,
  PaginationInfo,
} from '../../Pagination';
import { useGetTableStore, useTableStore } from '../store';

import * as styles from './TablePaginationBar.css';

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
  /** The table's element, which takes focus when the load button goes. */
  tableRef: RefObject<HTMLElement | null>;
};

type LoadMoreButtonProps = Pick<
  TablePaginationBarProps,
  'loading' | 'tableRef'
> & {
  onLoadMore: () => void;
};

/**
 * Keyboard path to load more; goes once every row is loaded, handing focus to
 * the table.
 */
const LoadMoreButton = ({
  loading,
  onLoadMore,
  tableRef,
}: LoadMoreButtonProps) => {
  const ref = useRef<HTMLButtonElement>(null);

  // Runs before the button leaves the page, while it can still hold focus.
  useLayoutEffect(() => {
    const button = ref.current;
    const table = tableRef.current;
    return () => {
      if (button && button === document.activeElement) table?.focus();
    };
  }, [tableRef]);

  return (
    <Button
      ref={ref}
      variant="base"
      size="sm"
      loadingWithReason={loading ? 'Loading more rows' : undefined}
      onClick={onLoadMore}
    >
      Load more rows
    </Button>
  );
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
  onLoadMore: infiniteScrollConfig?.onLoadMore,
});

const rowName = ['row', 'rows'] as const;

/**
 * `Table.Pagination`: a Pagination of the rows. Otherwise the same info left,
 * and right a load more button (`Table.InfiniteScroll`).
 */
export const TablePaginationBar = memo(
  ({
    caption,
    rowCount,
    dataCount,
    mode,
    loading,
    tableRef,
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
      onLoadMore,
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

    if (paginated)
      return (
        <Pagination
          label={`${caption} pagination`}
          totalItems={filteredCount}
          value={page}
          // The store's own actions also scroll the rows back to the top.
          onChange={(next) =>
            next.pageSize === page.pageSize
              ? store('setPageIndex')(next.pageIndex)
              : store('setPageSize')(next.pageSize)
          }
          size={size}
          content={content}
          pageSizeOptions={pageSizeOptions}
          disabled={loading}
          itemName={rowName}
          filtered={filtered}
          unfilteredTotal={totalCount}
          selectedCount={selectedCount}
          className="px-1.5 py-2"
        />
      );

    return (
      <div
        data-slot="pagination"
        className={classNames(
          styles.paginationBar,
          'flex-row-gap-3 items-center justify-between flex-wrap px-1.5 py-2',
        )}
      >
        <PaginationInfo
          shownCount={rowCount}
          totalItems={filteredCount}
          itemName={rowName}
          filtered={filtered}
          unfilteredTotal={totalCount}
          selectedCount={selectedCount}
        />
        {!isClient && onLoadMore && rowCount < filteredCount && (
          <LoadMoreButton
            loading={loading}
            onLoadMore={onLoadMore}
            tableRef={tableRef}
          />
        )}
      </div>
    );
  },
);
TablePaginationBar.displayName = 'TablePaginationBar';
