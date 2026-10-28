/**
 * Select and MultiSelect: one choice or several from a list. Controlled
 * only; options are `SelectOption` children (map a list, use `SelectGroup` to
 * group). A search field and a clear button are on by default:
 * `allowSearch={false}` removes the field, `allowClear={false}` the button,
 * and `onSearch` searches on the server instead. An option's children draw its
 * row, `renderTrigger` the trigger. In a form, wire it through `Controller`:
 * `{...field}` is all it needs.
 *
 * Use it for about 6 to 200 choices. For 2 to 5 visible choices use
 * ChipGroup or CardGroup, for actions use Dropdown, for free text use Input:
 * a Select can't create an option.
 *
 * Pitfalls:
 * - Native form submission (`FormData`, `<form action>`) isn't supported:
 *   read values through `Controller` and `handleSubmit`.
 * - Give the form `defaultValues`: `''` for a Select, `[]` for a MultiSelect.
 * - A saved value the results leave out shows its raw id: keep its
 *   `SelectOption` in the list.
 * - Past about 200 options, search on the server with `onSearch`.
 * - A single Select's `onChange` sends `''` when cleared: type its state
 *   `V | ''`, or guard for it.
 */
import { Avatar } from '@packages/ui/Avatar';
import { Button } from '@packages/ui/Button';
import { Controller } from '@packages/ui/Form';
import {
  MultiSelect,
  Select,
  SelectGroup,
  SelectOption,
  type SelectOptionData,
} from '@packages/ui/Select';
import { Tag } from '@packages/ui/Tag';
import { Globe } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

// Setup: stand-ins for your app's data and requests, not part of the pattern.
const tickets: readonly Ticket[] = [
  { id: 'general', name: 'General admission', price: 49 },
  { id: 'vip', name: 'VIP', price: 149 },
  { id: 'workshop', name: 'Workshop pass', price: 99, soldOut: true },
  { id: 'student', name: 'Student', price: 19 },
];

const sessions: readonly Session[] = [
  { id: 'keynote', title: 'Opening keynote', day: 'Friday' },
  { id: 'a11y', title: 'Accessible forms', day: 'Friday' },
  { id: 'perf', title: 'Rendering performance', day: 'Saturday' },
  { id: 'design', title: 'Design systems at scale', day: 'Saturday' },
];

// Stands in for a request to the server.
const registerAttendee = (registration: Registration) =>
  new Promise<Registration>((resolve) => {
    setTimeout(() => resolve(registration), 500);
  });

const teams = ['Design', 'Engineering', 'Marketing', 'Sales', 'Support'];

const venues: readonly Venue[] = [
  { id: 'harbor', name: 'Harbor Hall', city: 'Lisbon' },
  { id: 'atrium', name: 'The Atrium', city: 'Berlin' },
  { id: 'loft', name: 'Riverside Loft', city: 'Prague' },
  { id: 'dome', name: 'Glass Dome', city: 'Lisbon' },
];

// Stands in for a request to the server.
const searchVenues = (text: string) =>
  new Promise<Venue[]>((resolve) => {
    setTimeout(
      () =>
        resolve(
          venues.filter(({ name, city }) =>
            `${name} ${city}`.toLowerCase().includes(text.toLowerCase()),
          ),
        ),
      300,
    );
  });

const savedVenue = venues[0];

const speakers: readonly Speaker[] = [
  { id: 'ada', name: 'Ada Lovelace' },
  { id: 'grace', name: 'Grace Hopper' },
  { id: 'alan', name: 'Alan Turing' },
  { id: 'margaret', name: 'Margaret Hamilton' },
];

// Stands in for a request to the server.
const searchSpeakers = (text: string) =>
  new Promise<Speaker[]>((resolve) => {
    setTimeout(
      () =>
        resolve(
          speakers.filter(({ name }) =>
            name.toLowerCase().includes(text.toLowerCase()),
          ),
        ),
      300,
    );
  });

const people: readonly Person[] = [
  { id: 'ada', name: 'Ada Lovelace', role: 'Admin' },
  { id: 'grace', name: 'Grace Hopper', role: 'Editor' },
  { id: 'alan', name: 'Alan Turing', role: 'Viewer' },
];

const tracks = ['Frontend', 'Backend', 'Design', 'Data', 'Operations'];

