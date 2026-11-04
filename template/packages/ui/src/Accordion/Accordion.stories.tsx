import { CircleHelp } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { Section } from '../Section';
import { StoryPage, StorySection } from '../StoryLayout';
import { Tag } from '../Tag';
import { caption, mutedText } from '../StoryStyles.css';

import { Accordion, Collapsible } from '.';

import type { Meta, StoryObj } from '@storybook/react-vite';

export default { title: 'UI/Accordion' } satisfies Meta;
// The page renders its own accordions, so the story takes no args.
type Story = StoryObj;

const questions = [
  {
    value: 'refunds',
    title: 'Can I get a refund?',
    description: 'Until a week before the event',
    answer: 'Yes: ask from your ticket, and the money is back in five days.',
  },
  {
    value: 'transfer',
    title: 'Can I give my ticket away?',
    description: 'To anyone, any time',
    answer: "Change the attendee's name in your ticket.",
  },
  {
    value: 'access',
    title: 'Is the venue accessible?',
    description: 'Step-free access, seating and captions',
    answer: 'Every hall has step-free access and live captions.',
  },
];

const AccordionStories = () => {
  const [multiple, setMultiple] = useState(false);
  const [descriptions, setDescriptions] = useState(true);
  const [inSection, setInSection] = useState(false);
  const [longTitle, setLongTitle] = useState(false);
  const [openLook, setOpenLook] = useState(false);
  const [icons, setIcons] = useState(false);
  const [addOn, setAddOn] = useState(false);
  const [action, setAction] = useState(false);
  const [single, setSingle] = useState('refunds');
  const [several, setSeveral] = useState(['refunds']);
  const [open, setOpen] = useState(false);

  const items = questions.map(({ value, title, description, answer }) => (
    <Accordion.Item
      key={value}
      value={value}
      title={
        longTitle && value === 'refunds'
          ? 'Can I get a refund when the event moves to another date or city?'
          : title
      }
      description={descriptions ? description : undefined}
      leftIcon={icons ? <CircleHelp /> : undefined}
      rightAddOn={addOn && value === 'access' ? <Tag>Updated</Tag> : undefined}
      headerAction={action ? <Button variant="base">Share</Button> : undefined}
    >
      <p>{answer}</p>
    </Accordion.Item>
  ));
  const look = openLook ? 'open' : undefined;
  const accordion = multiple ? (
    <Accordion
      mode="multiple"
      value={several}
      onValueChange={setSeveral}
      look={look}
    >
      {items}
    </Accordion>
  ) : (
    <Accordion value={single} onValueChange={setSingle} look={look}>
      {items}
    </Accordion>
  );

  return (
    <StoryPage>
      <p className={`${caption} ${mutedText}`}>
        Each heading is a button in an h-level heading. Tab reaches each one;
        ArrowDown, ArrowUp, Home and End move between them; Enter and Space open
        and close. Items use Section&apos;s spacing.
      </p>

      <StorySection title="Modes">
        <div className="flex-col-gap-2">
          <p className={`${caption} ${mutedText}`}>
            single (default): one open at a time
          </p>
          <Accordion defaultValue="refunds">{items}</Accordion>
        </div>
        <div className="flex-col-gap-2">
          <p className={`${caption} ${mutedText}`}>multiple: any number open</p>
          <Accordion mode="multiple" defaultValue={['refunds', 'access']}>
            {items}
          </Accordion>
        </div>
      </StorySection>

      <StorySection title="Looks">
        <div className="flex-col-gap-2">
          <p className={`${caption} ${mutedText}`}>
            bordered (default): a frame around the sections
          </p>
          <Accordion defaultValue="refunds">{items}</Accordion>
        </div>
        <div className="flex-col-gap-2">
          <p className={`${caption} ${mutedText}`}>open: dividers only</p>
          <Accordion defaultValue="refunds" look="open">
            {items}
          </Accordion>
        </div>
        <div className="flex-col-gap-2">
          <p className={`${caption} ${mutedText}`}>open Collapsible</p>
          <Collapsible title="Advanced settings" look="open">
            <p>Address: design-systems-meetup</p>
          </Collapsible>
        </div>
      </StorySection>

      <StorySection title="Collapsible">
        <p className={`${caption} ${mutedText}`}>
          One section alone: {open ? 'open' : 'closed'}
        </p>
        <Collapsible
          title="Advanced settings"
          description="The event's address and indexing"
          open={open}
          onOpenChange={setOpen}
        >
          <p>Address: design-systems-meetup</p>
        </Collapsible>
      </StorySection>

      <StorySection title="Features">
        <div className="flex-row-gap-4 flex-wrap">
          <Checkbox checked={multiple} onCheckedChange={setMultiple}>
            Multiple
          </Checkbox>
          <Checkbox checked={descriptions} onCheckedChange={setDescriptions}>
            Descriptions
          </Checkbox>
          <Checkbox checked={inSection} onCheckedChange={setInSection}>
            Inside a Section
          </Checkbox>
          <Checkbox checked={longTitle} onCheckedChange={setLongTitle}>
            Long title
          </Checkbox>
          <Checkbox checked={openLook} onCheckedChange={setOpenLook}>
            Look: open
          </Checkbox>
          <Checkbox checked={icons} onCheckedChange={setIcons}>
            Left icons
          </Checkbox>
          <Checkbox checked={addOn} onCheckedChange={setAddOn}>
            Right add-on
          </Checkbox>
          <Checkbox checked={action} onCheckedChange={setAction}>
            Header action
          </Checkbox>
        </div>
        <p className={`${caption} ${mutedText}`}>
          Open: {multiple ? several.join(', ') || 'none' : single || 'none'}
        </p>
        {inSection ? (
          <Section title="Help" description="Answers to common questions">
            {accordion}
          </Section>
        ) : (
          accordion
        )}
      </StorySection>
    </StoryPage>
  );
};

export const Overview: Story = { render: () => <AccordionStories /> };
