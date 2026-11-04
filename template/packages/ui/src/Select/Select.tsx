'use client';

import React, { type ReactNode } from 'react';

import type { UnknownRecord } from '@packages/utils/types';

import { SelectControl } from './SelectControl';
import { SelectOptionsProvider } from './SelectOption';
import { SelectStoreProvider } from './store';

import type {
  MultiSelectProps,
  SelectControlProps,
  SelectProps,
} from './Select.types';

function SelectRoot<V extends string, D extends object>({
  children,
  ...props
}: SelectControlProps<V, D> & { children: ReactNode }) {
  return (
    <SelectStoreProvider>
      <SelectOptionsProvider>{children}</SelectOptionsProvider>
      {/* SelectOption children can't be typed by their Select, so TypeScript
          can't check their values are V: taken as V. */}
      <SelectControl {...(props as unknown as SelectControlProps)} />
    </SelectStoreProvider>
  );
}

/**
 * A form field for choosing one value from a list: a venue, a ticket type, a
 * sort order. Its options are `SelectOption` children; typing filters them,
 * or `onSearch` asks the server. Several values: MultiSelect.
 *
 * @invalidAlternative select, [role="combobox"], [role="listbox"], [aria-haspopup="listbox"]
 */
export function Select<
  V extends string = string,
  D extends object = UnknownRecord,
>({ children, value, onChange, renderTrigger, ...props }: SelectProps<V, D>) {
  return (
    <SelectRoot<V, D>
      {...props}
      multiple={false}
      // react-hook-form's value is `undefined` until the form has a default.
      value={value ? [value] : []}
      onChange={(values, options) => onChange(values[0] ?? '', options[0])}
      renderTrigger={
        renderTrigger &&
        (({ selected, open }) => renderTrigger({ selected: selected[0], open }))
      }
    >
      {children}
    </SelectRoot>
  );
}

/**
 * A form field for choosing several values from a list: teams, tracks,
 * speakers. Each chosen value is a removable tag, and the menu stays open
 * while choosing. One value: Select.
 *
 * @invalidAlternative select[multiple], [role="listbox"][aria-multiselectable], Select[multiple]
 */
export function MultiSelect<
  V extends string = string,
  D extends object = UnknownRecord,
>({
  children,
  value,
  onChange,
  renderTrigger,
  ...props
}: MultiSelectProps<V, D>) {
  return (
    <SelectRoot<V, D>
      {...props}
      multiple
      // react-hook-form's value is `undefined` until the form has a default.
      value={value ?? []}
      onChange={onChange}
      renderTrigger={renderTrigger}
    >
      {children}
    </SelectRoot>
  );
}
