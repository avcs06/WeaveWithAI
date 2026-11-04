import React, { useState } from 'react';

import { Checkbox } from '../Checkbox';
import { StoryPage, StorySection } from '../StoryLayout';

import { radioRecipe } from './Radio.recipes.css';

import { Radio, RadioGroup, type RadioProps } from '.';

import type { DisabledState } from '../utils';
import type { Meta, StoryObj } from '@storybook/react-vite';

const radioVariants = Object.keys(
  radioRecipe.classNames.variants.variant,
) as Array<keyof typeof radioRecipe.classNames.variants.variant>;
const radioSizes = Object.keys(radioRecipe.classNames.variants.size) as Array<
  keyof typeof radioRecipe.classNames.variants.size
>;

const meta = {
  title: 'UI/Radio',
  parameters: { controls: { disable: true } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const row = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 16,
  alignItems: 'center',
} as const;
const caption = {
  margin: '0 0 8px',
  fontFamily: 'system-ui',
  fontSize: 13,
} as const;

type ChoiceRadioProps = Pick<
  RadioProps,
  'variant' | 'size' | 'hint' | 'tooltip'
> &
  DisabledState &
  ({ children: string } | { 'aria-label': string });

/** A Radio needs a group: this one holds its own value, chosen or not. */
const ChoiceRadio = ({
  checked = false,
  ...props
}: ChoiceRadioProps & { checked?: boolean }) => {
  const [value, setValue] = useState(checked ? 'on' : '');
  return (
    <RadioGroup
      aria-label="Choice"
      value={value}
      onChange={setValue}
      className="flex-row-gap-4"
    >
      <Radio {...props} value="on" />
    </RadioGroup>
  );
};

const tickets = ['General admission', 'VIP', 'Student'];

const Groups = () => {
  const [ticket, setTicket] = useState('');
  return (
    <>
      <RadioGroup
        label="Ticket"
        helpText="You can change it until the day before."
        required
        error={ticket === '' ? 'Choose a ticket' : undefined}
        value={ticket}
        onChange={setTicket}
        className="flex-col-gap-2"
      >
        {tickets.map((name) => (
          <Radio key={name} value={name}>
            {name}
          </Radio>
        ))}
        <Radio value="Speaker" disabledWithReason="Speakers are invited only">
          Speaker
        </Radio>
      </RadioGroup>
      <RadioGroup
        label="Meal"
        disabledWithReason="Meals open a week before the event"
        value="Standard"
        onChange={() => undefined}
        className="flex-row-gap-4 flex-wrap"
      >
        <Radio value="Standard">Standard</Radio>
        <Radio value="Vegetarian">Vegetarian</Radio>
      </RadioGroup>
      <RadioGroup
        label="Seating"
        readOnlyWithReason="Seats are assigned by the organizer"
        value="Assigned"
        onChange={() => undefined}
        className="flex-row-gap-4 flex-wrap"
      >
        <Radio value="Assigned">Assigned seat</Radio>
        <Radio value="Open">Open seating</Radio>
      </RadioGroup>
    </>
  );
};

const RadioStories = () => {
  const [disabled, setDisabled] = useState(false);
  const [reason, setReason] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [readOnlyReason, setReadOnlyReason] = useState(false);
  const [hint, setHint] = useState(false);
  const [tooltip, setTooltip] = useState(false);
  const [longLabel, setLongLabel] = useState(false);
  const [variant, setVariant] =
    useState<(typeof radioVariants)[number]>('default');
  const [size, setSize] = useState<(typeof radioSizes)[number]>('sm');
  const [live, setLive] = useState('General admission');

  return (
    <StoryPage>
      <StorySection title="Variants">
        {radioVariants.map((variant) => (
          <div key={variant}>
            <p style={caption}>variant: {variant}</p>
            <div style={row}>
              <ChoiceRadio variant={variant}>Unchecked</ChoiceRadio>
              <ChoiceRadio variant={variant} checked>
                Checked
              </ChoiceRadio>
              <ChoiceRadio variant={variant} disabled>
                Disabled
              </ChoiceRadio>
              <ChoiceRadio variant={variant} checked disabled>
                Checked + disabled
              </ChoiceRadio>
            </div>
          </div>
        ))}
      </StorySection>

      <StorySection title="Sizes">
        {radioSizes.map((size) => (
          <div key={size}>
            <p style={caption}>size: {size}</p>
            <div style={row}>
              <ChoiceRadio size={size}>Unchecked</ChoiceRadio>
              <ChoiceRadio size={size} checked>
                Checked
              </ChoiceRadio>
            </div>
          </div>
        ))}
      </StorySection>

      <StorySection title="States">
        <div style={row}>
          <ChoiceRadio disabledWithReason="VIP is sold out">
            Disabled with a reason
          </ChoiceRadio>
          <ChoiceRadio hint="Includes the speaker dinner">
            With a hint
          </ChoiceRadio>
          <ChoiceRadio tooltip="Sent the day before">
            With a tooltip
          </ChoiceRadio>
          <ChoiceRadio aria-label="Select row 3" />
        </div>
        {/* The label stays on one line and truncates, with a tooltip. */}
        <div style={{ maxWidth: 220 }}>
          <ChoiceRadio checked>
            Pick up my badge at the front desk before the keynote
          </ChoiceRadio>
        </div>
      </StorySection>

      <StorySection title="Groups">
        <Groups />
      </StorySection>

      <StorySection title="Features">
        <div className="flex-row-gap-4 flex-wrap">
          <Checkbox checked={disabled} onCheckedChange={setDisabled}>
            Disabled
          </Checkbox>
          <Checkbox checked={reason} onCheckedChange={setReason}>
            Disabled reason
          </Checkbox>
          <Checkbox checked={readOnly} onCheckedChange={setReadOnly}>
            Group read-only
          </Checkbox>
          <Checkbox
            checked={readOnlyReason}
            onCheckedChange={setReadOnlyReason}
          >
            Group read-only reason
          </Checkbox>
          <Checkbox checked={hint} onCheckedChange={setHint}>
            Hint
          </Checkbox>
          <Checkbox checked={tooltip} onCheckedChange={setTooltip}>
            Tooltip
          </Checkbox>
          <Checkbox checked={longLabel} onCheckedChange={setLongLabel}>
            Long label
          </Checkbox>
        </div>
        <RadioGroup
          label="Variant"
          value={variant}
          onChange={(next) => setVariant(next as typeof variant)}
          className="flex-row-gap-4 flex-wrap"
        >
          {radioVariants.map((option) => (
            <Radio key={option} value={option}>
              {option}
            </Radio>
          ))}
        </RadioGroup>
        <RadioGroup
          label="Size"
          value={size}
          onChange={(next) => setSize(next as typeof size)}
          className="flex-row-gap-4 flex-wrap"
        >
          {radioSizes.map((option) => (
            <Radio key={option} value={option}>
              {option}
            </Radio>
          ))}
        </RadioGroup>
        <div style={{ maxWidth: 260 }}>
          <RadioGroup
            label="Ticket"
            value={live}
            onChange={setLive}
            className="flex-col-gap-2"
            {...(readOnlyReason
              ? { readOnlyWithReason: 'Seats are assigned by the organizer' }
              : { readOnly })}
          >
            {tickets.map((name) => (
              <Radio
                key={name}
                value={name}
                variant={variant}
                size={size}
                hint={hint ? 'Includes the speaker dinner' : undefined}
                tooltip={tooltip ? 'Sent the day before' : undefined}
                // A reason replaces the plain state: they can't be set together.
                {...(reason
                  ? { disabledWithReason: 'VIP is sold out' }
                  : { disabled })}
              >
                {longLabel
                  ? `${name}, with the badge picked up at the front desk`
                  : name}
              </Radio>
            ))}
          </RadioGroup>
        </div>
      </StorySection>
    </StoryPage>
  );
};

export const Overview: Story = { render: () => <RadioStories /> };
