/**
 * Popover: a panel of your own content opened from a button, like a filter
 * form, a details card or a quick edit. It's a dialog: focus moves into it
 * when it opens and back to the button when it closes; Escape, a click
 * outside or tabbing out closes it. `Popover.Button` is its trigger.
 *
 * When not to use:
 * - A list of actions or choices alone: Dropdown, which brings menu keyboard
 *   support. Rows in a Popover beside other content are MenuItems.
 * - Picking a form value from a list: Select.
 * - A short hint about a control: the control's `tooltip`.
 *
 * Pitfalls:
 * - Name the content: `aria-labelledby` pointing at its heading, or
 *   `aria-label`.
 * - The trigger is one element that forwards its props and ref: Popover.Button,
 *   or a Button or IconButton. A wrapper component that drops them never
 *   opens the popover.
 * - Put the disabled and loading state on the Popover, not on its trigger:
 *   Popover.Button shows it, with the reason, in its own tooltip.
 * - The content brings its own padding and layout; the panel adds only
 *   space above and below.
 */
import { Button, IconButton, PlainButton } from '@packages/ui/Button';
import { Checkbox, CheckboxGroup } from '@packages/ui/Checkbox';
import { NumberInput } from '@packages/ui/Input';
import { Link } from '@packages/ui/Link';
import { MenuGroup, MenuItem } from '@packages/ui/Menu';
import { Popover } from '@packages/ui/Popover';
import { LogOut, MapPin, UserRound } from 'lucide-react';
import React, { useId, useState } from 'react';

import { venueCard } from './Popover.recipe.css';

// Setup: stand-ins for your app's data and requests, not part of the pattern.
const venue = {
  name: 'Harbour Hall',
  address: '12 Quay Street, Rotterdam',
  mapUrl: 'https://maps.example.com/harbour-hall',
};

// Usage: the patterns to copy.
type AttendeeFilter = { tickets: string[]; checkedInOnly: boolean };

/**
 * A filter form that applies on a button: controlled `open`, so Apply
 * closes it. The heading names the popover through `aria-labelledby`.
 */
const AttendeeFilters = () => {
  const headingId = useId();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<AttendeeFilter>({
    tickets: [],
    checkedInOnly: false,
  });
  const [draft, setDraft] = useState(filter);

  const apply = () => {
    setFilter(draft);
    setOpen(false);
  };

  return (
    <Popover
      aria-labelledby={headingId}
      open={open}
      onOpenChange={(next) => {
        if (next) setDraft(filter);
        setOpen(next);
      }}
      menu={
        <div className="flex-col-gap-3 px-3 py-1">
          <h3 id={headingId}>Filter attendees</h3>
          <CheckboxGroup
            label="Ticket"
            value={draft.tickets}
            onChange={(tickets) => setDraft({ ...draft, tickets })}
            className="flex-col-gap-2"
          >
            <Checkbox value="general">General admission</Checkbox>
            <Checkbox value="vip">VIP</Checkbox>
            <Checkbox value="speaker">Speaker</Checkbox>
          </CheckboxGroup>
          <Checkbox
            checked={draft.checkedInOnly}
            onCheckedChange={(checkedInOnly) =>
              setDraft({ ...draft, checkedInOnly })
            }
          >
            Checked in only
          </Checkbox>
          <Button onClick={apply}>Apply</Button>
        </div>
      }
    >
      <Popover.Button>Filters</Popover.Button>
    </Popover>
  );
};

/**
 * A details card from an icon button: `align="start"` lines it up with the
 * button's start edge, and `menuClassName` sizes the panel, which renders
 * outside the button's parent.
 */
const VenueDetails = () => {
  const headingId = useId();

  return (
    <Popover
      aria-labelledby={headingId}
      align="start"
      menuClassName={venueCard}
      menu={
        <div className="flex-col-gap-2 px-3 py-1 items-start">
          <h3 id={headingId}>{venue.name}</h3>
          <p>{venue.address}</p>
          <Link href={venue.mapUrl}>Open in maps</Link>
          <Button
            variant="base"
            onClick={() => navigator.clipboard.writeText(venue.address)}
          >
            Copy address
          </Button>
        </div>
      }
    >
      <IconButton variant="base" aria-label="Venue details" tooltip="Venue">
        <MapPin />
      </IconButton>
    </Popover>
  );
};

