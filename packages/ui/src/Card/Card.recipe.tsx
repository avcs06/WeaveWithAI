/**
 * Card: a bordered container with its own padding and gap, for one item's
 * content, or as a large selectable option.
 */
import { Card, CardGroup } from '@packages/ui/Card';
import React, { useState } from 'react';

/**
 * Content cards: a grid of items (a gallery view). A grid of cards is a list,
 * so render each as an `<li>` with `asChild`. Columns that fit phones:
 * `repeat(auto-fill, minmax(min(100%, 280px), 1fr))`, set in a .css.ts.
 * `look="elevated"` adds a shadow; `look="ghost"` drops the border and fill.
 */
const ContentCards = () => (
  <ul className="grid gap-4">
    <Card asChild>
      <li>
        <strong>Design systems meetup</strong>
        <p>Talks on tokens, theming and docs.</p>
      </li>
    </Card>
    <Card asChild look="elevated">
      <li>
        <strong>Frontend summit</strong>
        <p>A day of talks on the web platform.</p>
      </li>
    </Card>
  </ul>
);

/**
 * Clickable card: the whole card opens something (an event, a template).
 * Passing `onClick` makes it clickable; `disabled` ignores clicks.
 */
const ClickableCard = () => {
  const [opened, setOpened] = useState(0);
  return (
    <Card onClick={() => setOpened((count) => count + 1)}>
      <strong>Blank event</strong>
      <span>Opened {opened} times</span>
    </Card>
  );
};

/**
 * One of several rich options: a CardGroup with `mode="single"` (a ticket
 * type, a template) — like radios with room for a description. Selected cards
 * get an outline.
 */
const SingleOption = () => {
  const [ticket, setTicket] = useState('general');
  return (
    <CardGroup
      mode="single"
      aria-label="Ticket type"
      value={ticket}
      onChange={setTicket}
      className="grid gap-4"
    >
      <Card value="general">
        <strong>General</strong>
        <span>$25 per ticket</span>
      </Card>
      <Card value="vip">
        <strong>VIP</strong>
        <span>$80 per ticket</span>
      </Card>
    </CardGroup>
  );
};

/**
 * Several rich options: `mode="multiple"` (add-ons to include) — like
 * checkboxes. Selected cards get a filled look.
 */
const MultipleOptions = () => {
  const [addOns, setAddOns] = useState<string[]>(['workshop']);
  return (
    <CardGroup
      mode="multiple"
      aria-label="Add-ons"
      value={addOns}
      onChange={setAddOns}
      className="grid gap-4"
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

export default function CardRecipe() {
  return (
    <div className="flex-col-gap-6">
      <ContentCards />
      <ClickableCard />
      <SingleOption />
      <MultipleOptions />
    </div>
  );
}
