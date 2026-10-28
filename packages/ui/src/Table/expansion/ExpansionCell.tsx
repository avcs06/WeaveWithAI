import { ChevronDown, ChevronRight } from 'lucide-react';
import React, { memo } from 'react';

import { IconButton } from '../../Button';
import * as Primitives from '../primitives';
import { useGetTableStore } from '../store';

import type { TableRowKey } from '../Table.types';

export type ExpansionCellProps = {
  rowKey: TableRowKey;
  /** Names the row, to tell buttons apart. */
  label: string;
  /** The details row's id; it exists only while expanded. */
  detailsId: string;
  expandable: boolean;
  expanded: boolean;
  disabled: boolean;
};

export const ExpansionCell = memo(
  ({
    rowKey,
    label,
    detailsId,
    expandable,
    expanded,
    disabled,
  }: ExpansionCellProps) => {
    const { store } = useGetTableStore();
    return (
      <Primitives.Cell data-slot="expansion-cell">
        {/* A block, so the cell centers it; inline, it sits on the baseline. */}
        {expandable && (
          <div className="flex-row-gap-0 items-center justify-center">
            <IconButton
              size="xs"
              variant="base"
              look="ghost"
              tooltip="Details"
              // A constant name: `aria-expanded` says open or closed.
              aria-label={`Details for ${label}`}
              aria-expanded={expanded}
              aria-controls={expanded ? detailsId : undefined}
              disabled={disabled}
              onClick={() => store('toggleRowExpansion')(rowKey)}
            >
              {expanded ? <ChevronDown /> : <ChevronRight />}
            </IconButton>
          </div>
        )}
      </Primitives.Cell>
    );
  },
);
ExpansionCell.displayName = 'ExpansionCell';
