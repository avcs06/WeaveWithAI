import { screen } from '@testing-library/react';
import { Home } from 'lucide-react';
import React, { type ComponentPropsWithRef } from 'react';

import { axe, renderUI } from '../test-utils';

import { SidebarMenu, SidebarMenuItem } from '.';

const slot = (element: Element, name: string) =>
  element.querySelector(`[data-slot="${name}"]`);

describe('SidebarMenu', () => {
  it('is a navigation landmark with the name, its header before the list and its footer after it', async () => {
    const { container } = renderUI(
      <SidebarMenu
        aria-label="Dashboards"
        data-testid="menu"
        header={<button type="button">Create</button>}
        footer={<span>member@example.com</span>}
      >
        <SidebarMenuItem href="/dashboards/1">Morning routine</SidebarMenuItem>
      </SidebarMenu>,
    );
    const nav = screen.getByRole('navigation', { name: 'Dashboards' });
    expect(nav).toContainElement(
      screen.getByRole('link', { name: 'Morning routine' }),
    );
    const shell = screen.getByTestId('menu');
    const header = screen.getByRole('button', { name: 'Create' });
    const list = slot(shell, 'list')!;
    const footer = slot(shell, 'footer')!;
    expect(
      header.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      list.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(footer).toContainElement(screen.getByText('member@example.com'));
    expect(await axe(container)).toHaveNoViolations();
  });

  it("marks the current page's row and leaves the others plain", () => {
    renderUI(
      <SidebarMenu aria-label="Pages">
        <SidebarMenuItem href="/a" selected>
          A
        </SidebarMenuItem>
        <SidebarMenuItem href="/b">B</SidebarMenuItem>
      </SidebarMenu>,
    );
    const current = screen.getByRole('link', { name: 'A' });
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current).toHaveAttribute('data-selected', 'true');
    expect(current).toHaveAttribute('data-slot', 'item');
    expect(screen.getByRole('link', { name: 'B' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('with as, the link component is the row: its href stays, the children are the label, and the state lands on it', () => {
    const PageLink = ({ children, ...props }: ComponentPropsWithRef<'a'>) => (
      <a {...props} data-kind="page-link">
        {children}
      </a>
    );
    renderUI(
      <SidebarMenu aria-label="Pages">
        <SidebarMenuItem
          as={PageLink}
          href="/home"
          className="shrink-0"
          selected
          leftIcon={<Home />}
        >
          Home
        </SidebarMenuItem>
      </SidebarMenu>,
    );
    const link = screen.getByRole('link', { name: 'Home' });
    expect(link).toHaveAttribute('href', '/home');
    expect(link).toHaveAttribute('data-kind', 'page-link');
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(link).toHaveAttribute('data-slot', 'item');
    expect(link).toHaveAttribute('data-left', 'true');
    expect(link.className).toContain('shrink-0');
    expect(slot(link, 'label')).toHaveTextContent('Home');
    expect(slot(link, 'icon')).toBeInTheDocument();
  });

  it('with as="div", a header or footer row holds its piece as it is: no link, label or state of its own', async () => {
    const { container } = renderUI(
      <SidebarMenu
        aria-label="Pages"
        header={
          <SidebarMenuItem as="div" data-testid="row" className="shrink-0">
            <button type="button">Create</button>
          </SidebarMenuItem>
        }
      >
        <SidebarMenuItem href="/home">Home</SidebarMenuItem>
      </SidebarMenu>,
    );
    const row = screen.getByTestId('row');
    expect(row.tagName).toBe('DIV');
    expect(row).not.toHaveAttribute('data-slot');
    expect(row).not.toHaveAttribute('aria-current');
    expect(row.className).toContain('shrink-0');
    expect(slot(row, 'label')).toBeNull();
    expect(row).toContainElement(
      screen.getByRole('button', { name: 'Create' }),
    );
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(await axe(container)).toHaveNoViolations();
  });
});
