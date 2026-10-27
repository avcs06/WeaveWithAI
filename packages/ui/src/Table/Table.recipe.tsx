/**
 * Table: rows of records to scan, sort, filter, select and act on. Configure
 * it with parts as children: a `Table.Column` per column, in the order they
 * render, plus the features it needs (`Table.Selection`, `Table.Expansion`,
 * `Table.Reorder`, `Table.Pagination` or `Table.InfiniteScroll`). Sorting and
 * filtering work from a column's `sortable` and `filter` alone: add
 * `Table.Sort` or `Table.Filter` only to set a default or to control the
 * value. Give every column a `width`: on narrow screens the table then
 * scrolls sideways inside itself.
 *
 * Not for one record's fields as label and value pairs (lay them out as a
 * list of labels and values), nor for items people browse by picture (use a
 * grid of `Card`s).
 *
 * Pitfalls:
 * - Call `createTable<Row>()` once at module scope, beside the row type, not
 *   inside a component: React's static-components check rejects a component
 *   made during render, though this one returns `Table` itself.
 * - Mark the column that names each row `rowHeader`, like the attendee's
 *   name: screen readers read it with every cell of the row, and it names
 *   the row's checkbox, details and drag handle.
 * - `onRowClick` is a pointer shortcut only. Keyboard and screen-reader users
 *   can't click a row, so the same action must be a `Link` or button in the
 *   row. With `Table.Expansion`, `onRowClick` is ignored: a row click expands
 *   the row.
 * - `mode="server"` needs `totalItems` on `Table.Pagination`, or there is
 *   only one page. `Table.Pagination` with `Table.InfiniteScroll` throws.
 * - `Table.InfiniteScroll` loads once per `data` array: keep `data` the same
 *   array until rows are added.
 * - `Table.Reorder` is off while a sort is active, and moves rows within the
 *   rendered page only.
 * - The header checkbox selects every filtered row on every page in client
 *   mode, but only the loaded rows in server mode.
 * - `virtualized` needs a container with a fixed height.
 * - `computed` is compared by reference. An inline function re-sorts and
 *   re-filters on every render without the React Compiler: define it outside
 *   the component or memoize it.
 * - A cell shows its raw value: format dates and money in `children`, and
 *   keep `dataKey` on the raw value so the column sorts by it.
 */
