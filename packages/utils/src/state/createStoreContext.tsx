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

export const createStoreContext = <T,>(
  createStore: () => StoreStateHook<T>,
) => {
  const StoreContext = createContext<StoreContextProps<T> | null>(null);

  const createInstance = () => {
    const useStore = createStore();
    return { useStore, store: utilifyStore(useStore) };
  };

  const StoreProvider = ({ children }: { children: ReactNode }) => {
    // By reference: the React Compiler moves an inline initializer out of
    // this closure, where `createStore` isn't defined.
    const [{ useStore, store }] = useState(createInstance);

    return (
      <StoreContext.Provider value={{ useStore, store }}>
        {children}
      </StoreContext.Provider>
    );
  };

  const useStoreContext = () => {
    const context = useContext(StoreContext);
    if (!context)
      throw new Error('Store hooks must be used inside their StoreProvider');
    return context;
  };

  // `Parameters` of an overloaded type keeps only the last overload, so the
  // key form is restored by typing the hook as `StoreHook`.
  const useStore = ((...props: Parameters<StoreStateHook<T>>) => {
    return useStoreContext().useStore(...props);
  }) as StoreHook<T>;

  return [useStore, useStoreContext, StoreProvider] as const;
};
