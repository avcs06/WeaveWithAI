import React from 'react';

import * as Primitives from '../primitives';

import { slotKey, type TableColumnSlot } from './useColumnLayout';

/** Rendered in both tables so their columns line up. */
export const TableColumnGroup = ({ slots }: { slots: TableColumnSlot[] }) => (
  <Primitives.ColumnGroup>
    {slots.map((slot) => (
      <Primitives.Column
        key={slotKey(slot)}
        width={slot.width}
        style={{ minWidth: slot.minWidth }}
      />
    ))}
  </Primitives.ColumnGroup>
);
