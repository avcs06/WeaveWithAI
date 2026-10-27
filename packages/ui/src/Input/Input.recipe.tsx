/**
 * Input: a single-line text field. `onChange` gets the text, not an event.
 * With `delay`, the text shows at once and `onChange` waits for a pause in
 * typing. PasswordInput, SearchInput and NumberInput are the fields for
 * those values. In a `useForm` form, every field renders through
 * `Controller`, and `{...field}` gives it its name, value, `onChange`,
 * `required` mark, `error` and focus on a failed submit.
 *
 * When not to use:
 * - A password: PasswordInput. A search: SearchInput. A number: NumberInput.
 * - A choice from a list: Select. A date or time: FormControl around the
 *   native input.
 *
 * Pitfalls:
 * - Every field needs a name: `label`, or `aria-label` / `aria-labelledby`.
 *   A placeholder is not a name.
 * - Set `required` through the `rules` of `Controller`, which also marks the
 *   field. `{...field}` overwrites a `required` or `error` given before it,
 *   so spread it first when you override either.
 * - Report a server's error with `setError`, so it shows on the field.
 * - An error shows below the help text, which stays: the message says what
 *   went wrong ("Too short"), the help text what's asked.
 * - `error={true}` only styles the field. Pass a message unless the same
 *   text shows elsewhere.
 * - Don't put a live counter in `helpText`: it announces on every key. Put
 *   it in `labelRightSlot`.
 * - SearchInput's `loading` locks typing unless `disableWhileLoading={false}`.
 * - NumberInput shows a text keyboard on phones unless `min` is 0 or more,
 *   or `allowNegative={false}`, because number keypads have no minus key.
 */
import { Button, IconButton } from '@packages/ui/Button';
import { Controller } from '@packages/ui/Form';
import {
  Input,
  NumberInput,
  PasswordInput,
  SearchInput,
} from '@packages/ui/Input';
import { Link } from '@packages/ui/Link';
import { AtSign, Copy } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

// Setup: stand-ins for your app's data and requests, not part of the pattern.
const takenAddresses = ['launch', 'meetup'];
const venues = ['Harbor Hall', 'Old Mill', 'Riverside Pavilion', 'The Loft'];
const events = ['Launch party', 'Community meetup', 'Design review'];

// Stand in for requests to a server.
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const saveContact = (contact: Contact) => wait(600).then(() => contact);
const saveTitle = (title: string) => wait(300).then(() => title);
const isAddressFree = (address: string) =>
  wait(400).then(() => !takenAddresses.includes(address));
const signIn = (password: string) =>
  wait(600).then(() => password === 'correct-horse');
const reserveAddress = (address: Address) => wait(400).then(() => address);
const addGuests = (guests: Guests) => wait(400).then(() => guests);
const createAccount = (account: SignUp) => wait(600).then(() => account);
const searchVenues = (search: string) =>
  wait(500).then(() =>
    venues.filter((venue) =>
      venue.toLowerCase().includes(search.toLowerCase()),
    ),
  );

// Usage: the patterns to copy.
const MAX_TAGLINE = 60;
const SHARE_LINK = 'https://events.example.com/launch-party';

type Contact = { name: string; email: string; phone: string };

/**
 * A contact form: `rules` validate, `type` brings the right keyboard on
 * phones, and the submit button shows it is saving through
 * `loadingWithReason`.
 */
const ContactForm = () => {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<Contact>({ defaultValues: { name: '', email: '', phone: '' } });

  return (
    <form
      noValidate
      onSubmit={handleSubmit(saveContact)}
      className="flex-col-gap-4 items-start"
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
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            leftIcon={<AtSign />}
            helpText="For receipts only"
            {...field}
          />
        )}
      </Controller>
      <Controller name="phone" control={control}>
        {({ field }) => (
          <Input
            label="Phone"
            type="tel"
            autoComplete="tel"
            hint="Only used if the venue needs to reach you"
            {...field}
          />
        )}
      </Controller>
      <Button
        type="submit"
        loadingWithReason={isSubmitting ? 'Saving your contact' : undefined}
      >
        Save
      </Button>
    </form>
  );
};

/**
 * Saved as the user types: `delay` holds `onChange` until typing pauses for
 * 500ms. A new `value` from the parent, like the suggested title, replaces
 * the text and drops a save not yet sent.
 */
