/**
 * Form: a form's layout, with Controller, useController and useCanSubmitForm
 * putting the design system's fields under react-hook-form. Form lays out
 * the fields in a column at the form's field width, then its own `error` and
 * its `actions`, the main one last. Call `useForm`, render every field
 * through `Controller`, and spread `{...field}` on the control: it carries
 * the name, value, `onChange`, `onBlur`, a ref that focuses the first invalid
 * field on submit, the `required` mark from `rules`, and the `error` message.
 *
 * When not to use:
 * - A live filter or a setting saved as it changes is not a form: keep the
 *   value in `useState` and use the control on its own.
 * - Never keep field values in `useState` next to a Form.
 *
 * Pitfalls:
 * - Validation goes in `rules`, which also sets `required`. Form turns the
 *   browser's own validation off, so the fields show the messages.
 * - Every field is 1x wide, the form's field width. A field whose content
 *   needs another sets `width` (0.5x, 0.75x, 1.5x, 2x), never a width class,
 *   so the fields of one form line up. In a Dialog, `fill` gives every field
 *   the dialog's width.
 * - Fields side by side go in a FormRow. A button beside a field goes in the
 *   field's `action`.
 * - `{...field}` overwrites `required` and `error` given before it.
 * - A rule without a message sets `error` to `true`, which only styles the
 *   field: give every rule a message.
 * - Report a server's error with `setError`, on the field or on `root`; a
 *   `root` error is the Form's `error`. It stays until `clearErrors('root')`.
 * - Validation runs on submit by default: errors show after the first submit,
 *   then update as the user edits. `mode: 'onBlur'` validates earlier.
 * - A gated submit button does nothing on Enter either, so gate it only when
 *   the errors are visible next to the fields.
 */
import { Button } from '@packages/ui/Button';
import { Checkbox } from '@packages/ui/Checkbox';
import {
  Controller,
  Form,
  FormRow,
  useCanSubmitForm,
  useController,
  type UseControllerProps,
} from '@packages/ui/Form';
import { Input, NumberInput, PasswordInput } from '@packages/ui/Input';
import { MultiSelect, Select, SelectOption } from '@packages/ui/Select';
import React, { useEffect, useState } from 'react';
import { type Control, useForm, type FieldValues } from 'react-hook-form';

// Setup: stand-ins for your app's data and requests, not part of the pattern.
const venues = [
  { id: 'harbor', name: 'Harbor Hall' },
  { id: 'mill', name: 'Old Mill' },
  { id: 'loft', name: 'The Loft' },
];
const tracks = ['Design', 'Engineering', 'Product', 'Community'];
const takenTitles = ['Launch party'];

// Stand in for requests to a server.
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const saveEvent = (event: NewEvent) => wait(600).then(() => event);
const publishEvent = (title: string) =>
  wait(600).then(() => !takenTitles.includes(title));
const registerAttendee = (registration: Registration) =>
  wait(400).then(() => registration);
const sendInvites = (invites: Invites) => wait(400).then(() => invites);
const saveLimits = (tickets: Tickets) => wait(400).then(() => tickets);
const saveAddress = (address: Address) => wait(400).then(() => address);

// Usage: the patterns to copy.
type NewEvent = {
  title: string;
  venue: string;
  tracks: string[];
  capacity: number | null;
  organizerPin: string;
  publicListing: boolean;
};

const emptyEvent: NewEvent = {
  title: '',
  venue: '',
  tracks: [],
  capacity: null,
  organizerPin: '',
  publicListing: true,
};

/**
 * Every field kind through `Controller`. The submit button shows it is saving
 * with `loadingWithReason`, and `reset(values)` makes the saved values the new
 * baseline, so the form is no longer dirty. The pin field is locked with
 * `disabledWithReason` beside `{...field}`: the reason works even though the
 * form passes its own props.
 */
