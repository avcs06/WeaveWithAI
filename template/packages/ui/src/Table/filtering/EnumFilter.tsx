import React, { useState } from 'react';

import { Dropdown } from '../../Dropdown';

import { FilterTrigger } from './FilterTrigger';

import type { TableEnumFilterValue, TableFilterOption } from '../Table.types';

export type EnumFilterProps = {
  label: string;
  options: readonly TableFilterOption[];
  value?: TableEnumFilterValue;
  onChange: (value: TableEnumFilterValue | undefined) => void;
};

/** A menu of checkable options with a search field, like a MultiSelect's. */
export const EnumFilter = ({
  label,
  options,
  value,
  onChange,
}: EnumFilterProps) => {
  const [search, setSearch] = useState('');
  const selected = new Set(value?.in);

  const query = search.trim().toLowerCase();
  const visibleOptions = options.filter((option) =>
    option.label.toLowerCase().includes(query),
  );

  const toggle = (optionValue: string) => {
    const next = new Set(selected);
    if (!next.delete(optionValue)) next.add(optionValue);
    onChange(next.size ? { type: 'enum', in: [...next] } : undefined);
  };

  return (
    <Dropdown
      align="end"
      showCheckbox
      onOpenChange={(open) => {
        if (!open) setSearch('');
      }}
      menu={
        <>
          <Dropdown.Search
            value={search}
            onChange={setSearch}
            placeholder={`Search ${label}`}
            aria-label={`Search ${label}`}
          />
          {visibleOptions.map((option) => (
            <Dropdown.CheckboxItem
              key={option.value}
              checked={selected.has(option.value)}
              textValue={option.label}
              // Keeps the menu open while picking several values.
              onSelect={(event) => event.preventDefault()}
              onCheckedChange={() => toggle(option.value)}
            >
              {option.label}
            </Dropdown.CheckboxItem>
          ))}
        </>
      }
    >
      <FilterTrigger active={value !== undefined} label={label} />
    </Dropdown>
  );
};
