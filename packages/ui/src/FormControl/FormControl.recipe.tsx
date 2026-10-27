/**
 * FormControl: a form control's label, box, help text and status message,
 * around a control you render yourself. Its children get `controlProps` to
 * spread, last, on the one focusable element.
 *
 * When not to use:
 * - A text, number, password or search field: Input, NumberInput,
 *   PasswordInput, SearchInput.
 * - A choice from a list: Select or MultiSelect. A yes/no choice: Checkbox.
 * - Use FormControl only for a control the design system has no component
 *   for, like a native date input or the star rating below.
 *
 * Pitfalls:
 * - Spread `controlProps` on one focusable element. Take `isDisabled` out of
 *   it first, as it isn't an attribute, and stop the control changing while
 *   it's true: FormControl sets `tabIndex` and `aria-disabled`, but not
 *   `disabled`.
 * - In a form, `{...field}` goes on FormControl and `value`, `onChange` and
 *   `onBlur` on the control.
 * - `withControlBox={false}` is for a control that draws its own box: render
 *   `ControlBox` and give it the props FormControl passes.
 * - A `role="slider"` needs `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
 *   and the keyboard: arrows, Home and End.
 */
import { Button } from '@packages/ui/Button';
import { Controller } from '@packages/ui/Form';
import {
  ControlBox,
  FormControl,
  type ControlProps,
} from '@packages/ui/FormControl';
import { CalendarDays, Star } from 'lucide-react';
import React, { type KeyboardEvent, type MouseEvent, useId } from 'react';
import { useForm } from 'react-hook-form';

// Setup: stand-ins for your app's data and requests, not part of the pattern.
// Stand in for requests to a server.
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const saveEventDate = (form: EventDateForm) => wait(400).then(() => form);
const sendReview = (review: Review) => wait(400).then(() => review);

// Usage: the patterns to copy.
const STARS = 5;
const steps: Record<string, number> = {
  ArrowRight: 1,
  ArrowUp: 1,
  ArrowLeft: -1,
  ArrowDown: -1,
};

type RatingControlProps = {
  value: number;
  onChange: (value: number) => void;
  isDisabled: boolean;
};

// The slider's attributes and handlers, for a control that draws the stars.
const ratingProps = ({ value, onChange, isDisabled }: RatingControlProps) => {
  const rate = (next: number) => {
    if (!isDisabled) onChange(Math.min(STARS, Math.max(0, next)));
  };

  return {
    role: 'slider',
    'aria-valuemin': 0,
    'aria-valuemax': STARS,
    'aria-valuenow': value,
    'aria-valuetext': value ? `${value} of ${STARS} stars` : 'Not rated',
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === 'Home') rate(0);
      else if (event.key === 'End') rate(STARS);
      else if (steps[event.key]) rate(value + steps[event.key]);
      else return;
      event.preventDefault();
    },
    onClick: (event: MouseEvent<HTMLElement>) => {
      const { left, width } = event.currentTarget.getBoundingClientRect();
      rate(Math.ceil(((event.clientX - left) / width) * STARS));
    },
  };
};

const Stars = ({ value }: { value: number }) =>
  Array.from({ length: STARS }, (_, index) => (
    <Star
      key={index}
      aria-hidden
      fill={index < value ? 'currentColor' : 'none'}
    />
  ));

type EventDateForm = { date: string };

/**
 * A native control inside the box. Every shared prop works as on Input:
 * `label`, `hint`, `helpText`, `required`, `size`, `variant`, `look`, an icon,
 * `tooltip` and `labelRightSlot`. `isDisabled` covers the disabled, read-only
 * and loading states, so the input is read-only while it's true.
 */
const EventDate = () => {
  const { control, handleSubmit } = useForm<EventDateForm>({
    defaultValues: { date: '' },
  });

  return (
    <form
      noValidate
      onSubmit={handleSubmit(saveEventDate)}
      className="flex-col-gap-4 items-start"
    >
      <Controller
        name="date"
        control={control}
        rules={{ required: 'Pick the event date' }}
      >
        {({ field: { value, onChange, onBlur, ...field } }) => (
          <FormControl
            label="Event date"
            hint="In the venue's time zone"
            helpText="Doors open at 9:00"
            leftIcon={<CalendarDays />}
            {...field}
          >
            {({ isDisabled, ...controlProps }) => (
              <input
                {...controlProps}
                type="date"
                value={value}
                readOnly={isDisabled}
                onChange={(event) => {
                  if (!isDisabled) onChange(event.target.value);
                }}
                onBlur={onBlur}
              />
            )}
          </FormControl>
        )}
      </Controller>
      <Button type="submit">Save date</Button>
    </form>
  );
};

