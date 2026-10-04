import React, { useMemo, useState } from 'react';

import { Checkbox } from '../../Checkbox';
import {
  Dropdown,
  type DropdownEntry,
  DropdownItemContent,
  DropdownScrollArea,
} from '../../Dropdown';

import { FilterTrigger } from './FilterTrigger';

import type { TableEnumFilterValue, TableFilterOption } from '../Table.types';

export type EnumFilterProps = {
  label: string;
  options: readonly TableFilterOption[];
  value?: TableEnumFilterValue;
  onChange: (value: TableEnumFilterValue | undefined) => void;
};

/**
 * Multi-select built from the same Dropdown parts `Select` uses; `Select`
 * itself always wraps its trigger in a field box.
 */
export const EnumFilter = ({
  label,
  options,
  value,
  onChange,
}: EnumFilterProps) => {
  const [search, setSearch] = useState('');
  const selected = new Set(value?.in);

  const visibleOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return options.filter((option) =>
      option.label.toLowerCase().includes(query),
    );
  }, [options, search]);
  // DropdownScrollArea re-checks its scroll shadow when this list changes.
  const entries = useMemo<DropdownEntry[]>(
    () =>
      visibleOptions.map(({ value, label }) => ({
        key: value,
        type: 'option',
        label,
      })),
    [visibleOptions],
  );

  const toggle = (optionValue: string) => {
    const next = new Set(selected);
    if (!next.delete(optionValue)) next.add(optionValue);
    onChange(next.size ? { type: 'enum', in: [...next] } : undefined);
  };

  return (
    <Dropdown
      align="end"
      onOpenChange={(open) => {
        if (!open) setSearch('');
      }}
      menu={
        <>
          <Dropdown.Search
            searchText={search}
            searchPlaceholder={`Search ${label}`}
            searchDelay={0}
            onSearchChange={setSearch}
          />
          <DropdownScrollArea items={entries}>
            <div className="flex-col-gap-0.5">
              {visibleOptions.map((option) => (
                <Dropdown.Item
                  key={option.value}
                  role="menuitemcheckbox"
                  aria-checked={selected.has(option.value)}
                  selected={selected.has(option.value)}
                  // Keep the menu open while picking several values.
                  onSelect={(event) => {
                    event.preventDefault();
                    toggle(option.value);
                  }}
                >
                  {/* Laid out like Select's checkbox options. */}
                  <div className="flex-row-gap-2.5 items-center">
                    {/* Visual only: the item carries the checked state.
                        `inert` also keeps the checkbox button out of focus. */}
                    <div inert className="shrink-0">
                      <Checkbox
                        size="sm"
                        checked={selected.has(option.value)}
                        data-slot="checkbox"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <DropdownItemContent label={option.label} />
                    </div>
                  </div>
                </Dropdown.Item>
              ))}
            </div>
          </DropdownScrollArea>
        </>
      }
    >
      <FilterTrigger active={value !== undefined} label={label} />
    </Dropdown>
  );
};
