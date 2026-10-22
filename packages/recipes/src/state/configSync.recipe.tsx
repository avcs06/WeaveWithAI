/**
 * configSync: components that only collect config. They render nothing: they
 * write their props into the store of the component they configure (the
 * owner), which renders from it. For declarative APIs like
 * `<Table><TableColumn … /></Table>`, so the owner gets its children's
 * settings without reading React children. Pick the hook by what the config
 * is:
 * - `useConfigSync`: settings the owner only reads.
 * - `useValueSync`: a value the owner also changes, controlled or not.
 * - `useStoreSync`: any other write, like registering an item with an action.
 */
import { Button } from '@packages/ui/Button';
import { usePersistentCallback } from '@packages/utils/hooks';
import {
  type ApplyValue,
  ConfigSyncProvider,
  createStore,
  createStoreContext,
  useConfigSync,
  useStoreSync,
  useValueSync,
} from '@packages/utils/state';
import { type ReactNode, useLayoutEffect, useState } from 'react';

type Field = 'name' | 'date';
type Column = { field: Field; title: string };
type Sort = { field: Field; direction: 'asc' | 'desc' };

type EventList = {
  columns: Column[];
  setColumn: (column: Column) => void;
  removeColumn: (field: Field) => void;
  sort: Sort;
  sortConfig: { controlled: boolean; onChange?: (sort: Sort) => void };
  applySort: ApplyValue<Sort>;
  toggleSort: (field: Field) => void;
};

const events = [
  { name: 'Launch party', date: '2026-11-02' },
  { name: 'Community meetup', date: '2026-10-28' },
];

/** The owner keeps a store per instance, which its config components write. */
const [useEventList, useEventListContext, EventListStore] = createStoreContext(
  () =>
    createStore<EventList>(
      (set, get) => ({
        columns: [],
        setColumn: (column) =>
          set(({ columns }) => ({
            columns: [
              ...columns.filter(({ field }) => field !== column.field),
              column,
            ],
          })),
        removeColumn: (field) =>
          set(({ columns }) => ({
            columns: columns.filter((column) => column.field !== field),
          })),
        sort: { field: 'date', direction: 'asc' },
        sortConfig: { controlled: false },
        applySort: (sort) => set({ sort }),
        // Controlled, the new sort waits for the parent to pass it back.
        toggleSort: (field) => {
          const { sort, sortConfig } = get();
          const ascending = sort.field !== field || sort.direction === 'desc';
          const next: Sort = { field, direction: ascending ? 'asc' : 'desc' };

          if (!sortConfig.controlled) set({ sort: next });
          sortConfig.onChange?.(next);
        },
      }),
      // The server render reads what the config components wrote, not the
      // initial state.
      { serverSnapshot: 'current' },
    ),
);

/**
 * `useStoreSync`: any write, here an action that registers a column, written
 * again when `field` or `title` change. Undo it on unmount yourself.
 */
const EventColumn = ({ field, title }: Column) => {
  const { store } = useEventListContext();

  useStoreSync(() => store('setColumn')({ field, title }), [field, title]);
  useLayoutEffect(() => () => store('removeColumn')(field), [store, field]);

  return null;
};

type EventSortProps = {
  value?: Sort;
  defaultValue?: Sort;
  onChange?: (sort: Sort) => void;
};

/**
 * `useValueSync`: a value the owner also changes. `value` is applied whenever
 * it changes; without it, `defaultValue` is applied once. `useConfigSync`:
 * settings the owner only reads, put back to their initial values on
 * unmount. Its values are deps, so the callback is made stable.
 */
const EventSort = ({ value, defaultValue, onChange }: EventSortProps) => {
  const { store } = useEventListContext();
  const stableOnChange = usePersistentCallback(onChange);

  useConfigSync('sortConfig', {
    controlled: value !== undefined,
    onChange: stableOnChange,
  });
  useValueSync(value, defaultValue, store('applySort'));

  return null;
};

const EventRows = () => {
  const columns = useEventList('columns');
  const { field, direction } = useEventList('sort');
  const toggleSort = useEventList('toggleSort');

  const order = direction === 'asc' ? 1 : -1;
  const sorted = [...events].sort(
    (a, b) => a[field].localeCompare(b[field]) * order,
  );

  return (
    <div className="flex-col-gap-2">
      <div className="flex-row-gap-2">
        {columns.map((column) => (
          <Button
            key={column.field}
            variant="base"
            look="ghost"
            onClick={() => toggleSort(column.field)}
          >
            {column.title}
          </Button>
        ))}
      </div>
      <ul>
        {sorted.map((event) => (
          <li key={event.name}>
            {columns.map((column) => event[column.field]).join(' · ')}
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * Config components go before the content: while the owner mounts they write
 * during render, so the content's first render already reads their values.
 */
const EventListContent = ({ children }: { children: ReactNode }) => {
  const { useStore } = useEventListContext();
  return (
    <ConfigSyncProvider useStore={useStore}>
      {children}
      <EventRows />
    </ConfigSyncProvider>
  );
};

const EventListView = ({ children }: { children: ReactNode }) => (
  <EventListStore>
    <EventListContent>{children}</EventListContent>
  </EventListStore>
);

/** Uncontrolled: starts from `defaultValue`, then the owner keeps the sort. */
const UncontrolledSort = () => (
  <EventListView>
    <EventColumn field="name" title="Name" />
    <EventColumn field="date" title="Date" />
    <EventSort defaultValue={{ field: 'name', direction: 'desc' }} />
  </EventListView>
);

/** Controlled: the sort lives in the parent, which `onChange` tells. */
const ControlledSort = () => {
  const [sort, setSort] = useState<Sort>({ field: 'date', direction: 'asc' });
  return (
    <EventListView>
      <EventColumn field="name" title="Name" />
      <EventColumn field="date" title="Date" />
      <EventSort value={sort} onChange={setSort} />
    </EventListView>
  );
};

export default function ConfigSyncRecipe() {
  return (
    <div className="flex-col-gap-6">
      <UncontrolledSort />
      <ControlledSort />
    </div>
  );
}
