import { Filter } from 'lucide-react';
import React, { forwardRef } from 'react';

import { IconButton, IconButtonProps } from '../../Button';

export type FilterTriggerProps = Omit<IconButtonProps, 'children'> & {
  active: boolean;
  label: string;
};

/** Filled funnel, and "active" in its name, while the column is filtered. */
export const FilterTrigger = forwardRef<HTMLButtonElement, FilterTriggerProps>(
  ({ active, label }, ref) => (
    <IconButton
      size="xs"
      ref={ref}
      variant="base"
      look="ghost"
      aria-label={active ? `Filter ${label} (active)` : `Filter ${label}`}
    >
      <Filter fill={active ? 'currentColor' : 'none'} />
    </IconButton>
  ),
);
FilterTrigger.displayName = 'FilterTrigger';
