/**
 * Checkbox: one yes/no choice, like consent or a setting; its children are its
 * label.
 * CheckboxGroup: several checkboxes answering one question, with the
 * question's label, help text and error, wired like any form field. The
 * group's `className` lays out the checkboxes: a column or a row.
 *
 * When not to use:
 * - One choice out of a few short options: ChipGroup `mode="single"`; out of
 *   a longer list, Select.
 * - Many choices out of a long list: MultiSelect.
 * - Toggling filters above a list or table: ChipGroup `mode="multiple"`.
 * - Running an action: Button. A checkbox only states a choice.
 *
 * Pitfalls:
 * - A checkbox on its own is controlled: `checked` and `onCheckedChange`,
 *   both required.
 * - Every checkbox needs a name: its children are the label, or `aria-label`
 *   when the row or column around it says what it is, like a table's "Select
 *   row 3".
 * - In a group, give each Checkbox a `value` and leave out `checked`: the
 *   group's `value` decides it.
 * - `onCheckedChange` gets a boolean. `'indeterminate'` is only shown; a
 *   click on it checks the box.
 * - Say why a box can't be changed: `disabledWithReason` or
 *   `readOnlyWithReason`, not a bare `disabled`.
 */
import { Button } from '@packages/ui/Button';
import { Checkbox, CheckboxGroup } from '@packages/ui/Checkbox';
import { Controller } from '@packages/ui/Form';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

// Setup: stand-ins for your app's data and requests, not part of the pattern.
const sessions = [
  { id: 'keynote', title: 'Opening keynote' },
  { id: 'design', title: 'Design systems at scale' },
  { id: 'a11y', title: 'Accessible forms workshop' },
];

const tracks = ['Design', 'Engineering', 'Product', 'Community'];

// Stands in for a request to the server.
const savePreferences = (preferences: Preferences) =>
  new Promise<Preferences>((resolve) => {
    setTimeout(() => resolve(preferences), 400);
  });

// Usage: the patterns to copy.
/**
 * Consent before registering: `required` marks the label, `hint` explains
 * it, and the submit button says why it waits.
 */
const CodeOfConduct = () => {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="flex-col-gap-3 items-start">
      <Checkbox
        hint="Be kind, and report harassment to the event staff"
        required
        checked={agreed}
        onCheckedChange={setAgreed}
      >
        I agree to the code of conduct
      </Checkbox>
      <Button
        disabledWithReason={
          agreed ? undefined : 'Agree to the code of conduct first'
        }
      >
        Register
      </Button>
    </div>
  );
};

/**
 * A setting saved as it changes: `onCheckedChange` saves. `tooltip` adds
 * detail on hover and focus.
 */
const ReminderSetting = () => {
  const [reminder, setReminder] = useState(true);

  return (
    <div className="flex-col-gap-2">
      <Checkbox
        tooltip="Sent at 9:00 in the event's time zone"
        checked={reminder}
        onCheckedChange={setReminder}
      >
        Email me a reminder the day before
      </Checkbox>
      <p>Saved: reminder {reminder ? 'on' : 'off'}</p>
    </div>
  );
};

/**
 * "Select all" over a list: the parent is checked when every child is,
 * `'indeterminate'` when some are, and checks or clears them all.
 */
const SelectAllSessions = () => {
  const [selected, setSelected] = useState<string[]>(['keynote']);
  const allChecked =
    selected.length === sessions.length
      ? true
      : selected.length > 0
        ? 'indeterminate'
        : false;

  return (
    <div className="flex-col-gap-2">
      <Checkbox
        checked={allChecked}
        onCheckedChange={(checked) =>
          setSelected(checked ? sessions.map((session) => session.id) : [])
        }
      >
        All sessions
      </Checkbox>
      <CheckboxGroup
        aria-label="Sessions"
        value={selected}
        onChange={setSelected}
        className="flex-col-gap-2 pl-6"
      >
        {sessions.map((session) => (
          <Checkbox key={session.id} value={session.id}>
            {session.title}
          </Checkbox>
        ))}
      </CheckboxGroup>
    </div>
  );
};

/**
 * Sizes: `sm` (the default) in lists and forms, `md` beside `md` inputs and
 * buttons. `variant="base"` fills a checked box in neutral instead of the
 * theme color, for a dense checklist where the accent is too loud.
 */
