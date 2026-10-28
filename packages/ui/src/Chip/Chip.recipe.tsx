/**
 * Chip: a compact toggle showing whether it's on, for filters and quick choices
 * that stay visible. A ChipGroup holds 2 to about 8: one choice
 * (`mode="single"`, the default, read as radio buttons) or any number
 * (`mode="multiple"`, read as checkboxes). One chip on its own is an
 * independent on/off filter.
 *
 * When not to use:
 * - A chosen value the user removes ("Region: Europe"): Tag with `closable`.
 * - An action (save, delete, open a menu): Button.
 * - More than about 8 options, or long labels: Select, or MultiSelect.
 * - A yes/no answer in a form, with a label: Checkbox.
 *
 * Pitfalls:
 * - A ChipGroup needs a name: `label`, `aria-labelledby` pointing at a visible
 *   heading, or `aria-label` when nothing visible asks the question.
 * - In a form, a ChipGroup is the field: spread Controller's `{...field}` on
 *   it. It brings its own label, help text and error; don't wrap it in a
 *   FormControl.
 * - `mode` defaults to single. Set `mode="multiple"` for several at once.
 * - Every chip in a group needs a `value`.
 * - In a group, the mode picks the look (outline for single, filled for
 *   multiple); `look` on its chips can't override it.
 * - A bare count in a chip means nothing read aloud: give it a unit in visually
 *   hidden text ("12 tickets").
 * - `look="collapsed"` on a ChipGroup lays its chips out as one bar that
 *   doesn't wrap: keep it to a few short labels, and give it no layout
 *   `className`.
 * - Say why a chip can't be changed: `disabledWithReason`,
 *   `readOnlyWithReason`, not a bare `disabled`. A ChipGroup takes
 *   `disabledWithReason` too.
 */
import { Button } from '@packages/ui/Button';
import { Chip, ChipGroup } from '@packages/ui/Chip';
import { Controller } from '@packages/ui/Form';
import { Star, Ticket } from 'lucide-react';
import React, { useId, useState } from 'react';
import { useForm } from 'react-hook-form';

// Setup: stand-ins for your app's data and requests, not part of the pattern.
const ranges = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
];

const statuses = ['Draft', 'Published', 'Sold out', 'Cancelled'];

const tracks = ['Design', 'Engineering', 'Product', 'Research'];

// Stands in for a request to a server.
const saveInterests = (interests: Interests) =>
  new Promise((resolve) => setTimeout(resolve, 400, interests));

// Usage: the patterns to copy.
/**
 * Single choice: exactly one option is on, like a radio group (a date range, a
 * view mode). Picking one turns the other off. A visible heading names the
 * group via `aria-labelledby`. `look="collapsed"` joins the chips into one
 * bar.
 */
const SingleChoice = () => {
  const [range, setRange] = useState('30d');
  const headingId = useId();

  return (
    <div className="flex-col-gap-2">
      <h3 id={headingId}>Show events from the last</h3>
      <ChipGroup
        mode="single"
        aria-labelledby={headingId}
        value={range}
        onChange={setRange}
        look="collapsed"
      >
        {ranges.map(({ value, label }) => (
          <Chip key={value} value={value}>
            {label}
          </Chip>
        ))}
      </ChipGroup>
    </div>
  );
};

/**
 * Multiple choice: any number of options on, like checkboxes (status
 * filters). With no heading to point at, `aria-label` names the group.
 */
const MultipleChoice = () => {
  const [selected, setSelected] = useState<string[]>(['Published']);

  return (
    <ChipGroup
      mode="multiple"
      aria-label="Event status"
      value={selected}
      onChange={setSelected}
      className="flex-row-gap-2 flex-wrap"
    >
      {statuses.map((status) => (
        <Chip key={status} value={status}>
          {status}
        </Chip>
      ))}
    </ChipGroup>
  );
};

/**
 * Independent toggle: one chip on its own, on or off (a "Starred only" filter),
 * controlled with `active` and `onActiveChange`. `leftIcon` is decoration: the
 * text names it.
 */
