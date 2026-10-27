/**
 * Button: an action the user takes: save, publish, delete, open a menu.
 * `default` is the main action of a view (one per view), `base` a secondary
 * one, `danger` one that deletes or can't be undone. `look="ghost"` makes
 * any of them quiet, for toolbars and rows. IconButton is an action shown as
 * an icon alone; PlainButton makes a non-button element, like an info icon
 * or an avatar, act as a button.
 *
 * When not to use:
 * - Going to another page: Link. In the Next app, a route is the app's
 *   NextLink, and one that must look like a button is
 *   `Button as={NextLink}`.
 * - A toggle that shows whether it's on: Chip.
 * - Two `default` buttons in one view: make the lesser one `base`.
 *
 * Pitfalls:
 * - `type` defaults to "button". A form's submit needs `type="submit"`.
 * - Deleting a row removes the button that had focus: move focus on, to a
 *   stable button, with a `ref`.
 * - IconButton needs a `tooltip`; a string one is its accessible name. Add
 *   `aria-label` or `aria-labelledby` only when the name must differ from
 *   what the tooltip shows, like "Delete Design review" under "Delete".
 * - Say why a button can't be used: `disabledWithReason`,
 *   `readOnlyWithReason`, `loadingWithReason`. A bare `disabled` leaves the
 *   user guessing.
 */
import { Avatar } from '@packages/ui/Avatar';
import { Button, IconButton, PlainButton } from '@packages/ui/Button';
import { Controller } from '@packages/ui/Form';
import { Input } from '@packages/ui/Input';
import { Copy, Info, Play, Plus, Settings, Trash2 } from 'lucide-react';
import React, { useEffect, useId, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

// Setup: stand-ins for your app's data and requests, not part of the pattern.
const saveEvent = (draft: EventDraft) =>
  new Promise<EventDraft>((resolve) => setTimeout(() => resolve(draft), 800));

// Usage: the patterns to copy.
type EventDraft = { title: string };

/**
 * Saving a form: `type="submit"` makes the button send the form, and
 * `loading` follows `formState.isSubmitting`, so it can't be pressed twice.
 * The result is announced through a status region.
 */
const SaveForm = () => {
  const [saved, setSaved] = useState('');
  const { control, handleSubmit, reset, formState } = useForm<EventDraft>({
    defaultValues: { title: '' },
  });

  return (
    <form
      noValidate
      onSubmit={handleSubmit(async (draft) => {
        const result = await saveEvent(draft);
        setSaved(`Saved "${result.title}"`);
      })}
      className="flex-col-gap-3 items-start"
    >
      <Controller
        name="title"
        control={control}
        rules={{ required: 'Enter the event title' }}
      >
        {({ field }) => (
          <Input label="Event title" autoComplete="off" {...field} />
        )}
      </Controller>
      <div className="flex-row-gap-2 flex-wrap">
        <Button variant="base" onClick={() => reset()}>
          Reset
        </Button>
        <Button
          type="submit"
          // Saving takes a moment and the status below reports the result.
          loading={formState.isSubmitting}
        >
          Save
        </Button>
      </div>
      <p role="status">{saved}</p>
    </form>
  );
};

/** A form's actions: the main one last, the secondary one `base`. */
const FormActions = () => (
  <div className="flex-row-gap-2 flex-wrap">
    <Button variant="base">Cancel</Button>
    <Button>Publish</Button>
  </div>
);

/**
 * Icons: `leftIcon` before the label, `rightIcon` after it. Icons are
 * decoration; the text names the button.
 */
const WithIcons = () => (
  <div className="flex-row-gap-2 flex-wrap">
    <Button leftIcon={<Plus />}>New event</Button>
    <Button variant="base" rightIcon={<Play />}>
      Start session
    </Button>
  </div>
);

/**
 * A key hint: `rightAddOn` takes an element, hidden from screen readers
 * because `aria-keyshortcuts` announces the key. The shortcut itself must
 * work, so a key listener runs the action.
 */
const WithShortcut = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key !== 'n' || event.ctrlKey || event.metaKey) return;
      if (target.closest('input, textarea, [contenteditable]')) return;
      setCount((current) => current + 1);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="flex-col-gap-2 items-start">
      <Button
        aria-keyshortcuts="N"
        rightAddOn={<kbd aria-hidden>N</kbd>}
        onClick={() => setCount((current) => current + 1)}
      >
        New event
      </Button>
      <p role="status">Events created: {count}</p>
    </div>
  );
};

/**
 * Tooltip: detail on hover and focus, read as the description. With a
 * disabled reason, both show, the tooltip first.
 */
const WithTooltip = () => (
  <div className="flex-row-gap-2 flex-wrap">
    <Button tooltip="Sends the event to every subscriber">Publish</Button>
    <Button
      tooltip="Sends the event to every subscriber"
      disabledWithReason="Add a date before publishing"
    >
      Publish
    </Button>
  </div>
);

/**
 * Unavailable: `disabledWithReason` disables it and says why. Read-only
 * (`readOnlyWithReason`) keeps the button visible but inert, for a view the
 * user may not change.
 */
const Unavailable = () => (
  <div className="flex-row-gap-2 flex-wrap">
    <Button disabledWithReason="Add a date before publishing">Publish</Button>
    <Button readOnlyWithReason="Only organizers can edit the schedule">
      Edit schedule
    </Button>
    <Button
      // The page shows no draft yet, so the reason is plain.
      disabled
    >
      Discard draft
    </Button>
  </div>
);