import { Avatar } from '@packages/ui/Avatar';
import { Button, IconButton } from '@packages/ui/Button';
import { Dropdown } from '@packages/ui/Dropdown';
import { SearchInput } from '@packages/ui/Input';
import { Link } from '@packages/ui/Link';
import { Select, SelectOption } from '@packages/ui/Select';
import {
  createTable,
  type TableFilterOption,
  type TableFilterValue,
  type TablePaginationValue,
  type TableRowKey,
  type TableSortValue,
} from '@packages/ui/Table';
import { Tag, type TagProps } from '@packages/ui/Tag';
import { Truncate } from '@packages/ui/Truncate';
import { Ban, Ellipsis, Link2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { tablePanel } from './Table.recipe.css';

// Setup: stand-ins for your app's data and requests, not part of the pattern.
const events: EventRow[] = [
  {
    id: 'design-meetup',
    name: 'Design systems meetup',
    organizer: 'Lena Fischer',
    venue: 'Harbor Hall',
    ticketPrice: 25,
    capacity: 120,
    ticketsSold: 96,
    date: '2026-11-14',
    status: 'On sale',
  },
  {
    id: 'launch-keynote',
    name: 'Product launch keynote',
    organizer: 'Omar Haddad',
    venue: 'Grand Theatre',
    ticketPrice: 120,
    capacity: 800,
    ticketsSold: 800,
    date: '2026-10-30',
    status: 'Sold out',
  },
  {
    id: 'frontend-summit',
    name: 'Frontend summit',
    organizer: 'Lena Fischer',
    venue: 'Riverside Center',
    ticketPrice: 64,
    capacity: 450,
    ticketsSold: 310,
    date: '2026-12-05',
    status: 'On sale',
  },
  {
    id: 'data-night',
    name: 'Data night',
    organizer: 'Sofia Marquez',
    venue: 'The Loft',
    ticketPrice: 15,
    capacity: 60,
    ticketsSold: 0,
    date: '2027-03-06',
    status: 'Draft',
  },
  {
    id: 'ux-writing',
    name: 'UX writing workshop',
    organizer: 'Sofia Marquez',
    venue: 'Harbor Hall',
    ticketPrice: 80,
    capacity: 30,
    ticketsSold: 30,
    date: '2026-11-21',
    status: 'Sold out',
  },
  {
    id: 'founders-breakfast',
    name: 'Founders breakfast',
    organizer: 'Omar Haddad',
    venue: 'The Loft',
    ticketPrice: 40,
    capacity: 50,
    ticketsSold: 12,
    date: '2026-12-12',
    status: 'On sale',
  },
  {
    id: 'accessibility-day',
    name: 'Accessibility day',
    organizer: 'Lena Fischer',
    venue: 'Riverside Center',
    ticketPrice: 0,
    capacity: 200,
    ticketsSold: 154,
    date: '2027-01-18',
    status: 'On sale',
  },
];

const attendees: Attendee[] = [
  {
    id: 'ada',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    ticket: 'Speaker',
    status: 'Registered',
  },
  {
    id: 'grace',
    name: 'Grace Hopper',
    email: 'grace@example.com',
    ticket: 'VIP',
    status: 'Checked in',
  },
  {
    id: 'alan',
    name: 'Alan Turing',
    email: 'alan@example.com',
    ticket: 'General',
    status: 'Registered',
  },
  {
    id: 'katherine',
    name: 'Katherine Johnson',
    email: 'katherine@example.com',
    ticket: 'General',
    status: 'Cancelled',
  },
  {
    id: 'margaret',
    name: 'Margaret Hamilton',
    email: 'margaret@example.com',
    ticket: 'VIP',
    status: 'Registered',
  },
];

const ticketOptions: TableFilterOption[] = (
  ['General', 'VIP', 'Speaker'] as const
).map((ticket) => ({ label: ticket, value: ticket }));

// Built from the index, not at random, so the server and the browser agree.
const firstNames = ['Ada', 'Grace', 'Alan', 'Katherine', 'Margaret', 'Linus'];
const lastNames = ['Okafor', 'Lindqvist', 'Moreau', 'Tanaka', 'Silva'];
const manyAttendees: Attendee[] = Array.from({ length: 2000 }, (_, index) => {
  const first = firstNames[index % firstNames.length];
  const last = lastNames[Math.floor(index / firstNames.length) % 5];
  return {
    id: `attendee-${index}`,
    name: `${first} ${last} ${index + 1}`,
    email: `${first.toLowerCase()}.${index + 1}@example.com`,
    ticket: ticketOptions[index % 3].value as Attendee['ticket'],
    status: 'Registered',
  };
});

const sessions: Session[] = [
  {
    id: 'opening-keynote',
    title: 'Opening keynote',
    room: 'Main stage',
    startsAt: '09:00',
    status: 'Confirmed',
    speakers: ['Omar Haddad'],
    abstract: 'Where events are heading, and what we built this year.',
  },
  {
    id: 'tokens-talk',
    title: 'Design tokens at scale',
    room: 'Room A',
    startsAt: '10:30',
    status: 'Confirmed',
    speakers: ['Lena Fischer', 'Ada Lovelace'],
    abstract: 'Naming, theming and shipping tokens to five platforms.',
    conflict: 'Lena Fischer also hosts the 10:30 panel in Room B.',
  },
  {
    id: 'hosting-panel',
    title: 'Hosting hybrid events',
    room: 'Room B',
    startsAt: '10:30',
    status: 'In review',
    speakers: ['Lena Fischer', 'Sofia Marquez'],
    abstract: 'Running one event for the room and the stream at once.',
    conflict: 'Lena Fischer also speaks at 10:30 in Room A.',
  },
  {
    id: 'lunch',
    title: 'Lunch',
    room: 'Atrium',
    startsAt: '12:30',
    status: 'Confirmed',
    speakers: [],
  },
];

/** Stands in for your API: saves the attendee's agenda. */
const saveAgenda = async (sessionIds: TableRowKey[]) => sessionIds;

const questions: Question[] = [
  {
    id: 'name',
    question: 'Full name',
    answer: 'Text',
    required: true,
    locked: true,
  },
  {
    id: 'email',
    question: 'Email',
    answer: 'Email',
    required: true,
    locked: true,
  },
  {
    id: 'dietary',
    question: 'Dietary needs',
    answer: 'Choice',
    required: false,
    locked: false,
  },
  {
    id: 'company',
    question: 'Company',
    answer: 'Text',
    required: false,
    locked: false,
  },
  {
    id: 'newsletter',
    question: 'Send me event news',
    answer: 'Checkbox',
    required: false,
    locked: false,
  },
];

const orders: Order[] = Array.from({ length: 24 }, (_, index) => ({
  id: `order-${1040 - index}`,
  buyer: `${firstNames[index % firstNames.length]} ${lastNames[index % 5]}`,
  event: events[index % events.length].name,
  tickets: 1 + (index % 4),
}));

const allVenues: Venue[] = [
  { id: 'harbor', name: 'Harbor Hall', city: 'Hamburg', capacity: 120 },
  { id: 'grand', name: 'Grand Theatre', city: 'Lisbon', capacity: 800 },
  { id: 'riverside', name: 'Riverside Center', city: 'Lyon', capacity: 450 },
  { id: 'loft', name: 'The Loft', city: 'Austin', capacity: 60 },
];

/** Stands in for your API: every venue, after a delay. */
const fetchVenues = () =>
  new Promise<Venue[]>((resolve) => setTimeout(() => resolve(allVenues), 600));

/** Stands in for your API: one page of the events matching the query. */
const fetchEvents = ({ sort, filters, page }: EventQuery) =>
  new Promise<EventPage>((resolve) =>
    setTimeout(() => {
      const matching = events.filter((event) =>
        Object.entries(filters).every(([columnId, filter]) => {
          const value = event[columnId as keyof EventRow];
          if (filter.type === 'text')
            return String(value)
              .toLowerCase()
              .includes(filter.contains.toLowerCase());
          if (filter.type === 'enum') return filter.in.includes(String(value));
          return (
            (filter.eq === undefined || Number(value) === filter.eq) &&
            (filter.lt === undefined || Number(value) < filter.lt) &&
            (filter.gt === undefined || Number(value) > filter.gt)
          );
        }),
      );

      if (sort) {
        const key = sort.columnId as keyof EventRow;
        const direction = sort.direction === 'asc' ? 1 : -1;
        matching.sort(
          (a, b) =>
            String(a[key]).localeCompare(String(b[key]), 'en-US', {
              numeric: true,
            }) * direction,
        );
      }

      const start = page.pageIndex * page.pageSize;
      resolve({
        rows: matching.slice(start, start + page.pageSize),
        total: matching.length,
        unfilteredTotal: events.length,
      });
    }, 400),
  );

/** Stands in for your API: `limit` attendees from `offset`, and the total. */
const fetchAttendees = (offset: number, limit: number) =>
  new Promise<{ rows: Attendee[]; total: number }>((resolve) =>
    setTimeout(
      () =>
        resolve({
          rows: manyAttendees.slice(offset, offset + limit),
          total: manyAttendees.length,
        }),
      400,
    ),
  );

// Usage: the patterns to copy.
type EventStatus = 'On sale' | 'Sold out' | 'Draft' | 'Cancelled';

type EventRow = {
  id: string;
  name: string;
  organizer: string;
  venue: string;
  ticketPrice: number;
  capacity: number;
  ticketsSold: number;
  /** ISO day, which sorts in date order. */
  date: string;
  status: EventStatus;
};

const organizerOptions: TableFilterOption[] = [
  ...new Set(events.map((event) => event.organizer)),
].map((organizer) => ({ label: organizer, value: organizer }));

const statusOptions: TableFilterOption[] = (
  ['On sale', 'Sold out', 'Draft', 'Cancelled'] as const
).map((status) => ({ label: status, value: status }));

const statusTag: Record<EventStatus, TagProps['variant']> = {
  'On sale': 'success',
  'Sold out': 'warning',
  Draft: 'base',
  Cancelled: 'error',
};

// Fixed locale and time zone: the server and the browser render the same text.
const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const day = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeZone: 'UTC',
});

