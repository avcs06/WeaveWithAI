import { useDebounceFn } from 'ahooks';

import { usePersistentCallback } from './usePersistentCallback';

import type { Callable } from '../types';

type DebouncedCallback<T extends Callable> = {
  (...args: Parameters<T>): ReturnType<T> | undefined;
  cancel: () => void;
  flush: () => ReturnType<T> | undefined;
};

export const useDebouncedCallback = <T extends Callable>(
  callback: T | undefined,
  delay: number,
): DebouncedCallback<T> => {
  const persistentCallback = usePersistentCallback(callback);
  const { run } = useDebounceFn(persistentCallback, { wait: delay });
  return run;
};
