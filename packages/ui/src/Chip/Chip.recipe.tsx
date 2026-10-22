/**
 * Chip: compact toggles for filters and quick choices, always visible. For
 * more than about eight options, or long labels, use a Select instead.
 */
import { Chip, ChipGroup } from '@packages/ui/Chip';
import { Star } from 'lucide-react';
import React, { useState } from 'react';

/**
 * Single choice: exactly one option is on, like a radio group (a date range,
 * a view mode). Picking one turns the other off.
 */
const SingleChoice = () => {
  const [range, setRange] = useState('30d');
  return (
    <ChipGroup
      mode="single"
      aria-label="Date range"
      value={range}
      onChange={setRange}
      className="flex-row-gap-2 flex-wrap"
    >
      <Chip value="7d">7 days</Chip>
      <Chip value="30d">30 days</Chip>
      <Chip value="90d">90 days</Chip>
    </ChipGroup>
  );
};

/**
 * Multiple choice: any number of options on, like checkboxes (status filters).
 * Chips are `size="sm"` by default; use `size="md"` beside md inputs, and
 * `look="rounded"` for pill shapes.
 */
const MultipleChoice = () => {
  const [statuses, setStatuses] = useState<string[]>(['Published']);
  return (
    <ChipGroup
      mode="multiple"
      aria-label="Status"
      value={statuses}
      onChange={setStatuses}
      className="flex-row-gap-2 flex-wrap"
    >
      {['Draft', 'Published', 'Sold out', 'Cancelled'].map((status) => (
        <Chip key={status} value={status}>
          {status}
        </Chip>
      ))}
    </ChipGroup>
  );
};

/**
 * Independent toggle: one chip on its own, on or off (a "Starred only"
 * filter). It can carry an icon; `variant` and `selection` set its look.
 */
const IndependentToggle = () => {
  const [starredOnly, setStarredOnly] = useState(false);
  return (
    <Chip
      leftIcon={<Star />}
      active={starredOnly}
      onActiveChange={setStarredOnly}
    >
      Starred only
    </Chip>
  );
};

export default function ChipRecipe() {
  return (
    <div className="flex-col-gap-6">
      <SingleChoice />
      <MultipleChoice />
      <IndependentToggle />
    </div>
  );
}
