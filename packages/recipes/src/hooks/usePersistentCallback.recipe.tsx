/**
 * usePersistentCallback: for a callback run on an event, like `onChange`,
 * that an effect or a store holds: a new reference from the parent doesn't
 * rerun the effect, and the latest one still runs. It returns what the
 * callback returns. An optional callback can be passed as is: the result
 * may then be `undefined`.
 *
 * Not for: a function whose new reference means new inputs, like a loader
 * in an effect's deps, or a function called while rendering, where it
 * would run the last committed callback. Keep those plain functions: React
 * Compiler gives them a new reference only when their inputs change.
 */
import { Button } from '@packages/ui/Button';
import { usePersistentCallback } from '@packages/utils/hooks';
import React, { useEffect, useState } from 'react';

// Setup: stand-ins for your app's data and requests, not part of the pattern.
const sessions = ['Keynote', 'Design workshop', 'Design panel', 'Closing'];

const fetchSessions = (query: string) =>
  new Promise<string[]>((resolve) => {
    setTimeout(
      () => resolve(sessions.filter((session) => session.includes(query))),
      300,
    );
  });

// Usage: the patterns to copy.
/**
 * The listener is added once; a new `onResize` from the parent doesn't
 * re-add it. Called once on mount too, so the parent starts with the width.
 */
const ResizeWatcher = ({
  onResize,
}: {
  onResize?: (width: number) => void;
}) => {
  const handleResize = usePersistentCallback(onResize);

  useEffect(() => {
    const listener = () => handleResize(window.innerWidth);
    listener();
    window.addEventListener('resize', listener);
    return () => window.removeEventListener('resize', listener);
  }, [handleResize]);

  return null;
};

/**
 * A loader in an effect's deps: a plain function, since a new `loadSessions`
 * means a new query and the effect must load again. Made persistent, it
 * would keep showing the first query's list.
 */
const SessionList = ({
  loadSessions,
}: {
  loadSessions: () => Promise<string[]>;
}) => {
  const [loaded, setLoaded] = useState<string[]>([]);

  useEffect(() => {
    let current = true;
    loadSessions().then((list) => {
      if (current) setLoaded(list);
    });
    return () => {
      current = false;
    };
  }, [loadSessions]);

  return (
    <ul>
      {loaded.map((session) => (
        <li key={session}>{session}</li>
      ))}
    </ul>
  );
};

/** Called while rendering: a plain function, so a new `currency` shows at once. */
const Prices = ({
  amounts,
  currency,
}: {
  amounts: number[];
  currency: string;
}) => {
  const format = (amount: number) =>
    new Intl.NumberFormat('en', { style: 'currency', currency }).format(amount);

  return (
    <ul>
      {amounts.map((amount) => (
        <li key={amount}>{format(amount)}</li>
      ))}
    </ul>
  );
};

export default function UsePersistentCallbackRecipe() {
  const [width, setWidth] = useState<number>();
  const [query, setQuery] = useState('');

  return (
    <div className="flex-col-gap-2">
      <ResizeWatcher onResize={setWidth} />
      {width !== undefined && <p>Window: {width}px wide</p>}
      <Button variant="base" onClick={() => setQuery('Design')}>
        Design sessions only
      </Button>
      <SessionList loadSessions={() => fetchSessions(query)} />
      <Prices amounts={[5, 12.5]} currency="EUR" />
    </div>
  );
}