/**
 * A quick edit that shouldn't be left by accident: `modal` keeps focus in
 * the panel and blocks the page until it closes. `size="md"` sits beside
 * md inputs.
 */
const EditCapacity = () => {
  const [open, setOpen] = useState(false);
  const [capacity, setCapacity] = useState<number | null>(120);
  const [draft, setDraft] = useState(capacity);

  return (
    <Popover
      aria-label="Edit capacity"
      modal
      open={open}
      onOpenChange={(next) => {
        if (next) setDraft(capacity);
        setOpen(next);
      }}
      menu={
        <div className="flex-col-gap-3 px-3 py-1">
          <NumberInput
            label="Capacity"
            autoComplete="off"
            min={1}
            value={draft}
            onChange={setDraft}
          />
          <div className="flex-row-gap-2 justify-end">
            <Button variant="base" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setCapacity(draft);
                setOpen(false);
              }}
            >
              Save
            </Button>
          </div>
        </div>
      }
    >
      <Popover.Button size="md">Capacity: {capacity ?? 'none'}</Popover.Button>
    </Popover>
  );
};

/**
 * Details with a few actions under them: the actions are MenuItem rows in a
 * MenuGroup, each pressed through a PlainButton, and Tab moves between them.
 * A panel of actions alone is a Dropdown, which brings the arrow keys.
 */
const AccountPanel = () => {
  const headingId = useId();
  const [status, setStatus] = useState('');

  return (
    <div className="flex-row-gap-2 items-center">
      <Popover
        aria-labelledby={headingId}
        menu={
          <div className="flex-col-gap-2">
            <div className="px-4">
              <h3 id={headingId}>Ada Lovelace</h3>
              <p>ada@example.com · Organizer</p>
            </div>
            <MenuGroup>
              <PlainButton onClick={() => setStatus('Opening your profile')}>
                <MenuItem leftIcon={<UserRound />}>Profile settings</MenuItem>
              </PlainButton>
              <PlainButton onClick={() => setStatus('Signed out')}>
                <MenuItem leftIcon={<LogOut />}>Sign out</MenuItem>
              </PlainButton>
            </MenuGroup>
          </div>
        }
      >
        <Popover.Button>Account</Popover.Button>
      </Popover>
      <p role="status">{status}</p>
    </div>
  );
};

/**
 * States, set on the Popover: it never opens while disabled or loading, and
 * Popover.Button says why on hover and on a press. With
 * `disableWhileLoading={false}` it opens while loading, for content that is
 * useful before the refresh ends. `look="ghost"` makes the button quiet.
 */
const PopoverStates = ({ refreshing }: { refreshing: boolean }) => (
  <div className="flex-row-gap-2 flex-wrap">
    <Popover
      aria-label="Refunds"
      disabledWithReason="Refunds open after the event"
      menu={<p className="px-3 py-1">Refund requests</p>}
    >
      <Popover.Button>Refunds</Popover.Button>
    </Popover>
    <Popover
      aria-label="Seating plan"
      loadingWithReason={refreshing ? 'Loading the seating plan' : undefined}
      menu={<p className="px-3 py-1">Seats by row</p>}
    >
      <Popover.Button>Seating</Popover.Button>
    </Popover>
    <Popover
      aria-label="Live check-ins"
      // It still opens, so the spinner alone tells the count is updating.
      loading={refreshing}
      disableWhileLoading={false}
      menu={<p className="px-3 py-1">Check-ins so far: 86</p>}
    >
      <Popover.Button look="ghost">Check-ins</Popover.Button>
    </Popover>
  </div>
);

export default function PopoverRecipe() {
  return (
    <div className="flex-col-gap-6 items-start">
      <AttendeeFilters />
      <VenueDetails />
      <EditCapacity />
      <AccountPanel />
      <PopoverStates refreshing />
    </div>
  );
}