type Attendee = {
  id: string;
  name: string;
  email: string;
  ticket: 'General' | 'VIP' | 'Speaker';
  status: 'Registered' | 'Checked in' | 'Cancelled';
};

type Session = {
  id: string;
  title: string;
  room: string;
  startsAt: string;
  status: 'Confirmed' | 'In review';
  speakers: string[];
  abstract?: string;
  conflict?: string;
};

type Question = {
  id: string;
  question: string;
  answer: 'Text' | 'Email' | 'Choice' | 'Checkbox';
  required: boolean;
  /** Name and email always come first. */
  locked: boolean;
};

type Order = { id: string; buyer: string; event: string; tickets: number };

type Venue = { id: string; name: string; city: string; capacity: number };

type EventQuery = {
  sort: TableSortValue;
  filters: TableFilterValue;
  page: TablePaginationValue;
};

type EventPage = { rows: EventRow[]; total: number; unfilteredTotal: number };

const EventTable = createTable<EventRow>();
const AttendeeTable = createTable<Attendee>();
const SessionTable = createTable<Session>();
const QuestionTable = createTable<Question>();
const OrderTable = createTable<Order>();
const VenueTable = createTable<Venue>();

/**
 * Everything loaded at once (client mode): the table sorts, filters and pages
 * by itself.
 * - `sortable` and `filter` (`text`, `enum` with `options`, `number`) per
 *   column; `Table.Sort defaultValue` sets the first sort.
 * - `children` renders a cell: a date formatted for people, while `dataKey`
 *   keeps the ISO day the column sorts by.
 * - The name is a `Link`, so every user can open the event; `onRowClick`
 *   follows that same link for a click anywhere on the row.
 * - Row actions sit in a last column, in a Dropdown on an IconButton named
 *   after the row. A click inside the menu never reaches `onRowClick`.
 */
