import React, { type ReactNode, useState } from 'react';

import { Checkbox } from '../Checkbox';
import { Radio, RadioGroup } from '../Radio';
import { StoryPage, StorySection } from '../StoryLayout';

import { cardRecipe } from './Card.recipes.css';

import { Card, CardGroup, type CardProps } from '.';

import type { DisabledState, ReadOnlyState } from '../utils';
import type { Meta, StoryObj } from '@storybook/react-vite';

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

type ToggleCardProps = Pick<CardProps, 'variant' | 'look'> &
  DisabledState &
  ReadOnlyState & { active?: boolean; children: ReactNode };

/** A standalone card holds its own `active`, since a card never keeps it. */
const ToggleCard = ({ active: initial = false, ...props }: ToggleCardProps) => {
  const [active, setActive] = useState(initial);
  return <Card {...props} active={active} onActiveChange={setActive} />;
};

const plans = ['free', 'pro', 'team'];
const extraOptions = ['backups', 'analytics', 'support'];

const Groups = ({
  look,
  disabled,
  reason,
  readOnly,
  readOnlyReason,
}: {
  look: string;
  disabled: boolean;
  reason: boolean;
  readOnly: boolean;
  readOnlyReason: boolean;
}) => {
  const [plan, setPlan] = useState('pro');
  const [extras, setExtras] = useState(['backups']);
  // A group's reason replaces its plain state and reaches every card; a card's
  // own reason wins, like `team` and `support` below.
  const groupState = {
    ...(reason
      ? { disabledWithReason: 'Set by your organizer' }
      : { disabled }),
    ...(readOnlyReason
      ? { readOnlyWithReason: 'Set by your organizer' }
      : { readOnly }),
  };
  return (
    <>
      <div>
        <p style={caption}>mode: single · {plan}</p>
        <CardGroup
          mode="single"
          label="Plan"
          helpText="Billed monthly."
          value={plan}
          onChange={setPlan}
          {...groupState}
          className="grid gap-4"
        >
          {plans.map((value) => (
            <Card
              key={value}
              value={value}
              look={look}
              {...(value === 'team'
                ? { disabledWithReason: 'Talk to sales to switch' }
                : {})}
            >
              <Body title={value} text={`The ${value} plan.`} />
            </Card>
          ))}
        </CardGroup>
      </div>
      <div>
        <p style={caption}>mode: multiple · {extras.join(', ') || 'none'}</p>
        <CardGroup
          mode="multiple"
          label="Extras"
          required
          error={extras.length === 0 ? 'Choose at least one' : undefined}
          value={extras}
          onChange={setExtras}
          {...groupState}
          className="grid gap-4"
        >
          {extraOptions.map((extra) => (
            <Card
              key={extra}
              value={extra}
              look={look}
              {...(extra === 'support'
                ? { disabledWithReason: 'Support is sold out' }
                : {})}
            >
              <Body title={extra} text={`Adds ${extra}.`} />
            </Card>
          ))}
        </CardGroup>
      </div>
    </>
  );
};

