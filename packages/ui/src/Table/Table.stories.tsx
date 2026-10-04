import React, {
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Button } from '../Button';
import { Tag } from '../Tag';

import { Table } from './Table';

import type {
  TableFilterValue,
  TablePaginationValue,
  TableRowKey,
  TableSortValue,
} from './Table.types';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { StoryPage, StorySection } from '../StoryLayout';

const meta = {
  title: 'UI/Table',
  parameters: { controls: { disable: true }, layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj;

// ---------------------------------------------------------------------------
// Data

type Department = 'Engineering' | 'Design' | 'Sales' | 'Support' | 'Finance';
type Status = 'active' | 'on-leave' | 'inactive';
type Employee = {
  id: number;
  name: string;
  email: string;
  department: Department;
  salary: number;
  startedAt: Date;
  status: Status;
};

const FIRST_NAMES = [
  'Ada',
  'Grace',
  'Alan',
  'Linus',
  'Margaret',
  'Dennis',
  'Barbara',
  'Ken',
  'Frances',
  'Edsger',
];
const LAST_NAMES = [
  'Lovelace',
  'Hopper',
  'Turing',
  'Torvalds',
  'Hamilton',
  'Ritchie',
  'Liskov',
  'Thompson',
  'Allen',
  'Dijkstra',
];
const DEPARTMENTS: Department[] = [
  'Engineering',
  'Design',
  'Sales',
  'Support',
  'Finance',
];
const STATUSES: Status[] = [
  'active',
  'active',
  'active',
  'on-leave',
  'inactive',
];
const NOW = new Date('2026-10-01').getTime();
const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;

const makeEmployees = (count: number): Employee[] =>
  Array.from({ length: count }, (_, index) => {
    const first = FIRST_NAMES[index % FIRST_NAMES.length];
    const last =
      LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length];
    return {
      id: index + 1,
      name: `${first} ${last} ${index + 1}`,
      email: `${first}.${last}.${index + 1}@example.com`.toLowerCase(),
      department: DEPARTMENTS[(index * 7) % DEPARTMENTS.length],
      salary: 40_000 + ((index * 7919) % 120) * 1_000,
      startedAt: new Date(
        NOW -
          ((index * 104729) % 15) * YEAR_MS -
          (index % 12) * 30 * 24 * 60 * 60 * 1000,
      ),
      status: STATUSES[(index * 3) % STATUSES.length],
    };
  });

const yearsSince = (date: Date) => Math.floor((NOW - date.getTime()) / YEAR_MS);
const getTenure = (employee: Employee) => yearsSince(employee.startedAt);

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const enumOptions = (values: string[]) =>
  [...new Set(values)].map((value) => ({ label: value, value }));

// ---------------------------------------------------------------------------
// Columns: a fragment of config parts, shared by every story

const columns = (
  <>
    <Table.Column<Employee>
      id="name"
      title="Name"
      dataKey="name"
      width={220}
      sortable
      filter={{ type: 'text' }}
    />
    <Table.Column<Employee>
      id="email"
      title="Email"
      dataKey="email"
      filter={{ type: 'text' }}
    />
    <Table.Column<Employee>
      id="department"
      title="Department"
      dataKey="department"
      width={160}
      sortable
      filter={{ type: 'enum', options: enumOptions(DEPARTMENTS) }}
    />
    <Table.Column<Employee>
      id="salary"
      title="Salary"
      dataKey="salary"
      width={130}
      align="right"
      sortable
      filter={{ type: 'number' }}
    >
      {(salary) => currency.format(salary)}
    </Table.Column>
    <Table.Column<Employee, number>
      id="tenure"
      title="Tenure (years)"
      dataKey="startedAt"
      computed={yearsSince}
      width={140}
      align="right"
      sortable
      filter={{ type: 'number' }}
    />
    <Table.Column<Employee>
      id="status"
      title="Status"
      dataKey="status"
      width={120}
      filter={{ type: 'enum', options: enumOptions(STATUSES) }}
    >
      {(status) => <Tag size="xs">{status}</Tag>}
    </Table.Column>
  </>
);

const EmployeeDetails = ({ employee }: { employee: Employee }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'max-content 1fr',
      gap: '4px 16px',
    }}
  >
    <strong>Email</strong>
    <span>{employee.email}</span>
    <strong>Started</strong>
    <span>{employee.startedAt.toDateString()}</span>
    <strong>Tenure</strong>
    <span>{getTenure(employee)} years</span>
  </div>
);

