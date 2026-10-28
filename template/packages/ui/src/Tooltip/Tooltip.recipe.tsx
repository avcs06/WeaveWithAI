/**
 * Tooltip: a short hint on hover and keyboard focus, for an element that
 * isn't a control. `Button`, `IconButton`, `Tag`, `Chip`, `Truncate` and the
 * form fields take a `tooltip` prop themselves, so use that on them; `Tooltip`
 * is for any other
 * focusable element, like a `Link`. The trigger must be focusable and forward
 * its props. `UIRoot` already renders the one tooltip: never render a
 * `TooltipProvider`.
 *
 * Not for anything essential: touch screens have no hover, so what a tooltip
 * says must be visible elsewhere. It is never an element's only label.
 */
import { Button, IconButton } from '@packages/ui/Button';
import { Link } from '@packages/ui/Link';
import { Tooltip } from '@packages/ui/Tooltip';
import { Download, Users } from 'lucide-react';
import React from 'react';

// Usage: the patterns to copy.
/**
 * A hint on a control: the `tooltip` prop, not a wrapper. Screen readers get
 * it as the description. An `IconButton` requires one, and a string `tooltip`
 * is its accessible name.
 */
const ControlHints = () => (
  <div className="flex-row-gap-2 items-center">
    <Button variant="base" tooltip="Saves a draft you can publish later">
      Save
    </Button>
    <IconButton variant="base" look="ghost" tooltip="Download tickets">
      <Download />
    </IconButton>
  </div>
);

/**
 * A disabled control says why through its own props. The reason shows under
 * the `tooltip`, in the one tooltip.
 */
const DisabledReason = () => (
  <Button
    variant="base"
    tooltip="Publishes to attendees"
    disabledWithReason="Add a venue before publishing"
  >
    Publish
  </Button>
);

/**
 * `Tooltip` on a focusable non-control: here the address a link goes to.
 * Screen readers get the hint as the description. What the user must know,
 * like a new tab, goes in the link's own text. `side` and `align` place it.
 */
const LinkHint = () => (
  <Tooltip tooltip="harborhall.example.com" side="bottom" align="start">
    <Link
      href="https://harborhall.example.com"
      target="_blank"
      rel="noreferrer"
    >
      Venue website<span className="sr-only"> (opens in a new tab)</span>
    </Link>
  </Tooltip>
);

/**
 * An icon-only link: the tooltip shows sighted users the name that
 * `aria-label` gives screen readers, so `description={null}` keeps it from
 * being read twice.
 */
const IconLinkHint = () => (
  <Tooltip tooltip="Attendees" description={null}>
    <Link href="/events/42/attendees" aria-label="Attendees">
      <Users aria-hidden className="icon-size-body" />
    </Link>
  </Tooltip>
);

/**
 * Rich content: any text-like nodes, with nothing interactive inside, since
 * hover leaves it. An array stacks messages in order; use it only when they
 * come from different sources.
 */
const RichHint = () => (
  <Tooltip
    tooltip={[<strong key="title">Early bird</strong>, 'Ends on 1 March']}
    description="Early bird tickets end on 1 March"
    side="right"
  >
    <Link href="https://example.com/tickets">Ticket prices</Link>
  </Tooltip>
);

export default function TooltipRecipe() {
  return (
    <div className="flex-col-gap-4 items-start">
      <ControlHints />
      <DisabledReason />
      <LinkHint />
      <IconLinkHint />
      <RichHint />
    </div>
  );
}
