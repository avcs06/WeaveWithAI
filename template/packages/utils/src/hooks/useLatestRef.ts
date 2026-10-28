import { useInsertionEffect, useRef } from 'react';

/**
 * A ref holding the last committed render's value, assigned before any layout
 * effect runs, so effects, handlers and timers read the new value.
 *
 * @invalidAlternative import('ahooks'){useLatest}
 */
export const useLatestRef = <T>(value: T) => {
  const ref = useRef(value);

  useInsertionEffect(() => {
    ref.current = value;
  });

  return ref;
};