const Frame = ({
  height,
  maxHeight,
  children,
  note,
}: {
  height?: number;
  /** Without `height`: the table grows with its rows up to this, then scrolls. */
  maxHeight?: number;
  children: ReactNode;
  note?: ReactNode;
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    {note && (
      <p style={{ margin: 0, fontFamily: 'system-ui', fontSize: 13 }}>{note}</p>
    )}
    {/* Padded, so the table's own border stands clear of this outline. A
        flex column, so a `maxHeight` alone also caps the table. */}
    <div
      style={{
        height,
        maxHeight,
        display: 'flex',
        flexDirection: 'column',
        padding: 16,
        border: '1px dashed #d4d4d8',
      }}
    >
      {children}
    </div>
  </div>
);

const useReorderableData = (initial: Employee[]) => {
  const [data, setData] = useState(initial);
  return [data, ({ rows }: { rows: Employee[] }) => setData(rows)] as const;
};

const isInactive = (row: Employee) => row.status === 'inactive';
const isOnLeave = (row: Employee) => row.status === 'on-leave';

// ---------------------------------------------------------------------------
// Sections

/** Client mode: sort, filter, computed column, selection, expansion, reorder. */
const DefaultTable = () => {
  const [data, onReorder] = useReorderableData(makeEmployees(300));
  return (
    <Frame
      height={480}
      note="300 rows, not virtualized. Fixed widths exceed narrow viewports, so the header scrolls with the body. Reordering turns off while a column is sorted. Inactive rows can't be selected; on-leave rows have selection, expansion and dragging disabled."
    >
      <Table caption="Employees" data={data} rowKey={(row) => row.id}>
        <Table.Reorder onReorder={onReorder} isRowDisabled={isOnLeave} />
        <Table.Selection
          isRowSelectable={(row: Employee) => !isInactive(row)}
          isRowDisabled={isOnLeave}
        />
        <Table.Expansion isRowDisabled={isOnLeave}>
          {(row: Employee) => <EmployeeDetails employee={row} />}
        </Table.Expansion>
        {columns}
      </Table>
    </Frame>
  );
};

/** Same features with 5,000 rows; only visible rows are rendered. */
const VirtualizedTable = () => {
  const [data, onReorder] = useReorderableData(makeEmployees(5_000));
  return (
    <Frame
      height={480}
      note="5,000 rows, virtualized. The container height is fixed by the story."
    >
      <Table
        caption="Employees"
        data={data}
        rowKey={(row) => row.id}
        virtualized
      >
        <Table.Reorder onReorder={onReorder} />
        <Table.Selection />
        <Table.Expansion>
          {(row: Employee) => <EmployeeDetails employee={row} />}
        </Table.Expansion>
        {columns}
      </Table>
    </Frame>
  );
};

/** Client pagination; 10 rows per page are shorter than the container. */
const PaginationTable = () => (
  <Frame
    height={640}
    note="Not virtualized: the table grows with its rows and stops at the container height."
  >
    <Table
      caption="Employees"
      data={makeEmployees(120)}
      rowKey={(row) => row.id}
    >
      <Table.Selection defaultValue={[1, 2, 3]} />
      <Table.Column<Employee>
        id="name"
        title="Name"
        dataKey="name"
        sortable
        filter={{ type: 'text' }}
      />
      <Table.Column<Employee> id="email" title="Email" dataKey="email" />
      <Table.Column<Employee>
        id="department"
        title="Department"
        dataKey="department"
        width="20%"
        sortable
        filter={{ type: 'enum', options: enumOptions(DEPARTMENTS) }}
      />
      <Table.Column<Employee>
        id="salary"
        title="Salary"
        dataKey="salary"
        width={120}
        align="right"
        sortable
      >
        {(salary) => currency.format(salary)}
      </Table.Column>
      <Table.Pagination pageSizeOptions={[10, 25, 50]} />
    </Table>
  </Frame>
);

/** Not virtualized, no fixed height: grows row by row up to a max height. */
const AutoHeightTable = () => {
  const [count, setCount] = useState(2);
  const data = useMemo(() => makeEmployees(40).slice(0, count), [count]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button
          size="sm"
          variant="base"
          disabled={count >= 40}
          onClick={() => setCount((current) => Math.min(current + 2, 40))}
        >
          Add 2 rows
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setCount(2)}>
          Reset
        </Button>
      </div>
      <Frame
        maxHeight={420}
        note={`${count} rows. The table grows with each row until the container's 420px max height, then the body scrolls.`}
      >
        <Table caption="Employees" data={data} rowKey={(row) => row.id}>
          {columns}
        </Table>
      </Frame>
    </div>
  );
};

