/**
 * Section: a titled part of a page, like a settings page's "Profile" and
 * "Notifications": a heading, an optional muted description, then the
 * content, with the same sizes and spacing on every page.
 *
 * When not to use:
 * - Content the user opens and closes: Collapsible, or an Accordion for
 *   several.
 * - One item among many, like an event in a gallery: Card.
 * - A label for one field or one group of choices: the field's `label`.
 *
 * Pitfalls:
 * - The heading level comes from nesting: a Section is an `h2`, one inside a
 *   Section an `h3`, and so on. Don't wrap `title` in a heading of your own.
 * - A Section is never the page's H1. A page's H1 is its PageHeader's
 *   title. In `web/app/(routes)/(marketing)/page.tsx`, the page at `/`, it is the Hero's
 *   headline.
 * - `headingAs` picks another level when nesting picks the wrong one.
 *   Sections inside continue from it.
 * - Titles are one size at every level: don't restyle a nested one.
 * - Stack sections in a SectionGroup, which puts a fixed gap between them.
 *   A Section on its own pads itself above and below. A page's sections
 *   need no group: the page spaces them.
 * - A Section has no side padding by default, so its heading lines up with
 *   the PageHeader and the text around it. The sides come from what wraps
 *   it: the page's container, a Card or a panel. Where one section needs
 *   sides of its own, give them with `className`, such as `px-4`.
 * - `description` is one muted line about the section; anything longer, or
 *   anything to act on, goes in the content.
 * - `headerAction` holds the section's own actions, like Add, at the
 *   header's end. Actions on one item in the content stay with that item.
 * - `leftIcon` and `rightIcon` are decoration. `leftAddOn` and `rightAddOn`,
 *   like a Tag, are read as part of the heading: no buttons or links.
 */
import { Button } from '@packages/ui/Button';
import { Card } from '@packages/ui/Card';
import { Input } from '@packages/ui/Input';
import { Section, SectionGroup } from '@packages/ui/Section';
import { Switch } from '@packages/ui/Switch';
import { Tag } from '@packages/ui/Tag';
import { Paragraph } from '@packages/ui/Typography';
import { Bell, User } from 'lucide-react';
import React, { useState } from 'react';

// Usage: the patterns to copy.
/**
 * Sections stacked in a SectionGroup: each with its heading and description,
 * then its content; the last has no description. An icon marks a heading; a
 * Tag after it (`rightAddOn`) shows a state.
 */
const SettingsSections = () => {
  const [name, setName] = useState('Ada Lovelace');
  const [reminders, setReminders] = useState(true);

  return (
    <SectionGroup>
      <Section
        title="Profile"
        description="How other attendees see you"
        leftIcon={<User />}
      >
        <Input
          label="Display name"
          autoComplete="name"
          value={name}
          onChange={setName}
        />
      </Section>
      <Section
        title="Notifications"
        description="What we send before your sessions"
        leftIcon={<Bell />}
        rightAddOn={<Tag>{reminders ? 'On' : 'Off'}</Tag>}
      >
        <Switch checked={reminders} onCheckedChange={setReminders}>
          Remind me an hour before
        </Switch>
      </Section>
      <Section title="Danger zone">
        <div>
          <Button variant="danger">Delete account</Button>
        </div>
      </Section>
    </SectionGroup>
  );
};

/**
 * Sections inside a section take the next heading level, `h3` here, at the
 * same size, so the outline stays right without any level to pass. The
 * section's own action goes in `headerAction`.
 */
const NestedSections = () => (
  <Section
    title="Venue"
    description="Where the sessions happen"
    headerAction={<Button variant="base">Add hall</Button>}
  >
    <Section title="Hall A">
      <p>Second floor, 300 seats.</p>
    </Section>
    <Section title="Hall B">
      <p>Ground floor, 120 seats.</p>
    </Section>
  </Section>
);

/**
 * The wrapper gives the sides: a Card's padding here, the page's container
 * on a page. A plain heading, a paragraph and the sections all start on its
 * one left edge.
 */
const SharedLeftEdge = () => (
  <Card>
    <h2 className="font-display text-heading font-heading">
      Frontend summit
    </h2>
    <Paragraph>Two days of talks on the web platform, in Lisbon.</Paragraph>
    <SectionGroup>
      <Section title="Hall A" description="Second floor">
        <Paragraph>300 seats, with a stage and two screens.</Paragraph>
      </Section>
      <Section title="Hall B" description="Ground floor">
        <Paragraph>120 seats, for the workshops.</Paragraph>
      </Section>
    </SectionGroup>
  </Card>
);

export default function SectionRecipe() {
  return (
    <div className="flex-col-gap-8">
      <SettingsSections />
      <NestedSections />
      <SharedLeftEdge />
    </div>
  );
}
