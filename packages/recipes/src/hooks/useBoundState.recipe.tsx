/**
 * useBoundState: an editable copy of `value`. Edits show at once and reach
 * `onChange` at once, or with `delay`, once edits pause; `flush` sends a
 * waiting edit now. A new `value` from the parent replaces the copy and
 * drops a waiting edit; the echo of the last edit sent doesn't, so typing
 * during a slow save is kept.
 *
 * Not for: a parent that stores every edit as `value` right away (a plain
 * controlled field), one text field (Input's `delay`), or a search field
 * (SearchInput).
 *
 * Pitfalls:
 * - The echo is matched by reference. A parent that stores a copy, like a
 *   server response or `{ ...range }`, sends a change from outside, which
 *   replaces what was typed meanwhile: pass back the value `onChange` got.
 * - The copy follows a change of `value`, not of the item it belongs to:
 *   give the component a `key` per item, and a new `key` to start over.
 * - `delay` takes a literal or a `const`, fixed for the component's life.
 *   With a slow store, keep it longer than a save takes: only the last edit
 *   sent is recognized when it comes back.
 * - An edit still waiting when the component unmounts is dropped: flush
 *   before closing when it must land.
 */
import { Button } from '@packages/ui/Button';
import { Input, NumberInput } from '@packages/ui/Input';
import { Select, SelectOption } from '@packages/ui/Select';
import { useBoundState } from '@packages/utils/hooks';
import React, { type KeyboardEvent, useEffect, useState } from 'react';

// Setup: stand-ins for your app's data and requests, not part of the pattern.
const sessions = [
  { id: 'keynote', name: 'Opening keynote', notes: 'Bring the slides' },
  { id: 'workshop', name: 'Design workshop', notes: '' },
  { id: 'panel', name: 'Closing panel', notes: '' },
];

/** Stands in for a live connection: a co-organizer's save arrives after 5s. */
const subscribeToNotes = (
  onSave: (sessionId: string, notes: string) => void,
) => {
  const timer = setTimeout(
    () => onSave('keynote', 'Bring the slides and the clicker'),
    5000,
  );
  return () => clearTimeout(timer);
};

/** Stands in for the API: resolves with the range it was given, after 300ms. */
const saveTicketFilter = (range: PriceRange) =>
  new Promise<PriceRange>((resolve) => setTimeout(() => resolve(range), 300));

// Usage: the patterns to copy.
/**
 * A draft kept until Save, with no `onChange`. A new `value` for the same
 * item, like a co-organizer's save arriving, replaces the draft.
 */
const NotesDraft = ({
  notes,
  onSave,
}: {
  notes: string;
  onSave: (notes: string) => void;
}) => {
  const [draft, setDraft] = useBoundState(notes);

  return (
    <div className="flex-col-gap-2 items-start">
      <Input
        label="Notes"
        autoComplete="off"
        value={draft}
        onChange={setDraft}
      />
      <Button
        {...(draft === notes
          ? { disabledWithReason: 'No changes to save' }
          : {})}
        onClick={() => onSave(draft)}
      >
        Save notes
      </Button>
    </div>
  );
};

/**
 * One draft per item: keyed by the session, so another session starts a new
 * draft even when both have the same notes, as empty ones do.
 */
const SessionNotes = () => {
  const [notes, setNotes] = useState(
    Object.fromEntries(sessions.map(({ id, notes }) => [id, notes])),
  );
  const [sessionId, setSessionId] = useState(sessions[0].id);

  useEffect(
    () =>
      subscribeToNotes((id, text) =>
        setNotes((all) => ({ ...all, [id]: text })),
      ),
    [],
  );

  return (
    <div className="flex-col-gap-2">
      <Select label="Session" value={sessionId} onChange={setSessionId}>
        {sessions.map(({ id, name }) => (
          <SelectOption key={id} value={id} label={name} />
        ))}
      </Select>
      <NotesDraft
        key={sessionId}
        notes={notes[sessionId]}
        onSave={(text) => setNotes({ ...notes, [sessionId]: text })}
      />
    </div>
  );
};

