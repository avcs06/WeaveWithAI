import { usePersistentCallback } from '@packages/utils/hooks';
import {
  defaultRangeExtractor,
  type Range,
  useVirtualizer,
} from '@tanstack/react-virtual';
import React, {
  Fragment,
  memo,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { FlexScrollArea } from '../../ScrollArea';
import { TableColumnGroup, type TableColumnSlot } from '../layout';
import { usePageRange, useServerPageOffset } from '../pagination';
import * as Primitives from '../primitives';
import { RowReorder, useDraggingRowKey } from '../reorder';
import { useGetTableStore, useTableStore } from '../store';
import { spacerCell } from '../Table.css';
import { getRowLabel } from '../utils';

import { LoadingRows } from './LoadingRows';
import * as styles from './TableBody.css';
import { TableRowGroup } from './TableRowGroup';

import type { TableColumnData, TableMode, TableRowKey } from '../Table.types';

// 8px padding on both sides of a 20px line, plus the 1px divider.
const ESTIMATED_ROW_HEIGHT = 37;
const estimateSize = () => ESTIMATED_ROW_HEIGHT;
const OVERSCAN = 10;
const NO_ROW_KEYS: TableRowKey[] = [];
const LOADING_ROW_COUNT = { plain: 6, virtualized: 36, infiniteScroll: 3 };

type RowGroupsProps = {
  rows: readonly unknown[];
  rowKey: (row: unknown) => TableRowKey;
  /** Rows before the first rendered one: earlier pages. */
  positionOffset: number;
  labelColumn: TableColumnData | undefined;
  columnIds: string[];
  columnCount: number;
  scrollElement: HTMLElement | null;
  onRowClick?: (row: unknown, event: MouseEvent<HTMLTableRowElement>) => void;
};

const SpacerRow = ({
  height,
  columnCount,
}: {
  height: number;
  columnCount: number;
}) => (
  <Primitives.Body aria-hidden>
    <Primitives.Row data-slot="spacer">
      <Primitives.Cell
        colSpan={columnCount}
        className={spacerCell}
        style={{ height }}
      />
    </Primitives.Row>
  </Primitives.Body>
);

// Takes the first data row's place: the header is row 1.
const EmptyRow = ({
  columnCount,
  children,
}: {
  columnCount: number;
  children: ReactNode;
}) => (
  <Primitives.Body>
    <Primitives.Row data-slot="message" aria-rowindex={2}>
      <Primitives.Cell colSpan={columnCount} className={styles.messageCell}>
        {children}
      </Primitives.Cell>
    </Primitives.Row>
  </Primitives.Body>
);

const PlainRowGroups = ({
  rows,
  rowKey,
  positionOffset,
  labelColumn,
  columnIds,
  columnCount,
  onRowClick,
}: RowGroupsProps) =>
  rows.map((row, index) => {
    const key = rowKey(row);
    return (
      <TableRowGroup
        key={key}
        row={row}
        rowKey={key}
        index={index}
        position={positionOffset + index + 1}
        labelColumn={labelColumn}
        columnIds={columnIds}
        columnCount={columnCount}
        onRowClick={onRowClick}
      />
    );
  });

/**
 * Spacer rows stand in for unrendered rows above, between and below. React
 * Compiler skips this component (`useVirtualizer`), so the virtualizer's
 * options are stabilized by hand: a new `getItemKey` rebuilds its measurements.
 */
const VirtualRowGroups = ({
  rows,
  rowKey,
  positionOffset,
  labelColumn,
  columnIds,
  columnCount,
  scrollElement,
  onRowClick,
}: RowGroupsProps) => {
  const draggingKey = useDraggingRowKey();
  const [focusedKey, setFocusedKey] = useState<TableRowKey>();

  useEffect(() => {
    if (!scrollElement) return;
    const onFocusIn = (event: FocusEvent) => {
      const group = (event.target as Element).closest<HTMLElement>(
        '[data-index]',
      );
      if (group) setFocusedKey(rowKey(rows[Number(group.dataset.index)]));
    };
    scrollElement.addEventListener('focusin', onFocusIn);
    return () => scrollElement.removeEventListener('focusin', onFocusIn);
  }, [scrollElement, rows, rowKey]);

  // The dragged row, and the row that last held focus: unmounted once they
  // scroll out of range, they would drop the drag or the focus.
  const pinnedIndexes = useMemo(
    () =>
      [...new Set([draggingKey, focusedKey])].flatMap((key) => {
        if (key === undefined) return [];
        const index = rows.findIndex((row) => rowKey(row) === key);
        return index < 0 ? [] : [index];
      }),
    [draggingKey, focusedKey, rows, rowKey],
  );

  const getScrollElement = useCallback(() => scrollElement, [scrollElement]);
  const getItemKey = useCallback(
    (index: number) => rowKey(rows[index]),
    [rows, rowKey],
  );
  const rangeExtractor = useCallback(
    (range: Range) => {
      const indexes = defaultRangeExtractor(range);
      const missing = pinnedIndexes.filter((index) => !indexes.includes(index));
      if (!missing.length) return indexes;
      return [...indexes, ...missing].sort((a, b) => a - b);
    },
    [pinnedIndexes],
  );

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement,
    estimateSize,
    overscan: OVERSCAN,
    getItemKey,
    rangeExtractor,
  });

  let renderedEnd = 0;
  const groups = virtualizer.getVirtualItems().map((item) => {
    const gap = item.start - renderedEnd;
    renderedEnd = item.end;
    return (
      <Fragment key={item.key}>
        {gap > 0 && <SpacerRow height={gap} columnCount={columnCount} />}
        <TableRowGroup
          row={rows[item.index]}
          rowKey={item.key as TableRowKey}
          index={item.index}
          position={positionOffset + item.index + 1}
          labelColumn={labelColumn}
          columnIds={columnIds}
          columnCount={columnCount}
          measureRef={virtualizer.measureElement}
          onRowClick={onRowClick}
        />
      </Fragment>
    );
  });
  const remaining = virtualizer.getTotalSize() - renderedEnd;

  return (
    <>
      {groups}
      {remaining > 0 && (
        <SpacerRow height={remaining} columnCount={columnCount} />
      )}
    </>
  );
};

