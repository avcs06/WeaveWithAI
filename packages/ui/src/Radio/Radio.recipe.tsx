/**
 * Radio and RadioGroup: one choice from a few visible options, like a ticket
 * type. RadioGroup is the form field, with label, help text and error; each
 * Radio's children are its label. Arrow keys move between radios and choose;
 * the group is one tab stop.
 *
 * When not to use:
 * - Any number of choices: CheckboxGroup. One yes/no: Checkbox.
 * - Short choices in a toolbar or filter bar: ChipGroup. Choices with a
 *   description or picture: CardGroup.
 * - More than about 7 options: Select.
 *
 * Pitfalls:
 * - A Radio renders only inside a RadioGroup, and each needs a `value`.
 * - The group needs a name: `label`, `aria-labelledby` or `aria-label`.
 * - It's controlled: `value` and `onChange`, or `{...field}` from Controller.
 *   Set `required` through the Controller's `rules`.
 * - RadioGroup adds no layout: lay the radios out with its `className`.
 * - Say why a radio can't be chosen with `disabledWithReason`: it stays
 *   reachable by arrow keys, so the reason is read.
 */
import { Button } from '@packages/ui/Button';
import { Controller } from '@packages/ui/Form';
import { Radio, RadioGroup } from '@packages/ui/Radio';
import { Section } from '@packages/ui/Section';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

// Setup: stand-ins for your app's data and requests, not part of the pattern.
// Stands in for a request to a server.
const register = (registration: Registration) =>
  new Promise((resolve) => setTimeout(resolve, 400, registration));

// Usage: the patterns to copy.
type Registration = { ticket: string };

/**
 * In a form: RadioGroup renders through Controller with `{...field}`. `rules`
 * makes it required, so the label shows the mark and a failed submit shows the
 * error and focuses the group. A radio that can't be chosen says why.
 */
const TicketForm = () => {
  const [status, setStatus] = useState('');
  const { control, handleSubmit } = useForm<Registration>({
    defaultValues: { ticket: '' },
  });

  const submit = async (registration: Registration) => {
    await register(registration);
    setStatus(`Registered with a ${registration.ticket} ticket`);
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit(submit)}
      className="flex-col-gap-4 items-start"
    >
      <Controller
        name="ticket"
        control={control}
        rules={{ required: 'Choose a ticket' }}
      >
        {({ field }) => (
          <RadioGroup
            label="Ticket"
            helpText="You can change it until the day before."
            {...field}
            className="flex-col-gap-2"
          >
            <Radio value="general">General admission</Radio>
            <Radio value="vip" hint="Includes the speaker dinner">
              VIP
            </Radio>
            <Radio value="student" disabledWithReason="Sold out">
              Student
            </Radio>
          </RadioGroup>
        )}
      </Controller>
      <Button type="submit">Register</Button>
      <p role="status">{status}</p>
    </form>
  );
};

/**
 * Outside a form: a controlled value, radios in a row via `className`, and
 * `size="md"` with `variant="base"` for a calmer, larger look.
 */
const BadgePickup = () => {
  const [pickup, setPickup] = useState('desk');

  return (
    <RadioGroup
      label="Badge pickup"
      value={pickup}
      onChange={setPickup}
      className="flex-row-gap-4 flex-wrap"
    >
      <Radio value="desk" size="md" variant="base">
        Front desk
      </Radio>
      <Radio value="mail" size="md" variant="base">
        By mail
      </Radio>
    </RadioGroup>
  );
};

/**
 * A choice that can't change now: `readOnlyWithReason` keeps the radios
 * readable and says why; `disabledWithReason` turns the whole group off and
 * says why. Each radio shows the group's reason.
 */
const LockedChoices = () => (
  <div className="flex-col-gap-4">
    <RadioGroup
      label="Seating"
      readOnlyWithReason="Seats are assigned by the organizer"
      value="assigned"
      onChange={() => undefined}
      className="flex-col-gap-2"
    >
      <Radio value="assigned">Assigned seat</Radio>
      <Radio value="open">Open seating</Radio>
    </RadioGroup>
    <RadioGroup
      label="Meal"
      disabledWithReason="Meals open a week before the event"
      value=""
      onChange={() => undefined}
      className="flex-col-gap-2"
    >
      <Radio value="standard">Standard</Radio>
      <Radio value="vegetarian">Vegetarian</Radio>
    </RadioGroup>
  </div>
);

/**
 * No visible group label: a heading names the group via `aria-labelledby`, and
 * a radio's `tooltip` explains it on hover and focus.
 */
const SessionLength = () => {
  const [length, setLength] = useState('30');

  return (
    <Section title="Session length" titleId="session-length">
      <RadioGroup
        aria-labelledby="session-length"
        value={length}
        onChange={setLength}
        className="flex-row-gap-4"
      >
        <Radio value="30">30 minutes</Radio>
        <Radio value="60" tooltip="Needs a room with a projector">
          60 minutes
        </Radio>
      </RadioGroup>
    </Section>
  );
};

export default function RadioRecipe() {
  return (
    <div className="flex-col-gap-6 items-start">
      <TicketForm />
      <BadgePickup />
      <LockedChoices />
      <SessionLength />
    </div>
  );
}
