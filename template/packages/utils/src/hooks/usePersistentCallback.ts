import { useLatestRef } from './useLatestRef';
import { useOnce } from './useOnce';

import type { Callable } from '../types';

/**
 * A fixed-identity function that always calls the latest `callback`. For an
 * event callback like `onChange` that an effect or store holds: a new
 * reference from the caller doesn't rerun the effect. Not for a function
 * called while rendering: React Compiler keeps it stable until its inputs
 * change, and a fixed identity would hide that.
 *
 * An optional `callback` gives a function returning `undefined` while missing.
 *
 * @invalidAlternative import('ahooks'){useMemoizedFn}
 */
export function usePersistentCallback<T extends Callable>(
  callback: T,
): (...args: Parameters<T>) => ReturnType<T>;
export function usePersistentCallback<T extends Callable>(
  callback?: T,
): (...args: Parameters<T>) => ReturnType<T> | undefined;
export function usePersistentCallback<T extends Callable>(callback?: T) {
  const callbackRef = useLatestRef(callback);

  return useOnce(
    () =>
      (...args: Parameters<T>) =>
        callbackRef.current?.(...args) as ReturnType<T> | undefined,
  );
}