const IndependentToggle = () => {
  const [starredOnly, setStarredOnly] = useState(false);

  return (
    <Chip
      leftIcon={<Star />}
      active={starredOnly}
      onActiveChange={setStarredOnly}
    >
      Starred only
    </Chip>
  );
};

/**
 * Starts on: begin the state as `true`. `tooltip` adds detail on hover and
 * focus.
 */
const StartsOn = () => {
  const [available, setAvailable] = useState(true);

  return (
    <Chip
      active={available}
      onActiveChange={setAvailable}
      tooltip="Events with at least one ticket left"
      rightIcon={<Ticket />}
    >
      Tickets available
    </Chip>
  );
};

/**
 * Count after the label: `rightAddOn` takes an element. Screen readers get the
 * count with its unit from hidden text, and skip the visual number.
 */
const WithCount = () => {
  const [paid, setPaid] = useState(true);

  return (
    <Chip
      active={paid}
      onActiveChange={setPaid}
      rightAddOn={<span aria-hidden>12</span>}
    >
      Paid tickets
      <span className="sr-only"> (12 tickets)</span>
    </Chip>
  );
};

/**
 * States: `disabledWithReason`, `readOnlyWithReason` and `loadingWithReason`
 * say why on hover and to screen readers. Loading chips stay put and can't be
 * pressed until done.
 */
const States = () => {
  const [on, setOn] = useState(true);

  return (
    <div className="flex-row-gap-2 flex-wrap">
      <Chip
        active={on}
        onActiveChange={setOn}
        disabledWithReason="Early bird sales have ended"
      >
        Early bird
      </Chip>
      <Chip
        active={on}
        onActiveChange={setOn}
        readOnlyWithReason="Set by the organizer"
      >
        Featured
      </Chip>
      <Chip loadingWithReason="Updating the attendee list">Checked in</Chip>
    </div>
  );
};

/**
 * A disabled group: `disabledWithReason` on the ChipGroup disables every chip
 * and gives each the reason; a chip's own reason wins. `disabled` disables the
 * group silently.
 */
const DisabledGroup = () => {
  const [ticket, setTicket] = useState('general');

  return (
    <ChipGroup
      disabledWithReason="Ticket type is fixed after checkout"
      aria-label="Ticket type"
      value={ticket}
      onChange={setTicket}
      className="flex-row-gap-2 flex-wrap"
    >
      <Chip value="general">General</Chip>
      <Chip value="vip">VIP</Chip>
      <Chip value="speaker" disabledWithReason="Speakers are invited">
        Speaker
      </Chip>
    </ChipGroup>
  );
};

type Interests = { tracks: string[] };

/**
 * In a form: the ChipGroup is the field, rendered through Controller with
 * `{...field}`. `label` names it, `helpText` says what's asked, and the rule's
 * message shows as its error on a failed submit.
 */
const InterestsForm = () => {
  const [status, setStatus] = useState('');
  const { control, handleSubmit } = useForm<Interests>({
    defaultValues: { tracks: [] },
  });

  const submit = async (interests: Interests) => {
    await saveInterests(interests);
    setStatus(`Saved ${interests.tracks.join(', ')}`);
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit(submit)}
      className="flex-col-gap-4 items-start"
    >
      <Controller
        name="tracks"
        control={control}
        rules={{
          validate: (value) => value.length > 0 || 'Pick at least one track',
        }}
      >
        {({ field }) => (
          <ChipGroup
            mode="multiple"
            label="Tracks"
            helpText="We'll suggest sessions from these."
            {...field}
            className="flex-row-gap-2 flex-wrap"
          >
            {tracks.map((track) => (
              <Chip key={track} value={track}>
                {track}
              </Chip>
            ))}
          </ChipGroup>
        )}
      </Controller>
      <Button type="submit">Save</Button>
      <p role="status">{status}</p>
    </form>
  );
};

export default function ChipRecipe() {
  return (
    <div className="flex-col-gap-6">
      <SingleChoice />
      <MultipleChoice />
      <IndependentToggle />
      <StartsOn />
      <WithCount />
      <States />
      <DisabledGroup />
      <InterestsForm />
    </div>
  );
}
