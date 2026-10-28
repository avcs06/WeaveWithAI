import React, { memo } from 'react';

import { Checkbox } from '../../Checkbox';
import * as Primitives from '../primitives';
import { useGetTableStore } from '../store';

import type { TableRowKey } from '../Table.types';

export type SelectionCellProps = {
  rowKey: TableRowKey;
  /** Names the row, to tell checkboxes apart. */
  label: string;
  selectable: boolean;
  selected: boolean;
  disabled: boolean;
};

export const SelectionCell = memo(
  ({ rowKey, label, selectable, selected, disabled }: SelectionCellProps) => {
    const { store } = useGetTableStore();
    return (
      <Primitives.Cell data-slot="selection-cell">
        {/* A block, so the cell centers it; inline, it sits on the baseline. */}
        {selectable && (
          <div className="flex-row-gap-0 items-center justify-center">
            <Checkbox
              aria-label={`Select ${label}`}
              disabled={disabled}
              checked={selected}
              onCheckedChange={() => store('toggleRowSelection')(rowKey)}
            />
          </div>
        )}
      </Primitives.Cell>
    );
  },
);
SelectionCell.displayName = 'SelectionCell';
