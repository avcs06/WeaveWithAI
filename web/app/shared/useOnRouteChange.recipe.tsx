/**
 * useOnRouteChange: runs after each navigation, not on the first render,
 * with the new route and the one before it: `pathname`, `searchParams` and
 * `url` (the path, plus `?` and the search when there is one). Compare the
 * two to react only to what matters: the path, one search param, or where
 * the user came from. Next.js app router only.
 *
 * It runs before the new page paints, so a menu closed on navigation never
 * shows open on it.
 *
 * Not for: going back (`router.back()`), or a page's own content (a page
 * remounts on a new path, so it never sees the change).
 *
 * Pitfalls:
 * - It fires only in a component that stays mounted across navigations: a
 *   layout, a header, a sidebar.
 * - It reads `useSearchParams`, so wrap the component in `<Suspense>`, or
 *   `next build` fails for a statically rendered route.
 * - Hash changes don't count.
 */
import { NextLink } from '@app/components/NextLink';
import { useOnRouteChange } from '@app/shared/useOnRouteChange';
import { Button } from '@packages/ui/Button';
import React, { Suspense, useId, useState } from 'react';

// Usage: the patterns to copy.
/**
 * The header's menu: closes on a new page; a change to the search alone,
 * like a filter, keeps it open.
 */
const NavMenu = () => {
  const id = useId();
  const [open, setOpen] = useState(false);

  useOnRouteChange((route, prevRoute) => {
    if (route.pathname !== prevRoute.pathname) setOpen(false);
  });

  return (
    <div className="flex-col-gap-2 items-start">
      <Button
        variant="base"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        Menu
      </Button>
      <nav id={id} aria-label="Main" hidden={!open}>
        <ul className="flex-col-gap-1">
          <li>
            <NextLink href="/events">Events</NextLink>
          </li>
          <li>
            <NextLink href="/venues">Venues</NextLink>
          </li>
        </ul>
      </nav>
    </div>
  );
};

/** Where the user came from: a page view with the route before it. */
const PageViews = () => {
  useOnRouteChange((route, prevRoute) => {
    navigator.sendBeacon(
      '/api/analytics',
      JSON.stringify({
        event: 'page_view',
        path: route.url,
        from: prevRoute.url,
      }),
    );
  });

  return null;
};

/**
 * One search param: a new `q` is announced to screen readers; another
 * param, like `sort`, isn't.
 */
const SearchAnnouncer = () => {
  const [message, setMessage] = useState('');

  useOnRouteChange((route, prevRoute) => {
    const query = route.searchParams.get('q');
    if (query !== prevRoute.searchParams.get('q'))
      setMessage(query ? `Results for “${query}”` : 'All events');
  });

  return <p role="status">{message}</p>;
};

/** The layout's header: mounted across navigations, inside `<Suspense>`. */
export default function UseOnRouteChangeRecipe() {
  return (
    <Suspense fallback={null}>
      <header className="flex-col-gap-2">
        <NavMenu />
        <PageViews />
        <SearchAnnouncer />
      </header>
    </Suspense>
  );
}
