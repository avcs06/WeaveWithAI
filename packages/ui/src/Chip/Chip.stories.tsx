import { Check, ChevronDown, Plus } from 'lucide-react';
import React, { type ReactNode, useState } from 'react';

import { Checkbox } from '../Checkbox';
import { Radio, RadioGroup } from '../Radio';
import { StoryPage, StorySection } from '../StoryLayout';

import { chipRecipe } from './Chip.recipes.css';

import { Chip, ChipGroup, type ChipProps } from '.';

import type { DisabledProps } from '../utils';
import type { Meta, StoryObj } from '@storybook/react-vite';

const chipVariants = Object.keys(
  chipRecipe.classNames.variants.variant,
) as Array<keyof typeof chipRecipe.classNames.variants.variant>;
const chipSelections = Object.keys(
  chipRecipe.classNames.variants.selection,
) as Array<keyof typeof chipRecipe.classNames.variants.selection>;
const chipSizes = Object.keys(chipRecipe.classNames.variants.size) as Array<
  keyof typeof chipRecipe.classNames.variants.size
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

type ToggleChipProps = Pick<
  ChipProps,
  | 'variant'
  | 'size'
  | 'look'
  | 'tooltip'
  | 'leftIcon'
  | 'rightIcon'
  | 'leftAddOn'
  | 'rightAddOn'
> &
  DisabledProps & {
    active?: boolean;
    children: ReactNode;
  };

/** A standalone chip holds its own `active`, since a chip never keeps it. */
const ToggleChip = ({ active: initial = false, ...props }: ToggleChipProps) => {
  const [active, setActive] = useState(initial);
  return <Chip {...props} active={active} onActiveChange={setActive} />;
};

const options = ['Engineering', 'Design', 'Sales', 'Support'];

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
  const [single, setSingle] = useState('Design');
  const [multiple, setMultiple] = useState(['Engineering']);
  // A reason replaces the plain state on the group, and reaches every chip
  // in it; a chip's own reason wins.
  const groupState = {
    ...(reason
      ? { disabledWithReason: 'Locked while the plan is pending' }
      : { disabled }),
    ...(readOnlyReason
      ? { readOnlyWithReason: 'Set by your workspace' }
      : { readOnly }),
  };
  return (
    <>
      <div>
        <p style={caption}>mode: single · {single}</p>
        <ChipGroup
          mode="single"
          label="Team"
          helpText="Where you work."
          value={single}
          onChange={setSingle}
          {...groupState}
          className="flex-row-gap-2 flex-wrap"
        >
          {options.map((option) => (
            <Chip
              key={option}
              value={option}
              look={look}
              disabled={option === 'Support'}
            >
              {option}
            </Chip>
          ))}
        </ChipGroup>
      </div>
      <div>
        <p style={caption}>mode: multiple · {multiple.join(', ') || 'none'}</p>
        <ChipGroup
          mode="multiple"
          label="Teams"
          required
          error={multiple.length === 0 ? 'Choose at least one' : undefined}
          value={multiple}
          onChange={setMultiple}
          {...groupState}
          className="flex-row-gap-2 flex-wrap"
        >
          {options.map((option) => (
            <Chip key={option} value={option} look={`${look} rounded`}>
              {option}
            </Chip>
          ))}
        </ChipGroup>
      </div>
      <div>
        <p style={caption}>mode: multiple · read-only, with a reason</p>
        <ChipGroup
          mode="multiple"
          label="Teams"
          readOnlyWithReason="Set by your workspace"
          value={['Design', 'Sales']}
          onChange={() => undefined}
          className="flex-row-gap-2 flex-wrap"
        >
          {options.map((option) => (
            <Chip key={option} value={option} variant="base">
              {option}
            </Chip>
          ))}
        </ChipGroup>
      </div>
      <div>
        <p style={caption}>mode: single · disabled, with a reason</p>
        <ChipGroup
          label="Team"
          disabledWithReason="Locked while the plan is pending"
          value="Sales"
          onChange={() => undefined}
          className="flex-row-gap-2 flex-wrap"
        >
          {options.map((option) => (
            <Chip key={option} value={option}>
              {option}
            </Chip>
          ))}
        </ChipGroup>
      </div>
    </>
  );
};