const timezones = ['UTC', 'Europe/Lisbon', 'America/New_York'];
const rooms = ['Main hall', 'Workshop room'];
const currencies = ['EUR', 'USD', 'GBP'];

const visibilities = ['Public', 'Members only', 'Invite only'];

const sessionLengths = ['30', '45', '60', '90'];

// Usage: the patterns to copy.
type Ticket = { id: string; name: string; price: number; soldOut?: boolean };

type Session = { id: string; title: string; day: string };

type Registration = { ticketType: string; sessions: string[] };

/**
 * Single and multiple in a form, each through `Controller`: `rules` validate,
 * `validate` checks a list, and a failed rule's message shows below the help
 * text.
 */
const RegistrationForm = () => {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<Registration>({
    defaultValues: { ticketType: '', sessions: [] },
  });

  return (
    <form
      noValidate
      onSubmit={handleSubmit(registerAttendee)}
      className="flex-col-gap-4 items-start"
    >
      <Controller
        name="ticketType"
        control={control}
        rules={{ required: 'Choose a ticket type' }}
      >
        {({ field }) => (
          <Select label="Ticket type" helpText="Prices include tax" {...field}>
            {tickets.map((ticket) => (
              <SelectOption
                key={ticket.id}
                value={ticket.id}
                label={ticket.name}
              />
            ))}
          </Select>
        )}
      </Controller>
      <Controller
        name="sessions"
        control={control}
        rules={{
          validate: (value) =>
            value.length > 0 || 'Choose at least one session',
        }}
      >
        {({ field }) => (
          <MultiSelect
            label="Sessions"
            helpText="You can change these until the event"
            {...field}
          >
            {sessions.map((session) => (
              <SelectOption
                key={session.id}
                value={session.id}
                label={session.title}
              />
            ))}
          </MultiSelect>
        )}
      </Controller>
      <Button
        type="submit"
        loadingWithReason={isSubmitting ? 'Registering…' : undefined}
      >
        Register
      </Button>
    </form>
  );
};

/**
 * Options with data and states. An extra prop on `SelectOption`, like
 * `price`, reaches `onChange` with the option: type it with
 * `SelectOptionData`. A sold-out option takes `disabledWithReason`, shown on
 * hover.
 */
const TicketTypeSelect = () => {
  const [value, setValue] = useState('');
  const [total, setTotal] = useState<number>();

  return (
    <Select
      label="Ticket"
      helpText={total === undefined ? undefined : `Total: $${total}`}
      value={value}
      onChange={(
        next,
        option: SelectOptionData<string, { price: number }> | undefined,
      ) => {
        setValue(next);
        setTotal(option?.price);
      }}
    >
      {tickets.map((ticket) => (
        <SelectOption
          key={ticket.id}
          value={ticket.id}
          label={ticket.name}
          price={ticket.price}
          disabledWithReason={ticket.soldOut ? 'Sold out' : undefined}
        >
          {ticket.name} (${ticket.price})
        </SelectOption>
      ))}
    </Select>
  );
};

type SortKey = 'date' | 'name' | 'attendees';

const sortLabels: Record<SortKey, string> = {
  date: 'Date',
  name: 'Name',
  attendees: 'Attendees',
};

/**
 * A toolbar control that always has a value: `aria-label` names it.
 * `allowSearch={false}` drops the search field (a letter opens the menu or
 * jumps to a match, as in a native select), `allowClear={false}` keeps a value
 * chosen, `variant="base"` and `look="open"` suit a toolbar.
 */
const SortSelect = () => {
  const [sort, setSort] = useState<SortKey>('date');

  return (
    <Select
      aria-label="Sort events by"
      allowSearch={false}
      allowClear={false}
      variant="base"
      look="open"
      value={sort}
      onChange={(next) => next && setSort(next)}
    >
      {Object.entries(sortLabels).map(([key, label]) => (
        <SelectOption key={key} value={key} label={label} />
      ))}
    </Select>
  );
};

/**
 * MultiSelect filtering on the client: each value is a tag, Backspace in the
 * empty search removes the last, the clear button clears all. `showCheckbox`
 * adds a checkbox before each option, beside the check mark;
 * `showCheckmark={false}` drops the mark.
 */
