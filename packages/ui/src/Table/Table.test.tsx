import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';

import { Button } from '../Button';
import { Dropdown } from '../Dropdown';
import { axe, renderUI } from '../test-utils';

import { Table } from './Table';

import type { TableProps, TableSortValue } from './Table.types';

type Person = {
  id: number;
  name: string;
  team: 'Design' | 'Engineering' | 'Sales';
  salary: number;
  active: boolean;
};

const people: Person[] = [
  { id: 1, name: 'Ada', team: 'Engineering', salary: 120, active: true },
  { id: 2, name: 'Grace', team: 'Engineering', salary: 150, active: true },
  { id: 3, name: 'Linus', team: 'Design', salary: 90, active: false },
  { id: 4, name: 'Edsger', team: 'Sales', salary: 70, active: true },
];

const columns = [
  <Table.Column<Person>
    key="name"
    id="name"
    rowHeader
    title="Name"
    dataKey="name"
    sortable
    filter={{ type: 'text' }}
  />,
  <Table.Column<Person>
    key="team"
    id="team"
    title="Team"
    dataKey="team"
    filter={{
      type: 'enum',
      options: [
        { label: 'Design', value: 'Design' },
        { label: 'Engineering', value: 'Engineering' },
        { label: 'Sales', value: 'Sales' },
      ],
    }}
  />,
  <Table.Column<Person>
    key="salary"
    id="salary"
    title="Salary"
    dataKey="salary"
    sortable
    align="right"
    filter={{ type: 'number' }}
  />,
];

const renderTable = (
  props: Partial<TableProps<Person>> = {},
  parts: React.ReactNode = null,
) =>
  renderUI(
    <Table<Person>
      caption="People"
      data={people}
      rowKey={(row) => row.id}
      {...props}
    >
      {parts}
      {columns}
    </Table>,
  );

// `hidden`: an open modal menu hides the rest of the page from assistive tech.
// Data rows only: spacer rows (virtualized) carry no aria-rowindex.
const bodyRows = () =>
  within(screen.getByRole('table', { hidden: true }))
    .getAllByRole('row', { hidden: true })
    .filter((row) => row.hasAttribute('aria-rowindex'))
    .slice(1);
// The `rowHeader` column's cell names each row; without one, the first cell.
const names = () =>
  bodyRows().map(
    (row) =>
      (
        within(row).queryByRole('rowheader', { hidden: true }) ??
        within(row).getAllByRole('cell', { hidden: true }).at(0)
      )?.textContent,
  );
// Several sr-only statuses live in a table (sort, loading, field messages):
// pick the one saying this.
const statusWith = (text: string) =>
  screen.getAllByRole('status').find((status) => status.textContent === text);
// The footer's counts are separate <strong>s; read the whole line.
const footer = () =>
  document
    .querySelector('[aria-live="polite"]')
    ?.parentElement?.textContent?.replace(/\s+/g, ' ');

