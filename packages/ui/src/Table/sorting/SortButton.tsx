import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import React from 'react';

import { Button, type ButtonProps } from '../../Button';

import type { TableSortDirection } from '../Table.types';

const SORT_ICONS = {
  asc: <ArrowUp />,
  desc: <ArrowDown />,
  none: <ArrowUpDown />,
};

const ARIA_SORT = {
  asc: 'ascending',
  desc: 'descending',
  none: 'none',
} as const;

/** `aria-sort` for the header cell of a sortable column. */
export const toAriaSort = (direction?: TableSortDirection) =>
  ARIA_SORT[direction ?? 'none'];

export type SortButtonProps = Pick<
  ButtonProps,
  'id' | 'className' | 'onClick' | 'children'
> & {
  direction?: TableSortDirection;
};

/** Ghost button with the current sort direction as its right icon. */
export const SortButton = ({ direction, ...props }: SortButtonProps) => (
  <Button
    variant="base"
    look="ghost"
    size="sm"
    rightIcon={SORT_ICONS[direction ?? 'none']}
    {...props}
  />
);
