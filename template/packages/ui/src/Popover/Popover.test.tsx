import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ArrowRight, MapPin } from 'lucide-react';
import React, { useId, useState, type ReactNode } from 'react';

import { Button, IconButton, PlainButton } from '../Button';
import { MenuGroup, MenuItem } from '../Menu';
import { axe, renderUI } from '../test-utils';

import { PopoverButton } from './auxiliary';
import { Popover } from './Popover';

import type { PopoverStateProps } from './Popover.types';

const button = (name: string) => screen.getByRole('button', { name });

const dialog = (name: string) => screen.queryByRole('dialog', { name });

// The shown tooltip is `aria-hidden` (the trigger's description says it), so
// role queries must include hidden elements.
const findTooltip = () => screen.findByRole('tooltip', { hidden: true });
const queryTooltip = () => screen.queryByRole('tooltip', { hidden: true });

const tooltipEntries = async () => {
  await findTooltip();
  return Array.from(
    document.querySelectorAll('[data-side] > div'),
    (entry) => entry.textContent,
  );
};

type PanelProps = PopoverStateProps & {
  modal?: boolean;
  align?: 'start' | 'end';
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  menu?: ReactNode;
  triggerTooltip?: string;
};

/** A popover between two plain buttons, so tab order is observable. */
const Panel = ({ menu, triggerTooltip, ...props }: PanelProps) => (
  <>
    <button type="button">Before</button>
    <Popover
      aria-label="Attendee filters"
      menu={
        menu ?? (
          <div>
            <button type="button">Checked in only</button>
            <button type="button">Apply</button>
          </div>
        )
      }
      {...props}
    >
      <Popover.Button tooltip={triggerTooltip}>Filters</Popover.Button>
    </Popover>
    <button type="button">After</button>
  </>
);

