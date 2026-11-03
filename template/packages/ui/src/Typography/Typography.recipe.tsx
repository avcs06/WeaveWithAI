/**
 * Typography: the text elements of a page, styled by the design system:
 * `Paragraph`, `List` with `ListItem`, `DescriptionList` with
 * `DescriptionTerm` and `DescriptionDetails`, `Quote`, `Code` and
 * `CodeBlock`. Each takes `font` (ui, display or mono) and `color` (default,
 * muted, primary or a status) over what it inherits; its size and line height
 * stay the body's.
 *
 * When not to use:
 * - A heading: a `Section`'s title is the heading.
 * - A list of records or cards people scan and open: lay them out as a grid
 *   or a column of `Card`s, or a `Table`; a `List` is for text.
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
  Code,
  CodeBlock,
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
  List,
  ListItem,
  Paragraph,
  Quote,
} from '@packages/ui/Typography';
import React from 'react';

// Setup: stand-ins for your app's data, not part of the pattern.
const order = [
  { label: 'Placed', value: '2 Nov 2026' },
  { label: 'Delivery', value: 'Courier, 3 to 5 days' },
  { label: 'Paid with', value: 'UPI' },
];
const setup = `pnpm install
pnpm dev`;

// Usage: the patterns to copy.
/** Body text: paragraphs in a column, spaced by the parent's gap. */
const Text = () => (
  <div className="flex-col-gap-3">
    <Paragraph>
      Each piece is thrown and glazed by hand, so no two are quite alike.
    </Paragraph>
    <Paragraph color="muted">Orders ship within three working days.</Paragraph>
  </div>
);

/** Points in any order, bulleted. An item may hold a list of its own. */
const Points = () => (
  <List>
    <ListItem>Free pickup from the studio</ListItem>
    <ListItem>
      Courier anywhere in India
      <List>
        <ListItem>Tracked from dispatch</ListItem>
      </List>
    </ListItem>
  </List>
);

/** Steps the reader follows in order, numbered. */
const Steps = () => (
  <List ordered>
    <ListItem>Choose a glaze</ListItem>
    <ListItem>Pick a size</ListItem>
    <ListItem>Check out</ListItem>
  </List>
);

/** A record's fields as label and value pairs, one pair a row. */
const Fields = () => (
  <DescriptionList>
    {order.map(({ label, value }) => (
      <div key={label}>
        <DescriptionTerm>{label}</DescriptionTerm>
        <DescriptionDetails>{value}</DescriptionDetails>
      </div>
    ))}
    <div>
      <DescriptionTerm>Total</DescriptionTerm>
      <DescriptionDetails>
        <Numeral>₹1,300</Numeral>
      </DescriptionDetails>
    </div>
  </DescriptionList>
);

/** Someone's words, with who said them. Without `source`, just the quote. */
const Testimonial = () => (
  <Quote source="Priya, Bengaluru" font="display">
    The mug keeps my chai warm, and the glaze is lovelier than the photos.
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

export default function TypographyRecipe() {
  return (
    <div className="flex-col-gap-6">
      <Text />
      <Points />
      <Steps />
      <Fields />
      <Testimonial />
      <Commands />
    </div>
  );
}