const EventsTable = () => {
  const [rows, setRows] = useState(events);

  const cancel = (id: string) =>
    setRows(
      rows.map((event) =>
        event.id === id ? { ...event, status: 'Cancelled' } : event,
      ),
    );

  return (
    <EventTable
      caption="Events"
      data={rows}
      rowKey={(event) => event.id}
      emptyMessage="No events match the filters."
      onRowClick={(_, click) => click.currentTarget.querySelector('a')?.click()}
    >
      <EventTable.Sort defaultValue={{ columnId: 'date', direction: 'asc' }} />
      <EventTable.Column
        id="name"
        rowHeader
        title="Name"
        dataKey="name"
        width={220}
        sortable
        filter={{ type: 'text' }}
      >
        {(name, event) => <Link href={`/events/${event.id}`}>{name}</Link>}
      </EventTable.Column>
      <EventTable.Column
        id="organizer"
        title="Organizer"
        dataKey="organizer"
        width={180}
        sortable
        filter={{ type: 'enum', options: organizerOptions }}
      >
        {(organizer) => (
          <div className="flex-row-gap-2 items-center min-w-0">
            <Avatar size="sm" name={organizer} />
            <Truncate>{organizer}</Truncate>
          </div>
        )}
      </EventTable.Column>
      <EventTable.Column
        id="ticketPrice"
        title="Ticket price"
        dataKey="ticketPrice"
        width={130}
        align="right"
        sortable
        filter={{ type: 'number' }}
      >
        {(ticketPrice) => currency.format(ticketPrice)}
      </EventTable.Column>
      <EventTable.Column
        id="date"
        title="Date"
        dataKey="date"
        width={130}
        sortable
      >
        {(date) => day.format(new Date(date))}
      </EventTable.Column>
      <EventTable.Column
        id="status"
        title="Status"
        dataKey="status"
        width={120}
      >
        {(status) => (
          <Tag size="xs" variant={statusTag[status]}>
            {status}
          </Tag>
        )}
      </EventTable.Column>
      <EventTable.Column
        id="actions"
        title={<span className="sr-only">Actions</span>}
        width={48}
        align="right"
      >
        {(_, event) => (
          <Dropdown
            menu={
              <>
                <Dropdown.Item
                  leftIcon={<Link2 />}
                  onSelect={() =>
                    navigator.clipboard.writeText(
                      `${window.location.origin}/events/${event.id}`,
                    )
                  }
                >
                  Copy link
                </Dropdown.Item>
                <Dropdown.Item
                  leftIcon={<Ban />}
                  disabledWithReason={
                    event.status === 'Cancelled'
                      ? 'This event is already cancelled'
                      : undefined
                  }
                  onSelect={() => cancel(event.id)}
                >
                  Cancel event
                </Dropdown.Item>
              </>
            }
          >
            <IconButton
              size="xs"
              variant="base"
              look="ghost"
              tooltip="Actions"
              aria-label={`Actions for ${event.name}`}
            >
              <Ellipsis />
            </IconButton>
          </Dropdown>
        )}
      </EventTable.Column>
      <EventTable.Pagination pageSizeOptions={[5, 10, 20]} />
    </EventTable>
  );
};

const seatsLeft = (_: unknown, event: EventRow) =>
  event.capacity - event.ticketsSold;

