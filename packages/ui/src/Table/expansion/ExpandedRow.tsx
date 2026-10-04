import React, { memo } from 'react';

import * as Primitives from '../primitives';
import { useTableStore } from '../store';

export type ExpandedRowProps = {
  row: unknown;
  columnCount: number;
  rowIndex: number;
};

/** Full-width row under an expanded row; shares its `<tbody>`. */
export const ExpandedRow = memo(
  ({ row, columnCount, rowIndex }: ExpandedRowProps) => {
    const render = useTableStore('expansionRender');
    return (
      <Primitives.Row data-slot="expanded-content" aria-rowindex={rowIndex}>
        <Primitives.Cell colSpan={columnCount}>{render?.(row)}</Primitives.Cell>
      </Primitives.Row>
    );
  },
);
ExpandedRow.displayName = 'ExpandedRow';
