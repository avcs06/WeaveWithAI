import { Info, MessageSquare, Users } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { Radio, RadioGroup } from '../Radio';
import { StoryPage, StorySection } from '../StoryLayout';
import { Tag } from '../Tag';

import { tabsRecipe } from './Tabs.recipes.css';

import { Tab, Tabs } from '.';

import type { Meta, StoryObj } from '@storybook/react-vite';

const tabsVariants = Object.keys(
  tabsRecipe.classNames.variants.variant,
) as Array<keyof typeof tabsRecipe.classNames.variants.variant>;

const meta = {
  title: 'UI/Tabs',
  parameters: { controls: { disable: true } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const caption = {
  margin: '0 0 8px',
  fontFamily: 'system-ui',
  fontSize: 13,
} as const;

const tracks = [
  'Keynotes',
  'Design',
  'Engineering',
  'Product',
  'Community',
  'Workshops',
  'Lightning talks',
  'Sponsors',
];

const questions = Array.from(
  { length: 20 },
  (_, index) => `Question ${index + 1}: how does this scale?`,
);

/** State a panel keeps itself, to show what `keepMounted` preserves. */
const Counter = () => {
  const [count, setCount] = useState(0);
  return (
    <Button variant="base" onClick={() => setCount(count + 1)}>
      Clicked {count} times
    </Button>
  );
};

const TabsStories = () => {
  const [icons, setIcons] = useState(true);
  const [addOns, setAddOns] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [reason, setReason] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingReason, setLoadingReason] = useState(false);
  const [keepMounted, setKeepMounted] = useState(false);
  const [variant, setVariant] =
    useState<(typeof tabsVariants)[number]>('default');
  const [view, setView] = useState('details');

  return (
    <StoryPage>
      <StorySection title="Variants">
        {tabsVariants.map((variant) => (
          <div key={variant}>
            <p style={caption}>variant: {variant}</p>
            <Tabs variant={variant}>
              <Tab value="details" title="Details">
                Opening keynote, Hall A, 9:00.
              </Tab>
              <Tab value="speakers" title="Speakers">
                Ada Lovelace, Grace Hopper.
              </Tab>
              <Tab value="feedback" title="Feedback">
                No feedback yet.
              </Tab>
            </Tabs>
          </div>
        ))}
      </StorySection>

      <StorySection title="Icons and add-ons">
        <Tabs>
          <Tab value="details" title="Details" leftIcon={<Info />}>
            Left icon.
          </Tab>
          <Tab value="feedback" title="Feedback" rightIcon={<MessageSquare />}>
            Right icon.
          </Tab>
          <Tab
            value="check-in"
            title="Check-in"
            leftAddOn={<Tag size="xs">Staff</Tag>}
          >
            Left add-on.
          </Tab>
          <Tab
            value="speakers"
            title="Speakers"
            rightAddOn={<Tag size="xs">12</Tag>}
          >
            Right add-on.
          </Tab>
        </Tabs>
      </StorySection>

      {/* A disabled tab with a reason stays reachable by arrow keys and shows
          why; without one the arrow keys skip it. */}
      <StorySection title="States">
        <Tabs>
          <Tab value="details" title="Details">
            Opening keynote, Hall A, 9:00.
          </Tab>
          <Tab
            value="feedback"
            title="Disabled with a reason"
            disabledWithReason="Opens after the session ends"
          >
            No feedback yet.
          </Tab>
          <Tab value="notes" title="Disabled" disabled>
            Notes.
          </Tab>
          <Tab
            value="recording"
            title="Loading with a reason"
            loadingWithReason="Processing the recording"
          >
            Recording ready.
          </Tab>
          <Tab value="files" title="Loading" loading>
            Files.
          </Tab>
        </Tabs>
      </StorySection>

      {/* Count in both tabs, switch away and back: only the kept one keeps
          its count. */}
      <StorySection title="Keep mounted">
        <Tabs>
          <Tab value="kept" title="Kept" keepMounted>
            <Counter />
          </Tab>
          <Tab value="unmounted" title="Unmounted">
            <Counter />
          </Tab>
        </Tabs>
      </StorySection>

      <StorySection title="Controlled">
        <p style={caption}>activeTab: {view}</p>
        <div className="flex-row-gap-2">
          <Button variant="base" onClick={() => setView('details')}>
            Details
          </Button>
          <Button variant="base" onClick={() => setView('feedback')}>
            Feedback
          </Button>
        </div>
        <Tabs activeTab={view} onTabChange={setView}>
          <Tab value="details" title="Details">
            Opening keynote, Hall A, 9:00.
          </Tab>
          <Tab value="speakers" title="Speakers">
            Ada Lovelace, Grace Hopper.
          </Tab>
          <Tab value="feedback" title="Feedback">
            4.6 out of 5, from 120 attendees.
          </Tab>
        </Tabs>
      </StorySection>

      <StorySection title="Many tabs">
        <div style={{ maxWidth: 320 }}>
          <Tabs>
            {tracks.map((track) => (
              <Tab key={track} value={track} title={track}>
                {track} sessions.
              </Tab>
            ))}
          </Tabs>
        </div>
      </StorySection>

      <StorySection title="Bounded height">
        <div style={{ height: 240, display: 'flex', flexDirection: 'column' }}>
          <Tabs className="flex-fill-y">
            <Tab value="open" title="Open questions">
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
        </div>
      </StorySection>

      <StorySection title="Features">
        <div className="flex-row-gap-4 flex-wrap">
          <Checkbox checked={icons} onCheckedChange={setIcons}>
            Icons
          </Checkbox>
          <Checkbox checked={addOns} onCheckedChange={setAddOns}>
            Add-ons
          </Checkbox>
          <Checkbox checked={disabled} onCheckedChange={setDisabled}>
            Disabled tab
          </Checkbox>
          <Checkbox checked={reason} onCheckedChange={setReason}>
            Disabled reason
          </Checkbox>
          <Checkbox checked={loading} onCheckedChange={setLoading}>
            Loading tab
          </Checkbox>
          <Checkbox checked={loadingReason} onCheckedChange={setLoadingReason}>
            Loading reason
          </Checkbox>
          <Checkbox checked={keepMounted} onCheckedChange={setKeepMounted}>
            Keep mounted
          </Checkbox>
        </div>
        <RadioGroup
          label="Variant"
          value={variant}
          onChange={(next) => setVariant(next as typeof variant)}
          className="flex-row-gap-4 flex-wrap"
        >
          {tabsVariants.map((option) => (
            <Radio key={option} value={option}>
              {option}
            </Radio>
          ))}
        </RadioGroup>
        <Tabs variant={variant}>
          <Tab
            value="details"
            title="Details"
            leftIcon={icons ? <Info /> : undefined}
            keepMounted={keepMounted}
          >
            <Counter />
          </Tab>
          <Tab
            value="speakers"
            title="Speakers"
            leftIcon={icons ? <Users /> : undefined}
            rightAddOn={addOns ? <Tag size="xs">12</Tag> : undefined}
            // A reason replaces the plain state: they can't be set together.
            {...(reason
              ? { disabledWithReason: 'Speakers are announced on May 1' }
              : { disabled })}
          >
            Ada Lovelace, Grace Hopper.
          </Tab>
          <Tab
            value="feedback"
            title="Feedback"
            rightIcon={icons ? <MessageSquare /> : undefined}
            {...(loadingReason
              ? { loadingWithReason: 'Loading the feedback' }
              : { loading })}
          >
            4.6 out of 5, from 120 attendees.
          </Tab>
        </Tabs>
      </StorySection>
    </StoryPage>
  );
};

export const Overview: Story = { render: () => <TabsStories /> };
