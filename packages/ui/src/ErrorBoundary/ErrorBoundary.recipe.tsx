/**
 * ErrorBoundary: shows a fallback in place of its children when they throw
 * while rendering, so one broken part doesn't take down the page. The app
 * root already has one around every page; wrap a part that can fail on its
 * own, like a chart, a feed or an embed, so the rest keeps working. It stays
 * on the fallback: give it a new `key` to render the children again.
 */
import { ErrorBoundary } from '@packages/ui/ErrorBoundary';
import React, { type ReactNode, useSyncExternalStore } from 'react';

const subscribe = () => () => undefined;

// Stands in for a part that breaks in the browser, like a chart given
// malformed data. It renders on the server and throws once hydrated.
const BreaksInBrowser = ({ children }: { children: ReactNode }) => {
  const inBrowser = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  if (inBrowser) throw new Error('Malformed chart data');
  return children;
};

/** Default fallback: "Something went wrong.", announced as an alert. */
const DefaultFallback = () => (
  <ErrorBoundary>
    <BreaksInBrowser>
      <p>Ada Lovelace commented on the report</p>
    </BreaksInBrowser>
  </ErrorBoundary>
);

/**
 * Custom fallback: say what failed, in the space the part took. `onError`
 * gets the error, to send to an error tracker; `fallback={null}` shows
 * nothing.
 */
const CustomFallback = () => (
  <ErrorBoundary fallback={<p>Couldn&apos;t load the chart.</p>}>
    <BreaksInBrowser>
      <p>Revenue by month</p>
    </BreaksInBrowser>
  </ErrorBoundary>
);

export default function ErrorBoundaryRecipe() {
  return (
    <div className="flex-col-gap-6">
      <DefaultFallback />
      <CustomFallback />
    </div>
  );
}
