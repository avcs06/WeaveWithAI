import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';

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
const names = () =>
  bodyRows().map(
    (row) =>
      within(row).getAllByRole('cell', { hidden: true }).at(0)?.textContent,
  );
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
    expect(
      screen.getAllByRole('columnheader').map((th) => th.textContent),
    ).toEqual(['Name', 'Team', 'Salary']);
    expect(bodyRows()[0]).toHaveAttribute('aria-rowindex', '2');
    expect(names()).toEqual(['Ada', 'Grace', 'Linus', 'Edsger']);
    expect(footer()).toBe('Showing 4 of 4 rows');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('sorts ascending, descending, then off from the column header', async () => {
    renderTable({}, <Table.Sort />);
    const header = screen.getByRole('columnheader', { name: 'Salary' });
    const sort = within(header).getByRole('button', { name: 'Salary' });
    await userEvent.click(sort);
    expect(header).toHaveAttribute('aria-sort', 'ascending');
    expect(names()).toEqual(['Edsger', 'Linus', 'Ada', 'Grace']);
    await userEvent.click(sort);
    expect(header).toHaveAttribute('aria-sort', 'descending');
    expect(names()).toEqual(['Grace', 'Ada', 'Linus', 'Edsger']);
    await userEvent.click(sort);
    expect(header).toHaveAttribute('aria-sort', 'none');
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
    expect(names()).toEqual(['Ada', 'Edsger', 'Grace', 'Linus']);
  });

  it('filters by text from a named popover', async () => {
    renderTable({}, <Table.Filter />);
    await userEvent.click(screen.getByRole('button', { name: 'Filter Name' }));
    const popover = await screen.findByRole('dialog', { name: 'Filter Name' });
    expect(await axe(document.body)).toHaveNoViolations();
    await userEvent.type(within(popover).getByRole('textbox'), 'gr');
    await waitFor(() => expect(names()).toEqual(['Grace']));
    expect(footer()).toBe('Showing 1 of 1 match · Filtered from 4');
    expect(
      screen.getByRole('button', { name: 'Filter Name (active)' }),
    ).toBeInTheDocument();
  });

  it('filters by enum with checkbox menu items', async () => {
    renderTable({}, <Table.Filter />);
    await userEvent.click(screen.getByRole('button', { name: 'Filter Team' }));
    const design = await screen.findByRole('menuitemcheckbox', {
      name: /Design/,
    });
    expect(await axe(document.body)).toHaveNoViolations();
    await userEvent.click(design);
    expect(design).toHaveAttribute('aria-checked', 'true');
    expect(names()).toEqual(['Linus']);
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
    expect(screen.getByRole('status')).toHaveTextContent('Loading…');
    expect(container.querySelectorAll('tr[data-slot="loading"]')).toHaveLength(
      6,
    );
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
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Select row 1' }),
    );
    expect(onChange).toHaveBeenLastCalledWith([1]);
    expect(
      screen.queryByRole('checkbox', { name: 'Select row 3' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: 'Select row 4' }),
    ).toBeDisabled();

    const all = screen.getByRole('checkbox', { name: 'Select all rows' });
    expect(all).toHaveAttribute('aria-checked', 'mixed');
    await userEvent.click(all);
    expect(onChange).toHaveBeenLastCalledWith([1, 2]);
    expect(footer()).toBe('Showing 4 of 4 rows · 2 rows selected');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('keeps a selected row visible after it stops being selectable', () => {
    renderTable(
      {},
      <Table.Selection
        value={[3]}
        isRowSelectable={(row: Person) => row.active}
      />,
    );
    expect(
      screen.getByRole('checkbox', { name: 'Select row 3' }),
    ).toBeChecked();
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
    await userEvent.click(screen.getByRole('button', { name: 'Expand row 1' }));
    const details = screen.getByText('Details for Ada').closest('tr');
    expect(details).toHaveAttribute('aria-rowindex', '2');
    expect(await axe(container)).toHaveNoViolations();

    await userEvent.click(screen.getByText('Grace'));
    expect(screen.getByText('Details for Grace')).toBeInTheDocument();
    expect(onRowClick).not.toHaveBeenCalled();

    await userEvent.click(screen.getByText('Edsger'));
    expect(screen.queryByText('Details for Edsger')).not.toBeInTheDocument();
  });

  it('expands and collapses every enabled row from the header', async () => {
    const { container } = renderTable({}, expansion);
    await userEvent.click(
      screen.getByRole('button', { name: 'Expand all rows' }),
    );
    expect(screen.getAllByText(/Details for/)).toHaveLength(3);
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
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Select row 1' }),
    );
    expect(onRowClick).toHaveBeenCalledTimes(1);
  });

  it("ignores clicks in a cell's portalled menu", async () => {
    const onRowClick = jest.fn();
    renderTable(
      { onRowClick },
      <Table.Column<Person> id="actions" title="Actions">
        {(_, row) => (
          <Dropdown items={[{ key: 'edit', type: 'option', label: 'Edit' }]}>
            <button type="button">Actions for {row.name}</button>
          </Dropdown>
        )}
      </Table.Column>,
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Actions for Ada' }),
    );
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Edit' }),
    );
    expect(onRowClick).not.toHaveBeenCalled();
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
    expect(await axe(container)).toHaveNoViolations();

    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(footer()).toBe('Showing 11 to 20 of 25 rows');
    expect(bodyRows()[0]).toHaveAttribute('aria-rowindex', '12');
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    await userEvent.click(screen.getByRole('button', { name: 'Last' }));
    expect(names()).toEqual([
      'Person 21',
      'Person 22',
      'Person 23',
      'Person 24',
      'Person 25',
    ]);
    expect(screen.getByRole('button', { name: 'Next' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('emits pages and shows page-sized loading rows in server mode', async () => {
    const onChange = jest.fn();
    const { container, rerender } = renderTable(
      { mode: 'server', data: many.slice(0, 10) },
      <Table.Pagination totalItems={25} onChange={onChange} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Page 2' }));
    expect(onChange).toHaveBeenCalledWith({ pageIndex: 1, pageSize: 10 });

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
    expect(onLoadMore).toHaveBeenCalledTimes(1);
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
  it('adds named drag handles, disabled while sorted', async () => {
    const { container } = renderTable(
      {},
      <>
        <Table.Sort />
        <Table.Reorder onReorder={() => undefined} />
      </>,
    );
    const handle = screen.getByRole('button', { name: 'Reorder row 1' });
    expect(handle).toHaveAttribute('aria-disabled', 'false');
    expect(await axe(container)).toHaveNoViolations();
    await userEvent.click(screen.getByRole('button', { name: 'Name' }));
    expect(
      screen.getByRole('button', { name: 'Reorder row 1' }),
    ).toHaveAttribute('aria-disabled', 'true');
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
    rect.mockRestore();
  });
});