const ChipStories = () => {
  const [ghost, setGhost] = useState(false);
  const [rounded, setRounded] = useState(false);
  const [icon, setIcon] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [reason, setReason] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [readOnlyReason, setReadOnlyReason] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingReason, setLoadingReason] = useState(false);
  const [disableWhileLoading, setDisableWhileLoading] = useState(true);
  const [tooltip, setTooltip] = useState(false);
  const [variant, setVariant] =
    useState<(typeof chipVariants)[number]>('default');
  const [selection, setSelection] =
    useState<(typeof chipSelections)[number]>('outline');
  const [size, setSize] = useState<(typeof chipSizes)[number]>('sm');

  const look = [ghost && 'ghost', rounded && 'rounded']
    .filter(Boolean)
    .join(' ');

  return (
    <StoryPage>
      {/* Standalone chips toggle on click; the look `outline` or `filled`
          sets the active look. */}
      <StorySection title="Variants">
        {chipVariants.flatMap((variant) =>
          chipSelections.map((selection) => (
            <div key={`${variant}-${selection}`}>
              <p style={caption}>
                variant: {variant} · look: {selection}
              </p>
              <div style={row}>
                <ToggleChip variant={variant} look={selection}>
                  Default
                </ToggleChip>
                <ToggleChip variant={variant} look={selection} active>
                  Active
                </ToggleChip>
                <ToggleChip variant={variant} look={selection} disabled>
                  Disabled
                </ToggleChip>
                <ToggleChip variant={variant} look={selection} active disabled>
                  Active + disabled
                </ToggleChip>
                <ToggleChip variant={variant} look={selection} active readOnly>
                  Active + read-only
                </ToggleChip>
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
              <ToggleChip size={size} leftIcon={<Plus />}>
                Add filter
              </ToggleChip>
              <ToggleChip size={size} active leftIcon={<Check />}>
                Outline
              </ToggleChip>
              <ToggleChip size={size} look="filled" active leftIcon={<Check />}>
                Filled
              </ToggleChip>
            </div>
          </div>
        ))}
      </StorySection>

      <StorySection title="Looks">
        <div style={row}>
          <ToggleChip active>Default</ToggleChip>
          <ToggleChip look="rounded" active>
            Rounded
          </ToggleChip>
          <ToggleChip look="ghost">Ghost</ToggleChip>
          <ToggleChip look="ghost rounded" active>
            Ghost, rounded
          </ToggleChip>
        </div>
      </StorySection>

      <StorySection title="States">
        <div style={row}>
          <ToggleChip disabledWithReason="Early bird sales have ended">
            Disabled with a reason
          </ToggleChip>
          <ToggleChip readOnlyWithReason="Set by the organizer" active>
            Read-only with a reason
          </ToggleChip>
          <ToggleChip loading>Loading</ToggleChip>
          <ToggleChip loadingWithReason="Loading the venues">
            Loading with a reason
          </ToggleChip>
        </div>
      </StorySection>

      <StorySection title="Icons">
        <div style={row}>
          <ToggleChip leftIcon={<Plus />}>Add filter</ToggleChip>
          <ToggleChip rightIcon={<ChevronDown />}>Status</ToggleChip>
          <ToggleChip look="rounded" active leftIcon={<Check />}>
            Selected
          </ToggleChip>
          <ToggleChip
            active
            tooltip="Events with at least one ticket left"
            rightAddOn={<span aria-hidden>12</span>}
          >
            With a count
            <span className="sr-only"> (12 tickets)</span>
          </ToggleChip>
        </div>
      </StorySection>

      <StorySection title="Features">
        <div className="flex-row-gap-4 flex-wrap">
          <Checkbox checked={ghost} onCheckedChange={setGhost}>
            Ghost
          </Checkbox>
          <Checkbox checked={rounded} onCheckedChange={setRounded}>
            Rounded
          </Checkbox>
          <Checkbox checked={icon} onCheckedChange={setIcon}>
            Left icon
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
          <Checkbox checked={loading} onCheckedChange={setLoading}>
            Loading
          </Checkbox>
          <Checkbox checked={loadingReason} onCheckedChange={setLoadingReason}>
            Loading reason
          </Checkbox>
          <Checkbox
            checked={disableWhileLoading}
            onCheckedChange={setDisableWhileLoading}
          >
            disableWhileLoading
          </Checkbox>
          <Checkbox checked={tooltip} onCheckedChange={setTooltip}>
            Tooltip
          </Checkbox>
        </div>
        <RadioGroup
          label="Variant"
          value={variant}
          onChange={(next) => setVariant(next as typeof variant)}
          className="flex-row-gap-4 flex-wrap"
        >
          {chipVariants.map((option) => (
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
          {chipSelections.map((option) => (
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
          {chipSizes.map((option) => (
            <Radio key={option} value={option}>
              {option}
            </Radio>
          ))}
        </RadioGroup>
        <div style={row}>
          <ToggleChip
            variant={variant}
            size={size}
            look={[look, selection].filter(Boolean).join(' ')}
            leftIcon={icon ? <Plus /> : undefined}
            tooltip={tooltip ? 'Events in this category' : undefined}
            disableWhileLoading={disableWhileLoading}
            // A reason replaces the plain state: they can't be set together.
            {...(reason
              ? { disabledWithReason: 'Early bird sales have ended' }
              : { disabled })}
            {...(readOnlyReason
              ? { readOnlyWithReason: 'Set by the organizer' }
              : { readOnly })}
            {...(loadingReason
              ? { loadingWithReason: 'Loading the venues' }
              : { loading })}
            active
          >
            Toggle
          </ToggleChip>
        </div>
      </StorySection>

      {/* In a group, the mode sets the active look: single outlines, multiple
          fills. */}
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

export const Overview: Story = { render: () => <ChipStories /> };