const AutosavedTitle = () => {
  const [title, setTitle] = useState('Launch party');
  const [status, setStatus] = useState('All changes saved');

  const save = (next: string) => {
    setTitle(next);
    setStatus('Saving');
    saveTitle(next).then(() => setStatus('All changes saved'));
  };

  return (
    <div className="flex-col-gap-2 items-start">
      <Input
        label="Event title"
        autoComplete="off"
        delay={500}
        value={title}
        onChange={save}
      />
      <Button variant="base" onClick={() => save('Product launch')}>
        Use suggested title
      </Button>
      <p role="status">{status}</p>
    </div>
  );
};

/** `hint` explains the field in a tooltip, `placeholder` shows an example. */
const PromoCode = () => {
  const [code, setCode] = useState('');

  return (
    <Input
      label="Promo code"
      hint="Codes are on your invitation email"
      placeholder="EARLYBIRD"
      autoComplete="off"
      value={code}
      onChange={setCode}
    />
  );
};

/**
 * A length limit: `maxLength` stops typing at the limit, and the counter sits
 * in `labelRightSlot`, so it doesn't announce on every key.
 */
const Tagline = () => {
  const [tagline, setTagline] = useState('');

  return (
    <Input
      label="Tagline"
      autoComplete="off"
      maxLength={MAX_TAGLINE}
      labelRightSlot={`${tagline.length}/${MAX_TAGLINE}`}
      helpText={`Up to ${MAX_TAGLINE} characters`}
      value={tagline}
      onChange={setTagline}
    />
  );
};

/**
 * A field in a toolbar or table row with no visible label: `aria-label` names
 * it, `tooltip` shows the name on hover, and `variant="base"` suits a
 * surface that is not the page.
 */
const AttendeeNote = () => {
  const [note, setNote] = useState('');

  return (
    <Input
      aria-label="Attendee note"
      tooltip="Only organizers see this note"
      variant="base"
      size="sm"
      placeholder="Add a note"
      autoComplete="off"
      value={note}
      onChange={setNote}
    />
  );
};

/** `leftAddOn` and `rightAddOn` show fixed text around what the user types. */
const EventPageAddress = () => {
  const [address, setAddress] = useState('launch-party');

  return (
    <Input
      label="Event page address"
      leftAddOn="https://"
      rightAddOn=".example.com"
      autoComplete="off"
      value={address}
      onChange={setAddress}
    />
  );
};

/** `type="url"` brings the URL keyboard on phones. */
const StreamLink = () => {
  const [link, setLink] = useState('');

  return (
    <Input
      label="Stream link"
      type="url"
      placeholder="https://"
      autoComplete="off"
      value={link}
      onChange={setLink}
    />
  );
};

/**
 * A value to copy, not edit: `readOnlyWithReason` says why, and a copy
 * button sits in `rightAddOn`.
 */
const ShareLink = () => {
  const copy = () => navigator.clipboard.writeText(SHARE_LINK);

  return (
    <Input
      label="Share link"
      readOnlyWithReason="The link is generated for you"
      autoComplete="off"
      value={SHARE_LINK}
      onChange={() => undefined}
      rightAddOn={
        <IconButton
          tooltip="Copy share link"
          variant="base"
          look="ghost"
          size="xs"
          onClick={copy}
        >
          <Copy />
        </IconButton>
      }
    />
  );
};

/** A field that can't be used yet: `disabledWithReason` says what unlocks it. */
const RegistrationCode = () => (
  <Input
    label="Registration code"
    disabledWithReason="Codes open when registration starts"
    autoComplete="off"
    value=""
    onChange={() => undefined}
  />
);

/** Content on its way: `loadingWithReason` shows a spinner and says what loads. */
const DraftTitle = () => (
  <Input
    label="Title"
    loadingWithReason="Loading your draft"
    autoComplete="off"
    value=""
    onChange={() => undefined}
  />
);

type Address = { address: string };

/**
 * Checking a value on the server: an async `validate` rule that runs on each
 * change (`mode: 'onChange'`), and `delay` so a change is a pause in typing.
 * `loading` follows `isValidating`, and `success` confirms the address.
 */
const EventAddressField = () => {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<Address>({ mode: 'onChange', defaultValues: { address: '' } });

  return (
    <form
      noValidate
      onSubmit={handleSubmit(reserveAddress)}
      className="flex-col-gap-4 items-start"
    >
      <Controller
        name="address"
        control={control}
        rules={{
          required: 'Choose an address',
          validate: async (address) =>
            (await isAddressFree(address)) || 'That address is taken',
        }}
      >
        {({ field, fieldState }) => (
          <Input
            label="Event address"
            autoComplete="off"
            delay={500}
            // Typing stays open while the check runs.
            loading={fieldState.isValidating}
            disableWhileLoading={false}
            success={
              field.value && !fieldState.error && !fieldState.isValidating
                ? 'Available'
                : undefined
            }
            {...field}
          />
        )}
      </Controller>
      <Button
        type="submit"
        loadingWithReason={isSubmitting ? 'Reserving the address' : undefined}
      >
        Reserve
      </Button>
    </form>
  );
};

