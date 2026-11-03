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
 * - A page's title is the app's PageHeader, its only H1. `headingAs` picks
 *   the heading element instead of nesting: `h1` only for a landing page's
 *   headline. Sections inside continue from it.
 * - Titles are one size at every level: don't restyle a nested one.
 * - Stack sections in a SectionGroup, which puts a fixed gap between them.
 *   A Section on its own pads itself above and below. A page's sections
 *   need no group: the page spaces them.
 * - `description` is one muted line about the section; anything longer, or
 *   anything to act on, goes in the content.
 * - `headerAction` holds the section's own actions, like Add, at the
 *   header's end. Actions on one item in the content stay with that item.
 * - `leftIcon` and `rightIcon` are decoration. `leftAddOn` and `rightAddOn`,
 *   like a Tag, are read as part of the heading: no buttons or links.
 */
import { Button } from '@packages/ui/Button';
import { Input } from '@packages/ui/Input';
import { Section, SectionGroup } from '@packages/ui/Section';
import { Switch } from '@packages/ui/Switch';
import { Tag } from '@packages/ui/Tag';
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
 * A landing page's headline, on a page with no PageHeader: the outermost
 * Section takes `headingAs="h1"`, so its sections are `h2`s.
 */
const LandingSection = () => (
  <Section title="Plan your week in minutes" headingAs="h1">
    <Section title="How it works">
      <p>Add your tasks, then drag them into the days.</p>
    </Section>
  </Section>
);

export default function SectionRecipe() {
  return (
    <div className="flex-col-gap-8">
      <LandingSection />
      <SettingsSections />
      <NestedSections />
    </div>
  );
}
