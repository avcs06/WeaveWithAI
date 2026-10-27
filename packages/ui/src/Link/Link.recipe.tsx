/**
 * Link: text that takes the user to another page, marked with a dotted line
 * instead of an underline: another site, an email (`mailto:`), a phone
 * number (`tel:`) or a file. In the Next app, a route of the app is the app's
 * NextLink, which looks the same and navigates without reloading the page.
 *
 * When not to use:
 * - An action (save, delete, open a menu): Button. A link goes somewhere.
 * - A route of the Next app: its NextLink. One that must look like a button
 *   is `Button as={NextLink}`.
 * - A whole card that opens a page: Card.
 *
 * Pitfalls:
 * - In the Next app, a route as Link reloads the whole page: use NextLink.
 * - `target="_blank"` needs `rel="noopener noreferrer"` and text saying it
 *   opens a new tab.
 * - Link text must make sense alone ("Event guidelines", not "Click here").
 * - Say why a link is disabled: `disabledWithReason` keeps it focusable and
 *   shows the reason on focus; a plain `disabled` link leaves the tab order.
 */
import { Link } from '@packages/ui/Link';
import React from 'react';

// Usage: the patterns to copy.
/** In a sentence: it sits inline and wraps with the text around it. */
const InText = () => (
  <p>
    Read the{' '}
    <Link href="https://example.com/code-of-conduct">code of conduct</Link>{' '}
    before you register.
  </p>
);

/**
 * Another site: Link. `target="_blank"` opens a new tab, so `rel` keeps the
 * new page from reaching this one, and visually hidden text tells screen
 * reader users.
 */
const ExternalSite = () => (
  <Link
    href="https://example.com/venues/harbor-hall"
    target="_blank"
    rel="noopener noreferrer"
  >
    Harbor Hall venue page
    <span className="sr-only"> (opens in a new tab)</span>
  </Link>
);

/** An email address: `mailto:` opens the user's mail app. */
const Email = () => (
  <Link href="mailto:organizers@example.com">Email the organizers</Link>
);

/** A phone number: `tel:` offers to call it on a phone. */
const Phone = () => <Link href="tel:+31201234567">Call the venue</Link>;

/** A file: `download` saves it instead of opening it. */
const Download = () => (
  <Link href="/files/schedule.pdf" download>
    Download the schedule (PDF)
  </Link>
);

/**
 * `variant="base"`: the neutral color. It changes the text, the dotted line
 * and the focus ring, not only the ring. Use it for links in quiet places,
 * like a footer or a table cell.
 */
const Base = () => (
  <Link href="https://example.com/help" variant="base">
    Help center
  </Link>
);

/**
 * Disabled with a reason: it can't be followed, and hovering or focusing it
 * says why.
 * `disabledWithReason` on its own disables it; `disabled` disables it
 * silently, for a link whose reason is obvious from the screen.
 */
const DisabledWithReason = () => (
  <Link
    href="/files/attendance-report.pdf"
    download
    disabledWithReason="Ready once the event has ended"
  >
    Attendance report (PDF)
  </Link>
);

export default function LinkRecipe() {
  return (
    <div className="flex-col-gap-4 items-start">
      <InText />
      <ExternalSite />
      <Email />
      <Phone />
      <Download />
      <Base />
      <DisabledWithReason />
    </div>
  );
}
