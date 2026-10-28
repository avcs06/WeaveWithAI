import React from 'react';

import { EnumFilter } from './EnumFilter';
import { NumberFilter } from './NumberFilter';
import { TextFilter } from './TextFilter';

import type { TableColumnFilter, TableColumnFilterValue } from '../Table.types';

export type ColumnFilterProps = {
  label: string;
  filter: TableColumnFilter;
  value?: TableColumnFilterValue;
  onChange: (value: TableColumnFilterValue | undefined) => void;
};

export const ColumnFilter = ({
  label,
  filter,
  value,
  onChange,
}: ColumnFilterProps) => {
  switch (filter.type) {
    case 'text':
      return (
        <TextFilter
          label={label}
          value={value?.type === 'text' ? value : undefined}
          onChange={onChange}
        />
      );
    case 'enum':
      return (
        <EnumFilter
          label={label}
          options={filter.options}
          value={value?.type === 'enum' ? value : undefined}
          onChange={onChange}
        />
      );
    case 'number':
      return (
        <NumberFilter
          label={label}
          value={value?.type === 'number' ? value : undefined}
          onChange={onChange}
        />
      );
  }
};
