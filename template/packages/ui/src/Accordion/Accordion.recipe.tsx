/**
 * Accordion: Sections whose headings open and close their content, like an
 * FAQ. Each `Accordion.Item` is one section. Collapsible is a single one, like a
 * form's advanced settings.
 *
 * When not to use:
 * - Content every visitor needs: a Section, always open.
 * - Views of one subject the user switches between: Tabs.
 * - Actions or choices from a button: Dropdown.
 * - A short hint next to a control: the control's `tooltip`.
 *
 * Pitfalls:
 * - `mode="single"` (default) closes the open section when another opens;
 *   the open one also closes from its own heading. `mode="multiple"` lets
 *   any number stay open.
 * - Controlled, pass `value` with `onValueChange`: a string in single mode
 *   (`''` for none), an array in multiple mode. Each `Accordion.Item` needs
 *   its own `value`.
 * - A closed section's content unmounts: what it holds itself, like typed
 *   text, is lost. Keep such state above the Accordion.
 * - `title` is the content of the heading's button: no links or buttons in
 *   it. Put actions in the content.
 * - `description` stays visible while closed and describes the button: keep
 *   it to one line.
 * - Heading levels come from nesting, as with Section.
 * - `headerAction` sits beside the heading's button, a control of its own:
 *   pressing it doesn't open or close the section.
 * - `leftIcon` and `rightIcon` are decoration. `leftAddOn` and `rightAddOn`
 *   sit in the heading's button: read with the title, never a button or
 *   link.
 */
import { Accordion, Collapsible } from '@packages/ui/Accordion';
import { Button } from '@packages/ui/Button';
import { Input } from '@packages/ui/Input';
import { Section } from '@packages/ui/Section';
import { Tag } from '@packages/ui/Tag';
import { Accessibility } from 'lucide-react';
import React, { useState } from 'react';

// Usage: the patterns to copy.
/**
 * An FAQ: one answer open at a time, the first open to start
 * (`defaultValue`). Inside a Section, its headings are a level deeper, and
 * `look="open"` drops the frame for dividers alone.
 */
const Faq = () => (
  <Section title="Help" description="Answers to common questions">
    <Accordion defaultValue="refunds" look="open">
      <Accordion.Item value="refunds" title="Can I get a refund?">
        <p>Yes, until a week before the event.</p>
      </Accordion.Item>
      <Accordion.Item value="transfer" title="Can I give my ticket away?">
        <p>Yes: change the attendee's name in your ticket.</p>
      </Accordion.Item>
      <Accordion.Item
        value="access"
        title="Is the venue accessible?"
        description="Step-free access, seating and captions"
        leftIcon={<Accessibility />}
        rightAddOn={<Tag>Updated</Tag>}
      >
        <p>Every hall has step-free access and live captions.</p>
      </Accordion.Item>
    </Accordion>
  </Section>
);

const days = ['day-1', 'day-2', 'day-3'];

/**
 * Several open at once (`mode="multiple"`), controlled so a button opens or
 * closes them all. Each day's export is its `headerAction`, before the
 * chevron.
 */
const Schedule = () => {
  const [open, setOpen] = useState<string[]>(['day-1']);
  const allOpen = open.length === days.length;

  return (
    <div className="flex-col-gap-3">
      <div>
        <Button variant="base" onClick={() => setOpen(allOpen ? [] : days)}>
          {allOpen ? 'Close all days' : 'Open all days'}
        </Button>
      </div>
      <Accordion mode="multiple" value={open} onValueChange={setOpen}>
        {days.map((day, index) => (
          <Accordion.Item
            key={day}
            value={day}
            title={`Day ${index + 1}`}
            headerAction={<Button variant="base">Export</Button>}
          >
            <p>Keynote at 9:00, workshops from 11:00.</p>
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  );
};

/**
 * One section alone: Collapsible, closed to start. With `open` and
 * `onOpenChange` it's controlled, here so the summary says whether it's open.
 */
const AdvancedSettings = () => {
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState('design-systems-meetup');

  return (
    <div className="flex-col-gap-3">
      <Collapsible
        title="Advanced settings"
        description="The event's address and indexing"
        open={open}
        onOpenChange={setOpen}
      >
        <Input
          label="Address"
          autoComplete="off"
          value={slug}
          onChange={setSlug}
        />
      </Collapsible>
      <p role="status">{open ? 'Showing' : 'Hiding'} advanced settings</p>
    </div>
  );
};

export default function AccordionRecipe() {
  return (
    <div className="flex-col-gap-8">
      <Faq />
      <Schedule />
      <AdvancedSettings />
    </div>
  );
}
