'use client';

import { classNames } from '@packages/styles/classNames';
import { useControlledValue } from '@packages/utils/hooks';
import React from 'react';

import { PageControls } from './PageControls';
import { pagination } from './Pagination.css';
import { PaginationInfo } from './PaginationInfo';
import { DEFAULT_PAGE_SIZE_OPTIONS, getPageCount, getPageIndex } from './utils';

import type { PaginationProps } from './Pagination.types';

/**
 * Pages of a long list: "Showing 11 to 20 of 95 items" on the left, then a
 * page-size select and First, Previous, page numbers, Next and Last. A table's
 * pages are `Table.Pagination`, built on it.
 *
 * @invalidAlternative nav[aria-label*="pagination" i], nav[aria-label*="pages" i]
 */
export const Pagination = ({
  label,
  totalItems,
  value,
  defaultValue,
  onChange,
  size = 'full',
  content = 'text',
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  disabled,
  disabledWithReason,
  showInfo = true,
  itemName = ['item', 'items'],
  filtered = false,
  unfilteredTotal,
  selectedCount,
  className,
}: PaginationProps) => {
  const [page, setPage] = useControlledValue(
    value,
    defaultValue ?? { pageIndex: 0, pageSize: pageSizeOptions[0] },
    onChange,
  );
  const { pageSize } = page;
  const pageCount = getPageCount(totalItems, pageSize);
  const pageIndex = getPageIndex(page.pageIndex, pageCount);
  const [, many] = itemName;

  return (
    <div
      data-slot="pagination"
      className={classNames(
        pagination,
        'flex-row-gap-3 items-center justify-between flex-wrap',
        className,
      )}
    >
      {showInfo && (
        <PaginationInfo
          range={{
            from: totalItems ? pageIndex * pageSize + 1 : 0,
            to: Math.min(totalItems, (pageIndex + 1) * pageSize),
          }}
          totalItems={totalItems}
          itemName={itemName}
          filtered={filtered}
          unfilteredTotal={unfilteredTotal}
          selectedCount={selectedCount}
        />
      )}
      <PageControls
        label={label}
        pageSizeLabel={`${many[0].toUpperCase()}${many.slice(1)} per page`}
        size={size}
        content={content}
        pageIndex={pageIndex}
        pageSize={pageSize}
        pageCount={pageCount}
        pageSizeOptions={pageSizeOptions}
        state={disabledWithReason ? { disabledWithReason } : { disabled }}
        onPageIndexChange={(index) => setPage({ pageIndex: index, pageSize })}
        // A new size starts over: the old page may not exist.
        onPageSizeChange={(size) => setPage({ pageIndex: 0, pageSize: size })}
      />
    </div>
  );
};
