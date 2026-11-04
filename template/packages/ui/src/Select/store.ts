import { createStore, createStoreContext } from '@packages/utils/state';
import { isEqual } from 'lodash-es';

import type {
  SelectOptionData,
  SelectOptionEntry,
  SelectOptionItem,
} from './Select.types';
import type { ReactNode } from 'react';

/** The options as a render reads them; `options` is built on first read. */
type SelectOptionsView = {
  options: SelectOptionItem[];
  /** A value no option has described shows as itself. */
  getOptionData: (value: string) => SelectOptionData;
};

type SelectStore = {
  /** A new object after each change to the options or their order. */
  view: SelectOptionsView;
  contentOf: (id: string) => ReactNode;
  setOption: (id: string, entry: SelectOptionEntry) => void;
  setOptionContent: (id: string, content: ReactNode) => void;
  removeOption: (id: string) => void;
  setOrder: (ids: string[]) => void;
  /** Drops the data of values that are neither listed nor selected. */
  forget: (selected: readonly string[]) => void;
};

const createSelectStore = () => {
  // Written in place: an option's write costs the same however many there
  // are. Renders read them through a view, never these maps.
  const entries = new Map<string, SelectOptionEntry>();
  const contents = new Map<string, ReactNode>();
  // A selected value keeps its label after its option goes.
  const known = new Map<string, SelectOptionData>();
  let order: string[] = [];

  const createView = (): SelectOptionsView => {
    let options: SelectOptionItem[] | undefined;
    return {
      get options() {
        options ??= order.flatMap((id) => {
          const entry = entries.get(id);
          return entry ? [{ id, ...entry }] : [];
        });
        return options;
      },
      getOptionData: (value) => known.get(value) ?? { value, label: value },
    };
  };

  return createStore<SelectStore>(
    (set) => ({
      view: createView(),
      contentOf: (id) => contents.get(id),
      setOption: (id, entry) => {
        entries.set(id, entry);
        known.set(entry.data.value, entry.data);
        set({ view: createView() });
      },
      setOptionContent: (id, content) => {
        contents.set(id, content);
        // Each row selects its own content: only the changed one re-renders.
        set({});
      },
      removeOption: (id) => {
        entries.delete(id);
        contents.delete(id);
        set({ view: createView() });
      },
      setOrder: (ids) => {
        if (isEqual(ids, order)) return;
        order = ids;
        set({ view: createView() });
      },
      forget: (selected) => {
        const needed = new Set(selected);
        for (const { data } of entries.values()) needed.add(data.value);
        for (const value of known.keys()) {
          if (!needed.has(value)) known.delete(value);
        }
      },
    }),
    { serverSnapshot: 'current' },
  );
};

export const [useSelectStore, useSelectStoreContext, SelectStoreProvider] =
  createStoreContext(createSelectStore);

export const useSelectOptions = () => useSelectStore('view');
