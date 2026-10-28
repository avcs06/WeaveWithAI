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
} as const;

/** `aria-sort` for the sorted column's header cell; also its spoken name. */
export const toAriaSort = (direction: TableSortDirection) =>
  ARIA_SORT[direction];

export type SortButtonProps = Pick<
  ButtonProps,
  'id' | 'className' | 'onClick' | 'children'
> & {
  direction?: TableSortDirection;
};

export const SortButton = ({ direction, ...props }: SortButtonProps) => (
  <Button
    data-slot="sort"
    variant="base"
    look="ghost"
    size="sm"
    rightIcon={SORT_ICONS[direction ?? 'none']}
    {...props}
  />
);