/**
 * A value the data doesn't hold: `computed(value, row)` derives it, and the
 * column sorts, filters and renders by it. Define `computed` outside the
 * component, as `seatsLeft` is; the column takes its value type from it.
 * `Table.Filter defaultValue` opens the table already filtered, and
 * the user can change it from the column's filter.
 */
const SeatsLeft = () => (
  <EventTable caption="Seats left" data={events} rowKey={(event) => event.id}>
    <EventTable.Filter
      defaultValue={{ status: { type: 'enum', in: ['On sale'] } }}
    />
    <EventTable.Column
      id="name"
      rowHeader
      title="Event"
      dataKey="name"
      width={220}
      sortable
    />
    <EventTable.Column
      id="seatsLeft"
      title="Seats left"
      computed={seatsLeft}
      width={120}
      align="right"
      sortable
      filter={{ type: 'number' }}
    />
    <EventTable.Column
      id="status"
      title="Status"
      dataKey="status"
      width={140}
      filter={{ type: 'enum', options: statusOptions }}
    >
      {(status) => (
        <Tag size="xs" variant={statusTag[status]}>
          {status}
        </Tag>
      )}
    </EventTable.Column>
  </EventTable>
);

/**
 * One search box for the whole table: filter `data` yourself, above the
 * table. A column's `filter` searches one column; this one searches several.
 * `emptyMessage` says why no rows show.
 */
const SearchEvents = () => {
  const [search, setSearch] = useState('');

  const query = search.trim().toLowerCase();
  const matching = events.filter((event) =>
    [event.name, event.venue].some((text) =>
      text.toLowerCase().includes(query),
    ),
  );

  return (
    <div className="flex-col-gap-3">
      <SearchInput
        label="Search events"
        placeholder="Name or venue"
        value={search}
        onChange={setSearch}
      />
      <EventTable
        caption="Events"
        data={matching}
        rowKey={(event) => event.id}
        emptyMessage={`No events match “${search}”.`}
      >
        <EventTable.Column
          id="name"
          rowHeader
          title="Name"
          dataKey="name"
          width={220}
        />
        <EventTable.Column
          id="venue"
          title="Venue"
          dataKey="venue"
          width={180}
        />
      </EventTable>
    </div>
  );
};

/**
 * Columns that depend on a view, a role or a setting: render `Table.Column`
 * conditionally. Columns show in the order they render.
 */
const EventViews = () => {
  const [view, setView] = useState('sales');

  return (
    <div className="flex-col-gap-3">
      <Select label="View" value={view} onChange={setView} allowClear={false}>
        <SelectOption value="sales" label="Sales" />
        <SelectOption value="schedule" label="Schedule" />
      </Select>
      <EventTable caption="Events" data={events} rowKey={(event) => event.id}>
        <EventTable.Column
          id="name"
          rowHeader
          title="Name"
          dataKey="name"
          width={220}
        />
        {view === 'sales' && (
          <EventTable.Column
            id="ticketsSold"
            title="Tickets sold"
            dataKey="ticketsSold"
            width={120}
            align="right"
          />
        )}
        {view === 'schedule' && (
          <EventTable.Column id="date" title="Date" dataKey="date" width={130}>
            {(date) => day.format(new Date(date))}
          </EventTable.Column>
        )}
        <EventTable.Column
          id="venue"
          title="Venue"
          dataKey="venue"
          width={180}
        />
      </EventTable>
    </div>
  );
};

/**
 * Too much data to load at once (server mode): every part only reports
 * changes. Keep sort, filters and page in state, fetch when they change, and
 * pass back the rows, `totalItems` (rows matching the filters) and
 * `unfilteredTotalItems`. `loading` dims the current rows until the new ones
 * arrive; a response for an older query is dropped, and a failed one offers
 * a retry.
 */
