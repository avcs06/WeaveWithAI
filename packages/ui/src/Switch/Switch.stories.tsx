import React, { useState } from 'react';

import { Checkbox } from '../Checkbox';
import { Radio, RadioGroup } from '../Radio';
import { StoryPage, StorySection } from '../StoryLayout';

import { switchRecipe } from './Switch.recipes.css';

import { Switch, type SwitchProps } from '.';

import type { DisabledState, ReadOnlyState } from '../utils';
import type { Meta, StoryObj } from '@storybook/react-vite';

const switchVariants = Object.keys(
  switchRecipe.classNames.variants.variant,
) as Array<keyof typeof switchRecipe.classNames.variants.variant>;
const switchSizes = Object.keys(switchRecipe.classNames.variants.size) as Array<
  keyof typeof switchRecipe.classNames.variants.size
>;

const meta = {
  title: 'UI/Switch',
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

type ToggleSwitchProps = Pick<
  SwitchProps,
  'variant' | 'size' | 'hint' | 'tooltip'
> &
  DisabledState &
  ReadOnlyState & {
    checked?: boolean;
  } & ({ children: string } | { 'aria-label': string });

/** Holds its own `checked`, since a switch is always controlled. */
const ToggleSwitch = ({
  checked: initial = false,
  ...props
}: ToggleSwitchProps) => {
  const [checked, setChecked] = useState(initial);
  return <Switch {...props} checked={checked} onCheckedChange={setChecked} />;
};

const SwitchStories = () => {
  const [disabled, setDisabled] = useState(false);
  const [reason, setReason] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [readOnlyReason, setReadOnlyReason] = useState(false);
  const [hint, setHint] = useState(false);
  const [tooltip, setTooltip] = useState(false);
  const [longLabel, setLongLabel] = useState(false);
  const [variant, setVariant] =
    useState<(typeof switchVariants)[number]>('default');
  const [size, setSize] = useState<(typeof switchSizes)[number]>('sm');

  return (
    <StoryPage>
      <StorySection title="Variants">
        {switchVariants.map((variant) => (
          <div key={variant}>
            <p style={caption}>variant: {variant}</p>
            <div style={row}>
              <ToggleSwitch variant={variant}>Off</ToggleSwitch>
              <ToggleSwitch variant={variant} checked>
                On
              </ToggleSwitch>
              <ToggleSwitch variant={variant} disabled>
                Disabled
              </ToggleSwitch>
              <ToggleSwitch variant={variant} checked disabled>
                On + disabled
              </ToggleSwitch>
              <ToggleSwitch variant={variant} checked readOnly>
                On + read-only
              </ToggleSwitch>
            </div>
          </div>
        ))}
      </StorySection>

      <StorySection title="Sizes">
        {switchSizes.map((size) => (
          <div key={size}>
            <p style={caption}>size: {size}</p>
            <div style={row}>
              <ToggleSwitch size={size}>Off</ToggleSwitch>
              <ToggleSwitch size={size} checked>
                On
              </ToggleSwitch>
            </div>
          </div>
        ))}
      </StorySection>

      <StorySection title="States">
        <div style={row}>
          <ToggleSwitch disabledWithReason="Refunds close when the event starts">
            Disabled with a reason
          </ToggleSwitch>
          <ToggleSwitch checked readOnlyWithReason="Set by your organization">
            Read-only with a reason
          </ToggleSwitch>
          <ToggleSwitch hint="A day before each session you saved">
            With a hint
          </ToggleSwitch>
          <ToggleSwitch tooltip="Sent to the address on your ticket">
            With a tooltip
          </ToggleSwitch>
          <ToggleSwitch aria-label="Dark preview" />
        </div>
        {/* The label stays on one line and truncates, with a tooltip. */}
        <div style={{ maxWidth: 220 }}>
          <ToggleSwitch checked>
            Email me a reminder a day before each session I saved
          </ToggleSwitch>
        </div>
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
            Read-only
          </Checkbox>
          <Checkbox
            checked={readOnlyReason}
            onCheckedChange={setReadOnlyReason}
          >
            Read-only reason
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
          {switchVariants.map((option) => (
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
          {switchSizes.map((option) => (
            <Radio key={option} value={option}>
              {option}
            </Radio>
          ))}
        </RadioGroup>
        <div style={{ maxWidth: 240 }}>
          <ToggleSwitch
            variant={variant}
            size={size}
            hint={hint ? 'A day before each session you saved' : undefined}
            tooltip={tooltip ? 'Sent to the address on your ticket' : undefined}
            // A reason replaces the plain state: they can't be set together.
            {...(reason
              ? { disabledWithReason: 'Refunds close when the event starts' }
              : { disabled })}
            {...(readOnlyReason
              ? { readOnlyWithReason: 'Set by your organization' }
              : { readOnly })}
          >
            {longLabel
              ? 'Email me a reminder a day before each session I saved'
              : 'Email reminders'}
          </ToggleSwitch>
        </div>
      </StorySection>
    </StoryPage>
  );
};

export const Overview: Story = { render: () => <SwitchStories /> };
