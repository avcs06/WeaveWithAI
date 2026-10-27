import React, { useState } from 'react';

import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { StoryPage, StorySection } from '../StoryLayout';
import { caption, mutedText } from '../StoryStyles.css';

import { Tooltip } from './Tooltip';

import type { TooltipProps } from './Tooltip.types';

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
              <Button variant="base">{side}</Button>
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
              <Button variant="base">A wider trigger, aligned {align}</Button>
            </Tooltip>
          ))}
        </div>
      </StorySection>

      <StorySection title="Content">
        <div className="flex-row-gap-4 flex-wrap">
          <Tooltip tooltip="Saves a draft">
            <Button variant="base">One line</Button>
          </Tooltip>
          <Tooltip tooltip="Saves a draft of the event, so you can come back to it later and publish it when it's ready.">
            <Button variant="base">Wraps at 280px</Button>
          </Tooltip>
          <Tooltip tooltip="Supercalifragilisticexpialidocious-and-then-some-more-letters">
            <Button variant="base">Long word</Button>
          </Tooltip>
        </div>
      </StorySection>

      <StorySection title="Features">
        <div className="flex-row-gap-4 flex-wrap">
          <Checkbox checked={reason} onCheckedChange={setReason}>
            Second entry
          </Checkbox>
        </div>
        <Tooltip
          tooltip={['Saves a draft', reason && 'Offline: saved on this device']}
        >
          <Button variant="base">Save</Button>
        </Tooltip>
      </StorySection>
    </StoryPage>
  );
};

export const Overview: Story = { render: () => <TooltipStories /> };
