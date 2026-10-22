import {
  createContext as createReactContext,
  type ReactNode,
  useContext,
  useMemo,
} from 'react';

import type { Callable } from '../types';

type ProviderProps<T> = { children?: ReactNode } & (T extends
  | Callable
  | readonly unknown[]
  ? { value: T }
  : T extends object
    ? T
    : { value: T });

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * A context with its provider and hook; `defaults` is the value outside any
 * provider.
 *
 * For an object, the provider takes each key as a prop and makes a new value
 * only when one of the keys in `defaults` changes, so consumers don't
 * re-render with every render of its parent. A key missing from `defaults` is
 * passed on, but changing it alone updates nothing. Anything else is passed as
 * `value` and compared as React does.
 */
export const createContext = <T,>(defaults: T) => {
  const Context = createReactContext(defaults);
  const keys = isPlainObject(defaults) ? Object.keys(defaults) : undefined;

  const Provider = ({ children, ...props }: ProviderProps<T>) => {
    const values = props as Record<string, unknown>;
    const value = useMemo(
      () => (keys ? { ...defaults, ...values } : values['value']) as T,
      // `keys` never changes, so the list always has the same length.
      keys ? keys.map((key) => values[key]) : [values['value']],
    );

    return <Context.Provider value={value}>{children}</Context.Provider>;
  };

  const useValue = () => useContext(Context);

  return [Provider, useValue] as const;
};
