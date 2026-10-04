import { classNames } from '@packages/styles/classNames';
import { INPUT_CHANGE_DEBOUNCE_MS } from '@packages/utils/constants';
import { useBoundState, useDebouncedCallback } from '@packages/utils/hooks';
import { isNil, omit } from 'lodash-es';
import React, { useId } from 'react';

import { dropdownRow } from '../../Dropdown';
import { NumberInput } from '../../Input';
import { Popover } from '../../Popover';

import { FilterTrigger } from './FilterTrigger';
import * as styles from './NumberFilter.css';

import type { TableNumberFilterValue } from '../Table.types';

const OPERATORS = [
  { key: 'eq', symbol: '=', placeholder: 'Equal to' },
  { key: 'lt', symbol: '<', placeholder: 'Less than' },
  { key: 'gt', symbol: '>', placeholder: 'Greater than' },
] as const;

const EMPTY_VALUE: TableNumberFilterValue = { type: 'number' };

export type NumberFilterProps = {
  label: string;
  value?: TableNumberFilterValue;
  onChange: (value: TableNumberFilterValue | undefined) => void;
};

/** Operators combine with AND; inputs commit once typing pauses. */
export const NumberFilter = ({ label, value, onChange }: NumberFilterProps) => {
  const name = useId();
  const [draft, setDraft] = useBoundState(value ?? EMPTY_VALUE);
  const commit = useDebouncedCallback(onChange, INPUT_CHANGE_DEBOUNCE_MS);

  const update = (
    key: (typeof OPERATORS)[number]['key'],
    number: number | null,
  ) => {
    // Blur re-reports the current value; only real edits commit.
    if ((draft[key] ?? null) === number) return;
    const next: TableNumberFilterValue = {
      ...omit(draft, key),
      ...(isNil(number) ? {} : { [key]: number }),
    };
    setDraft(next);
    commit(next);
  };

  return (
    <Popover
      aria-label={`Filter ${label}`}
      align="end"
      menu={
        // Inset like the enum filter's search row.
        <div className={classNames(dropdownRow, 'flex-col-gap-2')}>
          {OPERATORS.map(({ key, symbol, placeholder }) => (
            <NumberInput
              key={key}
              name={`${name}-${key}`}
              placeholder={`${label} ${placeholder.toLowerCase()}`}
              aria-label={`${label} ${placeholder.toLowerCase()}`}
              value={draft[key] ?? null}
              onChange={(number) => update(key, number)}
              leftAddOn={
                <span className={styles.filterOperator}>{symbol}</span>
              }
            />
          ))}
        </div>
      }
    >
      <FilterTrigger active={value !== undefined} label={label} />
    </Popover>
  );
};