const NotesField = ({
  saved,
  onEdit,
}: {
  saved: string;
  onEdit: (notes: string) => void;
}) => {
  const [draft, setDraft] = useBoundState(saved, onEdit);
  return (
    <Input label="Notes" autoComplete="off" value={draft} onChange={setDraft} />
  );
};

/**
 * A parent that tracks unsaved edits: `value` is what was saved, and
 * `onChange` passes each edit to the parent's Save. Discard remounts the
 * field with a new `key`, since `value` hasn't changed.
 */
const UnsavedNotes = () => {
  const [saved, setSaved] = useState('Bring the slides');
  const [unsaved, setUnsaved] = useState<string>();
  const [discards, setDiscards] = useState(0);

  return (
    <div className="flex-col-gap-2">
      <NotesField key={discards} saved={saved} onEdit={setUnsaved} />
      <div className="flex-row-gap-2">
        <Button
          {...(unsaved === undefined
            ? { disabledWithReason: 'Nothing to save' }
            : {})}
          onClick={() => {
            if (unsaved !== undefined) setSaved(unsaved);
            setUnsaved(undefined);
          }}
        >
          Save
        </Button>
        <Button
          variant="base"
          onClick={() => {
            setUnsaved(undefined);
            setDiscards(discards + 1);
          }}
        >
          Discard
        </Button>
      </div>
    </div>
  );
};

type PriceRange = { min: number | null; max: number | null };

/**
 * Several fields editing one value, applied once editing pauses: 500ms
 * after the last edit, at once on Enter, and before Done closes the panel.
 * The parent stores the object `onChange` got, so its echo keeps what was
 * typed during the save.
 */
const PriceFilter = ({
  applied,
  onApply,
  onDone,
}: {
  applied: PriceRange;
  onApply: (range: PriceRange) => void;
  onDone: () => void;
}) => {
  const [range, setRange, flush] = useBoundState(applied, onApply, 500);
  const flushOnEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') flush();
  };

  return (
    <div className="flex-col-gap-2 items-start">
      <div className="flex-row-gap-2">
        <NumberInput
          label="Min price"
          autoComplete="off"
          min={0}
          value={range.min}
          onChange={(min) => setRange({ ...range, min })}
          onKeyDown={flushOnEnter}
        />
        <NumberInput
          label="Max price"
          autoComplete="off"
          min={0}
          value={range.max}
          onChange={(max) => setRange({ ...range, max })}
          onKeyDown={flushOnEnter}
        />
      </div>
      <Button
        onClick={() => {
          flush();
          onDone();
        }}
      >
        Done
      </Button>
    </div>
  );
};

/**
 * The page that owns the applied filter. A preset replaces the range and
 * drops an edit not yet applied.
 */
const TicketFilter = () => {
  const [applied, setApplied] = useState<PriceRange>({ min: null, max: null });
  const [editing, setEditing] = useState(true);

  return (
    <div className="flex-col-gap-2 items-start">
      {editing ? (
        <PriceFilter
          applied={applied}
          onApply={(range) => saveTicketFilter(range).then(setApplied)}
          onDone={() => setEditing(false)}
        />
      ) : (
        <Button variant="base" onClick={() => setEditing(true)}>
          Edit price filter
        </Button>
      )}
      <Button variant="base" onClick={() => setApplied({ min: null, max: 50 })}>
        Under €50
      </Button>
      <p>
        Price range: {applied.min ?? 'any'} to {applied.max ?? 'any'}
      </p>
    </div>
  );
};

export default function UseBoundStateRecipe() {
  return (
    <div className="flex-col-gap-6">
      <SessionNotes />
      <UnsavedNotes />
      <TicketFilter />
    </div>
  );
}