const ServerEvents = () => {
  const [sort, setSort] = useState<TableSortValue>(null);
  const [filters, setFilters] = useState<TableFilterValue>({});
  const [page, setPage] = useState<TablePaginationValue>({
    pageIndex: 0,
    pageSize: 5,
  });
  const [result, setResult] = useState<EventPage>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // Cleared when the query changes, so an older response is ignored.
    let current = true;
    setLoading(true);
    setError('');
    fetchEvents({ sort, filters, page })
      .then((next) => current && setResult(next))
      .catch(() => current && setError('The events could not be loaded.'))
      .finally(() => current && setLoading(false));
    return () => {
      current = false;
    };
  }, [sort, filters, page, attempt]);

  return (
    <div className="flex-col-gap-3">
      {error && (
        <div role="alert" className="flex-row-gap-3 items-center">
          {error}
          <Button
            variant="base"
            size="sm"
            onClick={() => setAttempt(attempt + 1)}
          >
            Retry
          </Button>
        </div>
      )}
      <EventTable
        mode="server"
        caption="Events"
        data={result?.rows ?? []}
        rowKey={(event) => event.id}
        loading={loading}
      >
        <EventTable.Sort value={sort} onChange={setSort} />
        <EventTable.Filter value={filters} onChange={setFilters} />
        <EventTable.Column
          id="name"
          rowHeader
          title="Name"
          dataKey="name"
          width={220}
          sortable
          filter={{ type: 'text' }}
        />
        <EventTable.Column
          id="organizer"
          title="Organizer"
          dataKey="organizer"
          width={180}
          filter={{ type: 'enum', options: organizerOptions }}
        />
        <EventTable.Column
          id="ticketPrice"
          title="Ticket price"
          dataKey="ticketPrice"
          width={130}
          align="right"
          sortable
          filter={{ type: 'number' }}
        >
          {(ticketPrice) => currency.format(ticketPrice)}
        </EventTable.Column>
        <EventTable.Pagination
          value={page}
          onChange={setPage}
          pageSizeOptions={[5, 10, 20]}
          totalItems={result?.total ?? 0}
          unfilteredTotalItems={result?.unfilteredTotal}
        />
      </EventTable>
    </div>
  );
};

/**
 * A long list from the server, loaded as the user scrolls:
 * `Table.InfiniteScroll` calls `onLoadMore` near the end, and the footer's
 * "Load more rows" button does the same for keyboard users. Append the new
 * rows to the same state array, and give the container a fixed height so the
 * body scrolls.
 */
const AttendeeList = () => {
  const [rows, setRows] = useState<Attendee[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError('');
    fetchAttendees(offset, 50)
      .then((next) => {
        if (!current) return;
        setRows((loaded) => [...loaded, ...next.rows]);
        setTotal(next.total);
      })
      .catch(() => current && setError('More attendees could not be loaded.'))
      .finally(() => current && setLoading(false));
    return () => {
      current = false;
    };
  }, [offset, attempt]);

  return (
    <div className="flex-col-gap-3">
      {error && (
        <div role="alert" className="flex-row-gap-3 items-center">
          {error}
          <Button
            variant="base"
            size="sm"
            onClick={() => setAttempt(attempt + 1)}
          >
            Retry
          </Button>
        </div>
      )}
      <div className={tablePanel}>
        <AttendeeTable
          mode="server"
          caption="Attendees"
          data={rows}
          rowKey={(attendee) => attendee.id}
          loading={loading}
        >
          <AttendeeTable.InfiniteScroll
            totalItems={total}
            onLoadMore={() => setOffset(rows.length)}
          />
          <AttendeeTable.Column
            id="name"
            rowHeader
            title="Name"
            dataKey="name"
            width={220}
          />
          <AttendeeTable.Column
            id="email"
            title="Email"
            dataKey="email"
            width={240}
          />
          <AttendeeTable.Column
            id="ticket"
            title="Ticket"
            dataKey="ticket"
            width={120}
          />
        </AttendeeTable>
      </div>
    </div>
  );
};

/**
 * Thousands of rows already loaded: `virtualized` renders only the rows in
 * view, plus the row that holds focus. Give the container a fixed height.
 */
const AllAttendees = () => (
  <div className={tablePanel}>
    <AttendeeTable
      virtualized
      caption="All attendees"
      data={manyAttendees}
      rowKey={(attendee) => attendee.id}
    >
      <AttendeeTable.Column
        id="name"
        rowHeader
        title="Name"
        dataKey="name"
        width={220}
        sortable
        filter={{ type: 'text' }}
      />
      <AttendeeTable.Column
        id="email"
        title="Email"
        dataKey="email"
        width={240}
      />
      <AttendeeTable.Column
        id="ticket"
        title="Ticket"
        dataKey="ticket"
        width={120}
        filter={{ type: 'enum', options: ticketOptions }}
      />
    </AttendeeTable>
  </div>
);

/**
 * Client data that is still on its way: pass `loading` until it arrives.
 * Loading rows stand in for the rows, and a status announces the loading.
 */
