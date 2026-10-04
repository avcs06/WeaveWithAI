import React, { type ReactNode, useState } from 'react';

import { Card, CardGroup } from './Card';
import { cardRecipe } from './Card.recipes.css';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { StoryPage, StorySection } from '../StoryLayout';

const cardVariants = Object.keys(
  cardRecipe.classNames.variants.variant,
) as Array<keyof typeof cardRecipe.classNames.variants.variant>;
const cardSelections = Object.keys(
  cardRecipe.classNames.variants.selection,
) as Array<keyof typeof cardRecipe.classNames.variants.selection>;

const meta = {
  title: 'UI/Card',
  component: Card,
  subcomponents: { CardGroup },
  parameters: { controls: { disable: true } },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(200px, 1fr))',
  gap: 16,
} as const;
const caption = {
  margin: '0 0 8px',
  fontFamily: 'system-ui',
  fontSize: 13,
} as const;

const Body = ({ title, text }: { title: string; text: string }) => (
  <>
    <strong>{title}</strong>
    <span>{text}</span>
  </>
);

const Groups = ({ elevated = false }: { elevated?: boolean }) => {
  const [plan, setPlan] = useState('pro');
  const [extras, setExtras] = useState(['backups']);
  return (
    <>
      <div>
        <p style={caption}>mode: single · {plan}</p>
        <CardGroup
          mode="single"
          value={plan}
          onChange={setPlan}
          aria-label="Plan"
          style={grid}
        >
          {['free', 'pro', 'team'].map((value) => (
            <Card key={value} value={value} elevated={elevated}>
              <Body title={value} text={`The ${value} plan.`} />
            </Card>
          ))}
        </CardGroup>
      </div>
      <div>
        <p style={caption}>mode: multiple · {extras.join(', ')}</p>
        <CardGroup
          mode="multiple"
          value={extras}
          onChange={setExtras}
          aria-label="Extras"
          style={grid}
        >
          {['backups', 'analytics', 'support'].map((extra) => (
            <Card key={extra} value={extra} elevated={elevated}>
              <Body title={extra} text={`Adds ${extra}.`} />
            </Card>
          ))}
        </CardGroup>
      </div>
    </>
  );
};

export const Overview: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="Variants">
        <div style={grid}>
          {cardVariants.map((variant) => (
            <Card key={variant} variant={variant}>
              <Body title={variant} text="Hover to see the state." />
            </Card>
          ))}
        </div>
      </StorySection>

      <StorySection title="Elevated">
        <div style={grid}>
          {cardVariants.map((variant) => (
            <Card key={variant} variant={variant} elevated>
              <Body title={variant} text="Raised with a shadow." />
            </Card>
          ))}
        </div>
      </StorySection>

      {/* Passing `active`, `defaultActive` or `onActiveChange` makes a card
          toggle; `selection` sets how it looks when active. */}
      <StorySection title="Selection">
        {cardSelections.map((selection) => (
          <div key={selection}>
            <p style={caption}>selection: {selection}</p>
            <div style={grid}>
              {cardVariants.map((variant) => (
                <Card
                  key={variant}
                  variant={variant}
                  selection={selection}
                  defaultActive
                >
                  <Body title={variant} text="Click to toggle." />
                </Card>
              ))}
            </div>
          </div>
        ))}
      </StorySection>

      <StorySection title="States">
        <div style={grid}>
          <Card clickable onClick={() => undefined}>
            <Body title="Clickable" text="Hover to see the state." />
          </Card>
          <Card disabled onClick={() => undefined}>
            <Body title="Disabled" text="Ignores clicks." />
          </Card>
          <Card defaultActive disabled>
            <Body title="Active + disabled" text="Can't be changed." />
          </Card>
        </div>
      </StorySection>

      {/* Single mode selects like radios with the outline look, multiple mode
          like checkboxes with the filled look. */}
      <StorySection title="Groups">
        <Groups />
      </StorySection>

      <StorySection title="Elevated groups">
        <Groups elevated />
      </StorySection>
    </StoryPage>
  ),
};
