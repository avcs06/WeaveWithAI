import { useDebounce } from 'ahooks';

export const useDebouncedValue = <T>(value: T, delay: number) =>
  useDebounce(value, { wait: delay });