const TeamFilter = () => {
  const [values, setValues] = useState<string[]>([]);
  return (
    <MultiSelect label="Teams" showCheckbox value={values} onChange={setValues}>
      {teams.map((team) => (
        <SelectOption key={team} value={team} label={team} />
      ))}
    </MultiSelect>
  );
};

type Venue = { id: string; name: string; city: string };

/**
 * Server search: `onSearch` runs after a pause in typing, the parent renders
 * the matches, and `loading` shows meanwhile. Each answer keeps the text it
 * answers: one to older text is dropped, and loading lasts until an answer
 * matches the last text typed. The saved venue stays an option when the
 * results omit it, so its label shows, not its id.
 */
const VenueSearch = () => {
  const [value, setValue] = useState(savedVenue.id);
  const [search, setSearch] = useState('');
  const [answer, setAnswer] = useState<{ search: string; venues: Venue[] }>();

  useEffect(() => {
    let stale = false;
    searchVenues(search).then((venues) => {
      if (!stale) setAnswer({ search, venues });
    });
    return () => {
      stale = true;
    };
  }, [search]);

  const loading = answer?.search !== search;
  const results = answer?.venues ?? [];
  const listed = results.some(({ id }) => id === value)
    ? results
    : [...results, ...venues.filter(({ id }) => id === value)];

  return (
    <Select
      label="Venue"
      onSearch={setSearch}
      // Usable while loading: the spinner says results are on the way.
      loading={loading}
      value={value}
      onChange={setValue}
    >
      {listed.map((venue) => (
        <SelectOption key={venue.id} value={venue.id} label={venue.name}>
          {venue.name}, {venue.city}
        </SelectOption>
      ))}
    </Select>
  );
};

type Speaker = { id: string; name: string };

/**
 * MultiSelect searching on the server, with `search` controlled so the parent
 * owns the typed text. Loading and stale answers work as in VenueSearch.
 * Chosen speakers the results omit stay options, so their tags keep names.
 */
const SpeakerSearch = () => {
  const [values, setValues] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [answer, setAnswer] = useState<{
    search: string;
    speakers: Speaker[];
  }>();

  useEffect(() => {
    let stale = false;
    searchSpeakers(search).then((found) => {
      if (!stale) setAnswer({ search, speakers: found });
    });
    return () => {
      stale = true;
    };
  }, [search]);

  const loading = answer?.search !== search;
  const results = answer?.speakers ?? [];
  const kept = speakers.filter(
    ({ id }) => values.includes(id) && !results.some((item) => item.id === id),
  );

  return (
    <MultiSelect
      label="Speakers"
      search={search}
      onSearch={setSearch}
      // Usable while loading: the spinner says results are on the way.
      loading={loading}
      value={values}
      onChange={setValues}
    >
      {[...kept, ...results].map((speaker) => (
        <SelectOption
          key={speaker.id}
          value={speaker.id}
          label={speaker.name}
        />
      ))}
    </MultiSelect>
  );
};

type Person = { id: string; name: string; role: string };

/**
 * Custom rows and trigger: an option's children draw its row, and
 * `renderTrigger` draws the trigger once something is selected. `label` stays
 * the text search matches and typeahead uses. `md`: its 32px line fits the
 * 28px avatar without growing the box.
 */
const AssigneeSelect = () => {
  const [value, setValue] = useState('');
  return (
    <Select
      label="Assignee"
      placeholder="Unassigned"
      size="md"
      value={value}
      onChange={setValue}
      // The menu is as wide as the trigger: wide enough for the rows.
      className="w-full"
      renderTrigger={({ selected }) => (
        <span className="flex-row-gap-2 items-center">
          <Avatar size="sm" name={selected.label} />
          {selected.label}
        </span>
      )}
    >
      {people.map((person) => (
        <SelectOption key={person.id} value={person.id} label={person.name}>
          <span className="flex-row-gap-2 items-center">
            <Avatar size="sm" name={person.name} />
            {person.name}
            <Tag size="xs">{person.role}</Tag>
          </span>
        </SelectOption>
      ))}
    </Select>
  );
};

/**
 * MultiSelect with `renderTrigger` replacing the tags with a summary, for a
 * filter in a crowded row. It shows once something is selected.
 */
