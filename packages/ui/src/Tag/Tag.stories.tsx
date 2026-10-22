import { Info } from 'lucide-react';
import React, { useState } from 'react';

import { StorySwitch } from '../StoryControls';
import { StoryPage, StorySection } from '../StoryLayout';
import { caption, mutedText } from '../StoryStyles.css';

import { Tag } from './Tag';
import { tagRecipe } from './Tag.recipes.css';

import type { TagProps } from './Tag.types';

import type { Meta, StoryObj } from '@storybook/react-vite';

const variants = Object.keys(tagRecipe.classNames.variants.variant) as Array<
  NonNullable<TagProps['variant']>
>;
const sizes = Object.keys(tagRecipe.classNames.variants.size) as Array<
  NonNullable<TagProps['size']>
>;

const meta = {
  title: 'UI/Tag',
  component: Tag,
  parameters: { controls: { disable: true } },
} satisfies Meta<typeof Tag>;

export default meta;
// The page renders its own tags, so the story takes no args.
type Story = StoryObj;

const noop = () => undefined;

const TagStories = () => {
  const [bordered, setBordered] = useState(true);
  const [leftIcon, setLeftIcon] = useState(false);
  const [rightIcon, setRightIcon] = useState(false);
  const [leftAddOn, setLeftAddOn] = useState(false);
  const [rightAddOn, setRightAddOn] = useState(false);
  const [closable, setClosable] = useState(false);
  const [tooltip, setTooltip] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [reason, setReason] = useState(false);

  const features: Partial<TagProps> = {
    look: bordered ? 'bordered' : '!bordered',
    leftIcon: leftIcon ? <Info /> : undefined,
    rightIcon: rightIcon ? <Info /> : undefined,
    leftAddOn: leftAddOn ? <span>#</span> : undefined,
    rightAddOn: rightAddOn ? <span>12</span> : undefined,
    closable,
    onClose: noop,
    tooltip: tooltip ? 'Everyone who builds the product' : undefined,
    // A reason replaces plain `disabled`: they can't be set together.
    ...(reason ? { disabledWithReason: 'Teams are locked' } : { disabled }),
  };

  return (
    <StoryPage>
      <p className={`${caption} ${mutedText}`}>
        Hover a tag to see its tooltip, the full text of a cut label, or why
        it&apos;s disabled.
      </p>

      <StorySection title="Variants">
        {['bordered', '!bordered'].map((look) => (
          <div key={String(look)} className="flex-col-gap-2">
            <p className={`${caption} ${mutedText}`}>look="{look}"</p>
            <div className="flex-row-gap-2 flex-wrap">
              {variants.map((variant) => (
                <Tag key={variant} variant={variant} look={look}>
                  {variant}
                </Tag>
              ))}
            </div>
          </div>
        ))}
      </StorySection>

      <StorySection title="Sizes">
        {sizes.map((size) => (
          <div key={size} className="flex-row-gap-2 items-center flex-wrap">
            <Tag size={size}>Engineering</Tag>
            <Tag size={size} leftIcon={<Info />}>
              Left icon
            </Tag>
            <Tag size={size} rightIcon={<Info />}>
              Right icon
            </Tag>
            <Tag size={size} rightAddOn={<span>12</span>}>
              Right add-on
            </Tag>
            <Tag size={size} closable onClose={noop}>
              Closable
            </Tag>
            <Tag size={size} leftIcon={<Info />} closable onClose={noop}>
              Icon and close
            </Tag>
          </div>
        ))}
      </StorySection>

      <StorySection title="States">
        {variants.map((variant) => (
          <div key={variant} className="flex-row-gap-2 items-center flex-wrap">
            <Tag variant={variant}>Static</Tag>
            <Tag variant={variant} closable onClose={noop}>
              Closable
            </Tag>
            <Tag variant={variant} disabled closable onClose={noop}>
              Disabled
            </Tag>
            <Tag
              variant={variant}
              closable
              onClose={noop}
              disabledWithReason="Teams are locked"
            >
              Disabled with a reason
            </Tag>
          </div>
        ))}
      </StorySection>

      <StorySection title="Long label">
        <div style={{ width: 200 }} className="flex-col-gap-2 items-start">
          <Tag>Platform engineering and infrastructure</Tag>
          <Tag closable onClose={noop} tooltip="Everyone on the platform team">
            Platform engineering and infrastructure
          </Tag>
        </div>
      </StorySection>

      <StorySection title="Features">
        <div className="flex-row-gap-4 flex-wrap">
          <StorySwitch
            label="Bordered"
            checked={bordered}
            onChange={setBordered}
          />
          <StorySwitch
            label="Left icon"
            checked={leftIcon}
            onChange={setLeftIcon}
          />
          <StorySwitch
            label="Right icon"
            checked={rightIcon}
            onChange={setRightIcon}
          />
          <StorySwitch
            label="Left add-on"
            checked={leftAddOn}
            onChange={setLeftAddOn}
          />
          <StorySwitch
            label="Right add-on"
            checked={rightAddOn}
            onChange={setRightAddOn}
          />
          <StorySwitch
            label="Closable"
            checked={closable}
            onChange={setClosable}
          />
          <StorySwitch
            label="Tooltip"
            checked={tooltip}
            onChange={setTooltip}
          />
          <StorySwitch
            label="Disabled"
            checked={disabled}
            onChange={setDisabled}
          />
          <StorySwitch
            label="Disabled reason"
            checked={reason}
            onChange={setReason}
          />
        </div>
        {sizes.map((size) => (
          <div key={size} className="flex-row-gap-2 items-center flex-wrap">
            {variants.map((variant) => (
              <Tag key={variant} variant={variant} size={size} {...features}>
                Engineering
              </Tag>
            ))}
          </div>
        ))}
      </StorySection>
    </StoryPage>
  );
};

export const Overview: Story = { render: () => <TagStories /> };
