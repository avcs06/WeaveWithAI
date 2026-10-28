import { tokens } from '@packages/styles/tokens.css';
import { useMemo } from 'react';

import type { TableColumnData, TableColumnWidth } from '../Table.types';

/**
 * One `<col>`. Control columns are told apart by `kind`, so a data column may
 * use any id, even "selection".
 */
export type TableColumnSlot = {
  kind: 'reorder' | 'selection' | 'expansion' | 'data';
  id: string;
  width?: TableColumnWidth;
  /** CSS length the column never shrinks below. */
  minWidth: string;
};

export const slotKey = ({ kind, id }: TableColumnSlot) => `${kind}:${id}`;

// A data column fits at least two letters of its title, its sort icon and
// filter button, mirroring the header's spacing (ColumnHeader.css, sm Button,
// xs IconButton): the cell's 6px padding cancels the content's -6px pull,
// leaving the title item's 6px + 6px. Two letters plus the ellipsis that
// truncation adds.
const TITLE_MIN = '2.5em';
const TITLE_PADDING = tokens.spacing[3];
// 8px gap + 16px icon.
const SORT_MIN = tokens.spacing[6];
// 2px gap + 24px button.
const FILTER_MIN = `${tokens.spacing[0.5]} + ${tokens.spacing[6]}`;

const columnMinWidth = ({ sortable, filter }: TableColumnData) =>
  `calc(${[
    TITLE_PADDING,
    TITLE_MIN,
    ...(sortable ? [SORT_MIN] : []),
    ...(filter ? [FILTER_MIN] : []),
  ].join(' + ')})`;

// 6px cell padding on both sides of a 16px pulled-in icon button / 18px
// checkbox.
const CONTROL_COLUMN_WIDTH = tokens.spacing[7];
const SELECTION_COLUMN_WIDTH = tokens.spacing[7.5];
const EXPANSION_COLUMN_WIDTH = tokens.spacing[9.5];

type UseColumnLayoutOptions = {
  reorder: boolean;
  selection: boolean;
  expansion: boolean;
};

/** Shared `<col>` widths, so the header and body tables line up. */
export const useColumnLayout = (
  columns: TableColumnData[],
  { reorder, selection, expansion }: UseColumnLayoutOptions,
) =>
  useMemo<TableColumnSlot[]>(
    () => [
      ...(reorder
        ? [
            {
              kind: 'reorder' as const,
              id: '',
              width: CONTROL_COLUMN_WIDTH,
              minWidth: CONTROL_COLUMN_WIDTH,
            },
          ]
        : []),
      ...(selection
        ? [
            {
              kind: 'selection' as const,
              id: '',
              width: SELECTION_COLUMN_WIDTH,
              minWidth: SELECTION_COLUMN_WIDTH,
            },
          ]
        : []),
      ...(expansion
        ? [
            {
              kind: 'expansion' as const,
              id: '',
              width: EXPANSION_COLUMN_WIDTH,
              minWidth: EXPANSION_COLUMN_WIDTH,
            },
          ]
        : []),
      ...columns.map((column) => ({
        kind: 'data' as const,
        id: column.id,
        width: column.width,
        minWidth: columnMinWidth(column),
      })),
    ],
    [reorder, selection, expansion, columns],
  );
