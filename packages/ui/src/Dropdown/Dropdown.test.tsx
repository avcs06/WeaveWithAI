import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { axe, renderUI } from '../test-utils';

import { Dropdown, type DropdownEntry } from './index';

const trigger = () => screen.getByRole('button', { name: 'Actions' });

// Native triggers isolate Dropdown behavior from the separately tested Button.
describe('Dropdown contract', () => {
  it('opens contract items, selects once, closes and restores trigger focus', async () => {
    const onSelect = jest.fn();
    renderUI(
      <Dropdown
        items={[{ type: 'item', key: 'rename', label: 'Rename', onSelect }]}
      >
        <button>Actions</button>
      </Dropdown>,
    );
    expect(screen.queryByRole('menu')).toBeNull();
    await userEvent.click(trigger());
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Rename' }),
    );
    expect(onSelect).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    await waitFor(() => expect(trigger()).toHaveFocus());
  });

  it('keeps the menu open when selection is prevented', async () => {
    renderUI(
      <Dropdown
        items={[
          {
            type: 'item',
            key: 'keep',
            label: 'Keep open',
            onSelect: (event) => event.preventDefault(),
          },
        ]}
      >
        <button>Actions</button>
      </Dropdown>,
    );
    await userEvent.click(trigger());
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Keep open' }),
    );
    expect(screen.getByRole('menu')).toBeVisible();
  });

  it('calls the custom renderer only for leaves within structural groups and submenus', async () => {
    type Action = { id: string; title: string };
    const leaf: Action = { id: 'copy', title: 'Copy link' };
    const items: readonly DropdownEntry<Action>[] = [
      {
        type: 'group',
        key: 'group',
        label: 'Sharing',
        items: [
          { type: 'submenu', key: 'share', label: 'Share', items: [leaf] },
        ],
      },
    ];
    const renderer = jest.fn((item: Action) => (
      <Dropdown.Item key={item.id} label={item.title} />
    ));
    renderUI(
      <Dropdown items={items} itemRenderer={renderer}>
        <button>Actions</button>
      </Dropdown>,
    );
    await userEvent.click(trigger());
    const submenuTrigger = await screen.findByRole('menuitem', {
      name: 'Share',
    });
    submenuTrigger.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(
      await screen.findByRole('menuitem', { name: 'Copy link' }),
    ).toBeVisible();
    expect(renderer).toHaveBeenCalled();
    expect(renderer.mock.calls.every(([item]) => item === leaf)).toBe(true);
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('opens an authored submenu using its Item child as trigger', async () => {
    renderUI(
      <Dropdown
        menu={
          <Dropdown.SubMenu menu={<Dropdown.Item label="Copy link" />}>
            <Dropdown.Item label="Share" />
          </Dropdown.SubMenu>
        }
      >
        <button>Actions</button>
      </Dropdown>,
    );
    await userEvent.click(trigger());
    const share = await screen.findByRole('menuitem', { name: 'Share' });
    expect(share).toHaveAttribute('aria-haspopup', 'menu');
    share.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(
      await screen.findByRole('menuitem', { name: 'Copy link' }),
    ).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => expect(share).toHaveFocus());
  });

  it('skips disabled items on keyboard navigation and closes with Escape', async () => {
    const onSelect = jest.fn();
    renderUI(
      <Dropdown
        items={[
          {
            type: 'item',
            key: 'disabled',
            label: 'Delete',
            disabledReason: 'No permission',
            onSelect,
          },
          { type: 'item', key: 'rename', label: 'Rename' },
        ]}
      >
        <button>Actions</button>
      </Dropdown>,
    );
    trigger().focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(
      await screen.findByRole('menuitem', { name: 'Rename' }),
    ).toHaveFocus();
    const disabled = screen.getByRole('menuitem', { name: 'Delete' });
    expect(disabled).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(disabled);
    expect(onSelect).not.toHaveBeenCalled();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(trigger()).toHaveFocus());
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('renders all four independent icon/slot parts', async () => {
    renderUI(
      <Dropdown
        items={[
          {
            type: 'item',
            key: 'save',
            label: 'Save',
            leftSlot: <span>Left slot</span>,
            leftIcon: <span>Left icon</span>,
            rightIcon: <span>Right icon</span>,
            rightSlot: <span>Right slot</span>,
          },
        ]}
      >
        <button>Actions</button>
      </Dropdown>,
    );
    await userEvent.click(trigger());
    const item = await screen.findByRole('menuitem', { name: /Save/ });
    for (const text of ['Left slot', 'Left icon', 'Right icon', 'Right slot']) {
      expect(within(item).getByText(text)).toBeVisible();
    }
  });

  it('reports controlled open requests without changing the controlled value', async () => {
    const onOpenChange = jest.fn();
    renderUI(
      <Dropdown open={false} onOpenChange={onOpenChange} items={[]}>
        <button>Actions</button>
      </Dropdown>,
    );
    await userEvent.click(trigger());
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('updates source labels and callbacks without remounting the root', async () => {
    const oldSelect = jest.fn();
    const newSelect = jest.fn();
    const ui = (label: string, onSelect: (event: Event) => void) => (
      <Dropdown open items={[{ type: 'item', key: 'action', label, onSelect }]}>
        <button>Actions</button>
      </Dropdown>
    );
    const { rerender } = renderUI(ui('Old action', oldSelect));
    expect(
      await screen.findByRole('menuitem', { name: 'Old action' }),
    ).toBeVisible();
    rerender(ui('New action', newSelect));
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'New action' }),
    );
    expect(newSelect).toHaveBeenCalledTimes(1);
    expect(oldSelect).not.toHaveBeenCalled();
    expect(screen.queryByRole('menuitem', { name: 'Old action' })).toBeNull();
  });

  it('has accessible closed-trigger markup', async () => {
    const { container } = renderUI(
      <Dropdown items={[]}>
        <button>Actions</button>
      </Dropdown>,
    );
    expect(trigger()).toHaveAttribute('aria-haspopup', 'menu');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has accessible open menu, group, separator and disabled item markup', async () => {
    renderUI(
      <Dropdown
        defaultOpen
        menu={
          <>
            <Dropdown.Group label="Actions">
              <Dropdown.Item label="Rename" />
            </Dropdown.Group>
            <Dropdown.Separator />
            <Dropdown.Item label="Delete" disabledReason="No permission" />
          </>
        }
      >
        <button>Actions</button>
      </Dropdown>,
    );
    expect(await screen.findByRole('menu')).toBeVisible();
    expect(screen.getByRole('group', { name: 'Actions' })).toBeInTheDocument();
    expect(screen.getByRole('separator')).toBeInTheDocument();
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
