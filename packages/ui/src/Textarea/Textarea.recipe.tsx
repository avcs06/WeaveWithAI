/**
 * Textarea: a multi-line text field, like an event's description or a note
 * to attendees. `onChange` gets the text, not an event. With `delay`, the
 * text shows at once and `onChange` waits for a pause in typing. It shows 3
 * lines by default (`rows`), and the user can drag it taller. In a `useForm`
 * form, it renders through `Controller`, and `{...field}` gives it its name,
 * value, `onChange`, `required` mark, `error` and focus on a failed submit.
 *
 * When not to use:
 * - One line of text, like a title or an email: Input.
 *
 * Pitfalls:
 * - Every field needs a name: `label`, or `aria-label` / `aria-labelledby`.
 *   A placeholder is not a name.
 * - Enter adds a line; it doesn't submit the form.
 * - In a form, set `required` and a length limit through the `rules` of
 *   `Controller`, so the field shows the message.
 * - Don't put a live counter in `helpText`: it announces on every key. Put
 *   it in `labelRightSlot`.
 * - It takes no icons or add-ons.
 */
import { Button } from '@packages/ui/Button';
import { Controller } from '@packages/ui/Form';
import { Textarea } from '@packages/ui/Textarea';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

// Setup: stand-ins for your app's data and requests, not part of the pattern.
// Stands in for a request to a server.
const saveDescription = (event: EventDetails) =>
  new Promise((resolve) => setTimeout(resolve, 400, event));

const saveNotes = (notes: string) =>
  new Promise((resolve) => setTimeout(resolve, 300, notes));

// Usage: the patterns to copy.
const MAX_DESCRIPTION = 500;
const MAX_PRINTED = 280;

type EventDetails = { description: string };

/**
 * In a form: required, with a length limit from `rules`. The counter sits
 * in `labelRightSlot`, and `helpText` says what's asked.
 */
const DescriptionForm = () => {
  const [status, setStatus] = useState('');
  const { control, handleSubmit } = useForm<EventDetails>({
    defaultValues: { description: '' },
  });

  const submit = async (event: EventDetails) => {
    await saveDescription(event);
    setStatus('Description saved');
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit(submit)}
      className="flex-col-gap-4 items-start"
    >
      <Controller
        name="description"
        control={control}
        rules={{
          required: 'Describe the event',
          maxLength: {
            value: MAX_DESCRIPTION,
            message: `Keep it to ${MAX_DESCRIPTION} characters`,
          },
        }}
      >
        {({ field }) => (
          <Textarea
            label="Description"
            helpText="Shown on the event page, above the schedule."
            labelRightSlot={`${field.value.length}/${MAX_DESCRIPTION}`}
            {...field}
            className="w-full"
          />
        )}
      </Controller>
      <Button type="submit">Save</Button>
      <p role="status">{status}</p>
    </form>
  );
};

/**
 * Saved as the user types: `delay` holds `onChange` until typing pauses for
 * 800ms, while the text shows at once. Leaving the field sends a waiting
 * edit at once.
 */
const OrganizerNotes = () => {
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('All changes saved');

  const save = (next: string) => {
    setNotes(next);
    setStatus('Saving');
    saveNotes(next).then(() => setStatus('All changes saved'));
  };

  return (
    <div className="flex-col-gap-2 w-full">
      <Textarea
        label="Organizer notes"
        delay={800}
        value={notes}
        onChange={save}
      />
      <p role="status">{status}</p>
    </div>
  );
};

/**
 * A longer message: `rows={6}` shows more of it at once, `hint` explains the
 * field in a tooltip and `placeholder` shows an example.
 */
const AttendeeMessage = () => {
  const [message, setMessage] = useState('');

  return (
    <Textarea
      label="Message to attendees"
      hint="Sent by email the day before the event"
      placeholder="Doors open at 6 pm. Bring your ticket on your phone."
      rows={6}
      value={message}
      onChange={setMessage}
      className="w-full"
    />
  );
};

/**
 * No visible label, beside a heading that asks the question: `aria-label`
 * names it. `size="md"` and `variant="base"` suit a calmer, larger field.
 */
const ReplyBox = () => {
  const [reply, setReply] = useState('');

  return (
    <section className="flex-col-gap-2 w-full">
      <h3>Reply to Grace Hopper</h3>
      <Textarea
        aria-label="Your reply"
        size="md"
        variant="base"
        value={reply}
        onChange={setReply}
      />
    </section>
  );
};

/**
 * States: `readOnlyWithReason` keeps the text readable and copyable and says
 * why it can't change; `disabledWithReason` says why it's off; `warning`
 * flags text that is allowed but worth a second look.
 */
const TextareaStates = () => {
  const [summary, setSummary] = useState('');

  return (
    <div className="flex-col-gap-4 w-full">
      <Textarea
        label="Venue notes"
        readOnlyWithReason="Set by the venue"
        value="Load-in through the side door on Quay Street."
        onChange={() => undefined}
      />
      <Textarea
        label="Speaker bio"
        disabledWithReason="Speakers write their own bios"
        value=""
        onChange={() => undefined}
      />
      <Textarea
        label="Talk summary"
        warning={
          summary.length > MAX_PRINTED
            ? `The printed program shows the first ${MAX_PRINTED} characters`
            : undefined
        }
        value={summary}
        onChange={setSummary}
      />
    </div>
  );
};

export default function TextareaRecipe() {
  return (
    <div className="flex-col-gap-6 items-start">
      <DescriptionForm />
      <OrganizerNotes />
      <AttendeeMessage />
      <ReplyBox />
      <TextareaStates />
    </div>
  );
}
