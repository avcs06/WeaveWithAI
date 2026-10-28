/**
 * Tabs: views of one subject that share a place on the page, one shown at a
 * time, like a session's details, speakers and feedback. Each `Tab` child is
 * a tab: `title` and icons in the tab list, children as the panel.
 *
 * When not to use:
 * - Going to another page or route: Link or NextLink, even in a row that
 *   looks like tabs.
 * - Choosing a value in a form: ChipGroup `mode="single"` or RadioGroup.
 * - Steps in order: one view per step, with Back and Next buttons.
 * - Two or three short views the user compares: show them side by side.
 *
 * Pitfalls:
 * - A tab is named by `value`, not `key`: React keeps `key` to itself.
 * - Only the active panel renders: what a panel keeps itself, like scroll
 *   position or a component's state, is lost on switching unless its Tab has
 *   `keepMounted`. State held above Tabs needs no `keepMounted`. A kept
 *   panel renders from the start: use it only where the state matters.
 * - Controlled, `activeTab` changes only through `onTabChange`: pass both.
 *   Without `activeTab`, Tabs starts at the first tab that isn't disabled; an
 *   `activeTab` no tab has shows that tab too. With every tab disabled, only
 *   the tab list shows.
 * - Say why a tab can't be chosen: `disabledWithReason` or
 *   `loadingWithReason`. Without a reason it also leaves the arrow keys'
 *   reach.
 * - `Tabs<'details' | 'speakers'>` types `activeTab` and `onTabChange`; the
 *   `Tab` values aren't checked against it.
 * - The panel fills the height under the tab list and scrolls: give Tabs a
 *   height (`className`) where the page doesn't bound it.
 */
import { Button } from '@packages/ui/Button';
import { Tab, Tabs } from '@packages/ui/Tabs';
import { Tag } from '@packages/ui/Tag';
import { Info, MessageSquare, Users } from 'lucide-react';
import React, { useState } from 'react';

import { panelHeight } from './Tabs.recipe.css';

// Setup: stand-ins for your app's data, not part of the pattern.
const speakers = ['Ada Lovelace', 'Grace Hopper', 'Alan Turing'];

const questions = Array.from(
  { length: 12 },
  (_, index) => `Question ${index + 1}: how does this scale?`,
);

type SessionView = 'details' | 'speakers' | 'feedback';

// Usage: the patterns to copy.
/**
 * Uncontrolled: Tabs keeps the active tab and starts at the first. Icons sit
 * left of the title; `rightAddOn` holds a count.
 */
const SessionTabs = () => (
  <Tabs>
    <Tab value="details" title="Details" leftIcon={<Info />}>
      Opening keynote, Hall A, 9:00.
    </Tab>
    <Tab
      value="speakers"
      title="Speakers"
      leftIcon={<Users />}
      rightAddOn={<Tag size="xs">{speakers.length}</Tag>}
    >
      {speakers.join(', ')}
    </Tab>
    <Tab value="feedback" title="Feedback" rightIcon={<MessageSquare />}>
      No feedback yet.
    </Tab>
  </Tabs>
);

/**
 * Controlled: the active tab lives in the parent, so other controls can
 * change it, and `onTabChange` reports the user's choice.
 */
const ReviewTabs = () => {
  const [view, setView] = useState<SessionView>('details');

  return (
    <div className="flex-col-gap-3 items-start">
      <Button variant="base" onClick={() => setView('feedback')}>
        Review feedback
      </Button>
      <Tabs<SessionView> activeTab={view} onTabChange={setView}>
        <Tab value="details" title="Details">
          Opening keynote, Hall A, 9:00.
        </Tab>
        <Tab value="speakers" title="Speakers">
          {speakers.join(', ')}
        </Tab>
        <Tab value="feedback" title="Feedback">
          4.6 out of 5, from 120 attendees.
        </Tab>
      </Tabs>
    </div>
  );
};

/**
 * Tabs that can't be chosen show why in their tooltip: `disabledWithReason`
 * for a view that doesn't apply yet, `loadingWithReason` for one still
 * loading. A conditional tab keeps its place in the list; `leftAddOn` marks
 * who sees it. `variant="base"` keeps the active tab neutral, beside other
 * colored controls.
 */
const PendingTabs = ({ isOrganizer = true }: { isOrganizer?: boolean }) => (
  <Tabs variant="base">
    <Tab value="details" title="Details">
      Opening keynote, Hall A, 9:00.
    </Tab>
    {isOrganizer && (
      <Tab
        value="check-in"
        title="Check-in"
        leftAddOn={<Tag size="xs">Staff</Tag>}
      >
        312 of 400 checked in.
      </Tab>
    )}
    <Tab
      value="feedback"
      title="Feedback"
      disabledWithReason="Opens after the session ends"
    >
      No feedback yet.
    </Tab>
    <Tab
      value="recording"
      title="Recording"
      loadingWithReason="Processing the recording"
    >
      Recording ready.
    </Tab>
  </Tabs>
);

/**
 * A bounded height: the active panel fills what the tab list leaves and
 * scrolls; the tab list stays put. `keepMounted` keeps the long list on the
 * page, hidden, while Answered shows, so the user returns to their scroll
 * position. Answered renders only while active.
 */
const QuestionTabs = () => (
  <Tabs className={panelHeight}>
    <Tab value="open" title="Open questions" keepMounted>
      <ul className="flex-col-gap-2">
        {questions.map((question) => (
          <li key={question}>{question}</li>
        ))}
      </ul>
    </Tab>
    <Tab value="answered" title="Answered">
      No answered questions yet.
    </Tab>
  </Tabs>
);

export default function TabsRecipe() {
  return (
    <div className="flex-col-gap-6">
      <SessionTabs />
      <ReviewTabs />
      <PendingTabs />
      <QuestionTabs />
    </div>
  );
}
