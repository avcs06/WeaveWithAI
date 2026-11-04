import { useDebounceFn } from 'ahooks';

import { usePersistentCallback } from './usePersistentCallback';

import type { Callable } from '../types';

type DebouncedCallback<T extends Callable> = {
  (...args: Parameters<T>): ReturnType<T> | undefined;
  cancel: () => void;
  flush: () => ReturnType<T> | undefined;
};

/**
 * Runs `callback` once calls pause for `delay` ms, with the last call's
 * arguments. A call and `flush` return the last run's result, `undefined`
 * before the first. `delay` is read once, on mount.
 *
 * @invalidAlternative import('ahooks'){useDebounceFn}
 */
export const useDebouncedCallback = <T extends Callable>(
  callback: T | undefined,
  delay: number,
): DebouncedCallback<T> => {
  // Lets `callback` be missing; ahooks' own latest-ref is set while rendering.
  const persistentCallback = usePersistentCallback(callback);
  const { run } = useDebounceFn(persistentCallback, { wait: delay });
  return run;
};
