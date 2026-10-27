import React, {
  type CSSProperties,
  memo,
  type MouseEvent,
  type ReactNode,
  useId,
  useMemo,
} from 'react';
import { useShallow } from 'zustand/react/shallow';

import { ExpandedRow, ExpansionCell } from '../expansion';
import * as Primitives from '../primitives';
import { DragHandleCell, type GroupRef, useSortableRow } from '../reorder';
import { SelectionCell } from '../selection';
import { useGetTableStore, useTableStore } from '../store';
import { getRowLabel } from '../utils';

import { DataCell } from './DataCell';

import type { TableStoreState } from '../store.types';
import type { TableColumnData, TableRowKey } from '../Table.types';

export type TableRowGroupProps = {
  row: unknown;
  rowKey: TableRowKey;
  /** Index among the rendered rows; also the virtualizer's measurement index. */
  index: number;
  /** One-based row number in the whole table: `aria-rowindex`. */
  position: number;
  /** Its value names the row in the labels of the row's controls. */
  labelColumn: TableColumnData | undefined;
  columnIds: string[];
  /** Data columns plus control columns, for the expanded row. */
  columnCount: number;
  /** Virtualizer measurement; the group is measured as one item. */
  measureRef?: GroupRef;
  /** `Table`'s `onRowClick`; ignored with `Table.Expansion`. */
  onRowClick?: (row: unknown, event: MouseEvent<HTMLTableRowElement>) => void;
};

// Clicks on controls inside the row (its own or a cell's) stay theirs.
const CONTROLS =
  'a, button, input, select, textarea, label, [role="button"], [role="checkbox"], [contenteditable="true"]';

const isRowClick = (event: MouseEvent<HTMLTableRowElement>) => {
  // A cell's portalled menu or popover bubbles here through React, not the DOM.
  if (!event.currentTarget.contains(event.target as Node)) return false;
  const control = (event.target as Element).closest(CONTROLS);
  if (control && event.currentTarget.contains(control)) return false;
  // Selecting text ends in a click; it isn't one.
  return !window.getSelection()?.toString();
};

const selectRowState =
  (rowKey: TableRowKey) =>
  ({
    selectionConfig: selection,
    expansionConfig: expansion,
    reorderConfig: reorder,
    selectedKeys,
    expandedKeys,
    sort,
  }: TableStoreState) => ({
    selectionEnabled: selection !== undefined,
    isRowSelectable: selection?.isRowSelectable,
    isSelectionDisabled: selection?.isRowDisabled,
    expansionEnabled: expansion !== undefined,
    isRowExpandable: expansion?.isRowExpandable,
    isExpansionDisabled: expansion?.isRowDisabled,
    reorderEnabled: reorder !== undefined,
    isDragDisabled: reorder?.isRowDisabled,
    selected: selectedKeys.has(rowKey),
    expanded: expandedKeys.has(rowKey),
    sortActive: reorder !== undefined && sort !== null,
  });

/**
 * One shallow-compared selector per row: membership tests, flags and
 * predicate references. User predicates run when the row or a predicate changes.
 */
const useRowState = (row: unknown, rowKey: TableRowKey) => {
  const {
    isRowSelectable,
    isSelectionDisabled,
    isRowExpandable,
    isExpansionDisabled,
    isDragDisabled,
    selected,
    expanded,
    ...enabled
  } = useTableStore(useShallow(selectRowState(rowKey)));

  const flags = useMemo(
    () => ({
      selectable: enabled.selectionEnabled && (isRowSelectable?.(row) ?? true),
      rowSelectionDisabled: isSelectionDisabled?.(row) ?? false,
      expandable: enabled.expansionEnabled && (isRowExpandable?.(row) ?? true),
      rowExpansionDisabled: isExpansionDisabled?.(row) ?? false,
      dragDisabled: isDragDisabled?.(row) ?? false,
    }),
    [
      row,
      enabled.selectionEnabled,
      enabled.expansionEnabled,
      isRowSelectable,
      isSelectionDisabled,
      isRowExpandable,
      isExpansionDisabled,
      isDragDisabled,
    ],
  );

  // A selected or expanded row keeps its control even when the predicate
  // says no, so the state stays visible and can be undone.
  const shownSelected = enabled.selectionEnabled && selected;
  const shownExpanded = enabled.expansionEnabled && expanded;
  return {
    ...enabled,
    ...flags,
    selectable: flags.selectable || shownSelected,
    selected: shownSelected,
    expandable: flags.expandable || shownExpanded,
    expanded: shownExpanded,
  };
};

