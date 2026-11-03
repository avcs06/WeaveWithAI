'use client';

import { classNames } from '@packages/styles/classNames';
import React, { type Key, useState } from 'react';

import { Pagination, type PaginationValue } from '../Pagination';

import { Card } from './Card';

import type { CardListProps } from './Card.types';

/**
 * Records as a column of full-width cards, each drawn by `renderItem`. With
 * `pagination`, it shows a page of cards with its own Pagination under them.
 */
export const CardList = <T extends { id: Key }>({
  items,
  renderItem,
  'aria-label': label,
  pagination,
  className,
}: CardListProps<T>) => {
  const [page, setPage] = useState<PaginationValue>({
    pageIndex: 0,
    pageSize: pagination?.pageSize ?? 10,
  });
  // A shorter list keeps the user on its last page, not past it.
  const lastPage = Math.max(0, Math.ceil(items.length / page.pageSize) - 1);
  const current = { ...page, pageIndex: Math.min(page.pageIndex, lastPage) };
  const start = current.pageIndex * current.pageSize;
  const shown = pagination
    ? items.slice(start, start + current.pageSize)
    : items;

  return (
    <div data-ds="" className={classNames('flex-col-gap-4', className)}>
      {/* eslint-disable-next-line jsx-a11y/no-redundant-roles -- Safari drops list semantics once list-style is none. */}
      <ul role="list" aria-label={label} data-ds="" className="flex-col-gap-3">
        {shown.map((item) => (
          <Card key={item.id} asChild>
            <li data-ds="">{renderItem(item)}</li>
          </Card>
        ))}
      </ul>
      {pagination && (
        <Pagination
          label={`${label} pagination`}
          totalItems={items.length}
          itemName={pagination.itemName}
          value={current}
          onChange={setPage}
        />
      )}
    </div>
  );
};
