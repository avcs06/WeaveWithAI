import { classNames } from '@packages/styles/classNames';
import React, { memo } from 'react';

import { slotKey, type TableColumnSlot } from '../layout';
import * as Primitives from '../primitives';
import { useTableStore } from '../store';

import * as styles from './TableBody.css';

/**
 * Width in [40, 90]% from the cell's position: varied, but the same on every
 * render, so bars don't jump.
 */
const skeletonWidth = (row: number, column: number) => {
  let hash = Math.imul(row + 1, 0x9e3779b1) ^ Math.imul(column + 1, 0x85ebca6b);
  hash = Math.imul(hash ^ (hash >>> 15), 0x2c1b3c6d);
  hash ^= hash >>> 13;
  return 40 + ((hash >>> 0) % 51);
};

export type LoadingRowsProps = {
  count: number;
  slots: TableColumnSlot[];
};

/**
 * Stand-ins while rows load: a bar per data column. Hidden from assistive
 * tech; the table is `aria-busy` and a status announces the loading.
 */
export const LoadingRows = memo(({ count, slots }: LoadingRowsProps) => {
  const columns = useTableStore('columns');
  return (
    <Primitives.Body aria-hidden>
      {Array.from({ length: count }, (_, row) => (
        <Primitives.Row key={row} data-slot="loading">
          {slots.map((slot, column) => (
            <Primitives.Cell
              key={slotKey(slot)}
              align={slot.kind === 'data' ? columns[slot.id]?.align : undefined}
            >
              {slot.kind === 'data' && (
                <span
                  className={classNames(
                    styles.skeleton,
                    'inline-block align-middle',
                  )}
                  style={{ width: `${skeletonWidth(row, column)}%` }}
                />
              )}
            </Primitives.Cell>
          ))}
        </Primitives.Row>
      ))}
    </Primitives.Body>
  );
});
LoadingRows.displayName = 'LoadingRows';