/** size × content */
const PaginationVariantsTable = () => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
      gap: 24,
    }}
  >
    {(['full', 'minimal'] as const).flatMap((size) =>
      (['text', 'icons'] as const).map((content) => (
        <Frame
          key={`${size}-${content}`}
          note={`size="${size}" content="${content}"`}
        >
          <Table
            caption={`${size} ${content}`}
            data={makeEmployees(42)}
            rowKey={(row) => row.id}
          >
            <Table.Selection defaultValue={[2, 5]} />
            <Table.Column<Employee> id="name" title="Name" dataKey="name" />
            <Table.Column<Employee>
              id="department"
              title="Department"
              dataKey="department"
            />
            <Table.Pagination
              size={size}
              content={content}
              pageSizeOptions={[5, 10]}
            />
          </Table>
        </Frame>
      )),
    )}
  </div>
);

// ---------------------------------------------------------------------------
// Server simulation

const SERVER_ROWS = makeEmployees(1_000);
const LATENCY_MS = 400;

type EmployeeQuery = { sort: TableSortValue; filters: TableFilterValue };

const sortValue = (employee: Employee, columnId: string) =>
  columnId === 'tenure'
    ? getTenure(employee)
    : employee[columnId as keyof Employee];

/** Stands in for the API: applies the emitted query objects as-is. */
const queryEmployees = ({ sort, filters }: EmployeeQuery) => {
  const rows = SERVER_ROWS.filter((employee) =>
    Object.entries(filters).every(([columnId, filter]) => {
      const value = sortValue(employee, columnId);
      if (filter.type === 'text')
        return String(value)
          .toLowerCase()
          .includes(filter.contains.toLowerCase());
      if (filter.type === 'enum') return filter.in.includes(String(value));
      const number = Number(value);
      return (
        (filter.eq === undefined || number === filter.eq) &&
        (filter.lt === undefined || number < filter.lt) &&
        (filter.gt === undefined || number > filter.gt)
      );
    }),
  );
  if (sort) {
    const factor = sort.direction === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      const left = sortValue(a, sort.columnId);
      const right = sortValue(b, sort.columnId);
      return (
        factor *
        (typeof left === 'number' && typeof right === 'number'
          ? left - right
          : String(left).localeCompare(String(right)))
      );
    });
  }
  return rows;
};

const QueryLog = ({ value }: { value: unknown }) => (
  <pre style={{ margin: 0, fontSize: 12, maxHeight: 200, overflow: 'auto' }}>
    {JSON.stringify(value, null, 2)}
  </pre>
);

