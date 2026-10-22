import {
  createContext,
  type DependencyList,
  type ReactNode,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { UnknownRecord } from '../types';

/** The parts of a zustand store the sync hooks use. */
type SyncStore = {
  getInitialState(): UnknownRecord;
  setState(partial: UnknownRecord): void;
};

type ConfigSyncContextValue = {
  store: SyncStore;
  /** False until the owner's first commit is done. */
  mounted: boolean;
};

const ConfigSyncContext = createContext<ConfigSyncContextValue | null>(null);

/**
 * Config components render nothing: they write their props into the store of
 * the component they configure (the owner), which renders from that store.
 *
 * Gives config components the owner's store, and marks the owner mounted once
 * its first commit is done: a parent's layout effect runs after every child's.
 */
export const ConfigSyncProvider = ({
  useStore,
  children,
}: {
  /** The owner's store, e.g. `useStore` from its `createStoreContext` context. */
  useStore: SyncStore;
  children: ReactNode;
}) => {
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const value = useMemo(
    () => ({ store: useStore, mounted }),
    [useStore, mounted],
  );

  return (
    <ConfigSyncContext.Provider value={value}>
      {children}
    </ConfigSyncContext.Provider>
  );
};

export const useConfigSyncContext = () => {
  const context = useContext(ConfigSyncContext);
  if (!context)
    throw new Error('Config components must be rendered inside their owner');
  return context;
};

type SyncState = 'pending' | 'initialized' | 'synced';

/**
 * Runs `write` when `deps` change.
 *
 * - While the owner mounts: during render. Nothing subscribes yet, so the
 *   content rendered after the config components reads the values directly.
 * - After that: in a layout effect. Only subscribers of the changed values
 *   re-render, before the browser paints, and no component is updated while
 *   another one renders.
 *
 * `write` receives `true` for this component's first write.
 */
export const useStoreSync = (
  write: (initial: boolean) => void,
  deps: DependencyList,
) => {
  const { mounted } = useConfigSyncContext();
  const state = useRef<SyncState>('pending');

  if (state.current === 'pending' && !mounted) {
    write(true);
    state.current = 'initialized';
  }

  useLayoutEffect(() => {
    if (state.current !== 'initialized') write(state.current === 'pending');
    state.current = 'synced';
    // `deps` are the caller's; `write` reads the props of the same render.
  }, deps);
};

/**
 * Keeps `store[key]` equal to `config`, written again when one of its values
 * changes. On unmount, `store[key]` goes back to its initial value.
 *
 * The config's values are the deps, so each must be stable across renders:
 * pass callbacks through `usePersistentCallback` and memoize objects and
 * arrays, or the config is written again on every render.
 */
export const useConfigSync = (key: string, config: UnknownRecord) => {
  const { store } = useConfigSyncContext();

  useStoreSync(() => store.setState({ [key]: config }), Object.values(config));

  useLayoutEffect(
    () => () => store.setState({ [key]: store.getInitialState()[key] }),
    [store, key],
  );
};

/** Store action that takes a value from a config component's props. */
export type ApplyValue<V> = (value: V, initial: boolean) => void;

/**
 * Controlled/uncontrolled value: `value` is applied whenever it changes;
 * without it, `defaultValue` is applied once. `apply` learns whether this is
 * the first write, so later changes from outside can react to it.
 *
 * A controlled `value` that turns `undefined` applies nothing: the store keeps
 * the last value.
 */
export const useValueSync = <V,>(
  value: V | undefined,
  defaultValue: V | undefined,
  apply: ApplyValue<V>,
) =>
  useStoreSync(
    (initial) => {
      if (value !== undefined) apply(value, initial);
      else if (initial && defaultValue !== undefined) apply(defaultValue, true);
    },
    [value],
  );
