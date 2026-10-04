/**
 * Truncate: one line of text that ends in an ellipsis when it doesn't fit,
 * with the full text in a tooltip. Controls already truncate their labels;
 * use it for other single-line text: names, titles, table cells.
 */
import { classNames } from '@packages/styles/classNames';
import { Truncate } from '@packages/ui/Truncate';
import React from 'react';

import { narrowColumn } from './Truncate.recipe.css';

const longTitle =
  'Quarterly planning review for the platform, design and support teams';

/**
 * In a row: the row needs `min-w-0` (or a fixed width) so Truncate can be
 * narrower than its text. Hover the cut text to see all of it.
 */
const InARow = () => (
  <div className="flex-row-gap-2 items-center min-w-0">
    <Truncate>{longTitle}</Truncate>
  </div>
);

/**
 * With a custom `tooltip`: it shows above the full text when the text is
 * cut, and on its own when it fits. It's hover only, so it repeats something
 * shown elsewhere, like the time in the event's row.
 */
const WithTooltip = () => (
  <Truncate tooltip="Starts at 10:00 in Room 4">{longTitle}</Truncate>
);

/** `alwaysShowTooltip` shows the full text even when nothing is cut. */
const AlwaysShowTooltip = () => (
  <Truncate alwaysShowTooltip>Short title</Truncate>
);

export default function TruncateRecipe() {
  return (
    <div className={classNames(narrowColumn, 'flex-col-gap-4')}>
      <InARow />
      <WithTooltip />
      <AlwaysShowTooltip />
    </div>
  );
}
