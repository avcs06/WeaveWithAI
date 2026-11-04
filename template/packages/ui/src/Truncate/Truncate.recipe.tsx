/**
 * Truncate: one line of text that ends in an ellipsis when it doesn't fit,
 * with the full text in a tooltip. Controls already truncate their labels;
 * use it for other single-line text: names, titles, table cells. For your
 * own element, `useTruncation` gives the same cut and tells whether it's cut.
 *
 * When not to use:
 * - Text that should wrap or clamp to several lines: Truncate is one line.
 * - Inline in a sentence: Truncate is always a block, so it can't cut a
 *   phrase in the middle of a line.
 *
 * Pitfalls:
 * - The tooltip is hover and keyboard focus only: anything only it says must
 *   also be on the page.
 * - Inside a link or button, put the Truncate in the control, not the control
 *   in the Truncate: its tooltip would hold a copy of the control. The
 *   tooltip shows when the control is focused from the keyboard.
 * - A parent that is a flex item needs `min-w-0`, or it grows to the text's
 *   width and nothing is cut.
 */
import { Avatar } from '@packages/ui/Avatar';
import { PlainButton } from '@packages/ui/Button';
import { Link } from '@packages/ui/Link';
import { Truncate, useTruncation } from '@packages/ui/Truncate';
import React, { useState } from 'react';

// Setup: stand-ins for your app's data and requests, not part of the pattern.
const longTitle =
  'Quarterly planning review for the platform, design and support teams';

// Usage: the patterns to copy.
/**
 * A row: an avatar, a cut name and a date that stays whole. The row takes
 * `min-w-0` because it is a flex item itself; hover the cut text to see all
 * of it.
 */
const InARow = () => (
  <div className="flex-row-gap-2 items-center min-w-0 w-full">
    <Avatar size="sm" name="Ada Lovelace" />
    <Truncate>Ada Lovelace-Byron, Countess of Lovelace and organizer</Truncate>
    <time dateTime="2026-10-27" className="shrink-0">
      27 Oct
    </time>
  </div>
);

/**
 * A custom `tooltip` shows above the full text when it's cut, and on its own
 * when it fits. The same detail is visible in the row, so nobody depends on
 * the tooltip.
 */
const WithTooltip = () => (
  <div className="flex-col-gap-1">
    <Truncate tooltip="Starts at 10:00 in Room 4">{longTitle}</Truncate>
    <span>Starts at 10:00 in Room 4</span>
  </div>
);

/**
 * `alwaysShowTooltip` shows the text on hover even when nothing is cut: for
 * text that is shortened by the content itself, like an abbreviation you
 * expand in the tooltip.
 */
const AlwaysShowTooltip = () => (
  <Truncate alwaysShowTooltip tooltip="Design Systems Conference">
    DSC
  </Truncate>
);

/**
 * Inside a link: `inline-block max-w-full` keeps the link no wider than its
 * box, so the dotted line stays under the cut text. Focusing the link from
 * the keyboard shows the full title.
 */
const InsideLink = () => (
  <Link href="/events/42" className="inline-block max-w-full">
    <Truncate>{longTitle}</Truncate>
  </Link>
);

/**
 * Your own element: `useTruncation` returns `ref` and `className` for the
 * element that holds the text, and `truncated`. Here the text sits in a
 * PlainButton that has its own tooltip, so the cut text is added to it.
 */
const OwnElement = () => {
  const { ref, className, truncated } = useTruncation<HTMLSpanElement>();
  const [opened, setOpened] = useState(false);

  return (
    <div className="flex-col-gap-2 items-start w-full">
      <PlainButton
        tooltip={truncated && longTitle}
        onClick={() => setOpened(true)}
        className="w-full"
      >
        <span ref={ref} className={className}>
          {longTitle}
        </span>
      </PlainButton>
      <p role="status">{opened ? 'Opening the session details' : ''}</p>
    </div>
  );
};

export default function TruncateRecipe() {
  return (
    <div className="flex-col-gap-4 max-w-full">
      <InARow />
      <WithTooltip />
      <AlwaysShowTooltip />
      <InsideLink />
      <OwnElement />
    </div>
  );
}
