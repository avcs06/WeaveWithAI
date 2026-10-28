import { useDebounce } from 'ahooks';

/**
 * `value` once it stops changing for `delay` ms. Compared with `Object.is`,
 * so a new object or array on every render never settles. `delay` is read
 * once, on mount.
 *
 * @invalidAlternative import('ahooks'){useDebounce}
 */
export const useDebouncedValue = <T>(value: T, delay: number) =>
  useDebounce(value, { wait: delay });