describe('PopoverButton', () => {
  it('is a base button with up and down chevrons', async () => {
    const { container } = renderUI(
      <>
        <PopoverButton>Filters</PopoverButton>
        <Button variant="base">Base</Button>
      </>,
    );
    expect(button('Filters').className).toBe(button('Base').className);
    expect(
      button('Filters').querySelector('.lucide-chevrons-up-down'),
    ).not.toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('a caller’s right icon replaces the chevrons', async () => {
    const { container } = renderUI(
      <PopoverButton rightIcon={<ArrowRight />}>Venue details</PopoverButton>,
    );
    const trigger = button('Venue details');
    expect(trigger.querySelector('.lucide-arrow-right')).not.toBeNull();
    expect(trigger.querySelector('.lucide-chevrons-up-down')).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('Popover', () => {
  it('closed: the trigger advertises a dialog, and the panel is not in the tab order', async () => {
    const { container } = renderUI(<Panel />);
    const trigger = button('Filters');
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('data-state', 'closed');
    expect(dialog('Attendee filters')).toBeNull();
    await userEvent.tab();
    expect(button('Before')).toHaveFocus();
    await userEvent.tab();
    expect(trigger).toHaveFocus();
    await userEvent.tab();
    expect(button('After')).toHaveFocus();
    expect(dialog('Attendee filters')).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('opens on click: a named dialog, focus inside, the trigger expanded and pointing at it', async () => {
    const onOpenChange = jest.fn();
    renderUI(<Panel onOpenChange={onOpenChange} />);
    const trigger = button('Filters');
    await userEvent.click(trigger);
    const panel = screen.getByRole('dialog', { name: 'Attendee filters' });
    expect(panel).toHaveAttribute('data-slot', 'popover');
    expect(panel).toHaveAttribute('data-state', 'open');
    expect(panel).toHaveAttribute('data-align', 'end');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('data-state', 'open');
    expect(trigger).toHaveAttribute('aria-controls', panel.id);
    expect(button('Checked in only')).toHaveFocus();
    expect(onOpenChange.mock.calls).toEqual([[true]]);
    expect(await axe(document.body)).toHaveNoViolations();

    await userEvent.click(trigger);
    expect(dialog('Attendee filters')).toBeNull();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveFocus();
    expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
  });

  it('align="start" and menuClassName land on the panel', async () => {
    renderUI(
      <Popover
        aria-label="Venue details"
        align="start"
        menuClassName="venue-card"
        defaultOpen
        menu={<p>Main hall · 120 seats</p>}
      >
        <Popover.Button>Venue</Popover.Button>
      </Popover>,
    );
    const panel = screen.getByRole('dialog', { name: 'Venue details' });
    expect(panel).toHaveAttribute('data-align', 'start');
    expect(panel).toHaveClass('venue-card');
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('is named by its heading through aria-labelledby', async () => {
    const Named = () => {
      const headingId = useId();
      return (
        <Popover
          aria-labelledby={headingId}
          menu={
            <div>
              <h3 id={headingId}>Filter attendees</h3>
              <button type="button">Apply</button>
            </div>
          }
        >
          <Popover.Button>Filters</Popover.Button>
        </Popover>
      );
    };
    renderUI(<Named />);
    await userEvent.click(button('Filters'));
    const panel = screen.getByRole('dialog', { name: 'Filter attendees' });
    expect(panel).not.toHaveAttribute('aria-label');
    expect(button('Apply')).toHaveFocus();
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('Enter and Space open it; Tab and Shift+Tab move through its content; Escape closes it back to the trigger', async () => {
    const onOpenChange = jest.fn();
    renderUI(<Panel onOpenChange={onOpenChange} />);
    const trigger = button('Filters');
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    expect(
      screen.getByRole('dialog', { name: 'Attendee filters' }),
    ).toBeInTheDocument();
    expect(button('Checked in only')).toHaveFocus();
    await userEvent.tab();
    expect(button('Apply')).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(button('Checked in only')).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    expect(dialog('Attendee filters')).toBeNull();
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(onOpenChange.mock.calls).toEqual([[true], [false]]);

    await userEvent.keyboard('[Space]');
    expect(
      screen.getByRole('dialog', { name: 'Attendee filters' }),
    ).toBeInTheDocument();
    expect(button('Checked in only')).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    expect(dialog('Attendee filters')).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it('with nothing focusable inside, focus lands on the panel itself', async () => {
    renderUI(<Panel menu={<p>Check-ins so far: 86</p>} />);
    const trigger = button('Filters');
    await userEvent.click(trigger);
    const panel = screen.getByRole('dialog', { name: 'Attendee filters' });
    expect(panel).toHaveAttribute('tabindex', '-1');
    expect(panel).toHaveFocus();
    expect(await axe(document.body)).toHaveNoViolations();
    await userEvent.keyboard('{Escape}');
    expect(dialog('Attendee filters')).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it('a click outside closes it, and focus stays where the click put it', async () => {
    const onOpenChange = jest.fn();
    renderUI(<Panel onOpenChange={onOpenChange} />);
    await userEvent.click(button('Filters'));
    expect(button('Checked in only')).toHaveFocus();
    await userEvent.click(button('After'));
    expect(dialog('Attendee filters')).toBeNull();
    expect(button('After')).toHaveFocus();
    expect(button('Filters')).toHaveAttribute('aria-expanded', 'false');
    expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
  });

  it('non-modal: focus moving outside closes it, and is not pulled back', async () => {
    const onOpenChange = jest.fn();
    renderUI(<Panel onOpenChange={onOpenChange} />);
    await userEvent.click(button('Filters'));
    expect(button('Checked in only')).toHaveFocus();
    act(() => button('After').focus());
    await waitFor(() => expect(dialog('Attendee filters')).toBeNull());
    expect(button('After')).toHaveFocus();
    expect(button('Filters')).toHaveAttribute('aria-expanded', 'false');
    expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
  });

  it('modal: Tab cycles inside, the page behind is hidden from assistive tech, Escape returns focus', async () => {
    const onOpenChange = jest.fn();
    renderUI(<Panel modal onOpenChange={onOpenChange} />);
    const trigger = button('Filters');
    await userEvent.click(trigger);
    expect(
      screen.getByRole('dialog', { name: 'Attendee filters' }),
    ).toBeInTheDocument();
    expect(button('Checked in only')).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'After' })).toBeNull();
    expect(
      screen.getByRole('button', { name: 'After', hidden: true }),
    ).toBeInTheDocument();
    await userEvent.tab();
    expect(button('Apply')).toHaveFocus();
    await userEvent.tab();
    expect(button('Checked in only')).toHaveFocus();
    expect(dialog('Attendee filters')).not.toBeNull();
    await userEvent.tab({ shift: true });
    expect(button('Apply')).toHaveFocus();
    expect(dialog('Attendee filters')).not.toBeNull();
    expect(onOpenChange.mock.calls).toEqual([[true]]);
    await userEvent.keyboard('{Escape}');
    expect(dialog('Attendee filters')).toBeNull();
    expect(trigger).toHaveFocus();
    expect(button('After')).toBeInTheDocument();
    expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
  });

  it('defaultOpen renders open, focused inside', async () => {
    renderUI(<Panel defaultOpen />);
    expect(
      screen.getByRole('dialog', { name: 'Attendee filters' }),
    ).toBeInTheDocument();
    expect(button('Filters')).toHaveAttribute('aria-expanded', 'true');
    expect(button('Checked in only')).toHaveFocus();
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('controlled: Apply closes it through the caller’s open state, and focus returns', async () => {
    const Controlled = () => {
      const [open, setOpen] = useState(false);
      const [applied, setApplied] = useState(false);
      return (
        <>
          <Popover
            aria-label="Attendee filters"
            open={open}
            onOpenChange={setOpen}
            menu={
              <button
                type="button"
                onClick={() => {
                  setApplied(true);
                  setOpen(false);
                }}
              >
                Apply
              </button>
            }
          >
            <Popover.Button>Filters</Popover.Button>
          </Popover>
          <p>{applied ? 'Applied' : 'Not applied'}</p>
        </>
      );
    };
    renderUI(<Controlled />);
    const trigger = button('Filters');
    await userEvent.click(trigger);
    expect(button('Apply')).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByText('Applied')).toBeInTheDocument();
    expect(dialog('Attendee filters')).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it('MenuItem rows in a panel are PlainButton tab stops: Tab moves, arrows do not', async () => {
    const Account = () => {
      const headingId = useId();
      const [status, setStatus] = useState('');
      return (
        <>
          <Popover
            aria-labelledby={headingId}
            menu={
              <div>
                <h3 id={headingId}>Ada Lovelace</h3>
                <MenuGroup>
                  <PlainButton onClick={() => setStatus('Profile')}>
                    <MenuItem>Profile settings</MenuItem>
                  </PlainButton>
                  <PlainButton onClick={() => setStatus('Signed out')}>
                    <MenuItem>Sign out</MenuItem>
                  </PlainButton>
                </MenuGroup>
              </div>
            }
          >
            <Popover.Button>Account</Popover.Button>
          </Popover>
          <p role="status">{status}</p>
        </>
      );
    };
    renderUI(<Account />);
    await userEvent.click(button('Account'));
    expect(
      screen.getByRole('dialog', { name: 'Ada Lovelace' }),
    ).toBeInTheDocument();
    const profile = button('Profile settings');
    const signOut = button('Sign out');
    expect(profile).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(profile).toHaveFocus();
    await userEvent.tab();
    expect(signOut).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByText('Signed out')).toBeInTheDocument();
    expect(
      screen.getByRole('dialog', { name: 'Ada Lovelace' }),
    ).toBeInTheDocument();
    expect(await axe(document.body)).toHaveNoViolations();
    await userEvent.keyboard('{Escape}');
    expect(button('Account')).toHaveFocus();
  });

  it('a plain Button or IconButton can be the trigger', async () => {
    renderUI(
      <>
        <Popover aria-label="Venue details" menu={<p>Main hall</p>}>
          <Button>Venue</Button>
        </Popover>
        <Popover aria-label="Map" menu={<p>12 Quay Street</p>}>
          <IconButton variant="base" aria-label="Show map" tooltip="Map">
            <MapPin />
          </IconButton>
        </Popover>
      </>,
    );
    const venue = button('Venue');
    expect(venue).toHaveAttribute('aria-haspopup', 'dialog');
    await userEvent.click(venue);
    expect(
      screen.getByRole('dialog', { name: 'Venue details' }),
    ).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(venue).toHaveFocus();
    const map = button('Show map');
    act(() => map.focus());
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('dialog', { name: 'Map' })).toBeInTheDocument();
    expect(await axe(document.body)).toHaveNoViolations();
    await userEvent.keyboard('{Escape}');
    expect(map).toHaveFocus();
  });

  describe('disabled and loading, set on the Popover', () => {
    it('disabled silently: out of the tab order, never opens, nothing to read', async () => {
      const onOpenChange = jest.fn();
      const { container } = renderUI(
        <Panel disabled onOpenChange={onOpenChange} />,
      );
      const trigger = button('Filters');
      expect(trigger).toHaveAttribute('aria-disabled', 'true');
      expect(trigger).toHaveAttribute('tabindex', '-1');
      expect(trigger).not.toHaveAttribute('aria-describedby');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await userEvent.tab();
      expect(button('Before')).toHaveFocus();
      await userEvent.tab();
      expect(button('After')).toHaveFocus();
      await userEvent.tab({ shift: true });
      expect(button('Before')).toHaveFocus();
      await userEvent.click(trigger);
      trigger.focus();
      await userEvent.keyboard('{Enter}[Space]');
      expect(dialog('Attendee filters')).toBeNull();
      expect(queryTooltip()).toBeNull();
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(await axe(container)).toHaveNoViolations();
    });

    it('disabledWithReason: keeps its tab stop, the reason is its description and tooltip, never opens', async () => {
      const onOpenChange = jest.fn();
      renderUI(
        <Panel
          disabledWithReason="Refunds open after the event"
          triggerTooltip="Refund requests"
          onOpenChange={onOpenChange}
        />,
      );
      const trigger = button('Filters');
      expect(trigger).toHaveAttribute('aria-disabled', 'true');
      expect(trigger).not.toBeDisabled();
      // A reason must be reachable by keyboard, so it keeps its tab stop.
      expect(trigger).not.toHaveAttribute('tabindex', '-1');
      expect(trigger).toHaveAccessibleDescription(
        'Refund requests Refunds open after the event',
      );
      await userEvent.tab();
      expect(button('Before')).toHaveFocus();
      await userEvent.tab();
      expect(trigger).toHaveFocus();
      await userEvent.keyboard('{Enter}[Space]');
      expect(dialog('Attendee filters')).toBeNull();
      await userEvent.tab();
      expect(button('After')).toHaveFocus();
      await userEvent.tab({ shift: true });
      expect(trigger).toHaveFocus();
      await userEvent.click(trigger);
      expect(dialog('Attendee filters')).toBeNull();
      expect(await tooltipEntries()).toEqual([
        'Refund requests',
        'Refunds open after the event',
      ]);
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(await axe(document.body)).toHaveNoViolations();
    });

    it('loading silently: busy, out of the tab order, never opens', async () => {
      const onOpenChange = jest.fn();
      const { container } = renderUI(
        <Panel loading onOpenChange={onOpenChange} />,
      );
      const trigger = button('Filters');
      expect(trigger).toHaveAttribute('aria-busy', 'true');
      expect(trigger).toHaveAttribute('aria-disabled', 'true');
      expect(trigger).toHaveAttribute('tabindex', '-1');
      expect(trigger).not.toHaveAttribute('aria-describedby');
      expect(trigger.querySelector('.animate-spin')).not.toBeNull();
      await userEvent.tab();
      expect(button('Before')).toHaveFocus();
      await userEvent.tab();
      expect(button('After')).toHaveFocus();
      await userEvent.click(trigger);
      trigger.focus();
      await userEvent.keyboard('{Enter}');
      expect(dialog('Attendee filters')).toBeNull();
      expect(queryTooltip()).toBeNull();
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(await axe(container)).toHaveNoViolations();
    });

    it('loadingWithReason: busy, keeps its tab stop for the reason, never opens', async () => {
      const onOpenChange = jest.fn();
      renderUI(
        <Panel
          loadingWithReason="Loading the seating plan"
          onOpenChange={onOpenChange}
        />,
      );
      const trigger = button('Filters');
      expect(trigger).toHaveAttribute('aria-busy', 'true');
      expect(trigger).toHaveAttribute('aria-disabled', 'true');
      expect(trigger).not.toHaveAttribute('tabindex', '-1');
      expect(trigger.querySelector('.animate-spin')).not.toBeNull();
      expect(trigger).toHaveAccessibleDescription('Loading the seating plan');
      await userEvent.tab();
      expect(button('Before')).toHaveFocus();
      await userEvent.tab();
      expect(trigger).toHaveFocus();
      await userEvent.keyboard('{Enter}[Space]');
      expect(dialog('Attendee filters')).toBeNull();
      await userEvent.hover(trigger);
      expect(await tooltipEntries()).toEqual(['Loading the seating plan']);
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(await axe(document.body)).toHaveNoViolations();
    });

    it('loading with disableWhileLoading={false}: busy but not disabled, and it opens', async () => {
      const onOpenChange = jest.fn();
      renderUI(
        <Panel
          loading
          disableWhileLoading={false}
          onOpenChange={onOpenChange}
        />,
      );
      const trigger = button('Filters');
      expect(trigger).toHaveAttribute('aria-busy', 'true');
      expect(trigger).not.toHaveAttribute('aria-disabled');
      expect(trigger).not.toHaveAttribute('tabindex', '-1');
      expect(trigger.querySelector('.animate-spin')).not.toBeNull();
      await userEvent.tab();
      expect(button('Before')).toHaveFocus();
      await userEvent.tab();
      expect(trigger).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      expect(
        screen.getByRole('dialog', { name: 'Attendee filters' }),
      ).toBeInTheDocument();
      expect(button('Checked in only')).toHaveFocus();
      expect(onOpenChange.mock.calls).toEqual([[true]]);
      expect(await axe(document.body)).toHaveNoViolations();
      await userEvent.keyboard('{Escape}');
      expect(trigger).toHaveFocus();
    });

    it('loadingWithReason with disableWhileLoading={false}: the reason describes it, and it still opens', async () => {
      renderUI(
        <Panel
          loadingWithReason="Loading the seating plan"
          disableWhileLoading={false}
        />,
      );
      const trigger = button('Filters');
      expect(trigger).toHaveAttribute('aria-busy', 'true');
      expect(trigger).not.toHaveAttribute('aria-disabled');
      expect(trigger).toHaveAccessibleDescription('Loading the seating plan');
      await userEvent.click(trigger);
      expect(
        screen.getByRole('dialog', { name: 'Attendee filters' }),
      ).toBeInTheDocument();
      expect(button('Checked in only')).toHaveFocus();
      expect(await axe(document.body)).toHaveNoViolations();
    });

    it('controlled open while disabled never shows, and the caller’s value is kept for when it is enabled', async () => {
      const popover = (disabled: boolean): ReactNode => (
        <Popover
          aria-label="Attendee filters"
          open
          disabled={disabled}
          menu={<button type="button">Apply</button>}
        >
          <Popover.Button>Filters</Popover.Button>
        </Popover>
      );
      const { rerender } = renderUI(<>{popover(true)}</>);
      expect(dialog('Attendee filters')).toBeNull();
      expect(button('Filters')).toHaveAttribute('aria-expanded', 'false');
      rerender(<>{popover(false)}</>);
      expect(
        await screen.findByRole('dialog', { name: 'Attendee filters' }),
      ).toBeInTheDocument();
      expect(button('Filters')).toHaveAttribute('aria-expanded', 'true');
      rerender(<>{popover(true)}</>);
      await waitFor(() => expect(dialog('Attendee filters')).toBeNull());
    });

    it('defaultOpen while disabled stays closed', () => {
      renderUI(<Panel defaultOpen disabled />);
      expect(dialog('Attendee filters')).toBeNull();
      expect(button('Filters')).toHaveAttribute('aria-expanded', 'false');
    });
  });
});
