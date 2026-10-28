/**
 * Dropdown: a menu of actions or choices behind a trigger button, with menu
 * roles, focus and keyboard built in (arrows, typeahead, Escape). Write a row
 * as a `Dropdown.Item`, an on/off row as a `Dropdown.CheckboxItem`, one
 * choice of several as a `Dropdown.RadioItem` in a `Dropdown.RadioGroup`.
 * Group rows with `Dropdown.Group`, open a submenu from a `Dropdown.Item`
 * inside `Dropdown.SubMenu`. `showCheckbox` and `showCheckmark` set how
 * checked rows show. The trigger is one focusable element that forwards its
 * props: `Dropdown.Button`, or an `IconButton` named for what the menu holds.
 * Tab closes the menu, back to the trigger.
 *
 * Not for navigation (use `Link`, the app's NextLink for its routes), one
 * on/off toggle (`Button` or `Chip`), a form value (`Select`) or free-form
 * content (`Popover`).
 *
 * Pitfalls: an `onSelect` that calls `event.preventDefault()` keeps the menu
 * open; an item whose children aren't plain text needs `textValue`; a menu
 * holds only items, so no buttons or links inside it.
 */
import { Avatar } from '@packages/ui/Avatar';
import { IconButton } from '@packages/ui/Button';
import { Dropdown } from '@packages/ui/Dropdown';
import {
  ArrowUpDown,
  Copy,
  Ellipsis,
  Link,
  Pencil,
  Trash2,
  UserPlus,
} from 'lucide-react';
import React, { useState } from 'react';

// Setup: stand-ins for your app's data and requests, not part of the pattern.
const event: EventRow = { id: 'e1', name: 'Design Summit' };

const speakers = ['Ada Lovelace', 'Grace Hopper', 'Alan Turing'];

const fakeSave = () => new Promise<void>((resolve) => setTimeout(resolve, 800));

// Usage: the patterns to copy.
type EventRow = { id: string; name: string };

/**
 * Actions on a table row. An `IconButton` trigger is named per row, so a
 * screen reader hears which event the menu is for; its `tooltip` shows the
 * short name. Each item runs its own `onSelect` once.
 */
const RowActions = ({ row }: { row: EventRow }) => {
  const [status, setStatus] = useState('');

  return (
    <div className="flex-row-gap-2 items-center">
      <Dropdown
        menu={
          <>
            <Dropdown.Item
              leftIcon={<Pencil />}
              onSelect={() => setStatus(`Renaming ${row.name}`)}
            >
              Rename
            </Dropdown.Item>
            <Dropdown.Item
              leftIcon={<Copy />}
              onSelect={() => setStatus(`Duplicated ${row.name}`)}
            >
              Duplicate
            </Dropdown.Item>
            <Dropdown.Separator />
            <Dropdown.Item
              leftIcon={<Trash2 />}
              onSelect={() => setStatus(`Cancelled ${row.name}`)}
            >
              Cancel event
            </Dropdown.Item>
          </>
        }
      >
        <IconButton
          variant="base"
          look="ghost"
          aria-label={`Actions for ${row.name}`}
          tooltip="Actions"
        >
          <Ellipsis />
        </IconButton>
      </Dropdown>
      <p role="status">{status}</p>
    </div>
  );
};

/**
 * Groups, a separator and a submenu. A `Dropdown.Group` without a `label`
 * only sets rows apart; the submenu's trigger is a `Dropdown.Item`, which gets
 * the chevron. `disabledWithReason` keeps an item or submenu visible and says
 * why it can't be used.
 */
const EventMenu = () => {
  const [status, setStatus] = useState('');

  return (
    <div className="flex-row-gap-2 items-center">
      <Dropdown
        menu={
          <>
            <Dropdown.Group label="Edit">
              <Dropdown.Item
                leftIcon={<Pencil />}
                onSelect={() => setStatus('Renaming the event')}
              >
                Rename
              </Dropdown.Item>
              <Dropdown.Item
                leftIcon={<Copy />}
                onSelect={() => setStatus('Event duplicated')}
              >
                Duplicate
              </Dropdown.Item>
            </Dropdown.Group>
            <Dropdown.Separator />
            <Dropdown.Group>
              <Dropdown.SubMenu
                menu={
                  <>
                    <Dropdown.Item
                      leftIcon={<Link />}
                      onSelect={() => setStatus('Link copied')}
                    >
                      Copy link
                    </Dropdown.Item>
                    <Dropdown.Item
                      leftIcon={<UserPlus />}
                      disabledWithReason="Only organizers can invite attendees"
                    >
                      Invite attendees
                    </Dropdown.Item>
                  </>
                }
              >
                <Dropdown.Item>Share</Dropdown.Item>
              </Dropdown.SubMenu>
            </Dropdown.Group>
            <Dropdown.Separator />
            <Dropdown.SubMenu
              disabledWithReason="Exports open after the event ends"
              menu={<Dropdown.Item>Attendee list (CSV)</Dropdown.Item>}
            >
              <Dropdown.Item>Export</Dropdown.Item>
            </Dropdown.SubMenu>
          </>
        }
      >
        <Dropdown.Button size="md">Event</Dropdown.Button>
      </Dropdown>
      <p role="status">{status}</p>
    </div>
  );
};

