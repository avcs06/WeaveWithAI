/**
 * useDebouncedValue: a value that follows another once it stops changing
 * for `delay` ms. For work keyed on the settled value in this component,
 * like a request in an effect: one request per pause, not per keystroke.
 * While the two differ, the work is catching up.
 *
 * Not for: slow rendering work (useDeferredValue, which yields to typing
 * with no fixed lag), or sending the value to a parent or a server
 * (Input's `delay`, useBoundState with `delay`, or useDebouncedCallback).
 *
 * Pitfalls:
 * - Changes compare with `Object.is`: an object or array built while
 *   rendering is new every render and never settles. Keep it in state.
 * - `delay` is read once, on mount.
 */
import { Input, NumberInput } from '@packages/ui/Input';
import { useDebouncedValue } from '@packages/utils/hooks';
import React, { useEffect, useState } from 'react';

// Setup: stand-ins for your app's data and requests, not part of the pattern.
const takenSlugs = ['launch-party', 'design-week'];

/** Stands in for the API: whether an event URL is free, in 300ms. */
const checkSlug = (slug: string) =>
  new Promise<boolean>((resolve) =>
    setTimeout(() => resolve(!takenSlugs.includes(slug)), 300),
  );

const sampleEvents = [
  { city: 'Lisbon', price: 20 },
  { city: 'Lisbon', price: 80 },
  { city: 'Porto', price: 0 },
];

/** Stands in for the API: how many events match the filters, in 300ms. */
const countEvents = ({ city, maxPrice }: EventFilters) =>
  new Promise<number>((resolve) => {
    const matches = sampleEvents.filter(
      (event) =>
        event.city.toLowerCase().startsWith(city.toLowerCase()) &&
        (maxPrice === null || event.price <= maxPrice),
    );
    setTimeout(() => resolve(matches.length), 300);
  });

// Usage: the patterns to copy.
type EventFilters = { city: string; maxPrice: number | null };

/**
 * A request keyed on the settled value: the check runs once typing
 * pauses, and a reply for an older value is ignored.
 */
const EventUrl = () => {
  const [slug, setSlug] = useState('launch-party');
  const settledSlug = useDebouncedValue(slug, 400);
  const [free, setFree] = useState<boolean>();

  useEffect(() => {
    let current = true;
    checkSlug(settledSlug).then((isFree) => {
      if (current) setFree(isFree);
    });
    return () => {
      current = false;
    };
  }, [settledSlug]);

  const checking = slug !== settledSlug || free === undefined;

  return (
    <div className="flex-col-gap-2">
      <Input
        label="Event URL"
        autoComplete="off"
        value={slug}
        onChange={(next) => {
          setSlug(next);
          setFree(undefined);
        }}
      />
      <p role="status">
        {checking ? 'Checking…' : free ? 'Available' : 'Already taken'}
      </p>
    </div>
  );
};

/**
 * Several fields settling as one: the object lives in state, so it keeps
 * its identity until a field changes.
 */
const MatchingEvents = () => {
  const [filters, setFilters] = useState<EventFilters>({
    city: 'Lisbon',
    maxPrice: null,
  });
  const settledFilters = useDebouncedValue(filters, 500);
  const [count, setCount] = useState<number>();

  useEffect(() => {
    let current = true;
    countEvents(settledFilters).then((total) => {
      if (current) setCount(total);
    });
    return () => {
      current = false;
    };
  }, [settledFilters]);

  return (
    <div className="flex-col-gap-2">
      <div className="flex-row-gap-2">
        <Input
          label="City"
          autoComplete="address-level2"
          value={filters.city}
          onChange={(city) => setFilters({ ...filters, city })}
        />
        <NumberInput
          label="Max price"
          autoComplete="off"
          min={0}
          value={filters.maxPrice}
          onChange={(maxPrice) => setFilters({ ...filters, maxPrice })}
        />
      </div>
      <p role="status">
        {filters !== settledFilters || count === undefined
          ? 'Counting…'
          : `${count} events match`}
      </p>
    </div>
  );
};

export default function UseDebouncedValueRecipe() {
  return (
    <div className="flex-col-gap-6">
      <EventUrl />
      <MatchingEvents />
    </div>
  );
}
