/**
 * Link: text that takes the user to another page, marked with a dotted line
 * instead of an underline.
 */
import { Link } from '@packages/ui/Link';
import React from 'react';

/** In a sentence: it sits inline and wraps with the text around it. */
const InText = () => (
  <p>
    Read the <Link href="/guidelines">event guidelines</Link> before you
    publish.
  </p>
);

/** `variant="base"`: a neutral focus ring instead of the accent one. */
const Base = () => (
  <Link href="/settings" variant="base">
    Account settings
  </Link>
);

/**
 * Disabled with a reason: it can't be followed, and hovering it says why.
 * `disabledWithReason` on its own disables it; `disabled` disables it silently.
 */
const DisabledWithReason = () => (
  <Link href="/reports" disabledWithReason="Opens once the event has ended">
    Attendance report
  </Link>
);

export default function LinkRecipe() {
  return (
    <div className="flex-col-gap-4 items-start">
      <InText />
      <Base />
      <DisabledWithReason />
    </div>
  );
}
