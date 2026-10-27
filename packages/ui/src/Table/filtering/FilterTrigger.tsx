import { Filter } from 'lucide-react';
import React, { type ComponentPropsWithoutRef, forwardRef } from 'react';

import { IconButton } from '../../Button';

export type FilterTriggerProps = Omit<
  ComponentPropsWithoutRef<'button'>,
  | 'children'
  | 'aria-label'
  | 'aria-disabled'
  | 'aria-busy'
  | 'disabled'
  | 'type'
> & {
  active: boolean;
  label: string;
};

/**
 * Filled funnel, and "active" in its name, while the column is filtered. The
 * menu's trigger props (events, ids, open state) pass through to the button.
 */
export const FilterTrigger = forwardRef<HTMLButtonElement, FilterTriggerProps>(
  ({ active, label, ...props }, ref) => (
    <IconButton
      data-slot="filter"
      {...props}
      size="xs"
      ref={ref}
      variant="base"
      look="ghost"
      tooltip="Filter"
      aria-label={active ? `Filter ${label} (active)` : `Filter ${label}`}
    >
      <Filter fill={active ? 'currentColor' : 'none'} />
    </IconButton>
  ),
);
FilterTrigger.displayName = 'FilterTrigger';
