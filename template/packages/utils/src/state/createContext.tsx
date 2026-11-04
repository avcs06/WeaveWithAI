import {
  createContext as createReactContext,
  type ReactNode,
  useContext,
  useMemo,
} from 'react';

import type { Callable } from '../types';

// Wrapped in tuples so a union isn't split: `User | null` takes `value`.
type ProviderProps<T> = { children?: ReactNode } & ([T] extends [
  Callable | readonly unknown[],
]
  ? { value: T }
  : [T] extends [object]
    ? T
    : { value: T });

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * A context with its provider and hook; `defaults` is the value outside any
 * provider.
 *
 * For an object, the provider takes each key as a prop and makes a new value
 * only when a key in `defaults` changes, so consumers don't re-render with
 * their parent. A key missing from `defaults` is passed on, but changing it
 * alone updates nothing. Anything else, including an object that can be
 * `null` or `undefined`, is passed as `value` and compared as React does.
 */
export const createContext = <T,>(defaults: T) => {
  const Context = createReactContext(defaults);
  const keys = isPlainObject(defaults) ? Object.keys(defaults) : undefined;

  const Provider = ({ children, ...props }: ProviderProps<T>) => {
    const values = props as Record<string, unknown>;
    // A nullable object type takes `value`, even with an object as defaults.
    const byKey = keys && !('value' in values && !keys.includes('value'));
    const value = useMemo(
      () => (byKey ? { ...defaults, ...values } : values['value']) as T,
      // Fixed per provider by its type, so the list keeps its length.
      byKey ? keys.map((key) => values[key]) : [values['value']],
    );

    return <Context value={value}>{children}</Context>;
  };

  const useValue = () => useContext(Context);

  return [Provider, useValue] as const;
};
