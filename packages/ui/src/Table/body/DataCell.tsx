import { isNil } from 'lodash-es';
import React, { memo } from 'react';

import { Truncate } from '../../Truncate';
import * as Primitives from '../primitives';
import { useTableStore } from '../store';
import { getCellValue } from '../utils';

export type DataCellProps = { columnId: string; row: unknown };

/**
 * Subscribes to its own column only: a new renderer re-renders this column's
 * cells, nothing else. Renderers get the computed value when there is one.
 */
export const DataCell = memo(({ columnId, row }: DataCellProps) => {
  const column = useTableStore((state) => state.columns[columnId]);
  const render = useTableStore((state) => state.columnRenders[columnId]);
  const value = column ? getCellValue(column, row) : undefined;

  return (
    <Primitives.Cell align={column?.align}>
      {render ? (
        render(value, row)
      ) : (
        <Truncate>{isNil(value) ? '' : String(value)}</Truncate>
      )}
    </Primitives.Cell>
  );
});
DataCell.displayName = 'DataCell';
