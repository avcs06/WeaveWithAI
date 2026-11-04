/**
 * useDepsChanged: whether values changed since the last render, read while
 * rendering to adjust state in the same render: an effect would show stale
 * state for a frame, then render again. The first render counts as a change,
 * so one adjustment covers mount and every change after; `trailing` counts
 * only changes after mount.
 *
 * Not for: a value computable from props and state (compute it while
 * rendering), resetting all of a component's state (give it a `key`: it
 * remounts, losing focus and scroll too), or state that follows one prop
 * (useBoundState).
 *
 * Pitfalls:
 * - Deps compare with `Object.is`: an object or array built while rendering
 *   changes every render, and the render loops ("Too many re-renders").
 * - Only set state from it, and only when the state differs.
 */
import { Button } from '@packages/ui/Button';
import { MultiSelect, SelectOption } from '@packages/ui/Select';
import { useDepsChanged } from '@packages/utils/hooks';
import React, { useState } from 'react';

// Setup: stand-ins for your app's data and requests, not part of the pattern.
const schedule = ['Opening keynote', 'Design workshop', 'Closing panel'];

// Usage: the patterns to copy.
/**
 * The first render counts: the saved picks can name sessions cancelled
 * since, and a later schedule can cancel picked ones. The picks forget
 * them: filtering while rendering would pick a session again once it's
 * back on the schedule.
 */
const AgendaPicker = ({
  sessions,
  savedPicks,
}: {
  sessions: string[];
  savedPicks: string[];
}) => {
  const [picked, setPicked] = useState(savedPicks);

  if (useDepsChanged([sessions])) {
    const kept = picked.filter((session) => sessions.includes(session));
    if (kept.length !== picked.length) setPicked(kept);
  }

  return (
    <MultiSelect label="Your agenda" value={picked} onChange={setPicked}>
      {sessions.map((session) => (
        <SelectOption key={session} value={session} label={session} />
      ))}
    </MultiSelect>
  );
};

/**
 * `trailing`: the first render starts on page 1 anyway; a new query resets
 * the page and keeps the rest of the state.
 */
const SearchResults = ({ query }: { query: string }) => {
  const [page, setPage] = useState(1);

  if (useDepsChanged([query], true) && page !== 1) setPage(1);

  return (
    <div className="flex-row-gap-2 items-center">
      <p>
        Results for “{query}”, page {page}
      </p>
      <Button variant="base" onClick={() => setPage(page + 1)}>
        Next page
      </Button>
    </div>
  );
};

export default function UseDepsChangedRecipe() {
  const [sessions, setSessions] = useState(schedule);
  const [query, setQuery] = useState('concerts');

  return (
    <div className="flex-col-gap-4">
      <div className="flex-col-gap-2 items-start">
        <AgendaPicker
          sessions={sessions}
          savedPicks={['Opening keynote', 'Closing panel', 'Networking']}
        />
        <Button
          variant="base"
          onClick={() =>
            setSessions(sessions.length === 3 ? schedule.slice(0, 2) : schedule)
          }
        >
          {sessions.length === 3
            ? 'Cancel the closing panel'
            : 'Restore the closing panel'}
        </Button>
      </div>
      <div className="flex-col-gap-2 items-start">
        <SearchResults query={query} />
        <Button variant="base" onClick={() => setQuery('workshops')}>
          Search workshops
        </Button>
      </div>
    </div>
  );
}