export type TableBodyProps = {
  /** All rows, for drag-and-drop indexes. */
  data: readonly unknown[];
  /** Filtered and sorted rows; `data` itself in server mode. */
  rows: readonly unknown[];
  rowKey: (row: unknown) => TableRowKey;
  mode: TableMode;
  slots: TableColumnSlot[];
  columnIds: string[];
  virtualized: boolean;
  reorderEnabled: boolean;
  infiniteScrollEnabled: boolean;
  loading: boolean;
  emptyMessage: ReactNode;
  onRowClick?: (row: unknown, event: MouseEvent<HTMLTableRowElement>) => void;
};

export const TableBody = memo(
  ({
    data,
    rows,
    rowKey,
    mode,
    slots,
    columnIds,
    virtualized,
    reorderEnabled,
    infiniteScrollEnabled,
    loading,
    emptyMessage,
    onRowClick,
  }: TableBodyProps) => {
    const { store } = useGetTableStore();
    // Stable, so a new inline `onRowClick` doesn't re-render every row.
    const handleRowClick = usePersistentCallback(
      (row: unknown, event: MouseEvent<HTMLTableRowElement>) =>
        onRowClick?.(row, event),
    );
    const isClient = mode === 'client';
    const scrollElement = useTableStore('bodyViewport');
    const attachViewport = usePersistentCallback(
      (element: HTMLDivElement | null) => store('setBodyViewport')(element),
    );

    const [start, end] = usePageRange(rows.length, isClient);
    const visibleRows = useMemo(
      () =>
        start === 0 && end === rows.length ? rows : rows.slice(start, end),
      [rows, start, end],
    );
    const serverPageOffset = useServerPageOffset(isClient);
    const positionOffset = isClient ? start : serverPageOffset;
    // A paginated table loads a page: its loading rows fill one.
    const pageSize = useTableStore((state) =>
      state.paginationConfig ? state.page.pageSize : undefined,
    );

    const rowKeys = useMemo(
      () => (reorderEnabled ? visibleRows.map(rowKey) : NO_ROW_KEYS),
      [reorderEnabled, visibleRows, rowKey],
    );

    // The row header names each row in its controls' labels; without one,
    // the first column with a value does.
    const labelColumn = useTableStore((state) => {
      const columns = columnIds.map((id) => state.columns[id]);
      return (
        columns.find((column) => column?.rowHeader) ??
        columns.find((column) => column?.dataKey || column?.computed)
      );
    });

    const rowLabel = (key: TableRowKey) => {
      const index = rowKeys.indexOf(key);
      return getRowLabel(
        labelColumn,
        visibleRows[index],
        positionOffset + index + 1,
      );
    };

    const RowGroups = virtualized ? VirtualRowGroups : PlainRowGroups;
    const columnCount = slots.length;
    const hasRows = visibleRows.length > 0;

    // Server rows are out of date while loading (page, sort or filter
    // changed). They stay mounted, dimmed, so focus inside them survives the
    // reload; infinite scroll adds loading rows below its rows instead.
    const loadingInPlace = loading && !hasRows;
    const stale = loading && hasRows && !isClient && !infiniteScrollEnabled;
    const loadingBelow = loading && hasRows && infiniteScrollEnabled;

    const rowGroups = (
      <RowGroups
        rows={visibleRows}
        rowKey={rowKey}
        positionOffset={positionOffset}
        labelColumn={labelColumn}
        columnIds={columnIds}
        columnCount={columnCount}
        scrollElement={scrollElement}
        onRowClick={onRowClick ? handleRowClick : undefined}
      />
    );

    let content: ReactNode;
    if (loadingInPlace)
      content = (
        <LoadingRows
          count={
            pageSize ??
            (virtualized
              ? LOADING_ROW_COUNT.virtualized
              : LOADING_ROW_COUNT.plain)
          }
          slots={slots}
        />
      );
    else if (!hasRows)
      content = <EmptyRow columnCount={columnCount}>{emptyMessage}</EmptyRow>;
    else if (reorderEnabled)
      content = (
        <RowReorder
          data={data}
          rowKey={rowKey}
          rowKeys={rowKeys}
          rowLabel={rowLabel}
        >
          {rowGroups}
        </RowReorder>
      );
    else content = rowGroups;

    return (
      <FlexScrollArea ref={attachViewport} data-slot="table-body">
        <Primitives.Table className={stale ? styles.staleRows : undefined}>
          <TableColumnGroup slots={slots} />
          {content}
          {loadingBelow && (
            <LoadingRows
              count={LOADING_ROW_COUNT.infiniteScroll}
              slots={slots}
            />
          )}
        </Primitives.Table>
      </FlexScrollArea>
    );
  },
);
TableBody.displayName = 'TableBody';
