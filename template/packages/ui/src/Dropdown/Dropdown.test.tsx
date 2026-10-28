import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ArrowRight, Ellipsis, Link } from 'lucide-react';
import React, { createRef, type ReactNode, useState } from 'react';

import { Button, IconButton } from '../Button';
import { axe, renderUI } from '../test-utils';

import { Dropdown } from './Dropdown';

import type { DropdownProps } from './Dropdown.types';

const button = (name: string) => screen.getByRole('button', { name });
const menu = () => screen.getByRole('menu');
const item = (name: string | RegExp) => screen.getByRole('menuitem', { name });

const ActionsMenu = ({ menu: content, ...props }: Partial<DropdownProps>) => (
  <Dropdown {...props} menu={content}>
    <Button variant="base">Actions</Button>
  </Dropdown>
);

const basicMenu = (onRename = jest.fn()) => (
  <>
    <Dropdown.Item onSelect={onRename}>Rename</Dropdown.Item>
    <Dropdown.Item>Duplicate</Dropdown.Item>
    <Dropdown.Item>Archive</Dropdown.Item>
  </>
);

const openWithKeyboard = async () => {
  button('Actions').focus();
  await userEvent.keyboard('{Enter}');
  return screen.findByRole('menu');
};

// Radix opens and moves focus after a timer: wait past it before asserting
// nothing happened.
const settle = () =>
  act(() => new Promise((resolve) => setTimeout(resolve, 50)));

// The shown tooltip is aria-hidden (the trigger's description says the same),
// so role queries need `hidden`.
const tooltipText = async () =>
  (await screen.findByRole('tooltip', { hidden: true })).textContent;

const spinnerIn = (element: HTMLElement) =>
  element.querySelector('[data-slot="icon"].animate-spin');

