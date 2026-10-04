import { useState } from 'react';

import { usePersistentCallback } from './usePersistentCallback';

type ChangeHandler<T, A extends unknown[]> = (value: T, ...args: A) => void;

/** Value for a component that can be controlled or uncontrolled. */
export function useControlledValue<T, A extends unknown[] = []>(
  value: T | undefined,
  defaultValue: T,
  onChange?: ChangeHandler<T, A>,
): readonly [T, ChangeHandler<T, A>];
export function useControlledValue<T, A extends unknown[] = []>(
  value: T | undefined,
  defaultValue?: T,
  onChange?: ChangeHandler<T, A>,
): readonly [T | undefined, ChangeHandler<T, A>];
export function useControlledValue<T, A extends unknown[]>(
  value: T | undefined,
  defaultValue?: T,
  onChange?: ChangeHandler<T, A>,
) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(() => defaultValue);

  const handleChange = usePersistentCallback((next: T, ...args: A) => {
    if (!isControlled) setInternalValue(() => next);
    onChange?.(next, ...args);
  });

  return [isControlled ? value : internalValue, handleChange] as const;
}
