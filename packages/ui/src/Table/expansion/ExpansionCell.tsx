import { ChevronDown, ChevronRight } from 'lucide-react';
import React, { memo } from 'react';

import { IconButton } from '../../Button';
import * as Primitives from '../primitives';
import { useGetTableStore } from '../store';

import type { TableRowKey } from '../Table.types';

export type ExpansionCellProps = {
  rowKey: TableRowKey;
  /** One-based position of the row, to tell buttons apart. */
  position: number;
  expandable: boolean;
  expanded: boolean;
  disabled: boolean;
};

export const ExpansionCell = memo(
  ({
    rowKey,
    position,
    expandable,
    expanded,
    disabled,
  }: ExpansionCellProps) => {
    const { store } = useGetTableStore();
    return (
      <Primitives.Cell>
        {/* A block, so the cell centers it; inline, it sits on the baseline. */}
        {expandable && (
          <div className="flex-row-gap-0 items-center">
            <IconButton
              size="xs"
              variant="ghost"
              aria-label={`${expanded ? 'Collapse' : 'Expand'} row ${position}`}
              aria-expanded={expanded}
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
