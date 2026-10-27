import { useInsertionEffect, useRef } from 'react';

/**
 * A ref holding the value of the last committed render. It's assigned before
 * any layout effect runs, so effects, handlers and timers read the new value.
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