const VenueList = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let current = true;
    fetchVenues()
      .then((next) => current && setVenues(next))
      .catch(() => current && setError('The venues could not be loaded.'))
      .finally(() => current && setLoading(false));
    return () => {
      current = false;
    };
  }, []);

  return (
    <VenueTable
      caption="Venues"
      data={venues}
      rowKey={(venue) => venue.id}
      loading={loading}
      emptyMessage={error || 'No venues yet.'}
    >
      <VenueTable.Column
        id="name"
        rowHeader
        title="Venue"
        dataKey="name"
        width={200}
        sortable
      />
      <VenueTable.Column
        id="city"
        title="City"
        dataKey="city"
        width={140}
        sortable
      />
      <VenueTable.Column
        id="capacity"
        title="Capacity"
        dataKey="capacity"
        width={120}
        align="right"
        sortable
      />
    </VenueTable>
  );
};

/**
 * Acting on several rows at once: keep `Table.Selection` controlled and run
 * the bulk action on its keys. `isRowSelectable` leaves rows that can't take
 * the action without a checkbox; `isRowDisabled` shows a disabled one. The
 * header checkbox selects every selectable, enabled row that matches the
 * filters, on every page.
 */
const CheckIn = () => {
  const [rows, setRows] = useState(attendees);
  const [selected, setSelected] = useState<TableRowKey[]>([]);

  const checkIn = () => {
    setRows(
      rows.map((attendee) =>
        selected.includes(attendee.id)
          ? { ...attendee, status: 'Checked in' }
          : attendee,
      ),
    );
    setSelected([]);
  };

  return (
    <div className="flex-col-gap-3 items-start">
      <Button
        size="sm"
        disabledWithReason={
          selected.length ? undefined : 'Select the attendees to check in'
        }
        onClick={checkIn}
      >
        {selected.length
          ? `Check in ${selected.length} attendees`
          : 'Check in attendees'}
      </Button>
      <AttendeeTable
        caption="Attendees"
        data={rows}
        rowKey={(attendee) => attendee.id}
      >
        <AttendeeTable.Selection
          value={selected}
          onChange={setSelected}
          isRowSelectable={(attendee) => attendee.status !== 'Cancelled'}
          isRowDisabled={(attendee) => attendee.status === 'Checked in'}
        />
        <AttendeeTable.Column
          id="name"
          rowHeader
          title="Name"
          dataKey="name"
          width={220}
        >
          {(name) => (
            <div className="flex-row-gap-2 items-center min-w-0">
              <Avatar size="sm" name={name} />
              <Truncate>{name}</Truncate>
            </div>
          )}
        </AttendeeTable.Column>
        <AttendeeTable.Column
          id="ticket"
          title="Ticket"
          dataKey="ticket"
          width={110}
        />
        <AttendeeTable.Column
          id="status"
          title="Status"
          dataKey="status"
          width={130}
        />
      </AttendeeTable>
    </div>
  );
};

/**
 * Picks the page doesn't need to hold: leave `Table.Selection` uncontrolled,
 * start it from `defaultValue`, and let `onChange` report each change, here
 * saved as the user picks.
 */
const AgendaPicker = () => (
  <SessionTable
    caption="Your agenda"
    data={sessions}
    rowKey={(session) => session.id}
  >
    <SessionTable.Selection
      defaultValue={['opening-keynote']}
      onChange={(sessionIds) => saveAgenda(sessionIds)}
    />
    <SessionTable.Column
      id="title"
      rowHeader
      title="Session"
      dataKey="title"
      width={220}
    />
    <SessionTable.Column
      id="startsAt"
      title="Starts"
      dataKey="startsAt"
      width={90}
    />
    <SessionTable.Column id="room" title="Room" dataKey="room" width={120} />
  </SessionTable>
);

/**
 * More about a row on demand: `Table.Expansion` renders details the columns
 * don't show, under the row; a row click toggles it too.
 * `isRowExpandable` leaves rows with nothing more to show without a button;
 * `isRowDisabled` shows a disabled one, here while a session is in review,
 * as its status says.
 */