const NewEventForm = () => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<NewEvent>({ defaultValues: emptyEvent });

  const save = async (values: NewEvent) => {
    await saveEvent(values);
    reset(values);
  };

  return (
    <Form
      onSubmit={handleSubmit(save)}
      actions={
        <Button
          type="submit"
          loadingWithReason={isSubmitting ? 'Saving the event' : undefined}
        >
          Save event
        </Button>
      }
    >
      <Controller
        name="title"
        control={control}
        rules={{ required: 'Enter the event title' }}
      >
        {({ field }) => <Input label="Title" autoComplete="off" {...field} />}
      </Controller>
      <Controller
        name="venue"
        control={control}
        rules={{ required: 'Choose a venue' }}
      >
        {({ field }) => (
          <Select label="Venue" {...field}>
            {venues.map((venue) => (
              <SelectOption
                key={venue.id}
                value={venue.id}
                label={venue.name}
              />
            ))}
          </Select>
        )}
      </Controller>
      <Controller name="tracks" control={control}>
        {({ field }) => (
          <MultiSelect label="Tracks" {...field}>
            {tracks.map((track) => (
              <SelectOption key={track} value={track} label={track} />
            ))}
          </MultiSelect>
        )}
      </Controller>
      <Controller
        name="capacity"
        control={control}
        rules={{
          required: 'Enter how many people fit',
          min: { value: 1, message: 'Capacity must be at least 1' },
        }}
      >
        {({ field }) => (
          <NumberInput
            label="Capacity"
            autoComplete="off"
            allowDecimal={false}
            min={0}
            {...field}
          />
        )}
      </Controller>
      <Controller name="organizerPin" control={control}>
        {({ field }) => (
          <PasswordInput
            label="Organizer pin"
            autoComplete="off"
            width="0.5x"
            disabledWithReason="Set a pin after the first save"
            {...field}
          />
        )}
      </Controller>
      <Controller name="publicListing" control={control}>
        {({ field: { value, onChange, ...field } }) => (
          <Checkbox checked={value} onCheckedChange={onChange} {...field}>
            List this event publicly
          </Checkbox>
        )}
      </Controller>
    </Form>
  );
};

type Publish = { title: string };

/**
 * A server's rejection: `setError` on a field shows under it, on `root.server`
 * as the Form's `error`. The root error outlives edits, so clear it when the
 * user changes a field.
 */
const ServerErrors = () => {
  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Publish>({ defaultValues: { title: '' } });

  useEffect(
    () => watch(() => clearErrors('root')).unsubscribe,
    [watch, clearErrors],
  );

  const publish = async ({ title }: Publish) => {
    try {
      if (!(await publishEvent(title))) {
        setError('title', { message: 'An event with this title exists' });
      }
    } catch {
      setError('root.server', { message: 'Could not reach the server' });
    }
  };

  return (
    <Form
      onSubmit={handleSubmit(publish)}
      error={errors.root?.server?.message}
      actions={
        <Button
          type="submit"
          loadingWithReason={isSubmitting ? 'Publishing the event' : undefined}
        >
          Publish
        </Button>
      }
    >
      <Controller
        name="title"
        control={control}
        rules={{ required: 'Enter the event title' }}
      >
        {({ field }) => <Input label="Title" autoComplete="off" {...field} />}
      </Controller>
    </Form>
  );
};

type Registration = { name: string; email: string };

/**
 * A submit button that waits while any error shows: `useCanSubmitForm` with
 * `disabledWithReason` tells the user why. An untouched form can still submit,
 * which shows the errors first. Enter does nothing while the button waits, so
 * the errors must be visible beside the fields.
 */
const GatedSubmit = () => {
  const { control, handleSubmit } = useForm<Registration>({
    mode: 'onBlur',
    defaultValues: { name: '', email: '' },
  });
  const canSubmit = useCanSubmitForm(control);

  return (
    <Form
      onSubmit={handleSubmit(registerAttendee)}
      actions={
        <Button
          type="submit"
          disabledWithReason={canSubmit ? undefined : 'Fix the errors above'}
        >
          Register
        </Button>
      }
    >
      <Controller
        name="name"
        control={control}
        rules={{ required: 'Enter your name' }}
      >
        {({ field }) => <Input label="Name" autoComplete="name" {...field} />}
      </Controller>
      <Controller
        name="email"
        control={control}
        rules={{
          required: 'Enter your email',
          pattern: {
            value: /^\S+@\S+\.\S+$/,
            message: 'Enter an email like name@example.com',
          },
        }}
      >
        {({ field }) => (
          <Input label="Email" type="email" autoComplete="email" {...field} />
        )}
      </Controller>
    </Form>
  );
};

type EmailFieldProps<T extends FieldValues> = Pick<
  UseControllerProps<T>,
  'name'
> & { control: Control<T> };

/**
 * A field component of your own: it takes `control` and `name`, and
 * `useController` wires it, so any email field can reuse it.
 */
