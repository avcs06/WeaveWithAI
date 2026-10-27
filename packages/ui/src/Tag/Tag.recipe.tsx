/**
 * Tag: a short label that only informs: a status, a category, a count, or a
 * chosen filter the user removes with its close button (`closable`). The
 * label stays on one line; cut text shows in full on hover.
 *
 * When not to use:
 * - Anything the user clicks to turn on or off: Chip. A Tag is never pressed.
 * - An action: Button.
 * - Choosing from a list of options: Select, or ChipGroup for a few.
 *
 * Pitfalls:
 * - Removing a tag removes the button that had focus. Keep each close button
 *   in a ref (`closeRef`) and move focus to the next tag's before removing.
 * - A closable tag's `tooltip` shows on its close button, on hover and
 *   focus. On a tag that can't close, it shows on hover only, so put nothing
 *   the user must know there.
 * - A bare count means nothing read aloud: give it a unit, in visually
 *   hidden text if the visible one is dropped.
 * - `closeTabIndex={-1}` is only for a widget that moves focus between its
 *   tags itself, like a toolbar with arrow keys. Otherwise every close
 *   button must stay reachable by Tab.
 * - Say why a tag can't be removed: `disabledWithReason`, not `disabled`.
 */
import { Button } from '@packages/ui/Button';
import { Tag } from '@packages/ui/Tag';
import { CircleCheck, MapPin } from 'lucide-react';
import React, { useRef, useState } from 'react';

// Usage: the patterns to copy.
/** Status: a status variant, `size="xs"` in table rows and dense lists. */
const Status = () => (
  <div className="flex-row-gap-2 flex-wrap">
    <Tag size="xs" variant="success" leftIcon={<CircleCheck />}>
      Paid
    </Tag>
    <Tag size="xs" variant="warning">
      Pending
    </Tag>
    <Tag size="xs" variant="error">
      Refunded
    </Tag>
    <Tag size="xs" variant="info">
      Waitlist
    </Tag>
  </div>
);

/**
 * Chosen filters: `closable` with `onClose` removes one. Its close button is
 * read as "Remove" and the label, and `closeRef` lets the caller move focus
 * to the next tag's button (or to "Reset filters" after the last) before the
 * removed one disappears. `disabledWithReason` keeps one that can't be
 * removed and says why on hover and focus.
 */
const ChosenFilters = () => {
  const [teams, setTeams] = useState(['Design', 'Engineering', 'Sales']);
  const closeButtons = useRef(new Map<string, HTMLButtonElement>());
  const resetRef = useRef<HTMLButtonElement>(null);

  const remove = (index: number) => {
    const neighbor = teams[index + 1] ?? teams[index - 1];
    const next = neighbor && closeButtons.current.get(neighbor);

    (next || resetRef.current)?.focus();
    setTeams((current) => current.filter((_, i) => i !== index));
  };

  return (
    <div className="flex-col-gap-2 items-start">
      <ul aria-label="Chosen teams" className="flex-row-gap-2 flex-wrap">
        <li>
          <Tag closable disabledWithReason="Set by your workspace">
            Region: Europe
          </Tag>
        </li>
        {teams.map((team, index) => (
          <li key={team}>
            <Tag
              closable
              closeRef={(node) => {
                if (node) closeButtons.current.set(team, node);
                return () => {
                  closeButtons.current.delete(team);
                };
              }}
              onClose={() => remove(index)}
            >
              {team}
            </Tag>
          </li>
        ))}
      </ul>
      <Button
        ref={resetRef}
        variant="base"
        look="ghost"
        onClick={() => setTeams([])}
      >
        Reset filters
      </Button>
    </div>
  );
};

/**
 * Variants: `base` is the default and fits a neutral label; `default` and
 * `accent` mark a category; `info`, `success`, `warning` and `error` carry
 * a status. Color never stands alone: the text says the status too.
 */
const Variants = () => (
  <div className="flex-row-gap-2 flex-wrap">
    <Tag>Base</Tag>
    <Tag variant="default">Default</Tag>
    <Tag variant="accent">Featured</Tag>
    <Tag variant="info">Info</Tag>
    <Tag variant="success">On sale</Tag>
    <Tag variant="warning">Almost full</Tag>
    <Tag variant="error">Sold out</Tag>
  </div>
);

/**
 * Sizes and look: `xs` is 24px tall for dense rows, `sm` (the default) 32px.
 * `look="!bordered"` drops the border for a tag on a busy background.
 */
const SizesAndLook = () => (
  <div className="flex-row-gap-2 flex-wrap items-center">
    <Tag size="xs">Extra small</Tag>
    <Tag size="sm">Small</Tag>
    <Tag look="!bordered" variant="accent">
      No border
    </Tag>
  </div>
);

/**
 * Icon and count: `rightIcon` follows the label, and `leftAddOn` takes an
 * element before it. The unit is in visually hidden text, so the number is
 * read with its meaning and the visible number is skipped.
 */
const IconsAndCount = () => (
  <div className="flex-row-gap-2 flex-wrap">
    <Tag rightIcon={<MapPin />}>Berlin</Tag>
    <Tag variant="default" leftAddOn={<span aria-hidden>12</span>}>
      Engineering
      <span className="sr-only"> (12 events)</span>
    </Tag>
  </div>
);

/**
 * Tooltip: more detail on hover. A tag that can't close takes no focus, so
 * keyboard and touch users never see it: only extra detail goes there. On a
 * closable tag the tooltip moves to the close button and shows on focus too.
 */
const WithTooltip = () => (
  <Tag variant="warning" tooltip="Fewer than 10 tickets left">
    Almost full
  </Tag>
);

export default function TagRecipe() {
  return (
    <div className="flex-col-gap-6">
      <Status />
      <ChosenFilters />
      <Variants />
      <SizesAndLook />
      <IconsAndCount />
      <WithTooltip />
    </div>
  );
}