/** Server mode, controlled: every change is emitted and the API is queried. */
const ServerTable = () => {
  const [sort, setSort] = useState<TableSortValue>(null);
  const [filters, setFilters] = useState<TableFilterValue>({});
  const [page, setPage] = useState<TablePaginationValue>({
    pageIndex: 0,
    pageSize: 25,
  });
  const [selected, setSelected] = useState<TableRowKey[]>([]);
  const [result, setResult] = useState({ rows: [] as Employee[], total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      const rows = queryEmployees({ sort, filters });
      const start = page.pageIndex * page.pageSize;
      setResult({
        rows: rows.slice(start, start + page.pageSize),
        total: rows.length,
      });
      setLoading(false);
    }, LATENCY_MS);
    return () => clearTimeout(timer);
  }, [sort, filters, page]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Frame
        height={480}
        note={`Server mode with ${LATENCY_MS}ms latency. The table only emits; the query below goes to the "API".`}
      >
        <Table
          mode="server"
          caption="Employees"
          data={result.rows}
          rowKey={(row) => row.id}
          loading={loading}
        >
          <Table.Sort value={sort} onChange={setSort} />
          <Table.Filter value={filters} onChange={setFilters} />
          <Table.Selection value={selected} onChange={setSelected} />
          {columns}
          <Table.Pagination
            value={page}
            onChange={setPage}
            totalItems={result.total}
            unfilteredTotalItems={SERVER_ROWS.length}
          />
        </Table>
      </Frame>
      <QueryLog value={{ sort, filters, page, selected }} />
    </div>
  );
};

const PAGE_SIZE = 50;

/** Server infinite scroll, virtualized: the table asks for more near the end. */
const ServerInfiniteScrollTable = () => {
  const [query, setQuery] = useState<EmployeeQuery>({
    sort: null,
    filters: {},
  });
  const [rows, setRows] = useState<Employee[]>([]);
  const [total, setTotal] = useState(SERVER_ROWS.length);
  const [loading, setLoading] = useState(false);
  const requestRef = useRef(0);

  // A new query starts a fresh list; late responses from older queries are dropped.
  // The count comes back with the query, as a server's would.
  const updateQuery = (patch: Partial<EmployeeQuery>) => {
    const next = { ...query, ...patch };
    requestRef.current += 1;
    setRows([]);
    setTotal(queryEmployees(next).length);
    setLoading(false);
    setQuery(next);
  };

  const loadMore = () => {
    const request = requestRef.current;
    setLoading(true);
    setTimeout(() => {
      if (request !== requestRef.current) return;
      const matching = queryEmployees(query);
      setRows((current) => [
        ...current,
        ...matching.slice(current.length, current.length + PAGE_SIZE),
      ]);
      setTotal(matching.length);
      setLoading(false);
    }, LATENCY_MS);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Frame
        height={480}
        note={`Loads ${PAGE_SIZE} rows per request with ${LATENCY_MS}ms latency, virtualized.`}
      >
        <Table
          mode="server"
          caption="Employees"
          data={rows}
          rowKey={(row) => row.id}
          loading={loading}
          virtualized
        >
          <Table.Sort
            value={query.sort}
            onChange={(sort) => updateQuery({ sort })}
          />
          <Table.Filter
            value={query.filters}
            onChange={(filters) => updateQuery({ filters })}
          />
          <Table.Selection />
          <Table.Expansion>
            {(row: Employee) => <EmployeeDetails employee={row} />}
          </Table.Expansion>
          {columns}
          <Table.InfiniteScroll totalItems={total} onLoadMore={loadMore} />
        </Table>
      </Frame>
      <QueryLog value={{ ...query, loaded: rows.length }} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Story

export const Overview: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="Client">
        <DefaultTable />
      </StorySection>
      <StorySection title="Virtualized">
        <VirtualizedTable />
      </StorySection>
      <StorySection title="Pagination">
        <PaginationTable />
      </StorySection>
      <StorySection title="Auto height">
        <AutoHeightTable />
      </StorySection>
      <StorySection title="Pagination variants">
        <PaginationVariantsTable />
      </StorySection>
      <StorySection title="Server">
        <ServerTable />
      </StorySection>
      <StorySection title="Server infinite scroll">
        <ServerInfiniteScrollTable />
      </StorySection>
    </StoryPage>
  ),
};