const EmailField = <T extends FieldValues>({
  control,
  name,
}: EmailFieldProps<T>) => {
  const { field } = useController({
    control,
    name,
    rules: {
      required: 'Enter an email',
      pattern: {
        value: /^\S+@\S+\.\S+$/,
        message: 'Enter an email like name@example.com',
      },
    },
  });

  return <Input label="Email" type="email" autoComplete="email" {...field} />;
};

type Invites = { host: string; cohost: string };

/** `useController` in use: the same field component twice, under two names. */
const InviteForm = () => {
  const { control, handleSubmit } = useForm<Invites>({
    defaultValues: { host: '', cohost: '' },
  });

  return (
    <Form
      onSubmit={handleSubmit(sendInvites)}
      actions={<Button type="submit">Invite</Button>}
    >
      <EmailField control={control} name="host" />
      <EmailField control={control} name="cohost" />
    </Form>
  );
};

type Tickets = { capacity: number | null; perOrder: number | null };

/**
 * A rule that depends on another field: `validate` reads it with `getValues`;
 * `deps` re-runs the other field's check when this one changes.
 */
const TicketLimits = () => {
  const { control, handleSubmit, getValues } = useForm<Tickets>({
    defaultValues: { capacity: null, perOrder: null },
  });

  return (
    <Form
      onSubmit={handleSubmit(saveLimits)}
      actions={<Button type="submit">Save limits</Button>}
    >
      <Controller
        name="capacity"
        control={control}
        rules={{ required: 'Enter the capacity', deps: ['perOrder'] }}
      >
        {({ field }) => (
          <NumberInput label="Capacity" autoComplete="off" min={0} {...field} />
        )}
      </Controller>
      <Controller
        name="perOrder"
        control={control}
        rules={{
          required: 'Enter the per-order limit',
          validate: (perOrder) =>
            perOrder === null ||
            getValues('capacity') === null ||
            perOrder <= (getValues('capacity') ?? 0) ||
            'The limit cannot exceed the capacity',
        }}
      >
        {({ field }) => (
          <NumberInput
            label="Tickets per order"
            autoComplete="off"
            min={0}
            {...field}
          />
        )}
      </Controller>
    </Form>
  );
};

/**
 * Validating early: `mode: 'onBlur'` checks a field when focus leaves it, and
 * `reValidateMode` sets how it updates after. The default, `onSubmit`, is the
 * calmest for short forms.
 */
const BlurValidatedForm = () => {
  const { control, handleSubmit } = useForm<Registration>({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { name: '', email: '' },
  });

  return (
    <Form
      onSubmit={handleSubmit(registerAttendee)}
      actions={<Button type="submit">Continue</Button>}
    >
      <Controller
        name="name"
        control={control}
        rules={{ required: 'Enter your name' }}
      >
        {({ field }) => <Input label="Name" autoComplete="name" {...field} />}
      </Controller>
    </Form>
  );
};

type Address = { city: string; postcode: string };

/**
 * A form that is a section of its own: `title` and `description` put it in
 * a Section. Fields side by side go in a FormRow, each at its own `width`;
 * the postcode is short, so 0.5x.
 */
const AddressForm = () => {
  const [saved, setSaved] = useState('');
  const { control, handleSubmit } = useForm<Address>({
    defaultValues: { city: '', postcode: '' },
  });

  return (
    <Form
      title="Venue address"
      description="Where attendees find the event."
      onSubmit={handleSubmit(async (address) => {
        await saveAddress(address);
        setSaved(`Saved ${address.city}`);
      })}
      actions={<Button type="submit">Save address</Button>}
    >
      <FormRow>
        <Controller
          name="city"
          control={control}
          rules={{ required: 'Enter the city' }}
        >
          {({ field }) => (
            <Input label="City" autoComplete="address-level2" {...field} />
          )}
        </Controller>
        <Controller
          name="postcode"
          control={control}
          rules={{ required: 'Enter the postcode' }}
        >
          {({ field }) => (
            <Input
              label="Postcode"
              width="0.5x"
              autoComplete="postal-code"
              {...field}
            />
          )}
        </Controller>
      </FormRow>
      <p role="status">{saved}</p>
    </Form>
  );
};

export default function FormRecipe() {
  return (
    <div className="flex-col-gap-6">
      <NewEventForm />
      <ServerErrors />
      <GatedSubmit />
      <InviteForm />
      <TicketLimits />
      <BlurValidatedForm />
      <AddressForm />
    </div>
  );
}