/**
 * One choice of several: `Dropdown.RadioGroup` with the chosen `value` around
 * `Dropdown.RadioItem`s, the chosen one announced as checked. `textValue` is
 * what typeahead matches when a row's children (here an `Avatar`) aren't
 * text. `Dropdown.Search` filters a long list: you filter the rows, it
 * announces the count and shows the empty state. Enter picks the first match
 * and never submits a form. `onOpenChange` clears the search on close.
 */
const AssignSpeaker = () => {
  const [search, setSearch] = useState('');
  const [speaker, setSpeaker] = useState(speakers[0]);
  const matches = speakers.filter((name) =>
    name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Dropdown
      align="start"
      onOpenChange={(open) => {
        if (!open) setSearch('');
      }}
      menu={
        <>
          <Dropdown.Search
            label="Search speakers"
            placeholder="Search speakers"
            value={search}
            onChange={setSearch}
          />
          <Dropdown.RadioGroup value={speaker} onValueChange={setSpeaker}>
            {matches.map((name) => (
              <Dropdown.RadioItem
                key={name}
                value={name}
                textValue={name}
                leftAddOn={<Avatar name={name} size="sm" />}
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
  );
};

/**
 * On/off options: `Dropdown.CheckboxItem` with `checked` and
 * `onCheckedChange`. Preventing the default in `onSelect` keeps the menu open,
 * so several can be toggled in a row. `showCheckbox` draws a checkbox before
 * each, `showCheckmark={false}` drops the check mark after it; with both on,
 * both show.
 */
const ViewOptions = () => {
  const [showSpeakers, setShowSpeakers] = useState(true);
  const [showVenue, setShowVenue] = useState(false);
  const keepOpen = (select: Event) => select.preventDefault();

  return (
    <Dropdown
      showCheckbox
      showCheckmark={false}
      menu={
        <Dropdown.Group label="Show on the agenda">
          <Dropdown.CheckboxItem
            checked={showSpeakers}
            onCheckedChange={setShowSpeakers}
            onSelect={keepOpen}
          >
            Speakers
          </Dropdown.CheckboxItem>
          <Dropdown.CheckboxItem
            checked={showVenue}
            onCheckedChange={setShowVenue}
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

/**
 * `modal={false}` leaves the rest of the page usable while the menu is open;
 * leave it out unless that's needed. `rightIcon` replaces the chevron.
 */
const SortSessions = () => {
  const [sort, setSort] = useState('start');

  return (
    <Dropdown
      modal={false}
      align="start"
      menu={
        <Dropdown.RadioGroup
          label="Sort by"
          value={sort}
          onValueChange={setSort}
        >
          <Dropdown.RadioItem value="start">Start time</Dropdown.RadioItem>
          <Dropdown.RadioItem value="name">Session name</Dropdown.RadioItem>
        </Dropdown.RadioGroup>
      }
    >
      <Dropdown.Button rightIcon={<ArrowUpDown />}>
        Sort sessions
      </Dropdown.Button>
    </Dropdown>
  );
};

/**
 * An item that waits on work: `loadingWithReason` shows a spinner and says on
 * hover what it's doing. Preventing the default keeps the menu open, and the
 * controlled `open` closes it once the work is done.
 */
const PublishItem = () => {
  const [open, setOpen] = useState(false);
  const [isPublishing, setPublishing] = useState(false);

  return (
    <Dropdown
      open={open}
      onOpenChange={setOpen}
      menu={
        <Dropdown.Item
          loadingWithReason={isPublishing ? 'Publishing the agenda' : undefined}
          onSelect={(select) => {
            select.preventDefault();
            setPublishing(true);
            void fakeSave().then(() => {
              setPublishing(false);
              setOpen(false);
            });
          }}
        >
          Publish agenda
        </Dropdown.Item>
      }
    >
      <Dropdown.Button>Agenda</Dropdown.Button>
    </Dropdown>
  );
};

/**
 * The whole menu unavailable: `disabledWithReason` on the Dropdown disables
 * the trigger and says why in its tooltip. `loadingWithReason` shows a spinner
 * on the trigger and says why; `disableWhileLoading={false}` keeps the menu
 * usable meanwhile.
 */
const MenuStates = () => (
  <div className="flex-row-gap-2 flex-wrap">
    <Dropdown
      disabledWithReason="Sign in to manage tickets"
      menu={<Dropdown.Item>Refund ticket</Dropdown.Item>}
    >
      <Dropdown.Button>Tickets</Dropdown.Button>
    </Dropdown>
    <Dropdown
      loadingWithReason="Loading the venue map"
      disableWhileLoading={false}
      menu={<Dropdown.Item>Open venue map</Dropdown.Item>}
    >
      <Dropdown.Button>Venue</Dropdown.Button>
    </Dropdown>
  </div>
);

export default function DropdownRecipe() {
  return (
    <div className="flex-col-gap-4 items-start">
      <RowActions row={event} />
      <EventMenu />
      <AssignSpeaker />
      <ViewOptions />
      <SortSessions />
      <PublishItem />
      <MenuStates />
    </div>
  );
}
