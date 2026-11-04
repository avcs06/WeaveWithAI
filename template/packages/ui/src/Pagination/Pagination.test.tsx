import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';

import { axe, renderUI } from '../test-utils';

import { Pagination, type PaginationProps, type PaginationValue } from '.';

const info = () =>
  document.querySelector('[data-slot="pagination-info"]')?.textContent;
const button = (name: string) => screen.getByRole('button', { name });
const pageNumbers = () =>
  screen
    .getAllByRole('button', { name: /^Page \d+$/ })
    .map((element) => element.textContent);

const Sessions = ({
  label = 'Sessions pagination',
  totalItems = 95,
  ...props
}: Partial<PaginationProps>) => (
  <Pagination
    {...(props as PaginationProps)}
    label={label}
    totalItems={totalItems}
  />
);

describe('Pagination', () => {
  it('a named navigation with the range, a page-size select and the page buttons', async () => {
    const { container } = renderUI(<Sessions />);
    expect(
      screen.getByRole('navigation', { name: 'Sessions pagination' }),
    ).toBeInTheDocument();
    expect(info()).toBe('Showing 1 to 10 of 95 items');
    expect(
      screen.getByRole('combobox', { name: 'Items per page' }),
    ).toBeInTheDocument();
    expect(pageNumbers()).toEqual(['1', '2', '3', '4', '5']);
    expect(button('Page 1')).toHaveAttribute('aria-current', 'page');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('on the first page, the backward buttons are disabled and leave the tab order; on the last, the forward ones', async () => {
    renderUI(<Sessions />);
    for (const name of ['First', 'Previous']) {
      expect(button(name)).toHaveAttribute('aria-disabled', 'true');
      expect(button(name)).toHaveAttribute('tabindex', '-1');
    }
    await userEvent.click(button('Last'));
    expect(info()).toBe('Showing 91 to 95 of 95 items');
    for (const name of ['Next', 'Last']) {
      expect(button(name)).toHaveAttribute('aria-disabled', 'true');
    }
    expect(button('First')).not.toHaveAttribute('aria-disabled');
  });

  it('uncontrolled: a page button moves there, and onChange reports it', async () => {
    const onChange = jest.fn();
    renderUI(<Sessions onChange={onChange} />);
    await userEvent.click(button('Page 3'));
    expect(onChange).toHaveBeenLastCalledWith({ pageIndex: 2, pageSize: 10 });
    expect(info()).toBe('Showing 21 to 30 of 95 items');
    expect(button('Page 3')).toHaveAttribute('aria-current', 'page');
    // The window of five stays around the current page.
    await userEvent.click(button('Next'));
    await userEvent.click(button('Next'));
    expect(pageNumbers()).toEqual(['3', '4', '5', '6', '7']);
  });

  it('defaultValue sets the first page and size', () => {
    renderUI(<Sessions defaultValue={{ pageIndex: 1, pageSize: 25 }} />);
    expect(info()).toBe('Showing 26 to 50 of 95 items');
  });

  it('controlled: the page changes only through onChange', async () => {
    const onChange = jest.fn();
    const { rerender } = renderUI(
      <Sessions value={{ pageIndex: 0, pageSize: 10 }} onChange={onChange} />,
    );
    await userEvent.click(button('Next'));
    expect(onChange).toHaveBeenLastCalledWith({ pageIndex: 1, pageSize: 10 });
    expect(info()).toBe('Showing 1 to 10 of 95 items');
    rerender(
      <Sessions value={{ pageIndex: 1, pageSize: 10 }} onChange={onChange} />,
    );
    expect(info()).toBe('Showing 11 to 20 of 95 items');
  });

  it('a new page size goes back to page one', async () => {
    const Paged = () => {
      const [page, setPage] = useState<PaginationValue>({
        pageIndex: 3,
        pageSize: 10,
      });
      return <Sessions value={page} onChange={setPage} />;
    };
    renderUI(<Paged />);
    await userEvent.click(
      screen.getByRole('combobox', { name: 'Items per page' }),
    );
    await userEvent.click(
      await screen.findByRole('option', { name: '25 / page' }),
    );
    expect(info()).toBe('Showing 1 to 25 of 95 items');
  });

  it('a page past the last shows the last', () => {
    renderUI(<Sessions value={{ pageIndex: 40, pageSize: 10 }} />);
    expect(info()).toBe('Showing 91 to 95 of 95 items');
    expect(button('Page 10')).toHaveAttribute('aria-current', 'page');
  });

  it('itemName names the items in the info and the select', () => {
    renderUI(<Sessions itemName={['session', 'sessions']} />);
    expect(info()).toBe('Showing 1 to 10 of 95 sessions');
    expect(
      screen.getByRole('combobox', { name: 'Sessions per page' }),
    ).toBeInTheDocument();
  });

  it('filtered: matches, from how many, and a selection count', () => {
    renderUI(
      <Sessions
        totalItems={37}
        itemName={['session', 'sessions']}
        filtered
        unfilteredTotal={95}
        selectedCount={1}
      />,
    );
    expect(info()).toBe(
      'Showing 1 to 10 of 37 matches · Filtered from 95 · 1 session selected',
    );
  });

  it('with no items, one page and an empty range', () => {
    renderUI(<Sessions totalItems={0} />);
    expect(info()).toBe('Showing 0 to 0 of 0 items');
    expect(pageNumbers()).toEqual(['1']);
  });

  it('showInfo false leaves out the range', () => {
    renderUI(<Sessions showInfo={false} />);
    expect(info()).toBeUndefined();
  });

  it('minimal shows only the current page between Previous and Next', () => {
    renderUI(<Sessions size="minimal" />);
    expect(pageNumbers()).toEqual(['1']);
    expect(screen.queryByRole('button', { name: 'First' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Last' })).toBeNull();
  });

  it('icons: the buttons keep their names from their tooltips', async () => {
    const { container } = renderUI(<Sessions content="icons" />);
    for (const name of [
      'First page',
      'Previous page',
      'Next page',
      'Last page',
    ])
      expect(button(name)).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('disabled: every control is disabled and leaves the tab order', async () => {
    renderUI(<Sessions disabled />);
    for (const name of ['Next', 'Page 2']) {
      expect(button(name)).toHaveAttribute('aria-disabled', 'true');
      expect(button(name)).toHaveAttribute('tabindex', '-1');
    }
    await userEvent.click(button('Page 2'));
    expect(info()).toBe('Showing 1 to 10 of 95 items');
  });

  it('disabledWithReason: every control keeps its tab stop and says why', async () => {
    const { container } = renderUI(
      <Sessions disabledWithReason="Loading the page" />,
    );
    for (const name of ['First', 'Next', 'Page 2']) {
      expect(button(name)).toHaveAttribute('aria-disabled', 'true');
      expect(button(name)).not.toHaveAttribute('tabindex', '-1');
      expect(button(name)).toHaveAccessibleDescription('Loading the page');
    }
    await userEvent.click(button('Next'));
    expect(info()).toBe('Showing 1 to 10 of 95 items');
    expect(await axe(container)).toHaveNoViolations();
  });
});
