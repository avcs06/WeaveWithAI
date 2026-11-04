/**
 * FormControl: a form control's label, box, help text and status message around
 * a control you render yourself. Its children get `controlProps` to spread,
 * last, on the one focusable element.
 *
 * When not to use:
 * - A text, number, password or search field: Input, NumberInput,
 *   PasswordInput, SearchInput.
 * - A choice from a list: Select or MultiSelect. A yes/no choice: Checkbox.
 * - A date: DateInput.
 * - Only for a control the design system has no component for, like a native
 *   time input or the star rating below.
 *
 * Pitfalls:
 * - A button that acts on the field's value, such as Send, Apply or Move,
 *   goes in its `action`, in a form or out of one, such as a filter bar or a
 *   toolbar. A button beside the field in a flex row lines up with the label,
 *   not the box.
 * - Spread `controlProps` on one focusable element. Take `isDisabled` out first
 *   (it isn't an attribute) and stop the control changing while it's true:
 *   FormControl sets `tabIndex` and `aria-disabled`, not `disabled`.
 * - In a form, `{...field}` goes on FormControl and `value`, `onChange` and
 *   `onBlur` on the control.
 * - `withControlBox={false}` is for a control that draws its own box: render
 *   `ControlBox` and give it the props FormControl passes.
 * - A `role="slider"` needs `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
 *   and the keyboard: arrows, Home and End.
 */
import { Button } from '@packages/ui/Button';
import { Controller, Form } from '@packages/ui/Form';
import {
  ControlBox,
  FormControl,
  type ControlProps,
} from '@packages/ui/FormControl';
import { Clock, Star } from 'lucide-react';
import React, { type KeyboardEvent, type MouseEvent, useId } from 'react';
import { useForm } from 'react-hook-form';

// Setup: stand-ins for your app's data and requests, not part of the pattern.
// Stand in for requests to a server.
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const saveDoorsTime = (form: DoorsTimeForm) => wait(400).then(() => form);
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

type DoorsTimeForm = { time: string };

/**
 * A native control inside the box. Every shared prop works as on Input:
 * `label`, `hint`, `helpText`, `required`, `size`, `variant`, `look`, an icon,
 * `tooltip`, `labelRightSlot`. `isDisabled` covers the disabled, read-only and
 * loading states, so the input is read-only while it's true.
 */
const DoorsTime = () => {
  const { control, handleSubmit } = useForm<DoorsTimeForm>({
    defaultValues: { time: '' },
  });

  return (
    <Form
      onSubmit={handleSubmit(saveDoorsTime)}
      actions={<Button type="submit">Save time</Button>}
    >
      <Controller
        name="time"
        control={control}
        rules={{ required: 'Pick when the doors open' }}
      >
        {({ field: { value, onChange, onBlur, ...field } }) => (
          <FormControl
            label="Doors open"
            hint="In the venue's time zone"
            helpText="Attendees can arrive from then"
            leftIcon={<Clock />}
            {...field}
          >
            {({ isDisabled, ...controlProps }) => (
              <input
                {...controlProps}
                type="time"
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
    </Form>
  );
};

/**
 * The states, each with its reason: `disabledWithReason`, `readOnlyWithReason`,
 * `loadingWithReason`, and the statuses `warning` and `success`.
 * `aria-labelledby` names a control with no `label` from a heading.
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
        label="Start time"
        disabledWithReason="Times lock once tickets are on sale"
      >
        {({ isDisabled, ...controlProps }) => (
          <input
            {...controlProps}
            type="time"
            defaultValue="18:00"
            readOnly={isDisabled}
          />
        )}
      </FormControl>
      <FormControl
        label="End time"
        readOnlyWithReason="The end follows the start"
        success="Matches the schedule"
      >
        {({ isDisabled, ...controlProps }) => (
          <input
            {...controlProps}
            type="time"
            defaultValue="21:00"
            readOnly={isDisabled}
          />
        )}
      </FormControl>
      <FormControl label="Rain start" loadingWithReason="Checking the forecast">
        {({ isDisabled, ...controlProps }) => (
          <input {...controlProps} type="time" readOnly={isDisabled} />
        )}
      </FormControl>
    </div>
  );
};

type Review = { rating: number };

/**
 * A custom control in the box: a slider of stars, 0 meaning "Not rated".
 * Arrows, Home and End move it, a press picks a star, and its value attributes
 * are what assistive tech reads.
 */
const EventRating = () => {
  const { control, handleSubmit } = useForm<Review>({
    defaultValues: { rating: 0 },
  });

  return (
    <Form
      onSubmit={handleSubmit(sendReview)}
      actions={<Button type="submit">Send</Button>}
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
    </Form>
  );
};

/**
 * A control that is its own box: `withControlBox={false}` and `ControlBox`
 * around the stars. FormControl hands the box its look and state through
 * `controlProps`: spread them all on `ControlBox`.
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
      <DoorsTime />
      <DateStates />
      <EventRating />
      <BoxedRating />
    </div>
  );
}
