import { ArrowRight, Plus, Settings, Trash2 } from 'lucide-react';
import React, {
  type ComponentPropsWithRef,
  type ReactNode,
  useState,
} from 'react';

import { Checkbox } from '../Checkbox';
import { Link, type LinkProps } from '../Link';
import { StoryPage, StorySection } from '../StoryLayout';
import { caption, mutedText } from '../StoryStyles.css';

import { Button, type ButtonProps, IconButton, PlainButton } from '.';
import { buttonRecipe } from './Button.recipes.css';

import type { Meta, StoryObj } from '@storybook/react-vite';

const variants = Object.keys(buttonRecipe.classNames.variants.variant) as Array<
  NonNullable<ButtonProps['variant']>
>;
const iconSizes = ['xs', 'sm', 'md'] as const;

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: { controls: { disable: true } },
} satisfies Meta<typeof Button>;

export default meta;
// The page renders its own buttons, so the story takes no args.
type Story = StoryObj;

// Stands in for a link component like Next.js's `Link`, which doesn't load in
// Storybook. Link handles `disabled` by dropping its `href`.
const StoryLink = (props: Extract<LinkProps, { href: string }>) => (
  <Link {...props} />
);

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex-col-gap-2">
    <p className={`${caption} ${mutedText}`}>{label}</p>
    <div className="flex-row-gap-2 items-center flex-wrap">{children}</div>
  </div>
);

const ButtonStories = () => {
  const [rounded, setRounded] = useState(false);
  const [ghost, setGhost] = useState(false);
  const [leftIcon, setLeftIcon] = useState(true);
  const [rightIcon, setRightIcon] = useState(false);
  const [leftAddOn, setLeftAddOn] = useState(false);
  const [rightAddOn, setRightAddOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingReason, setLoadingReason] = useState(false);
  const [disableWhileLoading, setDisableWhileLoading] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [reason, setReason] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [readOnlyReason, setReadOnlyReason] = useState(false);
  const [tooltip, setTooltip] = useState(false);

  const features = {
    look: [rounded && 'rounded', ghost && 'ghost'].filter(Boolean).join(' '),
    leftIcon: leftIcon ? <Plus /> : undefined,
    rightIcon: rightIcon ? <ArrowRight /> : undefined,
    leftAddOn: leftAddOn ? <kbd>⌘</kbd> : undefined,
    rightAddOn: rightAddOn ? <kbd>N</kbd> : undefined,
    disableWhileLoading,
    // A reason replaces plain `disabled`: they can't be set together.
    ...(reason ? { disabledWithReason: 'Add a date first' } : { disabled }),
    ...(readOnlyReason
      ? { readOnlyWithReason: 'This event is archived' }
      : { readOnly }),
    ...(loadingReason
      ? { loadingWithReason: 'Saving the event' }
      : { loading }),
    tooltip: tooltip ? 'Creates a draft event' : undefined,
  };

  return (
    <StoryPage>
      <p className={`${caption} ${mutedText}`}>
        Hover, press or tab to a button to see its states.
      </p>

      <StorySection title="Variants">
        {variants.map((variant) => (
          <Row key={variant} label={variant}>
            <Button variant={variant}>Save</Button>
            <Button variant={variant} leftIcon={<Plus />}>
              New event
            </Button>
            <Button variant={variant} look="ghost">
              Ghost
            </Button>
            <Button variant={variant} loading>
              Saving
            </Button>
            <Button variant={variant} loadingWithReason="Saving the event">
              Loading with a reason
            </Button>
            <Button variant={variant} disabled>
              Disabled
            </Button>
            <Button variant={variant} disabledWithReason="Add a date first">
              Disabled with a reason
            </Button>
          </Row>
        ))}
      </StorySection>

      <StorySection title="Sizes">
        <Row label="sm (default), md">
          <Button size="sm" leftIcon={<Plus />}>
            New event
          </Button>
          <Button size="md" leftIcon={<Plus />}>
            New event
          </Button>
          <Button size="sm" look="rounded">
            Rounded
          </Button>
          <Button size="md" look="rounded">
            Rounded
          </Button>
        </Row>
      </StorySection>

      <StorySection title="Icons and add-ons">
        <Row label="An icon wins over an add-on on the same side">
          <Button leftIcon={<Plus />}>Left icon</Button>
          <Button rightIcon={<ArrowRight />}>Right icon</Button>
          <Button variant="base" leftAddOn={<kbd>⌘</kbd>}>
            Left add-on
          </Button>
          <Button variant="base" rightAddOn={<kbd>N</kbd>}>
            Right add-on
          </Button>
          <Button variant="base" rightIcon={<ArrowRight />} loading>
            Spinner on the right
          </Button>
        </Row>
      </StorySection>

      <StorySection title="IconButton">
        {variants.map((variant) => (
          <Row key={variant} label={variant}>
            {iconSizes.map((size) => (
              <IconButton
                key={size}
                variant={variant}
                size={size}
                tooltip={`Settings, ${size}`}
              >
                <Settings />
              </IconButton>
            ))}
            <IconButton variant={variant} loading tooltip="Refreshing">
              <Settings />
            </IconButton>
            <IconButton
              variant={variant}
              tooltip="Refreshing"
              loadingWithReason="Saving the event"
            >
              <Settings />
            </IconButton>
            <IconButton
              variant={variant}
              tooltip="Delete"
              disabledWithReason="Only owners can delete"
            >
              <Trash2 />
            </IconButton>
          </Row>
        ))}
      </StorySection>

      <StorySection title="As a link">
        <Row label="as={Link}, a link component that handles disabled">
          <Button as={StoryLink} href="#button" variant="base">
            Help center
          </Button>
          <IconButton as={StoryLink} href="#button" tooltip="Settings">
            <Settings />
          </IconButton>
          <Button
            as={StoryLink}
            href="#button"
            disabledWithReason="Not published yet"
          >
            Event page
          </Button>
        </Row>
      </StorySection>

      <StorySection title="PlainButton">
        <Row label="Button behavior on an element with its own look">
          <PlainButton tooltip="Opens the event">
            <div className={`${caption} ${mutedText}`}>Quarterly review</div>
          </PlainButton>
        </Row>
      </StorySection>

      <StorySection title="Features">
        <div className="flex-row-gap-4 flex-wrap">
          <Checkbox checked={rounded} onCheckedChange={setRounded}>
            Rounded
          </Checkbox>
          <Checkbox checked={ghost} onCheckedChange={setGhost}>
            Ghost
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
          <Checkbox checked={tooltip} onCheckedChange={setTooltip}>
            Tooltip
          </Checkbox>
        </div>
        {(['sm', 'md'] as const).map((size) => (
          <Row key={size} label={size}>
            {variants.map((variant) => (
              <Button key={variant} variant={variant} size={size} {...features}>
                New event
              </Button>
            ))}
          </Row>
        ))}
      </StorySection>
    </StoryPage>
  );
};

export const Overview: Story = { render: () => <ButtonStories /> };
