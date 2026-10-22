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

const tooltipEntries = async () => {
  await screen.findByRole('tooltip');
  return Array.from(
    document.querySelectorAll('[data-side] > div'),
    (entry) => entry.textContent,
  );
};

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
    expect(button('Save')).toHaveAttribute('aria-busy', 'true');
    expect(button('Save')).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(button('Save'));
    expect(onClick).not.toHaveBeenCalled();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('when loading with disableWhileLoading={false}: still pressable', async () => {
    const onClick = jest.fn();
    renderUI(
      <Button loading disableWhileLoading={false} onClick={onClick}>
        Stop
      </Button>,
    );
    expect(button('Stop')).not.toHaveAttribute('aria-disabled');
    await userEvent.click(button('Stop'));
    expect(onClick).toHaveBeenCalledTimes(1);
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
    expect(element).toHaveAttribute('aria-disabled', 'true');
    expect(element).toHaveAttribute('data-disabled');
    expect(element).toHaveAttribute('tabindex', '-1');

    await userEvent.click(element);
    element.focus();
    await userEvent.keyboard('{Enter}[Space]a');
    expect(handlers.onClick).not.toHaveBeenCalled();
    expect(handlers.onPointerDown).not.toHaveBeenCalled();
    // Only the unrelated key reaches the handler.
    expect(handlers.onKeyDown).toHaveBeenCalledTimes(1);
    expect(onKeyUp).toHaveBeenCalled();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('readOnly and loading with disableWhileLoading also disable', () => {
    renderUI(
      <>
        <Button readOnly>Read-only</Button>
        <Button loading disableWhileLoading>
          Saving
        </Button>
      </>,
    );
    expect(button('Read-only')).toHaveAttribute('aria-disabled', 'true');
    expect(button('Saving')).toHaveAttribute('aria-disabled', 'true');
  });

  it('with a disabled reason: disabled, the reason under the tooltip', async () => {
    renderUI(
      <Button
        tooltip="Publishes the event"
        disabledWithReason="Add a date first"
      >
        Publish
      </Button>,
    );
    expect(button('Publish')).toHaveAttribute('aria-disabled', 'true');
    await userEvent.hover(button('Publish'));
    expect(await tooltipEntries()).toEqual([
      'Publishes the event',
      'Add a date first',
    ]);
    expect(await axe(document.body)).toHaveNoViolations();
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
    await userEvent.click(trigger);
    expect(await screen.findByRole('menu')).toBeInTheDocument();
    expect(trigger).toHaveAttribute('data-state', 'open');
  });

  it('passes its ref to the button', () => {
    const ref = createRef<HTMLButtonElement>();
    renderUI(<Button ref={ref}>Save</Button>);
    expect(ref.current).toBe(button('Save'));
  });
});

describe('Button as a Next.js Link', () => {
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
    expect(ref.current).toBe(element);
    await userEvent.click(element);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(await axe(container)).toHaveNoViolations();
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

  it('when disabled: out of the tab order, no activation', async () => {
    const handlers = activationHandlers();
    const ref = createRef<HTMLAnchorElement>();
    const { container } = renderUI(
      <Button as={DisablingLink} href="/help" ref={ref} disabled {...handlers}>
        Help
      </Button>,
    );
    const element = screen.getByText('Help').closest('a')!;
    expect(element).toHaveAttribute('aria-disabled', 'true');
    expect(element).toHaveAttribute('tabindex', '-1');
    expect(ref.current).toBe(element);
    await userEvent.click(element);
    expect(handlers.onClick).not.toHaveBeenCalled();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('when disabled: passes `disabled` on for the component to handle, the reason on hover', async () => {
    renderUI(
      <Button
        as={DisablingLink}
        href="/settings"
        disabledWithReason="Only admins can change settings"
      >
        Settings
      </Button>,
    );
    const element = screen.getByText('Settings').closest('a')!;
    expect(element).not.toHaveAttribute('href');
    expect(element).not.toHaveAttribute('disabled');
    expect(element).toHaveAttribute('aria-disabled', 'true');
    await userEvent.hover(element);
    expect(await tooltipEntries()).toEqual(['Only admins can change settings']);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});

describe('IconButton', () => {
  it('is named by aria-label, its icon in the icon slot, icon-sm by default', async () => {
    const { container } = renderUI(
      <IconButton aria-label="Settings">
        <Settings data-testid="icon" />
      </IconButton>,
    );
    expect(button('Settings')).toHaveClass(variants.size['icon-sm']);
    expect(screen.getByTestId('icon')).toHaveAttribute('data-slot', 'icon');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('maps xs and md to the icon sizes', () => {
    renderUI(
      <>
        <IconButton size="xs" aria-label="Small">
          <Settings />
        </IconButton>
        <IconButton size="md" aria-label="Large">
          <Settings />
        </IconButton>
      </>,
    );
    expect(button('Small')).toHaveClass(variants.size['icon-xs']);
    expect(button('Large')).toHaveClass(variants.size['icon-md']);
  });

  it('when loading: the spinner takes the icon’s place, the name stays', async () => {
    const { container } = renderUI(
      <IconButton loading aria-label="Refresh">
        <Settings data-testid="icon" />
      </IconButton>,
    );
    expect(screen.queryByTestId('icon')).toBeNull();
    expect(button('Refresh')).toHaveAttribute('aria-busy', 'true');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders as a link', () => {
    renderUI(
      <IconButton as={Link} href="/settings" aria-label="Settings">
        <Settings aria-hidden="true" />
      </IconButton>,
    );
    expect(link('Settings')).toHaveAttribute('href', '/settings');
  });
});

describe('PlainButton', () => {
  it('on a native button: no role added, type="button"', async () => {
    const onClick = jest.fn();
    const { container } = renderUI(
      <PlainButton onClick={onClick}>
        <button>Open</button>
      </PlainButton>,
    );
    expect(button('Open')).toHaveAttribute('type', 'button');
    expect(button('Open')).not.toHaveAttribute('role');
    await userEvent.click(button('Open'));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('on another element: a focusable button that Enter and Space activate once', async () => {
    const onClick = jest.fn();
    const childClick = jest.fn();
    const { container } = renderUI(
      <PlainButton onClick={onClick}>
        <div onClick={childClick}>Open</div>
      </PlainButton>,
    );
    await userEvent.tab();
    expect(button('Open')).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);
    await userEvent.keyboard('[Space]');
    expect(onClick).toHaveBeenCalledTimes(2);
    expect(childClick).toHaveBeenCalledTimes(2);
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

  it('when disabled: blocks its own and the child’s handlers, shows the reason', async () => {
    const onClick = jest.fn();
    const childClick = jest.fn();
    renderUI(
      <PlainButton onClick={onClick} disabledWithReason="Locked">
        <div onClick={childClick}>Open</div>
      </PlainButton>,
    );
    const element = button('Open');
    expect(element).toHaveAttribute('aria-disabled', 'true');
    expect(element).toHaveAttribute('tabindex', '-1');
    await userEvent.click(element);
    element.focus();
    await userEvent.keyboard('{Enter}');
    expect(onClick).not.toHaveBeenCalled();
    expect(childClick).not.toHaveBeenCalled();
    await userEvent.hover(element);
    expect(await tooltipEntries()).toEqual(['Locked']);
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
      <IconButton as={Link} href="/help" aria-label="Help">
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
      <IconButton aria-label="Delete" disabled disabledWithReason="Locked">
        <Settings />
      </IconButton>,
    ];
    expect(elements).toHaveLength(18);
  });
});
