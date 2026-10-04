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

  const StoreProvider = ({ children }: { children: ReactNode }) => {
    const [{ useStore, store }] = useState(() => {
      const useStore = createStore();
      return { useStore, store: utilifyStore(useStore) };
    });

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
