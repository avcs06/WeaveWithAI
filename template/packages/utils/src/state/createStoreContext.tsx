import { createContext, ReactNode, useContext, useState } from 'react';

import {
  StoreGetter,
  StoreHook,
  StoreStateHook,
  utilifyStore,
} from './createStore';

type StoreContextProps<T> = {
  store: StoreGetter<T>;
  useStore: StoreStateHook<T>;
};

export const createStoreContext = <T, P extends object = object>(
  createStore: (props: P) => StoreStateHook<T>,
) => {
  const StoreContext = createContext<StoreContextProps<T> | null>(null);

  const createInstance = (props: P) => {
    const useStore = createStore(props);
    return { useStore, store: utilifyStore(useStore) };
  };

  /** Makes its store once, from the props of its first render. */
  const StoreProvider = (props: P & { children: ReactNode }) => {
    // Bound, not an inline arrow: React Compiler moves an inline initializer
    // out of this closure, where `createStore` isn't defined.
    const [instance] = useState(createInstance.bind(null, props));

    return <StoreContext value={instance}>{props.children}</StoreContext>;
  };

  const useStoreContext = () => {
    const context = useContext(StoreContext);
    if (!context)
      throw new Error('Store hooks must be used inside their StoreProvider');
    return context;
  };

  // `Parameters` of an overloaded type keeps only the last overload, so the
  // hook is typed `StoreHook` to restore the key form.
  const useStore = ((...props: Parameters<StoreStateHook<T>>) => {
    return useStoreContext().useStore(...props);
  }) as StoreHook<T>;

  return [useStore, useStoreContext, StoreProvider] as const;
};
