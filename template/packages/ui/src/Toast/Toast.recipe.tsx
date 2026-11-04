/**
 * toast: a short message at the corner of the screen about something that
 * just happened, like "Session saved", that closes on its own. Call it from
 * anywhere, React or not: it returns the toast's id. updateToast changes a
 * showing toast, dismissToast closes one, clearToasts closes all.
 *
 * When not to use:
 * - An error the user must fix in a form: the field's `error`.
 * - A question that needs an answer: openConfirmationDialog.
 * - Something that must stay on screen, like a sold-out notice: text on the
 *   page itself.
 *
 * Pitfalls:
 * - UIRoot renders the toasts: without it, a toast shows nowhere.
 * - The title is one line and truncates: put details in `description`.
 * - An `action` needs `altText`: how to do the same without the toast, as a
 *   screen reader may hear the toast after it has gone.
 * - A `loading` toast stays until updateToast or dismissToast: always end it.
 * - updateToast and dismissToast do nothing for an unknown or closed id, and
 *   `onClose` runs once, however the toast closes.
 */
import { Button } from '@packages/ui/Button';
import {
  clearToasts,
  dismissToast,
  toast,
  updateToast,
} from '@packages/ui/Toast';
import React, { useState } from 'react';

// Setup: stand-ins for your app's requests, not part of the pattern.
const publishSchedule = (fail: boolean) =>
  new Promise<void>((resolve, reject) => {
    setTimeout(() => (fail ? reject(new Error('Offline')) : resolve()), 800);
  });

// Usage: the patterns to copy.
/** After an action: `status` sets the icon; `info` without it. */
const SaveSession = () => (
  <Button
    onClick={() =>
      toast({
        title: 'Session saved',
        description: 'Attendees see the new time at once.',
        status: 'success',
      })
    }
  >
    Save session
  </Button>
);

/**
 * A request in flight: a `loading` toast that updateToast turns into the
 * outcome, which then closes on its own.
 */
const PublishSchedule = ({ fail = false }: { fail?: boolean }) => (
  <Button
    variant="base"
    onClick={async () => {
      const id = toast({ title: 'Publishing the schedule', status: 'loading' });
      try {
        await publishSchedule(fail);
        updateToast(id, { title: 'Schedule published', status: 'success' });
      } catch {
        updateToast(id, {
          title: 'Couldn’t publish the schedule',
          description: 'Check your connection and try again.',
          status: 'error',
        });
      }
    }}
  >
    {fail ? 'Publish, offline' : 'Publish schedule'}
  </Button>
);

/**
 * An action that undoes what just happened. `altText` tells screen readers
 * where else to do it; pressing the action closes the toast.
 */
const RemoveSpeaker = () => {
  const [removed, setRemoved] = useState(false);

  const remove = () => {
    setRemoved(true);
    toast({
      title: 'Speaker removed',
      action: {
        label: 'Undo',
        altText: 'Add them back from the speakers list',
        onClick: () => setRemoved(false),
      },
    });
  };

  return (
    <Button variant="base" onClick={remove}>
      {removed ? 'Removed' : 'Remove speaker'}
    </Button>
  );
};

/**
 * A toast that waits for the user: `duration={Infinity}` and a close button.
 * dismissToast closes it from code; `onClose` learns either way.
 */
const ConnectionLost = () => {
  const [id, setId] = useState<string>();

  const show = () =>
    setId(
      toast({
        title: 'Connection lost',
        description: 'Changes are saved once you’re back online.',
        status: 'warning',
        duration: Infinity,
        closable: true,
        onClose: () => setId(undefined),
      }),
    );

  return id ? (
    <Button variant="base" onClick={() => dismissToast(id)}>
      Back online
    </Button>
  ) : (
    <Button variant="base" onClick={show}>
      Go offline
    </Button>
  );
};

/** From code outside any component, like leaving a page: clear them all. */
const leaveEditor = () => clearToasts();

export default function ToastRecipe() {
  return (
    <div className="flex-row-gap-3 flex-wrap">
      <SaveSession />
      <PublishSchedule />
      <PublishSchedule fail />
      <RemoveSpeaker />
      <ConnectionLost />
      <Button variant="base" onClick={leaveEditor}>
        Clear all
      </Button>
    </div>
  );
}