const CheckInChecklist = () => {
  const [badge, setBadge] = useState(true);
  const [lanyard, setLanyard] = useState(true);
  const [dietary, setDietary] = useState(false);

  return (
    <div className="flex-col-gap-2">
      <Checkbox size="md" checked={badge} onCheckedChange={setBadge}>
        Badge printed
      </Checkbox>
      <Checkbox variant="base" checked={lanyard} onCheckedChange={setLanyard}>
        Lanyard handed out
      </Checkbox>
      <Checkbox variant="base" checked={dietary} onCheckedChange={setDietary}>
        Dietary needs noted
      </Checkbox>
    </div>
  );
};

/**
 * Boxes that can't be changed say why on hover, on a press, and to screen
 * readers: `disabledWithReason` for a choice that's unavailable,
 * `readOnlyWithReason` for one that's set elsewhere.
 */
const TicketExtras = () => {
  const [lunch, setLunch] = useState(true);
  const [tour, setTour] = useState(false);
  const [recording, setRecording] = useState(true);

  return (
    <div className="flex-col-gap-2">
      <Checkbox
        checked={lunch}
        onCheckedChange={setLunch}
        readOnlyWithReason="Included with the VIP ticket"
      >
        Lunch on both days
      </Checkbox>
      <Checkbox
        checked={tour}
        onCheckedChange={setTour}
        disabledWithReason="The tour is fully booked"
      >
        Evening boat tour
      </Checkbox>
      <Checkbox
        checked={recording}
        onCheckedChange={setRecording}
        // The row above already says recordings come with the ticket.
        disabled
      >
        Recording of every session
      </Checkbox>
    </div>
  );
};

type Preferences = { channels: string[] };

/**
 * A group in a form, through `Controller`: `{...field}` gives it its name,
 * value, required mark, error and focus on submit. A column layout, with
 * help text, and a warning while a costly choice is checked.
 */
const NotificationChannels = () => {
  const { control, handleSubmit } = useForm<Preferences>({
    defaultValues: { channels: [] },
  });

  return (
    <form
      noValidate
      onSubmit={handleSubmit(savePreferences)}
      className="flex-col-gap-4 items-start"
    >
      <Controller
        name="channels"
        control={control}
        rules={{ required: 'Pick at least one channel' }}
      >
        {({ field }) => (
          <CheckboxGroup
            label="Send ticket updates by"
            helpText="Schedule changes and your check-in code"
            warning={
              field.value.includes('sms')
                ? 'Your carrier may charge for texts'
                : undefined
            }
            {...field}
            className="flex-col-gap-2"
          >
            <Checkbox value="email">Email</Checkbox>
            <Checkbox value="sms">Text message</Checkbox>
            <Checkbox value="push">App notification</Checkbox>
          </CheckboxGroup>
        )}
      </Controller>
      <Button type="submit">Save preferences</Button>
    </form>
  );
};

/**
 * A row layout that wraps, saved as it changes: `success` confirms the
 * save, `labelRightSlot` holds a quick action, and `hint` explains the
 * question.
 */
const SessionTracks = () => {
  const [picked, setPicked] = useState<string[]>(['Design']);
  const [saved, setSaved] = useState(false);

  const pick = (next: string[]) => {
    setPicked(next);
    setSaved(true);
  };

  return (
    <CheckboxGroup
      label="Tracks you follow"
      hint="We suggest sessions from these tracks"
      success={saved ? 'Saved to your profile' : undefined}
      labelRightSlot={
        <Button variant="base" look="ghost" onClick={() => pick([])}>
          Clear
        </Button>
      }
      value={picked}
      onChange={pick}
      className="flex-row-gap-4 flex-wrap"
    >
      {tracks.map((track) => (
        <Checkbox key={track} value={track}>
          {track}
        </Checkbox>
      ))}
    </CheckboxGroup>
  );
};

/**
 * A whole group that can't change: each checkbox shows the group's reason,
 * and a checkbox's own reason comes first. `readOnlyWithReason` works the
 * same for a group set elsewhere.
 */
const ClosedWorkshops = () => {
  const [workshops, setWorkshops] = useState<string[]>(['figma']);

  return (
    <CheckboxGroup
      label="Workshops"
      value={workshops}
      onChange={setWorkshops}
      disabledWithReason="Registration closed on May 1"
      className="flex-col-gap-2"
    >
      <Checkbox value="figma">Figma for developers</Checkbox>
      <Checkbox value="testing" disabledWithReason="Cancelled by the speaker">
        Testing with screen readers
      </Checkbox>
    </CheckboxGroup>
  );
};

export default function CheckboxRecipe() {
  return (
    <div className="flex-col-gap-6">
      <CodeOfConduct />
      <ReminderSetting />
      <SelectAllSessions />
      <CheckInChecklist />
      <TicketExtras />
      <NotificationChannels />
      <SessionTracks />
      <ClosedWorkshops />
    </div>
  );
}
