import React, { useState } from 'react';

import { StoryButton, StorySwitch } from '../StoryControls';
import { StoryPage, StorySection } from '../StoryLayout';
import { caption, mutedText } from '../StoryStyles.css';

import { Tooltip, type TooltipProps } from './Tooltip';

import type { Meta, StoryObj } from '@storybook/react-vite';

const sides: Array<NonNullable<TooltipProps['side']>> = [
  'top',
  'right',
  'bottom',
  'left',
];

const aligns: Array<NonNullable<TooltipProps['align']>> = [
  'start',
  'center',
  'end',
];

const meta = {
  title: 'UI/Tooltip',
  component: Tooltip,
  parameters: { controls: { disable: true } },
} satisfies Meta<typeof Tooltip>;

export default meta;
// The page renders its own triggers, so the story takes no args.
type Story = StoryObj;

const TooltipStories = () => {
  const [portal, setPortal] = useState(true);
  const [reason, setReason] = useState(true);

  return (
    <StoryPage>
      <p className={`${caption} ${mutedText}`}>
        Hover or focus a trigger to open its tooltip.
      </p>

      <StorySection title="Sides">
        <div className="flex-row-gap-4 flex-wrap">
          {sides.map((side) => (
            <Tooltip key={side} tooltip={`On the ${side}`} side={side}>
              <StoryButton>{side}</StoryButton>
            </Tooltip>
          ))}
        </div>
      </StorySection>

      <StorySection title="Align">
        <div className="flex-row-gap-4 flex-wrap">
          {aligns.map((align) => (
            <Tooltip
              key={align}
              tooltip={`Aligned to the ${align}`}
              align={align}
            >
              <StoryButton>A wider trigger, aligned {align}</StoryButton>
            </Tooltip>
          ))}
        </div>
      </StorySection>

      <StorySection title="Content">
        <div className="flex-row-gap-4 flex-wrap">
          <Tooltip tooltip="Saves a draft">
            <StoryButton>One line</StoryButton>
          </Tooltip>
          <Tooltip tooltip="Saves a draft of the event, so you can come back to it later and publish it when it's ready.">
            <StoryButton>Wraps at 280px</StoryButton>
          </Tooltip>
          <Tooltip tooltip="Supercalifragilisticexpialidocious-and-then-some-more-letters">
            <StoryButton>Long word</StoryButton>
          </Tooltip>
        </div>
      </StorySection>

      <StorySection title="Features">
        <div className="flex-row-gap-4 flex-wrap">
          <StorySwitch label="Portal" checked={portal} onChange={setPortal} />
          <StorySwitch
            label="Second entry"
            checked={reason}
            onChange={setReason}
          />
        </div>
        <Tooltip
          tooltip={['Saves a draft', reason && 'Offline: saved on this device']}
          portal={portal}
        >
          <StoryButton>Save</StoryButton>
        </Tooltip>
      </StorySection>
    </StoryPage>
  );
};

export const Overview: Story = { render: () => <TooltipStories /> };
