# Table

Import `Table` from `@packages/ui/Table`. Inputs are `data`, `rowKey` and
`Table.*` config parts in `children`. Config parts render nothing; the table
reads their props. Columns appear in the order they render, so a
`Table.Column` inside your own component takes that component's place.
Parts aren't type-linked to `data`: give each its row type
(`Table.Column<Employee>`, `(row: Employee) => …`).

```tsx
<Table caption="Employees" data={rows} rowKey={(row) => row.id}>
  <Table.Sort />
  <Table.Filter />
  <Table.Selection />
  <Table.Expansion>{(row: Employee) => <Details employee={row} />}</Table.Expansion>
  <Table.Column<Employee> id="name" title="Name" dataKey="name" sortable filter={{ type: 'text' }} />
  <Table.Column<Employee> id="salary" title="Salary" dataKey="salary" width={120} align="right" sortable filter={{ type: 'number' }}>
    {(salary) => currency.format(salary)}
  </Table.Column>
  <Table.Column<Employee, number> id="tenure" title="Tenure" dataKey="startedAt" computed={(startedAt) => yearsSince(startedAt)} sortable />
  <Table.Pagination size="full" content="text" />
</Table>
```

## Modes

`mode="client"` (default) filters, sorts and pages rows in the table.
`mode="server"` does none of that: it renders `data` as given and emits every
change through the parts' `onChange`. One mode covers sort, filter and
pagination together.

## Controlled or uncontrolled

`Table.Sort`, `Table.Filter`, `Table.Selection`, `Table.Expansion` and
`Table.Pagination` (pages) each take `value`, `defaultValue` and `onChange`.
Passing `value` makes the part controlled; `defaultValue` is read once.

| Part               | Value                                                                                                       |
| ------------------ | ----------------------------------------------------------------------------------------------------------- |
| `Table.Sort`       | `{ columnId, direction: 'asc' \| 'desc' } \| null`                                                          |
| `Table.Filter`     | `Record<columnId, { type: 'text', contains } \| { type: 'enum', in } \| { type: 'number', eq?, lt?, gt? }>` |
| `Table.Selection`  | row keys                                                                                                    |
| `Table.Expansion`  | row keys                                                                                                    |
| `Table.Pagination` | `{ pageIndex, pageSize }`, zero-based                                                                       |

Sorting and filtering reset the page to 0. Header clicks cycle
ascending → descending → unsorted.

## Columns

- `id` names the column in sort and filter values (`key` is reserved by React).
- `dataKey` reads `row[dataKey]`. `computed(value, row)` gets that value
  (`undefined` without a `dataKey`) and the row, like `children`; its result
  replaces the value for client sort, client filter and rendering.
- `children(value, row)` renders the cell; without it the value renders in
  `Truncate`.
- `width` is px (number or `'120px'`) or a percentage. Columns without one
  share the remaining width equally; there is no minimum width.
- `filter` adds a filter button: `text` (search box), `enum` with `options`
  (multi-select), `number` (`=`, `<`, `>` inputs).
- Type the row with `Table.Column<Row>`; add the computed type as the second
  argument, `Table.Column<Row, number>`.

## Control columns

When enabled, these come before the data columns: drag handle
(`Table.Reorder`), selection checkbox (`Table.Selection`), expansion button
(`Table.Expansion`).

Each part takes `isRowDisabled(row)`, which shows that row's control
disabled. Selection and expansion also take `isRowSelectable(row)` /
`isRowExpandable(row)`; `false` leaves the cell empty, unless the row is
already selected or expanded: it then keeps its control so the state stays
visible and can be undone.

The header checkbox toggles every selectable, enabled row: all filtered rows
in client mode, the loaded rows in server mode. Disabled rows keep their
state. The expansion header button does the same for expandable rows: expand
all, or collapse all once every one is open.

## Row clicks

`onRowClick(row, event)` on `Table` gets clicks on a row outside its controls
(buttons, links, inputs and checkboxes in cells included) and not ending a
text selection. With `Table.Expansion`, a row click expands or collapses an
expandable, enabled row instead, and `onRowClick` is ignored.

`Table.Reorder onReorder({ rowKey, fromIndex, toIndex, rows })` reports
indexes into `data` and the reordered array; the table never changes `data`.
Reordering is off while a sort is active. A disabled row can't be dragged,
but other rows can move past it.

## Pagination and infinite scroll

Use one of them; in server mode rendering both throws (client mode ignores
`Table.InfiniteScroll`).

`Table.Pagination` shows page controls: `size` is `full` (rows per page,
first, previous, up to five page numbers, next, last) or `minimal` (rows per
page, previous, current page, next); `content` is `text` or `icons`. In
server mode pass `totalItems` (rows matching the filters).

Every table has a footer with the match count ("Showing **x** of **z** rows",
where **x** is the rows in the table, the loaded ones with infinite scroll;
with `Table.Pagination`, "Showing **x** to **y** of **z** rows" and the page
controls), plus the selected count with `Table.Selection`. When filtered,
client mode adds "Filtered from N"; in server mode `unfilteredTotalItems` on
`Table.Pagination` does. Server mode counts from `totalItems` when given.

`Table.InfiniteScroll` is server-mode only. It calls `onLoadMore` as the body
nears its end, until `data` holds `totalItems` rows and while not `loading`;
it shows loading rows below the loaded ones. It calls once per `data`
array: after a failed load, call `onLoadMore` yourself to retry, and keep
`data` stable between renders (memoize derived arrays), or every render
counts as new rows. In client mode it is ignored with a console warning:
the data is already loaded, and `virtualized` keeps large tables fast.
Infinite scroll only adds rows; `virtualized` is what renders just the rows in
view.

## Loading

While `loading`, skeleton rows (6, or 36 with `virtualized`) stand in for
rows: in server mode they replace the current rows, whose page, sort or
filter is out of date; with infinite scroll they follow the loaded rows; with
no rows they replace the empty message. Client mode keeps its rows. Skeletons
are hidden from assistive tech; the table is `aria-busy` and a status
announces "Loading…".

## Layout

The table is `width: 100%` and `max-height: 100%` of its container and sets
no other layout. The header is a separate table outside the scroll area, so
it is always visible; its horizontal scroll follows the body.

Without `virtualized`, the table grows with its rows until it reaches the
container height, then the body scrolls. A container with only `max-height`
must be a flex column (`display: flex; flex-direction: column`) for that cap
to apply; see the AutoHeight story. With `virtualized`, give the
container a fixed height: only the visible rows render.
