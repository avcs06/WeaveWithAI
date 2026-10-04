import { useLatestRef } from './useLatestRef';
import { useOnce } from './useOnce';

import type { Callable } from '../types';

/** A function with a fixed identity that always calls the latest `callback`. */
export const usePersistentCallback = <T extends Callable>(
  callback: T = (() => undefined) as T,
) => {
  const callbackRef = useLatestRef(callback);

  return useOnce(
    () =>
      (...args: Parameters<T>) =>
        callbackRef.current(...args) as ReturnType<T> | undefined,
  );
};
