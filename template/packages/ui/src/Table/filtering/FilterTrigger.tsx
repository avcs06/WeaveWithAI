import { Filter } from 'lucide-react';
import React, { type ComponentProps } from 'react';

import { IconButton } from '../../Button';

export type FilterTriggerProps = Omit<
  ComponentProps<'button'>,
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
 * Filled funnel and "active" in its name while filtered. The menu's trigger
 * props (events, ids, open state) pass through to the button.
 */
export const FilterTrigger = ({
  active,
  label,
  ref,
  ...props
}: FilterTriggerProps) => (
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
);