/**
 * Adding items from the keyboard: `ref` reaches the input, so focus returns
 * to it after each add, and Enter adds.
 */
const SpeakerList = () => {
  const [speakers, setSpeakers] = useState<string[]>([]);
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLElement>(null);

  const add = () => {
    if (!name.trim()) return;
    setSpeakers([...speakers, name.trim()]);
    setName('');
    inputRef.current?.focus();
  };

  return (
    <div className="flex-col-gap-2 items-start">
      <Input
        ref={inputRef}
        label="Speaker name"
        autoComplete="off"
        value={name}
        onChange={setName}
        onKeyDown={(event) => {
          if (event.key !== 'Enter') return;
          event.preventDefault();
          add();
        }}
      />
      <Button variant="base" onClick={add}>
        Add speaker
      </Button>
      <ul>
        {speakers.map((speaker) => (
          <li key={speaker}>{speaker}</li>
        ))}
      </ul>
    </div>
  );
};

/**
 * Two numbers that must be in order. `error={true}` styles From alone, and
 * the message on To is the one that is announced. `allowNegative={false}`
 * keeps the number keypad on phones.
 */
const PriceFilter = () => {
  const [from, setFrom] = useState<number | null>(20);
  const [to, setTo] = useState<number | null>(10);
  const isInverted = from !== null && to !== null && from > to;

  return (
    <div className="flex-row-gap-4 flex-wrap items-start">
      <NumberInput
        label="From"
        autoComplete="off"
        allowNegative={false}
        leftAddOn="€"
        error={isInverted}
        value={from}
        onChange={setFrom}
      />
      <NumberInput
        label="To"
        autoComplete="off"
        allowNegative={false}
        leftAddOn="€"
        error={isInverted && 'To must not be below From'}
        value={to}
        onChange={setTo}
      />
    </div>
  );
};

/**
 * Whole numbers within a range: `allowDecimal={false}`, `min` and `max`
 * (blur moves the number into them), and `delay` to wait for a pause. A
 * `warning` flags a value that is allowed but worth a look.
 */
const VenueCapacity = () => {
  const [capacity, setCapacity] = useState<number | null>(120);

  return (
    <NumberInput
      label="Venue capacity"
      autoComplete="off"
      allowDecimal={false}
      min={1}
      max={500}
      step={10}
      delay={500}
      warning={
        capacity !== null && capacity > 400
          ? 'Large venues need a safety plan'
          : undefined
      }
      value={capacity}
      onChange={setCapacity}
    />
  );
};

/** Negative values allowed: a shift of the agenda in minutes, earlier or later. */
const AgendaShift = () => {
  const [minutes, setMinutes] = useState<number | null>(-15);

  return (
    <NumberInput
      label="Shift agenda by (minutes)"
      autoComplete="off"
      min={-120}
      max={120}
      step={5}
      value={minutes}
      onChange={setMinutes}
    />
  );
};

type Guests = { guests: number | null };

/** In a form, the empty number is `null`, so `required` and `min` rules apply. */
const GuestCount = () => {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<Guests>({ defaultValues: { guests: null } });

  return (
    <form
      noValidate
      onSubmit={handleSubmit(addGuests)}
      className="flex-col-gap-4 items-start"
    >
      <Controller
        name="guests"
        control={control}
        rules={{
          required: 'Enter how many guests are coming',
          min: { value: 1, message: 'Bring at least 1 guest' },
        }}
      >
        {({ field }) => (
          <NumberInput
            label="Guests"
            autoComplete="off"
            min={0}
            max={10}
            {...field}
          />
        )}
      </Controller>
      <Button
        type="submit"
        loadingWithReason={isSubmitting ? 'Adding your guests' : undefined}
      >
        Add guests
      </Button>
    </form>
  );
};

type SignIn = { password: string };

/**
 * Signing in: `autoComplete="current-password"` lets password managers fill
 * it, `labelRightSlot` holds the recovery link, and a failed sign-in is
 * reported with `setError`.
 */
