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
 * - `headingAs` picks the heading element instead: `h1` for the page's own
 *   title, once per page. Sections inside continue from it.
 * - Titles are one size at every level: don't restyle a nested one.
 * - Section adds no margin around itself: stack sections with the parent's
 *   `flex-col-gap-*`.
 * - `description` is one muted line about the section; anything longer, or
 *   anything to act on, goes in the content.
 * - `headerAction` holds the section's own actions, like Add, at the
 *   header's end. Actions on one item in the content stay with that item.
 * - `leftIcon` and `rightIcon` are decoration. `leftAddOn` and `rightAddOn`,
 *   like a Tag, are read as part of the heading: no buttons or links.
 */
import { Button } from '@packages/ui/Button';
import { Input } from '@packages/ui/Input';
import { Section } from '@packages/ui/Section';
import { Switch } from '@packages/ui/Switch';
import { Tag } from '@packages/ui/Tag';
import { Bell, User } from 'lucide-react';
import React, { useState } from 'react';

// Usage: the patterns to copy.
/**
 * A page of sections: each with its heading and description, then its
 * content. The page stacks them; the last has no description. An icon marks
 * a heading; a Tag after it (`rightAddOn`) shows a state.
 */
const SettingsSections = () => {
  const [name, setName] = useState('Ada Lovelace');
  const [reminders, setReminders] = useState(true);

  return (
    <div className="flex-col-gap-8">
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
    </div>
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
 * The page's own title: the outermost Section takes `headingAs="h1"`, so its
 * sections are `h2`s.
 */
const PageSection = () => (
  <Section title="Settings" headingAs="h1" description="Your account">
    <Section title="Language">
      <p>English (United Kingdom)</p>
    </Section>
  </Section>
);

export default function SectionRecipe() {
  return (
    <div className="flex-col-gap-8">
      <PageSection />
      <SettingsSections />
      <NestedSections />
    </div>
  );
}
