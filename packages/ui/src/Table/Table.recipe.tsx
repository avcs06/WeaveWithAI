/**
 * Table: rows of records to scan, sort, filter and act on. Configure it with
 * parts as children (columns, sort, filter, selection, pagination…). Give every
 * column a `width`: on narrow screens the table then scrolls sideways inside
 * itself. For thousands of rows, add `virtualized` and give the container a
 * fixed height (in a .css.ts); server data loaded as the user scrolls uses
 * Table.InfiniteScroll in place of Table.Pagination.
 */
import { Avatar } from '@packages/ui/Avatar';
import { IconButton } from '@packages/ui/Button';
import { Dropdown } from '@packages/ui/Dropdown';
import {
  Table,
  type TableFilterValue,
  type TablePaginationValue,
  type TableRowKey,
  type TableRowReorderEvent,
  type TableSortValue,
} from '@packages/ui/Table';
import { Truncate } from '@packages/ui/Truncate';
import { Ellipsis, Pencil, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

type Event = {
  id: string;
  name: string;
  organizer: string;
  ticketPrice: number;
  date: string;
};

const events: Event[] = [
  {
    id: 'design-meetup',
    name: 'Design systems meetup',
    organizer: 'Lena Fischer',
    ticketPrice: 25,
    date: '2026-11-14',
  },
  {
    id: 'launch',
    name: 'Product launch keynote',
    organizer: 'Omar Haddad',
    ticketPrice: 120,
    date: '2026-10-30',
  },
  {
    id: 'frontend-summit',
    name: 'Frontend summit',
    organizer: 'Lena Fischer',
    ticketPrice: 64,
    date: '2026-12-05',
  },
  {
    id: 'data-night',
    name: 'Data night',
    organizer: 'Sofia Marquez',
    ticketPrice: 15,
    date: '2027-03-06',
  },
];

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

/**
 * Client data (everything loaded): the table sorts, filters and pages by
 * itself.
 * - `sortable` and `filter` (`text`, `enum` with `options`, `number`) per
 *   column; Table.Sort's `defaultValue` sets the first sort.
 * - Render a cell with `children`. When a column should sort and filter by
 *   something other than the raw value (a name for an id), return it from
 *   `computed`.
 * - Keep Table.Selection controlled to act on the selected rows.
 * - Row actions go in a last column as an IconButton menu; menu clicks never
 *   trigger `onRowClick`.
 * - Table.Pagination shows every page control; `size="minimal"` shows fewer,
 *   and `content="icons"` uses icons for their labels.
 */
const ClientTable = () => {
  const [selected, setSelected] = useState<TableRowKey[]>([]);
  const [opened, setOpened] = useState<string>();

  return (
    <div className="flex-col-gap-3">
      <span>{opened ? `Opened ${opened}` : `${selected.length} selected`}</span>
      <Table
        caption="Events"
        data={events}
        rowKey={(event) => event.id}
        emptyMessage="No events match the filters."
        onRowClick={(event) => setOpened(event.name)}
      >
        <Table.Sort defaultValue={{ columnId: 'date', direction: 'asc' }} />
        <Table.Selection value={selected} onChange={setSelected} />
        <Table.Column<Event>
          id="name"
          title="Name"
          dataKey="name"
          width={220}
          sortable
          filter={{ type: 'text' }}
        />
        <Table.Column<Event>
          id="organizer"
          title="Organizer"
          dataKey="organizer"
          width={180}
          sortable
          filter={{
            type: 'enum',
            options: ['Lena Fischer', 'Omar Haddad', 'Sofia Marquez'].map(
              (organizer) => ({ label: organizer, value: organizer }),
            ),
          }}
        >
          {(organizer) => (
            <div className="flex-row-gap-2 items-center min-w-0">
              <Avatar size="sm" name={organizer} />
              <Truncate>{organizer}</Truncate>
            </div>
          )}
        </Table.Column>
        <Table.Column<Event>
          id="ticketPrice"
          title="Ticket price"
          dataKey="ticketPrice"
          width={120}
          align="right"
          sortable
          filter={{ type: 'number' }}
        >
          {(ticketPrice) => currency.format(ticketPrice)}
        </Table.Column>
        <Table.Column<Event>
          id="date"
          title="Date"
          dataKey="date"
          width={130}
          sortable
        />
        <Table.Column<Event>
          id="actions"
          title={<span className="sr-only">Actions</span>}
          width={48}
          align="right"
        >
          {(_, event) => (
            <Dropdown
              items={[
                {
                  key: 'edit',
                  type: 'option',
                  label: 'Edit',
                  icon: <Pencil />,
                  onSelect: () => setOpened(event.name),
                },
                {
                  key: 'delete',
                  type: 'option',
                  label: 'Delete',
                  icon: <Trash2 />,
                },
              ]}
            >
              <IconButton
                size="xs"
                variant="ghost"
                aria-label={`Actions for ${event.name}`}
              >
                <Ellipsis />
              </IconButton>
            </Dropdown>
          )}
        </Table.Column>
        <Table.Pagination pageSizeOptions={[5, 10, 20]} />
      </Table>
    </div>
  );
};

type Query = {
  sort: TableSortValue;
  filters: TableFilterValue;
  page: TablePaginationValue;
};

/** Stands in for the API: takes the query, returns one page and the total. */
const fetchEvents = ({ sort, filters, page }: Query) => {
  const name = filters['name'];
  const matching = events.filter(
    (event) =>
      name?.type !== 'text' ||
      event.name.toLowerCase().includes(name.contains.toLowerCase()),
  );
  if (sort) {
    const key = sort.columnId as keyof Event;
    matching.sort(
      (a, b) =>
        String(a[key]).localeCompare(String(b[key]), undefined, {
          numeric: true,
        }) * (sort.direction === 'asc' ? 1 : -1),
    );
  }
  const start = page.pageIndex * page.pageSize;
  return {
    rows: matching.slice(start, start + page.pageSize),
    total: matching.length,
  };
};

/**
 * Server data (too much to load at once): `mode="server"` makes every part
 * only report changes. Keep sort, filter and page in state, query the API
 * when they change, pass back the rows and `totalItems`, and set `loading`
 * while waiting.
 */
const ServerTable = () => {
  const [sort, setSort] = useState<TableSortValue>(null);
  const [filters, setFilters] = useState<TableFilterValue>({});
  const [page, setPage] = useState<TablePaginationValue>({
    pageIndex: 0,
    pageSize: 5,
  });
  const [result, setResult] = useState({ rows: [] as Event[], total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setResult(fetchEvents({ sort, filters, page }));
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [sort, filters, page]);

  return (
    <Table
      mode="server"
      caption="Events"
      data={result.rows}
      rowKey={(event) => event.id}
      loading={loading}
    >
      <Table.Sort value={sort} onChange={setSort} />
      <Table.Filter value={filters} onChange={setFilters} />
      <Table.Column<Event>
        id="name"
        title="Name"
        dataKey="name"
        width={220}
        sortable
        filter={{ type: 'text' }}
      />
      <Table.Column<Event>
        id="date"
        title="Date"
        dataKey="date"
        width={130}
        sortable
      />
      <Table.Pagination
        value={page}
        onChange={setPage}
        pageSizeOptions={[5, 10, 20]}
        totalItems={result.total}
      />
    </Table>
  );
};

/**
 * Details on demand: Table.Expansion renders a row's details under it; a row
 * click expands it too.
 */
const ExpandableRows = () => (
  <Table caption="Events" data={events} rowKey={(event) => event.id}>
    <Table.Expansion>
      {(event: Event) => (
        <p>
          {event.organizer} hosts {event.name} on {event.date}.
        </p>
      )}
    </Table.Expansion>
    <Table.Column<Event> id="name" title="Name" dataKey="name" width={220} />
    <Table.Column<Event>
      id="organizer"
      title="Organizer"
      dataKey="organizer"
      width={180}
    />
  </Table>
);

/**
 * A user-defined order (an agenda, steps): Table.Reorder adds drag handles
 * and reports the reordered rows; the table never changes `data` itself.
 */
const ReorderableRows = () => {
  const [rows, setRows] = useState(events);
  return (
    <Table caption="Agenda" data={rows} rowKey={(event) => event.id}>
      <Table.Reorder
        onReorder={({ rows: next }: TableRowReorderEvent<Event>) =>
          setRows(next)
        }
      />
      <Table.Column<Event>
        id="name"
        title="Name"
        dataKey="name"
        width={220}
      />
      <Table.Column<Event>
        id="organizer"
        title="Organizer"
        dataKey="organizer"
        width={180}
      />
    </Table>
  );
};

export default function TableRecipe() {
  return (
    <div className="flex-col-gap-8">
      <ClientTable />
      <ServerTable />
      <ExpandableRows />
      <ReorderableRows />
    </div>
  );
}
