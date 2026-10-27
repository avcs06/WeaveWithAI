import { pick } from 'lodash-es';
import { useSyncExternalStore } from 'react';
import {
  createStore as createVanillaStore,
  type StateCreator,
  type StoreApi,
  useStore,
} from 'zustand';
import { persist, type PersistOptions } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

export type StoreSelector<T, U> = (state: T) => U;

/**
 * Subscribes to one field by key, or to what a selector returns. The result
 * compares shallowly: a selector can return an array or object of fields,
 * but not objects it builds, which are new on every call.
 */
export type StoreHook<T> = {
  <const K extends keyof T>(key: K): T[K];
  <U>(selector: StoreSelector<T, U>): U;
};

export type StoreStateHook<T> = StoreApi<T> & StoreHook<T>;

type StorePersistOptions<T> = PersistOptions<T, Partial<T>> & {
  /** Only these fields are saved; overrides `partialize`. */
  keys?: readonly (keyof T)[];
};

type CreateStoreOptions<T> = {
  persist?: StorePersistOptions<T>;
  /**
   * What the server render and hydration read:
   * - `'initial'`: the initial state (zustand's own hook).
   * - `'current'`: whatever the store holds now. Only for a store made per
   *   component instance (createStoreContext) and written while rendering:
   *   on the server a module-level store is shared by every request, and a
   *   persisted one differs from the server's render.
   */
  serverSnapshot?: 'initial' | 'current';
};

const toSelector = <T, U>(keyOrSelector: keyof T | StoreSelector<T, U>) =>
  typeof keyOrSelector === 'function'
    ? keyOrSelector
    : (state: T) => state[keyOrSelector] as U;

export const createStore = <T extends object>(
  initializer: StateCreator<T>,
  {
    persist: persistOptions,
    serverSnapshot = 'initial',
  }: CreateStoreOptions<T> = {},
): StoreStateHook<T> => {
  const store = persistOptions
    ? createVanillaStore<T>()(
        persist(initializer, {
          ...persistOptions,
          ...(persistOptions.keys && {
            partialize: (state) => pick(state, persistOptions.keys!),
          }),
        }),
      )
    : createVanillaStore<T>()(initializer);

  // Shallow, so a selector returning a new array or object of the same
  // values gives the same snapshot, which `useSyncExternalStore` requires.
  const useInitialSnapshot = <U,>(
    keyOrSelector: keyof T | StoreSelector<T, U>,
  ) => useStore(store, useShallow(toSelector(keyOrSelector)));

  const useCurrentSnapshot = <U,>(
    keyOrSelector: keyof T | StoreSelector<T, U>,
  ) => {
    const selector = useShallow(toSelector(keyOrSelector));
    const getSnapshot = () => selector(store.getState());
    return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
  };

  const useStoreState =
    serverSnapshot === 'current' ? useCurrentSnapshot : useInitialSnapshot;

  return Object.assign(useStoreState, store) as StoreStateHook<T>;
};

/** `createStore` saved to storage under `name`; `keys` limits what is saved. */
export const createPersistentStore = <T extends object>(
  initializer: StateCreator<T>,
  name: string,
  keys?: readonly (keyof T)[],
) => createStore(initializer, { persist: { name, keys } });

export type StoreGetter<T> = {
  (): T;
  <const K extends keyof T>(key: K): T[K];
};

/**
 * Reads the store outside React: `get()` for the state, `get('key')` for one
 * field. It doesn't subscribe, so nothing re-renders when the state changes.
 */
export const utilifyStore = <T,>(store: Pick<StoreApi<T>, 'getState'>) =>
  ((key?: keyof T) =>
    key === undefined
      ? store.getState()
      : store.getState()[key]) as StoreGetter<T>;