const TrackFilter = () => {
  const [values, setValues] = useState<string[]>([]);
  return (
    <MultiSelect
      label="Tracks"
      allowSearch={false}
      value={values}
      onChange={setValues}
      renderTrigger={({ selected }) => `${selected.length} tracks`}
    >
      {tracks.map((track) => (
        <SelectOption key={track} value={track} label={track} />
      ))}
    </MultiSelect>
  );
};

/**
 * Grouped options: a `SelectGroup` labels its options, here each day's
 * sessions. Search keeps the groups that still match.
 */
const SessionSelect = () => {
  const [value, setValue] = useState('');
  const days = [...new Set(sessions.map(({ day }) => day))];

  return (
    <Select label="Session" value={value} onChange={setValue}>
      {days.map((day) => (
        <SelectGroup key={day} label={day}>
          {sessions
            .filter((session) => session.day === day)
            .map((session) => (
              <SelectOption
                key={session.id}
                value={session.id}
                label={session.title}
              />
            ))}
        </SelectGroup>
      ))}
    </Select>
  );
};

/**
 * Disabled, read-only and loading states, each with a hover reason:
 * `readOnlyWithReason` for a value that can't change here,
 * `disabledWithReason` for a control not available yet, `loadingWithReason`
 * for choices on the way. A Select stays usable while loading unless
 * `disableWhileLoading` is set. Without a reason, `disabled`, `readOnly` and
 * `loading` take `true`.
 */
const EventSettings = () => {
  const [timezone, setTimezone] = useState('Europe/Lisbon');
  const [room, setRoom] = useState('');
  const [currency, setCurrency] = useState('EUR');

  return (
    <div className="flex-col-gap-4 items-start">
      <Select
        label="Timezone"
        readOnlyWithReason="Set by the venue"
        value={timezone}
        onChange={setTimezone}
      >
        {timezones.map((zone) => (
          <SelectOption key={zone} value={zone} label={zone} />
        ))}
      </Select>
      <Select
        label="Room"
        disabledWithReason="Choose a venue first"
        value={room}
        onChange={setRoom}
      >
        {rooms.map((name) => (
          <SelectOption key={name} value={name} label={name} />
        ))}
      </Select>
      <Select
        label="Currency"
        loadingWithReason="Loading rates"
        disableWhileLoading
        value={currency}
        onChange={setCurrency}
      >
        {currencies.map((code) => (
          <SelectOption key={code} value={code} label={code} />
        ))}
      </Select>
    </div>
  );
};

/**
 * Field decoration: `leftIcon`, `hint` (a tooltip from the info icon),
 * `labelRightSlot`, `tooltip` on the box and a `warning` message.
 */
const VisibilitySelect = () => {
  const [value, setValue] = useState('Public');
  return (
    <Select
      label="Visibility"
      leftIcon={<Globe />}
      hint="Who can find this event"
      labelRightSlot={<Tag size="xs">New</Tag>}
      tooltip="Applies to the event page"
      warning={value === 'Public' ? 'Anyone can see this event' : undefined}
      value={value}
      onChange={setValue}
    >
      {visibilities.map((visibility) => (
        <SelectOption key={visibility} value={visibility} label={visibility} />
      ))}
    </Select>
  );
};

/**
 * A unit after the value with `rightAddOn` (`leftAddOn` goes before), and a
 * status from the choice: `success` when it fits the slot, `error` when not.
 * Each status takes a message, or `true` for the style alone.
 */
const SessionLength = () => {
  const [value, setValue] = useState('45');
  const fits = value !== '' && Number(value) <= 60;

  return (
    <Select
      label="Session length"
      rightAddOn="minutes"
      success={fits ? 'Fits the 60-minute slot' : undefined}
      error={
        value !== '' && !fits ? 'Longer than the 60-minute slot' : undefined
      }
      value={value}
      onChange={setValue}
    >
      {sessionLengths.map((length) => (
        <SelectOption key={length} value={length} label={length} />
      ))}
    </Select>
  );
};

export default function SelectRecipe() {
  return (
    <div className="flex-col-gap-6 items-start">
      <RegistrationForm />
      <TicketTypeSelect />
      <SortSelect />
      <TeamFilter />
      <VenueSearch />
      <SpeakerSearch />
      <AssigneeSelect />
      <TrackFilter />
      <SessionSelect />
      <EventSettings />
      <VisibilitySelect />
      <SessionLength />
    </div>
  );
}
