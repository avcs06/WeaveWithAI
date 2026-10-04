import { Check, ChevronDown, Plus } from 'lucide-react';
import React, { type ReactNode, useState } from 'react';

import { Chip, ChipGroup } from './Chip';
import { chipRecipe } from './Chip.recipes.css';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { StoryPage, StorySection } from '../StoryLayout';

const chipVariants = Object.keys(
  chipRecipe.classNames.variants.variant,
) as Array<keyof typeof chipRecipe.classNames.variants.variant>;
const chipSelections = Object.keys(
  chipRecipe.classNames.variants.selection,
) as Array<keyof typeof chipRecipe.classNames.variants.selection>;
const chipSizes = Object.keys(chipRecipe.classNames.variants.size) as Array<
  keyof typeof chipRecipe.classNames.variants.size
>;
const chipRadii = Object.keys(chipRecipe.classNames.variants.radius) as Array<
  keyof typeof chipRecipe.classNames.variants.radius
>;

const meta = {
  title: 'UI/Chip',
  component: Chip,
  subcomponents: { ChipGroup },
  parameters: { controls: { disable: true } },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

const row = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  alignItems: 'center',
} as const;
const caption = {
  margin: '0 0 8px',
  fontFamily: 'system-ui',
  fontSize: 13,
} as const;

const options = ['Engineering', 'Design', 'Sales', 'Support'];

const Groups = () => {
  const [single, setSingle] = useState('Design');
  const [multiple, setMultiple] = useState(['Engineering']);
  return (
    <>
      <div>
        <p style={caption}>mode: single · {single}</p>
        <ChipGroup
          mode="single"
          value={single}
          onChange={setSingle}
          aria-label="Team"
        >
          {options.map((option) => (
            <Chip key={option} value={option} disabled={option === 'Support'}>
              {option}
            </Chip>
          ))}
        </ChipGroup>
      </div>
      <div>
        <p style={caption}>mode: multiple · {multiple.join(', ')}</p>
        <ChipGroup
          mode="multiple"
          value={multiple}
          onChange={setMultiple}
          aria-label="Teams"
        >
          {options.map((option) => (
            <Chip key={option} value={option} radius="rounded">
              {option}
            </Chip>
          ))}
        </ChipGroup>
      </div>
      <div>
        <p style={caption}>mode: multiple · disabled, uncontrolled</p>
        <ChipGroup
          mode="multiple"
          defaultValue={['Design', 'Sales']}
          disabled
          aria-label="Teams, read-only"
        >
          {options.map((option) => (
            <Chip key={option} value={option} variant="base">
              {option}
            </Chip>
          ))}
        </ChipGroup>
      </div>
    </>
  );
};

export const Overview: Story = {
  render: () => (
    <StoryPage>
      {/* Standalone chips toggle on click; `selection` sets the active look. */}
      <StorySection title="Variants">
        {chipVariants.flatMap((variant) =>
          chipSelections.map((selection) => (
            <div key={`${variant}-${selection}`}>
              <p style={caption}>
                variant: {variant} · selection: {selection}
              </p>
              <div style={row}>
                <Chip variant={variant} selection={selection}>
                  Default
                </Chip>
                <Chip variant={variant} selection={selection} defaultActive>
                  Active
                </Chip>
                <Chip variant={variant} selection={selection} disabled>
                  Disabled
                </Chip>
                <Chip
                  variant={variant}
                  selection={selection}
                  defaultActive
                  disabled
                >
                  Active + disabled
                </Chip>
              </div>
            </div>
          )),
        )}
      </StorySection>

      {/* Button's sizes: sm 32px, md 40px. */}
      <StorySection title="Sizes">
        {chipSizes.map((size) => (
          <div key={size}>
            <p style={caption}>size: {size}</p>
            <div style={row}>
              <Chip size={size} leftIcon={<Plus />}>
                Add filter
              </Chip>
              <Chip size={size} defaultActive leftIcon={<Check />}>
                Outline
              </Chip>
              <Chip
                size={size}
                selection="filled"
                defaultActive
                leftIcon={<Check />}
              >
                Filled
              </Chip>
            </div>
          </div>
        ))}
      </StorySection>

      <StorySection title="Radius">
        <div style={row}>
          {chipRadii.map((radius) => (
            <Chip key={radius} radius={radius} defaultActive>
              {radius}
            </Chip>
          ))}
        </div>
      </StorySection>

      <StorySection title="Icons">
        <div style={row}>
          <Chip leftIcon={<Plus />}>Add filter</Chip>
          <Chip rightIcon={<ChevronDown />}>Status</Chip>
          <Chip radius="rounded" defaultActive leftIcon={<Check />}>
            Selected
          </Chip>
        </div>
      </StorySection>

      {/* In a group, the mode sets the active look: single outlines, multiple
          fills. */}
      <StorySection title="Groups">
        <Groups />
      </StorySection>
    </StoryPage>
  ),
};
