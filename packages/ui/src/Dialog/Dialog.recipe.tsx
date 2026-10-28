/**
 * Dialog: a task over the page that waits until it's done or dismissed, like
 * editing a session. `title` names it, children are the body, `footer` holds
 * the actions: nodes, or a function given `close`.
 * openConfirmationDialog: a yes-or-no question, like confirming a delete,
 * awaited from any code; resolves with the result the pressed button sends.
 *
 * When not to use:
 * - A quick edit or details tied to one control, with the page still usable:
 *   Popover.
 * - A yes-or-no question: openConfirmationDialog, not a Dialog with two
 *   buttons.
 * - A long flow, or anything worth linking to: a page of its own.
 *
 * Pitfalls:
 * - Controlled, `open` changes only through `onOpenChange`: pass both.
 *   Uncontrolled, `trigger` opens it; `footer`'s `close` closes it either way.
 * - `closable={false}` removes the close button, Escape and a press outside:
 *   the footer must offer a way out.
 * - A form in the body: the footer sits outside it, so its submit button
 *   takes `form` with the form's `id`.
 * - openConfirmationDialog resolves `undefined` when it can't ask (on the
 *   server, or the dialog fails to render): treat it as not confirmed.
 * - Only the footer closes a confirmation, and only the first `closeDialog`
 *   counts: every button must call it.
 * - A confirmation renders in its own React root: your app's context doesn't
 *   reach its footer. Pass what it needs in.
 */
import { Button } from '@packages/ui/Button';
import {
  Dialog,
  DialogResult,
  openConfirmationDialog,
} from '@packages/ui/Dialog';
import { Controller } from '@packages/ui/Form';
import { Input } from '@packages/ui/Input';
import { Tag } from '@packages/ui/Tag';
import { Pencil } from 'lucide-react';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

// Setup: stand-ins for your app's data and requests, not part of the pattern.
const agenda = Array.from(
  { length: 40 },
  (_, index) =>
    `${9 + Math.floor(index / 4)}:${String((index % 4) * 15).padStart(2, '0')} Session ${index + 1}`,
);

// Stands in for a request to the server.
const saveSession = (title: string) =>
  new Promise<string>((resolve) => {
    setTimeout(() => resolve(title), 400);
  });

// Usage: the patterns to copy.
/**
 * Uncontrolled: `trigger` opens it. `footer` as a function gets `close`, for
 * Cancel and after the save. `leftIcon` sits before the title.
 */
const EditSession = () => {
  const [title, setTitle] = useState('Opening keynote');

  return (
    <Dialog
      title="Edit session"
      leftIcon={<Pencil />}
      description="Attendees see the change at once."
      trigger={<Button variant="base">Edit session</Button>}
      footer={(close) => (
        <>
          <Button variant="base" onClick={close}>
            Cancel
          </Button>
          <Button onClick={() => saveSession(title).then(close)}>Save</Button>
        </>
      )}
    >
      <Input
        label="Title"
        autoComplete="off"
        value={title}
        onChange={setTitle}
      />
    </Dialog>
  );
};

/**
 * Controlled: something other than a trigger opens it, like a row's action.
 * The footer's nodes close it through `onOpenChange`'s state. The submit
 * button sits outside the form, in the footer: `form` connects them, and a
 * valid submit closes the dialog.
 */
const InviteSpeaker = () => {
  const [open, setOpen] = useState(false);
  const { control, handleSubmit, reset } = useForm<{ email: string }>({
    defaultValues: { email: '' },
  });

  const invite = handleSubmit(() => {
    reset();
    setOpen(false);
  });

  return (
    <>
      <Button variant="base" onClick={() => setOpen(true)}>
        Invite a speaker
      </Button>
      <Dialog
        title="Invite a speaker"
        open={open}
        onOpenChange={setOpen}
        footer={
          <>
            <Button variant="base" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="invite-speaker">
              Send invite
            </Button>
          </>
        }
      >
        <form id="invite-speaker" noValidate onSubmit={invite}>
          <Controller
            name="email"
            control={control}
            rules={{ required: 'Enter the speaker’s email' }}
          >
            {({ field }) => (
              <Input label="Email" type="email" autoComplete="off" {...field} />
            )}
          </Controller>
        </form>
      </Dialog>
    </>
  );
};