/**
 * Busy: `loading` shows a spinner in place of the icon and the button can't
 * be pressed again until it's done. `loadingWithReason` also says what is
 * happening, to sighted users on hover and in a status region for screen
 * readers. Set one of the two, not both.
 */
const Busy = () => {
  const [syncing, setSyncing] = useState(false);

  return (
    <div className="flex-row-gap-2 flex-wrap">
      <Button
        loadingWithReason={syncing ? 'Syncing the attendee list' : undefined}
        onClick={() => {
          setSyncing(true);
          setTimeout(() => setSyncing(false), 1500);
        }}
      >
        Sync attendees
      </Button>
      <Button loadingWithReason="Exporting the guest list">
        Export guests
      </Button>
    </div>
  );
};

/**
 * Play and stop in one button: `disableWhileLoading={false}` keeps it
 * pressable while loading, so the press that started it can stop it.
 */
const RunAndStop = () => {
  const [running, setRunning] = useState(false);

  return (
    <Button
      leftIcon={<Play />}
      // It stays pressable, and the label changes to Stop.
      loading={running}
      disableWhileLoading={false}
      onClick={() => setRunning(!running)}
    >
      {running ? 'Stop' : 'Run'}
    </Button>
  );
};

/**
 * Keeping focus after a delete: the removed row's button disappears, so a
 * `ref` on a stable button moves focus there.
 */
const DeleteRow = () => {
  const [sessions, setSessions] = useState(['Opening keynote', 'Workshop']);
  const addRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="flex-col-gap-2 items-start">
      <ul aria-label="Sessions" className="flex-col-gap-2">
        {sessions.map((session) => (
          <li key={session} className="flex-row-gap-2 items-center">
            {session}
            <IconButton
              variant="danger"
              look="ghost"
              tooltip="Delete"
              aria-label={`Delete ${session}`}
              onClick={() => {
                addRef.current?.focus();
                setSessions((current) =>
                  current.filter((entry) => entry !== session),
                );
              }}
            >
              <Trash2 />
            </IconButton>
          </li>
        ))}
      </ul>
      <Button
        ref={addRef}
        leftIcon={<Plus />}
        onClick={() => setSessions((current) => [...current, 'New session'])}
      >
        Add session
      </Button>
    </div>
  );
};

/**
 * Icon only: IconButton, named by its `tooltip`, which shows on hover and
 * focus. Sizes `xs`, `sm` (the default) and `md`. `loading` and
 * `disabledWithReason` work as on Button.
 */
const IconOnly = () => (
  <div className="flex-row-gap-2 flex-wrap items-center">
    <IconButton variant="base" look="ghost" size="xs" tooltip="Event settings">
      <Settings />
    </IconButton>
    <IconButton variant="base" tooltip="Event settings">
      <Settings />
    </IconButton>
    <IconButton size="md" variant="danger" tooltip="Delete event">
      <Trash2 />
    </IconButton>
    <IconButton loadingWithReason="Duplicating event" tooltip="Duplicate event">
      <Copy />
    </IconButton>
    <IconButton
      disabledWithReason="Cancelled events can't be copied"
      tooltip="Duplicate event"
    >
      <Copy />
    </IconButton>
  </div>
);

/**
 * A name that differs from the tooltip: `aria-labelledby` points at visible
 * text, here the row's title, and `aria-label` gives a fuller name, like
 * "Duplicate Design review" under the tooltip "Duplicate".
 */
const IconNames = () => {
  const titleId = useId();

  return (
    <div className="flex-row-gap-2 items-center">
      <span id={titleId}>Design review</span>
      <IconButton aria-labelledby={titleId} tooltip="Settings">
        <Settings />
      </IconButton>
      <IconButton aria-label="Duplicate Design review" tooltip="Duplicate">
        <Copy />
      </IconButton>
    </div>
  );
};

/**
 * An info icon that shows details below it: PlainButton makes its one child,
 * a non-interactive element, focusable and pressable by Enter and Space, with
 * the look the child already has, its focus style included. Name it with
 * `aria-label`; `aria-expanded` and `aria-controls` say what it opens. For a
 * styled action use IconButton.
 */
const InfoIcon = () => {
  const [open, setOpen] = useState(false);
  const detailsId = useId();

  return (
    <div className="flex-col-gap-2 items-start">
      <PlainButton
        aria-label="About ticket types"
        aria-expanded={open}
        aria-controls={detailsId}
        onClick={() => setOpen(!open)}
      >
        <span>
          <Info aria-hidden />
        </span>
      </PlainButton>
      <p id={detailsId} hidden={!open}>
        VIP includes the speaker dinner.
      </p>
    </div>
  );
};

/**
 * An avatar that does something when pressed, like showing a person's
 * details. Avatar hides itself from assistive tech, so the `span` around it
 * is the button, and `aria-label` names it.
 */
const OrganizerAvatar = () => {
  const [contact, setContact] = useState('');

  return (
    <div className="flex-row-gap-2 items-center">
      <PlainButton
        aria-label="Show contact details for Grace Hopper"
        onClick={() => setContact('Grace Hopper, grace@example.com')}
      >
        <span>
          <Avatar name="Grace Hopper" />
        </span>
      </PlainButton>
      <p role="status">{contact}</p>
    </div>
  );
};

export default function ButtonRecipe() {
  return (
    <div className="flex-col-gap-4 items-start">
      <SaveForm />
      <FormActions />
      <WithIcons />
      <WithShortcut />
      <WithTooltip />
      <Unavailable />
      <Busy />
      <RunAndStop />
      <DeleteRow />
      <IconOnly />
      <IconNames />
      <InfoIcon />
      <OrganizerAvatar />
    </div>
  );
}
