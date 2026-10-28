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
 * the component they configure (the owner), which renders from it.
 *
 * Gives config components the owner's store, and marks the owner mounted after
 * its first commit: a parent's layout effect runs after every child's.
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

  return <ConfigSyncContext value={value}>{children}</ConfigSyncContext>;
};

export const useConfigSyncContext = () => {
  const context = useContext(ConfigSyncContext);
  if (!context)
    throw new Error('Config components must be rendered inside their owner');
  return context;
};

type SyncState = 'pending' | 'initialized' | 'synced';

/**
 * Runs `write` when `deps` change, or after every render without them, as an
 * effect does: for values new on every render anyway, like elements. Keep
 * `deps` in a component that subscribes to what it writes, or each write
 * re-renders it and it writes again.
 *
 * - While the owner mounts: during render. Nothing subscribes yet, so content
 *   after the config components reads the values directly.
 * - After that: in a layout effect. Only subscribers of the changed values
 *   re-render, before paint, and no component updates during another's render.
 *
 * `write` receives `true` for this component's first write.
 */
export const useStoreSync = (
  write: (initial: boolean) => void,
  deps?: DependencyList,
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
 * Keeps `store[key]` equal to `config`, rewritten when a value changes. On
 * unmount, `store[key]` returns to its initial value.
 *
 * The config's values are the deps, so each must be stable: wrap callbacks in
 * `usePersistentCallback` and memoize objects and arrays, or the config is
 * rewritten every render.
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
 * Controlled/uncontrolled value: `value` is applied on every change; without
 * it, `defaultValue` is applied once. `apply` learns whether this is the first
 * write, so later outside changes can react to it.
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