describe('Dropdown', () => {
  it('opens from its trigger: a menu named by the trigger, in the end-aligned Menu look', async () => {
    renderUI(<ActionsMenu menu={basicMenu()} />);
    // An open modal menu hides everything else from assistive tech.
    const trigger = button('Actions');
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger);
    expect(await screen.findByRole('menu', { name: 'Actions' })).toBeVisible();
    expect(menu()).toHaveAttribute('data-align', 'end');
    expect(menu().querySelector('[data-slot="list"]')).toContainElement(
      item('Rename'),
    );
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('takes align="start"', async () => {
    renderUI(<ActionsMenu align="start" menu={basicMenu()} />);
    await userEvent.click(button('Actions'));
    expect(await screen.findByRole('menu')).toHaveAttribute(
      'data-align',
      'start',
    );
  });

  it('from the keyboard: Enter opens on the first item, arrows move, Escape closes back to the trigger', async () => {
    renderUI(<ActionsMenu menu={basicMenu()} />);
    await openWithKeyboard();
    await waitFor(() => expect(item('Rename')).toHaveFocus());
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(item('Duplicate')).toHaveFocus());
    await userEvent.keyboard('{End}');
    await waitFor(() => expect(item('Archive')).toHaveFocus());
    // The arrows stop at the ends instead of wrapping.
    await userEvent.keyboard('{ArrowDown}');
    expect(item('Archive')).toHaveFocus();
    await userEvent.keyboard('{Home}');
    await waitFor(() => expect(item('Rename')).toHaveFocus());
    await userEvent.keyboard('{ArrowUp}');
    expect(item('Rename')).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(button('Actions')).toHaveAttribute('aria-expanded', 'false');
    await waitFor(() => expect(button('Actions')).toHaveFocus());
  });

  it('Space and ArrowDown on the trigger open it too, on the first item', async () => {
    renderUI(<ActionsMenu menu={basicMenu()} />);
    button('Actions').focus();
    await userEvent.keyboard('{ArrowDown}');
    await screen.findByRole('menu');
    await waitFor(() => expect(item('Rename')).toHaveFocus());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(button('Actions')).toHaveFocus());

    await userEvent.keyboard('[Space]');
    await screen.findByRole('menu');
    await waitFor(() => expect(item('Rename')).toHaveFocus());
  });

  it('Tab closes the menu back to the trigger, and a click outside closes it', async () => {
    renderUI(
      <>
        <ActionsMenu menu={basicMenu()} />
        <p>Outside</p>
      </>,
    );
    await openWithKeyboard();
    await waitFor(() => expect(item('Rename')).toHaveFocus());
    await userEvent.tab();
    expect(screen.queryByRole('menu')).toBeNull();
    await waitFor(() => expect(button('Actions')).toHaveFocus());

    await openWithKeyboard();
    await waitFor(() => expect(item('Rename')).toHaveFocus());
    await userEvent.tab({ shift: true });
    expect(screen.queryByRole('menu')).toBeNull();
    await waitFor(() => expect(button('Actions')).toHaveFocus());

    // The modal menu locks pointer events on the page: the outside press is
    // the pointerdown Radix dismisses on.
    await userEvent.click(button('Actions'));
    await screen.findByRole('menu');
    fireEvent.pointerDown(screen.getByText('Outside'));
    expect(screen.queryByRole('menu')).toBeNull();
    expect(button('Actions')).not.toHaveFocus();
  });

  it('typeahead moves to the matching item', async () => {
    renderUI(<ActionsMenu menu={basicMenu()} />);
    await openWithKeyboard();
    await waitFor(() => expect(item('Rename')).toHaveFocus());
    await userEvent.keyboard('a');
    await waitFor(() => expect(item('Archive')).toHaveFocus());
  });

  it('typeahead matches textValue when the row is not plain text', async () => {
    renderUI(
      <ActionsMenu
        menu={
          <>
            <Dropdown.Item>Rename</Dropdown.Item>
            <Dropdown.Item
              textValue="Grace Hopper"
              leftAddOn={<span aria-hidden>XX</span>}
            >
              Grace Hopper
            </Dropdown.Item>
          </>
        }
      />,
    );
    await openWithKeyboard();
    await waitFor(() => expect(item('Rename')).toHaveFocus());
    await userEvent.keyboard('g');
    await waitFor(() => expect(item(/Grace Hopper/)).toHaveFocus());
  });

  it('modal={false} leaves the rest of the page usable while open', async () => {
    renderUI(
      <>
        <ActionsMenu modal={false} menu={basicMenu()} />
        <button type="button">Elsewhere</button>
      </>,
    );
    await userEvent.click(button('Actions'));
    await screen.findByRole('menu');
    const elsewhere = button('Elsewhere');
    await userEvent.click(elsewhere);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(elsewhere).toHaveFocus();
  });

  it('activating an item runs onSelect once and closes, unless prevented', async () => {
    const onRename = jest.fn();
    const { rerender } = renderUI(<ActionsMenu menu={basicMenu(onRename)} />);
    await userEvent.click(button('Actions'));
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Rename' }),
    );
    expect(onRename).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).toBeNull();

    const keepOpen = jest.fn((event: Event) => event.preventDefault());
    rerender(<ActionsMenu menu={basicMenu(keepOpen)} />);
    await openWithKeyboard();
    await waitFor(() => expect(item('Rename')).toHaveFocus());
    await userEvent.keyboard('{Enter}');
    expect(keepOpen).toHaveBeenCalledTimes(1);
    expect(menu()).toBeVisible();
  });

  it('renders the menu as authored: fragments and wrapper components work, an empty menu is a menu', async () => {
    const More = () => <Dropdown.Item>From a wrapper</Dropdown.Item>;
    const { rerender } = renderUI(
      <ActionsMenu
        menu={
          <>
            <Dropdown.Item>Rename</Dropdown.Item>
            <More />
          </>
        }
      />,
    );
    await userEvent.click(button('Actions'));
    expect(await screen.findAllByRole('menuitem')).toHaveLength(2);
    await userEvent.keyboard('{Escape}');

    rerender(<ActionsMenu menu={null} />);
    await userEvent.click(button('Actions'));
    const emptyMenu = await screen.findByRole('menu');
    expect(emptyMenu.querySelector('[data-slot="list"]')).toBeEmptyDOMElement();
  });

  it('follows the controlled open value', async () => {
    const onOpenChange = jest.fn();
    const { rerender } = renderUI(
      <ActionsMenu
        open={false}
        onOpenChange={onOpenChange}
        menu={basicMenu()}
      />,
    );
    await userEvent.click(button('Actions'));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    await settle();
    expect(screen.queryByRole('menu')).toBeNull();

    rerender(
      <ActionsMenu open onOpenChange={onOpenChange} menu={basicMenu()} />,
    );
    expect(await screen.findByRole('menu')).toBeVisible();
  });

  describe('items', () => {
    it('show icons, add-ons, the check and the chevron in their slots', async () => {
      renderUI(
        <ActionsMenu
          menu={
            <Dropdown.Item
              leftIcon={<Link data-testid="icon" />}
              rightAddOn={<kbd>⌘L</kbd>}
              selected
            >
              Copy link
            </Dropdown.Item>
          }
        />,
      );
      await userEvent.click(button('Actions'));
      const row = await screen.findByRole('menuitem', { name: /Copy link/ });
      expect(row.firstElementChild).toBe(screen.getByTestId('icon'));
      // A plain item has no checked state: the chosen one is current.
      expect(row).toHaveAttribute('aria-current', 'true');
      expect(row).not.toHaveAttribute('aria-checked');
      expect(row).toHaveAttribute('data-selected');
      expect(row.querySelector('[data-slot="add-on"]')).toHaveTextContent('⌘L');
      expect(row.lastElementChild).toHaveAttribute('data-slot', 'check');
      expect(await axe(document.body)).toHaveNoViolations();
    });

    it('when disabled: reachable by the arrows and typeahead so its reason is, not activated, the reason on hover and in its description', async () => {
      const onSelect = jest.fn();
      renderUI(
        <ActionsMenu
          menu={
            <>
              <Dropdown.Item>Rename</Dropdown.Item>
              <Dropdown.Item
                disabledWithReason="You need permission to invite people"
                aria-describedby="caller-note"
                onSelect={onSelect}
              >
                Invite people
              </Dropdown.Item>
              <Dropdown.Item>Archive</Dropdown.Item>
            </>
          }
        />,
      );
      await openWithKeyboard();
      await waitFor(() => expect(item('Rename')).toHaveFocus());
      // A disabled row keeps its place in the arrow order.
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(item('Invite people')).toHaveFocus());
      await userEvent.keyboard('{Enter}');
      await userEvent.keyboard('[Space]');
      expect(onSelect).not.toHaveBeenCalled();
      expect(menu()).toBeVisible();
      expect(item('Invite people')).toHaveFocus();
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(item('Archive')).toHaveFocus());
      await userEvent.keyboard('i');
      await waitFor(() => expect(item('Invite people')).toHaveFocus());

      const invite = item('Invite people');
      expect(invite).toHaveAttribute('aria-disabled', 'true');
      expect(invite).toHaveAttribute('data-disabled');
      // The caller's own description is kept next to the reason.
      expect(invite.getAttribute('aria-describedby')).toMatch(/^caller-note /);
      expect(invite).toHaveAccessibleDescription(
        'You need permission to invite people',
      );

      // Hovered first: after a click, the same element gets no new hover.
      await userEvent.hover(invite);
      expect(await tooltipText()).toContain(
        'You need permission to invite people',
      );
      expect(await axe(document.body)).toHaveNoViolations();
      await userEvent.click(invite);
      expect(onSelect).not.toHaveBeenCalled();
      expect(menu()).toBeVisible();
    });

    it('when disabled without a reason: still reachable, nothing in its description, not activated', async () => {
      const onSelect = jest.fn();
      renderUI(
        <ActionsMenu
          menu={
            <>
              <Dropdown.Item>Rename</Dropdown.Item>
              <Dropdown.Item disabled onSelect={onSelect}>
                Delete
              </Dropdown.Item>
            </>
          }
        />,
      );
      await openWithKeyboard();
      await waitFor(() => expect(item('Rename')).toHaveFocus());
      await userEvent.keyboard('{ArrowDown}');
      const row = item('Delete');
      await waitFor(() => expect(row).toHaveFocus());
      expect(row).toHaveAttribute('aria-disabled', 'true');
      expect(row).not.toHaveAttribute('aria-describedby');
      expect(row).toHaveAccessibleDescription('');
      await userEvent.keyboard('{Enter}');
      expect(onSelect).not.toHaveBeenCalled();
      expect(menu()).toBeVisible();
      expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull();
    });

    it('when loading: busy and not activated, the spinner in the left icon’s place, or the only right icon’s', async () => {
      const onSelect = jest.fn();
      renderUI(
        <ActionsMenu
          menu={
            <>
              <Dropdown.Item loading onSelect={onSelect}>
                Syncing
              </Dropdown.Item>
              <Dropdown.Item loading leftIcon={<Link data-testid="left" />}>
                Renaming
              </Dropdown.Item>
              <Dropdown.Item
                loading
                rightIcon={<ArrowRight data-testid="right" />}
              >
                Moving
              </Dropdown.Item>
            </>
          }
        />,
      );
      await userEvent.click(button('Actions'));
      const syncing = await screen.findByRole('menuitem', { name: 'Syncing' });
      expect(syncing).toHaveAttribute('aria-busy', 'true');
      expect(syncing).toHaveAttribute('aria-disabled', 'true');
      expect(syncing.firstElementChild).toBe(spinnerIn(syncing));

      const renaming = item('Renaming');
      expect(screen.queryByTestId('left')).toBeNull();
      expect(renaming.firstElementChild).toBe(spinnerIn(renaming));

      const moving = item('Moving');
      expect(screen.queryByTestId('right')).toBeNull();
      expect(moving.lastElementChild).toBe(spinnerIn(moving));
      expect(await axe(document.body)).toHaveNoViolations();

      await userEvent.click(syncing);
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('loadingWithReason: busy, reachable so the reason is, not activated; disableWhileLoading={false} still activates', async () => {
      const onPublish = jest.fn();
      const onRefresh = jest.fn();
      renderUI(
        <ActionsMenu
          menu={
            <>
              <Dropdown.Item>Rename</Dropdown.Item>
              <Dropdown.Item
                loadingWithReason="Publishing the agenda"
                onSelect={onPublish}
              >
                Publish agenda
              </Dropdown.Item>
              <Dropdown.Item
                loadingWithReason="Refreshing the list"
                disableWhileLoading={false}
                onSelect={onRefresh}
              >
                Refresh
              </Dropdown.Item>
            </>
          }
        />,
      );
      await openWithKeyboard();
      await waitFor(() => expect(item('Rename')).toHaveFocus());
      await userEvent.keyboard('{ArrowDown}');
      const publish = item('Publish agenda');
      await waitFor(() => expect(publish).toHaveFocus());
      expect(publish).toHaveAttribute('aria-busy', 'true');
      expect(publish).toHaveAttribute('aria-disabled', 'true');
      expect(publish).toHaveAccessibleDescription('Publishing the agenda');
      await userEvent.hover(publish);
      expect(await tooltipText()).toContain('Publishing the agenda');
      await userEvent.keyboard('{Enter}');
      expect(onPublish).not.toHaveBeenCalled();
      expect(menu()).toBeVisible();

      const refresh = item('Refresh');
      expect(refresh).toHaveAttribute('aria-busy', 'true');
      expect(refresh).not.toHaveAttribute('aria-disabled');
      await userEvent.click(refresh);
      expect(onRefresh).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('menu')).toBeNull();
    });
  });

  describe('checked rows', () => {
    const ViewOptions = ({
      showCheckbox = false,
      showCheckmark = true,
    }: {
      showCheckbox?: boolean;
      showCheckmark?: boolean;
    }) => {
      const [speakers, setSpeakers] = useState(true);
      const [venue, setVenue] = useState(false);
      const keepOpen = (event: Event) => event.preventDefault();
      return (
        <Dropdown
          showCheckbox={showCheckbox}
          showCheckmark={showCheckmark}
          menu={
            <Dropdown.Group label="Show on the agenda">
              <Dropdown.CheckboxItem
                checked={speakers}
                onCheckedChange={setSpeakers}
                onSelect={keepOpen}
              >
                Speakers
              </Dropdown.CheckboxItem>
              <Dropdown.CheckboxItem
                checked={venue}
                onCheckedChange={setVenue}
                onSelect={keepOpen}
              >
                Venue
              </Dropdown.CheckboxItem>
            </Dropdown.Group>
          }
        >
          <Dropdown.Button>View</Dropdown.Button>
        </Dropdown>
      );
    };

    const checkboxRow = (name: string) =>
      screen.getByRole('menuitemcheckbox', { name });

    it('CheckboxItem: announced checked or not, Space toggles it and the prevented select keeps the menu open', async () => {
      renderUI(<ViewOptions />);
      button('View').focus();
      await userEvent.keyboard('{Enter}');
      await screen.findByRole('menu');
      const speakers = checkboxRow('Speakers');
      const venue = checkboxRow('Venue');
      expect(speakers).toHaveAttribute('aria-checked', 'true');
      expect(venue).toHaveAttribute('aria-checked', 'false');
      // The default indicator is the check mark, and no checkbox slot.
      expect(speakers.lastElementChild).toHaveAttribute('data-slot', 'check');
      expect(speakers.querySelector('[data-slot="checkbox"]')).toBeNull();
      expect(venue.querySelector('[data-slot="check"]')).toBeNull();

      await waitFor(() => expect(speakers).toHaveFocus());
      await userEvent.keyboard('[Space]');
      expect(checkboxRow('Speakers')).toHaveAttribute('aria-checked', 'false');
      expect(menu()).toBeVisible();
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(checkboxRow('Venue')).toHaveFocus());
      await userEvent.keyboard('{Enter}');
      expect(checkboxRow('Venue')).toHaveAttribute('aria-checked', 'true');
      expect(menu()).toBeVisible();
      expect(await axe(document.body)).toHaveNoViolations();
    });

    it('showCheckbox draws a checkbox before each checked row; with the checkmark off, only it shows', async () => {
      const { rerender } = renderUI(<ViewOptions showCheckbox />);
      await userEvent.click(button('View'));
      await screen.findByRole('menu');
      let speakers = checkboxRow('Speakers');
      expect(speakers.querySelector('[data-slot="checkbox"]')).toHaveAttribute(
        'data-state',
        'checked',
      );
      expect(
        checkboxRow('Venue').querySelector('[data-slot="checkbox"]'),
      ).toHaveAttribute('data-state', 'unchecked');
      expect(speakers.lastElementChild).toHaveAttribute('data-slot', 'check');
      await userEvent.keyboard('{Escape}');

      rerender(<ViewOptions showCheckbox showCheckmark={false} />);
      await userEvent.click(button('View'));
      await screen.findByRole('menu');
      speakers = checkboxRow('Speakers');
      expect(speakers.querySelector('[data-slot="checkbox"]')).toHaveAttribute(
        'data-state',
        'checked',
      );
      expect(speakers.querySelector('[data-slot="check"]')).toBeNull();
      expect(await axe(document.body)).toHaveNoViolations();
    });

    it('RadioItem: the group’s one checked row, arrows only move, Enter chooses and closes back to the trigger', async () => {
      const onValueChange = jest.fn();
      const SortMenu = ({
        onValueChange: report,
      }: {
        onValueChange: (value: string) => void;
      }) => {
        const [sort, setSort] = useState('start');
        return (
          <Dropdown
            align="start"
            menu={
              <Dropdown.RadioGroup
                label="Sort by"
                value={sort}
                onValueChange={(value) => {
                  setSort(value);
                  report(value);
                }}
              >
                <Dropdown.RadioItem value="start">
                  Start time
                </Dropdown.RadioItem>
                <Dropdown.RadioItem value="name">
                  Session name
                </Dropdown.RadioItem>
              </Dropdown.RadioGroup>
            }
          >
            <Dropdown.Button>Sort: {sort}</Dropdown.Button>
          </Dropdown>
        );
      };
      renderUI(<SortMenu onValueChange={onValueChange} />);
      button('Sort: start').focus();
      await userEvent.keyboard('{Enter}');
      await screen.findByRole('menu');
      const group = screen.getByRole('group', { name: 'Sort by' });
      const [start, name] = within(group).getAllByRole('menuitemradio');
      expect(start).toHaveAccessibleName('Start time');
      expect(start).toHaveAttribute('aria-checked', 'true');
      expect(name).toHaveAttribute('aria-checked', 'false');
      expect(start.lastElementChild).toHaveAttribute('data-slot', 'check');

      await waitFor(() => expect(start).toHaveFocus());
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(name).toHaveFocus());
      expect(onValueChange).not.toHaveBeenCalled();
      expect(name).toHaveAttribute('aria-checked', 'false');

      await userEvent.keyboard('{Enter}');
      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(onValueChange).toHaveBeenCalledWith('name');
      expect(screen.queryByRole('menu')).toBeNull();
      const trigger = button('Sort: name');
      await waitFor(() => expect(trigger).toHaveFocus());

      await userEvent.keyboard('{Enter}');
      await screen.findByRole('menu');
      expect(
        screen.getByRole('menuitemradio', { name: 'Session name' }),
      ).toHaveAttribute('aria-checked', 'true');
      expect(await axe(document.body)).toHaveNoViolations();
    });

    it('a disabled checked row keeps its reason and never toggles', async () => {
      const onCheckedChange = jest.fn();
      renderUI(
        <ActionsMenu
          menu={
            <Dropdown.CheckboxItem
              checked
              onCheckedChange={onCheckedChange}
              disabledWithReason="Only organizers can hide speakers"
            >
              Speakers
            </Dropdown.CheckboxItem>
          }
        />,
      );
      await openWithKeyboard();
      const row = checkboxRow('Speakers');
      await waitFor(() => expect(row).toHaveFocus());
      expect(row).toHaveAttribute('aria-checked', 'true');
      expect(row).toHaveAttribute('aria-disabled', 'true');
      expect(row).toHaveAccessibleDescription(
        'Only organizers can hide speakers',
      );
      await userEvent.keyboard('[Space]');
      await userEvent.click(row);
      expect(onCheckedChange).not.toHaveBeenCalled();
      expect(row).toHaveAttribute('aria-checked', 'true');
    });
  });

  it('groups: a labelled group, with separators between', async () => {
    renderUI(
      <ActionsMenu
        menu={
          <>
            <Dropdown.Group label="Links">
              <Dropdown.Item>Copy link</Dropdown.Item>
            </Dropdown.Group>
            <Dropdown.Separator />
            <Dropdown.Group>
              <Dropdown.Item>Archive</Dropdown.Item>
            </Dropdown.Group>
          </>
        }
      />,
    );
    await userEvent.click(button('Actions'));
    const group = await screen.findByRole('group', { name: 'Links' });
    expect(within(group).getByRole('menuitem')).toHaveAccessibleName(
      'Copy link',
    );
    // Without a label a group only sets its rows apart: no name of its own.
    const unlabelled = screen
      .getAllByRole('group')
      .find((candidate) => candidate !== group);
    expect(unlabelled).not.toHaveAttribute('aria-labelledby');
    expect(unlabelled).toHaveAccessibleName('');
    expect(screen.getByRole('separator')).toHaveAttribute(
      'data-slot',
      'separator',
    );
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('forwards refs: Item and SubMenu to their rows, Group and Separator to their elements', async () => {
    const itemRef = createRef<HTMLDivElement>();
    const subMenuRef = createRef<HTMLDivElement>();
    const groupRef = createRef<HTMLDivElement>();
    const separatorRef = createRef<HTMLDivElement>();
    renderUI(
      <ActionsMenu
        menu={
          <>
            <Dropdown.Group ref={groupRef}>
              <Dropdown.Item ref={itemRef}>Rename</Dropdown.Item>
            </Dropdown.Group>
            <Dropdown.Separator ref={separatorRef} />
            <Dropdown.SubMenu
              ref={subMenuRef}
              menu={<Dropdown.Item>Email</Dropdown.Item>}
            >
              <Dropdown.Item>Share</Dropdown.Item>
            </Dropdown.SubMenu>
          </>
        }
      />,
    );
    await userEvent.click(button('Actions'));
    await screen.findByRole('menu');
    expect(itemRef.current).toBe(item('Rename'));
    expect(subMenuRef.current).toBe(item('Share'));
    expect(groupRef.current).toBe(screen.getByRole('group'));
    expect(separatorRef.current).toBe(screen.getByRole('separator'));
  });

  describe('SubMenu', () => {
    const shareMenu = (
      props: Partial<React.ComponentProps<typeof Dropdown.SubMenu>> = {},
      trigger: ReactNode = <Dropdown.Item>Share</Dropdown.Item>,
    ) => (
      <ActionsMenu
        menu={
          <>
            <Dropdown.Item>Rename</Dropdown.Item>
            <Dropdown.SubMenu
              {...props}
              menu={
                <>
                  <Dropdown.Item>Email</Dropdown.Item>
                  <Dropdown.Item>Slack</Dropdown.Item>
                </>
              }
            >
              {
                trigger as React.ComponentProps<
                  typeof Dropdown.SubMenu
                >['children']
              }
            </Dropdown.SubMenu>
          </>
        }
      />
    );

    it('its trigger is one submenu item with the chevron; arrows enter and leave it', async () => {
      renderUI(shareMenu());
      await openWithKeyboard();
      const share = item('Share');
      expect(share).toHaveAttribute('aria-haspopup', 'menu');
      expect(share.lastElementChild).toHaveAttribute('data-slot', 'chevron');

      expect(share).toHaveAttribute('aria-expanded', 'false');
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(share).toHaveFocus());
      await userEvent.keyboard('{ArrowRight}');
      expect(await screen.findByRole('menu', { name: 'Share' })).toBeVisible();
      expect(share).toHaveAttribute('aria-expanded', 'true');
      await waitFor(() => expect(item('Email')).toHaveFocus());
      await userEvent.keyboard('{ArrowLeft}');
      await waitFor(() => expect(share).toHaveFocus());
      expect(screen.getAllByRole('menu')).toHaveLength(1);
      expect(share).toHaveAttribute('aria-expanded', 'false');
      expect(await axe(document.body)).toHaveNoViolations();
    });

    it('Enter and Space open it too, Escape goes one level back, and Tab closes every menu to the trigger', async () => {
      renderUI(shareMenu());
      await openWithKeyboard();
      await userEvent.keyboard('{ArrowDown}');
      const share = item('Share');
      await waitFor(() => expect(share).toHaveFocus());
      await userEvent.keyboard('{Enter}');
      expect(await screen.findByRole('menu', { name: 'Share' })).toBeVisible();
      await waitFor(() => expect(item('Email')).toHaveFocus());
      // One level back, not out of every menu.
      await userEvent.keyboard('{Escape}');
      expect(screen.getAllByRole('menu')).toHaveLength(1);
      await waitFor(() => expect(share).toHaveFocus());

      await userEvent.keyboard('[Space]');
      expect(await screen.findByRole('menu', { name: 'Share' })).toBeVisible();
      await waitFor(() => expect(item('Email')).toHaveFocus());
      await userEvent.tab();
      expect(screen.queryByRole('menu')).toBeNull();
      await waitFor(() => expect(button('Actions')).toHaveFocus());
    });

    it("opens instead of selecting: the trigger's onSelect never runs and the root stays open", async () => {
      const onSelect = jest.fn();
      renderUI(
        shareMenu({}, <Dropdown.Item onSelect={onSelect}>Share</Dropdown.Item>),
      );
      await userEvent.click(button('Actions'));
      await userEvent.click(
        await screen.findByRole('menuitem', { name: 'Share' }),
      );
      expect(await screen.findByRole('menu', { name: 'Share' })).toBeVisible();
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('when disabled, as a Dropdown is: never opens, and its trigger shows the reason', async () => {
      renderUI(
        shareMenu({ disabledWithReason: 'You need permission to share' }),
      );
      await userEvent.click(button('Actions'));
      const share = await screen.findByRole('menuitem', { name: 'Share' });
      expect(share).toHaveAttribute('aria-disabled', 'true');
      expect(share).toHaveAccessibleDescription('You need permission to share');
      // Hovered first: after a click, the same element gets no new hover.
      await userEvent.hover(share);
      expect(await tooltipText()).toBe('You need permission to share');
      expect(await axe(document.body)).toHaveNoViolations();
      await userEvent.click(share);
      await settle();
      expect(screen.getAllByRole('menu')).toHaveLength(1);
      // Nor from the keyboard: the trigger row is reachable, and inert.
      share.focus();
      await userEvent.keyboard('{ArrowRight}{Enter}[Space]');
      await settle();
      expect(screen.getAllByRole('menu')).toHaveLength(1);
      expect(share).toHaveAttribute('aria-expanded', 'false');
    });

    it('when loading: never opens, and its trigger is busy with the spinner', async () => {
      renderUI(shareMenu({ loading: true }));
      await userEvent.click(button('Actions'));
      const share = await screen.findByRole('menuitem', { name: 'Share' });
      expect(share).toHaveAttribute('aria-busy', 'true');
      expect(spinnerIn(share)).not.toBeNull();
      await userEvent.click(share);
      await settle();
      expect(screen.getAllByRole('menu')).toHaveLength(1);
    });

    it('open and then disabled: hides without changing the controlled value, and shows again once enabled', async () => {
      const onOpenChange = jest.fn();
      const Controlled = ({ disabled }: { disabled: boolean }) =>
        shareMenu({ open: true, onOpenChange, disabled });
      const { rerender } = renderUI(<Controlled disabled={false} />);
      await userEvent.click(button('Actions'));
      expect(await screen.findByRole('menu', { name: 'Share' })).toBeVisible();
      onOpenChange.mockClear();

      rerender(<Controlled disabled />);
      await waitFor(() => expect(screen.getAllByRole('menu')).toHaveLength(1));
      expect(onOpenChange).not.toHaveBeenCalled();

      rerender(<Controlled disabled={false} />);
      expect(await screen.findByRole('menu', { name: 'Share' })).toBeVisible();
    });

    it('throws in development when its trigger is not one Dropdown.Item, and not in production', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      const wrongTriggers = [
        <button key="button">Share</button>,
        // eslint-disable-next-line react/jsx-no-useless-fragment -- a fragment is one of the wrong triggers.
        <>
          <Dropdown.Item>Share</Dropdown.Item>
        </>,
        'Share',
      ];
      for (const trigger of wrongTriggers) {
        const { unmount } = renderUI(shareMenu({}, trigger));
        await expect(userEvent.click(button('Actions'))).rejects.toThrow(
          'Dropdown.SubMenu: its trigger should be a Dropdown.Item',
        );
        unmount();
      }

      const nodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      renderUI(shareMenu({}, <button>Share</button>));
      await userEvent.click(button('Actions'));
      expect(await screen.findByRole('menu')).toBeVisible();
      process.env.NODE_ENV = nodeEnv;
      consoleError.mockRestore();
    });
  });

  it("keeps its trigger's own tooltip", async () => {
    renderUI(
      <Dropdown menu={basicMenu()}>
        <IconButton aria-label="More actions" tooltip="More actions">
          <Ellipsis />
        </IconButton>
      </Dropdown>,
    );
    await userEvent.hover(screen.getByRole('button', { name: 'More actions' }));
    expect(await tooltipText()).toBe('More actions');
  });

  describe('when disabled', () => {
    it('blocks its trigger, and its reason shows on the trigger', async () => {
      renderUI(
        <ActionsMenu
          disabledWithReason="Select a file first"
          menu={basicMenu()}
        />,
      );
      expect(button('Actions')).toHaveAttribute('aria-disabled', 'true');
      expect(button('Actions')).toHaveAccessibleDescription(
        'Select a file first',
      );
      await userEvent.click(button('Actions'));
      button('Actions').focus();
      await userEvent.keyboard('{Enter}{ArrowDown}');
      await settle();
      expect(screen.queryByRole('menu')).toBeNull();
      await userEvent.hover(button('Actions'));
      expect(await tooltipText()).toBe('Select a file first');
      expect(await axe(document.body)).toHaveNoViolations();
    });

    it('in the tab order: silently disabled leaves it, disabled with a reason keeps its stop', async () => {
      renderUI(
        <>
          <button type="button">Before</button>
          <Dropdown disabled menu={basicMenu()}>
            <Button variant="base">Silently disabled</Button>
          </Dropdown>
          <Dropdown
            disabledWithReason="Sign in to manage tickets"
            menu={basicMenu()}
          >
            <Button variant="base">Disabled with a reason</Button>
          </Dropdown>
          <Dropdown menu={basicMenu()}>
            <Button variant="base">Enabled</Button>
          </Dropdown>
          <button type="button">After</button>
        </>,
      );
      expect(button('Silently disabled')).toHaveAttribute(
        'aria-disabled',
        'true',
      );
      expect(button('Silently disabled')).toHaveAccessibleDescription('');
      expect(button('Disabled with a reason')).toHaveAccessibleDescription(
        'Sign in to manage tickets',
      );

      button('Before').focus();
      await userEvent.tab();
      expect(button('Disabled with a reason')).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      await settle();
      expect(screen.queryByRole('menu')).toBeNull();
      await userEvent.tab();
      expect(button('Enabled')).toHaveFocus();
      await userEvent.tab();
      expect(button('After')).toHaveFocus();
      await userEvent.tab({ shift: true });
      expect(button('Enabled')).toHaveFocus();
      await userEvent.tab({ shift: true });
      expect(button('Disabled with a reason')).toHaveFocus();
      expect(await axe(document.body)).toHaveNoViolations();
    });

    it('renders nothing even controlled open, never calls onOpenChange, and opens again once enabled', async () => {
      const onOpenChange = jest.fn();
      const { rerender } = renderUI(
        <ActionsMenu
          disabled
          open
          onOpenChange={onOpenChange}
          menu={basicMenu()}
        />,
      );
      await settle();
      expect(screen.queryByRole('menu')).toBeNull();
      expect(onOpenChange).not.toHaveBeenCalled();

      rerender(
        <ActionsMenu open onOpenChange={onOpenChange} menu={basicMenu()} />,
      );
      expect(await screen.findByRole('menu')).toBeVisible();
    });
  });

  describe('when loading', () => {
    it('can’t open; Dropdown.Button is busy with the spinner, and the reason shows', async () => {
      renderUI(
        <Dropdown loadingWithReason="Loading your files" menu={basicMenu()}>
          <Dropdown.Button>Files</Dropdown.Button>
        </Dropdown>,
      );
      const trigger = button('Files');
      expect(trigger).toHaveAttribute('aria-busy', 'true');
      expect(trigger).toHaveAttribute('aria-disabled', 'true');
      expect(spinnerIn(trigger)).not.toBeNull();
      expect(trigger.querySelector('.lucide-chevron-down')).toBeNull();
      expect(trigger).toHaveAccessibleDescription('Loading your files');
      await userEvent.click(trigger);
      await settle();
      expect(screen.queryByRole('menu')).toBeNull();
      expect(await axe(document.body)).toHaveNoViolations();
    });

    it('with disableWhileLoading={false}: busy, and still opens', async () => {
      renderUI(
        <Dropdown loading disableWhileLoading={false} menu={basicMenu()}>
          <Dropdown.Button>Files</Dropdown.Button>
        </Dropdown>,
      );
      expect(button('Files')).toHaveAttribute('aria-busy', 'true');
      await userEvent.click(button('Files'));
      expect(await screen.findByRole('menu')).toBeVisible();
    });
  });

  describe('Dropdown.Search', () => {
    const SearchMenu = ({
      onChange = jest.fn(),
    }: {
      onChange?: (text: string) => void;
    }) => {
      const [search, setSearch] = useState('');
      return (
        <ActionsMenu
          menu={
            <>
              <Dropdown.Search
                aria-label="Search actions"
                value={search}
                onChange={(text) => {
                  setSearch(text);
                  onChange(text);
                }}
              />
              <Dropdown.Item>Rename</Dropdown.Item>
              <Dropdown.Item disabled>Delete</Dropdown.Item>
              <Dropdown.Item>Archive</Dropdown.Item>
            </>
          }
        />
      );
    };

    // A menu can't hold a field, so the SearchInput sits in the popup, outside
    // the menu.
    const search = () =>
      screen.getByRole('searchbox', { name: 'Search actions' });

    it('is a SearchInput above the menu’s rows, and opening focuses it', async () => {
      renderUI(<SearchMenu />);
      await userEvent.click(button('Actions'));
      await screen.findByRole('menu');
      const field = search();
      expect(field).toHaveAttribute('type', 'search');
      expect(field.closest('[data-slot="search"]')).not.toBeNull();
      expect(menu()).not.toContainElement(field as HTMLElement);
      expect(menu()).toContainElement(item('Rename'));
      await waitFor(() => expect(field).toHaveFocus());
      expect(await axe(document.body)).toHaveNoViolations();
    });

    it('types instead of driving typeahead, and sends its text after a pause', async () => {
      const onChange = jest.fn();
      renderUI(<SearchMenu onChange={onChange} />);
      await openWithKeyboard();
      await waitFor(() => expect(search()).toHaveFocus());
      await userEvent.keyboard('ar  ');
      expect(search()).toHaveValue('ar  ');
      expect(search()).toHaveFocus();
      expect(menu()).toBeVisible();
      await waitFor(() => expect(onChange).toHaveBeenCalledWith('ar  '));
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('ArrowDown and Tab move to the first enabled item; ArrowUp on it and Shift+Tab come back', async () => {
      renderUI(<SearchMenu />);
      await openWithKeyboard();
      await waitFor(() => expect(search()).toHaveFocus());

      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(item('Rename')).toHaveFocus());
      await userEvent.keyboard('{ArrowUp}');
      await waitFor(() => expect(search()).toHaveFocus());

      await userEvent.tab();
      await waitFor(() => expect(item('Rename')).toHaveFocus());
      // The disabled row keeps its place, as without a field.
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(item('Delete')).toHaveFocus());
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(item('Archive')).toHaveFocus());
      await userEvent.tab({ shift: true });
      await waitFor(() => expect(search()).toHaveFocus());

      // Tab and Shift+Tab in the field never leave the menu.
      await userEvent.tab({ shift: true });
      expect(search()).toHaveFocus();
      expect(menu()).toBeVisible();
    });

    it('a character typed on an item goes into the field; Space still chooses the item', async () => {
      renderUI(<SearchMenu />);
      await openWithKeyboard();
      await waitFor(() => expect(search()).toHaveFocus());
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(item('Rename')).toHaveFocus());
      await userEvent.keyboard('x');
      expect(search()).toHaveFocus();
      expect(search()).toHaveValue('x');

      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(item('Rename')).toHaveFocus());
      await userEvent.keyboard('[Space]');
      expect(screen.queryByRole('menu')).toBeNull();
    });

    it('Escape in the field closes the menu back to the trigger', async () => {
      renderUI(<SearchMenu />);
      await openWithKeyboard();
      await waitFor(() => expect(search()).toHaveFocus());
      await userEvent.keyboard('{Escape}');
      expect(screen.queryByRole('menu')).toBeNull();
      await waitFor(() => expect(button('Actions')).toHaveFocus());
    });

    it('filtering: announces the count, shows the empty state, Enter picks the first match and never submits a form', async () => {
      const onSubmit = jest.fn((event: React.FormEvent) =>
        event.preventDefault(),
      );
      const AssignSpeaker = ({
        onSubmit: submit,
      }: {
        onSubmit: (event: React.FormEvent) => void;
      }) => {
        const [query, setQuery] = useState('');
        const [speaker, setSpeaker] = useState('Ada Lovelace');
        const names = ['Ada Lovelace', 'Grace Hopper', 'Alan Turing'];
        const matches = names.filter((name) =>
          name.toLowerCase().includes(query.toLowerCase()),
        );
        return (
          <form onSubmit={submit}>
            <Dropdown
              align="start"
              onOpenChange={(open) => {
                if (!open) setQuery('');
              }}
              menu={
                <>
                  <Dropdown.Search
                    label="Search speakers"
                    placeholder="Search speakers"
                    value={query}
                    onChange={setQuery}
                  />
                  <Dropdown.RadioGroup
                    value={speaker}
                    onValueChange={setSpeaker}
                  >
                    {matches.map((name) => (
                      <Dropdown.RadioItem
                        key={name}
                        value={name}
                        textValue={name}
                      >
                        {name}
                      </Dropdown.RadioItem>
                    ))}
                  </Dropdown.RadioGroup>
                </>
              }
            >
              <Dropdown.Button>Speaker: {speaker}</Dropdown.Button>
            </Dropdown>
          </form>
        );
      };

      const radio = (name: string) =>
        screen.getByRole('menuitemradio', { name });
      // Announced from inside the modal menu, which hides outside live
      // regions.
      const announcement = () =>
        Array.from(
          document.querySelectorAll('[data-slot="search"] [role="status"]'),
          (status) => status.textContent,
        );

      renderUI(<AssignSpeaker onSubmit={onSubmit} />);
      await userEvent.click(button('Speaker: Ada Lovelace'));
      const field = await screen.findByRole('searchbox', {
        name: 'Search speakers',
      });
      await waitFor(() => expect(field).toHaveFocus());

      await userEvent.keyboard('hop');
      await waitFor(() =>
        expect(screen.getAllByRole('menuitemradio')).toHaveLength(1),
      );
      expect(announcement()).toContain('1 result');
      expect(radio('Grace Hopper')).toHaveAttribute('aria-checked', 'false');

      await userEvent.keyboard('{Enter}');
      expect(onSubmit).not.toHaveBeenCalled();
      expect(screen.queryByRole('menu')).toBeNull();
      const trigger = button('Speaker: Grace Hopper');
      await waitFor(() => expect(trigger).toHaveFocus());

      // Reopening starts empty, the choice checked; ArrowDown from the field
      // lands on it.
      await userEvent.click(trigger);
      const reopened = await screen.findByRole('searchbox', {
        name: 'Search speakers',
      });
      expect(reopened).toHaveValue('');
      expect(radio('Grace Hopper')).toHaveAttribute('aria-checked', 'true');
      await waitFor(() => expect(reopened).toHaveFocus());
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(radio('Grace Hopper')).toHaveFocus());

      await userEvent.tab({ shift: true });
      await waitFor(() => expect(reopened).toHaveFocus());
      await userEvent.keyboard('zzz');
      await waitFor(() =>
        expect(screen.queryAllByRole('menuitemradio')).toHaveLength(0),
      );
      expect(announcement()).toContain('No matches');
      expect(
        Array.from(
          document.querySelectorAll('[data-slot="message"]'),
          (message) => message.textContent,
        ),
      ).toContain('No matches');
      expect(await axe(document.body)).toHaveNoViolations();

      // With nothing to pick, Enter stays in the field.
      await userEvent.keyboard('{Enter}');
      expect(onSubmit).not.toHaveBeenCalled();
      expect(menu()).toBeVisible();
      expect(reopened).toHaveFocus();
    });
  });
});

