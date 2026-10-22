'use client';

import React from 'react';

import { TableColumn } from './columns';
import { TableExpansion } from './expansion';
import { TableFilter } from './filtering';
import { TableInfiniteScroll } from './infiniteScroll';
import { TablePagination } from './pagination';
import { TableReorder } from './reorder';
import { TableSelection } from './selection';
import { TableSort } from './sorting';
import { TableProvider } from './store';
import { TableContent, type TableContentProps } from './TableContent';

import type { TableProps } from './Table.types';

/**
 * Config components (`Table.Column`, `Table.Sort`, …) render first and write
 * their props into a per-table store; the content renders after them.
 * `mode` applies to sort, filter and pagination together.
 * @invalidAlternative table
 */
export function Table<T>({ children, ...props }: TableProps<T>) {
  return (
    <TableProvider>
      {children}
      <TableContent {...(props as unknown as TableContentProps)} />
    </TableProvider>
  );
}

Table.Column = TableColumn;
Table.Sort = TableSort;
Table.Filter = TableFilter;
Table.Selection = TableSelection;
Table.Expansion = TableExpansion;
Table.Reorder = TableReorder;
Table.Pagination = TablePagination;
Table.InfiniteScroll = TableInfiniteScroll;