/**
 * The states, each with its reason: `disabledWithReason`,
 * `readOnlyWithReason` and `loadingWithReason`, and the statuses `warning`
 * and `success`. `aria-labelledby` names a control with no `label` from a
 * heading.
 */
const DateStates = () => {
  const headingId = useId();

  return (
    <div className="flex-col-gap-4 items-start">
      <h3 id={headingId}>Doors open</h3>
      <FormControl
        aria-labelledby={headingId}
        warning="Earlier than last year"
        size="sm"
        variant="base"
        look="open"
      >
        {({ isDisabled, ...controlProps }) => (
          <input
            {...controlProps}
            type="time"
            defaultValue="08:00"
            readOnly={isDisabled}
          />
        )}
      </FormControl>
      <FormControl
        label="Start date"
        disabledWithReason="Dates lock once tickets are on sale"
      >
        {({ isDisabled, ...controlProps }) => (
          <input
            {...controlProps}
            type="date"
            defaultValue="2026-11-12"
            readOnly={isDisabled}
          />
        )}
      </FormControl>
      <FormControl
        label="End date"
        readOnlyWithReason="The end follows the start"
        success="Matches the schedule"
      >
        {({ isDisabled, ...controlProps }) => (
          <input
            {...controlProps}
            type="date"
            defaultValue="2026-11-13"
            readOnly={isDisabled}
          />
        )}
      </FormControl>
      <FormControl label="Rain date" loadingWithReason="Checking the forecast">
        {({ isDisabled, ...controlProps }) => (
          <input {...controlProps} type="date" readOnly={isDisabled} />
        )}
      </FormControl>
    </div>
  );
};

type Review = { rating: number };

/**
 * A custom control in the box: a slider of stars with 0 as "Not rated".
 * The arrows, Home and End move it, and a press picks a star. Its value
 * attributes are what assistive tech reads.
 */
const EventRating = () => {
  const { control, handleSubmit } = useForm<Review>({
    defaultValues: { rating: 0 },
  });

  return (
    <form
      noValidate
      onSubmit={handleSubmit(sendReview)}
      className="flex-col-gap-4 items-start"
    >
      <Controller
        name="rating"
        control={control}
        rules={{
          min: { value: 1, message: 'Rate the event from 1 to 5 stars' },
        }}
      >
        {({ field: { value, onChange, onBlur, ...field } }) => (
          <FormControl
            label="Your rating"
            hint="Shown to the organizer only"
            {...field}
          >
            {({ isDisabled, ...controlProps }: ControlProps) => (
              <div
                {...ratingProps({ value, onChange, isDisabled })}
                onBlur={onBlur}
                className="flex-row-gap-1 items-center"
                {...controlProps}
              >
                <Stars value={value} />
              </div>
            )}
          </FormControl>
        )}
      </Controller>
      <Button type="submit">Send</Button>
    </form>
  );
};

/**
 * A control that is its own box: `withControlBox={false}` and `ControlBox`
 * around the stars. FormControl hands the box its look and state through
 * `controlProps`, so spread them all on `ControlBox`.
 */
const BoxedRating = () => {
  const { control } = useForm<Review>({ defaultValues: { rating: 3 } });

  return (
    <Controller name="rating" control={control}>
      {({ field: { value, onChange, onBlur, ...field } }) => (
        <FormControl label="Venue rating" withControlBox={false} {...field}>
          {({ isDisabled, ...controlProps }) => (
            <ControlBox
              {...controlProps}
              isDisabled={isDisabled}
              {...ratingProps({ value, onChange, isDisabled })}
              onBlur={onBlur}
            >
              <Stars value={value} />
            </ControlBox>
          )}
        </FormControl>
      )}
    </Controller>
  );
};

export default function FormControlRecipe() {
  return (
    <div className="flex-col-gap-6">
      <EventDate />
      <DateStates />
      <EventRating />
      <BoxedRating />
    </div>
  );
}