type RowState = ReturnType<typeof useRowState>;

type RowGroupProps = Omit<
  TableRowGroupProps,
  'labelColumn' | 'measureRef' | 'onRowClick'
> & {
  /** Names the row in its controls' labels. */
  label: string;
  /** Links the expand button to the details row. */
  detailsId: string;
  state: RowState;
  onClick?: (event: MouseEvent<HTMLTableRowElement>) => void;
  groupRef?: GroupRef;
  style?: CSSProperties;
  dragging?: boolean;
  dragHandle?: ReactNode;
};

/** A row and its expanded content share a `<tbody>`, so they move together. */
const RowGroup = ({
  row,
  rowKey,
  index,
  position,
  label,
  detailsId,
  columnIds,
  columnCount,
  state,
  onClick,
  groupRef,
  style,
  dragging,
  dragHandle,
}: RowGroupProps) => (
  <Primitives.Body
    ref={groupRef}
    data-index={index}
    data-dragging={dragging || undefined}
    style={style}
  >
    {/* The header is row 1. */}
    <Primitives.Row
      data-slot="row"
      aria-rowindex={position + 1}
      data-selected={state.selected || undefined}
      data-clickable={onClick !== undefined || undefined}
      onClick={onClick}
    >
      {state.reorderEnabled && dragHandle}
      {state.selectionEnabled && (
        <SelectionCell
          rowKey={rowKey}
          label={label}
          selectable={state.selectable}
          selected={state.selected}
          disabled={state.rowSelectionDisabled}
        />
      )}
      {state.expansionEnabled && (
        <ExpansionCell
          rowKey={rowKey}
          label={label}
          detailsId={detailsId}
          expandable={state.expandable}
          expanded={state.expanded}
          disabled={state.rowExpansionDisabled}
        />
      )}
      {columnIds.map((columnId) => (
        <DataCell key={columnId} columnId={columnId} row={row} />
      ))}
    </Primitives.Row>
    {state.expanded && (
      <ExpandedRow
        id={detailsId}
        row={row}
        columnCount={columnCount}
        rowIndex={position + 1}
      />
    )}
  </Primitives.Body>
);

const SortableRowGroup = ({
  measureRef,
  ...props
}: Omit<TableRowGroupProps, 'labelColumn' | 'onRowClick'> & {
  label: string;
  detailsId: string;
  state: RowState;
  onClick?: RowGroupProps['onClick'];
}) => {
  const { groupRef, dragging, style, handleRef, handleProps } = useSortableRow({
    rowKey: props.rowKey,
    sortActive: props.state.sortActive,
    dragDisabled: props.state.dragDisabled,
    measureRef,
  });
  return (
    <RowGroup
      {...props}
      groupRef={groupRef}
      dragging={dragging}
      style={style}
      dragHandle={
        <DragHandleCell
          ref={handleRef}
          label={props.label}
          sortActive={props.state.sortActive}
          dragDisabled={props.state.dragDisabled}
          {...handleProps}
        />
      }
    />
  );
};

export const TableRowGroup = memo(
  ({ labelColumn, onRowClick, ...props }: TableRowGroupProps) => {
    const { store } = useGetTableStore();
    const state = useRowState(props.row, props.rowKey);
    const label = getRowLabel(labelColumn, props.row, props.position);
    const detailsId = useId();

    // With expansion, a row click toggles it, like its expand button.
    const toggles = state.expandable && !state.rowExpansionDisabled;
    const clickable = state.expansionEnabled ? toggles : Boolean(onRowClick);

    const onClick = clickable
      ? (event: MouseEvent<HTMLTableRowElement>) => {
          if (!isRowClick(event)) return;
          if (state.expansionEnabled) store('toggleRowExpansion')(props.rowKey);
          else onRowClick?.(props.row, event);
        }
      : undefined;

    return state.reorderEnabled ? (
      <SortableRowGroup
        {...props}
        label={label}
        detailsId={detailsId}
        state={state}
        onClick={onClick}
      />
    ) : (
      <RowGroup
        {...props}
        label={label}
        detailsId={detailsId}
        state={state}
        onClick={onClick}
        groupRef={props.measureRef}
      />
    );
  },
);
TableRowGroup.displayName = 'TableRowGroup';
