import React, { memo, useMemo } from 'react';

import { Checkbox } from '../../Checkbox';
import * as Primitives from '../primitives';
import { useGetTableStore, useTableStore } from '../store';

import type { TableRowKey } from '../Table.types';

export type SelectAllCellProps = {
  /** Filtered and sorted rows; `data` itself in server mode. */
  rows: readonly unknown[];
  rowKey: (row: unknown) => TableRowKey;
};

export const SelectAllCell = memo(({ rows, rowKey }: SelectAllCellProps) => {
  const { store } = useGetTableStore();
  const selection = useTableStore('selectionConfig');

  // Toggles every selectable, enabled row; disabled rows keep their state.
  const scopeKeys = useMemo(
    () =>
      rows
        .filter(
          (row) =>
            (selection?.isRowSelectable?.(row) ?? true) &&
            !(selection?.isRowDisabled?.(row) ?? false),
        )
        .map((row) => rowKey(row)),
    [rows, rowKey, selection],
  );

  const selectedKeys = useTableStore('selectedKeys');
  const selectedInScope = useMemo(() => {
    let count = 0;
    for (const key of scopeKeys) if (selectedKeys.has(key)) count += 1;
    return count;
  }, [scopeKeys, selectedKeys]);

  const allChecked: boolean | 'indeterminate' =
    scopeKeys.length > 0 && selectedInScope === scopeKeys.length
      ? true
      : selectedInScope > 0
        ? 'indeterminate'
        : false;

  return (
    <Primitives.HeaderCell>
      <Checkbox
        aria-label="Select all rows"
        checked={allChecked}
        disabled={scopeKeys.length === 0}
        onCheckedChange={() =>
          store('setRowsSelected')(scopeKeys, allChecked !== true)
        }
      />
    </Primitives.HeaderCell>
  );
});
SelectAllCell.displayName = 'SelectAllCell';
