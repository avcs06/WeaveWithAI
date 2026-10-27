/**
 * useOnce: a value made once, on mount, and kept for the component's life,
 * whatever changes later. Example: the filters a page started with, to reset
 * to.
 *
 * Not for: a value that should follow its inputs (a plain expression, which
 * React Compiler memoizes), or one to remake later (useState, or a new
 * `key`).
 *
 * Pitfall: `init` runs while rendering: keep it pure. In development,
 * Strict Mode runs it twice and keeps one result, so no request or
 * subscription in it.
 */
import { Button } from '@packages/ui/Button';
import { Chip } from '@packages/ui/Chip';
import { useOnce } from '@packages/utils/hooks';
import { isEqual } from 'lodash-es';
import React, { useState } from 'react';

// Usage: the patterns to copy.
type Filters = { city: string; free: boolean };

/**
 * Resetting to where the page started: the first `filters` are kept, and
 * Reset is disabled while nothing differs from them.
 */
const ResetFilters = ({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (filters: Filters) => void;
}) => {
  const initialFilters = useOnce(() => filters);
  return (
    <Button
      variant="base"
      {...(isEqual(filters, initialFilters)
        ? { disabledWithReason: 'The filters are as they started' }
        : {})}
      onClick={() => onChange(initialFilters)}
    >
      Reset filters
    </Button>
  );
};

export default function UseOnceRecipe() {
  const [filters, setFilters] = useState<Filters>({
    city: 'Lisbon',
    free: false,
  });
  return (
    <div className="flex-row-gap-2">
      <Chip
        active={filters.free}
        onActiveChange={(free) =>
          setFilters((current) => ({ ...current, free }))
        }
      >
        Free events only
      </Chip>
      <ResetFilters filters={filters} onChange={setFilters} />
    </div>
  );
}
