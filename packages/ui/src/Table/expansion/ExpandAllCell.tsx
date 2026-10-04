import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import React, { memo, useMemo } from 'react';

import { IconButton } from '../../Button';
import * as Primitives from '../primitives';
import { useGetTableStore, useTableStore } from '../store';

import type { TableRowKey } from '../Table.types';

export type ExpandAllCellProps = {
  /** Filtered and sorted rows; `data` itself in server mode. */
  rows: readonly unknown[];
  rowKey: (row: unknown) => TableRowKey;
};

/** Expands every expandable, enabled row, or collapses them once all are open. */
export const ExpandAllCell = memo(({ rows, rowKey }: ExpandAllCellProps) => {
  const { store } = useGetTableStore();
  const isRowExpandable = useTableStore(
    (state) => state.expansionConfig?.isRowExpandable,
  );
  const isRowDisabled = useTableStore(
    (state) => state.expansionConfig?.isRowDisabled,
  );

  // Disabled rows keep their state, as with select-all.
  const scopeKeys = useMemo(
    () =>
      rows
        .filter(
          (row) =>
            (isRowExpandable?.(row) ?? true) &&
            !(isRowDisabled?.(row) ?? false),
        )
        .map((row) => rowKey(row)),
    [rows, rowKey, isRowExpandable, isRowDisabled],
  );

  const expandedKeys = useTableStore('expandedKeys');
  const allExpanded = useMemo(
    () =>
      scopeKeys.length > 0 && scopeKeys.every((key) => expandedKeys.has(key)),
    [scopeKeys, expandedKeys],
  );

  const label = allExpanded ? 'Collapse all rows' : 'Expand all rows';
  return (
    <Primitives.HeaderCell>
      {/* A block, so the cell centers it; inline, it sits on the baseline. */}
      <div className="flex-row-gap-0 items-center">
        <IconButton
          size="xs"
          variant="ghost"
          aria-label={label}
          tooltip={label}
          disabled={scopeKeys.length === 0}
          onClick={() => store('setRowsExpanded')(scopeKeys, !allExpanded)}
        >
          {allExpanded ? <ChevronsDownUp /> : <ChevronsUpDown />}
        </IconButton>
      </div>
    </Primitives.HeaderCell>
  );
});
ExpandAllCell.displayName = 'ExpandAllCell';
