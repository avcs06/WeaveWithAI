/**
 * Typography: the text elements of a page, styled by the design system:
 * `Paragraph`, `Caption`, `List` with `ListItem`, `DescriptionList` with
 * `DescriptionTerm` and `DescriptionDetails`, `Quote`, `Code`, `CodeBlock`,
 * `Kbd`, `Mark`, `Separator` and `Time`.
 * - `color` (default, muted, primary or a status) replaces the color the
 *   text inherits. Every element but `Separator` takes it.
 * - `font` (ui, display or mono) replaces the font the text inherits.
 *   `Code`, `CodeBlock` and `Kbd` are always mono, and `Separator` has no
 *   text, so these four don't take it.
 * - Size and line height are fixed: the caption's for `Caption`, the
 *   surrounding text's for `Code`, `Kbd`, `Mark` and `Time`, and the body's
 *   for the others.
 *
 * When not to use:
 * - A heading: a `Section`'s title is the heading.
 * - A line between groups: a gap between them is usually enough. Use a
 *   `Separator` only where the groups need a visible line.
 * - A list of records: a `CardList` or a `Table`. A `List` is for text.
 * - Rows people sort, filter or compare across: a `Table`.
 * - A number people read and compare: a `Numeral`, inside the text element.
 *
 * Pitfalls:
 * - Spacing between paragraphs and lists comes from their parent's gap,
 *   such as `flex-col-gap-3`: the elements have no margins.
 * - `ordered` only when the order means something, such as steps.
 * - A `CodeBlock` takes the code as a string: keep its line breaks in a
 *   template literal.
 */
import { Numeral } from '@packages/ui/Numeral';
import {
  Caption,
  Code,
  CodeBlock,
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
  Kbd,
  List,
  ListItem,
  Mark,
  Paragraph,
  Quote,
  Separator,
  Time,
} from '@packages/ui/Typography';
import React from 'react';

// Setup: stand-ins for your app's data, not part of the pattern.
const record = [
  { label: 'Created', value: '2 Nov 2026' },
  { label: 'Status', value: 'Active' },
  { label: 'Owner', value: 'Alex Morgan' },
];
const setup = `pnpm install
pnpm dev`;

// Usage: the patterns to copy.
/** Body text: paragraphs in a column, spaced by the parent's gap. */
const Text = () => (
  <div className="flex-col-gap-3">
    <Paragraph>
      A paragraph of body text, which wraps to the width of its column.
    </Paragraph>
    <Paragraph color="muted">A muted paragraph for a detail.</Paragraph>
  </div>
);

/** A small muted line on the text above it, such as when a record was made. */
const Note = () => (
  <div className="flex-col-gap-1">
    <Paragraph>Spring launch plan</Paragraph>
    <Caption>Updated 2 Nov 2026</Caption>
  </div>
);

/** Points in any order, bulleted. An item may hold a list of its own. */
const Points = () => (
  <List>
    <ListItem>First point</ListItem>
    <ListItem>
      Second point
      <List>
        <ListItem>A point under it</ListItem>
      </List>
    </ListItem>
  </List>
);

/** Steps the reader follows in order, numbered. */
const Steps = () => (
  <List ordered>
    <ListItem>Fill in the form</ListItem>
    <ListItem>Check the details</ListItem>
    <ListItem>Confirm</ListItem>
  </List>
);

/** A record's fields as label and value pairs, one pair a row. */
const Fields = () => (
  <DescriptionList>
    {record.map(({ label, value }) => (
      <div key={label}>
        <DescriptionTerm>{label}</DescriptionTerm>
        <DescriptionDetails>{value}</DescriptionDetails>
      </div>
    ))}
    <div>
      <DescriptionTerm>Items</DescriptionTerm>
      <DescriptionDetails>
        <Numeral>1,300</Numeral>
      </DescriptionDetails>
    </div>
  </DescriptionList>
);

/** Someone's words, with who said them. Without `source`, just the quote. */
const Testimonial = () => (
  <Quote source="Alex Morgan" font="display">
    Someone's words, as they said them.
  </Quote>
);

/** Code in a sentence, and lines of code on their own. */
const Commands = () => (
  <div className="flex-col-gap-3">
    <Paragraph>
      Start the app with <Code>pnpm dev</Code> once the packages are in.
    </Paragraph>
    <CodeBlock>{setup}</CodeBlock>
  </div>
);

/** A shortcut named in a sentence. */
const Shortcut = () => (
  <Paragraph>
    Press <Kbd>Ctrl K</Kbd> to search.
  </Paragraph>
);

/** A search result's line, with the words that match the search marked. */
const SearchResult = () => (
  <Paragraph>
    Spring <Mark>launch</Mark> plan
  </Paragraph>
);

/**
 * A line between two groups of text that need one, and between items in a
 * row, where the row stretches it to its height.
 */
const Groups = () => (
  <div className="flex-col-gap-3">
    <Paragraph>Delivery by courier, in 3 to 5 days.</Paragraph>
    <Separator />
    <div className="flex-row-gap-3">
      <Paragraph>2 items</Paragraph>
      <Separator orientation="vertical" />
      <Paragraph>Paid by card</Paragraph>
    </div>
  </div>
);

/**
 * A record's date or moment, from the ISO value it keeps: one format across
 * the app. `withTime` adds the time of day to a moment.
 */
const Dates = () => (
  <Paragraph>
    Placed <Time value="2026-11-07" />, shipped{' '}
    <Time value="2026-11-09T10:30:00.000Z" withTime />.
  </Paragraph>
);

export default function TypographyRecipe() {
  return (
    <div className="flex-col-gap-6">
      <Text />
      <Note />
      <Points />
      <Steps />
      <Fields />
      <Testimonial />
      <Commands />
      <Shortcut />
      <SearchResult />
      <Groups />
      <Dates />
    </div>
  );
}
