/**
 * useLatestRef: the latest committed value of a prop or state, for code that
 * runs after the render it was made in: past an `await`, or in a listener
 * or timer set up once. It's set before layout effects run, so effects and
 * handlers see the new value.
 *
 * Not for: reading while rendering, where it holds the last committed
 * value, not this render's (use the value itself), or calling the latest
 * callback (usePersistentCallback).
 *
 * Pitfall: it ignores stale replies, but every request still goes out.
 * Send requests from a debounced field (SearchInput), and pass an
 * AbortSignal when the API takes one, to cancel the replaced request.
 */
import { SearchInput } from '@packages/ui/Input';
import { useLatestRef } from '@packages/utils/hooks';
import React, { useState } from 'react';

// Setup: stand-ins for your app's data and requests, not part of the pattern.
const attendees = ['Ada Lovelace', 'Alan Turing', 'Grace Hopper'];

// Shorter queries take longer, so their results come back last.
const fetchAttendees = (query: string) =>
  new Promise<string[]>((resolve) => {
    const matches = attendees.filter((name) =>
      name.toLowerCase().includes(query.toLowerCase()),
    );
    setTimeout(() => resolve(matches), 900 - query.length * 150);
  });

// Usage: the patterns to copy.
/**
 * Results arriving out of order: after the `await`, `next` is the query
 * this request was for, and the ref the one searched last. Only its results
 * show.
 */
export default function UseLatestRefRecipe() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(attendees);
  const queryRef = useLatestRef(query);

  const search = async (next: string) => {
    setQuery(next);
    const found = await fetchAttendees(next);
    if (queryRef.current === next) setResults(found);
  };

  return (
    <div className="flex-col-gap-2">
      <SearchInput label="Search attendees" value={query} onChange={search} />
      <p role="status">
        {results.length === 1 ? '1 attendee' : `${results.length} attendees`}
      </p>
      <ul>
        {results.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </div>
  );
}
