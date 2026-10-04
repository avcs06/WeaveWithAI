import React, { memo } from 'react';

import { Checkbox } from '../../Checkbox';
import * as Primitives from '../primitives';
import { useGetTableStore } from '../store';

import type { TableRowKey } from '../Table.types';

export type SelectionCellProps = {
  rowKey: TableRowKey;
  /** One-based position of the row, to tell checkboxes apart. */
  position: number;
  selectable: boolean;
  selected: boolean;
  disabled: boolean;
};

export const SelectionCell = memo(
  ({
    rowKey,
    position,
    selectable,
    selected,
    disabled,
  }: SelectionCellProps) => {
    const { store } = useGetTableStore();
    return (
      <Primitives.Cell>
        {selectable && (
          <Checkbox
            aria-label={`Select row ${position}`}
            disabled={disabled}
            checked={selected}
            onCheckedChange={() => store('toggleRowSelection')(rowKey)}
          />
        )}
      </Primitives.Cell>
    );
  },
);
SelectionCell.displayName = 'SelectionCell';
