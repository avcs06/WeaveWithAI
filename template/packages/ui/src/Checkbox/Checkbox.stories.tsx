import React, { useState } from 'react';

import { Radio, RadioGroup } from '../Radio';
import { StoryPage, StorySection } from '../StoryLayout';

import { checkboxRecipe } from './Checkbox.recipes.css';

import { Checkbox, CheckboxGroup, type CheckboxProps } from '.';

import type { DisabledState, ReadOnlyState } from '../utils';
import type { Meta, StoryObj } from '@storybook/react-vite';

const checkboxVariants = Object.keys(
  checkboxRecipe.classNames.variants.variant,
) as Array<keyof typeof checkboxRecipe.classNames.variants.variant>;
const checkboxSizes = Object.keys(
  checkboxRecipe.classNames.variants.size,
) as Array<keyof typeof checkboxRecipe.classNames.variants.size>;

const meta = {
  title: 'UI/Checkbox',
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

type ToggleCheckboxProps = Pick<
  CheckboxProps,
  'variant' | 'size' | 'hint' | 'tooltip' | 'required'
> &
  DisabledState &
  ReadOnlyState & {
    checked?: boolean | 'indeterminate';
  } & ({ children: string } | { 'aria-label': string });

/** Holds its own `checked`, since a checkbox on its own is controlled. */
const ToggleCheckbox = ({
  checked: initial = false,
  ...props
}: ToggleCheckboxProps) => {
  const [checked, setChecked] = useState(initial);
  return <Checkbox {...props} checked={checked} onCheckedChange={setChecked} />;
};

const sessions = ['Keynote', 'Design systems', 'Accessible forms'];

const Groups = () => {
  const [chosen, setChosen] = useState(['Keynote']);
  return (
    <>
      <CheckboxGroup
        label="Sessions"
        helpText="Pick the ones you'll attend."
        required
        error={chosen.length === 0 ? 'Pick at least one' : undefined}
        value={chosen}
        onChange={setChosen}
        className="flex-col-gap-2"
      >
        {sessions.map((session) => (
          <Checkbox key={session} value={session}>
            {session}
          </Checkbox>
        ))}
        <Checkbox value="Lunch" disabledWithReason="Lunch is sold out">
          Lunch
        </Checkbox>
      </CheckboxGroup>
      <CheckboxGroup
        label="Tracks"
        disabledWithReason="Registration closed on May 1"
        value={['Design']}
        onChange={() => undefined}
        className="flex-row-gap-4 flex-wrap"
      >
        <Checkbox value="Design">Design</Checkbox>
        <Checkbox value="Engineering">Engineering</Checkbox>
      </CheckboxGroup>
      <CheckboxGroup
        label="Badge"
        readOnlyWithReason="Set by your organization"
        value={['Photo']}
        onChange={() => undefined}
        className="flex-row-gap-4 flex-wrap"
      >
        <Checkbox value="Photo">Photo</Checkbox>
        <Checkbox value="Company">Company</Checkbox>
      </CheckboxGroup>
    </>
  );
};

const CheckboxStories = () => {
  const [disabled, setDisabled] = useState(false);
  const [reason, setReason] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [readOnlyReason, setReadOnlyReason] = useState(false);
  const [hint, setHint] = useState(false);
  const [tooltip, setTooltip] = useState(false);
  const [required, setRequired] = useState(false);
  const [longLabel, setLongLabel] = useState(false);
  const [variant, setVariant] =
    useState<(typeof checkboxVariants)[number]>('default');
  const [size, setSize] = useState<(typeof checkboxSizes)[number]>('sm');

  return (
    <StoryPage>
      <StorySection title="Variants">
        {checkboxVariants.map((variant) => (
          <div key={variant}>
            <p style={caption}>variant: {variant}</p>
            <div style={row}>
              <ToggleCheckbox variant={variant}>Unchecked</ToggleCheckbox>
              <ToggleCheckbox variant={variant} checked>
                Checked
              </ToggleCheckbox>
              <ToggleCheckbox variant={variant} checked="indeterminate">
                Indeterminate
              </ToggleCheckbox>
              <ToggleCheckbox variant={variant} disabled>
                Disabled
              </ToggleCheckbox>
              <ToggleCheckbox variant={variant} checked disabled>
                Checked + disabled
              </ToggleCheckbox>
              <ToggleCheckbox variant={variant} checked readOnly>
                Checked + read-only
              </ToggleCheckbox>
            </div>
          </div>
        ))}
      </StorySection>

      <StorySection title="Sizes">
        {checkboxSizes.map((size) => (
          <div key={size}>
            <p style={caption}>size: {size}</p>
            <div style={row}>
              <ToggleCheckbox size={size}>Unchecked</ToggleCheckbox>
              <ToggleCheckbox size={size} checked>
                Checked
              </ToggleCheckbox>
              <ToggleCheckbox size={size} checked="indeterminate">
                Indeterminate
              </ToggleCheckbox>
            </div>
          </div>
        ))}
      </StorySection>

      <StorySection title="States">
        <div style={row}>
          <ToggleCheckbox disabledWithReason="Lunch is sold out">
            Disabled with a reason
          </ToggleCheckbox>
          <ToggleCheckbox checked readOnlyWithReason="Set by your organization">
            Read-only with a reason
          </ToggleCheckbox>
          <ToggleCheckbox required hint="Be kind, and report harassment">
            Required, with a hint
          </ToggleCheckbox>
          <ToggleCheckbox tooltip="Sent the day before">
            With a tooltip
          </ToggleCheckbox>
          <ToggleCheckbox aria-label="Select row 3" />
        </div>
        {/* One line, truncated, with a tooltip. */}
        <div style={{ maxWidth: 220 }}>
          <ToggleCheckbox checked>
            I agree to the code of conduct and the photo policy
          </ToggleCheckbox>
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
          <Checkbox checked={required} onCheckedChange={setRequired}>
            Required
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
          {checkboxVariants.map((option) => (
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
          {checkboxSizes.map((option) => (
            <Radio key={option} value={option}>
              {option}
            </Radio>
          ))}
        </RadioGroup>
        <div style={{ maxWidth: 240 }}>
          <ToggleCheckbox
            variant={variant}
            size={size}
            required={required}
            hint={hint ? 'Be kind, and report harassment' : undefined}
            tooltip={tooltip ? 'Sent the day before' : undefined}
            // A reason replaces the plain state: they can't be set together.
            {...(reason
              ? { disabledWithReason: 'Lunch is sold out' }
              : { disabled })}
            {...(readOnlyReason
              ? { readOnlyWithReason: 'Set by your organization' }
              : { readOnly })}
          >
            {longLabel
              ? 'I agree to the code of conduct and the photo policy'
              : 'I agree to the code of conduct'}
          </ToggleCheckbox>
        </div>
      </StorySection>
    </StoryPage>
  );
};

export const Overview: Story = { render: () => <CheckboxStories /> };
