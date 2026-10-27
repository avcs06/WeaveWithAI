# Table

Import `createTable` from `@packages/ui/Table` and make a table for your row
type (see Typing). Inputs are `data`, `rowKey` and config parts in
`children`; below, `Table.*` names a part on any such table, like
`EmployeeTable.Column`. Config parts render nothing; the table reads their
props. Columns appear in the order they render, so a `Table.Column` inside
your own component takes that component's place.

```tsx
const EmployeeTable = createTable<Employee>();

<EmployeeTable caption="Employees" data={rows} rowKey={(row) => row.id}>
  <EmployeeTable.Selection />
  <EmployeeTable.Expansion>{(row) => <Details employee={row} />}</EmployeeTable.Expansion>
  <EmployeeTable.Column id="name" title="Name" dataKey="name" sortable filter={{ type: 'text' }} />
  <EmployeeTable.Column id="salary" title="Salary" dataKey="salary" width={120} align="right" sortable filter={{ type: 'number' }}>
    {(salary) => currency.format(salary)}
  </EmployeeTable.Column>
  <EmployeeTable.Column id="tenure" title="Tenure" dataKey="startedAt" computed={yearsSince} sortable />
  <EmployeeTable.Pagination size="full" content="text" />
</EmployeeTable>;
```

## Typing

`createTable<Row>()` binds `Row` to the table and every part: `data`,
`rowKey`, each column's `dataKey`, the `row` its `computed` and `children`
get, and the row callbacks of `Table.Selection`, `Table.Expansion` and
`Table.Reorder`. A misspelled `dataKey` or a field `Row` doesn't have fails to
compile. Typing only the table, `<Table<Row>>`, isn't enough: in TSX a
parent's generic never reaches its children, so its parts stay untyped.

Call it once at module scope, beside the row type, not inside a component:
it returns `Table` itself, but React's static-components check rejects a
component made during render.

Sorting and filtering work from the column props (`sortable`, `filter`).
Render `Table.Sort` or `Table.Filter` only to set a `defaultValue`, control the
value or listen to `onChange`.

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
  replaces the value for client sort, client filter and rendering. It is
  compared by reference: an inline function re-sorts and re-filters on every
  render without the React Compiler, so define it outside the component or
  memoize it.
- `children(value, row)` renders the cell; without it the value renders in
  `Truncate`.
- `width` is px (number or `'120px'`) or a percentage. Columns without one
  share the remaining width equally; there is no minimum width.
- `filter` adds a filter button: `text` (search box), `enum` with `options`
  (multi-select), `number` (`=`, `<`, `>` inputs). `number` only fits a
  column whose value is a number.
- A column's value type comes from `dataKey`, or from `computed` when it is
  a named function. An inline `computed` needs its type as the type
  argument: `EmployeeTable.Column<number>`.

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
text selection. It is a pointer shortcut: rows aren't focusable, so keyboard
users can't trigger it. Put the same action on a `Link` or `Button` in the
row. With `Table.Expansion`, a row click expands or collapses an expandable,
enabled row instead, and `onRowClick` is ignored.

`Table.Reorder onReorder({ rowKey, fromIndex, toIndex, rows })` reports
indexes into `data` and the reordered array; the table never changes `data`.
Reordering is off while a sort is active and moves rows only within the
rendered page. A disabled row can't be dragged,
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
it shows loading rows below the loaded ones. In server mode a "Load more
rows" button in the footer is the keyboard path; it goes once every row is
loaded, and focus on it moves to the table. It calls once per `data`
array: after a failed load, call `onLoadMore` yourself to retry, and keep
`data` stable between renders (memoize derived arrays), or every render
counts as new rows. In client mode it is ignored with a console warning:
the data is already loaded, and `virtualized` keeps large tables fast.
Infinite scroll only adds rows; `virtualized` is what renders just the rows in
view.

## Loading

While `loading`, skeleton rows (6, or 36 with `virtualized`) stand in for
rows: with infinite scroll they follow the loaded rows; with no rows they
replace the empty message. In server mode, rows already shown stay mounted
and dimmed until the new `data` arrives, so focus isn't lost. Client mode
keeps its rows. Skeletons are hidden from assistive tech; the table is
`aria-busy` and a status announces "Loading…".

## Layout

The table is `width: 100%` and `max-height: 100%` of its container and sets
no other layout. The header is a separate table outside the scroll area, so
it is always visible; its horizontal scroll follows the body.

Without `virtualized`, the table grows with its rows until it reaches the
container height, then the body scrolls. A container with only `max-height`
must be a flex column (`display: flex; flex-direction: column`) for that cap
to apply; see the AutoHeight story. With `virtualized`, give the
container a fixed height: only the visible rows render.

## Keyboard and screen readers

- Mark the column that names each row with `rowHeader`: its cells are row
  headers (`<th scope="row">`), read with every cell of the row, and its value
  names the row's controls: "Select Summer Fest", "Details for Summer Fest",
  "Reorder Summer Fest". Without one, the first column with a `dataKey` or
  `computed` names them, and "row N" when it holds no string or number.
- `aria-sort` is set only on the sorted column. A status announces "Sorted by
  Name, ascending", and "Sorting cleared" when the sort is removed.
- The expansion button has `aria-expanded` and, while open, `aria-controls`
  pointing at the details row.
- Reorder is keyboard-operable (Space to pick up, arrows to move, Space to
  drop, Escape to cancel) and announces each step with the row's position.
- With `virtualized`, a focused row stays mounted while it scrolls out of view.
