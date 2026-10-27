/**
 * Card: a bordered container with its own padding and gap, for one item's
 * content (an event in a gallery), as a whole-card button, or, in a CardGroup,
 * as a large selectable option with room for a description.
 *
 * When not to use:
 * - A short toggle or filter: Chip. A yes/no setting: Checkbox.
 * - A group of fields or a page section with no item behind it: plain markup.
 * - A card that opens a page: put a Link on its title (link card). Do not
 *   make the card a button that navigates.
 *
 * Pitfalls:
 * - A card is exactly one of: static (no `onClick`), a button (`onClick`), or
 *   selectable (in a CardGroup, or with `active` and `onActiveChange`). Never
 *   put links or buttons inside a button or selectable card: their children
 *   are presentational, so assistive tech can't reach them, and a click on
 *   them also hits the card.
 * - In a form, a CardGroup is the field: spread Controller's `{...field}` on
 *   it. It brings its own label, help text and error; don't wrap it in a
 *   FormControl.
 * - `onClick` and `asChild` don't mix: a list item can't be a button.
 * - Name a button or selectable card with `aria-labelledby` on its title and
 *   `aria-describedby` on its details; its whole text is its name otherwise.
 * - A grid of cards is a list: `<ul role="list">` of `<Card asChild><li>`,
 *   with `<h3>` titles. Columns go in a colocated .css.ts:
 *   `gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))'`,
 *   with Tailwind `grid gap-4` beside it.
 * - A card in a group takes the group's `disabled` or `disabledWithReason`; a
 *   card's own reason wins.
 */
import { classNames } from '@packages/styles/classNames';
import { Button } from '@packages/ui/Button';
import { Card, CardGroup } from '@packages/ui/Card';
import { Controller } from '@packages/ui/Form';
import { Link } from '@packages/ui/Link';
import React, { useId, useState } from 'react';
import { useForm } from 'react-hook-form';

import { cardColumns } from './Card.recipe.css';

// Setup: stand-ins for your app's data and requests, not part of the pattern.
// Stands in for a request to a server.
const register = (registration: Registration) =>
  new Promise((resolve) => setTimeout(resolve, 400, registration));

// Usage: the patterns to copy.
/**
 * Content cards: a gallery of items. A list of cards is a list, so each is an
 * `li` through `asChild`, with a heading for screen-reader navigation.
 * `look="elevated"` adds a shadow; `!elevated`, the default, has none.
 */
const ContentCards = () => (
  // eslint-disable-next-line jsx-a11y/no-redundant-roles -- Safari drops list semantics once list-style is none.
  <ul role="list" className={classNames(cardColumns, 'grid gap-4')}>
    <Card asChild>
      <li>
        <h3>Design systems meetup</h3>
        <p>Talks on tokens, theming and docs.</p>
      </li>
    </Card>
    <Card asChild look="elevated">
      <li>
        <h3>Frontend summit</h3>
        <p>A day of talks on the web platform.</p>
      </li>
    </Card>
  </ul>
);

/**
 * Looks: `ghost` drops the border and fill for cards on a busy page,
 * `outline` and `filled` are how a selected card shows (set by a group's
 * mode otherwise). `variant="base"` uses the neutral color instead of the
 * theme's.
 */
const Looks = () => (
  <div className="flex-col-gap-4">
    <Card look="ghost">
      <h3>Ghost</h3>
      <p>No border or fill.</p>
    </Card>
    <Card look="elevated">
      <h3>Elevated</h3>
      <p>A shadow lifts it off the page.</p>
    </Card>
    <Card variant="base" look="filled !elevated">
      <h3>Base variant</h3>
      <p>Neutral colors.</p>
    </Card>
  </div>
);

/**
 * Link card: the title is the link and the card stays static, so the link is
 * a normal tab stop that is read by its text.
 */
const LinkCard = () => (
  <Card>
    <h3>
      <Link href="/events/42">Design systems meetup</Link>
    </h3>
    <p>Thursday 18:00 at Hall B.</p>
  </Card>
);

/**
 * A card with its own actions: keep it static and put Buttons in it. Do not
 * add `onClick` to it, or the buttons become unreachable.
 */
const CardWithActions = () => (
  <Card>
    <h3>Frontend summit</h3>
    <p>120 attendees registered.</p>
    <div className="flex-row-gap-2">
      <Button size="sm">Edit event</Button>
      <Button size="sm" variant="base">
        View attendees
      </Button>
    </div>
  </Card>
);

/**
 * Clickable card: the whole card does one thing (apply a template). It is
 * a button: focusable, pressed by Enter and Space. It has no children that
 * are interactive.
 */
const ClickableCard = () => {
  const titleId = useId();
  const detailsId = useId();
  const [template, setTemplate] = useState('');

  return (
    <div className="flex-col-gap-2">
      <Card
        onClick={() => setTemplate('Workshop')}
        aria-labelledby={titleId}
        aria-describedby={detailsId}
      >
        <strong id={titleId}>Workshop template</strong>
        <span id={detailsId}>Sessions, breaks and a sign-up list</span>
      </Card>
      <p role="status">{template && `${template} template applied.`}</p>
    </div>
  );
};

/**
 * Clickable cards that can't be pressed: `disabledWithReason` says why on
 * hover, on keyboard focus and to screen readers; `readOnlyWithReason` works
 * the same. `disabled` and `readOnly` are the silent forms.
 */
