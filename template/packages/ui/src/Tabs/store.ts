import { createStore, createStoreContext } from '@packages/utils/state';
import { isEqual } from 'lodash-es';

import type { TabEntry, TabItem, TabRenderables } from './Tabs.types';

type TabsStore = {
  /** A new array after each change to the tabs or their order. */
  tabs: TabItem[];
  renderablesOf: (id: string) => TabRenderables | undefined;
  setTab: (id: string, entry: TabEntry) => void;
  setTabRenderables: (id: string, renderables: TabRenderables) => void;
  removeTab: (id: string) => void;
  setOrder: (ids: string[]) => void;
};

const createTabsStore = () => {
  const entries = new Map<string, TabEntry>();
  const renderables = new Map<string, TabRenderables>();
  let order: string[] = [];

  const listTabs = () =>
    order.flatMap((id) => {
      const entry = entries.get(id);
      return entry ? [{ id, ...entry }] : [];
    });

  return createStore<TabsStore>(
    (set) => ({
      tabs: [],
      renderablesOf: (id) => renderables.get(id),
      setTab: (id, entry) => {
        entries.set(id, entry);
        set({ tabs: listTabs() });
      },
      setTabRenderables: (id, next) => {
        renderables.set(id, next);
        // Each trigger and panel selects its own: only changed ones re-render,
        // not the tab list.
        set({});
      },
      removeTab: (id) => {
        entries.delete(id);
        renderables.delete(id);
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