const CardStories = () => {
  const [elevated, setElevated] = useState(false);
  const [ghost, setGhost] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [reason, setReason] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [readOnlyReason, setReadOnlyReason] = useState(false);
  const [variant, setVariant] =
    useState<(typeof cardVariants)[number]>('default');
  const [selection, setSelection] =
    useState<(typeof cardSelections)[number]>('outline');

  const look = [elevated && 'elevated', ghost && 'ghost']
    .filter(Boolean)
    .join(' ');

  return (
    <StoryPage>
      <StorySection title="Variants">
        <div style={grid}>
          {cardVariants.map((variant) => (
            <Card key={variant} variant={variant}>
              <Body title={variant} text="Static, no hover state." />
            </Card>
          ))}
          {cardVariants.map((variant) => (
            <Card key={variant} variant={variant} onClick={() => undefined}>
              <Body title={variant} text="A button: hover to see the state." />
            </Card>
          ))}
        </div>
      </StorySection>

      <StorySection title="Looks">
        <div style={grid}>
          {cardVariants.map((variant) => (
            <Card key={variant} variant={variant} look="elevated">
              <Body title={variant} text="Raised with a shadow." />
            </Card>
          ))}
          {cardVariants.map((variant) => (
            <Card key={variant} variant={variant} look="ghost">
              <Body title={variant} text="No border or fill until hovered." />
            </Card>
          ))}
        </div>
      </StorySection>

      {/* A grid of cards is a list: each card renders its `li` child. */}
      <StorySection title="As a list item">
        {/* eslint-disable-next-line jsx-a11y/no-redundant-roles -- Safari drops list semantics once list-style is none. */}
        <ul
          role="list"
          style={{ ...grid, listStyle: 'none', padding: 0, margin: 0 }}
        >
          <Card asChild>
            <li>
              <Body title="First" text="The card is the list item." />
            </li>
          </Card>
          <Card asChild look="elevated">
            <li>
              <Body title="Second" text="Elevated, still a list item." />
            </li>
          </Card>
        </ul>
      </StorySection>

      <StorySection title="Selection">
        {cardSelections.map((selection) => (
          <div key={selection}>
            <p style={caption}>look: {selection}</p>
            <div style={grid}>
              {cardVariants.map((variant) => (
                <ToggleCard
                  key={variant}
                  variant={variant}
                  look={selection}
                  active
                >
                  <Body title={variant} text="Click to toggle." />
                </ToggleCard>
              ))}
            </div>
          </div>
        ))}
      </StorySection>

      <StorySection title="States">
        <div style={grid}>
          <Card onClick={() => undefined}>
            <Body title="Button" text="Hover to see the state." />
          </Card>
          <Card disabled onClick={() => undefined}>
            <Body title="Disabled" text="Ignores clicks." />
          </Card>
          <Card
            disabledWithReason="Upgrade to unlock"
            onClick={() => undefined}
          >
            <Body title="Disabled with a reason" text="Hover for the reason." />
          </Card>
          <Card
            readOnlyWithReason="Only organizers can change this"
            onClick={() => undefined}
          >
            <Body
              title="Read-only with a reason"
              text="Hover for the reason."
            />
          </Card>
          <Card disabledWithReason="Upgrade to unlock">
            <Body
              title="Static, disabled with a reason"
              text="Dimmed; hover for the reason."
            />
          </Card>
          <ToggleCard active disabled>
            <Body title="Active + disabled" text="Can't be changed." />
          </ToggleCard>
          <ToggleCard active disabledWithReason="Upgrade to unlock">
            <Body
              title="Active + disabled with a reason"
              text="Hover for the reason."
            />
          </ToggleCard>
          <ToggleCard active readOnly>
            <Body title="Active + read-only" text="Can't be changed." />
          </ToggleCard>
          <ToggleCard active readOnlyWithReason="Set by your organizer">
            <Body
              title="Active + read-only with a reason"
              text="Hover for the reason."
            />
          </ToggleCard>
        </div>
      </StorySection>

      <StorySection title="Features">
        <div className="flex-row-gap-4 flex-wrap">
          <Checkbox checked={elevated} onCheckedChange={setElevated}>
            Elevated
          </Checkbox>
          <Checkbox checked={ghost} onCheckedChange={setGhost}>
            Ghost
          </Checkbox>
          <Checkbox checked={disabled} onCheckedChange={setDisabled}>
            Disabled
          </Checkbox>
          <Checkbox checked={reason} onCheckedChange={setReason}>
            Disabled reason
          </Checkbox>
          <Checkbox checked={readOnly} onCheckedChange={setReadOnly}>
            Read-only
          </Checkbox>
          <Checkbox
            checked={readOnlyReason}
            onCheckedChange={setReadOnlyReason}
          >
            Read-only reason
          </Checkbox>
        </div>
        <RadioGroup
          label="Variant"
          value={variant}
          onChange={(next) => setVariant(next as typeof variant)}
          className="flex-row-gap-4 flex-wrap"
        >
          {cardVariants.map((option) => (
            <Radio key={option} value={option}>
              {option}
            </Radio>
          ))}
        </RadioGroup>
        <RadioGroup
          label="Selection"
          value={selection}
          onChange={(next) => setSelection(next as typeof selection)}
          className="flex-row-gap-4 flex-wrap"
        >
          {cardSelections.map((option) => (
            <Radio key={option} value={option}>
              {option}
            </Radio>
          ))}
        </RadioGroup>
        <div style={grid}>
          <ToggleCard
            variant={variant}
            look={[look, selection].filter(Boolean).join(' ')}
            // A reason replaces the plain state: they can't be set together.
            {...(reason
              ? { disabledWithReason: 'Upgrade to unlock' }
              : { disabled })}
            {...(readOnlyReason
              ? { readOnlyWithReason: 'Set by your organizer' }
              : { readOnly })}
            active
          >
            <Body title="Toggle" text="Uses the features above." />
          </ToggleCard>
        </div>
      </StorySection>

      {/* Single mode selects like radios with the outline look, multiple mode
          like checkboxes with the filled look. */}
      <StorySection title="Groups">
        <Groups
          look={look}
          disabled={disabled}
          reason={reason}
          readOnly={readOnly}
          readOnlyReason={readOnlyReason}
        />
      </StorySection>
    </StoryPage>
  );
};

export const Overview: Story = { render: () => <CardStories /> };