const ClickableCardStates = () => {
  const [status, setStatus] = useState('');

  return (
    <div className="flex-col-gap-4">
      <Card
        onClick={() => setStatus('Event copied.')}
        disabledWithReason="Archived events can't be copied"
      >
        <strong>Copy event</strong>
      </Card>
      <Card
        onClick={() => setStatus('Choose a new venue.')}
        readOnlyWithReason="Only organizers can change this"
      >
        <strong>Change venue</strong>
      </Card>
      <p role="status">{status}</p>
    </div>
  );
};

/**
 * One of several options: a CardGroup with `mode="single"` (a ticket type)
 * is a radio group with room for a description. Name the group with
 * `aria-label`, and each card with `aria-labelledby` on its title.
 */
const SingleOption = () => {
  const [ticket, setTicket] = useState('general');
  const generalId = useId();
  const vipId = useId();

  return (
    <CardGroup
      mode="single"
      aria-label="Ticket type"
      value={ticket}
      onChange={setTicket}
      className={classNames(cardColumns, 'grid gap-4')}
    >
      <Card value="general" aria-labelledby={generalId}>
        <strong id={generalId}>General</strong>
        <span>$25 per ticket</span>
      </Card>
      <Card value="vip" aria-labelledby={vipId}>
        <strong id={vipId}>VIP</strong>
        <span>$80 per ticket</span>
      </Card>
    </CardGroup>
  );
};

/**
 * Several options: `mode="multiple"` (add-ons) is a group of checkboxes.
 * Every card needs its own `value`.
 */
const MultipleOptions = () => {
  const [addOns, setAddOns] = useState<string[]>(['workshop']);

  return (
    <CardGroup
      mode="multiple"
      aria-label="Add-ons"
      value={addOns}
      onChange={setAddOns}
      className={classNames(cardColumns, 'grid gap-4')}
    >
      <Card value="workshop">
        <strong>Workshop access</strong>
        <span>Hands-on sessions after the talks</span>
      </Card>
      <Card value="recording">
        <strong>Recordings</strong>
        <span>Every talk, available for a year</span>
      </Card>
    </CardGroup>
  );
};

type Registration = { ticket: string };

/**
 * A required choice in a form: the CardGroup is a form field, so it renders
 * through Controller with `{...field}`, and `label` names it. The required
 * mark and the error come from `rules`; a failed submit focuses the chosen
 * card, else the first.
 */
const TicketForm = () => {
  const [status, setStatus] = useState('');
  const { control, handleSubmit } = useForm<Registration>({
    defaultValues: { ticket: '' },
  });

  const submit = async (registration: Registration) => {
    await register(registration);
    setStatus(`Registered with a ${registration.ticket} ticket`);
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit(submit)}
      className="flex-col-gap-4 items-start"
    >
      <Controller
        name="ticket"
        control={control}
        rules={{ required: 'Choose a ticket' }}
      >
        {({ field }) => (
          <CardGroup
            mode="single"
            label="Ticket"
            {...field}
            className="flex-row-gap-3 flex-wrap"
          >
            <Card value="general">
              <strong>General</strong>
              <span>Every talk and the expo hall</span>
            </Card>
            <Card value="vip">
              <strong>VIP</strong>
              <span>Adds the speaker dinner</span>
            </Card>
          </CardGroup>
        )}
      </Controller>
      <Button type="submit">Register</Button>
      <p role="status">{status}</p>
    </form>
  );
};

/**
 * Options that can't be picked: on a card,
 * `disabledWithReason` says why (sold out); on the group it locks all of them
 * and says why; `readOnlyWithReason` shows a choice that is fixed.
 */
const UnavailableOptions = () => {
  const [seating, setSeating] = useState('standard');
  const [plan, setPlan] = useState('full');
  const [badge, setBadge] = useState('attendee');

  return (
    <div className="flex-col-gap-4">
      <CardGroup
        mode="single"
        aria-label="Seating"
        value={seating}
        onChange={setSeating}
      >
        <Card value="standard">
          <strong>Standard seating</strong>
        </Card>
        <Card value="front" disabledWithReason="Front row is sold out">
          <strong>Front row</strong>
        </Card>
      </CardGroup>
      <CardGroup
        mode="single"
        aria-label="Payment plan"
        value={plan}
        onChange={setPlan}
        disabledWithReason="Payment plans are set by your organizer"
      >
        <Card value="full">
          <strong>Pay in full</strong>
        </Card>
        <Card value="installments">
          <strong>Installments</strong>
        </Card>
      </CardGroup>
      <CardGroup
        mode="single"
        aria-label="Badge"
        value={badge}
        onChange={setBadge}
      >
        <Card value="attendee" readOnlyWithReason="Set by your ticket">
          <strong>Attendee badge</strong>
        </Card>
        <Card value="speaker" readOnlyWithReason="Set by your ticket">
          <strong>Speaker badge</strong>
        </Card>
      </CardGroup>
    </div>
  );
};

/**
 * A single card that toggles on its own (no group): `active` and
 * `onActiveChange`. It is read as a checkbox.
 */
const ToggleCard = () => {
  const [lunch, setLunch] = useState(false);

  return (
    <Card active={lunch} onActiveChange={setLunch} look="filled">
      <strong>Add lunch</strong>
      <span>{lunch ? 'Lunch is included' : 'Lunch is not included'}</span>
    </Card>
  );
};

export default function CardRecipe() {
  return (
    <div className="flex-col-gap-6">
      <ContentCards />
      <Looks />
      <LinkCard />
      <CardWithActions />
      <ClickableCard />
      <ClickableCardStates />
      <SingleOption />
      <MultipleOptions />
      <TicketForm />
      <UnavailableOptions />
      <ToggleCard />
    </div>
  );
}
