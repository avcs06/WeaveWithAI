/**
 * useDebouncedCallback: runs a callback once calls pause for `delay` ms,
 * with the last call's arguments. `flush` runs a waiting call now, `cancel`
 * drops it. A call and `flush` return the last run's result, `undefined`
 * before the first: `await saveLater.flush()` waits for a save. A missing
 * callback makes every call do nothing.
 *
 * For calls that only go out, like autosaving a whole form or a layout.
 * Not for: one text field (Input's `delay`, which has no flush or cancel), a
 * value that also comes back from the parent (useBoundState with `delay`), a
 * search field (SearchInput), or a value read in this component once it
 * settles (useDebouncedValue).
 *
 * Pitfalls:
 * - A call waiting at unmount is dropped: flush before closing when it must
 *   land.
 * - Don't flush on blur when a button cancels: the blur runs first, and
 *   the call lands before the cancel.
 * - `delay` is read once, on mount.
 */
import { Button } from '@packages/ui/Button';
import { Input, NumberInput } from '@packages/ui/Input';
import { useDebouncedCallback } from '@packages/utils/hooks';
import React, { useState } from 'react';

// Setup: stand-ins for your app's data and requests, not part of the pattern.
/** Stands in for the API: saves a session in 300ms. */
const saveSession = (session: Session) =>
  new Promise<Session>((resolve) => setTimeout(() => resolve(session), 300));

// Usage: the patterns to copy.
type Session = { title: string; seats: number | null };

/**
 * Autosaving a whole form: each change sends the full draft once edits
 * pause. Done waits for a waiting save before closing; Delete cancels it,
 * so it can't write over the deleted session.
 */
const SessionEditor = ({
  session,
  onSave,
  onDone,
  onDelete,
}: {
  session: Session;
  onSave?: (session: Session) => Promise<void>;
  onDone: () => void;
  onDelete: () => void;
}) => {
  const [draft, setDraft] = useState(session);
  const saveLater = useDebouncedCallback(onSave, 800);
  const change = (next: Session) => {
    setDraft(next);
    saveLater(next);
  };

  return (
    <div className="flex-col-gap-2 items-start">
      <Input
        label="Session title"
        autoComplete="off"
        value={draft.title}
        onChange={(title) => change({ ...draft, title })}
      />
      <NumberInput
        label="Seats"
        autoComplete="off"
        min={1}
        allowDecimal={false}
        value={draft.seats}
        onChange={(seats) => change({ ...draft, seats })}
      />
      <div className="flex-row-gap-2">
        <Button
          onClick={async () => {
            await saveLater.flush();
            onDone();
          }}
        >
          Done
        </Button>
        <Button
          variant="base"
          onClick={() => {
            saveLater.cancel();
            onDelete();
          }}
        >
          Delete session
        </Button>
      </div>
    </div>
  );
};

export default function UseDebouncedCallbackRecipe() {
  const [saved, setSaved] = useState<Session | null>({
    title: 'Design workshop',
    seats: 30,
  });
  const [editing, setEditing] = useState(true);

  if (!saved) return <p role="status">Session deleted</p>;

  return (
    <div className="flex-col-gap-2 items-start">
      {editing ? (
        <SessionEditor
          session={saved}
          onSave={(session) => saveSession(session).then(setSaved)}
          onDone={() => setEditing(false)}
          onDelete={() => setSaved(null)}
        />
      ) : (
        <Button variant="base" onClick={() => setEditing(true)}>
          Edit session
        </Button>
      )}
      <p>
        Saved: {saved.title}, {saved.seats ?? 'no'} seats
      </p>
    </div>
  );
}
