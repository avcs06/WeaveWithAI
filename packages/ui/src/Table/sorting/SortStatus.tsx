import React, { useState } from 'react';

import { useTableStore } from '../store';
import { getColumnLabel } from '../utils';

import { toAriaSort } from './SortButton';

/**
 * Announces sort changes, which `aria-sort` alone doesn't do reliably. Its text
 * on mount (a default sort) isn't read out.
 */
export const SortStatus = () => {
  const sorted = useTableStore((state) => {
    const column = state.sort && state.columns[state.sort.columnId];
    return state.sort && column
      ? `Sorted by ${getColumnLabel(column)}, ${toAriaSort(state.sort.direction)}`
      : '';
  });

  // "Sorting cleared" only after a sort, not on a table that was never sorted.
  const [wasSorted, setWasSorted] = useState(false);
  if (sorted && !wasSorted) setWasSorted(true);

  return (
    <span role="status" className="sr-only">
      {sorted || (wasSorted ? 'Sorting cleared' : '')}
    </span>
  );
};