/**
 * A choice that must be made: `closable={false}` drops the close button,
 * Escape and a press outside, so only the footer closes it.
 */
const CodeOfConduct = () => (
  <Dialog
    title="Code of conduct"
    closable={false}
    trigger={<Button variant="base">Join the event</Button>}
    footer={(close) => (
      <>
        <Button variant="base" onClick={close}>
          Decline
        </Button>
        <Button onClick={close}>I agree</Button>
      </>
    )}
  >
    Be kind, and report harassment to the event staff.
  </Dialog>
);

/**
 * A long body scrolls between the fixed header and footer; `size="lg"` gives
 * a wide one room. `rightAddOn` follows the title, here a session count.
 * `headerAction` is the dialog's own action, before the close button.
 */
const FullAgenda = () => (
  <Dialog
    title="Day one agenda"
    rightAddOn={<Tag size="xs">{agenda.length}</Tag>}
    headerAction={
      <Button size="sm" variant="base">
        Add session
      </Button>
    }
    size="lg"
    trigger={<Button variant="base">See the agenda</Button>}
    footer={(close) => <Button onClick={close}>Done</Button>}
  >
    <ul className="flex-col-gap-2">
      {agenda.map((slot) => (
        <li key={slot}>{slot}</li>
      ))}
    </ul>
  </Dialog>
);

/**
 * Asked and awaited in a handler: each button sends its result, and only a
 * confirm goes ahead. `status="error"` marks a choice that destroys.
 */
const DeleteSession = () => {
  const [deleted, setDeleted] = useState(false);

  const deleteSession = async () => {
    const result = await openConfirmationDialog({
      title: 'Delete this session?',
      content: 'Its 120 attendees lose their seats.',
      status: 'error',
      footer: (closeDialog) => (
        <>
          <Button
            variant="base"
            onClick={() => closeDialog(DialogResult.cancel)}
          >
            Keep it
          </Button>
          <Button
            variant="danger"
            onClick={() => closeDialog(DialogResult.confirm)}
          >
            Delete
          </Button>
        </>
      ),
    });
    if (result === DialogResult.confirm) setDeleted(true);
  };

  return deleted ? (
    <p>Session deleted.</p>
  ) : (
    <Button variant="danger" onClick={deleteSession}>
      Delete session
    </Button>
  );
};

/**
 * From code outside any component, like a router guard: no hook, provider
 * or mounted component. Without `status`, it's a warning.
 */
const confirmLeave = () =>
  openConfirmationDialog({
    title: 'Leave without saving?',
    content: 'Your changes to the agenda are lost.',
    footer: (closeDialog) => (
      <>
        <Button variant="base" onClick={() => closeDialog(DialogResult.cancel)}>
          Stay
        </Button>
        <Button onClick={() => closeDialog(DialogResult.confirm)}>Leave</Button>
      </>
    ),
  });

const LeaveEditor = () => {
  const [left, setLeft] = useState(false);
  return left ? (
    <p>Left the editor.</p>
  ) : (
    <Button
      variant="base"
      onClick={async () =>
        setLeft((await confirmLeave()) === DialogResult.confirm)
      }
    >
      Leave the editor
    </Button>
  );
};

export default function DialogRecipe() {
  return (
    <div className="flex-row-gap-3 flex-wrap">
      <EditSession />
      <InviteSpeaker />
      <CodeOfConduct />
      <FullAgenda />
      <DeleteSession />
      <LeaveEditor />
    </div>
  );
}
