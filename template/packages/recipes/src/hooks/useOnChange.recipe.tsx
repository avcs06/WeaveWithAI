/**
 * useOnChange: an effect that runs when its deps change, but not on mount.
 * Its cleanup runs before the next change and on unmount, as useEffect's
 * does. For a change from outside the component, like a prop or URL param,
 * that no handler of its own sees.
 *
 * Not for: a change the component makes itself (do the work in that
 * handler), telling the parent about a change (call its handler in the
 * event), a value computable from the deps (compute it while rendering), or
 * adjusting state in the same render (useDepsChanged).
 *
 * Pitfall: deps compare with `Object.is`, so an object or array built while
 * rendering runs it on every render.
 */
import { Button } from '@packages/ui/Button';
import { Chip } from '@packages/ui/Chip';
import { Select, SelectOption } from '@packages/ui/Select';
import { useOnChange } from '@packages/utils/hooks';
import React, { useRef, useState } from 'react';

// Setup: stand-ins for your app's data and requests, not part of the pattern.
const sessions = Array.from(
  { length: 30 },
  (_, index) => `Session ${index + 1}`,
);
const pageSize = 10;

// Usage: the patterns to copy.
/**
 * Focus moves to the results' heading when `page` changes, so a screen
 * reader starts at the new results; not on mount, which would steal focus
 * from the page.
 */
const SessionResults = ({ page }: { page: number }) => {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useOnChange(() => {
    headingRef.current?.focus();
  }, [page]);

  return (
    <div className="flex-col-gap-2">
      <h2 ref={headingRef} tabIndex={-1}>
        Sessions, page {page}
      </h2>
      <ul>
        {sessions
          .slice((page - 1) * pageSize, page * pageSize)
          .map((session) => (
            <li key={session}>{session}</li>
          ))}
      </ul>
    </div>
  );
};

type Sort = 'date' | 'name';

/**
 * A note for 2 seconds after each change of `sort`, set by a toolbar or the
 * URL; none on mount. The cleanup clears the timer of a note a newer change
 * replaced.
 */
const SortNote = ({ sort }: { sort: Sort }) => {
  const [note, setNote] = useState('');

  useOnChange(() => {
    setNote(`Sorted by ${sort}`);
    const timer = setTimeout(() => setNote(''), 2000);
    return () => clearTimeout(timer);
  }, [sort]);

  return <p role="status">{note}</p>;
};

/**
 * Telling the parent about the component's own change: call its handler in
 * the event, with the new value. An effect would tell it a frame late, and
 * again on changes the parent made.
 */
const WaitlistToggle = ({
  onChange,
}: {
  onChange: (open: boolean) => void;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Chip
      active={open}
      onActiveChange={(next) => {
        setOpen(next);
        onChange(next);
      }}
    >
      Waitlist
    </Chip>
  );
};

export default function UseOnChangeRecipe() {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<Sort>('date');
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  return (
    <div className="flex-col-gap-4 items-start">
      <SessionResults page={page} />
      <Button
        variant="base"
        {...(page * pageSize >= sessions.length
          ? { disabledWithReason: 'This is the last page' }
          : {})}
        onClick={() => setPage(page + 1)}
      >
        Next page
      </Button>
      <Select
        label="Sort by"
        value={sort}
        onChange={(next) => setSort(next as Sort)}
      >
        <SelectOption value="date" label="Date" />
        <SelectOption value="name" label="Name" />
      </Select>
      <SortNote sort={sort} />
      <WaitlistToggle onChange={setWaitlistOpen} />
      <p>{waitlistOpen ? 'Waitlist open' : 'Waitlist closed'}</p>
    </div>
  );
}
