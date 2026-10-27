/**
 * NextLink: a link to a route of this app (`/events/42`). Next.js navigates
 * to it without reloading the page and prefetches it. It looks like Link,
 * which is for other sites, emails, phone numbers and files.
 *
 * When not to use:
 * - Another site, an email, a phone number or a file: Link.
 * - An action (save, delete, open a menu): Button. A link goes somewhere.
 * - A whole card that opens a page: Card, with a NextLink on its title.
 *
 * Pitfalls:
 * - A route as Link reloads the whole page: use NextLink.
 * - A route that must look like a button is `Button as={NextLink}`, not a
 *   bare NextLink, whose dotted line clashes with a button.
 * - Mark the current page in a nav with `aria-current="page"`.
 * - Say why a link is disabled: `disabledWithReason` keeps it focusable and
 *   shows the reason on focus; a plain `disabled` link leaves the tab order.
 */
import { NextLink } from '@app/components/NextLink';
import { Button } from '@packages/ui/Button';
import { Input } from '@packages/ui/Input';
import { Plus } from 'lucide-react';
import React, { useState } from 'react';

// Usage: the patterns to copy.
/** In a sentence: it sits inline and wraps with the text around it. */
const InText = () => (
  <p>
    Read the <NextLink href="/guidelines">event guidelines</NextLink> before you
    publish.
  </p>
);

/**
 * It takes `replace`, `scroll`, `prefetch` and `onNavigate`, as Next.js's
 * `Link` does; `scroll={false}` keeps the scroll position.
 */
const KeepScroll = () => (
  <NextLink href="/events/42" scroll={false}>
    Design review
  </NextLink>
);

/** Replaces the current history entry instead of adding another one. */
const ReplaceHistory = () => (
  <NextLink href="/events" replace>
    Back to events
  </NextLink>
);

/**
 * The current page in a navigation: `aria-current="page"` tells screen
 * readers which link they're on. The nav itself is named.
 */
const Navigation = () => (
  <nav aria-label="Event sections">
    <ul className="flex-row-gap-4">
      <li>
        <NextLink href="/events/42" aria-current="page">
          Overview
        </NextLink>
      </li>
      <li>
        <NextLink href="/events/42/sessions">Sessions</NextLink>
      </li>
      <li>
        <NextLink href="/events/42/attendees">Attendees</NextLink>
      </li>
    </ul>
  </nav>
);

/**
 * Disabled with a reason: it can't be followed, and hovering or focusing it
 * says why.
 */
const DisabledWithReason = () => (
  <NextLink
    href="/events/42/report"
    disabledWithReason="Opens once the event has ended"
  >
    Attendance report
  </NextLink>
);

/**
 * `onNavigate` runs before a route change and can cancel it with
 * `event.preventDefault()`. Here it blocks the navigation while the title has
 * unsaved changes, and a visible message says why.
 */
const GuardedNavigation = () => {
  const [saved, setSaved] = useState('Design review');
  const [title, setTitle] = useState(saved);
  const [blocked, setBlocked] = useState(false);
  const unsaved = title !== saved;

  return (
    <div className="flex-col-gap-2 items-start">
      <Input
        label="Event title"
        autoComplete="off"
        value={title}
        onChange={setTitle}
      />
      <Button
        variant="base"
        onClick={() => {
          setSaved(title);
          setBlocked(false);
        }}
      >
        Save
      </Button>
      <NextLink
        href="/events"
        onNavigate={(event) => {
          if (!unsaved) return;
          event.preventDefault();
          setBlocked(true);
        }}
      >
        Back to all events
      </NextLink>
      <p role="status">{blocked ? 'Save your changes before leaving.' : ''}</p>
    </div>
  );
};

/**
 * A route styled as a button: `Button as={NextLink}` with `href`. A disabled
 * one renders an anchor without `href`, so it can't be followed; give it a
 * reason.
 */
const RouteAsButton = () => (
  <div className="flex-row-gap-2 flex-wrap">
    <Button as={NextLink} href="/events/new" leftIcon={<Plus />}>
      Create event
    </Button>
    <Button
      as={NextLink}
      href="/events/42/report"
      variant="base"
      disabledWithReason="Opens once the event has ended"
    >
      Attendance report
    </Button>
  </div>
);

export default function NextLinkRecipe() {
  return (
    <div className="flex-col-gap-4 items-start">
      <InText />
      <KeepScroll />
      <ReplaceHistory />
      <Navigation />
      <DisabledWithReason />
      <GuardedNavigation />
      <RouteAsButton />
    </div>
  );
}
