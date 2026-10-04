import React, { memo, type Ref } from 'react';

import { ExpandAllCell } from '../expansion';
import { slotKey, TableColumnGroup, type TableColumnSlot } from '../layout';
import * as Primitives from '../primitives';
import { SelectAllCell } from '../selection';

import { ColumnHeader } from './ColumnHeader';

import type { TableRowKey } from '../Table.types';

export type TableHeaderProps = {
  viewportRef: Ref<HTMLDivElement>;
  /** Every column, control columns included, in `<col>` order. */
  slots: TableColumnSlot[];
  /** Filtered and sorted rows; `data` itself in server mode. */
  rows: readonly unknown[];
  rowKey: (row: unknown) => TableRowKey;
};

/** Always visible: it lives outside the body's scroll area. One cell per slot. */
export const TableHeader = memo(
  ({ viewportRef, slots, rows, rowKey }: TableHeaderProps) => (
    <Primitives.HeaderViewport ref={viewportRef}>
      <Primitives.Table>
        <TableColumnGroup slots={slots} />
        <Primitives.Header>
          <Primitives.Row data-slot="header" aria-rowindex={1}>
            {slots.map((slot) => {
              const key = slotKey(slot);
              switch (slot.kind) {
                case 'reorder':
                  // Header cells need text, not only an aria-label.
                  return (
                    <Primitives.HeaderCell key={key}>
                      <span className="sr-only">Reorder</span>
                    </Primitives.HeaderCell>
                  );
                case 'selection':
                  return (
                    <SelectAllCell key={key} rows={rows} rowKey={rowKey} />
                  );
                case 'expansion':
                  return (
                    <ExpandAllCell key={key} rows={rows} rowKey={rowKey} />
                  );
                default: // 'data'
                  return <ColumnHeader key={key} columnId={slot.id} />;
              }
            })}
          </Primitives.Row>
        </Primitives.Header>
      </Primitives.Table>
    </Primitives.HeaderViewport>
  ),
);
TableHeader.displayName = 'TableHeader';
