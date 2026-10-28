import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Plus, Settings } from 'lucide-react';
import Link from 'next/link';
import React, {
  type ComponentPropsWithRef,
  createRef,
  type ReactNode,
} from 'react';

import { axe, renderUI } from '../test-utils';

import { buttonRecipe } from './Button.recipes.css';

import { Button, IconButton, PlainButton } from '.';

const { variants } = buttonRecipe.classNames;

const button = (name: string | RegExp) => screen.getByRole('button', { name });
const link = (name: string | RegExp) => screen.getByRole('link', { name });

// The shown tooltip is aria-hidden, so role queries need `hidden`.
const tooltipEntries = async () => {
  await screen.findByRole('tooltip', { hidden: true });
  return Array.from(
    document.querySelectorAll('[data-side] > div'),
    (entry) => entry.textContent,
  );
};

const noTooltip = () =>
  expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull();

// Handlers for every activation path, to check none runs while disabled.
const activationHandlers = () => ({
  onClick: jest.fn(),
  onPointerDown: jest.fn(),
  onKeyDown: jest.fn(),
});

describe('Button', () => {
  it('is a button with type="button", in the sm default look', async () => {
    const { container } = renderUI(<Button>Save</Button>);
    expect(button('Save')).toHaveAttribute('type', 'button');
    expect(button('Save')).toHaveClass(
      variants.variant.default,
      variants.size.sm,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('is reached by Tab in order, and Enter and Space press it', async () => {
    const onSave = jest.fn();
    const onCancel = jest.fn();
    const { container } = renderUI(
      <>
        <Button variant="base" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSave}>Save</Button>
      </>,
    );
    await userEvent.tab();
    expect(button('Cancel')).toHaveFocus();
    await userEvent.tab();
    expect(button('Save')).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onSave).toHaveBeenCalledTimes(1);
    await userEvent.keyboard('[Space]');
    expect(onSave).toHaveBeenCalledTimes(2);
    expect(onCancel).not.toHaveBeenCalled();
    await userEvent.tab({ shift: true });
    expect(button('Cancel')).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('applies variant, size and look', () => {
    renderUI(
      <Button variant="danger" size="md" look="rounded ghost">
        Delete
      </Button>,
    );
    expect(button('Delete')).toHaveClass(
      variants.variant.danger,
      variants.size.md,
      variants.rounded.true,
      variants.ghost.true,
    );
  });

  it('keeps native submit, and only submits when enabled', async () => {
    const onSubmit = jest.fn((event: React.FormEvent) =>
      event.preventDefault(),
    );
    const { rerender } = renderUI(
      <form onSubmit={onSubmit}>
        <Button type="submit">Save</Button>
      </form>,
    );
    await userEvent.click(button('Save'));
    expect(onSubmit).toHaveBeenCalledTimes(1);

    rerender(
      <form onSubmit={onSubmit}>
        <Button type="submit" disabled>
          Save
        </Button>
      </form>,
    );
    await userEvent.click(button('Save'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('puts icons and add-ons around the label', async () => {
    const { container } = renderUI(
      <Button leftIcon={<Plus data-testid="left" />} rightAddOn={<kbd>N</kbd>}>
        New event
      </Button>,
    );
    const element = button('New event N');
    expect(element.firstElementChild).toBe(screen.getByTestId('left'));
    expect(screen.getByTestId('left')).toHaveAttribute('data-slot', 'icon');
    expect(element.lastElementChild).toHaveAttribute('data-slot', 'add-on');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('when loading: a spinner in the icon slot, the label kept, disabled', async () => {
    const onClick = jest.fn();
    const { container } = renderUI(
      <Button loading leftIcon={<Plus data-testid="icon" />} onClick={onClick}>
        Save
      </Button>,
    );
    expect(screen.queryByTestId('icon')).toBeNull();
    const element = button('Save');
    expect(element).toHaveAttribute('aria-busy', 'true');
    expect(element).toHaveAttribute('aria-disabled', 'true');
    // Never the native attribute: aria-disabled keeps it discoverable.
    expect(element).not.toBeDisabled();
    // No reason to reach, so silently-loading leaves the tab order, and the
    // load is announced through the status region aria-busy can't give.
    expect(element).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('status')).toHaveTextContent('Loading…');
    await userEvent.click(element);
    element.focus();
    await userEvent.keyboard('{Enter}[Space]');
    expect(onClick).not.toHaveBeenCalled();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('with a loading reason: busy, disabled, and the reason reachable', async () => {
    const onClick = jest.fn();
    const { container } = renderUI(
      <Button
        tooltip="Sends the export by email"
        loadingWithReason="Exporting the guest list"
        onClick={onClick}
      >
        Export guests
      </Button>,
    );
    const element = button('Export guests');
    expect(element).toHaveAttribute('aria-busy', 'true');
    expect(element).toHaveAttribute('aria-disabled', 'true');
    expect(element).not.toBeDisabled();
    expect(element).not.toHaveAttribute('tabindex', '-1');
    expect(element).toHaveAccessibleDescription(
      'Sends the export by email Exporting the guest list',
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'Exporting the guest list',
    );
    await userEvent.tab();
    expect(element).toHaveFocus();
    await userEvent.keyboard('{Enter}[Space]');
    await userEvent.click(element);
    expect(onClick).not.toHaveBeenCalled();
    await userEvent.hover(element);
    expect(await tooltipEntries()).toEqual([
      'Sends the export by email',
      'Exporting the guest list',
    ]);
    await userEvent.keyboard('{Escape}');
    noTooltip();
    expect(element).toHaveFocus();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('when loading with disableWhileLoading={false}: still pressable', async () => {
    const onClick = jest.fn();
    const { container } = renderUI(
      <Button loading disableWhileLoading={false} onClick={onClick}>
        Stop
      </Button>,
    );
    const element = button('Stop');
    expect(element).toHaveAttribute('aria-busy', 'true');
    expect(element).not.toHaveAttribute('aria-disabled');
    expect(element).not.toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('status')).toHaveTextContent('Loading…');
    await userEvent.tab();
    expect(element).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard('[Space]');
    await userEvent.click(element);
    expect(onClick).toHaveBeenCalledTimes(3);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('when disabled: no activation, out of the tab order', async () => {
    const handlers = activationHandlers();
    const onKeyUp = jest.fn();
    const { container } = renderUI(
      <Button disabled {...handlers} onKeyUp={onKeyUp}>
        Save
      </Button>,
    );
    const element = button('Save');
    expect(element).not.toBeDisabled();
    expect(element).not.toHaveAttribute('disabled');
    expect(element).toHaveAttribute('aria-disabled', 'true');
    expect(element).toHaveAttribute('data-disabled');
    expect(element).toHaveAttribute('tabindex', '-1');
    await userEvent.tab();
    expect(element).not.toHaveFocus();

    await userEvent.click(element);
    element.focus();
    await userEvent.keyboard('{Enter}[Space]a');
    expect(handlers.onClick).not.toHaveBeenCalled();
    expect(handlers.onPointerDown).not.toHaveBeenCalled();
    expect(handlers.onKeyDown).toHaveBeenCalledTimes(1);
    expect(onKeyUp).toHaveBeenCalled();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('readOnly and loading with disableWhileLoading also disable', async () => {
    const onClick = jest.fn();
    const { container } = renderUI(
      <>
        <Button readOnly onClick={onClick}>
          Read-only
        </Button>
        <Button loading disableWhileLoading onClick={onClick}>
          Saving
        </Button>
      </>,
    );
    // Silently inert, so both leave the tab order like a disabled button.
    for (const element of [button('Read-only'), button('Saving')]) {
      expect(element).toHaveAttribute('aria-disabled', 'true');
      expect(element).not.toBeDisabled();
      expect(element).toHaveAttribute('tabindex', '-1');
      await userEvent.click(element);
      element.focus();
      await userEvent.keyboard('{Enter}[Space]');
    }
    expect(onClick).not.toHaveBeenCalled();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('with a read-only reason: inert, and the reason reachable', async () => {
    const onClick = jest.fn();
    const { container } = renderUI(
      <Button
        tooltip="Changes the schedule"
        readOnlyWithReason="Only organizers can edit the schedule"
        onClick={onClick}
      >
        Edit schedule
      </Button>,
    );
    const element = button('Edit schedule');
    expect(element).toHaveAttribute('aria-disabled', 'true');
    expect(element).not.toBeDisabled();
    expect(element).not.toHaveAttribute('tabindex', '-1');
    expect(element).toHaveAccessibleDescription(
      'Changes the schedule Only organizers can edit the schedule',
    );
    await userEvent.tab();
    expect(element).toHaveFocus();
    await userEvent.keyboard('{Enter}[Space]');
    await userEvent.click(element);
    expect(onClick).not.toHaveBeenCalled();
    await userEvent.hover(element);
    expect(await tooltipEntries()).toEqual([
      'Changes the schedule',
      'Only organizers can edit the schedule',
    ]);
    expect(await axe(document.body)).toHaveNoViolations();
    expect(container).toBeInTheDocument();
  });

  it('with a disabled reason: disabled, the reason under the tooltip', async () => {
    const handlers = activationHandlers();
    renderUI(
      <Button
        tooltip="Publishes the event"
        disabledWithReason="Add a date first"
        {...handlers}
      >
        Publish
      </Button>,
    );
    const element = button('Publish');
    expect(element).toHaveAttribute('aria-disabled', 'true');
    expect(element).not.toBeDisabled();
    expect(element).not.toHaveAttribute('disabled');
    // The reason must be reachable by keyboard, so it keeps its tab stop.
    expect(element).not.toHaveAttribute('tabindex', '-1');
    expect(element).toHaveAccessibleDescription(
      'Publishes the event Add a date first',
    );
    await userEvent.tab();
    expect(element).toHaveFocus();
    await userEvent.keyboard('{Enter}[Space]');
    await userEvent.click(element);
    expect(handlers.onClick).not.toHaveBeenCalled();
    expect(handlers.onPointerDown).not.toHaveBeenCalled();
    await userEvent.hover(element);
    expect(await tooltipEntries()).toEqual([
      'Publishes the event',
      'Add a date first',
    ]);
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('tab order: silent states are skipped, reasons keep their stop', async () => {
    const { container } = renderUI(
      <>
        <Button>First</Button>
        <Button disabled>Silent disabled</Button>
        <Button disabledWithReason="Add a date first">With reason</Button>
        <Button loading>Silent loading</Button>
        <Button>Last</Button>
      </>,
    );
    await userEvent.tab();
    expect(button('First')).toHaveFocus();
    await userEvent.tab();
    expect(button('With reason')).toHaveFocus();
    await userEvent.tab();
    expect(button('Last')).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(button('With reason')).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(button('First')).toHaveFocus();
    expect(button('Silent disabled')).toHaveAttribute('tabindex', '-1');
    expect(button('Silent loading')).toHaveAttribute('tabindex', '-1');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('a tooltip that repeats the name is not also the description', async () => {
    const { container } = renderUI(
      <Button tooltip="Publish" disabledWithReason="Add a date first">
        Publish
      </Button>,
    );
    // The sighted tooltip still shows both; screen readers hear the name
    // once, then only the reason as the description.
    expect(button('Publish')).toHaveAccessibleDescription('Add a date first');
    await userEvent.hover(button('Publish'));
    expect(await tooltipEntries()).toEqual(['Publish', 'Add a date first']);
    expect(await axe(document.body)).toHaveNoViolations();
    expect(container).toBeInTheDocument();
  });

  it('as a Radix trigger: opens, but not while disabled', async () => {
    const menu = (disabled: boolean) => (
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <Button disabled={disabled}>Actions</Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content>
            <DropdownMenu.Item>Duplicate</DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    );
    const { rerender } = renderUI(menu(true));
    await userEvent.click(button('Actions'));
    button('Actions').focus();
    await userEvent.keyboard('{Enter}');
    expect(screen.queryByRole('menu')).toBeNull();

    rerender(menu(false));
    // An open menu hides everything outside it from assistive tech.
    const trigger = button('Actions');
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    trigger.focus();
    expect(trigger).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(await screen.findByRole('menu')).toBeInTheDocument();
    expect(trigger).toHaveAttribute('data-state', 'open');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menuitem', { name: 'Duplicate' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('passes its ref to the button', () => {
    const ref = createRef<HTMLButtonElement>();
    renderUI(<Button ref={ref}>Save</Button>);
    expect(ref.current).toBe(button('Save'));
  });
});

describe('Button as a Next.js Link', () => {
  it('keeps its own `target` and stays a link', () => {
    renderUI(
      <Button as={Link} href="/docs" target="_blank" rel="noreferrer">
        Docs
      </Button>,
    );
    const element = link('Docs');
    expect(element.tagName).toBe('A');
    expect(element).toHaveAttribute('target', '_blank');
  });

  it('is a link to its href, without a button type, with the anchor as its ref', async () => {
    const ref = createRef<HTMLAnchorElement>();
    const onClick = jest.fn((event: React.MouseEvent) =>
      event.preventDefault(),
    );
    const { container } = renderUI(
      <Button
        as={Link}
        href="/settings"
        prefetch={false}
        ref={ref}
        onClick={onClick}
      >
        Settings
      </Button>,
    );
    const element = link('Settings');
    expect(element).toHaveAttribute('href', '/settings');
    expect(element).not.toHaveAttribute('prefetch');
    expect(element).not.toHaveAttribute('type');
    expect(element).not.toHaveAttribute('aria-disabled');
    expect(ref.current).toBe(element);
    await userEvent.tab();
    expect(element).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);
    await userEvent.click(element);
    expect(onClick).toHaveBeenCalledTimes(2);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('when disabled: an anchor without href, out of the tab order', async () => {
    const handlers = activationHandlers();
    const { container } = renderUI(
      <Button
        as={Link}
        href="/settings"
        prefetch={false}
        disabled
        {...handlers}
      >
        Settings
      </Button>,
    );
    // Without href it needs an explicit role to still read as a link.
    const element = link('Settings');
    expect(element.tagName).toBe('A');
    expect(element).not.toHaveAttribute('href');
    expect(element).not.toHaveAttribute('prefetch');
    expect(element).toHaveAttribute('role', 'link');
    expect(element).toHaveAttribute('aria-disabled', 'true');
    expect(element).not.toHaveAttribute('disabled');
    expect(element).toHaveAttribute('tabindex', '-1');
    await userEvent.tab();
    expect(element).not.toHaveFocus();
    await userEvent.click(element);
    element.focus();
    await userEvent.keyboard('{Enter}');
    expect(handlers.onClick).not.toHaveBeenCalled();
    expect(handlers.onPointerDown).not.toHaveBeenCalled();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('with a disabled reason: no href, but the reason keeps its tab stop', async () => {
    const onClick = jest.fn();
    renderUI(
      <Button
        as={Link}
        href="/settings"
        tooltip="Opens your settings"
        disabledWithReason="Only admins can change settings"
        onClick={onClick}
      >
        Settings
      </Button>,
    );
    const element = link('Settings');
    expect(element).not.toHaveAttribute('href');
    expect(element).toHaveAttribute('aria-disabled', 'true');
    expect(element).not.toHaveAttribute('disabled');
    // An anchor without href is not focusable on its own: it needs tabindex.
    expect(element).toHaveAttribute('tabindex', '0');
    expect(element).toHaveAccessibleDescription(
      'Opens your settings Only admins can change settings',
    );
    await userEvent.tab();
    expect(element).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await userEvent.click(element);
    expect(onClick).not.toHaveBeenCalled();
    await userEvent.hover(element);
    expect(await tooltipEntries()).toEqual([
      'Opens your settings',
      'Only admins can change settings',
    ]);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});

describe('Button as a component', () => {
  const DisablingLink = ({
    disabled,
    href,
    children,
    ...props
  }: ComponentPropsWithRef<'a'> & { disabled?: boolean }) => (
    <a {...props} href={disabled ? undefined : href}>
      {children}
    </a>
  );

  // A router link whose destination is not `href`: Button cannot drop it,
  // so the component itself renders the anchor and spreads Button's props.
  const RouterLink = ({
    to,
    children,
    ...props
  }: ComponentPropsWithRef<'a'> & { to: string }) => (
    <a {...props} href={to}>
      {children}
    </a>
  );

  it('when enabled: the component renders, Enter and click press it', async () => {
    const onClick = jest.fn((event: React.MouseEvent) =>
      event.preventDefault(),
    );
    const ref = createRef<HTMLAnchorElement>();
    const { container } = renderUI(
      <Button as={RouterLink} to="/events" ref={ref} onClick={onClick}>
        Events
      </Button>,
    );
    const element = link('Events');
    expect(element).toHaveAttribute('href', '/events');
    expect(ref.current).toBe(element);
    await userEvent.tab();
    expect(element).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);
    await userEvent.click(element);
    expect(onClick).toHaveBeenCalledTimes(2);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('when disabled: out of the tab order, no activation', async () => {
    const handlers = activationHandlers();
    const ref = createRef<HTMLAnchorElement>();
    const { container } = renderUI(
      <Button as={DisablingLink} href="/help" ref={ref} disabled {...handlers}>
        Help
      </Button>,
    );
    const element = link('Help');
    expect(element).not.toHaveAttribute('href');
    expect(element).toHaveAttribute('role', 'link');
    expect(element).toHaveAttribute('aria-disabled', 'true');
    expect(element).toHaveAttribute('tabindex', '-1');
    expect(ref.current).toBe(element);
    await userEvent.tab();
    expect(element).not.toHaveFocus();
    await userEvent.click(element);
    element.focus();
    await userEvent.keyboard('{Enter}');
    expect(handlers.onClick).not.toHaveBeenCalled();
    expect(handlers.onPointerDown).not.toHaveBeenCalled();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('with a disabled reason: a bare anchor without href, the reason on hover and focus', async () => {
    const onClick = jest.fn();
    renderUI(
      <Button
        as={DisablingLink}
        href="/settings"
        disabledWithReason="Only admins can change settings"
        onClick={onClick}
      >
        Settings
      </Button>,
    );
    // A disabled href target is not rendered at all: Button renders the
    // anchor itself, without href or a native disabled attribute.
    const element = link('Settings');
    expect(element).not.toHaveAttribute('href');
    expect(element).not.toHaveAttribute('disabled');
    expect(element).toHaveAttribute('aria-disabled', 'true');
    expect(element).toHaveAttribute('tabindex', '0');
    expect(element).toHaveAccessibleDescription(
      'Only admins can change settings',
    );
    await userEvent.tab();
    expect(element).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await userEvent.click(element);
    expect(onClick).not.toHaveBeenCalled();
    await userEvent.hover(element);
    expect(await tooltipEntries()).toEqual(['Only admins can change settings']);
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('a component without href: its own anchor, guarded while disabled with a reason', async () => {
    const onClick = jest.fn();
    const { container } = renderUI(
      <Button
        as={RouterLink}
        to="/events"
        disabledWithReason="Registration is closed"
        onClick={onClick}
      >
        Events
      </Button>,
    );
    const element = link('Events');
    expect(element).toHaveAttribute('aria-disabled', 'true');
    expect(element).not.toHaveAttribute('tabindex', '-1');
    expect(element).toHaveAccessibleDescription('Registration is closed');
    await userEvent.tab();
    expect(element).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await userEvent.click(element);
    expect(onClick).not.toHaveBeenCalled();
    await userEvent.hover(element);
    expect(await tooltipEntries()).toEqual(['Registration is closed']);
    expect(await axe(document.body)).toHaveNoViolations();
    expect(container).toBeInTheDocument();
  });
});

describe('IconButton', () => {
  it('is named by its string tooltip, its icon in the icon slot, icon-sm by default', async () => {
    const onClick = jest.fn();
    const ref = createRef<HTMLButtonElement>();
    const { container } = renderUI(
      <IconButton ref={ref} tooltip="Settings" onClick={onClick}>
        <Settings data-testid="icon" />
      </IconButton>,
    );
    const element = button('Settings');
    expect(element).toHaveClass(variants.size['icon-sm']);
    expect(screen.getByTestId('icon')).toHaveAttribute('data-slot', 'icon');
    expect(ref.current).toBe(element);
    // The tooltip is the name, so it is not repeated as the description.
    expect(element).not.toHaveAccessibleDescription();
    await userEvent.hover(element);
    expect(await tooltipEntries()).toEqual(['Settings']);
    expect(await axe(document.body)).toHaveNoViolations();
    await userEvent.tab();
    expect(element).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard('[Space]');
    await userEvent.click(element);
    expect(onClick).toHaveBeenCalledTimes(3);
    expect(container).toBeInTheDocument();
  });

  it('aria-label gives a fuller name than the tooltip shows', async () => {
    const { container } = renderUI(
      <IconButton aria-label="Delete Design review" tooltip="Delete">
        <Settings data-testid="icon" />
      </IconButton>,
    );
    expect(button('Delete Design review')).toHaveClass(
      variants.size['icon-sm'],
    );
    expect(screen.getByTestId('icon')).toHaveAttribute('data-slot', 'icon');
    await userEvent.hover(button('Delete Design review'));
    expect(await tooltipEntries()).toEqual(['Delete']);
    expect(await axe(document.body)).toHaveNoViolations();
    expect(container).toBeInTheDocument();
  });

  it('aria-labelledby names it from visible text, the tooltip still shows', async () => {
    const { container } = renderUI(
      <>
        <span id="row-title">Design review</span>
        <IconButton aria-labelledby="row-title" tooltip="Settings">
          <Settings />
        </IconButton>
      </>,
    );
    const element = button('Design review');
    expect(element).not.toHaveAttribute('aria-label');
    await userEvent.tab();
    expect(element).toHaveFocus();
    await userEvent.hover(element);
    expect(await tooltipEntries()).toEqual(['Settings']);
    expect(await axe(document.body)).toHaveNoViolations();
    expect(container).toBeInTheDocument();
  });

  it('maps xs and md to the icon sizes', async () => {
    const { container } = renderUI(
      <>
        <IconButton size="xs" tooltip="Small">
          <Settings />
        </IconButton>
        <IconButton size="md" tooltip="Large">
          <Settings />
        </IconButton>
      </>,
    );
    expect(button('Small')).toHaveClass(variants.size['icon-xs']);
    expect(button('Large')).toHaveClass(variants.size['icon-md']);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('when loading: the spinner takes the icon’s place, the name stays', async () => {
    const onClick = jest.fn();
    const { container } = renderUI(
      <IconButton
        loadingWithReason="Refreshing the list"
        tooltip="Refresh"
        onClick={onClick}
      >
        <Settings data-testid="icon" />
      </IconButton>,
    );
    expect(screen.queryByTestId('icon')).toBeNull();
    const element = button('Refresh');
    expect(element).toHaveAttribute('aria-busy', 'true');
    expect(element).toHaveAttribute('aria-disabled', 'true');
    expect(element).not.toBeDisabled();
    expect(element).not.toHaveAttribute('tabindex', '-1');
    // Only the reason is the description: the tooltip is already the name.
    expect(element).toHaveAccessibleDescription('Refreshing the list');
    expect(screen.getByRole('status')).toHaveTextContent('Refreshing the list');
    await userEvent.tab();
    expect(element).toHaveFocus();
    await userEvent.keyboard('{Enter}[Space]');
    await userEvent.click(element);
    expect(onClick).not.toHaveBeenCalled();
    await userEvent.hover(element);
    expect(await tooltipEntries()).toEqual(['Refresh', 'Refreshing the list']);
    expect(await axe(document.body)).toHaveNoViolations();
    expect(container).toBeInTheDocument();
  });

  it('when disabled silently: out of the tab order; with a reason: reachable', async () => {
    const onClick = jest.fn();
    const { container } = renderUI(
      <>
        <IconButton disabled tooltip="Delete" onClick={onClick}>
          <Settings />
        </IconButton>
        <IconButton
          disabledWithReason="Cancelled events can't be copied"
          tooltip="Duplicate"
          onClick={onClick}
        >
          <Settings />
        </IconButton>
      </>,
    );
    expect(button('Delete')).toHaveAttribute('tabindex', '-1');
    const duplicate = button('Duplicate');
    expect(duplicate).toHaveAttribute('aria-disabled', 'true');
    expect(duplicate).not.toBeDisabled();
    expect(duplicate).not.toHaveAttribute('tabindex', '-1');
    expect(duplicate).toHaveAccessibleDescription(
      "Cancelled events can't be copied",
    );
    await userEvent.tab();
    expect(duplicate).toHaveFocus();
    await userEvent.keyboard('{Enter}[Space]');
    await userEvent.click(duplicate);
    expect(onClick).not.toHaveBeenCalled();
    await userEvent.hover(duplicate);
    expect(await tooltipEntries()).toEqual([
      'Duplicate',
      "Cancelled events can't be copied",
    ]);
    expect(await axe(document.body)).toHaveNoViolations();
    expect(container).toBeInTheDocument();
  });

  it('renders as a link, and Enter presses it', async () => {
    const onClick = jest.fn((event: React.MouseEvent) =>
      event.preventDefault(),
    );
    const ref = createRef<HTMLAnchorElement>();
    const { container } = renderUI(
      <IconButton
        as={Link}
        href="/settings"
        ref={ref}
        tooltip="Settings"
        onClick={onClick}
      >
        <Settings aria-hidden="true" />
      </IconButton>,
    );
    const element = link('Settings');
    expect(element).toHaveAttribute('href', '/settings');
    expect(ref.current).toBe(element);
    await userEvent.tab();
    expect(element).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('PlainButton', () => {
  it('on a native button: no role added, type="button"', async () => {
    const onClick = jest.fn();
    const childClick = jest.fn();
    const { container } = renderUI(
      <PlainButton onClick={onClick}>
        <button onClick={childClick}>Open</button>
      </PlainButton>,
    );
    const element = button('Open');
    expect(element).toHaveAttribute('type', 'button');
    expect(element).not.toHaveAttribute('role');
    await userEvent.tab();
    expect(element).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard('[Space]');
    await userEvent.click(element);
    expect(onClick).toHaveBeenCalledTimes(3);
    expect(childClick).toHaveBeenCalledTimes(3);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('on another element: a focusable button that Enter and Space activate once', async () => {
    const onClick = jest.fn();
    const childClick = jest.fn();
    const { container } = renderUI(
      <PlainButton
        aria-label="About ticket types"
        aria-expanded={false}
        aria-controls="ticket-details"
        onClick={onClick}
      >
        <div onClick={childClick}>
          <Settings aria-hidden />
        </div>
      </PlainButton>,
    );
    const element = button('About ticket types');
    expect(element).toHaveAttribute('tabindex', '0');
    expect(element).toHaveAttribute('aria-expanded', 'false');
    expect(element).toHaveAttribute('aria-controls', 'ticket-details');
    await userEvent.tab();
    expect(element).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);
    await userEvent.keyboard('[Space]');
    expect(onClick).toHaveBeenCalledTimes(2);
    await userEvent.click(element);
    expect(onClick).toHaveBeenCalledTimes(3);
    expect(childClick).toHaveBeenCalledTimes(3);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('respects a handler that prevents the default', async () => {
    const onClick = jest.fn();
    renderUI(
      <PlainButton
        onClick={onClick}
        onKeyDown={(event) => event.preventDefault()}
      >
        <div>Open</div>
      </PlainButton>,
    );
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    expect(onClick).not.toHaveBeenCalled();
  });

  it('when disabled silently: out of the tab order, handlers blocked', async () => {
    const handlers = activationHandlers();
    const childClick = jest.fn();
    const { container } = renderUI(
      <PlainButton disabled {...handlers}>
        <div onClick={childClick}>Open</div>
      </PlainButton>,
    );
    const element = button('Open');
    expect(element).toHaveAttribute('aria-disabled', 'true');
    expect(element).toHaveAttribute('tabindex', '-1');
    await userEvent.tab();
    expect(element).not.toHaveFocus();
    await userEvent.click(element);
    element.focus();
    await userEvent.keyboard('{Enter}[Space]');
    expect(handlers.onClick).not.toHaveBeenCalled();
    expect(handlers.onPointerDown).not.toHaveBeenCalled();
    expect(childClick).not.toHaveBeenCalled();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('with a disabled reason: blocks its own and the child’s handlers, shows the reason', async () => {
    const onClick = jest.fn();
    const childClick = jest.fn();
    renderUI(
      <PlainButton
        tooltip="Opens the details"
        onClick={onClick}
        disabledWithReason="Locked"
      >
        <div onClick={childClick}>Open</div>
      </PlainButton>,
    );
    const element = button('Open');
    expect(element).toHaveAttribute('aria-disabled', 'true');
    expect(element).toHaveAttribute('data-disabled');
    // The reason must be reachable by keyboard, so it keeps its tab stop.
    expect(element).toHaveAttribute('tabindex', '0');
    expect(element).toHaveAccessibleDescription('Opens the details Locked');
    await userEvent.tab();
    expect(element).toHaveFocus();
    await userEvent.keyboard('{Enter}[Space]');
    await userEvent.click(element);
    expect(onClick).not.toHaveBeenCalled();
    expect(childClick).not.toHaveBeenCalled();
    await userEvent.hover(element);
    expect(await tooltipEntries()).toEqual(['Opens the details', 'Locked']);
    await userEvent.keyboard('{Escape}');
    noTooltip();
    expect(element).toHaveFocus();
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('with a read-only reason: inert but not aria-disabled, the reason reachable', async () => {
    const onClick = jest.fn();
    const { container } = renderUI(
      <PlainButton
        onClick={onClick}
        readOnlyWithReason="Only organizers can edit this"
      >
        <div>Open</div>
      </PlainButton>,
    );
    const element = button('Open');
    // Read-only isn't disabled: aria-disabled stays off, but it is inert.
    expect(element).not.toHaveAttribute('aria-disabled');
    expect(element).toHaveAttribute('data-disabled');
    expect(element).toHaveAttribute('tabindex', '0');
    expect(element).toHaveAccessibleDescription(
      'Only organizers can edit this',
    );
    await userEvent.tab();
    expect(element).toHaveFocus();
    await userEvent.keyboard('{Enter}[Space]');
    await userEvent.click(element);
    expect(onClick).not.toHaveBeenCalled();
    await userEvent.hover(element);
    expect(await tooltipEntries()).toEqual(['Only organizers can edit this']);
    expect(await axe(document.body)).toHaveNoViolations();
    expect(container).toBeInTheDocument();
  });

  it('loading with disableWhileLoading={false}: still pressable, the reason shown', async () => {
    const onClick = jest.fn();
    const { container } = renderUI(
      <PlainButton
        loadingWithReason="Syncing"
        disableWhileLoading={false}
        onClick={onClick}
      >
        <div>Open</div>
      </PlainButton>,
    );
    const element = button('Open');
    expect(element).not.toHaveAttribute('aria-disabled');
    expect(element).toHaveAccessibleDescription('Syncing');
    await userEvent.tab();
    expect(element).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await userEvent.click(element);
    expect(onClick).toHaveBeenCalledTimes(2);
    expect(await axe(container)).toHaveNoViolations();
  });
});

// Compile-time checks: `tsc` fails if a line under @ts-expect-error compiles.
describe('types', () => {
  it('infers the target from `as`', () => {
    const buttonRef = createRef<HTMLButtonElement>();
    const anchorRef = createRef<HTMLAnchorElement>();
    const RouterLink = (props: { to: string; children?: ReactNode }) => (
      <a href={props.to}>{props.children}</a>
    );

    const elements = [
      <Button ref={buttonRef}>Save</Button>,
      <Button as="button">Save</Button>,
      <Button as={Link} href="/settings" prefetch={false} ref={anchorRef}>
        Settings
      </Button>,
      <Button as={RouterLink} to="/events">
        Events
      </Button>,
      <IconButton as={Link} href="/help" tooltip="Help">
        <Settings />
      </IconButton>,
      // @ts-expect-error A button has no href.
      <Button href="/help">Help</Button>,
      // @ts-expect-error Navigation props don't turn a button into a link.
      <Button prefetch={false}>Save</Button>,
      // @ts-expect-error A native anchor is not a target: pass a link component.
      <Button as="a" href="/help">
        Help
      </Button>,
      // @ts-expect-error A link's ref is an anchor.
      <Button as={Link} href="/help" ref={buttonRef}>
        Help
      </Button>,
      // @ts-expect-error A button's ref is a button.
      <Button ref={anchorRef}>Save</Button>,
      // @ts-expect-error Next.js Link needs an href.
      <Button as={Link}>Settings</Button>,
      // @ts-expect-error The custom target's required prop stays required.
      <Button as={RouterLink}>Events</Button>,
      // @ts-expect-error A link has no such prop.
      <Button as={Link} href="/help" checked>
        Help
      </Button>,
      // @ts-expect-error An icon button needs a name.
      <IconButton>
        <Settings />
      </IconButton>,
      // @ts-expect-error Disabled silently or with a reason, not both.
      <Button disabled disabledWithReason="Locked">
        Save
      </Button>,
      // @ts-expect-error Read-only silently or with a reason, not both.
      <Button readOnly readOnlyWithReason="Locked">
        Save
      </Button>,
      // @ts-expect-error Loading silently or with a reason, not both.
      <Button loading loadingWithReason="Saving">
        Save
      </Button>,
      // @ts-expect-error The pairs stay exclusive on an icon button too.
      <IconButton tooltip="Delete" disabled disabledWithReason="Locked">
        <Settings />
      </IconButton>,
    ];
    expect(elements).toHaveLength(18);
  });
});
