import React, { useId } from 'react';

import { dropdownRow } from '../../Dropdown';
import { SearchInput } from '../../Input';
import { Popover } from '../../Popover';

import { FilterTrigger } from './FilterTrigger';

import type { TableTextFilterValue } from '../Table.types';

export type TextFilterProps = {
  label: string;
  value?: TableTextFilterValue;
  onChange: (value: TableTextFilterValue | undefined) => void;
};

/** Debounced by `SearchInput`, so server mode emits once typing pauses. */
export const TextFilter = ({ label, value, onChange }: TextFilterProps) => {
  const name = useId();

  return (
    <Popover
      aria-label={`Filter ${label}`}
      align="end"
      menu={
        // Inset like the enum filter's search row.
        <div className={dropdownRow}>
          <SearchInput
            name={name}
            placeholder={`Search ${label}`}
            aria-label={`Search ${label}`}
            value={value?.contains ?? ''}
            onChange={(contains) =>
              onChange(contains ? { type: 'text', contains } : undefined)
            }
          />
        </div>
      }
    >
      <FilterTrigger active={value !== undefined} label={label} />
    </Popover>
  );
};