const SignInForm = () => {
  const {
    control,
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = useForm<SignIn>({ defaultValues: { password: '' } });

  const submit = async ({ password }: SignIn) => {
    if (!(await signIn(password))) {
      setError('password', { message: 'That password is not right' });
    }
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit(submit)}
      className="flex-col-gap-4 items-start"
    >
      <Controller
        name="password"
        control={control}
        rules={{ required: 'Enter your password' }}
      >
        {({ field }) => (
          <PasswordInput
            label="Password"
            autoComplete="current-password"
            labelRightSlot={
              <Link href="/forgot-password">Forgot password?</Link>
            }
            {...field}
          />
        )}
      </Controller>
      <Button
        type="submit"
        loadingWithReason={isSubmitting ? 'Signing you in' : undefined}
      >
        Sign in
      </Button>
    </form>
  );
};

type SignUp = { password: string; confirm: string };

/**
 * Creating a password: `new-password` offers a generated one, `helpText`
 * states the requirement and stays above any error. The confirmation
 * compares with `getValues`, and `deps`
 * re-checks it when the first field changes.
 */
const SignUpPassword = () => {
  const {
    control,
    handleSubmit,
    getValues,
    formState: { isSubmitting },
  } = useForm<SignUp>({ defaultValues: { password: '', confirm: '' } });

  return (
    <form
      noValidate
      onSubmit={handleSubmit(createAccount)}
      className="flex-col-gap-4 items-start"
    >
      <Controller
        name="password"
        control={control}
        rules={{
          required: 'Use 8 or more characters',
          minLength: { value: 8, message: 'Use 8 or more characters' },
          deps: ['confirm'],
        }}
      >
        {({ field }) => (
          <PasswordInput
            label="Create password"
            autoComplete="new-password"
            helpText="Use 8 or more characters"
            {...field}
          />
        )}
      </Controller>
      <Controller
        name="confirm"
        control={control}
        rules={{
          required: 'Repeat the password',
          validate: (confirm) =>
            confirm === getValues('password') || 'The passwords do not match',
        }}
      >
        {({ field }) => (
          <PasswordInput
            label="Confirm password"
            autoComplete="new-password"
            {...field}
          />
        )}
      </Controller>
      <Button
        type="submit"
        loadingWithReason={isSubmitting ? 'Creating your account' : undefined}
      >
        Create account
      </Button>
    </form>
  );
};

/**
 * Filtering a list: SearchInput shows what's typed at once and sends it after
 * a pause. Escape and the clear button empty it. Give the field a visible
 * label, wrap it in `role="search"`, and announce the count.
 */
const EventSearch = () => {
  const [search, setSearch] = useState('');
  const matches = events.filter((event) =>
    event.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex-col-gap-2">
      <div role="search">
        <SearchInput
          label="Find an event"
          placeholder="Search events"
          value={search}
          onChange={setSearch}
        />
      </div>
      <p role="status">
        {matches.length} {matches.length === 1 ? 'event' : 'events'}
      </p>
      <ul>
        {matches.map((event) => (
          <li key={event}>{event}</li>
        ))}
      </ul>
    </div>
  );
};

/**
 * Searching on the server: `loading` shows while results load, and
 * `disableWhileLoading={false}` keeps typing open meanwhile. Each answer
 * keeps the text it answers: one for older text is dropped, and loading
 * lasts until the answer matches what was typed last.
 */
const VenueSearch = () => {
  const [search, setSearch] = useState('');
  const [answer, setAnswer] = useState({ search: '', results: venues });
  const latest = useRef('');
  const loading = answer.search !== search;

  const find = (next: string) => {
    setSearch(next);
    latest.current = next;
    void searchVenues(next).then((results) => {
      if (latest.current === next) setAnswer({ search: next, results });
    });
  };

  return (
    <div className="flex-col-gap-2">
      <div role="search">
        <SearchInput
          label="Find a venue"
          placeholder="Search venues"
          // Typing stays open while results load.
          loading={loading}
          disableWhileLoading={false}
          value={search}
          onChange={find}
        />
      </div>
      <ul>
        {answer.results.map((venue) => (
          <li key={venue}>{venue}</li>
        ))}
      </ul>
    </div>
  );
};

export default function InputRecipe() {
  return (
    <div className="flex-col-gap-6">
      <ContactForm />
      <AutosavedTitle />
      <PromoCode />
      <Tagline />
      <AttendeeNote />
      <EventPageAddress />
      <StreamLink />
      <ShareLink />
      <RegistrationCode />
      <DraftTitle />
      <EventAddressField />
      <SpeakerList />
      <PriceFilter />
      <VenueCapacity />
      <AgendaShift />
      <GuestCount />
      <SignInForm />
      <SignUpPassword />
      <EventSearch />
      <VenueSearch />
    </div>
  );
}
