import { classNames } from '@packages/styles/classNames';
import { INPUT_CHANGE_DEBOUNCE_MS } from '@packages/utils/constants';
import { useBoundState } from '@packages/utils/hooks';
import { isNil, omit } from 'lodash-es';
import React, { useId } from 'react';

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
  const [draft, setDraft] = useBoundState(
    value ?? EMPTY_VALUE,
    onChange,
    INPUT_CHANGE_DEBOUNCE_MS,
  );

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
  };

  return (
    <Popover
      aria-label={`Filter ${label}`}
      align="end"
      menu={
        // Inset like the enum filter's search row.
        <div className="flex-col-gap-2 mx-1.5">
          {OPERATORS.map(({ key, symbol, placeholder }) => (
            <NumberInput
              key={key}
              variant="base"
              name={`${name}-${key}`}
              placeholder={`${label} ${placeholder.toLowerCase()}`}
              aria-label={`${label} ${placeholder.toLowerCase()}`}
              value={draft[key] ?? null}
              onChange={(number) => update(key, number)}
              autoComplete="off"
              leftAddOn={
                <span
                  className={classNames(styles.filterOperator, 'text-center')}
                >
                  {symbol}
                </span>
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