describe('Table', () => {
  it('renders an accessible table with row and column semantics', async () => {
    const { container } = renderTable();
    const table = screen.getByRole('table', { name: 'People' });
    expect(table).toHaveAttribute('aria-rowcount', '5');
    expect(table).toHaveAttribute('aria-busy', 'false');
    // Named by the title alone: the filter button's label stays out of it.
    expect(screen.getAllByRole('columnheader')).toHaveLength(3);
    for (const name of ['Name', 'Team', 'Salary'])
      expect(screen.getByRole('columnheader', { name })).toHaveAttribute(
        'scope',
        'col',
      );
    // The `rowHeader` column's cells head their rows.
    const rowHeaders = screen.getAllByRole('rowheader');
    expect(rowHeaders.map((th) => th.textContent)).toEqual([
      'Ada',
      'Grace',
      'Linus',
      'Edsger',
    ]);
    for (const th of rowHeaders) expect(th).toHaveAttribute('scope', 'row');
    expect(bodyRows()[0]).toHaveAttribute('aria-rowindex', '2');
    // Rows are not focusable: row actions belong on controls in the row.
    expect(bodyRows()[0]).not.toHaveAttribute('tabindex');
    expect(names()).toEqual(['Ada', 'Grace', 'Linus', 'Edsger']);
    expect(footer()).toBe('Showing 4 of 4 rows');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('sorts ascending, descending, then off from the column header', async () => {
    const { container } = renderTable({}, <Table.Sort />);
    const header = screen.getByRole('columnheader', { name: 'Salary' });
    const other = screen.getByRole('columnheader', { name: 'Name' });
    const sort = within(header).getByRole('button', { name: 'Salary' });
    // Only the sorted column carries `aria-sort`; unsorted, it is absent.
    expect(header).not.toHaveAttribute('aria-sort');
    sort.focus();
    await userEvent.keyboard('{Enter}');
    expect(header).toHaveAttribute('aria-sort', 'ascending');
    expect(other).not.toHaveAttribute('aria-sort');
    expect(statusWith('Sorted by Salary, ascending')).toBeDefined();
    expect(names()).toEqual(['Edsger', 'Linus', 'Ada', 'Grace']);
    await userEvent.keyboard('[Space]');
    expect(header).toHaveAttribute('aria-sort', 'descending');
    expect(statusWith('Sorted by Salary, descending')).toBeDefined();
    expect(names()).toEqual(['Grace', 'Ada', 'Linus', 'Edsger']);
    await userEvent.click(sort);
    expect(header).not.toHaveAttribute('aria-sort');
    expect(statusWith('Sorting cleared')).toBeDefined();
    expect(names()).toEqual(['Ada', 'Grace', 'Linus', 'Edsger']);
    expect(sort).toHaveFocus();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('emits sort changes when controlled', async () => {
    const onChange = jest.fn();
    const Controlled = () => {
      const [sort, setSort] = useState<TableSortValue>(null);
      return (
        <Table<Person> caption="People" data={people} rowKey={(row) => row.id}>
          <Table.Sort
            value={sort}
            onChange={(next) => {
              onChange(next);
              setSort(next);
            }}
          />
          {columns}
        </Table>
      );
    };
    renderUI(<Controlled />);
    await userEvent.click(screen.getByRole('button', { name: 'Name' }));
    expect(onChange).toHaveBeenCalledWith({
      columnId: 'name',
      direction: 'asc',
    });
    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
    expect(names()).toEqual(['Ada', 'Edsger', 'Grace', 'Linus']);
  });

  it('filters by text from a named popover', async () => {
    renderTable({}, <Table.Filter />);
    const trigger = screen.getByRole('button', { name: 'Filter Name' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    const popover = await screen.findByRole('dialog', { name: 'Filter Name' });
    expect(await axe(document.body)).toHaveNoViolations();
    // Focus moves into the popover, onto its search box.
    const search = within(popover).getByRole('searchbox', {
      name: 'Search Name',
    });
    expect(search).toHaveFocus();
    await userEvent.type(search, 'gr');
    await waitFor(() => expect(names()).toEqual(['Grace']));
    expect(footer()).toBe('Showing 1 of 1 match · Filtered from 4');
    expect(
      screen.getByRole('button', { name: 'Filter Name (active)' }),
    ).toBeInTheDocument();
    // Escape closes it and refocuses the trigger. It also clears the search
    // box, so the trigger is no longer "(active)": assert on the element, not
    // its name.
    await userEvent.keyboard('{Escape}');
    expect(
      screen.queryByRole('dialog', { name: 'Filter Name' }),
    ).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('filters by enum with checkbox menu items', async () => {
    renderTable({}, <Table.Filter />);
    await userEvent.click(screen.getByRole('button', { name: 'Filter Team' }));
    const design = await screen.findByRole('menuitemcheckbox', {
      name: /Design/,
    });
    expect(design).toHaveAttribute('aria-checked', 'false');
    expect(await axe(document.body)).toHaveNoViolations();
    await userEvent.click(design);
    expect(design).toHaveAttribute('aria-checked', 'true');
    expect(names()).toEqual(['Linus']);
    // The menu stays open for more picks; Escape returns focus to the trigger.
    await userEvent.keyboard('{Escape}');
    expect(
      screen.getByRole('button', { name: 'Filter Team (active)' }),
    ).toHaveFocus();
  });

  it('filters by number ranges', async () => {
    renderTable({}, <Table.Filter />);
    await userEvent.click(
      screen.getByRole('button', { name: 'Filter Salary' }),
    );
    const greater = await screen.findByRole('spinbutton', {
      name: 'Salary greater than',
    });
    expect(await axe(document.body)).toHaveNoViolations();
    await userEvent.type(greater, '100');
    await waitFor(() => expect(names()).toEqual(['Ada', 'Grace']));
    await userEvent.keyboard('{Escape}');
    expect(
      screen.getByRole('button', { name: 'Filter Salary (active)' }),
    ).toHaveFocus();
  });

  it('shows an empty message as row 2 when nothing matches', async () => {
    const { container } = renderTable({
      data: [],
      emptyMessage: 'Nobody here',
    });
    expect(screen.getByText('Nobody here').closest('tr')).toHaveAttribute(
      'aria-rowindex',
      '2',
    );
    expect(screen.getByRole('table')).toHaveAttribute('aria-rowcount', '2');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows hidden loading rows and announces loading', async () => {
    const { container } = renderTable({ data: [], loading: true });
    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
    expect(statusWith('Loading…')).toBeDefined();
    const loadingRows = container.querySelectorAll('tr[data-slot="loading"]');
    expect(loadingRows).toHaveLength(6);
    // Skeletons are hidden from assistive tech and carry no row position.
    for (const row of Array.from(loadingRows))
      expect(row.closest('tbody')).toHaveAttribute('aria-hidden', 'true');
    expect(bodyRows()).toHaveLength(0);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('Table selection', () => {
  it('selects rows and all rows, skipping unselectable and disabled ones', async () => {
    const onChange = jest.fn();
    const { container } = renderTable(
      {},
      <Table.Selection
        onChange={onChange}
        isRowSelectable={(row: Person) => row.active}
        isRowDisabled={(row: Person) => row.id === 4}
      />,
    );
    // The row-header value names each row's checkbox.
    const ada = screen.getByRole('checkbox', { name: 'Select Ada' });
    expect(ada).toHaveAttribute('aria-checked', 'false');
    ada.focus();
    await userEvent.keyboard('[Space]');
    expect(onChange).toHaveBeenLastCalledWith([1]);
    expect(ada).toBeChecked();
    // Unselectable and unselected: no checkbox at all.
    expect(
      screen.queryByRole('checkbox', { name: 'Select Linus' }),
    ).not.toBeInTheDocument();
    // Disabled without a reason: shown, but out of the tab order.
    const edsger = screen.getByRole('checkbox', { name: 'Select Edsger' });
    expect(edsger).toHaveAttribute('aria-disabled', 'true');
    expect(edsger).toHaveAttribute('aria-checked', 'false');
    expect(edsger).toHaveAttribute('tabindex', '-1');

    const all = screen.getByRole('checkbox', { name: 'Select all rows' });
    expect(all).toHaveAttribute('aria-checked', 'mixed');
    await userEvent.click(all);
    // Select-all skips the unselectable row and leaves the disabled one as is.
    expect(onChange).toHaveBeenLastCalledWith([1, 2]);
    expect(
      screen.getByRole('checkbox', { name: 'Select Grace' }),
    ).toBeChecked();
    expect(edsger).not.toBeChecked();
    expect(all).toHaveAttribute('aria-checked', 'true');
    expect(footer()).toBe('Showing 4 of 4 rows · 2 rows selected');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('keeps a selected row visible after it stops being selectable', async () => {
    const onChange = jest.fn();
    renderTable(
      {},
      <Table.Selection
        value={[3]}
        onChange={onChange}
        isRowSelectable={(row: Person) => row.active}
      />,
    );
    const linus = screen.getByRole('checkbox', { name: 'Select Linus' });
    expect(linus).toBeChecked();
    // It keeps its control so the selection can still be undone.
    await userEvent.click(linus);
    expect(onChange).toHaveBeenLastCalledWith([]);
  });
});

describe('Table expansion and row clicks', () => {
  const expansion = (
    <Table.Expansion isRowDisabled={(row: Person) => row.id === 4}>
      {(row: Person) => <p>Details for {row.name}</p>}
    </Table.Expansion>
  );

  it('expands from the button and from a row click, sharing the row index', async () => {
    const onRowClick = jest.fn();
    const { container } = renderTable({ onRowClick }, expansion);
    // A constant name: `aria-expanded` says open or closed.
    const button = screen.getByRole('button', { name: 'Details for Ada' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).not.toHaveAttribute('aria-controls');
    button.focus();
    await userEvent.keyboard('{Enter}');
    const details = screen.getByText('Details for Ada').closest('tr');
    expect(details).toHaveAttribute('aria-rowindex', '2');
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(button).toHaveAttribute('aria-controls', details?.id);
    expect(await axe(container)).toHaveNoViolations();
    await userEvent.keyboard('[Space]');
    expect(screen.queryByText('Details for Ada')).not.toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).not.toHaveAttribute('aria-controls');

    await userEvent.click(screen.getByText('Grace'));
    expect(screen.getByText('Details for Grace')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Details for Grace' }),
    ).toHaveAttribute('aria-expanded', 'true');
    expect(onRowClick).not.toHaveBeenCalled();

    // A disabled row's button is out of the tab order, and a row click doesn't
    // expand it.
    const disabled = screen.getByRole('button', {
      name: 'Details for Edsger',
    });
    expect(disabled).toHaveAttribute('aria-disabled', 'true');
    expect(disabled).toHaveAttribute('tabindex', '-1');
    await userEvent.click(screen.getByText('Edsger'));
    expect(screen.queryByText('Details for Edsger')).not.toBeInTheDocument();
  });

  it('expands and collapses every enabled row from the header', async () => {
    const { container } = renderTable({}, expansion);
    await userEvent.click(
      screen.getByRole('button', { name: 'Expand all rows' }),
    );
    expect(screen.getAllByText(/Details for/)).toHaveLength(3);
    expect(
      screen.getByRole('button', { name: 'Details for Ada' }),
    ).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen.getByRole('button', { name: 'Details for Edsger' }),
    ).toHaveAttribute('aria-expanded', 'false');
    expect(await axe(container)).toHaveNoViolations();
    await userEvent.click(
      screen.getByRole('button', { name: 'Collapse all rows' }),
    );
    expect(screen.queryByText(/Details for/)).not.toBeInTheDocument();
  });

  it('calls onRowClick without expansion, but not for controls in the row', async () => {
    const onRowClick = jest.fn();
    renderTable({ onRowClick }, <Table.Selection />);
    await userEvent.click(screen.getByText('Linus'));
    expect(onRowClick).toHaveBeenCalledWith(people[2], expect.anything());
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Ada' }));
    expect(onRowClick).toHaveBeenCalledTimes(1);
  });

  it("ignores clicks in a cell's portalled menu", async () => {
    const onRowClick = jest.fn();
    const onEdit = jest.fn();
    renderTable(
      { onRowClick },
      <Table.Column<Person> id="actions" title="Actions">
        {(_, row) => (
          <Dropdown
            menu={<Dropdown.Item onSelect={onEdit}>Edit</Dropdown.Item>}
          >
            <Button variant="base">Actions for {row.name}</Button>
          </Dropdown>
        )}
      </Table.Column>,
    );
    const trigger = screen.getByRole('button', { name: 'Actions for Ada' });
    await userEvent.click(trigger);
    // The trigger is a control in the row: opening the menu is not a row click.
    expect(onRowClick).not.toHaveBeenCalled();
    expect(await axe(document.body)).toHaveNoViolations();
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Edit' }),
    );
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onRowClick).not.toHaveBeenCalled();
    // Selecting closes the menu and returns focus to its trigger.
    expect(trigger).toHaveFocus();
  });
});

describe('Table pagination', () => {
  const many = Array.from({ length: 25 }, (_, index) => ({
    ...people[index % 4],
    id: index + 1,
    name: `Person ${index + 1}`,
  }));

  it('pages in client mode with a named navigation', async () => {
    const { container } = renderTable(
      { data: many },
      <Table.Pagination pageSizeOptions={[10, 20]} />,
    );
    expect(footer()).toBe('Showing 1 to 10 of 25 rows');
    expect(
      screen.getByRole('navigation', { name: 'People pagination' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: 'Rows per page' }),
    ).toBeInTheDocument();
    // On the first page, backwards controls are disabled without a reason:
    // out of the tab order.
    for (const name of ['First', 'Previous']) {
      const control = screen.getByRole('button', { name });
      expect(control).toHaveAttribute('aria-disabled', 'true');
      expect(control).toHaveAttribute('tabindex', '-1');
    }
    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(await axe(container)).toHaveNoViolations();

    const next = screen.getByRole('button', { name: 'Next' });
    next.focus();
    await userEvent.keyboard('{Enter}');
    expect(footer()).toBe('Showing 11 to 20 of 25 rows');
    expect(bodyRows()[0]).toHaveAttribute('aria-rowindex', '12');
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('button', { name: 'Page 1' })).not.toHaveAttribute(
      'aria-current',
    );
    expect(
      screen.getByRole('button', { name: 'Previous' }),
    ).not.toHaveAttribute('aria-disabled');

    await userEvent.click(screen.getByRole('button', { name: 'Last' }));
    expect(names()).toEqual([
      'Person 21',
      'Person 22',
      'Person 23',
      'Person 24',
      'Person 25',
    ]);
    for (const name of ['Next', 'Last']) {
      const control = screen.getByRole('button', { name });
      expect(control).toHaveAttribute('aria-disabled', 'true');
      expect(control).toHaveAttribute('tabindex', '-1');
    }
  });

  it('emits pages, keeps rows while reloading, and shows a page of loading rows when empty in server mode', async () => {
    const onChange = jest.fn();
    const { container, rerender } = renderTable(
      { mode: 'server', data: many.slice(0, 10) },
      <Table.Pagination totalItems={25} onChange={onChange} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Page 2' }));
    expect(onChange).toHaveBeenCalledWith({ pageIndex: 1, pageSize: 10 });

    // Shown rows stay mounted (dimmed) while the next page loads, so focus
    // survives; the table is busy and paging is off.
    rerender(
      <Table<Person>
        caption="People"
        mode="server"
        loading
        data={many.slice(0, 10)}
        rowKey={(row) => row.id}
      >
        <Table.Pagination totalItems={25} onChange={onChange} />
        {columns}
      </Table>,
    );
    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
    expect(statusWith('Loading…')).toBeDefined();
    expect(screen.getByText('Person 1')).toBeInTheDocument();
    expect(container.querySelectorAll('tr[data-slot="loading"]')).toHaveLength(
      0,
    );
    expect(screen.getByRole('button', { name: 'Next' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(await axe(container)).toHaveNoViolations();

    // With no rows to keep, a page-sized set of skeletons stands in.
    rerender(
      <Table<Person>
        caption="People"
        mode="server"
        loading
        data={[]}
        rowKey={(row) => row.id}
      >
        <Table.Pagination totalItems={25} onChange={onChange} />
        {columns}
      </Table>,
    );
    expect(container.querySelectorAll('tr[data-slot="loading"]')).toHaveLength(
      10,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('Table infinite scroll', () => {
  it('asks for more until totalItems are loaded', async () => {
    const onLoadMore = jest.fn();
    const { rerender } = renderTable(
      { mode: 'server', data: people.slice(0, 2) },
      <Table.InfiniteScroll totalItems={4} onLoadMore={onLoadMore} />,
    );
    // jsdom has no layout: the empty viewport counts as scrolled to its end.
    await waitFor(() => expect(onLoadMore).toHaveBeenCalledTimes(1));
    // The footer's button is the keyboard path to the same load.
    const loadMore = screen.getByRole('button', { name: 'Load more rows' });
    loadMore.focus();
    await userEvent.keyboard('{Enter}');
    expect(onLoadMore).toHaveBeenCalledTimes(2);
    loadMore.focus();
    rerender(
      <Table<Person>
        caption="People"
        mode="server"
        data={people}
        rowKey={(row) => row.id}
      >
        <Table.InfiniteScroll totalItems={4} onLoadMore={onLoadMore} />
        {columns}
      </Table>,
    );
    await act(() => Promise.resolve());
    expect(onLoadMore).toHaveBeenCalledTimes(2);
    // Every row is loaded: the button goes, and its focus moves to the table.
    expect(
      screen.queryByRole('button', { name: 'Load more rows' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'People' })).toHaveFocus();
  });

  it('keeps the load more button reachable with its loading reason', async () => {
    const { container } = renderTable(
      { mode: 'server', data: people.slice(0, 2), loading: true },
      <Table.InfiniteScroll totalItems={4} onLoadMore={() => undefined} />,
    );
    const loadMore = screen.getByRole('button', { name: 'Load more rows' });
    // Loading with a reason: disabled but tabbable so the reason is reachable;
    // it is the description.
    expect(loadMore).toHaveAttribute('aria-disabled', 'true');
    expect(loadMore).not.toHaveAttribute('tabindex', '-1');
    expect(loadMore).toHaveAccessibleDescription(/Loading more rows/);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('is ignored with a warning in client mode', () => {
    const warn = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);
    const onLoadMore = jest.fn();
    renderTable(
      {},
      <Table.InfiniteScroll totalItems={10} onLoadMore={onLoadMore} />,
    );
    expect(onLoadMore).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('ignored in client mode'),
    );
    warn.mockRestore();
  });
});

describe('Table reorder', () => {
  it('adds named drag handles, disabled with a reason while sorted', async () => {
    const onReorder = jest.fn();
    const { container } = renderTable(
      {},
      <>
        <Table.Sort />
        <Table.Reorder
          onReorder={onReorder}
          isRowDisabled={(row: Person) => row.id === 2}
        />
      </>,
    );
    // Named after the row, and described by the keyboard instructions:
    // Space picks up and drops, arrows move, Escape cancels.
    const handle = screen.getByRole('button', { name: 'Reorder Ada' });
    expect(handle).not.toHaveAttribute('aria-disabled');
    expect(handle).toHaveAccessibleDescription(
      /To pick up a row, press Space or Enter\. Move it with the arrow keys, drop it with Space or Enter, or cancel with Escape\./,
    );
    // A row pinned by `isRowDisabled`: silently disabled, out of tab order.
    const pinned = screen.getByRole('button', { name: 'Reorder Grace' });
    expect(pinned).toHaveAttribute('aria-disabled', 'true');
    expect(pinned).toHaveAttribute('tabindex', '-1');
    expect(await axe(container)).toHaveNoViolations();

    await userEvent.click(screen.getByRole('button', { name: 'Name' }));
    const sorted = screen.getByRole('button', { name: 'Reorder Ada' });
    // Disabled with a reason while sorted: tabbable so the reason is reachable;
    // it is the description.
    expect(sorted).toHaveAttribute('aria-disabled', 'true');
    expect(sorted).not.toHaveAttribute('tabindex', '-1');
    expect(sorted).toHaveAccessibleDescription(/Clear sorting to reorder rows/);
    sorted.focus();
    expect(sorted).toHaveFocus();
    await userEvent.keyboard('[Space]{Enter}');
    expect(onReorder).not.toHaveBeenCalled();

    // Clearing the sort (descending, then off) re-enables the handles.
    await userEvent.click(screen.getByRole('button', { name: 'Name' }));
    await userEvent.click(screen.getByRole('button', { name: 'Name' }));
    expect(
      screen.getByRole('button', { name: 'Reorder Ada' }),
    ).not.toHaveAttribute('aria-disabled');
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('Table column order', () => {
  const Wrapper = () => {
    const [extra, setExtra] = useState(false);
    return (
      <>
        <Table.Column<Person> id="team" title="Team" dataKey="team" />
        {extra && (
          <Table.Column<Person> id="salary" title="Salary" dataKey="salary" />
        )}
        <Table.Column<Person> id="toggle" title="Toggle">
          {(_, row) =>
            row.id === 1 ? (
              <button type="button" onClick={() => setExtra((value) => !value)}>
                toggle
              </button>
            ) : null
          }
        </Table.Column>
      </>
    );
  };

  it('follows render order, including columns inside wrapper components', async () => {
    renderUI(
      <Table<Person> caption="People" data={people} rowKey={(row) => row.id}>
        <Table.Column<Person> id="name" title="Name" dataKey="name" />
        <Wrapper />
        <Table.Column<Person> id="active" title="Active">
          {(_, row) => (row.active ? 'yes' : 'no')}
        </Table.Column>
      </Table>,
    );
    const headers = () =>
      screen.getAllByRole('columnheader').map((th) => th.textContent);
    expect(headers()).toEqual(['Name', 'Team', 'Toggle', 'Active']);
    await userEvent.click(screen.getByRole('button', { name: 'toggle' }));
    expect(headers()).toEqual(['Name', 'Team', 'Salary', 'Toggle', 'Active']);
  });
});

describe('Table virtualized', () => {
  it('renders rows through the virtualizer with hidden spacers', async () => {
    const many = Array.from({ length: 200 }, (_, index) => ({
      ...people[index % 4],
      id: index + 1,
      name: `Person ${index + 1}`,
    }));
    // jsdom has no layout: give the viewport and rows a size to virtualize.
    const viewportHeight = jest
      .spyOn(HTMLElement.prototype, 'offsetHeight', 'get')
      .mockReturnValue(400);
    // The virtualizer reads the scroll element's client size.
    const viewportClientHeight = jest
      .spyOn(HTMLElement.prototype, 'clientHeight', 'get')
      .mockReturnValue(400);
    const rect = jest
      .spyOn(Element.prototype, 'getBoundingClientRect')
      .mockReturnValue({
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: 800,
        bottom: 37,
        width: 800,
        height: 37,
        toJSON: () => ({}),
      });
    const { container } = renderTable({ data: many, virtualized: true });
    expect(names().length).toBeGreaterThan(0);
    expect(names().length).toBeLessThan(200);
    expect(names()[0]).toBe('Person 1');
    expect(screen.getByRole('table')).toHaveAttribute('aria-rowcount', '201');
    for (const spacer of Array.from(
      container.querySelectorAll('tr[data-slot="spacer"]'),
    ))
      expect(spacer.closest('tbody')).toHaveAttribute('aria-hidden', 'true');
    expect(await axe(container)).toHaveNoViolations();
    viewportHeight.mockRestore();
    viewportClientHeight.mockRestore();
    rect.mockRestore();
  });
});
