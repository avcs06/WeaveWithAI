import { screen } from '@testing-library/react';
import { Home } from 'lucide-react';
import React from 'react';

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

  it('with asChild, the child link takes the row: its href stays, its text is the label, and the state lands on it', () => {
    renderUI(
      <SidebarMenu aria-label="Pages">
        <SidebarMenuItem asChild selected leftIcon={<Home />}>
          <a href="/home" className="shrink-0">
            Home
          </a>
        </SidebarMenuItem>
      </SidebarMenu>,
    );
    const link = screen.getByRole('link', { name: 'Home' });
    expect(link).toHaveAttribute('href', '/home');
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(link).toHaveAttribute('data-slot', 'item');
    expect(link).toHaveAttribute('data-left', 'true');
    expect(link.className).toContain('shrink-0');
    expect(slot(link, 'label')).toHaveTextContent('Home');
    expect(slot(link, 'icon')).toBeInTheDocument();
  });
});
