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

import type { TableProps, TypedTable } from './Table.types';

/**
 * Rows of records to scan, sort, filter, select and act on. Configure with
 * `Table.*` children: a `Table.Column` per column, plus the features needed
 * (`Table.Selection`, `Table.Pagination`, …).
 * @invalidAlternative table, [role="table"], [role="cell"]
 */
export function Table<T>({ children, ...props }: TableProps<T>) {
  return (
    <TableProvider
      content={<TableContent {...(props as unknown as TableContentProps)} />}
    >
      {children}
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

/**
 * `Table` typed for row type `T`. A parent's generic never reaches its children
 * in TSX, so `<Table<Row>>` leaves the parts untyped; this binds `T` to the
 * table and every part (`dataKey`, `row` in renders and callbacks). Call once
 * at module scope; it returns `Table` itself.
 */
export function createTable<T extends object>(): TypedTable<T> {
  return Table;
}
