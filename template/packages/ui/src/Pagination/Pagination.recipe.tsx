/**
 * Pagination: pages of a long list, like a catalog of sessions. "Showing 11
 * to 20 of 95 sessions" on the left; a page-size select and the page buttons
 * on the right.
 *
 * When not to use:
 * - A table's pages: `Table.Pagination`, which is this, wired to the table.
 * - A list that grows as the user scrolls: `Table.InfiniteScroll`, or a load
 *   more button under the list.
 * - Up to about 20 items: show them all.
 * - Steps of a flow: Back and Next buttons.
 *
 * Pitfalls:
 * - `totalItems` sets the page count: from a server, its total, not the
 *   length of the page it sent.
 * - Pagination shows no items: render the page yourself, items
 *   `pageIndex * pageSize` up to `pageSize` more.
 * - A new page size goes back to page one: fetch with the value `onChange`
 *   sends, not the old page.
 * - Controlled, pass `value` with `onChange`, and send the list back to page
 *   one when its filter changes.
 * - Filtered, pass `filtered` (counted as matches) and `unfilteredTotal`
 *   ("Filtered from 120").
 * - `label` names the navigation: unique when a page has several.
 * - `itemName` names the items in the info and the page-size select
 *   ("Sessions per page").
 * - While a page loads, hold the controls with `disabledWithReason`: it says
 *   why. `disabled` says nothing.
 */
import { SearchInput } from '@packages/ui/Input';
import { Pagination, type PaginationValue } from '@packages/ui/Pagination';
import React, { useEffect, useState } from 'react';

// Setup: stand-ins for your app's data and requests, not part of the pattern.
const sessions = Array.from(
  { length: 95 },
  (_, index) => `Session ${index + 1}`,
);

// Stands in for a server: one page of the matches, and how many there are.
const fetchSessions = (
  search: string,
  { pageIndex, pageSize }: PaginationValue,
) =>
  new Promise<{ items: string[]; total: number }>((resolve) => {
    const matches = sessions.filter((session) => session.includes(search));
    const start = pageIndex * pageSize;
    setTimeout(resolve, 400, {
      items: matches.slice(start, start + pageSize),
      total: matches.length,
    });
  });

const sessionName = ['session', 'sessions'] as const;

// Usage: the patterns to copy.
/**
 * Uncontrolled: `defaultValue` sets the first page and size, and `onChange`
 * reports each change, here so the list shows that page.
 */
const SessionCatalog = () => {
  const [page, setPage] = useState<PaginationValue>({
    pageIndex: 0,
    pageSize: 10,
  });
  const start = page.pageIndex * page.pageSize;

  return (
    <div className="flex-col-gap-3">
      <ul className="flex-col-gap-1">
        {sessions.slice(start, start + page.pageSize).map((session) => (
          <li key={session}>{session}</li>
        ))}
      </ul>
      <Pagination
        label="Sessions pagination"
        totalItems={sessions.length}
        itemName={sessionName}
        defaultValue={page}
        onChange={setPage}
      />
    </div>
  );
};

/**
 * Controlled, from a server: a new search goes back to page one, the
 * controls wait while a page loads, and the info counts matches out of
 * every session. `size="minimal"` with icons fits a narrow panel.
 */
const SessionSearch = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState<PaginationValue>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [result, setResult] = useState({ items: [] as string[], total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let current = true;
    setLoading(true);
    fetchSessions(search, page).then((next) => {
      if (!current) return;
      setResult(next);
      setLoading(false);
    });
    return () => {
      current = false;
    };
  }, [search, page]);

  return (
    <div className="flex-col-gap-3">
      <SearchInput
        aria-label="Search sessions"
        value={search}
        onChange={(text) => {
          setSearch(text);
          setPage({ ...page, pageIndex: 0 });
        }}
      />
      <ul className="flex-col-gap-1">
        {result.items.map((session) => (
          <li key={session}>{session}</li>
        ))}
      </ul>
      <Pagination
        label="Search results pagination"
        totalItems={result.total}
        itemName={sessionName}
        value={page}
        onChange={setPage}
        disabledWithReason={loading ? 'Loading the page' : undefined}
        filtered={search !== ''}
        unfilteredTotal={sessions.length}
        size="minimal"
        content="icons"
      />
    </div>
  );
};

export default function PaginationRecipe() {
  return (
    <div className="flex-col-gap-8">
      <SessionCatalog />
      <SessionSearch />
    </div>
  );
}
