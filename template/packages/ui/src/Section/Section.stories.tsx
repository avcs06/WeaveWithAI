import { Bell, Settings } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { StoryPage, StorySection } from '../StoryLayout';
import { Tag } from '../Tag';
import { caption, mutedText, outlinedBox } from '../StoryStyles.css';

import { Section } from '.';

import type { Meta, StoryObj } from '@storybook/react-vite';

export default { title: 'UI/Section' } satisfies Meta;
// The page renders its own sections, so the story takes no args.
type Story = StoryObj;

const SectionStories = () => {
  const [description, setDescription] = useState(true);
  const [content, setContent] = useState(true);
  const [nested, setNested] = useState(true);
  const [longTitle, setLongTitle] = useState(false);
  const [boxes, setBoxes] = useState(true);
  const [pageTitle, setPageTitle] = useState(false);
  const [leftIcon, setLeftIcon] = useState(false);
  const [rightIcon, setRightIcon] = useState(false);
  const [leftAddOn, setLeftAddOn] = useState(false);
  const [rightAddOn, setRightAddOn] = useState(false);
  const [action, setAction] = useState(false);

  const box = boxes ? outlinedBox : undefined;

  return (
    <StoryPage>
      <p className={`${caption} ${mutedText}`}>
        The same sizes and spacing everywhere: 20px padding, 4px from heading to
        description, 20px from header to content, 16px between content blocks. A
        section inside a section takes the next heading level at the same size.
      </p>

      <StorySection title="Sections">
        <div className="flex-col-gap-4">
          <Section
            title="Profile"
            description="How other attendees see you"
            className={box}
          >
            <p>Ada Lovelace, organizer.</p>
          </Section>
          <Section
            title="Icon and add-on"
            description="leftIcon, then rightAddOn after the title"
            leftIcon={<Bell />}
            rightAddOn={<Tag>On</Tag>}
            className={box}
          />
          <Section
            title="Header action"
            description="headerAction, at the header's end"
            headerAction={<Button variant="base">Add hall</Button>}
            className={box}
          />
          <Section title="Title only" className={box}>
            <p>No description: the content follows the heading.</p>
          </Section>
          <Section
            title="No content"
            description="Only a header"
            className={box}
          />
          <Section
            title="Page title"
            headingAs="h1"
            description="headingAs: h1, the page's own title"
            className={box}
          />
          <Section
            title="Venue"
            description="Nested sections are a level deeper"
            className={box}
          >
            <Section title="Hall A" className={box}>
              <p>Second floor, 300 seats.</p>
            </Section>
            <Section title="Hall B" className={box}>
              <p>Ground floor, 120 seats.</p>
            </Section>
          </Section>
        </div>
      </StorySection>

      <StorySection title="Features">
        <div className="flex-row-gap-4 flex-wrap">
          <Checkbox checked={description} onCheckedChange={setDescription}>
            Description
          </Checkbox>
          <Checkbox checked={content} onCheckedChange={setContent}>
            Content
          </Checkbox>
          <Checkbox checked={nested} onCheckedChange={setNested}>
            Nested sections
          </Checkbox>
          <Checkbox checked={longTitle} onCheckedChange={setLongTitle}>
            Long title
          </Checkbox>
          <Checkbox checked={boxes} onCheckedChange={setBoxes}>
            Show boxes
          </Checkbox>
          <Checkbox checked={pageTitle} onCheckedChange={setPageTitle}>
            headingAs: h1
          </Checkbox>
          <Checkbox checked={leftIcon} onCheckedChange={setLeftIcon}>
            Left icon
          </Checkbox>
          <Checkbox checked={rightIcon} onCheckedChange={setRightIcon}>
            Right icon
          </Checkbox>
          <Checkbox checked={leftAddOn} onCheckedChange={setLeftAddOn}>
            Left add-on
          </Checkbox>
          <Checkbox checked={rightAddOn} onCheckedChange={setRightAddOn}>
            Right add-on
          </Checkbox>
          <Checkbox checked={action} onCheckedChange={setAction}>
            Header action
          </Checkbox>
        </div>
        <Section
          title={
            longTitle
              ? 'Notifications we send before, during and after each of the sessions you saved'
              : 'Notifications'
          }
          description={
            description ? 'What we send before your sessions' : undefined
          }
          headingAs={pageTitle ? 'h1' : undefined}
          leftIcon={leftIcon ? <Bell /> : undefined}
          rightIcon={rightIcon ? <Settings /> : undefined}
          leftAddOn={leftAddOn ? <Tag>New</Tag> : undefined}
          rightAddOn={rightAddOn ? <Tag>On</Tag> : undefined}
          headerAction={
            action ? <Button variant="base">Edit</Button> : undefined
          }
          className={box}
        >
          {content && (
            <>
              <p>Reminders go out an hour before each session.</p>
              <div>
                <Button variant="base">Change reminders</Button>
              </div>
            </>
          )}
          {nested && (
            <Section title="Email" description="To your work address">
              <p>A summary every morning.</p>
            </Section>
          )}
        </Section>
      </StorySection>
    </StoryPage>
  );
};

export const Overview: Story = { render: () => <SectionStories /> };
