import { createStore, createStoreContext } from '@packages/utils/state';
import { isEqual } from 'lodash-es';

import type { TabEntry, TabItem } from './Tabs.types';
import type { ReactNode } from 'react';

type TabsStore = {
  /** A new array after each change to the tabs or their order. */
  tabs: TabItem[];
  contentOf: (id: string) => ReactNode;
  setTab: (id: string, entry: TabEntry) => void;
  setTabContent: (id: string, content: ReactNode) => void;
  removeTab: (id: string) => void;
  setOrder: (ids: string[]) => void;
};

const createTabsStore = () => {
  const entries = new Map<string, TabEntry>();
  const contents = new Map<string, ReactNode>();
  let order: string[] = [];

  const listTabs = () =>
    order.flatMap((id) => {
      const entry = entries.get(id);
      return entry ? [{ id, ...entry }] : [];
    });

  return createStore<TabsStore>(
    (set) => ({
      tabs: [],
      contentOf: (id) => contents.get(id),
      setTab: (id, entry) => {
        entries.set(id, entry);
        set({ tabs: listTabs() });
      },
      setTabContent: (id, content) => {
        contents.set(id, content);
        // Each panel selects its own content: only the changed one re-renders.
        set({});
      },
      removeTab: (id) => {
        entries.delete(id);
        contents.delete(id);
        set({ tabs: listTabs() });
      },
      setOrder: (ids) => {
        if (isEqual(ids, order)) return;
        order = ids;
        set({ tabs: listTabs() });
      },
    }),
    { serverSnapshot: 'current' },
  );
};

export const [useTabsStore, useTabsStoreContext, TabsStoreProvider] =
  createStoreContext(createTabsStore);
