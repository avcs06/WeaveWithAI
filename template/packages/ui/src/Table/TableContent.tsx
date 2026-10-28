import { usePersistentCallback } from '@packages/utils/hooks';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { TableBody, useClientRows } from './body';
import { TableHeader } from './header';
import { InfiniteScrollTrigger } from './infiniteScroll';
import { useColumnLayout, useLinkedScroll } from './layout';
import { TablePaginationBar } from './pagination';
import * as Primitives from './primitives';
import { SortStatus } from './sorting';
import { useTableStore } from './store';

import type { TableColumnData, TableProps } from './Table.types';

export type TableContentProps = Omit<TableProps<unknown>, 'children'>;

/**
 * Renders after the config components, so the store holds their props on mount.
 * Holds only what header, body and pagination share; each computes the rest.
 */
export const TableContent = ({
  data,
  rowKey,
  caption,
  mode = 'client',
  virtualized = false,
  loading = false,
  emptyMessage = 'No entries found.',
  onRowClick,
  className,
}: TableContentProps) => {
  // A row's key never changes, so a new inline `rowKey` re-renders nothing.
  const getRowKey = usePersistentCallback(rowKey) as typeof rowKey;
  const frameRef = useRef<HTMLDivElement>(null);

  const [headerViewport, setHeaderViewport] = useState<HTMLElement | null>(
    null,
  );
  const bodyViewport = useTableStore('bodyViewport');
  useLinkedScroll(headerViewport, bodyViewport);

  const columnOrder = useTableStore('columnOrder');
  const columnsById = useTableStore('columns');

  const selectionEnabled = useTableStore(
    (state) => state.selectionConfig !== undefined,
  );
  const expansionEnabled = useTableStore(
    (state) => state.expansionConfig !== undefined,
  );
  const reorderEnabled = useTableStore(
    (state) => state.reorderConfig !== undefined,
  );
  const paginationEnabled = useTableStore(
    (state) => state.paginationConfig !== undefined,
  );
  const infiniteScrollConfigured = useTableStore(
    (state) => state.infiniteScrollConfig !== undefined,
  );

  // Server-only: client data is already loaded, and `virtualized` covers size.
  const infiniteScrollEnabled = infiniteScrollConfigured && mode === 'server';
  useEffect(() => {
    if (infiniteScrollConfigured && mode === 'client')
      console.warn(
        'Table: Table.InfiniteScroll is ignored in client mode; use `virtualized` for large data.',
      );
  }, [infiniteScrollConfigured, mode]);

  if (paginationEnabled && infiniteScrollEnabled)
    throw new Error(
      'Table: use either Table.Pagination or Table.InfiniteScroll, not both.',
    );

  const columns = useMemo(
    () =>
      columnOrder.flatMap((id): TableColumnData[] =>
        columnsById[id] ? [columnsById[id]] : [],
      ),
    [columnOrder, columnsById],
  );

  // Shared by select-all, the body and the pagination counts.
  const rows = useClientRows({
    data,
    columns,
    enabled: mode === 'client',
  });

  const slots = useColumnLayout(columns, {
    reorder: reorderEnabled,
    selection: selectionEnabled,
    expansion: expansionEnabled,
  });

  // Server mode: `rows` is `data`; the full count comes from the given totals.
  const serverTotal = useTableStore((state) =>
    mode === 'server'
      ? (state.paginationConfig?.totalItems ??
        state.infiniteScrollConfig?.totalItems)
      : undefined,
  );
  const dataRowCount = serverTotal ?? rows.length;
  // With no rows, the empty message takes row 2.
  const shownRowCount =
    !loading && rows.length === 0 ? Math.max(dataRowCount, 1) : dataRowCount;

  return (
    <Primitives.Root data-slot="table" className={className}>
      {/* The header row plus data rows; expanded rows share their row's index. */}
      <Primitives.Frame
        ref={frameRef}
        data-slot="frame"
        // Not a tab stop: focus comes here when the load button goes.
        tabIndex={-1}
        aria-label={caption}
        aria-rowcount={shownRowCount + 1}
        aria-busy={loading}
      >
        <TableHeader
          viewportRef={setHeaderViewport}
          slots={slots}
          rows={rows}
          rowKey={getRowKey}
        />

        <TableBody
          data={data}
          mode={mode}
          rows={rows}
          rowKey={getRowKey}
          slots={slots}
          columnIds={columnOrder}
          virtualized={virtualized}
          reorderEnabled={reorderEnabled}
          infiniteScrollEnabled={infiniteScrollEnabled}
          loading={loading}
          emptyMessage={emptyMessage}
          onRowClick={onRowClick}
        />
      </Primitives.Frame>

      {/* Loading rows are hidden from assistive tech; this announces them. */}
      <span role="status" className="sr-only">
        {loading ? 'Loading…' : ''}
      </span>
      <SortStatus />

      <TablePaginationBar
        caption={caption}
        mode={mode}
        loading={loading}
        rowCount={rows.length}
        dataCount={data.length}
        tableRef={frameRef}
      />

      {infiniteScrollEnabled && (
        <InfiniteScrollTrigger data={data} loading={loading} />
      )}
    </Primitives.Root>
  );
};
