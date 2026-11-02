/**
 * Numeral: a number the user reads and compares, such as a count, a total,
 * a statistic or a table's figures. It sets the number in the theme's mono
 * font, so digits line up in a column and a count that changes doesn't move
 * what sits beside it. Size, weight and color come from around it.
 *
 * When not to use:
 * - A number inside a sentence ("3 books left to read"): it is part of the
 *   text and stays in the text's font.
 * - A date, a time or a phone number: people read them as text.
 *
 * Pitfalls:
 * - Format the number before you pass it: Numeral only sets its font. Use
 *   `toLocaleString` or `Intl.NumberFormat` for separators and currency.
 * - Keep the label outside: "Pages read" is text, only the figure is a
 *   Numeral. A unit that belongs to the figure, like € or %, goes inside.
 */
import { IconButton } from '@packages/ui/Button';
import { Numeral } from '@packages/ui/Numeral';
import { Minus, Plus } from 'lucide-react';
import React, { useState } from 'react';

// Setup: stand-ins for your app's data, not part of the pattern.
const totals = [
  { label: 'Groceries', amount: 1249.5 },
  { label: 'Rent', amount: 950 },
  { label: 'Transport', amount: 86.25 },
];
const euros = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
});

// Usage: the patterns to copy.
/** A count that changes: the buttons beside it stay where they are. */
const Counter = () => {
  const [count, setCount] = useState(9);
  return (
    <div className="flex-row-gap-2 items-center">
      <IconButton tooltip="Decrease" onClick={() => setCount(count - 1)}>
        <Minus />
      </IconButton>
      <Numeral aria-live="polite">{count}</Numeral>
      <IconButton tooltip="Increase" onClick={() => setCount(count + 1)}>
        <Plus />
      </IconButton>
    </div>
  );
};

/** A statistic: the figure takes its size from the element around it. */
const Statistic = () => (
  <div className="flex-col-gap-1">
    <span>Pages read this week</span>
    <span className="text-heading">
      <Numeral>{(1834).toLocaleString('en')}</Numeral>
    </span>
  </div>
);

/** Totals in a column: aligned to the end, the digits line up. */
const Totals = () => (
  <dl className="flex-col-gap-2">
    {totals.map(({ label, amount }) => (
      <div key={label} className="flex-row-gap-4 justify-between">
        <dt>{label}</dt>
        <dd>
          <Numeral>{euros.format(amount)}</Numeral>
        </dd>
      </div>
    ))}
  </dl>
);

export default function NumeralRecipe() {
  return (
    <div className="flex-col-gap-6 items-start">
      <Counter />
      <Statistic />
      <Totals />
    </div>
  );
}
