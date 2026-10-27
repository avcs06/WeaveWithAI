/**
 * ErrorBoundary: shows a fallback in place of its children when they throw
 * while rendering, so one broken part doesn't take down the page. The app
 * root already has one around every page; wrap a part that can fail on its
 * own, like a chart or a feed, so the rest keeps working. The default
 * fallback says something went wrong and offers "Try again".
 *
 * When not to use:
 * - A whole route: Next's `error.tsx` handles it, with its own reset.
 *
 * Pitfalls:
 * - It only catches errors thrown while rendering. Not caught: event
 *   handlers, effects, promises and fetches (catch them and show the
 *   error in state), iframe load failures, and server rendering.
 * - It stays on the fallback until `reset` runs or `resetKeys` changes.
 * - Every fallback is announced as an alert: say what failed, and which
 *   part, when several boundaries can fail together.
 * - Redirects and not-found thrown by Next pass through, they are not errors.
 */
import { Button } from '@packages/ui/Button';
import { Chip, ChipGroup } from '@packages/ui/Chip';
import { ErrorBoundary } from '@packages/ui/ErrorBoundary';
import React, { type ReactNode, useState, useSyncExternalStore } from 'react';

// Setup: stand-ins for your app's data and requests, not part of the pattern.
const subscribe = () => () => undefined;

// Mock data: stands in for an error tracker.
const reportError = (error: unknown, componentStack?: string | null) =>
  void [error, componentStack];

// Mock data: a chart that renders on the server and throws once hydrated,
// unless it is `fixed`.
const AttendanceChart = ({
  fixed = false,
  children,
}: {
  fixed?: boolean;
  children: ReactNode;
}) => {
  const inBrowser = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  if (inBrowser && !fixed) throw new Error('Malformed chart data');
  return children;
};

const sessions = ['Keynote', 'Workshop'];

// Usage: the patterns to copy.
/**
 * Default fallback: "Something went wrong." with a "Try again" button that
 * renders the children again. Focus moves to the button if the failed part
 * held it.
 */
const DefaultFallback = () => (
  <ErrorBoundary>
    <AttendanceChart>
      <p>Attendance by hour</p>
    </AttendanceChart>
  </ErrorBoundary>
);

/**
 * A function fallback gets the `error` and a `reset`: say what failed, and
 * fix the cause (refetch) before calling `reset`.
 */
const RefetchFallback = () => {
  const [fixed, setFixed] = useState(false);

  return (
    <ErrorBoundary
      fallback={({ reset }) => (
        <>
          <span>Couldn&apos;t load the attendance chart.</span>
          <Button
            onClick={() => {
              setFixed(true);
              reset();
            }}
          >
            Reload data
          </Button>
        </>
      )}
    >
      <AttendanceChart fixed={fixed}>
        <p>Attendance by hour</p>
      </AttendanceChart>
    </ErrorBoundary>
  );
};

/**
 * `resetKeys`: while failed, a change in any key renders the children again.
 * Use it when the failure belongs to the input, like the session shown.
 */
const ResetOnSessionChange = () => {
  const [session, setSession] = useState(sessions[0]);

  return (
    <div className="flex-col-gap-2">
      <ChipGroup aria-label="Session" value={session} onChange={setSession}>
        {sessions.map((name) => (
          <Chip key={name} value={name}>
            {name}
          </Chip>
        ))}
      </ChipGroup>
      <ErrorBoundary resetKeys={[session]}>
        <AttendanceChart fixed={session === 'Workshop'}>
          <p>Attendance for {session}</p>
        </AttendanceChart>
      </ErrorBoundary>
    </div>
  );
};

/**
 * `onError` gets the thrown value (not always an Error) and where it came
 * from, to send to an error tracker.
 */
const LogErrors = () => (
  <ErrorBoundary
    onError={(error, info) => reportError(error, info.componentStack)}
  >
    <AttendanceChart>
      <p>Attendance by hour</p>
    </AttendanceChart>
  </ErrorBoundary>
);

/** `fallback={null}` hides a part that is optional, like a decorative widget. */
const HideWhenBroken = () => (
  <ErrorBoundary fallback={null}>
    <AttendanceChart>
      <p>Trending sessions</p>
    </AttendanceChart>
  </ErrorBoundary>
);

export default function ErrorBoundaryRecipe() {
  return (
    <div className="flex-col-gap-6">
      <DefaultFallback />
      <RefetchFallback />
      <ResetOnSessionChange />
      <LogErrors />
      <HideWhenBroken />
    </div>
  );
}