describe('Dropdown.Button', () => {
  it('is a base button with a chevron down', async () => {
    const { container } = renderUI(
      <>
        <Dropdown.Button>Actions</Dropdown.Button>
        <Button variant="base">Base</Button>
      </>,
    );
    expect(button('Actions').className).toBe(button('Base').className);
    expect(
      button('Actions').querySelector('.lucide-chevron-down'),
    ).not.toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('takes another variant and right icon', () => {
    renderUI(
      <>
        <Dropdown.Button look="ghost" rightIcon={<ArrowRight />}>
          More
        </Dropdown.Button>
        <Button variant="base" look="ghost">
          Ghost
        </Button>
      </>,
    );
    expect(button('More').className).toBe(button('Ghost').className);
    expect(button('More').querySelector('.lucide-arrow-right')).not.toBeNull();
  });

  it('is a trigger for Dropdown', async () => {
    renderUI(
      <Dropdown menu={<Dropdown.Item>Rename</Dropdown.Item>}>
        <Dropdown.Button>Actions</Dropdown.Button>
      </Dropdown>,
    );
    const trigger = button('Actions');
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger);
    expect(await screen.findByRole('menu', { name: 'Actions' })).toBeVisible();
    expect(trigger).toHaveAttribute('data-state', 'open');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });
});