const SessionDetails = () => (
  <SessionTable
    caption="Sessions"
    data={sessions}
    rowKey={(session) => session.id}
  >
    <SessionTable.Expansion
      isRowExpandable={(session) => Boolean(session.abstract)}
      isRowDisabled={(session) => session.status === 'In review'}
    >
      {(session) => (
        <div className="flex-col-gap-1">
          <p>{session.abstract}</p>
          <p>Speakers: {session.speakers.join(', ')}</p>
        </div>
      )}
    </SessionTable.Expansion>
    <SessionTable.Column
      id="title"
      rowHeader
      title="Session"
      dataKey="title"
      width={220}
    />
    <SessionTable.Column
      id="startsAt"
      title="Starts"
      dataKey="startsAt"
      width={90}
    />
    <SessionTable.Column
      id="status"
      title="Status"
      dataKey="status"
      width={120}
    />
  </SessionTable>
);

/**
 * Rows opened from outside the table: keep `Table.Expansion` controlled, and
 * set the expanded keys, here to show every schedule conflict at once.
 */
const ScheduleConflicts = () => {
  const [expanded, setExpanded] = useState<TableRowKey[]>([]);

  const conflicts = sessions
    .filter((session) => session.conflict)
    .map((session) => session.id);

  return (
    <div className="flex-col-gap-3 items-start">
      <Button variant="base" size="sm" onClick={() => setExpanded(conflicts)}>
        Show conflicts
      </Button>
      <SessionTable
        caption="Schedule"
        data={sessions}
        rowKey={(session) => session.id}
      >
        <SessionTable.Expansion
          value={expanded}
          onChange={setExpanded}
          isRowExpandable={(session) => Boolean(session.conflict)}
        >
          {(session) => <p>{session.conflict}</p>}
        </SessionTable.Expansion>
        <SessionTable.Column
          id="title"
          rowHeader
          title="Session"
          dataKey="title"
          width={220}
        />
        <SessionTable.Column
          id="startsAt"
          title="Starts"
          dataKey="startsAt"
          width={90}
        />
        <SessionTable.Column
          id="room"
          title="Room"
          dataKey="room"
          width={120}
        />
      </SessionTable>
    </div>
  );
};

/**
 * An order people set by hand, like the questions of a registration form:
 * `Table.Reorder` adds drag handles, moved by pointer, touch or keyboard, and
 * reports the reordered rows; the table never changes `data` itself.
 * `isRowDisabled` pins a row's handle while other rows still move past it.
 * Leave the columns unsortable: reordering is off while a sort is active.
 */
const RegistrationQuestions = () => {
  const [rows, setRows] = useState(questions);

  return (
    <QuestionTable
      caption="Registration questions"
      data={rows}
      rowKey={(question) => question.id}
    >
      <QuestionTable.Reorder
        onReorder={({ rows: next }) => setRows(next)}
        isRowDisabled={(question) => question.locked}
      />
      <QuestionTable.Column
        id="question"
        rowHeader
        title="Question"
        dataKey="question"
        width={220}
      />
      <QuestionTable.Column
        id="answer"
        title="Answer"
        dataKey="answer"
        width={120}
      />
      <QuestionTable.Column
        id="required"
        title="Required"
        dataKey="required"
        width={110}
      >
        {(required) => (required ? 'Required' : 'Optional')}
      </QuestionTable.Column>
    </QuestionTable>
  );
};

/**
 * Pages in a narrow panel: `size="minimal"` shows previous, the current page
 * and next; `content="icons"` draws them as icons. `defaultValue` sets the
 * first page and page size.
 */
const RecentOrders = () => (
  <OrderTable
    caption="Recent orders"
    data={orders}
    rowKey={(order) => order.id}
  >
    <OrderTable.Column
      id="id"
      rowHeader
      title="Order"
      dataKey="id"
      width={120}
    />
    <OrderTable.Column id="buyer" title="Buyer" dataKey="buyer" width={180} />
    <OrderTable.Column
      id="tickets"
      title="Tickets"
      dataKey="tickets"
      width={90}
      align="right"
    />
    <OrderTable.Pagination
      size="minimal"
      content="icons"
      pageSizeOptions={[5, 10, 20]}
      defaultValue={{ pageIndex: 0, pageSize: 10 }}
    />
  </OrderTable>
);

export default function TableRecipe() {
  return (
    <div className="flex-col-gap-8">
      <EventsTable />
      <SeatsLeft />
      <SearchEvents />
      <EventViews />
      <ServerEvents />
      <AttendeeList />
      <AllAttendees />
      <VenueList />
      <CheckIn />
      <AgendaPicker />
      <SessionDetails />
      <ScheduleConflicts />
      <RegistrationQuestions />
      <RecentOrders />
    </div>
  );
}
