/**
 * ScrollArea and FlexScrollArea: a box that scrolls its own content, with
 * scrollbars that show while the content overflows and sit over its edge.
 * ScrollArea is for a box with its own height (`h-*` or `max-h-*` on it).
 * FlexScrollArea is for a flex column, like a side panel or a dialog body:
 * it takes its content's height until the column is full, then scrolls,
 * while the header and footer stay put.
 *
 * When not to use:
 * - The page itself: let the document scroll.
 * - A Table, a Select's or Dropdown's menu, or a Popover: they scroll their
 *   own content.
 * - A single line that doesn't fit: Truncate it.
 *
 * Pitfalls:
 * - Name it (`aria-label` or `aria-labelledby`) when its content has nothing
 *   to Tab to, like plain text: it then takes focus, so keyboard users can
 *   scroll it.
 * - FlexScrollArea needs a flex column parent with a bounded height (fixed,
 *   or filling its own parent); otherwise it grows with its content and
 *   never scrolls.
 * - `className` and `style` go on the outer box; `ref` reaches the element
 *   that scrolls, for its scroll position or a scroll listener.
 * - Don't add `overflow-*` classes to it or its parent: it scrolls itself.
 */
import { Button } from '@packages/ui/Button';
import { Checkbox } from '@packages/ui/Checkbox';
import { FlexScrollArea, ScrollArea } from '@packages/ui/ScrollArea';
import { Section } from '@packages/ui/Section';
import { Tag } from '@packages/ui/Tag';
import React, { useId, useRef, useState } from 'react';

import { listHeight, panelHeight, textHeight } from './ScrollArea.recipe.css';

// Setup: stand-ins for your app's data and requests, not part of the pattern.
const attendees = Array.from({ length: 24 }, (_, index) => ({
  id: `attendee-${index + 1}`,
  name: `Attendee ${index + 1}`,
}));

const sessions = [
  { time: '09:00', title: 'Opening keynote', room: 'Main hall' },
  { time: '10:30', title: 'Design systems at scale', room: 'Room 2' },
  { time: '12:00', title: 'Lunch', room: 'Terrace' },
  { time: '13:30', title: 'Accessible forms workshop', room: 'Room 4' },
  { time: '15:00', title: 'Panel: shipping faster', room: 'Main hall' },
  { time: '16:30', title: 'Closing drinks', room: 'Terrace' },
];

const tags = [
  'Design',
  'Engineering',
  'Product',
  'Community',
  'Accessibility',
  'Research',
  'Leadership',
];

// Usage: the patterns to copy.
/**
 * A list in a box of fixed height. The checkboxes take focus, so the list
 * scrolls as Tab moves through them and needs no name.
 */
const AttendeeList = () => {
  const [checkedIn, setCheckedIn] = useState<string[]>([]);

  return (
    <ScrollArea className={listHeight}>
      <div className="flex-col-gap-2 p-2">
        {attendees.map((attendee) => (
          <Checkbox
            key={attendee.id}
            checked={checkedIn.includes(attendee.id)}
            onCheckedChange={(checked) =>
              setCheckedIn(
                checked
                  ? [...checkedIn, attendee.id]
                  : checkedIn.filter((id) => id !== attendee.id),
              )
            }
          >
            {attendee.name}
          </Checkbox>
        ))}
      </div>
    </ScrollArea>
  );
};

/**
 * Text with nothing to Tab to: `aria-labelledby` names the region, which
 * then takes focus so the arrow keys scroll it. `max-h-*` lets short text
 * take less room.
 */
const CodeOfConduct = () => {
  const headingId = useId();

  return (
    <Section title="Code of conduct" titleId={headingId}>
      <ScrollArea
        orientation="vertical"
        aria-labelledby={headingId}
        className={textHeight}
      >
        <div className="flex-col-gap-2 pr-3">
          <p>Be kind to everyone at the event, in person and online.</p>
          <p>Harassment of any kind is not tolerated, by anyone.</p>
          <p>Report a problem to any staff member wearing a red lanyard.</p>
          <p>Organizers may remove anyone who breaks these rules.</p>
        </div>
      </ScrollArea>
    </Section>
  );
};

/**
 * A panel with a fixed header and footer: FlexScrollArea takes the room left
 * in the column and scrolls only once the agenda needs more. Vertical only
 * (`orientation="vertical"`): the wide tag row inside scrolls sideways in its
 * own ScrollArea with `orientation="horizontal"`.
 */
const AgendaPanel = () => {
  const listRef = useRef<HTMLDivElement>(null);

  return (
    <Section title="Day one" className={panelHeight}>
      <ScrollArea orientation="horizontal" aria-label="Topics">
        <div className="flex-row-gap-2 pb-3">
          {tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </div>
      </ScrollArea>
      <FlexScrollArea ref={listRef} orientation="vertical">
        <ul className="flex-col-gap-3 pr-3">
          {sessions.map((session) => (
            <li key={session.time} className="flex-col-gap-0.5">
              <strong>
                {session.time} {session.title}
              </strong>
              <span>{session.room}</span>
            </li>
          ))}
        </ul>
      </FlexScrollArea>
      <Button
        variant="base"
        onClick={() => listRef.current?.scrollTo({ top: 0 })}
      >
        Back to the first session
      </Button>
    </Section>
  );
};

export default function ScrollAreaRecipe() {
  return (
    <div className="flex-col-gap-6">
      <AttendeeList />
      <CodeOfConduct />
      <AgendaPanel />
    </div>
  );
}
