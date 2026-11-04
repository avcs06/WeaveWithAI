/**
 * useControlledValue: a component's value that its parent controls with
 * `value` and `onChange`, or leaves to the component, starting from
 * `defaultValue`. For a reusable component offering both, as native inputs
 * do. `onChange` runs either way, with any extra arguments the component
 * passes. The setter keeps its identity across renders, like `useState`'s.
 *
 * Not for: a component that is always controlled (take `value` and
 * `onChange` as they are) or never (useState).
 *
 * Pitfalls:
 * - Any `value` but `undefined` controls it: an empty value is `null`. A
 *   parent passing `undefined` hands the value back to the component.
 * - `defaultValue` is read once; a new `key` starts the component over.
 * - Without `defaultValue` the value can be `undefined`: give the fallback
 *   where it's read.
 */
import { Button } from '@packages/ui/Button';
import { NumberInput } from '@packages/ui/Input';
import {
  Select,
  SelectOption,
  type SelectOptionData,
} from '@packages/ui/Select';
import { useControlledValue } from '@packages/utils/hooks';
import React, { useId, useState } from 'react';

// Setup: stand-ins for your app's data and requests, not part of the pattern.
const ticketPrice = 20;

const ticketTypes = [
  { value: 'general', label: 'General admission', price: 20 },
  { value: 'vip', label: 'VIP', price: 80 },
];

// Usage: the patterns to copy.
type GuestCountProps = {
  /** `null` is no answer yet. */
  value?: number | null;
  defaultValue?: number | null;
  onChange?: (count: number | null) => void;
};

/** The component: controlled when its parent passes `value`. */
const GuestCount = ({
  value,
  defaultValue = null,
  onChange,
}: GuestCountProps) => {
  const [count, setCount] = useControlledValue(value, defaultValue, onChange);

  return (
    <NumberInput
      label="Guests"
      autoComplete="off"
      min={1}
      max={10}
      allowDecimal={false}
      value={count}
      onChange={setCount}
    />
  );
};

/** Uncontrolled from 2: Reset mounts a new one with a `key`, back at 2. */
const OwnCount = () => {
  const [resets, setResets] = useState(0);

  return (
    <div className="flex-row-gap-2 items-end">
      <GuestCount key={resets} defaultValue={2} />
      <Button variant="base" onClick={() => setResets(resets + 1)}>
        Reset
      </Button>
    </div>
  );
};

/** Uncontrolled with `onChange`: the component keeps the count, and the parent reads it for the total. */
const WatchedCount = () => {
  const [count, setCount] = useState<number | null>(null);

  return (
    <div className="flex-col-gap-2">
      <GuestCount onChange={setCount} />
      <p role="status">Total: €{(count ?? 0) * ticketPrice}</p>
    </div>
  );
};

/**
 * Controlled: the parent decides. It allows at most 4 per booking, and
 * Clear sets `null`.
 */
const ParentCount = () => {
  const [count, setCount] = useState<number | null>(3);

  return (
    <div className="flex-row-gap-2 items-end">
      <GuestCount
        value={count}
        onChange={(next) => setCount(next === null ? null : Math.min(next, 4))}
      />
      <Button variant="base" onClick={() => setCount(null)}>
        Clear
      </Button>
    </div>
  );
};

/**
 * Extra arguments: Select's `onChange` also passes the option, so the
 * setter does too, and the parent reads the option's `price`.
 */
const TicketType = ({
  value,
  defaultValue,
  onChange,
}: {
  value?: string;
  defaultValue?: string;
  onChange?: (type: string, option: SelectOptionData | undefined) => void;
}) => {
  const [type = '', setType] = useControlledValue(
    value,
    defaultValue,
    onChange,
  );

  return (
    <Select label="Ticket type" value={type} onChange={setType}>
      {ticketTypes.map(({ value, label, price }) => (
        <SelectOption key={value} value={value} label={label} price={price}>
          {label}, €{price}
        </SelectOption>
      ))}
    </Select>
  );
};

/** The parent hears the option with the value. */
const TicketPrice = () => {
  const [price, setPrice] = useState<number>();

  return (
    <div className="flex-col-gap-2">
      <TicketType
        defaultValue="general"
        onChange={(_type, option) => setPrice(option?.price as number)}
      />
      <p role="status">{price === undefined ? '' : `€${price} per ticket`}</p>
    </div>
  );
};

/** An optional `defaultOpen`: the value is `undefined` until set, so the fallback goes in the destructuring. */
const VenueDetails = ({
  open,
  defaultOpen,
  onOpenChange,
}: {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) => {
  const id = useId();
  const [isOpen = false, setOpen] = useControlledValue(
    open,
    defaultOpen,
    onOpenChange,
  );

  return (
    <div className="flex-col-gap-2 items-start">
      <Button
        variant="base"
        aria-expanded={isOpen}
        aria-controls={id}
        onClick={() => setOpen(!isOpen)}
      >
        Venue details
      </Button>
      <p id={id} hidden={!isOpen}>
        Hall B, second floor
      </p>
    </div>
  );
};

export default function UseControlledValueRecipe() {
  return (
    <div className="flex-col-gap-4">
      <OwnCount />
      <WatchedCount />
      <ParentCount />
      <TicketPrice />
      <VenueDetails />
    </div>
  );
}
