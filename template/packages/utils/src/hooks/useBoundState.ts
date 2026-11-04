import { useState } from 'react';

import { useDebouncedCallback } from './useDebouncedCallback';
import { usePersistentCallback } from './usePersistentCallback';

import type { Constant } from '../types';

/**
 * Local state that follows `value` and reports edits to `onChange`, at once
 * or after `delay` ms without edits. `flush` reports a waiting edit now.
 * `delay` is a constant: it can't change once set.
 *
 * A `value` that is the same reference as the last reported edit is its echo
 * and keeps newer edits; any other `value` replaces the state.
 */
export const useBoundState = <T, D extends number = never>(
  value: T,
  onChange?: (value: T) => void,
  delay?: Constant<number, D>,
) => {
  const [state, setStateValue] = useState(value);
  const [lastValue, setLastValue] = useState(value);
  const [reported, setReported] = useState(value);

  const report = (next: T) => {
    setReported(next);
    onChange?.(next);
  };
  const reportLater = useDebouncedCallback(report, delay ?? 0);

  const isNewValue = !Object.is(value, lastValue);
  if (isNewValue) setLastValue(value);

  // The echo of a report can arrive after newer edits, and would undo them.
  const isFromOutside = isNewValue && !Object.is(value, reported);
  if (isFromOutside) {
    setStateValue(value);
    setReported(value);
    // A waiting edit would undo the outside change. Cancelled while rendering:
    // the timer can fire before an effect runs.
    reportLater.cancel();
  }

  const setState = usePersistentCallback((next: T) => {
    if (Object.is(next, state)) return;
    setStateValue(next);
    if (delay === undefined) report(next);
    else reportLater(next);
  });

  return [isFromOutside ? value : state, setState, reportLater.flush] as const;
};
